/* ============================================================================
   BLACKOUT OPS — Open World RPG · Versioned Save Slots
   All Open World RPG state lives in BO.Save.data.owrpg (never other modes'
   keys). Three character slots of compact deltas (no meshes, no world copies).
   migrate() upgrades older schemas and fills missing keys before boot.
============================================================================ */
(function (BO) {
    'use strict';

    const SCHEMA_VERSION = 1;
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
            worldClock: 760,          // 0..2400 s day (40 min cycle); 760 ≈ 07:36
            weatherId: 'clear',
            difficulty: opts.difficulty || 'tactical',
            player: {
                name: (opts.name || 'MERCER').toUpperCase().slice(0, 16),
                pos: [sp.x, null, sp.z], yaw: sp.yaw, interiorId: null,
                hp: null, level: 1, xp: 0, credits: 60, relayCells: 1,
                attrs, attrPoints: 0, perkPoints: 0, perks: [], respecCount: 0,
                abilities: { primer: 'cryo_dart', detonator: 'arc_lash', gadget: 'med_injector' },
                equipped: { primary: null, secondary: null, rig: null },
                inventory: [], stash: [], nextUid: 1
            },
            factions: Object.assign({}, BO.OWRPGFactionsData.START_REP),
            poiStates: {},
            quests: {},
            worldFlags: {},
            pylons: { py_freestead: true },
            pins: [],
            pityCounter: 0,
            stats: { kills: 0, deaths: 0, reactions: 0, sneakKills: 0, discovered: 0 }
        };
    }

    /** Fill any missing keys from a fresh default (recursive, never overwrites). */
    function fill(target, def) {
        for (const k of Object.keys(def)) {
            if (target[k] === undefined || target[k] === null && def[k] !== null) target[k] = clone(def[k]);
            else if (def[k] && typeof def[k] === 'object' && !Array.isArray(def[k]) && typeof target[k] === 'object' && !Array.isArray(target[k])) fill(target[k], def[k]);
        }
        return target;
    }

    const Save = {
        SCHEMA_VERSION, SLOT_COUNT, defaultSlot,

        root() {
            const d = BO.Save.data;
            if (!d.owrpg || typeof d.owrpg !== 'object') d.owrpg = { schemaVersion: SCHEMA_VERSION, activeSlot: 0, slots: [] };
            const r = d.owrpg;
            if (!Array.isArray(r.slots)) r.slots = [];
            while (r.slots.length < SLOT_COUNT) r.slots.push(null);
            if (!r.migrated) { this.migrate(r); r.migrated = SCHEMA_VERSION; }
            return r;
        },

        /** Sequential upgraders v1 → v2 → … then default-fill every slot. */
        migrate(raw) {
            const upgraders = {
                // 1: () => {}  // future: v1 → v2
            };
            let v = Number(raw.schemaVersion) || 1;
            while (v < SCHEMA_VERSION) { if (upgraders[v]) upgraders[v](raw); v++; }
            raw.schemaVersion = SCHEMA_VERSION;
            raw.slots = (raw.slots || []).map((s, i) => (s && typeof s === 'object') ? fill(s, defaultSlot({ index: i })) : null);
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

        /** Size in bytes of the serialized owrpg subtree (budget: < 250 KB). */
        byteSize() { return JSON.stringify(this.root()).length; }
    };

    BO.OWRPGSave = Save;
})(window.BO);
