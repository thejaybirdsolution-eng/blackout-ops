(function (BO) {
    'use strict';

    const modes = ['zombies', 'mp', 'td', 'survival'];
    const triggers = {
        shot: ['Fifth Shot', 'Every fifth firearm shot', 2.5],
        swap: ['Switch Weapon', 'When you switch weapons', 4.5],
        reload: ['Reload Start', 'When you start reloading', 3],
        slide: ['Slide Start', 'When you start sliding', 3.5],
        hurt: ['Incoming Hit', 'When you take damage', 4],
        kill: ['Elimination', 'When you eliminate an enemy', 2.5],
        jump: ['Takeoff', 'When you jump', 4],
        tactical: ['Tactical Use', 'When you use tactical equipment', 6]
    };
    function giveRounds(p, amount, fromReserve) {
        const w = p.activeWeapon;
        if (w?.stats.kind !== 'gun') return;
        const moved = Math.min(w.stats.magSize - w.mag, fromReserve ? w.reserve : w.stats.magSize, Math.floor(amount));
        if (moved <= 0) return;
        w.mag += moved;
        if (fromReserve) w.reserve -= moved;
    }
    const effects = {
        med: ['First Aid', 'restore {n} health', 16, 1, 60, (p, n) => {
            if (p.hp > 0 && !p.inLastStand) p.hp = Math.min(p.maxHp, p.hp + n);
        }],
        armor: ['Armor Repair', 'replenish {n} armor', 12, 1, 35, (p, n) => { p.armor = Math.min(p.maxArmor, p.armor + n); }],
        bench: ['Plate Pouch', 'gain one spare plate up to a stock of {n}', 3, 1, 4, (p, n) => {
            if (p.armorReservePlates < Math.floor(n)) p.armorReservePlates++;
        }],
        reserve: ['Reserve Delivery', 'gain {n} reserve rounds', 5, 1, 24, (p, n) => {
            const w = p.activeWeapon;
            if (w?.stats.kind === 'gun') w.reserve = Math.min(w.stats.reserveMax, w.reserve + Math.floor(n));
        }],
        chamber: ['Quick Feed', 'move {n} rounds from reserve into your magazine', 3, 1, 12, (p, n) => giveRounds(p, n, true)],
        sprint: ['Second Wind', 'restore {n}% tactical sprint stamina', 24, 5, 80, (p, n) => { p.tacStamina = Math.min(1, p.tacStamina + n / 100); }],
        ultimate: ['Ultimate Charge', 'gain {n}% ultimate charge', 6, 1, 20, (p, n) => p.addUltimateCharge(n)],
        recoil: ['Steady Sight', 'trim current recoil by {n}%', 55, 10, 100, (p, n) => {
            const scale = 1 - n / 100;
            p.recoilPitch *= scale;
            p.recoilYaw *= scale;
            p.recoilZ *= scale;
        }],
        dash: ['Forward Burst', 'add {n} m/s of forward momentum', 2, 0.5, 4, (p, n) => {
            p.vel.x -= Math.sin(p.yaw) * n;
            p.vel.z -= Math.cos(p.yaw) * n;
        }],
        cleanse: ['Eyes Clear', 'clear up to {n} seconds of flash blindness', 0.6, 0.1, 2, (p, n) => {
            p.flashBlindTimer = Math.max(0, p.flashBlindTimer - n);
        }],
        ward: ['Recovery Boost', 'shorten remaining regeneration delay by {n} seconds', 2.5, 0.5, 6, (p, n) => {
            p.regenDelayTimer = Math.max(0, p.regenDelayTimer - n);
        }],
        flash: ['Stagger Pulse', 'briefly stagger enemies within {n} m', 3.5, 1, 7, (p, n) => {
            const mode = BO.State.activeMode;
            const enemies = mode === 'mp' ? BO.MPMode.bots : mode === 'td' ? BO.TowerDefenseMode.zombies
                : mode === 'survival' ? BO.SurvivalMode.zombies : BO.ZombiesMode.zombies;
            for (const enemy of enemies || []) {
                if (!enemy.alive || enemy.powerAlly || (mode === 'mp' && !BO.MPMode.isSolo && enemy.team === BO.MPMode.playerTeam)) continue;
                if (enemy.pos.distanceToSquared(p.pos) < n * n) enemy.stunTimer = Math.max(enemy.stunTimer || 0, 0.45);
            }
        }],
        stability: ['Shock Absorber', 'reduce camera shake and impact flinch by {n}%', 65, 10, 100, (p, n) => {
            const scale = 1 - n / 100;
            p.cameraShake *= scale;
            p.flinchPitch *= scale;
        }]
    };

    function definition(key, event, action, value, label) {
        const [effect, detail] = effects[action];
        const [trigger, when, seconds] = triggers[event];
        return {
            k: key, lbl: label || trigger + ' / ' + effect, cat: 'reactions', tier: 'tactical',
            modes, ico: '↯', desc: when + ', ' + detail.replace('{n}', value) + '. ' + seconds + ' s cooldown.',
            event, action, value, seconds
        };
    }
    const definitions = Object.keys(triggers).flatMap((event) => Object.keys(effects).map((action) =>
        definition('react.' + event + '.' + action, event, action, effects[action][2])));
    const lookup = new Map(definitions.map((def) => [def.k, def]));
    const labelsKey = 'boCustomReactionLabels/v1';
    let labels = {};
    try { labels = JSON.parse(localStorage.getItem(labelsKey)) || {}; } catch (_) {}

    function customDefinition(key) {
        const parts = String(key).split('.');
        if (parts.length !== 5 || parts[0] !== 'customReaction' || !Object.hasOwn(triggers, parts[1]) ||
            !Object.hasOwn(effects, parts[2]) || !/^[0-9]+$/.test(parts[3]) || !/^[a-z0-9]+$/.test(parts[4])) return null;
        const [, event, action, raw] = parts;
        const value = Number(raw) / 100;
        const [, , , min, max] = effects[action];
        return value >= min && value <= max ? definition(key, event, action, value, labels[key]) : null;
    }

    function create(mode, label, event, action, raw) {
        const value = Number(raw);
        const name = String(label || '').trim().slice(0, 42);
        if (!modes.includes(mode) || !name || !Object.hasOwn(triggers, event) ||
            !Object.hasOwn(effects, action) || !Number.isFinite(value)) return null;
        const key = ['customReaction', event, action, Math.round(value * 100), Date.now().toString(36) + Math.random().toString(36).slice(2, 7)].join('.');
        if (!customDefinition(key)) return null;
        labels[key] = name;
        try { localStorage.setItem(labelsKey, JSON.stringify(labels)); } catch (_) {}
        return customDefinition(key);
    }

    const get = (key) => lookup.get(key) || customDefinition(key);
    const custom = (active) => [...new Set([...Object.keys(labels), ...Array.from(active || [])])].map(customDefinition).filter(Boolean);
    let equipped = new Map();
    let cooldowns = new Map();
    let previousMods = null;
    let shot = 0;
    function reset() {
        equipped = new Map();
        cooldowns = new Map();
        previousMods = null;
        shot = 0;
    }
    function fire(event, mods, player) {
        if (!player?.alive || !mods) return;
        if (mods !== previousMods) {
            previousMods = mods;
            equipped.clear();
            for (const key of Array.isArray(mods) ? mods : Object.keys(mods).filter((k) => mods[k])) {
                const def = get(key);
                if (!def) continue;
                if (!equipped.has(def.event)) equipped.set(def.event, []);
                equipped.get(def.event).push(def);
            }
        }
        const selected = equipped.get(event);
        if (!selected?.length || (event === 'shot' && ++shot % 5 !== 0)) return;
        const now = performance.now() / 1000;
        for (const def of selected) {
            if (now < (cooldowns.get(def.k) || 0)) continue;
            cooldowns.set(def.k, now + def.seconds);
            effects[def.action][5](player, def.value);
        }
    }
    BO.ReactiveModifiers = { definitions, triggers, effects, get, custom, customDefinition, create, reset, fire };
})(window.BO);
