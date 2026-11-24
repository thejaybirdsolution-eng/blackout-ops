/* ============================================================================
   BLACKOUT OPS — Dungeons and the boss arena
   Nine hand-designed dungeons, each entered from a doorway in the world and
   built as its own sealed space beyond the map edge when you step inside:
   small cellars to seven-room bunkers; rooms full of enemies, puzzles
   (levers, braziers, valves, fuses, keypad codes, a timed vault, a dark
   maze), fire hazards, end chests and bosses. Doors ahead stay locked until
   the room is cleared or its puzzle solved.
   The arena is a separate space the Pit Masters send you to for a boss duel;
   a portal home opens when the boss falls, with time to loot.
============================================================================ */
(function (BO) {
    'use strict';

    const SYMBOLS = [['▲', 0xff5a4a, 'red triangle'], ['●', 0x4aa8ff, 'blue circle'], ['■', 0x5fd17a, 'green square'], ['◆', 0xffd27a, 'gold diamond'], ['✚', 0xb26bff, 'violet cross']];

    /* Room: w,d (m), kind tags. enemies: count, champ: champion count, boss: boss spec id,
       puzzle: {type,...}, chest: tier, hazard: 'fire', dark: true, ore: n deposits, note: text. */
    const DUNGEONS = [
        { id: 'cellar', name: 'Kessler Root Cellar', size: 'Small', near: 'farmhouse', theme: 0x6a5a48, tier: 1,
            blurb: 'A farm cellar the family barricaded from the inside. Something is still down there.',
            rooms: [{ w: 8, d: 8, enemies: 3, note: 'Scratched into the shelf: "Ma says don\'t open the back room."' }, { w: 7, d: 7, enemies: 2, champ: 1, chest: 1 }] },
        { id: 'crypt', name: 'Saint Ansel Crypt', size: 'Small', near: 'church', theme: 0x5a5866, tier: 1,
            blurb: 'Beneath the church: an ossuary and four cold braziers.',
            rooms: [{ w: 9, d: 9, enemies: 3 }, { w: 12, d: 12, puzzle: { type: 'braziers', count: 4, time: 25 }, note: 'Carved over the gate: "Kindle all four before the first goes cold." (25 seconds once you light the first.)' }, { w: 6, d: 6, chest: 2 }] },
        { id: 'mine', name: 'Pinebreak Mine Shaft', size: 'Medium', near: 'mill', theme: 0x5a4a3a, tier: 2,
            blurb: 'An abandoned seam with live ore, three missing fuses and a dead lift.',
            rooms: [{ w: 10, d: 12, enemies: 3, ore: 4 }, { w: 12, d: 10, enemies: 4, puzzle: { type: 'fuses', count: 3 }, ore: 3, note: 'Foreman\'s board: "LIFT FUSES REMOVED — find all 3 and refit the panel."' }, { w: 10, d: 10, enemies: 5, champ: 1, ore: 5 }, { w: 7, d: 7, chest: 2 }] },
        { id: 'pumps', name: 'Spillway Pump Station', size: 'Medium', near: 'pumphouse', theme: 0x3f5a64, tier: 2,
            blurb: 'A flooded control level. Set the valves to drain it.',
            rooms: [{ w: 10, d: 10, enemies: 4 }, { w: 12, d: 12, puzzle: { type: 'valves', count: 3 }, note: 'Pressure chart on the wall: the gauge panel shows the setting each valve needs.' }, { w: 14, d: 10, enemies: 6, champ: 1 }, { w: 7, d: 7, chest: 3 }] },
        { id: 'bunker', name: 'Sable Bunker K-7', size: 'Large', near: 'office', theme: 0x46503f, tier: 3,
            blurb: 'A Sable Company command bunker: barracks, an armoury behind a code lock, and whatever they were keeping in the cells.',
            rooms: [{ w: 12, d: 10, enemies: 5 }, { w: 10, d: 12, enemies: 4, note: 'CODE' }, { w: 12, d: 10, puzzle: { type: 'keypad', digits: 3 }, enemies: 3 }, { w: 14, d: 12, enemies: 7, champ: 2 }, { w: 16, d: 16, boss: 'boss_colossus', bossName: 'K-7 Containment Breaker' }, { w: 8, d: 8, chest: 4 }] },
        { id: 'hive', name: 'The Hive Tunnels', size: 'Large', near: 'cabin', region: 'pine', theme: 0x4a3a2a, tier: 3,
            blurb: 'Under the forest the nests connect. Room after room of infected, and the matron at the heart.',
            rooms: [{ w: 12, d: 12, enemies: 7 }, { w: 14, d: 12, enemies: 9, champ: 1 }, { w: 12, d: 14, enemies: 10, champ: 1, dark: true }, { w: 14, d: 14, enemies: 12, champ: 2 }, { w: 18, d: 18, boss: 'boss_hydra_matron', bossName: 'Hive Matron' }, { w: 8, d: 8, chest: 4 }] },
        { id: 'vault', name: 'Frostline Cold-Storage Vault', size: 'Medium', near: 'lodge', theme: 0x6a7a88, tier: 3,
            blurb: 'An alarm trips the moment you enter. Reach the vault before lockdown.',
            rooms: [{ w: 10, d: 10, puzzle: { type: 'timed', time: 75 }, note: 'ALARM: 75 s to vault lockdown. Run.' }, { w: 12, d: 10, enemies: 5 }, { w: 10, d: 14, enemies: 4, hazard: 'fire' }, { w: 8, d: 8, chest: 3 }] },
        { id: 'furnace', name: 'Cinder Furnace Halls', size: 'Medium', near: 'control', theme: 0x6a3a2a, tier: 3,
            blurb: 'Gas jets still fire on a cycle. Something three-headed sleeps by the furnace.',
            rooms: [{ w: 12, d: 10, enemies: 5, hazard: 'fire' }, { w: 12, d: 14, enemies: 6, hazard: 'fire', champ: 1 }, { w: 16, d: 16, boss: 'boss_cerberus', bossName: 'Furnace Hound' }, { w: 8, d: 8, chest: 3 }] },
        { id: 'sublevel', name: 'Black Pine Sublevel B3', size: 'Large', near: 'lab', theme: 0x9aa8b0, tier: 4,
            blurb: 'The research floor nobody was cleared for: a lever-locked containment wing, a lightless maze and Subject Zero.',
            rooms: [{ w: 12, d: 12, enemies: 6, note: 'LEVERS' }, { w: 14, d: 12, puzzle: { type: 'levers', count: 4 }, enemies: 3 }, { w: 12, d: 18, enemies: 8, dark: true, champ: 1 }, { w: 14, d: 14, enemies: 9, champ: 2 }, { w: 12, d: 12, puzzle: { type: 'valves', count: 3 } }, { w: 18, d: 18, boss: 'boss_nyx', bossName: 'Subject Zero' }, { w: 8, d: 8, chest: 5 }] }
    ];

    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    /* ================================================================ space builder */
    class Space {
        constructor(mode, ox, oz, color) {
            this.mode = mode; this.ox = ox; this.oz = oz; this.color = color;
            this.meshes = []; this.worldRegistered = []; this.cols = []; this.markers = []; this.doors = []; this.portals = [];
        }
        mat(c, opts = {}) { return new THREE.MeshStandardMaterial({ color: new THREE.Color(c).convertSRGBToLinear(), roughness: 0.9, ...opts }); }
        box(x, y, z, w, h, d, c, collide = true, opts) {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.mat(c, opts));
            mesh.position.set(x, y, z);
            mesh.receiveShadow = true;
            this.mode.scene.add(mesh);
            this.meshes.push(mesh);
            if (collide) {
                const col = { minX: x - w / 2, maxX: x + w / 2, minY: y - h / 2, maxY: y + h / 2, minZ: z - d / 2, maxZ: z + d / 2, active: true, navIgnore: true };
                BO.World.colliders.push(col);
                BO.World.worldMeshes.push(mesh);
                mesh.updateMatrixWorld();
                this.cols.push(col);
                this.worldRegistered.push(mesh);
                mesh.userData.col = col;
            }
            return mesh;
        }
        /** Room centred at (cx, cz) with door gaps on north (+z) / south (-z). */
        room(cx, cz, w, d, h, doors) {
            const c = this.color, t = 0.4, gap = 2.6;
            this.box(cx, -0.25, cz, w + t * 2, 0.5, d + t * 2, new THREE.Color(c).multiplyScalar(0.7).getHex());
            this.box(cx, h + 0.2, cz, w + t * 2, 0.4, d + t * 2, new THREE.Color(c).multiplyScalar(0.5).getHex(), false);
            for (const side of [-1, 1]) this.box(cx + side * (w / 2 + t / 2), h / 2, cz, t, h, d + t * 2, c);
            for (const [side, open] of [[-1, doors.s], [1, doors.n]]) {
                const z = cz + side * (d / 2 + t / 2);
                if (!open) { this.box(cx, h / 2, z, w, h, t, c); continue; }
                const seg = (w - gap) / 2;
                this.box(cx - gap / 2 - seg / 2, h / 2, z, seg, h, t, c);
                this.box(cx + gap / 2 + seg / 2, h / 2, z, seg, h, t, c);
                this.box(cx, h - 0.4, z, gap, 0.8, t, c);
            }
            // Corner stone pillars for architectural depth & cover.
            for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
                this.box(cx + sx * (w / 2 - 0.22), h / 2, cz + sz * (d / 2 - 0.22), 0.44, h, 0.44, new THREE.Color(c).multiplyScalar(0.82).getHex());
            }
            // Wall lamps.
            return [-1, 1].map((side) => this.box(cx + side * (w / 2 - 0.05), h * 0.7, cz, 0.08, 0.3, 0.6, 0xffe2a8, false, { emissive: new THREE.Color(0xffc870), emissiveIntensity: 1.4 }));
        }
        door(x, z, w, h) {
            const mesh = this.box(x, h / 2, z, w, h, 0.3, 0x3a3a3a, true, { metalness: 0.6 });
            const dObj = {
                mesh, h, opening: false,
                open: () => {
                    if (dObj.opening) return;
                    dObj.opening = true;
                    mesh.userData.col.active = false;
                    const idx = BO.World.worldMeshes.indexOf(mesh);
                    if (idx >= 0) BO.World.worldMeshes.splice(idx, 1);
                    BO.Sound?.playWallBreak?.();
                }
            };
            this.doors.push(dObj);
            return dObj;
        }
        tick(dt, clock) {
            for (const d of this.doors) {
                if (d.opening && d.mesh.visible) {
                    d.mesh.position.y += dt * 4.5;
                    if (d.mesh.position.y > d.h * 1.45) d.mesh.visible = false;
                }
            }
            for (const p of this.portals) {
                p.ring.rotation.z = clock * 1.4;
                p.disc.material.opacity = 0.45 + Math.sin(clock * 3.2) * 0.16;
            }
        }
        marker(mk) { mk.alive = true; this.mode.markers.push(mk); this.markers.push(mk); return mk; }
        dispose() {
            for (const wm of this.worldRegistered) {
                const idx = BO.World.worldMeshes.indexOf(wm);
                if (idx >= 0) BO.World.worldMeshes.splice(idx, 1);
            }
            for (const m of this.meshes) { m.removeFromParent(); m.geometry?.dispose?.(); m.material?.dispose?.(); }
            for (const c of this.cols) {
                c.active = false;
                const idx = BO.World.colliders.indexOf(c);
                if (idx >= 0) BO.World.colliders.splice(idx, 1);
            }
            for (const mk of this.markers) {
                mk.alive = false;
                const idx = this.mode.markers.indexOf(mk);
                if (idx >= 0) this.mode.markers.splice(idx, 1);
            }
            this.meshes = []; this.worldRegistered = []; this.cols = []; this.markers = []; this.doors = []; this.portals = [];
        }
    }

    class ZoneDungeons {
        constructor() { this.state = {}; this.inside = null; }
        get campaign() { return this.mode?.campaign; }

        start(mode, saved) {
            this.stop();
            this.mode = mode;
            this.state = JSON.parse(JSON.stringify(saved?.state || {}));
            this.inside = null;
            this.entrances = [];
            this.objects = [];
            for (const d of DUNGEONS) this.placeEntrance(d);
        }

        stop() {
            if (this.inside) this.leave(true);
            for (const o of this.objects || []) o.removeFromParent?.();
            this.objects = [];
            this.mode = null;
        }

        snapshot() { return { state: this.state }; }
        st(id) { return this.state[id] || (this.state[id] = { cleared: false, chest: false, boss: false, visits: 0 }); }

        placeEntrance(d) {
            const m = this.mode;
            const poi = BO.Zone.pois.find((p) => p.type === d.near && (!d.region || p.region === d.region)) || BO.Zone.pois.find((p) => p.type === d.near);
            if (!poi) return;
            const x = poi.x - poi.w / 2 - 4, z = poi.z - poi.d / 2 - 3;
            const y = BO.World.getGroundHeight(x, z, (poi.y || 0) + 2);
            const g = new THREE.Group();
            const stone = new THREE.MeshStandardMaterial({ color: 0x5a5650, roughness: 0.95 });
            const add = (w, h, dd, px, py, pz, mat = stone) => { const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), mat); mesh.position.set(px, py, pz); mesh.castShadow = true; g.add(mesh); };
            add(0.5, 2.6, 0.5, -1.1, 1.3, 0); add(0.5, 2.6, 0.5, 1.1, 1.3, 0); add(2.8, 0.5, 0.6, 0, 2.75, 0);
            add(1.8, 2.2, 0.1, 0, 1.1, 0.05, new THREE.MeshBasicMaterial({ color: 0x050607 }));
            const glow = new THREE.MeshStandardMaterial({ color: 0xffd27a, emissive: new THREE.Color(0xffa030), emissiveIntensity: 1.2 });
            add(0.15, 0.15, 0.15, -1.1, 2.75, 0.32, glow); add(0.15, 0.15, 0.15, 1.1, 2.75, 0.32, glow);
            g.position.set(x, y, z);
            m.scene.add(g);
            this.objects.push(g);
            const tags = [...new Set(d.rooms.flatMap((r) => [r.puzzle ? 'puzzle' : '', r.boss ? 'boss' : '', r.chest ? 'chest' : '', r.enemies >= 7 ? 'swarming' : '']).filter(Boolean))];
            const mk = { id: 'dgn:' + d.id, x, y, z: z + 1, name: d.name, label: 'Enter ' + d.name + ' (' + d.size.toLowerCase() + (tags.length ? ' · ' + tags.join(', ') : '') + ')', alive: true, dungeon: d.id, reach: 3 };
            m.markers.push(mk);
            this.entrances.push({ d, x, y, z, mk });
        }

        /* ------------------------------------------------------------ entering */
        enter(id) {
            const m = this.mode;
            const d = typeof id === 'object' && id ? id : DUNGEONS.find((x) => x.id === id);
            if (!d || this.inside) return;
            const ent = this.entrances.find((e) => e.d.id === d.id) || { x: BO.Player.pos.x, y: BO.Player.pos.y, z: BO.Player.pos.z };
            const idx = DUNGEONS.indexOf(d);
            const ox = 2200 + idx * 500, oz = 0;
            const sp = new Space(m, ox, oz, d.theme);
            const s = this.st(d.id);
            s.visits++;
            const run = { d, sp, rooms: [], ret: { x: ent.x, y: ent.y, z: ent.z + 2.5 }, timer: null, done: s.cleared };
            const H = 4.2;
            let z = oz;
            d.rooms.forEach((r, i) => {
                const cz = z + r.d / 2;
                const lamps = sp.room(ox, cz, r.w, r.d, H, { s: true, n: i < d.rooms.length - 1 });
                if (r.dark) for (const l of lamps) l.visible = false;
                const room = { r, i, cx: ox, cz, x0: ox - r.w / 2, x1: ox + r.w / 2, z0: z, z1: z + r.d, entered: false, cleared: false, enemies: [], solved: !r.puzzle };
                if (i < d.rooms.length - 1) {
                    // Corridor to the next room.
                    const cz2 = z + r.d + 2;
                    sp.box(ox, -0.25, cz2, 3.4, 0.5, 4, new THREE.Color(d.theme).multiplyScalar(0.6).getHex());
                    sp.box(ox - 1.5, H / 2, cz2, 0.4, H, 4, d.theme); sp.box(ox + 1.5, H / 2, cz2, 0.4, H, 4, d.theme);
                    sp.box(ox, H + 0.2, cz2, 3.4, 0.4, 4, 0x2a2a2a, false);
                    room.door = s.cleared ? null : sp.door(ox, z + r.d + 0.6, 2.6, H - 0.6);
                }
                if (i === 0) sp.box(ox, H / 2, z - 0.6, 3, H, 0.4, d.theme); // sealed entry behind you
                run.rooms.push(room);
                this.dress(run, room);
                z += r.d + 4;
            });
            // Portal home at the start and (after the chest) at the end.
            const startZ = oz + 1.2;
            this.portal(run, ox - (d.rooms[0].w / 2 - 1.2), startZ, 'Leave the dungeon');
            run.spawn = { x: ox, z: oz + 2 };
            this.inside = run;
            this.light = this.light || new THREE.PointLight(0xffd8a0, 1.1, 22, 1.6);
            m.scene.add(this.light);
            const p = BO.Player;
            p.pos.set(ox, 0.1, oz + 2.2);
            p.vel.set(0, 0, 0);
            p.yaw = Math.PI;
            BO.Events.emit('hud:banner', { title: d.name.toUpperCase(), sub: d.size.toUpperCase() + ' DUNGEON · ' + d.rooms.length + ' ROOMS' + (s.cleared ? ' · CLEARED' : ''), color: '#ffd27a' });
            m.toast(d.blurb);
            this.campaign.mark('dungeonVisits', 1, 0);
            this.campaign.mark('dgn_enter_' + id, 1, 0);
        }

        portal(run, x, z, label) {
            const sp = run.sp;
            const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.12, 8, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x8fe3c8).convertSRGBToLinear() }));
            ring.position.set(x, 1.3, z);
            const disc = new THREE.Mesh(new THREE.CircleGeometry(0.95, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3fcfaa).convertSRGBToLinear(), transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
            disc.position.set(x, 1.3, z);
            this.mode.scene.add(ring, disc);
            sp.meshes.push(ring, disc);
            sp.portals.push({ ring, disc });
            sp.marker({ id: 'dgnexit:' + x.toFixed(1) + ':' + z.toFixed(1), x, y: 0, z, name: 'Portal', label, dgnExit: true, reach: 2.2 });
        }

        /** Notes, puzzles, ore, fire grates and the chest for a room (enemies spawn on entry). */
        dress(run, room) {
            const sp = run.sp, r = room.r, d = run.d, s = this.st(d.id);
            const x0 = room.x0, z0 = room.z0;
            if (r.hazard === 'fire') {
                room.fireGrates = [];
                room.fireCones = [];
                for (let gz = z0 + 1; gz < room.z1 - 0.8; gz += 4) {
                    const grate = sp.box(room.cx, 0.03, gz, r.w - 1.6, 0.06, 1.7, 0x3a261e, false, { metalness: 0.75, emissive: new THREE.Color(0xff4a00), emissiveIntensity: 0.12 });
                    room.fireGrates.push(grate);
                    for (const ox of [-r.w * 0.28, 0, r.w * 0.28]) {
                        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.5, 7), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff6a1a).convertSRGBToLinear(), transparent: true, opacity: 0.78 }));
                        cone.position.set(room.cx + ox, 1.25, gz);
                        cone.visible = false;
                        this.mode.scene.add(cone);
                        sp.meshes.push(cone);
                        room.fireCones.push(cone);
                    }
                }
            }
            if (r.note) {
                let text = r.note;
                if (text === 'CODE') { run.code = run.code || [1 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)]; text = 'A torn duty roster. Scrawled on the back: "Armoury code ' + run.code.join('-') + '. Burn this."'; }
                if (text === 'LEVERS') { run.order = run.order || this.shuffle([0, 1, 2, 3]); text = 'Containment protocol, page 4: "Release order — ' + run.order.map((k) => SYMBOLS[k][2]).join(', then ') + '."'; }
                sp.box(x0 + 1, 1.0, z0 + 1.5, 0.6, 0.05, 0.4, 0xe8e0c8, false);
                sp.marker({ id: 'dgnnote:' + d.id + room.i, x: x0 + 1, y: 0, z: z0 + 1.5, name: 'Note', label: 'Read the note', dgnNote: text, reach: 2 });
            }
            if (r.ore) {
                const kinds = ['iron', 'coal', 'copper', 'gold', 'quartz', 'sulfur'];
                run.deposits = run.deposits || [];
                for (let k = 0; k < r.ore; k++) {
                    const ox = x0 + 1.2 + Math.random() * (r.w - 2.4), oz = z0 + 1.5 + Math.random() * (r.d - 3);
                    const depId = 'dnode:' + d.id + ':' + room.i + ':' + k + ':' + s.visits;
                    this.campaign.pack.createDeposit?.(depId, { kind: kinds[(k + room.i) % kinds.length], x: ox, y: 0, z: oz });
                    run.deposits.push(depId);
                }
            }
            if (r.puzzle && !s.cleared) this.buildPuzzle(run, room);
            if (r.chest) {
                const cx = room.cx, cz = room.z1 - 2;
                sp.box(cx, 0.4, cz, 1.4, 0.8, 0.9, s.chest ? 0x2a2a2a : 0x8a6a2a, true, s.chest ? {} : { emissive: new THREE.Color(0xffb43a), emissiveIntensity: 0.35, metalness: 0.4 });
                if (!s.chest) sp.marker({ id: 'dgnchest:' + d.id, x: cx, y: 0, z: cz - 0.8, name: d.name + ' chest', label: 'Open the ' + d.name + ' chest', dgnChest: r.chest, reach: 2.4 });
                this.portal(run, cx + r.w / 2 - 1.5, cz, 'Portal home');
            }
        }

        shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

        /* ------------------------------------------------------------ puzzles */
        buildPuzzle(run, room) {
            const sp = run.sp, pz = room.r.puzzle, d = run.d;
            const P = room.pz = { type: pz.type, state: [], need: [] };
            const along = (k, n) => room.x0 + (k + 1) * room.r.w / (n + 1);
            const wallZ = room.z1 - 0.8;
            if (pz.type === 'levers') {
                run.order = run.order || this.shuffle([0, 1, 2, 3]);
                P.need = run.order; P.state = [];
                for (let k = 0; k < pz.count; k++) {
                    const x = along(k, pz.count);
                    sp.box(x, 1.6, wallZ + 0.3, 0.5, 0.5, 0.1, SYMBOLS[k][1], false, { emissive: new THREE.Color(SYMBOLS[k][1]), emissiveIntensity: 0.6 });
                    P['lever' + k] = sp.box(x, 1.0, wallZ, 0.12, 0.6, 0.12, 0x888888, false);
                    sp.marker({ id: 'pzl:' + k, x, y: 0, z: wallZ - 0.6, name: 'Lever (' + SYMBOLS[k][2] + ')', label: 'Pull the ' + SYMBOLS[k][2] + ' lever', puzzle: { room, k }, reach: 1.8 });
                }
            } else if (pz.type === 'braziers') {
                P.lit = new Array(pz.count).fill(false);
                for (let k = 0; k < pz.count; k++) {
                    const a = k / pz.count * Math.PI * 2;
                    const x = room.cx + Math.cos(a) * room.r.w * 0.32, z = (room.z0 + room.z1) / 2 + Math.sin(a) * room.r.d * 0.32;
                    sp.box(x, 0.5, z, 0.6, 1.0, 0.6, 0x4a4440);
                    P['fire' + k] = sp.box(x, 1.25, z, 0.4, 0.5, 0.4, 0xff7a1a, false, { emissive: new THREE.Color(0xff6a00), emissiveIntensity: 1.5 });
                    P['fire' + k].visible = false;
                    sp.marker({ id: 'pzl:' + k, x, y: 0, z: z - 0.7, name: 'Brazier', label: 'Light the brazier', puzzle: { room, k }, reach: 1.8 });
                }
            } else if (pz.type === 'valves') {
                P.need = Array.from({ length: pz.count }, () => Math.floor(Math.random() * 4));
                P.state = Array.from({ length: pz.count }, () => 0);
                sp.box(room.cx, 2.2, wallZ + 0.3, 2.4, 0.9, 0.1, 0x22303a, false);
                P.gauge = sp.marker({ id: 'pzlg', x: room.cx, y: 0, z: wallZ - 0.8, name: 'Gauge panel', label: 'Read the gauge panel', dgnNote: 'Required valve settings (left to right): ' + P.need.map((n) => n + 1).join(' · ') + '. Each turn moves a valve one step (1→2→3→4→1).', reach: 2 });
                for (let k = 0; k < pz.count; k++) {
                    const x = room.x0 + 1.4 + k * 2.2, z = room.z0 + 2.2;
                    P['valve' + k] = sp.box(x, 1.0, z, 0.7, 0.7, 0.12, 0xb03a2a, false, { metalness: 0.6 });
                    sp.marker({ id: 'pzl:' + k, x, y: 0, z: z + 0.6, name: 'Valve ' + (k + 1), label: 'Turn valve ' + (k + 1) + ' (now 1)', puzzle: { room, k }, reach: 1.7 });
                }
            } else if (pz.type === 'fuses') {
                P.found = 0; P.inserted = false;
                const spots = this.shuffle(run.rooms.slice(0, room.i + 1).flatMap((rm) => [[rm.x0 + 0.9, rm.z0 + rm.r.d * 0.7], [rm.x1 - 0.9, rm.z0 + rm.r.d * 0.35]])).slice(0, pz.count);
                while (spots.length < pz.count) spots.push([room.x0 + 1 + spots.length, room.z0 + 1.5]);
                spots.forEach(([x, z], k) => {
                    const mesh = sp.box(x, 0.3, z, 0.25, 0.25, 0.25, 0xffd27a, false, { emissive: new THREE.Color(0xffd27a), emissiveIntensity: 0.9 });
                    sp.marker({ id: 'pzlf:' + k, x, y: 0, z, name: 'Fuse', label: 'Take the fuse', puzzle: { room, fuse: k, mesh }, reach: 1.6 });
                });
                sp.box(room.cx + 2, 1.4, wallZ + 0.3, 0.9, 1.2, 0.15, 0x3a3a3a, false);
                sp.marker({ id: 'pzlp', x: room.cx + 2, y: 0, z: wallZ - 0.6, name: 'Lift panel', label: 'Refit the fuses', puzzle: { room, panel: true }, reach: 1.8 });
            } else if (pz.type === 'keypad') {
                run.code = run.code || [1 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)];
                P.state = [0, 0, 0];
                for (let k = 0; k < 3; k++) {
                    const x = room.cx - 1.2 + k * 1.2;
                    sp.box(x, 1.3, wallZ + 0.25, 0.8, 0.8, 0.1, 0x2a3a2a, false, { emissive: new THREE.Color(0x3fcf7a), emissiveIntensity: 0.3 });
                    sp.marker({ id: 'pzl:' + k, x, y: 0, z: wallZ - 0.5, name: 'Dial ' + (k + 1), label: 'Turn dial ' + (k + 1) + ' (shows 0)', puzzle: { room, k }, reach: 1.1 });
                }
                sp.marker({ id: 'pzlok', x: room.cx + 2.4, y: 0, z: wallZ - 0.5, name: 'Keypad', label: 'Press ENTER on the keypad', puzzle: { room, enter: true }, reach: 1.3 });
            } else if (pz.type === 'timed') {
                room.solved = true; // the doors are open; the clock is the puzzle
                run.timed = { until: null, time: pz.time, room };
            }
        }

        puzzleAct(mk) {
            const { room } = mk.puzzle;
            const P = room.pz;
            const m = this.mode;
            const run = this.inside;
            if (!P || room.solved) return;
            if (P.type === 'levers') {
                const k = mk.puzzle.k;
                P['lever' + k].rotation.x = 0.8;
                P.state.push(k);
                const okSoFar = P.state.every((v, i) => v === P.need[i]);
                BO.Sound?.playWallHit?.();
                if (!okSoFar) {
                    m.toast('Wrong order. The levers snap back — and something wakes up.');
                    P.state = [];
                    for (let i = 0; i < 4; i++) if (P['lever' + i]) P['lever' + i].rotation.x = 0;
                    this.spawnIn(run, room, 2, 0);
                } else if (P.state.length === P.need.length) this.solve(run, room, 'The containment locks release.');
                else m.toast('Click. (' + P.state.length + '/' + P.need.length + ')');
            } else if (P.type === 'braziers') {
                const k = mk.puzzle.k;
                if (P.lit[k]) return;
                if (!P.lit.some(Boolean)) P.until = m.clock + room.r.puzzle.time;
                P.lit[k] = true;
                P['fire' + k].visible = true;
                BO.Sound?.playTone?.(300, 600, 0.3, 'triangle', 0.2);
                if (P.lit.every(Boolean)) this.solve(run, room, 'All four braziers burn. The gate grinds open.');
                else m.toast(P.lit.filter(Boolean).length + '/' + P.lit.length + ' lit — ' + Math.max(0, Math.ceil(P.until - m.clock)) + ' s left.');
            } else if (P.type === 'valves') {
                const k = mk.puzzle.k;
                P.state[k] = (P.state[k] + 1) % 4;
                P['valve' + k].rotation.z = P.state[k] * Math.PI / 2;
                mk.label = 'Turn valve ' + (k + 1) + ' (now ' + (P.state[k] + 1) + ')';
                BO.Sound?.playReload?.('in');
                if (P.state.every((v, i) => v === P.need[i])) this.solve(run, room, 'Pressure equalises. The water drains and the hatch unlocks.');
            } else if (P.type === 'fuses') {
                if (mk.puzzle.fuse !== undefined) {
                    mk.alive = false; mk.puzzle.mesh.visible = false; P.found++;
                    m.toast('Fuse ' + P.found + '/' + room.r.puzzle.count + '.');
                } else if (mk.puzzle.panel) {
                    if (P.found < room.r.puzzle.count) m.toast('The panel needs ' + room.r.puzzle.count + ' fuses. You have ' + P.found + '.');
                    else this.solve(run, room, 'Fuses refitted. The lift hums back to life.');
                }
            } else if (P.type === 'keypad') {
                if (mk.puzzle.enter) {
                    if (P.state.every((v, i) => v === run.code[i])) this.solve(run, room, 'ACCESS GRANTED. The armoury door slides open.');
                    else { m.toast('ACCESS DENIED. An alarm wails.'); this.spawnIn(run, room, 3, 0); }
                } else {
                    const k = mk.puzzle.k;
                    P.state[k] = (P.state[k] + 1) % 10;
                    mk.label = 'Turn dial ' + (k + 1) + ' (shows ' + P.state[k] + ')';
                    BO.Sound?.playUIClick?.();
                }
            }
        }

        solve(run, room, msg) {
            room.solved = true;
            this.campaign.mark('puzzles', 1, 40);
            BO.ZoneThrill?.xp(40, 'Puzzle');
            BO.Events.emit('hud:banner', { title: 'PUZZLE SOLVED', sub: msg.toUpperCase(), color: '#8fe3c8' });
            this.tryOpen(run, room);
        }

        tryOpen(run, room) {
            if (!room.solved) return;
            if (room.enemies.some((z) => z.alive && !z.despawned)) return;
            room.cleared = true;
            if (room.door) { room.door.open(); room.door = null; this.mode.toast('The way ahead is open.'); }
        }

        /* ------------------------------------------------------------ enemies */
        spawnIn(run, room, n, champs, bossSpec, bossName) {
            const m = this.mode, c = m.campaign;
            const region = BO.Zone.regionAt(run.ret.x, run.ret.z).id;
            c.selectedEnemies = c.getPool(region);
            for (let i = 0; i < n; i++) {
                const x = room.x0 + 1 + Math.random() * (room.r.w - 2), z = room.z0 + room.r.d * 0.45 + Math.random() * room.r.d * 0.5;
                const zb = m.spawnInfected(x, 0.05, z, 'normal', null, true);
                if (!zb) continue;
                zb.dungeon = run.d.id;
                zb.zs = { state: 'hunt', home: { x, z }, x, z, until: 0, seen: m.clock, wander: 0 };
                if (i < champs) BO.ZoneThrill?.makeChampion(zb, run.d.tier >= 3 ? 2 : 1);
                room.enemies.push(zb);
            }
            if (bossSpec) {
                const zb = m.spawnInfected(room.cx, 0.05, room.z0 + room.r.d * 0.7, 'normal', bossSpec, true);
                if (zb) {
                    zb.dungeon = run.d.id;
                    zb.bossLabel = bossName;
                    zb.maxHp = zb.hp = Math.round((900 + run.d.tier * 450) * (m.tierSpec?.hp || 1) * (m.difficultyRules?.hp || 1));
                    zb.damage = Math.round(26 + run.d.tier * 6);
                    zb.speed = 2.8;
                    zb.zs = { state: 'hunt', home: { x: room.cx, z: room.cz }, x: room.cx, z: room.cz, until: 0, seen: m.clock, wander: 0 };
                    room.enemies.push(zb);
                    room.boss = zb;
                    BO.Sound?.playBossIntro?.();
                    BO.Events.emit('hud:banner', { title: bossName.toUpperCase(), sub: 'DUNGEON BOSS', color: '#ff6b5b' });
                }
            }
            m.refreshTargets();
        }

        /* ------------------------------------------------------------ frame */
        update(dt) {
            const m = this.mode;
            const run = this.inside;
            if (!m || !run) return;
            const p = BO.Player;
            // Death or travel took you out: tidy up.
            if (!p.alive) return;
            if (Math.abs(p.pos.x - run.sp.ox) > 120 || p.pos.y < -30) { if (p.pos.y < -30) { p.pos.set(run.spawn.x, 0.2, run.spawn.z); p.vel.set(0, 0, 0); } else { this.leave(true); return; } }
            this.light.position.set(p.pos.x, p.pos.y + 2.2, p.pos.z);
            run.sp.tick(dt, m.clock);
            m.localWeather = 'Clear'; // underground: no rain, snow or ash
            const s = this.st(run.d.id);
            for (const room of run.rooms) {
                const inRoom = p.pos.x > room.x0 && p.pos.x < room.x1 && p.pos.z > room.z0 + 0.5 && p.pos.z < room.z1;
                if (inRoom && !room.entered) {
                    room.entered = true;
                    if (!s.cleared) {
                        if (room.r.enemies) this.spawnIn(run, room, room.r.enemies + Math.floor((this.campaign.day - 1) / 3), room.r.champ || 0);
                        if (room.r.boss && !s.boss) this.spawnIn(run, room, 0, 0, room.r.boss, room.r.bossName);
                        if (room.r.hazard === 'fire') m.toast('Gas jets fire on a cycle — watch the floor glow and move.');
                    }
                    if (run.timed && room === run.timed.room && !run.timed.until && !s.cleared) { run.timed.until = m.clock + run.timed.time; BO.Sound?.playAirRaidSiren?.(); }
                }
                if (room.entered && !room.cleared) this.tryOpen(run, room);
                if (room.pz?.type === 'braziers' && room.pz.until && !room.solved && m.clock > room.pz.until) {
                    room.pz.until = null; room.pz.lit.fill(false);
                    for (let k = 0; k < room.pz.lit.length; k++) room.pz['fire' + k].visible = false;
                    m.toast('The braziers gutter out. Try again — faster.');
                }
                if (room.r.hazard === 'fire' && !s.cleared) {
                    room.fireT = (room.fireT || 0) + dt;
                    const phase = room.fireT % 6;
                    const warn = phase > 3.3 && phase <= 4.5;
                    const active = phase > 4.5 && phase < 5.6;
                    if (room.fireGrates) for (const g of room.fireGrates) g.material.emissiveIntensity = active ? 1.5 : warn ? 0.55 + Math.sin(room.fireT * 18) * 0.35 : 0.12;
                    if (room.fireCones) for (const c of room.fireCones) { c.visible = active; if (active) c.scale.y = 0.82 + Math.sin(room.fireT * 26) * 0.22; }
                    if (active && inRoom && ((p.pos.z - room.z0) % 4) < 2) {
                        p.takeDamage(14 * dt * 3, null, true);
                        if (Math.random() < 0.25) BO.FX.spawnParticles(p.pos.clone(), 4, 0xff6a1a, 2, 3, 0.4);
                    }
                } else if (room.fireCones) {
                    for (const c of room.fireCones) c.visible = false;
                }
                if (room.boss && !room.boss.alive && room.boss.hp <= 0 && !s.boss) {
                    s.boss = true;
                    this.campaign.mark('dungeonBosses', 1, 300);
                    BO.ZoneThrill?.xp(250, 'Dungeon boss');
                    this.campaign.pack.dropBag({ medkits: 2, ammo9: 30, ammo556: 30, gold: 1 }, room.boss.pos);
                }
            }
            if (run.timed?.until && m.clock > run.timed.until && !run.timed.fired) {
                run.timed.fired = true;
                m.toast('LOCKDOWN. The vault floods with infected.');
                const last = run.rooms[run.rooms.length - 2] || run.rooms[0];
                this.spawnIn(run, last, 8, 1);
            }
        }

        /** HUD headline while inside. */
        status() {
            const run = this.inside;
            if (!run) return null;
            const m = this.mode;
            const left = run.rooms.reduce((a, r) => a + r.enemies.filter((z) => z.alive).length, 0);
            const t = run.timed?.until && !run.timed.fired ? ' · LOCKDOWN IN ' + Math.max(0, Math.ceil(run.timed.until - m.clock)) + ' S' : '';
            const pzRoom = run.rooms.find((r) => r.entered && !r.solved);
            return { headline: run.d.name + (left ? ' · ' + left + ' hostiles' : '') + t, sub: pzRoom ? 'Solve the puzzle to open the way' : 'Clear each room to open the next door' };
        }

        /* ------------------------------------------------------------ interaction */
        activate(mk) {
            if (!mk) return false;
            if (mk.dungeon) { this.enter(mk.dungeon); return true; }
            if (mk.dgnExit) { this.leave(); return true; }
            if (mk.dgnNote) { this.showNote(mk.name, mk.dgnNote); return true; }
            if (mk.puzzle) { this.puzzleAct(mk); return true; }
            if (mk.dgnChest) { this.openChest(mk); return true; }
            return false;
        }

        showNote(title, text) {
            BO.Events.emit('hud:banner', { title: title.toUpperCase(), sub: text, color: '#e8e0c8' });
            this.mode.toast(text);
        }

        openChest(mk) {
            const m = this.mode, run = this.inside;
            const tier = mk.dgnChest;
            const s = this.st(run.d.id);
            if (s.chest) return;
            s.chest = true;
            s.cleared = true;
            mk.alive = false;
            this.campaign.mark('dungeonsCleared', 1, 0);
            this.campaign.mark('dgn_clear_' + run.d.id, 1, 0);
            const a = BO.ZoneLoot.roll('military_crate', Math.min(4, tier));
            const b = BO.ZoneLoot.roll(tier >= 3 ? 'lab_cabinet' : 'toolbox', Math.min(4, tier));
            const items = { ...a.items };
            for (const [k, v] of Object.entries(b.items)) items[k] = (items[k] || 0) + v;
            items.medkits = (items.medkits || 0) + 1;
            if (tier >= 2) items.gold = (items.gold || 0) + tier - 1;
            m.grant(items);
            const pool = BO.ZoneLoot.WEAPON_POOLS[Math.min(4, tier)];
            const wid = pool[Math.floor(Math.random() * pool.length)];
            m.loot.offerWeapon(wid, Math.min(4, tier), BO.Player.pos, { floor: tier >= 4 ? 4 : tier >= 3 ? 3 : 2 });
            BO.ZoneThrill?.xp(80 + tier * 50, 'Dungeon cleared');
            BO.Sound?.playMysteryBoxJingle?.();
            BO.Events.emit('hud:banner', { title: 'DUNGEON CLEARED', sub: run.d.name.toUpperCase() + ' · THE PORTAL BESIDE THE CHEST LEADS HOME', color: '#ffb43a' });
        }

        leave(silent) {
            const run = this.inside;
            if (!run) return;
            const m = this.mode;
            for (const room of run.rooms) for (const z of room.enemies) if (z.alive) { z.alive = false; z.despawned = true; z.deathTimer = 0; if (z.parts?.root) z.parts.root.visible = false; }
            const pack = m.campaign?.pack;
            for (const depId of run.deposits || []) {
                const node = pack?.resources?.get(depId);
                if (!node) continue;
                for (const mesh of node.geometry || []) {
                    pack.meshToNode?.delete(mesh);
                    const wi = BO.World.worldMeshes?.indexOf(mesh) ?? -1;
                    if (wi >= 0) BO.World.worldMeshes.splice(wi, 1);
                    m.disposeOwned(mesh);
                }
                if (node.collider) {
                    node.collider.active = false;
                    BO.World.notifyColliderChanged?.(node.collider);
                    const ci = BO.World.colliders?.indexOf(node.collider) ?? -1;
                    if (ci >= 0) BO.World.colliders.splice(ci, 1);
                }
                if (node.marker) {
                    node.marker.alive = false;
                    const mi = m.markers.indexOf(node.marker);
                    if (mi >= 0) m.markers.splice(mi, 1);
                }
                pack.resources.delete(depId);
            }
            run.sp.dispose();
            this.light?.removeFromParent();
            this.inside = null;
            if (!silent && BO.Player.alive) {
                BO.Player.pos.set(run.ret.x, run.ret.y + 0.1, run.ret.z);
                BO.Player.vel.set(0, 0, 0);
                m.toast('Back in the open air.');
            }
            m.refreshTargets?.();
        }

        list() { return DUNGEONS.map((d) => ({ ...d, st: this.st(d.id), at: this.entrances.find((e) => e.d.id === d.id) })); }
    }

    // Sealed spaces sit far beyond the map: they belong to the region around their entrance (climate, discovery, enemy pools).
    if (BO.Zone?.regionAt && !BO.Zone._offMapRegion) {
        const regionAt = BO.Zone.regionAt;
        BO.Zone._offMapRegion = true;
        BO.Zone.regionAt = (x, z) => {
            if (Math.abs(x) < 1000) return regionAt(x, z);
            const r = BO.ZoneDungeons?.inside?.ret || BO.ZoneLegends?.arena?.ret || BO.Zone.HAVEN;
            return regionAt(r.x, r.z);
        };
    }
    BO.ZoneDungeons = new ZoneDungeons();
    BO.ZoneDungeons.DUNGEONS = DUNGEONS;
    BO.ZoneSpace = Space;
})(window.BO);
