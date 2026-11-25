/* ============================================================================
   BLACKOUT OPS — Infested sites and the fight for the Zone
   Every building and ~45 outdoor encounter sites (wrecked convoys, abandoned
   camps, roadblocks, crash sites…) is held by a visible pack of infected,
   usually led by a champion. A red flag flies over each one.
   · Clear the pack and the site is SECURED: the flag turns green, its supply
     stash unlocks (guaranteed weapon roll), XP pays out, and roaming infected
     stop spawning around it — secured ground is safe ground.
   · Secured sites can be reinfested after a few days, so the map stays alive.
   · The map, compass and HUD track how much of the Zone you hold.
============================================================================ */
(function (BO) {
    'use strict';

    const ACT_R = 105;       // packs appear when you come this close
    const DROP_R = 170;      // and are stored again past this distance
    const MAX_ACTIVE = 30;   // live infested members at once
    const SAFE_R = 38;       // no roaming spawns this close to a secured site

    const WILD = {
        convoy: { name: 'Wrecked convoy', desc: 'Military trucks that never made it out.' },
        camp: { name: 'Abandoned camp', desc: 'Tents, a cold fire pit and whatever the campers left.' },
        roadblock: { name: 'Military roadblock', desc: 'Sandbags, barriers and an ammo cache.' },
        crash: { name: 'Crash site', desc: 'A light aircraft came down here.' },
        hunters: { name: 'Hunters\' camp', desc: 'A blind, a meat rack and a rifle crate.' },
        cache: { name: 'Supply cache', desc: 'A quartermaster\'s cache dug in under tarps.' },
        bus: { name: 'Burned-out bus', desc: 'An evacuation bus. Nobody got off.' }
    };
    const WILD_BY_REGION = {
        crash: ['camp', 'crash', 'bus'], relay: ['camp', 'hunters', 'roadblock'], hollow: ['roadblock', 'bus', 'convoy'],
        pine: ['hunters', 'camp', 'crash'], kessel: ['convoy', 'roadblock', 'cache'], spillway: ['camp', 'roadblock', 'convoy'],
        frost: ['convoy', 'cache', 'crash'], cinder: ['convoy', 'bus', 'cache'], campus: ['roadblock', 'cache', 'convoy']
    };
    const SMALL = new Set(['house', 'kiosk', 'cabin']);

    class ZoneInfest {
        constructor() { this.sites = []; this.byKey = new Map(); }

        get campaign() { return this.mode?.campaign; }

        start(mode, saved) {
            this.stop();
            this.mode = mode;
            this.clock = 0;
            this.day = mode.campaign?.day || 1;
            this.objects = [];
            this.buildSites();
            if (saved) this.restore(saved);
            // No roaming infected: the sites stand empty and their stashes are free to open.
            if (mode.campaign?.has('noRoamers')) for (const s of this.sites) s.cleared = true;
            this.buildProps();
            this.applyFlags();
        }

        stop() {
            for (const s of this.sites) for (const z of s.members || []) if (z.alive) { z.alive = false; z.despawned = true; z.deathTimer = 0; if (z.parts?.root) z.parts.root.visible = false; }
            for (const o of this.objects || []) { o.removeFromParent?.(); o.geometry?.dispose?.(); }
            for (const c of this.colliders || []) c.active = false;
            this.objects = [];
            this.colliders = [];
            this.sites = [];
            this.byKey.clear();
            this.mode = null;
        }

        /* ------------------------------------------------------------ world */
        buildSites() {
            const m = this.mode;
            const Z = BO.Zone;
            const spawn = Z.map.playerSpawn;
            const avoid = [...(BO.ZoneFrontier?.garrisons || []), Z.HAVEN, ...m.markers.filter((mk) => mk.kind === 'safehouse' || mk.kind === 'settlement')];
            const near = (list, x, z, r) => list.some((o) => Math.hypot(o.x - x, o.z - z) < r);
            const day = this.campaign?.day || 1;
            // Buildings.
            Z.pois.forEach((poi, i) => {
                if (near(avoid, poi.x, poi.z, 16)) return;
                const region = Z.regionAt(poi.x, poi.z);
                if (region.threat >= 5) return;
                const dSpawn = Math.hypot(poi.x - spawn.x, poi.z - spawn.z);
                const tier = poi.tier || region.threat || 1;
                let size = SMALL.has(poi.type) ? 3 : tier === 1 ? 4 : tier === 2 ? 6 : tier === 3 ? 8 : 9;
                if (dSpawn < 80) size = 3;
                const site = {
                    key: 'poi:' + i, kind: 'poi', type: poi.type, name: poi.name, x: poi.x, y: poi.y || 0, z: poi.z, tier, region: region.id,
                    w: poi.w || 8, d: poi.d || 8, size, left: size + Math.min(3, Math.floor((day - 1) / 4)),
                    alpha: tier >= 2 || (dSpawn > 80 && Math.random() < 0.35), cleared: false, opened: false, members: [], seen: false
                };
                this.add(site);
            });
            // Outdoor encounters in the empty stretches.
            const R = BO.ZoneSeed ? BO.ZoneSeed.rng(m.seed || 'ZONE-001', 'wild-sites') : Math.random;
            const B = Z.BOUNDS;
            const nav = BO.World.nav;
            const blockers = m.markers.filter((mk) => ['tower', 'mast', 'safehouse', 'settlement', 'lantern', 'nest', 'gate'].includes(mk.kind));
            const wild = [];
            for (let gx = B.minX + 24; gx < B.maxX - 18; gx += 30) {
                for (let gz = B.minZ + 24; gz < B.maxZ - 18; gz += 30) {
                    let x = gx + (R() - 0.5) * 22, z = gz + (R() - 0.5) * 22;
                    const region = Z.regionAt(x, z);
                    if (region.threat >= 5 || Z.inReservoir?.(x, z)) continue;
                    if (Math.hypot(x - spawn.x, z - spawn.z) < 60) continue;
                    if (near(Z.pois, x, z, 32) || near(blockers, x, z, 26) || near(avoid, x, z, 34) || near(wild, x, z, 50)) continue;
                    const j = nav ? nav.nearestWalkable(nav.idx(x, z), 4) : -1;
                    if (j < 0) continue;
                    x = nav.cx(j); z = nav.cz(j);
                    const h = BO.World.terrainHeight(x, z);
                    if (Math.abs(BO.World.terrainHeight(x + 4, z) - h) > 1.6 || Math.abs(BO.World.terrainHeight(x, z + 4) - h) > 1.6) continue;
                    if (R() < 0.1) continue;
                    wild.push({ x, z, region, r: R() });
                }
            }
            wild.sort((a, b) => a.r - b.r);
            for (const w of wild.slice(0, 48)) {
                const types = WILD_BY_REGION[w.region.id] || ['camp', 'roadblock', 'convoy'];
                const type = types[Math.floor(R() * types.length)];
                const tier = Math.max(1, Math.min(4, w.region.threat || 1));
                const size = 2 + tier + (R() < 0.4 ? 1 : 0);
                this.add({
                    key: 'wild:' + Math.round(w.x) + ':' + Math.round(w.z), kind: 'wild', type, name: WILD[type].name, x: w.x, y: BO.World.terrainHeight(w.x, w.z), z: w.z,
                    tier, region: w.region.id, w: 10, d: 10, size, left: size, alpha: R() < 0.45, cleared: false, opened: false, members: [], seen: false, rot: R() * Math.PI * 2
                });
            }
        }

        add(site) { this.sites.push(site); this.byKey.set(site.key, site); }

        /** Stash crate, flag and (for wild sites) set dressing. Instanced so the whole Zone costs a handful of draw calls. */
        buildProps() {
            const m = this.mode;
            const dummy = new THREE.Object3D();
            const groups = {};
            const put = (key, geoFn, color, x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, collide = false) => {
                if (!groups[key]) groups[key] = { geoFn, items: [], color };
                groups[key].items.push({ x, y, z, ry, sx, sy, sz, color });
                if (collide) {
                    const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry));
                    const hw = (sx * c + sz * s) / 2, hd = (sx * s + sz * c) / 2;
                    const col = { minX: x - hw, maxX: x + hw, minY: y - sy / 2, maxY: y + sy / 2, minZ: z - hd, maxZ: z + hd, active: true };
                    BO.World.colliders.push(col);
                    this.colliders.push(col);
                }
                return groups[key].items.length - 1;
            };
            const ground = (x, z, ref) => BO.World.getGroundHeight(x, z, (ref ?? BO.World.terrainHeight(x, z)) + 1.2);
            const box = () => new THREE.BoxGeometry(1, 1, 1);
            for (const s of this.sites) {
                // Stash crate: inside or beside the building, in the middle of a wild site.
                const sx = s.kind === 'poi' ? s.x + (s.w / 2 + 2.2) : s.x + 1.2;
                const sz = s.kind === 'poi' ? s.z + 1.5 : s.z - 0.8;
                const sy = ground(sx, sz, s.y);
                s.stash = { x: sx, y: sy, z: sz };
                s.stashIdx = put('stash', box, 0x3f5a35, sx, sy + 0.33, sz, 0.3, 1.2, 0.66, 0.7, true);
                put('stashLid', box, 0xc9a227, sx, sy + 0.68, sz, 0.3, 1.24, 0.06, 0.74);
                const fx = sx - 1.2, fz = sz + 1.4, fy = ground(fx, fz, s.y);
                put('pole', () => new THREE.CylinderGeometry(0.05, 0.06, 1, 6), 0x9aa1a6, fx, fy + 3.5, fz, 0, 1, 7, 1);
                s.flagIdx = put('flag', () => new THREE.PlaneGeometry(1, 1), 0xd8342c, fx + 0.75, fy + 6.45, fz, 0, 1.5, 0.95, 1);
                s.flag = { x: fx, y: fy, z: fz };
                s.marker = { id: 'stash:' + s.key, x: sx, y: sy, z: sz, name: s.name + ' stash', label: 'Open supply stash', alive: true, infestSite: s };
                m.markers.push(s.marker);
                if (s.kind !== 'wild') continue;
                // Set dressing per type.
                const rot = s.rot || 0;
                const at = (dx, dz) => ({ x: s.x + dx * Math.cos(rot) - dz * Math.sin(rot), z: s.z + dx * Math.sin(rot) + dz * Math.cos(rot) });
                const truck = (dx, dz, ry, col) => {
                    const p = at(dx, dz), y = ground(p.x, p.z, s.y);
                    put('hull', box, col, p.x, y + 0.95, p.z, rot + ry, 2.2, 1.5, 5.2, true);
                    const c2 = at(dx + Math.sin(ry) * 1.9, dz + Math.cos(ry) * 1.9);
                    put('cab', box, 0x2b2f2c, c2.x, y + 2.0, c2.z, rot + ry, 2.0, 0.8, 1.4);
                };
                const tent = (dx, dz, col) => { const p = at(dx, dz); put('tent', () => new THREE.ConeGeometry(0.75, 1, 4), col, p.x, ground(p.x, p.z, s.y) + 0.95, p.z, rot + Math.PI / 4, 2.6, 1.9, 2.6, true); };
                const crate = (dx, dz) => { const p = at(dx, dz); put('crate', box, 0x7a5c3a, p.x, ground(p.x, p.z, s.y) + 0.4, p.z, rot + 0.2, 0.9, 0.8, 0.9, true); };
                const bags = (dx, dz, ry) => { const p = at(dx, dz); put('bags', box, 0xb4a27a, p.x, ground(p.x, p.z, s.y) + 0.42, p.z, rot + ry, 3.4, 0.84, 0.7, true); };
                const barrel = (dx, dz) => { const p = at(dx, dz); put('barrel', () => new THREE.CylinderGeometry(0.5, 0.5, 1, 10), 0x7e3b22, p.x, ground(p.x, p.z, s.y) + 0.45, p.z, 0, 0.62, 0.9, 0.62, true); };
                switch (s.type) {
                    case 'convoy': truck(-3, -2, 0.15, 0x46503a); truck(3.5, 3, -0.35, 0x3d4632); crate(0.5, -4); barrel(-5, 3); break;
                    case 'camp': tent(-3, -2, 0x6b7a3a); tent(3, -3, 0xb3622e); tent(-1, 4, 0x4f6d7a); crate(2.5, 2); barrel(4.5, 1); break;
                    case 'roadblock': bags(-3, -3, 0); bags(3, -3, 0); bags(-5.5, 0, Math.PI / 2); truck(2.5, 3.5, Math.PI / 2, 0x4a5440); crate(-1, 2); break;
                    case 'crash': { const p = at(-2, 1); const y = ground(p.x, p.z, s.y); put('hull', box, 0xd6d9d2, p.x, y + 0.7, p.z, rot + 0.5, 1.6, 1.3, 7.5, true); const wgt = at(-2.5, 1.5); put('wing', box, 0xc8ccc4, wgt.x, y + 0.5, wgt.z, rot - 1.0, 9.5, 0.18, 1.6); barrel(3, -2); crate(2.5, 2.5); break; }
                    case 'hunters': tent(-3, 1, 0x5d6b3a); { const p = at(3, -2); const y = ground(p.x, p.z, s.y); put('pole', () => new THREE.CylinderGeometry(0.05, 0.06, 1, 6), 0x6b4f33, p.x, y + 1.6, p.z, 0, 2, 3.2, 2); put('crate', box, 0x5a4a32, p.x, y + 3.2, p.z, rot, 2.0, 0.25, 2.0); } crate(0, -3); break;
                    case 'cache': bags(-2.5, -2.5, 0.3); crate(-1, 0); crate(0.2, 0.8); crate(-0.4, -1.2); barrel(2.5, -1); { const p = at(0, 0.2); put('tent', () => new THREE.ConeGeometry(0.75, 1, 4), 0x3f4a2e, p.x, ground(p.x, p.z, s.y) + 1.4, p.z, rot + Math.PI / 4, 4.2, 1.2, 4.2); } break;
                    case 'bus': { const p = at(0, 0); const y = ground(p.x, p.z, s.y); put('hull', box, 0x5b3a26, p.x, y + 1.35, p.z, rot + 0.25, 2.5, 2.4, 10.5, true); } barrel(-3.5, -4); crate(3, 3); break;
                }
            }
            for (const [key, g] of Object.entries(groups)) {
                const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: key === 'hull' || key === 'cab' ? 0.35 : 0.05, side: key === 'flag' || key === 'wing' ? THREE.DoubleSide : THREE.FrontSide });
                if (key === 'flag') { mat.emissive = new THREE.Color(0xffffff); mat.emissiveIntensity = 0.18; }
                const mesh = new THREE.InstancedMesh(g.geoFn(), mat, g.items.length);
                const col = new THREE.Color();
                g.items.forEach((it, k) => {
                    dummy.position.set(it.x, it.y, it.z);
                    dummy.rotation.set(0, it.ry, 0);
                    dummy.scale.set(it.sx, it.sy, it.sz);
                    dummy.updateMatrix();
                    mesh.setMatrixAt(k, dummy.matrix);
                    mesh.setColorAt(k, col.setHex(it.color).convertSRGBToLinear()); // linear output space: avoid washed-out props
                });
                if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
                mesh.castShadow = key !== 'flag';
                mesh.receiveShadow = true;
                m.scene.add(mesh);
                this.objects.push(mesh);
                groups[key].mesh = mesh;
            }
            this.flagMesh = groups.flag?.mesh;
            this.stashMesh = groups.stash?.mesh;
        }

        applyFlags() {
            const col = new THREE.Color();
            for (const s of this.sites) {
                if (this.flagMesh) this.flagMesh.setColorAt(s.flagIdx, col.setHex(s.cleared ? 0x3fcf7a : 0xd8342c).convertSRGBToLinear());
                if (this.stashMesh) this.stashMesh.setColorAt(s.stashIdx, col.setHex(s.opened ? 0x26301f : s.cleared ? 0x4f8a3a : 0x3f5a35).convertSRGBToLinear());
                if (s.marker) s.marker.alive = !s.opened;
                if (s.cleared && !s.opened && s.won && !s.beam) s.beam = this.beam(s);
                if ((s.opened || !s.cleared) && s.beam) { s.beam.removeFromParent(); s.beam = null; }
            }
            if (this.flagMesh?.instanceColor) this.flagMesh.instanceColor.needsUpdate = true;
            if (this.stashMesh?.instanceColor) this.stashMesh.instanceColor.needsUpdate = true;
        }

        beam(s) {
            const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3fcf7a).convertSRGBToLinear(), transparent: true, opacity: 0.45, fog: false, depthWrite: false, side: THREE.DoubleSide });
            const b = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.45, 26, 8, 1, true), mat);
            b.position.set(s.stash.x, s.stash.y + 13, s.stash.z);
            this.mode.scene.add(b);
            this.objects.push(b);
            return b;
        }

        /* ------------------------------------------------------------ packs */
        aliveMembers(s) { return (s.members || []).filter((z) => z.alive && !z.despawned); }

        spawnPack(s) {
            const m = this.mode;
            const c = m.campaign;
            const nav = BO.World.nav;
            c.selectedEnemies = c.getPool(s.region);
            s.members = [];
            const n = s.left;
            for (let i = 0; i < n; i++) {
                let x = s.x, z = s.z;
                for (let t = 0; t < 8; t++) {
                    if (s.kind === 'poi') { x = s.x + (Math.random() - 0.5) * (s.w + 8); z = s.z + (Math.random() - 0.5) * (s.d + 8); }
                    else { const a = Math.random() * Math.PI * 2, r = 2.5 + Math.random() * 7; x = s.x + Math.cos(a) * r; z = s.z + Math.sin(a) * r; }
                    const j = nav ? nav.idx(x, z) : -1;
                    if (j >= 0 && nav.walk[j]) break;
                }
                const y = BO.World.getGroundHeight(x, z, (s.y || 0) + 1.4);
                const zb = m.spawnInfected(x, y, z, 'normal', null, true);
                if (!zb) continue;
                zb.infest = s.key;
                zb.zs = { state: 'idle', home: { x: s.x + (x - s.x) * 0.6, z: s.z + (z - s.z) * 0.6 }, x, z, until: 0, seen: -99, wander: m.clock + Math.random() * 4 };
                if (i === 0 && s.alpha && !s.alphaDead) {
                    BO.ZoneThrill?.makeChampion(zb, s.tier >= 3 ? 2 : 1);
                    zb.infestAlpha = true;
                }
                s.members.push(zb);
            }
            s.active = true;
            m.refreshTargets();
        }

        storePack(s) {
            const alive = this.aliveMembers(s);
            s.left = alive.length;
            if (s.alpha && !alive.some((z) => z.infestAlpha)) s.alphaDead = true;
            for (const z of alive) { z.alive = false; z.despawned = true; z.deathTimer = 0; if (z.parts?.root) z.parts.root.visible = false; }
            s.members = [];
            s.active = false;
        }

        secure(s) {
            const m = this.mode;
            const c = m.campaign;
            s.active = false;
            s.cleared = true;
            s.won = true;
            s.left = 0;
            s.clearedDay = c.day;
            s.members = [];
            c.mark('secured', 1, 0);
            const xp = 40 + 30 * s.tier + s.size * 4;
            BO.ZoneThrill?.xp(xp, 'Site secured');
            // Clearing the map feeds research: every third secured site is worth a Tech Point.
            if (c.deep && this.securedCount() % 3 === 0) { c.deep.grantTechPoints(1); m.toast('+1 Tech Point · every third secured site funds research (Skills tab).'); }
            BO.Events.emit('hud:banner', { title: 'AREA SECURED', sub: s.name.toUpperCase() + ' · STASH UNLOCKED · ' + this.securedCount() + '/' + this.sites.length + ' OF THE ZONE', color: '#8fe3c8' });
            BO.Sound?.playRoundEnd?.();
            this.applyFlags();
            BO.ZoneContracts?.onSecured(s);
            this.mode.campaign.objectives?.onSiteSecured?.(s);
        }

        /* ------------------------------------------------------------ frame */
        update(dt) {
            const m = this.mode;
            if (!m || !m.active) return;
            this.clock -= dt;
            if (this.clock > 0) return;
            this.clock = 0.5;
            const c = m.campaign;
            if (c.day !== this.day) { this.day = c.day; this.reinfest(); }
            if (!m.hostilesReleased || c.has('noRoamers') || c.has('sv_no_infest') || BO.ZoneDungeons?.inside || BO.ZoneLegends?.arena) return;
            const p = BO.Player.pos;
            let live = 0;
            for (const s of this.sites) {
                if (!s.active) continue;
                const alive = this.aliveMembers(s);
                if (!alive.length) { this.secure(s); continue; } // the whole pack is dead: the site is ours
                live += alive.length;
                const d = Math.hypot(s.x - p.x, s.z - p.z);
                if (d > DROP_R && alive.every((z) => z.pos.distanceTo(p) > 110)) this.storePack(s);
            }
            if (BO.ZoneFinale?.active) return;
            const todo = this.sites.filter((s) => !s.cleared && !s.active && s.left > 0)
                .map((s) => ({ s, d: Math.hypot(s.x - p.x, s.z - p.z) }))
                .filter((e) => e.d < ACT_R + (e.s.kind === 'poi' ? 0 : -10))
                .sort((a, b) => a.d - b.d);
            for (const { s, d } of todo) {
                if (live + s.left > MAX_ACTIVE) break;
                this.spawnPack(s);
                live += s.left;
                if (!s.seen && d < ACT_R) {
                    s.seen = true;
                    m.toast(s.name + ' is infested · ' + s.left + ' infected' + (s.alpha && !s.alphaDead ? ', led by a champion' : '') + '. Clear it to unlock the stash.');
                }
            }
        }

        reinfest() {
            const back = [];
            for (const s of this.sites) {
                if (!s.cleared || this.day - (s.clearedDay || 0) < 3) continue;
                if (Math.random() > 0.3) continue;
                s.cleared = false;
                s.opened = false;
                s.left = Math.max(2, Math.round(s.size * 0.7));
                s.alpha = Math.random() < 0.5;
                s.alphaDead = false;
                back.push(s.name);
            }
            if (back.length) {
                this.applyFlags();
                this.mode.toast('Infected have moved back into ' + back.slice(0, 3).join(', ') + (back.length > 3 ? ' and ' + (back.length - 3) + ' more sites' : '') + '.');
            }
        }

        /* ------------------------------------------------------------ interaction */
        activate(marker) {
            const s = marker?.infestSite;
            if (!s) return false;
            const m = this.mode;
            if (!s.cleared) {
                const left = s.active ? this.aliveMembers(s).length : s.left;
                m.toast('Infected still hold ' + s.name + ' (' + left + ' left). Clear them to open the stash.');
                return true;
            }
            if (s.opened) return true;
            s.opened = true;
            const tier = Math.min(4, s.tier);
            const table = s.kind === 'wild' && (s.type === 'hunters' || s.type === 'camp') ? 'shelf' : s.type === 'pharmacy' ? 'med_cabinet' : 'military_crate';
            const a = BO.ZoneLoot.roll(table, tier);
            const b = BO.ZoneLoot.roll('crate', tier);
            const items = { ...a.items };
            for (const [k, v] of Object.entries(b.items)) items[k] = (items[k] || 0) + v;
            const mult = BO.ZoneThrill?.lootMult?.() || 1;
            for (const k of Object.keys(items)) items[k] = Math.max(1, Math.round(items[k] * mult));
            if (Math.random() < 0.35) items.medkits = (items.medkits || 0) + 1;
            m.grant(items);
            if (Math.random() < 0.3 + tier * 0.08) { BO.Player.lethalCount = Math.min(4, (BO.Player.lethalCount || 0) + 1); m.toast('+1 frag grenade'); }
            const pool = BO.ZoneLoot.WEAPON_POOLS[Math.min(4, tier + (Math.random() < 0.3 ? 1 : 0))];
            const id = pool[Math.floor(Math.random() * pool.length)];
            m.loot.offerWeapon(id, tier, s.stash, { floor: 1, luck: s.alphaDead ? 1 : 0 });
            BO.ZoneThrill?.xp(15, 'Stash');
            BO.Sound?.playMysteryBoxJingle?.();
            this.applyFlags();
            return true;
        }

        /* ------------------------------------------------------------ queries */
        securedCount() { return this.sites.filter((s) => s.cleared).length; }
        isSafe(x, z) { return this.sites.some((s) => s.cleared && Math.abs(s.x - x) < SAFE_R && Math.abs(s.z - z) < SAFE_R && Math.hypot(s.x - x, s.z - z) < SAFE_R); }
        siteOf(zb) { return zb?.infest ? this.byKey.get(zb.infest) : null; }

        /** Sites the player knows about (seen, in a visited region, or everything with Treasure Hunter). */
        known() {
            const c = this.campaign;
            const all = BO.ZoneThrill?.rank?.('treasure') > 0 || c?.has('sv_master_map');
            return this.sites.filter((s) => all || s.seen || s.cleared || c?.visited.has(s.region));
        }

        nearestInfested(maxD = 160) {
            const p = BO.Player.pos;
            let best = null, bd = maxD;
            for (const s of this.sites) {
                if (s.cleared) continue;
                const d = Math.hypot(s.x - p.x, s.z - p.z);
                if (d < bd && d > 6) { bd = d; best = s; }
            }
            return best;
        }

        chip() {
            if (!this.sites.length) return '';
            return 'Zone held ' + this.securedCount() + '/' + this.sites.length;
        }

        snapshot() {
            const out = {};
            for (const s of this.sites) {
                const left = s.active ? this.aliveMembers(s).length : s.left;
                out[s.key] = { l: left, c: s.cleared ? 1 : 0, o: s.opened ? 1 : 0, d: s.clearedDay || 0, a: s.alphaDead ? 1 : 0, s: s.seen ? 1 : 0, al: s.alpha ? 1 : 0, w: s.won ? 1 : 0 };
            }
            return { sites: out };
        }

        restore(saved) {
            for (const [key, v] of Object.entries(saved?.sites || {})) {
                const s = this.byKey.get(key);
                if (!s) continue;
                s.left = v.l ?? s.left;
                s.cleared = !!v.c;
                s.opened = !!v.o;
                s.clearedDay = v.d || 0;
                s.alphaDead = !!v.a;
                s.seen = !!v.s;
                s.won = !!v.w;
                if (v.al !== undefined) s.alpha = !!v.al;
            }
        }
    }

    BO.ZoneInfest = new ZoneInfest();
    BO.ZoneInfest.WILD = WILD;
})(window.BO);
