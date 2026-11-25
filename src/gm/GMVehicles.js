/* ============================================================================
   BLACKOUT OPS — Survival 1.0: Physical vehicles
   Every vehicle is a real object in the world: it stays where you park it,
   shows on map and compass, burns fuel, takes damage and carries a trunk.
   · ENTER: press Interact (E) at the vehicle, or the Ride key (N) within 6 m.
   · EXIT: Interact or Ride key, any time under 25 km/h. The exit point tries
     left, right, rear, front, then the roof, so you never get stuck in a wall.
   · SHIFT+E at a parked vehicle opens its panel: trunk, refuel, repair.
   · Classes by kind: bicycles, boards, carts and sledges need no fuel; horses
     come when you whistle (Ride key with no vehicle near, within 150 m);
     motor vehicles burn fuel by distance; trucks and APCs carry the most.
   · Trunk loot stays Hot until you stash it at base. Wrecked vehicles drop
     their trunk as a bag; repair them on the spot.
   · The Boat (schematic from the Drowned Choir) is fast on water, useless on land.
============================================================================ */
(function (BO) {
    'use strict';
    const GM = BO.GM;
    const CD = () => BO.SurvivalCampaignData;

    const CLASS = {
        bike: { fuel: 0, trunk: 2, hp: 60, label: 'Bicycle' },
        board: { fuel: 0, trunk: 0, hp: 80, label: 'Board' },
        cart: { fuel: 0, trunk: 6, hp: 90, label: 'Electric cart' },
        sledge: { fuel: 0, trunk: 8, hp: 80, label: 'Sledge' },
        horse: { fuel: 0, trunk: 6, hp: 160, label: 'Mount', animal: true },
        moto: { fuel: 8, trunk: 2, hp: 110, burn: 1 / 650, label: 'Motorbike' },
        mono: { fuel: 6, trunk: 0, hp: 100, burn: 1 / 600, label: 'Monowheel' },
        kart: { fuel: 6, trunk: 0, hp: 100, burn: 1 / 600, label: 'Kart' },
        quad: { fuel: 10, trunk: 4, hp: 150, burn: 1 / 560, label: 'ATV' },
        sled: { fuel: 10, trunk: 4, hp: 140, burn: 1 / 560, label: 'Snowmobile' },
        tractor: { fuel: 12, trunk: 8, hp: 220, burn: 1 / 520, label: 'Tractor' },
        car: { fuel: 14, trunk: 10, hp: 240, burn: 1 / 480, armor: 0.7, label: 'Car' },
        truck: { fuel: 18, trunk: 24, hp: 320, burn: 1 / 380, armor: 0.65, label: 'Truck' },
        apc: { fuel: 24, trunk: 16, hp: 520, burn: 1 / 300, armor: 0.45, label: 'Armoured' },
        boat: { fuel: 10, trunk: 8, hp: 160, burn: 1 / 520, label: 'Boat', water: true }
    };
    const classOf = (spec) => CLASS[spec?.kind] || CLASS.car;

    const Vehicles = {
        rate: 0,

        start(mode, saved) {
            this.mode = mode;
            this.list = [];
            this.riding = null;
            this.nextUid = saved?.nextUid || 1;
            this.install();
            this.patch();
            const c = mode.campaign;
            for (const v of saved?.list || []) this.spawn(v);
            // Migration: vehicles you own (old saves, kits) without a world object park near home.
            const home = GM.get('base')?.homePoint?.() || BO.Player.pos;
            let k = 0;
            for (const id of c.vehicles) {
                if (this.list.some((v) => v.spec === id)) continue;
                const x = home.x + 3 + (k % 3) * 3, z = home.z + 3 + Math.floor(k / 3) * 3;
                this.spawn({ spec: id, x, z, fuel: 0.6, hp: 1, owned: true });
                k++;
            }
            if (saved?.ridingUid) {
                const v = this.list.find((x) => x.uid === saved.ridingUid);
                if (v) this.enter(v, true);
            } else if (c.vehicle) c.vehicle = null;
        },

        stop() {
            this.unpatch();
            for (const v of this.list || []) v.model?.removeFromParent();
            this.list = [];
            this.riding = null;
            this.mode = null;
        },

        snapshot() {
            return {
                nextUid: this.nextUid,
                ridingUid: this.riding?.uid || null,
                list: this.list.map((v) => ({ uid: v.uid, spec: v.spec, x: v.x, y: v.y, z: v.z, yaw: v.yaw, hp: v.hp, fuel: v.fuel, owned: v.owned, wrecked: v.wrecked }))
            };
        },

        install() {
            if (this._installed) return;
            this._installed = true;
            if (!CD().vehicles.some((v) => v.id === 'boat')) {
                CD().vehicles.push({ id: 'boat', name: 'Reservoir skiff', kind: 'boat', speed: 2.6, offroad: 0.25, color: 0x3b6e8f, noise: 2.5, level: Infinity, gmLocked: 'rebreather', build: { planks: 10, ingot: 3, engine_parts: 1, cord: 4 }, detail: 'Fast and fairly quiet on the reservoir and wetlands; crawls on land. Schematic from the Drowned Choir.' });
                BO.SurvivalFrontierData.recipes.push({ id: 'veh_boat', name: 'Build: Reservoir skiff', station: 'bench', cost: { planks: 10, ingot: 3, engine_parts: 1, cord: 4 }, gain: {}, desc: 'A small outboard skiff. Needs the Drowned Choir schematic.', vehicle: 'boat', cat: 'vehicles', gmReward: 'rebreather' });
            }
            BO.SurvivalFrontierData.items.fuelCan = BO.SurvivalFrontierData.items.fuelCan || ['Jerry can', 'Equipment', 1.2];
        },

        /* ---------------------------------------------------------- patches */
        patch() {
            const m = this.mode;
            const c = m.campaign;
            const W = BO.ZoneWild;
            const self = this;
            this._orig = { ride: c.ride, claim: W?.claim, craft: c.pack.craft, canCraft: c.pack.canCraft };
            c.ride = function (id) {
                // Only the GM may put you on a vehicle; anything else can only dismount.
                if (!id || this.vehicle === id) { if (self.riding) self.exit(true); else { this.vehicle = null; } return true; }
                if (self._entering) return self._orig.ride.call(this, id);
                const v = self.list.find((x) => x.spec === id && !x.wrecked);
                if (v && GM.dist2(v, BO.Player.pos) < 6) return self.enter(v);
                GM.toast('Walk to the vehicle to get in.', '#cbd5e1');
                return false;
            };
            if (W && this._orig.claim) {
                W.claim = function (marker) {
                    const spec = CD().vehicles.find((v) => v.id === marker.vehicle);
                    marker.alive = false;
                    marker.model?.removeFromParent();
                    this.claimed?.add(marker.vehicle);
                    c.vehicles.add(marker.vehicle);
                    c.mark('vehiclesClaimed', 1, 40);
                    const v = self.spawn({ spec: marker.vehicle, x: marker.x, y: marker.y, z: marker.z, yaw: 0.6, fuel: 0.3, hp: 0.6, owned: true });
                    GM.banner('VEHICLE CLAIMED', (spec?.name || 'Vehicle').toUpperCase() + ' · ' + (classOf(spec).fuel ? 'FUEL 30%' : 'NO FUEL NEEDED') + ' · E TO ENTER, SHIFT+E FOR TRUNK & REPAIRS', '#8fe3c8');
                    GM.first('vehicle', 'Vehicle', 'Park it, fuel it, fill the trunk');
                    self.enter(v);
                };
            }
            c.pack.canCraft = function (recipe) {
                if (recipe?.gmReward && !GM.get('bosses')?.hasReward?.(recipe.gmReward)) return false;
                return self._orig.canCraft.call(this, recipe);
            };
            c.pack.craft = function (id) {
                const recipe = this.recipe(id);
                const ok = self._orig.craft.call(this, id);
                if (ok && recipe?.vehicle) {
                    const p = BO.Player.pos;
                    const f = BO.Player.getMoveDirectionVectors().forward;
                    c.vehicles.add(recipe.vehicle);
                    self.spawn({ spec: recipe.vehicle, x: p.x + f.x * 3, z: p.z + f.z * 3, fuel: 0.5, hp: 1, owned: true });
                    GM.toast('Built and parked in front of you.', '#4ade80');
                }
                return ok;
            };
        },

        unpatch() {
            if (!this._orig || !this.mode) return;
            const c = this.mode.campaign;
            c.ride = this._orig.ride;
            if (BO.ZoneWild && this._orig.claim) BO.ZoneWild.claim = this._orig.claim;
            c.pack.craft = this._orig.craft;
            c.pack.canCraft = this._orig.canCraft;
            this._orig = null;
        },

        /* ---------------------------------------------------------- world objects */
        spawn(data) {
            const m = this.mode;
            const spec = CD().vehicles.find((v) => v.id === data.spec);
            if (!spec) return null;
            const cls = classOf(spec);
            const y = data.y ?? GM.ground(data.x, data.z);
            const v = {
                uid: data.uid || ('v' + this.nextUid++), spec: spec.id, specRef: spec, cls,
                x: data.x, y, z: data.z, yaw: data.yaw ?? 0, hp: data.hp ?? 1, fuel: data.fuel ?? 0.5,
                owned: data.owned !== false, wrecked: !!data.wrecked
            };
            const model = BO.ZoneWild?.vehicleModelFor ? BO.ZoneWild.vehicleModelFor(spec) : null;
            if (model) {
                if (!model.parent) m.scene.add(model);
                model.position.set(v.x, v.y, v.z);
                model.rotation.y = v.yaw;
            }
            v.model = model;
            v.marker = { id: 'gmveh:' + v.uid, x: v.x, y: v.y, z: v.z, name: spec.name, alive: true, reach: 3.4, gmVehicle: v.uid };
            m.markers.push(v.marker);
            this.list.push(v);
            this.refreshMarker(v);
            if (v.wrecked) this.styleWreck(v);
            return v;
        },

        refreshMarker(v) {
            const parts = [];
            if (v.wrecked) parts.push('WRECKED — Shift+E to repair');
            else {
                parts.push('Enter ' + v.specRef.name);
                if (v.cls.fuel) parts.push('fuel ' + Math.round(v.fuel * 100) + '%');
                parts.push('HP ' + Math.round(v.hp * 100) + '%');
                parts.push('Shift+E: trunk & repair');
            }
            v.marker.label = parts.join(' · ');
            v.marker.x = v.x; v.marker.y = v.y; v.marker.z = v.z;
        },

        styleWreck(v) {
            v.model?.traverse?.((o) => { if (o.isMesh && o.material?.color) { o.material = o.material.clone(); o.material.color.multiplyScalar(0.35); } });
        },

        /* ---------------------------------------------------------- enter / exit */
        enter(v, silent = false) {
            const m = this.mode;
            const c = m.campaign;
            if (v.wrecked) { GM.toast('It is wrecked. Shift+E to repair it.', '#f59e0b'); return false; }
            if (v.cls.water && !BO.Zone.inReservoir(v.x, v.z)) GM.toast('A boat crawls on land. Drag it to the water.', '#cbd5e1');
            this._entering = true;
            const ok = this._orig.ride.call(c, v.spec);
            this._entering = false;
            if (!ok) { GM.toast('You cannot ride right now.', '#f59e0b'); return false; }
            const p = BO.Player;
            p.pos.set(v.x, v.y + 0.1, v.z);
            p.vel.set(0, 0, 0);
            p.yaw = v.yaw;
            this.riding = v;
            v.marker.alive = false;
            if (v.model) v.model.visible = false;
            if (!silent) {
                BO.Sound?.playReload?.('in');
                if (v.cls.fuel && v.fuel <= 0) GM.toast('The tank is dry. Refuel it (Shift+E) or push it at a crawl.', '#f59e0b');
            }
            return true;
        },

        exitPoint(v) {
            const p = BO.Player;
            const yaw = p.yaw || 0;
            const right = { x: Math.cos(yaw), z: -Math.sin(yaw) };
            const fwd = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
            const tries = [[right, 1.7], [{ x: -right.x, z: -right.z }, 1.7], [{ x: -fwd.x, z: -fwd.z }, 2.4], [fwd, 2.6], [right, 2.6], [{ x: -right.x, z: -right.z }, 2.6]];
            for (const [d, r] of tries) {
                const x = p.pos.x + d.x * r, z = p.pos.z + d.z * r;
                const y = GM.ground(x, z, p.pos.y + 1.5);
                if (Math.abs(y - p.pos.y) > 1.6) continue;
                if (BO.Zone.inReservoir(x, z) && BO.World.terrainHeight(x, z) < BO.Zone.WATER - 1.35 && !v.cls.water) continue;
                let blocked = false;
                BO.World.queryColliders(x - 0.35, z - 0.35, x + 0.35, z + 0.35, (col) => {
                    if (col.active && col.maxY > y + 0.15 && col.minY < y + 1.75) { blocked = true; return true; }
                    return false;
                });
                if (!blocked) return { x, y: y + 0.05, z };
            }
            return { x: p.pos.x, y: p.pos.y + 1.6, z: p.pos.z }; // the roof always works
        },

        exit(force = false) {
            const m = this.mode;
            const c = m.campaign;
            const v = this.riding;
            if (!v) return false;
            const p = BO.Player;
            const speed = Math.hypot(p.vel.x, p.vel.z);
            if (!force && speed > 7 && !v.cls.animal) { GM.toast('Too fast to bail out safely. Slow down.', '#f59e0b'); return false; }
            const at = this.exitPoint(v);
            v.x = p.pos.x; v.z = p.pos.z;
            v.y = v.cls.water && BO.Zone.inReservoir(v.x, v.z) ? BO.Zone.WATER - 1.35 : GM.ground(v.x, v.z, p.pos.y + 1);
            v.yaw = p.yaw;
            this.riding = null;
            c.vehicle = null;
            c.gliding = false;
            p.pos.set(at.x, at.y, at.z);
            p.vel.set(0, 0, 0);
            if (v.model) { v.model.position.set(v.x, v.y, v.z); v.model.rotation.y = v.yaw; v.model.visible = true; }
            v.marker.alive = !v.wrecked || true;
            this.refreshMarker(v);
            return true;
        },

        onRideKey(shift) {
            if (!GM.active || !this.mode) return false;
            if (this.riding) { this.exit(); return true; }
            const c = this.mode.campaign;
            if (c.has('footOnly') || c.has('sv_no_vehicles')) { GM.toast('Vehicles are disabled for this expedition.'); return true; }
            const p = BO.Player.pos;
            const near = this.list.filter((v) => !v.wrecked && GM.dist2(v, p) < 6).sort((a, b) => GM.dist2(a, p) - GM.dist2(b, p))[0];
            if (near) { this.enter(near); return true; }
            const horse = this.list.filter((v) => v.cls.animal && !v.wrecked && GM.dist2(v, p) < 150).sort((a, b) => GM.dist2(a, p) - GM.dist2(b, p))[0];
            if (horse) {
                this.whistle(horse);
                return true;
            }
            const nearest = this.list.filter((v) => !v.wrecked).sort((a, b) => GM.dist2(a, p) - GM.dist2(b, p))[0];
            GM.toast(nearest ? 'Your nearest vehicle (' + nearest.specRef.name + ') is ' + Math.round(GM.dist2(nearest, p)) + ' m away.' : 'You have no vehicle yet. Claim parked ones (map) or build them at a workbench.', '#cbd5e1');
            return true;
        },

        whistle(v) {
            BO.Sound?.playTone?.(1400, 2100, 0.25, 'sine', 0.12);
            BO.Sound?.playTone?.(2100, 1500, 0.25, 'sine', 0.12, 0.3);
            GM.toast('You whistle. Your ' + v.specRef.name.toLowerCase() + ' is coming.', '#a7f3d0');
            v.recallAt = this.mode.clock + 2.5;
        },

        interact(marker) {
            if (!marker.gmVehicle) return false;
            const v = this.list.find((x) => x.uid === marker.gmVehicle);
            if (!v) return true;
            const keys = BO.Player.keys || {};
            if (keys.ShiftLeft || keys.ShiftRight || v.wrecked) { GM.ui.open('vehicle', v.uid); return true; }
            this.enter(v);
            return true;
        },

        /* ---------------------------------------------------------- per frame */
        update(dt) {
            const m = this.mode;
            const c = m.campaign;
            const p = BO.Player;
            for (const v of this.list) {
                if (v.recallAt && m.clock >= v.recallAt) {
                    v.recallAt = 0;
                    const f = p.getMoveDirectionVectors().forward;
                    v.x = p.pos.x - f.x * 3; v.z = p.pos.z - f.z * 3;
                    v.y = GM.ground(v.x, v.z, p.pos.y + 2);
                    if (v.model) v.model.position.set(v.x, v.y, v.z);
                    this.refreshMarker(v);
                    BO.Sound?.playFootstep?.(true);
                    GM.toast('Your ' + v.specRef.name.toLowerCase() + ' trots up.', '#a7f3d0');
                }
            }
            const v = this.riding;
            if (!v) return;
            if (c.vehicle !== v.spec) { // something else dismounted us (glider landing, dungeon, death)
                this.riding = null;
                v.x = p.pos.x; v.z = p.pos.z; v.y = GM.ground(v.x, v.z, p.pos.y + 1);
                if (v.model) { v.model.position.set(v.x, v.y, v.z); v.model.visible = true; }
                v.marker.alive = true;
                this.refreshMarker(v);
                return;
            }
            const speed = Math.hypot(p.vel.x, p.vel.z);
            const moved = speed * dt;
            if (v.cls.fuel && moved > 0 && v.fuel > 0) {
                v.fuel = Math.max(0, v.fuel - moved * (v.cls.burn || 1 / 500) / (v.cls.fuel / 10));
                if (v.fuel <= 0) { GM.toast('Out of fuel. The engine coughs and dies.', '#f59e0b'); GM.sting('warning'); }
                else if (v.fuel < 0.12 && !v.lowWarned) { v.lowWarned = true; GM.toast('Fuel low.', '#f59e0b'); }
            }
            if (v.fuel > 0.2) v.lowWarned = false;
            // Damage: infected clawing at you, ramming at speed.
            let pressure = 0;
            for (const z of m.zombies) {
                if (!z.alive) continue;
                const d = z.pos.distanceTo(p.pos);
                if (d < 2.1) pressure += speed > 6.2 ? 1.2 : 0.6;
                if (d < 1.6 && speed < 4 && z.zs?.state === 'hunt' && Math.random() < dt * 0.6 && !v.cls.armor) {
                    p.vel.multiplyScalar(0.2);
                    GM.toast('Grabbed! Something is dragging at you.', '#ef4444');
                }
            }
            if (pressure) this.damage(v, pressure * 6 * dt / (v.cls.hp / 100));
            v.x = p.pos.x; v.y = p.pos.y; v.z = p.pos.z; v.yaw = p.yaw;
        },

        damage(v, pct) {
            v.hp = Math.max(0, v.hp - pct / 100);
            if (v.hp > 0) return;
            v.wrecked = true;
            const m = this.mode;
            if (this.riding === v) {
                this.exit(true);
                BO.Player.takeDamage(12);
            }
            const trunk = m.campaign.pack.chests.get('gmveh:' + v.uid);
            if (trunk && Object.keys(trunk).length) { m.campaign.pack.dropBag(trunk, { x: v.x + 1, y: v.y, z: v.z }); m.campaign.pack.chests.delete('gmveh:' + v.uid); }
            this.styleWreck(v);
            BO.FX?.spawnExplosion?.(new THREE.Vector3(v.x, v.y + 1, v.z), 2.4, 0xf97316);
            BO.Sound?.playExplosion?.(1.2);
            BO.ZoneDirector.noise(v.x, v.z, 90, 'explosion');
            GM.banner('VEHICLE WRECKED', v.specRef.name.toUpperCase() + ' · REPAIR IT ON THE SPOT (SHIFT+E)', '#ef4444');
            this.refreshMarker(v);
        },

        speedMult() {
            const v = this.riding;
            if (!v) return 1;
            let mult = 1;
            if (v.cls.fuel && v.fuel <= 0) mult *= 0.12;
            if (v.hp < 0.25) mult *= 0.7;
            if (v.cls.water) {
                const p = BO.Player.pos;
                const inWater = BO.Zone.inReservoir(p.x, p.z) && BO.World.terrainHeight(p.x, p.z) < BO.Zone.WATER - 0.3;
                mult *= inWater ? 17 : 1;
            }
            return mult;
        },

        incomingDamageMult() { return this.riding?.cls.armor || 1; },

        onBeforeDeathDrop() { if (this.riding) this.exit(true); },

        /* ---------------------------------------------------------- panel */
        panelHtml(uid) {
            const esc = GM.esc;
            const v = this.list.find((x) => x.uid === uid);
            if (!v) return '<p>Gone.</p>';
            const m = this.mode;
            const trunkKey = 'gmveh:' + v.uid;
            const trunk = m.campaign.pack.chests.get(trunkKey) || {};
            const lim = { slots: v.cls.trunk, weight: v.cls.trunk * 4 };
            const tile = (id, n, dir) => `<button class="sv-tile" data-act="gm" data-arg="vehicle.trunk:${dir}|${esc(v.uid)}|${esc(id)}" data-mv-act="gm" data-mv-arg="vehicle.trunk:${dir}|${esc(v.uid)}|${esc(id)}|N" data-mv-max="${n}" title="Click moves the stack · right-click moves half · shift+scroll moves one">${BO.SurvivalIcons?.item?.(id, 24) || ''}<span class="sv-tile-n">${n}</span><span class="sv-tile-name">${esc(GM.itemName(id))}</span></button>`;
            const packTiles = Object.entries(m.points).filter(([id, n]) => n > 0 && BO.SurvivalFrontierData.items[id]).map(([id, n]) => tile(id, n, 'in')).join('');
            const trunkTiles = Object.entries(trunk).filter(([, n]) => n > 0).map(([id, n]) => tile(id, n, 'out')).join('');
            const canFuel = v.cls.fuel && (m.points.fuel || 0) > 0 && v.fuel < 1;
            const canFix = (m.points.scrap || 0) >= 2 && (m.points.ingot || 0) >= 1 && v.hp < 1;
            return `<div class="gm-veh">
                <div class="gm-kv"><div><dt>Class</dt><dd>${esc(v.cls.label)}</dd></div><div><dt>Condition</dt><dd>${v.wrecked ? 'Wrecked' : Math.round(v.hp * 100) + '%'}</dd></div><div><dt>Fuel</dt><dd>${v.cls.fuel ? Math.round(v.fuel * 100) + '%' : 'none needed'}</dd></div><div><dt>Trunk</dt><dd>${v.cls.trunk} stacks</dd></div></div>
                <div class="sv-actions">
                    ${!v.wrecked ? `<button class="sv-btn primary" data-act="gm" data-arg="vehicle.enter:${esc(v.uid)}">Get in</button>` : ''}
                    ${v.cls.fuel ? `<button class="sv-btn" data-act="gm" data-arg="vehicle.fuel:${esc(v.uid)}" ${canFuel ? '' : 'disabled'}>Refuel (1 fuel → +25%)</button>` : ''}
                    <button class="sv-btn" data-act="gm" data-arg="vehicle.repair:${esc(v.uid)}" ${canFix ? '' : 'disabled'}>Repair (2 salvage + 1 iron bar → +30%)</button>
                </div>
                ${v.cls.trunk ? `<div class="gm-two"><section><h4>Backpack</h4><div class="sv-grid">${packTiles || '<p class="gm-muted">Empty.</p>'}</div></section><section><h4>Trunk · ${Object.keys(trunk).length}/${lim.slots}</h4><div class="sv-grid">${trunkTiles || '<p class="gm-muted">Empty. Trunk loot stays Hot until you stash it at base.</p>'}</div></section></div>` : '<p class="gm-muted">No trunk on this one.</p>'}
            </div>`;
        },

        panelAct(cmd, arg) {
            const m = this.mode;
            const c = m.campaign;
            if (cmd === 'trunk') {
                const [dir, uid, id, cnt] = arg.split('|');
                const want = (have) => (cnt ? Math.min(have, Math.max(1, Number(cnt) || 1)) : have);
                const v = this.list.find((x) => x.uid === uid);
                if (!v) return true;
                const key = 'gmveh:' + v.uid;
                const trunk = c.pack.chests.get(key) || {};
                c.pack.chests.set(key, trunk);
                const lim = { slots: v.cls.trunk, weight: v.cls.trunk * 4 };
                const L = GM.get('loot');
                if (dir === 'in') {
                    const n = c.pack.room(id, want(m.points[id] || 0), trunk, lim);
                    if (!n) { BO.SurvivalUI.feedback = 'The trunk is full.'; return true; }
                    const hot = Math.min(n, L?.hot[id] || 0);
                    m.points[id] -= n;
                    trunk[id] = (trunk[id] || 0) + n;
                    if (hot) L.stashHot(key, id, hot);
                } else {
                    const n = c.pack.room(id, want(trunk[id] || 0));
                    if (!n) { BO.SurvivalUI.feedback = 'Your pack has no room.'; return true; }
                    trunk[id] -= n; if (!trunk[id]) delete trunk[id];
                    m.points[id] = (m.points[id] || 0) + n;
                    L?.unstashHot(key, id, n);
                }
                return true;
            }
            const v = this.list.find((x) => x.uid === arg);
            if (!v) return true;
            if (cmd === 'enter') { BO.SurvivalUI.close(); this.enter(v); return 'close'; }
            if (cmd === 'fuel') { if (m.spend({ fuel: 1 })) { v.fuel = Math.min(1, v.fuel + 0.25); this.refreshMarker(v); BO.Sound?.playReload?.('in'); } return true; }
            if (cmd === 'repair') {
                if (m.spend({ scrap: 2, ingot: 1 })) {
                    v.hp = Math.min(1, v.hp + 0.3);
                    if (v.wrecked && v.hp > 0.15) { v.wrecked = false; v.model?.traverse?.((o) => { if (o.isMesh && o.material?.color) o.material.color.multiplyScalar(2.6); }); GM.toast('Back on its wheels.', '#4ade80'); }
                    this.refreshMarker(v);
                    BO.Sound?.playReload?.('out');
                }
                return true;
            }
            return false;
        },

        hudChips() {
            const v = this.riding;
            if (!v) return [];
            const out = [{ text: v.specRef.name + (v.cls.fuel ? ' · fuel ' + Math.round(v.fuel * 100) + '%' : '') + ' · ' + Math.round(v.hp * 100) + '%', cls: v.fuel <= 0.12 && v.cls.fuel ? 'warn' : 'held' }];
            return out;
        },

        mapPins() {
            return this.list.filter((v) => v !== this.riding).map((v) => ({ x: v.x, z: v.z, color: v.wrecked ? '#9ca3af' : '#38bdf8', label: v.specRef.name + (v.wrecked ? ' (wrecked)' : v.cls.fuel ? ' · fuel ' + Math.round(v.fuel * 100) + '%' : ''), glyph: '🚙' }));
        },

        baseCards(ui) {
            const esc = GM.esc;
            const p = BO.Player.pos;
            const rows = this.list.map((v) => `<li><span>${esc(v.specRef.name)}</span><em>${v === this.riding ? 'riding' : Math.round(GM.dist2(v, p)) + ' m'}${v.cls.fuel ? ' · fuel ' + Math.round(v.fuel * 100) + '%' : ''} · ${v.wrecked ? 'wrecked' : Math.round(v.hp * 100) + '%'}</em></li>`).join('');
            return [ui.section('Vehicles', rows ? `<ul class="gm-list">${rows}</ul>` : '<p class="gm-muted">Claim parked vehicles around the Zone or build one at a workbench.</p>', this.list.length + ' owned')];
        }
    };

    GM.register('vehicles', Vehicles);
    // Panel registration happens once the UI router exists.
    const reg = () => GM.ui ? GM.ui.panel('vehicle', { title: (uid) => Vehicles.list.find((v) => v.uid === uid)?.specRef.name || 'Vehicle', render: (uid) => Vehicles.panelHtml(uid), act: (cmd, arg) => Vehicles.panelAct(cmd, arg) }) : setTimeout(reg, 50);
    reg();
})(window.BO);
