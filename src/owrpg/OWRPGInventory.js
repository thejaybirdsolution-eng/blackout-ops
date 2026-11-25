/* ============================================================================
   BLACKOUT OPS — Open World RPG · Inventory, Loot, Vendors & Salvage
   Inventory entries: { uid, id, n, rarity?, affixes?, mfr? }. Weapons wrap a
   WeaponsData archetype with rarity damage multiplier + affixes. Loot rolls use
   weighted tables with a pity counter (Epic/Legendary guaranteed at 12).
============================================================================ */
(function (BO) {
    'use strict';

    const SD = () => BO.OWRPGStatsData;
    const RAR_ORDER = ['common', 'rare', 'epic', 'legendary'];

    const Inv = {
        def(id) { return SD().ITEMS[id]; },

        _push(s, entry, list) {
            const p = s.player;
            entry.uid = 'u' + (p.nextUid++);
            (list || p.inventory).push(entry);
            return entry;
        },

        /** Adds n of an item (stackables merge). Weapons/rigs become unique instances. */
        add(s, id, n = 1, opts = {}) {
            const d = this.def(id);
            if (!d) { console.warn('[OWRPG] unknown item', id); return null; }
            if (id === 'relay_cell') { s.player.relayCells += n; BO.Events.emit('owrpg:item', { id, n }); return { id, n }; }
            let last = null;
            if (d.stack || d.type === 'quest' || d.type === 'junk') {
                const ex = s.player.inventory.find((e) => e.id === id);
                if (ex) { ex.n += n; last = ex; } else last = this._push(s, { id, n });
            } else {
                for (let i = 0; i < n; i++) last = this._push(s, this.makeInstance(id, opts.rarity));
            }
            BO.Events.emit('owrpg:item', { id, n });
            return last;
        },

        makeInstance(id, rarity) {
            const d = this.def(id);
            const r = rarity || d.rarity || 'common';
            const e = { id, n: 1, rarity: r, affixes: [] };
            if (d.type === 'weapon') {
                e.mfr = BO.Math.pick(SD().MANUFACTURERS);
                if (d.fixedAffix) e.affixes.push(d.fixedAffix);
                const keys = Object.keys(SD().AFFIXES);
                let guard = 0;
                while (e.affixes.length < SD().RARITY[r].affixes && guard++ < 20) {
                    const k = BO.Math.pick(keys);
                    if (!e.affixes.includes(k)) e.affixes.push(k);
                }
            }
            return e;
        },

        count(s, id) {
            if (id === 'relay_cell') return s.player.relayCells;
            return s.player.inventory.filter((e) => e.id === id).reduce((a, e) => a + e.n, 0);
        },
        has(s, id) { return this.count(s, id) > 0; },

        remove(s, id, n = 1) {
            if (id === 'relay_cell') { s.player.relayCells = Math.max(0, s.player.relayCells - n); return true; }
            const inv = s.player.inventory;
            for (let i = inv.length - 1; i >= 0 && n > 0; i--) {
                if (inv[i].id !== id) continue;
                const take = Math.min(n, inv[i].n);
                inv[i].n -= take;
                n -= take;
                if (inv[i].n <= 0) { this._unequipUid(s, inv[i].uid); inv.splice(i, 1); }
            }
            return n === 0;
        },

        removeUid(s, uid) {
            const inv = s.player.inventory;
            const i = inv.findIndex((e) => e.uid === uid);
            if (i < 0) return null;
            this._unequipUid(s, uid);
            return inv.splice(i, 1)[0];
        },

        byUid(s, uid) { return s.player.inventory.find((e) => e.uid === uid) || null; },

        _unequipUid(s, uid) {
            const eq = s.player.equipped;
            for (const k of Object.keys(eq)) if (eq[k] === uid) eq[k] = null;
        },

        equippedEntry(s, slot) { const uid = s.player.equipped[slot]; return uid ? this.byUid(s, uid) : null; },

        entryWeight(e) {
            const d = this.def(e.id);
            if (!d) return 0;
            let w = d.weight * e.n;
            if (e.affixes && e.affixes.includes('light')) w *= SD().AFFIXES.light.weightMult;
            return w;
        },
        weight(s) { return s.player.inventory.reduce((a, e) => a + this.entryWeight(e), 0); },

        meetsReq(s, id) {
            const d = this.def(id);
            if (!d || !d.req) return true;
            return BO.OWRPGCharacter.attr(s, d.req[0]) >= d.req[1];
        },

        /** Equip a weapon into 'primary'/'secondary' or a rig into 'rig'. */
        equip(s, uid, slot) {
            const e = this.byUid(s, uid);
            if (!e) return 'Missing item';
            const d = this.def(e.id);
            if (!this.meetsReq(s, e.id)) return `Requires ${d.req[0]} ${d.req[1]}`;
            if (d.type === 'rig') slot = 'rig';
            else if (d.type !== 'weapon') return 'Not equippable';
            else if (slot !== 'primary' && slot !== 'secondary') slot = 'primary';
            const eq = s.player.equipped;
            for (const k of Object.keys(eq)) if (eq[k] === uid) eq[k] = null;
            eq[slot] = uid;
            return '';
        },

        /** Combat-relevant stats of a weapon entry. */
        weaponStats(e) {
            const d = this.def(e.id);
            const r = SD().RARITY[e.rarity || d.rarity || 'common'];
            const out = { dmgMult: r.mult, pen: 0, critAdd: 0, burnChance: 0, chillChance: 0, shockChance: 0 };
            for (const a of e.affixes || []) {
                const A = SD().AFFIXES[a];
                if (!A) continue;
                for (const k of ['pen', 'critAdd', 'burnChance', 'chillChance', 'shockChance']) if (A[k]) out[k] += A[k];
            }
            return out;
        },

        displayName(e) {
            const d = this.def(e.id);
            if (!d) return e.id;
            const pre = (e.affixes || []).filter((a) => a !== 'light' || true).slice(0, 1).map((a) => SD().AFFIXES[a].name + ' ');
            return (d.type === 'weapon' ? pre.join('') : '') + d.name + (e.n > 1 ? ` ×${e.n}` : '');
        },

        rarityColor(e) { const d = this.def(e.id); return SD().RARITY[e.rarity || (d && d.rarity) || 'common'].color; },

        /** Weighted loot roll with pity. Returns [{id,n,rarity?}] and credits. */
        rollLoot(s, table, rolls = 2) {
            const T = SD().LOOT[table];
            if (!T) return { items: [], credits: 0 };
            const out = { items: [], credits: 0 };
            const total = T.reduce((a, r) => a + r[1], 0);
            for (let k = 0; k < rolls; k++) {
                let pick = Math.random() * total;
                const row = T.find((r) => (pick -= r[1]) <= 0) || T[0];
                const n = row[2] + Math.floor(Math.random() * (row[3] - row[2] + 1));
                if (row[0] === 'credits') out.credits += n;
                else out.items.push({ id: row[0], n });
            }
            // Pity: rare+ weapons/rigs upgrade to epic when the dry streak hits the guarantee.
            for (const it of out.items) {
                const d = this.def(it.id);
                if (d.type !== 'weapon' && d.type !== 'rig') continue;
                let r = d.rarity || 'common';
                const roll = Math.random();
                if (roll < 0.06) r = 'legendary'; else if (roll < 0.2) r = 'epic'; else if (roll < 0.5 && r === 'common') r = 'rare';
                if (s.pityCounter + 1 >= SD().PITY_GUARANTEE && RAR_ORDER.indexOf(r) < 2) r = 'epic';
                it.rarity = r;
            }
            const big = out.items.some((it) => it.rarity === 'epic' || it.rarity === 'legendary');
            s.pityCounter = big ? 0 : s.pityCounter + 1;
            return out;
        },

        grantLoot(s, loot) {
            for (const it of loot.items) this.add(s, it.id, it.n, { rarity: it.rarity });
            s.player.credits += loot.credits;
        },

        /** Vendor buy price for an item (null if the vendor won't trade). */
        buyPrice(s, vendorId, id) {
            const v = BO.OWRPGFactionsData.VENDORS[vendorId];
            const disc = BO.OWRPGFactions.vendorDiscount(s, v.faction);
            if (disc === null) return null;
            return Math.max(1, Math.round(this.def(id).value * BO.OWRPGCharacter.derived(s).buyMult * (1 - disc)));
        },

        sellPrice(s, e) {
            const d = this.def(e.id);
            if (!d || d.type === 'quest') return 0;
            const r = SD().RARITY[e.rarity || d.rarity || 'common'];
            return Math.max(1, Math.round(d.value * r.mult * BO.OWRPGCharacter.derived(s).sellMult));
        },

        buy(s, vendorId, id) {
            const price = this.buyPrice(s, vendorId, id);
            if (price === null) return 'They refuse to trade with you.';
            if (s.player.credits < price) return 'Not enough credits.';
            s.player.credits -= price;
            this.add(s, id, 1);
            return '';
        },

        sell(s, uid) {
            const e = this.byUid(s, uid);
            if (!e) return 0;
            const each = this.sellPrice(s, Object.assign({}, e, { n: 1 }));
            if (!each) return 0;
            if (e.n > 1) e.n--; else this.removeUid(s, uid);
            s.player.credits += each;
            return each;
        },

        /** Break junk or gear into credits-worth scrap (junk sells better salvaged with the perk). */
        salvage(s, uid) {
            const e = this.byUid(s, uid);
            if (!e) return 0;
            const d = this.def(e.id);
            if (d.type === 'quest' || (d.type === 'consumable')) return 0;
            const fx = BO.OWRPGCharacter.perkFx(s);
            const base = d.type === 'junk' ? d.scrap * 4 : Math.round(d.value * 0.25);
            const each = Math.round(base * (1 + (fx.salvage || 0)));
            if (e.n > 1) e.n--; else this.removeUid(s, uid);
            s.player.credits += each;
            return each;
        }
    };

    BO.OWRPGInventory = Inv;
})(window.BO);
