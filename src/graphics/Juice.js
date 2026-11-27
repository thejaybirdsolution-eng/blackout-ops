/* ============================================================================
   BLACKOUT OPS — Impact feel: hit-stop, lens punch and kill-confirm bursts.

   Listens to the combat system's existing 'hud:hitmarker' event, so every
   weapon, mode and damage path gets the same feedback:
     - every hit:  small lens punch (chromatic spike + exposure flash) via PostFX
     - kill:       ~55 ms hit-stop (time dips to 6% then eases back), bigger punch,
                   and a radial spark burst around the crosshair
     - headshot kill: longer hit-stop, gold sparks, and a ring flash
   Hit-stop is skipped online (it would desync peers), when another slow-motion
   beat is already running, and with Reduced Motion enabled.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    class Juice {
        constructor() {
            this.stopUntil = 0;
            this.restoring = false;
            this.layer = null;
        }

        init() {
            if (!BO.Events) return;
            BO.Events.on('hud:hitmarker', (e) => this.onHit(e || {}));
        }

        _reduced() { return !!BO.Settings.get('reducedMotion'); }

        onHit(e) {
            if (BO.PostFX) BO.PostFX.impact(e.isKill ? (e.isHeadshot ? 0.85 : 0.6) : 0.16);
            if (!e.isKill) return;
            this.burst(!!e.isHeadshot);
            this.shake(e.isHeadshot ? 0.095 : 0.045);
            this.hitStop(e.isHeadshot ? 0.085 : 0.055);
        }

        shake(amount = 0.08) {
            if (this._reduced() || !BO.Player) return;
            const scale = BO.Settings ? (BO.Settings.get('screenShake') ?? 1.0) : 1.0;
            if (scale <= 0.01) return;
            BO.Player.cameraShake = Math.min(0.45, (BO.Player.cameraShake || 0) + amount);
        }

        screenFlash(color = '#ef4444', alpha = 0.22, ms = 320) {
            if (this._reduced()) return;
            const hud = document.getElementById('hud-layer') || document.body;
            if (!hud) return;
            const el = document.createElement('div');
            el.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:9990;background:${color};opacity:${alpha};transition:opacity ${ms}ms ease-out;`;
            hud.appendChild(el);
            requestAnimationFrame(() => { el.style.opacity = '0'; });
            setTimeout(() => el.remove(), ms + 40);
        }

        hitStop(seconds) {
            if (this._reduced() || BO.Settings.get('hitStop') === false) return;
            if (BO.Net && BO.Net.active) return;
            const S = BO.State;
            if (!S || this.restoring || (S.timeScale !== undefined && S.timeScale !== 1)) return;
            S.timeScale = 0.06;
            this.restoring = true;
            const hold = seconds * 1000;
            const ease = 90;
            const start = performance.now();
            const step = (now) => {
                const t = now - start;
                if (t < hold) { requestAnimationFrame(step); return; }
                const k = Math.min(1, (t - hold) / ease);
                // Ease-out back to real time so it reads as a beat, not a stutter.
                S.timeScale = 0.06 + (1 - 0.06) * (1 - Math.pow(1 - k, 3));
                if (k < 1) requestAnimationFrame(step);
                else { S.timeScale = 1; this.restoring = false; }
            };
            requestAnimationFrame(step);
        }

        _layer() {
            if (this.layer && this.layer.isConnected) return this.layer;
            const hud = document.getElementById('hud-layer');
            if (!hud) return null;
            const el = document.createElement('div');
            el.className = 'aaa-burst-layer';
            hud.appendChild(el);
            this.layer = el;
            return el;
        }

        burst(headshot) {
            const layer = this._layer();
            if (!layer || this._reduced()) return;
            const n = headshot ? 14 : 10;
            const frag = document.createDocumentFragment();
            const base = Math.random() * Math.PI * 2;
            for (let i = 0; i < n; i++) {
                const s = document.createElement('i');
                const a = base + (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
                const dist = 34 + Math.random() * 30;
                s.style.setProperty('--dx', (Math.cos(a) * dist).toFixed(1) + 'px');
                s.style.setProperty('--dy', (Math.sin(a) * dist).toFixed(1) + 'px');
                s.style.setProperty('--rot', (a * 180 / Math.PI + 90).toFixed(1) + 'deg');
                s.style.setProperty('--len', (8 + Math.random() * 10).toFixed(1) + 'px');
                s.className = headshot ? 'aaa-spark aaa-spark-gold' : 'aaa-spark';
                frag.appendChild(s);
            }
            const ring = document.createElement('b');
            ring.className = headshot ? 'aaa-ring aaa-ring-gold' : 'aaa-ring';
            frag.appendChild(ring);
            layer.appendChild(frag);
            setTimeout(() => {
                while (layer.firstChild) layer.removeChild(layer.firstChild);
            }, 520);
        }
    }

    BO.Juice = new Juice();
})(window);
