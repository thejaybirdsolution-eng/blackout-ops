/* ============================================================================
   BLACKOUT OPS — Tactical Dialog System (BO.Dialog)
   Replaces blocking browser alert/confirm/prompt popups with a non-blocking
   Promise-based tactical modal aligned with --ui-* / --aaa-* styling.
   ============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO = global.BO || {};

    let backdrop = null;
    let activeResolve = null;
    let activeCancelValue = false;
    let activeMode = 'confirm';
    let keyListenerBound = false;

    function releasePointerLock() {
        if (typeof document !== 'undefined' && document.pointerLockElement) {
            try { document.exitPointerLock(); } catch (_) {}
        }
    }

    function ensureDom() {
        if (backdrop) return backdrop;
        backdrop = document.createElement('div');
        backdrop.id = 'bo-dialog-backdrop';
        backdrop.className = 'bo-dialog-backdrop hidden';
        backdrop.setAttribute('role', 'dialog');
        backdrop.setAttribute('aria-modal', 'true');
        backdrop.setAttribute('aria-labelledby', 'bo-dialog-title');
        backdrop.innerHTML = `
            <div class="bo-dialog-box" data-tone="amber">
                <div class="bo-dialog-head">
                    <div>
                        <div class="bo-dialog-kicker" id="bo-dialog-kicker"></div>
                        <h3 class="bo-dialog-title" id="bo-dialog-title"></h3>
                    </div>
                    <button type="button" class="btn btn-sm bo-dialog-x" id="bo-dialog-x" aria-label="Close">✕</button>
                </div>
                <p class="bo-dialog-msg" id="bo-dialog-msg"></p>
                <div class="bo-dialog-field hidden" id="bo-dialog-field">
                    <input type="text" class="bo-dialog-input" id="bo-dialog-input" autocomplete="off" spellcheck="false">
                    <textarea class="bo-dialog-textarea hidden" id="bo-dialog-textarea" rows="6" spellcheck="false"></textarea>
                </div>
                <div class="bo-dialog-actions">
                    <button type="button" class="btn btn-sm" id="bo-dialog-cancel">CANCEL</button>
                    <button type="button" class="btn btn-sm btn-primary" id="bo-dialog-confirm">CONFIRM</button>
                </div>
            </div>`;
        document.body.appendChild(backdrop);

        backdrop.addEventListener('mousedown', (e) => {
            if (e.target === backdrop) finish(activeCancelValue);
        });
        backdrop.querySelector('#bo-dialog-x').onclick = () => finish(activeCancelValue);
        backdrop.querySelector('#bo-dialog-cancel').onclick = () => finish(activeCancelValue);
        backdrop.querySelector('#bo-dialog-confirm').onclick = () => submitCurrent();

        const inp = backdrop.querySelector('#bo-dialog-input');
        inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitCurrent();
            }
        });
        const ta = backdrop.querySelector('#bo-dialog-textarea');
        ta.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                submitCurrent();
            }
        });

        if (!keyListenerBound) {
            keyListenerBound = true;
            window.addEventListener('keydown', (e) => {
                if (!backdrop || backdrop.classList.contains('hidden')) return;
                if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    finish(activeCancelValue);
                } else if (e.key === 'Enter' && activeMode !== 'prompt') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    submitCurrent();
                }
            }, true);
        }
        return backdrop;
    }

    function submitCurrent() {
        if (!backdrop) return;
        if (activeMode === 'prompt') {
            const ta = backdrop.querySelector('#bo-dialog-textarea');
            const inp = backdrop.querySelector('#bo-dialog-input');
            const val = ta.classList.contains('hidden') ? inp.value : ta.value;
            finish(val);
        } else if (activeMode === 'confirm') {
            finish(true);
        } else {
            finish(undefined);
        }
    }

    function finish(value) {
        if (!backdrop || backdrop.classList.contains('hidden')) return;
        backdrop.classList.add('hidden');
        BO.Sound?.playUIClick?.();
        const resolve = activeResolve;
        activeResolve = null;
        if (resolve) resolve(value);
    }

    function normalizeOpts(input, defaults) {
        if (typeof input === 'string') return Object.assign({}, defaults, { message: input });
        return Object.assign({}, defaults, input || {});
    }

    function openDialog(mode, rawOpts, cancelVal) {
        if (activeResolve) finish(activeCancelValue);
        releasePointerLock();
        const el = ensureDom();
        const box = el.querySelector('.bo-dialog-box');
        const opts = normalizeOpts(rawOpts, {
            kicker: 'BLACKOUT OPS',
            title: mode === 'alert' ? 'NOTICE' : (mode === 'prompt' ? 'INPUT REQUIRED' : 'CONFIRM ACTION'),
            message: '',
            tone: 'amber',
            confirmLabel: mode === 'alert' ? 'OK' : 'CONFIRM',
            cancelLabel: mode === 'alert' ? '' : 'CANCEL',
            defaultValue: '',
            placeholder: '',
            maxLength: 0,
            multiline: false,
            readOnly: false,
            selectAll: false
        });

        activeMode = mode;
        activeCancelValue = cancelVal;
        box.dataset.tone = opts.tone || 'amber';

        const kickerEl = el.querySelector('#bo-dialog-kicker');
        kickerEl.textContent = opts.kicker || 'BLACKOUT OPS';
        kickerEl.classList.toggle('hidden', !opts.kicker);

        el.querySelector('#bo-dialog-title').textContent = opts.title || 'CONFIRM';
        const msgEl = el.querySelector('#bo-dialog-msg');
        msgEl.textContent = opts.message || '';
        msgEl.classList.toggle('hidden', !opts.message);

        const fieldEl = el.querySelector('#bo-dialog-field');
        const inp = el.querySelector('#bo-dialog-input');
        const ta = el.querySelector('#bo-dialog-textarea');
        box.classList.toggle('is-wide', !!opts.multiline);

        if (mode === 'prompt') {
            fieldEl.classList.remove('hidden');
            const activeField = opts.multiline ? ta : inp;
            const inactiveField = opts.multiline ? inp : ta;
            inactiveField.classList.add('hidden');
            activeField.classList.remove('hidden');
            activeField.value = opts.defaultValue != null ? String(opts.defaultValue) : '';
            activeField.placeholder = opts.placeholder || '';
            activeField.readOnly = !!opts.readOnly;
            if (opts.maxLength > 0) activeField.maxLength = opts.maxLength;
            else activeField.removeAttribute('maxlength');
        } else {
            fieldEl.classList.add('hidden');
        }

        const cancelBtn = el.querySelector('#bo-dialog-cancel');
        const confirmBtn = el.querySelector('#bo-dialog-confirm');
        const showCancel = opts.cancelLabel !== '' && opts.cancelLabel !== false && opts.cancelLabel !== null;
        cancelBtn.classList.toggle('hidden', !showCancel);
        cancelBtn.textContent = opts.cancelLabel || 'CANCEL';

        confirmBtn.textContent = opts.confirmLabel || 'CONFIRM';
        confirmBtn.className = 'btn btn-sm ' + (opts.tone === 'danger' ? 'btn-zombies' : 'btn-primary');

        el.classList.remove('hidden');
        BO.Sound?.playUIClick?.();

        setTimeout(() => {
            if (mode === 'prompt') {
                const target = opts.multiline ? ta : inp;
                target.focus();
                if (opts.selectAll || opts.defaultValue) {
                    try { target.select(); } catch (_) {}
                }
            } else {
                confirmBtn.focus();
            }
        }, 0);

        return new Promise((resolve) => {
            activeResolve = resolve;
        });
    }

    BO.Dialog = {
        confirm(opts) {
            return openDialog('confirm', opts, false);
        },
        prompt(opts) {
            return openDialog('prompt', opts, null);
        },
        alert(opts) {
            return openDialog('alert', opts, undefined);
        },
        close(value) {
            finish(value !== undefined ? value : activeCancelValue);
        },
        get isOpen() {
            return !!(backdrop && !backdrop.classList.contains('hidden'));
        }
    };
})(window);
