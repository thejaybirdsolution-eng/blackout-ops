/* ============================================================================
   BLACKOUT OPS — Open World RPG · Props, NPCs, Loot Bags & Sealed Interiors
   Supports Workbenches, Bounty Boards, auto-dismount indoors/dialogue, and
   new NPCs (Torin, Dr. Lyra Chen).
============================================================================ */
(function (BO) {
    'use strict';

    const UP = new THREE.Vector3(0, 1.2, 0);
    const std = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7, metalness: 0.3 }, o || {}));
    const glow = (c) => new THREE.MeshBasicMaterial({ color: c });

    function label(text, color = '#f8fafc') {
        const c = document.createElement('canvas');
        c.width = 256; c.height = 48;
        const g = c.getContext('2d');
        g.font = 'bold 24px "Segoe UI", sans-serif';
        g.textAlign = 'center';
        g.lineWidth = 5; g.strokeStyle = 'rgba(0,0,0,0.75)';
        g.strokeText(text, 128, 32);
        g.fillStyle = color; g.fillText(text, 128, 32);
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false, transparent: true }));
        sp.scale.set(2.6, 0.5, 1);
        return sp;
    }

    const Props = {
        props: [],
        npcs: [],
        bags: [],

        get s() { return BO.OWRPGMode.state; },
        get D() { return BO.OWRPGWorldData; },

        clear() {
            for (const p of this.props) p.mesh.removeFromParent();
            for (const n of this.npcs) n.parts.root.removeFromParent();
            for (const b of this.bags) b.mesh.removeFromParent();
            this.props = []; this.npcs = []; this.bags = [];
        },

        yFor(def) {
            if (typeof def.y === 'number') return def.y;
            if (def.int) return 0;
            return BO.World.terrainHeight(def.x, def.z) + (def.indoor ? 0.2 : 0);
        },

        build(scene) {
            this.clear();
            const s = this.s;
            for (const def of this.D.INTERACTS) {
                if (def.kind === 'sac' && s.worldFlags['sac_' + def.id]) continue;
                const mesh = this._mesh(def);
                const y = this.yFor(def);
                mesh.position.set(def.x, y, def.z);
                scene.add(mesh);
                this.props.push({ def, mesh, pos: new THREE.Vector3(def.x, y, def.z), phase: Math.random() * 6 });
            }
            const FA = BO.OWRPGFactionsData.FACTIONS;
            for (const def of this.D.NPCS) {
                const parts = BO.CharacterMesh.buildSoldier(def.faction === 'militia' || def.faction === 'aegis' ? 0 : 1, {});
                parts.root.traverse((o) => { if (o.isMesh) o.userData = {}; });
                const y = this.yFor(def);
                parts.root.position.set(def.x, y, def.z);
                parts.root.rotation.y = def.yaw || 0;
                const tag = label(def.name, FA[def.faction].color);
                tag.position.set(0, 2.2, 0);
                parts.root.add(tag);
                scene.add(parts.root);
                this.npcs.push({ def, parts, pos: new THREE.Vector3(def.x, y, def.z), yaw: def.yaw || 0, phase: Math.random() * 6 });
            }
            for (const [id, on] of Object.entries(s.pylons)) if (on) BO.OWRPGWorldArt.setPylonActive(BO.World, id, true);
        },

        _mesh(def) {
            const g = new THREE.Group();
            const add = (geo, mat, x = 0, y = 0, z = 0, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; g.add(m); return m; };
            switch (def.kind) {
                case 'container':
                case 'stash': {
                    add(new THREE.BoxGeometry(1.0, 0.6, 0.6), std(def.kind === 'stash' ? 0x334155 : 0x6b4f2e), 0, 0.3, 0);
                    add(new THREE.BoxGeometry(1.04, 0.08, 0.64), std(0x1f2937, { metalness: 0.7 }), 0, 0.62, 0, false);
                    if (def.locked) add(new THREE.BoxGeometry(0.12, 0.12, 0.04), glow(0xef4444), 0, 0.42, 0.32, false);
                    g.userData.glow = add(new THREE.SphereGeometry(0.06, 6, 6), glow(def.kind === 'stash' ? 0x38bdf8 : 0xfbbf24), 0, 0.75, 0, false);
                    break;
                }
                case 'workbench':
                    add(new THREE.BoxGeometry(1.5, 0.9, 0.75), std(0x523b28), 0, 0.45, 0);
                    add(new THREE.BoxGeometry(1.56, 0.08, 0.8), std(0x475569, { metalness: 0.8 }), 0, 0.92, 0, false);
                    g.userData.glow = add(new THREE.BoxGeometry(0.28, 0.22, 0.2), glow(0xf59e0b), 0.4, 1.07, 0, false);
                    break;
                case 'bounty_board':
                    add(new THREE.BoxGeometry(1.4, 1.6, 0.14), std(0x4a3525), 0, 1.1, 0);
                    g.userData.glow = add(new THREE.BoxGeometry(0.95, 0.7, 0.04), glow(0xfacc15), 0, 1.25, 0.09, false);
                    break;
                case 'terminal':
                    add(new THREE.BoxGeometry(0.7, 1.3, 0.4), std(0x1e293b), 0, 0.65, 0);
                    g.userData.glow = add(new THREE.BoxGeometry(0.5, 0.35, 0.02), glow(0x22d3ee), 0, 1.05, 0.21, false);
                    break;
                case 'dungeon_gate': {
                    for (const x of [-1.25, 1.25]) add(new THREE.BoxGeometry(0.5, 3.5, 0.7), std(0x485362), x, 1.75);
                    add(new THREE.BoxGeometry(3, 0.55, 0.7), std(0x64748b), 0, 3.45);
                    g.userData.glow = add(new THREE.TorusGeometry(0.9, 0.055, 8, 32), glow(0x67e8f9), 0, 1.8);
                    const tag = label(def.dngName, '#67e8f9'); tag.position.y = 4; g.add(tag);
                    break;
                }
                case 'standing_stone': {
                    const stone = BO.OWRPGStatsData.STANDING_STONES[def.stoneId];
                    add(new THREE.CylinderGeometry(0.3, 0.7, 2.7, 5), std(0x334155), 0, 1.35);
                    g.userData.glow = add(new THREE.TorusGeometry(0.48, 0.035, 6, 24), glow(stone.color), 0, 1.9, 0.35);
                    const tag = label(stone.name, stone.color); tag.position.y = 3.2; g.add(tag);
                    break;
                }
                case 'resource_node': {
                    const ore = def.skill === 'mining', rune = def.skill === 'arcana', wood = def.yieldItem === 'elderwood_log';
                    const color = ore ? 0x7dd3fc : rune ? 0xc084fc : 0x86efac;
                    if (wood) {
                        add(new THREE.CylinderGeometry(0.2, 0.45, 3.2, 7), std(0x594230), 0, 1.6);
                        for (let i = 0; i < 3; i++) add(new THREE.ConeGeometry(1.6-i*0.3, 2, 7), std(0x2d6542), 0, 2.8+i*0.7);
                    } else {
                        for (let i = 0; i < 5; i++) {
                            const angle = i * Math.PI * 2 / 5;
                            const node = add(new THREE.IcosahedronGeometry(ore || rune ? 0.42 : 0.22, 0), std(color, { emissive: color, emissiveIntensity: 0.12 }), Math.cos(angle)*0.4, 0.3 + i*0.07, Math.sin(angle)*0.4);
                            node.scale.y = rune ? 2.4 : 1;
                        }
                    }
                    g.userData.glow = add(new THREE.SphereGeometry(0.09, 8, 6), glow(color), 0, wood ? 1.9 : 1.1);
                    break;
                }
                case 'lore_tome':
                    add(new THREE.BoxGeometry(0.8, 0.75, 0.6), std(0x475569), 0, 0.375);
                    g.userData.glow = add(new THREE.BoxGeometry(0.65, 0.1, 0.45), glow(0xe9c46a), 0, 0.82);
                    break;
                case 'hatch':
                    g.userData.glow = add(new THREE.TorusGeometry(1.1, 0.06, 6, 24), glow(0xf5a623), 0, 0.55, 0);
                    g.userData.glow.rotation.x = Math.PI / 2;
                    break;
                case 'exit':
                    for (const dx of [-0.35, 0.35]) add(new THREE.BoxGeometry(0.08, 4, 0.08), std(0x64748b), dx, 2, 0);
                    for (let i = 0; i < 9; i++) add(new THREE.BoxGeometry(0.7, 0.05, 0.05), std(0x94a3b8), 0, 0.35 + i * 0.42, 0);
                    g.userData.glow = add(new THREE.SphereGeometry(0.1, 6, 6), glow(0xa3e635), 0, 4, 0);
                    break;
                case 'valve':
                    add(new THREE.CylinderGeometry(0.25, 0.25, 1.4, 10), std(0x52525b), 0, 0.7, 0);
                    g.userData.wheel = add(new THREE.TorusGeometry(0.55, 0.07, 6, 20), std(0xb91c1c, { metalness: 0.6 }), 0, 1.4, 0.2);
                    g.userData.glow = add(new THREE.SphereGeometry(0.08, 6, 6), glow(0xef4444), 0, 2, 0);
                    break;
                case 'mast':
                    add(new THREE.BoxGeometry(0.8, 1.2, 0.3), std(0x475569), 0, 1.2, 0);
                    g.userData.glow = add(new THREE.BoxGeometry(0.5, 0.2, 0.02), glow(0xf97316), 0, 1.4, 0.16);
                    break;
                case 'sac': {
                    const m = add(new THREE.SphereGeometry(0.7, 12, 10), new THREE.MeshStandardMaterial({ color: 0x65a30d, emissive: 0x365314, emissiveIntensity: 0.8, roughness: 0.4 }), 0, 0.6, 0);
                    m.scale.set(1, 1.3, 1);
                    g.userData.pulse = m;
                    break;
                }
                default:
                    add(new THREE.BoxGeometry(0.5, 0.5, 0.5), std(0x888888), 0, 0.25, 0);
            }
            return g;
        },

        nearest() {
            const P = BO.Player;
            const s = this.s;
            let best = null, bd = 2.8;
            const consider = (type, obj, pos, text, reach = 2.6) => {
                const d = BO.Math.dist3D(P.pos.x, P.pos.y + 0.9, P.pos.z, pos.x, pos.y + 0.6, pos.z);
                if (d < Math.min(bd, reach)) { bd = d; best = { type, obj, text }; }
            };
            for (const n of this.npcs) consider('npc', n, n.pos, `Talk to ${n.def.name}`, 3);
            for (const b of this.bags) consider('bag', b, b.pos, 'Search remains');
            for (const p of this.props) {
                const def = p.def;
                if (s.worldFlags['opened_' + def.id] && def.kind === 'container') continue;
                consider('prop', p, p.pos, this._propText(def), def.kind === 'hatch' ? 2.4 : 2.3);
            }
            const art = BO.World.owrpg;
            if (art) for (const py of this.D.PYLONS) {
                const pos = art.pylons[py.id].group.position;
                consider('pylon', py, pos, s.pylons[py.id] ? `Transit Pylon — ${py.name}` : `Wake ${py.name}`, 3);
            }
            return best;
        },

        _propText(def) {
            const s = this.s;
            const C = BO.OWRPGCharacter;
            switch (def.kind) {
                case 'stash': return 'Open stash';
                case 'workbench': return 'Use Field Repair Bench';
                case 'bounty_board': return 'Open Bounty Board';
                case 'container': {
                    if (!def.locked) return 'Search ' + def.name;
                    const fx = C.perkFx(s);
                    if (fx.lockpick) return `Pick lock: ${def.name} [Lockpick]`;
                    if (C.attr(s, 'TCH') >= 7) return `Bypass lock: ${def.name} [TCH 7]`;
                    if (C.attr(s, 'BRW') >= 8) return `Smash open: ${def.name} [BRW 8]`;
                    return `${def.name} — locked (Lockpick, TCH 7 or BRW 8)`;
                }
                case 'terminal': return s.worldFlags.junction_rerouted ? 'Junction — main line rerouted' : 'Use ' + def.name;
                case 'dungeon_gate': return 'Enter ' + def.dngName + ' · Level ' + def.dngLvl;
                case 'standing_stone': return (s.player.standingStone === def.stoneId ? 'Attuned to ' : 'Attune to ') + def.name;
                case 'resource_node': {
                    const left = Math.ceil((s.worldFlags['gather_' + def.id] || 0) - s.playtimeSec);
                    return left > 0 ? def.name + ' · Regrows in ' + left + 's' : 'Harvest ' + def.name;
                }
                case 'lore_tome': return 'Read ' + def.name;
                case 'hatch': return 'Enter the Culvert Sublevel';
                case 'exit': return 'Climb to the surface';
                case 'valve': return s.worldFlags.culvert_valve_pulled ? 'Bypass valve — removed' : 'Pull the bypass valve';
                case 'mast': return s.worldFlags.relay_lit ? 'Relay mast — online' : 'Repair the relay mast';
                case 'sac': return 'Burn the egg sac';
                default: return def.name;
            }
        },

        interact(t) {
            const M = BO.OWRPGMode;
            if (t.type === 'npc') { BO.OWRPGMounts?.dismount(true); return M.openDialogue(t.obj.def.id); }
            if (t.type === 'bag') return this._lootBag(t.obj);
            if (t.type === 'pylon') return M.usePylon(t.obj);
            return this._useProp(t.obj);
        },

        _useProp(p) {
            const s = this.s;
            const M = BO.OWRPGMode;
            const C = BO.OWRPGCharacter;
            const I = BO.OWRPGInventory;
            const def = p.def;
            const toast = (text, color = '#e2e8f0') => BO.Events.emit('hud:toast', { text, color });
            switch (def.kind) {
                case 'stash': M.openStash(); return;
                case 'workbench': BO.OWRPGUI.openPipPad('inventory'); return;
                case 'bounty_board': BO.OWRPGUI.openPipPad('bounties'); return;
                case 'container': {
                    if (s.worldFlags['opened_' + def.id]) return;
                    if (def.locked) {
                        const fx = C.perkFx(s);
                        if (!fx.lockpick && C.attr(s, 'TCH') < 7 && C.attr(s, 'BRW') < 8) { toast('Locked. Needs the Lockpick perk, TCH 7 or BRW 8.', '#f97316'); return; }
                        if (!fx.lockpick && C.attr(s, 'TCH') < 7) BO.OWRPGAI.noise(p.pos, 25);
                    }
                    if (def.owner && this._witnessed(def.owner, p.pos)) {
                        M.setFlag('provoked_' + def.owner, true);
                        M.changeRep(def.owner, -150);
                        BO.OWRPGAI.refreshHostility();
                        for (const a of BO.OWRPGAI.agentsNear(p.pos, 30, false)) if (a.faction === def.owner) BO.OWRPGAI.engage(a);
                        toast('CAUGHT STEALING — ' + BO.OWRPGFactionsData.FACTIONS[def.owner].short.toUpperCase() + ' HOSTILE', '#ef4444');
                    }
                    M.setFlag('opened_' + def.id, true);
                    const loot = I.rollLoot(s, def.loot || 'cache', def.locked ? 3 : 2);
                    if (def.grant) loot.items.push({ id: def.grant, n: 1 });
                    if (def.grant2) loot.items.push({ id: def.grant2, n: 1 });
                    M.giveLootReport(loot, def.name);
                    C.addSkillXp(s, 'delving', def.int ? 65 : 25);
                    if (p.mesh.userData.glow) p.mesh.userData.glow.visible = false;
                    BO.Sound.playUIClick();
                    return;
                }
                case 'terminal': {
                    if (s.worldFlags.junction_rerouted) { toast('The main line is already rerouted.'); return; }
                    if (C.attr(s, 'TCH') >= 6 || I.has(s, 'pressure_schematic')) {
                        M.setFlag('junction_rerouted', true);
                        M.giveXp(80, 'Rerouted');
                        toast('Main line rerouted. The bypass is starved of pressure.', '#22d3ee');
                        if (BO.OWRPGCharacter.perkFx(s).override) BO.OWRPGAI.noise(p.pos, 0);
                    } else toast('The pressure readouts mean nothing to you. (TCH 6 or a Pressure Schematic)', '#f97316');
                    return;
                }
                case 'hatch': {
                    const fx = C.perkFx(s);
                    if (!I.has(s, 'culvert_keycard') && !fx.lockpick && C.attr(s, 'BRW') < 7) { toast('The hatch is sealed. (Culvert Keycard, Lockpick perk or BRW 7)', '#f97316'); return; }
                    this.enter(def.to, 'culvert');
                    return;
                }
                case 'dungeon_gate': this.enter(def.to, def.dngId); return;
                case 'standing_stone': {
                    const stone = BO.OWRPGStatsData.STANDING_STONES[def.stoneId];
                    if (s.player.standingStone === def.stoneId) { toast(stone.desc, stone.color); return; }
                    s.player.standingStone = def.stoneId;
                    M.applyDerived();
                    toast(stone.name + ' — ' + stone.desc, stone.color);
                    BO.Sound.playPerkBuy();
                    M.checkpoint('Standing stone attuned');
                    return;
                }
                case 'resource_node': {
                    if ((s.worldFlags['gather_' + def.id] || 0) > s.playtimeSec) return;
                    const fx = C.perkFx(s);
                    const n = 1 + (Math.random() < Math.min(1, (fx.doubleGather || 0) + (fx.gatherChance || 0)) ? 1 : 0);
                    I.add(s, def.yieldItem, n);
                    s.worldFlags['gather_' + def.id] = s.playtimeSec + 600;
                    C.addSkillXp(s, def.skill, 35);
                    M.itemEvent(def.yieldItem);
                    M.giveXp(8, 'Harvest');
                    toast(I.def(def.yieldItem).name + ' ×' + n, '#86efac');
                    BO.Sound.playUIClick();
                    return;
                }
                case 'lore_tome': {
                    const lore = {
                        l_tome_1: 'Haven fell when its transmitters went silent. Freestead survives by maintaining the old relay routes. The first expedition marked a culvert beneath Pump Three as a passage into the buried network.',
                        l_tome_2: 'The Grimhollow Pact bound the dead to the moor. Its keepers sealed their names inside the Sunken Crypt. Fire breaks their frost-bound armor, but the Nightlords wait beyond the graveyard.',
                        l_tome_3: 'The Dragonwilds formed around a fallen star. Runic stone feeds the ash-drakes, while frost disrupts their inner flame. Vaelgor guards the deepest vault, and the last expedition never returned.'
                    };
                    if (!s.worldFlags['read_' + def.id]) {
                        M.setFlag('read_' + def.id, true);
                        C.addSkillXp(s, 'arcana', 80);
                        M.giveXp(75, 'Chronicle discovered');
                    }
                    BO.OWRPGUI.open('lore', '<span class="ow-kicker">MERIDIAN ARCHIVES</span><h2>' + def.name + '</h2><p class="ow-dim">' + lore[def.id] + '</p><button class="ow-btn" data-act="close">CLOSE</button>');
                    return;
                }
                case 'exit': this.exit(def.to); return;
                case 'valve': {
                    if (s.worldFlags.culvert_valve_pulled) { toast('The bypass is already gone.'); return; }
                    M.setFlag('culvert_valve_pulled', true);
                    I.add(s, 'bypass_valve', 1);
                    M.itemEvent('bypass_valve');
                    M.giveXp(60, 'Bypass pulled');
                    toast('You wrench the bypass valve free. Somewhere above, Pump Three groans back to life.', '#a3e635');
                    BO.OWRPGAI.noise(p.pos, 40);
                    return;
                }
                case 'mast': {
                    if (s.worldFlags.relay_lit) { toast('The relay is already broadcasting.'); return; }
                    if (I.has(s, 'relay_fuse')) { I.remove(s, 'relay_fuse', 1); }
                    else if (C.attr(s, 'TCH') < 5) { toast('The fuse is blown. (Relay Fuse or TCH 5 to jury-rig)', '#f97316'); return; }
                    M.setFlag('relay_lit', true);
                    M.giveXp(80, 'Relay online');
                    if (p.mesh.userData.glow) p.mesh.userData.glow.material.color.setHex(0x22c55e);
                    toast('The relay hums. Static gives way to voices from the outer farms.', '#22d3ee');
                    return;
                }
                case 'sac': {
                    M.setFlag('sac_' + def.id, true);
                    M.setFlag('sacs_destroyed', (Number(s.worldFlags.sacs_destroyed) || 0) + 1);
                    BO.FX.spawnExplosion(p.pos.clone().add(UP), 2.5, 0x84cc16);
                    BO.Sound.playExplosion?.(0.4);
                    p.mesh.removeFromParent();
                    this.props.splice(this.props.indexOf(p), 1);
                    M.giveXp(30, null, true);
                    if (Math.random() < 0.5) BO.OWRPGAI.spawn('crawler', def.x + 2, def.z + 2, { poiId: 'shale_cave', leash: 40 });
                    return;
                }
                default: return;
            }
        },

        _witnessed(faction, pos) {
            if (BO.OWRPGMode.camoT > 0) return false;
            return BO.OWRPGAI.agents.some((a) => a.alive && a.faction === faction && !a.hostile &&
                a.ent.pos.distanceTo(pos) < 18 && BO.World.hasLineOfSight(a.ent.pos.x, a.ent.pos.y + 1.5, a.ent.pos.z, pos.x, pos.y + 0.8, pos.z));
        },

        dropBag(pos, loot) {
            if (!loot.items.length && !loot.credits) return;
            const g = new THREE.Group();
            const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.35), std(0x3f3a2e));
            m.position.y = 0.15;
            const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.55 }));
            beam.position.y = 0.95;
            g.add(m, beam);
            const y = BO.World.getGroundHeight(pos.x, pos.z, pos.y + 0.6);
            g.position.set(pos.x, y, pos.z);
            BO.World.scene.add(g);
            this.bags.push({ mesh: g, pos: new THREE.Vector3(pos.x, y, pos.z), loot, t: 300 });
        },

        _lootBag(b) {
            BO.OWRPGMode.giveLootReport(b.loot, 'Remains');
            b.mesh.removeFromParent();
            this.bags.splice(this.bags.indexOf(b), 1);
        },

        enter(to, id) {
            BO.OWRPGMounts?.dismount(true);
            const P = BO.Player;
            P.pos.set(to.x, to.y, to.z);
            P.vel.set(0, 0, 0);
            P.yaw = to.yaw || 0;
            this.s.player.interiorId = id;
            const dungeon = this.D.DUNGEONS.find(d => d.id === id || (id === 'culvert' && d.id === 'culvert_sublevel'));
            BO.Events.emit('hud:banner', { title: dungeon ? dungeon.name.toUpperCase() : 'CULVERT SUBLEVEL', sub: dungeon ? 'Recommended level ' + dungeon.lvl : 'Flooded maintenance tunnels', color: '#84cc16' });
            BO.OWRPGWorldSim.tick1(0);
            BO.OWRPGMode.checkpoint('Entered ' + (dungeon ? dungeon.name : 'interior'));
        },

        exit(to) {
            const P = BO.Player;
            P.pos.set(to.x, BO.World.terrainHeight(to.x, to.z) + 0.2, to.z);
            P.vel.set(0, 0, 0);
            P.yaw = to.yaw || 0;
            this.s.player.interiorId = null;
            BO.OWRPGWorldSim.tick1(0);
            BO.OWRPGMode.checkpoint('Left interior');
        },

        update(dt) {
            const P = BO.Player;
            for (const p of this.props) {
                const near = BO.Math.dist2D(P.pos.x, P.pos.z, p.pos.x, p.pos.z) < 58;
                if (p.mesh.visible !== near) p.mesh.visible = near;
                if (!near) continue;
                p.phase += dt;
                const u = p.mesh.userData;
                if (u.glow && p.def.kind === 'resource_node') u.glow.visible = (this.s.worldFlags['gather_' + p.def.id] || 0) <= this.s.playtimeSec;
                if (u.glow && p.def.kind === 'container') u.glow.visible = !this.s.worldFlags['opened_' + p.def.id];
                if (u.glow && u.glow.visible) u.glow.scale.setScalar(1 + Math.sin(p.phase * 4) * 0.25);
                if (u.pulse) u.pulse.scale.set(1 + Math.sin(p.phase * 3) * 0.06, 1.3 + Math.sin(p.phase * 3) * 0.08, 1);
                if (u.wheel && this.s.worldFlags.culvert_valve_pulled) u.wheel.visible = false;
            }
            for (const n of this.npcs) {
                n.phase += dt;
                const d = BO.Math.dist2D(P.pos.x, P.pos.z, n.pos.x, n.pos.z);
                const near = d < (n.def.indoor ? 36 : 65);
                if (n.parts.root.visible !== near) n.parts.root.visible = near;
                if (!near) continue;
                const want = d < 6 ? Math.atan2(P.pos.x - n.pos.x, P.pos.z - n.pos.z) : n.def.yaw || 0;
                n.yaw += BO.Math.angleDiff(n.yaw, want) * Math.min(1, dt * 4);
                n.parts.root.rotation.y = n.yaw;
                BO.CharacterMesh.animateLimbs(n.parts, 0, n.phase * 1.4, 0, 0);
            }
            for (let i = this.bags.length - 1; i >= 0; i--) {
                const b = this.bags[i];
                b.t -= dt;
                b.mesh.rotation.y += dt;
                if (b.t <= 0) { b.mesh.removeFromParent(); this.bags.splice(i, 1); }
            }
        }
    };

    BO.OWRPGInteriors = Props;
})(window.BO);
