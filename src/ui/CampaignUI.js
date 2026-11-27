/* ============================================================================
   BLACKOUT OPS — Operation Blackout Capstone UI (Card, Modal, HUD Pill)
   Reuses ProfileHubUI modal backdrop & --aaa-* styling cleanly.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO = global.BO || {};
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    const UI = {
        selectedId: null,
        _inited: false,

        init() {
            if (this._inited) return;
            this._inited = true;
            this.syncMenuCard();
            this.syncHudPill();
            if (BO.Events) {
                BO.Events.on('campaign:completed', () => this.syncMenuCard());
                BO.Events.on('profile:updated', () => this.syncMenuCard());
            }
        },

        syncMenuCard() {
            const col = document.querySelector('#screen-main-menu .menu-col');
            const cont = document.getElementById('menu-continue-banner');
            const cards = document.querySelector('#screen-main-menu .mode-cards');
            const anchor = cont || cards;
            if (!col || !anchor || !BO.CampaignManager || !BO.CampaignData) return;

            let btn = document.getElementById('btn-menu-campaign');
            if (!btn) {
                btn = document.createElement('button');
                btn.id = 'btn-menu-campaign';
                btn.type = 'button';
                btn.className = 'ph-campaign-card';
                btn.onclick = () => { BO.Sound?.playUIClick?.(); this.openModal(); };
                col.insertBefore(btn, anchor);
            }

            const total = BO.CampaignData.MISSIONS.length;
            const done = BO.CampaignManager.completedCount();
            const next = BO.CampaignManager.nextMission();
            btn.innerHTML = `
                <div>
                    <small>CAPSTONE CAMPAIGN · ${done}/${total} MISSIONS COMPLETE</small>
                    <b>OPERATION BLACKOUT</b>
                    <div style="font-size:12px;color:#cbd5e1;margin-top:2px;">Next: ${next ? esc(next.code + ' — ' + next.title) : 'ALL MISSIONS CLEARED'}</div>
                </div>
                <span class="mode-card-go" style="color:#ffb23f;transform:none;">CAMPAIGN →</span>`;
        },

        openModal(focusId = null) {
            const CM = BO.CampaignManager, CD = BO.CampaignData, PH = BO.ProfileHubUI;
            if (!CM || !CD || !PH) return;
            const next = CM.nextMission();
            if (!this.selectedId) this.selectedId = (next && next.id) || CD.MISSIONS[0].id;
            if (focusId) this.selectedId = focusId;
            const sel = CD.get(this.selectedId) || CD.MISSIONS[0];
            const unlocked = CM.isUnlocked(sel);
            const done = CM.isCompleted(sel.id);
            const count = CM.completedCount();

            const box = PH._openModal(`
                <div class="ph-modal-head">
                    <div><span class="ph-kicker">CROSS-MODE STORY CAMPAIGN · ${count}/${CD.MISSIONS.length} CLEARED</span><h2 style="margin:2px 0">OPERATION BLACKOUT</h2></div>
                    <button type="button" class="btn btn-sm" id="btn-ph-close">CLOSE</button>
                </div>
                <div style="display:grid;grid-template-columns:260px 1fr;gap:16px;">
                    <div style="display:flex;flex-direction:column;gap:6px;max-height:56vh;overflow-y:auto;">
                        ${CD.MISSIONS.map((m) => {
                            const ok = CM.isUnlocked(m), fin = CM.isCompleted(m.id);
                            return `<button type="button" class="ph-card ${m.id === sel.id ? 'is-active' : ''}" data-camp-sel="${m.id}" style="text-align:left;cursor:pointer;opacity:${ok ? 1 : 0.45};">
                                <div style="display:flex;justify-content:space-between;"><b>${esc(m.code)} · ${esc(m.mode.toUpperCase())}</b><span>${fin ? '✓' : (ok ? '○' : '🔒')}</span></div>
                                <small style="color:#cbd5e1">${esc(m.title)}</small>
                            </button>`;
                        }).join('')}
                    </div>
                    <div class="ph-card" style="padding:16px;">
                        <span class="ph-kicker">${esc(sel.code)} · ${esc(sel.mode.toUpperCase())} · HANDLER: ${esc(sel.speaker)}</span>
                        <h3 style="margin:4px 0 8px">${esc(sel.title)} ${done ? '<span style="color:#4ade80;font-size:13px;">(CLEARED)</span>' : ''}</h3>
                        <p style="color:#cbd5e1;font-size:13px;line-height:1.5;">${esc(sel.briefing)}</p>
                        <div class="ph-card" style="margin:12px 0;background:rgba(255,178,63,.06);border-color:rgba(255,178,63,.3);">
                            <small style="color:#ffb23f">OBJECTIVE</small><br><b>${esc(sel.objectiveText)}</b>
                        </div>
                        <div style="font-size:12px;color:#94a3b8;margin-bottom:14px;">Rewards: +${sel.rewardXp} Account XP${sel.rewardTitle ? ' · Title: ' + esc(sel.rewardTitle) : ''}${sel.rewardCard ? ' · Calling Card' : ''}</div>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;">
                            <button type="button" class="btn btn-primary" id="btn-camp-deploy" ${unlocked ? '' : 'disabled'}>${unlocked ? 'DEPLOY MISSION →' : 'LOCKED'}</button>
                            ${unlocked && !done ? `<button type="button" class="btn" id="btn-camp-mark-done">LOG FIELD COMPLETION</button>` : ''}
                        </div>
                    </div>
                </div>`);

            box.querySelectorAll('[data-camp-sel]').forEach((b) => {
                b.onclick = () => { this.openModal(b.dataset.campSel); };
            });
            const dep = box.querySelector('#btn-camp-deploy');
            if (dep) dep.onclick = () => CM.startMission(sel.id);
            const mark = box.querySelector('#btn-camp-mark-done');
            if (mark) mark.onclick = () => {
                const m = CM.completeMission(sel.id, sel.debriefChoices?.[0]?.id);
                if (m) this.showDebrief(m);
            };
        },

        closeModal() {
            BO.ProfileHubUI?.closeModal?.();
        },

        showDebrief(mission) {
            const PH = BO.ProfileHubUI, CM = BO.CampaignManager;
            if (!PH || !mission) return;
            const choices = mission.debriefChoices || [];
            const box = PH._openModal(`
                <div class="ph-modal-head">
                    <div><span class="ph-kicker">OPERATION BLACKOUT · MISSION DEBRIEF</span><h2 style="margin:2px 0">${esc(mission.code)}: ${esc(mission.title)} CLEARED</h2></div>
                    <button type="button" class="btn btn-sm" id="btn-ph-close">CLOSE</button>
                </div>
                <p style="color:#cbd5e1;">+${mission.rewardXp} Account XP banked to your Operative Profile. Select your strategic debrief decision:</p>
                <div class="ph-grid" style="margin:12px 0;">
                    ${choices.map((c) => `<button type="button" class="ph-card" data-debrief-ch="${esc(c.id)}" style="text-align:left;cursor:pointer;">
                        <b style="color:#ffb23f">${esc(c.label)}</b><br><small style="color:#94a3b8">${esc(c.note)}</small>
                    </button>`).join('')}
                </div>
                <div style="display:flex;justify-content:flex-end;gap:10px;">
                    <button type="button" class="btn btn-primary" id="btn-debrief-next">CONTINUE CAMPAIGN →</button>
                </div>`);
            box.querySelectorAll('[data-debrief-ch]').forEach((b) => {
                b.onclick = () => {
                    CM.getState().choices[mission.id] = b.dataset.debriefCh;
                    BO.ProfileSystem?.save?.();
                    box.querySelectorAll('[data-debrief-ch]').forEach((x) => x.classList.toggle('is-active', x === b));
                };
            });
            const nxt = box.querySelector('#btn-debrief-next');
            if (nxt) nxt.onclick = () => this.openModal();
        },

        syncHudPill() {
            const cur = BO.CampaignManager?.activeMission();
            let pill = document.getElementById('campaign-hud-pill');
            if (!cur || BO.State?.screen !== 'playing') {
                if (pill) pill.remove();
                return;
            }
            if (!pill) {
                pill = document.createElement('div');
                pill.id = 'campaign-hud-pill';
                document.body.appendChild(pill);
            }
            pill.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                <b style="color:#ffb23f">${esc(cur.code)}: ${esc(cur.title)}</b>
                <button type="button" id="btn-camp-complete-hud" class="btn btn-sm" style="padding:2px 6px;font-size:9px;">COMPLETE</button>
            </div><div style="margin-top:3px;color:#cbd5e1">${esc(cur.objectiveText)}</div>`;
            const cBtn = pill.querySelector('#btn-camp-complete-hud');
            if (cBtn) {
                cBtn.onclick = () => {
                    const m = BO.CampaignManager.completeActiveMission();
                    if (m) this.showDebrief(m);
                };
            }
        }
    };

    BO.CampaignUI = UI;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => UI.init());
    } else {
        UI.init();
    }
    if (typeof document !== 'undefined') {
        document.addEventListener('game:modeStart', () => setTimeout(() => UI.syncHudPill(), 150));
    }
})(window);
