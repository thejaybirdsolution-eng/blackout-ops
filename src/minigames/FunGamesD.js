/* ============================================================================
   BLACKOUT OPS — MINIGAMES: FUN & SPECIALS FLAGSHIP BATCH 1A (Modes 8–9)
     8. Midnight Toyshop Prop Hunt — 44 multi-part antique/toy props inside a
        warm string-lit Grand Emporium; 10 sneaking Poltergeist Mimics sprout
        legs & googly eyes when tagged, with Sonar Ping [E] & Decoy Bell [Q].
     9. Kaiju vs. Mecha Metropolis — First-person 18m Obsidian Kaiju with
        animated 3D Claws, Atomic Plasma Breath [LMB], Twin Claw Cleave [RMB/V],
        Tectonic Belly-Stomp [SPACE], Nuclear Pulse [Q], progressive skyscraper
        demolition, JSDF Tanks & Choppers, and MECHA-TITAN MK-IX Boss Finale!
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const L = BO.MinigameLib;
    const A = BO.MinigameArt;
    const K = BO.MGCourseKit;
    const { B, SFX, std, basic, TAU, clamp01, esc } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const lerp = (a, b, t) => a + (b - a) * t;

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

    /* =====================================================================
       8. MIDNIGHT TOYSHOP PROP HUNT
       Cozy, Classic-Whack-grade Grand Toy & Antique Emporium with 6 sculpted
       multi-part prop families, sneaking mimics, Sonar Ping & Decoy Bell!
    ===================================================================== */
    function toyshopFloorTex() {
        return L.canvasTex('toyshop-parquet-v2', 256, 256, (g, w, h) => {
            g.fillStyle = '#5c3a21'; g.fillRect(0, 0, w, h);
            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                    const warm = (x + y) % 2 === 0;
                    g.fillStyle = warm ? '#6e472b' : '#4a2e19';
                    g.fillRect(x * 32 + 1, y * 32 + 1, 30, 30);
                    g.strokeStyle = 'rgba(255,220,160,0.08)'; g.lineWidth = 1;
                    for (let k = 4; k < 30; k += 6) {
                        g.beginPath();
                        if (warm) { g.moveTo(x * 32 + 2, y * 32 + k); g.lineTo(x * 32 + 30, y * 32 + k); }
                        else { g.moveTo(x * 32 + k, y * 32 + 2); g.lineTo(x * 32 + k, y * 32 + 30); }
                        g.stroke();
                    }
                }
            }
        });
    }

    function wallpaperTex() {
        return L.canvasTex('toyshop-wall-v2', 256, 256, (g, w, h) => {
            g.fillStyle = '#3b0a1e'; g.fillRect(0, 0, w, h);
            for (let i = 0; i < 8; i++) {
                g.fillStyle = i % 2 ? '#4c0519' : '#581c3c';
                g.fillRect(i * 32, 0, 32, h);
                g.fillStyle = 'rgba(250, 204, 21, 0.16)';
                for (let y = 16; y < h; y += 32) {
                    g.beginPath(); g.arc(i * 32 + 16, y, 4, 0, TAU); g.fill();
                }
            }
            g.fillStyle = '#78350f'; g.fillRect(0, h - 54, w, 54);
            g.fillStyle = '#d97706'; g.fillRect(0, h - 58, w, 5);
        });
    }

    function arcadeScreenTex(colHex) {
        return L.canvasTex('toy-crt:' + colHex, 128, 128, (g, w, h) => {
            g.fillStyle = '#090d16'; g.fillRect(0, 0, w, h);
            g.strokeStyle = colHex; g.lineWidth = 3; g.strokeRect(8, 8, w - 16, h - 16);
            g.fillStyle = colHex;
            for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) g.fillRect(20 + c * 18, 22 + r * 14, 12, 8);
            g.fillStyle = '#fde047'; g.fillRect(54, 96, 20, 10);
            g.fillStyle = 'rgba(255,255,255,0.08)';
            for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1);
        });
    }

    function giftWrapTex(c1, c2) {
        return L.canvasTex('gift:' + c1 + ':' + c2, 128, 128, (g, w, h) => {
            g.fillStyle = c1; g.fillRect(0, 0, w, h);
            g.fillStyle = c2;
            for (let i = -h; i < w + h; i += 24) {
                g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 10, 0); g.lineTo(i - h + 10, h); g.lineTo(i - h, h); g.closePath(); g.fill();
            }
            g.fillStyle = '#fde047';
            g.fillRect(w / 2 - 9, 0, 18, h); g.fillRect(0, h / 2 - 9, w, 18);
        });
    }

    // Build 1 of 6 multi-part sculpted Toyshop Props + hidden Mimic eyes/legs!
    function buildToyProp(kindIdx, variant) {
        const root = new THREE.Group();
        const body = new THREE.Group();
        root.add(body);
        const hit = [];
        const addHit = (m) => { m.castShadow = true; m.receiveShadow = true; body.add(m); hit.push(m); return m; };
        const addDeco = (m, parent = body) => { m.castShadow = true; parent.add(m); return m; };

        const chrome = std(0xe2e8f0, 0.2, 0.88);
        const brass = std(0xf59e0b, 0.28, 0.82);
        const darkWood = std(0x451a03, 0.78, 0.08);
        let height = 1.4, label = 'Prop';

        if (kindIdx === 0) {
            // 1. VINTAGE GUMBALL MACHINE (pedestal + cast-iron body + glass globe + 12 colorful gumballs + cap)
            label = 'Gumball Dispenser'; height = 1.55;
            const foot = addHit(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.40, 0.10, 20), chrome)); foot.position.y = 0.05;
            const stem = addHit(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.62, 14), chrome)); stem.position.y = 0.40;
            const baseCol = [0xdc2626, 0x2563eb, 0x16a34a][variant % 3];
            const hopper = addHit(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.34, 18), std(baseCol, 0.32, 0.35))); hopper.position.y = 0.86;
            const chute = addDeco(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.12), chrome)); chute.position.set(0, 0.82, 0.24);
            const globe = addHit(new THREE.Mesh(new THREE.SphereGeometry(0.33, 20, 16), new THREE.MeshStandardMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.36, roughness: 0.06, metalness: 0.1 })));
            globe.position.y = 1.28;
            const gCols = [0xef4444, 0xfacc15, 0x3b82f6, 0x22c55e, 0xec4899, 0xa855f7];
            for (let i = 0; i < 12; i++) {
                const a = (i / 12) * TAU, r = 0.12 + (i % 2) * 0.08;
                const gb = addDeco(new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), std(gCols[i % gCols.length], 0.25)));
                gb.position.set(Math.cos(a) * r, 1.13 + Math.floor(i / 6) * 0.11, Math.sin(a) * r);
            }
            const cap = addDeco(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 0.10, 16), brass)); cap.position.y = 1.60;
        } else if (kindIdx === 1) {
            // 2. MINIATURE RETRO ARCADE CABINET (wood side panels, glowing pixel CRT, marquee, joystick & buttons)
            label = 'Mini Arcade Cab'; height = 1.72;
            const cabCol = [0x1e1b4b, 0x7f1d1d, 0x064e3b][variant % 3];
            const neon = ['#22d3ee', '#f472b6', '#4ade80'][variant % 3];
            const lower = addHit(new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.88, 0.68), std(cabCol, 0.55, 0.15))); lower.position.y = 0.44;
            const upper = addHit(new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.72, 0.56), std(cabCol, 0.55, 0.15))); upper.position.set(0, 1.24, -0.05);
            const deck = addHit(new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.10, 0.34), std(0x18181b, 0.4))); deck.position.set(0, 0.90, 0.20); deck.rotation.x = 0.2;
            const scr = addDeco(new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.48), new THREE.MeshBasicMaterial({ map: arcadeScreenTex(neon) })));
            scr.position.set(0, 1.22, 0.24); scr.rotation.x = -0.14;
            const mq = addDeco(new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.18, 0.12), basic(parseInt(neon.slice(1), 16)))); mq.position.set(0, 1.62, 0.18);
            const stick = addDeco(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.11, 6), chrome)); stick.position.set(-0.18, 0.98, 0.22);
            const ball = addDeco(new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 6), basic(0xef4444))); ball.position.set(-0.18, 1.04, 0.22);
            for (let b = 0; b < 3; b++) {
                const btn = addDeco(new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.03, 8), basic(b === 0 ? 0xfacc15 : 0x22d3ee)));
                btn.position.set(0.05 + b * 0.09, 0.96, 0.22);
            }
        } else if (kindIdx === 2) {
            // 3. WOODEN NUTCRACKER SOLDIER (boots, legs, gold-buttoned red tunic, head, beard, tall bearskin shako)
            label = 'Nutcracker Guard'; height = 1.78;
            const plinth = addHit(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.10, 16), brass)); plinth.position.y = 0.05;
            for (const sx of [-0.11, 0.11]) {
                const boot = addHit(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.10, 0.42, 10), std(0x18181b, 0.4))); boot.position.set(sx, 0.30, 0);
            }
            const coat = addHit(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.56, 14), std(variant % 2 ? 0xdc2626 : 0x1d4ed8, 0.45))); coat.position.y = 0.78;
            for (let b = 0; b < 3; b++) {
                const btn = addDeco(new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 6), brass)); btn.position.set(0, 0.64 + b * 0.13, 0.23);
            }
            for (const sx of [-0.28, 0.28]) {
                const arm = addDeco(new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.46, 10), std(0xdc2626, 0.5))); arm.position.set(sx, 0.80, 0);
                const ep = addDeco(new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), brass)); ep.position.set(sx, 1.03, 0);
            }
            const head = addHit(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.17, 0.28, 14), std(0xf4c5a2, 0.65))); head.position.y = 1.20;
            const beard = addDeco(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.08), std(0xf8fafc, 0.9))); beard.position.set(0, 1.09, 0.15);
            const shako = addHit(new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.19, 0.38, 14), std(0x18181b, 0.85))); shako.position.y = 1.52;
            const plume = addDeco(new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), basic(0xfacc15))); plume.scale.y = 1.6; plume.position.set(0, 1.76, 0.16);
        } else if (kindIdx === 3) {
            // 4. BRASS GRAMOPHONE ON PEDESTAL (fluted column, mahogany music box, vinyl disc, golden morning-glory horn)
            label = 'Brass Gramophone'; height = 1.62;
            const ped = addHit(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.72, 16), darkWood)); ped.position.y = 0.36;
            const box = addHit(new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.22, 0.56), std(0x78350f, 0.55))); box.position.y = 0.83;
            const disc = addDeco(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 18), std(0x111827, 0.25, 0.4))); disc.position.y = 0.95;
            const neck = addDeco(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.34, 10), brass)); neck.position.set(0, 1.12, -0.14); neck.rotation.x = 0.35;
            const horn = addHit(new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.52, 18, 1, true), new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.22, metalness: 0.88, side: THREE.DoubleSide })));
            horn.position.set(0, 1.38, 0.06); horn.rotation.x = -Math.PI * 0.38;
        } else if (kindIdx === 4) {
            // 5. STACKED RIBBON GIFT TOWER (3 wrapped presents at jaunty angles + 3D golden bow loops)
            label = 'Gift Box Stack'; height = 1.48;
            const wraps = [['#dc2626', '#fef2f2'], ['#2563eb', '#dbeafe'], ['#16a34a', '#dcfce7']];
            const b1 = addHit(new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.50, 0.72), new THREE.MeshStandardMaterial({ map: giftWrapTex(...wraps[variant % 3]), roughness: 0.55 })));
            b1.position.y = 0.25;
            const b2 = addHit(new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.42, 0.54), new THREE.MeshStandardMaterial({ map: giftWrapTex(...wraps[(variant + 1) % 3]), roughness: 0.55 })));
            b2.position.y = 0.71; b2.rotation.y = 0.38;
            const b3 = addHit(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.34, 0.38), new THREE.MeshStandardMaterial({ map: giftWrapTex(...wraps[(variant + 2) % 3]), roughness: 0.55 })));
            b3.position.y = 1.09; b3.rotation.y = -0.32;
            for (const a of [0, Math.PI / 2]) {
                const loop = addDeco(new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.028, 6, 14), basic(0xfacc15)));
                loop.position.y = 1.32; loop.rotation.y = a;
            }
        } else {
            // 6. GRANDFATHER CHIME CLOCK MINIATURE (mahogany case, brass clockface with hands, glass door & pendulum)
            label = 'Chime Clock'; height = 1.82;
            const base = addHit(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.34, 0.42), darkWood)); base.position.y = 0.17;
            const trunk = addHit(new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.88, 0.34), darkWood)); trunk.position.y = 0.78;
            const hood = addHit(new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.52, 0.40), darkWood)); hood.position.y = 1.48;
            const dialTex = L.canvasTex('clock-dial', 128, 128, (g, w, h) => {
                g.fillStyle = '#fef3c7'; g.beginPath(); g.arc(64, 64, 58, 0, TAU); g.fill();
                g.strokeStyle = '#78350f'; g.lineWidth = 5; g.stroke();
                g.fillStyle = '#1c1917';
                for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; g.fillRect(64 + Math.cos(a) * 46 - 2, 64 + Math.sin(a) * 46 - 2, 4, 4); }
                g.strokeStyle = '#1c1917'; g.lineWidth = 4; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 28); g.moveTo(64, 64); g.lineTo(90, 64); g.stroke();
            });
            const dial = addDeco(new THREE.Mesh(new THREE.CircleGeometry(0.20, 20), new THREE.MeshBasicMaterial({ map: dialTex })));
            dial.position.set(0, 1.48, 0.21);
            const bob = addDeco(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 14), brass));
            bob.rotation.x = Math.PI / 2; bob.position.set(0, 0.74, 0.18);
        }

        // Hidden Mimic Anatomy (sprouts Googly Eyes + Ghost Feet when startled/wounded!)
        const mimicRig = new THREE.Group();
        mimicRig.visible = false;
        for (const sx of [-0.15, 0.15]) {
            const white = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 8), basic(0xffffff));
            white.position.set(sx, height * 0.72, 0.30);
            const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 6), basic(0x090d16));
            pupil.position.set(sx, height * 0.72, 0.38);
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.28, 8), basic(0xec4899));
            leg.position.set(sx * 1.1, 0.14, 0);
            mimicRig.add(white, pupil, leg);
        }
        const aura = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.62, 20), basic(0xf472b6, { side: THREE.DoubleSide }));
        aura.rotation.x = -Math.PI / 2; aura.position.y = 0.03;
        mimicRig.add(aura);
        root.add(mimicRig);

        return { root, body, hit, mimicRig, height, label };
    }

    MG.register({
        id: 'fun_prophunt', cat: 'fun', order: 8, name: 'Midnight Toyshop Prop Hunt', icon: '🧸', accent: '#ec4899', badge: 'SLEUTH',
        tagline: '10 Poltergeist Mimics hide among 44 handcrafted toys! Ping [E], Ring Decoy Bell [Q] & bust them!',
        desc: 'Step inside Barnaby\'s Grand Toy & Antique Emporium at midnight! Among 44 sculpted gumball dispensers, retro arcade cabs, nutcrackers, brass gramophones, gift stacks, and chime clocks hide 10 mischievous Poltergeist Mimics. Listen for musical giggles, watch them tiptoe when your back is turned, fire Sonar Pings ([E]) & Decoy Bells ([Q]), and chase down fleeing googly-eyed mimics!',
        heroLabel: 'FUN • POLTERGEIST TOYSHOP HUNT', duration: 165, stars: [2400, 4800, 7600, 11000],
        standardWeapon: 'spas12_tac', lockWeapon: true, infiniteMag: true, customMusic: true,
        weaponLabel: 'ECTO-BREACHER SPAS-12', weaponNote: 'Mimics take 2 hits • [E] Sonar • [Q] Decoy Bell • [R] Flashbulb Stun',
        keys: [['WASD', 'Patrol Emporium'], ['LMB', 'Check / Bust Prop'], ['E', 'Sonar Ping (8s)'], ['Q', 'Decoy Bell (12s)'], ['R', 'Flashbulb Stun (10s)']],
        guide: {
            objective: 'Find and bust all 10 Poltergeist Mimics disguised among 44 handcrafted antique & toyshop props before midnight ends.',
            tips: [
                'Mimics subtly tiptoe to new spots when you look away and emit soft musical chimes every few seconds!',
                'Press [E] Sonar Ping to count how many Mimics are within 11m and make them shiver briefly.',
                'Toss a [Q] Decoy Bell onto an aisle—any Mimic within 9m cannot resist hopping and whistling! First shotgun hit reveals its googly eyes & legs; second hit busts it!'
            ]
        },
        map: {
            atmosphere: { skyTop: 0x0f0716, skyBottom: 0x2e1025, fogColor: 0x1c0d1a, fogDensity: 0.011, sunColor: 0xffedd5, sunIntensity: 0.9, sunPos: [6, 30, 10], hemiSky: 0xfde68a, hemiGround: 0x3b1d14, hemiIntensity: 0.95 },
            boxes: [B(0, -0.5, -6, 48, 1, 48, 'wood_plank')],
            spawn: { x: 0, y: 0, z: 13.5, yaw: 0 }
        },
        build(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.start('toyshop');
            // Parquet Floor + Velvet Rug Runners
            const floorTex = toyshopFloorTex();
            floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(8, 8);
            const floor = new THREE.Mesh(new THREE.PlaneGeometry(42, 42), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.72 }));
            floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.01, -4); floor.receiveShadow = true; S.add(floor);

            // Grand Spinning Brass Toy Carousel Centerpiece!
            const carG = new THREE.Group(); carG.position.set(0, 0, -6.5);
            const cDeck = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 0.36, 20), std(0x78350f, 0.55)); cDeck.position.y = 0.18;
            const cCore = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 3.6, 14), std(0xfacc15, 0.25, 0.85)); cCore.position.y = 2.0;
            const cRoof = new THREE.Mesh(new THREE.ConeGeometry(2.85, 1.45, 16), std(0xbe123c, 0.6)); cRoof.position.y = 4.4;
            const cTrim = new THREE.Mesh(new THREE.TorusGeometry(2.75, 0.10, 8, 24), basic(0xfde047)); cTrim.rotation.x = Math.PI / 2; cTrim.position.y = 3.68;
            carG.add(cDeck, cCore, cRoof, cTrim);
            const horseCols = [0xf8fafc, 0xf472b6, 0x38bdf8, 0xfacc15, 0xa78bfa, 0x4ade80];
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * TAU, r = 1.95;
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.3, 6), std(0xfacc15, 0.25, 0.85));
                pole.position.set(Math.cos(a) * r, 2.0, Math.sin(a) * r);
                const hBody = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.78), std(horseCols[i], 0.45));
                hBody.position.set(Math.cos(a) * r, 1.3 + (i % 2) * 0.35, Math.sin(a) * r); hBody.rotation.y = -a;
                carG.add(pole, hBody);
            }
            S.add(carG); S.data.carousel = carG;
            S.collider(-2.6, 0, -9.1, 2.6, 3.8, -3.9);

            const rug = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 34), std(0x9f1239, 0.9));
            rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.02, -4); S.add(rug);
            const rugTrim = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 34.4), std(0xfacc15, 0.5, 0.4));
            rugTrim.rotation.x = -Math.PI / 2; rugTrim.position.set(0, 0.015, -4); S.add(rugTrim);

            // Striped Wallpaper Emporium Walls + Ceiling Beams
            const wTex = wallpaperTex(); wTex.wrapS = THREE.RepeatWrapping; wTex.repeat.set(6, 1);
            const wallMat = new THREE.MeshStandardMaterial({ map: wTex, roughness: 0.82 });
            S.box(0, 4.0, -24.5, 42, 8.0, 0.8, wallMat, { solid: true });
            S.box(0, 4.0, 16.5, 42, 8.0, 0.8, wallMat, { solid: true });
            S.box(-20.5, 4.0, -4, 0.8, 8.0, 42, wallMat, { solid: true });
            S.box(20.5, 4.0, -4, 0.8, 8.0, 42, wallMat, { solid: true });
            const ceil = new THREE.Mesh(new THREE.PlaneGeometry(42, 42), std(0x29150e, 0.9));
            ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 8.0, -4); S.add(ceil);

            // Chasing Carnival Marquee Sign + Sagging Edison String Lights across the Emporium!
            const sign = A.sign("BARNABY'S MIDNIGHT TOY EMPORIUM", 10.5, 1.25, { bg: '#4c0519', color: '#fde68a', borderColor: '#facc15', size: 0.38, glow: '#f472b6' });
            sign.position.set(0, 5.8, -23.9); S.add(sign);
            const bulbPts = [];
            for (const z of [-18, -10, -2, 6, 12]) {
                bulbPts.push(...A.sagPoints(V(-19.5, 6.8, z), V(0, 6.1, z), 10, 0.45));
                bulbPts.push(...A.sagPoints(V(0, 6.1, z), V(19.5, 6.8, z), 10, 0.45));
            }
            const lights = A.bulbs(bulbPts, [0xfde047, 0xf472b6, 0x38bdf8, 0x4ade80, 0xfb923c], 0.08);
            S.add(lights); A.animateBulbs(S, lights, 4, 'chase');
            if (BO.Settings.getQualityPreset().pointLights) {
                for (const [lx, lz, col] of [[0, -14, 0xffd8a8], [-11, -2, 0xf9a8d4], [11, -2, 0x93c5fd]]) {
                    const pl = new THREE.PointLight(col, 1.25, 24, 1.5); pl.position.set(lx, 6.2, lz); S.add(pl);
                }
            }

            // Wooden Display Islands & Plush Toy Shelves along walls
            const counterM = std(0x5c3419, 0.72), velvetM = std(0x881337, 0.88);
            for (const [ix, iz, w, d] of [[-9.5, -13, 5.5, 2.4], [9.5, -13, 5.5, 2.4], [-9.5, 1, 5.5, 2.4], [9.5, 1, 5.5, 2.4], [0, -20.5, 8.0, 2.0]]) {
                S.box(ix, 0.50, iz, w, 1.0, d, counterM, { solid: true });
                const top = new THREE.Mesh(new THREE.BoxGeometry(w + 0.16, 0.08, d + 0.16), velvetM);
                top.position.set(ix, 1.02, iz); S.add(top);
            }
            // Wall plush bear shelves for authentic Classic-Whack charm
            const plushCols = [0xf472b6, 0x60a5fa, 0xfacc15, 0xa78bfa, 0x4ade80];
            for (const side of [-1, 1]) {
                for (let sh = 0; sh < 2; sh++) {
                    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.09, 18), counterM);
                    plank.position.set(side * 19.8, 2.2 + sh * 1.45, -4); S.add(plank);
                    for (let p = 0; p < 8; p++) {
                        const bear = new THREE.Group(), col = plushCols[(p + sh) % plushCols.length];
                        const bb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), std(col, 0.92));
                        const bh = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), std(col, 0.92)); bh.position.y = 0.31;
                        bear.add(bb, bh);
                        bear.position.set(side * 19.7, 2.48 + sh * 1.45, -11.5 + p * 2.2);
                        S.add(bear);
                    }
                }
            }

            // Spawn 44 Handcrafted Props across the floor — 10 are live Poltergeist Mimics!
            const spots = [];
            for (let gx = -16; gx <= 16; gx += 4.5) {
                for (let gz = -18; gz <= 9; gz += 4.5) {
                    if (Math.abs(gx) < 2.6 && gz > 7) continue; // keep spawn clear
                    if (Math.abs(Math.abs(gx) - 9.5) < 3.4 && (Math.abs(gz + 13) < 2.0 || Math.abs(gz - 1) < 2.0)) continue; // avoid counters
                    spots.push([gx + (Math.random() - 0.5) * 1.6, gz + (Math.random() - 0.5) * 1.6]);
                }
            }
            spots.sort(() => Math.random() - 0.5);
            const chosen = spots.slice(0, 44);
            const mimicSet = new Set();
            while (mimicSet.size < 10) mimicSet.add(Math.floor(Math.random() * chosen.length));
            const goldenIdx = [...mimicSet][0];

            S.data.props = chosen.map(([px, pz], idx) => {
                const isMimic = mimicSet.has(idx), isGolden = idx === goldenIdx;
                const art = buildToyProp(idx % 6, idx);
                if (isGolden) {
                    const gHalo = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.54, 18), basic(0xfde047, { side: THREE.DoubleSide, transparent: true, opacity: 0.55 }));
                    gHalo.rotation.x = -Math.PI / 2; gHalo.position.y = 0.04; art.root.add(gHalo);
                }
                const yaw = Math.floor(Math.random() * 4) * (Math.PI / 2) + (Math.random() - 0.5) * 0.35;
                const tg = S.addTarget({
                    mesh: art.root, hitMeshes: art.hit, pos: V(px, 0, pz), yaw, life: 0,
                    appear: 'scale', inT: 0.2, death: isMimic ? 'burst' : 'shatter',
                    deathColor: isGolden ? 0xfacc15 : isMimic ? 0xf472b6 : 0x92400e, bonus: true
                });
                return Object.assign(tg, {
                    isToyProp: true, isMimic, isGolden, art, exposed: false, hpLeft: isMimic ? 2 : 1, stunT: 0,
                    giggleT: 3 + Math.random() * 7, hopT: 0, fleeDir: V(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
                    sneakVx: 0, sneakVz: 0, sneakT: 2 + Math.random() * 4
                });
            });

            Object.assign(S.data, { mimicsLeft: 10, falseShots: 0, sonarCd: 0, bellCd: 0, flashCd: 0, bells: [], pings: 0 });
            BO.Player.maxHp = 120; BO.Player.hp = 120;
        },
        dispose() { if (BO.MinigameAudio) BO.MinigameAudio.stop(); },
        onKey(S, code) {
            const D = S.data, P = BO.Player;
            if (MG.state !== 'running') return false;
            if (code === 'KeyE' && D.sonarCd <= 0) {
                D.sonarCd = 8.0; D.pings++;
                if (BO.MinigameAudio) BO.MinigameAudio.toySonar(); else tone(520, 1240, 0.28, 'sine', 0.11);
                const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.75, 32), basic(0x22d3ee, { transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
                ring.rotation.x = -Math.PI / 2; ring.position.set(P.pos.x, 0.08, P.pos.z); S.add(ring);
                let rt = 0; S.animate((dt) => { rt += dt; ring.scale.setScalar(1 + rt * 22); ring.material.opacity = Math.max(0, 0.85 - rt * 1.1); if (rt > 0.75) { S.scene.remove(ring); return false; } });
                let near = 0, closest = Infinity;
                for (const p of D.props) {
                    if (!p.alive || !p.isMimic) continue;
                    const dist = p.root.position.distanceTo(P.pos);
                    if (dist < closest) closest = dist;
                    if (dist <= 12) { near++; p.hopT = Math.max(p.hopT, 1.3); }
                }
                MG.toast(near > 0 ? `📡 SONAR: ${near} MIMIC${near > 1 ? 'S' : ''} WITHIN 12m (NEAREST ${Math.round(closest)}m)!` : `📡 CLEAR WITHIN 12m • NEAREST MIMIC ~${Math.round(closest)}m`, near > 0 ? '#22d3ee' : '#cbd5e1');
                return true;
            }
            if (code === 'KeyR' && D.flashCd <= 0) {
                D.flashCd = 10.0;
                const cam = BO.App.worldCamera, dir = new THREE.Vector3(); cam.getWorldDirection(dir);
                const flashPos = cam.position.clone().addScaledVector(dir, 5);
                BO.FX.spawnExplosion(flashPos, 4.5, 0xfef08a);
                SFX.ding(1.7);
                let stunned = 0;
                for (const p of D.props) {
                    if (p.alive && p.isMimic && p.root.position.distanceTo(P.pos) <= 13) {
                        p.stunT = 2.6; p.hopT = Math.max(p.hopT, 1.2); stunned++;
                    }
                }
                MG.toast(stunned ? `📸 FLASHBULB STUNNED ${stunned} MIMIC${stunned > 1 ? 'S' : ''} (2.6s)!` : '📸 FLASHBULB FIRED!', '#fde047');
                return true;
            }
            if (code === 'KeyQ' && D.bellCd <= 0) {
                D.bellCd = 12.0;
                if (BO.MinigameAudio) BO.MinigameAudio.toyBell();
                const cam = BO.App.worldCamera, dir = new THREE.Vector3(); cam.getWorldDirection(dir);
                const bell = new THREE.Group();
                const cup = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.30, 14), std(0xfacc15, 0.22, 0.88)); cup.position.y = 0.16;
                const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), basic(0xfef08a)); knob.position.y = 0.34;
                bell.add(cup, knob); bell.position.copy(cam.position).addScaledVector(dir, 0.9); S.add(bell);
                D.bells.push({ mesh: bell, vel: dir.multiplyScalar(15).add(V(0, 4.2, 0)), landed: false, life: 4.5, ringCd: 0 });
                SFX.whoosh(0.2); MG.toast('🔔 DECOY BELL TOSSED — WATCH NEARBY PROPS HOP!', '#fde047');
                return true;
            }
            return false;
        },
        update(S, dt, lib, state) {
            const D = S.data, P = BO.Player;
            if (D.carousel) D.carousel.rotation.y += dt * 0.55;
            if (state !== 'running') return;
            if (BO.MinigameAudio) BO.MinigameAudio.tick(dt);
            D.sonarCd = Math.max(0, D.sonarCd - dt);
            D.bellCd = Math.max(0, D.bellCd - dt);
            D.flashCd = Math.max(0, (D.flashCd || 0) - dt);

            // Decoy Bells physics & ringing lure
            for (let i = D.bells.length - 1; i >= 0; i--) {
                const b = D.bells[i]; b.life -= dt;
                if (!b.landed) {
                    b.vel.y -= 18 * dt; b.mesh.position.addScaledVector(b.vel, dt);
                    if (b.mesh.position.y <= 0.05) { b.mesh.position.y = 0.05; b.landed = true; }
                } else {
                    b.mesh.rotation.z = Math.sin(S.t * 32) * 0.32;
                    b.ringCd -= dt;
                    if (b.ringCd <= 0) {
                        b.ringCd = 0.65; tone(1320, 1760, 0.10, 'triangle', 0.08);
                        BO.FX.spawnParticles(b.mesh.position.clone().add(V(0, 0.35, 0)), 4, 0xfde047, 2.2, 1.5, 0.3, 0.6);
                        for (const p of D.props) {
                            if (p.alive && p.isMimic && p.root.position.distanceTo(b.mesh.position) < 9.5) p.hopT = Math.max(p.hopT, 0.9);
                        }
                    }
                }
                if (b.life <= 0) { S.scene.remove(b.mesh); D.bells.splice(i, 1); }
            }

            const camDir = new THREE.Vector3(); BO.App.worldCamera.getWorldDirection(camDir);
            for (const p of D.props) {
                if (!p.alive || !p.isMimic) continue;
                if (p.stunT > 0) {
                    p.stunT -= dt;
                    p.art.body.rotation.z = Math.sin(S.t * 36) * 0.18;
                    continue;
                }
                if (p.exposed) {
                    // Startled googly-eyed mimic sprints around the shop dropping ectoplasm sparks!
                    p.sneakT -= dt;
                    if (p.sneakT <= 0) {
                        p.sneakT = 0.9 + Math.random() * 0.9;
                        const away = p.root.position.clone().sub(P.pos).setY(0);
                        if (away.lengthSq() < 0.1) away.set(1, 0, 0);
                        away.normalize();
                        p.fleeDir.set(away.x + (Math.random() - 0.5) * 1.1, 0, away.z + (Math.random() - 0.5) * 1.1).normalize();
                    }
                    const nx = BO.Math.clamp(p.root.position.x + p.fleeDir.x * 5.6 * dt, -18.5, 18.5);
                    const nz = BO.Math.clamp(p.root.position.z + p.fleeDir.z * 5.6 * dt, -22.5, 14.5);
                    if (Math.abs(nx) > 18.2) p.fleeDir.x *= -1;
                    if (nz < -22.2 || nz > 14.2) p.fleeDir.z *= -1;
                    p.root.position.set(nx, 0, nz);
                    p.root.rotation.y = Math.atan2(p.fleeDir.x, p.fleeDir.z);
                    p.art.body.position.y = Math.abs(Math.sin(S.t * 18)) * 0.34;
                    p.art.body.rotation.z = Math.sin(S.t * 18) * 0.16;
                    if (Math.random() < dt * 10) BO.FX.spawnParticles(p.root.position.clone().add(V(0, 0.5, 0)), 1, 0xf472b6, 1.8, 1.0, 0.35, 0.7);
                    continue;
                }

                // Hidden mimic behaviour: periodic involuntary musical giggle + tiptoeing when player looks away!
                p.giggleT -= dt;
                if (p.giggleT <= 0) {
                    p.giggleT = 5.5 + Math.random() * 5.5;
                    p.hopT = Math.max(p.hopT, 0.55);
                    if (p.root.position.distanceTo(P.pos) < 18) {
                        if (BO.MinigameAudio) BO.MinigameAudio.toyGiggle(); else { tone(740, 990, 0.08, 'sine', 0.06, 0); tone(990, 1320, 0.09, 'sine', 0.06, 0.08); }
                        BO.FX.spawnParticles(p.root.position.clone().add(V(0, 1.35, 0)), 5, 0xf472b6, 2.2, 1.8, 0.45, 0.85);
                    }
                }
                const toProp = p.root.position.clone().sub(P.pos);
                const dist = toProp.length();
                const watched = dist < 22 && toProp.normalize().dot(camDir) > 0.58;
                if (!watched && p.hopT <= 0) {
                    p.sneakT -= dt;
                    if (p.sneakT <= 0) {
                        p.sneakT = 2.5 + Math.random() * 3.0;
                        const a = Math.random() * TAU; p.sneakVx = Math.cos(a) * 1.4; p.sneakVz = Math.sin(a) * 1.4;
                    }
                    p.root.position.x = BO.Math.clamp(p.root.position.x + p.sneakVx * dt, -18, 18);
                    p.root.position.z = BO.Math.clamp(p.root.position.z + p.sneakVz * dt, -22, 13);
                    p.art.body.rotation.z = Math.sin(S.t * 12) * 0.05;
                } else {
                    p.art.body.rotation.z = 0;
                }
                if (p.hopT > 0) {
                    p.hopT -= dt;
                    p.art.body.position.y = Math.abs(Math.sin(S.t * 20)) * 0.24;
                    p.art.body.rotation.z = Math.sin(S.t * 26) * 0.14;
                } else {
                    p.art.body.position.y = 0;
                }
            }
        },
        onHit(S, ent, info) {
            if (!ent.isToyProp || !ent.alive) return false;
            const D = S.data;
            S.hits++;
            if (ent.isMimic) {
                ent.hpLeft--;
                if (ent.hpLeft > 0) {
                    ent.exposed = true;
                    ent.art.mimicRig.visible = true;
                    tone(480, 1180, 0.16, 'sawtooth', 0.1);
                    BO.FX.spawnParticles(info.pt, 14, 0xf472b6, 4.5, 3, 0.45, 1.0);
                    S.award(200, info.pt, 'MIMIC EXPOSED — FINISH IT!', '#f472b6');
                    MG.toast(`👀 ${ent.art.label.toUpperCase()} SPROUTED LEGS — CHASE IT!`, '#f472b6');
                    return false;
                }
                ent.kill(info);
                D.mimicsLeft--; S.kills++; S.bumpCombo();
                SFX.pop(); tone(660, 1320, 0.18, 'triangle', 0.11);
                BO.FX.spawnExplosion(ent.root.position.clone().add(V(0, 0.8, 0)), ent.isGolden ? 3.5 : 2.4, ent.isGolden ? 0xfacc15 : 0xec4899);
                if (ent.isGolden) {
                    BO.Player.hp = Math.min(BO.Player.maxHp, BO.Player.hp + 30);
                    S.award(1300 * S.comboMult, info.pt, '★ GOLDEN MIMIC BUSTED! +30 HP', '#fde047');
                } else {
                    S.award(650 * S.comboMult, info.pt, 'POLTERGEIST BUSTED!', '#4ade80');
                }
                if (D.mimicsLeft <= 0) {
                    S.award(Math.round(Math.max(0, 165 - S.t) * 25));
                    MG.finish('ALL 10 POLTERGEISTS BUSTED!', { color: '#4ade80' });
                }
                return true;
            }
            // Decoy innocent antique prop hit!
            D.falseShots++; S.penalties++;
            S.breakCombo('ANTIQUE BROKEN!');
            ent.kill(info);
            SFX.shatter();
            BO.Player.takeDamage(12, info.pt, false);
            S.award(-150, info.pt, `REAL ${ent.art.label.toUpperCase()}! -12 HP`, '#f87171');
            if (!BO.Player.alive) MG.finish('TOO MANY ANTIQUES SMASHED!', { color: '#f87171' });
            return false;
        },
        hud(S) {
            const D = S.data;
            return `<div class="fun-panel">
                <div class="mgx-chip">MIMICS LEFT <b>${D.mimicsLeft} / 10</b></div>
                <div class="mgx-chip ${D.sonarCd <= 0 ? 'mgx-hot' : ''}">SONAR [E] <b>${D.sonarCd <= 0 ? 'READY' : D.sonarCd.toFixed(1) + 's'}</b></div>
                <div class="mgx-chip ${D.bellCd <= 0 ? 'mgx-hot' : ''}">DECOY BELL [Q] <b>${D.bellCd <= 0 ? 'READY' : D.bellCd.toFixed(1) + 's'}</b></div>
                <div class="mgx-chip ${(D.flashCd || 0) <= 0 ? 'mgx-hot' : ''}">FLASH [R] <b>${(D.flashCd || 0) <= 0 ? 'READY' : D.flashCd.toFixed(1) + 's'}</b></div>
                ${D.falseShots ? `<div class="mgx-chip mgx-bad">ANTIQUES HIT <b>${D.falseShots}</b></div>` : ''}
            </div>`;
        },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return {
                score: S.score, stars,
                title: D.mimicsLeft <= 0 ? 'MASTER PARANORMAL SLEUTH' : !BO.Player.alive ? 'KICKED OUT OF THE SHOP' : 'MIDNIGHT OVER',
                stats: [['MIMICS BUSTED', (10 - D.mimicsLeft) + ' / 10'], ['REAL PROPS BROKEN', D.falseShots], ['SONAR PINGS', D.pings], ['BEST STREAK', S.maxCombo]],
                xp: Math.round(160 + S.score * 0.04 + stars * 140)
            };
        }
    });

    /* =====================================================================
       9. KAIJU VS. MECHA METROPOLIS
       First-person 18m Obsidian Kaiju with animated 3D Claws, Atomic Breath,
       progressive building collapse, Tanks/Choppers & Mecha-Titan Mk-IX Boss!
    ===================================================================== */
    function cityRoadTex() {
        return L.canvasTex('kaiju-city-grid-v2', 512, 512, (g, w, h) => {
            g.fillStyle = '#1e293b'; g.fillRect(0, 0, w, h);
            // City blocks & asphalt streets
            for (let i = 0; i <= 4; i++) {
                const p = i * 128;
                g.fillStyle = '#0f172a';
                g.fillRect(p - 18, 0, 36, h);
                g.fillRect(0, p - 18, w, 36);
                g.strokeStyle = '#facc15'; g.lineWidth = 2; g.setLineDash([10, 10]);
                g.beginPath(); g.moveTo(p, 0); g.lineTo(p, h); g.moveTo(0, p); g.lineTo(w, p); g.stroke();
                g.setLineDash([]);
            }
        });
    }

    function billboardTex(text, bg, fg) {
        return L.canvasTex('kj-bb:' + text, 256, 96, (g, w, h) => {
            g.fillStyle = bg; g.fillRect(0, 0, w, h);
            g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(4, 4, w - 8, h - 8);
            g.fillStyle = fg; g.font = '900 34px Bahnschrift, Impact, sans-serif';
            g.textAlign = 'center'; g.textBaseline = 'middle';
            g.shadowColor = fg; g.shadowBlur = 12;
            g.fillText(text, w / 2, h / 2 + 2, w - 24);
        });
    }

    function buildSkyscraper(w, h, d, seed) {
        const root = new THREE.Group();
        const cols = [0x334155, 0x1e3a8a, 0x312e81, 0x3f3f46, 0x0f766e];
        const tower = A.building(w, h, d, cols[seed % cols.length], seed + 3, 0.72, false);
        tower.position.y = h * 0.5;
        root.add(tower);
        // Tiered crown penthouse + AC units + radio spire + glowing Neo-Tokyo billboard!
        const crown = new THREE.Mesh(new THREE.BoxGeometry(w * 0.72, 2.2, d * 0.72), std(0x1e293b, 0.4, 0.6));
        crown.position.y = h + 1.1; root.add(crown);
        const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.22, 4.5, 8), std(0x94a3b8, 0.3, 0.85));
        spire.position.y = h + 4.3; root.add(spire);
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), basic(0xef4444));
        beacon.position.y = h + 6.6; root.add(beacon);
        const signs = [['NEO-TOKYO', '#090d16', '#22d3ee'], ['KAIJU TV', '#4c0519', '#f472b6'], ['MECHA CORP', '#1e1b4b', '#fde047'], ['RAMEN 24H', '#052e16', '#4ade80']];
        const [txt, bg, fg] = signs[seed % signs.length];
        const bb = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.85, 2.4), new THREE.MeshBasicMaterial({ map: billboardTex(txt, bg, fg), side: THREE.DoubleSide }));
        bb.position.set(0, h * 0.68, d * 0.5 + 0.12); root.add(bb);
        return { root, tower };
    }

    function buildTankMesh() {
        const g = new THREE.Group();
        const olive = std(0x3f6212, 0.65, 0.35), treadM = std(0x18181b, 0.85);
        for (const sx of [-1.25, 1.25]) {
            const tr = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.85, 4.2), treadM); tr.position.set(sx, 0.42, 0); g.add(tr);
        }
        const hull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 3.8), olive); hull.position.y = 0.75; g.add(hull);
        const turret = new THREE.Group(); turret.position.y = 1.45;
        const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.1, 0.65, 12), olive);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 2.8, 8), std(0x27272a, 0.4, 0.7));
        barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.08, 1.8);
        turret.add(dome, barrel); g.add(turret);
        return { g, hit: [hull, dome], turret };
    }

    function buildChopperMesh() {
        const g = new THREE.Group();
        const bodyM = std(0x1e293b, 0.4, 0.65);
        const fus = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 10), bodyM); fus.scale.set(0.85, 0.9, 1.9); g.add(fus);
        const glass = new THREE.Mesh(new THREE.SphereGeometry(0.85, 10, 8), basic(0x38bdf8)); glass.position.set(0, 0.1, 1.1); g.add(glass);
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 3.2, 8), bodyM); tail.rotation.x = Math.PI / 2; tail.position.z = -2.4; g.add(tail);
        const rotor = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.08, 0.35), std(0xcbd5e1, 0.3, 0.8)); rotor.position.y = 1.15; g.add(rotor);
        return { g, hit: [fus], rotor };
    }

    function buildMechaTitan() {
        const root = new THREE.Group();
        const chrome = std(0xe2e8f0, 0.22, 0.88), gold = std(0xfacc15, 0.25, 0.85), crimson = std(0xdc2626, 0.35, 0.6), coreM = basic(0x38bdf8);
        // Legs & Armored Boots
        for (const sx of [-3.2, 3.2]) {
            const boot = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, 4.2), crimson); boot.position.set(sx, 1.1, 0.4);
            const shin = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 6.5, 10), chrome); shin.position.set(sx, 5.2, 0);
            const knee = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.0, 2.6), gold); knee.position.set(sx, 8.6, 0.4);
            root.add(boot, shin, knee);
        }
        const pelvis = new THREE.Mesh(new THREE.BoxGeometry(8.2, 2.6, 4.4), chrome); pelvis.position.y = 10.4; root.add(pelvis);
        const chest = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 4.2, 7.2, 12), crimson); chest.scale.set(1.15, 1, 0.78); chest.position.y = 14.8; root.add(chest);
        const reactor = new THREE.Mesh(new THREE.OctahedronGeometry(1.9, 1), coreM); reactor.position.set(0, 15.2, 3.6); root.add(reactor);
        // Shoulder Missile Pods + Jetpack Wings + Drill/Cannon Arms
        for (const sx of [-1, 1]) {
            const pauldron = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.2, 3.8), gold); pauldron.position.set(sx * 7.2, 17.6, 0);
            const pod = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.0, 2.8), std(0x18181b, 0.5)); pod.position.set(sx * 7.2, 20.0, 0);
            const wing = new THREE.Mesh(new THREE.BoxGeometry(7.5, 2.8, 0.4), crimson); wing.position.set(sx * 8.5, 16.5, -2.6); wing.rotation.z = sx * 0.35;
            const arm = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.0, 6.8, 10), chrome); arm.position.set(sx * 7.8, 13.5, 2.2); arm.rotation.x = Math.PI * 0.36;
            const wep = sx > 0
                ? new THREE.Mesh(new THREE.ConeGeometry(1.5, 4.6, 10), gold) // Spinning Drill!
                : new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 3.8, 12), coreM); // Plasma Buster!
            wep.rotation.x = Math.PI / 2; wep.position.set(sx * 7.8, 11.4, 5.8);
            root.add(pauldron, pod, wing, arm, wep);
            if (sx > 0) root.userData.drill = wep;
        }
        // Mecha Head + Glowing Crimson V-Fin & Cyan Visor
        const head = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.4, 3.6), chrome); head.position.y = 20.2;
        const visor = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.85, 0.4), basic(0x22d3ee)); visor.position.set(0, 20.3, 1.85);
        for (const sx of [-1, 1]) {
            const fin = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.55, 0.35), gold);
            fin.position.set(sx * 1.8, 22.1, 1.7); fin.rotation.z = sx * 0.42; root.add(fin);
        }
        root.add(head, visor);
        return { root, hit: [chest, reactor, head, pelvis], reactor };
    }

    function buildKaijuHandsRig() {
        const rig = new THREE.Group();
        const scaleM = std(0x18181b, 0.55, 0.25), veinM = basic(0x22d3ee), clawM = std(0xe2e8f0, 0.3, 0.4);
        const hands = [];
        for (const sx of [-1, 1]) {
            const h = new THREE.Group();
            h.position.set(sx * 0.68, -0.46, -0.95);
            const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.85, 10), scaleM);
            forearm.rotation.set(Math.PI * 0.38, 0, -sx * 0.22);
            const dorsal = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.65, 0.10), veinM);
            dorsal.rotation.copy(forearm.rotation); dorsal.position.y = 0.08;
            h.add(forearm, dorsal);
            for (let c = -1; c <= 1; c++) {
                const talon = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.34, 6), clawM);
                talon.rotation.x = -Math.PI * 0.48;
                talon.position.set(c * 0.11 - sx * 0.05, -0.05 + Math.abs(c) * -0.03, -0.46);
                h.add(talon);
            }
            rig.add(h);
            hands.push({ grp: h, sx, base: h.position.clone() });
        }
        return { rig, hands };
    }

    MG.register({
        id: 'fun_kaiju', cat: 'fun', order: 9, name: 'Kaiju vs. Mecha Metropolis', icon: '🦖', accent: '#22d3ee', badge: 'TITAN BOSS',
        tagline: 'Rampage through Neo-Tokyo with First-Person Kaiju Claws, Atomic Breath & duel MECHA-TITAN MK-IX!',
        desc: 'Tower 16 metres above Neo-Tokyo Harbor! Crush neon-lit skyscrapers into rubble piles, swipe Attack Choppers out of the sky with your twin Kaiju Claws ([RMB/V]), incinerate JSDF Tank Columns with Atomic Plasma Breath ([LMB]), slam down Tectonic Belly-Stomps ([SPACE]), and battle the 22-metre MECHA-TITAN MK-IX when it drops from orbit!',
        heroLabel: 'FUN • KAIJU RAMPAGE + MECHA DUEL', duration: 180, stars: [4500, 9000, 14500, 21000],
        standardWeapon: 'scarh', lockWeapon: true, blockFire: true, hideViewmodel: true, customMusic: true,
        weaponLabel: 'ATOMIC BREATH + KAIJU CLAWS', weaponNote: 'Chain 5 kills for OVERDRIVE ATOMIC BREATH! Level 60% to summon MECHA-TITAN MK-IX!',
        keys: [['WASD', 'Stomp Metropolis'], ['LMB', 'Atomic Plasma Breath'], ['RMB / V', 'Twin Claw Cleave'], ['SPACE', 'Tectonic Leap-Stomp (6s)'], ['Q', 'Nuclear Pulse (14s)']],
        guide: {
            objective: 'Demolish 60% of Neo-Tokyo\'s skyscrapers & military forces to draw out MECHA-TITAN MK-IX, then defeat the giant robot!',
            tips: [
                'Hold [LMB] to sweep searing cyan Atomic Plasma Breath across skyscrapers and tank platoons (recharges automatically when released).',
                'Use [SPACE] Tectonic Leap-Stomp right in the middle of a city block to flatten weakened towers and flip tanks!',
                'Save [Q] Nuclear Pulse Roar for Mecha-Titan\'s homing missile barrages and close in with [RMB] Claw Cleaves!'
            ]
        },
        blockKeys: ['Space'],
        map: {
            atmosphere: { skyTop: 0x090d1e, skyBottom: 0xc2410c, fogColor: 0x31102f, fogDensity: 0.0038, sunColor: 0xfdba74, sunIntensity: 1.55, sunPos: [-60, 45, -80], hemiSky: 0xf472b6, hemiGround: 0x1e293b, hemiIntensity: 1.0 },
            boxes: [B(0, -0.5, 0, 220, 1, 220, 'concrete')],
            spawn: { x: 0, y: 14, z: 58, yaw: 0 }
        },
        build(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.start('kaiju');
            const roadTex = cityRoadTex(); roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping; roadTex.repeat.set(4, 4);
            const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.86 }));
            ground.rotation.x = -Math.PI / 2; ground.position.y = 0.02; S.add(ground);
            // Harbor Bay + Iconic Neo-Tokyo Red Suspension Bridge & Searchlight Beams!
            const bay = new THREE.Mesh(new THREE.PlaneGeometry(260, 80), std(0x0369a1, 0.16, 0.45));
            bay.rotation.x = -Math.PI / 2; bay.position.set(0, 0.05, -124); S.add(bay);
            const bridgeM = std(0xdc2626, 0.45, 0.4);
            const deck = new THREE.Mesh(new THREE.BoxGeometry(220, 1.8, 6.5), std(0x334155, 0.8)); deck.position.set(0, 14, -112); S.add(deck);
            for (const tx of [-52, 52]) {
                const tower = new THREE.Mesh(new THREE.BoxGeometry(4.5, 42, 4.5), bridgeM); tower.position.set(tx, 21, -112); S.add(tower);
                const bar = new THREE.Mesh(new THREE.BoxGeometry(10, 2.2, 2.2), bridgeM); bar.position.set(tx, 34, -112); S.add(bar);
            }
            for (const [sx, sz] of [[-48, 42], [48, 42], [-56, -42], [56, -42]]) {
                const beam = new THREE.Mesh(new THREE.ConeGeometry(4.5, 58, 12, 1, true), basic(0xfef08a, { transparent: true, opacity: 0.10, side: THREE.DoubleSide }));
                beam.position.set(sx, 28, sz); beam.rotation.set(0.28, 0, sx > 0 ? 0.25 : -0.25); S.add(beam);
            }

            // 20 Multi-Part Neo-Tokyo Skyscrapers with progressive collapse!
            S.data.buildings = [];
            let seed = 1;
            for (let gx = -2; gx <= 2; gx++) {
                for (let gz = -2; gz <= 1; gz++) {
                    const bx = gx * 26 + (gz % 2) * 3, bz = gz * 26 - 8;
                    const w = 8.5 + (seed % 3) * 1.5, h = 16 + (seed % 4) * 5.5, d = 8.5 + ((seed + 1) % 3) * 1.5;
                    const built = buildSkyscraper(w, h, d, seed++);
                    const tg = S.addTarget({
                        mesh: built.root, hitMeshes: [built.tower], pos: V(bx, 0, bz),
                        life: 0, appear: 'none', inT: 0.01, death: 'none', bonus: true
                    });
                    S.data.buildings.push(Object.assign(tg, { isBldg: true, hp: 100, maxHp: 100, h, w, collapsing: false, colT: 0 }));
                }
            }

            // Military Defense Force: 6 Tanks + 5 Orbiting Attack Choppers
            S.data.units = [];
            for (let i = 0; i < 6; i++) {
                const tk = buildTankMesh();
                const tg = S.addTarget({ mesh: tk.g, hitMeshes: tk.hit, pos: V((i - 2.5) * 18, 0, 20 - (i % 2) * 28), life: 0, appear: 'scale', inT: 0.2, death: 'tumble', deathColor: 0xf97316, bonus: true });
                S.data.units.push(Object.assign(tg, { kind: 'tank', hp: 45, turret: tk.turret, fireT: 1.5 + i * 0.5, a: i }));
            }
            for (let i = 0; i < 5; i++) {
                const ch = buildChopperMesh();
                const tg = S.addTarget({ mesh: ch.g, hitMeshes: ch.hit, pos: V(0, 21 + (i % 3) * 3, 0), life: 0, appear: 'scale', inT: 0.2, death: 'fall', deathColor: 0x38bdf8, bonus: true });
                S.data.units.push(Object.assign(tg, { kind: 'chopper', hp: 35, rotor: ch.rotor, fireT: 2.0 + i * 0.6, a: (i / 5) * TAU, rad: 34 + (i % 2) * 10 }));
            }

            // First-person 3D Kaiju Claws synced to world camera!
            const handsObj = buildKaijuHandsRig();
            S.add(handsObj.rig);

            Object.assign(S.data, {
                kj: { pos: V(0, 14.0, 58), vy: 0, hp: 600, maxHp: 600, atomic: 100, overdriveT: 0, stepT: 0, stompCd: 0, pulseCd: 0, clawCd: 0, clawAnim: 0, firingBeam: false },
                handsObj, destroyedBldgs: 0, totalBldgs: S.data.buildings.length,
                mecha: null, mechaSpawned: false, missiles: [], beamTick: 0
            });
            BO.Player.maxHp = 600; BO.Player.hp = 600;
            BO.Player.rideState = { kind: 'minigame', pos: V(0, 14.0, 58), roll: 0, pitch: 0, eye: 1.6 };
        },
        dispose() { if (BO.MinigameAudio) BO.MinigameAudio.stop(); },
        onKey(S, code) {
            const D = S.data, kj = D.kj;
            if (MG.state !== 'running') return false;
            if (code === 'Space' && kj.stompCd <= 0 && kj.pos.y <= 14.2) {
                kj.vy = 22.0; kj.stompCd = 6.0; kj.leapArmed = true;
                tone(110, 260, 0.25, 'sawtooth', 0.12);
                MG.toast('🦖 TECTONIC LEAP!', '#38bdf8');
                return true;
            }
            if (code === 'KeyQ' && kj.pulseCd <= 0) {
                kj.pulseCd = 14.0;
                if (BO.MinigameAudio) BO.MinigameAudio.kaijuRoar(); else tone(180, 60, 0.45, 'sawtooth', 0.16);
                SFX.rumble(0.7);
                BO.FX.spawnExplosion(kj.pos.clone(), 14, 0x22d3ee);
                const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 14), basic(0x22d3ee, { transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
                dome.position.copy(kj.pos); S.add(dome);
                let pt = 0; S.animate((dt) => { pt += dt; dome.scale.setScalar(1 + pt * 42); dome.material.opacity = Math.max(0, 0.55 - pt * 0.9); if (pt > 0.65) { S.scene.remove(dome); return false; } });
                for (let i = D.missiles.length - 1; i >= 0; i--) { S.scene.remove(D.missiles[i].mesh); D.missiles.splice(i, 1); }
                this._aoeDamage(S, kj.pos, 30, 65, 'NUCLEAR PULSE!');
                MG.toast('☢️ NUCLEAR PULSE ROAR!', '#22d3ee');
                return true;
            }
            if (code === 'KeyV') { this._clawSwipe(S); return true; }
            return false;
        },
        _clawSwipe(S) {
            const D = S.data, kj = D.kj;
            if (kj.clawCd > 0) return;
            kj.clawCd = 0.65; kj.clawAnim = 0.35;
            SFX.whoosh(0.32); tone(160, 85, 0.16, 'sawtooth', 0.11);
            const cam = BO.App.worldCamera, dir = new THREE.Vector3(); cam.getWorldDirection(dir);
            const hitCenter = cam.position.clone().addScaledVector(dir, 11);
            BO.FX.spawnParticles(hitCenter, 18, 0x22d3ee, 7, 2, 0.4, 1.2);
            this._aoeDamage(S, hitCenter, 15, 75, 'KAIJU CLAW CLEAVE!');
        },
        _aoeDamage(S, center, radius, dmg, tag) {
            const D = S.data;
            for (const b of D.buildings) {
                if (b.collapsing) continue;
                const bp = b.root.position.clone().setY(center.y);
                if (bp.distanceTo(center) <= radius + b.w * 0.5) this._hitBuilding(S, b, dmg, tag);
            }
            for (const u of D.units) {
                if (u.alive && u.root.position.distanceTo(center) <= radius) this._hitUnit(S, u, dmg, tag);
            }
            if (D.mecha && D.mecha.alive && D.mecha.root.position.clone().add(V(0, 14, 0)).distanceTo(center) <= radius + 5) {
                this._hitMecha(S, dmg * 1.15, tag);
            }
        },
        _hitBuilding(S, b, dmg, tag) {
            if (b.collapsing) return;
            b.hp -= dmg;
            if (b.hp <= 0) {
                b.collapsing = true; b.hitMeshes = [];
                S.data.destroyedBldgs++; S.kills++; S.bumpCombo();
                const pos = b.root.position.clone().add(V(0, b.h * 0.5, 0));
                BO.FX.spawnExplosion(pos, 6.5, 0xf97316); SFX.rumble(0.5);
                S.award(450 * S.comboMult, pos, tag || 'SKYSCRAPER TOPPLED!', '#fde047');
                // Leave glowing rubble mound
                const rubble = new THREE.Mesh(new THREE.DodecahedronGeometry(b.w * 0.55, 0), std(0x475569, 0.95));
                rubble.scale.y = 0.45; rubble.position.set(b.root.position.x, 1.2, b.root.position.z); S.add(rubble);
            }
        },
        _hitUnit(S, u, dmg, tag) {
            if (!u.alive) return;
            u.hp -= dmg;
            if (u.hp <= 0) {
                const p = u.root.position.clone().add(V(0, 1.5, 0));
                u.kill({ pt: p }); S.kills++; S.bumpCombo();
                BO.FX.spawnExplosion(p, 3.8, 0xf97316); SFX.pop();
                S.award((u.kind === 'chopper' ? 350 : 280) * S.comboMult, p, tag || (u.kind === 'chopper' ? 'SWATTED!' : 'CRUSHED!'), '#38bdf8');
            }
        },
        _spawnMecha(S) {
            const D = S.data;
            D.mechaSpawned = true;
            const built = buildMechaTitan();
            const tg = S.addTarget({ mesh: built.root, hitMeshes: built.hit, pos: V(0, 48, -45), life: 0, appear: 'none', inT: 0.01, death: 'none', bonus: true });
            D.mecha = Object.assign(tg, { isMecha: true, hp: 2200, maxHp: 2200, phase2: false, reactor: built.reactor, atkCd: 2.8, salvoCd: 5.5, walkT: 0, dropY: 48 });
            if (BO.MinigameAudio) { BO.MinigameAudio.start('kaiju:mecha'); BO.MinigameAudio.kaijuRoar(); }
            SFX.rumble(0.9); tone(440, 110, 0.6, 'sawtooth', 0.15);
            MG.toast('⚠️ ORBITAL DROP: MECHA-TITAN MK-IX ENGAGING!', '#fde047');
        },
        _hitMecha(S, dmg, tag) {
            const m = S.data.mecha; if (!m || !m.alive) return;
            m.hp -= dmg;
            const p = m.root.position.clone().add(V(0, 16, 0));
            BO.FX.spawnParticles(p, 8, 0xfacc15, 5, 3, 0.35, 0.9);
            if (tag) S.award(Math.round(dmg * 1.5), p, tag, '#22d3ee');
            if (m.hp <= 0) {
                m.hp = 0; m.kill({ pt: p });
                BO.FX.spawnExplosion(p, 12, 0x38bdf8);
                BO.FX.spawnExplosion(p.clone().add(V(0, -6, 0)), 10, 0xf97316);
                SFX.fanfare(); SFX.rumble(0.9);
                S.award(4500, p, 'MECHA-TITAN ANNIHILATED!', '#fde047');
                MG.finish('KING OF THE MONSTERS — MECHA-TITAN FALLS!', { color: '#22d3ee' });
            }
        },
        preUpdate(S, dt, lib, state) {
            const D = S.data, kj = D.kj, P = BO.Player, k = P.keys;
            if (state === 'running') {
                const f = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0), s = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
                kj.pos.x = BO.Math.clamp(kj.pos.x + (-Math.sin(P.yaw) * f + Math.cos(P.yaw) * s) * 19 * dt, -82, 82);
                kj.pos.z = BO.Math.clamp(kj.pos.z + (-Math.cos(P.yaw) * f - Math.sin(P.yaw) * s) * 19 * dt, -82, 82);
                if (kj.pos.y > 14.0 || kj.vy !== 0) {
                    kj.vy -= 38 * dt;
                    kj.pos.y += kj.vy * dt;
                    if (kj.pos.y <= 14.0) {
                        kj.pos.y = 14.0; kj.vy = 0;
                        if (kj.leapArmed) {
                            kj.leapArmed = false;
                            SFX.rumble(0.75);
                            const shock = new THREE.Mesh(new THREE.RingGeometry(1.5, 2.8, 32), basic(0xf97316, { side: THREE.DoubleSide }));
                            shock.rotation.x = -Math.PI / 2; shock.position.set(kj.pos.x, 0.25, kj.pos.z); S.add(shock);
                            let st = 0; S.animate((dt2) => { st += dt2; shock.scale.setScalar(1 + st * 14); if (st > 0.55) { S.scene.remove(shock); return false; } });
                            this._aoeDamage(S, V(kj.pos.x, 8, kj.pos.z), 24, 95, 'BELLY-STOMP SHOCKWAVE!');
                        }
                    }
                }
            }
            const walkBob = (k.KeyW || k.KeyS || k.KeyA || k.KeyD) ? Math.sin(S.t * 5.5) * 0.35 : 0;
            P.rideState.pos.set(kj.pos.x, kj.pos.y + walkBob, kj.pos.z);
            P.rideState.roll = Math.sin(S.t * 2.75) * 0.02;

            // Position 3D Kaiju Claws locked to camera!
            const cam = BO.App.worldCamera;
            if (cam && D.handsObj) {
                D.handsObj.rig.position.copy(cam.position);
                D.handsObj.rig.quaternion.copy(cam.quaternion);
                for (const h of D.handsObj.hands) {
                    const sw = kj.clawAnim > 0 ? Math.sin((kj.clawAnim / 0.35) * Math.PI) : 0;
                    const beamBrace = kj.firingBeam ? 0.14 : 0;
                    h.grp.position.set(
                        h.base.x - h.sx * (sw * 0.42 + beamBrace),
                        h.base.y + sw * 0.22 + Math.sin(S.t * 4 + h.sx) * 0.02,
                        h.base.z - sw * 0.35
                    );
                }
            }
        },
        update(S, dt, lib, state) {
            const D = S.data, kj = D.kj, P = BO.Player;
            if (state !== 'running') return;
            if (BO.MinigameAudio) BO.MinigameAudio.tick(dt);
            kj.stompCd = Math.max(0, kj.stompCd - dt);
            kj.pulseCd = Math.max(0, kj.pulseCd - dt);
            kj.clawCd = Math.max(0, kj.clawCd - dt);
            kj.clawAnim = Math.max(0, kj.clawAnim - dt);
            kj.overdriveT = Math.max(0, (kj.overdriveT || 0) - dt);
            if (S.combo >= 5 && kj.overdriveT <= 0) {
                kj.overdriveT = 6.5; kj.atomic = 100;
                if (BO.MinigameAudio) BO.MinigameAudio.kaijuRoar();
                MG.toast('🔥 ATOMIC OVERDRIVE! 1.75x HYPER-BEAM (6.5s)!', '#f472b6');
            }
            if ((P.keys.KeyW || P.keys.KeyS || P.keys.KeyA || P.keys.KeyD) && kj.pos.y <= 14.2) {
                kj.stepT = (kj.stepT || 0) - dt;
                if (kj.stepT <= 0) { kj.stepT = 0.58; if (BO.MinigameAudio) BO.MinigameAudio.kaijuStep(); }
            }

            if (P.adsHeld && !D._rmb) { D._rmb = true; this._clawSwipe(S); } else if (!P.adsHeld) D._rmb = false;

            // Atomic Plasma Breath [LMB] (Overdrive = Magenta-Cyan Hyper-Beam, 1.75x DMG, 0 Drain!)
            if (P.triggerHeld && (kj.atomic > 4 || kj.overdriveT > 0)) {
                kj.firingBeam = true;
                const ov = kj.overdriveT > 0;
                if (!ov) kj.atomic = Math.max(0, kj.atomic - dt * 26);
                D.beamTick -= dt;
                if (D.beamTick <= 0) {
                    D.beamTick = 0.11;
                    const cam = BO.App.worldCamera, dir = new THREE.Vector3(); cam.getWorldDirection(dir);
                    const rc = new THREE.Raycaster(cam.position, dir, 1, 115);
                    let endPt = cam.position.clone().addScaledVector(dir, 95);
                    if (dir.y < -0.05) {
                        const tG = -cam.position.y / dir.y;
                        if (tG > 0 && tG < 95) endPt = cam.position.clone().addScaledVector(dir, tG);
                    }
                    BO.FX.spawnTracer(cam.position.clone().add(V(0, -0.45, 0)), endPt, ov ? 0xf472b6 : 0x22d3ee, ov ? 0.56 : 0.38, 0.15);
                    BO.FX.spawnParticles(endPt, ov ? 10 : 6, ov ? 0xf472b6 : 0x38bdf8, 6, 3, 0.35, 1.1);
                    SFX.noise(0.08, ov ? 720 : 520, 'bandpass', 0.9, 0.14);
                    const bMult = ov ? 1.75 : 1.0;
                    // Ray/Cone check against buildings, units & Mecha-Titan
                    for (const b of D.buildings) {
                        if (b.collapsing) continue;
                        const c = b.root.position.clone().add(V(0, b.h * 0.5, 0));
                        const v = c.clone().sub(cam.position), d = v.length();
                        if (d < 105 && v.normalize().dot(dir) > 0.965) this._hitBuilding(S, b, 24 * bMult, ov ? 'HYPER-BEAM MELTDOWN!' : 'ATOMIC INCINERATION!');
                    }
                    for (const u of D.units) {
                        if (!u.alive) continue;
                        const v = u.root.position.clone().sub(cam.position), d = v.length();
                        if (d < 105 && v.normalize().dot(dir) > 0.96) this._hitUnit(S, u, 28 * bMult, 'VAPORIZED!');
                    }
                    if (D.mecha && D.mecha.alive) {
                        const mc = D.mecha.root.position.clone().add(V(0, 14, 0));
                        const v = mc.sub(cam.position), d = v.length();
                        if (d < 115 && v.normalize().dot(dir) > 0.95) this._hitMecha(S, 38 * bMult);
                    }
                    void rc;
                }
            } else {
                kj.firingBeam = false;
                kj.atomic = Math.min(100, kj.atomic + dt * 22);
            }

            // Animate collapsing skyscrapers
            for (const b of D.buildings) {
                if (b.collapsing && b.root.visible) {
                    b.colT += dt;
                    b.root.position.y -= dt * 11;
                    b.root.rotation.z += dt * 0.35;
                    if (b.colT > 1.6) b.root.visible = false;
                } else if (!b.collapsing && Math.hypot(b.root.position.x - kj.pos.x, b.root.position.z - kj.pos.z) < b.w * 0.55 + 2.4) {
                    // Walking physically through skyscrapers crushes them!
                    this._hitBuilding(S, b, 120 * dt, 'TRAMPLED!');
                }
            }

            // JSDF Tanks & Choppers AI
            for (const u of D.units) {
                if (!u.alive) continue;
                if (u.kind === 'chopper') {
                    u.rotor.rotation.y += dt * 28;
                    u.a += dt * 0.42;
                    u.root.position.set(kj.pos.x + Math.cos(u.a) * u.rad, 20 + Math.sin(S.t * 2 + u.a) * 2.5, kj.pos.z + Math.sin(u.a) * u.rad);
                    u.root.lookAt(kj.pos.x, 15, kj.pos.z);
                } else {
                    const dx = kj.pos.x - u.root.position.x, dz = kj.pos.z - u.root.position.z, dist = Math.hypot(dx, dz);
                    if (dist > 26) { u.root.position.x += (dx / dist) * 4.2 * dt; u.root.position.z += (dz / dist) * 4.2 * dt; }
                    u.root.rotation.y = Math.atan2(dx, dz);
                    if (dist < 5.2) { this._hitUnit(S, u, 999, 'UNDERFOOT CRUSH!'); continue; }
                }
                u.fireT -= dt;
                if (u.fireT <= 0) {
                    u.fireT = 2.6 + Math.random() * 1.5;
                    BO.FX.spawnTracer(u.root.position.clone().add(V(0, 1.8, 0)), kj.pos.clone(), 0xfacc15, 0.06, 0.12);
                    P.takeDamage(5, u.root.position, false);
                }
            }

            // Trigger MECHA-TITAN MK-IX Boss Drop at 60% City Destruction!
            if (!D.mechaSpawned && D.destroyedBldgs >= Math.ceil(D.totalBldgs * 0.6)) {
                this._spawnMecha(S);
            }

            if (D.mecha && D.mecha.alive) {
                const m = D.mecha;
                if (m.dropY > 0) {
                    m.dropY = Math.max(0, m.dropY - 36 * dt);
                    m.root.position.y = m.dropY;
                    if (m.dropY === 0) { BO.FX.spawnExplosion(m.root.position.clone(), 9, 0xfacc15); SFX.rumble(0.8); }
                } else {
                    m.walkT += dt;
                    if (!m.phase2 && m.hp <= m.maxHp * 0.5) {
                        m.phase2 = true;
                        m.reactor.material.color.setHex(0xfacc15);
                        BO.FX.spawnExplosion(m.root.position.clone().add(V(0, 16, 0)), 10, 0xfacc15);
                        SFX.rumble(0.8); MG.toast('⚡ MECHA-TITAN MK-IX PHASE 2: GOLDEN OVERDRIVE!', '#facc15');
                    }
                    const dx = kj.pos.x - m.root.position.x, dz = kj.pos.z - m.root.position.z, dist = Math.max(0.1, Math.hypot(dx, dz));
                    if (dist > 22) {
                        m.root.position.x += (dx / dist) * (m.phase2 ? 11.5 : 7.5) * dt;
                        m.root.position.z += (dz / dist) * (m.phase2 ? 11.5 : 7.5) * dt;
                    }
                    m.root.rotation.y = Math.atan2(dx, dz);
                    if (m.root.userData.drill) m.root.userData.drill.rotation.z += dt * (m.phase2 ? 28 : 18);
                    m.reactor.scale.setScalar(1 + Math.sin(S.t * 8) * 0.18);
                    m.atkCd -= dt;
                    if (m.atkCd <= 0) {
                        m.atkCd = m.phase2 ? 1.55 : 2.4;
                        BO.FX.spawnTracer(m.root.position.clone().add(V(0, 20, 0)), kj.pos.clone(), m.phase2 ? 0xfacc15 : 0xef4444, 0.24, 0.18);
                        P.takeDamage(m.phase2 ? 20 : 16, m.root.position, true);
                    }
                    m.salvoCd -= dt;
                    if (m.salvoCd <= 0) {
                        m.salvoCd = 5.8; SFX.launch();
                        MG.toast('🚀 MECHA HOMING SALVO — PULSE [Q] OR STOMP!', '#fca5a5');
                        for (let k = -1; k <= 1; k++) {
                            const ms = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.6, 8), basic(0xf97316));
                            ms.position.copy(m.root.position).add(V(k * 4, 21, 0)); S.add(ms);
                            D.missiles.push({ mesh: ms, life: 4.2 });
                        }
                    }
                }
            }

            for (let i = D.missiles.length - 1; i >= 0; i--) {
                const ms = D.missiles[i]; ms.life -= dt;
                const dir = kj.pos.clone().sub(ms.mesh.position).normalize();
                ms.mesh.position.addScaledVector(dir, 21 * dt);
                if (ms.mesh.position.distanceTo(kj.pos) < 2.6) {
                    P.takeDamage(18, ms.mesh.position, true);
                    BO.FX.spawnExplosion(ms.mesh.position.clone(), 3.5, 0xf97316);
                    S.scene.remove(ms.mesh); D.missiles.splice(i, 1); continue;
                }
                if (ms.life <= 0) { S.scene.remove(ms.mesh); D.missiles.splice(i, 1); }
            }

            if (!P.alive) MG.finish('KAIJU FELLED BY DEFENSE FORCES', { color: '#f87171' });
        },
        hud(S) {
            const D = S.data, kj = D.kj, pct = Math.round(D.destroyedBldgs / D.totalBldgs * 100);
            const m = D.mecha;
            return `<div class="fun-panel">
                <div class="mgx-chip">CITY RAZED <b>${pct}%</b></div>
                <div class="mgx-chip ${kj.overdriveT > 0 ? 'mgx-hot' : ''}">${kj.overdriveT > 0 ? '🔥 OVERDRIVE' : 'ATOMIC'} <b>${kj.overdriveT > 0 ? kj.overdriveT.toFixed(1) + 's' : Math.round(kj.atomic) + '%'}</b></div>
                <div class="mgx-chip ${kj.stompCd <= 0 ? 'mgx-hot' : ''}">STOMP [SPACE] <b>${kj.stompCd <= 0 ? 'READY' : kj.stompCd.toFixed(1) + 's'}</b></div>
                <div class="mgx-chip ${kj.pulseCd <= 0 ? 'mgx-hot' : ''}">PULSE [Q] <b>${kj.pulseCd <= 0 ? 'READY' : kj.pulseCd.toFixed(1) + 's'}</b></div>
            </div>
            ${m && m.alive ? `<div class="fun-panel" style="margin-top:5px;"><div class="fun-bar-wrap"><div class="fun-bar-lbl"><span>🤖 MECHA-TITAN MK-IX</span><b>${Math.round(m.hp)} / ${m.maxHp}</b></div><div class="fun-bar"><i style="width:${Math.round(m.hp / m.maxHp * 100)}%;background:linear-gradient(90deg,#ef4444,#facc15)"></i></div></div></div>` : ''}`;
        },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            const won = D.mecha && !D.mecha.alive;
            return {
                score: S.score, stars,
                title: won ? 'APEX TITAN OF NEO-TOKYO' : 'RAMPAGE CONCLUDED',
                stats: [['SKYSCRAPERS RAZED', D.destroyedBldgs + ' / ' + D.totalBldgs], ['MECHA-TITAN MK-IX', won ? 'DESTROYED' : D.mechaSpawned ? 'SURVIVED' : 'NOT SUMMONED'], ['TOTAL KILLS', S.kills]],
                xp: Math.round(180 + S.score * 0.035 + stars * 160)
            };
        }
    });
})(window);
