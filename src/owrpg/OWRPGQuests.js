/* ============================================================================
   BLACKOUT OPS — Open World RPG · Quest Engine
   Finite-state quests driven by world events, so out-of-sequence play never
   breaks them. Events: ('flag', id) ('kill', enemyId) ('item', id)
   ('discover', poiId). Counters use numeric world flags ('count:flag:n').
   Quest records: s.quests[id] = { state, stage, branch, startedAt }.
============================================================================ */
(function (BO) {
    'use strict';

    const QD = () => BO.OWRPGQuestsData.QUESTS;

    const Quests = {
        get(s, id) { return s.quests[id] || { state: 'inactive', stage: null, branch: null }; },

        def(id) { return QD()[id]; },

        start(s, id) {
            const d = this.def(id);
            if (!d || this.get(s, id).state !== 'inactive') return false;
            const first = Object.keys(d.stages)[0];
            s.quests[id] = { state: 'active', stage: first, branch: null, startedAt: s.playtimeSec };
            BO.Events.emit('owrpg:quest', { id, kind: 'started', name: d.name });
            // Events that already happened (sequence breaks) resolve immediately.
            this._catchUp(s, id);
            return true;
        },

        setStage(s, id, stage) {
            const d = this.def(id);
            const q = s.quests[id];
            if (!d || !q || q.state !== 'active' || !d.stages[stage] || q.stage === stage) return false;
            q.stage = stage;
            BO.Events.emit('owrpg:quest', { id, kind: 'stage', name: d.name, text: d.stages[stage].text });
            if (d.stages[stage].autoComplete) this.complete(s, id, d.stages[stage].autoComplete);
            else this._catchUp(s, id);
            return true;
        },

        complete(s, id, branch) {
            const d = this.def(id);
            if (!d) return false;
            if (!s.quests[id]) s.quests[id] = { state: 'active', stage: Object.keys(d.stages)[0], branch: null, startedAt: s.playtimeSec };
            const q = s.quests[id];
            if (q.state === 'completed') return false;
            const b = d.branches[branch] || Object.values(d.branches)[0];
            q.state = 'completed';
            q.branch = branch;
            const reward = Object.assign({}, b);
            if (d.bonusFlag && s.worldFlags[d.bonusFlag.flag]) reward.credits = (reward.credits || 0) + d.bonusFlag.credits;
            BO.OWRPGMode.reward(reward, d.name);
            for (const f of b.flags || []) BO.OWRPGMode.setFlag(f, true);
            BO.Events.emit('owrpg:quest', { id, kind: 'completed', name: d.name, branch: b.label });
            return true;
        },

        /** Active quest marker POI ids (for the map; the HUD shows no floating arrows). */
        markers(s) {
            const out = [];
            for (const [id, q] of Object.entries(s.quests)) {
                if (q.state !== 'active') continue;
                const st = this.def(id)?.stages[q.stage];
                if (st && st.marker) out.push({ quest: id, poi: st.marker });
            }
            return out;
        },

        objective(s, id) {
            const q = s.quests[id];
            if (!q || q.state !== 'active') return '';
            return this.def(id).stages[q.stage]?.text || '';
        },

        /** Route a world event into every quest. */
        onEvent(s, type, key) {
            const tag = type + ':' + key;
            for (const [id, d] of Object.entries(QD())) {
                const q = this.get(s, id);
                if (q.state === 'inactive' && d.autoStart === tag) { this.start(s, id); continue; }
                if (q.state !== 'active') continue;
                const on = d.stages[q.stage]?.on;
                if (!on) continue;
                if (on[tag]) { this.setStage(s, id, on[tag]); continue; }
                if (type === 'flag') {
                    for (const [k, next] of Object.entries(on)) {
                        const m = k.match(/^count:([a-z0-9_]+):(\d+)$/);
                        if (m && m[1] === key && (Number(s.worldFlags[key]) || 0) >= Number(m[2])) this.setStage(s, id, next);
                    }
                }
            }
        },

        /** Re-check a quest's current stage against already-true world state. */
        _catchUp(s, id) {
            const d = this.def(id);
            const q = s.quests[id];
            if (!q || q.state !== 'active') return;
            const on = d.stages[q.stage]?.on || {};
            for (const [k, next] of Object.entries(on)) {
                const [type, a, b] = k.split(':');
                let hit = false;
                if (type === 'flag') hit = !!s.worldFlags[a];
                else if (type === 'item') hit = BO.OWRPGInventory.has(s, a);
                else if (type === 'discover') hit = !!(s.poiStates[a] && s.poiStates[a].discovered);
                else if (type === 'kill') hit = !!s.worldFlags['killed_' + a];
                else if (type === 'count') hit = (Number(s.worldFlags[a]) || 0) >= Number(b);
                if (hit) { this.setStage(s, id, next); return; }
            }
        }
    };

    BO.OWRPGQuests = Quests;
})(window.BO);
