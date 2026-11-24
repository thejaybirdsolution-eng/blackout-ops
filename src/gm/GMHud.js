/* ============================================================================
   BLACKOUT OPS — Survival 1.0: HUD, game feel and house rules
   · STATUS STRIP: every status effect from the GM registry as a coloured icon
     with a fill ring for timed effects, right of your vitals.
   · CONTEXT CHIPS: hot loot value, body bag timer, vehicle fuel, boss hints,
     alarms and brownouts, under the top bar.
   · DIEGETIC LAYER: frost creeping in from the screen edges when cold, a red
     pulse when bleeding, rain streaks when wet, heat shimmer, radiation grain,
     and a swim-stamina bar.
   · MAP: claimed ground, lures, body bags, outposts, vehicles, lairs and home.
   · BASE SCREEN: haul ledger and territory/threat ladder cards.
   · HOUSE RULES: sandbox cheats make a run Unranked (no commendations, no
     career XP); retired rune/flask/infusion modifiers are removed.
============================================================================ */
(function (BO) {
    'use strict';
    const GM = BO.GM;
    const UNRANKED = ['sv_free_craft', 'sv_unlimited_tech', 'sv_max_level', 'sv_all_unlocks', 'sv_unlimited_backpack', 'sv_master_map', 'sv_master_box', 'sv_god_mode', 'sv_infinite_ammo', 'sv_one_hit', 'sv_double_loot', 'sv_xp_boost', 'sv_no_wear', 'sv_passive_enemies'];

    /* ---------------------------------------------------------- retire dead modifiers (load time) */
    (function retireModifiers() {
        const R = BO.SurvivalRules;
        if (!R?.modifiers) return;
        for (const [id, mod] of Object.entries(R.modifiers)) {
            if (mod && (mod.group === 'grace' || /rune|flask|talisman|infusion|site of grace/i.test((mod.name || '') + ' ' + (mod.description || '')))) delete R.modifiers[id];
        }
        if (Array.isArray(R.categories)) R.categories = R.categories.filter((c) => c.id !== 'grace');
        for (const p of Object.values(R.presets || {})) if (p.settings?.modifiers) p.settings.modifiers = p.settings.modifiers.filter((id) => R.modifiers[id]);
        // Zone tier descriptions no longer promise thicker infected.
        const tiers = BO.SurvivalMeta?.ZONE_TIERS;
        if (Array.isArray(tiers)) for (const t of tiers) if (t.desc) t.desc = t.desc.replace(/Thicker infected packs/i, 'New behaviours arrive two days earlier').replace(/stronger guardians/i, 'smarter packs');
    })();

    const Hud = {
        rate: 6,

        start(mode) {
            this.mode = mode;
            this.unranked = UNRANKED.some((id) => mode.campaign.has(id));
            this.build();
            this.patchCareer();
            this.addBaseCards();
            if (this.unranked) setTimeout(() => GM.toast('Sandbox cheats are on: this expedition is UNRANKED (no commendations or career XP).', '#f59e0b'), 3500);
        },

        stop() {
            this.unpatchCareer();
            this.root?.remove();
            this.root = null;
            this.mode = null;
        },

        patchCareer() {
            const C = BO.SurvivalCareer;
            if (!C || !this.unranked) return;
            this._orig = { award: C.awardCommendations, tick: C.tick, bank: C.bankExtraction };
            C.awardCommendations = function () { return 0; };
            const tick = C.tick;
            C.tick = function (run, key, val) { return tick.call(this, run, key, val, 0); };
            C.bankExtraction = function () { return null; };
        },
        unpatchCareer() {
            const C = BO.SurvivalCareer;
            if (!this._orig || !C) return;
            C.awardCommendations = this._orig.award; C.tick = this._orig.tick; C.bankExtraction = this._orig.bank;
            this._orig = null;
        },

        /* ---------------------------------------------------------- DOM */
        build() {
            this.root?.remove();
            const el = document.createElement('div');
            el.className = 'gm-hud';
            el.innerHTML = `<div class="gm-fx gm-fx-frost"></div><div class="gm-fx gm-fx-bleed"></div><div class="gm-fx gm-fx-wet"></div><div class="gm-fx gm-fx-heat"></div><div class="gm-fx gm-fx-rad"></div>
                <div class="gm-status"></div><div class="gm-chips"></div><div class="gm-swim" hidden><span>BREATH</span><i><b></b></i></div>`;
            (document.getElementById('hud-layer') || document.body).append(el);
            this.root = el;
            this.el = {
                frost: el.querySelector('.gm-fx-frost'), bleed: el.querySelector('.gm-fx-bleed'), wet: el.querySelector('.gm-fx-wet'),
                heat: el.querySelector('.gm-fx-heat'), rad: el.querySelector('.gm-fx-rad'),
                status: el.querySelector('.gm-status'), chips: el.querySelector('.gm-chips'), swim: el.querySelector('.gm-swim'), swimBar: el.querySelector('.gm-swim b')
            };
            this.sig = {};
        },

        update() {
            const m = this.mode;
            if (!this.root) return;
            const show = m.active && BO.State.activeMode === 'survival' && !m.campaign?.has('sv_hide_hud');
            this.root.hidden = !show;
            if (!show) return;
            const c = m.campaign;
            const deep = c.deep;
            const t = deep?.temp ?? 20;
            const cold = t < 6 ? Math.min(1, (6 - t) / 12) : 0;
            const hot = t > 30 ? Math.min(1, (t - 30) / 8) : 0;
            const bleed = (deep?.bleeding || 0) > 0 ? 0.55 + Math.sin(m.clock * 5) * 0.25 : 0;
            const lowHp = BO.Player.hp / BO.Player.maxHp < 0.25 ? 0.35 : 0;
            const wet = Math.min(1, (BO.ZoneFrontier?.wet || 0) / 70);
            const rad = m.radiation > 30 ? Math.min(0.7, (m.radiation - 30) / 70) : 0;
            const reduced = BO.Settings?.get?.('reducedMotion');
            this.el.frost.style.opacity = cold.toFixed(2);
            this.el.bleed.style.opacity = Math.max(bleed, lowHp).toFixed(2);
            this.el.wet.style.opacity = (wet * 0.6).toFixed(2);
            this.el.heat.style.opacity = (hot * 0.7).toFixed(2);
            this.el.rad.style.opacity = rad.toFixed(2);
            this.root.classList.toggle('reduced', !!reduced);
            // Status strip.
            const list = GM.statusList().filter((s) => !(s.id === 'hidden' && GM.hasStatus('claimed')));
            const sHtml = list.map((s) => {
                const frac = s.left != null && s.total > 0 ? Math.max(0, Math.min(1, s.left / s.total)) : 1;
                return `<span class="gm-st ${s.bad ? 'bad' : 'good'}" style="--c:${s.color};--f:${(frac * 360).toFixed(0)}deg" data-tip-title="${GM.esc(s.name)}" data-tip="${GM.esc(s.tip + (s.label ? ' (' + s.label + ')' : ''))}"><i>${s.glyph}</i>${s.label && s.id === 'hotloot' ? `<em>${GM.esc(s.label)}</em>` : ''}</span>`;
            }).join('');
            if (this.sig.s !== sHtml) { this.el.status.innerHTML = sHtml; this.sig.s = sHtml; }
            // Chips.
            const chips = [];
            for (const id of GM.order) {
                const mod = GM.get(id);
                if (typeof mod.hudChips === 'function') { try { chips.push(...mod.hudChips()); } catch (err) { console.error('[GM:' + id + '] hudChips', err); } }
            }
            if (this.unranked) chips.push({ text: 'UNRANKED', cls: 'warn' });
            const cHtml = chips.slice(0, 5).map((ch) => `<span class="gm-chip ${ch.cls || ''}">${GM.esc(ch.text)}</span>`).join('');
            if (this.sig.c !== cHtml) { this.el.chips.innerHTML = cHtml; this.sig.c = cHtml; }
            // Swim bar.
            const swim = GM.get('threat')?.swimFraction?.();
            this.el.swim.hidden = swim == null || GM.get('gear')?.hasRebreather?.();
            if (swim != null) { this.el.swimBar.style.width = Math.round(swim * 100) + '%'; this.el.swim.classList.toggle('low', swim < 0.3); }
        },

        /* ---------------------------------------------------------- map */
        drawMap(ctx, sx, sz, ppm, hit, label) {
            if (!GM.active) return;
            const circles = [], pins = [];
            for (const id of GM.order) {
                const mod = GM.get(id);
                try {
                    if (typeof mod.mapCircles === 'function') circles.push(...mod.mapCircles());
                    if (typeof mod.mapPins === 'function') pins.push(...mod.mapPins());
                } catch (err) { console.error('[GM:' + id + '] map', err); }
            }
            for (const c of circles) {
                ctx.fillStyle = c.color; ctx.strokeStyle = c.stroke; ctx.lineWidth = 1.2;
                ctx.beginPath(); ctx.arc(sx(c.x), sz(c.z), Math.max(3, c.r * ppm), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            }
            ctx.textAlign = 'center';
            for (const p of pins) {
                const x = sx(p.x), y = sz(p.z);
                ctx.fillStyle = 'rgba(10,14,16,0.75)'; ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = p.color; ctx.font = '10px system-ui, sans-serif'; ctx.textBaseline = 'middle';
                ctx.fillText(p.glyph || '•', x, y + 0.5);
                ctx.textBaseline = 'alphabetic';
                hit?.(p.x, p.z, p.label, '', 10);
            }
        },

        /* ---------------------------------------------------------- Base cards for loot & threat */
        addBaseCards() {
            const L = GM.get('loot'), T = GM.get('threat');
            if (L && !L.baseCards) {
                L.baseCards = function (ui) {
                    const esc = GM.esc;
                    const last = this.lastHaul;
                    const hotRows = Object.entries(this.hot).map(([id, n]) => `<li><span>${esc(GM.itemName(id))}</span><em>×${n}</em></li>`).join('');
                    return [ui.section('Haul ledger', `<div class="gm-kv"><div><dt>Hot loot now</dt><dd>${this.hotValue()} value</dd></div><div><dt>Parked hot</dt><dd>${this.ledgerValue()}</dd></div><div><dt>Hauls</dt><dd>${this.lifetime.hauls}</dd></div><div><dt>Best haul</dt><dd>${this.lifetime.best}</dd></div></div>
                        ${last ? `<p>Last haul: <b>${last.value}</b> value, danger ×${last.danger.toFixed(2)}, +${last.xp} XP.</p>` : '<p class="gm-muted">Bring Hot loot home and put it in storage inside your base to secure a haul.</p>'}
                        ${hotRows ? `<ul class="gm-list">${hotRows}</ul>` : ''}<p class="gm-muted sm">This expedition: max danger ${this.expedition.maxThreat}${this.expedition.night ? ', out at night' : ''}, ${Math.round(this.expedition.far)} m from home.</p>`)];
                };
            }
            if (T && !T.baseCards) {
                T.baseCards = function (ui) {
                    const esc = GM.esc;
                    const states = {};
                    for (const pc of this.mode.campaign.placed) if (pc.alive && this.LIGHTS[pc.type]) states[pc.gmClaim || 'off'] = (states[pc.gmClaim || 'off'] || 0) + 1;
                    const ladder = this.ladderInfo().map((l) => `<li class="${l.unlocked ? 'gm-bad' : 'gm-muted'}"><span>Day ${l.day} · ${esc(l.name)}</span><em>${esc(l.text)}</em></li>`).join('');
                    return [ui.section('Territory', `<div class="gm-kv"><div><dt>Claimed</dt><dd>${Math.round(this.claimArea || 0)} / ${this.claimCap || 0} m²</dd></div><div><dt>Lights holding</dt><dd>${states.on || 0}</dd></div><div><dt>Out of fuel</dt><dd>${states.out || 0}</dd></div><div><dt>Unpowered</dt><dd>${states.unpowered || 0}</dd></div></div>
                        ${ui.bar((this.claimArea || 0) / Math.max(1, this.claimCap || 1), 'claim')}
                        <p class="gm-muted sm">Lights within 30 m of something you built stop roaming spawns. ${states.unanchored ? states.unanchored + ' light(s) are too far from your structures. ' : ''}${states.capped ? states.capped + ' light(s) exceed your bench tier\'s claim cap. ' : ''}Hordes ignore claims.</p>`),
                    ui.section('Behaviour ladder', `<ul class="gm-list">${ladder}</ul><p class="gm-muted sm">Enemies never get more health from the calendar. Each day brings a new behaviour instead (Zone Tiers bring them sooner).</p>`, 'Step ' + this.step)];
                };
            }
        }
    };

    GM.register('hud', Hud);
})(window.BO);
