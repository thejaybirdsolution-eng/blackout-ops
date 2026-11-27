/* ============================================================================
   BLACKOUT OPS — Lightweight Performance, Frame-Time p95 & Draw-Call Overlay
   Zero-build IIFE module (ADR-002).
   Toggled by Settings -> Video -> Perf Overlay or BO.Settings.get('showPerfOverlay').
   Updates DOM at 4 Hz to avoid layout/paint overhead during combat.
   ============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO = global.BO || {};
    const RING_SIZE = 120;
    const msRing = new Float32Array(RING_SIZE);
    const sortedBuf = new Float32Array(RING_SIZE);

    let ringIdx = 0;
    let ringCount = 0;
    let accumUi = 0;
    let el = null;

    function ensureEl() {
        if (el && el.isConnected) return el;
        el = document.getElementById('bo-perf-overlay');
        if (!el) {
            el = document.createElement('div');
            el.id = 'bo-perf-overlay';
            el.style.cssText = [
                'position:fixed',
                'top:10px',
                'right:10px',
                'z-index:85',
                'pointer-events:none',
                'padding:6px 10px',
                'border:1px solid rgba(255,178,63,0.35)',
                'background:rgba(7,9,12,0.82)',
                'color:#eef1f4',
                'font:600 11px/1.4 ui-monospace,Consolas,monospace',
                'letter-spacing:0.04em',
                'border-radius:2px',
                'white-space:pre',
                'text-shadow:0 1px 2px #000'
            ].join(';');
            document.body.appendChild(el);
        }
        return el;
    }

    function computeStats() {
        if (!ringCount) return { avgMs: 16.6, p95Ms: 16.6, fps: 60 };
        let sum = 0;
        for (let i = 0; i < ringCount; i++) {
            const v = msRing[i];
            sum += v;
            sortedBuf[i] = v;
        }
        const slice = sortedBuf.subarray(0, ringCount);
        slice.sort();
        const avgMs = sum / ringCount;
        const p95Idx = Math.min(ringCount - 1, Math.floor(ringCount * 0.95));
        const p95Ms = slice[p95Idx];
        const fps = avgMs > 0.1 ? Math.round(1000 / avgMs) : 0;
        return { avgMs, p95Ms, fps };
    }

    const PerfOverlay = {
        lastStats: { fps: 60, avgMs: 16.6, p95Ms: 16.6, calls: 0, tris: 0, geos: 0, tex: 0, heapMb: null },

        recordFrame(rawDtSec) {
            const ms = Math.max(0.2, Math.min(250, rawDtSec * 1000));
            msRing[ringIdx] = ms;
            ringIdx = (ringIdx + 1) % RING_SIZE;
            if (ringCount < RING_SIZE) ringCount++;
        },

        tick(rawDtSec, renderer) {
            this.recordFrame(rawDtSec);
            const show = !!(BO.Settings && BO.Settings.get && BO.Settings.get('showPerfOverlay'));
            accumUi += rawDtSec;
            if (accumUi < 0.25) {
                if (!show && el && !el.classList.contains('hidden')) el.classList.add('hidden');
                return;
            }
            accumUi = 0;

            const stats = computeStats();
            const info = renderer && renderer.info;
            const calls = info?.render?.calls ?? 0;
            const tris = info?.render?.triangles ?? 0;
            const geos = info?.memory?.geometries ?? 0;
            const tex = info?.memory?.textures ?? 0;
            const heapMb = (global.performance && global.performance.memory)
                ? Math.round(global.performance.memory.usedJSHeapSize / (1024 * 1024))
                : null;

            this.lastStats = {
                fps: stats.fps,
                avgMs: stats.avgMs,
                p95Ms: stats.p95Ms,
                calls,
                tris,
                geos,
                tex,
                heapMb
            };

            if (!show) {
                if (el && !el.classList.contains('hidden')) el.classList.add('hidden');
                return;
            }
            const node = ensureEl();
            node.classList.remove('hidden');
            const heapStr = heapMb !== null ? `  HEAP ${heapMb}MB` : '';
            node.textContent =
                `FPS ${stats.fps}  AVG ${stats.avgMs.toFixed(1)}ms  P95 ${stats.p95Ms.toFixed(1)}ms\n` +
                `DRAW ${calls}  TRIS ${(tris / 1000).toFixed(1)}k  GEO ${geos}  TEX ${tex}${heapStr}`;
        },

        snapshot(renderer) {
            const stats = computeStats();
            const info = renderer && renderer.info;
            return {
                fps: stats.fps,
                avgMs: Number(stats.avgMs.toFixed(2)),
                p95Ms: Number(stats.p95Ms.toFixed(2)),
                calls: info?.render?.calls ?? 0,
                triangles: info?.render?.triangles ?? 0,
                geometries: info?.memory?.geometries ?? 0,
                textures: info?.memory?.textures ?? 0,
                heapMb: (global.performance && global.performance.memory)
                    ? Math.round(global.performance.memory.usedJSHeapSize / (1024 * 1024))
                    : null
            };
        }
    };

    BO.PerfOverlay = PerfOverlay;
})(window);
