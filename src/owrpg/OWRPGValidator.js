/* ============================================================================
   BLACKOUT OPS — Open World RPG · Developer Integrity Validator
   Checks dialogue graph refs, quest refs, world refs, OWRPGGunStats coverage,
   armor sets/mounts/abilities, spatial audit, and TTK curve.
============================================================================ */
(function (BO) {
    'use strict';

    const ENTRY_NODES = [
        'intro_1', 'hub', 'prefixed', 'turnin', 'hostile_bark', 'hostile',
        'nest_done', 'relay_done', 'signal',
        'wheels_done', 'trials_done', 'barge_done', 'smugglers_done',
        'rogue_done', 'mire_done', 'blackbox_done', 'truce_done', 'cipher_done'
    ];

    const V = {
        runAll(logToConsole = false) {
            const errors = [], warnings = [];
            const err = (m) => errors.push(m), warn = (m) => warnings.push(m);
            this._dialogue(err, warn);
            this._quests(err, warn);
            this._world(err, warn);
            this._expansion(err, warn);
            this._ttk(err, warn);
            if (BO.World && BO.World.mapData && BO.World.mapData.id === 'meridian') { this._spatial(err, warn); this._discoveries(err, warn); }
            const report = `OWRPG validator: ${errors.length} error(s), ${warnings.length} warning(s)\n` +
                errors.map((e) => '  ERROR ' + e).join('\n') + (errors.length ? '\n' : '') + warnings.map((w) => '  warn  ' + w).join('\n');
            if (logToConsole) (errors.length ? console.error : console.log)(report);
            return { errors, warnings, report };
        },

        _dialogue(err, warn) {
            const SD = BO.OWRPGStatsData, QD = BO.OWRPGQuestsData.QUESTS, VD = BO.OWRPGFactionsData.VENDORS;
            for (const [npc, t] of Object.entries(BO.OWRPGDialogueData.TREES)) {
                const reached = new Set();
                for (const [id, n] of Object.entries(t.nodes)) {
                    if (!n.choices || !n.choices.length) err(`${npc}.${id}: node has no choices (dead end)`);
                    for (const ch of n.choices || []) {
                        if (ch.next && ch.next !== 'END' && !t.nodes[ch.next]) err(`${npc}.${id}: next '${ch.next}' missing`);
                        if (ch.next) reached.add(ch.next);
                        const r = ch.req || {}, fx = ch.fx || {};
                        for (const it of [r.item, r.notItem, fx.grantItem, fx.takeItem]) if (it && !SD.ITEMS[it]) err(`${npc}.${id}: unknown item '${it}'`);
                        for (const q of [fx.startQuest, fx.stage && fx.stage[0], fx.complete && fx.complete[0], r.quest && r.quest[0], r.stage && r.stage[0]]) if (q && !QD[q]) err(`${npc}.${id}: unknown quest '${q}'`);
                        if (fx.stage && QD[fx.stage[0]] && !QD[fx.stage[0]].stages[fx.stage[1]]) err(`${npc}.${id}: unknown stage '${fx.stage[1]}'`);
                        if (r.stage && QD[r.stage[0]] && !QD[r.stage[0]].stages[r.stage[1]]) err(`${npc}.${id}: unknown req stage '${r.stage[1]}'`);
                        if (fx.complete && QD[fx.complete[0]] && !QD[fx.complete[0]].branches[fx.complete[1]]) err(`${npc}.${id}: unknown branch '${fx.complete[1]}'`);
                        if (fx.vendor && !VD[fx.vendor]) err(`${npc}.${id}: unknown vendor '${fx.vendor}'`);
                        if (r.attr && !SD.ATTR_IDS.includes(r.attr[0])) err(`${npc}.${id}: unknown attribute '${r.attr[0]}'`);
                    }
                    if (n.choices && n.choices.every((c) => c.req && !c.req.quest && !c.req.flag && !c.req.stage && !c.req.notFlag)) warn(`${npc}.${id}: every choice is gated — player can get stuck`);
                }
                for (const id of Object.keys(t.nodes)) if (!reached.has(id) && !ENTRY_NODES.includes(id) && !(t.entry && t.entry.toString().includes(id))) warn(`${npc}.${id}: node not reachable from any choice (entry-only?)`);
            }
        },

        /** Hidden sites: every type placed, every counter quest reachable, every reference valid. */
        _discoveries(err, warn) {
            const Disc = BO.OWRPGDiscoveries, DD = BO.OWRPGDiscoveryData;
            if (!Disc || !DD) return;
            const sites = Disc.generate(884120);
            const per = {};
            for (const site of sites) {
                per[site.type] = (per[site.type] || 0) + 1;
                if (site.type === 'tome' && !DD.LORE.some((l) => l.id === site.lore)) err(`site ${site.id}: unknown lore '${site.lore}'`);
                if (site.type === 'shrine' && !DD.BLESSINGS.some((b) => b.id === site.blessing)) err(`site ${site.id}: unknown blessing '${site.blessing}'`);
                if (site.type === 'shard' && !BO.OWRPGStatsData.SKILLS[site.skill]) err(`site ${site.id}: unknown skill '${site.skill}'`);
            }
            const expected = BO.OWRPGWorldData.REGIONS.length;
            for (const [type, n] of Object.entries(DD.PER_REGION)) if ((per[type] || 0) < n * expected * 0.9) warn(`discoveries: only ${per[type] || 0} ${type} sites placed (want ${n * expected})`);
            for (const [id, q] of Object.entries(BO.OWRPGQuestsData.QUESTS)) {
                for (const st of Object.values(q.stages)) for (const k of Object.keys(st.on || {})) {
                    const m = k.match(/^count:found_([a-z]+):(\d+)$/);
                    if (m && Number(m[2]) > (per[m[1]] || 0)) err(`${id}: needs ${m[2]} ${m[1]} sites but only ${per[m[1]] || 0} exist`);
                }
            }
            for (const b of DD.BLESSINGS) for (const k of Object.keys(b.fx)) if (typeof b.fx[k] !== 'number') err(`blessing ${b.id}: fx '${k}' is not numeric`);
        },

        _quests(err) {
            const SD = BO.OWRPGStatsData, D = BO.OWRPGWorldData;
            for (const [id, q] of Object.entries(BO.OWRPGQuestsData.QUESTS)) {
                if (q.giver && !BO.OWRPGDialogueData.TREES[q.giver]) err(`${id}: giver '${q.giver}' has no dialogue`);
                for (const [sid, st] of Object.entries(q.stages)) {
                    if (st.marker && !D.POIS.some((p) => p.id === st.marker)) err(`${id}.${sid}: marker '${st.marker}' is not a POI`);
                    for (const [k, next] of Object.entries(st.on || {})) {
                        if (!q.stages[next]) err(`${id}.${sid}: event '${k}' -> missing stage '${next}'`);
                        const [type, a] = k.split(':');
                        if (type === 'item' && !SD.ITEMS[a]) err(`${id}.${sid}: unknown item '${a}'`);
                        if (type === 'kill' && !SD.ENEMIES[a]) err(`${id}.${sid}: unknown enemy '${a}'`);
                        if (type === 'discover' && !D.POIS.some((p) => p.id === a)) err(`${id}.${sid}: unknown POI '${a}'`);
                    }
                    if (st.autoComplete && !q.branches[st.autoComplete]) err(`${id}.${sid}: autoComplete branch missing`);
                }
                for (const [bid, b] of Object.entries(q.branches)) {
                    for (const it of b.items || []) if (!SD.ITEMS[it]) err(`${id}.${bid}: unknown reward item '${it}'`);
                    if (b.pylon && !D.PYLONS.some((p) => p.id === b.pylon)) err(`${id}.${bid}: unknown pylon '${b.pylon}'`);
                    for (const f of Object.keys(b.rep || {})) if (!BO.OWRPGFactionsData.FACTIONS[f]) err(`${id}.${bid}: unknown faction '${f}'`);
                }
            }
        },

        _world(err, warn) {
            const SD = BO.OWRPGStatsData, D = BO.OWRPGWorldData;
            for (const poi of D.POIS) for (const sp of poi.spawns || []) if (!SD.ENEMIES[sp[0]]) err(`POI ${poi.id}: unknown enemy '${sp[0]}'`);
            for (const [id, e] of Object.entries(SD.ENEMIES)) {
                if (e.loot && !SD.LOOT[e.loot]) err(`enemy ${id}: unknown loot table '${e.loot}'`);
                if (e.kind === 'bot' && BO.WeaponsData.get(e.weapon).id !== e.weapon) err(`enemy ${id}: unknown weapon '${e.weapon}'`);
                if (e.kind === 'beast' && !BO.ZombiesData.get(e.body)) err(`enemy ${id}: unknown body '${e.body}'`);
            }
            for (const [t, rows] of Object.entries(SD.LOOT)) for (const r of rows) if (r[0] !== 'credits' && !SD.ITEMS[r[0]]) err(`loot ${t}: unknown item '${r[0]}'`);
            for (const [id, it] of Object.entries(SD.ITEMS)) if (it.type === 'weapon' && BO.WeaponsData.get(it.base).id !== it.base) err(`item ${id}: unknown base weapon '${it.base}'`);
            for (const n of D.NPCS) {
                if (!BO.OWRPGDialogueData.TREES[n.dialogue]) err(`NPC ${n.id}: no dialogue tree '${n.dialogue}'`);
                if (n.vendor && !BO.OWRPGFactionsData.VENDORS[n.vendor]) err(`NPC ${n.id}: unknown vendor`);
            }
            for (const v of Object.values(BO.OWRPGFactionsData.VENDORS)) for (const it of v.stock) if (!SD.ITEMS[it]) err(`vendor ${v.name}: unknown item '${it}'`);
            for (const i of D.INTERACTS) {
                if (i.loot && !SD.LOOT[i.loot]) err(`interact ${i.id}: unknown loot '${i.loot}'`);
                for (const g of [i.grant, i.grant2]) if (g && !SD.ITEMS[g]) err(`interact ${i.id}: unknown grant '${g}'`);
            }
            const ids = new Set();
            for (const list of [D.POIS, D.NPCS, D.INTERACTS, D.PYLONS]) for (const o of list) { if (ids.has(o.id)) err(`duplicate id '${o.id}'`); ids.add(o.id); }
            if (D.POIS.filter((p) => !p.interior).length < 12) warn('fewer than 12 surface POIs');
        },

        _expansion(err) {
            const SD = BO.OWRPGStatsData;
            const GS = BO.OWRPGGunStats;
            const EX = BO.OWRPGExpansionData;
            if (!GS) { err('OWRPGGunStats missing'); return; }
            for (const wid of BO.WeaponsData.ORDER) {
                if (!GS[wid]) err(`OWRPGGunStats missing weapon '${wid}'`);
            }
            if (!EX) { err('OWRPGExpansionData missing'); return; }
            for (const b of EX.BOUNTIES || []) {
                if (!SD.ENEMIES[b.target]) err(`bounty ${b.id}: unknown enemy '${b.target}'`);
            }
            for (const cx of EX.CODEX_MILESTONES || []) {
                for (const it of cx.reward?.items || []) if (!SD.ITEMS[it]) err(`codex ${cx.id}: unknown reward item '${it}'`);
            }
        },

        _ttk(err, warn) {
            const SD = BO.OWRPGStatsData;
            const carbine = BO.WeaponsData.get('m16a4');
            for (const [id, e] of Object.entries(SD.ENEMIES)) {
                const gear = 1 + 0.05 * (e.lvl - 1);
                const dps = carbine.damage * gear * (Math.min(carbine.rpm, 450) / 60) * 0.5;
                const ehp = e.hp * (100 + e.armor) / 100;
                const ttk = ehp / dps;
                const band = e.boss ? [18, 55] : [0.8, 4.5];
                if (e.boss && ttk < band[0]) warn(`boss ${id}: TTK ${ttk.toFixed(1)} s is below ${band[0]} s`);
                else if (!e.boss && (ttk < band[0] || ttk > band[1])) warn(`enemy ${id}: TTK ${ttk.toFixed(1)} s outside ${band[0]}–${band[1]} s`);
            }
        },

        _spatial(err, warn) {
            const W = BO.World, D = BO.OWRPGWorldData;
            const check = (label, x, z, interior) => {
                if (interior) return;
                const h = W.terrainHeight(x, z);
                if (h < D.WATER - 0.2) warn(`${label} is under water (h=${h.toFixed(1)})`);
                if (x < D.BOUNDS.minX || x > D.BOUNDS.maxX || z < D.BOUNDS.minZ || z > D.BOUNDS.maxZ) err(`${label} is outside the map`);
            };
            for (const p of D.POIS) check('POI ' + p.id, p.x, p.z, p.interior);
            for (const n of D.NPCS) check('NPC ' + n.id, n.x, n.z, false);
            for (const p of D.PYLONS) check('pylon ' + p.id, p.x, p.z, false);
            for (const i of D.INTERACTS) check('interact ' + i.id, i.x, i.z, i.int);
            for (const poi of D.POIS) for (const sp of poi.spawns || []) {
                const x = poi.x + sp[1], z = poi.z + sp[2];
                if (poi.interior || sp[3] != null) continue;
                const y = W.terrainHeight(x, z);
                if (!W.hasHeadroom(x, y, z, 0.3, 1.7)) {
                    warn(`spawn ${poi.id}/${sp[0]} at (${x.toFixed(0)},${z.toFixed(0)}) overlaps geometry`);
                }
            }
        }
    };

    BO.OWRPGValidator = V;
})(window.BO);
