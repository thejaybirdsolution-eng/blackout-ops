/* ============================================================================
   BLACKOUT OPS — Create-a-Class
   Left: your loadout as a list of slots (click any slot to change it).
   Center: the 3D weapon + live stat bars (hover any option to preview changes).
   Right: the picker for whichever slot is selected.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    const STAT_TIPS = {
        DAMAGE: 'How much health each shot takes away. Higher means fewer shots to kill.',
        'FIRE RATE': 'How fast the weapon fires (rounds per minute).',
        RANGE: 'How far shots keep their full power.',
        ACCURACY: 'How tightly shots group when aiming down sights.',
        CONTROL: 'How little the weapon kicks while firing.',
        MOBILITY: 'How fast you move and aim with it.'
    };

    const ATT_CATS = [
        { id: 'optic', label: 'Optic', icon: 'staged_assets/ui/military_icons/Optics Sensors/compact-binocular-optic-001.png', tip: 'Your sight. Iron sights, red dot, holographic, ACOG or a sniper scope.' },
        { id: 'muzzle', label: 'Muzzle', icon: 'staged_assets/ui/military_icons/Attachments/suppressor-heat-cover-001.png', tip: 'Suppressor (quieter, hidden from radar), compensator (less kick) or muzzle brake.' },
        { id: 'underbarrel', label: 'Underbarrel', icon: 'staged_assets/ui/military_icons/Attachments/hand-stop-grip-001.png', tip: 'Foregrip for stability, laser for hip-fire, or a barrel swap for range versus speed.' },
        { id: 'magazine', label: 'Magazine', icon: 'staged_assets/ui/military_icons/Attachments/drum-magazine-001.png', tip: 'Bigger magazines or faster reloads.' },
        { id: 'stock', label: 'Stock', icon: 'staged_assets/ui/military_icons/Attachments/adjustable-rifle-stock-001.png', tip: 'Faster movement and aiming, or steadier recoil.' }
    ];

    const SHORT_CLASS_LABELS = {
        ALL: 'All', 'Assault Rifle': 'AR', SMG: 'SMG', 'Sniper Rifle': 'Sniper', 'Marksman Rifle': 'Marksman',
        Shotgun: 'Shotgun', LMG: 'LMG', Pistol: 'Pistol', Launcher: 'Launcher', 'Melee Weapon': 'Melee', 'Magic Weapon': 'Magic'
    };

    const SLOT_GROUPS = [
        { label: 'WEAPONS', slots: ['primary', 'secondary'] },
        { label: 'PERKS', slots: ['perk1', 'perk2', 'perk3'] },
        { label: 'EQUIPMENT', slots: ['lethal', 'tactical'] },
        { label: 'POWERS', slots: ['field', 'ultimate'] },
        { label: 'MULTIPLAYER', slots: ['streaks'] }
    ];

    const SLOT_META = {
        primary: { label: 'Primary', col: '#f5a623' },
        secondary: { label: 'Secondary', col: '#38bdf8' },
        perk1: { label: 'Perk 1', col: '#38bdf8' },
        perk2: { label: 'Perk 2', col: '#f43f5e' },
        perk3: { label: 'Perk 3', col: '#eab308' },
        lethal: { label: 'Lethal [G]', col: '#f97316' },
        tactical: { label: 'Tactical [Q]', col: '#a855f7' },
        field: { label: 'Special [X]', col: '#22c55e' },
        ultimate: { label: 'Ultimate [U]', col: '#fde047' },
        streaks: { label: 'Killstreaks', col: '#f5a623' }
    };

    function escAttr(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function isWeaponSlot(s) { return s === 'primary' || s === 'secondary'; }

    class GunsmithUI {
        constructor() {
            this.editingSlot = 'primary';
            this.weaponView = 'weapon'; // 'weapon' | optic | muzzle | underbarrel | magazine | stock | 'camo'
            this.activeWeaponClass = 'ALL';
            this.activeSourceGame = 'all';
            this.searchQuery = '';
            this.streakIndex = 0;
            this.hoverPreviewCfg = null;
            this.orbitYaw = 1.03;
            this.orbitPitch = 0.14;
            this.orbitZoom = 0.92;
            this.dragging = false;
            this.lastX = 0;
            this.lastY = 0;
            this.onRebuildShowcase = null;
        }

        init(onRebuildShowcase) {
            this.onRebuildShowcase = onRebuildShowcase;
            this.elScreen = document.getElementById('screen-gunsmith');

            const viewport = document.getElementById('gs-model-viewport');
            if (viewport) {
                viewport.addEventListener('pointerdown', (e) => {
                    if (e.button !== 0 || !e.isPrimary) return;
                    this.dragging = true;
                    this.lastX = e.clientX;
                    this.lastY = e.clientY;
                    viewport.setPointerCapture(e.pointerId);
                });
                viewport.addEventListener('pointermove', (e) => {
                    if (!this.dragging || !e.isPrimary) return;
                    this.orbitYaw += (e.clientX - this.lastX) * 0.01;
                    this.orbitPitch = BO.Math.clamp(this.orbitPitch + (e.clientY - this.lastY) * 0.008, -0.7, 0.85);
                    this.lastX = e.clientX;
                    this.lastY = e.clientY;
                });
                viewport.addEventListener('lostpointercapture', () => { this.dragging = false; });
                viewport.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    this.orbitZoom = BO.Math.clamp(this.orbitZoom + e.deltaY * 0.0008, 0.55, 1.55);
                }, { passive: false });
                viewport.addEventListener('keydown', (e) => {
                    const steps = { ArrowLeft: [-.12, 0, 0], ArrowRight: [.12, 0, 0],
                        ArrowUp: [0, -.1, 0], ArrowDown: [0, .1, 0], '+': [0, 0, -.08], '-': [0, 0, .08] };
                    const delta = steps[e.key];
                    if (!delta) return;
                    e.preventDefault();
                    this.orbitYaw += delta[0];
                    this.orbitPitch = BO.Math.clamp(this.orbitPitch + delta[1], -.7, .85);
                    this.orbitZoom = BO.Math.clamp(this.orbitZoom + delta[2], .55, 1.55);
                });
            }
            const resetBtn = document.getElementById('gs-reset-orbit');
            if (resetBtn) {
                resetBtn.onclick = () => {
                    BO.Sound.playUIClick();
                    this.orbitYaw = 1.03;
                    this.orbitPitch = 0.14;
                    this.orbitZoom = 0.92;
                };
            }
        }

        open() {
            this.hoverPreviewCfg = null;
            this.render();
            this.refresh3D();
        }

        _weaponSlotForView() {
            return this.editingSlot === 'secondary' ? 'secondary' : 'primary';
        }

        refresh3D() {
            if (!this.onRebuildShowcase) return;
            const cls = BO.Loadout.getActiveClass();
            this.onRebuildShowcase(cls[this._weaponSlotForView()]);
        }

        _attCount(cfg) {
            const a = cfg.attachments || {};
            const spec = BO.WeaponsData.get(cfg.id);
            const defOptic = spec.modelSpec && spec.modelSpec.defaultScope ? 'sniper_scope' : 'iron';
            let n = 0;
            if (a.optic && a.optic !== defOptic) n++;
            if (a.muzzle && a.muzzle !== 'none') n++;
            if (a.underbarrel && a.underbarrel !== 'none') n++;
            if (a.magazine && a.magazine !== 'std_mag') n++;
            if (a.stock && a.stock !== 'std_stock') n++;
            return n;
        }

        _slotValue(cls, slot) {
            const A = BO.AttachmentsData;
            const perkName = (id) => {
                for (let t = 1; t <= 3; t++) {
                    const p = A.getPerksByTier(t).find((x) => x.id === id);
                    if (p) return p.name;
                }
                return id || '—';
            };
            switch (slot) {
                case 'primary':
                case 'secondary': {
                    const cfg = cls[slot];
                    const spec = BO.WeaponsData.get(cfg.id);
                    const n = this._attCount(cfg);
                    return { value: spec.name, meta: `${spec.category} • ${n} attachment${n === 1 ? '' : 's'} • ${A.getCamo(cfg.camo).name}` };
                }
                case 'perk1': return { value: perkName(cls.perks[0]), meta: 'Blue perk' };
                case 'perk2': return { value: perkName(cls.perks[1]), meta: 'Red perk' };
                case 'perk3': return { value: perkName(cls.perks[2]), meta: 'Yellow perk' };
                case 'lethal': return { value: (A.LETHALS[cls.lethal] || {}).name || '—', meta: 'Grenade' };
                case 'tactical': return { value: (A.TACTICALS[cls.tactical] || {}).name || '—', meta: 'Utility' };
                case 'field': return { value: (A.FIELD_UPGRADES[cls.fieldUpgrade] || {}).name || '—', meta: 'Recharging power' };
                case 'ultimate': return { value: (A.ULTIMATE_POWERS[cls.ultimatePower || 'gravity_spikes'] || {}).name || '—', meta: 'Charges from kills' };
                case 'streaks': return {
                    value: (cls.killstreaks || []).map((k) => (A.KILLSTREAKS[k] || {}).name || k).join(' • '),
                    meta: (cls.killstreaks || []).map((k) => ((A.KILLSTREAKS[k] || {}).kills || '?') + 'K').join(' / ')
                };
                default: return { value: '', meta: '' };
            }
        }

        render() {
            const select = BO.SelectionHighlight;
            const previous = select.capture(this.elScreen);
            const idx = BO.Loadout.getSelectedClassIndex();
            const classes = BO.Loadout.getClasses();
            const cls = classes[idx];
            this._renderLeft(cls, idx, classes);
            this._renderRight(cls, idx);
            this._renderCenterPlate(cls);
            this._renderStats(cls);
            select.register(this.elScreen, {
                'gunsmith-slot': '[data-slot]',
                ['gunsmith-tabs-' + (isWeaponSlot(this.editingSlot) ? 'weapon' : this.editingSlot)]: '[data-view], [data-ks]',
                'gunsmith-categories': '[data-wcat]',
                ['gunsmith-choice-' + this.editingSlot + '-' + this.weaponView]: '.opt-card, .camo-swatch'
            });
            select.update(this.elScreen, previous);
        }

        /* ---------------- LEFT: class picker + loadout slots ---------------- */
        _renderLeft(cls, idx, classes) {
            const el = document.getElementById('gs-left-panel');
            el.innerHTML = `
                <div class="cac-class-head">
                    <select id="gs-class-select" class="cac-class-select" data-tip-title="Switch class" data-tip="You have 10 class slots. Each works in every mode.">
                        ${classes.map((c, i) => `<option value="${i}" ${i === idx ? 'selected' : ''}>${i + 1}. ${escAttr(c.name)}</option>`).join('')}
                    </select>
                    <div class="cac-class-actions">
                        <button class="btn btn-sm" id="gs-rename-btn" data-tip-title="Rename" data-tip="Give this class your own name.">RENAME</button>
                        <button class="btn btn-sm" id="gs-copy-btn" data-tip-title="Copy to next slot" data-tip="Copies this whole class into the next slot so you can make a variation.">COPY</button>
                    </div>
                </div>
                <div class="cac-slots">
                    ${SLOT_GROUPS.map((g) => `
                        <div class="cac-slot-group">${g.label}</div>
                        ${g.slots.map((s) => {
                            const v = this._slotValue(cls, s);
                            const m = SLOT_META[s];
                            return `
                                <button class="cac-slot ${this.editingSlot === s ? 'active' : ''} ${isWeaponSlot(s) ? 'cac-slot-weapon' : ''}" data-slot="${s}" style="--slot-col:${m.col};">
                                    <span class="cac-slot-label">${m.label}</span>
                                    <span class="cac-slot-value">${escAttr(v.value)}</span>
                                    <span class="cac-slot-meta">${escAttr(v.meta)}</span>
                                    <span class="cac-slot-arrow">›</span>
                                </button>`;
                        }).join('')}
                    `).join('')}
                </div>`;

            document.getElementById('gs-class-select').onchange = (e) => {
                BO.Sound.playUIClick();
                this.hoverPreviewCfg = null;
                BO.Loadout.setSelectedClassIndex(Number(e.target.value));
                this.render();
                this.refresh3D();
            };
            document.getElementById('gs-rename-btn').onclick = () => {
                const nn = window.prompt('Class name (max 22 characters):', cls.name);
                if (nn !== null) { BO.Loadout.renameClass(idx, nn); this.render(); }
            };
            document.getElementById('gs-copy-btn').onclick = () => {
                const next = (idx + 1) % 10;
                BO.Loadout.copyClass(idx, next);
                BO.Loadout.setSelectedClassIndex(next);
                BO.Sound.playUIClick();
                this.render();
                this.refresh3D();
            };
            el.querySelectorAll('[data-slot]').forEach((b) => {
                b.onclick = () => {
                    BO.Sound.playUIClick();
                    const prevWeapon = this._weaponSlotForView();
                    this.editingSlot = b.dataset.slot;
                    this.hoverPreviewCfg = null;
                    if (isWeaponSlot(this.editingSlot)) this.weaponView = 'weapon';
                    this.render();
                    if (this._weaponSlotForView() !== prevWeapon) this.refresh3D();
                };
            });
        }

        /* ---------------- CENTER: name plate + stats ---------------- */
        _renderCenterPlate(cls) {
            const plate = document.getElementById('gs-viewport-plate');
            if (!plate) return;
            const slot = this._weaponSlotForView();
            const cfg = cls[slot];
            const spec = BO.WeaponsData.get(cfg.id);
            const rec = BO.Save.getWeaponRecord(cfg.id);
            plate.innerHTML = `
                <div class="plate-kicker">${slot.toUpperCase()} • ${escAttr(spec.category.toUpperCase())} • WEAPON LV ${rec.level}</div>
                <div class="plate-name">${escAttr(spec.name)}</div>
                <div class="plate-sub">${this._attCount(cfg)} / 5 attachments • ${escAttr(BO.AttachmentsData.getCamo(cfg.camo).name)}</div>`;
        }

        _renderStats(cls) {
            const dock = document.getElementById('gs-stats-dock');
            if (!dock) return;
            const slot = this._weaponSlotForView();
            const cfg = cls[slot];
            const activeCfg = this.hoverPreviewCfg || cfg;
            const baseBars = BO.Loadout.computeStatBars(cfg);
            const bars = BO.Loadout.computeStatBars(activeCfg);
            const st = BO.Loadout.computeWeaponStats(activeCfg, 0, cls.perks);
            const previewing = !!this.hoverPreviewCfg;
            const row = (lbl, val, cur) => {
                const d = previewing ? val - cur : 0;
                return `
                    <div class="stat-row" data-tip-title="${lbl}" data-tip="${escAttr(STAT_TIPS[lbl])}">
                        <span>${lbl}</span>
                        <div class="stat-bar-bg">
                            <div class="stat-bar-fill" style="width:${Math.min(val, cur)}%"></div>
                            ${d > 0 ? `<div class="stat-bar-gain" style="left:${cur}%;width:${d}%"></div>` : ''}
                            ${d < 0 ? `<div class="stat-bar-loss" style="left:${val}%;width:${-d}%"></div>` : ''}
                        </div>
                        <span class="stat-num">${val}${d ? `<em class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : ''}${d}</em>` : ''}</span>
                    </div>`;
            };
            dock.innerHTML = `
                <div class="stats-head">${previewing ? '<span class="preview-tag">PREVIEW</span>' : ''}${escAttr(bars.baseName)}</div>
                ${row('DAMAGE', bars.damage, baseBars.damage)}
                ${row('FIRE RATE', bars.fireRate, baseBars.fireRate)}
                ${row('RANGE', bars.range, baseBars.range)}
                ${row('ACCURACY', bars.accuracy, baseBars.accuracy)}
                ${row('CONTROL', bars.control, baseBars.control)}
                ${row('MOBILITY', bars.mobility, baseBars.mobility)}
                <div class="stats-facts">
                    <span><b>${st.damage}${st.pellets > 1 ? '×' + st.pellets : ''}</b>DMG</span>
                    <span><b>${bars.rpm}</b>RPM</span>
                    <span><b>${bars.magSize}</b>MAG</span>
                    <span><b>${st.reloadTime.toFixed(1)}s</b>RELOAD</span>
                    <span><b>${bars.adsMs}ms</b>ADS</span>
                    <span><b>${st.headMult}×</b>HEAD</span>
                </div>`;
        }

        /* ---------------- RIGHT: picker for the selected slot ---------------- */
        _renderRight(cls, idx) {
            const el = document.getElementById('gs-right-panel');
            const slot = this.editingSlot;
            const m = SLOT_META[slot];
            if (isWeaponSlot(slot)) {
                const cfg = cls[slot];
                const spec = BO.WeaponsData.get(cfg.id);
                const isGun = spec.kind === 'gun';
                const views = [{ id: 'weapon', label: 'Weapon', cur: spec.shortName || spec.name }];
                if (isGun) {
                    ATT_CATS.forEach((c) => {
                        const defId = c.id === 'optic' ? (spec.modelSpec && spec.modelSpec.defaultScope ? 'sniper_scope' : 'iron') : BO.AttachmentsData.ATTACHMENTS[c.id][0].id;
                        const curId = (cfg.attachments && cfg.attachments[c.id]) || defId;
                        const att = BO.AttachmentsData.getAttachment(c.id, curId);
                        views.push({ id: c.id, label: c.label, cur: att ? att.name : '—', changed: curId !== defId });
                    });
                }
                views.push({ id: 'camo', label: 'Camo', cur: BO.AttachmentsData.getCamo(cfg.camo).name });
                if (!views.find((v) => v.id === this.weaponView)) this.weaponView = 'weapon';
                el.innerHTML = `
                    <div class="picker-head" style="--slot-col:${m.col};">
                        <div class="picker-kicker">${m.label.toUpperCase()}</div>
                        <div class="picker-title">${escAttr(spec.name)}</div>
                    </div>
                    <div class="picker-tabs">
                        ${views.map((v) => {
                            const cat = ATT_CATS.find((c) => c.id === v.id);
                            const ico = v.id === 'weapon'
                                ? 'staged_assets/ui/military_icons/Firearms/compact-folding-carbine-001.png'
                                : (v.id === 'camo' ? 'staged_assets/ui/military_icons/Consumables/camouflage-face-paint-tin-001.png' : (cat ? cat.icon : ''));
                            return `
                            <button class="picker-tab ${this.weaponView === v.id ? 'active' : ''} ${v.changed ? 'changed' : ''}" data-view="${v.id}" ${v.id !== 'weapon' && v.id !== 'camo' ? `data-tip-title="${v.label}" data-tip="${escAttr((cat || {}).tip || '')}"` : ''}>
                                ${ico ? `<img src="${ico}" alt="" style="width:14px;height:14px;object-fit:contain;vertical-align:-2px;margin-right:4px">` : ''}<span>${v.label}</span><small>${escAttr(v.cur)}</small>
                            </button>`;
                        }).join('')}
                    </div>
                    <div class="picker-body" id="gs-option-list"></div>`;
                el.querySelectorAll('[data-view]').forEach((b) => {
                    b.onclick = () => { BO.Sound.playUIClick(); this.weaponView = b.dataset.view; this.hoverPreviewCfg = null; this.render(); };
                });
                const host = document.getElementById('gs-option-list');
                if (this.weaponView === 'weapon') this._renderWeaponList(host, cls, idx, slot);
                else if (this.weaponView === 'camo') this._renderCamos(host, cls, idx, slot);
                else this._renderAttachments(host, cls, idx, slot, this.weaponView);
                return;
            }

            el.innerHTML = `
                <div class="picker-head" style="--slot-col:${m.col};">
                    <div class="picker-kicker">${m.label.toUpperCase()}</div>
                    <div class="picker-title">${escAttr(this._slotValue(cls, slot).value)}</div>
                </div>
                ${slot === 'streaks' ? `<div class="picker-tabs">${[0, 1, 2].map((s) => {
                    const ks = BO.AttachmentsData.KILLSTREAKS[cls.killstreaks[s]] || {};
                    return `<button class="picker-tab ${this.streakIndex === s ? 'active' : ''}" data-ks="${s}"><span>Streak ${s + 1}</span><small>${escAttr(ks.name || '—')}</small></button>`;
                }).join('')}</div>` : ''}
                <div class="picker-body" id="gs-option-list"></div>`;
            el.querySelectorAll('[data-ks]').forEach((b) => {
                b.onclick = () => { BO.Sound.playUIClick(); this.streakIndex = Number(b.dataset.ks); this.render(); };
            });
            this._renderGearList(document.getElementById('gs-option-list'), cls, idx, slot);
        }

        _optionCard({ name, desc, sub, active, locked, lockText, badge, onClick, onEnter, onLeave }) {
            const btn = document.createElement('button');
            btn.className = `opt-card ${active ? 'active' : ''} ${locked ? 'locked' : ''}`;
            btn.disabled = !!locked;
            btn.innerHTML = `
                <span class="opt-top"><b>${escAttr(name)}</b>${badge || ''}${active ? '<span class="opt-eq">EQUIPPED</span>' : ''}</span>
                <span class="opt-desc">${locked ? escAttr(lockText) : escAttr(desc || '')}</span>
                ${sub && !locked ? `<span class="opt-sub">${sub}</span>` : ''}`;
            if (!locked) {
                btn.setAttribute('data-tip-title', name);
                btn.setAttribute('data-tip', desc || name);
            }
            if (onClick) btn.onclick = onClick;
            if (onEnter) btn.onmouseenter = onEnter;
            if (onLeave) btn.onmouseleave = onLeave;
            return btn;
        }

        _renderWeaponList(host, cls, classIdx, slot) {
            const cfg = cls[slot];
            const hasOverkill = cls.perks.includes('overkill');
            const sandboxAll = !!(BO.Save && BO.Save.data && BO.Save.data.unlockAll);
            const allList = sandboxAll ? BO.WeaponsData.listAll() : BO.WeaponsData.listLoadoutWeapons();
            const eligible = allList.filter((w) => {
                if (sandboxAll) return true;
                if (slot === 'primary') return w.slotType === 'primary' || w.kind === 'melee';
                return w.slotType === 'secondary' || w.kind === 'melee' || hasOverkill;
            });
            const availCats = ['ALL', ...BO.WeaponsData.CLASS_ORDER.filter((cat) => eligible.some((w) => w.category === cat))];
            if (!availCats.includes(this.activeWeaponClass)) this.activeWeaponClass = 'ALL';

            const tools = document.createElement('div');
            tools.className = 'picker-tools';
            tools.innerHTML = `
                <input type="text" class="gs-search-input" placeholder="Search weapons…" value="${escAttr(this.searchQuery)}">
                <label>Game
                    <select class="side-select" data-weapon-game>
                        <option value="all">All games</option>
                        <option value="group" ${this.activeSourceGame === 'group' ? 'selected' : ''}>Group by game</option>
                        ${Object.entries(BO.ClassicWeapons.titles).map(([id, title]) =>
                            `<option value="${id}" ${this.activeSourceGame === id ? 'selected' : ''}>${title}</option>`).join('')}
                    </select>
                </label>
                <div class="gs-class-pills">${availCats.map((cat) => `<button class="gs-class-pill ${this.activeWeaponClass === cat ? 'active' : ''}" data-wcat="${cat}">${SHORT_CLASS_LABELS[cat] || cat}</button>`).join('')}</div>`;
            host.classList.add('weapon-picker-body');
            host.appendChild(tools);
            const list = document.createElement('div');
            list.className = 'opt-list';
            list.tabIndex = 0;
            list.setAttribute('role', 'region');
            list.setAttribute('aria-label', 'Weapon results');
            host.appendChild(list);

            const populate = (previous) => {
                list.innerHTML = '';
                list.scrollTop = 0;
                const q = this.searchQuery.trim().toLowerCase();
                const filtered = eligible.filter((w) =>
                    (['all', 'group'].includes(this.activeSourceGame) || w.sourceGames.includes(this.activeSourceGame)) &&
                    (this.activeWeaponClass === 'ALL' || w.category === this.activeWeaponClass) &&
                    (!q || w.name.toLowerCase().includes(q) || w.category.toLowerCase().includes(q)));
                const groups = this.activeSourceGame === 'group'
                    ? [
                        ...Object.entries(BO.ClassicWeapons.titles).map(([game, category]) => ({
                            category, weapons: filtered.filter((w) => w.sourceGames.includes(game))
                        })),
                        { category: 'Other weapons', weapons: filtered.filter((w) => !w.sourceGames.length) }
                    ].filter((g) => g.weapons.length)
                    : BO.WeaponsData.listByClass(filtered);
                for (const grp of groups) {
                    const hdr = document.createElement('div');
                    hdr.className = 'gs-group-header';
                    hdr.innerHTML = `<span>${escAttr(grp.category)}</span><span>${grp.weapons.length}</span>`;
                    list.appendChild(hdr);
                    for (const w of grp.weapons) {
                        const unlocked = BO.Progression.isItemUnlocked(w.unlockLevel, w.id);
                        const rec = BO.Save.getWeaponRecord(w.id);
                        const source = w.sourceGames.map((id) => BO.ClassicWeapons.titles[id]).join(' / ');
                        const tierCol = w.tier === 'magic' ? '#c084fc' : (w.tier === 'uncommon' ? '#38bdf8' : '#94a3b8');
                        list.appendChild(this._optionCard({
                            name: w.name,
                            desc: source ? `${w.description} • ${source}` : w.description,
                            sub: `${w.damage}${w.pellets > 1 ? '×' + w.pellets : ''} dmg • ${w.rpm} rpm • ${w.kind === 'melee' ? (w.cleave || 1) + '-hit cleave' : w.magSize + ' mag'} • LV ${rec.level}`,
                            badge: `<span class="opt-tier" style="--tier-col:${tierCol};">${(w.tier || 'common').toUpperCase()}</span>`,
                            active: cfg.id === w.id,
                            locked: !unlocked,
                            lockText: `Unlocks at rank ${w.unlockLevel}`,
                            onEnter: () => {
                                if (!unlocked) return;
                                this.hoverPreviewCfg = { id: w.id, camo: 'default', attachments: { optic: w.modelSpec?.defaultScope ? 'sniper_scope' : 'iron', muzzle: 'none', underbarrel: 'none', magazine: 'std_mag', stock: 'std_stock' } };
                                this._renderStats(cls);
                            },
                            onLeave: () => { this.hoverPreviewCfg = null; this._renderStats(cls); },
                            onClick: () => {
                                BO.Sound.playUIClick();
                                this.hoverPreviewCfg = null;
                                BO.Loadout.setWeapon(classIdx, slot, w.id);
                                this.render();
                                this.refresh3D();
                            }
                        }));
                    }
                }
                if (!groups.length) list.innerHTML = '<div class="opt-empty">No weapons match.</div>';
                BO.SelectionHighlight.register(host, { ['gunsmith-choice-' + slot + '-weapon']: '.opt-card' });
                BO.SelectionHighlight.update(host, previous);
            };
            tools.querySelector('[data-weapon-game]').onchange = (e) => { this.activeSourceGame = e.target.value; populate(); };
            tools.querySelector('input').oninput = (e) => { this.searchQuery = e.target.value; populate(); };
            tools.querySelectorAll('[data-wcat]').forEach((pb) => {
                pb.onclick = () => {
                    if (this.activeWeaponClass === pb.dataset.wcat) return;
                    const previous = BO.SelectionHighlight.capture(host);
                    BO.Sound.playUIClick();
                    this.activeWeaponClass = pb.dataset.wcat;
                    tools.querySelectorAll('[data-wcat]').forEach((x) => x.classList.toggle('active', x === pb));
                    populate(previous);
                };
            });
            populate();
            const act = list.querySelector('.opt-card.active');
            if (act) list.scrollTop = Math.max(0, act.getBoundingClientRect().bottom - list.getBoundingClientRect().bottom);
        }

        _renderAttachments(host, cls, classIdx, slot, cat) {
            const cfg = cls[slot];
            const baseSpec = BO.WeaponsData.get(cfg.id);
            const defaultAtt = cat === 'optic' ? (baseSpec.modelSpec?.defaultScope ? 'sniper_scope' : 'iron') : BO.AttachmentsData.ATTACHMENTS[cat][0].id;
            const curAttId = (cfg.attachments && cfg.attachments[cat]) || defaultAtt;
            const list = document.createElement('div');
            list.className = 'opt-list';
            host.appendChild(list);
            for (const att of (BO.AttachmentsData.ATTACHMENTS[cat] || [])) {
                if (att.mods?.weaponCategory && att.mods.weaponCategory !== baseSpec.category) continue;
                const unlocked = BO.Progression.isAttachmentUnlocked(cfg.id, att.unlockWeaponLevel);
                list.appendChild(this._optionCard({
                    name: att.name,
                    desc: att.desc,
                    active: curAttId === att.id,
                    locked: !unlocked,
                    lockText: `Unlocks at weapon level ${att.unlockWeaponLevel}`,
                    onEnter: () => {
                        if (!unlocked) return;
                        const preview = BO.Math.deepClone(cfg);
                        if (!preview.attachments) preview.attachments = {};
                        preview.attachments[cat] = att.id;
                        this.hoverPreviewCfg = preview;
                        this._renderStats(cls);
                    },
                    onLeave: () => { this.hoverPreviewCfg = null; this._renderStats(cls); },
                    onClick: () => {
                        BO.Sound.playUIClick();
                        this.hoverPreviewCfg = null;
                        BO.Loadout.setAttachment(classIdx, slot, cat, att.id);
                        this.render();
                        this.refresh3D();
                    }
                }));
            }
        }

        _renderCamos(host, cls, classIdx, slot) {
            const cfg = cls[slot];
            const grid = document.createElement('div');
            grid.className = 'camo-grid';
            host.appendChild(grid);
            const rec = BO.Save.getWeaponRecord(cfg.id);
            for (const c of BO.AttachmentsData.CAMOS) {
                const unlocked = BO.Progression.isCamoUnlocked(cfg.id, c.id);
                const sw = document.createElement('button');
                sw.className = `camo-swatch ${cfg.camo === c.id ? 'active' : ''} ${unlocked ? '' : 'locked'}`;
                sw.style.background = c.preview;
                sw.setAttribute('data-tip-title', c.name + (c.animated ? ' (animated)' : ''));
                const req = c.headshotsRequired
                    ? `Get ${c.headshotsRequired} headshots with this weapon (${rec.headshots || 0}/${c.headshotsRequired}).`
                    : `Get ${c.killsRequired} kills with this weapon (${rec.kills}/${c.killsRequired}).`;
                sw.setAttribute('data-tip', unlocked ? 'Click to apply.' : 'Locked. ' + req);
                sw.innerHTML = `<span>${unlocked ? escAttr(c.name) : '🔒'}</span>`;
                sw.onclick = () => {
                    if (!unlocked) { BO.Sound.playEmptyClick(); return; }
                    BO.Sound.playUIClick();
                    BO.Loadout.setCamo(classIdx, slot, c.id);
                    this.render();
                    this.refresh3D();
                };
                grid.appendChild(sw);
            }
        }

        _renderGearList(host, cls, classIdx, slot) {
            const A = BO.AttachmentsData;
            let items = [];
            let activeId = null;
            let onPick = null;
            let getSub = () => '';
            if (slot === 'perk1' || slot === 'perk2' || slot === 'perk3') {
                const t = Number(slot.slice(-1));
                items = A.getPerksByTier(t);
                activeId = cls.perks[t - 1];
                onPick = (id) => BO.Loadout.setPerk(classIdx, t - 1, id);
            } else if (slot === 'lethal') {
                items = Object.values(A.LETHALS); activeId = cls.lethal; onPick = (id) => BO.Loadout.setEquipment(classIdx, 'lethal', id);
                getSub = (i) => i.count ? `Carry ${i.count}` : '';
            } else if (slot === 'tactical') {
                items = Object.values(A.TACTICALS); activeId = cls.tactical; onPick = (id) => BO.Loadout.setEquipment(classIdx, 'tactical', id);
                getSub = (i) => i.count ? `Carry ${i.count}` : '';
            } else if (slot === 'field') {
                items = Object.values(A.FIELD_UPGRADES); activeId = cls.fieldUpgrade; onPick = (id) => BO.Loadout.setEquipment(classIdx, 'fieldUpgrade', id);
            } else if (slot === 'ultimate') {
                items = Object.values(A.ULTIMATE_POWERS); activeId = cls.ultimatePower || 'gravity_spikes'; onPick = (id) => BO.Loadout.setEquipment(classIdx, 'ultimatePower', id);
            } else if (slot === 'streaks') {
                const s = this.streakIndex;
                items = Object.values(A.KILLSTREAKS); activeId = cls.killstreaks[s];
                onPick = (id) => BO.Loadout.setKillstreak(classIdx, s, id);
                getSub = (i) => `${i.kills} kills in a row`;
            }
            const list = document.createElement('div');
            list.className = 'opt-list';
            host.appendChild(list);
            for (const item of items) {
                const unlocked = BO.Progression.isItemUnlocked(item.unlockLevel || 1, item.id);
                const sub = getSub(item);
                list.appendChild(this._optionCard({
                    name: item.name,
                    desc: item.desc,
                    sub: sub ? escAttr(sub) : '',
                    active: activeId === item.id,
                    locked: !unlocked,
                    lockText: `Unlocks at rank ${item.unlockLevel}`,
                    onClick: () => {
                        BO.Sound.playUIClick();
                        onPick(item.id);
                        this.render();
                    }
                }));
            }
        }
    }

    BO.GunsmithUI = new GunsmithUI();
})(window);
