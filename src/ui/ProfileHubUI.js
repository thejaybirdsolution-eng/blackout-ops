/* ============================================================================
   BLACKOUT OPS — Profile Hub, Challenges, 70-Weapon Armory & Onboarding UI
   Injected non-destructively onto the Main Menu without altering dirty files.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO = global.BO || {};
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    const MODE_BUTTON_MAP = [
        ['btn-menu-zombies', 'zombies'],
        ['btn-menu-mp', 'mp'],
        ['btn-menu-survival', 'survival'],
        ['btn-menu-rpg', 'rpg'],
        ['btn-menu-owrpg', 'owrpg'],
        ['btn-menu-td', 'td'],
        ['btn-menu-minigames', 'minigames']
    ];

    const Hub = {
        modalEl: null,
        armoryFilter: 'All',
        _inited: false,

        init() {
            if (this._inited) return;
            this._inited = true;
            this._injectMenuWidgets();
            this._syncMenuBadges();
            if (BO.Events) {
                BO.Events.on('profile:updated', () => this._syncMenuBadges());
                BO.Events.on('save:updated', () => this._syncMenuBadges());
            }
            setTimeout(() => this.maybeShowOnboarding(), 500);
        },

        _injectMenuWidgets() {
            const col = document.querySelector('#screen-main-menu .menu-col');
            const cards = document.querySelector('#screen-main-menu .mode-cards');
            if (col && cards) {
                let strip = document.getElementById('ph-command-strip');
                if (!strip) {
                    strip = document.createElement('div');
                    strip.id = 'ph-command-strip';
                    strip.className = 'ph-command-strip';
                    col.insertBefore(strip, cards);
                }
                const campBtn = document.getElementById('btn-menu-campaign');
                if (campBtn && campBtn.parentElement !== strip) {
                    strip.insertBefore(campBtn, strip.firstChild);
                }
                if (!document.getElementById('menu-continue-banner')) {
                    const cont = document.createElement('div');
                    cont.id = 'menu-continue-banner';
                    cont.className = 'ph-continue-banner';
                    strip.appendChild(cont);
                }
            }

            const mini = document.querySelector('#screen-main-menu .menu-mini-grid');
            if (mini && !document.getElementById('btn-menu-profile')) {
                const icoSvg = {
                    profile: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>',
                    challenges: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
                    armory: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16v4H4zM6 11v6h12v-6M10 14h4"/></svg>'
                };
                const addTile = (id, ico, title, sub, fn) => {
                    const b = document.createElement('button');
                    b.className = 'mini-tile';
                    b.id = id;
                    b.innerHTML = `<span class="mini-ico" aria-hidden="true">${ico}</span><b>${title}</b><small>${sub}</small>`;
                    b.onclick = () => { BO.Sound?.playUIClick?.(); fn(); };
                    mini.appendChild(b);
                };
                addTile('btn-menu-profile', icoSvg.profile, 'Operator', 'Level, card & emblem', () => this.openProfileModal());
                addTile('btn-menu-challenges', icoSvg.challenges, 'Challenges', 'Daily & Weekly XP ops', () => this.openChallengesModal());
                addTile('btn-menu-armory', icoSvg.armory, 'Armory', 'All weapons & camos', () => this.openArmoryModal());
            }
        },

        _syncMenuBadges() {
            const PS = BO.ProfileSystem;
            if (!PS) return;
            const p = PS.getState();
            const sums = PS.getModeSummaries();

            // Continue Banner
            const cont = document.getElementById('menu-continue-banner');
            if (cont) {
                const mode = p.lastMode || 'zombies';
                const labelMap = {
                    zombies: 'Zombies', mp: 'Multiplayer', survival: 'Exclusion Zone Survival',
                    rpg: 'Rogue Lite', owrpg: 'Open World RPG', td: 'Tower Defense', minigame: 'Minigames'
                };
                const modeTitle = labelMap[mode] || 'Zombies';
                const sumTxt = sums[mode === 'minigame' ? 'minigames' : mode] || 'Ready for deployment';
                cont.innerHTML = `
                    <div>
                        <small>${p.lastMode ? 'RESUME LAST OPERATION' : 'SUGGESTED DEPLOYMENT'} · LV ${p.level} ${esc(p.title)}</small>
                        <b>${esc(modeTitle)} · ${esc(sumTxt)}</b>
                    </div>
                    <button type="button" class="btn btn-sm btn-primary" id="btn-continue-last">CONTINUE →</button>`;
                const go = cont.querySelector('#btn-continue-last');
                if (go) {
                    go.onclick = () => {
                        BO.Sound?.playUIClick?.();
                        const targetBtn = document.getElementById(mode === 'minigame' ? 'btn-menu-minigames' : 'btn-menu-' + mode) || document.getElementById('btn-menu-zombies');
                        if (targetBtn) targetBtn.click();
                    };
                }
            }

            // Per-mode progress tags on Main Menu mode cards
            for (const [btnId, modeKey] of MODE_BUTTON_MAP) {
                const btn = document.getElementById(btnId);
                const small = btn && btn.querySelector('.mode-card-text small');
                if (!small) continue;
                let tag = small.querySelector('.ph-mode-prog');
                if (!tag) {
                    tag = document.createElement('span');
                    tag.className = 'ph-mode-prog';
                    small.appendChild(tag);
                }
                tag.textContent = sums[modeKey] ? `• ${sums[modeKey]}` : '';
            }
        },

        _openModal(html) {
            if (typeof document !== 'undefined' && document.pointerLockElement) {
                try { document.exitPointerLock(); } catch (_) {}
            }
            if (!this.modalEl) {
                const bd = document.createElement('div');
                bd.id = 'ph-modal-backdrop';
                bd.className = 'ph-modal-backdrop hidden';
                bd.innerHTML = '<div class="ph-modal" id="ph-modal-box" role="dialog" aria-modal="true"></div>';
                bd.onclick = (e) => { if (e.target === bd) this.closeModal(); };
                document.body.appendChild(bd);
                this.modalEl = bd;
                if (!this._escBound) {
                    this._escBound = true;
                    window.addEventListener('keydown', (e) => {
                        if (e.key === 'Escape' && this.modalEl && !this.modalEl.classList.contains('hidden')) {
                            e.preventDefault();
                            e.stopImmediatePropagation();
                            this.closeModal();
                        }
                    }, true);
                }
            }
            const box = this.modalEl.querySelector('#ph-modal-box');
            box.innerHTML = html;
            this.modalEl.classList.remove('hidden');
            const closeBtn = box.querySelector('#btn-ph-close');
            if (closeBtn) closeBtn.onclick = () => this.closeModal();
            return box;
        },

        closeModal() {
            if (this.modalEl) this.modalEl.classList.add('hidden');
            if (typeof this._onCloseHook === 'function') {
                const fn = this._onCloseHook;
                this._onCloseHook = null;
                fn();
            }
            BO.Sound?.playUIClick?.();
        },

        /* --------------------------------------------- OPERATOR PROFILE */
        openProfileModal() {
            const PS = BO.ProfileSystem;
            if (!PS) return;
            const p = PS.getState();
            const need = PS.xpForLevel(p.level);
            const pct = Math.min(100, Math.round((p.xp / Math.max(1, need)) * 100));
            const cardDef = PS.CALLING_CARDS.find((c) => c.id === p.callingCard) || PS.CALLING_CARDS[0];
            const embDef = PS.EMBLEMS.find((e) => e.id === p.emblem) || PS.EMBLEMS[0];
            const sums = PS.getModeSummaries();

            const box = this._openModal(`
                <div class="ph-modal-head">
                    <div><span class="ph-kicker">UNIFIED ACCOUNT PROFILE</span><h2 style="margin:2px 0">OPERATOR DOSSIER · LV ${p.level}</h2></div>
                    <button type="button" class="btn btn-sm" id="btn-ph-close">CLOSE</button>
                </div>
                <div class="ph-card" style="background:${cardDef.bg};margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:14px;">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <span style="font-size:28px;color:${embDef.color}">${embDef.icon}</span>
                        <div><b>${esc(BO.Save?.data?.callsign || 'SOLDIER')}</b> · <span style="color:#ffb23f">${esc(p.title)}</span><br><small>${esc(cardDef.name)} · Account XP ${p.xp} / ${need}</small></div>
                    </div>
                    <b style="font-size:22px;color:#ffb23f">LV ${p.level}/100</b>
                </div>
                <div class="ph-xp-bar"><i style="width:${pct}%"></i></div>
                <h4 style="margin:14px 0 8px">CROSS-MODE STANDING</h4>
                <div class="ph-grid" style="margin-bottom:14px;">
                    ${Object.entries(sums).map(([k, v]) => `<div class="ph-card"><small style="color:#94a3b8">${k.toUpperCase()}</small><br><b>${esc(v)}</b></div>`).join('')}
                </div>
                <h4 style="margin:12px 0 8px">CALLING CARDS (${p.unlockedCards.length}/${PS.CALLING_CARDS.length})</h4>
                <div class="ph-grid" style="margin-bottom:14px;">
                    ${PS.CALLING_CARDS.map((c) => {
                        const ok = p.unlockedCards.includes(c.id);
                        return `<button type="button" class="ph-card ${p.callingCard === c.id ? 'is-active' : ''}" data-eq-card="${c.id}" ${ok ? '' : 'disabled'} style="text-align:left;cursor:pointer;opacity:${ok ? 1 : 0.45};background:${c.bg}">
                            <b>${esc(c.name)}</b><br><small>${ok ? (p.callingCard === c.id ? 'EQUIPPED' : 'CLICK TO EQUIP') : esc(c.req)}</small>
                        </button>`;
                    }).join('')}
                </div>
                <h4 style="margin:12px 0 8px">EMBLEMS (${p.unlockedEmblems.length}/${PS.EMBLEMS.length})</h4>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
                    ${PS.EMBLEMS.map((e) => {
                        const ok = p.unlockedEmblems.includes(e.id);
                        return `<button type="button" class="btn btn-sm ${p.emblem === e.id ? 'btn-primary' : ''}" data-eq-emb="${e.id}" ${ok ? '' : 'disabled'} title="${esc(e.name)}">${e.icon} ${esc(e.name)}</button>`;
                    }).join('')}
                </div>
                <h4 style="margin:12px 0 8px">TITLES (${p.unlockedTitles.length}/${PS.TITLES.length})</h4>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    ${PS.TITLES.map((t) => {
                        const ok = p.unlockedTitles.includes(t);
                        return `<button type="button" class="btn btn-sm ${p.title === t ? 'btn-primary' : ''}" data-eq-title="${esc(t)}" ${ok ? '' : 'disabled'}>${esc(t)}</button>`;
                    }).join('')}
                </div>`);

            box.querySelectorAll('[data-eq-card]').forEach((b) => {
                b.onclick = () => { PS.equipCosmetic('card', b.dataset.eqCard); this.openProfileModal(); };
            });
            box.querySelectorAll('[data-eq-emb]').forEach((b) => {
                b.onclick = () => { PS.equipCosmetic('emblem', b.dataset.eqEmb); this.openProfileModal(); };
            });
            box.querySelectorAll('[data-eq-title]').forEach((b) => {
                b.onclick = () => { PS.equipCosmetic('title', b.dataset.eqTitle); this.openProfileModal(); };
            });
        },

        /* --------------------------------------------- CHALLENGES */
        openChallengesModal() {
            const PS = BO.ProfileSystem;
            if (!PS) return;
            const ch = PS.getChallenges();
            const row = (c) => {
                const done = (c.progress || 0) >= c.goal;
                return `<div class="ph-card" style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;">
                    <div><b>${esc(c.label)}</b><br><small style="color:#94a3b8">Progress: ${c.progress || 0} / ${c.goal} · Reward: +${c.xp} Account XP</small></div>
                    <div>${c.claimed ? '<span style="color:#4ade80;font-weight:700">CLAIMED</span>' : (done ? `<button type="button" class="btn btn-sm btn-primary" data-claim="${esc(c.id)}">CLAIM</button>` : '<small style="color:#94a3b8">IN PROGRESS</small>')}</div>
                </div>`;
            };
            const box = this._openModal(`
                <div class="ph-modal-head">
                    <div><span class="ph-kicker">OFFLINE ROTATING OPS · DETERMINISTIC SEED</span><h2 style="margin:2px 0">DAILY &amp; WEEKLY CHALLENGES</h2></div>
                    <button type="button" class="btn btn-sm" id="btn-ph-close">CLOSE</button>
                </div>
                <h4 style="margin:8px 0">DAILY CHALLENGES (${esc(ch.dailyKey)})</h4>
                ${ch.daily.map(row).join('')}
                <h4 style="margin:14px 0 8px">WEEKLY CHALLENGES (${esc(ch.weeklyKey)})</h4>
                ${ch.weekly.map(row).join('')}`);
            box.querySelectorAll('[data-claim]').forEach((b) => {
                b.onclick = () => { PS.claimChallenge(b.dataset.claim); this.openChallengesModal(); };
            });
        },

        /* --------------------------------------------- 70-WEAPON ARMORY */
        openArmoryModal() {
            const PS = BO.ProfileSystem;
            if (!PS) return;
            const all = PS.getArmoryCatalog();
            const cats = ['All', ...Array.from(new Set(all.map((w) => w.category)))];
            const items = this.armoryFilter === 'All' ? all : all.filter((w) => w.category === this.armoryFilter);
            const box = this._openModal(`
                <div class="ph-modal-head">
                    <div><span class="ph-kicker">UNIFIED ARSENAL · ${all.length} WEAPONS</span><h2 style="margin:2px 0">GLOBAL WEAPON ARMORY</h2></div>
                    <button type="button" class="btn btn-sm" id="btn-ph-close">CLOSE</button>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
                    ${cats.map((c) => `<button type="button" class="btn btn-sm ${this.armoryFilter === c ? 'btn-primary' : ''}" data-arm-cat="${esc(c)}">${esc(c)}</button>`).join('')}
                </div>
                <div class="ph-grid">
                    ${items.map((w) => `<div class="ph-card">
                        <div style="display:flex;justify-content:space-between;align-items:center;"><b>${esc(w.name)}</b><span style="color:#ffb23f;font-size:11px">LV ${w.level}</span></div>
                        <small style="color:#94a3b8">${esc(w.category)} · DMG ${w.damage} · RPM ${w.rpm}</small><br>
                        <small style="color:#4ade80">${w.kills} Kills · ${w.camos} Camos</small>
                    </div>`).join('')}
                </div>`);
            box.querySelectorAll('[data-arm-cat]').forEach((b) => {
                b.onclick = () => { this.armoryFilter = b.dataset.armCat; this.openArmoryModal(); };
            });
        },

        /* --------------------------------------------- FIRST-LAUNCH ONBOARDING */
        maybeShowOnboarding() {
            // Strictly suppress in QA frames & test runners!
            try {
                if (global.self !== global.top) return;
            } catch (e) { return; }
            if (/_qa_runner|_qa_owrpg|_qa_hitboxes|[?&]qa=1/i.test(location.href)) return;
            if (BO.State?.screen && BO.State.screen !== 'main_menu') return;
            const p = BO.ProfileSystem?.getState();
            if (!p || p.onboardingDone || p.totalXp > 0 || p.lastMode) return;

            this._onCloseHook = () => BO.ProfileSystem?.markOnboardingDone?.();
            const box = this._openModal(`
                <div class="ph-modal-head">
                    <div><span class="ph-kicker">BLACKOUT OPS 1.0 · FIRST DEPLOYMENT</span><h2 style="margin:2px 0">WELCOME, OPERATIVE</h2></div>
                    <button type="button" class="btn btn-sm" id="btn-ph-close">SKIP TO MENU</button>
                </div>
                <p style="color:#cbd5e1;margin-bottom:14px;">All 7 combat modes, 70 weapons, and the 10-mission <b>Operation Blackout</b> story campaign share your single Operative Profile. Choose how you want to start:</p>
                <div class="ph-grid">
                    <div class="ph-card"><b>Range Day Warmup</b><p style="font-size:12px;color:#94a3b8">Jump into a crisp 60-second aim warmup course with live target feedback.</p><button type="button" class="btn btn-sm btn-primary" id="btn-ob-range">START WARMUP →</button></div>
                    <div class="ph-card"><b>Operation Blackout</b><p style="font-size:12px;color:#94a3b8">Begin Mission 01 of the cross-mode 10-mission 1.0 capstone campaign.</p><button type="button" class="btn btn-sm" id="btn-ob-campaign">OPEN CAMPAIGN</button></div>
                    <div class="ph-card"><b>Free Selection</b><p style="font-size:12px;color:#94a3b8">Explore Zombies, Multiplayer, Survival, Rogue Lite, or Open World RPG.</p><button type="button" class="btn btn-sm" id="btn-ob-skip">ENTER MENU</button></div>
                </div>`);

            const done = () => { BO.ProfileSystem.markOnboardingDone(); this.closeModal(); };
            const rBtn = box.querySelector('#btn-ob-range');
            if (rBtn) rBtn.onclick = () => {
                done();
                if (BO.Minigames?.launch) BO.Minigames.launch('range_day', {});
                else BO.Menus?.onStartMatch?.({ mode: 'minigame', mgId: 'range_day', mapId: 'range_day' });
            };
            const cBtn = box.querySelector('#btn-ob-campaign');
            if (cBtn) cBtn.onclick = () => {
                done();
                BO.CampaignUI?.openModal?.();
            };
            const sBtn = box.querySelector('#btn-ob-skip');
            if (sBtn) sBtn.onclick = done;
            const cClose = box.querySelector('#btn-ph-close');
            if (cClose) cClose.onclick = done;
        }
    };

    BO.ProfileHubUI = Hub;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Hub.init());
    } else {
        Hub.init();
    }
})(window);
