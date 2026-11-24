/* ============================================================================
   BLACKOUT OPS — Haven radio contracts
   Three short goals are always on offer, so there is never a moment without
   something worth doing next. Finish one and Haven radios another in ~20 s.
   · Clear: secure a named infested site.
   · Bounty: hunt a named champion (2–3 affixes) in a marked search area.
   · Headhunter / Champion hunt / Scavenge / Kill streak / Burn a nest.
   Rewards: XP, supplies, a weapon of guaranteed rarity, perk rerolls.
============================================================================ */
(function (BO) {
    'use strict';

    const BOUNTY_NAMES = ['Old Tom', 'The Glutton', 'Mother Grey', 'Rattle', 'Big Ivan', 'Sister Ash', 'The Mailman', 'Patch', 'Hollow Jack', 'Grinning Lou',
        'The Deacon', 'Red Hannah', 'Two-Coats', 'The Foreman', 'Whistler', 'Corporal Meeks', 'Lantern Bride', 'Stitches'];
    const ICON = { clear: '⚑', bounty: '☠', headhunter: '🎯', champions: '✪', scavenge: '🔍', streak: '🔥', nest: '🜂', cache: '✦' };
    const CACHE_NAMES = ['Quartermaster\'s footlocker', 'Smuggler\'s strongbox', 'Sable Company arms case', 'Black Pine research crate', 'Ranger weapons cache', 'Evacuation gun crate'];

    class ZoneContracts {
        constructor() { this.list = []; }
        get campaign() { return this.mode?.campaign; }

        start(mode, saved) {
            this.stop();
            this.mode = mode;
            this.list = [];
            this.nextAt = 20;
            this.done = 0;
            this.serial = 0;
            if (saved) this.restore(saved);
            this.buildHud();
            const F = BO.ZoneArchive?.FEATS;
            if (F && !F.some((f) => f.id === 'liberator')) {
                F.push(
                    { id: 'liberator', name: 'Liberator', desc: 'Secure 15 infested sites in one expedition.', comm: 2, check: (x) => [x.m.secured || 0, 15] },
                    { id: 'zone_held', name: 'The Zone Is Ours', desc: 'Secure every infested site in the Zone at the same time.', comm: 5, check: () => [BO.ZoneInfest?.securedCount() || 0, BO.ZoneInfest?.sites.length || 99] },
                    { id: 'champion_slayer', name: 'Champion Slayer', desc: 'Kill 10 champion infected in one expedition.', comm: 2, check: (x) => [x.m.champions || 0, 10] },
                    { id: 'legend', name: 'Stuff of Legend', desc: 'Find a Legendary weapon.', comm: 1, check: (x) => [x.m.legendaries || 0, 1] },
                    { id: 'contractor', name: 'Haven\'s Favourite', desc: 'Complete 8 Haven contracts in one expedition.', comm: 2, check: (x) => [x.m.contracts || 0, 8] },
                    { id: 'veteran15', name: 'Hardened Survivor', desc: 'Reach survivor level 15 in one expedition.', comm: 2, check: (x) => [x.m.survivorLevel || 0, 15] },
                    { id: 'treasure', name: 'X Marks the Spot', desc: 'Open three treasure caches in one expedition.', comm: 1, check: (x) => [x.m.caches || 0, 3] }
                );
            }
        }

        stop() {
            for (const k of this.list) {
                if (k.entity?.alive) { k.entity.alive = false; k.entity.despawned = true; k.entity.deathTimer = 0; if (k.entity.parts?.root) k.entity.parts.root.visible = false; }
                for (const g of k.guards || []) if (g.alive) { g.alive = false; g.despawned = true; g.deathTimer = 0; if (g.parts?.root) g.parts.root.visible = false; }
                this.dropCacheMesh(k);
            }
            this.list = [];
            this.mode = null;
            if (this.hud) this.hud.hidden = true;
        }

        /* ------------------------------------------------------------ offering */
        stat(k) {
            const c = this.campaign;
            const T = BO.ZoneThrill?.stats || {};
            return k === 'headshots' ? T.headshots || 0 : k === 'champions' ? T.champions || 0 : k === 'containers' ? c.metrics.containers || 0 : 0;
        }

        make(kind) {
            const m = this.mode;
            const c = m.campaign;
            const p = BO.Player.pos;
            const day = c.day;
            const id = 'k' + (++this.serial);
            const tier = Math.max(1, Math.min(4, BO.Zone.regionAt(p.x, p.z).threat || 1));
            if (kind === 'clear') {
                const I = BO.ZoneInfest;
                const cands = (I?.sites || []).filter((s) => !s.cleared && !this.list.some((k) => k.site === s.key))
                    .map((s) => ({ s, d: Math.hypot(s.x - p.x, s.z - p.z) })).filter((e) => e.d > 50 && e.d < 280 && e.s.tier <= tier + 1)
                    .sort((a, b) => a.d - b.d).slice(0, 5);
                if (!cands.length) return null;
                const s = cands[Math.floor(Math.random() * cands.length)].s;
                return { id, kind, title: 'Clear ' + s.name, sub: 'Secure the site · ' + BO.Zone.regionAt(s.x, s.z).name, site: s.key, x: s.x, z: s.z, xp: 90 + s.tier * 35, floor: s.tier >= 3 ? 2 : 1 };
            }
            if (kind === 'bounty') {
                const spot = BO.ZoneEvents?.spot?.(90, 210, tier + 1);
                if (!spot) return null;
                const name = BOUNTY_NAMES[Math.floor(Math.random() * BOUNTY_NAMES.length)];
                const off = { x: spot.x + (Math.random() - 0.5) * 30, z: spot.z + (Math.random() - 0.5) * 30 };
                return { id, kind, title: 'Bounty: ' + name, sub: 'Search the marked area · expires end of day ' + (day + 1), name, sx: spot.x, sy: spot.y, sz: spot.z, x: off.x, z: off.z, area: 32, expires: day + 1, affixes: day >= 4 ? 3 : 2, xp: 220 + day * 10, floor: 2 };
            }
            if (kind === 'headhunter') { const n = 8 + Math.min(10, day * 2); return { id, kind, title: 'Headhunter', sub: n + ' headshot kills', stat: 'headshots', base: this.stat('headshots'), goal: n, xp: 120 + n * 5, floor: 1 }; }
            if (kind === 'champions') { const n = day >= 3 ? 3 : 2; return { id, kind, title: 'Champion hunt', sub: 'Kill ' + n + ' champion infected', stat: 'champions', base: this.stat('champions'), goal: n, xp: 160 + n * 30, floor: 2, reroll: 1 }; }
            if (kind === 'scavenge') { const n = 8 + Math.min(8, day); return { id, kind, title: 'Scavenger', sub: 'Search ' + n + ' containers', stat: 'containers', base: this.stat('containers'), goal: n, xp: 80 + n * 6, floor: 0 }; }
            if (kind === 'streak') { const n = day >= 3 ? 12 : 8; return { id, kind, title: 'Kill streak', sub: n + ' kills without dying or pausing for 8 s', goal: n, xp: 130 + n * 6, floor: 1, reroll: 1 }; }
            if (kind === 'nest') {
                const nest = BO.Zone.markers.find((mk) => mk.kind === 'nest' && !c.metrics['nest_' + mk.id] && !this.list.some((k) => k.nest === mk.id));
                if (!nest) return null;
                return { id, kind, title: 'Burn the ' + (nest.name || 'nest').toLowerCase(), sub: 'Molotov, explosive, or 2 fuel and a light', nest: nest.id, x: nest.x, z: nest.z, xp: 260, floor: 2, reroll: 1 };
            }
            return null;
        }

        offer() {
            const have = new Set(this.list.map((k) => k.kind));
            const weights = { clear: 5, bounty: 3.2, headhunter: 2, champions: 2, scavenge: 1.6, streak: 1.6, nest: 1.2 };
            const kinds = Object.keys(weights).filter((k) => !have.has(k));
            for (let tries = 0; tries < 6 && kinds.length; tries++) {
                const total = kinds.reduce((s, k) => s + weights[k], 0);
                let r = Math.random() * total, pick = kinds[0];
                for (const k of kinds) { r -= weights[k]; if (r <= 0) { pick = k; break; } }
                const k = this.make(pick);
                kinds.splice(kinds.indexOf(pick), 1);
                if (k) {
                    this.list.push(k);
                    BO.Sound?.playRadioChirp?.();
                    this.mode.toast('📻 Haven: new contract — ' + k.title + '.');
                    return k;
                }
            }
            return null;
        }

        /* ------------------------------------------------------------ progress */
        progress(k) {
            if (k.stat) return [Math.min(k.goal, this.stat(k.stat) - k.base), k.goal];
            if (k.kind === 'streak') return [Math.min(k.goal, BO.ZoneThrill?.streak || 0), k.goal];
            return null;
        }

        complete(k) {
            const m = this.mode;
            this.list = this.list.filter((x) => x !== k);
            this.done++;
            m.campaign.mark('contracts', 1, 0);
            BO.ZoneThrill?.xp(k.xp, 'Contract');
            const cal = BO.ZoneLoot.caliberOf(BO.Player.activeWeapon) || 'ammo9';
            const items = { [cal]: 12 + Math.floor(Math.random() * 14) };
            const extras = ['medkits', 'bandage', 'gunkit', 'canned', 'freshWater', 'battery', 'painkillers'];
            items[extras[Math.floor(Math.random() * extras.length)]] = 1 + (Math.random() < 0.4 ? 1 : 0);
            m.grant(items);
            if (k.reroll && BO.ZoneThrill) BO.ZoneThrill.rerolls += k.reroll;
            const tier = Math.max(1, Math.min(4, BO.Zone.regionAt(BO.Player.pos.x, BO.Player.pos.z).threat + (k.floor >= 2 ? 1 : 0)));
            const pool = BO.ZoneLoot.WEAPON_POOLS[tier];
            const wid = pool[Math.floor(Math.random() * pool.length)];
            m.loot.offerWeapon(wid, tier, BO.Player.pos, { floor: k.floor || 0 });
            BO.Events.emit('hud:banner', { title: 'CONTRACT COMPLETE', sub: k.title.toUpperCase() + ' · +' + k.xp + ' XP' + (k.reroll ? ' · +1 PERK REROLL' : ''), color: '#ffd27a' });
            BO.Sound?.playMedal?.();
            this.nextAt = Math.min(this.nextAt, m.clock + 18);
        }

        onSecured(site) {
            const k = this.list.find((x) => x.kind === 'clear' && x.site === site.key);
            if (k) this.complete(k);
        }

        update(dt) {
            const m = this.mode;
            if (!m || !m.active || !m.hostilesReleased) return;
            const c = m.campaign;
            const offered = this.list.filter((k) => k.kind !== 'cache').length;
            if (offered < 3 && m.clock >= this.nextAt) {
                this.nextAt = m.clock + (offered < 2 ? 8 : 25);
                this.offer();
            }
            const p = BO.Player.pos;
            for (const k of [...this.list]) {
                const pr = this.progress(k);
                if (pr && pr[0] >= pr[1]) { this.complete(k); continue; }
                if (k.kind === 'clear') {
                    const s = BO.ZoneInfest?.byKey.get(k.site);
                    if (!s) { this.list = this.list.filter((x) => x !== k); continue; }
                    if (s.cleared) this.complete(k);
                } else if (k.kind === 'nest') {
                    if (c.metrics['nest_' + k.nest]) this.complete(k);
                } else if (k.kind === 'cache') {
                    this.updateCache(k, p);
                } else if (k.kind === 'bounty') {
                    if (c.day > k.expires && !k.entity?.alive) { this.list = this.list.filter((x) => x !== k); m.toast('Bounty expired: ' + k.name + ' moved on.'); continue; }
                    const e = k.entity;
                    if (e && !e.alive && !e.despawned && e.hp <= 0) { this.complete(k); continue; }
                    if (e && e.alive) { k.x = e.pos.x; k.z = e.pos.z; }
                    if ((!e || e.despawned) && Math.hypot(k.sx - p.x, k.sz - p.z) < 85) {
                        c.selectedEnemies = c.getPool(BO.Zone.regionAt(k.sx, k.sz).id);
                        const zb = m.spawnInfected(k.sx, BO.World.getGroundHeight(k.sx, k.sz, k.sy + 2), k.sz, 'normal', null, true);
                        if (zb) {
                            zb.contract = k.id;
                            BO.ZoneThrill?.makeChampion(zb, k.affixes, null, '☠ ' + k.name);
                            zb.maxHp = Math.round(zb.maxHp * 1.4); zb.hp = zb.maxHp;
                            zb.zs = { state: 'idle', home: { x: k.sx, z: k.sz }, x: k.sx, z: k.sz, until: 0, seen: -99, wander: 0 };
                            k.entity = zb;
                            m.toast(k.name + ' is close. ' + zb.champion.affixes.map((a) => BO.ZoneThrill.AFFIX[a].name).join(', ') + '.');
                            m.refreshTargets();
                        }
                    } else if (e && e.alive && Math.hypot(e.pos.x - p.x, e.pos.z - p.z) > 200 && e.zs?.state !== 'hunt') {
                        e.alive = false; e.despawned = true; e.deathTimer = 0; if (e.parts?.root) e.parts.root.visible = false;
                        k.entity = null;
                    }
                }
            }
            this.renderHud();
        }

        /* ------------------------------------------------------------ treasure caches */
        /** A champion carried coordinates: a guarded cache with a high-rarity weapon, 110–230 m away. Up to two at once. */
        addCache(from) {
            const m = this.mode;
            if (!m || this.list.filter((k) => k.kind === 'cache').length >= 2) return null;
            const tier = Math.max(1, Math.min(4, BO.Zone.regionAt(from.x, from.z).threat || 1));
            const spot = BO.ZoneEvents?.spot?.(110, 230, Math.min(4, tier + 1));
            if (!spot) return null;
            const k = { id: 'k' + (++this.serial), kind: 'cache', title: CACHE_NAMES[Math.floor(Math.random() * CACHE_NAMES.length)], sub: 'Coordinates from a champion · guarded', sx: spot.x, sy: spot.y, sz: spot.z, x: spot.x, z: spot.z, tier: Math.max(tier, BO.Zone.regionAt(spot.x, spot.z).threat || 1), xp: 120, guarded: false, opened: false };
            this.list.push(k);
            BO.Sound?.playRadioChirp?.();
            BO.Events.emit('hud:banner', { title: 'CACHE COORDINATES', sub: 'THE CHAMPION CARRIED A MAP · ' + k.title.toUpperCase() + ' MARKED', color: '#ffd27a' });
            return k;
        }

        ensureCacheMesh(k) {
            if (k.mesh || k.opened) return;
            const m = this.mode;
            const g = new THREE.Group();
            const box = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.7, 0.75), new THREE.MeshStandardMaterial({ color: 0x2f3a2a, roughness: 0.7, metalness: 0.3 }));
            box.position.y = 0.35;
            const band = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.12, 0.79), new THREE.MeshStandardMaterial({ color: 0xffb43a, emissive: 0xffb43a, emissiveIntensity: 0.6 }));
            band.position.y = 0.5;
            const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.5, 40, 8, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffa020).convertSRGBToLinear(), transparent: true, opacity: 0.5, fog: false, depthWrite: false, side: THREE.DoubleSide }));
            beam.position.y = 20;
            g.add(box, band, beam);
            const y = BO.World.getGroundHeight(k.sx, k.sz, k.sy + 2);
            g.position.set(k.sx, y, k.sz);
            m.scene.add(g);
            k.mesh = g;
            k.marker = { id: 'cache:' + k.id, x: k.sx, y, z: k.sz, name: k.title, label: 'Open ' + k.title.toLowerCase(), alive: true, cache: k };
            m.markers.push(k.marker);
        }

        dropCacheMesh(k) {
            if (k.mesh) { k.mesh.removeFromParent(); k.mesh.traverse((o) => o.geometry?.dispose?.()); k.mesh = null; }
            if (k.marker) k.marker.alive = false;
        }

        updateCache(k, p) {
            const m = this.mode;
            this.ensureCacheMesh(k);
            const d = Math.hypot(k.sx - p.x, k.sz - p.z);
            if (!k.guarded && d < 75) {
                k.guarded = true;
                const c = m.campaign;
                c.selectedEnemies = c.getPool(BO.Zone.regionAt(k.sx, k.sz).id);
                k.guards = [];
                const n = 3 + Math.min(3, k.tier);
                for (let i = 0; i < n; i++) {
                    const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 7;
                    const x = k.sx + Math.cos(a) * r, z = k.sz + Math.sin(a) * r;
                    const zb = m.spawnInfected(x, BO.World.getGroundHeight(x, z, k.sy + 2), z, 'normal', null, true);
                    if (!zb) continue;
                    zb.contract = k.id;
                    zb.zs = { state: 'idle', home: { x, z }, x, z, until: 0, seen: -99, wander: 0 };
                    if (i === 0) BO.ZoneThrill?.makeChampion(zb, k.tier >= 3 ? 2 : 1);
                    k.guards.push(zb);
                }
                m.refreshTargets();
                m.toast(k.title + ' is guarded — ' + k.guards.length + ' infected.');
            }
        }

        /** Interact hook for cache markers. */
        activate(marker) {
            const k = marker?.cache;
            if (!k) return false;
            const m = this.mode;
            const guards = (k.guards || []).filter((g) => g.alive && !g.despawned && g.pos.distanceTo(BO.Player.pos) < 30);
            if (guards.length) { m.toast('Clear the guards first (' + guards.length + ' left).'); return true; }
            k.opened = true;
            this.dropCacheMesh(k);
            this.list = this.list.filter((x) => x !== k);
            m.campaign.mark('caches', 1, 0);
            const a = BO.ZoneLoot.roll('military_crate', Math.min(4, k.tier + 1));
            const items = { ...a.items };
            const mult = BO.ZoneThrill?.lootMult?.() || 1;
            for (const key of Object.keys(items)) items[key] = Math.max(1, Math.round(items[key] * mult));
            items.medkits = (items.medkits || 0) + 1;
            m.grant(items);
            const pool = BO.ZoneLoot.WEAPON_POOLS[Math.min(4, k.tier + 1)];
            const wid = pool[Math.floor(Math.random() * pool.length)];
            m.loot.offerWeapon(wid, Math.min(4, k.tier + 1), { x: k.sx, y: marker.y, z: k.sz }, { floor: Math.random() < 0.25 ? 4 : 3 });
            BO.ZoneThrill?.xp(k.xp, 'Cache');
            BO.Sound?.playMysteryBoxJingle?.();
            BO.Events.emit('hud:banner', { title: 'CACHE OPENED', sub: k.title.toUpperCase(), color: '#ffb43a' });
            this.nextAt = Math.min(this.nextAt, m.clock + 18);
            return true;
        }

        /** Located contracts for compass and map. */
        points() {
            return this.list.filter((k) => k.x !== undefined).map((k) => ({ x: k.x, z: k.z, label: k.title, kind: k.kind, area: k.area || 0 })).concat(BO.ZoneQuests?.points?.() || []);
        }

        /* ------------------------------------------------------------ HUD */
        buildHud() {
            if (!this.hud) {
                this.hud = document.createElement('div');
                this.hud.id = 'zt-contracts';
                document.body.appendChild(this.hud);
            }
            this.hud.hidden = false;
            this.hud.innerHTML = '';
            this.html = '';
        }

        renderHud() {
            if (!this.hud) return;
            const qh = BO.ZoneQuests?.hudHtml?.() || '';
            const show = BO.State.screen === 'playing' && !BO.SurvivalUI.open && (this.list.length || qh);
            this.hud.classList.toggle('dim', !show);
            const p = BO.Player.pos;
            const html = this.list.length ? '<header>CONTRACTS</header>' + this.list.map((k) => {
                const pr = this.progress(k);
                const d = k.x !== undefined ? Math.round(Math.hypot(k.x - p.x, k.z - p.z) / 5) * 5 : null;
                return `<div class="zt-k k-${k.kind}"><em>${ICON[k.kind] || '◆'}</em><b>${k.title}</b><small>${pr ? pr[0] + '/' + pr[1] + ' · ' : ''}${d !== null ? d + ' m · ' : ''}+${k.xp} XP</small>${pr ? `<i><u style="width:${(pr[0] / pr[1] * 100).toFixed(0)}%"></u></i>` : ''}</div>`;
            }).join('') + qh : qh;
            if (html !== this.html) { this.hud.innerHTML = html; this.html = html; }
        }

        snapshot() {
            return { list: this.list.map(({ entity, guards, mesh, marker, ...k }) => ({ ...k, guarded: false })), done: this.done, serial: this.serial };
        }

        restore(s) {
            this.list = (s.list || []).map((k) => ({ ...k, entity: null }));
            this.done = s.done || 0;
            this.serial = s.serial || 0;
            for (const k of this.list) if (k.stat) k.base = Math.min(k.base, this.stat(k.stat));
        }
    }

    BO.ZoneContracts = new ZoneContracts();
})(window.BO);
