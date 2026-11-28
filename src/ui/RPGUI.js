/* ============================================================================
   BLACKOUT OPS — RPG UI
   - The Haven (hub screen): Delve, Loadout, Talents, Stash, Merchant, Forge,
     Upgrades, Roster
   - In-delve HUD: ability bar, momentum, XP, floor card, boons, potions
   - World UI: enemy health/status bars, damage numbers, reaction callouts
   - Modals: boon pick, pack/character (Tab), pack full, shrine, extract, report
   Styles: css/rpg.css
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const fmt = (n) => Math.floor(n || 0).toLocaleString('en-US');
    const HEALTHBAR_POOL = 18;
    const FLOAT_POOL = 48;
    const _proj = new THREE.Vector3();

    const _rpgIco = (d, col) => `<svg class="ui-ico" viewBox="0 0 16 16" fill="none" stroke="${col || 'currentColor'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;vertical-align:-2px" aria-hidden="true">${d}</svg>`;
    const TABS = [
        ['delve', 'Delve', _rpgIco('<path d="M8 2l5 5-5 7-5-7z"/>')],
        ['loadout', 'Loadout', _rpgIco('<path d="M4 3l4-1 4 1 2 4-2 6H4L2 7z"/>')],
        ['talents', 'Talents', _rpgIco('<path d="M8 2l2 4 4.5.7-3.2 3.1.8 4.4L8 12.2 3.9 14.2l.8-4.4L1.5 6.7 6 6z"/>')],
        ['stash', 'Stash', _rpgIco('<rect x="3" y="4" width="10" height="9" rx="1.5"/><path d="M3 7.5h10"/>')],
        ['merchant', 'Merchant', _rpgIco('<circle cx="8" cy="8" r="5.5"/><path d="M8 5v6M5.5 8h5"/>')],
        ['forge', 'Forge', _rpgIco('<path d="M3 11h10M4 11V7l4-3 4 3v4"/>')],
        ['upgrades', 'Haven', _rpgIco('<path d="M2.5 8L8 3l5.5 5M4 7v6h8V7"/>')],
        ['roster', 'Roster', _rpgIco('<circle cx="8" cy="5.5" r="2.5"/><path d="M3.5 13.5a4.5 4.5 0 0 1 9 0"/>')],
        ['contracts', 'Contracts', _rpgIco('<path d="M4 2.5h8v11H4z"/><path d="M6 6h4M6 9h3"/>')],
        ['unlocks', 'Collection', _rpgIco('<circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="2"/>')]
    ];

    class RPGUI {
        constructor() {
            this.tab = 'delve';
            this.modalOpen = false;
            this.modalClosable = true;
            this.selectedUid = null;
            this.forgeUid = null;
            this.collectionSlot = 'crest';
            this.startFloor = 1;
            this.floats = [];
            this.bars = [];
            this._hudCache = {};
        }

        get D() { return BO.RPGData; }
        get Pr() { return BO.RPGProfile; }
        get M() { return BO.RPGMode; }

        init() {
            // Haven screen.
            this.haven = document.createElement('section');
            this.haven.id = 'rpg-haven';
            this.haven.className = 'rpg-haven hidden';
            document.body.append(this.haven);
            this.haven.addEventListener('click', (e) => this._onHavenClick(e));
            this.haven.addEventListener('change', (e) => this._onHavenChange(e));

            // HUD (inside the shared HUD layer so it hides with it).
            const hudLayer = document.getElementById('hud-layer');
            this.hud = document.createElement('div');
            this.hud.id = 'rpg-hud';
            this.hud.className = 'rpg-hud hidden';
            this.hud.innerHTML = `
                <div class="rpg-floorcard">
                    <div class="rpg-floorcard-top"><span class="rpg-floor-label"></span><span class="rpg-room-chip"></span></div>
                    <div class="rpg-objective"></div>
                    <div class="vault-encounter"></div>
                    <div class="rpg-haul"></div>
                    <div class="rpg-contract-hud"></div>
                    <div class="rpg-boons"></div>
                    <div class="rpg-synergies"></div>
                    <div class="rpg-artifacts-strip"></div>
                </div>
                <div class="rpg-bottom">
                    <div class="rpg-isaac-vitals hidden">
                        <div class="rpg-soulbar"><div class="rpg-soulbar-fill"></div><span class="rpg-soulbar-label"></span></div>
                        <div class="rpg-vital-badges"></div>
                    </div>
                    <div class="rpg-momentum"><div class="rpg-momentum-pips"></div><span class="rpg-momentum-label"></span></div>
                    <div class="rpg-xp"><div class="rpg-xp-fill"></div><span class="rpg-xp-label"></span></div>
                    <div class="rpg-abilities">
                        <div class="rpg-ab rpg-ab-active empty" data-slot="active">
                            <div class="rpg-ab-face"><span class="rpg-ab-glyph">🎲</span><div class="rpg-ab-cd"></div><span class="rpg-ab-cdtext"></span></div>
                            <div class="rpg-charge-pips"></div>
                            <span class="rpg-ab-key">G / C</span>
                            <span class="rpg-ab-name">ACTIVE</span>
                        </div>
                        ${['primer', 'detonator', 'ultimate', 'potion'].map((slot) => `
                        <div class="rpg-ab" data-slot="${slot}">
                            <div class="rpg-ab-face"><span class="rpg-ab-glyph"></span><div class="rpg-ab-cd"></div><span class="rpg-ab-cdtext"></span></div>
                            <span class="rpg-ab-key"></span>
                            <span class="rpg-ab-name"></span>
                        </div>`).join('')}
                        <div class="rpg-ab rpg-ab-pocket empty" data-slot="pocket">
                            <div class="rpg-ab-face"><span class="rpg-ab-glyph">🃏</span><div class="rpg-ab-cd"></div><span class="rpg-ab-cdtext"></span></div>
                            <span class="rpg-ab-key">T</span>
                            <span class="rpg-ab-name">POCKET</span>
                        </div>
                    </div>
                    <div class="rpg-silenced hidden">SILENCED</div>
                </div>`;
            hudLayer.append(this.hud);

            this.world = document.createElement('div');
            this.world.id = 'rpg-world';
            this.world.className = 'rpg-world hidden';
            hudLayer.append(this.world);
            for (let i = 0; i < HEALTHBAR_POOL; i++) {
                const el = document.createElement('div');
                el.className = 'rpg-hb hidden';
                el.innerHTML = '<div class="rpg-hb-name"></div><div class="rpg-hb-track"><div class="rpg-hb-fill"></div></div><div class="rpg-hb-status"></div>';
                this.world.append(el);
                this.bars.push({ el, name: el.children[0], fill: el.children[1].firstChild, status: el.children[2], key: '' });
            }
            for (let i = 0; i < FLOAT_POOL; i++) {
                const el = document.createElement('div');
                el.className = 'rpg-float hidden';
                this.world.append(el);
                this.floats.push({ el, life: 0, max: 1, pos: new THREE.Vector3(), vy: 1 });
            }

            this.modal = document.createElement('div');
            this.modal.id = 'rpg-modal';
            this.modal.className = 'rpg-modal hidden';
            document.body.append(this.modal);
            this.modal.addEventListener('click', (e) => this._onModalClick(e));
            this.modal.addEventListener('input', (e) => {
                if (e.target.matches('[data-bowl]')) e.target.nextElementSibling.value = e.target.value;
            });

            this.fade = document.createElement('div');
            this.fade.id = 'rpg-fade';
            this.fade.className = 'rpg-fade';
            document.body.append(this.fade);

            BO.Events.on('settings:changed', (e) => { if (e.key === 'keybinds') this._hudCache = {}; });
        }

        /* ======================================================================
           Screen routing
        ====================================================================== */

        openHaven(tab) {
            const p = this.Pr.data;
            if (tab) this.tab = tab;
            this.startFloor = p.checkpoints.includes(this.startFloor) ? this.startFloor : Math.max(...p.checkpoints.filter((c) => c <= Math.max(1, p.deepest + 1)), 1);
            BO.Menus.showScreen('rpg_haven');
            this.haven.classList.remove('hidden');
            this.haven.classList.add('rpg-enter');
            setTimeout(() => this.haven.classList.remove('rpg-enter'), 420);
            if (this.Pr.hasCharacter) this.Pr.refreshMerchant();
            this.renderHaven();
            BO.Sound.startMusic('menu');
        }

        /** Called by MenuController.showScreen for every screen change. */
        onScreenChanged(name) {
            if (name !== 'rpg_haven') this.haven.classList.add('hidden');
            const playing = name === 'playing' && BO.State.activeMode === 'rpg';
            this.hud.classList.toggle('hidden', !playing);
            this.world.classList.toggle('hidden', !playing);
            if (!playing && name !== 'rpg_haven') this.closeModal(true);
        }

        /* ======================================================================
           Haven
        ====================================================================== */

        renderHaven() {
            const Pr = this.Pr;
            const p = Pr.data;
            if (!Pr.hasCharacter) { this.haven.innerHTML = this._classPickHtml(true); return; }
            const C = this.D.CLASSES[Pr.classId];
            const rec = Pr.cls;
            const need = Pr.xpNeeded(rec);
            const unspent = Pr.unspentTalentTiers(rec);
            this.haven.style.setProperty('--rpg-accent', C.color);
            const crest = BO.RPGUnlocks.equipped(p, 'crest');
            const frame = BO.RPGUnlocks.equipped(p, 'frame');
            this.haven.style.setProperty('--vault-frame', frame?.color || '#c7a36b');
            this.haven.style.setProperty('--vault-pattern', (8 + (frame?.pattern || 0)) + 'px');
            this.haven.innerHTML = `
                <header class="rpg-top">
                    <div class="rpg-top-left">
                        <button class="btn" data-act="back">← MAIN MENU</button>
                        <div class="rpg-brand"><span class="rpg-brand-kicker">ROGUE LITE • DELVE &amp; EXTRACT</span><div class="rpg-brand-title">THE HAVEN</div></div>
                    </div>
                    <div class="rpg-wallet">
                        <div class="rpg-coin" data-tip-title="Gold" data-tip="Banked gold. Spend it at the Merchant, the Forge and on Haven upgrades. Gold found in a delve is only banked when you extract."><span>${_rpgIco('<circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="2.2"/>', '#fbbf24')}</span><b>${fmt(p.gold)}</b><small>GOLD</small></div>
                        <div class="rpg-coin rpg-coin-scrap" data-tip-title="Scrap" data-tip="Salvaged materials for the Forge. Common items are salvaged automatically when you pick them up."><span>${_rpgIco('<path d="M3 10l4-6 6 2-3 7z"/>', '#94a3b8')}</span><b>${fmt(p.scrap)}</b><small>SCRAP</small></div>
                        <div class="rpg-charchip" style="--c:${C.color}"><span class="rpg-charchip-ico" style="color:${crest?.color || C.color}">${crest?.icon || C.icon}</span><div><b>${esc(C.name.toUpperCase())}</b><small>LEVEL ${rec.level}${rec.level >= this.D.LEVEL_CAP ? ' • MAX' : ` • ${fmt(rec.xp)} / ${fmt(need)} XP`}</small><div class="rpg-mini-xp"><div style="width:${need ? Math.round((rec.xp / need) * 100) : 100}%"></div></div></div></div>
                    </div>
                </header>
                <div class="rpg-body">
                    <nav class="rpg-nav">
                        ${TABS.map(([id, label, ico]) => `<button class="rpg-nav-btn ${this.tab === id ? 'active' : ''}" data-act="tab" data-tab="${id}"><span>${ico}</span>${label}${id === 'talents' && unspent ? `<em>${unspent}</em>` : ''}${id === 'delve' && p.run ? '<em>!</em>' : ''}</button>`).join('')}
                        <button class="rpg-nav-btn" data-act="gameguide"><span>▤</span>Game Guide</button>
                    </nav>
                    <main class="rpg-main" data-tab="${this.tab}">${this._tabHtml()}</main>
                </div>`;
        }

        _tabHtml() {
            switch (this.tab) {
                case 'loadout': return this._loadoutHtml();
                case 'talents': return this._talentsHtml(false);
                case 'stash': return this._stashHtml();
                case 'merchant': return this._merchantHtml();
                case 'forge': return this._forgeHtml();
                case 'upgrades': return this._upgradesHtml();
                case 'roster': return this._classPickHtml(false);
                case 'contracts': return this._contractsHtml();
                case 'unlocks': return this._collectionHtml();
                default: return this._delveHtml();
            }
        }

        _section(title, sub, body, extraCls = '') {
            return `<section class="rpg-card ${extraCls}"><div class="rpg-card-head"><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ''}</div>${body}</section>`;
        }

        _delveHtml() {
            const Pr = this.Pr;
            const p = Pr.data;
            const D = this.D;
            const C = D.CLASSES[Pr.classId];
            const s = Pr.computeStats(null);
            const run = p.run && p.run.classId === Pr.classId ? p.run : null;
            const otherRun = p.run && p.run.classId !== Pr.classId ? p.run : null;
            const diff = D.DIFFICULTIES[p.difficulty];
            const contract = D.CONTRACTS[run ? run.contract : p.contract];
            const kb = BO.Settings.getKeybinds();
            const key = (a) => esc(BO.Settings.keyLabel(kb[a]));
            const hero = `
                <div class="rpg-hero" style="--c:${C.color}">
                    <div class="rpg-hero-emblem">${C.icon}</div>
                    <div class="rpg-hero-text">
                        <span class="rpg-kicker">${esc(C.role.toUpperCase())}</span>
                        <h2>${esc(C.name)}</h2>
                        <p>${esc(C.blurb)}</p>
                        <div class="rpg-hero-abilities">
                            ${['primer', 'detonator', 'ultimate'].map((slot) => {
                                const a = C.abilities[slot];
                                const k = slot === 'primer' ? key('rpgAbility1') : slot === 'detonator' ? key('rpgAbility2') : key('rpgUltimate');
                                return `<div class="rpg-hero-ab" data-tip-title="${esc(a.name)}" data-tip="${esc(a.desc)}" data-tip-sub="${slot === 'ultimate' ? 'Charges from damage dealt' : `${a.cd}s cooldown`}"><kbd>${k}</kbd><b>${esc(a.name)}</b><small>${slot}</small></div>`;
                            }).join('')}
                            <div class="rpg-hero-ab" data-tip-title="${esc(C.passive.name)}" data-tip="${esc(C.passive.desc)}"><kbd>◈</kbd><b>${esc(C.passive.name)}</b><small>passive</small></div>
                        </div>
                    </div>
                </div>`;
            let action;
            if (run) {
                action = `
                    <div class="rpg-resume">
                        <div><span class="rpg-kicker">DELVE SUSPENDED</span><h3>Floor ${run.floor} • ${esc(D.biomeForFloor(run.floor).name)}</h3>
                        <p>Unbanked: <b class="rpg-gold">◆ ${fmt(run.gold)}</b> • <b>${run.pack.length}</b> items • ${run.boons.length} boons. You resume at the start of the floor.</p>
                        ${contract ? `<p>Contract: ${esc(contract.name)} • ${run.contractProgress || 0}/${contract.goal}</p>` : ''}</div>
                        <div class="rpg-resume-btns">
                            <button class="btn rpg-btn-ghost" data-act="abandon">ABANDON</button>
                            <button class="btn btn-primary rpg-btn-big" data-act="resume">RESUME FLOOR ${run.floor} →</button>
                        </div>
                    </div>`;
            } else {
                const cps = p.checkpoints.slice().sort((a, b) => a - b);
                action = `
                    <div class="rpg-launch">
                        <div class="rpg-field"><label>START AT</label><div class="rpg-seg">${cps.map((c) => `<button class="${this.startFloor === c ? 'active' : ''}" data-act="startfloor" data-floor="${c}" data-tip-title="Floor ${c}" data-tip="${esc(D.biomeForFloor(c).name)} • recommended level ${D.recommendedLevel(c)}">F${c}</button>`).join('')}</div></div>
                        <div class="rpg-field"><label>DIFFICULTY</label><div class="rpg-seg">${Object.values(D.DIFFICULTIES).map((d) => `<button class="${p.difficulty === d.id ? 'active' : ''}" data-act="difficulty" data-diff="${d.id}" data-tip-title="${esc(d.name)}" data-tip="${esc(d.desc)}">${esc(d.name.toUpperCase())}</button>`).join('')}</div></div>
                        <div class="rpg-contract-link">
                            <span>${contract ? `<b>${esc(contract.name)}</b> · ${esc(contract.objective)}` : 'No contract selected'}</span>
                            <button class="btn btn-sm" data-act="tab" data-tab="contracts">${contract ? 'CHANGE CONTRACT' : 'VIEW CONTRACTS'}</button>
                        </div>
                        ${otherRun ? `<p class="rpg-warn">Your ${esc(D.CLASSES[otherRun.classId].name)} has a suspended delve on floor ${otherRun.floor}. Starting a new delve abandons it.</p>` : ''}
                        <button class="btn btn-primary rpg-btn-big" data-act="delve">BEGIN DELVE → FLOOR ${this.startFloor}</button>
                        <p class="rpg-hint">Recommended level ${D.recommendedLevel(this.startFloor)} • ${esc(diff.name)} • ${p.elixir ? `Elixir ready: <b>${esc(D.ELIXIRS.find((e) => e.id === p.elixir).name)}</b>` : 'No elixir'}</p>
                    </div>`;
            }
            const stat = (label, val, tip) => `<div class="rpg-stat" data-tip-title="${esc(label)}" data-tip="${esc(tip)}"><small>${label}</small><b>${val}</b></div>`;
            const rules = `
                <ol class="rpg-rules">
                    <li><b>Primers</b> (${key('rpgAbility1')}) apply a status. <b>Detonators</b> (${key('rpgAbility2')}) consume every status on a target — each one triggers its reaction.</li>
                    <li>${D.STATUS_ORDER.map((id) => { const st = D.STATUSES[id]; const re = D.REACTIONS[st.reaction]; return `<span class="rpg-pill" style="--c:${st.color}">${st.icon} ${st.name} → ${re.name}</span>`; }).join(' ')}</li>
                    <li>Health does not regenerate. Drink potions with <b>${key('rpgPotion')}</b>; Rest rooms refill them.</li>
                    <li>Gold and items you find are <b>unbanked</b> until you reach an Extraction Beacon. Die and you lose them. XP is always kept.</li>
                    <li>Chain kills without getting hit to build <b>Momentum</b>: more XP, gold and damage.</li>
                    <li>Find <b>Run Artifacts</b> on 3D pedestals, Devil Deals (−15% max HP) and Angel Sanctums (no Red HP damage taken). Use <b>G/C</b> for Active items, <b>T</b> for Pills/Tarot Cards, and <b>B</b> to drop Bombs on Tinted Rocks.</li>
                </ol>`;
            return `
                ${hero}
                <div class="rpg-grid-2">
                    ${this._section('Deploy', run ? 'Pick up where you left off, or abandon the haul.' : 'Every 5th floor is a guardian. Beating one unlocks a checkpoint.', action)}
                    ${this._section('Your build', 'Live numbers with your current gear and talents.', `<div class="rpg-stats">
                        ${stat('MAX HP', s.maxHp, 'Class base + level + gear.')}
                        ${stat('WEAPON POWER', Math.round(s.weaponPower * (1 + s.gunDmg / 100) * 100) + '%', 'Gun damage multiplier from your weapon item and affixes.')}
                        ${stat('ABILITY POWER', Math.round(s.abilityPower * (1 + s.abilityDmg / 100) * 100) + '%', 'Ability and reaction damage multiplier from level and relic.')}
                        ${stat('POTIONS', `${s.potionsMax} × ${Math.round(s.potionHealFrac * 100)}%`, 'Potions carried and how much of your max HP each one heals.')}
                        ${stat('PACK', s.packSlots + ' slots', 'Items you can carry in a delve before you must salvage some.')}
                        ${stat('COOLDOWNS', Math.round(s.cdrMult * 100) + '%', 'Ability cooldown multiplier.')}
                    </div>`)}
                </div>
                ${this._section('How a delve works', '', rules)}
                ${this._section('Records', '', `<div class="rpg-stats rpg-stats-6">
                    ${stat('DEEPEST', 'F' + p.deepest, 'Deepest floor reached.')}
                    ${stat('DELVES', fmt(p.stats.delves), 'Delves started.')}
                    ${stat('EXTRACTED', fmt(p.stats.extractions), 'Successful extractions.')}
                    ${stat('FALLEN', fmt(p.stats.deaths), 'Delves lost to death.')}
                    ${stat('KILLS', fmt(p.stats.kills), 'Enemies defeated in Rogue Lite.')}
                    ${stat('REACTIONS', fmt(p.stats.reactions), 'Status reactions triggered.')}
                </div>`)}`;
        }

        _classPickHtml(first) {
            const Pr = this.Pr;
            const D = this.D;
            const cards = D.CLASS_ORDER.filter((id) => !first || !D.CLASSES[id].metric).map((id) => {
                const C = D.CLASSES[id];
                const rec = Pr.classRecord(id);
                const active = Pr.classId === id;
                const locked = C.metric && !BO.RPGUnlocks.unlocked(Pr.data, C);
                const requirement = C.metric ? BO.RPGUnlocks.requirement(C) : '';
                return `
                <button class="rpg-class ${active ? 'active' : ''}" style="--c:${C.color}" data-act="pickclass" data-class="${id}" ${locked ? 'disabled' : ''}>
                    <div class="rpg-class-emblem">${C.icon}</div>
                    <span class="rpg-kicker">${esc(C.role.toUpperCase())}</span>
                    <h3>${esc(C.name)}</h3>
                    <p>${esc(C.blurb)}</p>
                    <ul>
                        <li><b>${esc(C.abilities.primer.name)}</b> — ${esc(C.abilities.primer.desc)}</li>
                        <li><b>${esc(C.abilities.detonator.name)}</b> — ${esc(C.abilities.detonator.desc)}</li>
                        <li><b>${esc(C.abilities.ultimate.name)}</b> — ${esc(C.abilities.ultimate.desc)}</li>
                        <li><b>${esc(C.passive.name)}</b> — ${esc(C.passive.desc)}</li>
                    </ul>
                    ${locked ? `<p class="vault-lock">${esc(requirement)} <strong>${fmt(BO.RPGUnlocks.value(Pr.data, C.metric))}/${C.goal}</strong></p>` : ''}
                    <div class="rpg-class-foot"><span>${C.baseHp} HP · ${esc(BO.WeaponsData.get(C.startWeapon).shortName)}</span><b>${locked ? 'LOCKED' : rec ? `LEVEL ${rec.level}${active ? ' · ACTIVE' : ' · SWITCH'}` : 'SELECT'}</b></div>
                </button>`;
            }).join('');
            if (first) {
                return `
                <div class="rpg-first">
                    <header class="rpg-top"><div class="rpg-top-left"><button class="btn" data-act="back">← MAIN MENU</button>
                    <div class="rpg-brand"><span class="rpg-brand-kicker">ROGUE LITE • DELVE &amp; EXTRACT</span><div class="rpg-brand-title">CHOOSE YOUR OPERATIVE</div></div></div></header>
                    <p class="rpg-first-pitch">Delve floor by floor into the Blackout Vaults. Chain elemental combos with your abilities, bank your loot at an Extraction Beacon — or push deeper and risk losing it all. Choose one of three starting operatives. Twelve more can be unlocked in the Haven roster.</p>
                    <div class="rpg-classes">${cards}</div>
                </div>`;
            }
            return this._section('Roster', 'Each class keeps its own level, talents and equipped gear. Gold, scrap, stash, upgrades and checkpoints are shared.', `<div class="rpg-classes">${cards}</div>`);
        }

        _contractsHtml() {
            const p = this.Pr.data;
            const cards = Object.entries(this.D.CONTRACTS).map(([id, contract]) => {
                const locked = !p.checkpoints.some((floor) => floor >= contract.floor);
                const selected = p.contract === id;
                const completions = p.contractCompletions[id] || 0;
                return `<article class="rpg-entry ${selected ? 'selected' : ''}">
                    <h4>${esc(contract.name)}</h4>
                    <p>${esc(contract.objective)}${contract.floor > 1 ? ` on floor ${contract.floor} or deeper` : ''}.</p>
                    <p class="rpg-gold">◆ ${fmt(contract.gold)} gold · ⚙ ${fmt(contract.scrap)} scrap</p>
                    <div class="rpg-entry-footer">
                        <small>${completions ? `Completed ${fmt(completions)}×` : locked ? `Unlock at checkpoint ${contract.floor}` : 'Available now'}</small>
                        <button class="btn btn-sm" data-act="contract" data-id="${id}" aria-pressed="${selected}" ${locked ? 'disabled' : ''}>${selected ? 'REMOVE' : 'SELECT'}</button>
                    </div>
                </article>`;
            }).join('');
            const note = p.run ? ' Your suspended delve keeps its original contract.' : '';
            return this._section('Contract Board', `Choose one for your next delve. Finish it and extract to collect the reward.${note}`, `<div class="rpg-entry-grid">${cards}</div>`);
        }

        _collectionHtml() {
            const U = BO.RPGUnlocks;
            const p = this.Pr.data;
            const category = U.CATEGORIES[this.collectionSlot];
            const total = U.catalog.filter((item) => U.unlocked(p, item)).length;
            const tabs = Object.entries(U.CATEGORIES).map(([id, entry]) => `
                <button class="${id === this.collectionSlot ? 'active' : ''}" data-act="collection" data-slot="${id}" aria-pressed="${id === this.collectionSlot}">${esc(entry.name)}</button>`).join('');
            const items = U.catalog.filter((item) => item.slot === this.collectionSlot).map((item) => {
                const earned = U.unlocked(p, item);
                const equipped = Object.values(p.cosmetics).includes(item.id);
                const progress = item.metric ? Math.min(item.goal, U.value(p, item.metric)) : 0;
                return `<article class="vault-collectible ${earned ? 'earned' : ''}" style="--sigil:${item.color};--sigil-step:${item.pattern || 10}px">
                    <div class="vault-collectible-art" aria-hidden="true">${item.icon}</div>
                    <h4>${esc(item.name)}</h4><p>${esc(U.requirement(item))}</p>
                    ${earned ? `<button class="btn btn-sm" data-act="cosmetic" data-id="${item.id}" aria-pressed="${equipped}">${equipped ? 'REMOVE' : 'EQUIP'}</button>` :
                        item.metric ? `<progress aria-label="${esc(item.name)}" max="${item.goal}" value="${progress}"></progress><small>${fmt(progress)} / ${fmt(item.goal)}</small>` : '<small>Mystery exclusive</small>'}
                </article>`;
            }).join('');
            return this._section('Collection', `${total} of ${U.catalog.length} unlocked. ${category.effect}`,
                `<div class="rpg-seg vault-collection-tabs">${tabs}</div><div class="vault-collection-grid">${items}</div>`);
        }

        _itemCard(it, opts = {}) {
            const Pr = this.Pr;
            const D = this.D;
            const rar = Pr.rarity(it);
            const L = it.legendary ? D.legendaryById(it.legendary) : null;
            const slot = D.ITEM_SLOTS[it.slot];
            const set = L?.set ? D.SETS[L.set] : null;
            const setCount = set ? Pr.equippedSetCount(L.set) : 0;
            const eq = opts.compare === false ? null : (Pr.cls && Pr.cls.equip[it.slot]);
            let cmp = '';
            if (eq && eq.uid !== it.uid) {
                const a = Pr.baseStat(it).value, b = Pr.baseStat(eq).value;
                if (Math.abs(a - b) > 0.001) cmp = `<span class="rpg-cmp ${a > b ? 'up' : 'down'}">${a > b ? '▲' : '▼'}</span>`;
            }
            const sub = it.slot === 'weapon' ? esc(BO.WeaponsData.get(it.base).category) : slot.name;
            return `
                <div class="rpg-item ${opts.selected ? 'selected' : ''} ${opts.compact ? 'compact' : ''}" style="--r:${rar.color}" ${opts.act ? `data-act="${opts.act}" data-uid="${it.uid}"` : ''}>
                    <div class="rpg-item-head">
                        <span class="rpg-item-slot">${slot.icon}</span>
                        <div><b>${esc(it.name)}</b>${cmp}<small>${esc(rar.name)} ${sub} • iLvl ${it.ilvl}${set ? ` · ${esc(set.name)}` : ''}</small></div>
                    </div>
                    ${opts.compact ? '' : `<ul class="rpg-item-lines">
                        ${Pr.describeItem(it).map((l, i) => `<li class="${i === 0 ? 'base' : ''}">${esc(l)}</li>`).join('')}
                        ${L ? `<li class="uniq">★ ${esc(L.unique)}</li><li class="down">▼ ${esc(L.downside)}</li>` : ''}
                        ${set ? set.bonuses.map((bonus) => `<li class="${setCount >= bonus.pieces ? 'rpg-set-active' : 'rpg-dim'}">${bonus.pieces} pieces · ${esc(bonus.desc)}</li>`).join('') : ''}
                    </ul>`}
                    ${opts.footer || ''}
                </div>`;
        }

        _loadoutHtml() {
            const Pr = this.Pr;
            const rec = Pr.cls;
            const p = Pr.data;
            const slots = ['weapon', 'rig', 'relic'].map((slot) => {
                const it = rec.equip[slot];
                const S = this.D.ITEM_SLOTS[slot];
                const cands = p.stash.filter((x) => x.slot === slot);
                return `
                <div class="rpg-slot">
                    <div class="rpg-slot-head"><span>${S.icon} ${S.name.toUpperCase()}</span>${it && slot !== 'weapon' ? `<button class="btn btn-sm" data-act="unequip" data-slot="${slot}">UNEQUIP</button>` : ''}</div>
                    ${it ? this._itemCard(it, { compare: false }) : `<div class="rpg-empty">Empty — equip a ${S.name.toLowerCase()} from your stash.</div>`}
                    <div class="rpg-slot-cands">${cands.length ? cands.map((c) => this._itemCard(c, { compact: true, act: 'equip' })).join('') : `<small class="rpg-dim">No ${S.name.toLowerCase()}s in the stash.</small>`}</div>
                </div>`;
            }).join('');
            return this._section('Loadout', 'Click an item under a slot to equip it. The old item goes back to the stash. ▲/▼ compares the core stat.', `<div class="rpg-slots">${slots}</div>`);
        }

        _talentsHtml(inDelve) {
            const Pr = this.Pr;
            const D = this.D;
            const rec = Pr.cls;
            const tiers = D.TALENTS[Pr.classId].map((tier, ti) => {
                const unlocked = Pr.tierUnlocked(ti, rec);
                const lv = D.TALENT_TIER_LEVELS[ti];
                return `
                <div class="rpg-tier ${unlocked ? '' : 'locked'}">
                    <div class="rpg-tier-lv"><b>LV ${lv}</b><small>${unlocked ? (rec.talents[ti] ? 'CHOSEN' : 'CHOOSE 1') : 'LOCKED'}</small></div>
                    <div class="rpg-tier-opts">${tier.map((t) => `
                        <button class="rpg-talent ${rec.talents[ti] === t.id ? 'chosen' : ''}" ${unlocked ? `data-act="talent" data-tier="${ti}" data-talent="${t.id}"` : 'disabled'}>
                            <b>${esc(t.name)}</b><span>${esc(t.desc)}</span>
                        </button>`).join('')}</div>
                </div>`;
            }).join('');
            const respec = inDelve ? '<p class="rpg-hint">You can pick an unlocked tier now. Changing a choice (respec) is free at the Haven.</p>' : '<button class="btn" data-act="respec">RESPEC (FREE)</button>';
            return this._section('Talents', 'Each tier offers three mutually exclusive choices. They change how your abilities work.', `<div class="rpg-tiers">${tiers}</div><div class="rpg-row-end">${respec}</div>`);
        }

        _stashHtml() {
            const Pr = this.Pr;
            const p = Pr.data;
            const sel = this.selectedUid ? Pr.findStashItem(this.selectedUid) : null;
            const grid = p.stash.length
                ? p.stash.map((it) => this._itemCard(it, { compact: true, act: 'select', selected: sel && sel.uid === it.uid })).join('')
                : '<div class="rpg-empty">Your stash is empty. Extract from a delve to bank loot here.</div>';
            const detail = sel ? `
                ${this._itemCard(sel)}
                <div class="rpg-actions">
                    <button class="btn btn-primary" data-act="equip" data-uid="${sel.uid}">EQUIP</button>
                    <button class="btn" data-act="sell" data-uid="${sel.uid}">SELL ◆${Pr.sellValue(sel)}</button>
                    <button class="btn" data-act="salvage" data-uid="${sel.uid}">SALVAGE ⚙${Pr.scrapValue(sel)}</button>
                </div>` : '<div class="rpg-empty">Select an item to see it in full.</div>';
            return `<div class="rpg-grid-split">
                ${this._section(`Stash ${p.stash.length} / ${Pr.stashCapacity()}`, '', `<div class="rpg-item-grid">${grid}</div>
                    <label class="rpg-toggle"><input type="checkbox" data-act="autosalvage" ${p.autoSalvage ? 'checked' : ''}> Auto-salvage Common items when picked up in a delve</label>`)}
                ${this._section('Details', '', detail)}
            </div>`;
        }

        _merchantHtml() {
            const Pr = this.Pr;
            const p = Pr.data;
            const stock = p.merchant.stock.length ? p.merchant.stock.map((it) => this._itemCard(it, {
                footer: `<button class="btn btn-sm btn-primary rpg-item-buy" data-act="buy" data-uid="${it.uid}" ${p.gold < Pr.buyValue(it) ? 'disabled' : ''}>BUY ◆${fmt(Pr.buyValue(it))}</button>`
            })).join('') : '<div class="rpg-empty">Sold out. New stock arrives after your next delve.</div>';
            const elixirs = this.D.ELIXIRS.map((e) => `
                <div class="rpg-elixir ${p.elixir === e.id ? 'active' : ''}">
                    <span>${e.icon}</span><div><b>${esc(e.name)}</b><small>${esc(e.desc)}</small></div>
                    ${p.elixir === e.id ? '<em>READY</em>' : `<button class="btn btn-sm" data-act="elixir" data-id="${e.id}" ${p.elixir || p.gold < e.cost ? 'disabled' : ''}>◆${e.cost}</button>`}
                </div>`).join('');
            return `
                ${this._section('Merchant', 'Stock refreshes after every delve. Bought items go to your stash.', `<div class="rpg-item-row">${stock}</div>`)}
                ${this._section('Elixirs', 'One elixir per delve. It is consumed when the delve starts.', `<div class="rpg-elixirs">${elixirs}</div>`)}`;
        }

        _forgeHtml() {
            const Pr = this.Pr;
            const p = Pr.data;
            const rec = Pr.cls;
            const owned = [...['weapon', 'rig', 'relic'].map((s) => rec.equip[s]).filter(Boolean), ...p.stash];
            const sel = this.forgeUid ? Pr.findOwnedItem(this.forgeUid) : null;
            const list = owned.map((it) => this._itemCard(it, { compact: true, act: 'forgepick', selected: sel && sel.uid === it.uid, compare: false })).join('');
            let panel = '<div class="rpg-empty">Pick an item to work on.</div>';
            if (sel) {
                const rc = Pr.rerollCost(sel);
                const pc = Pr.promoteCost(sel);
                const fc = Pr.reforgeCost(sel);
                const can = (c) => c && p.gold >= (c.gold || 0) && p.scrap >= (c.scrap || 0);
                panel = `
                    ${this._itemCard(sel, { compare: false })}
                    <div class="rpg-forge-ops">
                        ${sel.affixes.length ? sel.affixes.map((a, i) => `<div class="rpg-forge-op"><div><b>Reroll</b><small>${esc(Pr.affixLabel(sel.slot, a))}</small></div><button class="btn btn-sm" data-act="reroll" data-uid="${sel.uid}" data-idx="${i}" ${can(rc) ? '' : 'disabled'}>◆${rc.gold} ⚙${rc.scrap}</button></div>`).join('') : '<div class="rpg-forge-op"><div><b>Reroll</b><small>This item has no affixes. Promote it first.</small></div></div>'}
                        <div class="rpg-forge-op"><div><b>Promote rarity</b><small>${pc ? `To ${esc(this.D.RARITIES[this.D.RARITY_INDEX[sel.rarity] + 1].name)} — adds an affix.` : 'Epic is the forge ceiling. Legendaries only drop.'}</small></div>${pc ? `<button class="btn btn-sm" data-act="promote" data-uid="${sel.uid}" ${can(pc) ? '' : 'disabled'}>◆${pc.gold} ⚙${pc.scrap}</button>` : ''}</div>
                        <div class="rpg-forge-op"><div><b>Reforge item level</b><small>${fc ? `iLvl ${sel.ilvl} → ${sel.ilvl + fc.gain} (your deepest floor / level sets the cap).` : 'Already at your current cap.'}</small></div>${fc ? `<button class="btn btn-sm" data-act="reforge" data-uid="${sel.uid}" ${can(fc) ? '' : 'disabled'}>⚙${fc.scrap}</button>` : ''}</div>
                    </div>`;
            }
            return `<div class="rpg-grid-split">
                ${this._section('Your items', 'Equipped items first, then your stash.', `<div class="rpg-item-grid">${list || '<div class="rpg-empty">No items.</div>'}</div>`)}
                ${this._section('The Forge', 'Turn scrap and gold into exactly the item you want.', panel)}
            </div>`;
        }

        _upgradesHtml() {
            const Pr = this.Pr;
            const p = Pr.data;
            const rows = this.D.UPGRADES.map((u) => {
                const lv = Pr.upgradeLevel(u.id);
                const cost = Pr.upgradeCost(u.id);
                return `
                <div class="rpg-upgrade">
                    <span class="rpg-upgrade-ico">${u.icon}</span>
                    <div><b>${esc(u.name)}</b><small>${esc(u.desc)}</small>
                        <div class="rpg-pips">${u.costs.map((_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div></div>
                    ${cost == null ? '<em>MAXED</em>' : `<button class="btn btn-sm btn-primary" data-act="upgrade" data-id="${u.id}" ${p.gold < cost ? 'disabled' : ''}>◆${fmt(cost)}</button>`}
                </div>`;
            }).join('');
            return this._section('Haven upgrades', 'Permanent improvements shared by every class.', `<div class="rpg-upgrades">${rows}</div>`);
        }

        _onHavenChange(e) {
            const t = e.target;
            if (t.matches('[data-act="autosalvage"]')) {
                this.Pr.data.autoSalvage = !!t.checked;
                this.Pr.save();
            }
        }

        _onHavenClick(e) {
            const btn = e.target.closest('[data-act]');
            if (!btn || btn.disabled) return;
            const act = btn.dataset.act;
            const Pr = this.Pr;
            const p = Pr.data;
            const uid = btn.dataset.uid;
            const ok = () => BO.Sound.playUIClick();
            const fail = (msg) => { BO.Sound.playEmptyClick(); if (msg) this._flash(msg); };
            switch (act) {
                case 'back': ok(); BO.Menus.showScreen('main_menu'); return;
                case 'tab': ok(); this.tab = btn.dataset.tab; this.selectedUid = null; break;
                case 'gameguide': ok(); BO.Menus.openLegend('rpg'); return;
                case 'pickclass':
                    ok();
                    if (p.run && p.run.classId !== btn.dataset.class && Pr.classId === p.run.classId) this._flash('Your suspended delve stays with its class.');
                    if (!Pr.selectClass(btn.dataset.class)) return;
                    this.tab = 'delve';
                    Pr.refreshMerchant();
                    break;
                case 'contract':
                    if (Pr.setContract(p.contract === btn.dataset.id ? null : btn.dataset.id)) ok();
                    else fail('Unlock the required checkpoint to take this contract.');
                    break;
                case 'collection': ok(); this.collectionSlot = btn.dataset.slot; break;
                case 'cosmetic': if (Pr.equipCosmetic(btn.dataset.id)) ok(); else fail(); break;
                case 'startfloor': ok(); this.startFloor = Number(btn.dataset.floor) || 1; break;
                case 'difficulty': ok(); p.difficulty = btn.dataset.diff; Pr.save(); break;
                case 'delve':
                    if (p.run && !window.confirm(`Start a new delve? The suspended delve on floor ${p.run.floor} and its unbanked haul will be lost.`)) return;
                    ok();
                    Pr.clearRun();
                    this._launch({ resume: false, startFloor: this.startFloor });
                    return;
                case 'resume': ok(); this._launch({ resume: true }); return;
                case 'abandon':
                    if (!window.confirm('Abandon this delve? Its unbanked gold and items are lost. XP you earned is kept.')) return;
                    ok();
                    p.stats.deaths++;
                    Pr.clearRun();
                    break;
                case 'equip': if (Pr.equipFromStash(uid)) { ok(); this.selectedUid = null; } else fail(); break;
                case 'unequip': if (Pr.unequip(btn.dataset.slot)) ok(); else fail('Your stash is full.'); break;
                case 'select': ok(); this.selectedUid = uid; break;
                case 'sell': { const g = Pr.sellFromStash(uid); if (g) { BO.Sound.playShopBuy(); this._flash(`Sold for ◆${g}`); this.selectedUid = null; } break; }
                case 'salvage': { const s = Pr.salvageFromStash(uid); if (s) { ok(); this._flash(`Salvaged for ⚙${s}`); this.selectedUid = null; } break; }
                case 'talent': if (Pr.chooseTalent(Number(btn.dataset.tier), btn.dataset.talent)) BO.Sound.playPerkBuy(); else fail(); break;
                case 'respec': ok(); Pr.respec(); this._flash('Talents reset. Choose again — it is free.'); break;
                case 'buy': {
                    const r = Pr.buyMerchantItem(uid);
                    if (r === 'ok') BO.Sound.playShopBuy(); else fail(r === 'stash' ? 'Your stash is full.' : 'Not enough gold.');
                    break;
                }
                case 'elixir': if (Pr.buyElixir(btn.dataset.id)) BO.Sound.playShopBuy(); else fail(); break;
                case 'upgrade': if (Pr.buyUpgrade(btn.dataset.id)) BO.Sound.playPerkBuy(); else fail('Not enough gold.'); break;
                case 'forgepick': ok(); this.forgeUid = uid; break;
                case 'reroll': if (Pr.rerollAffix(uid, Number(btn.dataset.idx))) BO.Sound.playPaPChime(); else fail(); break;
                case 'promote': if (Pr.promote(uid)) BO.Sound.playPaPChime(); else fail(); break;
                case 'reforge': if (Pr.reforge(uid)) BO.Sound.playPaPChime(); else fail(); break;
                default: return;
            }
            this.renderHaven();
        }

        _launch(o) {
            this.haven.classList.add('hidden');
            if (BO.App) BO.App.startMatch({ mode: 'rpg', resume: !!o.resume, startFloor: o.startFloor || 1 });
        }

        _flash(msg) {
            let el = document.getElementById('rpg-flash');
            if (!el) {
                el = document.createElement('div');
                el.id = 'rpg-flash';
                document.body.append(el);
            }
            el.textContent = msg;
            el.classList.remove('show');
            void el.offsetWidth;
            el.classList.add('show');
        }

        /* ======================================================================
           In-delve HUD
        ====================================================================== */

        onFloorEntered() {
            this._hudCache = {};
            this.closeModal(true);
        }

        clearWorldUi() {
            for (const f of this.floats) { f.life = 0; f.el.classList.add('hidden'); }
            for (const b of this.bars) b.el.classList.add('hidden');
        }

        updateHud(dt) {
            const M = this.M;
            if (!M.active || !M.run || BO.State.activeMode !== 'rpg') return;
            this._updateFloats(dt);
            this._updateBars();
            const D = this.D;
            const run = M.run;
            const s = M.stats;
            const C = D.CLASSES[s.classId];
            const kb = BO.Settings.getKeybinds();
            const cache = this._hudCache;
            const set = (key, el, html) => { if (cache[key] !== html) { cache[key] = html; el.innerHTML = html; } };
            const q = (sel) => this.hud.querySelector(sel);
            if (cache.accent !== C.color) { cache.accent = C.color; this.hud.style.setProperty('--rpg-accent', C.color); }

            // Floor card.
            const room = D.ROOMS[run.roomType];
            const crest = BO.RPGUnlocks.equipped(this.Pr.data, 'crest');
            const frame = BO.RPGUnlocks.equipped(this.Pr.data, 'frame');
            this.hud.style.setProperty('--vault-frame', frame?.color || '#c7a36b');
            set('floor', q('.rpg-floor-label'), `${crest ? `<i style="color:${crest.color}">${crest.icon}</i> ` : ''}FLOOR ${run.floor} <small>${esc(M.layout ? M.layout.biome.name.toUpperCase() : '')}</small>`);
            set('room', q('.rpg-room-chip'), `<span style="color:${room.color}">${run.mystery ? '? ' : room.icon} ${esc(room.name.toUpperCase())}</span>`);
            let obj;
            const living = M._livingCount();
            if (M.state === 'fighting') {
                if (M.waves) obj = `Ambush — wave ${Math.max(1, M.waves.current)} / ${M.waves.total} • ${living} left`;
                else if (M.boss) obj = `Defeat ${esc(M.boss.rpg.boss.name)}`;
                else obj = `Clear the floor — <b>${living}</b> ${living === 1 ? 'enemy' : 'enemies'} left${M.hazards.length ? ' · Leave the circles as they brighten' : ''}`;
            } else if (M.state === 'cleared') {
                obj = M.beacon ? 'Extract at the <b style="color:#4ade80">beacon</b> — or take a gate deeper' : 'Choose a <b>gate</b> to go deeper';
                if (M.altar && !M.altar.used) obj = 'Commune with the <b style="color:#c084fc">shrine</b> — then choose a gate';
            } else obj = '';
            const eventObjective = M.roomEvent?.objective();
            set('obj', q('.rpg-objective'), eventObjective ? esc(eventObjective) : obj);
            const map = M.layout;
            set('encounter', q('.vault-encounter'), map ? `${esc(map.style)} · ${map.W} × ${map.L} m${!room.quiet && room.id !== 'boss' ? ` · ${esc(map.encounter.name)}` : ''}${run.curse ? ' · Cursed' : ''}` : '');
            set('haul', q('.rpg-haul'), `<span class="rpg-gold">◆ ${fmt(run.gold)}</span><span>🔑 ${run.keys ?? 0}</span><span>💣 ${run.bombs ?? 0}</span><span>▣ ${run.pack.length}/${s.packSlots}</span><span>⚙ ${fmt(run.scrap)}</span><span class="rpg-dim">UNBANKED</span>`);
            const contract = D.CONTRACTS[run.contract];
            const contractStatus = contract && run.floor < contract.floor ? `counts from floor ${contract.floor}` :
                contract && run.contractProgress >= contract.goal ? 'complete · extract to collect' : `${run.contractProgress}/${contract?.goal}`;
            set('contract', q('.rpg-contract-hud'), contract ? `⚑ ${esc(contract.name)} · ${contractStatus}` : '');
            const boonsHtml = Array.from(run.boons).map((id) => { const b = D.boonById(id); return `<span class="rpg-boon-chip" title="${esc(b.name)}: ${esc(b.desc)}">${b.icon}</span>`; }).join('');
            set('boons', q('.rpg-boons'), boonsHtml);

            // Isaac Synergies & Artifact Icon Strip.
            const ID = BO.RPGItemsData;
            const synHtml = ID && Array.isArray(run.transformations) ? run.transformations.map((tid) => {
                const tf = ID.transformationById(tid);
                return tf ? `<span class="rpg-syn-badge" style="--c:${tf.color}" title="${esc(tf.desc)}">${tf.icon} ${esc(tf.name)}</span>` : '';
            }).join('') : '';
            set('synergies', q('.rpg-synergies'), synHtml);
            const artHtml = ID && Array.isArray(run.artifacts) ? run.artifacts.map((aid) => {
                const it = ID.passiveById(aid);
                return it ? `<span class="rpg-art-chip" style="--c:${it.color}" title="${esc(it.name)}: ${esc(it.desc)}">${it.icon}</span>` : '';
            }).join('') : '';
            set('artifacts', q('.rpg-artifacts-strip'), artHtml);

            // Soul Shield & Protection badges.
            const vitalsEl = q('.rpg-isaac-vitals');
            const soul = Math.round(run.soulShield || 0);
            const showVitals = soul > 0 || run.holyMantleReady || (run.livesLeft || 0) > 0;
            vitalsEl.classList.toggle('hidden', !showVitals);
            if (showVitals) {
                const cap = D.ISAAC?.soulShieldCap || 150;
                q('.rpg-soulbar').classList.toggle('hidden', soul <= 0);
                q('.rpg-soulbar-fill').style.width = BO.Math.clamp(soul / cap, 0, 1) * 100 + '%';
                set('soul', q('.rpg-soulbar-label'), `💙 SOUL SHIELD ${soul}`);
                const badges = [];
                if (run.holyMantleReady) badges.push('<span class="rpg-vbadge" title="Negates next hit on this floor">🛡 MANTLE</span>');
                if ((run.livesLeft || 0) > 0) badges.push(`<span class="rpg-vbadge cat" title="Dead Cat revives remaining">🐈 ×${run.livesLeft}</span>`);
                set('vbadges', q('.rpg-vital-badges'), badges.join(''));
            }

            // Momentum.
            const cap = run.boons.has('adrenal') ? 15 : D.MOMENTUM.max;
            const st = M.momentum.stacks;
            const pipsKey = `${st}/${cap}`;
            if (cache.pips !== pipsKey) {
                cache.pips = pipsKey;
                q('.rpg-momentum-pips').innerHTML = Array.from({ length: cap }, (_, i) => `<i class="${i < st ? 'on' : ''}"></i>`).join('');
                q('.rpg-momentum-label').textContent = st > 0 ? `MOMENTUM ${st} • +${Math.round(st * D.MOMENTUM.xpPerStack * 100)}% XP • +${Math.round(st * D.MOMENTUM.dmgPerStack * 100)}% DMG` : 'MOMENTUM — CHAIN KILLS WITHOUT GETTING HIT';
                q('.rpg-momentum').classList.toggle('hot', st >= cap * 0.7);
            }

            // XP.
            const rec = this.Pr.cls;
            const need = this.Pr.xpNeeded(rec);
            q('.rpg-xp-fill').style.width = (need ? BO.Math.clamp(rec.xp / need, 0, 1) * 100 : 100) + '%';
            set('xp', q('.rpg-xp-label'), `LV ${rec.level} ${esc(C.name.toUpperCase())} • ${need ? `${fmt(rec.xp)} / ${fmt(need)} XP` : 'MAX LEVEL'}${this.Pr.unspentTalentTiers(rec) ? ' • <b>TALENT READY [TAB]</b>' : ''}`);

            // Abilities + Active + Pocket.
            const A = M.ability;
            const slots = {
                primer: { def: C.abilities.primer, key: kb.rpgAbility1, cd: A.cd.primer, max: BO.RPGAbilities.cooldownFor('primer') },
                detonator: { def: C.abilities.detonator, key: kb.rpgAbility2, cd: A.cd.detonator, max: BO.RPGAbilities.cooldownFor('detonator') },
                ultimate: { def: C.abilities.ultimate, key: kb.rpgUltimate },
                potion: { key: kb.rpgPotion }
            };
            for (const el of this.hud.querySelectorAll('.rpg-ab')) {
                const slot = el.dataset.slot;
                if (slot === 'active') {
                    const actDef = ID && run.activeItem ? ID.activeById(run.activeItem) : null;
                    const charges = run.activeCharges || 0;
                    const maxCh = actDef ? actDef.charges : 0;
                    set('gactive', el.querySelector('.rpg-ab-glyph'), actDef ? actDef.icon : '◇');
                    set('nactive', el.querySelector('.rpg-ab-name'), actDef ? esc(actDef.name) : 'NO ACTIVE');
                    const pipsHtml = actDef ? Array.from({ length: maxCh }, (_, idx) => `<i class="${idx < charges ? 'on' : ''}"></i>`).join('') : '';
                    set('pactive', el.querySelector('.rpg-charge-pips'), pipsHtml);
                    const ready = !!(actDef && charges >= maxCh);
                    el.style.setProperty('--cd', actDef ? String(BO.Math.clamp(1 - charges / Math.max(1, maxCh), 0, 1)) : '0');
                    el.querySelector('.rpg-ab-cdtext').textContent = actDef && !ready ? `${charges}/${maxCh}` : '';
                    el.classList.toggle('ready', ready);
                    el.classList.toggle('empty', !actDef);
                    el.style.setProperty('--c', actDef ? actDef.color : '#4ade80');
                    continue;
                }
                if (slot === 'pocket') {
                    const pk = run.pocket;
                    let glyph = '🃏';
                    let label = 'EMPTY';
                    let col = '#38bdf8';
                    if (pk && ID) {
                        if (pk.kind === 'pill') {
                            const entry = run.pillMap?.[String(pk.appearanceIdx)];
                            const pillDef = entry?.identified ? ID.pillById(entry.id) : null;
                            const app = ID.PILL_APPEARANCES[pk.appearanceIdx] || {};
                            glyph = '💊';
                            label = pillDef ? esc(pillDef.name) : 'Mystery Pill ???';
                            col = app.color || '#a855f7';
                        } else if (pk.kind === 'card') {
                            const cardDef = ID.cardById(pk.id);
                            glyph = cardDef?.icon || '🃏';
                            label = cardDef ? esc(`${cardDef.numeral} ${cardDef.name}`) : 'TAROT CARD';
                            col = cardDef?.color || '#fde047';
                        }
                    }
                    set('gpocket', el.querySelector('.rpg-ab-glyph'), glyph);
                    set('npocket', el.querySelector('.rpg-ab-name'), label);
                    el.style.setProperty('--cd', '0');
                    el.querySelector('.rpg-ab-cdtext').textContent = '';
                    el.classList.toggle('ready', !!pk);
                    el.classList.toggle('empty', !pk);
                    el.style.setProperty('--c', col);
                    continue;
                }
                const info = slots[slot];
                const glyph = slot === 'potion' ? '⚗' : (slot === 'ultimate' ? C.icon : (slot === 'primer' ? '◉' : '✸'));
                set('g' + slot, el.querySelector('.rpg-ab-glyph'), glyph);
                set('k' + slot, el.querySelector('.rpg-ab-key'), esc(BO.Settings.keyLabel(info.key)));
                set('n' + slot, el.querySelector('.rpg-ab-name'), slot === 'potion' ? `POTION ×${run.potions}` : esc(info.def.name));
                let frac = 0;
                let text = '';
                let ready = true;
                if (slot === 'primer' || slot === 'detonator') {
                    frac = info.cd > 0 ? info.cd / info.max : 0;
                    text = info.cd > 0 ? info.cd.toFixed(info.cd < 3 ? 1 : 0) : '';
                    ready = info.cd <= 0;
                } else if (slot === 'ultimate') {
                    if (A.ultActive > 0) { frac = 0; text = A.ultActive.toFixed(0) + 's'; ready = true; } else {
                        frac = 1 - A.ult;
                        text = A.ult >= 1 ? '' : Math.floor(A.ult * 100) + '%';
                        ready = A.ult >= 1;
                    }
                } else {
                    ready = run.potions > 0;
                    frac = A.potionCd > 0 ? A.potionCd / 0.8 : 0;
                }
                el.style.setProperty('--cd', String(BO.Math.clamp(frac, 0, 1)));
                el.querySelector('.rpg-ab-cdtext').textContent = text;
                el.classList.toggle('ready', ready && A.silenced <= 0);
                el.classList.toggle('active', slot === 'ultimate' && A.ultActive > 0);
                el.classList.toggle('empty', slot === 'potion' && run.potions <= 0);
                el.style.setProperty('--c', C.color);
            }
            const sil = q('.rpg-silenced');
            sil.classList.toggle('hidden', A.silenced <= 0);
            if (A.silenced > 0) sil.textContent = `SILENCED ${A.silenced.toFixed(1)}s`;
        }

        pulseAbility(slot) {
            const el = this.hud.querySelector(`.rpg-ab[data-slot="${slot}"]`);
            if (!el) return;
            el.classList.remove('pulse');
            void el.offsetWidth;
            el.classList.add('pulse');
        }

        _project(pos, out) {
            const cam = BO.App && BO.App.worldCamera;
            if (!cam) return false;
            _proj.copy(pos).project(cam);
            if (_proj.z > 1 || _proj.z < -1) return false;
            out.x = (_proj.x * 0.5 + 0.5) * window.innerWidth;
            out.y = (-_proj.y * 0.5 + 0.5) * window.innerHeight;
            return out.x > -60 && out.x < window.innerWidth + 60 && out.y > -60 && out.y < window.innerHeight + 60;
        }

        _updateBars() {
            const M = this.M;
            const P = BO.Player;
            const D = this.D;
            const cands = [];
            for (const z of M.enemies) {
                if (!M.isAlive(z)) continue;
                const r = z.rpg;
                const d = z.pos.distanceTo(P.pos);
                if (d > 38) continue;
                const statused = Object.keys(r.statuses).length > 0;
                if (!r.aggro && !statused && z.hp >= z.maxHp && !r.elite && d > 16) continue;
                if (r.isBoss) continue; // the boss uses the top HUD bar
                cands.push({ z, d });
            }
            cands.sort((a, b) => a.d - b.d);
            const scr = { x: 0, y: 0 };
            for (let i = 0; i < this.bars.length; i++) {
                const b = this.bars[i];
                const c = cands[i];
                if (!c) { if (!b.el.classList.contains('hidden')) b.el.classList.add('hidden'); continue; }
                const z = c.z;
                const r = z.rpg;
                const head = z.pos.clone();
                head.y += z.height * (z.sizeMult || 1) + 0.45;
                if (!this._project(head, scr)) { b.el.classList.add('hidden'); continue; }
                b.el.classList.remove('hidden');
                const scale = BO.Math.clamp(1.25 - c.d / 40, 0.6, 1.1);
                b.el.style.transform = `translate(${scr.x.toFixed(0)}px, ${scr.y.toFixed(0)}px) translate(-50%, -100%) scale(${scale.toFixed(2)})`;
                b.fill.style.width = BO.Math.clamp(z.hp / z.maxHp, 0, 1) * 100 + '%';
                const statusHtml = D.STATUS_ORDER.filter((id) => M.hasStatus(z, id)).map((id) => `<i style="--c:${D.STATUSES[id].color}">${D.STATUSES[id].icon}</i>`).join('')
                    + (r.arch.weak ? `<em title="Weak to ${D.STATUSES[r.arch.weak].name} reactions" style="--c:${D.STATUSES[r.arch.weak].color}">WEAK ${D.STATUSES[r.arch.weak].icon}</em>` : '')
                    + (r.affixes.includes('warded') && r.wardBroken <= 0 && r.armorBreak <= 0 && !M.hasStatus(z, 'expose') ? '<em style="--c:#a78bfa">WARD</em>' : '');
                const nameHtml = r.elite ? `${esc(z.spec.name)} <span>${r.affixes.map((a) => `<b style="color:${D.ELITE_AFFIXES[a].color}">${esc(D.ELITE_AFFIXES[a].name)}</b>`).join(' ')}</span>` : (c.d < 14 ? `<span class="rpg-hb-role">${esc(r.arch.role)}</span>` : '');
                const key = statusHtml + '|' + nameHtml;
                if (b.key !== key) {
                    b.key = key;
                    b.status.innerHTML = statusHtml;
                    b.name.innerHTML = nameHtml;
                }
                b.el.classList.toggle('elite', !!r.elite);
            }
        }

        floatText(pos, text, color = '#fff', size = 14, life = 1.0) {
            const f = this.floats.find((x) => x.life <= 0) || this.floats.reduce((a, b) => (a.life < b.life ? a : b));
            f.pos.copy(pos);
            f.pos.x += (Math.random() - 0.5) * 0.5;
            f.pos.y += 1.6 + Math.random() * 0.3;
            f.pos.z += (Math.random() - 0.5) * 0.5;
            f.life = life;
            f.max = life;
            f.vy = 1.1;
            f.el.textContent = text;
            f.el.style.color = color;
            f.el.style.fontSize = size + 'px';
            f.el.classList.remove('hidden');
        }

        damageNumber(z, dealt, ctx) {
            if (dealt < 1) return;
            const src = ctx.source;
            const color = ctx.isHead ? '#fde047' : (src === 'reaction' ? '#f0abfc' : (src === 'ability' ? '#7dd3fc' : (src === 'dot' ? '#fb923c' : '#f8fafc')));
            const size = ctx.isHead || src === 'reaction' ? 17 : (src === 'dot' || src === 'conduct' ? 11 : 13);
            this.floatText(z.pos.clone().add(new THREE.Vector3(0, z.height * 0.2, 0)), Math.round(dealt).toString(), color, size, 0.75);
        }

        reactionText(z, reaction, weak) {
            this.floatText(z.pos.clone().add(new THREE.Vector3(0, z.height * 0.5, 0)), reaction.name + (weak ? ' • WEAK!' : '') + '!', reaction.color, weak ? 22 : 19, 1.15);
        }

        _updateFloats(dt) {
            const scr = { x: 0, y: 0 };
            for (const f of this.floats) {
                if (f.life <= 0) continue;
                f.life -= dt;
                if (f.life <= 0) { f.el.classList.add('hidden'); continue; }
                f.pos.y += f.vy * dt;
                f.vy *= 0.96;
                if (!this._project(f.pos, scr)) { f.el.style.opacity = '0'; continue; }
                const t = f.life / f.max;
                f.el.style.opacity = String(Math.min(1, t * 2.4));
                const pop = t > 0.85 ? 1 + (t - 0.85) * 2.2 : 1;
                f.el.style.transform = `translate(${scr.x.toFixed(0)}px, ${scr.y.toFixed(0)}px) translate(-50%, -50%) scale(${pop.toFixed(2)})`;
            }
        }

        /* ======================================================================
           Gate texture
        ====================================================================== */

        makeGateTexture(room, floor, door = null, cost = null) {
            if (door?.hidden) room = { icon: '?', name: 'Veiled', color: door.color, desc: 'The sign has been scratched away. Whatever waits here pays 30% more.' };
            const c = document.createElement('canvas');
            c.width = 512;
            c.height = 796;
            const ctx = c.getContext('2d');
            const g = ctx.createLinearGradient(0, 0, 0, c.height);
            g.addColorStop(0, 'rgba(8,12,20,0.92)');
            g.addColorStop(1, 'rgba(20,26,40,0.78)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, c.width, c.height);
            ctx.strokeStyle = room.color;
            ctx.lineWidth = 10;
            ctx.strokeRect(14, 14, c.width - 28, c.height - 28);
            ctx.globalAlpha = 0.18;
            ctx.fillStyle = room.color;
            for (let y = 40; y < c.height; y += 18) ctx.fillRect(30, y, c.width - 60, 2);
            ctx.globalAlpha = 1;
            ctx.textAlign = 'center';
            ctx.fillStyle = room.color;
            ctx.font = '900 190px "Segoe UI Symbol", "Segoe UI", sans-serif';
            ctx.fillText(room.icon, 256, 300);
            ctx.font = '900 72px Bahnschrift, Impact, sans-serif';
            ctx.fillStyle = '#f8fafc';
            ctx.fillText(room.name.toUpperCase(), 256, 430);
            ctx.font = 'bold 34px Consolas, monospace';
            ctx.fillStyle = room.color;
            ctx.fillText(`FLOOR ${floor}`, 256, 488);
            ctx.font = '26px "Segoe UI", sans-serif';
            ctx.fillStyle = '#cbd5e1';
            const words = room.desc.split(' ');
            let line = '';
            let y = 560;
            for (const w of words) {
                const test = line ? line + ' ' + w : w;
                if (ctx.measureText(test).width > 420) { ctx.fillText(line, 256, y); y += 36; line = w; } else line = test;
            }
            if (line) ctx.fillText(line, 256, y);
            if (door && door.id !== 'standard') {
                // Door-type band along the bottom of the sign.
                ctx.fillStyle = 'rgba(6,8,14,0.82)';
                ctx.fillRect(28, 680, c.width - 56, 90);
                ctx.fillStyle = door.color;
                ctx.fillRect(28, 680, c.width - 56, 5);
                ctx.font = '900 34px Bahnschrift, Impact, sans-serif';
                ctx.fillText(`${door.icon}  ${door.name.toUpperCase()}`, 256, 724);
                ctx.font = 'bold 24px Consolas, monospace';
                ctx.fillStyle = '#e2e8f0';
                const tag = cost ? `COST: ${cost.label}` : door.window ? `SEALS ${door.window}s AFTER CLEAR` : door.potion ? 'FREE POTION REFILL' : 'BONUS REWARDS';
                ctx.fillText(tag, 256, 756);
            }
            const tex = new THREE.CanvasTexture(c);
            if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
            return tex;
        }

        /* ======================================================================
           Modals
        ====================================================================== */

        openModal(o) {
            this.modalOpen = true;
            this.modalClosable = o.closable !== false;
            this._modalHandlers = o.handlers || {};
            this._onModalClose = o.onClose || null;
            this.modal.innerHTML = `
                <div class="rpg-modal-box ${o.wide ? 'wide' : ''}" style="${o.accent ? `--rpg-accent:${o.accent}` : ''}">
                    <div class="rpg-modal-head">
                        <div>${o.kicker ? `<span class="rpg-kicker">${esc(o.kicker)}</span>` : ''}<h2>${o.title}</h2></div>
                        ${this.modalClosable ? `<button class="btn btn-sm" data-mact="close">${esc(o.closeLabel || 'CLOSE')} <kbd>ESC</kbd></button>` : ''}
                    </div>
                    <div class="rpg-modal-body">${o.html}</div>
                </div>`;
            this.modal.classList.remove('hidden');
            this.modal.classList.remove('rpg-modal-in');
            void this.modal.offsetWidth;
            this.modal.classList.add('rpg-modal-in');
            if (BO.App && BO.App._clearInputState) BO.App._clearInputState();
            if (document.pointerLockElement) document.exitPointerLock();
        }

        closeModal(silent = false) {
            if (!this.modalOpen) { this.modal.classList.add('hidden'); return; }
            this.modalOpen = false;
            this.modal.classList.add('hidden');
            const cb = this._onModalClose;
            this._onModalClose = null;
            this._modalHandlers = {};
            if (cb && !silent) cb();
            if (!silent && BO.State.screen === 'playing' && !BO.State.paused && BO.App && BO.App._safePointerLock) BO.App._safePointerLock();
        }

        handleKey(e) {
            if (e.code === 'Escape' || (e.code === 'Tab' && this._modalKind === 'pack')) {
                e.preventDefault();
                if (this.modalClosable) { BO.Sound.playUIClick(); this.closeModal(); }
            }
        }

        _onModalClick(e) {
            const btn = e.target.closest('[data-mact]');
            if (!btn || btn.disabled) return;
            const act = btn.dataset.mact;
            if (act === 'close') { BO.Sound.playUIClick(); this.closeModal(); return; }
            const h = this._modalHandlers[act];
            if (h) h(btn);
        }

        openBoonPick(title, boons, onPick) {
            this._modalKind = 'boon';
            BO.Sound.playCardFan?.();
            this.openModal({
                kicker: 'BOON — LASTS UNTIL THE DELVE ENDS', title: esc(title), closable: false, accent: '#c084fc',
                html: `<div class="rpg-boon-row">${boons.map((b) => `
                    <button class="rpg-boon" data-mact="pick" data-id="${b.id}">
                        <span class="rpg-boon-ico">${b.icon}</span><b>${esc(b.name)}</b><p>${esc(b.desc)}</p><em>CHOOSE</em>
                    </button>`).join('')}</div>`,
                handlers: {
                    pick: (btn) => {
                        const b = boons.find((x) => x.id === btn.dataset.id);
                        BO.Sound.playCardDraw?.();
                        this.modalClosable = true;
                        this.closeModal();
                        if (b) onPick(b);
                    }
                }
            });
        }

        openPack() {
            const M = this.M;
            if (!M.active || !M.run || M.state === 'ended' || M.state === 'transition') return;
            this._modalKind = 'pack';
            this._packTab = this._packTab || 'pack';
            this._renderPack();
        }

        _renderPack() {
            const M = this.M;
            const Pr = this.Pr;
            const run = M.run;
            const rec = Pr.cls;
            const s = M.stats;
            const tab = this._packTab;
            const tabs = `<div class="rpg-seg rpg-pack-tabs">
                <button class="${tab === 'pack' ? 'active' : ''}" data-mact="ptab" data-tab="pack">PACK ${run.pack.length}/${s.packSlots}</button>
                <button class="${tab === 'artifacts' ? 'active' : ''}" data-mact="ptab" data-tab="artifacts">ARTIFACTS ${(run.artifacts || []).length}</button>
                <button class="${tab === 'talents' ? 'active' : ''}" data-mact="ptab" data-tab="talents">TALENTS${Pr.unspentTalentTiers(rec) ? ' •' : ''}</button>
                <button class="${tab === 'boons' ? 'active' : ''}" data-mact="ptab" data-tab="boons">BOONS ${run.boons.size}</button>
            </div>`;
            let body = '';
            if (tab === 'pack') {
                const equipped = ['weapon', 'rig', 'relic'].map((slot) => rec.equip[slot] ? this._itemCard(rec.equip[slot], { compare: false, compact: false }) : `<div class="rpg-empty">No ${slot}</div>`).join('');
                const items = run.pack.length ? run.pack.map((it) => this._itemCard(it, {
                    footer: `<div class="rpg-actions"><button class="btn btn-sm btn-primary" data-mact="pequip" data-uid="${it.uid}">EQUIP</button><button class="btn btn-sm" data-mact="pdrop" data-uid="${it.uid}">SALVAGE ⚙${Pr.scrapValue(it)}</button></div>`
                })).join('') : '<div class="rpg-empty">Nothing in your pack yet. Items you pick up stay unbanked until you extract.</div>';
                body = `
                    <div class="rpg-pack-cols">
                        <div><h4>EQUIPPED <small>(kept even if you die)</small></h4><div class="rpg-item-col">${equipped}</div></div>
                        <div><h4>PACK <small>(lost on death — equipping moves your old item into the pack)</small></h4><div class="rpg-item-col">${items}</div></div>
                    </div>
                    <div class="rpg-stats rpg-stats-6">
                        <div class="rpg-stat"><small>HP</small><b>${Math.ceil(BO.Player.hp)} / ${s.maxHp}</b></div>
                        <div class="rpg-stat"><small>POTIONS</small><b>${run.potions} / ${s.potionsMax}</b></div>
                        <div class="rpg-stat"><small>UNBANKED</small><b class="rpg-gold">◆ ${fmt(run.gold)}</b></div>
                        <div class="rpg-stat"><small>KEYS / BOMBS</small><b>🔑 ${run.keys ?? 0} · 💣 ${run.bombs ?? 0}</b></div>
                        <div class="rpg-stat"><small>KILLS</small><b>${run.kills}</b></div>
                        <div class="rpg-stat"><small>REACTIONS</small><b>${run.reactions}</b></div>
                    </div>`;
            } else if (tab === 'artifacts') {
                const ID = BO.RPGItemsData;
                const activeDef = ID && run.activeItem ? ID.activeById(run.activeItem) : null;
                const counts = BO.RPGItems ? BO.RPGItems.transformationCounts(run) : {};
                const synHtml = ID ? ID.TRANSFORMATIONS.map((tf) => {
                    const c = counts[tf.id] || 0;
                    const active = (run.transformations || []).includes(tf.id);
                    return `<div class="rpg-art-card" style="--c:${tf.color}"><span>${tf.icon}</span><div><b>${esc(tf.name)} (${Math.min(3, c)}/3)${active ? ' ✓' : ''}</b><small>${esc(tf.desc)}</small></div></div>`;
                }).join('') : '';
                const passivesHtml = ID && (run.artifacts || []).length
                    ? run.artifacts.map((id) => {
                        const it = ID.passiveById(id);
                        return it ? `<div class="rpg-art-card" style="--c:${it.color}"><span>${it.icon}</span><div><b>${esc(it.name)}</b><small>${esc(it.desc)}</small></div></div>` : '';
                    }).join('')
                    : '<div class="rpg-empty">No passive artifacts yet. Check Treasure rooms, Shops, Locked Reliquaries, and Devil/Angel pedestals!</div>';
                body = `
                    <h4>ACTIVE ITEM &amp; POCKET</h4>
                    <div class="rpg-art-grid">
                        <div class="rpg-art-card" style="--c:${activeDef ? activeDef.color : '#4ade80'}"><span>${activeDef ? activeDef.icon : '◇'}</span><div><b>${activeDef ? esc(activeDef.name) + ` (${run.activeCharges || 0}/${activeDef.charges}) [G/C]` : 'Empty Active Slot [G/C]'}</b><small>${activeDef ? esc(activeDef.desc) : 'Find an Active Artifact on pedestals to charge and trigger it.'}</small></div></div>
                        <div class="rpg-art-card" style="--c:#38bdf8"><span>${run.pocket ? (run.pocket.kind === 'pill' ? '💊' : (ID?.cardById(run.pocket.id)?.icon || '🃏')) : '🃏'}</span><div><b>${run.pocket ? (run.pocket.kind === 'pill' ? (run.pillMap?.[String(run.pocket.appearanceIdx)]?.identified ? esc(ID.pillById(run.pillMap[String(run.pocket.appearanceIdx)].id).name) : 'Mystery Pill ???') : esc(ID?.cardById(run.pocket.id)?.name || 'Card')) + ' [T]' : 'Empty Pocket [T]'}</b><small>Press T to use your held Pill or Tarot Card. Press B to drop a Floor Bomb.</small></div></div>
                    </div>
                    <h4>TRANSFORMATIONS (COLLECT 3 TAGGED ITEMS)</h4>
                    <div class="rpg-art-grid">${synHtml}</div>
                    <h4>PASSIVE ARTIFACTS (${(run.artifacts || []).length})</h4>
                    <div class="rpg-art-grid">${passivesHtml}</div>`;
            } else if (tab === 'talents') {
                body = this._talentsHtml(true).replace(/data-act="talent"/g, 'data-mact="ptalent"');
            } else {
                body = run.boons.size ? `<div class="rpg-boon-row small">${Array.from(run.boons).map((id) => { const b = this.D.boonById(id); return `<div class="rpg-boon owned"><span class="rpg-boon-ico">${b.icon}</span><b>${esc(b.name)}</b><p>${esc(b.desc)}</p></div>`; }).join('')}</div>` : '<div class="rpg-empty">No boons yet. Clear Elite rooms, guardians and shrines to earn them.</div>';
            }
            this.openModal({
                kicker: `FLOOR ${run.floor} • DELVE PACK`, title: 'Pack & Character', wide: true, closeLabel: 'BACK TO THE FIGHT', accent: this.D.CLASSES[s.classId].color,
                html: tabs + body,
                handlers: {
                    ptab: (btn) => { this._packTab = btn.dataset.tab; BO.Sound.playUIClick(); this._renderPack(); },
                    pequip: (btn) => {
                        const idx = run.pack.findIndex((x) => x.uid === btn.dataset.uid);
                        if (idx < 0) return;
                        const it = run.pack.splice(idx, 1)[0];
                        const prev = Pr.equip(it);
                        if (prev) run.pack.splice(idx, 0, prev);
                        if (it.slot === 'weapon') M.refreshWeapon();
                        M.recomputeStats();
                        Pr.save();
                        BO.Sound.playPerkBuy();
                        this._renderPack();
                    },
                    pdrop: (btn) => {
                        const idx = run.pack.findIndex((x) => x.uid === btn.dataset.uid);
                        if (idx < 0) return;
                        const it = run.pack.splice(idx, 1)[0];
                        run.scrap += Pr.scrapValue(it);
                        BO.Sound.playUIClick();
                        this._renderPack();
                    },
                    ptalent: (btn) => {
                        if (Pr.cls.talents[Number(btn.dataset.tier)]) { this._flash('Respec at the Haven to change a chosen talent.'); return; }
                        if (Pr.chooseTalent(Number(btn.dataset.tier), btn.dataset.talent)) {
                            M.recomputeStats();
                            BO.Sound.playPerkBuy();
                            this._renderPack();
                        }
                    }
                }
            });
        }

        openPackFull(newItem, onChoose) {
            const M = this.M;
            this._modalKind = 'packfull';
            this.openModal({
                kicker: 'PACK FULL', title: 'Make room?', accent: this.Pr.rarity(newItem).color, wide: true, closeLabel: 'LEAVE IT',
                html: `<p class="rpg-hint">Salvage one item (it turns into unbanked scrap) to pick up the new one — or leave the new item where it lies.</p>
                    <div class="rpg-pack-cols">
                        <div><h4>NEW</h4>${this._itemCard(newItem)}</div>
                        <div><h4>SALVAGE ONE</h4><div class="rpg-item-col">${M.run.pack.map((it) => this._itemCard(it, { footer: `<button class="btn btn-sm" data-mact="swap" data-uid="${it.uid}">SALVAGE &amp; TAKE NEW</button>` })).join('')}</div></div>
                    </div>`,
                handlers: { swap: (btn) => { const uid = btn.dataset.uid; this.closeModal(); onChoose(uid); } }
            });
        }

        openExtractConfirm(run, onYes) {
            this._modalKind = 'extract';
            const contract = this.D.CONTRACTS[run.contract];
            const reward = contract && run.contractProgress >= contract.goal ? contract : null;
            const items = run.pack.length ? run.pack.map((it) => this._itemCard(it, { compact: true })).join('') : '<small class="rpg-dim">No items in the pack.</small>';
            this.openModal({
                kicker: `FLOOR ${run.floor} • EXTRACTION BEACON`, title: 'Extract and bank your haul?', accent: '#4ade80', closeLabel: 'STAY',
                html: `<div class="rpg-extract">
                        <div class="rpg-stat big"><small>GOLD</small><b class="rpg-gold">◆ ${fmt(run.gold)}</b></div>
                        <div class="rpg-stat big"><small>SCRAP</small><b>⚙ ${fmt(run.scrap)}</b></div>
                        <div class="rpg-stat big"><small>ITEMS</small><b>${run.pack.length}</b></div>
                    </div>
                    <div class="rpg-item-grid">${items}</div>
                    ${reward ? `<p class="rpg-gold">${esc(reward.name)} pays ◆ ${fmt(reward.gold)} gold and ⚙ ${fmt(reward.scrap)} scrap on extraction.</p>` : ''}
                    <p class="rpg-hint">Going deeper multiplies gold, XP and item quality — but if you die, all of this is lost.</p>
                    <div class="rpg-row-end"><button class="btn btn-primary rpg-btn-big" data-mact="yes">EXTRACT NOW</button></div>`,
                handlers: { yes: () => { this.closeModal(true); onYes(); } }
            });
        }

        openShrine(run, goldCost, onChoose) {
            this._modalKind = 'shrine';
            const pct = this.D.SHRINE.hpCostPct;
            this.openModal({
                kicker: 'SHRINE', title: 'An offering for power', accent: '#c084fc', closeLabel: 'WALK AWAY',
                html: `<div class="rpg-boon-row">
                    <button class="rpg-boon" data-mact="blood"><span class="rpg-boon-ico">🩸</span><b>Blood Offering</b><p>Lose ${pct}% max HP for the rest of this delve. Choose a Boon.</p><em>OFFER BLOOD</em></button>
                    <button class="rpg-boon" data-mact="gold" ${run.gold < goldCost ? 'disabled' : ''}><span class="rpg-boon-ico">◆</span><b>Tithe</b><p>Pay ${goldCost} unbanked gold. Choose a Boon.</p><em>${run.gold < goldCost ? `NEED ◆${goldCost}` : `PAY ◆${goldCost}`}</em></button>
                </div>`,
                handlers: {
                    blood: () => { this.closeModal(true); onChoose('blood'); },
                    gold: () => { this.closeModal(true); onChoose('gold'); }
                }
            });
        }

        showReport(r) {
            const D = this.D;
            const C = D.CLASSES[r.classId];
            const win = r.outcome === 'extract';
            this._modalKind = 'report';
            const lostItems = !win && r.itemsLost && r.itemsLost.length ? `<h4>LOST</h4><div class="rpg-item-grid">${r.itemsLost.map((it) => this._itemCard(it, { compact: true })).join('')}</div>` : '';
            const banked = win && r.banked && r.banked.length ? `<h4>BANKED TO YOUR STASH</h4><div class="rpg-item-grid">${r.banked.map((it) => this._itemCard(it, { compact: true })).join('')}</div>` : '';
            this.openModal({
                kicker: `${C.name.toUpperCase()} • FLOORS ${r.startFloor}–${r.floor} • ${r.time}`,
                title: win ? 'EXTRACTED' : 'YOU FELL',
                accent: win ? '#4ade80' : '#ef4444',
                closable: false, wide: true,
                html: `
                    <p class="rpg-report-sub">${win ? 'The haul is safe in the Haven.' : 'The Vaults keep what you carried. Your XP and equipped gear are safe.'}</p>
                    <div class="rpg-stats rpg-stats-6">
                        <div class="rpg-stat"><small>${win ? 'GOLD BANKED' : 'GOLD KEPT'}</small><b class="rpg-gold">◆ ${fmt(r.goldKept)}</b></div>
                        <div class="rpg-stat"><small>${win ? 'SCRAP BANKED' : 'GOLD LOST'}</small><b>${win ? '⚙ ' + fmt(r.scrapKept) : '◆ ' + fmt(r.goldLost)}</b></div>
                        <div class="rpg-stat"><small>XP EARNED</small><b>${fmt(r.xpEarned)}</b></div>
                        <div class="rpg-stat"><small>LEVELS</small><b>+${r.levelsGained}</b></div>
                        <div class="rpg-stat"><small>KILLS</small><b>${r.kills}</b></div>
                        <div class="rpg-stat"><small>REACTIONS</small><b>${r.reactions}</b></div>
                    </div>
                    ${win && r.soldOverflow ? `<p class="rpg-warn">Stash full — overflow items were sold for ◆${fmt(r.soldOverflow)}.</p>` : ''}
                    ${r.contractReward ? `<p class="rpg-gold">Contract paid · ${esc(r.contractReward.name)} · ◆ ${fmt(r.contractReward.gold)} gold · ⚙ ${fmt(r.contractReward.scrap)} scrap</p>` : ''}
                    ${banked}${lostItems}
                    <div class="rpg-row-end">
                        <button class="btn" data-mact="haven">RETURN TO THE HAVEN</button>
                        <button class="btn btn-primary rpg-btn-big" data-mact="again">DELVE AGAIN →</button>
                    </div>`,
                handlers: {
                    haven: () => { this.modalClosable = true; this.closeModal(true); this._returnToHaven(); },
                    again: () => { this.modalClosable = true; this.closeModal(true); this._returnToHaven(true); }
                }
            });
        }

        _returnToHaven(quickDelve = false) {
            if (BO.App) BO.App.exitToMenu();
            if (quickDelve) {
                this._launch({ resume: false, startFloor: this.startFloor });
            }
        }

        fadeTransition(cb) {
            this.fade.classList.add('on');
            setTimeout(() => {
                try { cb(); } finally {
                    requestAnimationFrame(() => this.fade.classList.remove('on'));
                }
            }, 200);
        }
    }

    BO.RPGUI = new RPGUI();
})(window);
