/* ============================================================================
   BLACKOUT OPS — Minigames Shared Helpers & Seeded PRNG
   Zero-build IIFE module (ADR-002).
   Provides deterministic Mulberry32 PRNG and shared utility helpers for
   minigame courses and automated QA determinism tests.
   ============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO = global.BO || {};

    function createRng(seed) {
        let s = (typeof seed === 'number' ? seed : hashSeed(String(seed ?? Date.now()))) >>> 0;
        if (s === 0) s = 0x6d2b79f5;
        return function next() {
            s |= 0;
            s = (s + 0x6d2b79f5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function hashSeed(str) {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }

    function pick(rng, arr) {
        if (!arr || arr.length === 0) return undefined;
        return arr[Math.floor((rng || Math.random)() * arr.length)];
    }

    function range(rng, min, max) {
        return min + (max - min) * (rng || Math.random)();
    }

    function shuffle(rng, arr) {
        const fn = rng || Math.random;
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(fn() * (i + 1));
            const tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
        return arr;
    }

    function formatClock(sec) {
        const s = Math.max(0, Number(sec) || 0);
        const mins = Math.floor(s / 60);
        const rem = Math.floor(s % 60);
        const tenths = Math.floor((s - Math.floor(s)) * 10);
        return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}.${tenths}`;
    }

    BO.MinigameHelpers = {
        createRng,
        hashSeed,
        pick,
        range,
        shuffle,
        formatClock
    };
})(window);
