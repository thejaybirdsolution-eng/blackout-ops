
(function (BO) {
    'use strict';

    const data = BO.SurvivalFrontierData;
    const nameOf = (id) => data.items[id]?.[0] || data.tools[id]?.name || id;
    const amountText = (items) => Object.entries(items).filter(([, count]) => count > 0)
        .map(([id, count]) => count + ' ' + nameOf(id)).join(' · ');
    /* Bare hands break tier-1 deposits at a quarter of a stone tool's pace; tier-2+ need the right tool. */
    const HAND_POWER = 0.25;
    const HAND_TIER = 1;
    const TOOL_NAMES = { axe: 'an axe', pick: 'a pickaxe', shovel: 'a shovel' };

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
            this.meshToNode = new Map();
            this.lastStrike = null;
            this.nextHint = 0;
        }

        get limits() {
            const base = data.packs[this.level] || data.packs[0];
            const endBonus = (this.campaign.deep?.attributes?.endurance || 0) * 3;
            const techBonus = this.campaign.deep?.hasTech?.('t1_scavenge') ? 8 : 0;
            const extraKg = this.campaign.deep?.modFx?.bonusCarryKg || 0;
            const mult = (this.campaign.has?.('megaStack') ? 2 : 1) * (1 + BO.SurvivalCareer.masteryRank('logistics') * 0.12);
            const slotBonus = (this.campaign.has?.('megaStack') ? 10 : 0) + BO.SurvivalCareer.masteryRank('logistics') * 2;
            return {
                name: base.name,
                weight: base.weight * mult + endBonus + techBonus + extraKg,
                slots: base.slots + slotBonus
            };
        }
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
            // Batch the world's deposits into one draw call per cell; nearby ones stay live meshes.
            this.batch = BO.NodeBatch ? new BO.NodeBatch(m.scene) : null;
            if (this.batch) for (const node of this.resources.values()) this.batch.add(node);
            this.lamp = new THREE.PointLight(0xffbc75, 0, 15, 1.9);
            this.lamp.visible = false;
            m.scene.add(this.lamp);
            if (snapshot) this.restore(snapshot);
            this.batch?.flushAll();
        }

        /** Show or hide a deposit's meshes, through the batch when it is batched. */
        showNode(node, shown) {
            node._vis = shown;
            if (this.batch && node._batch) this.batch.setShown(node, shown);
            else for (const mesh of node.geometry) mesh.visible = shown;
        }

        stop() {
            this.batch?.dispose();
            this.batch = null;
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
                // A raised mound with a darker crown reads as "dig here" from a distance.
                make(new THREE.DodecahedronGeometry(0.62), spec.color, 0, 0.16, 0).scale.set(1.45, 0.34, 1.05);
                make(new THREE.DodecahedronGeometry(0.34), new THREE.Color(spec.color).multiplyScalar(0.72).getHex(), 0.08, 0.34, -0.04).scale.set(1.2, 0.45, 0.9);
                if (kind === 'buried') {
                    make(new THREE.BoxGeometry(0.52, 0.16, 0.3), 0x7d755a, 0.18, 0.42, 0.06, { metalness: 0.5 }).rotation.z = 0.35;
                    make(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6), 0x9a9a8a, -0.22, 0.42, 0.1, { metalness: 0.6 }).rotation.z = 1.1;
                }
            } else if (kind === 'stones') {
                // A small cairn: five fist-sized stones, the top one pale so it catches the light.
                const stones = [[0, 0.2, 0, 0.34], [0.36, 0.15, 0.12, 0.26], [-0.32, 0.14, 0.18, 0.24], [0.06, 0.13, -0.34, 0.25], [0.04, 0.52, 0.02, 0.22]];
                stones.forEach(([dx, dy, dz, r], i) => {
                    const st = make(new THREE.DodecahedronGeometry(r, 0), i === 4 ? 0xc7cdc4 : spec.color, dx, dy, dz);
                    st.scale.set(1.1, 0.78, 1);
                    st.rotation.set(i * 0.7, i * 1.3, i * 0.4);
                });
            } else if (kind === 'kindling') {
                // Crossed fallen sticks with a bundle tied in the middle.
                for (let i = 0; i < 5; i++) {
                    const stick = make(new THREE.CylinderGeometry(0.045, 0.06, 1.05 - i * 0.06, 5), i % 2 ? 0x7a5c3e : spec.color,
                        (i - 2) * 0.06, 0.07 + (i % 3) * 0.05, (i - 2) * 0.05);
                    stick.rotation.set(Math.PI / 2, 0, i * 0.62 + 0.2);
                }
                make(new THREE.TorusGeometry(0.1, 0.025, 4, 8), 0xc8b27a, 0, 0.16, 0).rotation.x = Math.PI / 2;
            } else if (kind === 'roots') {
                // A tall tuft of pale fibrous grass, taller than the lawn around it.
                for (let i = 0; i < 7; i++) {
                    const a = (i / 7) * Math.PI * 2;
                    const blade = make(new THREE.ConeGeometry(0.07, 0.8 + (i % 3) * 0.14, 4), i % 2 ? 0xb6c47a : spec.color,
                        Math.cos(a) * 0.14, 0.42, Math.sin(a) * 0.14);
                    blade.rotation.set(Math.sin(a) * 0.32, 0, -Math.cos(a) * 0.32);
                }
            } else {
                // Bitterleaf: broad dark leaves with white flowers on top.
                for (let i = 0; i < 5; i++) {
                    const a = (i / 5) * Math.PI * 2;
                    const leaf = make(new THREE.SphereGeometry(0.22, 6, 4), spec.color, Math.cos(a) * 0.2, 0.14, Math.sin(a) * 0.2);
                    leaf.scale.set(1, 0.22, 0.55);
                    leaf.rotation.set(0, -a, 0.35);
                }
                for (let i = 0; i < 3; i++) {
                    make(new THREE.SphereGeometry(0.075, 6, 4), 0xf3f4ee, (i - 1) * 0.12, 0.38 + (i % 2) * 0.06, (i % 2) * 0.1 - 0.05,
                        { emissive: 0xffffff, emissiveIntensity: 0.18 });
                }
            }
            const marker = { id, x, y, z, name: spec.name, label: '', alive: true, reach: spec.tool ? 3.4 : 3.3 };
            m.markers.push(marker);
            for (const mesh of geometry) this.meshToNode.set(mesh, id);
            this.resources.set(id, { kind, spec, hp: spec.strokes, geometry, collider, marker });
        }

        /** Best owned tool able to work this deposit (the held hotbar tool wins when suitable). */
        pickTool(spec, preferred = null) {
            const fits = (id) => id && this.tools[id] > 0 && data.tools[id]?.family === spec.tool && data.tools[id].level >= spec.tier;
            if (fits(preferred)) return preferred;
            const held = this.campaign.hotbar?.heldTool;
            if (fits(held)) return held;
            if (fits(this.equipped)) return this.equipped;
            return Object.keys(this.tools).filter(fits).sort((a, b) => data.tools[b].power - data.tools[a].power)[0];
        }

        /** Can this deposit be broken without the proper tool? */
        handBreakable(spec) { return !spec.tool || spec.tier <= HAND_TIER; }

        prompt(id) {
            if (id.startsWith('bag:')) return 'Collect contents of dropped pack';
            const node = this.resources.get(id);
            if (!node || node.hp <= 0) return '';
            const { spec } = node;
            if (!spec.tool) return 'Gather ' + spec.name.toLowerCase();
            if (node.kind === 'deep' && this.geodeAwakened && !this.campaign.metrics.geodeBoss) return 'Defeat the Resonant Sentinel';
            const tool = this.pickTool(spec);
            const left = Math.max(1, Math.ceil((node.hp / spec.strokes) * 100)) + '%';
            if (tool) return spec.name + ' · ' + nameOf(tool) + ' · ' + left;
            if (this.handBreakable(spec)) return spec.name + ' · bare hands (slow) · ' + left;
            return spec.name + ' · needs ' + TOOL_NAMES[spec.tool] + (spec.tier > 1 ? ' (tier ' + spec.tier + ')' : '');
        }

        wearTool(id, amount = 1) {
            if (!(this.tools[id] > 0)) return;
            let step = amount * (this.campaign.has('steadyTools') ? 0.5 : 1);
            if (this.campaign.deep?.hasInfusion('unbreaking')) step *= 0.4;
            this.tools[id] = Math.max(0, this.tools[id] - step);
            if (this.tools[id] === 0) {
                this.mode.toast(nameOf(id) + ' wore out. Repair it with a field repair kit or craft a new one.');
                this.campaign.hotbar?.apply(true);
            }
        }

        /** A swing (punch or tool) that hit no enemy: break whatever deposit or timber is in front. */
        swing(toolId, aim, wallHit, strength = 1) {
            const m = this.mode;
            if (!m.active || m.rider) return false;
            const p = BO.Player.pos;
            let nodeId = wallHit?.object ? this.meshToNode.get(wallHit.object) : null;
            if (!nodeId) {
                // Small deposits have no collider, so pick the closest one roughly in the aim direction.
                let best = null;
                let bestScore = Infinity;
                for (const [id, node] of this.resources) {
                    if (node.hp <= 0) continue;
                    const mk = node.marker;
                    const dx = mk.x - p.x;
                    const dz = mk.z - p.z;
                    const dy = (mk.y + 0.4) - (p.y + 1.0);
                    const d = Math.hypot(dx, dz);
                    if (d > 3.2 || Math.abs(dy) > 2.2) continue;
                    const facing = d < 0.6 ? 1 : (dx * aim.dir.x + dz * aim.dir.z) / (d * Math.hypot(aim.dir.x, aim.dir.z) || 1);
                    if (facing < 0.4) continue;
                    const score = d - facing;
                    if (score < bestScore) { bestScore = score; best = id; }
                }
                if (best && (!wallHit || wallHit.distance > Math.hypot(this.resources.get(best).marker.x - p.x, this.resources.get(best).marker.z - p.z) - 0.4)) nodeId = best;
            }
            if (nodeId) return this.strike(nodeId, toolId, strength);
            const tree = this.treeInFront(aim, wallHit);
            if (tree) return this.chop(tree, toolId, strength);
            const part = wallHit?.object ? m.structures.get(wallHit.object) : null;
            if (part && part.hp > 0) {
                const t = toolId ? data.tools[toolId] : null;
                let dmg;
                if (t && t.family === 'axe' && part.material === 'wood') dmg = 16 * t.power;
                else if (t && t.family === 'pick' && part.material === 'brick') dmg = 12 * t.power;
                else if (t) dmg = 7;
                else dmg = part.material === 'wood' ? 5.5 * strength : 1.4 * strength;
                if (t) this.wearTool(toolId, 0.5);
                m.damagePart(part, dmg, 'melee');
                BO.FX.spawnParticles(wallHit.point, 4, part.material === 'wood' ? 0xaa8254 : 0xbe9580, 2.2, 8, 0.35);
                const kind = part.kind === 'tree' ? 'Tree' : part.material === 'wood' ? 'Timber' : 'Masonry';
                const max = part.maxHp || (part.kind === 'tree' ? 125 : part.material === 'wood' ? 70 : 170);
                this.lastStrike = { name: kind + (t ? '' : ' · bare hands'), frac: Math.max(0, part.hp) / max, at: m.clock, hand: !t };
                if (!t && part.material === 'brick' && m.clock >= this.nextHint) {
                    this.nextHint = m.clock + 6;
                    m.toast('Masonry barely cracks under bare fists. A pickaxe works far better.');
                }
                return true;
            }
            return false;
        }

        /** One hit on a resource node with a tool (or bare hands when toolId is null). */
        strike(nodeId, toolId, strength = 1) {
            const node = this.resources.get(nodeId);
            const m = this.mode;
            if (!node || node.hp <= 0) return false;
            const { spec, marker } = node;
            if (node.kind === 'deep' && !this.campaign.metrics.geodeBoss) {
                if (!m.hostilesReleased) {
                    m.toast('The deep seam stays sealed during the safe period.');
                    return true;
                }
                if (!this.geodeAwakened) {
                    this.geodeAwakened = true;
                    m.spawnInfected(-6.6, -5, -46.5, 'geodeBoss');
                    m.toast('The Resonant Sentinel guards this deposit.');
                }
                return true;
            }
            const tool = spec.tool ? this.pickTool(spec, toolId) : null;
            // Only the tool actually swung counts; otherwise the swing is a bare-hand blow.
            const usingTool = tool && (toolId === tool);
            let power;
            if (!spec.tool) power = 1;
            else if (usingTool) power = data.tools[tool].power;
            else if (this.handBreakable(spec)) power = HAND_POWER * strength;
            else {
                if (m.clock >= this.nextHint) {
                    this.nextHint = m.clock + 2.5;
                    m.toast(spec.name + ' is too hard for bare hands — it needs ' + TOOL_NAMES[spec.tool] + (spec.tier > 1 ? ' of tier ' + spec.tier + ' or better' : '') + '.');
                }
                this.lastStrike = { name: spec.name + ' · needs ' + TOOL_NAMES[spec.tool], frac: node.hp / spec.strokes, at: m.clock, blocked: true };
                return true;
            }
            if (usingTool) {
                this.equipped = tool;
                if (!this.campaign.has('sv_no_wear')) this.wearTool(tool, 1);
                m.noise = Math.max(m.noise, tool === 'miningDrill' ? 7 : 2.8);
            } else if (spec.tool) {
                m.noise = Math.max(m.noise, 1.2);
            }
            if (this.campaign.has('sv_no_cooldowns')) power = 999;
            node.hp = Math.max(0, node.hp - power);
            if (node.hp < 0.001) node.hp = 0;
            BO.FX.spawnParticles(new THREE.Vector3(marker.x, marker.y + 0.65, marker.z), usingTool ? 6 : 3, spec.color, 2.4, 8, 0.5);
            this.lastStrike = { name: spec.name + (spec.tool && !usingTool ? ' · bare hands' : ''), frac: node.hp / spec.strokes, at: m.clock, hand: !!spec.tool && !usingTool };
            if (spec.tool && !usingTool && m.clock >= this.nextHint && node.hp > 0) {
                this.nextHint = m.clock + 9;
                m.toast('Breaking ' + spec.name.toLowerCase() + ' by hand is slow. Craft ' + TOOL_NAMES[spec.tool] + ' to work it four times faster.');
            }
            if (!node.hp) this.harvest(node, usingTool ? tool : null);
            return true;
        }

        /* ------------------------------------------------------------ Zone trees */
        /** The standing Zone tree the swing connects with (2.6 m reach, roughly in the aim direction). */
        treeInFront(aim, wallHit) {
            const zone = BO.World.zone;
            if (!zone?.trees) return null;
            const p = BO.Player.pos;
            const fx = aim.dir.x, fz = aim.dir.z, fl = Math.hypot(fx, fz) || 1;
            let best = null, bestScore = Infinity;
            for (const t of zone.trees) {
                if (!t.alive) continue;
                const dx = t.x - p.x, dz = t.z - p.z;
                if (Math.abs(dx) > 3 || Math.abs(dz) > 3) continue;
                const d = Math.hypot(dx, dz);
                if (d > 2.6 || t.y > p.y + 2 || t.y + 4 < p.y) continue;
                const facing = d < 0.5 ? 1 : (dx * fx + dz * fz) / (d * fl);
                if (facing < 0.6) continue;
                const score = d - facing;
                if (score < bestScore) { bestScore = score; best = t; }
            }
            if (best && wallHit && !wallHit.object?.isInstancedMesh && wallHit.distance < Math.hypot(best.x - p.x, best.z - p.z) - 0.6) return null;
            return best;
        }

        treeSpec(t) {
            return data.resources[t.type === 'broad' ? 'hardwood' : 'pine'] || { name: 'Timber', tool: 'axe', tier: 1, strokes: 3, gain: { timber: 4 }, color: 0x8d684a };
        }

        /** One blow on a tree: axes fell quickly; bare hands only manage dead wood and small pines, slowly. */
        chop(t, toolId, strength = 1) {
            const m = this.mode;
            const spec = this.treeSpec(t);
            const strokes = spec.strokes * (t.type === 'dead' ? 0.7 : 1) * (0.7 + t.s * 0.4);
            if (t.hp === undefined || t.hp > strokes || t.hp === 6) t.hp = strokes;
            const tool = this.pickTool(spec, toolId);
            const usingTool = tool && toolId === tool;
            let power;
            if (usingTool) power = data.tools[tool].power;
            else if (spec.tier <= HAND_TIER || t.type === 'dead') power = HAND_POWER * strength;
            else {
                if (m.clock >= this.nextHint) { this.nextHint = m.clock + 2.5; m.toast(spec.name + ' needs ' + TOOL_NAMES.axe + ' of tier ' + spec.tier + '.'); }
                this.lastStrike = { name: spec.name + ' · needs ' + TOOL_NAMES.axe, frac: t.hp / strokes, at: m.clock, blocked: true };
                return true;
            }
            if (usingTool) { this.equipped = tool; if (!this.campaign.has('sv_no_wear')) this.wearTool(tool, 1); }
            if (this.campaign.has('sv_no_cooldowns')) power = 999;
            m.noise = Math.max(m.noise, usingTool ? 3.2 : 1.2);
            BO.ZoneDirector?.noise?.(t.x, t.z, usingTool ? 38 : 14, 'chop');
            t.hp = Math.max(0, t.hp - power);
            BO.FX.spawnParticles(new THREE.Vector3(t.x, t.y + 1.1, t.z), usingTool ? 6 : 3, spec.color, 2.4, 8, 0.5);
            this.lastStrike = { name: (t.type === 'dead' ? 'Dead tree' : spec.name) + (usingTool ? '' : ' · bare hands'), frac: t.hp / strokes, at: m.clock, hand: !usingTool };
            if (t.hp <= 0.001) this.fellTree(t, spec);
            return true;
        }

        setTreeVisible(t, on) {
            const mat = new THREE.Matrix4();
            for (const mesh of [t.trunk, t.crown]) {
                if (!mesh) continue;
                if (!on) {
                    mesh.getMatrixAt(t.idx, mat);
                    (t._mats = t._mats || {})[mesh.uuid] = mat.clone();
                    mesh.setMatrixAt(t.idx, new THREE.Matrix4().makeScale(0, 0, 0));
                } else if (t._mats?.[mesh.uuid]) {
                    mesh.setMatrixAt(t.idx, t._mats[mesh.uuid]);
                }
                mesh.instanceMatrix.needsUpdate = true;
            }
            if (t.collider) { t.collider.active = on; BO.World.notifyColliderChanged?.(t.collider); }
        }

        fellTree(t, spec, quiet = false) {
            t.alive = false;
            t.hp = 0;
            t.renewAt = this.mode.clock + 900;
            this.setTreeVisible(t, false);
            if (quiet) return;
            const m = this.mode;
            const big = t.type === 'broad';
            const gain = t.type === 'dead' ? { timber: 2, resin: 1 } : { ...spec.gain };
            const scav = (1 + (BO.SurvivalCareer.masteryRank?.('scavenger') || 0) * 0.15) * (this.campaign.has('sv_double_loot') ? 2 : 1);
            for (const k of Object.keys(gain)) gain[k] = Math.max(1, Math.round(gain[k] * (this.campaign.has('richLoot') ? 1.5 : 1) * scav));
            if (!big && Math.random() < 0.35) gain.fiber = (gain.fiber || 0) + 2;
            m.grant(gain);
            BO.Sound.playExplosion?.(0.15);
            BO.FX.spawnParticles(new THREE.Vector3(t.x, t.y + 3, t.z), 14, 0x4f6b3a, 4, 10, 0.8);
            this.campaign.mark('gatheredNodes', 1, 10);
            this.campaign.mark('treesFelled', 1, 0);
            this.campaign.mark('harvest_' + (big ? 'hardwood' : 'pine'), 1, 0);
        }

        updateTrees() {
            const zone = BO.World.zone;
            if (!zone?.trees) return;
            const m = this.mode;
            const p = BO.Player.pos;
            for (const t of zone.trees) {
                if (t.alive || !t.renewAt || t.renewAt > m.clock) continue;
                if (Math.hypot(t.x - p.x, t.z - p.z) < 40) continue;
                t.alive = true; t.renewAt = 0; t.hp = undefined;
                this.setTreeVisible(t, true);
            }
        }

        /** Saved felled trees: [index, type, renewAt]. Saved clocks are meaningless after reload, so regrowth restarts. */
        restoreTrees(list) {
            const zone = BO.World.zone;
            if (!zone?.trees) return;
            for (const [idx, type] of list) {
                const t = zone.trees.find((x) => x.idx === idx && x.type === type);
                if (t && t.alive) this.fellTree(t, null, true);
            }
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
            const tool = node.spec.tool ? this.pickTool(node.spec) : null;
            const gSpd = this.campaign.deep?.modFx?.gatherSpeedMult || 1;
            this.nextToolUse = m.clock + (tool ? 0.42 : node.spec.tool ? 0.5 : 0.19) / gSpd;
            BO.Player.meleeTimer = Math.max(BO.Player.meleeTimer, 0.25);
            BO.Player.meleeDur = 0.25;
            BO.Sound.playMelee();
            this.strike(marker.id, tool || null, 1);
            return true;
        }

        harvest(node, tool) {
            const m = this.mode;
            const { spec } = node;
            {
                this.deplete(node);
                // Small deposits regrow in a day; veins, boulders and digs refill over three days.
                const day = this.campaign.options?.dayLength || 360;
                if (node.kind !== 'deep') node.renewAt = m.clock + (spec.tool ? day * 3 : day);
                const mfx = this.campaign.deep?.modFx || {};
                const extraLoot = this.campaign.has('richLoot') || this.campaign.deep?.hasInfusion('fortune');
                const scavMult = 1 + BO.SurvivalCareer.masteryRank('scavenger') * 0.15;
                // Ground inside your own light claim is picked over: small deposits give half.
                const claimMult = !spec.tool && BO.GM?.active && BO.GM.get('threat')?.inClaim?.(node.marker.x, node.marker.z) ? 0.5 : 1;
                const yMult = claimMult * (mfx.gatherYieldMult || 1) * (mfx.gatherMult || 1) * scavMult * (this.campaign.has('sv_double_loot') ? 2 : 1);
                const gain = Object.fromEntries(Object.entries(spec.gain).map(([id, count]) => {
                    if (id === 'relic') return [id, count];
                    let amt = extraLoot ? count + Math.ceil(count * (this.campaign.deep?.hasInfusion('fortune') && this.campaign.has('richLoot') ? 0.9 : 0.5)) : count;
                    return [id, Math.max(1, Math.round(amt * yMult))];
                }));
                // Field Catalogue set bonuses (Earth, Flora) add a flat +1 to the primary yield.
                const setBonus = BO.GM?.active ? (BO.GM.get('catalogue')?.yieldBonus?.(node) || 0) : 0;
                const primary = Object.keys(gain).find((id) => id !== 'relic');
                if (setBonus && primary) gain[primary] += setBonus;
                if (mfx.gemDropChance && spec.tool === 'pick' && Math.random() < mfx.gemDropChance) {
                    gain.quartz = (gain.quartz || 0) + 1;
                }
                m.grant(gain);
                this.campaign.mark('gatheredNodes', 1, spec.tool ? 10 : 3);
                this.campaign.mark('harvest_' + node.kind, 1, 0);
                if (spec.tool === 'pick') this.campaign.mark('oreHarvests', 1, 0);
            }
            return true;
        }

        deplete(node) {
            node.hp = 0;
            node.marker.alive = false;
            this.showNode(node, false);
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
            const okAccess = site?.id === 'build:' + chestId || BO.ZoneWorldPlus?.canAccessChest?.(chestId, site);
            if (!chest || !data.items[id] || !okAccess) return false;
            const source = deposit ? this.inventory : chest;
            const target = deposit ? chest : this.inventory;
            const desired = amount === 'all' ? source[id] : Math.min(source[id] || 0, 1);
            const chestLim = BO.ZoneWorldPlus?.chestLimitsForKey?.(chestId) || { slots: 18, weight: 54 };
            const n = this.room(id, desired || 0, target, deposit ? chestLim : this.limits);
            if (!n) {
                this.mode.toast('The destination has no room.');
                return false;
            }
            source[id] -= n;
            target[id] = (target[id] || 0) + n;
            if (deposit) this.campaign.mark('storedItems', n, 0);
            return true;
        }

        recipe(id) {
            const tool = data.tools[id];
            if (tool) return { id, name: tool.name, station: tool.station, cost: tool.cost, tool };
            return data.recipes.find((entry) => entry.id === id);
        }

        canCraft(recipe) {
            if (!recipe) return false;
            if (recipe.station !== 'hand' && !this.campaign.stationAvailable(recipe.station)) return false;
            if (recipe.tech && this.campaign.deep && !this.campaign.deep.hasTech(recipe.tech)) return false;
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
            if (recipe.station === 'kiln') this.campaign.mark('kilnJobs', 1, 0);
            this.mode.toast(recipe.name + ' ready.');
            return true;
        }

        use(id) {
            if (!this.inventory[id]) return false;
            const p = BO.Player;
            const m = this.mode;
            const deep = this.campaign.deep;
            if ((id === 'freshWater' || id === 'salvageLine') && this.campaign.activities) {
                return this.campaign.activities.useItem(id);
            } else if (id === 'bandage' && p.hp < p.maxHp) {
                const hp = Math.min((this.campaign.has('fieldMedic') ? 40 : 27) * (deep?.modFx?.healItemMult || 1), p.maxHp - p.hp);
                p.hp += hp;
                if (deep) deep.bleeding = 0;
                this.campaign.mark('healed', Math.ceil(hp), 0);
            } else if (id === 'tea') {
                m.composure = Math.min(100, m.composure + 36);
                m.radiation = Math.max(0, m.radiation - 19);
                if (deep) deep.hydration = Math.min(100, deep.hydration + 25);
            } else if (id === 'stew') {
                m.hunger = Math.min(100, m.hunger + 65);
                p.hp = Math.min(p.maxHp, p.hp + 25);
                if (deep) { deep.hydration = Math.min(100, deep.hydration + 35); deep.temp = Math.max(22, deep.temp + 10); deep.comfortUntil = m.clock + 180; }
                m.toast('Ate Hearty Stew (+65 hunger, +35 water, +25 HP, Warmed).');
            } else if (id === 'espresso') {
                m.composure = Math.min(100, m.composure + 25);
                p.tacStamina = 1.0;
                if (deep) { deep.hydration = Math.min(100, deep.hydration + 20); deep.activeTonics.espresso = m.clock + 25; }
                m.toast('Drank Field Espresso (stamina & focus boost!).');
            } else if (id === 'antibiotic') {
                m.radiation = Math.max(0, m.radiation - 30);
                if (deep) { deep.bleeding = 0; deep.infection = 0; }
                m.toast('Antibiotic Elixir cleared bleeding & bio-infection.');
            } else if (id === 'broth') {
                if (deep) { deep.temp = Math.min(35, deep.temp + 18); deep.hydration = Math.min(100, deep.hydration + 20); deep.comfortUntil = m.clock + 150; }
                m.toast('Thermal Spiced Broth warmed you against the cold.');
            } else if (id === 'aetherStim') {
                p.hp = Math.min(p.maxHp, p.hp + 45);
                p.tacStamina = 1.0;
                if (deep) deep.activeTonics.aetherStim = m.clock + 20;
                m.toast('Aether Stim injected (+45 HP & speed surge!).');
            } else if (id === 'orbitalFlare') {
                if (this.campaign.activities) {
                    this.campaign.activities.nextDrop = m.clock;
                    m.toast('Orbital Supply Flare launched! Weather-balloon cache inbound.');
                }
            } else if (['jugBrew', 'speedTonic', 'staminElixir', 'deadshotTinc'].includes(id)) {
                if (deep) {
                    deep.activeTonics[id] = m.clock + 180 * (deep.modFx?.tonicDurMult || 1);
                    deep.recomputePlayerStats();
                }
                BO.Sound?.playPerkBuy?.();
                m.toast(nameOf(id) + ' active for 3 minutes!');
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
            if (!this.use(this.inventory.lantern && this.inventory.fuel ? 'lantern' : 'torch')) m.toast('Craft hand torches (timber, resin, fiber) or a lantern first.');
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
                this.nextRenewalCheck = m.clock + 1.5;
                this.updateTrees();
                // Distance culling: deposits are small, so beyond 120 m they cost draw calls and show nothing.
                if (BO.World.large) {
                    for (const node of this.resources.values()) {
                        if (node._batch) continue;
                        const near = Math.abs(p.pos.x - node.marker.x) < 120 && Math.abs(p.pos.z - node.marker.z) < 120;
                        const vis = near && node.hp > 0;
                        if (node._vis !== vis) { node._vis = vis; for (const mesh of node.geometry) mesh.visible = vis; }
                    }
                }
                for (const node of this.resources.values()) {
                    if (!node.renewAt || node.renewAt > m.clock || Math.hypot(p.pos.x - node.marker.x, p.pos.z - node.marker.z) < 10) continue;
                    node.hp = node.spec.strokes;
                    node.renewAt = 0;
                    node.marker.alive = true;
                    this.showNode(node, true);
                    if (node.collider && !node.collider.active) {
                        node.collider.active = true;
                        BO.World.worldMeshes.push(node.geometry[0]);
                    }
                }
            }
            this.batch?.update(p.pos.x, p.pos.z, m.clock);
            const inCave = p.pos.y < -2.5 && p.pos.x < -4.6 && p.pos.z < -43;
            if (inCave && !this.caveVisited) {
                this.caveVisited = true;
                this.campaign.mark('visitedCavern', 1, 40);
                m.toast('Echo Cavern discovered. Press ' + BO.Settings.keyLabel(BO.Settings.getKeybinds().survLight) + ' to light a carried torch.');
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
