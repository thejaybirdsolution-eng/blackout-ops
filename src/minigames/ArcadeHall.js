/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Arcade Hall (part 1)
     1. Quickdraw       — holster, wait for the buzzer, draw. Reaction in ms.
     2. Wild Hunt       — an in-world arcade cabinet: retro hunting shooter
     3. Night Terrors   — an in-world arcade cabinet: zombies, aliens, monsters
   The cabinets render a 320x240 game onto the cabinet screen every frame.
   You shoot the real screen; the hit point is mapped into game pixels.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const L = BO.MinigameLib;
    const A = BO.MinigameArt;
    const K = BO.MGCourseKit;
    const F = BO.MGFigures;
    const { B, SFX, std, basic, clamp01, Ease, TAU } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const lerp = (a, b, t) => a + (b - a) * t;

    function lockPlayer(S, x, z, eye = 1.6) {
        BO.Player.rideState = { kind: 'minigame', pos: V(x, 0, z), roll: 0, pitch: 0, eye };
    }

    /* =====================================================================
       1. QUICKDRAW
    ===================================================================== */
    const OUTLAWS = ['Dusty Pete', 'Rattlesnake Jake', 'Calamity Rose', 'One-Eyed Hank', 'The Undertaker', 'Silver Sal', 'Mad Dog Morgan', 'Black Bart', 'Whiskey Wes', 'The Kid', 'Iron Belle', 'Doc Holloway', 'El Diablo', 'Ghost of Tombstone'];
    const DUEL_DIST = 11;
    const oppDrawMs = (round) => Math.max(240, 1100 - (round - 1) * 72);

    function buildDuelist(S, round) {
        const rng = L.mulberry32(round * 977);
        const pick = (a) => a[Math.floor(rng() * a.length) % a.length];
        const fig = F.human({
            skin: pick(F.SKINS), shirt: pick([0x7f1d1d, 0xe7e5e4, 0x1e3a8a, 0x3f6212, 0x44403c]), pants: pick([0x292524, 0x3f2a14]),
            coat: round % 3 === 0 ? 0x111111 : round % 3 === 1 ? 0x5b3a1e : null, hat: 'cowboy', hatColor: round >= 10 ? 0xe7e5e4 : pick([0x1c1917, 0x3f2a14, 0x0c0a09]),
            bandana: rng() < 0.5 ? pick([0xb91c1c, 0x111827]) : null, beard: rng() < 0.4 ? 0x3b2314 : null, gun: 'revolver', eyes: 'angry'
        });
        F.pose(fig, 'holster');
        const pos = V(0, 0, -DUEL_DIST);
        const tg = S.addTarget({ mesh: fig.root, hitMeshes: fig.hit, pos, yaw: 0, points: 0, life: 0, appear: 'none', inT: 0.01, death: 'none' });
        tg.fig = fig;
        tg.duelist = true;
        return tg;
    }

    function startRound(S) {
        const D = S.data;
        D.round++;
        if (D.opp) D.opp.remove();
        D.opp = buildDuelist(S, D.round);
        D.oppName = OUTLAWS[(D.round - 1) % OUTLAWS.length];
        D.oppMs = oppDrawMs(D.round);
        D.phase = 'ready';
        D.wait = 1.6 + S.rng() * 2.6;
        D.fallT = 0;
        const P = BO.Player;
        P.yaw = (S.rng() - 0.5) * 0.5;
        P.pitch = -0.38 - S.rng() * 0.12;
        MG.toast(`ROUND ${D.round} — ${D.oppName.toUpperCase()}`, '#fde68a');
        SFX.tone(220, 220, 0.5, 'triangle', 0.06);
    }

    function resolve(S, won, why) {
        const D = S.data;
        D.phase = won ? 'won' : 'lost';
        D.resT = 2.4;
        const P = BO.Player;
        if (won) {
            D.wins++;
            D.times.push(D.reactMs);
            D.best = Math.min(D.best, D.reactMs);
            const pts = 1000 + Math.max(0, 700 - D.reactMs) * 2;
            S.award(pts, D.opp.root.position.clone().add(V(0, 2.3, 0)), D.reactMs + ' ms', '#fde68a');
            S.bumpCombo();
            SFX.ding(1.1);
            BO.Player.cameraShake = Math.max(BO.Player.cameraShake, 0.01);
        } else {
            D.lives--;
            if (why !== 'foul') {
                // the outlaw fires
                const gun = D.opp.fig.parts.gun;
                const from = new THREE.Vector3();
                if (gun) gun.getWorldPosition(from);
                BO.FX.spawnTracer(from, BO.App.worldCamera.position.clone().add(V(0.2, -0.1, 0)), 0xff7a3d, 0.03, 0.1);
                BO.FX.spawnParticles(from, 8, 0xfbbf24, 3, 2, 0.15, 0.7);
                SFX.noise(0.2, 1300, 'bandpass', 0.8, 0.5);
                SFX.tone(140, 55, 0.25, 'triangle', 0.25);
                MG.flashScreen('rgba(185,28,28,0.5)');
                P.cameraShake = Math.max(P.cameraShake, 0.08);
            } else {
                SFX.buzzer();
                MG.flashScreen('rgba(250,204,21,0.25)');
            }
            S.breakCombo(why === 'foul' ? 'FOUL' : 'TOO SLOW');
            MG._showCountdown(why === 'foul' ? 'FOUL!' : 'TOO SLOW', '#f87171');
        }
    }

    MG.register({
        id: 'quickdraw', cat: 'arcade', order: 1,
        name: 'Pistol Quickdraw', icon: '🤠', accent: '#f59e0b',
        tagline: 'Holster. Buzzer. Draw.',
        desc: 'A Western duel at high noon. Your pistol sits in the holster while you wait. Fire before the buzzer and you foul. When it sounds, draw, aim up and hit the outlaw before he fires. Your reaction is timed in milliseconds. Each round the next gunslinger draws faster. Three lives.',
        heroLabel: 'ARCADE HALL • REFLEX DUEL', duration: 0,
        stars: [3, 6, 9, 12], starLabel: (th) => 'ROUND ' + th,
        standardWeapon: 'python_magnum', lockWeapon: true, weaponLabel: 'COLT PYTHON .357', weaponNote: 'Holstered until the buzzer', infiniteMag: true, forgivingMisses: true,
        formatBest: (b) => (b.extra ? b.extra.rounds + ' rounds • best ' + (b.extra.best < 9999 ? b.extra.best + 'ms' : '—') : Number(b.score).toLocaleString()),
        keys: [['WAIT', 'Hands off until the buzzer'], ['LMB', 'Draw & fire']],
        map: {
            atmosphere: { skyTop: 0x60a5fa, skyBottom: 0xfde68a, fogColor: 0xe8c48e, fogDensity: 0.01, sunColor: 0xfff0c2, sunIntensity: 2.0, sunPos: [10, 80, 5], hemiSky: 0xfef3c7, hemiGround: 0x8b5a2b, hemiIntensity: 0.9 },
            boxes: [B(0, -0.5, -10, 80, 1, 80, 'desert_sand')],
            spawn: { x: 0, y: 0, z: 0, yaw: 0 }
        },
        countdown: 2,
        build(S) {
            Object.assign(S.data, { round: 0, wins: 0, lives: 3, times: [], best: 9999, phase: 'intro', reactMs: 0 });
            lockPlayer(S, 0, 0);
            const woods = [0x8b5a2b, 0x7c4a1e, 0xa16207, 0x6b3f17, 0x92400e];
            const names = ['SALOON', 'BANK', 'SHERIFF', 'GENERAL STORE', 'HOTEL', 'BARBER', 'UNDERTAKER', 'LIVERY'];
            for (let i = 0; i < 8; i++) {
                const side = i % 2 ? 1 : -1;
                const z = 4 - Math.floor(i / 2) * 9;
                const h = 5 + (i % 3);
                const b = new THREE.Group();
                const body = new THREE.Mesh(new THREE.BoxGeometry(7, h, 8), std(woods[i % 5], 0.9));
                body.position.y = h / 2;
                const facade = new THREE.Mesh(new THREE.BoxGeometry(0.4, h + 1.6, 8), std(woods[(i + 2) % 5], 0.9));
                facade.position.set(-side * 3.6, (h + 1.6) / 2, 0);
                const porch = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 8), std(0x3f2a14, 0.9));
                porch.position.set(-side * 4.8, 3, 0);
                b.add(body, facade, porch);
                for (const pz of [-3.8, 0, 3.8]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3, 0.15), std(0x3f2a14, 0.9)); post.position.set(-side * 5.9, 1.5, pz); b.add(post); }
                const sg = A.sign(names[i], 4.6, 0.8, { bg: '#3f2a14', color: '#fde68a', borderColor: '#78350f', size: 0.5 });
                sg.position.set(-side * 3.82, h + 0.8, 0);
                sg.rotation.y = -side * Math.PI / 2;
                b.add(sg);
                b.position.set(side * 10, 0, z);
                S.add(b);
            }
            const bell = new THREE.Group();
            const tower = new THREE.Mesh(new THREE.BoxGeometry(3, 12, 3), std(0xe7e5e4, 0.9));
            tower.position.y = 6;
            const roofB = new THREE.Mesh(new THREE.ConeGeometry(2.4, 3, 4), std(0x7f1d1d, 0.8));
            roofB.position.y = 13.5;
            roofB.rotation.y = Math.PI / 4;
            bell.add(tower, roofB);
            bell.position.set(0, 0, -40);
            S.add(bell);
            // tumbleweed + hanging sign
            const tw = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 1), new THREE.MeshStandardMaterial({ color: 0xa16207, wireframe: true }));
            S.add(tw);
            let tt = 0;
            S.animate((dt) => {
                tt += dt;
                const x = ((tt * 3) % 30) - 15;
                tw.position.set(x, 0.45 + Math.abs(Math.sin(tt * 4)) * 0.4, -5);
                tw.rotation.z -= dt * 6;
            });
            for (let i = 0; i < 10; i++) { const r = A.rock(0.4 + (i % 3) * 0.3, 0x9a6a44); r.position.set((i % 2 ? 1 : -1) * (3 + i * 0.7), 0.1, -3 - i * 3); S.add(r); }
        },
        onGo(S) { startRound(S); },
        hideViewmodel(S) { return S.data.phase === 'ready' || S.data.phase === 'intro'; },
        blockFire(S) { return S.data.phase !== 'draw'; },
        update(S, dt, lib, state) {
            const D = S.data;
            const P = BO.Player;
            const trig = !!P.triggerHeld;
            const pressed = trig && !D._trig;
            D._trig = trig;
            if (state !== 'running') return;
            if (D.phase === 'ready') {
                D.wait -= dt;
                if (pressed) { D.reactMs = 0; resolve(S, false, 'foul'); return; }
                if (D.wait <= 0) {
                    D.phase = 'draw';
                    D.drawAt = performance.now();
                    SFX.tone(1320, 1320, 0.32, 'square', 0.16);
                    SFX.tone(2640, 2640, 0.2, 'sine', 0.06);
                    MG._showCountdown('DRAW!', '#fde68a');
                    P.fireCooldown = 0;
                }
            } else if (D.phase === 'draw') {
                const el = performance.now() - D.drawAt;
                if (el >= D.oppMs) {
                    F.pose(D.opp.fig, 'aimOne');
                    D.reactMs = Math.round(el);
                    resolve(S, false, 'slow');
                } else if (el > D.oppMs * 0.55) {
                    // he's going for the gun
                    const k = (el - D.oppMs * 0.55) / (D.oppMs * 0.45);
                    D.opp.fig.parts.armR.rotation.x = -k * Math.PI / 2;
                }
            } else if (D.phase === 'won' || D.phase === 'lost') {
                D.resT -= dt;
                if (D.phase === 'won' && D.opp) {
                    D.fallT += dt;
                    const k = clamp01(D.fallT / 0.6);
                    D.opp.fig.root.rotation.x = -Ease.outCubic(k) * Math.PI / 2;
                    D.opp.fig.parts.armR.rotation.x = -Math.PI / 2 * (1 - k);
                }
                if (D.resT <= 0) {
                    if (D.lives <= 0) MG.finish('GAME OVER', { color: '#f87171', delay: 1.2 });
                    else startRound(S);
                }
            }
        },
        onHit(S, ent, info) {
            const D = S.data;
            if (!ent.duelist || D.phase !== 'draw') return false;
            D.reactMs = Math.round(performance.now() - D.drawAt);
            S.hits++;
            if (info.hitbox === 'head') S.headshots++;
            resolve(S, true);
            return true;
        },
        hud(S) {
            const D = S.data;
            const lives = '❤'.repeat(Math.max(0, D.lives)) + '<s>' + '❤'.repeat(Math.max(0, 3 - D.lives)) + '</s>';
            const big = D.phase === 'won' ? `<div class="mgx-ms win">${D.reactMs}<small>MS</small></div>` : D.phase === 'lost' && D.reactMs ? `<div class="mgx-ms lose">${D.oppName.toUpperCase()} WAS FASTER<small>${D.oppMs} MS</small></div>` : '';
            const state = D.phase === 'ready' ? '<div class="mgx-chip">HANDS OFF… WAIT FOR THE BUZZER</div>' : D.phase === 'draw' ? '<div class="mgx-chip mgx-hot">DRAW!</div>' : '';
            return `<div class="mgx-duel-frame"></div><div class="mgx-duel"><div class="mgx-chip">ROUND <b>${D.round}</b></div><div class="mgx-chip">vs <b>${(D.oppName || '').toUpperCase()}</b> • ~${D.oppMs || 0}ms</div><div class="mgx-chip mgx-lives">${lives}</div><div class="mgx-chip">BEST <b>${D.best < 9999 ? D.best + 'ms' : '—'}</b></div></div>${state}${big}`;
        },
        scoreText(S) { return S.data.wins + ' WINS'; },
        result(S) {
            const D = S.data;
            const stars = this.stars.filter((th) => D.wins >= th).length;
            const avg = D.times.length ? Math.round(D.times.reduce((a, b) => a + b, 0) / D.times.length) : 0;
            return {
                score: S.score, stars, saveExtra: { rounds: D.wins, best: D.best },
                betterKey: D.wins,
                title: stars >= 4 ? 'FASTEST GUN IN THE WEST' : stars === 3 ? 'GUNSLINGER' : stars === 2 ? 'DEPUTY' : stars === 1 ? 'GREENHORN' : 'SIX FEET UNDER',
                stats: [['ROUNDS WON', D.wins], ['BEST DRAW', D.best < 9999 ? D.best + ' ms' : '—'], ['AVERAGE', avg ? avg + ' ms' : '—'], ['FASTEST BEATEN', D.wins ? oppDrawMs(D.wins) + ' ms' : '—'], ['HEADSHOTS', S.headshots], ['SHOTS', S.shots]],
                accuracy: S.shots ? S.shotHits / S.shots : 0,
                graph: D.times.length > 1 ? D.times.map((t) => 1000 - t) : null, graphLabel: 'REACTION PER ROUND (HIGHER = FASTER)',
                noGraph: D.times.length < 2,
                xp: Math.round(100 + D.wins * 60 + stars * 120)
            };
        }
    });

    /* =====================================================================
       ARCADE CABINET ENGINE
    ===================================================================== */
    const SW = 320, SH = 240, HORIZON = 112, GROUND = 236;
    const groundY = (z) => HORIZON + (GROUND - HORIZON) * z;

    function arcadeRoom(S, accent) {
        const carpet = L.canvasTex('arcade-carpet', 256, 256, (g, w, h) => {
            g.fillStyle = '#0b0620'; g.fillRect(0, 0, w, h);
            const cols = ['#f472b6', '#22d3ee', '#facc15', '#a3e635', '#a78bfa'];
            const rnd = L.mulberry32(42);
            for (let i = 0; i < 70; i++) {
                g.strokeStyle = cols[i % 5]; g.lineWidth = 3;
                const x = rnd() * w, y = rnd() * h, r = 4 + rnd() * 10;
                if (i % 3 === 0) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); }
                else if (i % 3 === 1) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + r, y + r * 0.6); g.lineTo(x + r * 2, y); g.stroke(); }
                else { g.strokeRect(x, y, r, r); }
            }
        });
        carpet.wrapS = carpet.wrapT = THREE.RepeatWrapping;
        carpet.repeat.set(6, 6);
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.MeshStandardMaterial({ map: carpet, roughness: 0.95 }));
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, 0.004, -4);
        S.add(floor);
        S.solid(floor);
        const wallM = std(0x110a24, 0.9);
        for (const [x, z, w, d] of [[0, -12, 24, 0.3], [-12, -4, 0.3, 24], [12, -4, 0.3, 24], [0, 8, 24, 0.3]]) {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 5, d), wallM);
            wall.position.set(x, 2.5, z);
            S.add(wall);
            S.solid(wall);
        }
        const ceil = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), std(0x0a0614, 0.9));
        ceil.rotation.x = Math.PI / 2;
        ceil.position.set(0, 5, -4);
        S.add(ceil);
        // neon tubes
        const neon = [0xf472b6, 0x22d3ee, 0xfacc15, 0xa78bfa];
        for (let i = 0; i < 4; i++) {
            const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 22, 8), basic(neon[i]));
            tube.rotation.z = Math.PI / 2;
            tube.position.set(0, 4.6, -10 + i * 5);
            S.add(tube);
        }
        // decorative cabinets with attract-mode glows
        const glows = [];
        for (let i = 0; i < 8; i++) {
            const side = i % 2 ? 1 : -1;
            const z = -9 + Math.floor(i / 2) * 3.2;
            const cab = new THREE.Group();
            const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.9, 0.9), std([0x1e1b4b, 0x7f1d1d, 0x14532d, 0x1e3a8a][i % 4], 0.6));
            body.position.y = 0.95;
            const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.55), new THREE.MeshBasicMaterial({ color: neon[i % 4] }));
            scr.position.set(0, 1.45, 0.46);
            scr.rotation.x = -0.15;
            const marq = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.25, 0.3), basic(neon[(i + 1) % 4]));
            marq.position.set(0, 1.98, 0.3);
            cab.add(body, scr, marq);
            cab.position.set(side * 9.5, 0, z);
            cab.rotation.y = -side * Math.PI / 2;
            S.add(cab);
            glows.push(scr);
        }
        S.animate(() => {
            const t = performance.now() * 0.001;
            glows.forEach((g, i) => { g.material.color.setHSL(((t * 0.1 + i * 0.17) % 1), 0.8, 0.45 + Math.sin(t * 3 + i) * 0.1); });
        });
        // posters
        for (let i = 0; i < 4; i++) {
            const p = A.sign(['HIGH SCORE!', 'PLAY', '1UP', 'BONUS'][i], 1.6, 2.2, { bg: '#1e1b4b', color: ['#f472b6', '#22d3ee', '#facc15', '#a3e635'][i], borderColor: accent, size: 0.2 });
            p.position.set(-5 + i * 3.4, 2.6, -11.8);
            S.add(p);
        }
        if (BO.Settings.getQualityPreset().pointLights) {
            const pl = new THREE.PointLight(0xc4b5fd, 1.2, 14, 1.6);
            pl.position.set(0, 4, -2);
            S.add(pl);
        }
    }

    function buildCabinet(S, cfg) {
        const g = new THREE.Group();
        const body = std(cfg.body || 0x1e1b4b, 0.5, 0.2);
        const trim = std(cfg.trim || 0x0f0a2e, 0.5);
        const W = 2.2, H = 1.65;
        // sides
        for (const s of [-1, 1]) {
            const side = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.0, 1.4), body);
            side.position.set(s * (W / 2 + 0.16), 1.5, -0.3);
            g.add(side);
            const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.125, 2.6, 0.1), basic(cfg.neon));
            stripe.position.set(s * (W / 2 + 0.16), 1.5, 0.35);
            g.add(stripe);
        }
        const back = new THREE.Mesh(new THREE.BoxGeometry(W + 0.44, 3.0, 0.1), trim);
        back.position.set(0, 1.5, -1.0);
        g.add(back);
        const base = new THREE.Mesh(new THREE.BoxGeometry(W + 0.44, 0.9, 1.2), body);
        base.position.set(0, 0.45, -0.25);
        g.add(base);
        const panel = new THREE.Mesh(new THREE.BoxGeometry(W + 0.2, 0.12, 0.6), trim);
        panel.position.set(0, 0.98, 0.15);
        panel.rotation.x = 0.25;
        g.add(panel);
        for (let i = 0; i < 4; i++) {
            const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 12), basic([0xef4444, 0xfacc15, 0x22c55e, 0x3b82f6][i]));
            btn.position.set(-0.4 + i * 0.27, 1.06, 0.18);
            btn.rotation.x = 0.25;
            g.add(btn);
        }
        const bezel = new THREE.Mesh(new THREE.BoxGeometry(W + 0.2, H + 0.2, 0.08), std(0x050505, 0.4));
        bezel.position.set(0, 1.0 + H / 2 + 0.12, -0.42);
        bezel.rotation.x = -0.08;
        g.add(bezel);
        // the screen (game canvas)
        const canvas = document.createElement('canvas');
        canvas.width = SW; canvas.height = SH;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        const tex = new THREE.CanvasTexture(canvas);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.LinearFilter;
        if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
        tex.userData.mgOwned = true;
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: tex }));
        screen.position.set(0, 1.0 + H / 2 + 0.12, -0.37);
        screen.rotation.x = -0.08;
        g.add(screen);
        // marquee
        const marq = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.3, 0.5), new THREE.MeshBasicMaterial({ map: L.signTex(cfg.title, { w: 512, h: 112, bg: cfg.marqBg || '#0b0620', color: cfg.marqColor || '#fde68a', borderColor: '#' + cfg.neon.toString(16).padStart(6, '0'), glow: cfg.marqColor || '#fde68a', size: 0.55 }) }));
        marq.position.set(0, 3.0 - 0.1, -0.2);
        g.add(marq);
        const marqBox = new THREE.Mesh(new THREE.BoxGeometry(W + 0.44, 0.6, 0.7), body);
        marqBox.position.set(0, 2.9, -0.6);
        g.add(marqBox);
        g.position.set(0, 0, -2.2);
        S.add(g);
        g.updateMatrixWorld(true);
        screen.userData.entity = { alive: true, mgTarget: false, noBlood: true, isScreen: true };
        screen.userData.hitbox = 'torso';
        return { group: g, screen, canvas, ctx, tex, W, H };
    }

    /** Arcade-shooter world state shared by both cabinets. */
    function newGame(S, cab) {
        return { cab, objs: [], pops: [], flashes: [], t: 0, lives: 3, over: false, shake: 0, idn: 1, scroll: 0 };
    }

    function screenHit(S, info) {
        const cab = S.data.cab;
        const local = cab.screen.worldToLocal(info.pt.clone());
        const u = local.x / cab.W + 0.5, v = 0.5 - local.y / cab.H;
        return { x: u * SW, y: v * SH };
    }

    function pop(game, x, y, text, color) { game.pops.push({ x, y, text, color, t: 0 }); }

    function drawHud(g, game, S, title, col) {
        g.fillStyle = 'rgba(0,0,0,0.55)';
        g.fillRect(0, 0, SW, 14);
        g.font = 'bold 9px monospace';
        g.textBaseline = 'top';
        g.fillStyle = col;
        g.fillText('SCORE ' + String(S.score).padStart(6, '0'), 4, 3);
        g.fillStyle = '#ffffff';
        const left = Math.max(0, Math.ceil((MG.def.duration || 60) - S.t));
        g.fillText('TIME ' + String(left).padStart(2, '0'), 140, 3);
        g.fillStyle = '#f87171';
        g.fillText('♥'.repeat(Math.max(0, game.lives)), 250, 3);
        g.fillStyle = 'rgba(255,255,255,0.5)';
        g.fillText(title, 4, SH - 11);
    }

    function crt(g) {
        g.fillStyle = 'rgba(0,0,0,0.18)';
        for (let y = 0; y < SH; y += 2) g.fillRect(0, y, SW, 1);
        const v = g.createRadialGradient(SW / 2, SH / 2, SH * 0.35, SW / 2, SH / 2, SH * 0.8);
        v.addColorStop(0, 'rgba(0,0,0,0)');
        v.addColorStop(1, 'rgba(0,0,0,0.45)');
        g.fillStyle = v;
        g.fillRect(0, 0, SW, SH);
    }

    /**
     * Registers an arcade cabinet game.
     * cfg: { id, order, name, icon, accent, tagline, desc, title, neon, body, marqColor,
     *        types: { kind: { draw(g, o, t), hit(o) -> {w,h,cy}, points, hp, penalty, onReach } },
     *        drawBg(g, game, t), schedule(S, spawn), lifeLossOnReach }
     */
    function cabinet(cfg) {
        MG.register({
            id: cfg.id, cat: 'arcade', order: cfg.order,
            name: cfg.name, icon: cfg.icon, accent: cfg.accent, tagline: cfg.tagline, desc: cfg.desc,
            heroLabel: 'ARCADE HALL • CABINET • 60 SECONDS', duration: 60, stars: cfg.stars,
            standardWeapon: 'm1911', lockWeapon: true, weaponLabel: 'LIGHT GUN', weaponNote: 'Bottomless light gun • aim at the screen', infiniteMag: true, tracerColor: 0x111111,
            keys: [['LMB', 'Shoot the screen'], ['R', 'Retry from results']],
            map: {
                atmosphere: { skyTop: 0x05010f, skyBottom: 0x0b0620, fogColor: 0x0b0620, fogDensity: 0.02, sunColor: 0xc4b5fd, sunIntensity: 0.3, sunPos: [0, 50, 10], hemiSky: 0xa78bfa, hemiGround: 0x1e1b4b, hemiIntensity: 1.0 },
                boxes: [B(0, -0.5, -4, 30, 1, 30, 'concrete')],
                spawn: { x: 0, y: 0, z: 0.9, yaw: 0 }
            },
            countdown: 3,
            build(S) {
                arcadeRoom(S, cfg.accentHex || cfg.accent);
                S.data.cab = buildCabinet(S, cfg);
                S.data.game = newGame(S, S.data.cab);
                lockPlayer(S, 0, 0.9, 1.62);
                BO.Player.pitch = 0.09;
                this.draw(S, 0);
            },
            schedule(S) {
                const spawn = (at, kind, o) => S.at(at, (S2) => {
                    const game = S2.data.game;
                    const T = cfg.types[kind];
                    game.objs.push(Object.assign({ id: game.idn++, kind, t: 0, hp: T.hp || 1, x: 160, y: 180, z: 0.5, vx: 0, vy: 0, dead: false }, o));
                    if (!T.penalty && !T.bonus) S2.spawned++;
                });
                cfg.schedule(S, spawn, S.rng);
            },
            extraTargets(S, pool) { if (S.data.cab) pool.push(S.data.cab.screen); },
            update(S, dt, lib, state) {
                const game = S.data.game;
                if (!game) return;
                const run = state === 'running';
                if (run) {
                    game.t += dt;
                    game.scroll += dt;
                    for (const o of game.objs) {
                        if (o.dead) { o.deadT = (o.deadT || 0) + dt; continue; }
                        o.t += dt;
                        const T = cfg.types[o.kind];
                        if (T.move) T.move(o, dt, game);
                        else { o.x += o.vx * dt; o.y += o.vy * dt; }
                        if (o.approach) {
                            o.z = Math.min(1.02, o.z + o.approach * dt);
                            if (!o.fly) o.y = groundY(o.z);
                            if (o.z >= 1.0) {
                                o.dead = true; o.reached = true; o.deadT = 0.6;
                                if (!T.penalty) {
                                    if (cfg.lifeLoss) { game.lives--; game.shake = 0.5; SFX.tone(110, 50, 0.4, 'sawtooth', 0.2); pop(game, o.x, 120, T.reachText || 'OUCH!', '#f87171'); MG.flashScreen('rgba(220,38,38,0.25)'); }
                                    else { S.award(-(T.reachPenalty || 200)); pop(game, o.x, 120, T.reachText || 'ESCAPED', '#f87171'); game.shake = 0.4; SFX.tone(160, 70, 0.35, 'sawtooth', 0.15); }
                                    S.expired++;
                                    S.breakCombo(T.reachText || 'TOO SLOW');
                                }
                            }
                        }
                        const off = o.x < -60 || o.x > SW + 60 || o.y < -60 || o.y > SH + 80;
                        if (off && o.t > 0.5) {
                            o.dead = true; o.deadT = 1;
                            if (!T.penalty && !T.bonus) { S.expired++; S.breakCombo('TOO SLOW'); }
                        }
                    }
                    game.objs = game.objs.filter((o) => !(o.dead && o.deadT > 0.5));
                    if (cfg.lifeLoss && game.lives <= 0 && !game.over) { game.over = true; MG.finish('GAME OVER', { color: '#f87171' }); }
                }
                game.shake = Math.max(0, game.shake - dt);
                for (const p of game.pops) p.t += dt;
                game.pops = game.pops.filter((p) => p.t < 0.9);
                for (const f of game.flashes) f.t += dt;
                game.flashes = game.flashes.filter((f) => f.t < 0.12);
                this.draw(S, dt);
            },
            draw(S) {
                const cab = S.data.cab, game = S.data.game;
                const g = cab.ctx;
                g.save();
                if (game.shake > 0) g.translate((Math.random() - 0.5) * 6 * game.shake * 2, (Math.random() - 0.5) * 6 * game.shake * 2);
                cfg.drawBg(g, game, game.t);
                const objs = game.objs.slice().sort((a, b) => a.z - b.z);
                for (const o of objs) {
                    const T = cfg.types[o.kind];
                    const s = (T.size || 24) * (0.35 + o.z * 1.1);
                    g.save();
                    g.translate(Math.round(o.x), Math.round(o.y));
                    if (o.dead && !o.reached) {
                        g.globalAlpha = Math.max(0, 1 - o.deadT * 2.2);
                        g.translate(0, o.deadT * 30);
                        g.rotate(o.deadT * 3 * (o.vx >= 0 ? 1 : -1));
                    }
                    if (o.flash > 0) { o.flash -= 1 / 60; g.filter = 'brightness(3)'; }
                    const flip = (o.vx || 0) > 0 ? -1 : 1;
                    g.scale(flip, 1);
                    T.draw(g, s, o, game.t);
                    g.restore();
                }
                if (cfg.drawFg) cfg.drawFg(g, game, game.t);
                for (const f of game.flashes) {
                    g.fillStyle = `rgba(255,255,255,${0.9 - f.t * 7})`;
                    g.beginPath(); g.arc(f.x, f.y, 3 + f.t * 40, 0, TAU); g.fill();
                }
                g.font = 'bold 10px monospace';
                g.textAlign = 'center';
                for (const p of game.pops) {
                    g.fillStyle = p.color;
                    g.globalAlpha = 1 - p.t / 0.9;
                    g.fillText(p.text, p.x, p.y - p.t * 22);
                }
                g.globalAlpha = 1;
                g.textAlign = 'left';
                drawHud(g, game, S, cfg.title, cfg.hudCol || '#fde68a');
                if (MG.state === 'countdown') {
                    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, 90, SW, 50);
                    g.fillStyle = Math.floor(performance.now() / 400) % 2 ? '#fde68a' : '#f472b6';
                    g.font = 'bold 18px monospace'; g.textAlign = 'center';
                    g.fillText('GET READY!', SW / 2, 106);
                    g.textAlign = 'left';
                } else if (MG.state === 'finish' || MG.state === 'results') {
                    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 90, SW, 50);
                    g.fillStyle = '#f87171'; g.font = 'bold 20px monospace'; g.textAlign = 'center';
                    g.fillText(game.over ? 'GAME OVER' : 'TIME UP', SW / 2, 104);
                    g.textAlign = 'left';
                }
                g.restore();
                crt(g);
                cab.tex.needsUpdate = true;
            },
            onHit(S, ent, info) {
                if (!ent.isScreen || MG.state !== 'running') return false;
                const game = S.data.game;
                const p = screenHit(S, info);
                game.flashes.push({ x: p.x, y: p.y, t: 0 });
                let best = null;
                for (const o of game.objs) {
                    if (o.dead) continue;
                    const T = cfg.types[o.kind];
                    const s = (T.size || 24) * (0.35 + o.z * 1.1);
                    const hb = T.hit ? T.hit(o, s) : { w: s, h: s * 0.8, cy: -s * 0.4 };
                    const cx = o.x + (hb.cx || 0) * ((o.vx || 0) > 0 ? -1 : 1);
                    const cy = o.y + hb.cy;
                    if (Math.abs(p.x - cx) <= hb.w / 2 + 2 && Math.abs(p.y - cy) <= hb.h / 2 + 2) {
                        if (!best || o.z > best.z) best = o;
                    }
                }
                if (!best) {
                    if (MG.pendingShot) MG.pendingShot.hit = false;
                    SFX.tone(300, 200, 0.05, 'square', 0.05);
                    return true;
                }
                const T = cfg.types[best.kind];
                if (T.weak && !T.weak(best, p)) {
                    best.flash = 0.05;
                    SFX.tone(500, 300, 0.05, 'square', 0.08);
                    pop(game, p.x, p.y, 'TINK', '#94a3b8');
                    return true;
                }
                if (T.penalty) {
                    best.dead = true; best.deadT = 0;
                    S.penalties++;
                    S.award(-T.penalty);
                    S.breakCombo(T.penaltyText || 'WRONG TARGET');
                    pop(game, best.x, best.y - 30, '-' + T.penalty + ' ' + (T.penaltyText || ''), '#f87171');
                    SFX.buzzer();
                    MG.flashScreen('rgba(220,38,38,0.22)');
                    return true;
                }
                best.hp--;
                best.flash = 0.06;
                if (best.hp > 0) {
                    S.hits++;
                    SFX.tone(700, 500, 0.06, 'square', 0.1);
                    pop(game, p.x, p.y, 'HIT', '#e2e8f0');
                    if (T.onDamage) T.onDamage(best, game);
                    return true;
                }
                best.dead = true; best.deadT = 0;
                S.hits++;
                if (!T.bonus) S.kills++;
                S.bumpCombo();
                const mult = S.comboMult;
                const pts = Math.round((T.points || 100) * (0.8 + best.z * 0.5) * mult);
                S.award(pts);
                pop(game, best.x, best.y - 30, '+' + pts + (mult > 1 ? ' x' + mult.toFixed(1).replace('.0', '') : ''), T.bonus ? '#facc15' : (cfg.hudCol || '#fde68a'));
                if (T.die) T.die(best, game); else { SFX.tone(880, 220, 0.18, 'square', 0.1); SFX.noise(0.1, 1200, 'bandpass', 1, 0.2); }
                return true;
            },
            dispose(S) { /* canvas texture is mgOwned and released with the scene */ }
        });
    }

    /* -------------------------------------------------- WILD HUNT sprites */
    const C = (g, c) => { g.fillStyle = c; };
    const ell = (g, x, y, rx, ry) => { g.beginPath(); g.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, TAU); g.fill(); };
    const rect = (g, x, y, w, h) => g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
    const legs = (g, s, t, xs, top, len, w, col, speed = 14) => {
        C(g, col);
        xs.forEach((x, i) => { const sw = Math.sin(t * speed + i * 1.7) * s * 0.08; rect(g, x * s + sw, top, w, len); });
    };

    const HUNT_TYPES = {
        deer: {
            size: 34, points: 100, hit: (o, s) => ({ w: s * 1.1, h: s * 0.9, cy: -s * 0.55 }),
            draw(g, s, o, t) {
                legs(g, s, o.t, [-0.35, -0.22, 0.2, 0.33], -s * 0.42, s * 0.42, s * 0.07, '#5b3a1e');
                C(g, '#a0662d'); ell(g, 0, -s * 0.55, s * 0.5, s * 0.2);
                C(g, '#e8c9a0'); ell(g, 0.05 * s, -s * 0.46, s * 0.32, s * 0.08);
                C(g, '#a0662d'); rect(g, -s * 0.55, -s * 0.95, s * 0.12, s * 0.4);
                ell(g, -s * 0.58, -s * 0.98, s * 0.13, s * 0.08);
                C(g, '#111'); rect(g, -s * 0.66, -s * 1.0, s * 0.04, s * 0.04);
                C(g, '#fff'); ell(g, s * 0.5, -s * 0.62, s * 0.06, s * 0.05);
                if (o.buck) { C(g, '#e7d3b0'); g.fillRect(-s * 0.56, -s * 1.3, 2, s * 0.28); g.fillRect(-s * 0.66, -s * 1.22, s * 0.12, 2); g.fillRect(-s * 0.5, -s * 1.25, s * 0.12, 2); }
            }
        },
        rabbit: {
            size: 16, points: 180, hit: (o, s) => ({ w: s * 1.2, h: s * 1.2, cy: -s * 0.55 }),
            move(o, dt) { o.x += o.vx * dt; o.hop = Math.abs(Math.sin(o.t * 6)) * 14 * (0.4 + o.z); o.y = groundY(o.z) - o.hop; },
            draw(g, s) {
                C(g, '#9ca3af'); ell(g, 0, -s * 0.45, s * 0.5, s * 0.35);
                ell(g, -s * 0.45, -s * 0.75, s * 0.25, s * 0.22);
                rect(g, -s * 0.5, -s * 1.35, s * 0.1, s * 0.5); rect(g, -s * 0.36, -s * 1.3, s * 0.1, s * 0.45);
                C(g, '#fff'); ell(g, s * 0.5, -s * 0.5, s * 0.14, s * 0.14);
                C(g, '#111'); rect(g, -s * 0.58, -s * 0.8, 1.5, 1.5);
            }
        },
        duck: {
            size: 20, points: 220, hit: (o, s) => ({ w: s * 1.3, h: s * 0.9, cy: -s * 0.1 }),
            move(o, dt) { o.x += o.vx * dt; o.y += o.vy * dt; o.vy += Math.sin(o.t * 3 + o.id) * 40 * dt; },
            draw(g, s, o) {
                const flap = Math.sin(o.t * 18) > 0;
                C(g, '#78350f'); ell(g, 0, 0, s * 0.55, s * 0.28);
                C(g, '#15803d'); ell(g, -s * 0.55, -s * 0.22, s * 0.22, s * 0.2);
                C(g, '#fff'); rect(g, -s * 0.45, -s * 0.06, s * 0.2, 2);
                C(g, '#f59e0b'); rect(g, -s * 0.92, -s * 0.22, s * 0.2, s * 0.1);
                C(g, '#111'); rect(g, -s * 0.62, -s * 0.28, 1.5, 1.5);
                C(g, '#a16207');
                g.beginPath(); g.moveTo(-s * 0.1, -s * 0.05); g.lineTo(s * 0.35, flap ? -s * 0.75 : s * 0.45); g.lineTo(s * 0.4, -s * 0.05); g.fill();
            }
        },
        boar: {
            size: 30, points: 260, hp: 2, hit: (o, s) => ({ w: s * 1.1, h: s * 0.7, cy: -s * 0.35 }),
            draw(g, s, o) {
                legs(g, s, o.t, [-0.3, -0.15, 0.15, 0.3], -s * 0.2, s * 0.2, s * 0.08, '#292524', 20);
                C(g, '#44403c'); ell(g, 0, -s * 0.38, s * 0.5, s * 0.25);
                C(g, '#57534e'); ell(g, -s * 0.48, -s * 0.36, s * 0.22, s * 0.18);
                C(g, '#f9a8d4'); ell(g, -s * 0.68, -s * 0.33, s * 0.07, s * 0.07);
                C(g, '#fff'); rect(g, -s * 0.66, -s * 0.28, s * 0.1, 2);
                C(g, '#111'); for (let i = 0; i < 5; i++) rect(g, -s * 0.2 + i * s * 0.1, -s * 0.66, 2, s * 0.08);
            }
        },
        bear: {
            size: 46, points: 600, hp: 4, reachText: 'MAULED!', reachPenalty: 500, hit: (o, s) => ({ w: s * 1.0, h: s * 0.95, cy: -s * 0.5 }),
            move(o, dt) { o.x += Math.sin(o.t * 0.8) * 8 * dt; },
            onDamage(o) { o.approach *= 0.85; },
            draw(g, s, o) {
                legs(g, s, o.t, [-0.32, -0.12, 0.12, 0.32], -s * 0.3, s * 0.3, s * 0.13, '#2b1a0c', 6);
                C(g, '#4a2c12'); ell(g, 0, -s * 0.55, s * 0.48, s * 0.36);
                C(g, '#5b3a1e'); ell(g, 0, -s * 0.92, s * 0.25, s * 0.22);
                ell(g, -s * 0.18, -s * 1.1, s * 0.08, s * 0.08); ell(g, s * 0.18, -s * 1.1, s * 0.08, s * 0.08);
                C(g, '#c69c6d'); ell(g, 0, -s * 0.84, s * 0.12, s * 0.09);
                C(g, '#111'); rect(g, -s * 0.1, -s * 0.98, 2, 2); rect(g, s * 0.07, -s * 0.98, 2, 2); rect(g, -s * 0.03, -s * 0.88, 3, 2);
                if (o.hp <= 2) { C(g, '#fff'); rect(g, -s * 0.06, -s * 0.8, 2, 3); rect(g, s * 0.03, -s * 0.8, 2, 3); }
            }
        },
        pheasant: {
            size: 22, points: 1200, bonus: true, hit: (o, s) => ({ w: s * 1.4, h: s * 0.9, cy: -s * 0.1 }),
            move(o, dt) { o.x += o.vx * dt; o.y += o.vy * dt; o.vy -= 10 * dt; },
            draw(g, s, o) {
                const flap = Math.sin(o.t * 22) > 0;
                C(g, '#d97706'); ell(g, 0, 0, s * 0.5, s * 0.25);
                C(g, '#b45309'); g.fillRect(s * 0.3, -s * 0.06, s * 0.8, s * 0.1);
                C(g, '#dc2626'); ell(g, -s * 0.5, -s * 0.2, s * 0.15, s * 0.15);
                C(g, '#facc15'); g.beginPath(); g.moveTo(0, 0); g.lineTo(s * 0.3, flap ? -s * 0.7 : s * 0.4); g.lineTo(s * 0.35, 0); g.fill();
            },
            die(o, game) { SFX.fanfare(); }
        },
        hiker: {
            size: 30, penalty: 400, penaltyText: 'HIKER!', hit: (o, s) => ({ w: s * 0.5, h: s * 1.1, cy: -s * 0.55 }),
            draw(g, s, o) {
                legs(g, s, o.t, [-0.08, 0.08], -s * 0.45, s * 0.45, s * 0.1, '#1e3a8a', 8);
                C(g, '#16a34a'); rect(g, -s * 0.16, -s * 0.9, s * 0.32, s * 0.48);
                C(g, '#78350f'); rect(g, s * 0.1, -s * 0.9, s * 0.16, s * 0.38);
                C(g, '#f1c27d'); ell(g, 0, -s * 1.02, s * 0.12, s * 0.12);
                C(g, '#f97316'); rect(g, -s * 0.16, -s * 1.16, s * 0.32, s * 0.08);
            }
        },
        cow: {
            size: 36, penalty: 300, penaltyText: 'NOT A DEER!', hit: (o, s) => ({ w: s * 1.1, h: s * 0.8, cy: -s * 0.5 }),
            draw(g, s, o) {
                legs(g, s, o.t, [-0.35, -0.2, 0.2, 0.35], -s * 0.35, s * 0.35, s * 0.08, '#f5f5f4', 4);
                C(g, '#f5f5f4'); ell(g, 0, -s * 0.55, s * 0.5, s * 0.24);
                C(g, '#111'); ell(g, -s * 0.15, -s * 0.6, s * 0.12, s * 0.09); ell(g, s * 0.22, -s * 0.5, s * 0.1, s * 0.08);
                C(g, '#f5f5f4'); ell(g, -s * 0.55, -s * 0.66, s * 0.15, s * 0.13);
                C(g, '#f9a8d4'); ell(g, -s * 0.65, -s * 0.6, s * 0.08, s * 0.06);
            }
        }
    };

    function huntBg(g, game, t) {
        const sky = g.createLinearGradient(0, 0, 0, HORIZON);
        sky.addColorStop(0, '#2563eb'); sky.addColorStop(1, '#fcd9a8');
        g.fillStyle = sky; g.fillRect(0, 0, SW, HORIZON + 2);
        g.fillStyle = '#fef3c7'; ell(g, 250, 40, 16, 16);
        g.fillStyle = 'rgba(255,255,255,0.85)';
        for (let i = 0; i < 4; i++) { const x = ((i * 97 + t * 6) % (SW + 60)) - 30; ell(g, x, 24 + i * 9, 18, 5); ell(g, x + 12, 22 + i * 9, 12, 5); }
        // mountains
        g.fillStyle = '#64748b';
        g.beginPath(); g.moveTo(0, HORIZON);
        for (let x = 0; x <= SW; x += 20) g.lineTo(x, HORIZON - 30 - Math.abs(Math.sin(x * 0.03)) * 30 - Math.sin(x * 0.11) * 6);
        g.lineTo(SW, HORIZON); g.fill();
        g.fillStyle = '#e2e8f0';
        for (let x = 20; x < SW; x += 60) { g.beginPath(); g.moveTo(x - 8, HORIZON - 48); g.lineTo(x, HORIZON - 60 + Math.sin(x) * 4); g.lineTo(x + 8, HORIZON - 48); g.fill(); }
        // far pines
        g.fillStyle = '#14532d';
        for (let x = 0; x < SW; x += 9) { const h = 12 + (x * 7) % 9; g.beginPath(); g.moveTo(x, HORIZON + 2); g.lineTo(x + 4, HORIZON - h); g.lineTo(x + 8, HORIZON + 2); g.fill(); }
        const field = g.createLinearGradient(0, HORIZON, 0, SH);
        field.addColorStop(0, '#4d7c0f'); field.addColorStop(1, '#365314');
        g.fillStyle = field; g.fillRect(0, HORIZON + 2, SW, SH - HORIZON);
        g.fillStyle = 'rgba(0,0,0,0.12)';
        for (let i = 0; i < 6; i++) rect(g, 0, groundY(0.15 + i * 0.16), SW, 1);
    }
    function huntFg(g, game, t) {
        g.fillStyle = '#1a2e05';
        for (let x = -4; x < SW + 4; x += 6) { const h = 10 + ((x * 13) % 7); g.beginPath(); g.moveTo(x, SH); g.lineTo(x + 3 + Math.sin(t * 2 + x) * 1.5, SH - h); g.lineTo(x + 6, SH); g.fill(); }
        g.fillStyle = '#0f1f04';
        g.beginPath(); g.moveTo(0, SH); g.lineTo(0, SH - 70); g.lineTo(14, SH - 40); g.lineTo(6, SH - 40); g.lineTo(22, SH - 10); g.lineTo(28, SH); g.fill();
        g.beginPath(); g.moveTo(SW, SH); g.lineTo(SW, SH - 80); g.lineTo(SW - 16, SH - 46); g.lineTo(SW - 6, SH - 46); g.lineTo(SW - 24, SH - 12); g.lineTo(SW - 30, SH); g.fill();
    }

    cabinet({
        id: 'cab_wild_hunt', order: 2, name: 'Wild Hunt', icon: '🦌', accent: '#65a30d',
        tagline: 'Retro hunting shooter in a real cabinet',
        desc: 'Walk up to the Wild Hunt cabinet and shoot the screen. Deer run across the meadow, rabbits hop, ducks burst out of the grass, boars charge and bears lumber towards you and take four hits. A golden pheasant is worth a fortune. Do not shoot hikers or cows.',
        title: 'WILD HUNT', neon: 0x84cc16, body: 0x14532d, trim: 0x052e16, marqColor: '#fde68a', hudCol: '#fde68a',
        stars: [4000, 8000, 13000, 19000],
        types: HUNT_TYPES, drawBg: huntBg, drawFg: huntFg, lifeLoss: false,
        schedule(S, spawn, rng) {
            K.ramp(S, { from: 1.3, to: 0.45, start: 0.5, end: 57 }, (at, k, r) => {
                const roll = r();
                const left = r() < 0.5;
                const z = 0.15 + r() * 0.6;
                if (roll < 0.36) spawn(at, 'deer', { x: left ? -30 : SW + 30, z, y: groundY(z), vx: (left ? 1 : -1) * (40 + k * 60 + r() * 20) * (0.5 + z), buck: r() < 0.3 });
                else if (roll < 0.55) spawn(at, 'rabbit', { x: left ? -20 : SW + 20, z: 0.5 + r() * 0.45, vx: (left ? 1 : -1) * (55 + k * 50) });
                else if (roll < 0.78) { const sx = 40 + r() * 240; spawn(at, 'duck', { x: sx, y: groundY(0.6), z: 0.5, vx: (r() - 0.5) * 120, vy: -(50 + k * 50 + r() * 20), fly: true }); }
                else if (roll < 0.88) spawn(at, 'boar', { x: 40 + r() * 240, z: 0.1, y: groundY(0.1), approach: 0.28 + k * 0.18, vx: 0.001 * (r() < 0.5 ? 1 : -1) });
                else if (roll < 0.94) spawn(at, 'hiker', { x: left ? -20 : SW + 20, z: 0.3 + r() * 0.3, y: 0, vx: (left ? 1 : -1) * 22, move: null });
                else spawn(at, 'cow', { x: left ? -30 : SW + 30, z: 0.2 + r() * 0.4, vx: (left ? 1 : -1) * 16 });
            });
            [14, 31, 47].forEach((at, i) => spawn(at, 'bear', { x: 70 + i * 90, z: 0.06, y: groundY(0.06), approach: 0.12 + i * 0.02, vx: 0.001 }));
            [22, 44].forEach((at) => spawn(at, 'pheasant', { x: -20, y: 80, z: 0.4, vx: 150, vy: -30, fly: true }));
            // keep walkers on the ground
            S.at(0, (S2) => {
                S2.animate(() => {
                    for (const o of S2.data.game.objs) {
                        if (!o.fly && !o.approach && o.kind !== 'rabbit') o.y = groundY(o.z);
                    }
                });
            });
        }
    });

    /* ----------------------------------------------- NIGHT TERRORS sprites */
    const TERROR_TYPES = {
        zombie: {
            size: 40, points: 150, hp: 2, reachText: 'BITTEN!', hit: (o, s) => ({ w: s * 0.5, h: s * 1.1, cy: -s * 0.55 }),
            move(o, dt) { o.x += Math.sin(o.t * 1.5 + o.id) * 10 * dt; },
            draw(g, s, o) {
                const lurch = Math.sin(o.t * 4) * s * 0.04;
                legs(g, s, o.t, [-0.08, 0.08], -s * 0.45, s * 0.45, s * 0.1, '#334155', 5);
                C(g, '#7c2d12'); rect(g, -s * 0.18 + lurch, -s * 0.92, s * 0.36, s * 0.5);
                C(g, '#4d7c0f'); rect(g, -s * 0.45 + lurch, -s * 0.85, s * 0.3, s * 0.08);
                rect(g, -s * 0.45 + lurch, -s * 0.72, s * 0.3, s * 0.08);
                ell(g, lurch, -s * 1.04, s * 0.14, s * 0.15);
                C(g, '#fef08a'); rect(g, -s * 0.08 + lurch, -s * 1.08, 2, 2); rect(g, s * 0.04 + lurch, -s * 1.08, 2, 2);
                C(g, '#450a0a'); rect(g, -s * 0.05 + lurch, -s * 0.98, s * 0.1, 2);
            }
        },
        bat: {
            size: 18, points: 220, hit: (o, s) => ({ w: s * 1.4, h: s * 0.8, cy: 0 }),
            move(o, dt) { o.x += o.vx * dt; o.y += Math.sin(o.t * 7 + o.id) * 90 * dt; },
            draw(g, s, o) {
                const flap = Math.sin(o.t * 24) > 0;
                C(g, '#1c1917'); ell(g, 0, 0, s * 0.2, s * 0.24);
                g.beginPath(); g.moveTo(0, 0); g.lineTo(-s * 0.8, flap ? -s * 0.5 : s * 0.3); g.lineTo(-s * 0.4, s * 0.1); g.lineTo(0, s * 0.1); g.fill();
                g.beginPath(); g.moveTo(0, 0); g.lineTo(s * 0.8, flap ? -s * 0.5 : s * 0.3); g.lineTo(s * 0.4, s * 0.1); g.lineTo(0, s * 0.1); g.fill();
                C(g, '#ef4444'); rect(g, -s * 0.1, -s * 0.1, 2, 2); rect(g, s * 0.05, -s * 0.1, 2, 2);
            }
        },
        ufo: {
            size: 34, points: 350, hp: 2, hit: (o, s) => ({ w: s * 1.2, h: s * 0.5, cy: 0 }),
            move(o, dt) { o.x += o.vx * dt; o.y = o.y0 + Math.sin(o.t * 2.5) * 18; if ((o.x < 20 && o.vx < 0) || (o.x > 300 && o.vx > 0)) o.vx *= -1; o.life = (o.life || 0) + dt; if (o.life > 9) o.vy = -60, o.y0 -= 60 * dt; },
            draw(g, s, o, t) {
                if (Math.sin(o.t * 3) > 0.6) { g.fillStyle = 'rgba(163,230,53,0.25)'; g.beginPath(); g.moveTo(-s * 0.2, 0); g.lineTo(s * 0.2, 0); g.lineTo(s * 0.5, SH); g.lineTo(-s * 0.5, SH); g.fill(); }
                C(g, '#a5f3fc'); ell(g, 0, -s * 0.15, s * 0.22, s * 0.18);
                C(g, '#94a3b8'); ell(g, 0, 0, s * 0.6, s * 0.14);
                const cols = ['#f43f5e', '#facc15', '#22c55e'];
                for (let i = 0; i < 5; i++) { C(g, cols[(i + Math.floor(o.t * 8)) % 3]); rect(g, -s * 0.45 + i * s * 0.22, -1, 3, 3); }
                C(g, '#4ade80'); rect(g, -s * 0.06, -s * 0.2, 2, 2); rect(g, s * 0.04, -s * 0.2, 2, 2);
            }
        },
        ghost: {
            size: 30, points: 300, hit: (o, s) => ({ w: s * 0.7, h: s * 0.9, cy: -s * 0.45 }),
            move(o, dt) { o.x += o.vx * dt; o.y = o.y0 + Math.sin(o.t * 2) * 10; },
            draw(g, s, o) {
                const vis = 0.25 + Math.max(0, Math.sin(o.t * 1.8)) * 0.75;
                g.globalAlpha *= vis;
                C(g, '#f8fafc');
                g.beginPath(); g.arc(0, -s * 0.6, s * 0.32, Math.PI, 0);
                for (let i = 0; i <= 4; i++) g.lineTo(s * 0.32 - i * s * 0.16, -s * 0.1 + (i % 2 ? -s * 0.1 : 0) + Math.sin(o.t * 6 + i) * 2);
                g.fill();
                C(g, '#0f172a'); ell(g, -s * 0.1, -s * 0.62, s * 0.05, s * 0.08); ell(g, s * 0.1, -s * 0.62, s * 0.05, s * 0.08); ell(g, 0, -s * 0.42, s * 0.06, s * 0.06);
            }
        },
        werewolf: {
            size: 44, points: 500, hp: 3, reachText: 'MAULED!', hit: (o, s) => ({ w: s * 0.7, h: s * 1.0, cy: -s * 0.5 }),
            move(o, dt) { o.x += Math.sin(o.t * 3 + o.id) * 40 * dt; },
            draw(g, s, o) {
                legs(g, s, o.t, [-0.15, 0.15], -s * 0.4, s * 0.4, s * 0.12, '#3f3f46', 14);
                C(g, '#52525b'); ell(g, 0, -s * 0.65, s * 0.3, s * 0.3);
                C(g, '#71717a'); ell(g, 0, -s * 1.0, s * 0.18, s * 0.16);
                g.beginPath(); g.moveTo(-s * 0.16, -s * 1.08); g.lineTo(-s * 0.1, -s * 1.3); g.lineTo(-s * 0.02, -s * 1.1); g.fill();
                g.beginPath(); g.moveTo(s * 0.16, -s * 1.08); g.lineTo(s * 0.1, -s * 1.3); g.lineTo(s * 0.02, -s * 1.1); g.fill();
                C(g, '#fde047'); rect(g, -s * 0.09, -s * 1.04, 2, 2); rect(g, s * 0.06, -s * 1.04, 2, 2);
                C(g, '#fff'); rect(g, -s * 0.06, -s * 0.92, s * 0.12, 2);
                C(g, '#52525b'); rect(g, -s * 0.45, -s * 0.85, s * 0.18, s * 0.08); rect(g, s * 0.27, -s * 0.85, s * 0.18, s * 0.08);
            }
        },
        survivor: {
            size: 32, penalty: 400, penaltyText: 'SURVIVOR!', hit: (o, s) => ({ w: s * 0.45, h: s * 1.1, cy: -s * 0.55 }),
            draw(g, s, o) {
                legs(g, s, o.t, [-0.08, 0.08], -s * 0.45, s * 0.45, s * 0.1, '#1e3a8a', 10);
                C(g, '#f8fafc'); rect(g, -s * 0.16, -s * 0.9, s * 0.32, s * 0.48);
                C(g, '#f1c27d'); ell(g, 0, -s * 1.02, s * 0.12, s * 0.12);
                rect(g, s * 0.16, -s * 1.25 + Math.sin(o.t * 10) * 3, s * 0.07, s * 0.35);
                C(g, '#fde047'); g.font = 'bold 7px monospace'; g.fillText('HELP', -s * 0.3, -s * 1.3);
            }
        },
        eyebeast: {
            size: 120, points: 5000, hp: 22, reachText: 'DEVOURED!',
            hit: (o, s) => ({ w: s * 0.9, h: s * 0.8, cy: -s * 0.5 }),
            weak: (o, p) => { const s = 120 * (0.35 + o.z * 1.1); return Math.hypot(p.x - o.x, p.y - (o.y - s * 0.55)) < s * 0.16; },
            move(o, dt) { o.x = 160 + Math.sin(o.t * 0.7) * 70; },
            onDamage(o, game) { game.shake = 0.15; o.approach *= 0.96; },
            die(o, game) { game.shake = 1; SFX.fanfare(); SFX.rumble(0.5); },
            draw(g, s, o, t) {
                C(g, '#581c87'); ell(g, 0, -s * 0.5, s * 0.45, s * 0.38);
                for (let i = 0; i < 6; i++) {
                    C(g, '#6b21a8');
                    const a = i / 6 * Math.PI + Math.PI * 0.05;
                    const x = Math.cos(a) * s * 0.4;
                    g.save(); g.translate(x, -s * 0.2); g.rotate(Math.sin(o.t * 3 + i) * 0.4);
                    rect(g, -s * 0.04, 0, s * 0.08, s * 0.35); g.restore();
                }
                C(g, '#fef9c3'); ell(g, 0, -s * 0.55, s * 0.18, s * 0.16);
                C(g, '#dc2626'); ell(g, Math.sin(o.t) * s * 0.05, -s * 0.55, s * 0.09, s * 0.09);
                C(g, '#000'); ell(g, Math.sin(o.t) * s * 0.05, -s * 0.55, s * 0.04, s * 0.07);
                // hp bar
                C(g, '#111'); rect(g, -s * 0.4, -s * 1.0, s * 0.8, 4);
                C(g, '#f43f5e'); rect(g, -s * 0.4, -s * 1.0, s * 0.8 * (o.hp / 22), 4);
            }
        }
    };

    function terrorBg(g, game, t) {
        const sky = g.createLinearGradient(0, 0, 0, HORIZON);
        sky.addColorStop(0, '#020617'); sky.addColorStop(1, '#3b0764');
        g.fillStyle = sky; g.fillRect(0, 0, SW, HORIZON + 2);
        g.fillStyle = '#fef9c3'; ell(g, 70, 42, 20, 20);
        g.fillStyle = '#3b0764'; ell(g, 78, 38, 18, 18);
        g.fillStyle = '#fff';
        for (let i = 0; i < 30; i++) rect(g, (i * 53) % SW, (i * 29) % (HORIZON - 20), 1, 1);
        // dead trees + church silhouette
        g.fillStyle = '#0b0614';
        g.fillRect(220, HORIZON - 50, 26, 52);
        g.beginPath(); g.moveTo(216, HORIZON - 50); g.lineTo(233, HORIZON - 76); g.lineTo(250, HORIZON - 50); g.fill();
        g.fillRect(231, HORIZON - 88, 4, 14); g.fillRect(227, HORIZON - 84, 12, 3);
        for (const x of [20, 130, 290]) {
            g.fillRect(x, HORIZON - 40, 4, 42);
            g.fillRect(x - 10, HORIZON - 32, 12, 2); g.fillRect(x + 2, HORIZON - 24, 12, 2);
        }
        const field = g.createLinearGradient(0, HORIZON, 0, SH);
        field.addColorStop(0, '#1e1b2e'); field.addColorStop(1, '#0c0a14');
        g.fillStyle = field; g.fillRect(0, HORIZON + 2, SW, SH - HORIZON);
        // tombstones
        for (let i = 0; i < 9; i++) {
            const z = 0.12 + (i % 3) * 0.22, x = (i * 71) % SW, s = 10 + z * 24;
            g.fillStyle = '#475569';
            g.beginPath(); g.arc(x, groundY(z) - s, s * 0.45, Math.PI, 0); g.lineTo(x + s * 0.45, groundY(z)); g.lineTo(x - s * 0.45, groundY(z)); g.fill();
            g.fillStyle = '#334155'; rect(g, x - 1, groundY(z) - s * 1.1, 2, s * 0.6); rect(g, x - s * 0.2, groundY(z) - s * 0.9, s * 0.4, 2);
        }
        // drifting fog
        g.fillStyle = 'rgba(167,139,250,0.08)';
        for (let i = 0; i < 6; i++) { const x = ((i * 70 + t * 10) % (SW + 100)) - 50; ell(g, x, HORIZON + 30 + i * 10, 60, 8); }
    }

    cabinet({
        id: 'cab_night_terrors', order: 3, name: 'Night Terrors', icon: '🧟', accent: '#a855f7',
        tagline: 'Zombies, aliens and monsters on a cabinet',
        desc: 'A haunted-graveyard light-gun game. Zombies shamble towards the screen and take two hits. Bats swoop, flying saucers zigzag overhead, ghosts flicker in and out, and werewolves charge. Anything that reaches you costs a life, and you have three. At 40 seconds the Eye Beast rises: only its eye can be hurt. Never shoot a survivor.',
        title: 'NIGHT TERRORS', neon: 0xa855f7, body: 0x2e1065, trim: 0x13002e, marqColor: '#e9d5ff', hudCol: '#d8b4fe',
        stars: [5000, 10000, 16000, 23000],
        types: TERROR_TYPES, drawBg: terrorBg, lifeLoss: true,
        schedule(S, spawn) {
            K.ramp(S, { from: 1.4, to: 0.5, start: 0.6, end: 57 }, (at, k, r) => {
                if (at > 39 && at < 44) return;   // the boss enters
                const roll = r();
                const left = r() < 0.5;
                if (roll < 0.42) spawn(at, 'zombie', { x: 30 + r() * 260, z: 0.05, y: groundY(0.05), approach: 0.09 + k * 0.08, vx: 0.001 * (left ? 1 : -1) });
                else if (roll < 0.62) spawn(at, 'bat', { x: left ? -20 : SW + 20, y: 40 + r() * 70, z: 0.4 + r() * 0.4, vx: (left ? 1 : -1) * (90 + k * 80), fly: true });
                else if (roll < 0.74) { const y0 = 30 + r() * 30; spawn(at, 'ufo', { x: left ? -20 : SW + 20, y: y0, y0, z: 0.45, vx: (left ? 1 : -1) * (70 + k * 40), fly: true }); }
                else if (roll < 0.86) { const z = 0.2 + r() * 0.5; const y0 = groundY(z) - 8; spawn(at, 'ghost', { x: left ? -20 : SW + 20, y: y0, y0, z, vx: (left ? 1 : -1) * (30 + k * 25), fly: true }); }
                else if (roll < 0.93) spawn(at, 'werewolf', { x: 40 + r() * 240, z: 0.08, y: groundY(0.08), approach: 0.22 + k * 0.1, vx: 0.001 });
                else spawn(at, 'survivor', { x: left ? -20 : SW + 20, z: 0.35 + r() * 0.3, vx: (left ? 1 : -1) * 26 });
            });
            spawn(40, 'eyebeast', { x: 160, z: 0.05, y: groundY(0.05), approach: 0.045, vx: 0.001 });
            S.at(0, (S2) => {
                S2.animate(() => {
                    for (const o of S2.data.game.objs) if (!o.fly && !o.approach) o.y = groundY(o.z);
                });
            });
        }
    });
})(window);
