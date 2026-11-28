/* ============================================================================
   BLACKOUT OPS — Survival Dev Mode (BO.GM 'dev')
   A testing toolkit for Survival. Switch it on with the DEV MODE button on the
   Survival deployment screen (it stays on until you switch it off), then press
   F8 (or `) in a run to open the Dev panel. Dev runs show a DEV chip.

   PLAYER    god mode, creative flight (Space up / Ctrl down), noclip, speed ×1–10,
             infinite ammo, no needs, invisible to enemies, heal, levels, skills
   WORLD     set the hour, freeze or speed time, dawn/dusk/next day, weather for
             every region, start/end a horde night, blood moon, pause spawns,
             kill all hostiles, clear animals, reveal the whole map
   ITEMS     every item (+1/+10/+100/clear), resource and food bundles, every
             weapon and tool, plates, clear backpack, no weight limit
   UNLOCKS   free build & craft at any station ignoring research, reveal/hide
             every recipe and blueprint, all tech on/off, catalogue all/reset,
             First Night done/reset, own every vehicle, live rule toggles
             (every Survival modifier on/off mid-run)
   SPAWN     any infected type ×1/×5 at the crosshair, any animal, any vehicle
   TELEPORT  regions, landmarks, Haven, the Lantern, Sites of Grace, infested
             sites, dungeons, boss lairs, contacts, your bed, the crosshair,
             saved spots, and click-the-map teleport
   MISSIONS  every story step, quest, contract, infested site, dungeon,
             legendary hunt, final boss, world event, horde and the finale,
             each with Teleport · Start · End/Complete · Restart
   INSPECT   look at a structure, enemy or animal: read and edit its health,
             heal, kill, delete, duplicate, nudge or rotate it
   DEBUG     FPS, draw calls, position, region and biome, entity counts, hide
             HUD for screenshots, copy position, force-save
============================================================================ */
(function (BO) {
    'use strict';
    const GM = BO.GM;
    const KEY = 'bo_survival_dev';
    const SPOTS_KEY = 'bo_survival_dev_spots';
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const TABS = [['player', 'Player'], ['world', 'World'], ['items', 'Items'], ['unlock', 'Unlocks'], ['spawn', 'Spawn'], ['teleport', 'Teleport'], ['missions', 'Missions'], ['inspect', 'Inspect'], ['debug', 'Debug']];

    const Dev = {
        rate: 20,
        get enabled() { try { return localStorage.getItem(KEY) === '1'; } catch (_) { return false; } },
        setEnabled(on) { try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (_) { /* private mode */ } },

        /* ------------------------------------------------ lifecycle */
        start(mode) {
            this.mode = mode;
            this.active = this.enabled;
            if (!this.active) return;
            this.flags = { god: false, fly: false, noclip: false, infAmmo: false, noNeeds: false, invisible: false, freeBuild: false, spawnsOff: false, freezeTime: false, mapTeleport: true, noWeight: false, hideHud: false };
            this.speed = 1;
            this.timeScale = 1;
            this.forced = new Set();
            this.tab = 'player';
            this.q = '';
            this.sel = null;
            this.patch();
            this.buildPanel();
            this.onKey = (e) => {
                if (e.code === 'Escape' && this.open) { e.preventDefault(); e.stopImmediatePropagation(); this.toggle(false); return; }
                if (e.code !== 'F8' && e.code !== 'Backquote') return;
                const t = e.target;
                if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') && e.code === 'Backquote') return;
                if (BO.State.screen !== 'playing' || !this.mode?.active) return;
                e.preventDefault();
                e.stopImmediatePropagation();
                this.toggle();
            };
            window.addEventListener('keydown', this.onKey, true);
            document.body.classList.add('gm-dev-on');
            setTimeout(() => GM.toast?.('DEV MODE · press F8 for the Dev panel', '#a78bfa'), 1500);
        },

        stop() {
            if (this.onKey) window.removeEventListener('keydown', this.onKey, true);
            this.onKey = null;
            this.unpatch();
            this.panel?.remove();
            this.panel = null;
            this.overlay?.remove();
            this.overlay = null;
            document.body.classList.remove('gm-dev-on', 'gm-dev-hidehud');
            this.active = false;
            this.mode = null;
        },

        /* ------------------------------------------------ patches */
        patch() {
            const self = this;
            const m = this.mode;
            const c = m.campaign;
            const deep = c.deep;
            const ch = BO.Cheats;
            this._orig = { has: c.has, canAfford: m.canAfford, spend: m.spend, station: c.stationAvailable, hasTech: deep?.hasTech, cheat: ch?.isActive };
            c.has = function (k) {
                if (self.forced.has(k)) return true;
                if (k === 'sv_god_mode' && self.flags.god) return true;
                if (k === 'sv_passive_enemies' && self.flags.invisible) return true;
                return self._orig.has.call(this, k);
            };
            m.canAfford = function (cost) { return self.flags.freeBuild || self._orig.canAfford.call(this, cost); };
            m.spend = function (cost) { return self.flags.freeBuild ? true : self._orig.spend.call(this, cost); };
            if (this._orig.station) c.stationAvailable = function (st) { return self.flags.freeBuild || self._orig.station.call(this, st); };
            if (deep && this._orig.hasTech) deep.hasTech = function (id) { return self.flags.freeBuild || self._orig.hasTech.call(this, id); };
            // pack.limits is a getter on the class: shadow it on this pack for "No weight limit".
            let proto = Object.getPrototypeOf(c.pack), desc = null;
            while (proto && !(desc = Object.getOwnPropertyDescriptor(proto, 'limits'))) proto = Object.getPrototypeOf(proto);
            if (desc?.get) {
                Object.defineProperty(c.pack, 'limits', { configurable: true, get() { const base = desc.get.call(this); return self.flags.noWeight ? { ...base, weight: 99999, slots: 999 } : base; } });
                this._limitsShadow = true;
            }
            if (ch && this._orig.cheat) {
                ch.isActive = function (code, raw) {
                    if (BO.State.activeMode === 'survival' && self.active) {
                        if (code === 'fly') return self.flags.fly || self.flags.noclip;
                        if (code === 'noclip') return self.flags.noclip;
                        if (code === 'infammo') return self.flags.infAmmo;
                    }
                    return self._orig.cheat.call(this, code, raw);
                };
            }
        },

        unpatch() {
            const o = this._orig;
            const m = this.mode;
            if (!o || !m) return;
            const c = m.campaign;
            c.has = o.has;
            m.canAfford = o.canAfford;
            m.spend = o.spend;
            if (o.station) c.stationAvailable = o.station;
            if (c.deep && o.hasTech) c.deep.hasTech = o.hasTech;
            if (BO.Cheats && o.cheat) BO.Cheats.isActive = o.cheat;
            if (this._limitsShadow) { delete c.pack.limits; this._limitsShadow = false; }
            this._orig = null;
        },

        canSpawnAt() { return !(this.active && this.flags.spawnsOff); },
        speedMult() { return this.active ? this.speed : 1; },
        hudChips() { return this.active ? [{ text: 'DEV · F8', cls: 'warn' }] : []; },

        /** Map click (SurvivalUI) teleports when enabled. */
        mapClick(x, z) {
            if (!this.active || !this.flags.mapTeleport) return false;
            BO.SurvivalUI?.close?.();
            this.tp(x, z);
            return true;
        },

        /* ------------------------------------------------ helpers */
        get c() { return this.mode.campaign; },
        P() { return BO.Player; },
        ground(x, z) {
            const t = BO.World.terrainHeight ? BO.World.terrainHeight(x, z) : 0;
            const g = BO.World.getGroundHeight(x, z, t + 60);
            return Math.max(t, Number.isFinite(g) ? g : t);
        },
        tp(x, z, y) {
            if (!Number.isFinite(x) || !Number.isFinite(z)) return;
            if (BO.ZoneDungeons?.inside && Math.abs(x) < 1000) BO.ZoneDungeons.leave(true);
            const p = this.P();
            const yy = Number.isFinite(y) ? y : this.ground(x, z) + 0.3;
            p.pos.set(x, yy, z);
            p.vel?.set?.(0, 0, 0);
            this.mode.refreshTargets?.();
            GM.toast?.('Teleported to ' + Math.round(x) + ', ' + Math.round(z), '#a78bfa');
        },
        forward() {
            const p = this.P();
            const cp = Math.cos(p.pitch || 0);
            return { x: -Math.sin(p.yaw) * cp, y: Math.sin(p.pitch || 0), z: -Math.cos(p.yaw) * cp };
        },
        /** Where the crosshair meets the ground (or 40 m ahead). */
        crosshair(max = 140) {
            const p = this.P();
            const f = this.forward();
            const eye = { x: p.pos.x, y: p.pos.y + (p.eyeHeight || 1.6), z: p.pos.z };
            for (let d = 1; d < max; d += 0.75) {
                const x = eye.x + f.x * d, y = eye.y + f.y * d, z = eye.z + f.z * d;
                if (y <= this.ground(x, z) + 0.05) return { x, z, y: this.ground(x, z) };
            }
            const x = eye.x + f.x * 40, z = eye.z + f.z * 40;
            return { x, z, y: this.ground(x, z) };
        },
        nearRegion() { const p = this.P().pos; return BO.Zone.regionAt(p.x, p.z); },
        grant(items) { this.mode.grant(items); },
        say(msg) { GM.toast?.(msg, '#a78bfa'); },

        /* ------------------------------------------------ panel */
        buildPanel() {
            const el = document.createElement('div');
            el.id = 'gm-dev';
            el.className = 'gm-dev hidden';
            el.addEventListener('click', (e) => this.onClick(e));
            el.addEventListener('input', (e) => this.onInput(e));
            el.addEventListener('change', (e) => this.onInput(e, true));
            el.addEventListener('keydown', (e) => { if (e.code === 'Escape') { e.stopPropagation(); this.toggle(false); } });
            document.body.appendChild(el);
            this.panel = el;
            const ov = document.createElement('div');
            ov.id = 'gm-dev-overlay';
            ov.className = 'gm-dev-overlay hidden';
            document.body.appendChild(ov);
            this.overlay = ov;
        },

        get open() { return !!this.panel && !this.panel.classList.contains('hidden'); },

        toggle(force) {
            if (!this.panel) return;
            const show = force ?? !this.open;
            this.panel.classList.toggle('hidden', !show);
            if (show) {
                if (document.pointerLockElement) document.exitPointerLock();
                this.render();
            } else if (BO.State.screen === 'playing' && !BO.SurvivalUI?.open) BO.App?._safePointerLock?.();
        },

        render() {
            if (!this.panel || !this.open) return;
            const body = this['tab_' + this.tab]?.() || '';
            const scroll = this.panel.querySelector('.dev-body')?.scrollTop || 0;
            this.panel.innerHTML = `<header class="dev-head"><b>DEV MODE</b><span>Survival test kit · F8 toggles · Esc closes</span><button class="dev-x" data-dev="close" title="Close (F8)">✕</button></header>
                <nav class="dev-tabs">${TABS.map(([id, label]) => `<button class="${this.tab === id ? 'on' : ''}" data-dev="tab" data-arg="${id}">${label}</button>`).join('')}</nav>
                <div class="dev-body">${body}</div>
                <footer class="dev-foot"><span>Position ${this.posText()}</span><button data-dev="disable" title="Turn Dev Mode off for future runs">Turn Dev Mode off</button></footer>`;
            const b = this.panel.querySelector('.dev-body');
            if (b && this._keepScroll) b.scrollTop = scroll;
            this._keepScroll = true;
            const s = this.panel.querySelector('[data-dev-search]');
            if (s && this._focusSearch) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); this._focusSearch = false; }
        },

        posText() { const p = this.P().pos; return Math.round(p.x) + ', ' + Math.round(p.y) + ', ' + Math.round(p.z); },

        tog(flag, label, sub) {
            return `<label class="dev-tog"><input type="checkbox" data-dev-flag="${flag}" ${this.flags[flag] ? 'checked' : ''}><i></i><span><b>${esc(label)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span></label>`;
        },
        btn(cmd, label, arg = '', cls = '') { return `<button class="dev-b ${cls}" data-dev="${cmd}" data-arg="${esc(arg)}">${esc(label)}</button>`; },
        sec(title, inner) { return `<section class="dev-sec"><h4>${esc(title)}</h4>${inner}</section>`; },
        search(ph) { return `<input class="dev-search" data-dev-search type="search" placeholder="${esc(ph)}" value="${esc(this.q)}" autocomplete="off" spellcheck="false">`; },
        match(...xs) { const q = this.q.trim().toLowerCase(); return !q || xs.some((x) => String(x || '').toLowerCase().includes(q)); },

        /* ------------------------------------------------ tabs */
        tab_player() {
            const p = this.P();
            const T = BO.ZoneThrill;
            return this.sec('Abilities', `<div class="dev-grid2">
                    ${this.tog('god', 'God mode', 'No damage, no death')}
                    ${this.tog('fly', 'Creative flight', 'Space up · Ctrl/C down')}
                    ${this.tog('noclip', 'Noclip', 'Fly through walls and ground')}
                    ${this.tog('infAmmo', 'Infinite ammo', 'Full magazine and reserve')}
                    ${this.tog('noNeeds', 'No needs', 'Food, water, warmth, bleeding')}
                    ${this.tog('invisible', 'Invisible', 'Enemies stay passive')}
                    ${this.tog('noWeight', 'No weight limit', 'Carry anything')}
                </div>
                <label class="dev-range"><span>Move speed <b>${this.speed}×</b></span><input type="range" min="1" max="10" step="1" value="${this.speed}" data-dev-range="speed"></label>`) +
                this.sec('Vitals', `<div class="dev-row">${this.btn('heal', 'Full heal & cure')}${this.btn('hp', 'Max HP +50', '50')}${this.btn('hp', 'Max HP reset', '0')}${this.btn('kill', 'Kill me (test death)', '', 'warn')}</div>
                    <p class="dev-note">HP ${Math.ceil(p.hp)} / ${p.maxHp} · food ${Math.round(this.mode.hunger)} · water ${Math.round(this.c.deep?.hydration ?? 100)} · temp ${Math.round(this.c.deep?.temp ?? 20)} °C</p>`) +
                this.sec('Level & skills', `<p class="dev-note">Level ${T?.level || 1} · ${T?.pending || 0} skill points to spend</p>
                    <div class="dev-row">${this.btn('lvl', '+1 level', '1')}${this.btn('lvl', '+5 levels', '5')}${this.btn('lvl', '+20 levels', '20')}${this.btn('sp', '+10 skill points', '10')}</div>
                    <div class="dev-row">${this.btn('skillsMax', 'Max every skill')}${this.btn('skillsReset', 'Reset skills (refund points)')}${this.btn('openSkills', 'Open Skills tab')}</div>`);
        },

        tab_world() {
            const c = this.c;
            const W = GM.get('weather');
            const fronts = W ? Object.keys(W.FRONTS || {}) : [];
            const H = BO.ZoneHorde;
            return this.sec('Time', `<label class="dev-range"><span>Hour <b>${c.clockFace || c.hour.toFixed(1)}</b> · day ${c.day}</span><input type="range" min="0" max="23.75" step="0.25" value="${c.hour.toFixed(2)}" data-dev-range="hour"></label>
                    <label class="dev-range"><span>Time speed <b>${this.timeScale}×</b></span><input type="range" min="1" max="60" step="1" value="${this.timeScale}" data-dev-range="timeScale"></label>
                    <div class="dev-grid2">${this.tog('freezeTime', 'Freeze time', 'The clock stops')}</div>
                    <div class="dev-row">${this.btn('hourTo', 'Dawn 06:00', '6')}${this.btn('hourTo', 'Noon', '12')}${this.btn('hourTo', 'Dusk 18:00', '18')}${this.btn('hourTo', 'Midnight', '0')}${this.btn('nextDay', 'Next day')}</div>`) +
                this.sec('Weather', fronts.length ? `<div class="dev-row">${fronts.map((f) => this.btn('weather', f, f)).join('')}</div><p class="dev-note">Applies to every region now. Here: ${esc(W.here?.()?.name || W.globalName?.() || '')}</p>` : '<p class="dev-note">Weather system not running.</p>') +
                this.sec('Threats', `<div class="dev-row">${this.btn('horde', H?.active ? 'End horde night' : 'Start horde night now', H?.active ? 'end' : 'start', H?.active ? 'warn' : '')}${this.btn('bloodmoon', c.deep?.bloodMoonActive ? 'End blood moon' : 'Start blood moon')}${this.btn('killAll', 'Kill all hostiles', '', 'warn')}${this.btn('clearAnimals', 'Clear animals')}</div>
                    <div class="dev-grid2">${this.tog('spawnsOff', 'Pause roaming spawns', 'Nothing new spawns')}</div>
                    <p class="dev-note">Hostiles alive: ${this.mode.zombies.filter((z) => z.alive).length + (this.mode.bots || []).filter((b) => b.alive).length} · next horde night: ${H?.nextHordeNight?.() ?? '—'}</p>`) +
                this.sec('Map', `<div class="dev-row">${this.btn('revealMap', 'Reveal the whole map')}${this.btn('openMap', 'Open the map')}</div><div class="dev-grid2">${this.tog('mapTeleport', 'Click the map to teleport', 'In the Map tab')}</div>`);
        },

        tab_items() {
            const F = BO.SurvivalFrontierData;
            const pts = this.mode.points;
            const items = Object.entries(F.items).filter(([id, [name, cat]]) => this.match(id, name, cat)).sort((a, b) => a[1][1].localeCompare(b[1][1]) || a[1][0].localeCompare(b[1][0]));
            const rows = items.slice(0, 160).map(([id, [name, cat]]) => `<div class="dev-item"><span class="ico">${BO.SurvivalIcons?.item?.(id, 18) || ''}</span><span class="nm"><b>${esc(name)}</b><small>${esc(cat)} · have ${Math.floor(pts[id] || 0)}</small></span>
                <span class="acts">${this.btn('give', '+1', id + '|1')}${this.btn('give', '+10', id + '|10')}${this.btn('give', '+100', id + '|100')}${this.btn('give', '0', id + '|0', 'ghost')}</span></div>`).join('');
            const weapons = (BO.WeaponsData?.listAll?.() || Object.values(BO.WeaponsData?.WEAPONS || {})).filter((w) => w && w.id && this.match(w.id, w.name, w.kind)).slice(0, 80);
            return this.sec('Bundles', `<div class="dev-row">${this.btn('bundle', 'All raw materials ×50', 'raw')}${this.btn('bundle', 'All components ×30', 'comp')}${this.btn('bundle', 'Food & water ×20', 'food')}${this.btn('bundle', 'Medical ×20', 'med')}${this.btn('bundle', 'Ammo ×300', 'ammo')}${this.btn('tools', 'Every tool')}${this.btn('bundle', 'Plates ×3 each', 'plates')}${this.btn('clearPack', 'Clear backpack', '', 'warn')}</div>`) +
                this.sec('Find', this.search('Search items and weapons…')) +
                this.sec('Items (' + items.length + ')', `<div class="dev-list">${rows || '<p class="dev-note">No match.</p>'}</div>${items.length > 160 ? '<p class="dev-note">Showing 160 — search to narrow.</p>' : ''}`) +
                this.sec('Weapons (' + weapons.length + ')', `<div class="dev-row">${weapons.map((w) => this.btn('weapon', w.shortName || w.name, w.id)).join('') || '<p class="dev-note">No match.</p>'}</div>`);
        },

        tab_unlock() {
            const deep = this.c.deep;
            const rules = BO.SurvivalRules?.modifiers || {};
            const mods = Object.entries(rules).filter(([k, v]) => this.match(k, v.name, v.description || v.desc)).slice(0, 120);
            return this.sec('Build & craft', `<div class="dev-grid2">${this.tog('freeBuild', 'Free build & craft', 'No costs · any station · ignore research')}</div>
                    <div class="dev-row">${this.btn('reveal', 'Reveal every recipe & blueprint', 'on')}${this.btn('reveal', 'Hide undiscovered again', 'off')}</div>`) +
                this.sec('Progress', `<div class="dev-row">${this.btn('tech', 'Unlock all tech', 'on')}${this.btn('tech', 'Lock all tech', 'off')}${this.btn('tp', '+10 Tech Points', '10')}</div>
                    <div class="dev-row">${this.btn('catalogue', 'Discover whole catalogue', 'on')}${this.btn('catalogue', 'Reset catalogue', 'off')}</div>
                    <div class="dev-row">${this.btn('firstNight', 'Complete First Night', 'on')}${this.btn('firstNight', 'Reset First Night', 'off')}${this.btn('vehicles', 'Own every vehicle')}</div>
                    <p class="dev-note">Tech points ${deep?.techPoints ?? 0} · ${deep?.unlockedTech?.size ?? 0} researched</p>`) +
                this.sec('Live rules (modifiers)', this.search('Search rules…') + `<div class="dev-list">${mods.map(([k, v]) => {
                    const on = this.forced.has(k) || this._orig.has.call(this.c, k);
                    return `<label class="dev-tog sm"><input type="checkbox" data-dev-rule="${esc(k)}" ${on ? 'checked' : ''}><i></i><span><b>${esc(v.name || k)}</b><small>${esc((v.description || v.desc || '').slice(0, 110))}</small></span></label>`;
                }).join('')}</div><p class="dev-note">Rules switched on here apply instantly to checks made during play. Rules the run baked in at start stay as they are.</p>`);
        },

        tab_spawn() {
            const types = (BO.Zone?.bestiary?.() || []).filter((t) => this.match(t.id, t.name));
            const species = Object.entries(BO.ZoneWild?.SPECIES || {});
            const veh = (BO.SurvivalCampaignData?.vehicles || []);
            return this.sec('Find', this.search('Search enemies, animals, vehicles…')) +
                this.sec('Infected (at the crosshair)', `<div class="dev-row">${types.map((t) => this.btn('spawnZ', t.name || t.id, t.id + '|1')).join('') || '<p class="dev-note">No match.</p>'}</div>
                    <div class="dev-row">${this.btn('spawnZ', 'Random ×5', '|5')}${this.btn('spawnZ', 'Random ×20', '|20', 'warn')}${this.btn('spawnBot', 'PMC soldier')}</div>`) +
                this.sec('Animals (nearby)', `<div class="dev-row">${species.filter(([k, s]) => this.match(k, s.name)).map(([k, s]) => this.btn('spawnA', s.name, k)).join('')}</div>`) +
                this.sec('Vehicles (beside you)', `<div class="dev-row">${veh.filter((v) => this.match(v.id, v.name)).map((v) => this.btn('spawnV', v.name, v.id)).join('')}</div>`);
        },

        tab_teleport() {
            const Z = BO.Zone;
            const c = this.c;
            const groups = [];
            const add = (g, name, x, z, sub) => { if (Number.isFinite(x) && Number.isFinite(z) && this.match(name, sub, g)) groups.push({ g, name, x, z, sub }); };
            if (Z?.HAVEN) add('Key places', 'Haven', Z.HAVEN.x, Z.HAVEN.z, 'Survivor settlement');
            if (Z?.LANTERN) add('Key places', 'The Lantern', Z.LANTERN.x, Z.LANTERN.z, 'Story finale');
            const bed = c.placed.find((p) => p.alive && p.type === 'bed') || c.placed.find((p) => p.alive && p.type === 'bench');
            if (bed) add('Key places', 'My base', bed.x, bed.z, bed.type);
            for (const r of Z?.REGIONS || []) add('Regions', r.name, r.x, r.z, r.biome + ' · threat ' + (r.threat ?? '?'));
            for (const s of c.deep?.allShrines || []) add('Sites of Grace', s.name, s.x, s.z, c.deep.kindledShrines?.has(s.id) ? 'kindled' : 'unlit');
            for (const s of BO.ZoneInfest?.sites || []) add('Infested sites', s.name, s.x, s.z, (s.cleared ? 'secured' : 'infested') + ' · tier ' + s.tier);
            for (const d of BO.ZoneDungeons?.list?.() || []) if (d.at) add('Dungeons', d.name, d.at.x, d.at.z, d.st.cleared ? 'cleared' : d.size);
            const B = GM.get('bosses');
            for (const [id, L] of Object.entries(B?.lairs || {})) add('Boss lairs', L.def?.name || id, L.x, L.z, B.state?.[id]?.s || '');
            for (const n of c.npcs || BO.SurvivalCampaignData?.contacts || []) if (Number.isFinite(n.x)) add('Contacts', n.name, n.x, n.z, n.area || '');
            for (const p of Z?.pois || []) add('Landmarks', (p.name || p.type).replace(/_/g, ' '), p.x, p.z, Z.regionAt(p.x, p.z)?.name || '');
            const spots = this.spots();
            const byG = {};
            for (const e of groups) (byG[e.g] = byG[e.g] || []).push(e);
            return this.sec('Quick', `<div class="dev-row">${this.btn('tpCross', 'To the crosshair')}${this.btn('tpUp', 'Up 30 m')}${this.btn('tpFwd', 'Forward 50 m')}${this.btn('saveSpot', 'Save this spot')}</div>
                    ${spots.length ? `<div class="dev-row">${spots.map((s, i) => this.btn('goSpot', s.name, String(i))).join('')}${this.btn('clearSpots', 'Forget spots', '', 'ghost')}</div>` : ''}
                    <p class="dev-note">Tip: with "Click the map to teleport" on (World tab), clicking anywhere on the Map tab takes you there.</p>`) +
                this.sec('Find', this.search('Search places…')) +
                Object.entries(byG).map(([g, list]) => this.sec(g + ' (' + list.length + ')', `<div class="dev-list">${list.slice(0, 80).map((e) => `<div class="dev-item"><span class="nm"><b>${esc(e.name)}</b><small>${esc(e.sub)} · ${Math.round(e.x)}, ${Math.round(e.z)}</small></span><span class="acts">${this.btn('tpTo', 'Go', e.x + '|' + e.z)}</span></div>`).join('')}</div>`)).join('');
        },

        tab_missions() {
            const c = this.c;
            const row = (name, sub, status, acts) => this.match(name, sub, status) ? `<div class="dev-item"><span class="nm"><b>${esc(name)}</b><small>${esc(sub)}</small></span><em class="st st-${esc(status.split(' ')[0])}">${esc(status)}</em><span class="acts">${acts}</span></div>` : '';
            const tp = (x, z) => Number.isFinite(x) && Number.isFinite(z) ? this.btn('tpTo', 'Go', x + '|' + z) : '';
            const out = [];
            // Story
            const o = c.objectives;
            if (o?.steps) out.push(this.sec('Story · The Lantern', `<div class="dev-list">${o.steps.map((s, i) => {
                const st = o.freeplay || i < o.step ? 'done' : i === o.step ? 'current' : 'later';
                const t = i === o.step ? o.target?.() : null;
                return row(s.title, 'Act ' + s.act + (s.hint ? ' · ' + s.hint.slice(0, 60) : ''), st, (t ? tp(t.x, t.z) : '') + this.btn('story', 'Make current', 'set|' + i) + (i === o.step ? this.btn('story', 'Complete', 'done|' + i) : ''));
            }).join('')}</div>`));
            // Quests
            const Q = BO.ZoneQuests;
            if (Q?.all) out.push(this.sec('Quests (' + Q.all.length + ')', `<div class="dev-list">${Q.all.map((qd) => {
                const act = Q.active.find((a) => a.id === qd.id);
                const st = Q.done.has(qd.id) ? 'done' : act ? 'active' : 'open';
                const loc = act?.loc || Q.places?.[qd.id];
                return row(qd.title, (qd.cat || '') + ' · ' + (qd.text || '').slice(0, 70), st, (loc ? tp(loc.x, loc.z) : this.btn('quest', 'Locate', 'loc|' + qd.id, 'ghost')) + this.btn('quest', 'Start', 'start|' + qd.id) + this.btn('quest', 'Complete', 'done|' + qd.id) + this.btn('quest', 'Restart', 'restart|' + qd.id));
            }).join('')}</div>`));
            // Contracts
            const K = BO.ZoneContracts;
            if (K) out.push(this.sec('Haven contracts', `<div class="dev-row">${['clear', 'bounty', 'headhunter', 'champions', 'scavenge', 'streak', 'nest'].map((k) => this.btn('contract', 'New: ' + k, 'new|' + k)).join('')}</div>
                <div class="dev-list">${(K.list || []).map((k) => row(k.title, k.sub || '', 'active', tp(k.x, k.z) + this.btn('contract', 'Complete', 'done|' + k.id) + this.btn('contract', 'Remove', 'drop|' + k.id, 'ghost'))).join('') || '<p class="dev-note">No contracts running.</p>'}</div>`));
            // Infested sites
            const I = BO.ZoneInfest;
            if (I?.sites) out.push(this.sec('Infested sites (' + I.securedCount() + '/' + I.sites.length + ' secured)', `<div class="dev-row">${this.btn('site', 'Secure all', 'all|')}${this.btn('site', 'Reinfest all', 'resetall|', 'ghost')}</div><div class="dev-list">${I.sites.map((s) =>
                row(s.name, 'Tier ' + s.tier + ' · ' + (BO.Zone.regionAt(s.x, s.z)?.name || ''), s.cleared ? 'done' : s.active ? 'active' : 'open', tp(s.x, s.z) + this.btn('site', 'Start', 'start|' + s.key) + this.btn('site', 'Secure', 'done|' + s.key) + this.btn('site', 'Restart', 'reset|' + s.key))).join('')}</div>`));
            // Dungeons
            const D = BO.ZoneDungeons;
            if (D?.list) out.push(this.sec('Dungeons', `<div class="dev-list">${D.list().map((d) => row(d.name, d.size + ' · ' + d.rooms.length + ' rooms', d.st.cleared ? 'done' : D.inside?.d?.id === d.id ? 'active' : 'open',
                (d.at ? tp(d.at.x, d.at.z) : '') + this.btn('dungeon', 'Enter', 'start|' + d.id) + this.btn('dungeon', 'Clear', 'done|' + d.id) + this.btn('dungeon', 'Reset', 'reset|' + d.id))).join('')}${D.inside ? `<div class="dev-row">${this.btn('dungeon', 'Leave current dungeon', 'leave|')}</div>` : ''}</div>`));
            // Legends
            const LG = BO.ZoneLegends;
            if (LG?.legendStatus) out.push(this.sec('Legendary hunts', `<div class="dev-list">${LG.legendStatus().map((L) => row(L.name, L.how || '', L.s, this.btn('legend', 'Spawn now', 'start|' + L.id) + this.btn('legend', 'Kill', 'done|' + L.id) + this.btn('legend', 'Reset', 'reset|' + L.id))).join('')}</div>
                <div class="dev-row">${[0, 1, 2, 3, 4].map((r) => this.btn('arena', 'Arena boss ' + (r + 1), String(r))).join('')}${LG.arena ? this.btn('arena', 'Leave arena', 'leave', 'warn') : ''}</div>`));
            // Final bosses
            const B = GM.get('bosses');
            if (B?.lairs) out.push(this.sec('Final bosses', `<div class="dev-list">${Object.entries(B.lairs).map(([id, L]) => row(L.def?.name || id, L.def?.region || '', B.state?.[id]?.s || 'hidden',
                tp(L.x, L.z) + this.btn('boss', 'Begin fight', 'start|' + id) + this.btn('boss', 'Win', 'done|' + id) + this.btn('boss', 'Abort', 'end|' + id, 'ghost') + this.btn('boss', 'Reset', 'reset|' + id))).join('')}</div>`));
            // World events
            const E = BO.ZoneEvents;
            if (E) out.push(this.sec('World events', `<div class="dev-row">${['airdrop', 'herd', 'distress', 'surge'].map((k) => this.btn('event', 'Start ' + k, 'start|' + k)).join('')}</div>
                <div class="dev-list">${(E.events || []).map((e, i) => row(e.spec?.name || e.kind, e.phase || '', 'active', tp(e.x, e.z) + this.btn('event', 'End', 'end|' + i) + this.btn('event', 'Restart', 'restart|' + i))).join('') || '<p class="dev-note">No events running.</p>'}</div>`));
            // Horde & finale
            const H = BO.ZoneHorde, FN = BO.ZoneFinale;
            out.push(this.sec('Horde & finale', `<div class="dev-row">${this.btn('horde', H?.active ? 'End horde' : 'Start horde', H?.active ? 'end' : 'start')}${FN ? this.btn('finale', FN.active ? 'Abort finale' : 'Begin finale', FN.active ? 'end' : 'start') + (FN.active ? this.btn('finale', 'Win finale', 'done') : '') : ''}${Number.isFinite(BO.Zone?.LANTERN?.x) ? this.btn('tpTo', 'Go to the Lantern', BO.Zone.LANTERN.x + '|' + BO.Zone.LANTERN.z) : ''}</div>`));
            return this.sec('Find', this.search('Search missions…')) + out.join('');
        },

        tab_inspect() {
            const t = this.pick();
            this.sel = t;
            if (!t) return this.sec('Inspector', '<p class="dev-note">Look at a structure, enemy or animal within 40 m (aim the crosshair at it), then reopen this tab or press Refresh.</p>' + this.btn('refresh', 'Refresh'));
            const hp = t.kind === 'piece' ? (t.o.part ? t.o.part.hp : null) : t.o.hp;
            const max = t.kind === 'piece' ? (t.o.part?.maxHp || t.o.part?.hp) : t.o.maxHp;
            return this.sec('Inspector · ' + t.label, `<dl class="dev-kv"><dt>Kind</dt><dd>${esc(t.kind)}</dd><dt>Type</dt><dd>${esc(t.type)}</dd><dt>Distance</dt><dd>${t.d.toFixed(1)} m</dd><dt>Health</dt><dd>${hp == null ? '—' : Math.round(hp) + (max ? ' / ' + Math.round(max) : '')}</dd><dt>Position</dt><dd>${t.pos.map((v) => v.toFixed(1)).join(', ')}</dd></dl>
                ${hp != null ? `<label class="dev-range"><span>Set health</span><input type="number" min="0" step="10" value="${Math.round(hp)}" data-dev-num="selHp"></label>` : ''}
                <div class="dev-row">${this.btn('refresh', 'Refresh')}${this.btn('sel', 'Heal', 'heal')}${t.kind !== 'piece' ? this.btn('sel', 'Kill', 'kill', 'warn') : ''}${this.btn('sel', 'Delete', 'delete', 'warn')}${t.kind === 'piece' ? this.btn('sel', 'Duplicate', 'dup') : ''}${this.btn('sel', 'Teleport to it', 'tp')}</div>
                ${t.kind === 'piece' ? `<div class="dev-row">${['x+', 'x-', 'z+', 'z-', 'y+', 'y-'].map((d) => this.btn('nudge', 'Move ' + d, d)).join('')}${this.btn('nudge', 'Rotate 90°', 'r')}</div><p class="dev-note">Moves are 0.5 m. Moving a structure re-solves its support.</p>` : ''}`) +
                this.sec('Bulk', `<div class="dev-row">${this.btn('repairAll', 'Repair every structure')}${this.btn('wipeBase', 'Delete everything I built', '', 'warn')}</div>`);
        },

        tab_debug() {
            const r = BO.App?.renderer || BO.Renderer || BO.Engine?.renderer;
            const info = r?.info?.render;
            const p = this.P();
            const reg = this.nearRegion();
            return this.sec('Live', `<dl class="dev-kv"><dt>FPS</dt><dd data-dev-live="fps">—</dd><dt>Draw calls</dt><dd>${info?.calls ?? '—'}</dd><dt>Triangles</dt><dd>${info?.triangles?.toLocaleString?.() ?? '—'}</dd>
                <dt>Position</dt><dd>${this.posText()}</dd><dt>Region</dt><dd>${esc(reg?.name || '')} · ${esc(reg?.biome || '')} · threat ${reg?.threat ?? '?'}</dd>
                <dt>Infected</dt><dd>${this.mode.zombies.filter((z) => z.alive).length}</dd><dt>Animals</dt><dd>${(BO.ZoneWild?.animals || []).filter((a) => a.alive).length}</dd><dt>Markers</dt><dd>${this.mode.markers.length}</dd><dt>Structures</dt><dd>${this.c.placed.filter((x) => x.alive).length}</dd>
                <dt>Clock</dt><dd>${this.mode.clock.toFixed(0)} s · ${esc(this.c.clockFace || '')}</dd><dt>Grounded</dt><dd>${p.onGround ? 'yes' : 'no'}</dd></dl>`) +
                this.sec('Tools', `<div class="dev-grid2">${this.tog('hideHud', 'Hide the HUD', 'For screenshots')}<label class="dev-tog"><span><input type="checkbox" data-dev-hitboxes ${BO.HitboxDebug?.isEnabled?.() ? 'checked' : ''}><span>Hitbox Wireframes</span></span><small>Head / torso / limb / shield</small></label></div><div class="dev-row">${this.btn('copyPos', 'Copy position')}${this.btn('save', 'Force-save checkpoint')}${this.btn('refresh', 'Refresh')}</div>`);
        },

        spots() { try { return JSON.parse(localStorage.getItem(SPOTS_KEY) || '[]'); } catch (_) { return []; } },

        /* ------------------------------------------------ inspector picking */
        pick() {
            const p = this.P();
            const f = this.forward();
            const eye = { x: p.pos.x, y: p.pos.y + (p.eyeHeight || 1.6), z: p.pos.z };
            let best = null;
            const consider = (kind, o, pos, label, type, size = 1) => {
                const dx = pos[0] - eye.x, dy = pos[1] - eye.y, dz = pos[2] - eye.z;
                const d = Math.hypot(dx, dy, dz);
                if (d > 40 || d < 0.3) return;
                const along = (dx * f.x + dy * f.y + dz * f.z);
                if (along <= 0) return;
                const off = Math.sqrt(Math.max(0, d * d - along * along));
                if (off > Math.max(0.8, size)) return;
                const score = off / Math.max(0.5, size) + d * 0.02;
                if (!best || score < best.score) best = { kind, o, pos, label, type, d, score };
            };
            for (const pc of this.c.placed) if (pc.alive && pc.size) consider('piece', pc, [pc.x, pc.y + pc.size[1] / 2, pc.z], (BO.SurvivalCampaignData.build.find((b) => b.id === pc.type)?.name || pc.type), pc.type, Math.max(pc.size[0], pc.size[2]) / 2 + 0.2);
            for (const z of this.mode.zombies) if (z.alive) consider('enemy', z, [z.pos.x, z.pos.y + 1, z.pos.z], z.spec?.name || z.type || 'Infected', z.type || 'infected', 0.9);
            for (const b of this.mode.bots || []) if (b.alive && b.team !== 0) consider('enemy', b, [b.pos.x, b.pos.y + 1, b.pos.z], 'PMC soldier', 'bot', 0.9);
            for (const a of BO.ZoneWild?.animals || []) if (a.alive) consider('animal', a, [a.pos.x, a.pos.y + 0.5, a.pos.z], a.spec?.name || a.kind, a.kind, Math.max(0.6, a.spec?.size || 0.6));
            return best;
        },

        removePiece(pc) {
            const m = this.mode;
            pc.alive = false;
            const part = pc.part || m.structures?.get?.(pc.mesh);
            if (part) { m.removeSolid?.(part.mesh, part.collider); part.mesh.visible = false; }
            if (pc.mesh) pc.mesh.visible = false;
            for (const mk of m.markers) if (mk.id === 'build:' + pc.id || mk.id.endsWith(':' + pc.id)) mk.alive = false;
            GM.call('onPieceLost', pc);
            BO.ZoneBuild?.settle?.();
        },

        /* ------------------------------------------------ input */
        onInput(e, committed) {
            const t = e.target;
            if (t.matches('[data-dev-search]')) {
                if (committed) return;
                this.q = t.value || '';
                this._focusSearch = true;
                clearTimeout(this._qT);
                this._qT = setTimeout(() => this.render(), 120);
                return;
            }
            if (t.matches('[data-dev-hitboxes]')) {
                BO.HitboxDebug?.setEnabled?.(t.checked);
                return;
            }
            if (t.matches('[data-dev-flag]')) {
                const f = t.dataset.devFlag;
                this.flags[f] = t.checked;
                if (f === 'hideHud') document.body.classList.toggle('gm-dev-hidehud', t.checked);
                if (f === 'god' && t.checked) { const p = this.P(); p.hp = p.maxHp; }
                if (!committed) return;
                return;
            }
            if (t.matches('[data-dev-rule]')) {
                const k = t.dataset.devRule;
                if (t.checked) this.forced.add(k); else this.forced.delete(k);
                this.c.deep?._computeModFx?.();
                this.c.deep?.recomputePlayerStats?.();
                return;
            }
            if (t.matches('[data-dev-range]')) {
                const k = t.dataset.devRange;
                const v = Number(t.value);
                if (k === 'speed') this.speed = v;
                else if (k === 'timeScale') this.timeScale = v;
                else if (k === 'hour') this.setHour(v);
                const lbl = t.parentElement.querySelector('b');
                if (lbl) lbl.textContent = k === 'hour' ? (this.c.clockFace || v.toFixed(2)) : v + '×';
                return;
            }
            if (t.matches('[data-dev-num]') && committed) {
                const v = Math.max(0, Number(t.value) || 0);
                const s = this.sel;
                if (!s) return;
                if (s.kind === 'piece' && s.o.part) s.o.part.hp = v;
                else if (s.kind !== 'piece') { s.o.hp = v; if (v > (s.o.maxHp || 0)) s.o.maxHp = v; }
                this.render();
            }
        },

        setHour(h) {
            const c = this.c;
            let delta = h - c.hour;
            if (delta < 0) delta += 24;
            c.restHours += delta;
        },

        onClick(e) {
            const b = e.target.closest('[data-dev]');
            if (!b) return;
            const cmd = b.dataset.dev;
            const arg = b.dataset.arg || '';
            try { this.run(cmd, arg); } catch (err) { console.error('[GM:dev] ' + cmd, err); this.say('Dev action failed: ' + err.message); }
            if (cmd !== 'close' && cmd !== 'disable' && this.open) this.render();
        },

        run(cmd, arg) {
            const m = this.mode, c = this.c, p = this.P(), deep = c.deep;
            const [a0, a1] = arg.split('|');
            switch (cmd) {
                case 'close': return this.toggle(false);
                case 'disable': this.setEnabled(false); this.say('Dev Mode will be off from your next run.'); return this.toggle(false);
                case 'tab': this.tab = arg; this.q = ''; this._keepScroll = false; return;
                // player
                case 'heal': p.hp = p.maxHp; m.hunger = 100; if (deep) { deep.hydration = 100; deep.bleeding = 0; deep.infection = 0; } m.radiation = 0; GM.clearStatus?.('fracture'); return this.say('Healed and cured.');
                case 'hp': if (Number(arg)) { p.maxHp += Number(arg); p.hp = p.maxHp; } else { deep?.recomputePlayerStats?.(); p.hp = p.maxHp; } return;
                case 'kill': this.flags.god = false; p.takeDamage?.(99999); return;
                case 'lvl': { const T = BO.ZoneThrill; for (let i = 0; i < Number(arg); i++) T.xp(T.need(T.level) - T.xpInto + 1, null, true); return; }
                case 'sp': BO.ZoneThrill.pending += Number(arg); return;
                case 'skillsMax': { const SK = GM.get('skills'); const T = BO.ZoneThrill; for (const br of SK.BRANCHES) for (const nd of br.nodes) T.ranks[nd.id] = nd.max; T.applyAll(); return this.say('Every skill maxed.'); }
                case 'skillsReset': { const SK = GM.get('skills'); const T = BO.ZoneThrill; let refund = 0; for (const br of SK.BRANCHES) for (const nd of br.nodes) { refund += T.ranks[nd.id] || 0; delete T.ranks[nd.id]; } T.pending += refund; T.applyAll(); return this.say('Skills reset · ' + refund + ' points refunded.'); }
                case 'openSkills': this.toggle(false); return BO.SurvivalUI.show('skills');
                // world
                case 'hourTo': return this.setHour(Number(arg));
                case 'nextDay': c.restHours += 24; return;
                case 'weather': { const W = GM.get('weather'); for (const r of W.regions()) W.fronts[r.id] = arg; return this.say('Weather: ' + arg + ' everywhere.'); }
                case 'horde': { const H = BO.ZoneHorde; if (arg === 'end' || H.active) H.finish(true); else H.begin(c.day); return; }
                case 'bloodmoon': if (deep) { deep.bloodMoonActive = !deep.bloodMoonActive; deep.bloodMoonUntil = m.clock + 180; } return;
                case 'killAll': { let n = 0; for (const z of [...m.zombies, ...(m.bots || [])]) if (z.alive && z.team !== 0) { m.hit(z, 1e6, 'head', null, 'bullet'); n++; } return this.say(n + ' hostiles down.'); }
                case 'clearAnimals': { const W = BO.ZoneWild; for (const an of W?.animals || []) an.destroy(); if (W) W.animals = []; return; }
                case 'revealMap': { for (const ar of BO.SurvivalData?.areas || BO.SurvivalCampaignData?.areas || []) c.visited?.add?.(ar.id); for (const r of BO.Zone?.REGIONS || []) c.visited?.add?.(r.id); for (const s of BO.ZoneInfest?.sites || []) s.known = true; if (deep?.allShrines) for (const s of deep.allShrines) s.discovered = true; return this.say('Map revealed.'); }
                case 'openMap': this.toggle(false); return BO.SurvivalUI.show('map');
                // items
                case 'give': { const n = Number(a1); if (n === 0) { m.points[a0] = 0; return; } return this.grant({ [a0]: n }); }
                case 'bundle': {
                    const F = BO.SurvivalFrontierData.items;
                    const out = {};
                    const pick = (pred, n) => { for (const [id, [, cat]] of Object.entries(F)) if (pred(id, cat)) out[id] = n; };
                    if (arg === 'raw') pick((id, cat) => cat === 'Raw materials', 50);
                    else if (arg === 'comp') pick((id, cat) => cat === 'Components', 30);
                    else if (arg === 'food') { pick((id, cat) => cat === 'Food', 20); out.freshWater = 20; }
                    else if (arg === 'med') pick((id, cat) => /Medical|Consumables/.test(cat), 20);
                    else if (arg === 'ammo') { for (const k of ['ammo9', 'ammo556', 'ammo762', 'ammo12']) out[k] = 300; for (const w of p.weapons) if (w?.stats?.reserveMax) w.reserve = w.stats.reserveMax; }
                    else if (arg === 'plates') { out.plate_ceramic = 3; out.plate_steel = 3; out.plate_composite = 3; }
                    return this.grant(out);
                }
                case 'tools': { const T = BO.SurvivalFrontierData.tools; for (const [id, t] of Object.entries(T)) c.pack.tools[id] = t.wear; return this.say('Every tool added.'); }
                case 'clearPack': for (const k of Object.keys(m.points)) if (BO.SurvivalFrontierData.items[k]) m.points[k] = 0; return;
                case 'weapon': { const full = p.weapons.length >= (p.maxWeapons || 2); p.giveWeapon(arg); BO.ZoneThrill?.refit?.(p.activeWeapon); return this.say((full ? 'Swapped your held weapon for ' : 'Weapon added: ') + (BO.WeaponsData.get(arg)?.name || arg)); }
                // unlocks
                case 'reveal': { const R = GM.get('recipes'); if (!R) return; if (arg === 'on') { for (const id of Object.keys(BO.SurvivalFrontierData.items)) R.seen.add(id); for (const b of BO.SurvivalCampaignData.build) R.built.add(b.id); } else { R.seen = new Set(Object.keys(m.points).filter((k) => m.points[k] > 0)); R.built = new Set(c.placed.filter((x) => x.alive).map((x) => x.type)); } return this.say(arg === 'on' ? 'Every recipe and blueprint revealed.' : 'Undiscovered recipes hidden again.'); }
                case 'tech': { if (!deep) return; const tree = BO.SurvivalDeepData?.techTree || []; if (arg === 'on') for (const n of tree) deep.unlockedTech.add(n.id); else deep.unlockedTech.clear(); deep._computeModFx?.(); deep.recomputePlayerStats?.(); return this.say(arg === 'on' ? 'All tech unlocked.' : 'All tech locked.'); }
                case 'tp': if (deep) deep.techPoints += Number(arg); return;
                case 'catalogue': { const C = GM.get('catalogue'); if (!C) return; if (arg === 'on') { for (const en of C.entries) C.found.add(en.key); for (const s of new Set(C.entries.map((x) => x.set))) C.checkSet(s, true); } else { C.found.clear(); C.doneSets.clear(); } return this.say(arg === 'on' ? 'Catalogue complete.' : 'Catalogue reset.'); }
                case 'firstNight': { const N = GM.get('night'); if (!N) return; if (arg === 'on') { let guard = 0; while (N.currentStep?.() && guard++ < 20) N.done.add(N.currentStep().id); if (!N.complete) N.finishTrack?.(); try { localStorage.setItem('bo_survival_firstnight_done', '1'); } catch (_) { /* ok */ } } else { N.done?.clear?.(); N.complete = false; try { localStorage.removeItem('bo_survival_firstnight_done'); } catch (_) { /* ok */ } } return this.say('First Night ' + (arg === 'on' ? 'completed.' : 'reset (restart the run to see it again).')); }
                case 'vehicles': for (const v of BO.SurvivalCampaignData?.vehicles || []) c.vehicles?.add?.(v.id); return this.say('Every vehicle owned.');
                // spawn
                case 'spawnZ': { const at = this.crosshair(); const types = BO.Zone?.bestiary?.() || []; const n = Number(a1) || 1; for (let i = 0; i < n; i++) { const t = a0 || types[Math.floor(Math.random() * types.length)]?.id || 'normal'; m.spawnInfected(at.x + (Math.random() - 0.5) * (n > 1 ? 6 : 0), at.y, at.z + (Math.random() - 0.5) * (n > 1 ? 6 : 0), 'normal', a0 || t, true); } m.refreshTargets?.(); return; }
                case 'spawnBot': { const at = this.crosshair(); m.spawnBot(at.x, at.y, at.z, 'm4a1', 90, 1, true); m.refreshTargets?.(); return; }
                case 'spawnA': { const W = BO.ZoneWild; if (!W) return; const orig = W.pickSpecies; W.pickSpecies = () => arg; try { for (let i = 0; i < 3; i++) W.spawnAround(); } finally { W.pickSpecies = orig; } return this.say('Spawned ' + arg + ' nearby.'); }
                case 'spawnV': { const V = GM.get('vehicles'); const f = this.forward(); const x = p.pos.x + f.x * 4, z = p.pos.z + f.z * 4; V?.spawn({ spec: arg, x, z, yaw: p.yaw, fuel: 1, hp: 1 }); c.vehicles?.add?.(arg); return this.say('Vehicle beside you: ' + arg); }
                // teleport
                case 'tpTo': return this.tp(Number(a0), Number(a1));
                case 'tpCross': { const at = this.crosshair(); return this.tp(at.x, at.z); }
                case 'tpUp': return this.tp(p.pos.x, p.pos.z, p.pos.y + 30);
                case 'tpFwd': { const f = this.forward(); return this.tp(p.pos.x + f.x * 50, p.pos.z + f.z * 50); }
                case 'saveSpot': { const s = this.spots(); s.push({ name: (this.nearRegion()?.name || 'Spot') + ' ' + (s.length + 1), x: p.pos.x, y: p.pos.y, z: p.pos.z }); localStorage.setItem(SPOTS_KEY, JSON.stringify(s.slice(-12))); return; }
                case 'goSpot': { const s = this.spots()[Number(arg)]; if (s) this.tp(s.x, s.z, s.y + 0.2); return; }
                case 'clearSpots': localStorage.removeItem(SPOTS_KEY); return;
                // missions
                case 'story': { const o = c.objectives; const i = Number(a1); if (a0 === 'set') { o.step = Math.max(0, Math.min(o.steps.length - 1, i)); this.say('Story step: ' + o.steps[o.step].title); } else if (a0 === 'done') { const next = o.steps[i + 1]; if (next) o.advance(next.id); } return; }
                case 'quest': {
                    const Q = BO.ZoneQuests; const qd = Q.byId(a1); if (!qd) return;
                    const forceAccept = () => { if (Q.active.some((x) => x.id === a1)) return; Q.done.delete(a1); const keep = Q.active; if (keep.length >= 4) Q.active = keep.slice(0, 3); Q.accept(a1); };
                    if (a0 === 'start') forceAccept();
                    else if (a0 === 'done') { forceAccept(); const act = Q.active.find((x) => x.id === a1); if (act) Q.complete(act); }
                    else if (a0 === 'restart') { Q.done.delete(a1); Q.drop(a1); delete Q.places[a1]; forceAccept(); }
                    else if (a0 === 'loc') { const loc = Q.resolve(qd); if (loc) this.tp(loc.x, loc.z); else this.say('This quest has no fixed place.'); }
                    return;
                }
                case 'contract': { const K = BO.ZoneContracts; if (a0 === 'new') { const k = K.make(a1); if (k) { K.list.push(k); this.say('Contract: ' + k.title); } else this.say('No valid target for that contract here.'); } else { const k = K.list.find((x) => x.id === a1); if (!k) return; if (a0 === 'done') K.complete(k); else K.list = K.list.filter((x) => x !== k); } return; }
                case 'site': {
                    const I = BO.ZoneInfest;
                    const reset = (s) => { s.cleared = false; s.won = false; s.opened = false; s.left = Math.max(2, s.size || 4); s.alphaDead = false; };
                    if (a0 === 'all') { for (const s of I.sites) if (!s.cleared) I.secure(s); return; }
                    if (a0 === 'resetall') { for (const s of I.sites) reset(s); I.applyFlags(); return; }
                    const s = I.byKey?.get(a1) || I.sites.find((x) => x.key === a1); if (!s) return;
                    if (a0 === 'done') I.secure(s);
                    else if (a0 === 'reset') { reset(s); I.applyFlags(); }
                    else if (a0 === 'start') { if (s.cleared) { reset(s); I.applyFlags(); } this.tp(s.x, s.z); s.active = true; I.spawnPack?.(s); }
                    return;
                }
                case 'dungeon': {
                    const D = BO.ZoneDungeons;
                    if (a0 === 'leave') return D.leave();
                    const st = D.st(a1);
                    if (a0 === 'start') { if (D.inside) D.leave(true); D.enter(a1); }
                    else if (a0 === 'done') { st.cleared = true; st.chest = true; st.boss = true; if (D.inside?.d?.id === a1) D.leave(); }
                    else if (a0 === 'reset') { st.cleared = false; st.chest = false; st.boss = false; }
                    return;
                }
                case 'legend': {
                    const LG = BO.ZoneLegends; const L = LG.legendStatus().find((x) => x.id === a1); if (!L) return;
                    const st = LG.state[a1] || (LG.state[a1] = { s: 'locked' });
                    if (a0 === 'start') { if (st.entity?.alive) return; st.s = 'met'; LG.spawnLegend(L, st); }
                    else if (a0 === 'done') { if (st.entity?.alive) { st.entity.hp = 0; m.hit(st.entity, 1e6, 'head', null, 'bullet'); } if (st.entity) LG.legendDown(L, st); else st.s = 'dead'; }
                    else if (a0 === 'reset') { if (st.entity?.alive) { st.entity.alive = false; st.entity.despawned = true; } st.entity = null; st.s = 'locked'; }
                    return;
                }
                case 'arena': { const LG = BO.ZoneLegends; if (arg === 'leave') return LG.leaveArena(); return LG.enterArena(Number(arg)); }
                case 'boss': {
                    const B = GM.get('bosses'); const st = B.state[a1] || (B.state[a1] = { s: 'known' });
                    if (a0 === 'start') { if (B.fight) B.endFight(true); this.tp(B.lairs[a1].x, B.lairs[a1].z); st.s = 'known'; B.beginFight(a1); }
                    else if (a0 === 'done') { if (!B.fight || B.fight.id !== a1) { st.s = 'known'; B.beginFight(a1); } B.win(B.fight); }
                    else if (a0 === 'end') B.endFight(false, false);
                    else if (a0 === 'reset') { if (B.fight?.id === a1) B.endFight(true); st.s = 'known'; B.rewards?.delete?.(B.lairs[a1]?.def?.reward); const L = B.lairs[a1]; if (L?.obelisk) L.obelisk.visible = true; B.refreshLair(a1); }
                    return;
                }
                case 'event': {
                    const E = BO.ZoneEvents;
                    if (a0 === 'start') { const e = E.trigger(a1); if (e) this.tp(e.x + 12, e.z + 12); else this.say('That event is already running or has no spot here.'); return; }
                    const e = E.events[Number(a1)]; if (!e) return;
                    const kind = e.kind;
                    E.end(e);
                    if (a0 === 'restart') E.trigger(kind);
                    return;
                }
                case 'finale': { const FN = BO.ZoneFinale; if (a0 === 'start') FN.begin(); else if (a0 === 'end') FN.abort('dev'); else if (a0 === 'done') FN.victory(); return; }
                // inspect
                case 'refresh': return;
                case 'sel': {
                    const s = this.sel; if (!s) return;
                    if (arg === 'tp') return this.tp(s.pos[0] + 2, s.pos[2] + 2);
                    if (s.kind === 'piece') {
                        if (arg === 'heal' && s.o.part) s.o.part.hp = s.o.part.maxHp || s.o.part.hp;
                        if (arg === 'delete') { this.removePiece(s.o); this.sel = null; }
                        if (arg === 'dup') { const f = this.forward(); const copy = { ...s.o, id: 'dev' + Date.now().toString(36), x: s.o.x + Math.round(f.x) * s.o.size[0], z: s.o.z + Math.round(f.z) * s.o.size[2], alive: true }; delete copy.mesh; delete copy.part; c.place(copy); }
                    } else {
                        if (arg === 'heal') s.o.hp = s.o.maxHp;
                        if (arg === 'kill') { if (s.kind === 'animal') BO.ZoneWild.hitAnimal(s.o, 1e6, 'head', null, 'bullet'); else m.hit(s.o, 1e6, 'head', null, 'bullet'); }
                        if (arg === 'delete') { if (s.kind === 'animal') { s.o.alive = false; s.o.destroy(); BO.ZoneWild.animals = BO.ZoneWild.animals.filter((x) => x !== s.o); } else { s.o.alive = false; s.o.despawned = true; s.o.deathTimer = 0; if (s.o.parts?.root) s.o.parts.root.visible = false; } this.sel = null; }
                    }
                    return;
                }
                case 'nudge': {
                    const s = this.sel; if (!s || s.kind !== 'piece') return;
                    const pc = s.o;
                    const copy = { ...pc, id: pc.id };
                    delete copy.mesh; delete copy.part;
                    if (arg === 'r') copy.size = [pc.size[2], pc.size[1], pc.size[0]];
                    else { const ax = arg[0], sign = arg[1] === '+' ? 0.5 : -0.5; copy[ax] = pc[ax] + sign; }
                    this.removePiece(pc);
                    copy.id = pc.id + 'm';
                    c.place(copy);
                    return;
                }
                case 'repairAll': for (const pc of c.placed) if (pc.alive && pc.part) pc.part.hp = pc.part.maxHp || pc.part.hp; return this.say('Every structure repaired.');
                case 'wipeBase':
                    BO.Dialog.confirm({
                        kicker: 'DEV PANEL',
                        title: 'WIPE BASE?',
                        message: 'Delete every structure you built in this run?',
                        tone: 'danger',
                        confirmLabel: 'WIPE BASE'
                    }).then((ok) => {
                        if (!ok) return;
                        for (const pc of c.placed) if (pc.alive) this.removePiece(pc);
                        this.say('Base wiped.');
                    });
                    return;
                // debug
                case 'copyPos': { const t = this.posText(); navigator.clipboard?.writeText?.(t); return this.say('Copied ' + t); }
                case 'save': c.save(false, true); return;
                default: return;
            }
        },

        /* ------------------------------------------------ frame */
        update(dt) {
            if (!this.active || !this.mode?.active) return;
            const m = this.mode, c = this.c, p = this.P(), deep = c.deep;
            if (this.flags.god) { if (p.hp < p.maxHp) p.hp = p.maxHp; if (!p.alive && p.revive) p.revive(); }
            if (this.flags.noNeeds) { m.hunger = 100; if (deep) { deep.hydration = 100; deep.bleeding = 0; deep.infection = 0; deep.temp = 21; } m.radiation = 0; if (p.tacStamina != null) p.tacStamina = 1; }
            if (this.flags.infAmmo) { const w = p.activeWeapon; if (w?.stats && w.stats.kind !== 'melee') { w.mag = w.stats.magSize; if (w.stats.reserveMax) w.reserve = w.stats.reserveMax; } }
            const hoursPerSec = 24 / c.options.dayLength;
            if (this.flags.freezeTime) c.restHours -= dt * hoursPerSec;
            else if (this.timeScale > 1) c.restHours += dt * hoursPerSec * (this.timeScale - 1);
            // Live fields in the open panel.
            this._liveT = (this._liveT || 0) + dt;
            if (this.open && this._liveT > 0.5) {
                this._liveT = 0;
                const fps = this.panel.querySelector('[data-dev-live="fps"]');
                if (fps) fps.textContent = String(Math.round(BO.State.fps || (1 / Math.max(0.001, BO.State.frameDt || 0.016))));
                const foot = this.panel.querySelector('.dev-foot span');
                if (foot) foot.textContent = 'Position ' + this.posText();
            }
        }
    };

    GM.register('dev', Dev);
})(window.BO);
