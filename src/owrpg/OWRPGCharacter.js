/* ============================================================================
   BLACKOUT OPS — Open World RPG · Character (attributes, XP, perks, armor sets)
   Preserves starter formulas verified by _qa_owrpg.html:
     maxHp = 60 + 8 * BRW (+ perks + non-starter gear)
     maxWeight = 35 + 6 * BRW (+ perks + non-starter gear)
     critMult = 1 + 0.50 + 0.045 * PRC (+ perks + non-starter gear)
============================================================================ */
(function (BO) {
    'use strict';

    const SD = () => BO.OWRPGStatsData;
    const EX = () => BO.OWRPGExpansionData;
    const ARMOR_RARITY = { common: 1.0, rare: 1.25, epic: 1.55, legendary: 1.9 };
    const ARMOR_SLOTS = ['helmet', 'rig', 'boots', 'relic'];

    const Char = {
        attr(s, id) { return s.player.attrs[id] || 5; },

        perkFx(s) {
            const idx = SD().perkIndex();
            const out = {};
            for (const id of s.player.perks) {
                const e = idx[id];
                if (!e) continue;
                for (const [k, v] of Object.entries(e.perk.fx)) out[k] = (out[k] || 0) + v;
            }
            const stone = SD().STANDING_STONES[s.player.standingStone];
            if (stone) for (const [k, v] of Object.entries(stone.fx)) out[k] = (out[k] || 0) + v;
            const rank = id => Math.max(0, this.skill(s, id).level - 1);
            const add = (key, value) => { out[key] = (out[key] || 0) + value; };
            if ((s.worldFlags.xpBoostUntil || 0) > s.playtimeSec) add('xpMult', 0.3);
            add('allDmgMult', rank('combat') * 0.005);
            add('monsterDmg', rank('slayer') * 0.006);
            add('creditFind', rank('delving') * 0.008);
            add('medMult', rank('foraging') * 0.006);
            add('gatherChance', rank('foraging') * 0.006);
            add('salvage', rank('mining') * 0.007);
            add('durSave', rank('mining') * 0.007);
            add('arcanaDmg', rank('arcana') * 0.006);
            add('speedMult', rank('exploration') * 0.002);
            add('discoveryXp', rank('exploration') * 0.01);
            // Timed shrine blessing (Discoveries): fx bundle that expires on playtime.
            const bl = s.player.blessing;
            if (bl && bl.until > s.playtimeSec && bl.fx) for (const [k, v] of Object.entries(bl.fx)) add(k, v);
            return out;
        },

        skill(s, id) {
            const skills = s.player.skills || (s.player.skills = {});
            return skills[id] || (skills[id] = { level: 1, xp: 0 });
        },

        addSkillXp(s, id, amount) {
            if (!SD().SKILLS[id] || !Number.isFinite(amount) || amount <= 0) return 0;
            const sk = this.skill(s, id);
            if (sk.level >= SD().SKILL_CAP) return 0;
            sk.xp += Math.round(amount * (1 + (this.perkFx(s).skillXpMult || 0)));
            let levels = 0;
            while (sk.level < SD().SKILL_CAP && sk.xp >= SD().skillXpToNext(sk.level)) {
                sk.xp -= SD().skillXpToNext(sk.level);
                sk.level++;
                levels++;
            }
            if (sk.level >= SD().SKILL_CAP) sk.xp = 0;
            if (levels) BO.Events.emit('hud:toast', { text: SD().SKILLS[id].name + ' advanced to ' + sk.level, color: SD().SKILLS[id].color });
            return levels;
        },

        /** Compute active 2-piece & 3-piece Set Bonuses and summed armor stats. */
        gearStats(s) {
            const inv = BO.OWRPGInventory;
            const Dur = BO.OWRPGDurability;
            const counts = {};
            const elemRes = { burn: 0, chill: 0, shock: 0, venom: 0, void: 0 };
            const bonus = { armor: 0, maxHp: 0, carry: 0, critAdd: 0, cdr: 0, statusPotency: 0, noise: 0, speedMult: 0, meleeMult: 0, stealthMult: 0, detHeal: 0, reactMult: 0, heavyPen: 0, heavyDmg: 0, chain: 0 };

            if (inv) {
                for (const slot of ARMOR_SLOTS) {
                    const entry = inv.equippedEntry(s, slot);
                    if (!entry) continue;
                    const def = SD().ITEMS[entry.id];
                    if (!def) continue;
                    const rar = ARMOR_RARITY[entry.rarity || def.rarity || 'common'] || 1.0;
                    const perf = Dur ? Dur.performanceMult(entry) : 1.0;
                    bonus.armor += Math.round((def.armor || 0) * rar * perf);
                    if (def.elemRes) {
                        for (const [el, v] of Object.entries(def.elemRes)) elemRes[el] = (elemRes[el] || 0) + v * perf;
                    }
                    if (def.stats) {
                        for (const [k, v] of Object.entries(def.stats)) bonus[k] = (bonus[k] || 0) + v * perf;
                    }
                    if (def.setId) counts[def.setId] = (counts[def.setId] || 0) + 1;
                }
            }

            const activeSets = [];
            const setsData = EX() ? EX().ARMOR_SETS : {};
            for (const [setId, n] of Object.entries(counts)) {
                const setDef = setsData[setId];
                if (!setDef) continue;
                const applyTier = (b) => {
                    if (!b) return;
                    for (const [k, v] of Object.entries(b)) {
                        if (k === 'label') continue;
                        if (k === 'allElemRes') {
                            for (const el of Object.keys(elemRes)) elemRes[el] += v;
                        } else {
                            bonus[k] = (bonus[k] || 0) + v;
                        }
                    }
                };
                const tiers = [];
                if (n >= 2) { applyTier(setDef.bonus2); tiers.push(setDef.bonus2.label); }
                if (n >= 3) { applyTier(setDef.bonus3); tiers.push(setDef.bonus3.label); }
                activeSets.push({ id: setId, name: setDef.name, color: setDef.color, count: n, tiers });
            }

            for (const el of Object.keys(elemRes)) elemRes[el] = Math.min(0.75, elemRes[el]);
            return { bonus, elemRes, activeSets };
        },

        derived(s) {
            const a = (id) => this.attr(s, id);
            const fx = this.perkFx(s);
            const gs = this.gearStats(s);
            const gb = gs.bonus;
            const maxWeight = 35 + 6 * a('BRW') + (fx.carry || 0) + Math.round(gb.carry || 0);
            const mergedFx = Object.assign({}, fx);
            for (const k of ['detHeal', 'reactMult', 'heavyPen', 'heavyDmg', 'chain']) {
                if (gb[k]) mergedFx[k] = (mergedFx[k] || 0) + gb[k];
            }
            for (const el of Object.keys(gs.elemRes)) gs.elemRes[el] = Math.min(0.75, gs.elemRes[el] + (fx.allElemRes || 0));
            return {
                maxHp: Math.round(60 + 8 * a('BRW') + (fx.maxHp || 0) + (gb.maxHp || 0)),
                maxWeight,
                armor: Math.round((gb.armor || 0) + (fx.armor || 0)),
                meleeMult: 1 + 0.06 * (a('BRW') - 5) + (gb.meleeMult || 0),
                adsMult: 1 + 0.035 * (a('RFX') - 5),
                spreadMult: Math.max(0.6, 1 - 0.03 * (a('RFX') - 5)),
                dodgeWindow: 0.25 + 0.025 * a('RFX'),
                cdMult: Math.max(0.35, (1 - 0.04 * (a('TCH') - 5)) * (1 - (fx.cdr || 0)) * (1 - (gb.cdr || 0))),
                statusPotency: 1 + 0.07 * (a('TCH') - 5) + (gb.statusPotency || 0) + (fx.statusPotency || 0),
                statusDur: 1 + (fx.statusDur || 0) + 0.07 * (a('TCH') - 5),
                critMult: 1 + 0.5 + 0.045 * a('PRC') + (fx.critAdd || 0) + (gb.critAdd || 0),
                noiseMult: Math.max(0.25, (1 - 0.04 * (a('PRC') - 5)) * (1 + (fx.noise || 0) + (gb.noise || 0))),
                trapRadius: 2.5 * a('PRC'),
                buyMult: Math.max(0.6, 1 - 0.035 * (a('PRS') - 5)),
                sellMult: 0.35 * (1 + 0.035 * (a('PRS') - 5)),
                repMult: 1 + 0.08 * (a('PRS') - 5),
                stealthMult: 2.25 + (fx.stealthMult || 0) + (gb.stealthMult || 0),
                detectSlow: fx.detectSlow || 0,
                gearSpeedMult: 1 + (gb.speedMult || 0) + (fx.speedMult || 0),
                elemRes: gs.elemRes,
                activeSets: gs.activeSets,
                fx: mergedFx
            };
        },

        xpToNext(s) { return SD().xpToNext(s.player.level); },

        addXp(s, amount) {
            const p = s.player;
            const cap = SD().LEVEL_CAP;
            if (p.level >= cap) return 0;
            p.xp += Number.isFinite(amount) ? Math.max(0, Math.round(amount * (1 + (this.perkFx(s).xpMult || 0)))) : 0;
            let gained = 0;
            while (p.level < cap && p.xp >= SD().xpToNext(p.level)) {
                p.xp -= SD().xpToNext(p.level);
                p.level++;
                gained++;
                if (p.level % 2 === 0) p.perkPoints++;
                else if (p.level >= 3) p.attrPoints++;
            }
            if (p.level >= cap) p.xp = 0;
            return gained;
        },

        killXpMult(s, enemyLvl) { return s.player.level - enemyLvl >= 5 ? 0.25 : 1; },

        raiseAttr(s, id) {
            const p = s.player;
            if (p.attrPoints <= 0 || this.attr(s, id) >= SD().ATTR_MAX) return false;
            p.attrs[id]++;
            p.attrPoints--;
            return true;
        },

        perkBlock(s, perkId) {
            const e = SD().perkIndex()[perkId];
            if (!e) return 'Unknown perk';
            const p = s.player;
            if (p.perks.includes(perkId)) return 'Owned';
            const tree = SD().PERK_TREES[e.tree];
            const pair = tree.tiers[e.tier];
            if (pair.some((pk) => pk.id !== perkId && p.perks.includes(pk.id))) return 'Locked by choice';
            const need = SD().TIER_LEVELS[e.tier];
            if (p.level < need) return 'Requires level ' + need;
            if (e.tier > 0 && !tree.tiers[e.tier - 1].some((pk) => p.perks.includes(pk.id))) return 'Requires previous tier';
            if (p.perkPoints <= 0) return 'No perk points';
            return '';
        },

        takePerk(s, perkId) {
            if (this.perkBlock(s, perkId)) return false;
            s.player.perks.push(perkId);
            s.player.perkPoints--;
            return true;
        },

        respecCost(s) { return 150 * (s.player.respecCount || 0); },

        respec(s) {
            const cost = this.respecCost(s);
            if (s.player.credits < cost) return false;
            s.player.credits -= cost;
            s.player.perkPoints += s.player.perks.length;
            s.player.perks = [];
            s.player.respecCount = (s.player.respecCount || 0) + 1;
            return true;
        },

        powerUnlocked(s, id) {
            const rule = EX()?.POWER_UNLOCKS?.[id];
            if (!rule) return true;
            if (s.player.unlockedPowers && s.player.unlockedPowers.includes(id)) return true;
            return !!rule.check(s);
        },

        encumbrance(s) {
            const d = this.derived(s);
            const w = BO.OWRPGInventory ? BO.OWRPGInventory.weight(s) : 0;
            const r = w / d.maxWeight;
            const band = r <= 0.7 ? 'light' : r <= 1 ? 'normal' : r <= 1.3 ? 'heavy' : 'over';
            const FX = {
                light: { speed: 1.05, noise: 0.85, stamina: 1, dodge: true, label: 'Light' },
                normal: { speed: 1, noise: 1, stamina: 1, dodge: true, label: 'Normal' },
                heavy: { speed: 0.75, noise: 1.35, stamina: 1.4, dodge: true, label: 'Heavy' },
                over: { speed: 0.55, noise: 1.6, stamina: 2, dodge: false, label: 'Overburdened' }
            };
            return Object.assign({ weight: w, max: d.maxWeight, ratio: r, band }, FX[band]);
        }
    };

    BO.OWRPGCharacter = Char;
})(window.BO);
