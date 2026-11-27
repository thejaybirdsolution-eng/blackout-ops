/* ============================================================================
   BLACKOUT OPS — MINIGAMES: FUN & SPECIALS FLAGSHIP BATCH 1B (Modes 10–12)
     10. Neon Bumper-Car Demolition Derby — 10 sculpted bumper cars under an
         electrified carnival spark-grid canopy, breakable hazard rails, Nitro
         Ram [SHIFT/SPACE], EMP Shock-Harpoon [LMB], and Magnetic Repulse [Q].
     11. Hell's Combat Kitchen — Five-star tactical bistro with 4 sizzling
         flattop burners, multi-layer burger assembly, Michelin VIP ticket
         queue, Chef-Rat & Hangry Zombie raiders, and overhead Extinguishers!
     12. Sky-Pirate Zeppelin Siege — Sail at 120m aboard the timber-and-brass
         Sky-Galleon HMS Sovereign, fire 4 Brass Broadside Deck Cannons [E] at
         Corsair Dirigible Gunships & the Iron Kraken Dreadnought, repel
         Cutlass Pirate Boarders [LMB], and patch hull fires!
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const L = BO.MinigameLib;
    const A = BO.MinigameArt;
    const K = BO.MGCourseKit;
    const F = BO.MGFigures;
    const { B, SFX, std, basic, TAU, clamp01, esc } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const lerp = (a, b, t) => a + (b - a) * t;
    const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));

    function tone(f0, f1, dur = 0.14, type = 'sine', vol = 0.09, delay = 0) {
        if (!BO.Sound || !BO.Sound.ctx) return;
        const ctx = BO.Sound.ctx, t0 = ctx.currentTime + delay;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(Math.max(30, f0), t0);
        if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + dur);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g); g.connect(BO.Sound.sfxGain || ctx.destination);
        o.start(t0); o.stop(t0 + dur + 0.02);
    }

    function labelSprite(text, color, wScale = 2.6) {
        const tex = L.canvasTex('funE-lbl:' + text + ':' + color, 256, 64, (g, w, h) => {
            g.clearRect(0, 0, w, h);
            g.font = '900 30px Bahnschrift, Impact, sans-serif';
            g.textAlign = 'center'; g.textBaseline = 'middle';
            g.lineWidth = 7; g.strokeStyle = 'rgba(0,0,0,0.82)';
            g.strokeText(text, w / 2, h / 2);
            g.fillStyle = color; g.fillText(text, w / 2, h / 2);
        });
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
        s.scale.set(wScale, 0.62, 1);
        return s;
    }

    /* =====================================================================
       10. NEON BUMPER-CAR DEMOLITION DERBY
       Carnival Spark-Grid Pavilion + 10 Multi-Part Fiberglass Bumper Cars!
    ===================================================================== */
    const DERBY_NAMES = ['YOU', 'Volt-Viper', 'Bumper-Baron', 'Sparky', 'Fender-Bender', 'Neon-Queen', 'T-Bone', 'Jolt-Jack', 'Ricochet', 'Clutch'];
    const DERBY_COLS = [0xfacc15, 0xef4444, 0x06b6d4, 0x22c55e, 0xa855f7, 0xf97316, 0xec4899, 0x3b82f6, 0x84cc16, 0x14b8a6];

    function derbyFloorTex() {
        return L.canvasTex('derby-neon-floor-v1', 512, 512, (g, w, h) => {
            g.fillStyle = '#090d1a'; g.fillRect(0, 0, w, h);
            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                    const even = (x + y) % 2 === 0;
                    g.fillStyle = even ? '#111827' : '#1e1b4b';
                    g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60);
                    g.strokeStyle = even ? 'rgba(6, 182, 212, 0.42)' : 'rgba(236, 72, 153, 0.42)';
                    g.lineWidth = 2;
                    g.strokeRect(x * 64 + 4, y * 64 + 4, 56, 56);
                }
            }
            // Center thunderbolt medallion
            g.strokeStyle = '#facc15'; g.lineWidth = 8;
            g.beginPath(); g.arc(w / 2, h / 2, 195, 0, TAU); g.stroke();
            g.strokeStyle = '#ec4899'; g.lineWidth = 4;
            g.beginPath(); g.arc(w / 2, h / 2, 110, 0, TAU); g.stroke();
        });
    }

    function carStripeTex(colHex) {
        const hex = '#' + colHex.toString(16).padStart(6, '0');
        return L.canvasTex('derby-shell:' + hex, 128, 128, (g, w, h) => {
            g.fillStyle = hex; g.fillRect(0, 0, w, h);
            g.fillStyle = '#ffffff';
            g.fillRect(w * 0.40, 0, w * 0.08, h);
            g.fillRect(w * 0.52, 0, w * 0.08, h);
            g.fillStyle = 'rgba(0,0,0,0.22)';
            g.fillRect(0, h - 18, w, 18);
        });
    }

    function buildBumperCar(idx, isPlayer) {
        const col = DERBY_COLS[idx % DERBY_COLS.length];
        const root = new THREE.Group();
        const tiltG = new THREE.Group();
        root.add(tiltG);

        const rubberMat = std(0x18181b, 0.85, 0.12);
        const chrome = std(0xe2e8f0, 0.18, 0.92);
        const shellMat = new THREE.MeshStandardMaterial({
            map: carStripeTex(col), roughness: 0.22, metalness: 0.35,
            emissive: new THREE.Color(col), emissiveIntensity: 0.14
        });

        // Heavy wrap-around rubber bumper tire + neon trim ring
        const tire = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.28, 12, 28), rubberMat);
        tire.rotation.x = Math.PI / 2; tire.scale.set(0.92, 1.18, 1); tire.position.y = 0.32;
        const neonRing = new THREE.Mesh(new THREE.TorusGeometry(1.24, 0.055, 8, 28), basic(col));
        neonRing.rotation.x = Math.PI / 2; neonRing.scale.set(0.92, 1.18, 1); neonRing.position.y = 0.50;
        const baseDeck = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.18, 0.26, 22), rubberMat);
        baseDeck.scale.set(0.90, 1, 1.16); baseDeck.position.y = 0.28;
        tiltG.add(tire, neonRing, baseDeck);

        // Contoured fiberglass hood & tail shell
        const hood = new THREE.Mesh(new THREE.SphereGeometry(0.96, 20, 14, 0, TAU, 0, Math.PI * 0.52), shellMat);
        hood.scale.set(0.92, 0.62, 1.24); hood.position.set(0, 0.38, -0.10);
        const cockpitCut = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.52, 0.30, 16), std(0x0f172a, 0.7));
        cockpitCut.position.set(0, 0.64, 0.16);
        const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.52, 0.18), std(0x7c2d12, 0.7));
        seatBack.position.set(0, 0.84, 0.58); seatBack.rotation.x = -0.18;
        tiltG.add(hood, cockpitCut, seatBack);

        // Chrome dual headlights + grille + tail brake lights
        const grille = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.18, 0.08), chrome);
        grille.position.set(0, 0.52, -1.24);
        tiltG.add(grille);
        for (const s of [-1, 1]) {
            const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.12, 12), chrome);
            bezel.rotation.x = Math.PI / 2; bezel.position.set(s * 0.52, 0.62, -1.12);
            const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), basic(0xfef08a));
            bulb.position.set(s * 0.52, 0.62, -1.18);
            const tail = new THREE.Mesh(new THREE.SphereGeometry(0.10, 8, 6), basic(0xef4444));
            tail.position.set(s * 0.52, 0.60, 1.18);
            tiltG.add(bezel, bulb, tail);
        }

        // Steering column + wheel
        const colShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.52, 8), chrome);
        colShaft.position.set(0, 0.82, -0.24); colShaft.rotation.x = 0.58;
        const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.032, 8, 18), std(0x111827, 0.4));
        wheel.position.set(0, 1.02, -0.10); wheel.rotation.x = 0.58;
        tiltG.add(colShaft, wheel);

        // Conductive copper rear pole reaching up to ceiling spark mesh!
        const springBase = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.12, 0.24, 10), chrome);
        springBase.position.set(0, 0.78, 1.05);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.038, 6.2, 8), std(0xd97706, 0.32, 0.86));
        pole.position.set(0, 3.85, 1.25); pole.rotation.x = -0.06;
        const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), basic(0x38bdf8));
        shoe.position.set(0, 6.92, 1.44);
        tiltG.add(springBase, pole, shoe);

        let driver = null;
        if (!isPlayer) {
            driver = F.human({
                shirt: col, pants: 0x1e293b, hat: idx % 2 ? 'helmet' : 'cap', hatColor: col,
                glasses: idx % 3 === 0 ? 'shades' : null, eyes: 'angry', mouth: 'grin', scale: 0.88
            });
            driver.root.position.set(0, 0.05, 0.22);
            driver.root.rotation.y = Math.PI; // F.human faces +Z, flip to face -Z (forward)
            driver.parts.armL.rotation.x = -1.05; driver.parts.armR.rotation.x = -1.05;
            tiltG.add(driver.root);

            const tag = labelSprite(DERBY_NAMES[idx], '#' + col.toString(16).padStart(6, '0'), 2.5);
            tag.position.set(0, 2.35, 0);
            root.add(tag);
        }

        root.traverse((m) => { if (m.isMesh) m.castShadow = true; });
        return { root, tiltG, wheel, shoe, driver, neonRing };
    }

    MG.register({
        id: 'fun_bumper_derby', cat: 'fun', order: 10,
        name: 'Neon Bumper-Car Derby', icon: '⚡', accent: '#facc15', badge: 'FLAGSHIP DERBY',
        tagline: '10 electrified carnival bumper cars, ceiling spark-grid, breakable rails & EMP harpoons!',
        desc: 'Strap into an overcharged carnival bumper car beneath a crackling copper spark-grid ceiling! Drive with WASD + Mouse, smash through the breakable hazard rails to open fatal pit gaps, trigger [SHIFT / SPACE] Nitro Ram Boost, fire your [LMB] EMP Shock-Harpoon to reel and spin rivals, or detonate a [Q] Magnetic Repulse Ring to blast cars off the platform!',
        guide: {
            objective: 'Knock rival bumper cars through broken perimeter rails into the electrified abyss! Last car rolling—or highest KO score when the 120s buzzer sounds—wins Platinum.',
            tips: [
                'Ramming deals knockback proportional to your speed: hit [SHIFT] or [SPACE] Nitro Ram right before T-boning a rival near an open pit gap!',
                'Intact yellow-and-black hazard rails absorb 2 heavy impacts before shattering—aim rivals into red OPEN GAP zones for instant KOs!',
                'Left-click fires your EMP Shock-Harpoon (2.5s CD) to jolt and spin a rival car, while [Q] unleashes a 360° Magnetic Repulse wave (9s CD).'
            ]
        },
        heroLabel: 'FUN & SPECIALS • DEMOLITION DERBY', duration: 120,
        stars: [2200, 4200, 6800, 9600],
        weaponLabel: 'EMP HARPOON & NITRO BUMPER', weaponNote: 'WASD Steer • LMB EMP Harpoon • SHIFT/SPACE Nitro Ram • Q Magnetic Repulse',
        standardWeapon: 'm1911', lockWeapon: true, blockFire: true, hideViewmodel: true, infiniteMag: true, forgivingMisses: true, customMusic: true,
        keys: [['WASD', 'Drive & Reverse'], ['MOUSE', 'Steer Car'], ['SHIFT / SPACE', 'Nitro Ram (4s)'], ['LMB', 'EMP Harpoon (2.5s)'], ['Q', 'Mag Repulse (9s)']],
        map: {
            atmosphere: { skyTop: 0x090418, skyBottom: 0x2e1065, fogColor: 0x170936, fogDensity: 0.008, sunColor: 0xfde68a, sunIntensity: 1.4, sunPos: [20, 45, 20], hemiSky: 0xc084fc, hemiGround: 0x1e1b4b, hemiIntensity: 0.9 },
            boxes: [B(0, -400, 0, 4, 1, 4, 'concrete')],
            spawn: { x: 0, y: 0, z: 0, yaw: 0 }
        },
        countdown: 3,
        build(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.start('derby');
            const D = S.data;
            const ARENA_R = 19.5;
            Object.assign(D, {
                arenaR: ARENA_R, cars: [], rails: [], pickups: [], sparks: [],
                kos: 0, aliveCount: 10, pickupTimer: 4.5, suddenDeath: false
            });

            // Main octagonal/circular neon floor deck + pulsing neon ring + abyss glow ring below
            const deckMat = new THREE.MeshStandardMaterial({ map: derbyFloorTex(), roughness: 0.30, metalness: 0.25 });
            const deck = new THREE.Mesh(new THREE.CylinderGeometry(ARENA_R, ARENA_R * 0.92, 1.8, 48), [std(0x312e81, 0.5, 0.6), deckMat, std(0x1e1b4b, 0.7)]);
            deck.position.y = -0.9; deck.receiveShadow = true; S.add(deck);
            const pulseRing = new THREE.Mesh(new THREE.RingGeometry(ARENA_R - 0.85, ARENA_R - 0.15, 48), basic(0x38bdf8, { side: THREE.DoubleSide }));
            pulseRing.rotation.x = -Math.PI / 2; pulseRing.position.y = 0.04; S.add(pulseRing);
            D.pulseRing = pulseRing;

            // 4 Stadium Spectator Bleachers outside the Volt-Dome with cheering crowd silhouettes!
            const standM = std(0x1e1b4b, 0.7), crowdCols = [0xfacc15, 0xec4899, 0x38bdf8, 0x4ade80, 0xf97316];
            for (let b = 0; b < 4; b++) {
                const a = (b / 4) * TAU + Math.PI / 4;
                const sg = new THREE.Group();
                sg.position.set(Math.cos(a) * (ARENA_R + 7.2), -0.5, Math.sin(a) * (ARENA_R + 7.2));
                sg.rotation.y = -a + Math.PI / 2;
                for (let row = 0; row < 3; row++) {
                    const tier = new THREE.Mesh(new THREE.BoxGeometry(15, 1.1, 1.5), standM);
                    tier.position.set(0, 0.6 + row * 1.1, -row * 1.4); sg.add(tier);
                    for (let c = -5; c <= 5; c += 2) {
                        const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.85, 7), std(crowdCols[Math.abs(c + row + b) % crowdCols.length], 0.7));
                        fan.position.set(c * 1.2, 1.55 + row * 1.1, -row * 1.4); sg.add(fan);
                    }
                }
                S.add(sg);
            }

            const abyss = new THREE.Mesh(new THREE.RingGeometry(ARENA_R * 0.85, 58, 48), basic(0x0284c7));
            abyss.rotation.x = -Math.PI / 2; abyss.position.y = -11.5; S.add(abyss);

            // Carnival Pavilion Columns + Electrified Ceiling Copper Spark-Mesh + Striped Big-Top Canopy
            const canopyGroup = new THREE.Group();
            const wireMat = std(0xd97706, 0.35, 0.85);
            for (let g = -18; g <= 18; g += 4.5) {
                const w1 = new THREE.Mesh(new THREE.BoxGeometry(38, 0.05, 0.05), wireMat); w1.position.set(0, 7.05, g);
                const w2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 38), wireMat); w2.position.set(g, 7.05, 0);
                canopyGroup.add(w1, w2);
            }
            const roofPie = L.canvasTex('derby-roof-pie', 512, 512, (g, w, h) => {
                const cx = w / 2, cy = h / 2;
                for (let i = 0; i < 24; i++) {
                    g.fillStyle = i % 2 ? '#be185d' : '#facc15';
                    g.beginPath(); g.moveTo(cx, cy);
                    g.arc(cx, cy, w * 0.72, i / 24 * TAU, (i + 1) / 24 * TAU);
                    g.closePath(); g.fill();
                }
            });
            const roofCone = new THREE.Mesh(new THREE.ConeGeometry(ARENA_R + 4.5, 7.5, 32, 1, true), new THREE.MeshStandardMaterial({ map: roofPie, roughness: 0.75, side: THREE.DoubleSide }));
            roofCone.position.y = 11.0; canopyGroup.add(roofCone);

            for (let i = 0; i < 8; i++) {
                const a = (i + 0.5) / 8 * TAU;
                const px = Math.cos(a) * (ARENA_R + 2.4), pz = Math.sin(a) * (ARENA_R + 2.4);
                const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.46, 9.5, 14), std(0xfacc15, 0.35, 0.65));
                pillar.position.set(px, 3.8, pz); canopyGroup.add(pillar);
                const marquee = A.bulbs(Array.from({ length: 8 }, (_, k) => V(px, 0.8 + k * 0.85, pz)), [0xec4899, 0x38bdf8, 0xfde047], 0.11);
                canopyGroup.add(marquee);
                A.animateBulbs(S, marquee, 6, 'chase');
            }
            const sign = A.sign('⚡ VOLT-DOME BUMPER DERBY ⚡', 10.5, 1.45, { bg: '#1e1b4b', color: '#fde047', borderColor: '#ec4899', size: 0.44, glow: '#ec4899' });
            sign.position.set(0, 8.6, -(ARENA_R + 2.2)); canopyGroup.add(sign);
            S.add(canopyGroup);

            const warmGlow = new THREE.PointLight(0xfde047, 1.25, 48, 1.5); warmGlow.position.set(0, 6.4, 0); S.add(warmGlow);

            // 16 Perimeter Segments: 12 Breakable Hazard Rails (2 HP) + 4 Open Pit Drop-Zones!
            const hazardTex = L.canvasTex('derby-hazard', 128, 32, (g, w, h) => {
                g.fillStyle = '#facc15'; g.fillRect(0, 0, w, h);
                g.fillStyle = '#111827';
                for (let x = -32; x < w + 32; x += 24) {
                    g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 12, 0); g.lineTo(x - 4, h); g.lineTo(x - 16, h); g.closePath(); g.fill();
                }
            });
            const railMat = new THREE.MeshStandardMaterial({ map: hazardTex, roughness: 0.4, metalness: 0.4 });
            for (let i = 0; i < 16; i++) {
                const a0 = (i / 16) * TAU, aMid = ((i + 0.5) / 16) * TAU;
                const openGap = (i % 4 === 0); // 4 danger gaps from the start!
                const rx = Math.cos(aMid) * (ARENA_R - 0.35), rz = Math.sin(aMid) * (ARENA_R - 0.35);
                if (openGap) {
                    const warnStrip = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.08, 0.75), basic(0xef4444));
                    warnStrip.position.set(rx, 0.04, rz); warnStrip.rotation.y = -aMid + Math.PI / 2;
                    S.add(warnStrip);
                    D.rails.push({ a0, a1: ((i + 1) / 16) * TAU, hp: 0, mesh: null });
                } else {
                    const rg = new THREE.Group();
                    rg.position.set(rx, 0, rz); rg.rotation.y = -aMid + Math.PI / 2;
                    const bar = new THREE.Mesh(new THREE.BoxGeometry(6.9, 0.65, 0.38), railMat.clone());
                    bar.position.y = 0.55;
                    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 1.0, 10), std(0x94a3b8, 0.3, 0.8)); p1.position.set(-3.1, 0.5, 0);
                    const p2 = p1.clone(); p2.position.x = 3.1;
                    rg.add(bar, p1, p2); S.add(rg);
                    D.rails.push({ a0, a1: ((i + 1) / 16) * TAU, hp: 2, mesh: rg, bar });
                }
            }

            // Spawn 10 Sculpted Bumper Cars in a starting ring
            const rnd = L.mulberry32(808);
            for (let i = 0; i < 10; i++) {
                const a = (i / 10) * TAU + Math.PI / 2;
                const pos = V(Math.cos(a) * 11.5, 0, Math.sin(a) * 11.5);
                const yaw = Math.atan2(pos.x, pos.z); // face center (-Z forward)
                const vis = buildBumperCar(i, i === 0);
                vis.root.position.copy(pos); vis.root.rotation.y = yaw;
                S.add(vis.root);
                D.cars.push({
                    i, isPlayer: i === 0, name: DERBY_NAMES[i], col: DERBY_COLS[i],
                    vis, pos, vel: V(0, 0, 0), yaw, wy: 0,
                    alive: true, falling: false, damage: 0, // higher damage % = flies farther like Smash/Derby!
                    nitroCd: 0, empCd: 0, repulseCd: 0, stunT: 0, overchargeT: 0,
                    lastHitBy: -1, lastHitT: -10, aiTarget: 0, aiRetarget: rnd() * 1.5
                });
            }

            BO.Player.yaw = D.cars[0].yaw;
            BO.Player.pitch = -0.10;
            BO.Player.rideState = { kind: 'minigame', pos: V(D.cars[0].pos.x, 0, D.cars[0].pos.z), roll: 0, pitch: 0, eye: 1.55 };

            D.onMouse = (e) => {
                if (MG.session !== S || MG.state !== 'running') return;
                if (e.button === 0) this._fireEmpHarpoon(S, D.cars[0]);
                else if (e.button === 2) this._triggerNitro(S, D.cars[0]);
            };
            D.onKey = (e) => {
                if (MG.session !== S || MG.state !== 'running') return;
                if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Space') this._triggerNitro(S, D.cars[0]);
                else if (e.code === 'KeyQ') this._triggerRepulse(S, D.cars[0]);
            };
            window.addEventListener('mousedown', D.onMouse);
            window.addEventListener('keydown', D.onKey);
        },
        dispose(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.stop();
            if (S.data.onMouse) window.removeEventListener('mousedown', S.data.onMouse);
            if (S.data.onKey) window.removeEventListener('keydown', S.data.onKey);
        },
        _triggerNitro(S, car) {
            if (!car.alive || car.falling || car.nitroCd > 0) return;
            car.nitroCd = 4.0;
            const fwd = V(-Math.sin(car.yaw), 0, -Math.cos(car.yaw));
            car.vel.addScaledVector(fwd, car.overchargeT > 0 ? 22 : 17.5);
            BO.FX.spawnParticles(car.pos.clone().add(V(0, 0.5, 0)), 18, 0xfacc15, 6, 4, 0.45, 0.9);
            tone(180, 620, 0.24, 'sawtooth', 0.11);
            if (car.isPlayer) SFX.launch();
        },
        _fireEmpHarpoon(S, car) {
            const D = S.data;
            if (!car.alive || car.falling || car.empCd > 0) return;
            car.empCd = 2.5;
            const yaw = car.isPlayer ? BO.Player.yaw : car.yaw;
            const fwd = V(-Math.sin(yaw), 0, -Math.cos(yaw));
            const start = car.pos.clone().add(V(0, 0.85, 0)).addScaledVector(fwd, 1.3);
            let best = null, bestDist = 18;
            for (const other of D.cars) {
                if (other === car || !other.alive || other.falling) continue;
                const to = other.pos.clone().sub(car.pos);
                const d = to.length();
                if (d > bestDist) continue;
                const dot = to.normalize().dot(fwd);
                if (dot > 0.86) { best = other; bestDist = d; }
            }
            const endPt = best ? best.pos.clone().add(V(0, 0.85, 0)) : start.clone().addScaledVector(fwd, 16);
            BO.FX.spawnTracer(start, endPt, 0x38bdf8, 0.20, 0.14);
            if (BO.MinigameAudio) BO.MinigameAudio.derbyZap(); else tone(880, 260, 0.18, 'square', 0.09);
            if (best) {
                best.stunT = 1.35;
                best.damage = Math.min(250, best.damage + 18);
                best.vel.addScaledVector(fwd, 10.5); // Jolt knockback!
                best.lastHitBy = car.i; best.lastHitT = S.t;
                BO.FX.spawnParticles(endPt, 20, 0x38bdf8, 5, 5, 0.45, 0.9);
                if (car.isPlayer) {
                    BO.HUD && BO.HUD.flashHitmarker && BO.HUD.flashHitmarker(false);
                    S.award(160, endPt.clone().add(V(0, 1.2, 0)), '⚡ EMP JOLT!', '#38bdf8');
                }
            }
        },
        _triggerRepulse(S, car) {
            const D = S.data;
            if (!car.alive || car.falling || car.repulseCd > 0) return;
            car.repulseCd = 9.0;
            const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.18, 10, 32), basic(0xec4899));
            ring.rotation.x = Math.PI / 2; ring.position.copy(car.pos).add(V(0, 0.6, 0));
            S.add(ring);
            let rT = 0;
            S.animate((dt) => {
                rT += dt; ring.scale.setScalar(1 + rT * 14);
                if (rT > 0.45) { S.scene.remove(ring); return false; }
            });
            tone(520, 140, 0.36, 'triangle', 0.13);
            let hitAny = 0;
            for (const other of D.cars) {
                if (other === car || !other.alive || other.falling) continue;
                const d = other.pos.distanceTo(car.pos);
                if (d < 8.0) {
                    const push = other.pos.clone().sub(car.pos).setY(0).normalize();
                    const mult = 1 + other.damage * 0.008;
                    other.vel.addScaledVector(push, 18.5 * mult);
                    other.damage = Math.min(250, other.damage + 22);
                    other.lastHitBy = car.i; other.lastHitT = S.t;
                    hitAny++;
                }
            }
            if (car.isPlayer && hitAny > 0) S.award(180 * hitAny, car.pos.clone().add(V(0, 2.2, 0)), `MAG REPULSE x${hitAny}!`, '#f472b6');
        },
        _spawnPickup(S) {
            const D = S.data;
            if (D.pickups.length >= 3) return;
            const a = Math.random() * TAU, r = 3 + Math.random() * (D.arenaR - 6.5);
            const kind = Math.random() < 0.55 ? 'overcharge' : 'wrench';
            const g = new THREE.Group();
            g.position.set(Math.cos(a) * r, 0.9, Math.sin(a) * r);
            if (kind === 'overcharge') {
                const core = new THREE.Mesh(new THREE.TorusKnotGeometry(0.36, 0.11, 36, 8), basic(0xfacc15));
                const halo = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 8, 20), basic(0x38bdf8));
                g.add(core, halo);
            } else {
                const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.85, 0.12), std(0x4ade80, 0.25, 0.85));
                const jaw1 = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.07, 8, 12, Math.PI * 1.3), std(0x4ade80, 0.25, 0.85));
                jaw1.position.y = 0.45;
                g.add(shaft, jaw1);
            }
            S.add(g);
            D.pickups.push({ kind, mesh: g });
        },
        _eliminateCar(S, c) {
            const D = S.data;
            if (!c.alive) return;
            c.alive = false;
            D.aliveCount--;
            BO.FX.spawnExplosion(c.pos.clone(), 3.6, c.col);
            tone(520, 95, 0.45, 'sawtooth', 0.12);
            const hitter = (c.lastHitBy >= 0 && S.t - c.lastHitT < 6.0) ? D.cars[c.lastHitBy] : null;
            if (hitter && hitter.isPlayer && !c.isPlayer) {
                D.kos++; S.kills++; S.bumpCombo();
                const streakTag = D.kos >= 4 ? '🔥 DERBY UNSTOPPABLE!' : D.kos === 3 ? '⚡ TRIPLE KO!' : D.kos === 2 ? '⚡ DOUBLE KO!' : `💥 RING-OUT KO: ${c.name}!`;
                S.award(850 + (D.kos > 1 ? 200 * D.kos : 0), c.pos.clone().add(V(0, 4, 0)), streakTag, '#fde047');
            }
            if (c.isPlayer) {
                MG.finish(`RINGED OUT! (${D.kos} KOs)`, { color: '#f87171', delay: 1.8 });
            } else {
                MG.toast(`⚡ ${c.name} KNOCKED INTO THE ABYSS! (${D.aliveCount - 1} RIVALS LEFT)`, '#fde047');
                // Respawn rival if >35s left and fewer than 4 cars remain so action stays non-stop, OR crown champion if all original + wave cleared!
                if (D.aliveCount <= 1 && D.cars[0].alive) {
                    S.award(2200, D.cars[0].pos.clone().add(V(0, 2.8, 0)), '🏆 DERBY CHAMPION!', '#facc15');
                    MG.finish('UNDEFEATED DERBY CHAMPION!', { color: '#facc15', delay: 2.0 });
                }
            }
        },
        update(S, dt, lib, state) {
            if (state !== 'running' && state !== 'countdown') return;
            const D = S.data, P = BO.Player;
            const me = D.cars[0];
            if (state === 'countdown') {
                if (P.rideState && me) {
                    const fwd = V(-Math.sin(me.yaw), 0, -Math.cos(me.yaw));
                    P.rideState.pos.set(me.pos.x - fwd.x * 0.35, me.pos.y, me.pos.z - fwd.z * 0.35);
                    P.rideState.eye = 1.52;
                }
                return;
            }
            if (BO.MinigameAudio) BO.MinigameAudio.tick(dt);
            if (D.pulseRing) D.pulseRing.material.color.setHex(D.suddenDeath ? (Math.sin(S.t * 14) > 0 ? 0xef4444 : 0xfacc15) : (Math.sin(S.t * 5) > 0 ? 0x38bdf8 : 0xec4899));
            if (!D.suddenDeath && S.t >= 75) {
                D.suddenDeath = true;
                for (const r of D.rails) { if (r.mesh) { S.scene.remove(r.mesh); r.mesh = null; } r.hp = 0; }
                SFX.rumble(0.7); MG.toast('⚠️ SUDDEN DEATH! ALL GUARDRAILS SHATTERED!', '#ef4444');
            }

            // Spawn arena powerups periodically
            D.pickupTimer -= dt;
            if (D.pickupTimer <= 0) { D.pickupTimer = 6.5; this._spawnPickup(S); }
            for (let i = D.pickups.length - 1; i >= 0; i--) {
                const pk = D.pickups[i];
                pk.mesh.rotation.y += dt * 2.6;
                pk.mesh.position.y = 0.9 + Math.sin(S.t * 4 + i) * 0.18;
                for (const c of D.cars) {
                    if (!c.alive || c.falling) continue;
                    if (c.pos.distanceTo(pk.mesh.position) < 1.8) {
                        if (pk.kind === 'overcharge') {
                            c.overchargeT = 8.0;
                            if (c.isPlayer) { MG.toast('⚡ OVERCHARGE! 1.7x RAM FORCE FOR 8s!', '#fde047'); S.award(200, pk.mesh.position, 'OVERCHARGE!', '#fde047'); }
                        } else {
                            c.damage = Math.max(0, c.damage - 55);
                            if (c.isPlayer) { MG.toast('🔧 CHASSIS REPAIRED (-55% KNOCKBACK)!', '#4ade80'); S.award(150, pk.mesh.position, 'REPAIRED!', '#4ade80'); }
                        }
                        tone(440, 880, 0.20, 'sine', 0.10);
                        S.scene.remove(pk.mesh); D.pickups.splice(i, 1); break;
                    }
                }
            }

            // Update each car's steering, propulsion, spark-pole shower & boundary checks
            for (const c of D.cars) {
                if (!c.alive) continue;
                c.nitroCd = Math.max(0, c.nitroCd - dt);
                c.empCd = Math.max(0, c.empCd - dt);
                c.repulseCd = Math.max(0, c.repulseCd - dt);
                c.stunT = Math.max(0, c.stunT - dt);
                c.overchargeT = Math.max(0, c.overchargeT - dt);

                if (c.falling) {
                    c.wy -= 24 * dt;
                    c.pos.addScaledVector(c.vel, dt);
                    c.pos.y += c.wy * dt;
                    c.vis.tiltG.rotation.x += dt * 3.5;
                    c.vis.tiltG.rotation.z += dt * 2.4;
                    c.vis.root.position.copy(c.pos);
                    if (c.pos.y < -11.5) this._eliminateCar(S, c);
                    continue;
                }

                if (c.stunT > 0) {
                    c.yaw += dt * 9.5; // Spin out when hit by EMP!
                } else if (c.isPlayer) {
                    const diff = wrapA(P.yaw - c.yaw);
                    c.yaw = wrapA(c.yaw + Math.max(-4.2 * dt, Math.min(4.2 * dt, diff * 6.5 * dt)));
                    c.vis.wheel.rotation.z = -diff * 1.4;
                    const fwd = V(-Math.sin(c.yaw), 0, -Math.cos(c.yaw));
                    const right = V(Math.cos(c.yaw), 0, -Math.sin(c.yaw));
                    let throttle = (P.keys['KeyW'] || P.keys['ArrowUp'] ? 1 : 0) - (P.keys['KeyS'] || P.keys['ArrowDown'] ? 0.65 : 0);
                    const strafe = (P.keys['KeyD'] ? 1 : 0) - (P.keys['KeyA'] ? 1 : 0);
                    c.yaw = wrapA(c.yaw - strafe * 1.9 * dt);
                    if (throttle !== 0) c.vel.addScaledVector(fwd, throttle * 26 * dt);
                    if (strafe !== 0) c.vel.addScaledVector(right, strafe * 4 * dt);
                } else {
                    // AI Bumper Driver: pick nearest target, steer away from open edge when threatened, Nitro ram!
                    c.aiRetarget -= dt;
                    if (c.aiRetarget <= 0) {
                        c.aiRetarget = 1.4 + Math.random() * 1.4;
                        const aliveOthers = D.cars.filter((o) => o !== c && o.alive && !o.falling);
                        if (aliveOthers.length) c.aiTarget = aliveOthers[Math.floor(Math.random() * aliveOthers.length)].i;
                    }
                    const tgt = D.cars[c.aiTarget];
                    const distCenter = Math.hypot(c.pos.x, c.pos.z);
                    let goalX = tgt && tgt.alive ? tgt.pos.x : 0;
                    let goalZ = tgt && tgt.alive ? tgt.pos.z : 0;
                    if (distCenter > D.arenaR - 3.6) { goalX = 0; goalZ = 0; } // panic steer back toward middle!
                    const desiredYaw = Math.atan2(c.pos.x - goalX, c.pos.z - goalZ);
                    const dYaw = wrapA(desiredYaw - c.yaw);
                    c.yaw = wrapA(c.yaw + Math.max(-3.4 * dt, Math.min(3.4 * dt, dYaw * 4.5 * dt)));
                    const fwd = V(-Math.sin(c.yaw), 0, -Math.cos(c.yaw));
                    c.vel.addScaledVector(fwd, 21.5 * dt);
                    if (tgt && tgt.alive && Math.abs(dYaw) < 0.35 && c.pos.distanceTo(tgt.pos) < 8.5 && c.nitroCd <= 0 && distCenter < D.arenaR - 5) {
                        this._triggerNitro(S, c);
                    }
                    if (c.driver) c.vis.driver.parts.headG.rotation.y = Math.max(-0.5, Math.min(0.5, dYaw));
                }

                // Tire grip & damping
                c.vel.multiplyScalar(Math.pow(0.24, dt));
                const spd = c.vel.length();
                if (spd > 24) c.vel.multiplyScalar(24 / spd);
                c.pos.addScaledVector(c.vel, dt);

                // Visual chassis pitch/roll + ceiling pole sparks when moving fast!
                c.vis.tiltG.rotation.x = lerp(c.vis.tiltG.rotation.x, -Math.min(0.18, spd * 0.01), dt * 10);
                c.vis.shoe.scale.setScalar(c.overchargeT > 0 ? 1.65 : 1.0 + Math.sin(S.t * 22 + c.i) * 0.22);
                if (spd > 7.5 && Math.random() < dt * 9) {
                    const sparkPos = c.pos.clone().add(V(0, 6.95, 0));
                    BO.FX.spawnParticles(sparkPos, 3, c.overchargeT > 0 ? 0xfacc15 : 0x38bdf8, 3.2, 2, 0.25, 0.55);
                }

                // Perimeter rail vs Open Gap check!
                const rDist = Math.hypot(c.pos.x, c.pos.z);
                if (rDist > D.arenaR - 1.35) {
                    let ang = Math.atan2(c.pos.z, c.pos.x);
                    if (ang < 0) ang += TAU;
                    const segIdx = Math.floor((ang / TAU) * 16) % 16;
                    const rail = D.rails[segIdx];
                    if (rail && rail.hp > 0) {
                        // Bounce off intact hazard rail — heavy slams crack/shatter it!
                        const nx = c.pos.x / rDist, nz = c.pos.z / rDist;
                        const outVel = c.vel.x * nx + c.vel.z * nz;
                        c.pos.x = nx * (D.arenaR - 1.38);
                        c.pos.z = nz * (D.arenaR - 1.38);
                        if (outVel > 0) {
                            c.vel.x -= 1.85 * outVel * nx;
                            c.vel.z -= 1.85 * outVel * nz;
                            if (outVel > 8.5) {
                                rail.hp--;
                                BO.FX.spawnParticles(V(nx * D.arenaR, 0.7, nz * D.arenaR), 18, 0xfacc15, 6, 6, 0.5, 1.0);
                                SFX.plateHit && SFX.plateHit(0.9);
                                if (rail.hp === 1 && rail.bar) {
                                    rail.bar.rotation.z = 0.14;
                                    rail.bar.material.color.setHex(0xf97316);
                                } else if (rail.hp <= 0 && rail.mesh) {
                                    S.scene.remove(rail.mesh); rail.mesh = null;
                                    if (c.lastHitBy === 0 || c.isPlayer) S.award(140, c.pos.clone().add(V(0, 1.4, 0)), 'RAIL SHATTERED!', '#fb923c');
                                }
                            }
                        }
                    } else if (rDist > D.arenaR + 0.35) {
                        c.falling = true;
                        c.wy = -1.5;
                    }
                }

                c.vis.root.position.copy(c.pos);
                c.vis.root.rotation.y = c.yaw;
            }

            // Car-to-Car Elastic Bumper Physics!
            const MIN_D = 2.42;
            for (let i = 0; i < D.cars.length; i++) {
                const a = D.cars[i];
                if (!a.alive || a.falling) continue;
                for (let j = i + 1; j < D.cars.length; j++) {
                    const b = D.cars[j];
                    if (!b.alive || b.falling) continue;
                    const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
                    const dist = Math.hypot(dx, dz);
                    if (dist < MIN_D && dist > 0.001) {
                        const nx = dx / dist, nz = dz / dist;
                        const overlap = (MIN_D - dist) * 0.52;
                        a.pos.x -= nx * overlap; a.pos.z -= nz * overlap;
                        b.pos.x += nx * overlap; b.pos.z += nz * overlap;

                        const relVx = a.vel.x - b.vel.x, relVz = a.vel.z - b.vel.z;
                        const impact = relVx * nx + relVz * nz;
                        if (impact > 0) {
                            const aSpd = a.vel.length(), bSpd = b.vel.length();
                            const aBoost = a.overchargeT > 0 ? 1.7 : 1.0;
                            const bBoost = b.overchargeT > 0 ? 1.7 : 1.0;
                            const aKnockMult = 1 + a.damage * 0.0085;
                            const bKnockMult = 1 + b.damage * 0.0085;
                            const jImp = Math.max(6.5, impact * 1.32);

                            a.vel.x -= nx * jImp * bBoost * aKnockMult * (bSpd > aSpd ? 1.25 : 0.72);
                            a.vel.z -= nz * jImp * bBoost * aKnockMult * (bSpd > aSpd ? 1.25 : 0.72);
                            b.vel.x += nx * jImp * aBoost * bKnockMult * (aSpd >= bSpd ? 1.25 : 0.72);
                            b.vel.z += nz * jImp * aBoost * bKnockMult * (aSpd >= bSpd ? 1.25 : 0.72);

                            a.damage = Math.min(250, a.damage + Math.round(impact * 0.9));
                            b.damage = Math.min(250, b.damage + Math.round(impact * 0.9));
                            a.lastHitBy = b.i; a.lastHitT = S.t;
                            b.lastHitBy = a.i; b.lastHitT = S.t;

                            const mid = V((a.pos.x + b.pos.x) * 0.5, 0.65, (a.pos.z + b.pos.z) * 0.5);
                            BO.FX.spawnParticles(mid, 14, 0xfde047, 5.5, 5, 0.4, 0.85);
                            if (a.isPlayer || b.isPlayer) {
                                if (BO.MinigameAudio) BO.MinigameAudio.bumperCrash(impact / 10); else tone(220, 95, 0.14, 'triangle', 0.12);
                                const rival = a.isPlayer ? b : a;
                                if (impact > 9.5 && aSpd >= bSpd - 1 && a.isPlayer) {
                                    S.award(120, mid.clone().add(V(0, 1.1, 0)), `⚡ T-BONE (${rival.damage}%)`, '#fde047');
                                } else if (impact > 9.5 && b.isPlayer && bSpd >= aSpd - 1) {
                                    S.award(120, mid.clone().add(V(0, 1.1, 0)), `⚡ T-BONE (${rival.damage}%)`, '#fde047');
                                }
                            }
                        }
                    }
                }
            }

            // First-person cockpit camera seated right behind your bumper car's steering wheel!
            if (P.rideState) {
                const fwd = V(-Math.sin(me.yaw), 0, -Math.cos(me.yaw));
                P.rideState.pos.set(me.pos.x - fwd.x * 0.35, me.pos.y, me.pos.z - fwd.z * 0.35);
                P.rideState.eye = 1.52;
            }
        },
        hud(S) {
            const D = S.data, me = D.cars[0];
            if (!me) return '';
            return `<div class="fun-panel">
                <div class="mgx-chip">RIVALS LEFT <b>${Math.max(0, D.aliveCount - (me.alive ? 1 : 0))}</b></div>
                <div class="mgx-chip">KOs <b>${D.kos}</b></div>
                <div class="mgx-chip">YOUR CHASSIS <b>${me.damage}%</b></div>
                <div class="mgx-chip ${me.nitroCd <= 0 ? 'mgx-hot' : ''}">NITRO [SHIFT] <b>${me.nitroCd <= 0 ? 'READY' : me.nitroCd.toFixed(1) + 's'}</b></div>
                <div class="mgx-chip ${me.empCd <= 0 ? 'mgx-hot' : ''}">EMP [LMB] <b>${me.empCd <= 0 ? 'READY' : me.empCd.toFixed(1) + 's'}</b></div>
                <div class="mgx-chip ${me.repulseCd <= 0 ? 'mgx-hot' : ''}">REPULSE [Q] <b>${me.repulseCd <= 0 ? 'READY' : me.repulseCd.toFixed(1) + 's'}</b></div>
            </div>`;
        },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return {
                score: S.score, stars,
                title: D.aliveCount <= 1 && D.cars[0].alive ? 'UNDEFEATED DERBY KING' : 'BUMPER DERBY COMPLETE',
                stats: [['RING-OUT KOs', D.kos], ['RIVALS REMAINING', Math.max(0, D.aliveCount - (D.cars[0].alive ? 1 : 0))], ['CHASSIS WEAR', D.cars[0].damage + '%']],
                xp: Math.round(160 + S.score * 0.03 + stars * 140)
            };
        }
    });

    /* =====================================================================
       11. HELL'S COMBAT KITCHEN
       Five-Star Tactical Bistro: Sizzling Grill + Multi-Layer Burger Pass +
       Raiding Giant Chef-Rats & Hangry Diner Zombies!
    ===================================================================== */
    const INGREDIENTS = [
        { id: 'bun', label: 'BRIoche BUN', col: 0xd97706, x: -7.5, z: -4.2 },
        { id: 'raw_patty', label: 'RAW WAGYU', col: 0xdc2626, x: -4.8, z: -4.2 },
        { id: 'cheese', label: 'AGED CHEDDAR', col: 0xfacc15, x: -2.1, z: -4.2 },
        { id: 'greens', label: 'TOMATO & GREENS', col: 0x22c55e, x: 0.6, z: -4.2 }
    ];

    const RECIPES = [
        { name: 'CLASSIC SMASH', need: ['bun', 'cooked_patty'], reward: 550 },
        { name: 'GOLD CHEESEBURGER', need: ['bun', 'cooked_patty', 'cheese'], reward: 750 },
        { name: 'BISTRO DELUXE', need: ['bun', 'cooked_patty', 'cheese', 'greens'], reward: 1000 },
        { name: 'DOUBLE WAGYU TOWER', need: ['bun', 'cooked_patty', 'cooked_patty', 'cheese'], reward: 1250 }
    ];

    function kitchenTileTex() {
        return L.canvasTex('bistro-tile-v1', 256, 256, (g, w, h) => {
            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                    g.fillStyle = (x + y) % 2 === 0 ? '#f1f5f9' : '#1e293b';
                    g.fillRect(x * 32, y * 32, 32, 32);
                    g.strokeStyle = 'rgba(148,163,184,0.28)';
                    g.strokeRect(x * 32, y * 32, 32, 32);
                }
            }
        });
    }

    function buildFoodLayerMesh(kind) {
        const g = new THREE.Group();
        if (kind === 'bun') {
            const bot = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.24, 0.08, 16), std(0xd97706, 0.75));
            const top = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 10, 0, TAU, 0, Math.PI * 0.5), std(0xb45309, 0.65));
            top.position.y = 0.05;
            g.add(bot, top);
            // Sesame seeds!
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * TAU;
                const seed = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), basic(0xfef3c7));
                seed.position.set(Math.cos(a) * 0.13, 0.16, Math.sin(a) * 0.13);
                g.add(seed);
            }
        } else if (kind === 'raw_patty') {
            const m = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.09, 16), std(0xef4444, 0.6));
            g.add(m);
        } else if (kind === 'cooked_patty') {
            const m = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.09, 16), std(0x5c2c16, 0.55));
            g.add(m);
        } else if (kind === 'burnt_patty') {
            const m = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.08, 14), std(0x111827, 0.95));
            g.add(m);
        } else if (kind === 'cheese') {
            const m = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.42), std(0xfacc15, 0.4));
            m.rotation.y = Math.PI / 4;
            g.add(m);
        } else if (kind === 'greens') {
            const letRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.06, 6, 14), std(0x22c55e, 0.65));
            letRing.rotation.x = Math.PI / 2;
            const tom = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 14), std(0xdc2626, 0.45));
            tom.position.y = 0.04;
            g.add(letRing, tom);
        }
        return g;
    }

    function buildChefRat() {
        const root = new THREE.Group();
        const hit = [];
        const fur = std(0x64748b, 0.82);
        const pink = std(0xfda4af, 0.65);

        const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 12), fur);
        body.scale.set(0.88, 0.82, 1.38); body.position.y = 0.38;
        const head = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.58, 12), fur);
        head.rotation.x = Math.PI / 2; head.position.set(0, 0.48, 0.56);
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), pink);
        nose.position.set(0, 0.48, 0.85);
        root.add(body, head, nose);
        hit.push(body, head);
        head.userData.hitbox = 'head';

        // Big pink ears, glowing red eyes & tiny white Chef Toque hat!
        for (const s of [-1, 1]) {
            const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.03, 12), pink);
            ear.rotation.x = Math.PI / 2; ear.position.set(s * 0.22, 0.68, 0.38);
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 6), basic(0xef4444));
            eye.position.set(s * 0.11, 0.55, 0.66);
            root.add(ear, eye);
        }
        const toqueBand = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.14, 0.16, 12), std(0xffffff, 0.5));
        toqueBand.position.set(0, 0.72, 0.42);
        const toquePuff = new THREE.Mesh(new THREE.SphereGeometry(0.20, 12, 10), std(0xffffff, 0.5));
        toquePuff.position.set(0, 0.88, 0.42);
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.05, 0.85, 8), pink);
        tail.rotation.x = -Math.PI * 0.42; tail.position.set(0, 0.28, -0.78);
        root.add(toqueBand, toquePuff, tail);
        hit.push(toqueBand, toquePuff);
        root.traverse((m) => { if (m.isMesh) m.castShadow = true; });
        return { root, hit, tail };
    }

    MG.register({
        id: 'fun_combat_kitchen', cat: 'fun', order: 11,
        name: "Hell's Combat Kitchen", icon: '🍔', accent: '#f97316', badge: 'CHEF SHOOTER',
        tagline: 'Sear Wagyu patties, stack 5-star burgers & blast Chef-Rats raiding your pass!',
        desc: 'Run a chaotic Michelin-star Tactical Bistro! Press [E] at Ingredient Crates to grab Brioche Buns, Raw Wagyu, Cheddar & Greens; sear Wagyu on the 4 Sizzling Flattop Burners (pull them off while GOLD before they catch fire!); stack matching orders on the Pass Window Plates and ring the Brass Service Bell! Meanwhile, blast Giant Chef-Rats & Hangry Diner Zombies before they steal your burgers—and shoot the Red Overhead Extinguisher Valve to douse grease fires instantly!',
        guide: {
            objective: 'Cook, plate, and ring out VIP Burger Tickets at the Pass Window while defending your kitchen from raiding Chef-Rats and Hangry Diners!',
            tips: [
                'Grab RAW WAGYU with [E], place it on any of the 4 Grill Burners with [E], wait ~4.5s until the ring turns GOLD ("SEARED!"), and grab it before 10s or it ignites a Grease Fire!',
                'Stack ingredients on either Pass Plate in any order matching an active Ticket (e.g. BUN + SEARED PATTY + CHEDDAR), then press [E] on the Brass Bell (or right on the completed plate) to serve!',
                'Shoot the RED OVERHEAD EXTINGUISHER VALVE above the grill to foam-blast all burning burners at once!'
            ]
        },
        heroLabel: 'FUN & SPECIALS • CULINARY CHAOS', duration: 150,
        stars: [2200, 4200, 6800, 9500],
        standardWeapon: 'm1911', lockWeapon: true, infiniteMag: true, forgivingMisses: true, customMusic: true,
        weaponLabel: 'SOUS-CHEF M1911 + SPATULA [E]', weaponNote: '[E] Grab / Grill / Plate / Serve • 3-Order Streak = MICHELIN FEVER (2x Grill Speed + 1.5x Tips)!',
        keys: [['WASD', 'Move in Kitchen'], ['E', 'Grab / Grill / Plate / Bell'], ['LMB', 'Shoot Rats & Fire Valve'], ['Q', 'Toss Held Item']],
        map: {
            atmosphere: { skyTop: 0x1c1917, skyBottom: 0x451a03, fogColor: 0x292524, fogDensity: 0.010, sunColor: 0xfffbeb, sunIntensity: 1.3, sunPos: [6, 18, 8], hemiSky: 0xfef3c7, hemiGround: 0x44403c, hemiIntensity: 0.95 },
            boxes: [
                B(0, -0.5, 0, 26, 1, 24, 'concrete'),
                B(-13, 3.5, 0, 0.8, 7, 24, 'brick'), B(13, 3.5, 0, 0.8, 7, 24, 'brick'),
                B(0, 3.5, -12, 26, 7, 0.8, 'brick'), B(0, 3.5, 12, 26, 7, 0.8, 'brick')
            ],
            spawn: { x: 0, y: 0, z: 0, yaw: 0 }
        },
        countdown: 3,
        build(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.start('kitchen');
            const D = S.data;
            Object.assign(D, {
                held: null, heldHudMesh: null, burners: [], plates: [], crates: [], tickets: [],
                raiders: [], served: 0, stolen: 0, spawnCd: 2.8, ticketCd: 0.5, valveCool: 0, feverT: 0, orderStreak: 0
            });

            // Checkered Bistro Floor + Warm Bistro Walls + Dining Room beyond the Pass!
            const floor = new THREE.Mesh(new THREE.PlaneGeometry(25.4, 23.4), new THREE.MeshStandardMaterial({ map: kitchenTileTex(), roughness: 0.32, metalness: 0.1 }));
            floor.rotation.x = -Math.PI / 2; floor.position.y = 0.02; floor.receiveShadow = true; S.add(floor);

            const steel = std(0xcbd5e1, 0.25, 0.82);
            const darkSteel = std(0x334155, 0.45, 0.65);
            const wood = std(0x78350f, 0.72, 0.1);

            const banner = A.sign("🔥 HELL'S COMBAT KITCHEN — PASS WINDOW 🔥", 10.5, 1.15, { bg: '#451a03', color: '#fde047', borderColor: '#f97316', size: 0.38, glow: '#f97316' });
            banner.position.set(0, 4.6, 3.6); banner.rotation.y = Math.PI; S.add(banner);

            const warm1 = new THREE.PointLight(0xffedd5, 1.2, 24, 1.5); warm1.position.set(-4, 4.8, -2); S.add(warm1);
            const warm2 = new THREE.PointLight(0xfde68a, 1.1, 24, 1.5); warm2.position.set(4, 4.8, 3); S.add(warm2);
            // Overhead Brass Bistro Pendant Lamps & Hanging Copper Pot Rack!
            const copperM = std(0xd97706, 0.25, 0.85);
            for (const lx of [-3.5, 0, 3.5]) {
                const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 6), darkSteel); cord.position.set(lx, 5.8, 3.6);
                const shade = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.45, 14), copperM); shade.position.set(lx, 4.6, 3.6);
                const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), basic(0xfef08a)); bulb.position.set(lx, 4.35, 3.6);
                S.add(cord, shade, bulb);
            }
            const potBar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 6.2, 8), darkSteel);
            potBar.rotation.z = Math.PI / 2; potBar.position.set(-3.4, 3.9, -4.2); S.add(potBar);
            for (let p = -2; p <= 2; p++) {
                const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.30, 0.14, 14), copperM);
                pan.rotation.x = Math.PI / 2; pan.position.set(-3.4 + p * 1.2, 3.45, -4.2); S.add(pan);
            }

            // 1. Back Ingredient Counter (z = -4.2) with 4 Labeled Crates + Trash Chute
            const prepBench = new THREE.Mesh(new THREE.BoxGeometry(11.6, 1.0, 1.5), steel);
            prepBench.position.set(-3.4, 0.5, -4.2); S.add(prepBench);
            for (const ing of INGREDIENTS) {
                const crate = new THREE.Group();
                crate.position.set(ing.x, 1.02, ing.z);
                const box = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.36, 1.15), wood);
                box.position.y = 0.18; crate.add(box);
                for (let k = 0; k < 3; k++) {
                    const sample = buildFoodLayerMesh(ing.id);
                    sample.position.set((k - 1) * 0.44, 0.40, 0);
                    crate.add(sample);
                }
                const sg = A.sign(ing.label, 1.75, 0.42, { bg: '#0f172a', color: '#fde047', borderColor: '#' + ing.col.toString(16).padStart(6, '0'), size: 0.17 });
                sg.position.set(0, 0.95, -0.45); crate.add(sg);
                S.add(crate);
                D.crates.push({ ing, pos: V(ing.x, 1.1, ing.z) });
            }

            // 2. Right-Side Sizzling Flattop Grill Station (x = 6.2, z = -3.8..1.6) + 4 Burners + Overhead Hood & Shootable Extinguisher Valve!
            const grillUnit = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.0, 6.8), darkSteel);
            grillUnit.position.set(6.2, 0.5, -1.2); S.add(grillUnit);
            const griddleTop = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.08, 6.4), std(0x1e293b, 0.35, 0.8));
            griddleTop.position.set(6.2, 1.04, -1.2); S.add(griddleTop);
            const hood = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.85, 7.0), steel);
            hood.position.set(6.2, 4.1, -1.2); S.add(hood);

            // Shootable Red Fire-Suppression Valve under the range hood!
            const valveG = new THREE.Group();
            const vTank = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.95, 14), std(0xdc2626, 0.3, 0.5));
            const vWheel = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.05, 8, 16), basic(0xfacc15));
            vWheel.position.set(-0.26, 0, 0); vWheel.rotation.y = Math.PI / 2;
            const vSign = A.sign('SHOOT: FOAM EXTINGUISHER', 2.2, 0.40, { bg: '#7f1d1d', color: '#ffffff', borderColor: '#facc15', size: 0.14 });
            vSign.position.set(-0.4, 0.68, 0); vSign.rotation.y = -Math.PI / 2;
            valveG.add(vTank, vWheel, vSign);
            D.extinguisherTarget = S.addTarget({
                kind: 'extinguisher', pos: V(5.1, 3.25, -1.2), mesh: valveG, hitMeshes: [vTank, vWheel],
                hp: 999999, life: 0, points: 0, appear: 'none', bonus: true,
                onDamage: () => this._triggerFoamSuppression(S)
            });

            for (let i = 0; i < 4; i++) {
                const bz = -3.45 + i * 1.5;
                const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.045, 8, 22), basic(0x475569));
                ring.rotation.x = Math.PI / 2; ring.position.set(6.0, 1.10, bz); S.add(ring);
                const foodMount = new THREE.Group();
                foodMount.position.set(6.0, 1.12, bz); S.add(foodMount);
                const lbl = labelSprite('EMPTY BURNER', '#94a3b8', 1.7);
                lbl.position.set(6.0, 1.85, bz); S.add(lbl);
                D.burners.push({ idx: i, pos: V(6.0, 1.12, bz), state: 'empty', cookT: 0, ring, foodMount, lbl });
            }

            // 3. Front Pass Window Counter (z = 3.6) with 2 Porcelain Assembly Plates + Brass Service Bell!
            const passCounter = new THREE.Mesh(new THREE.BoxGeometry(9.6, 1.05, 1.6), steel);
            passCounter.position.set(-0.8, 0.52, 3.6); S.add(passCounter);

            for (let i = 0; i < 2; i++) {
                const px = -2.6 + i * 2.8;
                const plateMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.42, 0.07, 22), std(0xf8fafc, 0.2, 0.1));
                plateMesh.position.set(px, 1.08, 3.6); S.add(plateMesh);
                const stackG = new THREE.Group();
                stackG.position.set(px, 1.12, 3.6); S.add(stackG);
                const lbl = labelSprite(`PLATE #${i + 1} [E]`, '#e2e8f0', 1.9);
                lbl.position.set(px, 2.05, 3.6); S.add(lbl);
                D.plates.push({ idx: i, pos: V(px, 1.12, 3.6), items: [], stackG, lbl });
            }

            // Brass Service Bell
            const bellG = new THREE.Group();
            bellG.position.set(2.4, 1.06, 3.6);
            const bBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.06, 16), std(0x1e293b, 0.5));
            const bDome = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 10, 0, TAU, 0, Math.PI * 0.5), std(0xfacc15, 0.2, 0.9));
            bDome.position.y = 0.04;
            const bPin = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 8), std(0xe2e8f0, 0.2, 0.9));
            bPin.position.y = 0.27;
            bellG.add(bBase, bDome, bPin); S.add(bellG);
            const bellLbl = labelSprite('🔔 RING PASS BELL [E]', '#fde047', 2.2);
            bellLbl.position.set(2.4, 1.95, 3.6); S.add(bellLbl);
            D.bellPos = V(2.4, 1.15, 3.6);

            // 4. Visible Dining Room Tables + Seated VIP Critics beyond the Pass Window (z = 7.5..10)
            for (let t = -1; t <= 1; t++) {
                const tx = t * 4.5, tz = 8.2;
                const tblTop = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.08, 20), std(0x991b1b, 0.7));
                tblTop.position.set(tx, 0.85, tz);
                const tblPed = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.35, 0.85, 12), darkSteel);
                tblPed.position.set(tx, 0.42, tz);
                const candle = A.torch(S, V(tx, 0.9, tz), 0xf97316, false);
                candle.scale.setScalar(0.50);
                const critic = F.human({ coat: 0x1e1b4b, shirt: 0xffffff, tie: 0xdc2626, hat: t === 0 ? 'tophat' : 'fedora', glasses: 'round', scale: 0.94 });
                critic.root.position.set(tx, 0, tz + 1.15); critic.root.rotation.y = Math.PI;
                S.add(tblTop); S.add(tblPed); S.add(candle); S.add(critic.root);
                S.animate(() => { F.pose(critic, 'idle', S.t + t); });
            }

            // 3D Held-Ingredient Preview attached to worldCamera so you always see what's in your chef hand!
            D.handAnchor = new THREE.Group();
            if (BO.App && BO.App.worldCamera) BO.App.worldCamera.add(D.handAnchor);
            D.handAnchor.position.set(-0.36, -0.28, -0.68);

            // Spawn initial 3 VIP Tickets
            for (let k = 0; k < 3; k++) this._addTicket(S);

            D.onKey = (e) => {
                if (MG.session !== S || MG.state !== 'running') return;
                if (e.code === 'KeyE') this._interactKitchen(S);
                else if (e.code === 'KeyQ' && D.held) {
                    D.held = null; this._syncHandVisual(S);
                    tone(300, 140, 0.10, 'sine', 0.07);
                    MG.toast('🗑️ TOSSED HELD INGREDIENT', '#94a3b8');
                }
            };
            window.addEventListener('keydown', D.onKey);
        },
        dispose(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.stop();
            if (S.data.onKey) window.removeEventListener('keydown', S.data.onKey);
            if (S.data.handAnchor && S.data.handAnchor.parent) S.data.handAnchor.parent.remove(S.data.handAnchor);
        },
        _syncHandVisual(S) {
            const D = S.data;
            while (D.handAnchor.children.length) D.handAnchor.remove(D.handAnchor.children[0]);
            if (D.held) {
                const m = buildFoodLayerMesh(D.held);
                m.scale.setScalar(0.75);
                D.handAnchor.add(m);
            }
        },
        _addTicket(S) {
            const D = S.data;
            if (D.tickets.length >= 4) return;
            const spec = RECIPES[Math.floor(Math.random() * RECIPES.length)];
            D.tickets.push({ spec, timeLeft: 48, maxTime: 48 });
        },
        _rebuildPlateVisual(p) {
            while (p.stackG.children.length) p.stackG.remove(p.stackG.children[0]);
            p.items.forEach((it, idx) => {
                const m = buildFoodLayerMesh(it);
                m.position.y = idx * 0.095;
                p.stackG.add(m);
            });
        },
        _triggerFoamSuppression(S) {
            const D = S.data;
            if (D.valveCool > 0) return;
            D.valveCool = 3.5;
            let doused = 0;
            for (const b of D.burners) {
                BO.FX.spawnParticles(b.pos.clone().add(V(0, 0.4, 0)), 22, 0xe0f2fe, 5, 4, 0.65, 1.1);
                if (b.state === 'fire') {
                    b.state = 'empty'; b.cookT = 0;
                    while (b.foodMount.children.length) b.foodMount.remove(b.foodMount.children[0]);
                    b.ring.material.color.setHex(0x475569);
                    doused++;
                }
            }
            tone(700, 220, 0.35, 'sawtooth', 0.11);
            MG.toast(doused > 0 ? `🧯 FOAM SUPPRESSION DOUSED ${doused} GREASE FIRE(S)!` : '🧯 FOAM VALVE ACTIVATED!', '#38bdf8');
        },
        _servePlates(S) {
            const D = S.data;
            let servedAny = false;
            for (const p of D.plates) {
                if (!p.items.length) continue;
                const sortedPlate = p.items.slice().sort().join('+');
                const matchIdx = D.tickets.findIndex((tk) => tk.spec.need.slice().sort().join('+') === sortedPlate);
                if (matchIdx >= 0) {
                    const tk = D.tickets.splice(matchIdx, 1)[0];
                    const tip = Math.round((tk.timeLeft / tk.maxTime) * (D.feverT > 0 ? 390 : 260));
                    const pts = tk.spec.reward + tip;
                    D.served++; D.orderStreak++; S.bumpCombo();
                    if (D.orderStreak >= 3 && D.feverT <= 0) {
                        D.feverT = 12.0; D.orderStreak = 0;
                        MG.toast('🔥 MICHELIN FEVER (12s)! 2x GRILL SPEED + 1.5x TIPS!', '#fde047');
                    }
                    S.award(pts, p.pos.clone().add(V(0, 1.0, 0)), `🔔 ORDER UP: ${tk.spec.name} (+${tip} TIP)!`, '#fde047');
                    BO.FX.spawnParticles(p.pos.clone().add(V(0, 0.4, 0)), 20, 0xfacc15, 5, 6, 0.5, 0.9);
                    if (BO.MinigameAudio) BO.MinigameAudio.kitchenBell(); else { tone(880, 1320, 0.18, 'triangle', 0.13); tone(1320, 1760, 0.24, 'triangle', 0.12, 0.10); }
                    p.items = []; this._rebuildPlateVisual(p);
                    this._addTicket(S);
                    servedAny = true;
                }
            }
            if (!servedAny) {
                tone(220, 150, 0.16, 'sawtooth', 0.09);
                MG.toast('⚠️ NO MATCHING TICKET — CHECK RECIPE TOPPINGS OR [Q] CLEAR!', '#fca5a5');
            }
        },
        _interactKitchen(S) {
            const D = S.data, pp = BO.Player.pos;

            // 1. Check Service Bell
            if (pp.distanceTo(D.bellPos) < 2.5) {
                this._servePlates(S);
                return;
            }
            // 2. Check Ingredient Crates
            for (const c of D.crates) {
                if (Math.hypot(pp.x - c.pos.x, pp.z - c.pos.z) < 2.15) {
                    D.held = c.ing.id;
                    this._syncHandVisual(S);
                    tone(520, 680, 0.10, 'sine', 0.09);
                    MG.toast(`✋ GRABBED ${c.ing.label}`, '#fde047');
                    return;
                }
            }
            // 3. Check Sizzling Burners
            for (const b of D.burners) {
                if (Math.hypot(pp.x - b.pos.x, pp.z - b.pos.z) < 2.4) {
                    if (b.state === 'fire') {
                        MG.toast('🔥 GREASE FIRE! SHOOT THE RED OVERHEAD FOAM VALVE!', '#ef4444');
                        return;
                    }
                    if (b.state === 'empty' && D.held === 'raw_patty') {
                        D.held = null; this._syncHandVisual(S);
                        b.state = 'raw'; b.cookT = 0;
                        b.foodMount.add(buildFoodLayerMesh('raw_patty'));
                        b.ring.material.color.setHex(0xf97316);
                        if (BO.MinigameAudio) BO.MinigameAudio.kitchenSizzle(); else tone(260, 480, 0.14, 'sawtooth', 0.09);
                        MG.toast('🥩 SIZZLING WAGYU ON BURNER — PULL WHEN GOLD!', '#fb923c');
                        return;
                    }
                    if (b.state === 'cooked' && !D.held) {
                        b.state = 'empty'; b.cookT = 0;
                        while (b.foodMount.children.length) b.foodMount.remove(b.foodMount.children[0]);
                        b.ring.material.color.setHex(0x475569);
                        D.held = 'cooked_patty'; this._syncHandVisual(S);
                        tone(660, 920, 0.12, 'triangle', 0.10);
                        MG.toast('✨ GRABBED PERFECT SEARED WAGYU! PLATE IT AT THE PASS!', '#4ade80');
                        return;
                    }
                    if (b.state === 'raw') {
                        MG.toast('⏳ STILL SEARING — WAIT FOR GOLD RING!', '#fde047');
                        return;
                    }
                }
            }
            // 4. Check Assembly Plates
            for (const p of D.plates) {
                if (Math.hypot(pp.x - p.pos.x, pp.z - p.pos.z) < 2.35) {
                    if (D.held && D.held !== 'raw_patty') {
                        if (p.items.length < 5) {
                            p.items.push(D.held);
                            D.held = null; this._syncHandVisual(S);
                            this._rebuildPlateVisual(p);
                            tone(560, 820, 0.10, 'sine', 0.10);
                            // Auto-check if plate matches a ticket and let them ring or auto-serve if bell is right there!
                            const sorted = p.items.slice().sort().join('+');
                            if (D.tickets.some((tk) => tk.spec.need.slice().sort().join('+') === sorted)) {
                                MG.toast('✅ BURGER COMPLETE! RING THE BELL [E] TO SERVE!', '#4ade80');
                            }
                        }
                        return;
                    } else if (D.held === 'raw_patty') {
                        MG.toast('🥩 SEAR RAW WAGYU ON THE RIGHT-SIDE GRILL FIRST!', '#fb923c');
                        return;
                    } else if (!D.held && p.items.length > 0) {
                        // Pressing E with empty hands on a completed plate serves it directly—or clears a botched stack!
                        const sorted = p.items.slice().sort().join('+');
                        if (D.tickets.some((tk) => tk.spec.need.slice().sort().join('+') === sorted)) {
                            this._servePlates(S);
                        } else {
                            p.items = []; this._rebuildPlateVisual(p);
                            MG.toast('🧹 CLEARED MISMATCHED PLATE', '#94a3b8');
                        }
                        return;
                    }
                }
            }
        },
        _spawnRaider(S) {
            const D = S.data;
            if (D.raiders.length >= 6) return;
            const isRat = Math.random() < 0.62;
            const side = Math.random() < 0.5 ? -1 : 1;
            const pos = V(side * 10.5, 0, -8.5 + Math.random() * 9.5);
            let mesh, hit, fig = null, rat = null;
            if (isRat) {
                rat = buildChefRat();
                mesh = rat.root; hit = rat.hit;
            } else {
                fig = F.human({ shirt: 0x166534, coat: 0x3f6212, pants: 0x1e293b, eyes: 'angry', mouth: 'o', hair: 0x1c1917, scale: 0.96 });
                mesh = fig.root; hit = fig.hit;
            }
            const tgt = S.addTarget({
                kind: isRat ? 'chef_rat' : 'hangry_diner', pos, mesh, hitMeshes: hit,
                hp: isRat ? 2 : 4, life: 0, points: isRat ? 180 : 280, appear: 'scale', death: 'tumble',
                deathColor: isRat ? 0x94a3b8 : 0x4ade80,
                onKill: () => { D.raiders = D.raiders.filter((r) => r.tgt !== tgt); }
            });
            D.raiders.push({ tgt, isRat, fig, rat, speed: isRat ? 3.8 : 2.5, atkCd: 1.0, phase: Math.random() * 6 });
        },
        update(S, dt, lib, state) {
            if (state !== 'running') return;
            if (BO.MinigameAudio) BO.MinigameAudio.tick(dt);
            const D = S.data, P = BO.Player;
            D.valveCool = Math.max(0, D.valveCool - dt);
            D.feverT = Math.max(0, (D.feverT || 0) - dt);

            // Keep ticket queue populated & tick patience timers
            D.ticketCd -= dt;
            if (D.ticketCd <= 0) { D.ticketCd = 11.0; if (D.tickets.length < 4) this._addTicket(S); }
            for (let i = D.tickets.length - 1; i >= 0; i--) {
                D.tickets[i].timeLeft -= dt;
                if (D.tickets[i].timeLeft <= 0) {
                    const lost = D.tickets.splice(i, 1)[0];
                    S.breakCombo('TICKET EXPIRED');
                    MG.toast(`😡 VIP WALKED OUT ON ${lost.spec.name}!`, '#f87171');
                    this._addTicket(S);
                }
            }

            // Update 4 Sizzling Flattop Burners
            for (const b of D.burners) {
                if (b.state === 'raw' || b.state === 'cooked') {
                    b.cookT += dt * (b.state === 'raw' && D.feverT > 0 ? 1.9 : 1.0);
                    if (Math.random() < dt * 6) BO.FX.spawnParticles(b.pos.clone().add(V(0, 0.12, 0)), 2, b.state === 'cooked' ? 0xfde047 : 0xe2e8f0, 1.2, 2.2, 0.35, 0.4);
                    if (b.state === 'raw' && b.cookT >= 4.2) {
                        b.state = 'cooked';
                        while (b.foodMount.children.length) b.foodMount.remove(b.foodMount.children[0]);
                        b.foodMount.add(buildFoodLayerMesh('cooked_patty'));
                        b.ring.material.color.setHex(0xfacc15);
                        tone(740, 1040, 0.14, 'sine', 0.08);
                    } else if (b.state === 'cooked' && b.cookT >= 11.5) {
                        b.state = 'fire';
                        while (b.foodMount.children.length) b.foodMount.remove(b.foodMount.children[0]);
                        b.foodMount.add(buildFoodLayerMesh('burnt_patty'));
                        b.ring.material.color.setHex(0xef4444);
                        MG.toast('🔥 BURNER GREASE FIRE! SHOOT OVERHEAD RED VALVE!', '#ef4444');
                    }
                } else if (b.state === 'fire') {
                    if (Math.random() < dt * 14) BO.FX.spawnParticles(b.pos.clone().add(V(0, 0.25, 0)), 4, 0xf97316, 2.6, 3.8, 0.45, 0.85);
                }
            }

            // Spawn & march Chef-Rats & Hangry Diners toward Pass Plates or Player!
            D.spawnCd -= dt;
            if (D.spawnCd <= 0) {
                D.spawnCd = Math.max(2.2, 4.6 - S.t * 0.015);
                this._spawnRaider(S);
            }
            for (const r of D.raiders) {
                if (!r.tgt.alive) continue;
                r.phase += dt * 9;
                const hasPlatedFood = D.plates.find((pl) => pl.items.length > 0);
                const goal = (r.isRat && hasPlatedFood) ? hasPlatedFood.pos : P.pos;
                const dx = goal.x - r.tgt.basePos.x, dz = goal.z - r.tgt.basePos.z;
                const dist = Math.max(0.1, Math.hypot(dx, dz));
                r.tgt.root.rotation.y = Math.atan2(dx, dz);
                if (dist > 1.35) {
                    r.tgt.basePos.x += (dx / dist) * r.speed * dt;
                    r.tgt.basePos.z += (dz / dist) * r.speed * dt;
                    r.tgt.root.position.copy(r.tgt.basePos);
                } else {
                    r.atkCd -= dt;
                    if (r.atkCd <= 0) {
                        r.atkCd = 1.6;
                        if (r.isRat && hasPlatedFood && hasPlatedFood.items.length > 0) {
                            hasPlatedFood.items.pop();
                            this._rebuildPlateVisual(hasPlatedFood);
                            D.stolen++;
                            MG.toast('🐀 A CHEF-RAT STOLE A TOPPING OFF YOUR PASS PLATE!', '#f87171');
                        } else {
                            P.takeDamage(9, r.tgt.basePos, true);
                        }
                    }
                }
                if (r.fig) F.walk(r.fig, r.phase, 1, true);
                if (r.rat) {
                    r.rat.root.position.y = Math.abs(Math.sin(r.phase * 1.4)) * 0.14;
                    r.rat.tail.rotation.z = Math.sin(r.phase * 2) * 0.35;
                }
            }

            // Contextual Chef Prompt
            if (BO.HUD && BO.HUD.showPrompt) {
                let msg = '';
                if (P.pos.distanceTo(D.bellPos) < 2.5) msg = '[E] RING PASS SERVICE BELL';
                else {
                    for (const c of D.crates) if (Math.hypot(P.pos.x - c.pos.x, P.pos.z - c.pos.z) < 2.15) msg = `[E] GRAB ${c.ing.label}`;
                    for (const b of D.burners) if (Math.hypot(P.pos.x - b.pos.x, P.pos.z - b.pos.z) < 2.4) {
                        msg = b.state === 'empty' ? '[E] SEAR RAW WAGYU ON GRILL' : b.state === 'cooked' ? '[E] GRAB PERFECT SEARED WAGYU!' : b.state === 'fire' ? 'SHOOT RED OVERHEAD VALVE TO DOUSE FIRE!' : 'SEARING WAGYU...';
                    }
                    for (const p of D.plates) if (Math.hypot(P.pos.x - p.pos.x, P.pos.z - p.pos.z) < 2.35) {
                        msg = D.held ? `[E] STACK ${D.held.toUpperCase().replace('_', ' ')} ON PLATE #${p.idx + 1}` : (p.items.length ? '[E] SERVE MATCHING BURGER / CLEAR MISMATCH' : `PLATE #${p.idx + 1} (EMPTY)`);
                    }
                }
                if (msg) BO.HUD.showPrompt(msg);
            }
            if (!P.alive) MG.finish('KITCHEN OVERRUN BY CRITICS & RATS', { color: '#f87171' });
        },
        hud(S) {
            const D = S.data;
            const heldName = D.held ? D.held.toUpperCase().replace('_', ' ') : 'EMPTY';
            const ticketHtml = D.tickets.map((tk) => {
                const needStr = tk.spec.need.map((n) => n === 'cooked_patty' ? '🥩SEARED' : n === 'bun' ? '🍞BUN' : n === 'cheese' ? '🧀CHED' : '🥬GRN').join('+');
                return `<div class="mgx-chip" style="border-color:#f97316;"><b>${esc(tk.spec.name)}</b> <small>${needStr} (${Math.ceil(tk.timeLeft)}s)</small></div>`;
            }).join('');
            return `<div class="fun-panel">
                <div class="mgx-chip mgx-hot">HAND <b>${esc(heldName)}</b></div>
                <div class="mgx-chip">SERVED <b>${D.served}</b></div>
                ${D.feverT > 0 ? `<div class="mgx-chip mgx-hot">🔥 FEVER <b>${D.feverT.toFixed(1)}s</b></div>` : `<div class="mgx-chip">PESTS SLAIN <b>${S.kills}</b></div>`}
            </div>
            <div class="fun-panel" style="margin-top:4px;">${ticketHtml}</div>`;
        },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return {
                score: S.score, stars,
                title: stars >= 3 ? 'FIVE-STAR MICHELIN COMMANDER' : 'DINNER SERVICE COMPLETE',
                stats: [['VIP BURGERS SERVED', D.served], ['PESTS ELIMINATED', S.kills], ['TOPPINGS STOLEN', D.stolen]],
                xp: Math.round(170 + S.score * 0.03 + stars * 145)
            };
        }
    });

    /* =====================================================================
       12. SKY-PIRATE ZEPPELIN SIEGE
       Timber-and-Brass Sky-Galleon HMS Sovereign at 120m Altitude +
       4 Interactive Broadside Deck Cannons + Corsair Dirigibles & Iron Kraken!
    ===================================================================== */
    function oakDeckTex() {
        return L.canvasTex('sky-oak-deck-v1', 256, 256, (g, w, h) => {
            g.fillStyle = '#5c3a21'; g.fillRect(0, 0, w, h);
            for (let row = 0; row < 8; row++) {
                g.fillStyle = row % 2 ? '#6b4423' : '#4f3119';
                g.fillRect(0, row * 32 + 1, w, 30);
                g.fillStyle = '#291709';
                g.fillRect(0, row * 32, w, 2);
                const seam = ((row * 97) % 200) + 28;
                g.fillRect(seam, row * 32, 2, 32);
            }
        });
    }

    function zeppelinBalloonTex(c1, c2) {
        return L.canvasTex('zep-gasbag:' + c1 + ':' + c2, 256, 128, (g, w, h) => {
            for (let i = 0; i < 8; i++) {
                g.fillStyle = i % 2 ? c1 : c2;
                g.fillRect(0, i * 16, w, 16);
            }
            // Skull & crossbones emblem band
            g.fillStyle = 'rgba(0,0,0,0.45)';
            g.fillRect(w * 0.36, 0, w * 0.28, h);
            g.fillStyle = '#fde047';
            g.beginPath(); g.arc(w / 2, h / 2, 22, 0, TAU); g.fill();
        });
    }

    function buildBrassCannon(sideSign) {
        const root = new THREE.Group();
        const wood = std(0x451a03, 0.78);
        const brass = std(0xf59e0b, 0.25, 0.86);
        const iron = std(0x1e293b, 0.45, 0.75);

        // Stepped oak naval carriage + 4 iron wheels
        const carriage = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.42, 0.72), wood);
        carriage.position.y = 0.34; root.add(carriage);
        for (const sx of [-0.42, 0.42]) {
            for (const sz of [-0.38, 0.38]) {
                const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.10, 14), iron);
                wh.rotation.x = Math.PI / 2; wh.position.set(sx, 0.18, sz);
                root.add(wh);
            }
        }
        // Tapered Brass Barrel + Reinforcing Rings + Breech Cascabel
        const barrelG = new THREE.Group();
        barrelG.position.set(0, 0.65, 0);
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.25, 1.85, 16), brass);
        tube.rotation.z = -sideSign * Math.PI / 2;
        tube.position.x = sideSign * 0.42;
        const muzzleLip = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 8, 16), brass);
        muzzleLip.rotation.y = Math.PI / 2; muzzleLip.position.x = sideSign * 1.34;
        const breech = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), brass);
        breech.position.x = -sideSign * 0.56;
        barrelG.add(tube, muzzleLip, breech);
        root.add(barrelG);
        root.traverse((m) => { if (m.isMesh) m.castShadow = true; });
        return { root, barrelG };
    }

    function buildEnemyZeppelin(isDreadnought) {
        const sc = isDreadnought ? 1.65 : 1.0;
        const root = new THREE.Group();
        const hit = [];
        const addHit = (m, isWeak = false) => {
            m.castShadow = true;
            if (isWeak) m.userData.hitbox = 'head';
            hit.push(m);
            return m;
        };

        // Giant Ribbed Dirigible Gasbag Envelope + Tail Stabilizer Fins
        const bagMat = new THREE.MeshStandardMaterial({
            map: zeppelinBalloonTex(isDreadnought ? '#450a0a' : '#991b1b', isDreadnought ? '#1e293b' : '#b45309'),
            roughness: 0.58, metalness: 0.18
        });
        const bag = addHit(new THREE.Mesh(new THREE.SphereGeometry(4.4 * sc, 24, 16), bagMat));
        bag.scale.set(0.86, 0.78, 2.35);
        bag.position.y = 7.5 * sc;
        root.add(bag);

        for (const s of [-1, 1]) {
            const hFin = new THREE.Mesh(new THREE.BoxGeometry(2.8 * sc, 0.16 * sc, 2.6 * sc), std(0x7f1d1d, 0.6));
            hFin.position.set(s * 3.2 * sc, 7.5 * sc, -8.5 * sc);
            root.add(hFin);
        }
        const vFin = new THREE.Mesh(new THREE.BoxGeometry(0.16 * sc, 2.8 * sc, 2.8 * sc), std(0x7f1d1d, 0.6));
        vFin.position.set(0, 9.8 * sc, -8.5 * sc);
        root.add(vFin);

        // Suspension Rigging Cables + Armored Timber Gondola Hull Underneath
        for (const sx of [-1.6, 1.6]) {
            for (const sz of [-4.2, 0, 4.2]) {
                const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * sc, 0.04 * sc, 5.2 * sc, 6), std(0x94a3b8, 0.4, 0.8));
                cable.position.set(sx * sc, 4.2 * sc, sz * sc);
                root.add(cable);
            }
        }
        const hull = addHit(new THREE.Mesh(new THREE.BoxGeometry(3.4 * sc, 1.9 * sc, 11.2 * sc), std(0x451a03, 0.75)));
        hull.position.y = 1.4 * sc;
        const prow = addHit(new THREE.Mesh(new THREE.ConeGeometry(1.9 * sc, 3.2 * sc, 8), std(0x78350f, 0.7)));
        prow.rotation.x = Math.PI / 2; prow.position.set(0, 1.5 * sc, 7.1 * sc);
        root.add(hull, prow);

        // Glowing Cyan Aether-Core Weakspot Engines + Spinning Brass Propellers!
        const props = [];
        const engineCount = isDreadnought ? 3 : 2;
        for (let e = 0; e < engineCount; e++) {
            const ex = engineCount === 3 ? (e - 1) * 2.4 * sc : (e === 0 ? -2.2 * sc : 2.2 * sc);
            const ez = -2.2 * sc + (e === 1 && engineCount === 3 ? -3.5 * sc : 0);
            const pod = addHit(new THREE.Mesh(new THREE.CylinderGeometry(0.55 * sc, 0.65 * sc, 2.1 * sc, 12), std(0xf59e0b, 0.28, 0.85)), true);
            pod.rotation.x = Math.PI / 2; pod.position.set(ex, 1.8 * sc, ez);
            const aetherCore = addHit(new THREE.Mesh(new THREE.SphereGeometry(0.48 * sc, 12, 10), basic(0x38bdf8)), true);
            aetherCore.position.set(ex, 1.8 * sc, ez + 1.0 * sc);
            const propG = new THREE.Group();
            propG.position.set(ex, 1.8 * sc, ez - 1.15 * sc);
            const b1 = new THREE.Mesh(new THREE.BoxGeometry(2.1 * sc, 0.22 * sc, 0.06 * sc), std(0xfde047, 0.25, 0.88));
            const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.22 * sc, 2.1 * sc, 0.06 * sc), std(0xfde047, 0.25, 0.88));
            propG.add(b1, b2);
            props.push(propG);
            root.add(pod, aetherCore, propG);
        }

        return { root, hit, props };
    }

    MG.register({
        id: 'fun_sky_pirate', cat: 'fun', order: 12,
        name: 'Sky-Pirate Zeppelin Siege', icon: '🏴‍☠️', accent: '#38bdf8', badge: 'AIRSHIP BATTLE',
        tagline: 'Defend your flying Sky-Galleon at 120m with 4 Brass Broadside Cannons & lever-action shotgun!',
        desc: 'Command the timber-and-brass Sky-Galleon HMS Sovereign soaring high above a sunlit sea of drifting clouds! Walk the oak deck, press [E] on the 4 Brass Broadside Cannons (2 Port, 2 Starboard) to hurl explosive iron cannonballs into Crimson Corsair Dirigible Gunships, blast Cutlass Sky-Pirate Boarders swinging onto your deck with Dual Lever-Action 1887s, patch hull fires at the Carpentry Barrel [E], and sink the armored Dreadnought Flagship IRON KRAKEN!',
        guide: {
            objective: 'Keep HMS Sovereign afloat at 120m altitude! Sink 4 Corsair Dirigibles with your Broadside Cannons & gunfire to summon and destroy the Dreadnought Flagship IRON KRAKEN.',
            tips: [
                'Walk up to any of the 4 Brass Deck Cannons (2 Port Left, 2 Starboard Right) and press [E] when READY to launch a massive explosive cannonball straight into an enemy dirigible!',
                'Shooting the glowing CYAN AETHER CORES on enemy zeppelin gondolas deals 2x critical damage even with your shotgun!',
                'Eliminate Cutlass Sky-Pirate Boarders quickly before they torch your deck, and press [E] at the Midship Carpentry Barrel to extinguish hull fires and restore +18% Ship HP!'
            ]
        },
        heroLabel: 'FUN & SPECIALS • HIGH-ALTITUDE NAVAL SIEGE', duration: 180,
        stars: [2600, 4800, 7600, 10800],
        standardWeapon: 'model_1887_mw2', lockWeapon: true, infiniteMag: true, forgivingMisses: true, customMusic: true,
        weaponLabel: 'AKIMBO 1887s + 4 BRASS DECK CANNONS [E] + SALVO [Q]', weaponNote: '[E] Fire Deck Cannon / Patch Ship • [Q] FULL 4-CANNON BROADSIDE SALVO (16s)!',
        keys: [['WASD', 'Patrol Ship Deck'], ['E', 'Fire Deck Cannon / Repair Hull'], ['Q', 'Full Broadside Salvo (16s)'], ['LMB', 'Shoot Boarders & Cores']],
        map: {
            atmosphere: { skyTop: 0x0284c7, skyBottom: 0xfef3c7, fogColor: 0xbae6fd, fogDensity: 0.0045, sunColor: 0xfffbeb, sunIntensity: 1.85, sunPos: [45, 70, 30], hemiSky: 0xe0f2fe, hemiGround: 0xfde68a, hemiIntensity: 1.0 },
            boxes: [
                // Main Sky-Galleon Oak Deck + Raised Quarterdeck + Gunwale Bulwarks (stops accidental falls while leaving clear sightlines!)
                B(0, -0.6, 0, 11.4, 1.2, 30.0, 'wood'),
                B(0, 0.85, 11.5, 10.6, 1.7, 7.0, 'wood'),
                B(-5.7, 0.65, 0, 0.45, 1.3, 30.0, 'wood'),
                B(5.7, 0.65, 0, 0.45, 1.3, 30.0, 'wood'),
                B(0, 0.65, -15.0, 11.4, 1.3, 0.5, 'wood'),
                B(0, 2.2, 15.0, 10.8, 1.3, 0.5, 'wood')
            ],
            spawn: { x: 0, y: 0.1, z: 4, yaw: 0 }
        },
        countdown: 3,
        build(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.start('skypirate');
            const D = S.data;
            Object.assign(D, {
                shipHp: 100, maxShipHp: 100, cannons: [], cannonballs: [], zeppelins: [], boarders: [],
                deckFires: [], zepsSunk: 0, bossSpawned: false, bossDefeated: false,
                zepSpawnCd: 1.5, boarderCd: 4.5, repairCd: 0, salvoAllCd: 0
            });

            // Sculpt HMS Sovereign: Oak Plank Deck Overlay, Tapered Prow + Bowsprit, 2 Tall Masts + Billowing Sails, Brass Helm Wheel!
            const shipVis = new THREE.Group();
            const deckOverlay = new THREE.Mesh(new THREE.PlaneGeometry(11.0, 29.6), new THREE.MeshStandardMaterial({ map: oakDeckTex(), roughness: 0.68 }));
            deckOverlay.rotation.x = -Math.PI / 2; deckOverlay.position.y = 0.03; deckOverlay.receiveShadow = true;
            const qDeckOverlay = new THREE.Mesh(new THREE.PlaneGeometry(10.4, 6.8), new THREE.MeshStandardMaterial({ map: oakDeckTex(), roughness: 0.68 }));
            qDeckOverlay.rotation.x = -Math.PI / 2; qDeckOverlay.position.set(0, 1.72, 11.5);
            shipVis.add(deckOverlay, qDeckOverlay);

            // Tapered Bow Prow + Bowsprit Spar + Golden Eagle Figurehead
            const hullBelly = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 3.2, 30, 16, 1, false, Math.PI * 0.5, Math.PI), std(0x451a03, 0.8));
            hullBelly.rotation.x = Math.PI / 2; hullBelly.position.y = -1.2;
            const bowCone = new THREE.Mesh(new THREE.ConeGeometry(5.4, 7.5, 12), std(0x5c3a21, 0.75));
            bowCone.rotation.x = -Math.PI / 2; bowCone.position.set(0, -0.4, -18.5);
            const bowsprit = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.32, 9.5, 10), std(0x78350f, 0.7));
            bowsprit.rotation.x = -Math.PI * 0.38; bowsprit.position.set(0, 1.6, -18.8);
            const figurehead = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.6, 8), std(0xfacc15, 0.25, 0.88));
            figurehead.rotation.x = -Math.PI / 2; figurehead.position.set(0, 0.6, -21.2);
            shipVis.add(hullBelly, bowCone, bowsprit, figurehead);

            // Foremast & Mainmast + Yardarms + Curved Billowing Canvas Sails + Crow's Nests
            const sailMat = std(0xfefce8, 0.82, 0.02, { side: THREE.DoubleSide });
            for (const mz of [-6.5, 3.5]) {
                const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.38, 16.5, 14), std(0x5c3a21, 0.78));
                mast.position.set(0, 8.2, mz);
                const nest = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.75, 0.85, 14), std(0x451a03, 0.8));
                nest.position.set(0, 13.8, mz);
                const yard1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 9.8, 10), std(0x78350f, 0.75));
                yard1.rotation.z = Math.PI / 2; yard1.position.set(0, 10.8, mz);
                const yard2 = yard1.clone(); yard2.position.y = 6.2;
                // Curved billowing sail cylinder arc
                const sail = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 9.2, 16, 1, true, -0.55, 1.1), sailMat);
                sail.rotation.z = Math.PI / 2; sail.position.set(0, 8.5, mz - 2.6);
                shipVis.add(mast, nest, yard1, yard2, sail);
            }

            // Quarterdeck Brass Ship's Helm Wheel + Lanterns
            const helmPost = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.25, 12), std(0x451a03, 0.7));
            helmPost.position.set(0, 2.32, 9.4);
            const helmWheel = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.055, 8, 20), std(0xf59e0b, 0.25, 0.85));
            helmWheel.position.set(0, 2.85, 9.2);
            shipVis.add(helmPost, helmWheel);
            S.animate(() => { helmWheel.rotation.z = Math.sin(S.t * 0.9) * 0.35; });

            // Midship Carpentry Repair Barrel (z = -1.2)
            const repG = new THREE.Group();
            repG.position.set(0, 0, -1.2);
            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.42, 1.05, 16), std(0x78350f, 0.75));
            barrel.position.y = 0.52;
            const hoop1 = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.035, 6, 16), std(0xfacc15, 0.3, 0.85));
            hoop1.rotation.x = Math.PI / 2; hoop1.position.y = 0.78;
            const repLbl = labelSprite('🔨 CARPENTRY REPAIR [E]', '#4ade80', 2.4);
            repLbl.position.y = 1.65;
            repG.add(barrel, hoop1, repLbl);
            shipVis.add(repG);
            D.repairPos = V(0, 0.5, -1.2);

            const shipBanner = A.sign('⚓ SKY-GALLEON HMS SOVEREIGN — ALTITUDE 120M ⚓', 8.2, 0.95, { bg: '#0c4a6e', color: '#fde047', borderColor: '#f59e0b', size: 0.30 });
            shipBanner.position.set(0, 4.2, 14.6); shipBanner.rotation.y = Math.PI;
            shipVis.add(shipBanner);
            S.add(shipVis);

            // 4 Interactive Brass Broadside Deck Cannons (2 Port x = -4.5, 2 Starboard x = +4.5)
            const cannonSpecs = [
                { side: -1, x: -4.5, z: -7.5, name: 'PORT FORE CANNON' },
                { side: -1, x: -4.5, z: 1.5, name: 'PORT AFT CANNON' },
                { side: 1, x: 4.5, z: -7.5, name: 'STARBOARD FORE CANNON' },
                { side: 1, x: 4.5, z: 1.5, name: 'STARBOARD AFT CANNON' }
            ];
            for (const cs of cannonSpecs) {
                const cVis = buildBrassCannon(cs.side);
                cVis.root.position.set(cs.x, 0.03, cs.z);
                const lbl = labelSprite('💣 FIRE CANNON [E]', '#fde047', 2.1);
                lbl.position.set(cs.x, 1.55, cs.z);
                S.add(cVis.root); S.add(lbl);
                D.cannons.push({ side: cs.side, pos: V(cs.x, 0.5, cs.z), vis: cVis, lbl, cd: 0, recoil: 0 });
            }

            // Drifting Multi-Altitude Sea of Clouds + Distant Sky Islands!
            K.cloudLayer(S, 28, -22, 190, 0xffffff, 1.15);
            K.cloudLayer(S, 14, 38, 210, 0xfef3c7, 0.9);
            D.driftClouds = [];
            const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, transparent: true, opacity: 0.92 });
            for (let i = 0; i < 16; i++) {
                const sc = 1.6 + (i % 3) * 0.7;
                const cl = new THREE.Group();
                for (const [cx, cy, cz, cr] of [[0, 0, 0, 2.2], [-1.9, -0.3, 0.4, 1.6], [2.0, -0.2, -0.3, 1.7], [0.4, 0.6, 0.8, 1.5]]) {
                    const puff = new THREE.Mesh(new THREE.SphereGeometry(cr * sc, 12, 10), cloudMat);
                    puff.scale.set(1.25, 0.62, 1.0);
                    puff.position.set(cx * sc, cy * sc, cz * sc);
                    cl.add(puff);
                }
                cl.position.set((Math.random() - 0.5) * 160, -8 - Math.random() * 14, -100 + Math.random() * 200);
                S.add(cl);
                D.driftClouds.push(cl);
            }

            D.onKey = (e) => {
                if (MG.session !== S || MG.state !== 'running') return;
                if (e.code === 'KeyE') this._interactShip(S);
                else if (e.code === 'KeyQ' && D.salvoAllCd <= 0) {
                    D.salvoAllCd = 16.0;
                    if (BO.MinigameAudio) BO.MinigameAudio.cannonBoom();
                    MG.toast('💣 FULL 4-CANNON BROADSIDE SALVO!', '#fde047');
                    for (const c of D.cannons) {
                        c.cd = 3.6; c.recoil = 1.0;
                        const muzzle = V(c.pos.x + c.side * 1.45, 0.72, c.pos.z);
                        BO.FX.spawnExplosion(muzzle, 1.8, 0xf97316);
                        let vel = V(c.side * 44, 5.5, 0);
                        const sameSideZeps = D.zeppelins.filter((z) => z.tgt.alive && Math.sign(z.tgt.basePos.x) === c.side);
                        if (sameSideZeps.length) {
                            const zt = sameSideZeps[0].tgt.basePos.clone().add(V(0, 4.2, 0));
                            vel = zt.sub(muzzle).normalize().multiplyScalar(48);
                        }
                        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), std(0x111827, 0.35, 0.85));
                        ball.position.copy(muzzle); S.add(ball);
                        D.cannonballs.push({ mesh: ball, vel, life: 3.0 });
                    }
                }
            };
            window.addEventListener('keydown', D.onKey);
        },
        dispose(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.stop();
            if (S.data.onKey) window.removeEventListener('keydown', S.data.onKey);
        },
        _interactShip(S) {
            const D = S.data, pp = BO.Player.pos;
            // Check 4 Brass Broadside Cannons
            for (const c of D.cannons) {
                if (Math.hypot(pp.x - c.pos.x, pp.z - c.pos.z) < 2.8) {
                    if (c.cd > 0) { MG.toast(`⏳ RELOADING CANNON (${c.cd.toFixed(1)}s)...`, '#94a3b8'); return; }
                    c.cd = 3.6; c.recoil = 1.0;
                    const muzzle = V(c.pos.x + c.side * 1.45, 0.72, c.pos.z);
                    BO.FX.spawnExplosion(muzzle, 1.8, 0xf97316);
                    if (BO.MinigameAudio) BO.MinigameAudio.cannonBoom(); else { SFX.rumble(0.45); tone(150, 48, 0.32, 'sawtooth', 0.14); }

                    // Aim slightly toward nearest enemy zeppelin on that broadside if one is present!
                    let vel = V(c.side * 44, 5.5, 0);
                    const sameSideZeps = D.zeppelins.filter((z) => z.tgt.alive && Math.sign(z.tgt.basePos.x) === c.side);
                    if (sameSideZeps.length) {
                        sameSideZeps.sort((a, b) => Math.abs(a.tgt.basePos.z - c.pos.z) - Math.abs(b.tgt.basePos.z - c.pos.z));
                        const zt = sameSideZeps[0].tgt.basePos.clone().add(V(0, 4.2, 0));
                        const dir = zt.sub(muzzle).normalize();
                        vel = dir.multiplyScalar(48);
                    }
                    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), std(0x111827, 0.35, 0.85));
                    ball.position.copy(muzzle); S.add(ball);
                    D.cannonballs.push({ mesh: ball, vel, life: 3.0 });
                    return;
                }
            }
            // Check Carpentry Repair Barrel
            if (Math.hypot(pp.x - D.repairPos.x, pp.z - D.repairPos.z) < 2.8) {
                if (D.repairCd > 0) { MG.toast(`⏳ CARPENTRY SUPPLIES COOLING (${D.repairCd.toFixed(1)}s)`, '#94a3b8'); return; }
                if (D.shipHp >= 100 && D.deckFires.length === 0) { MG.toast('⚓ HULL ALREADY AT 100% INTEGRITY!', '#4ade80'); return; }
                D.repairCd = 10.0;
                D.shipHp = Math.min(100, D.shipHp + 20);
                for (const f of D.deckFires) S.scene.remove(f);
                D.deckFires.length = 0;
                tone(420, 780, 0.22, 'triangle', 0.11);
                S.award(160, D.repairPos.clone().add(V(0, 1.4, 0)), '🔨 HULL PATCHED (+20% HP)!', '#4ade80');
            }
        },
        _spawnZeppelin(S, isBoss = false) {
            const D = S.data;
            const side = isBoss ? (Math.random() < 0.5 ? -1 : 1) : (D.zeppelins.filter((z) => z.side === -1).length <= D.zeppelins.filter((z) => z.side === 1).length ? -1 : 1);
            const zVis = buildEnemyZeppelin(isBoss);
            const startPos = V(side * (isBoss ? 30 : 25), isBoss ? 2.5 : 1.0, -42);
            const maxHp = isBoss ? 68 : 20;
            const tgt = S.addTarget({
                kind: isBoss ? 'iron_kraken' : 'corsair_zeppelin',
                pos: startPos, mesh: zVis.root, hitMeshes: zVis.hit,
                hp: maxHp, life: 0, points: isBoss ? 2800 : 750, appear: 'none', death: 'burst', deathColor: 0xf97316,
                onDamage: (t, info) => {
                    if (info && info.hitbox === 'head') S.award(75, info.pt, '⚡ AETHER CORE CRIT!', '#38bdf8');
                },
                onKill: () => {
                    BO.FX.spawnExplosion(tgt.basePos.clone().add(V(0, 5, 0)), isBoss ? 9.5 : 5.5, 0xf97316);
                    SFX.rumble(0.85);
                    D.zeppelins = D.zeppelins.filter((z) => z.tgt !== tgt);
                    if (isBoss) {
                        D.bossDefeated = true;
                        MG.finish('🏴‍☠️ IRON KRAKEN SUNK — SKIES SECURED!', { color: '#fde047', delay: 2.0 });
                    } else {
                        D.zepsSunk++;
                        MG.toast(`💥 CORSAIR DIRIGIBLE SUNK (${D.zepsSunk}/4)!`, '#fde047');
                    }
                }
            });
            D.zeppelins.push({ tgt, zVis, side, isBoss, maxHp, targetZ: -8 + (Math.random() - 0.5) * 14, salvoCd: 3.5 + Math.random() * 2 });
            if (isBoss) {
                MG.toast('🚨 DREADNOUGHT FLAGSHIP "IRON KRAKEN" ALONGSIDE — MAN THE CANNONS!', '#ef4444');
                SFX.horn && SFX.horn();
            }
        },
        _spawnBoarder(S, fromSide) {
            const D = S.data;
            if (D.boarders.length >= 6) return;
            const side = fromSide || (Math.random() < 0.5 ? -1 : 1);
            const fig = F.human({
                coat: 0x991b1b, shirt: 0xfef3c7, pants: 0x1e293b, bandana: 0xdc2626,
                hat: Math.random() < 0.5 ? 'cowboy' : null, hatColor: 0x1c1917, beard: 0x1c1917, eyes: 'angry', scale: 0.98
            });
            // Sculpted steel cutlass blade in right hand!
            const cutlass = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.78), std(0xe2e8f0, 0.2, 0.92));
            cutlass.position.set(0, -0.66, 0.36); fig.parts.armR.add(cutlass);

            const landPos = V(side * 4.4, 2.8, -9 + Math.random() * 16);
            const tgt = S.addTarget({
                kind: 'sky_pirate', pos: landPos, mesh: fig.root, hitMeshes: fig.hit,
                hp: 3, life: 0, points: 220, appear: 'drop', death: 'tumble', deathColor: 0xdc2626,
                onKill: () => { D.boarders = D.boarders.filter((b) => b.tgt !== tgt); }
            });
            D.boarders.push({ tgt, fig, phase: Math.random() * 6, atkCd: 1.2 });
        },
        update(S, dt, lib, state) {
            if (state !== 'running') return;
            if (BO.MinigameAudio) BO.MinigameAudio.tick(dt);
            const D = S.data, P = BO.Player;
            D.repairCd = Math.max(0, D.repairCd - dt);
            D.salvoAllCd = Math.max(0, (D.salvoAllCd || 0) - dt);

            // Safety net if player ever leaps over bulwark into the clouds: grappling-rope hoist back onto deck!
            if (P.pos.y < -6) {
                P.pos.set(0, 1.2, 0); P.vel.set(0, 0, 0);
                P.takeDamage(12, P.pos, true);
                MG.toast('🪝 GRAPPLED BACK ABOARD HMS SOVEREIGN!', '#38bdf8');
            }

            // Stream clouds past ship bow -> stern for exhilarating 120m flight sensation!
            for (const cl of D.driftClouds) {
                cl.position.z += 16 * dt;
                if (cl.position.z > 110) cl.position.z = -110;
            }

            // Animate Brass Deck Cannons recoil & cooldown
            for (const c of D.cannons) {
                c.cd = Math.max(0, c.cd - dt);
                c.recoil = Math.max(0, c.recoil - dt * 3.2);
                c.vis.barrelG.position.x = -c.side * c.recoil * 0.35;
            }

            // Advance player-fired Iron Cannonballs & check hits against Enemy Zeppelins!
            for (let i = D.cannonballs.length - 1; i >= 0; i--) {
                const cb = D.cannonballs[i];
                cb.life -= dt;
                cb.vel.y -= 5.5 * dt;
                cb.mesh.position.addScaledVector(cb.vel, dt);
                BO.FX.spawnParticles(cb.mesh.position, 2, 0x94a3b8, 1.2, 0.5, 0.25, 0.45);
                let hitZep = false;
                for (const z of D.zeppelins) {
                    if (!z.tgt.alive) continue;
                    const zCenter = z.tgt.basePos.clone().add(V(0, 4.8 * (z.isBoss ? 1.5 : 1), 0));
                    if (cb.mesh.position.distanceTo(zCenter) < (z.isBoss ? 9.5 : 6.4)) {
                        BO.FX.spawnExplosion(cb.mesh.position.clone(), 4.5, 0xfacc15);
                        SFX.rumble(0.55);
                        S.award(240, cb.mesh.position.clone(), '💣 BROADSIDE DIRECT HIT!', '#fde047');
                        z.tgt.hp -= 9;
                        if (z.tgt.hp <= 0) { S.kills++; S.bumpCombo(); z.tgt.kill({ pt: cb.mesh.position }); }
                        hitZep = true; break;
                    }
                }
                if (hitZep || cb.life <= 0) {
                    S.scene.remove(cb.mesh); D.cannonballs.splice(i, 1);
                }
            }

            // Spawn Corsair Dirigibles & trigger IRON KRAKEN Dreadnought once 4 Corsairs are sunk!
            if (!D.bossSpawned && D.zepsSunk >= 4) {
                D.bossSpawned = true;
                this._spawnZeppelin(S, true);
            } else if (!D.bossSpawned) {
                D.zepSpawnCd -= dt;
                if (D.zepSpawnCd <= 0 && D.zeppelins.length < 2) {
                    D.zepSpawnCd = 8.5;
                    this._spawnZeppelin(S, false);
                }
            }

            // Update Enemy Zeppelins (cruise alongside broadside, spin propellers, fire cannon salvos)
            for (const z of D.zeppelins) {
                if (!z.tgt.alive) continue;
                z.tgt.basePos.z = lerp(z.tgt.basePos.z, z.targetZ, dt * 0.55);
                z.tgt.basePos.y = (z.isBoss ? 2.5 : 1.0) + Math.sin(S.t * 1.4 + z.side) * 0.75;
                z.tgt.root.position.copy(z.tgt.basePos);
                for (const pr of z.zVis.props) pr.rotation.z += dt * 20;

                z.salvoCd -= dt;
                if (z.salvoCd <= 0) {
                    z.salvoCd = z.isBoss ? 3.8 : 5.6;
                    const hitDeck = V((Math.random() - 0.5) * 7.5, 0.2, -9 + Math.random() * 18);
                    BO.FX.spawnTracer(z.tgt.basePos.clone().add(V(0, 1.8, 0)), hitDeck, 0xf97316, 0.25, 0.18);
                    BO.FX.spawnExplosion(hitDeck, 2.2, 0xf97316);
                    D.shipHp = Math.max(0, D.shipHp - (z.isBoss ? 7 : 4));
                    if (D.deckFires.length < 4 && Math.random() < 0.55) {
                        const torch = A.torch(S, hitDeck, 0xf97316, false);
                        S.add(torch);
                        D.deckFires.push(torch);
                    }
                    this._spawnBoarder(S, z.side);
                }
            }

            // Extra periodic Pirate Boarder swing-ins & Cutlass melee AI
            D.boarderCd -= dt;
            if (D.boarderCd <= 0) { D.boarderCd = 6.2; if (D.zeppelins.length > 0) this._spawnBoarder(S); }
            for (const b of D.boarders) {
                if (!b.tgt.alive) continue;
                b.phase += dt * 8.5;
                if (b.tgt.basePos.y > 0.05) b.tgt.basePos.y = Math.max(0.03, b.tgt.basePos.y - 9.5 * dt);
                const dx = P.pos.x - b.tgt.basePos.x, dz = P.pos.z - b.tgt.basePos.z;
                const dist = Math.max(0.1, Math.hypot(dx, dz));
                b.tgt.root.rotation.y = Math.atan2(dx, dz);
                if (dist > 1.5) {
                    b.tgt.basePos.x += (dx / dist) * 3.5 * dt;
                    b.tgt.basePos.z += (dz / dist) * 3.5 * dt;
                } else {
                    b.atkCd -= dt;
                    if (b.atkCd <= 0) {
                        b.atkCd = 1.25;
                        P.takeDamage(10, b.tgt.basePos, true);
                        D.shipHp = Math.max(0, D.shipHp - 2);
                    }
                }
                b.tgt.root.position.copy(b.tgt.basePos);
                F.walk(b.fig, b.phase, 1, true);
                b.fig.parts.armR.rotation.x = -1.1 + Math.sin(b.phase * 2.2) * 0.55;
            }

            // Hull burn tick if deck fires left unpatched
            if (D.deckFires.length > 0) D.shipHp = Math.max(0, D.shipHp - D.deckFires.length * 0.45 * dt);

            if (BO.HUD && BO.HUD.showPrompt) {
                let msg = '';
                for (const c of D.cannons) {
                    if (Math.hypot(P.pos.x - c.pos.x, P.pos.z - c.pos.z) < 2.8) {
                        msg = c.cd <= 0 ? `💣 [E] FIRE ${c.side < 0 ? 'PORT' : 'STARBOARD'} BROADSIDE CANNON!` : `⏳ CANNON RELOADING (${c.cd.toFixed(1)}s)`;
                    }
                }
                if (!msg && Math.hypot(P.pos.x - D.repairPos.x, P.pos.z - D.repairPos.z) < 2.8) {
                    msg = D.repairCd <= 0 ? '🔨 [E] PATCH HULL & DOUSE FIRES (+20% SHIP HP)' : `⏳ CARPENTRY COOLDOWN (${D.repairCd.toFixed(1)}s)`;
                }
                if (msg) BO.HUD.showPrompt(msg);
            }

            if (D.shipHp <= 0) MG.finish('HMS SOVEREIGN SUNK IN THE CLOUDS', { color: '#f87171' });
            else if (!P.alive) MG.finish('CAPTAIN FELLED BY SKY-PIRATES', { color: '#f87171' });
        },
        hud(S) {
            const D = S.data;
            const boss = D.zeppelins.find((z) => z.isBoss && z.tgt.alive);
            return `<div class="fun-panel">
                <div class="mgx-chip ${D.shipHp < 35 ? 'mgx-hot' : ''}">⚓ SHIP HULL <b>${Math.ceil(D.shipHp)}%</b></div>
                <div class="mgx-chip">CORSAIRS SUNK <b>${D.zepsSunk} / 4</b></div>
                <div class="mgx-chip ${(D.salvoAllCd || 0) <= 0 ? 'mgx-hot' : ''}">SALVO [Q] <b>${(D.salvoAllCd || 0) <= 0 ? 'READY' : D.salvoAllCd.toFixed(0) + 's'}</b></div>
                <div class="mgx-chip">DECK FIRES <b>${D.deckFires.length}</b></div>
                <div class="mgx-chip">REPAIR [E] <b>${D.repairCd <= 0 ? 'READY' : D.repairCd.toFixed(0) + 's'}</b></div>
            </div>
            ${boss ? `<div class="fun-panel" style="margin-top:5px;"><div class="fun-bar-wrap"><div class="fun-bar-lbl"><span>🏴‍☠️ DREADNOUGHT: IRON KRAKEN</span><b>${Math.max(0, Math.round(boss.tgt.hp))} / ${boss.maxHp}</b></div><div class="fun-bar"><i style="width:${Math.max(0, Math.round(boss.tgt.hp / boss.maxHp * 100))}%;background:linear-gradient(90deg,#ef4444,#38bdf8)"></i></div></div></div>` : ''}`;
        },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return {
                score: S.score, stars,
                title: D.bossDefeated ? 'ADMIRAL OF THE HIGH SKIES' : 'SKY SIEGE CONCLUDED',
                stats: [['CORSAIR ZEPPELINS SUNK', D.zepsSunk], ['IRON KRAKEN FLAGSHIP', D.bossDefeated ? 'SUNK' : D.bossSpawned ? 'SURVIVED' : 'NOT REACHED'], ['FINAL HULL INTEGRITY', Math.ceil(D.shipHp) + '%']],
                xp: Math.round(185 + S.score * 0.032 + stars * 155)
            };
        }
    });
})(window);
