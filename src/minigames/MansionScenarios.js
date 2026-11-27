/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Mansion Raid situations
   ----------------------------------------------------------------------------
   Fifteen distinct hostage situations for the Mansion Raid course. One is
   picked at random every run (never the same one twice in a row).

   Each situation says how many criminals / hostages go in which room:
     C = criminal standing    V = criminal behind cover
     S = criminal holding a hostage as a shield    H = hostage
     B = the crew boss (one per situation)
   Exact positions are generated from the room's free floor slots, preferring
   slots no earlier situation used, so robbers and hostages land in different
   spots in every situation.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    const SITUATIONS = [
        { id: 'jewel_heist', name: 'The Jewel Heist', brief: 'The crew is cracking the gallery cases. Boss in the gallery.', boss: 'gallery',
            rooms: { foyer: 'CH', living: 'V', dining: 'CH', library: 'S', hall: 'CC', kitchen: 'VH', study: 'C', gallery: 'CH', bedroom: 'VH' } },
        { id: 'dinner_siege', name: 'Dinner Party Siege', brief: 'Guests held at the dining table. Watch your fire.', boss: 'dining',
            rooms: { foyer: 'C', living: 'CH', dining: 'VHHH', library: 'C', hall: 'SC', kitchen: 'CC', study: 'V', gallery: 'C', bedroom: 'CH' } },
        { id: 'panic_room', name: 'Panic Room', brief: 'The owner locked himself in the bedroom. The crew is digging in.', boss: 'bedroom',
            rooms: { foyer: 'V', living: 'CC', dining: 'S', library: 'CH', hall: 'VC', kitchen: 'C', study: 'SH', gallery: 'CV', bedroom: 'SV' } },
        { id: 'library_lockdown', name: 'Library Lockdown', brief: 'A school tour trapped between the shelves.', boss: 'library',
            rooms: { foyer: 'CH', living: 'C', dining: 'VH', library: 'SHH', hall: 'CC', kitchen: 'V', study: 'CH', gallery: 'S', bedroom: 'C' } },
        { id: 'kitchen_crew', name: 'Kitchen Crew', brief: 'Staff tied up in the kitchen. Shooters behind the counters.', boss: 'kitchen',
            rooms: { foyer: 'C', living: 'VH', dining: 'CC', library: 'V', hall: 'CH', kitchen: 'VVHH', study: 'C', gallery: 'CH', bedroom: 'S' } },
        { id: 'split_crew', name: 'Split Crew', brief: 'Two teams with human shields on both wings.', boss: 'hall',
            rooms: { foyer: 'V', living: 'SH', dining: 'SH', library: 'C', hall: 'CC', kitchen: 'C', study: 'S', gallery: 'V', bedroom: 'S' } },
        { id: 'night_shift', name: 'Night Shift', brief: 'Security guards taken hostage in every corner.', boss: 'study',
            rooms: { foyer: 'CH', living: 'CH', dining: 'C', library: 'VH', hall: 'C', kitchen: 'CH', study: 'VH', gallery: 'CH', bedroom: 'V' } },
        { id: 'ransom_call', name: 'Ransom Call', brief: 'The boss is on the phone in the study, demanding cash.', boss: 'study',
            rooms: { foyer: 'S', living: 'C', dining: 'VH', library: 'CC', hall: 'SH', kitchen: 'V', study: 'CH', gallery: 'C', bedroom: 'CH' } },
        { id: 'ballroom_blitz', name: 'Ballroom Blitz', brief: 'A gala in the grand hall. Most of the crew is in there.', boss: 'hall',
            rooms: { foyer: 'C', living: 'V', dining: 'C', library: 'C', hall: 'CVSHH', kitchen: 'V', study: 'C', gallery: 'VH', bedroom: 'C' } },
        { id: 'silent_alarm', name: 'Silent Alarm', brief: 'They heard the alarm. Everyone is behind cover.', boss: 'bedroom',
            rooms: { foyer: 'VH', living: 'VV', dining: 'V', library: 'VH', hall: 'VV', kitchen: 'VH', study: 'V', gallery: 'VV', bedroom: 'VH' } },
        { id: 'inside_job', name: 'Inside Job', brief: 'The butler let them in. Hostages scattered through the house.', boss: 'living',
            rooms: { foyer: 'C', living: 'CH', dining: 'CH', library: 'S', hall: 'CH', kitchen: 'CH', study: 'C', gallery: 'SH', bedroom: 'C' } },
        { id: 'vault_run', name: 'Vault Run', brief: 'The safe is in the study. They will not leave without it.', boss: 'study',
            rooms: { foyer: 'C', living: 'C', dining: 'V', library: 'SV', hall: 'C', kitchen: 'CH', study: 'VVH', gallery: 'C', bedroom: 'VH' } },
        { id: 'wedding_crash', name: 'Wedding Crashers', brief: 'The wedding party is held in the hall and the gallery.', boss: 'gallery',
            rooms: { foyer: 'V', living: 'C', dining: 'CH', library: 'C', hall: 'SHH', kitchen: 'C', study: 'V', gallery: 'CHH', bedroom: 'C' } },
        { id: 'shield_wall', name: 'Hostage Exchange', brief: 'Every room has a criminal hiding behind a hostage.', boss: 'dining',
            rooms: { foyer: 'S', living: 'S', dining: 'SC', library: 'S', hall: 'S', kitchen: 'S', study: 'S', gallery: 'SC', bedroom: 'S' } },
        { id: 'last_stand', name: 'Last Stand', brief: 'The front of the house is quiet. The back is a fortress.', boss: 'bedroom',
            rooms: { foyer: 'C', living: 'C', dining: 'C', library: 'CVH', hall: 'VSH', kitchen: 'CVH', study: 'CCV', gallery: 'SVC', bedroom: 'VCH' } }
    ];

    // candidate floor slots (room-local), well clear of the walls and doors
    const GX = [-4.4, -2.9, -1.4, 0, 1.4, 2.9, 4.4];
    const GZ = [-4.5, -3.1, -1.7, -0.3, 1.1, 2.5];

    function freeSlots(room) {
        const out = [];
        const doorClear = (x, z) => {
            // Keep 1.55m clearance around all 4 room-wall doorway centers (±6, 0) & (0, ±6)
            if (Math.abs(x) < 1.55 && Math.abs(Math.abs(z) - 6) < 1.75) return false;
            if (Math.abs(z) < 1.55 && Math.abs(Math.abs(x) - 6) < 1.75) return false;
            return true;
        };
        for (const x of GX) for (const z of GZ) {
            if (!doorClear(x, z)) continue;
            let ok = true;
            let nearCover = false;
            for (const f of room.furn || []) {
                const dx = Math.abs(x - f.x), dz = Math.abs(z - f.z);
                if (dx < f.w / 2 + 0.65 && dz < f.d / 2 + 0.65) { ok = false; break; }
                if (dx < f.w / 2 + 1.45 && dz < f.d / 2 + 1.45) nearCover = true;
            }
            if (ok) out.push({ x, z, k: x + ',' + z, nearCover });
        }
        return out;
    }

    function mulberry32(seed) {
        let s = seed >>> 0;
        return function () {
            s = (s + 0x6D2B79F5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /**
     * Lays out all fifteen situations for the furnished rooms. Returns, per situation,
     * { id, name, brief, placements: [{ room, type, x, z }] } with room-local x/z.
     */
    function layoutAll(rooms) {
        const used = new Map();               // room:slot → times used by earlier situations
        const slots = {};
        for (const r of rooms) slots[r.id] = freeSlots(r);
        return SITUATIONS.map((sit, si) => {
            const rng = mulberry32(7001 + si * 977);
            const placements = [];
            for (const r of rooms) {
                let code = sit.rooms[r.id] || '';
                if (sit.boss === r.id) code = 'B' + code;
                const taken = [];
                for (const ch of code) {
                    const type = { C: 'stand', V: 'cover', S: 'shield', H: 'host', B: 'boss' }[ch];
                    // shields need room for their hostage in front (+z) and lateral peek; cover prefers spots adjacent to furniture
                    let pool = slots[r.id].filter((s) => !taken.some((t) => Math.abs(t.x - s.x) < 1.6 && Math.abs(t.z - s.z) < 1.6)
                        && (type !== 'shield' || (s.z < 2.1 && Math.abs(s.x) < 4.0)));
                    if (type === 'cover') {
                        const covPool = pool.filter((s) => s.nearCover);
                        if (covPool.length) pool = covPool;
                    }
                    if (!pool.length) continue;
                    let best = Infinity;
                    for (const s of pool) best = Math.min(best, used.get(r.id + ':' + s.k) || 0);
                    const fresh = pool.filter((s) => (used.get(r.id + ':' + s.k) || 0) === best);
                    const s = fresh[Math.floor(rng() * fresh.length) % fresh.length];
                    taken.push(s);
                    used.set(r.id + ':' + s.k, best + 1);
                    placements.push({ room: r.id, type, x: s.x, z: s.z });
                }
            }
            return { id: sit.id, name: sit.name, brief: sit.brief, placements };
        });
    }

    let last = -1;
    BO.MansionScenarios = {
        SITUATIONS,
        layoutAll,
        /** Random situation index for this run (never repeats the previous run's). */
        pick() {
            let i = Math.floor(Math.random() * SITUATIONS.length);
            if (i === last) i = (i + 1 + Math.floor(Math.random() * (SITUATIONS.length - 1))) % SITUATIONS.length;
            last = i;
            return i;
        }
    };
})(window);
