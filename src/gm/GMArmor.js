/* ============================================================================
   BLACKOUT OPS — Survival Gold: plate vest (BO.GM 'armor')
   Replaces the single armour number (and the 180-armour obsidian rig) with a
   three-slot plate vest. Every plate is a trade-off:
     · Leather / hide  — early, crafted from the hunt; wears out for good.
     · Ceramic         — fired at the kiln; light, strong, SHATTERS at zero.
     · Steel           — forged at the bench; heavy (−3% speed each), DENTS at
                         zero and is hammered back to full with 1 iron bar.
     · Composite       — iron, obsidian and cloth; best protection, CRACKS at
                         zero and is relaid with 1 iron bar + 1 cloth.
   The front plate (first one with anything left) sets how much of each hit
   the vest absorbs. The HUD's three armour bars show each plate's health,
   coloured by type. Dying knocks 25% off every plate.
============================================================================ */
(function (BO) {
    'use strict';
    const GM = BO.GM;
    const F = BO.SurvivalFrontierData;

    const SLOTS = 3;
    const DEATH_WEAR = 0.25;
    const TYPES = {
        leather: { name: 'Leather plate', item: 'leather_armor', hp: 35, absorb: 0.45, at0: 'worn', color: '#b87d52' },
        hide: { name: 'Bone & hide plate', item: 'hide_armor', hp: 50, absorb: 0.5, at0: 'worn', color: '#c9b496' },
        ceramic: { name: 'Ceramic plate', item: 'plate_ceramic', hp: 55, absorb: 0.7, at0: 'shatter', color: '#e7e5e4' },
        steel: { name: 'Steel plate', item: 'plate_steel', hp: 75, absorb: 0.6, at0: 'dent', slow: 0.03, repair: { ingot: 1 }, color: '#94a3b8' },
        composite: { name: 'Composite plate', item: 'plate_composite', hp: 95, absorb: 0.75, at0: 'crack', repair: { ingot: 1, cloth: 1 }, color: '#a78bfa' }
    };
    const ITEM_TO_TYPE = Object.fromEntries(Object.entries(TYPES).map(([k, t]) => [t.item, k]));

    /* ---------------------------------------------------------- load-time data */
    (function registerData() {
        if (!F) return;
        Object.assign(F.items, {
            plate_ceramic: ['Ceramic plate', 'Equipment', 1.4],
            plate_steel: ['Steel plate', 'Equipment', 2.6],
            plate_composite: ['Composite plate', 'Equipment', 1.8]
        });
        const add = (id, name, station, cost, gain, desc) => {
            if (!F.recipes.some((r) => r.id === id)) F.recipes.push({ id, name, station, cost, gain, desc, cat: 'gear' });
        };
        add('fireCeramicPlate', 'Fire a ceramic plate', 'kiln', { clay: 4, sand: 1 }, { plate_ceramic: 1 }, 'Light vest plate: 55 protection, absorbs 70% of each hit. Shatters when it runs out.');
        add('forgeSteelPlate', 'Forge a steel plate', 'bench', { ingot: 3, leather: 1 }, { plate_steel: 1 }, 'Heavy vest plate: 75 protection, absorbs 60%, −3% speed. Dents instead of breaking; 1 iron bar repairs it.');
        add('layCompositePlate', 'Lay a composite plate', 'bench', { ingot: 2, obsidian: 2, cloth: 2 }, { plate_composite: 1 }, 'Best vest plate: 95 protection, absorbs 75%. Cracks instead of breaking; 1 iron bar + 1 cloth relays it.');
        // The leather and hide armours become plates; their descriptions follow.
        for (const r of F.recipes) {
            if (r.id === 'leatherArmor') r.desc = 'A leather vest plate: 35 protection, absorbs 45% of each hit. Wears out for good.';
            if (r.id === 'boneArmor') r.desc = 'A bone & hide vest plate: 50 protection, absorbs 50%. Wears out for good.';
            if (r.id === 'craftAbyssalArmor' && r.cost?.obsidian_armor) {
                const cost = { ...r.cost };
                delete cost.obsidian_armor;
                cost.plate_composite = 1;
                r.cost = cost;
                r.desc = 'Fills all three vest slots with fresh composite plates and grants five minutes of fire ward.';
            }
        }
        const usable = BO.SurvivalHotbar?.usable;
        if (usable) for (const id of ['plate_ceramic', 'plate_steel', 'plate_composite']) usable.add(id);
    })();

    const Armor = {
        rate: 0,

        start(mode, saved) {
            this.mode = mode;
            const p = BO.Player;
            this.slots = Array.from({ length: SLOTS }, (_, i) => {
                const s = saved?.slots?.[i];
                return s && TYPES[s.type] ? { type: s.type, hp: Math.max(0, Math.min(TYPES[s.type].hp, s.hp)) } : null;
            });
            // A fresh run that starts armoured (the "armored" modifier) gets matching ceramic plates.
            if (!saved && (p.armor || 0) > 0) {
                let left = p.armor;
                for (let i = 0; i < SLOTS && left > 0; i++) {
                    const hp = Math.min(TYPES.ceramic.hp, left);
                    this.slots[i] = { type: 'ceramic', hp };
                    left -= hp;
                }
            }
            this.wasAlive = p.alive;
            this.patch();
            this.sync();
        },

        stop() {
            this.unpatch();
            const p = BO.Player;
            if (p) { p.plateSlots = null; p.armorAbsorb = undefined; }
            this.mode = null;
        },

        snapshot() { return { slots: this.slots.map((s) => (s ? { type: s.type, hp: Math.round(s.hp * 10) / 10 } : null)) }; },

        /* ------------------------------------------------------------ state */
        total() { return this.slots.reduce((a, s) => a + (s ? s.hp : 0), 0); },
        capacity() { return this.slots.reduce((a, s) => a + (s ? TYPES[s.type].hp : 0), 0); },
        front() { return this.slots.find((s) => s && s.hp > 0) || null; },

        /** Push the vest into the player's armour fields (the HUD and damage code read those). */
        sync() {
            const p = BO.Player;
            p.plateSlots = this.slots.map((s) => (s ? { type: s.type, hp: s.hp, max: TYPES[s.type].hp, color: TYPES[s.type].color } : null));
            p.maxArmor = this.capacity();
            p.armor = this.total();
            const f = this.front();
            p.armorAbsorb = f ? TYPES[f.type].absorb : 0.65;
            this.lastTotal = p.armor;
        },

        /** Damage taken since the last frame comes off the front plates in order. */
        drain(amount) {
            for (let i = 0; i < SLOTS && amount > 0.0001; i++) {
                const s = this.slots[i];
                if (!s || s.hp <= 0) continue;
                const take = Math.min(s.hp, amount);
                s.hp -= take;
                amount -= take;
                if (s.hp <= 0.0001) this.depleted(i);
            }
        },

        depleted(i) {
            const s = this.slots[i];
            const t = TYPES[s.type];
            s.hp = 0;
            if (t.at0 === 'shatter' || t.at0 === 'worn') {
                this.slots[i] = null;
                BO.Sound?.playWallBreak?.();
                GM.toast(t.name + (t.at0 === 'shatter' ? ' shattered.' : ' wore through.'), '#fca5a5');
            } else {
                BO.Sound?.playWallHit?.();
                GM.toast(t.name + (t.at0 === 'dent' ? ' dented' : ' cracked') + ' — repair it at a workbench (Base screen).', '#fde68a');
            }
        },

        /* ------------------------------------------------------------ fitting */
        /** Fit a plate item. Returns true when the item was used. */
        fit(type) {
            const t = TYPES[type];
            let i = this.slots.findIndex((s) => !s);
            if (i < 0) i = this.slots.findIndex((s) => s.hp <= 0);
            if (i < 0) {
                // Swap out the weakest plate if the new one is better than what it has left.
                let weakest = -1;
                for (let k = 0; k < SLOTS; k++) if (weakest < 0 || this.slots[k].hp < this.slots[weakest].hp) weakest = k;
                if (this.slots[weakest].hp >= t.hp) {
                    GM.toast('Vest full: every plate is in better shape than this one.');
                    return false;
                }
                this.unfit(weakest, true);
                i = weakest;
            } else if (this.slots[i]) {
                this.unfit(i, true);
            }
            this.slots[i] = { type, hp: t.hp };
            BO.Sound?.playReload?.('in');
            GM.toast(t.name + ' fitted · vest ' + Math.round(this.total()) + ' / ' + this.capacity(), '#bae6fd');
            GM.first('plate', 'Plate vest', 'Three slots. The front plate decides how much of each hit you shrug off.');
            this.sync();
            return true;
        },

        /** Take a plate out. Undamaged plates go back into the pack; damaged soft or ceramic ones are lost. */
        unfit(i, quiet = false) {
            const s = this.slots[i];
            if (!s) return false;
            const t = TYPES[s.type];
            const whole = s.hp >= t.hp - 0.01;
            const keeps = whole || t.repair;
            if (keeps) this.mode.points[t.item] = (this.mode.points[t.item] || 0) + 1;
            this.slots[i] = null;
            if (!quiet) GM.toast(t.name + (keeps ? ' back in your pack.' : ' discarded (too damaged to keep).'));
            this.sync();
            return true;
        },

        /** Steel and composite plates come back from a dent or crack at a workbench. */
        repair(i) {
            const s = this.slots[i];
            const m = this.mode;
            if (!s) return false;
            const t = TYPES[s.type];
            if (!t.repair) return GM.toast(t.name + ' cannot be repaired; replace it.'), false;
            if (s.hp >= t.hp) return GM.toast(t.name + ' is already in full shape.'), false;
            if (!m.campaign.stationAvailable('bench')) return GM.toast('Stand within reach of a workbench to repair plates.'), false;
            if (!m.spend(t.repair)) return GM.toast('Repair needs ' + GM.amounts(t.repair) + '.'), false;
            s.hp = t.hp;
            BO.Sound?.playMelee?.();
            GM.toast(t.name + ' repaired.', '#a7f3d0');
            this.sync();
            return true;
        },

        /* ------------------------------------------------------------ hooks */
        patch() {
            const self = this;
            const m = this.mode;
            this._orig = { consume: m.consume };
            m.consume = function (id) {
                if (this.active && BO.Player.alive && (this.points[id] || 0) > 0) {
                    if (ITEM_TO_TYPE[id]) {
                        if (!self.fit(ITEM_TO_TYPE[id])) return false;
                        this.points[id]--;
                        this.campaign.hotbar?.reconcile?.();
                        return true;
                    }
                    if (id === 'obsidian_armor') {
                        // Retired rig from older saves: becomes two composite plates.
                        this.points[id]--;
                        self.fit('composite');
                        self.fit('composite');
                        GM.toast('Obsidian rig broken down into two composite plates.', '#bae6fd');
                        return true;
                    }
                    if (id === 'abyssal_armor') {
                        this.points[id]--;
                        for (let i = 0; i < SLOTS; i++) self.slots[i] = { type: 'composite', hp: TYPES.composite.hp };
                        const wp = BO.ZoneWorldPlus;
                        if (wp?.buffs) wp.buffs.fireWard = Math.max(wp.buffs.fireWard || 0, this.clock + 300);
                        BO.Sound?.playPerkBuy?.();
                        GM.toast('Abyssal rig: three fresh composite plates and five minutes of fire ward.', '#c4b5fd');
                        self.sync();
                        return true;
                    }
                }
                return self._orig.consume.call(this, id);
            };
        },

        unpatch() {
            if (this._orig && this.mode) this.mode.consume = this._orig.consume;
            this._orig = null;
        },

        speedMult() {
            const steel = this.slots ? this.slots.filter((s) => s && s.type === 'steel').length : 0;
            return 1 - steel * (TYPES.steel.slow || 0);
        },

        uiAct(cmd, arg) {
            const i = Number(arg);
            if (cmd === 'repair') this.repair(i);
            else if (cmd === 'remove') this.unfit(i);
            return true;
        },

        baseCards(ui) {
            const rows = this.slots.map((s, i) => {
                if (!s) return `<li><span>Slot ${i + 1}</span><em class="gm-muted">empty</em></li>`;
                const t = TYPES[s.type];
                const can = t.repair && s.hp < t.hp;
                return `<li><span style="color:${t.color}">${GM.esc(t.name)}</span>${ui.bar(s.hp / t.hp)}<em>${Math.round(s.hp)}/${t.hp} · ${Math.round(t.absorb * 100)}%</em>
                    ${can ? `<button class="sv-btn sm" data-act="gm" data-arg="armor.repair:${i}">Repair · ${GM.esc(GM.amounts(t.repair))}</button>` : ''}
                    <button class="sv-btn sm ghost" data-act="gm" data-arg="armor.remove:${i}">Remove</button></li>`;
            }).join('');
            const f = this.front();
            return [ui.section('Plate vest', `<ul class="gm-list">${rows}</ul><p class="gm-muted sm">Front plate absorbs ${f ? Math.round(TYPES[f.type].absorb * 100) : 0}% of each hit. Fit plates from your pack or hotbar. Steel and composite are repaired at a workbench.</p>`,
                Math.round(this.total()) + ' / ' + this.capacity())];
        },

        update() {
            const p = BO.Player;
            if (!this.mode || !p) return;
            if (!p.alive) {
                if (this.wasAlive) {
                    // Death: every plate takes a beating.
                    for (let i = 0; i < SLOTS; i++) {
                        const s = this.slots[i];
                        if (!s || s.hp <= 0) continue;
                        s.hp = Math.max(0, s.hp - TYPES[s.type].hp * DEATH_WEAR);
                        if (s.hp <= 0) this.depleted(i);
                    }
                }
                this.wasAlive = false;
                return;
            }
            if (!this.wasAlive) { this.wasAlive = true; this.sync(); return; }
            const now = p.armor || 0;
            if (now < this.lastTotal - 0.001) {
                this.drain(this.lastTotal - now);
                this.sync();
            } else if (Math.abs(now - this.lastTotal) > 0.001 || p.maxArmor !== this.capacity()) {
                // Something else wrote armour directly: the vest is the source of truth.
                this.sync();
            }
        }
    };

    GM.register('armor', Armor);
})(window.BO);
