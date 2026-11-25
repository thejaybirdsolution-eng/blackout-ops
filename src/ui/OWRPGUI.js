/* ============================================================================
   BLACKOUT OPS — Open World RPG · UI (HUD, modal framework, dialogue,
   character creator & slots, vendor, stash, travel, death screen)
   The Pip-Pad tabs and dev overlay live in OWRPGPipPad.js.
   modalOpen pauses the simulation (checked by main.js like RPGUI.modalOpen).
============================================================================ */
(function (BO) {
    'use strict';

    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const ATTR_COL = { BRW: '#f97316', RFX: '#a3e635', TCH: '#38bdf8', PRC: '#facc15', PRS: '#f472b6', REP: '#c084fc', ITEM: '#cbd5e1' };
    const _v = new THREE.Vector3();

    const UI = {
        modalOpen: false,
        deathOpen: false,
        kind: null,
        floats: [],
        dlg: null,

        get M() { return BO.OWRPGMode; },
        get s() { return BO.OWRPGMode.state; },

        init() {
            if (this.root) return;
            const root = document.createElement('div');
            root.id = 'owrpg-root';
            root.innerHTML = `
                <div id="ow-hud" class="hidden">
                    <div class="ow-compass" id="ow-compass"></div>
                    <div class="ow-eye" id="ow-eye"><span></span><b id="ow-eye-label">HIDDEN</b></div>
                    <div class="ow-quest" id="ow-quest"></div>
                    <div class="ow-clock" id="ow-clock"></div>
                    <div class="ow-prompt hidden" id="ow-prompt"></div>
                    <div class="ow-xp" id="ow-xp"><div class="ow-xp-top"><b id="ow-lvl">LV 1</b><span id="ow-xpnum"></span></div><div class="ow-xp-bar"><i id="ow-xpfill"></i></div>
                        <div class="ow-res"><span id="ow-cr"></span><span id="ow-cells"></span><span id="ow-enc"></span></div></div>
                    <div class="ow-abilities" id="ow-abilities"></div>
                    <div class="ow-pops" id="ow-pops"></div>
                    <div class="ow-floats" id="ow-floats"></div>
                    <div class="ow-camo hidden" id="ow-camo">OPTICAL CAMO</div>
                </div>
                <div id="ow-modal" class="hidden"><div class="ow-panel" id="ow-panel"></div></div>`;
            document.body.appendChild(root);
            this.root = root;
            this.hud = root.querySelector('#ow-hud');
            this.modal = root.querySelector('#ow-modal');
            this.panel = root.querySelector('#ow-panel');
            this.panel.addEventListener('click', (e) => this._onClick(e));
            this.panel.addEventListener('input', (e) => this._onInput(e));
        },

        /* ================================================== modal framework */
        open(kind, html, opts = {}) {
            this.init();
            this.kind = kind;
            this.panel.className = 'ow-panel ow-' + kind;
            this.panel.innerHTML = html;
            this.modal.classList.remove('hidden');
            this.modal.classList.toggle('ow-letterbox', kind === 'dialogue');
            this.modalOpen = true;
            this.closable = opts.closable !== false;
            if (document.pointerLockElement) document.exitPointerLock();
            if (BO.App && BO.App._clearInputState) BO.App._clearInputState();
        },

        close(silent) {
            if (!this.modalOpen) return;
            this.modalOpen = false;
            this.kind = null;
            this.modal.classList.add('hidden');
            if (!silent) BO.Sound.playUIClick();
            if (BO.State.screen === 'playing' && BO.App) BO.App._safePointerLock();
        },

        hideAll() {
            this.init();
            this.close(true);
            this.deathOpen = false;
            this.hud.classList.add('hidden');
            this.floats.forEach((f) => f.el.remove());
            this.floats = [];
        },

        handleKey(e) {
            const code = e.code;
            if (this.kind === 'dialogue') {
                const n = parseInt(code.replace('Digit', '').replace('Numpad', ''), 10);
                if (n >= 1 && n <= 9) { e.preventDefault(); this._chooseDialogue(n - 1); return; }
                if (code === 'Escape') { e.preventDefault(); this._endDialogue(); }
                return;
            }
            if (code === 'Escape' || (this.kind === 'pippad' && (code === 'Tab' || code === BO.Settings.getKeybinds().owCharacter))) {
                e.preventDefault();
                if (this.closable) this.close();
                return;
            }
            if (this.kind === 'pippad' && BO.OWRPGPipPad) BO.OWRPGPipPad.handleKey(e);
        },

        _onInput(e) {
            const t = e.target;
            if (t.dataset.act === 'cname' && this.creator) this.creator.name = t.value;
        },

        _onClick(e) {
            const b = e.target.closest('[data-act]');
            if (!b || b.disabled) return;
            const act = b.dataset.act, v = b.dataset.v;
            const h = this.handlers[act];
            if (h) { BO.Sound.playUIClick(); h.call(this, v, b); }
            else if (BO.OWRPGPipPad && BO.OWRPGPipPad.handlers[act]) { BO.Sound.playUIClick(); BO.OWRPGPipPad.handlers[act].call(BO.OWRPGPipPad, v, b); }
        },

        handlers: {
            close() { this.close(); },
            choose(v) { this._chooseDialogue(Number(v)); },
            buy(v) { const err = BO.OWRPGInventory.buy(this.s, this.vendorId, v); if (err) this.M.toast(err, '#f97316'); this.openVendor(this.vendorId); },
            sell(v) { const cr = BO.OWRPGInventory.sell(this.s, v); if (cr) this.M.toast(`Sold for ${cr} cr`, '#fbbf24'); this.M.refreshLoadout(); this.openVendor(this.vendorId); },
            stashIn(v) { const e = BO.OWRPGInventory.removeUid(this.s, v); if (e) { this.s.player.stash.push(e); this.M.refreshLoadout(); } this.openStash(); },
            stashOut(v) { const st = this.s.player.stash; const i = st.findIndex((x) => x.uid === v); if (i >= 0) this.s.player.inventory.push(st.splice(i, 1)[0]); this.openStash(); },
            travel(v) { const err = this.M.travelTo(v); if (err) this.M.toast(err, '#f97316'); else this.close(); },
            deathLoad() { this.deathOpen = false; this.close(true); this.M.quickLoad(); },
            deathRespawn() {
                const s = this.s, P = BO.Player, T = BO.OWRPGWorldData.TOWN;
                this.deathOpen = false;
                s.player.credits = Math.floor(s.player.credits * 0.85);
                P.alive = true; P.hp = P.maxHp; P.inLastStand = false;
                P.pos.set(T.x + 20, BO.World.terrainHeight(T.x + 20, T.z + 20) + 0.3, T.z + 20);
                P.vel.set(0, 0, 0);
                BO.OWRPGAI.clear(); BO.OWRPGWorldSim.poiAgents = {};
                s.player.interiorId = null;
                this.close();
                this.M.toast('You wake in Freestead. Ines patched you up — for a fee.', '#f472b6');
            },
            deathMenu() { this.deathOpen = false; this.close(true); BO.App.exitToMenu(); },
            // Slots & creator (main menu).
            slotContinue(v) { this.close(true); this._start({ mode: 'owrpg', slot: Number(v) }); },
            slotNew(v) { this.openCreator(Number(v)); },
            slotDelete(v) { if (confirm('Delete this character permanently?')) { BO.OWRPGSave.remove(Number(v)); this.openSlots(); } },
            attrUp(v) { const c = this.creator; if (c.points > 0 && c.attrs[v] < 10) { c.attrs[v]++; c.points--; this._renderCreator(); } },
            attrDown(v) { const c = this.creator; if (c.attrs[v] > 1) { c.attrs[v]--; c.points++; this._renderCreator(); } },
            diff(v) { this.creator.difficulty = v; this._renderCreator(); },
            primer(v) { this.creator.primer = v; this._renderCreator(); },
            begin() {
                const c = this.creator;
                this.close(true);
                this._start({ mode: 'owrpg', slot: c.slot, newChar: { name: c.name || 'MERCER', attrs: c.attrs, difficulty: c.difficulty, primer: c.primer } });
            },
            backSlots() { this.openSlots(); }
        },

        _start(opts) { if (BO.Menus && BO.Menus.onStartMatch) BO.Menus.onStartMatch(opts); },

        /* ================================================== slots & creator */
        openSlots() {
            const list = BO.OWRPGSave.list();
            const rows = list.map((sl, i) => sl ? `
                <div class="ow-slot"><div><b>${esc(sl.name)}</b><small>Level ${sl.level} · ${Math.round(sl.playtimeSec / 60)} min · ${new Date(sl.timestamp).toLocaleString()}</small></div>
                <div class="ow-row"><button class="ow-btn ow-primary" data-act="slotContinue" data-v="${i}">CONTINUE</button><button class="ow-btn ow-ghost" data-act="slotDelete" data-v="${i}">DELETE</button></div></div>` : `
                <div class="ow-slot ow-empty"><div><b>Empty slot ${i + 1}</b><small>Create a new operative</small></div><button class="ow-btn" data-act="slotNew" data-v="${i}">NEW CHARACTER</button></div>`).join('');
            this.open('slots', `
                <div class="ow-head"><span class="ow-kicker">OPEN WORLD RPG</span><h2>Operation Meridian</h2>
                <p class="ow-dim">A 640 m frontier of six regions, four factions and choices that stick. Build a character, take sides, and find out what is calling from the crater.</p></div>
                <div class="ow-slots">${rows}</div>
                <div class="ow-row ow-end"><button class="ow-btn ow-ghost" data-act="close">BACK</button></div>`);
        },

        openCreator(slot) {
            const SD = BO.OWRPGStatsData;
            const attrs = {};
            SD.ATTR_IDS.forEach((id) => { attrs[id] = SD.ATTR_BASE; });
            this.creator = { slot, name: '', attrs, points: SD.CREATION_POINTS, difficulty: 'tactical', primer: 'cryo_dart' };
            this._renderCreator();
        },

        _renderCreator() {
            const SD = BO.OWRPGStatsData;
            const c = this.creator;
            const attrRows = SD.ATTRS.map((a) => `
                <div class="ow-attr"><div class="ow-attr-name" style="--c:${ATTR_COL[a.id]}"><b>${a.name}</b><small>${a.desc}</small></div>
                <div class="ow-attr-ctl"><button class="ow-btn ow-sq" data-act="attrDown" data-v="${a.id}" ${c.attrs[a.id] <= 1 ? 'disabled' : ''}>−</button>
                <span class="ow-pips">${Array.from({ length: 10 }, (_, i) => `<i class="${i < c.attrs[a.id] ? 'on' : ''}" style="--c:${ATTR_COL[a.id]}"></i>`).join('')}</span><b class="ow-num">${c.attrs[a.id]}</b>
                <button class="ow-btn ow-sq" data-act="attrUp" data-v="${a.id}" ${c.points <= 0 || c.attrs[a.id] >= 10 ? 'disabled' : ''}>+</button></div></div>`).join('');
            const diffs = [['story', 'Story', 'Forgiving damage for exploring the narrative.'], ['tactical', 'Tactical', 'The intended balance.'], ['blackout', 'Blackout', 'Enemies hit hard; armor matters.']];
            const primers = Object.entries(SD.ABILITIES.primer);
            const name = c.name ? esc(c.name) : '';
            this.open('creator', `
                <div class="ow-head"><span class="ow-kicker">NEW OPERATIVE · SLOT ${c.slot + 1}</span><h2>Who walks into the Basin?</h2></div>
                <label class="ow-field">CALLSIGN<input data-act="cname" maxlength="16" placeholder="MERCER" value="${name}"></label>
                <div class="ow-sub">ATTRIBUTES <span class="ow-gold">${c.points} point${c.points === 1 ? '' : 's'} left</span></div>
                <div class="ow-attrs">${attrRows}</div>
                <div class="ow-two">
                  <div><div class="ow-sub">STARTING PRIMER</div><div class="ow-chips">${primers.map(([id, p]) => `<button class="ow-chip ${c.primer === id ? 'on' : ''}" data-act="primer" data-v="${id}" title="${esc(p.desc)}"><b>${p.name}</b><small>${p.desc}</small></button>`).join('')}</div></div>
                  <div><div class="ow-sub">DIFFICULTY</div><div class="ow-chips">${diffs.map(([id, n, d]) => `<button class="ow-chip ${c.difficulty === id ? 'on' : ''}" data-act="diff" data-v="${id}"><b>${n}</b><small>${d}</small></button>`).join('')}</div></div>
                </div>
                <div class="ow-row ow-end"><button class="ow-btn ow-ghost" data-act="backSlots">BACK</button><button class="ow-btn ow-primary" data-act="begin">BEGIN OPERATION →</button></div>`);
            const inp = this.panel.querySelector('input[data-act="cname"]');
            if (inp && document.activeElement !== inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
        },

        /* ================================================== dialogue */
        openDialogue(npcId) {
            const s = this.s;
            const node = BO.OWRPGDialogue.entry(s, npcId);
            if (!node) return;
            this.dlg = { npc: npcId, node };
            this.M.setFlag('met_' + npcId, true);
            this._renderDialogue();
        },

        _renderDialogue() {
            const v = BO.OWRPGDialogue.view(this.s, this.dlg.npc, this.dlg.node);
            if (!v) { this._endDialogue(); return; }
            const fac = BO.OWRPGWorldData.NPCS.find((n) => n.id === this.dlg.npc)?.faction;
            const F = fac && BO.OWRPGFactionsData.FACTIONS[fac];
            this.dlg.choices = v.choices;
            const choices = v.choices.map((c, k) => `<button class="ow-choice ${c.ok ? '' : 'locked'}" data-act="choose" data-v="${k}" ${c.ok ? '' : 'disabled'}>
                <kbd>${k + 1}</kbd>${c.badge ? `<span class="ow-badge" style="--c:${ATTR_COL[c.badge] || '#cbd5e1'}">${c.ok ? 'PASS' : 'NEED ' + esc(c.reason)}</span>` : ''}<span>${esc(c.text)}</span></button>`).join('');
            this.open('dialogue', `
                <div class="ow-speaker" style="--c:${F ? F.color : '#f5a623'}"><b>${esc(v.speaker)}</b>${F ? `<small>${F.name} · ${BO.OWRPGFactions.tier(this.s, fac).name}</small>` : ''}</div>
                <p class="ow-line">${esc(v.text)}</p>
                <div class="ow-choices">${choices}</div>`);
        },

        _chooseDialogue(k) {
            const c = this.dlg && this.dlg.choices[k];
            if (!c || !c.ok) return;
            const next = BO.OWRPGDialogue.choose(this.s, this.dlg.npc, this.dlg.node, c.i);
            if (next === 'END') { this._endDialogue(); return; }
            this.dlg.node = next;
            this._renderDialogue();
        },

        _endDialogue() {
            this.dlg = null;
            this.close(true);
            this.M.refreshLoadout();
            if (this.M.pendingVendor) { const v = this.M.pendingVendor; this.M.pendingVendor = null; this.openVendor(v); }
        },

        /* ================================================== vendor / stash / travel */
        openVendor(id) {
            const s = this.s, I = BO.OWRPGInventory;
            const V = BO.OWRPGFactionsData.VENDORS[id];
            this.vendorId = id;
            if (!BO.OWRPGFactions.canTrade(s, id)) { this.M.toast(`${V.name} refuses to trade with you.`, '#f97316'); return; }
            const disc = BO.OWRPGFactions.vendorDiscount(s, V.faction);
            const stock = V.stock.map((itemId) => {
                const d = I.def(itemId), price = I.buyPrice(s, id, itemId);
                const req = d.req ? `<small class="${I.meetsReq(s, itemId) ? '' : 'ow-bad'}">Req ${d.req[0]} ${d.req[1]}</small>` : '';
                return `<div class="ow-item"><div><b style="color:${BO.OWRPGStatsData.RARITY[d.rarity || 'common'].color}">${esc(d.name)}</b><small>${d.type} · ${d.weight} kg</small>${req}</div>
                    <button class="ow-btn" data-act="buy" data-v="${itemId}" ${s.player.credits < price ? 'disabled' : ''}>${price} cr</button></div>`;
            }).join('');
            const mine = s.player.inventory.filter((e) => I.def(e.id).type !== 'quest').map((e) => `
                <div class="ow-item"><div><b style="color:${I.rarityColor(e)}">${esc(I.displayName(e))}</b><small>${Object.values(s.player.equipped).includes(e.uid) ? 'EQUIPPED' : I.def(e.id).type}</small></div>
                <button class="ow-btn ow-ghost" data-act="sell" data-v="${e.uid}">+${I.sellPrice(s, Object.assign({}, e, { n: 1 }))} cr</button></div>`).join('') || '<div class="ow-empty">Nothing to sell.</div>';
            this.open('vendor', `
                <div class="ow-head"><span class="ow-kicker">${esc(BO.OWRPGFactionsData.FACTIONS[V.faction].name)} · ${disc ? Math.round(disc * 100) + '% reputation discount' : 'standard prices'}</span><h2>${esc(V.name)}</h2>
                <p class="ow-dim">Credits: <b class="ow-gold">${s.player.credits}</b> · Relay Cells: ${s.player.relayCells} · Carry ${BO.OWRPGInventory.weight(s).toFixed(1)} / ${BO.OWRPGCharacter.derived(s).maxWeight} kg</p></div>
                <div class="ow-two"><div><div class="ow-sub">FOR SALE</div><div class="ow-list">${stock}</div></div><div><div class="ow-sub">YOUR PACK</div><div class="ow-list">${mine}</div></div></div>
                <div class="ow-row ow-end"><button class="ow-btn ow-primary" data-act="close">DONE</button></div>`);
        },

        openStash() {
            const s = this.s, I = BO.OWRPGInventory;
            const row = (e, act, label) => `<div class="ow-item"><div><b style="color:${I.rarityColor(e)}">${esc(I.displayName(e))}</b><small>${I.entryWeight(e).toFixed(1)} kg</small></div><button class="ow-btn ow-ghost" data-act="${act}" data-v="${e.uid}">${label}</button></div>`;
            const inv = s.player.inventory.filter((e) => I.def(e.id).type !== 'quest' && !Object.values(s.player.equipped).includes(e.uid)).map((e) => row(e, 'stashIn', 'STORE →')).join('') || '<div class="ow-empty">Nothing to store.</div>';
            const st = s.player.stash.map((e) => row(e, 'stashOut', '← TAKE')).join('') || '<div class="ow-empty">Stash is empty.</div>';
            this.open('vendor', `<div class="ow-head"><span class="ow-kicker">FREESTEAD</span><h2>Personal Stash</h2><p class="ow-dim">Stored items weigh nothing. Carry ${I.weight(s).toFixed(1)} / ${BO.OWRPGCharacter.derived(s).maxWeight} kg</p></div>
                <div class="ow-two"><div><div class="ow-sub">PACK</div><div class="ow-list">${inv}</div></div><div><div class="ow-sub">STASH</div><div class="ow-list">${st}</div></div></div>
                <div class="ow-row ow-end"><button class="ow-btn ow-primary" data-act="close">DONE</button></div>`);
        },

        openTravel(fromId) {
            const s = this.s;
            const rows = BO.OWRPGWorldData.PYLONS.map((p) => {
                const on = s.pylons[p.id];
                return `<div class="ow-item"><div><b>${esc(p.name)}</b><small>${BO.OWRPGWorldData.REGIONS.find((r) => r.id === p.region).name}${on ? '' : ' · offline'}</small></div>
                    ${p.id === fromId ? '<span class="ow-dim">YOU ARE HERE</span>' : `<button class="ow-btn" data-act="travel" data-v="${p.id}" ${on && s.player.relayCells > 0 ? '' : 'disabled'}>JUMP · 1 CELL</button>`}</div>`;
            }).join('');
            this.open('vendor', `<div class="ow-head"><span class="ow-kicker">TRANSIT NETWORK</span><h2>Pylon Jump</h2><p class="ow-dim">Relay Cells: <b class="ow-gold">${s.player.relayCells}</b>. Wake new pylons by touching their coils.</p></div>
                <div class="ow-list">${rows}</div><div class="ow-row ow-end"><button class="ow-btn ow-primary" data-act="close">CANCEL</button></div>`);
        },

        showDeath() {
            this.deathOpen = true;
            this.open('death', `<div class="ow-head ow-center"><span class="ow-kicker" style="color:#ef4444">K.I.A.</span><h2>You died in the Expanse</h2>
                <p class="ow-dim">Last save: ${esc(this.M.lastSaveLabel || 'none')}</p></div>
                <div class="ow-row ow-center"><button class="ow-btn ow-primary" data-act="deathLoad">LOAD LAST SAVE</button>
                <button class="ow-btn" data-act="deathRespawn">WAKE IN FREESTEAD (−15% CREDITS)</button><button class="ow-btn ow-ghost" data-act="deathMenu">MAIN MENU</button></div>`, { closable: false });
        },

        openPipPad(tab, respec) { if (BO.OWRPGPipPad) BO.OWRPGPipPad.open(tab, respec); },
        toggleDev() { if (BO.OWRPGPipPad) BO.OWRPGPipPad.open('dev'); },

        /* ================================================== HUD */
        showHud() { this.init(); this.hud.classList.remove('hidden'); this._last = {}; },

        _set(id, val, prop = 'textContent') {
            if (this._last[id + prop] === val) return;
            this._last[id + prop] = val;
            const el = this.root.querySelector('#' + id);
            if (el) el[prop] = val;
        },

        updateHud() {
            if (!this.root || !this.M.active || !this.s) return;
            const s = this.s, p = s.player, C = BO.OWRPGCharacter;
            const need = C.xpToNext(s);
            this._set('ow-lvl', 'LV ' + p.level);
            this._set('ow-xpnum', p.level >= BO.OWRPGStatsData.LEVEL_CAP ? 'MAX' : `${p.xp} / ${need} XP${p.perkPoints || p.attrPoints ? ' · ★' : ''}`);
            this._set('ow-xpfill', `width:${Math.min(100, (p.xp / need) * 100).toFixed(1)}%`, 'style');
            const enc = C.encumbrance(s);
            this._set('ow-cr', `◈ ${p.credits} cr`);
            this._set('ow-cells', `⚡ ${p.relayCells}`);
            this._set('ow-enc', `${enc.weight.toFixed(0)}/${enc.max} kg · ${enc.label}`);
            this._set('ow-clock', `${BO.OWRPGWorldSim.timeLabel()} · ${(BO.OWRPGWorldSim.region || {}).name || ''}`);
            // Tracked quest.
            const tracked = s.worldFlags.trackedQuest && s.quests[s.worldFlags.trackedQuest]?.state === 'active' ? s.worldFlags.trackedQuest
                : Object.keys(s.quests).find((id) => s.quests[id].state === 'active');
            this._set('ow-quest', tracked ? `<b>${esc(BO.OWRPGQuests.def(tracked).name)}</b><span>${esc(BO.OWRPGQuests.objective(s, tracked))}</span>` : '<b>No active quest</b><span>Talk to the people of Freestead.</span>', 'innerHTML');
            // Stealth eye.
            const aw = BO.OWRPGAI.awareness();
            const lbl = aw > 1 ? 'COMBAT' : aw >= 0.35 ? 'SUSPICIOUS' : this.M.camoT > 0 ? 'CLOAKED' : 'HIDDEN';
            this._set('ow-eye-label', lbl);
            this._set('ow-eye', 'ow-eye ow-eye-' + lbl.toLowerCase(), 'className');
            this._set('ow-camo', this.M.camoT > 0 ? 'ow-camo' : 'ow-camo hidden', 'className');
            // Prompt.
            const pr = this.M.prompt;
            const key = (BO.Settings.getKeybinds().interact || 'KeyE').replace('Key', '');
            this._set('ow-prompt', pr ? `<kbd>${key}</kbd> ${esc(pr.text)}` : '', 'innerHTML');
            this._set('ow-prompt', pr ? 'ow-prompt' : 'ow-prompt hidden', 'className');
            // Abilities.
            const kb = BO.Settings.getKeybinds();
            const cd = BO.OWRPGCombat.cd;
            const A = BO.OWRPGStatsData.ABILITIES;
            const meds = BO.OWRPGInventory.count(s, 'medkit');
            const slot = (k, name, t, extra = '') => `<div class="ow-ab ${t > 0 ? 'cd' : ''}"><kbd>${k}</kbd><b>${name}</b>${t > 0 ? `<i>${Math.ceil(t)}</i>` : ''}${extra}</div>`;
            const kn = (c) => (c || '').replace('Key', '').replace('Digit', '');
            this._set('ow-abilities',
                slot(kn(kb.owAbility1), A.primer[p.abilities.primer].name, cd.primer, BO.OWRPGCombat.primerCharges > 0 && cd.primer > 0 ? '<em>+1</em>' : '') +
                slot(kn(kb.owAbility2), A.detonator[p.abilities.detonator].name, cd.detonator) +
                slot(kn(kb.owGadget), A.gadget[p.abilities.gadget].name, cd.gadget) +
                slot(kn(kb.owMed), `Med ×${meds}`, 0), 'innerHTML');
            this._set('ow-compass', this._compassHtml(tracked), 'innerHTML');
            this._updateFloats();
        },

        /** Pins (and, if enabled, the tracked quest) as bearings on a ±70° strip under the compass. */
        _compassHtml(tracked) {
            const s = this.s, P = BO.Player, D = BO.OWRPGWorldData;
            if (D.isInterior(P.pos.x, P.pos.z)) return '';
            const marks = s.pins.map((p) => ({ x: p[0], z: p[1], c: '#f472b6', g: '✚' }));
            if (s.worldFlags.compassQuest && tracked) {
                const m = BO.OWRPGQuests.markers(s).find((k) => k.quest === tracked);
                const poi = m && D.POIS.find((p) => p.id === m.poi);
                if (poi && !poi.interior) marks.push({ x: poi.x, z: poi.z, c: '#a3e635', g: '◆' });
            }
            const fwd = Math.atan2(-Math.sin(P.yaw), -Math.cos(P.yaw));
            return marks.map((m) => {
                const ang = BO.Math.wrapAngle(Math.atan2(m.x - P.pos.x, m.z - P.pos.z) - fwd);
                const deg = -ang * 180 / Math.PI;
                if (Math.abs(deg) > 70) return '';
                const dist = Math.round(Math.hypot(m.x - P.pos.x, m.z - P.pos.z));
                return `<i style="left:${50 + (deg / 70) * 50}%;color:${m.c}" title="${dist} m">${m.g}</i>`;
            }).join('');
        },

        xpPop(n, label) {
            if (!this.root) return;
            const el = document.createElement('div');
            el.className = 'ow-pop';
            el.textContent = `+${n} XP${label ? ' · ' + label : ''}`;
            this.root.querySelector('#ow-pops').appendChild(el);
            setTimeout(() => el.remove(), 2200);
        },

        lootToast(loot, source) {
            const parts = loot.items.map((it) => `${BO.OWRPGStatsData.ITEMS[it.id].name}${it.n > 1 ? ' ×' + it.n : ''}`);
            if (loot.credits) parts.unshift(loot.credits + ' cr');
            BO.Events.emit('hud:toast', { text: parts.length ? `${source}: ${parts.join(', ')}` : `${source}: empty`, color: '#fbbf24' });
        },

        floatDamage(agent, dmg, crit, kind) {
            if (!this.root || this.floats.length > 24) return;
            const el = document.createElement('div');
            const col = { burn: '#f97316', chill: '#38bdf8', shock: '#facc15', expose: '#f472b6', sneak: '#a3e635' }[kind] || (crit ? '#fde047' : '#f8fafc');
            el.className = 'ow-float' + (crit ? ' crit' : '');
            el.style.color = col;
            el.textContent = Math.round(dmg) + (kind === 'sneak' ? ' SNEAK' : '');
            this.root.querySelector('#ow-floats').appendChild(el);
            this.floats.push({ el, pos: agent.ent.pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.6, 2 + Math.random() * 0.4, 0)), t: 0.9 });
        },

        _updateFloats() {
            const cam = this.M.camera;
            const w = window.innerWidth, h = window.innerHeight;
            for (let i = this.floats.length - 1; i >= 0; i--) {
                const f = this.floats[i];
                f.t -= 1 / 60;
                f.pos.y += 0.02;
                _v.copy(f.pos).project(cam);
                if (f.t <= 0 || _v.z > 1) { f.el.remove(); this.floats.splice(i, 1); continue; }
                f.el.style.transform = `translate(${((_v.x + 1) / 2) * w}px, ${((1 - _v.y) / 2) * h}px)`;
                f.el.style.opacity = Math.min(1, f.t * 2.5);
            }
        }
    };

    BO.OWRPGUI = UI;
})(window.BO);
