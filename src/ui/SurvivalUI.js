
(function (BO) {
    'use strict';

    class SurvivalUI {
        get open() { return !!this.dialog?.open; }

        show(section, deploy) {
            if (this.open) return;
            if (!this.dialog) this.create();
            this.section = section;
            this.deploy = deploy;
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
            this.closeButton.onclick = () => {
                const resume = this.section !== 'briefing';
                this.close();
                if (resume) BO.App._safePointerLock();
            };
            this.dialog.addEventListener('cancel', (event) => {
                event.preventDefault();
                this.close();
            });
            this.content.onclick = (event) => {
                const button = event.target.closest('button');
                if (!button) return;
                const { deploy, craft, use } = button.dataset;
                if (deploy) {
                    const callback = this.deploy;
                    this.close();
                    callback({ mode: 'survival', mapId: 'exclusion_zone', difficulty: deploy });
                } else if (craft) {
                    BO.SurvivalMode.craft(craft);
                    this.render();
                } else if (use) {
                    BO.SurvivalMode.useItem(use);
                    this.render();
                }
            };
        }

        close() {
            if (!this.open) return;
            const resume = this.section !== 'briefing';
            this.dialog.close();
            if (resume) BO.App._clearInputState();
        }

        render() {
            const mode = BO.SurvivalMode;
            this.closeButton.textContent = this.section === 'briefing' ? 'BACK' : 'RESUME';
            if (this.section === 'briefing') {
                this.title.textContent = 'Survival · Exclusion Zone';
                let record = 0;
                try { record = Number(localStorage.getItem('boSurvivalFastest')) || 0; } catch (_) {}
                this.content.innerHTML = `
                    <p>Solo expedition. Scavenge the surface, descend into the research trench, defeat the Apex guardian, and extract with the core.</p>
                    <p>Use the field map to plan your route. The shelter has a workshop. Clear an opening in marked walls, sabotage the floodgate, or restore the railway with salvaged supplies.</p>
                    <div class="survival-brief-keys"><span><kbd>M</kbd> Field map and inventory</span><span><kbd>E</kbd> Interact</span><span><kbd>I</kbd> Inspect magazine</span></div>
                    ${record ? `<p>Fastest extraction <strong>${BO.Math.formatTime(record)}</strong></p>` : ''}
                    <div class="chip-row">
                        <button class="btn btn-primary" data-deploy="standard">DEPLOY</button>
                        <button class="btn" data-deploy="hard">DEPLOY · HARD</button>
                    </div>`;
                return;
            }
            const p = BO.Player;
            const supplies = mode.points;
            this.title.textContent = this.section === 'workshop' ? 'Relay shelter workshop' : 'Field map';
            const heading = Math.round(((p.yaw * -180 / Math.PI + 360) % 360 + 360) % 360);
            const stats = `<p class="survival-vitals">${BO.Math.formatTime(mode.clock)} · ${heading}° · Stamina ${Math.floor(p.tacStamina * 100)}% · Health ${Math.ceil(p.hp)} · Rations ${supplies.rations} · Hunger ${Math.round(mode.hunger)}% · Radiation ${Math.round(mode.radiation)}% · Composure ${Math.round(mode.composure)}%</p>`;
            const inventory = `<p class="survival-supplies">Salvage ${supplies.scrap} · Cloth ${supplies.cloth} · Fuel ${supplies.fuel} · MRI coil ${supplies.coil} · Trauma kits ${supplies.medkits}</p>
                <div class="chip-row">
                    <button class="btn btn-sm" data-use="medkits" ${supplies.medkits && p.hp < p.maxHp ? '' : 'disabled'}>USE TRAUMA KIT</button>
                    <button class="btn btn-sm" data-use="rations" ${supplies.rations && mode.hunger < 100 ? '' : 'disabled'}>EAT RATION</button>
                </div>`;
            if (this.section === 'workshop') {
                this.content.innerHTML = stats + inventory + '<div class="expansion-shop-items">' + BO.SurvivalData.recipes.map((recipe) => {
                    const cost = Object.entries(recipe.cost).map(([name, amount]) =>
                        amount + ' ' + ({ scrap: 'salvage', rations: 'ration', coil: 'MRI coil' }[name] || name)).join(' + ');
                    return `<article class="select-card expansion-shop-card" style="--item-color:#a6ddd0">
                        <div class="card-head">${recipe.name}</div><div class="card-sub">${recipe.detail}</div>
                        <button class="btn btn-sm" data-craft="${recipe.id}" ${mode.canAfford(recipe.cost) ? '' : 'disabled'}>${cost}</button>
                    </article>`;
                }).join('') + '</div>';
                return;
            }
            const locate = (x, z) => `--east:${Math.max(3, Math.min(97, (x + 56) / 112 * 100))}%;--south:${Math.max(3, Math.min(97, (z + 56) / 100 * 100))}%`;
            const labels = {
                shelter: 'Shelter', hospital: 'Hospital', dam: 'Dam', depot: 'Depot',
                train: 'Rail', bunker: 'Trench', lookout: 'Evac', squadmate: 'Scout'
            };
            const map = `<div class="survival-map ${mode.flooded ? 'is-flooded' : ''}" role="img" aria-label="Exclusion Zone map">
                ${mode.markers.filter((site) => labels[site.id]).map((site) => `<span style="${locate(site.x, site.z)}"
                    class="${mode.completed.has(site.id) ? 'visited' : ''}">${labels[site.id]}</span>`).join('')}
                <strong style="${locate(p.pos.x, p.pos.z)}">YOU</strong></div>`;
            this.content.innerHTML = `<p>${mode.objective}</p>${map}${stats}${inventory}`;
        }

        updateHud() {
            const mode = BO.SurvivalMode;
            const hud = document.getElementById('hud-survival');
            hud.hidden = !(mode.active && BO.State.activeMode === 'survival');
            if (hud.hidden) return;
            hud.querySelector('strong').textContent = mode.objective;
            hud.querySelector('span').textContent = BO.Math.formatTime(mode.clock) + ' · ' + mode.weather + ' · RAD ' + Math.floor(mode.radiation) + '%';
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
