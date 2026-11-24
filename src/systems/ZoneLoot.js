/* ============================================================================
   BLACKOUT OPS — Zone loot
   · New scavenging items: four ammunition calibres, reloading components,
     weapon repair kits, splints, batteries, radio parts and canned food
   · Loot tables keyed by container type × tier (POI ring)
   · Ammo calibres, weapon condition and found-weapon pools
   · ContainerField: instanced furniture/containers placed by the world, with
     timed searching, noise, one roll per save, and dropped weapon pickups
============================================================================ */
(function (BO) {
    'use strict';

    const F = BO.SurvivalFrontierData;
    Object.assign(F.items, {
        ammo9: ['9mm rounds', 'Ammunition', 0.011],
        ammo556: ['5.56 rounds', 'Ammunition', 0.013],
        ammo762: ['7.62 rounds', 'Ammunition', 0.017],
        ammo12: ['12-gauge shells', 'Ammunition', 0.04],
        brass: ['Spent brass', 'Components', 0.006],
        powder: ['Gunpowder', 'Components', 0.05],
        primers: ['Primers', 'Components', 0.004],
        gunkit: ['Weapon repair kit', 'Consumables', 0.6],
        splint: ['Splint', 'Consumables', 0.3],
        painkillers: ['Painkillers', 'Consumables', 0.05],
        canned: ['Canned food', 'Consumables', 0.4],
        battery: ['Battery', 'Components', 0.35],
        radioParts: ['Radio parts', 'Components', 0.3],
        circuit: ['Circuit board', 'Components', 0.15],
        keycard: ['Campus keycard', 'Keys', 0.02]
    });
    F.recipes.push(
        { id: 'makeSplint', name: 'Splint', station: 'hand', cost: { timber: 1, cloth: 1, cord: 1 }, gain: { splint: 1 }, desc: 'Sets a fracture so you stop limping.' },
        { id: 'reload9', name: 'Reload 9mm', station: 'bench', cost: { brass: 10, powder: 1, primers: 10 }, gain: { ammo9: 10 }, desc: 'Hand-loads ten 9mm rounds from spent brass.' },
        { id: 'reload556', name: 'Reload 5.56', station: 'bench', cost: { brass: 10, powder: 2, primers: 10 }, gain: { ammo556: 10 }, desc: 'Hand-loads ten 5.56 rounds.' },
        { id: 'reload762', name: 'Reload 7.62', station: 'bench', cost: { brass: 10, powder: 2, primers: 10 }, gain: { ammo762: 8 }, desc: 'Hand-loads eight 7.62 rounds.' },
        { id: 'reload12', name: 'Reload shells', station: 'bench', cost: { brass: 6, powder: 2, primers: 6, scrap: 1 }, gain: { ammo12: 6 }, desc: 'Packs six 12-gauge shells.' },
        { id: 'makeGunkit', name: 'Weapon repair kit', station: 'bench', cost: { scrap: 3, cloth: 1, resin: 1 }, gain: { gunkit: 1 }, desc: 'Restores 35 condition to the weapon you are holding.' },
        { id: 'makePowder', name: 'Black powder', station: 'campfire', cost: { coal: 2, herbs: 1 }, gain: { powder: 1 }, desc: 'Crude propellant from charcoal and saltpetre-rich bitterleaf ash.' },
        { id: 'salvageRadio', name: 'Strip radio parts', station: 'hand', cost: { circuit: 1, wire: 1 }, gain: { radioParts: 1 }, desc: 'Combine a circuit board and wire into a usable radio module.' }
    );

    /* ---------------------------------------------------------------- weapons */
    const CAL = { 'Pistol': 'ammo9', 'SMG': 'ammo9', 'Assault Rifle': 'ammo556', 'LMG': 'ammo762', 'Sniper Rifle': 'ammo762', 'Marksman Rifle': 'ammo762', 'Shotgun': 'ammo12' };
    const HEAVY_AR = new Set(['ak47', 'scarh', 'fal_osw', 'galil_ar', 'an94_abakan']);
    function caliberOf(w) {
        const id = typeof w === 'string' ? w : w?.cfg?.id;
        if (!id) return null;
        const spec = BO.WeaponsData.get(id);
        if (!spec || spec.kind === 'melee' || spec.kind === 'magic') return null;
        if (HEAVY_AR.has(id)) return 'ammo762';
        return CAL[spec.category] || null;
    }
    const WEAPON_POOLS = {
        1: ['m1911', 'double_barrel', 'machete_jungle', 'crowbar_heavy'],
        2: ['glock18_auto', 'five_seven', 'mp5', 'r870', 'thompson_m1', 'kar98k_irons', 'tomahawk_axe'],
        3: ['m4a1', 'ak47', 'ump45', 'mp7_navy', 'm1014_cod4', 'g36c_tac', 'm40a3_cod4', 'deagle', 'python_magnum'],
        4: ['scarh', 'mk14', 'rpd', 'm249', 'spas12_tac', 'dragunov_svd', 'vector_kriss', 'katana_carbon']
    };
    /** Noise radius (m) of one shot, by category. */
    function shotNoise(w) {
        if (w?.stats?.suppressed) return 22;
        const cat = BO.WeaponsData.get(w?.cfg?.id)?.category || '';
        return { 'Pistol': 70, 'SMG': 80, 'Assault Rifle': 110, 'Shotgun': 100, 'LMG': 125, 'Sniper Rifle': 150, 'Marksman Rifle': 130 }[cat] || 90;
    }

    /* ---------------------------------------------------------------- tables */
    // [item, weight, min, max]  — quantities scale up with tier.
    const T = {
        fridge: [['canned', 4, 1, 2], ['rations', 3, 1, 1], ['freshWater', 3, 1, 2], ['herbs', 1, 1, 2]],
        cabinet: [['cloth', 4, 1, 3], ['cord', 3, 1, 2], ['scrap', 3, 1, 3], ['bandage', 2, 1, 1], ['battery', 1, 1, 1], ['painkillers', 1, 1, 2]],
        wardrobe: [['cloth', 6, 2, 4], ['scrap', 2, 1, 2], ['cord', 2, 1, 2]],
        desk: [['scrap', 4, 1, 2], ['battery', 2, 1, 1], ['circuit', 2, 1, 1], ['ammo9', 1, 4, 10], ['radioParts', 1, 1, 1]],
        locker: [['ammo9', 3, 6, 14], ['cloth', 3, 1, 2], ['bandage', 2, 1, 2], ['scrap', 2, 1, 3], ['gunkit', 1, 1, 1], ['painkillers', 1, 1, 2]],
        gun_locker: [['ammo9', 4, 12, 24], ['ammo556', 3, 10, 20], ['ammo12', 3, 4, 10], ['gunkit', 2, 1, 1], ['primers', 1, 10, 20], ['__weapon', 2, 1, 1]],
        evidence: [['ammo9', 3, 6, 12], ['ammo762', 2, 6, 12], ['powder', 2, 1, 2], ['__weapon', 1, 1, 1], ['scrap', 2, 2, 4]],
        med_cabinet: [['bandage', 5, 1, 3], ['medkits', 2, 1, 1], ['antibiotic', 2, 1, 1], ['splint', 2, 1, 1], ['painkillers', 3, 1, 3]],
        shelf: [['canned', 4, 1, 3], ['rations', 2, 1, 2], ['cloth', 2, 1, 2], ['cord', 2, 1, 2], ['battery', 2, 1, 1], ['freshWater', 2, 1, 1]],
        toolbox: [['scrap', 4, 2, 4], ['wire', 3, 1, 2], ['cord', 2, 1, 2], ['repair', 2, 1, 1], ['gunkit', 1, 1, 1], ['fuel', 1, 1, 1]],
        crate: [['scrap', 4, 2, 5], ['timber', 2, 2, 4], ['planks', 2, 1, 3], ['cloth', 2, 1, 3], ['fuel', 1, 1, 1], ['brass', 2, 5, 15]],
        military_crate: [['ammo556', 4, 15, 30], ['ammo762', 3, 10, 20], ['ammo9', 3, 15, 30], ['medkits', 2, 1, 1], ['gunkit', 2, 1, 1], ['__weapon', 2, 1, 1], ['powder', 1, 1, 3]],
        fuel_drum: [['fuel', 6, 1, 3], ['powder', 1, 1, 1]],
        car_trunk: [['scrap', 3, 1, 3], ['fuel', 3, 1, 1], ['cloth', 2, 1, 2], ['repair', 1, 1, 1], ['rations', 2, 1, 1], ['battery', 2, 1, 1]],
        electrical: [['wire', 4, 1, 3], ['battery', 3, 1, 2], ['circuit', 3, 1, 2], ['copper', 2, 1, 3], ['radioParts', 1, 1, 1]],
        chem: [['powder', 4, 1, 3], ['antibiotic', 2, 1, 1], ['filter', 2, 1, 1], ['primers', 2, 10, 20], ['fuel', 1, 1, 2]],
        lab_cabinet: [['antibiotic', 3, 1, 2], ['circuit', 3, 1, 2], ['filter', 2, 1, 1], ['aetherShard', 2, 1, 1], ['quartz', 2, 1, 2], ['medkits', 1, 1, 1]]
    };
    const NAMES = {
        fridge: 'Fridge', cabinet: 'Cabinet', wardrobe: 'Wardrobe', desk: 'Desk', locker: 'Locker', gun_locker: 'Gun locker', evidence: 'Evidence locker',
        med_cabinet: 'Medicine cabinet', shelf: 'Shelf', toolbox: 'Toolbox', crate: 'Crate', military_crate: 'Military crate', fuel_drum: 'Fuel drum',
        car_trunk: 'Car trunk', electrical: 'Electrical cabinet', chem: 'Chemical store', lab_cabinet: 'Lab cabinet'
    };
    const SEARCH_TIME = { fridge: 1.0, cabinet: 1.2, wardrobe: 1.3, desk: 1.1, locker: 1.4, gun_locker: 2.2, evidence: 1.8, med_cabinet: 0.9, shelf: 1.0,
        toolbox: 0.8, crate: 1.6, military_crate: 2.4, fuel_drum: 0.8, car_trunk: 1.5, electrical: 1.6, chem: 1.4, lab_cabinet: 1.8 };
    const SEARCH_NOISE = { locker: 14, gun_locker: 16, evidence: 14, crate: 10, military_crate: 12, car_trunk: 12, toolbox: 8 };

    function roll(type, tier, R = Math.random) {
        const table = T[type] || T.crate;
        const items = {};
        let weapon = null;
        const draws = 1 + (R() < 0.55 ? 1 : 0) + (tier >= 3 && R() < 0.5 ? 1 : 0);
        const total = table.reduce((s, e) => s + e[1], 0);
        for (let d = 0; d < draws; d++) {
            let r = R() * total, pick = table[0];
            for (const e of table) { r -= e[1]; if (r <= 0) { pick = e; break; } }
            const [id, , lo, hi] = pick;
            if (id === '__weapon') {
                const pool = WEAPON_POOLS[Math.min(4, Math.max(1, tier + (R() < 0.15 ? 1 : 0)))];
                weapon = weapon || pool[Math.floor(R() * pool.length)];
                continue;
            }
            const mult = 1 + (tier - 1) * 0.35;
            const n = Math.max(1, Math.round((lo + R() * (hi - lo)) * mult));
            items[id] = (items[id] || 0) + n;
        }
        if (R() < 0.08 + tier * 0.02) items.brass = (items.brass || 0) + 4 + Math.floor(R() * 8);
        return { items, weapon };
    }

    /* ---------------------------------------------------------------- visuals */
    const SHAPES = {
        crate: { w: 1.0, h: 0.7, d: 0.7, color: 0x8b6a45 }, military_crate: { w: 1.2, h: 0.62, d: 0.62, color: 0x4f5b3a },
        locker: { w: 0.55, h: 1.85, d: 0.5, color: 0x6d7b84 }, gun_locker: { w: 1.0, h: 1.9, d: 0.55, color: 0x2f3b45 }, evidence: { w: 0.6, h: 1.85, d: 0.5, color: 0x55636b },
        cabinet: { w: 1.0, h: 1.0, d: 0.5, color: 0x7a5a3e }, wardrobe: { w: 1.1, h: 1.9, d: 0.55, color: 0x6a4b33 }, fridge: { w: 0.75, h: 1.75, d: 0.7, color: 0xd7d9d4 },
        desk: { w: 1.4, h: 0.76, d: 0.7, color: 0x6b5442 }, shelf: { w: 1.6, h: 1.8, d: 0.45, color: 0x8a8f86 }, med_cabinet: { w: 0.6, h: 0.75, d: 0.25, color: 0xe9ecef, wall: 1.2 },
        toolbox: { w: 0.6, h: 0.32, d: 0.3, color: 0xb83a2e }, fuel_drum: { w: 0.62, h: 0.9, d: 0.62, color: 0x8a3d22 }, electrical: { w: 0.8, h: 1.4, d: 0.4, color: 0x8d969c },
        chem: { w: 0.62, h: 0.9, d: 0.62, color: 0xd4b13a }, lab_cabinet: { w: 1.0, h: 1.9, d: 0.5, color: 0xcfd9de }, car_trunk: null
    };
    const BLOCKERS = new Set(['locker', 'gun_locker', 'evidence', 'wardrobe', 'fridge', 'shelf', 'lab_cabinet', 'electrical', 'military_crate', 'crate', 'desk', 'cabinet']);

    class ContainerField {
        constructor(mode) {
            this.mode = mode;
            this.list = [];
            this.meshes = [];
            this.searched = new Set();
            this.pickups = new Map();
            this.pickupIndex = 0;
            this.search = null;
        }

        setup(saved) {
            const m = this.mode;
            const src = BO.Zone.containers;
            const byType = new Map();
            src.forEach((c, i) => {
                const shape = SHAPES[c.type];
                const entry = { ...c, i, id: 'cont:' + i, shape };
                this.list.push(entry);
                if (shape) {
                    if (!byType.has(c.type)) byType.set(c.type, []);
                    byType.get(c.type).push(entry);
                }
                const mk = { id: entry.id, x: c.x, y: c.y, z: c.z, name: NAMES[c.type] || 'Container', label: 'Search ' + (NAMES[c.type] || 'container').toLowerCase(), alive: true, container: entry };
                entry.marker = mk;
                m.markers.push(mk);
            });
            const dummy = new THREE.Object3D();
            for (const [type, entries] of byType) {
                const s = SHAPES[type];
                const geo = (type === 'fuel_drum' || type === 'chem') ? new THREE.CylinderGeometry(s.w / 2, s.w / 2, s.h, 12) : new THREE.BoxGeometry(s.w, s.h, s.d);
                const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75, metalness: type.includes('locker') || type === 'electrical' ? 0.35 : 0.05 }), entries.length);
                const col = new THREE.Color();
                entries.forEach((e, k) => {
                    const lift = s.wall ? s.wall : 0;
                    const odd = (e.rot || 0) % 2 === 1;
                    dummy.position.set(e.x, e.y + lift + s.h / 2, e.z);
                    dummy.rotation.set(0, (e.rot || 0) * Math.PI / 2, 0);
                    dummy.updateMatrix();
                    mesh.setMatrixAt(k, dummy.matrix);
                    col.setHex(s.color);
                    mesh.setColorAt(k, col);
                    e.mesh = mesh;
                    e.k = k;
                    if (BLOCKERS.has(type)) {
                        const hw = (odd ? s.d : s.w) / 2, hd = (odd ? s.w : s.d) / 2;
                        BO.World.colliders.push({ minX: e.x - hw, maxX: e.x + hw, minY: e.y, maxY: e.y + s.h, minZ: e.z - hd, maxZ: e.z + hd, active: true, navIgnore: true });
                    }
                });
                if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                m.scene.add(mesh);
                this.meshes.push(mesh);
            }
            if (saved) this.restore(saved);
        }

        stop() {
            for (const mesh of this.meshes) { mesh.removeFromParent(); mesh.geometry.dispose(); mesh.material.dispose(); }
            for (const p of this.pickups.values()) this.mode.disposeOwned(p.mesh);
            this.meshes = [];
            this.pickups.clear();
        }

        markSearched(entry) {
            this.searched.add(entry.i);
            entry.marker.alive = false;
            if (entry.mesh) {
                const c = new THREE.Color(entry.shape.color).multiplyScalar(0.45);
                entry.mesh.setColorAt(entry.k, c);
                entry.mesh.instanceColor.needsUpdate = true;
            }
        }

        /** Begin a timed search; returns true if the marker was a container. */
        begin(marker) {
            const entry = marker?.container;
            if (!entry) return false;
            if (this.searched.has(entry.i)) return true;
            if (this.search) return true;
            const scavRank = BO.SurvivalCareer?.masteryRank?.('scavenger') || 0;
            const ghostRank = BO.SurvivalCareer?.masteryRank?.('ghost') || 0;
            const dur = (SEARCH_TIME[entry.type] || 1.2) * (this.mode.campaign?.has('fastLoot') ? 0.6 : 1) * Math.max(0.5, 1 - scavRank * 0.15);
            this.search = { entry, t: 0, dur, pos: BO.Player.pos.clone() };
            const noise = SEARCH_NOISE[entry.type];
            if (noise) BO.ZoneDirector?.noise(entry.x, entry.z, noise * Math.max(0.5, 1 - ghostRank * 0.12), 'search');
            BO.Sound?.playUIClick?.();
            return true;
        }

        update(dt) {
            const s = this.search;
            if (!s) return;
            const p = BO.Player;
            if (!p.alive || p.pos.distanceTo(s.pos) > 1.4) {
                this.search = null;
                this.mode.toast('Search interrupted.');
                return;
            }
            s.t += dt;
            if (s.t >= s.dur) {
                this.search = null;
                this.complete(s.entry);
            }
        }

        get progress() {
            return this.search ? { name: 'Searching ' + (NAMES[this.search.entry.type] || 'container').toLowerCase(), frac: Math.min(1, this.search.t / this.search.dur) } : null;
        }

        complete(entry) {
            const m = this.mode;
            this.markSearched(entry);
            m.campaign.mark('containers', 1, 4);
            if (entry.story) {
                m.campaign.objectives.onStoryContainer(entry);
                return;
            }
            const R = BO.ZoneSeed && m.seed ? BO.ZoneSeed.rng(m.seed, 'loot:' + entry.i) : Math.random;
            const { items, weapon } = roll(entry.type, entry.tier || 1, R);
            const lootMult = (m.tierSpec?.loot || 1) * (1 + (BO.SurvivalCareer?.masteryRank?.('scavenger') || 0) * 0.10);
            if (lootMult > 1.01) {
                for (const k of Object.keys(items)) items[k] = Math.max(1, Math.round(items[k] * lootMult));
            }
            const bonus = BO.ZoneFrontier?.regionBonus(entry);
            if (bonus && bonus.id !== '__weapon') items[bonus.id] = (items[bonus.id] || 0) + bonus.n;
            if (Object.keys(items).length) m.grant(items);
            else m.toast(NAMES[entry.type] + ': nothing useful.');
            if (weapon) this.offerWeapon(weapon, entry.tier || 1, { x: entry.x, y: entry.y, z: entry.z });
        }

        /** A found weapon: take it straight into a free slot, or drop it as a pickup to swap later. */
        offerWeapon(id, tier, pos) {
            const p = BO.Player;
            const spec = BO.WeaponsData.get(id);
            if (!spec) return;
            const cond = Math.round(35 + Math.random() * 30 + tier * 8);
            if (p.weapons.length < 2) {
                this.give(id, cond);
                this.mode.toast('Found a ' + (spec.name || id) + ' (' + Math.min(100, cond) + '% condition).');
                return;
            }
            this.dropPickup(id, cond, pos, spec.name);
            this.mode.toast('Found a ' + (spec.name || id) + '. Interact with it to swap for your current weapon.');
        }

        give(id, cond, replaceSlot = -1) {
            const p = BO.Player;
            const inst = p._createWeaponInstance({ id, camo: 'default', attachments: {} }, false);
            inst.cond = Math.min(100, cond);
            inst.maxCond = 100;
            const cal = caliberOf(id);
            inst.mag = cal ? Math.floor(inst.stats.magSize * (0.2 + Math.random() * 0.5)) : inst.mag;
            inst.reserve = 0;
            if (replaceSlot >= 0) p.weapons[replaceSlot] = inst;
            else p.weapons.push(inst);
            const slot = replaceSlot >= 0 ? replaceSlot : p.weapons.length - 1;
            p.equipSurvivalSlot(slot, null, true);
            this.mode.campaign.hotbar.reconcile();
            return inst;
        }

        dropPickup(id, cond, pos, name) {
            const key = 'wpn:' + this.pickupIndex++;
            const y = BO.World.getGroundHeight(pos.x + 0.6, pos.z, pos.y + 1);
            const mesh = this.mode.mesh(new THREE.BoxGeometry(0.9, 0.12, 0.22), 0x3a3f44, pos.x + 0.6, y + 0.08, pos.z, { metalness: 0.6, emissive: 0x334155, emissiveIntensity: 0.4 });
            const marker = { id: key, x: pos.x + 0.6, y, z: pos.z, name: name || id, label: 'Swap for ' + (name || id), alive: true, pickup: { id, cond } };
            this.mode.markers.push(marker);
            this.pickups.set(key, { id, cond, mesh, marker, x: marker.x, y, z: marker.z });
        }

        takePickup(marker) {
            const pk = this.pickups.get(marker.id);
            if (!pk) return false;
            const p = BO.Player;
            const slot = p.activeSlot >= 0 ? p.activeSlot : (p.weapons.length < 2 ? -1 : 0);
            if (slot >= 0 && p.weapons[slot]) {
                const old = p.weapons[slot];
                this.dropPickup(old.cfg.id, old.cond ?? 70, p.pos, old.stats.name);
            }
            this.give(pk.id, pk.cond, slot);
            marker.alive = false;
            this.pickups.delete(marker.id);
            this.mode.disposeOwned(pk.mesh);
            this.mode.toast('Equipped ' + (BO.WeaponsData.get(pk.id)?.name || pk.id) + '.');
            return true;
        }

        snapshot() {
            return { searched: [...this.searched], pickups: [...this.pickups.values()].map(({ id, cond, x, y, z }) => ({ id, cond, x, y, z })) };
        }

        restore(s) {
            for (const i of s.searched || []) { const e = this.list[i]; if (e) this.markSearched(e); }
            for (const pk of s.pickups || []) this.dropPickup(pk.id, pk.cond, { x: pk.x - 0.6, y: pk.y, z: pk.z }, BO.WeaponsData.get(pk.id)?.name);
        }
    }

    BO.ZoneLoot = { TABLES: T, NAMES, WEAPON_POOLS, caliberOf, shotNoise, roll, ContainerField };
})(window.BO);
