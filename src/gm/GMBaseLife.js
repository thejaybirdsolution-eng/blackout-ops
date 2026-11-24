/* ============================================================================
   BLACKOUT OPS — Survival Gold: base life & quick wheel (BO.GM 'baselife')
   · AUTO-WATER: a dry crop bed within 6 m of a rain barrel draws a unit of
     its water by itself; while it rains every dry bed waters itself. Building
     the infrastructure removes the chore.
   · BASE STATUS: one chip under the top bar when home needs you —
     "Base · 2 lights out · 1 crop ready · generator dry".
   · QUICK WHEEL: tap the quick-heal key to heal as before; hold it to open an
     eight-slice wheel (eat, heal, drink, torch, campfire, quick-stack, repair,
     throw). Flick the mouse toward a slice and release. Solo play slows to
     half speed while it is open.
   · ONE TRACKER: the contracts + quests panel shows at most three rows;
     the rest wait in the Journal.
============================================================================ */
(function (BO) {
    'use strict';
    const GM = BO.GM;

    const BARREL_REACH = 6;
    const HOLD_MS = 230;
    const TRACK_ROWS = 3;
    const LIGHT_TYPES = new Set(['wallTorch', 'campfire', 'firepit', 'lanternPost']);

    const SLICES = [
        { id: 'eat', label: 'Eat', glyph: 'roast' },
        { id: 'heal', label: 'Heal', glyph: 'medkit' },
        { id: 'drink', label: 'Drink', glyph: 'drop' },
        { id: 'torch', label: 'Torch', glyph: 'torch' },
        { id: 'campfire', label: 'Campfire', glyph: 'fire' },
        { id: 'stack', label: 'Quick-stack', glyph: 'chest' },
        { id: 'repair', label: 'Repair', glyph: 'wrench' },
        { id: 'throw', label: 'Throw', glyph: 'grenade' }
    ];
    const DRINKS = ['freshWater', 'tea', 'broth', 'espresso', 'milk_flask', 'berries'];

    const BaseLife = {
        rate: 0,

        start(mode) {
            this.mode = mode;
            this.c = mode.campaign;
            this.nextWater = 0;
            this.wheelOpen = false;
            this.holdTimer = null;
            this.keyDown = false;
            this.pick = -1;
            this.aim = { x: 0, y: 0 };
            this.buildWheel();
            this.onMouse = (e) => this.mouseMove(e);
            document.addEventListener('mousemove', this.onMouse);
            this.patchTracker();
        },

        stop() {
            this.closeWheel(false);
            clearTimeout(this.holdTimer);
            document.removeEventListener('mousemove', this.onMouse);
            this.wheel?.remove();
            this.wheel = null;
            this.unpatchTracker();
            this.mode = this.c = null;
        },

        /* ------------------------------------------------------------ auto-water */
        barrels() {
            const A = BO.ZoneArmory;
            if (!A?.barrels) return [];
            const out = [];
            for (const [id, st] of A.barrels) {
                const piece = this.c.placed.find((p) => p.alive && String(p.id) === id && p.type === 'rainbarrel');
                if (piece) out.push({ piece, st });
            }
            return out;
        },

        autoWater() {
            const garden = this.c.activities?.garden;
            if (!garden) return;
            const raining = !!GM.get('weather')?.raining?.();
            const barrels = this.barrels();
            for (const plot of garden.values()) {
                if (plot.stage !== 'dry') continue;
                let source = raining ? 'rain' : null;
                if (!source) {
                    const b = barrels.find((x) => x.st.stored >= 1 && Math.hypot(x.piece.x - plot.x, x.piece.z - plot.z) <= BARREL_REACH);
                    if (b) { b.st.stored -= 1; source = 'barrel'; }
                }
                if (!source) continue;
                plot.stage = 'growing';
                if (plot.marker) plot.marker.label = this.c.activities.plotLabel(plot);
                GM.first('autowater', 'Self-watering bed', source === 'rain' ? 'Rain watered your crops for you.' : 'A rain barrel within 6 m waters crop beds by itself.');
            }
        },

        /* ------------------------------------------------------------ base status */
        hudChips() {
            const c = this.c;
            if (!c) return [];
            const home = c.placed.some((p) => p.alive && (p.type === 'bench' || p.type === 'bed'));
            if (!home) return [];
            const threat = GM.get('threat');
            let out = 0;
            for (const p of c.placed) if (p.alive && LIGHT_TYPES.has(p.type) && threat?.lightActive && !threat.lightActive(p)) out++;
            let ready = 0;
            let dry = 0;
            for (const plot of c.activities?.garden?.values() || []) {
                if (!plot.custom) continue;
                if (plot.stage === 'ready') ready++;
                else if (plot.stage === 'dry') dry++;
            }
            const gens = c.placed.filter((p) => p.alive && p.type === 'generator');
            const genDry = gens.length && gens.every((g) => !g.gmRunning);
            const parts = [];
            if (out) parts.push(out + ' light' + (out === 1 ? '' : 's') + ' out');
            if (ready) parts.push(ready + ' crop' + (ready === 1 ? '' : 's') + ' ready');
            if (dry) parts.push(dry + ' bed' + (dry === 1 ? '' : 's') + ' need water');
            if (genDry) parts.push('generator dry');
            if (!parts.length) return [];
            return [{ text: 'Base · ' + parts.join(' · '), cls: out && c.isNight ? 'danger' : 'warn' }];
        },

        /* ------------------------------------------------------------ quick wheel */
        buildWheel() {
            const el = document.createElement('div');
            el.id = 'gm-wheel';
            el.className = 'gm-wheel hidden';
            const I = BO.SurvivalIcons;
            el.innerHTML = '<div class="ring">' + SLICES.map((s, i) => {
                const a = (i / SLICES.length) * Math.PI * 2 - Math.PI / 2;
                return '<div class="slice" data-i="' + i + '" style="left:' + (50 + Math.cos(a) * 38).toFixed(1) + '%;top:' + (50 + Math.sin(a) * 38).toFixed(1) + '%">' +
                    (I ? I.named(s.glyph, '#e2e8f0', 22) : '') + '<b>' + s.label + '</b><small data-count></small></div>';
            }).join('') + '<div class="hub"><b>QUICK</b><small>release to use</small></div></div>';
            document.body.appendChild(el);
            this.wheel = el;
        },

        /** Key down on the quick-heal key: start the hold timer. Returns true when handled. */
        keyPress() {
            if (this.keyDown) return true;
            this.keyDown = true;
            clearTimeout(this.holdTimer);
            this.holdTimer = setTimeout(() => { if (this.keyDown) this.openWheel(); }, HOLD_MS);
            return true;
        },

        /** Key up: a tap heals; a hold uses the chosen slice. */
        keyRelease() {
            if (!this.keyDown) return false;
            this.keyDown = false;
            clearTimeout(this.holdTimer);
            if (this.wheelOpen) { this.closeWheel(true); return true; }
            this.c?.deep?.useFlask();
            return true;
        },

        openWheel() {
            if (!this.mode?.active || !BO.Player.alive || BO.SurvivalUI?.open) return;
            this.wheelOpen = true;
            this.pick = -1;
            this.aim.x = this.aim.y = 0;
            this.refreshCounts();
            this.wheel.classList.remove('hidden');
            if (!BO.Net?.active) BO.State.timeScale = 0.5;
            BO.Sound?.playUIHover?.();
        },

        closeWheel(use) {
            if (!this.wheelOpen) return;
            this.wheelOpen = false;
            this.wheel?.classList.add('hidden');
            if (!BO.Net?.active && BO.State.timeScale === 0.5) BO.State.timeScale = 1;
            if (use && this.pick >= 0) this.useSlice(SLICES[this.pick].id);
        },

        mouseMove(e) {
            if (!this.wheelOpen) return;
            this.aim.x = BO.Math.clamp(this.aim.x + (e.movementX || 0), -120, 120);
            this.aim.y = BO.Math.clamp(this.aim.y + (e.movementY || 0), -120, 120);
            const d = Math.hypot(this.aim.x, this.aim.y);
            let pick = -1;
            if (d > 28) {
                const a = Math.atan2(this.aim.y, this.aim.x) + Math.PI / 2;
                pick = ((Math.round(a / (Math.PI * 2 / SLICES.length)) % SLICES.length) + SLICES.length) % SLICES.length;
            }
            if (pick !== this.pick) {
                this.pick = pick;
                this.wheel.querySelectorAll('.slice').forEach((s) => s.classList.toggle('on', Number(s.dataset.i) === pick));
                if (pick >= 0) BO.Sound?.playUIHover?.();
            }
        },

        bestFood() {
            const m = this.mode;
            const FOOD = BO.ZoneWild?.FOOD || {};
            const room = 100 - m.hunger;
            const have = Object.keys(FOOD).filter((id) => (m.points[id] || 0) > 0).map((id) => ({ id, f: FOOD[id].f, raw: !!FOOD[id].raw }));
            for (const id of ['rations', 'canned']) if ((m.points[id] || 0) > 0) have.push({ id, f: 55, raw: false });
            if (!have.length) return null;
            const cooked = have.filter((x) => !x.raw);
            const pool = cooked.length ? cooked : have;
            const fits = pool.filter((x) => x.f <= room + 10).sort((a, b) => b.f - a.f);
            return (fits[0] || pool.sort((a, b) => a.f - b.f)[0]).id;
        },

        refreshCounts() {
            const m = this.mode;
            const counts = {
                eat: this.bestFood() ? GM.itemName(this.bestFood()) : 'no food',
                heal: ['medkits', 'bandage', 'splint'].map((id) => m.points[id] || 0).reduce((a, b) => a + b, 0) + ' kits',
                drink: DRINKS.find((id) => (m.points[id] || 0) > 0) ? GM.itemName(DRINKS.find((id) => (m.points[id] || 0) > 0)) : 'nothing',
                torch: (m.points.torch || 0) + ' torches',
                campfire: m.canAfford({ timber: 2, stone: 3 }) ? 'place here' : '2 timber · 3 stone',
                stack: 'base storage',
                repair: (m.points.repair || 0) + ' kits',
                throw: BO.Player.lethalCount ? BO.Player.lethalCount + ' left' : 'equipped lethal'
            };
            this.wheel.querySelectorAll('.slice').forEach((s) => {
                const id = SLICES[Number(s.dataset.i)].id;
                s.querySelector('[data-count]').textContent = counts[id];
            });
        },

        useSlice(id) {
            const m = this.mode;
            const c = this.c;
            switch (id) {
                case 'eat': {
                    const f = this.bestFood();
                    if (!f) return GM.toast('Nothing to eat.');
                    if (m.hunger >= 99) return GM.toast('You are not hungry.');
                    return m.consume(f);
                }
                case 'heal': return c.deep?.useFlask();
                case 'drink': {
                    const d = DRINKS.find((x) => (m.points[x] || 0) > 0);
                    if (!d) return GM.toast('Nothing to drink. Draw water from a pump, barrel or purifier.');
                    return m.consume(d);
                }
                case 'torch': return c.pack.shortcut();
                case 'campfire': return c.build('campfire');
                case 'stack': return GM.get('storage')?.quickStack?.();
                case 'repair': return m.consume('repair');
                case 'throw': return BO.Combat?.throwLethal?.(false, true);
                default: return false;
            }
        },

        /* ------------------------------------------------------------ one tracker */
        patchTracker() {
            const K = BO.ZoneContracts;
            if (!K?.renderHud) return;
            const self = this;
            this._origRender = K.renderHud;
            K.renderHud = function () {
                self._origRender.call(this);
                self.trimTracker(this.hud);
            };
        },

        unpatchTracker() {
            if (this._origRender && BO.ZoneContracts) BO.ZoneContracts.renderHud = this._origRender;
            this._origRender = null;
        },

        trimTracker(hud) {
            if (!hud) return;
            const rows = [...hud.querySelectorAll('.zt-k')];
            rows.forEach((r, i) => { r.style.display = i < TRACK_ROWS ? '' : 'none'; });
            for (const h of hud.querySelectorAll('header')) {
                let n = h.nextElementSibling;
                let visible = false;
                while (n && n.tagName !== 'HEADER') { if (n.classList.contains('zt-k') && n.style.display !== 'none') visible = true; n = n.nextElementSibling; }
                h.style.display = visible ? '' : 'none';
            }
            let more = hud.querySelector('.gm-more');
            const hidden = Math.max(0, rows.length - TRACK_ROWS);
            if (hidden) {
                if (!more) { more = document.createElement('div'); more.className = 'gm-more'; hud.appendChild(more); }
                more.textContent = '+' + hidden + ' more in the Journal (' + BO.Settings.keyLabel(BO.Settings.getKeybinds().survJournal) + ')';
            } else if (more) more.remove();
        },

        update() {
            if (!this.mode) return;
            if (this.mode.clock >= this.nextWater) {
                this.nextWater = this.mode.clock + 1;
                this.autoWater();
            }
            if (this.wheelOpen && (!BO.Player.alive || BO.SurvivalUI?.open)) this.closeWheel(false);
        }
    };

    GM.register('baselife', BaseLife);
})(window.BO);
