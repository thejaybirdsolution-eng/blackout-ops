/* ============================================================================
   BLACKOUT OPS — Minigames · Daily Featured & Arcade Rank
   Every calendar day the hub features three courses from different
   categories, each with a star goal and a bonus XP payout. Clearing all three
   keeps a daily streak alive (+10% bonus per streak day, capped at +100%).
   Total stars across all 63 games also set an Arcade Rank shown in the hub.

   Picks are seeded from the local date, so every player sees the same three
   courses on the same day and they never change mid-day.
   Save: BO.Save.data.minigames.daily = { date, done: {id: true}, streak, lastFull }.
============================================================================ */
(function (BO) {
    'use strict';

    const MG = () => BO.Minigames;
    const SLOTS = [
        { cats: ['target'], goal: 3, xp: 650, label: 'Gold' },
        { cats: ['speed', 'arcade'], goal: 3, xp: 800, label: 'Gold' },
        { cats: ['fun', 'arcade', 'speed'], goal: 4, xp: 1100, label: 'Platinum' }
    ];
    const RANKS = [
        [0.9, 'Arcade Legend', '#f0abfc'], [0.7, 'Grand Champion', '#facc15'], [0.5, 'Sharpshooter', '#fb923c'],
        [0.3, 'Marksman', '#38bdf8'], [0.12, 'Contender', '#4ade80'], [0, 'Rookie', '#cbd5e1']
    ];

    function dateKey(d = new Date()) {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    function hash(str) {
        let h = 2166136261;
        for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
        return h >>> 0;
    }

    const Daily = {
        SLOTS,

        state() {
            const d = BO.Save.data;
            if (!d.minigames) d.minigames = { best: {}, plays: 0, skipCountdown: false };
            const m = d.minigames;
            if (!m.daily || typeof m.daily !== 'object') m.daily = { date: '', done: {}, streak: 0, lastFull: '' };
            const today = dateKey();
            if (m.daily.date !== today) { m.daily.date = today; m.daily.done = {}; }
            return m.daily;
        },

        /** Today's three featured courses: [{ def, goal, xp, label }]. */
        picks(key = dateKey()) {
            const out = [], used = new Set();
            SLOTS.forEach((slot, i) => {
                const pool = slot.cats.flatMap((c) => MG().list(c)).filter((d) => d && !used.has(d.id) && !d.noHighScore);
                if (!pool.length) return;
                const def = pool[hash(key + ':' + i) % pool.length];
                used.add(def.id);
                out.push({ def, goal: Math.min(slot.goal, (MG().starsOf(def, {}) || []).length || slot.goal), xp: slot.xp, label: slot.label });
            });
            return out;
        },

        streakBonus() { return Math.min(1, (this.state().streak || 0) * 0.1); },

        /** MinigameCore results hook: pays the bonus once per course per day. */
        onResults(def, res) {
            if (!def || !res) return null;
            const st = this.state();
            const pick = this.picks().find((p) => p.def.id === def.id);
            if (!pick || st.done[def.id] || res.stars < pick.goal) return null;
            st.done[def.id] = true;
            const xp = Math.round(pick.xp * (1 + this.streakBonus()));
            if (BO.Progression && BO.Progression.grantPlayerXP) BO.Progression.grantPlayerXP(xp, 'minigame');
            let full = false;
            if (this.picks().every((p) => st.done[p.def.id])) {
                const y = new Date(); y.setDate(y.getDate() - 1);
                st.streak = st.lastFull === dateKey(y) ? (st.streak || 0) + 1 : 1;
                st.lastFull = st.date;
                full = true;
            }
            BO.Save.save();
            BO.Events.emit('hud:banner', { title: full ? 'DAILY SWEEP!' : 'DAILY FEATURED CLEARED', sub: def.name + ' · +' + xp + ' XP' + (full ? ' · streak ' + st.streak + ' day' + (st.streak === 1 ? '' : 's') : ''), color: '#facc15' });
            return { xp, full };
        },

        rank(got, max) {
            const f = max ? got / max : 0;
            const r = RANKS.find(([t]) => f >= t);
            const next = RANKS.slice().reverse().find(([t]) => t > f);
            return { name: r[1], color: r[2], next: next ? { name: next[1], need: Math.ceil(next[0] * max) - got } : null };
        },

        /** Hub nav block: rank + today's three featured courses. */
        navHtml(got, max, esc, catIcon) {
            const st = this.state();
            const rk = this.rank(got, max);
            const rows = this.picks().map((p) => {
                const done = !!st.done[p.def.id];
                return '<button class="mgh-daily-row ' + (done ? 'done' : '') + '" data-daily="' + p.def.id + '" data-dcat="' + p.def.cat + '" style="--mc:' + (p.def.accent || '#facc15') + '">' +
                    '<span class="mgh-daily-ico">' + (catIcon[p.def.cat] || '★') + '</span>' +
                    '<span class="mgh-daily-text"><b>' + esc(p.def.name) + '</b><small>' + (done ? 'Cleared · bonus paid' : p.label + ' (' + p.goal + '★) · +' + Math.round(p.xp * (1 + this.streakBonus())) + ' XP') + '</small></span>' +
                    '<span class="mgh-daily-state">' + (done ? '✓' : '›') + '</span></button>';
            }).join('');
            return '<div class="mgh-rank" style="--rk:' + rk.color + '"><small>ARCADE RANK</small><b>' + rk.name + '</b>' +
                (rk.next ? '<em>' + rk.next.need + '★ to ' + rk.next.name + '</em>' : '<em>Every star collected</em>') + '</div>' +
                '<div class="mgh-daily"><div class="mgh-daily-head"><b>DAILY FEATURED</b><small>' + (st.streak ? '🔥 ' + st.streak + '-day streak · +' + Math.round(this.streakBonus() * 100) + '% XP' : 'Clear all three to start a streak') + '</small></div>' + rows + '</div>';
        },

        dateKey
    };

    BO.MinigameDaily = Daily;
})(window.BO);
