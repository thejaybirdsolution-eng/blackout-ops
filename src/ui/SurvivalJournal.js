/* ============================================================================
   BLACKOUT OPS — Survival Journal (start menu)
   The complete Survival encyclopedia, readable before you ever deploy: every
   system, how it works, where to do it and why. Opens from the main menu and
   from the Survival deploy screen; it is the same searchable Field Guide that
   is available in-game.
============================================================================ */
(function (BO) {
    'use strict';

    const SurvivalJournal = {
        cat: 'start',
        query: '',

        init() {
            const legendTile = document.getElementById('btn-menu-legend');
            if (legendTile && !document.getElementById('btn-menu-svjournal')) {
                const b = document.createElement('button');
                b.className = 'mini-tile';
                b.id = 'btn-menu-svjournal';
                b.dataset.tipTitle = 'Survival Journal';
                b.dataset.tip = 'Everything about Survival mode: how each system works, where to find things and why they matter — animals, cooking, dungeons, bosses, quests, vehicles, building, options and more.';
                b.innerHTML = '<span class="mini-ico">📓</span><b>Survival Journal</b><small>Every Survival system explained</small>';
                b.onclick = () => { BO.Sound?.playUIClick?.(); this.open(); };
                legendTile.after(b);
            }
            const lobby = document.getElementById('lobby-open-legend');
            if (lobby && !document.getElementById('lobby-open-svjournal')) {
                const b = lobby.cloneNode(true);
                b.id = 'lobby-open-svjournal';
                b.textContent = 'Survival Journal';
                b.title = 'Open the full Survival Journal';
                b.onclick = () => { BO.Sound?.playUIClick?.(); this.open(); };
                lobby.after(b);
            }
        },

        open(cat) {
            if (!BO.SurvivalLegend) return;
            if (cat) this.cat = cat;
            if (!this.el) {
                this.el = document.createElement('div');
                this.el.id = 'sv-journal';
                this.el.addEventListener('click', (e) => {
                    if (e.target === this.el || e.target.closest('[data-svj-close]')) return this.close();
                    const c = e.target.closest('[data-act="legendCat"]');
                    if (c) { this.cat = c.dataset.arg; this.query = ''; this.render(); }
                });
                this.el.addEventListener('input', (e) => {
                    if (e.target.id !== 'survival-legend-search') return;
                    this.query = e.target.value;
                    const res = this.el.querySelector('#survival-legend-results');
                    if (res) { res.innerHTML = BO.SurvivalLegend.renderResults(this.query, this.cat); BO.SurvivalLegend.hydrate(res); }
                });
                this.onKey = (e) => { if (e.code === 'Escape' && this.el?.isConnected) { e.stopPropagation(); this.close(); } };
            }
            document.body.appendChild(this.el);
            window.addEventListener('keydown', this.onKey, true);
            this.render();
        },

        render() {
            this.el.innerHTML = `<div class="svj-in"><header><div><span class="sv-kicker">BLACKOUT OPS · SURVIVAL</span><h2>Survival Journal</h2><p>How every part of Survival works, where to find it and why it matters. The same guide is in-game under ${BO.Settings.keyLabel(BO.Settings.getKeybinds().survLegend || 'KeyL')}.</p></div><button class="sv-btn" data-svj-close>Close · Esc</button></header>
                <div class="svj-body">${BO.SurvivalLegend.render(this.query, this.cat)}</div></div>`;
            BO.SurvivalLegend.hydrate(this.el);
        },

        close() {
            this.el?.remove();
            window.removeEventListener('keydown', this.onKey, true);
        }
    };

    BO.SurvivalJournal = SurvivalJournal;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => SurvivalJournal.init());
    else setTimeout(() => SurvivalJournal.init(), 0);
})(window.BO);
