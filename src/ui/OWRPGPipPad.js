/* ============================================================================
   BLACKOUT OPS — Open World RPG · Pip-Pad (diegetic wrist terminal)
   Tabs: Character · Perks · Inventory · Abilities · Quests · Map · Factions ·
   System, plus the [F8] Dev overlay (teleport, grants, flags, validator).
   Rendered into OWRPGUI's modal; clicks route through data-act handlers.
============================================================================ */
(function (BO) {
    'use strict';

    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const TABS = [
        ['character', 'Character', 'staged_assets/ui/military_icons/Field Gear/ballistic-document-clipboard-001.png'],
        ['perks', 'Perks', 'staged_assets/ui/scifi_icons/Power Cores/amber-overdrive-cell-001.png'],
        ['inventory', 'Inventory', 'staged_assets/ui/military_icons/Field Gear/assault-day-pack-001.png'],
        ['abilities', 'Abilities', 'staged_assets/ui/scifi_icons/Gadgets/acoustic-hull-probe-001.png'],
        ['mounts', 'Mounts', 'staged_assets/ui/military_icons/Vehicles/recon-dirt-bike-001.png'],
        ['quests', 'Quests', 'staged_assets/ui/military_icons/Maps Data/fire-support-target-card-001.png'],
        ['bounties', 'Bounties', 'staged_assets/ui/fantasy_rpg_icons/Classes/bounty-hunter-class-001.png'],
        ['codex', 'Codex', 'staged_assets/ui/military_icons/Field Gear/encrypted-field-notebook-001.png'],
        ['map', 'Map', 'staged_assets/ui/military_icons/Optics Sensors/compact-binocular-optic-001.png'],
        ['factions', 'Factions', 'staged_assets/ui/military_icons/Communications/antenna-relay-puck-001.png'],
        ['system', 'System', 'staged_assets/ui/dieselpunk_icons/Tools/antenna-splice-kit-001.png']
    ];
    const ATTR_COL = { BRW: '#f97316', RFX: '#a3e635', TCH: '#38bdf8', PRC: '#facc15', PRS: '#f472b6' };
    const ELEM_BADGE = {
        kinetic: { label: 'KINETIC', color: '#cbd5e1' },
        burn: { label: 'BURN', color: '#f97316' },
        chill: { label: 'CHILL', color: '#38bdf8' },
        shock: { label: 'SHOCK', color: '#facc15' },
        venom: { label: 'VENOM', color: '#84cc16' },
        void: { label: 'VOID', color: '#c084fc' }
    };

    const Pad = {
        tab: 'character',
        get UI() { return BO.OWRPGUI; },
        get s() { return BO.OWRPGMode.state; },

        open(tab, respec) {
            this.tab = tab || this.tab;
            this.respecMode = !!respec;
            this.render();
        },

        render() {
            const nav = TABS.map(([id, n, ico]) => `<button class="ow-tab ${this.tab === id ? 'on' : ''}" data-act="padTab" data-v="${id}"><img src="${ico}" alt="" style="width:15px;height:15px;object-fit:contain;vertical-align:-2px;margin-right:5px;border-radius:3px">${n}</button>`).join('');
            const body = this['_' + this.tab] ? this['_' + this.tab]() : '';
            const p = this.s.player;
            this.UI.open('pippad', `
                <div class="ow-pad-top"><div><span class="ow-kicker">PIP-PAD · ${esc(p.name)}</span><b class="ow-pad-lv">Level ${p.level}${p.perkPoints ? ` · <span class="ow-gold">${p.perkPoints} perk pt</span>` : ''}${p.attrPoints ? ` · <span class="ow-gold">${p.attrPoints} attr pt</span>` : ''}</b></div>
                <button class="ow-btn ow-ghost" data-act="close">CLOSE [Tab]</button></div>
                <nav class="ow-tabs">${nav}${this.tab === 'dev' ? '<button class="ow-tab on">Dev</button>' : ''}</nav>
                <div class="ow-pad-body">${body}</div>`);
            if (this.tab === 'map') this._drawMap();
        },

        handleKey(e) {
            const i = TABS.findIndex(([id]) => id === this.tab);
            if (e.code === 'KeyQ' || e.code === 'KeyE') { this.tab = TABS[(i + (e.code === 'KeyE' ? 1 : TABS.length - 1)) % TABS.length][0]; this.render(); }
        },

        /* ------------------------------------------------ tabs */
        _character() {
            const s = this.s, SD = BO.OWRPGStatsData, C = BO.OWRPGCharacter, I = BO.OWRPGInventory;
            const d = C.derived(s), enc = C.encumbrance(s), p = s.player;
            const rows = SD.ATTRS.map((a) => `<div class="ow-attr"><div class="ow-attr-name" style="--c:${ATTR_COL[a.id]}"><b>${a.name}</b><small>${a.desc}</small></div>
                <div class="ow-attr-ctl"><span class="ow-pips">${Array.from({ length: 10 }, (_, i) => `<i class="${i < C.attr(s, a.id) ? 'on' : ''}" style="--c:${ATTR_COL[a.id]}"></i>`).join('')}</span><b class="ow-num">${C.attr(s, a.id)}</b>
                <button class="ow-btn ow-sq" data-act="raise" data-v="${a.id}" ${p.attrPoints > 0 && C.attr(s, a.id) < 10 ? '' : 'disabled'}>+</button></div></div>`).join('');
            const stat = (k, v) => `<div class="ow-stat"><small>${k}</small><b>${v}</b></div>`;
            const res = d.elemRes || {};
            const resPills = ['burn', 'chill', 'shock', 'venom', 'void'].map((el) => {
                const pct = Math.round((res[el] || 0) * 100);
                return `<span class="ow-elem-pill" style="--c:${ELEM_BADGE[el].color}">${ELEM_BADGE[el].label} RES <b>${pct}%</b></span>`;
            }).join('');
            const slotOrder = [['helmet', 'HELMET'], ['rig', 'ARMOR RIG'], ['boots', 'BOOTS'], ['relic', 'RELIC'], ['tool', 'FIELD TOOL [G]']];
            const doll = slotOrder.map(([sl, lbl]) => {
                const e = I.equippedEntry(s, sl);
                const def = e ? I.def(e.id) : null;
                const durPct = e && BO.OWRPGDurability ? Math.round(BO.OWRPGDurability.ratio(e) * 100) : 100;
                return `<div class="ow-doll-slot"><small>${lbl}</small><b>${def ? esc(def.name) : '<span class="ow-dim">Empty</span>'}</b>${e ? `<em style="color:${BO.OWRPGDurability?.badgeColor(durPct / 100) || '#4ade80'}">${durPct}%</em>` : ''}</div>`;
            }).join('');
            const setsHtml = (d.activeSets || []).length
                ? d.activeSets.map((st) => `<div class="ow-set-card" style="--c:${st.color}"><b>${esc(st.name)} (${st.count}/3)</b><small>${st.tiers.length ? st.tiers.map(esc).join(' · ') : 'Equip 2+ pieces for set bonus'}</small></div>`).join('')
                : '<div class="ow-empty">Equip matching set armor (Warden Vanguard, Ironclad Juggernaut, Ghost Stalker, Meridian Arc-Tech) to unlock 2-pc &amp; 3-pc bonuses.</div>';
            return `<div class="ow-two"><div><div class="ow-sub">ATTRIBUTES ${p.attrPoints ? `<span class="ow-gold">${p.attrPoints} to spend</span>` : ''}</div><div class="ow-attrs">${rows}</div>
                <div class="ow-sub">ARMOR PAPER-DOLL &amp; TOOL</div><div class="ow-paperdoll">${doll}</div></div>
                <div><div class="ow-sub">DERIVED</div><div class="ow-stats">
                ${stat('Max HP', d.maxHp)}${stat('Armor', d.armor)}${stat('Carry', `${enc.weight.toFixed(1)} / ${d.maxWeight} kg (${enc.label})`)}
                ${stat('Weakspot ×', d.critMult.toFixed(2))}${stat('Sneak attack ×', d.stealthMult.toFixed(2))}${stat('Cooldowns', Math.round(d.cdMult * 100) + '%')}
                ${stat('Status potency', Math.round(d.statusPotency * 100) + '%')}${stat('Noise', Math.round(d.noiseMult * 100) + '%')}${stat('Buy prices', Math.round(d.buyMult * 100) + '%')}
                ${stat('Reputation gains', Math.round(d.repMult * 100) + '%')}${stat('XP', `${p.xp} / ${C.xpToNext(s)}`)}${stat('Credits', p.credits)}</div>
                <div class="ow-sub">ELEMENTAL RESISTANCES</div><div class="ow-elem-row">${resPills}</div>
                <div class="ow-sub">ACTIVE SET BONUSES</div>${setsHtml}
                <div class="ow-sub">RECORD</div><div class="ow-stats">${stat('Kills', s.stats.kills)}${stat('Sneak kills', s.stats.sneakKills)}${stat('Reactions', s.stats.reactions)}${stat('Events cleared', s.stats.eventsCleared || 0)}${stat('Discovered', s.stats.discovered)}${stat('Played', Math.round(s.playtimeSec / 60) + ' min')}</div></div></div>`;
        },

        _perks() {
            const s = this.s, SD = BO.OWRPGStatsData, C = BO.OWRPGCharacter;
            const trees = Object.entries(SD.PERK_TREES).map(([tid, t]) => `<div class="ow-tree" style="--c:${t.color}"><h3>${t.name}</h3>${t.tiers.map((pair, ti) => `
                <div class="ow-tier"><small>LV ${SD.TIER_LEVELS[ti]}</small><div class="ow-xor">${pair.map((pk) => {
                const owned = s.player.perks.includes(pk.id), why = C.perkBlock(s, pk.id);
                return `<button class="ow-perk ${owned ? 'owned' : ''} ${!owned && why ? 'locked' : ''}" data-act="perk" data-v="${pk.id}" ${owned || why ? 'disabled' : ''} title="${esc(why)}"><b>${pk.name}</b><small>${pk.desc}</small>${!owned && why ? `<em>${why}</em>` : ''}</button>`;
            }).join('<span class="ow-or">OR</span>')}</div></div>`).join('')}</div>`).join('');
            const cost = C.respecCost(s);
            const respec = this.respecMode ? `<div class="ow-note">Medic Ines can retrain you. Cost: <b class="ow-gold">${cost} cr</b>. <button class="ow-btn" data-act="respec" ${s.player.credits >= cost && s.player.perks.length ? '' : 'disabled'}>RESPEC PERKS</button></div>` : '';
            return `${respec}<p class="ow-dim">One perk point every even level. Each tier is a choice: taking one perk locks the other. Tiers need the previous tier of the same tree.</p><div class="ow-trees">${trees}</div>`;
        },

        _inventory() {
            const s = this.s, I = BO.OWRPGInventory, SD = BO.OWRPGStatsData, Dur = BO.OWRPGDurability;
            const eq = s.player.equipped;
            const groups = { weapon: [], helmet: [], rig: [], boots: [], relic: [], tool: [], consumable: [], junk: [], quest: [] };
            let totalRepair = 0;
            for (const slot of ['primary', 'secondary', 'helmet', 'rig', 'boots', 'relic', 'tool']) {
                const it = eq[slot] ? I.byUid(s, eq[slot]) : null;
                if (it && Dur) totalRepair += Dur.repairCost(s, it);
            }
            for (const e of s.player.inventory) {
                const d = I.def(e.id);
                if (!d) continue;
                if (Dur && Dur.supports(d.type)) Dur.initItem(e);
                (groups[d.type] || groups.junk).push(e);
            }
            const row = (e) => {
                const d = I.def(e.id);
                const isEq = Object.values(eq).includes(e.uid);
                let info = `${I.entryWeight(e).toFixed(1)} kg`;
                let rpgInspector = '';
                let durBar = '';
                if (Dur && Dur.supports(d.type) && e.maxDur) {
                    const r = Dur.ratio(e);
                    const pct = Math.round(r * 100);
                    durBar = `<div class="ow-dur-wrap"><span class="ow-durbar"><i style="width:${pct}%;background:${Dur.badgeColor(r)}"></i></span><small>${Math.round(e.dur)}/${e.maxDur} dur (${pct}%)</small></div>`;
                }
                if (d.type === 'weapon') {
                    const ws = I.weaponStats(e), base = BO.WeaponsData.get(d.base);
                    const gs = BO.OWRPGExpansionData?.getGunStats?.(d.base) || {};
                    const eb = ELEM_BADGE[ws.element] || ELEM_BADGE.kinetic;
                    const traitName = (BO.OWRPGExpansionData?.PASSIVE_TRAITS?.[ws.passiveTrait]?.name) || '';
                    info = `${base.category} · ${Math.round(base.damage * ws.dmgMult)} RPG dmg · ${(e.mfr || '')} ${(e.affixes || []).map((a) => SD.AFFIXES[a]?.name || a).join(', ')} · ${info}`;
                    rpgInspector = `<div class="ow-gun-insp"><span class="ow-elem-pill" style="--c:${eb.color}">${eb.label}${ws.elemDmg ? ' +' + Math.round(ws.elemDmg) : ''}</span>` +
                        `<span>Crit ${Math.round((ws.critChance || 0.08) * 100)}% (+${Math.round((ws.critAdd || 0) * 100)}%)</span>` +
                        `<span>Pen ${ws.pen || 0}</span>` +
                        (traitName ? `<span title="${esc(gs.passiveDesc || ws.passiveDesc || '')}">★ ${esc(traitName)}</span>` : '') +
                        `</div>`;
                } else if (d.type === 'helmet' || d.type === 'rig' || d.type === 'boots' || d.type === 'relic') {
                    const as = I.armorStats(e);
                    const resList = Object.entries(d.elemRes || {}).map(([k, v]) => `${k.toUpperCase()} +${Math.round(v * 100)}%`).join(', ');
                    const setName = d.setId && BO.OWRPGExpansionData?.ARMOR_SETS?.[d.setId]?.name;
                    info = `${as.armor} armor${setName ? ' · Set: ' + setName : ''}${resList ? ' · ' + resList : ''} · ${info}`;
                } else if (d.desc) {
                    info = d.desc + ' · ' + info;
                }
                const req = d.req && !I.meetsReq(s, e.id) ? `<em class="ow-bad">Req ${d.req[0]} ${d.req[1]}</em>` : '';
                let btns = '';
                if (d.type === 'weapon') btns = `<button class="ow-btn ow-sm" data-act="equip" data-v="${e.uid}|primary" ${eq.primary === e.uid ? 'disabled' : ''}>PRIMARY</button><button class="ow-btn ow-sm" data-act="equip" data-v="${e.uid}|secondary" ${eq.secondary === e.uid ? 'disabled' : ''}>SIDEARM</button>`;
                if (d.type === 'helmet' || d.type === 'rig' || d.type === 'boots' || d.type === 'relic') btns = `<button class="ow-btn ow-sm" data-act="equip" data-v="${e.uid}|${d.type}" ${eq[d.type] === e.uid ? 'disabled' : ''}>EQUIP</button>`;
                if (d.type === 'tool') btns = `<button class="ow-btn ow-sm" data-act="equip" data-v="${e.uid}|tool" ${eq.tool === e.uid ? 'disabled' : ''}>SLOT [G]</button><button class="ow-btn ow-sm" data-act="useTool" data-v="${e.uid}">USE</button>`;
                if (d.type === 'consumable' && e.id !== 'relay_cell') btns = `<button class="ow-btn ow-sm" data-act="use" data-v="${e.uid}">USE</button>`;
                const repCost = Dur && Dur.supports(d.type) ? Dur.repairCost(s, e) : 0;
                if (repCost > 0) btns += `<button class="ow-btn ow-sm" data-act="repairItem" data-v="${e.uid}" ${s.player.credits >= repCost ? '' : 'disabled'}>REPAIR ${repCost}cr</button>`;
                if (d.type !== 'quest' && !isEq) btns += `<button class="ow-btn ow-sm ow-ghost" data-act="salvage" data-v="${e.uid}">SALVAGE</button><button class="ow-btn ow-sm ow-ghost" data-act="drop" data-v="${e.uid}">DROP</button>`;
                return `<div class="ow-item ${isEq ? 'eq' : ''}"><div><b style="color:${I.rarityColor(e)}">${esc(I.displayName(e))}${isEq ? ' <span class="ow-tagx">EQUIPPED</span>' : ''}</b><small>${esc(info)}</small>${rpgInspector}${durBar}${req}</div><div class="ow-row ow-wrap">${btns}</div></div>`;
            };
            const enc = BO.OWRPGCharacter.encumbrance(s);
            const sect = (k, n) => groups[k].length ? `<div class="ow-sub">${n}</div><div class="ow-list">${groups[k].map(row).join('')}</div>` : '';
            const wb = `<div class="ow-workbench"><div><b>FIELD REPAIR WORKBENCH</b><small>Damaged gear loses effectiveness at &le;25% durability. Tech reduces repair cost.</small></div><button class="ow-btn ${totalRepair ? 'ow-primary' : ''}" data-act="repairAll" ${totalRepair > 0 && s.player.credits >= totalRepair ? '' : 'disabled'}>${totalRepair ? `REPAIR ALL EQUIPPED (${totalRepair} cr)` : 'EQUIPPED GEAR 100%'}</button></div>`;
            return `${wb}<p class="ow-dim">Carrying <b>${enc.weight.toFixed(1)} / ${enc.max} kg</b> — <b>${enc.label}</b>. Heavy loads slow your sprint and make you louder. Relay Cells: ${s.player.relayCells}. Credits: <b class="ow-gold">${s.player.credits}</b>.</p>
                ${sect('weapon', 'WEAPONS (MERIDIAN RPG STATS)')}${sect('helmet', 'HELMETS')}${sect('rig', 'ARMOR RIGS')}${sect('boots', 'BOOTS')}${sect('relic', 'RELICS')}${sect('tool', 'FIELD PICKUPS & TOOLS')}${sect('consumable', 'CONSUMABLES')}${sect('junk', 'SALVAGE')}${sect('quest', 'QUEST ITEMS & KEYS')}`;
        },

        _abilities() {
            const s = this.s, A = BO.OWRPGStatsData.ABILITIES, kb = BO.Settings.getKeybinds();
            const EX = BO.OWRPGExpansionData;
            const kn = (c) => (c || '').replace('Key', '');
            const col = (slot, key) => `<div><div class="ow-sub">${slot.toUpperCase()} <kbd>${kn(key)}</kbd></div><div class="ow-chips">${Object.entries(A[slot] || {}).map(([id, a]) => {
                const ok = BO.OWRPGCharacter.powerUnlocked ? BO.OWRPGCharacter.powerUnlocked(s, id) : true;
                const label = (EX?.POWER_UNLOCKS?.[id]?.label) || 'Locked';
                const on = s.player.abilities[slot] === id;
                return `<button class="ow-chip ${on ? 'on' : ''}" data-act="ability" data-v="${slot}|${id}" ${ok ? '' : 'disabled'}><b>${esc(a.name)}</b><small>${esc(a.desc)} · ${a.cd}s</small>${ok ? '' : `<em>Unlock: ${esc(label)}</em>`}</button>`;
            }).join('')}</div></div>`;
            return `<p class="ow-dim">Primers apply 5-Element Statuses: <span style="color:#f97316">Burn</span>, <span style="color:#38bdf8">Chill</span>, <span style="color:#facc15">Shock</span>, <span style="color:#84cc16">Venom</span>, <span style="color:#c084fc">Void</span>, <span style="color:#f472b6">Expose</span>. Detonators consume statuses for chain reactions, and Ultimates turn the tide.</p>
                <div class="ow-four">${col('primer', kb.owAbility1)}${col('detonator', kb.owAbility2)}${col('gadget', kb.owGadget)}${col('ultimate', kb.owUltimate || 'KeyU')}</div>`;
        },

        _mounts() {
            const s = this.s;
            const MOUNTS = BO.OWRPGExpansionData?.MOUNTS || {};
            const Mnt = BO.OWRPGMounts;
            const active = (s.player.mounts && s.player.mounts.active) || null;
            const cards = Object.values(MOUNTS).map((m) => {
                const owned = Mnt ? Mnt.isOwned(s, m.id) : false;
                const sel = active === m.id;
                const isRidden = Mnt && Mnt.mounted && Mnt.activeId === m.id;
                return `<div class="ow-mount-card ${sel ? 'on' : ''} ${owned ? '' : 'locked'}" style="--c:#${m.color.toString(16).padStart(6, '0')}">
                    <div><b>${esc(m.name)}</b><small>${esc(m.desc)}</small>
                    <div class="ow-mount-stats"><span>Cruise ${m.speed} m/s</span><span>Turbo ${m.boostSpeed} m/s</span><span>Mounted DR +${Math.round(m.dr * 100)}%</span><span>Jump ${m.jump}</span></div>
                    ${owned ? '' : `<em>Unlock: ${esc(m.unlockLabel)}</em>`}</div>
                    <div class="ow-row">${owned ? `<button class="ow-btn ${isRidden ? 'ow-primary' : ''}" data-act="mountSelect" data-v="${m.id}">${isRidden ? 'MOUNTED [T]' : 'SUMMON [T]'}</button>` : '<span class="ow-dim">LOCKED</span>'}</div></div>`;
            }).join('');
            return `<p class="ow-dim">Press <kbd>T</kbd> anytime outdoors to summon or dismount your selected vehicle/walker. Hold <kbd>Shift</kbd> for turbo boost and <kbd>Space</kbd> to jump terrain gaps.</p><div class="ow-list">${cards}</div>`;
        },

        _bounties() {
            const s = this.s;
            const list = BO.OWRPGExpansionData?.BOUNTIES || [];
            const bState = s.player.bounties || { active: null, completed: 0, progress: 0 };
            const ev = BO.OWRPGEvents?.activeEvent;
            const evCard = ev
                ? `<div class="ow-note" style="border-color:${ev.color}"><div><b style="color:${ev.color}">ACTIVE WORLD EVENT: ${esc(ev.title)}</b><br><small>${esc(ev.desc)} · ${ev.remaining}/${ev.total} enemies · ${Math.ceil(ev.t)}s</small></div></div>`
                : `<div class="ow-workbench"><div><b>DYNAMIC WORLD EVENTS</b><small>Roam outside Freestead to encounter Supply Drops, Faction Skirmishes, Void Storms, and Rogue Patrols.</small></div><button class="ow-btn" data-act="scanEvent">SCAN NEARBY SECTOR</button></div>`;
            const cards = list.map((b) => {
                const isAct = bState.active === b.id;
                const pct = isAct ? Math.min(100, Math.round((bState.progress / b.count) * 100)) : 0;
                return `<div class="ow-bounty-card ${isAct ? 'active' : ''}"><div><b>${esc(b.title)}</b><small>${esc(b.desc)}</small>
                    <small class="ow-gold">Reward: ${b.xp} XP · ${b.credits} cr</small>
                    ${isAct ? `<div class="ow-dur-wrap"><span class="ow-durbar"><i style="width:${pct}%;background:#fbbf24"></i></span><small>${bState.progress} / ${b.count} eliminated</small></div>` : ''}</div>
                    <div>${isAct ? `<button class="ow-btn ow-sm ow-ghost" data-act="abandonBounty">ABANDON</button>` : `<button class="ow-btn ow-sm" data-act="acceptBounty" data-v="${b.id}">${bState.active ? 'SWITCH' : 'ACCEPT'}</button>`}</div></div>`;
            }).join('');
            return `${evCard}<p class="ow-dim">Bounties Completed: <b class="ow-gold">${bState.completed || 0}</b> · World Events Cleared: <b class="ow-gold">${s.stats.eventsCleared || 0}</b></p><div class="ow-list">${cards}</div>`;
        },

        _codex() {
            const s = this.s;
            const EX = BO.OWRPGExpansionData;
            const claimed = (s.player.codex && s.player.codex.unlocksClaimed) || [];
            const cards = (EX?.CODEX_MILESTONES || []).map((cx) => {
                const done = cx.check(s);
                const got = claimed.includes(cx.id);
                const rwNames = [cx.reward?.credits ? `${cx.reward.credits} cr` : '', ...(cx.reward?.items || []).map((id) => BO.OWRPGInventory.def(id)?.name || id)].filter(Boolean).join(', ');
                return `<div class="ow-codex-card ${got ? 'claimed' : done ? 'ready' : ''}"><div><b>${esc(cx.title)}</b><small>${esc(cx.desc)}</small><small class="ow-gold">Unlock: ${esc(rwNames)}</small></div>
                    <div>${got ? '<span class="ow-tagx">CLAIMED</span>' : done ? `<button class="ow-btn ow-primary ow-sm" data-act="claimCodex" data-v="${cx.id}">CLAIM</button>` : '<span class="ow-dim">IN PROGRESS</span>'}</div></div>`;
            }).join('');
            const kills = Object.entries((s.player.codex && s.player.codex.enemies) || {}).map(([id, n]) => {
                const def = BO.OWRPGStatsData.ENEMIES[id];
                return `<div class="ow-stat"><small>${esc(def ? def.name : id)}</small><b>${n} slain</b></div>`;
            }).join('') || '<div class="ow-empty">No hostile encounters logged yet.</div>';
            const guns = ((BO.WeaponsData && BO.WeaponsData.ORDER) || []).slice(0, 24).map((wid) => {
                const w = BO.WeaponsData.get(wid), gs = EX.getGunStats(wid);
                const eb = ELEM_BADGE[gs.element] || ELEM_BADGE.kinetic;
                return `<div class="ow-item"><div><b>${esc(w.name)}</b><small>${esc(w.category)} · ×${gs.rpgDmgMult} RPG · Crit ${Math.round(gs.critChance * 100)}% · Pen ${gs.armorPen} · ${esc(gs.unlockReq)}</small></div><span class="ow-elem-pill" style="--c:${eb.color}">${eb.label}</span></div>`;
            }).join('');
            return `<div class="ow-sub">CODEX MILESTONES &amp; UNLOCKABLES</div><div class="ow-list">${cards}</div>
                <div class="ow-sub">BESTIARY KILL LOG</div><div class="ow-stats">${kills}</div>
                <div class="ow-sub">MERIDIAN WEAPON COMPENDIUM (RPG STATS)</div><div class="ow-list">${guns}</div>`;
        },

        _quests() {
            const s = this.s, Q = BO.OWRPGQuests;
            const all = Object.entries(s.quests);
            const active = all.filter(([, q]) => q.state === 'active');
            const done = all.filter(([, q]) => q.state === 'completed');
            const tracked = s.worldFlags.trackedQuest;
            const card = ([id, q]) => {
                const d = Q.def(id);
                const b = q.branch && d.branches[q.branch];
                return `<div class="ow-qcard ${q.state} ${tracked === id ? 'tracked' : ''}"><div><span class="ow-kicker">${d.kind.toUpperCase()}</span><b>${esc(d.name)}</b><small>${esc(d.summary)}</small>
                    ${q.state === 'active' ? `<p>▸ ${esc(Q.objective(s, id))}</p>` : `<p class="ow-dim">Outcome: ${esc(b ? b.label : 'Complete')}</p>`}</div>
                    ${q.state === 'active' ? `<button class="ow-btn ow-sm" data-act="track" data-v="${id}">${tracked === id ? 'TRACKED' : 'TRACK'}</button>` : ''}</div>`;
            };
            return `<div class="ow-sub">ACTIVE</div>${active.map(card).join('') || '<div class="ow-empty">No active quests. Talk to people in Freestead.</div>'}
                <div class="ow-sub">COMPLETED</div>${done.map(card).join('') || '<div class="ow-empty">Nothing yet.</div>'}`;
        },

        _map() {
            return `<div class="ow-mapwrap"><canvas id="ow-map" width="640" height="640"></canvas>
                <div class="ow-maplegend"><p class="ow-dim">Click to place or remove a pin (shown on the compass). Quest markers appear for tracked objectives.</p>
                <label class="ow-check"><input type="checkbox" data-act="compassQuest" ${this.s.worldFlags.compassQuest ? 'checked' : ''}> Show tracked quest on compass</label>
                <div class="ow-legend"><span style="--c:#f5a623">◆ Settlement</span><span style="--c:#22d3ee">● Pylon (online)</span><span style="--c:#a3e635">◆ Quest marker</span><span style="--c:#f8fafc">▲ You</span><span style="--c:#f472b6">✚ Pin</span></div></div></div>`;
        },

        _drawMap() {
            const cv = document.getElementById('ow-map');
            if (!cv) return;
            const g = cv.getContext('2d');
            const s = this.s, D = BO.OWRPGWorldData, P = BO.Player;
            const W = cv.width, S = W / 640;
            const X = (x) => (x + 320) * S, Z = (z) => (z + 320) * S;
            g.fillStyle = '#0b1118'; g.fillRect(0, 0, W, W);
            // Terrain shading from the heightfield.
            const step = 8;
            for (let x = -320; x < 320; x += step) for (let z = -320; z < 320; z += step) {
                const h = BO.World.terrainHeight(x + step / 2, z + step / 2);
                const r = D.regionAt(x, z);
                const k = Math.max(0.25, Math.min(1, 0.55 + h / 50));
                g.fillStyle = (h < D.WATER && D.isWet(x, z)) || (h < -11.6 && Math.hypot(x + 180, z + 60) < 22) || (h < -6.4 && Math.hypot(x - 180, z + 190) < 20) ? '#1e3a3a' : `rgb(${r.col[0] * 255 * k | 0},${r.col[1] * 255 * k | 0},${r.col[2] * 255 * k | 0})`;
                g.fillRect(X(x), Z(z), step * S + 1, step * S + 1);
            }
            g.strokeStyle = 'rgba(40,40,40,0.8)'; g.lineWidth = 3;
            for (const r of D.ROADS) { g.beginPath(); r.pts.forEach(([x, z], i) => (i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z)))); g.stroke(); }
            g.font = 'bold 13px Segoe UI'; g.textAlign = 'center';
            for (const r of D.REGIONS) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillText(r.name.toUpperCase(), X(r.x), Z(r.z) - 30); }
            for (const l of D.LANDMARKS) { g.fillStyle = '#' + l.color.toString(16).padStart(6, '0'); g.fillRect(X(l.x) - 3, Z(l.z) - 9, 6, 12); }
            g.font = '11px Segoe UI';
            for (const poi of D.POIS) {
                if (poi.interior) continue;
                const st = s.poiStates[poi.id];
                if (!st || !st.discovered) continue;
                g.fillStyle = poi.safe ? '#f5a623' : (st.clearedAt != null ? '#94a3b8' : '#fca5a5');
                g.beginPath(); g.arc(X(poi.x), Z(poi.z), 4, 0, Math.PI * 2); g.fill();
                g.fillStyle = '#e2e8f0'; g.fillText(poi.name, X(poi.x), Z(poi.z) + 15);
            }
            for (const py of D.PYLONS) { g.fillStyle = s.pylons[py.id] ? '#22d3ee' : '#475569'; g.beginPath(); g.arc(X(py.x), Z(py.z), 3.5, 0, Math.PI * 2); g.fill(); }
            for (const m of BO.OWRPGQuests.markers(s)) {
                const poi = D.POIS.find((p) => p.id === m.poi);
                if (!poi) continue;
                g.strokeStyle = '#a3e635'; g.lineWidth = 2;
                g.beginPath(); g.arc(X(poi.x), Z(poi.z), 9, 0, Math.PI * 2); g.stroke();
            }
            for (const pin of s.pins) { g.fillStyle = '#f472b6'; g.font = 'bold 16px Segoe UI'; g.fillText('✚', X(pin[0]), Z(pin[1]) + 5); }
            if (!D.isInterior(P.pos.x, P.pos.z)) {
                g.save(); g.translate(X(P.pos.x), Z(P.pos.z)); g.rotate(-P.yaw + Math.PI);
                g.fillStyle = '#f8fafc'; g.beginPath(); g.moveTo(0, -8); g.lineTo(5, 6); g.lineTo(-5, 6); g.closePath(); g.fill(); g.restore();
            }
            cv.onclick = (e) => {
                const r = cv.getBoundingClientRect();
                const x = ((e.clientX - r.left) / r.width) * 640 - 320, z = ((e.clientY - r.top) / r.height) * 640 - 320;
                const i = s.pins.findIndex((p) => Math.hypot(p[0] - x, p[1] - z) < 12);
                if (i >= 0) s.pins.splice(i, 1); else if (s.pins.length < 6) s.pins.push([Math.round(x), Math.round(z)]);
                this._drawMap();
            };
            const chk = this.UI.panel.querySelector('[data-act="compassQuest"]');
            if (chk) chk.onchange = () => { s.worldFlags.compassQuest = chk.checked; };
        },

        _factions() {
            const s = this.s, FD = BO.OWRPGFactionsData, F = BO.OWRPGFactions;
            const rows = Object.entries(FD.FACTIONS).map(([id, f]) => {
                const r = F.rep(s, id), t = F.tier(s, id);
                const pct = ((r - FD.REP_MIN) / (FD.REP_MAX - FD.REP_MIN)) * 100;
                return `<div class="ow-fac" style="--c:${f.color}"><div><b>${f.name}</b><small>${f.blurb}</small><small>Rival: ${FD.FACTIONS[f.rival].name}</small></div>
                    <div class="ow-facbar"><i style="width:${pct.toFixed(1)}%"></i><span>${r}</span></div><b class="ow-tier" style="color:${t.color}">${t.name}${F.isHostile(s, id) ? ' · HOSTILE' : ''}</b></div>`;
            }).join('');
            const owned = BO.OWRPGWorldData.POIS.filter((p) => p.kind === 'contested').map((p) => `<div class="ow-item"><b>${p.name}</b><small>${F.poiOwner(s, p) ? FD.FACTIONS[F.poiOwner(s, p)].name : 'Contested'}</small></div>`).join('');
            return `<p class="ow-dim">Tiers: Hated ≤ −500 (kill on sight) · Shunned (warnings) · Neutral · Trusted ≥ 250 (12% discount) · Sworn ≥ 750 (locks out the rival's Sworn tier). Helping one faction costs you 50% of that gain with its rival.</p>
                <div class="ow-facs">${rows}</div><div class="ow-sub">TERRITORY</div><div class="ow-list">${owned}</div>`;
        },

        _system() {
            const M = BO.OWRPGMode;
            const can = M.canSave();
            return `<div class="ow-list"><div class="ow-item"><div><b>Quick save</b><small>${can ? esc(can) : 'Saves to slot ' + (M.slot + 1) + ' (also F5). Checkpoints save automatically.'}</small></div><button class="ow-btn" data-act="sysSave" ${can ? 'disabled' : ''}>SAVE</button></div>
                <div class="ow-item"><div><b>Load last save</b><small>${esc(M.lastSaveLabel || '')} (also F9)</small></div><button class="ow-btn ow-ghost" data-act="sysLoad">LOAD</button></div>
                <div class="ow-item"><div><b>Save size</b><small>${(BO.OWRPGSave.byteSize() / 1024).toFixed(1)} KB of the 250 KB budget</small></div></div></div>
                <div class="ow-sub">CONTROLS</div><p class="ow-dim">E interact · Q primer · F detonator · X gadget · H med-injector · B holster · Left Alt dodge · Tab Pip-Pad · J quests · M map · F5/F9 save/load · F8 dev tools. Rebind in Settings → Controls.</p>`;
        },

        _dev() {
            const D = BO.OWRPGWorldData;
            const pois = D.POIS.map((p) => `<button class="ow-btn ow-sm" data-act="devTp" data-v="${p.id}">${esc(p.name)}</button>`).join('');
            const res = this.validation ? `<pre class="ow-pre">${esc(this.validation)}</pre>` : '';
            return `<p class="ow-dim">Developer tools. Changes are saved with your character.</p>
                <div class="ow-sub">GRANTS</div><div class="ow-row ow-wrap"><button class="ow-btn ow-sm" data-act="devXp">+1000 XP</button><button class="ow-btn ow-sm" data-act="devAttr">+2 attr pts</button><button class="ow-btn ow-sm" data-act="devCells">+3 relay cells</button><button class="ow-btn ow-sm" data-act="devCr">+500 cr</button><button class="ow-btn ow-sm" data-act="devRep">+250 all reps</button><button class="ow-btn ow-sm" data-act="devTime">+6 hours</button><button class="ow-btn ow-sm" data-act="devMounts">Unlock all mounts</button><button class="ow-btn ow-sm" data-act="devEvent">Spawn world event</button><button class="ow-btn ow-sm" data-act="devVal">Run validator</button></div>
                <div class="ow-sub">TELEPORT</div><div class="ow-row ow-wrap">${pois}</div>
                <div class="ow-sub">WORLD FLAGS</div><pre class="ow-pre">${esc(JSON.stringify(this.s.worldFlags, null, 1))}</pre>${res}`;
        },

        /* ------------------------------------------------ handlers */
        handlers: {
            padTab(v) { this.tab = v; this.render(); },
            raise(v) { if (BO.OWRPGCharacter.raiseAttr(this.s, v)) { BO.OWRPGMode.applyDerived(); BO.OWRPGMode.refreshLoadout(); } this.render(); },
            perk(v) { if (BO.OWRPGCharacter.takePerk(this.s, v)) { BO.OWRPGMode.applyDerived(); BO.OWRPGMode.toast('Perk learned: ' + BO.OWRPGStatsData.perkIndex()[v].perk.name, '#fbbf24'); } this.render(); },
            respec() { if (BO.OWRPGCharacter.respec(this.s)) { BO.OWRPGMode.applyDerived(); BO.OWRPGMode.toast('Perks reset', '#f472b6'); } this.render(); },
            equip(v) {
                const [uid, slot] = v.split('|');
                const err = BO.OWRPGInventory.equip(this.s, uid, slot);
                if (err) BO.OWRPGMode.toast(err, '#f97316');
                else { BO.OWRPGMode.refreshLoadout(); BO.OWRPGMode.applyDerived(); }
                this.render();
            },
            use(v) { BO.OWRPGMode.useConsumable(v); this.render(); },
            useTool(v) {
                const err = BO.OWRPGDurability?.useTool(this.s, v);
                if (err) BO.OWRPGMode.toast(err, '#f97316');
                BO.OWRPGMode.applyDerived();
                this.render();
            },
            repairItem(v) {
                const err = BO.OWRPGDurability?.repairItem(this.s, v, 'credits');
                if (err) BO.OWRPGMode.toast(err, '#f97316');
                else { BO.OWRPGMode.applyDerived(); BO.OWRPGMode.toast('Repaired!', '#4ade80'); }
                this.render();
            },
            repairAll() {
                const err = BO.OWRPGDurability?.repairAllEquipped(this.s);
                if (err) BO.OWRPGMode.toast(err, '#f97316');
                else { BO.OWRPGMode.applyDerived(); BO.OWRPGMode.toast('All equipped gear repaired!', '#4ade80'); }
                this.render();
            },
            mountSelect(v) {
                if (BO.OWRPGMounts?.select(this.s, v)) {
                    this.UI.close();
                    if (!BO.OWRPGMounts.mounted) BO.OWRPGMounts.mount();
                } else {
                    this.render();
                }
            },
            acceptBounty(v) {
                this.s.player.bounties = this.s.player.bounties || { active: null, completed: 0, progress: 0 };
                this.s.player.bounties.active = v;
                this.s.player.bounties.progress = 0;
                const B = BO.OWRPGExpansionData?.BOUNTIES?.find((b) => b.id === v);
                if (B) BO.OWRPGMode.toast(`Bounty Accepted: ${B.title}`, '#fbbf24');
                this.render();
            },
            abandonBounty() {
                if (this.s.player.bounties) { this.s.player.bounties.active = null; this.s.player.bounties.progress = 0; }
                this.render();
            },
            scanEvent() {
                const ev = BO.OWRPGEvents?.spawnNearPlayer?.();
                if (!ev) BO.OWRPGMode.toast('Step outside Freestead roads to scan for active events.', '#94a3b8');
                this.render();
            },
            claimCodex(v) {
                const cx = BO.OWRPGExpansionData?.CODEX_MILESTONES?.find((m) => m.id === v);
                if (!cx || !cx.check(this.s)) return;
                this.s.player.codex = this.s.player.codex || { enemies: {}, elements: {}, unlocksClaimed: [] };
                if (this.s.player.codex.unlocksClaimed.includes(v)) return;
                this.s.player.codex.unlocksClaimed.push(v);
                if (cx.reward?.credits) this.s.player.credits += cx.reward.credits;
                for (const it of cx.reward?.items || []) BO.OWRPGInventory.add(this.s, it, 1);
                BO.Sound?.playQuestFanfare?.();
                BO.OWRPGMode.toast(`Codex Claimed: ${cx.title}!`, '#fbbf24');
                this.render();
            },
            salvage(v) { const cr = BO.OWRPGInventory.salvage(this.s, v); if (cr) BO.OWRPGMode.toast(`Salvaged for ${cr} cr`, '#fbbf24'); this.render(); },
            drop(v) { BO.OWRPGInventory.removeUid(this.s, v); BO.OWRPGMode.refreshLoadout(); this.render(); },
            ability(v) { const [slot, id] = v.split('|'); this.s.player.abilities[slot] = id; this.render(); },
            track(v) { this.s.worldFlags.trackedQuest = v; this.render(); },
            sysSave() { BO.OWRPGMode.quickSave(); this.render(); },
            sysLoad() { this.UI.close(true); BO.OWRPGMode.quickLoad(); },
            devTp(v) {
                const p = BO.OWRPGWorldData.POIS.find((x) => x.id === v);
                const P = BO.Player;
                const x = p.x + (p.interior ? 0 : p.r * 0.6), z = p.z + (p.interior ? -20 : p.r * 0.6);
                P.pos.set(x, p.interior ? 0.2 : BO.World.terrainHeight(x, z) + 0.5, z);
                P.vel.set(0, 0, 0);
                this.UI.close();
            },
            devXp() { BO.OWRPGMode.giveXp(1000, 'Dev'); this.render(); },
            devAttr() { this.s.player.attrPoints += 2; this.render(); },
            devCells() { this.s.player.relayCells += 3; this.render(); },
            devCr() { this.s.player.credits += 500; this.render(); },
            devRep() { for (const f of Object.keys(BO.OWRPGFactionsData.FACTIONS)) BO.OWRPGFactions.add(this.s, f, 250, { raw: true, noSpill: true }); BO.OWRPGAI.refreshHostility(); this.render(); },
            devTime() { this.s.worldClock = (this.s.worldClock + 600) % 2400; this.render(); },
            devMounts() { for (const id of Object.keys(BO.OWRPGExpansionData?.MOUNTS || {})) BO.OWRPGMounts?.unlock(this.s, id); this.render(); },
            devEvent() { const ev = BO.OWRPGEvents?.spawnNearPlayer?.(); if (!ev) BO.OWRPGMode.toast('Move away from Freestead to spawn event', '#f97316'); else this.UI.close(); },
            devVal() { const r = BO.OWRPGValidator.runAll(); this.validation = r.report; this.render(); }
        }
    };

    BO.OWRPGPipPad = Pad;
})(window.BO);
