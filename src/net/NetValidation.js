/* ============================================================================
   BLACKOUT OPS — Network Validation, Jitter Buffer, Delta Codec & Mock Transport
   Zero-build IIFE module (ADR-002).
   Loaded before NetworkManager.js so packet validation, rate limiting,
   interpolation jitter buffering, state deltas, lag compensation history,
   and deterministic 2-peer offline testing all work uniformly.
   ============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO = global.BO || {};

    const KNOWN_TYPES = new Set([
        'join_req', 'leave_notify', 'profile_update', 'roster_sync', 'lobby_settings',
        'chat_msg', 'match_start', 'player_state', 'player_fx', 'net_ping', 'net_pong',
        'host_migrate',
        // Zombies
        'z_snapshot', 'z_snapshot_delta', 'z_hit', 'z_interact_door', 'z_power_on',
        'z_pickup_powerup', 'z_revive_player', 'z_barricade_repair',
        // Tower Defense
        'td_snapshot', 'td_buy', 'td_skip', 'td_hit_enemy',
        // Multiplayer
        'mp_snapshot', 'mp_hit_player', 'mp_player_killed', 'mp_hit_bot', 'mp_bot_killed_by_peer',
        // Rogue Lite Co-op & Minigames Versus (1.0)
        'rpg_snapshot', 'rpg_door_vote', 'rpg_hit_enemy', 'mg_score_update', 'mg_finish'
    ]);

    function isFiniteNum(v, min = -1e5, max = 1e5) {
        return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
    }

    function validateStatePayload(st) {
        if (!st || typeof st !== 'object') return false;
        const nums = ['x', 'y', 'z', 'vx', 'vz', 'yaw', 'pitch'];
        for (let i = 0; i < nums.length; i++) {
            const v = st[nums[i]];
            if (v !== undefined && !isFiniteNum(v, -50000, 50000)) return false;
        }
        if (st.hp !== undefined && !isFiniteNum(st.hp, -100, 100000)) return false;
        if (st.maxHp !== undefined && !isFiniteNum(st.maxHp, 1, 100000)) return false;
        if (st.callsign !== undefined && (typeof st.callsign !== 'string' || st.callsign.length > 48)) return false;
        return true;
    }

    /**
     * Validate any inbound P2P / BroadcastChannel message.
     * Returns { ok: boolean, reason?: string }.
     */
    function validateMessage(msg, opts) {
        if (!msg || typeof msg !== 'object' || Array.isArray(msg)) {
            return { ok: false, reason: 'non_object' };
        }
        if (typeof msg.type !== 'string' || !KNOWN_TYPES.has(msg.type)) {
            return { ok: false, reason: 'unknown_type' };
        }
        if (msg._seq !== undefined && !isFiniteNum(msg._seq, 0, 1e12)) {
            return { ok: false, reason: 'invalid_seq' };
        }
        if (msg.type === 'player_state' && !validateStatePayload(msg.state)) {
            return { ok: false, reason: 'invalid_player_state' };
        }
        if (msg.type === 'chat_msg') {
            if (typeof msg.text !== 'string' || msg.text.length > 400) {
                return { ok: false, reason: 'invalid_chat' };
            }
        }
        if ((msg.type === 'mp_hit_player' || msg.type === 'mp_hit_bot' || msg.type === 'z_hit' || msg.type === 'td_hit_enemy' || msg.type === 'rpg_hit_enemy')
            && msg.dmg !== undefined && !isFiniteNum(msg.dmg, 0, 25000)) {
            return { ok: false, reason: 'invalid_damage' };
        }
        if (msg.snap && typeof msg.snap === 'object') {
            if (msg.snap.zombies && (!Array.isArray(msg.snap.zombies) || msg.snap.zombies.length > 512)) {
                return { ok: false, reason: 'oversized_snapshot' };
            }
        }
        if (opts && opts.limiter && opts.senderId) {
            if (!opts.limiter.allow(opts.senderId, opts.now ?? Date.now())) {
                return { ok: false, reason: 'rate_limited' };
            }
        }
        return { ok: true };
    }

    /** Per-peer sliding window rate limiter to ignore packet floods cleanly. */
    class PeerRateLimiter {
        constructor(maxPerSec = 90) {
            this.maxPerSec = maxPerSec;
            this.buckets = new Map();
        }
        allow(peerId, nowMs) {
            const t = nowMs || Date.now();
            let b = this.buckets.get(peerId);
            if (!b || (t - b.winStart) >= 1000) {
                b = { winStart: t, count: 0 };
                this.buckets.set(peerId, b);
            }
            b.count++;
            return b.count <= this.maxPerSec;
        }
        clear() { this.buckets.clear(); }
    }

    /**
     * Timestamped snapshot ring buffer (~80 ms interp delay, <= 150 ms extrap cap).
     * Reuses caller-supplied `out` object to avoid per-frame allocations.
     */
    class JitterBuffer {
        constructor(interpDelayMs = 80, maxExtrapMs = 150) {
            this.interpDelayMs = interpDelayMs;
            this.maxExtrapMs = maxExtrapMs;
            this.samples = [];
        }
        push(state, recvMs) {
            const t = Number.isFinite(recvMs) ? recvMs : performance.now();
            const entry = {
                t,
                x: Number(state.x) || 0,
                y: Number(state.y) || 0,
                z: Number(state.z) || 0,
                vx: Number(state.vx) || 0,
                vz: Number(state.vz) || 0,
                yaw: Number(state.yaw) || 0
            };
            const n = this.samples.length;
            if (n > 0 && entry.t <= this.samples[n - 1].t) {
                this.samples[n - 1] = entry;
            } else {
                this.samples.push(entry);
            }
            while (this.samples.length > 24) this.samples.shift();
        }
        sample(nowMs, out) {
            const dst = out || {};
            const list = this.samples;
            if (list.length === 0) return null;
            const renderT = (Number.isFinite(nowMs) ? nowMs : performance.now()) - this.interpDelayMs;
            if (list.length === 1 || renderT <= list[0].t) {
                const s = list[0];
                dst.x = s.x; dst.y = s.y; dst.z = s.z; dst.yaw = s.yaw;
                return dst;
            }
            const last = list[list.length - 1];
            if (renderT >= last.t) {
                const extrapSec = Math.min(this.maxExtrapMs, renderT - last.t) / 1000;
                dst.x = last.x + last.vx * extrapSec;
                dst.y = last.y;
                dst.z = last.z + last.vz * extrapSec;
                dst.yaw = last.yaw;
                return dst;
            }
            for (let i = list.length - 2; i >= 0; i--) {
                const a = list[i];
                const b = list[i + 1];
                if (renderT >= a.t && renderT <= b.t) {
                    const span = Math.max(1, b.t - a.t);
                    const alpha = Math.max(0, Math.min(1, (renderT - a.t) / span));
                    dst.x = a.x + (b.x - a.x) * alpha;
                    dst.y = a.y + (b.y - a.y) * alpha;
                    dst.z = a.z + (b.z - a.z) * alpha;
                    const dyaw = Math.atan2(Math.sin(b.yaw - a.yaw), Math.cos(b.yaw - a.yaw));
                    dst.yaw = a.yaw + dyaw * alpha;
                    return dst;
                }
            }
            dst.x = last.x; dst.y = last.y; dst.z = last.z; dst.yaw = last.yaw;
            return dst;
        }
        clear() { this.samples.length = 0; }
    }

    /** Flat key-value delta encoder/decoder with periodic keyframe reset. */
    const DeltaCodec = {
        diff(prev, curr) {
            if (!prev || typeof prev !== 'object') return { keyframe: true, data: Object.assign({}, curr) };
            const changed = {};
            let count = 0;
            const keys = Object.keys(curr);
            for (let i = 0; i < keys.length; i++) {
                const k = keys[i];
                const a = prev[k];
                const b = curr[k];
                if (typeof b === 'number' && typeof a === 'number') {
                    if (Math.abs(a - b) > 1e-4) { changed[k] = b; count++; }
                } else if (a !== b) {
                    changed[k] = b; count++;
                }
            }
            return { keyframe: false, data: changed, changedCount: count };
        },
        apply(base, packet) {
            if (!packet || !packet.data) return base ? Object.assign({}, base) : {};
            if (packet.keyframe || !base) return Object.assign({}, packet.data);
            return Object.assign({}, base, packet.data);
        }
    };

    /** Bounded ring buffer of world entity coordinates for host-side hit rewind queries. */
    class LagHistory {
        constructor(maxWindowMs = 1000) {
            this.maxWindowMs = maxWindowMs;
            this.frames = [];
        }
        record(tMs, entities) {
            const snap = Object.create(null);
            for (let i = 0; i < entities.length; i++) {
                const e = entities[i];
                if (!e || !e.pos) continue;
                snap[e.id] = { x: e.pos.x, y: e.pos.y, z: e.pos.z };
            }
            this.frames.push({ t: tMs, snap });
            const cutoff = tMs - this.maxWindowMs;
            while (this.frames.length > 2 && this.frames[0].t < cutoff) this.frames.shift();
        }
        sampleAt(tMs, entityId) {
            const list = this.frames;
            if (list.length === 0) return null;
            let best = list[list.length - 1];
            let bestDiff = Math.abs(best.t - tMs);
            for (let i = list.length - 2; i >= 0; i--) {
                const d = Math.abs(list[i].t - tMs);
                if (d < bestDiff) { bestDiff = d; best = list[i]; }
            }
            return best.snap[entityId] || null;
        }
        clear() { this.frames.length = 0; }
    }

    /** Deterministic 2-peer simulated network transport (latency + jitter + packet loss) for QA tests. */
    class MockNetChannel {
        constructor(opts) {
            const o = opts || {};
            this.latencyMs = o.latencyMs ?? 150;
            this.jitterMs = o.jitterMs ?? 20;
            this.lossRate = o.lossRate ?? 0.02;
            this.seed = (o.seed ?? 918273) >>> 0;
            this.queue = [];
            this.peers = new Map();
            this.nowMs = 0;
            this.stats = { sent: 0, dropped: 0, delivered: 0, rejected: 0 };
        }
        _rand() {
            this.seed = (this.seed + 0x6d2b79f5) | 0;
            let t = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        }
        registerPeer(id, onMessage) {
            this.peers.set(id, onMessage);
        }
        send(fromId, toId, msg) {
            this.stats.sent++;
            if (this._rand() < this.lossRate) {
                this.stats.dropped++;
                return false;
            }
            const j = (this._rand() * 2 - 1) * this.jitterMs;
            const deliverAt = this.nowMs + Math.max(0, this.latencyMs + j);
            const clone = JSON.parse(JSON.stringify(msg));
            this.queue.push({ deliverAt, fromId, toId, msg: clone });
            return true;
        }
        step(dtMs) {
            this.nowMs += dtMs;
            this.queue.sort((a, b) => a.deliverAt - b.deliverAt);
            while (this.queue.length > 0 && this.queue[0].deliverAt <= this.nowMs) {
                const pkt = this.queue.shift();
                const res = validateMessage(pkt.msg);
                if (!res.ok) {
                    this.stats.rejected++;
                    continue;
                }
                const cb = this.peers.get(pkt.toId);
                if (cb) {
                    this.stats.delivered++;
                    cb(pkt.msg, pkt.fromId, this.nowMs);
                }
            }
        }
    }

    BO.NetValidation = {
        KNOWN_TYPES,
        validateMessage,
        PeerRateLimiter,
        JitterBuffer,
        DeltaCodec,
        LagHistory,
        MockNetChannel
    };
})(window);
