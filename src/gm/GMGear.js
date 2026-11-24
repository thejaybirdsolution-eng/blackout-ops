/* ============================================================================
   BLACKOUT OPS — Survival 1.0: Gear, food and preparation
   · SPOILAGE: at midnight, fresh food rots — raw meat and fish lose 60% of each
     stack, cooked food 30%, in your pack and in storage. Jerky, smoked meat,
     canned food, rations, pies and honey keep. Spoiled food makes blood bait.
   · MEAL BUFFS (one at a time): Hunter's stew (+30% stamina regen),
     spiced broth / soup (+6 °C, resist cold), field espresso (+8% speed),
     feasts, pies and hams (+15 max health). Any cooked meal clears Weakened.
   · WELL-RESTED: a full night in a bed gives +10% XP and faster healing for a
     day, and clears Weakened.
   · WEAPON POWER, CONSOLIDATED: rarity tops out at +18% damage and two
     traits. Mk forging and resonance infusions are retired; attachments and
     condition are how you tune a gun. Suppressors cut noise but cost 8% damage.
   · PACK-OUT: a readiness checklist before you leave (food/water days, meds,
     ammo per weapon, condition, light, forecast) with a grade.
   · BOSS REWARDS: fireproof hauler pack, rebreather, thermal rig, night-sight
     monocle, hive gland, PMC codebook — checked here for the whole game.
============================================================================ */
(function (BO) {
    'use strict';
    const GM = BO.GM;
    const F = () => BO.SurvivalFrontierData;

    const KEEPS = /^(jerky|smoked|canned|rations|golden_ration|honey|berry_pie|meat_pie|honey_ham|dried|spoiled)/;
    const MEALS = {
        hunter_stew: { name: "Hunter's stew", buff: 'stamina', text: '+30% stamina regen' },
        stew: { name: 'Venison stew', buff: 'stamina', text: '+30% stamina regen' },
        broth: { name: 'Spiced broth', buff: 'warm', text: '+6 °C, resist cold' },
        mushroom_soup: { name: 'Mushroom soup', buff: 'warm', text: '+6 °C, resist cold' },
        espresso: { name: 'Field espresso', buff: 'swift', text: '+8% move speed' },
        survivor_feast: { name: "Survivor's feast", buff: 'hearty', text: '+15 max health' },
        meat_pie: { name: 'Meat pie', buff: 'hearty', text: '+15 max health' },
        honey_ham: { name: 'Honey-glazed ham', buff: 'hearty', text: '+15 max health' },
        omelette: { name: 'Mushroom omelette', buff: 'stamina', text: '+30% stamina regen' }
    };
    const MEAL_SECONDS = 360;

    const Gear = {
        rate: 2,

        start(mode, saved) {
            this.mode = mode;
            this.lastDay = saved?.lastDay || mode.campaign.day;
            this.buff = saved?.buff || null;
            this.restedUntil = saved?.restedUntil || 0;
            this.allyCallDay = saved?.allyCallDay || 0;
            this.install();
            this.patch();
            if (this.buff) this.applyBuff(this.buff.id, this.buff.until, true);
            GM.ui.panel('packout', { title: () => 'Pack-out checklist', render: () => this.renderPackOut() });
        },

        stop() { this.unpatch(); if (this._hearty) this.clearHearty(); this.mode = null; },

        snapshot() { return { lastDay: this.lastDay, buff: this.buff, restedUntil: this.restedUntil, allyCallDay: this.allyCallDay }; },

        install() {
            if (this._installed) return;
            this._installed = true;
            F().items.spoiled = F().items.spoiled || ['Spoiled food', 'Food', 0.3];
            if (BO.SurvivalItemInfo) BO.SurvivalItemInfo.spoiled = 'Rotten. Do not eat it — craft it into blood bait to lure predators.';
            const bait = F().recipes.find((r) => r.id === 'gmBait');
            if (bait?.anyOf && !bait.anyOf.includes('spoiled')) bait.anyOf.unshift('spoiled');
            const R = BO.ZoneThrill?.RARITY;
            if (R) for (const r of R) { r.dmg = Math.min(r.dmg, 1.18); r.perks = Math.min(r.perks, 2); }
        },

        patch() {
            const m = this.mode;
            const c = m.campaign;
            const self = this;
            const deep = c.deep;
            this._orig = { consume: m.consume, sleep: c.sleepUntilDawn, activate: c.activate, upgrade: deep?.upgradeEquippedWeapon, infuse: deep?.applyInfusion, xp: BO.ZoneThrill?.xp };
            m.consume = function (id) {
                if (id === 'spoiled') { GM.toast('That is rotten. Make it into blood bait instead.', '#f59e0b'); return false; }
                const before = this.points[id] || 0;
                const ok = self._orig.consume.call(this, id);
                if (ok && (this.points[id] || 0) < before) self.onAte(id);
                return ok;
            };
            c.sleepUntilDawn = function () {
                const ok = self._orig.sleep.call(this);
                if (ok) self.onSlept(true);
                return ok;
            };
            c.activate = function (marker) {
                const piece = marker?.id?.startsWith('build:') ? this.placed.find((p) => 'build:' + p.id === marker.id && p.alive) : null;
                const before = this.restHours;
                const r = self._orig.activate.call(this, marker);
                if (piece?.type === 'bed' && this.restHours > before) self.onSlept(false);
                return r;
            };
            if (deep && this._orig.upgrade) deep.upgradeEquippedWeapon = function () { GM.toast('Mk forging was retired in 1.0. Tune guns with attachments at a Machinist bench, and find better rarities.', '#cbd5e1'); return false; };
            if (deep && this._orig.infuse) deep.applyInfusion = function () { GM.toast('Resonance infusions were retired in 1.0.', '#cbd5e1'); return false; };
            if (BO.ZoneThrill && this._orig.xp) {
                BO.ZoneThrill.xp = function (n, label, quiet) {
                    return self._orig.xp.call(this, self.restedUntil > (self.mode?.campaign?.totalHours || 0) ? Math.round(n * 1.1) : n, label, quiet);
                };
            }
        },

        unpatch() {
            if (!this._orig || !this.mode) return;
            const m = this.mode, c = m.campaign;
            m.consume = this._orig.consume;
            c.sleepUntilDawn = this._orig.sleep;
            c.activate = this._orig.activate;
            if (c.deep && this._orig.upgrade) { c.deep.upgradeEquippedWeapon = this._orig.upgrade; c.deep.applyInfusion = this._orig.infuse; }
            if (BO.ZoneThrill && this._orig.xp) BO.ZoneThrill.xp = this._orig.xp;
            this._orig = null;
        },

        /* ---------------------------------------------------------- food */
        isPerishable(id) {
            const it = F().items[id];
            if (!it || it[1] !== 'Food' || KEEPS.test(id)) return false;
            return true;
        },
        spoilRate(id) { return /^raw_/.test(id) ? 0.6 : 0.3; },

        spoil() {
            const m = this.mode;
            const c = m.campaign;
            const lost = {};
            const rot = (inv) => {
                for (const id of Object.keys(inv)) {
                    if (!(inv[id] > 0) || !this.isPerishable(id)) continue;
                    const n = Math.ceil(inv[id] * this.spoilRate(id));
                    inv[id] -= n;
                    if (!inv[id]) delete inv[id];
                    inv.spoiled = (inv.spoiled || 0) + n;
                    lost[id] = (lost[id] || 0) + n;
                }
            };
            rot(m.points);
            for (const st of c.pack.chests.values()) rot(st);
            if (Object.keys(lost).length) GM.toast('Midnight: food spoiled — ' + GM.amounts(lost) + '. Smoke, dry or can it to keep it.', '#d6a35c');
        },

        onAte(id) {
            const cooked = /^(cooked_|roast_|fried_)/.test(id) || !!MEALS[id];
            if (cooked) GM.get('loot')?.onCookedMeal?.();
            const meal = MEALS[id] || (/^cooked_/.test(id) ? null : null);
            if (meal) this.applyBuff(id, this.mode.clock + MEAL_SECONDS * (GM.get('catalogue')?.mealMult?.() || 1));
            if (cooked) GM.first('meal', 'Hot meal', 'Cooked food heals more and clears Weakened');
        },

        applyBuff(id, until, silent = false) {
            const meal = MEALS[id];
            if (!meal) return;
            if (this._hearty) this.clearHearty();
            this.buff = { id, until, kind: meal.buff };
            if (meal.buff === 'hearty') { const p = BO.Player; p.maxHp += 15; p.hp = Math.min(p.maxHp, p.hp + 15); this._hearty = true; }
            GM.setStatus('meal', { until, label: meal.text });
            if (!silent) GM.toast(meal.name + ': ' + meal.text + ' for ' + Math.round(MEAL_SECONDS / 60) + ' min.', '#fde68a');
        },
        clearHearty() { const p = BO.Player; p.maxHp = Math.max(1, p.maxHp - 15); p.hp = Math.min(p.hp, p.maxHp); this._hearty = false; },

        onSlept(fullNight) {
            GM.get('loot')?.onSlept?.();
            if (fullNight) {
                this.restedUntil = this.mode.campaign.totalHours + 24;
                GM.toast('Well-rested: +10% XP and faster healing for a day.', '#a7f3d0');
            }
        },

        staminaRegenMult() { return this.buff?.kind === 'stamina' && this.buff.until > this.mode.clock ? 1.3 : 1; },
        speedMult() { return this.buff?.kind === 'swift' && this.buff.until > this.mode.clock ? 1.08 : 1; },
        tempBonus() { return this.buff?.kind === 'warm' && this.buff.until > this.mode.clock ? 6 : 0; },

        /* ---------------------------------------------------------- weapons */
        outgoingDamageMult(entity, kind) {
            const w = BO.Player.activeWeapon;
            if (kind === 'bullet' && w?.stats?.suppressed) return 0.92;
            return 1;
        },

        /* ---------------------------------------------------------- rewards */
        reward(id) { return !!GM.get('bosses')?.hasReward?.(id); },
        hasFireproofPack() { return this.reward('fireproofPack'); },
        hasRebreather() { return this.reward('rebreather'); },
        hasThermalRig() { return this.reward('thermalRig'); },
        hasMonocle() { return this.reward('monocle'); },
        claimRadiusMult() { return this.reward('hiveGland') ? 1.5 : 1; },

        /* ---------------------------------------------------------- pack-out */
        packOut() {
            const m = this.mode;
            const c = m.campaign;
            const inv = m.points;
            const items = F().items;
            let foodPts = 0, waterPts = (inv.freshWater || 0) * 30 + (inv.canned || 0) * 8;
            for (const [id, n] of Object.entries(inv)) {
                if (!(n > 0) || items[id]?.[1] !== 'Food' || id === 'spoiled') continue;
                foodPts += n * (/^cooked_|stew|feast|pie|ham|ration/.test(id) ? 40 : /^raw_/.test(id) ? 12 : 22);
            }
            foodPts += (inv.rations || 0) * 35 + (inv.canned || 0) * 30;
            const perDay = 0.1 * c.options.dayLength;
            const foodDays = foodPts / perDay;
            const waterDays = waterPts / (perDay * 1.1);
            const meds = (inv.medkits || 0) * 2 + (inv.bandage || 0) + (inv.antibiotic || 0);
            const p = BO.Player;
            const guns = p.weapons.filter((w) => w && w.stats.kind !== 'melee').map((w) => {
                const cal = BO.ZoneLoot.caliberOf(w);
                const total = (w.mag || 0) + (cal ? inv[cal] || 0 : 0);
                return { name: w.stats.shortName || w.cfg.id, mags: total / Math.max(1, w.stats.magSize), cond: Math.round(w.cond ?? 100) };
            });
            const light = (inv.torch || 0) + ((inv.lantern || 0) && (inv.fuel || 0) ? inv.fuel * 2 : 0);
            const f = GM.get('weather')?.forecast?.();
            const score = Math.min(1, foodDays / 1.5) * 25 + Math.min(1, waterDays / 1.5) * 20 + Math.min(1, meds / 4) * 20 +
                Math.min(1, (guns.reduce((t, g) => t + Math.min(3, g.mags), 0)) / 4) * 20 + Math.min(1, light / 3) * 10 + (guns.every((g) => g.cond > 45) ? 5 : 0);
            const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : score >= 30 ? 'D' : 'F';
            return { foodDays, waterDays, meds, guns, light, forecast: f, score, grade };
        },

        renderPackOut() {
            const esc = GM.esc;
            const r = this.packOut();
            const line = (label, ok, value, tip) => `<li class="${ok ? 'gm-ok' : 'gm-bad'}"><span>${ok ? '✓' : '✗'} ${esc(label)}</span><em>${esc(value)}</em>${tip ? `<small>${esc(tip)}</small>` : ''}</li>`;
            return `<div class="gm-packout"><div class="gm-grade gm-grade-${r.grade}">${r.grade}</div><p>Readiness ${Math.round(r.score)}/100 for an expedition of about a day and a half.</p>
                <ul class="gm-list">
                ${line('Food', r.foodDays >= 1.5, r.foodDays.toFixed(1) + ' days', 'Cooked food keeps two nights; jerky, canned and rations keep forever.')}
                ${line('Water', r.waterDays >= 1.5, r.waterDays.toFixed(1) + ' days', 'Filtered water from purifiers, pumps and rain barrels.')}
                ${line('Medicine', r.meds >= 4, r.meds + ' doses', 'Trauma kits count double.')}
                ${r.guns.map((g) => line(g.name, g.mags >= 2 && g.cond > 45, g.mags.toFixed(1) + ' mags · ' + g.cond + '%', g.cond <= 45 ? 'Below 45% it jams. Repair it.' : '')).join('') || line('Firearm', false, 'none', 'A melee-only run is brave.')}
                ${line('Light', r.light >= 3, r.light + ' burns', 'Torches, or a lantern with fuel.')}
                </ul>
                ${r.forecast ? `<p class="gm-muted">Weather here: <b>${esc(r.forecast.now)}</b>, then ${esc(r.forecast.next)} in ~${r.forecast.inHours} h.</p>` : ''}</div>`;
        },

        /* ---------------------------------------------------------- PMC codebook */
        callAllies() {
            const m = this.mode;
            const c = m.campaign;
            if (!this.reward('codebook')) return false;
            if (this.allyCallDay === c.day) { GM.toast('The fire team already came today.', '#cbd5e1'); return false; }
            this.allyCallDay = c.day;
            const p = BO.Player.pos;
            for (let i = 0; i < 2; i++) {
                const x = p.x + 4 + i * 2, z = p.z + 4;
                const bot = m.spawnBot(x, GM.ground(x, z), z, i ? 'm4a1' : 'ak47', 160, 0, true);
                if (bot) { bot.gmAlly = m.clock + 150; bot.name = 'Sable defector'; }
            }
            GM.banner('FIRE TEAM INBOUND', 'TWO SABLE DEFECTORS FIGHT FOR YOU FOR 150 S', '#93c5fd');
            return true;
        },

        /* ---------------------------------------------------------- update */
        update() {
            const m = this.mode;
            const c = m.campaign;
            if (c.day !== this.lastDay) { this.lastDay = c.day; this.spoil(); }
            if (this.buff && this.buff.until <= m.clock) { if (this.buff.kind === 'hearty') this.clearHearty(); this.buff = null; }
            if (this.restedUntil > c.totalHours) {
                GM.setStatus('rested', { until: m.clock + 0.6 });
                const p = BO.Player;
                if (p.alive && p.hp < p.maxHp && m.hunger > 50 && (c.deep?.hydration ?? 100) > 50) p.hp = Math.min(p.maxHp, p.hp + 0.25);
            }
            for (let i = m.bots.length - 1; i >= 0; i--) {
                const b = m.bots[i];
                if (b.gmAlly && m.clock > b.gmAlly) { b.alive = false; b.destroy?.(); m.bots.splice(i, 1); }
            }
            const load = c.pack.weight() / Math.max(1, c.pack.limits.weight);
            if (load > 1) GM.setStatus('encumbered', { until: m.clock + 0.6 });
            if ((c.deep?.bleeding || 0) > 0) GM.setStatus('bleeding', { until: m.clock + 0.6 });
            if ((c.deep?.infection || 0) >= 40) GM.setStatus('infected', { until: m.clock + 0.6 });
            if (m.fracture) GM.setStatus('fracture', { until: m.clock + 0.6 });
        },

        baseCards(ui) {
            const r = this.packOut();
            const codebook = this.reward('codebook');
            return [ui.section('Expedition prep', `<p>Pack-out grade <b class="gm-grade-inline gm-grade-${r.grade}">${r.grade}</b> · food ${r.foodDays.toFixed(1)} d · water ${r.waterDays.toFixed(1)} d · ${r.meds} med doses</p>
                <div class="sv-actions"><button class="sv-btn sm primary" data-act="gm" data-arg="gear.packout:">Open pack-out checklist</button>${codebook ? '<button class="sv-btn sm" data-act="gm" data-arg="gear.allies:">Call Sable fire team (daily)</button>' : ''}</div>`)];
        },

        uiAct(cmd) {
            if (cmd === 'packout') { GM.ui.open('packout'); return true; }
            if (cmd === 'allies') { this.callAllies(); return 'close'; }
            return false;
        }
    };

    GM.register('gear', Gear);
})(window.BO);
