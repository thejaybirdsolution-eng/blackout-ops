/* Rogue Lite door types: each door changes what entering costs and what the next floor pays,
   independently of which room waits behind it. */
(function (BO) {
    'use strict';

    const DOORS = {
        standard: { id: 'standard', name: 'Vault Door', icon: '▯', color: '#b7a27a', weight: 46, minFloor: 1,
            desc: 'An ordinary door. No cost, no modifier.' },
        gilded: { id: 'gilded', name: 'Gilded Door', icon: '◆', color: '#f6cf62', weight: 9, minFloor: 2,
            desc: 'Pay a toll in unbanked gold. Gold found on the next floor is doubled.',
            toll: (floor) => 15 + floor * 4, gold: 2 },
        blood: { id: 'blood', name: 'Blood Door', icon: '♥', color: '#f0606f', weight: 7, minFloor: 3,
            desc: 'Costs 15% of your max HP to open. The next floor gives 75% more XP and 25% more gold.',
            bloodPct: 0.15, xp: 1.75, gold: 1.25 },
        fractured: { id: 'fractured', name: 'Fractured Door', icon: '⚡', color: '#ff9d5c', weight: 8, minFloor: 4,
            desc: 'Enemies beyond have 35% more HP and hit 15% harder. XP and gold are raised by 50%.',
            hp: 1.35, dmg: 1.15, xp: 1.5, gold: 1.5 },
        veiled: { id: 'veiled', name: 'Veiled Door', icon: '◌', color: '#9fa8c7', weight: 7, minFloor: 3,
            desc: 'The sign is hidden, so you do not know the room. XP and gold are raised by 30%.',
            xp: 1.3, gold: 1.3, hidden: true },
        hourglass: { id: 'hourglass', name: 'Hourglass Door', icon: '⌛', color: '#8fe0ff', weight: 6, minFloor: 3,
            desc: 'Seals itself 25 seconds after the floor is cleared. The next floor gives 40% more gold and XP.',
            window: 25, xp: 1.4, gold: 1.4 },
        clover: { id: 'clover', name: 'Clover Door', icon: '✤', color: '#8ee08a', weight: 6, minFloor: 2,
            desc: 'Lucky. Refill one potion when you step through and find 20% more gold.',
            potion: 1, gold: 1.2 },
        reliquary: { id: 'reliquary', name: 'Reliquary Door', icon: '⚙', color: '#c9a8ff', weight: 6, minFloor: 5,
            desc: 'Pay unbanked scrap to open. A treasure chest waits on the next floor.',
            scrap: (floor) => 4 + Math.ceil(floor / 2), chest: true }
    };

    const NONE = DOORS.standard;
    const free = (id) => !DOORS[id].toll && !DOORS[id].bloodPct && !DOORS[id].scrap && !DOORS[id].window;

    BO.RPGDoors = {
        DOORS,
        get(id) { return DOORS[id] || NONE; },

        /** One door type per gate. At least one gate is always free and never seals. */
        roll(count, nextFloor, roomTypes) {
            const pool = Object.values(DOORS).filter((d) => d.minFloor <= nextFloor);
            const out = [];
            for (let i = 0; i < count; i++) {
                if (roomTypes[i] === 'boss' || nextFloor <= 2 && i === 0) { out.push('standard'); continue; }
                const options = pool.filter((d) => d.id === 'standard' || !out.includes(d.id));
                let total = 0;
                for (const d of options) total += d.weight;
                let roll = Math.random() * total;
                let pick = 'standard';
                for (const d of options) { roll -= d.weight; if (roll <= 0) { pick = d.id; break; } }
                out.push(pick);
            }
            if (!out.some(free)) out[0] = 'standard';
            return out;
        },

        cost(door, run, player) {
            const floor = run.floor + 1;
            if (door.toll) return { kind: 'gold', amount: door.toll(floor), ok: run.gold >= door.toll(floor), label: `${door.toll(floor)} GOLD` };
            if (door.scrap) return { kind: 'scrap', amount: door.scrap(floor), ok: run.scrap >= door.scrap(floor), label: `${door.scrap(floor)} SCRAP` };
            if (door.bloodPct) {
                const amount = Math.round(player.maxHp * door.bloodPct);
                return { kind: 'hp', amount, ok: player.hp > amount + 1, label: `${amount} HP` };
            }
            return null;
        }
    };
})(window.BO);
