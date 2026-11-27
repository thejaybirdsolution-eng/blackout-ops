/* ============================================================================
   BLACKOUT OPS — The Archive (Persistent Survival Meta-Progression)
   · Zone Tiers 1–10 with escalating threat, radiation, loot, and rewards
   · Deterministic seeded worlds (BO.ZoneSeed) + Daily Expedition Challenge
   · 3-branch Archive Mastery Tree (12 nodes) with full Respec
   · 8 Deployment Kits (including ending-unlocked kits)
   · Persistent Blueprint Vault & Interactive Safe-House Stash Packing
   · Expedition Chronicle (past run history & records)
============================================================================ */
(function (BO) {
    'use strict';

    const data = BO.SurvivalCampaignData;
    const careerKey = 'boSurvivalCareer/v1';
    const checkpointKey = 'boSurvivalCheckpoint/v1';

    /* ------------------------------------------------------------ Seeded PRNG */
    const CALLSIGNS = ['KESTREL', 'ASHFALL', 'LANTERN', 'PINEBREAK', 'VESPER', 'CINDER', 'VALLEY', 'RELIC', 'HOLLOW', 'SPILLWAY', 'FROSTLINE', 'BLACKPINE'];

    function hashString(str) {
        let h = 2166136261 >>> 0;
        const s = String(str || 'ZONE-001');
        for (let i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = Math.imul(h, 16777619) >>> 0;
        }
        return h >>> 0;
    }

    function mulberry32(seed) {
        let a = seed >>> 0;
        return function () {
            a = (a + 0x6D2B79F5) >>> 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function normalizeSeed(raw) {
        const clean = String(raw || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20);
        if (clean) return clean;
        const word = CALLSIGNS[Math.floor(Math.random() * CALLSIGNS.length)];
        const num = String(100 + Math.floor(Math.random() * 900));
        return word + '-' + num;
    }

    function todayKey() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function dailyConfig() {
        const key = todayKey();
        const seed = 'DAILY-' + key;
        const R = mulberry32(hashString(seed + ':cfg'));
        const diffs = ['standard', 'hard', 'veteran'];
        const hours = [6, 8, 12, 18, 22];
        const modPool = ['longDusk', 'freezingNights', 'irradiated', 'infectBite', 'brutalNights', 'headshotsOnly', 'fists', 'hungry'];
        const picked = [];
        while (picked.length < 2) {
            const m = modPool[Math.floor(R() * modPool.length)];
            if (!picked.includes(m) && BO.SurvivalRules?.modifiers?.[m]) picked.push(m);
        }
        return {
            date: key,
            seed,
            difficulty: diffs[Math.floor(R() * diffs.length)],
            startHour: hours[Math.floor(R() * hours.length)],
            modifiers: picked,
            bonusCommendations: 3
        };
    }

    const ZoneSeed = {
        hash: hashString,
        normalize: normalizeSeed,
        todayKey,
        daily: dailyConfig,
        rng(seedStr, salt = '') {
            return mulberry32(hashString(String(seedStr || 'ZONE-001') + ':' + salt));
        },
        randomSeed() {
            return normalizeSeed('');
        }
    };

    /* ------------------------------------------------------------ Zone Tiers 1–10 */
    const ZONE_TIERS = [
        { tier: 1, name: 'Quarantine Perimeter', hp: 1.00, dmg: 1.00, cap: 1.00, rad: 1.00, loot: 1.00, xp: 1.00, bonusComm: 0, desc: 'Baseline Exclusion Zone conditions. Complete any ending to unlock Tier 2.' },
        { tier: 2, name: 'Contested Valley', hp: 1.15, dmg: 1.12, cap: 1.10, rad: 1.12, loot: 1.12, xp: 1.15, bonusComm: 1, desc: 'Thicker infected packs, slightly hotter radiation pockets, and +12% loot yield.' },
        { tier: 3, name: 'Redline Protocol', hp: 1.32, dmg: 1.25, cap: 1.20, rad: 1.25, loot: 1.22, xp: 1.30, bonusComm: 2, desc: 'Aggressive patrols and heavier horde waves. +2 bonus commendations on victory.' },
        { tier: 4, name: 'Ashfall Escalation', hp: 1.50, dmg: 1.40, cap: 1.30, rad: 1.38, loot: 1.32, xp: 1.45, bonusComm: 3, desc: 'Harsh frontier pressure and stronger guardians. +3 bonus commendations.' },
        { tier: 5, name: 'Black Pine Surge', hp: 1.70, dmg: 1.55, cap: 1.42, rad: 1.52, loot: 1.45, xp: 1.65, bonusComm: 4, desc: 'High-density brood activity across every region. +45% loot & +4 commendations.' },
        { tier: 6, name: 'Crater Overpressure', hp: 1.92, dmg: 1.72, cap: 1.55, rad: 1.68, loot: 1.58, xp: 1.85, bonusComm: 5, desc: 'Severe Lantern radiation and relentless night raids. +5 commendations.' },
        { tier: 7, name: 'Warden\'s Dominion', hp: 2.18, dmg: 1.90, cap: 1.68, rad: 1.85, loot: 1.72, xp: 2.10, bonusComm: 6, desc: 'Elite infected dominate the frontier; every breach counts. +6 commendations.' },
        { tier: 8, name: 'Extinction Front', hp: 2.46, dmg: 2.10, cap: 1.82, rad: 2.05, loot: 1.86, xp: 2.35, bonusComm: 7, desc: 'Extreme lethality and fast horde escalation. +7 commendations.' },
        { tier: 9, name: 'Signal Collapse', hp: 2.78, dmg: 2.32, cap: 1.96, rad: 2.25, loot: 2.00, xp: 2.65, bonusComm: 9, desc: 'Double loot density in a deeply hostile Zone. +9 commendations.' },
        { tier: 10, name: 'Blackout Apex', hp: 3.15, dmg: 2.55, cap: 2.10, rad: 2.50, loot: 2.20, xp: 3.00, bonusComm: 12, desc: 'The ultimate Exclusion Zone trial. Triple XP, +120% loot, +12 commendations.' }
    ];

    function tierSpec(n) {
        const idx = Math.max(1, Math.min(ZONE_TIERS.length, Math.floor(Number(n) || 1))) - 1;
        return ZONE_TIERS[idx];
    }

    /* ------------------------------------------------------------ Mastery Tree (3 branches, 12 nodes) */
    const MASTERY_BRANCHES = {
        logistics: { name: 'Logistics & Fieldcraft', color: '#8fe3c8' },
        combat: { name: 'Combat & Endurance', color: '#f2b45a' },
        anomaly: { name: 'Anomaly & Engineering', color: '#c59bff' }
    };

    const MASTERY = {
        // Logistics & Fieldcraft
        logistics: { branch: 'logistics', name: 'Field Logistics', max: 3, cost: 2, desc: '+12% carry weight & +2 pack slots per rank.' },
        scavenger: { branch: 'logistics', name: 'Zone Scavenger', max: 3, cost: 2, desc: '+15% gathering yield & 15% faster container searches per rank.' },
        navigator: { branch: 'logistics', name: 'Valley Navigator', max: 2, cost: 3, desc: 'Rank 1: +15% handcar/bike speed. Rank 2: halves fast-travel time.' },
        archivist: { branch: 'logistics', name: 'Salvage Archivist', max: 3, cost: 2, desc: '+10% extraction stash share & +10 max stash stack cap per rank.' },
        // Combat & Endurance
        conditioning: { branch: 'combat', name: 'Combat Conditioning', max: 3, cost: 2, desc: '+15 starting max HP & faster stamina recovery per rank.' },
        armorer: { branch: 'combat', name: 'Ballistic Armorer', max: 3, cost: 2, desc: '+25 starting armor & +1 spare plate per rank.' },
        deadeye: { branch: 'combat', name: 'Deadeye Reflex', max: 3, cost: 2, desc: '-15% weapon wear/jam risk & +8% reload speed per rank.' },
        trauma: { branch: 'combat', name: 'Field Trauma', max: 3, cost: 2, desc: '+15% bandage/medkit healing & -18% bleed duration per rank.' },
        // Anomaly & Engineering
        fortifier: { branch: 'anomaly', name: 'Fortification Savant', max: 3, cost: 2, desc: '+20% built structure HP & stronger perimeter defenses per rank.' },
        ghost: { branch: 'anomaly', name: 'Silent Footwork', max: 3, cost: 2, desc: '-12% footstep & container search noise radius per rank.' },
        resonance: { branch: 'anomaly', name: 'Lantern Resonance', max: 3, cost: 3, desc: '-15% radiation gain & -12% Lantern pulse damage per rank.' },
        blueprint_cache: { branch: 'anomaly', name: 'Blueprint Archivist', max: 2, cost: 3, desc: 'Start runs with +1/+2 Tech Points and 25% cheaper Blueprint forging.' }
    };

    /* ------------------------------------------------------------ 8 Deployment Kits */
    const KITS = {
        standard: { name: 'Standard Issue', level: 1, desc: 'Balanced start: M1911 (6 loaded), bandage, ration, cloth & scrap.', items: {} },
        pathfinder: { name: 'Pathfinder', level: 2, desc: 'Traversal kit: Trail Bicycle unlocked at start, +2 fuel, +1 torch, +2 cord.', items: { fuel: 2, torch: 1, cord: 2 }, vehicle: 'bike' },
        sapper: { name: 'Field Sapper', level: 4, desc: 'Engineering kit: +6 timber, +4 stone, +4 salvage, +2 wire for rapid fortifying.', items: { timber: 6, stone: 4, scrap: 4, wire: 2 } },
        alchemist: { name: 'Zone Alchemist', level: 6, desc: 'Medical & rad kit: +2 bandages, +1 respirator filter, +2 filtered water, +1 resonance crystal.', items: { bandage: 2, filter: 1, freshWater: 2, aetherShard: 1 } },
        vanguard: { name: 'Frontier Vanguard', level: 9, desc: 'Heavy breach kit: +2 iron bars, +2 fuel, +4 salvage, +1 trauma kit, +24 9mm rounds.', items: { ingot: 2, fuel: 2, scrap: 4, medkits: 1, ammo9: 24 } },
        keeper: { name: 'Lantern Keeper', level: 1, unlock: 'seize', unlockLabel: 'SEIZE THE LANTERN', desc: 'Earned by seizing the Lantern: +2 filters, +1 trauma kit, +30 5.56 rounds, +1 thermals. Brood is slower to notice you on day 1.', items: { filter: 2, medkits: 1, ammo556: 30, thermals: 1 } },
        signal_ghost: { name: 'Signal Ghost', level: 1, unlock: 'seal', unlockLabel: 'SEAL THE LANTERN', desc: 'Earned by sealing the Lantern: +1 radio parts, +2 batteries, +20 9mm, +2 bandages. Lower noise footprint.', items: { radioParts: 1, battery: 2, ammo9: 20, bandage: 2 } },
        archivist_kit: { name: 'Zone Archivist', level: 1, unlock: 'extract', unlockLabel: 'EXTRACT THE DATA', desc: 'Earned by extracting the research: +1 weapon repair kit, +2 circuits, +3 salvage, +2 rations, and +1 starting Tech Point.', items: { gunkit: 1, circuit: 2, scrap: 3, rations: 2 }, techPoints: 1 }
    };

    const BANKABLE = ['scrap', 'ingot', 'wire', 'quartz', 'aetherShard', 'coil', 'filter', 'medkits', 'gunkit', 'ammo9', 'ammo556', 'ammo762', 'ammo12'];

    function read(key) {
        try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; }
    }

    function write(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (_) { return false; }
    }

    function options(input = {}) {
        const d = data.defaults;
        const ids = BO.Zone.bestiary().map((enemy) => enemy.id);
        const tier = Math.max(1, Math.min(ZONE_TIERS.length, Math.floor(Number(input.zoneTier) || 1)));
        const seed = input.seed ? normalizeSeed(input.seed) : '';
        return {
            difficulty: Object.hasOwn(BO.SurvivalRules.difficulties, input.difficulty) ? input.difficulty : d.difficulty,
            gameType: Object.hasOwn(BO.SurvivalRules.modes, input.gameType) ? input.gameType : 'expedition',
            modifiers: Array.isArray(input.modifiers) ? [...new Set(input.modifiers.filter((id) => Object.hasOwn(BO.SurvivalRules.modifiers, id) || !!BO.ReactiveModifiers.get(id)))] : [],
            pool: Object.hasOwn(data.pools, input.pool) ? input.pool : d.pool,
            dayLength: [180, 360, 720].includes(Number(input.dayLength)) ? Number(input.dayLength) : d.dayLength,
            startHour: [0, 6, 8, 12, 18, 22].includes(Number(input.startHour)) ? Number(input.startHour) : d.startHour,
            encounterRate: [0.7, 1, 1.5].includes(Number(input.encounterRate)) ? Number(input.encounterRate) : d.encounterRate,
            survivalNeeds: input.survivalNeeds ?? d.survivalNeeds,
            weather: input.weather ?? d.weather,
            autosave: input.autosave ?? d.autosave,
            zoneTier: tier,
            seed,
            daily: !!input.daily,
            disabledEnemies: Array.isArray(input.disabledEnemies)
                ? ids.filter((id) => input.disabledEnemies.includes(id)).slice(0, ids.length - 1)
                : []
        };
    }

    class SurvivalCareer {
        constructor() {
            const saved = read(careerKey);
            this.profile = {
                xp: Number(saved?.xp) || 0,
                stats: { ...(saved?.stats || {}) },
                trips: { ...(saved?.trips || {}) },
                options: options(saved?.options),
                blueprints: Array.isArray(saved?.blueprints) ? [...new Set(saved.blueprints)] : [],
                commendations: Number(saved?.commendations) || 0,
                mastery: { ...(saved?.mastery || {}) },
                stash: { ...(saved?.stash || {}) },
                packedStash: { ...(saved?.packedStash || {}) },
                kit: Object.hasOwn(KITS, saved?.kit) ? saved.kit : 'standard',
                unlockedKits: Array.isArray(saved?.unlockedKits) ? [...new Set(saved.unlockedKits)] : [],
                endings: { ...(saved?.endings || {}) },
                maxTier: Math.max(1, Math.min(ZONE_TIERS.length, Number(saved?.maxTier) || 1)),
                history: Array.isArray(saved?.history) ? saved.history.slice(0, 30) : [],
                dailyCompleted: saved?.dailyCompleted || '',
                intel: Array.isArray(saved?.intel) ? [...new Set(saved.intel)] : [],
                feats: { ...(saved?.feats || {}) }
            };
            // Clamp selected zoneTier to maxTier
            if (this.profile.options.zoneTier > this.profile.maxTier) {
                this.profile.options.zoneTier = this.profile.maxTier;
            }
            this.checkpoint = read(checkpointKey);
        }

        get level() {
            return Math.min(50, 1 + Math.floor(Math.sqrt(this.profile.xp / 110)));
        }

        get nextXP() {
            return this.level >= 50 ? this.profile.xp : this.level ** 2 * 110;
        }

        get rank() {
            return data.ranks.filter(([level]) => this.level >= level).at(-1)[1];
        }

        get maxTier() {
            return Math.max(1, Math.min(ZONE_TIERS.length, Number(this.profile.maxTier) || 1));
        }

        masteryRank(id) {
            return Math.min(MASTERY[id]?.max || 0, Number(this.profile.mastery[id]) || 0);
        }

        spentCommendations() {
            let total = 0;
            for (const [id, spec] of Object.entries(MASTERY)) {
                total += this.masteryRank(id) * spec.cost;
            }
            return total;
        }

        buyMastery(id) {
            const spec = MASTERY[id];
            if (!spec) return false;
            const rank = this.masteryRank(id);
            if (rank >= spec.max || this.profile.commendations < spec.cost) return false;
            this.profile.commendations -= spec.cost;
            this.profile.mastery[id] = rank + 1;
            write(careerKey, this.profile);
            return true;
        }

        respecMastery() {
            const refund = this.spentCommendations();
            if (refund <= 0) return 0;
            this.profile.commendations += refund;
            this.profile.mastery = {};
            write(careerKey, this.profile);
            return refund;
        }

        setKit(id) {
            const kit = KITS[id];
            if (!kit || this.level < kit.level || !this.kitUnlocked(id)) return false;
            this.profile.kit = id;
            write(careerKey, this.profile);
            return true;
        }

        unlockBlueprint(id) {
            if (!id || this.profile.blueprints.includes(id)) return false;
            this.profile.blueprints.push(id);
            write(careerKey, this.profile);
            return true;
        }

        hasBlueprint(id) {
            return this.profile.blueprints.includes(id);
        }

        awardCommendations(n = 1) {
            if (!n || n <= 0) return;
            this.profile.commendations += Math.round(n);
            write(careerKey, this.profile);
        }

        kitUnlocked(id) {
            const kit = KITS[id];
            if (!kit) return false;
            if (!kit.unlock) return true;
            return (this.profile.unlockedKits || []).includes(id) || (this.profile.endings?.[kit.unlock] || 0) > 0;
        }

        unlockKit(id) {
            this.profile.unlockedKits = this.profile.unlockedKits || [];
            if (!this.profile.unlockedKits.includes(id)) this.profile.unlockedKits.push(id);
            write(careerKey, this.profile);
        }

        /** Endings reached across all runs; the Lantern remembers. */
        recordEnding(id, tier = 1) {
            this.profile.endings = this.profile.endings || {};
            this.profile.endings[id] = (this.profile.endings[id] || 0) + 1;
            if (id === 'seize') this.unlockKit('keeper');
            if (id === 'seal') this.unlockKit('signal_ghost');
            if (id === 'extract') this.unlockKit('archivist_kit');
            // Completing an ending at your highest unlocked tier unlocks the next Zone Tier!
            if (tier >= this.maxTier && this.maxTier < ZONE_TIERS.length) {
                this.profile.maxTier = this.maxTier + 1;
            }
            write(careerKey, this.profile);
        }

        /** Log a completed or fallen expedition into the Archive Chronicle. */
        recordRun(entry) {
            this.profile.history = this.profile.history || [];
            const rec = {
                id: entry.id || Date.now().toString(36),
                date: new Date().toISOString().slice(0, 10),
                victory: !!entry.victory,
                ending: entry.ending || null,
                tier: entry.tier || 1,
                seed: entry.seed || '',
                daily: !!entry.daily,
                difficulty: entry.difficulty || 'standard',
                gameType: entry.gameType || 'expedition',
                kit: entry.kit || 'standard',
                days: entry.days || 1,
                kills: entry.kills || 0,
                regions: entry.regions || 1,
                hordes: entry.hordes || 0,
                bosses: entry.bosses || 0,
                deaths: entry.deaths || 0,
                time: Math.floor(entry.time || 0),
                commendations: entry.commendations || 0
            };
            this.profile.history.unshift(rec);
            if (this.profile.history.length > 30) this.profile.history.length = 30;
            if (rec.victory && rec.daily && this.profile.dailyCompleted !== todayKey()) {
                this.profile.dailyCompleted = todayKey();
                this.profile.commendations += dailyConfig().bonusCommendations;
            }
            if (rec.victory && rec.time > 0) {
                try {
                    const prev = Number(localStorage.getItem('boSurvivalFastest')) || 0;
                    if (!prev || rec.time < prev) localStorage.setItem('boSurvivalFastest', String(rec.time));
                } catch (_) { /* ignore */ }
            }
            write(careerKey, this.profile);
            return rec;
        }

        /* ------------------------------------------------------------ Stash */
        stashCap() {
            return 25 + this.masteryRank('archivist') * 10;
        }

        bankExtraction(packItems = {}) {
            const banked = {};
            const share = 0.25 + this.masteryRank('archivist') * 0.10;
            const cap = this.stashCap();
            for (const id of BANKABLE) {
                const qty = packItems[id] || 0;
                if (qty <= 0) continue;
                const add = Math.max(1, Math.ceil(qty * share));
                const prev = this.profile.stash[id] || 0;
                const next = Math.min(cap, prev + add);
                if (next > prev) {
                    this.profile.stash[id] = next;
                    banked[id] = next - prev;
                }
            }
            write(careerKey, this.profile);
            return banked;
        }

        /** Pack or unpack items from the Archive Stash for the next deployment. */
        adjustPackedStash(id, delta) {
            const avail = this.profile.stash[id] || 0;
            if (avail <= 0 && delta > 0) return 0;
            const cur = this.profile.packedStash[id] || 0;
            const next = Math.max(0, Math.min(avail, cur + delta));
            if (next <= 0) delete this.profile.packedStash[id];
            else this.profile.packedStash[id] = next;
            write(careerKey, this.profile);
            return next;
        }

        clearPackedStash() {
            this.profile.packedStash = {};
            write(careerKey, this.profile);
        }

        /** Transfer pre-packed stash items into the player's pack at run start. */
        consumePackedStash(pack) {
            if (!pack) return {};
            const packed = this.profile.packedStash || {};
            const taken = {};
            for (const [id, want] of Object.entries(packed)) {
                const avail = Math.min(want, this.profile.stash[id] || 0);
                if (avail <= 0) continue;
                const { accepted } = pack.receive({ [id]: avail }, false);
                if (accepted[id]) {
                    this.profile.stash[id] -= accepted[id];
                    if (this.profile.stash[id] <= 0) delete this.profile.stash[id];
                    taken[id] = accepted[id];
                }
            }
            this.profile.packedStash = {};
            if (Object.keys(taken).length) write(careerKey, this.profile);
            return taken;
        }

        withdrawStash(pack) {
            if (!pack) return {};
            const taken = {};
            for (const [id, qty] of Object.entries(this.profile.stash)) {
                if (qty <= 0) continue;
                const { accepted } = pack.receive({ [id]: qty }, false);
                if (accepted[id]) {
                    this.profile.stash[id] -= accepted[id];
                    if (this.profile.stash[id] <= 0) delete this.profile.stash[id];
                    taken[id] = accepted[id];
                }
            }
            if (Object.keys(taken).length) write(careerKey, this.profile);
            return taken;
        }

        depositStash(id, qty, pack) {
            if (!BANKABLE.includes(id) || !pack || qty <= 0) return 0;
            const have = BO.SurvivalMode?.points?.[id] || 0;
            const cap = this.stashCap();
            const cur = this.profile.stash[id] || 0;
            const move = Math.min(have, qty, Math.max(0, cap - cur));
            if (move <= 0) return 0;
            BO.SurvivalMode.points[id] -= move;
            this.profile.stash[id] = cur + move;
            write(careerKey, this.profile);
            return move;
        }

        remember(value) {
            const next = options(value);
            if (next.zoneTier > this.maxTier) next.zoneTier = this.maxTier;
            this.profile.options = next;
            write(careerKey, this.profile);
            return this.profile.options;
        }

        resetCareer() {
            this.profile = {
                xp: 0,
                stats: {},
                trips: {},
                options: options({}),
                blueprints: [],
                commendations: 0,
                mastery: {},
                stash: {},
                packedStash: {},
                kit: 'standard',
                unlockedKits: [],
                endings: {},
                maxTier: 1,
                history: [],
                dailyCompleted: '',
                intel: [],
                feats: {}
            };
            this.checkpoint = null;
            write(careerKey, this.profile);
            write(checkpointKey, null);
            try { localStorage.removeItem('boSurvivalFastest'); } catch (_) { /* ignore */ }
        }

        // Career totals use the highest recorded counter for each expedition. Reopening a checkpoint cannot replay a reward.
        tick(run, key, total, xp) {
            const trips = this.profile.trips;
            if (!Object.hasOwn(trips, run)) trips[run] = {};
            const counters = trips[run];
            const previous = counters[key] || 0;
            if (!Number.isFinite(total) || total <= previous) return;
            const old = this.level;
            const count = total - previous;
            counters[key] = total;
            const modXp = (BO.SurvivalMode?.active && BO.SurvivalMode?.campaign?.deep?.modFx?.xpMult) ? BO.SurvivalMode.campaign.deep.modFx.xpMult : 1;
            const areaTier = (BO.SurvivalMode?.active && BO.SurvivalMode?.campaign?.area?.tier) ? BO.SurvivalMode.campaign.area.tier : 1;
            const tierMult = areaTier === 3 ? 1.75 : areaTier === 2 ? 1.35 : 1;
            const zTier = BO.SurvivalMode?.active ? tierSpec(BO.SurvivalMode?.campaign?.options?.zoneTier).xp : 1;
            const xpMult = ((BO.SurvivalMode?.active && BO.SurvivalMode?.campaign?.has?.('abundantTech')) ? 2 : 1) * modXp * tierMult * zTier;
            this.profile.xp += Math.round(xp * count * xpMult);
            this.profile.stats[key] = (this.profile.stats[key] || 0) + count;
            if (this.level > old) {
                this.profile.commendations += (this.level - old);
                BO.Events.emit('hud:banner', {
                    title: 'SURVIVAL LEVEL ' + this.level, sub: this.rank.toUpperCase() + ' · +' + (this.level - old) + ' COMMENDATION', color: '#a8d9bc'
                });
                if (BO.SurvivalMode?.active && BO.SurvivalMode?.campaign?.deep) {
                    BO.SurvivalMode.campaign.deep.grantTechPoints(this.level - old);
                }
            }
            write(careerKey, this.profile);
        }

        store(checkpoint) {
            if (!write(checkpointKey, checkpoint)) return false;
            this.checkpoint = checkpoint;
            return true;
        }

        discard(run) {
            if (this.checkpoint?.run === run && write(checkpointKey, null)) this.checkpoint = null;
        }
    }

    BO.ZoneSeed = ZoneSeed;
    BO.SurvivalMeta = { MASTERY, MASTERY_BRANCHES, KITS, ZONE_TIERS, tierSpec, BANKABLE };
    BO.SurvivalCampaignOptions = options;
    BO.SurvivalCareer = new SurvivalCareer();
})(window.BO);
