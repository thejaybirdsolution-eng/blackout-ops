
(function (BO) {
    'use strict';

    const data = BO.SurvivalCampaignData;
    const careerKey = 'boSurvivalCareer/v1';
    const checkpointKey = 'boSurvivalCheckpoint/v1';

    const MASTERY = {
        logistics: { name: 'Field Logistics', max: 3, cost: 2, desc: '+12% carry weight & +2 pack slots per rank.' },
        conditioning: { name: 'Combat Conditioning', max: 3, cost: 2, desc: '+15 starting max HP & faster stamina recovery per rank.' },
        scavenger: { name: 'Zone Scavenger', max: 3, cost: 2, desc: '+15% gathering and tree yield per rank.' },
        armorer: { name: 'Ballistic Armorer', max: 3, cost: 2, desc: '+25 starting armor & +1 spare plate per rank.' },
        navigator: { name: 'Valley Navigator', max: 2, cost: 3, desc: 'Rank 2 halves the time every fast travel costs.' }
    };

    const KITS = {
        standard: { name: 'Standard Issue', level: 1, desc: 'Balanced start: M1911 (32 reserve), C4, Monkey Bomb, 1 ration, 1 trauma kit.', items: {} },
        pathfinder: { name: 'Pathfinder', level: 2, desc: 'Traversal kit: Trail Bicycle unlocked at start, +2 fuel, +1 torch, +2 cord.', items: { fuel: 2, torch: 1, cord: 2 }, vehicle: 'bike' },
        sapper: { name: 'Field Sapper', level: 4, desc: 'Engineering kit: +6 timber, +4 stone, +4 salvage, +2 wire for rapid fortifying.', items: { timber: 6, stone: 4, scrap: 4, wire: 2 } },
        alchemist: { name: 'Zone Alchemist', level: 6, desc: 'Medical & rad kit: +2 herbal dressings, +1 respirator filter, +2 filtered water, +1 Aether shard.', items: { bandage: 2, filter: 1, freshWater: 2, aetherShard: 1 } },
        keeper: { name: 'Lantern Keeper', level: 1, unlock: 'seize', desc: 'Earned by seizing the Lantern: +2 filters, +1 trauma kit, +30 5.56 rounds, +1 thermals. The brood is slower to notice you on day 1.', items: { filter: 2, medkits: 1, ammo556: 30, thermals: 1 } },
        vanguard: { name: 'Frontier Vanguard', level: 9, desc: 'Heavy breach kit: +2 iron bars, +2 fuel, +4 salvage, +1 trauma kit, +24 pistol reserve.', items: { ingot: 2, fuel: 2, scrap: 4, medkits: 1 }, ammo: 24 }
    };

    const BANKABLE = ['scrap', 'ingot', 'wire', 'quartz', 'aetherShard', 'coil'];

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
        const ids = BO.ZombiesData.ORDERED_PROGRESSION.map((enemy) => enemy.id);
        return {
            difficulty: Object.hasOwn(BO.SurvivalRules.difficulties, input.difficulty) ? input.difficulty : d.difficulty,
            gameType: Object.hasOwn(BO.SurvivalRules.modes, input.gameType) ? input.gameType : 'expedition',
            modifiers: Array.isArray(input.modifiers) ? [...new Set(input.modifiers.filter((id) => Object.hasOwn(BO.SurvivalRules.modifiers, id)))] : [],
            pool: Object.hasOwn(data.pools, input.pool) ? input.pool : d.pool,
            dayLength: [180, 360, 720].includes(Number(input.dayLength)) ? Number(input.dayLength) : d.dayLength,
            startHour: [0, 6, 8, 12, 18, 22].includes(Number(input.startHour)) ? Number(input.startHour) : d.startHour,
            encounterRate: [0.7, 1, 1.5].includes(Number(input.encounterRate)) ? Number(input.encounterRate) : d.encounterRate,
            survivalNeeds: input.survivalNeeds ?? d.survivalNeeds,
            weather: input.weather ?? d.weather,
            autosave: input.autosave ?? d.autosave,
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
                kit: Object.hasOwn(KITS, saved?.kit) ? saved.kit : 'standard'
            };
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

        masteryRank(id) {
            return Math.min(MASTERY[id]?.max || 0, Number(this.profile.mastery[id]) || 0);
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

        awardCommendations(n = 1) {
            if (!n || n <= 0) return;
            this.profile.commendations += Math.round(n);
            write(careerKey, this.profile);
        }

        kitUnlocked(id) {
            const kit = KITS[id];
            return !!kit && (!kit.unlock || (this.profile.unlockedKits || []).includes(id));
        }

        unlockKit(id) {
            this.profile.unlockedKits = this.profile.unlockedKits || [];
            if (!this.profile.unlockedKits.includes(id)) this.profile.unlockedKits.push(id);
            write(careerKey, this.profile);
        }

        /** Endings reached across all runs; the Lantern remembers. */
        recordEnding(id) {
            this.profile.endings = this.profile.endings || {};
            this.profile.endings[id] = (this.profile.endings[id] || 0) + 1;
            write(careerKey, this.profile);
        }

        bankExtraction(packItems = {}) {
            const banked = {};
            for (const id of BANKABLE) {
                const qty = packItems[id] || 0;
                if (qty <= 0) continue;
                const add = Math.max(1, Math.ceil(qty * 0.25));
                const prev = this.profile.stash[id] || 0;
                const next = Math.min(25, prev + add);
                if (next > prev) {
                    this.profile.stash[id] = next;
                    banked[id] = next - prev;
                }
            }
            write(careerKey, this.profile);
            return banked;
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

        remember(value) {
            this.profile.options = options(value);
            write(careerKey, this.profile);
            return this.profile.options;
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
            const xpMult = ((BO.SurvivalMode?.active && BO.SurvivalMode?.campaign?.has?.('abundantTech')) ? 2 : 1) * modXp * tierMult;
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

    BO.SurvivalMeta = { MASTERY, KITS };
    BO.SurvivalCampaignOptions = options;
    BO.SurvivalCareer = new SurvivalCareer();
})(window.BO);
