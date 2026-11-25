/* ============================================================================
   BLACKOUT OPS — MINIGAMES: hub screen (menu)
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const esc = BO.MinigameLib.esc;

    const CATS = [
        { id: 'target', name: 'Target Practice', icon: '🎯', sub: '10 courses • 60 seconds each', accent: '#f59e0b', blurb: 'Ten scripted 60-second courses. Each plays the same way every time, so practise for the platinum.' },
        { id: 'boss', name: 'Boss Rush', icon: '💀', sub: 'Every boss • 3 max heals', accent: '#dc2626', blurb: 'Fight every boss in the game back to back. Bottomless ammo, no regen, three heals for the whole run.' },
        { id: 'mole', name: 'Whack-a-Mole', icon: '🐹', sub: '3 carnival booths', accent: '#22c55e', blurb: 'Shoot the moles! Three booths of rising chaos with gold moles, hard hats and bombs.' }
    ];

    const STAR_SVG = '<svg viewBox="0 0 24 24"><path d="M12 2.6l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>';

    function starsRow(n, total = 4, cls = '') {
        let h = `<span class="mgh-stars ${cls}">`;
        for (let i = 0; i < total; i++) h += `<i class="${i < n ? 'on s' + i : ''}">${STAR_SVG}</i>`;
        return h + '</span>';
    }

    const Hub = {
        el: null,

        init() {
            this.el = document.getElementById('screen-minigames');
        },

        _bestKey(def) {
            if (def.cat === 'boss') return [def.id, MG.hubOpts.variant, MG.hubOpts.difficulty];
            return [def.id];
        },

        _best(def) {
            const m = BO.Save.data.minigames;
            if (!m || !m.best) return null;
            if (def.cat === 'boss') return m.best[def.id + ':' + MG.hubOpts.variant + ':' + MG.hubOpts.difficulty] || null;
            return m.best[def.id] || null;
        },

        _catStars(cat) {
            let got = 0, max = 0;
            const m = (BO.Save.data.minigames && BO.Save.data.minigames.best) || {};
            for (const def of MG.list(cat)) {
                if (def.cat === 'boss') {
                    for (const v of Object.keys(def.variants)) {
                        max += 4;
                        let best = 0;
                        for (const d of Object.keys(def.difficulties)) best = Math.max(best, (m[def.id + ':' + v + ':' + d] || {}).stars || 0);
                        got += best;
                    }
                } else {
                    max += 4;
                    got += (m[def.id] || {}).stars || 0;
                }
            }
            return { got, max };
        },

        render() {
            if (!this.el) this.init();
            const cat = MG.hubCat || 'target';
            const list = MG.list(cat);
            if (!MG.hubSel[cat] || !MG.get(MG.hubSel[cat])) MG.hubSel[cat] = list[0] && list[0].id;
            const sel = MG.get(MG.hubSel[cat]);
            const totals = CATS.map((c) => this._catStars(c.id));
            const allGot = totals.reduce((a, t) => a + t.got, 0);
            const allMax = totals.reduce((a, t) => a + t.max, 0);
            const body = this.el.querySelector('#mgh-body');
            body.innerHTML = `
                <nav class="mgh-cats">
                    ${CATS.map((c, i) => `
                        <button class="mgh-cat ${c.id === cat ? 'active' : ''}" data-cat="${c.id}" style="--mc:${c.accent}">
                            <span class="mgh-cat-ico">${c.icon}</span>
                            <span class="mgh-cat-text"><b>${c.name}</b><small>${c.sub}</small></span>
                            <span class="mgh-cat-stars">${STAR_SVG}<em>${totals[i].got}/${totals[i].max}</em></span>
                        </button>`).join('')}
                    <div class="mgh-total">
                        <small>TOTAL STARS</small>
                        <div class="mgh-total-bar"><i style="width:${allMax ? (allGot / allMax * 100).toFixed(1) : 0}%"></i></div>
                        <b>${allGot} / ${allMax}</b>
                    </div>
                    <div class="mgh-howto">
                        <b>HOW IT WORKS</b>
                        <ul>
                            <li>Every target course is <b>scripted</b>. It plays the same way every time.</li>
                            <li>Chain hits for a <b>streak multiplier</b> up to x4. Misses and escaped targets break it.</li>
                            <li>Bronze, Silver, Gold and <b>Platinum</b> stars for every course.</li>
                            <li>Reserve ammo is unlimited in every minigame.</li>
                        </ul>
                    </div>
                </nav>
                <section class="mgh-list">
                    <div class="mgh-list-head"><span>${CATS.find((c) => c.id === cat).icon}</span><div><b>${CATS.find((c) => c.id === cat).name.toUpperCase()}</b><small>${esc(CATS.find((c) => c.id === cat).blurb)}</small></div></div>
                    <div class="mgh-grid mgh-grid-${cat}">
                        ${list.map((d, i) => this._card(d, i, d.id === (sel && sel.id))).join('')}
                    </div>
                </section>
                <aside class="mgh-detail" style="--mc:${sel ? sel.accent : '#f59e0b'}">${sel ? this._detail(sel) : ''}</aside>`;
            this._bind(body);
        },

        _card(def, i, active) {
            const best = def.cat === 'boss' ? null : this._best(def);
            const stars = best ? best.stars : 0;
            const num = def.cat === 'target' ? String(i + 1).padStart(2, '0') : '';
            return `
                <button class="mgh-card ${active ? 'active' : ''}" data-id="${def.id}" style="--mc:${def.accent}">
                    <div class="mgh-card-art">
                        <span class="mgh-card-ico">${def.icon}</span>
                        ${num ? `<span class="mgh-card-num">${num}</span>` : ''}
                        ${def.rail ? '<span class="mgh-tag">ON RAILS</span>' : ''}
                    </div>
                    <div class="mgh-card-body">
                        <b>${esc(def.name)}</b>
                        <small>${esc(def.tagline || '')}</small>
                        <div class="mgh-card-foot">${def.cat === 'boss' ? '<span class="mgh-card-best">3 MODES • 3 DIFFICULTIES</span>' : starsRow(stars) + `<span class="mgh-card-best">${best ? Number(best.score).toLocaleString() : '—'}</span>`}</div>
                    </div>
                </button>`;
        },

        _detail(def) {
            const best = this._best(def);
            const w = def.standardWeapon ? BO.WeaponsData.get(def.standardWeapon) : null;
            const cls = BO.Loadout.getActiveClass();
            const clsW = BO.WeaponsData.get(cls.primary.id);
            const opts = MG.hubOpts;
            let options = '';
            if (def.cat === 'boss') {
                options = `
                    <div class="mgh-opt"><label>MODE</label><div class="mgh-seg">${Object.entries(def.variants).map(([k, v]) => `<button data-opt="variant" data-val="${k}" class="${opts.variant === k ? 'on' : ''}">${v.label}</button>`).join('')}</div>
                        <small>${esc(def.variants[opts.variant] ? def.variants[opts.variant].desc : '')}</small></div>
                    <div class="mgh-opt"><label>DIFFICULTY</label><div class="mgh-seg">${Object.entries(def.difficulties).map(([k, v]) => `<button data-opt="difficulty" data-val="${k}" class="${opts.difficulty === k ? 'on' : ''}">${v.label}</button>`).join('')}</div></div>
                    <div class="mgh-opt"><label>LOADOUT</label><div class="mgh-weapon"><b>${esc(cls.name)}</b><span>${esc(clsW.name)} + ${esc(BO.WeaponsData.get(cls.secondary.id).shortName)}</span></div><small>Your active Create-a-Class loadout, with bottomless magazines.</small></div>
                    <div class="mgh-roster">${BO.ZombiesData.ORDERED_BOSSES.filter(def.variants[opts.variant].filter).map((b, i) => `<span class="${b.isSuperBoss ? 'super' : ''}" title="${esc(b.name)}">${i + 1}. ${esc(b.name)}</span>`).join('')}</div>`;
            } else {
                options = `
                    <div class="mgh-opt"><label>WEAPON</label><div class="mgh-seg">
                        <button data-opt="weapon" data-val="standard" class="${opts.weapon !== 'class' ? 'on' : ''}">COURSE STANDARD</button>
                        <button data-opt="weapon" data-val="class" class="${opts.weapon === 'class' ? 'on' : ''}">MY CLASS</button></div>
                        <div class="mgh-weapon"><b>${esc(opts.weapon === 'class' ? clsW.name : (w ? w.name : clsW.name))}</b><span>${esc(opts.weapon === 'class' ? clsW.category : (w ? w.category : ''))}</span></div>
                    </div>
                    <div class="mgh-thresholds">${(def.stars || []).map((th, i) => `<div class="s${i} ${best && best.score >= th ? 'got' : ''}">${STAR_SVG}<b>${Number(th).toLocaleString()}</b><small>${['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'][i]}</small></div>`).join('')}</div>`;
            }
            const bestLine = best
                ? `<div class="mgh-best"><small>PERSONAL BEST</small><b>${esc(def.formatBest ? def.formatBest(best) : Number(best.score).toLocaleString())}</b>${starsRow(best.stars || 0, 4, 'big')}</div>`
                : `<div class="mgh-best mgh-best-none"><small>PERSONAL BEST</small><b>Not played yet</b></div>`;
            return `
                <div class="mgh-d-hero"><span>${def.icon}</span><div><small>${def.cat === 'target' ? 'TARGET PRACTICE • 60 SECONDS' : def.cat === 'boss' ? 'BOSS RUSH • ENDURANCE' : 'WHACK-A-MOLE • 60 SECONDS'}</small><h2>${esc(def.name)}</h2><em>${esc(def.tagline || '')}</em></div></div>
                <p class="mgh-d-desc">${esc(def.desc || '')}</p>
                ${bestLine}
                ${options}
                <div class="mgh-keys">${def.cat === 'boss' ? '<span><kbd>H</kbd> Max heal (rest only)</span><span><kbd>N</kbd> Skip rest</span>' : '<span><kbd>R</kbd> Retry from results</span><span><kbd>N</kbd> Next course</span>'}<span><kbd>ESC</kbd> Pause</span></div>
                <button class="mgh-play" data-play="${def.id}">▶ PLAY ${esc(def.name.toUpperCase())}</button>`;
        },

        _bind(body) {
            body.querySelectorAll('[data-cat]').forEach((b) => {
                b.onclick = () => { BO.Sound.playUIClick(); MG.hubCat = b.dataset.cat; this.render(); };
            });
            body.querySelectorAll('[data-id]').forEach((b) => {
                b.onclick = () => { BO.Sound.playUIClick(); MG.hubSel[MG.hubCat] = b.dataset.id; this.render(); };
                b.ondblclick = () => this._play(b.dataset.id);
            });
            body.querySelectorAll('[data-opt]').forEach((b) => {
                b.onclick = () => { BO.Sound.playUIClick(); MG.hubOpts[b.dataset.opt] = b.dataset.val; this.render(); };
            });
            body.querySelectorAll('[data-play]').forEach((b) => {
                b.onclick = () => this._play(b.dataset.play);
            });
            body.querySelectorAll('.mgh-card, .mgh-cat, .mgh-play').forEach((b) => b.addEventListener('mouseenter', () => BO.Sound.playUIHover && BO.Sound.playUIHover()));
        },

        _play(id) {
            const def = MG.get(id);
            if (!def) return;
            BO.Sound.playUIClick();
            const o = MG.hubOpts;
            const mgOptions = def.cat === 'boss'
                ? { variant: o.variant, difficulty: o.difficulty, variantLabel: def.variants[o.variant].label + ' • ' + def.difficulties[o.difficulty].label }
                : { weapon: o.weapon };
            MG.launch(id, mgOptions);
        }
    };

    BO.MinigameHub = Hub;
})(window);
