/* ============================================================================
   BLACKOUT OPS — Open World RPG · Inventory, Multi-Slot Armor, Gun RPG Stats
   Reads BO.OWRPGGunStats exclusively for OWRPG (never mutating BO.WeaponsData).
   Supports multi-slot armor (helmet, rig, boots, relic), tools with
   durability, and mount schematic auto-unlocks.
============================================================================ */
(function (BO) {
    'use strict';

    const SD = () => BO.OWRPGStatsData;
    const RAR_ORDER = ['common', 'rare', 'epic', 'legendary'];
    const ARMOR_SLOTS = { helmet: 'helmet', rig: 'rig', boots: 'boots', relic: 'relic', tool: 'tool' };

    const Inv = {
        def(id) { return SD().ITEMS[id]; },

        _push(s, entry, list) {
            const p = s.player;
            entry.uid = 'u' + (p.nextUid++);
            (list || p.inventory).push(entry);
            return entry;
        },

        add(s, id, n = 1, opts = {}) {
            const d = this.def(id);
            if (!d) { console.warn('[OWRPG] unknown item', id); return null; }
            if (id === 'relay_cell') { s.player.relayCells += n; BO.Events.emit('owrpg:item', { id, n }); return { id, n }; }
            if (id.startsWith('schematic_') && BO.OWRPGMounts) {
                const mountId = id.replace('schematic_', '');
                if (BO.OWRPGExpansionData?.MOUNTS?.[mountId]) {
                    BO.OWRPGMounts.unlock(s, mountId);
                    return { id, n: 1, mountUnlocked: mountId };
                }
            }
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
            if (BO.OWRPGDurability) BO.OWRPGDurability.initItem(e);
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

        /** Equip a weapon ('primary'/'secondary'), armor ('helmet'/'rig'/'boots'/'relic'), or tool ('tool'). */
        equip(s, uid, slot) {
            const e = this.byUid(s, uid);
            if (!e) return 'Missing item';
            const d = this.def(e.id);
            if (!this.meetsReq(s, e.id)) return `Requires ${d.req[0]} ${d.req[1]}`;
            if (ARMOR_SLOTS[d.type]) slot = ARMOR_SLOTS[d.type];
            else if (d.type !== 'weapon') return 'Not equippable';
            else if (slot !== 'primary' && slot !== 'secondary') slot = 'primary';
            const eq = s.player.equipped;
            for (const k of Object.keys(eq)) if (eq[k] === uid) eq[k] = null;
            eq[slot] = uid;
            return '';
        },

        /** Combat-relevant stats of a weapon entry (merges OWRPGGunStats + rarity + affixes + durability). */
        weaponStats(e) {
            const d = this.def(e.id);
            const r = SD().RARITY[e.rarity || d.rarity || 'common'];
            const gs = (BO.OWRPGGunStats && d && BO.OWRPGGunStats[d.base]) || {};
            const durPerf = BO.OWRPGDurability ? BO.OWRPGDurability.performanceMult(e) : 1.0;
            const out = {
                dmgMult: r.mult * (gs.rpgDmgMult || 1.0) * durPerf,
                pen: gs.armorPen || 0,
                critChance: gs.critChance || 0.08,
                critAdd: gs.critMultBonus || 0,
                element: gs.element || 'kinetic',
                elemDmg: (gs.elemDmg || 0) * durPerf,
                statusChance: gs.statusChance || 0,
                passiveTrait: gs.passiveTrait || null,
                passiveDesc: gs.passiveDesc || '',
                burnChance: 0, chillChance: 0, shockChance: 0, venomChance: 0, voidChance: 0
            };
            if (out.element && out.element !== 'kinetic' && out.statusChance > 0) {
                const key = out.element + 'Chance';
                if (key in out) out[key] += out.statusChance;
            }
            for (const a of e.affixes || []) {
                const A = SD().AFFIXES[a];
                if (!A) continue;
                for (const k of ['pen', 'critAdd', 'burnChance', 'chillChance', 'shockChance', 'venomChance', 'voidChance']) {
                    if (A[k]) out[k] += A[k];
                }
            }
            return out;
        },

        armorStats(e) {
            const d = this.def(e.id);
            if (!d) return { armor: 0 };
            const mult = (SD().ARMOR_RARITY_MULT && SD().ARMOR_RARITY_MULT[e.rarity || d.rarity || 'common']) || 1.0;
            const perf = BO.OWRPGDurability ? BO.OWRPGDurability.performanceMult(e) : 1.0;
            return { armor: Math.round((d.armor || 0) * mult * perf), elemRes: d.elemRes || {}, setId: d.setId || null };
        },

        displayName(e) {
            const d = this.def(e.id);
            if (!d) return e.id;
            const pre = (e.affixes || []).slice(0, 1).map((a) => SD().AFFIXES[a] ? SD().AFFIXES[a].name + ' ' : '');
            return (d.type === 'weapon' ? pre.join('') : '') + d.name + (e.n > 1 ? ` ×${e.n}` : '');
        },

        rarityColor(e) { const d = this.def(e.id); return SD().RARITY[e.rarity || (d && d.rarity) || 'common'].color; },

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
            const gearTypes = { weapon: 1, rig: 1, helmet: 1, boots: 1, relic: 1 };
            for (const it of out.items) {
                const d = this.def(it.id);
                if (!d || !gearTypes[d.type]) continue;
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

        salvage(s, uid) {
            const e = this.byUid(s, uid);
            if (!e) return 0;
            const d = this.def(e.id);
            if (d.type === 'quest' || d.type === 'consumable') return 0;
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
