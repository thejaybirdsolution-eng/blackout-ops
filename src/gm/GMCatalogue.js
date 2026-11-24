/* ============================================================================
   BLACKOUT OPS — Survival Gold: Field Catalogue & rare finds (BO.GM 'catalogue')
   · CATALOGUE: seven sets of things to find — Earth, Flora, Wildlife,
     Salvage, Kitchen, Places and Legends. Everything starts as a silhouette.
     The first time something enters your pack (or you hunt it, reach it, or
     beat it) it is discovered: a card slides in, a chime plays by rarity and
     you earn XP (common 5 · uncommon 15 · rare 40 · legendary 120).
   · SET BONUSES: each completed set gives one small, permanent-for-the-run
     perk. None touches combat damage.
   · RARE FINDS: rare deposits and rare-or-better weapon drops within 40 m show
     a light pillar coloured by rarity; picking up a rare material plays its
     own sting with a short slow-motion beat (solo only).
============================================================================ */
(function (BO) {
    'use strict';
    const GM = BO.GM;

    const XP = { common: 5, uncommon: 15, rare: 40, legendary: 120 };
    const RARITY_COLOR = { common: '#cbd5e1', uncommon: '#86efac', rare: '#60a5fa', legendary: '#fbbf24' };

    const SETS = [
        { id: 'earth', name: 'Earth', bonus: '+1 yield from stone, ore and dig deposits',
            items: { timber: 'common', stone: 'common', iron: 'common', coal: 'common', clay: 'common', resin: 'common', flint: 'common', sand: 'common',
                copper: 'uncommon', quartz: 'uncommon', sulfur: 'uncommon', salt: 'uncommon',
                gold_ore: 'rare', obsidian: 'rare', lapis_prism: 'rare', diamond_shard: 'rare' } },
        { id: 'flora', name: 'Flora', bonus: '+1 yield from fiber roots and bitterleaf',
            items: { fiber: 'common', herbs: 'common', berries: 'common', mushroom: 'common', cropSeeds: 'common', wheat: 'common', apple: 'common', carrot: 'common',
                pumpkin: 'uncommon', sugar_reed: 'uncommon', cocoa_beans: 'uncommon', honey: 'rare' } },
        { id: 'wildlife', name: 'Wildlife', bonus: '+1 meat from every hunt',
            species: { rabbit: 'common', fowl: 'common', deer: 'uncommon', boar: 'uncommon', goat: 'uncommon', cow: 'uncommon', wolf: 'rare', bear: 'rare' },
            items: { hide: 'common', feather: 'common', bone: 'common', fat: 'common', egg: 'common', wool: 'uncommon', antler: 'uncommon' } },
        { id: 'salvage', name: 'Salvage', bonus: '+1 Salvage from every container you search',
            items: { scrap: 'common', cloth: 'common', fuel: 'common', rations: 'common', medkits: 'common', bottle: 'common', glass: 'common', ammo9: 'common',
                ammo12: 'common', canned: 'uncommon', painkillers: 'uncommon', antibiotic: 'uncommon', battery: 'uncommon', powder: 'uncommon', primers: 'uncommon',
                brass: 'uncommon', ammo556: 'uncommon', ammo762: 'uncommon', radioParts: 'uncommon', circuit: 'uncommon', engine_parts: 'uncommon',
                coil: 'rare', relic: 'rare', keycard: 'rare', optic_kit: 'rare', suppressor_kit: 'rare', mag_kit: 'rare', gold: 'rare' } },
        { id: 'kitchen', name: 'Kitchen', bonus: 'Meal buffs last 50% longer',
            items: { cooked_rabbit: 'common', cooked_fowl: 'common', cooked_venison: 'common', cooked_pork: 'common', cooked_fish: 'common', fried_egg: 'common',
                roast_mushroom: 'common', tea: 'common', bread: 'common', cooked_mutton: 'uncommon', cooked_beef: 'uncommon', jerky: 'uncommon', stew: 'uncommon',
                broth: 'uncommon', espresso: 'uncommon', mushroom_soup: 'uncommon', omelette: 'uncommon', hunter_stew: 'rare', meat_pie: 'rare', berry_pie: 'rare',
                honey_ham: 'rare', survivor_feast: 'legendary' } },
        { id: 'places', name: 'Places', bonus: '+10% XP from everything', regions: true },
        { id: 'legends', name: 'Legends', bonus: 'Trophies: each boss already pays its own reward',
            bosses: { mother: ['The Hollow Mother', 'hiveGland'], stalker: ['The Pinebreak Stalker', 'monocle'], colossus: ['The Frostline Colossus', 'thermalRig'],
                leviathan: ['The Cinder Leviathan', 'fireproofPack'], sable: ['Commander Sable', 'codebook'], choir: ['The Drowned Choir', 'rebreather'], warden: ['The Warden', null] } }
    ];

    /* Rare materials that trigger the rare-find moment when picked up. */
    const RARE_PICKUPS = { diamond_shard: '#67e8f9', gold_ore: '#fbbf24', lapis_prism: '#818cf8', obsidian: '#a855f7', relic: '#d8b4fe', coil: '#93c5fd', emerald_chip: '#34d399' };
    /* World markers that get a light pillar. */
    const PILLAR_NAMES = { 'Diamond kimberlite': '#67e8f9', 'Emerald seam': '#34d399', 'Resonant geode': '#d8b4fe' };
    const PILLAR_WEAPON = { Rare: '#60a5fa', Epic: '#c084fc', Legendary: '#fbbf24' };
    const PILLAR_RANGE = 40;
    const PILLARS = 3;

    const itemName = (id) => (BO.SurvivalItemName ? BO.SurvivalItemName(id) : GM.itemName(id));

    function buildEntries() {
        const list = [];
        for (const set of SETS) {
            for (const [id, rarity] of Object.entries(set.species || {})) {
                const sp = BO.ZoneWild?.SPECIES?.[id];
                list.push({ key: 'sp:' + id, set: set.id, kind: 'species', id, rarity, name: sp?.name || id });
            }
            for (const [id, rarity] of Object.entries(set.items || {})) {
                if (!BO.SurvivalFrontierData.items[id]) continue;
                list.push({ key: 'it:' + id, set: set.id, kind: 'item', id, rarity, name: itemName(id) });
            }
            if (set.regions) {
                for (const r of BO.Zone?.REGIONS || []) {
                    list.push({ key: 'rg:' + r.id, set: set.id, kind: 'region', id: r.id, rarity: r.threat >= 5 ? 'rare' : r.threat >= 3 ? 'uncommon' : 'common', name: r.name });
                }
            }
            for (const [id, [name, reward]] of Object.entries(set.bosses || {})) {
                list.push({ key: 'bs:' + id, set: set.id, kind: 'boss', id, reward, rarity: 'legendary', name });
            }
        }
        return list;
    }

    const Catalogue = {
        rate: 2,

        start(mode, saved) {
            this.mode = mode;
            this.entries = buildEntries();
            this.byKey = new Map(this.entries.map((e) => [e.key, e]));
            this.found = new Set((saved?.found || []).filter((k) => this.byKey.has(k)));
            this.doneSets = new Set(saved?.doneSets || []);
            // Anything already in the pack at deployment is known without fanfare.
            this.scan(true);
            this.buildDom();
            this.buildPillars();
            this.nextPillars = 0;
            this.slowUntil = 0;
            this.patch();
        },

        stop() {
            this.unpatch();
            BO.State.timeScale = 1;
            for (const p of this.pillars || []) { p.mesh.removeFromParent(); p.mesh.geometry.dispose(); p.mesh.material.dispose(); }
            this.pillars = [];
            this.cardHost?.remove();
            this.cardHost = null;
            this.mode = null;
        },

        snapshot() { return { found: [...this.found], doneSets: [...this.doneSets] }; },

        setDone(id) { return this.doneSets.has(id); },

        /* ------------------------------------------------------------ discovery */
        scan(silent = false) {
            const m = this.mode;
            const c = m.campaign;
            const fresh = [];
            for (const e of this.entries) {
                if (this.found.has(e.key)) continue;
                let got = false;
                if (e.kind === 'item') got = (m.points[e.id] || 0) > 0;
                else if (e.kind === 'region') got = c.visited?.has?.(e.id);
                else if (e.kind === 'boss') got = e.reward ? !!GM.get('bosses')?.hasReward?.(e.reward) : (c.metrics.wardenKilled || 0) > 0;
                else if (e.kind === 'species') got = (c.metrics['hunt_' + e.id] || 0) > 0;
                if (got) fresh.push(e);
            }
            for (const e of fresh) this.discover(e, silent);
        },

        discover(e, silent = false) {
            if (this.found.has(e.key)) return;
            this.found.add(e.key);
            if (!silent) {
                BO.ZoneThrill?.xp?.(XP[e.rarity], 'Catalogue');
                const f = { common: 880, uncommon: 988, rare: 1175, legendary: 1319 }[e.rarity];
                GM.tone(e.rarity === 'legendary' ? [[f, f, 0.1], [f * 1.25, f * 1.25, 0.1], [f * 1.5, f * 1.5, 0.3]] : [[f, f * 1.5, 0.14]], 0.07, 'sine');
                this.card(e);
            }
            this.checkSet(e.set, silent);
        },

        checkSet(setId, silent) {
            if (this.doneSets.has(setId)) return;
            const all = this.entries.filter((x) => x.set === setId);
            if (!all.length || !all.every((x) => this.found.has(x.key))) return;
            this.doneSets.add(setId);
            if (silent) return;
            const set = SETS.find((s) => s.id === setId);
            GM.sting('haul');
            GM.banner('SET COMPLETE · ' + set.name.toUpperCase(), set.bonus, '#fbbf24');
        },

        /** Hunting hook from ZoneWild: records the species and applies the Wildlife bonus. */
        onHunt(animal, drops) {
            if (!animal?.kind) return;
            const e = this.byKey.get('sp:' + animal.kind);
            // The kill metric updates right after this hook, so discover directly.
            if (e) this.discover(e);
            if (this.doneSets.has('wildlife')) {
                const meat = Object.keys(drops).find((k) => /^raw_/.test(k));
                if (meat) drops[meat] += 1;
            }
        },

        /** SurvivalPack.harvest asks for a flat bonus on the primary yield. */
        yieldBonus(node) {
            const spec = node?.spec;
            if (!spec) return 0;
            if (this.doneSets.has('earth') && (spec.tool === 'pick' || spec.tool === 'shovel')) return 1;
            if (this.doneSets.has('flora') && (node.kind === 'roots' || node.kind === 'herbs')) return 1;
            return 0;
        },

        mealMult() { return this.doneSets.has('kitchen') ? 1.5 : 1; },

        /** SurvivalMode.grant reports what reached the pack: rare materials get their moment. */
        onGranted(items) {
            for (const id of Object.keys(items)) {
                const color = RARE_PICKUPS[id];
                if (!color || !(items[id] > 0)) continue;
                this.rareMoment(itemName(id), color);
                break;
            }
            this.scan();
        },

        rareMoment(name, color) {
            GM.tone([[523, 523, 0.09], [784, 784, 0.09], [1046, 1046, 0.09], [1568, 1568, 0.4]], 0.1, 'triangle');
            GM.toast('RARE FIND · ' + name, color);
            if (!BO.Net?.active) {
                BO.State.timeScale = 0.6;
                this.slowUntil = performance.now() + 250;
            }
        },

        /* ------------------------------------------------------------ hooks */
        patch() {
            const self = this;
            const T = BO.ZoneThrill;
            const loot = this.mode.loot;
            this._orig = { xp: T?.xp, complete: loot?.complete };
            if (T?.xp) {
                T.xp = function (n, label, quiet) {
                    return self._orig.xp.call(this, self.doneSets.has('places') && n > 0 ? n * 1.1 : n, label, quiet);
                };
            }
            if (loot?.complete) {
                loot.complete = function (entry) {
                    const r = self._orig.complete.call(this, entry);
                    if (self.doneSets.has('salvage') && entry && !entry.story) self.mode.grant({ scrap: 1 });
                    return r;
                };
            }
        },

        unpatch() {
            if (!this._orig) return;
            if (this._orig.xp && BO.ZoneThrill) BO.ZoneThrill.xp = this._orig.xp;
            if (this._orig.complete && this.mode?.loot) this.mode.loot.complete = this._orig.complete;
            this._orig = null;
        },

        /* ------------------------------------------------------------ cards */
        buildDom() {
            this.cardHost = document.createElement('div');
            this.cardHost.id = 'gm-cards';
            this.cardHost.className = 'gm-cards';
            document.body.appendChild(this.cardHost);
        },

        icon(e, size) {
            const I = BO.SurvivalIcons;
            if (!I) return '';
            if (e.kind === 'item') return I.item(e.id, size);
            return I.named(e.kind === 'species' ? 'paw' : e.kind === 'region' ? 'tower' : 'skull', '#e2e8f0', size);
        },

        card(e) {
            const set = SETS.find((s) => s.id === e.set);
            const have = this.entries.filter((x) => x.set === e.set && this.found.has(x.key)).length;
            const total = this.entries.filter((x) => x.set === e.set).length;
            const el = document.createElement('div');
            el.className = 'gm-card-pop r-' + e.rarity;
            el.style.setProperty('--rc', RARITY_COLOR[e.rarity]);
            el.innerHTML = '<span class="ico">' + this.icon(e, 26) + '</span><span class="t"><small>NEW · ' + GM.esc(set.name.toUpperCase()) + ' ' + have + '/' + total + '</small><b>' +
                GM.esc(e.name) + '</b><em>' + e.rarity + ' · +' + XP[e.rarity] + ' XP</em></span>';
            this.cardHost.prepend(el);
            while (this.cardHost.children.length > 3) this.cardHost.lastChild.remove();
            setTimeout(() => el.classList.add('out'), 3200);
            setTimeout(() => el.remove(), 3700);
        },

        /* ------------------------------------------------------------ pillars */
        buildPillars() {
            this.pillars = [];
            const geo = new THREE.CylinderGeometry(0.2, 0.2, 26, 10, 1, true);
            geo.translate(0, 13, 0);
            for (let i = 0; i < PILLARS; i++) {
                const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
                const mesh = new THREE.Mesh(i === 0 ? geo : geo.clone(), mat);
                mesh.visible = false;
                mesh.renderOrder = 3;
                this.mode.scene.add(mesh);
                this.pillars.push({ mesh, target: null });
            }
        },

        pillarColor(mk) {
            if (PILLAR_NAMES[mk.name]) return PILLAR_NAMES[mk.name];
            const word = String(mk.name || '').split(' ')[0];
            return PILLAR_WEAPON[word] || null;
        },

        updatePillars() {
            const m = this.mode;
            const p = BO.Player.pos;
            const now = performance.now();
            if (now >= this.nextPillars) {
                this.nextPillars = now + 500;
                const cand = [];
                for (const mk of m.markers) {
                    if (mk.alive === false) continue;
                    const dx = mk.x - p.x;
                    const dz = mk.z - p.z;
                    if (dx > PILLAR_RANGE || dx < -PILLAR_RANGE || dz > PILLAR_RANGE || dz < -PILLAR_RANGE) continue;
                    const color = this.pillarColor(mk);
                    if (!color) continue;
                    const d = Math.hypot(dx, dz);
                    if (d <= PILLAR_RANGE) cand.push({ mk, d, color });
                }
                cand.sort((a, b) => a.d - b.d);
                this.pillars.forEach((pl, i) => {
                    const c = cand[i];
                    pl.target = c ? c.mk : null;
                    if (c) {
                        pl.mesh.material.color.set(c.color);
                        pl.mesh.position.set(c.mk.x, c.mk.y, c.mk.z);
                    }
                });
            }
            const pulse = 0.5 + 0.5 * Math.sin(now / 420);
            for (const pl of this.pillars) {
                const mk = pl.target;
                if (!mk || mk.alive === false) { pl.mesh.visible = false; continue; }
                const d = Math.hypot(mk.x - p.x, mk.z - p.z);
                // Fade in from the edge of range and fade out when you are right on top of it.
                const far = Math.min(1, (PILLAR_RANGE - d) / 8);
                const near = Math.min(1, Math.max(0, (d - 2) / 5));
                pl.mesh.material.opacity = Math.max(0, far * near) * (0.22 + 0.16 * pulse);
                pl.mesh.visible = pl.mesh.material.opacity > 0.01;
            }
        },

        /* ------------------------------------------------------------ catalogue tab */
        progress() {
            return { have: this.found.size, total: this.entries.length };
        },

        renderTab() {
            const { have, total } = this.progress();
            const cards = SETS.map((set) => {
                const list = this.entries.filter((e) => e.set === set.id);
                const got = list.filter((e) => this.found.has(e.key)).length;
                const done = this.doneSets.has(set.id);
                const tiles = list.map((e) => {
                    const known = this.found.has(e.key);
                    return `<span class="gm-cat-tile ${known ? 'known' : ''}" style="--rc:${RARITY_COLOR[e.rarity]}" title="${known ? GM.esc(e.name) + ' · ' + e.rarity : 'Undiscovered ' + e.rarity + ' ' + (e.kind === 'item' ? 'find' : e.kind)}">${known ? this.icon(e, 22) : '<i>?</i>'}<small>${known ? GM.esc(e.name) : '???'}</small></span>`;
                }).join('');
                return `<section class="gm-card gm-cat ${done ? 'done' : ''}"><header><h3>${GM.esc(set.name)}</h3><span>${got}/${list.length}</span></header>
                    <div class="gm-bar ${done ? 'ok' : ''}"><i style="width:${Math.round(got / Math.max(1, list.length) * 100)}%"></i></div>
                    <p class="gm-cat-bonus ${done ? 'on' : ''}">${done ? '✓ ' : 'Set bonus: '}${GM.esc(set.bonus)}</p>
                    <div class="gm-cat-grid">${tiles}</div></section>`;
            }).join('');
            return `<div class="gm-catalogue"><header class="gm-cat-head"><h2>Field Catalogue</h2><span>${have} / ${total} discovered · ${Math.round(have / Math.max(1, total) * 100)}%</span></header><div class="gm-base">${cards}</div></div>`;
        },

        baseCards(ui) {
            const { have, total } = this.progress();
            const sets = SETS.map((s) => (this.doneSets.has(s.id) ? '✓ ' : '') + s.name).join(' · ');
            return [ui.section('Field Catalogue', `${ui.bar(have / Math.max(1, total), 'ok')}<p>${have} of ${total} discovered.</p><p class="gm-muted sm">${GM.esc(sets)}</p><button class="sv-btn sm" data-act="tab" data-arg="catalogue">Open catalogue</button>`, Math.round(have / Math.max(1, total) * 100) + '%')];
        },

        update() {
            if (!this.mode) return;
            this.scan();
        },

        /** Pillars and the slow-motion beat run every frame through tick(). */
        tick() {
            if (!this.mode) return;
            if (this.slowUntil && performance.now() >= this.slowUntil) { BO.State.timeScale = 1; this.slowUntil = 0; }
            this.updatePillars();
        }
    };

    GM.register('catalogue', Catalogue);
    // A second, unthrottled entry drives the per-frame visuals of the catalogue.
    GM.register('catalogueFx', { update() { Catalogue.tick(); } });
})(window.BO);
