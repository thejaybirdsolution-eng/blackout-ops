/* In-vault events and challenges. Each instance lives for exactly one floor. */
(function (BO) {
    'use strict';

    const INTERACTIVE = new Set(['shop', 'puzzle', 'sanctuary', 'blessing', 'unlock', 'bowling', 'defend', 'wager', 'fountain', 'forge_room', 'relay_room', 'mimic']);
    const OBJECTIVES = new Set(['puzzle', 'bowling', 'defend', 'mimic']);
    const DEFEND_TIME = 120;
    const RUNES = ['✦', '◈', '☾', '✚'];

    class RPGRoomEvent {
        constructor(mode, room) {
            this.mode = mode;
            this.room = room;
            this.type = room.id;
            this.done = false;
            this.used = false;
            this.elapsed = 0;
            this.active = false;
            this.blocks = OBJECTIVES.has(this.type);
            this.limit = this.type === 'speedrun' ? 37 + Math.min(22, mode.run.floor) + mode.layout.camps.length : 0;
            this.radius = 6;
            this.strikePins = Array.from({ length: 10 }, (_, i) => i);
            this.rolls = 0;
            this.pos = new THREE.Vector3(mode.layout.center.x, 0, mode.layout.center.z);
            if (INTERACTIVE.has(this.type)) this.build();
        }

        get run() { return this.mode.run; }
        get profile() { return this.mode.Profile; }

        build() {
            const group = new THREE.Group();
            const color = new THREE.Color(this.room.color);
            const metal = new THREE.MeshStandardMaterial({ color: 0x303c42, roughness: 0.5, metalness: 0.6 });
            const inlay = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, roughness: 0.4 });
            const brass = new THREE.MeshStandardMaterial({ color: 0xa57a42, roughness: 0.48, metalness: 0.68 });
            const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.8, 0.92, 8), metal);
            pedestal.position.y = 0.46;
            const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.79, 0.86, 0.16, 8), brass);
            group.add(plinth);
            const shapes = {
                puzzle: () => new THREE.DodecahedronGeometry(0.36, 0),
                bowling: () => new THREE.SphereGeometry(0.34, 18, 12),
                relay_room: () => new THREE.TorusKnotGeometry(0.22, 0.075, 40, 8),
                wager: () => new THREE.CylinderGeometry(0.32, 0.32, 0.1, 18),
                forge_room: () => new THREE.BoxGeometry(0.62, 0.31, 0.34)
            };
            const glyph = new THREE.Mesh(shapes[this.type]?.() || new THREE.OctahedronGeometry(0.35, 0), inlay);
            glyph.position.y = 1.24;
            if (this.type === 'mimic' || this.type === 'unlock') {
                pedestal.geometry.dispose();
                pedestal.geometry = new THREE.BoxGeometry(1.5, 0.66, 0.87);
                pedestal.position.y = 0.41;
                const rim = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.16, 0.94), brass);
                rim.position.y = 0.77;
                group.add(rim);
                for (const x of [-0.49, 0.49]) {
                    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.75, 0.9), brass);
                    brace.position.set(x, 0.42, 0);
                    group.add(brace);
                }
            } else if (this.type === 'shop') {
                const counter = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.28, 1.05), brass);
                counter.position.y = 0.78;
                group.add(counter);
            }
            const ring = new THREE.Mesh(new THREE.RingGeometry(this.radius - 0.15, this.radius, 64),
                new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.8, depthWrite: false }));
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = 0.045;
            group.add(pedestal, glyph);
            if (this.type === 'defend') group.add(ring);
            else { ring.geometry.dispose(); ring.material.dispose(); }
            group.position.copy(this.pos);
            BO.World.scene.add(group);
            this.group = group;
            this.orb = glyph;
        }

        dispose() {
            if (!this.group) return;
            this.group.removeFromParent();
            const materials = new Set();
            this.group.traverse((object) => {
                if (!object.isMesh) return;
                object.geometry.dispose();
                materials.add(object.material);
            });
            materials.forEach((material) => material.dispose());
        }

        notify(text) {
            BO.Events.emit('hud:toast', { text, color: this.room.color });
        }

        record(metric) {
            const p = this.profile.data;
            const receipt = this.run.seed + ':' + this.run.floor + ':' + this.type + ':' + metric;
            if (p.challengeReceipts.includes(receipt)) return false;
            p.challengeReceipts.push(receipt);
            if (p.challengeReceipts.length > 300) p.challengeReceipts.shift();
            BO.RPGUnlocks.record(p, metric);
            this.profile.save();
            return true;
        }

        onEnter() {
            if (this.run.roomApplied) return;
            if (this.type === 'thief') {
                const lost = Math.floor(this.run.gold / 2);
                this.run.gold -= lost;
                this.run.roomApplied = true;
                this.mode.Profile.saveRun(this.mode._snapshot());
                this.modal('A shadow in the Vault', `
                    <div class="vault-theft" aria-hidden="true"><div></div><i>◆</i><i>◆</i></div>
                    <p>A cloaked thief snatches your pouch and disappears. You lose ${lost} gold, half of what you were carrying.</p>`,
                    [['Continue', () => this.close()]]);
            } else if (this.type === 'curse') {
                this.run.curse = true;
                this.run.roomApplied = true;
                this.mode.recomputeStats();
                this.mode.Profile.saveRun(this.mode._snapshot());
                this.notify('Curse of the Hollow: take 15% more damage. Extract alive to count toward Night Courier.');
            }
        }

        canUse() { return INTERACTIVE.has(this.type) && !this.done && !this.rolling && !(this.type === 'defend' && this.active) && !(this.type === 'mimic' && this.used); }

        objective() {
            if (this.type === 'speedrun' && !this.done) {
                return this.elapsed < this.limit ? 'Double bonus: ' + Math.ceil(this.limit - this.elapsed) + ' s left' : 'Time expired. You can still clear the room.';
            }
            if (this.type === 'defend' && !this.done) return this.active
                ? 'Hold the circle: ' + Math.floor(this.elapsed) + ' / ' + DEFEND_TIME + ' s. Leaving resets the timer.'
                : 'Use the altar to begin the two-minute defense.';
            if (this.type === 'mimic' && !this.used) return 'Inspect the chest.';
            if (this.blocks) return this.room.desc;
            return '';
        }

        update(dt) {
            if (this.orb) this.orb.rotation.y += dt * 1.4;
            if (this.done) return;
            if (this.type === 'speedrun') this.elapsed += dt;
            if (this.type === 'defend' && this.active) this.updateDefense(dt);
            if (this.type === 'mimic' && this.used && this.mode._livingCount() === 0) this.complete('Mimic defeated.', 42, 'rare');
            if (this.type === 'miniboss' && this.champion?.alive && this.champion.hp < this.champion.maxHp * 0.5 && !this.used) {
                this.used = true;
                this.spawnReinforcements(3);
                this.notify('The champion calls its escort.');
            }
        }

        spawnReinforcements(total) {
            const mode = this.mode;
            const spots = mode.layout.ambushSpots;
            const offset = this.reinforcements || 0;
            for (let i = 0; i < total; i++) {
                const p = spots[(offset + i) % spots.length];
                mode._spawnEnemy(mode._pickArchetype(), p.x, p.z, { aggro: true });
            }
            this.reinforcements = offset + total;
        }

        updateDefense(dt) {
            const player = this.mode.P;
            const inside = Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z) <= this.radius && player.pos.y < 2;
            if (inside) this.elapsed += dt;
            else if (this.elapsed > 0) {
                this.elapsed = 0;
                this.notify('You left the circle. Defense timer reset.');
            }
            if (this.elapsed >= DEFEND_TIME) {
                for (const enemy of this.mode.enemies) enemy.destroy();
                this.mode.enemies = [];
                BO.Combat.setTargetPool([]);
                this.record('defenses');
                this.complete('Area secured.', 100, 'epic');
                return;
            }
            this.spawnClock -= dt;
            if (this.spawnClock <= 0) {
                const space = Math.max(0, 10 - this.mode._livingCount());
                this.spawnReinforcements(Math.min(space, 2 + Math.floor(this.elapsed / 40)));
                this.spawnClock = 6;
            }
        }

        clearBonus() {
            if (this.type !== 'speedrun' || this.done) return 1;
            this.done = true;
            const won = this.elapsed <= this.limit;
            this.mode._dropGold(this.pos, won ? 70 : 35);
            if (won) {
                this.record('speedWins');
                this.notify('Speedrun complete. Double floor-clear XP and gold.');
            }
            return won ? 2 : 1;
        }

        complete(text, gold = 0, rarity = '') {
            this.done = true;
            this.blocks = false;
            if (gold) this.mode._dropGold(this.pos, gold);
            if (rarity) this.mode._dropItem(this.pos.clone().add(new THREE.Vector3(1.3, 0, 0)), this.profile.rollItem({ floor: this.run.floor, minRarity: rarity }));
            this.notify(text);
        }

        close() { BO.RPGUI.closeModal(); }

        modal(title, body, options, closeLabel = 'Back') {
            const handlers = {};
            const buttons = options.map(([label, handler, disabled], i) => {
                handlers['opt' + i] = handler;
                return `<button class="btn btn-sm" data-mact="opt${i}" ${disabled ? 'disabled' : ''}>${label}</button>`;
            }).join('');
            BO.RPGUI._modalKind = 'room-event';
            BO.RPGUI.openModal({ title, kicker: this.room.name, accent: this.room.color, closeLabel, handlers,
                html: body + '<div class="rpg-row-end">' + buttons + '</div>' });
        }

        interact() {
            if (!this.canUse()) return;
            switch (this.type) {
                case 'puzzle': this.puzzle(); break;
                case 'bowling': this.bowling(); break;
                case 'shop': this.shop(); break;
                case 'defend':
                    this.active = true;
                    this.spawnClock = 0;
                    this.notify('Hold the circle for two continuous minutes.');
                    break;
                case 'blessing':
                    this.mode.heal(this.mode.P.maxHp * 0.3);
                    this.complete('Blessed by the Haven.');
                    this.mode._offerBoons('Choose a blessing');
                    break;
                case 'unlock': this.unlock(); break;
                case 'sanctuary': this.sanctuary(); break;
                case 'wager': this.wager(); break;
                case 'fountain': this.fountain(); break;
                case 'forge_room': this.forge(); break;
                case 'relay_room':
                    this.mode.ability.ult = 1;
                    this.mode.ability.cd.primer = this.mode.ability.cd.detonator = 0;
                    this.complete('Ultimate charged. Abilities refreshed.');
                    break;
                case 'mimic':
                    if (this.used) return;
                    this.used = true;
                    this.mode._spawnEnemy(this.mode._pickArchetype(), this.pos.x, this.pos.z - 2.5, { elite: true, aggro: true, hp: 1.3 });
                    this.spawnReinforcements(2);
                    this.notify('Mimic ambush!');
                    break;
            }
        }

        puzzle(recall = false) {
            if (!this.sequence) {
                const length = Math.min(6, 3 + Math.floor(this.run.floor / 8));
                this.sequence = Array.from({ length }, (_, i) => RUNES[(Math.floor(this.run.seed / (7 + i * 11)) + i) % RUNES.length]);
                this.input = [];
            }
            const skip = ['Skip reward', () => { this.complete('Puzzle passed.'); this.close(); }];
            if (!recall) {
                this.input = [];
                this.modal('Memorize the runes', '<div class="vault-runes">' + this.sequence.join(' ') + '</div><p>Repeat the symbols in the same order.</p>',
                    [['I’m ready', () => this.puzzle(true)], skip]);
                return;
            }
            const keys = RUNES.map((rune) => [rune, () => {
                if (rune !== this.sequence[this.input.length]) { this.notify('That rune was out of order. Try again.'); this.puzzle(); return; }
                this.input.push(rune);
                if (this.input.length < this.sequence.length) { this.puzzle(true); return; }
                this.record('puzzles');
                this.complete('Rune puzzle solved.', 48, 'rare');
                this.close();
            }]);
            this.modal('Repeat the sequence', '<p>' + this.input.length + ' / ' + this.sequence.length + ' runes entered</p>', [...keys, ['Show sequence', () => this.puzzle()], skip]);
        }

        bowling() {
            const rows = [[0], [-8, 8], [-16, 0, 16], [-24, -8, 8, 24]];
            const pins = rows.flat();
            const drift = (this.run.seed % 19) - 9;
            const score = 10 - this.strikePins.length;
            let pinId = 0;
            const lane = `<div class="vault-lane" aria-hidden="true">${rows.map(row => '<div class="vault-pin-row">' +
                row.map(() => '<i class="' + (this.strikePins.includes(pinId++) ? '' : 'down') + '"></i>').join('') + '</div>').join('')}<div class="vault-ball"></div></div>`;
            const options = [['Roll', () => {
                const modal = BO.RPGUI.modal;
                const aim = Number(modal.querySelector('[data-bowl="aim"]').value);
                const power = Number(modal.querySelector('[data-bowl="power"]').value);
                const position = aim + drift + (power - 68) * 0.14;
                const radius = Math.max(4, 27 - Math.abs(power - 68) * 0.55);
                this.strikePins = this.strikePins.filter((id) => Math.abs(pins[id] - position) > radius);
                this.rolls++;
                this.rolling = true;
                const ball = modal.querySelector('.vault-ball');
                ball.style.setProperty('--roll-offset', position * 2 + 'px');
                ball.classList.add('rolling');
                const rollId = BO.RPGUI._modalHandlers.opt0;
                modal.querySelector('[data-mact="opt0"]').disabled = true;
                const settle = () => {
                    if (this.mode.roomEvent !== this || !this.mode.active || this.done) return;
                    this.rolling = false;
                    if (!this.strikePins.length && this.rolls === 1) this.record('strikes');
                    if (!this.strikePins.length || this.rolls === 2) {
                        const fallen = 10 - this.strikePins.length;
                        const label = fallen === 10 ? (this.rolls === 1 ? 'Strike!' : 'Spare!') : fallen + ' pins down.';
                        this.complete(label, fallen * 6, fallen === 10 ? 'rare' : '');
                        if (BO.RPGUI._modalHandlers.opt0 === rollId) this.modal(label, '<p>' + fallen + ' of 10 pins knocked down.</p>', [['Leave the lane', () => this.close()]]);
                    } else if (BO.RPGUI._modalHandlers.opt0 === rollId) this.bowling();
                };
                setTimeout(settle, 620);
            }], ['Leave lane', () => { this.complete('Bowling round ended.'); this.close(); }]];
            this.modal('Vault Bowling', lane + `<p>${score}/10 pins · Roll ${this.rolls + 1}/2 · Lane bends ${drift < 0 ? 'left' : 'right'} by ${Math.abs(drift)}. Ideal power is 68.</p>
                <label class="vault-slider">Aim <input type="range" min="-34" max="34" value="${-drift}" data-bowl="aim"><output>${-drift}</output></label>
                <label class="vault-slider">Power <input type="range" min="25" max="100" value="52" data-bowl="power"><output>52</output></label>`, options);
        }

        shop() {
            const options = [
                ['Refill one potion · 28 gold', () => {
                    this.run.potions++; this.shop();
                }, () => this.run.potions >= this.mode.stats.potionsMax, 28],
                ['Heal 40% · 45 gold', () => { this.mode.heal(this.mode.P.maxHp * 0.4); this.shop(); }, () => this.mode.P.hp >= this.mode.P.maxHp, 45],
                ['Buy rare gear · 80 gold', () => {
                    this.used = true;
                    this.mode._dropItem(this.pos.clone().add(new THREE.Vector3(1.3, 0, 0)), this.profile.rollItem({ floor: this.run.floor + 1, minRarity: 'rare' }));
                    this.shop();
                }, () => this.used, 80]
            ].map(([text, buy, blocked, cost]) => [text, () => {
                if (this.run.gold < cost || blocked()) return;
                this.run.gold -= cost;
                buy();
            }, this.run.gold < cost || blocked()]);
            this.modal('Traveling Shop', '<p>You have ' + this.run.gold + ' unbanked gold. Gear appears beside the counter.</p>', options);
        }

        unlock() {
            const p = this.profile.data;
            const options = BO.RPGUnlocks.curios.filter((item) => !p.curios.includes(item.id));
            if (this.run.roomApplied || !options.length) {
                this.complete(options.length ? 'This vault has already been claimed.' : 'You have collected every Vault curio.', options.length ? 0 : 60);
                return;
            }
            const item = options[this.run.seed % options.length];
            p.curios.push(item.id);
            p.unlockRecords.curios = p.curios.length;
            this.run.roomApplied = true;
            this.profile.saveRun(this.mode._snapshot());
            this.complete('Curio unlocked: ' + item.name);
            this.modal(item.name, `<div class="vault-runes" style="color:${item.color}">${item.icon}</div><p>Added permanently. Equip it as a crest in the Haven collection.</p>`, [['Continue', () => this.close()]]);
        }

        sanctuary() {
            this.modal('Sanctuary', '<p>Take one blessing from this altar.</p>', [
                ['Heal 55%', () => { this.mode.heal(this.mode.P.maxHp * 0.55); this.claim('Recovered health.'); }],
                ['Refill one potion', () => { this.run.potions++; this.claim('Potion restored.'); }, this.run.potions >= this.mode.stats.potionsMax]
            ]);
        }

        wager() {
            const cost = 30;
            this.modal('Coin Wager', '<p>Stake 30 unbanked gold. The vault either returns 60 or takes your stake.</p>', [
                ['Wager 30 gold', () => {
                    const won = this.run.seed % 11 < 5;
                    this.run.gold += won ? cost : -cost;
                    this.claim(won ? 'You won the wager.' : 'The vault kept your stake.');
                }, this.run.gold < cost]
            ]);
        }

        fountain() {
            this.modal('Fountain of Exchange', '<p>Choose one exchange.</p>', [
                ['Sell one potion for 55 gold', () => { this.run.potions--; this.run.gold += 55; this.claim('Potion exchanged.'); }, this.run.potions < 1],
                ['Full heal for 65 gold', () => { this.run.gold -= 65; this.mode.heal(this.mode.P.maxHp); this.claim('Fully healed.'); }, this.run.gold < 65]
            ]);
        }

        forge() {
            const items = this.run.pack.filter((item) => item.ilvl < 40);
            const cost = 18;
            this.modal('Field Forge', '<p>Spend 18 unbanked scrap to raise one packed item by two levels.</p>', items.map((item) => [
                item.name.replace(/[&<>"']/g, ''), () => {
                    if (this.run.scrap < cost) return;
                    this.run.scrap -= cost;
                    item.ilvl = Math.min(40, item.ilvl + 2);
                    this.claim('Packed gear reforged.');
                }, this.run.scrap < cost
            ]));
        }

        claim(text) { this.complete(text); this.close(); }
    }
    BO.RPGRoomEvent = RPGRoomEvent;
})(window.BO);
