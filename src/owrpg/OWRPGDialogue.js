/* ============================================================================
   BLACKOUT OPS — Open World RPG · Dialogue Evaluator
   Builds a read-only context, filters choices by deterministic predicates
   (no percentage rolls → no save-scumming) and dispatches consequences.
============================================================================ */
(function (BO) {
    'use strict';

    const ATTR_LABEL = { BRW: 'BRAWN', RFX: 'REFLEX', TCH: 'TECH', PRC: 'PERCEPTION', PRS: 'PRESENCE' };

    const Dialogue = {
        ctx(s) {
            return {
                flags: s.worldFlags,
                attr: (id) => BO.OWRPGCharacter.attr(s, id),
                rep: (f) => BO.OWRPGFactions.rep(s, f),
                has: (id) => BO.OWRPGInventory.has(s, id),
                credits: s.player.credits,
                level: s.player.level,
                quest: (id) => BO.OWRPGQuests.get(s, id)
            };
        },

        /** Returns '' when the requirement passes, otherwise a short reason. */
        check(s, req) {
            if (!req) return '';
            const c = this.ctx(s);
            if (req.attr && c.attr(req.attr[0]) < req.attr[1]) return `${ATTR_LABEL[req.attr[0]]} ${req.attr[1]}`;
            if (req.rep && c.rep(req.rep[0]) < req.rep[1]) return `${BO.OWRPGFactionsData.FACTIONS[req.rep[0]].short} rep ${req.rep[1]}`;
            if (req.item && !c.has(req.item)) return 'Needs ' + BO.OWRPGStatsData.ITEMS[req.item].name;
            if (req.notItem && c.has(req.notItem)) return 'hidden';
            if (req.flag && !c.flags[req.flag]) return 'hidden';
            if (req.notFlag && c.flags[req.notFlag]) return 'hidden';
            if (req.credits && c.credits < req.credits) return `${req.credits} credits`;
            if (req.level && c.level < req.level) return `Level ${req.level}`;
            if (req.quest && c.quest(req.quest[0]).state !== req.quest[1]) return 'hidden';
            if (req.stage) { const q = c.quest(req.stage[0]); if (q.state !== 'active' || q.stage !== req.stage[1]) return 'hidden'; }
            return '';
        },

        tree(npcId) { return BO.OWRPGDialogueData.TREES[npcId]; },

        entry(s, npcId) { const t = this.tree(npcId); return t ? t.entry(this.ctx(s)) : null; },

        /** Renderable view of a node: { speaker, text, choices:[{i,text,ok,reason,badge}] } */
        view(s, npcId, nodeId) {
            const t = this.tree(npcId);
            const n = t && t.nodes[nodeId];
            if (!n) return null;
            const c = this.ctx(s);
            const choices = [];
            n.choices.forEach((ch, i) => {
                const reason = this.check(s, ch.req);
                if (reason === 'hidden') return;
                const badge = ch.req && ch.req.attr ? ch.req.attr[0] : (ch.req && ch.req.rep ? 'REP' : (ch.req && ch.req.item ? 'ITEM' : ''));
                choices.push({ i, text: ch.text, ok: !reason, reason, badge });
            });
            return { speaker: n.speaker || t.name, text: typeof n.text === 'function' ? n.text(c) : n.text, choices };
        },

        /** Apply a choice; returns the next node id or 'END'. */
        choose(s, npcId, nodeId, idx) {
            const n = this.tree(npcId).nodes[nodeId];
            const ch = n.choices[idx];
            if (!ch || this.check(s, ch.req)) return nodeId;
            if (ch.fx) this.apply(s, ch.fx, npcId);
            return ch.next || 'END';
        },

        apply(s, fx, npcId) {
            const M = BO.OWRPGMode;
            const I = BO.OWRPGInventory;
            if (fx.takeItem) I.remove(s, fx.takeItem, 1);
            if (fx.grantItem) { I.add(s, fx.grantItem, 1); M.toast('Received: ' + BO.OWRPGStatsData.ITEMS[fx.grantItem].name, '#a3e635'); M.itemEvent(fx.grantItem); }
            if (fx.credits) { s.player.credits += fx.credits; M.toast((fx.credits > 0 ? '+' : '') + fx.credits + ' credits', '#fbbf24'); }
            if (fx.xp) M.giveXp(fx.xp, 'Insight');
            if (fx.rep) for (const [f, v] of Object.entries(fx.rep)) M.changeRep(f, v);
            if (fx.setFlag) M.setFlag(fx.setFlag, true);
            if (fx.clearFlag) M.setFlag(fx.clearFlag, false);
            if (fx.startQuest) BO.OWRPGQuests.start(s, fx.startQuest);
            if (fx.stage) BO.OWRPGQuests.setStage(s, fx.stage[0], fx.stage[1]);
            if (fx.complete) BO.OWRPGQuests.complete(s, fx.complete[0], fx.complete[1]);
            if (fx.heal) M.healFull();
            if (fx.respec) M.openRespec();
            if (fx.vendor) M.pendingVendor = fx.vendor;
            if (fx.hostile && npcId) M.setFlag('provoked_' + (BO.OWRPGWorldData.NPCS.find((n) => n.id === npcId)?.faction || ''), true);
        }
    };

    BO.OWRPGDialogue = Dialogue;
})(window.BO);
