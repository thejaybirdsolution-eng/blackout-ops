/* ============================================================================
   BLACKOUT OPS — Open World RPG · Character (attributes, XP, perks, derived)
   Pure functions over a slot object `s`. Attribute 5 is the neutral baseline
   for relative modifiers; weakspot crit uses the absolute formula
   M_crit = 1 + 0.50 + 0.045 * PRC (+ perk/affix additions).
   Progression: perk point at every even level, attribute point at every odd
   level >= 3. Perk tiers are XOR pairs and require the previous tier.
============================================================================ */
(function (BO) {
    'use strict';

    const SD = () => BO.OWRPGStatsData;

    const Char = {
        attr(s, id) { return s.player.attrs[id] || 5; },

        /** Sum of every numeric perk effect. */
        perkFx(s) {
            const idx = SD().perkIndex();
            const out = {};
            for (const id of s.player.perks) {
                const e = idx[id];
                if (!e) continue;
                for (const [k, v] of Object.entries(e.perk.fx)) out[k] = (out[k] || 0) + v;
            }
            return out;
        },

        derived(s) {
            const a = (id) => this.attr(s, id);
            const fx = this.perkFx(s);
            const inv = BO.OWRPGInventory;
            const rig = inv ? inv.equippedEntry(s, 'rig') : null;
            const rigDef = rig ? SD().ITEMS[rig.id] : null;
            const maxWeight = 35 + 6 * a('BRW') + (fx.carry || 0);
            return {
                maxHp: Math.round(60 + 8 * a('BRW') + (fx.maxHp || 0)),
                maxWeight,
                armor: (rigDef ? rigDef.armor : 0) + (fx.armor || 0),
                meleeMult: 1 + 0.06 * (a('BRW') - 5),
                adsMult: 1 + 0.035 * (a('RFX') - 5),
                spreadMult: Math.max(0.6, 1 - 0.03 * (a('RFX') - 5)),
                dodgeWindow: 0.25 + 0.025 * a('RFX'),
                cdMult: Math.max(0.35, (1 - 0.04 * (a('TCH') - 5)) * (1 - (fx.cdr || 0))),
                statusPotency: 1 + 0.07 * (a('TCH') - 5),
                statusDur: 1 + (fx.statusDur || 0) + 0.07 * (a('TCH') - 5),
                critMult: 1 + 0.5 + 0.045 * a('PRC') + (fx.critAdd || 0),
                noiseMult: Math.max(0.3, (1 - 0.04 * (a('PRC') - 5)) * (1 + (fx.noise || 0))),
                trapRadius: 2.5 * a('PRC'),
                buyMult: Math.max(0.6, 1 - 0.035 * (a('PRS') - 5)),
                sellMult: 0.35 * (1 + 0.035 * (a('PRS') - 5)),
                repMult: 1 + 0.08 * (a('PRS') - 5),
                stealthMult: 2.25 + (fx.stealthMult || 0),
                detectSlow: fx.detectSlow || 0,
                fx
            };
        },

        xpToNext(s) { return SD().xpToNext(s.player.level); },

        /** Adds XP and processes level-ups. Returns number of levels gained. */
        addXp(s, amount) {
            const p = s.player;
            const cap = SD().LEVEL_CAP;
            if (p.level >= cap) return 0;
            p.xp += Math.max(0, Math.round(amount));
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

        /** XP multiplier vs. an enemy level (anti-grind). */
        killXpMult(s, enemyLvl) { return s.player.level - enemyLvl >= 5 ? 0.25 : 1; },

        raiseAttr(s, id) {
            const p = s.player;
            if (p.attrPoints <= 0 || this.attr(s, id) >= SD().ATTR_MAX) return false;
            p.attrs[id]++;
            p.attrPoints--;
            return true;
        },

        /** Why a perk can't be taken ('' when it can). */
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

        /** Encumbrance band from carried weight. */
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
