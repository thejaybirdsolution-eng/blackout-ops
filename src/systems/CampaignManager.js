/* ============================================================================
   BLACKOUT OPS — Operation Blackout Campaign State & Event Progression Manager
   Stores state in BO.ProfileSystem.getState().campaign
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO = global.BO || {};

    const Manager = {
        _hooked: false,

        init() {
            if (this._hooked) return;
            this._hooked = true;
            this._bindCompletionListeners();
        },

        getState() {
            const p = BO.ProfileSystem?.getState?.();
            if (!p) return { completed: {}, activeMissionId: null, choices: {} };
            if (!p.campaign || typeof p.campaign !== 'object') {
                p.campaign = { completed: {}, activeMissionId: null, choices: {} };
            }
            if (!p.campaign.completed) p.campaign.completed = {};
            if (!p.campaign.choices) p.campaign.choices = {};
            return p.campaign;
        },

        isUnlocked(mission) {
            if (!mission || mission.index === 1) return true;
            const prev = BO.CampaignData.MISSIONS.find((m) => m.index === mission.index - 1);
            return !!(prev && this.getState().completed[prev.id]);
        },

        isCompleted(id) {
            return !!this.getState().completed[id];
        },

        completedCount() {
            return Object.keys(this.getState().completed || {}).length;
        },

        nextMission() {
            const list = BO.CampaignData?.MISSIONS || [];
            return list.find((m) => !this.isCompleted(m.id)) || list[list.length - 1] || null;
        },

        activeMission() {
            const id = this.getState().activeMissionId;
            return id ? BO.CampaignData?.get(id) : null;
        },

        startMission(missionId) {
            const m = BO.CampaignData?.get(missionId);
            if (!m) return false;
            if (!this.isUnlocked(m)) {
                BO.Events?.emit?.('hud:toast', { text: `Complete ${BO.CampaignData.MISSIONS[m.index - 2].code} first.`, color: '#f97316' });
                return false;
            }
            const st = this.getState();
            st.activeMissionId = m.id;
            BO.ProfileSystem?.save?.();
            BO.CampaignUI?.syncHudPill?.();
            BO.CampaignUI?.closeModal?.();

            if (m.launchOpts.mode === 'minigame') {
                if (BO.Menus?.onStartMatch) BO.Menus.onStartMatch(Object.assign({}, m.launchOpts));
                else BO.Minigames?.launch?.(m.launchOpts.id, m.launchOpts);
            } else if (BO.Menus?.onStartMatch) {
                BO.Menus.onStartMatch(Object.assign({}, m.launchOpts));
            }
            return true;
        },

        completeMission(missionId, choiceId) {
            const m = BO.CampaignData?.get(missionId);
            if (!m) return null;
            const st = this.getState();
            const firstTime = !st.completed[m.id];
            st.completed[m.id] = Date.now();
            if (choiceId) st.choices[m.id] = choiceId;
            if (st.activeMissionId === m.id) st.activeMissionId = null;

            const PS = BO.ProfileSystem;
            if (PS) {
                if (firstTime && m.rewardXp) PS.grantXp(m.rewardXp, 'campaign');
                if (m.rewardCard) PS.unlockCosmetic('card', m.rewardCard, firstTime);
                if (m.rewardEmblem) PS.unlockCosmetic('emblem', m.rewardEmblem, firstTime);
                if (m.rewardTitle) PS.unlockCosmetic('title', m.rewardTitle, firstTime);
                PS.save();
            }

            BO.Sound?.playPerkBuy?.();
            BO.CampaignUI?.syncMenuCard?.();
            BO.CampaignUI?.syncHudPill?.();
            BO.Events?.emit?.('campaign:completed', { mission: m, choiceId, firstTime });
            return m;
        },

        completeActiveMission(choiceId) {
            const cur = this.activeMission();
            if (!cur) return null;
            return this.completeMission(cur.id, choiceId);
        },

        _bindCompletionListeners() {
            const tryCompleteForMode = (modeKey) => {
                const cur = this.activeMission();
                if (!cur) return;
                if (cur.mode === modeKey || (cur.mode === 'minigames' && modeKey === 'minigame')) {
                    const completed = this.completeMission(cur.id);
                    if (completed) {
                        setTimeout(() => BO.CampaignUI?.showDebrief?.(completed), 300);
                    }
                }
            };

            if (BO.Events) {
                BO.Events.on('match:ended', (rep) => { if (rep?.mode) tryCompleteForMode(rep.mode); });
                BO.Events.on('owrpg:quest', (ev) => {
                    const cur = this.activeMission();
                    if (cur && cur.mode === 'owrpg' && (ev?.kind === 'completed' || ev?.id === 'q_act6_meridian_finale')) {
                        const completed = this.completeMission(cur.id);
                        if (completed) setTimeout(() => BO.CampaignUI?.showDebrief?.(completed), 300);
                    }
                });
            }
            if (typeof document !== 'undefined') {
                document.addEventListener('game:survivalEnding', () => tryCompleteForMode('survival'));
                document.addEventListener('game:minigameDaily', () => tryCompleteForMode('minigame'));
            }
        }
    };

    BO.CampaignManager = Manager;
    Manager.init();
})(window);
