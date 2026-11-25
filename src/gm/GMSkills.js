/* ============================================================================
   BLACKOUT OPS — Survival Gold: Survivor Skills tree (BO.GM 'skills')
   Replaces the random perk cards. Every run level gives one skill point,
   spent in the Skills tab (K) whenever you like.
   · Three branches of eight nodes: SURVIVAL (hunger, cold, stealth),
     COMBAT (recoil, reload, melee) and ENGINEERING (build cost, power,
     repair). Every node is one small, readable number per rank.
   · Rows unlock by points spent in that branch: row 2 at 2, row 3 at 5,
     row 4 at 8. 50 ranks in all, so a run has to choose a direction.
   · Nodes write ZoneThrill ranks, so the perk effects that already exist
     (and saved runs that picked perk cards) keep working unchanged. Four
     effects are new: Cold Blooded, Frugal Builder, Field Mechanic, Grid Tech.
============================================================================ */
(function (BO) {
    'use strict';
    const GM = BO.GM;
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const tip = (title, body, sub) => ` data-tip-title="${esc(title)}" data-tip="${esc(body)}"${sub ? ` data-tip-sub="${esc(sub)}"` : ''}`;

    const ROW_GATE = [0, 2, 5, 8];
    const n = (id, row, max, icon, name, desc) => ({ id, row, max, icon, name, desc });
    const BRANCHES = [
        {
            id: 'survival', name: 'Survival', color: '#7dd3a0', blurb: 'Hunger, cold and staying unseen.',
            nodes: [
                n('stomach', 0, 2, '🥫', 'Iron Stomach', (r) => `Hunger and thirst drain ${20 * r}% slower.`),
                n('coldblood', 0, 2, '🧥', 'Cold Blooded', (r) => `Cold feels ${4 * r} °C warmer, up to a mild 18 °C.`),
                n('thick', 1, 3, '❤️', 'Thick Skin', (r) => `+${15 * r} maximum health.`),
                n('lightstep', 1, 2, '👣', 'Light Step', (r) => `Footsteps ${25 * r}% quieter, gunshots carry ${15 * r}% less far.`),
                n('medic', 2, 2, '🩹', 'Field Medic', (r) => `Healing items restore ${30 * r}% more.`),
                n('marathon', 2, 2, '🏃', 'Marathon', (r) => `+${4 * r}% move speed, ${25 * r}% faster stamina recovery.`),
                n('secondwind', 3, 2, '🌬️', 'Second Wind', (r) => `After 6 s without damage, regenerate ${1.5 * r} HP per second.`),
                n('ghost', 3, 1, '👻', 'Ghost', () => 'While crouched you make no sound and are 25% harder to see.')
            ]
        },
        {
            id: 'combat', name: 'Combat', color: '#f87171', blurb: 'Recoil, reloads and the blade.',
            nodes: [
                n('steady', 0, 2, '🧘', 'Steady Aim', (r) => `${20 * r}% less recoil.`),
                n('quickhands', 0, 2, '✋', 'Quick Hands', (r) => `Reload ${15 * r}% faster.`),
                n('brawler', 1, 2, '👊', 'Brawler', (r) => `Melee +${40 * r}% damage; melee kills heal ${5 * r} HP.`),
                n('hollow', 1, 3, '🔩', 'Hollow Points', (r) => `Firearms deal +${10 * r}% damage.`),
                n('deadeye', 2, 3, '🎯', 'Deadeye', (r) => `Headshots deal +${25 * r}% damage.`),
                n('bigmags', 2, 2, '📦', 'Big Mags', (r) => `+${20 * r}% magazine size on every gun.`),
                n('bloodlust', 3, 3, '🩸', 'Bloodlust', (r) => `Every kill heals ${3 * r} HP.`),
                n('momentum', 3, 1, '🔥', 'Momentum', () => 'Each kill within 5 s of the last adds +6% damage, up to +60%.')
            ]
        },
        {
            id: 'engineering', name: 'Engineering', color: '#fbbf24', blurb: 'Build cheaper, power more, fix faster.',
            nodes: [
                n('lumberjack', 0, 2, '🪵', 'Lumberjack', (r) => `Harvest trees, rock and ore ${25 * r}% faster.`),
                n('frugal', 0, 2, '📐', 'Frugal Builder', (r) => `Structures cost ${15 * r}% less of each material (rounded, never below 1).`),
                n('mule', 1, 3, '🎒', 'Pack Mule', (r) => `+${8 * r} kg carry capacity.`),
                n('engineer', 1, 2, '🧱', 'Engineer', (r) => `Structures you build have +${25 * r}% health.`),
                n('mechanic', 2, 2, '🔧', 'Field Mechanic', (r) => `Gun and tool repair kits restore ${35 * r}% more.`),
                n('turrets', 2, 2, '🔫', 'Turret Tech', (r) => `Turrets and traps deal +${30 * r}% damage.`),
                n('gridtech', 3, 2, '🔌', 'Grid Tech', (r) => `Generators, solar panels and wind turbines make ${20 * r}% more power.`),
                n('demolitions', 3, 1, '💣', 'Demolitions', () => 'Gain a frag grenade every 2½ minutes (up to 3); start with 2.')
            ]
        }
    ];
    const NODE = new Map();
    for (const b of BRANCHES) for (const nd of b.nodes) NODE.set(nd.id, { ...nd, branch: b });

    const Skills = {
        BRANCHES,
        ROW_GATE,

        get T() { return BO.ZoneThrill; },
        rank(id) { return this.T?.rank(id) || 0; },
        points() { return this.T?.pending || 0; },
        spentIn(branchId) {
            const b = BRANCHES.find((x) => x.id === branchId);
            return b ? b.nodes.reduce((s, nd) => s + this.rank(nd.id), 0) : 0;
        },
        totalRanks() { return BRANCHES.reduce((s, b) => s + b.nodes.reduce((t, nd) => t + nd.max, 0), 0); },

        /** 'max' | 'ready' | 'short' (no point) | 'locked' (row gate) */
        state(id) {
            const nd = NODE.get(id);
            if (!nd) return 'locked';
            if (this.rank(id) >= nd.max) return 'max';
            if (this.spentIn(nd.branch.id) < ROW_GATE[nd.row]) return 'locked';
            return this.points() > 0 ? 'ready' : 'short';
        },

        buy(id) {
            const T = this.T;
            const nd = NODE.get(id);
            if (!T || !nd || this.state(id) !== 'ready') return false;
            T.ranks[id] = this.rank(id) + 1;
            T.pending = Math.max(0, T.pending - 1);
            if (id === 'demolitions') BO.Player.lethalCount = Math.max(BO.Player.lethalCount || 0, 2);
            T.applyAll();
            BO.Sound?.playPerkBuy?.();
            const r = this.rank(id);
            this.mode?.toast(nd.icon + ' ' + nd.name + (nd.max > 1 ? ' ' + r + '/' + nd.max : '') + ' — ' + nd.desc(r));
            return true;
        },

        uiAct(cmd, arg) {
            if (cmd === 'buy') { this.buy(arg); return true; }
            return false;
        },

        /* ------------------------------------------------ new effects */
        /** Frugal Builder: each material reduced by 15% per rank, rounded, minimum 1. */
        buildCost(cost) {
            const r = this.rank('frugal');
            if (!r || !cost) return cost;
            const out = {};
            for (const [k, v] of Object.entries(cost)) out[k] = v <= 1 ? v : Math.max(1, Math.round(v * (1 - 0.15 * r)));
            return out;
        },

        mergeFx(out) {
            const r = (id) => this.rank(id);
            if (r('coldblood')) out.coldResist = (out.coldResist || 0) + 4 * r('coldblood');
            if (r('mechanic')) out.repairMult = (out.repairMult ?? 1) * (1 + 0.35 * r('mechanic'));
            if (r('gridtech')) out.powerMakeMult = (out.powerMakeMult ?? 1) * (1 + 0.2 * r('gridtech'));
            // Research nodes rewritten for Survival Gold (data/SurvivalDeepData.js techTree).
            const deep = this.mode?.campaign?.deep;
            if (deep?.hasTech?.('t2_gunsmith')) out.repairMult = (out.repairMult ?? 1) * 1.3;
            if (deep?.hasTech?.('t4_infusion')) out.powerMakeMult = (out.powerMakeMult ?? 1) * 1.25;
        },

        /* ------------------------------------------------ lifecycle */
        start(mode) {
            this.mode = mode;
            const T = this.T;
            if (!T) return;
            const self = this;
            // Remember what was there (own wrappers from other modules, e.g. the catalogue's
            // XP bonus) so these layer on top and unwind exactly.
            this._prev = {};
            for (const k of ['openPick', 'xp', 'summaryHtml', 'mergeFx']) {
                this._prev[k] = Object.prototype.hasOwnProperty.call(T, k) ? { own: true, fn: T[k] } : { own: false };
            }
            // Perk cards never open; K falls through to the Skills tab (main.js).
            T.openPick = () => false;
            // Level-up banner names the skill point instead of a perk card.
            const xp = T.xp;
            T.xp = function (...args) {
                const ev = BO.Events;
                const emit = ev.emit;
                ev.emit = function (name, payload, ...rest) {
                    if (name === 'hud:banner' && payload && /^LEVEL /.test(payload.title || '')) {
                        payload = { ...payload, sub: 'SKILL POINT · SPEND IT IN SKILLS (' + BO.Settings.keyLabel(BO.Settings.getKeybinds().survSkills || 'KeyK') + ')' };
                    }
                    return emit.call(this, name, payload, ...rest);
                };
                try { return xp.apply(this, args); } finally { ev.emit = emit; }
            };
            T.summaryHtml = () => self.summaryHtml();
            // New effects ride on the same modFx pass as the perks.
            const merge = T.mergeFx;
            T.mergeFx = function (out) { merge.call(this, out); if (this.active || this.mode_) self.mergeFx(out); };
            document.body.classList.add('gm-skills-on');
            T.applyAll?.();
        },

        stop() {
            const T = this.T;
            if (T && this._prev) {
                for (const [k, p] of Object.entries(this._prev)) {
                    if (p.own) T[k] = p.fn; else delete T[k];
                }
            }
            this._prev = null;
            document.body.classList.remove('gm-skills-on');
            this.chip?.remove();
            this.chip = null;
            this.mode = null;
        },

        rate: 4,
        update() {
            const T = this.T;
            const xpBar = T?.hud?.root?.querySelector('.zt-xp');
            if (!xpBar) return;
            if (!this.chip || !this.chip.isConnected) {
                this.chip = document.createElement('span');
                this.chip.className = 'gm-skp';
                xpBar.appendChild(this.chip);
            }
            const p = this.points();
            const txt = p ? 'SKILL POINT' + (p > 1 ? ' ×' + p : '') + ' · ' + BO.Settings.keyLabel(BO.Settings.getKeybinds().survSkills || 'KeyK') : '';
            if (this.chip.textContent !== txt) { this.chip.textContent = txt; this.chip.hidden = !p; }
        },

        /* ------------------------------------------------ UI */
        renderTree() {
            const p = this.points();
            const cols = BRANCHES.map((b) => {
                const spent = this.spentIn(b.id);
                const rows = [0, 1, 2, 3].map((row) => {
                    const gate = ROW_GATE[row];
                    const open = spent >= gate;
                    const tiles = b.nodes.filter((nd) => nd.row === row).map((nd) => {
                        const r = this.rank(nd.id);
                        const st = this.state(nd.id);
                        const now = r ? nd.desc(r) : 'Not learned.';
                        const next = r < nd.max ? 'Next rank: ' + nd.desc(r + 1) : 'Fully learned.';
                        const sub = st === 'locked' ? 'Spend ' + (gate - spent) + ' more in ' + b.name + ' to unlock' : st === 'ready' ? 'Click to learn · 1 skill point' : st === 'short' ? 'Earn XP for the next skill point' : 'Maxed';
                        return `<button class="gm-sk st-${st}" data-act="gm" data-arg="skills.buy:${nd.id}" ${st === 'ready' ? '' : 'aria-disabled="true"'}${tip(nd.name + (nd.max > 1 ? ' ' + r + '/' + nd.max : ''), (r ? 'Now: ' + now + ' ' : '') + next, sub)}>
                            <em>${nd.icon}</em><b>${esc(nd.name)}</b><small>${esc(nd.desc(Math.max(1, r)))}</small>
                            <span class="pips">${Array.from({ length: nd.max }, (_, i) => `<i class="${i < r ? 'on' : ''}"></i>`).join('')}</span></button>`;
                    }).join('');
                    return `<div class="gm-sk-row ${open ? '' : 'shut'}">${gate ? `<span class="gate">${open ? '' : '🔒 '}${gate}</span>` : ''}${tiles}</div>`;
                }).join('');
                return `<section class="gm-sk-col" style="--bc:${b.color}"><header><b>${esc(b.name)}</b><span>${spent} pts</span></header><p>${esc(b.blurb)}</p>${rows}</section>`;
            }).join('');
            const T = this.T;
            const need = T ? T.need(T.level) : 0;
            return `<div class="gm-skills">
                <div class="sv-sec-h"><h3>Survivor skills</h3><span class="sv-pill ${p ? 'gold' : ''}">${p} skill point${p === 1 ? '' : 's'}</span></div>
                <p class="sv-muted sm">Level ${T?.level || 1} · ${Math.round(T?.xpInto || 0)}/${need} XP to the next point. One point per level, ${this.totalRanks()} ranks in all. Rows open as you spend points in that branch.</p>
                <div class="gm-sk-cols">${cols}</div>
                ${this.legacyHtml()}</div>`;
        },

        /** Perk cards picked in a run saved before the skills tree still count; list them. */
        legacyHtml() {
            const T = this.T;
            const P = Object.fromEntries((T?.PERKS || BO.ZoneThrill?.PERKS || []).map((x) => [x.id, x]));
            const old = Object.entries(T?.ranks || {}).filter(([id, r]) => r > 0 && !NODE.has(id) && P[id]);
            if (!old.length) return '';
            return `<p class="sv-muted sm gm-sk-legacy">Kept from perk cards: ${old.map(([id, r]) => esc(P[id].icon + ' ' + P[id].name + (P[id].max > 1 ? ' ' + r + '/' + P[id].max : ''))).join(' · ')}</p>`;
        },

        summaryHtml() {
            const T = this.T;
            const learned = [];
            for (const b of BRANCHES) for (const nd of b.nodes) { const r = this.rank(nd.id); if (r) learned.push([nd, r]); }
            const p = this.points();
            return `<p class="sv-muted">Survivor level <b>${T.level}</b> · ${Math.round(T.xpInto)}/${T.need(T.level)} XP · ${p} skill point${p === 1 ? '' : 's'} to spend · best streak ${T.stats.bestStreak} · champions slain ${T.stats.champions}</p>
                <div class="zt-perklist">${learned.length ? learned.map(([nd, r]) => `<div><em>${nd.icon}</em><b>${esc(nd.name)} ${nd.max > 1 ? r + '/' + nd.max : ''}</b><small>${esc(nd.desc(r))}</small></div>`).join('') : '<p class="sv-muted">No skills yet. Each level gives one skill point; spend it in the Skills tab.</p>'}</div>${this.legacyHtml()}`;
        }
    };

    GM.register('skills', Skills);
})(window.BO);
