/* ============================================================================
   BLACKOUT OPS — Core Namespace, EventBus & Math Utilities
   Works 100% offline via <script defer> on both file:// and http://localhost
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO = global.BO || {};

    class EventBus {
        constructor() {
            this._listeners = Object.create(null);
        }

        on(event, fn) {
            if (!this._listeners[event]) this._listeners[event] = [];
            this._listeners[event].push(fn);
            return () => this.off(event, fn);
        }

        off(event, fn) {
            const list = this._listeners[event];
            if (!list) return;
            const idx = list.indexOf(fn);
            if (idx !== -1) list.splice(idx, 1);
        }

        emit(event, payload) {
            const list = this._listeners[event];
            if (!list || list.length === 0) return;
            const copy = list.slice();
            for (let i = 0; i < copy.length; i++) {
                try {
                    copy[i](payload);
                } catch (err) {
                    console.error('[BO.Events] Listener error on "' + event + '":', err);
                }
            }
        }
    }

    BO.Events = new EventBus();

    const M = BO.Math = {
        clamp(v, min, max) {
            return v < min ? min : (v > max ? max : v);
        },
        lerp(a, b, t) {
            return a + (b - a) * t;
        },
        damp(a, b, lambda, dt) {
            return M.lerp(a, b, 1 - Math.exp(-lambda * dt));
        },
        randRange(min, max) {
            return min + Math.random() * (max - min);
        },
        randInt(min, max) {
            return Math.floor(min + Math.random() * (max - min + 1));
        },
        pick(arr) {
            return arr[Math.floor(Math.random() * arr.length)];
        },
        dist2D(ax, az, bx, bz) {
            const dx = bx - ax;
            const dz = bz - az;
            return Math.hypot(dx, dz);
        },
        distSq3D(ax, ay, az, bx, by, bz) {
            const dx = bx - ax;
            const dy = by - ay;
            const dz = bz - az;
            return dx * dx + dy * dy + dz * dz;
        },
        dist3D(ax, ay, az, bx, by, bz) {
            return Math.sqrt(M.distSq3D(ax, ay, az, bx, by, bz));
        },
        wrapAngle(a) {
            while (a > Math.PI) a -= Math.PI * 2;
            while (a < -Math.PI) a += Math.PI * 2;
            return a;
        },
        angleDiff(from, to) {
            return M.wrapAngle(to - from);
        },
        toRoman(num) {
            if (num <= 0) return 'I';
            if (num === 1) return 'I';
            if (num === 2) return 'II';
            if (num === 3) return 'III';
            if (num === 4) return 'IV';
            if (num === 5) return 'V';
            return String(num);
        },
        formatTime(seconds) {
            const s = Math.max(0, Math.floor(seconds));
            const mins = Math.floor(s / 60);
            const secs = s % 60;
            return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
        },
        formatNumber(n) {
            return Math.floor(n || 0).toLocaleString('en-US');
        },
        deepClone(obj) {
            return JSON.parse(JSON.stringify(obj));
        }
    };

    BO.State = {
        screen: 'main_menu', // 'main_menu' | 'play_lobby' | 'gunsmith' | 'barracks' | 'playing' | 'paused' | 'aar'
        activeMode: null,    // 'zombies' | 'mp'
        activeMapId: 'der_bunker',
        paused: false
    };
})(window);
