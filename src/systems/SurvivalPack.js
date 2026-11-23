
(function (BO) {
    'use strict';

    const data = BO.SurvivalFrontierData;
    const nameOf = (id) => data.items[id]?.[0] || data.tools[id]?.name || id;
    const amountText = (items) => Object.entries(items).filter(([, count]) => count > 0)
        .map(([id, count]) => count + ' ' + nameOf(id)).join(' · ');

    class SurvivalPack {
        constructor(campaign) {
            this.campaign = campaign;
            this.mode = campaign.mode;
            this.level = 0;
            this.tools = {};
            this.equipped = null;
            this.resources = new Map();
            this.bags = new Map();
            this.chests = new Map();
            this.lights = [];
            this.lightUntil = 0;
            this.lamp = null;
            this.lightKind = 'torch';
            this.filterUntil = 0;
            this.bagIndex = 0;
            this.nextToolUse = 0;
            this.caveVisited = false;
            this.geodeAwakened = false;
            this.nextRenewalCheck = 0;
        }

        get limits() { return data.packs[this.level]; }
        get inventory() { return this.mode.points; }

        weight(items = this.inventory) {
            return Object.entries(items).reduce((total, [id, count]) => total + (data.items[id]?.[2] || 0) * count, 0);
        }

        slots(items = this.inventory) {
            return Object.values(items).filter((count) => count > 0).length;
        }

        room(id, count, inventory = this.inventory, limits = this.limits) {
            const mass = data.items[id]?.[2];
            if (!mass || (!inventory[id] && this.slots(inventory) >= limits.slots)) return 0;
            return Math.max(0, Math.min(count, Math.floor((limits.weight - this.weight(inventory) + 0.0001) / mass)));
        }

        receive(items, overflow = true) {
            const accepted = {};
            const remainder = {};
            for (const [id, count] of Object.entries(items)) {
                const n = this.room(id, count);
                if (n) {
                    this.inventory[id] = (this.inventory[id] || 0) + n;
                    accepted[id] = n;
                }
                if (n < count && data.items[id]) remainder[id] = count - n;
            }
            if (overflow && Object.keys(remainder).length) this.dropBag(remainder, BO.Player.pos);
            return { accepted, remainder };
        }

        setup(snapshot) {
            const m = this.mode;
            data.deposits.forEach((deposit, i) => this.createDeposit('node:' + i, deposit));
            this.lamp = new THREE.PointLight(0xffbc75, 0, 15, 1.9);
            this.lamp.visible = false;
            m.scene.add(this.lamp);
            if (snapshot) this.restore(snapshot);
        }

        stop() {
            this.lamp?.removeFromParent();
            for (const light of this.lights) light.removeFromParent();
        }

        createDeposit(id, entry) {
            const { kind, x, y, z } = entry;
            const spec = data.resources[kind];
            const m = this.mode;
            const geometry = [];
            const make = (geo, color, dx, dy, dz, props) => {
                const mesh = m.mesh(geo, color, x + dx, y + dy, z + dz, props);
                geometry.push(mesh);
                return mesh;
            };
            const marked = spec.tool === 'pick';
            let collider = null;
            if (spec.tool === 'axe') {
                const height = kind === 'hardwood' ? 4.4 : 3.65;
                const trunk = make(new THREE.CylinderGeometry(0.16, 0.28, height, 7), spec.color, 0, height * 0.5, 0);
                collider = m.solid(trunk, 0.53, height, 0.53);
                make(new THREE.ConeGeometry(1.2, 2.65, 7), kind === 'hardwood' ? 0x7f8b50 : 0x427259, 0, height * 0.88, 0);
                make(new THREE.ConeGeometry(0.86, 2.16, 7), 0x527b60, 0, height * 1.10, 0);
            } else if (marked) {
                const boulder = make(new THREE.DodecahedronGeometry(kind === 'boulder' ? 0.91 : 0.68, 0),
                    spec.color, 0, kind === 'boulder' ? 0.50 : 0.44, 0);
                boulder.scale.set(1.08, 0.76, 0.91);
                collider = m.solid(boulder, kind === 'boulder' ? 1.4 : 0.9, 0.94, 0.95);
                if (kind !== 'boulder') {
                    for (let i = 0; i < 3; i++) {
                        const vein = make(new THREE.OctahedronGeometry(0.17 + i * 0.032), spec.color,
                            (i - 1) * 0.26, 0.57 + i * 0.12, 0.30 - i * 0.19, { emissive: spec.color, emissiveIntensity: 0.22 });
                        vein.rotation.z = i * 0.38;
                    }
                }
            } else if (spec.tool === 'shovel') {
                make(new THREE.DodecahedronGeometry(0.54), spec.color, 0, 0.11, 0).scale.set(1.25, 0.22, 0.86);
                if (kind === 'buried') make(new THREE.BoxGeometry(0.4, 0.12, 0.24), 0x7d755a, 0.12, 0.21, 0.04);
            } else {
                for (let i = 0; i < 4; i++) {
                    const geo = kind === 'stones' ? new THREE.DodecahedronGeometry(0.15 + i * 0.015)
                        : kind === 'kindling' ? new THREE.BoxGeometry(0.34 + i * 0.035, 0.05, 0.055)
                        : new THREE.ConeGeometry(0.095, 0.22 + i * 0.017, 4);
                    make(geo, spec.color, i * 0.16 - 0.22, kind === 'kindling' ? 0.06 : 0.15 + i * 0.023, i * 0.12 - 0.16).rotation.y = i;
                }
            }
            const marker = { id, x, y, z, name: spec.name, label: '', alive: true };
            m.markers.push(marker);
            this.resources.set(id, { kind, spec, hp: spec.strokes, geometry, collider, marker });
        }

        pickTool(spec) {
            if (this.equipped && this.tools[this.equipped] > 0) {
                const active = data.tools[this.equipped];
                if (active.family === spec.tool && active.level >= spec.tier) return this.equipped;
            }
            return Object.keys(this.tools)
                .filter((id) => this.tools[id] > 0 && data.tools[id].family === spec.tool && data.tools[id].level >= spec.tier)
                .sort((a, b) => data.tools[b].power - data.tools[a].power)[0];
        }

        prompt(id) {
            if (id.startsWith('bag:')) return 'Collect contents of dropped pack';
            const node = this.resources.get(id);
            if (!node || node.hp <= 0) return '';
            const { spec } = node;
            if (!spec.tool) return 'Gather ' + spec.name.toLowerCase();
            const tool = this.pickTool(spec);
            if (node.kind === 'deep' && this.geodeAwakened && !this.campaign.metrics.geodeBoss) return 'Defeat the Resonant Sentinel';
            if (tool) return spec.name + ' · ' + nameOf(tool) + ' · ' + node.hp + ' left';
            return spec.name + ' · requires ' + ({ axe: 'an axe', pick: 'a pickaxe', shovel: 'a shovel' }[spec.tool]) + (spec.tier > 1 ? ' tier ' + spec.tier : '');
        }

        interact(marker) {
            if (!marker) return false;
            if (marker.id.startsWith('bag:')) {
                this.collectBag(marker.id);
                return true;
            }
            const node = this.resources.get(marker.id);
            if (!node) return false;
            if (node.hp <= 0) return true;
            const m = this.mode;
            if (m.clock < this.nextToolUse || m.rider) return true;
            const { spec } = node;
            const tool = spec.tool ? this.pickTool(spec) : null;
            if (spec.tool && !tool) {
                m.toast(this.prompt(marker.id) + '. Open the backpack to craft tools.');
                return true;
            }
            if (node.kind === 'deep' && !this.campaign.metrics.geodeBoss) {
                if (!this.geodeAwakened) {
                    this.geodeAwakened = true;
                    m.spawnInfected(-6.6, -5, -46.5, 'geodeBoss');
                    m.toast('The Resonant Sentinel guards this deposit.');
                }
                return true;
            }
            this.nextToolUse = m.clock + (tool ? 0.42 : 0.19);
            if (tool) {
                this.equipped = tool;
                this.tools[tool]--;
                BO.Player.meleeTimer = Math.max(BO.Player.meleeTimer, 0.25);
                BO.Sound.playMelee();
                m.noise = Math.max(m.noise, tool === 'miningDrill' ? 7 : 2.8);
                if (this.tools[tool] === 0) m.toast(nameOf(tool) + ' wore out.');
            }
            node.hp = Math.max(0, node.hp - (tool ? data.tools[tool].power : 1));
            BO.FX.spawnParticles(new THREE.Vector3(marker.x, marker.y + 0.65, marker.z), 6, spec.color, 2.4, 8, 0.5);
            if (!node.hp) {
                this.deplete(node);
                if (node.kind !== 'deep') node.renewAt = m.clock + (spec.tool ? 480 : 170);
                m.grant(spec.gain);
                this.campaign.mark('gatheredNodes', 1, tool ? 10 : 3);
                this.campaign.mark('harvest_' + node.kind, 1, 0);
                if (spec.tool === 'pick') this.campaign.mark('oreHarvests', 1, 0);
            }
            return true;
        }

        deplete(node) {
            node.hp = 0;
            node.marker.alive = false;
            for (const mesh of node.geometry) mesh.visible = false;
            if (node.collider?.active) this.mode.removeSolid(node.geometry[0], node.collider);
        }

        dropBag(items, position, id = 'bag:' + this.bagIndex++) {
            const m = this.mode;
            const existing = [...this.bags.values()].find((bag) => Math.hypot(bag.x - position.x, bag.z - position.z) < 0.8 && Math.abs(bag.y - position.y) < 0.6);
            if (existing) {
                for (const [key, value] of Object.entries(items)) existing.items[key] = (existing.items[key] || 0) + value;
                return;
            }
            const { x, y, z } = position;
            const mesh = m.mesh(new THREE.BoxGeometry(0.45, 0.27, 0.31), 0x919375, x, y + 0.15, z,
                { emissive: 0x717246, emissiveIntensity: 0.23 });
            const marker = { id, x, y, z, alive: true, label: 'Collect dropped pack' };
            m.markers.push(marker);
            this.bags.set(id, { x, y, z, items: { ...items }, mesh, marker });
        }

        collectBag(id) {
            const bag = this.bags.get(id);
            if (!bag) return;
            const { accepted, remainder } = this.receive(bag.items, false);
            bag.items = remainder;
            if (!Object.keys(remainder).length) {
                bag.marker.alive = false;
                this.bags.delete(id);
                this.mode.disposeOwned(bag.mesh);
            }
            this.mode.toast(Object.keys(accepted).length ? 'Packed ' + amountText(accepted) : 'Your pack has no room.');
        }

        drop(id, amount) {
            if (!data.items[id] || !this.inventory[id]) return false;
            const n = amount === 'all' ? this.inventory[id] : 1;
            this.inventory[id] -= n;
            this.dropBag({ [id]: n }, BO.Player.pos);
            return true;
        }

        transfer(chestId, id, amount, deposit) {
            const chest = this.chests.get(chestId);
            const site = this.mode.near;
            if (!chest || !data.items[id] || site?.id !== 'build:' + chestId) return false;
            const source = deposit ? this.inventory : chest;
            const target = deposit ? chest : this.inventory;
            const desired = amount === 'all' ? source[id] : Math.min(source[id] || 0, 1);
            const n = this.room(id, desired || 0, target, deposit ? { slots: 18, weight: 54 } : this.limits);
            if (!n) {
                this.mode.toast('The destination has no room.');
                return false;
            }
            source[id] -= n;
            target[id] = (target[id] || 0) + n;
            return true;
        }

        recipe(id) {
            const tool = data.tools[id];
            if (tool) return { id, name: tool.name, station: tool.station, cost: tool.cost, tool };
            return data.recipes.find((entry) => entry.id === id);
        }

        canCraft(recipe) {
            if (!recipe) return false;
            if (recipe.station !== 'hand' && recipe.station !== this.campaign.station) return false;
            if (recipe.pack !== undefined && recipe.pack !== this.level + 1) return false;
            if (recipe.tool && this.tools[recipe.id] > 0) return false;
            if (!this.mode.canAfford(recipe.cost)) return false;
            const remaining = { ...this.inventory };
            for (const [id, count] of Object.entries(recipe.cost)) remaining[id] -= count;
            for (const [id, count] of Object.entries(recipe.gain || {})) {
                if (this.room(id, count, remaining) < count) return false;
                remaining[id] = (remaining[id] || 0) + count;
            }
            return true;
        }

        craft(id) {
            const recipe = this.recipe(id);
            if (!this.canCraft(recipe) || !this.mode.spend(recipe.cost)) return false;
            if (recipe.pack !== undefined) {
                this.level = recipe.pack;
                this.campaign.mark('packUpgrades', 1, 45);
            }
            if (recipe.tool) {
                this.tools[id] = recipe.tool.wear;
                this.equipped = id;
            }
            if (recipe.gain) this.receive(recipe.gain, false);
            this.campaign.mark('crafted', 1, 14);
            this.campaign.mark('crafted_' + id, 1, 0);
            this.mode.toast(recipe.name + ' ready.');
            return true;
        }

        use(id) {
            if (!this.inventory[id]) return false;
            const p = BO.Player;
            const m = this.mode;
            if (id === 'bandage' && p.hp < p.maxHp) {
                const hp = Math.min(27, p.maxHp - p.hp);
                p.hp += hp;
                this.campaign.mark('healed', Math.ceil(hp), 0);
            } else if (id === 'tea') {
                m.composure = Math.min(100, m.composure + 36);
                m.radiation = Math.max(0, m.radiation - 19);
            } else if (id === 'filter') {
                this.filterUntil = Math.max(m.clock, this.filterUntil) + 120;
            } else if (id === 'repair' && this.equipped && this.tools[this.equipped] < data.tools[this.equipped].wear) {
                const tool = data.tools[this.equipped];
                this.tools[this.equipped] = Math.min(tool.wear, this.tools[this.equipped] + 24);
                m.toast(tool.name + ' repaired.');
            } else if (id === 'torch') {
                this.lightKind = id;
                this.lightUntil = m.clock + 90;
            } else if (id === 'lantern') {
                if (!m.spend({ fuel: 1 })) {
                    m.toast('The lantern needs one fuel.');
                    return false;
                }
                this.lightKind = id;
                this.lightUntil = m.clock + 240;
                m.toast('Lantern lit.');
                return true;
            } else return false;
            this.inventory[id]--;
            return true;
        }

        shortcut() {
            const m = this.mode;
            if (this.lightUntil > m.clock) {
                this.lightUntil = 0;
                m.toast('Light extinguished.');
                return;
            }
            if (!this.use(this.inventory.lantern && this.inventory.fuel ? 'lantern' : 'torch')) m.toast('Craft a torch or lantern in the backpack.');
        }

        get filtered() { return this.filterUntil > this.mode.clock; }

        addLight(id, position) {
            const light = new THREE.PointLight(0xffac60, 0.85, 10, 1.6);
            light.position.set(position.x, position.y + 1.35, position.z);
            light.userData.frontierId = id;
            this.mode.scene.add(light);
            this.lights.push(light);
        }

        update() {
            const m = this.mode;
            const p = BO.Player;
            if (m.clock >= this.nextRenewalCheck) {
                this.nextRenewalCheck = m.clock + 3;
                for (const node of this.resources.values()) {
                    if (!node.renewAt || node.renewAt > m.clock || Math.hypot(p.pos.x - node.marker.x, p.pos.z - node.marker.z) < 10) continue;
                    node.hp = node.spec.strokes;
                    node.renewAt = 0;
                    node.marker.alive = true;
                    node.geometry.forEach((mesh) => { mesh.visible = true; });
                    if (node.collider && !node.collider.active) {
                        node.collider.active = true;
                        BO.World.worldMeshes.push(node.geometry[0]);
                    }
                }
            }
            const inCave = p.pos.y < -2.5 && p.pos.x < -4.6 && p.pos.z < -43;
            if (inCave && !this.caveVisited) {
                this.caveVisited = true;
                this.campaign.mark('visitedCavern', 1, 40);
                m.toast('Echo Cavern discovered. Press H to light a carried torch.');
            }
            if (inCave && m.weatherHemi) m.weatherHemi.intensity *= 0.43;
            const lit = this.lightUntil > m.clock;
            this.lamp.visible = lit;
            this.lamp.intensity = lit ? (this.lightKind === 'lantern' ? 2.3 : 1.48) : 0;
            if (lit) {
                this.lamp.position.copy(p.pos);
                this.lamp.position.y += 1.18;
            }
            // Bound simultaneous lights in a large base while leaving every placed torch functional nearby.
            const closest = this.lights.filter((light) => light.position.distanceTo(p.pos) < 18)
                .sort((a, b) => a.position.distanceToSquared(p.pos) - b.position.distanceToSquared(p.pos)).slice(0, 4);
            for (const light of this.lights) light.visible = closest.includes(light);
        }

        snapshot() {
            return {
                level: this.level, equipped: this.equipped, tools: this.tools, caveVisited: this.caveVisited, geodeAwakened: this.geodeAwakened,
                lightKind: this.lightKind, lightUntil: this.lightUntil, filterUntil: this.filterUntil,
                nodes: [...this.resources].filter(([, node]) => node.hp < node.spec.strokes).map(([id, node]) => [id, node.hp, node.renewAt]),
                chests: [...this.chests], bagIndex: this.bagIndex,
                bags: [...this.bags].map(([id, { x, y, z, items }]) => ({ id, x, y, z, items }))
            };
        }

        restore(saved) {
            this.level = BO.Math.clamp(saved.level || 0, 0, data.packs.length - 1);
            this.equipped = saved.equipped;
            this.tools = { ...saved.tools };
            this.caveVisited = !!saved.caveVisited;
            this.geodeAwakened = !!saved.geodeAwakened;
            this.lightKind = saved.lightKind || 'torch';
            this.lightUntil = saved.lightUntil || 0;
            this.filterUntil = saved.filterUntil || 0;
            this.bagIndex = saved.bagIndex || 0;
            this.chests = new Map(saved.chests || []);
            for (const [id, hp, renewAt] of saved.nodes || []) {
                const node = this.resources.get(id);
                if (!node) continue;
                if (hp === 0) this.deplete(node);
                else node.hp = hp;
                node.renewAt = renewAt || 0;
            }
            for (const bag of saved.bags || []) this.dropBag(bag.items, bag, bag.id);
        }
    }

    BO.SurvivalPack = SurvivalPack;
    BO.SurvivalItemName = nameOf;
    BO.SurvivalItemAmounts = amountText;
})(window.BO);
