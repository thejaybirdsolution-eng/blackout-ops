/* ============================================================================
   BLACKOUT OPS — Survival 10-slot hotbar.
   Each slot holds a weapon, a tool or a usable item; an empty slot is bare hands.
   Number keys (rebindable) select a slot and the mouse wheel cycles all ten.
============================================================================ */
(function (BO) {
    'use strict';

    const SIZE = 10;
    /** Items that can be held on the hotbar and used with the fire button. */
    const USABLE = new Set([
        'medkits', 'rations', 'bandage', 'freshWater', 'tea', 'stew', 'espresso', 'antibiotic', 'broth',
        'aetherStim', 'orbitalFlare', 'jugBrew', 'speedTonic', 'staminElixir', 'deadshotTinc',
        'filter', 'repair', 'torch', 'lantern'
    ]);

    const same = (a, b) => !!a && !!b && a.kind === b.kind && (a.kind === 'weapon' ? a.ref === b.ref : a.id === b.id);

    class SurvivalHotbar {
        constructor(campaign) {
            this.campaign = campaign;
            this.mode = campaign.mode;
            this.slots = new Array(SIZE).fill(null);
            this.selected = 0;
            this.nextUse = 0;
            this.seen = new Set();
            this.version = 0;
        }

        static get usable() { return USABLE; }
        get size() { return SIZE; }
        get held() { return this.slots[this.selected] || null; }
        get heldTool() {
            const e = this.held;
            return e?.kind === 'tool' && this.campaign.pack.tools[e.id] > 0 ? e.id : null;
        }

        setup(saved) {
            const p = BO.Player;
            if (saved && Array.isArray(saved.slots)) {
                this.slots = saved.slots.slice(0, SIZE).map((e) => (e && ['weapon', 'tool', 'item'].includes(e.kind) ? { ...e } : null));
                while (this.slots.length < SIZE) this.slots.push(null);
                this.seen = new Set(saved.seen || []);
                this.selected = BO.Math.clamp(saved.selected | 0, 0, SIZE - 1);
            } else {
                this.slots.fill(null);
                p.weapons.forEach((w, i) => { if (i < 2) this.slots[i] = { kind: 'weapon', ref: i }; });
                this.selected = p.activeSlot === -1 ? 2 : Math.max(0, p.activeSlot);
                // Starting supplies are already in the pack: remember them so they are offered once.
                for (const id of Object.keys(this.campaign.pack.inventory)) {
                    if (USABLE.has(id) && this.campaign.pack.inventory[id] > 0) this._autoAdd({ kind: 'item', id });
                }
            }
            this.reconcile(true);
            this.apply(true);
        }

        entryValid(e) {
            if (!e) return false;
            if (e.kind === 'weapon') return !!BO.Player.weapons[e.ref];
            if (e.kind === 'tool') return this.campaign.pack.tools[e.id] !== undefined;
            if (e.kind === 'item') return (this.campaign.pack.inventory[e.id] || 0) > 0;
            return false;
        }

        indexOf(entry) { return this.slots.findIndex((s) => same(s, entry)); }

        _autoAdd(entry) {
            const key = entry.kind + ':' + (entry.kind === 'weapon' ? entry.ref : entry.id);
            if (this.indexOf(entry) >= 0) { this.seen.add(key); return; }
            if (this.seen.has(key) && entry.kind !== 'weapon') return;
            // Slot 3 stays free for bare hands until everything else is full.
            const order = [3, 4, 5, 6, 7, 8, 9, 0, 1];
            const free = order.find((i) => !this.slots[i]);
            if (free === undefined) return;
            this.slots[free] = entry;
            this.seen.add(key);
            this.version++;
        }

        /** Keeps slots in sync with the pack, tools and weapons. */
        reconcile(silent = false) {
            const p = BO.Player;
            const pack = this.campaign.pack;
            let changed = false;
            for (let i = 0; i < SIZE; i++) {
                const e = this.slots[i];
                if (e && !this.entryValid(e)) {
                    // Used up: forget it so the next pickup returns to the hotbar automatically.
                    if (e.kind === 'item') this.seen.delete('item:' + e.id);
                    this.slots[i] = null;
                    changed = true;
                }
            }
            p.weapons.forEach((w, ref) => { if (this.indexOf({ kind: 'weapon', ref }) < 0) this._autoAdd({ kind: 'weapon', ref }); });
            for (const id of Object.keys(pack.tools)) this._autoAdd({ kind: 'tool', id });
            for (const [id, count] of Object.entries(pack.inventory)) {
                if (count > 0 && USABLE.has(id)) this._autoAdd({ kind: 'item', id });
            }
            // Follow weapon changes made by other systems (forging, depot pickups, restores).
            if (p.activeSlot >= 0 && !same(this.held, { kind: 'weapon', ref: p.activeSlot })) {
                const idx = this.indexOf({ kind: 'weapon', ref: p.activeSlot });
                if (idx >= 0) {
                    this.selected = idx;
                    changed = true;
                }
            }
            if (changed) {
                this.version++;
                if (!silent) this.apply();
            }
        }

        /** Pushes the selected slot to the player controller. */
        apply(force = false) {
            const p = BO.Player;
            const e = this.held;
            const pack = this.campaign.pack;
            if (e?.kind === 'weapon' && p.weapons[e.ref]) {
                p.equipSurvivalSlot(e.ref, null, force);
            } else if (e?.kind === 'tool' && pack.tools[e.id] !== undefined) {
                if (pack.tools[e.id] > 0) pack.equipped = e.id;
                p.equipSurvivalSlot(-1, { kind: 'tool', id: e.id, broken: !(pack.tools[e.id] > 0) }, force);
            } else if (e?.kind === 'item') {
                p.equipSurvivalSlot(-1, { kind: 'item', id: e.id }, force);
            } else {
                p.equipSurvivalSlot(-1, null, force);
            }
        }

        select(index) {
            if (!Number.isInteger(index) || index < 0 || index >= SIZE) return;
            if (index === this.selected && !this.mode.rider) return;
            this.selected = index;
            this.version++;
            this.apply();
            BO.Sound?.playUIClick?.();
        }

        cycle(dir) {
            this.selected = (this.selected + (dir > 0 ? 1 : -1) + SIZE) % SIZE;
            this.version++;
            this.apply();
        }

        assign(index, entry) {
            if (index < 0 || index >= SIZE) return false;
            if (entry && !this.entryValid(entry)) return false;
            const from = entry ? this.indexOf(entry) : -1;
            const previous = this.slots[index];
            if (from >= 0) this.slots[from] = previous;
            this.slots[index] = entry ? { ...entry } : null;
            if (entry) this.seen.add(entry.kind + ':' + (entry.kind === 'weapon' ? entry.ref : entry.id));
            this.version++;
            if (index === this.selected || from === this.selected) this.apply();
            return true;
        }

        move(from, to) {
            if (from === to || from < 0 || to < 0 || from >= SIZE || to >= SIZE) return;
            [this.slots[from], this.slots[to]] = [this.slots[to], this.slots[from]];
            if (this.selected === from) this.selected = to;
            else if (this.selected === to) this.selected = from;
            this.version++;
            this.apply();
        }

        clear(index) {
            if (!this.slots[index]) return;
            this.slots[index] = null;
            this.version++;
            if (index === this.selected) this.apply();
        }

        /** Fire button with an item selected: consume one. */
        useSelected() {
            const e = this.held;
            const m = this.mode;
            if (e?.kind !== 'item' || m.clock < this.nextUse) return false;
            this.nextUse = m.clock + 0.6;
            const ok = m.consume(e.id);
            if (ok) {
                BO.Player.meleeTimer = Math.max(BO.Player.meleeTimer, 0.3);
                BO.Player.meleeDur = 0.3;
            }
            this.reconcile();
            return ok;
        }

        label(entry) {
            if (!entry) return 'Bare hands';
            if (entry.kind === 'weapon') {
                const w = BO.Player.weapons[entry.ref];
                return w ? (w.stats.shortName || w.stats.name) + (w.survivalMk > 1 ? ' Mk ' + w.survivalMk : '') : 'Empty';
            }
            if (entry.kind === 'tool') return BO.SurvivalFrontierData.tools[entry.id]?.name || entry.id;
            return BO.SurvivalItemName(entry.id);
        }

        snapshot() {
            return { slots: this.slots.map((e) => (e ? { ...e } : null)), selected: this.selected, seen: [...this.seen] };
        }
    }

    BO.SurvivalHotbar = SurvivalHotbar;
})(window.BO);
