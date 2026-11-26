/* ============================================================================
   BLACKOUT OPS — MINIGAMES: FUN SECTION (Part 2: 4–5)
     4. 360 Trick Shot — rooftop jump-down 360 spin + 0.5s fire window + miss respawn + slow-mo killcam
     5. Mario FPS      — Faithful 1-1, 1-2, 1-3, 1-4 + Chiptune Music + Sign + FAMAS/Deagle + 3-Form Bowser
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const L = BO.MinigameLib;
    const A = BO.MinigameArt;
    const K = BO.MGCourseKit;
    const F = BO.MGFigures;
    const { B, SFX, std, basic, TAU } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);

    /* =====================================================================
       4. 360 TRICK SHOT — Jump Down + Mid-Air 360° + 0.5s Window + Miss Respawn
    ===================================================================== */
    const TOWER_H = 26;
    MG.register({
        id: 'fun_360_trickshot', cat: 'fun', order: 4, name: '360 Trick Shot', icon: '🌀', accent: '#f59e0b', badge: 'SKILL',
        tagline: 'Jump off the tower! Spin 360° mid-air & shoot inside 0.5s—or respawn at the top!',
        desc: 'Leap off the open ledge of a 26-metre crane tower down toward the moving target in the floodlit yard below. Spin a full 360° IN MID-AIR to unlock your sniper for ONLY 0.5 SECONDS (1s max quickscope). Land the mid-air kill for an epic slow-mo Killcam—miss and hit the floor, and you immediately respawn back at the top!',
        heroLabel: 'FUN • LEAP QUICKSCOPE KILLCAM • 5 ROUNDS', duration: 120, stars: [1800, 3600, 5600, 8200],
        standardWeapon: 'intervention', lockWeapon: true, infiniteMag: true, maxScopeTime: 1.0,
        blockFire: (S) => !(S && S.data && S.data.armedT > 0) || !!(S && S.data && S.data.killcamT > 0),
        weaponLabel: 'INTERVENTION .408 (MID-AIR 360)', weaponNote: 'Must jump down + spin 360° mid-air • 0.5s fire window!',
        keys: [['W + SPACE', 'Jump off open ledge'], ['MOUSE', 'Spin 360° mid-air'], ['RMB', 'Quickscope (1s max)'], ['LMB', 'Fire inside 0.5s window!']],
        map: {
            atmosphere: { skyTop: 0x0f172a, skyBottom: 0xea580c, fogColor: 0x431407, fogDensity: 0.0045, sunColor: 0xfdba74, sunIntensity: 1.55, sunPos: [-40, 28, -40], hemiSky: 0xfdba74, hemiGround: 0x1e293b, hemiIntensity: 0.9 },
            boxes: [B(0, -0.5, -16, 130, 1, 130, 'concrete'), B(0, TOWER_H * 0.5, 0, 5.6, TOWER_H, 5.6, 'concrete')],
            spawn: { x: 0, y: TOWER_H + 0.15, z: 0.6, yaw: 0 }
        },
        build(S) {
            K.groundPlane(S, 130, 0x1e293b, 0.002);
            const steelM = std(0x475569, 0.4, 0.75), railM = std(0xfacc15, 0.4, 0.6);
            // Crane tower trusses & 3 safety rails ONLY (Front ledge z = -2.8 is OPEN for jumping down!)
            for (const [x1, z1, x2, z2] of [[-2.7, 2.7, 2.7, 2.8], [-2.8, -2.7, -2.65, 2.8], [2.65, -2.7, 2.8, 2.8]]) {
                const bar = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x2 - x1), 1.0, Math.abs(z2 - z1)), railM);
                bar.position.set((x1 + x2) / 2, TOWER_H + 0.5, (z1 + z2) / 2); S.add(bar);
                S.collider(x1, TOWER_H, z1, x2, TOWER_H + 3, z2);
            }
            const arrow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.8), basic(0xfacc15));
            arrow.rotation.x = -Math.PI / 2; arrow.position.set(0, TOWER_H + 0.03, -1.7); S.add(arrow);
            const towerSign = A.sign('JUMP OFF -> 360° -> 0.5s WINDOW!', 5.8, 0.85, { bg: '#451a03', color: '#fef08a', borderColor: '#facc15', size: 0.44 });
            towerSign.position.set(0, TOWER_H + 3.6, -2.7); S.add(towerSign);
            for (const sx of [-2.8, 2.8]) {
                const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.6, 0.35), steelM);
                post.position.set(sx, TOWER_H + 1.8, -2.7); S.add(post);
            }
            // Shipping containers & floodlights in courtyard below
            for (const [cx, cz, col, w, d] of [[-16, -20, 0xb91c1c, 3.2, 8.5], [16, -22, 0x1d4ed8, 3.2, 8.5], [-10, -35, 0x047857, 8.5, 3.2], [11, -35, 0xd97706, 8.5, 3.2]]) {
                S.box(cx, 1.45, cz, w, 2.9, d, std(col, 0.65, 0.3), { solid: true });
            }
            for (const [tx, tz] of [[-18, -10], [18, -10], [-18, -32], [18, -32]]) S.add(A.torch(S, V(tx, 0, tz), 0xf97316, false));

            Object.assign(S.data, { spinAccum: 0, lastYaw: BO.Player.yaw, armedT: 0, jumped: false, inAir: false, round: 1, killcamT: 0, kills: 0, totalRounds: 5, attempts: 0 });
            this._spawnRunner(S, 1);
        },
        _respawnTop(S) {
            const P = BO.Player, D = S.data;
            P.pos.set(0, TOWER_H + 0.15, 0.6);
            P.vel.set(0, 0, 0);
            P.yaw = 0; P.pitch = -0.35;
            P.hp = P.maxHp;
            D.jumped = false; D.inAir = false; D.spinAccum = 0; D.armedT = 0; D.lastYaw = P.yaw;
        },
        _spawnRunner(S, rndNum) {
            const fig = F.human({ skin: F.SKINS[rndNum % F.SKINS.length], shirt: 0xef4444, pants: 0x111827, helmet: true, hat: 'helmet', hatColor: 0xfacc15, gun: 'rifle', eyes: 'angry' });
            const ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.45, 24), basic(0xef4444, { side: THREE.DoubleSide }));
            ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; ring.userData.noHit = true;
            fig.root.add(ring);
            const tg = S.addTarget({
                mesh: fig.root, hitMeshes: fig.hit, pos: V(0, 0, -20), life: 0, appear: 'scale', inT: 0.2, death: 'knock', deathColor: 0xef4444, bonus: true,
                onTick: (t) => {
                    const spd = 2.4 + rndNum * 0.65;
                    const ph = S.t * spd * 0.28 + rndNum;
                    const x = Math.sin(ph) * (9 + rndNum * 1.4), z = -20 + Math.cos(ph * 1.3) * 4.5;
                    const dx = x - t.root.position.x, dz = z - t.root.position.z;
                    t.root.position.set(x, 0, z);
                    t.root.rotation.y = Math.atan2(dx, dz);
                    F.walk(fig, S.t * 9, 1, true);
                }
            });
            S.data.runner = tg;
        },
        update(S, dt, lib, state) {
            const D = S.data, P = BO.Player;
            if (P.alive) { P.hp = P.maxHp; P.armor = 0; }
            if (D.killcamT > 0) {
                D.killcamT -= dt;
                if (BO.State) BO.State.timeScale = 0.28;
                if (D.killcamT <= 0) {
                    if (BO.State) BO.State.timeScale = 1.0;
                    if (D.round > D.totalRounds) { MG.finish('360 TRICKSHOT MASTER!', { color: '#facc15' }); }
                    else { this._respawnTop(S); this._spawnRunner(S, D.round); }
                }
                return;
            }
            if (BO.State) BO.State.timeScale = 1.0;
            if (state !== 'running') return;

            // Player can start a 360 ANY TIME while airborne (including right on jumping off the tower)!
            const inAir = !P.onGround && (P.pos.y > TOWER_H + 0.14 || P.pos.y < TOWER_H - 0.14 || Math.abs(P.vel.y) > 0.3);
            D.inAir = inAir;
            if (!D.jumped && P.pos.y < TOWER_H - 1.0) D.jumped = true;
            if (!inAir && P.pos.y >= TOWER_H - 0.5 && D.armedT <= 0) D.spinAccum = 0;

            if (D.jumped && P.pos.y <= 0.45) {
                D.attempts++;
                SFX.buzzer();
                MG.flashScreen('rgba(239,68,68,0.3)');
                MG.toast('MISSED — RESPAWNED BACK AT TOP!', '#fca5a5');
                this._respawnTop(S);
                return;
            }

            const dy = BO.Math.angleDiff(D.lastYaw, P.yaw);
            D.lastYaw = P.yaw;
            if (inAir && D.armedT <= 0) {
                D.spinAccum += dy;
                if (Math.abs(D.spinAccum) >= Math.PI * 1.85) {
                    D.armedT = 0.50; // STRICT 0.5 SECOND SHOT WINDOW!
                    D.spinAccum = 0;
                    SFX.ding(1.3);
                    MG.toast('360° ARMED — 0.5s FIRE NOW!', '#4ade80');
                }
            } else if (D.armedT > 0) {
                D.armedT -= dt;
                if (D.armedT <= 0) MG.toast('0.5s WINDOW EXPIRED!', '#fde68a');
            }
        },
        onHit(S, ent, info) {
            const D = S.data;
            if (!ent.alive || D.armedT <= 0 || D.killcamT > 0) return false;
            D.armedT = 0; D.spinAccum = 0;
            const bonus = (info.hitbox === 'head' ? 750 : 0) + (BO.Player.adsAlpha > 0.2 ? 550 : 250);
            ent.kill(info);
            D.kills++; D.round++; S.kills++; S.bumpCombo();
            S.award((1200 + bonus) * S.comboMult, info.pt, 'MID-AIR 360° KILLCAM!', '#facc15');
            SFX.star(3); BO.FX.spawnExplosion(info.pt, 3.2, 0xfacc15);
            D.killcamT = 1.65;
            MG.toast('🎬 SLOW-MO 360° KILLCAM!', '#facc15');
            return true;
        },
        dispose() { if (BO.State) BO.State.timeScale = 1.0; },
        hud(S) {
            const D = S.data;
            const deg = Math.min(360, Math.round(Math.abs(D.spinAccum) * 180 / Math.PI));
            const scopeLeft = Math.max(0, 1.0 - (S.data._scopeT || 0));
            const status = !D.inAir ? 'JUMP OFF & SPIN ANYTIME IN AIR!' : D.armedT > 0 ? `🔫 FIRE <b>${D.armedT.toFixed(2)}s</b>` : `MID-AIR SPIN <b>${deg}° / 360°</b>`;
            return `<div class="fun-panel"><div class="mgx-chip">ROUND <b>${Math.min(D.round, D.totalRounds)} / ${D.totalRounds}</b></div><div class="mgx-chip ${D.armedT > 0 ? 'mgx-hot' : ''}">${status}</div><div class="mgx-chip">SCOPE MAX <b>${scopeLeft.toFixed(2)}s</b></div><div class="mgx-chip">FALLS <b>${D.attempts}</b></div></div>`;
        }
    });

    /* =====================================================================
       5. MARIO FPS — Faithful 1-1, 1-2, 1-3, 1-4 + Chiptune Music + 3-Form Bowser
    ===================================================================== */
    const N = { C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, Fs4: 370.0, G4: 392.0, Gs4: 415.3, A4: 440.0, Bb4: 466.2, B4: 493.9, C5: 523.3, Cs5: 554.4, D5: 587.3, Eb5: 622.3, E5: 659.3, F5: 698.5, Fs5: 740.0, G5: 784.0, Gs5: 830.6, A5: 880.0, B5: 987.8, C6: 1046.5, G3: 196.0, A3: 220.0, B3: 246.9, C3: 130.8, D3: 146.8, E3: 164.8, F3: 174.6 };
    const TRACKS = {
        '1-1': { tempo: 0.145, mel: [N.E5, N.E5, 0, N.E5, 0, N.C5, N.E5, 0, N.G5, 0, 0, 0, N.G4, 0, 0, 0, N.C5, 0, 0, N.G4, 0, 0, N.E4, 0, 0, N.A4, 0, N.B4, 0, N.Bb4, N.A4, 0], bass: [N.D3, N.D3, 0, N.D3, 0, N.D3, N.D3, 0, N.G3, 0, 0, 0, N.G3, 0, 0, 0, N.G3, 0, 0, N.E3, 0, 0, N.C3, 0, 0, N.F3, 0, N.G3, 0, N.Fs4 * 0.5, N.F3, 0] },
        '1-2': { tempo: 0.135, mel: [N.C5, N.C6, N.A4, N.A5, N.Bb4, N.Bb5, 0, 0, N.C5, N.C6, N.A4, N.A5, N.Bb4, N.Bb5, 0, 0, N.F4, N.F5, N.D4, N.D5, N.Eb5 * 0.5, N.Eb5, 0, 0, N.Eb5, N.D5, N.C5, N.Bb4, N.A4, N.G4, 0, 0], bass: [N.C3, 0, N.G3, 0, N.C3, 0, N.G3, 0, N.C3, 0, N.G3, 0, N.Bb4 * 0.25, 0, N.G3, 0] },
        '1-3': { tempo: 0.14, mel: [N.E5, N.G5, N.C6, N.A5, N.G5, 0, N.E5, N.D5, N.C5, N.E5, N.G5, 0, N.F5, N.D5, N.B4, N.G4, N.C5, N.E5, N.G5, N.B5, N.A5, N.F5, N.D5, 0], bass: [N.C3, N.G3, N.E3, N.G3, N.F3, N.C4 * 0.5, N.D3, N.G3] },
        '1-4': { tempo: 0.115, mel: [N.G4, N.Fs4, N.G4, N.Fs4, N.G4, N.Bb4, N.A4, N.Fs4, N.A4, N.Gs4, N.A4, N.Gs4, N.A4, N.C5, N.B4, N.Gs4, N.B4, N.Bb4, N.B4, N.Bb4, N.B4, N.D5, N.C5, N.A4], bass: [N.D3, N.F3, N.A3, N.F3, N.E3, N.G3, N.B3, N.G3] },
        'bowser': { tempo: 0.105, mel: [N.E4, N.E4, N.B4, N.E4, N.C5, N.B4, N.A4, N.G4, N.Fs4, N.G4, N.A4, N.E5, N.D5, N.C5, N.B4, N.A4], bass: [N.E3, N.E3, N.E3, N.E3, N.C3, N.C3, N.D3, N.D3] }
    };
    const mTone = (freq, dur, wave = 'square', vol = 0.08, delay = 0) => {
        if (!BO.Sound || !BO.Sound.ctx || !freq) return;
        const ctx = BO.Sound.ctx, t0 = ctx.currentTime + delay;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = wave; o.frequency.setValueAtTime(freq, t0);
        g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g); g.connect(ctx.destination);
        o.start(t0); o.stop(t0 + dur + 0.02);
    };
    const mCoinSfx = () => { mTone(988, 0.08, 'square', 0.1, 0); mTone(1319, 0.28, 'square', 0.1, 0.07); };
    const mPowerSfx = () => { [523, 659, 784, 1047, 1319].forEach((f, i) => mTone(f, 0.1, 'square', 0.09, i * 0.055)); };
    const mPipeSfx = () => { [620, 480, 340, 220].forEach((f, i) => mTone(f, 0.09, 'square', 0.1, i * 0.07)); };

    function marioTex(kind) {
        return L.canvasTex('mario-' + kind, 128, 128, (g, w, h) => {
            if (kind === 'brick' || kind === 'ubrick' || kind === 'cbrick') {
                g.fillStyle = kind === 'ubrick' ? '#1e3a8a' : kind === 'cbrick' ? '#44403c' : '#b45309';
                g.fillRect(0, 0, w, h);
                g.strokeStyle = kind === 'ubrick' ? '#0f172a' : '#291509';
                g.lineWidth = 5;
                for (let y = 0; y <= h; y += 32) {
                    g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
                    const off = (y / 32) % 2 ? 32 : 0;
                    for (let x = off; x < w; x += 64) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); }
                }
            } else if (kind === 'q') {
                g.fillStyle = '#eab308'; g.fillRect(0, 0, w, h);
                g.strokeStyle = '#78350f'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
                g.fillStyle = '#78350f';
                for (const [rx, ry] of [[16, 16], [112, 16], [16, 112], [112, 112]]) g.fillRect(rx - 4, ry - 4, 8, 8);
                g.fillStyle = '#fef08a'; g.font = '900 84px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', w / 2, h / 2 + 4);
            } else if (kind === 'used') {
                g.fillStyle = '#57534e'; g.fillRect(0, 0, w, h);
                g.strokeStyle = '#292524'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
            } else {
                g.fillStyle = kind === 'over' ? '#16a34a' : '#4338ca'; g.fillRect(0, 0, w, 24);
                g.fillStyle = kind === 'over' ? '#b45309' : '#1e1b4b'; g.fillRect(0, 24, w, h - 24);
            }
        });
    }

    const MARIO_WORLDS = [
        { id: '1-1', name: 'WORLD 1-1: MUSHROOM KINGDOM', sky: 0x38bdf8, ground: 0x92400e, gkind: 'over', len: 132 },
        { id: '1-2', name: 'WORLD 1-2: UNDERGROUND CAVERN', sky: 0x050816, ground: 0x1e3a8a, gkind: 'ubrick', len: 128 },
        { id: '1-3', name: 'WORLD 1-3: SKY TREETOP BRIDGES', sky: 0x0ea5e9, ground: 0xfacc15, gkind: 'tree', len: 126 },
        { id: '1-4', name: "WORLD 1-4: BOWSER'S LAVA CASTLE", sky: 0x111116, ground: 0x44403c, gkind: 'cbrick', len: 118 }
    ];

    MG.register({
        id: 'fun_mario_fps', cat: 'fun', order: 5, name: 'Mario FPS (1-1 to 1-4 + Bowser)', icon: '🍄', accent: '#ef4444', badge: 'EPIC',
        tagline: 'Faithful 1-1 to 1-4 clones with Mario Music, Pipes, Powerups, FAMAS + Deagle & 3-Form Bowser!',
        desc: 'Play faithful FPS recreations of World 1-1 (Overworld + Secret Coin Pipe!), 1-2 (Underground Piranha Pipes), 1-3 (Moving Sky Lifts & Koopa Treetops), and 1-4 (Castle Firebars & Lava). Grab the FAMAS & Desert Eagle beside "You are going to need this." before battling 3-Form Bowser!',
        heroLabel: 'FUN • 4 CLASSIC WORLDS + BOWSER • CHIPTUNE OST', duration: 0, stars: [4500, 9000, 14500, 22000],
        standardWeapon: 'famas_f1', secondaryWeapon: 'deagle', lockWeapon: true, infiniteMag: true, customMusic: true,
        hideViewmodel: (S) => !(S && S.data && S.data.hasGuns),
        blockFire: (S) => !(S && S.data && (S.data.hasGuns || S.data.power === 'fire')),
        weaponLabel: 'STOMP & FIRE FLOWER -> FAMAS + DEAGLE', weaponNote: 'Grab FAMAS & Desert Eagle at the 1-4 Boss Door!',
        keys: [['WASD', 'Run'], ['SPACE', 'Jump / Stomp'], ['E / C', 'Go down Green Pipe'], ['LMB', 'Fireball / Shoot Bowser']],
        map: {
            atmosphere: { skyTop: 0x0284c7, skyBottom: 0xbae6fd, fogColor: 0xbae6fd, fogDensity: 0.0045, sunColor: 0xffffff, sunIntensity: 1.65, sunPos: [20, 60, 20], hemiSky: 0xe0f2fe, hemiGround: 0x166534, hemiIntensity: 0.9 },
            boxes: [],
            spawn: { x: 0, y: 0.1, z: 0, yaw: 0 }
        },
        build(S) {
            S.data.stageIdx = 0; S.data.power = 'small'; S.data.hasGuns = false; S.data.coins = 0;
            S.data.stageObjs = []; S.data.fireballs = []; S.data.bFire = [];
            S.data.bowser = null; S.data.bowserForm = 0; S.data.musicStep = 0; S.data.musicTimer = 0;
            this._loadWorld(S, 0);
        },
        _clearWorld(S) {
            for (const o of S.data.stageObjs) if (o.parent) o.parent.remove(o);
            S.data.stageObjs = [];
            for (const tg of S.targets.slice()) tg.remove();
            BO.World.colliders = [];
            S.data.qBlocks = []; S.data.pipes = []; S.data.goombas = []; S.data.piranhas = [];
            S.data.coinMeshes = []; S.data.firebars = []; S.data.pits = []; S.data.movers = [];
        },
        _addObj(S, o) { S.add(o); S.data.stageObjs.push(o); return o; },
        _addBox(S, x, y, z, w, h, d, mat, solid = true) {
            const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
            m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
            this._addObj(S, m);
            if (solid) S.collider(x - w / 2, y - h / 2, z - d / 2, x + w / 2, y + h / 2, z + d / 2);
            return m;
        },
        _addPipe(S, x, y0, z, h, hasPiranha, warpFn) {
            const pipeM = std(0x16a34a, 0.35, 0.25);
            const g = new THREE.Group();
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, h, 16), pipeM); body.position.y = h * 0.5;
            const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.14, 1.14, 0.45, 16), pipeM); rim.position.y = h + 0.1;
            const hole = new THREE.Mesh(new THREE.CircleGeometry(0.86, 16), basic(0x050505)); hole.rotation.x = -Math.PI / 2; hole.position.y = h + 0.34;
            g.add(body, rim, hole);
            g.position.set(x, y0, z); this._addObj(S, g);
            S.collider(x - 1.05, y0, z - 1.05, x + 1.05, y0 + h + 0.32, z + 1.05);
            if (hasPiranha) {
                const pm = new THREE.Group();
                const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.2, 8), std(0x15803d, 0.6)); stem.position.y = 0.6;
                const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 10), std(0xdc2626, 0.4)); head.position.y = 1.25;
                pm.add(stem, head); pm.position.set(x, y0 + h - 0.6, z); this._addObj(S, pm);
                S.data.piranhas.push({ mesh: pm, baseY: y0 + h - 0.5, ph: Math.random() * 6 });
            }
            if (warpFn) S.data.pipes.push({ x, z, y: y0 + h + 0.35, warpFn });
        },
        _addCoin(S, x, y, z) {
            const c = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 12), basic(0xfacc15));
            c.rotation.x = Math.PI / 2; c.position.set(x, y, z); this._addObj(S, c);
            S.data.coinMeshes.push({ mesh: c, hit: false });
        },
        _addGoomba(S, x, z, koopa = false) {
            const gm = new THREE.Group();
            if (koopa) {
                const shell = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 10), std(0x16a34a, 0.45)); shell.scale.set(1, 0.9, 1.2); shell.position.y = 0.65;
                const hd = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), std(0xfacc15, 0.6)); hd.position.set(0, 1.25, 0.35);
                gm.add(shell, hd);
            } else {
                const cap = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 10), std(0x78350f, 0.7)); cap.scale.set(1.2, 0.8, 1.1); cap.position.y = 0.85;
                const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.55, 10), std(0xfef3c7, 0.8)); stem.position.y = 0.4;
                for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), basic(0x111111)); e.position.set(s * 0.24, 0.88, 0.55); gm.add(e); }
                gm.add(cap, stem);
            }
            const tg = S.addTarget({ mesh: gm, pos: V(x, 0, z), life: 0, appear: 'none', inT: 0.01, death: 'pop', deathColor: koopa ? 0x16a34a : 0x78350f, points: koopa ? 350 : 200, bonus: true });
            tg.vx = (z % 4 === 0 ? -3.1 : 3.1); S.data.goombas.push(tg);
        },
        _loadWorld(S, idx) {
            this._clearWorld(S);
            const W = MARIO_WORLDS[idx];
            S.data.stageIdx = idx; S.data.world = W; S.data.musicTrack = W.id; S.data.musicStep = 0; S.data.inBonus = false;
            const P = BO.Player;
            P.pos.set(0, 0.15, 0); P.vel.set(0, 0, 0); P.yaw = 0; P.pitch = 0;
            if (S.scene.fog) S.scene.fog.color.setHex(W.sky);
            S.scene.background = new THREE.Color(W.sky);

            const grTex = marioTex(W.gkind);
            const grMat = new THREE.MeshStandardMaterial({ map: grTex, roughness: 0.85 });
            const brickM = new THREE.MeshStandardMaterial({ map: marioTex(W.id === '1-2' ? 'ubrick' : W.id === '1-4' ? 'cbrick' : 'brick'), roughness: 0.8 });
            const qMat = new THREE.MeshStandardMaterial({ map: marioTex('q'), emissive: 0xca8a04, emissiveIntensity: 0.35, roughness: 0.3 });

            const startSg = A.sign(W.name, 8.6, 1.15, { bg: '#111827', color: '#fde047', borderColor: '#ef4444', size: 0.36 });
            startSg.position.set(0, 5.4, -9); this._addObj(S, startSg);

            // Segmented Ground + Iconic Pit Gaps!
            const addSegGround = (zA, zB, width = 14) => {
                const len = Math.abs(zB - zA), zMid = (zA + zB) * 0.5;
                this._addBox(S, 0, -0.5, zMid, width, 1, len, grMat, true);
            };
            const addQ = (x, y, z, gift) => {
                const qb = this._addBox(S, x, y, z, 1.25, 1.25, 1.25, qMat, true);
                S.data.qBlocks.push({ mesh: qb, x, y, z, baseY: y, used: false, gift, bumpT: 0 });
            };

            if (W.id === '1-1') {
                for (const s of [-1, 1]) for (let z = -12; z > -W.len; z -= 24) {
                    const hill = new THREE.Mesh(new THREE.ConeGeometry(4.5, 6.2, 8), std(0x15803d, 0.9));
                    hill.position.set(s * 12, 3.1, z); this._addObj(S, hill);
                    const cl = new THREE.Mesh(new THREE.SphereGeometry(2.4, 8, 6), basic(0xffffff));
                    cl.scale.set(1.8, 0.65, 1); cl.position.set(-s * 10, 10.5, z - 6); this._addObj(S, cl);
                }
                addSegGround(8, -52); addSegGround(-57, -76); addSegGround(-82, -138);
                S.data.pits.push({ z: -54.5, half: 2.3 }, { z: -79, half: 2.8 });
                // 180° SPAWN SHORTCUT DIRECTLY BEHIND PLAYER -> WARPS STRAIGHT TO BOWSER'S DOOR!
                const bossPipeM = std(0xdc2626, 0.3, 0.35, { emissive: 0x991b1b, emissiveIntensity: 0.4 });
                const bpGrp = new THREE.Group();
                const bpBody = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 1.4, 16), bossPipeM); bpBody.position.y = 0.7;
                const bpRim = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, 0.45, 16), std(0xfacc15, 0.3, 0.7)); bpRim.position.y = 1.45;
                const bpHole = new THREE.Mesh(new THREE.CircleGeometry(0.88, 16), basic(0x050505)); bpHole.rotation.x = -Math.PI / 2; bpHole.position.y = 1.7;
                bpGrp.add(bpBody, bpRim, bpHole); bpGrp.position.set(0, 0, 5.8); this._addObj(S, bpGrp);
                S.collider(-1.05, 0, 4.75, 1.05, 1.7, 6.85);
                const bpSign = A.sign('180° SECRET -> BOWSER DOOR', 4.6, 0.72, { bg: '#450a0a', color: '#fde047', borderColor: '#facc15', size: 0.38 });
                bpSign.position.set(0, 2.8, 5.8); bpSign.rotation.y = Math.PI; this._addObj(S, bpSign);
                S.data.pipes.push({
                    x: 0, z: 5.8, y: 1.7, auto: true,
                    warpFn: () => {
                        mPipeSfx();
                        this._loadWorld(S, 3);
                        P.pos.set(0, 0.25, -MARIO_WORLDS[3].len + 11.5);
                        P.yaw = 0; P.pitch = 0;
                        MG.toast('180° SECRET WARP! BOWSER\'S DOOR AHEAD!', '#fde047');
                    }
                });

                addQ(-1.5, 2.8, -12, 'coin');
                this._addBox(S, -1.5, 2.8, -18, 1.25, 1.25, 1.25, brickM);
                addQ(0, 2.8, -18, 'mushroom');
                this._addBox(S, 1.5, 2.8, -18, 1.25, 1.25, 1.25, brickM);
                addQ(0, 5.4, -18, 'fire');
                // Secret Pipes in 1-1: Sky Cloud Pipe + Piranha + Secret Coin Room!
                this._addPipe(S, -3.5, 0, -25, 1.6, false, () => {
                    mPipeSfx(); P.pos.set(0, 7.6, -26);
                    MG.toast('SECRET SKY CLOUD COINS!', '#38bdf8');
                });
                this._addBox(S, 0, 6.8, -32, 4.5, 0.7, 16, std(0xf8fafc, 0.8), true);
                for (let cz = -26; cz >= -38; cz -= 2.4) this._addCoin(S, 0, 8.1, cz);
                this._addPipe(S, 3.2, 0, -32, 2.2, false);
                this._addPipe(S, -3.0, 0, -39, 2.7, true);
                this._addPipe(S, 3.2, 0, -46, 2.8, false, () => {
                    mPipeSfx(); S.data.inBonus = true;
                    P.pos.set(0, -19.5, -50); MG.toast('SECRET COIN ROOM! GRAB COINS -> TAKE PIPE OUT!', '#fde047');
                });
                this._addBox(S, 0, -20.5, -58, 12, 1, 22, new THREE.MeshStandardMaterial({ map: marioTex('ubrick'), roughness: 0.8 }), true);
                for (let cz = -53; cz >= -64; cz -= 2.2) for (const cx of [-2.4, 0, 2.4]) this._addCoin(S, cx, -18.5, cz);
                this._addPipe(S, 0, -20, -66, 1.6, false, () => { mPipeSfx(); S.data.inBonus = false; P.pos.set(0, 0.2, -92); MG.toast('WARPED TO END OF 1-1!', '#4ade80'); });

                this._addBox(S, 0, 2.8, -66, 4.5, 1.2, 1.4, brickM); addQ(0, 2.8, -68, 'coin');
                for (let step = 0; step < 6; step++) this._addBox(S, -2.5, 0.5 + step * 0.45, -110 - step * 1.4, 4.5, 1 + step * 0.9, 1.35, brickM);
                for (const gz of [-15, -36, -64, -88, -102]) this._addGoomba(S, 1.5, gz, gz === -88);
            } else if (W.id === '1-2') {
                this._addBox(S, -8, 3.5, -W.len * 0.5, 1, 8, W.len + 16, brickM);
                this._addBox(S, 8, 3.5, -W.len * 0.5, 1, 8, W.len + 16, brickM);
                this._addBox(S, 0, 7.6, -W.len * 0.5, 17, 0.8, W.len + 16, brickM);
                addSegGround(4, -56); addSegGround(-61, -90); addSegGround(-95, -134);
                S.data.pits.push({ z: -58.5, half: 2.3 }, { z: -92.5, half: 2.3 });
                for (let q = 0; q < 5; q++) addQ(-3 + q * 1.5, 2.8, -14, q === 1 ? 'mushroom' : q === 3 ? 'fire' : 'coin');
                this._addPipe(S, -3.5, 0, -24, 1.6, false, () => { mPipeSfx(); for (let c = 0; c < 6; c++) S.award(200); D.coins += 6; mCoinSfx(); P.pos.set(0, 0.2, -48); MG.toast('SECRET 1-2 TREASURE PIPE! +6 COINS', '#fde047'); });
                this._addPipe(S, -3.5, 0, -34, 2.0, true);
                this._addPipe(S, 3.0, 0, -42, 2.6, true);
                this._addPipe(S, 0, 0, -50, 1.8, false, () => { mPipeSfx(); P.pos.set(0, 0.2, -72); MG.toast('CAVERN PIPE SHORTCUT!', '#38bdf8'); });
                // Famous 1-2 Warp Zone Pipes (Warp to 1-3 or 1-4)!
                this._addPipe(S, -3.6, 0, -112, 1.7, false, () => { mPipeSfx(); this._loadWorld(S, 2); MG.toast('WARP ZONE -> WORLD 1-3!', '#38bdf8'); });
                this._addPipe(S, 3.6, 0, -112, 1.7, false, () => { mPipeSfx(); this._loadWorld(S, 3); MG.toast('WARP ZONE -> WORLD 1-4!', '#ef4444'); });
                const wzSg = A.sign('WARP ZONE: 1-3 (L)  |  1-4 (R)', 6.4, 0.75, { bg: '#0f172a', color: '#fde047', borderColor: '#22c55e', size: 0.36 });
                wzSg.position.set(0, 3.8, -112); this._addObj(S, wzSg);
                this._addBox(S, 0, 3.0, -78, 5, 1.0, 8, brickM);
                for (let cz = -75; cz >= -81; cz -= 2) this._addCoin(S, 0, 4.2, cz);
                for (const gz of [-22, -46, -68, -84, -108]) this._addGoomba(S, 0, gz, gz % 8 === 0);
            } else if (W.id === '1-3') {
                addSegGround(4, -16);
                const treePlat = (x, y, z, w, d, col) => {
                    this._addBox(S, x, y, z, w, 0.9, d, std(col, 0.7), true);
                    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 18, 10), std(0x78350f, 0.9));
                    trunk.position.set(x, y - 9.5, z); this._addObj(S, trunk);
                };
                treePlat(0, 0.5, -26, 7.5, 14, 0xdc2626);
                addQ(0, 3.6, -26, 'fire');
                const mv1 = this._addBox(S, 0, 1.2, -44, 5.2, 0.65, 5.2, std(0xfacc15, 0.4), true);
                S.data.movers.push({ mesh: mv1, base: V(0, 1.2, -44), axis: 'x', amp: 3.5, spd: 1.4 });
                treePlat(-2.5, 2.0, -64, 8, 16, 0x16a34a);
                addQ(-2.5, 5.0, -64, 'mushroom');
                this._addPipe(S, -4.5, 2.45, -66, 1.5, false, () => { mPipeSfx(); D.power = 'fire'; P.pos.set(0, 1.8, -102); MG.toast('SECRET SKY PIPE! FIRE FLOWER + SKIP!', '#f97316'); });
                const mv2 = this._addBox(S, 2, 2.0, -84, 5.5, 0.65, 5.5, std(0xfacc15, 0.4), true);
                S.data.movers.push({ mesh: mv2, base: V(2, 2.0, -84), axis: 'y', amp: 1.6, spd: 1.6 });
                treePlat(0, 1.2, -104, 8.5, 16, 0xdc2626);
                this._addBox(S, 0, -0.5, -124, 14, 1, 18, grMat, true);
                for (let cz = -20; cz >= -96; cz -= 8) this._addCoin(S, 0, 3.2, cz);
                for (const gz of [-24, -64, -104]) this._addGoomba(S, 0, gz, true);
            } else {
                // World 1-4: Lava Castle + Firebars + Podoboos + FAMAS/Deagle Pedestal!
                this._addBox(S, -8.5, 3.5, -W.len * 0.5, 1, 8, W.len + 16, brickM);
                this._addBox(S, 8.5, 3.5, -W.len * 0.5, 1, 8, W.len + 16, brickM);
                this._addBox(S, 0, 7.8, -W.len * 0.5, 18, 0.8, W.len + 16, brickM);
                const lava = new THREE.Mesh(new THREE.PlaneGeometry(16, W.len + 10), basic(0xf97316));
                lava.rotation.x = -Math.PI / 2; lava.position.set(0, -0.3, -W.len * 0.5); this._addObj(S, lava);
                addSegGround(4, -22, 12); addSegGround(-27, -50, 7); addSegGround(-55, -82, 9); addSegGround(-87, -124, 14);
                S.data.pits.push({ z: -24.5, half: 2.3 }, { z: -52.5, half: 2.3 }, { z: -84.5, half: 2.3 });
                addQ(0, 2.8, -16, 'fire');
                // 4 Spinning Castle Firebars!
                for (const fz of [-34, -44, -64, -74]) {
                    this._addBox(S, 0, 1.4, fz, 1.1, 1.1, 1.1, std(0x27272a, 0.6));
                    const piv = new THREE.Group(); piv.position.set(0, 1.5, fz);
                    for (let k = -4; k <= 4; k++) {
                        if (k === 0) continue;
                        const fb = new THREE.Mesh(new THREE.SphereGeometry(0.30, 8, 6), basic(0xf97316));
                        fb.position.set(k * 0.82, 0, 0); piv.add(fb);
                    }
                    this._addObj(S, piv); S.data.firebars.push({ piv, z: fz });
                }
            }

            if (W.id !== '1-4') {
                // Flagpole + Classic Brick Castle
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 7.5, 10), std(0xe5e7eb, 0.3, 0.8));
                pole.position.set(0, 3.75, -W.len);
                const flag = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.08), basic(0x22c55e)); flag.position.set(0.85, 6.6, -W.len);
                const castle = new THREE.Mesh(new THREE.BoxGeometry(5.5, 4.8, 4.5), brickM); castle.position.set(0, 2.4, -W.len - 6);
                this._addObj(S, pole); this._addObj(S, flag); this._addObj(S, castle);
                S.data.goalZ = -W.len;
            } else {
                const door = this._addBox(S, 0, 2.5, -W.len, 4.4, 5.0, 0.7, std(0x451a03, 0.8), true);
                const arch = A.sign('BOWSER BOSS DOOR ->', 4.6, 0.8, { bg: '#7f1d1d', color: '#fef08a', borderColor: '#facc15', size: 0.42 });
                arch.position.set(0, 5.4, -W.len + 0.4); this._addObj(S, arch);
                const sg = A.sign('You are going to need this.', 4.6, 0.9, { bg: '#1e1b4b', color: '#fde68a', borderColor: '#f59e0b', size: 0.44 });
                sg.position.set(-4.6, 2.4, -W.len + 7.5); sg.rotation.y = 0.4; this._addObj(S, sg);
                const ped = this._addBox(S, -4.6, 0.5, -W.len + 5.5, 2.8, 1.0, 1.5, std(0x334155, 0.4, 0.8), true);
                const gunGrp = new THREE.Group();
                const g1 = BO.WeaponMesh.buildWeapon('famas_f1', {}, 'default', false, false).root;
                const g2 = BO.WeaponMesh.buildWeapon('deagle', {}, 'default', false, false).root;
                g1.position.set(-0.6, 0, 0); g2.position.set(0.6, 0, 0);
                gunGrp.add(g1, g2); gunGrp.position.set(-4.6, 1.4, -W.len + 5.5); this._addObj(S, gunGrp);
                S.data.weaponRack = { grp: gunGrp, x: -4.6, z: -W.len + 5.5, taken: false };
                S.data.goalZ = -W.len + 1.5;
                void door; void ped;
            }
            MG.toast(W.name, '#fde047');
        },
        _spawnBowser(S, form) {
            this._clearWorld(S);
            const D = S.data, P = BO.Player;
            P.pos.set(0, 0.2, 10); P.vel.set(0, 0, 0); P.yaw = 0; P.pitch = 0;
            if (form === 1 && !D.hasGuns) D.hasGuns = true;
            D.musicTrack = 'bowser'; D.musicStep = 0;
            D.bowserForm = form;
            const formMeta = [
                null,
                { name: 'BOWSER (NORMAL)', hp: 1450, sc: 1.0, shell: 0x166534, skin: 0xfacc15, horn: 0xfef3c7, rate: 1.9 },
                { name: 'BOWSER — FINAL FORM!', hp: 2100, sc: 1.38, shell: 0x7f1d1d, skin: 0xf97316, horn: 0xfde047, rate: 1.3 },
                { name: 'OMEGA BOWSER — FINAL FINAL FORM!!', hp: 2800, sc: 1.72, shell: 0x3b0764, skin: 0xc084fc, horn: 0xfef08a, rate: 0.9 }
            ][form];
            D.formMeta = formMeta;
            this._addBox(S, 0, -0.5, -6, 38, 1, 46, std(0x3f3f46, 0.85), true);
            for (const [px, pz] of [[-12, -2], [12, -2], [-12, -16], [12, -16]]) this._addBox(S, px, 1.8, pz, 2, 3.6, 2, std(0x27272a, 0.9), true);

            const bg = new THREE.Group();
            const shell = new THREE.Mesh(new THREE.SphereGeometry(1.75, 14, 12), std(formMeta.shell, 0.45, 0.2)); shell.scale.set(1.1, 1.3, 0.95); shell.position.set(0, 2.2, -0.4);
            const belly = new THREE.Mesh(new THREE.SphereGeometry(1.45, 12, 10), std(formMeta.skin, 0.6)); belly.position.set(0, 2.0, 0.35);
            const head = new THREE.Mesh(new THREE.SphereGeometry(1.05, 12, 10), std(formMeta.skin, 0.55)); head.position.set(0, 3.9, 0.6);
            for (const s of [-1, 1]) {
                const horn = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.1, 8), std(formMeta.horn, 0.4)); horn.position.set(s * 0.72, 4.75, 0.5); horn.rotation.z = -s * 0.45; bg.add(horn);
                const eye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), basic(0xef4444)); eye.position.set(s * 0.45, 4.05, 1.48); bg.add(eye);
            }
            for (let k = 0; k < 6; k++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.8, 7), std(formMeta.horn, 0.4)); sp.position.set((k % 2 ? 0.65 : -0.65), 1.4 + k * 0.35, -1.6); sp.rotation.x = -Math.PI * 0.45; bg.add(sp); }
            bg.add(shell, belly, head); bg.scale.setScalar(formMeta.sc);
            const tg = S.addTarget({ mesh: bg, hitMeshes: [shell, belly, head], pos: V(0, 0, -16), life: 0, appear: 'scale', inT: 0.25, death: 'none', bonus: true });
            tg.hp = formMeta.hp; tg.maxHp = formMeta.hp; tg.fireT = 1.2; tg.walkT = 0;
            D.bowser = tg;
            MG.toast(formMeta.name, '#facc15'); SFX.rumble(0.7);
        },
        onKey(S, code) {
            const D = S.data, P = BO.Player;
            if (MG.state !== 'running') return false;
            if (code === 'Space' && P.pos.y < 0.3) mTone(380, 0.14, 'square', 0.08, 0);
            if (code === 'KeyE' || code === 'KeyC' || code === 'ControlLeft') {
                for (const pp of D.pipes || []) {
                    if (Math.hypot(P.pos.x - pp.x, P.pos.z - pp.z) < 2.8) { pp.warpFn(); return true; }
                }
                if (D.weaponRack && !D.weaponRack.taken && Math.hypot(P.pos.x - D.weaponRack.x, P.pos.z - D.weaponRack.z) < 3.6) {
                    D.weaponRack.taken = true; D.weaponRack.grp.visible = false; D.hasGuns = true; mPowerSfx();
                    MG.toast('EQUIPPED FAMAS + DESERT EAGLE!', '#fde047'); return true;
                }
            }
            return false;
        },
        _triggerQBlock(S, q) {
            if (q.used) return;
            const D = S.data, P = BO.Player;
            q.used = true; q.bumpT = 0.24;
            q.mesh.material = new THREE.MeshStandardMaterial({ map: marioTex('used'), roughness: 0.8 });
            const popCol = q.gift === 'fire' ? 0xf97316 : q.gift === 'mushroom' ? 0xef4444 : 0xfacc15;
            const popMesh = new THREE.Mesh(q.gift === 'coin' ? new THREE.CylinderGeometry(0.32, 0.32, 0.08, 12) : new THREE.SphereGeometry(0.38, 12, 10), basic(popCol));
            popMesh.position.set(q.x, q.y + 0.9, q.z); this._addObj(S, popMesh);
            let pt = 0; S.animate((dt) => { pt += dt; popMesh.position.y += dt * 1.4; popMesh.rotation.y += dt * 6; if (pt > 0.65) { S.scene.remove(popMesh); return false; } });
            if (q.gift === 'fire') { D.power = 'fire'; mPowerSfx(); MG.toast('🔥 FIRE FLOWER! LMB SHOOTS FIREBALLS!', '#f97316'); }
            else if (q.gift === 'mushroom') { D.power = 'big'; P.maxHp = 160; P.hp = 160; mPowerSfx(); MG.toast('🍄 SUPER MUSHROOM! +60 HP', '#ef4444'); }
            else { D.coins++; S.award(250, V(q.x, q.y + 1, q.z), 'COIN!'); mCoinSfx(); }
        },
        update(S, dt, lib, state) {
            const D = S.data, P = BO.Player;
            if (state !== 'running') return;
            D._prevVy = P.vel.y;

            // Live Mario Chiptune Theme Sequencer
            const tr = TRACKS[D.musicTrack] || TRACKS['1-1'];
            D.musicTimer -= dt;
            if (D.musicTimer <= 0) {
                D.musicTimer = tr.tempo;
                const mn = tr.mel[D.musicStep % tr.mel.length];
                const bn = tr.bass[D.musicStep % tr.bass.length];
                if (mn) mTone(mn, tr.tempo * 0.85, 'square', 0.045);
                if (bn) mTone(bn, tr.tempo * 0.9, 'triangle', 0.055);
                D.musicStep++;
            }

            // Auto-warp check for obvious boss shortcut pipe behind 1-1 spawn + prompt detection
            D.nearPipe = false;
            for (const pp of D.pipes || []) {
                const pd = Math.hypot(P.pos.x - pp.x, P.pos.z - pp.z);
                if (pd < 2.8) D.nearPipe = true;
                if (pp.auto && pd < 1.55) { pp.warpFn(); return; }
            }

            for (const q of D.qBlocks || []) {
                if (q.bumpT > 0) { q.bumpT = Math.max(0, q.bumpT - dt); q.mesh.position.y = q.baseY + Math.sin((q.bumpT / 0.24) * Math.PI) * 0.36; }
                if (!q.used && Math.abs(P.pos.x - q.x) < 1.25 && Math.abs(P.pos.z - q.z) < 1.25 && P.pos.y + 2.05 >= q.y - 0.72 && P.pos.y < q.y + 0.3 && (P.vel.y > -0.8 || D._prevVy > 0.3)) {
                    this._triggerQBlock(S, q);
                }
            }

            // Animate moving platforms, piranha plants, coins
            for (const mv of D.movers || []) {
                if (mv.axis === 'x') mv.mesh.position.x = mv.base.x + Math.sin(S.t * mv.spd) * mv.amp;
                else mv.mesh.position.y = mv.base.y + Math.sin(S.t * mv.spd) * mv.amp;
            }
            for (const pr of D.piranhas || []) pr.mesh.position.y = pr.baseY + Math.max(0, Math.sin(S.t * 2.2 + pr.ph)) * 1.1;
            for (const cm of D.coinMeshes || []) {
                if (cm.hit) continue;
                cm.mesh.rotation.z += dt * 4;
                if (cm.mesh.position.distanceTo(P.pos.clone().add(V(0, 1.0, 0))) < 1.35) {
                    cm.hit = true; cm.mesh.visible = false; D.coins++; S.award(200, cm.mesh.position, 'COIN!'); mCoinSfx();
                }
            }

            if (D.power === 'fire' && !D.hasGuns) {
                if (P.triggerHeld && !D._fbLatch) {
                    D._fbLatch = true;
                    const cam = BO.App.worldCamera, dir = new THREE.Vector3(); cam.getWorldDirection(dir);
                    const fb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), basic(0xf97316));
                    fb.position.copy(cam.position).addScaledVector(dir, 0.8); S.add(fb);
                    D.fireballs.push({ mesh: fb, vel: dir.multiplyScalar(22).add(V(0, 2, 0)), life: 2.5 }); SFX.pop();
                } else if (!P.triggerHeld) D._fbLatch = false;
            }
            if (D.weaponRack && !D.weaponRack.taken) {
                D.weaponRack.grp.rotation.y += dt * 1.4;
                if (Math.hypot(P.pos.x - D.weaponRack.x, P.pos.z - D.weaponRack.z) < 2.2) {
                    D.weaponRack.taken = true; D.weaponRack.grp.visible = false; D.hasGuns = true; mPowerSfx();
                    MG.toast('EQUIPPED FAMAS + DESERT EAGLE!', '#fde047');
                }
            }

            for (let i = D.fireballs.length - 1; i >= 0; i--) {
                const fb = D.fireballs[i]; fb.life -= dt; fb.vel.y -= 18 * dt;
                fb.mesh.position.addScaledVector(fb.vel, dt);
                if (fb.mesh.position.y <= 0.25) { fb.mesh.position.y = 0.25; fb.vel.y = 6.5; }
                let dead = fb.life <= 0;
                for (const g of D.goombas || []) {
                    if (g.alive && g.root.position.distanceTo(fb.mesh.position) < 1.25) {
                        g.kill({ pt: g.root.position.clone() }); S.kills++; S.award(300, g.root.position.clone(), 'FIREBALL!'); dead = true; break;
                    }
                }
                if (!dead) for (const q of D.qBlocks || []) {
                    if (!q.used && q.mesh.position.distanceTo(fb.mesh.position) < 1.15) { this._triggerQBlock(S, q); dead = true; break; }
                }
                if (dead) { S.scene.remove(fb.mesh); D.fireballs.splice(i, 1); }
            }

            if (D.bowserForm > 0 && D.bowser) {
                const bw = D.bowser; bw.walkT += dt;
                bw.root.position.x = BO.Math.lerp(bw.root.position.x, Math.sin(bw.walkT * 1.25) * 9, dt * 2.0);
                bw.root.position.z = BO.Math.lerp(bw.root.position.z, -15 + Math.cos(bw.walkT * 0.9) * 3.5, dt * 2.0);
                bw.root.rotation.y = Math.atan2(P.pos.x - bw.root.position.x, P.pos.z - bw.root.position.z);
                bw.fireT -= dt;
                if (bw.fireT <= 0) {
                    bw.fireT = D.formMeta.rate;
                    const count = D.bowserForm === 1 ? 1 : D.bowserForm === 2 ? 3 : 5;
                    for (let c = 0; c < count; c++) {
                        const fm = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), basic(D.bowserForm === 3 ? 0xc084fc : 0xf97316));
                        fm.position.copy(bw.root.position).add(V(0, 3.2, 0)); S.add(fm);
                        const tgt = P.pos.clone().add(V((c - (count - 1) * 0.5) * 2.5, 1.0, 0));
                        D.bFire.push({ mesh: fm, vel: tgt.sub(fm.position).normalize().multiplyScalar(17 + D.bowserForm * 3), life: 3.5 });
                    }
                    SFX.launch();
                }
                for (let i = D.bFire.length - 1; i >= 0; i--) {
                    const bf = D.bFire[i]; bf.life -= dt; bf.mesh.position.addScaledVector(bf.vel, dt);
                    if (bf.mesh.position.distanceTo(P.pos.clone().add(V(0, 1.1, 0))) < 1.1) {
                        P.takeDamage(14 + D.bowserForm * 4, bf.mesh.position, true);
                        S.scene.remove(bf.mesh); D.bFire.splice(i, 1);
                        if (!P.alive) MG.finish('DEFEATED BY BOWSER', { color: '#f87171' });
                        continue;
                    }
                    if (bf.life <= 0) { S.scene.remove(bf.mesh); D.bFire.splice(i, 1); }
                }
                return;
            }
            for (const g of D.goombas || []) {
                if (!g.alive) continue;
                g.root.position.x += g.vx * dt;
                if (Math.abs(g.root.position.x) > 5.5) g.vx *= -1;
                const d = Math.hypot(P.pos.x - g.root.position.x, P.pos.z - g.root.position.z);
                if (d < 1.3 && P.pos.y > 0.55 && P.vel.y < 0) {
                    g.kill({ pt: g.root.position.clone() }); P.vel.y = 8.5; S.kills++; S.award(250, g.root.position.clone(), 'STOMPED!'); SFX.boing();
                } else if (d < 1.0 && P.pos.y <= 0.55) {
                    P.takeDamage(18, g.root.position, false); g.vx *= -1;
                    if (!P.alive) MG.finish('SQUISHED BY GOOMBA', { color: '#f87171' });
                }
            }
            for (const fb of D.firebars || []) {
                fb.piv.rotation.z += dt * 1.75;
                if (Math.abs(P.pos.z - fb.z) < 0.7 && Math.abs(P.pos.x) < 3.1 && P.pos.y < 2.2 && Math.abs(Math.sin(fb.piv.rotation.z)) < 0.35) {
                    P.takeDamage(12, V(0, 1, fb.z), false);
                }
            }
            if (!D.inBonus) {
                for (const pt of D.pits || []) {
                    if (Math.abs(P.pos.z - pt.z) < pt.half && P.pos.y < -0.2) {
                        P.pos.set(0, 0.4, pt.z + 4.0); P.vel.set(0, 0, 0); P.takeDamage(28, V(0, 0, pt.z), true);
                        MG.toast('JUMP OVER THE PIT!', '#f97316');
                        if (!P.alive) MG.finish('FELL IN THE ABYSS', { color: '#f87171' });
                    }
                }
            }
            if (P.pos.z <= D.goalZ + 1.2 && !D.inBonus) {
                S.award(1200 * (D.stageIdx + 1)); SFX.fanfare();
                if (D.stageIdx < 3) this._loadWorld(S, D.stageIdx + 1);
                else this._spawnBowser(S, 1);
            }
        },
        onHit(S, ent, info) {
            const D = S.data;
            if (ent === D.bowser) {
                D.bowser.hp -= info.dmg * 1.4; S.hits++; SFX.thunk();
                if (D.bowser.hp <= 0) {
                    BO.FX.spawnExplosion(D.bowser.root.position.clone().add(V(0, 2, 0)), 8, 0xfacc15);
                    D.bowser.kill(info); D.bowser = null; S.kills++; S.award(2500 * D.bowserForm);
                    if (D.bowserForm < 3) this._spawnBowser(S, D.bowserForm + 1);
                    else MG.finish('ALL 3 BOWSER FORMS DEFEATED!', { color: '#fde047' });
                }
                return true;
            }
            return false;
        },
        hud(S) {
            const D = S.data;
            if (D.bowserForm > 0 && D.bowser) {
                const pct = Math.max(0, Math.round(D.bowser.hp / D.bowser.maxHp * 100));
                return `<div class="fun-panel"><div class="fun-bar-wrap"><div class="fun-bar-lbl"><span>${D.formMeta.name}</span><b>${Math.round(D.bowser.hp)} / ${D.bowser.maxHp}</b></div><div class="fun-bar"><i style="width:${pct}%;background:linear-gradient(90deg,#ef4444,#facc15)"></i></div></div></div>`;
            }
            return `<div class="fun-panel"><div class="mgx-chip"><b>${D.world ? D.world.name : ''}</b></div><div class="mgx-chip">COINS <b>${D.coins}</b></div><div class="mgx-chip">POWER <b>${D.hasGuns ? 'FAMAS + DEAGLE' : D.power.toUpperCase()}</b></div><div class="mgx-chip">GOAL <b>${Math.max(0, Math.round(BO.Player.pos.z - (D.goalZ || -120)))} m</b></div>${D.nearPipe ? '<div class="mgx-chip mgx-hot">PRESS <b>[E / C]</b> ENTER PIPE</div>' : ''}</div>`;
        }
    });
})(window);
