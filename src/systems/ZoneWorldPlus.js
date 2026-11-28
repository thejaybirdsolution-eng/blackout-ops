/* ============================================================================
   BLACKOUT OPS — ZoneWorldPlus (Survival World, Fort Sieges, Fast Travel,
   Pickups, Potions, Custom Structures, Black Market & Gated Contacts)
============================================================================ */
(function (BO) {
    'use strict';

    const SIGNPOSTS = [
        { id: 'sp_crash', name: 'Crash Valley Signpost', x: -6, z: 162, starter: true },
        { id: 'sp_relay', name: 'Relay Crossroads Signpost', x: 6, z: 108, starter: true },
        { id: 'sp_hollow', name: 'Hollow Square Signpost', x: -72, z: 96, starter: false },
        { id: 'sp_pine', name: 'Pinebreak Mill Signpost', x: -138, z: 44, starter: false },
        { id: 'sp_kessel', name: 'Kessel Rail Signpost', x: 94, z: 8, starter: false },
        { id: 'sp_spillway', name: 'Spillway Dam Signpost', x: 146, z: -54, starter: false },
        { id: 'sp_frost', name: 'Frostline Pass Signpost', x: -142, z: -138, starter: false },
        { id: 'sp_cinder', name: 'Cinder Ridge Signpost', x: 176, z: 68, starter: false }
    ];

    const FORTS = [
        {
            id: 'bastion',
            name: 'Fort Bastion',
            region: 'hollow',
            x: -54,
            z: 74,
            waveSize: 10,
            captain: 'iron_juggernaut',
            reward: { emerald_chip: 4, diamond_shard: 1, medkits: 2, xp_bottle: 1, ammo556: 36 },
            chestLoot: [
                { emerald_chip: 3, bread: 4, gilded_apple: 1, swiftness_draught: 2, ammo9: 40, planks: 8 },
                { ingot: 5, brick: 6, bandage: 4, regen_draught: 2, grappling_hook: 1, cropSeeds: 4 }
            ],
            defenders: [
                { role: 'Sergeant Hale', weapon: 'm4a1', dx: -3.2, dz: 3.4 },
                { role: 'Marksman Rourke', weapon: 'ak47', dx: 3.2, dz: 3.4 },
                { role: 'Vanguard Lin', weapon: 'mp5', dx: 0, dz: -3.2 }
            ]
        },
        {
            id: 'timberwatch',
            name: 'Fort Timberwatch',
            region: 'pine',
            x: -116,
            z: 18,
            waveSize: 11,
            captain: 'club_goliath',
            reward: { emerald_chip: 5, diamond_shard: 2, phase_pearl: 2, medkits: 2, ammo762: 32 },
            chestLoot: [
                { emerald_chip: 4, hunter_stew: 2, golden_carrot: 3, leaping_draught: 2, strength_draught: 2, spider_silk: 5 },
                { diamond_shard: 2, lapis_prism: 4, flux_dust: 5, tnt_charge: 2, ammo12: 24, leather: 4 }
            ],
            defenders: [
                { role: 'Ranger Captain Vane', weapon: 'ak47', dx: -3.4, dz: -3.0 },
                { role: 'Warden Senna', weapon: 'm4a1', dx: 3.4, dz: -3.0 },
                { role: 'Scout Jory', weapon: 'remington870', dx: 0, dz: 3.5 }
            ]
        },
        {
            id: 'ironhold',
            name: 'Fort Ironhold',
            region: 'kessel',
            x: 104,
            z: -66,
            waveSize: 12,
            captain: 'headless_charger',
            reward: { emerald_chip: 6, diamond_shard: 2, resurrection_idol: 1, xp_bottle: 2, abyssal_alloy: 1 },
            chestLoot: [
                { emerald_chip: 5, gilded_apple: 2, turtle_shell_brew: 2, fire_ward_draught: 2, ammo762: 45, circuit: 3 },
                { diamond_shard: 2, obsidian: 4, gold: 3, phase_pearl: 2, magnet_charm: 1, medkits: 3 }
            ],
            defenders: [
                { role: 'Commander Koslov', weapon: 'ak47', dx: -3.5, dz: 3.2 },
                { role: 'Heavy Gunner Briggs', weapon: 'm4a1', dx: 3.5, dz: 3.2 },
                { role: 'Tech Medic Sera', weapon: 'mp5', dx: 0, dz: -3.4 }
            ]
        }
    ];

    const BROKERS = [
        {
            id: 'bm_vex',
            name: 'Broker Vex',
            title: 'Roaming Black Market Syndicate',
            color: 0xa855f7,
            speed: 1.55,
            route: [[-32, 96], [-86, 68], [-74, 24], [-22, 52]],
            greeting: 'Keep your voice down. Syndicate stock rotates through the valley — emeralds, salvage, or gold, I deal in results.',
            sell: [
                { id: 's_scrap', name: 'Sell 6 Salvage', cost: { scrap: 6 }, gain: { emerald_chip: 2 } },
                { id: 's_gold', name: 'Sell 1 Gold Bar', cost: { gold: 1 }, gain: { emerald_chip: 2 } },
                { id: 's_pelt', name: 'Sell 3 Raw Hide', cost: { hide: 3 }, gain: { emerald_chip: 2 } },
                { id: 's_wheat', name: 'Sell 5 Golden Wheat', cost: { wheat: 5 }, gain: { emerald_chip: 2 } }
            ],
            buy: [
                { id: 'b_pearl', name: 'Phase Ender-Pearl ×2', cost: { emerald_chip: 2 }, gain: { phase_pearl: 2 }, rep: 0 },
                { id: 'b_xp', name: "Bottle o' Skilling ×2", cost: { emerald_chip: 2 }, gain: { xp_bottle: 2 }, rep: 0 },
                { id: 'b_diamond', name: 'Diamond Crystal', cost: { emerald_chip: 3 }, gain: { diamond_shard: 1 }, rep: 0 },
                { id: 'b_grapple', name: 'Grappling Launcher', cost: { emerald_chip: 4 }, gain: { grappling_hook: 1 }, rep: 0 },
                { id: 'b_totem', name: 'Totem of Undying', cost: { emerald_chip: 6 }, gain: { resurrection_idol: 1 }, rep: 2 },
                { id: 'b_abyssal', name: 'Abyssal Ingot', cost: { emerald_chip: 7 }, gain: { abyssal_alloy: 1 }, rep: 3 },
                { id: 'b_wpn_vec', name: 'Black-Market Vector SMG', cost: { emerald_chip: 5 }, weapon: 'mp5', rarity: 'epic', rep: 1 }
            ]
        },
        {
            id: 'bm_kael',
            name: 'Peddler Kael',
            title: 'Roaming Relic & Alchemy Broker',
            color: 0xf59e0b,
            speed: 1.48,
            route: [[38, 82], [88, 26], [66, -38], [16, 30]],
            greeting: 'Rare tonics, demolition blocks, and pre-collapse optics! Trade your spare minerals for emeralds right here.',
            sell: [
                { id: 'k_iron', name: 'Sell 4 Iron Ore', cost: { iron: 4 }, gain: { emerald_chip: 2 } },
                { id: 'k_quartz', name: 'Sell 3 Luminous Quartz', cost: { quartz: 3 }, gain: { emerald_chip: 2 } },
                { id: 'k_coal', name: 'Sell 5 Coal', cost: { coal: 5 }, gain: { emerald_chip: 2 } },
                { id: 'k_antler', name: 'Sell 2 Stag Antlers', cost: { antler: 2 }, gain: { emerald_chip: 3 } }
            ],
            buy: [
                { id: 'k_swift', name: 'Swiftness & Leaping Pack', cost: { emerald_chip: 2 }, gain: { swiftness_draught: 2, leaping_draught: 2 }, rep: 0 },
                { id: 'k_gapple', name: 'Golden Apple ×2', cost: { emerald_chip: 3 }, gain: { gilded_apple: 2 }, rep: 0 },
                { id: 'k_tnt', name: 'Demolition TNT ×3', cost: { emerald_chip: 3 }, gain: { tnt_charge: 3 }, rep: 0 },
                { id: 'k_magnet', name: 'Lodestone Magnet Charm', cost: { emerald_chip: 4 }, gain: { magnet_charm: 1 }, rep: 1 },
                { id: 'k_kits', name: 'Gunsmith Kit Bundle', cost: { emerald_chip: 4 }, gain: { optic_kit: 1, suppressor_kit: 1, mag_kit: 1 }, rep: 1 },
                { id: 'k_eapple', name: 'Enchanted Golden Apple', cost: { emerald_chip: 7 }, gain: { enchanted_apple: 1 }, rep: 2 },
                { id: 'k_wpn_ak', name: 'Gilded Syndicate AK-47', cost: { emerald_chip: 6 }, weapon: 'ak47', rarity: 'epic', rep: 2 }
            ]
        }
    ];

    const GATED_NPCS = [
        {
            id: 'gate_viper',
            name: 'Viper',
            title: 'Black-Ops Arms Smuggler',
            x: 76,
            z: 10,
            color: 0xef4444,
            reqLevel: 4,
            reqKills: 40,
            bribeCurrency: { emerald_chip: 4 },
            bribeItem: { gold: 3 },
            lockedQuote: 'Beat it, rookie. Come back when you reach Survivor Level 4, drop 40 hostiles, or slide me a bribe so I know you mean business.',
            openQuote: 'You earned a seat at the crate. Suppressed rifles, demolition blocks, zip-hooks, and live ammo — take your pick.',
            stock: [
                { id: 'v_ammo_pack', name: 'Heavy Ammo Crate', cost: { scrap: 4 }, gain: { ammo9: 36, ammo556: 36, ammo762: 24, ammo12: 16 } },
                { id: 'v_grapple', name: 'Grappling Launcher', cost: { ingot: 2, scrap: 3 }, gain: { grappling_hook: 1 } },
                { id: 'v_tnt', name: 'Demolition TNT ×3', cost: { powder: 2, scrap: 3 }, gain: { tnt_charge: 3 } },
                { id: 'v_supp', name: 'Suppressor & Optic Pair', cost: { emerald_chip: 3 }, gain: { suppressor_kit: 1, optic_kit: 1 } },
                { id: 'v_m4', name: 'Spec-Ops M4A1 Rifle', cost: { emerald_chip: 4, scrap: 4 }, weapon: 'm4a1', rarity: 'rare' }
            ]
        },
        {
            id: 'gate_morrow',
            name: 'Dr. Morrow',
            title: 'Arcane Field Alchemist',
            x: 48,
            z: -56,
            color: 0x38bdf8,
            reqLevel: 5,
            reqKills: 30,
            bribeCurrency: { emerald_chip: 3 },
            bribeItem: { quartz: 4 },
            lockedQuote: 'My alembic cannot be wasted on amateurs. Reach Level 5, prove 30 kills, or contribute 4 Luminous Quartz (or 3 Emeralds) to fund my research.',
            openQuote: 'Splendid! My distillation racks are yours — potions of speed, strength, regeneration, night-sight, and purified Phase Pearls.',
            stock: [
                { id: 'm_speed_leap', name: 'Swiftness & Leaping Brews', cost: { herbs: 2, glass: 1 }, gain: { swiftness_draught: 2, leaping_draught: 2 } },
                { id: 'm_str_reg', name: 'Strength & Regen Brews', cost: { emerald_chip: 2 }, gain: { strength_draught: 2, regen_draught: 2 } },
                { id: 'm_night_fire', name: 'Night-Sight & Fire-Ward', cost: { quartz: 2 }, gain: { night_vision_draught: 2, fire_ward_draught: 2 } },
                { id: 'm_milk_xp', name: "Milk Flask & Skilling Bottle", cost: { emerald_chip: 2 }, gain: { milk_flask: 2, xp_bottle: 2 } },
                { id: 'm_pearl', name: 'Phase Ender-Pearl ×3', cost: { emerald_chip: 3 }, gain: { phase_pearl: 3 } },
                { id: 'm_eapple', name: 'Enchanted Golden Apple', cost: { emerald_chip: 5, gold: 1 }, gain: { enchanted_apple: 1 } }
            ]
        },
        {
            id: 'gate_krag',
            name: 'Warlord Krag',
            title: 'Apex Abyssal Forgemaster',
            x: -86,
            z: -92,
            color: 0xfacc15,
            reqLevel: 7,
            reqKills: 80,
            reqBosses: 1,
            bribeCurrency: { emerald_chip: 6 },
            bribeItem: { obsidian: 2, gold: 2 },
            lockedQuote: 'Only Titan-slayers stand at my anvil! Reach Level 7, slay 80 enemies (or 1 Boss), or pay tribute in Emeralds or Obsidian & Gold.',
            openQuote: 'Your steel rings true! Behold Abyssal alloys, Totems of Undying, Diamond tools, and beacons that summon the Five Super Bosses!',
            stock: [
                { id: 'kr_abyssal', name: 'Abyssal Ingot', cost: { emerald_chip: 5, ingot: 2 }, gain: { abyssal_alloy: 1 } },
                { id: 'kr_totem', name: 'Totem of Undying', cost: { emerald_chip: 5, gold: 1 }, gain: { resurrection_idol: 1 } },
                { id: 'kr_beacon', name: 'Apex Titan Beacon', cost: { emerald_chip: 4, obsidian: 1 }, gain: { super_boss_beacon: 1 } },
                { id: 'kr_diamonds', name: 'Diamond Crystal ×3', cost: { emerald_chip: 5 }, gain: { diamond_shard: 3 } },
                { id: 'kr_armor', name: 'Abyssal Trauma Rig', cost: { abyssal_alloy: 1, emerald_chip: 6 }, gain: { abyssal_armor: 1 } },
                { id: 'kr_legend', name: 'Legendary Apex LMG / Rifle', cost: { emerald_chip: 8 }, weapon: 'ak47', rarity: 'legendary' }
            ]
        }
    ];

    const CHEST_SPECS = {
        chest: { slots: 18, weight: 54, label: 'Storage Chest' },
        supplyCrate: { slots: 24, weight: 85, label: 'Reinforced Supply Crate' },
        ironVault: { slots: 36, weight: 150, label: 'Armoured Iron Locker' },
        quantumChest: { slots: 30, weight: 120, label: 'Quantum Ender-Chest (Shared)' },
        fortChest: { slots: 32, weight: 120, label: 'Survivor Fort Armory Chest' }
    };

    const SUPER_BOSS_IDS = [
        'super_titan_colossus',
        'super_seraph_harbinger',
        'super_hydra_behemoth',
        'super_dreadnought_mech',
        'super_void_sovereign'
    ];

    function safeGroundPos(x, z) {
        const Z = BO.Zone;
        let bx = x, bz = z;
        for (let r = 0; r <= 18; r += 3) {
            for (let a = 0; a < 8; a++) {
                const ang = (a / 8) * Math.PI * 2;
                const tx = r === 0 ? x : x + Math.cos(ang) * r;
                const tz = r === 0 ? z : z + Math.sin(ang) * r;
                const h = BO.World.terrainHeight(tx, tz);
                if (Z?.inReservoir?.(tx, tz) && h < (Z.WATER || 0) + 0.4) continue;
                const hitPoi = Z?.pois?.some((p) => p.w && Math.abs(tx - p.x) < p.w / 2 + 4 && Math.abs(tz - p.z) < p.d / 2 + 4);
                if (!hitPoi) return { x: tx, y: h, z: tz };
            }
        }
        return { x: bx, y: BO.World.terrainHeight(bx, bz), z: bz };
    }

    class ZoneWorldPlus {
        constructor() {
            this.mode = null;
            this.active = false;
            this.signposts = [];
            this.unlockedSignposts = new Set();
            this.forts = new Map();
            this.activeSiege = null;
            this.nextSiegeAt = 165;
            this.brokers = [];
            this.brokerRep = {};
            this.gatedNpcs = new Map();
            this.unlockedGates = new Set();
            this.pickups = [];
            this.primedTnt = [];
            this.buffs = {};
            this.regenTick = 0;
            this.hopperTick = 0;
            this.grappleCd = 0;
            this.superBossIndex = 0;
            this.ownedGroups = [];
        }

        /* ================================================================ LIFECYCLE */
        start(mode, saved = null) {
            this.stop();
            this.mode = mode;
            this.active = true;
            if (this.pendingGroups?.length) {
                this.ownedGroups.push(...this.pendingGroups);
                this.pendingGroups = [];
            }
            this.unlockedSignposts = new Set(SIGNPOSTS.filter((s) => s.starter).map((s) => s.id));
            this.unlockedGates = new Set();
            this.brokerRep = { bm_vex: 0, bm_kael: 0 };
            this.buffs = {};
            this.regenTick = 0;
            this.hopperTick = 0;
            this.grappleCd = 0;
            this.activeSiege = null;
            this.nextSiegeAt = (mode.openingSeconds || 25) + 95;

            const pack = mode.campaign?.pack;
            if (pack && !pack.chests.has('quantum:stash')) {
                pack.chests.set('quantum:stash', {});
            }

            if (saved) {
                for (const id of saved.signposts || []) this.unlockedSignposts.add(id);
                for (const id of saved.gates || []) this.unlockedGates.add(id);
                if (saved.brokerRep) Object.assign(this.brokerRep, saved.brokerRep);
                if (saved.buffs) this.buffs = { ...saved.buffs };
                if (Number.isFinite(saved.superBossIndex)) this.superBossIndex = saved.superBossIndex;
            }

            this._buildSignposts();
            this._buildForts(saved?.forts || {});
            this._buildBrokers();
            this._buildGatedNpcs();
            this._scatterStarterPickups();
        }

        stop() {
            this.active = false;
            for (const g of this.ownedGroups) {
                g.removeFromParent();
                g.traverse?.((c) => {
                    if (c.geometry && !c.geometry.userData?.sharedAsset && !c.userData?.sharedGeometry) c.geometry.dispose?.();
                    if (Array.isArray(c.material)) c.material.forEach((m) => { if (m && !m.userData?.sharedAsset) m.dispose?.(); });
                    else if (c.material && !c.material.userData?.sharedAsset) c.material.dispose?.();
                });
            }
            this.ownedGroups.length = 0;
            for (const pk of this.pickups) {
                pk.group?.removeFromParent();
            }
            this.pickups.length = 0;
            for (const t of this.primedTnt) {
                t.group?.removeFromParent();
            }
            this.primedTnt.length = 0;
            this.signposts.length = 0;
            this.forts.clear();
            this.brokers.length = 0;
            this.gatedNpcs.clear();
            this.activeSiege = null;
            this.mode = null;
        }

        snapshot() {
            const forts = {};
            for (const [id, f] of this.forts) {
                forts[id] = {
                    liberated: !!f.liberated,
                    defenders: f.defenders.map((d) => ({ hp: Math.round(d.hp), alive: d.alive }))
                };
            }
            return {
                signposts: [...this.unlockedSignposts],
                gates: [...this.unlockedGates],
                brokerRep: { ...this.brokerRep },
                buffs: { ...this.buffs },
                superBossIndex: this.superBossIndex,
                forts
            };
        }

        _trackGroup(group) {
            // Restoring a checkpoint decorates built pieces before this system starts (and start()
            // clears ownedGroups). Park those groups and adopt them once start() has run.
            if (!this.active) {
                (BO.SurvivalMode?.scene || this.mode?.scene)?.add(group);
                (this.pendingGroups = this.pendingGroups || []).push(group);
                return group;
            }
            this.mode.scene.add(group);
            this.ownedGroups.push(group);
            return group;
        }

        /* ================================================================ 1. FAST TRAVEL SIGNPOSTS */
        _buildSignposts() {
            const m = this.mode;
            for (const spec of SIGNPOSTS) {
                const pos = safeGroundPos(spec.x, spec.z);
                const g = new THREE.Group();
                g.position.set(pos.x, pos.y, pos.z);
                const postMat = new THREE.MeshStandardMaterial({ color: 0x6b4c30, roughness: 0.85 });
                const boardMat = new THREE.MeshStandardMaterial({ color: 0x9c7248, roughness: 0.75 });
                const lanternMat = new THREE.MeshStandardMaterial({
                    color: 0x8fe3c8,
                    emissive: this.unlockedSignposts.has(spec.id) ? 0x34d399 : 0xf59e0b,
                    emissiveIntensity: 0.85
                });
                const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.55, 8), postMat);
                post.position.y = 1.27;
                const cap = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.24, 6), postMat);
                cap.position.y = 2.62;
                const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.22, 0.08), boardMat);
                b1.position.set(0.22, 2.15, 0);
                b1.rotation.y = 0.25;
                const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.20, 0.08), boardMat);
                b2.position.set(-0.18, 1.82, 0.06);
                b2.rotation.y = -0.55;
                const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), lanternMat);
                lamp.position.set(0, 2.92, 0);
                g.add(post, cap, b1, b2, lamp);
                this._trackGroup(g);

                const marker = {
                    id: 'signpost:' + spec.id,
                    signpostId: spec.id,
                    name: spec.name,
                    x: pos.x,
                    y: pos.y,
                    z: pos.z,
                    reach: 3.3,
                    alive: true,
                    label: this.unlockedSignposts.has(spec.id) ? 'Fast travel signpost [E]' : 'Attune signpost & fast travel [E]'
                };
                m.markers.push(marker);
                this.signposts.push({ ...spec, x: pos.x, y: pos.y, z: pos.z, group: g, lampMat: lanternMat, marker });
            }
        }

        isNearSignpost(x, z) {
            for (const sp of this.signposts) {
                if (Math.hypot(sp.x - x, sp.z - z) <= 9.5) return true;
            }
            for (const f of this.forts.values()) {
                if (f.liberated && Math.hypot(f.x - x, f.z - z) <= 12) return true;
            }
            for (const p of this.mode?.campaign?.placed || []) {
                if (p.alive && p.type === 'waystone' && Math.hypot(p.x - x, p.z - z) <= 9.5) return true;
            }
            return false;
        }

        travelPoints() {
            const out = [];
            for (const sp of this.signposts) {
                if (this.unlockedSignposts.has(sp.id)) {
                    out.push({ id: 'sp:' + sp.id, name: sp.name, x: sp.x + 1.4, y: sp.y, z: sp.z + 1.4, kind: 'Signpost', instant: true });
                }
            }
            for (const f of this.forts.values()) {
                if (f.liberated) {
                    out.push({ id: 'fort:' + f.id, name: f.name, x: f.x, y: f.y, z: f.z + 2.2, kind: 'Fort', instant: false });
                }
            }
            for (const p of this.mode?.campaign?.placed || []) {
                if (p.alive && p.type === 'waystone') {
                    out.push({ id: 'waystone:' + p.id, name: 'Waystone #' + (Number(p.id) + 1), x: p.x + 1.1, y: p.y, z: p.z, kind: 'Waystone', instant: true });
                }
            }
            return out;
        }

        /* ================================================================ 2. SURVIVOR FORTS & SIEGE DEFENSE */
        _buildForts(savedForts) {
            const m = this.mode;
            const pack = m.campaign.pack;
            const R = 7.4;

            for (const spec of FORTS) {
                const center = safeGroundPos(spec.x, spec.z);
                const fy = center.y;
                const g = new THREE.Group();
                g.position.set(center.x, fy, center.z);

                const timberMat = BO.Textures?.getWorldMaterial ? BO.Textures.getWorldMaterial('wood_fort', 6, 3) : new THREE.MeshStandardMaterial({ color: 0x6f4e32, roughness: 0.85 });
                const stoneMat = BO.Textures?.getWorldMaterial ? BO.Textures.getWorldMaterial('castle_stone', 6, 2) : new THREE.MeshStandardMaterial({ color: 0x687078, roughness: 0.88 });
                const deckMat = BO.Textures?.getWorldMaterial ? BO.Textures.getWorldMaterial('wood_plank', 8, 8) : new THREE.MeshStandardMaterial({ color: 0x8a6440, roughness: 0.8 });

                const colliders = [];
                const addFortSolid = (lx, ly, lz, w, h, d, mat) => {
                    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
                    mesh.position.set(lx, ly, lz);
                    mesh.castShadow = mesh.receiveShadow = true;
                    g.add(mesh);
                    const wx = center.x + lx, wy = fy + ly, wz = center.z + lz;
                    const col = {
                        minX: wx - w / 2, maxX: wx + w / 2,
                        minY: wy - h / 2, maxY: wy + h / 2,
                        minZ: wz - d / 2, maxZ: wz + d / 2,
                        active: true
                    };
                    BO.World.colliders.push(col);
                    BO.World.worldMeshes.push(mesh);
                    BO.World.notifyColliderChanged?.(col);
                    colliders.push({ mesh, col });
                    return mesh;
                };

                // Palisade perimeter with south gate opening (+Z) and north sally gap (-Z)
                addFortSolid(-R, 1.55, 0, 0.55, 3.1, R * 2, timberMat);
                addFortSolid(R, 1.55, 0, 0.55, 3.1, R * 2, timberMat);
                addFortSolid(-4.4, 1.55, -R, 5.8, 3.1, 0.55, timberMat);
                addFortSolid(4.4, 1.55, -R, 5.8, 3.1, 0.55, timberMat);
                addFortSolid(-4.6, 1.55, R, 5.4, 3.1, 0.55, stoneMat);
                addFortSolid(4.6, 1.55, R, 5.4, 3.1, 0.55, stoneMat);
                // Gatehouse lintel overhead
                addFortSolid(0, 3.35, R, 4.2, 0.55, 0.75, stoneMat);

                // Corner bastion pillars
                for (const [cx, cz] of [[-R, -R], [R, -R], [-R, R], [R, R]]) {
                    addFortSolid(cx, 1.9, cz, 1.15, 3.8, 1.15, stoneMat);
                }

                // Elevated interior sniper watchtower in NW corner + walkable stairs!
                addFortSolid(-4.3, 2.35, -4.3, 3.2, 0.28, 3.2, deckMat);
                for (let s = 0; s < 4; s++) {
                    addFortSolid(-1.9 + s * 0.65, 0.30 + s * 0.58, -4.3, 0.72, 0.60, 1.5, deckMat);
                }

                // Central warming brazier + beacon mast
                const brazier = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.42, 0.65, 10), stoneMat);
                brazier.position.set(0, 0.33, 0);
                const flame = new THREE.Mesh(
                    new THREE.ConeGeometry(0.36, 0.65, 8),
                    new THREE.MeshStandardMaterial({ color: 0xff8a2b, emissive: 0xff5500, emissiveIntensity: 1.2 })
                );
                flame.position.set(0, 0.82, 0);
                const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.8, 8), stoneMat);
                mast.position.set(2.8, 2.4, -2.8);
                const beaconMat = new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xf97316, emissiveIntensity: 1.1 });
                const beaconOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), beaconMat);
                beaconOrb.position.set(2.8, 5.0, -2.8);
                g.add(brazier, flame, mast, beaconOrb);

                // Workbench & Chest props inside courtyard
                const benchMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.88, 0.85), deckMat);
                benchMesh.position.set(4.5, 0.44, -2.2);
                g.add(benchMesh);

                const chestPositions = [[-4.6, 0.42, 2.4], [4.6, 0.42, 2.4]];
                const chestKeys = [`fort:${spec.id}:0`, `fort:${spec.id}:1`];
                const chestMarkers = [];
                chestPositions.forEach(([cx, cy, cz], idx) => {
                    const cKey = chestKeys[idx];
                    if (!pack.chests.has(cKey)) {
                        pack.chests.set(cKey, { ...(spec.chestLoot[idx] || {}) });
                    }
                    const cMesh = new THREE.Mesh(
                        new THREE.BoxGeometry(1.28, 0.78, 0.84),
                        new THREE.MeshStandardMaterial({ color: 0x5c442c, roughness: 0.72, metalness: 0.25 })
                    );
                    cMesh.position.set(cx, cy, cz);
                    const trim = new THREE.Mesh(
                        new THREE.BoxGeometry(1.32, 0.12, 0.88),
                        new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.7, roughness: 0.3 })
                    );
                    trim.position.set(cx, cy + 0.26, cz);
                    g.add(cMesh, trim);
                    const mk = {
                        id: 'fortchest:' + cKey,
                        chestKey: cKey,
                        fortId: spec.id,
                        name: spec.name + ' Armory Chest',
                        x: center.x + cx,
                        y: fy,
                        z: center.z + cz,
                        reach: 3.1,
                        alive: true,
                        label: 'Locked — Clear Fort Siege to access'
                    };
                    m.markers.push(mk);
                    chestMarkers.push(mk);
                });

                const gateMarker = {
                    id: 'fortgate:' + spec.id,
                    fortId: spec.id,
                    name: spec.name,
                    x: center.x,
                    y: fy,
                    z: center.z + R + 0.6,
                    reach: 3.8,
                    alive: true,
                    label: 'Answer ' + spec.name + ' Distress Rally [E]'
                };
                m.markers.push(gateMarker);

                const benchMarker = {
                    id: 'fortbench:' + spec.id,
                    fortId: spec.id,
                    name: spec.name + ' Workbench',
                    x: center.x + 4.5,
                    y: fy,
                    z: center.z - 2.2,
                    reach: 3.2,
                    alive: true,
                    label: 'Use Fort Workbench [E]'
                };
                m.markers.push(benchMarker);

                this._trackGroup(g);

                const fortState = {
                    ...spec,
                    x: center.x,
                    y: fy,
                    z: center.z,
                    radius: R,
                    group: g,
                    beaconMat,
                    gateMarker,
                    chestMarkers,
                    chestKeys,
                    colliders,
                    liberated: false,
                    defenders: []
                };
                this.forts.set(spec.id, fortState);

                if (savedForts[spec.id]?.liberated) {
                    this._liberateFort(fortState, true, savedForts[spec.id].defenders);
                }
            }
        }

        isInsideUnlockedFort(x, z) {
            for (const f of this.forts.values()) {
                if (f.liberated && Math.hypot(x - f.x, z - f.z) < 22) return true;
            }
            return false;
        }

        startFortSiege(fortId = null, announce = true) {
            if (!this.active || this.activeSiege) return false;
            const candidates = [...this.forts.values()].filter((f) => !f.liberated);
            if (!candidates.length) return false;
            const p = BO.Player.pos;
            const fort = fortId
                ? this.forts.get(fortId)
                : candidates.sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0];
            if (!fort || fort.liberated) return false;

            const enemies = [];
            const count = fort.waveSize || 10;
            for (let i = 0; i < count; i++) {
                const ang = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
                const dist = fort.radius + 5.5 + (i % 3) * 2.6;
                const sx = fort.x + Math.cos(ang) * dist;
                const sz = fort.z + Math.sin(ang) * dist;
                const sy = BO.World.getGroundHeight(sx, sz, fort.y + 4);
                const specId = i === 0 ? fort.captain : null;
                const z = this.mode.spawnInfected(sx, sy, sz, 'normal', specId, true);
                if (z) {
                    z.fortSiege = fort.id;
                    if (i === 0) {
                        z.hp = Math.round(z.hp * 1.65);
                        z.maxHp = z.hp;
                        z.bossLabel = fort.name + ' Siege Captain';
                    }
                    if (z.zs) {
                        z.zs.state = 'hunt';
                        z.zs.seen = this.mode.clock;
                    }
                    enemies.push(z);
                }
            }
            if (!enemies.length) return false;

            this.activeSiege = { fortId: fort.id, enemies, startedAt: this.mode.clock };
            fort.beaconMat.color.setHex(0xef4444);
            fort.beaconMat.emissive.setHex(0xef4444);
            fort.gateMarker.label = 'Siege in progress — Clear all attackers!';

            if (announce) {
                BO.Sound?.playRoundStart?.(2);
                BO.Events.emit('hud:banner', {
                    title: '⚠ FORT SIEGE: ' + fort.name.toUpperCase(),
                    sub: 'DEFEAT ALL ' + enemies.length + ' HORDE ATTACKERS TO UNLOCK FORT CHESTS, FAST TRAVEL & DEFENDERS!',
                    color: '#fb7185'
                });
            }
            this.mode.refreshTargets();
            return true;
        }

        _liberateFort(fort, silent = false, savedDefs = null) {
            if (!fort || fort.liberated) return;
            fort.liberated = true;
            fort.beaconMat.color.setHex(0x34d399);
            fort.beaconMat.emissive.setHex(0x34d399);
            fort.gateMarker.label = fort.name + ' Fast Travel Beacon [E]';
            for (const mk of fort.chestMarkers) {
                mk.label = 'Open ' + fort.name + ' Armory Chest [E]';
            }

            // Spawn persistent patrolling, shooting, aggro-drawing Fort Defender NPCs with 3D HP bars!
            fort.defenders.length = 0;
            fort.defendersSpec = fort.defendersSpec || FORTS.find((x) => x.id === fort.id)?.defenders || [];
            fort.defendersSpec.forEach((dSpec, idx) => {
                const wx = fort.x + dSpec.dx;
                const wz = fort.z + dSpec.dz;
                const wy = BO.World.getGroundHeight(wx, wz, fort.y + 3);
                const rig = BO.CharacterMesh.buildSoldier(0, { weaponId: dSpec.weapon || 'm4a1' });
                rig.root.position.set(wx, wy, wz);
                rig.root.scale.set(0.92, 0.95, 0.92);

                // Overhead 3D HP bar
                const hpGroup = new THREE.Group();
                hpGroup.position.set(0, 2.18, 0);
                const bg = new THREE.Mesh(
                    new THREE.PlaneGeometry(0.86, 0.11),
                    new THREE.MeshBasicMaterial({ color: 0x091016, side: THREE.DoubleSide })
                );
                const fgMat = new THREE.MeshBasicMaterial({ color: 0x4ade80, side: THREE.DoubleSide });
                const fg = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.075), fgMat);
                fg.position.z = 0.008;
                hpGroup.add(bg, fg);
                rig.root.add(hpGroup);
                this._trackGroup(rig.root);

                const maxHp = 180;
                const savedHp = savedDefs?.[idx]?.hp;
                const def = {
                    id: `${fort.id}_def_${idx}`,
                    fortId: fort.id,
                    name: dSpec.role,
                    weaponId: dSpec.weapon || 'm4a1',
                    rig,
                    hpGroup,
                    hpBar: fg,
                    hpMat: fgMat,
                    pos: rig.root.position,
                    homeX: wx,
                    homeZ: wz,
                    patrolPhase: idx * 2.1,
                    hp: Number.isFinite(savedHp) && savedHp > 0 ? Math.min(maxHp, savedHp) : maxHp,
                    maxHp,
                    alive: savedDefs?.[idx]?.alive !== false,
                    recoverTimer: 0,
                    fireCd: 0.2 + idx * 0.18,
                    walkPhase: 0,
                    marker: {
                        id: `fortdef:${fort.id}:${idx}`,
                        fortId: fort.id,
                        defIdx: idx,
                        name: dSpec.role,
                        x: wx,
                        y: wy,
                        z: wz,
                        reach: 2.8,
                        alive: true,
                        label: 'Talk / Heal ' + dSpec.role + ' [E]'
                    }
                };
                this.mode.markers.push(def.marker);
                fort.defenders.push(def);
            });

            if (!silent) {
                this.mode.grant(fort.reward);
                this.mode.campaign?.mark('fortsLiberated', 1, 250);
                BO.Sound?.playPerkBuy?.();
                BO.Events.emit('hud:banner', {
                    title: '🏰 ' + fort.name.toUpperCase() + ' LIBERATED!',
                    sub: 'ARMORY CHESTS, FAST TRAVEL & PATROLLING GARRISON DEFENDERS UNLOCKED!',
                    color: '#34d399'
                });
            }
        }

        /** Called by SurvivalMode.updateFactions so Fort Defenders draw enemy aggro when the player is near! */
        targetForZombie(z) {
            if (!this.active || !z?.alive) return null;
            const p = BO.Player.pos;

            // Siege attackers push into their target fort until player or defender intercepts them
            if (z.fortSiege) {
                const sf = this.forts.get(z.fortSiege);
                if (sf && !sf.liberated && p.distanceTo(z.pos) > 12) {
                    return { x: sf.x, y: sf.y, z: sf.z, attackRange: 1.8, forceDirect: true };
                }
            }

            let bestDef = null;
            let bestDist = Infinity;
            for (const f of this.forts.values()) {
                if (!f.liberated) continue;
                const playerNearFort = Math.hypot(p.x - f.x, p.z - f.z) <= 52;
                const zombieNearFort = Math.hypot(z.pos.x - f.x, z.pos.z - f.z) <= 30;
                if (!playerNearFort && !zombieNearFort) continue;
                for (const d of f.defenders) {
                    if (!d.alive) continue;
                    const dist = z.pos.distanceTo(d.pos);
                    if (dist < 26 && dist < bestDist) {
                        // Draw aggro onto defender when player is near fort and defender is closer (or within 16m)
                        if (dist <= p.distanceTo(z.pos) + 6 || dist < 14) {
                            bestDist = dist;
                            bestDef = d;
                        }
                    }
                }
            }
            if (!bestDef) return null;
            return {
                x: bestDef.pos.x,
                y: bestDef.pos.y,
                z: bestDef.pos.z,
                fortDefender: bestDef,
                attackRange: 1.75,
                forceDirect: true
            };
        }

        damageDefender(def, amount) {
            if (!def || !def.alive) return;
            def.hp = Math.max(0, def.hp - amount * 0.72);
            if (def.hp <= 0) {
                def.alive = false;
                def.recoverTimer = 38;
                def.rig.root.visible = false;
                def.marker.label = def.name + ' (Recovering...)';
                this.mode.toast(def.name + ' was knocked down — recovering at the fort infirmary!');
            }
        }

        _updateForts(dt) {
            const m = this.mode;
            const p = BO.Player.pos;

            // Trigger siege randomly on timer OR when player walks near an unclaimed fort after hostiles release
            if (!this.activeSiege && m.hostilesReleased) {
                if (m.clock >= this.nextSiegeAt) {
                    this.nextSiegeAt = m.clock + 185;
                    this.startFortSiege(null, true);
                } else {
                    for (const f of this.forts.values()) {
                        if (!f.liberated && Math.hypot(p.x - f.x, p.z - f.z) < 25) {
                            this.startFortSiege(f.id, true);
                            break;
                        }
                    }
                }
            }

            if (this.activeSiege) {
                const fort = this.forts.get(this.activeSiege.fortId);
                this.activeSiege.enemies = this.activeSiege.enemies.filter((z) => z && z.alive);
                if (this.activeSiege.enemies.length === 0) {
                    const doneFort = fort;
                    this.activeSiege = null;
                    this.nextSiegeAt = m.clock + 190;
                    if (doneFort) this._liberateFort(doneFort, false);
                }
            }

            const cam = BO.App?.worldCamera;
            const infected = m.zombies.filter((z) => z.alive);

            for (const f of this.forts.values()) {
                if (!f.liberated) continue;
                const nearPlayer = Math.hypot(p.x - f.x, p.z - f.z) < 95;
                for (const d of f.defenders) {
                    if (!d.alive) {
                        d.recoverTimer -= dt;
                        if (d.recoverTimer <= 0) {
                            d.alive = true;
                            d.hp = Math.round(d.maxHp * 0.85);
                            d.rig.root.visible = nearPlayer;
                            d.marker.label = 'Talk / Heal ' + d.name + ' [E]';
                        }
                        continue;
                    }
                    d.rig.root.visible = nearPlayer;
                    if (!nearPlayer) continue;

                    // Patrol around fort perimeter/courtyard
                    d.patrolPhase += dt * 0.55;
                    const tx = d.homeX + Math.cos(d.patrolPhase) * 2.6;
                    const tz = d.homeZ + Math.sin(d.patrolPhase * 0.85) * 2.6;
                    const dx = tx - d.pos.x;
                    const dz = tz - d.pos.z;
                    const dist = Math.hypot(dx, dz);
                    let speed = 0;
                    if (dist > 0.12) {
                        const step = Math.min(dist, 1.85 * dt);
                        speed = step / Math.max(1e-4, dt);
                        d.pos.x += (dx / dist) * step;
                        d.pos.z += (dz / dist) * step;
                        d.pos.y = BO.World.getGroundHeight(d.pos.x, d.pos.z, f.y + 2.5);
                        d.walkPhase += dt * 7;
                    }
                    d.marker.x = d.pos.x;
                    d.marker.y = d.pos.y;
                    d.marker.z = d.pos.z;

                    // Update 3D overhead HP bar
                    const frac = BO.Math.clamp(d.hp / d.maxHp, 0.02, 1);
                    d.hpBar.scale.x = frac;
                    d.hpBar.position.x = -(1 - frac) * 0.41;
                    d.hpMat.color.setHex(frac > 0.55 ? 0x4ade80 : frac > 0.28 ? 0xfacc15 : 0xf87171);
                    if (cam) d.hpGroup.lookAt(cam.position);

                    // Target & shoot nearby zombies!
                    d.fireCd -= dt;
                    d.aimT = Math.max(0, (d.aimT || 0) - dt);
                    let bestZ = null;
                    let bestZDist = 32;
                    for (const z of infected) {
                        const zd = d.pos.distanceTo(z.pos);
                        if (zd < bestZDist && BO.World.hasLineOfSight(d.pos.x, d.pos.y + 1.4, d.pos.z, z.pos.x, z.pos.y + 1.0, z.pos.z)) {
                            bestZDist = zd;
                            bestZ = z;
                        }
                    }
                    let fired = false;
                    if (bestZ) {
                        d.rig.root.rotation.y = Math.atan2(bestZ.pos.x - d.pos.x, bestZ.pos.z - d.pos.z);
                        if (d.fireCd <= 0) {
                            d.fireCd = 0.56;
                            d.aimT = 0.9;
                            fired = true;
                            const muzzle = d.pos.clone().add(new THREE.Vector3(0, 1.38, 0));
                            const hitPt = bestZ.pos.clone().add(new THREE.Vector3(0, 1.0, 0));
                            BO.FX.spawnTracer(muzzle, hitPt, 0x60a5fa);
                            BO.FX.spawnParticles(muzzle, 3, 0xfde047, 2.2, 1, 0.12);
                            m.hit(bestZ, 40, 'torso', null, 'bullet', d);
                        }
                    } else if (dist > 0.12) {
                        d.rig.root.rotation.y = Math.atan2(dx, dz);
                    }
                    BO.CharacterMesh.animateSoldier(d.rig, { speed, phase: d.walkPhase, aim: (bestZ || d.aimT > 0) ? 1 : 0.25, recoil: fired ? 1 : 0 }, dt);
                }
            }
        }

        /* ================================================================ 3. ROAMING BLACK MARKET & GATED NPCS */
        _buildBrokers() {
            const m = this.mode;
            for (const spec of BROKERS) {
                const start = safeGroundPos(spec.route[0][0], spec.route[0][1]);
                const rig = BO.CharacterMesh.buildSoldier(1, { weaponId: 'mp5' });
                rig.root.position.set(start.x, start.y, start.z);
                rig.root.scale.set(0.92, 0.96, 0.92);

                const lantern = new THREE.Mesh(
                    new THREE.OctahedronGeometry(0.20),
                    new THREE.MeshStandardMaterial({ color: spec.color, emissive: spec.color, emissiveIntensity: 1.25 })
                );
                lantern.position.set(0, 2.22, 0);
                rig.root.add(lantern);
                this._trackGroup(rig.root);

                const marker = {
                    id: 'npc:' + spec.id,
                    name: spec.name,
                    x: start.x,
                    y: start.y,
                    z: start.z,
                    reach: 3.4,
                    alive: true,
                    label: 'Trade with ' + spec.name + ' (Black Market) [E]'
                };
                m.markers.push(marker);
                this.brokers.push({
                    ...spec,
                    rig,
                    lantern,
                    pos: rig.root.position,
                    wpIndex: 1,
                    walkPhase: 0,
                    marker
                });
            }
        }

        _buildGatedNpcs() {
            const m = this.mode;
            for (const spec of GATED_NPCS) {
                const pos = safeGroundPos(spec.x, spec.z);
                const rig = BO.CharacterMesh.buildSoldier(0, { weaponId: 'ak47' });
                rig.root.position.set(pos.x, pos.y, pos.z);
                rig.root.scale.set(0.94, 0.97, 0.94);

                const crest = new THREE.Mesh(
                    new THREE.OctahedronGeometry(0.18),
                    new THREE.MeshStandardMaterial({ color: spec.color, emissive: spec.color, emissiveIntensity: 1.0 })
                );
                crest.position.set(0, 2.18, 0);
                rig.root.add(crest);
                this._trackGroup(rig.root);

                const marker = {
                    id: 'npc:' + spec.id,
                    name: spec.name,
                    x: pos.x,
                    y: pos.y,
                    z: pos.z,
                    reach: 3.3,
                    alive: true,
                    label: 'Speak to ' + spec.name + ' (' + spec.title + ') [E]'
                };
                m.markers.push(marker);
                this.gatedNpcs.set(spec.id, { ...spec, x: pos.x, y: pos.y, z: pos.z, rig, crest, marker });
            }
        }

        _updateBrokers(dt) {
            const p = BO.Player.pos;
            for (const b of this.brokers) {
                const nearPlayer = p.distanceTo(b.pos) < 3.8;
                b.rig.root.visible = p.distanceTo(b.pos) < 95;
                b.lantern.rotation.y += dt * 2.2;
                let speed = 0;
                if (!nearPlayer) {
                    const [wx, wz] = b.route[b.wpIndex];
                    const dx = wx - b.pos.x;
                    const dz = wz - b.pos.z;
                    const dist = Math.hypot(dx, dz);
                    if (dist < 2.2) {
                        b.wpIndex = (b.wpIndex + 1) % b.route.length;
                    } else {
                        const step = Math.min(dist, b.speed * dt);
                        speed = step / Math.max(1e-4, dt);
                        b.pos.x += (dx / dist) * step;
                        b.pos.z += (dz / dist) * step;
                        b.pos.y = BO.World.getGroundHeight(b.pos.x, b.pos.z, b.pos.y + 3);
                        b.rig.root.rotation.y = Math.atan2(dx, dz);
                        b.walkPhase += dt * 5.8;
                    }
                } else {
                    b.rig.root.rotation.y = Math.atan2(p.x - b.pos.x, p.z - b.pos.z);
                    b.walkPhase += dt * 1.2;
                }
                if (b.rig.root.visible) {
                    BO.CharacterMesh.animateSoldier(b.rig, { speed, phase: b.walkPhase, aim: 0 }, dt);
                }
                b.marker.x = b.pos.x;
                b.marker.y = b.pos.y;
                b.marker.z = b.pos.z;
            }
        }

        _updateGatedNpcs(dt) {
            const p = BO.Player.pos;
            for (const g of this.gatedNpcs.values()) {
                const d = p.distanceTo(g.rig.root.position);
                g.rig.root.visible = d < 95;
                if (!g.rig.root.visible) continue;
                g.crest.rotation.y += dt * 1.8;
                if (d < 5.0) {
                    g.rig.root.rotation.y = Math.atan2(p.x - g.rig.root.position.x, p.z - g.rig.root.position.z);
                }
                g.idlePhase = (g.idlePhase || 0) + dt;
                BO.CharacterMesh.animateSoldier(g.rig, { speed: 0, phase: g.idlePhase, aim: 0 }, dt);
            }
        }

        handlesNpc(id) {
            return this.brokers.some((b) => b.id === id) || this.gatedNpcs.has(id);
        }

        npcTitle(id) {
            const b = this.brokers.find((x) => x.id === id);
            if (b) return b.name + ' · Black Market';
            const g = this.gatedNpcs.get(id);
            if (g) return g.name + ' · ' + g.title;
            return null;
        }

        isGateMet(spec) {
            if (!spec) return false;
            if (this.unlockedGates.has(spec.id)) return true;
            const lvl = Math.max(BO.ZoneThrill?.level || 1, BO.SurvivalCareer?.level || 1);
            const kills = this.mode?.kills || 0;
            const bosses = this.mode?.campaign?.metrics?.bosses || 0;
            if (lvl >= spec.reqLevel) return true;
            if (kills >= spec.reqKills) return true;
            if (spec.reqBosses && bosses >= spec.reqBosses) return true;
            return false;
        }

        renderNpcPanel(id, ui, helpers) {
            const { esc, tip, costInline, Icons } = helpers;
            const inv = this.mode.points;
            const emeralds = inv.emerald_chip || 0;

            // 1. Roaming Black Market Broker
            const broker = this.brokers.find((b) => b.id === id);
            if (broker) {
                const rep = this.brokerRep[broker.id] || 0;
                const tierName = rep >= 5 ? 'Master Syndicate Partner' : rep >= 2 ? 'Journeyman Client' : 'Novice Contact';
                const sellRows = broker.sell.map((s) => {
                    const ok = this.mode.canAfford(s.cost);
                    return `<button class="sv-trade ${ok ? 'ok' : ''}" data-act="wpAction" data-arg="bmSell:${broker.id}:${s.id}" ${ok ? '' : 'disabled'}${tip(s.name, 'Barter excess salvage/materials for Trader Emeralds.')}>
                        <span class="sv-rec-ico">${Icons().item('emerald_chip', 20)}</span>
                        <b>${esc(s.name)}</b><span>${costInline(s.cost, inv)} → +${s.gain.emerald_chip} Emerald</span></button>`;
                }).join('');
                const buyRows = broker.buy.map((o) => {
                    const repOk = rep >= (o.rep || 0);
                    const afford = repOk && this.mode.canAfford(o.cost);
                    const ico = o.weapon ? Icons().named('rifle', '#e879f9', 20) : Icons().item(Object.keys(o.gain)[0], 20);
                    return `<button class="sv-trade ${afford ? 'ok' : ''}" data-act="wpAction" data-arg="bmBuy:${broker.id}:${o.id}" ${afford ? '' : 'disabled'}${tip(o.name, repOk ? 'Black Market syndicate stock.' : 'Complete ' + o.rep + ' trades with this broker to unlock.')}>
                        <span class="sv-rec-ico">${ico}</span>
                        <b>${esc(o.name)}</b><span>${repOk ? costInline(o.cost, inv) : '🔒 Rep ' + o.rep}</span></button>`;
                }).join('');

                return `<div class="sv-ctx">
                    <span class="sv-kicker" style="color:#d8b4fe;">${esc(broker.title)} · ${esc(tierName)} (${rep} trades) · Emeralds: ${emeralds}</span>
                    <p class="sv-quote">“${esc(broker.greeting)}”</p>
                    <h4 class="sv-sub">Barter Goods for Emeralds</h4>
                    <div class="sv-trades">${sellRows}</div>
                    <h4 class="sv-sub">Black Market Contraband</h4>
                    <div class="sv-trades">${buyRows}</div>
                </div>`;
            }

            // 2. Gated Specialist Contact
            const gated = this.gatedNpcs.get(id);
            if (gated) {
                const lvl = Math.max(BO.ZoneThrill?.level || 1, BO.SurvivalCareer?.level || 1);
                const kills = this.mode?.kills || 0;
                const bosses = this.mode?.campaign?.metrics?.bosses || 0;
                const open = this.isGateMet(gated);

                if (!open) {
                    const canCur = this.mode.canAfford(gated.bribeCurrency);
                    const canItm = this.mode.canAfford(gated.bribeItem);
                    return `<div class="sv-ctx">
                        <span class="sv-kicker" style="color:#fca5a5;">🔒 ACCESS REFUSED · ${esc(gated.title)}</span>
                        <p class="sv-quote">“${esc(gated.lockedQuote)}”</p>
                        <h4 class="sv-sub">Unlock Requirements (Meet ANY One)</h4>
                        <ul class="sv-costs">
                            <li class="sv-cost ${lvl >= gated.reqLevel ? 'ok' : 'short'}"><span>Survivor Level ${gated.reqLevel}</span><b>Level ${lvl}/${gated.reqLevel}</b></li>
                            <li class="sv-cost ${kills >= gated.reqKills ? 'ok' : 'short'}"><span>Hostiles Eliminated</span><b>${kills}/${gated.reqKills} kills</b></li>
                            ${gated.reqBosses ? `<li class="sv-cost ${bosses >= gated.reqBosses ? 'ok' : 'short'}"><span>Boss Slain</span><b>${bosses}/${gated.reqBosses}</b></li>` : ''}
                        </ul>
                        <h4 class="sv-sub">Or Bribe Immediately</h4>
                        <div class="sv-actions wrap">
                            <button class="sv-btn primary" data-act="wpAction" data-arg="bribeCur:${gated.id}" ${canCur ? '' : 'disabled'}>Bribe (${costInline(gated.bribeCurrency, inv)})</button>
                            <button class="sv-btn" data-act="wpAction" data-arg="bribeItm:${gated.id}" ${canItm ? '' : 'disabled'}>Tribute (${costInline(gated.bribeItem, inv)})</button>
                        </div>
                    </div>`;
                }

                const stockRows = gated.stock.map((o) => {
                    const afford = this.mode.canAfford(o.cost);
                    const ico = o.weapon ? Icons().named('rifle', '#fde047', 20) : Icons().item(Object.keys(o.gain)[0], 20);
                    return `<button class="sv-trade ${afford ? 'ok' : ''}" data-act="wpAction" data-arg="gateBuy:${gated.id}:${o.id}" ${afford ? '' : 'disabled'}>
                        <span class="sv-rec-ico">${ico}</span>
                        <b>${esc(o.name)}</b><span>${costInline(o.cost, inv)}</span></button>`;
                }).join('');

                return `<div class="sv-ctx">
                    <span class="sv-kicker" style="color:#86efac;">✓ TRUSTED CONTACT · ${esc(gated.title)} · Emeralds: ${emeralds}</span>
                    <p class="sv-quote">“${esc(gated.openQuote)}”</p>
                    <h4 class="sv-sub">Specialist Inventory</h4>
                    <div class="sv-trades">${stockRows}</div>
                </div>`;
            }

            return '<div class="sv-ctx"><p>Contact unavailable.</p></div>';
        }

        handleUiAction(arg, subject, ui) {
            if (!arg) return false;
            const [cmd, a, b] = arg.split(':');
            const m = this.mode;
            if (cmd === 'bmSell') {
                const broker = this.brokers.find((x) => x.id === a);
                const offer = broker?.sell.find((x) => x.id === b);
                if (!offer || !m.spend(offer.cost)) { ui.feedback = 'Not enough items to barter.'; return false; }
                m.grant(offer.gain);
                this.brokerRep[broker.id] = (this.brokerRep[broker.id] || 0) + 1;
                m.campaign?.mark('trades', 1, 14);
                BO.Sound?.playBuy?.();
                ui.feedback = 'Bartered for +' + offer.gain.emerald_chip + ' Trader Emeralds!';
                return true;
            }
            if (cmd === 'bmBuy') {
                const broker = this.brokers.find((x) => x.id === a);
                const offer = broker?.buy.find((x) => x.id === b);
                if (!offer || (this.brokerRep[broker.id] || 0) < (offer.rep || 0) || !m.spend(offer.cost)) {
                    ui.feedback = 'Cannot purchase that item right now.';
                    return false;
                }
                this._deliverTradeOffer(offer);
                this.brokerRep[broker.id] = (this.brokerRep[broker.id] || 0) + 1;
                m.campaign?.mark('trades', 1, 20);
                BO.Sound?.playBuy?.();
                ui.feedback = 'Purchased ' + offer.name + '!';
                return true;
            }
            if (cmd === 'bribeCur' || cmd === 'bribeItm') {
                const gated = this.gatedNpcs.get(a);
                const cost = cmd === 'bribeCur' ? gated?.bribeCurrency : gated?.bribeItem;
                if (!gated || !cost || !m.spend(cost)) { ui.feedback = 'Missing bribe items.'; return false; }
                this.unlockedGates.add(gated.id);
                m.campaign?.mark('bribesPaid', 1, 35);
                BO.Sound?.playPerkBuy?.();
                ui.feedback = gated.name + ' accepted your tribute — specialist stock unlocked!';
                return true;
            }
            if (cmd === 'gateBuy') {
                const gated = this.gatedNpcs.get(a);
                const offer = gated?.stock.find((x) => x.id === b);
                if (!gated || !this.isGateMet(gated) || !offer || !m.spend(offer.cost)) {
                    ui.feedback = 'Cannot purchase that right now.';
                    return false;
                }
                this._deliverTradeOffer(offer);
                m.campaign?.mark('trades', 1, 18);
                BO.Sound?.playBuy?.();
                ui.feedback = 'Acquired ' + offer.name + '!';
                return true;
            }
            return false;
        }

        _deliverTradeOffer(offer) {
            const m = this.mode;
            if (offer.gain) m.grant(offer.gain);
            if (offer.weapon) {
                m.loot.dropPickup(offer.weapon, 95, BO.Player.pos, offer.name);
                m.toast(offer.name + ' dropped at your feet — press [E] to equip!');
            }
        }

        /* ================================================================ 4. 3D WORLD PICKUPS */
        _scatterStarterPickups() {
            const seeds = [
                [-14, 152, 'apple', 2], [-22, 134, 'wheat', 3], [14, 118, 'emerald_chip', 2],
                [28, 92, 'xp_bottle', 1], [-44, 92, 'carrot', 3], [-88, 62, 'phase_pearl', 1],
                [64, 24, 'flux_dust', 3], [-126, 38, 'slime_gel', 2], [116, -42, 'diamond_shard', 1]
            ];
            for (const [x, z, id, count] of seeds) {
                const p = safeGroundPos(x, z);
                this.spawnWorldPickup(id, count, p.x, p.y, p.z);
            }
        }

        spawnWorldPickup(itemId, count = 1, x, y, z) {
            if (!this.active || !BO.SurvivalFrontierData?.items?.[itemId]) return null;
            if (this.pickups.length >= 70) {
                const old = this.pickups.shift();
                old?.group?.removeFromParent();
            }
            const g = new THREE.Group();
            const gy = (y ?? BO.World.getGroundHeight(x, z, 80)) + 0.36;
            g.position.set(x, gy, z);

            const colorMap = {
                emerald_chip: 0x34d399, diamond_shard: 0x38bdf8, abyssal_alloy: 0xc084fc,
                xp_bottle: 0xbef264, phase_pearl: 0xa855f7, resurrection_idol: 0xfacc15,
                gilded_apple: 0xfde047, enchanted_apple: 0xe879f9, cinder_rod: 0xfb923c,
                wraith_tear: 0xe2e8f0, slime_gel: 0x86efac, flux_dust: 0xf87171,
                apple: 0xef4444, wheat: 0xfacc15, carrot: 0xf97316
            };
            const hex = colorMap[itemId] || 0x9fd4c7;
            const geo = /emerald|diamond|pearl|xp_bottle|tear/.test(itemId)
                ? new THREE.OctahedronGeometry(0.20)
                : new THREE.BoxGeometry(0.26, 0.26, 0.26);
            const mat = new THREE.MeshStandardMaterial({
                color: hex,
                emissive: hex,
                emissiveIntensity: 0.55,
                roughness: 0.35,
                metalness: 0.35
            });
            const core = new THREE.Mesh(geo, mat);
            const ring = new THREE.Mesh(
                new THREE.RingGeometry(0.22, 0.30, 16),
                new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
            );
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = -0.32;
            g.add(core, ring);
            this.mode.scene.add(g);

            const pk = { itemId, count, x, baseY: gy, z, core, group: g, phase: Math.random() * 6.28 };
            this.pickups.push(pk);
            return pk;
        }

        onEnemyKilled(entity) {
            if (!this.active || !entity?.pos) return;
            const { x, y, z } = entity.pos;
            if (entity.isSuperBoss) {
                this.spawnWorldPickup('abyssal_alloy', 2, x - 0.8, y, z);
                this.spawnWorldPickup('diamond_shard', 3, x + 0.8, y, z);
                this.spawnWorldPickup('resurrection_idol', 1, x, y, z - 0.8);
                this.spawnWorldPickup('emerald_chip', 6, x, y, z + 0.8);
                this.mode.loot.dropPickup('ak47', 100, entity.pos, 'Apex Colossus Trophy Rifle');
                return;
            }
            if (entity.isBoss || entity.bossLabel) {
                this.spawnWorldPickup('emerald_chip', 3, x - 0.5, y, z);
                this.spawnWorldPickup('diamond_shard', 1, x + 0.5, y, z);
                this.spawnWorldPickup('xp_bottle', 1, x, y, z + 0.5);
                return;
            }
            const id = entity.spec?.id || '';
            const roll = Math.random();
            if (/bloater|spitter|waddler|slime/i.test(id) && roll < 0.45) this.spawnWorldPickup('slime_gel', 1, x, y, z);
            else if (/cinder|ash|inferno|ember|fire|lava/i.test(id) && roll < 0.45) this.spawnWorldPickup('cinder_rod', 1, x, y, z);
            else if (/stalker|wraith|phantom|shadow|banshee/i.test(id) && roll < 0.42) this.spawnWorldPickup('wraith_tear', 1, x, y, z);
            else if (/crawler|spider|hopper|biter/i.test(id) && roll < 0.42) this.spawnWorldPickup('spider_silk', 1, x, y, z);
            else if (roll < 0.16) this.spawnWorldPickup('emerald_chip', 1, x, y, z);
            else if (roll < 0.28) this.spawnWorldPickup('xp_bottle', 1, x, y, z);
            else if (roll < 0.36) this.spawnWorldPickup('apple', 1, x, y, z);
        }

        _updatePickups(dt) {
            const p = BO.Player.pos;
            const hasMagnet = (this.mode.points.magnet_charm || 0) > 0;
            const pullRadius = hasMagnet ? 9.8 : 2.35;

            for (let i = this.pickups.length - 1; i >= 0; i--) {
                const pk = this.pickups[i];
                pk.phase += dt * 3.1;
                pk.core.rotation.y += dt * 2.1;
                pk.core.position.y = Math.sin(pk.phase) * 0.10;
                const d = Math.hypot(p.x - pk.x, p.z - pk.z);
                if (d < 85) {
                    pk.group.visible = true;
                    if (d <= pullRadius) {
                        if (d > 1.35) {
                            const pull = Math.min(d, (hasMagnet ? 14 : 7) * dt);
                            pk.x += ((p.x - pk.x) / d) * pull;
                            pk.z += ((p.z - pk.z) / d) * pull;
                            pk.group.position.set(pk.x, pk.baseY, pk.z);
                        } else {
                            const { accepted } = this.mode.campaign.pack.receive({ [pk.itemId]: pk.count }, false);
                            if (accepted[pk.itemId]) {
                                BO.Sound?.playBuy?.();
                                this.mode.toast('Picked up ' + BO.SurvivalItemAmounts(accepted));
                                pk.group.removeFromParent();
                                this.pickups.splice(i, 1);
                            }
                        }
                    }
                } else {
                    pk.group.visible = false;
                }
            }
        }

        /* ================================================================ 5. CONSUMABLES, POTIONS, GADGETS & TOTEM */
        consume(id) {
            if (!this.active) return undefined;
            const m = this.mode;
            const p = BO.Player;
            const deep = m.campaign?.deep;
            const inv = m.points;
            if (!(inv[id] > 0)) return undefined;

            // Reusable Grappling Launcher (does NOT consume the item!)
            if (id === 'grappling_hook') {
                if (this.grappleCd > 0) {
                    m.toast('Grappling launcher recharging (' + this.grappleCd.toFixed(1) + 's)...');
                    return false;
                }
                const cam = BO.App.worldCamera;
                const origin = cam.position.clone();
                const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).normalize();
                const hit = BO.World.raycastWorld(origin, dir, 28);
                if (!hit || hit.distance < 2.2) {
                    m.toast('Aim at a rooftop, cliff, wall, or tree within 28 m to grapple!');
                    return false;
                }
                const destX = hit.point.x - dir.x * 0.55;
                const destZ = hit.point.z - dir.z * 0.55;
                const topFloor = BO.World.getGroundHeight(destX, destZ, hit.point.y + 1.8);
                const destY = Math.max(hit.point.y - 0.3, topFloor);
                p.rideState = {
                    kind: 'arc',
                    t: 0,
                    duration: BO.Math.clamp(hit.distance / 28, 0.24, 0.62),
                    sx: p.pos.x, sy: p.pos.y, sz: p.pos.z,
                    dx: destX, dy: destY, dz: destZ,
                    arcHeight: 0.9
                };
                this.grappleCd = 2.4;
                BO.FX.spawnTracer(origin.clone().add(new THREE.Vector3(0, -0.15, 0)), hit.point, 0x94a3b8);
                BO.Sound?.playParkour?.('vault');
                m.toast('Grapple latched (' + Math.round(hit.distance) + ' m)!');
                return true;
            }

            // Reusable Lodestone Magnet pulse (does NOT consume the charm!)
            if (id === 'magnet_charm') {
                let pulled = 0;
                for (const pk of this.pickups) {
                    if (Math.hypot(pk.x - p.pos.x, pk.z - p.pos.z) <= 18) {
                        pk.x = p.pos.x + (Math.random() - 0.5) * 0.5;
                        pk.z = p.pos.z + (Math.random() - 0.5) * 0.5;
                        pk.group.position.set(pk.x, pk.baseY, pk.z);
                        pulled++;
                    }
                }
                for (const bag of m.campaign.pack.bags.values()) {
                    if (Math.hypot(bag.x - p.pos.x, bag.z - p.pos.z) <= 16) {
                        m.campaign.pack.takeBag(bag.marker.id.slice(4));
                        pulled++;
                    }
                }
                BO.Sound?.playPerkBuy?.();
                m.toast(pulled ? `Lodestone Magnet pulled ${pulled} nearby item drop(s)!` : 'Lodestone Magnet active (9.8 m passive auto-pickup).');
                return true;
            }

            const eatFood = (food, water, hp, comp = 0, msg = '') => {
                inv[id]--;
                m.hunger = Math.min(100, m.hunger + food);
                if (water && deep) deep.hydration = Math.min(100, deep.hydration + water);
                if (hp) p.hp = Math.min(p.maxHp, p.hp + hp);
                if (comp) m.composure = Math.min(100, m.composure + comp);
                if (msg) m.toast(msg);
                return true;
            };

            switch (id) {
                case 'xp_bottle':
                    inv[id]--;
                    BO.ZoneThrill?.gainXp?.(160, "Bottle o' Skilling");
                    if (deep) deep.runes = (deep.runes || 0) + 30;
                    m.campaign?.mark('xpBottles', 1, 160);
                    BO.FX.spawnParticles(p.pos.clone().add(new THREE.Vector3(0, 1.1, 0)), 16, 0xbef264, 4, 3, 0.55);
                    BO.Sound?.playPerkBuy?.();
                    m.toast("Smashed Bottle o' Skilling (+160 XP & +30 Runes)!");
                    return true;

                case 'phase_pearl': {
                    const cam = BO.App.worldCamera;
                    const origin = cam.position.clone();
                    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).normalize();
                    const hit = BO.World.raycastWorld(origin, dir, 28);
                    const dist = hit ? Math.max(1.2, hit.distance - 0.65) : 24;
                    const tx = origin.x + dir.x * dist;
                    const tz = origin.z + dir.z * dist;
                    const ty = BO.World.getGroundHeight(tx, tz, (hit ? hit.point.y : origin.y) + 2.2) + 0.08;
                    inv[id]--;
                    BO.FX.spawnParticles(p.pos.clone().add(new THREE.Vector3(0, 1.0, 0)), 16, 0xa855f7, 4.5, 2, 0.5);
                    p.pos.set(tx, ty, tz);
                    p.vel.set(0, 0, 0);
                    p.invulnTimer = Math.max(p.invulnTimer || 0, 0.9);
                    BO.FX.spawnParticles(p.pos.clone().add(new THREE.Vector3(0, 1.0, 0)), 18, 0xd8b4fe, 5, 3, 0.55);
                    BO.Sound?.playParkour?.('mantle');
                    m.toast('Phase Ender-Pearl blinked ' + Math.round(dist) + ' m!');
                    return true;
                }

                case 'chorus_fruit': {
                    inv[id]--;
                    m.hunger = Math.min(100, m.hunger + 18);
                    const ang = Math.random() * Math.PI * 2;
                    const tx = p.pos.x + Math.cos(ang) * 8;
                    const tz = p.pos.z + Math.sin(ang) * 8;
                    const safe = safeGroundPos(tx, tz);
                    p.pos.set(safe.x, safe.y + 0.1, safe.z);
                    p.vel.set(0, 0, 0);
                    p.invulnTimer = Math.max(p.invulnTimer || 0, 0.7);
                    BO.FX.spawnParticles(p.pos.clone().add(new THREE.Vector3(0, 1, 0)), 14, 0xd8b4fe, 4, 2, 0.45);
                    m.toast('Chorus Fruit phase-stepped you 8 m away (+18 food)!');
                    return true;
                }

                case 'gilded_apple':
                    inv[id]--;
                    m.hunger = Math.min(100, m.hunger + 30);
                    p.hp = Math.min(p.maxHp, p.hp + 50);
                    p.armor = Math.min(p.maxArmor || 150, (p.armor || 0) + 50);
                    this.buffs.regen = Math.max(this.buffs.regen || 0, m.clock) + 35;
                    BO.Sound?.playPerkBuy?.();
                    m.toast('Golden Apple eaten (+50 HP, +50 Armour, 35 s Regeneration)!');
                    return true;

                case 'enchanted_apple':
                    inv[id]--;
                    m.hunger = 100;
                    p.hp = p.maxHp;
                    p.maxArmor = Math.max(p.maxArmor || 150, 200);
                    p.armor = Math.min(p.maxArmor, (p.armor || 0) + 120);
                    m.radiation = 0;
                    if (deep) { deep.bleeding = 0; deep.infection = 0; }
                    this.buffs.regen = m.clock + 60;
                    this.buffs.enchanted = m.clock + 60;
                    this.buffs.fireWard = m.clock + 120;
                    BO.Sound?.playPerkBuy?.();
                    m.toast('Enchanted Golden Apple! Full HP, +120 Armour, 60 s Regen & 30% Damage Resist!');
                    return true;

                case 'milk_flask':
                    inv[id]--;
                    m.fracture = false;
                    m.radiation = Math.max(0, m.radiation - 35);
                    if (deep) {
                        deep.bleeding = 0;
                        deep.infection = 0;
                        deep.hydration = Math.min(100, deep.hydration + 25);
                    }
                    m.toast('Purifying Milk Flask cured all injuries, infection & -35 radiation!');
                    return true;

                case 'swiftness_draught':
                    inv[id]--;
                    this.buffs.swiftness = m.clock + 90;
                    p.tacStamina = 1.0;
                    BO.Sound?.playPerkBuy?.();
                    m.toast('Swiftness Potion active (+30% speed for 90 s)!');
                    return true;

                case 'leaping_draught':
                    inv[id]--;
                    this.buffs.leaping = m.clock + 90;
                    BO.Sound?.playPerkBuy?.();
                    m.toast('Leaping Potion active (+45% jump height & zero fall damage for 90 s)!');
                    return true;

                case 'strength_draught':
                    inv[id]--;
                    this.buffs.strength = m.clock + 75;
                    BO.Sound?.playPerkBuy?.();
                    m.toast('Strength Potion active (+35% firearm & melee damage for 75 s)!');
                    return true;

                case 'night_vision_draught':
                    inv[id]--;
                    this.buffs.nightVision = m.clock + 120;
                    m.composure = Math.min(100, m.composure + 35);
                    BO.Sound?.playPerkBuy?.();
                    m.toast('Night-Sight Potion active (crystal-clear night vision for 120 s)!');
                    return true;

                case 'fire_ward_draught':
                    inv[id]--;
                    this.buffs.fireWard = m.clock + 120;
                    m.radiation = Math.max(0, m.radiation - 30);
                    if (deep) deep.temp = Math.max(24, (deep.temp || 20) + 16);
                    BO.Sound?.playPerkBuy?.();
                    m.toast('Fire-Ward Potion active (fire immunity, warmth & -30 rad for 120 s)!');
                    return true;

                case 'turtle_shell_brew':
                    inv[id]--;
                    this.buffs.turtleShell = m.clock + 50;
                    p.armor = Math.min(p.maxArmor || 150, (p.armor || 0) + 40);
                    BO.Sound?.playPerkBuy?.();
                    m.toast('Iron-Shell Potion active (+45% damage resist & +40 armour for 50 s)!');
                    return true;

                case 'phantom_draught':
                    inv[id]--;
                    this.buffs.phantom = m.clock + 60;
                    BO.Sound?.playPerkBuy?.();
                    m.toast('Shadow-Veil Potion active (-70% enemy detection for 60 s)!');
                    return true;

                case 'regen_draught':
                    inv[id]--;
                    this.buffs.regen = m.clock + 40;
                    if (deep) deep.bleeding = 0;
                    BO.Sound?.playPerkBuy?.();
                    m.toast('Regeneration Potion active (+4 HP/s for 40 s)!');
                    return true;

                case 'bread': return eatFood(32, 0, 6, 0, 'Ate Artisan Bread (+32 food, +6 HP).');
                case 'apple': return eatFood(14, 8, 4, 0, 'Ate Orchard Apple (+14 food, +8 water).');
                case 'carrot': return eatFood(12, 5, 2, 0, 'Ate Wild Carrot (+12 food).');
                case 'golden_carrot':
                    this.buffs.nightVision = Math.max(this.buffs.nightVision || 0, m.clock + 45);
                    return eatFood(48, 10, 22, 25, 'Ate Golden Carrot (+48 food, +22 HP, 45 s night clarity)!');
                case 'potato': return eatFood(8, 0, 0, 0, 'Ate raw potato (+8 food — bake at a fire for +34!).');
                case 'baked_potato':
                    if (deep) deep.temp = Math.max(22, (deep.temp || 20) + 8);
                    return eatFood(34, 0, 8, 10, 'Ate hot Baked Potato (+34 food, +8 HP, warmed).');
                case 'pumpkin_pie': return eatFood(46, 0, 15, 30, 'Ate Spiced Pumpkin Pie (+46 food, +15 HP, +30 composure).');
                case 'cookie_ration':
                    p.tacStamina = 1.0;
                    return eatFood(16, 0, 3, 12, 'Ate Trail Cookies (+16 food, full stamina).');
                case 'melon_slice': return eatFood(14, 22, 0, 0, 'Ate Juicy Melon (+14 food, +22 water).');
                case 'glistering_melon': return eatFood(20, 25, 40, 0, 'Ate Glistering Melon (+40 instant HP, +25 water)!');
                case 'rabbit_ragout':
                    if (deep) { deep.temp = Math.max(24, (deep.temp || 20) + 12); deep.comfortUntil = m.clock + 180; }
                    return eatFood(68, 30, 28, 20, 'Ate Root & Rabbit Ragout (+68 food, +30 water, +28 HP, Warmed)!');
                case 'cake_slice':
                    this.buffs.swiftness = Math.max(this.buffs.swiftness || 0, m.clock + 45);
                    return eatFood(75, 10, 35, 50, 'Ate Celebration Cake (+75 food, +35 HP, 45 s speed boost)!');

                case 'abyssal_armor':
                    inv[id]--;
                    p.maxArmor = Math.max(p.maxArmor || 150, 220);
                    p.armor = Math.min(p.maxArmor, (p.armor || 0) + 200);
                    this.buffs.fireWard = Math.max(this.buffs.fireWard || 0, m.clock + 300);
                    BO.Sound?.playPerkBuy?.();
                    m.toast('Equipped Abyssal Trauma Rig (220 Max Armour + Fire Ward)!');
                    return true;

                case 'tnt_charge': {
                    inv[id]--;
                    const fwd = p.getMoveDirectionVectors().forward;
                    const tx = p.pos.x + fwd.x * 2.4;
                    const tz = p.pos.z + fwd.z * 2.4;
                    const ty = BO.World.getGroundHeight(tx, tz, p.pos.y + 1.4);
                    const g = new THREE.Group();
                    g.position.set(tx, ty + 0.42, tz);
                    const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x7f1d1d, emissiveIntensity: 0.4 });
                    const bandMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc });
                    const body = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.76, 0.76), redMat);
                    const band = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.22, 0.78), bandMat);
                    g.add(body, band);
                    m.scene.add(g);
                    this.primedTnt.push({ group: g, redMat, pos: new THREE.Vector3(tx, ty + 0.42, tz), timer: 2.2 });
                    m.toast('Primed TNT Charge deployed — stand clear (2.2 s)!');
                    return true;
                }

                case 'super_boss_beacon': {
                    inv[id]--;
                    const bossId = SUPER_BOSS_IDS[this.superBossIndex % SUPER_BOSS_IDS.length];
                    this.superBossIndex++;
                    const fwd = p.getMoveDirectionVectors().forward;
                    const sx = p.pos.x + fwd.x * 22;
                    const sz = p.pos.z + fwd.z * 22;
                    const safe = safeGroundPos(sx, sz);
                    const spec = BO.ZombiesData.get(bossId);
                    if (spec) {
                        const entity = new BO.ZombieEntity({
                            id: m.nextEnemy++,
                            spec,
                            x: safe.x,
                            y: safe.y,
                            z: safe.z,
                            round: 18,
                            hp: Math.round(spec.hp * 0.45),
                            speed: spec.speed,
                            damage: spec.damage
                        });
                        entity.survivalType = bossId;
                        entity.bossLabel = spec.name;
                        if (entity.zs) { entity.zs.state = 'hunt'; entity.zs.seen = m.clock; }
                        m.zombies.push(entity);
                        m.refreshTargets();
                        BO.Sound?.playAnnouncement?.('super_boss_spawn', 'Super Boss Inbound!');
                        BO.Events.emit('hud:banner', {
                            title: '👑 SUPER BOSS AWAKENED: ' + spec.name.toUpperCase(),
                            sub: 'DEFEAT THE COLOSSUS FOR ABYSSAL ALLOY, DIAMONDS & TOTEM OF UNDYING!',
                            color: '#fde047'
                        });
                    }
                    return true;
                }

                case 'fort_flare':
                    inv[id]--;
                    if (!this.startFortSiege(null, true)) {
                        m.grant({ ammo556: 30, ammo9: 30, medkits: 1 });
                        m.toast('All Survivor Forts liberated — Militia dropped emergency ammo & trauma kit!');
                    }
                    return true;

                default:
                    return undefined;
            }
        }

        /** Totem of Undying (`resurrection_idol`) fatal-damage intercept! */
        tryPreventFatalDamage(player) {
            if (!this.active || !this.mode) return false;
            const inv = this.mode.points;
            if (!((inv.resurrection_idol || 0) > 0)) return false;
            inv.resurrection_idol--;
            player.alive = true;
            player.hp = Math.max(1, Math.round(player.maxHp * 0.65));
            player.armor = Math.min(player.maxArmor || 150, (player.armor || 0) + 60);
            player.invulnTimer = 4.0;
            this.mode.fracture = false;
            const deep = this.mode.campaign?.deep;
            if (deep) {
                deep.bleeding = 0;
                deep.infection = 0;
            }
            this.buffs.regen = this.mode.clock + 25;
            this.buffs.fireWard = this.mode.clock + 45;

            // Golden shockwave stuns & blasts back nearby hostiles!
            const center = player.pos.clone().add(new THREE.Vector3(0, 1.0, 0));
            BO.FX.spawnExplosion(center, 6.2, 0xfacc15);
            BO.FX.spawnParticles(center, 28, 0x34d399, 7, 4, 0.75);
            for (const z of this.mode.zombies) {
                if (z.alive && z.pos.distanceTo(player.pos) < 8.5) {
                    z.stunTimer = Math.max(z.stunTimer || 0, 3.2);
                    this.mode.hit(z, 120, 'torso', null, 'explosive');
                }
            }
            BO.Sound?.playPerkBuy?.();
            BO.Events.emit('hud:banner', {
                title: '✨ TOTEM OF UNDYING TRIGGERED!',
                sub: 'FATAL HIT CHEATED · +65% HP, +60 ARMOUR & 4s INVULNERABILITY!',
                color: '#facc15'
            });
            return true;
        }

        speedMult() {
            if (!this.active || !this.mode) return 1;
            return (this.buffs.swiftness > this.mode.clock) ? 1.30 : 1;
        }
        jumpMult() {
            if (!this.active || !this.mode) return 1;
            return (this.buffs.leaping > this.mode.clock) ? 1.45 : 1;
        }
        noFallDamage() {
            return !!(this.active && this.mode && this.buffs.leaping > this.mode.clock);
        }
        damageMult() {
            if (!this.active || !this.mode) return 1;
            return (this.buffs.strength > this.mode.clock) ? 1.35 : 1;
        }
        incomingDamageMult() {
            if (!this.active || !this.mode) return 1;
            let mult = 1;
            if (this.buffs.turtleShell > this.mode.clock) mult *= 0.55;
            if (this.buffs.enchanted > this.mode.clock) mult *= 0.70;
            return mult;
        }
        hasFireWard() {
            return !!(this.active && this.mode && this.buffs.fireWard > this.mode.clock);
        }
        hasNightVision() {
            return !!(this.active && this.mode && this.buffs.nightVision > this.mode.clock);
        }
        stealthMult() {
            return (this.active && this.mode && this.buffs.phantom > this.mode.clock) ? 0.30 : 1;
        }

        /* ================================================================ 6. STORAGE CHESTS & CUSTOM BUILDINGS */
        resolveChestKey(subject) {
            if (!subject) return subject;
            if (String(subject).startsWith('fort:')) return String(subject);
            const piece = this.mode?.campaign?.placed?.find((p) => p.id === subject && p.alive);
            if (piece?.type === 'quantumChest') return 'quantum:stash';
            return subject;
        }

        chestLimits(subject) {
            if (String(subject).startsWith('fort:')) return CHEST_SPECS.fortChest;
            const piece = this.mode?.campaign?.placed?.find((p) => p.id === subject && p.alive);
            return CHEST_SPECS[piece?.type] || CHEST_SPECS.chest;
        }

        chestLimitsForKey(chestKey) {
            if (chestKey === 'quantum:stash') return CHEST_SPECS.quantumChest;
            if (String(chestKey).startsWith('fort:')) return CHEST_SPECS.fortChest;
            const piece = this.mode?.campaign?.placed?.find((p) => p.id === chestKey && p.alive);
            return CHEST_SPECS[piece?.type] || CHEST_SPECS.chest;
        }

        chestTitle(subject) {
            if (String(subject).startsWith('fort:')) return 'Survivor Fort Armory Chest';
            const piece = this.mode?.campaign?.placed?.find((p) => p.id === subject && p.alive);
            return CHEST_SPECS[piece?.type]?.label || 'Storage Chest';
        }

        canAccessChest(chestKey, nearSite) {
            if (!nearSite) return false;
            if (String(chestKey).startsWith('fort:')) {
                const fortId = String(chestKey).split(':')[1];
                const f = this.forts.get(fortId);
                return !!(f?.liberated && nearSite.id === 'fortchest:' + chestKey);
            }
            if (chestKey === 'quantum:stash') {
                if (!nearSite.id.startsWith('build:')) return false;
                const pid = nearSite.id.slice(6);
                const piece = this.mode?.campaign?.placed?.find((p) => p.id === pid && p.alive);
                return piece?.type === 'quantumChest';
            }
            return nearSite.id === 'build:' + chestKey;
        }

        stationAvailable(type, playerPos) {
            if (!this.active) return false;
            for (const f of this.forts.values()) {
                if (f.liberated && Math.hypot(playerPos.x - f.x, playerPos.z - f.z) <= 9.5) {
                    if (type === 'bench' || type === 'campfire') return true;
                }
            }
            if (type === 'alchemy') {
                return this.mode.campaign.placed.some((p) => p.alive && p.type === 'alchemyStand' && Math.hypot(playerPos.x - p.x, playerPos.z - p.z) <= 4.3);
            }
            if (type === 'arcane') {
                return this.mode.campaign.placed.some((p) => p.alive && p.type === 'arcaneTable' && Math.hypot(playerPos.x - p.x, playerPos.z - p.z) <= 4.3);
            }
            return false;
        }

        decoratePlacedPiece(piece, spec) {
            // Restores run before this system starts, so fall back to the live mode.
            const m = this.mode || BO.SurvivalMode;
            const c = m?.campaign;
            if (!c) return;
            const pack = c.pack;
            const [w, h, d] = piece.size;

            // Walkable Stairs: replace solid full-height block with 4 ascending step colliders & step meshes!
            if (['woodStairs', 'stoneStairs', 'obsidianStairs'].includes(piece.type)) {
                if (piece.part?.collider) {
                    m.removeSolid(piece.mesh, piece.part.collider);
                }
                if (piece.mesh) piece.mesh.visible = false;

                const g = new THREE.Group();
                g.position.set(piece.x, piece.y, piece.z);
                const matKey = piece.type === 'obsidianStairs' ? 'castle_stone' : piece.type === 'stoneStairs' ? 'brick' : 'wood_plank';
                const stepMat = BO.Textures?.getWorldMaterial
                    ? BO.Textures.getWorldMaterial(matKey, 2.8, 1.0)
                    : new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.8 });

                const dirIdx = piece.stairDir ?? (BO.ZoneBuild?.rot || 0) % 4;
                piece.stairDir = dirIdx;
                piece.stepColliders = [];
                const steps = 4;
                for (let s = 0; s < steps; s++) {
                    const sh = ((s + 1) / steps) * h;
                    const frac = -0.375 + s * 0.25;
                    const alongZ = (dirIdx % 2 === 0);
                    const sign = dirIdx < 2 ? 1 : -1;
                    const sx = alongZ ? 0 : frac * w * sign;
                    const sz = alongZ ? frac * d * sign : 0;
                    const sw = alongZ ? w : w / steps;
                    const sd = alongZ ? d / steps : d;
                    const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, sd), stepMat);
                    stepMesh.position.set(sx, sh / 2, sz);
                    stepMesh.castShadow = stepMesh.receiveShadow = true;
                    g.add(stepMesh);

                    const wx = piece.x + sx, wy = piece.y + sh / 2, wz = piece.z + sz;
                    const col = {
                        minX: wx - sw / 2, maxX: wx + sw / 2,
                        minY: wy - sh / 2, maxY: wy + sh / 2,
                        minZ: wz - sd / 2, maxZ: wz + sd / 2,
                        active: true,
                        structure: true
                    };
                    BO.World.colliders.push(col);
                    BO.World.worldMeshes.push(stepMesh);
                    BO.World.notifyColliderChanged?.(col);
                    piece.stepColliders.push({ mesh: stepMesh, col });
                }
                this._trackGroup(g);
                piece.customGroup = g;
                return;
            }

            // Interactive Hinged Doors & Gates (`woodDoor`, `ironDoor`, `doubleGate`, `door`)
            if (['woodDoor', 'ironDoor', 'doubleGate', 'door'].includes(piece.type)) {
                piece.doorOpen = false;
                const doorPivot = new THREE.Group();
                const alongX = w > d;
                doorPivot.position.set(piece.x - (alongX ? w * 0.42 : 0), piece.y + h / 2, piece.z - (alongX ? 0 : d * 0.42));
                const leafMat = new THREE.MeshStandardMaterial({
                    color: piece.type === 'ironDoor' || piece.type === 'door' ? 0x64748b : 0x8b5a2b,
                    roughness: 0.65,
                    metalness: piece.type === 'ironDoor' || piece.type === 'door' ? 0.55 : 0.1
                });
                const leaf = new THREE.Mesh(new THREE.BoxGeometry(alongX ? w * 0.84 : w, h * 0.92, alongX ? d : d * 0.84), leafMat);
                leaf.position.set(alongX ? w * 0.42 : 0, 0, alongX ? 0 : d * 0.42);
                doorPivot.add(leaf);
                this._trackGroup(doorPivot);
                piece.doorPivot = doorPivot;
                if (piece.mesh) {
                    piece.mesh.scale.set(1, 0.14, 1);
                    piece.mesh.position.y = piece.y + h - 0.18;
                }
                const mk = {
                    ...piece,
                    id: 'build:' + piece.id,
                    name: spec.name,
                    reach: 3.2,
                    label: 'Open / Close ' + spec.name + ' [E]'
                };
                m.markers.push(mk);
                piece.doorMarker = mk;
                return;
            }

            // Expanded Storage Chests
            if (['supplyCrate', 'ironVault', 'quantumChest'].includes(piece.type)) {
                if (piece.type !== 'quantumChest' && !pack.chests.has(piece.id)) {
                    pack.chests.set(piece.id, {});
                }
                if (piece.type === 'quantumChest' && piece.mesh) {
                    piece.mesh.material.emissive?.setHex?.(0x7e22ce);
                    piece.mesh.material.emissiveIntensity = 0.55;
                }
                m.markers.push({
                    ...piece,
                    id: 'build:' + piece.id,
                    name: spec.name,
                    reach: 3.1,
                    label: 'Open ' + spec.name + ' [E]'
                });
                return;
            }

            // Crafting & Utility Stations
            if (['alchemyStand', 'arcaneTable', 'wellPump', 'compostBin', 'watchtower'].includes(piece.type)) {
                if (piece.type === 'arcaneTable' && piece.mesh) {
                    piece.mesh.material.emissive?.setHex?.(0x6d28d9);
                    piece.mesh.material.emissiveIntensity = 0.45;
                }
                if (piece.type === 'watchtower') {
                    // Add elevated sniper deck collider at top!
                    const deckMesh = m.mesh(new THREE.BoxGeometry(2.8, 0.25, 2.8), 0x8b623c, piece.x, piece.y + 4.05, piece.z);
                    m.solid(deckMesh, 2.8, 0.25, 2.8);
                    m.markers.push({ ...piece, y: piece.y + 4.1, id: 'build:' + piece.id, name: spec.name, reach: 3.2, label: 'Climb down Watchtower [E]' });
                }
                const labels = {
                    alchemyStand: 'Brew potions at Alchemy Stand [E]',
                    arcaneTable: 'Synthesise relics at Arcane Table [E]',
                    wellPump: 'Draw clean water [E]',
                    compostBin: 'Compost fiber into Bone Meal & Seeds [E]',
                    watchtower: 'Climb Sniper Watchtower [E]'
                };
                m.markers.push({ ...piece, id: 'build:' + piece.id, name: spec.name, reach: 3.2, label: labels[piece.type] });
                return;
            }

            if (piece.type === 'floodlight') {
                const light = new THREE.PointLight(0xfef08a, 1.6, 22, 1.4);
                light.position.set(piece.x, piece.y + 2.25, piece.z);
                m.scene.add(light);
                pack.lights.push(light);
            }
        }

        onPieceRemoved(piece) {
            if (piece.stepColliders) {
                for (const sc of piece.stepColliders) {
                    this.mode.removeSolid(sc.mesh, sc.col);
                }
            }
            if (piece.customGroup) piece.customGroup.visible = false;
            if (piece.doorPivot) piece.doorPivot.visible = false;
            if (piece.doorMarker) piece.doorMarker.alive = false;
        }

        activateMarker(site) {
            if (!this.active || !site) return false;
            const m = this.mode;

            // Signposts
            if (site.id.startsWith('signpost:')) {
                const sp = this.signposts.find((s) => s.id === site.signpostId);
                if (sp && !this.unlockedSignposts.has(sp.id)) {
                    this.unlockedSignposts.add(sp.id);
                    sp.lampMat.emissive.setHex(0x34d399);
                    sp.marker.label = 'Fast travel signpost [E]';
                    m.campaign?.mark('signposts', 1, 30);
                    BO.Sound?.playPerkBuy?.();
                    m.toast('Attuned ' + sp.name + ' · +30 XP!');
                }
                BO.SurvivalUI.show('fasttravel');
                return true;
            }

            // Fort Gate Beacon
            if (site.id.startsWith('fortgate:')) {
                const fort = this.forts.get(site.fortId);
                if (!fort) return false;
                if (!fort.liberated) {
                    if (!this.activeSiege) this.startFortSiege(fort.id, true);
                    else m.toast('Eliminate all remaining Siege attackers to liberate ' + fort.name + '!');
                } else {
                    BO.SurvivalUI.show('fasttravel');
                }
                return true;
            }

            // Fort Armory Chests
            if (site.id.startsWith('fortchest:')) {
                const fort = this.forts.get(site.fortId);
                if (!fort?.liberated) {
                    m.toast('Locked! Defeat the horde attacking ' + (fort?.name || 'the fort') + ' first!');
                    if (fort && !this.activeSiege) this.startFortSiege(fort.id, true);
                    return true;
                }
                BO.SurvivalUI.show('chest', null, site.chestKey);
                return true;
            }

            // Fort Workbench
            if (site.id.startsWith('fortbench:')) {
                const fort = this.forts.get(site.fortId);
                if (!fort?.liberated) {
                    m.toast('Clear the Fort Siege first to use its workbench!');
                    return true;
                }
                BO.SurvivalUI.show('crafting');
                return true;
            }

            // Fort Defender NPC talk / heal
            if (site.id.startsWith('fortdef:')) {
                const fort = this.forts.get(site.fortId);
                const def = fort?.defenders?.[site.defIdx];
                if (!def) return true;
                if (def.alive && def.hp < def.maxHp && (m.points.bandage > 0 || m.points.medkits > 0)) {
                    if (m.points.bandage > 0) m.points.bandage--;
                    else m.points.medkits--;
                    def.hp = def.maxHp;
                    m.grant({ emerald_chip: 1 });
                    m.toast(`Patched up ${def.name} to full health (+1 Trader Emerald)!`);
                } else {
                    m.toast(`${def.name}: “Perimeter secure (${Math.round(def.hp)}/${def.maxHp} HP). Zombies near ${fort.name} answer to our rifles!”`);
                }
                return true;
            }

            // Custom Build Pieces
            if (site.id.startsWith('build:')) {
                const pid = site.id.slice(6);
                const piece = m.campaign.placed.find((p) => p.id === pid && p.alive);
                if (!piece) return false;

                if (['woodDoor', 'ironDoor', 'doubleGate', 'door'].includes(piece.type) && piece.doorPivot !== undefined) {
                    piece.doorOpen = !piece.doorOpen;
                    piece.doorPivot.rotation.y = piece.doorOpen ? Math.PI * 0.48 : 0;
                    if (piece.part?.collider) {
                        piece.part.collider.active = !piece.doorOpen;
                        BO.World.notifyColliderChanged?.(piece.part.collider);
                    }
                    BO.Sound?.playReload?.('bolt');
                    return true;
                }
                if (['supplyCrate', 'ironVault', 'quantumChest'].includes(piece.type)) {
                    BO.SurvivalUI.show('chest', null, piece.id);
                    return true;
                }
                if (piece.type === 'alchemyStand' || piece.type === 'arcaneTable') {
                    BO.SurvivalUI.craftCat = 'potions';
                    BO.SurvivalUI.show('crafting');
                    return true;
                }
                if (piece.type === 'wellPump') {
                    if ((piece._nextDraw || 0) > m.clock) {
                        m.toast('Well refilling (' + Math.ceil(piece._nextDraw - m.clock) + 's)...');
                        return true;
                    }
                    piece._nextDraw = m.clock + 25;
                    m.grant({ freshWater: 2 });
                    return true;
                }
                if (piece.type === 'compostBin') {
                    if (m.spend({ fiber: 2 }) || m.spend({ berries: 2 })) {
                        m.grant({ bonemeal: 2, cropSeeds: 1 });
                    } else {
                        m.toast('Need 2 Plant Fiber or 2 Berries to compost.');
                    }
                    return true;
                }
                if (piece.type === 'watchtower') {
                    const up = BO.Player.pos.y < piece.y + 2.2;
                    BO.Player.pos.set(piece.x, up ? piece.y + 4.22 : piece.y + 0.08, piece.z + (up ? 0 : 1.7));
                    BO.Player.vel.set(0, 0, 0);
                    BO.Sound?.playParkour?.('mantle');
                    return true;
                }
            }
            return false;
        }

        /* ================================================================ 7. FRAME UPDATE */
        update(dt) {
            if (!this.active || !this.mode?.active) return;
            const m = this.mode;
            const p = BO.Player;

            if (this.grappleCd > 0) this.grappleCd = Math.max(0, this.grappleCd - dt);

            // Auto-discover signposts on proximity
            for (const sp of this.signposts) {
                if (!this.unlockedSignposts.has(sp.id) && Math.hypot(p.pos.x - sp.x, p.pos.z - sp.z) < 9.5) {
                    this.unlockedSignposts.add(sp.id);
                    sp.lampMat.emissive.setHex(0x34d399);
                    sp.marker.label = 'Fast travel signpost [E]';
                    m.campaign?.mark('signposts', 1, 30);
                    m.toast('Discovered ' + sp.name + ' (Fast Travel unlocked)!');
                }
            }

            // Night-Vision Potion ambient illumination
            if (this.hasNightVision() && m.weatherHemi) {
                m.weatherHemi.intensity = Math.max(m.weatherHemi.intensity, 1.28);
            }

            // Continuous Regeneration buff (Golden Apple / Enchanted Apple / Regen Potion)
            if (this.buffs.regen > m.clock && p.alive) {
                this.regenTick += dt;
                if (this.regenTick >= 0.5) {
                    this.regenTick = 0;
                    p.hp = Math.min(p.maxHp, p.hp + 2);
                }
            }

            // Primed TNT countdown & detonation
            for (let i = this.primedTnt.length - 1; i >= 0; i--) {
                const t = this.primedTnt[i];
                t.timer -= dt;
                const flash = Math.sin(t.timer * 22) > 0;
                t.redMat.emissive.setHex(flash ? 0xffffff : 0x7f1d1d);
                const s = 1 + Math.max(0, (0.5 - t.timer) * 0.35);
                t.group.scale.setScalar(s);
                if (t.timer <= 0) {
                    t.group.removeFromParent();
                    this.primedTnt.splice(i, 1);
                    BO.FX.spawnExplosion(t.pos, 9.0, 0xf97316);
                    BO.Sound?.playExplosion?.(1.0);
                    m.explode(t.pos, 9.0, 650, false, 1.8, 'tnt');
                }
            }

            // Hopper Collectors & Defensive Barbed Wire / Spike Walls
            this.hopperTick -= dt;
            if (this.hopperTick <= 0) {
                this.hopperTick = 1.0;
                const placed = m.campaign?.placed || [];
                const pack = m.campaign?.pack;
                for (const piece of placed) {
                    if (!piece.alive) continue;
                    if (piece.type === 'barbedWire' || piece.type === 'spikeWall') {
                        for (const z of m.zombies) {
                            if (!z.alive) continue;
                            const dist = Math.hypot(z.pos.x - piece.x, z.pos.z - piece.z);
                            if (dist < 1.95) {
                                if (piece.type === 'barbedWire') z.slowTimer = Math.max(z.slowTimer || 0, 1.4);
                                m.hit(z, piece.type === 'spikeWall' ? 28 : 14, 'torso', null, 'melee', piece);
                            }
                        }
                    } else if (piece.type === 'autoCollector' && pack) {
                        // Deposit nearby world pickups into nearest player chest (or Quantum stash)
                        const targetChestPiece = placed.find((c) => c.alive && ['chest', 'supplyCrate', 'ironVault', 'quantumChest'].includes(c.type) && Math.hypot(c.x - piece.x, c.z - piece.z) < 8);
                        const chestKey = targetChestPiece ? (targetChestPiece.type === 'quantumChest' ? 'quantum:stash' : targetChestPiece.id) : 'quantum:stash';
                        const chestObj = pack.chests.get(chestKey);
                        if (chestObj) {
                            const lim = this.chestLimitsForKey(chestKey);
                            for (let k = this.pickups.length - 1; k >= 0; k--) {
                                const pk = this.pickups[k];
                                if (Math.hypot(pk.x - piece.x, pk.z - piece.z) <= 10.5) {
                                    const n = pack.room(pk.itemId, pk.count, chestObj, lim);
                                    if (n > 0) {
                                        chestObj[pk.itemId] = (chestObj[pk.itemId] || 0) + n;
                                        pk.group.removeFromParent();
                                        this.pickups.splice(k, 1);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            this._updateForts(dt);
            this._updateBrokers(dt);
            this._updateGatedNpcs(dt);
            this._updatePickups(dt);
        }

        /** Map overlay helper called by SurvivalUI.drawMap */
        drawMapMarkers(ctx, sx, sz, hit, label, zoom) {
            if (!this.active) return;

            // Signposts
            for (const sp of this.signposts) {
                const att = this.unlockedSignposts.has(sp.id);
                ctx.save();
                ctx.translate(sx(sp.x), sz(sp.z));
                ctx.fillStyle = att ? '#34d399' : 'rgba(148,163,184,0.75)';
                ctx.strokeStyle = '#091014';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, -7); ctx.lineTo(7, 0); ctx.lineTo(0, 7); ctx.lineTo(-7, 0); ctx.closePath();
                ctx.fill(); ctx.stroke();
                ctx.restore();
                if (zoom >= 1.8) label(sp.name.replace(' Signpost', ''), sp.x, sp.z, att ? '#a7f3d0' : '#cbd5e1', 10, 18);
                hit(sp.x, sp.z, sp.name, att ? 'Attuned Fast Travel Signpost (0h instant travel from any signpost).' : 'Walk close or press [E] to attune this roadside signpost.', 9);
            }

            // Survivor Forts
            for (const f of this.forts.values()) {
                const underSiege = this.activeSiege?.fortId === f.id;
                const col = underSiege ? '#fb7185' : f.liberated ? '#34d399' : '#fbbf24';
                ctx.save();
                ctx.translate(sx(f.x), sz(f.z));
                if (underSiege) {
                    const r = 14 + 5 * Math.sin(performance.now() / 220);
                    ctx.strokeStyle = '#fb7185';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
                }
                ctx.fillStyle = col;
                ctx.strokeStyle = '#091014';
                ctx.lineWidth = 2;
                ctx.fillRect(-8, -8, 16, 16);
                ctx.strokeRect(-8, -8, 16, 16);
                ctx.restore();
                label(f.name + (underSiege ? ' ⚔' : f.liberated ? ' ✓' : ''), f.x, f.z, col, 11, 22);
                hit(f.x, f.z, f.name, f.liberated
                    ? 'Liberated Survivor Fort: 2 Armory Chests, Fast Travel Beacon, Workbench, and 3 patrolling Defenders.'
                    : underSiege
                        ? 'FORT UNDER SIEGE! Defeat the attacking zombie horde to liberate it!'
                        : 'Unclaimed Survivor Fort. Approach or rally at the gate to defend it from a zombie horde and unlock its chests & defenders!', 13);
            }

            // Roaming Black Market Brokers
            for (const b of this.brokers) {
                ctx.save();
                ctx.translate(sx(b.pos.x), sz(b.pos.z));
                ctx.fillStyle = '#d8b4fe';
                ctx.strokeStyle = '#091014';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                ctx.restore();
                if (zoom >= 1.4) label(b.name, b.pos.x, b.pos.z, '#e9d5ff', 10, 18);
                hit(b.pos.x, b.pos.z, b.name + ' · Black Market', 'Roaming Black Market broker: barter salvage for Trader Emeralds and buy rare relics, potions & epic gear.', 10);
            }

            // Gated Specialist Contacts
            for (const g of this.gatedNpcs.values()) {
                const open = this.isGateMet(g);
                ctx.save();
                ctx.translate(sx(g.x), sz(g.z));
                ctx.fillStyle = open ? '#86efac' : '#fca5a5';
                ctx.strokeStyle = '#091014';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                ctx.restore();
                if (zoom >= 1.5) label(g.name, g.x, g.z, open ? '#bbf7d0' : '#fecaca', 10, 18);
                hit(g.x, g.z, g.name + ' · ' + g.title, open ? 'Trusted specialist trader unlocked.' : `Gated specialist: requires Level ${g.reqLevel}, ${g.reqKills} kills, or a bribe.`, 9);
            }
        }
    }

    BO.ZoneWorldPlus = new ZoneWorldPlus();
})(window.BO);
