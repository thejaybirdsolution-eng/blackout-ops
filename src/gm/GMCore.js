/* ============================================================================
   BLACKOUT OPS — Survival 1.0 "Gold Master" core (BO.GM)
   One lifecycle for every 1.0 system: registration, start/stop, rate-limited
   updates, checkpoint save/restore, the shared status-effect registry, the
   game-feel kit (stingers, banners, toasts) and a small spatial grid helper.

   Each module is a plain object registered with BO.GM.register(id, module):
     start(mode, saved)   saved = this module's slice of the checkpoint (or null)
     stop()
     update(dt)           called at module.rate Hz (default every frame)
     snapshot()           returns a JSON-safe object stored in the checkpoint
   Optional hooks other code calls through BO.GM:
     speedMult(), incomingDamageMult(), canSpawnAt(x, z), onKill(entity),
     onPickup(items, source), onDeath(), interact(marker), hudChips()
============================================================================ */
(function (BO) {
    'use strict';

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    /* ------------------------------------------------------------ status effects */
    const STATUS = {
        bleeding:  { name: 'Bleeding', color: '#ef4444', glyph: '🩸', bad: true, tip: 'Losing health and leaving a blood trail that infected can smell. Bandage or use a trauma kit.' },
        infected:  { name: 'Infected', color: '#84cc16', glyph: '☣', bad: true, tip: 'A bite is festering. Antibiotics cure it.' },
        fracture:  { name: 'Fracture', color: '#f97316', glyph: '🦴', bad: true, tip: 'You limp and cannot sprint. Use a splint.' },
        wet:       { name: 'Wet', color: '#38bdf8', glyph: '💧', bad: true, tip: 'Soaked clothes make you lose heat fast. Dry off by a fire or under a roof.' },
        cold:      { name: 'Cold', color: '#93c5fd', glyph: '❄', bad: true, tip: 'Stamina drains faster. Warm up at a fire, in a shelter or with broth.' },
        freezing:  { name: 'Freezing', color: '#60a5fa', glyph: '🥶', bad: true, tip: 'Hypothermia is hurting you. Get to heat now.' },
        hot:       { name: 'Overheating', color: '#fb923c', glyph: '🔥', bad: true, tip: 'Water drains twice as fast. Find shade or water.' },
        weakened:  { name: 'Weakened', color: '#f87171', glyph: '💀', bad: true, tip: 'You came back from the dead: max health −25% and slower stamina. A cooked meal or a night in a bed clears it.' },
        hunted:    { name: 'Hunted', color: '#ef4444', glyph: '👁', bad: true, tip: 'Something is actively hunting you. Fast travel, quick-stack and stash uplinks are locked.' },
        hotloot:   { name: 'Hot loot', color: '#f59e0b', glyph: '◆', bad: false, tip: 'You are carrying unsecured loot. Get it into storage at your base for the Haul bonus. Fast travel is locked while carrying it.' },
        encumbered:{ name: 'Encumbered', color: '#eab308', glyph: '⚖', bad: true, tip: 'Over your carry limit: much slower. Drop or stash something.' },
        rested:    { name: 'Well-rested', color: '#a7f3d0', glyph: '☾', bad: false, tip: '+10% XP and faster health regeneration.' },
        meal:      { name: 'Meal buff', color: '#fde68a', glyph: '🍲', bad: false, tip: 'A hearty meal is helping you.' },
        hidden:    { name: 'Hidden', color: '#a3e635', glyph: '◐', bad: false, tip: 'Nothing has noticed you.' },
        claimed:   { name: 'Claimed ground', color: '#4ade80', glyph: '⛯', bad: false, tip: 'Your lights hold this ground: roaming infected cannot spawn here.' },
        sheltered: { name: 'Sheltered', color: '#cbd5e1', glyph: '⌂', bad: false, tip: 'Under a roof: dry and out of the weather.' },
        drowning:  { name: 'Out of breath', color: '#0ea5e9', glyph: '〰', bad: true, tip: 'Your swim stamina is gone. Get to shore.' }
    };

    /* ------------------------------------------------------------ spatial grid */
    class SpatialGrid {
        constructor(cell = 10) { this.cell = cell; this.map = new Map(); }
        key(x, z) { return Math.floor(x / this.cell) + ',' + Math.floor(z / this.cell); }
        clear() { this.map.clear(); }
        add(item, x, z, r = 0) {
            const c = this.cell;
            for (let gx = Math.floor((x - r) / c); gx <= Math.floor((x + r) / c); gx++) {
                for (let gz = Math.floor((z - r) / c); gz <= Math.floor((z + r) / c); gz++) {
                    const k = gx + ',' + gz;
                    let list = this.map.get(k);
                    if (!list) this.map.set(k, list = []);
                    list.push(item);
                }
            }
        }
        query(x, z) { return this.map.get(this.key(x, z)) || []; }
        near(x, z, r) {
            const out = new Set();
            const c = this.cell;
            for (let gx = Math.floor((x - r) / c); gx <= Math.floor((x + r) / c); gx++) {
                for (let gz = Math.floor((z - r) / c); gz <= Math.floor((z + r) / c); gz++) {
                    const list = this.map.get(gx + ',' + gz);
                    if (list) for (const it of list) out.add(it);
                }
            }
            return [...out];
        }
    }

    /* ------------------------------------------------------------ the GM */
    const GM = {
        version: 3,
        modules: new Map(),
        order: [],
        active: false,
        mode: null,
        status: new Map(),
        firsts: new Set(),
        clocks: new Map(),
        STATUS,
        SpatialGrid,
        clamp,

        register(id, module) {
            module.id = id;
            if (!this.modules.has(id)) this.order.push(id);
            this.modules.set(id, module);
            return module;
        },

        get(id) { return this.modules.get(id); },
        get campaign() { return this.mode?.campaign || null; },
        get clock() { return this.mode?.clock || 0; },

        each(fn) {
            for (const id of this.order) {
                const m = this.modules.get(id);
                try { fn(m, id); } catch (err) { console.error('[GM:' + id + ']', err); }
            }
        },

        start(mode, saved) {
            this.mode = mode;
            this.active = true;
            this.status.clear();
            this.clocks.clear();
            const data = saved && saved.version >= 3 ? saved : null;
            this.firsts = new Set(data?.firsts || []);
            this.each((m, id) => m.start?.(mode, data?.modules?.[id] || null, saved || null));
        },

        stop() {
            if (!this.active) return;
            // Unwind in reverse so layered patches on shared singletons restore cleanly.
            for (const id of [...this.order].reverse()) {
                const m = this.modules.get(id);
                try { m.stop?.(); } catch (err) { console.error('[GM:' + id + '] stop', err); }
            }
            this.active = false;
            this.mode = null;
            this.status.clear();
        },

        update(dt) {
            if (!this.active || !this.mode?.active) return;
            for (const id of this.order) {
                const m = this.modules.get(id);
                if (!m.update) continue;
                if (m.rate) {
                    const acc = (this.clocks.get(id) || 0) + dt;
                    if (acc < 1 / m.rate) { this.clocks.set(id, acc); continue; }
                    this.clocks.set(id, 0);
                    try { m.update(acc); } catch (err) { console.error('[GM:' + id + ']', err); }
                } else {
                    try { m.update(dt); } catch (err) { console.error('[GM:' + id + ']', err); }
                }
            }
            this.expireStatus();
        },

        snapshot() {
            const modules = {};
            this.each((m, id) => { if (m.snapshot) modules[id] = m.snapshot(); });
            return { version: this.version, firsts: [...this.firsts], modules };
        },

        /* ---------------------------------------------- hooks: product/any */
        product(fnName, ...args) {
            let v = 1;
            for (const id of this.order) {
                const m = this.modules.get(id);
                if (typeof m[fnName] === 'function') {
                    try { v *= m[fnName](...args) ?? 1; } catch (err) { console.error('[GM:' + id + '] ' + fnName, err); }
                }
            }
            return v;
        },
        any(fnName, ...args) {
            for (const id of this.order) {
                const m = this.modules.get(id);
                if (typeof m[fnName] === 'function') {
                    try { if (m[fnName](...args)) return true; } catch (err) { console.error('[GM:' + id + '] ' + fnName, err); }
                }
            }
            return false;
        },
        every(fnName, ...args) {
            for (const id of this.order) {
                const m = this.modules.get(id);
                if (typeof m[fnName] === 'function') {
                    try { if (m[fnName](...args) === false) return false; } catch (err) { console.error('[GM:' + id + '] ' + fnName, err); }
                }
            }
            return true;
        },
        call(fnName, ...args) {
            for (const id of this.order) {
                const m = this.modules.get(id);
                if (typeof m[fnName] === 'function') {
                    try { m[fnName](...args); } catch (err) { console.error('[GM:' + id + '] ' + fnName, err); }
                }
            }
        },

        speedMult() { return this.active ? this.product('speedMult') : 1; },
        incomingDamageMult() { return this.active ? this.product('incomingDamageMult') : 1; },
        canSpawnAt(x, z) { return !this.active || this.every('canSpawnAt', x, z); },
        interact(marker) { return this.active && this.any('interact', marker); },

        /* ---------------------------------------------- status registry */
        setStatus(id, opts = {}) {
            const def = STATUS[id];
            if (!def) return;
            const prev = this.status.get(id);
            this.status.set(id, { id, until: opts.until ?? Infinity, start: prev?.start ?? this.clock, total: opts.total ?? (Number.isFinite(opts.until) ? opts.until - this.clock : 0), stacks: opts.stacks || 1, label: opts.label || '' });
        },
        clearStatus(id) { this.status.delete(id); },
        hasStatus(id) { const s = this.status.get(id); return !!s && s.until > this.clock; },
        expireStatus() {
            const now = this.clock;
            for (const [id, s] of this.status) if (s.until <= now) this.status.delete(id);
        },
        statusList() {
            const now = this.clock;
            return [...this.status.values()].filter((s) => s.until > now).map((s) => ({ ...STATUS[s.id], ...s, left: Number.isFinite(s.until) ? s.until - now : null }));
        },

        /* ---------------------------------------------- feel kit */
        toast(text, color = '#a6ddd0') { BO.Events.emit('hud:toast', { text, color }); },
        banner(title, sub = '', color = '#8fe3c8') { BO.Events.emit('hud:banner', { title, sub, color }); },
        tone(seq, vol = 0.18, type = 'triangle') {
            const S = BO.Sound;
            if (!S?.playTone) return;
            S.ensureContext?.();
            let t = 0;
            for (const [f1, f2, dur] of seq) { S.playTone(f1, f2, dur, type, vol, t); t += dur * 0.85; }
        },
        sting(kind) {
            switch (kind) {
                case 'first': return this.tone([[523, 523, 0.12], [659, 659, 0.12], [784, 784, 0.12], [1046, 1046, 0.32]], 0.16);
                case 'haul': return this.tone([[392, 392, 0.14], [523, 523, 0.14], [659, 659, 0.14], [784, 784, 0.18], [1046, 1046, 0.45]], 0.18, 'sine');
                case 'claim': return this.tone([[880, 1320, 0.25]], 0.08, 'sine');
                case 'power': return this.tone([[110, 220, 0.4], [220, 440, 0.35]], 0.12, 'sawtooth');
                case 'brownout': return this.tone([[220, 70, 0.5]], 0.14, 'square');
                case 'pickup': return this.tone([[1200 + Math.random() * 300, 1700, 0.05]], 0.05, 'sine');
                case 'death': return this.tone([[330, 110, 0.9]], 0.18, 'sawtooth');
                case 'warning': return this.tone([[660, 660, 0.12], [440, 440, 0.2]], 0.14, 'square');
                case 'boss': BO.Sound?.playBossIntro?.(); return;
                case 'trade': return this.tone([[784, 784, 0.08], [988, 988, 0.12]], 0.1, 'sine');
                case 'alarm': BO.Sound?.playAirRaidSiren?.(); return;
                default: return this.tone([[600, 600, 0.08]], 0.08);
            }
        },
        /** One-time milestones: unique stinger, banner and journal entry. */
        first(id, title, sub) {
            if (!this.active || this.firsts.has(id)) return false;
            this.firsts.add(id);
            this.sting('first');
            this.banner('FIRST: ' + title.toUpperCase(), sub, '#fde68a');
            this.campaign?.mark('firsts', 1, 30);
            return true;
        },

        /* ---------------------------------------------- shared helpers */
        dist2(a, b) { return Math.hypot(a.x - b.x, a.z - b.z); },
        ground(x, z, y = 80) { return BO.World.getGroundHeight(x, z, y); },
        itemName(id) { return BO.SurvivalItemName ? BO.SurvivalItemName(id) : (BO.SurvivalFrontierData.items[id]?.[0] || id); },
        amounts(items) { return BO.SurvivalItemAmounts ? BO.SurvivalItemAmounts(items) : Object.entries(items).map(([k, v]) => v + ' ' + k).join(', '); },
        hostileNear(pos, r) { const m = this.mode; return !!m && [...m.zombies, ...m.bots].some((e) => e.alive && e.team !== 0 && !e.animal && Math.hypot(e.pos.x - pos.x, e.pos.z - pos.z) < r); },
        esc(v) { return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
    };

    BO.GM = GM;
})(window.BO);
