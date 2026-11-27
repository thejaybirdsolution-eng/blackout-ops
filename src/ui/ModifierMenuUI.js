(function (BO) {
    'use strict';

    const TIER_META = {
        buff: { label: 'Buff', color: '#65d998' },
        tactical: { label: 'Tactical', color: '#78bbef' },
        challenge: { label: 'Challenge', color: '#f3bc6f' },
        chaos: { label: 'Chaos', color: '#f790a0' }
    };
    const VIEWS = { browse: 'Browse', active: 'Active', presets: 'Presets', create: 'Create' };

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
        return writeAllPresets(all) ? saved : null;
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
        return writeAllPresets(all);
    }

    function deletePreset(mode, id) {
        const all = readAllPresets();
        const list = Array.isArray(all[mode]) ? all[mode] : [];
        const next = list.filter((p) => p.id !== id);
        if (next.length === list.length) return false;
        all[mode] = next;
        return writeAllPresets(all);
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
            let hidden = [];
            try { hidden = JSON.parse(localStorage.getItem('boHiddenModifiers/' + mode)) || []; } catch (_) {}
            uiStateByMode[mode] = { view: 'browse', cat: 'all', q: '', tier: 'all', hidden: new Set(Array.isArray(hidden) ? hidden : []), showHidden: false, scrollByView: {} };
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

    function normalizeModeData(mode, activeSet = []) {
        const custom = BO.ReactiveModifiers.custom(activeSet);
        const reactionCat = { id: 'reactions', name: 'Triggered effects', ico: '↯', color: '#a78bfa' };
        const reactionDef = (def) => ({
            key: def.k, label: def.lbl, cat: def.cat, tier: def.tier, ico: def.ico, desc: def.desc
        });
        if (mode === 'survival') {
            const rules = BO.SurvivalRules || {};
            const cats = [...normalizeCategoryList(rules.categories), reactionCat];
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
            defs.push(...BO.ReactiveModifiers.definitions.map(reactionDef), ...custom.map(reactionDef));
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
        defs.push(...custom.map(reactionDef));
        return { defs, cats, catMap, bundles };
    }

    function toActiveSet(active) {
        const set = new Set();
        // Callers pass arrays, {key: true} maps or Sets; a Set has no own entries, so it used to read as
        // empty and every "Save set" / "Overwrite" silently saved nothing.
        if (active instanceof Set) {
            for (const k of active) if (k) set.add(k);
        } else if (Array.isArray(active)) {
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


    function getCatalog(mode, activeSet) {
        const presets = listPresets(mode);
        const knownKeys = [...activeSet, ...presets.flatMap((p) => p.mods || [])];
        const { defs, cats, bundles } = normalizeModeData(mode, knownKeys);
        const groups = new Map(cats.map((c) => [c.id, { ...c, defs: [] }]));
        for (const def of defs) {
            if (!groups.has(def.cat)) groups.set(def.cat, { id: def.cat, name: def.cat, defs: [] });
            groups.get(def.cat).defs.push(def);
        }
        return { defs, groups, bundles, presets, byKey: new Map(defs.map((d) => [d.key, d])) };
    }

    function browseResults(catalog, state) {
        const terms = state.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
        return catalog.defs.filter((def) => {
            if (state.hidden.has(def.key) !== state.showHidden) return false;
            if (state.cat !== 'all' && def.cat !== state.cat) return false;
            if (state.tier !== 'all' && def.tier !== state.tier) return false;
            const category = catalog.groups.get(def.cat)?.name || '';
            const haystack = [def.label, def.desc, category, def.tier].join(' ').toLowerCase();
            return terms.every((term) => haystack.includes(term));
        });
    }

    function hasFilters(state) {
        return state.cat !== 'all' || state.tier !== 'all' || state.q.trim() !== '';
    }

    function action(label, name, key = '', emphasis = '', disabled = false, accessibleLabel = '') {
        return `<button type="button" class="mod-action ${emphasis}" data-mm-action="${name}"
            data-mm-id="${esc(key)}" ${accessibleLabel ? `aria-label="${esc(accessibleLabel)}"` : ''} ${disabled ? 'disabled' : ''}>${esc(label)}</button>`;
    }

    function modifierCard(def, activeSet, state) {
        const on = activeSet.has(def.key);
        const hidden = state.hidden.has(def.key);
        const setLabel = on ? 'On' : 'Off';
        const tier = TIER_META[def.tier] || TIER_META.tactical;
        return `
            <article class="mod-card${on ? ' is-on' : ''}" style="--mod-type:${tier.color}">
                <div class="mod-card-heading">
                    <span class="mod-type">${tier.label}</span>
                    ${def.key.startsWith('customReaction.') ? '<span class="mod-card-note">Custom</span>' : ''}
                    ${hidden ? '<span class="mod-card-note">Hidden</span>' : ''}
                </div>
                <h4>${esc(def.label)}</h4>
                <p>${esc(def.desc)}</p>
                <div class="mod-card-actions">
                    <button type="button" class="mod-action mod-toggle" data-mm-action="toggle"
                        data-mm-id="${esc(def.key)}" aria-label="${esc(def.label)}"
                        aria-pressed="${on}"><span aria-hidden="true"></span>${setLabel}</button>
                    ${action(hidden ? 'Unhide' : 'Hide', 'hide', def.key, 'quiet', false, (hidden ? 'Unhide ' : 'Hide ') + def.label)}
                </div>
            </article>`;
    }

    function emptyState(title, explanation, control = '') {
        return `<div class="mod-empty"><h4>${title}</h4><p>${explanation}</p>${control}</div>`;
    }

    function browsePanel(catalog, state, activeSet) {
        const matches = browseResults(catalog, state);
        const byCategory = new Map();
        for (const def of matches) {
            if (!byCategory.has(def.cat)) byCategory.set(def.cat, []);
            byCategory.get(def.cat).push(def);
        }
        return `
            <div class="mod-results-line">
                <span>${matches.length} ${matches.length === 1 ? 'modifier' : 'modifiers'}${state.showHidden ? ' hidden' : ''}</span>
                ${hasFilters(state) ? action('Reset filters', 'reset', '', 'quiet') : ''}
            </div>
            ${matches.length ? [...catalog.groups.values()].map((group) => {
                const cards = byCategory.get(group.id);
                if (!cards) return '';
                const selected = group.defs.filter((def) => activeSet.has(def.key)).length;
                return `<section class="mod-group">
                    <header><h3>${esc(group.name)}</h3>
                    ${selected ? action('Clear category', 'clear-category', group.id, 'quiet') : ''}</header>
                    <div class="mod-grid">${cards.map((def) => modifierCard(def, activeSet, state)).join('')}</div>
                </section>`;
            }).join('') : emptyState(
                state.showHidden ? 'No hidden modifiers found' : 'No modifiers found',
                hasFilters(state) ? 'Try a different search or reset the filters.' : 'Hidden modifiers will appear here.'
            )}`;
    }

    function activePanel(catalog, state, activeSet) {
        const active = [...activeSet].map((key) => catalog.byKey.get(key)).filter(Boolean);
        if (!active.length) return emptyState('No active modifiers', 'Switch on a modifier or load a preset.', action('Browse modifiers', 'view', 'browse', 'primary'));
        return `
            <header class="mod-panel-heading"><div><h3>Active modifiers</h3><p>Hidden modifiers appear here if they’re still on.</p></div>
                ${action('Turn all off', 'clear', '', 'quiet')}</header>
            <div class="mod-grid">${active.map((def) => modifierCard(def, activeSet, state)).join('')}</div>`;
    }

    function presetRow(id, title, description, mods, actions, catalog) {
        const names = mods.map((key) => catalog.byKey.get(key)?.label).filter(Boolean).map(esc);
        return `<article class="mod-preset">
            <div><h4>${esc(title)}</h4>
            ${description ? `<p>${esc(description)}</p>` : ''}
            ${names.length ? `<details data-mm-preset-details="${esc(id)}"><summary>${names.length} ${names.length === 1 ? 'modifier' : 'modifiers'}</summary>
                <ul>${names.map((name) => `<li>${name}</li>`).join('')}</ul></details>` : ''}</div>
            <div class="mod-preset-actions">${actions}</div>
        </article>`;
    }

    function presetsPanel(catalog, state, activeSet) {
        return `
            <section class="mod-group">
                <header><h3>Saved presets</h3></header>
                <form class="mod-save-form" data-mm-form="preset">
                    <label>Preset name<input name="presetName" maxlength="28" placeholder="Name this selection" required value="${esc(state.draftName)}"></label>
                    <button type="submit" class="mod-action primary" ${activeSet.size ? '' : 'disabled'}>Save current selection</button>
                </form>
                ${catalog.presets.length ? catalog.presets.map((p) => {
                    const mods = (p.mods || []).filter((key) => catalog.byKey.has(key));
                    const loaded = mods.length > 0 && mods.length === activeSet.size && mods.every((key) => activeSet.has(key));
                    return presetRow(p.id, p.name, '', mods,
                        action(loaded ? 'Loaded' : 'Load', 'load-preset', p.id, 'primary', loaded || !mods.length)
                        + action('Overwrite', 'overwrite', p.id, 'quiet', !activeSet.size || loaded)
                        + action('Delete', 'delete', p.id, 'quiet'), catalog);
                }).join('') : '<p class="mod-helper">Turn on modifiers to save and reuse your selection.</p>'}
            </section>
            ${catalog.bundles.length ? `<section class="mod-group"><header><h3>Curated packs</h3></header>
                ${catalog.bundles.map((pack) => {
                    const mods = pack.mods.filter((key) => catalog.byKey.has(key));
                    const on = mods.length > 0 && mods.every((key) => activeSet.has(key));
                    return presetRow(pack.id, pack.name, pack.desc, mods, action(on ? 'Remove pack' : 'Add pack', 'pack', pack.id, 'primary', !mods.length), catalog);
                }).join('')}
            </section>` : ''}
            <section class="mod-group">
                <header><h3>Random selection</h3></header>
                <p class="mod-helper">Replace the active selection with random modifiers from ${state.cat === 'all' ? 'all categories' : esc(catalog.groups.get(state.cat)?.name || state.cat)}.</p>
                <div class="mod-inline-actions">${action('Pick 3', 'random', '3')}${action('Pick 5', 'random', '5')}</div>
            </section>`;
    }

    function createPanel() {
        const { triggers, effects } = BO.ReactiveModifiers;
        return `
            <section class="mod-create">
                <h3>Create a modifier</h3>
                <form data-mm-form="create">
                    <label>Name<input name="modifierName" maxlength="42" required placeholder="Name this modifier"></label>
                    <div class="mod-create-fields">
                        <label>When<select name="trigger">${Object.entries(triggers).map(([id, spec]) => `<option value="${id}">${esc(spec[0])}</option>`).join('')}</select></label>
                        <label>Effect<select name="effect">${Object.entries(effects).map(([id, spec]) => `<option value="${id}">${esc(spec[0])}</option>`).join('')}</select></label>
                        <label>Amount<input name="amount" type="number" required step="0.01" min="1" max="60" value="16"></label>
                    </div>
                    <p class="mod-preview" data-mm-preview></p>
                    <div class="mod-inline-actions"><button class="mod-action primary" type="submit">Create and turn on</button>
                    ${action('Cancel', 'cancel', '', 'quiet')}</div>
                </form>
            </section>`;
    }

    function renderFilters(catalog, state) {
        const option = (value, label, selected) => `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(label)}</option>`;
        return `
            <div class="mod-filterbar" data-mm-filters ${state.view === 'browse' ? '' : 'hidden'}>
                <label class="mod-search">Search<input type="search" data-mm-search value="${esc(state.q)}" placeholder="Name or effect" autocomplete="off"></label>
                <label>Category<select data-mm-filter="cat">${option('all', 'All categories', state.cat)}
                    ${[...catalog.groups.values()].filter((g) => g.defs.length).map((g) => option(g.id, g.name, state.cat)).join('')}</select></label>
                <label>Type<select data-mm-filter="tier">${option('all', 'All types', state.tier)}
                    ${Object.entries(TIER_META).map(([id, meta]) => option(id, meta.label, state.tier)).join('')}</select></label>
                <label>Visibility<select data-mm-visibility><option value="visible">Available</option>
                    <option value="hidden" ${state.showHidden ? 'selected' : ''}>Hidden (${state.hidden.size})</option></select></label>
            </div>`;
    }

    function panelHtml(catalog, state, activeSet) {
        const panels = {
            browse: () => browsePanel(catalog, state, activeSet),
            active: () => activePanel(catalog, state, activeSet),
            presets: () => presetsPanel(catalog, state, activeSet),
            create: createPanel
        };
        return panels[state.view]();
    }

    function renderHtml(opts = {}) {
        const mode = opts.mode || 'zombies';
        const activeSet = toActiveSet(opts.active);
        const state = getState(mode);
        const catalog = getCatalog(mode, activeSet);
        return `
            <section class="mm-shell mod-board mm-mode-${esc(mode)}" data-mm-mode="${esc(mode)}" aria-label="Modifiers">
                <header class="mod-board-top">
                    <nav class="mod-nav" aria-label="Modifier views">
                        ${Object.entries(VIEWS).map(([id, label]) => `
                            <button type="button" class="mod-nav-btn${id === 'create' ? ' mod-new' : ''}" data-mm-action="view" data-mm-id="${id}"
                                aria-pressed="${state.view === id}">${label}${id === 'active' ? ` <span data-mm-count>${activeSet.size}</span>` : ''}</button>`).join('')}
                    </nav>
                    ${renderFilters(catalog, state)}
                    <div class="mod-feedback" role="status" data-mm-feedback></div>
                </header>
                ${mode === 'survival' ? '<div class="mm-sync-wrap" hidden></div>' : ''}
                <div class="mod-results" data-mm-results role="region" aria-label="Modifier results" tabindex="0">
                    ${panelHtml(catalog, state, activeSet)}
                </div>
            </section>`;
    }

    function updateCreatePreview(shell, setDefaults = false) {
        const form = shell.querySelector('[data-mm-form="create"]');
        if (!form) return;
        const { trigger, effect, amount } = form.elements;
        const [, when, cooldown] = BO.ReactiveModifiers.triggers[trigger.value];
        const [, summary, value, min, max] = BO.ReactiveModifiers.effects[effect.value];
        amount.min = min;
        amount.max = max;
        if (setDefaults) amount.value = value;
        form.querySelector('[data-mm-preview]').textContent = when + ', ' + summary.replace('{n}', amount.value || value) + '. ' + cooldown + ' s cooldown.';
    }

    function refreshShellInPlace(shell, mode, active, resetScroll = false) {
        if (!shell) return;
        const activeSet = toActiveSet(active);
        const state = getState(mode);
        const catalog = getCatalog(mode, activeSet);
        const results = shell.querySelector('[data-mm-results]');
        const scroll = results.scrollTop;
        const expanded = new Set([...results.querySelectorAll('[data-mm-preset-details][open]')].map((item) => item.dataset.mmPresetDetails));
        const focus = results.contains(document.activeElement) ? document.activeElement : null;
        const focusAction = focus?.dataset.mmAction;
        const focusId = focus?.dataset.mmId;
        const peers = focusAction ? [...results.querySelectorAll(`[data-mm-action="${CSS.escape(focusAction)}"]`)] : [];
        const focusIndex = peers.indexOf(focus);

        shell.querySelectorAll('.mod-nav-btn').forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.mmId === state.view)));
        shell.querySelector('[data-mm-count]').textContent = activeSet.size;
        const filters = shell.querySelector('[data-mm-filters]');
        filters.hidden = state.view !== 'browse';
        filters.querySelector('[data-mm-search]').value = state.q;
        filters.querySelectorAll('[data-mm-filter]').forEach((input) => { input.value = state[input.dataset.mmFilter]; });
        const visibility = filters.querySelector('[data-mm-visibility]');
        visibility.value = state.showHidden ? 'hidden' : 'visible';
        visibility.options[1].textContent = ` Hidden (${state.hidden.size})`.trim();

        const sync = shell.querySelector('.mm-sync-wrap');
        if (sync) sync.innerHTML = [...activeSet].map((key) => `<input type="checkbox" data-mod value="${esc(key)}" checked>`).join('');
        results.innerHTML = panelHtml(catalog, state, activeSet);
        for (const details of results.querySelectorAll('[data-mm-preset-details]')) {
            details.open = expanded.has(details.dataset.mmPresetDetails);
        }
        results.scrollTop = resetScroll ? 0 : scroll;
        if (focusAction) {
            const replacements = [...results.querySelectorAll(`[data-mm-action="${CSS.escape(focusAction)}"]:not(:disabled)`)];
            const nextFocus = replacements.find((btn) => btn.dataset.mmId === focusId) || replacements[Math.min(focusIndex, replacements.length - 1)];
            (nextFocus || results).focus({ preventScroll: true });
        }
        updateCreatePreview(shell);
        BO.Tooltips?.hide?.();
    }

    function bindContainer(rootEl, opts = {}) {
        const mode = opts.mode || 'zombies';
        const shell = rootEl.querySelector('.mod-board');
        if (!shell) return;
        const state = getState(mode);
        const getActive = () => toActiveSet(typeof opts.getActive === 'function' ? opts.getActive() : opts.active);
        let feedbackTimer;
        const announce = (message) => {
            const feedback = shell.querySelector('[data-mm-feedback]');
            clearTimeout(feedbackTimer);
            feedback.textContent = message;
            if (message) feedbackTimer = setTimeout(() => { feedback.textContent = ''; }, 3800);
        };
        const refresh = (resetScroll = false) => refreshShellInPlace(shell, mode, getActive(), resetScroll);
        const commit = (next, message) => {
            opts.onChange?.(toActivePayload(mode, next), next);
            refreshShellInPlace(shell, mode, next);
            announce(message || '');
        };
        const changeView = (view, focusNav = false) => {
            if (view === state.view) return;
            const select = BO.SelectionHighlight;
            const previous = select.capture(shell);
            const results = shell.querySelector('[data-mm-results]');
            state.scrollByView[state.view] = results.scrollTop;
            if (view === 'create') state.previousView = state.view;
            state.view = view;
            refresh(true);
            results.scrollTop = state.scrollByView[view] || 0;
            select.update(shell, previous);
            if (focusNav) shell.querySelector(`.mod-nav-btn[data-mm-id="${view}"]`)?.focus({ preventScroll: true });
        };

        shell.addEventListener('input', (event) => {
            const input = event.target;
            if (input.matches('[data-mm-search]')) {
                state.q = input.value;
                refresh(true);
            } else if (input.name === 'presetName') state.draftName = input.value;
            else if (input.name === 'amount') updateCreatePreview(shell);
        });
        shell.addEventListener('change', (event) => {
            const input = event.target;
            if (input.matches('[data-mm-filter]')) {
                state[input.dataset.mmFilter] = input.value;
                refresh(true);
            } else if (input.matches('[data-mm-visibility]')) {
                state.showHidden = input.value === 'hidden';
                refresh(true);
            } else if (input.name === 'trigger' || input.name === 'effect') {
                updateCreatePreview(shell, input.name === 'effect');
            }
        });

        shell.addEventListener('submit', (event) => {
            const form = event.target.closest('[data-mm-form]');
            if (!form) return;
            event.preventDefault();
            const active = getActive();
            const fields = new FormData(form);
            if (form.dataset.mmForm === 'preset') {
                const saved = savePreset(mode, fields.get('presetName'), active);
                if (!saved) return announce('Could not save the preset.');
                state.draftName = '';
                refresh();
                shell.querySelector('[name="presetName"]').focus({ preventScroll: true });
                announce(` Saved “${saved.name}”.`.trim());
            } else {
                const def = BO.ReactiveModifiers.create(mode, fields.get('modifierName'), fields.get('trigger'), fields.get('effect'), fields.get('amount'));
                if (!def) return announce('Enter a name and a valid amount.');
                active.add(def.k);
                const previous = BO.SelectionHighlight.capture(shell);
                state.view = 'active';
                commit(active, ` Turned on “${def.lbl}”.`.trim());
                BO.SelectionHighlight.update(shell, previous);
                shell.querySelector('.mod-nav-btn[data-mm-id="active"]').focus({ preventScroll: true });
            }
        });

        shell.addEventListener('click', (event) => {
            const btn = event.target.closest('[data-mm-action]');
            if (!btn) return;
            const { mmAction: operation, mmId: id } = btn.dataset;
            const active = getActive();
            switch (operation) {
                case 'view':
                    changeView(id, btn.classList.contains('mod-action'));
                    break;
                case 'cancel':
                    changeView(state.previousView || 'browse', true);
                    break;
                case 'reset':
                    Object.assign(state, { q: '', cat: 'all', tier: 'all' });
                    refresh(true);
                    shell.querySelector('[data-mm-search]').focus({ preventScroll: true });
                    break;
                case 'toggle':
                    if (!active.delete(id)) active.add(id);
                    commit(active);
                    break;
                case 'hide': {
                    const wasHidden = state.hidden.delete(id);
                    if (!wasHidden) state.hidden.add(id);
                    try { localStorage.setItem('boHiddenModifiers/' + mode, JSON.stringify([...state.hidden])); } catch (_) {}
                    refresh();
                    announce(wasHidden ? 'Modifier is visible again.' : active.has(id) ? 'Hidden from Browse. Still active.' : 'Modifier hidden.');
                    break;
                }
                case 'clear':
                    commit(new Set(), 'All modifiers turned off.');
                    break;
                case 'clear-category': {
                    const group = getCatalog(mode, active).groups.get(id);
                    for (const def of group?.defs || []) active.delete(def.key);
                    commit(active, 'Category turned off.');
                    break;
                }
                case 'load-preset': {
                    const catalog = getCatalog(mode, active);
                    const preset = catalog.presets.find((entry) => entry.id === id);
                    if (!preset) break;
                    commit(new Set((preset.mods || []).filter((key) => catalog.byKey.has(key))), ` Loaded “${preset.name}”.`.trim());
                    break;
                }
                case 'overwrite':
                    if (updatePresetById(mode, id, active)) {
                        refresh();
                        announce('Preset updated.');
                    }
                    break;
                case 'delete':
                    if (deletePreset(mode, id)) {
                        refresh();
                        announce('Preset deleted.');
                    }
                    break;
                case 'pack': {
                    const catalog = getCatalog(mode, active);
                    const pack = catalog.bundles.find((entry) => entry.id === id);
                    if (!pack) break;
                    const keys = pack.mods.filter((key) => catalog.byKey.has(key));
                    const remove = keys.every((key) => active.has(key));
                    keys.forEach((key) => remove ? active.delete(key) : active.add(key));
                    commit(active, remove ? 'Pack removed.' : 'Pack added.');
                    break;
                }
                case 'random': {
                    const { defs } = getCatalog(mode, active);
                    const pool = defs.filter((def) => !state.hidden.has(def.key) && (state.cat === 'all' || def.cat === state.cat));
                    const chosen = new Set();
                    for (let count = Math.min(Number(id), pool.length); count > 0; count--) {
                        const index = Math.floor(Math.random() * pool.length);
                        chosen.add(pool.splice(index, 1)[0].key);
                    }
                    if (chosen.size) commit(chosen, ` Turned on ${chosen.size} random modifiers.`.trim());
                    else announce('No available modifiers in this category.');
                    break;
                }
            }
        });

        refresh();
        BO.SelectionHighlight.register(shell, { ['modifier-view-' + mode]: '.mod-nav-btn' });
        BO.SelectionHighlight.update(shell);
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
