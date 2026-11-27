
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
            const width = current.offsetWidth;
            const height = current.offsetHeight;
            if (!width || !height) continue;
            const left = current.offsetLeft;
            const top = current.offsetTop;
            const color = getComputedStyle(current).getPropertyValue('--pick-col').trim();
            const from = previous.get(group.dataset.selectionGroup);
            if (!track) {
                track = document.createElement('span');
                track.className = 'selection-highlight';
                track.setAttribute('aria-hidden', 'true');
                group.append(track);
            }
            group.classList.add('has-selection-highlight');
            const nextBox = { left: left + 'px', top: top + 'px', width: width + 'px', height: height + 'px' };
            const moved = Object.entries(nextBox).some(([key, value]) => track.style[key] !== value);
            if (moved || from || !animate) track.getAnimations().forEach(motion => motion.cancel());

            track.style.setProperty('--selection-ink', color || 'var(--mod-accent, #f6b557)');
            Object.assign(track.style, nextBox);

            if (from && animate) {
                // Convert the visible previous rectangle to the track's local coordinates.
                const target = track.getBoundingClientRect();
                const sx = from.rect.width / target.width;
                const sy = from.rect.height / target.height;
                const dx = (from.rect.left - target.left) * width / target.width;
                const dy = (from.rect.top - target.top) * height / target.height;
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
