/* ============================================================================
   BLACKOUT OPS — Thrill systems for the Exclusion Zone
   The moment-to-moment reasons to keep playing:
   · Run levels: every kill, find and secured site earns XP. Each level offers a
     choice of three perk cards (roguelite-style), so every expedition builds a
     different survivor. Cards open only when you are out of combat.
   · Weapon rarity: found guns roll Common → Legendary with traits (Vampiric,
     Incendiary, Arc Rounds…). Dropped weapons stand under a coloured loot beam.
   · Champions: elite infected with affixes (Armored, Swift, Volatile, Brute,
     Regenerating, Shrieker, Venomous) and a nameplate. They drop the good stuff.
   · Juice: kill streaks, XP ticks, level-up fanfare, weapon cards.
============================================================================ */
(function (BO) {
    'use strict';

    /* ================================================================ rarity */
    const RARITY = [
        { id: 'common', name: 'Common', css: '#c9cdd2', hex: 0xc9cdd2, dmg: 1.00, perks: 0, w: 50 },
        { id: 'uncommon', name: 'Uncommon', css: '#5fd17a', hex: 0x5fd17a, dmg: 1.07, perks: 1, w: 29 },
        { id: 'rare', name: 'Rare', css: '#4aa8ff', hex: 0x4aa8ff, dmg: 1.15, perks: 1, w: 14 },
        { id: 'epic', name: 'Epic', css: '#b26bff', hex: 0xb26bff, dmg: 1.24, perks: 2, w: 5.4 },
        { id: 'legendary', name: 'Legendary', css: '#ffb43a', hex: 0xffb43a, dmg: 1.34, perks: 3, w: 1.6 }
    ];
    const RIDX = Object.fromEntries(RARITY.map((r, i) => [r.id, i]));

    /** Weapon traits. kind: 'gun' (firearms only) or 'any'. */
    const WPERKS = {
        hollow: { name: 'Hollow Point', desc: '+15% damage.', kind: 'any' },
        marksman: { name: 'Marksman', desc: 'Headshots deal +40% damage.', kind: 'gun' },
        extended: { name: 'Extended Mag', desc: '+40% magazine size.', kind: 'gun' },
        speedload: { name: 'Speed Loader', desc: 'Reloads 30% faster.', kind: 'gun' },
        hair: { name: 'Hair Trigger', desc: '+15% rate of fire.', kind: 'gun' },
        vamp: { name: 'Vampiric', desc: 'Kills heal 6 HP.', kind: 'any' },
        incend: { name: 'Incendiary', desc: 'Hits have a 25% chance to set the target on fire.', kind: 'any' },
        explo: { name: 'Explosive Tips', desc: 'Headshot kills detonate, hurting everything within 3 m.', kind: 'gun' },
        frenzy: { name: 'Frenzy', desc: 'Each kill grants +8% damage for 5 s (stacks 5×).', kind: 'any' },
        recycler: { name: 'Recycler', desc: 'Kills put 1–2 rounds back in the magazine.', kind: 'gun' },
        silent: { name: 'Whisper', desc: 'Built-in suppressor: shots are heard from 22 m.', kind: 'gun' },
        durable: { name: 'Ironclad', desc: 'Never wears down and never jams.', kind: 'any' },
        arc: { name: 'Arc Rounds', desc: '15% of hits arc to another enemy within 7 m for half damage.', kind: 'gun' },
        bounty: { name: 'Bounty Hunter', desc: 'Kills have a 20% chance to drop ammunition or salvage.', kind: 'any' },
        stagger: { name: 'Thumper', desc: 'Hits have a 30% chance to stagger the target.', kind: 'any' }
    };
    const LEGEND_NAMES = ['Widowmaker', 'Gravedigger', 'Last Rites', 'Old Faithful', 'Lantern\'s Eye', 'Quiet Mercy', 'Ashfall', 'The Warden\'s Due',
        'Deadline', 'Hollow King', 'Salt & Iron', 'Requiem', 'Black Pine', 'Nightjar', 'Cold Comfort', 'Kessler\'s Promise'];

    /* ================================================================ run perks */
    // r = rank (1-based) for the description. rar: c common, r rare, e epic. min = minimum level to be offered.
    const PERKS = [
        { id: 'deadeye', cat: 'Combat', icon: '🎯', rar: 'c', max: 3, name: 'Deadeye', desc: (r) => `Headshots deal +${25 * r}% damage.` },
        { id: 'hollow', cat: 'Combat', icon: '🔩', rar: 'c', max: 3, name: 'Hollow Points', desc: (r) => `Firearms deal +${10 * r}% damage.` },
        { id: 'brawler', cat: 'Combat', icon: '👊', rar: 'c', max: 2, name: 'Brawler', desc: (r) => `Melee deals +${40 * r}% damage and melee kills heal ${5 * r} HP.` },
        { id: 'quickhands', cat: 'Combat', icon: '✋', rar: 'c', max: 2, name: 'Quick Hands', desc: (r) => `Reload ${15 * r}% faster.` },
        { id: 'bigmags', cat: 'Combat', icon: '📦', rar: 'c', max: 2, name: 'Big Mags', desc: (r) => `+${20 * r}% magazine size on every gun.` },
        { id: 'trigger', cat: 'Combat', icon: '⚡', rar: 'c', max: 2, name: 'Trigger Discipline', desc: (r) => `+${8 * r}% rate of fire.` },
        { id: 'steady', cat: 'Combat', icon: '🧘', rar: 'c', max: 2, name: 'Steady Aim', desc: (r) => `${20 * r}% less recoil.` },
        { id: 'overwatch', cat: 'Combat', icon: '🔭', rar: 'c', max: 2, name: 'Overwatch', desc: (r) => `+${25 * r}% damage to targets more than 30 m away.` },
        { id: 'cqc', cat: 'Combat', icon: '🗡️', rar: 'c', max: 2, name: 'Close Quarters', desc: (r) => `+${20 * r}% damage to targets within 8 m.` },
        { id: 'bloodlust', cat: 'Combat', icon: '🩸', rar: 'r', max: 3, name: 'Bloodlust', desc: (r) => `Every kill heals ${3 * r} HP.` },
        { id: 'adrenaline', cat: 'Combat', icon: '💨', rar: 'r', max: 2, name: 'Adrenaline', desc: (r) => `Kills give +${12 * r}% move speed for 4 seconds.` },
        { id: 'executioner', cat: 'Combat', icon: '🪓', rar: 'r', max: 2, name: 'Executioner', desc: (r) => `+${30 * r}% damage to champions and named infected.` },
        { id: 'chain', cat: 'Combat', icon: '💥', rar: 'r', max: 2, name: 'Chain Reaction', desc: (r) => `Infected you kill have a ${10 * r}% chance to burst, hurting everything within 3 m.` },
        { id: 'assassin', cat: 'Stealth', icon: '🥷', rar: 'r', max: 2, name: 'Assassin', desc: (r) => `+${100 * r}% damage to infected that have not noticed you.` },
        { id: 'lightstep', cat: 'Stealth', icon: '👣', rar: 'c', max: 2, name: 'Light Step', desc: (r) => `Footsteps are ${25 * r}% quieter and gunshots carry ${15 * r}% less far.` },
        { id: 'thick', cat: 'Survival', icon: '❤️', rar: 'c', max: 3, name: 'Thick Skin', desc: (r) => `+${15 * r} maximum health.` },
        { id: 'kevlar', cat: 'Survival', icon: '🛡️', rar: 'c', max: 3, name: 'Hardened', desc: (r) => `Take ${7 * r}% less damage.` },
        { id: 'secondwind', cat: 'Survival', icon: '🌬️', rar: 'r', max: 2, name: 'Second Wind', desc: (r) => `Out of combat for 6 s, regenerate ${1.5 * r} HP per second.` },
        { id: 'stomach', cat: 'Survival', icon: '🥫', rar: 'c', max: 2, name: 'Iron Stomach', desc: (r) => `Hunger and thirst drain ${20 * r}% slower.` },
        { id: 'marathon', cat: 'Survival', icon: '🏃', rar: 'c', max: 2, name: 'Marathon', desc: (r) => `+${4 * r}% move speed and ${25 * r}% faster stamina recovery.` },
        { id: 'medic', cat: 'Survival', icon: '🩹', rar: 'c', max: 2, name: 'Field Medic', desc: (r) => `Healing items restore ${30 * r}% more.` },
        { id: 'mule', cat: 'Survival', icon: '🎒', rar: 'c', max: 3, name: 'Pack Mule', desc: (r) => `+${8 * r} kg carry capacity.` },
        { id: 'laststand', cat: 'Survival', icon: '✝️', rar: 'r', max: 1, name: 'Not Today', desc: () => 'Once per life, a killing blow leaves you at 1 HP and invulnerable for 2.5 s.' },
        { id: 'lucky', cat: 'Scavenging', icon: '🍀', rar: 'c', max: 3, name: 'Lucky Find', desc: (r) => `Containers and stashes give ${20 * r}% more.` },
        { id: 'gunluck', cat: 'Scavenging', icon: '🌟', rar: 'r', max: 2, name: 'Gunsmith\'s Luck', desc: (r) => `Found weapons roll higher rarity (luck +${r}).` },
        { id: 'quicksearch', cat: 'Scavenging', icon: '🔍', rar: 'c', max: 2, name: 'Quick Search', desc: (r) => `Search containers ${25 * r}% faster.` },
        { id: 'lumberjack', cat: 'Scavenging', icon: '🪵', rar: 'c', max: 2, name: 'Lumberjack', desc: (r) => `Harvest trees, rock and ore ${25 * r}% faster.` },
        { id: 'scaveye', cat: 'Scavenging', icon: '🧲', rar: 'r', max: 2, name: 'Scavenger\'s Eye', desc: (r) => `Kills have a ${15 * r}% chance to drop ammunition for the gun you hold.` },
        { id: 'treasure', cat: 'Scavenging', icon: '🗺️', rar: 'r', max: 1, name: 'Treasure Hunter', desc: () => 'Every infested site and stash in the Zone is revealed on your map.' },
        { id: 'engineer', cat: 'Building', icon: '🧱', rar: 'c', max: 2, name: 'Engineer', desc: (r) => `Structures you build have +${25 * r}% health.` },
        { id: 'turrets', cat: 'Building', icon: '🔫', rar: 'c', max: 2, name: 'Turret Tech', desc: (r) => `Turrets and traps deal +${30 * r}% damage.` },
        { id: 'ricochet', cat: 'Legend', icon: '↯', rar: 'e', max: 1, min: 4, name: 'Ricochet', desc: () => '20% of your bullets ricochet into another enemy within 8 m for half damage.' },
        { id: 'berserker', cat: 'Legend', icon: '😡', rar: 'e', max: 1, min: 4, name: 'Berserker', desc: () => 'Below 35% health you deal +40% damage and move 15% faster.' },
        { id: 'vampire', cat: 'Legend', icon: '🧛', rar: 'e', max: 1, min: 4, name: 'Vampire', desc: () => 'Headshot kills heal 10 HP.' },
        { id: 'momentum', cat: 'Legend', icon: '🔥', rar: 'e', max: 1, min: 5, name: 'Momentum', desc: () => 'Each kill within 5 s of the last stacks +6% damage, up to +60%.' },
        { id: 'ghost', cat: 'Legend', icon: '👻', rar: 'e', max: 1, min: 5, name: 'Ghost', desc: () => 'While crouched you are silent and 25% harder to see.' },
        { id: 'demolitions', cat: 'Legend', icon: '💣', rar: 'e', max: 1, min: 3, name: 'Demolitions', desc: () => 'Gain a frag grenade every 2½ minutes (up to 3), and start with 2.' }
    ];
    const PERK = Object.fromEntries(PERKS.map((p) => [p.id, p]));
    const RAR_STYLE = { c: { name: 'Common', css: '#cfd6dc' }, r: { name: 'Rare', css: '#4aa8ff' }, e: { name: 'Epic', css: '#ffb43a' } };

    /* ================================================================ champions */
    const AFFIX = {
        armored: { name: 'Armored', css: '#9fb7c9', hex: 0x9fb7c9, desc: 'Body shots do half damage — aim for the head.' },
        swift: { name: 'Swift', css: '#ffe066', hex: 0xffe066, desc: '50% faster.' },
        volatile: { name: 'Volatile', css: '#ff8a3d', hex: 0xff6a1a, desc: 'Explodes when it dies.' },
        brute: { name: 'Brute', css: '#ff5a5a', hex: 0xff3b3b, desc: 'Bigger, tougher, hits harder.' },
        regen: { name: 'Regenerating', css: '#5fe39a', hex: 0x3fdc84, desc: 'Heals quickly when not taking damage.' },
        shrieker: { name: 'Shrieker', css: '#c88bff', hex: 0xb46bff, desc: 'Screams when it sees you, calling every infected nearby.' },
        venom: { name: 'Venomous', css: '#b7f04a', hex: 0x9be22a, desc: 'Hits cause bleeding and infection.' }
    };
    const AFFIX_IDS = Object.keys(AFFIX);

    const RARITY_FOR_TIER = (tier) => Math.max(1, Math.min(4, tier || 1));
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    class ZoneThrill {
        constructor() {
            this.ranks = {};
            this.reset();
        }

        get mode() { return BO.SurvivalMode; }
        get campaign() { return BO.SurvivalMode?.campaign; }
        get active() { return !!(this.mode_ && this.mode_.active); }

        reset() {
            this.xpTotal = 0;
            this.level = 1;
            this.xpInto = 0;
            this.pending = 0;
            this.ranks = {};
            this.rerolls = 1;
            this.streak = 0;
            this.streakT = 0;
            this.multi = 0;
            this.multiT = 0;
            this.frenzy = 0;
            this.frenzyT = 0;
            this.momentum = 0;
            this.momentumT = 0;
            this.adrenalineT = 0;
            this.lastHurt = -99;
            this.calm = 0;
            this.lastStandUsed = false;
            this.deathsSeen = 0;
            this.nextFrag = 150;
            this.picking = null;
            this.champions = [];
            this.ticks = [];
            this.stats = { headshots: 0, champions: 0, bestStreak: 0, legendaries: 0 };
        }

        /* ------------------------------------------------------------ lifecycle */
        start(mode, saved) {
            this.install();
            this.stop();
            this.mode_ = mode;
            this.reset();
            if (saved) this.restore(saved);
            this.deathsSeen = mode.deaths || 0;
            this.buildHud();
            this.applyAll();
        }

        stop() {
            this.closePick(true);
            for (const ch of this.champions) ch.plate?.remove();
            this.champions = [];
            this.mode_ = null;
            if (this.hud) this.hud.root.hidden = true;
        }

        snapshot() {
            return { xp: this.xpTotal, level: this.level, into: this.xpInto, pending: this.pending, ranks: this.ranks, rerolls: this.rerolls, stats: this.stats, nextFrag: this.nextFrag };
        }

        restore(s) {
            this.xpTotal = s.xp || 0;
            this.level = s.level || 1;
            this.xpInto = s.into || 0;
            this.pending = s.pending || 0;
            this.ranks = { ...(s.ranks || {}) };
            this.rerolls = s.rerolls ?? 1;
            this.stats = { ...this.stats, ...(s.stats || {}) };
            this.nextFrag = s.nextFrag || 150;
        }

        /** One-time method wrappers on shared engine objects. */
        install() {
            if (this._installed) return;
            this._installed = true;
            const self = this;
            const P = BO.Player;
            // Weapons carry their rarity and traits in cfg, so saves and pickups keep them.
            const create = P._createWeaponInstance;
            P._createWeaponInstance = function (cfg, ...rest) {
                const w = create.call(this, cfg, ...rest);
                if (BO.State.activeMode === 'survival') self.refit(w);
                return w;
            };
            const hurt = P.takeDamage;
            P.takeDamage = function (amount, ...rest) {
                if (BO.State.activeMode === 'survival' && self.active && this.alive) {
                    amount *= self.damageTakenMult();
                    if (self.campaign?.has('sv_god_mode')) amount = 0;
                    if (self.rank('laststand') && !self.lastStandUsed && amount >= this.hp && !this.inLastStand && !(this.invulnTimer > 0)) {
                        self.lastStandUsed = true;
                        amount = Math.max(0, this.hp - 1);
                        this.invulnTimer = 2.5;
                        BO.Events.emit('hud:banner', { title: 'NOT TODAY', sub: 'LAST STAND · 2.5 S INVULNERABLE', color: '#ff6b6b' });
                        BO.Sound?.playKillstreakReady?.();
                    }
                    self.lastHurt = self.mode_.clock;
                }
                return hurt.call(this, amount, ...rest);
            };
            const Deep = BO.SurvivalDeepSystems;
            const proto = Deep?.prototype || BO.SurvivalMode?.campaign?.deep && Object.getPrototypeOf(BO.SurvivalMode.campaign.deep);
            if (proto && proto._computeModFx) {
                const compute = proto._computeModFx;
                proto._computeModFx = function () {
                    const out = compute.call(this) || this.modFx || {};
                    self.mergeFx(out);
                    this.modFx = out;
                    return out;
                };
            }
            const C = BO.SurvivalCampaign.prototype;
            const mark = C.mark;
            C.mark = function (key, delta, xp = 0) {
                mark.call(this, key, delta, xp);
                if (xp > 0 && self.active) self.xp(xp * (this.deep?.modFx?.xpMult || 1), null, true);
            };
            const desc = Object.getOwnPropertyDescriptor(C, 'speed');
            if (desc?.get) {
                Object.defineProperty(C, 'speed', {
                    configurable: true,
                    get() { return desc.get.call(this) * (self.active ? self.speedMult() : 1); }
                });
            }
        }

        rank(id) { return this.ranks[id] || 0; }

        /* ------------------------------------------------------------ fx plumbing */
        mergeFx(out) {
            if (!this.active && !this.mode_) return;
            const r = (id) => this.rank(id);
            const mul = (k, v) => { if (v !== 1) out[k] = (out[k] ?? 1) * v; };
            const add = (k, v) => { if (v) out[k] = (out[k] || 0) + v; };
            add('maxHpDelta', 15 * r('thick'));
            add('speedBonus', 0.04 * r('marathon'));
            mul('staminaRegenMult', 1 + 0.25 * r('marathon'));
            mul('hungerDrainMult', 1 - 0.2 * r('stomach'));
            mul('hydDrainMult', 1 - 0.2 * r('stomach'));
            mul('healItemMult', 1 + 0.3 * r('medic'));
            add('bonusCarryKg', 8 * r('mule'));
            mul('gatherSpeedMult', 1 + 0.25 * r('lumberjack'));
            mul('structureHpMult', 1 + 0.25 * r('engineer'));
            mul('turretDmgMult', 1 + 0.3 * r('turrets'));
            mul('trapDmgMult', 1 + 0.3 * r('turrets'));
            mul('recoilMult', 1 - 0.2 * r('steady'));
            BO.ZoneSandbox?.fx(out);
        }

        /** Re-derive everything perks touch: modFx, max HP, weapon stats. */
        applyAll() {
            const c = this.campaign;
            if (!c) return;
            c.deep?._computeModFx?.();
            c.deep?.recomputePlayerStats?.();
            for (const w of BO.Player.weapons) this.refit(w);
        }

        damageTakenMult() { return Math.max(0.5, 1 - 0.07 * this.rank('kevlar')); }

        speedMult() {
            const p = BO.Player;
            let m = 1;
            if (this.adrenalineT > 0) m *= 1 + 0.12 * this.rank('adrenaline');
            if (this.rank('berserker') && p.hp / p.maxHp < 0.35) m *= 1.15;
            return m;
        }

        lootMult() { return (1 + 0.2 * this.rank('lucky')) * (this.campaign?.has('sv_double_loot') ? 2 : 1); }
        searchMult() { return this.campaign?.has('sv_no_cooldowns') ? 0.02 : Math.max(0.4, 1 - 0.25 * this.rank('quicksearch')); }
        hearMult() {
            const p = BO.Player;
            if (this.rank('ghost') && p.crouching) return 0;
            return Math.max(0.3, 1 - 0.25 * this.rank('lightstep'));
        }
        sightMult() { return this.rank('ghost') && BO.Player.crouching ? 0.75 : 1; }
        shotNoiseMult() { return Math.max(0.4, 1 - 0.15 * this.rank('lightstep')); }

        /* ------------------------------------------------------------ XP & levels */
        need(level) { return 70 + 45 * level + 4 * level * level; }

        xp(n, label, quiet) {
            if (!this.active || !(n > 0)) return;
            n = Math.round(n * (this.mode_.tierSpec?.xp || 1) * (this.campaign?.has('sv_xp_boost') && !quiet ? 3 : 1));
            this.xpTotal += n;
            this.xpInto += n;
            if (!quiet || n >= 20) this.tick('+' + n + ' XP' + (label ? ' · ' + label : ''), label ? '#ffd27a' : '#e8edf2');
            let leveled = false;
            while (this.xpInto >= this.need(this.level)) {
                this.xpInto -= this.need(this.level);
                this.level++;
                this.pending++;
                leveled = true;
            }
            if (leveled) {
                const c = this.campaign;
                if (c) c.metrics.survivorLevel = Math.max(c.metrics.survivorLevel || 0, this.level);
                const p = BO.Player;
                p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.25);
                BO.Sound?.playRankUp?.();
                BO.Events.emit('hud:banner', { title: 'LEVEL ' + this.level, sub: 'PERK READY · CHOOSE WHEN THE COAST IS CLEAR (' + BO.Settings.keyLabel(BO.Settings.getKeybinds().survSkills || 'KeyK') + ')', color: '#ffd27a' });
                this.calm = 0;
            }
        }

        /* ------------------------------------------------------------ perk cards */
        offer() {
            const lvl = this.level;
            const pool = PERKS.filter((p) => this.rank(p.id) < p.max && (!p.min || lvl >= p.min));
            if (!pool.length) return [];
            const weight = (p) => (p.rar === 'c' ? 10 : p.rar === 'r' ? 5 : 2.2 + lvl * 0.15) * (this.rank(p.id) ? 1.25 : 1);
            const picks = [];
            const bag = [...pool];
            while (picks.length < 3 && bag.length) {
                const total = bag.reduce((s, p) => s + weight(p), 0);
                let roll = Math.random() * total;
                let k = 0;
                for (; k < bag.length; k++) { roll -= weight(bag[k]); if (roll <= 0) break; }
                picks.push(bag.splice(Math.min(k, bag.length - 1), 1)[0]);
            }
            return picks;
        }

        canOpenPick() {
            const m = this.mode_;
            if (!m || !this.pending || this.picking) return false;
            if (!BO.Player.alive || BO.SurvivalUI.open || BO.State.paused || BO.ZoneBuild?.active) return false;
            if (BO.ZoneHorde?.active || BO.ZoneFinale?.active) return false;
            return true;
        }

        openPick(force) {
            if (!this.canOpenPick()) return false;
            if (!force && BO.ZoneDirector.detected > 0) return false;
            const cards = this.offer();
            if (!cards.length) { this.pending = 0; return false; }
            this.picking = { cards };
            if (document.pointerLockElement) document.exitPointerLock();
            this.renderPick();
            BO.Sound?.playMedal?.();
            return true;
        }

        renderPick() {
            const h = this.hud;
            const pk = this.picking;
            if (!h || !pk) return;
            const keyFor = (i) => String(i + 1);
            h.pick.innerHTML = `<div class="zt-pick-in">
                <header><b>LEVEL ${this.level - this.pending + 1}</b><span>Choose a perk${this.pending > 1 ? ' · ' + this.pending + ' to pick' : ''}</span></header>
                <div class="zt-cards">${pk.cards.map((p, i) => {
                    const r = this.rank(p.id) + 1;
                    const st = RAR_STYLE[p.rar];
                    return `<button class="zt-card rar-${p.rar}" data-zt-pick="${i}" style="--rc:${st.css}">
                        <i class="zt-key">${keyFor(i)}</i>
                        <em class="zt-ico">${p.icon}</em>
                        <b>${esc(p.name)}</b>
                        <small class="zt-cat">${esc(p.cat)} · ${st.name}${p.max > 1 ? ' · rank ' + r + '/' + p.max : ''}</small>
                        <p>${esc(p.desc(r))}</p>
                        ${r > 1 ? `<s>was: ${esc(p.desc(r - 1))}</s>` : ''}
                    </button>`;
                }).join('')}</div>
                <footer>
                    <button class="zt-reroll" data-zt-reroll ${this.rerolls > 0 ? '' : 'disabled'}>⟳ Reroll <small>R · ${this.rerolls} left</small></button>
                    <span class="zt-owned">${Object.entries(this.ranks).map(([id, n]) => PERK[id] ? `<i title="${esc(PERK[id].name + ' ' + n + '/' + PERK[id].max + ' — ' + PERK[id].desc(n))}">${PERK[id].icon}${n > 1 ? '<sup>' + n + '</sup>' : ''}</i>` : '').join('')}</span>
                    <button class="zt-later" data-zt-later>Later <small>Esc</small></button>
                </footer></div>`;
            h.pick.hidden = false;
            h.pick.onclick = (e) => {
                const b = e.target.closest('[data-zt-pick]');
                if (b) { this.choose(+b.dataset.ztPick); return; }
                if (e.target.closest('[data-zt-reroll]')) { this.reroll(); return; }
                if (e.target.closest('[data-zt-later]')) this.closePick();
            };
        }

        handleKey(e) {
            if (!this.picking) return false;
            e.preventDefault();
            if (e.repeat) return true;
            const n = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[e.code];
            if (n !== undefined) this.choose(n);
            else if (e.code === 'KeyR') this.reroll();
            else if (e.code === 'Escape') this.closePick();
            return true;
        }

        reroll() {
            if (!this.picking || this.rerolls <= 0) return;
            this.rerolls--;
            this.picking.cards = this.offer();
            BO.Sound?.playUIClick?.();
            this.renderPick();
        }

        choose(i) {
            const pk = this.picking;
            const p = pk?.cards[i];
            if (!p) return;
            this.ranks[p.id] = this.rank(p.id) + 1;
            this.pending = Math.max(0, this.pending - 1);
            if (p.id === 'demolitions') BO.Player.lethalCount = Math.max(BO.Player.lethalCount || 0, 2);
            this.applyAll();
            BO.Sound?.playPerkBuy?.();
            this.mode_.toast(p.icon + ' ' + p.name + (p.max > 1 ? ' ' + this.rank(p.id) + '/' + p.max : '') + ' — ' + p.desc(this.rank(p.id)));
            if (this.pending > 0) {
                pk.cards = this.offer();
                if (pk.cards.length) { this.renderPick(); return; }
                this.pending = 0;
            }
            this.closePick();
        }

        closePick(silent) {
            if (!this.picking) return;
            this.picking = null;
            this.calm = -6; // do not reopen straight away after "Later"
            if (this.hud) this.hud.pick.hidden = true;
            if (!silent && BO.State.screen === 'playing') BO.App?._safePointerLock?.();
        }

        /* ------------------------------------------------------------ weapons */
        /** Roll a rarity index. tier 1–4 shifts odds up; floor is the minimum index. */
        rollRarity(tier = 1, floor = 0, luck = 0) {
            luck += this.rank('gunluck');
            const ws = RARITY.map((r, i) => r.w * (i >= 2 ? 1 + (tier - 1) * 0.55 : 1) * (i >= 3 ? 1 + (tier - 1) * 0.35 : 1) * (1 + luck * i * 0.22));
            const total = ws.reduce((a, b) => a + b, 0);
            let roll = Math.random() * total, k = 0;
            for (; k < ws.length; k++) { roll -= ws[k]; if (roll <= 0) break; }
            return Math.max(floor, Math.min(4, k));
        }

        /** {rarity, perks, title} for a weapon id. */
        rollWeapon(id, tier = 1, floor = 0, luck = 0) {
            const spec = BO.WeaponsData.get(id);
            const melee = !spec || spec.kind === 'melee';
            const ri = this.rollRarity(RARITY_FOR_TIER(tier), floor, luck);
            const r = RARITY[ri];
            const pool = Object.keys(WPERKS).filter((k) => !melee || WPERKS[k].kind === 'any');
            const perks = [];
            while (perks.length < r.perks && pool.length) perks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
            const roll = { rarity: r.id, perks };
            if (r.id === 'legendary') {
                roll.title = LEGEND_NAMES[Math.floor(Math.random() * LEGEND_NAMES.length)];
                this.stats.legendaries++;
                this.campaign?.mark('legendaries', 1, 0);
            }
            return roll;
        }

        rarityOf(w) { return RARITY[RIDX[w?.cfg?.rarity ?? w?.rarity] ?? 0]; }
        has(w, perk) { return !!(w?.cfg?.perks || w?.perks || []).includes?.(perk); }

        /** Apply rarity, traits and run perks to a weapon's stats, relative to what was applied before. */
        refit(w) {
            if (!w?.stats || !w.cfg) return w;
            const melee = w.stats.kind === 'melee';
            const r = this.rarityOf(w);
            const t = (k) => this.has(w, k);
            const next = {
                dmg: r.dmg * (t('hollow') ? 1.15 : 1),
                mag: melee ? 1 : (t('extended') ? 1.4 : 1) * (1 + 0.2 * this.rank('bigmags')),
                rl: melee ? 1 : (t('speedload') ? 0.7 : 1) * (1 - 0.15 * this.rank('quickhands')) * (this.campaign?.has('sv_no_cooldowns') ? 0.1 : 1),
                rpm: melee ? 1 : (t('hair') ? 1.15 : 1) * (1 + 0.08 * this.rank('trigger'))
            };
            const prev = w._fit || { dmg: 1, mag: 1, rl: 1, rpm: 1 };
            const s = w.stats;
            s.damage = s.damage / prev.dmg * next.dmg;
            if (!melee) {
                // Relative to what we applied last time, so bench Mk upgrades made in between are kept.
                s.magSize = Math.max(1, Math.round(s.magSize / prev.mag * next.mag));
                s.reloadTime = s.reloadTime / prev.rl * next.rl;
                s.rpm = s.rpm / prev.rpm * next.rpm;
                if (t('silent')) s.suppressed = true;
            }
            w._fit = next;
            if (w.cfg.title && !s.name.startsWith('“')) s.name = '“' + w.cfg.title + '” ' + s.name;
            if (w.mag > s.magSize) w.mag = s.magSize;
            return w;
        }

        /** HTML line describing a weapon roll, used in toasts and the weapon card. */
        describe(roll, name) {
            const r = RARITY[RIDX[roll?.rarity] ?? 0];
            const traits = (roll?.perks || []).map((k) => WPERKS[k]?.name).filter(Boolean);
            return { rarity: r, title: (roll?.title ? '“' + roll.title + '” ' : '') + (name || ''), traits };
        }

        /** Vertical loot beam for a dropped weapon. */
        beamFor(roll, x, y, z) {
            const r = RARITY[RIDX[roll?.rarity] ?? 0];
            if (r.id === 'common') return null;
            const m = this.mode_ || BO.SurvivalMode;
            const h = 6 + RIDX[r.id] * 5;
            const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(r.hex).convertSRGBToLinear(), transparent: true, opacity: 0.42 + RIDX[r.id] * 0.07, fog: false, depthWrite: false, side: THREE.DoubleSide });
            const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.32, h, 8, 1, true), mat);
            beam.position.set(x, y + h / 2, z);
            m.scene.add(beam);
            if (r.id === 'legendary' || r.id === 'epic') BO.Sound?.playPaPChime?.();
            return beam;
        }

        /* ------------------------------------------------------------ combat hooks */
        /** Called by SurvivalMode.hit for the player's own hits, before damage is applied. */
        modifyHit(entity, amount, hitbox, kind) {
            if (!this.active) return amount;
            const p = BO.Player;
            const w = p.activeWeapon;
            const melee = kind === 'melee';
            const r = (id) => this.rank(id);
            let mult = 1;
            if (hitbox === 'head') mult *= 1 + 0.25 * r('deadeye') + (this.has(w, 'marksman') ? 0.4 : 0);
            if (kind === 'bullet') mult *= 1 + 0.1 * r('hollow');
            if (melee) mult *= 1 + 0.4 * r('brawler');
            const d = entity.pos ? Math.hypot(entity.pos.x - p.pos.x, entity.pos.z - p.pos.z) : 10;
            if (d > 30) mult *= 1 + 0.25 * r('overwatch');
            if (d < 8) mult *= 1 + 0.2 * r('cqc');
            if (entity.champion || entity.bossLabel) mult *= 1 + 0.3 * r('executioner');
            if (r('assassin') && entity.zs && entity.zs.state !== 'hunt') mult *= 1 + r('assassin');
            if (r('berserker') && p.hp / p.maxHp < 0.35) mult *= 1.4;
            if (this.frenzyT > 0) mult *= 1 + 0.08 * this.frenzy;
            if (this.momentumT > 0) mult *= 1 + 0.06 * this.momentum;
            if (entity.champion?.affixes.includes('armored') && hitbox !== 'head') mult *= 0.5;
            amount *= mult;
            // On-hit traits.
            if (entity.alive !== false) {
                if (this.has(w, 'incend') && Math.random() < 0.25) entity.burnTimer = Math.max(entity.burnTimer || 0, 2.5);
                if (this.has(w, 'stagger') && Math.random() < 0.3) entity.stunTimer = Math.max(entity.stunTimer || 0, 0.4);
                if (kind === 'bullet' && !this._arcing) {
                    const arc = (this.has(w, 'arc') ? 0.15 : 0) + (r('ricochet') ? 0.2 : 0);
                    if (arc && Math.random() < arc) this.arcFrom(entity, amount * 0.5, this.has(w, 'arc') ? 0x7ee8fa : 0xffd27a);
                }
            }
            if (entity.champion) entity.champion.lastHit = this.mode_.clock;
            if (this.campaign?.has('sv_one_hit')) amount = Math.max(amount, (entity.hp || 0) + 1);
            return amount;
        }

        arcFrom(src, dmg, color) {
            const m = this.mode_;
            let best = null, bd = 8;
            for (const z of m.zombies) {
                if (!z.alive || z === src) continue;
                const d = z.pos.distanceTo(src.pos);
                if (d < bd) { bd = d; best = z; }
            }
            if (!best) return;
            BO.FX.spawnTracer(src.pos.clone().setY(src.pos.y + 1.2), best.pos.clone().setY(best.pos.y + 1.2), color);
            this._arcing = true;
            m.hit(best, dmg, 'torso', null, 'bullet');
            this._arcing = false;
        }

        /** Called by SurvivalMode.hit when the player kills something. */
        onKill(entity, hitbox, kind) {
            if (!this.active) return;
            const m = this.mode_;
            const p = BO.Player;
            const w = p.activeWeapon;
            const r = (id) => this.rank(id);
            const heal = (n) => { if (n > 0 && p.alive) p.hp = Math.min(p.maxHp, p.hp + n); };
            const head = hitbox === 'head';
            if (head) this.stats.headshots++;
            const c = m.campaign;
            if (entity.spec?.id && entity.survivalType) c.mark('kill_' + entity.spec.id, 1, 0);
            if (kind === 'melee') c.mark('meleeKills', 1, 0);
            if (kind === 'explosive' || kind === 'fire') c.mark('explosiveKills', 1, 0);
            heal(3 * r('bloodlust'));
            if (kind === 'melee') heal(5 * r('brawler'));
            if (head && r('vampire')) heal(10);
            if (this.has(w, 'vamp')) heal(6);
            if (r('adrenaline')) this.adrenalineT = 4;
            if (this.has(w, 'frenzy')) { this.frenzy = Math.min(5, (this.frenzyT > 0 ? this.frenzy : 0) + 1); this.frenzyT = 5; }
            if (r('momentum')) { this.momentum = Math.min(10, (this.momentumT > 0 ? this.momentum : 0) + 1); this.momentumT = 5; }
            if (this.has(w, 'recycler') && w.stats.kind !== 'melee') w.mag = Math.min(w.stats.magSize, w.mag + 1 + (Math.random() < 0.5 ? 1 : 0));
            const pos = entity.pos.clone();
            if (entity.survivalType && !entity.champion?.affixes.includes('volatile')) {
                if ((head && this.has(w, 'explo')) || (r('chain') && Math.random() < 0.1 * r('chain'))) {
                    setTimeout(() => { if (this.active) { BO.FX.spawnExplosion(pos.clone().setY(pos.y + 1), 3, 0xff8a3d); BO.Sound?.playExplosion?.(0.45); m.explode(pos, 3.2, 60, false, 0, 'chain'); } }, 60);
                }
            }
            const cal = w ? BO.ZoneLoot.caliberOf(w) : null;
            // Infected carry odds and ends: a few rounds now and then keep the fighting sustainable.
            if (cal && entity.survivalType && Math.random() < 0.12) { const n = 2 + Math.floor(Math.random() * 4); m.points[cal] = (m.points[cal] || 0) + n; this.tick('+' + n + ' ' + BO.SurvivalItemName(cal), '#9fd4ff'); }
            if (cal && Math.random() < 0.15 * r('scaveye')) { const n = 3 + Math.floor(Math.random() * 6); m.points[cal] = (m.points[cal] || 0) + n; this.tick('+' + n + ' ' + BO.SurvivalItemName(cal), '#9fd4ff'); }
            if (this.has(w, 'bounty') && Math.random() < 0.2) m.campaign.pack.dropBag(cal ? { [cal]: 4 + Math.floor(Math.random() * 8) } : { scrap: 2 }, pos);
            // Streaks and multi-kills.
            this.streak++;
            this.streakT = 8;
            this.stats.bestStreak = Math.max(this.stats.bestStreak, this.streak);
            this.multi = this.multiT > 0 ? this.multi + 1 : 1;
            this.multiT = 2.6;
            if (this.multi >= 2) {
                const names = { 2: 'QUICK SUCCESSION', 3: 'CHAIN REACTION', 4: 'AREA CLEARED' };
                this.popup(names[this.multi] || 'MASSACRE ×' + this.multi, Math.min(25, 5 * this.multi));
            }
            if ([5, 10, 15, 25, 40, 60].includes(this.streak)) {
                const names = { 5: 'KILLING SPREE', 10: 'RAMPAGE', 15: 'UNSTOPPABLE', 25: 'ZONE REAPER', 40: 'LANTERN\'S WRATH', 60: 'EXTINCTION EVENT' };
                this.popup(names[this.streak], Math.min(90, this.streak * 2));
                BO.Sound?.playMedal?.();
            }
            if (head) this.xp(4, null, true);
        }

        popup(text, xp) {
            const h = this.hud;
            if (!h) return;
            const el = document.createElement('div');
            el.className = 'zt-pop';
            el.innerHTML = `<b>${esc(text)}</b>${xp ? `<small>+${xp} XP</small>` : ''}`;
            h.pops.prepend(el);
            while (h.pops.children.length > 3) h.pops.lastChild.remove();
            setTimeout(() => el.remove(), 2200);
            if (xp) this.xp(xp, null, true);
        }

        tick(text, color) {
            const h = this.hud;
            if (!h) return;
            const el = document.createElement('div');
            el.className = 'zt-tick';
            el.style.color = color || '#e8edf2';
            el.textContent = text;
            h.ticks.prepend(el);
            while (h.ticks.children.length > 5) h.ticks.lastChild.remove();
            setTimeout(() => el.remove(), 1600);
        }

        /* ------------------------------------------------------------ champions */
        /** Chance that an ordinary spawn becomes a champion. */
        championChance(x, z) {
            const c = this.campaign;
            const threat = BO.Zone.regionAt(x, z).threat || 1;
            return Math.min(0.22, 0.04 + (c?.day || 1) * 0.012 + threat * 0.018);
        }

        /** Turn an infected into a champion with `n` affixes (or the given list). */
        makeChampion(zb, n = 1, list = null, title = null) {
            if (!zb || zb.bossLabel || zb.champion) return zb;
            const affixes = list ? [...list] : [];
            const bag = AFFIX_IDS.filter((a) => !affixes.includes(a));
            while (affixes.length < n && bag.length) affixes.push(bag.splice(Math.floor(Math.random() * bag.length), 1)[0]);
            let hp = 1.5 + affixes.length * 0.25;
            if (affixes.includes('brute')) { hp *= 1.35; zb.damage = Math.round(zb.damage * 1.4); zb.speed *= 0.9; zb.sizeMult = 1.35; zb.parts?.root?.scale.setScalar(1.35); zb.radius = Math.min(1.2, zb.radius * 1.3); }
            if (affixes.includes('swift')) zb.speed = Math.min(6.4, zb.speed * 1.5);
            if (affixes.includes('volatile')) zb.explosiveDeath = true;
            // Tough, not spongy: capped by day so a pistol can still finish one.
            const day = this.campaign?.day || 1;
            zb.maxHp = Math.round(Math.min(zb.maxHp * hp, (380 + 55 * day) * (affixes.includes('brute') ? 1.25 : 1)));
            zb.hp = zb.maxHp;
            const main = AFFIX[affixes[0]];
            const name = title || (affixes.map((a) => AFFIX[a].name).join(' ') + ' ' + (zb.spec?.name || 'Infected'));
            zb.champion = { affixes, name, lastHit: -99, shriekAt: -99, color: main.css };
            // Tint the body and add a glow ring.
            try {
                zb.parts.root.traverse((o) => {
                    if (!o.isMesh || !o.material || o.userData.ztRing) return;
                    const mats = Array.isArray(o.material) ? o.material : [o.material];
                    const tinted = mats.map((mt) => {
                        if (!mt.emissive) return mt;
                        const c2 = mt.clone();
                        c2.emissive = new THREE.Color(main.hex);
                        c2.emissiveIntensity = 0.32;
                        return c2;
                    });
                    o.material = Array.isArray(o.material) ? tinted : tinted[0];
                });
                const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.82, 24), new THREE.MeshBasicMaterial({ color: main.hex, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
                ring.rotation.x = -Math.PI / 2;
                ring.position.y = 0.06;
                ring.userData.ztRing = true;
                zb.parts.root.add(ring);
                zb.champion.ring = ring;
            } catch (e) { /* cosmetic only */ }
            const plate = document.createElement('div');
            plate.className = 'zt-plate';
            plate.style.setProperty('--cc', main.css);
            plate.innerHTML = `<b>${esc(name)}</b><i><u></u></i>`;
            plate.title = affixes.map((a) => AFFIX[a].name + ': ' + AFFIX[a].desc).join('\n');
            this.hud?.plates.appendChild(plate);
            zb.champion.plate = plate;
            this.champions.push(zb);
            return zb;
        }

        onSpawn(zb, type, required) {
            if (!this.active || !zb || zb.bossLabel || type !== 'normal' || required) return;
            if (zb.horde && Math.random() > 0.5) return;
            if (Math.random() < this.championChance(zb.pos.x, zb.pos.z)) {
                const day = this.campaign?.day || 1;
                this.makeChampion(zb, day >= 6 && Math.random() < 0.35 ? 2 : 1);
            }
        }

        onChampionKilled(zb) {
            const m = this.mode_;
            const ch = zb.champion;
            this.stats.champions++;
            m.campaign.mark('champions', 1, 0);
            const xp = 50 + 25 * ch.affixes.length;
            this.popup('CHAMPION SLAIN', xp);
            const tier = BO.Zone.regionAt(zb.pos.x, zb.pos.z).threat || 1;
            const items = { scrap: 2 + tier };
            const cal = BO.ZoneLoot.caliberOf(BO.Player.activeWeapon);
            items[cal || 'ammo9'] = 8 + tier * 4;
            const extras = ['medkits', 'bandage', 'gunkit', 'powder', 'battery', 'circuit', 'painkillers'];
            items[extras[Math.floor(Math.random() * extras.length)]] = 1 + (tier >= 3 ? 1 : 0);
            m.campaign.pack.dropBag(items, zb.pos);
            if (!zb.contract && Math.random() < 0.22 + ch.affixes.length * 0.06) BO.ZoneContracts?.addCache(zb.pos);
            if (Math.random() < 0.55 + ch.affixes.length * 0.15) {
                const pool = BO.ZoneLoot.WEAPON_POOLS[Math.min(4, tier + 1)] || BO.ZoneLoot.WEAPON_POOLS[2];
                const id = pool[Math.floor(Math.random() * pool.length)];
                m.loot.dropPickup(id, 60 + Math.round(Math.random() * 30), zb.pos, BO.WeaponsData.get(id)?.name, this.rollWeapon(id, tier, 2, ch.affixes.length));
            }
        }

        updateChampions(dt) {
            const m = this.mode_;
            const cam = BO.App?.worldCamera;
            const p = BO.Player;
            const W = window.innerWidth, H = window.innerHeight;
            const v = this._v || (this._v = new THREE.Vector3());
            for (let i = this.champions.length - 1; i >= 0; i--) {
                const zb = this.champions[i];
                const ch = zb.champion;
                if (!zb.alive || zb.despawned || !m.zombies.includes(zb)) {
                    if (!zb.despawned && zb.hp <= 0 && !ch.credited) {
                        ch.credited = true;
                        if (ch.affixes.includes('volatile')) m.explode(zb.pos.clone(), 4.2, 70, false, 0, 'volatile');
                        this.onChampionKilled(zb);
                    }
                    ch.plate?.remove();
                    this.champions.splice(i, 1);
                    continue;
                }
                if (ch.ring) ch.ring.material.opacity = 0.55 + 0.25 * Math.sin(m.clock * 5 + zb.id);
                if (ch.affixes.includes('regen') && m.clock - ch.lastHit > 3 && zb.hp < zb.maxHp) zb.hp = Math.min(zb.maxHp, zb.hp + zb.maxHp * 0.035 * dt);
                if (ch.affixes.includes('shrieker') && zb.zs?.state === 'hunt' && m.clock - ch.shriekAt > 14) {
                    ch.shriekAt = m.clock;
                    BO.Sound?.playSpatialInfected?.('screech', zb.pos, 'Shrieker scream');
                    BO.ZoneDirector.noise(zb.pos.x, zb.pos.z, 70, 'shriek');
                    for (const o of m.zombies) if (o.alive && o !== zb && o.pos.distanceTo(zb.pos) < 45) { const s = BO.ZoneDirector.sense(o); s.state = 'hunt'; s.seen = m.clock; }
                    m.toast('A Shrieker screams — everything nearby is coming.');
                }
                // Nameplate.
                const d = zb.pos.distanceTo(p.pos);
                const plate = ch.plate;
                if (!plate || !cam) continue;
                if (d > 45) { plate.style.display = 'none'; continue; }
                v.set(zb.pos.x, zb.pos.y + (zb.height || 1.8) * (zb.sizeMult || 1) + 0.45, zb.pos.z).project(cam);
                if (v.z > 1 || v.z < -1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) { plate.style.display = 'none'; continue; }
                plate.style.display = '';
                plate.style.transform = `translate(${((v.x + 1) / 2 * W).toFixed(0)}px, ${((1 - v.y) / 2 * H).toFixed(0)}px) translate(-50%, -100%) scale(${Math.max(0.7, 1.15 - d / 60).toFixed(2)})`;
                plate.lastChild.firstChild.style.width = Math.max(0, zb.hp / zb.maxHp * 100).toFixed(0) + '%';
            }
        }

        /** Venomous champions poison on hit. */
        onEnemyMelee(zb) {
            const deep = this.campaign?.deep;
            if (!zb?.champion || !deep) return;
            if (zb.champion.affixes.includes('venom')) {
                deep.bleeding = Math.max(deep.bleeding || 0, 10);
                deep.infection = Math.min(100, (deep.infection || 0) + 8);
            }
        }

        /* ------------------------------------------------------------ frame */
        update(dt) {
            const m = this.mode_;
            if (!m || !m.active) return;
            const p = BO.Player;
            this.streakT -= dt; if (this.streakT <= 0) this.streak = 0;
            this.multiT -= dt;
            this.frenzyT -= dt;
            this.momentumT -= dt;
            this.adrenalineT -= dt;
            if ((m.deaths || 0) !== this.deathsSeen) { this.deathsSeen = m.deaths || 0; this.lastStandUsed = false; this.streak = 0; }
            if (this.rank('secondwind') && p.alive && m.clock - this.lastHurt > 6 && p.hp < p.maxHp && !(m.campaign.deep?.bleeding > 0)) p.hp = Math.min(p.maxHp, p.hp + 1.5 * this.rank('secondwind') * dt);
            if (this.rank('demolitions')) {
                this.nextFrag -= dt;
                if (this.nextFrag <= 0) { this.nextFrag = 150; if ((p.lethalCount || 0) < 3) { p.lethalCount = (p.lethalCount || 0) + 1; this.tick('+1 Frag grenade', '#ffb43a'); } }
            }
            // Perk cards open on their own once things are quiet.
            if (this.pending && !this.picking) {
                const quiet = BO.ZoneDirector.detected === 0 && this.canOpenPick() && m.clock - this.lastHurt > 4;
                this.calm = quiet ? this.calm + dt : Math.min(this.calm, 0);
                if (this.calm > 1.6) { this.calm = 0; this.openPick(); }
            }
            this.updateChampions(dt);
            this.renderHud();
        }

        /* ------------------------------------------------------------ HUD */
        buildHud() {
            if (!this.hud) {
                const root = document.createElement('div');
                root.id = 'zt-hud';
                root.innerHTML = `<div class="zt-plates"></div>
                    <div class="zt-pops"></div><div class="zt-ticks"></div>
                    <div class="zt-xp"><b class="zt-lvl">1</b><i><u></u></i><span class="zt-ready" hidden></span><em class="zt-buffs"></em></div>
                    <div class="zt-wcard" hidden></div>
                    <div class="zt-pick" hidden></div>`;
                document.body.appendChild(root);
                this.hud = {
                    root, plates: root.querySelector('.zt-plates'), pops: root.querySelector('.zt-pops'), ticks: root.querySelector('.zt-ticks'),
                    lvl: root.querySelector('.zt-lvl'), bar: root.querySelector('.zt-xp u'), ready: root.querySelector('.zt-ready'), buffs: root.querySelector('.zt-buffs'),
                    wcard: root.querySelector('.zt-wcard'), pick: root.querySelector('.zt-pick')
                };
            }
            this.hud.root.hidden = false;
            this.hud.plates.innerHTML = '';
        }

        renderHud() {
            const h = this.hud;
            if (!h) return;
            const show = BO.State.screen === 'playing' && !BO.SurvivalUI.open;
            h.root.classList.toggle('dim', !show);
            // Sit just above the hotbar and its weapon-name line, wherever the layout puts them.
            if (!h.placeAt || performance.now() > h.placeAt) {
                h.placeAt = performance.now() + 1000;
                const hb = document.querySelector('.svh-hotbar');
                const r = hb?.getBoundingClientRect();
                if (r && r.height) h.root.querySelector('.zt-xp').style.bottom = Math.round(window.innerHeight - r.top + 14) + 'px';
            }
            const lvlTxt = String(this.level);
            if (h.lvl.textContent !== lvlTxt) h.lvl.textContent = lvlTxt;
            const pct = Math.min(100, this.xpInto / this.need(this.level) * 100).toFixed(1) + '%';
            if (h.bar.style.width !== pct) h.bar.style.width = pct;
            h.lvl.title = 'Survivor level ' + this.level + ' · ' + Math.round(this.xpInto) + '/' + this.need(this.level) + ' XP to next';
            const readyTxt = this.pending ? 'PERK READY ×' + this.pending + ' · ' + BO.Settings.keyLabel(BO.Settings.getKeybinds().survSkills || 'KeyK') : '';
            if (h.ready.textContent !== readyTxt) { h.ready.textContent = readyTxt; h.ready.hidden = !this.pending; }
            const buffs = [
                this.streak >= 3 ? `<span>🔥 ${this.streak}</span>` : '',
                this.frenzyT > 0 ? `<span>FRENZY ×${this.frenzy}</span>` : '',
                this.momentumT > 0 ? `<span>MOMENTUM +${this.momentum * 6}%</span>` : '',
                this.adrenalineT > 0 ? '<span>ADRENALINE</span>' : ''
            ].join('');
            if (h.buffsHtml !== buffs) { h.buffs.innerHTML = buffs; h.buffsHtml = buffs; }
            // Weapon card for the held weapon (non-common only).
            const w = BO.Player.activeWeapon;
            const key = w ? (w.cfg.id + (w.cfg.rarity || '') + (w.cfg.perks || []).join()) : '';
            if (h.wkey !== key) {
                h.wkey = key;
                const r = w && this.rarityOf(w);
                if (!w || !r || r.id === 'common') h.wcard.hidden = true;
                else {
                    h.wcard.hidden = false;
                    h.wcard.style.setProperty('--rc', r.css);
                    h.wcard.innerHTML = `<b>${esc(r.name.toUpperCase())}</b> <span>${esc(w.stats.name)}</span>${(w.cfg.perks || []).map((k) => WPERKS[k] ? `<i title="${esc(WPERKS[k].desc)}">${esc(WPERKS[k].name)}</i>` : '').join('')}`;
                }
            }
        }

        /** Journal/terminal summary. */
        summaryHtml() {
            const owned = Object.entries(this.ranks).filter(([id]) => PERK[id]);
            return `<p class="sv-muted">Survivor level <b>${this.level}</b> · ${Math.round(this.xpInto)}/${this.need(this.level)} XP · ${this.rerolls} reroll${this.rerolls === 1 ? '' : 's'} · best streak ${this.stats.bestStreak} · champions slain ${this.stats.champions}</p>
                <div class="zt-perklist">${owned.length ? owned.map(([id, n]) => `<div><em>${PERK[id].icon}</em><b>${esc(PERK[id].name)} ${PERK[id].max > 1 ? n + '/' + PERK[id].max : ''}</b><small>${esc(PERK[id].desc(n))}</small></div>`).join('') : '<p class="sv-muted">No perks yet. Earn XP by fighting, exploring and securing sites; each level lets you choose one of three perks.</p>'}</div>`;
        }
    }

    BO.ZoneThrill = new ZoneThrill();
    BO.ZoneThrill.RARITY = RARITY;
    BO.ZoneThrill.WPERKS = WPERKS;
    BO.ZoneThrill.PERKS = PERKS;
    BO.ZoneThrill.AFFIX = AFFIX;
})(window.BO);
