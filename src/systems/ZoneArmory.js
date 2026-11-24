/* ============================================================================
   BLACKOUT OPS — Zone Armory, Obsidian Tier & Homestead Automation (BO.ZoneArmory)
   · 3D Workbench Gunsmithing: craft & mount real 3D Optics, Suppressors,
     Muzzle Brakes, Foregrips, Lasers, Extended/Drum Mags, Stocks & Camos
     onto any Survival weapon with instant 3D viewmodel rebuild.
   · Resonance Anvil: temper weapon rarity all the way to Legendary, reroll
     traits, and socket Elemental Cores (Obsidian, Cryo, Arc, Solar).
   · Obsidian Tier & Homestead Buildables:
     - obsidian_armor (+140 armor, 180 max armor), obsidian_blade (Reaper Scythe)
     - obsidianWall (1,400 HP blast-proof structural wall)
     - armoryBench (Gunsmith & Anvil bench)
     - planter (buildable crop plot anywhere at your base)
     - rainbarrel (passively collects filtered water; 3× faster in rain)
     - waystone (Resonance Waystone — fast-travel & respawn directly at your base!)
============================================================================ */
(function (BO) {
    'use strict';

    const F = BO.SurvivalFrontierData;
    const CD = BO.SurvivalCampaignData;

    Object.assign(F.items, {
        obsidian_armor: ['Obsidian trauma rig', 'Equipment', 2.4],
        optic_kit: ['Precision optic kit', 'Components', 0.35],
        suppressor_kit: ['Baffled suppressor kit', 'Components', 0.42],
        mag_kit: ['Extended feed kit', 'Components', 0.38]
    });

    F.recipes.push(
        { id: 'obsidianArmor', name: 'Obsidian trauma rig', station: 'bench', cat: 'gear', cost: { obsidian: 4, ingot: 3, leather: 3 }, gain: { obsidian_armor: 1 }, desc: 'Volcanic glass & steel plate carrier: raises max armour to 180 and restores +140 armour.' },
        { id: 'makeOpticKit', name: 'Precision optic kit', station: 'bench', cat: 'weapons', cost: { lens: 1, scrap: 2, wire: 1 }, gain: { optic_kit: 1 }, desc: 'Ground quartz reticle & rail mount for fitting rifle scopes and sights in Gunsmith.' },
        { id: 'makeSuppressorKit', name: 'Baffled suppressor kit', station: 'bench', cat: 'weapons', cost: { ingot: 1, scrap: 2, cloth: 2 }, gain: { suppressor_kit: 1 }, desc: 'Machined baffle stack for mounting suppressors and compensators in Gunsmith.' },
        { id: 'makeMagKit', name: 'Extended feed kit', station: 'bench', cat: 'weapons', cost: { ingot: 1, scrap: 2, wire: 1 }, gain: { mag_kit: 1 }, desc: 'High-tension follower springs, grips and stocks for Gunsmith customization.' },
        { id: 'forgeObsidianScythe', name: 'Forge: Obsidian Reaper', station: 'kiln', cat: 'weapons', cost: { obsidian: 6, ingot: 3, gold: 1, leather: 2 }, gain: {}, desc: 'Forges a Legendary Obsidian-cored Reaper Scythe and equips it.', obsidianWeapon: 'reaper_scythe' }
    );

    if (BO.SurvivalHotbar?.usable) BO.SurvivalHotbar.usable.add('obsidian_armor');

    CD.build.push(
        { id: 'obsidianWall', name: 'Obsidian blast wall', size: [2.8, 2.75, 0.34], cost: { obsidian: 3, brick: 3, ingot: 1 }, color: 0x281e36, detail: '1,400 HP volcanic-glass & masonry fortress wall. Nearly impervious to horde breaches.' },
        { id: 'armoryBench', name: 'Armory & Gunsmith anvil', size: [1.55, 1.0, 0.85], cost: { ingot: 3, planks: 4, scrap: 4 }, color: 0x3b424a, detail: 'Counts as a workbench and opens the 3D Gunsmith & Resonance Anvil to fit scopes, suppressors, camos and cores.' },
        { id: 'planter', name: 'Homestead crop planter', size: [1.44, 0.25, 1.24], cost: { planks: 3, clay: 2, bonemeal: 1 }, color: 0x6b533b, detail: 'A raised garden plot you can build anywhere at your base. Plant seeds, water, fertilise with bone meal and harvest.' },
        { id: 'rainbarrel', name: 'Rainwater collector', size: [0.85, 1.12, 0.85], cost: { planks: 3, ingot: 1, cloth: 1 }, color: 0x456272, detail: 'Passively filters up to 3 fresh water (fills 3× faster during rain). Interact to draw water.' },
        { id: 'waystone', name: 'Resonance waystone', size: [0.95, 2.15, 0.95], cost: { obsidian: 2, quartz: 3, aetherShard: 1, stone: 4 }, color: 0x3a2d54, detail: 'Attunes your base to the Zone network: unlocks direct Fast Travel and Respawn right at your homestead.' }
    );

    const CORES = {
        obsidian: { id: 'obsidian', name: 'Obsidian Razor Core', color: '#c084fc', hex: 0xa855f7, cost: { obsidian: 3, ingot: 1 }, desc: '+16% weapon damage; hits lacerate targets for bonus bleed damage.' },
        cryo: { id: 'cryo', name: 'Cryo Frost Core', color: '#7ee8fa', hex: 0x38bdf8, cost: { quartz: 3, freshWater: 2 }, desc: '+10% weapon damage; 35% chance to chill & slow infected on hit.' },
        arc: { id: 'arc', name: 'Arc Volt Core', color: '#fde047', hex: 0xfacc15, cost: { battery: 2, wire: 2 }, desc: '+10% weapon damage; 30% chance to arc chain lightning to nearby hostiles.' },
        solar: { id: 'solar', name: 'Solar Napalm Core', color: '#fb923c', hex: 0xf97316, cost: { powder: 3, fat: 2 }, desc: '+10% weapon damage; ignites targets for searing fire damage over time.' }
    };

    const RARITY_LADDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    const TEMPER_COST = {
        uncommon: { scrap: 4, ingot: 1 },
        rare: { ingot: 3, quartz: 2 },
        epic: { ingot: 4, gold: 2, aetherShard: 1 },
        legendary: { obsidian: 3, gold: 2, aetherShard: 2 }
    };

    const SLOT_COST = {
        optic: { optic_kit: 1 },
        muzzle: { suppressor_kit: 1 },
        underbarrel: { mag_kit: 1 },
        magazine: { mag_kit: 1 },
        stock: { mag_kit: 1 }
    };

    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    class ZoneArmory {
        constructor() {
            this.mode = null;
            this.uiOpen = null;
            this.el = null;
            this.barrels = new Map();
        }

        get campaign() { return this.mode?.campaign; }

        start(mode, saved) {
            this.stop();
            this.mode = mode;
            this.installOnce();
            if (saved?.barrels) {
                for (const [id, st] of saved.barrels) this.barrels.set(String(id), { stored: st.stored || 0, progress: st.progress || 0 });
            }
            // Register any restored planters, rainbarrels, waystones
            for (const p of mode.campaign?.placed || []) {
                if (p.alive) this.onPiecePlaced(p, true);
            }
            // Ensure restored weapons preserve attachments & cores
            for (const w of BO.Player.weapons || []) this.recomputeWeapon(w, false);
            BO.Player.rebuildViewmodel?.();
        }

        stop() {
            this.close(true);
            this.barrels.clear();
            this.mode = null;
        }

        snapshot() {
            return {
                barrels: [...this.barrels.entries()].map(([id, b]) => [id, { stored: b.stored, progress: +b.progress.toFixed(1) }])
            };
        }

        installOnce() {
            if (this._installed) return;
            this._installed = true;
            const self = this;
            const C = BO.SurvivalCampaign.prototype;

            // Armory bench counts as a workbench
            const stAvail = C.stationAvailable;
            C.stationAvailable = function (type) {
                if (stAvail.call(this, type)) return true;
                if (type === 'bench') return stAvail.call(this, 'armoryBench');
                return false;
            };

            // Decorate & register new buildables when placed
            const place = C.place;
            C.place = function (piece) {
                place.call(this, piece);
                if (piece.alive) self.onPiecePlaced(piece, false);
            };

            // Dismantling cleans up custom plots / barrels / waystone markers
            const D = BO.SurvivalDeepSystems?.prototype;
            if (D?.dismantleNearest) {
                const dism = D.dismantleNearest;
                D.dismantleNearest = function () {
                    const before = this.campaign.placed.filter((x) => x.alive);
                    const res = dism.call(this);
                    for (const p of before) if (!p.alive) self.onPieceRemoved(p);
                    return res;
                };
            }

            // Waystones add fast-travel & respawn points!
            const O = BO.SurvivalObjectives.prototype;
            const tp = O.travelPoints;
            O.travelPoints = function () {
                const list = tp.call(this);
                let n = 1;
                for (const p of this.campaign.placed) {
                    if (p.alive && p.type === 'waystone') {
                        list.push({ id: 'waystone:' + p.id, name: 'Homestead Waystone' + (n > 1 ? ' #' + n : ''), x: p.x + 1.4, y: p.y, z: p.z + 1.4, kind: 'Waystone' });
                        n++;
                    }
                }
                return list;
            };
            const rp = C.respawnPoint;
            C.respawnPoint = function () {
                const ws = this.placed.find((p) => p.alive && p.type === 'waystone');
                if (ws && (!this.placed.some((p) => p.alive && p.type === 'bed'))) {
                    return { x: ws.x + 1.2, y: BO.World.getGroundHeight(ws.x + 1.2, ws.z, 80), z: ws.z, name: 'your Resonance Waystone' };
                }
                return rp.call(this);
            };

            // Obsidian Reaper forge recipe hook
            const P = BO.SurvivalPack.prototype;
            const craft = P.craft;
            P.craft = function (id) {
                const ok = craft.call(this, id);
                const rec = ok && this.recipe(id);
                if (rec?.obsidianWeapon && self.mode) {
                    const slot = BO.Player.activeSlot >= 0 ? BO.Player.activeSlot : (BO.Player.weapons.length < 2 ? -1 : 0);
                    const roll = { rarity: 'legendary', perks: ['vampiric', 'lightweight', 'durable'], title: 'Crater\'s Edge' };
                    const w = self.mode.loot.give(rec.obsidianWeapon, 100, slot, roll);
                    if (w) { w.cfg.survCore = 'obsidian'; self.recomputeWeapon(w, true); }
                    this.campaign.mark('obsidianForged', 1, 100);
                }
                if (ok && id === 'obsidianArmor') this.campaign.mark('obsidianForged', 1, 60);
                return ok;
            };

            // Elemental Core proc on hit! SurvivalMode.hit(entity, amount, hitbox, dir, damageKind, agent)
            const M = BO.SurvivalMode;
            const hit = M.hit.bind(M);
            M.hit = function (entity, amount, hitbox, dir, damageKind, agent = null) {
                const w = !agent ? BO.Player.activeWeapon : null;
                const core = (damageKind === 'bullet' || (damageKind === 'melee' && w?.stats?.kind === 'melee')) ? w?.cfg?.survCore : null;
                if (core && entity?.alive && entity.team !== 0) {
                    const pt = entity.pos?.clone()?.setY((entity.pos.y || 0) + 1.0);
                    if (core === 'obsidian') {
                        amount *= 1.12;
                        if (pt) BO.FX?.spawnParticles?.(pt, 5, 0xa855f7, 3.0, 5, 0.35);
                    } else if (core === 'cryo' && Math.random() < 0.38) {
                        entity.frozenTimer = Math.max(entity.frozenTimer || 0, 2.4);
                        entity.stunTimer = Math.max(entity.stunTimer || 0, 0.65);
                        if (pt) BO.FX?.spawnParticles?.(pt, 6, 0x38bdf8, 2.8, 3, 0.4);
                    } else if (core === 'solar' && Math.random() < 0.45) {
                        entity.burnTimer = Math.max(entity.burnTimer || 0, 4.0);
                        amount *= 1.08;
                        if (pt) BO.FX?.spawnParticles?.(pt, 6, 0xf97316, 3.2, 4, 0.4);
                    } else if (core === 'arc' && Math.random() < 0.32 && !this._arcChain) {
                        this._arcChain = true;
                        for (const z2 of this.zombies) {
                            if (z2 !== entity && z2.alive && z2.pos.distanceTo(entity.pos) < 5.5) {
                                if (pt) BO.FX?.spawnTracer?.(pt, z2.pos.clone().setY(z2.pos.y + 0.95), 0xfacc15, 0.03, 0.12);
                                hit(z2, Math.round(amount * 0.55), 'torso', null, 'bullet', null);
                                break;
                            }
                        }
                        this._arcChain = false;
                    }
                }
                return hit(entity, amount, hitbox, dir, damageKind, agent);
            };
        }

        onPiecePlaced(piece, restored = false) {
            const m = this.mode;
            if (!m) return;
            const { x, y, z, type } = piece;
            const extras = (piece._armoryMeshes = piece._armoryMeshes || []);
            const addM = (geo, col, px, py, pz, opt = {}) => {
                const mesh = m.mesh(geo, col, px, py, pz, opt);
                extras.push(mesh);
                return mesh;
            };
            if (type === 'obsidianWall') {
                if (!piece.part) {
                    const [w, h, d] = piece.size;
                    const part = m.addStructure(piece.mesh, w, h, d, 'brick');
                    part.hp = part.maxHp = Number.isFinite(piece.hp) ? piece.hp : 1400;
                    part.buildPiece = piece;
                    piece.part = part;
                } else {
                    piece.part.maxHp = 1400;
                    if (!Number.isFinite(piece.hp)) piece.part.hp = 1400;
                }
                if (piece.mesh?.material) {
                    piece.mesh.material.metalness = 0.55;
                    piece.mesh.material.roughness = 0.28;
                    piece.mesh.material.emissive = new THREE.Color(0x3b1d6e);
                    piece.mesh.material.emissiveIntensity = 0.22;
                }
            } else if (type === 'armoryBench') {
                addM(new THREE.BoxGeometry(0.45, 0.28, 0.32), 0x22262b, x - 0.38, y + 1.14, z, { metalness: 0.85, roughness: 0.3 });
                addM(new THREE.BoxGeometry(0.65, 0.08, 0.18), 0x8fe3c8, x + 0.28, y + 1.05, z - 0.15, { emissive: 0x2dd4bf, emissiveIntensity: 0.6 });
                m.markers.push({ ...piece, id: 'build:' + piece.id, name: 'Armory & Gunsmith Anvil', label: 'Open Gunsmith & Resonance Anvil', alive: true, armoryStation: true });
            } else if (type === 'planter') {
                if (piece.mesh) piece.mesh.visible = false; // SurvivalActivities renders rim, soil & growing crop shoots
                m.campaign?.activities?.addCustomPlot?.(piece);
            } else if (type === 'rainbarrel') {
                if (piece.mesh) piece.mesh.visible = false;
                addM(new THREE.CylinderGeometry(0.42, 0.38, 1.08, 12), 0x3d5c6c, x, y + 0.54, z, { roughness: 0.6, metalness: 0.25 });
                const water = addM(new THREE.CircleGeometry(0.37, 12), 0x56b4d3, x, y + 1.09, z, { emissive: 0x0284c7, emissiveIntensity: 0.35 });
                water.rotation.x = -Math.PI / 2;
                if (!this.barrels.has(String(piece.id))) this.barrels.set(String(piece.id), { stored: restored ? 1 : 0, progress: 0 });
                const mk = { ...piece, id: 'build:' + piece.id, name: 'Rainwater collector', label: 'Rainwater collector (filling…)', alive: true, rainBarrel: String(piece.id) };
                piece._armoryMarker = mk;
                m.markers.push(mk);
            } else if (type === 'waystone') {
                if (piece.mesh) piece.mesh.visible = false;
                addM(new THREE.BoxGeometry(0.95, 0.28, 0.95), 0x3e3a46, x, y + 0.14, z);
                const spire = addM(new THREE.OctahedronGeometry(0.42), 0x8fe3c8, x, y + 1.38, z, { emissive: 0x6d28d9, emissiveIntensity: 0.95, metalness: 0.5 });
                spire.scale.set(0.85, 2.2, 0.85);
                m.campaign?.pack?.addLight?.('ws:' + piece.id, { x, y: y + 0.5, z });
                const mk = { ...piece, id: 'build:' + piece.id, name: 'Resonance Waystone', label: 'Use Resonance Waystone (Fast Travel)', alive: true, waystone: true };
                piece._armoryMarker = mk;
                m.markers.push(mk);
                if (!restored) m.campaign?.mark('waystonesBuilt', 1, 75);
            }
        }

        onPieceRemoved(piece) {
            if (!piece || !this.mode) return;
            for (const mesh of piece._armoryMeshes || []) this.mode.disposeOwned(mesh);
            piece._armoryMeshes = [];
            if (piece.type === 'planter') this.campaign?.activities?.removeCustomPlot?.(piece.id);
            if (piece.type === 'rainbarrel') this.barrels.delete(String(piece.id));
            if (piece._armoryMarker) piece._armoryMarker.alive = false;
        }

        activate(marker) {
            const m = this.mode;
            if (!m || !marker) return false;
            if (marker.armoryStation) {
                this.open(BO.Player.activeSlot >= 0 ? BO.Player.activeSlot : 0);
                return true;
            }
            if (marker.waystone) {
                BO.SurvivalUI.show('map');
                return true;
            }
            if (marker.rainBarrel !== undefined) {
                const st = this.barrels.get(marker.rainBarrel);
                if (!st || st.stored < 1) {
                    m.toast('Rainwater collector is still filtering water (' + Math.floor((st?.progress || 0) / 45 * 100) + '%).');
                    return true;
                }
                if (this.campaign.pack.room('freshWater', 1) < 1) {
                    m.toast('Backpack is too full for filtered water.');
                    return true;
                }
                const take = st.stored;
                st.stored = 0;
                m.grant({ freshWater: take });
                this.campaign.mark('waterDrawn', take, 3);
                return true;
            }
            return false;
        }

        update(dt) {
            const m = this.mode;
            if (!m || !m.active) return;
            const raining = /rain|storm|blizzard/i.test(m.localWeather || m.weather || '');
            const rate = (raining ? 3.0 : 1.0) * (this.campaign?.has('sv_no_cooldowns') ? 25 : 1);
            for (const p of this.campaign?.placed || []) {
                if (!p.alive || p.type !== 'rainbarrel') continue;
                const st = this.barrels.get(String(p.id));
                if (!st) continue;
                if (st.stored < 3) {
                    st.progress += dt * rate;
                    if (st.progress >= 45) {
                        st.progress = 0;
                        st.stored++;
                    }
                }
                if (p._armoryMarker) {
                    p._armoryMarker.label = st.stored > 0
                        ? `Draw filtered water (${st.stored}/3 ready)`
                        : `Rainwater collector · ${Math.min(99, Math.floor(st.progress / 45 * 100))}%${raining ? ' (rain ×3)' : ''}`;
                }
            }
        }

        /* ------------------------------------------------------------ Weapon Refit & Gunsmith UI */
        recomputeWeapon(w, rebuildVm = true) {
            if (!w || !w.cfg) return w;
            const P = BO.Player;
            w._fit = null;
            w.stats = BO.Loadout.computeWeaponStats(w.cfg, w.papTier || 0, P.mpPerks || [], !!w.isDualWield);
            const mk = w.survivalMk || 1;
            if (mk >= 2 && w.stats.kind !== 'melee') {
                w.stats.damage = Math.round(w.stats.damage * 1.24);
                w.stats.magSize = Math.ceil(w.stats.magSize * 1.20);
                w.stats.reloadTime = Number((w.stats.reloadTime * 0.88).toFixed(2));
            }
            if (mk >= 3 && w.stats.kind !== 'melee') {
                w.stats.damage = Math.round(w.stats.damage * 1.19);
                w.stats.magSize = Math.ceil(w.stats.magSize * 1.16);
                w.stats.reloadTime = Number((w.stats.reloadTime * 0.88).toFixed(2));
            }
            if (w.cfg.survCore && CORES[w.cfg.survCore]) {
                w.stats.damage = Math.round(w.stats.damage * (w.cfg.survCore === 'obsidian' ? 1.16 : 1.10));
            }
            BO.ZoneThrill?.refit(w);
            if (w.mag > w.stats.magSize) w.mag = w.stats.magSize;
            if (rebuildVm) P.rebuildViewmodel?.();
            return w;
        }

        open(slotIndex = 0) {
            const P = BO.Player;
            if (!P.weapons.length) {
                this.mode?.toast('You are not carrying a weapon to customize.');
                return;
            }
            const slot = BO.Math.clamp(slotIndex, 0, P.weapons.length - 1);
            this.uiOpen = { slot, tab: 'attachments' };
            if (document.pointerLockElement) document.exitPointerLock();
            this.render();
        }

        close(silent = false) {
            if (!this.uiOpen) return;
            this.uiOpen = null;
            this.el?.remove();
            this.el = null;
            if (!silent && BO.State.screen === 'playing') BO.App?._safePointerLock?.();
        }

        handleKey(e) {
            if (!this.uiOpen) return false;
            if (e.code === 'Escape') { e.preventDefault(); this.close(); }
            return true;
        }

        render() {
            const st = this.uiOpen;
            if (!st || !this.mode) return;
            if (!this.el) {
                this.el = document.createElement('div');
                this.el.className = 'zt-box zt-armory';
                document.body.appendChild(this.el);
                this.el.addEventListener('click', (e) => this.onClick(e));
            }
            const P = BO.Player;
            const m = this.mode;
            const w = P.weapons[st.slot] || P.weapons[0];
            if (!w) return this.close();
            const spec = BO.WeaponsData.get(w.cfg.id);
            const melee = !spec || spec.kind === 'melee' || spec.kind === 'magic';
            const rar = BO.ZoneThrill ? BO.ZoneThrill.describe({ rarity: w.cfg.rarity || 'common', perks: w.cfg.perks || [], title: w.cfg.title }, w.stats.shortName || spec?.name) : null;
            const curRarIdx = Math.max(0, RARITY_LADDER.indexOf(w.cfg.rarity || 'common'));
            const nextRar = RARITY_LADDER[curRarIdx + 1] || null;
            const have = m.points;
            const costStr = (cost) => Object.entries(cost).map(([k, v]) => `${BO.SurvivalItemName(k)} ×${v} (${have[k] || 0})`).join(', ');

            const wTabs = P.weapons.map((wp, idx) => `<button data-arm-slot="${idx}" class="${idx === st.slot ? 'on' : ''}">Slot ${idx + 1}: ${esc(wp.stats.shortName || wp.stats.name)}</button>`).join('');
            const modeTabs = ['attachments', 'anvil', 'camos'].map((t) => `<button data-arm-tab="${t}" class="${st.tab === t ? 'on' : ''}">${t === 'attachments' ? '3D Attachments' : t === 'anvil' ? 'Resonance Anvil' : 'Paint & Camos'}</button>`).join('');

            let content = '';
            if (st.tab === 'attachments') {
                if (melee) {
                    content = `<p class="sv-muted" style="padding:14px">Melee & Wonder weapons do not take rail attachments — switch to <b>Resonance Anvil</b> or <b>Paint & Camos</b> to temper rarity, traits and Elemental Cores!</p>`;
                } else {
                    const slots = ['optic', 'muzzle', 'underbarrel', 'magazine', 'stock'];
                    content = slots.map((sKey) => {
                        const opts = BO.AttachmentsData.ATTACHMENTS[sKey] || [];
                        const cur = w.cfg.attachments?.[sKey] || opts[0]?.id;
                        const kitCost = SLOT_COST[sKey];
                        const afford = m.canAfford(kitCost);
                        return `<div class="zt-arm-group"><h4>${sKey.toUpperCase()} <small>Fitting cost: ${esc(costStr(kitCost))}</small></h4>
                            <div class="zt-box-grid">${opts.map((o, idx) => {
                                const active = cur === o.id;
                                const free = idx === 0;
                                return `<button data-arm-att="${sKey}:${o.id}" class="${active ? 'equipped' : ''}" ${!active && !free && !afford ? 'disabled' : ''}>
                                    <b>${active ? '✓ ' : ''}${esc(o.name)}</b><small>${esc(o.desc)}</small></button>`;
                            }).join('')}</div></div>`;
                    }).join('');
                }
            } else if (st.tab === 'anvil') {
                const tCost = nextRar ? TEMPER_COST[nextRar] : null;
                const canTemper = tCost && m.canAfford(tCost);
                const rerollCost = { quartz: 2, scrap: 3 };
                const canReroll = (w.cfg.perks?.length > 0 || curRarIdx > 0) && m.canAfford(rerollCost);
                content = `<div class="zt-arm-group"><h4>RARITY & TRAIT FORGING</h4>
                    <div class="zt-box-grid">
                        <button data-arm-temper ${canTemper ? '' : 'disabled'}>
                            <b>${nextRar ? 'Temper to ' + nextRar.toUpperCase() : '✓ Maximum Rarity (Legendary)'}</b>
                            <small>${tCost ? 'Cost: ' + esc(costStr(tCost)) + ' · boosts damage & unlocks extra weapon trait!' : 'This weapon has reached peak rarity.'}</small>
                        </button>
                        <button data-arm-reroll ${canReroll ? '' : 'disabled'}>
                            <b>Reroll Weapon Traits</b>
                            <small>Cost: ${esc(costStr(rerollCost))} · Current: ${esc(rar?.traits?.join(', ') || 'None')}</small>
                        </button>
                    </div></div>
                    <div class="zt-arm-group"><h4>ELEMENTAL RESONANCE CORES <small>Socket one active core onto this weapon</small></h4>
                    <div class="zt-box-grid">${Object.values(CORES).map((c) => {
                        const on = w.cfg.survCore === c.id;
                        const ok = m.canAfford(c.cost);
                        return `<button data-arm-core="${c.id}" class="${on ? 'equipped' : ''}" ${!on && !ok ? 'disabled' : ''}>
                            <b style="color:${c.color}">${on ? '✓ ' : ''}${esc(c.name)}</b>
                            <small>${esc(c.desc)}<br>Cost: ${esc(costStr(c.cost))}</small></button>`;
                    }).join('')}</div></div>`;
            } else {
                const camos = BO.AttachmentsData.CAMOS || [];
                content = `<div class="zt-arm-group"><h4>WEAPON FINISHES</h4><div class="zt-box-grid">${camos.map((cm) => {
                    const on = (w.cfg.camo || 'default') === cm.id;
                    const cost = cm.id === 'default' ? {} : cm.id === 'gold' ? { gold: 2 } : cm.id === 'dark_matter' ? { obsidian: 2, aetherShard: 1 } : { resin: 1, herbs: 1 };
                    const ok = Object.keys(cost).length === 0 || m.canAfford(cost);
                    return `<button data-arm-camo="${cm.id}" class="${on ? 'equipped' : ''}" ${!on && !ok ? 'disabled' : ''}>
                        <b>${on ? '✓ ' : ''}${esc(cm.name)}</b>
                        <small>${Object.keys(cost).length ? 'Cost: ' + esc(costStr(cost)) : 'Standard finish'}</small></button>`;
                }).join('')}</div></div>`;
            }

            this.el.innerHTML = `<div class="zt-box-in"><header>
                <b>GUNSMITH & RESONANCE ANVIL</b>
                <span><strong style="color:${rar?.rarity?.color || '#cfe8df'}">${esc(rar ? rar.rarity.name + ' ' + rar.title : w.stats.name)}</strong> · DMG ${Math.round(w.stats.damage)} · MAG ${w.stats.magSize}${w.cfg.survCore ? ' · ' + esc(CORES[w.cfg.survCore].name) : ''}</span>
                <button data-arm-close>Close · Esc</button></header>
                <nav>${wTabs}<span style="flex:1"></span>${modeTabs}</nav>
                <div class="zt-arm-body">${content}</div></div>`;
        }

        onClick(e) {
            const btn = e.target.closest('button');
            if (!btn || !this.uiOpen || !this.mode) return;
            const d = btn.dataset;
            const m = this.mode;
            const P = BO.Player;
            const w = P.weapons[this.uiOpen.slot];
            if (d.armClose !== undefined) return this.close();
            if (d.armSlot !== undefined) { this.uiOpen.slot = +d.armSlot; P.equipSurvivalSlot(this.uiOpen.slot, null, true); this.campaign?.hotbar?.reconcile(); return this.render(); }
            if (d.armTab) { this.uiOpen.tab = d.armTab; return this.render(); }
            if (!w) return;

            if (d.armAtt) {
                const [sKey, attId] = d.armAtt.split(':');
                const opts = BO.AttachmentsData.ATTACHMENTS[sKey] || [];
                const isFactory = opts[0]?.id === attId;
                if (w.cfg.attachments?.[sKey] === attId) return;
                if (!isFactory && !m.spend(SLOT_COST[sKey])) { m.toast('Craft the required kit at a workbench first.'); return; }
                w.cfg.attachments = w.cfg.attachments || {};
                w.cfg.attachments[sKey] = attId;
                P.equipSurvivalSlot(this.uiOpen.slot, null, true);
                this.recomputeWeapon(w, true);
                this.campaign?.mark('gunsmithMods', 1, 35);
                BO.Sound?.playReload?.('bolt');
                m.toast('Fitted ' + (opts.find((o) => o.id === attId)?.name || attId) + '!');
                return this.render();
            }
            if (d.armTemper !== undefined) {
                const idx = Math.max(0, RARITY_LADDER.indexOf(w.cfg.rarity || 'common'));
                const next = RARITY_LADDER[idx + 1];
                if (!next || !m.spend(TEMPER_COST[next])) return;
                const fresh = BO.ZoneThrill?.rollWeapon(w.cfg.id, 4, idx + 1, 2);
                w.cfg.rarity = next;
                if (fresh?.perks) {
                    const keep = new Set([...(w.cfg.perks || []), ...fresh.perks]);
                    w.cfg.perks = [...keep].slice(0, idx + 1);
                }
                if (next === 'legendary' && !w.cfg.title && fresh?.title) w.cfg.title = fresh.title;
                this.recomputeWeapon(w, true);
                this.campaign?.mark('gunsmithMods', 1, 65);
                BO.Sound?.playPaP?.();
                m.toast('Tempered weapon to ' + next.toUpperCase() + '!');
                return this.render();
            }
            if (d.armReroll !== undefined) {
                const idx = Math.max(1, RARITY_LADDER.indexOf(w.cfg.rarity || 'common'));
                if (!m.spend({ quartz: 2, scrap: 3 })) return;
                const fresh = BO.ZoneThrill?.rollWeapon(w.cfg.id, 4, idx, 2);
                if (fresh?.perks) w.cfg.perks = fresh.perks.slice(0, idx);
                this.recomputeWeapon(w, true);
                BO.Sound?.playPerkBuy?.();
                m.toast('Weapon traits reforged!');
                return this.render();
            }
            if (d.armCore) {
                const core = CORES[d.armCore];
                if (!core || w.cfg.survCore === core.id) return;
                if (!m.spend(core.cost)) return;
                w.cfg.survCore = core.id;
                this.recomputeWeapon(w, true);
                this.campaign?.mark('gunsmithMods', 1, 50);
                BO.Sound?.playPaP?.();
                m.toast('Socketed ' + core.name + '!');
                return this.render();
            }
            if (d.armCamo) {
                const cm = d.armCamo;
                if ((w.cfg.camo || 'default') === cm) return;
                const cost = cm === 'default' ? {} : cm === 'gold' ? { gold: 2 } : cm === 'dark_matter' ? { obsidian: 2, aetherShard: 1 } : { resin: 1, herbs: 1 };
                if (Object.keys(cost).length && !m.spend(cost)) return;
                w.cfg.camo = cm;
                P.equipSurvivalSlot(this.uiOpen.slot, null, true);
                this.recomputeWeapon(w, true);
                BO.Sound?.playUIClick?.();
                m.toast('Applied finish!');
                return this.render();
            }
        }
    }

    BO.ZoneArmory = new ZoneArmory();
    BO.ZoneArmory.CORES = CORES;
})(window.BO);
