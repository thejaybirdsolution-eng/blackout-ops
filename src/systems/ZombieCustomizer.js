/* ============================================================================
   BLACKOUT OPS — Shared Zombie Customizer & Saved Setups
   Works across Survival Mode, Zombies Mode, and Tower Defense Mode:
   - Edit individual zombie/boss stats (HP, speed, attack, defense, points,
     scale, splitCount, jumpChance, isMagical, movementHabit, attackType,
     resistances)
   - Choose the exact round / day each zombie or boss can start appearing on
   - Edit % spawn chance for whole categories AND individual zombies
   - Save, load, delete, export/import named zombie setups/configs in storage
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const STORAGE_KEY = 'bo_zombie_custom_configs_v1';

    const CATEGORIES = [
        { id: 'easy',       label: 'Easy',        color: '#4ade80', defaultPct: 50 },
        { id: 'normal',     label: 'Normal',      color: '#38bdf8', defaultPct: 25 },
        { id: 'hard',       label: 'Hard',        color: '#f59e0b', defaultPct: 15 },
        { id: 'boss',       label: 'Boss',        color: '#ef4444', defaultPct: 8  },
        { id: 'super_boss', label: 'Super Boss',  color: '#fde047', defaultPct: 2  }
    ];

    const DEFAULT_CATEGORY_CHANCES = {
        easy: 50,
        normal: 25,
        hard: 15,
        boss: 8,
        super_boss: 2
    };

    const MOVEMENT_HABITS = [
        'lumber', 'crawl_fast', 'sprint', 'hop_erratic', 'flank_circle',
        'charge_bull', 'stomp_march', 'leap_pounce', 'zig_zag', 'hover_drift', 'teleport_blink',
        ...Object.keys(BO.ZombieBehaviors.movement)
    ];

    const ATTACK_TYPES = [
        'melee', 'double_claw', 'acid_spit', 'suicide_blast', 'pounce',
        'toxic_cloud', 'shield_bash', 'fire_bolt', 'frost_shard',
        'shockwave_slam', 'life_drain', 'aether_bolt'
    ];

    const BASE_SPECS = Object.create(null);

    function deepClone(obj) {
        return obj == null ? obj : JSON.parse(JSON.stringify(obj));
    }

    function snapshotDefaults() {
        const ZD = BO.ZombiesData;
        if (!ZD) return;
        const all = [].concat(ZD.ZOMBIE_TYPES || [], ZD.ORDERED_BOSSES || []);
        for (let i = 0; i < all.length; i++) {
            const s = all[i];
            if (!s || !s.id || BASE_SPECS[s.id]) continue;
            BASE_SPECS[s.id] = deepClone({
                hp: s.hp,
                speed: s.speed,
                attack: s.attack,
                defense: s.defense || 0,
                resistances: s.resistances || { bullet: 1, explosive: 1, fire: 1, headshot: 1, melee: 1 },
                movementHabit: s.movementHabit || 'lumber',
                attackType: s.attackType || 'melee',
                bonusAttacks: (s.bonusAttacks || []).slice(),
                splitCount: s.splitCount || 0,
                jumpChance: s.jumpChance || 0,
                isMagical: !!s.isMagical,
                unlockRound: s.unlockRound || 1,
                bossRound: s.bossRound || null,
                drops: s.drops || { points: 60 },
                scale: (s.bodySpec && Array.isArray(s.bodySpec.scale)) ? s.bodySpec.scale.slice(0, 3) : [1, 1, 1]
            });
        }
    }

    function makeDefaultConfig() {
        return {
            activePresetName: 'Default',
            disabledEnemies: [],
            categoryChances: Object.assign({}, DEFAULT_CATEGORY_CHANCES),
            useCustomCategoryChances: false,
            overrides: {}
        };
    }

    function sanitizeConfig(raw) {
        const base = makeDefaultConfig();
        if (!raw || typeof raw !== 'object') return base;
        if (typeof raw.activePresetName === 'string' && raw.activePresetName.trim()) {
            base.activePresetName = raw.activePresetName.trim().slice(0, 48);
        }
        if (Array.isArray(raw.disabledEnemies)) {
            base.disabledEnemies = Array.from(new Set(raw.disabledEnemies.filter((id) => typeof id === 'string')));
        }
        if (raw.categoryChances && typeof raw.categoryChances === 'object') {
            for (const c of CATEGORIES) {
                const v = Number(raw.categoryChances[c.id]);
                if (Number.isFinite(v) && v >= 0) base.categoryChances[c.id] = Math.min(100, Math.round(v * 10) / 10);
            }
        }
        base.useCustomCategoryChances = !!raw.useCustomCategoryChances;
        if (raw.overrides && typeof raw.overrides === 'object') {
            for (const id of Object.keys(raw.overrides)) {
                const ov = raw.overrides[id];
                if (ov && typeof ov === 'object' && Object.keys(ov).length > 0) {
                    base.overrides[id] = deepClone(ov);
                }
            }
        }
        return base;
    }

    function readStorage() {
        try {
            if (global.localStorage) {
                const raw = global.localStorage.getItem(STORAGE_KEY);
                if (raw) return JSON.parse(raw);
            }
        } catch (e) {}
        return null;
    }

    function writeStorage(payload) {
        try {
            if (global.localStorage) {
                global.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
            }
        } catch (e) {}
    }

    function getCategory(spec) {
        if (!spec) return 'easy';
        if (spec.isSuperBoss) return 'super_boss';
        if (spec.isBoss) return 'boss';
        if (spec.rarity === 'hard') return 'hard';
        if (spec.rarity === 'normal') return 'normal';
        return 'easy';
    }

    function getAllSpecs() {
        const ZD = BO.ZombiesData;
        if (!ZD) return [];
        const seen = new Set();
        const out = [];
        const list = [].concat(ZD.ORDERED_PROGRESSION || ZD.ZOMBIE_TYPES || [], ZD.ORDERED_BOSSES || []);
        for (const s of list) {
            if (s && s.id && !seen.has(s.id)) {
                seen.add(s.id);
                out.push(s);
            }
        }
        return out;
    }

    class ZombieCustomizer {
        constructor() {
            snapshotDefaults();
            const stored = readStorage();
            this.config = sanitizeConfig(stored && stored.active);
            this.presets = {};
            if (stored && stored.presets && typeof stored.presets === 'object') {
                for (const name of Object.keys(stored.presets)) {
                    const entry = stored.presets[name];
                    if (entry && entry.config) {
                        this.presets[name] = {
                            savedAt: entry.savedAt || Date.now(),
                            config: sanitizeConfig(entry.config)
                        };
                    }
                }
            }
            this.applyToZombiesData();
        }

        get CATEGORIES() { return CATEGORIES; }
        get MOVEMENT_HABITS() { return MOVEMENT_HABITS; }
        get ATTACK_TYPES() { return ATTACK_TYPES; }

        getCategory(spec) { return getCategory(spec); }

        getBaseSpec(id) {
            snapshotDefaults();
            return BASE_SPECS[id] || null;
        }

        getOverride(id) {
            return (this.config.overrides && this.config.overrides[id]) || null;
        }

        hasStatOverride(id, field) {
            const ov = this.getOverride(id);
            return !!(ov && ov[field] !== undefined && ov[field] !== null);
        }

        isCustomized(id) {
            const ov = this.getOverride(id);
            return !!(ov && Object.keys(ov).length > 0);
        }

        getCustomizedCount() {
            return Object.keys(this.config.overrides || {}).length;
        }

        getDefaultStartRound(spec) {
            if (!spec) return 1;
            const base = this.getBaseSpec(spec.id);
            if (spec.isBoss) return (base && base.bossRound) || spec.bossRound || 5;
            return (base && base.unlockRound) || spec.unlockRound || 1;
        }

        getStartRound(specOrId) {
            const id = typeof specOrId === 'string' ? specOrId : (specOrId && specOrId.id);
            const ov = this.getOverride(id);
            if (ov && ov.startRound != null && Number.isFinite(Number(ov.startRound))) {
                return Math.max(1, Math.floor(Number(ov.startRound)));
            }
            return null; // null = use mode's default progression
        }

        persist() {
            writeStorage({
                version: 1,
                active: this.config,
                presets: this.presets
            });
            this.applyToZombiesData();
            if (BO.Events && BO.Events.emit) {
                BO.Events.emit('zombies:customUpdated', this.config);
            }
        }

        applyToZombiesData() {
            snapshotDefaults();
            const ZD = BO.ZombiesData;
            if (!ZD) return;
            const all = getAllSpecs();
            for (let i = 0; i < all.length; i++) {
                const s = all[i];
                const base = BASE_SPECS[s.id];
                if (!base) continue;
                const ov = this.config.overrides[s.id] || {};

                s.hp = ov.hp != null ? Math.max(1, Number(ov.hp)) : base.hp;
                s.speed = ov.speed != null ? Math.max(0.2, Number(ov.speed)) : base.speed;
                s.attack = ov.attack != null ? Math.max(0, Number(ov.attack)) : base.attack;
                s.defense = ov.defense != null ? Math.max(0, Math.min(0.95, Number(ov.defense))) : base.defense;
                s.movementHabit = ov.movementHabit || base.movementHabit;
                s.attackType = ATTACK_TYPES.includes(ov.attackType) ? ov.attackType : base.attackType;
                const bonus = Array.isArray(ov.bonusAttacks) ? ov.bonusAttacks : base.bonusAttacks;
                s.bonusAttacks = [...new Set(bonus.filter((id) => Object.hasOwn(BO.ZombieBehaviors.attacks, id)))].slice(0, 2);
                s.splitCount = ov.splitCount != null ? Math.max(0, Math.min(6, Math.floor(Number(ov.splitCount)))) : base.splitCount;
                s.jumpChance = ov.jumpChance != null ? Math.max(0, Math.min(1, Number(ov.jumpChance))) : base.jumpChance;
                s.isMagical = ov.isMagical != null ? !!ov.isMagical : base.isMagical;

                if (!s.drops) s.drops = deepClone(base.drops);
                s.drops.points = ov.points != null ? Math.max(0, Math.floor(Number(ov.points))) : (base.drops ? base.drops.points : 60);

                const res = Object.assign({}, base.resistances);
                if (ov.resistances && typeof ov.resistances === 'object') {
                    for (const rk of ['bullet', 'explosive', 'fire', 'headshot', 'melee']) {
                        if (ov.resistances[rk] != null && Number.isFinite(Number(ov.resistances[rk]))) {
                            res[rk] = Math.max(0, Math.min(10, Number(ov.resistances[rk])));
                        }
                    }
                }
                s.resistances = res;

                if (s.bodySpec) {
                    const mult = ov.scale != null ? Math.max(0.35, Math.min(3.5, Number(ov.scale))) : 1.0;
                    s.bodySpec.scale = [
                        Math.round(base.scale[0] * mult * 100) / 100,
                        Math.round(base.scale[1] * mult * 100) / 100,
                        Math.round(base.scale[2] * mult * 100) / 100
                    ];
                }

                if (ov.startRound != null && Number.isFinite(Number(ov.startRound))) {
                    const r = Math.max(1, Math.floor(Number(ov.startRound)));
                    if (s.isBoss) s.bossRound = r;
                    else s.unlockRound = r;
                } else {
                    if (s.isBoss) s.bossRound = base.bossRound;
                    else s.unlockRound = base.unlockRound;
                }
            }
        }

        /* ---------------- Mutation helpers ---------------- */

        setDisabledEnemies(ids) {
            this.config.disabledEnemies = Array.from(new Set((ids || []).filter((x) => typeof x === 'string')));
            this.persist();
        }

        setEnemyEnabled(id, enabled) {
            const set = new Set(this.config.disabledEnemies || []);
            if (enabled) set.delete(id);
            else set.add(id);
            this.config.disabledEnemies = Array.from(set);
            this.persist();
        }

        isEnemyEnabled(id, externalDisabledSet) {
            if (externalDisabledSet) return !externalDisabledSet.has(id);
            return !(this.config.disabledEnemies || []).includes(id);
        }

        setCategoryChance(catId, pct) {
            const v = Math.max(0, Math.min(100, Number(pct) || 0));
            this.config.categoryChances[catId] = Math.round(v * 10) / 10;
            this.config.useCustomCategoryChances = true;
            this.persist();
        }

        normalizeCategoryChances() {
            const ch = this.config.categoryChances;
            const total = CATEGORIES.reduce((acc, c) => acc + (Number(ch[c.id]) || 0), 0);
            if (total <= 0) {
                this.resetCategoryChances();
                return;
            }
            let running = 0;
            CATEGORIES.forEach((c, idx) => {
                if (idx === CATEGORIES.length - 1) {
                    ch[c.id] = Math.max(0, Math.round((100 - running) * 10) / 10);
                } else {
                    const val = Math.round(((Number(ch[c.id]) || 0) / total) * 1000) / 10;
                    ch[c.id] = val;
                    running += val;
                }
            });
            this.config.useCustomCategoryChances = true;
            this.persist();
        }

        resetCategoryChances() {
            this.config.categoryChances = Object.assign({}, DEFAULT_CATEGORY_CHANCES);
            this.config.useCustomCategoryChances = false;
            this.persist();
        }

        setEnemyOverride(id, patch) {
            const base = this.getBaseSpec(id);
            if (!base) return;
            const cur = deepClone(this.config.overrides[id] || {});
            for (const k of Object.keys(patch)) {
                const val = patch[k];
                if (k === 'resistances' && val && typeof val === 'object') {
                    const res = Object.assign({}, cur.resistances || {});
                    for (const rk of Object.keys(val)) {
                        const rv = val[rk];
                        if (rv === null || rv === '' || !Number.isFinite(Number(rv))) {
                            delete res[rk];
                        } else {
                            const num = Math.max(0, Math.min(10, Number(rv)));
                            if (Math.abs(num - (base.resistances[rk] ?? 1)) < 0.001) delete res[rk];
                            else res[rk] = Math.round(num * 100) / 100;
                        }
                    }
                    if (Object.keys(res).length > 0) cur.resistances = res;
                    else delete cur.resistances;
                    continue;
                }
                if (val === null || val === '' || val === undefined) {
                    delete cur[k];
                } else {
                    cur[k] = val;
                }
            }
            // Strip fields that match base defaults so overrides stay minimal
            if (cur.hp != null && Number(cur.hp) === base.hp) delete cur.hp;
            if (cur.speed != null && Math.abs(Number(cur.speed) - base.speed) < 0.001) delete cur.speed;
            if (cur.attack != null && Number(cur.attack) === base.attack) delete cur.attack;
            if (cur.defense != null && Math.abs(Number(cur.defense) - base.defense) < 0.001) delete cur.defense;
            if (cur.points != null && Number(cur.points) === (base.drops ? base.drops.points : 60)) delete cur.points;
            if (cur.scale != null && Math.abs(Number(cur.scale) - 1.0) < 0.001) delete cur.scale;
            if (cur.splitCount != null && Number(cur.splitCount) === base.splitCount) delete cur.splitCount;
            if (cur.jumpChance != null && Math.abs(Number(cur.jumpChance) - base.jumpChance) < 0.001) delete cur.jumpChance;
            if (cur.isMagical != null && Boolean(cur.isMagical) === base.isMagical) delete cur.isMagical;
            if (cur.movementHabit != null && cur.movementHabit === base.movementHabit) delete cur.movementHabit;
            if (cur.attackType != null && cur.attackType === base.attackType) delete cur.attackType;

            if (Object.keys(cur).length > 0) this.config.overrides[id] = cur;
            else delete this.config.overrides[id];
            this.persist();
        }

        resetEnemy(id) {
            if (this.config.overrides && this.config.overrides[id]) {
                delete this.config.overrides[id];
                this.persist();
            }
        }

        resetAll() {
            this.config = makeDefaultConfig();
            this.persist();
        }

        /* ---------------- Saved Setups / Presets ---------------- */

        listPresets() {
            return Object.keys(this.presets)
                .sort((a, b) => a.localeCompare(b))
                .map((name) => {
                    const p = this.presets[name];
                    return {
                        name,
                        savedAt: p.savedAt,
                        modifiedCount: Object.keys((p.config && p.config.overrides) || {}).length,
                        disabledCount: ((p.config && p.config.disabledEnemies) || []).length
                    };
                });
        }

        savePreset(name) {
            const clean = String(name || '').trim().slice(0, 48);
            if (!clean) return false;
            this.config.activePresetName = clean;
            this.presets[clean] = {
                savedAt: Date.now(),
                config: deepClone(this.config)
            };
            this.persist();
            return true;
        }

        loadPreset(name) {
            if (name === '__default__') {
                this.resetAll();
                return true;
            }
            const entry = this.presets[name];
            if (!entry || !entry.config) return false;
            this.config = sanitizeConfig(entry.config);
            this.config.activePresetName = name;
            this.persist();
            return true;
        }

        deletePreset(name) {
            if (!this.presets[name]) return false;
            delete this.presets[name];
            if (this.config.activePresetName === name) {
                this.config.activePresetName = 'Custom';
            }
            this.persist();
            return true;
        }

        exportJSON() {
            return JSON.stringify(this.config, null, 2);
        }

        importJSON(jsonStr, presetName) {
            const parsed = JSON.parse(jsonStr);
            if (!parsed || typeof parsed !== 'object') throw new Error('Invalid zombie config JSON');
            this.config = sanitizeConfig(parsed);
            if (presetName && presetName.trim()) {
                this.savePreset(presetName.trim());
            } else {
                this.persist();
            }
            return true;
        }

        /* ---------------- Spawn Probability & Picking Engine ---------------- */

        /**
         * Computes effective spawn % within a single category for a list of eligible specs.
         * Specs with explicit `spawnChance` (0..100) get their share; specs with `null` (Auto)
         * split the remaining % (100 - sumExplicit) equally.
         * If sumExplicit > 100, explicit shares are normalized proportionally to 100%.
         */
        computeCategoryShares(specs) {
            const result = Object.create(null);
            if (!specs || specs.length === 0) return result;

            let explicitSum = 0;
            const autoList = [];
            const explicitList = [];

            for (const s of specs) {
                const ov = this.getOverride(s.id);
                if (ov && ov.spawnChance != null && Number.isFinite(Number(ov.spawnChance))) {
                    const pct = Math.max(0, Math.min(100, Number(ov.spawnChance)));
                    explicitList.push({ s, pct });
                    explicitSum += pct;
                } else {
                    autoList.push(s);
                }
            }

            if (explicitSum > 100) {
                for (const item of explicitList) {
                    result[item.s.id] = (item.pct / explicitSum) * 100;
                }
                for (const s of autoList) {
                    result[s.id] = 0;
                }
            } else {
                const rem = Math.max(0, 100 - explicitSum);
                const autoShare = autoList.length > 0 ? (rem / autoList.length) : 0;
                if (autoList.length === 0 && explicitSum > 0) {
                    // Normalize explicit items to 100% of the category if no auto items exist
                    for (const item of explicitList) {
                        result[item.s.id] = (item.pct / explicitSum) * 100;
                    }
                } else {
                    for (const item of explicitList) {
                        result[item.s.id] = item.pct;
                    }
                    for (const s of autoList) {
                        result[s.id] = autoShare;
                    }
                }
            }
            return result;
        }

        /**
         * Computes effective category % and per-enemy overall % for UI display
         * across all enabled enemies (or a filtered active pool).
         */
        computeEffectiveOdds(disabledSet) {
            const dis = disabledSet || new Set(this.config.disabledEnemies || []);
            const all = getAllSpecs();
            const byCat = { easy: [], normal: [], hard: [], boss: [], super_boss: [] };
            for (const s of all) {
                if (!dis.has(s.id)) byCat[getCategory(s)].push(s);
            }

            const catWeights = {};
            let totalCatW = 0;
            for (const c of CATEGORIES) {
                const w = byCat[c.id].length > 0 ? Math.max(0, Number(this.config.categoryChances[c.id]) || 0) : 0;
                catWeights[c.id] = w;
                totalCatW += w;
            }

            const catEffective = {};
            const enemyOdds = Object.create(null);

            for (const c of CATEGORIES) {
                const effCatPct = totalCatW > 0 ? (catWeights[c.id] / totalCatW) * 100 : 0;
                catEffective[c.id] = effCatPct;
                const shares = this.computeCategoryShares(byCat[c.id]);
                for (const s of byCat[c.id]) {
                    const inCat = shares[s.id] || 0;
                    enemyOdds[s.id] = {
                        inCatPct: inCat,
                        overallPct: (effCatPct * inCat) / 100
                    };
                }
            }
            return { catEffective, enemyOdds };
        }

        /**
         * Determines whether a spec is unlocked at `round` (or `day` in Survival).
         * If the user set an explicit `startRound`, that takes absolute priority.
         */
        isSpecUnlocked(spec, round, defaultUnlockedIds, allUnlocked) {
            const customStart = this.getStartRound(spec.id);
            if (customStart != null) {
                return (round || 1) >= customStart;
            }
            if (allUnlocked) return true;
            if (defaultUnlockedIds) return defaultUnlockedIds.has(spec.id);
            return (round || 1) >= this.getDefaultStartRound(spec);
        }

        /**
         * Unified weighted enemy picker for Zombies Mode and Tower Defense Mode.
         */
        pickEnemy(opts) {
            const round = Math.max(1, Number(opts.round) || 1);
            const disabledSet = opts.disabledSet || new Set(this.config.disabledEnemies || []);
            const allUnlocked = !!opts.allUnlocked;
            const defaultUnlockedIds = new Set();
            (opts.unlockedEnemies || []).forEach((e) => { if (e && e.id) defaultUnlockedIds.add(e.id); });
            (opts.unlockedBosses || []).forEach((b) => { if (b && b.id) defaultUnlockedIds.add(b.id); });

            const all = getAllSpecs();
            const byCat = { easy: [], normal: [], hard: [], boss: [], super_boss: [] };
            for (const s of all) {
                if (disabledSet.has(s.id)) continue;
                if (!this.isSpecUnlocked(s, round, defaultUnlockedIds, allUnlocked)) continue;
                byCat[getCategory(s)].push(s);
            }

            // Pick category using custom categoryChances or default boss scaling
            const ch = this.config.categoryChances;
            const useCustom = !!this.config.useCustomCategoryChances;
            const buckets = [];

            if (useCustom) {
                for (const c of CATEGORIES) {
                    const list = byCat[c.id];
                    const w = Number(ch[c.id]) || 0;
                    if (list.length > 0 && w > 0) buckets.push({ id: c.id, list, w });
                }
            } else {
                // Default mode behavior: bossChancePct for boss+super_boss, 50:25:15 for easy:normal:hard
                const bossPool = byCat.boss.concat(byCat.super_boss);
                const clampedBoss = Math.max(0, Math.min(100, Number(opts.bossChancePct ?? 2.0)));
                if (bossPool.length > 0 && clampedBoss > 0 && Math.random() * 100 < clampedBoss) {
                    // Split boss vs super_boss by default 8:2 ratio if both present
                    if (byCat.boss.length > 0 && byCat.super_boss.length > 0) {
                        const pickSuper = Math.random() < (ch.super_boss / Math.max(0.1, ch.boss + ch.super_boss));
                        return this._pickWeightedInList(pickSuper ? byCat.super_boss : byCat.boss);
                    }
                    return this._pickWeightedInList(bossPool);
                }
                if (byCat.easy.length > 0) buckets.push({ id: 'easy', list: byCat.easy, w: ch.easy || 50 });
                if (byCat.normal.length > 0) buckets.push({ id: 'normal', list: byCat.normal, w: ch.normal || 25 });
                if (byCat.hard.length > 0) buckets.push({ id: 'hard', list: byCat.hard, w: ch.hard || 15 });
                if (buckets.length === 0 && bossPool.length > 0) {
                    return this._pickWeightedInList(bossPool);
                }
            }

            if (buckets.length === 0) {
                // Fallback: any enabled unlocked enemy, or shambler
                const anyEligible = byCat.easy.concat(byCat.normal, byCat.hard, byCat.boss, byCat.super_boss);
                if (anyEligible.length > 0) return this._pickWeightedInList(anyEligible);
                return (BO.ZombiesData && BO.ZombiesData.ZOMBIE_TYPES[0]) || null;
            }

            const totalW = buckets.reduce((a, b) => a + b.w, 0);
            let roll = Math.random() * totalW;
            for (const b of buckets) {
                roll -= b.w;
                if (roll <= 0) return this._pickWeightedInList(b.list);
            }
            return this._pickWeightedInList(buckets[buckets.length - 1].list);
        }

        /**
         * Unified weighted enemy picker for Survival Mode (takes candidate list from campaign.getPool,
         * plus any bosses/enemies whose custom startRound <= day, then rolls by category % and enemy %).
         */
        pickFromSurvivalPool(candidates, day, disabledSet) {
            const dis = disabledSet || new Set(this.config.disabledEnemies || []);
            const seen = new Set();
            const byCat = { easy: [], normal: [], hard: [], boss: [], super_boss: [] };

            const addSpec = (s) => {
                if (!s || !s.id || seen.has(s.id) || dis.has(s.id)) return;
                const customStart = this.getStartRound(s.id);
                if (customStart != null && (day || 1) < customStart) return;
                seen.add(s.id);
                byCat[getCategory(s)].push(s);
            };

            (candidates || []).forEach(addSpec);

            // Also include any zombie/boss whose custom startRound <= day (or enabled bosses if custom category chances include them)
            const all = getAllSpecs();
            for (const s of all) {
                const customStart = this.getStartRound(s.id);
                if (customStart != null && (day || 1) >= customStart) {
                    addSpec(s);
                } else if (this.config.useCustomCategoryChances && (s.isBoss || s.isSuperBoss) && (Number(this.config.categoryChances[getCategory(s)]) || 0) > 0) {
                    if ((day || 1) >= this.getDefaultStartRound(s)) addSpec(s);
                }
            }

            const ch = this.config.categoryChances;
            const buckets = [];
            for (const c of CATEGORIES) {
                const list = byCat[c.id];
                const w = Number(ch[c.id]) || 0;
                if (list.length > 0 && w > 0) buckets.push({ id: c.id, list, w });
            }

            if (buckets.length === 0) {
                const any = byCat.easy.concat(byCat.normal, byCat.hard, byCat.boss, byCat.super_boss);
                if (any.length > 0) return this._pickWeightedInList(any);
                return (candidates && candidates[0]) || (BO.ZombiesData && BO.ZombiesData.ZOMBIE_TYPES[0]) || null;
            }

            const totalW = buckets.reduce((a, b) => a + b.w, 0);
            let roll = Math.random() * totalW;
            for (const b of buckets) {
                roll -= b.w;
                if (roll <= 0) return this._pickWeightedInList(b.list);
            }
            return this._pickWeightedInList(buckets[buckets.length - 1].list);
        }

        _pickWeightedInList(list) {
            if (!list || list.length === 0) return null;
            if (list.length === 1) return list[0];
            const shares = this.computeCategoryShares(list);
            let total = 0;
            for (const s of list) total += Math.max(0, shares[s.id] || 0);
            if (total <= 0) return list[Math.floor(Math.random() * list.length)];
            let roll = Math.random() * total;
            for (const s of list) {
                roll -= Math.max(0, shares[s.id] || 0);
                if (roll <= 0) return s;
            }
            return list[list.length - 1];
        }
    }

    BO.ZombieCustomizer = new ZombieCustomizer();
})(window);
