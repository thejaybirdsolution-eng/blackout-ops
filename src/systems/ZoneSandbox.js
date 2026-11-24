/* ============================================================================
   BLACKOUT OPS — Sandbox & custom rules
   A modifier category of on/off switches for shaping your own Survival run:
   hunger, stamina, night, cooldowns, compass, HUD pieces, falling damage,
   NPCs, animals, enemy aggression, weather, rain, sunshine, vehicles, free
   crafting, max level, all unlocks, backpack size, the master map, the full
   roster from day one, the Box of Wonders, god mode, infinite ammo and more.
   Each switch is a normal modifier (campaign.has(id)) wired up here.
============================================================================ */
(function (BO) {
    'use strict';
    const R = BO.SurvivalRules;
    if (!R) return;

    const S = (name, ico, description, tier = 'buff') => ({ name, group: 'sandbox', tier, ico, exclusive: true, description, fx: {} });
    const MODS = {
        sv_no_hunger: S('No hunger or thirst', '🍽', 'Food and water never drain. Food still heals.'),
        sv_no_stamina: S('Endless stamina', '🏃', 'Stamina never runs out: sprint, dodge and swing forever.'),
        sv_no_night: S('No night (always day)', '☀', 'The sun never sets. Horde nights and night-only bosses never come.'),
        sv_always_night: S('Eternal night', '🌑', 'The sun never rises. Wolves hunt, stalkers roam, lights matter.', 'chaos'),
        sv_no_cooldowns: S('No cooldowns or timers', '⏱', 'Instant container searches, instant reloads, one-swing harvesting and no respawn wait.'),
        sv_no_compass: S('Hide the compass', '🧭', 'Removes the compass tape. Navigate by landmarks and the map.', 'challenge'),
        sv_hide_hud: S('Hide the entire HUD', '🙈', 'No HUD at all, for screenshots and pure immersion.', 'challenge'),
        sv_hide_vitals: S('Hide vitals', '❤', 'Hides the food/water/temperature/noise panel.', 'challenge'),
        sv_hide_hotbar: S('Hide the hotbar', '🎛', 'Hides the hotbar (keys still work).', 'challenge'),
        sv_hide_objective: S('Hide objective & chips', '📌', 'Hides the objective banner and status chips at the top.', 'challenge'),
        sv_hide_tracker: S('Hide quest & contract tracker', '📜', 'Hides the right-hand quest and contract list.', 'challenge'),
        sv_hide_xp: S('Hide XP bar & streaks', '⭐', 'Hides the level bar, kill streak callouts and XP ticks.', 'challenge'),
        sv_hide_plates: S('Hide champion nameplates', '🏷', 'Champions are not labelled.', 'challenge'),
        sv_no_fall: S('No falling damage', '🪂', 'Fall from anywhere without a scratch or a broken leg.'),
        sv_no_npcs: S('No NPCs', '🚫', 'Removes the Pit Masters and distress-call survivors.', 'challenge'),
        sv_no_animals: S('No animals', '🦌', 'No wildlife roams the Zone (and no hunting quests).', 'challenge'),
        sv_passive_enemies: S('Enemies ignore you', '😇', 'Infected and animals never target you. Explore in peace.'),
        sv_no_weather: S('No weather at all', '🌤', 'Permanently clear skies everywhere: no rain, fog, ash, blizzards or storms.'),
        sv_no_rain: S('No rain or snow', '☂', 'Rain, ash rain and blizzards never fall. Fog and overcast still roll in.'),
        sv_no_sun: S('No sunshine', '☁', 'A permanently grey, overcast sky with dim light.', 'chaos'),
        sv_no_vehicles: S('No vehicles', '🚳', 'Vehicles, the handcar and fast travel are disabled.', 'challenge'),
        sv_free_craft: S('Free building & crafting', '🆓', 'Build and craft anything without paying its cost.'),
        sv_max_level: S('Start at max level', '🏆', 'Begin at survivor level 30 with every perk at its maximum rank.'),
        sv_all_unlocks: S('Everything unlocked', '🔓', 'All research, recipes, vehicles and arena duels are unlocked from the start.'),
        sv_max_backpack: S('Biggest backpack', '🎒', 'Start with the Hauler frame, the largest pack.'),
        sv_unlimited_backpack: S('Unlimited backpack', '♾', 'No weight limit and no slot limit.'),
        sv_master_map: S('Master map', '🗺', 'The map shows every region, infested site, stash, dungeon, parked vehicle, rare weapon, Pit Master and live boss.'),
        sv_all_enemies: S('Full roster from day one', '👹', 'All 70 infected types can appear from the very first day.', 'chaos'),
        sv_master_box: S('Box of Wonders', '🎁', 'A glowing box beside the crash holds unlimited copies of every item, weapon, vehicle and piece of gear.'),
        sv_god_mode: S('God mode', '🛡', 'You cannot be hurt.'),
        sv_infinite_ammo: S('Infinite ammo', '🔫', 'Magazines never empty.'),
        sv_one_hit: S('One-hit kills', '💀', 'Every hit kills — bosses included.', 'chaos'),
        sv_no_radiation: S('No radiation', '☢', 'Radiation never builds up.'),
        sv_no_temperature: S('No cold or heat', '🌡', 'Body temperature stays comfortable everywhere.'),
        sv_double_loot: S('Double loot', '💰', 'Containers, stashes and animal drops give twice as much.'),
        sv_iron_gut: S('Iron stomach', '🥩', 'Raw food never makes you sick.'),
        sv_no_wear: S('Unbreakable gear', '🔧', 'Weapons and tools never lose condition.'),
        sv_speed_boost: S('Fleet-footed', '💨', 'Move 40% faster on foot.'),
        sv_xp_boost: S('Triple XP', '📈', 'Earn survivor XP three times as fast.'),
        sv_no_infest: S('No infested sites', '🏳', 'Buildings and outdoor sites stand empty; their stashes are free to open.'),
        sv_no_hordes: S('No horde nights', '🌙', 'Horde nights never happen.'),
        sv_no_champions: S('No champions', '🚷', 'No champion infected appear (bounties excepted).'),
        sv_no_events: S('No world events', '🔕', 'No airdrops, herds, distress calls or Lantern surges.'),
        sv_fast_days: S('Fast days', '⏩', 'Days pass twice as fast.', 'chaos'),
        sv_slow_days: S('Slow days', '⏪', 'Days last twice as long.')
    };
    Object.assign(R.modifiers, MODS);
    if (Array.isArray(R.categories) && !R.categories.some((c) => c.id === 'sandbox')) R.categories.unshift({ id: 'sandbox', name: 'Sandbox & custom rules', icon: '🛠', col: '#8fe3c8' });

    const has = (id) => !!BO.SurvivalMode?.campaign?.has?.(id);

    class ZoneSandbox {
        install() {
            if (this._done) return;
            this._done = true;
            const C = BO.SurvivalCampaign.prototype;
            const night = Object.getOwnPropertyDescriptor(C, 'isNight');
            Object.defineProperty(C, 'isNight', { configurable: true, get() { if (this.has('sv_no_night')) return false; if (this.has('sv_always_night')) return true; return night.get.call(this); } });
            const dark = Object.getOwnPropertyDescriptor(C, 'darkness');
            Object.defineProperty(C, 'darkness', { configurable: true, get() { if (this.has('sv_no_night')) return 0; if (this.has('sv_always_night')) return 1; return dark.get.call(this) * (this.has('sv_no_sun') ? 1 : 1); } });
            const hasVehicle = C.hasVehicle;
            C.hasVehicle = function (id) { return this.has('sv_all_unlocks') || hasVehicle.call(this, id); };
            const ride = C.ride;
            C.ride = function (id) { if (id && this.has('sv_no_vehicles')) { this.mode.toast('Vehicles are disabled for this expedition.'); return false; } return ride.call(this, id); };
            const travel = C.travel;
            C.travel = function (id) { if (this.has('sv_no_vehicles')) return false; return travel.call(this, id); };
            const D = BO.SurvivalDeepSystems?.prototype;
            if (D?.hasTech) { const ht = D.hasTech; D.hasTech = function (id) { return has('sv_all_unlocks') || ht.call(this, id); }; }
            const P = BO.SurvivalPack.prototype;
            const lim = Object.getOwnPropertyDescriptor(P, 'limits');
            if (lim?.get) Object.defineProperty(P, 'limits', { configurable: true, get() { const l = lim.get.call(this); return has('sv_unlimited_backpack') ? { ...l, weight: 99999, slots: 999 } : l; } });
            // Free crafting: the mode's purse always says yes.
            const m = BO.SurvivalMode;
            const afford = m.canAfford.bind(m), spend = m.spend.bind(m);
            m.canAfford = (cost) => has('sv_free_craft') || afford(cost);
            m.spend = (cost) => (has('sv_free_craft') ? true : spend(cost));
            // Passive enemies: never detect or chase you.
            const Dir = BO.ZoneDirector;
            const senses = Dir.updateSenses.bind(Dir);
            Dir.updateSenses = function () { senses(); if (has('sv_passive_enemies')) { for (const z of this.mode.zombies) if (z.zs?.state === 'hunt') { z.zs.state = 'idle'; z.zs.home = { x: z.pos.x, z: z.pos.z }; } this.detected = 0; } };
            const tgt = Dir.getTarget.bind(Dir);
            Dir.getTarget = function (zb) { if (has('sv_passive_enemies') && !zb.horde) { const s = this.sense(zb); if (s.state === 'hunt') s.state = 'idle'; } return tgt(zb); };
            // World events off.
            const Ev = BO.ZoneEvents;
            const evUpdate = Ev.update.bind(Ev);
            Ev.update = (dt) => { if (has('sv_no_events')) return; evUpdate(dt); };
            const trig = Ev.trigger.bind(Ev);
            Ev.trigger = (kind) => { if (has('sv_no_npcs') && kind === 'distress') return null; const e = trig(kind); return e; };
            const H = BO.ZoneHorde;
            if (H?.update) { const hu = H.update.bind(H); H.update = (dt) => { if (has('sv_no_hordes')) return; hu(dt); }; }
            // Champions off.
            const T = BO.ZoneThrill;
            const cc = T.championChance.bind(T);
            T.championChance = (x, z) => (has('sv_no_champions') ? 0 : cc(x, z));
        }

        /** Once per run, before the world starts moving. */
        start(mode, resumed) {
            this.install();
            this.mode = mode;
            const c = mode.campaign, p = BO.Player;
            const body = document.body.classList;
            for (const k of ['sv_hide_hud', 'sv_hide_vitals', 'sv_hide_hotbar', 'sv_hide_objective', 'sv_hide_tracker', 'sv_hide_xp', 'sv_hide_plates', 'sv_no_compass']) body.toggle(k.replace(/_/g, '-'), c.has(k));
            if (!resumed) {
                if (c.has('sv_fast_days')) c.options.dayLength = Math.max(60, c.options.dayLength / 2);
                if (c.has('sv_slow_days')) c.options.dayLength = c.options.dayLength * 2;
                if (c.has('sv_max_backpack') || c.has('sv_unlimited_backpack')) c.pack.level = BO.SurvivalFrontierData.packs.length - 1;
                if (c.has('sv_max_level') && BO.ZoneThrill) {
                    const T = BO.ZoneThrill;
                    T.level = 30;
                    for (const pk of T.PERKS) T.ranks[pk.id] = pk.max;
                    T.applyAll();
                }
                if (c.has('sv_all_unlocks')) for (const v of BO.SurvivalCampaignData.vehicles) c.vehicles.add(v.id);
            }
            if (c.has('sv_no_infest') && BO.ZoneInfest) { for (const s of BO.ZoneInfest.sites) s.cleared = true; BO.ZoneInfest.applyFlags(); }
            if (c.has('sv_master_map')) for (const r of BO.Zone.REGIONS) c.visited.add(r.id);
            if (c.has('sv_god_mode')) p.hp = p.maxHp;
        }

        stop() {
            const body = document.body.classList;
            for (const k of [...body]) if (k.startsWith('sv-hide-') || k === 'sv-no-compass') body.remove(k);
            this.mode = null;
        }

        /** Per-frame upkeep for the switches that are states rather than hooks. */
        update() {
            const m = this.mode;
            if (!m?.active) return;
            const c = m.campaign, p = BO.Player, deep = c.deep;
            if (c.has('sv_no_hunger')) { m.hunger = 100; if (deep) deep.hydration = 100; }
            if (c.has('sv_no_stamina')) p.tacStamina = 1;
            if (c.has('sv_god_mode') && p.alive) { p.hp = p.maxHp; if (deep) deep.bleeding = 0; }
            if (c.has('sv_no_radiation')) m.radiation = 0;
            if (c.has('sv_no_temperature') && deep) deep.temp = 21;
            if (c.has('sv_no_fall')) m.fallPeak = 0;
            const w = p.activeWeapon;
            if (c.has('sv_infinite_ammo') && w && w.stats.kind !== 'melee') { w.mag = w.stats.magSize; p.reloading = false; }
            if (c.has('sv_no_wear')) { for (const x of p.weapons) x.cond = Math.max(x.cond ?? 100, 100); const pk = c.pack; if (pk.equipped && BO.SurvivalFrontierData.tools[pk.equipped]) pk.tools[pk.equipped] = BO.SurvivalFrontierData.tools[pk.equipped].wear; }
            if (c.has('sv_no_weather') || c.has('sv_no_sun')) { m.weather = c.has('sv_no_weather') ? 'Clear' : 'Overcast'; m.localWeather = m.weather; }
            else if (c.has('sv_no_rain') && /rain|blizzard|storm|snow/i.test(m.localWeather || '')) m.localWeather = 'Overcast';
            if (c.has('sv_no_sun') && m.weatherLight) m.weatherLight.intensity = Math.min(m.weatherLight.intensity, 0.55);
        }

        /** Multipliers other systems ask for. */
        fx(out) {
            if (has('sv_no_cooldowns')) out.gatherSpeedMult = (out.gatherSpeedMult ?? 1) * 20;
            if (has('sv_speed_boost')) out.speedBonus = (out.speedBonus || 0) + 0.4;
            if (has('sv_xp_boost')) out.xpMult = (out.xpMult ?? 1) * 3;
        }
    }

    BO.ZoneSandbox = new ZoneSandbox();
})(window.BO);
