
(function (BO) {
    'use strict';

    class ExpansionShop {
        get mode() { return BO.State.activeMode; }
        get open() { return !!this.dialog?.open; }

        get balance() {
            return this.mode === 'zombies' ? BO.ZombiesMode.points : BO.MPMode.armoryCredits;
        }

        set balance(value) {
            if (this.mode === 'zombies') BO.ZombiesMode.points = value;
            else BO.MPMode.armoryCredits = value;
        }

        get sodasAllowed() {
            return this.mode === 'zombies' && !BO.ZombiesMode.modifiers.noPerks &&
                !(BO.Cheats?.isActive('choose') && BO.Save.data.chooseConfig?.disNoPerks);
        }

        get nearbyMachine() {
            return ['perk', 'soda_catalog'].includes(BO.ZombiesMode.activePrompt?.type);
        }

        cost(item) {
            return this.mode === 'mp' ? Math.ceil(item.cost / 4) :
                (this.tab === 'sodas' && BO.ZombiesMode.modifiers.freePerks ? 0 : item.cost);
        }

        show(tab) {
            if (!BO.Player.alive || this.open || BO.State.paused) return;
            if (this.mode === 'zombies' && !this.nearbyMachine) {
                BO.Events.emit('hud:toast', { text: 'Find a perk soda machine to browse the shop.', color: '#5eead4' });
                return;
            }
            if (this.mode !== 'zombies' && (this.mode !== 'mp' || !BO.Superpowers.enabled || BO.MPMode.ended ||
                BO.MPMode.killcamActive || BO.MPMode.killcamPendingEnd)) return;
            if (!this.dialog) this.create();
            this.tab = tab || (this.mode === 'zombies' ? 'sodas' : 'powers');
            this.search.value = '';
            BO.App._clearInputState();
            if (document.pointerLockElement) document.exitPointerLock();
            this.dialog.showModal();
            this.render();
        }

        create() {
            this.dialog = document.createElement('dialog');
            this.dialog.className = 'expansion-shop';
            this.dialog.innerHTML = `
                <header class="expansion-shop-head">
                    <div><h2></h2><p class="shop-balance" aria-live="polite"></p></div>
                    <button type="button" class="btn btn-sm shop-close">RESUME</button>
                </header>
                <div class="expansion-shop-tools">
                    <div class="chip-row shop-tabs">
                        <button type="button" class="chip" data-shop-tab="sodas">Sodas</button>
                        <button type="button" class="chip" data-shop-tab="powers">Superpowers</button>
                    </div>
                    <input class="shop-search" type="search" placeholder="Search sodas" aria-label="Search sodas">
                </div>
                <p class="shop-note"></p>
                <div class="expansion-shop-items"></div>`;
            document.body.append(this.dialog);
            this.title = this.dialog.querySelector('h2');
            this.title.id = 'expansion-shop-title';
            this.dialog.setAttribute('aria-labelledby', this.title.id);
            this.search = this.dialog.querySelector('input');
            this.search.oninput = () => this.renderItems();
            this.dialog.querySelector('.shop-close').onclick = () => {
                this.close();
                BO.App._safePointerLock();
            };
            this.dialog.addEventListener('cancel', (event) => {
                event.preventDefault();
                this.close();
            });
            this.dialog.querySelectorAll('[data-shop-tab]').forEach((button) => {
                button.onclick = () => {
                    this.tab = button.dataset.shopTab;
                    this.search.value = '';
                    this.render();
                };
            });
            this.dialog.querySelector('.expansion-shop-items').onclick = (event) => {
                const button = event.target.closest('[data-shop-buy]');
                if (!button) return;
                this.buy(button.dataset.shopBuy);
            };
        }

        close() {
            if (!this.open) return;
            this.dialog.close();
            BO.App._clearInputState();
        }

        render() {
            const canChangeTabs = this.mode === 'zombies' && BO.Superpowers.enabled;
            this.dialog.querySelector('.shop-tabs').hidden = !canChangeTabs;
            this.dialog.querySelectorAll('[data-shop-tab]').forEach((button) => {
                button.setAttribute('aria-pressed', String(button.dataset.shopTab === this.tab));
            });
            this.title.textContent = this.tab === 'sodas' ? 'Perk Soda Machine' : 'Superpower Armory';
            this.search.hidden = this.tab !== 'sodas';
            this.dialog.querySelector('.shop-note').textContent = this.tab === 'sodas'
                ? (this.sodasAllowed ? 'Choose from 30 persistent perks.' : 'Perk purchases are disabled by your match rules.')
                : 'Equip one power per melee slot. Cooldowns continue when you switch powers.';
            this.renderItems();
        }

        renderItems() {
            const isSoda = this.tab === 'sodas';
            const currency = this.mode === 'zombies' ? 'PTS' : 'CREDITS';
            this.dialog.querySelector('.shop-balance').textContent = this.balance.toLocaleString() + ' ' + currency;
            const search = this.search.value.trim().toLowerCase();
            const items = isSoda ? BO.ExpansionData.sodas.filter((item) =>
                (item.name + ' ' + item.desc).toLowerCase().includes(search)) : BO.ExpansionData.powers;
            this.dialog.querySelector('.expansion-shop-items').innerHTML = items.map((item) => {
                const equipped = BO.Superpowers.equipped?.id === item.id;
                const owned = isSoda ? BO.Player.zombiePerks.has(item.id) : BO.Superpowers.unlocked.has(item.id);
                const cost = this.cost(item);
                const disabled = isSoda ? !this.sodasAllowed || owned || cost > this.balance :
                    equipped || !BO.Superpowers.enabled || (!owned && cost > this.balance);
                const label = isSoda && owned ? 'ACTIVE' : equipped ? 'EQUIPPED' : owned ? 'EQUIP' :
                    cost ? `${cost.toLocaleString()} ${currency}` : 'FREE';
                return `<article class="select-card expansion-shop-card" style="--item-color:${item.color}">
                    <div class="card-head">${item.name}</div>
                    <div class="card-sub">${item.desc}</div>
                    ${isSoda ? '' : `<div class="power-cooldown">${item.cooldown}s cooldown</div>`}
                    <button type="button" class="btn btn-sm" data-shop-buy="${item.id}" ${disabled ? 'disabled' : ''}>${label}</button>
                </article>`;
            }).join('') || '<p>No matching sodas.</p>';
            if (!isSoda && BO.Superpowers.equipped) {
                this.dialog.querySelector('.expansion-shop-items').insertAdjacentHTML('beforeend',
                    '<button type="button" class="btn btn-sm" data-shop-buy="unequip">Restore quick melee</button>');
            }
        }

        buy(id) {
            if (!this.open || !BO.Player.alive || (this.mode === 'zombies' && !this.nearbyMachine)) return;
            const isSoda = this.tab === 'sodas';
            if (!isSoda && !BO.Superpowers.enabled) return;
            if (!isSoda && id === 'unequip') {
                BO.Superpowers.equipped = null;
                this.renderItems();
                return;
            }
            const item = (isSoda ? BO.ExpansionData.sodas : BO.ExpansionData.powers).find((candidate) => candidate.id === id);
            if (!item) return;
            const cost = this.cost(item);
            if (isSoda) {
                if (!this.sodasAllowed || BO.Player.zombiePerks.has(id) || this.balance < cost) return;
                this.balance -= cost;
                BO.Player.zombiePerks.add(id);
                BO.Progression.recordStat('zombiesPerksBought', 1);
            } else {
                if (!BO.Superpowers.unlocked.has(id)) {
                    if (this.balance < cost) return;
                    this.balance -= cost;
                    BO.Superpowers.unlocked.add(id);
                }
                BO.Superpowers.equipped = item;
            }
            BO.Sound.playPerkBuy();
            this.renderItems();
        }

        updateHud() {
            const hud = document.getElementById('hud-superpower');
            const power = BO.Superpowers.equipped;
            hud.hidden = !(power && BO.Superpowers.enabled && BO.Player.alive);
            if (hud.hidden) return;
            const shield = BO.Superpowers.shieldUntil > BO.Superpowers.time ? ' • Shield ' + Math.ceil(BO.Superpowers.shield) : '';
            const remaining = Math.ceil(BO.Superpowers.remaining(power.id));
            const key = BO.Settings.getKeybinds().melee.replace(/^(Key|Digit)/, '');
            hud.style.setProperty('--item-color', power.color);
            hud.textContent = `[${key}] ${power.name} • ${remaining ? remaining + 's' : 'READY'}${shield}`;
        }
    }

    BO.ExpansionShop = new ExpansionShop();
})(window.BO);
