
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

        get nearbyMachine() {
            return BO.ZombiesMode.activePrompt?.type === 'perk';
        }

        cost(item) {
            return this.mode === 'mp' ? Math.ceil(item.cost / 4) : item.cost;
        }

        show() {
            if (!BO.Player.alive || this.open || BO.State.paused || !BO.Superpowers.enabled) return;
            if (this.mode === 'zombies' && !this.nearbyMachine) {
                BO.Events.emit('hud:toast', { text: 'Find a perk machine to open the Superpower Armory.', color: '#5eead4' });
                return;
            }
            if (this.mode !== 'zombies' && (this.mode !== 'mp' || BO.MPMode.ended ||
                BO.MPMode.killcamActive || BO.MPMode.killcamPendingEnd)) return;
            if (!this.dialog) this.create();
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
                <p class="shop-note"></p>
                <div class="expansion-shop-items"></div>`;
            document.body.append(this.dialog);
            this.title = this.dialog.querySelector('h2');
            this.title.id = 'expansion-shop-title';
            this.dialog.setAttribute('aria-labelledby', this.title.id);
            this.dialog.querySelector('.shop-close').onclick = () => {
                this.close();
                BO.App._safePointerLock();
            };
            this.dialog.addEventListener('cancel', (event) => {
                event.preventDefault();
                this.close();
            });
            this.dialog.addEventListener('mousedown', (event) => {
                if (event.target !== this.dialog) return;
                this.close();
                BO.App._safePointerLock();
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
            this.title.textContent = 'Superpower Armory';
            this.dialog.querySelector('.shop-note').textContent = 'Equip one power per melee slot. Cooldowns continue when you switch powers.';
            this.renderItems();
        }

        renderItems() {
            const currency = this.mode === 'zombies' ? 'PTS' : 'CREDITS';
            this.dialog.querySelector('.shop-balance').textContent = this.balance.toLocaleString() + ' ' + currency;
            const list = this.dialog.querySelector('.expansion-shop-items');
            list.innerHTML = BO.ExpansionData.powers.map((item) => {
                const equipped = BO.Superpowers.equipped?.id === item.id;
                const owned = BO.Superpowers.unlocked.has(item.id);
                const cost = this.cost(item);
                const disabled = equipped || (!owned && cost > this.balance);
                const label = equipped ? 'EQUIPPED' : owned ? 'EQUIP' : cost ? `${cost.toLocaleString()} ${currency}` : 'FREE';
                return `<article class="select-card expansion-shop-card" style="--item-color:${item.color}">
                    <div class="card-head">${item.name}</div>
                    <div class="card-sub">${item.desc}</div>
                    <div class="power-cooldown">${item.cooldown}s cooldown</div>
                    <button type="button" class="btn btn-sm" data-shop-buy="${item.id}" ${disabled ? 'disabled' : ''}>${label}</button>
                </article>`;
            }).join('');
            if (BO.Superpowers.equipped) {
                list.insertAdjacentHTML('beforeend',
                    '<button type="button" class="btn btn-sm" data-shop-buy="unequip">Restore quick melee</button>');
            }
        }

        buy(id) {
            if (!this.open || !BO.Player.alive || !BO.Superpowers.enabled ||
                (this.mode === 'zombies' && !this.nearbyMachine)) return;
            if (id === 'unequip') {
                BO.Superpowers.equipped = null;
                this.renderItems();
                return;
            }
            const item = BO.ExpansionData.powers.find((candidate) => candidate.id === id);
            if (!item) return;
            if (!BO.Superpowers.unlocked.has(id)) {
                const cost = this.cost(item);
                if (this.balance < cost) return;
                this.balance -= cost;
                BO.Superpowers.unlocked.add(id);
            }
            BO.Superpowers.equipped = item;
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
