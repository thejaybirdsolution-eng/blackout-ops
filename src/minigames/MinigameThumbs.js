/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Studio Key-Art & 640x360 Cinematic Poster Engine
   Serves generated AAA WebP key-art covers when present on disk, and renders
   sleek 640x360 multi-layer atmospheric graphic posters with parallax depth,
   volumetric lighting, beveled metallic emblems & typography for every mode.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const cache = new Map();

    const STATIC_ART = new Set([
        'whack_a_mole',
        'fun_angry_birds',
        'fun_master_zombie',
        'fun_snowboarding',
        'fun_360_trickshot',
        'fun_mario_fps',
        'fun_final_fantasy',
        'fun_pinball_arena',
        'contracts'
    ]);

    const THEMES = {
        // Fun & Specials (non-static)
        fun_inspection:      { sky: ['#090d14', '#1e293b', '#334155'], bloom: '#f59e0b', scene: 'skyline', label: 'CHECKPOINT SIM', bx: 0.72, by: 0.25 },
        fun_prophunt:        { sky: ['#1f1006', '#451a03', '#78350f'], bloom: '#fbbf24', scene: 'forest',  label: 'TOYSHOP STEALTH', bx: 0.68, by: 0.28 },
        fun_kaiju:           { sky: ['#1a0408', '#450a0a', '#7f1d1d'], bloom: '#38bdf8', scene: 'skyline', label: 'TITAN CLASH', bx: 0.56, by: 0.34 },
        fun_bumper_derby:    { sky: ['#1e0735', '#4c1d95', '#831843'], bloom: '#f472b6', scene: 'arena',   label: 'DERBY ARENA', bx: 0.55, by: 0.24 },
        fun_combat_kitchen:  { sky: ['#1c0a04', '#7c2d12', '#b45309'], bloom: '#fb923c', scene: 'arena',   label: 'CULINARY CHAOS', bx: 0.65, by: 0.32 },
        fun_sky_pirate:      { sky: ['#0c4a6e', '#0284c7', '#fbbf24'], bloom: '#fde047', scene: 'peaks',   label: 'SKY ARMADA', bx: 0.74, by: 0.26 },
        fun_toy_war:         { sky: ['#14281d', '#166534', '#4d7c0f'], bloom: '#facc15', scene: 'forest',  label: 'MINIATURE SQUAD', bx: 0.70, by: 0.24 },
        fun_chess_fps:       { sky: ['#09090b', '#1e1b4b', '#312e81'], bloom: '#eab308', scene: 'cyber',   label: 'GRANDMASTER FPS', bx: 0.62, by: 0.28 },
        fun_ghost_hunters:   { sky: ['#020617', '#1e1b4b', '#14532d'], bloom: '#4ade80', scene: 'forest',  label: 'ECTO HAUNT', bx: 0.70, by: 0.22 },
        fun_colosseum:       { sky: ['#1e293b', '#9a3412', '#d97706'], bloom: '#fde68a', scene: 'arena',   label: 'ROMAN ARENA', bx: 0.66, by: 0.28 },
        fun_orbital_breach:  { sky: ['#020617', '#082f49', '#0e7490'], bloom: '#22d3ee', scene: 'space',   label: 'ZERO-G BREACH', bx: 0.64, by: 0.26 },
        fun_abyssal_mech:    { sky: ['#010814', '#082f49', '#0369a1'], bloom: '#22d3ee', scene: 'ocean',   label: 'DEEP TRENCH EXO', bx: 0.58, by: 0.30 },
        fun_dino_safari:     { sky: ['#052e16', '#14532d', '#3f6212'], bloom: '#facc15', scene: 'forest',  label: 'APEX PADDOCK', bx: 0.72, by: 0.24 },
        fun_castle_siege:    { sky: ['#0f172a', '#334155', '#7c2d12'], bloom: '#f97316', scene: 'peaks',   label: 'FORTRESS SIEGE', bx: 0.68, by: 0.28 },
        fun_hoverbike_highway: { sky: ['#020617', '#3b0764', '#0891b2'], bloom: '#22d3ee', scene: 'cyber', label: 'NEON HIGHWAY', bx: 0.54, by: 0.36 },

        // Target & Action
        range_day:        { sky: ['#0f172a', '#1e3a8a', '#ea580c'], bloom: '#facc15', scene: 'canyon',  label: 'LIVE FIRE RANGE', bx: 0.72, by: 0.28 },
        coaster:          { sky: ['#0f172a', '#312e81', '#be185d'], bloom: '#f472b6', scene: 'peaks',   label: 'THEME PARK RAIL', bx: 0.65, by: 0.24 },
        temple_run:       { sky: ['#1c1208', '#451a03', '#92400e'], bloom: '#fb923c', scene: 'canyon',  label: 'TEMPLE ESCAPE', bx: 0.68, by: 0.30 },
        skeet:            { sky: ['#0c4a6e', '#2563eb', '#f59e0b'], bloom: '#fde68a', scene: 'peaks',   label: 'CLAY TRAP SHOOT', bx: 0.72, by: 0.26 },
        bandit_town:      { sky: ['#451a03', '#9a3412', '#f59e0b'], bloom: '#fde047', scene: 'canyon',  label: 'HIGH NOON GALLERY', bx: 0.68, by: 0.34 },
        drone_swarm:      { sky: ['#020617', '#1e1b4b', '#083344'], bloom: '#22d3ee', scene: 'skyline', label: 'ROOFTOP DEFENSE', bx: 0.62, by: 0.24 },
        sniper_ridge:     { sky: ['#0c4a6e', '#0369a1', '#65a30d'], bloom: '#e0f2fe', scene: 'peaks',   label: 'LONG RANGE STEEL', bx: 0.74, by: 0.24 },
        heli_gunner:      { sky: ['#0f172a', '#1e3a8a', '#fb923c'], bloom: '#fdba74', scene: 'skyline', label: 'AIRBORNE OVERWATCH', bx: 0.68, by: 0.28 },
        balloon_fest:     { sky: ['#1e1b4b', '#9d174d', '#fb923c'], bloom: '#f472b6', scene: 'peaks',   label: 'DUSK FAIRGROUND', bx: 0.65, by: 0.26 },
        killhouse_blitz:  { sky: ['#09090b', '#292524', '#7f1d1d'], bloom: '#ef4444', scene: 'arena',   label: 'CQB BREACH', bx: 0.62, by: 0.28 },
        beat_drop:        { sky: ['#090216', '#3b0764', '#0891b2'], bloom: '#ec4899', scene: 'cyber',   label: 'RHYTHM STAGE', bx: 0.54, by: 0.32 },
        one_mag:          { sky: ['#0f172a', '#334155', '#d97706'], bloom: '#e2e8f0', scene: 'canyon',  label: 'PRECISION TRIAL', bx: 0.72, by: 0.28 },
        outlaw_pursuit:   { sky: ['#1e1b4b', '#9a3412', '#fbbf24'], bloom: '#fdba74', scene: 'canyon',  label: 'FRONTIER CHASE', bx: 0.66, by: 0.30 },
        mansion_raid:     { sky: ['#020617', '#0f172a', '#1e3a8a'], bloom: '#38bdf8', scene: 'skyline', label: 'TACTICAL ASSAULT', bx: 0.64, by: 0.26 },
        sweetheart_shore: { sky: ['#0369a1', '#0ea5e9', '#fde68a'], bloom: '#f472b6', scene: 'ocean',   label: 'TROPICAL PARADISE', bx: 0.74, by: 0.26 },

        // Speed Runs
        sr_gauntlet:      { sky: ['#020617', '#0f172a', '#0891b2'], bloom: '#22d3ee', scene: 'cyber',   label: 'NEON GAUNTLET', bx: 0.56, by: 0.30 },
        sr_outposts:      { sky: ['#0c4a6e', '#166534', '#4d7c0f'], bloom: '#a3e635', scene: 'forest',  label: 'VALLEY DEFENSE', bx: 0.68, by: 0.26 },
        sr_chase:         { sky: ['#0f172a', '#1e40af', '#f59e0b'], bloom: '#38bdf8', scene: 'skyline', label: 'INTERSTATE PURSUIT', bx: 0.62, by: 0.30 },
        sr_splitter:      { sky: ['#042f2e', '#115e59', '#0f172a'], bloom: '#2dd4bf', scene: 'space',   label: 'BIO CONTAINMENT', bx: 0.64, by: 0.28 },
        sr_skysnipers:    { sky: ['#020617', '#1e293b', '#0284c7'], bloom: '#38bdf8', scene: 'skyline', label: 'HELIPAD SNIPER', bx: 0.68, by: 0.24 },
        sr_last50:        { sky: ['#090d16', '#1f2937', '#7f1d1d'], bloom: '#ef4444', scene: 'forest',  label: 'HEADSHOT TRIAL', bx: 0.72, by: 0.22 },
        sr_freefall:      { sky: ['#1e1b4b', '#7c2d12', '#facc15'], bloom: '#fb923c', scene: 'peaks',   label: 'WINGSUIT SKYDIVE', bx: 0.66, by: 0.32 },
        sr_ninja:         { sky: ['#020617', '#1e1b4b', '#14261c'], bloom: '#818cf8', scene: 'forest',  label: 'SHINOBI CITADEL', bx: 0.72, by: 0.22 },
        sr_hydra_dragon:  { sky: ['#180505', '#7f1d1d', '#ea580c'], bloom: '#f97316', scene: 'peaks',   label: 'OBSIDIAN CALDERA', bx: 0.60, by: 0.34 },

        // Arcade Hall & Boss Rush
        quickdraw:        { sky: ['#451a03', '#9a3412', '#fbbf24'], bloom: '#fde047', scene: 'canyon',  label: 'REFLEX SHOWDOWN', bx: 0.64, by: 0.36 },
        cab_wild_hunt:    { sky: ['#0b0620', '#14532d', '#65a30d'], bloom: '#a3e635', scene: 'forest',  label: 'RETRO LIGHT-GUN', bx: 0.68, by: 0.28 },
        cab_night_terrors: { sky: ['#090418', '#3b0764', '#6b21a8'], bloom: '#c084fc', scene: 'space',  label: 'ARCADE HORROR', bx: 0.66, by: 0.26 },
        ball_brawl:       { sky: ['#0369a1', '#0ea5e9', '#fde68a'], bloom: '#facc15', scene: 'arena',   label: 'SKY ARENA BRAWL', bx: 0.68, by: 0.25 },
        aim_lab:          { sky: ['#020617', '#0f172a', '#1e293b'], bloom: '#22d3ee', scene: 'cyber',   label: 'AIM DIAGNOSTICS', bx: 0.60, by: 0.30 },
        bottle_juggler:   { sky: ['#0c4a6e', '#047857', '#14532d'], bloom: '#34d399', scene: 'arena',   label: 'SALOON BAR STAGE', bx: 0.68, by: 0.26 },
        color_lock:       { sky: ['#0b1020', '#312e81', '#be123c'], bloom: '#f43f5e', scene: 'cyber',   label: 'PRISM REACTOR', bx: 0.60, by: 0.30 },
        number_crunch:    { sky: ['#1e1b4b', '#3f6212', '#ca8a04'], bloom: '#facc15', scene: 'peaks',   label: 'SPEED SEQUENCE', bx: 0.68, by: 0.26 },
        echo_panels:      { sky: ['#090d26', '#2e1065', '#4c1d95'], bloom: '#a78bfa', scene: 'cyber',   label: 'MEMORY MATRIX', bx: 0.58, by: 0.30 },
        switchyard:       { sky: ['#451a03', '#78350f', '#d97706'], bloom: '#fbbf24', scene: 'canyon',  label: 'FRONTIER RAILS', bx: 0.70, by: 0.28 },
        starfall_shield:  { sky: ['#020617', '#431407', '#9a3412'], bloom: '#f97316', scene: 'skyline', label: 'ORBITAL DEFENSE', bx: 0.62, by: 0.24 },
        fishing_hole:     { sky: ['#0369a1', '#0284c7', '#166534'], bloom: '#38bdf8', scene: 'ocean',   label: 'ALPINE LAGOON', bx: 0.72, by: 0.26 },
        paint_wars:       { sky: ['#0f172a', '#0284c7', '#db2777'], bloom: '#38bdf8', scene: 'arena',   label: 'SPLASH BATTLE', bx: 0.64, by: 0.28 },
        safe_cracker:     { sky: ['#09090b', '#18181b', '#3f3f46'], bloom: '#e4e4e7', scene: 'cyber',   label: 'VAULT HEIST', bx: 0.66, by: 0.28 },
        boss_rush:        { sky: ['#180404', '#7f1d1d', '#ea580c'], bloom: '#f97316', scene: 'arena',   label: 'COLOSSEUM GAUNTLET', bx: 0.62, by: 0.30 }
    };

    function hexRgb(hex) {
        const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '#f59e0b').trim());
        if (!m) return [245, 158, 11];
        const n = parseInt(m[1], 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    function rgba(hex, a) {
        const [r, g, b] = hexRgb(hex);
        return `rgba(${r},${g},${b},${a})`;
    }

    function rng32(seedStr) {
        let h = 2166136261 >>> 0;
        const s = String(seedStr || 'mg');
        for (let i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return () => {
            h += 0x6D2B79F5;
            let t = Math.imul(h ^ (h >>> 15), 1 | h);
            t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function drawHorizonScene(g, W, H, scene, bloom, rnd) {
        if (scene === 'space') {
            for (let i = 0; i < 80; i++) {
                g.fillStyle = `rgba(255,255,255,${0.25 + rnd() * 0.7})`;
                g.beginPath(); g.arc(rnd() * W, rnd() * H * 0.85, 0.7 + rnd() * 1.8, 0, Math.PI * 2); g.fill();
            }
            const neb = g.createRadialGradient(W * 0.68, H * 0.38, 10, W * 0.68, H * 0.38, 220);
            neb.addColorStop(0, rgba(bloom, 0.35)); neb.addColorStop(1, 'rgba(0,0,0,0)');
            g.fillStyle = neb; g.fillRect(0, 0, W, H);
        } else if (scene === 'cyber') {
            // Crisp glowing synthwave perspective horizon grid
            const hy = H * 0.60;
            g.save();
            g.strokeStyle = rgba(bloom, 0.34);
            g.lineWidth = 1.4;
            for (let i = 0; i <= 7; i++) {
                const k = i / 7;
                const y = hy + k * k * (H - hy);
                g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
            }
            for (let i = -8; i <= 8; i++) {
                g.beginPath(); g.moveTo(W * 0.62 + i * 16, hy); g.lineTo(W * 0.62 + i * 92, H); g.stroke();
            }
            g.restore();
        } else if (scene === 'skyline') {
            for (let layer = 0; layer < 2; layer++) {
                const alpha = layer === 0 ? 0.42 : 0.86;
                const baseY = layer === 0 ? H * 0.64 : H * 0.76;
                g.fillStyle = `rgba(5,9,18,${alpha})`;
                let x = -10;
                while (x < W + 20) {
                    const bw = 28 + rnd() * 38;
                    const bh = 60 + rnd() * (layer === 0 ? 130 : 105);
                    g.fillRect(x, baseY - bh, bw, H - (baseY - bh));
                    if (layer === 1) {
                        g.fillStyle = rgba(bloom, 0.35);
                        for (let wy = baseY - bh + 12; wy < baseY - 12; wy += 12) {
                            for (let wx = x + 6; wx < x + bw - 8; wx += 10) {
                                if (rnd() > 0.45) g.fillRect(wx, wy, 4, 5);
                            }
                        }
                        g.fillStyle = `rgba(5,9,18,${alpha})`;
                    }
                    x += bw + (layer === 0 ? 6 : 10);
                }
            }
        } else if (scene === 'canyon') {
            for (let layer = 0; layer < 3; layer++) {
                g.fillStyle = ['rgba(45,18,6,0.38)', 'rgba(30,12,4,0.62)', 'rgba(14,7,3,0.88)'][layer];
                const baseY = H * (0.58 + layer * 0.11);
                g.beginPath();
                g.moveTo(0, H);
                let px = 0;
                while (px <= W) {
                    const py = baseY - (rnd() > 0.45 ? 18 + rnd() * 44 : 4 + rnd() * 14);
                    g.lineTo(px, py);
                    px += 26 + rnd() * 42;
                }
                g.lineTo(W, baseY); g.lineTo(W, H); g.closePath(); g.fill();
            }
        } else if (scene === 'ocean') {
            const hy = H * 0.56;
            const sea = g.createLinearGradient(0, hy, 0, H);
            sea.addColorStop(0, rgba(bloom, 0.38)); sea.addColorStop(1, 'rgba(2,14,28,0.92)');
            g.fillStyle = sea; g.fillRect(0, hy, W, H - hy);
            g.fillStyle = rgba('#ffffff', 0.22);
            for (let i = 0; i < 22; i++) {
                const ry = hy + 8 + rnd() * (H - hy - 14);
                const rw = 24 + rnd() * 90;
                g.fillRect(W * 0.58 + (rnd() - 0.5) * 260, ry, rw, 2);
            }
        } else if (scene === 'arena') {
            // Stadium rib arches & sweeping spotlight beams
            for (let s = 0; s < 3; s++) {
                const grad = g.createLinearGradient(W * (0.3 + s * 0.22), 0, W * (0.45 + s * 0.16), H);
                grad.addColorStop(0, rgba(bloom, 0.24)); grad.addColorStop(1, 'rgba(0,0,0,0)');
                g.fillStyle = grad;
                g.beginPath();
                g.moveTo(W * (0.28 + s * 0.24), 0);
                g.lineTo(W * (0.34 + s * 0.24), 0);
                g.lineTo(W * (0.55 + s * 0.15), H);
                g.lineTo(W * (0.35 + s * 0.15), H);
                g.closePath(); g.fill();
            }
            g.fillStyle = 'rgba(6,8,15,0.82)';
            g.beginPath(); g.moveTo(0, H); g.quadraticCurveTo(W * 0.5, H * 0.62, W, H); g.fill();
        } else {
            // 'peaks' or 'forest' multi-layer alpine/ridge silhouettes
            for (let layer = 0; layer < 3; layer++) {
                g.fillStyle = [`rgba(10,16,28,0.34)`, `rgba(7,12,22,0.62)`, `rgba(4,7,14,0.88)`][layer];
                const baseY = H * (0.55 + layer * 0.11);
                g.beginPath();
                g.moveTo(0, H);
                const step = scene === 'forest' ? 18 : 42;
                for (let px = 0; px <= W + step; px += step) {
                    const ridge = Math.sin(px * 0.012 + layer * 2.1) * 28 + rnd() * (scene === 'forest' ? 28 : 44);
                    g.lineTo(px, baseY - Math.abs(ridge));
                }
                g.lineTo(W, H); g.closePath(); g.fill();
            }
        }
    }

    function wrapTitle(g, text, maxW) {
        const words = String(text || '').toUpperCase().split(/\s+/).filter(Boolean);
        const lines = [];
        let cur = '';
        for (const w of words) {
            const test = cur ? cur + ' ' + w : w;
            if (g.measureText(test).width > maxW && cur) {
                lines.push(cur);
                cur = w;
            } else cur = test;
        }
        if (cur) lines.push(cur);
        if (lines.length > 2) return [lines[0], lines.slice(1).join(' ')];
        return lines;
    }

    function renderPoster(def) {
        const W = 640, H = 360;
        const c = document.createElement('canvas');
        c.width = W;
        c.height = H;
        const g = c.getContext('2d');
        const accent = def.accent || '#f59e0b';
        const rnd = rng32(def.id || def.name);
        const th = THEMES[def.id] || {
            sky: ['#090d16', '#1e293b', '#0f172a'],
            bloom: accent,
            scene: def.cat === 'speed' ? 'cyber' : def.cat === 'arcade' ? 'arena' : 'peaks',
            label: (def.cat || 'MINIGAME').toUpperCase(),
            bx: 0.72,
            by: 0.26
        };

        // 1. Deep 3-stop atmospheric gradient
        const sky = g.createLinearGradient(0, 0, W * 0.4, H);
        sky.addColorStop(0, th.sky[0]);
        sky.addColorStop(0.55, th.sky[1]);
        sky.addColorStop(1, th.sky[2]);
        g.fillStyle = sky;
        g.fillRect(0, 0, W, H);

        // 2. Keylight radial sun/moon/neon bloom
        const bx = W * (th.bx || 0.72), by = H * (th.by || 0.26);
        const sun = g.createRadialGradient(bx, by, 8, bx, by, W * 0.46);
        sun.addColorStop(0, rgba('#ffffff', 0.85));
        sun.addColorStop(0.14, rgba(th.bloom, 0.62));
        sun.addColorStop(0.45, rgba(accent, 0.22));
        sun.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = sun;
        g.fillRect(0, 0, W, H);

        // 3. Multi-layer atmospheric horizon silhouettes
        drawHorizonScene(g, W, H, th.scene, th.bloom, rnd);

        // 4. Diagonal volumetric light shaft & floating bokeh particles
        const ray = g.createLinearGradient(0, 0, W * 0.85, H);
        ray.addColorStop(0, rgba(th.bloom, 0.14));
        ray.addColorStop(0.5, rgba(accent, 0.05));
        ray.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = ray;
        g.beginPath(); g.moveTo(W * 0.25, 0); g.lineTo(W * 0.65, 0); g.lineTo(W, H); g.lineTo(W * 0.45, H); g.closePath(); g.fill();

        for (let i = 0; i < 24; i++) {
            g.fillStyle = rgba(i % 2 ? '#ffffff' : th.bloom, 0.12 + rnd() * 0.35);
            g.beginPath(); g.arc(rnd() * W, rnd() * H, 1.2 + rnd() * 3.8, 0, Math.PI * 2); g.fill();
        }

        // 5. Left scrim for ultra-clean title readability
        const scrim = g.createLinearGradient(0, 0, W * 0.78, 0);
        scrim.addColorStop(0, 'rgba(5, 8, 16, 0.86)');
        scrim.addColorStop(0.62, 'rgba(5, 8, 16, 0.44)');
        scrim.addColorStop(1, 'rgba(5, 8, 16, 0.05)');
        g.fillStyle = scrim;
        g.fillRect(0, 0, W, H);

        // 6. Right-side 3D beveled metallic emblem badge
        const ex = W * 0.78, ey = H * 0.50, er = 72;
        g.save();
        g.shadowColor = rgba(accent, 0.55);
        g.shadowBlur = 32;
        const rimGrad = g.createLinearGradient(ex - er, ey - er, ex + er, ey + er);
        rimGrad.addColorStop(0, '#ffffff');
        rimGrad.addColorStop(0.35, accent);
        rimGrad.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
        g.fillStyle = rimGrad;
        g.beginPath(); g.arc(ex, ey, er + 6, 0, Math.PI * 2); g.fill();
        g.restore();

        const disc = g.createRadialGradient(ex - 14, ey - 18, 6, ex, ey, er);
        disc.addColorStop(0, 'rgba(30, 41, 59, 0.94)');
        disc.addColorStop(1, 'rgba(6, 10, 18, 0.98)');
        g.fillStyle = disc;
        g.beginPath(); g.arc(ex, ey, er, 0, Math.PI * 2); g.fill();

        // Top gloss arc on emblem
        g.strokeStyle = 'rgba(255,255,255,0.28)';
        g.lineWidth = 2.2;
        g.beginPath(); g.arc(ex, ey, er - 5, Math.PI * 1.12, Math.PI * 1.88); g.stroke();

        g.font = '68px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillStyle = '#ffffff';
        g.fillText(def.icon || '🎯', ex, ey + 4);

        // 7. Left-aligned AAA poster typography
        const tx = 44;
        g.textAlign = 'left';
        g.textBaseline = 'alphabetic';
        g.font = '800 16px Bahnschrift, "Segoe UI", sans-serif';
        g.fillStyle = th.bloom;
        g.fillText(th.label, tx, 134);

        g.font = '900 42px Bahnschrift, Impact, sans-serif';
        const lines = wrapTitle(g, def.name || def.id, 345);
        const startY = lines.length === 1 ? 196 : 178;
        g.save();
        g.shadowColor = 'rgba(0,0,0,0.85)';
        g.shadowBlur = 14;
        g.shadowOffsetY = 3;
        g.fillStyle = '#f8fafc';
        lines.forEach((ln, idx) => g.fillText(ln, tx, startY + idx * 46));
        g.restore();

        const barY = startY + (lines.length - 1) * 46 + 22;
        const bar = g.createLinearGradient(tx, 0, tx + 160, 0);
        bar.addColorStop(0, accent);
        bar.addColorStop(1, rgba(th.bloom, 0.05));
        g.fillStyle = bar;
        g.fillRect(tx, barY, 160, 5);

        // 8. Subtle vignette + glossy top edge
        const vig = g.createRadialGradient(W / 2, H / 2, W * 0.28, W / 2, H / 2, W * 0.72);
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(1, 'rgba(0,0,0,0.52)');
        g.fillStyle = vig;
        g.fillRect(0, 0, W, H);

        g.strokeStyle = rgba(accent, 0.42);
        g.lineWidth = 2;
        g.strokeRect(1, 1, W - 2, H - 2);

        try {
            const webp = c.toDataURL('image/webp', 0.88);
            if (webp && webp.startsWith('data:image/webp')) return webp;
        } catch (_) {}
        return c.toDataURL('image/png');
    }

    BO.MinigameThumbs = {
        STATIC_ART,
        artUrl(def) {
            if (!def || !def.id) return '';
            if (STATIC_ART.has(def.id)) return `assets/minigames/${def.id}.webp?v=art2`;
            return def.cardImage || this.get(def);
        },
        get(def) {
            if (!def || !def.id) return '';
            if (STATIC_ART.has(def.id)) return `assets/minigames/${def.id}.webp?v=art2`;
            if (cache.has(def.id)) return cache.get(def.id);
            const url = renderPoster(def);
            cache.set(def.id, url);
            return url;
        }
    };
})(window);
