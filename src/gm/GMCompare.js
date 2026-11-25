/* ============================================================================
   BLACKOUT OPS — Survival Gold: gear comparison (BO.GM 'compare')
   · WEAPON PICKUPS: standing at a dropped weapon shows a card next to the
     crosshair with fixed stat rows (damage, fire rate, damage per second,
     magazine, reload, condition) and green ▲ / red ▼ against the weapon in
     your hands, so the swap decision takes half a second.
   · PLATES: the item detail panel compares a plate with the weakest plate in
     your vest.
============================================================================ */
(function (BO) {
    'use strict';
    const GM = BO.GM;

    const ROWS = [
        { k: 'dmg', label: 'Damage', fmt: (v) => v.toFixed(0), better: 'up' },
        { k: 'rpm', label: 'Fire rate', fmt: (v) => v.toFixed(0) + ' rpm', better: 'up', gun: true },
        { k: 'dps', label: 'Damage / s', fmt: (v) => v.toFixed(0), better: 'up', gun: true },
        { k: 'mag', label: 'Magazine', fmt: (v) => v.toFixed(0), better: 'up', gun: true },
        { k: 'rl', label: 'Reload', fmt: (v) => v.toFixed(2) + ' s', better: 'down', gun: true },
        { k: 'cond', label: 'Condition', fmt: (v) => v.toFixed(0) + '%', better: 'up' }
    ];

    const arrow = (a, b, better) => {
        if (b == null || Math.abs(a - b) < 0.005 * Math.max(1, Math.abs(b))) return '<i class="eq">=</i>';
        const up = a > b;
        const good = better === 'up' ? up : !up;
        return '<i class="' + (good ? 'up' : 'dn') + '">' + (up ? '▲' : '▼') + '</i>';
    };

    const Compare = {
        rate: 10,

        start(mode) {
            this.mode = mode;
            this.el = document.createElement('div');
            this.el.id = 'gm-compare';
            this.el.className = 'gm-compare hidden';
            document.body.appendChild(this.el);
        },

        stop() {
            this.el?.remove();
            this.el = null;
            this.mode = null;
        },

        /** Stats of a dropped weapon, using the same rarity multiplier the game applies when you take it. */
        pickupStats(pk) {
            const spec = BO.WeaponsData.get(pk.id);
            if (!spec) return null;
            const T = BO.ZoneThrill;
            const r = T?.RARITY?.find?.((x) => x.id === pk.roll?.rarity) || { dmg: 1, name: 'Common', css: '#c9cdd2' };
            const perks = pk.roll?.perks || [];
            const melee = spec.kind === 'melee';
            const dmg = spec.damage * (r.dmg || 1) * (perks.includes('hollow') ? 1.15 : 1);
            const rpm = melee ? 0 : spec.rpm * (perks.includes('hair') ? 1.15 : 1);
            const mag = melee ? 0 : Math.round(spec.magSize * (perks.includes('extended') ? 1.4 : 1));
            const rl = melee ? 0 : (spec.reloadTime || 1.8) * (perks.includes('speedload') ? 0.7 : 1);
            return { name: spec.name, melee, dmg, rpm, dps: dmg * rpm / 60, mag, rl, cond: Math.min(100, pk.cond), rarity: r };
        },

        heldStats() {
            const w = BO.Player.activeWeapon;
            if (!w?.stats) return null;
            const s = w.stats;
            const melee = s.kind === 'melee';
            return { name: s.shortName || s.name, melee, dmg: s.damage, rpm: melee ? 0 : s.rpm, dps: melee ? 0 : s.damage * s.rpm / 60, mag: melee ? 0 : s.magSize, rl: melee ? 0 : s.reloadTime, cond: w.cond ?? 100, rarity: BO.ZoneThrill?.rarityOf?.(w) };
        },

        render(pk) {
            const a = this.pickupStats(pk);
            if (!a) return '';
            const b = this.heldStats();
            const rows = ROWS.filter((r) => !(r.gun && (a.melee || b?.melee))).map((r) => {
                const bv = b ? b[r.k] : null;
                return '<div class="row"><span>' + r.label + '</span><b>' + r.fmt(a[r.k]) + '</b>' + arrow(a[r.k], bv, r.better) + '<em>' + (bv == null ? '—' : r.fmt(bv)) + '</em></div>';
            }).join('');
            const traits = (pk.roll?.perks || []).length ? '<p class="traits">' + GM.esc(BO.ZoneThrill.describe(pk.roll, '').traits.join(' · ')) + '</p>' : '';
            return '<header><span style="color:' + a.rarity.css + '">' + GM.esc(a.rarity.name) + '</span> ' + GM.esc(a.name) + '</header>' + traits +
                '<div class="cols"><span></span><small>ground</small><span></span><small>' + GM.esc(b ? b.name : 'empty hands') + '</small></div>' + rows;
        },

        /** Detail-panel line for a plate item: how it compares with your weakest fitted plate. */
        plateHtml(id) {
            const A = GM.get('armor');
            const types = { plate_ceramic: ['Ceramic', 55, 0.7], plate_steel: ['Steel', 75, 0.6], plate_composite: ['Composite', 95, 0.75], leather_armor: ['Leather', 35, 0.45], hide_armor: ['Bone & hide', 50, 0.5] };
            const t = types[id];
            if (!t || !A?.slots) return '';
            const filled = A.slots.filter(Boolean);
            const weakest = filled.length < 3 ? null : filled.reduce((w, s) => (s.hp < w.hp ? s : w));
            const vs = weakest ? weakest.hp : 0;
            return '<div class="gm-plate-cmp"><span>Protection</span><b>' + t[1] + '</b>' + arrow(t[1], vs, 'up') + '<em>' + (weakest ? Math.round(vs) + ' left on your weakest plate' : 'a vest slot is free') + '</em>' +
                '<span>Absorbs</span><b>' + Math.round(t[2] * 100) + '%</b><i class="eq"></i><em>of each hit while it is the front plate</em></div>';
        },

        update() {
            const m = this.mode;
            const el = this.el;
            if (!m || !el) return;
            const near = m.near;
            const pk = near && String(near.id).startsWith('wpn:') && !BO.SurvivalUI?.open ? m.loot?.pickups?.get(near.id) : null;
            if (!pk) { el.classList.add('hidden'); this._key = null; return; }
            const key = near.id + ':' + (BO.Player.activeSlot);
            if (key !== this._key) { el.innerHTML = this.render(pk); this._key = key; }
            el.classList.remove('hidden');
        }
    };

    GM.register('compare', Compare);
})(window.BO);
