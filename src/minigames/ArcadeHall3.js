/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Arcade Hall (part 3)
      7. Bottle Juggler — keep glass bottles in the air; every hit bumps one back up
      8. Color Lock     — only the colour on the signal lamp scores, and it keeps changing
      9. Number Crunch  — numbered balloons, shoot them in ascending order
     10. Echo Panels    — watch the light sequence, then shoot it back from memory
     11. Switchyard     — flip track switches so gold reaches the bank and TNT the pit
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const L = BO.MinigameLib;
    const A = BO.MinigameArt;
    const K = BO.MGCourseKit;
    const { B, SFX, std, basic, clamp01, TAU, esc } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);

    /* ------------------------------------------------------------ shared kit */
    const AK = BO.MGArcadeKit = {
        hall(S, o) {
            K.groundPlane(S, 140, o.ground ?? 0x1f2937);
            K.booth(S, { wood: o.wood ?? 0x3f3f46, trim: 0x18181b, awning: o.awning || o.accent });
            const sign = A.sign(o.title, 3.2, 0.5, { bg: '#0f172a', color: '#f8fafc', borderColor: o.accent, size: 0.48 });
            sign.position.set(0, 2.45, -1.42);
            S.add(sign);
        },
        map(atm, groundMat) {
            return {
                atmosphere: Object.assign({ skyTop: 0x0b1020, skyBottom: 0x312e81, fogColor: 0x1e1b4b, fogDensity: 0.01, sunColor: 0xe0e7ff, sunIntensity: 0.9, sunPos: [10, 40, 20], hemiSky: 0xc7d2fe, hemiGround: 0x1e1b4b, hemiIntensity: 1.0 }, atm || {}),
                boxes: [B(0, -0.5, -20, 140, 1, 140, groundMat || 'concrete')],
                spawn: { x: 0, y: 0, z: 0.2, yaw: 0 }
            };
        },
        /** Persistent shootable object (life 0 = stays until killed). */
        tgt(S, mesh, pos, o) {
            return S.addTarget(Object.assign({ mesh, pos, life: 0, appear: 'scale', inT: 0.15, death: 'pop', points: 100 }, o || {}));
        },
        textTex(key, text, o = {}) {
            return L.canvasTex('ak:' + key, o.w || 128, o.h || 128, (g, w, h) => {
                if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, w, h); } else g.clearRect(0, 0, w, h);
                g.font = `900 ${Math.round(h * (o.size || 0.62))}px Bahnschrift, Impact, sans-serif`;
                g.textAlign = 'center'; g.textBaseline = 'middle';
                g.lineWidth = h * 0.08; g.strokeStyle = o.stroke || 'rgba(0,0,0,0.8)';
                g.strokeText(text, w / 2, h / 2 + h * 0.04);
                g.fillStyle = o.color || '#ffffff';
                g.fillText(text, w / 2, h / 2 + h * 0.04);
            });
        },
        chip: (label, val, bad) => `<div class="mgx-chip ${bad ? 'mgx-bad' : ''}">${esc(label)} <b>${val}</b></div>`,
        lives: (n, max) => `<div class="mgx-chip">LIVES <b>${'♥'.repeat(Math.max(0, n))}${'♡'.repeat(Math.max(0, max - n))}</b></div>`
    };
    const ARC = { cat: 'arcade', infiniteMag: true, forgivingMisses: true, lockWeapon: true, oneTargetPerShot: true };

    /* =====================================================================
       7. BOTTLE JUGGLER
    ===================================================================== */
    function bottleMesh(col) {
        const g = new THREE.Group();
        const glass = new THREE.MeshStandardMaterial({ color: col, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.82, emissive: col, emissiveIntensity: 0.25 });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 14), glass);
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.12, 0.28, 12), glass);
        neck.position.y = 0.39;
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.06, 10), basic(0xfacc15));
        cap.position.y = 0.55;
        cap.userData.noHit = true;
        g.add(body, neck, cap);
        return { g, hit: [body, neck] };
    }
    MG.register(Object.assign({}, ARC, {
        id: 'bottle_juggler', order: 7, name: 'Bottle Juggler', icon: '🍾', accent: '#10b981',
        tagline: 'Never let a bottle touch the ground.',
        desc: 'A launcher lobs glass bottles into the air. Shooting a bottle does not break it: it bumps it back up, and every bump in a row on the same bottle is worth more. A bottle that hits the floor shatters and costs a life. More bottles join over time. You have three lives and 60 seconds.',
        heroLabel: 'ARCADE HALL • KEEP-IT-UP • 60 SECONDS', duration: 60, stars: [2500, 7000, 14000, 22000],
        standardWeapon: 'm1911', weaponLabel: 'M1911', weaponNote: 'Bottomless magazine',
        keys: [['LMB', 'Bump a bottle up'], ['R', 'Retry from results']],
        map: AK.map({ skyTop: 0x0c4a6e, skyBottom: 0x67e8f9, fogColor: 0x7dd3fc, fogDensity: 0.006, sunIntensity: 1.5 }),
        build(S) {
            AK.hall(S, { title: 'BOTTLE JUGGLER', accent: '#10b981', ground: 0x14532d });
            const launcher = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 1.2, 16), std(0x334155, 0.4, 0.6));
            launcher.position.set(0, 0.6, -12);
            S.add(launcher);
            const back = new THREE.Mesh(new THREE.PlaneGeometry(18, 9), std(0x0f766e, 0.9));
            back.position.set(0, 4.5, -16);
            S.add(back); S.solid(back);
            Object.assign(S.data, { lives: 3, bottles: [], nextB: 0.5, launched: 0, bestChain: 0, bumps: 0 });
        },
        update(S, dt, lib, state) {
            const D = S.data;
            if (state !== 'running') return;
            D.nextB -= dt;
            if (D.nextB <= 0 && D.bottles.filter((b) => b.alive).length < 5) {
                D.nextB = Math.max(4, 8 - S.t * 0.06);
                const m = bottleMesh([0x22c55e, 0x0ea5e9, 0xa855f7, 0xf97316, 0xef4444][D.launched % 5]);
                const b = AK.tgt(S, m.g, V(0, 1.2, -12), { hitMeshes: m.hit, death: 'shatter', deathColor: 0x86efac, bonus: true });
                b.vel = V((Math.random() - 0.5) * 3, 9.5, 0);
                b.body = m.g;
                b.chain = 0;
                b.onTick = (t, dt2) => {
                    if (MG.state !== 'running' || !t.alive) return;
                    t.vel.y -= 7.5 * dt2;
                    t.root.position.addScaledVector(t.vel, dt2);
                    const p = t.root.position;
                    if (Math.abs(p.x) > 6.5) { t.vel.x = -Math.sign(p.x) * Math.abs(t.vel.x); p.x = Math.sign(p.x) * 6.5; }
                    if (p.y > 7.5) t.vel.y = Math.min(t.vel.y, 0);
                    t.body.rotation.z += t.vel.x * dt2 * 0.8;
                    if (p.y < 0.3 && t.vel.y < 0) {
                        t.kill({ pt: p.clone() });
                        SFX.shatter();
                        D.lives--;
                        S.breakCombo('DROPPED');
                        MG.toast(D.lives > 0 ? `BOTTLE DROPPED • ${D.lives} LIVES` : 'LAST BOTTLE DROPPED', '#f87171');
                        if (D.lives <= 0) MG.finish('ALL DROPPED', { color: '#f87171' });
                    }
                };
                D.bottles.push(b);
                D.launched++;
                SFX.launch();
            }
        },
        onHit(S, ent, info) {
            if (!ent.alive || ent.vel === undefined) return false;
            const D = S.data;
            ent.chain++;
            D.bumps++;
            D.bestChain = Math.max(D.bestChain, ent.chain);
            ent.vel.y = 6.2 + Math.random() * 1.8;
            ent.vel.x = (Math.random() - 0.5) * 3 - ent.root.position.x * 0.3;
            S.hits++; S.kills++;
            S.bumpCombo();
            const pts = Math.round((30 + Math.min(ent.chain, 20) * 10) * S.comboMult);
            S.award(pts, info.pt, 'x' + ent.chain, '#6ee7b7');
            SFX.tone(600 + ent.chain * 40, 900 + ent.chain * 40, 0.12, 'triangle', 0.14);
            return false;
        },
        hud(S) { const D = S.data; return `<div class="ah3-panel">${AK.lives(D.lives, 3)}${AK.chip('IN THE AIR', D.bottles.filter((b) => b.alive).length)}${AK.chip('BEST CHAIN', D.bestChain)}</div>`; },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return { score: S.score, stars, title: D.lives > 0 ? 'STILL JUGGLING' : 'SMASHED', stats: [['BUMPS', D.bumps], ['BEST CHAIN', D.bestChain], ['BOTTLES', D.launched], ['LIVES LEFT', Math.max(0, D.lives)], ['BEST STREAK', S.maxCombo], ['ACCURACY', S.shots ? Math.round(S.shotHits / S.shots * 100) + '%' : '—']], xp: Math.round(120 + S.score * 0.04 + stars * 120) };
        }
    }));

    /* =====================================================================
       8. COLOR LOCK
    ===================================================================== */
    const CL_COLS = [{ n: 'RED', c: 0xef4444, css: '#ef4444' }, { n: 'BLUE', c: 0x3b82f6, css: '#3b82f6' }, { n: 'GREEN', c: 0x22c55e, css: '#22c55e' }, { n: 'YELLOW', c: 0xfacc15, css: '#facc15' }];
    MG.register(Object.assign({}, ARC, {
        id: 'color_lock', order: 8, name: 'Color Lock', icon: '🚦', accent: '#f43f5e',
        tagline: 'Only the live colour scores. It keeps changing.',
        desc: 'Coloured panels flash up on the wall. The signal lamp above shows the one LIVE colour: only those panels score. Every few seconds the lamp blinks a warning and switches. A wrong-colour hit costs points and your streak. Read, react, re-read.',
        heroLabel: 'ARCADE HALL • RULE SWITCH • 60 SECONDS', duration: 60, stars: [3000, 7000, 12000, 18000],
        standardWeapon: 'five_seven', weaponLabel: 'FIVE-SEVEN', weaponNote: 'Bottomless magazine',
        keys: [['LMB', 'Shoot live-colour panels'], ['R', 'Retry from results']],
        map: AK.map({ skyTop: 0x0f0a1f, skyBottom: 0x3b0764 }),
        build(S) {
            AK.hall(S, { title: 'COLOR LOCK', accent: '#f43f5e' });
            const wall = new THREE.Mesh(new THREE.BoxGeometry(16, 8, 0.4), std(0x111827, 0.8));
            wall.position.set(0, 4, -14.4);
            S.add(wall); S.solid(wall);
            const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xef4444, emissiveIntensity: 1.5 }));
            lamp.position.set(0, 7.2, -13.8);
            lamp.userData.noHit = true;
            S.add(lamp);
            Object.assign(S.data, { lamp, live: 0, next: 1, switchT: 5, spawnT: 0.6, slots: [], right: 0, wrong: 0 });
            for (let i = 0; i < 18; i++) S.data.slots.push(null);
        },
        update(S, dt, lib, state) {
            const D = S.data;
            if (state !== 'running') return;
            D.switchT -= dt;
            const warn = D.switchT < 1;
            D.lamp.material.emissive.setHex(warn && Math.floor(D.switchT * 8) % 2 ? CL_COLS[D.next].c : CL_COLS[D.live].c);
            if (D.switchT <= 0) {
                D.live = D.next;
                D.next = (D.live + 1 + Math.floor(Math.random() * 3)) % 4;
                D.switchT = Math.max(2.8, 5.2 - S.t * 0.035);
                MG.toast(CL_COLS[D.live].n + ' IS LIVE', CL_COLS[D.live].css);
                SFX.tone(880, 1320, 0.15, 'square', 0.1);
            }
            D.spawnT -= dt;
            if (D.spawnT <= 0) {
                D.spawnT = Math.max(0.3, 0.6 - S.t * 0.004);
                const free = D.slots.map((s, i) => (s && s.alive ? -1 : i)).filter((i) => i >= 0);
                if (!free.length) return;
                const i = free[Math.floor(Math.random() * free.length)];
                const ci = Math.random() < 0.42 ? D.live : Math.floor(Math.random() * 4);
                const m = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.1, 0.12), new THREE.MeshStandardMaterial({ color: CL_COLS[ci].c, emissive: CL_COLS[ci].c, emissiveIntensity: 0.6, roughness: 0.4 }));
                const tg = S.addTarget({ mesh: m, pos: V(-6.5 + (i % 6) * 2.6, 1.4 + Math.floor(i / 6) * 1.7, -14.1), life: Math.max(1.2, 2.3 - S.t * 0.012), appear: 'flip', death: 'shatter', deathColor: CL_COLS[ci].c, bonus: true });
                tg.ci = ci;
                D.slots[i] = tg;
            }
        },
        onHit(S, ent, info) {
            if (!ent.alive || ent.ci === undefined) return false;
            const D = S.data;
            S.hits++;
            ent.kill(info);
            if (ent.ci === D.live) {
                D.right++; S.kills++;
                S.bumpCombo();
                S.award(100 * S.comboMult, info.pt, CL_COLS[ent.ci].n, CL_COLS[ent.ci].css);
                SFX.ding(1.1);
            } else {
                D.wrong++; S.penalties++;
                S.award(-150, info.pt, 'WRONG COLOUR', '#f87171');
                S.breakCombo('WRONG COLOUR');
                SFX.buzzer();
                MG.flashScreen('rgba(220,38,38,0.25)');
            }
            return true;
        },
        hud(S) { const D = S.data; const c = CL_COLS[D.live]; return `<div class="ah3-panel"><div class="mgx-chip" style="border-color:${c.css}">LIVE <b style="color:${c.css}">${c.n}</b></div>${AK.chip('SWITCH IN', Math.max(0, D.switchT).toFixed(1), D.switchT < 1)}${AK.chip('WRONG', D.wrong, D.wrong > 0)}</div>`; },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return { score: S.score, stars, title: stars >= 3 ? 'COLOUR MASTER' : 'TIME!', stats: [['CORRECT', D.right], ['WRONG', D.wrong], ['BEST STREAK', S.maxCombo], ['ACCURACY', S.shots ? Math.round(S.shotHits / S.shots * 100) + '%' : '—']], xp: Math.round(120 + S.score * 0.04 + stars * 120) };
        }
    }));

    /* =====================================================================
       9. NUMBER CRUNCH
    ===================================================================== */
    MG.register(Object.assign({}, ARC, {
        id: 'number_crunch', order: 9, name: 'Number Crunch', icon: '🔢', accent: '#eab308',
        tagline: 'One, two, three… in order, fast.',
        desc: 'A set of numbered balloons floats up. Pop them in ascending order: 1, then 2, then 3. Popping the wrong number costs two seconds off the clock. Every finished set adds a speed bonus and the next set has one more balloon.',
        heroLabel: 'ARCADE HALL • SEQUENCE • 60 SECONDS', duration: 60, stars: [2500, 6000, 10000, 15000],
        standardWeapon: 'python_magnum', weaponLabel: 'PYTHON .357', weaponNote: 'Bottomless cylinder',
        keys: [['LMB', 'Pop the next number'], ['R', 'Retry from results']],
        map: AK.map({ skyTop: 0x1d4ed8, skyBottom: 0xfef3c7, fogColor: 0xfde68a, fogDensity: 0.005, sunIntensity: 1.6 }),
        build(S) {
            AK.hall(S, { title: 'NUMBER CRUNCH', accent: '#eab308', ground: 0x3f6212 });
            Object.assign(S.data, { size: 4, next: 1, set: [], setT: 0, sets: 0, wrong: 0, gapT: 0.4 });
        },
        _spawnSet(S) {
            const D = S.data;
            D.set = []; D.next = 1; D.setT = 0;
            const taken = [];
            for (let n = 1; n <= D.size; n++) {
                let x, y, tries = 0;
                do { x = (Math.random() - 0.5) * 12; y = 1.4 + Math.random() * 4; tries++; } while (tries < 30 && taken.some(([a, b]) => Math.hypot(a - x, b - y) < 1.5));
                taken.push([x, y]);
                const g = new THREE.Group();
                const col = [0xef4444, 0x3b82f6, 0x22c55e, 0xa855f7, 0xf97316, 0xec4899][n % 6];
                const ball = new THREE.Mesh(new THREE.SphereGeometry(0.55, 18, 14), new THREE.MeshStandardMaterial({ color: col, roughness: 0.25, metalness: 0.1 }));
                ball.scale.y = 1.15;
                const label = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshBasicMaterial({ map: AK.textTex('n' + n, String(n)), transparent: true, depthWrite: false }));
                label.position.z = 0.6; label.userData.noHit = true;
                const str = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1, 4), basic(0xffffff));
                str.position.y = -1.1; str.userData.noHit = true;
                g.add(ball, label, str);
                const ph = Math.random() * TAU, z = -10 - Math.random() * 3;
                const tg = S.addTarget({ mesh: g, hitMeshes: [ball], pos: V(x, y, z), life: 0, appear: 'scale', death: 'pop', deathColor: col, bonus: true, faceCamera: true,
                    motion: (t, age, out) => out.set(Math.sin(age * 0.7 + ph) * 0.6, Math.sin(age * 1.1 + ph) * 0.3, 0) });
                tg.num = n;
                D.set.push(tg);
            }
        },
        update(S, dt, lib, state) {
            const D = S.data;
            if (state !== 'running') return;
            D.setT += dt;
            if (!D.set.some((t) => t.alive)) { D.gapT -= dt; if (D.gapT <= 0) { this._spawnSet(S); D.gapT = 0.8; } }
        },
        onHit(S, ent, info) {
            if (!ent.alive || ent.num === undefined) return false;
            const D = S.data;
            S.hits++;
            if (ent.num === D.next) {
                ent.kill(info);
                S.kills++;
                S.bumpCombo();
                S.award(60 * S.comboMult, info.pt, String(ent.num), '#fde68a');
                SFX.pop();
                D.next++;
                if (D.next > D.size) {
                    const bonus = Math.max(100, Math.round(400 + D.size * 120 - D.setT * 70));
                    S.award(bonus, info.pt.clone().add(V(0, 1, 0)), 'SET CLEAR', '#86efac');
                    SFX.fanfare();
                    D.sets++;
                    D.size = Math.min(12, D.size + 1);
                }
            } else {
                D.wrong++;
                S.t = Math.min(S.duration - 0.1, S.t + 2);
                S.breakCombo('WRONG NUMBER');
                MG.popup(info.pt, `-2s (need ${D.next})`, '#f87171', true);
                SFX.buzzer();
                MG.flashScreen('rgba(220,38,38,0.25)');
            }
            return true;
        },
        hud(S) { const D = S.data; return `<div class="ah3-panel">${AK.chip('NEXT', D.next <= D.size ? D.next : '—')}${AK.chip('SET SIZE', D.size)}${AK.chip('SETS', D.sets)}${D.wrong ? AK.chip('WRONG', D.wrong, true) : ''}</div>`; },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return { score: S.score, stars, title: stars >= 3 ? 'HUMAN CALCULATOR' : 'TIME!', stats: [['SETS CLEARED', D.sets], ['LARGEST SET', D.size - (D.next > D.size ? 0 : 1)], ['WRONG POPS', D.wrong], ['BEST STREAK', S.maxCombo]], xp: Math.round(120 + S.score * 0.04 + stars * 120) };
        }
    }));

    /* =====================================================================
       10. ECHO PANELS
    ===================================================================== */
    const EP_COLS = [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x14b8a6, 0x3b82f6, 0x8b5cf6, 0xec4899, 0xf8fafc];
    const EP_TONES = [262, 294, 330, 349, 392, 440, 494, 523, 587];
    MG.register(Object.assign({}, ARC, {
        id: 'echo_panels', order: 10, name: 'Echo Panels', icon: '🧠', accent: '#8b5cf6',
        tagline: 'Watch. Remember. Shoot it back.',
        desc: 'Nine panels light up one after another, each with its own note. When the lights stop, shoot the same panels in the same order. Every round adds one more step. A mistake costs a life and replays a fresh sequence of the same length. Three lives, 120 seconds.',
        heroLabel: 'ARCADE HALL • MEMORY • 120 SECONDS', duration: 120, stars: [1500, 4000, 8000, 12000],
        standardWeapon: 'mk14', weaponLabel: 'LONE STAR DMR', weaponNote: 'Fires only while you repeat the pattern',
        keys: [['LMB', 'Repeat the sequence'], ['R', 'Retry from results']],
        map: AK.map({ skyTop: 0x020617, skyBottom: 0x1e1b4b }),
        build(S) {
            AK.hall(S, { title: 'ECHO PANELS', accent: '#8b5cf6' });
            const frame = new THREE.Mesh(new THREE.BoxGeometry(6.4, 6.4, 0.3), std(0x0f172a, 0.6, 0.4));
            frame.position.set(0, 3.4, -9.3);
            S.add(frame); S.solid(frame);
            const panels = [];
            for (let i = 0; i < 9; i++) {
                const mat = new THREE.MeshStandardMaterial({ color: EP_COLS[i], emissive: EP_COLS[i], emissiveIntensity: 0.12, roughness: 0.35 });
                const m = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.75, 0.15), mat);
                const tg = AK.tgt(S, m, V(-2 + (i % 3) * 2, 5.4 - Math.floor(i / 3) * 2, -9.05), { appear: 'none', inT: 0.01, bonus: true });
                tg.idx = i; tg.mat = mat; tg.glow = 0;
                tg.onTick = (t, dt) => { t.glow = Math.max(0, t.glow - dt * 2.5); t.mat.emissiveIntensity = 0.12 + t.glow * 1.6; };
                panels.push(tg);
            }
            Object.assign(S.data, { panels, len: 3, seq: [], input: 0, phase: 'wait', phaseT: 1.2, lives: 3, best: 0, rounds: 0 });
        },
        blockFire(S) { return S.data.phase !== 'input'; },
        _newSeq(S) {
            const D = S.data;
            D.seq = [];
            for (let i = 0; i < D.len; i++) { let k; do { k = Math.floor(Math.random() * 9); } while (D.seq.length && k === D.seq[D.seq.length - 1]); D.seq.push(k); }
            D.phase = 'show'; D.showI = 0; D.phaseT = 0.5; D.input = 0;
        },
        _flash(S, i, v = 0.15) { const p = S.data.panels[i]; p.glow = 1; SFX.tone(EP_TONES[i], EP_TONES[i], 0.32, 'triangle', v); },
        update(S, dt, lib, state) {
            const D = S.data;
            if (state !== 'running') return;
            D.phaseT -= dt;
            if (D.phase === 'wait' && D.phaseT <= 0) this._newSeq(S);
            else if (D.phase === 'show' && D.phaseT <= 0) {
                if (D.showI < D.seq.length) { this._flash(S, D.seq[D.showI]); D.showI++; D.phaseT = Math.max(0.32, 0.6 - D.len * 0.02); }
                else { D.phase = 'input'; MG.toast('YOUR TURN', '#c4b5fd'); }
            }
        },
        onHit(S, ent, info) {
            const D = S.data;
            if (ent.idx === undefined || D.phase !== 'input') return false;
            S.hits++;
            this._flash(S, ent.idx, 0.2);
            if (ent.idx === D.seq[D.input]) {
                D.input++;
                S.bumpCombo();
                S.award(50 * D.len, info.pt, '', '#c4b5fd');
                if (D.input >= D.seq.length) {
                    S.kills++;
                    D.rounds++;
                    D.best = Math.max(D.best, D.len);
                    S.award(200 * D.len, info.pt.clone().add(V(0, 1, 0)), 'ROUND ' + D.len, '#86efac');
                    SFX.fanfare();
                    D.len++;
                    D.phase = 'wait'; D.phaseT = 1.1;
                }
            } else {
                D.lives--;
                S.breakCombo('WRONG PANEL');
                SFX.buzzer();
                MG.flashScreen('rgba(220,38,38,0.25)');
                if (D.lives <= 0) { D.phase = 'over'; MG.finish('OUT OF LIVES', { color: '#f87171' }); }
                else { MG.toast(`WRONG • ${D.lives} LIVES • NEW SEQUENCE`, '#fca5a5'); D.phase = 'wait'; D.phaseT = 1.4; }
            }
            return false;
        },
        hud(S) { const D = S.data; return `<div class="ah3-panel">${AK.lives(D.lives, 3)}${AK.chip('LENGTH', D.len)}${AK.chip(D.phase === 'input' ? 'STEP' : 'WATCH', D.phase === 'input' ? (D.input + 1) + ' / ' + D.seq.length : '…')}</div>`; },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return { score: S.score, stars, title: D.best >= 10 ? 'PERFECT RECALL' : 'GAME OVER', stats: [['LONGEST SEQUENCE', D.best], ['ROUNDS', D.rounds], ['LIVES LEFT', Math.max(0, D.lives)], ['TIME', BO.Math.formatTime(S.t)]], noGraph: true, xp: Math.round(120 + S.score * 0.04 + stars * 120) };
        }
    }));

    /* =====================================================================
       11. SWITCHYARD
    ===================================================================== */
    const LANES = [-4, 0, 4];
    function cartMesh(kind) {
        const g = new THREE.Group();
        const tub = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 2.0), std(0x44403c, 0.6, 0.6));
        tub.position.y = 0.7;
        g.add(tub);
        for (const [x, z] of [[-0.7, 0.7], [0.7, 0.7], [-0.7, -0.7], [0.7, -0.7]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.12, 10), std(0x18181b, 0.5, 0.7)); w.rotation.z = Math.PI / 2; w.position.set(x, 0.25, z); g.add(w); }
        if (kind === 'tnt') {
            for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.9, 10), std(0xb91c1c, 0.6)); s.rotation.x = Math.PI / 2; s.position.set(-0.4 + i * 0.4, 1.2, 0); g.add(s); }
            const fuse = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), basic(0xfde047)); fuse.position.set(0, 1.5, 0.5); g.add(fuse);
        } else {
            const pile = new THREE.Mesh(new THREE.SphereGeometry(0.75, 12, 8, 0, TAU, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: kind === 'gem' ? 0x67e8f9 : 0xfacc15, metalness: 0.9, roughness: 0.25, emissive: kind === 'gem' ? 0x0891b2 : 0x854d0e, emissiveIntensity: 0.4 }));
            pile.position.y = 1.05; pile.scale.set(1, 0.6, 1.2); g.add(pile);
        }
        S_add_noHit(g);
        return g;
    }
    function S_add_noHit(g) { g.traverse((o) => { o.userData.noHit = true; }); }
    function switchTex(toBank) { return AK.textTex(toBank ? 'sw-bank' : 'sw-pit', toBank ? '◀ BANK' : 'PIT ▶', { w: 256, h: 128, size: 0.42, bg: toBank ? '#14532d' : '#7f1d1d' }); }
    MG.register(Object.assign({}, ARC, {
        id: 'switchyard', order: 11, name: 'Switchyard', icon: '🚂', accent: '#d97706',
        tagline: 'Gold to the bank. Dynamite to the pit.',
        desc: 'Mine carts roll down three tracks. Each track ends at a switch that sends carts left to the BANK or right to the PIT. You cannot shoot the carts, only the switches. Gold and gems belong in the bank, TNT belongs in the pit. Three TNT blasts in the bank and the yard closes.',
        heroLabel: 'ARCADE HALL • ROUTING • 60 SECONDS', duration: 60, stars: [2000, 4500, 7500, 11000],
        standardWeapon: 'm1911', weaponLabel: 'M1911', weaponNote: 'Bottomless magazine',
        keys: [['LMB', 'Flip a track switch'], ['R', 'Retry from results']],
        map: AK.map({ skyTop: 0x7c2d12, skyBottom: 0xfdba74, fogColor: 0xc2410c, fogDensity: 0.008, sunIntensity: 1.3 }, 'desert_sand'),
        build(S) {
            AK.hall(S, { title: 'SWITCHYARD', accent: '#d97706', ground: 0x78350f });
            const tie = std(0x5b3a1e, 0.9), steel = std(0x9ca3af, 0.3, 0.8);
            for (const x of LANES) {
                for (const sx of [-0.55, 0.55]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 34), steel); r.position.set(x + sx, 0.08, -25); S.add(r); }
                for (let z = -42; z < -8; z += 1.2) { const t = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.25), tie); t.position.set(x, 0.03, z); S.add(t); }
            }
            const bank = A.sign('BANK', 3, 1, { bg: '#14532d', color: '#fde68a', borderColor: '#facc15', size: 0.6 });
            bank.position.set(-9, 2.6, -8); bank.rotation.y = 0.6; S.add(bank);
            const pit = A.sign('PIT', 3, 1, { bg: '#450a0a', color: '#fca5a5', borderColor: '#ef4444', size: 0.6 });
            pit.position.set(9, 2.6, -8); pit.rotation.y = -0.6; S.add(pit);
            const vault = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 3), std(0x166534, 0.6, 0.3)); vault.position.set(-9, 1, -8); S.add(vault);
            const hole = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.1, 20), basic(0x1c0a00)); hole.position.set(9, 0.05, -8); S.add(hole);
            const switches = LANES.map((x, i) => {
                const mat = new THREE.MeshBasicMaterial({ map: switchTex(i % 2 === 0) });
                const m = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 0.12), mat);
                const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6), steel); post.position.y = -1.0; post.userData.noHit = true;
                const g = new THREE.Group(); g.add(m, post);
                const tg = AK.tgt(S, g, V(x, 1.9, -7.2), { hitMeshes: [m], appear: 'none', inT: 0.01, bonus: true });
                tg.toBank = i % 2 === 0; tg.mat = mat; tg.cd = 0; tg.lane = i;
                return tg;
            });
            Object.assign(S.data, { switches, carts: [], spawnT: 1, strikes: 0, banked: 0, pitted: 0, lost: 0 });
        },
        update(S, dt, lib, state) {
            const D = S.data;
            for (const sw of D.switches) sw.cd = Math.max(0, sw.cd - dt);
            if (state !== 'running') return;
            D.spawnT -= dt;
            if (D.spawnT <= 0) {
                D.spawnT = Math.max(1.0, 2.3 - S.t * 0.022);
                const r = Math.random();
                const kind = r < 0.08 ? 'gem' : r < 0.6 ? 'gold' : 'tnt';
                const lane = Math.floor(Math.random() * 3);
                const mesh = cartMesh(kind);
                mesh.position.set(LANES[lane], 0, -42);
                S.add(mesh);
                D.carts.push({ mesh, kind, lane, z: -42, speed: 4 + Math.random() * 2 + S.t * 0.05, exit: null, t: 0 });
            }
            for (let i = D.carts.length - 1; i >= 0; i--) {
                const c = D.carts[i];
                if (!c.exit) {
                    c.z += c.speed * dt;
                    c.mesh.position.z = c.z;
                    if (c.z >= -7.6) { c.exit = D.switches[c.lane].toBank ? 'bank' : 'pit'; c.from = c.mesh.position.clone(); }
                } else {
                    c.t += dt * 1.6;
                    const to = V(c.exit === 'bank' ? -9 : 9, 0, -8);
                    c.mesh.position.lerpVectors(c.from, to, Math.min(1, c.t));
                    if (c.t >= 1) { this._resolve(S, c); S.scene.remove(c.mesh); D.carts.splice(i, 1); }
                }
            }
        },
        _resolve(S, c) {
            const D = S.data;
            const at = c.mesh.position.clone().add(V(0, 2, 0));
            if (c.exit === 'bank') {
                if (c.kind === 'tnt') {
                    D.strikes++; S.penalties++;
                    BO.FX.spawnExplosion(at, 3, 0xf97316);
                    SFX.rumble(0.5);
                    S.award(-300, at, 'BOOM', '#f87171');
                    S.breakCombo('TNT IN THE BANK');
                    MG.flashScreen('rgba(249,115,22,0.3)');
                    if (D.strikes >= 3) MG.finish('THE BANK BLEW UP', { color: '#f87171' });
                } else { D.banked++; S.kills++; S.bumpCombo(); S.award((c.kind === 'gem' ? 450 : 150) * S.comboMult, at, c.kind === 'gem' ? 'GEMS!' : 'GOLD', '#fde68a'); SFX.ding(1.2); }
            } else if (c.kind === 'tnt') { D.pitted++; S.kills++; S.bumpCombo(); S.award(60 * S.comboMult, at, 'SAFE', '#86efac'); BO.FX.spawnExplosion(at.add(V(0, -2, 0)), 1.6, 0xf97316); SFX.thunk(); }
            else { D.lost++; S.award(-100, at, 'LOST IN THE PIT', '#f87171'); S.breakCombo('GOLD LOST'); SFX.comboBreak(); }
        },
        onHit(S, ent, info) {
            if (ent.toBank === undefined) return false;
            S.hits++;
            if (ent.cd > 0) return false;
            ent.cd = 0.2;
            ent.toBank = !ent.toBank;
            ent.mat.map = switchTex(ent.toBank);
            ent.mat.needsUpdate = true;
            SFX.clack();
            return false;
        },
        hud(S) { const D = S.data; return `<div class="ah3-panel">${AK.chip('BANKED', D.banked)}${AK.chip('TNT SAFE', D.pitted)}${AK.chip('BLASTS', D.strikes + ' / 3', D.strikes > 0)}</div>`; },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return { score: S.score, stars, title: D.strikes >= 3 ? 'YARD CLOSED' : stars >= 3 ? 'YARD MASTER' : 'SHIFT OVER', stats: [['CARTS BANKED', D.banked], ['TNT IN THE PIT', D.pitted], ['GOLD LOST', D.lost], ['BANK BLASTS', D.strikes], ['BEST STREAK', S.maxCombo]], xp: Math.round(120 + S.score * 0.04 + stars * 120) };
        },
        dispose(S) { for (const c of S.data.carts || []) S.scene.remove(c.mesh); }
    }));
})(window);
