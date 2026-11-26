/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Procedural Illustrated 320x180 Poster Thumbnails
   Generates crisp WebP/PNG data URLs for every minigame card without a static
   cardImage, tailored to each game's theme, atmosphere, characters & props.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const cache = new Map();

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

    function drawBullseye(g, cx, cy, r, style) {
        const rings = style === 'gold'
            ? ['#fef08a', '#f59e0b', '#fef08a', '#b45309', '#ffffff']
            : ['#f8fafc', '#dc2626', '#f8fafc', '#dc2626', '#facc15'];
        for (let i = 0; i < rings.length; i++) {
            g.beginPath();
            g.arc(cx, cy, r * (1 - i * 0.2), 0, Math.PI * 2);
            g.fillStyle = rings[i];
            g.fill();
            g.lineWidth = 1.4;
            g.strokeStyle = 'rgba(15,23,42,0.75)';
            g.stroke();
        }
    }

    function drawBulbsRow(g, x1, y1, x2, y2, n, colors) {
        for (let i = 0; i <= n; i++) {
            const t = i / n;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;
            const col = colors[i % colors.length];
            g.fillStyle = rgba(col, 0.35);
            g.beginPath();
            g.arc(x, y, 7, 0, Math.PI * 2);
            g.fill();
            g.fillStyle = col;
            g.beginPath();
            g.arc(x, y, 3.2, 0, Math.PI * 2);
            g.fill();
        }
    }

    function drawCrosshair(g, cx, cy, r, col) {
        g.save();
        g.strokeStyle = col;
        g.lineWidth = 2;
        g.beginPath();
        g.arc(cx, cy, r, 0, Math.PI * 2);
        g.stroke();
        g.beginPath();
        g.moveTo(cx - r * 1.45, cy); g.lineTo(cx - r * 0.55, cy);
        g.moveTo(cx + r * 0.55, cy); g.lineTo(cx + r * 1.45, cy);
        g.moveTo(cx, cy - r * 1.45); g.lineTo(cx, cy - r * 0.55);
        g.moveTo(cx, cy + r * 0.55); g.lineTo(cx, cy + r * 1.45);
        g.stroke();
        g.fillStyle = col;
        g.beginPath();
        g.arc(cx, cy, 2.4, 0, Math.PI * 2);
        g.fill();
        g.restore();
    }

    function drawStarburst(g, W, H, cx, cy, col, rays) {
        g.save();
        g.fillStyle = rgba(col, 0.10);
        for (let i = 0; i < rays; i++) {
            const a1 = (i / rays) * Math.PI * 2;
            const a2 = a1 + (Math.PI / rays);
            g.beginPath();
            g.moveTo(cx, cy);
            g.lineTo(cx + Math.cos(a1) * W, cy + Math.sin(a1) * W);
            g.lineTo(cx + Math.cos(a2) * W, cy + Math.sin(a2) * W);
            g.closePath();
            g.fill();
        }
        g.restore();
    }

    const CUSTOM = {
        whack_a_mole(g, W, H) {
            const sky = g.createLinearGradient(0, 0, 0, H);
            sky.addColorStop(0, '#4c0519');
            sky.addColorStop(0.55, '#881337');
            sky.addColorStop(1, '#451a03');
            g.fillStyle = sky;
            g.fillRect(0, 0, W, H);
            // striped carnival awning
            for (let i = 0; i < 16; i++) {
                g.fillStyle = i % 2 ? '#fef3c7' : '#dc2626';
                g.fillRect(i * 20, 0, 20, 28);
            }
            drawBulbsRow(g, 14, 30, W - 14, 30, 12, ['#fde047', '#ffffff', '#fb7185']);
            // wooden board
            g.fillStyle = '#78350f';
            g.fillRect(16, 112, W - 32, 68);
            g.fillStyle = '#facc15';
            g.fillRect(16, 112, W - 32, 4);
            // 3 holes + cute wide-eyed mole popping up in center
            for (const hx of [82, 160, 238]) {
                g.fillStyle = '#1c1917';
                g.beginPath(); g.ellipse(hx, 140, 32, 11, 0, 0, Math.PI * 2); g.fill();
                g.strokeStyle = '#a16207'; g.lineWidth = 3; g.stroke();
            }
            // Mole body
            g.fillStyle = '#6b3a1f';
            g.beginPath(); g.arc(160, 108, 28, Math.PI, 0); g.lineTo(188, 140); g.lineTo(132, 140); g.closePath(); g.fill();
            g.fillStyle = '#d6a77a';
            g.beginPath(); g.ellipse(160, 124, 17, 15, 0, 0, Math.PI * 2); g.fill();
            // Hard hat
            g.fillStyle = '#facc15';
            g.beginPath(); g.arc(160, 84, 24, Math.PI, 0); g.closePath(); g.fill();
            g.fillRect(130, 82, 60, 6);
            // Eyes + pink nose
            for (const sx of [-9, 9]) {
                g.fillStyle = '#ffffff'; g.beginPath(); g.arc(160 + sx, 102, 5.5, 0, Math.PI * 2); g.fill();
                g.fillStyle = '#09090b'; g.beginPath(); g.arc(160 + sx, 102, 2.8, 0, Math.PI * 2); g.fill();
            }
            g.fillStyle = '#f472b6'; g.beginPath(); g.ellipse(160, 112, 6, 4.5, 0, 0, Math.PI * 2); g.fill();
            // Mallet / Pow star
            g.fillStyle = '#fde047';
            g.font = '900 18px Bahnschrift, sans-serif';
            g.textAlign = 'center';
            g.fillText('WHACK!', 244, 72);
        },

        range_day(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#1e3a8a');
            bg.addColorStop(0.55, '#fb923c');
            bg.addColorStop(1, '#b45309');
            g.fillStyle = bg;
            g.fillRect(0, 0, W, H);
            // berm & steel backstop
            g.fillStyle = '#475569';
            g.fillRect(0, 104, W, 38);
            g.fillStyle = '#0f172a';
            g.fillRect(0, 134, W, 8);
            for (let x = 0; x < W; x += 24) {
                g.fillStyle = '#facc15';
                g.beginPath(); g.moveTo(x, 142); g.lineTo(x + 12, 142); g.lineTo(x + 18, 134); g.lineTo(x + 6, 134); g.closePath(); g.fill();
            }
            // Overhead beam + floodlights
            g.fillStyle = '#1e293b';
            g.fillRect(0, 0, W, 18);
            drawBulbsRow(g, 24, 18, W - 24, 18, 10, ['#fef08a', '#f59e0b']);
            // Pop-up targets & golden steel gong
            drawBullseye(g, 78, 96, 26, 'classic');
            drawBullseye(g, 162, 76, 30, 'gold');
            drawBullseye(g, 246, 100, 22, 'classic');
            drawCrosshair(g, 162, 76, 20, '#fde047');
        },

        skeet(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#1d4ed8');
            bg.addColorStop(0.6, '#93c5fd');
            bg.addColorStop(1, '#3f6212');
            g.fillStyle = bg;
            g.fillRect(0, 0, W, H);
            g.fillStyle = '#4d7c0f';
            g.fillRect(0, 126, W, 54);
            // High & Low houses
            g.fillStyle = '#e7e5e4';
            g.fillRect(14, 62, 44, 72);
            g.fillRect(262, 102, 44, 34);
            g.fillStyle = '#7f1d1d';
            g.beginPath(); g.moveTo(10, 62); g.lineTo(36, 42); g.lineTo(62, 62); g.closePath(); g.fill();
            g.beginPath(); g.moveTo(258, 102); g.lineTo(284, 86); g.lineTo(310, 102); g.closePath(); g.fill();
            drawBulbsRow(g, 18, 62, 54, 62, 4, ['#fb923c', '#facc15']);
            drawBulbsRow(g, 266, 102, 302, 102, 3, ['#fb923c', '#facc15']);
            // Arc trail + flying orange & gold clays
            g.strokeStyle = 'rgba(255,255,255,0.45)';
            g.lineWidth = 2;
            g.setLineDash([5, 5]);
            g.beginPath(); g.moveTo(58, 70); g.quadraticCurveTo(160, 22, 260, 92); g.stroke();
            g.setLineDash([]);
            for (const [cx, cy, col] of [[116, 48, '#f97316'], [205, 58, '#facc15']]) {
                g.fillStyle = col;
                g.beginPath(); g.ellipse(cx, cy, 18, 6.5, -0.2, 0, Math.PI * 2); g.fill();
                g.strokeStyle = '#1c1917'; g.lineWidth = 1.5; g.stroke();
            }
            // Burst shards
            g.fillStyle = '#fdba74';
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                g.fillRect(205 + Math.cos(a) * 20, 58 + Math.sin(a) * 14, 5, 4);
            }
        },

        quickdraw(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#7c2d12');
            bg.addColorStop(0.55, '#f59e0b');
            bg.addColorStop(1, '#78350f');
            g.fillStyle = bg;
            g.fillRect(0, 0, W, H);
            // High noon sun + bell tower
            g.fillStyle = '#fef08a';
            g.beginPath(); g.arc(160, 74, 34, 0, Math.PI * 2); g.fill();
            g.fillStyle = '#451a03';
            g.fillRect(142, 36, 36, 94);
            g.beginPath(); g.moveTo(136, 36); g.lineTo(160, 12); g.lineTo(184, 36); g.closePath(); g.fill();
            g.fillStyle = '#fef3c7';
            g.beginPath(); g.arc(160, 58, 10, 0, Math.PI * 2); g.fill();
            // Saloon buildings left/right with glowing amber lanterns
            g.fillStyle = '#3f2a14';
            g.fillRect(0, 34, 72, 120);
            g.fillRect(W - 72, 34, 72, 120);
            drawBulbsRow(g, 18, 92, 66, 92, 3, ['#fbbf24', '#f59e0b']);
            drawBulbsRow(g, W - 66, 92, W - 18, 92, 3, ['#fbbf24', '#f59e0b']);
            // Duelist cowboy silhouette
            g.fillStyle = '#09090b';
            g.beginPath(); g.ellipse(160, 72, 24, 5, 0, 0, Math.PI * 2); g.fill();
            g.fillRect(148, 56, 24, 16);
            g.beginPath(); g.arc(160, 82, 10, 0, Math.PI * 2); g.fill();
            g.fillRect(146, 92, 28, 42);
            g.fillRect(146, 134, 11, 34);
            g.fillRect(163, 134, 11, 34);
            g.fillStyle = '#fde047';
            g.font = '900 22px Bahnschrift, sans-serif';
            g.textAlign = 'center';
            g.fillText('DRAW!', 160, 166);
        },

        contracts(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#020617');
            bg.addColorStop(0.6, '#0f172a');
            bg.addColorStop(1, '#1e293b');
            g.fillStyle = bg;
            g.fillRect(0, 0, W, H);
            // City towers & warm lit windows
            for (const [x, w, h] of [[10, 44, 96], [62, 50, 120], [210, 48, 110], [264, 46, 90]]) {
                g.fillStyle = '#0f172a';
                g.fillRect(x, H - h - 22, w, h);
                g.fillStyle = 'rgba(253,230,138,0.45)';
                for (let wy = H - h - 10; wy < H - 34; wy += 16) {
                    for (let wx = x + 8; wx < x + w - 10; wx += 14) g.fillRect(wx, wy, 7, 9);
                }
            }
            // Plaza + getaway car + VIP target in sniper scope
            g.fillStyle = '#09090b';
            g.fillRect(108, 128, 72, 22);
            g.fillStyle = '#ef4444';
            g.fillRect(112, 138, 8, 5);
            g.fillStyle = '#e2e8f0';
            g.beginPath(); g.arc(210, 104, 11, 0, Math.PI * 2); g.fill();
            g.fillRect(198, 115, 24, 42);
            // Red sniper laser + scope ring
            g.strokeStyle = 'rgba(239,68,68,0.65)';
            g.lineWidth = 1.6;
            g.beginPath(); g.moveTo(0, 26); g.lineTo(210, 104); g.stroke();
            drawCrosshair(g, 210, 104, 34, '#ef4444');
        },

        beat_drop(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#1e1b4b');
            bg.addColorStop(0.55, '#581c87');
            bg.addColorStop(1, '#09090b');
            g.fillStyle = bg;
            g.fillRect(0, 0, W, H);
            // Equalizer bars
            const eq = [0.4, 0.75, 0.9, 0.55, 0.85, 0.95, 0.65, 0.8, 0.5, 0.7];
            for (let i = 0; i < eq.length; i++) {
                const col = i % 2 ? '#22d3ee' : '#ec4899';
                g.fillStyle = rgba(col, 0.42);
                const bh = eq[i] * 86;
                g.fillRect(24 + i * 28, 126 - bh, 18, bh);
            }
            // Hit line & glowing rhythm orbs
            g.strokeStyle = '#facc15';
            g.lineWidth = 3;
            g.beginPath(); g.moveTo(16, 138); g.lineTo(W - 16, 138); g.stroke();
            for (const [x, y, col] of [[68, 56, '#22d3ee'], [134, 92, '#ec4899'], [196, 136, '#facc15'], [254, 72, '#a855f7']]) {
                g.fillStyle = col;
                g.beginPath(); g.arc(x, y, 16, 0, Math.PI * 2); g.fill();
                g.strokeStyle = '#ffffff'; g.lineWidth = 2.5; g.stroke();
            }
        },

        coaster(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#0f172a');
            bg.addColorStop(0.6, '#312e81');
            bg.addColorStop(1, '#1e1b4b');
            g.fillStyle = bg;
            g.fillRect(0, 0, W, H);
            // Roller coaster track curve
            g.strokeStyle = '#facc15';
            g.lineWidth = 5;
            g.beginPath(); g.moveTo(0, 140); g.bezierCurveTo(75, 34, 155, 160, 235, 54); g.lineTo(W, 118); g.stroke();
            // Floating balloons
            for (const [bx, by, col] of [[78, 54, '#ef4444'], [132, 46, '#22d3ee'], [196, 70, '#ec4899'], [254, 44, '#facc15']]) {
                g.fillStyle = col;
                g.beginPath(); g.ellipse(bx, by, 14, 17, 0, 0, Math.PI * 2); g.fill();
                g.strokeStyle = '#e2e8f0'; g.lineWidth = 1.2;
                g.beginPath(); g.moveTo(bx, by + 17); g.lineTo(bx, by + 38); g.stroke();
            }
        },

        temple_run(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#064e3b');
            bg.addColorStop(0.5, '#78350f');
            bg.addColorStop(1, '#451a03');
            g.fillStyle = bg;
            g.fillRect(0, 0, W, H);
            // Temple stone pillars & torches
            g.fillStyle = '#57534e';
            g.fillRect(18, 12, 34, 152);
            g.fillRect(W - 52, 12, 34, 152);
            for (const fx of [58, W - 58]) {
                g.fillStyle = '#f97316';
                g.beginPath(); g.arc(fx, 62, 11, 0, Math.PI * 2); g.fill();
                g.fillStyle = '#fde047';
                g.beginPath(); g.arc(fx, 60, 6, 0, Math.PI * 2); g.fill();
            }
            // Giant rolling boulder
            g.fillStyle = '#78716c';
            g.beginPath(); g.arc(160, 96, 48, 0, Math.PI * 2); g.fill();
            g.strokeStyle = '#292524'; g.lineWidth = 3; g.stroke();
            g.beginPath(); g.moveTo(132, 74); g.lineTo(156, 98); g.lineTo(188, 82); g.stroke();
        },

        boss_rush(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#450a0a');
            bg.addColorStop(0.6, '#991b1b');
            bg.addColorStop(1, '#18181b');
            g.fillStyle = bg;
            g.fillRect(0, 0, W, H);
            drawStarburst(g, W, H, 160, 86, '#f87171', 14);
            // Horned colossus silhouette with glowing weak core
            g.fillStyle = '#09090b';
            g.beginPath(); g.arc(160, 88, 42, 0, Math.PI * 2); g.fill();
            g.fillRect(102, 100, 116, 78);
            g.beginPath(); g.moveTo(126, 56); g.lineTo(106, 20); g.lineTo(144, 48); g.closePath(); g.fill();
            g.beginPath(); g.moveTo(194, 56); g.lineTo(214, 20); g.lineTo(176, 48); g.closePath(); g.fill();
            // Glowing eyes + chest core
            g.fillStyle = '#ef4444';
            g.beginPath(); g.arc(144, 80, 6, 0, Math.PI * 2); g.arc(176, 80, 6, 0, Math.PI * 2); g.fill();
            g.fillStyle = '#facc15';
            g.beginPath(); g.arc(160, 126, 14, 0, Math.PI * 2); g.fill();
            drawCrosshair(g, 160, 126, 22, '#fde047');
        },

        fun_angry_birds(g, W, H) {
            const sky = g.createLinearGradient(0, 0, 0, H);
            sky.addColorStop(0, '#0284c7'); sky.addColorStop(0.7, '#bae6fd'); sky.addColorStop(1, '#15803d');
            g.fillStyle = sky; g.fillRect(0, 0, W, H);
            g.fillStyle = '#16a34a'; g.fillRect(0, 134, W, 46);
            // Slingshot left + Red bird mid-flight + Pig fort right
            g.strokeStyle = '#78350f'; g.lineWidth = 7;
            g.beginPath(); g.moveTo(58, 136); g.lineTo(58, 94); g.lineTo(42, 66); g.moveTo(58, 94); g.lineTo(74, 66); g.stroke();
            g.fillStyle = '#dc2626'; g.beginPath(); g.arc(124, 64, 18, 0, Math.PI * 2); g.fill();
            g.fillStyle = '#facc15'; g.beginPath(); g.moveTo(140, 62); g.lineTo(152, 66); g.lineTo(140, 70); g.closePath(); g.fill();
            g.fillStyle = '#b45309'; g.fillRect(216, 78, 70, 56);
            g.fillStyle = '#4ade80'; g.beginPath(); g.arc(251, 68, 16, 0, Math.PI * 2); g.fill();
        },

        fun_ff_rpg(g, W, H) {
            const bg = g.createLinearGradient(0, 0, W, H);
            bg.addColorStop(0, '#090d26'); bg.addColorStop(0.6, '#1e3a8a'); bg.addColorStop(1, '#020617');
            g.fillStyle = bg; g.fillRect(0, 0, W, H);
            drawStarburst(g, W, H, 160, 82, '#38bdf8', 16);
            // Floating Crystal
            g.fillStyle = '#38bdf8';
            g.beginPath(); g.moveTo(160, 26); g.lineTo(192, 82); g.lineTo(160, 146); g.lineTo(128, 82); g.closePath(); g.fill();
            g.fillStyle = '#e0f2fe';
            g.beginPath(); g.moveTo(160, 26); g.lineTo(176, 82); g.lineTo(160, 146); g.closePath(); g.fill();
        },

        fun_kaiju_mecha(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#450a0a'); bg.addColorStop(0.6, '#991b1b'); bg.addColorStop(1, '#0f172a');
            g.fillStyle = bg; g.fillRect(0, 0, W, H);
            g.fillStyle = '#09090b';
            for (const [x, h] of [[16, 70], [54, 100], [116, 62], [242, 95], [278, 72]]) g.fillRect(x, H - h, 28, h);
            // Kaiju glowing dorsal spines + atomic beam
            g.fillStyle = '#06b6d4';
            for (const sy of [46, 64, 84]) { g.beginPath(); g.moveTo(106, sy); g.lineTo(84, sy + 8); g.lineTo(108, sy + 16); g.closePath(); g.fill(); }
            g.fillStyle = '#18181b'; g.beginPath(); g.arc(134, 62, 26, 0, Math.PI * 2); g.fill();
            g.fillRect(108, 78, 52, 84);
            g.strokeStyle = '#38bdf8'; g.lineWidth = 6;
            g.beginPath(); g.moveTo(154, 66); g.lineTo(256, 78); g.stroke();
        },

        fun_hoverbike(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#020617'); bg.addColorStop(0.55, '#3b0764'); bg.addColorStop(1, '#06b6d4');
            g.fillStyle = bg; g.fillRect(0, 0, W, H);
            // Perspective neon highway lines
            g.strokeStyle = '#ec4899'; g.lineWidth = 2.5;
            for (let x = -120; x <= W + 120; x += 60) {
                g.beginPath(); g.moveTo(160, 62); g.lineTo(x, H); g.stroke();
            }
            // Hoverbike silhouette + twin cyan thrusters
            g.fillStyle = '#0f172a';
            g.beginPath(); g.moveTo(126, 134); g.lineTo(160, 102); g.lineTo(194, 134); g.closePath(); g.fill();
            g.fillStyle = '#22d3ee';
            g.beginPath(); g.arc(146, 136, 9, 0, Math.PI * 2); g.arc(174, 136, 9, 0, Math.PI * 2); g.fill();
        },

        fun_pinball(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#1e1b4b'); bg.addColorStop(1, '#312e81');
            g.fillStyle = bg; g.fillRect(0, 0, W, H);
            for (const [x, y, c] of [[96, 62, '#ec4899'], [160, 44, '#facc15'], [224, 62, '#22d3ee']]) {
                g.fillStyle = rgba(c, 0.35); g.beginPath(); g.arc(x, y, 26, 0, Math.PI * 2); g.fill();
                g.fillStyle = c; g.beginPath(); g.arc(x, y, 16, 0, Math.PI * 2); g.fill();
                g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.stroke();
            }
            // Flippers + steel pinball
            g.strokeStyle = '#facc15'; g.lineWidth = 10; g.lineCap = 'round';
            g.beginPath(); g.moveTo(86, 140); g.lineTo(138, 158); g.moveTo(234, 140); g.lineTo(182, 158); g.stroke();
            g.fillStyle = '#e2e8f0'; g.beginPath(); g.arc(160, 114, 12, 0, Math.PI * 2); g.fill();
        },

        bandit_town(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#9a3412'); bg.addColorStop(0.55, '#fcd34d'); bg.addColorStop(1, '#78350f');
            g.fillStyle = bg; g.fillRect(0, 0, W, H);
            g.fillStyle = '#3f2a14'; g.fillRect(8, 28, 70, 126); g.fillRect(W - 78, 28, 70, 126);
            drawBulbsRow(g, 16, 94, 70, 94, 3, ['#fbbf24', '#f59e0b']);
            drawBulbsRow(g, W - 70, 94, W - 16, 94, 3, ['#fbbf24', '#f59e0b']);
            // Outlaw window silhouette
            g.fillStyle = '#c8a36a'; g.beginPath(); g.arc(160, 72, 18, 0, Math.PI * 2); g.fill();
            g.fillRect(142, 90, 36, 56);
            g.fillStyle = '#3f2a14'; g.beginPath(); g.ellipse(160, 56, 30, 6, 0, 0, Math.PI * 2); g.fill();
            g.fillRect(146, 36, 28, 20);
            drawBullseye(g, 160, 114, 15, 'classic');
            drawCrosshair(g, 160, 114, 24, '#facc15');
        },

        drone_swarm(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#020617'); bg.addColorStop(0.65, '#1e1b4b'); bg.addColorStop(1, '#0f172a');
            g.fillStyle = bg; g.fillRect(0, 0, W, H);
            // City towers & searchlights
            g.fillStyle = '#0f172a';
            for (const [x, h] of [[12, 82], [58, 106], [220, 94], [268, 78]]) g.fillRect(x, H - h, 36, h);
            drawBulbsRow(g, 14, 156, W - 14, 156, 12, ['#22d3ee', '#f472b6']);
            // Hovering quadcopters
            for (const [dx, dy, c] of [[98, 66, '#f43f5e'], [178, 52, '#22d3ee'], [242, 82, '#f59e0b']]) {
                g.strokeStyle = '#94a3b8'; g.lineWidth = 3;
                g.beginPath(); g.moveTo(dx - 20, dy - 6); g.lineTo(dx + 20, dy + 6); g.moveTo(dx + 20, dy - 6); g.lineTo(dx - 20, dy + 6); g.stroke();
                g.fillStyle = '#27272a'; g.fillRect(dx - 11, dy - 7, 22, 14);
                g.fillStyle = c; g.beginPath(); g.arc(dx, dy + 8, 5, 0, Math.PI * 2); g.fill();
            }
            drawCrosshair(g, 178, 52, 24, '#22d3ee');
        },

        sniper_ridge(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#0c4a6e'); bg.addColorStop(0.65, '#e0f2fe'); bg.addColorStop(1, '#3f6212');
            g.fillStyle = bg; g.fillRect(0, 0, W, H);
            // Snow-capped peaks
            g.fillStyle = '#44403c';
            g.beginPath(); g.moveTo(10, 124); g.lineTo(86, 36); g.lineTo(160, 124); g.closePath(); g.fill();
            g.beginPath(); g.moveTo(150, 124); g.lineTo(236, 26); g.lineTo(314, 124); g.closePath(); g.fill();
            g.fillStyle = '#f8fafc';
            g.beginPath(); g.moveTo(64, 62); g.lineTo(86, 36); g.lineTo(108, 62); g.closePath(); g.fill();
            g.beginPath(); g.moveTo(212, 54); g.lineTo(236, 26); g.lineTo(260, 54); g.closePath(); g.fill();
            g.fillStyle = '#4d7c0f'; g.fillRect(0, 124, W, 56);
            drawBullseye(g, 160, 96, 16, 'gold');
            drawCrosshair(g, 160, 96, 44, '#a3e635');
        },

        heli_gunner(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#1e3a8a'); bg.addColorStop(0.6, '#fdba74'); bg.addColorStop(1, '#1e293b');
            g.fillStyle = bg; g.fillRect(0, 0, W, H);
            // Skyline blocks + heli open door frame
            g.fillStyle = '#334155';
            for (const [x, w, h] of [[42, 48, 86], [104, 52, 108], [174, 48, 92], [234, 44, 78]]) g.fillRect(x, H - h, w, h);
            g.fillStyle = '#18181b'; g.fillRect(0, 0, 22, H); g.fillRect(W - 22, 0, 22, H); g.fillRect(0, 0, W, 18);
            g.fillStyle = '#ef4444'; g.beginPath(); g.arc(130, 62, 10, 0, Math.PI * 2); g.fill();
            drawCrosshair(g, 130, 62, 22, '#a3e635');
        },

        balloon_fest(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#312e81'); bg.addColorStop(0.65, '#fb923c'); bg.addColorStop(1, '#365314');
            g.fillStyle = bg; g.fillRect(0, 0, W, H);
            drawBulbsRow(g, 12, 24, W - 12, 34, 12, ['#fde047', '#f472b6', '#60a5fa', '#4ade80']);
            for (const [bx, by, col] of [[72, 92, '#ef4444'], [128, 66, '#facc15'], [190, 84, '#22d3ee'], [246, 102, '#18181b']]) {
                g.fillStyle = col; g.beginPath(); g.ellipse(bx, by, 18, 22, 0, 0, Math.PI * 2); g.fill();
                g.strokeStyle = '#e2e8f0'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(bx, by + 22); g.lineTo(bx, by + 48); g.stroke();
            }
            g.fillStyle = '#f43f5e'; g.beginPath(); g.arc(246, 98, 7, 0, Math.PI * 2); g.fill();
        },

        killhouse_blitz(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#18181b'); bg.addColorStop(0.6, '#78552b'); bg.addColorStop(1, '#292524');
            g.fillStyle = bg; g.fillRect(0, 0, W, H);
            // Plywood walls + doorway
            g.fillStyle = '#b08d57'; g.fillRect(14, 24, 92, 136); g.fillRect(W - 106, 24, 92, 136);
            g.fillStyle = '#09090b'; g.fillRect(106, 24, 108, 136);
            drawBulbsRow(g, 36, 18, W - 36, 18, 8, ['#ef4444', '#f59e0b']);
            // Hostile silhouette in doorway
            g.fillStyle = '#ef4444'; g.beginPath(); g.arc(160, 66, 16, 0, Math.PI * 2); g.fill();
            g.fillRect(142, 84, 36, 62);
            drawCrosshair(g, 160, 74, 24, '#fef08a');
        },

        one_mag(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#1e293b'); bg.addColorStop(0.6, '#fb923c'); bg.addColorStop(1, '#451a03');
            g.fillStyle = bg; g.fillRect(0, 0, W, H);
            drawBulbsRow(g, 20, 20, W - 20, 20, 10, ['#fef08a', '#f8fafc']);
            // Giant 30-round mag silhouette on left + gleaming gold plate right
            g.fillStyle = '#1f2937'; g.fillRect(42, 48, 34, 88);
            g.fillStyle = '#94a3b8'; g.font = '900 18px Bahnschrift, sans-serif'; g.textAlign = 'center'; g.fillText('30', 59, 98);
            drawBullseye(g, 205, 86, 30, 'gold');
            drawCrosshair(g, 205, 86, 22, '#e2e8f0');
        },

        outlaw_pursuit(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#1e3a8a'); bg.addColorStop(0.55, '#fdba74'); bg.addColorStop(1, '#7c4a1e');
            g.fillStyle = bg; g.fillRect(0, 0, W, H);
            // Frontier trail & river curve
            g.fillStyle = '#0284c7'; g.beginPath(); g.moveTo(0, 130); g.quadraticCurveTo(180, 108, W, 146); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
            g.fillStyle = '#a47548'; g.beginPath(); g.moveTo(76, H); g.quadraticCurveTo(148, 120, 210, 92); g.lineTo(246, 92); g.quadraticCurveTo(210, 132, 232, H); g.closePath(); g.fill();
            // Galloping bandit horse silhouette
            g.fillStyle = '#3f2a14'; g.beginPath(); g.ellipse(208, 92, 24, 14, -0.1, 0, Math.PI * 2); g.fill();
            g.fillStyle = '#111827'; g.fillRect(202, 54, 16, 30);
            g.beginPath(); g.ellipse(210, 52, 22, 5, 0, 0, Math.PI * 2); g.fill();
            drawCrosshair(g, 210, 68, 22, '#facc15');
        },

        mansion_raid(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#020617'); bg.addColorStop(0.65, '#1e293b'); bg.addColorStop(1, '#14532d');
            g.fillStyle = bg; g.fillRect(0, 0, W, H);
            // Estate silhouette + glowing golden chandelier windows
            g.fillStyle = '#d6cfc0'; g.fillRect(58, 56, 204, 96);
            g.fillStyle = '#3f3f46'; g.beginPath(); g.moveTo(42, 58); g.lineTo(160, 18); g.lineTo(278, 58); g.closePath(); g.fill();
            g.fillStyle = '#fde68a';
            for (const wx of [84, 124, 180, 220]) { g.fillRect(wx, 72, 18, 24); g.fillRect(wx, 108, 18, 24); }
            g.fillStyle = '#1c1917'; g.fillRect(148, 108, 24, 44);
            // Police red/blue sirens in front
            drawBulbsRow(g, 92, 58, 228, 58, 8, ['#ef4444', '#3b82f6']);
            drawCrosshair(g, 160, 96, 28, '#93c5fd');
        },

        sweetheart_shore(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#0ea5e9'); bg.addColorStop(0.6, '#38bdf8'); bg.addColorStop(0.62, '#06b6d4'); bg.addColorStop(1, '#fde68a');
            g.fillStyle = bg; g.fillRect(0, 0, W, H);
            g.fillStyle = '#fef08a'; g.beginPath(); g.arc(260, 44, 24, 0, Math.PI * 2); g.fill();
            // Floating pink heart target
            g.fillStyle = '#f472b6';
            g.beginPath();
            g.moveTo(160, 126);
            g.bezierCurveTo(106, 94, 106, 46, 160, 74);
            g.bezierCurveTo(214, 46, 214, 94, 160, 126);
            g.fill();
            g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.stroke();
        },

        ball_brawl(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#0ea5e9'); bg.addColorStop(0.7, '#bae6fd'); bg.addColorStop(1, '#fef3c7');
            g.fillStyle = bg; g.fillRect(0, 0, W, H);
            // Floating checkered disc
            g.fillStyle = '#fb923c'; g.beginPath(); g.ellipse(160, 124, 120, 38, 0, 0, Math.PI * 2); g.fill();
            g.strokeStyle = '#fde047'; g.lineWidth = 4; g.stroke();
            drawBulbsRow(g, 56, 124, 264, 124, 10, ['#facc15', '#f472b6', '#22d3ee', '#4ade80']);
            // Twin hamster balls + boxing glove punch
            for (const [bx, by, c] of [[106, 98, '#facc15'], [216, 98, '#ec4899']]) {
                g.fillStyle = c; g.beginPath(); g.arc(bx, by, 20, 0, Math.PI * 2); g.fill();
                g.fillStyle = 'rgba(224,242,254,0.4)'; g.beginPath(); g.arc(bx, by, 32, 0, Math.PI * 2); g.fill();
                g.strokeStyle = c; g.lineWidth = 3; g.stroke();
            }
            g.fillStyle = '#dc2626'; g.beginPath(); g.arc(162, 96, 16, 0, Math.PI * 2); g.fill();
        },

        aim_lab(g, W, H) {
            const bg = g.createLinearGradient(0, 0, W, H);
            bg.addColorStop(0, '#020617'); bg.addColorStop(1, '#0f172a');
            g.fillStyle = bg; g.fillRect(0, 0, W, H);
            g.strokeStyle = 'rgba(56,189,248,0.22)'; g.lineWidth = 1;
            for (let x = 20; x < W; x += 28) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
            for (let y = 20; y < H; y += 28) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
            for (const [tx, ty, tr, tc] of [[88, 72, 16, '#38bdf8'], [166, 94, 22, '#facc15'], [240, 62, 14, '#22d3ee']]) {
                g.fillStyle = tc; g.beginPath(); g.arc(tx, ty, tr, 0, Math.PI * 2); g.fill();
                g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.stroke();
            }
            drawCrosshair(g, 166, 94, 30, '#38bdf8');
        },

        sr_gauntlet(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#0f172a'); bg.addColorStop(0.65, '#1e293b'); bg.addColorStop(1, '#334155');
            g.fillStyle = bg; g.fillRect(0, 0, W, H);
            g.strokeStyle = '#22d3ee'; g.lineWidth = 5;
            g.strokeRect(48, 22, 224, 108);
            g.fillStyle = '#06b6d4'; g.fillRect(118, 128, 84, 34);
            g.fillStyle = '#dc2626'; g.fillRect(62, 74, 34, 52);
            g.fillStyle = '#facc15'; g.fillRect(62, 94, 34, 10);
            drawCrosshair(g, 210, 82, 22, '#facc15');
        },

        sr_outposts(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#0c4a6e'); bg.addColorStop(0.6, '#bbf7d0'); bg.addColorStop(1, '#3f6212');
            g.fillStyle = bg; g.fillRect(0, 0, W, H);
            g.fillStyle = '#57534e'; g.beginPath(); g.moveTo(116, H); g.lineTo(150, 96); g.lineTo(170, 96); g.lineTo(204, H); g.closePath(); g.fill();
            g.fillStyle = '#c2a26b'; g.fillRect(58, 92, 68, 36); g.fillRect(194, 92, 68, 36);
            drawBulbsRow(g, 70, 146, 250, 146, 8, ['#4ade80', '#facc15']);
            drawCrosshair(g, 160, 72, 22, '#16a34a');
        },

        sr_splitter(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#042f2e'); bg.addColorStop(1, '#134e4a');
            g.fillStyle = bg; g.fillRect(0, 0, W, H);
            for (const vx of [46, 274]) { g.fillStyle = 'rgba(45,212,191,0.45)'; g.fillRect(vx - 16, 34, 32, 112); g.strokeStyle = '#5eead4'; g.lineWidth = 2; g.strokeRect(vx - 16, 34, 32, 112); }
            for (const [mx, my] of [[110, 42], [202, 54], [156, 28]]) {
                g.fillStyle = '#ef4444'; g.beginPath(); g.arc(mx, my, 12, 0, Math.PI * 2); g.fill();
                g.fillStyle = '#facc15'; g.beginPath(); g.arc(mx, my, 6, 0, Math.PI * 2); g.fill();
            }
            drawCrosshair(g, 160, 108, 24, '#2dd4bf');
        },

        sr_last50(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#090d16'); bg.addColorStop(0.65, '#334155'); bg.addColorStop(1, '#1a2618');
            g.fillStyle = bg; g.fillRect(0, 0, W, H);
            g.fillStyle = '#e2e8f0'; g.beginPath(); g.arc(248, 42, 20, 0, Math.PI * 2); g.fill();
            g.fillStyle = '#374151'; g.fillRect(102, 42, 26, 98); g.fillRect(192, 42, 26, 98); g.fillRect(92, 28, 136, 20);
            drawBulbsRow(g, 100, 26, 220, 26, 7, ['#ef4444', '#f97316', '#fde047']);
            g.fillStyle = '#ef4444'; g.font = '900 32px Bahnschrift, sans-serif'; g.textAlign = 'center'; g.fillText('50', 160, 106);
        },

        sr_chase(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#1e40af'); bg.addColorStop(0.6, '#fde68a'); bg.addColorStop(1, '#334155');
            g.fillStyle = bg; g.fillRect(0, 0, W, H);
            g.fillStyle = '#1e293b'; g.fillRect(0, 108, W, 72);
            g.fillStyle = '#dc2626'; g.fillRect(184, 96, 62, 28);
            g.fillStyle = '#f8fafc'; g.fillRect(54, 112, 74, 34);
            g.fillStyle = '#ef4444'; g.fillRect(74, 106, 16, 6);
            g.fillStyle = '#3b82f6'; g.fillRect(92, 106, 16, 6);
            drawCrosshair(g, 215, 106, 20, '#38bdf8');
        },

        sr_skysnipers(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#020617'); bg.addColorStop(0.65, '#0f172a'); bg.addColorStop(1, '#1e293b');
            g.fillStyle = bg; g.fillRect(0, 0, W, H);
            g.fillStyle = '#38bdf8';
            g.beginPath(); g.moveTo(116, 76); g.lineTo(192, 76); g.lineTo(154, 62); g.closePath(); g.fill();
            g.fillStyle = '#f97316'; g.fillRect(148, 72, 12, 14);
            drawCrosshair(g, 154, 74, 34, '#38bdf8');
        },

        sr_freefall(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#4c1d95'); bg.addColorStop(0.5, '#f97316'); bg.addColorStop(1, '#fde047');
            g.fillStyle = bg; g.fillRect(0, 0, W, H);
            g.strokeStyle = '#fde047'; g.lineWidth = 4;
            g.beginPath(); g.arc(160, 90, 44, 0, Math.PI * 2); g.stroke();
            g.fillStyle = '#0f172a';
            g.beginPath(); g.moveTo(160, 62); g.lineTo(198, 108); g.lineTo(160, 96); g.lineTo(122, 108); g.closePath(); g.fill();
        },

        sr_ninja(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#020617'); bg.addColorStop(0.65, '#1e1b4b'); bg.addColorStop(1, '#14261c');
            g.fillStyle = bg; g.fillRect(0, 0, W, H);
            g.fillStyle = '#b91c1c';
            g.fillRect(82, 48, 18, 96); g.fillRect(220, 48, 18, 96); g.fillRect(62, 36, 196, 16);
            drawBulbsRow(g, 76, 34, 244, 34, 8, ['#fde047', '#f97316']);
            g.fillStyle = '#facc15'; g.fillRect(136, 98, 48, 18);
            g.fillStyle = '#e2e8f0'; g.beginPath(); g.arc(160, 74, 14, 0, Math.PI * 2); g.fill();
        },

        sr_hydra_dragon(g, W, H) {
            const bg = g.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#1e1b4b'); bg.addColorStop(0.55, '#9a3412'); bg.addColorStop(1, '#431407');
            g.fillStyle = bg; g.fillRect(0, 0, W, H);
            drawStarburst(g, W, H, 160, 90, '#f97316', 14);
            for (const [hx, hy, c] of [[86, 62, '#38bdf8'], [160, 46, '#ef4444'], [234, 62, '#facc15']]) {
                g.fillStyle = '#27272a'; g.beginPath(); g.arc(hx, hy, 22, 0, Math.PI * 2); g.fill();
                g.fillStyle = c; g.beginPath(); g.arc(hx, hy + 4, 9, 0, Math.PI * 2); g.fill();
            }
            g.fillStyle = '#f97316'; g.fillRect(0, 148, W, 32);
            drawBulbsRow(g, 16, 148, W - 16, 148, 12, ['#f97316', '#ef4444', '#facc15']);
        }
    };

    function drawCategoryPoster(g, W, H, def) {
        const accent = def.accent || '#f59e0b';
        const cat = def.cat || 'target';
        const rnd = rng32(def.id || def.name);
        const palMap = {
            fun: ['#3b0764', '#be185d'],
            target: ['#0f172a', '#7c2d12'],
            speed: ['#082f49', '#0e7490'],
            arcade: ['#1e1b4b', '#581c87'],
            boss: ['#18181b', '#7f1d1d']
        };
        const [c1, c2] = palMap[cat] || ['#0f172a', '#1e293b'];
        const bg = g.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, c1);
        bg.addColorStop(0.55, c2);
        bg.addColorStop(1, '#09090b');
        g.fillStyle = bg;
        g.fillRect(0, 0, W, H);

        drawStarburst(g, W, H, W * 0.5, H * 0.52, accent, 12);

        if (cat === 'target' || cat === 'boss') {
            // Tactical radar / perspective floor grid
            g.strokeStyle = rgba(accent, 0.25);
            g.lineWidth = 1;
            for (let y = 102; y <= H; y += 16) {
                g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
            }
            for (let x = -80; x <= W + 80; x += 48) {
                g.beginPath(); g.moveTo(W / 2, 92); g.lineTo(x, H); g.stroke();
            }
            if (cat === 'target') drawBullseye(g, 250, 74, 24, rnd() > 0.5 ? 'classic' : 'gold');
        } else if (cat === 'speed') {
            // Diagonal racing speed lines + checkered strip
            g.strokeStyle = rgba('#22d3ee', 0.35);
            g.lineWidth = 3;
            for (let i = 0; i < 8; i++) {
                const y = 18 + i * 20;
                g.beginPath(); g.moveTo(0, y); g.lineTo(120 + rnd() * 140, y - 12); g.stroke();
            }
            for (let i = 0; i < 16; i++) {
                g.fillStyle = i % 2 ? '#ffffff' : '#09090b';
                g.fillRect(i * 20, H - 14, 20, 14);
            }
        } else if (cat === 'arcade') {
            // CRT bezel + chasing marquee bulbs
            g.strokeStyle = rgba(accent, 0.55);
            g.lineWidth = 4;
            g.strokeRect(18, 18, W - 36, H - 36);
            drawBulbsRow(g, 28, 22, W - 28, 22, 10, ['#f472b6', '#22d3ee', '#facc15']);
        } else {
            // Carnival stars / bokeh sparkles
            for (let i = 0; i < 14; i++) {
                g.fillStyle = rgba(i % 2 ? '#fde047' : accent, 0.35);
                g.beginPath();
                g.arc(rnd() * W, rnd() * H, 2 + rnd() * 5, 0, Math.PI * 2);
                g.fill();
            }
        }

        // Gleaming center medallion with icon
        const cx = W * 0.5, cy = H * 0.48;
        const glow = g.createRadialGradient(cx, cy, 8, cx, cy, 62);
        glow.addColorStop(0, rgba(accent, 0.55));
        glow.addColorStop(1, rgba(accent, 0));
        g.fillStyle = glow;
        g.beginPath(); g.arc(cx, cy, 62, 0, Math.PI * 2); g.fill();

        g.fillStyle = 'rgba(15,23,42,0.85)';
        g.beginPath(); g.arc(cx, cy, 38, 0, Math.PI * 2); g.fill();
        g.strokeStyle = accent;
        g.lineWidth = 3.5;
        g.stroke();

        g.font = '38px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillStyle = '#ffffff';
        g.fillText(def.icon || '🎯', cx, cy + 3);
    }

    function renderThumb(def) {
        const W = 320, H = 180;
        const c = document.createElement('canvas');
        c.width = W;
        c.height = H;
        const g = c.getContext('2d');
        const accent = def.accent || '#f59e0b';

        if (CUSTOM[def.id]) {
            CUSTOM[def.id](g, W, H, def);
        } else {
            drawCategoryPoster(g, W, H, def);
        }

        // Vignette + glossy top rim + title ribbon so every card feels cohesive
        const vig = g.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.72);
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(1, 'rgba(0,0,0,0.48)');
        g.fillStyle = vig;
        g.fillRect(0, 0, W, H);

        g.strokeStyle = rgba(accent, 0.55);
        g.lineWidth = 2;
        g.strokeRect(1, 1, W - 2, H - 2);

        g.fillStyle = 'rgba(255,255,255,0.12)';
        g.fillRect(0, 0, W, 3);

        try {
            const webp = c.toDataURL('image/webp', 0.86);
            if (webp && webp.startsWith('data:image/webp')) return webp;
        } catch (_) {}
        return c.toDataURL('image/png');
    }

    BO.MinigameThumbs = {
        get(def) {
            if (!def || !def.id) return '';
            if (cache.has(def.id)) return cache.get(def.id);
            const url = renderThumb(def);
            cache.set(def.id, url);
            return url;
        }
    };
})(window);
