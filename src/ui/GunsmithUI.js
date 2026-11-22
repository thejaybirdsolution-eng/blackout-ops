/* ============================================================================
   BLACKOUT OPS — Create-a-Class & Interactive 3D Gunsmith Controller
   Organized cleanly by Weapon Class, with 5 live Attachment LEDs, live hover
   stat diffs, Primary + Side Weapon customization, Perk 1/2/3, Lethal, Tactical,
   Special [X], Ultimate [U], Killstreaks, Camos & smooth COD UI animations.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    const STAT_TIPS = {
        DAMAGE: 'How much health each shot takes away. Higher means enemies go down in fewer bullets.',
        'FIRE RATE': 'How fast the gun shoots bullets per minute (RPM). Higher means faster spraying.',
        RANGE: 'How far your bullets travel before losing power. Higher is better for long hallways and rooftops.',
        ACCURACY: 'How tightly bullets stay on your aim dot when aiming down sights.',
        CONTROL: 'How easy the gun is to hold steady without kicking upward while firing.',
        MOBILITY: 'How fast you run and how quickly you can raise your sights to aim.'
    };

    const CAT_TIPS = {
        weapon: 'Pick which gun you want in this slot — neatly organized by Weapon Class!',
        optic: 'Change your sight (Iron, Red Dot, Holo, ACOG, Sniper Scope). Choosing Iron/Red Dot/Holo/ACOG removes the sniper scope overlay on snipers!',
        muzzle: 'Attach a Suppressor (quieter & hidden from radar), Compensator (less upward kick), or Muzzle Brake.',
        underbarrel: 'Add a Foregrip for stability, a red Laser for hip-firing, or swap barrel length for range vs speed.',
        magazine: 'Carry more bullets per magazine (Extended / Drum) or reload much faster (Fast Mags).',
        stock: 'Change the back of the gun for faster running & aiming or steadier recoil control.'
    };

    const SHORT_CLASS_LABELS = {
        ALL: 'ALL CLASSES',
        'Assault Rifle': 'AR',
        SMG: 'SMG',
        'Sniper Rifle': 'SNIPER',
        'Marksman Rifle': 'MARKSMAN',
        Shotgun: 'SHOTGUN',
        LMG: 'LMG',
        Pistol: 'PISTOL',
        Launcher: 'LAUNCHER',
        'Melee Weapon': 'MELEE',
        'Magic Weapon': 'MAGIC'
    };

    function escAttr(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    class GunsmithUI {
        constructor() {
            this.editingSlot = 'primary'; // 'primary' | 'secondary' | 'gear'
            this.activeCategory = 'weapon';
            this.activeWeaponClass = 'ALL';
            this.searchQuery = '';
            this.hoverPreviewCfg = null;
            this.orbitYaw = 0.55;
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

            const canvas = document.getElementById('game-canvas');
            const startDrag = (e) => {
                if (BO.State.screen !== 'gunsmith') return;
                this.dragging = true;
                this.lastX = e.clientX;
                this.lastY = e.clientY;
            };
            const moveDrag = (e) => {
                if (!this.dragging || BO.State.screen !== 'gunsmith') return;
                const dx = e.clientX - this.lastX;
                const dy = e.clientY - this.lastY;
                this.lastX = e.clientX;
                this.lastY = e.clientY;
                this.orbitYaw += dx * 0.01;
                this.orbitPitch = BO.Math.clamp(this.orbitPitch + dy * 0.008, -0.7, 0.85);
            };
            const stopDrag = () => { this.dragging = false; };
            const wheelZoom = (e) => {
                if (BO.State.screen !== 'gunsmith') return;
                this.orbitZoom = BO.Math.clamp(this.orbitZoom + e.deltaY * 0.0008, 0.55, 1.55);
            };

            if (canvas) {
                canvas.addEventListener('mousedown', startDrag);
                window.addEventListener('mousemove', moveDrag);
                window.addEventListener('mouseup', stopDrag);
                canvas.addEventListener('wheel', wheelZoom, { passive: true });
            }
            if (this.elScreen) {
                this.elScreen.addEventListener('mousedown', (e) => {
                    if (e.target === this.elScreen || e.target.classList.contains('gunsmith-layout') || e.target.classList.contains('gunsmith-center-stage')) {
                        startDrag(e);
                    }
                });
            }
            const resetBtn = document.getElementById('gs-reset-orbit');
            if (resetBtn) {
                resetBtn.onclick = () => {
                    BO.Sound.playUIClick();
                    this.orbitYaw = 0.55;
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

        refresh3D() {
            if (this.onRebuildShowcase) {
                const cls = BO.Loadout.getActiveClass();
                const cfg = this.editingSlot === 'secondary' ? cls.secondary : cls.primary;
                this.onRebuildShowcase(cfg);
            }
        }

        _buildAttLedsHtml(cfg) {
            const atts = cfg.attachments || {};
            const base = BO.WeaponsData.get(cfg.id);
            const slots = [
                ['OPT', atts.optic && atts.optic !== (base.modelSpec?.defaultScope ? 'sniper_scope' : 'iron') ? BO.AttachmentsData.getAttachment('optic', atts.optic).name.split(' ')[0] : 'STD', atts.optic && atts.optic !== 'iron'],
                ['MUZ', atts.muzzle && atts.muzzle !== 'none' ? 'ON' : 'STD', atts.muzzle && atts.muzzle !== 'none'],
                ['UBL', atts.underbarrel && atts.underbarrel !== 'none' ? 'ON' : 'STD', atts.underbarrel && atts.underbarrel !== 'none'],
                ['MAG', atts.magazine && atts.magazine !== 'std_mag' ? 'ON' : 'STD', atts.magazine && atts.magazine !== 'std_mag'],
                ['STK', atts.stock && atts.stock !== 'std_stock' ? 'ON' : 'STD', atts.stock && atts.stock !== 'std_stock']
            ];
            return `<div class="gs-att-leds">${slots.map(([k, v, active]) =>
                `<span class="gs-att-led ${active ? 'equipped' : ''}">${k}: ${v}</span>`
            ).join('')}</div>`;
        }

        render() {
            const idx = BO.Loadout.getSelectedClassIndex();
            const classes = BO.Loadout.getClasses();
            const cls = classes[idx];

            // Class Tabs
            const tabsEl = document.getElementById('gs-class-tabs');
            tabsEl.innerHTML = classes.map((c, i) => `
                <button class="class-tab ${i === idx ? 'active' : ''}" data-cidx="${i}"
                    data-tip-title="Custom Class ${i + 1}"
                    data-tip="Switch to loadout slot #${i + 1} (${escAttr(c.name)}). Carried into battle across Zombies, MP, and Tower Defense!">
                    <span style="color:var(--amber);margin-right:4px;">0${i === 9 ? '0' : ''}</span>${i + 1}. ${c.name}
                    <div style="font-size:10px;font-weight:600;color:#94a3b8;margin-top:2px;">${BO.WeaponsData.get(c.primary.id).shortName} • ${BO.WeaponsData.get(c.secondary.id).shortName}</div>
                </button>`).join('');
            tabsEl.querySelectorAll('.class-tab').forEach((btn) => {
                btn.onclick = () => {
                    BO.Sound.playUIClick();
                    this.hoverPreviewCfg = null;
                    BO.Loadout.setSelectedClassIndex(Number(btn.dataset.cidx));
                    this.render();
                    this.refresh3D();
                };
            });

            // Left Column: Loadout Summary Cards + Interactive Editor
            const leftEl = document.getElementById('gs-left-panel');
            const pSpec = BO.WeaponsData.get(cls.primary.id);
            const sSpec = BO.WeaponsData.get(cls.secondary.id);
            const spSpec = BO.AttachmentsData.FIELD_UPGRADES[cls.fieldUpgrade];
            const ultSpec = BO.AttachmentsData.ULTIMATE_POWERS[cls.ultimatePower || 'gravity_spikes'];

            leftEl.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid var(--border-subtle);padding-bottom:8px;">
                    <div style="font-size:15px;font-weight:800;letter-spacing:1.8px;color:var(--amber);">${cls.name}</div>
                    <div style="display:flex;gap:6px;">
                        <button class="btn btn-sm" id="gs-rename-btn" data-tip-title="Rename Class" data-tip="Give this custom class your own name.">RENAME</button>
                        <button class="btn btn-sm" id="gs-copy-btn" data-tip-title="Duplicate Class" data-tip="Copy all weapons, attachments, perks, and powers into the next slot.">COPY</button>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <button class="select-card gs-card-anim ${this.editingSlot === 'primary' ? 'active' : ''}" id="gs-slot-primary" style="padding:10px;"
                        data-tip-title="Primary Weapon Slot" data-tip="Customize your primary gun by Weapon Class, attachments, and camo.">
                        <div style="font-size:10px;letter-spacing:1.2px;color:var(--amber);font-weight:800;">PRIMARY • ${pSpec.category.toUpperCase()}</div>
                        <div class="card-head" style="font-size:14px;margin-top:2px;">${pSpec.shortName}</div>
                        ${this._buildAttLedsHtml(cls.primary)}
                    </button>
                    <button class="select-card gs-card-anim ${this.editingSlot === 'secondary' ? 'active' : ''}" id="gs-slot-secondary" style="padding:10px;"
                        data-tip-title="Side Weapon Slot" data-tip="Customize your sidearm, launcher, melee weapon, or 2nd primary (with Overkill!).">
                        <div style="font-size:10px;letter-spacing:1.2px;color:var(--cyan);font-weight:800;">SIDEARM • ${sSpec.category.toUpperCase()}</div>
                        <div class="card-head" style="font-size:14px;margin-top:2px;">${sSpec.shortName}</div>
                        ${this._buildAttLedsHtml(cls.secondary)}
                    </button>
                </div>
                <button class="select-card gs-card-anim ${this.editingSlot === 'gear' ? 'active' : ''}" id="gs-slot-gear" style="padding:10px 12px;"
                    data-tip-title="Perks, Gear, Special & Ultimate" data-tip="Configure Perk 1/2/3, Lethal [G], Tactical [Q], Special Power [X], Ultimate [U], and MP Killstreaks.">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span class="card-head" style="font-size:13.5px;">PERKS, EQUIPMENT &amp; POWERS</span>
                        <span style="font-size:11px;color:#fde047;">3 PERKS • ULT: ${ultSpec ? ultSpec.name : ''}</span>
                    </div>
                    <div class="card-sub" style="margin-top:3px;">[G] ${BO.AttachmentsData.LETHALS[cls.lethal]?.name} • [Q] ${BO.AttachmentsData.TACTICALS[cls.tactical]?.name} • [X] ${spSpec ? spSpec.name : ''}</div>
                </button>
                <div class="panel-title" style="margin-top:2px;">${this.editingSlot === 'gear' ? 'CUSTOMIZE PERKS, GEAR & POWERS' : `CUSTOMIZE ${this.editingSlot.toUpperCase()} — ORGANIZED BY CLASS`}</div>
                <div id="gs-option-list" style="display:flex;flex-direction:column;gap:6px;overflow-y:auto;padding-right:4px;flex:1;"></div>
            `;

            document.getElementById('gs-rename-btn').onclick = () => {
                const nn = window.prompt('Enter Class Name (max 22 chars):', cls.name);
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
            document.getElementById('gs-slot-primary').onclick = () => {
                BO.Sound.playUIClick();
                this.editingSlot = 'primary';
                this.hoverPreviewCfg = null;
                this.render();
                this.refresh3D();
            };
            document.getElementById('gs-slot-secondary').onclick = () => {
                BO.Sound.playUIClick();
                this.editingSlot = 'secondary';
                this.hoverPreviewCfg = null;
                this.render();
                this.refresh3D();
            };
            document.getElementById('gs-slot-gear').onclick = () => {
                BO.Sound.playUIClick();
                this.editingSlot = 'gear';
                this.hoverPreviewCfg = null;
                this.render();
            };

            const optList = document.getElementById('gs-option-list');
            if (this.editingSlot === 'gear') this._renderGearEditor(optList, cls, idx);
            else this._renderWeaponEditor(optList, cls, idx);

            this._renderCenterPlate(cls);
            this._renderRightPanel(cls, idx);
        }

        _renderCenterPlate(cls) {
            const plate = document.getElementById('gs-viewport-plate');
            if (!plate) return;
            const slot = this.editingSlot === 'secondary' ? 'secondary' : 'primary';
            const cfg = cls[slot];
            const spec = BO.WeaponsData.get(cfg.id);
            const rec = BO.Save.getWeaponRecord(cfg.id);
            const opticName = BO.AttachmentsData.getAttachment('optic', cfg.attachments?.optic || (spec.modelSpec?.defaultScope ? 'sniper_scope' : 'iron')).name;
            plate.innerHTML = `
                <div style="font-size:10.5px;letter-spacing:2px;color:var(--cyan);font-weight:800;">${spec.category.toUpperCase()} • ${(spec.tier || 'common').toUpperCase()} • WEAPON LV ${rec.level}</div>
                <div style="font-size:20px;font-weight:900;letter-spacing:2.2px;color:#fff;">${spec.name}</div>
                <div style="font-size:11px;color:var(--amber);">OPTIC: ${opticName.toUpperCase()} • CAMO: ${BO.AttachmentsData.getCamo(cfg.camo).name.toUpperCase()}</div>
            `;
        }

        _renderWeaponEditor(container, cls, classIdx) {
            const slot = this.editingSlot;
            const cfg = cls[slot];
            const categories = ['weapon', 'optic', 'muzzle', 'underbarrel', 'magazine', 'stock'];

            const catTabs = document.createElement('div');
            catTabs.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;';
            catTabs.innerHTML = categories.map((c) => `
                <button class="btn btn-sm ${this.activeCategory === c ? 'btn-primary' : ''}" data-cat="${c}"
                    data-tip-title="${c.toUpperCase()}" data-tip="${escAttr(CAT_TIPS[c])}">
                    ${c.toUpperCase()}
                </button>`).join('');
            catTabs.querySelectorAll('button').forEach((b) => {
                b.onclick = () => {
                    BO.Sound.playUIClick();
                    this.activeCategory = b.dataset.cat;
                    this.hoverPreviewCfg = null;
                    this.render();
                };
            });
            container.appendChild(catTabs);

            if (this.activeCategory === 'weapon') {
                const hasOverkill = cls.perks.includes('overkill');
                const sandboxAll = !!(BO.Save && BO.Save.data && BO.Save.data.unlockAll);
                const allList = sandboxAll ? BO.WeaponsData.listAll() : BO.WeaponsData.listLoadoutWeapons();
                const eligible = allList.filter((w) => {
                    if (sandboxAll) return true;
                    if (slot === 'primary') return w.slotType === 'primary' || w.kind === 'melee';
                    return w.slotType === 'secondary' || w.kind === 'melee' || hasOverkill;
                });

                // Weapon Class Filter Pills + Quick Search
                const availCats = ['ALL', ...BO.WeaponsData.CLASS_ORDER.filter((cat) => eligible.some((w) => w.category === cat))];
                if (!availCats.includes(this.activeWeaponClass)) this.activeWeaponClass = 'ALL';

                const pills = document.createElement('div');
                pills.className = 'gs-class-pills';
                pills.innerHTML = availCats.map((cat) => `
                    <button class="gs-class-pill ${this.activeWeaponClass === cat ? 'active' : ''}" data-wcat="${cat}">
                        ${SHORT_CLASS_LABELS[cat] || cat.toUpperCase()}
                    </button>`).join('');
                pills.querySelectorAll('button').forEach((pb) => {
                    pb.onclick = () => {
                        BO.Sound.playUIClick();
                        this.activeWeaponClass = pb.dataset.wcat;
                        this.render();
                    };
                });
                container.appendChild(pills);

                const search = document.createElement('input');
                search.type = 'text';
                search.className = 'gs-search-input';
                search.placeholder = 'Search weapons by name or class...';
                search.value = this.searchQuery;
                search.oninput = (e) => {
                    this.searchQuery = e.target.value;
                    this._populateWeaponGroups(listHost, eligible, cfg, cls, classIdx, slot);
                };
                container.appendChild(search);

                const listHost = document.createElement('div');
                listHost.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
                container.appendChild(listHost);

                this._populateWeaponGroups(listHost, eligible, cfg, cls, classIdx, slot);
            } else {
                const baseSpec = BO.WeaponsData.get(cfg.id);
                const defaultAtt = this.activeCategory === 'optic'
                    ? (baseSpec.modelSpec?.defaultScope ? 'sniper_scope' : 'iron')
                    : BO.AttachmentsData.ATTACHMENTS[this.activeCategory][0].id;
                const attList = BO.AttachmentsData.ATTACHMENTS[this.activeCategory] || [];
                const curAttId = (cfg.attachments && cfg.attachments[this.activeCategory]) || defaultAtt;
                let idxDelay = 0;

                for (const att of attList) {
                    const unlocked = BO.Progression.isAttachmentUnlocked(cfg.id, att.unlockWeaponLevel);
                    const btn = document.createElement('button');
                    btn.className = `select-card gs-card-anim ${curAttId === att.id ? 'active' : ''}`;
                    btn.style.animationDelay = `${Math.min(0.24, idxDelay++ * 0.03)}s`;
                    btn.disabled = !unlocked;
                    btn.setAttribute('data-tip-title', att.name);
                    btn.setAttribute('data-tip', att.desc);
                    btn.setAttribute('data-tip-sub', unlocked ? 'Hover to preview stat changes; click to attach on 3D weapon!' : `Unlock at Weapon Level ${att.unlockWeaponLevel}.`);
                    btn.innerHTML = `
                        <div class="card-head">${att.name} ${curAttId === att.id ? '<span style="color:#fde047;font-size:11px;">[EQUIPPED]</span>' : ''}</div>
                        <div class="card-sub">${unlocked ? att.desc : `UNLOCKS AT WEAPON LV ${att.unlockWeaponLevel}`}</div>
                    `;
                    btn.onmouseenter = () => {
                        if (!unlocked) return;
                        const preview = BO.Math.deepClone(cfg);
                        if (!preview.attachments) preview.attachments = {};
                        preview.attachments[this.activeCategory] = att.id;
                        this.hoverPreviewCfg = preview;
                        this._renderRightPanel(cls, classIdx);
                    };
                    btn.onmouseleave = () => {
                        this.hoverPreviewCfg = null;
                        this._renderRightPanel(cls, classIdx);
                    };
                    btn.onclick = () => {
                        BO.Sound.playUIClick();
                        this.hoverPreviewCfg = null;
                        BO.Loadout.setAttachment(classIdx, slot, this.activeCategory, att.id);
                        this.render();
                        this.refresh3D();
                    };
                    container.appendChild(btn);
                }
            }
        }

        _populateWeaponGroups(host, eligible, cfg, cls, classIdx, slot) {
            host.innerHTML = '';
            const q = this.searchQuery.trim().toLowerCase();
            const filtered = eligible.filter((w) => {
                if (this.activeWeaponClass !== 'ALL' && w.category !== this.activeWeaponClass) return false;
                if (q && !w.name.toLowerCase().includes(q) && !w.category.toLowerCase().includes(q)) return false;
                return true;
            });

            const groups = BO.WeaponsData.listByClass(filtered);
            let animIdx = 0;
            for (const grp of groups) {
                const hdr = document.createElement('div');
                hdr.className = 'gs-group-header';
                hdr.innerHTML = `<span>${grp.category}s</span><span style="color:#94a3b8">${grp.weapons.length}</span>`;
                host.appendChild(hdr);

                for (const w of grp.weapons) {
                    const unlocked = BO.Progression.isItemUnlocked(w.unlockLevel, w.id);
                    const rec = BO.Save.getWeaponRecord(w.id);
                    const tierColor = w.tier === 'magic' ? '#c084fc' : (w.tier === 'uncommon' ? '#38bdf8' : '#94a3b8');
                    const tierBadge = `<span style="font-size:10px;padding:1px 5px;border-radius:3px;border:1px solid ${tierColor};color:${tierColor};margin-left:4px;">${(w.tier || 'common').toUpperCase()}</span>`;
                    const btn = document.createElement('button');
                    btn.className = `select-card gs-card-anim ${cfg.id === w.id ? 'active' : ''}`;
                    btn.style.animationDelay = `${Math.min(0.28, (animIdx++) * 0.018)}s`;
                    btn.style.padding = '10px 12px';
                    btn.disabled = !unlocked;
                    btn.setAttribute('data-tip-title', `${w.name} (${w.category})`);
                    btn.setAttribute('data-tip', `${w.description} Damage: ${w.damage}${w.pellets > 1 ? 'x' + w.pellets : ''}, Speed: ${w.rpm} RPM, ${w.kind === 'melee' ? 'Cleave: ' + (w.cleave || 1) : 'Mag: ' + w.magSize}, Headshot: ${w.headMult}x.`);
                    btn.setAttribute('data-tip-sub', `Pack-a-Punch Upgrade: ${w.papName}`);
                    btn.innerHTML = `
                        <div class="card-head" style="font-size:14px;">${w.name} ${tierBadge} <span style="font-size:11px;color:#38bdf8">[LV ${rec.level}]</span></div>
                        <div class="card-sub">${unlocked ? `${w.damage}${w.pellets > 1 ? 'x' + w.pellets : ''} DMG • ${w.rpm} RPM • ${w.kind === 'melee' ? (w.cleave || 1) + '-HIT' : w.magSize + ' MAG'} • ${w.headMult}x HS` : `UNLOCKS AT RANK ${w.unlockLevel}`}</div>
                    `;
                    btn.onmouseenter = () => {
                        if (!unlocked) return;
                        this.hoverPreviewCfg = {
                            id: w.id, camo: 'default',
                            attachments: {
                                optic: w.modelSpec?.defaultScope ? 'sniper_scope' : 'iron',
                                muzzle: 'none', underbarrel: 'none', magazine: 'std_mag', stock: 'std_stock'
                            }
                        };
                        this._renderRightPanel(cls, classIdx);
                    };
                    btn.onmouseleave = () => {
                        this.hoverPreviewCfg = null;
                        this._renderRightPanel(cls, classIdx);
                    };
                    btn.onclick = () => {
                        BO.Sound.playUIClick();
                        this.hoverPreviewCfg = null;
                        BO.Loadout.setWeapon(classIdx, slot, w.id);
                        this.render();
                        this.refresh3D();
                    };
                    host.appendChild(btn);
                }
            }
            if (groups.length === 0) {
                const empty = document.createElement('div');
                empty.style.cssText = 'padding:18px;text-align:center;color:var(--text-dim);font-size:12px;';
                empty.textContent = 'No matching weapons found.';
                host.appendChild(empty);
            }
        }

        _renderGearEditor(container, cls, classIdx) {
            const addSection = (label, colorHex, tipExplain, items, activeId, onPick, getSub) => {
                const h = document.createElement('div');
                h.className = 'gs-group-header';
                h.style.borderLeftColor = colorHex;
                h.style.color = colorHex;
                h.textContent = label;
                h.setAttribute('data-tip-title', label);
                h.setAttribute('data-tip', tipExplain);
                container.appendChild(h);
                for (const item of items) {
                    const unlocked = BO.Progression.isItemUnlocked(item.unlockLevel || 1, item.id);
                    const btn = document.createElement('button');
                    btn.className = `select-card gs-card-anim ${activeId === item.id ? 'active' : ''}`;
                    btn.style.padding = '9px 12px';
                    btn.disabled = !unlocked;
                    btn.setAttribute('data-tip-title', item.name);
                    btn.setAttribute('data-tip', item.desc);
                    btn.setAttribute('data-tip-sub', unlocked ? 'Click to equip in this custom class.' : `Unlocks at Military Rank ${item.unlockLevel}.`);
                    btn.innerHTML = `<div class="card-head" style="font-size:13.5px;">${item.name}</div><div class="card-sub">${unlocked ? getSub(item) : 'UNLOCKS AT RANK ' + item.unlockLevel}</div>`;
                    btn.onclick = () => {
                        BO.Sound.playUIClick();
                        onPick(item.id);
                        this.render();
                    };
                    container.appendChild(btn);
                }
            };

            addSection('PERK 1 (BLUE SLOT)', '#38bdf8', 'Passive skill #1: mobility, ammo scavenger, explosive armor, or Overkill.',
                BO.AttachmentsData.getPerksByTier(1), cls.perks[0], (id) => BO.Loadout.setPerk(classIdx, 0, id), (i) => i.desc);
            addSection('PERK 2 (RED SLOT)', '#f43f5e', 'Passive skill #2: fast reloads, UAV stealth, instant kill healing, or cheaper streaks.',
                BO.AttachmentsData.getPerksByTier(2), cls.perks[1], (id) => BO.Loadout.setPerk(classIdx, 1, id), (i) => i.desc);
            addSection('PERK 3 (YELLOW SLOT)', '#eab308', 'Passive skill #3: hipfire accuracy, silent footsteps, fast ADS walk, or lightning swap.',
                BO.AttachmentsData.getPerksByTier(3), cls.perks[2], (id) => BO.Loadout.setPerk(classIdx, 2, id), (i) => i.desc);
            addSection('GRENADE / LETHAL [G]', '#f97316', 'Press [G] to throw explosive ordnance.',
                Object.values(BO.AttachmentsData.LETHALS), cls.lethal, (id) => BO.Loadout.setEquipment(classIdx, 'lethal', id), (i) => i.desc);
            addSection('TACTICAL ITEM [Q]', '#a855f7', 'Press [Q] for tactical utility or Pokéball ally summon.',
                Object.values(BO.AttachmentsData.TACTICALS), cls.tactical, (id) => BO.Loadout.setEquipment(classIdx, 'tactical', id), (i) => i.desc);
            addSection('SPECIAL POWER [X]', '#22c55e', 'Press [X] when charged to trigger your tactical Special Power!',
                Object.values(BO.AttachmentsData.FIELD_UPGRADES), cls.fieldUpgrade, (id) => BO.Loadout.setEquipment(classIdx, 'fieldUpgrade', id), (i) => i.desc);
            addSection('ULTIMATE POWER [U]', '#fde047', 'Charges via kills; press [U] or [Z] to unleash super abilities!',
                Object.values(BO.AttachmentsData.ULTIMATE_POWERS), cls.ultimatePower || 'gravity_spikes', (id) => BO.Loadout.setEquipment(classIdx, 'ultimatePower', id), (i) => i.desc);

            for (let s = 0; s < 3; s++) {
                addSection(`MP KILLSTREAK SLOT ${s + 1} [KEY ${5 + s}]`, '#f5a623', 'Earned for consecutive kills without dying in Multiplayer!',
                    Object.values(BO.AttachmentsData.KILLSTREAKS), cls.killstreaks[s],
                    (id) => BO.Loadout.setKillstreak(classIdx, s, id), (i) => `${i.kills} KILLS — ${i.desc}`);
            }
        }

        _renderRightPanel(cls, classIdx) {
            const rightEl = document.getElementById('gs-right-panel');
            const slot = this.editingSlot === 'secondary' ? 'secondary' : 'primary';
            const cfg = cls[slot];
            const baseBars = BO.Loadout.computeStatBars(cfg);
            const activeCfg = this.hoverPreviewCfg || cfg;
            const bars = BO.Loadout.computeStatBars(activeCfg);
            const fullStats = BO.Loadout.computeWeaponStats(activeCfg, 0, cls.perks);
            const baseSpec = BO.WeaponsData.get(activeCfg.id);
            const rec = BO.Save.getWeaponRecord(activeCfg.id);
            const isPreviewing = !!this.hoverPreviewCfg;

            const makeRow = (lbl, val, curVal) => {
                const diff = isPreviewing ? (val - curVal) : 0;
                const diffStr = diff > 0
                    ? `<span style="color:#22c55e;font-size:10.5px;">+${diff}</span>`
                    : (diff < 0 ? `<span style="color:#ef4444;font-size:10.5px;">${diff}</span>` : '');
                return `
                    <div class="stat-row" data-tip-title="${lbl}" data-tip="${escAttr(STAT_TIPS[lbl])}">
                        <span>${lbl}</span>
                        <div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${val}%"></div></div>
                        <span style="text-align:right;font-family:var(--font-mono);color:#f5a623">${val} ${diffStr}</span>
                    </div>`;
            };

            const opticSpec = BO.AttachmentsData.getAttachment('optic', fullStats.opticId || 'iron');

            rightEl.innerHTML = `
                <div class="panel-title">${bars.baseName} ${isPreviewing ? '<span style="color:#38bdf8;font-size:10px;">(PREVIEW)</span>' : `• LV ${rec.level}`}</div>
                <div style="font-size:11.5px;color:var(--text-dim);line-height:1.55;background:rgba(8,12,20,0.65);padding:8px 10px;border:1px solid var(--border-subtle);"
                    data-tip-title="Exact Runtime Specifications"
                    data-tip="Calculated live with your attachments & optics! Notice how switching from Sniper Scope to Iron Sights / Red Dot removes scope zoom for crisp close-range ADS.">
                    <b>CLASS:</b> <span style="color:#38bdf8">${baseSpec.category}</span> • <b>OPTIC:</b> ${opticSpec.name} (${fullStats.adsFov}° FOV)<br>
                    <b>DMG:</b> ${fullStats.damage}${fullStats.pellets > 1 ? 'x' + fullStats.pellets : ''} • <b>HS:</b> ${fullStats.headMult}x • <b>RPM:</b> ${bars.rpm}<br>
                    <b>MAG:</b> ${bars.magSize} • <b>RLD:</b> ${fullStats.reloadTime.toFixed(2)}s • <b>ADS:</b> ${bars.adsMs}ms • <b>PIERCE:</b> ${fullStats.penetration}<br>
                    <span style="color:#c084fc;"><b>PACK-A-PUNCH:</b> ${baseSpec.papName} (3 Tiers)</span>
                </div>
                ${makeRow('DAMAGE', bars.damage, baseBars.damage)}
                ${makeRow('FIRE RATE', bars.fireRate, baseBars.fireRate)}
                ${makeRow('RANGE', bars.range, baseBars.range)}
                ${makeRow('ACCURACY', bars.accuracy, baseBars.accuracy)}
                ${makeRow('CONTROL', bars.control, baseBars.control)}
                ${makeRow('MOBILITY', bars.mobility, baseBars.mobility)}
                <div class="panel-title" style="margin-top:8px;">WEAPON CAMOS (EQUIPPED)</div>
                <div class="camo-grid" id="gs-camo-grid"></div>
            `;

            const cg = document.getElementById('gs-camo-grid');
            for (const c of BO.AttachmentsData.CAMOS) {
                const unlocked = BO.Progression.isCamoUnlocked(cfg.id, c.id);
                const sw = document.createElement('button');
                sw.className = `camo-swatch ${cfg.camo === c.id ? 'active' : ''} ${unlocked ? '' : 'locked'}`;
                sw.style.background = c.preview;
                sw.setAttribute('data-tip-title', c.name + (c.animated ? ' (Animated)' : ''));
                const cwRec = BO.Save.getWeaponRecord(cfg.id);
                const reqText = c.headshotsRequired
                    ? `Locked! Score ${c.headshotsRequired} Headshots with this weapon (${cwRec.headshots || 0}/${c.headshotsRequired}), or enter 'unlock' cheat.`
                    : `Locked! Get ${c.killsRequired} kills with this weapon (${cwRec.kills}/${c.killsRequired}), or enter 'unlock' cheat.`;
                sw.setAttribute('data-tip', unlocked ? 'Click to paint this camo directly onto your 3D weapon!' : reqText);
                sw.innerHTML = `<span>${unlocked ? c.name.split(' ')[0] : (c.headshotsRequired ? '1000HS' : c.killsRequired + 'K')}</span>`;
                sw.onclick = () => {
                    if (!unlocked) { BO.Sound.playEmptyClick(); return; }
                    BO.Sound.playUIClick();
                    BO.Loadout.setCamo(classIdx, slot, c.id);
                    this.render();
                    this.refresh3D();
                };
                cg.appendChild(sw);
            }
        }
    }

    BO.GunsmithUI = new GunsmithUI();
})(window);
