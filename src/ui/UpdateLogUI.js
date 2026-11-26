/* ============================================================================
   BLACKOUT OPS — Update Log UI (Home Screen Preview + Full 79-Update Modal)
   ============================================================================ */
(function (global) {
    'use strict';
    const BO = global.BO = global.BO || {};

    const DAY_FILTERS = [
        { id: 'all', label: 'All Days' },
        { id: '2026-11-25', label: 'Nov 25' },
        { id: '2026-11-24', label: 'Nov 24' },
        { id: '2026-11-23', label: 'Nov 23' },
        { id: '2026-11-22', label: 'Nov 22' }
    ];

    const CAT_FILTERS = [
        { id: 'all', label: 'All' },
        { id: 'major', label: 'Milestones' },
        { id: 'survival', label: 'Survival' },
        { id: 'minigames', label: 'Minigames' },
        { id: 'rogue', label: 'Rogue Lite' },
        { id: 'owrpg', label: 'Open World RPG' },
        { id: 'zombies', label: 'Zombies' },
        { id: 'td', label: 'Tower Defense' },
        { id: 'mp', label: 'Multiplayer' },
        { id: 'engine', label: 'Engine & UI' }
    ];

    function esc(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function highlightText(str, query) {
        const safe = esc(str);
        if (!query) return safe;
        const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return safe.replace(new RegExp('(' + q + ')', 'gi'), '<mark class="ul-mark">$1</mark>');
    }

    const UpdateLogUI = {
        state: {
            cat: 'all',
            day: 'all',
            sort: 'desc',
            query: '',
            focusId: null
        },
        _bound: false,

        init() {
            this.renderHomePreview();
            this._bindModalEvents();
        },

        renderHomePreview() {
            const container = document.getElementById('menu-update-preview-list');
            const data = BO.UpdateLogData;
            if (!container || !data || !Array.isArray(data.updates)) return;

            const latest = data.updates.slice(-3).reverse();
            container.innerHTML = latest.map((u, idx) => {
                const firstPara = (u.blocks.find(b => b.type === 'p') || {}).text || '';
                const snippet = firstPara.length > 96 ? firstPara.slice(0, 93).trim() + '...' : firstPara;
                return (
                    '<button type="button" class="ul-prev-item' + (idx === 0 ? ' is-latest' : '') + '" data-uid="' + u.id + '">' +
                        '<div class="ul-prev-top">' +
                            '<span class="ul-prev-num">#' + u.id + (idx === 0 ? ' · LATEST' : '') + '</span>' +
                            '<span class="ul-prev-time">' + esc(u.date) + ' · ' + esc(u.time) + '</span>' +
                        '</div>' +
                        '<div class="ul-prev-title">' + esc(u.title) + '</div>' +
                        '<div class="ul-prev-desc">' + esc(snippet) + '</div>' +
                    '</button>'
                );
            }).join('');

            container.querySelectorAll('.ul-prev-item').forEach((btn) => {
                btn.onclick = () => {
                    if (BO.Sound) BO.Sound.playUIClick();
                    const uid = parseInt(btn.getAttribute('data-uid'), 10);
                    this.open(uid);
                };
            });
        },

        _bindModalEvents() {
            if (this._bound) return;
            this._bound = true;

            const modal = document.getElementById('modal-updates');
            const closeBtn = document.getElementById('btn-updates-close');
            const searchInput = document.getElementById('ul-search');
            const searchClear = document.getElementById('ul-search-clear');
            const sortBtn = document.getElementById('ul-sort-btn');

            if (closeBtn) {
                closeBtn.onclick = () => {
                    if (BO.Sound) BO.Sound.playUIClick();
                    this.close();
                };
            }
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) this.close();
                });
            }
            if (searchInput) {
                searchInput.addEventListener('input', () => {
                    this.state.query = searchInput.value.trim();
                    this.state.focusId = null;
                    if (searchClear) searchClear.classList.toggle('hidden', !this.state.query);
                    this.renderList();
                });
            }
            if (searchClear && searchInput) {
                searchClear.onclick = () => {
                    searchInput.value = '';
                    this.state.query = '';
                    searchClear.classList.add('hidden');
                    this.renderList();
                    searchInput.focus();
                };
            }
            if (sortBtn) {
                sortBtn.onclick = () => {
                    if (BO.Sound) BO.Sound.playUIClick();
                    this.state.sort = this.state.sort === 'desc' ? 'asc' : 'desc';
                    this.state.focusId = null;
                    this.renderControls();
                    this.renderList();
                };
            }
        },

        open(focusId) {
            const modal = document.getElementById('modal-updates');
            if (!modal) return;
            this._bindModalEvents();
            this.state.focusId = focusId || null;
            if (focusId) {
                this.state.cat = 'all';
                this.state.day = 'all';
                this.state.query = '';
                const s = document.getElementById('ul-search');
                const c = document.getElementById('ul-search-clear');
                if (s) s.value = '';
                if (c) c.classList.add('hidden');
            }
            modal.classList.remove('hidden');
            this.renderControls();
            this.renderList();
            if (focusId) {
                requestAnimationFrame(() => {
                    const target = document.getElementById('ul-card-' + focusId);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        target.classList.add('is-focused');
                        setTimeout(() => target.classList.remove('is-focused'), 1800);
                    }
                });
            }
        },

        close() {
            const modal = document.getElementById('modal-updates');
            if (modal) modal.classList.add('hidden');
        },

        _getFiltered() {
            const data = BO.UpdateLogData;
            if (!data) return [];
            const q = this.state.query.toLowerCase();

            let list = data.updates.filter((u) => {
                if (this.state.day !== 'all' && u.dayKey !== this.state.day) return false;
                if (this.state.cat === 'major' && !u.major) return false;
                if (this.state.cat !== 'all' && this.state.cat !== 'major') {
                    if (!u.tags || !u.tags.includes(this.state.cat)) return false;
                }
                if (q) {
                    const haystack = (
                        'update ' + u.id + ' #' + u.id + ' ' +
                        u.hash + ' ' + u.title + ' ' + u.fullDate + ' ' +
                        u.blocks.map(b => b.type === 'p' ? b.text : b.items.join(' ')).join(' ')
                    ).toLowerCase();
                    if (!haystack.includes(q)) return false;
                }
                return true;
            });

            if (this.state.sort === 'desc') {
                list = list.slice().reverse();
            }
            return list;
        },

        renderControls() {
            const data = BO.UpdateLogData;
            if (!data) return;

            const catWrap = document.getElementById('ul-cat-pills');
            if (catWrap) {
                catWrap.innerHTML = CAT_FILTERS.map((f) => {
                    let count = data.updates.length;
                    if (f.id === 'major') count = data.updates.filter(u => u.major).length;
                    else if (f.id !== 'all') count = data.updates.filter(u => u.tags && u.tags.includes(f.id)).length;
                    const active = this.state.cat === f.id ? ' is-active' : '';
                    return '<button type="button" class="ul-pill' + active + '" data-cat="' + f.id + '">' +
                        esc(f.label) + ' <span>' + count + '</span></button>';
                }).join('');
                catWrap.querySelectorAll('.ul-pill').forEach((btn) => {
                    btn.onclick = () => {
                        if (BO.Sound) BO.Sound.playUIClick();
                        this.state.cat = btn.getAttribute('data-cat');
                        this.state.focusId = null;
                        this.renderControls();
                        this.renderList();
                    };
                });
            }

            const dayWrap = document.getElementById('ul-day-pills');
            if (dayWrap) {
                dayWrap.innerHTML = DAY_FILTERS.map((d) => {
                    const active = this.state.day === d.id ? ' is-active' : '';
                    return '<button type="button" class="ul-pill ul-pill-day' + active + '" data-day="' + d.id + '">' +
                        esc(d.label) + '</button>';
                }).join('');
                dayWrap.querySelectorAll('.ul-pill').forEach((btn) => {
                    btn.onclick = () => {
                        if (BO.Sound) BO.Sound.playUIClick();
                        this.state.day = btn.getAttribute('data-day');
                        this.state.focusId = null;
                        this.renderControls();
                        this.renderList();
                    };
                });
            }

            const sortBtn = document.getElementById('ul-sort-btn');
            if (sortBtn) {
                sortBtn.textContent = this.state.sort === 'desc' ? '↓ NEWEST FIRST' : '↑ OLDEST FIRST';
            }
        },

        renderList() {
            const data = BO.UpdateLogData;
            const listEl = document.getElementById('ul-list');
            const countEl = document.getElementById('ul-count');
            if (!data || !listEl) return;

            const filtered = this._getFiltered();
            const q = this.state.query;

            if (countEl) {
                countEl.textContent = 'Showing ' + filtered.length + ' of ' + data.updates.length + ' updates';
            }

            if (filtered.length === 0) {
                listEl.innerHTML =
                    '<div class="ul-empty">' +
                        '<div class="ul-empty-ico">◈</div>' +
                        '<b>No matching updates</b>' +
                        '<small>Try clearing your search or switching category/day filters.</small>' +
                        '<button type="button" class="btn btn-sm btn-primary" id="ul-reset-filters">RESET FILTERS</button>' +
                    '</div>';
                const resetBtn = document.getElementById('ul-reset-filters');
                if (resetBtn) {
                    resetBtn.onclick = () => {
                        this.state.cat = 'all';
                        this.state.day = 'all';
                        this.state.query = '';
                        const s = document.getElementById('ul-search');
                        const c = document.getElementById('ul-search-clear');
                        if (s) s.value = '';
                        if (c) c.classList.add('hidden');
                        this.renderControls();
                        this.renderList();
                    };
                }
                return;
            }

            const tagMeta = data.tagMeta || {};
            const latestId = data.updates.length ? data.updates[data.updates.length - 1].id : 0;
            listEl.innerHTML = filtered.map((u) => {
                const tagsHtml = (u.tags || []).map((t) => {
                    const meta = tagMeta[t] || { label: t, color: '#94a3b8' };
                    return '<span class="ul-tag" style="--tc:' + meta.color + '">' + esc(meta.label) + '</span>';
                }).join('');

                const bodyHtml = u.blocks.map((b) => {
                    if (b.type === 'p') {
                        return '<p>' + highlightText(b.text, q) + '</p>';
                    }
                    if (b.type === 'ul') {
                        return '<ul>' + b.items.map(it => '<li>' + highlightText(it, q) + '</li>').join('') + '</ul>';
                    }
                    return '';
                }).join('');

                return (
                    '<article class="ul-card' + (u.major ? ' is-major' : '') + (u.id === latestId ? ' is-head' : '') + '" id="ul-card-' + u.id + '">' +
                        '<div class="ul-rail-dot" aria-hidden="true"></div>' +
                        '<div class="ul-card-head">' +
                            '<div class="ul-card-id-row">' +
                                '<span class="ul-num">UPDATE #' + u.id + '</span>' +
                                (u.id === latestId ? '<span class="ul-badge-live">LATEST</span>' : '') +
                                (u.major ? '<span class="ul-badge-major">★ MILESTONE</span>' : '') +
                                '<code class="ul-hash">' + esc(u.hash) + '</code>' +
                            '</div>' +
                            '<div class="ul-card-date">' + esc(u.fullDate) + ' · ' + esc(u.time) + '</div>' +
                        '</div>' +
                        '<h3 class="ul-card-title">' + highlightText(u.title, q) + '</h3>' +
                        '<div class="ul-card-tags">' + tagsHtml + '</div>' +
                        '<div class="ul-card-body">' + bodyHtml + '</div>' +
                    '</article>'
                );
            }).join('');
        }
    };

    BO.UpdateLogUI = UpdateLogUI;
})(window);
