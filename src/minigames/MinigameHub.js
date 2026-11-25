/* ============================================================================
   BLACKOUT OPS — MINIGAMES: hub screen (menu)
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const esc = BO.MinigameLib.esc;

    const CATS = [
        { id: 'target', name: 'Target Practice', icon: '🎯', sub: '15 courses', accent: '#f59e0b', blurb: 'Fifteen courses, from the classic range to rhythm shooting (11 songs, 4 modes), a one-magazine trial, a horseback chase, a mansion raid with 15 situations and a heart-blaster beach party. Every course keeps two records: one with the course weapon, one with your class.' },
        { id: 'arcade', name: 'Arcade Hall', icon: '🕹️', sub: '15 mini games', accent: '#a855f7', blurb: 'Quickdraw duels, arcade cabinets, a hamster-ball brawl, an aim lab, assassination contracts, and nine more: juggling, colour rules, number order, memory panels, a rail switchyard, a meteor shield, fishing, paint wars and safe cracking.' },
        { id: 'speed', name: 'Speed Runs', icon: '⏱️', sub: '7 timed runs', accent: '#06b6d4', blurb: 'Seven timed challenges, each with its own map, setup and rules. Beat the clock: clear a course, save three outposts, chase thieves by car, stop a splitting zombie, snipe pilots from a rooftop, survive on 50 bullets, and win a skydive fight before you land.' },
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

        /** The options this course would launch with right now. */
        _opts(def, over) {
            const o = Object.assign({}, MG.hubOpts);
            for (const opt of def.hubOptions || []) if (o[opt.key] === undefined || !opt.choices.some((c) => c.val === o[opt.key])) o[opt.key] = opt.default;
            return Object.assign(o, over || {});
        },

        _best(def, over) {
            const m = BO.Save.data.minigames;
            if (!m || !m.best) return null;
            return m.best[MG.bestKey(def, this._opts(def, over))] || null;
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
                    got += MG.bestStarsAny(def);
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
            const stars = def.cat === 'boss' ? 0 : MG.bestStarsAny(def);
            const num = def.cat === 'target' || def.cat === 'arcade' || def.cat === 'speed' ? String(i + 1).padStart(2, '0') : '';
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
                        <div class="mgh-card-foot">${def.cat === 'boss' ? '<span class="mgh-card-best">3 MODES • 3 DIFFICULTIES</span>' : starsRow(stars) + `<span class="mgh-card-best">${best ? esc(def.formatBest ? def.formatBest(best) : Number(best.score).toLocaleString()) : '—'}</span>`}</div>
                    </div>
                </button>`;
        },

        _detail(def) {
            const best = this._best(def);
            const w = def.standardWeapon ? BO.WeaponsData.get(def.standardWeapon) : null;
            const cls = BO.Loadout.getActiveClass();
            const clsW = BO.WeaponsData.get(cls.primary.id);
            const opts = this._opts(def);
            const stars = MG.starsOf(def, opts);
            let options = (def.hubOptions || []).map((opt) => {
                const cur = opt.choices.find((c) => c.val === opts[opt.key]) || opt.choices[0];
                return `<div class="mgh-opt"><label>${esc(opt.label)}</label><div class="mgh-seg ${opt.choices.length > 4 ? 'mgh-seg-wrap' : ''}">${opt.choices.map((c) => `<button data-opt="${opt.key}" data-val="${esc(c.val)}" class="${cur.val === c.val ? 'on' : ''}" title="${esc(c.desc || '')}">${esc(c.label)}</button>`).join('')}</div>
                    ${cur.desc ? `<small>${esc(cur.desc)}</small>` : ''}</div>`;
            }).join('');
            if (def.cat === 'boss') {
                options = `
                    <div class="mgh-opt"><label>MODE</label><div class="mgh-seg">${Object.entries(def.variants).map(([k, v]) => `<button data-opt="variant" data-val="${k}" class="${opts.variant === k ? 'on' : ''}">${v.label}</button>`).join('')}</div>
                        <small>${esc(def.variants[opts.variant] ? def.variants[opts.variant].desc : '')}</small></div>
                    <div class="mgh-opt"><label>DIFFICULTY</label><div class="mgh-seg">${Object.entries(def.difficulties).map(([k, v]) => `<button data-opt="difficulty" data-val="${k}" class="${opts.difficulty === k ? 'on' : ''}">${v.label}</button>`).join('')}</div></div>
                    <div class="mgh-opt"><label>LOADOUT</label><div class="mgh-weapon"><b>${esc(cls.name)}</b><span>${esc(clsW.name)} + ${esc(BO.WeaponsData.get(cls.secondary.id).shortName)}</span></div><small>Your active Create-a-Class loadout, with bottomless magazines.</small></div>
                    <div class="mgh-roster">${BO.ZombiesData.ORDERED_BOSSES.filter(def.variants[opts.variant].filter).map((b, i) => `<span class="${b.isSuperBoss ? 'super' : ''}" title="${esc(b.name)}">${i + 1}. ${esc(b.name)}</span>`).join('')}</div>`;
            } else if (def.lockWeapon || !def.standardWeapon) {
                options = `
                    ${def.standardWeapon ? `<div class="mgh-opt"><label>WEAPON</label><div class="mgh-weapon"><b>${esc(def.weaponLabel || (w ? w.name : ''))}</b><span>${esc(def.weaponNote || 'Fixed for this event')}</span></div></div>` : (def.weaponNote ? `<div class="mgh-opt"><label>WEAPON</label><div class="mgh-weapon"><b>${esc(def.weaponLabel || 'None')}</b><span>${esc(def.weaponNote)}</span></div></div>` : '')}
                    <div class="mgh-thresholds">${stars.map((th, i) => `<div class="s${i} ${best && best.stars > i ? 'got' : ''}">${STAR_SVG}<b>${esc(def.starLabel ? def.starLabel(th, i) : Number(th).toLocaleString())}</b><small>${['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'][i]}</small></div>`).join('')}</div>`;
            } else {
                options = `
                    <div class="mgh-opt"><label>WEAPON</label><div class="mgh-seg">
                        <button data-opt="weapon" data-val="standard" class="${opts.weapon !== 'class' ? 'on' : ''}">COURSE STANDARD</button>
                        <button data-opt="weapon" data-val="class" class="${opts.weapon === 'class' ? 'on' : ''}">MY CLASS</button></div>
                        <div class="mgh-weapon"><b>${esc(opts.weapon === 'class' ? clsW.name : (w ? w.name : clsW.name))}</b><span>${esc(opts.weapon === 'class' ? clsW.category : (w ? w.category : ''))}</span></div>
                    </div>
                    <div class="mgh-thresholds">${stars.map((th, i) => `<div class="s${i} ${best && best.stars > i ? 'got' : ''}">${STAR_SVG}<b>${esc(def.starLabel ? def.starLabel(th, i) : Number(th).toLocaleString())}</b><small>${['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'][i]}</small></div>`).join('')}</div>`;
            }
            const fmt = (b) => b ? esc(def.formatBest ? def.formatBest(b) : Number(b.score).toLocaleString()) : '—';
            const dual = MG.hasWeaponChoice(def)
                ? `<div class="mgh-dualbest"><div class="${opts.weapon !== 'class' ? 'on' : ''}"><small>COURSE WEAPON BEST</small><b>${fmt(this._best(def, { weapon: 'standard' }))}</b></div><div class="${opts.weapon === 'class' ? 'on' : ''}"><small>MY CLASS BEST</small><b>${fmt(this._best(def, { weapon: 'class' }))}</b></div></div>`
                : '';
            const bestLine = best
                ? `<div class="mgh-best"><small>PERSONAL BEST</small><b>${esc(def.formatBest ? def.formatBest(best) : Number(best.score).toLocaleString())}</b>${starsRow(best.stars || 0, 4, 'big')}</div>`
                : `<div class="mgh-best mgh-best-none"><small>PERSONAL BEST</small><b>Not played yet</b></div>`;
            return `
                <div class="mgh-d-hero"><span>${def.icon}</span><div><small>${def.heroLabel ? esc(def.heroLabel) : def.cat === 'target' ? 'TARGET PRACTICE • 60 SECONDS' : def.cat === 'boss' ? 'BOSS RUSH • ENDURANCE' : def.cat === 'arcade' ? 'ARCADE HALL' : def.cat === 'speed' ? 'SPEED RUN • TIMED' : 'WHACK-A-MOLE • 60 SECONDS'}</small><h2>${esc(def.name)}</h2><em>${esc(def.tagline || '')}</em></div></div>
                <p class="mgh-d-desc">${esc(def.desc || '')}</p>
                ${bestLine}
                ${dual}
                ${options}
                <div class="mgh-keys">${def.keys ? def.keys.map(([k, t]) => `<span><kbd>${esc(k)}</kbd> ${esc(t)}</span>`).join('') : def.cat === 'boss' ? '<span><kbd>H</kbd> Max heal (rest only)</span><span><kbd>N</kbd> Skip rest</span>' : '<span><kbd>R</kbd> Retry from results</span><span><kbd>N</kbd> Next course</span>'}<span><kbd>ESC</kbd> Pause</span></div>
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
                : this._opts(def);
            if (def.cat !== 'boss') {
                delete mgOptions.variant; delete mgOptions.difficulty;
                if (def.variantLabel) mgOptions.variantLabel = def.variantLabel(mgOptions);
            }
            MG.launch(id, mgOptions);
        }
    };

    BO.MinigameHub = Hub;
})(window);
