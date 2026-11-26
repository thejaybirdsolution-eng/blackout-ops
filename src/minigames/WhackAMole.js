/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Whack-a-Mole (shoot the moles!)
   A carnival tent with a tiered mole board. Three booths:
     Classic (3x3), Frenzy (4x4, multi-pops + hard hats), Mayhem (5x4, bombs).
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const L = BO.MinigameLib;
    const A = BO.MinigameArt;
    const K = BO.MGCourseKit;
    const { B, SFX, std, basic, clamp01 } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const lerp = (a, b, t) => a + (b - a) * t;

    function holeLayout(cols, rows) {
        const out = [];
        const spacing = cols >= 5 ? 1.55 : 1.75;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = (c - (cols - 1) / 2) * spacing + (r % 2 ? spacing * 0.25 : 0) * (cols >= 4 ? 1 : 0);
                out.push({ x, z: -4.6 - r * 1.75, y: 0.55 + r * 0.42, row: r, col: c });
            }
        }
        return out;
    }

    function buildTent(S, cfg) {
        // tent shell
        const stripes = L.canvasTex('tent-stripe:' + cfg.stripe, 512, 64, (g, w, h) => {
            for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#fef3c7' : cfg.stripe; g.fillRect(i * 32, 0, 32, h); }
        });
        stripes.wrapS = THREE.RepeatWrapping;
        stripes.repeat.set(4, 1);
        const wall = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 9, 48, 1, true), new THREE.MeshStandardMaterial({ map: stripes, side: THREE.BackSide, roughness: 0.85 }));
        wall.position.set(0, 4.5, -5);
        S.add(wall);
        S.solid(wall);
        const roofTex = L.canvasTex('tent-roof:' + cfg.stripe, 512, 512, (g, w, h) => {
            for (let i = 0; i < 24; i++) {
                g.fillStyle = i % 2 ? '#fef3c7' : cfg.stripe;
                g.beginPath(); g.moveTo(w / 2, h / 2);
                g.arc(w / 2, h / 2, w, i / 24 * Math.PI * 2, (i + 1) / 24 * Math.PI * 2);
                g.closePath(); g.fill();
            }
        });
        const roof = new THREE.Mesh(new THREE.ConeGeometry(15.2, 7, 48, 1, true), new THREE.MeshStandardMaterial({ map: roofTex, side: THREE.BackSide, roughness: 0.85 }));
        roof.position.set(0, 12.5, -5);
        S.add(roof);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 16, 8), std(0xd4d4d8, 0.4, 0.7));
        pole.position.set(0, 8, -16);
        S.add(pole);
        // floor boards
        const floor = new THREE.Mesh(new THREE.CircleGeometry(15, 48), new THREE.MeshStandardMaterial({ map: L.canvasTex('boards', 256, 256, (g, w, h) => {
            g.fillStyle = '#7c5a35'; g.fillRect(0, 0, w, h);
            for (let y = 0; y < h; y += 24) { g.fillStyle = y % 48 ? '#6b4423' : '#8b6234'; g.fillRect(0, y, w, 22); }
        }), roughness: 0.9 }));
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, 0.005, -5);
        S.add(floor);
        // string lights across the tent
        const pts = [];
        for (let i = 0; i < 8; i++) {
            const a = i / 8 * Math.PI * 2;
            pts.push(...A.sagPoints(V(0, 9.5, -5), V(Math.cos(a) * 14.5, 6.5, -5 + Math.sin(a) * 14.5), 12, 0.6));
        }
        const bulbs = A.bulbs(pts, [0xfde047, 0xfb7185, 0x60a5fa, 0x4ade80, 0xfdba74], 0.07);
        S.add(bulbs);
        A.animateBulbs(S, bulbs, 5, 'chase');
        // prize shelves with plush toys
        const plushCols = [0xf472b6, 0x60a5fa, 0xfacc15, 0xa78bfa, 0x4ade80, 0xfb923c];
        for (const side of [-1, 1]) {
            for (let shelf = 0; shelf < 3; shelf++) {
                const sh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 6), std(0x78350f, 0.8));
                sh.position.set(side * 10.5, 1.4 + shelf * 1.3, -6);
                S.add(sh);
                for (let p = 0; p < 6; p++) {
                    const toy = new THREE.Group();
                    const col = plushCols[(p + shelf + (side > 0 ? 2 : 0)) % plushCols.length];
                    const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), std(col, 0.95));
                    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), std(col, 0.95));
                    head.position.y = 0.36;
                    toy.add(body, head);
                    for (const ex of [-1, 1]) {
                        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), std(col, 0.95));
                        ear.position.set(ex * 0.13, 0.52, 0);
                        toy.add(ear);
                    }
                    toy.position.set(side * 10.5, 1.72 + shelf * 1.3, -8.4 + p * 0.95);
                    toy.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
                    S.add(toy);
                }
            }
        }
        // marquee
        const marquee = A.sign(cfg.title, 7, 1.3, { bg: '#4c0519', color: '#fde68a', borderColor: '#facc15', size: 0.58, glow: '#f59e0b' });
        marquee.position.set(0, 5.6, -12.4);
        S.add(marquee);
        const mPts = [];
        for (let i = 0; i <= 28; i++) {
            const t = i / 28;
            mPts.push(V(-3.7 + t * 7.4, 6.35, -12.3), V(-3.7 + t * 7.4, 4.85, -12.3));
        }
        const mb = A.bulbs(mPts, [0xfde047, 0xffffff], 0.06);
        S.add(mb);
        A.animateBulbs(S, mb, 8, 'chase');
        if (BO.Settings.getQualityPreset().pointLights) {
            const l1 = new THREE.PointLight(0xffd7a8, 1.4, 22, 1.6);
            l1.position.set(0, 7, -6);
            S.add(l1);
        }
    }

    function buildBoard(S, holes, cfg) {
        // tiered board: one step per row
        const rows = Math.max(...holes.map((h) => h.row)) + 1;
        const width = (cfg.cols >= 5 ? 1.55 : 1.75) * cfg.cols + 1.2;
        const boardMat = std(cfg.board, 0.6, 0.1);
        const trim = std(0xfacc15, 0.35, 0.4);
        for (let r = 0; r < rows; r++) {
            const y = 0.55 + r * 0.42;
            const z = -4.6 - r * 1.75;
            const step = new THREE.Mesh(new THREE.BoxGeometry(width, y, 1.75), boardMat);
            step.position.set(0, y / 2, z);
            step.receiveShadow = true;
            S.add(step);
            S.solid(step);
            const edge = new THREE.Mesh(new THREE.BoxGeometry(width, 0.06, 0.08), trim);
            edge.position.set(0, y + 0.01, z + 0.86);
            S.add(edge);
        }
        const sideGeo = new THREE.BoxGeometry(0.3, 0.55 + rows * 0.42 + 0.3, rows * 1.75 + 0.3);
        for (const s of [-1, 1]) {
            const side = new THREE.Mesh(sideGeo, std(0x9f1239, 0.6));
            side.position.set(s * (width / 2 + 0.15), (0.55 + rows * 0.42 + 0.3) / 2, -4.6 - (rows - 1) * 1.75 / 2);
            S.add(side);
        }
        const holeGeo = new THREE.CircleGeometry(0.42, 24);
        const rimGeo = new THREE.TorusGeometry(0.44, 0.06, 6, 24);
        for (const h of holes) {
            const hole = new THREE.Mesh(holeGeo, basic(0x0a0604));
            hole.rotation.x = -Math.PI / 2;
            hole.position.set(h.x, h.y + 0.012, h.z);
            S.add(hole);
            const rim = new THREE.Mesh(rimGeo, std(0x52525b, 0.4, 0.7));
            rim.rotation.x = Math.PI / 2;
            rim.position.set(h.x, h.y + 0.02, h.z);
            S.add(rim);
            // dirt mound tufts
            for (let i = 0; i < 5; i++) {
                const a = i / 5 * Math.PI * 2 + h.col;
                const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), std(0x5b3a1f, 1));
                tuft.scale.y = 0.5;
                tuft.position.set(h.x + Math.cos(a) * 0.5, h.y + 0.02, h.z + Math.sin(a) * 0.5);
                S.add(tuft);
            }
        }
    }

    const MOLE_MODES = {
        classic: {
            id: 'mole_classic', label: 'CLASSIC (3x3)', name: 'Classic Whack',
            desc: 'Original 3x3 carnival booth with an M1911 sidearm.',
            hudSub: 'Classic 3x3 • Gold moles pay 5x — chain fast whacks for QUICK bonuses',
            cols: 3, rows: 3, weapon: 'm1911', stripe: '#dc2626', board: 0x15803d, title: 'WHACK-A-MOLE',
            gap: [0.95, 0.42], life: [1.45, 0.72], multi: 0.25, gold: 0.06, bomb: 0, helmet: 0,
            stars: [2000, 4500, 7500, 11000]
        },
        frenzy: {
            id: 'mole_frenzy', label: 'FRENZY (4x4)', name: 'Mole Frenzy',
            desc: '16 holes and a full-auto G18. Hard-hat moles take 2 hits.',
            hudSub: 'Frenzy 4x4 • Hard-hat moles need two hits',
            cols: 4, rows: 4, weapon: 'glock18_auto', stripe: '#2563eb', board: 0x166534, title: 'MOLE FRENZY',
            gap: [0.8, 0.32], life: [1.35, 0.68], multi: 0.75, gold: 0.05, bomb: 0, helmet: 0.2,
            stars: [6000, 12000, 20000, 30000]
        },
        mayhem: {
            id: 'mole_mayhem', label: 'MAYHEM (5x4)', name: 'Mole Mayhem',
            desc: '20 holes packed with gold moles, hard hats & lit bombs.',
            hudSub: 'Mayhem 5x4 • Never shoot the bombs!',
            cols: 5, rows: 4, weapon: 'five_seven', stripe: '#7c3aed', board: 0x14532d, title: 'MOLE MAYHEM',
            gap: [0.7, 0.28], life: [1.3, 0.62], multi: 0.85, gold: 0.06, bomb: 0.16, helmet: 0.16,
            stars: [6000, 12000, 20000, 30000]
        }
    };
    const modeOf = (o) => (o && MOLE_MODES[o.moleMode]) ? o.moleMode : 'classic';

    MG.register({
        id: 'whack_a_mole', cat: 'target', order: 16,
        name: 'Whack-a-Mole', icon: '🐹', accent: '#f59e0b', badge: 'CLASSIC',
        tagline: 'Three carnival booths inside one tile: Classic, Frenzy & Mayhem.',
        desc: 'The flagship carnival booth shooter! Pick Classic (3x3 pistol), Frenzy (4x4 full-auto with hard hats), or Mayhem (5x4 with bombs). Moles pop, peek, and taunt from tiered holes under chasing marquee bulbs.',
        hudSub: 'Gold moles pay 5x • switch booth variants in the hub!',
        heroLabel: 'TARGET PRACTICE • WHACK-A-MOLE • 60 SECONDS',
        duration: 60, stars: MOLE_MODES.classic.stars, customMusic: true,
        standardWeapon: (o) => MOLE_MODES[modeOf(o)].weapon,
        standardOptic: 'iron',
        hubOptions: [{
            key: 'moleMode', label: 'VARIANT', default: 'classic',
            choices: Object.entries(MOLE_MODES).map(([k, v]) => ({ val: k, label: v.label, desc: v.desc }))
        }],
        variantKey: (o) => modeOf(o) === 'classic' ? '' : modeOf(o),
        variantLabel: (o) => MOLE_MODES[modeOf(o)].name.toUpperCase(),
        starsFor: (o) => MOLE_MODES[modeOf(o)].stars,
        map: {
            atmosphere: { skyTop: 0x1c1917, skyBottom: 0x44403c, fogColor: 0x2a1f1a, fogDensity: 0.012, sunColor: 0xffe0b2, sunIntensity: 0.8, sunPos: [6, 40, 12], hemiSky: 0xffe4c4, hemiGround: 0x3f2a14, hemiIntensity: 0.8 },
            boxes: [B(0, -0.5, -5, 40, 1, 40, 'wood_plank')],
            spawn: { x: 0, y: 0, z: 0.4, yaw: 0 }
        },
        build(S) {
            if (BO.MinigameAudio) {
                BO.MinigameAudio.start('pinball');
                S.animate((dt) => BO.MinigameAudio.tick(dt));
            }
            const cfg = MOLE_MODES[modeOf(S.opts)];
            const holes = holeLayout(cfg.cols, cfg.rows);
            S.data.cfg = cfg;
            S.data.holesMeta = holes;
            buildTent(S, cfg);
            K.booth(S, { roof: false, w: 3.6, wood: 0xbe123c, trim: 0x881337 });
            buildBoard(S, holes, cfg);
            S.data.holes = holes.map((h) => Object.assign({ busy: false }, h));
            S.data.lastWhack = -9;
            S.data.streakFast = 0;
        },
        schedule(S) {
            const cfg = S.data.cfg || MOLE_MODES[modeOf(S.opts)];
            const holes = S.data.holesMeta || holeLayout(cfg.cols, cfg.rows);
            const spawnMole = (S2, hi, kind, life, behaviour) => {
                const H = S2.data.holes;
                let idx = hi % H.length;
                for (let n = 0; n < H.length && H[idx].busy; n++) idx = (idx + 1) % H.length;
                if (H[idx].busy) return;
                const h = H[idx];
                h.busy = true;
                const free = () => { h.busy = false; };
                const isBomb = kind === 'bomb';
                const art = isBomb ? A.bomb() : A.mole(kind);
                const pos = V(h.x, h.y - 0.02, h.z);
                const tg = S2.addTarget(Object.assign(art, {
                    pos, yaw: A.yawTo(pos, V(0, 1.6, 0.4)),
                    points: kind === 'gold' ? 500 : kind === 'helmet' ? 200 : 100,
                    hp: kind === 'helmet' ? 2 : 1,
                    penalty: isBomb ? 300 : 0, penaltyLabel: 'KABOOM!', bonus: kind === 'gold',
                    life, inT: 0.16, outT: 0.16, appear: 'rise', riseDepth: 1.05, death: isBomb ? 'burst' : 'squash', deathColor: kind === 'gold' ? 0xfacc15 : isBomb ? 0xf97316 : 0x8b5a2b,
                    onTick: (t2) => {
                        if (!t2.alive) return;
                        const tt = t2.age;
                        if (behaviour === 'peek') t2.pivot.rotation.y = Math.sin(tt * 6) * 0.5;
                        else if (behaviour === 'taunt') { t2.pivot.rotation.z = Math.sin(tt * 18) * 0.12; t2.pivot.position.y += Math.abs(Math.sin(tt * 9)) * 0.06; }
                        else if (behaviour === 'bob' && t2.phase === 'hold') t2.pivot.position.y = -Math.max(0, Math.sin(tt * 5)) * 0.55;
                        if (art.eyes) for (const e of art.eyes) e.scale.y = (Math.sin(tt * 3.1) > 0.97) ? 0.15 : 1;
                        if (art.spark) art.spark.scale.setScalar(0.7 + Math.random() * 0.8);
                    },
                    onDamage: () => {
                        if (art.helmet) {
                            const hw = art.helmet.getWorldPosition(new THREE.Vector3());
                            art.helmet.visible = false;
                            BO.FX.spawnParticles(hw, 10, 0xfacc15, 4, 9, 0.5, 1.1);
                            SFX.ding(1.6);
                            S2.rt.popup(hw, 'CLANG!', '#facc15');
                        }
                    },
                    onKill: (t2) => {
                        free();
                        if (isBomb) { BO.Sound.playExplosion(0.5); return; }
                        SFX.bonk();
                        if (kind === 'gold') SFX.fanfare();
                        const head = t2.root.position.clone().add(V(0, 0.9, 0));
                        BO.FX.spawnParticles(head, 10, 0xfde047, 2.5, -1, 0.7, 0.9);
                        if (S2.t - S2.data.lastWhack < 0.45) {
                            S2.data.streakFast++;
                            S2.award(50 * S2.data.streakFast, head.clone().add(V(0, 0.4, 0)), 'QUICK!', '#38bdf8');
                        } else S2.data.streakFast = 0;
                        S2.data.lastWhack = S2.t;
                    },
                    onExpire: () => { free(); if (!isBomb && kind !== 'gold') SFX.boing(); }
                }));
                return tg;
            };
            K.ramp(S, { from: cfg.gap[0], to: cfg.gap[1], start: 0.2, curve: 1.15 }, (at, k, rng) => {
                const pops = 1 + (rng() < cfg.multi * k ? 1 : 0) + (rng() < cfg.multi * k * 0.5 ? 1 : 0);
                for (let p = 0; p < pops; p++) {
                    const roll = rng();
                    let kind = 'normal';
                    if (roll < cfg.gold) kind = 'gold';
                    else if (k > 0.15 && roll < cfg.gold + cfg.bomb) kind = 'bomb';
                    else if (k > 0.2 && roll < cfg.gold + cfg.bomb + cfg.helmet) kind = 'helmet';
                    const hi = Math.floor(rng() * holes.length);
                    const life = lerp(cfg.life[0], cfg.life[1], k) * (kind === 'gold' ? 0.65 : kind === 'helmet' ? 1.4 : kind === 'bomb' ? 1.3 : 1);
                    const bRoll = rng();
                    const behaviour = bRoll < 0.3 ? 'peek' : bRoll < 0.55 ? 'taunt' : (k > 0.5 && bRoll < 0.7) ? 'bob' : 'still';
                    S.at(at + p * 0.07, (S2) => spawnMole(S2, hi, kind, life, behaviour));
                }
            });
        },
        dispose() { if (BO.MinigameAudio) BO.MinigameAudio.stop(); }
    });
})(window);
