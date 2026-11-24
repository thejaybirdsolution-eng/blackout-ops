/* ============================================================================
   BLACKOUT OPS — Survival Gold: the First Night (BO.GM 'night')
   · ROOMS: every roof (or upper floor) you build is tested for walls on all
     sides with 16 horizontal rays. Touching enclosed tiles join into a room.
     A room with a door is a SHELTER; a shelter with a burning light and a bed
     inside is a SAFE ROOM: no roaming spawns inside, and you can sleep there.
   · SLEEP: at night, sleeping in a Safe Room skips to dawn. Sleeping anywhere
     else risks an ambush. Nobody sleeps on a horde night.
   · DAY ONE: the first day's daylight runs about twelve real minutes so you can
     set up before dark. Every evening warns you two hours before sunset.
   · FIRST NIGHT TRACK: a seven-step checklist from bare hands to a night's
     sleep in your own safe room, one step at a time, with the nearest
     resource pointed out. Finishing it on night one earns a Trail pack.
============================================================================ */
(function (BO) {
    'use strict';
    const GM = BO.GM;

    const WALLS = new Set(['wall', 'stoneWall', 'concreteWall', 'obsidianWall', 'windowWall', 'spikeWall']);
    const DOORS = new Set(['door', 'woodDoor', 'ironDoor', 'doubleGate']);
    const CEILINGS = new Set(['roof', 'floor', 'stoneFloor', 'catwalk']);
    const LIGHTS = new Set(['wallTorch', 'lanternPost', 'floodlight', 'searchlight', 'campfire', 'firepit']);
    const ROOF_OFF = 2.72;
    const RAYS = 16;
    const RAY_MAX = 10;
    const DAY_ONE_REAL_SECONDS = 720;
    const DUSK_HOUR = 19;
    const AMBUSH_CHANCE = 0.35;
    const STORE_KEY = 'bo_survival_firstnight_done';

    GM.STATUS.saferoom = { name: 'Safe room', color: '#4ade80', glyph: '⌂', bad: false, tip: 'Walls, roof, door, a burning light and a bed: nothing spawns in here and you can sleep through the night.' };
    GM.STATUS.shelter = { name: 'Shelter', color: '#cbd5e1', glyph: '⌂', bad: false, tip: 'Enclosed and roofed. Add a burning light and a bed to make it a Safe Room.' };

    const STEPS = [
        { id: 'gather', title: 'Gather 5 timber and 5 stone', hint: 'Fallen branches and loose stones break with bare hands.' },
        { id: 'cord', title: 'Braid cord', hint: 'Crafting · 3 plant fiber from fiber roots.' },
        { id: 'hatchet', title: 'Craft a stone hatchet', hint: 'Crafting · 2 timber · 2 stone · 1 cord. Fells trees four times faster.' },
        { id: 'bench', title: 'Place a Field Workbench', hint: 'Build · 3 timber · 2 stone. Unlocks boards, cloth and doors.' },
        { id: 'shelter', title: 'Build a shelter', hint: 'Walls on every side, a roof and a door. Timber doors need boards from the bench.' },
        { id: 'light', title: 'Light it', hint: 'A standing torch or a campfire inside the shelter.' },
        { id: 'sleep', title: 'Place a bed and sleep', hint: 'Bed · 3 timber · 2 cloth (weave cloth from fiber at the bench). Sleep after dusk.' }
    ];

    /** World box of a placed piece (roofs sit on top of the walls). */
    function boxOf(p) {
        const [w, h, d] = p.size;
        const bottom = p.y + (p.type === 'roof' ? ROOF_OFF : 0);
        return { minX: p.x - w / 2, maxX: p.x + w / 2, minY: bottom, maxY: bottom + h, minZ: p.z - d / 2, maxZ: p.z + d / 2 };
    }

    /** Distance along a horizontal ray to a box's footprint, or Infinity. */
    function rayBox2D(ox, oz, dx, dz, b) {
        let t0 = 0;
        let t1 = RAY_MAX;
        for (const [o, d, lo, hi] of [[ox, dx, b.minX, b.maxX], [oz, dz, b.minZ, b.maxZ]]) {
            if (Math.abs(d) < 1e-6) {
                if (o < lo || o > hi) return Infinity;
            } else {
                let a = (lo - o) / d;
                let c = (hi - o) / d;
                if (a > c) [a, c] = [c, a];
                t0 = Math.max(t0, a);
                t1 = Math.min(t1, c);
                if (t0 > t1) return Infinity;
            }
        }
        return t0;
    }

    const Night = {
        rate: 0,

        start(mode, saved) {
            this.mode = mode;
            this.c = mode.campaign;
            this.rooms = [];
            this.nextRooms = 0;
            this.inRoom = null;
            this.warnedDusk = saved?.warnedDusk || 0;
            this.warnedLate = saved?.warnedLate || 0;
            this.done = new Set(saved?.done || []);
            this.complete = !!saved?.complete;
            this.slept = !!saved?.slept;
            let seen = false;
            try { seen = localStorage.getItem(STORE_KEY) === '1'; } catch (e) { seen = false; }
            // Returning players skip the checklist; a saved run keeps whatever it had.
            this.tracking = saved ? !!saved.tracking : !seen;
            this.stretch = this.dayOneStretch();
            this.nextTrack = 0;
            this.buildDom();
            this.patch();
            this.computeRooms();
        },

        stop() {
            this.unpatch();
            this.el?.remove();
            this.el = null;
            document.body.classList.remove('gm-fn-on');
            this.mode = this.c = null;
        },

        snapshot() {
            return { done: [...this.done], complete: this.complete, slept: this.slept, tracking: this.tracking, warnedDusk: this.warnedDusk, warnedLate: this.warnedLate };
        },

        /* ------------------------------------------------------------ day one */
        /** How many times slower the first day's daylight runs (1 = normal). */
        dayOneStretch() {
            const o = this.c.options;
            if (o.firstDayStretch === false || this.c.has('sv_fast_days') || this.c.has('blackout')) return 1;
            const daylight = (DUSK_HOUR - o.startHour) * o.dayLength / 24;
            if (daylight <= 0) return 1;
            return Math.max(1, Math.min(8, DAY_ONE_REAL_SECONDS / daylight));
        },

        stretching() {
            return this.stretch > 1 && this.c.day === 1 && this.c.hour < DUSK_HOUR && this.c.hour >= this.c.options.startHour - 0.01;
        },

        /** Real seconds until the given hour today (accounts for the day-one stretch). */
        secondsUntil(hour) {
            const left = hour - this.c.hour;
            if (left <= 0) return 0;
            return left * this.c.options.dayLength / 24 * (this.stretching() ? this.stretch : 1);
        },

        /* ------------------------------------------------------------ rooms */
        computeRooms() {
            const placed = this.c.placed.filter((p) => p.alive && p.size);
            const walls = [];
            for (const p of placed) if (WALLS.has(p.type) || DOORS.has(p.type)) walls.push({ p, b: boxOf(p), door: DOORS.has(p.type) });
            const cells = [];
            for (const p of placed) {
                if (!CEILINGS.has(p.type)) continue;
                const b = boxOf(p);
                // A floor only counts as a ceiling when it is held up well above the ground.
                if (p.type !== 'roof' && b.minY - BO.World.terrainHeight(p.x, p.z) < 2.0) continue;
                const h = b.minY - 1.6;
                let door = false;
                let open = false;
                for (let i = 0; i < RAYS && !open; i++) {
                    const a = (i / RAYS) * Math.PI * 2;
                    const dx = Math.cos(a);
                    const dz = Math.sin(a);
                    let best = Infinity;
                    let bestDoor = false;
                    for (const w of walls) {
                        if (w.b.minY > h || w.b.maxY < h + 0.9) continue;
                        const t = rayBox2D(p.x, p.z, dx, dz, w.b);
                        if (t < best) { best = t; bestDoor = w.door; }
                    }
                    if (best > RAY_MAX) open = true;
                    else if (bestDoor) door = true;
                }
                if (!open) cells.push({ p, b, h, floor: h - 1.0, door });
            }
            // Join touching enclosed tiles into rooms.
            const rooms = [];
            const seen = new Set();
            for (const cell of cells) {
                if (seen.has(cell)) continue;
                const room = { cells: [], door: false, light: false, bed: false };
                const queue = [cell];
                seen.add(cell);
                while (queue.length) {
                    const cur = queue.pop();
                    room.cells.push(cur);
                    if (cur.door) room.door = true;
                    for (const o of cells) {
                        if (seen.has(o)) continue;
                        if (Math.abs(o.p.x - cur.p.x) <= 3.0 && Math.abs(o.p.z - cur.p.z) <= 3.0 && Math.abs(o.h - cur.h) < 0.6) {
                            seen.add(o);
                            queue.push(o);
                        }
                    }
                }
                const threat = GM.get('threat');
                for (const p of placed) {
                    if (!LIGHTS.has(p.type) && p.type !== 'bed') continue;
                    if (!this.cellOf(room, p.x, p.y, p.z)) continue;
                    if (p.type === 'bed') room.bed = true;
                    else if (!threat?.lightActive || threat.lightActive(p)) room.light = true;
                }
                room.safe = room.door && room.light && room.bed;
                rooms.push(room);
            }
            this.rooms = rooms;
        },

        cellOf(room, x, y, z, pad = 0.15) {
            for (const cell of room.cells) {
                const b = cell.b;
                if (x >= b.minX - pad && x <= b.maxX + pad && z >= b.minZ - pad && z <= b.maxZ + pad && y >= cell.floor - 0.7 && y <= cell.floor + 1.8) return cell;
            }
            return null;
        },

        roomAt(x, y, z) {
            for (const room of this.rooms) if (this.cellOf(room, x, y, z)) return room;
            return null;
        },

        /** Roaming infected never spawn inside a Safe Room. */
        canSpawnAt(x, z) {
            for (const room of this.rooms) {
                if (!room.safe) continue;
                for (const cell of room.cells) {
                    const b = cell.b;
                    if (x >= b.minX - 0.5 && x <= b.maxX + 0.5 && z >= b.minZ - 0.5 && z <= b.maxZ + 0.5) return false;
                }
            }
            return true;
        },

        onBuild() { this.nextRooms = 0; },

        /* ------------------------------------------------------------ sleep */
        hordeTonight() {
            const H = BO.ZoneHorde;
            const c = this.c;
            if (!H || !this.mode.hostilesReleased || BO.ZoneFinale?.hordesOff) return false;
            if (H.active) return true;
            const tonight = c.isNight ? c.nightNumber : c.nightNumber + 1;
            return H.nextHordeNight() === tonight && (c.isNight || c.hour >= 16.5);
        },

        nightTime() { return this.c.hour >= 18 || this.c.hour < 6; },

        /** Handles a night's sleep. Returns true when it fully handled the request. */
        trySleep(room) {
            const m = this.mode;
            if (this.hordeTonight()) {
                GM.sting('warning');
                GM.toast('Horde night: nobody sleeps tonight. Hold your walls until dawn.', '#fca5a5');
                return true;
            }
            if (room?.safe) return false;
            if (Math.random() < AMBUSH_CHANCE) {
                this.c.restHours += 2 + Math.random() * 2;
                const p = BO.Player.pos;
                for (let i = 0; i < 3; i++) {
                    const a = Math.random() * Math.PI * 2;
                    const r = 12 + Math.random() * 5;
                    m.spawnInfected(p.x + Math.cos(a) * r, null, p.z + Math.sin(a) * r, 'normal', null, true);
                }
                GM.sting('warning');
                GM.banner('AMBUSHED IN YOUR SLEEP', 'No walls, no door, no light. Build a Safe Room to sleep through the night.', '#f87171');
                return true;
            }
            GM.toast('You slept rough and got lucky. A Safe Room keeps the night out for certain.', '#fde68a');
            return false;
        },

        patch() {
            const self = this;
            const c = this.c;
            this._orig = { activate: c.activate, sleep: c.sleepUntilDawn };
            c.activate = function (marker) {
                if (marker?.id?.startsWith('build:') && self.nightTime()) {
                    const piece = this.placed.find((e) => 'build:' + e.id === marker.id && e.alive);
                    if (piece?.type === 'bed') {
                        if (!this.canSave()) { self.mode.toast('Clear nearby enemies before sleeping.'); return true; }
                        self.computeRooms();
                        const room = self.roomAt(piece.x, piece.y, piece.z);
                        if (self.trySleep(room)) return true;
                        self.sleepNow(room);
                        return true;
                    }
                }
                return self._orig.activate.call(this, marker);
            };
            c.sleepUntilDawn = function () {
                if (!self.nightTime()) return self._orig.sleep.call(this);
                if (!this.canSave()) return self._orig.sleep.call(this);
                self.computeRooms();
                const p = BO.Player.pos;
                const room = self.roomAt(p.x, p.y, p.z);
                if (self.trySleep(room)) return false;
                return self.sleepNow(room);
            };
        },

        sleepNow(room) {
            const ok = this._orig.sleep.call(this.c);
            if (ok !== false && room?.safe) {
                this.slept = true;
                GM.first('saferoom', 'Slept safe', 'Your own walls kept the night out.');
            }
            return ok;
        },

        unpatch() {
            if (!this._orig || !this.c) return;
            this.c.activate = this._orig.activate;
            this.c.sleepUntilDawn = this._orig.sleep;
            this._orig = null;
        },

        /* ------------------------------------------------------------ warnings */
        updateWarnings() {
            const c = this.c;
            const day = c.day;
            if (c.hour >= 17 && c.hour < DUSK_HOUR && this.warnedDusk !== day) {
                this.warnedDusk = day;
                const safe = this.rooms.some((r) => r.safe);
                const horde = this.hordeTonight();
                GM.sting('warning');
                GM.banner('SUNSET IN 2 HOURS',
                    (safe ? 'Head home: your Safe Room is ready.' : 'Get under a roof with a door, a burning light and a bed.') + (horde ? ' HORDE TONIGHT.' : ''),
                    horde ? '#f87171' : '#fbbf24');
            }
            if (c.hour >= 18.5 && c.hour < DUSK_HOUR && this.warnedLate !== day) {
                this.warnedLate = day;
                GM.toast('Night falls in about ' + Math.max(5, Math.round(this.secondsUntil(DUSK_HOUR))) + ' seconds.', '#fbbf24');
            }
        },

        /* ------------------------------------------------------------ First Night track */
        stepDone(id) {
            const m = this.mode;
            const c = this.c;
            const pts = m.points;
            const tools = c.pack.tools;
            switch (id) {
                case 'gather': return (pts.timber || 0) >= 5 && (pts.stone || 0) >= 5;
                case 'cord': return (pts.cord || 0) > 0 || Object.keys(tools).some((t) => tools[t] > 0);
                case 'hatchet': return ['stoneAxe', 'ironAxe', 'saw'].some((t) => tools[t] > 0);
                case 'bench': return c.placed.some((p) => p.alive && p.type === 'bench');
                case 'shelter': return this.rooms.some((r) => r.door);
                case 'light': return this.rooms.some((r) => r.door && r.light);
                case 'sleep': return this.slept;
                default: return false;
            }
        },

        currentStep() { return STEPS.find((s) => !this.done.has(s.id)) || null; },

        updateTrack() {
            if (!this.tracking || this.complete) return;
            // Steps latch in order: later steps only tick once earlier ones have.
            for (const s of STEPS) {
                if (this.done.has(s.id)) continue;
                if (!this.stepDone(s.id)) break;
                this.done.add(s.id);
                GM.sting('first');
                GM.toast('First Night · ' + s.title + ' ✓', '#a7f3d0');
            }
            if (this.done.size === STEPS.length) this.finishTrack();
            this.renderTrack();
        },

        finishTrack() {
            this.complete = true;
            const c = this.c;
            const pack = c.pack;
            const onTime = c.nightNumber <= 1;
            if (onTime && pack.level < 1) pack.level = 1;
            BO.ZoneThrill?.xp?.(onTime ? 250 : 120, 'First Night');
            GM.banner('MADE IT THROUGH', onTime ? 'First night survived in your own Safe Room · Trail pack unlocked (17 slots).' : 'Your Safe Room is complete.', '#86efac');
            GM.sting('haul');
            try { localStorage.setItem(STORE_KEY, '1'); } catch (e) { /* storage blocked: the track simply shows again next run */ }
            this.el.classList.add('hidden');
            document.body.classList.remove('gm-fn-on');
        },

        nearestText(kinds) {
            const p = BO.Player.pos;
            let best = null;
            let bd = Infinity;
            for (const node of this.c.pack.resources.values()) {
                if (node.hp <= 0 || !kinds.includes(node.kind)) continue;
                const d = Math.hypot(node.marker.x - p.x, node.marker.z - p.z);
                if (d < bd) { bd = d; best = node; }
            }
            if (!best) return '';
            const { forward: f, right: r } = BO.Player.getMoveDirectionVectors();
            const dx = best.marker.x - p.x;
            const dz = best.marker.z - p.z;
            const fwd = (dx * f.x + dz * f.z) / (bd || 1);
            const side = (dx * r.x + dz * r.z) / (bd || 1);
            const dir = fwd > 0.7 ? 'ahead' : fwd < -0.7 ? 'behind you' : side > 0 ? 'to your right' : 'to your left';
            return best.spec.name + ' · ' + Math.round(bd) + ' m ' + dir;
        },

        progressText(id) {
            const pts = this.mode.points;
            switch (id) {
                case 'gather': {
                    const t = Math.min(5, pts.timber || 0);
                    const s = Math.min(5, pts.stone || 0);
                    const near = t < 5 && s < 5 ? this.nearestText(['kindling', 'stones']) : t < 5 ? this.nearestText(['kindling']) : this.nearestText(['stones']);
                    return 'Timber ' + t + '/5 · Stone ' + s + '/5' + (near ? '<br><i>' + near + '</i>' : '');
                }
                case 'cord': {
                    const f = pts.fiber || 0;
                    const near = f < 3 ? this.nearestText(['roots']) : '';
                    return 'Fiber ' + Math.min(3, f) + '/3' + (near ? '<br><i>' + near + '</i>' : '');
                }
                case 'hatchet': return 'Timber ' + Math.min(2, pts.timber || 0) + '/2 · Stone ' + Math.min(2, pts.stone || 0) + '/2 · Cord ' + Math.min(1, pts.cord || 0) + '/1';
                case 'bench': return 'Timber ' + Math.min(3, pts.timber || 0) + '/3 · Stone ' + Math.min(2, pts.stone || 0) + '/2';
                case 'shelter': {
                    const roofs = this.c.placed.filter((p) => p.alive && p.type === 'roof').length;
                    const encl = this.rooms.length;
                    return roofs ? (encl ? 'Enclosed — now add a door' : 'Roof up — close every side with walls') : 'Walls first, then a roof on top';
                }
                case 'light': return this.rooms.some((r) => r.door) ? 'Place a standing torch or campfire inside' : '';
                case 'sleep': {
                    const bed = this.rooms.some((r) => r.door && r.light && r.bed);
                    if (!bed) return 'Cloth ' + Math.min(2, pts.cloth || 0) + '/2 · Timber ' + Math.min(3, pts.timber || 0) + '/3';
                    return this.nightTime() ? 'Safe Room ready — use the bed' : 'Safe Room ready — sleep after dusk (' + this.c.clockFace + ')';
                }
                default: return '';
            }
        },

        buildDom() {
            this.el = document.createElement('div');
            this.el.id = 'gm-fn';
            this.el.className = 'gm-fn hidden';
            document.body.appendChild(this.el);
        },

        renderTrack() {
            const el = this.el;
            if (!el) return;
            const step = this.currentStep();
            if (!this.tracking || this.complete || !step) {
                el.classList.add('hidden');
                document.body.classList.remove('gm-fn-on');
                return;
            }
            document.body.classList.add('gm-fn-on');
            const idx = STEPS.indexOf(step);
            const dusk = this.c.day === 1 && this.c.hour < DUSK_HOUR ? this.secondsUntil(DUSK_HOUR) : 0;
            const clock = dusk > 0 ? Math.floor(dusk / 60) + ':' + String(Math.floor(dusk % 60)).padStart(2, '0') : '';
            const pips = STEPS.map((s, i) => '<i class="' + (this.done.has(s.id) ? 'ok' : i === idx ? 'cur' : '') + '"></i>').join('');
            const html = '<header><span>FIRST NIGHT</span><span class="dusk">' + (clock ? 'Dusk in ' + clock : this.c.isNight ? 'Night' : '') + '</span></header>' +
                '<div class="pips">' + pips + '</div>' +
                '<b>' + (idx + 1) + '. ' + GM.esc(step.title) + '</b>' +
                '<p>' + GM.esc(step.hint) + '</p>' +
                '<div class="prog">' + this.progressText(step.id) + '</div>';
            if (html !== this._html) { el.innerHTML = html; this._html = html; }
            el.classList.remove('hidden');
        },

        /* ------------------------------------------------------------ per-frame */
        update(dt) {
            const m = this.mode;
            const c = this.c;
            if (!m || !c) return;
            if (this.stretching()) c.restHours -= dt / c.options.dayLength * 24 * (1 - 1 / this.stretch);
            if (m.clock >= this.nextRooms) {
                this.nextRooms = m.clock + 1;
                this.computeRooms();
                const p = BO.Player.pos;
                this.inRoom = this.roomAt(p.x, p.y, p.z);
                if (this.inRoom?.safe) {
                    if (!GM.hasStatus('saferoom')) GM.first('saferoom_in', 'Safe room', 'Walls, roof, door, light and a bed: nothing spawns in here.');
                    GM.setStatus('saferoom', { until: m.clock + 1.5 });
                } else if (this.inRoom?.door) GM.setStatus('shelter', { until: m.clock + 1.5 });
                this.updateWarnings();
            }
            if (m.clock >= this.nextTrack) {
                this.nextTrack = m.clock + 0.25;
                this.updateTrack();
            }
        }
    };

    GM.register('night', Night);
})(window.BO);
