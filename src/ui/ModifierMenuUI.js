(function (BO) {
    'use strict';

    const TIER_META = {
        buff:      { label: 'BUFF',      color: '#22c55e', order: 0 },
        tactical:  { label: 'TACTICAL',  color: '#38bdf8', order: 1 },
        challenge: { label: 'CHALLENGE', color: '#f59e0b', order: 2 },
        chaos:     { label: 'CHAOS',     color: '#f43f5e', order: 3 }
    };

    const PRESET_STORAGE_KEY = 'boCustomModPresets/v1';
    const uiStateByMode = Object.create(null);

    function readAllPresets() {
        try {
            const raw = localStorage.getItem(PRESET_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : {};
            return (parsed && typeof parsed === 'object') ? parsed : {};
        } catch (_) {
            return {};
        }
    }

    function writeAllPresets(map) {
        try {
            localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(map || {}));
            return true;
        } catch (_) {
            return false;
        }
    }

    function listPresets(mode) {
        const all = readAllPresets();
        return Array.isArray(all[mode]) ? all[mode] : [];
    }

    function savePreset(mode, name, activeKeys) {
        const cleanName = String(name || '').trim().slice(0, 28);
        const mods = Array.from(toActiveSet(activeKeys));
        if (!cleanName || !mods.length) return null;
        const all = readAllPresets();
        const list = Array.isArray(all[mode]) ? all[mode] : [];
        const existing = list.find((p) => p.name.toLowerCase() === cleanName.toLowerCase());
        let saved;
        if (existing) {
            existing.name = cleanName;
            existing.mods = mods;
            existing.updatedAt = Date.now();
            saved = existing;
        } else {
            saved = {
                id: 'mp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
                name: cleanName,
                mods,
                createdAt: Date.now()
            };
            list.unshift(saved);
        }
        all[mode] = list.slice(0, 24);
        writeAllPresets(all);
        return saved;
    }

    function updatePresetById(mode, id, activeKeys) {
        const mods = Array.from(toActiveSet(activeKeys));
        if (!mods.length) return false;
        const all = readAllPresets();
        const list = Array.isArray(all[mode]) ? all[mode] : [];
        const target = list.find((p) => p.id === id);
        if (!target) return false;
        target.mods = mods;
        target.updatedAt = Date.now();
        writeAllPresets(all);
        return true;
    }

    function deletePreset(mode, id) {
        const all = readAllPresets();
        const list = Array.isArray(all[mode]) ? all[mode] : [];
        const next = list.filter((p) => p.id !== id);
        if (next.length === list.length) return false;
        all[mode] = next;
        writeAllPresets(all);
        return true;
    }

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

    const RATING_INFO = {
        STANDARD: 'No modifiers: the mode plays exactly as designed.',
        CUSTOMIZED: 'A light touch of tweaks on top of the standard rules.',
        SUPERCHARGED: 'Mostly helpful buffs. An easier, power-fantasy run.',
        MAYHEM: 'Several challenge or chaos modifiers stacked. Expect a hard run.',
        APOCALYPSE: 'A huge or chaotic stack. Only for the brave.'
    };
    const TIER_TIP = {
        all: 'Show every tier.',
        buff: 'Buffs make the run easier or more rewarding.',
        tactical: 'Tactical modifiers change how you play without simply making it harder.',
        challenge: 'Challenge modifiers make the run harder.',
        chaos: 'Chaos modifiers add wild, unpredictable rules.'
    };

    function renderDeckParts(mode, data, st, activeSet) {
        const { defs, cats, catMap, bundles } = data;
        const stats = computeStats(defs, activeSet);
        const n = Math.max(1, stats.totalActive);
        const pct = (t) => stats.totalActive ? ((stats.tiers[t] || 0) / n * 100).toFixed(1) : 0;
        const filtered = filterDefs(defs, st, activeSet);
        const catName = (id) => (catMap[id] && catMap[id].name) || id;
        const scope = st.cat !== 'all' ? ' from the current category' : '';

        const meterHtml = `
            <div class="mmx-count" data-tip-title="Active modifiers" data-tip="${stats.totalActive} of ${defs.length} modifiers are switched on. Click any tile to toggle it; hover a tile to read exactly what it does.">
                <b>${stats.totalActive}</b><span>/ ${defs.length}<small>active</small></span>
            </div>
            <div class="mmx-rating mmx-r-${stats.rating.toLowerCase()}" data-tip-title="Run rating: ${stats.rating}" data-tip="${esc(RATING_INFO[stats.rating] || '')}">${stats.rating}</div>
            <div class="mmx-meter-wrap" data-tip-title="Impact mix" data-tip="How your active modifiers split between Buffs (help you), Tactical (change how you play), Challenge (harder) and Chaos (wild).">
                <div class="mmx-meter">
                    <span class="t-buff" style="width:${pct('buff')}%"></span><span class="t-tactical" style="width:${pct('tactical')}%"></span>
                    <span class="t-challenge" style="width:${pct('challenge')}%"></span><span class="t-chaos" style="width:${pct('chaos')}%"></span>
                </div>
                <div class="mmx-meter-legend">${['buff', 'tactical', 'challenge', 'chaos'].map((t) => `<span class="t-${t}"><i></i>${stats.tiers[t]} ${TIER_META[t].label.toLowerCase()}</span>`).join('')}</div>
            </div>
            <div class="mmx-actions">
                <button type="button" class="mmx-btn" data-mm-act="rand3" data-tip-title="Random 3" data-tip="Replace your selection with 3 random modifiers${scope}.">⟳ Random 3</button>
                <button type="button" class="mmx-btn" data-mm-act="rand5" data-tip-title="Random 5" data-tip="Replace your selection with 5 random modifiers${scope}.">⟳ Random 5</button>
                <button type="button" class="mmx-btn danger" data-mm-act="clear" ${stats.totalActive ? '' : 'disabled'} data-tip-title="Clear all" data-tip="Switch every modifier off and return to the standard rules.">Clear all</button>
            </div>`;

        const tierTabsHtml = ['all', 'buff', 'tactical', 'challenge', 'chaos'].map((tid) => {
            const tlbl = tid === 'all' ? 'All tiers' : TIER_META[tid].label.charAt(0) + TIER_META[tid].label.slice(1).toLowerCase();
            const cnt = tid === 'all' ? defs.length : defs.filter((d) => d.tier === tid).length;
            return `<button type="button" class="mmx-seg t-${tid}${st.tier === tid ? ' active' : ''}" data-mm-tier="${tid}" data-tip-title="${esc(tlbl)}" data-tip="${esc(TIER_TIP[tid])}" data-tip-sub="${cnt} modifiers"><i></i>${esc(tlbl)}</button>`;
        }).join('');

        const userPresets = listPresets(mode);
        const exactMatch = (mods) => mods.length === activeSet.size && mods.every((k) => activeSet.has(k));
        const presetsHtml = `
            <div class="mmx-presets-bar">
                <span class="mmx-label">Custom presets</span>
                <div class="mmx-preset-form">
                    <input type="text" class="mmx-preset-input" data-mm-preset-name maxlength="28" placeholder="Preset name (e.g. Fast Chaos)…" value="${esc(st.draftName || '')}" title="Name your current modifier set to save and reuse anytime">
                    <button type="button" class="mmx-btn primary" data-mm-act="savepreset" ${stats.totalActive ? '' : 'disabled'} data-tip-title="Save custom preset" data-tip="${stats.totalActive ? 'Saves your current ' + stats.totalActive + ' active modifier(s) under this name for ' + mode.toUpperCase() + '. Typing an existing preset name updates it.' : 'Switch on at least 1 modifier first to save a preset.'}">★ Save set</button>
                </div>
                <div class="mmx-preset-list">
                    ${userPresets.length ? userPresets.map((p) => {
                        const validMods = (p.mods || []).filter((k) => defs.some((d) => d.key === k));
                        const matched = validMods.length > 0 && exactMatch(validMods);
                        const names = validMods.map((k) => (defs.find((d) => d.key === k) || {}).label).filter(Boolean);
                        const tipBody = 'Includes (' + validMods.length + '): ' + (names.join(', ') || 'None');
                        return `<div class="mmx-preset-pill${matched ? ' active' : ''}">
                            <button type="button" class="mmx-preset-load" data-mm-load-preset="${esc(p.id)}" data-tip-title="Preset: ${esc(p.name)}" data-tip="${esc(tipBody)}" data-tip-sub="${matched ? 'Currently loaded · click to clear' : 'Click to apply this modifier set'}">
                                <span>★</span><b>${esc(p.name)}</b><em>${validMods.length}</em>
                            </button>
                            ${!matched && stats.totalActive ? `<button type="button" class="mmx-preset-ico" data-mm-update-preset="${esc(p.id)}" data-tip-title="Overwrite '${esc(p.name)}'" data-tip="Replace '${esc(p.name)}' with your currently active ${stats.totalActive} modifier(s).">↻</button>` : ''}
                            <button type="button" class="mmx-preset-ico del" data-mm-del-preset="${esc(p.id)}" data-tip-title="Delete preset" data-tip="Delete '${esc(p.name)}' from saved ${mode.toUpperCase()} presets.">×</button>
                        </div>`;
                    }).join('') : '<span class="mmx-preset-hint">No saved sets yet — toggle modifiers and save named presets for 1-click reuse.</span>'}
                </div>
            </div>`;

        const bundlesHtml = presetsHtml + (bundles.length ? `
            <div class="mmx-packs"><span class="mmx-label">Curated packs</span>
                ${bundles.map((b) => {
                    const allOn = b.mods.length > 0 && b.mods.every((k) => activeSet.has(k));
                    const names = b.mods.map((k) => (defs.find((d) => d.key === k) || {}).label).filter(Boolean);
                    const body = (b.desc ? b.desc + '\n\n' : '') + 'Includes: ' + names.join(', ');
                    return `<button type="button" class="mmx-pack${allOn ? ' active' : ''}" data-mm-bundle="${esc(b.id)}" data-tip-title="${esc(b.name)}" data-tip="${esc(body)}" data-tip-sub="${allOn ? 'Click to remove the pack' : 'Click to add all ' + b.mods.length}">
                        <span>${esc(b.ico)}</span>${esc(b.name)}<em>${b.mods.length}</em></button>`;
                }).join('')}
            </div>` : '');

        const trayHtml = stats.activeDefs.length
            ? stats.activeDefs.map((d) => `<button type="button" class="mmx-chip t-${d.tier}" data-mm-remove="${esc(d.key)}" data-tip-title="${esc(d.label)}" data-tip="${esc(d.desc || 'No description.')}" data-tip-sub="Click to switch off"><span>${esc(d.ico)}</span>${esc(d.label)}<b>×</b></button>`).join('')
            : '<span class="mmx-empty">Standard rules: no modifiers active. Pick tiles below, apply a curated pack, or roll a random set.</span>';

        const railBtn = (id, ico, name, a, t, color, tip) => `<button type="button" class="mmx-cat${st.cat === id ? ' active' : ''}${a ? ' has' : ''}" data-mm-cat="${esc(id)}" style="--c:${color}" data-tip-title="${esc(name)}" data-tip="${esc(tip)}">
            <span class="mmx-cat-ico">${esc(ico)}</span><span class="mmx-cat-name">${esc(name)}</span><span class="mmx-cat-n">${a ? `<b>${a}</b>/` : ''}${t}</span></button>`;
        const tabsHtml = railBtn('all', '◈', 'All categories', stats.totalActive, defs.length, 'var(--mx-accent)', 'Browse every modifier, grouped by category.') +
            cats.map((c) => {
                const cs = stats.byCat[c.id] || { total: 0, active: 0 };
                if (!cs.total) return '';
                return railBtn(c.id, c.ico, c.name, cs.active, cs.total, c.color, cs.total + ' modifiers in ' + c.name + '.');
            }).join('');

        const catOrder = cats.length ? cats : Array.from(new Set(defs.map((d) => d.cat))).map((id) => ({ id, name: id, ico: '✦', color: '#38bdf8' }));
        const tile = (d) => {
            const on = activeSet.has(d.key);
            const tm = TIER_META[d.tier] || TIER_META.tactical;
            const sub = tm.label + ' · ' + catName(d.cat) + (d.exclusive ? ' · mode exclusive' : '') + ' · click to turn ' + (on ? 'off' : 'on');
            return `<button type="button" class="mmx-tile t-${d.tier}${on ? ' on' : ''}${d.exclusive ? ' special' : ''}" data-mm-key="${esc(d.key)}" aria-pressed="${on ? 'true' : 'false'}" data-tip-title="${esc(d.label)}" data-tip="${esc(d.desc || 'No description.')}" data-tip-sub="${esc(sub)}">
                <span class="mmx-tile-ico">${esc(d.ico)}</span><span class="mmx-tile-name">${esc(d.label)}</span>${d.exclusive ? '<span class="mmx-star">★</span>' : ''}<span class="mmx-check"></span></button>`;
        };
        const groupsHtml = catOrder.map((c) => {
            if (st.cat !== 'all' && st.cat !== c.id) return '';
            const items = filtered.filter((d) => d.cat === c.id);
            if (!items.length) return '';
            const cs = stats.byCat[c.id] || { total: items.length, active: 0 };
            return `<section class="mmx-group" style="--c:${c.color}">
                <header><span class="mmx-group-ico">${esc(c.ico)}</span><h4>${esc(c.name)}</h4><small>${cs.active} on · ${items.length} shown</small>
                ${cs.active > 0 ? `<button type="button" class="mmx-link" data-mm-clear-cat="${esc(c.id)}" data-tip="Switch off every active modifier in ${esc(c.name)}.">Clear ${cs.active}</button>` : ''}</header>
                <div class="mmx-grid">${items.map(tile).join('')}</div>
            </section>`;
        }).filter(Boolean).join('') || '<div class="mmx-none">No modifiers match your search or filters. <button type="button" class="mmx-btn" data-mm-act="resetfilters">Reset filters</button></div>';

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
            <div class="mm-shell mmx mm-mode-${esc(mode)}" data-mm-mode="${esc(mode)}">
                <div class="mm-sync-wrap" style="display:none">${parts.hiddenSyncHtml}</div>
                <header class="mmx-head mm-balance-slot">${parts.meterHtml}</header>
                <div class="mmx-loadout"><span class="mmx-label">Active</span><div class="mm-tray-slot mmx-tray">${parts.trayHtml}</div></div>
                <div class="mmx-main">
                    <nav class="mm-tabs-slot mmx-rail" aria-label="Modifier categories">${parts.tabsHtml}</nav>
                    <section class="mmx-content">
                        <div class="mmx-toolbar">
                            <label class="mmx-search" data-tip-title="Search" data-tip="Search names, effects and categories. Descriptions are searched too, even though they only show on hover.">
                                <span>⌕</span><input type="search" data-mm-search placeholder="Search ${data.defs.length} modifiers…" value="${esc(st.q)}" autocomplete="off" spellcheck="false" title="Filter modifiers by name or description">
                            </label>
                            <div class="mm-tier-slot mmx-segs">${parts.tierTabsHtml}</div>
                            <button type="button" class="mmx-only${st.onlyActive ? ' active' : ''}" data-mm-only-active data-tip-title="Only active" data-tip="Show only the modifiers you have switched on."><i></i>Only active</button>
                        </div>
                        <div class="mm-bundles-slot">${parts.bundlesHtml}</div>
                        <div class="mm-body-slot mmx-body">${parts.groupsHtml}</div>
                    </section>
                </div>
            </div>`;
    }

    function refreshShellInPlace(shell, mode, activeSet, resetBodyScroll = false) {
        if (!shell) return;
        const data = normalizeModeData(mode);
        const st = getState(mode);
        const parts = renderDeckParts(mode, data, st, activeSet);

        const bodyEl = shell.querySelector('.mm-body-slot');
        const railEl = shell.querySelector('.mm-tabs-slot');
        const prevBodyScroll = bodyEl ? bodyEl.scrollTop : 0;
        const prevRailScroll = railEl ? railEl.scrollTop : 0;

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
        if (railEl) railEl.scrollTop = prevRailScroll;
        if (bodyEl) bodyEl.scrollTop = resetBodyScroll ? 0 : prevBodyScroll;
        const onlyBtn = shell.querySelector('[data-mm-only-active]');
        if (onlyBtn) onlyBtn.classList.toggle('active', !!st.onlyActive);
        if (BO.Tooltips && BO.Tooltips.hide) BO.Tooltips.hide();
    }

    function bindContainer(rootEl, opts = {}) {
        const mode = opts.mode || 'zombies';
        const shell = rootEl.querySelector(`.mm-shell[data-mm-mode="${mode}"]`) || rootEl.querySelector('.mm-shell');
        if (!shell) return;

        const getActive = () => toActiveSet(typeof opts.getActive === 'function' ? opts.getActive() : opts.active);
        const commitActive = (nextSet) => {
            const payload = toActivePayload(mode, nextSet);
            if (typeof opts.onChange === 'function') opts.onChange(payload, nextSet);
            refreshShellInPlace(shell, mode, nextSet, false);
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
                if (bodyEl) {
                    bodyEl.innerHTML = parts.groupsHtml;
                    bodyEl.scrollTop = 0;
                }
            });
            searchEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') e.preventDefault();
            });
        }

        shell.addEventListener('input', (e) => {
            const nameInput = e.target.closest('[data-mm-preset-name]');
            if (nameInput) {
                getState(mode).draftName = nameInput.value || '';
            }
        });

        shell.addEventListener('keydown', (e) => {
            const nameInput = e.target.closest('[data-mm-preset-name]');
            if (nameInput && e.key === 'Enter') {
                e.preventDefault();
                const saveBtn = shell.querySelector('[data-mm-act="savepreset"]');
                if (saveBtn && !saveBtn.disabled) saveBtn.click();
            }
        });

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
                refreshShellInPlace(shell, mode, getActive(), true);
                return;
            }

            const tierBtn = e.target.closest('[data-mm-tier]');
            if (tierBtn) {
                const st = getState(mode);
                st.tier = tierBtn.dataset.mmTier || 'all';
                refreshShellInPlace(shell, mode, getActive(), true);
                return;
            }

            const onlyBtn = e.target.closest('[data-mm-only-active]');
            if (onlyBtn) {
                const st = getState(mode);
                st.onlyActive = !st.onlyActive;
                refreshShellInPlace(shell, mode, getActive(), true);
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

            const loadPresetBtn = e.target.closest('[data-mm-load-preset]');
            if (loadPresetBtn) {
                const pid = loadPresetBtn.dataset.mmLoadPreset;
                const preset = listPresets(mode).find((p) => p.id === pid);
                if (!preset) return;
                const data = normalizeModeData(mode);
                const valid = (preset.mods || []).filter((k) => data.defs.some((d) => d.key === k));
                const cur = getActive();
                const isSame = valid.length === cur.size && valid.every((k) => cur.has(k));
                commitActive(isSame ? new Set() : new Set(valid));
                BO.Sound?.playUIClick?.();
                return;
            }

            const updPresetBtn = e.target.closest('[data-mm-update-preset]');
            if (updPresetBtn) {
                const pid = updPresetBtn.dataset.mmUpdatePreset;
                if (updatePresetById(mode, pid, getActive())) {
                    BO.Sound?.playPerkBuy?.();
                    refreshShellInPlace(shell, mode, getActive(), false);
                }
                return;
            }

            const delPresetBtn = e.target.closest('[data-mm-del-preset]');
            if (delPresetBtn) {
                const pid = delPresetBtn.dataset.mmDelPreset;
                if (deletePreset(mode, pid)) {
                    BO.Sound?.playUIClick?.();
                    refreshShellInPlace(shell, mode, getActive(), false);
                }
                return;
            }

            const actBtn = e.target.closest('[data-mm-act]');
            if (actBtn) {
                const act = actBtn.dataset.mmAct;
                const data = normalizeModeData(mode);
                const st = getState(mode);
                if (act === 'savepreset') {
                    const cur = getActive();
                    if (!cur.size) return;
                    const inp = shell.querySelector('[data-mm-preset-name]');
                    const rawName = (inp ? inp.value : st.draftName || '').trim();
                    const fallback = 'Custom Set ' + (listPresets(mode).length + 1);
                    const saved = savePreset(mode, rawName || fallback, cur);
                    if (saved) {
                        st.draftName = '';
                        BO.Sound?.playPerkBuy?.();
                        refreshShellInPlace(shell, mode, cur, false);
                    }
                    return;
                }
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
                    refreshShellInPlace(shell, mode, getActive(), true);
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
        listPresets,
        savePreset,
        updatePresetById,
        deletePreset,
        renderHtml,
        bindContainer,
        refreshShellInPlace
    };
})(window.BO = window.BO || {});
