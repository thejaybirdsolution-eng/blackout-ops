/* ============================================================================
   BLACKOUT OPS — Survival Gold: room types (BO.GM 'rooms')
   A Shelter (walls, roof and a door, found by gm/GMNight.js) takes a purpose
   from what you put inside it. One room can hold several purposes.
   · WORKSHOP   bench + storage     Guns and tools you carry are maintained back
                                    up to 75% condition while you are inside.
   · KITCHEN    cooking fire + storage  Every second dish cooked here comes out
                                    double.
   · INFIRMARY  two beds            Bleeding stops and health regenerates
                                    2 HP/s while no hostile is within 15 m.
   · STOREROOM  four storage pieces Quick-stack reaches every chest within 25 m.
   · ARMORY     armoury bench       Leaving it, your guns are Oiled for 10 min:
                                    half the wear and half the jam risk.
   The Base screen lists every room, its purposes and what each one is missing.
============================================================================ */
(function (BO) {
    'use strict';
    const GM = BO.GM;

    const STORAGE = new Set(['chest', 'supplyCrate', 'ironVault']);
    const COOK = new Set(['campfire', 'firepit', 'smoker']);
    const TYPES = [
        { id: 'workshop', name: 'Workshop', glyph: '⚒', color: '#fbbf24', needs: [['bench', 'a workbench', (n) => n.bench >= 1], ['storage', 'a chest', (n) => n.storage >= 1]],
            effect: 'Guns and tools you carry are maintained up to 75% condition while you are inside.' },
        { id: 'kitchen', name: 'Kitchen', glyph: '♨', color: '#fb923c', needs: [['cook', 'a campfire, fire pit or smoker', (n) => n.cook >= 1], ['storage', 'a chest (pantry)', (n) => n.storage >= 1]],
            effect: 'Every second dish you cook here comes out double.' },
        { id: 'infirmary', name: 'Infirmary', glyph: '✚', color: '#f87171', needs: [['bed', 'two beds', (n) => n.bed >= 2]],
            effect: 'Bleeding stops and health regenerates 2 HP per second while no hostile is within 15 m.' },
        { id: 'storeroom', name: 'Storeroom', glyph: '▤', color: '#93c5fd', needs: [['storage', 'four storage pieces', (n) => n.storage >= 4]],
            effect: 'Quick-stack from inside reaches every chest within 25 m.' },
        { id: 'armory', name: 'Armory', glyph: '⛨', color: '#a3e635', needs: [['armoryBench', 'an armoury bench', (n) => n.armoryBench >= 1]],
            effect: 'Leave with your guns Oiled for 10 minutes: half the wear and half the jam risk.' }
    ];
    const TYPE = Object.fromEntries(TYPES.map((t) => [t.id, t]));
    for (const t of TYPES) GM.STATUS[t.id] = { name: t.name, color: t.color, glyph: t.glyph, bad: false, tip: t.name + ': ' + t.effect };
    GM.STATUS.oiled = { name: 'Oiled', color: '#a3e635', glyph: '🛢', bad: false, tip: 'Fresh from the Armory: guns wear half as fast and jam half as often.' };

    const OILED_SECONDS = 600;
    const MAINTAIN_CAP = 75;

    const Rooms = {
        rate: 2,
        TYPES,

        start(mode, saved) {
            this.mode = mode;
            this.list = [];
            this.here = [];
            this.dishes = saved?.dishes || 0;
            this.patch();
        },

        stop() {
            this.unpatch();
            this.mode = null;
            this.list = [];
            this.here = [];
        },

        snapshot() { return { dishes: this.dishes }; },

        /* ------------------------------------------------ classification */
        contents(room, night) {
            const n = { bench: 0, storage: 0, cook: 0, bed: 0, armoryBench: 0 };
            for (const p of this.mode.campaign.placed) {
                if (!p.alive || !night.cellOf(room, p.x, p.y, p.z)) continue;
                if (p.type === 'bench') n.bench++;
                else if (p.type === 'armoryBench') n.armoryBench++;
                else if (p.type === 'bed') n.bed++;
                if (STORAGE.has(p.type)) n.storage++;
                if (COOK.has(p.type)) n.cook++;
            }
            return n;
        },

        classify() {
            const night = GM.get('night');
            const rooms = (night?.rooms || []).filter((r) => r.door);
            const before = new Set(this.list.flatMap((r) => r.types));
            this.list = rooms.map((room) => {
                const n = this.contents(room, night);
                const types = TYPES.filter((t) => t.needs.every(([, , ok]) => ok(n))).map((t) => t.id);
                return { room, n, types, size: room.cells.length, safe: !!room.safe };
            });
            for (const id of new Set(this.list.flatMap((r) => r.types))) {
                if (!before.has(id)) { const t = TYPE[id]; GM.first('room_' + id, t.name, t.effect); }
            }
            const p = BO.Player.pos;
            const inRoom = night?.roomAt?.(p.x, p.y, p.z);
            const entry = inRoom ? this.list.find((r) => r.room === inRoom) : null;
            this.here = entry ? entry.types : [];
        },

        isIn(id) { return this.here.includes(id); },

        /* ------------------------------------------------ patches */
        patch() {
            const self = this;
            const pack = this.mode.campaign.pack;
            const F = BO.SurvivalFrontierData;
            this._orig = { craft: pack.craft };
            // Kitchen: every second dish cooked inside comes out double.
            pack.craft = function (id) {
                const recipe = this.recipe(id);
                const ok = self._orig.craft.call(this, id);
                if (ok && recipe?.gain && self.isIn('kitchen') && (recipe.station === 'campfire' || recipe.station === 'cookstation' || recipe.station === 'smoker')) {
                    const food = Object.entries(recipe.gain).filter(([g]) => F.items[g]?.[1] === 'Food');
                    if (food.length) {
                        self.dishes++;
                        if (self.dishes % 2 === 0) {
                            const extra = Object.fromEntries(food);
                            this.receive(extra, false);
                            GM.toast('Kitchen: the pot stretched to an extra ' + GM.amounts(extra) + '.', TYPE.kitchen.color);
                        }
                    }
                }
                return ok;
            };
        },

        unpatch() {
            const pack = this.mode?.campaign?.pack;
            if (pack && this._orig) pack.craft = this._orig.craft;
            this._orig = null;
        },

        /** Quick-stack radius for gm/GMStorage.js. */
        quickRange(base) { return this.isIn('storeroom') ? Math.max(base, 25) : base; },

        /** Gun wear and jam multiplier for SurvivalMode (Armory 'Oiled'). */
        gunWearMult() { return GM.hasStatus('oiled') ? 0.5 : 1; },

        /* ------------------------------------------------ frame */
        update(dt) {
            const m = this.mode;
            if (!m?.active) return;
            this.classify();
            const p = BO.Player;
            for (const id of this.here) GM.setStatus(id, { until: m.clock + 1.2 });
            if (!p.alive) return;
            if (this.isIn('armory')) GM.setStatus('oiled', { until: m.clock + OILED_SECONDS, total: OILED_SECONDS });
            if (this.isIn('workshop')) {
                for (const w of p.weapons) {
                    if (!w || w.stats?.kind === 'melee' || w.cond == null) continue;
                    const cap = Math.min(MAINTAIN_CAP, w.maxCond ?? 100);
                    if (w.cond < cap) w.cond = Math.min(cap, w.cond + 0.6 * dt);
                }
                const pack = m.campaign.pack;
                const tools = BO.SurvivalFrontierData?.tools || {};
                for (const [id, left] of Object.entries(pack.tools || {})) {
                    const max = tools[id]?.wear;
                    if (!max || !(left > 0)) continue;
                    const cap = max * MAINTAIN_CAP / 100;
                    if (left < cap) pack.tools[id] = Math.min(cap, left + max * 0.006 * dt);
                }
            }
            if (this.isIn('infirmary')) {
                const threat = [...(m.zombies || []), ...(m.bots || [])].some((u) => u.alive && u.team !== 0 && u.pos.distanceTo(p.pos) < 15);
                if (!threat) {
                    const deep = m.campaign.deep;
                    if (deep?.bleeding > 0) { deep.bleeding = 0; GM.toast('Infirmary: bleeding stopped.', TYPE.infirmary.color); }
                    if (p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + 2 * dt);
                }
            }
        },

        /* ------------------------------------------------ UI */
        hudChips() {
            if (!this.here.length) return [];
            return [{ text: this.here.map((id) => TYPE[id].name.toUpperCase()).join(' · '), cls: 'good' }];
        },

        baseCards(ui) {
            const esc = GM.esc;
            const rows = this.list.map((r, i) => {
                const have = r.types.map((id) => `<b style="color:${TYPE[id].color}">${TYPE[id].glyph} ${TYPE[id].name}</b>`).join(' · ') || '<em class="gm-muted">no purpose yet</em>';
                // The cheapest purposes to add next: types with exactly one missing need.
                const next = TYPES.filter((t) => !r.types.includes(t.id)).map((t) => [t, t.needs.filter(([, , ok]) => !ok(r.n))]).filter(([, miss]) => miss.length === 1)
                    .map(([t, miss]) => 'add ' + miss[0][1] + ' → ' + t.name).slice(0, 2);
                return `<li><span>Room ${i + 1}${r.safe ? ' · Safe' : ''} · ${r.size} tile${r.size === 1 ? '' : 's'}</span><em>${have}</em>${next.length ? `<small class="gm-muted">${esc(next.join(' · '))}</small>` : ''}</li>`;
            }).join('');
            const guide = TYPES.map((t) => `<li><span style="color:${t.color}">${t.glyph} ${esc(t.name)}</span><em>${esc(t.needs.map((x) => x[1]).join(' + '))}</em><small class="gm-muted">${esc(t.effect)}</small></li>`).join('');
            return [ui.section('Rooms', (rows ? `<ul class="gm-list gm-rooms">${rows}</ul>` : '<p class="gm-muted">No shelters yet. Walls, a roof and a door make a room; what you put inside gives it a purpose.</p>') +
                `<details class="gm-rooms-guide"><summary>Room purposes</summary><ul class="gm-list">${guide}</ul></details>`, this.list.length + ' room' + (this.list.length === 1 ? '' : 's'))];
        }
    };

    GM.register('rooms', Rooms);
})(window.BO);
