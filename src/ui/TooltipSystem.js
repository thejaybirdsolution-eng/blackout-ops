/* ============================================================================
   BLACKOUT OPS — Global Plain-English Hover Tooltip System
   Automatically shows friendly, easy-to-understand explanations when hovering
   over ANY element with [data-tip] anywhere in menus, Gunsmith, Barracks, or HUD.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    class TooltipSystem {
        constructor() {
            this.el = null;
            this.activeTarget = null;
            this.lastX = 0;
            this.lastY = 0;
        }

        init() {
            if (this.el) return;
            const box = document.createElement('div');
            box.id = 'bo-tooltip';
            box.className = 'bo-tooltip hidden';
            box.innerHTML = `
                <div class="bo-tip-title"></div>
                <div class="bo-tip-body"></div>
                <div class="bo-tip-sub"></div>
            `;
            document.body.appendChild(box);
            this.el = box;

            document.addEventListener('mouseover', (e) => {
                if (BO.State && BO.State.screen === 'playing' && !BO.State.paused) {
                    if (this.activeTarget) this.hide();
                    return;
                }
                const target = e.target && e.target.closest ? e.target.closest('[data-tip]') : null;
                if (target) {
                    this.show(target, e.clientX, e.clientY);
                } else if (this.activeTarget) {
                    this.hide();
                }
            });

            document.addEventListener('mousemove', (e) => {
                if (BO.State && BO.State.screen === 'playing' && !BO.State.paused) return;
                this.lastX = e.clientX;
                this.lastY = e.clientY;
                if (this.activeTarget && !this.el.classList.contains('hidden')) {
                    this._position(e.clientX, e.clientY);
                }
            });

            document.addEventListener('mouseout', (e) => {
                if (!this.activeTarget) return;
                const related = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest('[data-tip]') : null;
                if (!related) {
                    this.hide();
                }
            });

            document.addEventListener('mousedown', () => this.hide());
            window.addEventListener('blur', () => this.hide());
        }

        show(target, x, y) {
            if (!this.el || !target) return;
            const text = target.getAttribute('data-tip');
            if (!text) return;
            this.activeTarget = target;

            const title = target.getAttribute('data-tip-title') || '';
            const sub = target.getAttribute('data-tip-sub') || '';

            const titleEl = this.el.querySelector('.bo-tip-title');
            const bodyEl = this.el.querySelector('.bo-tip-body');
            const subEl = this.el.querySelector('.bo-tip-sub');

            titleEl.textContent = title;
            titleEl.classList.toggle('hidden', !title);
            bodyEl.textContent = text;
            subEl.textContent = sub;
            subEl.classList.toggle('hidden', !sub);

            this.el.classList.remove('hidden');
            this._position(x, y);
        }

        _position(cx, cy) {
            const pad = 14;
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const rect = this.el.getBoundingClientRect();
            let left = cx + 16;
            let top = cy + 16;

            if (left + rect.width + pad > vw) {
                left = Math.max(pad, cx - rect.width - 16);
            }
            if (top + rect.height + pad > vh) {
                top = Math.max(pad, cy - rect.height - 16);
            }
            this.el.style.left = left + 'px';
            this.el.style.top = top + 'px';
        }

        hide() {
            this.activeTarget = null;
            if (this.el) this.el.classList.add('hidden');
        }
    }

    BO.Tooltips = new TooltipSystem();
})(window);
