/* ============================================================================
   BLACKOUT OPS — Global UI Polish, Motion, Focus Traps & Settings Controls
   Zero-build IIFE module (ADR-002).
   Layers on top of MenuController / existing screens without touching dirty files.
   ============================================================================ */
(function (BO) {
    'use strict';

    const FOCUSABLE = 'a[href], button:not([disabled]):not([aria-disabled="true"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function cubicOutApprox(t) {
        if (t <= 0) return 0;
        if (t >= 1) return 1;
        const u = 1 - t;
        return 1 - u * u * u;
    }

    function isReducedMotion() {
        try {
            if (BO.Settings && BO.Settings.get && BO.Settings.get('reducedMotion')) return true;
            if (document.body && document.body.classList.contains('sv-reduced-motion')) return true;
            return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        } catch (_) {
            return false;
        }
    }

    const _numAnims = new WeakMap();
    function animateNumber(el, from, to, ms = 220, fmt = null) {
        if (!el) return;
        const a = Number(from) || 0;
        const b = Number(to) || 0;
        const format = fmt || ((v) => String(Math.round(v)));
        if (a === b || isReducedMotion() || ms <= 0) {
            el.textContent = format(b);
            return;
        }
        const prevRaf = _numAnims.get(el);
        if (prevRaf) cancelAnimationFrame(prevRaf);

        const bigDelta = Math.abs(b - a) >= 100;
        if (bigDelta) {
            el.classList.remove('bo-num-pulse');
            void el.offsetWidth;
            el.classList.add('bo-num-pulse');
        }

        const start = performance.now();
        const step = (now) => {
            const p = Math.min(1, (now - start) / ms);
            const v = a + (b - a) * cubicOutApprox(p);
            el.textContent = format(v);
            if (p < 1) {
                _numAnims.set(el, requestAnimationFrame(step));
            } else {
                el.textContent = format(b);
                _numAnims.delete(el);
            }
        };
        _numAnims.set(el, requestAnimationFrame(step));
    }

    function applyStagger(container, selector = '*') {
        if (!container) return;
        if (isReducedMotion()) return;
        const els = container.querySelectorAll(selector);
        for (let i = 0; i < els.length; i++) {
            els[i].style.setProperty('--stagger-idx', String(Math.min(i, 12)));
            els[i].classList.add('bo-stagger-item');
        }
    }

    function renderState(kind, title, detail = '') {
        const cls = kind === 'error' ? 'bo-error-state' : (kind === 'loading' ? 'bo-loading-state' : 'bo-empty-state');
        const safe = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        const skel = kind === 'loading' ? '<div class="bo-skeleton" style="width:180px;height:12px;"></div>' : '';
        return `<div class="${cls}" role="${kind === 'error' ? 'alert' : 'status'}">` +
            `<strong style="letter-spacing:0.08em;color:var(--aaa-text);">${safe(title)}</strong>` +
            (detail ? `<span>${safe(detail)}</span>` : '') +
            skel +
            `</div>`;
    }

    /* ---------------- Modal Focus Trap, Stack & Restore ---------------- */
    const modalStack = [];
    const returnFocusMap = new WeakMap();

    function getVisibleFocusables(root) {
        return Array.from(root.querySelectorAll(FOCUSABLE)).filter((el) => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
        });
    }

    function onModalOpened(modal) {
        if (!modal || modal.id === 'scoreboard-overlay') return;
        if (!modalStack.includes(modal)) {
            returnFocusMap.set(modal, document.activeElement);
            modalStack.push(modal);
        }
        const box = modal.querySelector('.modal-box') || modal;
        requestAnimationFrame(() => {
            if (modal.classList.contains('hidden')) return;
            const focusables = getVisibleFocusables(box);
            if (focusables.length && !box.contains(document.activeElement)) {
                focusables[0].focus({ preventScroll: true });
            }
        });
    }

    function onModalClosed(modal) {
        const idx = modalStack.indexOf(modal);
        if (idx !== -1) modalStack.splice(idx, 1);
        const prev = returnFocusMap.get(modal);
        returnFocusMap.delete(modal);
        if (prev && prev.isConnected && typeof prev.focus === 'function') {
            requestAnimationFrame(() => prev.focus({ preventScroll: true }));
        }
    }

    function setupModalObserver() {
        const syncModal = (m) => {
            if (!m || !m.classList || !m.classList.contains('ui-modal')) return;
            if (m.classList.contains('hidden')) onModalClosed(m);
            else onModalOpened(m);
        };
        const obs = new MutationObserver((muts) => {
            for (const mut of muts) {
                if (mut.type === 'attributes' && mut.attributeName === 'class') {
                    syncModal(mut.target);
                }
            }
        });
        document.querySelectorAll('.ui-modal').forEach((m) => {
            obs.observe(m, { attributes: true, attributeFilter: ['class'] });
        });

        document.addEventListener('keydown', (e) => {
            const top = modalStack[modalStack.length - 1];
            if (!top || top.classList.contains('hidden')) return;
            if (e.key === 'Tab') {
                const box = top.querySelector('.modal-box') || top;
                const list = getVisibleFocusables(box);
                if (!list.length) return;
                const first = list[0];
                const last = list[list.length - 1];
                if (e.shiftKey && (document.activeElement === first || !box.contains(document.activeElement))) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && (document.activeElement === last || !box.contains(document.activeElement))) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }, true);
    }

    /* ---------------- Inject Missing Video/Sound Controls into Settings ---------------- */
    function injectSettingsControls() {
        const body = document.getElementById('settings-body');
        const tabs = document.getElementById('settings-tabs');
        if (!body || !tabs || !BO.Settings) return;
        const activeBtn = tabs.querySelector('.active');
        const activeTab = activeBtn ? (activeBtn.dataset.stab || '') : '';

        if (activeTab === 'video' && !document.getElementById('set-reduced-motion')) {
            const anchor = document.getElementById('set-shake')?.closest('.settings-row') || body.lastElementChild;
            const row = document.createElement('label');
            row.className = 'settings-row';
            row.setAttribute('data-tip', 'Disables non-essential UI animations, particles, and screen shakes.');
            const cur = !!BO.Settings.get('reducedMotion');
            row.innerHTML = `<span>Reduced Motion</span><input type="checkbox" id="set-reduced-motion" ${cur ? 'checked' : ''}>`;
            if (anchor && anchor.parentNode === body) anchor.after(row);
            else body.appendChild(row);
            row.querySelector('#set-reduced-motion').addEventListener('change', (e) => {
                BO.Settings.set('reducedMotion', !!e.target.checked);
            });
        }

        if (activeTab === 'sound' && !document.getElementById('set-uivol')) {
            const s = BO.Settings.all;
            const uiRow = document.createElement('label');
            uiRow.className = 'settings-row';
            const uiVal = s.uiVolume ?? 0.8;
            uiRow.innerHTML = `<span>UI Feedback Volume (<span id="lbl-uivol">${Math.round(uiVal * 100)}%</span>)</span>` +
                `<input type="range" id="set-uivol" min="0" max="1" step="0.05" value="${uiVal}">`;
            body.appendChild(uiRow);
            uiRow.querySelector('#set-uivol').addEventListener('input', (e) => {
                const v = Number(e.target.value);
                uiRow.querySelector('#lbl-uivol').textContent = Math.round(v * 100) + '%';
                BO.Settings.set('uiVolume', v);
                BO.Sound?.applyVolumes?.(true);
            });

            const hideRow = document.createElement('label');
            hideRow.className = 'settings-row';
            const muteHidden = s.muteWhenHidden !== false;
            hideRow.innerHTML = `<span>Mute Audio When Tab Hidden</span><input type="checkbox" id="set-mute-hidden" ${muteHidden ? 'checked' : ''}>`;
            body.appendChild(hideRow);
            hideRow.querySelector('#set-mute-hidden').addEventListener('change', (e) => {
                BO.Settings.set('muteWhenHidden', !!e.target.checked);
                BO.Sound?.applyVolumes?.(true);
            });
        }
    }

    function wireSelectionTabs() {
        if (!BO.SelectionHighlight || !BO.SelectionHighlight.register) return;
        const pairs = [
            ['#settings-tabs', 'settings-tabs', 'button, [data-stab]'],
            ['#barracks-tabs', 'barracks-tabs', 'button, [data-btab]'],
            ['#legend-tabs', 'legend-tabs', 'button'],
            ['#box-picker-tabs', 'box-picker-tabs', 'button']
        ];
        for (const [sel, key, optSel] of pairs) {
            const el = document.querySelector(sel);
            if (el) BO.SelectionHighlight.register(el, { [key]: optSel });
        }
    }

    function init() {
        setupModalObserver();

        const settingsBody = document.getElementById('settings-body');
        if (settingsBody) {
            const sobs = new MutationObserver(() => {
                injectSettingsControls();
                wireSelectionTabs();
            });
            sobs.observe(settingsBody, { childList: true });
            injectSettingsControls();
        }
        wireSelectionTabs();

        // Friendly error notice if multiplayer/network emits an error
        if (BO.Events && BO.Events.on) {
            BO.Events.on('net:error', (err) => {
                const msg = (err && err.message) || String(err || 'Connection unavailable');
                BO.Events.emit('hud:toast', { text: 'NETWORK: ' + msg, color: '#ff6b5a' });
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    BO.UIPolish = {
        easeOut: cubicOutApprox,
        isReducedMotion,
        animateNumber,
        applyStagger,
        renderState,
        injectSettingsControls
    };
})(window.BO = window.BO || {});
