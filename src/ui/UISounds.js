/* ============================================================================
   BLACKOUT OPS — Global Delegated UI Audio Feedback
   Zero-build IIFE module (ADR-002).
   Single delegated listener for hover, click, back, tab-switch, disabled,
   toggle, and slider ticks across every screen, modal, and minigame.
   ============================================================================ */
(function (BO) {
    'use strict';

    const INTERACTIVE = [
        'button', '.btn', 'a[href]', '[role="button"]', '[role="tab"]',
        '.mode-card', '.mini-tile', '.online-card', '.select-card', '.pick-card',
        '.mode-tab', '.mod-row', '.shop-item', '.cac-slot', '.opt-card',
        '.att-tab', '.camo-swatch', '.sv-btn', '.sv-tab', '.rpg-nav-btn',
        '.rpg-class', '.ow-btn', '.pip-tab', '.pip-nav-btn', '.ow-dlg-opt',
        '.mgh-cat', '.mgh-card', '.mgh-play', '.mgh-example', '.mgh-preview-btn',
        '.ul-pill', '[data-act]', 'input[type="checkbox"]', 'input[type="radio"]', 'select'
    ].join(', ');

    const TAB_SELECTOR = '[role="tab"], .sv-tab, .pip-tab, .att-tab, [data-stab], [data-btab], [data-view]';

    let lastHoverTarget = null;
    let lastHoverAt = 0;

    function isDisabled(el) {
        return !!(el.disabled || el.getAttribute('aria-disabled') === 'true' || el.classList.contains('locked'));
    }

    function isBackButton(el) {
        if (!el) return false;
        const snd = el.getAttribute('data-sound');
        if (snd === 'back') return true;
        if (el.id && /close|back|cancel/i.test(el.id)) return true;
        if (el.hasAttribute('data-close') || el.classList.contains('modal-close')) return true;
        const txt = (el.textContent || '').trim();
        return /^(✕|BACK|CLOSE|CANCEL)\b/i.test(txt);
    }

    function onPointerOver(e) {
        if (BO.State && BO.State.screen === 'playing' && !BO.State.paused && document.pointerLockElement) return;
        const el = e.target && e.target.closest ? e.target.closest(INTERACTIVE) : null;
        if (!el) {
            lastHoverTarget = null;
            return;
        }
        if (el === lastHoverTarget || isDisabled(el)) return;
        lastHoverTarget = el;
        const now = performance.now();
        if (now - lastHoverAt < 50) return;
        lastHoverAt = now;
        if (el.getAttribute('data-sound') === 'none') return;
        BO.Sound?.playUIHover?.();
    }

    function onClick(e) {
        const el = e.target && e.target.closest ? e.target.closest(INTERACTIVE) : null;
        if (!el) return;
        const snd = el.getAttribute('data-sound');
        if (snd === 'none') return;
        if (isDisabled(el)) {
            BO.Sound?.playUIDisabled?.();
            return;
        }
        if (el.matches('input[type="checkbox"], input[type="radio"], select')) return;

        // Avoid double-triggering if the element's own handler already played a UI sound this turn
        const recent = BO.Sound && BO.Sound._recentSfx;
        if (recent) {
            const now = performance.now();
            for (const k of ['ui_click', 'ui_back', 'ui_tab', 'ui_toggle']) {
                const t = recent.get(k);
                if (t && now - t < 40) return;
            }
        }

        if (isBackButton(el)) BO.Sound?.playUIBack?.();
        else if (snd === 'tab' || el.matches(TAB_SELECTOR)) BO.Sound?.playUITab?.();
        else BO.Sound?.playUIClick?.();
    }

    function onChange(e) {
        const el = e.target;
        if (!el || !el.matches('input[type="checkbox"], input[type="radio"], select')) return;
        if (el.getAttribute('data-sound') === 'none') return;
        BO.Sound?.playUIToggle?.(el.type === 'checkbox' ? el.checked : true);
    }

    function onInput(e) {
        const el = e.target;
        if (!el || !el.matches('input[type="range"]')) return;
        if (el.getAttribute('data-sound') === 'none') return;
        BO.Sound?.playUISliderTick?.();
    }

    function unlockOnce() {
        BO.Sound?.ensureContext?.();
        document.removeEventListener('pointerdown', unlockOnce, true);
        document.removeEventListener('keydown', unlockOnce, true);
    }

    function init() {
        document.addEventListener('pointerdown', unlockOnce, true);
        document.addEventListener('keydown', unlockOnce, true);
        document.addEventListener('pointerover', onPointerOver, { passive: true });
        document.addEventListener('click', onClick, false);
        document.addEventListener('change', onChange, false);
        document.addEventListener('input', onInput, { passive: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    BO.UISounds = { INTERACTIVE };
})(window.BO = window.BO || {});
