/* ============================================================================
   BLACKOUT OPS — Survival 1.0: Hot loot, the Haul, and corpse runs
   · HOT LOOT: everything you pick up from the world (containers, kills,
     harvests, pickups, drops) is Hot until it goes into secure storage inside
     your base claim. Hot loot cannot be fast-travelled.
   · THE HAUL: depositing Hot loot at home tallies its value, the danger you
     braved and the distance you went, then pays a capped XP bonus with a
     "HAUL SECURED" fanfare. Each item counts once.
   · DEATH: one pipeline. Your carried gear drops in a body bag that despawns
     after 48 in-game hours (lava/acid destroys it; deep water washes it
     ashore). You choose where to wake; six hours pass; you are Weakened until
     a cooked meal or a bed. Radiation, hunger, infection and fractures stay.
     Equipped weapons lose 10% condition. Key items never drop.
============================================================================ */
(function (BO) {
    'use strict';
    const GM = BO.GM;
    const F = () => BO.SurvivalFrontierData;
    const STANDARD_CATS = new Set(['Ammunition', 'Components', 'Consumables', 'Equipment', 'Food', 'Lighting', 'Raw materials', 'Tools']);
    const CAT_VALUE = { Ammunition: 0.35, Components: 4, Consumables: 6, Equipment: 14, Food: 2.5, Lighting: 5, 'Raw materials': 1.4, Tools: 10 };
    const BAG_LIFE_HOURS = 48;
    const HAUL_CAP = 650;

    const Loot = {
        rate: 0, // every frame (cheap)
        hot: {},
        bodies: new Map(),
        haul: null,
        expedition: null,
        crafting: 0,
        pendingRespawn: null,
        weakened: false,

        start(mode, saved) {
            this.mode = mode;
            this.hot = { ...(saved?.hot || {}) };
            this.ledger = JSON.parse(JSON.stringify(saved?.ledger || {}));
            this.bodies = new Map(saved?.bodies || []);
            this.haul = null;
            this.expedition = saved?.expedition || this.freshExpedition();
            this.weakened = !!saved?.weakened;
            this.pendingRespawn = null;
            this.lifetime = saved?.lifetime || { hauls: 0, value: 0, best: 0 };
            this.patch();
            if (this.weakened) this.applyWeakened(true);
            // Re-tag restored body bags (pack.restore recreates them without our flags).
            for (const [id] of this.bodies) {
                const bag = mode.campaign.pack.bags.get(id);
                if (bag) this.styleBody(bag);
                else this.bodies.delete(id);
            }
        },

        stop() {
            this.unpatch();
            if (this.weakened) this.applyWeakened(false);
            this.mode = null;
        },

        snapshot() {
            return { hot: this.hot, ledger: this.ledger, bodies: [...this.bodies], expedition: this.expedition, weakened: this.weakened, lifetime: this.lifetime };
        },

        freshExpedition() { return { maxThreat: 1, far: 0, night: false, kills: 0, startedAt: this.mode?.clock || 0 }; },

        /* ---------------------------------------------------------- patches */
        patch() {
            const m = this.mode;
            const pack = m.campaign.pack;
            const self = this;
            this._orig = {
                receive: pack.receive, craft: pack.craft, transfer: pack.transfer, collectBag: pack.collectBag,
                travel: m.campaign.travel, use: pack.use
            };
            pack.receive = function (items, overflow = true) {
                const res = self._orig.receive.call(this, items, overflow);
                if (!self.crafting) self.addHot(res.accepted);
                return res;
            };
            pack.craft = function (id) {
                self.crafting++;
                try { return self._orig.craft.call(this, id); } finally { self.crafting--; }
            };
            pack.collectBag = function (id) {
                const bag = this.bags.get(id);
                const body = self.bodies.get(id);
                if (body) self.crafting++; // your own gear is not new loot
                try { self._orig.collectBag.call(this, id); } finally { if (body) self.crafting--; }
                if (body && !this.bags.has(id)) {
                    self.bodies.delete(id);
                    // Restore the Hot status the gear had when you fell.
                    if (body.hot) self.addHot(body.hot);
                    GM.banner('GEAR RECOVERED', 'CORPSE RUN COMPLETE', '#8fe3c8');
                    GM.sting('first');
                    m.campaign.mark('corpseRuns', 1, 60);
                } else if (body && bag) {
                    body.hot = body.hot || {};
                }
            };
            pack.transfer = function (chestId, id, amount, deposit) {
                const before = this.inventory[id] || 0;
                const ok = self._orig.transfer.call(this, chestId, id, amount, deposit);
                if (ok && deposit) {
                    const moved = before - (this.inventory[id] || 0);
                    self.onDeposit(chestId, id, moved);
                } else if (ok) {
                    self.unstashHot(chestId, id, (this.inventory[id] || 0) - before);
                }
                return ok;
            };
            m.campaign.travel = function (id) {
                if (self.hotCount() > 0) { GM.toast('You are carrying Hot loot. Haul it home on foot (or by vehicle) and stash it first.', '#f59e0b'); GM.sting('warning'); return false; }
                if (GM.hasStatus('hunted')) { GM.toast('Something is hunting you. Lose it before you travel.', '#ef4444'); return false; }
                return self._orig.travel.call(this, id);
            };
        },

        unpatch() {
            if (!this._orig || !this.mode?.campaign) return;
            const pack = this.mode.campaign.pack;
            pack.receive = this._orig.receive;
            pack.craft = this._orig.craft;
            pack.transfer = this._orig.transfer;
            pack.collectBag = this._orig.collectBag;
            this.mode.campaign.travel = this._orig.travel;
            this._orig = null;
        },

        /* ---------------------------------------------------------- hot loot */
        keyItem(id) {
            const cat = F().items[id]?.[1];
            return !!cat && !STANDARD_CATS.has(cat);
        },

        valueOf(id) {
            const it = F().items[id];
            if (!it) return 0;
            const base = CAT_VALUE[it[1]] ?? 2;
            return base * (0.6 + Math.min(2.4, it[2] * 2));
        },

        addHot(items) {
            if (!items) return;
            let n = 0;
            for (const [id, count] of Object.entries(items)) {
                if (!(count > 0) || this.keyItem(id) || !F().items[id]) continue;
                this.hot[id] = (this.hot[id] || 0) + count;
                n += count;
            }
            if (n) {
                GM.sting('pickup');
                if (n >= 1 && !GM.firsts.has('hot')) GM.first('hot', 'Hot loot', 'Get it into storage at your base to secure the haul');
            }
        },

        reconcile() {
            const inv = this.mode.points;
            const sat = GM.get('storage')?.satchel || {};
            for (const id of Object.keys(this.hot)) {
                const have = (inv[id] || 0) + (sat[id] || 0);
                if (have <= 0) delete this.hot[id];
                else if (this.hot[id] > have) this.hot[id] = have;
            }
        },

        /** Hot loot parked in an insecure container (vehicle trunk, dark outpost) stays Hot when taken back out. */
        stashHot(key, id, n) {
            if (!(n > 0)) return;
            this.hot[id] = Math.max(0, (this.hot[id] || 0) - n);
            if (!this.hot[id]) delete this.hot[id];
            const L = this.ledger[key] || (this.ledger[key] = {});
            L[id] = (L[id] || 0) + n;
        },
        unstashHot(key, id, n) {
            const L = this.ledger[key];
            if (!L || !(n > 0) || !L[id]) return;
            const k = Math.min(n, L[id]);
            L[id] -= k; if (!L[id]) delete L[id];
            this.hot[id] = (this.hot[id] || 0) + k;
        },
        ledgerValue() { let v = 0; for (const L of Object.values(this.ledger)) for (const [id, n] of Object.entries(L)) v += this.valueOf(id) * n; return Math.round(v); },

        hotCount() { let n = 0; for (const v of Object.values(this.hot)) n += v; return n; },
        hotValue() { let v = 0; for (const [id, n] of Object.entries(this.hot)) v += this.valueOf(id) * n; return Math.round(v); },
        isHot(id) { return (this.hot[id] || 0) > 0; },

        secureChest(chestId) {
            const base = GM.get('base');
            if (base?.isSecureChest) return base.isSecureChest(chestId);
            return true;
        },

        onDeposit(chestId, id, moved) {
            if (!(moved > 0) || !(this.hot[id] > 0)) return;
            if (!this.secureChest(chestId)) {
                if (!this._insecureWarned || this._insecureWarned < this.mode.clock) { this._insecureWarned = this.mode.clock + 30; GM.toast('This storage is outside your base. The loot stays Hot here: it only counts as secured inside a base or a lit, fenced outpost.', '#f59e0b'); }
                this.stashHot(chestId, id, Math.min(moved, this.hot[id]));
                return;
            }
            const n = Math.min(moved, this.hot[id]);
            this.hot[id] -= n;
            if (!this.hot[id]) delete this.hot[id];
            if (!this.haul) this.haul = { items: {}, value: 0, at: this.mode.clock };
            this.haul.items[id] = (this.haul.items[id] || 0) + n;
            this.haul.value += this.valueOf(id) * n;
            this.haul.at = this.mode.clock;
        },

        flushHaul() {
            const h = this.haul;
            this.haul = null;
            if (!h || h.value < 1) return;
            const e = this.expedition;
            const danger = 1 + (e.maxThreat - 1) * 0.35 + (e.night ? 0.3 : 0) + Math.min(0.6, e.far / 300);
            const xp = Math.min(HAUL_CAP, Math.round(h.value * danger * 0.6));
            const value = Math.round(h.value);
            this.lifetime.hauls++;
            this.lifetime.value += value;
            this.lifetime.best = Math.max(this.lifetime.best, value);
            const c = this.mode.campaign;
            c.mark('hauls', 1, xp);
            c.mark('haulValue', value, 0);
            BO.ZoneThrill?.xp?.(Math.round(xp * 0.5), 'Haul secured', true);
            const kinds = Object.keys(h.items).length;
            GM.sting('haul');
            GM.banner('HAUL SECURED · ' + value + ' VALUE', kinds + ' KINDS · DANGER ×' + danger.toFixed(2) + ' · +' + xp + ' XP' + (value >= this.lifetime.best && this.lifetime.hauls > 1 ? ' · NEW RECORD' : ''), '#fbbf24');
            this.lastHaul = { value, xp, danger, items: h.items, at: this.mode.clock };
            GM.first('haul', 'Haul secured', 'Prep, go out, bring it home');
            // A new expedition starts from home.
            this.expedition = this.freshExpedition();
        },

        /* ---------------------------------------------------------- update */
        update(dt) {
            const m = this.mode;
            if (!m.campaign) return;
            this.reconcile();
            const p = BO.Player;
            // Expedition danger tracking.
            const region = BO.Zone.regionAt(p.pos.x, p.pos.z);
            const e = this.expedition;
            e.maxThreat = Math.max(e.maxThreat, region.threat || 1);
            if (m.campaign.isNight && m.hostilesReleased) e.night = true;
            const base = GM.get('base');
            const home = base?.homePoint?.() || null;
            if (home) e.far = Math.max(e.far, Math.hypot(p.pos.x - home.x, p.pos.z - home.z));
            // Flush a haul 3 s after the last deposit or when the storage screen closes.
            if (this.haul && (m.clock - this.haul.at > 3 || !BO.SurvivalUI.open)) this.flushHaul();
            // Hot status chip.
            const hc = this.hotCount();
            if (hc > 0) GM.setStatus('hotloot', { label: String(this.hotValue()) }); else GM.clearStatus('hotloot');
            // Body bag decay.
            const hours = m.campaign.totalHours;
            for (const [id, body] of this.bodies) {
                const bag = m.campaign.pack.bags.get(id);
                if (!bag) { this.bodies.delete(id); continue; }
                const left = body.expire - hours;
                bag.marker.label = 'Recover your gear (' + Math.max(0, Math.ceil(left)) + ' h left)';
                if (left <= 0) {
                    bag.marker.alive = false;
                    m.disposeOwned(bag.mesh);
                    m.campaign.pack.bags.delete(id);
                    this.bodies.delete(id);
                    GM.toast('Your body bag has rotted away. That gear is gone.', '#ef4444');
                    GM.sting('warning');
                } else if (left < 6 && !body.warned) {
                    body.warned = true;
                    GM.toast('Your body bag will rot away in under 6 hours.', '#f59e0b');
                }
            }
            if (this.weakened) GM.setStatus('weakened');
        },

        hudChips() {
            const out = [];
            const m = this.mode;
            const p = BO.Player.pos;
            for (const [id, body] of this.bodies) {
                const bag = m.campaign.pack.bags.get(id);
                if (!bag) continue;
                const d = Math.round(Math.hypot(bag.x - p.x, bag.z - p.z));
                out.push({ text: 'Body bag ' + d + ' m · ' + Math.max(0, Math.ceil(body.expire - m.campaign.totalHours)) + ' h', cls: 'danger' });
            }
            return out;
        },

        mapPins() {
            const m = this.mode;
            const out = [];
            for (const [id] of this.bodies) {
                const bag = m.campaign.pack.bags.get(id);
                if (bag) out.push({ x: bag.x, z: bag.z, color: '#ef4444', label: 'Your body bag', glyph: '✚' });
            }
            return out;
        },

        styleBody(bag) {
            bag.body = true;
            bag.mesh.material.color.setHex(0xc84b3c);
            bag.mesh.material.emissive?.setHex(0x7a1d14);
            bag.mesh.scale.set(1.6, 1.4, 1.6);
        },

        /* ---------------------------------------------------------- weakened */
        applyWeakened(on) {
            const p = BO.Player;
            if (on) {
                if (!this._baseMax) this._baseMax = p.maxHp;
                p.maxHp = Math.round(this._baseMax * 0.75);
                p.hp = Math.min(p.hp, p.maxHp);
                GM.setStatus('weakened');
            } else if (this._baseMax) {
                p.maxHp = this._baseMax;
                this._baseMax = 0;
                GM.clearStatus('weakened');
            }
        },
        setWeakened(on) {
            if (on === this.weakened) return;
            this.weakened = on;
            this.applyWeakened(on);
            if (!on) GM.toast('You feel like yourself again. Weakened cleared.', '#a7f3d0');
        },
        staminaRegenMult() { return this.weakened ? 0.7 : 1; },
        onCookedMeal() { if (this.weakened) this.setWeakened(false); },
        onSlept() { if (this.weakened) this.setWeakened(false); },

        /* ---------------------------------------------------------- death */
        hazardAt(pos) {
            if (GM.any('destroysItemsAt', pos)) return 'lava';
            const Z = BO.Zone;
            if (Z.inReservoir?.(pos.x, pos.z) && BO.World.terrainHeight(pos.x, pos.z) < Z.WATER - 1.35) return 'water';
            return null;
        },

        shoreNear(pos) {
            const Z = BO.Zone;
            for (let r = 4; r < 80; r += 4) {
                for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
                    const x = pos.x + Math.cos(a) * r, z = pos.z + Math.sin(a) * r;
                    if (!(Z.inReservoir?.(x, z) && BO.World.terrainHeight(x, z) < Z.WATER - 0.6)) return { x, y: GM.ground(x, z), z };
                }
            }
            return { ...pos };
        },

        /** Called by SurvivalMode.handleDeath. Returns true when handled. */
        handleDeath() {
            const m = this.mode;
            const c = m.campaign;
            const p = BO.Player;
            if (this.pendingRespawn) return true;
            if (c.has('ironRun')) { m.finish(false); return true; }
            m.deaths++;
            c.mark('deaths', 1, 0);
            GM.sting('death');
            let dropPos = { x: p.pos.x, y: p.pos.y, z: p.pos.z };
            if (BO.ZoneDungeons?.inside) {
                const ret = BO.ZoneDungeons.inside.ret;
                dropPos = { x: ret.x, y: GM.ground(ret.x, ret.z, (ret.y || 0) + 2), z: ret.z };
                BO.ZoneDungeons.leave(true);
            } else if (BO.ZoneLegends?.arena) {
                const ret = BO.ZoneLegends.arena.ret;
                dropPos = { x: ret.x, y: GM.ground(ret.x, ret.z, (ret.y || 0) + 2), z: ret.z };
                BO.ZoneLegends.leaveArena(true);
            }
            GM.call('onBeforeDeathDrop', dropPos);
            const bossArena = GM.get('bosses')?.arenaReturn?.();
            if (bossArena) dropPos = bossArena;
            // Gather carried items (key items stay with you).
            const items = {};
            for (const [k, v] of Object.entries(m.points)) {
                if (v > 0 && F().items[k] && !this.keyItem(k)) items[k] = v;
            }
            const hazard = this.hazardAt(dropPos);
            const fireproof = GM.get('gear')?.hasFireproofPack?.();
            let fate = 'bag';
            if (hazard === 'lava' && !fireproof) fate = 'destroyed';
            else if (hazard === 'water') dropPos = this.shoreNear(dropPos);
            if (Object.keys(items).length) {
                if (fate === 'bag') {
                    const id = 'bag:body' + m.deaths + '_' + Math.floor(m.clock);
                    c.pack.dropBag(items, dropPos, id);
                    const bag = c.pack.bags.get(id);
                    if (bag) {
                        this.styleBody(bag);
                        this.bodies.set(id, { expire: c.totalHours + 6 + BAG_LIFE_HOURS, hot: { ...this.hot } });
                    }
                }
                for (const k of Object.keys(items)) m.points[k] = 0;
            }
            this.hot = {};
            // Gear wear.
            for (const w of p.weapons) if (w && w.cond !== undefined) w.cond = Math.max(5, w.cond - (w.maxCond || 100) * 0.1);
            m.lastBody = { ...dropPos };
            this.fate = fate;
            this.pendingRespawn = { at: m.clock, fate, dropPos, hazard };
            this.expedition = this.freshExpedition();
            BO.SurvivalUI.show('gmRespawn');
            return true;
        },

        respawnOptions() {
            const m = this.mode;
            const c = m.campaign;
            const body = m.lastBody || BO.Player.pos;
            const opts = [];
            for (const t of c.objectives.safehouses ? c.objectives.safehouses() : []) opts.push({ ...t, kind: 'Safehouse' });
            for (const piece of c.placed) if (piece.alive && piece.type === 'bed') opts.push({ id: 'bed:' + piece.id, x: piece.x + 1, y: piece.y, z: piece.z, name: 'Field bed', kind: 'Bed' });
            for (const o of GM.get('base')?.outposts?.() || []) opts.push({ id: 'outpost:' + o.id, x: o.x + 1.2, y: o.y, z: o.z, name: o.name, kind: 'Outpost' });
            if (!opts.length) {
                const sp = BO.Zone.map.playerSpawn;
                opts.push({ id: 'crash', x: sp.x + 2, y: BO.World.terrainHeight(sp.x + 2, sp.z), z: sp.z, name: 'The crash site', kind: 'Crash site' });
            }
            for (const o of opts) o.dist = Math.round(Math.hypot(o.x - body.x, o.z - body.z));
            opts.sort((a, b) => a.dist - b.dist);
            return opts;
        },

        respawnAt(optId) {
            const m = this.mode;
            const c = m.campaign;
            const p = BO.Player;
            if (!this.pendingRespawn) return false;
            const opt = this.respawnOptions().find((o) => o.id === optId) || this.respawnOptions()[0];
            this.pendingRespawn = null;
            c.restHours += 6;
            if (c.deep) c.deep.bleeding = 0; // wounds were dressed while you were out
            GM.clearStatus('bleeding');
            p.pos.set(opt.x, GM.ground(opt.x, opt.z, (opt.y || 0) + 2) + 0.1, opt.z);
            p.vel.set(0, 0, 0);
            p.alive = true;
            this.setWeakened(true);
            p.hp = Math.round(p.maxHp * 0.6);
            p.reviveGraceTimer = 5;
            for (const zb of m.zombies) if (zb.zs) zb.zs.state = 'idle';
            const fateText = this.fate === 'destroyed' ? 'YOUR GEAR BURNED WITH YOU' : 'YOUR GEAR WAITS WHERE YOU FELL · ' + BAG_LIFE_HOURS + ' H BEFORE IT ROTS';
            GM.banner('YOU WOKE AT ' + String(opt.name).toUpperCase(), 'SIX HOURS PASSED · WEAKENED · ' + fateText, '#ef6b6b');
            BO.SurvivalUI.close();
            c.save(true, true);
            return true;
        },

        endRun() {
            this.pendingRespawn = null;
            this.mode.finish(false);
        },

        renderRespawn() {
            const esc = GM.esc;
            const opts = this.respawnOptions();
            const pr = this.pendingRespawn || { fate: this.fate };
            const fate = pr.fate === 'destroyed'
                ? '<p class="gm-bad">You died in molten ground. Everything you carried is gone.</p>'
                : pr.hazard === 'water' ? '<p>The current carried your body bag to the nearest shore.</p>'
                    : '<p>Everything you carried is in a body bag where you fell. It rots away in <b>' + BAG_LIFE_HOURS + ' in-game hours</b>.</p>';
            return `<div class="gm-respawn">
                <h3>The Zone took you down — not out.</h3>
                ${fate}
                <ul class="gm-rules"><li>Six hours pass while you recover.</li><li>You wake <b>Weakened</b> (−25% max health, slower stamina) until you eat a cooked meal or sleep in a bed.</li><li>Radiation, hunger, infection and fractures stay with you. Weapons lost 10% condition.</li></ul>
                <h4>Wake at</h4>
                <div class="gm-respawn-list">${opts.map((o, i) => `<button class="sv-btn ${i === 0 ? 'primary' : ''}" data-act="gm" data-arg="respawn:${esc(o.id)}"><b>${esc(o.name)}</b><span>${esc(o.kind)} · ${o.dist} m from your body</span></button>`).join('')}</div>
                <div class="sv-actions center"><button class="sv-btn ghost" data-act="gm" data-arg="endRun">End expedition</button></div>
            </div>`;
        },

        uiAct(cmd, arg) {
            if (cmd === 'respawn') return this.respawnAt(arg), true;
            if (cmd === 'endRun') return this.endRun(), true;
            return false;
        }
    };

    GM.register('loot', Loot);
})(window.BO);
