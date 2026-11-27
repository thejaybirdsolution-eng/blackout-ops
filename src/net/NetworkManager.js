/* ============================================================================
   BLACKOUT OPS — Online Co-op & Multiplayer Network Manager (WebRTC P2P + Local)
   - Instant Shareable Invite Links (?room=XXXXXX) for GitHub Pages & Local Play
   - Supports up to 8 Players in the Same Lobby across ALL 3 Modes:
       1. COD Zombies (Co-op Wave Survival, Shared Doors/Power/Quests/Perks/Revive)
       2. Tower Defense (Co-op Castle Siege, Shared Walls/Heart/Turrets/Dogs/Shop)
       3. Multiplayer (Co-op vs Bots AND PvP Friends vs Friends + Bots!)
   - Uses PeerJS WebRTC DataChannels (with public STUN servers) + BroadcastChannel
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    const ROOM_PREFIX = 'bo-ops-room-';
    const GITHUB_PAGES_URL = 'https://thejaybirdsolution-eng.github.io/blackout-ops/';

    const ICE_SERVERS = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' }
    ];

    class NetworkManager {
        constructor() {
            this.active = false;
            this.isHost = false;
            this.roomCode = '';
            this.myPeerId = 'local_' + Math.random().toString(36).slice(2, 8);
            this.status = 'offline'; // 'offline' | 'connecting' | 'hosting' | 'connected' | 'error'
            this.statusText = 'OFFLINE / SOLO MODE';

            this.peer = null;
            this.connections = new Map(); // peerId -> PeerJS DataConnection
            this.hostConn = null;         // PeerJS DataConnection to host (when client)
            this.bc = null;               // BroadcastChannel for instant multi-tab / same-PC sync
            this.seenSeq = new Set();
            this.seqCounter = 1;

            this.players = new Map();       // peerId -> profile & lobby/match stats
            this.remoteStates = new Map();  // peerId -> live 3D transform & vitals
            this.remoteAvatars = new Map(); // peerId -> 3D Three.js Soldier + Weapon + Hitboxes
            this.chatMessages = [];         // { sender, text, color, time }

            this.myTeam = 0; // 0 = Allies / Defenders, 1 = Opposing Team (MP PvP)
            this.stateSendAccum = 0;
            this.modeSnapAccum = 0;
            this.pingAccum = 0;
            this.reviveHoldTimer = 0;
            this.elNameplates = null;
            this._lastMatchOpts = null;
        }

        init() {
            this._ensureNameplateLayer();
            this._ensurePeerJSLoaded(() => {
                this.checkUrlRoom();
            });

            BO.Events.on('save:updated', () => {
                if (this.active) this.syncMyProfile();
            });
        }

        _ensureNameplateLayer() {
            let el = document.getElementById('net-nameplates');
            if (!el) {
                el = document.createElement('div');
                el.id = 'net-nameplates';
                el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:22;overflow:hidden;';
                const hud = document.getElementById('hud-layer');
                if (hud) hud.appendChild(el);
                else document.body.appendChild(el);
            }
            this.elNameplates = el;
        }

        _ensurePeerJSLoaded(cb) {
            if (typeof global.Peer !== 'undefined') {
                if (cb) cb();
                return;
            }
            const s = document.createElement('script');
            s.src = 'vendor/peerjs.min.js';
            s.onload = () => { if (cb) cb(); };
            s.onerror = () => {
                const cdn = document.createElement('script');
                cdn.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
                cdn.onload = () => { if (cb) cb(); };
                cdn.onerror = () => { if (cb) cb(); };
                document.head.appendChild(cdn);
            };
            document.head.appendChild(s);
        }

        checkUrlRoom() {
            try {
                const params = new URLSearchParams(window.location.search);
                let code = params.get('room') || params.get('lobby');
                if (!code && window.location.hash) {
                    const m = window.location.hash.match(/room=([A-Za-z0-9_-]+)/i);
                    if (m) code = m[1];
                }
                if (code && code.trim().length >= 3) {
                    const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
                    if (clean) {
                        setTimeout(() => {
                            if (BO.Menus && BO.State.screen === 'main_menu') {
                                BO.Menus.showScreen('play_lobby');
                            }
                            this.joinRoom(clean, true);
                        }, 250);
                    }
                }
            } catch (e) {}
        }

        generateRoomCode() {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let out = '';
            for (let i = 0; i < 6; i++) {
                out += chars[Math.floor(Math.random() * chars.length)];
            }
            return out;
        }

        getInviteUrl() {
            const code = this.roomCode || 'SQUAD1';
            const loc = window.location;
            if (loc.protocol === 'https:' || (loc.protocol === 'http:' && loc.hostname !== 'localhost' && loc.hostname !== '127.0.0.1')) {
                const base = loc.origin + loc.pathname.replace(/index\.html$/i, '');
                return `${base}?room=${code}`;
            }
            return `${GITHUB_PAGES_URL}?room=${code}`;
        }

        getLocalInviteUrl() {
            const code = this.roomCode || 'SQUAD1';
            const loc = window.location;
            const base = loc.origin && loc.origin !== 'null'
                ? (loc.origin + loc.pathname)
                : GITHUB_PAGES_URL;
            return `${base}?room=${code}`;
        }

        copyInviteLink(useLocal = false) {
            if (!this.active) {
                this.hostRoom();
            }
            const url = useLocal ? this.getLocalInviteUrl() : this.getInviteUrl();
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(() => {
                    BO.Events.emit('hud:toast', { text: `INVITE LINK COPIED: ${url}`, color: '#22c55e' });
                    BO.Events.emit('net:link_copied', { url });
                }).catch(() => {
                    this._fallbackCopyText(url);
                });
            } else {
                this._fallbackCopyText(url);
            }
            return url;
        }

        _fallbackCopyText(text) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch (e) {}
            document.body.removeChild(ta);
            BO.Events.emit('hud:toast', { text: `INVITE LINK COPIED: ${text}`, color: '#22c55e' });
            BO.Events.emit('net:link_copied', { url: text });
        }

        _updateUrlQuery(code) {
            try {
                if (window.history && window.history.replaceState) {
                    const url = new URL(window.location.href);
                    if (code) url.searchParams.set('room', code);
                    else url.searchParams.delete('room');
                    window.history.replaceState(null, '', url.toString());
                }
            } catch (e) {}
        }

        _buildMyProfile() {
            const info = BO.Progression ? BO.Progression.getRankInfo() : { level: 1, prestige: 0 };
            const cls = BO.Loadout ? BO.Loadout.getActiveClass() : { primary: { id: 'm4a1', camo: 'default' } };
            const curScore = BO.State.activeMode === 'zombies'
                ? (BO.ZombiesMode ? BO.ZombiesMode.points : 500)
                : (BO.State.activeMode === 'td' ? (BO.TowerDefenseMode ? BO.TowerDefenseMode.gold : 650) : (BO.MPMode ? BO.MPMode.playerScore : 0));
            const curKills = BO.State.activeMode === 'zombies'
                ? (BO.ZombiesMode ? BO.ZombiesMode.kills : 0)
                : (BO.State.activeMode === 'td' ? (BO.TowerDefenseMode ? BO.TowerDefenseMode.kills : 0) : (BO.MPMode ? BO.MPMode.playerKills : 0));
            const curDeaths = BO.State.activeMode === 'mp' && BO.MPMode ? BO.MPMode.playerDeaths : 0;

            return {
                peerId: this.myPeerId,
                isHost: this.isHost,
                callsign: (BO.Save && BO.Save.data && BO.Save.data.callsign) || 'OPERATOR',
                level: info.level || 1,
                prestige: info.prestige || 0,
                topHat: !!(BO.Save && BO.Save.data && BO.Save.data.unlockables && BO.Save.data.unlockables.topHatEquipped),
                weaponId: cls.primary ? cls.primary.id : 'm4a1',
                camo: cls.primary ? (cls.primary.camo || 'default') : 'default',
                team: this.myTeam,
                ready: true,
                ping: 0,
                kills: curKills,
                deaths: curDeaths,
                score: curScore
            };
        }

        hostRoom(customCode = null) {
            this.leaveRoom(false);

            const code = (customCode ? String(customCode).toUpperCase().replace(/[^A-Z0-9]/g, '') : '') || this.generateRoomCode();
            this.roomCode = code;
            this.isHost = true;
            this.active = true;
            this.myPeerId = ROOM_PREFIX + code.toLowerCase();
            this.status = 'connecting';
            this.statusText = `CREATING LOBBY [${code}]...`;

            this.players.clear();
            this.players.set(this.myPeerId, this._buildMyProfile());
            this._updateUrlQuery(code);
            this._setupBroadcastChannel(code);

            this.addChatMessage('SYSTEM', `Lobby ${code} created! Copy the Invite Link to invite friends.`, '#22c55e');
            BO.Events.emit('net:updated');

            if (typeof global.Peer === 'undefined') {
                this.status = 'hosting';
                this.statusText = `LOBBY [${code}] READY (LOCAL / LAN)`;
                BO.Events.emit('net:updated');
                return;
            }

            try {
                this.peer = new global.Peer(this.myPeerId, {
                    debug: 0,
                    config: { iceServers: ICE_SERVERS }
                });

                this.peer.on('open', (id) => {
                    this.myPeerId = id;
                    this.status = 'hosting';
                    this.statusText = `ONLINE HOST • ROOM [${this.roomCode}]`;
                    this.players.set(this.myPeerId, this._buildMyProfile());
                    BO.Events.emit('net:updated');
                });

                this.peer.on('connection', (conn) => {
                    this._bindHostIncomingConnection(conn);
                });

                this.peer.on('error', (err) => {
                    if (err && err.type === 'unavailable-id') {
                        // Room code already hosted on PeerJS! Join it as a client instead!
                        this.joinRoom(code, false);
                        return;
                    }
                    this.status = 'hosting';
                    this.statusText = `HOSTING [${this.roomCode}]`;
                    BO.Events.emit('net:updated');
                });
            } catch (e) {
                this.status = 'hosting';
                this.statusText = `HOSTING [${this.roomCode}]`;
                BO.Events.emit('net:updated');
            }
        }

        joinRoom(code, autoHostIfMissing = false) {
            if (!code) return;
            const clean = String(code).trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
            if (!clean) return;

            this.leaveRoom(false);
            this.roomCode = clean;
            this.isHost = false;
            this.active = true;
            this.myPeerId = 'client_' + Math.random().toString(36).slice(2, 9);
            this.status = 'connecting';
            this.statusText = `JOINING LOBBY [${clean}]...`;

            this.players.clear();
            this.players.set(this.myPeerId, this._buildMyProfile());
            this._updateUrlQuery(clean);
            this._setupBroadcastChannel(clean);

            // Send immediate BroadcastChannel join request in case Host is on same PC/LAN
            this._sendBC({ type: 'join_req', profile: this._buildMyProfile() });
            BO.Events.emit('net:updated');

            if (typeof global.Peer === 'undefined') {
                setTimeout(() => {
                    if (!this.isHost && this.players.size <= 1 && autoHostIfMissing) {
                        this.hostRoom(clean);
                    }
                }, 1200);
                return;
            }

            try {
                this.peer = new global.Peer(undefined, {
                    debug: 0,
                    config: { iceServers: ICE_SERVERS }
                });

                this.peer.on('open', (myId) => {
                    const oldId = this.myPeerId;
                    this.myPeerId = myId;
                    this.players.delete(oldId);
                    this.players.set(this.myPeerId, this._buildMyProfile());

                    const hostPeerId = ROOM_PREFIX + clean.toLowerCase();
                    const conn = this.peer.connect(hostPeerId, { reliable: true });
                    this.hostConn = conn;

                    conn.on('open', () => {
                        this.status = 'connected';
                        this.statusText = `CONNECTED TO LOBBY [${clean}]`;
                        conn.send({ type: 'join_req', profile: this._buildMyProfile() });
                        this.addChatMessage('SYSTEM', `Connected to Squad Lobby [${clean}]!`, '#38bdf8');
                        BO.Events.emit('net:updated');
                    });

                    conn.on('data', (msg) => {
                        this._handleMessage(msg, hostPeerId);
                    });

                    conn.on('close', () => {
                        if (this.active && !this.isHost) {
                            this.statusText = `HOST DISCONNECTED [${clean}]`;
                            this.addChatMessage('SYSTEM', 'Host disconnected from lobby.', '#ef4444');
                            BO.Events.emit('net:updated');
                        }
                    });
                });

                this.peer.on('error', (err) => {
                    if (err && err.type === 'peer-unavailable') {
                        if (autoHostIfMissing) {
                            // Nobody is hosting this link yet -> become the Host for this link!
                            this.hostRoom(clean);
                            return;
                        }
                        this.status = 'error';
                        this.statusText = `ROOM [${clean}] NOT FOUND`;
                        this.addChatMessage('SYSTEM', `Room [${clean}] not found. Check the code or click Host Online Lobby.`, '#ef4444');
                        BO.Events.emit('net:updated');
                    }
                });
            } catch (e) {
                if (autoHostIfMissing) this.hostRoom(clean);
            }
        }

        leaveRoom(clearUrl = true) {
            if (this.hostConn) {
                try { this.hostConn.send({ type: 'leave_notify', peerId: this.myPeerId }); } catch (e) {}
                try { this.hostConn.close(); } catch (e) {}
            }
            for (const conn of this.connections.values()) {
                try { conn.close(); } catch (e) {}
            }
            this.connections.clear();
            this.hostConn = null;

            if (this.peer) {
                try { this.peer.destroy(); } catch (e) {}
                this.peer = null;
            }
            if (this.bc) {
                try { this.bc.postMessage({ type: 'leave_notify', peerId: this.myPeerId }); } catch (e) {}
                try { this.bc.close(); } catch (e) {}
                this.bc = null;
            }

            this.clearRemoteAvatars();
            this.remoteStates.clear();
            this.players.clear();
            this.active = false;
            this.isHost = false;
            this.roomCode = '';
            this.status = 'offline';
            this.statusText = 'OFFLINE / SOLO MODE';
            if (clearUrl) this._updateUrlQuery(null);
            BO.Events.emit('net:updated');
        }

        _setupBroadcastChannel(code) {
            if (typeof BroadcastChannel === 'undefined') return;
            try {
                this.bc = new BroadcastChannel(ROOM_PREFIX + code.toLowerCase());
                this.bc.onmessage = (ev) => {
                    if (!ev.data || ev.data.senderId === this.myPeerId) return;
                    this._handleMessage(ev.data, ev.data.senderId);
                };
            } catch (e) {}
        }

        _sendBC(msg) {
            if (!this.bc) return;
            try {
                this.bc.postMessage(Object.assign({}, msg, { senderId: this.myPeerId }));
            } catch (e) {}
        }

        _bindHostIncomingConnection(conn) {
            conn.on('open', () => {
                this.connections.set(conn.peer, conn);
            });
            conn.on('data', (msg) => {
                this.connections.set(conn.peer, conn);
                this._handleMessage(msg, conn.peer);
            });
            conn.on('close', () => {
                this._removePlayer(conn.peer);
            });
            conn.on('error', () => {
                this._removePlayer(conn.peer);
            });
        }

        _removePlayer(peerId) {
            if (!peerId || peerId === this.myPeerId) return;
            const p = this.players.get(peerId);
            this.connections.delete(peerId);
            this.players.delete(peerId);
            this.remoteStates.delete(peerId);
            this._destroyRemoteAvatar(peerId);
            if (p) {
                this.addChatMessage('SYSTEM', `${p.callsign} left the squad.`, '#94a3b8');
                BO.Events.emit('hud:toast', { text: `${p.callsign} DISCONNECTED`, color: '#94a3b8' });
            }
            if (this.isHost) {
                this._broadcastRoster();
            }
            BO.Events.emit('net:updated');
        }

        sendToHost(msg) {
            if (!this.active) return;
            const packet = Object.assign({}, msg, {
                senderId: this.myPeerId,
                _seq: this.myPeerId + '_' + (this.seqCounter++)
            });
            if (this.isHost) {
                this._handleMessage(packet, this.myPeerId);
                return;
            }
            if (this.hostConn && this.hostConn.open) {
                try { this.hostConn.send(packet); } catch (e) {}
            }
            this._sendBC(packet);
        }

        broadcast(msg, excludePeerId = null) {
            if (!this.active) return;
            const packet = Object.assign({}, msg, {
                senderId: msg.senderId || this.myPeerId,
                _seq: (msg.senderId || this.myPeerId) + '_' + (this.seqCounter++)
            });
            if (this.isHost) {
                for (const [pid, conn] of this.connections.entries()) {
                    if (pid !== excludePeerId && conn && conn.open) {
                        try { conn.send(packet); } catch (e) {}
                    }
                }
                this._sendBC(packet);
            } else {
                this.sendToHost(packet);
            }
        }

        sendToPeer(targetPeerId, msg) {
            if (!this.active || !targetPeerId) return;
            const packet = Object.assign({}, msg, {
                senderId: this.myPeerId,
                targetPeerId,
                _seq: this.myPeerId + '_' + (this.seqCounter++)
            });
            if (targetPeerId === this.myPeerId) {
                this._handleMessage(packet, this.myPeerId);
                return;
            }
            const conn = this.connections.get(targetPeerId);
            if (conn && conn.open) {
                try { conn.send(packet); } catch (e) {}
            }
            this._sendBC(packet);
        }

        _broadcastRoster() {
            if (!this.isHost) return;
            this.players.set(this.myPeerId, this._buildMyProfile());
            const list = Array.from(this.players.values());
            this.broadcast({
                type: 'roster_sync',
                players: list,
                lobbySettings: this._captureCurrentLobbySettings()
            });
            BO.Events.emit('net:updated');
        }

        _captureCurrentLobbySettings() {
            if (!BO.Menus) return null;
            const M = BO.Menus;
            return {
                lobbyMode: M.lobbyMode,
                selectedZMap: M.selectedZMap,
                selectedZDifficulty: M.selectedZDifficulty,
                classicStarter: M.classicStarter,
                zStartProtocol: M.zStartProtocol || 'custom',
                selectedStartRound: M.selectedStartRound,
                selectedMpMode: M.selectedMpMode,
                selectedMpMap: M.selectedMpMap,
                selectedDifficulty: M.selectedDifficulty,
                selectedTdMap: M.selectedTdMap,
                tdConfig: M.tdConfig ? BO.Math.deepClone(M.tdConfig) : null,
                zModifiers: M.zModifiers ? BO.Math.deepClone(M.zModifiers) : null,
                zCustomValues: M.zCustomValues ? BO.Math.deepClone(M.zCustomValues) : null,
                customRules: BO.Math.deepClone(M.customRules)
            };
        }

        broadcastLobbySettings() {
            if (!this.active || !this.isHost) return;
            this.broadcast({
                type: 'lobby_settings',
                settings: this._captureCurrentLobbySettings()
            });
        }

        syncMyProfile() {
            if (!this.active) return;
            const prof = this._buildMyProfile();
            this.players.set(this.myPeerId, prof);
            if (this.isHost) {
                this._broadcastRoster();
            } else {
                this.sendToHost({ type: 'profile_update', profile: prof });
            }
            BO.Events.emit('net:updated');
        }

        setMyTeam(team) {
            this.myTeam = team === 1 ? 1 : 0;
            this.syncMyProfile();
        }

        sendChat(text) {
            if (!text || !String(text).trim()) return;
            const clean = String(text).trim().slice(0, 140);
            const sender = (BO.Save && BO.Save.data && BO.Save.data.callsign) || 'OPERATOR';
            const msg = {
                type: 'chat_msg',
                sender,
                text: clean,
                color: this.isHost ? '#fde047' : '#38bdf8'
            };
            this.addChatMessage(sender, clean, msg.color);
            this.broadcast(msg);
        }

        addChatMessage(sender, text, color = '#f8fafc') {
            this.chatMessages.push({ sender, text, color, time: Date.now() });
            if (this.chatMessages.length > 35) this.chatMessages.shift();
            BO.Events.emit('net:chat', { sender, text, color });
        }

        broadcastMatchStart(opts) {
            if (!this.active || !this.isHost) return;
            this._lastMatchOpts = BO.Math.deepClone(opts);
            this.broadcast({
                type: 'match_start',
                opts: this._lastMatchOpts
            });
        }

        /* ====================================================================
           MESSAGE ROUTER
        ==================================================================== */
        _handleMessage(msg, fromPeerId) {
            if (!msg || !msg.type) return;
            if (msg.targetPeerId && msg.targetPeerId !== this.myPeerId) return;

            if (msg._seq) {
                if (this.seenSeq.has(msg._seq)) return;
                this.seenSeq.add(msg._seq);
                if (this.seenSeq.size > 600) {
                    const first = this.seenSeq.values().next().value;
                    this.seenSeq.delete(first);
                }
            }

            const sender = msg.senderId || fromPeerId;

            if (msg.type === 'join_req') {
                if (!this.isHost) return;
                const prof = msg.profile || { peerId: sender, callsign: 'FRIEND' };
                prof.peerId = sender;
                prof.isHost = false;
                this.players.set(sender, prof);
                this.status = 'hosting';
                this.statusText = `ONLINE HOST • ${this.players.size} IN SQUAD`;
                this.addChatMessage('SYSTEM', `${prof.callsign} joined the lobby!`, '#22c55e');
                BO.Events.emit('hud:toast', { text: `${prof.callsign} JOINED YOUR LOBBY!`, color: '#22c55e' });
                BO.Sound.playUIClick();
                this._broadcastRoster();

                // If host is already playing a match, hot-join the friend right into the active match!
                if (BO.State.screen === 'playing' && BO.App && BO.App.lastMatchOpts) {
                    this.sendToPeer(sender, {
                        type: 'match_start',
                        opts: BO.App.lastMatchOpts
                    });
                }
                return;
            }

            if (msg.type === 'leave_notify') {
                this._removePlayer(msg.peerId || sender);
                return;
            }

            if (msg.type === 'profile_update') {
                if (msg.profile && msg.profile.peerId) {
                    this.players.set(msg.profile.peerId, msg.profile);
                    if (this.isHost) this._broadcastRoster();
                    BO.Events.emit('net:updated');
                }
                return;
            }

            if (msg.type === 'roster_sync') {
                if (this.isHost) return;
                this.status = 'connected';
                this.statusText = `CONNECTED • ${msg.players ? msg.players.length : 1} IN SQUAD`;
                this.players.clear();
                if (Array.isArray(msg.players)) {
                    for (const p of msg.players) {
                        this.players.set(p.peerId, p);
                    }
                }
                this.players.set(this.myPeerId, this._buildMyProfile());
                if (msg.lobbySettings && BO.Menus) {
                    this._applyLobbySettingsFromHost(msg.lobbySettings);
                }
                BO.Events.emit('net:updated');
                return;
            }

            if (msg.type === 'lobby_settings') {
                if (!this.isHost && msg.settings) {
                    this._applyLobbySettingsFromHost(msg.settings);
                }
                return;
            }

            if (msg.type === 'chat_msg') {
                if (sender !== this.myPeerId) {
                    this.addChatMessage(msg.sender || 'SQUAD', msg.text, msg.color || '#38bdf8');
                    if (BO.State.screen === 'playing') {
                        BO.Events.emit('hud:toast', { text: `${msg.sender}: ${msg.text}`, color: '#38bdf8' });
                    }
                }
                if (this.isHost) this.broadcast(msg, sender);
                return;
            }

            if (msg.type === 'match_start') {
                if (!this.isHost && msg.opts && BO.App) {
                    BO.Events.emit('hud:toast', { text: 'HOST LAUNCHED MATCH — DEPLOYING SQUAD!', color: '#22c55e' });
                    BO.App.startMatch(Object.assign({}, msg.opts, { _fromNetHost: true }));
                }
                return;
            }

            if (msg.type === 'player_state') {
                if (sender === this.myPeerId) return;
                this.remoteStates.set(sender, Object.assign({}, msg.state, { updatedAt: performance.now() }));
                const prof = this.players.get(sender);
                if (prof && msg.state) {
                    prof.callsign = msg.state.callsign || prof.callsign;
                    prof.weaponId = msg.state.weaponId || prof.weaponId;
                    prof.team = msg.state.team !== undefined ? msg.state.team : prof.team;
                    prof.kills = msg.state.kills ?? prof.kills;
                    prof.deaths = msg.state.deaths ?? prof.deaths;
                    prof.score = msg.state.score ?? prof.score;
                }
                if (this.isHost) {
                    this.broadcast(msg, sender);
                }
                return;
            }

            if (msg.type === 'player_fx') {
                if (sender !== this.myPeerId) {
                    this._playRemoteFx(msg.fx, sender);
                }
                if (this.isHost) {
                    this.broadcast(msg, sender);
                }
                return;
            }

            // Mode-Specific Packets (Zombies, Tower Defense, Multiplayer)
            if (msg.type.startsWith('z_')) {
                this._handleZombiesNetMessage(msg, sender);
                return;
            }
            if (msg.type.startsWith('td_')) {
                this._handleTowerDefenseNetMessage(msg, sender);
                return;
            }
            if (msg.type.startsWith('mp_')) {
                this._handleMultiplayerNetMessage(msg, sender);
                return;
            }
        }

        _applyLobbySettingsFromHost(s) {
            if (!BO.Menus || !s) return;
            const M = BO.Menus;
            M.lobbyMode = s.lobbyMode || M.lobbyMode;
            M.selectedZMap = s.selectedZMap || M.selectedZMap;
            M.selectedZDifficulty = s.selectedZDifficulty || M.selectedZDifficulty;
            M.classicStarter = !!s.classicStarter;
            if (s.zStartProtocol) M.zStartProtocol = s.zStartProtocol;
            M.selectedStartRound = s.selectedStartRound || 1;
            M.selectedMpMode = s.selectedMpMode || M.selectedMpMode;
            M.selectedMpMap = s.selectedMpMap || M.selectedMpMap;
            M.selectedDifficulty = s.selectedDifficulty || M.selectedDifficulty;
            M.selectedTdMap = s.selectedTdMap || M.selectedTdMap;
            if (s.tdConfig && M.tdConfig) {
                Object.assign(M.tdConfig, s.tdConfig);
                if (s.tdConfig.modifiers) Object.assign(M.tdConfig.modifiers, s.tdConfig.modifiers);
            }
            if (s.zModifiers && M.zModifiers) Object.assign(M.zModifiers, s.zModifiers);
            if (s.zCustomValues && M.zCustomValues) Object.assign(M.zCustomValues, s.zCustomValues);
            if (s.customRules) Object.assign(M.customRules, s.customRules);
            if (BO.State.screen === 'play_lobby') {
                M.renderLobby();
            }
        }

        /* ====================================================================
           3D REMOTE PLAYER AVATARS, HITBOXES & FLOATING HUD NAMEPLATES
        ==================================================================== */
        clearRemoteAvatars() {
            for (const pid of Array.from(this.remoteAvatars.keys())) {
                this._destroyRemoteAvatar(pid);
            }
            this.remoteAvatars.clear();
            if (this.elNameplates) this.elNameplates.innerHTML = '';
        }

        _destroyRemoteAvatar(peerId) {
            const av = this.remoteAvatars.get(peerId);
            if (!av) return;
            if (av.parts && av.parts.root && BO.World.scene) {
                BO.World.scene.remove(av.parts.root);
            }
            if (av.plateEl && av.plateEl.parentNode) {
                av.plateEl.parentNode.removeChild(av.plateEl);
            }
            this.remoteAvatars.delete(peerId);
        }

        _getOrCreateRemoteAvatar(peerId, st) {
            if (!BO.World.scene) return null;
            let av = this.remoteAvatars.get(peerId);
            const isEnemyInMp = BO.State.activeMode === 'mp' &&
                (BO.MPMode.modeType === 'ffa' || BO.MPMode.modeType === 'gun_game' || (st.team !== undefined && st.team !== this.myTeam));
            const teamVisual = isEnemyInMp ? 1 : 0;

            if (av && av.sceneRef !== BO.World.scene) {
                this._destroyRemoteAvatar(peerId);
                av = null;
            }
            if (av && av.teamVisual !== teamVisual) {
                this._destroyRemoteAvatar(peerId);
                av = null;
            }

            if (!av) {
                const remoteEnt = {
                    isRemotePlayer: true,
                    peerId,
                    alive: true,
                    pos: new THREE.Vector3(st.x || 0, st.y || 0, st.z || 0)
                };
                const parts = BO.CharacterMesh.buildSoldier(teamVisual, remoteEnt);
                if (parts.gunBody) parts.gunBody.visible = false; // Replaced by real 3D WeaponMesh!
                if (parts.bodyPivot) parts.bodyPivot.userData.baseY = parts.bodyPivot.position.y;
                parts.root.position.set(st.x || 0, st.y || 0, st.z || 0);
                BO.World.scene.add(parts.root);

                const hitboxes = [];
                parts.root.traverse((obj) => {
                    if (obj.isMesh && obj.userData.entity === remoteEnt) hitboxes.push(obj);
                });

                this._ensureNameplateLayer();
                const plateEl = document.createElement('div');
                plateEl.style.cssText = 'position:absolute;transform:translate(-50%,-100%);text-align:center;pointer-events:none;white-space:nowrap;font-family:var(--font-ui);';
                if (this.elNameplates) this.elNameplates.appendChild(plateEl);

                av = {
                    peerId,
                    sceneRef: BO.World.scene,
                    teamVisual,
                    entity: remoteEnt,
                    parts,
                    hitboxes,
                    weaponRoot: null,
                    lastWeaponKey: '',
                    pos: new THREE.Vector3(st.x || 0, st.y || 0, st.z || 0),
                    yaw: st.yaw || 0,
                    animPhase: 0,
                    plateEl
                };
                this.remoteAvatars.set(peerId, av);
            }
            return av;
        }

        _updateRemoteAvatarWeapon(av, st) {
            const wId = st.weaponId || 'm4a1';
            const camo = st.camo || 'default';
            const isPaP = !!st.isPaP;
            const key = `${wId}_${camo}_${isPaP ? 1 : 0}`;
            if (av.lastWeaponKey === key) return;
            av.lastWeaponKey = key;

            if (av.weaponRoot && av.parts.armR) {
                av.parts.armR.remove(av.weaponRoot);
                av.weaponRoot = null;
            }
            try {
                const built = BO.WeaponMesh.buildWeapon(wId, {}, camo, isPaP, false, false);
                built.root.scale.setScalar(0.85);
                built.root.position.set(-0.08, -0.35, 0.24);
                built.root.rotation.set(0.95, Math.PI, 0);
                av.parts.armR.add(built.root);
                av.weaponRoot = built.root;
            } catch (e) {}
        }

        sendPlayerFx(fx) {
            if (!this.active || BO.State.screen !== 'playing') return;
            this.broadcast({
                type: 'player_fx',
                fx
            });
        }

        _playRemoteFx(fx, senderId) {
            if (!fx || !BO.World.scene || BO.State.screen !== 'playing') return;
            const P = BO.Player;
            if (fx.kind === 'shot') {
                const st = this.remoteStates.get(senderId);
                if (st) {
                    const d = BO.Math.dist3D(P.pos.x, P.pos.y, P.pos.z, st.x, st.y, st.z);
                    const vol = BO.Math.clamp(1 - d / 55, 0.08, 0.85);
                    BO.Sound.playGunshot(fx.soundProfile || 'ar_light', !!fx.suppressed, !!fx.isPaP, vol);
                }
            } else if (fx.kind === 'tracer') {
                BO.FX.spawnTracer(
                    new THREE.Vector3(fx.sx, fx.sy, fx.sz),
                    new THREE.Vector3(fx.ex, fx.ey, fx.ez),
                    fx.color || 0xffd166,
                    fx.isPaP ? 0.035 : 0.022,
                    0.08
                );
            } else if (fx.kind === 'explosion') {
                const pos = new THREE.Vector3(fx.x, fx.y, fx.z);
                BO.FX.spawnExplosion(pos, fx.radius || 5.0, fx.color || 0xff6600);
                const d = P.pos.distanceTo(pos);
                const vol = BO.Math.clamp(1 - d / 65, 0.1, 1.0);
                BO.Sound.playExplosion(vol);
            }
        }

        getRemoteHitboxMeshes() {
            if (!this.active || BO.State.activeMode !== 'mp') return [];
            const isFFA = BO.MPMode.modeType === 'ffa' || BO.MPMode.modeType === 'gun_game';
            const out = [];
            for (const [pid, av] of this.remoteAvatars.entries()) {
                const st = this.remoteStates.get(pid);
                if (!st || !st.alive) continue;
                const hostile = isFFA || (st.team !== undefined && st.team !== this.myTeam);
                if (hostile && av.hitboxes) {
                    for (let i = 0; i < av.hitboxes.length; i++) {
                        out.push(av.hitboxes[i]);
                    }
                }
            }
            return out;
        }

        getClosestLivingPlayer(fromPos) {
            const P = BO.Player;
            let best = {
                isLocal: true,
                peerId: this.myPeerId,
                pos: P.pos,
                alive: P.alive && !P.inLastStand && !P.aetherActive,
                dist: (P.alive && !P.inLastStand && !P.aetherActive) ? fromPos.distanceTo(P.pos) : Infinity
            };

            if (!this.active) return best;

            for (const [pid, st] of this.remoteStates.entries()) {
                if (!st || !st.alive || st.inLastStand) continue;
                const rPos = new THREE.Vector3(st.x, st.y, st.z);
                const d = fromPos.distanceTo(rPos);
                if (d < best.dist) {
                    best = {
                        isLocal: false,
                        peerId: pid,
                        pos: rPos,
                        alive: true,
                        dist: d
                    };
                }
            }
            return best;
        }

        isAnySquadmateAlive() {
            if (BO.Player.alive && !BO.Player.inLastStand) return true;
            if (!this.active) return false;
            for (const st of this.remoteStates.values()) {
                if (st && st.alive && !st.inLastStand) return true;
            }
            return false;
        }

        getDownedTeammateNear(pos, maxDist = 3.5) {
            if (!this.active) return null;
            let best = null;
            let bestD = maxDist;
            for (const [pid, st] of this.remoteStates.entries()) {
                if (!st || (!st.inLastStand && st.alive)) continue;
                const d = BO.Math.dist3D(pos.x, pos.y, pos.z, st.x, st.y, st.z);
                if (d <= bestD) {
                    bestD = d;
                    best = { peerId: pid, callsign: st.callsign || 'TEAMMATE', dist: d };
                }
            }
            return best;
        }

        reviveTeammate(peerId) {
            if (!this.active || !peerId) return false;
            this.broadcast({
                type: 'z_revive_player',
                targetPeerId: peerId,
                reviverCallsign: (BO.Save && BO.Save.data && BO.Save.data.callsign) || 'TEAMMATE'
            });
            BO.Sound.playPerkBuy();
            BO.Events.emit('hud:toast', { text: 'TEAMMATE REVIVED! +150 PTS', color: '#22c55e' });
            if (BO.State.activeMode === 'zombies' && BO.ZombiesMode) {
                BO.ZombiesMode.addPoints(150, 'REVIVE');
            }
            return true;
        }

        update(dt, worldCamera) {
            if (!this.active) return;

            if (BO.State.screen !== 'playing') {
                if (this.remoteAvatars.size > 0) this.clearRemoteAvatars();
                return;
            }

            // 1. Broadcast local player state at 20 Hz
            this.stateSendAccum += dt;
            if (this.stateSendAccum >= 0.05) {
                this.stateSendAccum = 0;
                const P = BO.Player;
                const aw = P.activeWeapon;
                const curScore = BO.State.activeMode === 'zombies'
                    ? (BO.ZombiesMode ? BO.ZombiesMode.points : 500)
                    : (BO.State.activeMode === 'td' ? (BO.TowerDefenseMode ? BO.TowerDefenseMode.gold : 650) : (BO.MPMode ? BO.MPMode.playerScore : 0));
                const curKills = BO.State.activeMode === 'zombies'
                    ? (BO.ZombiesMode ? BO.ZombiesMode.kills : 0)
                    : (BO.State.activeMode === 'td' ? (BO.TowerDefenseMode ? BO.TowerDefenseMode.kills : 0) : (BO.MPMode ? BO.MPMode.playerKills : 0));
                const curDeaths = BO.State.activeMode === 'mp' && BO.MPMode ? BO.MPMode.playerDeaths : 0;

                this.broadcast({
                    type: 'player_state',
                    state: {
                        callsign: (BO.Save && BO.Save.data && BO.Save.data.callsign) || 'OPERATOR',
                        team: this.myTeam,
                        x: Number(P.pos.x.toFixed(2)),
                        y: Number(P.pos.y.toFixed(2)),
                        z: Number(P.pos.z.toFixed(2)),
                        vx: Number(P.vel.x.toFixed(2)),
                        vz: Number(P.vel.z.toFixed(2)),
                        yaw: Number(P.yaw.toFixed(3)),
                        pitch: Number(P.pitch.toFixed(3)),
                        hp: Math.ceil(P.hp),
                        maxHp: P.maxHp,
                        armor: Math.ceil(P.armor),
                        alive: P.alive,
                        inLastStand: P.inLastStand,
                        crouching: P.crouching || P.sliding,
                        weaponId: aw ? aw.cfg.id : 'm4a1',
                        camo: aw ? (aw.cfg.camo || 'default') : 'default',
                        isPaP: !!(aw && aw.isPaP),
                        kills: curKills,
                        deaths: curDeaths,
                        score: curScore
                    }
                });
            }

            // 2. Host broadcasts mode state snapshot at 15 Hz
            if (this.isHost) {
                this.modeSnapAccum += dt;
                if (this.modeSnapAccum >= 0.066) {
                    this.modeSnapAccum = 0;
                    if (BO.State.activeMode === 'zombies' && BO.ZombiesMode && BO.ZombiesMode.active) {
                        this._broadcastZombiesSnapshot();
                    } else if (BO.State.activeMode === 'td' && BO.TowerDefenseMode && BO.TowerDefenseMode.active) {
                        this._broadcastTdSnapshot();
                    } else if (BO.State.activeMode === 'mp' && BO.MPMode && BO.MPMode.active) {
                        this._broadcastMpSnapshot();
                    }
                }
            }

            // 3. Interpolate 3D Remote Player Avatars & Render Floating Nameplates
            const w = window.innerWidth;
            const h = window.innerHeight;

            for (const [pid, st] of this.remoteStates.entries()) {
                if (pid === this.myPeerId) continue;
                const av = this._getOrCreateRemoteAvatar(pid, st);
                if (!av) continue;

                this._updateRemoteAvatarWeapon(av, st);

                const targetPos = new THREE.Vector3(st.x || 0, st.y || 0, st.z || 0);
                av.pos.lerp(targetPos, Math.min(1, dt * 15));
                av.yaw += BO.Math.angleDiff(av.yaw, (st.yaw || 0) + Math.PI) * Math.min(1, dt * 15);

                av.entity.alive = !!st.alive;
                av.entity.pos.copy(av.pos);

                const isDowned = !st.alive || st.inLastStand;
                av.parts.root.visible = st.alive || BO.State.activeMode !== 'mp';
                av.parts.root.position.copy(av.pos);
                av.parts.root.rotation.y = av.yaw;

                if (av.parts.bodyPivot) {
                    const baseY = av.parts.bodyPivot.userData.baseY || 0.82;
                    av.parts.bodyPivot.position.y = isDowned ? 0.32 : (st.crouching ? baseY - 0.32 : baseY);
                }

                const spd = Math.hypot(st.vx || 0, st.vz || 0);
                av.animPhase += dt * (spd * 2.3 + 1.0);
                BO.CharacterMesh.animateLimbs(av.parts, isDowned ? 0 : spd, av.animPhase, 0, 0);

                // Project 3D head position to 2D screen coordinates for floating squad nameplate
                if (av.plateEl && worldCamera) {
                    const headPos = av.pos.clone().add(new THREE.Vector3(0, isDowned ? 1.0 : 2.05, 0));
                    const projected = headPos.project(worldCamera);
                    if (projected.z > 1.0 || (!st.alive && BO.State.activeMode === 'mp')) {
                        av.plateEl.style.display = 'none';
                    } else {
                        const sx = (projected.x * 0.5 + 0.5) * w;
                        const sy = (-projected.y * 0.5 + 0.5) * h;
                        av.plateEl.style.display = 'block';
                        av.plateEl.style.left = `${sx}px`;
                        av.plateEl.style.top = `${sy}px`;

                        const isEnemy = av.teamVisual === 1;
                        const nameCol = isDowned ? '#ef4444' : (isEnemy ? '#f87171' : '#38bdf8');
                        const hpPct = BO.Math.clamp(Math.round(((st.hp || 0) / Math.max(1, st.maxHp || 100)) * 100), 0, 100);
                        const statusBadge = isDowned && BO.State.activeMode !== 'mp'
                            ? `<div style="color:#fde047;background:rgba(220,38,38,0.9);padding:2px 6px;font-size:10px;font-weight:800;border:1px solid #fde047;margin-bottom:2px;">⚠ DOWNED — PRESS [E] NEARBY TO REVIVE</div>`
                            : '';

                        av.plateEl.innerHTML = `
                            ${statusBadge}
                            <div style="font-size:11.5px;font-weight:800;letter-spacing:1px;color:${nameCol};text-shadow:0 1px 4px #000,0 0 6px #000;">
                                ${isEnemy ? '⚔ ' : '★ '}${st.callsign || 'FRIEND'}
                            </div>
                            <div style="width:68px;height:5px;background:rgba(0,0,0,0.75);border:1px solid rgba(255,255,255,0.22);margin:2px auto 0;">
                                <div style="width:${hpPct}%;height:100%;background:${isEnemy ? '#ef4444' : '#22c55e'};"></div>
                            </div>
                        `;
                    }
                }
            }
        }

        /* ====================================================================
           MODE 1: COD ZOMBIES CO-OP NETWORK SYNC
        ==================================================================== */
        _broadcastZombiesSnapshot() {
            const zm = BO.ZombiesMode;
            if (!zm || !zm.active) return;

            const zList = [];
            for (let i = 0; i < zm.zombies.length; i++) {
                const z = zm.zombies[i];
                if (!z.alive && z.deathTimer <= 0) continue;
                zList.push([
                    z.id,
                    z.spec.id,
                    z.isBoss ? 1 : 0,
                    Number(z.pos.x.toFixed(2)),
                    Number(z.pos.y.toFixed(2)),
                    Number(z.pos.z.toFixed(2)),
                    Number(z.yaw.toFixed(2)),
                    Math.ceil(z.hp),
                    z.maxHp,
                    z.alive ? 1 : 0,
                    Number((z.attackSwing || 0).toFixed(2)),
                    z.frozenTimer > 0 ? 1 : 0,
                    z.danceTimer > 0 ? 1 : 0,
                    z.decapitated ? 1 : 0
                ]);
            }

            const puList = zm.powerUps.map((p) => [
                p.id, p.label, p.color,
                Number(p.pos.x.toFixed(2)), Number(p.pos.y.toFixed(2)), Number(p.pos.z.toFixed(2))
            ]);

            this.broadcast({
                type: 'z_snapshot',
                snap: {
                    round: zm.round,
                    state: zm.state,
                    remainingToSpawn: zm.remainingToSpawn,
                    instaKillTimer: Number(zm.instaKillTimer.toFixed(1)),
                    doublePointsTimer: Number(zm.doublePointsTimer.toFixed(1)),
                    fireSaleTimer: Number(zm.fireSaleTimer.toFixed(1)),
                    exfilAvailable: zm.exfilAvailable,
                    exfilActive: zm.exfilActive,
                    exfilTimer: Number(zm.exfilTimer.toFixed(1)),
                    powerOn: BO.World.powerOn,
                    zombies: zList,
                    powerUps: puList
                }
            });
        }

        _handleZombiesNetMessage(msg, sender) {
            const zm = BO.ZombiesMode;
            if (!zm || !zm.active) return;

            if (msg.type === 'z_snapshot' && !this.isHost) {
                this._applyZombiesSnapshotOnClient(msg.snap);
                return;
            }

            if (msg.type === 'z_hit' && this.isHost) {
                const z = zm.zombies.find((x) => x.id === msg.zid);
                if (z && z.alive) {
                    const killed = z.takeDamage(msg.dmg, msg.hitbox || 'torso', !!msg.isHead, null, msg.dmgKind || 'bullet');
                    if (killed) {
                        zm.kills++;
                        if (z === zm.activeBoss) {
                            zm.activeBoss = null;
                            zm._spawnPowerUp(z.pos.x, z.pos.y, z.pos.z, z.spec.drops?.guaranteedPowerUp || 'max_ammo');
                        } else if (Math.random() < (z.spec.drops?.dropChance || 0.085)) {
                            zm._spawnPowerUp(z.pos.x, z.pos.y, z.pos.z, null);
                        }
                        this.sendToPeer(sender, {
                            type: 'z_kill_confirm',
                            zid: z.id,
                            isBoss: z.isBoss,
                            isHead: !!msg.isHead,
                            points: z.spec.drops?.points || 60,
                            xp: z.isBoss ? 800 : (msg.isHead ? 90 : 60)
                        });
                    }
                }
                return;
            }

            if (msg.type === 'z_kill_confirm' && !this.isHost) {
                zm.kills++;
                if (msg.isHead) zm.headshots++;
                BO.Progression.grantPlayerXP(msg.xp || 60);
                return;
            }

            if (msg.type === 'z_world_event') {
                const ev = msg.event;
                if (!ev) return;
                if (ev.kind === 'open_door') {
                    const inter = BO.World.interactives.find((i) => i.type === 'door' && i.data.id === ev.doorId);
                    if (inter && !inter.opened) {
                        BO.World.openDoor(inter);
                        BO.Events.emit('hud:toast', { text: `${ev.actor || 'SQUAD'} UNLOCKED ${inter.data.label}`, color: '#f5a623' });
                    }
                } else if (ev.kind === 'power_on') {
                    if (!BO.World.powerOn) {
                        BO.World.activatePower();
                        BO.Events.emit('hud:banner', { title: 'POWER RESTORED', sub: `${ev.actor || 'SQUAD'} ACTIVATED MAIN POWER!`, color: '#38bdf8' });
                    }
                } else if (ev.kind === 'powerup') {
                    zm._collectPowerUp({ id: ev.id, label: ev.label, color: ev.color });
                } else if (ev.kind === 'exfil_start') {
                    if (!zm.exfilActive) zm.startExfil(true);
                }
                if (this.isHost) this.broadcast(msg, sender);
                return;
            }

            if (msg.type === 'z_damage_player') {
                if (msg.targetPeerId === this.myPeerId && BO.Player.alive) {
                    BO.Player.takeDamage(msg.damage || 30, new THREE.Vector3(msg.ax || 0, msg.ay || 0, msg.az || 0), false);
                }
                return;
            }

            if (msg.type === 'z_revive_player') {
                if (msg.targetPeerId === this.myPeerId) {
                    BO.Player.inLastStand = false;
                    BO.Player.alive = true;
                    BO.Player.hp = BO.Player.maxHp;
                    BO.Player.reviveGraceTimer = 2.5;
                    BO.Sound.playPerkBuy();
                    BO.Events.emit('hud:banner', {
                        title: 'REVIVED BY ' + (msg.reviverCallsign || 'TEAMMATE') + '!',
                        sub: 'BACK IN THE FIGHT!',
                        color: '#22c55e'
                    });
                }
                if (this.isHost) this.broadcast(msg, sender);
            }
        }

        _applyZombiesSnapshotOnClient(snap) {
            const zm = BO.ZombiesMode;
            if (!zm || !snap) return;

            if (snap.round !== zm.round) {
                const prev = zm.round;
                zm.round = snap.round;
                if (zm.round > prev) {
                    BO.Sound.playRoundStart(zm.round, false);
                    BO.Events.emit('hud:banner', {
                        title: 'ROUND ' + BO.Math.toRoman(zm.round),
                        sub: 'SQUAD SURVIVAL',
                        color: '#dc2626'
                    });
                }
            }
            zm.state = snap.state;
            zm.remainingToSpawn = snap.remainingToSpawn;
            zm.instaKillTimer = snap.instaKillTimer;
            zm.doublePointsTimer = snap.doublePointsTimer;
            zm.fireSaleTimer = snap.fireSaleTimer;
            zm.exfilAvailable = snap.exfilAvailable;
            if (snap.exfilActive && !zm.exfilActive) zm.startExfil(true);
            zm.exfilTimer = snap.exfilTimer;
            if (snap.powerOn && !BO.World.powerOn) BO.World.activatePower();

            const seenIds = new Set();
            const mapById = new Map();
            for (const z of zm.zombies) mapById.set(z.id, z);

            zm.activeBoss = null;
            for (const row of snap.zombies) {
                const [id, typeId, isBoss, x, y, z, yaw, hp, maxHp, alive, swing, frozen, dance, decap] = row;
                seenIds.add(id);
                let ent = mapById.get(id);
                if (!ent) {
                    const spec = isBoss
                        ? (Object.values(BO.ZombiesData.BOSSES_BY_ROUND).find((b) => b.id === typeId) || BO.ZombiesData.get(typeId))
                        : BO.ZombiesData.get(typeId);
                    ent = new BO.ZombieEntity({
                        id,
                        spec,
                        round: zm.round,
                        hp: maxHp,
                        speed: spec.speed,
                        damage: spec.attack,
                        x, y, z
                    });
                    zm.zombies.push(ent);
                }
                ent.netTargetPos = new THREE.Vector3(x, y, z);
                ent.netTargetYaw = yaw;
                ent.hp = hp;
                ent.maxHp = maxHp;
                ent.alive = alive === 1;
                ent.attackSwing = swing;
                ent.frozenTimer = frozen ? 1.0 : 0;
                ent.danceTimer = dance ? 1.0 : 0;
                if (decap && ent.parts && ent.parts.headGroup) {
                    ent.decapitated = true;
                    ent.parts.headGroup.visible = false;
                }
                if (ent.isBoss && ent.alive) zm.activeBoss = ent;
            }

            for (let i = zm.zombies.length - 1; i >= 0; i--) {
                const z = zm.zombies[i];
                if (!seenIds.has(z.id)) {
                    z.destroy();
                    zm.zombies.splice(i, 1);
                }
            }
        }

        /* ====================================================================
           MODE 2: TOWER DEFENSE CO-OP NETWORK SYNC
        ==================================================================== */
        _broadcastTdSnapshot() {
            const td = BO.TowerDefenseMode;
            if (!td || !td.active) return;

            const zList = [];
            for (const z of td.zombies) {
                if (!z.alive && z.deathTimer <= 0) continue;
                zList.push([
                    z.id, z.spec.id, z.isBoss ? 1 : 0,
                    Number(z.pos.x.toFixed(2)), Number(z.pos.y.toFixed(2)), Number(z.pos.z.toFixed(2)),
                    Number(z.yaw.toFixed(2)), Math.ceil(z.hp), z.maxHp, z.alive ? 1 : 0,
                    z.hasGun ? 1 : 0, z.isMagical ? 1 : 0, Number((z.sizeMult || 1).toFixed(2))
                ]);
            }

            this.broadcast({
                type: 'td_snapshot',
                snap: {
                    wave: td.wave,
                    state: td.state,
                    intermissionTimer: Number(td.intermissionTimer.toFixed(1)),
                    remainingToSpawn: td.remainingToSpawn,
                    heartHp: Math.ceil(td.heartHp),
                    heartMaxHp: td.heartMaxHp,
                    layerHps: td.layers.map((l) => Math.ceil(l.hp)),
                    turretCount: td.turrets.length,
                    zombies: zList
                }
            });
        }

        _handleTowerDefenseNetMessage(msg, sender) {
            const td = BO.TowerDefenseMode;
            if (!td || !td.active) return;

            if (msg.type === 'td_snapshot' && !this.isHost) {
                const snap = msg.snap;
                td.wave = snap.wave;
                td.state = snap.state;
                td.intermissionTimer = snap.intermissionTimer;
                td.remainingToSpawn = snap.remainingToSpawn;
                td.heartHp = snap.heartHp;
                td.heartMaxHp = snap.heartMaxHp;
                if (Array.isArray(snap.layerHps)) {
                    for (let i = 0; i < td.layers.length && i < snap.layerHps.length; i++) {
                        if (td.layers[i].hp !== snap.layerHps[i]) {
                            td.layers[i].hp = snap.layerHps[i];
                            td._syncLayerVisual(td.layers[i]);
                        }
                    }
                }
                // Ensure client visual turrets match host count
                const pads = BO.World.mapData.turretPads || [];
                while (td.turrets.length < (snap.turretCount || 0) && td.turrets.length < pads.length) {
                    const pad = pads[td.turrets.length];
                    const tm = BO.CharacterMesh.buildSentryTurret();
                    tm.root.position.set(pad.x, pad.y, pad.z);
                    BO.World.scene.add(tm.root);
                    td.turrets.push({ x: pad.x, y: pad.y, z: pad.z, mesh: tm.root, headGroup: tm.headGroup, damage: 45, interval: 0.24, cooldown: 0 });
                }

                const seen = new Set();
                const mapById = new Map();
                for (const z of td.zombies) mapById.set(z.id, z);

                for (const row of snap.zombies) {
                    const [id, typeId, isBoss, x, y, z, yaw, hp, maxHp, alive, hasGun, isMagical, sizeMult] = row;
                    seen.add(id);
                    let ent = mapById.get(id);
                    if (!ent) {
                        const spec = isBoss
                            ? (Object.values(BO.ZombiesData.BOSSES_BY_ROUND).find((b) => b.id === typeId) || BO.ZombiesData.get(typeId))
                            : BO.ZombiesData.get(typeId);
                        ent = new BO.ZombieEntity({
                            id, spec, round: td.wave, hp: maxHp, speed: spec.speed, damage: spec.attack, x, y, z,
                            hasGun: hasGun === 1, isMagical: isMagical === 1, sizeMult: sizeMult || 1.0
                        });
                        td.zombies.push(ent);
                    }
                    ent.netTargetPos = new THREE.Vector3(x, y, z);
                    ent.netTargetYaw = yaw;
                    ent.hp = hp;
                    ent.maxHp = maxHp;
                    ent.alive = alive === 1;
                }
                for (let i = td.zombies.length - 1; i >= 0; i--) {
                    if (!seen.has(td.zombies[i].id)) {
                        td.zombies[i].destroy();
                        td.zombies.splice(i, 1);
                    }
                }
                return;
            }

            if (msg.type === 'td_hit' && this.isHost) {
                const z = td.zombies.find((x) => x.id === msg.zid);
                if (z && z.alive) {
                    if (z.takeDamage(msg.dmg, msg.hitbox || 'torso', !!msg.isHead, null, 'bullet')) {
                        td.kills++;
                    }
                }
                return;
            }

            if (msg.type === 'td_action' && this.isHost) {
                const act = msg.action;
                if (act === 'skip_wait') {
                    td.skipIntermission();
                } else if (act === 'deployable' && msg.depId) {
                    td._spawnDeployableEntity(msg.depId);
                } else if (act === 'barrier') {
                    for (let i = td.layers.length - 1; i >= 0; i--) {
                        if (td.layers[i].hp < td.layers[i].maxHp) {
                            td.layers[i].hp = Math.min(td.layers[i].maxHp, td.layers[i].hp + 125);
                            td._syncLayerVisual(td.layers[i]);
                            break;
                        }
                    }
                } else if (act === 'turret') {
                    const pads = BO.World.mapData.turretPads || [];
                    if (td.turrets.length < pads.length) {
                        const pad = pads[td.turrets.length];
                        const tm = BO.CharacterMesh.buildSentryTurret();
                        tm.root.position.set(pad.x, pad.y, pad.z);
                        BO.World.scene.add(tm.root);
                        td.turrets.push({ x: pad.x, y: pad.y, z: pad.z, mesh: tm.root, headGroup: tm.headGroup, damage: 45, interval: 0.24, cooldown: 0 });
                    }
                } else if (act === 'dog') {
                    const sp = BO.World.mapData.stairBottomPoint || { x: 0, y: 0, z: -2 };
                    const dog = {
                        parts: BO.CharacterMesh.buildGuardDog(null),
                        pos: new THREE.Vector3(sp.x + BO.Math.randRange(-2, 2), sp.y, sp.z),
                        yaw: 0, hp: 300, maxHp: 300, animPhase: 0, attackCd: 0
                    };
                    dog.parts.root.position.copy(dog.pos);
                    BO.World.scene.add(dog.parts.root);
                    td.dogs.push(dog);
                } else if (act === 'teammate') {
                    const sp = BO.World.mapData.stairBottomPoint || { x: 0, y: 0, z: -2 };
                    const ally = {
                        parts: BO.CharacterMesh.buildSoldier(0, null),
                        pos: new THREE.Vector3(sp.x + BO.Math.randRange(-2, 2), sp.y, sp.z),
                        yaw: 0, animPhase: 0, cooldown: 0, wavesLeft: 2
                    };
                    ally.parts.root.position.copy(ally.pos);
                    BO.World.scene.add(ally.parts.root);
                    td.allies.push(ally);
                }
            }
        }

        /* ====================================================================
           MODE 3: MULTIPLAYER CO-OP & PVP NETWORK SYNC
        ==================================================================== */
        _broadcastMpSnapshot() {
            const mp = BO.MPMode;
            if (!mp || !mp.active) return;

            const botRows = mp.bots.map((b) => [
                b.id, b.team, b.alive ? 1 : 0,
                Number(b.pos.x.toFixed(2)), Number(b.pos.y.toFixed(2)), Number(b.pos.z.toFixed(2)),
                Number(b.yaw.toFixed(2)), Math.ceil(b.hp), b.kills, b.deaths, b.score, b.corpse?.impulse || null
            ]);

            this.broadcast({
                type: 'mp_snapshot',
                snap: {
                    teamScores: mp.teamScores,
                    timeRemaining: Number(mp.timeRemaining.toFixed(1)),
                    domStates: mp.domStates.map((d) => ({ id: d.id, owner: d.owner, progress: Number(d.progress.toFixed(2)) })),
                    hpIndex: mp.hpIndex,
                    hpTimer: Number(mp.hpTimer.toFixed(1)),
                    hpOwner: mp.hpOwner,
                    bots: botRows
                }
            });
        }

        _handleMultiplayerNetMessage(msg, sender) {
            const mp = BO.MPMode;
            if (!mp || !mp.active) return;

            if (msg.type === 'mp_snapshot' && !this.isHost) {
                const snap = msg.snap;
                if (snap.teamScores) {
                    mp.teamScores[0] = snap.teamScores[0];
                    mp.teamScores[1] = snap.teamScores[1];
                }
                mp.timeRemaining = snap.timeRemaining;
                if (Array.isArray(snap.domStates)) {
                    for (let i = 0; i < mp.domStates.length && i < snap.domStates.length; i++) {
                        mp.domStates[i].owner = snap.domStates[i].owner;
                        mp.domStates[i].progress = snap.domStates[i].progress;
                    }
                }
                mp.hpIndex = snap.hpIndex;
                mp.hpTimer = snap.hpTimer;
                mp.hpOwner = snap.hpOwner;

                if (Array.isArray(snap.bots)) {
                    for (const row of snap.bots) {
                        const [id, team, alive, x, y, z, yaw, hp, kills, deaths, score, impulse] = row;
                        const b = mp.bots.find((x) => x.id === id);
                        if (b) {
                            b.team = team;
                            const willLive = alive === 1;
                            if (willLive && !b.alive) {
                                b.spawnAt({ x, y, z, yaw });
                            } else if (!willLive && b.alive && impulse) {
                                b.pos.set(x, y, z);
                                b.parts.root.position.copy(b.pos);
                                b.parts.root.rotation.y = yaw;
                                b._startCorpse(null, 0, impulse);
                            }
                            b.alive = willLive;
                            b.parts.root.visible = willLive || !!b.corpse;
                            b.netTargetPos = new THREE.Vector3(x, y, z);
                            b.netTargetYaw = yaw;
                            b.hp = hp;
                            b.kills = kills;
                            b.deaths = deaths;
                            b.score = score;
                        }
                    }
                }
                return;
            }

            // Client or Host shot another Human Player (PvP!)
            if (msg.type === 'mp_hit_player') {
                if (msg.targetPeerId === this.myPeerId && BO.Player.alive) {
                    const prevAlive = BO.Player.alive;
                    const st = this.remoteStates.get(sender);
                    const attPos = st ? new THREE.Vector3(st.x, st.y, st.z) : null;
                    BO.Player.takeDamage(msg.dmg || 30, attPos, false);
                    if (prevAlive && !BO.Player.alive) {
                        // Notify the killer that they eliminated us!
                        this.broadcast({
                            type: 'mp_player_killed',
                            killerPeerId: sender,
                            killerCallsign: msg.attackerCallsign || 'ENEMY',
                            victimPeerId: this.myPeerId,
                            victimCallsign: (BO.Save && BO.Save.data && BO.Save.data.callsign) || 'YOU',
                            killerTeam: msg.attackerTeam ?? 0,
                            weaponLabel: msg.weaponLabel || 'WEAPON',
                            weaponId: msg.weaponId || null,
                            isHead: !!msg.isHead
                        });
                    }
                }
                if (this.isHost && msg.targetPeerId !== this.myPeerId) {
                    this.sendToPeer(msg.targetPeerId, msg);
                }
                return;
            }

            if (msg.type === 'mp_player_killed') {
                if (this.isHost && mp.modeType === 'tdm') {
                    const kt = msg.killerTeam === 1 ? 1 : 0;
                    mp.teamScores[kt]++;
                }
                if (msg.killerPeerId === this.myPeerId) {
                    mp._awardPlayerKill({ name: msg.victimCallsign, pos: BO.Player.pos }, !!msg.isHead, msg.weaponLabel, msg.weaponId);
                } else {
                    BO.Events.emit('hud:killfeed', {
                        killer: msg.killerCallsign,
                        victim: msg.victimCallsign,
                        weapon: msg.weaponLabel,
                        isPlayerKiller: false,
                        headshot: !!msg.isHead
                    });
                }
                if (this.isHost) this.broadcast(msg, sender);
                return;
            }

            if (msg.type === 'mp_hit_bot' && this.isHost) {
                const bot = mp.bots.find((b) => b.id === msg.botId);
                if (bot && bot.alive) {
                    if (bot.takeDamage(msg.dmg, sender)) {
                        const kt = msg.attackerTeam === 1 ? 1 : 0;
                        if (mp.modeType === 'tdm') mp.teamScores[kt]++;
                        this.broadcast({
                            type: 'mp_bot_killed_by_peer',
                            killerPeerId: sender,
                            killerCallsign: msg.attackerCallsign || 'SQUAD',
                            botName: bot.name,
                            weaponLabel: msg.weaponLabel || 'WEAPON',
                            isHead: !!msg.isHead
                        });
                    }
                }
                return;
            }

            if (msg.type === 'mp_bot_killed_by_peer') {
                if (msg.killerPeerId !== this.myPeerId) {
                    BO.Events.emit('hud:killfeed', {
                        killer: msg.killerCallsign,
                        victim: msg.botName,
                        weapon: msg.weaponLabel,
                        isPlayerKiller: false,
                        headshot: !!msg.isHead
                    });
                }
            }
        }
    }

    BO.Net = new NetworkManager();
})(window);
