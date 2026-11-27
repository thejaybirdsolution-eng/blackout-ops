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
            this._openTimer = null;
            this._pendingTarget = null;
            this._lastHideAt = 0;
        }

        init() {
            if (this.el) return;
            const box = document.createElement('div');
            box.id = 'bo-tooltip';
            box.className = 'bo-tooltip hidden';
            box.style.pointerEvents = 'none';
            box.innerHTML = `
                <div class="bo-tip-title"></div>
                <div class="bo-tip-body"></div>
                <div class="bo-tip-sub"></div>
                <div class="bo-tip-rich hidden"></div>
            `;
            document.body.appendChild(box);
            this.el = box;

            const inGameBlocked = (e) => BO.State && BO.State.screen === 'playing' && !BO.State.paused &&
                !(e.target && e.target.closest && e.target.closest('dialog[open], .ui-modal:not(.hidden)'));
            document.addEventListener('mouseover', (e) => {
                if (inGameBlocked(e)) {
                    if (this.activeTarget || this._pendingTarget) this.hide();
                    return;
                }
                const target = e.target && e.target.closest ? e.target.closest('[data-tip], [data-tip-enemy]') : null;
                if (target) {
                    this.scheduleShow(target, e.clientX, e.clientY);
                } else if (this.activeTarget || this._pendingTarget) {
                    this.hide();
                }
            });

            document.addEventListener('mousemove', (e) => {
                if (inGameBlocked(e)) return;
                this.lastX = e.clientX;
                this.lastY = e.clientY;
                if (this.activeTarget && !this.el.classList.contains('hidden')) {
                    this._position(e.clientX, e.clientY);
                }
            });

            document.addEventListener('mouseout', (e) => {
                if (!this.activeTarget && !this._pendingTarget) return;
                const related = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest('[data-tip], [data-tip-enemy]') : null;
                if (!related) {
                    this.hide();
                }
            });

            document.addEventListener('mousedown', () => this.hide());
            window.addEventListener('blur', () => this.hide());
        }

        scheduleShow(target, x, y) {
            if (!this.el || !target) return;
            this.lastX = x;
            this.lastY = y;
            if (target === this.activeTarget && !this.el.classList.contains('hidden')) {
                this._position(x, y);
                return;
            }
            clearTimeout(this._openTimer);
            const warm = this.activeTarget || (performance.now() - this._lastHideAt < 220);
            if (warm) {
                this._pendingTarget = null;
                this.show(target, x, y);
                return;
            }
            this._pendingTarget = target;
            this._openTimer = setTimeout(() => {
                if (this._pendingTarget === target && target.isConnected) {
                    this._pendingTarget = null;
                    this.show(target, this.lastX, this.lastY);
                }
            }, 140);
        }

        show(target, x, y) {
            if (!this.el || !target) return;
            const text = target.getAttribute('data-tip');
            const enemyId = target.getAttribute('data-tip-enemy');
            if (!text && !enemyId) return;
            if (target === this.activeTarget && !this.el.classList.contains('hidden')) {
                this._position(x, y);
                return;
            }
            this.activeTarget = target;
            // Modal <dialog>s render in the top layer: the tooltip must live inside them to be visible.
            const host = target.closest('dialog[open]') || document.body;
            if (this.el.parentNode !== host) host.appendChild(this.el);

            const title = target.getAttribute('data-tip-title') || '';
            const sub = target.getAttribute('data-tip-sub') || '';

            const titleEl = this.el.querySelector('.bo-tip-title');
            const bodyEl = this.el.querySelector('.bo-tip-body');
            const subEl = this.el.querySelector('.bo-tip-sub');

            const richEl = this.el.querySelector('.bo-tip-rich');
            const spec = enemyId && BO.EnemyInfo ? BO.EnemyInfo.specById(enemyId) : null;
            this.el.classList.toggle('is-rich', !!spec);
            richEl.classList.toggle('hidden', !spec);
            if (spec) {
                richEl.innerHTML = BO.EnemyInfo.card(spec, sub);
                titleEl.classList.add('hidden');
                bodyEl.classList.add('hidden');
                subEl.classList.add('hidden');
            } else {
                richEl.innerHTML = '';
                bodyEl.classList.remove('hidden');
                titleEl.textContent = title;
                titleEl.classList.toggle('hidden', !title);
                bodyEl.textContent = text;
                subEl.textContent = sub;
                subEl.classList.toggle('hidden', !sub);
            }

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
                if (cy - rect.height - 16 >= pad) {
                    top = cy - rect.height - 16;
                } else {
                    top = Math.max(pad, vh - rect.height - pad);
                }
            }
            this.el.style.left = Math.round(left) + 'px';
            this.el.style.top = Math.round(top) + 'px';
        }

        hide() {
            clearTimeout(this._openTimer);
            this._openTimer = null;
            this._pendingTarget = null;
            if (this.activeTarget) this._lastHideAt = performance.now();
            this.activeTarget = null;
            if (this.el) this.el.classList.add('hidden');
        }
    }

    BO.Tooltips = new TooltipSystem();
})(window);
