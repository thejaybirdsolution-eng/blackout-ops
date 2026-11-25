/* ============================================================================
   BLACKOUT OPS — RPG Profile: persistence, characters, items, derived stats.
   Stored inside BO.Save.data.rpg so Barracks save export/import covers it.
   Schema version: RPG_SCHEMA (bump + migrate in _normalize when it changes).
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const RPG_SCHEMA = 1;

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
    const pickWeighted = (entries) => {
        // entries: [[value, weight], ...]
        let total = 0;
        for (const e of entries) total += Math.max(0, e[1]);
        let r = Math.random() * total;
        for (const e of entries) {
            if (e[1] <= 0) continue;
            r -= e[1];
            if (r < 0) return e[0];
        }
        return entries[entries.length - 1][0];
    };

    function freshClassRecord() {
        return { level: 1, xp: 0, talents: [null, null, null, null, null], equip: { weapon: null, rig: null, relic: null } };
    }

    function freshProfile() {
        return {
            v: RPG_SCHEMA,
            activeClass: null,
            classes: {},
            gold: 0,
            scrap: 0,
            stash: [],
            upgrades: {},
            checkpoints: [1],
            deepest: 0,
            difficulty: 'normal',
            stats: { delves: 0, extractions: 0, deaths: 0, kills: 0, bossKills: 0, goldBanked: 0, legendaries: 0, reactions: 0 },
            merchant: { stock: [], stamp: 0 },
            elixir: null,
            autoSalvage: true,
            uidSeq: 1,
            contract: null,
            contractCompletions: {},
            fieldGuide: {},
            run: null
        };
    }

    class RPGProfile {
        get D() { return BO.RPGData; }

        /** Live profile object (normalized lazily the first time it is read). */
        get data() {
            if (!this._normalized || BO.Save.data.rpg !== this._ref) {
                BO.Save.data.rpg = this._normalize(BO.Save.data.rpg);
                this._ref = BO.Save.data.rpg;
                this._normalized = true;
            }
            return BO.Save.data.rpg;
        }

        _normalize(raw) {
            const base = freshProfile();
            if (!raw || typeof raw !== 'object') return base;
            const p = Object.assign(base, raw);
            p.v = RPG_SCHEMA;
            p.stats = Object.assign(freshProfile().stats, raw.stats || {});
            p.merchant = Object.assign({ stock: [], stamp: 0 }, raw.merchant || {});
            p.upgrades = raw.upgrades && typeof raw.upgrades === 'object' ? raw.upgrades : {};
            p.stash = Array.isArray(raw.stash) ? raw.stash.filter((it) => this._validItem(it)) : [];
            p.merchant.stock = Array.isArray(p.merchant.stock) ? p.merchant.stock.filter((it) => this._validItem(it)) : [];
            p.checkpoints = Array.isArray(raw.checkpoints) && raw.checkpoints.length ? raw.checkpoints.filter((n) => Number.isFinite(n)) : [1];
            if (!p.checkpoints.includes(1)) p.checkpoints.unshift(1);
            if (!this.D.DIFFICULTIES[p.difficulty]) p.difficulty = 'normal';
            p.classes = {};
            for (const id of this.D.CLASS_ORDER) {
                const rec = raw.classes && raw.classes[id];
                if (!rec) continue;
                const c = Object.assign(freshClassRecord(), rec);
                c.level = clamp(Math.floor(c.level) || 1, 1, this.D.LEVEL_CAP);
                c.xp = Math.max(0, Math.floor(c.xp) || 0);
                c.talents = Array.isArray(rec.talents) ? rec.talents.slice(0, 5) : [null, null, null, null, null];
                while (c.talents.length < 5) c.talents.push(null);
                c.equip = Object.assign({ weapon: null, rig: null, relic: null }, rec.equip || {});
                for (const s of ['weapon', 'rig', 'relic']) if (c.equip[s] && !this._validItem(c.equip[s])) c.equip[s] = null;
                p.classes[id] = c;
            }
            if (p.activeClass && !p.classes[p.activeClass]) p.activeClass = null;
            if (p.run && (typeof p.run !== 'object' || !p.classes[p.run.classId])) p.run = null;
            p.uidSeq = Math.max(1, Math.floor(p.uidSeq) || 1);
            p.contract = Object.hasOwn(this.D.CONTRACTS, p.contract) ? p.contract : null;
            p.contractCompletions = this._normalizeCounts(raw.contractCompletions, Object.keys(this.D.CONTRACTS));
            p.fieldGuide = this._normalizeCounts(raw.fieldGuide, [
                ...Object.keys(this.D.ENEMIES), ...this.D.BOSSES.map((boss) => boss.id)
            ]);
            return p;
        }

        _normalizeCounts(raw, ids) {
            return Object.fromEntries(ids.filter((id) => Number.isFinite(raw?.[id]) && raw[id] >= 1)
                .map((id) => [id, Math.floor(raw[id])]));
        }

        setContract(id) {
            const contract = Object.hasOwn(this.D.CONTRACTS, id) ? this.D.CONTRACTS[id] : null;
            const p = this.data;
            if (id !== null && (!contract || !p.checkpoints.some((floor) => floor >= contract.floor))) return false;
            p.contract = id;
            this.save();
            return true;
        }

        equippedSetCount(id) {
            return Object.values(this.cls?.equip || {}).filter((item) => this.D.legendaryById(item?.legendary)?.set === id).length;
        }

        _validItem(it) {
            return !!(it && typeof it === 'object' && this.D.ITEM_SLOTS[it.slot] && this.D.RARITY_INDEX[it.rarity] !== undefined && Number.isFinite(it.ilvl));
        }

        save() { BO.Save.save(); }

        /* ---------------- Characters ---------------- */
        get hasCharacter() { return !!this.data.activeClass; }
        get classId() { return this.data.activeClass; }
        get cls() { return this.data.activeClass ? this.data.classes[this.data.activeClass] : null; }
        classRecord(id) { return this.data.classes[id] || null; }

        /** Creates (if needed) and activates a class record with its starter weapon. */
        selectClass(id) {
            if (!this.D.CLASSES[id]) return false;
            const p = this.data;
            if (!p.classes[id]) {
                const rec = freshClassRecord();
                rec.equip.weapon = this.makeStarterWeapon(id);
                p.classes[id] = rec;
            }
            p.activeClass = id;
            this.save();
            return true;
        }

        makeStarterWeapon(classId) {
            const c = this.D.CLASSES[classId];
            return this._finalizeItem({ slot: 'weapon', rarity: 'common', ilvl: 1, base: c.startWeapon, affixes: [], legendary: null });
        }

        /* ---------------- XP & talents ---------------- */
        xpNeeded(rec = this.cls) { return rec.level >= this.D.LEVEL_CAP ? 0 : this.D.xpToNext(rec.level); }

        /** Adds XP to the active class. Returns the list of levels reached. */
        addXP(amount) {
            const rec = this.cls;
            if (!rec || amount <= 0) return [];
            const reached = [];
            if (rec.level >= this.D.LEVEL_CAP) return reached;
            rec.xp += Math.round(amount);
            while (rec.level < this.D.LEVEL_CAP && rec.xp >= this.D.xpToNext(rec.level)) {
                rec.xp -= this.D.xpToNext(rec.level);
                rec.level++;
                reached.push(rec.level);
            }
            if (rec.level >= this.D.LEVEL_CAP) rec.xp = 0;
            return reached;
        }

        tierUnlocked(tier, rec = this.cls) { return !!rec && rec.level >= this.D.TALENT_TIER_LEVELS[tier]; }

        chooseTalent(tier, talentId) {
            const rec = this.cls;
            if (!rec || !this.tierUnlocked(tier, rec)) return false;
            const options = this.D.TALENTS[this.classId][tier];
            if (!options || !options.some((t) => t.id === talentId)) return false;
            rec.talents[tier] = talentId;
            this.save();
            return true;
        }

        respec() {
            const rec = this.cls;
            if (!rec) return;
            rec.talents = [null, null, null, null, null];
            this.save();
        }

        unspentTalentTiers(rec = this.cls) {
            if (!rec) return 0;
            let n = 0;
            for (let t = 0; t < 5; t++) if (this.tierUnlocked(t, rec) && !rec.talents[t]) n++;
            return n;
        }

        talentSet(rec = this.cls) { return new Set((rec ? rec.talents : []).filter(Boolean)); }

        /* ---------------- Items ---------------- */
        _nextUid() { const p = this.data; return 'it' + (p.uidSeq++).toString(36) + Math.random().toString(36).slice(2, 5); }

        _rollAffix(slot, rarityIdx, exclude) {
            const pool = this.D.AFFIXES[slot].filter((a) => !exclude.has(a.k));
            if (!pool.length) return null;
            const a = BO.Math.pick(pool);
            const boost = 1 + 0.2 * Math.max(0, rarityIdx - 1);
            const v = Math.round(BO.Math.randRange(a.v[0], a.v[1]) * boost);
            return { k: a.k, v: Math.max(1, v) };
        }

        _finalizeItem(it) {
            it.uid = it.uid || this._nextUid();
            it.ilvl = clamp(Math.floor(it.ilvl) || 1, 1, 40);
            if (it.slot === 'weapon' && !BO.WeaponsData.get(it.base)) it.base = 'm4a1';
            it.name = this._itemName(it);
            return it;
        }

        _itemName(it) {
            if (it.legendary) {
                const L = this.D.legendaryById(it.legendary);
                if (L) return L.name;
            }
            if (it.slot === 'weapon') return BO.WeaponsData.get(it.base).shortName;
            if (it.name) return it.name;
            return BO.Math.pick(it.slot === 'rig' ? this.D.RIG_NAMES : this.D.RELIC_NAMES);
        }

        /**
         * Rolls a random item.
         * opts: { floor, slot, minRarity, rarityBonus, set, excludeLegendaries }
         */
        rollItem(opts = {}) {
            const floor = Math.max(1, opts.floor || 1);
            const weights = this.D.rarityWeights(floor, opts.rarityBonus || 0);
            const minIdx = this.D.RARITY_INDEX[opts.set ? 'legendary' : opts.minRarity] || 0;
            const rIdx = pickWeighted(weights.map((w, i) => [i, i >= minIdx ? w : 0]));
            const rarity = this.D.RARITIES[rIdx];
            const setPool = opts.set ? this.D.LEGENDARIES.filter((item) => item.set === opts.set) : [];
            const newPieces = setPool.filter((item) => !opts.excludeLegendaries?.has(item.id));
            const setPiece = setPool.length ? BO.Math.pick(newPieces.length ? newPieces : setPool) : null;
            const slot = setPiece?.slot || opts.slot || pickWeighted([['weapon', 40], ['rig', 30], ['relic', 30]]);
            const ilvl = clamp(Math.ceil(floor * 0.8) + randInt(-1, 1), 1, 40);
            const it = { slot, rarity: rarity.id, ilvl, affixes: [], legendary: null };
            if (rarity.id === 'legendary') {
                const pool = this.D.LEGENDARIES.filter((l) => l.slot === slot && (!l.set || floor >= this.D.SETS[l.set].minFloor));
                const L = setPiece || BO.Math.pick(pool);
                it.legendary = L.id;
                if (slot === 'weapon') it.base = L.base;
            }
            if (slot === 'weapon' && !it.base) it.base = BO.Math.pick(this.D.WEAPON_POOL);
            const used = new Set();
            for (let i = 0; i < rarity.affixes; i++) {
                const a = this._rollAffix(slot, rIdx, used);
                if (!a) break;
                used.add(a.k);
                it.affixes.push(a);
            }
            return this._finalizeItem(it);
        }

        rarity(it) { return this.D.RARITIES[this.D.RARITY_INDEX[it.rarity] || 0]; }

        /** Inherent stat that grows with item level (the number item comparisons use). */
        baseStat(it) {
            const r = this.rarity(it);
            if (it.slot === 'weapon') {
                const mult = 1 + this.D.ITEM_POWER_PER_LEVEL * (it.ilvl - 1) + r.power;
                return { key: 'weaponPower', value: mult, label: `${Math.round(mult * 100)}% weapon power` };
            }
            if (it.slot === 'rig') {
                const hp = Math.round((8 + 5 * it.ilvl) * (1 + r.power * 2));
                return { key: 'maxHp', value: hp, label: `+${hp} max HP` };
            }
            const ad = Math.round((4 + 1.5 * it.ilvl) * (1 + r.power * 2));
            return { key: 'abilityDmg', value: ad, label: `+${ad}% ability damage` };
        }

        affixLabel(slot, a) {
            const def = this.D.AFFIXES[slot].find((x) => x.k === a.k);
            return def ? def.label.replace('{v}', a.v) : a.k;
        }

        describeItem(it) {
            const lines = [this.baseStat(it).label];
            for (const a of it.affixes) lines.push(this.affixLabel(it.slot, a));
            return lines;
        }

        sellValue(it) { return Math.round(this.rarity(it).value * (1 + it.ilvl * 0.12)); }
        buyValue(it) { return Math.round(this.sellValue(it) * 3.2); }
        scrapValue(it) { return Math.round(this.rarity(it).scrap * (1 + it.ilvl * 0.08)); }

        /* ---------------- Equipment & stash ---------------- */
        equip(item, rec = this.cls) {
            if (!rec || !item) return null;
            const prev = rec.equip[item.slot] || null;
            rec.equip[item.slot] = item;
            return prev;
        }

        /** Equips an item from the stash (swapping the old one back into the stash). */
        equipFromStash(uid) {
            const p = this.data;
            const idx = p.stash.findIndex((it) => it.uid === uid);
            if (idx < 0) return false;
            const it = p.stash.splice(idx, 1)[0];
            const prev = this.equip(it);
            if (prev) p.stash.splice(idx, 0, prev);
            this.save();
            return true;
        }

        unequip(slot) {
            const rec = this.cls;
            const p = this.data;
            if (!rec || !rec.equip[slot]) return false;
            if (slot === 'weapon') return false; // a weapon is always required
            if (this.stashFree() <= 0) return false;
            p.stash.push(rec.equip[slot]);
            rec.equip[slot] = null;
            this.save();
            return true;
        }

        stashCapacity() { return this.D.STASH_SIZE + this.upgradeLevel('vault_racks') * 8; }
        stashFree() { return this.stashCapacity() - this.data.stash.length; }

        sellFromStash(uid) {
            const p = this.data;
            const idx = p.stash.findIndex((it) => it.uid === uid);
            if (idx < 0) return 0;
            const it = p.stash.splice(idx, 1)[0];
            const g = this.sellValue(it);
            p.gold += g;
            this.save();
            return g;
        }

        salvageFromStash(uid) {
            const p = this.data;
            const idx = p.stash.findIndex((it) => it.uid === uid);
            if (idx < 0) return 0;
            const it = p.stash.splice(idx, 1)[0];
            const s = this.scrapValue(it);
            p.scrap += s;
            this.save();
            return s;
        }

        findStashItem(uid) { return this.data.stash.find((it) => it.uid === uid) || null; }

        findOwnedItem(uid) {
            const s = this.findStashItem(uid);
            if (s) return s;
            const rec = this.cls;
            if (rec) for (const slot of ['weapon', 'rig', 'relic']) if (rec.equip[slot] && rec.equip[slot].uid === uid) return rec.equip[slot];
            return null;
        }

        /* ---------------- Upgrades, merchant, elixirs, forge ---------------- */
        upgradeLevel(id) { return Math.max(0, Math.floor(this.data.upgrades[id] || 0)); }

        upgradeCost(id) {
            const u = this.D.upgradeById(id);
            const lv = this.upgradeLevel(id);
            return u && lv < u.costs.length ? u.costs[lv] : null;
        }

        buyUpgrade(id) {
            const cost = this.upgradeCost(id);
            const p = this.data;
            if (cost == null || p.gold < cost) return false;
            p.gold -= cost;
            p.upgrades[id] = this.upgradeLevel(id) + 1;
            this.save();
            return true;
        }

        /** Restocks the merchant after each delve (and on first visit). */
        refreshMerchant(force = false) {
            const p = this.data;
            const stamp = p.stats.delves;
            if (!force && p.merchant.stamp === stamp && p.merchant.stock.length) return;
            const lvl = this.cls ? this.cls.level : 1;
            const floor = Math.max(1, Math.max(p.deepest, Math.round(lvl * 1.4)));
            const stock = [];
            for (let i = 0; i < 4; i++) stock.push(this.rollItem({ floor, minRarity: i === 0 ? 'epic' : 'rare', slot: ['weapon', 'rig', 'relic', null][i] || undefined }));
            p.merchant = { stock, stamp };
            this.save();
        }

        buyMerchantItem(uid) {
            const p = this.data;
            const idx = p.merchant.stock.findIndex((it) => it.uid === uid);
            if (idx < 0) return 'missing';
            const it = p.merchant.stock[idx];
            const cost = this.buyValue(it);
            if (p.gold < cost) return 'gold';
            if (this.stashFree() <= 0) return 'stash';
            p.gold -= cost;
            p.merchant.stock.splice(idx, 1);
            p.stash.push(it);
            this.save();
            return 'ok';
        }

        buyElixir(id) {
            const e = this.D.ELIXIRS.find((x) => x.id === id);
            const p = this.data;
            if (!e || p.elixir || p.gold < e.cost) return false;
            p.gold -= e.cost;
            p.elixir = id;
            this.save();
            return true;
        }

        rerollCost(it) {
            const i = this.D.RARITY_INDEX[it.rarity];
            return { gold: this.D.FORGE.rerollGold[i], scrap: this.D.FORGE.rerollScrap[i] };
        }

        rerollAffix(uid, affixIdx) {
            const it = this.findOwnedItem(uid);
            const p = this.data;
            if (!it || !it.affixes[affixIdx]) return false;
            const c = this.rerollCost(it);
            if (p.gold < c.gold || p.scrap < c.scrap) return false;
            const used = new Set(it.affixes.map((a, i) => (i === affixIdx ? null : a.k)).filter(Boolean));
            used.add(it.affixes[affixIdx].k); // guarantee a different affix
            const a = this._rollAffix(it.slot, this.D.RARITY_INDEX[it.rarity], used);
            if (!a) return false;
            p.gold -= c.gold;
            p.scrap -= c.scrap;
            it.affixes[affixIdx] = a;
            this.save();
            return true;
        }

        promoteCost(it) {
            const i = this.D.RARITY_INDEX[it.rarity];
            if (i >= 2) return null; // Legendaries only drop; Epic is the forge ceiling.
            return { gold: this.D.FORGE.promoteGold[i], scrap: this.D.FORGE.promoteScrap[i] };
        }

        promote(uid) {
            const it = this.findOwnedItem(uid);
            const p = this.data;
            if (!it) return false;
            const c = this.promoteCost(it);
            if (!c || p.gold < c.gold || p.scrap < c.scrap) return false;
            p.gold -= c.gold;
            p.scrap -= c.scrap;
            const next = this.D.RARITY_INDEX[it.rarity] + 1;
            it.rarity = this.D.RARITIES[next].id;
            const used = new Set(it.affixes.map((a) => a.k));
            while (it.affixes.length < this.D.RARITIES[next].affixes) {
                const a = this._rollAffix(it.slot, next, used);
                if (!a) break;
                used.add(a.k);
                it.affixes.push(a);
            }
            this.save();
            return true;
        }

        reforgeTarget() {
            const lvl = this.cls ? this.cls.level : 1;
            return Math.max(1, Math.max(Math.ceil(this.data.deepest * 0.8), lvl));
        }

        reforgeCost(it) {
            const gain = this.reforgeTarget() - it.ilvl;
            return gain > 0 ? { scrap: gain * this.D.FORGE.reforgeLevelScrap, gain } : null;
        }

        reforge(uid) {
            const it = this.findOwnedItem(uid);
            const p = this.data;
            if (!it) return false;
            const c = this.reforgeCost(it);
            if (!c || p.scrap < c.scrap) return false;
            p.scrap -= c.scrap;
            it.ilvl += c.gain;
            this.save();
            return true;
        }

        /* ---------------- Derived stats ----------------
           run: optional live delve state ({ boons:Set, elixir, shrineHpPenalty }). */
        computeStats(run = null) {
            const D = this.D;
            const classId = this.classId;
            const rec = this.cls;
            const C = D.CLASSES[classId];
            const talents = this.talentSet(rec);
            const s = {
                classId, level: rec.level, talents,
                maxHp: C.baseHp + D.levelHpBonus(rec.level),
                weaponPower: 1, gunDmg: 0, headDmg: 0, bodyDmg: 0, eliteDmg: 0,
                burnChance: 0, chillChance: 0, shockChance: 0, exposeChance: 0,
                killHeal: classId === 'vanguard' ? (talents.has('bloodletter') ? 10 : 4) : 0, killHealPct: 0,
                dmgReduce: 0, potionHeal: 0, goldFind: 0, momentumKeep: 0,
                cdr: 0, reactionDmg: 0, abilityDmg: 0, statusDur: 0, ultCharge: 0, xpGain: 0,
                maxHpPct: 0, dmgMult: 1,
                alwaysBurn: false, headDetonate: false, everyNthDetonate: 0, doubleReactions: false, prismPrimer: false,
                abilityPower: D.abilityPower(rec.level),
                potionsMax: D.BASE_POTIONS + this.upgradeLevel('potion_belt'),
                potionHealFrac: D.BASE_POTION_HEAL + D.levelPotionBonus(rec.level),
                packSlots: D.BASE_PACK_SLOTS + this.upgradeLevel('field_pack'),
                dropBonus: 0.12 * this.upgradeLevel('scavenger'),
                insurance: 0.15 * this.upgradeLevel('insurance'),
                fieldMedic: this.upgradeLevel('second_wind') > 0
            };
            s.potionHeal += 15 * this.upgradeLevel('alchemy');
            const addFx = (fx) => {
                for (const [k, v] of Object.entries(fx)) {
                    if (typeof v === 'boolean') s[k] = s[k] || v;
                    else if (k === 'everyNthDetonate') s[k] = v;
                    else s[k] = (s[k] || 0) + v;
                }
            };
            for (const slot of ['weapon', 'rig', 'relic']) {
                const it = rec.equip[slot];
                if (!it) continue;
                const b = this.baseStat(it);
                if (b.key === 'weaponPower') s.weaponPower = b.value;
                else s[b.key] += b.value;
                for (const a of it.affixes) s[a.k] = (s[a.k] || 0) + a.v;
                if (it.legendary) {
                    const L = D.legendaryById(it.legendary);
                    if (L) addFx(L.fx);
                }
            }
            for (const [id, set] of Object.entries(D.SETS)) {
                const count = this.equippedSetCount(id);
                for (const bonus of set.bonuses) if (count >= bonus.pieces) addFx(bonus.fx);
            }
            if (talents.has('iron_hide')) s.maxHpPct += 25;
            if (run) {
                for (const id of run.boons) {
                    const effects = D.boonById(id)?.fx;
                    if (effects) addFx(effects);
                }
                if (run.boons.has('glass_cannon')) { s.dmgMult *= 1.35; s.maxHpPct -= 25; }
                if (run.boons.has('overclock')) s.cdr += 25;
                if (run.boons.has('fortune')) s.goldFind += 40;
                if (run.boons.has('deep_pockets')) s.packSlots += 2;
                if (run.boons.has('potion_belt')) s.potionsMax += 1;
                if (run.boons.has('thermal_rounds')) s.burnChance += 15;
                if (run.boons.has('cryo_rounds')) s.chillChance += 15;
                if (run.boons.has('static_rounds')) s.shockChance += 15;
                if (run.elixir === 'wrath') s.dmgMult *= 1.15;
                if (run.elixir === 'iron') s.maxHpPct += 20;
                if (run.elixir === 'fortune') s.goldFind += 30;
            }
            s.maxHp = Math.max(30, Math.round(s.maxHp * (1 + s.maxHpPct / 100) * (1 - ((run && run.shrineHpPenalty) || 0))));
            s.cdrMult = clamp(1 - s.cdr / 100, 0.4, 1.6);
            s.dmgTakenMult = clamp(1 - s.dmgReduce / 100, 0.35, 1.5);
            s.potionHealFrac *= Math.max(0.2, 1 + s.potionHeal / 100);
            s.potionHealFrac = Math.min(1, s.potionHealFrac);
            return s;
        }

        /* ---------------- Delve suspend / resume ---------------- */
        saveRun(run) { this.data.run = run; this.save(); }
        clearRun() { this.data.run = null; this.save(); }
    }

    BO.RPGProfile = new RPGProfile();
})(window);
