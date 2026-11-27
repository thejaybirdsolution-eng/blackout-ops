
(function (BO) {
    'use strict';

    const groups = '[data-selection-group]';
    const option = '[data-selection-option]';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function selected(group) {
        const choices = [...group.children].filter((el) => el.matches(option));
        return choices.find((el) => el.classList.contains('active')) ||
            choices.find((el) => el.getAttribute('aria-pressed') === 'true');
    }

    function trackFor(group) {
        return group.querySelector(':scope > .selection-highlight');
    }

    function register(root, options) {
        for (const [name, selector] of Object.entries(options)) {
            const buttons = [...root.querySelectorAll(selector)];
            const group = buttons[0]?.parentElement;
            if (!group) continue;
            group.dataset.selectionGroup = name;
            for (const button of buttons) {
                if (button.parentElement === group) button.dataset.selectionOption = '';
            }
        }
    }

    function capture(root) {
        const positions = new Map();
        for (const group of root.querySelectorAll(groups)) {
            const current = selected(group);
            if (!current) continue;
            const rect = (trackFor(group) || current).getBoundingClientRect();
            if (rect.width && rect.height) {
                positions.set(group.dataset.selectionGroup, {
                    rect,
                    focus: document.activeElement?.parentElement === group && document.activeElement.matches(option)
                });
            }
        }
        return positions;
    }

    function update(root, previous = new Map()) {
        const animate = !reducedMotion.matches && !BO.Settings?.get('reducedMotion');
        for (const group of root.querySelectorAll(groups)) {
            const current = selected(group);
            let track = trackFor(group);
            for (const button of group.querySelectorAll(':scope > ' + option)) {
                if (button.type === 'button' || button.tagName === 'BUTTON') {
                    button.setAttribute('aria-pressed', String(button === current));
                }
            }
            if (!current) {
                track?.remove();
                group.classList.remove('has-selection-highlight');
                continue;
            }
            const rect = current.getBoundingClientRect();
            if (!rect.width || !rect.height) continue;
            const color = getComputedStyle(current).getPropertyValue('--pick-col').trim();
            const frame = group.getBoundingClientRect();
            const from = previous.get(group.dataset.selectionGroup);
            if (!track) {
                track = document.createElement('span');
                track.className = 'selection-highlight';
                track.setAttribute('aria-hidden', 'true');
                group.append(track);
            }
            group.classList.add('has-selection-highlight');
            track.getAnimations().forEach((motion) => motion.cancel());
            track.style.setProperty('--selection-ink', color || 'var(--mod-accent, #f6b557)');
            track.style.left = (rect.left - frame.left + group.scrollLeft - group.clientLeft) + 'px';
            track.style.top = (rect.top - frame.top + group.scrollTop - group.clientTop) + 'px';
            track.style.width = rect.width + 'px';
            track.style.height = rect.height + 'px';

            if (from && animate) {
                const dx = from.rect.left - rect.left;
                const dy = from.rect.top - rect.top;
                const sx = from.rect.width / rect.width;
                const sy = from.rect.height / rect.height;
                if (Math.abs(dx) + Math.abs(dy) > 1 || Math.abs(sx - 1) + Math.abs(sy - 1) > 0.02) {
                    track.animate([
                        { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(' + sx + ', ' + sy + ')' },
                        { transform: 'none' }
                    ], { duration: 280, easing: 'cubic-bezier(.2,.78,.22,1)' });
                }
            }
            if (from?.focus && document.activeElement === document.body) current.focus({ preventScroll: true });
        }
    }

    const refresh = () => update(document);
    window.addEventListener('resize', refresh, { passive: true });
    document.fonts?.ready.then(refresh);
    BO.SelectionHighlight = { register, capture, update };
})(window.BO);
