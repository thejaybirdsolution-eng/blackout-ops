/* ============================================================================
   BLACKOUT OPS — Open World RPG · Equipment Durability & Field Pickups/Tools
   Tracks dur/maxDur on weapons, armor slots (helmet/rig/boots/relic), and
   field tools. Degrades gradually on use, never bricks cleanly (reduced
   performance at 0 until repaired via Field Repair Kit or Pip-Pad Workbench).
============================================================================ */
(function (BO) {
    'use strict';

    const DUR_TYPES = { weapon: 1, rig: 1, helmet: 1, boots: 1, relic: 1, tool: 1 };
    const UP = new THREE.Vector3(0, 1.2, 0);

    const Dur = {
        supports(type) { return !!DUR_TYPES[type]; },

        initItem(entry) {
            if (!entry) return entry;
            const SD = BO.OWRPGStatsData;
            const d = SD.ITEMS[entry.id];
            if (!d || !DUR_TYPES[d.type]) return entry;
            if (entry.maxDur == null) {
                const gs = d.type === 'weapon' && BO.OWRPGGunStats ? BO.OWRPGGunStats[d.base] : null;
                entry.maxDur = d.maxDur || (gs && gs.maxDurability) || 120;
            }
            if (entry.dur == null) entry.dur = entry.maxDur;
            return entry;
        },

        ratio(entry) {
            if (!entry || !entry.maxDur) return 1;
            return Math.max(0, Math.min(1, (entry.dur ?? entry.maxDur) / entry.maxDur));
        },

        /** Reduced performance at 0 durability (55%), slight wear below 25% (85%), full above 25%. */
        performanceMult(entry) {
            if (!entry || entry.maxDur == null) return 1;
            const r = this.ratio(entry);
            if (r <= 0) return 0.55;
            if (r <= 0.25) return 0.85;
            return 1.0;
        },

        badgeColor(r) {
            if (r <= 0) return '#ef4444';
            if (r <= 0.25) return '#f97316';
            if (r <= 0.6) return '#facc15';
            return '#4ade80';
        },

        degrade(s, entry, amount = 0.25) {
            if (!entry) return;
            this.initItem(entry);
            if (entry.maxDur == null || entry.dur <= 0) return;
            const prev = entry.dur;
            entry.dur = Math.max(0, Number((entry.dur - amount).toFixed(2)));
            const d = BO.OWRPGStatsData.ITEMS[entry.id];
            const name = d ? d.name : entry.id;
            if (prev > entry.maxDur * 0.25 && entry.dur <= entry.maxDur * 0.25 && entry.dur > 0) {
                BO.Events.emit('hud:toast', { text: `${name} durability low (${Math.round(this.ratio(entry) * 100)}%)`, color: '#f97316' });
            } else if (prev > 0 && entry.dur <= 0) {
                BO.Events.emit('hud:toast', { text: `${name} worn out — reduced performance until repaired`, color: '#ef4444' });
            }
        },

        repairCost(s, entry) {
            if (!entry) return 0;
            this.initItem(entry);
            if (entry.maxDur == null || entry.dur >= entry.maxDur) return 0;
            const missing = entry.maxDur - entry.dur;
            const tch = BO.OWRPGCharacter ? BO.OWRPGCharacter.attr(s, 'TCH') : 5;
            const disc = Math.max(0.55, 1 - (tch - 5) * 0.05);
            return Math.max(4, Math.ceil(missing * 0.65 * disc));
        },

        repairItem(s, uid, mode = 'credits') {
            const I = BO.OWRPGInventory;
            const e = I.byUid(s, uid);
            if (!e) return 'Item not found';
            this.initItem(e);
            if (e.maxDur == null || e.dur >= e.maxDur) return 'Already at full durability';
            if (mode === 'kit') {
                const kit = s.player.inventory.find((x) => x.id === 'tool_field_repair' && (x.dur == null || x.dur > 0));
                if (!kit) return 'Need a Field Repair Kit';
                this.initItem(kit);
                e.dur = Math.min(e.maxDur, Math.round(e.dur + e.maxDur * 0.5));
                kit.dur = Math.max(0, kit.dur - (BO.OWRPGStatsData.ITEMS.tool_field_repair.wearPerUse || 15));
                if (kit.dur <= 0) I.removeUid(s, kit.uid);
                return '';
            }
            const cost = this.repairCost(s, e);
            if (s.player.credits < cost) return `Need ${cost} credits`;
            s.player.credits -= cost;
            e.dur = e.maxDur;
            return '';
        },

        repairAllEquipped(s) {
            const eq = s.player.equipped;
            let total = 0;
            const items = [];
            for (const slot of ['primary', 'secondary', 'helmet', 'rig', 'boots', 'relic', 'tool']) {
                const e = eq[slot] ? BO.OWRPGInventory.byUid(s, eq[slot]) : null;
                if (!e) continue;
                const c = this.repairCost(s, e);
                if (c > 0) { total += c; items.push(e); }
            }
            if (!items.length) return 'Equipped gear is already in top condition.';
            if (s.player.credits < total) return `Need ${total} credits to repair all.`;
            s.player.credits -= total;
            for (const e of items) e.dur = e.maxDur;
            return '';
        },

        /** Activate a field pickup/tool (from Inventory or equipped tool slot). */
        useTool(s, uid) {
            const I = BO.OWRPGInventory;
            const M = BO.OWRPGMode;
            const C = BO.OWRPGCombat;
            const P = BO.Player;
            const e = I.byUid(s, uid);
            if (!e) return 'Tool not found';
            const d = I.def(e.id);
            if (!d || d.type !== 'tool') return 'Not a tool';
            this.initItem(e);
            const perf = this.performanceMult(e);
            const wear = d.wearPerUse || 10;

            if (d.toolKind === 'repair_half' || d.toolKind === 'repair_full') {
                if (e.dur <= 0) return `${d.name} is depleted.`;
                const frac = d.toolKind === 'repair_full' ? 1.0 : 0.5;
                let fixed = 0;
                for (const slot of ['primary', 'secondary', 'helmet', 'rig', 'boots', 'relic']) {
                    const eqItem = s.player.equipped[slot] ? I.byUid(s, s.player.equipped[slot]) : null;
                    if (!eqItem) continue;
                    this.initItem(eqItem);
                    if (eqItem.dur < eqItem.maxDur) {
                        eqItem.dur = Math.min(eqItem.maxDur, Math.round(eqItem.dur + eqItem.maxDur * frac));
                        fixed++;
                    }
                }
                if (!fixed) return 'Equipped gear is already at 100% durability.';
                e.dur = Math.max(0, e.dur - wear);
                if (e.dur <= 0) I.removeUid(s, e.uid);
                M.toast(`Repaired ${fixed} equipped item(s) via ${d.name}`, '#4ade80');
                return '';
            }

            if (d.toolKind === 'overcharge') {
                if (e.dur <= 0) return `${d.name} is depleted.`;
                C.cd.primer = 0; C.cd.detonator = 0; C.cd.gadget = 0;
                C.cd.ultimate = Math.max(0, (C.cd.ultimate || 0) - 18);
                e.dur = Math.max(0, e.dur - wear);
                if (e.dur <= 0) I.removeUid(s, e.uid);
                BO.FX.spawnParticles(P.pos.clone().add(UP), 16, 0xfacc15, 4, 2, 0.5, 1.2);
                M.toast('Abilities Overcharged!', '#facc15');
                return '';
            }

            if (d.toolKind === 'beacon') {
                if (e.dur <= 0) return `${d.name} is depleted.`;
                M.heal(40);
                for (const a of BO.OWRPGAI.agentsNear(P.pos, 8, false)) {
                    a.ent.stunTimer = Math.max(a.ent.stunTimer || 0, 2.2);
                    C.applyStatus(a, 'shock');
                }
                BO.FX.spawnExplosion(P.pos.clone().add(UP), 5, 0x38bdf8);
                e.dur = Math.max(0, e.dur - wear);
                if (e.dur <= 0) I.removeUid(s, e.uid);
                M.toast('Emergency Beacon deployed (+40 HP & shockwave)!', '#38bdf8');
                return '';
            }

            if (d.toolKind === 'shield' || d.toolKind === 'riot') {
                const hp = Math.round((d.shieldHp || 45) * perf);
                C.barrierHp = Math.max(C.barrierHp || 0, hp);
                C.barrierT = Math.max(C.barrierT || 0, d.durSec || 10);
                this.degrade(s, e, wear);
                BO.FX.spawnParticles(P.pos.clone().add(UP), 14, 0x38bdf8, 3, 1, 0.5, 1.1);
                M.toast(`${d.name}: +${hp} Kinetic Barrier (${d.durSec}s)`, '#38bdf8');
                return '';
            }

            // Combat tools (flamer, hammer, welder, cutter)
            const eye = P.pos.clone().add(new THREE.Vector3(0, 1.5, 0));
            const fwd = new THREE.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw));
            const range = d.range || 7;
            const elem = d.element || 'burn';
            const hex = (BO.OWRPGStatsData.STATUSES[elem] && BO.OWRPGStatsData.STATUSES[elem].hex) || 0xf97316;
            const center = P.pos.clone().addScaledVector(fwd, Math.min(range * 0.55, 3.5));
            BO.FX.spawnTracer(eye, P.pos.clone().addScaledVector(fwd, range), hex, 0.14, 0.25);
            BO.FX.spawnExplosion(center, Math.min(4.5, range * 0.6), hex);
            const hits = BO.OWRPGAI.agentsNear(center, range * 0.75, false);
            for (const a of hits) {
                C.applyStatus(a, elem);
                C.damage(a, (d.dmg || 60) * perf, { source: 'ability', element: elem });
            }
            if (d.toolKind === 'welder' && s.player.equipped.rig) {
                const rig = I.byUid(s, s.player.equipped.rig);
                if (rig) { this.initItem(rig); rig.dur = Math.min(rig.maxDur, rig.dur + 20); }
            }
            this.degrade(s, e, wear);
            BO.Sound?.playMelee?.();
            M.toast(`${d.name} fired (${hits.length} hit${hits.length === 1 ? '' : 's'})`, '#f5a623');
            return '';
        }
    };

    BO.OWRPGDurability = Dur;
})(window.BO);
