/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Arcade Hall (part 2)
     4. Ball Brawl        — 10 hamster balls, one tiny platform, giant fists
     5. Aim Diagnostics   — flick / track / precision battery with a shot heatmap,
                            a written diagnosis and a custom drill for your weakest stat
     6. Contracts         — six assassination contracts: find the right person in the crowd
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const L = BO.MinigameLib;
    const A = BO.MinigameArt;
    const K = BO.MGCourseKit;
    const F = BO.MGFigures;
    const { B, SFX, std, basic, clamp01, Ease, TAU, esc } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const lerp = (a, b, t) => a + (b - a) * t;
    const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    const fwdOf = (yaw) => V(-Math.sin(yaw), 0, -Math.cos(yaw));

    function lockPlayer(x, y, z, eye = 1.6) {
        BO.Player.rideState = { kind: 'minigame', pos: V(x, y, z), roll: 0, pitch: 0, eye };
    }

    function labelSprite(text, color) {
        const tex = L.canvasTex('label:' + text + color, 256, 64, (g, w, h) => {
            g.clearRect(0, 0, w, h);
            g.font = '900 34px Bahnschrift, Impact, sans-serif';
            g.textAlign = 'center'; g.textBaseline = 'middle';
            g.lineWidth = 7; g.strokeStyle = 'rgba(0,0,0,0.75)';
            g.strokeText(text, w / 2, h / 2);
            g.fillStyle = color; g.fillText(text, w / 2, h / 2);
        });
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
        s.scale.set(2.4, 0.6, 1);
        return s;
    }

    /* =====================================================================
       4. BALL BRAWL
    ===================================================================== */
    const BALL_NAMES = ['YOU', 'Nibbles', 'Pip', 'Biscuit', 'Turbo', 'Mochi', 'Pebble', 'Ziggy', 'Waffles', 'Bean'];
    const BALL_COLS = [0xfacc15, 0xef4444, 0x3b82f6, 0x22c55e, 0xa855f7, 0xf97316, 0x14b8a6, 0xec4899, 0x84cc16, 0x94a3b8];
    const PLAT_R = 13, BALL_R = 1.0;
    const PUNCH_CD = 5, DASH_CD = 5;

    function buildBall(S, i) {
        const g = new THREE.Group();
        const shell = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 24, 16), new THREE.MeshStandardMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.26, roughness: 0.05, metalness: 0.1, depthWrite: false }));
        const bands = new THREE.Mesh(new THREE.TorusGeometry(BALL_R * 0.99, 0.035, 6, 32), basic(BALL_COLS[i]));
        const roll = new THREE.Group();
        roll.add(shell, bands);
        const bands2 = bands.clone();
        bands2.rotation.y = Math.PI / 2;
        roll.add(bands2);
        g.add(roll);
        // the little critter inside
        const critter = new THREE.Group();
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), std(BALL_COLS[i], 0.6));
        body.scale.set(1, 1.1, 1);
        body.position.y = -0.35;
        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), std(0xfef3c7, 0.7));
        belly.position.set(0, -0.42, -0.2);
        const earL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), std(BALL_COLS[i], 0.6));
        earL.position.set(-0.24, 0.05, 0);
        const earR = earL.clone(); earR.position.x = 0.24;
        for (const sx of [-0.13, 0.13]) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), basic(0x111111));
            eye.position.set(sx, -0.2, -0.36);
            const glint = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), basic(0xffffff));
            glint.position.set(sx + 0.02, -0.17, -0.42);
            critter.add(eye, glint);
        }
        critter.add(body, belly, earL, earR);
        // the punching arm (extends out of the ball along -Z)
        const arm = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1, 8), std(0x9ca3af, 0.3, 0.8));
        pole.rotation.x = Math.PI / 2;
        pole.position.z = -0.5;
        const glove = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), std(0xdc2626, 0.35));
        glove.scale.set(1, 0.85, 1.1);
        const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.25, 12), std(0xf8fafc, 0.5));
        cuff.rotation.x = Math.PI / 2;
        cuff.position.z = 0.4;
        const gl = new THREE.Group();
        gl.add(glove, cuff);
        arm.add(pole, gl);
        arm.visible = false;
        critter.add(arm);
        g.add(critter);
        if (i !== 0) {
            const tag = labelSprite(BALL_NAMES[i], '#' + BALL_COLS[i].toString(16).padStart(6, '0'));
            tag.position.y = 1.7;
            g.add(tag);
        }
        g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
        S.add(g);
        return { g, roll, critter, arm, pole, glove: gl };
    }

    function brawlPunch(S, b) {
        if (b.punchCd > 0 || !b.alive || b.falling) return;
        b.punchCd = PUNCH_CD;
        b.punchT = 0;
        b.punchHit = false;
        SFX.whoosh(0.22);
        if (b.isPlayer) S.data.punches++;
    }

    function brawlDash(S, b) {
        if (b.dashCd > 0 || !b.alive || b.falling) return;
        b.dashCd = DASH_CD;
        b.vel.addScaledVector(fwdOf(b.yaw), 13);
        SFX.launch();
    }

    function brawlEliminate(S, b) {
        const D = S.data;
        b.alive = false;
        D.alive--;
        b.place = D.alive + 1;
        const credit = b.lastHitBy !== undefined && D.t - b.lastHitT < 4 ? D.balls[b.lastHitBy] : null;
        if (credit && credit.isPlayer) {
            D.kos++;
            S.kills++;
            S.award(750, b.pos.clone().add(V(0, 3, 0)), 'KNOCKOUT', '#fde68a');
            S.bumpCombo();
        }
        MG.toast(`${b.isPlayer ? 'YOU ARE' : BALL_NAMES[b.i] + ' IS'} OUT • ${D.alive} LEFT`, b.isPlayer ? '#f87171' : '#e2e8f0');
        SFX.tone(600, 120, 0.6, 'sine', 0.12);
        if (b.isPlayer) {
            D.place = b.place;
            MG.finish(`ELIMINATED • ${ordinal(b.place)}`, { color: '#f87171', delay: 2.6 });
        } else if (D.alive === 1 && D.balls[0].alive) {
            D.place = 1;
            S.award(1000, D.balls[0].pos.clone().add(V(0, 3, 0)), 'LAST BALL ROLLING', '#facc15');
            MG.finish('WINNER!', { color: '#facc15', delay: 2.6 });
        }
    }

    const ordinal = (n) => n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');

    MG.register({
        id: 'ball_brawl', cat: 'arcade', order: 4,
        name: 'Ball Brawl', icon: '🐹', accent: '#facc15',
        tagline: '10 hamster balls. One tiny platform. Giant fists.',
        desc: 'Ten critters in hamster balls on a small round platform floating in the sky. Roll with WASD and steer with the mouse. Left click fires a giant boxing glove out of your ball (5 second cooldown). Right click dashes forward (5 second cooldown). Knock everyone off the edge and be the last ball rolling. After 45 seconds the platform starts to shrink.',
        heroLabel: 'ARCADE HALL • PARTY BRAWL', duration: 0,
        stars: [5, 3, 2, 1], starLabel: (th) => th === 1 ? 'WINNER' : th === 2 ? '2ND' : 'TOP ' + th,
        weaponNote: 'No gun: punch and dash', weaponLabel: 'BOXING GLOVE',
        standardWeapon: 'm1911', lockWeapon: true, blockFire: true, hideViewmodel: true, infiniteMag: true, forgivingMisses: true,
        keys: [['WASD', 'Roll'], ['MOUSE', 'Steer & look'], ['LMB', 'Punch (5s)'], ['RMB', 'Dash (5s)']],
        formatBest: (b) => (b.extra ? ordinal(b.extra.place) + ' • ' + b.extra.kos + ' KO' : Number(b.score).toLocaleString()),
        map: {
            atmosphere: { skyTop: 0x0ea5e9, skyBottom: 0xfef3c7, fogColor: 0xbae6fd, fogDensity: 0.006, sunColor: 0xfff7e0, sunIntensity: 1.9, sunPos: [30, 60, 20], hemiSky: 0xe0f2fe, hemiGround: 0x7dd3fc, hemiIntensity: 1.0 },
            boxes: [B(0, -400, 0, 2, 1, 2, 'concrete')],
            spawn: { x: 0, y: 0, z: 0, yaw: 0 }
        },
        countdown: 3,
        build(S) {
            const D = S.data;
            Object.assign(D, { t: 0, alive: 10, kos: 0, punches: 0, place: 0, platR: PLAT_R });
            // platform
            const top = L.canvasTex('brawl-top', 256, 256, (g, w, h) => {
                for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#fde68a' : '#fb923c'; g.fillRect(x * 32, y * 32, 32, 32); }
            });
            const plat = new THREE.Mesh(new THREE.CylinderGeometry(PLAT_R, PLAT_R * 0.75, 2.4, 48), [std(0x7c2d12, 0.8), new THREE.MeshStandardMaterial({ map: top, roughness: 0.7 }), std(0x7c2d12, 0.8)]);
            plat.position.y = -1.2;
            plat.receiveShadow = true;
            S.add(plat);
            D.plat = plat;
            const rim = new THREE.Mesh(new THREE.TorusGeometry(PLAT_R, 0.12, 8, 64), basic(0xffffff));
            rim.rotation.x = Math.PI / 2;
            rim.position.y = 0.02;
            S.add(rim);
            D.rim = rim;
            const under = new THREE.Mesh(new THREE.ConeGeometry(PLAT_R * 0.75, 9, 24), std(0x57534e, 1));
            under.rotation.x = Math.PI;
            under.position.y = -6.9;
            S.add(under);
            // floating scenery
            const rnd = L.mulberry32(10);
            for (let i = 0; i < 9; i++) {
                const isl = new THREE.Group();
                const r = 3 + rnd() * 4;
                const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.8, 1, 10), std(0x65a30d, 0.9));
                const c = new THREE.Mesh(new THREE.ConeGeometry(r * 0.8, r * 1.6, 10), std(0x78716c, 1));
                c.rotation.x = Math.PI; c.position.y = -r * 0.8 - 0.5;
                isl.add(t, c);
                const tr = A.tree(0.8 + rnd() * 0.6); tr.position.y = 0.5; isl.add(tr);
                // Cheering mascot fans on the floating islands!
                for (let f = 0; f < 3; f++) {
                    const fan = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), std(BALL_COLS[(i + f) % BALL_COLS.length], 0.5));
                    fan.position.set((f - 1) * 1.1, 1.0, 0.9); isl.add(fan);
                }
                const a = i / 9 * TAU, d = 32 + rnd() * 24;
                isl.position.set(Math.cos(a) * d, -4 + rnd() * 14, Math.sin(a) * d);
                S.add(isl);
                const sp = 0.3 + rnd() * 0.4, ph = rnd() * 6;
                const y0 = isl.position.y;
                S.animate(() => { isl.position.y = y0 + Math.sin(performance.now() * 0.001 * sp + ph) * 1.2; });
            }
            const arenaBanner = A.sign('HAMSTER BALL ARENA', 8, 1.4, { bg: '#1e1b4b', color: '#fde047', borderColor: '#facc15', size: 0.5, glow: '#facc15' });
            arenaBanner.position.set(0, 7.5, -24); S.add(arenaBanner);
            K.cloudLayer(S, 18, -30, 140, 0xffffff, 0.9);
            K.cloudLayer(S, 10, 50, 160);
            // balls in a ring
            D.balls = [];
            for (let i = 0; i < 10; i++) {
                const a = i / 10 * TAU + Math.PI / 2;
                const pos = V(Math.cos(a) * 9, BALL_R, Math.sin(a) * 9);
                const mesh = buildBall(S, i);
                const yaw = Math.atan2(pos.x, pos.z);   // face the centre
                D.balls.push({
                    i, isPlayer: i === 0, mesh, pos, vel: V(0, 0, 0), yaw, alive: true, falling: false,
                    punchCd: 1.5 + rnd(), dashCd: 2 + rnd() * 2, punchT: -1, skill: 0.55 + rnd() * 0.45, targetT: 0, target: null, think: 0
                });
            }
            const me = D.balls[0];
            BO.Player.yaw = me.yaw;
            BO.Player.pitch = -0.32;
            lockPlayer(me.pos.x, 0, me.pos.z, 3.2);
            this._camera(S, 0);
            // mouse buttons: punch / dash
            D.onDown = (e) => {
                if (MG.session !== S || MG.state !== 'running' || !document.pointerLockElement) return;
                if (e.button === 0) brawlPunch(S, D.balls[0]);
                else if (e.button === 2) brawlDash(S, D.balls[0]);
            };
            window.addEventListener('mousedown', D.onDown);
        },
        dispose(S) { if (S.data.onDown) window.removeEventListener('mousedown', S.data.onDown); },
        _camera(S, dt) {
            const D = S.data;
            const P = BO.Player;
            const me = D.balls[0];
            let focus = me;
            if (!me.alive && me.pos.y < -6) focus = D.balls.find((b) => b.alive) || me;
            const f = fwdOf(P.yaw);
            const want = focus.pos.clone().addScaledVector(f, -7.5);
            want.y = Math.max(focus.pos.y, -4) - 0.6;
            const rs = P.rideState;
            if (!rs) return;
            if (dt > 0) rs.pos.lerp(want, Math.min(1, dt * 10)); else rs.pos.copy(want);
            rs.eye = 3.2;
            P.adsHeld = false;
        },
        preUpdate(S, dt, lib, state) {
            const D = S.data;
            const P = BO.Player;
            const run = state === 'running';
            if (run) D.t += dt;
            if (run && D.t > 150 && !D.timeUp) { D.timeUp = true; D.place = D.balls[0].alive ? D.alive : D.place; MG.finish('TIME UP', { color: '#fde68a' }); }
            // shrink the platform after 45s
            const shrink = run ? clamp01((D.t - 45) / 40) : (D.t > 45 ? clamp01((D.t - 45) / 40) : 0);
            D.platR = lerp(PLAT_R, 6.5, shrink);
            const sc = D.platR / PLAT_R;
            D.plat.scale.set(sc, 1, sc);
            D.rim.scale.set(sc, sc, 1);
            if (shrink > 0 && shrink < 1 && Math.floor(D.t * 2) !== D._sh) { D._sh = Math.floor(D.t * 2); D.rim.material = basic(D._sh % 2 ? 0xef4444 : 0xffffff); }
            const balls = D.balls;
            // --- controls
            for (const b of balls) {
                if (!b.alive && !b.falling) continue;
                b.punchCd = Math.max(0, b.punchCd - (run ? dt : 0));
                b.dashCd = Math.max(0, b.dashCd - (run ? dt : 0));
                const onPlat = Math.hypot(b.pos.x, b.pos.z) < D.platR && b.pos.y > BALL_R - 0.3;
                let ax = 0, az = 0;
                if (run && b.alive && onPlat) {
                    if (b.isPlayer) {
                        b.yaw = P.yaw;
                        const f = fwdOf(P.yaw), r = V(-f.z, 0, f.x);
                        const k = P.keys;
                        let ix = 0, iz = 0;
                        if (k.KeyW) iz += 1;
                        if (k.KeyS) iz -= 1;
                        if (k.KeyD) ix += 1;
                        if (k.KeyA) ix -= 1;
                        const m = Math.hypot(ix, iz) || 1;
                        ax = (f.x * iz + r.x * ix) / m * 19;
                        az = (f.z * iz + r.z * ix) / m * 19;
                    } else this._bot(S, b, dt, (x, z) => { ax = x; az = z; });
                }
                b.vel.x += ax * dt;
                b.vel.z += az * dt;
                if (onPlat) {
                    const fr = Math.max(0, 1 - 1.15 * dt);
                    b.vel.x *= fr; b.vel.z *= fr;
                    const hs = Math.hypot(b.vel.x, b.vel.z);
                    const cap = 9.5;
                    if (hs > cap && b.dashCd < DASH_CD - 0.4) { b.vel.x *= cap / hs; b.vel.z *= cap / hs; }
                    b.pos.y = BALL_R;
                    b.vel.y = 0;
                } else {
                    b.vel.y -= 26 * dt;
                    if (!b.falling && b.alive) { b.falling = true; }
                }
                b.pos.addScaledVector(b.vel, dt);
                if (b.alive && b.pos.y < -4) brawlEliminate(S, b);
                if (!b.alive && b.pos.y < -40) b.falling = false;
            }
            // --- ball/ball collisions
            for (let i = 0; i < balls.length; i++) {
                const a = balls[i];
                if (a.pos.y < -2) continue;
                for (let j = i + 1; j < balls.length; j++) {
                    const c = balls[j];
                    if (c.pos.y < -2) continue;
                    const dx = c.pos.x - a.pos.x, dz = c.pos.z - a.pos.z;
                    const d = Math.hypot(dx, dz);
                    if (d >= BALL_R * 2 || d < 1e-4) continue;
                    const nx = dx / d, nz = dz / d;
                    const push = (BALL_R * 2 - d) / 2;
                    a.pos.x -= nx * push; a.pos.z -= nz * push;
                    c.pos.x += nx * push; c.pos.z += nz * push;
                    const rv = (c.vel.x - a.vel.x) * nx + (c.vel.z - a.vel.z) * nz;
                    if (rv < 0) {
                        const jimp = -(1 + 0.9) * rv / 2;
                        a.vel.x -= jimp * nx; a.vel.z -= jimp * nz;
                        c.vel.x += jimp * nx; c.vel.z += jimp * nz;
                        if (-rv > 4) { SFX.boing(); if (a.isPlayer || c.isPlayer) P.cameraShake = Math.max(P.cameraShake, 0.02); }
                        a.lastHitBy = c.i; a.lastHitT = D.t;
                        c.lastHitBy = a.i; c.lastHitT = D.t;
                    }
                }
            }
            // --- punches
            for (const b of balls) {
                if (b.punchT < 0) { b.mesh.arm.visible = false; continue; }
                b.punchT += dt;
                const t = b.punchT;
                const ext = t < 0.11 ? Ease.outCubic(t / 0.11) : t < 0.2 ? 1 : Math.max(0, 1 - (t - 0.2) / 0.22);
                b.mesh.arm.visible = ext > 0.02;
                const reach = 0.9 + ext * 2.4;
                b.mesh.pole.scale.set(1, reach, 1);
                b.mesh.pole.position.z = -reach / 2;
                b.mesh.glove.position.z = -reach - 0.1;
                b.mesh.glove.scale.setScalar(1 + ext * 0.35);
                if (!b.punchHit && t >= 0.08 && t < 0.2) {
                    const f = fwdOf(b.yaw);
                    for (const o of balls) {
                        if (o === b || !o.alive || o.pos.y < 0) continue;
                        const dx = o.pos.x - b.pos.x, dz = o.pos.z - b.pos.z;
                        const d = Math.hypot(dx, dz);
                        if (d > 4.2) continue;
                        const dot = (dx * f.x + dz * f.z) / (d || 1);
                        if (dot < 0.6) continue;
                        b.punchHit = true;
                        const power = 17 * (1.15 - d / 9);
                        o.vel.x += dx / d * power;
                        o.vel.z += dz / d * power;
                        o.lastHitBy = b.i; o.lastHitT = D.t;
                        b.vel.addScaledVector(f, -3);
                        SFX.thunk(); SFX.tone(220, 80, 0.2, 'square', 0.12); SFX.noise(0.12, 900, 'bandpass', 1, 0.4);
                        BO.FX.spawnParticles(o.pos.clone(), 14, 0xfde68a, 6, 4, 0.35, 1.2);
                        if (b.isPlayer) { S.hits++; S.data.landed = (S.data.landed || 0) + 1; MG.popup(o.pos.clone().add(V(0, 2, 0)), 'POW!', '#fde68a', true); }
                        if (o.isPlayer) { P.cameraShake = Math.max(P.cameraShake, 0.06); MG.flashScreen('rgba(250,204,21,0.25)'); }
                        break;
                    }
                }
                if (t > 0.45) { b.punchT = -1; b.mesh.arm.visible = false; }
            }
            // --- visuals
            for (const b of balls) {
                const g = b.mesh.g;
                g.position.copy(b.pos);
                const hs = Math.hypot(b.vel.x, b.vel.z);
                if (hs > 0.05) {
                    const axis = V(b.vel.z, 0, -b.vel.x).normalize();
                    b.mesh.roll.rotateOnWorldAxis(axis, -hs * dt / BALL_R);
                }
                b.mesh.critter.rotation.y = b.yaw;
                b.mesh.critter.position.y = Math.abs(Math.sin(D.t * 10 + b.i)) * 0.05 * Math.min(1, hs / 3);
                g.visible = b.pos.y > -40;
            }
            this._camera(S, dt);
        },
        _bot(S, b, dt, out) {
            const D = S.data;
            b.think -= dt;
            if (b.think <= 0 || !b.target || !b.target.alive) {
                b.think = 1.5 + Math.random() * 2.5;
                const others = D.balls.filter((o) => o !== b && o.alive && !o.falling);
                if (!others.length) { out(0, 0); return; }
                others.sort((p, q) => p.pos.distanceToSquared(b.pos) - q.pos.distanceToSquared(b.pos));
                b.target = Math.random() < 0.65 ? others[0] : others[Math.floor(Math.random() * others.length)];
            }
            const tg = b.target;
            let dx = tg.pos.x - b.pos.x, dz = tg.pos.z - b.pos.z;
            const d = Math.hypot(dx, dz) || 1;
            dx /= d; dz /= d;
            // edge avoidance
            const rc = Math.hypot(b.pos.x, b.pos.z);
            const edge = clamp01((rc - (D.platR - 4)) / 3);
            const cx = -b.pos.x / (rc || 1), cz = -b.pos.z / (rc || 1);
            let mx = dx * (1 - edge) + cx * edge * 1.6;
            let mz = dz * (1 - edge) + cz * edge * 1.6;
            const ml = Math.hypot(mx, mz) || 1;
            mx /= ml; mz /= ml;
            const wantYaw = Math.atan2(-dx, -dz);
            b.yaw += wrapA(wantYaw - b.yaw) * Math.min(1, dt * (3 + b.skill * 4));
            const acc = 13 + b.skill * 5;
            out(mx * acc, mz * acc);
            const facing = Math.abs(wrapA(wantYaw - b.yaw)) < 0.45;
            if (MG.state === 'running' && facing) {
                if (d < 3.6 && b.punchCd <= 0 && Math.random() < dt * (2 + b.skill * 4)) brawlPunch(S, b);
                else if (d > 4.5 && d < 9 && b.dashCd <= 0 && edge < 0.5 && Math.random() < dt * b.skill * 1.2) brawlDash(S, b);
            }
        },
        hud(S) {
            const me = S.data.balls[0];
            const pc = me.punchCd, dc = me.dashCd;
            const ring = (cd, max, label, key) => `<div class="mgx-cd ${cd <= 0 ? 'ready' : ''}"><div class="mgx-cd-fill" style="height:${((1 - cd / max) * 100).toFixed(0)}%"></div><b>${label}</b><small>${cd > 0 ? cd.toFixed(1) + 's' : key}</small></div>`;
            return `<div class="mgx-brawl"><div class="mgx-chip">BALLS LEFT <b>${S.data.alive}</b></div><div class="mgx-chip">KNOCKOUTS <b>${S.data.kos}</b></div>${S.data.platR < PLAT_R - 0.2 ? '<div class="mgx-chip mgx-bad">PLATFORM SHRINKING</div>' : ''}</div>
                <div class="mgx-cds">${ring(pc, PUNCH_CD, 'PUNCH', 'LMB')}${ring(dc, DASH_CD, 'DASH', 'RMB')}</div>`;
        },
        scoreText(S) { return S.data.alive + ' LEFT'; },
        result(S) {
            const D = S.data;
            const place = D.place || D.alive;
            const placePts = [0, 5000, 3000, 2000, 1500, 1200, 900, 700, 500, 300, 200][place] || 200;
            const score = placePts + D.kos * 750;
            const stars = place <= 1 ? 4 : place <= 2 ? 3 : place <= 3 ? 2 : place <= 5 ? 1 : 0;
            return {
                score, stars, saveExtra: { place, kos: D.kos },
                scoreLabel: 'POINTS',
                title: place === 1 ? 'LAST BALL ROLLING' : ordinal(place).toUpperCase() + ' PLACE',
                stats: [['PLACE', ordinal(place)], ['KNOCKOUTS', D.kos], ['PUNCHES THROWN', D.punches], ['PUNCHES LANDED', D.landed || 0], ['SURVIVED', BO.Math.formatTime(D.t)], ['OPPONENTS', 9]],
                noGraph: true,
                xp: Math.round(120 + score * 0.03 + stars * 120)
            };
        }
    });

    /* =====================================================================
       5. AIM DIAGNOSTICS
    ===================================================================== */
    const AIM_DIST = 11;
    const DRILLS = {
        overshoot: { label: 'Flick Control', desc: 'Wide horizontal flicks. Stop dead on the target.', phase: 'flick', bias: 'h', radius: 0.32 },
        vertical: { label: 'Vertical Flicks', desc: 'Targets jump up and down. Train your vertical snap.', phase: 'flick', bias: 'v', radius: 0.32 },
        speed: { label: 'Flick Speed', desc: 'Short time limit on every target.', phase: 'flick', bias: null, radius: 0.36, timeout: 1.1 },
        tracking: { label: 'Strafe Tracking', desc: 'A strafing target with frequent direction changes. Stay glued.', phase: 'track' },
        precision: { label: 'Micro Precision', desc: 'Tiny targets packed close together.', phase: 'micro' }
    };

    function aimRay() {
        const cam = BO.App.worldCamera;
        if (BO.Player.getAimRay) return BO.Player.getAimRay(cam);
        const dir = new THREE.Vector3();
        cam.getWorldDirection(dir);
        return { origin: cam.position.clone(), dir };
    }

    /** Offset of the aim ray from a target centre, in target radii, in the plane facing the shooter. */
    function aimOffset(origin, dir, center, radius) {
        const toC = center.clone().sub(origin);
        const n = toC.clone().normalize();
        const denom = dir.dot(n);
        if (denom <= 0.01) return null;
        const tHit = toC.dot(n) / denom;
        const p = origin.clone().addScaledVector(dir, tHit).sub(center);
        const right = new THREE.Vector3().crossVectors(n, V(0, 1, 0)).normalize();
        const up = new THREE.Vector3().crossVectors(right, n).normalize();
        return { x: p.dot(right) / radius, y: p.dot(up) / radius };
    }

    function aimAngles(dir) { return { yaw: Math.atan2(-dir.x, -dir.z), pitch: Math.asin(BO.Math.clamp(dir.y, -1, 1)) }; }

    function aimSphere(radius, color) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 16), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.3 }));
        m.castShadow = true;
        const g = new THREE.Group();
        g.add(m);
        return { mesh: g, hitMeshes: [m], ball: m };
    }

    function aimSpawnFlick(S, o = {}) {
        const D = S.data;
        const rng = S.rng;
        const cur = aimAngles(aimRay().dir);
        let yaw, pitch;
        const bias = o.bias;
        for (let tries = 0; tries < 12; tries++) {
            if (bias === 'h') { yaw = cur.yaw + (rng() < 0.5 ? -1 : 1) * (0.35 + rng() * 0.45); pitch = 0.12 + (rng() - 0.5) * 0.12; }
            else if (bias === 'v') { yaw = cur.yaw + (rng() - 0.5) * 0.18; pitch = cur.pitch + (rng() < 0.5 ? -1 : 1) * (0.2 + rng() * 0.3); }
            else { yaw = (rng() - 0.5) * 1.3; pitch = -0.12 + rng() * 0.5; }
            yaw = BO.Math.clamp(yaw, -0.8, 0.8);
            pitch = BO.Math.clamp(pitch, -0.2, 0.5);
            if (Math.hypot(wrapA(yaw - cur.yaw), pitch - cur.pitch) > 0.12) break;
        }
        const dist = o.dist || AIM_DIST;
        const cam = BO.App.worldCamera.position;
        const pos = V(cam.x - Math.sin(yaw) * Math.cos(pitch) * dist, cam.y + Math.sin(pitch) * dist, cam.z - Math.cos(yaw) * Math.cos(pitch) * dist);
        const radius = o.radius || 0.34;
        const t = aimSphere(radius, o.color || 0x22d3ee);
        const flick = { dYaw: wrapA(yaw - cur.yaw), dPitch: pitch - cur.pitch, born: S.t, phase: o.phase || 'flick' };
        const tg = S.addTarget(Object.assign(t, {
            pos: pos.clone().sub(V(0, 0, 0)), points: o.points || 100, life: o.timeout || 2.4, appear: 'scale', inT: 0.06, outT: 0.08, death: 'pop', deathColor: o.color || 0x22d3ee,
            onExpire: () => { D.timeouts++; D.flicks.push({ dYaw: flick.dYaw, dPitch: flick.dPitch, time: 9, hit: false, phase: flick.phase }); if (o.onDone) o.onDone(); }
        }));
        tg.center = pos;
        tg.radius = radius;
        tg.flick = flick;
        tg.onDone = o.onDone;
        D.active = tg;
        return tg;
    }

    function aimNextFlick(S) {
        const D = S.data;
        if (MG.state !== 'running') return;
        const ph = aimPhase(S);
        if (ph === 'flick' || (D.drill && DRILLS[D.drill].phase === 'flick')) {
            const dr = D.drill ? DRILLS[D.drill] : null;
            aimSpawnFlick(S, { bias: dr ? dr.bias : (D.flickN++ % 3 === 0 ? 'v' : null), radius: dr ? dr.radius : 0.34, timeout: dr && dr.timeout ? dr.timeout : 2.4, onDone: () => aimNextFlick(S) });
        } else if (ph === 'micro') {
            aimSpawnFlick(S, { bias: null, radius: 0.15, color: 0xf472b6, timeout: 1.8, dist: 9, phase: 'micro', points: 150, onDone: () => aimNextFlick(S) });
        }
    }

    function aimPhase(S) {
        const D = S.data;
        if (D.drill) return DRILLS[D.drill].phase;
        return S.t < 20 ? 'flick' : S.t < 40 ? 'track' : 'micro';
    }

    function aimStartTrack(S) {
        const D = S.data;
        const t = aimSphere(0.45, 0xfacc15);
        const cam = BO.App.worldCamera.position;
        const base = V(cam.x, cam.y + 0.6, cam.z - 12);
        const st = { x: 0, v: 3.2, y: 0, flipT: 1.2 };
        const harder = D.drill === 'tracking';
        const tg = S.addTarget(Object.assign(t, {
            pos: base.clone(), points: 0, bonus: true, life: 0, appear: 'scale', death: 'pop', deathColor: 0xfacc15,
            onTick: (tt, dt) => {
                if (MG.state !== 'running') return;
                st.flipT -= dt;
                if (st.flipT <= 0) {
                    st.v = -Math.sign(st.v) * (2.6 + S.rng() * (harder ? 4.2 : 3));
                    st.flipT = (harder ? 0.35 : 0.6) + S.rng() * (harder ? 0.9 : 1.4);
                    D.lastFlip = S.t;
                }
                if (Math.abs(st.x) > 6) st.v = -Math.sign(st.x) * Math.abs(st.v);
                st.x += st.v * dt;
                st.y = Math.sin(S.t * 1.7) * (harder ? 1.2 : 0.7);
                tt.root.position.set(base.x + st.x, base.y + st.y, base.z);
                tt.center = tt.root.position;
                tt.vel = V(st.v, Math.cos(S.t * 1.7) * 1.7 * (harder ? 1.2 : 0.7), 0);
            }
        }));
        tg.center = tg.root.position;
        tg.radius = 0.45;
        tg.ball = t.ball;
        tg.tracker = true;
        D.tracker = tg;
    }

    function aimStats(S) {
        const D = S.data;
        const flicks = D.flicks;
        const shots = D.shots.filter((s) => s.phase !== 'track');
        const hShots = shots.filter((s) => s.flickDir && Math.abs(s.flickDir.x) > Math.abs(s.flickDir.y));
        const mean = (a) => a.length ? a.reduce((p, q) => p + q, 0) / a.length : 0;
        const overL = mean(hShots.filter((s) => s.flickDir.x < 0).map((s) => -s.x));
        const overR = mean(hShots.filter((s) => s.flickDir.x > 0).map((s) => s.x));
        const over = mean(hShots.map((s) => s.x * Math.sign(s.flickDir.x)));
        const vShots = shots.filter((s) => s.flickDir && Math.abs(s.flickDir.y) >= Math.abs(s.flickDir.x));
        const overV = mean(vShots.map((s) => s.y * Math.sign(s.flickDir.y)));
        const hTimes = flicks.filter((f) => f.hit && Math.abs(f.dYaw) > Math.abs(f.dPitch) && Math.abs(f.dYaw) > 0.1).map((f) => f.time / (Math.abs(f.dYaw) * 57.3));
        const vTimes = flicks.filter((f) => f.hit && Math.abs(f.dPitch) >= Math.abs(f.dYaw) && Math.abs(f.dPitch) > 0.08).map((f) => f.time / (Math.abs(f.dPitch) * 57.3));
        const hMs = mean(hTimes) * 1000, vMs = mean(vTimes) * 1000;
        const flickHits = flicks.filter((f) => f.phase === 'flick' && f.hit).length;
        const flickTotal = flicks.filter((f) => f.phase === 'flick').length || 1;
        const microHits = flicks.filter((f) => f.phase === 'micro' && f.hit).length;
        const microTotal = flicks.filter((f) => f.phase === 'micro').length || 1;
        const trackPct = D.trackTotal ? D.trackOn / D.trackTotal : 0;
        const lag = D.trackLagN ? D.trackLag / D.trackLagN : 0;
        const flipPct = D.flipTotal ? D.flipOn / D.flipTotal : trackPct;
        const score = (v) => Math.round(BO.Math.clamp(v, 0, 100));
        const nFlick = flicks.filter((f) => f.phase === 'flick').length;
        const nMicro = flicks.filter((f) => f.phase === 'micro').length;
        const st = {
            flick: nFlick ? score(flickHits / flickTotal * 100) : null,
            overshoot: hShots.length >= 3 ? score(100 - Math.abs(over) * 140) : null,
            hspeed: hTimes.length ? score(130 - hMs * 2.2) : null,
            vspeed: vTimes.length ? score(130 - vMs * 2.2) : null,
            tracking: D.trackTotal > 1 ? score(trackPct * 115) : null,
            precision: nMicro ? score(microHits / microTotal * 100) : null
        };
        return { st, overL, overR, over, overV, hMs, vMs, trackPct, lag, flipPct, hN: hTimes.length, vN: vTimes.length };
    }

    function aimDiagnosis(r, drill) {
        const lines = [];
        const pct = (v) => Math.round(Math.abs(v) * 100) + '%';
        if (Math.abs(r.overL) > 0.15 || Math.abs(r.overR) > 0.15) {
            const side = Math.abs(r.overL) > Math.abs(r.overR) ? 'LEFT' : 'RIGHT';
            const v = side === 'LEFT' ? r.overL : r.overR;
            lines.push(v > 0 ? `You <b>overshoot ${side}</b>: flicks land ${pct(v)} of a target width past centre.` : `You <b>undershoot ${side}</b>: flicks stop ${pct(v)} of a target width short.`);
        } else lines.push('Horizontal flicks stop close to centre. <b>Good overshoot control.</b>');
        if (Math.abs(r.overV) > 0.18) lines.push(r.overV > 0 ? `Vertical flicks <b>overshoot</b> by ${pct(r.overV)} of a target.` : `Vertical flicks <b>fall short</b> by ${pct(r.overV)} of a target.`);
        if (r.hN && r.vN) {
            const ratio = r.vMs / Math.max(1, r.hMs);
            if (ratio > 1.2) lines.push(`You <b>flick slowly vertically</b>: ${Math.round((ratio - 1) * 100)}% slower per degree than horizontally (${r.vMs.toFixed(0)} vs ${r.hMs.toFixed(0)} ms/°).`);
            else if (ratio < 0.83) lines.push(`Horizontal flicks are ${Math.round((1 / ratio - 1) * 100)}% slower per degree than vertical ones.`);
            else lines.push(`Horizontal and vertical flick speed are balanced (${r.hMs.toFixed(0)} / ${r.vMs.toFixed(0)} ms per degree).`);
        }
        if (r.trackPct > 0) {
            if (r.trackPct < 0.45) lines.push(`You <b>track badly on strafing targets</b>: on target only ${Math.round(r.trackPct * 100)}% of the time.`);
            else lines.push(`Tracking: on target ${Math.round(r.trackPct * 100)}% of the time.`);
            if (r.lag < -0.25) lines.push('Your crosshair <b>trails behind</b> moving targets. Lead them more.');
            else if (r.lag > 0.25) lines.push('You <b>over-lead</b> moving targets and overcorrect on direction changes.');
            if (r.flipPct < r.trackPct - 0.12) lines.push(`Direction changes hurt you: ${Math.round(r.flipPct * 100)}% on target just after a strafe reversal.`);
        }
        return lines;
    }

    const STAT_DRILL = { overshoot: 'overshoot', vspeed: 'vertical', hspeed: 'speed', flick: 'speed', tracking: 'tracking', precision: 'precision' };
    function weakestStat(st) {
        let worst = null;
        for (const k of Object.keys(STAT_DRILL)) {
            if (st[k] === null || st[k] === undefined) continue;
            if (!worst || st[k] < st[worst]) worst = k;
        }
        return worst || 'overshoot';
    }
    function weakest(st) { return STAT_DRILL[weakestStat(st)]; }

    MG.register({
        id: 'aim_lab', cat: 'arcade', order: 5,
        name: 'Aim Diagnostics', icon: '🧪', accent: '#22d3ee',
        tagline: 'Test, diagnose, then drill your weakest stat',
        desc: 'A 60-second battery in a white test chamber: 20 seconds of flicks, 20 seconds tracking a strafing target and 20 seconds of micro targets. Afterwards you get a heatmap of where your shots landed relative to target centres, plus a written diagnosis: overshooting left or right, slow vertical flicks, trailing strafing targets. Then build a custom drill aimed at your weakest stat.',
        heroLabel: 'ARCADE HALL • TRAINING • 60 SECONDS', duration: 60,
        stars: [2500, 5000, 7500, 10000],
        standardWeapon: 'five_seven', lockWeapon: true, weaponLabel: 'FIVE-SEVEN (TEST PISTOL)', weaponNote: 'Bottomless magazine', infiniteMag: true, forgivingMisses: true,
        keys: [['LMB', 'Shoot'], ['HOLD AIM', 'Track the yellow target'], ['R', 'Retry']],
        map: {
            atmosphere: { skyTop: 0xe2e8f0, skyBottom: 0xf8fafc, fogColor: 0xf1f5f9, fogDensity: 0.004, sunColor: 0xffffff, sunIntensity: 1.2, sunPos: [10, 50, 20], hemiSky: 0xffffff, hemiGround: 0xcbd5e1, hemiIntensity: 1.3 },
            boxes: [B(0, -0.5, -8, 60, 1, 60, 'concrete')],
            spawn: { x: 0, y: 0, z: 0, yaw: 0 }
        },
        build(S) {
            const drill = S.opts.drill && DRILLS[S.opts.drill] ? S.opts.drill : null;
            Object.assign(S.data, { drill, flicks: [], shots: [], timeouts: 0, flickN: 0, trackOn: 0, trackTotal: 0, trackLag: 0, trackLagN: 0, flipOn: 0, flipTotal: 0, lastFlip: -9 });
            if (drill) { S.duration = 45; MG.opts.variantLabel = 'DRILL • ' + DRILLS[drill].label.toUpperCase(); }
            lockPlayer(0, 0, 0, 1.6);
            const grid = L.canvasTex('aimlab-grid', 128, 128, (g, w, h) => {
                g.fillStyle = '#f8fafc'; g.fillRect(0, 0, w, h);
                g.strokeStyle = '#cbd5e1'; g.lineWidth = 2; g.strokeRect(0, 0, w, h);
                g.strokeStyle = '#e2e8f0'; g.lineWidth = 1;
                g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
            });
            grid.wrapS = grid.wrapT = THREE.RepeatWrapping;
            const mk = (w, h, rep) => { const t = grid.clone(); t.needsUpdate = true; t.repeat.set(rep[0], rep[1]); t.userData.mgOwned = true; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }); };
            const room = [
                [0, 0.001, -12, 40, 40, -Math.PI / 2, 0, [20, 20]],
                [0, 9, -12, 40, 40, Math.PI / 2, 0, [20, 20]],
                [0, 4.5, -26, 40, 9, 0, 0, [20, 4.5]],
                [-20, 4.5, -12, 40, 9, 0, Math.PI / 2, [20, 4.5]],
                [20, 4.5, -12, 40, 9, 0, -Math.PI / 2, [20, 4.5]],
                [0, 4.5, 4, 40, 9, 0, Math.PI, [20, 4.5]]
            ];
            for (const [x, y, z, w, h, rx, ry, rep] of room) {
                const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mk(w, h, rep));
                m.position.set(x, y, z);
                m.rotation.set(rx, ry, 0);
                m.receiveShadow = true;
                S.add(m);
                S.solid(m);
            }
            const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.05, 32), basic(0x22d3ee));
            pad.position.set(0, 0.03, 0);
            S.add(pad);
            const title = A.sign(drill ? 'DRILL: ' + DRILLS[drill].label.toUpperCase() : 'AIM DIAGNOSTICS', 6, 0.8, { bg: '#0f172a', color: '#67e8f9', borderColor: '#22d3ee', size: 0.5 });
            title.position.set(0, 7.6, -25.9);
            S.add(title);
            S.data.phaseLbl = null;
        },
        onGo(S) {
            const D = S.data;
            if (D.drill && DRILLS[D.drill].phase === 'track') aimStartTrack(S);
            else aimNextFlick(S);
        },
        onShot(S) {
            const D = S.data;
            const ph = aimPhase(S);
            const ray = aimRay();
            let tg = null;
            if (ph === 'track') tg = D.tracker;
            else tg = D.active && D.active.alive ? D.active : null;
            if (!tg || !tg.center) return;
            const off = aimOffset(ray.origin, ray.dir, tg.center, tg.radius);
            if (!off) return;
            let flickDir = null;
            if (tg.flick) { const m = Math.hypot(tg.flick.dYaw, tg.flick.dPitch) || 1; flickDir = { x: -tg.flick.dYaw / m, y: tg.flick.dPitch / m }; }
            D.shots.push({ x: off.x, y: off.y, phase: ph, flickDir, hit: Math.hypot(off.x, off.y) <= 1.02 });
        },
        onHit(S, ent, info) {
            const D = S.data;
            if (!ent.mgTarget || !ent.alive) return false;
            if (ent.tracker) {
                S.hits++;
                S.award(15, null);
                SFX.tone(1200, 1100, 0.04, 'sine', 0.05);
                return true;
            }
            if (ent.flick) {
                const f = ent.flick;
                D.flicks.push({ dYaw: f.dYaw, dPitch: f.dPitch, time: S.t - f.born, hit: true, phase: f.phase });
                ent.flick = null;
            }
            S.hitTarget(ent, info);
            SFX.ding(f_pitch(ent));
            if (ent.onDone) setTimeout(() => ent.onDone(), 0);
            return true;
        },
        update(S, dt, lib, state) {
            const D = S.data;
            if (state !== 'running') return;
            const ph = aimPhase(S);
            if (ph !== D.phaseLbl) {
                const was = D.phaseLbl;
                D.phaseLbl = ph;
                if (was !== null) {
                    if (D.active && D.active.alive) { D.active.onExpire = null; D.active.remove(); }
                    if (ph === 'track') { aimStartTrack(S); MG.toast('PHASE 2 • TRACKING — HOLD ON THE TARGET', '#facc15'); }
                    else { if (D.tracker) { D.tracker.remove(); D.tracker = null; } MG.toast(ph === 'micro' ? 'PHASE 3 • MICRO PRECISION' : 'FLICK', '#f472b6'); aimNextFlick(S); }
                } else MG.toast(D.drill ? 'DRILL • ' + DRILLS[D.drill].label.toUpperCase() : 'PHASE 1 • FLICKS', '#67e8f9');
            }
            if (ph === 'track' && D.tracker) {
                const ray = aimRay();
                const tg = D.tracker;
                const off = aimOffset(ray.origin, ray.dir, tg.center, tg.radius);
                D.trackTotal += dt;
                const on = off && Math.hypot(off.x, off.y) <= 1.15;
                if (on) D.trackOn += dt;
                if (S.t - D.lastFlip < 0.5) { D.flipTotal += dt; if (on) D.flipOn += dt; }
                if (off && tg.vel && Math.hypot(off.x, off.y) < 4) {
                    const vm = Math.hypot(tg.vel.x, tg.vel.y) || 1;
                    D.trackLag += (off.x * tg.vel.x + off.y * tg.vel.y) / vm * dt;
                    D.trackLagN += dt;
                }
                if (tg.ball && tg.ball.material) tg.ball.material.emissiveIntensity = on ? 0.9 : 0.25;
                if (on) { S.data.trackPts = (S.data.trackPts || 0) + dt * 60; if (S.data.trackPts >= 10) { S.award(Math.floor(S.data.trackPts)); S.data.trackPts %= 1; } }
            }
        },
        hud(S) {
            const D = S.data;
            const ph = aimPhase(S);
            const name = D.drill ? 'DRILL • ' + DRILLS[D.drill].label : ph === 'flick' ? 'PHASE 1 • FLICKS' : ph === 'track' ? 'PHASE 2 • TRACKING' : 'PHASE 3 • MICRO';
            const tip = ph === 'track' ? 'Keep the crosshair on the yellow target' : ph === 'micro' ? 'Small and quick. Be precise.' : 'Snap to each target and fire';
            const trk = ph === 'track' && D.trackTotal > 0 ? `<div class="mgx-chip">ON TARGET <b>${Math.round(D.trackOn / D.trackTotal * 100)}%</b></div>` : '';
            return `<div class="mgx-aim"><div class="mgx-chip mgx-hot">${esc(name.toUpperCase())}</div><div class="mgx-chip">${tip}</div>${trk}</div>`;
        },
        result(S) {
            const D = S.data;
            // unresolved flicks count as misses
            const r = aimStats(S);
            const lines = aimDiagnosis(r, D.drill);
            const weak = weakest(r.st);
            const stars = this.stars.filter((th) => S.score >= th).length;
            const store = BO.Save.data.minigames || (BO.Save.data.minigames = { best: {}, plays: 0 });
            store.aimDiag = { st: r.st, at: Date.now(), weak };
            const labels = { flick: 'FLICK ACCURACY', overshoot: 'OVERSHOOT CONTROL', hspeed: 'HORIZONTAL SPEED', vspeed: 'VERTICAL SPEED', tracking: 'TRACKING', precision: 'MICRO PRECISION' };
            const wk = weakestStat(r.st);
            const bars = Object.keys(labels).map((k) => { const v = r.st[k]; return `<div class="mgx-stat ${k === wk ? 'weak' : ''} ${v === null ? 'na' : ''}"><span>${labels[k]}</span><div><i style="width:${v || 0}%"></i></div><b>${v === null ? '—' : v}</b></div>`; }).join('');
            const extraHtml = `<div class="mgx-diag"><div class="mgx-heat-wrap"><canvas id="mgx-heat" width="220" height="220"></canvas><small>SHOT PLACEMENT VS TARGET CENTRE</small></div>
                <div class="mgx-diag-right"><div class="mgx-stats">${bars}</div><ul class="mgx-notes">${lines.map((l) => `<li>${l}</li>`).join('')}</ul>
                <div class="mgx-drill-pick"><small>RECOMMENDED DRILL</small><b>${esc(DRILLS[weak].label)}</b><span>${esc(DRILLS[weak].desc)}</span></div></div></div>`;
            const shots = D.shots;
            return {
                score: S.score, stars,
                title: D.drill ? 'DRILL COMPLETE' : 'DIAGNOSIS READY',
                stats: [['SHOTS', S.shots], ['ACCURACY', S.shots ? Math.round(S.shotHits / S.shots * 100) + '%' : '—'], ['TARGETS', S.kills], ['TIMEOUTS', D.timeouts], ['TRACKING', Math.round(r.trackPct * 100) + '%'], ['WEAKEST', DRILLS[weak].label]],
                extraHtml, noGraph: true,
                actions: [{ id: 'drill', label: '▶ BUILD MY DRILL: ' + DRILLS[weak].label.toUpperCase() }, ...(D.drill ? [{ id: 'full', label: 'FULL DIAGNOSTIC' }] : [])],
                onAction: (id) => {
                    if (id === 'drill') MG.launch('aim_lab', { drill: weak, weapon: 'standard' });
                    else MG.launch('aim_lab', { weapon: 'standard' });
                },
                onShow: (el) => drawHeat(el.querySelector('#mgx-heat'), shots),
                xp: Math.round(120 + S.score * 0.04 + stars * 120)
            };
        }
    });

    function f_pitch(tg) { return tg.radius < 0.2 ? 1.35 : 1.0; }

    function drawHeat(cv, shots) {
        if (!cv) return;
        const g = cv.getContext('2d');
        const W = cv.width, H = cv.height, cx = W / 2, cy = H / 2, R = W / 2 / 2.6;   // 1 target radius in px
        g.fillStyle = '#020617'; g.fillRect(0, 0, W, H);
        // heat accumulation
        const heat = document.createElement('canvas');
        heat.width = W; heat.height = H;
        const hg = heat.getContext('2d');
        for (const s of shots) {
            const x = cx + BO.Math.clamp(s.x, -2.5, 2.5) * R, y = cy - BO.Math.clamp(s.y, -2.5, 2.5) * R;
            const gr = hg.createRadialGradient(x, y, 0, x, y, 22);
            gr.addColorStop(0, 'rgba(255,255,255,0.35)');
            gr.addColorStop(1, 'rgba(255,255,255,0)');
            hg.fillStyle = gr;
            hg.fillRect(x - 22, y - 22, 44, 44);
        }
        const img = hg.getImageData(0, 0, W, H);
        const out = g.getImageData(0, 0, W, H);
        for (let i = 0; i < img.data.length; i += 4) {
            const a = Math.min(1, img.data[i + 3] / 255 * 1.4);
            if (a <= 0.01) continue;
            // blue -> green -> yellow -> red
            const r = a < 0.5 ? 0 : (a - 0.5) * 2 * 255;
            const gg = a < 0.5 ? a * 2 * 255 : 255 - (a - 0.75 > 0 ? (a - 0.75) * 4 * 200 : 0);
            const b = a < 0.5 ? 255 - a * 2 * 255 : 0;
            out.data[i] = r * 0.9 + out.data[i] * 0.1;
            out.data[i + 1] = gg * 0.9 + out.data[i + 1] * 0.1;
            out.data[i + 2] = b * 0.9 + out.data[i + 2] * 0.1;
        }
        g.putImageData(out, 0, 0);
        // target rings
        g.strokeStyle = 'rgba(226,232,240,0.7)'; g.lineWidth = 2;
        g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
        g.strokeStyle = 'rgba(226,232,240,0.25)'; g.lineWidth = 1;
        g.beginPath(); g.arc(cx, cy, R * 2, 0, TAU); g.stroke();
        g.beginPath(); g.moveTo(cx - 8, cy); g.lineTo(cx + 8, cy); g.moveTo(cx, cy - 8); g.lineTo(cx, cy + 8); g.stroke();
        // dots
        for (const s of shots) {
            const x = cx + BO.Math.clamp(s.x, -2.5, 2.5) * R, y = cy - BO.Math.clamp(s.y, -2.5, 2.5) * R;
            g.fillStyle = s.hit ? '#e2e8f0' : '#f87171';
            g.fillRect(x - 1.5, y - 1.5, 3, 3);
        }
        // mean offset arrow
        if (shots.length) {
            const mx = shots.reduce((a, s) => a + BO.Math.clamp(s.x, -2.5, 2.5), 0) / shots.length;
            const my = shots.reduce((a, s) => a + BO.Math.clamp(s.y, -2.5, 2.5), 0) / shots.length;
            g.strokeStyle = '#facc15'; g.lineWidth = 2;
            g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + mx * R, cy - my * R); g.stroke();
            g.fillStyle = '#facc15'; g.beginPath(); g.arc(cx + mx * R, cy - my * R, 4, 0, TAU); g.fill();
        }
        g.fillStyle = '#94a3b8'; g.font = '10px monospace';
        g.fillText('L', 6, cy + 3); g.fillText('R', W - 12, cy + 3); g.fillText('UP', cx - 6, 12); g.fillText('DOWN', cx - 12, H - 6);
    }

    /* =====================================================================
       6. CONTRACTS
    ===================================================================== */
    const CONTRACTS = [
        {
            name: 'The Red Coat', time: 40, crowd: 12,
            brief: ['Wears a <b>long red coat</b>'], swatches: [0xb91c1c],
            target: { coat: 0xb91c1c, hat: null }, decoys: []
        },
        {
            name: 'The Courier', time: 40, crowd: 16,
            brief: ['Wears a <b>fedora</b>', 'Carries a <b>briefcase</b>'], swatches: [0x292524, 0x3f2a14],
            target: { hat: 'fedora', hatColor: 0x292524, briefcase: true, coat: 0x57534e },
            decoys: [{ hat: 'fedora', hatColor: 0x292524 }, { hat: 'fedora', hatColor: 0x292524 }, { briefcase: true }, { briefcase: true, coat: 0x57534e }]
        },
        {
            name: 'The Accountant', time: 35, crowd: 20, guards: 2,
            brief: ['<b>Bald</b>, wears <b>glasses</b>', 'Wears a <b>green tie</b>', 'Two bodyguards in black'], swatches: [0x15803d],
            target: { hair: null, glasses: true, tie: 0x15803d, shirt: 0xf8fafc, pants: 0x1f2937 },
            decoys: [{ hair: null, glasses: true, tie: 0x1e3a8a, shirt: 0xf8fafc }, { glasses: true, tie: 0x15803d, shirt: 0xf8fafc }, { hair: null, tie: 0x15803d, shirt: 0xf8fafc }, { hair: null, glasses: true }]
        },
        {
            name: 'The Caller', time: 35, crowd: 22,
            brief: ['Always <b>on the phone</b>', 'Wears a <b>blue cap</b>'], swatches: [0x1d4ed8],
            target: { hat: 'cap', hatColor: 0x1d4ed8, phone: true },
            decoys: [{ phone: true }, { phone: true, hat: 'cap', hatColor: 0x7f1d1d }, { hat: 'cap', hatColor: 0x1d4ed8 }, { hat: 'cap', hatColor: 0x1d4ed8 }, { phone: true, hat: 'beanie', hatColor: 0x1d4ed8 }]
        },
        {
            name: 'The Twins', time: 35, crowd: 24, targets: 2,
            brief: ['<b>Two targets</b>: eliminate both', 'Yellow <b>beanie</b> and <b>sunglasses</b>'], swatches: [0xfacc15, 0x0a0a0a],
            target: { hat: 'beanie', hatColor: 0xfacc15, glasses: 'shades' },
            decoys: [{ hat: 'beanie', hatColor: 0xfacc15 }, { hat: 'beanie', hatColor: 0xfacc15 }, { glasses: 'shades' }, { glasses: 'shades', hat: 'beanie', hatColor: 0xea580c }, { glasses: 'shades' }]
        },
        {
            name: 'The Ghost', time: 30, crowd: 26, guards: 2, escape: true,
            brief: ['<b>Top hat</b> and <b>grey long coat</b>', 'Keeps <b>checking his watch</b>', 'Heading for the black car. Don\'t let him reach it'], swatches: [0x6b7280, 0x111111],
            target: { hat: 'tophat', hatColor: 0x111111, coat: 0x6b7280, watch: true },
            decoys: [{ coat: 0x6b7280 }, { coat: 0x6b7280, watch: true }, { hat: 'tophat', hatColor: 0x111111, coat: 0x1e3a8a }, { hat: 'tophat', hatColor: 0x111111 }, { watch: true }, { watch: true, coat: 0x52525b }]
        }
    ];
    const PLAZA = { x1: -22, x2: 22, z1: -58, z2: -24, fz: -41, fr: 4.2 };
    const CAR = V(24, 0, -52);

    function plazaPoint(rng) {
        for (let i = 0; i < 20; i++) {
            const x = lerp(PLAZA.x1, PLAZA.x2, rng()), z = lerp(PLAZA.z1, PLAZA.z2, rng());
            if (Math.hypot(x, z - PLAZA.fz) > PLAZA.fr + 1) return V(x, 0, z);
        }
        return V(10, 0, -30);
    }

    function cleanCiv(rng, extra) {
        const o = F.randomCivilian(rng);
        // Strip every contract-identifiable trait so no civilian or decoy can accidentally clone the mark!
        o.hat = null;
        o.glasses = false;
        o.coat = null;
        o.tie = null;
        o.briefcase = false;
        o.phone = false;
        o.hair = o.hair || 0x3b2416;
        if (o.shirt === 0xdc2626 || o.shirt === 0xb91c1c) o.shirt = 0x334155;
        return Object.assign(o, extra || {});
    }

    function spawnWalker(S, role, look, rng, guardIdx = 0) {
        const D = S.data;
        const o = Object.assign({}, look);
        const watch = o.watch; delete o.watch;
        if (role === 'guard') Object.assign(o, { shirt: 0xf8fafc, coat: 0x0a0a0a, pants: 0x0a0a0a, tie: 0x0a0a0a, glasses: 'shades', hair: 0x111111 });
        const fig = F.human(o);
        if (o.phone) F.pose(fig, 'phone');
        const gSide = (guardIdx % 2 === 0) ? -1.75 : 1.75;
        const pos = role === 'guard' && D.targetsLeft.length ? D.targetsLeft[0].root.position.clone().add(V(gSide, 0, 1.1)) : plazaPoint(rng);
        const st = { goal: plazaPoint(rng), speed: 1.0 + rng() * 0.6, wait: rng() * 2, ph: rng() * 6, watchT: 2 + rng() * 4, watching: 0, warnedEscape: false };
        const contract = CONTRACTS[D.mission];
        const tg = S.addTarget({
            mesh: fig.root, hitMeshes: fig.hit, pos, yaw: rng() * TAU, points: 0, life: 0, appear: 'none', inT: 0.01, death: 'knock', deathColor: 0x7f1d1d,
            onTick: (t, dt) => {
                if (MG.state !== 'running' && MG.state !== 'finish') return;
                const panic = D.panic > 0;
                if (st.wait > 0 && !panic) { st.wait -= dt; F.walk(fig, st.ph, 0.05); return; }
                let goal = st.goal;
                if (role === 'target' && contract.escape && D.phase === 'live' && S.t - D.liveAt > 8) {
                    goal = CAR;
                    if (!st.warnedEscape) {
                        st.warnedEscape = true;
                        MG.toast('⚠ TARGET MOVING TO THE BLACK GETAWAY CAR (RIGHT SIDE)!', '#fca5a5');
                        SFX.tone(720, 520, 0.22, 'sawtooth', 0.08);
                    }
                }
                if (role === 'guard' && D.targetsLeft.length && D.targetsLeft[0].alive) goal = D.targetsLeft[0].root.position.clone().add(V(gSide, 0, 1.2));
                const p = t.root.position;
                const dx = goal.x - p.x, dz = goal.z - p.z;
                const d = Math.hypot(dx, dz);
                let sp = st.speed * (panic ? 2.4 : 1) * (role === 'guard' && d > 3 ? 1.35 : 1);
                // The fleeing mark paces himself to reach the car ~6 s before the contract clock runs out,
                // so the escape is a real threat rather than something the timer always beats.
                if (goal === CAR && D.phase === 'live') sp = Math.max(sp, d / Math.max(2, contract.time - 6 - (S.t - D.liveAt)));
                if (d < 0.6) {
                    if (role === 'target' && contract.escape && goal === CAR && D.phase === 'live') { contractFail(S, 'THE TARGET ESCAPED'); return; }
                    st.goal = plazaPoint(rng);
                    st.wait = role === 'guard' ? 0 : rng() < 0.4 ? 1 + rng() * 2.5 : 0;
                    return;
                }
                if (role === 'guard' && d < 1.5) { F.walk(fig, st.ph, 0.05); return; }
                let nx = p.x + dx / d * sp * dt, nz = p.z + dz / d * sp * dt;
                // walk around the fountain: slide along its rim instead of freezing in place
                // (the escaping mark and the bodyguards keep a fixed goal, so re-rolling it is not enough)
                const fr = Math.hypot(nx, nz - PLAZA.fz);
                if (fr < PLAZA.fr + 0.6) {
                    const ox = nx / fr, oz = (nz - PLAZA.fz) / fr;
                    const side = (dx * oz - dz * ox) >= 0 ? 1 : -1;
                    nx = p.x + oz * side * sp * dt;
                    nz = p.z - ox * side * sp * dt;
                    const r2 = Math.hypot(nx, nz - PLAZA.fz);
                    if (r2 < PLAZA.fr + 0.6) { nx = nx / r2 * (PLAZA.fr + 0.62); nz = PLAZA.fz + (nz - PLAZA.fz) / r2 * (PLAZA.fr + 0.62); }
                    if (role === 'civ') st.goal = plazaPoint(rng);
                }
                p.x = nx; p.z = nz;
                t.root.rotation.y += wrapA(Math.atan2(dx, dz) - t.root.rotation.y) * Math.min(1, dt * 6);
                st.ph += dt * sp * 4.2;
                F.walk(fig, st.ph, 1, panic);
                if (panic && role === 'civ' && D.panic > 2.8) {
                    F.pose(fig, 'handsUp');
                } else if (!panic && role === 'civ' && fig.armsBusy && !o.phone && !watch) {
                    F.pose(fig, 'idle');
                }
                if (watch) {
                    st.watchT -= dt;
                    if (st.watchT <= 0 && st.watching <= 0) { st.watching = 1.3; }
                    if (st.watching > 0) {
                        st.watching -= dt;
                        F.pose(fig, 'watch');
                        if (st.watching <= 0) { F.pose(fig, o.phone ? 'phone' : 'idle'); fig.parts.headG.rotation.x = 0; st.watchT = 2.5 + rng() * 2.5; }
                    }
                }
            }
        });
        tg.role = role;
        tg.fig = fig;
        D.walkers.push(tg);
        return tg;
    }

    function contractStart(S) {
        const D = S.data;
        for (const w of D.walkers) w.remove();
        D.walkers = [];
        D.targetsLeft = [];
        const c = CONTRACTS[D.mission];
        const rng = L.mulberry32(5150 + D.mission * 71);
        const nT = c.targets || 1;
        for (let i = 0; i < nT; i++) D.targetsLeft.push(spawnWalker(S, 'target', cleanCiv(rng, c.target), rng, i));
        for (let i = 0; i < (c.guards || 0); i++) spawnWalker(S, 'guard', {}, rng, i);
        const decoys = c.decoys || [];
        for (let i = 0; i < c.crowd; i++) {
            const look = cleanCiv(rng, i < decoys.length * 2 ? decoys[i % decoys.length] : null);
            spawnWalker(S, 'civ', look, rng, i);
        }
        if (D.carSign) D.carSign.visible = !!c.escape;
        D.phase = 'brief';
        D.briefT = 5.5;
        D.panic = 0;
        D.intelCd = 0;
        D.missionShots = S.shots;
        D.missionHead = false;
        SFX.tone(440, 440, 0.2, 'sine', 0.08);
        SFX.tone(660, 660, 0.3, 'sine', 0.08, 0.15);
    }

    function contractFail(S, why) {
        const D = S.data;
        if (D.phase !== 'live') return;
        D.phase = 'failed';
        D.failWhy = why;
        D.panic = 99;
        SFX.buzzer();
        MG.flashScreen('rgba(220,38,38,0.3)');
        MG.finish('CONTRACT FAILED', { color: '#f87171', delay: 2.4 });
    }

    function contractDone(S) {
        const D = S.data;
        const c = CONTRACTS[D.mission];
        const left = Math.max(0, c.time - (S.t - D.liveAt));
        const shots = S.shots - D.missionShots;
        const nT = c.targets || 1;
        let pts = 1000 * (D.mission + 1) + Math.round(left * 50);
        const notes = [];
        if (shots <= nT) { pts += 1000; notes.push('SILENT ASSASSIN'); }
        if (D.missionHead) { pts += 500; notes.push('HEADSHOT'); }
        S.award(pts, BO.App.worldCamera.position.clone().add(fwdOf(BO.Player.yaw).multiplyScalar(6)), notes.join(' • ') || 'CONTRACT COMPLETE', '#fde68a');
        S.bumpCombo();
        D.completed++;
        D.log.push({ name: c.name, time: c.time - left, shots, silent: shots <= nT });
        D.phase = 'done';
        D.panic = 4;
        SFX.fanfare();
        MG._showCountdown('CONTRACT COMPLETE', '#86efac');
        D.lastLeft = left;
        D.lastTime = c.time;
        if (D.single >= 0) MG.finish('CONTRACT COMPLETE', { color: '#86efac', delay: 2.6 });
        else if (D.mission >= CONTRACTS.length - 1) MG.finish('ALL CONTRACTS COMPLETE', { color: '#facc15', delay: 2.6 });
        else D.nextT = 3;
    }

    MG.register({
        id: 'contracts', cat: 'arcade', order: 6,
        name: 'Contracts', icon: '🎩', accent: '#64748b',
        tagline: 'Read the dossier. Find the mark. One shot.',
        desc: 'Six assassination contracts from a rooftop over a busy plaza. Each opens with a dossier: what the mark wears, carries or does. Scan the crowd through the scope and take out the right person. Decoys share some of the traits. Later contracts add bodyguards, two marks at once, and a target who will escape if he reaches his car. Hit a civilian or run out of time and the run ends.',
        heroLabel: 'ARCADE HALL • 6 MISSIONS', duration: 0,
        stars: [2, 3, 5, 6], starLabel: (th) => typeof th === 'string' ? th : th + ' / 6 CONTRACTS',
        standardWeapon: 'intervention', lockWeapon: true, weaponLabel: 'INTERVENTION .408', weaponNote: 'Bolt-action with scope • [A/D] Strafe Rooftop • [Q] Spotter Intel • [SPACE] Skip Brief', forgivingMisses: true, customMusic: true,
        oneTargetPerShot: true,
        hubOptions: [{
            key: 'contract', label: 'CONTRACT', default: 'all',
            choices: [{ val: 'all', label: 'FULL RUN', desc: 'All six contracts back to back. A civilian casualty or a timeout ends the run.' }]
                .concat(CONTRACTS.map((c, i) => ({ val: 'c' + (i + 1), label: (i + 1) + ' • ' + c.name.toUpperCase(), desc: 'Practise one contract on its own: ' + c.brief.join(', ').replace(/<[^>]+>/g, '') + '.' })))
        }],
        variantKey: (o) => (o.contract && o.contract !== 'all' ? o.contract : ''),
        variantLabel: (o) => (o.contract && o.contract !== 'all' ? 'CONTRACT ' + o.contract.slice(1) : 'FULL RUN'),
        starsFor: (o) => (o.contract && o.contract !== 'all' ? ['COMPLETE', 'SILENT', 'HEADSHOT', 'HALF TIME LEFT'] : [2, 3, 5, 6]),
        formatBest: (b) => (b.extra && b.extra.single ? (b.extra.done ? 'Complete • ' : 'Failed • ') : b.extra ? b.extra.done + '/6 contracts • ' : '') + Number(b.score).toLocaleString(),
        keys: [['RMB', 'Scope'], ['LMB', 'Fire'], ['A / D', 'Strafe Rooftop Ledge'], ['Q', 'Spotter Intel Ping (10s)'], ['SPACE', 'Skip Briefing']],
        map: {
            atmosphere: { skyTop: 0x1e3a8a, skyBottom: 0xfbcfe8, fogColor: 0xd8c8d8, fogDensity: 0.0052, sunColor: 0xffe2c0, sunIntensity: 1.75, sunPos: [-40, 40, -30], hemiSky: 0xfde68a, hemiGround: 0x57534e, hemiIntensity: 0.9 },
            boxes: [B(0, -0.5, -30, 160, 1, 160, 'concrete')],
            spawn: { x: 0, y: 12, z: 0, yaw: 0 }
        },
        build(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.start('contracts');
            const D = S.data;
            const pick = /^c([1-6])$/.exec(S.opts.contract || '');
            Object.assign(D, { mission: pick ? +pick[1] - 1 : 0, single: pick ? +pick[1] - 1 : -1, walkers: [], targetsLeft: [], completed: 0, log: [], phase: 'brief', panic: 0, roofX: 0, intelCd: 0 });
            lockPlayer(0, 12, 0.3, 1.6);
            BO.Player.pitch = -0.32;
            // rooftop (lowered parapet so downward sniper shots are never obstructed!)
            S.box(0, 6, 4, 15, 12, 8, std(0x78716c, 0.9), { solid: true });
            S.box(0, 12.32, -0.15, 15, 0.64, 0.3, std(0x57534e, 0.9), { solid: false, collide: false });
            const ac = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.2), std(0x9ca3af, 0.5, 0.6));
            ac.position.set(-5.5, 12.6, 3);
            S.add(ac);
            // plaza
            const stone = L.canvasTex('plaza-stone', 256, 256, (g, w, h) => {
                g.fillStyle = '#d6d3d1'; g.fillRect(0, 0, w, h);
                for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x * 3 + y * 5) % 7 < 2 ? '#c7c2bd' : '#e7e5e4'; g.fillRect(x * 32 + 1, y * 32 + 1, 30, 30); }
            });
            stone.wrapS = stone.wrapT = THREE.RepeatWrapping;
            stone.repeat.set(12, 10);
            const plaza = new THREE.Mesh(new THREE.PlaneGeometry(60, 50), new THREE.MeshStandardMaterial({ map: stone, roughness: 0.9 }));
            plaza.rotation.x = -Math.PI / 2;
            plaza.position.set(0, 0.01, -41);
            plaza.receiveShadow = true;
            S.add(plaza);
            S.solid(plaza);
            // fountain
            const basin = new THREE.Mesh(new THREE.CylinderGeometry(PLAZA.fr, PLAZA.fr + 0.3, 0.8, 32), std(0xa8a29e, 0.7));
            basin.position.set(0, 0.4, PLAZA.fz);
            S.add(basin); S.solid(basin);
            const water = new THREE.Mesh(new THREE.CircleGeometry(PLAZA.fr - 0.2, 32), new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.3 }));
            water.rotation.x = -Math.PI / 2;
            water.position.set(0, 0.75, PLAZA.fz);
            S.add(water);
            const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 2.6, 12), std(0xa8a29e, 0.7));
            spire.position.set(0, 1.9, PLAZA.fz);
            S.add(spire); S.solid(spire);
            // Warm European Market String Lights crisscrossing the plaza!
            const strPts = [
                ...A.sagPoints(V(-24, 6.2, -26), V(24, 6.2, -26), 14, 1.1),
                ...A.sagPoints(V(-24, 6.2, -56), V(24, 6.2, -56), 14, 1.1)
            ];
            const plazaBulbs = A.bulbs(strPts, [0xfef08a, 0xfdba74, 0xffffff], 0.14);
            S.add(plazaBulbs); A.animateBulbs(S, plazaBulbs, 4, 'chase');
            // trees (kept clear of the right-side getaway car sightline!), benches, lamps, market stalls
            const rnd = L.mulberry32(77);
            for (const [x, z] of [[-24, -26], [-24, -58], [-24, -42], [-10, -60], [10, -60]]) { const t = A.tree(1.6 + rnd() * 0.5); t.position.set(x, 0, z); S.add(t); }
            for (let i = 0; i < 8; i++) {
                const a = i / 8 * TAU;
                const bench = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 0.5), std(0x7c4a1e, 0.8));
                bench.position.set(Math.cos(a) * 7.5, 0.25, PLAZA.fz + Math.sin(a) * 7.5);
                bench.rotation.y = -a + Math.PI / 2;
                S.add(bench);
                const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 4, 6), std(0x18181b, 0.4, 0.7));
                lamp.position.set(Math.cos(a + 0.4) * 11, 2, PLAZA.fz + Math.sin(a + 0.4) * 11);
                const globe = new THREE.Mesh(new THREE.SphereGeometry(0.20, 8, 6), basic(0xfef08a));
                globe.position.set(Math.cos(a + 0.4) * 11, 4.1, PLAZA.fz + Math.sin(a + 0.4) * 11);
                S.add(lamp, globe);
            }
            const stallCols = ['#dc2626', '#2563eb', '#16a34a', '#f59e0b', '#9333ea'];
            for (let i = 0; i < 5; i++) {
                const c = stallCols[i];
                const tex = L.canvasTex('stall:' + c, 128, 16, (g, w, h) => { for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#fff' : c; g.fillRect(k * 16, 0, 16, h); } });
                const st = new THREE.Group();
                const counter = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 1.2), std(0x92400e, 0.8));
                counter.position.y = 0.5;
                const roof = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.1, 2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }));
                roof.position.y = 2.6;
                roof.rotation.x = 0.2;
                st.add(counter, roof);
                for (const sx of [-1.5, 1.5]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6), std(0xe5e7eb, 0.5)); p.position.set(sx, 1.3, -0.7); st.add(p); }
                st.position.set(-18 + i * 9, 0, -61);
                S.add(st);
            }
            // surrounding buildings
            for (let i = 0; i < 10; i++) {
                const side = i < 5 ? -1 : 1;
                const h = 10 + (i * 7) % 12;
                const b = A.building(10, h, 10, [0xd6d3d1, 0xfde68a, 0xfca5a5, 0xbfdbfe, 0xe7e5e4][i % 5], i + 3, 0.3, false);
                b.position.set(side * 34, h / 2, -20 - (i % 5) * 11);
                S.add(b);
            }
            for (let i = 0; i < 5; i++) {
                const b = A.building(11, 12 + i * 2, 10, [0xe7e5e4, 0xd6d3d1, 0xfde68a][i % 3], 20 + i, 0.3, false);
                b.position.set(-24 + i * 12, (12 + i * 2) / 2, -72);
                S.add(b);
            }
            // the getaway car (with glowing brake lights + visible sign on Contract 6!)
            const car = new THREE.Group();
            const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.9, 4.6), std(0x0a0a0a, 0.2, 0.6));
            body.position.y = 0.7;
            const cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 2.4), std(0x1e293b, 0.1, 0.5));
            cab.position.set(0, 1.45, -0.2);
            car.add(body, cab);
            for (const sx of [-0.7, 0.7]) {
                const tl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.08), basic(0xef4444));
                tl.position.set(sx, 0.85, 2.32); car.add(tl);
            }
            for (const [x, z] of [[-1, 1.5], [1, 1.5], [-1, -1.5], [1, -1.5]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12), std(0x111111, 0.8)); w.rotation.z = Math.PI / 2; w.position.set(x, 0.4, z); car.add(w); }
            car.position.copy(CAR).add(V(1.6, 0, 0));
            const carSign = labelSprite('🚗 GETAWAY CAR', '#f87171');
            carSign.position.set(0, 2.8, 0); carSign.visible = false; car.add(carSign);
            D.carSign = carSign;
            S.add(car);
            contractStart(S);
        },
        dispose() { if (BO.MinigameAudio) BO.MinigameAudio.stop(); },
        onKey(S, code) {
            const D = S.data;
            if (MG.state !== 'running') return false;
            if (D.phase === 'brief' && (code === 'Space' || code === 'KeyE')) {
                D.briefT = 0; return true;
            }
            if (D.phase === 'live' && code === 'KeyQ' && D.intelCd <= 0 && D.targetsLeft.length) {
                D.intelCd = 10.0;
                const tgt = D.targetsLeft[0];
                const p = tgt.root.position;
                const quad = (p.z < PLAZA.fz ? 'NORTH' : 'SOUTH') + '-' + (p.x < 0 ? 'WEST' : 'EAST');
                SFX.ding(1.3);
                MG.toast(`📡 SPOTTER INTEL: MARK SPOTTED IN ${quad} PLAZA!`, '#fde047');
                const ring = new THREE.Mesh(new THREE.RingGeometry(0.7, 1.1, 24), basic(0xfde047, { side: THREE.DoubleSide, transparent: true, opacity: 0.9 }));
                ring.rotation.x = -Math.PI / 2; ring.position.set(p.x, 0.08, p.z); S.add(ring);
                let rt = 0; S.animate((dt2) => { rt += dt2; ring.position.set(tgt.root.position.x, 0.08, tgt.root.position.z); ring.scale.setScalar(1 + Math.sin(rt * 12) * 0.15); if (rt > 1.8 || !tgt.alive) { S.scene.remove(ring); return false; } });
                return true;
            }
            return false;
        },
        blockFire(S) { return S.data.phase !== 'live'; },
        update(S, dt, lib, state) {
            const D = S.data, P = BO.Player;
            if (state !== 'running') return;
            D.panic = Math.max(0, D.panic - dt);
            D.intelCd = Math.max(0, (D.intelCd || 0) - dt);
            // Smooth lateral rooftop strafing [A/D] to peek around fountain & stalls!
            const strafe = (P.keys.KeyD || P.keys.ArrowRight ? 1 : 0) - (P.keys.KeyA || P.keys.ArrowLeft ? 1 : 0);
            if (strafe && P.rideState) {
                D.roofX = BO.Math.clamp((D.roofX || 0) + strafe * 5.2 * dt, -6.2, 6.2);
                P.rideState.pos.x = D.roofX;
            }
            // Fountain water spray particles
            if (Math.random() < dt * 10) BO.FX.spawnParticles(V(0, 3.25, PLAZA.fz), 1, 0xbae6fd, 1.6, 2.2, 0.55, 0.55);
            const c = CONTRACTS[D.mission];
            const left = D.phase === 'live' ? Math.max(0, c.time - (S.t - D.liveAt)) : c.time;
            if (BO.MinigameAudio) BO.MinigameAudio.tick(dt, { urgent: D.phase === 'live' && (left < 10 || D.panic > 0) });
            if (D.phase === 'brief') {
                D.briefT -= dt;
                if (D.briefT <= 0) { D.phase = 'live'; D.liveAt = S.t; MG._showCountdown('GO', '#fde68a'); }
            } else if (D.phase === 'live') {
                if (S.t - D.liveAt > c.time) contractFail(S, 'OUT OF TIME');
            } else if (D.phase === 'done') {
                D.nextT -= dt;
                if (D.single < 0 && D.nextT <= 0 && D.mission < CONTRACTS.length - 1) { D.mission++; contractStart(S); }
            }
        },
        onShot(S) {
            const D = S.data;
            const before = S.hits;
            setTimeout(() => {
                if (MG.session !== S || D.phase !== 'live') return;
                if (S.hits === before) { D.panic = 4; MG.toast('MISSED — THE CROWD IS PANICKING', '#fca5a5'); }
            }, 0);
        },
        onHit(S, ent, info) {
            const D = S.data;
            if (!ent.mgTarget || !ent.alive || D.phase !== 'live') return false;
            S.hits++;
            if (ent.role === 'target') {
                if (info.hitbox === 'head') { D.missionHead = true; S.headshots++; }
                ent.kill(info);
                S.kills++;
                SFX.thunk();
                D.targetsLeft = D.targetsLeft.filter((t) => t.alive);
                if (!D.targetsLeft.length) contractDone(S);
                else { MG.toast('ONE DOWN • ONE TO GO', '#fde68a'); D.panic = 3; }
            } else if (ent.role === 'guard') {
                ent.kill(info);
                S.award(-300, info.pt, 'BODYGUARD', '#fca5a5');
                S.breakCombo('WRONG MAN');
                D.panic = 5;
                SFX.thunk();
            } else {
                ent.kill(info);
                S.penalties++;
                contractFail(S, 'CIVILIAN CASUALTY');
            }
            return true;
        },
        hud(S) {
            const D = S.data;
            const c = CONTRACTS[D.mission];
            const sw = (c.swatches || []).map((h) => `<i style="background:#${h.toString(16).padStart(6, '0')}"></i>`).join('');
            const left = D.phase === 'live' ? Math.max(0, c.time - (S.t - D.liveAt)) : c.time;
            const card = `<div class="mgx-dossier ${D.phase === 'brief' ? 'big' : ''}"><small>CONTRACT ${D.mission + 1} / ${CONTRACTS.length}</small><h3>${esc(c.name.toUpperCase())}</h3>
                <ul>${c.brief.map((b) => `<li>${b}</li>`).join('')}</ul><div class="mgx-sw">${sw}</div>
                ${D.phase === 'brief' ? `<div class="mgx-brief-go">STARTS IN ${Math.ceil(D.briefT)} • [SPACE] READY</div><em>Shoot only the mark. A civilian casualty ends the run.</em>` : ''}</div>`;
            const timer = D.phase === 'live' ? `<div class="mgx-chip ${left < 10 ? 'mgx-bad' : ''}">CONTRACT TIME <b>${left.toFixed(left < 10 ? 1 : 0)}</b></div>` : '';
            const intel = D.phase === 'live' ? `<div class="mgx-chip ${(D.intelCd || 0) <= 0 ? 'mgx-hot' : ''}">INTEL [Q] <b>${(D.intelCd || 0) <= 0 ? 'READY' : D.intelCd.toFixed(0) + 's'}</b></div>` : '';
            const fail = D.phase === 'failed' ? `<div class="mgx-chip mgx-bad">${esc(D.failWhy || '')}</div>` : '';
            return card + `<div class="mgx-contract-row">${timer}${intel}${fail}<div class="mgx-chip">COMPLETED <b>${D.completed}</b></div></div>`;
        },
        scoreText(S) { return Math.round(S.displayScore).toLocaleString(); },
        result(S) {
            const D = S.data;
            if (D.single >= 0) {
                const log = D.log[0];
                const stars = log ? 1 + (log.silent ? 1 : 0) + (D.missionHead ? 1 : 0) + (D.lastLeft >= D.lastTime / 2 ? 1 : 0) : 0;
                return {
                    score: S.score, stars, saveExtra: { done: D.completed, single: true },
                    title: log ? (stars === 4 ? 'FLAWLESS HIT' : 'CONTRACT COMPLETE') : 'CONTRACT FAILED',
                    stats: [
                        ['CONTRACT', CONTRACTS[D.single].name.toUpperCase()], ['RESULT', log ? 'COMPLETE' : (D.failWhy || 'FAILED')], ['SILENT', log && log.silent ? 'YES' : 'NO'],
                        ['HEADSHOT', D.missionHead ? 'YES' : 'NO'], ['SHOTS FIRED', S.shots], ['TIME LEFT', log ? D.lastLeft.toFixed(1) + 's' : '—']
                    ],
                    noGraph: true,
                    xp: Math.round(60 + (log ? 120 : 0) + stars * 40)
                };
            }
            const stars = this.stars.filter((th) => D.completed >= th).length;
            return {
                score: S.score, stars, saveExtra: { done: D.completed },
                title: D.completed === 6 ? 'MASTER ASSASSIN' : D.completed >= 5 ? 'PROFESSIONAL' : D.completed >= 3 ? 'HITMAN-FOR-HIRE' : D.completed >= 2 ? 'APPRENTICE' : 'CONTRACT TERMINATED',
                stats: [
                    ['CONTRACTS', D.completed + ' / 6'], ['SILENT KILLS', D.log.filter((l) => l.silent).length], ['HEADSHOTS', S.headshots],
                    ['SHOTS FIRED', S.shots], ['ENDED BY', D.phase === 'failed' ? (D.failWhy || '—') : 'COMPLETE'], ['TIME', BO.Math.formatTime(S.t)]
                ],
                noGraph: true,
                xp: Math.round(120 + D.completed * 120 + stars * 100)
            };
        }
    });
})(window);
