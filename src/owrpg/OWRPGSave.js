/* ============================================================================
   BLACKOUT OPS — Open World RPG · Versioned Save Slots
   All Open World RPG state lives in BO.Save.data.owrpg. Three character slots
   of compact deltas. migrate() upgrades older schemas and backfills new
   multi-slot armor, durability, mounts, codex, and bounty keys before boot.
============================================================================ */
(function (BO) {
    'use strict';

    const SCHEMA_VERSION = 2;
    const SLOT_COUNT = 3;

    const clone = (o) => JSON.parse(JSON.stringify(o));

    function defaultSlot(opts = {}) {
        const SD = BO.OWRPGStatsData;
        const attrs = {};
        for (const id of SD.ATTR_IDS) attrs[id] = (opts.attrs && opts.attrs[id]) || SD.ATTR_BASE;
        const sp = BO.MapsData.MAPS.meridian.playerSpawn;
        return {
            id: 'slot_' + (opts.index || 0),
            timestamp: Date.now(),
            playtimeSec: 0,
            worldSeed: 884120,
            worldClock: 760,
            weatherId: 'clear',
            difficulty: opts.difficulty || 'tactical',
            player: {
                name: (opts.name || 'MERCER').toUpperCase().slice(0, 16),
                pos: [sp.x, null, sp.z], yaw: sp.yaw, interiorId: null,
                hp: null, level: 1, xp: 0, credits: 60, relayCells: 1,
                attrs, attrPoints: 0, perkPoints: 0, perks: [], respecCount: 0,
                abilities: { primer: 'cryo_dart', detonator: 'arc_lash', gadget: 'med_injector', ultimate: 'orbital_barrage' },
                equipped: { primary: null, secondary: null, helmet: null, rig: null, boots: null, relic: null, tool: null },
                inventory: [], stash: [], nextUid: 1,
                mounts: { owned: [], active: null },
                unlockedPowers: ['cryo_dart', 'arc_lash', 'med_injector'],
                codex: { enemies: {}, elements: {}, unlocksClaimed: [] },
                bounties: { active: null, completed: 0, progress: 0 }
            },
            factions: Object.assign({}, BO.OWRPGFactionsData.START_REP),
            poiStates: {},
            quests: {},
            worldFlags: {},
            pylons: { py_freestead: true },
            pins: [],
            pityCounter: 0,
            stats: { kills: 0, deaths: 0, reactions: 0, sneakKills: 0, discovered: 0, eventsCleared: 0 }
        };
    }

    function fill(target, def) {
        for (const k of Object.keys(def)) {
            if (target[k] === undefined || (target[k] === null && def[k] !== null)) target[k] = clone(def[k]);
            else if (def[k] && typeof def[k] === 'object' && !Array.isArray(def[k]) && typeof target[k] === 'object' && !Array.isArray(target[k])) fill(target[k], def[k]);
        }
        return target;
    }

    function backfillItems(slot) {
        const SD = BO.OWRPGStatsData;
        const durTypes = { weapon: 1, rig: 1, helmet: 1, boots: 1, relic: 1, tool: 1 };
        const lists = [slot.player.inventory, slot.player.stash];
        for (const list of lists) {
            if (!Array.isArray(list)) continue;
            for (const e of list) {
                const d = SD.ITEMS[e.id];
                if (!d || !durTypes[d.type]) continue;
                if (e.maxDur == null) {
                    const gs = d.type === 'weapon' && BO.OWRPGGunStats ? BO.OWRPGGunStats[d.base] : null;
                    e.maxDur = d.maxDur || (gs && gs.maxDurability) || 120;
                }
                if (e.dur == null) e.dur = e.maxDur;
            }
        }
    }

    const Save = {
        SCHEMA_VERSION, SLOT_COUNT, defaultSlot,

        root() {
            const d = BO.Save.data;
            if (!d.owrpg || typeof d.owrpg !== 'object') d.owrpg = { schemaVersion: SCHEMA_VERSION, activeSlot: 0, slots: [] };
            const r = d.owrpg;
            if (!Array.isArray(r.slots)) r.slots = [];
            while (r.slots.length < SLOT_COUNT) r.slots.push(null);
            if ((Number(r.migrated) || 0) < SCHEMA_VERSION) { this.migrate(r); r.migrated = SCHEMA_VERSION; }
            return r;
        },

        migrate(raw) {
            const upgraders = {
                1: (r) => {
                    for (const s of r.slots || []) {
                        if (!s || typeof s !== 'object') continue;
                        if (s.player && s.player.equipped) {
                            if (s.player.equipped.helmet === undefined) s.player.equipped.helmet = null;
                            if (s.player.equipped.boots === undefined) s.player.equipped.boots = null;
                            if (s.player.equipped.relic === undefined) s.player.equipped.relic = null;
                            if (s.player.equipped.tool === undefined) s.player.equipped.tool = null;
                        }
                    }
                }
            };
            let v = Number(raw.schemaVersion) || 1;
            while (v < SCHEMA_VERSION) { if (upgraders[v]) upgraders[v](raw); v++; }
            raw.schemaVersion = SCHEMA_VERSION;
            raw.slots = (raw.slots || []).map((s, i) => {
                if (!s || typeof s !== 'object') return null;
                fill(s, defaultSlot({ index: i }));
                backfillItems(s);
                return s;
            });
            return raw;
        },

        list() { return this.root().slots.map((s, i) => s ? { index: i, name: s.player.name, level: s.player.level, playtimeSec: s.playtimeSec, timestamp: s.timestamp } : null); },

        read(i) { const s = this.root().slots[i]; return s ? clone(s) : null; },

        write(i, slot) {
            const r = this.root();
            slot.timestamp = Date.now();
            r.slots[i] = clone(slot);
            r.activeSlot = i;
            BO.Save.save();
        },

        remove(i) { const r = this.root(); r.slots[i] = null; BO.Save.save(); },

        byteSize() { return JSON.stringify(this.root()).length; }
    };

    BO.OWRPGSave = Save;
})(window.BO);
