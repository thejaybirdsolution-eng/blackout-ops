/* ============================================================================
   BLACKOUT OPS — MINIGAMES: hub screen (menu)
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const esc = BO.MinigameLib.esc;

    const CATS = [
        { id: 'fun', name: 'Fun & Specials', icon: '🎉', unit: 'featured modes', accent: '#ec4899', blurb: '22 studio-flagship genres built inside Blackout Ops: Angry Birds FPS, Master Zombie Siege, 5-min Snowboarding, 360 Trick Shots, FPS Mario 1-1 to 1-4 + Bowser, ATB Final Fantasy Story RPG, Bunker Inspection, Toyshop Prop Hunt, Kaiju Metropolis, Bumper-Car Derby, Hell\'s Combat Kitchen, Sky-Pirate Zeppelin, 5cm Toy-Soldier War, Grandmaster Battle-Chess, Ectoplasm Ghost-Hunters, Roman Colosseum, Zero-G Orbital Breach, Abyssal Trench Exo-Suit, Jurassic Jeep Safari, Ironkeep Castle Siege, Cyberpunk Hoverbike Highway & Pinball Wizard 3D!' },
        { id: 'target', name: 'Target & Action', icon: '🎯', unit: 'courses', accent: '#f59e0b', blurb: '16 curated action courses: Classic Range, Thunderbolt Coaster, Beat Drop rhythm stage (with 1st-person example), Classic Whack-a-Mole, Sweetheart Shore, Mansion Raid, Outlaw Pursuit & more!' },
        { id: 'speed', name: 'Speed Runs', icon: '⏱️', unit: 'timed runs', accent: '#06b6d4', blurb: '9 high-intensity timed gauntlets: Neon Gauntlet, Outpost Valley, Linear 3-Act Getaway Chase, Deagle Meteor Splitter, Last 50, Freefall, 3x-expanded Ninja Fortress & Titan Three-Headed Dragon!' },
        { id: 'arcade', name: 'Arcade Hall', icon: '🕹️', unit: 'mini games', accent: '#a855f7', blurb: '15 carnival booths & party brawlers: Quickdraw Duels, Ball Brawl, Aim Diagnostics, Contracts, Switchyard, Shell Game, Shooting Gallery & more!' },
        { id: 'boss', name: 'Boss Rush', icon: '💀', unit: '3 max heals', accent: '#dc2626', blurb: 'Fight every boss in the game back to back. Bottomless ammo, no regen, three heals for the whole run.' }
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
            const cat = (MG.hubCat && CATS.some((c) => c.id === MG.hubCat)) ? MG.hubCat : 'fun';
            const list = MG.list(cat);
            if (!MG.hubSel[cat] || !MG.get(MG.hubSel[cat])) MG.hubSel[cat] = list[0] && list[0].id;
            const sel = MG.get(MG.hubSel[cat]);
            const totals = CATS.map((c) => this._catStars(c.id));
            const allGot = totals.reduce((a, t) => a + t.got, 0);
            const allMax = totals.reduce((a, t) => a + t.max, 0);
            const body = this.el.querySelector('#mgh-body');
            body.innerHTML = `
                <nav class="mgh-cats">
                    ${CATS.map((c, i) => {
                        const cnt = MG.list(c.id).length;
                        const subText = c.id === 'boss' ? c.unit : `${cnt} ${c.unit}`;
                        return `
                        <button class="mgh-cat ${c.id === cat ? 'active' : ''}" data-cat="${c.id}" style="--mc:${c.accent}">
                            <span class="mgh-cat-ico">${c.icon}</span>
                            <span class="mgh-cat-text"><b>${c.name}</b><small>${subText}</small></span>
                            <span class="mgh-cat-stars">${STAR_SVG}<em>${totals[i].got}/${totals[i].max}</em></span>
                        </button>`;
                    }).join('')}
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
            const num = (def.cat === 'fun' || def.cat === 'target' || def.cat === 'arcade' || def.cat === 'speed') ? String(i + 1).padStart(2, '0') : '';
            const tag = def.badge ? `<span class="mgh-tag">${esc(def.badge)}</span>` : (def.rail ? '<span class="mgh-tag">ON RAILS</span>' : '');
            return `
                <button class="mgh-card ${active ? 'active' : ''}" data-id="${def.id}" style="--mc:${def.accent}">
                    <div class="mgh-card-art">
                        ${(def.cardImage || (BO.MinigameThumbs && BO.MinigameThumbs.get(def))) ? `<img class="mgh-card-scene" src="${esc(def.cardImage || BO.MinigameThumbs.get(def))}" alt="" loading="lazy" decoding="async">` : `<span class="mgh-card-ico">${def.icon}</span>`}
                        ${num ? `<span class="mgh-card-num">${num}</span>` : ''}
                        ${tag}
                    </div>
                    <div class="mgh-card-body">
                        <b>${esc(def.name)}</b>
                        <small>${esc(def.tagline || '')}</small>
                        <div class="mgh-card-foot">${def.cat === 'boss' ? '<span class="mgh-card-best">3 MODES • 3 DIFFICULTIES</span>' : starsRow(stars) + `<span class="mgh-card-best">${best ? esc(def.formatBest ? def.formatBest(best) : Number(best.score).toLocaleString()) : '—'}</span>`}</div>
                    </div>
                </button>`;
        },

        _guideData(def) {
            const g = def.guide || {};
            const objective = g.objective || def.desc || def.tagline || 'Complete the challenge cleanly for Platinum stars.';
            const tips = g.tips ? g.tips.slice() : [];
            if (!tips.length) {
                if (def.cat === 'speed') tips.push('Beat the clock thresholds shown on the star cards for Gold and Platinum.');
                else if (def.cat === 'target') tips.push('Chain accurate hits without missing to build up to a 4x streak multiplier.');
                else if (def.cat === 'arcade') tips.push('Focus on accuracy and avoid penalty targets to protect your streak.');
                else if (def.cat === 'boss') tips.push('You only get 3 heals for the entire run—press [H] wisely during rest windows.');
                else tips.push('Check the key bindings above before hitting Play; every mode has unique abilities.');
                if (def.weaponNote) tips.push(def.weaponNote);
            }
            const controls = (def.keys && def.keys.length)
                ? def.keys.map(([k, t]) => `<b>[${esc(k)}]</b> ${esc(t)}`).join(' • ')
                : 'Standard FPS movement & shooting controls ([WASD], [MOUSE], [LMB]).';
            return { objective, tips, controls };
        },

        _openGuideModal(def) {
            const old = document.getElementById('mgh-guide-modal'); if (old) old.remove();
            const g = this._guideData(def);
            const modal = document.createElement('div');
            modal.id = 'mgh-guide-modal';
            modal.className = 'mgh-guide-modal';
            modal.style.setProperty('--mc', def.accent || '#f59e0b');
            modal.innerHTML = `
                <div class="mgh-guide-card">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
                        <small style="color:var(--mc);letter-spacing:2px;font-weight:800;">START MENU GUIDE • ${esc((def.cat || '').toUpperCase())}</small>
                        <button class="mgh-guide-btn" id="mgh-g-close">✕ CLOSE</button>
                    </div>
                    <h3>${def.icon} ${esc(def.name)}</h3>
                    <div class="mgh-guide-sec"><small>OBJECTIVE &amp; RULES</small><p>${esc(g.objective)}</p></div>
                    <div class="mgh-guide-sec"><small>CONTROLS</small><p>${g.controls}</p></div>
                    <div class="mgh-guide-sec"><small>PRO TIPS &amp; WINNING STRATEGY</small><ul>${g.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
                    <div style="margin-top:14px;display:flex;justify-content:flex-end;gap:8px;">
                        <button class="mgh-guide-btn" id="mgh-g-close2" style="padding:8px 14px;">CLOSE</button>
                        <button class="mgh-play" id="mgh-g-play" style="position:static;margin:0;padding:10px 18px;font-size:13px;">▶ PLAY NOW</button>
                    </div>
                </div>`;
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
            document.body.appendChild(modal);
            modal.querySelector('#mgh-g-close').onclick = () => modal.remove();
            modal.querySelector('#mgh-g-close2').onclick = () => modal.remove();
            modal.querySelector('#mgh-g-play').onclick = () => { modal.remove(); this._play(def.id); };
        },

        _detail(def) {
            const best = this._best(def);
            const cls = BO.Loadout.getActiveClass();
            const clsW = BO.WeaponsData.get(cls.primary.id);
            const opts = this._opts(def);
            const stdId = typeof def.standardWeapon === 'function' ? def.standardWeapon(opts) : def.standardWeapon;
            const w = stdId ? BO.WeaponsData.get(stdId) : null;
            const stars = MG.starsOf(def, opts);
            let options = (def.hubOptions || []).map((opt) => {
                const cur = opt.choices.find((c) => c.val === opts[opt.key]) || opt.choices[0];
                return `<div class="mgh-opt"><label>${esc(opt.label)}</label><div class="mgh-seg ${opt.choices.length > 4 ? 'mgh-seg-wrap' : ''}">${opt.choices.map((c) => `<button data-opt="${opt.key}" data-val="${esc(c.val)}" class="${cur.val === c.val ? 'on' : ''}" title="${esc(c.desc || '')}">${esc(c.label)}</button>`).join('')}</div>
                    ${cur.desc ? `<small>${esc(cur.desc)}</small>` : ''}</div>`;
            }).join('');
            if (def.cat === 'boss') {
                options += `
                    <div class="mgh-opt"><label>MODE</label><div class="mgh-seg">${Object.entries(def.variants).map(([k, v]) => `<button data-opt="variant" data-val="${k}" class="${opts.variant === k ? 'on' : ''}">${v.label}</button>`).join('')}</div>
                        <small>${esc(def.variants[opts.variant] ? def.variants[opts.variant].desc : '')}</small></div>
                    <div class="mgh-opt"><label>DIFFICULTY</label><div class="mgh-seg">${Object.entries(def.difficulties).map(([k, v]) => `<button data-opt="difficulty" data-val="${k}" class="${opts.difficulty === k ? 'on' : ''}">${v.label}</button>`).join('')}</div></div>
                    <div class="mgh-opt"><label>LOADOUT</label><div class="mgh-weapon"><b>${esc(cls.name)}</b><span>${esc(clsW.name)} + ${esc(BO.WeaponsData.get(cls.secondary.id).shortName)}</span></div><small>Your active Create-a-Class loadout, with bottomless magazines.</small></div>
                    <div class="mgh-roster">${BO.ZombiesData.ORDERED_BOSSES.filter(def.variants[opts.variant].filter).map((b, i) => `<span class="${b.isSuperBoss ? 'super' : ''}" title="${esc(b.name)}">${i + 1}. ${esc(b.name)}</span>`).join('')}</div>`;
            } else if (def.lockWeapon || !def.standardWeapon) {
                options += `
                    ${def.standardWeapon ? `<div class="mgh-opt"><label>WEAPON</label><div class="mgh-weapon"><b>${esc(def.weaponLabel || (w ? w.name : ''))}</b><span>${esc(def.weaponNote || 'Fixed for this event')}</span></div></div>` : (def.weaponNote ? `<div class="mgh-opt"><label>WEAPON</label><div class="mgh-weapon"><b>${esc(def.weaponLabel || 'None')}</b><span>${esc(def.weaponNote)}</span></div></div>` : '')}
                    <div class="mgh-thresholds">${stars.map((th, i) => `<div class="s${i} ${best && best.stars > i ? 'got' : ''}">${STAR_SVG}<b>${esc(def.starLabel ? def.starLabel(th, i) : Number(th).toLocaleString())}</b><small>${['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'][i]}</small></div>`).join('')}</div>`;
            } else {
                options += `
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
            const gd = this._guideData(def);
            const heroImg = def.cardImage || (BO.MinigameThumbs ? BO.MinigameThumbs.get(def) : '');
            return `
                ${heroImg ? `<div class="mgh-d-banner"><img src="${esc(heroImg)}" alt="" decoding="async"><span class="mgh-d-cat">${def.heroLabel ? esc(def.heroLabel) : esc((def.cat || '').toUpperCase())}</span></div>` : ''}
                <div class="mgh-d-hero"><span>${def.icon}</span><div><small>${def.heroLabel ? esc(def.heroLabel) : def.cat === 'fun' ? 'FUN & SPECIALS' : def.cat === 'target' ? 'TARGET PRACTICE • 60 SECONDS' : def.cat === 'boss' ? 'BOSS RUSH • ENDURANCE' : def.cat === 'arcade' ? 'ARCADE HALL' : def.cat === 'speed' ? 'SPEED RUN • TIMED' : 'WHACK-A-MOLE • 60 SECONDS'}</small><h2>${esc(def.name)}</h2><em>${esc(def.tagline || '')}</em></div></div>
                <p class="mgh-d-desc">${esc(def.desc || '')}</p>
                <div class="mgh-guide">
                    <div class="mgh-guide-head"><b>📖 START MENU GUIDE</b><button class="mgh-guide-btn" data-guide="${def.id}">FULL GUIDE</button></div>
                    <ul>
                        <li><b>GOAL:</b> ${esc(gd.objective.length > 125 ? gd.objective.slice(0, 122) + '...' : gd.objective)}</li>
                        ${gd.tips.slice(0, 2).map((t) => `<li><b>TIP:</b> ${esc(t)}</li>`).join('')}
                    </ul>
                </div>
                ${bestLine}
                ${dual}
                ${options}
                <div class="mgh-keys">${def.keys ? def.keys.map(([k, t]) => `<span><kbd>${esc(k)}</kbd> ${esc(t)}</span>`).join('') : def.cat === 'boss' ? '<span><kbd>H</kbd> Max heal (rest only)</span><span><kbd>N</kbd> Skip rest</span>' : '<span><kbd>R</kbd> Retry from results</span><span><kbd>N</kbd> Next course</span>'}<span><kbd>ESC</kbd> Pause</span></div>
                ${def.hasExample ? `<button class="mgh-example" data-example="${def.id}">▶ WATCH 100% PERFECT EXAMPLE</button>` : ''}
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
            body.querySelectorAll('[data-example]').forEach((b) => {
                b.onclick = () => this._play(b.dataset.example, { exampleMode: true });
            });
            body.querySelectorAll('[data-guide]').forEach((b) => {
                b.onclick = () => { BO.Sound.playUIClick(); const d = MG.get(b.dataset.guide); if (d) this._openGuideModal(d); };
            });
            body.querySelectorAll('.mgh-card, .mgh-cat, .mgh-play, .mgh-example').forEach((b) => b.addEventListener('mouseenter', () => BO.Sound.playUIHover && BO.Sound.playUIHover()));
        },

        _play(id, extraOpts) {
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
            if (extraOpts) Object.assign(mgOptions, extraOpts);
            MG.launch(id, mgOptions);
        }
    };

    BO.MinigameHub = Hub;
})(window);
