/* ============================================================================
   BLACKOUT OPS — Controls panel
   View every control for the current mode (or any mode), rebind any key,
   resolve conflicts by swapping, reset per group, and toggle HUD key hints.
   Opens from the pause menu and is embedded in Settings › Controls.
============================================================================ */
(function (BO) {
    'use strict';

    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const tip = (title, body, sub) => ` data-tip-title="${esc(title)}" data-tip="${esc(body)}"${sub ? ` data-tip-sub="${esc(sub)}"` : ''}`;
    const CONTEXTS = [
        ['current', 'This mode'], ['all', 'All modes'], ['survival', 'Survival'], ['zombies', 'Zombies'], ['mp', 'Multiplayer'], ['td', 'Tower Defense']
    ];
    const MODE_NAME = { survival: 'Survival', zombies: 'Zombies', mp: 'Multiplayer', td: 'Tower Defense' };

    class ControlsPanel {
        constructor() {
            this.context = 'current';
            this.query = '';
            this.listening = null;
            this.notice = '';
        }

        /** Opens the standalone modal (pause menu). */
        open() {
            if (!this.modal) {
                this.modal = document.createElement('div');
                this.modal.id = 'modal-controls';
                this.modal.className = 'ui-modal hidden cp-modal';
                this.modal.innerHTML = `<div class="modal-box cp-box">
                    <div class="cp-modal-head"><div><span class="cp-kicker">Pause menu</span><h2>Controls</h2></div>
                    <button class="btn btn-sm" data-cp-close${tip('Done', 'Close the controls panel. Changes save automatically.')}>DONE</button></div>
                    <div class="cp-host"></div></div>`;
                document.body.append(this.modal);
                this.modal.querySelector('[data-cp-close]').onclick = () => this.close();
                this.modal.addEventListener('mousedown', (e) => { if (e.target === this.modal) this.close(); });
            }
            this.context = BO.State.activeMode && BO.State.screen === 'playing' ? 'current' : (this.context === 'current' ? 'all' : this.context);
            this.notice = '';
            this.modal.classList.remove('hidden');
            this.mount(this.modal.querySelector('.cp-host'));
        }

        close() {
            this.stopListening();
            if (this.modal) this.modal.classList.add('hidden');
        }

        get isOpen() { return !!this.modal && !this.modal.classList.contains('hidden'); }

        /** Renders into any container and wires its events (idempotent per container). */
        mount(host) {
            this.host = host;
            if (!host.dataset.cpBound) {
                host.dataset.cpBound = '1';
                host.addEventListener('click', (e) => this.onClick(e));
                host.addEventListener('input', (e) => {
                    if (e.target.matches('[data-cp-search]')) {
                        this.query = e.target.value;
                        this.renderList();
                    } else if (e.target.matches('[data-cp-range]')) {
                        const key = e.target.dataset.cpRange;
                        const v = Number(e.target.value);
                        BO.Settings.set(key, v);
                        const lbl = host.querySelector(`[data-cp-val="${key}"]`);
                        if (lbl) lbl.textContent = key === 'uiScale' ? Math.round(v * 100) + '%' : key === 'adsSensitivity' ? v.toFixed(2) : v.toFixed(1);
                    }
                });
            }
            this.render();
        }

        activeContext() {
            if (this.context === 'current') return BO.State.activeMode && BO.State.screen === 'playing' ? BO.State.activeMode : 'all';
            return this.context;
        }

        render() {
            if (!this.host) return;
            const s = BO.Settings.all;
            const inGame = BO.State.activeMode && BO.State.screen === 'playing';
            const ctxTabs = CONTEXTS.filter(([id]) => id !== 'current' || inGame).map(([id, label]) =>
                `<button class="cp-ctx ${this.context === id ? 'active' : ''}" data-cp-ctx="${id}"${tip(label, id === 'current' ? 'Only the controls that work in ' + (MODE_NAME[BO.State.activeMode] || 'this mode') + '.' : id === 'all' ? 'Every control in the game.' : 'Controls that work in ' + label + '.')}>${id === 'current' ? 'This mode · ' + esc(MODE_NAME[BO.State.activeMode] || '') : label}</button>`).join('');
            this.host.innerHTML = `<div class="cp">
                <div class="cp-top">
                    <div class="cp-ctxs">${ctxTabs}</div>
                    <input class="cp-search" type="search" placeholder="Search controls…" value="${esc(this.query)}" data-cp-search${tip('Search', 'Filter controls by name or key.')}>
                </div>
                <div class="cp-notice ${this.notice ? '' : 'hidden'}" role="status">${esc(this.notice)}</div>
                <div class="cp-cols">
                    <div class="cp-list"></div>
                    <aside class="cp-side">
                        <div class="cp-card"><h4>Mouse</h4>
                            <div class="cp-row cp-sl"${tip('Mouse sensitivity', 'How fast the camera turns when you move the mouse.')}><span>Look sensitivity</span><input type="range" min="0.2" max="3" step="0.1" value="${s.sensitivity}" data-cp-range="sensitivity"><b data-cp-val="sensitivity">${Number(s.sensitivity).toFixed(1)}</b></div>
                            <div class="cp-row cp-sl"${tip('Aim sensitivity', 'Multiplies sensitivity while aiming down sights.')}><span>Aim multiplier</span><input type="range" min="0.3" max="1.2" step="0.05" value="${s.adsSensitivity}" data-cp-range="adsSensitivity"><b data-cp-val="adsSensitivity">${Number(s.adsSensitivity).toFixed(2)}</b></div>
                            <button class="cp-toggle ${s.invertY ? 'on' : ''}" data-cp-toggle="invertY"${tip('Invert Y axis', 'Flip vertical mouse look.')}><i></i>Invert vertical look</button>
                            <ul class="cp-mouse">${BO.Settings.mouseControls.map((m) => `<li${tip(m.label, m.tip)}><kbd>${esc(m.key)}</kbd><span>${esc(m.label)}</span></li>`).join('')}</ul>
                        </div>
                        <div class="cp-card"><h4>Display</h4>
                            <div class="cp-row cp-sl"${tip('Interface scale', 'Scales the HUD, trackers and the Survival terminal from 80% to 140%. Useful on large monitors, small laptops and handhelds.')}><span>Interface scale</span><input type="range" min="0.8" max="1.4" step="0.05" value="${Number(s.uiScale) || 1}" data-cp-range="uiScale"><b data-cp-val="uiScale">${Math.round((Number(s.uiScale) || 1) * 100)}%</b></div>
                            <button class="cp-toggle ${s.showControlHints !== false ? 'on' : ''}" data-cp-toggle="showControlHints"${tip('On-screen key hints', 'Show a small strip of key reminders on the HUD (Survival inventory, crafting, build and map keys).')}><i></i>Show key hints on HUD</button>
                            <button class="cp-toggle ${s.contextualHud !== false ? 'on' : ''}" data-cp-toggle="contextualHud"${tip('Contextual survival HUD', 'Hide food, water, radiation, temperature and noise meters while they are comfortable; they fade back in when they matter.')}><i></i>Contextual survival HUD</button>
                            <button class="cp-toggle ${s.nextUpHint !== false ? 'on' : ''}" data-cp-toggle="nextUpHint"${tip('Next Up hint', 'Survival: after the First Night, a single line under the top bar names the most useful thing you are closest to making and where to find its missing material.')}><i></i>Survival “Next Up” hint</button>
                        </div>
                        <div class="cp-card"><h4>Reset</h4>
                            <p class="cp-muted">Restore every key to its default. ESC always pauses, whatever you bind.</p>
                            <button class="btn btn-sm" data-cp-reset="all"${tip('Reset all keys', 'Restore every keybinding to the default layout.')}>RESET ALL KEYS</button>
                        </div>
                    </aside>
                </div></div>`;
            this.renderList();
        }

        renderList() {
            const list = this.host?.querySelector('.cp-list');
            if (!list) return;
            const kb = BO.Settings.getKeybinds();
            const ctx = this.activeContext();
            const q = this.query.trim().toLowerCase();
            const groups = BO.Settings.controlCatalog.map((g) => {
                const actions = g.actions.filter((a) => (ctx === 'all' || a.ctx.includes(ctx)) &&
                    (!q || a.label.toLowerCase().includes(q) || BO.Settings.keyLabel(kb[a.action]).toLowerCase() === q || (a.tip || '').toLowerCase().includes(q)));
                if (!actions.length) return '';
                const defaults = BO.Settings.defaultKeybinds;
                const changed = actions.some((a) => kb[a.action] !== defaults[a.action]);
                return `<section class="cp-group"><header><h4>${esc(g.label)}</h4>${changed ? `<button class="cp-link" data-cp-reset="${g.group}"${tip('Reset group', 'Restore the default keys for ' + g.label.toLowerCase() + '.')}>Reset</button>` : ''}</header>
                    ${actions.map((a) => {
                        const code = kb[a.action];
                        const conflicts = code && code !== 'Unbound' ? BO.Settings.findConflicts(a.action, code) : [];
                        const listening = this.listening === a.action;
                        const modes = a.ctx.length === 4 ? 'All modes' : a.ctx.map((c) => MODE_NAME[c]).join(', ');
                        return `<div class="cp-bind ${conflicts.length ? 'conflict' : ''}"${tip(a.label, a.tip || '', 'Works in: ' + modes + (conflicts.length ? ' · Conflicts with ' + conflicts.map((c) => c.label).join(', ') : ''))}>
                            <span class="cp-bind-l">${esc(a.label)}${code !== defaults[a.action] ? '<em>custom</em>' : ''}</span>
                            <button class="cp-key ${listening ? 'listening' : ''} ${code === 'Unbound' ? 'unbound' : ''}" data-cp-bind="${a.action}">${listening ? 'Press a key…' : esc(BO.Settings.keyLabel(code))}</button></div>`;
                    }).join('')}</section>`;
            }).join('');
            list.innerHTML = groups || '<p class="cp-muted">No controls match your search.</p>';
            if (this.listening) list.insertAdjacentHTML('afterbegin', '<p class="cp-listen-hint">Press the new key. <kbd>ESC</kbd> cancels · <kbd>BKSP</kbd> unbinds.</p>');
        }

        onClick(e) {
            const t = e.target.closest('[data-cp-ctx],[data-cp-bind],[data-cp-reset],[data-cp-toggle]');
            if (!t) return;
            BO.Sound?.playUIClick?.();
            if (t.dataset.cpCtx) {
                this.context = t.dataset.cpCtx;
                this.stopListening();
                return this.render();
            }
            if (t.dataset.cpToggle) {
                const key = t.dataset.cpToggle;
                const current = (key === 'showControlHints' || key === 'contextualHud' || key === 'nextUpHint') ? BO.Settings.get(key) !== false : !!BO.Settings.get(key);
                BO.Settings.set(key, !current);
                return this.render();
            }
            if (t.dataset.cpReset) {
                const g = t.dataset.cpReset;
                if (g === 'all') BO.Settings.resetKeybinds();
                else BO.Settings.resetKeybinds(BO.Settings.controlCatalog.find((x) => x.group === g)?.actions.map((a) => a.action) || []);
                this.notice = g === 'all' ? 'All keys restored to defaults.' : 'Group restored to defaults.';
                return this.render();
            }
            if (t.dataset.cpBind) this.startListening(t.dataset.cpBind);
        }

        startListening(action) {
            this.stopListening();
            this.listening = action;
            if (BO.Menus) BO.Menus.isRebindingKey = true;
            this._onKey = (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const code = ev.code;
                if (code === 'Escape') return this.finish(null);
                if (code === 'Backspace' || code === 'Delete') return this.finish('Unbound');
                this.finish(code);
            };
            this._onMouse = (ev) => {
                if (!ev.target.closest('[data-cp-bind]')) this.finish(null);
            };
            window.addEventListener('keydown', this._onKey, true);
            setTimeout(() => window.addEventListener('mousedown', this._onMouse, true), 0);
            this.renderList();
        }

        finish(code) {
            const action = this.listening;
            this.stopListening();
            if (action && code) {
                const kb = BO.Settings.getKeybinds();
                const old = kb[action];
                if (code !== 'Unbound') {
                    const conflicts = BO.Settings.findConflicts(action, code);
                    for (const c of conflicts) BO.Settings.setKeybind(c.action, old || 'Unbound');
                    this.notice = conflicts.length
                        ? 'Bound to ' + BO.Settings.keyLabel(code) + '. Swapped with ' + conflicts.map((c) => c.label).join(', ') + ' (now ' + BO.Settings.keyLabel(old) + ').'
                        : 'Bound to ' + BO.Settings.keyLabel(code) + '.';
                } else {
                    this.notice = 'Key cleared. That action has no key now.';
                }
                BO.Settings.setKeybind(action, code);
            }
            this.render();
        }

        stopListening() {
            if (this._onKey) window.removeEventListener('keydown', this._onKey, true);
            if (this._onMouse) window.removeEventListener('mousedown', this._onMouse, true);
            this._onKey = null;
            this._onMouse = null;
            const was = this.listening;
            this.listening = null;
            if (BO.Menus) {
                // Let the swallowed keyup pass before game input resumes.
                setTimeout(() => { if (!this.listening) BO.Menus.isRebindingKey = false; }, 60);
            }
            return was;
        }
    }

    BO.ControlsPanel = new ControlsPanel();
})(window.BO);
