(function (BO) {
    'use strict';

    const data = BO.SurvivalCampaignData;
    const career = BO.SurvivalCareer;
    const price = (cost) => Object.entries(cost).map(([key, count]) =>
        count + ' ' + ({ scrap: 'salvage', rations: 'ration', coil: 'MRI coil' }[key] || key)).join(' + ');

    const select = (label, name, values, current) =>
        `<label class="survival-option"><span>${label}</span><select name="${name}">${values.map(([id, text]) =>
            `<option value="${id}" ${String(current) === String(id) ? 'selected' : ''}>${text}</option>`).join('')}</select></label>`;
    const checkbox = (label, name, checked) =>
        `<label class="survival-toggle"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''}>${label}</label>`;
    const action = (label, name, value, disabled = false) =>
        `<button type="button" class="btn btn-sm" data-${name}="${value}" ${disabled ? 'disabled' : ''}>${label}</button>`;
    const card = (name, desc, buttons) =>
        `<article class="select-card expansion-shop-card" style="--item-color:#a6ddd0">
            <div class="card-head">${name}</div><div class="card-sub">${desc}</div>
            <div class="chip-row">${buttons}</div>
        </article>`;

    class SurvivalUI {
        get open() { return !!this.dialog?.open; }

        show(section, deploy, subject) {
            if (this.open) return;
            if (!this.dialog) this.create();
            this.section = section;
            this.subject = subject;
            this.deploy = deploy || this.deploy;
            if (section !== 'briefing') {
                BO.App._clearInputState();
                if (document.pointerLockElement) document.exitPointerLock();
            }
            this.dialog.showModal();
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
                this.close();
            });
            this.content.onchange = (event) => {
                if (this.section !== 'briefing' || !event.target.name) return;
                const options = this.readOptions();
                if (event.target.matches('[data-enemy]') && !options.disabledEnemies.includes(event.target.value)) event.target.checked = true;
                if (event.target.name === 'pool') {
                    this.content.querySelector('.survival-pool-detail').textContent = data.pools[career.profile.options.pool].extra;
                }
            };
            this.content.onclick = (event) => {
                const button = event.target.closest('button');
                if (!button) return;
                this.dispatch(button.dataset);
            };
        }

        readOptions() {
            const form = this.content.querySelector('form');
            if (!form) return career.profile.options;
            const value = Object.fromEntries(new FormData(form));
            for (const key of ['weather', 'survivalNeeds', 'autosave']) value[key] = form.elements[key].checked;
            value.disabledEnemies = [...form.querySelectorAll('[data-enemy]:not(:checked)')].map((input) => input.value);
            return career.remember(value);
        }

        dispatch({ deploy, craft, use, panel, build, rotate, ride, travel, reward, trade, special, save }) {
            const mode = BO.SurvivalMode;
            const campaign = mode.campaign;
            if (panel) {
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
            if (craft) mode.craft(craft);
            else if (use) mode.useItem(use);
            else if (rotate) campaign.buildRotation = 1 - campaign.buildRotation;
            else if (build && campaign.build(build)) return this.resume();
            else if (ride && campaign.ride(ride === 'off' ? null : ride)) return this.resume();
            else if (travel && campaign.travel(travel)) return this.resume();
            else if (reward) campaign.reward(this.subject);
            else if (trade) campaign.trade(this.subject, trade);
            else if (special && campaign.special(this.subject)) return this.resume();
            else if (save) {
                const ok = campaign.save();
                this.feedback = ok ? 'Checkpoint saved.' : 'Save unavailable here. Find a safe position outside extraction.';
            }
            this.render();
        }

        resume() {
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
            this.title.textContent = 'Survival deployment';
            return `${this.careerLine}
                <p>Exclusion Zone · solo expedition. Find the research core and reach Evac Ridge.</p>
                <form class="survival-lobby" aria-label="Survival deployment options">
                    ${select('Difficulty', 'difficulty', [['standard', 'Standard'], ['hard', 'Hard']], options.difficulty)}
                    ${select('Enemy pool', 'pool', Object.entries(data.pools).map(([key, pool]) => [key, pool.name]), options.pool)}
                    ${select('Starting time', 'startHour', [[0, '00:00 · Midnight'], [6, '06:00 · Dawn'], [8, '08:00 · Morning'], [12, '12:00 · Noon'], [18, '18:00 · Dusk'], [22, '22:00 · Night']], options.startHour)}
                    ${select('Day length', 'dayLength', [[180, '3 minutes'], [360, '6 minutes'], [720, '12 minutes']], options.dayLength)}
                    ${select('Encounter rate', 'encounterRate', [[0.7, 'Sparse'], [1, 'Standard'], [1.5, 'Intense']], options.encounterRate)}
                    <div class="survival-toggles">
                        ${checkbox('Hunger and radiation damage', 'survivalNeeds', options.survivalNeeds)}
                        ${checkbox('Dynamic weather', 'weather', options.weather)}
                        ${checkbox('Autosave when safe', 'autosave', options.autosave)}
                    </div>
                    <details class="survival-roster"><summary>Customize the infected roster</summary>
                        <p>Enabled types can spawn in this expedition. Story and contract bosses have their own encounters.</p>
                        <div class="survival-roster-list">${BO.ZombiesData.ORDERED_PROGRESSION.map((enemy) =>
                            `<label class="survival-toggle"><input type="checkbox" data-enemy name="enemyRoster" value="${enemy.id}" ${options.disabledEnemies.includes(enemy.id) ? '' : 'checked'}>${enemy.name}</label>`).join('')}</div>
                    </details>
                </form>
                <p class="survival-pool-detail">${data.pools[options.pool].extra}</p>
                <div class="chip-row">
                    <button class="btn btn-primary" data-deploy="new" type="button">DEPLOY</button>
                    ${checkpoint ? action('RESUME CHECKPOINT', 'deploy', 'resume') : ''}
                </div>
                ${checkpoint ? `<p>Checkpoint at ${BO.Math.formatTime(checkpoint.clock)} · a new expedition can replace this save.</p>` : ''}
                <details class="survival-record"><summary>Career stats and unlocks</summary>${this.record()}</details>`;
        }

        record() {
            const stats = career.profile.stats;
            let record = 0;
            try { record = Number(localStorage.getItem('boSurvivalFastest')) || 0; } catch (_) {}
            const numbers = [
                ['Expeditions', stats.runs], ['Extractions', stats.extracts], ['Eliminations', stats.kills],
                ['Bosses defeated', stats.bosses], ['Contracts claimed', stats.quests], ['Items crafted', stats.crafted],
                ['Structures built', stats.built], ['Salvage collected', stats.salvaged], ['Trades', stats.trades]
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
            this.closeButton.textContent = this.section === 'briefing' ? 'BACK' : 'RESUME';
            if (this.section === 'briefing') {
                this.content.innerHTML = this.renderBriefing();
                return;
            }
            if (!campaign) return;
            const p = BO.Player;
            const supplies = mode.points;
            const stats = `<p class="survival-vitals">${campaign.clockFace} · Day ${Math.floor((campaign.options.startHour + mode.clock / campaign.options.dayLength * 24 + campaign.restHours) / 24) + 1} · Health ${Math.ceil(p.hp)} · Hunger ${Math.floor(mode.hunger)}% · Radiation ${Math.floor(mode.radiation)}% · Composure ${Math.floor(mode.composure)}%</p>`;
            const inventory = `<p class="survival-supplies">Salvage ${supplies.scrap} · Cloth ${supplies.cloth} · Fuel ${supplies.fuel} · MRI coil ${supplies.coil} · Rations ${supplies.rations} · Trauma kits ${supplies.medkits}</p>`;
            const feedback = this.feedback ? `<p role="status">${this.feedback}</p>` : '';
            const actions = `<div class="chip-row">
                ${action('USE TRAUMA KIT', 'use', 'medkits', !(supplies.medkits && p.hp < p.maxHp))}
                ${action('EAT RATION', 'use', 'rations', !(supplies.rations && mode.hunger < 100))}
                ${action('SAVE CHECKPOINT', 'save', 'yes', !campaign.canSave())}
                ${career.checkpoint ? action('LOAD CHECKPOINT', 'deploy', 'resume') : ''}
            </div>`;
            const nav = `<div class="chip-row survival-nav">${[['map', 'FIELD MAP'], ['record', 'CAREER'], ['build', 'BUILD'], ['travel', 'TRAVEL']].map(([name, label]) => action(label, 'panel', name, this.section === name)).join('')}</div>`;
            let html = '';
            if (this.section === 'workshop') {
                this.title.textContent = campaign.station === 'campfire' ? 'Campfire cooking' : 'Survival workshop';
                html = this.cards(BO.SurvivalData.recipes.filter((recipe) => campaign.station !== 'campfire' || recipe.id === 'cook').map((recipe) =>
                    card(recipe.name, recipe.detail, action(price(recipe.cost), 'craft', recipe.id, !mode.canAfford(recipe.cost)))));
            } else if (this.section === 'build') {
                this.title.textContent = 'Field construction';
                const target = campaign.buildTarget('wall');
                html = `<p>Places a piece in front of you at grid ${target.x}, ${target.z}. Rotate swaps the placement axis. Roofs need a nearby wall.</p>
                    ${action('ROTATE PLACEMENT', 'rotate', 'yes')}
                    ${this.cards(data.build.map((item) => card(item.name, item.detail,
                        action('PLACE · ' + item.cost + ' SALVAGE', 'build', item.id, supplies.scrap < item.cost || !campaign.canBuild))))}`;
            } else if (this.section === 'travel') {
                this.title.textContent = 'Transport and routes';
                html = this.cards(data.vehicles.map((item) => card(item.name, item.detail, campaign.vehicle === item.id
                    ? action('DISMOUNT', 'ride', 'off')
                    : action(campaign.hasVehicle(item.id) ? 'EQUIP' : 'LEVEL ' + item.level, 'ride', item.id, !campaign.hasVehicle(item.id)))));
                html += `<h3>Fast travel</h3><p>Costs one fuel per trip. Clear nearby hostiles before traveling.</p><div class="chip-row">${data.areas.filter((area) => area.id !== 'trench' && campaign.visited.has(area.id)).map((area) =>
                    action(area.name, 'travel', area.id, !supplies.fuel || area.id === campaign.area?.id || !campaign.canSave())).join('')}</div>`;
            } else if (this.section === 'record') {
                this.title.textContent = 'Survival career';
                html = this.record();
            } else if (this.section === 'npc') {
                html = this.npc(campaign, mode);
            } else {
                this.title.textContent = 'Field map';
                html = `<p>${mode.objective}</p>${this.map(mode, p)}<p><kbd>B</kbd> Build · <kbd>T</kbd> Travel · <kbd>I</kbd> Inspect magazine</p>`;
            }
            this.content.innerHTML = this.careerLine + nav + stats + inventory + html + actions + feedback;
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
            return `<div class="survival-map ${mode.flooded ? 'is-flooded' : ''}" role="img" aria-label="Exclusion Zone field map">
                ${data.areas.map((area) => `<span style="${locate(area.x, area.z)}"${mode.campaign.visited.has(area.id) ? ' class="visited"' : ''}>
                    ${area.name}${career.level < area.level ? ' · LV ' + area.level : ''}</span>`).join('')}
                <strong style="${locate(player.pos.x, player.pos.z)}">YOU</strong></div>`;
        }

        updateHud() {
            const mode = BO.SurvivalMode;
            const hud = document.getElementById('hud-survival');
            hud.hidden = !(mode.active && BO.State.activeMode === 'survival');
            if (hud.hidden) return;
            const campaign = mode.campaign;
            const vehicle = data.vehicles.find((item) => item.id === campaign.vehicle);
            const boss = mode.zombies.find((unit) => unit.alive && unit.bossLabel && unit.pos.distanceTo(BO.Player.pos) < 24);
            const detail = campaign.area?.name + ' · ' + campaign.clockFace + ' · ' + mode.weather + ' · RAD ' + Math.floor(mode.radiation) + '%';
            hud.querySelector('strong').textContent = boss ? boss.bossLabel + ' · ' + Math.ceil(boss.hp) + ' HP' : mode.objective;
            hud.querySelector('span').textContent = detail + ' · LV ' + career.level + (vehicle ? ' · ' + vehicle.name : '');
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
