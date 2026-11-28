/* ============================================================================
   BLACKOUT OPS — Survival 1.0: Weather fronts, hazards and the tension budget
   The fixed five-minute weather loop is gone. Every region rolls its own front
   every 12 in-game hours from a biome table, and fronts drift downwind into
   neighbouring regions. Your base radio forecasts the next front a half-day out.
     Clear · Overcast · Rain · Thunderstorm · Fog · Blizzard (alpine)
     Ash storm (cinder) · Heatwave (cinder/meadow)
   Weather changes the senses of everything — rain masks footsteps, fog and
   blizzards cut sight both ways — plus temperature, wetness, solar and wind
   output, and fire: lightning can set dry timber alight.
   Cinder Flats has lava fissures: they burn, and a body bag dropped in one is
   gone (unless you carry the fireproof hauler pack).
   Tension budget: severe fronts never roll on days 1–2, and storms and world
   events wait while a horde, the finale or a boss fight is under way.
============================================================================ */
(function (BO) {
    'use strict';
    const GM = BO.GM;

    const FRONTS = {
        Clear: { sight: 1, hear: 1, solar: 1, wind: 0.4, fr: 'Clearing' },
        Overcast: { sight: 1, hear: 1, solar: 0.55, wind: 0.6, fr: 'Overcast' },
        Rain: { sight: 0.85, hear: 0.6, solar: 0.35, wind: 0.8, fr: 'Rain', wet: true },
        Thunderstorm: { sight: 0.75, hear: 0.5, solar: 0.2, wind: 1.3, fr: 'Rain', wet: true, severe: true },
        Fog: { sight: 0.5, hear: 1, solar: 0.4, wind: 0.2, fr: 'Fog' },
        Blizzard: { sight: 0.4, hear: 0.7, solar: 0, wind: 1.4, fr: 'Blizzard', severe: true },
        Snow: { sight: 0.8, hear: 0.85, solar: 0.4, wind: 0.8, fr: 'Snow' },
        'Ash storm': { sight: 0.7, hear: 0.85, solar: 0.3, wind: 1.0, fr: 'Ash rain', severe: true },
        Heatwave: { sight: 1, hear: 1, solar: 1.15, wind: 0.3, fr: 'Clearing', severe: true, hot: true }
    };
    const TABLE = {
        meadow: [['Clear', 4], ['Overcast', 3], ['Rain', 2], ['Thunderstorm', 1], ['Fog', 1], ['Heatwave', 0.6]],
        town: [['Clear', 3], ['Overcast', 3], ['Rain', 2], ['Fog', 1.5], ['Thunderstorm', 1]],
        forest: [['Overcast', 3], ['Clear', 2], ['Rain', 3], ['Fog', 2], ['Thunderstorm', 1]],
        industrial: [['Overcast', 4], ['Clear', 2], ['Rain', 2], ['Fog', 1.5], ['Thunderstorm', 1]],
        wetland: [['Rain', 4], ['Fog', 3], ['Overcast', 2], ['Thunderstorm', 1.2], ['Clear', 1]],
        alpine: [['Snow', 4], ['Clear', 2], ['Blizzard', 2], ['Fog', 1]],
        ash: [['Ash storm', 3], ['Heatwave', 3], ['Overcast', 2], ['Clear', 1]],
        campus: [['Overcast', 3], ['Fog', 2], ['Rain', 2], ['Clear', 2], ['Thunderstorm', 1]],
        crater: [['Fog', 3], ['Overcast', 3], ['Ash storm', 1], ['Thunderstorm', 1]]
    };
    const HALF_DAY = 12;

    const Weather = {
        FRONTS, // read by gm/GMDev.js
        rate: 4,

        start(mode, saved) {
            this.mode = mode;
            this.fronts = { ...(saved?.fronts || {}) };
            this.next = { ...(saved?.next || {}) };
            this.rollAt = saved?.rollAt ?? null;
            this.boltAt = 0;
            this.fissures = [];
            this.patch();
            if (this.rollAt === null) this.rollAll(true);
            this.buildFissures();
        },

        stop() {
            this.unpatch();
            for (const f of this.fissures) f.mesh?.removeFromParent();
            this.fissures = [];
            this.mode = null;
        },

        snapshot() { return { fronts: this.fronts, next: this.next, rollAt: this.rollAt }; },

        regions() { return BO.Zone.regions || BO.Zone.REGIONS || []; },

        rand() { return Math.random(); },

        pick(biome, allowSevere) {
            const table = (TABLE[biome] || TABLE.meadow).filter(([f]) => allowSevere || !FRONTS[f].severe);
            const total = table.reduce((t, [, w]) => t + w, 0);
            let r = this.rand() * total;
            for (const [f, w] of table) { r -= w; if (r <= 0) return f; }
            return table[0][0];
        },

        rollAll(initial = false) {
            const c = this.mode.campaign;
            const severeOk = c.day >= 3;
            const regs = this.regions();
            const prev = { ...this.fronts };
            for (const r of regs) {
                if (!initial && this.next[r.id]) { this.fronts[r.id] = this.next[r.id]; continue; }
                this.fronts[r.id] = this.pick(r.biome, severeOk && !initial);
            }
            // Drift: some regions inherit the upwind neighbour's front (if their biome allows it).
            for (const r of regs) {
                const up = regs.filter((o) => o !== r && Math.hypot(o.x - r.x, o.z - r.z) < (o.r + r.r) * 1.3 && o.x < r.x);
                if (up.length && this.rand() < 0.35) {
                    const f = prev[up[0].id];
                    if (f && (TABLE[r.biome] || TABLE.meadow).some(([n]) => n === f)) this.fronts[r.id] = f;
                }
            }
            for (const r of regs) this.next[r.id] = this.pick(r.biome, c.day + 0.5 >= 3);
            this.rollAt = c.totalHours + HALF_DAY;
        },

        here() {
            const p = BO.Player.pos;
            const r = BO.Zone.regionAt(p.x, p.z);
            const c = this.mode.campaign;
            if (!c.options.weather || c.has('sv_no_weather')) return 'Clear';
            let f = this.fronts[r.id] || 'Overcast';
            if (c.has('sv_no_rain') && FRONTS[f].wet) f = 'Overcast';
            if (c.has('sv_no_sun') && f === 'Clear') f = 'Overcast';
            return f;
        },
        spec() { return FRONTS[this.here()] || FRONTS.Overcast; },

        /** Name SurvivalMode uses for its global fog/colour logic. */
        globalName() {
            if (!this.mode) return null;
            const f = this.here();
            if (BO.ZoneEvents?.events?.some?.((e) => e.kind === 'surge')) return 'Rad fog';
            return f === 'Ash storm' ? 'Ash rain' : f;
        },

        senseMult() {
            const s = this.spec();
            const night = this.mode.campaign.isNight;
            return { sight: s.sight * (night && s.sight < 1 ? 0.9 : 1), hear: s.hear };
        },
        solarFactor() { return this.spec().solar; },
        windFactor() {
            const p = BO.Player.pos;
            const alpine = BO.Zone.regionAt(p.x, p.z).biome === 'alpine';
            return this.spec().wind * (alpine ? 1.5 : 1);
        },
        raining() { return !!this.spec().wet; },

        /* ---------------------------------------------------------- patches */
        patch() {
            const FR = BO.ZoneFrontier, E = BO.ZoneEvents;
            const self = this;
            this._orig = { localize: FR?.localize, fogExtra: FR?.fogExtra, ambient: FR?.ambient, trigger: E?.trigger };
            if (FR && this._orig.localize) {
                FR.localize = function (global) {
                    const f = self.here();
                    const biome = this.biome();
                    if (f === 'Ash storm' || biome === 'ash') return 'Ash fall';
                    if (f === 'Thunderstorm') return 'Rain';
                    return FRONTS[f]?.fr === 'Clearing' ? 'Clear' : (FRONTS[f]?.fr || global);
                };
                FR.fogExtra = function () {
                    const base = self._orig.fogExtra.call(this);
                    const f = self.here();
                    return base + (f === 'Fog' ? 0.014 : f === 'Thunderstorm' ? 0.004 : 0);
                };
                FR.ambient = function () {
                    return self._orig.ambient.call(this) + (self.here() === 'Heatwave' && !this.sheltered() ? 11 : 0) + (GM.get('gear')?.tempBonus?.() || 0);
                };
            }
            if (E && this._orig.trigger) {
                E.trigger = function (kind) {
                    if (GM.get('threat')?.busy?.()) { this.nextAt = (self.mode?.clock || 0) + 60; return null; }
                    return self._orig.trigger.call(this, kind);
                };
            }
        },

        unpatch() {
            if (!this._orig) return;
            const FR = BO.ZoneFrontier, E = BO.ZoneEvents;
            if (FR && this._orig.localize) { FR.localize = this._orig.localize; FR.fogExtra = this._orig.fogExtra; FR.ambient = this._orig.ambient; }
            if (E && this._orig.trigger) E.trigger = this._orig.trigger;
            this._orig = null;
        },

        /* ---------------------------------------------------------- lava */
        buildFissures() {
            const m = this.mode;
            const cinder = this.regions().find((r) => r.biome === 'ash');
            if (!cinder) return;
            const seed = String(m.seed || 'ZONE');
            let h = 2166136261;
            for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
            const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
            const nav = BO.World.nav;
            for (let tries = 0; tries < 80 && this.fissures.length < 11; tries++) {
                const a = rnd() * Math.PI * 2, r = 8 + rnd() * cinder.r * 0.8;
                const x = cinder.x + Math.cos(a) * r, z = cinder.z + Math.sin(a) * r;
                const j = nav?.idx(x, z) ?? -1;
                if (j < 0 || !nav.walk[j]) continue;
                if (BO.Zone.pois?.some((p) => Math.abs(p.x - x) < (p.w || 8) / 2 + 3 && Math.abs(p.z - z) < (p.d || 8) / 2 + 3)) continue;
                const rad = 1.8 + rnd() * 1.8;
                const y = BO.World.terrainHeight(x, z) + 0.06;
                const mesh = m.mesh(new THREE.CircleGeometry(rad, 18), 0xff5a1f, x, y, z, { emissive: 0xff3d00, emissiveIntensity: 1.1, roughness: 0.4 });
                mesh.rotation.x = -Math.PI / 2;
                this.fissures.push({ x, z, r: rad, mesh });
            }
        },

        destroysItemsAt(pos) { return this.fissures.some((f) => Math.hypot(f.x - pos.x, f.z - pos.z) < f.r + 0.4); },

        updateLava(dt) {
            const m = this.mode;
            const p = BO.Player;
            for (const f of this.fissures) {
                if (f.mesh) f.mesh.material.emissiveIntensity = 0.9 + Math.sin(m.clock * 3 + f.x) * 0.25;
                if (!p.alive) continue;
                const d = Math.hypot(f.x - p.pos.x, f.z - p.pos.z);
                if (d < f.r && p.pos.y < BO.World.terrainHeight(f.x, f.z) + 1) {
                    if (!GM.get('gear')?.hasThermalRig?.()) p.takeDamage(28 * dt);
                    if (Math.random() < dt * 3) BO.FX?.spawnParticles?.(p.pos.clone(), 4, 0xff6a00, 3, 4, 0.3);
                    if (!this._lavaWarn || this._lavaWarn < m.clock) { this._lavaWarn = m.clock + 8; GM.toast('LAVA! Die here and your gear burns with you.', '#ff5a1f'); }
                } else if (d < f.r + 6 && (!this._nearWarn || this._nearWarn < m.clock)) {
                    this._nearWarn = m.clock + 30;
                    GM.toast('Lava fissures ahead. Watch your step.', '#ff8a4c');
                }
                for (const z of m.zombies) if (z.alive && Math.hypot(f.x - z.pos.x, f.z - z.pos.z) < f.r) m.hit(z, 30 * dt, 'torso', null, 'fire', { team: 0 });
            }
        },

        /* ---------------------------------------------------------- storms */
        updateStorm(dt) {
            const m = this.mode;
            const f = this.here();
            if (f !== 'Thunderstorm') return;
            if (m.clock < this.boltAt) return;
            this.boltAt = m.clock + 14 + Math.random() * 22;
            const p = BO.Player.pos;
            const a = Math.random() * Math.PI * 2, r = 15 + Math.random() * 55;
            const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
            const y = GM.ground(x, z);
            if (m.weatherHemi) { const base = m.weatherHemi.intensity; m.weatherHemi.intensity = 3.2; setTimeout(() => { if (m.weatherHemi) m.weatherHemi.intensity = base; }, 110); }
            BO.FX?.spawnTracer?.(new THREE.Vector3(x, y + 60, z), new THREE.Vector3(x, y, z), 0xe0f2fe);
            setTimeout(() => { BO.Sound?.playExplosion?.(Math.min(1, 25 / Math.max(10, r))); }, r * 6);
            BO.ZoneDirector.noise(x, z, 30, 'thunder');
            // Lightning finds timber.
            const c = m.campaign;
            const hit = c.placed.find((pc) => pc.alive && pc.part && pc.part.material === 'wood' && Math.hypot(pc.x - x, pc.z - z) < 6);
            if (hit) { m.ignite(new THREE.Vector3(hit.x, hit.y, hit.z)); GM.toast('Lightning struck your base — fire!', '#fbbf24'); }
            else if (Math.random() < 0.3) m.ignite(new THREE.Vector3(x, y, z));
        },

        /* ---------------------------------------------------------- update */
        update(dt) {
            const m = this.mode;
            const c = m.campaign;
            if (c.totalHours >= this.rollAt) {
                if (GM.get('threat')?.busy?.()) this.rollAt = c.totalHours + 1;
                else {
                    const before = this.here();
                    this.rollAll();
                    const now = this.here();
                    if (now !== before) GM.toast('The weather turns: ' + now + '.', '#bae6fd');
                }
            }
            this.updateLava(dt);
            this.updateStorm(dt);
            // Status effects from climate.
            const FR = BO.ZoneFrontier;
            const deep = c.deep;
            if ((FR?.wet || 0) > 30) GM.setStatus('wet', { until: m.clock + 0.6 });
            const t = deep?.temp ?? 20;
            if (t < -3) GM.setStatus('freezing', { until: m.clock + 0.6 });
            else if (t < 2) GM.setStatus('cold', { until: m.clock + 0.6 });
            else if (t > 31) GM.setStatus('hot', { until: m.clock + 0.6 });
            if (FR?.sheltered?.()) GM.setStatus('sheltered', { until: m.clock + 0.6 });
            if (this.here() === 'Heatwave' && deep && !FR?.sheltered?.()) deep.hydration = Math.max(0, deep.hydration - dt * 0.06);
        },

        forecast() {
            const p = BO.Player.pos;
            const r = BO.Zone.regionAt(p.x, p.z);
            return { now: this.here(), next: this.next[r.id] || '—', inHours: Math.max(0, Math.ceil(this.rollAt - this.mode.campaign.totalHours)) };
        },

        baseCards(ui) {
            const esc = GM.esc;
            const f = this.forecast();
            const hasRadio = !!GM.get('base')?.homePoint?.();
            const rows = this.regions().map((r) => `<li><span>${esc(r.name)}</span><em>${esc(this.fronts[r.id] || '—')}${hasRadio ? ' → ' + esc(this.next[r.id] || '—') : ''}</em></li>`).join('');
            const s = FRONTS[f.now] || FRONTS.Overcast;
            const effects = [s.hear < 1 && 'footsteps masked', s.sight < 1 && 'sight cut', s.wet && 'soaking', s.solar < 0.5 && 'weak solar', s.hot && 'dehydrating', f.now === 'Thunderstorm' && 'lightning'].filter(Boolean).join(' · ');
            return [ui.section('Weather & forecast', `<p><b>${esc(f.now)}</b> here${effects ? ' · ' + esc(effects) : ''}. ${hasRadio ? 'Next: <b>' + esc(f.next) + '</b> in ~' + f.inHours + ' h.' : 'Build a workbench (base radio) to see the forecast.'}</p><ul class="gm-list">${rows}</ul>`)];
        },

        hudChips() {
            const f = this.here();
            return FRONTS[f]?.severe ? [{ text: f, cls: 'warn' }] : [];
        }
    };

    GM.register('weather', Weather);
})(window.BO);
