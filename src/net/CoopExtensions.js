/* ============================================================================
   BLACKOUT OPS — Online Co-op & Versus Extensions (ADR-017)
   Extends BO.Net cleanly without modifying existing Zombies / TD / MP sync:
   - Rogue Lite 2–4p Co-op: 10 Hz host snapshot, gate door voting & hit relay
   - Minigames Same-Room Versus: 2 Hz live score pill & finish standings
   - Supports BO.NetValidation.MockNetChannel for automated 2-peer QA tests
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO = global.BO || {};
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    const Coop = {
        _hooked: false,
        _accRpg: 0,
        _accMg: 0,
        lastRpgSnap: null,
        doorVotes: new Map(),
        versusScores: new Map(),
        versusFinishes: new Map(),

        init() {
            if (this._hooked) return;
            this._hooked = true;
            if (BO.Net && typeof BO.Net._handleMessage === 'function') {
                const origHandle = BO.Net._handleMessage.bind(BO.Net);
                BO.Net._handleMessage = (msg, fromPeerId) => {
                    if (msg && this._isCoopType(msg.type)) {
                        const sender = msg.senderId || fromPeerId || 'peer';
                        if (BO.NetValidation) {
                            const chk = BO.NetValidation.validateMessage(msg, { limiter: BO.Net._rateLimiter, senderId: sender, now: Date.now() });
                            if (!chk.ok) return;
                        }
                        this.handlePacket(msg, sender);
                        if (BO.Net.isHost && (msg.type === 'rpg_door_vote' || msg.type === 'mg_score_update' || msg.type === 'mg_finish')) {
                            BO.Net.broadcast(msg, sender);
                        }
                        return;
                    }
                    origHandle(msg, fromPeerId);
                };
            }
            if (typeof document !== 'undefined') {
                document.addEventListener('bundle:loaded', () => this._ensureModeHooks());
            }
            this._ensureModeHooks();
        },

        _isCoopType(type) {
            return type === 'rpg_snapshot' || type === 'rpg_door_vote' || type === 'rpg_hit_enemy'
                || type === 'mg_score_update' || type === 'mg_finish';
        },

        _ensureModeHooks() {
            if (!this._hRpg && BO.RPGMode && BO.RPGMode.update) {
                this._hRpg = true;
                const origRpgUpdate = BO.RPGMode.update.bind(BO.RPGMode);
                BO.RPGMode.update = (dt) => {
                    origRpgUpdate(dt);
                    if (BO.RPGMode.active && BO.Net?.active && BO.Net.isHost) {
                        this._accRpg += dt;
                        if (this._accRpg >= 0.1) {
                            this._accRpg = 0;
                            this.sendRpgSnapshot();
                        }
                    }
                };
            }
            if (!this._hMg && BO.Minigames && BO.Minigames.update) {
                this._hMg = true;
                const origMgUpdate = BO.Minigames.update.bind(BO.Minigames);
                BO.Minigames.update = (dt) => {
                    origMgUpdate(dt);
                    if (BO.Minigames.active && BO.Net?.active) {
                        this._accMg += dt;
                        if (this._accMg >= 0.5) {
                            this._accMg = 0;
                            this.sendMgScore();
                        }
                    }
                };
                const origMgFinish = BO.Minigames.finish.bind(BO.Minigames);
                BO.Minigames.finish = (label, opts) => {
                    origMgFinish(label, opts);
                    if (BO.Net?.active && BO.Minigames._lastRes) {
                        this.sendMgFinish(BO.Minigames._lastRes);
                    }
                };
            }
        },

        _send(payload) {
            if (this._mockSend) {
                this._mockSend(payload);
                return;
            }
            if (BO.Net?.active) BO.Net.broadcast(payload);
        },

        /* --------------------------------------------- ROGUE LITE 2-4p CO-OP */
        sendRpgSnapshot() {
            const R = BO.RPGMode;
            if (!R || !R.active || !R.run) return;
            const snap = {
                type: 'rpg_snapshot',
                floor: R.run.floor || 1,
                roomType: R.run.roomType || 'combat',
                seed: R.run.seed || 0,
                enemiesAlive: (R.enemies || []).filter((e) => e.alive !== false).length,
                bossHp: R.boss ? Math.round(R.boss.hp || 0) : null
            };
            this._send(snap);
            return snap;
        },

        castRpgDoorVote(gateIndex) {
            const idx = Math.max(0, Math.min(8, Number(gateIndex) || 0));
            const myId = BO.Net?.myPeerId || 'local';
            this.doorVotes.set(myId, idx);
            const pkt = { type: 'rpg_door_vote', gateIndex: idx, senderId: myId };
            this._send(pkt);
            return this.tallyDoorVotes();
        },

        tallyDoorVotes() {
            const counts = new Map();
            let bestIdx = 0, bestVotes = -1;
            for (const gateIndex of this.doorVotes.values()) {
                const c = (counts.get(gateIndex) || 0) + 1;
                counts.set(gateIndex, c);
                if (c > bestVotes) { bestVotes = c; bestIdx = gateIndex; }
            }
            return { winnerGate: bestIdx, votes: bestVotes, totalVoters: this.doorVotes.size };
        },

        sendRpgHit(enemyId, dmg) {
            const pkt = { type: 'rpg_hit_enemy', enemyId, dmg: Math.max(0, Math.round(dmg || 0)) };
            this._send(pkt);
            return pkt;
        },

        /* --------------------------------------------- MINIGAMES VERSUS */
        sendMgScore() {
            const S = BO.Minigames?.session;
            if (!S || !BO.Minigames.def) return null;
            const pkt = {
                type: 'mg_score_update',
                courseId: BO.Minigames.def.id,
                callsign: BO.Save?.data?.callsign || 'PLAYER',
                score: Math.round(S.score || 0),
                elapsed: +(S.elapsed || 0).toFixed(2)
            };
            const myId = BO.Net?.myPeerId || 'local';
            this.versusScores.set(myId, pkt);
            this._send(pkt);
            this._renderVersusHud();
            return pkt;
        },

        sendMgFinish(res) {
            if (!res || !BO.Minigames?.def) return null;
            const pkt = {
                type: 'mg_finish',
                courseId: BO.Minigames.def.id,
                callsign: BO.Save?.data?.callsign || 'PLAYER',
                score: Math.round(res.score || 0),
                stars: res.stars || 0
            };
            const myId = BO.Net?.myPeerId || 'local';
            this.versusFinishes.set(myId, pkt);
            this._send(pkt);
            this._renderVersusHud();
            return pkt;
        },

        /* --------------------------------------------- PACKET DISPATCH */
        handlePacket(msg, sender = 'peer') {
            if (!msg || !msg.type) return;
            if (msg.type === 'rpg_snapshot') {
                this.lastRpgSnap = {
                    floor: msg.floor || 1,
                    roomType: msg.roomType || 'combat',
                    seed: msg.seed || 0,
                    enemiesAlive: msg.enemiesAlive || 0,
                    bossHp: msg.bossHp ?? null,
                    receivedAt: Date.now()
                };
                if (BO.RPGMode?.active && BO.RPGMode.run && !BO.Net?.isHost) {
                    if (BO.RPGMode.run.floor !== msg.floor && typeof msg.floor === 'number') {
                        BO.Events?.emit?.('hud:toast', { text: `CO-OP SQUAD ADVANCED TO FLOOR ${msg.floor}`, color: '#c084fc' });
                    }
                }
            } else if (msg.type === 'rpg_door_vote') {
                this.doorVotes.set(sender, Number(msg.gateIndex) || 0);
            } else if (msg.type === 'rpg_hit_enemy') {
                if (BO.RPGMode?.active && BO.Net?.isHost && Array.isArray(BO.RPGMode.enemies)) {
                    const target = BO.RPGMode.enemies.find((e) => e.id === msg.enemyId);
                    if (target && typeof BO.RPGMode._damageEnemy === 'function') {
                        BO.RPGMode._damageEnemy(target, msg.dmg || 0, { fromPeer: true });
                    }
                }
            } else if (msg.type === 'mg_score_update') {
                this.versusScores.set(sender, {
                    courseId: msg.courseId,
                    callsign: msg.callsign || sender,
                    score: Number(msg.score) || 0,
                    elapsed: Number(msg.elapsed) || 0
                });
                this._renderVersusHud();
            } else if (msg.type === 'mg_finish') {
                this.versusFinishes.set(sender, {
                    courseId: msg.courseId,
                    callsign: msg.callsign || sender,
                    score: Number(msg.score) || 0,
                    stars: Number(msg.stars) || 0
                });
                this._renderVersusHud();
            }
        },

        _renderVersusHud() {
            if (typeof document === 'undefined' || (!this.versusScores.size && !this.versusFinishes.size)) return;
            if (!BO.Minigames?.active && !document.getElementById('mg-results')) return;
            let box = document.getElementById('mg-versus-pill');
            if (!box) {
                box = document.createElement('div');
                box.id = 'mg-versus-pill';
                box.style.cssText = 'position:fixed;top:118px;right:20px;z-index:550;min-width:190px;padding:8px 12px;background:rgba(10,12,16,.84);border:1px solid rgba(56,189,248,.45);border-radius:3px;font-size:11px;color:#e2e8f0;pointer-events:none;';
                document.body.appendChild(box);
            }
            const rows = Array.from(this.versusScores.values()).sort((a, b) => b.score - a.score).slice(0, 4);
            box.innerHTML = `<div style="font-size:9.5px;letter-spacing:.16em;color:#38bdf8;font-weight:700;margin-bottom:4px;">ROOM VERSUS STANDINGS</div>` +
                rows.map((r, i) => `<div style="display:flex;justify-content:space-between;gap:10px;"><span>#${i + 1} ${esc(r.callsign)}</span><b>${Number(r.score).toLocaleString()}</b></div>`).join('');
        },

        clearRoomState() {
            this.lastRpgSnap = null;
            this.doorVotes.clear();
            this.versusScores.clear();
            this.versusFinishes.clear();
            const box = typeof document !== 'undefined' && document.getElementById('mg-versus-pill');
            if (box) box.remove();
        }
    };

    BO.CoopExtensions = Coop;
    Coop.init();
})(window);
