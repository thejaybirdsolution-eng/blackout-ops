/* ============================================================================
   BLACKOUT OPS — Mega Survival Briefing, Legend, Tech Tree, Shrines & HUD UI
============================================================================ */
(function (BO) {
    'use strict';

    const data = BO.SurvivalCampaignData;
    const career = BO.SurvivalCareer;
    const frontier = BO.SurvivalFrontierData;
    const rules = () => BO.SurvivalRules || {};
    const deepData = () => BO.SurvivalDeepData || {};

    const price = (cost) => Object.entries(cost || {}).map(([key, count]) =>
        count + ' ' + ({ scrap: 'salvage', rations: 'ration', coil: 'MRI coil', freshWater: 'water', aetherShard: 'Aether shard' }[key] || key)).join(' + ');

    const select = (label, name, values, current) =>
        `<label class="survival-option"><span>${label}</span><select name="${name}">${values.map(([id, text]) =>
            `<option value="${id}" ${String(current) === String(id) ? 'selected' : ''}>${text}</option>`).join('')}</select></label>`;
    const checkbox = (label, name, checked) =>
        `<label class="survival-toggle"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''}>${label}</label>`;
    const action = (label, name, value, disabled = false) =>
        `<button type="button" class="btn btn-sm" data-${name}="${value}" ${disabled ? 'disabled' : ''}>${label}</button>`;
    const card = (name, desc, buttons, accent = '#a6ddd0') =>
        `<article class="select-card expansion-shop-card" style="--item-color:${accent}">
            <div class="card-head">${name}</div><div class="card-sub">${desc}</div>
            <div class="chip-row">${buttons}</div>
        </article>`;

    class SurvivalUI {
        get open() { return !!this.dialog?.open; }

        show(section, deploy, subject) {
            if (!this.dialog) this.create();
            this.returnSection = section === 'legend' && !BO.SurvivalMode.active ? 'briefing' : null;
            this.section = section;
            this.subject = subject;
            this.deploy = deploy || this.deploy;
            if (section !== 'briefing') {
                BO.App._clearInputState();
                if (document.pointerLockElement) document.exitPointerLock();
            }
            if (!this.open) this.dialog.showModal();
            this.render();
        }

        create() {
            this.dialog = document.createElement('dialog');
            this.dialog.className = 'expansion-shop survival-panel';
            this.dialog.setAttribute('aria-labelledby', 'survival-title');
            this.dialog.innerHTML = `<header class="expansion-shop-head">
                <h2 id="survival-title"></h2><button class="btn btn-sm" data-action="close"></button>
                </header><div class="survival-content"></div>`;
            this.closeButton = this.dialog.querySelector('[data-action="close"]');
            this.title = this.dialog.querySelector('h2');
            this.content = this.dialog.querySelector('.survival-content');
            document.body.append(this.dialog);
            this.closeButton.onclick = () => this.resume();
            this.dialog.addEventListener('cancel', (event) => {
                event.preventDefault();
                if (this.section === 'legend' && this.returnSection === 'briefing') {
                    this.section = 'briefing';
                    this.render();
                } else {
                    this.close();
                }
            });
            this.content.addEventListener('submit', (event) => event.preventDefault());
            this.content.addEventListener('input', (event) => {
                if (event.target.id === 'survival-legend-search') {
                    this.legendQuery = event.target.value;
                    const res = this.content.querySelector('#survival-legend-results');
                    if (res && BO.SurvivalLegend) res.innerHTML = BO.SurvivalLegend.renderResults(this.legendQuery, this.legendCat || 'all');
                }
            });
            this.content.onchange = (event) => {
                if (event.target.id === 'survival-legend-category') {
                    this.legendCat = event.target.value;
                    const res = this.content.querySelector('#survival-legend-results');
                    if (res && BO.SurvivalLegend) res.innerHTML = BO.SurvivalLegend.renderResults(this.legendQuery || '', this.legendCat);
                    return;
                }
                if (this.section !== 'briefing' || (!event.target.name && !event.target.matches('[data-mod]'))) return;
                const options = this.readOptions();
                if (event.target.matches('[data-enemy]') && !options.disabledEnemies.includes(event.target.value)) event.target.checked = true;
                this._refreshBriefingHints(options);
            };
            this.content.onclick = (event) => {
                if (event.target.closest('.mm-shell')) return;
                const button = event.target.closest('button');
                if (!button) return;
                this.dispatch(button.dataset);
            };
        }

        _refreshBriefingHints(options) {
            const r = rules();
            const pEl = this.content.querySelector('.survival-pool-detail');
            if (pEl) pEl.textContent = data.pools[options.pool]?.extra || '';
            const mEl = this.content.querySelector('.survival-mode-detail');
            if (mEl) mEl.textContent = r.modes?.[options.gameType]?.description || '';
            const dEl = this.content.querySelector('.survival-diff-detail');
            const diff = r.difficulties?.[options.difficulty];
            if (dEl && diff) dEl.textContent = `${diff.hp}x Enemy HP · ${diff.damage}x Damage · ${diff.rate}x Spawn Rate · Max ${diff.enemyCap}`;
            const modCount = this.content.querySelector('.survival-mod-count');
            if (modCount) modCount.textContent = `${options.modifiers.length} active`;
            const safeEl = this.content.querySelector('.survival-safe-secs');
            if (safeEl && r.openingSecondsFor) safeEl.textContent = `${r.openingSecondsFor(options)}`;
        }

        readOptions() {
            const form = this.content.querySelector('form');
            if (!form) return career.profile.options;
            const value = Object.fromEntries(new FormData(form));
            for (const key of ['weather', 'survivalNeeds', 'autosave']) value[key] = !!form.elements[key]?.checked;
            value.modifiers = [...form.querySelectorAll('[data-mod]:checked')].map((input) => input.value);
            value.disabledEnemies = [...form.querySelectorAll('[data-enemy]:not(:checked)')].map((input) => input.value);
            return career.remember(value);
        }

        dispatch(ds) {
            const { deploy, craft, use, panel, build, rotate, ride, travel, reward, trade, special, save,
                packFilter, handcraft, itemUse, equipTool, drop, transfer, preset,
                unlockTech, forge, upgradeGun, upgradeAttr, equipTalisman, infuse, shrineTravel,
                sleepDawn, dismantle, repairBase, claimChallenge, respawn, finishRun, useFlask } = ds;
            const mode = BO.SurvivalMode;
            const campaign = mode.campaign;
            if (preset) {
                const p = rules().presets?.[preset];
                if (p) {
                    const merged = { ...data.defaults, modifiers: [], ...p.settings };
                    career.remember(merged);
                    this.activePreset = preset;
                    this.render();
                }
                return;
            }
            if (panel) {
                if (panel === 'legend' && !mode.active) this.returnSection = 'briefing';
                this.section = panel;
                this.render();
                return;
            }
            if (deploy === 'new' || deploy === 'resume') {
                const callback = this.deploy;
                const options = deploy === 'new' ? this.readOptions() : career.checkpoint?.options;
                if (!options || !callback) return;
                const resume = deploy === 'resume' ? career.checkpoint : undefined;
                this.close();
                callback({ mode: 'survival', mapId: 'exclusion_zone', ...options, ...(resume ? { resume } : {}) });
                return;
            }
            if (!mode.active || !campaign) return;
            const deep = campaign.deep;
            if (packFilter) this.packFilter = packFilter;
            else if (handcraft) campaign.pack.craft(handcraft);
            else if (itemUse) campaign.pack.use(itemUse);
            else if (equipTool && campaign.pack.tools[equipTool] > 0) campaign.pack.equipped = equipTool;
            else if (drop) { const [id, amount] = drop.split(':'); campaign.pack.drop(id, amount); }
            else if (transfer) { const [dir, id, amt] = transfer.split(':'); campaign.pack.transfer(this.subject, id, amt, dir === 'store'); }
            else if (craft) mode.craft(craft);
            else if (use) mode.useItem(use);
            else if (rotate) campaign.buildRotation = 1 - campaign.buildRotation;
            else if (build && campaign.build(build)) return this.resume();
            else if (dismantle) deep?.dismantleNearest();
            else if (repairBase) deep?.repairBase();
            else if (unlockTech) deep?.unlockTech(unlockTech);
            else if (forge) deep?.forgeWeapon(forge);
            else if (upgradeGun) deep?.upgradeEquippedWeapon();
            else if (upgradeAttr) deep?.upgradeAttribute(upgradeAttr);
            else if (equipTalisman) deep?.equipTalisman(equipTalisman);
            else if (infuse) deep?.applyInfusion(infuse);
            else if (sleepDawn) campaign.sleepUntilDawn();
            else if (useFlask) deep?.useFlask();
            else if (claimChallenge) campaign.objectives.claim(claimChallenge);
            else if (shrineTravel) {
                const dest = deep?.allShrines.find((s) => s.id === shrineTravel);
                if (dest && campaign.canSave()) {
                    BO.Player.pos.set(dest.x, dest.y, dest.z);
                    BO.Player.vel.set(0, 0, 0);
                    deep.lastRestPoint = { x: dest.x, y: dest.y, z: dest.z };
                    mode.toast('Warped to ' + dest.name + '.');
                    return this.resume();
                } else mode.toast('Cannot warp while enemies are nearby.');
            } else if (respawn) {
                deep?.respawnAtGrace();
                return this.resume();
            } else if (finishRun) {
                this.close();
                mode.finish(false);
                return;
            }
            else if (ride && campaign.ride(ride === 'off' ? null : ride)) return this.resume();
            else if (travel && campaign.travel(travel)) return this.resume();
            else if (reward) campaign.reward(this.subject);
            else if (trade) campaign.trade(this.subject, trade);
            else if (special && campaign.special(this.subject)) return this.resume();
            else if (save) {
                const ok = campaign.save();
                this.feedback = ok ? 'Checkpoint saved.' : 'Save unavailable here. Clear nearby enemies first.';
            }
            this.render();
        }

        resume() {
            if (this.section === 'legend' && this.returnSection === 'briefing') {
                this.section = 'briefing';
                this.returnSection = null;
                this.render();
                return;
            }
            const playing = this.section !== 'briefing';
            this.close();
            if (playing) BO.App._safePointerLock();
        }

        close() {
            if (!this.open) return;
            const playing = this.section !== 'briefing';
            this.dialog.close();
            this.feedback = null;
            if (playing) BO.App._clearInputState();
        }

        get careerLine() {
            const xp = career.profile.xp;
            return `<p class="survival-career"><b>Level ${career.level} · ${career.rank}</b> <span>${xp.toLocaleString()} XP${career.level < 50 ? ' / ' + career.nextXP.toLocaleString() + ' to next level' : ''}</span></p>`;
        }

        renderBriefing() {
            const options = career.profile.options;
            const checkpoint = career.checkpoint;
            const r = rules();
            const modesList = Object.entries(r.modes || {}).map(([id, m]) => [id, m.name]);
            const diffList = Object.entries(r.difficulties || {}).map(([id, d]) => [id, d.name]);
            const presetsList = Object.entries(r.presets || {});
            const groups = { world: 'World & Time', combat: 'Combat & Enemies', survival: 'Vitals & Hazards', economy: 'Resources & Tech', challenge: 'Hardcore & Travel' };
            const diff = r.difficulties?.[options.difficulty] || {};
            this.title.textContent = 'Survival deployment';
            return `${this.careerLine}
                <p>Exclusion Zone · Solo Expedition. Zero enemies spawn for the first <span class="survival-safe-secs">${r.openingSecondsFor ? r.openingSecondsFor(options) : 60}</span>s! Press <kbd>L</kbd> anytime for the full Survival Legend.</p>
                <div class="survival-presets-bar">
                    ${presetsList.map(([id, p]) => `<button type="button" class="btn btn-sm ${this.activePreset === id ? 'btn-primary' : ''}" data-preset="${id}" title="${p.description}">${p.name}</button>`).join('')}
                </div>
                <form class="survival-lobby" aria-label="Survival deployment options">
                    ${select('Operation Mode', 'gameType', modesList, options.gameType)}
                    ${select('Difficulty', 'difficulty', diffList, options.difficulty)}
                    ${select('Enemy pool', 'pool', Object.entries(data.pools).map(([key, pool]) => [key, pool.name]), options.pool)}
                    ${select('Starting time', 'startHour', [[0, '00:00 · Midnight'], [6, '06:00 · Dawn'], [8, '08:00 · Morning'], [12, '12:00 · Noon'], [18, '18:00 · Dusk'], [22, '22:00 · Night']], options.startHour)}
                    ${select('Day length', 'dayLength', [[180, '3 minutes'], [360, '6 minutes'], [720, '12 minutes']], options.dayLength)}
                    ${select('Encounter rate', 'encounterRate', [[0.7, 'Sparse'], [1, 'Standard'], [1.5, 'Intense']], options.encounterRate)}
                    <div class="survival-toggles">
                        ${checkbox('Survival needs (hunger, water, temp, rad)', 'survivalNeeds', options.survivalNeeds)}
                        ${checkbox('Dynamic weather', 'weather', options.weather)}
                        ${checkbox('Autosave when safe', 'autosave', options.autosave)}
                    </div>
                    <details class="survival-roster survival-mods-details" open><summary>Modifiers Command Deck (<span class="survival-mod-count">${options.modifiers.length} active</span> / ${Object.keys(r.modifiers || {}).length} total)</summary>
                        <div id="survival-mod-menu-host">${BO.ModifierMenuUI
                            ? BO.ModifierMenuUI.renderHtml({ mode: 'survival', active: options.modifiers })
                            : `<div class="survival-mod-groups">${Object.entries(r.modifiers || {}).map(([id, mod]) =>
                                `<label class="survival-toggle" title="${mod.description}"><input type="checkbox" data-mod value="${id}" ${options.modifiers.includes(id) ? 'checked' : ''}><span><b>${mod.name}</b> — ${mod.description}</span></label>`).join('')}</div>`}</div>
                    </details>
                    <details class="survival-roster"><summary>Customize the infected roster</summary>
                        <div class="survival-roster-list">${BO.ZombiesData.ORDERED_PROGRESSION.map((enemy) =>
                            `<label class="survival-toggle"><input type="checkbox" data-enemy name="enemyRoster" value="${enemy.id}" ${options.disabledEnemies.includes(enemy.id) ? '' : 'checked'}>${enemy.name}</label>`).join('')}</div>
                    </details>
                </form>
                <p class="survival-mode-detail">${r.modes?.[options.gameType]?.description || ''}</p>
                <p class="survival-diff-detail">${diff.hp || 1}x Enemy HP · ${diff.damage || 1}x Damage · ${diff.rate || 1}x Spawn Rate · Max ${diff.enemyCap || 20}</p>
                <p class="survival-pool-detail">${data.pools[options.pool]?.extra || ''}</p>
                <div class="chip-row">
                    <button class="btn btn-primary" data-deploy="new" type="button">DEPLOY</button>
                    ${action('📖 SURVIVAL LEGEND', 'panel', 'legend')}
                    ${checkpoint ? action('RESUME CHECKPOINT', 'deploy', 'resume') : ''}
                </div>
                ${checkpoint ? `<p>Checkpoint at ${BO.Math.formatTime(checkpoint.clock)} · deploying new replaces this save.</p>` : ''}
                <details class="survival-record"><summary>Career stats and unlocks</summary>${this.record()}</details>`;
        }

        record() {
            const stats = career.profile.stats;
            let record = 0;
            try { record = Number(localStorage.getItem('boSurvivalFastest')) || 0; } catch (_) {}
            const numbers = [
                ['Expeditions', stats.runs], ['Extractions', stats.extracts], ['Eliminations', stats.kills],
                ['Bosses defeated', stats.bosses], ['Shrines kindled', stats.shrinesKindled], ['Tech unlocked', stats.techUnlocked],
                ['Weapons forged', stats.weaponsForged], ['Blood Moons survived', stats.bloodMoons], ['Contracts claimed', stats.quests],
                ['Items crafted', stats.crafted], ['Structures built', stats.built], ['Salvage collected', stats.salvaged]
            ];
            const unlocks = [...data.vehicles, ...data.areas.filter((area) => area.level > 1)];
            return `<dl class="survival-stats">${numbers.map(([label, count]) => `<div><dt>${label}</dt><dd>${count || 0}</dd></div>`).join('')}
                ${record ? `<div><dt>Fastest extraction</dt><dd>${BO.Math.formatTime(record)}</dd></div>` : ''}</dl>
                <ul class="survival-unlocks">${unlocks.map(({ name, level }) =>
                    `<li><strong>${name}</strong> <span>${career.level >= level ? 'Unlocked' : 'Level ' + level}</span></li>`).join('')}</ul>`;
        }

        render() {
            const mode = BO.SurvivalMode;
            const campaign = mode.campaign;
            this.closeButton.textContent = this.section === 'briefing' ? 'BACK' : (this.section === 'legend' && this.returnSection === 'briefing' ? 'BACK TO BRIEFING' : 'RESUME');
            if (this.section === 'briefing') {
                this.content.innerHTML = this.renderBriefing();
                const modHost = this.content.querySelector('#survival-mod-menu-host');
                if (modHost && BO.ModifierMenuUI) {
                    BO.ModifierMenuUI.bindContainer(modHost, {
                        mode: 'survival',
                        getActive: () => career.profile.options.modifiers || [],
                        onChange: (nextArr) => {
                            const updated = { ...career.profile.options, modifiers: nextArr };
                            career.remember(updated);
                            this._refreshBriefingHints(updated);
                        }
                    });
                }
                return;
            }
            if (this.section === 'legend') {
                this.title.textContent = 'Survival legend & encyclopedia';
                const nav = campaign ? this.navBar() : '';
                this.content.innerHTML = nav + (BO.SurvivalLegend ? BO.SurvivalLegend.render(this.legendQuery || '', this.legendCat || 'all') : '<p>Legend loading...</p>');
                return;
            }
            if (!campaign) return;
            const deep = campaign.deep;
            if (this.section === 'respawn') {
                this.title.textContent = 'You fell in the Exclusion Zone';
                this.content.innerHTML = `<p>Your Aether Soul Echo dropped at your last location${deep?.lostEcho ? ` holding <b>${deep.lostEcho.runes} Aether Runes</b>` : ''}.</p>
                    <p>You can return safely to your Sanctuary Grace or Field Bed with full health and refilled Aether Flask, or end this expedition now.</p>
                    <div class="chip-row">
                        <button class="btn btn-primary" data-respawn="yes" type="button">RESPAWN AT SANCTUARY</button>
                        <button class="btn" data-finish-run="yes" type="button">END EXPEDITION</button>
                    </div>`;
                return;
            }

            const p = BO.Player;
            const supplies = mode.points;
            const openSec = mode.openingSeconds || 60;
            const safeLeft = Math.max(0, Math.ceil(openSec - mode.clock));
            const graceNote = !mode.hostilesReleased ? `<p class="survival-safe-pill">🛡 OPENING SAFE PERIOD: ${safeLeft}s remaining — No enemies can spawn yet.</p>` : '';
            const stats = `<p class="survival-vitals">${campaign.clockFace} · Day ${Math.floor((campaign.options.startHour + mode.clock / campaign.options.dayLength * 24 + campaign.restHours) / 24) + 1} · HP ${Math.ceil(p.hp)}/${p.maxHp} · Hunger ${Math.floor(mode.hunger)}% · Water ${Math.floor(deep?.hydration ?? 100)}% · Temp ${Math.round(deep?.temp ?? 20)}°C · Rad ${Math.floor(mode.radiation)}% · Flask ${deep?.flaskCharges ?? 0}/${deep?.flaskMax ?? 3} [X]</p>`;
            const inventory = `<p class="survival-supplies">Runes: <b>${deep?.runes ?? 0}</b> · Tech Pts: <b>${deep?.techPoints ?? 0}</b> · Base Lv <b>${deep?.baseLevel ?? 1}</b> · Salvage ${supplies.scrap} · Ingots ${supplies.ingot || 0} · Quartz ${supplies.quartz || 0} · Aether Shards ${supplies.aetherShard || 0}</p>`;
            const feedback = this.feedback ? `<p role="status">${this.feedback}</p>` : '';
            const actions = `<div class="chip-row">
                ${action(`USE FLASK (${deep?.flaskCharges ?? 0}) [X]`, 'use-flask', 'yes', !(deep?.flaskCharges > 0))}
                ${action('USE TRAUMA KIT', 'use', 'medkits', !(supplies.medkits && p.hp < p.maxHp))}
                ${action('EAT RATION', 'use', 'rations', !(supplies.rations && mode.hunger < 100))}
                ${action('DRINK WATER', 'item-use', 'freshWater', !(supplies.freshWater))}
                ${action('SAVE CHECKPOINT', 'save', 'yes', !campaign.canSave())}
                ${career.checkpoint ? action('LOAD CHECKPOINT', 'deploy', 'resume') : ''}
            </div>`;
            const nav = this.navBar();
            let html = '';

            if (this.section === 'pack') {
                this.title.textContent = 'Field backpack & talismans';
                html = this.pack(campaign);
            } else if (this.section === 'chest') {
                this.title.textContent = 'Storage chest';
                html = this.chest(campaign);
            } else if (this.section === 'tech') {
                this.title.textContent = 'Technology tree & attributes [K]';
                html = this.techPanel(campaign);
            } else if (this.section === 'objectives') {
                this.title.textContent = 'Goals, challenges & field journal [O]';
                html = this.objectivesPanel(campaign);
            } else if (this.section === 'shrine') {
                this.title.textContent = 'Site of Grace · Sanctuary';
                html = this.shrinePanel(campaign);
            } else if (this.section === 'infuser') {
                this.title.textContent = 'Aether Infusion Altar';
                html = this.infuserPanel(campaign);
            } else if (this.section === 'workshop') {
                html = this.workshopPanel(campaign, mode);
            } else if (this.section === 'build') {
                html = this.buildPanel(campaign, mode);
            } else if (this.section === 'travel') {
                this.title.textContent = 'Transport and routes';
                html = this.cards(data.vehicles.map((item) => card(item.name, item.detail, campaign.vehicle === item.id
                    ? action('DISMOUNT', 'ride', 'off')
                    : action(campaign.hasVehicle(item.id) ? 'EQUIP' : 'LEVEL ' + item.level, 'ride', item.id, !campaign.hasVehicle(item.id)))));
                html += `<h3>Fast travel (1 Fuel)</h3><div class="chip-row">${data.areas.filter((area) => area.y >= 0 && campaign.visited.has(area.id)).map((area) =>
                    action(area.name, 'travel', area.id, !supplies.fuel || area.id === campaign.area?.id || !campaign.canSave())).join('')}</div>`;
            } else if (this.section === 'record') {
                this.title.textContent = 'Survival career';
                html = this.record();
            } else if (this.section === 'npc') {
                html = this.npc(campaign, mode);
            } else {
                this.title.textContent = 'Exclusion Zone map';
                html = `<p>${mode.objective}</p>${this.map(mode, p)}<p><kbd>3</kbd> Bare Hands · <kbd>L</kbd> Legend · <kbd>K</kbd> Tech · <kbd>O</kbd> Goals · <kbd>J</kbd> Pack · <kbd>B</kbd> Build · <kbd>X</kbd> Flask</p>`;
            }
            this.content.innerHTML = this.careerLine + nav + graceNote + stats + inventory + html + actions + feedback;
        }

        navBar() {
            return `<div class="chip-row survival-nav">${[
                ['map', 'MAP'], ['pack', 'BACKPACK'], ['build', 'BUILD'], ['tech', 'TECH & STATS'],
                ['objectives', 'GOALS & JOURNAL'], ['travel', 'TRAVEL'], ['legend', '📖 LEGEND'], ['record', 'CAREER']
            ].map(([name, label]) => action(label, 'panel', name, this.section === name)).join('')}</div>`;
        }

        techPanel(campaign) {
            const deep = campaign.deep;
            const dd = deepData();
            const tiers = [1, 2, 3, 4].map((tier) => {
                const nodes = (dd.techTree || []).filter((n) => n.tier === tier);
                return `<h4>Tier ${tier}</h4>` + this.cards(nodes.map((n) => {
                    const owned = deep.hasTech(n.id);
                    const reqOk = !n.req || deep.hasTech(n.req);
                    const label = owned ? 'UNLOCKED' : (!reqOk ? 'LOCKED' : `UNLOCK (${n.cost} TP)`);
                    return card(n.name, n.desc, action(label, 'unlock-tech', n.id, owned || !reqOk || deep.techPoints < n.cost), owned ? '#4ade80' : '#a6ddd0');
                }));
            }).join('');
            const attrCost = deep.attributeCost();
            const attrs = this.cards(Object.entries(dd.attributes || {}).map(([id, a]) =>
                card(`${a.name} · Rank ${deep.attributes[id] || 0}`, a.bonus,
                    action(`LEVEL UP (${attrCost} Runes)`, 'upgrade-attr', id, deep.runes < attrCost), a.color)));
            return `<h3>Technology Tree · ${deep.techPoints} Tech Point(s) Available (Zero Creatures)</h3>${tiers}
                <h3>Attributes · ${deep.runes} Aether Runes</h3>${attrs}`;
        }

        objectivesPanel(campaign) {
            const challenges = campaign.objectives.list();
            const cHtml = this.cards(challenges.map((ch) =>
                card(`${ch.name} (${ch.claimed ? 'Claimed' : ch.progress})`, `${ch.info} Reward: ${price(ch.reward)} + ${ch.xp} XP`,
                    action(ch.claimed ? 'CLAIMED' : (ch.ready ? 'CLAIM REWARD' : ch.progress), 'claim-challenge', ch.id, ch.claimed || !ch.ready),
                    ch.claimed ? '#4ade80' : (ch.ready ? '#facc15' : '#a6ddd0'))));
            return `<h3>Active Mode Objective</h3><p>${this.modeObjectiveText()}</p>
                <h3>Field Challenges</h3>${cHtml}
                ${campaign.activities ? campaign.activities.renderJournal() : ''}`;
        }

        modeObjectiveText() {
            return BO.SurvivalMode?.objective || '';
        }

        shrinePanel(campaign) {
            const deep = campaign.deep;
            const dd = deepData();
            const cost = deep.attributeCost();
            const attrs = this.cards(Object.entries(dd.attributes || {}).map(([id, a]) =>
                card(`${a.name} · Rank ${deep.attributes[id] || 0}`, a.bonus, action(`UPGRADE (${cost} Runes)`, 'upgrade-attr', id, deep.runes < cost), a.color)));
            const tals = deep.foundTalismans.size ? this.cards([...deep.foundTalismans].map((id) => {
                const t = dd.talismans[id];
                const eq = deep.equippedTalismans.includes(id);
                return card(t.name, t.effect, action(eq ? 'EQUIPPED (REMOVE)' : 'EQUIP', 'equip-talisman', id), eq ? '#facc15' : '#a6ddd0');
            })) : '<p>Find Talismans in the Exclusion Zone or defeat Zone Bosses to unlock Talisman slots.</p>';
            const warps = deep.allShrines.filter((s) => deep.kindledShrines.has(s.id)).map((s) =>
                action(s.name, 'shrine-travel', s.id, s.id === this.subject)).join('');
            return `<p>Aether Flask refilled (${deep.flaskCharges}/${deep.flaskMax}), Health restored, Bleeding & Infection cured!</p>
                <div class="chip-row">${action('SLEEP UNTIL MORNING', 'sleep-dawn', 'yes', !campaign.canSave())}</div>
                <h3>Level Up Attributes · ${deep.runes} Aether Runes</h3>${attrs}
                <h3>Talismans (${deep.equippedTalismans.length}/3 Equipped)</h3>${tals}
                <h3>Grace Fast-Travel (Free)</h3><div class="chip-row">${warps || '<p>Kindle another Site of Grace to fast-travel between shrines.</p>'}</div>`;
        }

        infuserPanel(campaign) {
            const deep = campaign.deep;
            const dd = deepData();
            return `<p>Active Aether Infusions (${deep.infusions.length}/2 max): <b>${deep.infusions.map((id) => dd.infusions[id]?.name).join(', ') || 'None'}</b></p>
                ${this.cards(Object.entries(dd.infusions || {}).map(([id, inf]) => {
                    const active = deep.hasInfusion(id);
                    return card(inf.name, inf.desc, action(active ? 'ACTIVE' : '2 Quartz + 1 Shard + 120 Runes', 'infuse', id, active || !this.canAffordInfuse(deep)), active ? '#c084fc' : '#a6ddd0');
                }))}`;
        }

        canAffordInfuse(deep) {
            return deep.runes >= 120 && BO.SurvivalMode.canAfford({ quartz: 2, aetherShard: 1 });
        }

        workshopPanel(campaign, mode) {
            const station = campaign.station;
            this.title.textContent = { campfire: 'Campfire cooking', kiln: 'Stone kiln' }[station] || 'Survival workshop';
            const oldRecipes = BO.SurvivalData.recipes.filter((recipe) => station === 'bench' || (station === 'campfire' && recipe.id === 'cook'));
            let html = this.cards(oldRecipes.map((recipe) =>
                card(recipe.name, recipe.detail, action(price(recipe.cost), 'craft', recipe.id, !mode.canAfford(recipe.cost))))) +
                this.frontierRecipes(campaign, station);
            if (station === 'bench') {
                const deep = campaign.deep;
                const w = BO.Player.activeWeapon;
                const mk = w?.survivalMk || 1;
                const upCost = mk === 1 ? { ingot: 2, scrap: 3 } : { ingot: 3, aetherShard: 1, wire: 2 };
                html += `<h3>Upgrade Active Firearm (${w && w.stats.kind !== 'melee' ? `${w.stats.shortName} Mk ${mk}` : 'Hold a gun'})</h3>`;
                html += this.cards([card('Upgrade Weapon Tier', 'Boosts damage & magazine capacity up to Mk III.',
                    action(mk >= 3 ? 'MAX MK III' : `UPGRADE (${BO.SurvivalItemAmounts(upCost)})`, 'upgrade-gun', 'yes', !w || w.stats.kind === 'melee' || mk >= 3 || !deep?.hasTech('t2_gunsmith') || !mode.canAfford(upCost)))]);
                html += `<h3>Forge Weapon Schematics</h3>`;
                html += this.cards((deepData().weaponSchematics || []).map((sch) => {
                    const unlocked = deep?.hasTech(sch.tech) || deep?.unlockedSchematics.has(sch.id);
                    return card(sch.name, unlocked ? `Equip straight into your active weapon slot.` : `Locked — unlock in Tech Tree [K] or loot Boss/Meteor schematic.`,
                        action(unlocked ? BO.SurvivalItemAmounts(sch.cost) : 'LOCKED', 'forge', sch.id, !unlocked || !mode.canAfford(sch.cost)), unlocked ? '#fde047' : '#64748b');
                }));
            }
            return html;
        }

        buildPanel(campaign, mode) {
            this.title.textContent = `Field construction · Homestead Base Lv ${campaign.deep?.baseLevel ?? 1}/5`;
            const target = campaign.buildTarget('wall');
            return `<p>Places in front at grid ${target.x}, ${target.z}. Roofs need a nearby wall. Doors toggle with [E].</p>
                <div class="chip-row">
                    ${action('ROTATE PLACEMENT', 'rotate', 'yes')}
                    ${action('REPAIR NEARBY (1 Salvage)', 'repair-base', 'yes', !mode.canAfford({ scrap: 1 }))}
                    ${action('DISMANTLE NEAREST (<4m)', 'dismantle', 'yes')}
                </div>
                ${this.cards(data.build.map((item) => {
                    const cost = typeof item.cost === 'number' ? { scrap: item.cost } : item.cost;
                    const techOk = !item.tech || campaign.deep?.hasTech(item.tech);
                    return card(item.name, item.detail,
                        action(techOk ? ('PLACE · ' + BO.SurvivalItemAmounts(cost)) : 'TECH LOCKED [K]', 'build', item.id, !techOk || !mode.canAfford(cost) || !campaign.canBuild),
                        techOk ? '#a6ddd0' : '#64748b');
                }))}`;
        }

        pack(campaign) {
            const pack = campaign.pack;
            const deep = campaign.deep;
            const dd = deepData();
            const filter = this.packFilter || 'All';
            const categories = ['All', 'Raw materials', 'Components', 'Consumables', 'Lighting', 'Keys'];
            const open = Object.entries(pack.inventory).filter(([id, count]) => count > 0 && frontier.items[id] &&
                (filter === 'All' || filter === frontier.items[id][1]));
            const toolRows = Object.entries(pack.tools).map(([id, durability]) => {
                const tool = frontier.tools[id];
                return card(tool.name, (durability ? Math.ceil(durability) + ' / ' + tool.wear + ' durability' : 'Worn out') + ' · Tier ' + tool.level,
                    action(pack.equipped === id ? 'EQUIPPED' : 'EQUIP', 'equip-tool', id, pack.equipped === id || durability <= 0));
            });
            const talRows = [...(deep?.foundTalismans || [])].map((id) => {
                const t = dd.talismans[id];
                const eq = deep.equippedTalismans.includes(id);
                return card(t.name, t.effect, action(eq ? 'EQUIPPED (REMOVE)' : 'EQUIP', 'equip-talisman', id), eq ? '#facc15' : '#a6ddd0');
            });
            const filterBar = categories.map((category) => action(category, 'pack-filter', category, category === filter)).join('');
            const usable = new Set(['torch', 'lantern', 'tea', 'bandage', 'repair', 'filter', 'freshWater', 'stew', 'espresso', 'antibiotic', 'broth', 'aetherStim', 'orbitalFlare', 'jugBrew', 'speedTonic', 'staminElixir', 'deadshotTinc']);
            return `<div class="frontier-pack-bar">
                    <strong>${pack.limits.name}</strong>
                    <span>${pack.weight().toFixed(1)} / ${pack.limits.weight} kg</span>
                    <span>${pack.slots()} / ${pack.limits.slots} stacks</span>
                    <meter min="0" max="${pack.limits.weight}" value="${pack.weight()}" aria-label="Pack weight"></meter>
                </div>
                <div class="chip-row frontier-categories">${filterBar}</div>
                ${open.length ? this.cards(open.map(([id, count]) => {
                    const [name, category, kg] = frontier.items[id];
                    return card(name + ' ×' + count, category + ' · ' + (kg * count).toFixed(2) + ' kg',
                        (usable.has(id) ? action('USE', 'item-use', id) : '') +
                        action('DROP ONE', 'drop', id + ':one') + (count > 1 ? action('DROP STACK', 'drop', id + ':all') : ''));
                })) : '<p>No items in this category.</p>'}
                <h3>Talismans (${deep?.equippedTalismans?.length || 0}/3 Equipped)</h3>
                ${talRows.length ? this.cards(talRows) : '<p>Explore landmarks or defeat bosses to collect Talismans.</p>'}
                <h3>Tools</h3>
                ${toolRows.length ? this.cards(toolRows) : '<p>Gather fallen branches, loose stones, and fiber roots by hand. Braid cord for your first tools.</p>'}
                <h3>Hand crafting</h3>${this.frontierRecipes(campaign, 'hand')}`;
        }

        frontierRecipes(campaign, station) {
            const pack = campaign.pack;
            const toolRecipes = Object.keys(frontier.tools).map((id) => pack.recipe(id));
            const available = [...frontier.recipes, ...toolRecipes].filter((entry) => entry.station === station);
            return this.cards(available.map((entry) => {
                const description = entry.tool ? 'Tier ' + entry.tool.level + ' · ' + entry.tool.wear + ' durability' : entry.desc;
                return card(entry.name, description, action(BO.SurvivalItemAmounts(entry.cost), 'handcraft', entry.id, !pack.canCraft(entry)));
            }));
        }

        chest(campaign) {
            const pack = campaign.pack;
            const stored = pack.chests.get(this.subject) || {};
            const inventory = (items, direction) => Object.entries(items).filter(([id, count]) => frontier.items[id] && count > 0)
                .map(([id, count]) => card(frontier.items[id][0] + ' ×' + count, (frontier.items[id][2] * count).toFixed(2) + ' kg',
                    action(direction === 'store' ? 'STORE ONE' : 'TAKE ONE', 'transfer', direction + ':' + id + ':one') +
                    (count > 1 ? action(direction === 'store' ? 'STORE STACK' : 'TAKE STACK', 'transfer', direction + ':' + id + ':all') : '')));
            return `<div class="frontier-chest">
                <section><h3>Backpack · ${pack.weight().toFixed(1)} kg</h3>${this.cards(inventory(pack.inventory, 'store'))}</section>
                <section><h3>Chest · ${pack.weight(stored).toFixed(1)} / 54 kg · ${pack.slots(stored)} / 18 stacks</h3>
                    ${pack.slots(stored) ? this.cards(inventory(stored, 'take')) : '<p>The chest is empty.</p>'}</section>
                </div>`;
        }

        cards(items) {
            return '<div class="expansion-shop-items">' + items.join('') + '</div>';
        }

        npc(campaign, mode) {
            const npc = campaign.contact(this.subject);
            if (!npc) return '';
            this.title.textContent = npc.name;
            const gift = npc.gift && !campaign.claims[npc.id + ':gift'];
            const quest = npc.quest;
            const progress = quest ? campaign.metrics[quest[1]] || 0 : 0;
            const complete = campaign.claims[npc.id + ':quest'];
            const claim = gift || (quest && progress >= quest[2] && !complete);
            return `<p>${npc.hint.trim()}</p>${quest ? `<p>${quest[0]} · ${complete ? 'Claimed' : Math.min(progress, quest[2]) + '/' + quest[2] + ' · ' + quest[3] + ' XP'}</p>` : ''}
                <div class="chip-row">${claim ? action(gift ? 'COLLECT SUPPLIES' : 'CLAIM CONTRACT', 'reward', 'yes') : ''}
                    ${npc.special && !campaign.claims[npc.id + ':special'] ? action(npc.special === 'helper' ? 'RECRUIT' : 'CHALLENGE BOSS', 'special', 'yes') : ''}</div>
                ${this.cards(npc.shop.map((id) => {
                    const item = data.stock[id];
                    const owned = item.vehicle && campaign.hasVehicle(item.vehicle);
                    return card(item.name, price(item.cost), action(owned ? 'AVAILABLE IN TRAVEL' : 'TRADE', 'trade', id, owned || !mode.canAfford(item.cost)));
                }))}`;
        }

        map(mode, player) {
            const locate = (x, z) => `--east:${Math.max(3, Math.min(97, (x + 56) / 112 * 100))}%;--south:${Math.max(3, Math.min(97, (z + 56) / 100 * 100))}%`;
            const deep = mode.campaign.deep;
            const shrines = (deep?.allShrines || []).map((s) => `<span class="map-shrine" style="${locate(s.x, s.z)}">${deep.kindledShrines.has(s.id) ? '✦' : '✧'} ${s.name.split(' ')[0]}</span>`).join('');
            const meteor = deep?.meteor ? `<span class="map-meteor" style="${locate(deep.meteor.x, deep.meteor.z)}">☄ Meteor</span>` : '';
            return `<div class="survival-map ${mode.flooded ? 'is-flooded' : ''}" role="img" aria-label="Exclusion Zone field map">
                ${data.areas.map((area) => `<span style="${locate(area.x, area.z)}"${mode.campaign.visited.has(area.id) ? ' class="visited"' : ''}>
                    ${area.name}${career.level < area.level ? ' · LV ' + area.level : ''}</span>`).join('')}
                ${shrines}${meteor}<strong style="${locate(player.pos.x, player.pos.z)}">YOU</strong></div>`;
        }

        updateHud() {
            const mode = BO.SurvivalMode;
            const hud = document.getElementById('hud-survival');
            hud.hidden = !(mode.active && BO.State.activeMode === 'survival');
            if (hud.hidden) return;
            const campaign = mode.campaign;
            const deep = campaign.deep;
            const vehicle = data.vehicles.find((item) => item.id === campaign.vehicle);
            const boss = mode.zombies.find((unit) => unit.alive && unit.bossLabel && unit.pos.distanceTo(BO.Player.pos) < 26);
            const openSec = mode.openingSeconds || 60;
            const safeLeft = Math.max(0, Math.ceil(openSec - mode.clock));

            let headline = boss ? `${boss.bossLabel} · ${Math.ceil(boss.hp)} HP` : mode.objective;
            if (!mode.hostilesReleased) {
                headline = `🛡 SAFE PREP: ${safeLeft}s (NO ENEMIES) · ${mode.objective}`;
            } else if (deep?.bloodMoonActive) {
                const bmLeft = Math.max(0, Math.ceil(deep.bloodMoonUntil - mode.clock));
                headline = `🌑 CRIMSON BLOOD MOON: ${bmLeft}s · ${headline}`;
            }
            const detail = [
                campaign.area?.name, campaign.clockFace, mode.weather,
                `TEMP ${Math.round(deep?.temp ?? 20)}°C`,
                `H2O ${Math.floor(deep?.hydration ?? 100)}%`,
                `RAD ${Math.floor(mode.radiation)}%`,
                `FLASK[X] ${deep?.flaskCharges ?? 0}/${deep?.flaskMax ?? 3}`,
                `RUNES ${deep?.runes ?? 0}`,
                deep?.stealthFactor < 0.65 ? 'STEALTH' : null,
                vehicle ? vehicle.name : null,
                `${campaign.pack.weight().toFixed(1)}kg`
            ].filter(Boolean).join(' · ');

            hud.classList.toggle('is-safe-prep', !mode.hostilesReleased);
            hud.classList.toggle('is-blood-moon', !!deep?.bloodMoonActive);
            hud.querySelector('strong').textContent = headline;
            hud.querySelector('span').textContent = detail;

            const prompt = BO.HUD.elPrompt;
            const key = BO.Settings.getKeybinds().interact.replace(/^(Key|Digit)/, '');
            if (prompt) {
                prompt.classList.toggle('hidden', !mode.prompt);
                prompt.textContent = mode.prompt ? '[' + key + '] ' + mode.prompt : '';
                prompt.style.color = '#e6f4ee';
                prompt.style.borderColor = '#a6ddd0';
            }
        }
    }

    BO.SurvivalUI = new SurvivalUI();
})(window.BO);
