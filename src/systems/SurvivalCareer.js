
(function (BO) {
    'use strict';

    const data = BO.SurvivalCampaignData;
    const careerKey = 'boSurvivalCareer/v1';
    const checkpointKey = 'boSurvivalCheckpoint/v1';

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
                xp: Number(saved?.xp) || 0, stats: { ...(saved?.stats || {}) },
                trips: { ...(saved?.trips || {}) }, options: options(saved?.options)
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
            const xpMult = (BO.SurvivalMode?.active && BO.SurvivalMode?.campaign?.has?.('abundantTech')) ? 2 : 1;
            this.profile.xp += xp * count * xpMult;
            this.profile.stats[key] = (this.profile.stats[key] || 0) + count;
            write(careerKey, this.profile);
            if (this.level > old) {
                BO.Events.emit('hud:banner', {
                    title: 'SURVIVAL LEVEL ' + this.level, sub: this.rank.toUpperCase(), color: '#a8d9bc'
                });
                if (BO.SurvivalMode?.active && BO.SurvivalMode?.campaign?.deep) {
                    BO.SurvivalMode.campaign.deep.grantTechPoints(this.level - old);
                }
            }
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

    BO.SurvivalCampaignOptions = options;
    BO.SurvivalCareer = new SurvivalCareer();
})(window.BO);
