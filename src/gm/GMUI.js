/* ============================================================================
   BLACKOUT OPS — Survival 1.0 UI router (BO.GM.ui)
   Routes `data-act="gm" data-arg="module.command:argument"` buttons from the
   field terminal to the owning module, hosts context panels (gmPanel) and the
   new "Base" terminal tab (power grid, territory, settlers, outposts, hauls,
   threat ladder, weather forecast).
============================================================================ */
(function (BO) {
    'use strict';
    const GM = BO.GM;
    const esc = (v) => GM.esc(v);

    const UI = {
        panels: new Map(),

        /** Modules register context panels: id → { title(), render(subject), act(cmd,arg) } */
        panel(id, def) { this.panels.set(id, def); },

        open(panelId, subject) {
            BO.SurvivalUI.show('gmPanel', null, { panel: panelId, subject });
        },

        title(subject) {
            const p = this.panels.get(subject?.panel);
            return p?.title?.(subject.subject) || '';
        },

        render(subject) {
            const p = this.panels.get(subject?.panel);
            if (!p) return '<p>Nothing here.</p>';
            try { return p.render(subject.subject); } catch (err) { console.error('[GM:ui]', err); return '<p>Panel failed to render.</p>'; }
        },

        renderTab(section) {
            if (section === 'catalogue') return GM.get('catalogue')?.renderTab?.() ?? '<p>Catalogue unavailable.</p>';
            if (section !== 'base') return undefined;
            return this.baseTab();
        },

        /** arg forms: "respawn:<id>", "endRun", or "<module>.<cmd>:<arg>" */
        act(arg, el, event) {
            if (!arg) return false;
            const i = arg.indexOf(':');
            const head = i < 0 ? arg : arg.slice(0, i);
            const rest = i < 0 ? '' : arg.slice(i + 1);
            if (head === 'respawn' || head === 'endRun') return GM.get('loot').uiAct(head, rest);
            if (head === 'close') return 'close';
            if (head === 'tab') { BO.SurvivalUI.switchTab?.(rest); return true; }
            const dot = head.indexOf('.');
            const mod = dot < 0 ? head : head.slice(0, dot);
            const cmd = dot < 0 ? '' : head.slice(dot + 1);
            const panel = this.panels.get(mod);
            if (panel?.act) { const r = panel.act(cmd, rest, el, event); if (r) return r; }
            const m = GM.get(mod);
            if (m?.uiAct) return m.uiAct(cmd, rest, el, event);
            return false;
        },

        /* ------------------------------------------------------------ Base tab */
        section(title, body, sub = '') {
            return `<section class="gm-card"><header><h3>${esc(title)}</h3>${sub ? `<span>${esc(sub)}</span>` : ''}</header>${body}</section>`;
        },

        bar(frac, cls = '') {
            return `<span class="gm-bar ${cls}"><i style="width:${Math.round(GM.clamp(frac, 0, 1) * 100)}%"></i></span>`;
        },

        baseTab() {
            const parts = [];
            for (const id of GM.order) {
                const m = GM.get(id);
                if (typeof m.baseCards === 'function') {
                    try { parts.push(...m.baseCards(this)); } catch (err) { console.error('[GM:' + id + '] baseCards', err); }
                }
            }
            return `<div class="gm-base">${parts.join('')}</div>`;
        }
    };

    GM.ui = UI;
})(window.BO);
