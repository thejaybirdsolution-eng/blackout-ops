/* ============================================================================
   BLACKOUT OPS — Online Co-op / Versus (WebRTC peer-to-peer via PeerJS)

   Topology: the player who clicks "HOST" is the authoritative host. Their
   browser runs the real simulation (zombies, bots, waves, castle, scores).
   Friends open the invite link (?join=<hostId>) and connect directly to the
   host. Clients render host-owned enemies as "proxies", send their hits to the
   host, and receive damage back. Every player keeps their own points/gold,
   loadout, perks and weapons.

   Message flow is a star: clients -> host -> (relay) -> other clients.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    const PEER_PREFIX = 'boops-';
    const STATE_INTERVAL = 1 / 20;
    const SNAP_INTERVAL = 1 / 15;
    const MAX_CLIENTS = 7;
    const PEERJS_LOCAL = 'vendor/peerjs.min.js';
    const PEERJS_URL = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
    let peerLibPromise = null;
    function loadScript(src) {
        return new Promise((resolve) => {
            const s = document.createElement('script');
            s.src = src;
            s.async = true;
            s.onload = () => resolve(typeof global.Peer !== 'undefined');
            s.onerror = () => { s.remove(); resolve(false); };
            document.head.appendChild(s);
        });
    }
    function loadPeerLib() {
        if (typeof global.Peer !== 'undefined') return Promise.resolve(true);
        if (!peerLibPromise) {
            peerLibPromise = loadScript(PEERJS_LOCAL).then((ok) => ok ? true : loadScript(PEERJS_URL)).then((ok) => {
                if (!ok) peerLibPromise = null;
                return ok;
            });
        }
        return peerLibPromise;
    }
    const PEER_OPTIONS = {
        debug: 1,
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        }
    };
    // Messages the host forwards to every other client after handling them itself.
    const RELAY = new Set(['ps', 'died', 'door', 'power', 'trap', 'puc', 'leave_match']);

    const num = (v, d = 0) => (typeof v === 'number' && isFinite(v) ? v : d);
    const r2 = (v) => Math.round(num(v) * 100) / 100;
    const clamp = (v, a, b) => (v < a ? a : (v > b ? b : v));
    const cleanName = (s) => String(s || '').replace(/[^A-Za-z0-9 _\-.]/g, '').trim().slice(0, 18) || 'PLAYER';
    const cleanText = (s, max = 40) => String(s || '').replace(/[^A-Za-z0-9 _\-.:!'#+/()]/g, '').slice(0, max);
    const now = () => performance.now();

    function randId(n) {
        const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
        const bytes = new Uint8Array(n);
        (global.crypto || global.msCrypto).getRandomValues(bytes);
        let s = '';
        for (let i = 0; i < n; i++) s += chars[bytes[i] % chars.length];
        return s;
    }

    function toast(text, color = '#38bdf8') {
        BO.Events.emit('hud:toast', { text, color });
        UI.flash(text);
    }

    /* ======================================================================
       SESSION (PeerJS connection management)
    ====================================================================== */
    const Net = BO.Net = {
        role: null,           // 'host' | 'client' | null
        status: 'offline',    // 'offline' | 'connecting' | 'connected'
        peer: null,
        myId: null,
        hostId: null,
        mySlot: 0,
        hostConn: null,
        clientConns: new Map(),
        players: new Map(),   // id -> { id, name, slot }
        lastError: '',

        get active() { return this.status === 'connected'; },
        isHost() { return this.status === 'connected' && this.role === 'host'; },
        isClient() { return this.status === 'connected' && this.role === 'client'; },
        myName() { return cleanName(BO.Save && BO.Save.data && BO.Save.data.callsign); },

        inviteLink() {
            const u = new URL(global.location.href);
            u.search = '';
            u.hash = '';
            u.searchParams.set('join', this.hostId || '');
            return u.toString();
        },

        /** Loads PeerJS on demand, then runs fn. Shows a friendly error if offline. */
        _withLib(role, fn) {
            if (global.location.protocol === 'file:') {
                this._fail('Online play does not work when index.html is opened as a file. Use the hosted GitHub Pages link (or play.bat).');
                return;
            }
            this.leave(true);
            this.role = role;
            this.status = 'connecting';
            this.lastError = '';
            UI.refresh();
            UI.open();
            loadPeerLib().then((ok) => {
                if (this.status !== 'connecting' || this.peer) return; // cancelled meanwhile
                if (!ok) { this._fail('The online library could not load. Online play needs an internet connection — check it and try again.'); return; }
                fn();
            });
        },

        host() { this._withLib('host', () => this._host()); },

        _host() {
            this.leave(true);
            this.role = 'host';
            this.status = 'connecting';
            this.lastError = '';
            const id = PEER_PREFIX + randId(6);
            const peer = this.peer = new global.Peer(id, PEER_OPTIONS);
            peer.on('open', (pid) => {
                if (peer !== this.peer) return;
                this.myId = pid;
                this.hostId = pid;
                this.mySlot = 0;
                this.status = 'connected';
                this.players.clear();
                this.players.set(pid, { id: pid, name: this.myName(), slot: 0 });
                UI.refresh();
            });
            peer.on('connection', (conn) => this._acceptClient(conn));
            peer.on('disconnected', () => {
                // Lost the matchmaking server (existing friends stay connected). Reconnect so new friends can join.
                if (peer === this.peer && !peer.destroyed) { try { peer.reconnect(); } catch (e) {} }
            });
            peer.on('error', (e) => this._onPeerError(e, peer));
            UI.refresh();
            UI.open();
        },

        _acceptClient(conn) {
            conn.on('open', () => {
                if (this.clientConns.size >= MAX_CLIENTS) {
                    try { conn.send({ t: 'full' }); } catch (e) {}
                    setTimeout(() => { try { conn.close(); } catch (e) {} }, 400);
                    return;
                }
                this.clientConns.set(conn.peer, conn);
            });
            conn.on('data', (msg) => this._onHostData(conn, msg));
            conn.on('close', () => this._dropClient(conn.peer));
            conn.on('error', () => this._dropClient(conn.peer));
        },

        _dropClient(id) {
            const had = this.clientConns.has(id) || this.players.has(id);
            this.clientConns.delete(id);
            const p = this.players.get(id);
            this.players.delete(id);
            G.removeRemote(id);
            if (!had) return;
            this.broadcast({ t: 'players', players: this.playerList() });
            if (p) toast(`${p.name} LEFT THE LOBBY`, '#94a3b8');
            UI.refresh();
        },

        playerList() {
            return Array.from(this.players.values()).sort((a, b) => a.slot - b.slot);
        },

        _nextSlot() {
            const used = new Set(Array.from(this.players.values()).map((p) => p.slot));
            let s = 1;
            while (used.has(s)) s++;
            return s;
        },

        _onHostData(conn, msg) {
            if (!msg || typeof msg !== 'object' || typeof msg.t !== 'string') return;
            if (msg.t === 'hello') {
                if (!this.clientConns.has(conn.peer)) return;
                const p = { id: conn.peer, name: cleanName(msg.name), slot: this._nextSlot() };
                this.players.set(conn.peer, p);
                conn.send({ t: 'welcome', you: conn.peer, slot: p.slot, players: this.playerList() });
                this.broadcast({ t: 'players', players: this.playerList() });
                toast(`${p.name} JOINED YOUR LOBBY`, '#22c55e');
                G.syncRemoteRoster();
                G.onPeerJoined(conn.peer);
                UI.refresh();
                return;
            }
            if (msg.t === 'rename') {
                const p = this.players.get(conn.peer);
                if (p) { p.name = cleanName(msg.name); this.broadcast({ t: 'players', players: this.playerList() }); G.syncRemoteRoster(); UI.refresh(); }
                return;
            }
            if (!this.players.has(conn.peer)) return;
            msg.from = conn.peer; // Always stamp the real sender; never trust a client-supplied value.
            if (typeof msg.to === 'string') {
                if (msg.to === this.myId) G.onMessage(msg);
                else {
                    const c = this.clientConns.get(msg.to);
                    if (c && c.open) { try { c.send(msg); } catch (e) {} }
                }
                return;
            }
            if (RELAY.has(msg.t)) this.broadcast(msg, conn.peer);
            G.onMessage(msg);
        },

        join(hostId) { this._withLib('client', () => this._join(hostId)); },

        _join(hostId) {
            this.leave(true);
            this.role = 'client';
            this.status = 'connecting';
            this.hostId = hostId;
            this.lastError = '';
            const peer = this.peer = new global.Peer(undefined, PEER_OPTIONS);
            let timeout = null;
            peer.on('open', (pid) => {
                if (peer !== this.peer) return;
                this.myId = pid;
                const conn = this.hostConn = peer.connect(hostId, { reliable: true, serialization: 'json' });
                timeout = setTimeout(() => {
                    if (peer === this.peer && this.status !== 'connected') {
                        this._fail("Couldn't reach your friend's lobby. Make sure they still have the game open on the HOST screen, then try the link again.");
                    }
                }, 20000);
                conn.on('open', () => conn.send({ t: 'hello', name: this.myName() }));
                conn.on('data', (msg) => {
                    if (peer !== this.peer || !msg || typeof msg !== 'object') return;
                    if (msg.t === 'welcome') {
                        clearTimeout(timeout);
                        this.status = 'connected';
                        this.mySlot = num(msg.slot, 1);
                        this._setPlayers(msg.players);
                        toast('CONNECTED TO LOBBY', '#22c55e');
                        UI.refresh();
                    } else if (msg.t === 'full') {
                        this._fail('That lobby is full (8 players max).');
                    } else if (msg.t === 'host_left') {
                        this._fail('The host closed the lobby.');
                    } else if (this.status === 'connected') {
                        this._onClientData(msg);
                    }
                });
                conn.on('close', () => {
                    if (peer === this.peer && this.role === 'client') this._fail('Lost connection to the host.');
                });
            });
            peer.on('disconnected', () => {
                if (peer === this.peer && !peer.destroyed && this.status !== 'connected') { try { peer.reconnect(); } catch (e) {} }
            });
            peer.on('error', (e) => this._onPeerError(e, peer));
            UI.refresh();
            UI.open();
        },

        _onClientData(msg) {
            if (typeof msg.t !== 'string') return;
            if (msg.t === 'players') {
                this._setPlayers(msg.players);
                UI.refresh();
                return;
            }
            G.onMessage(msg);
        },

        _setPlayers(list) {
            this.players.clear();
            const arr = Array.isArray(list) ? list.slice(0, 8) : [];
            for (const p of arr) {
                if (!p || typeof p.id !== 'string') continue;
                this.players.set(p.id, { id: p.id, name: cleanName(p.name), slot: num(p.slot) });
            }
            G.syncRemoteRoster();
        },

        rename(name) {
            const n = cleanName(name).toUpperCase().slice(0, 16);
            BO.Save.data.callsign = n;
            BO.Save.save();
            if (BO.Menus && BO.Menus.updateAllRankBadges) BO.Menus.updateAllRankBadges();
            if (!this.active) return;
            const me = this.players.get(this.myId);
            if (me) me.name = n;
            if (this.isHost()) { this.broadcast({ t: 'players', players: this.playerList() }); UI.refresh(); }
            else this.send({ t: 'rename', name: n });
        },

        /** Send to everyone (clients go through the host, which relays RELAY types). */
        send(msg) {
            if (!this.active) return;
            if (this.role === 'host') this.broadcast(msg);
            else if (this.hostConn && this.hostConn.open) { try { this.hostConn.send(msg); } catch (e) {} }
        },

        sendTo(id, msg) {
            if (!this.active || !id || id === this.myId) return;
            msg.to = id;
            if (this.role === 'host') {
                const c = this.clientConns.get(id);
                if (c && c.open) { try { c.send(msg); } catch (e) {} }
            } else if (this.hostConn && this.hostConn.open) {
                try { this.hostConn.send(msg); } catch (e) {}
            }
        },

        toHost(msg) {
            if (this.isClient()) this.sendTo(this.hostId, msg);
        },

        broadcast(msg, exceptId) {
            for (const [id, c] of this.clientConns) {
                if (id === exceptId || !c.open) continue;
                try { c.send(msg); } catch (e) {}
            }
        },

        _onPeerError(e, peer) {
            if (peer !== this.peer) return;
            const type = e && e.type;
            if (type === 'unavailable-id' && this.role === 'host') { this._host(); return; }
            if (type === 'peer-unavailable') this._fail("That lobby doesn't exist anymore. Ask your friend to send a fresh invite link.");
            else if (type === 'network' || type === 'server-error' || type === 'socket-error' || type === 'socket-closed') {
                if (this.status === 'connected' && this.role === 'host') return; // keep hosting existing friends
                this._fail("Can't reach the online matchmaking server. Check your internet connection and try again.");
            } else if (type === 'browser-incompatible') this._fail('This browser does not support online play. Try Chrome, Edge or Firefox.');
            else if (this.status !== 'connected') this._fail('Online error: ' + cleanText(type || 'unknown', 30));
        },

        _fail(text) {
            const wasInMatch = G.inMatch && BO.State.screen === 'playing';
            this.leave(true);
            this.lastError = text;
            UI.refresh();
            UI.open();
            if (wasInMatch && BO.App) BO.App.exitToMenu();
        },

        leave(silent) {
            if (this.role === 'host') this.broadcast({ t: 'host_left' });
            const peer = this.peer;
            this.peer = null;
            this.role = null;
            this.status = 'offline';
            this.myId = null;
            this.hostId = null;
            this.hostConn = null;
            this.clientConns.clear();
            this.players.clear();
            G.resetAll();
            if (peer) setTimeout(() => { try { peer.destroy(); } catch (e) {} }, 150);
            if (!silent) this.lastError = '';
            UI.refresh();
        }
    };

    /* ======================================================================
       REMOTE PLAYER (another human, rendered as a soldier)
    ====================================================================== */
    class RemotePlayer {
        constructor(id, name, slot) {
            this.id = id;
            this.name = name;
            this.slot = slot;
            this.isRemotePlayer = true;
            this.pos = new THREE.Vector3();
            this.target = new THREE.Vector3();
            this.yaw = 0;
            this.tYaw = 0;
            this.alive = false;
            this.hp = 100;
            this.maxHp = 100;
            this.kills = 0;
            this.deaths = 0;
            this.score = 0;
            this.points = 0;
            this.crouch = 0;
            this.weaponId = '';
            this.seq = -1;
            this.lastState = 0;
            this.team = 0;
            this.parts = null;
            this.meshTeam = -1;
            this.hitboxes = [];
            this.animPhase = 0;
            this.predDeadUntil = 0;
            this.hasState = false;
            this.standIn = this._makeStandIn();
        }

        _makeStandIn() {
            // Lightweight stand-in for BO.Player used while host AI targets this remote player.
            const rp = this;
            return {
                isStandIn: true,
                pos: rp.pos,
                get alive() { return rp.alive; },
                aetherActive: false,
                cameraShake: 0,
                crouching: false,
                sliding: false,
                mpPerks: [],
                zombiePerks: new Set(),
                takeDamage(amount, attackerPos, isExplosive) {
                    G.sendDamage(rp.id, amount, attackerPos, { src: 'z', ex: !!isExplosive });
                }
            };
        }

        inMatch() {
            return this.hasState && this.seq === G.seq && (now() - this.lastState) < 4000;
        }

        applyState(m) {
            this.seq = num(m.sq, -1);
            this.lastState = now();
            const firstState = !this.hasState;
            this.hasState = true;
            this.target.set(num(m.x), num(m.y), num(m.z));
            this.tYaw = num(m.yw);
            const wasAlive = this.alive;
            this.alive = !!m.a;
            if (this.alive && !wasAlive) this.predDeadUntil = 0;
            this.hp = num(m.hp, 100);
            this.maxHp = Math.max(1, num(m.mh, 100));
            this.kills = num(m.k);
            this.deaths = num(m.d);
            this.score = num(m.s);
            this.points = num(m.pts);
            this.crouch = m.cr ? 1 : 0;
            this.weaponId = cleanText(m.w, 32);
            if (firstState || this.pos.distanceTo(this.target) > 6) {
                this.pos.copy(this.target);
                this.yaw = this.tYaw;
            }
        }

        ensureMesh(team) {
            if (!BO.World.scene) return;
            if (this.parts && this.meshTeam === team && this.parts.root.parent === BO.World.scene) return;
            this.destroyMesh();
            this.parts = BO.CharacterMesh.buildSoldier(team, this);
            this.meshTeam = team;
            this.hitboxes = [];
            this.parts.root.traverse((o) => { if (o.isMesh && o.userData.entity === this) this.hitboxes.push(o); });
            this.label = G.makeNameSprite(this.name, team === 0 ? '#7dd3fc' : '#fca5a5');
            this.label.position.set(0, 2.25, 0);
            this.parts.root.add(this.label);
            this.parts.root.position.copy(this.pos);
            BO.World.scene.add(this.parts.root);
        }

        destroyMesh() {
            if (this.parts && this.parts.root && this.parts.root.parent) this.parts.root.parent.remove(this.parts.root);
            if (this.label && this.label.material) {
                if (this.label.material.map) this.label.material.map.dispose();
                this.label.material.dispose();
            }
            this.parts = null;
            this.label = null;
            this.hitboxes = [];
            this.meshTeam = -1;
        }

        isVisible() {
            return this.inMatch() && this.alive && now() > this.predDeadUntil;
        }

        update(dt) {
            if (!this.parts) return;
            const vis = this.isVisible();
            this.parts.root.visible = vis;
            if (!vis) return;
            const k = 1 - Math.exp(-14 * dt);
            const px = this.pos.x, pz = this.pos.z;
            this.pos.lerp(this.target, k);
            this.yaw += BO.Math.angleDiff(this.yaw, this.tYaw) * k;
            const spd = Math.min(9, Math.hypot(this.pos.x - px, this.pos.z - pz) / Math.max(dt, 0.001));
            this.animPhase += dt * (spd * 2.2 + 1.0);
            this.parts.root.position.copy(this.pos);
            this.parts.root.rotation.y = this.yaw + Math.PI; // soldier models face +Z, FPS camera looks -Z
            const sy = this.crouch ? 0.74 : 1.0;
            this.parts.root.scale.y = BO.Math.damp(this.parts.root.scale.y, sy, 12, dt);
            BO.CharacterMesh.animateLimbs(this.parts, spd, this.animPhase, 0, 0);
        }

        getHitboxMeshes() { return this.hitboxes; }

        /** Called by the local MP mode when we shoot this player (PvP) or by host bots shooting them. */
        takeDamage(dmg, attacker) {
            if (!this.alive) return false;
            const amount = clamp(num(dmg), 0, 100000);
            if (attacker && BO.BotAI && attacker instanceof BO.BotAI) {
                const spec = BO.WeaponsData.get(attacker.weaponId);
                G.sendDamage(this.id, amount, attacker.pos, { src: 'bot', by: attacker.id, n: attacker.name, w: spec ? spec.shortName : 'BOT' });
                return false; // the victim reports its own death
            }
            const w = BO.Player.activeWeapon;
            G.sendDamage(this.id, amount, BO.Player.pos, { src: 'pl', n: Net.myName(), w: w && w.stats ? w.stats.shortName : 'MELEE' });
            this.hp -= amount;
            if (this.hp <= 0) {
                this.predDeadUntil = now() + 1500;
                return true;
            }
            return false;
        }
    }

    /* ======================================================================
       GAME SYNC
    ====================================================================== */
    const G = Net.game = {
        remotes: new Map(),
        inMatch: false,
        matchOver: false,
        opts: null,
        seq: 0,
        applying: false,
        stateAcc: 0,
        snapAcc: 0,
        snapCount: 0,
        fxQueue: [],
        hostFx: [],
        localDown: false,
        localWasAlive: true,
        zProxies: new Map(),
        bProxies: new Map(),
        roster: new Map(),
        puSeq: 0,
        prevState: null,
        mpEndSent: false,
        claimSent: false,
        pendingWinner: null,
        tdVis: { turrets: [], dogs: [], allies: [] },
        hudAcc: 0,
        botCtxFrame: -1,
        botCtxCache: null,
        frame: 0,

        /* ---------- roster ---------- */
        syncRemoteRoster() {
            for (const p of Net.players.values()) {
                if (p.id === Net.myId) continue;
                let rp = this.remotes.get(p.id);
                if (!rp) {
                    rp = new RemotePlayer(p.id, p.name, p.slot);
                    this.remotes.set(p.id, rp);
                } else if (rp.name !== p.name) {
                    rp.name = p.name;
                    rp.destroyMesh();
                }
                rp.slot = p.slot;
            }
            for (const id of Array.from(this.remotes.keys())) {
                if (!Net.players.has(id)) this.removeRemote(id);
            }
        },

        removeRemote(id) {
            const rp = this.remotes.get(id);
            if (!rp) return;
            rp.destroyMesh();
            this.remotes.delete(id);
        },

        anyRemoteAlive() {
            for (const rp of this.remotes.values()) if (rp.inMatch() && rp.alive) return true;
            return false;
        },

        anyPlayerNear(x, z, r) {
            const P = BO.Player;
            if (P.alive && BO.Math.dist2D(P.pos.x, P.pos.z, x, z) < r) return true;
            if (!Net.active) return false;
            for (const rp of this.remotes.values()) {
                if (rp.inMatch() && rp.alive && BO.Math.dist2D(rp.pos.x, rp.pos.z, x, z) < r) return true;
            }
            return false;
        },

        isPvP() {
            return BO.State.activeMode === 'mp' && BO.MPMode && (BO.MPMode.modeType === 'ffa' || BO.MPMode.modeType === 'gun_game');
        },

        /* ---------- match lifecycle ---------- */
        resetAll() {
            this.endMatchLocal();
            for (const id of Array.from(this.remotes.keys())) this.removeRemote(id);
        },

        beginMatch(opts) {
            this.endMatchLocal();
            this.inMatch = Net.active;
            this.opts = BO.Math.deepClone(opts);
            this.matchOver = false;
            this.mpEndSent = false;
            this.claimSent = false;
            this.pendingWinner = null;
            this.localDown = false;
            this.localWasAlive = true;
            this.prevState = null;
            this.snapCount = 0;
            this.fxQueue.length = 0;
            this.hostFx.length = 0;
        },

        endMatchLocal() {
            this.inMatch = false;
            this.zProxies.clear();
            this.bProxies.clear();
            this.roster.clear();
            for (const rp of this.remotes.values()) rp.destroyMesh();
            this.clearTdVisuals();
            UI.setSquadVisible(false);
        },

        afterStart(opts) {
            if (!this.inMatch) return;
            const slot = Net.mySlot || 0;
            const P = BO.Player;
            const map = BO.World.mapData;
            if (opts.mode === 'mp' && map) {
                const isFFA = opts.modeType === 'ffa' || opts.modeType === 'gun_game';
                const list = isFFA ? map.team0Spawns.concat(map.team1Spawns) : map.team0Spawns;
                const sp = list && list.length ? list[(slot * (isFFA ? 3 : 1)) % list.length] : null;
                if (sp) { P.pos.set(sp.x, sp.y || 0, sp.z); P.yaw = sp.yaw || 0; }
            } else if (slot > 0) {
                const off = [[0.9, 0], [-0.9, 0], [0, 0.9], [0, -0.9], [0.9, 0.9], [-0.9, 0.9], [0.9, -0.9]][(slot - 1) % 7];
                const nx = P.pos.x + off[0], nz = P.pos.z + off[1];
                if (BO.World.hasLineOfSight(P.pos.x, P.pos.y + 1, P.pos.z, nx, P.pos.y + 1, nz)) P.pos.set(nx, P.pos.y, nz);
            }
            UI.setSquadVisible(true);
            UI.close();
        },

        onPeerJoined(id) {
            if (!Net.isHost() || !this.inMatch || this.matchOver || BO.State.screen !== 'playing') return;
            Net.sendTo(id, { t: 'start', opts: this.opts, seq: this.seq });
            const doors = [];
            BO.World.interactives.forEach((it, i) => { if (it.type === 'door' && it.opened) doors.push(i); });
            Net.sendTo(id, { t: 'wsync', doors, power: BO.World.powerOn ? 1 : 0 });
        },

        goDown() {
            if (this.localDown) return;
            this.localDown = true;
            if (BO.Combat && BO.Combat.cancelCharge) BO.Combat.cancelCharge();
            const sub = BO.State.activeMode === 'td'
                ? 'SPECTATING — YOU REDEPLOY WHEN THIS WAVE IS CLEARED'
                : 'SPECTATING — YOU RESPAWN NEXT ROUND IF YOUR SQUAD SURVIVES';
            BO.Events.emit('hud:banner', { title: 'YOU ARE DOWN!', sub, color: '#ef4444' });
        },

        respawnLocal() {
            if (!this.localDown) return;
            const P = BO.Player;
            const map = BO.World.mapData;
            const sp = (map && map.playerSpawn) || { x: 0, y: 0, z: 0 };
            P.pos.set(sp.x, sp.y || 0, sp.z);
            P.vel.set(0, 0, 0);
            P.alive = true;
            P.inLastStand = false;
            P.hp = P.maxHp;
            P.reviveGraceTimer = 2.0;
            P.refillAllAmmo();
            this.localDown = false;
            this.localWasAlive = true;
            BO.Events.emit('hud:banner', { title: 'BACK IN THE FIGHT!', sub: 'YOUR SQUAD HELD THE LINE — REDEPLOYED AT SPAWN', color: '#22c55e' });
        },

        /** Returns true when the caller should keep spectating instead of ending the match. */
        handleLocalDeath() {
            if (!Net.active || !this.inMatch) return false;
            if (Net.isClient()) { this.goDown(); return true; }
            if (this.anyRemoteAlive()) { this.goDown(); return true; }
            return false;
        },

        /* ---------- per-frame ---------- */
        update(dt) {
            if (!Net.active || !this.inMatch || BO.State.screen !== 'playing') return;
            this.frame++;
            const pvp = this.isPvP();
            const team = pvp ? 1 : 0;

            for (const rp of this.remotes.values()) {
                if (rp.inMatch()) {
                    rp.ensureMesh(team);
                    rp.team = pvp ? 100 + rp.slot : 0;
                }
                rp.update(dt);
            }

            this._watchLocalDeath();

            this.stateAcc += dt;
            if (this.stateAcc >= STATE_INTERVAL) {
                this.stateAcc = 0;
                this.sendState();
            }

            if (Net.isHost()) {
                this.snapAcc += dt;
                if (this.snapAcc >= SNAP_INTERVAL) {
                    this.snapAcc = 0;
                    this.sendSnapshot();
                }
                this.hostChecks();
            } else {
                this.updateTdVisuals(dt);
            }

            if (pvp && BO.Player.alive) {
                const extra = [];
                for (const rp of this.remotes.values()) {
                    if (rp.isVisible()) for (const m of rp.hitboxes) extra.push(m);
                }
                if (extra.length) BO.Combat.setTargetPool((BO.Combat.targetPool || []).concat(extra));
            }

            this.hudAcc += dt;
            if (this.hudAcc > 0.25) { this.hudAcc = 0; UI.renderSquad(); }
        },

        _watchLocalDeath() {
            const P = BO.Player;
            if (this.localWasAlive && !P.alive && BO.State.activeMode === 'mp') {
                const mp = BO.MPMode;
                const meta = mp && mp.lastKillMeta;
                if (meta && meta.killerKind === 'bot' && Math.abs((meta.killTime || 0) - mp.elapsed) < 1.0) {
                    Net.send({ t: 'died', kn: cleanName(meta.killerName), w: cleanText(meta.weaponLabel, 20), bk: 0 });
                }
            }
            this.localWasAlive = P.alive;
        },

        sendState() {
            const P = BO.Player;
            const w = P.activeWeapon;
            const m = BO.State.activeMode;
            let pts = 0, k = 0, d = 0, s = 0;
            if (m === 'zombies') { pts = BO.ZombiesMode.points; k = BO.ZombiesMode.kills; }
            else if (m === 'td') { pts = BO.TowerDefenseMode.gold; k = BO.TowerDefenseMode.kills; }
            else if (m === 'mp') { k = BO.MPMode.playerKills; d = BO.MPMode.playerDeaths; s = BO.MPMode.playerScore; }
            const msg = {
                t: 'ps', sq: this.seq,
                x: r2(P.pos.x), y: r2(P.pos.y), z: r2(P.pos.z), yw: r2(P.yaw),
                a: P.alive ? 1 : 0, hp: Math.round(P.hp), mh: Math.round(P.maxHp),
                w: w && w.cfg ? w.cfg.id : '', k, d, s, pts: Math.round(pts),
                cr: (P.crouching || P.sliding) ? 1 : 0
            };
            if (this.fxQueue.length) msg.fx = this.fxQueue.splice(0, 24);
            Net.send(msg);
        },

        queueShot(s, e, color, sound) {
            if (!Net.active || !this.inMatch) return;
            if (this.fxQueue.length >= 24) return;
            this.fxQueue.push([r2(s.x), r2(s.y), r2(s.z), r2(e.x), r2(e.y), r2(e.z), color | 0, String(sound || '')]);
        },

        queueHostFx(s, e, color, sound) {
            if (!Net.isHost() || !this.inMatch || this.remotes.size === 0) return;
            if (this.hostFx.length >= 40) return;
            this.hostFx.push([r2(s.x), r2(s.y), r2(s.z), r2(e.x), r2(e.y), r2(e.z), color | 0, String(sound || '')]);
        },

        playFx(list) {
            if (!Array.isArray(list)) return;
            const P = BO.Player;
            let sounds = 0;
            for (const f of list.slice(0, 40)) {
                if (!Array.isArray(f) || f.length < 7) continue;
                const s = new THREE.Vector3(num(f[0]), num(f[1]), num(f[2]));
                const e = new THREE.Vector3(num(f[3]), num(f[4]), num(f[5]));
                BO.FX.spawnTracer(s, e, num(f[6], 0xffd166), 0.022, 0.075);
                const prof = typeof f[7] === 'string' && /^[a-z0-9_]{1,24}$/.test(f[7]) ? f[7] : 'ar_light';
                const dScale = clamp(1 - s.distanceTo(P.pos) / 45, 0, 0.7);
                if (dScale > 0.05 && sounds < 4) { sounds++; BO.Sound.playGunshot(prof, false, false, dScale); }
            }
        },

        sendDamage(toId, amount, fromPos, extra) {
            const msg = Object.assign({ t: 'dmg', a: r2(amount) }, extra || {});
            if (fromPos) msg.p = [r2(fromPos.x), r2(fromPos.y), r2(fromPos.z)];
            Net.sendTo(toId, msg);
        },

        makeNameSprite(text, color) {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 64;
            const g = c.getContext('2d');
            g.font = 'bold 34px Arial, sans-serif';
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            g.lineWidth = 6;
            g.strokeStyle = 'rgba(0,0,0,0.85)';
            g.strokeText(text, 128, 32);
            g.fillStyle = color;
            g.fillText(text, 128, 32);
            const tex = new THREE.CanvasTexture(c);
            const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
            const spr = new THREE.Sprite(mat);
            spr.scale.set(1.6, 0.4, 1);
            return spr;
        },

        /* ---------- host: target selection for zombies ---------- */
        nearestStandIn(zpos) {
            const P = BO.Player;
            let best = null;
            let bd = P.alive ? P.pos.distanceToSquared(zpos) : Infinity;
            for (const rp of this.remotes.values()) {
                if (!rp.inMatch() || !rp.alive) continue;
                const d = rp.pos.distanceToSquared(zpos);
                if (d < bd) { bd = d; best = rp; }
            }
            return best ? best.standIn : null;
        },

        augmentBotCtx(ctx) {
            if (this.botCtxFrame === this.frame && this.botCtxCache && this.botCtxCache.base === ctx) return this.botCtxCache.ctx;
            const extra = [];
            for (const rp of this.remotes.values()) if (rp.inMatch() && rp.alive) extra.push(rp);
            const out = extra.length ? Object.assign({}, ctx, { bots: ctx.bots.concat(extra) }) : ctx;
            this.botCtxFrame = this.frame;
            this.botCtxCache = { base: ctx, ctx: out };
            return out;
        },

        /* ---------- host: snapshots ---------- */
        sendSnapshot() {
            if (Net.clientConns.size === 0) return;
            const m = BO.State.activeMode;
            const snap = { t: 'snap', sq: this.seq, m };
            if (m === 'zombies' || m === 'td') {
                const mode = m === 'zombies' ? BO.ZombiesMode : BO.TowerDefenseMode;
                snap.z = mode.zombies.map((z) => [z.id, z.type, r2(z.pos.x), r2(z.pos.y), r2(z.pos.z), r2(z.yaw),
                    Math.ceil(z.hp), Math.ceil(z.maxHp), z.alive ? 1 : 0, z.attackSwing > 0.6 ? 1 : 0]);
            }
            if (m === 'zombies') {
                const zm = BO.ZombiesMode;
                snap.zm = {
                    r: zm.round, st: zm.state, rem: zm.remainingToSpawn,
                    ex: zm.exfilActive ? 1 : 0, et: r2(zm.exfilTimer), ea: zm.exfilAvailable ? 1 : 0,
                    bs: zm.activeBoss ? zm.activeBoss.id : 0
                };
                if (this.snapCount % 6 === 0) {
                    snap.wp = BO.World.interactives.filter((i) => i.type === 'window').map((i) => i.planksRemaining);
                }
            } else if (m === 'td') {
                const td = BO.TowerDefenseMode;
                const v4 = (o) => [r2(o.pos.x), r2(o.pos.y), r2(o.pos.z), r2(o.yaw)];
                snap.td = {
                    w: td.wave, st: td.state, it: r2(td.intermissionTimer), hh: Math.ceil(td.heartHp),
                    ly: td.layers.map((l) => Math.ceil(l.hp)),
                    dg: td.dogs.map(v4), al: td.allies.map(v4),
                    tu: td.turrets.map((t) => [r2(t.headGroup ? t.headGroup.rotation.y : 0)])
                };
            } else if (m === 'mp') {
                const mp = BO.MPMode;
                snap.b = mp.bots.map((b) => [b.id, r2(b.pos.x), r2(b.pos.y), r2(b.pos.z), r2(b.yaw), b.alive ? 1 : 0, Math.ceil(b.hp), b.kills, b.deaths, b.score]);
                if (this.snapCount % 15 === 0) {
                    snap.ro = mp.bots.map((b) => [b.id, b.team, b.name, b.weaponId, b.unarmed ? 1 : 0, b.bigHeads ? 1 : 0, b.maxHp]);
                }
                snap.mp = {
                    tr: r2(mp.timeRemaining), ts: mp.teamScores.slice(), sl: mp.scoreLimit,
                    dom: mp.domStates.map((f) => [f.owner, r2(f.progress)]),
                    hi: mp.hpIndex, ho: mp.hpOwner, ht: r2(mp.hpTimer)
                };
            }
            if (this.hostFx.length) snap.fx = this.hostFx.splice(0, 40);
            this.snapCount++;
            Net.broadcast(snap);
        },

        hostChecks() {
            const m = BO.State.activeMode;
            if (m === 'zombies') {
                const zm = BO.ZombiesMode;
                const st = zm.state;
                if (this.prevState === 'intermission' && st === 'fighting') {
                    Net.broadcast({ t: 'zround', r: zm.round });
                    this.respawnLocal();
                } else if (this.prevState === 'fighting' && st === 'intermission') {
                    Net.broadcast({ t: 'zclear', r: zm.round });
                }
                this.prevState = st;
            } else if (m === 'td') {
                const td = BO.TowerDefenseMode;
                const st = td.state;
                if (this.prevState === 'intermission' && st === 'spawning') {
                    Net.broadcast({ t: 'td_wave', w: td.wave });
                } else if (this.prevState === 'fighting' && st === 'intermission') {
                    Net.broadcast({ t: 'td_clear', w: td.wave, bonus: 250 + td.wave * 60 });
                    this.respawnLocal();
                }
                this.prevState = st;
            } else if (m === 'mp') {
                const mp = BO.MPMode;
                if (mp.modeType === 'ffa' && !mp.ended && !mp.killcamPendingEnd && !mp.killcamActive) {
                    for (const rp of this.remotes.values()) {
                        if (rp.inMatch() && rp.kills >= mp.scoreLimit) {
                            this.pendingWinner = { id: rp.id, name: rp.name };
                            mp._queueWinnerKillcam(false, `${rp.name} WINS`);
                            break;
                        }
                    }
                }
            }
        },

        mpOutcome(victory) {
            const mp = BO.MPMode;
            const ffa = mp.modeType === 'ffa' || mp.modeType === 'gun_game';
            if (!ffa) return { ffa: false, v: victory, wid: null, wn: '' };
            if (this.pendingWinner) return { ffa: true, wid: this.pendingWinner.id, wn: this.pendingWinner.name };
            // Overall top fragger among host, remote humans and bots
            let wid = Net.myId, wn = Net.myName(), best = mp.playerKills;
            if (mp.modeType === 'gun_game') best = mp.playerGunTier;
            for (const rp of this.remotes.values()) {
                if (rp.inMatch() && rp.kills > best) { best = rp.kills; wid = rp.id; wn = rp.name; }
            }
            if (mp.modeType !== 'gun_game') {
                for (const b of mp.bots) if (b.kills > best) { best = b.kills; wid = null; wn = b.name; }
            }
            if (victory && mp.modeType === 'gun_game') { wid = Net.myId; wn = Net.myName(); }
            return { ffa: true, wid, wn };
        },

        /* ---------- client: snapshot application ---------- */
        applySnap(s) {
            if (num(s.sq, -1) !== this.seq || !this.inMatch || BO.State.screen !== 'playing') return;
            if (s.fx) this.playFx(s.fx);
            const m = BO.State.activeMode;
            if (s.m !== m) return;
            if ((m === 'zombies' || m === 'td') && Array.isArray(s.z)) {
                this.syncZombies(m === 'zombies' ? BO.ZombiesMode : BO.TowerDefenseMode, s.z);
            }
            if (m === 'zombies' && s.zm) {
                const zm = BO.ZombiesMode;
                if (zm.state !== 'ended') {
                    zm.round = Math.max(1, num(s.zm.r, zm.round));
                    if (['intermission', 'fighting', 'exfil'].includes(s.zm.st)) zm.state = s.zm.st;
                    zm.remainingToSpawn = num(s.zm.rem);
                    zm.exfilAvailable = !!s.zm.ea;
                    if (s.zm.ex && !zm.exfilActive) { this.applying = true; try { zm.startExfil(); } finally { this.applying = false; } }
                    zm.exfilTimer = num(s.zm.et, zm.exfilTimer);
                    const boss = s.zm.bs ? this.zProxies.get(s.zm.bs) : null;
                    zm.activeBoss = boss && boss.alive ? boss : null;
                }
                if (Array.isArray(s.wp)) {
                    const wins = BO.World.interactives.filter((i) => i.type === 'window');
                    s.wp.forEach((n, i) => {
                        const w = wins[i];
                        if (!w) return;
                        const cnt = clamp(num(n, w.planksRemaining) | 0, 0, w.maxPlanks);
                        if (cnt === w.planksRemaining) return;
                        w.planksRemaining = cnt;
                        w.plankMeshes.forEach((pm, pi) => { pm.visible = pi < cnt; });
                    });
                }
            } else if (m === 'td' && s.td) {
                const td = BO.TowerDefenseMode;
                if (!td.ended) {
                    td.wave = Math.max(1, num(s.td.w, td.wave));
                    if (['intermission', 'spawning', 'fighting'].includes(s.td.st)) td.state = s.td.st;
                    td.intermissionTimer = num(s.td.it, td.intermissionTimer);
                    td.heartHp = num(s.td.hh, td.heartHp);
                    if (Array.isArray(s.td.ly)) {
                        s.td.ly.forEach((hp, i) => {
                            const l = td.layers[i];
                            if (!l) return;
                            const v = clamp(num(hp, l.hp), 0, l.maxHp);
                            if (v !== l.hp) { l.hp = v; td._syncLayerVisual(l); }
                        });
                    }
                    this.syncTdVisuals(s.td);
                }
            } else if (m === 'mp') {
                if (Array.isArray(s.ro)) this.applyRoster(s.ro);
                if (Array.isArray(s.b)) this.syncBots(s.b);
                if (s.mp) {
                    const mp = BO.MPMode;
                    mp.timeRemaining = num(s.mp.tr, mp.timeRemaining);
                    if (Array.isArray(s.mp.ts)) mp.teamScores = [num(s.mp.ts[0]), num(s.mp.ts[1])];
                    mp.scoreLimit = num(s.mp.sl, mp.scoreLimit);
                    if (Array.isArray(s.mp.dom)) {
                        s.mp.dom.forEach((f, i) => {
                            const d = mp.domStates[i];
                            if (d && Array.isArray(f)) { d.owner = num(f[0], -1); d.progress = num(f[1]); }
                        });
                    }
                    mp.hpIndex = num(s.mp.hi, mp.hpIndex) | 0;
                    mp.hpOwner = num(s.mp.ho, -1);
                    mp.hpTimer = num(s.mp.ht, mp.hpTimer);
                }
            }
        },

        syncZombies(mode, list) {
            const seen = new Set();
            const t = now();
            for (const e of list) {
                if (!Array.isArray(e) || e.length < 10) continue;
                const id = num(e[0]);
                seen.add(id);
                const alive = !!e[8];
                let z = this.zProxies.get(id);
                if (z && z._destroyed) { this.zProxies.delete(id); z = null; }
                if (!z) {
                    if (!alive) continue;
                    z = this.makeZombieProxy(mode, e);
                    if (!z) continue;
                }
                z._netT.x = num(e[2]); z._netT.y = num(e[3]); z._netT.z = num(e[4]); z._netT.yaw = num(e[5]);
                z.maxHp = Math.max(1, num(e[7], z.maxHp));
                if (alive) {
                    if (!z.alive && t > (z._predDeadUntil || 0)) {
                        z.alive = true;
                        z.parts.root.rotation.x = 0;
                        if (z.parts.headGroup) z.parts.headGroup.visible = true;
                        z.decapitated = false;
                    }
                    if (z.alive) z.hp = num(e[6], z.hp);
                    if (e[9]) z.attackSwing = 1.0;
                } else if (z.alive) {
                    z.alive = false;
                    z.hp = 0;
                    z.deathTimer = z.isBoss ? 2.6 : 1.5;
                }
            }
            for (const [id, z] of this.zProxies) {
                if (!seen.has(id)) { z._netRemove = true; this.zProxies.delete(id); }
            }
        },

        makeZombieProxy(mode, e) {
            if (!BO.World.scene) return null;
            const spec = BO.ZombiesData.get(String(e[1]));
            const z = new BO.ZombieEntity({ id: num(e[0]), spec, hp: Math.max(1, num(e[6], 100)), x: num(e[2]), y: num(e[3]), z: num(e[4]), windowInteractive: null });
            z.maxHp = Math.max(1, num(e[7], z.maxHp));
            z.hp = num(e[6], z.hp);
            z.yaw = num(e[5]);
            z.state = 'chase';
            z._netProxy = true;
            z._netT = { x: z.pos.x, y: z.pos.y, z: z.pos.z, yaw: z.yaw };
            const baseDestroy = z.destroy.bind(z);
            z.destroy = function () { this._destroyed = true; baseDestroy(); };
            const baseTakeDamage = BO.ZombieEntity.prototype.takeDamage;
            z.takeDamage = function (amount, hitbox = 'torso', isCrit = false, dir = null, kind = 'bullet') {
                if (!this.alive) return false;
                Net.toHost({ t: 'hit', id: this.id, a: r2(amount), hb: hitbox, k: kind });
                const killed = baseTakeDamage.call(this, amount, hitbox, isCrit, null, kind);
                if (killed) this._predDeadUntil = now() + 900;
                return killed;
            };
            mode.zombies.push(z);
            this.zProxies.set(z.id, z);
            return z;
        },

        updateZombieProxy(z, dt) {
            if (z._netRemove) return false;
            if (!z.alive) {
                z.deathTimer -= dt;
                const dur = z.isBoss ? 2.6 : 1.5;
                const fall = clamp(1 - z.deathTimer / dur, 0, 1);
                z.parts.root.rotation.x = BO.Math.lerp(0, -Math.PI * 0.48, Math.min(1, fall * 4));
                z.parts.root.position.y = z.pos.y - Math.max(0, fall - 0.65) * 1.2;
                return z.deathTimer > -4;
            }
            const T = z._netT;
            const k = 1 - Math.exp(-12 * dt);
            const px = z.pos.x, pz = z.pos.z;
            if (Math.hypot(T.x - z.pos.x, T.z - z.pos.z) > 6) z.pos.set(T.x, T.y, T.z);
            else {
                z.pos.x += (T.x - z.pos.x) * k;
                z.pos.y += (T.y - z.pos.y) * k;
                z.pos.z += (T.z - z.pos.z) * k;
            }
            z.yaw += BO.Math.angleDiff(z.yaw, T.yaw) * k;
            const spd = Math.min(10, Math.hypot(z.pos.x - px, z.pos.z - pz) / Math.max(dt, 0.001));
            if (z.attackSwing > 0) z.attackSwing = Math.max(0, z.attackSwing - dt * 2.5);
            if (z.flinchTimer > 0) z.flinchTimer -= dt;
            z.animPhase += dt * (spd * 2.4 + 1.5);
            z.parts.root.position.set(z.pos.x, z.pos.y, z.pos.z);
            z.parts.root.rotation.y = z.yaw;
            BO.CharacterMesh.animateLimbs(z.parts, spd, z.animPhase, z.attackSwing, z.flinchTimer > 0 ? 1 : 0);
            return true;
        },

        applyRoster(ro) {
            for (const r of ro.slice(0, 40)) {
                if (!Array.isArray(r) || r.length < 7) continue;
                const id = num(r[0]);
                const info = { id, team: num(r[1]), name: cleanName(r[2]), weaponId: String(r[3]), unarmed: !!r[4], bigHeads: !!r[5], maxHp: Math.max(1, num(r[6], 100)) };
                if (!BO.WeaponsData.get(info.weaponId)) info.weaponId = 'm4a1';
                this.roster.set(id, info);
                const b = this.bProxies.get(id);
                if (b) { b.weaponId = info.weaponId; b.name = info.name; }
            }
        },

        syncBots(list) {
            const mp = BO.MPMode;
            const seen = new Set();
            const t = now();
            for (const e of list) {
                if (!Array.isArray(e) || e.length < 10) continue;
                const id = num(e[0]);
                seen.add(id);
                let b = this.bProxies.get(id);
                if (!b) {
                    const info = this.roster.get(id);
                    if (!info || !BO.World.scene) continue;
                    b = new BO.BotAI({ id, team: info.team, name: info.name, difficulty: mp.difficulty, weaponId: info.weaponId, unarmed: info.unarmed, bigHeads: info.bigHeads, maxHp: info.maxHp, x: num(e[1]), y: num(e[2]), z: num(e[3]), yaw: num(e[4]) });
                    b._netProxy = true;
                    b._netT = { x: b.pos.x, y: b.pos.y, z: b.pos.z, yaw: b.yaw };
                    b.respawnTimer = 1e9;
                    const baseTD = BO.BotAI.prototype.takeDamage;
                    b.takeDamage = function (dmg, attacker) {
                        if (!this.alive) return false;
                        const w = BO.Player.activeWeapon;
                        Net.toHost({ t: 'hit', id: this.id, a: r2(dmg), w: w && w.stats ? w.stats.shortName : 'KILL' });
                        const killed = baseTD.call(this, dmg, attacker);
                        if (killed) this._predDeadUntil = now() + 900;
                        this.respawnTimer = 1e9;
                        return killed;
                    };
                    this.bProxies.set(id, b);
                    mp.bots.push(b);
                }
                const alive = !!e[5];
                const nx = num(e[1]), ny = num(e[2]), nz = num(e[3]);
                if (alive && (!b.alive || Math.hypot(nx - b.pos.x, nz - b.pos.z) > 5)) {
                    if (!b.alive && t < (b._predDeadUntil || 0)) { /* keep predicted death briefly */ } else {
                        b.pos.set(nx, ny, nz);
                        b.alive = true;
                        b.parts.root.visible = true;
                    }
                } else if (!alive && b.alive) {
                    b.alive = false;
                    b.parts.root.visible = false;
                }
                b._netT.x = nx; b._netT.y = ny; b._netT.z = nz; b._netT.yaw = num(e[4]);
                if (b.alive) b.hp = num(e[6], b.hp);
                b.kills = num(e[7]); b.deaths = num(e[8]); b.score = num(e[9]);
                b.respawnTimer = 1e9;
            }
            for (const [id, b] of this.bProxies) {
                if (seen.has(id)) continue;
                b.destroy();
                const i = mp.bots.indexOf(b);
                if (i !== -1) mp.bots.splice(i, 1);
                this.bProxies.delete(id);
            }
        },

        updateBotProxy(b, dt) {
            b.respawnTimer = 1e9;
            if (!b.alive) { b.parts.root.visible = false; return; }
            const T = b._netT;
            const k = 1 - Math.exp(-12 * dt);
            const px = b.pos.x, pz = b.pos.z;
            b.pos.x += (T.x - b.pos.x) * k;
            b.pos.y += (T.y - b.pos.y) * k;
            b.pos.z += (T.z - b.pos.z) * k;
            b.yaw += BO.Math.angleDiff(b.yaw, T.yaw) * k;
            const spd = Math.min(9, Math.hypot(b.pos.x - px, b.pos.z - pz) / Math.max(dt, 0.001));
            b.animPhase += dt * (spd * 2.2 + 1.0);
            b.parts.root.visible = true;
            b.parts.root.position.copy(b.pos);
            b.parts.root.rotation.y = b.yaw;
            BO.CharacterMesh.animateLimbs(b.parts, spd, b.animPhase, 0, 0);
        },

        clientDom(mp) {
            for (let i = 0; i < mp.domStates.length; i++) {
                const f = mp.domStates[i];
                const vis = BO.World.domFlagObjs && BO.World.domFlagObjs[i];
                if (vis) {
                    const hex = f.owner === 0 ? 0x38bdf8 : (f.owner === 1 ? 0xef4444 : 0xf8fafc);
                    vis.banner.material.color.setHex(hex);
                    vis.ring.material.color.setHex(hex);
                }
            }
            return null;
        },

        clientHardpoint(mp) {
            const hps = BO.World.mapData.hardpoints || [];
            const cur = hps[mp.hpIndex % Math.max(1, hps.length)];
            if (cur && BO.World.hardpointRing) {
                BO.World.hardpointRing.position.set(cur.x, cur.y + 0.08, cur.z);
                BO.World.hardpointRing.material.color.setHex(mp.hpOwner === 0 ? 0x38bdf8 : (mp.hpOwner === 1 ? 0xef4444 : 0xf59e0b));
            }
            return cur || null;
        },

        /* ---------- client: tower defense helper visuals ---------- */
        syncTdVisuals(td) {
            if (!BO.World.scene) return;
            const V = this.tdVis;
            const turretPads = BO.World.mapData.turretPads || [];
            const tu = Array.isArray(td.tu) ? td.tu.slice(0, turretPads.length) : [];
            while (V.turrets.length < tu.length) {
                const pad = turretPads[V.turrets.length];
                const tm = BO.CharacterMesh.buildSentryTurret();
                tm.root.position.set(pad.x, pad.y, pad.z);
                BO.World.scene.add(tm.root);
                V.turrets.push(tm);
            }
            tu.forEach((t, i) => { if (V.turrets[i] && V.turrets[i].headGroup && Array.isArray(t)) V.turrets[i].headGroup.rotation.y = num(t[0]); });
            const syncList = (arr, data, build) => {
                const list = Array.isArray(data) ? data.slice(0, 12) : [];
                while (arr.length < list.length) {
                    const parts = build();
                    BO.World.scene.add(parts.root);
                    arr.push({ parts, pos: new THREE.Vector3(), tgt: new THREE.Vector3(), yaw: 0, tYaw: 0, phase: 0, fresh: true });
                }
                while (arr.length > list.length) {
                    const o = arr.pop();
                    if (o.parts.root.parent) o.parts.root.parent.remove(o.parts.root);
                }
                list.forEach((v, i) => {
                    if (!Array.isArray(v)) return;
                    const o = arr[i];
                    o.tgt.set(num(v[0]), num(v[1]), num(v[2]));
                    o.tYaw = num(v[3]);
                    if (o.fresh) { o.pos.copy(o.tgt); o.yaw = o.tYaw; o.fresh = false; }
                });
            };
            syncList(V.dogs, td.dg, () => BO.CharacterMesh.buildGuardDog(null));
            syncList(V.allies, td.al, () => BO.CharacterMesh.buildSoldier(0, null));
        },

        updateTdVisuals(dt) {
            const k = 1 - Math.exp(-12 * dt);
            for (const o of this.tdVis.dogs.concat(this.tdVis.allies)) {
                const px = o.pos.x, pz = o.pos.z;
                o.pos.lerp(o.tgt, k);
                o.yaw += BO.Math.angleDiff(o.yaw, o.tYaw) * k;
                const spd = Math.hypot(o.pos.x - px, o.pos.z - pz) / Math.max(dt, 0.001);
                o.phase += dt * (spd * 2.4 + 1.2);
                o.parts.root.position.copy(o.pos);
                o.parts.root.rotation.y = o.yaw;
                BO.CharacterMesh.animateLimbs(o.parts, spd, o.phase, 0, 0);
            }
        },

        clearTdVisuals() {
            const V = this.tdVis;
            for (const o of V.turrets) if (o.root && o.root.parent) o.root.parent.remove(o.root);
            for (const o of V.dogs.concat(V.allies)) if (o.parts.root.parent) o.parts.root.parent.remove(o.parts.root);
            V.turrets = []; V.dogs = []; V.allies = [];
        },

        /* ---------- message handling ---------- */
        onMessage(msg) {
            const from = typeof msg.from === 'string' ? msg.from : Net.hostId; // no 'from' => sent by the host
            const fromHost = from === Net.hostId;
            const host = Net.isHost();
            const mode = BO.State.activeMode;
            switch (msg.t) {
                case 'start': {
                    if (!fromHost || host || !msg.opts || typeof msg.opts !== 'object') return;
                    this.seq = num(msg.seq, this.seq + 1);
                    if (BO.State.paused && BO.Menus) BO.Menus.setPauseOpen(false);
                    this.applying = true;
                    try { BO.App.startMatch(msg.opts); } finally { this.applying = false; }
                    return;
                }
                case 'wsync': {
                    if (!fromHost || !this.inMatch) return;
                    this.applying = true;
                    try {
                        if (msg.power) BO.World.activatePower();
                        (Array.isArray(msg.doors) ? msg.doors : []).forEach((i) => {
                            const it = BO.World.interactives[num(i, -1)];
                            if (it && it.type === 'door') BO.World.openDoor(it);
                        });
                    } finally { this.applying = false; }
                    return;
                }
                case 'abort': {
                    if (!fromHost || host || !this.inMatch) return;
                    this.matchOver = true;
                    this.applying = true;
                    try { BO.App.exitToMenu(); } finally { this.applying = false; }
                    toast('THE HOST ENDED THE MATCH', '#f59e0b');
                    UI.open();
                    return;
                }
                case 'ps': {
                    const rp = this.remotes.get(from);
                    if (!rp) return;
                    rp.applyState(msg);
                    if (msg.fx && rp.inMatch() && this.inMatch) this.playFx(msg.fx);
                    return;
                }
                case 'snap': if (!host && fromHost) this.applySnap(msg); return;
                case 'leave_match': {
                    const rp = this.remotes.get(from);
                    if (rp) { rp.seq = -1; rp.destroyMesh(); }
                    return;
                }
                case 'dmg': {
                    if (!this.inMatch || BO.State.screen !== 'playing') return;
                    const P = BO.Player;
                    if (!P.alive) return;
                    if (msg.src === 'bot' && !fromHost) return;
                    const a = clamp(num(msg.a), 0, 100000);
                    const p = Array.isArray(msg.p) ? new THREE.Vector3(num(msg.p[0]), num(msg.p[1]), num(msg.p[2])) : null;
                    P.takeDamage(a, p, !!msg.ex);
                    if (!P.alive && mode === 'mp') {
                        const kn = cleanName(msg.n);
                        const w = cleanText(msg.w, 20) || 'KILL';
                        BO.Events.emit('hud:killfeed', { killer: kn, victim: Net.myName(), weapon: w, isPlayerKiller: false });
                        if (BO.MPMode) {
                            BO.MPMode.lastKillMeta = null;
                            this.localWasAlive = false; // already reported below
                        }
                        Net.send({ t: 'died', kn, w, bk: msg.src === 'bot' ? 1 : 0, by: msg.src === 'bot' ? num(msg.by, -1) : -1 });
                    }
                    return;
                }
                case 'died': {
                    if (!this.inMatch || mode !== 'mp') return;
                    const rp = this.remotes.get(from);
                    const victim = rp ? rp.name : 'PLAYER';
                    BO.Events.emit('hud:killfeed', { killer: cleanName(msg.kn), victim, weapon: cleanText(msg.w, 20) || 'KILL', isPlayerKiller: false });
                    if (host && msg.bk) {
                        const b = BO.MPMode.bots.find((x) => x.id === num(msg.by, -1));
                        if (b) {
                            b.kills++;
                            b.score += 100;
                            if (BO.MPMode.modeType === 'tdm') BO.MPMode.teamScores[1]++;
                        }
                    }
                    return;
                }
                case 'kf': {
                    if (!this.inMatch) return;
                    BO.Events.emit('hud:killfeed', { killer: cleanName(msg.k), victim: cleanName(msg.v), weapon: cleanText(msg.w, 20) || 'KILL', isPlayerKiller: false });
                    return;
                }
                case 'hit': if (host) this.hostApplyHit(msg); return;
                case 'door': {
                    if (!this.inMatch) return;
                    const it = BO.World.interactives[num(msg.i, -1)];
                    if (!it || it.type !== 'door') return;
                    this.applying = true;
                    try { BO.World.openDoor(it); } finally { this.applying = false; }
                    return;
                }
                case 'power': {
                    if (!this.inMatch) return;
                    this.applying = true;
                    try {
                        BO.World.activatePower();
                        BO.Events.emit('hud:banner', { title: 'POWER RESTORED', sub: 'A SQUADMATE FLIPPED THE SWITCH', color: '#38bdf8' });
                    } finally { this.applying = false; }
                    return;
                }
                case 'trap': {
                    if (!this.inMatch) return;
                    const tr = BO.World.traps && BO.World.traps[num(msg.i, -1)];
                    if (!tr) return;
                    this.applying = true;
                    try { BO.World.activateTrap(tr); } finally { this.applying = false; }
                    return;
                }
                case 'repair': {
                    if (!host || !this.inMatch) return;
                    const w = BO.World.interactives[num(msg.i, -1)];
                    if (w && w.type === 'window' && w.planksRemaining < w.maxPlanks) {
                        const pm = w.plankMeshes[w.planksRemaining];
                        if (pm) pm.visible = true;
                        w.planksRemaining++;
                    }
                    return;
                }
                case 'pureq': {
                    if (!host || !this.inMatch || mode !== 'zombies') return;
                    BO.ZombiesMode._spawnPowerUp(num(msg.x), num(msg.y), num(msg.z), typeof msg.k === 'string' ? msg.k : null);
                    return;
                }
                case 'pu': {
                    if (host || !fromHost || !this.inMatch || mode !== 'zombies') return;
                    const zm = BO.ZombiesMode;
                    this.applying = true;
                    try { zm._spawnPowerUp(num(msg.x), num(msg.y), num(msg.z), typeof msg.k === 'string' ? msg.k : 'max_ammo'); } finally { this.applying = false; }
                    const pu = zm.powerUps[zm.powerUps.length - 1];
                    if (pu) pu.nid = num(msg.nid);
                    return;
                }
                case 'puc': {
                    if (!this.inMatch || mode !== 'zombies') return;
                    const zm = BO.ZombiesMode;
                    const idx = zm.powerUps.findIndex((p) => p.nid === num(msg.nid, -1));
                    if (idx === -1) return;
                    const pu = zm.powerUps[idx];
                    if (pu.mesh && BO.World.scene) BO.World.scene.remove(pu.mesh);
                    zm.powerUps.splice(idx, 1);
                    this.applying = true;
                    try { zm._collectPowerUp(pu); } finally { this.applying = false; }
                    return;
                }
                case 'exfil_req': {
                    if (host && this.inMatch && mode === 'zombies') BO.ZombiesMode.startExfil();
                    return;
                }
                case 'zround': {
                    if (host || !fromHost || !this.inMatch || mode !== 'zombies') return;
                    this.applying = true;
                    try { BO.ZombiesMode._beginRound(Math.max(1, num(msg.r, 1))); } finally { this.applying = false; }
                    this.respawnLocal();
                    return;
                }
                case 'zclear': {
                    if (host || !fromHost || !this.inMatch || mode !== 'zombies') return;
                    BO.Sound.playRoundEnd();
                    BO.Progression.awardMedal('round_clear');
                    return;
                }
                case 'zend': {
                    if (host || !fromHost || !this.inMatch || mode !== 'zombies') return;
                    this.matchOver = true;
                    this.applying = true;
                    try { BO.ZombiesMode._finishMatch(!!msg.ok); } finally { this.applying = false; }
                    return;
                }
                case 'td_buy': {
                    if (!host || !this.inMatch || mode !== 'td') return;
                    const td = BO.TowerDefenseMode;
                    const item = String(msg.item || '');
                    if (!['barrier', 'turret', 'teammate', 'dog'].includes(item)) return;
                    const gold = td.gold;
                    const st = td.state;
                    td.gold = 1e9;
                    td.state = 'intermission';
                    try { td.buyShopItem(item); } finally { td.gold = gold; td.state = st; }
                    const rp = this.remotes.get(from);
                    BO.Events.emit('hud:toast', { text: `${rp ? rp.name : 'SQUADMATE'} BOUGHT: ${item.toUpperCase()}`, color: '#38bdf8' });
                    return;
                }
                case 'td_skip': {
                    if (host && this.inMatch && mode === 'td') BO.TowerDefenseMode.skipIntermission();
                    return;
                }
                case 'td_wave': {
                    if (host || !fromHost || !this.inMatch || mode !== 'td') return;
                    const w = Math.max(1, num(msg.w, 1));
                    BO.Sound.playRoundStart(w, false);
                    BO.Events.emit('hud:banner', { title: `WAVE ${w} INCOMING`, sub: 'HOLD THE CASTLE WITH YOUR SQUAD!', color: '#dc2626' });
                    if (BO.Menus && BO.Menus.modalTdShop) BO.Menus.modalTdShop.classList.add('hidden');
                    return;
                }
                case 'td_clear': {
                    if (host || !fromHost || !this.inMatch || mode !== 'td') return;
                    const td = BO.TowerDefenseMode;
                    const bonus = clamp(num(msg.bonus), 0, 100000);
                    td.gold += bonus;
                    td.rollFiveShopWeapons();
                    td.state = 'intermission';
                    td.intermissionTimer = 30;
                    BO.Sound.playRoundEnd();
                    BO.Events.emit('hud:banner', { title: `WAVE ${num(msg.w, td.wave)} CLEARED! +${bonus} GOLD`, sub: '30s INTERMISSION — SHOPKEEPER OPEN ([T] OR [E]) • [N] ASKS HOST TO SKIP', color: '#22c55e' });
                    this.respawnLocal();
                    return;
                }
                case 'tdend': {
                    if (host || !fromHost || !this.inMatch || mode !== 'td') return;
                    this.matchOver = true;
                    this.applying = true;
                    try { BO.TowerDefenseMode._endMatch(!!msg.v, cleanText(msg.title, 40) || null); } finally { this.applying = false; }
                    return;
                }
                case 'claim_win': {
                    if (!host || !this.inMatch || mode !== 'mp') return;
                    const mp = BO.MPMode;
                    if (mp.ended || mp.killcamPendingEnd || mp.killcamActive) return;
                    const rp = this.remotes.get(from);
                    if (!rp) return;
                    const title = cleanText(msg.title, 40);
                    if (mp.modeType === 'ffa' || mp.modeType === 'gun_game') {
                        this.pendingWinner = { id: rp.id, name: rp.name };
                        mp._queueWinnerKillcam(false, `${rp.name} WINS`);
                    } else if (/NUKE/.test(title)) {
                        mp._endMatch(true, `${rp.name}'S TACTICAL NUKE`);
                    }
                    return;
                }
                case 'mpend': {
                    if (host || !fromHost || !this.inMatch || mode !== 'mp') return;
                    const fn = ['_queueWinnerKillcam', '_startWinnerKillcamOrEnd', '_endMatch'].includes(msg.fn) ? msg.fn : '_endMatch';
                    let victory, title;
                    if (msg.ffa) {
                        victory = msg.wid === Net.myId;
                        title = victory ? 'VICTORY' : `${cleanName(msg.wn)} WINS`;
                    } else {
                        victory = !!msg.v;
                        title = cleanText(msg.title, 40) || null;
                    }
                    this.matchOver = true;
                    this.applying = true;
                    try { BO.MPMode[fn](victory, title); } finally { this.applying = false; }
                    return;
                }
                default:
            }
        },

        hostApplyHit(msg) {
            if (!this.inMatch) return;
            const id = num(msg.id, -1);
            const a = clamp(num(msg.a), 0, 1e6);
            const m = BO.State.activeMode;
            if (m === 'zombies' || m === 'td') {
                const mode = m === 'zombies' ? BO.ZombiesMode : BO.TowerDefenseMode;
                const z = mode.zombies.find((q) => q.id === id);
                if (!z || !z.alive) return;
                const hb = ['head', 'torso', 'limb', 'shield'].includes(msg.hb) ? msg.hb : 'torso';
                const k = ['bullet', 'explosive', 'fire', 'melee'].includes(msg.k) ? msg.k : 'bullet';
                const killed = z.takeDamage(a, hb, hb === 'head', null, k);
                if (killed && m === 'zombies') {
                    if (z === mode.activeBoss) mode.activeBoss = null;
                    if (z.spec && z.spec.isPentagonThief) mode.mapQuest.fiveThiefEntity = null;
                }
            } else if (m === 'mp') {
                const mp = BO.MPMode;
                const b = mp.bots.find((q) => q.id === id);
                if (!b || !b.alive) return;
                if (mp.modeType !== 'ffa' && mp.modeType !== 'gun_game' && b.team === 0) return;
                if (b.takeDamage(a, 'player')) {
                    const rp = this.remotes.get(msg.from);
                    const name = rp ? rp.name : 'PLAYER';
                    if (mp.modeType === 'tdm') mp.teamScores[0]++;
                    const kf = { t: 'kf', k: name, v: b.name, w: cleanText(msg.w, 20) || 'KILL' };
                    Net.broadcast(kf, msg.from);
                    BO.Events.emit('hud:killfeed', { killer: name, victim: b.name, weapon: kf.w, isPlayerKiller: false });
                }
            }
        }
    };

    /* ======================================================================
       HOOKS INTO THE EXISTING GAME (installed before the app boots)
    ====================================================================== */
    function installHooks() {
        const isNet = () => Net.active && G.inMatch;

        // --- Zombie AI: host retargets to the nearest human; clients render proxies ---
        const zProto = BO.ZombieEntity.prototype;
        const baseZUpdate = zProto.update;
        zProto.update = function (dt, all, cb) {
            if (this._netProxy) return G.updateZombieProxy(this, dt);
            if (!this.alive || !Net.isHost() || !G.inMatch || G.remotes.size === 0) return baseZUpdate.call(this, dt, all, cb);
            const stand = G.nearestStandIn(this.pos);
            if (!stand) return baseZUpdate.call(this, dt, all, cb);
            const real = BO.Player;
            BO.Player = stand;
            try { return baseZUpdate.call(this, dt, all, cb); } finally { BO.Player = real; }
        };

        // --- Bot AI: host bots also see remote humans; clients render proxies ---
        const bProto = BO.BotAI.prototype;
        const baseBUpdate = bProto.update;
        bProto.update = function (dt, ctx) {
            if (this._netProxy) return G.updateBotProxy(this, dt);
            if (Net.isHost() && G.inMatch && G.remotes.size > 0 && ctx) ctx = G.augmentBotCtx(ctx);
            return baseBUpdate.call(this, dt, ctx);
        };

        // --- Shared world: doors, power, traps ---
        const W = BO.World;
        const baseOpenDoor = W.openDoor;
        W.openDoor = function (inter) {
            const was = !!(inter && inter.opened);
            const r = baseOpenDoor.call(this, inter);
            if (!was && inter && inter.opened && isNet() && !G.applying) {
                Net.send({ t: 'door', i: this.interactives.indexOf(inter) });
            }
            return r;
        };
        const baseActivatePower = W.activatePower;
        W.activatePower = function () {
            const was = this.powerOn;
            const wasApplying = G.applying;
            if (!was && isNet() && !wasApplying) Net.send({ t: 'power' });
            G.applying = true; // auto-opened doors should not re-broadcast individually
            try { return baseActivatePower.call(this); } finally { G.applying = wasApplying; }
        };
        const baseActivateTrap = W.activateTrap;
        W.activateTrap = function (tr) {
            const r = baseActivateTrap.call(this, tr);
            if (isNet() && !G.applying && this.traps) Net.send({ t: 'trap', i: this.traps.indexOf(tr) });
            return r;
        };

        // --- Zombies mode ---
        const ZM = BO.ZombiesMode;
        ['_spawnZombie', '_spawnBoss', '_spawnPentagonThief'].forEach((fn) => {
            const base = ZM[fn];
            ZM[fn] = function (...args) {
                if (Net.isClient() && G.inMatch) return undefined;
                return base.apply(this, args);
            };
        });
        const baseBeginRound = ZM._beginRound;
        ZM._beginRound = function (r) {
            if (Net.isClient() && G.inMatch && !G.applying) return undefined;
            return baseBeginRound.call(this, r);
        };
        const baseSpawnPU = ZM._spawnPowerUp;
        const PU_IDS = ['max_ammo', 'insta_kill', 'double_points', 'nuke', 'carpenter', 'fire_sale'];
        ZM._spawnPowerUp = function (x, y, z, kind = null) {
            if (!isNet() || G.applying) return baseSpawnPU.call(this, x, y, z, kind);
            if (Net.isClient()) { Net.toHost({ t: 'pureq', x: r2(x), y: r2(y), z: r2(z), k: kind }); return undefined; }
            const k = PU_IDS.includes(kind) ? kind : BO.Math.pick(PU_IDS);
            baseSpawnPU.call(this, x, y, z, k);
            const pu = this.powerUps[this.powerUps.length - 1];
            if (pu) {
                pu.nid = ++G.puSeq;
                Net.broadcast({ t: 'pu', nid: pu.nid, k, x: r2(x), y: r2(y), z: r2(z) });
            }
            return undefined;
        };
        const baseCollectPU = ZM._collectPowerUp;
        ZM._collectPowerUp = function (pu) {
            if (isNet() && !G.applying && pu && pu.nid) Net.send({ t: 'puc', nid: pu.nid });
            return baseCollectPU.call(this, pu);
        };
        const baseStartExfil = ZM.startExfil;
        ZM.startExfil = function () {
            if (Net.isClient() && G.inMatch && !G.applying) {
                if (this.exfilAvailable && !this.exfilActive) { Net.toHost({ t: 'exfil_req' }); toast('EXFIL REQUESTED — CALLING THE CHOPPER', '#22c55e'); }
                return undefined;
            }
            return baseStartExfil.call(this);
        };
        const baseFinish = ZM._finishMatch;
        ZM._finishMatch = function (success) {
            if (isNet() && !G.applying) {
                if (Net.isClient()) { if (!BO.Player.alive) G.goDown(); return undefined; }
                if (!success && !BO.Player.alive && G.anyRemoteAlive()) { G.goDown(); return undefined; }
                G.matchOver = true;
                Net.broadcast({ t: 'zend', ok: success ? 1 : 0 });
            }
            return baseFinish.call(this, success);
        };
        const baseJump = ZM.jumpToRound;
        ZM.jumpToRound = function (r) {
            if (Net.isClient() && G.inMatch) { toast('ONLY THE HOST CAN CHANGE THE ROUND', '#ef4444'); return undefined; }
            return baseJump.call(this, r);
        };

        // --- Tower Defense mode ---
        const TD = BO.TowerDefenseMode;
        ['_spawnWaveZombie', '_spawnBossZombie', '_beginNextWave'].forEach((fn) => {
            const base = TD[fn];
            TD[fn] = function (...args) {
                if (Net.isClient() && G.inMatch) return undefined;
                return base.apply(this, args);
            };
        });
        const baseSkip = TD.skipIntermission;
        TD.skipIntermission = function () {
            if (Net.isClient() && G.inMatch) {
                if (this.state === 'intermission') { Net.toHost({ t: 'td_skip' }); toast('ASKED THE HOST TO START THE NEXT WAVE', '#38bdf8'); }
                return undefined;
            }
            return baseSkip.call(this);
        };
        const baseBuyItem = TD.buyShopItem;
        TD.buyShopItem = function (itemId) {
            const shared = ['barrier', 'turret', 'teammate', 'dog'];
            if (!(Net.isClient() && G.inMatch) || !shared.includes(itemId)) return baseBuyItem.call(this, itemId);
            if (this.state !== 'intermission') {
                BO.Events.emit('hud:toast', { text: 'SHOP IS ONLY OPEN BETWEEN WAVES!', color: '#ef4444' });
                return false;
            }
            const item = this.getShopItems().find((x) => x.id === itemId);
            if (!item) return false;
            if (this.gold < item.cost) {
                BO.Sound.playEmptyClick();
                BO.Events.emit('hud:toast', { text: `NEED ${item.cost} GOLD FOR ${item.name}!`, color: '#ef4444' });
                return false;
            }
            if (itemId === 'barrier' && !this.layers.some((l) => l.hp < l.maxHp)) {
                BO.Events.emit('hud:toast', { text: 'ALL 3 DEFENSE LAYERS ALREADY AT 250 HP!', color: '#facc15' });
                return false;
            }
            this.gold -= item.cost;
            Net.toHost({ t: 'td_buy', item: itemId });
            BO.Sound.playShopBuy();
            BO.Events.emit('hud:toast', { text: `${item.name} — DEPLOYED FOR THE WHOLE SQUAD!`, color: '#22c55e' });
            return true;
        };
        const baseTdEnd = TD._endMatch;
        TD._endMatch = function (victory, title) {
            if (isNet() && !G.applying) {
                if (Net.isClient()) return undefined;
                G.matchOver = true;
                Net.broadcast({ t: 'tdend', v: victory ? 1 : 0, title: cleanText(title, 40) });
            }
            return baseTdEnd.call(this, victory, title);
        };

        // --- Multiplayer mode ---
        const MP = BO.MPMode;
        const baseSpawnBots = MP._spawnBots;
        MP._spawnBots = function (map) {
            if (Net.isClient() && G.inMatch) return undefined;
            return baseSpawnBots.call(this, map);
        };
        const baseDom = MP._updateDomination;
        MP._updateDomination = function (dt) {
            if (Net.isClient() && G.inMatch) return G.clientDom(this);
            if (Net.isHost() && G.inMatch && G.remotes.size) {
                const saved = this.bots;
                this.bots = saved.concat(Array.from(G.remotes.values()).filter((rp) => rp.inMatch() && rp.alive));
                try { return baseDom.call(this, dt); } finally { this.bots = saved; }
            }
            return baseDom.call(this, dt);
        };
        const baseHp = MP._updateHardpoint;
        MP._updateHardpoint = function (dt) {
            if (Net.isClient() && G.inMatch) return G.clientHardpoint(this);
            if (Net.isHost() && G.inMatch && G.remotes.size) {
                const saved = this.bots;
                this.bots = saved.concat(Array.from(G.remotes.values()).filter((rp) => rp.inMatch() && rp.alive));
                try { return baseHp.call(this, dt); } finally { this.bots = saved; }
            }
            return baseHp.call(this, dt);
        };
        ['_queueWinnerKillcam', '_startWinnerKillcamOrEnd', '_endMatch'].forEach((fn) => {
            const base = MP[fn];
            MP[fn] = function (victory, title = null) {
                if (isNet() && !G.applying) {
                    if (Net.isClient()) {
                        if (victory && !this.ended && !G.claimSent) {
                            G.claimSent = true;
                            Net.toHost({ t: 'claim_win', title: cleanText(title || '', 40) });
                        }
                        return undefined;
                    }
                    if (!G.mpEndSent) {
                        G.mpEndSent = true;
                        G.matchOver = true;
                        const o = G.mpOutcome(victory);
                        if (o.ffa) {
                            victory = o.wid === Net.myId;
                            title = victory ? (title && /NUKE/.test(title) ? title : 'VICTORY') : `${o.wn} WINS`;
                        }
                        Net.broadcast({ t: 'mpend', fn, v: victory ? 1 : 0, title: cleanText(title || '', 40), ffa: o.ffa ? 1 : 0, wid: o.wid, wn: o.wn });
                    }
                }
                return base.call(this, victory, title);
            };
        });
        const baseMpExplode = MP._onExplode;
        MP._onExplode = function (pos, rad, dmg, isFlash, stunDur, wid) {
            if (isNet() && G.isPvP() && G.remotes.size) {
                const saved = this.bots;
                this.bots = saved.concat(Array.from(G.remotes.values()).filter((rp) => rp.isVisible()));
                try { return baseMpExplode.call(this, pos, rad, dmg, isFlash, stunDur, wid); } finally { this.bots = saved; }
            }
            return baseMpExplode.call(this, pos, rad, dmg, isFlash, stunDur, wid);
        };
        const baseScoreboard = MP.getScoreboard;
        MP.getScoreboard = function () {
            const rows = baseScoreboard.call(this);
            if (!isNet()) return rows;
            for (const rp of G.remotes.values()) {
                if (!rp.inMatch()) continue;
                rows.push({ name: rp.name + ' (FRIEND)', team: G.isPvP() ? 1 : 0, isPlayer: false, kills: rp.kills, deaths: rp.deaths, score: rp.score });
            }
            rows.sort((a, b) => b.score - a.score || b.kills - a.kills);
            return rows;
        };
    }

    function installAppHooks(app) {
        const baseStart = app.startMatch.bind(app);
        app.startMatch = function (opts) {
            if (Net.active) {
                if (Net.isClient() && !G.applying) {
                    toast('ONLY THE HOST CAN START THE MATCH — WAIT FOR THEM TO DEPLOY', '#f59e0b');
                    return;
                }
                if (Net.isHost()) {
                    G.seq++;
                    Net.broadcast({ t: 'start', opts, seq: G.seq });
                }
            }
            G.beginMatch(opts);
            baseStart(opts);
            G.afterStart(opts);
        };

        const baseExit = app.exitToMenu.bind(app);
        app.exitToMenu = function () {
            if (Net.active && G.inMatch && !G.applying) {
                if (Net.isHost()) { if (!G.matchOver) Net.broadcast({ t: 'abort' }); }
                else Net.send({ t: 'leave_match' });
            }
            G.endMatchLocal();
            baseExit();
            UI.refresh();
        };
    }

    /* ======================================================================
       UI (lobby modal, top bar, squad list)
    ====================================================================== */
    const UI = {
        el: {},
        flashTimer: null,

        init() {
            const css = document.createElement('style');
            css.textContent = `
#net-modal{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(3,6,12,.78);backdrop-filter:blur(3px);padding:16px;}
#net-modal.hidden,#net-bar.hidden,#net-squad.hidden{display:none;}
#net-modal .net-panel{width:min(560px,100%);max-height:calc(100vh - 32px);overflow:auto;background:#0b1220;border:1px solid #f5a623;box-shadow:0 0 40px rgba(245,166,35,.18);padding:22px;color:#e2e8f0;font-family:var(--font-ui,Arial,sans-serif);}
#net-modal h2{margin:0 0 4px;font-size:22px;letter-spacing:.06em;color:#f5a623;}
#net-modal .net-sub{color:#94a3b8;font-size:13px;line-height:1.5;margin-bottom:14px;}
#net-modal .net-row{display:flex;gap:8px;margin:10px 0;flex-wrap:wrap;}
#net-modal input{flex:1;min-width:0;background:#060a12;color:#f8fafc;border:1px solid #334155;padding:10px;font-size:14px;font-family:inherit;}
#net-modal .net-status{padding:10px;border-left:3px solid #38bdf8;background:#0f172a;font-size:13px;margin:10px 0;line-height:1.5;}
#net-modal .net-status.err{border-color:#ef4444;color:#fecaca;}
#net-modal .net-status.ok{border-color:#22c55e;}
#net-modal .net-players{list-style:none;margin:8px 0;padding:0;}
#net-modal .net-players li{padding:7px 10px;background:#0f172a;margin-bottom:4px;display:flex;justify-content:space-between;font-size:14px;}
#net-modal .net-tag{font-size:11px;color:#f5a623;}
#net-modal .net-label{font-size:11px;color:#64748b;letter-spacing:.12em;margin-top:12px;}
#net-bar{position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:8000;display:flex;gap:8px;align-items:center;background:rgba(11,18,32,.94);border:1px solid #22c55e;padding:6px 10px;font-family:var(--font-ui,Arial,sans-serif);font-size:12px;color:#e2e8f0;max-width:calc(100vw - 32px);}
#net-bar .dot{width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px #22c55e;}
#net-bar button{font-size:11px;padding:4px 8px;}
#net-squad{position:fixed;left:12px;top:34%;z-index:50;pointer-events:none;font-family:var(--font-ui,Arial,sans-serif);font-size:12px;color:#e2e8f0;min-width:170px;}
#net-squad .sq-row{background:rgba(6,10,18,.72);border-left:3px solid #38bdf8;padding:4px 8px;margin-bottom:3px;}
#net-squad .sq-row.dead{border-color:#ef4444;opacity:.6;}
#net-squad .sq-hp{height:3px;background:#1e293b;margin-top:3px;}
#net-squad .sq-hp>div{height:100%;background:#22c55e;}
#net-flash{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:9100;background:#0b1220;border:1px solid #38bdf8;color:#e2e8f0;padding:8px 14px;font-family:var(--font-ui,Arial,sans-serif);font-size:13px;pointer-events:none;transition:opacity .3s;max-width:calc(100vw - 32px);}
#net-flash.hidden{opacity:0;}
.menu-tile.online-tile .tile-title{color:#fde047;}
`;
            document.head.appendChild(css);

            const modal = document.createElement('div');
            modal.id = 'net-modal';
            modal.className = 'hidden';
            modal.innerHTML = '<div class="net-panel" id="net-panel"></div>';
            modal.addEventListener('mousedown', (e) => { if (e.target === modal) this.close(); });
            document.body.appendChild(modal);

            const bar = document.createElement('div');
            bar.id = 'net-bar';
            bar.className = 'hidden';
            document.body.appendChild(bar);

            const squad = document.createElement('div');
            squad.id = 'net-squad';
            squad.className = 'hidden';
            document.body.appendChild(squad);

            const flash = document.createElement('div');
            flash.id = 'net-flash';
            flash.className = 'hidden';
            document.body.appendChild(flash);

            this.el = { modal, panel: modal.querySelector('#net-panel'), bar, squad, flash };

            const td = document.getElementById('btn-menu-td');
            if (td && td.parentNode) {
                const tile = document.createElement('button');
                tile.className = 'menu-tile online-tile';
                tile.id = 'btn-menu-online';
                tile.innerHTML = '<span class="tile-title">PLAY ONLINE WITH FRIENDS</span><span class="tile-sub">Host a lobby • Send a link • Zombies, Multiplayer &amp; Tower Defense together</span>';
                tile.onclick = () => { if (BO.Sound) BO.Sound.playUIClick(); this.open(); };
                td.parentNode.insertBefore(tile, td.nextSibling);
            }

            const pauseResume = document.getElementById('btn-pause-resume');
            if (pauseResume && pauseResume.parentNode) {
                const pBtn = document.createElement('button');
                pBtn.className = 'btn';
                pBtn.id = 'btn-pause-online';
                pBtn.style.borderColor = '#22c55e';
                pBtn.style.color = '#22c55e';
                pBtn.textContent = 'ONLINE LOBBY / INVITE LINK';
                pBtn.onclick = () => { if (BO.Sound) BO.Sound.playUIClick(); this.open(); };
                pauseResume.parentNode.insertBefore(pBtn, pauseResume.nextSibling);
            }

            document.addEventListener('keydown', (e) => {
                if (e.code === 'Escape' && !this.el.modal.classList.contains('hidden')) { e.stopPropagation(); this.close(); }
            }, true);

            setInterval(() => this.refreshBar(), 500);
            this.refresh();
        },

        open() {
            if (BO.State.screen === 'playing' && !BO.State.paused) return;
            this.el.modal.classList.remove('hidden');
            this.render();
        },

        close() {
            this.el.modal.classList.add('hidden');
        },

        refresh() {
            if (!this.el.modal) return;
            if (!this.el.modal.classList.contains('hidden')) this.render();
            this.refreshBar();
        },

        flash(text) {
            if (!this.el.flash || BO.State.screen === 'playing') return;
            this.el.flash.textContent = text;
            this.el.flash.classList.remove('hidden');
            clearTimeout(this.flashTimer);
            this.flashTimer = setTimeout(() => this.el.flash.classList.add('hidden'), 3200);
        },

        refreshBar() {
            const bar = this.el.bar;
            if (!bar) return;
            const show = (Net.active || Net.status === 'connecting') && BO.State.screen !== 'playing';
            bar.classList.toggle('hidden', !show);
            if (!show) return;
            const key = `${Net.status}|${Net.role}|${Net.players.size}`;
            if (bar.dataset.key === key) return;
            bar.dataset.key = key;
            bar.innerHTML = '';
            const dot = document.createElement('span');
            dot.className = 'dot';
            const txt = document.createElement('span');
            if (Net.status === 'connecting') txt.textContent = 'CONNECTING…';
            else if (Net.role === 'host') txt.textContent = `HOSTING ONLINE LOBBY • ${Net.players.size} PLAYER${Net.players.size === 1 ? '' : 'S'} • PICK A MODE & DEPLOY`;
            else txt.textContent = `IN ONLINE LOBBY • ${Net.players.size} PLAYERS • WAITING FOR HOST TO DEPLOY`;
            const btn = document.createElement('button');
            btn.className = 'btn btn-sm';
            btn.textContent = 'LOBBY';
            btn.onclick = () => this.open();
            bar.append(dot, txt, btn);
            if (Net.role === 'host' && Net.active) {
                const copy = document.createElement('button');
                copy.className = 'btn btn-sm btn-primary';
                copy.textContent = 'COPY INVITE LINK';
                copy.onclick = () => this.copyLink(copy);
                bar.appendChild(copy);
            }
        },

        copyLink(btn) {
            const link = Net.inviteLink();
            const done = () => { if (btn) { const t = btn.textContent; btn.textContent = 'COPIED!'; setTimeout(() => { btn.textContent = t; }, 1500); } };
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done, () => this._fallbackCopy(link, done));
            else this._fallbackCopy(link, done);
        },

        _fallbackCopy(text, done) {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); done(); } catch (e) {}
            ta.remove();
        },

        render() {
            const p = this.el.panel;
            p.innerHTML = '';
            const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
            const btn = (label, cls, fn) => { const b = h('button', 'btn ' + (cls || ''), label); b.onclick = () => { if (BO.Sound) BO.Sound.playUIClick(); fn(b); }; return b; };

            p.appendChild(h('h2', '', 'PLAY ONLINE WITH FRIENDS'));
            p.appendChild(h('div', 'net-sub', 'Host a lobby, send your friends the invite link, then pick Zombies, Multiplayer or Tower Defense and press DEPLOY. Everyone in the lobby drops into the same match with you.'));

            // Name
            p.appendChild(h('div', 'net-label', 'YOUR NAME'));
            const nameRow = h('div', 'net-row');
            const nameIn = document.createElement('input');
            nameIn.maxLength = 16;
            nameIn.value = Net.myName();
            nameRow.append(nameIn, btn('SAVE NAME', '', (b) => { Net.rename(nameIn.value); nameIn.value = Net.myName(); b.textContent = 'SAVED!'; setTimeout(() => { b.textContent = 'SAVE NAME'; }, 1200); }));
            p.appendChild(nameRow);

            if (Net.lastError && Net.status === 'offline') p.appendChild(h('div', 'net-status err', Net.lastError));

            if (Net.status === 'offline') {
                const row = h('div', 'net-row');
                row.appendChild(btn('HOST A LOBBY', 'btn-primary', () => Net.host()));
                p.appendChild(row);
                p.appendChild(h('div', 'net-label', 'OR PASTE A FRIEND\'S INVITE LINK'));
                const jr = h('div', 'net-row');
                const jin = document.createElement('input');
                jin.placeholder = 'https://…?join=boops-xxxxxx';
                jr.append(jin, btn('JOIN', '', () => {
                    const id = UI.parseJoin(jin.value);
                    if (!id) { Net.lastError = 'That does not look like an invite link.'; this.render(); return; }
                    Net.join(id);
                }));
                p.appendChild(jr);
            } else if (Net.status === 'connecting') {
                p.appendChild(h('div', 'net-status', Net.role === 'host' ? 'Opening your lobby…' : 'Joining your friend\'s lobby…'));
            } else {
                if (Net.role === 'host') {
                    p.appendChild(h('div', 'net-status ok', 'Your lobby is open. Send this link to your friends — they click it and land in your lobby.'));
                    p.appendChild(h('div', 'net-label', 'INVITE LINK'));
                    const lr = h('div', 'net-row');
                    const lin = document.createElement('input');
                    lin.readOnly = true;
                    lin.value = Net.inviteLink();
                    lin.onclick = () => lin.select();
                    lr.append(lin, btn('COPY', 'btn-primary', (b) => this.copyLink(b)));
                    p.appendChild(lr);
                } else {
                    const hostP = Net.players.get(Net.hostId);
                    p.appendChild(h('div', 'net-status ok', `You're in ${hostP ? hostP.name : 'the host'}'s lobby. The host picks the mode and presses DEPLOY — you'll drop in automatically. Pick your class in Create-a-Class while you wait.`));
                }
                p.appendChild(h('div', 'net-label', `PLAYERS (${Net.players.size}/8)`));
                const ul = h('ul', 'net-players');
                for (const pl of Net.playerList()) {
                    const li = h('li');
                    li.appendChild(h('span', '', pl.name + (pl.id === Net.myId ? ' (YOU)' : '')));
                    li.appendChild(h('span', 'net-tag', pl.id === Net.hostId ? 'HOST' : 'FRIEND'));
                    ul.appendChild(li);
                }
                p.appendChild(ul);
                if (G.inMatch && BO.State.screen === 'playing') p.appendChild(h('div', 'net-sub', 'Match in progress.'));
            }

            const foot = h('div', 'net-row');
            foot.style.marginTop = '16px';
            if (Net.status !== 'offline') foot.appendChild(btn('LEAVE LOBBY', 'btn-zombies', () => { const wasInMatch = G.inMatch && BO.State.screen === 'playing'; Net.leave(); if (wasInMatch) BO.App.exitToMenu(); }));
            foot.appendChild(btn('CLOSE', '', () => this.close()));
            p.appendChild(foot);
        },

        parseJoin(v) {
            const s = String(v || '').trim();
            const m = s.match(/(boops-[a-z0-9]{6})/);
            return m ? m[1] : null;
        },

        setSquadVisible(on) {
            if (!this.el.squad) return;
            this.el.squad.classList.toggle('hidden', !on);
            if (on) this.renderSquad();
        },

        renderSquad() {
            const box = this.el.squad;
            if (!box || box.classList.contains('hidden')) return;
            const m = BO.State.activeMode;
            const P = BO.Player;
            const rows = [];
            const fmt = (pts, k, d) => (m === 'mp' ? `${k}/${d} K/D` : `${BO.Math.formatNumber(pts)} ${m === 'td' ? 'GOLD' : 'PTS'}`);
            let myPts = 0, myK = 0, myD = 0;
            if (m === 'zombies') myPts = BO.ZombiesMode.points;
            else if (m === 'td') myPts = BO.TowerDefenseMode.gold;
            else if (m === 'mp') { myK = BO.MPMode.playerKills; myD = BO.MPMode.playerDeaths; }
            rows.push({ name: Net.myName() + ' (YOU)', alive: P.alive, hp: P.hp / Math.max(1, P.maxHp), info: fmt(myPts, myK, myD) });
            for (const rp of G.remotes.values()) {
                if (!rp.inMatch()) { rows.push({ name: rp.name, alive: false, hp: 0, info: 'IN MENU' }); continue; }
                rows.push({ name: rp.name, alive: rp.alive, hp: rp.hp / rp.maxHp, info: rp.alive ? fmt(rp.points, rp.kills, rp.deaths) : 'DOWN' });
            }
            box.innerHTML = '';
            for (const r of rows) {
                const row = document.createElement('div');
                row.className = 'sq-row' + (r.alive ? '' : ' dead');
                const top = document.createElement('div');
                top.textContent = `${r.name} — ${r.info}`;
                const bar = document.createElement('div');
                bar.className = 'sq-hp';
                const fill = document.createElement('div');
                fill.style.width = `${Math.round(clamp(r.hp, 0, 1) * 100)}%`;
                bar.appendChild(fill);
                row.append(top, bar);
                box.appendChild(row);
            }
        }
    };
    Net.ui = UI;

    // Install gameplay hooks immediately (all game scripts above are already loaded).
    installHooks();

    // Browsers pause requestAnimationFrame in hidden tabs. During an online match keep simulating
    // (and talking to friends) so an alt-tabbed host doesn't freeze the game for everyone.
    setInterval(() => {
        // Only kicks in when the normal render loop has stalled (hidden/background tab).
        if (Net.active && G.inMatch && BO.App && BO.App.backgroundTick && performance.now() - (BO.App.lastRafTime || 0) > 250) BO.App.backgroundTick();
    }, 50);

    window.addEventListener('DOMContentLoaded', () => {
        UI.init();
        // main.js boots the app in its own DOMContentLoaded handler (registered after ours), so wait a tick.
        setTimeout(() => {
            if (BO.App) installAppHooks(BO.App);
            const id = UI.parseJoin(new URLSearchParams(global.location.search).get('join'));
            if (id) Net.join(id);
        }, 0);
    });
})(window);
