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
    const FLIGHTS = [
        { name: 'Apron', width: 8, depth: 2, rate: 0.78, cross: 1 },
        { name: 'Switchback', width: 10, depth: 4, rate: 0.96, cross: 2 },
        { name: 'Far lane', width: 12, depth: 2, rate: 1.12, cross: 1 },
        { name: 'Figure eight', width: 11, depth: 6, rate: 1.21, cross: 2 },
        { name: 'Night shift', width: 14, depth: 5, rate: 1.48, cross: 3 }
    ];
    function runnerPosition(flight, phase, round, out) {
        return out.set(Math.sin(phase) * flight.width, 0,
            -15 - round * 2 + Math.sin(phase * flight.cross + 0.5) * flight.depth);
    }
    MG.register({
        id: 'fun_360_trickshot', cardImage: 'assets/minigames/fun_360_trickshot.webp', cat: 'fun', order: 4, name: '360 Trick Shot', icon: '🌀', accent: '#f59e0b', badge: 'SKILL',
        tagline: 'Launch from five industrial rooftops. Spin 360°, hit the runner, then watch your jump from the chase camera.',
        desc: 'Take off from five distinct industrial towers—Dispatch Roof, Freight Bridge, Cable Crane, Signal Mast and Chimney Crown—toward the moving runner below. Spin a full 360° in mid-air to arm your Intervention .408 for a crisp quickscope window, then watch your world-space slow-mo flight replay!',
        heroLabel: 'FLIGHT CIRCUIT • 5 LAUNCH TOWERS', duration: 120, stars: [1800, 3600, 5600, 8200],
        standardWeapon: 'intervention', lockWeapon: true, infiniteMag: true, maxScopeTime: 1.0, customMusic: true,
        blockFire: (S) => !(S && S.data && S.data.armedT > 0) || !!(S && S.data && S.data.killcamT > 0),
        hubOptions: [{ key:'flightRules', label:'SESSION', default:'tour', choices:[
            {val:'tour',label:'Tower Tour',desc:'Five launch platforms, two minutes, 0.50 s shot window.'},
            {val:'studio',label:'Practice Studio',desc:'Unlimited session time and a 1.25 s shot window.'}] }],
        variantKey: o => o.flightRules === 'studio' ? 'studio' : '',
        variantLabel: o => o.flightRules === 'studio' ? 'PRACTICE STUDIO' : 'TOWER TOUR',
        hideViewmodel: S => S.data.killcamT > 0,
        onKey(S,code){
            if (MG.state !== 'running') return false;
            if (code === 'KeyE' || (code === 'Space' && S.data.killcamT > 0)) return BO.FlightCircuit.launch(S);
            if (code === 'KeyF' || code === 'KeyQ') return BO.FlightCircuit.styleKey(S, code);
            return false;
        },
        guide: { objective: 'Land five airborne 360°/720°/1080° trick shots across five industrial launch platforms.', tips: [
            'Press [E] to launch cleanly off the deck. Hit a cyan Bounce Pad below to rocket 24 m back up for 720°/1080° double-bounce shots!',
            'Press [F] mid-air for a Nac-Swap twirl (+450) and [Q] for a Barrel Roll (+550). Shoot suspended gold Gongs for a Ricochet Bank-Shot!',
            'Shoot red Propane Barrels near the runner for an Explosive Collateral, or snipe the orbiting UAV drone!'
        ] },
        weaponLabel: 'INTERVENTION .408 (MID-AIR 360)', weaponNote: 'Launch [E] • 360°/720° Spin • [F] Nac-Swap • [Q] Barrel Roll • Bounce Pads!',
        keys: [['E', 'Launch from pad / skip replay'], ['MOUSE', 'Spin 360°/720°/1080° mid-air'], ['F / Q', 'Nac-Swap / Barrel Roll'], ['RMB / LMB', 'Quickscope / Fire armed!']],
        map: {
            atmosphere: { skyTop: 0x0b1224, skyBottom: 0xd9561a, fogColor: 0x3b180a, fogDensity: 0.0042, sunColor: 0xfdba74, sunIntensity: 1.6, sunPos: [-40, 28, -40], hemiSky: 0xfdba74, hemiGround: 0x1e293b, hemiIntensity: 0.92 },
            boxes: [B(0, -0.5, -16, 130, 1, 130, 'asphalt'), B(0, TOWER_H * 0.5, 0, 5.6, TOWER_H, 5.6, 'soviet_concrete')],
            spawn: { x: 0, y: TOWER_H + 0.15, z: 0.6, yaw: 0 }
        },
        build(S) {
            const CS = BO.CourseScenery;
            const steelM = CS.texMat('diamond_plate', 4, 4), railM = std(0xfacc15, 0.38, 0.62);
            // Crane tower trusses & 3 safety rails ONLY (Front ledge z = -2.8 is OPEN for jumping down!)
            for (const [x1, z1, x2, z2] of [[-2.7, 2.7, 2.7, 2.8], [-2.8, -2.7, -2.65, 2.8], [2.65, -2.7, 2.8, 2.8]]) {
                const bar = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x2 - x1), 1.0, Math.abs(z2 - z1)), railM);
                bar.position.set((x1 + x2) / 2, TOWER_H + 0.5, (z1 + z2) / 2); S.add(bar);
                S.collider(x1, TOWER_H, z1, x2, TOWER_H + 3, z2);
            }
            const arrow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.8), basic(0xfacc15));
            arrow.rotation.x = -Math.PI / 2; arrow.position.set(0, TOWER_H + 0.03, -1.7); S.add(arrow);
            const towerSign = A.sign('LAUNCH [E] -> 360°/720° -> [F] SWAP / [Q] ROLL!', 6.4, 0.85, { bg: '#451a03', color: '#fef08a', borderColor: '#facc15', size: 0.36 });
            towerSign.position.set(0, TOWER_H + 3.6, -2.7); S.add(towerSign);
            for (const sx of [-2.8, 2.8]) {
                const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.6, 0.35), steelM);
                post.position.set(sx, TOWER_H + 1.8, -2.7); S.add(post);
            }
            // Textured Corrugated Shipping Containers & Parked Tactical Humvee in Floodlit Courtyard!
            CS.cargoContainer(S, -16, 0, -20, 3.2, 2.9, 8.5, 'red', 0);
            CS.cargoContainer(S, 16, 0, -22, 3.2, 2.9, 8.5, 'blue', 0);
            CS.cargoContainer(S, -10, 0, -35, 8.5, 2.9, 3.2, 'olive', 0);
            CS.cargoContainer(S, 11, 0, -35, 8.5, 2.9, 3.2, 'red', 0);
            CS.humvee(S.scene, -16, 0, -7.5, 0.45, 0x3f4d36, false);
            for (const [tx, tz] of [[-18, -10], [18, -10], [-18, -32], [18, -32]]) S.add(A.torch(S, V(tx, 0, tz), 0xf97316, true));

            Object.assign(S.data, { spinAccum: 0, lastYaw: BO.Player.yaw, armedT: 0, jumped: false, inAir: false, round: 1, killcamT: 0, kills: 0, totalRounds: 5, attempts: 0 });
            BO.FlightCircuit.build(S);
            S.spawned = FLIGHTS.length;
            // Apron lighting and a suspended gantry frame the runner from the ledge.
            for (const side of [-1, 1]) {
                for (let i = 0; i < 9; i++) {
                    const strip = S.box(side * 15.8, 0.045, -7 - i * 3.7, 0.18, 0.08, 1.7, basic(0xffc777));
                    strip.receiveShadow = false;
                }
                S.box(side * 19, 4.4, -41, 0.42, 8.8, 0.42, steelM);
            }
            S.box(0, 8.6, -41, 38.5, 0.55, 0.6, steelM);
            for (let x = -16; x <= 16; x += 4) S.box(x, 8.22, -40.8, 1.6, 0.16, 0.24, basic(0x98e6ed));
            const route = new THREE.BufferGeometry();
            route.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(97 * 3), 3));
            S.data.route = new THREE.Line(route, new THREE.LineBasicMaterial({ color: 0x69d8e5 }));
            S.data.route.position.y = 0.09; S.data.route.frustumCulled = false; S.add(S.data.route);
            S.data.clean = 0; S.data.airTime = 0; S.data.windowUsed = false;
            this._spawnRunner(S, 1);
        },
        _respawnTop(S) {
            const P = BO.Player, D = S.data;
            P.hp = P.maxHp;
            D.windowUsed = false; D.airTime = 0;
            D.jumped = false; D.inAir = false; D.spinAccum = 0; D.armedT = 0;
            BO.FlightCircuit.reset(S);
        },
        _spawnRunner(S, rndNum) {
            const flight = FLIGHTS[rndNum - 1], v = V(), path = S.data.route.geometry.attributes.position;
            for (let i = 0; i < path.count; i++) {
                runnerPosition(flight, i / (path.count - 1) * TAU, rndNum, v);
                path.setXYZ(i, v.x, v.y, v.z);
            }
            path.needsUpdate = true;
            const fig = F.human({ skin: F.SKINS[rndNum % F.SKINS.length], shirt: 0xef4444, pants: 0x111827, helmet: true, hat: 'helmet', hatColor: 0xfacc15, gun: 'rifle', eyes: 'angry' });
            const ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.45, 24), basic(0xef4444, { side: THREE.DoubleSide }));
            ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; ring.userData.noHit = true;
            fig.root.add(ring);
            const tg = S.addTarget({
                mesh: fig.root, hitMeshes: fig.hit, pos: V(0, 0, -20), life: 0, appear: 'scale', inT: 0.2, death: 'knock', deathColor: 0xef4444, bonus: true,
                onTick: (t) => {
                    runnerPosition(flight, S.t * flight.rate + rndNum, rndNum, v);
                    const dx = v.x - t.root.position.x, dz = v.z - t.root.position.z;
                    t.root.position.copy(v); t.root.rotation.y = Math.atan2(dx, dz);
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
                if (D.round > D.totalRounds && S.duration) S.t = Math.min(S.t, S.duration - 0.05);
                BO.FlightCircuit.replay(S, THREE.MathUtils.clamp(1 - D.killcamT / 1.65, 0, 1));
                if (D.shotTrace) D.shotTrace.material.opacity = BO.Math.clamp(D.killcamT / 0.8, 0, 1);
                if (BO.State) BO.State.timeScale = 0.75;
                if (D.killcamT <= 0) {
                    if (D.shotTrace) D.shotTrace.visible = false;
                    if (BO.State) BO.State.timeScale = 1.0;
                    if (D.round > D.totalRounds) { MG.finish('360 TRICKSHOT MASTER!', { color: '#facc15' }); }
                    else { this._respawnTop(S); this._spawnRunner(S, D.round); }
                }
                return;
            }
            if (BO.State) BO.State.timeScale = 1.0;
            if (state !== 'running') return;
            if (BO.MinigameAudio) BO.MinigameAudio.tick(dt);
            if (BO.FlightCircuit.checkBouncePads(S, dt)) return;

            // Player can start a 360/720/1080 ANY TIME while airborne!
            const inAir = BO.FlightCircuit.airborne(S);
            const height = BO.FlightCircuit.pad(D).y;
            D.inAir = inAir;
            if (inAir) D.airTime += dt;
            else { D.armedT = 0; D.windowUsed = false; D.airTime = 0; }
            const lit = D.armedT > 0 ? 12 : Math.floor(Math.abs(D.spinAccum) / TAU * 12);
            D.lamps.forEach((lamp, i) => lamp.material.color.setHex(i < lit ? 0xffc65c : 0x254451));
            if (!D.jumped && P.pos.y < height - 1.0) D.jumped = true;
            if (!inAir) D.spinAccum = 0;

            if (D.jumped && (P.pos.y <= 0.45 || (P.onGround && P.pos.y < height - 1))) {
                D.attempts++;
                SFX.buzzer();
                MG.flashScreen('rgba(239,68,68,0.3)');
                MG.toast('MISSED — RESPAWNED BACK AT PAD!', '#fca5a5');
                this._respawnTop(S);
                return;
            }

            BO.FlightCircuit.record(S, dt);
            const dy = BO.Math.angleDiff(D.lastYaw, P.yaw);
            D.lastYaw = P.yaw;
            if (inAir) {
                D.spinAccum += dy;
                const q = Math.floor((Math.abs(D.spinAccum) / TAU) * 4);
                if (q > D.flight.lastQuarter && q < 4) {
                    D.flight.lastQuarter = q;
                    if (BO.MinigameAudio) BO.MinigameAudio.spinTick(q - 1);
                }
                if (Math.abs(D.spinAccum) >= TAU - 0.00001) {
                    D.flight.spinsDone++;
                    D.flight.lastQuarter = 0;
                    D.windowUsed = true;
                    D.armedT = D.flight.practice ? 1.25 : 0.58;
                    D.spinAccum = 0;
                    if (BO.MinigameAudio) BO.MinigameAudio.spinTick(3); else SFX.ding(1.3);
                    MG.toast((D.flight.spinsDone * 360) + '° ARMED — FIRE NOW!', '#4ade80');
                }
            }
            if (D.armedT > 0) {
                D.armedT -= dt;
                if (D.armedT <= 0) MG.toast('SHOT WINDOW EXPIRED!', '#fde68a');
            }
        },
        onHit(S, ent, info) {
            const D = S.data, f = D.flight;
            if (!ent.alive || D.armedT <= 0 || D.killcamT > 0) return false;
            if (!D.inAir || BO.Player.onGround) return false;
            if (ent.isBonusUav) {
                ent.kill(info); S.award(550 * S.comboMult, info.pt, 'MID-AIR UAV SNIPE!', '#22d3ee');
                SFX.star(2); return true;
            }
            let trickBonus = 0, trickLabel = '';
            if (ent.isRicochetGong && D.runner && D.runner.alive) {
                if (BO.MinigameAudio) BO.MinigameAudio.gongRicochet();
                BO.FX.spawnTracer(info.pt, D.runner.root.position.clone().add(V(0, 1.2, 0)), 0xfacc15, 0.07, 0.35);
                trickBonus = 900; trickLabel = 'RICOCHET GONG BANK SHOT!';
                ent = D.runner; info = Object.assign({}, info, { pt: D.runner.root.position.clone().add(V(0, 1.2, 0)) });
            } else if (ent.isPropaneBarrel && D.runner && D.runner.alive) {
                ent.kill(info); BO.FX.spawnExplosion(info.pt, 6.5, 0xf97316); SFX.rumble(0.75);
                if (D.runner.root.position.distanceTo(info.pt) < 10.5) {
                    trickBonus = 850; trickLabel = 'EXPLOSIVE COLLATERAL!';
                    ent = D.runner; info = Object.assign({}, info, { pt: D.runner.root.position.clone().add(V(0, 1.2, 0)) });
                } else { S.award(300, info.pt, 'PROPANE BLAST!', '#fb923c'); return true; }
            }
            if (ent !== D.runner) return false;
            const winMax = f.practice ? 1.25 : 0.58;
            const snap = Math.max(0, winMax - D.armedT);
            D.lastSnap = snap; BO.FlightCircuit.beginReplay(S, info.pt);
            if (!D.shotTrace) {
                const g = new THREE.BufferGeometry();
                g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3));
                D.shotTrace = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffe8a6, transparent: true }));
                D.shotTrace.frustumCulled = false; S.add(D.shotTrace);
            }
            const origin = BO.App.worldCamera.position, points = D.shotTrace.geometry.attributes.position;
            points.setXYZ(0, origin.x, origin.y, origin.z); points.setXYZ(1, info.pt.x, info.pt.y, info.pt.z);
            points.needsUpdate = true; D.shotTrace.visible = true;
            if (snap <= 0.20) D.clean++;
            D.armedT = 0; D.spinAccum = 0;
            const spinBonus = f.spinsDone >= 3 ? 1400 : f.spinsDone === 2 ? 600 : 0;
            const styleBonus = (f.nacSwap ? 450 : 0) + (f.barrelRoll ? 550 : 0) + (f.bounceCount > 0 ? 500 : 0) + trickBonus;
            const bonus = (info.hitbox === 'head' ? 750 : 0) + (BO.Player.adsAlpha > 0.2 ? 550 : 300) + spinBonus + styleBonus;
            const spinTag = (Math.max(1, f.spinsDone) * 360) + '°';
            const banner = [spinTag, ...f.styleTags, trickLabel || (info.hitbox === 'head' ? 'HEADSHOT' : BO.Player.adsAlpha > 0.2 ? 'QUICKSCOPE' : 'NO-SCOPE')].filter(Boolean).join(' + ');
            ent.kill(info);
            D.kills++; D.round++; S.kills++; S.bumpCombo();
            S.award((1200 + bonus + (snap <= 0.20 ? 300 : 0)) * S.comboMult, info.pt, banner, '#facc15');
            SFX.star(3); BO.FX.spawnExplosion(info.pt, 3.6, 0xfacc15);
            D.killcamT = 1.85;
            MG.toast('🎬 ' + banner + '!', '#facc15');
            return true;
        },
        result(S) {
            const d = S.data, stars = S.def.stars.filter(n => S.score >= n).length;
            return { score: S.score, stars, xp: 120 + Math.round(S.score * 0.06) + stars * 150,
                title: d.kills === 5 ? 'FLIGHT SERIES COMPLETE' : 'FLIGHT REPORT',
                stats: [['FLIGHTS LANDED', d.kills + '/5'], ['QUICK RELEASES', d.clean], ['MISSED LANDINGS', d.attempts],
                    ['LAST RELEASE', d.lastSnap == null ? '—' : Math.round(d.lastSnap * 1000) + ' ms']] };
        },
        dispose(S) {
            BO.FlightCircuit.stop(S);
            for (const line of [S.data.route, S.data.shotTrace]) if (line) { line.geometry.dispose(); line.material.dispose(); }
            if (BO.State) BO.State.timeScale = 1.0;
        },
        hud(S) {
            const D = S.data;
            const deg = Math.min(360, Math.round(Math.abs(D.spinAccum) * 180 / Math.PI));
            const scopeLeft = Math.max(0, 1.0 - (S.data._scopeT || 0));
            const padName = BO.FlightCircuit.pad(D).name.toUpperCase();
            const status = D.killcamT > 0
                ? `REPLAY • RELEASE <b>${Math.round(D.lastSnap * 1000)} ms</b> [SPACE SKIP]`
                : !D.inAir
                    ? `PRESS <b>[E]</b> LAUNCH • ${padName}`
                    : D.armedT > 0
                        ? `<b style="color:#4ade80">ARMED • FIRE ${D.armedT.toFixed(2)}s!</b>`
                        : `SPIN <b>${deg}° / 360°</b>`;
            return `<div class="course-console flight-console"><strong>${FLIGHTS[Math.min(D.round, 5) - 1].name} (${Math.min(D.round, D.totalRounds)}/${D.totalRounds})</strong><span>${status}</span><span>SCOPE <b>${scopeLeft.toFixed(2)}s</b></span><span>FALLS <b>${D.attempts}</b></span></div>`;
        }
    });

    /* =====================================================================
       5. MARIO FPS — Prism Foundry & Classic Worlds 1-1 to 1-4 + Bowser
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
        o.connect(g); g.connect(BO.Sound.sfxGain || ctx.destination);
        o.start(t0); o.stop(t0 + dur + 0.02);
    };
    const mCoinSfx = () => { if (BO.MinigameAudio) BO.MinigameAudio.marioCoin(); else { mTone(988, 0.08, 'square', 0.1, 0); mTone(1319, 0.28, 'square', 0.1, 0.07); } };
    const mPowerSfx = () => { if (BO.MinigameAudio) BO.MinigameAudio.marioPowerup(); else [523, 659, 784, 1047, 1319].forEach((f, i) => mTone(f, 0.1, 'square', 0.09, i * 0.055)); };
    const mPipeSfx = () => { if (BO.MinigameAudio) BO.MinigameAudio.marioPipe(); else [620, 480, 340, 220].forEach((f, i) => mTone(f, 0.09, 'square', 0.1, i * 0.07)); };

    function marioTex(kind) {
        return L.canvasTex('mario-' + kind + '-v2', 128, 128, (g, w, h) => {
            if (kind === 'brick' || kind === 'ubrick' || kind === 'cbrick') {
                g.fillStyle = kind === 'ubrick' ? '#1d4ed8' : kind === 'cbrick' ? '#57534e' : '#c84c0c';
                g.fillRect(0, 0, w, h);
                for (let y = 0; y < h; y += 32) {
                    const off = (y / 32) % 2 ? 32 : 0;
                    for (let x = off - 64; x < w; x += 64) {
                        g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x + 3, y + 3, 58, 5);
                        g.fillStyle = 'rgba(0,0,0,0.20)'; g.fillRect(x + 3, y + 24, 58, 5);
                    }
                }
                g.strokeStyle = kind === 'ubrick' ? '#091026' : '#1c0f07';
                g.lineWidth = 5;
                for (let y = 0; y <= h; y += 32) {
                    g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
                    const off = (y / 32) % 2 ? 32 : 0;
                    for (let x = off; x < w; x += 64) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); }
                }
            } else if (kind === 'q') {
                g.fillStyle = '#f59e0b'; g.fillRect(0, 0, w, h);
                g.fillStyle = '#fbbf24'; g.fillRect(8, 8, w - 16, h - 16);
                g.strokeStyle = '#92400e'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
                g.fillStyle = '#78350f';
                for (const [rx, ry] of [[16, 16], [112, 16], [16, 112], [112, 112]]) g.fillRect(rx - 4, ry - 4, 8, 8);
                g.font = '900 84px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
                g.fillStyle = '#78350f'; g.fillText('?', w / 2 + 5, h / 2 + 9);
                g.fillStyle = '#fef9c3'; g.fillText('?', w / 2, h / 2 + 4);
            } else if (kind === 'used') {
                g.fillStyle = '#78350f'; g.fillRect(0, 0, w, h);
                g.fillStyle = '#92400e'; g.fillRect(10, 10, w - 20, h - 20);
                g.strokeStyle = '#451a03'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
                g.fillStyle = '#451a03';
                for (const [rx, ry] of [[16, 16], [112, 16], [16, 112], [112, 112]]) g.fillRect(rx - 4, ry - 4, 8, 8);
            } else if (kind === 'over') {
                // Classic Super Mario terracotta earth + lush scalloped emerald grass
                g.fillStyle = '#c84c0c'; g.fillRect(0, 26, w, h - 26);
                g.fillStyle = '#9a3412';
                for (let y = 32; y < h; y += 32) {
                    const off = ((y - 32) / 32) % 2 ? 32 : 0;
                    for (let x = off; x < w; x += 64) g.fillRect(x, y, 30, 28);
                }
                g.strokeStyle = '#451a03'; g.lineWidth = 3;
                for (let y = 32; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
                g.fillStyle = '#22c55e'; g.fillRect(0, 0, w, 26);
                g.fillStyle = '#4ade80'; g.fillRect(0, 0, w, 8);
                g.fillStyle = '#15803d';
                for (let x = 0; x < w; x += 16) { g.beginPath(); g.arc(x + 8, 26, 8, 0, Math.PI); g.fill(); }
            } else {
                // World 1-3 mushroom/treetop bright grass & warm wood
                g.fillStyle = '#16a34a'; g.fillRect(0, 0, w, 28);
                g.fillStyle = '#4ade80'; g.fillRect(0, 0, w, 8);
                g.fillStyle = '#b45309'; g.fillRect(0, 28, w, h - 28);
                g.strokeStyle = '#78350f'; g.lineWidth = 4;
                for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 28); g.lineTo(x, h); g.stroke(); }
            }
        });
    }

    const MARIO_WORLDS = [
        { id: '1-1', name: 'WORLD 1-1: MUSHROOM KINGDOM', sky: 0x5c94fc, ground: 0xc84c0c, gkind: 'over', len: 132 },
        { id: '1-2', name: 'WORLD 1-2: UNDERGROUND CAVERN', sky: 0x050816, ground: 0x1d4ed8, gkind: 'ubrick', len: 128 },
        { id: '1-3', name: 'WORLD 1-3: SKY TREETOP BRIDGES', sky: 0x60a5fa, ground: 0xfacc15, gkind: 'tree', len: 126 },
        { id: '1-4', name: "WORLD 1-4: BOWSER'S LAVA CASTLE", sky: 0x140b0e, ground: 0x57534e, gkind: 'cbrick', len: 118 }
    ];

    MG.register({
        id: 'fun_mario_fps', cardImage: 'assets/minigames/fun_mario_fps.webp', cat: 'fun', order: 5, name: 'Mario FPS', icon: '🍄', accent: '#ef4444', badge: 'EPIC',
        tagline: 'Run, stomp Goombas & Koopas, hit ? Blocks, enter green Warp Pipes and defeat 3-Form Bowser!',
        desc: 'Play iconic first-person Super Mario across Worlds 1-1 Mushroom Kingdom, 1-2 Underground Cavern (with Warp Zone), 1-3 Sky Treetops & 1-4 Bowser\'s Lava Castle! Stomp Goombas, kick Koopa Shells, grab Super Mushrooms, Fire Flowers & Starman, find secret warp pipes, and pick up the FAMAS + Desert Eagle to battle 3-Form Bowser (plus optional Prism Foundry bonus campaign).',
        hubOptions: [{key:'platformCourse',label:'CAMPAIGN',default:'classic',choices:[
            {val:'classic',label:'Super Mario 1-1 to 1-4',desc:'Classic Mario Worlds 1-1 through 1-4 with ? Blocks, Warp Pipes, Goombas, Koopas, chiptune music, FAMAS + Deagle and 3-Form Bowser.'},
            {val:'foundry',label:'Prism Foundry',desc:'Bonus sci-fi campaign: shift bridges with E, grapple gold anchors with Q, air boost with V and crack the Governor.'}]}],
        variantKey: o => o.platformCourse==='foundry' ? 'foundry' : '',
        variantLabel: o => o.platformCourse==='foundry' ? 'PRISM FOUNDRY' : 'SUPER MARIO 1-1..1-4',
        starsFor: o => o.platformCourse==='foundry' ? [1000,3000,6000,8100] : [4500,9000,14500,22000],
        dispose(S) {
            BO.PrismFoundry.dispose(S);
            if (BO.MinigameAudio) BO.MinigameAudio.stop();
        },
        heroLabel: 'FIRST-PERSON SUPER MARIO • 4 WORLDS + BOWSER', duration: 0, stars: [4500, 9000, 14500, 22000],
        standardWeapon: 'famas_f1', secondaryWeapon: 'deagle', lockWeapon: true, infiniteMag: true, customMusic: true,
        hideViewmodel: (S) => !(S && S.data && S.data.hasGuns),
        blockFire: (S) => !(S && S.data && (S.data.hasGuns || S.data.power === 'fire')),
        weaponLabel: 'STOMP / FIRE FLOWER / FAMAS + DEAGLE', weaponNote: 'Jump on Goombas & Koopas • Hit ? Blocks • [E] Enter Warp Pipes • Grab FAMAS + Deagle for Bowser!',
        guide: { objective: 'Clear Super Mario Worlds 1-1 through 1-4, reach the Flagpole castles, grab the FAMAS + Desert Eagle in World 1-4, and defeat all 3 forms of Bowser!', tips: ['Jump under glowing golden ? Blocks to pop out Super Mushrooms, Fire Flowers (LMB shoots fireballs!), Starman invincibility & Coins.', 'Stomp Goombas and Koopa Troopas from above—stomping a Koopa launches a spinning green shell that bowls through enemies!', 'Stand on green Warp Pipes and press [E] or [C] to discover secret Coin Rooms, Sky Clouds & the 1-2 Warp Zone (there is also a red 180° Secret Pipe behind 1-1 spawn!).'] },
        keys: [['SPACE', 'Jump / Stomp Goombas'], ['E / C', 'Enter Green Warp Pipe / Grab Guns'], ['LMB', 'Fireball (Fire Flower) / Shoot Bowser'], ['V', 'Mid-Air Double Jump Boost'], ['WASD', 'Run & Platform']],
        map: {
            atmosphere: { skyTop: 0x5c94fc, skyBottom: 0x93c5fd, fogColor: 0x93c5fd, fogDensity: 0.0036, sunColor: 0xfffbeb, sunIntensity: 1.75, sunPos: [20, 60, 20], hemiSky: 0xe0f2fe, hemiGround: 0x15803d, hemiIntensity: 0.95 },
            boxes: [],
            spawn: { x: 0, y: 0.1, z: 0, yaw: 0 }
        },
        build(S) {
            S.data.ringsTaken = 0; S.data.recoveries = 0; S.data.beaconsLit = 0;
            S.data.stageIdx = 0; S.data.power = 'small'; S.data.hasGuns = false; S.data.coins = 0;
            S.data.stageObjs = []; S.data.fireballs = []; S.data.bFire = [];
            S.data.bHammers = []; S.data.bHazards = []; S.data.bWaves = []; S.data.bBeams = [];
            S.data.bowser = null; S.data.bowserForm = 0; S.data.musicStep = 0; S.data.musicTimer = 0;
            if (S.opts.platformCourse === 'foundry') BO.PrismFoundry.build(S);
            else this._loadWorld(S, 0);
        },
        _clearWorld(S) {
            const retired = new THREE.Group();
            for (const o of S.data.stageObjs) if (o.parent) retired.add(o);
            for (const p of [...S.data.fireballs, ...S.data.bFire, ...(S.data.bHammers || []), ...(S.data.bWaves || [])]) {
                if (p.mesh && p.mesh.parent) retired.add(p.mesh);
            }
            for (const hz of S.data.bHazards || []) {
                if (hz.ring && hz.ring.parent) retired.add(hz.ring);
                if (hz.meteor && hz.meteor.parent) retired.add(hz.meteor);
            }
            for (const bm of S.data.bBeams || []) {
                if (bm.group && bm.group.parent) retired.add(bm.group);
            }
            S.data.fireballs.length = 0; S.data.bFire.length = 0;
            if (S.data.bHammers) S.data.bHammers.length = 0;
            if (S.data.bHazards) S.data.bHazards.length = 0;
            if (S.data.bWaves) S.data.bWaves.length = 0;
            if (S.data.bBeams) S.data.bBeams.length = 0;
            for (const target of S.targets) if (target.root.parent) retired.add(target.root);
            MG._releaseGpu(retired);
            S.data.stageObjs = [];
            S.clearTargets();
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
            const pipeM = std(0x22c55e, 0.22, 0.16);
            const hiM = basic(0x86efac);
            const darkM = std(0x14532d, 0.5);
            const g = new THREE.Group();
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, h, 20), pipeM); body.position.y = h * 0.5;
            const hiBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, h - 0.04, 0.08), hiM); hiBody.position.set(-0.42, h * 0.5, 0.87);
            const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, 0.52, 20), pipeM); rim.position.y = h + 0.12;
            const hiRim = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.48, 0.08), hiM); hiRim.position.set(-0.48, h + 0.12, 1.12);
            const lip = new THREE.Mesh(new THREE.TorusGeometry(1.16, 0.055, 8, 22), darkM); lip.rotation.x = Math.PI / 2; lip.position.y = h - 0.14;
            const hole = new THREE.Mesh(new THREE.CircleGeometry(0.88, 18), basic(0x050505)); hole.rotation.x = -Math.PI / 2; hole.position.y = h + 0.39;
            g.add(body, hiBody, rim, hiRim, lip, hole);
            g.position.set(x, y0, z); this._addObj(S, g);
            S.collider(x - 1.05, y0, z - 1.05, x + 1.05, y0 + h + 0.36, z + 1.05);
            if (hasPiranha) {
                const pm = new THREE.Group();
                const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.25, 10), std(0x16a34a, 0.45)); stem.position.y = 0.62;
                for (const s of [-1, 1]) {
                    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), std(0x22c55e, 0.45));
                    leaf.scale.set(1.5, 0.28, 0.75); leaf.position.set(s * 0.45, 0.55, 0); leaf.rotation.z = s * 0.35; pm.add(leaf);
                }
                const head = new THREE.Mesh(new THREE.SphereGeometry(0.58, 14, 12), std(0xef4444, 0.32)); head.position.y = 1.32;
                const spotM = basic(0xf8fafc);
                for (const [sx, sy, sz] of [[0.35, 1.5, 0.38], [-0.36, 1.46, 0.36], [0, 1.72, 0.35], [0.42, 1.18, 0.28], [-0.42, 1.2, 0.28]]) {
                    const sp = new THREE.Mesh(new THREE.SphereGeometry(0.11, 7, 6), spotM); sp.position.set(sx, sy, sz); pm.add(sp);
                }
                const lips = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.085, 8, 16), basic(0xffffff));
                lips.position.set(0, 1.38, 0.46); lips.rotation.x = 0.3;
                const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.32, 12), basic(0x450a0a));
                mouth.position.set(0, 1.38, 0.48); mouth.rotation.x = -0.3;
                for (const tx of [-0.18, 0, 0.18]) {
                    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 5), spotM);
                    tooth.position.set(tx, 1.56, 0.54); tooth.rotation.x = Math.PI; pm.add(tooth);
                }
                pm.add(stem, head, lips, mouth); pm.position.set(x, y0 + h - 0.6, z); this._addObj(S, pm);
                S.data.piranhas.push({ mesh: pm, baseY: y0 + h - 0.5, ph: Math.random() * 6 });
            }
            if (warpFn) S.data.pipes.push({ x, z, y: y0 + h + 0.38, warpFn });
        },
        _addCoin(S, x, y, z) {
            const c = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 12), basic(0xfacc15));
            c.rotation.x = Math.PI / 2; c.position.set(x, y, z); this._addObj(S, c);
            S.data.coinMeshes.push({ mesh: c, hit: false });
        },
        _addGoomba(S, x, z, koopa = false) {
            const gm = new THREE.Group();
            if (koopa) {
                const shell = new THREE.Mesh(new THREE.SphereGeometry(0.56, 14, 10), std(0x16a34a, 0.35, 0.18)); shell.scale.set(1.02, 0.92, 1.24); shell.position.y = 0.68;
                const rim = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.07, 6, 16), std(0xf8fafc, 0.6)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.44;
                const hd = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), std(0xfacc15, 0.55)); hd.position.set(0, 1.28, 0.38);
                for (const s of [-1, 1]) {
                    const ft = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.38), std(0xf97316, 0.6)); ft.position.set(s * 0.24, 0.10, 0.08); gm.add(ft);
                    const ey = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), basic(0x111111)); ey.position.set(s * 0.14, 1.36, 0.66); gm.add(ey);
                }
                gm.add(shell, rim, hd);
            } else {
                const cap = new THREE.Mesh(new THREE.SphereGeometry(0.62, 14, 10), std(0x854d0e, 0.65)); cap.scale.set(1.22, 0.84, 1.12); cap.position.y = 0.88;
                const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.44, 0.52, 10), std(0xfef3c7, 0.78)); stem.position.y = 0.42;
                for (const s of [-1, 1]) {
                    const ft = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), std(0x291509, 0.85)); ft.scale.set(1.1, 0.6, 1.4); ft.position.set(s * 0.28, 0.14, 0.06); gm.add(ft);
                    const e = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), basic(0x111111)); e.position.set(s * 0.24, 0.90, 0.58); gm.add(e);
                    const br = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.06), basic(0x111111)); br.position.set(s * 0.24, 1.06, 0.58); br.rotation.z = s * -0.35; gm.add(br);
                }
                gm.add(cap, stem);
            }
            const tg = S.addTarget({ mesh: gm, pos: V(x, 0, z), life: 0, appear: 'none', inT: 0.01, death: 'squash', deathColor: koopa ? 0x16a34a : 0x78350f, points: koopa ? 350 : 200, bonus: true });
            tg.vx = (z % 4 === 0 ? -3.1 : 3.1); tg.isKoopa = koopa; S.data.goombas.push(tg);
        },
        _spawnKickShell(S, x, z, dirZ = -1) {
            const sh = new THREE.Mesh(new THREE.SphereGeometry(0.52, 14, 10), std(0x16a34a, 0.3, 0.25));
            sh.scale.set(1.05, 0.72, 1.15); sh.position.set(x, 0.42, z);
            const rim = new THREE.Mesh(new THREE.TorusGeometry(0.50, 0.065, 6, 16), basic(0xf8fafc));
            rim.rotation.x = Math.PI / 2; sh.add(rim);
            this._addObj(S, sh);
            if (BO.MinigameAudio) BO.MinigameAudio.marioShellKick();
            S.data.shells.push({ mesh: sh, vx: 0, vz: dirZ * 17.5, life: 4.5, streak: 0 });
        },
        _loadWorld(S, idx) {
            this._clearWorld(S);
            const W = MARIO_WORLDS[idx], D = S.data;
            D.checkpoint = V(0, 0.3, 0); D.boostReady = true; D.beaconLit = false;
            D.rings = [];
            S.data.stageIdx = idx; S.data.world = W; S.data.musicTrack = W.id; S.data.musicStep = 0; S.data.inBonus = false;
            S.data.shells = []; S.data.starT = 0; S.data.thwomps = [];
            if (BO.MinigameAudio) BO.MinigameAudio.start('mario:' + W.id);
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
                // Iconic Super Mario Spotted Hills, Scalloped Bushes & Smiling 3-Puff Clouds!
                const hillM = std(0x22c55e, 0.72), spotM = std(0x15803d, 0.8), bushM = std(0x16a34a, 0.78), eyeM = basic(0x111111), clM = basic(0xffffff);
                for (const s of [-1, 1]) for (let z = -10; z > -W.len; z -= 22) {
                    // Mario Spotted Hill with cute vertical oval eyes
                    const hill = new THREE.Group();
                    const dome = new THREE.Mesh(new THREE.SphereGeometry(4.6, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), hillM);
                    dome.scale.set(1.0, 1.45, 1.0); hill.add(dome);
                    for (const [sx, sy, sz] of [[-1.4, 2.4, 3.3], [1.6, 1.9, 3.2], [0.2, 4.1, 2.2]]) {
                        const sp = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), spotM);
                        sp.scale.set(1.1, 1.4, 0.35); sp.position.set(sx, sy, sz); hill.add(sp);
                    }
                    for (const ex of [-0.65, 0.65]) {
                        const ey = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), eyeM);
                        ey.scale.set(0.7, 1.9, 0.4); ey.position.set(ex, 3.6, 3.25); hill.add(ey);
                    }
                    hill.position.set(s * 13.5, -0.1, z); hill.rotation.y = -s * Math.PI * 0.42; this._addObj(S, hill);

                    // Scalloped 3-Puff Green Mario Bush along road shoulder
                    const bush = new THREE.Group();
                    for (const [bx, by, br] of [[-0.95, 0.65, 0.78], [0, 0.95, 1.02], [0.95, 0.65, 0.78]]) {
                        const pf = new THREE.Mesh(new THREE.SphereGeometry(br, 10, 8), bushM); pf.position.set(bx, by, 0); bush.add(pf);
                    }
                    bush.position.set(s * 6.4, -0.1, z - 10); bush.rotation.y = Math.PI / 2; this._addObj(S, bush);

                    // 3-Puff Fluffy Smiling Mario Cloud
                    const cl = new THREE.Group();
                    for (const [cx, cy, cr] of [[-1.9, 0, 1.35], [0, 0.55, 1.75], [1.9, 0, 1.35]]) {
                        const pf = new THREE.Mesh(new THREE.SphereGeometry(cr, 10, 8), clM); pf.scale.set(1.15, 0.85, 0.85); pf.position.set(cx, cy, 0); cl.add(pf);
                    }
                    for (const ex of [-0.45, 0.45]) {
                        const ey = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), eyeM);
                        ey.scale.set(0.65, 1.8, 0.4); ey.position.set(ex, 0.35, 1.48); cl.add(ey);
                    }
                    cl.position.set(-s * 10.5, 11.2, z - 6); this._addObj(S, cl);
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

                this._addBox(S, 0, 2.8, -66, 4.5, 1.2, 1.4, brickM); addQ(0, 2.8, -68, 'star');
                for (let step = 0; step < 6; step++) this._addBox(S, -2.5, 0.5 + step * 0.45, -110 - step * 1.4, 4.5, 1 + step * 0.9, 1.35, brickM);
                for (const gz of [-15, -36, -64, -88, -102]) this._addGoomba(S, 1.5, gz, gz === -88 || gz === -36);
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
                S.data.movers.push({ mesh: mv1, collider: BO.World.colliders.at(-1), base: V(0, 1.2, -44), axis: 'x', amp: 3.5, spd: 1.4 });
                treePlat(-2.5, 2.0, -64, 8, 16, 0x16a34a);
                addQ(-2.5, 5.0, -64, 'mushroom');
                this._addPipe(S, -4.5, 2.45, -66, 1.5, false, () => { mPipeSfx(); D.power = 'fire'; P.pos.set(0, 1.8, -102); MG.toast('SECRET SKY PIPE! FIRE FLOWER + SKIP!', '#f97316'); });
                const mv2 = this._addBox(S, 2, 2.0, -84, 5.5, 0.65, 5.5, std(0xfacc15, 0.4), true);
                S.data.movers.push({ mesh: mv2, collider: BO.World.colliders.at(-1), base: V(2, 2.0, -84), axis: 'y', amp: 1.6, spd: 1.6 });
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
                // 2 Castle Thwomps that slam down when you approach!
                for (const tz of [-58, -94]) {
                    const th = new THREE.Group();
                    const blk = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.0, 2.0), std(0x475569, 0.72));
                    for (const sx of [-0.6, 0.6]) {
                        const ey = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.12), basic(0xef4444));
                        ey.position.set(sx, 0.35, 1.02); th.add(ey);
                    }
                    th.add(blk); th.position.set(0, 5.2, tz); this._addObj(S, th);
                    S.data.thwomps.push({ mesh: th, z: tz, y: 5.2, baseY: 5.2, state: 'idle', wait: 0 });
                }
            }

            if (W.id !== '1-4') {
                // Iconic Super Mario Flagpole (Gold Finial + Green Star Flag) & Crenellated Brick Castle!
                const poleBase = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.2, 1.3), brickM);
                poleBase.position.set(0, 0.6, -W.len);
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 8.2, 12), std(0xf8fafc, 0.25, 0.6));
                pole.position.set(0, 4.7, -W.len);
                const finial = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), std(0xfacc15, 0.2, 0.85, { emissive: 0xca8a04, emissiveIntensity: 0.3 }));
                finial.position.set(0, 8.9, -W.len);
                const flag = new THREE.Group();
                const flagCloth = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.15, 0.08), basic(0xf8fafc));
                const flagEmblem = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), basic(0x22c55e)); flagEmblem.scale.set(1, 1, 0.25);
                flag.add(flagCloth, flagEmblem); flag.position.set(0.95, 7.6, -W.len);

                const castle = new THREE.Group();
                const mainKeep = new THREE.Mesh(new THREE.BoxGeometry(6.8, 4.6, 5.2), brickM); mainKeep.position.y = 2.3;
                const upperTower = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.8, 3.8), brickM); upperTower.position.y = 6.0;
                const doorArch = new THREE.Mesh(new THREE.BoxGeometry(1.85, 2.4, 0.35), basic(0x09090b)); doorArch.position.set(0, 1.2, 2.55);
                const doorTop = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.35, 14), basic(0x09090b)); doorTop.rotation.x = Math.PI / 2; doorTop.position.set(0, 2.4, 2.55);
                castle.add(mainKeep, upperTower, doorArch, doorTop);
                for (let bx = -2.8; bx <= 2.81; bx += 1.4) {
                    const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.75, 0.9), brickM);
                    merlon.position.set(bx, 4.95, 2.2); castle.add(merlon);
                }
                for (let bx = -1.5; bx <= 1.51; bx += 1.5) {
                    const topM = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.75, 0.9), brickM);
                    topM.position.set(bx, 7.75, 1.5); castle.add(topM);
                    const win = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.95, 0.2), basic(0x09090b));
                    win.position.set(bx * 0.75, 5.9, 1.92); if (bx !== 0) castle.add(win);
                }
                castle.position.set(0, 0, -W.len - 6.8);
                this._addObj(S, poleBase); this._addObj(S, pole); this._addObj(S, finial); this._addObj(S, flag); this._addObj(S, castle);
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
            const [cx, cy, cz] = [[3.5, 0, -62], [2.5, 0, -64], [-2.5, 2.45, -60], [3, 0, -64]][idx];
            const beacon = new THREE.Group(); beacon.position.set(cx, cy, cz);
            const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.86, 0.2, 8), std(0x244358, 0.6));
            const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.48), basic(0x63e2df).clone());
            eye.position.y = 1.35; beacon.add(foot, eye); this._addObj(S, beacon);
            D.beacon = beacon; D.beaconEye = eye;
            const ringGeo = new THREE.TorusGeometry(1.22, 0.085, 8, 32), ringMat = basic(0x92f7ea);
            for (const [rx, ry, rz] of [
                [[-1, 3, -18], [2, 3.7, -43], [0, 4, -80]],
                [[2, 3, -18], [-2, 3.6, -54], [1, 4, -90]],
                [[0, 3.6, -29], [1, 4.2, -44], [2, 4.8, -84]],
                [[-1, 3, -20], [2, 3.8, -49], [0, 4.2, -84]]
            ][idx]) {
                const ring = new THREE.Mesh(ringGeo, ringMat); ring.position.set(rx, ry, rz);
                const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.24), basic(0xffca76));
                ring.add(shard); this._addObj(S, ring); D.rings.push(ring);
            }
            MG.toast(W.name, '#fde047');
        },
        _spawnBowser(S, form) {
            this._clearWorld(S);
            const D = S.data, P = BO.Player;
            D.warningRing = new THREE.Mesh(new THREE.RingGeometry(1.05, 1.22, 32), basic(0xffb05b, { side: THREE.DoubleSide }));
            D.warningRing.rotation.x = -Math.PI / 2; D.warningRing.visible = false;
            this._addObj(S, D.warningRing); D.aimPoint = V();
            P.pos.set(0, 0.2, 10); P.vel.set(0, 0, 0); P.yaw = 0; P.pitch = 0;
            if (form === 1 && !D.hasGuns) D.hasGuns = true;
            D.musicTrack = 'bowser'; D.musicStep = 0;
            if (BO.MinigameAudio) BO.MinigameAudio.start('mario:bowser');
            D.bowserForm = form;
            const formMeta = [
                null,
                { name: 'BOWSER (NORMAL)', hp: 4500, sc: 1.0, shell: 0x166534, skin: 0xfacc15, horn: 0xfef3c7, mane: 0xdc2626, rim: 0xf8fafc, seam: 0x14532d, seamGlow: 0x000000, eyeIris: 0xef4444, fireCol: 0xf97316, fireHalo: 0xfacc15, rate: 1.75 },
                { name: 'BOWSER — FINAL FORM!', hp: 7500, sc: 1.38, shell: 0x270909, skin: 0xf97316, horn: 0xfde047, mane: 0xf97316, rim: 0xfdba74, seam: 0xf97316, seamGlow: 0xea580c, eyeIris: 0xfef08a, fireCol: 0xf97316, fireHalo: 0xfef08a, rate: 1.25 },
                { name: 'OMEGA BOWSER — FINAL FINAL FORM!!', hp: 12000, sc: 1.72, shell: 0x1e0636, skin: 0xc084fc, horn: 0xfef08a, mane: 0xe879f9, rim: 0xe9d5ff, seam: 0xe879f9, seamGlow: 0xc026d3, eyeIris: 0xfef9c3, fireCol: 0xc084fc, fireHalo: 0xf0abfc, rate: 0.95 }
            ][form];
            D.formMeta = formMeta;
            const cBrick = new THREE.MeshStandardMaterial({ map: marioTex('cbrick'), roughness: 0.82 });
            const lavaMoat = new THREE.Mesh(new THREE.PlaneGeometry(96, 96), basic(0xf97316));
            lavaMoat.rotation.x = -Math.PI / 2; lavaMoat.position.set(0, -1.25, -6); this._addObj(S, lavaMoat);
            this._addBox(S, 0, -0.5, -6, 38, 1, 46, cBrick, true);
            for (const [px, pz] of [[-12, -2], [12, -2], [-12, -16], [12, -16]]) {
                this._addBox(S, px, 2.4, pz, 2.2, 4.8, 2.2, cBrick, true);
                const fl = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.1, 7), basic(0xfacc15)); fl.position.set(px, 5.3, pz); this._addObj(S, fl);
            }

            // Sculpted Articulated 3D Bowser (Hex-Plated Shell, Flared Spike Collars, Plastron Belly, Articulated Jaw/Limbs/Tail, Form Evolutions)
            const bg = new THREE.Group();
            const bodyGroup = new THREE.Group(); bg.add(bodyGroup);
            const shellMat = std(formMeta.shell, 0.36, 0.25);
            const skinMat = std(formMeta.skin, 0.56);
            const hornMat = std(formMeta.horn, 0.32);
            const rimMat = std(formMeta.rim, 0.52);
            const seamMat = std(formMeta.seam, 0.35, 0.2, { emissive: formMeta.seamGlow, emissiveIntensity: form > 1 ? 0.85 : 0 });
            const maneMat = std(formMeta.mane, 0.42, 0.1, { emissive: formMeta.mane, emissiveIntensity: form > 1 ? 0.65 : 0.32 });
            const leatherMat = std(0x18181b, 0.4, 0.52);
            const silverMat = std(0xe2e8f0, 0.22, 0.85);

            const shellCenter = V(0, 2.45, -0.42);
            const shell = new THREE.Mesh(new THREE.SphereGeometry(1.9, 18, 14), shellMat);
            shell.scale.set(1.12, 1.32, 0.96); shell.position.copy(shellCenter);
            const shellRim = new THREE.Mesh(new THREE.TorusGeometry(1.92, 0.26, 10, 24), rimMat);
            shellRim.scale.set(1.06, 1.24, 1); shellRim.position.set(0, 2.42, 0.18);
            const belly = new THREE.Mesh(new THREE.SphereGeometry(1.56, 16, 12), std(0xfef3c7, 0.58));
            belly.scale.set(1.0, 1.18, 0.85); belly.position.set(0, 2.28, 0.46);
            bodyGroup.add(shell, shellRim, belly);

            // 5 curved horizontal plastron belly plates
            for (let b = 0; b < 5; b++) {
                const rib = new THREE.Mesh(new THREE.TorusGeometry(1.38 - b * 0.08, 0.07, 6, 16, Math.PI * 0.58), std(0xd97706, 0.65));
                rib.rotation.x = Math.PI / 2; rib.rotation.z = Math.PI * 0.21;
                rib.position.set(0, 1.32 + b * 0.42, 0.68 - b * 0.03); bodyGroup.add(rib);
            }

            // Hexagonal scute tiles + 10 iconic spikes with flared base collars
            const spikeCoords = [
                [0, 3.85, -1.75], [0, 3.1, -2.18], [0, 2.25, -2.35], [0, 1.45, -2.05],
                [-1.12, 3.35, -1.65], [1.12, 3.35, -1.65],
                [-1.25, 2.38, -1.92], [1.25, 2.38, -1.92],
                [-1.02, 1.52, -1.78], [1.02, 1.52, -1.78]
            ];
            for (const [sx, sy, sz] of spikeCoords) {
                const p = V(sx, sy, sz);
                const dir = p.clone().sub(shellCenter).normalize();
                const scute = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.52, 0.14, 6), seamMat);
                scute.position.copy(p); scute.quaternion.setFromUnitVectors(V(0, 1, 0), dir); bodyGroup.add(scute);
                const collarBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, 0.22, 10), rimMat);
                collarBase.position.copy(p).addScaledVector(dir, 0.12); collarBase.quaternion.setFromUnitVectors(V(0, 1, 0), dir); bodyGroup.add(collarBase);
                const sp = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.88, 10), hornMat);
                sp.position.copy(p).addScaledVector(dir, 0.54); sp.quaternion.setFromUnitVectors(V(0, 1, 0), dir); bodyGroup.add(sp);
            }

            // Spiked Black Leather Neck Collar
            const collar = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.18, 8, 18), leatherMat);
            collar.rotation.x = Math.PI / 2; collar.position.set(0, 3.45, 0.52); bodyGroup.add(collar);
            for (let ci = 0; ci < 6; ci++) {
                const a = (ci / 6) * TAU;
                const cs = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.34, 6), silverMat);
                cs.position.set(Math.cos(a) * 1.12, 3.45, 0.52 + Math.sin(a) * 1.12);
                cs.lookAt(Math.cos(a) * 3, 3.45, 0.52 + Math.sin(a) * 3); cs.rotateX(Math.PI / 2); bodyGroup.add(cs);
            }

            // Articulated Head Group + Hinged Lower Jaw + Multi-Segment Horns + Fiery 5-Spike Mane
            const headGroup = new THREE.Group(); headGroup.position.set(0, 3.72, 0.56);
            const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.98, 1), shellMat);
            head.scale.set(1.06, 0.94, 1.08); head.position.set(0, 0.42, 0);
            const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.82, 1.25, 8), skinMat);
            snout.rotation.x = Math.PI / 2; snout.scale.set(1.22, 1, 0.62); snout.position.set(0, 0.16, 0.82);
            const mouthGlow = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), basic(formMeta.fireCol));
            mouthGlow.position.set(0, 0.04, 0.92);
            const jawGroup = new THREE.Group(); jawGroup.position.set(0, -0.02, 0.32);
            const lowerJaw = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.7, 1.05, 8), skinMat);
            lowerJaw.rotation.x = Math.PI / 2; lowerJaw.scale.set(1.18, 1, 0.48); lowerJaw.position.set(0, -0.14, 0.55);
            jawGroup.add(lowerJaw);
            headGroup.add(head, snout, mouthGlow, jawGroup);

            // Fiery 5-Spike Hair Mane
            for (let mi = 0; mi < 5; mi++) {
                const flame = new THREE.Mesh(new THREE.ConeGeometry(0.32 - mi * 0.03, 0.98 - mi * 0.08, 7), maneMat);
                flame.position.set(Math.sin(mi * 0.7) * 0.12, 1.48 - mi * 0.16, -0.05 - mi * 0.24);
                flame.rotation.x = -0.35 - mi * 0.16; headGroup.add(flame);
            }
            for (const s of [-1, 1]) {
                // Cheek jowl, nostril, sclera/iris/slit eye, V-shaped brow
                const jowl = new THREE.Mesh(new THREE.SphereGeometry(0.44, 10, 8), skinMat); jowl.position.set(s * 0.68, 0.06, 0.48); headGroup.add(jowl);
                const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), basic(0x18181b)); nostril.position.set(s * 0.34, 0.34, 1.38); headGroup.add(nostril);
                const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), basic(0xfef08a)); sclera.position.set(s * 0.44, 0.64, 0.86); headGroup.add(sclera);
                const iris = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), basic(formMeta.eyeIris)); iris.position.set(s * 0.47, 0.64, 1.02); headGroup.add(iris);
                const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.1), basic(0x050508)); pupil.position.set(s * 0.48, 0.64, 1.12); headGroup.add(pupil);
                const brow = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.2, 0.28), maneMat); brow.position.set(s * 0.46, 0.92, 0.92); brow.rotation.z = -s * 0.42; headGroup.add(brow);
                // Upper & lower fangs
                const fangU = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.32, 6), basic(0xffffff)); fangU.position.set(s * 0.4, -0.08, 1.18); fangU.rotation.x = Math.PI; headGroup.add(fangU);
                const fangL = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 6), basic(0xffffff)); fangL.position.set(s * 0.36, 0.04, 0.92); jawGroup.add(fangL);
                // Multi-segment curved bull horns
                for (let hs = 0; hs < 3; hs++) {
                    const hSeg = new THREE.Mesh(new THREE.CylinderGeometry(0.18 - hs * 0.04, 0.24 - hs * 0.04, 0.48, 8), hornMat);
                    hSeg.position.set(s * (0.72 + hs * 0.28), 1.05 + hs * 0.28, -0.08 + hs * 0.14);
                    hSeg.rotation.set(0.25 * hs, 0, -s * (0.85 - hs * 0.22)); headGroup.add(hSeg);
                }
            }
            bodyGroup.add(headGroup);

            // Articulated Arms (Shoulder, Bicep Band, Forearm, Spiked Wrist Cuff, Clawed Hand) + Legs + Spiked Tail
            const limbs = {}, limbMeshes = [];
            for (const s of [-1, 1]) {
                const armPiv = new THREE.Group(); armPiv.position.set(s * 1.65, 2.95, 0.38);
                const deltoid = new THREE.Mesh(new THREE.SphereGeometry(0.46, 10, 8), skinMat);
                const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.34, 0.95, 10), skinMat); upper.position.set(s * 0.22, -0.42, 0.12); upper.rotation.z = s * 0.38;
                const bicepBand = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.09, 6, 12), leatherMat); bicepBand.position.set(s * 0.32, -0.58, 0.15); bicepBand.rotation.x = Math.PI / 2;
                const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.92, 10), skinMat); forearm.position.set(s * 0.46, -1.02, 0.42); forearm.rotation.set(-0.55, 0, s * 0.18);
                const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.11, 6, 14), leatherMat); cuff.position.set(s * 0.5, -1.25, 0.56); cuff.rotation.x = Math.PI / 2 + 0.55;
                for (let st = 0; st < 4; st++) {
                    const a = (st / 4) * TAU;
                    const stud = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 6), silverMat);
                    stud.position.set(s * 0.5 + Math.cos(a) * 0.48, -1.25, 0.56 + Math.sin(a) * 0.48);
                    stud.lookAt(s * 0.5 + Math.cos(a) * 2, -1.25, 0.56 + Math.sin(a) * 2); stud.rotateX(Math.PI / 2); armPiv.add(stud);
                }
                const hand = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), skinMat); hand.position.set(s * 0.54, -1.55, 0.72);
                for (let cl = 0; cl < 4; cl++) {
                    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.34, 6), hornMat);
                    claw.position.set(s * 0.54 + (cl - 1.5) * 0.16, -1.78, 0.92); claw.rotation.x = Math.PI * 0.75; armPiv.add(claw);
                }
                armPiv.add(deltoid, upper, bicepBand, forearm, cuff, hand); bodyGroup.add(armPiv);
                limbs[s < 0 ? 'armL' : 'armR'] = armPiv;

                const legPiv = new THREE.Group(); legPiv.position.set(s * 0.92, 1.38, 0.12);
                const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.42, 0.85, 10), skinMat); thigh.position.y = -0.35;
                const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.75, 10), skinMat); shin.position.y = -0.92;
                const foot = new THREE.Mesh(new THREE.SphereGeometry(0.56, 10, 8), skinMat); foot.scale.set(1.05, 0.58, 1.32); foot.position.set(0, -1.22, 0.22);
                for (let tc = -1; tc <= 1; tc++) {
                    const toeClaw = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.36, 6), hornMat);
                    toeClaw.position.set(tc * 0.24, -1.28, 0.92); toeClaw.rotation.x = Math.PI / 2; legPiv.add(toeClaw);
                }
                legPiv.add(thigh, shin, foot); bodyGroup.add(legPiv);
                limbs[s < 0 ? 'legL' : 'legR'] = legPiv;
                limbMeshes.push(deltoid, upper, forearm, hand, thigh, shin, foot);
            }

            const tailGroup = new THREE.Group(); tailGroup.position.set(0, 1.18, -1.18);
            for (let t = 0; t < 4; t++) {
                const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.36 - t * 0.08, 0.48 - t * 0.08, 0.65, 8), skinMat);
                seg.rotation.x = Math.PI * 0.42; seg.position.set(0, -0.05 * t, -0.35 - t * 0.48); tailGroup.add(seg);
                if (t < 3) {
                    const tsp = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.36, 6), hornMat);
                    tsp.position.set(0, 0.34 - t * 0.06, -0.45 - t * 0.48); tsp.rotation.x = -0.35; tailGroup.add(tsp);
                }
            }
            bodyGroup.add(tailGroup);

            let omegaRing = null;
            if (form === 3) {
                omegaRing = new THREE.Group(); omegaRing.position.set(0, 2.05, -0.15);
                const halo = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.08, 8, 24), maneMat); halo.rotation.x = Math.PI / 2; omegaRing.add(halo);
                for (let os = 0; os < 6; os++) {
                    const a = (os / 6) * TAU;
                    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), basic(0xfef08a));
                    shard.position.set(Math.cos(a) * 1.15, 0, Math.sin(a) * 1.15); omegaRing.add(shard);
                }
                headGroup.add(omegaRing);
            }

            bg.scale.setScalar(formMeta.sc);
            const tg = S.addTarget({ mesh: bg, hitMeshes: [shell, belly, head, snout, lowerJaw, ...limbMeshes], pos: V(0, 0, 0), life: 0, appear: 'scale', inT: 0.25, death: 'none', bonus: true });
            // Move target root cleanly to Bowser boss spawn
            tg.root.position.set(0, 0, -16);
            tg.hp = formMeta.hp; tg.maxHp = formMeta.hp; tg.fireT = 1.2; tg.walkT = 0; tg.flinchT = 0;
            tg.moveMode = 'strafe'; tg.moveT = 2.8; tg.moveDir = 1;
            tg.specialT = form === 1 ? 5.5 : form === 2 ? 4.2 : 3.4;
            tg.act = null; tg.actLabel = form === 1 ? 'CASTLE OVERLORD' : form === 2 ? 'MOLTEN AWAKENING' : 'COSMIC ASCENSION';
            tg.jumpY = 0; tg.jumpVy = 0; tg.spinYaw = 0; tg.hoverY = 0; tg.dashHits = 0;
            Object.assign(tg, { bodyGroup, headGroup, jawGroup, mouthGlow, tailGroup, omegaRing, ...limbs });
            D.bowser = tg;
            MG.toast(formMeta.name, '#facc15'); SFX.rumble(0.7);
        },
        _bowserMouthPos(bw) {
            const p = V();
            if (bw && bw.mouthGlow) bw.mouthGlow.getWorldPosition(p);
            else if (bw) p.copy(bw.root.position).add(V(0, 3.6, 0));
            return p;
        },
        _spawnBowserFireball(S, origin, vel, opts = {}) {
            const D = S.data, col = opts.col || D.formMeta.fireCol, halo = opts.halo || D.formMeta.fireHalo;
            const sc = opts.scale || 1.0;
            const fm = new THREE.Group();
            fm.add(new THREE.Mesh(new THREE.SphereGeometry(0.38 * sc, 10, 8), basic(halo)));
            fm.add(new THREE.Mesh(new THREE.SphereGeometry(0.56 * sc, 10, 8), basic(col, { transparent: true, opacity: 0.48 })));
            fm.position.copy(origin); S.add(fm);
            D.bFire.push({
                mesh: fm, vel: vel.clone(), life: opts.life || 3.8, rad: opts.rad || (1.05 * sc),
                dmg: opts.dmg || (14 + D.bowserForm * 4), homing: !!opts.homing,
                homingSpd: opts.homingSpd || 0, col
            });
        },
        _spawnBowserHammer(S, origin, target, opts = {}) {
            const D = S.data, col = opts.col || (D.bowserForm === 3 ? 0xe879f9 : D.bowserForm === 2 ? 0xf97316 : 0x94a3b8);
            const hg = new THREE.Group();
            const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.35, 8), std(0x78350f, 0.65));
            const head = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.9, 10), std(col, 0.28, 0.72, { emissive: D.bowserForm > 1 ? col : 0x000000, emissiveIntensity: D.bowserForm > 1 ? 0.55 : 0 }));
            head.rotation.z = Math.PI / 2; head.position.y = 0.55;
            hg.add(handle, head); hg.position.copy(origin); S.add(hg);
            const flightT = opts.flightT || (0.85 + Math.random() * 0.35);
            const dx = target.x - origin.x, dy = (target.y + 0.6) - origin.y, dz = target.z - origin.z;
            const g = 24;
            const vel = V(dx / flightT, dy / flightT + 0.5 * g * flightT, dz / flightT);
            D.bHammers.push({ mesh: hg, vel, g, life: flightT + 0.9, dmg: opts.dmg || (15 + D.bowserForm * 3), blastRad: opts.blastRad || 2.1, col });
        },
        _spawnBowserHazard(S, x, z, delay, rad, dmg, col, kind = 'fissure') {
            const cx = BO.Math.clamp(x, -17.5, 17.5), cz = BO.Math.clamp(z, -27, 15.5);
            const ring = new THREE.Mesh(new THREE.RingGeometry(0.35, rad, 24), basic(col, { transparent: true, opacity: 0.72, side: THREE.DoubleSide }));
            ring.rotation.x = -Math.PI / 2; ring.position.set(cx, 0.08, cz); S.add(ring);
            let meteor = null;
            if (kind === 'meteor') {
                meteor = new THREE.Group();
                meteor.add(new THREE.Mesh(new THREE.DodecahedronGeometry(rad * 0.42, 0), basic(col)));
                meteor.add(new THREE.Mesh(new THREE.SphereGeometry(rad * 0.58, 10, 8), basic(col, { transparent: true, opacity: 0.35 })));
                meteor.position.set(cx, 26, cz); S.add(meteor);
            }
            S.data.bHazards.push({ ring, meteor, pos: V(cx, 0.2, cz), t: delay, total: delay, rad, dmg, col, kind });
        },
        _spawnBowserWave(S, origin, maxRad, speed, dmg, col) {
            const mesh = new THREE.Mesh(new THREE.TorusGeometry(1, 0.14, 8, 32), basic(col, { transparent: true, opacity: 0.9 }));
            mesh.rotation.x = Math.PI / 2;
            mesh.position.set(origin.x, 0.28, origin.z); S.add(mesh);
            S.data.bWaves.push({ mesh, origin: V(origin.x, 0.28, origin.z), r: 1.1, prevR: 1.1, maxRad, speed, dmg, col, hit: false });
        },
        _spawnBowserBeam(S, origin, yaw, pitchAng, sweepRad, dur, col, dmg) {
            const group = new THREE.Group(); group.position.copy(origin);
            const teleGeo = new THREE.CylinderGeometry(0.08, 0.08, 38, 8);
            const teleMesh = new THREE.Mesh(teleGeo, basic(0xfef08a, { transparent: true, opacity: 0.78 }));
            teleMesh.rotation.x = Math.PI / 2; teleMesh.position.z = 19; group.add(teleMesh);
            const beamGroup = new THREE.Group(); beamGroup.visible = false;
            const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.6, 38, 12), basic(0xffffff));
            inner.rotation.x = Math.PI / 2; inner.position.z = 19;
            const outer = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.98, 38, 12), basic(col, { transparent: true, opacity: 0.58 }));
            outer.rotation.x = Math.PI / 2; outer.position.z = 19;
            beamGroup.add(inner, outer); group.add(beamGroup);
            const dir = V(Math.sin(yaw - sweepRad * 0.5) * Math.cos(pitchAng), Math.sin(pitchAng), Math.cos(yaw - sweepRad * 0.5) * Math.cos(pitchAng)).normalize();
            group.quaternion.setFromUnitVectors(V(0, 0, 1), dir);
            S.add(group);
            S.data.bBeams.push({ group, teleMesh, beamGroup, origin: origin.clone(), baseYaw: yaw, pitchAng, sweepRad, elapsed: 0, teleDur: 0.95, dur, col, dmg, hitCd: 0 });
        },
        _triggerBowserAttack(S, bw) {
            const D = S.data, P = BO.Player, form = D.bowserForm;
            const mOrig = this._bowserMouthPos(bw);
            const aim = D.aimPoint.clone(); aim.y += 1.0;
            const col = D.formMeta.fireCol;
            const fireToward = (tx, ty, tz, spd, opts) => {
                const dir = V(tx - mOrig.x, ty - mOrig.y, tz - mOrig.z).normalize();
                this._spawnBowserFireball(S, mOrig, dir.multiplyScalar(spd), opts);
            };
            const pool = form === 1 ? ['spread3', 'hammer3', 'burst4']
                : form === 2 ? ['molten_volley', 'hammer6', 'flame_sweep', 'magma_fissure']
                : ['cosmic_fan', 'hammer8', 'halo_barrage', 'twin_fissure'];
            const pick = pool[Math.floor(Math.random() * pool.length)];

            if (pick === 'spread3') {
                bw.actLabel = 'FIREBALL SPREAD';
                for (let c = -1; c <= 1; c++) fireToward(aim.x + c * 2.8, aim.y, aim.z, 19);
                SFX.launch();
            } else if (pick === 'hammer3' || pick === 'hammer6' || pick === 'hammer8') {
                const n = pick === 'hammer3' ? 3 : pick === 'hammer6' ? 6 : 8;
                bw.actLabel = form === 1 ? 'IRON HAMMER TOSS' : form === 2 ? 'MAGMA HAMMER BARRAGE' : 'VOID HAMMER STORM';
                for (let i = 0; i < n; i++) {
                    const spread = (i - (n - 1) * 0.5) * (form === 1 ? 2.4 : 2.1);
                    const tgt = P.pos.clone().add(V(spread, 0, (Math.random() - 0.5) * 4));
                    this._spawnBowserHammer(S, bw.root.position.clone().add(V((i % 2 ? 1.4 : -1.4), 3.8 * D.formMeta.sc, 0.5)), tgt, { flightT: 0.78 + i * 0.08 });
                }
                SFX.launch();
            } else if (pick === 'burst4') {
                bw.actLabel = 'FLAME BURST';
                for (let i = 0; i < 4; i++) {
                    fireToward(aim.x + (i - 1.5) * 1.4, aim.y + 0.15 * i, aim.z, 18 + i * 2.2);
                }
                SFX.launch();
            } else if (pick === 'molten_volley') {
                bw.actLabel = 'MOLTEN VOLLEY';
                for (let c = -2; c <= 2; c++) fireToward(aim.x + c * 2.5, aim.y, aim.z, 22);
                for (const s of [-1, 1]) fireToward(aim.x + s * 6, aim.y + 1.5, aim.z, 15, { homing: true, homingSpd: 14, col: 0xfacc15, scale: 1.2, dmg: 20 });
                SFX.launch();
            } else if (pick === 'flame_sweep') {
                bw.actLabel = 'FLAMETHROWER SWEEP';
                for (let c = -3; c <= 3; c++) fireToward(aim.x + c * 3.1, aim.y, aim.z, 20 + Math.abs(c) * 1.1);
                SFX.launch();
            } else if (pick === 'magma_fissure') {
                bw.actLabel = 'MAGMA FISSURE';
                const dir = P.pos.clone().sub(bw.root.position); dir.y = 0; dir.normalize();
                for (let k = 1; k <= 5; k++) {
                    const fp = bw.root.position.clone().addScaledVector(dir, k * 4.6);
                    this._spawnBowserHazard(S, fp.x, fp.z, 0.75 + k * 0.18, 2.7, 20, 0xf97316, 'fissure');
                }
                SFX.rumble(0.45);
            } else if (pick === 'cosmic_fan') {
                bw.actLabel = 'COSMIC FAN';
                for (let c = -3; c <= 3; c++) fireToward(aim.x + c * 2.8, aim.y, aim.z, 24);
                for (const s of [-1, 1]) fireToward(aim.x + s * 7, aim.y + 2.0, aim.z, 16, { homing: true, homingSpd: 17, col: 0xfef08a, scale: 1.25, dmg: 22 });
                SFX.launch();
            } else if (pick === 'halo_barrage') {
                bw.actLabel = 'HALO STAR BARRAGE';
                const ringOrigin = bw.omegaRing ? bw.omegaRing.getWorldPosition(V()) : mOrig.clone().add(V(0, 2.2, 0));
                for (let k = 0; k < 10; k++) {
                    const a = (k / 10) * TAU;
                    const start = ringOrigin.clone().add(V(Math.cos(a) * 1.9, 0, Math.sin(a) * 1.9));
                    const d = P.pos.clone().add(V((k - 4.5) * 1.3, 1.0, 0)).sub(start).normalize();
                    this._spawnBowserFireball(S, start, d.multiplyScalar(22), { col: 0xe879f9, halo: 0xfef08a, dmg: 18, scale: 0.95 });
                }
                SFX.star(1);
            } else if (pick === 'twin_fissure') {
                bw.actLabel = 'TWIN VOID FISSURES';
                const baseAng = Math.atan2(P.pos.x - bw.root.position.x, P.pos.z - bw.root.position.z);
                for (const s of [-0.26, 0.26]) {
                    const ang = baseAng + s;
                    for (let k = 1; k <= 5; k++) {
                        this._spawnBowserHazard(S, bw.root.position.x + Math.sin(ang) * k * 4.8, bw.root.position.z + Math.cos(ang) * k * 4.8, 0.72 + k * 0.16, 2.8, 22, 0xc084fc, 'fissure');
                    }
                }
                SFX.rumble(0.5);
            }
        },
        _triggerBowserSpecial(S, bw) {
            const D = S.data, P = BO.Player, form = D.bowserForm;
            const pool = form === 1 ? ['koopa_slam', 'fire_nova']
                : form === 2 ? ['meteor_cataclysm', 'shell_tornado', 'triple_stomp', 'molten_slam']
                : ['void_laser', 'cosmic_storm', 'singularity_spiral', 'phantom_blitz', 'omega_slam'];
            const type = pool[Math.floor(Math.random() * pool.length)];
            const labels = {
                koopa_slam: 'KOOPA GROUND SLAM', fire_nova: 'FIRE BREATH NOVA',
                meteor_cataclysm: 'METEOR CATACLYSM', shell_tornado: 'INFERNO SHELL TORNADO',
                triple_stomp: 'TRIPLE LAVA STOMP', molten_slam: 'MOLTEN VAULT SLAM',
                void_laser: 'OMEGA VOID LASER', cosmic_storm: 'COSMIC METEOR STORM',
                singularity_spiral: 'SINGULARITY SPIRAL', phantom_blitz: 'PHANTOM SHELL BLITZ',
                omega_slam: 'OMEGA CATACLYSM SLAM'
            };
            bw.actLabel = labels[type];
            bw.act = { type, t: 0, phase: 0, count: 0, target: P.pos.clone(), start: bw.root.position.clone() };
            MG.toast(`BOWSER SPECIAL: ${bw.actLabel}!`, form === 3 ? '#e879f9' : form === 2 ? '#f97316' : '#facc15');
            SFX.rumble(0.65);

            if (type === 'koopa_slam' || type === 'molten_slam' || type === 'omega_slam') {
                if (type === 'omega_slam') {
                    BO.FX.spawnExplosion(bw.root.position.clone().add(V(0, 2.5, 0)), 4, 0xc084fc);
                    bw.root.position.set(BO.Math.clamp(P.pos.x + (Math.random() - 0.5) * 6, -14, 14), 0, BO.Math.clamp(P.pos.z - 8, -24, 10));
                }
                bw.jumpVy = type === 'koopa_slam' ? 16 : 21; bw.jumpY = 0.01;
                bw.act.hang = type !== 'koopa_slam';
            } else if (type === 'cosmic_storm') {
                BO.FX.spawnExplosion(bw.root.position.clone().add(V(0, 2.5, 0)), 4, 0xc084fc);
                bw.root.position.set(0, 0, -14); bw.hoverY = 4.2;
            } else if (type === 'void_laser' || type === 'singularity_spiral') {
                bw.root.position.set(0, 0, -16); bw.hoverY = type === 'void_laser' ? 5.2 : 4.8;
            } else if (type === 'shell_tornado' || type === 'phantom_blitz') {
                bw.dashHits = 0;
            }
        },
        _updateBowser(S, dt) {
            const D = S.data, P = BO.Player, bw = D.bowser;
            const form = D.bowserForm, sc = D.formMeta.sc, col = D.formMeta.fireCol;
            bw.walkT += dt;
            if (bw.flinchT > 0) bw.flinchT = Math.max(0, bw.flinchT - dt);

            const step = Math.sin(bw.walkT * (4.2 + form * 0.45));
            let spinThisFrame = 0;

            if (bw.act) {
                const a = bw.act; a.t += dt;
                if (a.type === 'koopa_slam' || a.type === 'molten_slam' || a.type === 'omega_slam') {
                    // Vault up, track player slightly, hang briefly (Forms 2/3), slam down with shockwaves
                    if (a.phase === 0) {
                        bw.jumpVy -= 34 * dt; bw.jumpY += bw.jumpVy * dt;
                        bw.root.position.x = BO.Math.lerp(bw.root.position.x, BO.Math.clamp(P.pos.x, -15, 15), dt * 2.2);
                        bw.root.position.z = BO.Math.lerp(bw.root.position.z, BO.Math.clamp(P.pos.z - 2.5, -24, 11), dt * 2.2);
                        if (a.hang && bw.jumpVy < 0 && a.t < 1.15) { bw.jumpVy = 0; }
                        if (bw.jumpY <= 0) {
                            bw.jumpY = 0; bw.jumpVy = 0; a.phase = 1; a.t = 0;
                            BO.FX.spawnExplosion(bw.root.position.clone().add(V(0, 0.8, 0)), 6 * sc, col); SFX.rumble(0.85);
                            const waveN = a.type === 'koopa_slam' ? 1 : a.type === 'molten_slam' ? 2 : 3;
                            for (let wi = 0; wi < waveN; wi++) {
                                this._spawnBowserWave(S, bw.root.position, 28, 12 + wi * 4.5, 18 + form * 4, col);
                            }
                            if (a.type !== 'koopa_slam') {
                                const fn = a.type === 'molten_slam' ? 4 : 6;
                                for (let fi = 0; fi < fn; fi++) {
                                    const ang = (fi / fn) * TAU;
                                    this._spawnBowserHazard(S, bw.root.position.x + Math.cos(ang) * 7.5, bw.root.position.z + Math.sin(ang) * 7.5, 0.9, 3.0, 22, col, 'fissure');
                                }
                            }
                        }
                    } else if (a.t > 0.55) { bw.act = null; bw.actLabel = D.formMeta.name; }
                } else if (a.type === 'fire_nova') {
                    bw.headGroup.rotation.x = -0.32; bw.jawGroup.rotation.x = 0.72;
                    if (a.phase === 0 && a.t >= 0.7) {
                        a.phase = 1; const mOrig = this._bowserMouthPos(bw);
                        for (let k = 0; k < 12; k++) {
                            const ang = (k / 12) * TAU;
                            this._spawnBowserFireball(S, mOrig, V(Math.sin(ang) * 16, -0.8, Math.cos(ang) * 16), { col, dmg: 16 });
                        }
                        for (let c = -1; c <= 1; c++) {
                            const d = P.pos.clone().add(V(c * 2.5, 1.0, 0)).sub(mOrig).normalize();
                            this._spawnBowserFireball(S, mOrig, d.multiplyScalar(21), { col: 0xfacc15, dmg: 18, scale: 1.15 });
                        }
                        SFX.launch();
                    } else if (a.t > 1.35) { bw.act = null; }
                } else if (a.type === 'meteor_cataclysm' || a.type === 'cosmic_storm') {
                    const total = a.type === 'meteor_cataclysm' ? 8 : 14;
                    bw.jawGroup.rotation.x = 0.65;
                    while (a.count < total && a.t >= 0.35 + a.count * 0.18) {
                        const nearPlayer = a.count % 2 === 0;
                        const mx = nearPlayer ? P.pos.x + (Math.random() - 0.5) * 9 : (Math.random() - 0.5) * 30;
                        const mz = nearPlayer ? P.pos.z + (Math.random() - 0.5) * 9 : -22 + Math.random() * 34;
                        this._spawnBowserHazard(S, mx, mz, 1.15, a.type === 'cosmic_storm' ? 3.4 : 3.0, 22 + form * 3, col, 'meteor');
                        a.count++;
                    }
                    if (a.type === 'cosmic_storm' && a.phase === 0 && a.t >= 1.2) {
                        a.phase = 1;
                        this._spawnBowserWave(S, bw.root.position, 32, 14, 22, col);
                        this._spawnBowserWave(S, bw.root.position, 32, 20, 22, 0xfef08a);
                    }
                    if (a.t > 2.8) { bw.hoverY = 0; bw.act = null; }
                } else if (a.type === 'triple_stomp') {
                    const stompStep = Math.floor(a.t / 0.72);
                    if (stompStep > a.count && a.count < 3) {
                        a.count = stompStep; bw.jumpY = 0.6; bw.jumpVy = -8;
                        SFX.rumble(0.75); BO.FX.spawnParticles(bw.root.position.clone().add(V(0, 0.3, 0)), 14, col, 4, 8, 0.5, 1.1);
                        this._spawnBowserWave(S, bw.root.position, 30, 14 + a.count * 2.5, 20, col);
                    }
                    bw.jumpY = Math.max(0, bw.jumpY + bw.jumpVy * dt);
                    if (a.t > 2.5) { bw.jumpY = 0; bw.jumpVy = 0; bw.act = null; }
                } else if (a.type === 'shell_tornado' || a.type === 'phantom_blitz') {
                    const maxDashes = a.type === 'shell_tornado' ? 2 : 3;
                    spinThisFrame = 14 + form * 3;
                    if (a.phase === 0) {
                        a.target.copy(P.pos); a.phase = 1; a.subT = 0; a.dropT = 0;
                    } else if (a.phase === 1) {
                        a.subT += dt; a.dropT += dt;
                        if (a.subT < 0.38) {
                            a.target.copy(P.pos);
                        } else {
                            const toTgt = V(a.target.x - bw.root.position.x, 0, a.target.z - bw.root.position.z);
                            const dist = toTgt.length();
                            if (dist > 0.8 && a.subT < 1.35) {
                                toTgt.normalize();
                                bw.root.position.addScaledVector(toTgt, (a.type === 'shell_tornado' ? 22 : 28) * dt);
                                if (a.dropT >= 0.28) {
                                    a.dropT = 0;
                                    if (a.type === 'shell_tornado') {
                                        const ra = Math.random() * TAU;
                                        this._spawnBowserFireball(S, bw.root.position.clone().add(V(0, 2.2, 0)), V(Math.cos(ra) * 13, 0, Math.sin(ra) * 13), { col, dmg: 15 });
                                    } else {
                                        this._spawnBowserHazard(S, bw.root.position.x, bw.root.position.z, 0.95, 2.8, 22, col, 'mine');
                                    }
                                }
                            } else {
                                a.count++;
                                if (a.count >= maxDashes) { bw.act = null; bw.spinYaw = 0; }
                                else a.phase = 0;
                            }
                            if (bw.dashHits < maxDashes && bw.root.position.distanceTo(P.pos) < 2.2 * sc) {
                                bw.dashHits++;
                                P.takeDamage(20 + form * 4, bw.root.position, true);
                                if (!P.alive) MG.finish('DEFEATED BY BOWSER', { color: '#f87171' });
                            }
                        }
                    }
                } else if (a.type === 'void_laser') {
                    if (a.phase === 0) {
                        a.phase = 1;
                        const mOrig = this._bowserMouthPos(bw);
                        const d = P.pos.clone().add(V(0, 1.0, 0)).sub(mOrig);
                        const yaw = Math.atan2(d.x, d.z), pitchAng = Math.asin(BO.Math.clamp(d.y / Math.max(0.1, d.length()), -0.8, 0.5));
                        this._spawnBowserBeam(S, mOrig, yaw, pitchAng, 1.83, 1.45, 0xe879f9, 20);
                    }
                    bw.jawGroup.rotation.x = 0.72; bw.mouthGlow.scale.setScalar(1.8);
                    if (a.t > 2.55) { bw.hoverY = 0; bw.act = null; }
                } else if (a.type === 'singularity_spiral') {
                    spinThisFrame = 9;
                    if (a.count < 3 && a.t >= 0.45 + a.count * 0.65) {
                        a.count++; const mOrig = bw.root.position.clone().add(V(0, 3.6 * sc, 0));
                        const offset = a.count * 0.35;
                        for (let k = 0; k < 12; k++) {
                            const ang = (k / 12) * TAU + offset;
                            this._spawnBowserFireball(S, mOrig, V(Math.sin(ang) * 16, -2.1, Math.cos(ang) * 16), { col: 0xc084fc, halo: 0xfef08a, dmg: 18, scale: 1.05 });
                        }
                        SFX.star(2);
                    }
                    if (a.t > 2.6) { bw.hoverY = 0; bw.spinYaw = 0; bw.act = null; }
                }
            } else {
                // Autonomous Multi-Mode Movement AI
                bw.moveT -= dt;
                if (bw.moveT <= 0) {
                    const modes = form === 1 ? ['strafe', 'stalk', 'leap_reposition']
                        : form === 2 ? ['strafe', 'stalk', 'leap_reposition', 'flank_sprint', 'shell_dash']
                        : ['strafe', 'stalk', 'leap_reposition', 'void_blink', 'cosmic_hover'];
                    bw.moveMode = modes[Math.floor(Math.random() * modes.length)];
                    bw.moveDir = Math.random() < 0.5 ? -1 : 1;
                    bw.moveT = bw.moveMode === 'strafe' ? 2.8 : bw.moveMode === 'stalk' ? 2.4 : 1.7;
                    if (bw.moveMode === 'leap_reposition' && bw.jumpY <= 0.01) { bw.jumpVy = 12.5; bw.jumpY = 0.01; SFX.boing(); }
                    if (bw.moveMode === 'void_blink') {
                        BO.FX.spawnExplosion(bw.root.position.clone().add(V(0, 2.5, 0)), 3.2, 0xc084fc);
                        const bx = BO.Math.clamp(P.pos.x + (Math.random() < 0.5 ? -10 : 10), -14.5, 14.5);
                        const bz = BO.Math.clamp(P.pos.z - 12 - Math.random() * 7, -23.5, 8);
                        bw.root.position.set(bx, 0, bz);
                        BO.FX.spawnExplosion(bw.root.position.clone().add(V(0, 2.5, 0)), 3.2, 0xfef08a);
                        SFX.star(2);
                    }
                }
                if (bw.moveMode === 'strafe') {
                    bw.root.position.x = BO.Math.lerp(bw.root.position.x, Math.sin(bw.walkT * (1.2 + form * 0.25)) * 11 * bw.moveDir, dt * 2.2);
                    bw.root.position.z = BO.Math.lerp(bw.root.position.z, -14 + Math.cos(bw.walkT * 0.9) * 5, dt * 2.0);
                } else if (bw.moveMode === 'stalk') {
                    const d = V(P.pos.x - bw.root.position.x, 0, P.pos.z - bw.root.position.z);
                    if (d.length() > 4.2) { d.normalize(); bw.root.position.addScaledVector(d, (5.2 + form * 1.4) * dt); }
                } else if (bw.moveMode === 'flank_sprint') {
                    const toP = V(P.pos.x - bw.root.position.x, 0, P.pos.z - bw.root.position.z).normalize();
                    const perp = V(-toP.z * bw.moveDir, 0, toP.x * bw.moveDir);
                    bw.root.position.addScaledVector(perp.addScaledVector(toP, 0.35).normalize(), 11.5 * dt);
                } else if (bw.moveMode === 'shell_dash') {
                    spinThisFrame = 12;
                    const d = V(P.pos.x - bw.root.position.x, 0, P.pos.z - bw.root.position.z);
                    if (d.length() > 3.0) bw.root.position.addScaledVector(d.normalize(), 15 * dt);
                } else if (bw.moveMode === 'cosmic_hover') {
                    bw.hoverY = BO.Math.lerp(bw.hoverY, 2.8 + Math.sin(bw.walkT * 3) * 0.6, dt * 4);
                    bw.root.position.x = BO.Math.lerp(bw.root.position.x, Math.cos(bw.walkT * 1.6) * 12, dt * 2.6);
                }
                if (bw.moveMode !== 'cosmic_hover') bw.hoverY = BO.Math.lerp(bw.hoverY, 0, dt * 5);
                if (bw.jumpY > 0 || bw.jumpVy > 0) {
                    bw.jumpVy -= 30 * dt; bw.jumpY += bw.jumpVy * dt;
                    bw.root.position.x += bw.moveDir * 6.5 * dt;
                    if (bw.jumpY <= 0) { bw.jumpY = 0; bw.jumpVy = 0; SFX.rumble(0.35); }
                }

                // Trigger Specials on cooldown, regular attacks in between
                bw.specialT -= dt;
                if (bw.specialT <= 0) {
                    bw.specialT = form === 1 ? 6.2 : form === 2 ? 4.8 : 3.9;
                    bw.fireT = Math.max(bw.fireT, 1.2);
                    this._triggerBowserSpecial(S, bw);
                } else {
                    const lead = 0.55;
                    if (bw.fireT > 0.48) D.aimPoint.copy(P.pos);
                    bw.fireT -= dt;
                    const charging = bw.fireT <= lead;
                    D.warningRing.visible = bw.fireT <= 0.48;
                    if (D.warningRing.visible) {
                        D.warningRing.position.set(D.aimPoint.x, 0.045, D.aimPoint.z);
                        D.warningRing.scale.setScalar(0.7 + Math.max(0, bw.fireT) * 2.5);
                    }
                    bw.headGroup.rotation.x = BO.Math.lerp(bw.headGroup.rotation.x, (charging ? -0.22 : 0) - bw.flinchT * 1.1, Math.min(1, dt * 10));
                    bw.jawGroup.rotation.x = BO.Math.lerp(bw.jawGroup.rotation.x, charging ? 0.68 : 0.06, Math.min(1, dt * 12));
                    bw.mouthGlow.scale.setScalar(charging ? 1.55 : 0.65);
                    bw.armL.rotation.x = charging ? -0.55 : -step * 0.35;
                    bw.armR.rotation.x = charging ? -0.55 : step * 0.35;
                    if (charging && Math.random() < dt * 24) {
                        BO.FX.spawnParticles(this._bowserMouthPos(bw), 1, col, 1.5, -1.0, 0.35, 0.7);
                    }
                    if (bw.fireT <= 0) {
                        bw.fireT = D.formMeta.rate;
                        this._triggerBowserAttack(S, bw);
                    }
                }
            }

            // Clamp Bowser onto the stone castle platform + apply vertical jump/hover + orientation
            bw.root.position.x = BO.Math.clamp(bw.root.position.x, -15.5, 15.5);
            bw.root.position.z = BO.Math.clamp(bw.root.position.z, -24, 12);
            bw.root.position.y = bw.jumpY + bw.hoverY;
            const faceYaw = Math.atan2(P.pos.x - bw.root.position.x, P.pos.z - bw.root.position.z);
            if (spinThisFrame > 0) {
                bw.spinYaw += spinThisFrame * dt;
                bw.root.rotation.y = faceYaw + bw.spinYaw;
            } else {
                bw.spinYaw = 0;
                bw.root.rotation.y = faceYaw;
            }

            // Procedural Limb & Form Aura Animations
            bw.legL.rotation.x = bw.jumpY > 0.2 ? 0.35 : step * 0.42;
            bw.legR.rotation.x = bw.jumpY > 0.2 ? -0.35 : -step * 0.42;
            bw.bodyGroup.position.y = bw.jumpY > 0.2 ? 0 : Math.abs(step) * 0.14;
            bw.bodyGroup.rotation.z = step * 0.045;
            bw.bodyGroup.rotation.x = -bw.flinchT * 0.9;
            bw.tailGroup.rotation.y = Math.sin(bw.walkT * 2.6) * 0.25;
            if (bw.omegaRing) { bw.omegaRing.rotation.y += dt * 2.2; bw.omegaRing.position.y = 2.05 + Math.sin(bw.walkT * 3) * 0.14; }
            if (form >= 2 && Math.random() < dt * (form === 2 ? 16 : 24)) {
                BO.FX.spawnParticles(bw.root.position.clone().add(V((Math.random() - 0.5) * 3.4, 2.6, (Math.random() - 0.5) * 2.4)), 1, col, 1.4, -1.8, 0.55, 0.8);
            }

            const pTarget = P.pos.clone().add(V(0, 1.1, 0));
            // Update Fireballs (normal + homing)
            for (let i = D.bFire.length - 1; i >= 0; i--) {
                const bf = D.bFire[i]; bf.life -= dt;
                if (bf.homing && P.alive) {
                    const desired = pTarget.clone().sub(bf.mesh.position).normalize().multiplyScalar(bf.homingSpd);
                    bf.vel.lerp(desired, Math.min(1, dt * 2.4));
                }
                bf.mesh.position.addScaledVector(bf.vel, dt);
                bf.mesh.rotation.y += dt * 7; bf.mesh.scale.setScalar(0.92 + Math.sin(bw.walkT * 18 + i) * 0.12);
                if (bf.mesh.position.distanceTo(pTarget) < bf.rad) {
                    P.takeDamage(bf.dmg, bf.mesh.position, true);
                    S.scene.remove(bf.mesh); D.bFire.splice(i, 1);
                    if (!P.alive) { MG.finish('DEFEATED BY BOWSER', { color: '#f87171' }); return; }
                    continue;
                }
                if (bf.life <= 0 || bf.mesh.position.y < -2) { S.scene.remove(bf.mesh); D.bFire.splice(i, 1); }
            }
            // Update Ballistic Spinning Hammers
            for (let i = D.bHammers.length - 1; i >= 0; i--) {
                const hm = D.bHammers[i]; hm.life -= dt;
                hm.vel.y -= hm.g * dt;
                hm.mesh.position.addScaledVector(hm.vel, dt);
                hm.mesh.rotation.x += dt * 13; hm.mesh.rotation.z += dt * 5;
                if (hm.mesh.position.distanceTo(pTarget) < 1.15) {
                    P.takeDamage(hm.dmg, hm.mesh.position, true);
                    BO.FX.spawnExplosion(hm.mesh.position.clone(), 2.2, hm.col);
                    S.scene.remove(hm.mesh); D.bHammers.splice(i, 1);
                    if (!P.alive) { MG.finish('DEFEATED BY BOWSER', { color: '#f87171' }); return; }
                    continue;
                }
                if (hm.mesh.position.y <= 0.15 || hm.life <= 0) {
                    BO.FX.spawnExplosion(V(hm.mesh.position.x, 0.25, hm.mesh.position.z), 1.8, hm.col);
                    if (Math.hypot(P.pos.x - hm.mesh.position.x, P.pos.z - hm.mesh.position.z) < hm.blastRad && P.pos.y < 1.4) {
                        P.takeDamage(Math.round(hm.dmg * 0.75), hm.mesh.position, true);
                        if (!P.alive) { S.scene.remove(hm.mesh); D.bHammers.splice(i, 1); MG.finish('DEFEATED BY BOWSER', { color: '#f87171' }); return; }
                    }
                    S.scene.remove(hm.mesh); D.bHammers.splice(i, 1);
                }
            }
            // Update Telegraphed Ground Fissures, Mines & Meteors
            for (let i = D.bHazards.length - 1; i >= 0; i--) {
                const hz = D.bHazards[i]; hz.t -= dt;
                const prog = 1 - Math.max(0, hz.t) / Math.max(0.01, hz.total);
                if (hz.meteor) hz.meteor.position.y = BO.Math.lerp(26, 0.3, prog * prog);
                if (hz.t <= 0) {
                    BO.FX.spawnExplosion(hz.pos.clone(), hz.rad, hz.col); SFX.rumble(0.45);
                    if (Math.hypot(P.pos.x - hz.pos.x, P.pos.z - hz.pos.z) <= hz.rad && P.pos.y < (hz.kind === 'meteor' ? 3.2 : 1.6)) {
                        P.takeDamage(hz.dmg, hz.pos, true);
                        if (!P.alive) {
                            S.scene.remove(hz.ring); if (hz.meteor) S.scene.remove(hz.meteor); D.bHazards.splice(i, 1);
                            MG.finish('DEFEATED BY BOWSER', { color: '#f87171' }); return;
                        }
                    }
                    S.scene.remove(hz.ring); if (hz.meteor) S.scene.remove(hz.meteor); D.bHazards.splice(i, 1);
                }
            }
            // Update Expanding Jump-Dodge Shockwave Rings
            for (let i = D.bWaves.length - 1; i >= 0; i--) {
                const wv = D.bWaves[i]; wv.prevR = wv.r; wv.r += wv.speed * dt;
                wv.mesh.scale.set(wv.r, wv.r, 1);
                wv.mesh.material.opacity = Math.max(0, 0.9 * (1 - wv.r / wv.maxRad));
                const d = Math.hypot(P.pos.x - wv.origin.x, P.pos.z - wv.origin.z);
                if (!wv.hit && d >= wv.prevR - 0.8 && d <= wv.r + 0.8 && P.pos.y < 1.15) {
                    wv.hit = true; P.takeDamage(wv.dmg, wv.origin, true);
                    if (!P.alive) { S.scene.remove(wv.mesh); D.bWaves.splice(i, 1); MG.finish('DEFEATED BY BOWSER', { color: '#f87171' }); return; }
                }
                if (wv.r >= wv.maxRad) { S.scene.remove(wv.mesh); D.bWaves.splice(i, 1); }
            }
            // Update Sweeping Omega Void Laser Beams
            for (let i = D.bBeams.length - 1; i >= 0; i--) {
                const bm = D.bBeams[i]; bm.elapsed += dt;
                if (bm.hitCd > 0) bm.hitCd -= dt;
                if (bm.elapsed >= bm.teleDur) {
                    bm.teleMesh.visible = false; bm.beamGroup.visible = true;
                    const u = Math.min(1, (bm.elapsed - bm.teleDur) / bm.dur);
                    const curYaw = bm.baseYaw + (u - 0.5) * bm.sweepRad;
                    const dir = V(Math.sin(curYaw) * Math.cos(bm.pitchAng), Math.sin(bm.pitchAng), Math.cos(curYaw) * Math.cos(bm.pitchAng)).normalize();
                    bm.group.quaternion.setFromUnitVectors(V(0, 0, 1), dir);
                    const toP = pTarget.clone().sub(bm.origin);
                    const proj = BO.Math.clamp(toP.dot(dir), 0, 38);
                    const dist = bm.origin.clone().addScaledVector(dir, proj).distanceTo(pTarget);
                    if (dist < 1.25 && bm.hitCd <= 0) {
                        bm.hitCd = 0.28; P.takeDamage(bm.dmg, bm.origin, true);
                        if (!P.alive) { S.scene.remove(bm.group); D.bBeams.splice(i, 1); MG.finish('DEFEATED BY BOWSER', { color: '#f87171' }); return; }
                    }
                }
                if (bm.elapsed >= bm.teleDur + bm.dur) { S.scene.remove(bm.group); D.bBeams.splice(i, 1); }
            }
        },
        onKey(S, code) {
            const D = S.data, P = BO.Player;
            if (MG.state !== 'running') return false;
            if (D.foundry) return BO.PrismFoundry.key(S,code);
            if (code === 'KeyV' && !D.bowserForm) {
                if (!P.onGround && D.boostReady) {
                    D.boostReady = false; P.vel.y = Math.max(P.vel.y, 8.2);
                    BO.FX.spawnParticles(P.pos, 12, 0x8cf8e7, 3, 2, 0.45, 0.8); SFX.boing();
                }
                return true;
            }
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
            // Authentic 3D Super Mario Power-Up Pop! (Mushroom / Fire Flower / Super Star / Gold Coin)
            const popMesh = new THREE.Group();
            if (q.gift === 'mushroom') {
                const cap = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.58), basic(0xef4444));
                cap.position.y = 0.24; popMesh.add(cap);
                for (const [sx, sy, sz] of [[0, 0.55, 0.22], [0.28, 0.35, 0.22], [-0.28, 0.35, 0.22]]) {
                    const sp = new THREE.Mesh(new THREE.SphereGeometry(0.11, 7, 6), basic(0xffffff)); sp.position.set(sx, sy, sz); popMesh.add(sp);
                }
                const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.36, 10), basic(0xfef3c7)); stem.position.y = 0.04; popMesh.add(stem);
                for (const ex of [-0.09, 0.09]) { const ey = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.05), basic(0x111111)); ey.position.set(ex, 0.08, 0.24); popMesh.add(ey); }
            } else if (q.gift === 'fire') {
                const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.42, 8), basic(0x22c55e)); stem.position.y = -0.02; popMesh.add(stem);
                const outer = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 10), basic(0xef4444)); outer.scale.set(1.2, 0.85, 0.45); outer.position.y = 0.32;
                const mid = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), basic(0xf97316)); mid.scale.set(1.2, 0.85, 0.5); mid.position.y = 0.32;
                const core = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), basic(0xfef08a)); core.scale.set(1.2, 0.85, 0.55); core.position.y = 0.32;
                popMesh.add(outer, mid, core);
            } else if (q.gift === 'star') {
                const st = new THREE.Mesh(new THREE.OctahedronGeometry(0.42), basic(0xfacc15)); st.scale.set(1.1, 1.1, 0.45); st.position.y = 0.25; popMesh.add(st);
                for (const ex of [-0.1, 0.1]) { const ey = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.06), basic(0x111111)); ey.position.set(ex, 0.28, 0.2); popMesh.add(ey); }
            } else {
                const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.09, 14), basic(0xfacc15)); coin.rotation.x = Math.PI / 2; coin.position.y = 0.25; popMesh.add(coin);
            }
            popMesh.position.set(q.x, q.y + 0.9, q.z); this._addObj(S, popMesh);
            let pt = 0; S.animate((dt) => { pt += dt; popMesh.position.y += dt * 1.4; popMesh.rotation.y += dt * 6; if (pt > 0.65) { S.scene.remove(popMesh); return false; } });
            if (q.gift === 'fire') { D.power = 'fire'; mPowerSfx(); MG.toast('🔥 FIRE FLOWER! LMB SHOOTS FIREBALLS!', '#f97316'); }
            else if (q.gift === 'star') {
                D.starT = 12.0; mPowerSfx();
                if (BO.MinigameAudio) BO.MinigameAudio.start('mario:starman');
                MG.toast('★ SUPER STARMAN INVINCIBILITY (12s)! RUN THROUGH ENEMIES!', '#fde047');
            }
            else if (q.gift === 'mushroom') { D.power = 'big'; P.maxHp = 160; P.hp = 160; mPowerSfx(); MG.toast('🍄 SUPER MUSHROOM! +60 HP', '#ef4444'); }
            else { D.coins++; S.award(250, V(q.x, q.y + 1, q.z), 'COIN!'); mCoinSfx(); }
        },
        update(S, dt, lib, state) {
            const D = S.data, P = BO.Player;
            if (state !== 'running') return;
            if (D.foundry) { BO.PrismFoundry.tick(S,dt,state); return; }
            if (!D.bowserForm && !D.inBonus) {
                if (P.onGround) D.boostReady = true;
                D.beaconEye.rotation.y += dt * 2.1;
                D.beaconEye.position.y = 1.35 + Math.sin(S.t * 3.2) * 0.14;
                if (!D.beaconLit && P.pos.distanceTo(D.beacon.position) < 2.3) {
                    D.checkpoint.copy(D.beacon.position); D.checkpoint.y += 0.35;
                    D.beaconLit = true; D.beaconsLit++; D.beaconEye.material.color.setHex(0xffc87d);
                    SFX.star(1); MG.toast('Return beacon active', '#91f7ea');
                }
                for (const ring of D.rings) {
                    if (!ring.visible) continue;
                    ring.children[0].rotation.y += dt * 3;
                    if (Math.abs(P.pos.z - ring.position.z) < 0.85 && Math.hypot(P.pos.x - ring.position.x, P.pos.y + 1 - ring.position.y) < 1.25) {
                        ring.visible = false; D.ringsTaken++; D.boostReady = true;
                        S.award(500, ring.position, 'PRISM • BOOST REFILLED'); SFX.star(2);
                    }
                }
            }

            // Live 4-Channel Mario Chiptune & Bowser Metal Sequencer
            if (D.starT > 0) {
                D.starT = Math.max(0, D.starT - dt);
                if (Math.hypot(P.vel.x, P.vel.z) > 0.5) { P.pos.x += P.vel.x * 0.42 * dt; P.pos.z += P.vel.z * 0.42 * dt; }
                if (D.starT === 0 && BO.MinigameAudio) BO.MinigameAudio.start('mario:' + (D.musicTrack || '1-1'));
            }
            if (BO.MinigameAudio) BO.MinigameAudio.tick(dt);

            // Kickable Koopa Shells bowling through enemies!
            for (let i = (D.shells || []).length - 1; i >= 0; i--) {
                const sh = D.shells[i]; sh.life -= dt;
                sh.mesh.position.z += sh.vz * dt; sh.mesh.rotation.y += dt * 18;
                for (const g of D.goombas || []) {
                    if (g.alive && g.root.position.distanceTo(sh.mesh.position) < 1.35) {
                        sh.streak++; g.kill({ pt: g.root.position.clone() }); S.kills++; S.bumpCombo();
                        S.award(200 * Math.pow(2, Math.min(3, sh.streak - 1)), g.root.position.clone(), 'SHELL STRIKE x' + sh.streak + '!', '#4ade80');
                        SFX.ding(1.1 + sh.streak * 0.12);
                    }
                }
                if (sh.life <= 0) { S.scene.remove(sh.mesh); D.shells.splice(i, 1); }
            }

            // Castle Thwomps slamming down
            for (const th of D.thwomps || []) {
                if (th.state === 'idle' && Math.abs(P.pos.z - th.z) < 4.2) { th.state = 'drop'; SFX.rumble(0.45); }
                else if (th.state === 'drop') {
                    th.y = Math.max(1.5, th.y - 22 * dt);
                    if (th.y <= 1.55) {
                        th.state = 'wait'; th.wait = 1.0; SFX.thunk();
                        if (Math.abs(P.pos.z - th.z) < 2.1 && Math.abs(P.pos.x) < 2.2 && D.starT <= 0) {
                            P.takeDamage(32, V(0, 1.5, th.z), true);
                            if (!P.alive) MG.finish('CRUSHED BY THWOMP!', { color: '#f87171' });
                        }
                    }
                } else if (th.state === 'wait') { th.wait -= dt; if (th.wait <= 0) th.state = 'rise'; }
                else if (th.state === 'rise') { th.y = Math.min(th.baseY, th.y + 3.8 * dt); if (th.y >= th.baseY) th.state = 'idle'; }
                th.mesh.position.y = th.y;
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
                if (!q.used && Math.abs(P.pos.x - q.x) < 1.25 && Math.abs(P.pos.z - q.z) < 1.25 && P.pos.y + 2.05 >= q.y - 0.72 && P.pos.y < q.y + 0.3 && (P.vel.y > 0.1)) {
                    this._triggerQBlock(S, q);
                }
            }

            // Animate moving platforms, piranha plants, coins
            for (const mv of D.movers || []) {
                const axis = mv.axis, bounds = mv.collider;
                const riding = P.vel.y <= 0.1 && Math.abs(P.pos.y - bounds.maxY) < 0.16 &&
                    P.pos.x >= bounds.minX && P.pos.x <= bounds.maxX && P.pos.z >= bounds.minZ && P.pos.z <= bounds.maxZ;
                const next = mv.base[axis] + Math.sin(S.t * mv.spd) * mv.amp;
                const delta = next - mv.mesh.position[axis];
                mv.mesh.position[axis] = next;
                if (axis === 'x') { bounds.minX += delta; bounds.maxX += delta; }
                else { bounds.minY += delta; bounds.maxY += delta; }
                if (riding) P.pos[axis] += delta;
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
                this._updateBowser(S, dt);
                return;
            }
            for (const g of D.goombas || []) {
                if (!g.alive) continue;
                g.root.position.x += g.vx * dt;
                if (Math.abs(g.root.position.x) > 5.5) g.vx *= -1;
                const d = Math.hypot(P.pos.x - g.root.position.x, P.pos.z - g.root.position.z);
                if (d < 1.35 && D.starT > 0) {
                    g.kill({ pt: g.root.position.clone() }); S.kills++; S.bumpCombo();
                    S.award(400, g.root.position.clone(), 'STARMAN KO!', '#fde047'); SFX.star(1);
                } else if (d < 1.3 && P.pos.y > 0.55 && P.vel.y < 0) {
                    const gPos = g.root.position.clone();
                    g.kill({ pt: gPos }); P.vel.y = 8.8; S.kills++; S.bumpCombo();
                    if (g.isKoopa) {
                        this._spawnKickShell(S, gPos.x, gPos.z, -1);
                        S.award(350, gPos, 'KOOPA SHELL KICK!', '#4ade80');
                    } else S.award(250, gPos, 'STOMPED!');
                    SFX.boing();
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
                const gap = D.pits.some(pt => Math.abs(P.pos.z - pt.z) < pt.half);
                const belowSkyDeck = D.stageIdx === 2 && P.pos.z < -16 && P.pos.z > -115 && P.pos.y < 0.1;
                if ((gap && P.pos.y < 0.1) || belowSkyDeck || P.pos.y < -3 || Math.abs(P.pos.x) > 12) {
                    D.recoveries++; P.pos.copy(D.checkpoint); P.vel.set(0, 0, 0); D.boostReady = true;
                    P.takeDamage(28, P.pos.clone(), true);
                    MG.toast('Back at the return beacon', '#91f7ea');
                    if (!P.alive) MG.finish('OUT OF ENERGY', { color: '#f87171' });
                    return;
                }
            }
            if (P.pos.z <= D.goalZ + 1.2 && !D.inBonus) {
                const heightBonus = D.stageIdx < 3 ? Math.round(BO.Math.clamp(P.pos.y / 5.5, 0.2, 1.0) * 2000) : 0;
                S.award(1200 * (D.stageIdx + 1) + heightBonus, P.pos.clone().add(V(0, 2, 0)), heightBonus >= 1600 ? 'TOP OF THE FLAGPOLE!' : 'STAGE CLEAR!', '#fde047');
                if (D.stageIdx < 3 && BO.MinigameAudio) BO.MinigameAudio.marioFlagpole(); else SFX.fanfare();
                if (D.stageIdx < 3) this._loadWorld(S, D.stageIdx + 1);
                else this._spawnBowser(S, 1);
            }
        },
        onHit(S, ent, info) {
            const D = S.data;
            if (ent === D.bowser) {
                D.bowser.hp -= info.dmg; D.bowser.flinchT = 0.14; S.hits++; SFX.thunk();
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
        result(S) {
            if (S.data.foundry) return BO.PrismFoundry.result(S);
            const d = S.data, stars = S.def.stars.filter(n => S.score >= n).length;
            return { score: S.score, stars, xp: 120 + Math.round(S.score * 0.06) + stars * 150,
                title: d.bowserForm === 3 && !d.bowser ? 'COURSE CLEARED' : 'COURSE REPORT',
                stats: [['PRISMS', d.ringsTaken + '/12'], ['RETURN BEACONS', d.beaconsLit + '/4'],
                    ['RECOVERIES', d.recoveries], ['COINS', d.coins]] };
        },
        hud(S) {
            const D = S.data;
            if (D.foundry) return BO.PrismFoundry.hud(S);
            if (D.bowserForm > 0 && D.bowser) {
                const pct = Math.max(0, Math.round(D.bowser.hp / D.bowser.maxHp * 100));
                const grad = D.bowserForm === 1 ? 'linear-gradient(90deg,#dc2626,#facc15)'
                    : D.bowserForm === 2 ? 'linear-gradient(90deg,#991b1b,#f97316,#fde047)'
                    : 'linear-gradient(90deg,#7e22ce,#ec4899,#fef08a)';
                const actBadge = D.bowser.actLabel ? `<em style="font-style:normal;opacity:0.9;margin-left:8px;color:#fde047">[${D.bowser.actLabel}]</em>` : '';
                return `<div class="fun-panel"><div class="fun-bar-wrap"><div class="fun-bar-lbl"><span>FORM ${D.bowserForm}/3 • ${D.formMeta.name}${actBadge}</span><b>${Math.round(D.bowser.hp)} / ${D.bowser.maxHp}</b></div><div class="fun-bar"><i style="width:${pct}%;background:${grad}"></i></div></div></div>`;
            }
            return `<div class="fun-panel"><div class="mgx-chip"><b>${D.world ? D.world.name : ''}</b></div><div class="mgx-chip">PRISMS <b>${D.ringsTaken}</b></div><div class="mgx-chip">LIFT <b>${D.boostReady ? 'READY [V]' : 'SPENT'}</b></div><div class="mgx-chip">COINS <b>${D.coins}</b></div><div class="mgx-chip">POWER <b>${D.hasGuns ? 'FAMAS + DEAGLE' : D.power.toUpperCase()}</b></div><div class="mgx-chip">GOAL <b>${Math.max(0, Math.round(BO.Player.pos.z - (D.goalZ || -120)))} m</b></div>${D.nearPipe ? '<div class="mgx-chip mgx-hot">PRESS <b>[E / C]</b> ENTER PIPE</div>' : ''}</div>`;
        }
    });
})(window);
