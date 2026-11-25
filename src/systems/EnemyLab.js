/* ============================================================================
   BLACKOUT OPS — Enemy Lab (BO.EnemyLab)
   One editor for Zombies, Tower Defense and Survival:
   · STATS     health, speed and damage per zombie type, as a % of normal
   · START     the round (Survival: day) a type starts appearing. A start round
               lets a type in even before normal progression would unlock it,
               and keeps it out until then.
   · SPAWN %   chance weight per type, and per category (easy, normal, hard,
               boss). 100% is normal; 0% never spawns; 300% three times as often.
   · SETUPS    save, load, overwrite and delete named setups per mode.
   Settings live in localStorage and apply to every match of that mode.
============================================================================ */
(function (BO) {
    'use strict';
    const KEY = 'bo_enemy_lab/v1';
    const MODES = { zombies: 'Zombies', td: 'Tower Defense', survival: 'Survival' };
    const CATS = [['easy', 'Easy'], ['normal', 'Normal'], ['hard', 'Hard'], ['boss', 'Boss']];
    const BASE_CAT = { easy: 50, normal: 25, hard: 15 };
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const blank = () => ({ stats: {}, start: {}, weight: {}, cat: {} });

    const Lab = {
        MODES,
        CATS,

        /* ------------------------------------------------ storage */
        all() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (_) { return {}; } },
        write(all) { try { localStorage.setItem(KEY, JSON.stringify(all)); return true; } catch (_) { return false; } },
        slot(mode) { const a = this.all(); const s = a[mode] || {}; return { current: { ...blank(), ...(s.current || {}) }, presets: Array.isArray(s.presets) ? s.presets : [] }; },
        get(mode) { return this.slot(mode).current; },
        set(mode, cfg) { const a = this.all(); a[mode] = { ...(a[mode] || {}), current: cfg }; this.write(a); this._cache = null; },
        presets(mode) { return this.slot(mode).presets; },
        savePreset(mode, name) {
            const clean = String(name || '').trim().slice(0, 32) || 'Setup ' + (this.presets(mode).length + 1);
            const a = this.all(); const s = a[mode] || {}; const list = Array.isArray(s.presets) ? s.presets : [];
            const cfg = JSON.parse(JSON.stringify(this.get(mode)));
            const ex = list.find((p) => p.name.toLowerCase() === clean.toLowerCase());
            if (ex) { ex.cfg = cfg; ex.at = Date.now(); } else list.unshift({ id: 'el_' + Date.now().toString(36), name: clean, cfg, at: Date.now() });
            a[mode] = { ...s, presets: list.slice(0, 30), current: s.current || cfg };
            this.write(a);
            return clean;
        },
        loadPreset(mode, id) { const p = this.presets(mode).find((x) => x.id === id); if (p) this.set(mode, { ...blank(), ...JSON.parse(JSON.stringify(p.cfg)) }); return !!p; },
        deletePreset(mode, id) { const a = this.all(); const s = a[mode]; if (!s?.presets) return; s.presets = s.presets.filter((p) => p.id !== id); this.write(a); },
        isDefault(cfg) { return !Object.keys(cfg.stats).length && !Object.keys(cfg.start).length && !Object.keys(cfg.weight).length && !Object.keys(cfg.cat).length; },
        count(cfg) { return new Set([...Object.keys(cfg.stats), ...Object.keys(cfg.start), ...Object.keys(cfg.weight)]).size + Object.keys(cfg.cat).length; },

        /** Cached config for the match in progress (re-read when the editor saves). */
        live(mode) {
            if (!this._cache || this._cache.mode !== mode) this._cache = { mode, cfg: this.get(mode) };
            return this._cache.cfg;
        },

        /* ------------------------------------------------ roster */
        catOf(spec) { return spec?.isBoss ? 'boss' : (spec?.rarity || 'normal'); },
        roster(mode) {
            const Z = BO.ZombiesData;
            if (mode === 'survival') return (BO.Zone?.bestiary?.() || []).slice();
            return [...(Z?.ORDERED_PROGRESSION || []), ...(Z?.ORDERED_BOSSES || [])];
        },

        /* ------------------------------------------------ spawning */
        /**
         * Pick an enemy for this round. `unlocked`/`bosses` are what normal progression allows; the lab adds
         * types whose start round has arrived, removes types whose start round has not, and weights the rest.
         * Returns null when the lab has nothing to say (caller keeps its own pick).
         */
        pick(mode, round, unlocked, bosses, disabledSet, bossPct = 0) {
            const cfg = this.live(mode);
            if (this.isDefault(cfg)) return null;
            const off = (e) => disabledSet && disabledSet.has(e.id);
            const startOf = (e) => Number.isFinite(cfg.start[e.id]) ? cfg.start[e.id] : null;
            const allowed = new Map();
            for (const e of [...(unlocked || []), ...(bosses || [])]) if (!off(e) && (startOf(e) == null || round >= startOf(e))) allowed.set(e.id, e);
            for (const e of this.roster(mode)) if (!off(e) && startOf(e) != null && round >= startOf(e)) allowed.set(e.id, e);
            const list = [...allowed.values()];
            if (!list.length) return null;
            const catBase = { ...BASE_CAT, boss: Math.max(0, bossPct) };
            const buckets = {};
            for (const e of list) {
                const w = (cfg.weight[e.id] ?? 100) / 100;
                if (w <= 0) continue;
                const c = this.catOf(e);
                (buckets[c] = buckets[c] || { items: [], w: 0 }).items.push([e, w]);
            }
            const entries = Object.entries(buckets).map(([c, b]) => [c, b, (catBase[c] ?? 20) * ((cfg.cat[c] ?? 100) / 100)]).filter(([, , w]) => w > 0);
            if (!entries.length) return null;
            let roll = Math.random() * entries.reduce((s, [, , w]) => s + w, 0);
            let bucket = entries[entries.length - 1][1];
            for (const [, b, w] of entries) { roll -= w; if (roll <= 0) { bucket = b; break; } }
            let r2 = Math.random() * bucket.items.reduce((s, [, w]) => s + w, 0);
            for (const [e, w] of bucket.items) { r2 -= w; if (r2 <= 0) return e; }
            return bucket.items[bucket.items.length - 1][0];
        },

        /** Applies stat % to a freshly built zombie of the active mode. */
        applyStats(entity) {
            const mode = BO.State?.activeMode;
            if (!MODES[mode] || !entity?.spec) return;
            const s = this.live(mode).stats[entity.spec.id];
            if (!s) return;
            if (s.hp != null && s.hp !== 100) { entity.maxHp = Math.max(1, Math.round(entity.maxHp * s.hp / 100)); entity.hp = entity.maxHp; }
            if (s.speed != null && s.speed !== 100) entity.speed *= s.speed / 100;
            if (s.damage != null && s.damage !== 100) entity.damage = Math.max(0, Math.round(entity.damage * s.damage / 100));
            entity.labTuned = true;
        },

        /* ------------------------------------------------ editor */
        open(mode, onClose) {
            if (!MODES[mode]) return;
            this.mode = mode;
            this.onClose = onClose;
            this.q = '';
            this.catFilter = 'all';
            if (!this.dlg) {
                const d = document.createElement('dialog');
                d.id = 'enemy-lab';
                d.className = 'elab';
                d.addEventListener('click', (e) => this.click(e));
                d.addEventListener('change', (e) => this.change(e));
                d.addEventListener('input', (e) => { if (e.target.matches('[data-el-search]')) { this.q = e.target.value; this.renderRows(); } });
                d.addEventListener('cancel', (e) => { e.preventDefault(); this.close(); });
                document.body.appendChild(d);
                this.dlg = d;
            }
            this.render();
            if (!this.dlg.open) this.dlg.showModal();
            if (document.pointerLockElement) document.exitPointerLock();
        },

        close() {
            if (this.dlg?.open) this.dlg.close();
            this._cache = null;
            this.onClose?.();
        },

        roundWord() { return this.mode === 'survival' ? 'day' : this.mode === 'td' ? 'wave' : 'round'; },

        render() {
            const mode = this.mode;
            const cfg = this.get(mode);
            const W = this.roundWord();
            const presets = this.presets(mode);
            this.dlg.innerHTML = `<div class="elab-box">
                <header class="elab-head"><div><span class="elab-kick">${esc(MODES[mode])} · Enemy Lab</span><h2>Zombie stats, start ${W}s &amp; spawn chances</h2></div>
                    <button class="elab-x" data-el="close" title="Close (Esc)">✕</button></header>
                <section class="elab-top">
                    <div class="elab-card"><h4>Category spawn chance</h4><div class="elab-cats">${CATS.map(([c, label]) => `<label><span>${label}</span><input type="number" min="0" max="1000" step="10" value="${cfg.cat[c] ?? 100}" data-el-cat="${c}"><em>%</em></label>`).join('')}</div>
                        <p class="elab-note">100% is normal. 0% removes the whole category, 200% doubles it. ${mode === 'survival' ? 'Survival has no boss category here; its bosses have their own lairs.' : 'Boss chance multiplies the match\'s boss spawn rate.'}</p></div>
                    <div class="elab-card"><h4>Saved setups</h4>
                        <div class="elab-save"><input type="text" maxlength="32" placeholder="Setup name…" data-el-name><button data-el="save">Save setup</button></div>
                        <div class="elab-presets">${presets.length ? presets.map((p) => `<span class="elab-pill"><button data-el="load" data-id="${esc(p.id)}" title="Load this setup">${esc(p.name)} <em>${this.count({ ...blank(), ...p.cfg })}</em></button><button class="del" data-el="del" data-id="${esc(p.id)}" title="Delete">×</button></span>`).join('') : '<span class="elab-note">No saved setups yet. Tune zombies below, name the setup and save it.</span>'}</div>
                        <p class="elab-flash" data-el-flash>${esc(this.flash || '')}</p></div>
                </section>
                <section class="elab-tools"><input type="search" placeholder="Search zombies…" data-el-search value="${esc(this.q)}">
                    <div class="elab-filt">${[['all', 'All'], ...CATS].filter(([c]) => mode !== 'survival' || c !== 'boss').map(([c, l]) => `<button class="${this.catFilter === c ? 'on' : ''}" data-el="filt" data-id="${c}">${l}</button>`).join('')}</div>
                    <span class="elab-sum">${this.isDefault(cfg) ? 'All normal' : this.count(cfg) + ' changes'}</span>
                    <button class="ghost" data-el="resetAll">Reset all to normal</button></section>
                <div class="elab-table"><div class="elab-row elab-th"><span>Zombie</span><span>Health %</span><span>Speed %</span><span>Damage %</span><span>Starts ${W}</span><span>Spawn %</span><span></span></div><div data-el-rows></div></div>
                <footer class="elab-foot"><span>Changes save as you type and apply to every new ${esc(MODES[mode])} match${mode === 'survival' ? ' and to spawns in a running one' : ''}. Leave a box empty for normal.</span><button data-el="close">Done</button></footer>
            </div>`;
            this.renderRows();
        },

        renderRows() {
            const host = this.dlg?.querySelector('[data-el-rows]');
            if (!host) return;
            const mode = this.mode;
            const cfg = this.get(mode);
            const q = this.q.trim().toLowerCase();
            const list = this.roster(mode).filter((e) => (this.catFilter === 'all' || this.catOf(e) === this.catFilter) && (!q || (e.name + ' ' + e.id + ' ' + (e.habit || '')).toLowerCase().includes(q)));
            const num = (id, f, v, ph, step = 10) => `<input type="number" min="0" max="${f === 'start' ? 999 : 2000}" step="${step}" data-el-f="${f}" data-id="${esc(id)}" value="${v ?? ''}" placeholder="${ph}">`;
            host.innerHTML = list.map((e) => {
                const s = cfg.stats[e.id] || {};
                const changed = cfg.stats[e.id] || cfg.start[e.id] != null || cfg.weight[e.id] != null;
                const base = `${Math.round(e.hp || 0)} HP · ${(e.speed || 0).toFixed?.(1) ?? e.speed} spd · ${Math.round(e.attack || 0)} dmg`;
                const unlock = e.isBoss ? (e.bossRound ? 'boss from round ' + e.bossRound : 'boss') : '';
                return `<div class="elab-row ${changed ? 'changed' : ''}"><span class="nm"><b>${esc(e.name || e.id)}</b><small><i class="cat cat-${this.catOf(e)}">${this.catOf(e)}</i> ${esc(base)}${unlock ? ' · ' + esc(unlock) : ''}</small></span>
                    ${num(e.id, 'hp', s.hp, '100')}${num(e.id, 'speed', s.speed, '100')}${num(e.id, 'damage', s.damage, '100')}${num(e.id, 'start', cfg.start[e.id], 'auto', 1)}${num(e.id, 'weight', cfg.weight[e.id], '100')}
                    <button class="ghost sm" data-el="resetRow" data-id="${esc(e.id)}" ${changed ? '' : 'disabled'} title="Back to normal">Reset</button></div>`;
            }).join('') || '<p class="elab-note" style="padding:12px">No zombie matches.</p>';
        },

        change(e) {
            const t = e.target;
            const mode = this.mode;
            const cfg = this.get(mode);
            if (t.matches('[data-el-cat]')) {
                const v = t.value === '' ? null : Math.max(0, Number(t.value));
                if (v == null || v === 100) delete cfg.cat[t.dataset.elCat]; else cfg.cat[t.dataset.elCat] = v;
            } else if (t.matches('[data-el-f]')) {
                const id = t.dataset.id, f = t.dataset.elF;
                const v = t.value === '' ? null : Math.max(f === 'start' ? 1 : 0, Math.round(Number(t.value)));
                if (f === 'start') { if (v == null) delete cfg.start[id]; else cfg.start[id] = v; }
                else if (f === 'weight') { if (v == null || v === 100) delete cfg.weight[id]; else cfg.weight[id] = v; }
                else {
                    const s = { ...(cfg.stats[id] || {}) };
                    if (v == null || v === 100) delete s[f]; else s[f] = v;
                    if (Object.keys(s).length) cfg.stats[id] = s; else delete cfg.stats[id];
                }
            } else return;
            this.set(mode, cfg);
            const sum = this.dlg.querySelector('.elab-sum');
            if (sum) sum.textContent = this.isDefault(cfg) ? 'All normal' : this.count(cfg) + ' changes';
            const row = t.closest('.elab-row');
            if (row && t.matches('[data-el-f]')) {
                const id = t.dataset.id;
                const changed = !!(cfg.stats[id] || cfg.start[id] != null || cfg.weight[id] != null);
                row.classList.toggle('changed', changed);
                const rb = row.querySelector('[data-el="resetRow"]'); if (rb) rb.disabled = !changed;
            }
        },

        click(e) {
            const b = e.target.closest('[data-el]');
            if (!b) { if (e.target === this.dlg) this.close(); return; }
            const mode = this.mode;
            const cmd = b.dataset.el, id = b.dataset.id;
            if (cmd === 'close') return this.close();
            if (cmd === 'filt') { this.catFilter = id; this.render(); return; }
            if (cmd === 'resetRow') { const cfg = this.get(mode); delete cfg.stats[id]; delete cfg.start[id]; delete cfg.weight[id]; this.set(mode, cfg); this.render(); return; }
            if (cmd === 'resetAll') { if (!window.confirm('Put every ' + MODES[mode] + ' zombie back to normal stats, start rounds and spawn chances? Saved setups are kept.')) return; this.set(mode, blank()); this.flash = 'Reset to normal.'; this.render(); return; }
            if (cmd === 'save') { const name = this.dlg.querySelector('[data-el-name]')?.value; const n = this.savePreset(mode, name); this.flash = '✓ Saved “' + n + '”'; this.render(); return; }
            if (cmd === 'load') { this.loadPreset(mode, id); this.flash = '✓ Loaded “' + (this.presets(mode).find((p) => p.id === id)?.name || '') + '”'; this.render(); return; }
            if (cmd === 'del') { const p = this.presets(mode).find((x) => x.id === id); if (p && window.confirm('Delete the setup “' + p.name + '”?')) { this.deletePreset(mode, id); this.flash = 'Deleted “' + p.name + '”.'; this.render(); } }
        }
    };

    BO.EnemyLab = Lab;

    // Every zombie built while a lab setup is active gets its stat % applied.
    if (BO.ZombieEntity && !BO.ZombieEntity._lab) {
        const Base = BO.ZombieEntity;
        class LabZombie extends Base {
            constructor(...args) {
                super(...args);
                try { Lab.applyStats(this); } catch (err) { console.error('[EnemyLab]', err); }
            }
        }
        LabZombie._lab = true;
        BO.ZombieEntity = LabZombie;
    }
})(window.BO);
