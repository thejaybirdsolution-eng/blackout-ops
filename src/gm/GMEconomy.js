/* ============================================================================
   BLACKOUT OPS — Survival 1.0: Haven reputation & settlers
   · REPUTATION with Haven: contracts (+12), rescued survivors (+8) and supply
     deliveries at Haven (salvage, food, ammo — up to 60 a day).
   · SETTLERS: survivors you rescue offer to move in. They settle at your home
     base once it has a bed, a lit claim and food in storage. Five trades:
       Gunsmith · Medic · Engineer · Quartermaster · Hunter
     Each sells a rotating stock (refreshes every in-game day) for reputation
     and goods. RETRAIN rerolls a settler's stock: the price doubles with each
     retrain that day. That is how you farm the exact attachment or part you need.
   · UPKEEP: every settler eats 1 food from base storage each morning. Unfed
     settlers will not trade. Hordes can down them; patch them up with a trauma kit.
============================================================================ */
(function (BO) {
    'use strict';
    const GM = BO.GM;

    const TRADES = {
        gunsmith: { name: 'Gunsmith', glyph: '🔧', blurb: 'Attachments, repair kits and calibre stock.', pool: [
            [{ optic_kit: 1 }, { rep: 18, scrap: 2 }], [{ suppressor_kit: 1 }, { rep: 22, scrap: 3 }], [{ mag_kit: 1 }, { rep: 16, scrap: 2 }],
            [{ gunkit: 2 }, { rep: 10, scrap: 2 }], [{ ammo9: 30 }, { rep: 8 }], [{ ammo556: 24 }, { rep: 10 }], [{ ammo762: 20 }, { rep: 12 }], [{ ammo12: 12 }, { rep: 10 }],
            [{ gmWeaponCrate: 1 }, { rep: 45, scrap: 6 }]] },
        medic: { name: 'Medic', glyph: '✚', blurb: 'Trauma kits, antibiotics, splints.', pool: [
            [{ medkits: 1 }, { rep: 10, cloth: 1 }], [{ bandage: 3 }, { rep: 5 }], [{ antibiotic: 1 }, { rep: 12, herbs: 1 }], [{ splint: 1 }, { rep: 6 }],
            [{ painkillers: 2 }, { rep: 7 }], [{ filter: 2 }, { rep: 9 }]] },
        engineer: { name: 'Engineer', glyph: '⚡', blurb: 'Wire, batteries, lenses and engine parts.', pool: [
            [{ wire: 4 }, { rep: 8, copper: 1 }], [{ battery: 2 }, { rep: 12 }], [{ lens: 1 }, { rep: 10, quartz: 1 }], [{ engine_parts: 1 }, { rep: 25, scrap: 4 }],
            [{ ingot: 4 }, { rep: 10, iron: 2 }], [{ glass: 2 }, { rep: 8 }]] },
        quartermaster: { name: 'Quartermaster', glyph: '📦', blurb: 'Fuel, cloth, canned food and cord.', pool: [
            [{ fuel: 3 }, { rep: 10 }], [{ canned: 3 }, { rep: 8 }], [{ cloth: 5 }, { rep: 6 }], [{ cord: 4 }, { rep: 6 }], [{ rations: 3 }, { rep: 7 }], [{ freshWater: 4 }, { rep: 6 }]] },
        hunter: { name: 'Hunter', glyph: '🏹', blurb: 'Hides, bait, smoked meat and traps.', pool: [
            [{ hide: 4 }, { rep: 8 }], [{ meatBait: 2 }, { rep: 6 }], [{ jerky: 3 }, { rep: 8 }], [{ noisemaker: 2 }, { rep: 7, scrap: 1 }], [{ bone: 4 }, { rep: 4 }], [{ feather: 6 }, { rep: 4 }]] }
    };
    const NAMES = ['Mara', 'Okafor', 'Dmitri', 'Lena', 'Ruiz', 'Hollis', 'Sung', 'Bea', 'Teodor', 'Amira', 'Grant', 'Yusuf', 'Ines', 'Callum', 'Petra'];
    const DAILY_DELIVERY_CAP = 60;

    const Econ = {
        _tickAcc: 0,

        start(mode, saved) {
            this.mode = mode;
            this.rep = saved?.rep || 0;
            this.settlers = (saved?.settlers || []).map((s) => ({ ...s }));
            this.delivered = saved?.delivered || { day: 0, n: 0 };
            this.lastDay = saved?.lastDay || mode.campaign.day;
            this.install();
            this.patch();
            for (const s of this.settlers) if (s.state === 'settled') this.placeSettler(s);
            GM.ui.panel('settler', { title: (id) => { const s = this.settlers.find((x) => x.id === id); return s ? s.name + ' · ' + TRADES[s.trade].name : 'Settler'; }, render: (id) => this.renderSettler(id), act: (cmd, arg) => this.settlerAct(cmd, arg) });
            GM.ui.panel('haven', { title: () => 'Haven · supply deliveries', render: () => this.renderHaven(), act: (cmd, arg) => this.havenAct(cmd, arg) });
        },

        stop() {
            this.unpatch();
            for (const s of this.settlers || []) { s.avatar?.root?.removeFromParent(); s.avatar = null; }
            this.mode = null;
        },

        snapshot() {
            return { rep: this.rep, delivered: this.delivered, lastDay: this.lastDay, settlers: this.settlers.map(({ avatar, marker, ...rest }) => rest) };
        },

        install() {
            if (this._installed) return;
            this._installed = true;
            const F = BO.SurvivalFrontierData;
            F.items.gmWeaponCrate = F.items.gmWeaponCrate || ['Gunsmith weapon crate', 'Equipment', 2.0];
            BO.SurvivalHotbar?.usable?.add?.('gmWeaponCrate');
            if (BO.SurvivalItemInfo) BO.SurvivalItemInfo.gmWeaponCrate = 'Open it (use) for a guaranteed Rare-or-better weapon roll.';
        },

        patch() {
            const self = this;
            const C = BO.ZoneContracts, E = BO.ZoneEvents, m = this.mode;
            this._orig = { complete: C?.complete, rescue: E?.rescue, consume: m.consume };
            if (C && this._orig.complete) C.complete = function (k) { const r = self._orig.complete.call(this, k); self.addRep(12, 'Contract'); return r; };
            if (E && this._orig.rescue) E.rescue = function (e) { const r = self._orig.rescue.call(this, e); self.addRep(8, 'Rescue'); self.offerSettler(); return r; };
            m.consume = function (id) {
                if (id === 'gmWeaponCrate') return self.openCrate();
                return self._orig.consume.call(this, id);
            };
        },

        unpatch() {
            if (!this._orig) return;
            if (BO.ZoneContracts && this._orig.complete) BO.ZoneContracts.complete = this._orig.complete;
            if (BO.ZoneEvents && this._orig.rescue) BO.ZoneEvents.rescue = this._orig.rescue;
            if (this.mode) this.mode.consume = this._orig.consume;
            this._orig = null;
        },

        addRep(n, why) {
            this.rep += n;
            GM.toast('+' + n + ' Haven reputation' + (why ? ' · ' + why : ''), '#fde68a');
            this.mode.campaign.mark('reputation', n, 0);
        },

        openCrate() {
            const m = this.mode;
            if (!(m.points.gmWeaponCrate > 0)) return false;
            m.points.gmWeaponCrate--;
            const pool = BO.ZoneLoot.WEAPON_POOLS[3] || BO.ZoneLoot.WEAPON_POOLS[2];
            const wid = pool[Math.floor(Math.random() * pool.length)];
            m.loot.offerWeapon(wid, 3, BO.Player.pos, { floor: 2 });
            GM.toast('The crate holds a weapon. Pick it up.', '#fde68a');
            return true;
        },

        /* ---------------------------------------------------------- settlers */
        offerSettler() {
            const free = Object.keys(TRADES).filter((t) => !this.settlers.some((s) => s.trade === t));
            if (!free.length) return;
            const trade = free[Math.floor(Math.random() * free.length)];
            const name = NAMES.filter((n) => !this.settlers.some((s) => s.name === n))[Math.floor(Math.random() * 10)] || 'Sam';
            const s = { id: 's' + Date.now().toString(36).slice(-5) + Math.floor(Math.random() * 99), name, trade, state: 'waiting', stock: [], stockDay: 0, retrains: 0, fed: true, hp: 1 };
            this.settlers.push(s);
            this.rollStock(s);
            GM.banner('SETTLER: ' + name.toUpperCase() + ' THE ' + TRADES[trade].name.toUpperCase(), 'WANTS TO JOIN YOUR BASE · NEEDS A BED, A LIT CLAIM AND FOOD IN STORAGE', '#fde68a');
        },

        homeReady() {
            const base = GM.get('base');
            const home = base?.homePoint?.();
            if (!home) return { ok: false, why: 'no base' };
            const c = this.mode.campaign;
            const bed = c.placed.some((p) => p.alive && p.type === 'bed' && Math.hypot(p.x - home.x, p.z - home.z) < 30);
            const lit = GM.get('threat')?.claims?.some((cl) => Math.hypot(cl.x - home.x, cl.z - home.z) < 30);
            const food = this.foodStores(home).length > 0;
            const why = [!bed && 'a bed', !lit && 'a lit claim', !food && 'food in storage'].filter(Boolean);
            return { ok: !why.length, why: why.join(', '), home };
        },

        foodStores(home) {
            const c = this.mode.campaign;
            const F = BO.SurvivalFrontierData.items;
            const out = [];
            for (const p of c.placed) {
                if (!p.alive || !(p.type === 'chest' || /Chest$/.test(p.type)) || Math.hypot(p.x - home.x, p.z - home.z) > 30) continue;
                const st = c.pack.chests.get(p.id) || {};
                for (const id of Object.keys(st)) if (st[id] > 0 && (F[id]?.[1] === 'Food' || id === 'rations' || id === 'canned')) out.push([st, id]);
            }
            return out;
        },

        placeSettler(s) {
            const m = this.mode;
            const home = GM.get('base')?.homePoint?.();
            if (!home) return;
            const i = this.settlers.filter((x) => x.state === 'settled').indexOf(s);
            const ang = i * 1.25 + 0.4;
            s.x = home.x + Math.cos(ang) * 4.5; s.z = home.z + Math.sin(ang) * 4.5;
            s.y = GM.ground(s.x, s.z, home.y + 2);
            if (!s.avatar && BO.CharacterMesh?.buildSoldier) {
                s.avatar = BO.CharacterMesh.buildSoldier(0, null);
                s.avatar.root.scale.set(0.85, 0.92, 0.85);
                m.scene.add(s.avatar.root);
            }
            if (s.avatar) {
                s.avatar.root.position.set(s.x, s.y, s.z);
                s.avatar.root.rotation.y = -ang;
                BO.CharacterMesh?.animateSoldier?.(s.avatar, { speed: 0, phase: 0, aim: 0 }, 0.05);
            }
            let mk = m.markers.find((k) => k.id === 'gmsettler:' + s.id);
            if (!mk) { mk = { id: 'gmsettler:' + s.id, alive: true, reach: 2.8 }; m.markers.push(mk); }
            Object.assign(mk, { x: s.x, y: s.y, z: s.z, name: s.name, label: 'Trade with ' + s.name + ' (' + TRADES[s.trade].name + ')' });
            s.marker = mk;
        },

        rollStock(s) {
            const pool = TRADES[s.trade].pool.slice();
            const out = [];
            while (out.length < 4 && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
            s.stock = out.map(([give, cost]) => ({ give, cost, sold: false }));
            s.stockDay = this.mode.campaign.day;
        },

        retrainCost(s) { return 10 * Math.pow(2, s.retrains || 0); },

        interact(marker) {
            const id = marker.id || '';
            if (id.startsWith('gmsettler:')) { GM.ui.open('settler', id.slice(10)); return true; }
            return false;
        },

        renderSettler(id) {
            const esc = GM.esc;
            const s = this.settlers.find((x) => x.id === id);
            if (!s) return '<p>Gone.</p>';
            const m = this.mode;
            const pool = GM.get('storage')?.available?.() || m.points;
            const canPay = (cost) => Object.entries(cost).every(([k, v]) => k === 'rep' ? this.rep >= v : (pool[k] || 0) >= v);
            const costText = (cost) => Object.entries(cost).map(([k, v]) => k === 'rep' ? v + ' rep' : v + ' ' + GM.itemName(k)).join(' + ');
            const blocked = !s.fed ? 'Hungry: stock base storage with food and they will trade again tomorrow morning.' : s.hp < 0.5 ? 'Wounded in a raid. Patch them up first.' : '';
            const rows = s.stock.map((o, i) => `<div class="gm-row"><b>${esc(GM.amounts(o.give))}</b><span>${esc(costText(o.cost))}</span>
                <button class="sv-btn sm ${!o.sold && canPay(o.cost) && !blocked ? 'primary' : ''}" data-act="gm" data-arg="settler.buy:${esc(s.id)}|${i}" ${o.sold || !canPay(o.cost) || blocked ? 'disabled' : ''}>${o.sold ? 'Sold' : 'Buy'}</button></div>`).join('');
            return `<div class="gm-settler"><p>${esc(TRADES[s.trade].glyph)} ${esc(TRADES[s.trade].blurb)} Stock refreshes every morning.</p>
                <div class="gm-kv"><div><dt>Your reputation</dt><dd>${this.rep}</dd></div><div><dt>Condition</dt><dd>${Math.round(s.hp * 100)}%</dd></div><div><dt>Fed</dt><dd>${s.fed ? 'yes' : 'no'}</dd></div></div>
                ${blocked ? `<p class="gm-bad">${esc(blocked)}</p>` : ''}${rows}
                <div class="sv-actions"><button class="sv-btn" data-act="gm" data-arg="settler.retrain:${esc(s.id)}" ${this.rep >= this.retrainCost(s) ? '' : 'disabled'}>Retrain stock (${this.retrainCost(s)} rep)</button>
                ${s.hp < 1 ? `<button class="sv-btn" data-act="gm" data-arg="settler.heal:${esc(s.id)}" ${(m.points.medkits || 0) > 0 ? '' : 'disabled'}>Patch up (1 trauma kit)</button>` : ''}</div></div>`;
        },

        settlerAct(cmd, arg) {
            const m = this.mode;
            const [id, idx] = arg.split('|');
            const s = this.settlers.find((x) => x.id === id);
            if (!s) return true;
            if (cmd === 'buy') {
                const o = s.stock[Number(idx)];
                if (!o || o.sold) return true;
                const items = { ...o.cost }; const rep = items.rep || 0; delete items.rep;
                if (this.rep < rep || !m.canAfford(items)) return true;
                m.spend(items);
                this.rep -= rep;
                o.sold = true;
                GM.get('loot').crafting++;
                try { m.campaign.pack.receive(o.give, true); } finally { GM.get('loot').crafting--; }
                GM.sting('trade');
                GM.first('trade', 'Settler trade', 'Retrain them to reroll the stock');
                return true;
            }
            if (cmd === 'retrain') {
                const cost = this.retrainCost(s);
                if (this.rep < cost) return true;
                this.rep -= cost;
                s.retrains = (s.retrains || 0) + 1;
                this.rollStock(s);
                GM.sting('trade');
                return true;
            }
            if (cmd === 'heal') { if (m.spend({ medkits: 1 })) s.hp = 1; return true; }
            return false;
        },

        /* ---------------------------------------------------------- Haven deliveries */
        havenNear() {
            const H = BO.Zone.HAVEN;
            return H && Math.hypot(BO.Player.pos.x - H.x, BO.Player.pos.z - H.z) < 22;
        },

        renderHaven() {
            const esc = GM.esc;
            const m = this.mode;
            const L = GM.get('loot');
            const left = this.delivered.day === m.campaign.day ? DAILY_DELIVERY_CAP - this.delivered.n : DAILY_DELIVERY_CAP;
            const wanted = ['scrap', 'canned', 'rations', 'ammo9', 'ammo556', 'medkits', 'cloth', 'fuel', 'freshWater'];
            const rows = wanted.filter((id) => (m.points[id] || 0) > 0).map((id) => {
                const per = Math.max(1, Math.round(L.valueOf(id) / 3));
                return `<div class="gm-row"><b>${esc(GM.itemName(id))} ×${m.points[id]}</b><span>${per} rep each</span><button class="sv-btn sm" data-act="gm" data-arg="haven.give:${id}" ${left > 0 ? '' : 'disabled'}>Deliver 1</button><button class="sv-btn sm" data-act="gm" data-arg="haven.giveAll:${id}" ${left > 0 ? '' : 'disabled'}>Deliver all</button></div>`;
            }).join('');
            const waiting = this.settlers.filter((s) => s.state === 'waiting');
            const ready = this.homeReady();
            return `<div><div class="gm-kv"><div><dt>Reputation</dt><dd>${this.rep}</dd></div><div><dt>Deliveries left today</dt><dd>${Math.max(0, left)} rep</dd></div></div>
                ${rows || '<p class="gm-muted">Bring salvage, food, ammo, medicine, cloth, fuel or water to earn reputation.</p>'}
                ${waiting.length ? `<h4>Waiting to settle</h4><ul class="gm-list">${waiting.map((s) => `<li><span>${esc(s.name)} the ${esc(TRADES[s.trade].name)}</span><em>${ready.ok ? 'moving in…' : 'needs ' + esc(ready.why)}</em></li>`).join('')}</ul>` : ''}</div>`;
        },

        havenAct(cmd, id) {
            const m = this.mode;
            const L = GM.get('loot');
            const per = Math.max(1, Math.round(L.valueOf(id) / 3));
            if (this.delivered.day !== m.campaign.day) this.delivered = { day: m.campaign.day, n: 0 };
            let n = cmd === 'giveAll' ? (m.points[id] || 0) : Math.min(1, m.points[id] || 0);
            n = Math.min(n, Math.ceil((DAILY_DELIVERY_CAP - this.delivered.n) / per));
            if (!(n > 0)) return true;
            m.points[id] -= n;
            const gained = Math.min(DAILY_DELIVERY_CAP - this.delivered.n, n * per);
            this.delivered.n += gained;
            this.rep += gained;
            GM.sting('trade');
            return true;
        },

        /* ---------------------------------------------------------- update */
        update(dt = 0) {
            const P = BO.Player?.pos;
            for (const s of this.settlers) {
                if (s.state !== 'settled' || !s.avatar) continue;
                const near = !P || Math.hypot(P.x - s.x, P.z - s.z) < 65;
                s.avatar.root.visible = near;
                if (near) {
                    s.phase = (s.phase || 0) + dt;
                    BO.CharacterMesh?.animateSoldier?.(s.avatar, { speed: 0, phase: s.phase, aim: 0 }, dt);
                }
            }
            this._tickAcc = (this._tickAcc || 0) + dt;
            if (this._tickAcc < 1) return;
            this._tickAcc = 0;
            const m = this.mode;
            const c = m.campaign;
            if (c.day !== this.lastDay) {
                this.lastDay = c.day;
                const home = GM.get('base')?.homePoint?.();
                for (const s of this.settlers) {
                    if (s.state !== 'settled') continue;
                    s.retrains = 0;
                    this.rollStock(s);
                    const food = home ? this.foodStores(home)[0] : null;
                    if (food) { food[0][food[1]]--; if (!food[0][food[1]]) delete food[0][food[1]]; s.fed = true; }
                    else { s.fed = false; GM.toast(s.name + ' went hungry: no food in base storage.', '#f59e0b'); }
                }
            }
            const waiting = this.settlers.filter((s) => s.state === 'waiting');
            if (waiting.length) {
                const r = this.homeReady();
                if (r.ok) {
                    for (const s of waiting) { s.state = 'settled'; this.placeSettler(s); GM.banner(s.name.toUpperCase() + ' MOVED IN', TRADES[s.trade].name.toUpperCase() + ' · TRADING AT YOUR BASE', '#fde68a'); }
                    GM.first('settler', 'Settler', 'Your base is becoming a compound');
                }
            }
            // Raids: during a horde at your base, settlers can be downed.
            if (BO.ZoneHorde?.active) {
                for (const s of this.settlers) {
                    if (s.state !== 'settled' || s.hp < 0.5) continue;
                    const near = m.zombies.some((z) => z.alive && s.x !== undefined && Math.hypot(z.pos.x - s.x, z.pos.z - s.z) < 2);
                    if (near && Math.random() < 0.2) { s.hp = 0.3; GM.toast(s.name + ' is down! Patch them up after the fight.', '#ef4444'); }
                }
            }
            // Haven delivery marker.
            const H = BO.Zone.HAVEN;
            if (H && !m.markers.some((k) => k.id === 'gmhaven')) m.markers.push({ id: 'gmhaven', x: H.x + 3, y: GM.ground(H.x + 3, H.z + 2), z: H.z + 2, name: 'Haven quartermaster', label: 'Deliver supplies to Haven (reputation)', alive: true, reach: 3 });
        },

        interactHaven(marker) { if (marker.id === 'gmhaven') { GM.ui.open('haven'); return true; } return false; },

        baseCards(ui) {
            const esc = GM.esc;
            const settled = this.settlers.filter((s) => s.state === 'settled');
            const waiting = this.settlers.filter((s) => s.state === 'waiting');
            const r = this.homeReady();
            return [ui.section('Settlers & Haven', `<div class="gm-kv"><div><dt>Haven reputation</dt><dd>${this.rep}</dd></div><div><dt>Settled</dt><dd>${settled.length} / 5</dd></div></div>
                <ul class="gm-list">${settled.map((s) => `<li><span>${esc(s.name)} · ${esc(TRADES[s.trade].name)}</span><em class="${s.fed && s.hp >= 0.5 ? 'gm-ok' : 'gm-bad'}">${!s.fed ? 'hungry' : s.hp < 0.5 ? 'wounded' : 'trading'}</em></li>`).join('')}
                ${waiting.map((s) => `<li><span>${esc(s.name)} · ${esc(TRADES[s.trade].name)}</span><em class="gm-bad">waiting: needs ${esc(r.why || '—')}</em></li>`).join('') || (settled.length ? '' : '<li class="gm-muted">Rescue survivors from distress calls: they may join you.</li>')}</ul>
                <p class="gm-muted sm">Earn reputation with contracts, rescues and deliveries to the Haven quartermaster.</p>`)];
        },

        TRADES
    };
    // Haven marker interaction rides on the same hook.
    const baseInteract = Econ.interact;
    Econ.interact = function (marker) { return this.interactHaven(marker) || baseInteract.call(this, marker); };

    GM.register('economy', Econ);
})(window.BO);
