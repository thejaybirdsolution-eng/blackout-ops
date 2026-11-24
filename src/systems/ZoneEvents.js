/* ============================================================================
   BLACKOUT OPS — Dynamic world events
   Every few minutes the Zone does something on its own:
   - Supply airdrop: a cargo plane crosses the sky and a crate parachutes down
     under a red smoke beam. High-tier loot — and a PMC squad racing you for it.
   - Infected migration: a herd walks across the Zone along a route. It shows on
     the map and compass; go around it, or lead it into someone else.
   - Distress call: a survivor is pinned down at a building. Clear the infected
     before they fall and they tell you where an unread intel document is.
   - Lantern surge: a 30-second warning, then 90 seconds of radiation storm.
     Get under a roof or behind a filter.
============================================================================ */
(function (BO) {
    'use strict';

    const KINDS = {
        airdrop: { name: 'Supply airdrop', color: 0xff5a4a, css: '#ff7b6b', weight: 3 },
        herd: { name: 'Infected migration', color: 0xd58bff, css: '#d58bff', weight: 2 },
        distress: { name: 'Distress call', color: 0x7ee8fa, css: '#7ee8fa', weight: 2 },
        surge: { name: 'Lantern surge', color: 0xb08cff, css: '#b08cff', weight: 1.5 }
    };

    class ZoneEvents {
        constructor() { this.events = []; this.nextAt = 0; }

        get mode() { return BO.SurvivalMode; }
        get campaign() { return BO.SurvivalMode.campaign; }

        start(mode) {
            this.stop();
            this.mode_ = mode;
            this.nextAt = mode.clock + 240 + Math.random() * 120; // first event 4–6 min in
            this.count = 0;
            // Feats for events.
            const F = BO.ZoneArchive?.FEATS;
            if (F && !F.some((f) => f.id === 'airdrop')) {
                F.push({ id: 'airdrop', name: 'Special Delivery', desc: 'Claim a supply airdrop.', comm: 1, check: (x) => [x.m.airdrops || 0, 1] });
                F.push({ id: 'rescuer', name: 'Nobody Left Behind', desc: 'Answer three distress calls in one expedition.', comm: 3, check: (x) => [x.m.rescues || 0, 3] });
            }
        }

        stop() {
            for (const e of this.events) this.cleanup(e);
            this.events = [];
            this.mode_ = null;
        }

        /* ------------------------------------------------------------ scheduling */
        update(dt) {
            const m = this.mode_;
            if (!m || !m.active || !m.hostilesReleased) return;
            for (const e of [...this.events]) this.tick(e, dt);
            if (m.clock >= this.nextAt && this.events.length < 2 && !BO.ZoneHorde?.active && !BO.ZoneFinale?.active) {
                this.nextAt = m.clock + 300 + Math.random() * 240;
                this.trigger();
            }
        }

        trigger(kind = null) {
            const live = new Set(this.events.map((e) => e.kind));
            const options = Object.entries(KINDS).filter(([k]) => !live.has(k) && (k !== 'surge' || this.campaign.day >= 2));
            if (!kind) {
                const total = options.reduce((s, [, v]) => s + v.weight, 0);
                let r = Math.random() * total;
                for (const [k, v] of options) { r -= v.weight; if (r <= 0) { kind = k; break; } }
                kind = kind || options[0]?.[0];
            }
            if (!kind) return null;
            const e = this['start_' + kind]();
            if (e) { e.kind = kind; e.spec = KINDS[kind]; e.t0 = this.mode_.clock; this.events.push(e); this.count++; }
            return e;
        }

        end(e, msg, color) {
            this.cleanup(e);
            this.events = this.events.filter((x) => x !== e);
            if (msg) BO.Events.emit('hud:banner', { title: msg.title, sub: msg.sub, color: color || e.spec.css });
        }

        cleanup(e) {
            for (const o of e.objects || []) { o.visible = false; o.removeFromParent?.(); }
            if (e.marker) e.marker.alive = false;
        }

        /** Somewhere 70–190 m away on walkable ground in a region of threat ≤ maxThreat. */
        spot(minD = 70, maxD = 190, maxThreat = 3) {
            const p = BO.Player.pos;
            const nav = BO.World.nav;
            const B = BO.Zone.BOUNDS;
            for (let i = 0; i < 40; i++) {
                const a = Math.random() * Math.PI * 2, r = minD + Math.random() * (maxD - minD);
                const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
                if (x < B.minX + 20 || x > B.maxX - 20 || z < B.minZ + 20 || z > B.maxZ - 20) continue;
                if (BO.Zone.regionAt(x, z).threat > maxThreat || BO.Zone.inReservoir(x, z)) continue;
                const j = nav.nearestWalkable(nav.idx(x, z), 3);
                if (j < 0) continue;
                return { x: nav.cx(j), y: nav.y[j], z: nav.cz(j) };
            }
            return null;
        }

        beam(x, y, z, color) {
            const m = this.mode_;
            const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, fog: false, depthWrite: false, blending: THREE.AdditiveBlending });
            const b = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.4, 160, 10, 1, true), mat);
            b.position.set(x, y + 80, z);
            m.scene.add(b);
            return b;
        }

        /* ------------------------------------------------------------ airdrop */
        start_airdrop() {
            const m = this.mode_;
            const s = this.spot(80, 200, 3);
            if (!s) return null;
            const objects = [];
            // Cargo plane crossing the sky above the drop.
            const plane = new THREE.Group();
            const body = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 16, 10), new THREE.MeshStandardMaterial({ color: 0x4a5250, roughness: 0.6 }));
            body.rotation.x = Math.PI / 2;
            const wing = new THREE.Mesh(new THREE.BoxGeometry(22, 0.3, 3), new THREE.MeshStandardMaterial({ color: 0x3e4644 }));
            const tail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3, 2.5), new THREE.MeshStandardMaterial({ color: 0x3e4644 }));
            tail.position.set(0, 1.8, -7);
            plane.add(body, wing, tail);
            const dir = Math.random() * Math.PI * 2;
            plane.rotation.y = dir;
            m.scene.add(plane);
            objects.push(plane);
            const crate = new THREE.Group();
            const box = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 1.4), BO.Textures.getWorldMaterial('container_olive', 1.4, 1.1));
            const chute = new THREE.Mesh(new THREE.SphereGeometry(3, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe8e2d0, side: THREE.DoubleSide, roughness: 0.9 }));
            chute.position.y = 6;
            crate.add(box, chute);
            crate.visible = false;
            m.scene.add(crate);
            objects.push(crate);
            BO.Events.emit('hud:banner', { title: 'SUPPLY AIRDROP', sub: 'A CARGO PLANE IS INBOUND · WATCH FOR THE RED SMOKE · PMC WILL WANT IT TOO', color: KINDS.airdrop.css });
            return { x: s.x, y: s.y, z: s.z, objects, plane, crate, dir, phase: 'fly', planeT: -1, crateY: s.y + 90, label: 'Supply airdrop' };
        }

        tick_airdrop(e, dt) {
            const m = this.mode_;
            if (e.phase === 'fly') {
                e.planeT += dt * 0.12;
                const d = e.planeT * 260;
                e.plane.position.set(e.x - Math.sin(e.dir) * d, e.y + 110, e.z - Math.cos(e.dir) * d);
                e.plane.rotation.y = e.dir + Math.PI;
                if (e.planeT >= 0 && !e.crate.visible) { e.crate.visible = true; BO.Sound?.playExplosion?.(0.08); }
                if (e.crate.visible) {
                    e.crateY = Math.max(e.y + 0.55, e.crateY - dt * 7);
                    e.crate.position.set(e.x, e.crateY, e.z);
                    if (e.crateY <= e.y + 0.56) {
                        e.phase = 'landed';
                        e.crate.children[1].visible = false;
                        e.objects.push(this.beam(e.x, e.y, e.z, 0xff4a3a));
                        e.marker = { id: 'event:airdrop', name: 'Supply crate', x: e.x, y: e.y, z: e.z, label: 'Open the supply crate', alive: true, reach: 2.4, event: e };
                        m.markers.push(e.marker);
                        e.landedAt = m.clock;
                        BO.ZoneDirector.noise(e.x, e.z, 120, 'airdrop');
                        this.sendPmc(e);
                    }
                }
                if (e.planeT > 1.2) e.plane.visible = false;
            } else if (e.phase === 'landed' && m.clock - e.landedAt > 420) {
                this.end(e, { title: 'AIRDROP LOST', sub: 'SOMEONE ELSE GOT THERE FIRST' });
            }
        }

        sendPmc(e) {
            const m = this.mode_;
            const c = this.campaign;
            if (c.has('noPatrols') || c.day < 2) return;
            const nav = BO.World.nav;
            const a = Math.random() * Math.PI * 2;
            for (let i = 0; i < 3; i++) {
                const j = nav.nearestWalkable(nav.idx(e.x + Math.cos(a) * 55 + i * 2, e.z + Math.sin(a) * 55), 5);
                if (j < 0) continue;
                const bot = m.spawnBot(nav.cx(j), nav.y[j], nav.cz(j), ['m4a1', 'mp5', 'r870'][i], 100 + c.day * 6, 1, true);
                if (bot) bot.post = { x: e.x, y: e.y, z: e.z, r: 8 };
            }
            m.refreshTargets();
        }

        claim_airdrop(e) {
            const m = this.mode_;
            const T = BO.ZoneLoot;
            const tier = Math.min(4, 2 + Math.floor(this.campaign.day / 3));
            const a = T.roll('military_crate', tier), b = T.roll('gun_locker', tier);
            const items = { ...a.items };
            for (const [k, v] of Object.entries(b.items)) items[k] = (items[k] || 0) + v;
            items.medkits = (items.medkits || 0) + 1;
            m.grant(items);
            const pool = T.WEAPON_POOLS[Math.min(4, tier + 1)];
            m.loot.offerWeapon(pool[Math.floor(Math.random() * pool.length)], tier, { x: e.x, y: e.y, z: e.z });
            this.campaign.mark('airdrops', 1, 120);
            this.end(e, { title: 'AIRDROP CLAIMED', sub: 'MILITARY SUPPLIES SECURED' }, '#8fe3c8');
        }

        /* ------------------------------------------------------------ herd */
        start_herd() {
            const m = this.mode_;
            const p = BO.Player.pos;
            const B = BO.Zone.BOUNDS;
            // A route that passes 40–70 m from the player, edge to edge.
            const a = Math.random() * Math.PI * 2;
            const off = 40 + Math.random() * 30;
            const cx = p.x + Math.cos(a + Math.PI / 2) * off, cz = p.z + Math.sin(a + Math.PI / 2) * off;
            const clampX = (x) => BO.Math.clamp(x, B.minX + 25, B.maxX - 25), clampZ = (z) => BO.Math.clamp(z, B.minZ + 25, B.maxZ - 25);
            const from = { x: clampX(cx - Math.cos(a) * 140), z: clampZ(cz - Math.sin(a) * 140) };
            const to = { x: clampX(cx + Math.cos(a) * 140), z: clampZ(cz + Math.sin(a) * 140) };
            const n = 12 + Math.min(10, this.campaign.day * 2);
            const herd = { x: from.x, z: from.z, from, to, members: [], label: 'Infected migration', len: Math.hypot(to.x - from.x, to.z - from.z), s: 0 };
            const nav = BO.World.nav;
            for (let i = 0; i < n; i++) {
                const ox = (Math.random() - 0.5) * 14, oz = (Math.random() - 0.5) * 14;
                const j = nav.nearestWalkable(nav.idx(from.x + ox, from.z + oz), 4);
                if (j < 0) continue;
                const zb = m.spawnInfected(nav.cx(j), nav.y[j], nav.cz(j), 'normal', null, true);
                if (!zb) continue;
                zb.herd = herd;
                zb.herdOff = { x: ox, z: oz };
                zb.zs = { state: 'idle', seen: 0, home: { x: from.x, z: from.z }, x: from.x, z: from.z, until: 0, wander: 1e9 };
                herd.members.push(zb);
            }
            if (!herd.members.length) return null;
            BO.Events.emit('hud:banner', { title: 'INFECTED MIGRATION', sub: herd.members.length + ' INFECTED ARE CROSSING THE ZONE · STAY QUIET AND STAY CLEAR', color: KINDS.herd.css });
            m.refreshTargets();
            return herd;
        }

        tick_herd(e, dt) {
            const alive = e.members.filter((z) => z.alive);
            if (!alive.length) return this.end(e, { title: 'MIGRATION BROKEN', sub: 'THE HERD IS GONE' }, '#8fe3c8');
            // The herd's centre walks the route; it waits for stragglers.
            const ahead = alive.filter((z) => Math.hypot(z.pos.x - e.x, z.pos.z - e.z) < 18).length;
            if (ahead >= Math.ceil(alive.length * 0.5)) e.s = Math.min(e.len, e.s + dt * 1.15);
            const k = e.s / e.len;
            e.x = e.from.x + (e.to.x - e.from.x) * k;
            e.z = e.from.z + (e.to.z - e.from.z) * k;
            for (const z of alive) if (z.zs && z.zs.state !== 'hunt') { z.zs.home = { x: e.x, z: e.z }; z.zs.x = e.x + z.herdOff.x; z.zs.z = e.z + z.herdOff.z; z.zs.wander = 1e9; }
            if (e.s >= e.len) {
                for (const z of alive) if (z.zs?.state !== 'hunt') { z.alive = false; z.deathTimer = 0; z.despawned = true; if (z.parts?.root) z.parts.root.visible = false; }
                this.end(e, null);
            }
        }

        /** Herd members follow the herd's centre (used by the director's target logic). */
        herdTarget(z) {
            const e = z.herd;
            if (!e || z.zs?.state === 'hunt') return null;
            return { x: e.x + z.herdOff.x, y: z.pos.y, z: e.z + z.herdOff.z, attackRange: -1, forceDirect: false };
        }

        /* ------------------------------------------------------------ distress */
        start_distress() {
            const m = this.mode_;
            const p = BO.Player.pos;
            const pois = BO.Zone.pois.filter((q) => q.w && BO.Zone.regionAt(q.x, q.z).threat <= 3 && Math.hypot(q.x - p.x, q.z - p.z) > 60 && Math.hypot(q.x - p.x, q.z - p.z) < 200);
            if (!pois.length) return null;
            const q = pois[Math.floor(Math.random() * pois.length)];
            const nav = BO.World.nav;
            const j = nav.nearestWalkable(nav.idx(q.x, q.z + q.d / 2 + 3), 4);
            if (j < 0) return null;
            const x = nav.cx(j), z = nav.cz(j), y = nav.y[j];
            const survivor = m.spawnBot(x, y, z, 'm1911', 240, 0, true);
            if (!survivor) return null;
            survivor.post = { x, y, z, r: 2 };
            survivor.isSurvivor = true;
            const e = { x, y, z, survivor, poi: q, attackers: [], label: 'Distress call: ' + q.name, objects: [] };
            for (let i = 0; i < 5 + Math.min(5, this.campaign.day); i++) {
                const a = Math.random() * Math.PI * 2, r = 6 + Math.random() * 5;
                const k = nav.nearestWalkable(nav.idx(x + Math.cos(a) * r, z + Math.sin(a) * r), 3);
                if (k < 0) continue;
                const zb = m.spawnInfected(nav.cx(k), nav.y[k], nav.cz(k), 'normal', null, true);
                if (zb) { zb.distress = e; zb.zs = { state: 'idle', seen: 0, home: { x, z }, x, z, until: 0, wander: 1e9 }; e.attackers.push(zb); }
            }
            e.objects.push(this.beam(x, y, z, 0x7ee8fa));
            BO.Events.emit('hud:banner', { title: 'DISTRESS CALL', sub: '"…PINNED DOWN AT THE ' + q.name.toUpperCase() + '… THEY\'RE GETTING IN…"', color: KINDS.distress.css });
            m.refreshTargets();
            return e;
        }

        tick_distress(e, dt) {
            const m = this.mode_;
            const s = e.survivor;
            if (!s.alive) return this.end(e, { title: 'TOO LATE', sub: 'THE SURVIVOR AT THE ' + e.poi.name.toUpperCase() + ' DID NOT MAKE IT' }, '#ff7b6b');
            if (m.clock - e.t0 > 360) {
                s.alive = false; if (s.parts?.root) s.parts.root.visible = false;
                return this.end(e, { title: 'SIGNAL LOST', sub: 'THE DISTRESS CALL WENT SILENT' }, '#ff7b6b');
            }
            const p = BO.Player.pos;
            const threats = m.zombies.filter((z) => z.alive && Math.hypot(z.pos.x - s.pos.x, z.pos.z - s.pos.z) < 22).length;
            if (threats === 0 && Math.hypot(p.x - s.pos.x, p.z - s.pos.z) < 8) this.rescue(e);
        }

        rescue(e) {
            const m = this.mode_;
            const s = e.survivor;
            s.alive = false;
            if (s.parts?.root) s.parts.root.visible = false;
            const i = m.bots.indexOf(s);
            if (i >= 0) m.bots.splice(i, 1);
            this.campaign.mark('rescues', 1, 150);
            m.grant({ canned: 2, bandage: 2, ammo9: 18 });
            // They know where something worth reading is hidden.
            const A = BO.ZoneArchive;
            let hint = '';
            if (A) {
                const unread = [...A.placements()].filter(([, d]) => !A.has(d.id));
                if (unread.length) {
                    let best = null, bd = Infinity;
                    for (const [idx] of unread) { const c = BO.Zone.containers[idx]; const d = Math.hypot(BO.Player.pos.x - c.x, BO.Player.pos.z - c.z); if (d < bd) { bd = d; best = c; } }
                    if (best) { BO.SurvivalUI.mapWaypoint = { x: Math.round(best.x), z: Math.round(best.z) }; hint = ' · THEY MARKED A DOCUMENT CACHE ON YOUR MAP'; }
                }
            }
            this.end(e, { title: 'SURVIVOR RESCUED', sub: 'SUPPLIES SHARED · HEADING FOR HAVEN' + hint }, '#8fe3c8');
        }

        /* ------------------------------------------------------------ surge */
        start_surge() {
            BO.Events.emit('hud:banner', { title: 'LANTERN SURGE IN 30 S', sub: 'A RADIATION STORM IS COMING · GET UNDER A ROOF OR PUT ON A FILTER', color: KINDS.surge.css });
            BO.Sound?.playZombieGroan?.('wraith', 0.6);
            const L = BO.Zone.LANTERN;
            return { x: L.x, z: L.z, phase: 'warn', label: 'Lantern surge', objects: [] };
        }

        tick_surge(e, dt) {
            const m = this.mode_;
            const age = m.clock - e.t0;
            if (e.phase === 'warn' && age >= 30) { e.phase = 'storm'; BO.Events.emit('hud:banner', { title: 'LANTERN SURGE', sub: 'TAKE SHELTER', color: KINDS.surge.css }); }
            if (e.phase === 'storm') {
                const shelter = BO.ZoneFrontier?.sheltered?.();
                const filtered = this.campaign.pack.filtered;
                if (!shelter) m.radiation = Math.min(100, m.radiation + dt * (filtered ? 0.35 : 1.8));
                m.scene.fog.color.lerp(new THREE.Color(0x5b3f86), 0.5);
                m.scene.fog.density += 0.006;
                if (age >= 120) this.end(e, { title: 'THE SURGE PASSES', sub: 'THE AIR CLEARS' }, '#8fe3c8');
            }
        }

        /* ------------------------------------------------------------ hooks */
        tick(e, dt) { this['tick_' + e.kind]?.(e, dt); }

        activate(marker) {
            if (marker?.id === 'event:airdrop' && marker.event) { this.claim_airdrop(marker.event); return true; }
            return false;
        }

        /** Short status lines for the HUD chips. */
        chips() {
            const m = this.mode_;
            if (!m) return [];
            const p = BO.Player.pos;
            return this.events.map((e) => {
                const d = Math.round(Math.hypot(e.x - p.x, e.z - p.z));
                if (e.kind === 'surge') return e.phase === 'warn' ? 'Surge in ' + Math.max(0, Math.ceil(30 - (m.clock - e.t0))) + 's' : 'Lantern surge';
                if (e.kind === 'herd') return 'Herd · ' + d + ' m';
                if (e.kind === 'airdrop') return e.phase === 'landed' ? 'Airdrop · ' + d + ' m' : 'Plane inbound';
                return 'Distress · ' + d + ' m';
            });
        }

        /** Map and compass points of interest. */
        points() {
            return this.events.filter((e) => e.kind !== 'surge' && (e.kind !== 'airdrop' || e.phase === 'landed')).map((e) => ({ x: e.x, z: e.z, label: e.label, color: e.spec.css, kind: e.kind }));
        }
    }

    BO.ZoneEvents = new ZoneEvents();
})(window.BO);
