(function (BO) {
    'use strict';

    const TIER_META = {
        buff:      { label: 'BUFF',      color: '#22c55e', order: 0 },
        tactical:  { label: 'TACTICAL',  color: '#38bdf8', order: 1 },
        challenge: { label: 'CHALLENGE', color: '#f59e0b', order: 2 },
        chaos:     { label: 'CHAOS',     color: '#f43f5e', order: 3 }
    };

    const uiStateByMode = Object.create(null);

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function getState(mode) {
        if (!uiStateByMode[mode]) {
            uiStateByMode[mode] = { cat: 'all', q: '', onlyActive: false, tier: 'all' };
        }
        return uiStateByMode[mode];
    }

    function normalizeCategoryList(rawCats) {
        const list = Array.isArray(rawCats)
            ? rawCats
            : Object.entries(rawCats || {}).map(([id, c]) => ({ id, ...(c || {}) }));
        return list.map((c) => ({
            id: c.id,
            name: c.name || c.id,
            ico: c.icon || c.ico || '✦',
            color: c.col || c.color || '#38bdf8'
        }));
    }

    function normalizeBundleList(rawBundles) {
        const list = Array.isArray(rawBundles)
            ? rawBundles
            : Object.entries(rawBundles || {}).map(([id, b]) => ({ id, ...(b || {}) }));
        return list.map((b) => ({
            id: b.id,
            name: b.name || b.id,
            ico: b.icon || b.ico || '✦',
            desc: b.desc || '',
            mods: Array.isArray(b.keys) ? b.keys : (Array.isArray(b.mods) ? b.mods : [])
        }));
    }

    function normalizeModeData(mode) {
        if (mode === 'survival') {
            const rules = BO.SurvivalRules || {};
            const cats = normalizeCategoryList(rules.categories);
            const catMap = Object.create(null);
            for (const c of cats) catMap[c.id] = c;
            const defs = Object.entries(rules.modifiers || {}).map(([id, m]) => ({
                key: id,
                label: m.name || id,
                cat: m.group || 'world',
                tier: (m.tier && TIER_META[m.tier]) ? m.tier : 'tactical',
                ico: m.ico || '✦',
                exclusive: !!m.exclusive,
                desc: m.description || '',
                fx: m.fx || {}
            }));
            const bundles = normalizeBundleList(rules.bundles);
            return { defs, cats, catMap, bundles };
        }

        const modSys = BO.Mods || {};
        const rawDefs = typeof modSys.defsForMode === 'function'
            ? modSys.defsForMode(mode)
            : (typeof modSys.forMode === 'function' ? modSys.forMode(mode) : []);
        const cats = normalizeCategoryList(typeof modSys.categoriesForMode === 'function' ? modSys.categoriesForMode(mode) : []);
        const catMap = Object.create(null);
        for (const c of cats) catMap[c.id] = c;
        const defs = rawDefs.map((d) => ({
            key: d.k,
            label: d.lbl || d.k,
            cat: typeof modSys.categoryOf === 'function' ? modSys.categoryOf(d, mode) : (d.cat || 'combat'),
            tier: (d.tier && TIER_META[d.tier]) ? d.tier : 'tactical',
            ico: d.ico || '✦',
            exclusive: !!d.exclusive,
            desc: d.desc || '',
            fx: d.fx || {}
        }));
        const bundles = normalizeBundleList(typeof modSys.bundlesForMode === 'function' ? modSys.bundlesForMode(mode) : []);
        return { defs, cats, catMap, bundles };
    }

    function toActiveSet(active) {
        const set = new Set();
        if (Array.isArray(active)) {
            for (const k of active) if (k) set.add(k);
        } else if (active && typeof active === 'object') {
            for (const [k, v] of Object.entries(active)) if (v) set.add(k);
        }
        return set;
    }

    function toActivePayload(mode, activeSet) {
        if (mode === 'survival') return Array.from(activeSet);
        const obj = {};
        for (const k of activeSet) obj[k] = true;
        return obj;
    }

    function computeStats(defs, activeSet) {
        const tiers = { buff: 0, tactical: 0, challenge: 0, chaos: 0 };
        const byCat = Object.create(null);
        const activeDefs = [];
        for (const d of defs) {
            const c = byCat[d.cat] || (byCat[d.cat] = { total: 0, active: 0 });
            c.total++;
            if (activeSet.has(d.key)) {
                c.active++;
                tiers[d.tier] = (tiers[d.tier] || 0) + 1;
                activeDefs.push(d);
            }
        }
        const totalActive = activeDefs.length;
        const rating = totalActive === 0 ? 'STANDARD'
            : (tiers.chaos >= 3 || totalActive >= 12) ? 'APOCALYPSE'
            : (tiers.challenge + tiers.chaos >= 4 || totalActive >= 7) ? 'MAYHEM'
            : (tiers.buff >= 3 && tiers.challenge === 0) ? 'SUPERCHARGED'
            : 'CUSTOMIZED';
        return { tiers, byCat, activeDefs, totalActive, rating };
    }

    function filterDefs(defs, st, activeSet) {
        const q = (st.q || '').trim().toLowerCase();
        const terms = q ? q.split(/\s+/).filter(Boolean) : [];
        return defs.filter((d) => {
            if (st.cat !== 'all' && d.cat !== st.cat) return false;
            if (st.onlyActive && !activeSet.has(d.key)) return false;
            if (st.tier !== 'all' && d.tier !== st.tier) return false;
            if (terms.length) {
                const hay = `${d.label} ${d.desc} ${d.key} ${d.cat} ${d.tier} ${d.exclusive ? 'special exclusive' : ''}`.toLowerCase();
                for (const t of terms) if (!hay.includes(t)) return false;
            }
            return true;
        });
    }

    function renderDeckParts(mode, data, st, activeSet) {
        const { defs, cats, catMap, bundles } = data;
        const stats = computeStats(defs, activeSet);
        const n = Math.max(1, stats.totalActive);
        const pct = (t) => stats.totalActive ? ((stats.tiers[t] || 0) / n * 100).toFixed(1) : 0;
        const filtered = filterDefs(defs, st, activeSet);

        const meterHtml = `
            <div class="mm-balance-row">
                <div class="mm-active-pill">
                    <span class="mm-active-num">${stats.totalActive}</span>
                    <span class="mm-active-sep">/</span>
                    <span class="mm-total-num">${defs.length}</span>
                    <span class="mm-active-lbl">ACTIVE</span>
                    <span class="mm-rating-badge mm-rating-${stats.rating.toLowerCase()}">${stats.rating}</span>
                </div>
                <div class="mm-meter-wrap" data-tip="Impact Distribution across active modifiers">
                    <div class="mm-meter">
                        <span class="mm-seg-buff" style="width:${pct('buff')}%"></span>
                        <span class="mm-seg-tactical" style="width:${pct('tactical')}%"></span>
                        <span class="mm-seg-challenge" style="width:${pct('challenge')}%"></span>
                        <span class="mm-seg-chaos" style="width:${pct('chaos')}%"></span>
                    </div>
                    <div class="mm-meter-legend">
                        <span class="mm-lg-buff">● ${stats.tiers.buff} Buff</span>
                        <span class="mm-lg-tactical">● ${stats.tiers.tactical} Tactical</span>
                        <span class="mm-lg-challenge">● ${stats.tiers.challenge} Challenge</span>
                        <span class="mm-lg-chaos">● ${stats.tiers.chaos} Chaos</span>
                    </div>
                </div>
                <div class="mm-deck-actions">
                    <button type="button" class="mm-act-btn" data-mm-act="rand3" data-tip="Pick 3 random modifiers">🎲 Random 3</button>
                    <button type="button" class="mm-act-btn" data-mm-act="rand5" data-tip="Pick 5 random modifiers">⚡ Random 5</button>
                    <button type="button" class="mm-act-btn mm-act-danger" data-mm-act="clear" ${stats.totalActive ? '' : 'disabled'}>✕ Clear All</button>
                </div>
            </div>`;

        const tierTabsHtml = [
            ['all', `All (${defs.length})`],
            ['buff', 'Buff'],
            ['tactical', 'Tactical'],
            ['challenge', 'Challenge'],
            ['chaos', 'Chaos']
        ].map(([tid, tlbl]) => {
            const cnt = tid === 'all' ? defs.length : defs.filter((d) => d.tier === tid).length;
            return `<button type="button" class="mm-tier-pill mm-tp-${tid}${st.tier === tid ? ' active' : ''}" data-mm-tier="${tid}">${tlbl}${tid !== 'all' ? ` <span>${cnt}</span>` : ''}</button>`;
        }).join('');

        const bundlesHtml = bundles.length ? `
            <div class="mm-bundles">
                <span class="mm-bundles-lbl">CURATED PACKS</span>
                <div class="mm-bundle-list">
                    ${bundles.map((b) => {
                        const allOn = b.mods.length > 0 && b.mods.every((k) => activeSet.has(k));
                        return `<button type="button" class="mm-bundle-btn${allOn ? ' active' : ''}" data-mm-bundle="${esc(b.id)}" data-tip="${esc(b.desc)}">
                            <span class="mm-bundle-ico">${esc(b.ico)}</span>
                            <span class="mm-bundle-name">${esc(b.name)}</span>
                            <span class="mm-bundle-cnt">${b.mods.length}</span>
                        </button>`;
                    }).join('')}
                </div>
            </div>` : '';

        const trayHtml = stats.activeDefs.length ? `
            <div class="mm-tray-items">
                ${stats.activeDefs.map((d) => {
                    const cat = catMap[d.cat] || { color: '#38bdf8' };
                    return `<button type="button" class="mm-chip mm-chip-${d.tier}" style="--cat-color:${cat.color}" data-mm-remove="${esc(d.key)}" data-tip="Click to disable ${esc(d.label)}">
                        <span>${esc(d.ico)}</span>
                        <span>${esc(d.label)}</span>
                        <span class="mm-chip-x">×</span>
                    </button>`;
                }).join('')}
            </div>` : `<div class="mm-tray-empty">No modifiers active yet — choose a category tab, apply a Curated Pack, or roll Random 3 / 5 above.</div>`;

        const tabsHtml = `
            <button type="button" class="mm-tab${st.cat === 'all' ? ' active' : ''}" data-mm-cat="all" style="--cat-color:#38bdf8">
                <span class="mm-tab-ico">🌐</span>
                <span class="mm-tab-name">All Categories</span>
                <span class="mm-tab-cnt">${stats.totalActive}/${defs.length}</span>
            </button>
            ${cats.map((c) => {
                const cs = stats.byCat[c.id] || { total: 0, active: 0 };
                return `<button type="button" class="mm-tab${st.cat === c.id ? ' active' : ''}${cs.active > 0 ? ' has-active' : ''}" data-mm-cat="${esc(c.id)}" style="--cat-color:${c.color}">
                    <span class="mm-tab-ico">${esc(c.ico)}</span>
                    <span class="mm-tab-name">${esc(c.name)}</span>
                    <span class="mm-tab-cnt">${cs.active}/${cs.total}</span>
                </button>`;
            }).join('')}`;

        // Group filtered results cleanly in category order
        const catOrder = cats.length ? cats : Array.from(new Set(defs.map((d) => d.cat))).map((id) => ({ id, name: id, ico: '✦', color: '#38bdf8' }));
        const groupsHtml = catOrder.map((c) => {
            if (st.cat !== 'all' && st.cat !== c.id) return '';
            const items = filtered.filter((d) => d.cat === c.id);
            if (!items.length) return '';
            const cs = stats.byCat[c.id] || { total: items.length, active: 0 };
            return `<section class="mm-group" data-mm-group="${esc(c.id)}" style="--cat-color:${c.color}">
                <header class="mm-group-hd">
                    <div class="mm-group-title">
                        <span class="mm-group-ico">${esc(c.ico)}</span>
                        <h4>${esc(c.name)}</h4>
                        <span class="mm-group-stat">${cs.active} active · ${items.length} shown</span>
                    </div>
                    ${cs.active > 0 ? `<button type="button" class="mm-clear-cat" data-mm-clear-cat="${esc(c.id)}">Clear Category (${cs.active})</button>` : ''}
                </header>
                <div class="mm-grid">
                    ${items.map((d) => {
                        const on = activeSet.has(d.key);
                        const tm = TIER_META[d.tier] || TIER_META.tactical;
                        return `<button type="button" class="mm-card${on ? ' active' : ''}${d.exclusive ? ' exclusive' : ''}" data-mm-key="${esc(d.key)}" data-mm-tier="${esc(d.tier)}" aria-pressed="${on ? 'true' : 'false'}" data-tip-title="${esc(d.label)}" data-tip="${esc(d.desc)}" data-tip-sub="${esc((tm.label || '') + ' · click to turn ' + (on ? 'OFF' : 'ON'))}">
                            <div class="mm-card-top">
                                <span class="mm-card-ico">${esc(d.ico)}</span>
                                <span class="mm-card-lbl">${esc(d.label)}</span>
                                <span class="mm-card-badges">
                                    ${d.exclusive ? '<span class="mm-spec-badge" data-tip="Mode-Exclusive Modifier">★ SPECIAL</span>' : ''}
                                    <span class="mm-tier-badge mm-tb-${esc(d.tier)}">${tm.label}</span>
                                </span>
                                <span class="mm-toggle-pill">${on ? 'ON' : 'OFF'}</span>
                            </div>
                            <div class="mm-card-desc">${esc(d.desc)}</div>
                        </button>`;
                    }).join('')}
                </div>
            </section>`;
        }).filter(Boolean).join('') || `<div class="mm-empty-state">No modifiers match your current search or filters. <button type="button" class="mm-act-btn" data-mm-act="resetfilters">Reset Filters</button></div>`;

        const hiddenSyncHtml = mode === 'survival'
            ? Array.from(activeSet).map((k) => `<input type="checkbox" class="mm-sync-input" data-mod value="${esc(k)}" checked style="display:none">`).join('')
            : '';

        return { meterHtml, tierTabsHtml, bundlesHtml, trayHtml, tabsHtml, groupsHtml, hiddenSyncHtml, filteredCount: filtered.length, totalCount: defs.length };
    }

    function renderHtml(opts = {}) {
        const mode = opts.mode || 'zombies';
        const data = normalizeModeData(mode);
        const st = getState(mode);
        const activeSet = toActiveSet(opts.active);
        const parts = renderDeckParts(mode, data, st, activeSet);
        return `
            <div class="mm-shell mm-mode-${esc(mode)}" data-mm-mode="${esc(mode)}">
                <div class="mm-sync-wrap" style="display:none">${parts.hiddenSyncHtml}</div>
                <div class="mm-deck">
                    <div class="mm-balance-slot">${parts.meterHtml}</div>
                    <div class="mm-toolbar">
                        <div class="mm-search-wrap">
                            <span class="mm-search-ico">⌕</span>
                            <input type="search" class="mm-search" data-mm-search placeholder="Search ${data.defs.length} modifiers, effects, categories..." value="${esc(st.q)}" autocomplete="off" spellcheck="false">
                        </div>
                        <div class="mm-tier-slot">${parts.tierTabsHtml}</div>
                        <button type="button" class="mm-only-active-btn${st.onlyActive ? ' active' : ''}" data-mm-only-active>
                            <span>✓ Only Active</span>
                        </button>
                    </div>
                    <div class="mm-bundles-slot">${parts.bundlesHtml}</div>
                    <div class="mm-tray-slot">${parts.trayHtml}</div>
                </div>
                <div class="mm-tabs-slot mm-tabs" role="tablist" aria-label="Modifier Categories">${parts.tabsHtml}</div>
                <div class="mm-body-slot mm-body">${parts.groupsHtml}</div>
            </div>`;
    }

    function refreshShellInPlace(shell, mode, activeSet) {
        if (!shell) return;
        const data = normalizeModeData(mode);
        const st = getState(mode);
        const parts = renderDeckParts(mode, data, st, activeSet);

        const setHtml = (sel, html) => {
            const el = shell.querySelector(sel);
            if (el) el.innerHTML = html;
        };
        setHtml('.mm-sync-wrap', parts.hiddenSyncHtml);
        setHtml('.mm-balance-slot', parts.meterHtml);
        setHtml('.mm-tier-slot', parts.tierTabsHtml);
        setHtml('.mm-bundles-slot', parts.bundlesHtml);
        setHtml('.mm-tray-slot', parts.trayHtml);
        setHtml('.mm-tabs-slot', parts.tabsHtml);
        setHtml('.mm-body-slot', parts.groupsHtml);
        const onlyBtn = shell.querySelector('[data-mm-only-active]');
        if (onlyBtn) onlyBtn.classList.toggle('active', !!st.onlyActive);
    }

    function bindContainer(rootEl, opts = {}) {
        const mode = opts.mode || 'zombies';
        const shell = rootEl.querySelector(`.mm-shell[data-mm-mode="${mode}"]`) || rootEl.querySelector('.mm-shell');
        if (!shell) return;

        const getActive = () => toActiveSet(typeof opts.getActive === 'function' ? opts.getActive() : opts.active);
        const commitActive = (nextSet) => {
            const payload = toActivePayload(mode, nextSet);
            if (typeof opts.onChange === 'function') opts.onChange(payload, nextSet);
            refreshShellInPlace(shell, mode, nextSet);
        };

        const searchEl = shell.querySelector('[data-mm-search]');
        if (searchEl) {
            searchEl.addEventListener('input', () => {
                const st = getState(mode);
                st.q = searchEl.value || '';
                const data = normalizeModeData(mode);
                const activeSet = getActive();
                const parts = renderDeckParts(mode, data, st, activeSet);
                const bodyEl = shell.querySelector('.mm-body-slot');
                if (bodyEl) bodyEl.innerHTML = parts.groupsHtml;
            });
            searchEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') e.preventDefault();
            });
        }

        shell.addEventListener('click', (e) => {
            const cardBtn = e.target.closest('[data-mm-key]');
            if (cardBtn) {
                const k = cardBtn.dataset.mmKey;
                const set = getActive();
                if (set.has(k)) set.delete(k);
                else set.add(k);
                commitActive(set);
                return;
            }

            const remBtn = e.target.closest('[data-mm-remove]');
            if (remBtn) {
                const set = getActive();
                set.delete(remBtn.dataset.mmRemove);
                commitActive(set);
                return;
            }

            const tabBtn = e.target.closest('[data-mm-cat]');
            if (tabBtn) {
                const st = getState(mode);
                st.cat = tabBtn.dataset.mmCat || 'all';
                refreshShellInPlace(shell, mode, getActive());
                return;
            }

            const tierBtn = e.target.closest('[data-mm-tier]');
            if (tierBtn) {
                const st = getState(mode);
                st.tier = tierBtn.dataset.mmTier || 'all';
                refreshShellInPlace(shell, mode, getActive());
                return;
            }

            const onlyBtn = e.target.closest('[data-mm-only-active]');
            if (onlyBtn) {
                const st = getState(mode);
                st.onlyActive = !st.onlyActive;
                refreshShellInPlace(shell, mode, getActive());
                return;
            }

            const clearCatBtn = e.target.closest('[data-mm-clear-cat]');
            if (clearCatBtn) {
                const catId = clearCatBtn.dataset.mmClearCat;
                const data = normalizeModeData(mode);
                const set = getActive();
                for (const d of data.defs) {
                    if (d.cat === catId) set.delete(d.key);
                }
                commitActive(set);
                return;
            }

            const bundleBtn = e.target.closest('[data-mm-bundle]');
            if (bundleBtn) {
                const bid = bundleBtn.dataset.mmBundle;
                const data = normalizeModeData(mode);
                const bundle = data.bundles.find((b) => b.id === bid);
                if (!bundle) return;
                const set = getActive();
                const allOn = bundle.mods.length > 0 && bundle.mods.every((k) => set.has(k));
                for (const k of bundle.mods) {
                    if (allOn) set.delete(k);
                    else set.add(k);
                }
                commitActive(set);
                return;
            }

            const actBtn = e.target.closest('[data-mm-act]');
            if (actBtn) {
                const act = actBtn.dataset.mmAct;
                const data = normalizeModeData(mode);
                const st = getState(mode);
                if (act === 'clear') {
                    commitActive(new Set());
                    return;
                }
                if (act === 'resetfilters') {
                    st.cat = 'all';
                    st.tier = 'all';
                    st.onlyActive = false;
                    st.q = '';
                    if (searchEl) searchEl.value = '';
                    refreshShellInPlace(shell, mode, getActive());
                    return;
                }
                if (act === 'rand3' || act === 'rand5') {
                    const count = act === 'rand5' ? 5 : 3;
                    const pool = st.cat !== 'all' ? data.defs.filter((d) => d.cat === st.cat) : data.defs.slice();
                    const shuffled = pool.slice().sort(() => Math.random() - 0.5);
                    const set = new Set();
                    for (const d of shuffled.slice(0, count)) set.add(d.key);
                    commitActive(set);
                    return;
                }
            }
        });
    }

    BO.ModifierMenuUI = {
        TIER_META,
        normalizeModeData,
        getState,
        renderHtml,
        bindContainer,
        refreshShellInPlace
    };
})(window.BO = window.BO || {});
