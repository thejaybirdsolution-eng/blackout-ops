/* ============================================================================
   BLACKOUT OPS — Survival 1.0: Storage & logistics
   · QUICK-STACK (Z): every item you already store in a chest goes into that
     chest — all base storage within 10 m — in one key press. Not while hunted.
   · AUTO-SORT: re-groups a chest's contents across your base chests by
     category, so chests become labelled storage (label = majority category).
   · CRAFT FROM STORAGE: inside a base, crafting and building draw from every
     chest in that same base (pack first, then storage).
   · FIELD SATCHEL: a 6-slot portable box you carry (shulker-style). Its
     contents still count as carried, so they are Hot outside base and drop on
     death — no free stash.
   · STASH UPLINK: powered terminals link two bases' storage. Hot loot cannot
     be sent and it is locked while hunted.
   · The old "quantum" global ender stash is gone: those chests are big local
     chests now (contents migrate on load).
============================================================================ */
(function (BO) {
    'use strict';
    const GM = BO.GM;
    const F = () => BO.SurvivalFrontierData;
    const BASE_R = 30;
    const QUICK_R = 10;

    const Storage = {
        rate: 2,

        start(mode, saved) {
            this.mode = mode;
            this.satchel = { ...(saved?.satchel || {}) };
            this.install();
            this.patch();
            this.migrateQuantum();
        },

        stop() { this.unpatch(); this.mode = null; },

        snapshot() { return { satchel: this.satchel }; },

        install() {
            if (this._installed) return;
            this._installed = true;
            Object.assign(F().items, { fieldSatchel: ['Field satchel', 'Equipment', 0.5] });
            F().recipes.push({ id: 'gmSatchel', name: 'Field satchel', station: 'bench', cost: { cloth: 4, hide: 2, cord: 2 }, gain: { fieldSatchel: 1 }, desc: 'A 6-slot portable box. Open it from the hotbar or inventory to tidy your pack. Its contents still count as carried.' });
            BO.SurvivalHotbar?.usable?.add?.('fieldSatchel');
            if (BO.SurvivalItemInfo) BO.SurvivalItemInfo.fieldSatchel = 'Portable 6-slot box. Use it to open. Contents count as carried (Hot outside base, dropped on death).';
            const q = BO.SurvivalCampaignData.build.find((b) => b.id === 'quantumChest');
            if (q) { q.name = 'Vault chest'; q.detail = 'A heavy local vault: 40 stacks, 160 kg. (The old linked "quantum" stash was retired.)'; }
        },

        patch() {
            const m = this.mode;
            const self = this;
            const WP = BO.ZoneWorldPlus;
            this._orig = { canAfford: m.canAfford, spend: m.spend, consume: m.consume, resolve: WP?.resolveChestKey, canAccess: WP?.canAccessChest };
            m.canAfford = function (cost) {
                if (!cost) return true;
                const pool = self.available();
                return Object.entries(cost).every(([k, n]) => (pool[k] || 0) >= n);
            };
            m.spend = function (cost) {
                if (!cost) return true;
                if (!this.canAfford(cost)) return false;
                const stores = self.baseStores();
                for (const [k, n0] of Object.entries(cost)) {
                    let n = n0;
                    const fromPack = Math.min(n, this.points[k] || 0);
                    this.points[k] = (this.points[k] || 0) - fromPack;
                    n -= fromPack;
                    for (const st of stores) {
                        if (n <= 0) break;
                        const take = Math.min(n, st[k] || 0);
                        st[k] -= take; if (!st[k]) delete st[k];
                        n -= take;
                    }
                }
                return true;
            };
            m.consume = function (id) {
                if (id === 'fieldSatchel') { if ((this.points.fieldSatchel || 0) > 0) { GM.ui.open('storage'); return true; } return false; }
                return self._orig.consume.call(this, id);
            };
            if (WP && this._orig.resolve) {
                WP.resolveChestKey = function (subject) {
                    const r = self._orig.resolve.call(this, subject);
                    return r === 'quantum:stash' ? String(subject) : r;
                };
                WP.canAccessChest = function (key, near) {
                    if (key === 'gm:uplink') return !!near && GM.get('storage').uplinkReady(near);
                    return self._orig.canAccess.call(this, key, near);
                };
            }
            GM.ui.panel('storage', {
                title: () => 'Field satchel',
                render: () => self.renderSatchel(),
                act: (cmd, arg) => self.satchelAct(cmd, arg)
            });
            GM.ui.panel('uplink', {
                title: () => 'Stash uplink',
                render: (sub) => self.renderUplink(sub),
                act: (cmd, arg) => self.uplinkAct(cmd, arg)
            });
        },

        unpatch() {
            if (!this._orig || !this.mode) return;
            const m = this.mode;
            m.canAfford = this._orig.canAfford;
            m.spend = this._orig.spend;
            m.consume = this._orig.consume;
            if (BO.ZoneWorldPlus && this._orig.resolve) { BO.ZoneWorldPlus.resolveChestKey = this._orig.resolve; BO.ZoneWorldPlus.canAccessChest = this._orig.canAccess; }
            this._orig = null;
        },

        migrateQuantum() {
            const c = this.mode.campaign;
            const q = c.pack.chests.get('quantum:stash');
            if (!q || !Object.keys(q).length) return;
            const target = c.placed.find((p) => p.alive && p.type === 'quantumChest') || c.placed.find((p) => p.alive && p.type === 'chest');
            if (!target) return;
            const st = c.pack.chests.get(target.id) || {};
            for (const [k, v] of Object.entries(q)) st[k] = (st[k] || 0) + v;
            c.pack.chests.set(target.id, st);
            c.pack.chests.delete('quantum:stash');
        },

        /* ---------------------------------------------------------- base storage */
        chestPieces(x, z, r) {
            const c = this.mode.campaign;
            return c.placed.filter((p) => p.alive && (p.type === 'chest' || /Chest$/.test(p.type)) && Math.hypot(p.x - x, p.z - z) <= r);
        },

        currentBase() {
            const base = GM.get('base');
            const p = BO.Player.pos;
            const anchors = base?.anchors?.() || [];
            let best = null, bd = BASE_R;
            for (const a of anchors) { const d = Math.hypot(a.x - p.x, a.z - p.z); if (d <= bd) { bd = d; best = a; } }
            return best;
        },

        baseStores() {
            const a = this.currentBase();
            if (!a) return [];
            const c = this.mode.campaign;
            return this.chestPieces(a.x, a.z, BASE_R).map((p) => c.pack.chests.get(p.id)).filter(Boolean);
        },

        available() {
            const pool = { ...this.mode.points };
            for (const st of this.baseStores()) for (const [k, v] of Object.entries(st)) pool[k] = (pool[k] || 0) + v;
            return pool;
        },

        /* ---------------------------------------------------------- quick-stack */
        quickStack() {
            const m = this.mode;
            if (!m?.active) return;
            if (GM.hasStatus('hunted')) { GM.toast('Not while something is hunting you.', '#ef4444'); return; }
            const c = m.campaign;
            const p = BO.Player.pos;
            const chests = this.chestPieces(p.x, p.z, QUICK_R);
            if (!chests.length) { GM.toast('No storage within ' + QUICK_R + ' m.', '#f59e0b'); return; }
            const pack = c.pack;
            let moved = 0;
            const movedItems = {};
            for (const ch of chests) {
                const st = pack.chests.get(ch.id);
                if (!st) continue;
                const lim = BO.ZoneWorldPlus?.chestLimitsForKey?.(ch.id) || { slots: 18, weight: 54 };
                for (const id of Object.keys(m.points)) {
                    const have = m.points[id] || 0;
                    if (!(have > 0) || !(st[id] > 0)) continue;
                    if (BO.SurvivalHotbar?.usable?.has(id) && c.hotbar?.slots?.some((e) => e && e.kind === 'item' && e.id === id)) continue; // keep hotbar items
                    const n = pack.room(id, have, st, lim);
                    if (!n) continue;
                    m.points[id] -= n;
                    st[id] += n;
                    moved += n;
                    movedItems[id] = (movedItems[id] || 0) + n;
                    GM.get('loot')?.onDeposit?.(ch.id, id, n);
                }
            }
            if (!moved) { GM.toast('Nothing to quick-stack: no matching stacks in nearby storage.', '#cbd5e1'); return; }
            for (let i = 0; i < Math.min(8, Object.keys(movedItems).length); i++) setTimeout(() => GM.sting('pickup'), i * 55);
            GM.toast('Quick-stacked ' + GM.amounts(movedItems) + '.', '#4ade80');
            c.mark('storedItems', moved, 0);
            GM.first('quickstack', 'Quick-stack', 'Z drops matching stacks into nearby storage');
        },

        /** Re-group all base storage by category: each chest ends up holding one or two categories. */
        autoSort() {
            const a = this.currentBase();
            if (!a) { GM.toast('Auto-sort works inside a base.', '#f59e0b'); return false; }
            const c = this.mode.campaign;
            const pieces = this.chestPieces(a.x, a.z, BASE_R);
            if (pieces.length < 2) { GM.toast('Auto-sort needs two or more chests in this base.', '#f59e0b'); return false; }
            const pool = {};
            for (const pc of pieces) { const st = c.pack.chests.get(pc.id) || {}; for (const [k, v] of Object.entries(st)) pool[k] = (pool[k] || 0) + v; c.pack.chests.set(pc.id, {}); }
            const cat = (id) => F().items[id]?.[1] || 'Other';
            const order = Object.keys(pool).sort((x, y) => cat(x).localeCompare(cat(y)) || GM.itemName(x).localeCompare(GM.itemName(y)));
            let i = 0;
            const overflow = {};
            for (const id of order) {
                let n = pool[id];
                for (let tries = 0; tries < pieces.length && n > 0; tries++) {
                    const pc = pieces[(i + tries) % pieces.length];
                    const st = c.pack.chests.get(pc.id);
                    const lim = BO.ZoneWorldPlus?.chestLimitsForKey?.(pc.id) || { slots: 18, weight: 54 };
                    const k = c.pack.room(id, n, st, lim);
                    if (k) { st[id] = (st[id] || 0) + k; n -= k; }
                    if (n > 0) i = (i + 1) % pieces.length;
                }
                if (n > 0) overflow[id] = n;
                const next = order[order.indexOf(id) + 1];
                if (next && cat(next) !== cat(id)) {
                    const cur = c.pack.chests.get(pieces[i].id);
                    if (c.pack.slots(cur) > 10) i = (i + 1) % pieces.length;
                }
            }
            if (Object.keys(overflow).length) c.pack.dropBag(overflow, BO.Player.pos);
            GM.toast('Base storage sorted by category across ' + pieces.length + ' chests.', '#4ade80');
            return true;
        },

        labelFor(chestId) {
            const st = this.mode.campaign.pack.chests.get(chestId) || {};
            const counts = {};
            for (const [k, v] of Object.entries(st)) { const ct = F().items[k]?.[1] || 'Other'; counts[ct] = (counts[ct] || 0) + v; }
            const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
            return top ? top[0] : 'Empty';
        },

        /* ---------------------------------------------------------- satchel */
        satchelLimits() { return { slots: 6, weight: 12, label: 'Field satchel' }; },

        renderSatchel() {
            const esc = GM.esc;
            const m = this.mode;
            const tile = (id, n, side) => `<button class="sv-tile" data-act="gm" data-arg="storage.move:${side}|${esc(id)}">${BO.SurvivalIcons?.item?.(id, 26) || ''}<span class="sv-tile-n">${n}</span><span class="sv-tile-name">${esc(GM.itemName(id))}</span></button>`;
            const packTiles = Object.entries(m.points).filter(([id, n]) => n > 0 && F().items[id] && id !== 'fieldSatchel').map(([id, n]) => tile(id, n, 'in')).join('');
            const satTiles = Object.entries(this.satchel).filter(([, n]) => n > 0).map(([id, n]) => tile(id, n, 'out')).join('');
            return `<div class="gm-two"><section><h4>Backpack</h4><div class="sv-grid">${packTiles || '<p class="gm-muted">Empty.</p>'}</div></section>
                <section><h4>Satchel · ${Object.keys(this.satchel).length}/6 stacks</h4><div class="sv-grid">${satTiles || '<p class="gm-muted">Click backpack items to pack them here.</p>'}</div></section></div>
                <p class="gm-muted sm">Click to move a whole stack. Satchel contents count as carried: Hot outside base and dropped on death.</p>`;
        },

        satchelAct(cmd, arg) {
            if (cmd !== 'move') return false;
            const [side, id] = arg.split('|');
            const m = this.mode;
            const pack = m.campaign.pack;
            if (side === 'in') {
                const n = pack.room(id, m.points[id] || 0, this.satchel, this.satchelLimits());
                if (!n) { BO.SurvivalUI.feedback = 'The satchel is full.'; return true; }
                m.points[id] -= n;
                this.satchel[id] = (this.satchel[id] || 0) + n;
            } else {
                const n = pack.room(id, this.satchel[id] || 0);
                if (!n) { BO.SurvivalUI.feedback = 'Your pack has no room.'; return true; }
                this.satchel[id] -= n; if (!this.satchel[id]) delete this.satchel[id];
                m.points[id] = (m.points[id] || 0) + n;
            }
            return true;
        },

        /** Satchel contents are carried: the death drop includes them. */
        onBeforeDeathDrop() {
            const m = this.mode;
            for (const [k, v] of Object.entries(this.satchel)) m.points[k] = (m.points[k] || 0) + v;
            this.satchel = {};
        },

        /* ---------------------------------------------------------- uplink */
        uplinks() { return this.mode.campaign.placed.filter((p) => p.alive && p.type === 'stashUplink'); },
        uplinkReady(near) {
            const base = GM.get('base');
            const pc = this.uplinks().find((u) => near && Math.hypot(u.x - near.x, u.z - near.z) < 3);
            return !!pc && base?.isPowered?.(pc) && !GM.hasStatus('hunted');
        },

        interact(marker) {
            if (!marker.id?.startsWith('gmuplink:')) return false;
            const pc = this.uplinks().find((u) => 'gmuplink:' + u.id === marker.id);
            if (!pc) return true;
            if (!GM.get('base')?.isPowered?.(pc)) { GM.toast('The uplink has no power.', '#f59e0b'); return true; }
            if (GM.hasStatus('hunted')) { GM.toast('Uplink locked while you are hunted.', '#ef4444'); return true; }
            const other = this.uplinks().find((u) => u !== pc && GM.get('base')?.isPowered?.(u) && Math.hypot(u.x - pc.x, u.z - pc.z) > BASE_R * 2);
            if (!other) { GM.toast('Build and power a second uplink at another base to link them.', '#f59e0b'); return true; }
            GM.ui.open('uplink', { here: pc.id, there: other.id });
            return true;
        },

        onBuild(piece) {
            if (piece.type === 'stashUplink' && !this.mode.markers.some((k) => k.id === 'gmuplink:' + piece.id)) {
                this.mode.markers.push({ id: 'gmuplink:' + piece.id, x: piece.x, y: piece.y, z: piece.z, name: 'Stash uplink', label: 'Use stash uplink', alive: true });
            }
        },

        renderUplink(sub) {
            const esc = GM.esc;
            const c = this.mode.campaign;
            const here = this.chestPieces(...this.xz(sub.here), BASE_R).map((p) => c.pack.chests.get(p.id)).filter(Boolean);
            const there = this.chestPieces(...this.xz(sub.there), BASE_R).map((p) => c.pack.chests.get(p.id)).filter(Boolean);
            const sum = (list) => { const o = {}; for (const st of list) for (const [k, v] of Object.entries(st)) o[k] = (o[k] || 0) + v; return o; };
            const H = sum(here), T = sum(there);
            const row = (items, dir) => Object.entries(items).filter(([, n]) => n > 0).map(([id, n]) => `<button class="sv-tile" data-act="gm" data-arg="uplink.send:${dir}|${esc(id)}|${esc(sub.here)}|${esc(sub.there)}">${BO.SurvivalIcons?.item?.(id, 24) || ''}<span class="sv-tile-n">${n}</span><span class="sv-tile-name">${esc(GM.itemName(id))}</span></button>`).join('');
            return `<div class="gm-two"><section><h4>This base</h4><div class="sv-grid">${row(H, 'out') || '<p class="gm-muted">Empty.</p>'}</div></section><section><h4>Linked base</h4><div class="sv-grid">${row(T, 'in') || '<p class="gm-muted">Empty.</p>'}</div></section></div><p class="gm-muted sm">Click a stack to send it across. Only stored (secured) items can travel.</p>`;
        },

        xz(id) { const p = this.mode.campaign.placed.find((x) => x.id === id); return p ? [p.x, p.z] : [0, 0]; },

        uplinkAct(cmd, arg) {
            if (cmd !== 'send') return false;
            const [dir, id, hereId, thereId] = arg.split('|');
            const c = this.mode.campaign;
            const fromId = dir === 'out' ? hereId : thereId, toId = dir === 'out' ? thereId : hereId;
            const from = this.chestPieces(...this.xz(fromId), BASE_R);
            const to = this.chestPieces(...this.xz(toId), BASE_R);
            let n = 0;
            for (const pc of from) { const st = c.pack.chests.get(pc.id); if (st?.[id]) { n += st[id]; delete st[id]; } }
            for (const pc of to) {
                if (!n) break;
                const st = c.pack.chests.get(pc.id);
                const lim = BO.ZoneWorldPlus?.chestLimitsForKey?.(pc.id) || { slots: 18, weight: 54 };
                const k = c.pack.room(id, n, st, lim);
                if (k) { st[id] = (st[id] || 0) + k; n -= k; }
            }
            if (n) { const st = c.pack.chests.get(from[0]?.id); if (st) st[id] = (st[id] || 0) + n; BO.SurvivalUI.feedback = 'The linked base storage is full; ' + n + ' stayed here.'; }
            GM.sting('trade');
            return true;
        },

        /* ---------------------------------------------------------- base cards */
        baseCards(ui) {
            const esc = GM.esc;
            const a = this.currentBase();
            if (!a) return [ui.section('Storage', '<p class="gm-muted">Stand inside a base to manage its storage. Quick-stack: ' + esc(BO.Settings.keyLabel(BO.Settings.getKeybinds().survQuickStack || 'KeyZ')) + '.</p>')];
            const pcs = this.chestPieces(a.x, a.z, BASE_R);
            const rows = pcs.map((p) => { const st = this.mode.campaign.pack.chests.get(p.id) || {}; return `<li><span>${esc(this.labelFor(p.id))}</span><em>${this.mode.campaign.pack.slots(st)} stacks</em></li>`; }).join('');
            return [ui.section('Base storage', `<ul class="gm-list">${rows || '<li class="gm-muted">No chests in this base.</li>'}</ul>
                <div class="sv-actions"><button class="sv-btn sm" data-act="gm" data-arg="storage.sort:">Auto-sort by category</button><button class="sv-btn sm" data-act="gm" data-arg="storage.quick:">Quick-stack (${esc(BO.Settings.keyLabel(BO.Settings.getKeybinds().survQuickStack || 'KeyZ'))})</button></div>
                <p class="gm-muted sm">Crafting and building here draw from all ${pcs.length} chests automatically.</p>`, pcs.length + ' chests')];
        },

        uiAct(cmd) {
            if (cmd === 'sort') { this.autoSort(); return true; }
            if (cmd === 'quick') { this.quickStack(); return true; }
            return false;
        }
    };

    GM.register('storage', Storage);
})(window.BO);
