/* ============================================================================
   BLACKOUT OPS — MINIGAMES: FUN & SPECIALS FLAGSHIP BATCH 3A (Modes 18–20)
     18. Abyssal Trench Exo-Suit — 4,000m deep Mariana Hydrothermal Trench!
         First-person 3D Heavy Diving Exo-Claw & Sonar Rig, bioluminescent
         coral forests, erupting Black Smoker Thermal Vents, Depth-Charge
         Torpedo [Q], Sonar Pulse [E], Viper-Sharks, Anglerfish & KRAKEN REX!
     19. Jurassic Paddock Jeep Safari — Rainforest T-Rex Paddock Breakout!
         Electrified 10m security fences, Jeep Wrangler defense hub, [E] Red
         Road-Flare Lures (distracts Dinosaurs!), [Q] High-Voltage Fence Surge,
         flanking Velociraptors, swooping Pteranodons & ALPHA TYRANNOSAURUS REX!
     20. Ironkeep Castle Trebuchet Siege — Medieval Stone Fortress Battlements!
         Man 2 Counterweight Siege Ballistae [E], tip 2 Boiling-Pitch Cauldrons
         [E] onto Iron Battering Rams below, snipe Rolling Siege Towers & Orc
         Sappers, and slay WARLORD GRIMJAW!
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
        const tex = L.canvasTex('funH-lbl:' + text + ':' + color, 256, 64, (g, w, h) => {
            g.clearRect(0, 0, w, h);
            g.font = '900 26px Bahnschrift, Impact, sans-serif';
            g.textAlign = 'center'; g.textBaseline = 'middle';
            g.lineWidth = 7; g.strokeStyle = 'rgba(0,0,0,0.85)';
            g.strokeText(text, w / 2, h / 2, 240);
            g.fillStyle = color; g.fillText(text, w / 2, h / 2, 240);
        });
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
        s.scale.set(wScale, 0.58, 1);
        return s;
    }

    /* =====================================================================
       18. ABYSSAL TRENCH EXO-SUIT
       4,000m Mariana Trench Floor + Bioluminescent Coral & Black Smoker Vents
       + 3D Exo-Claw Rig + Depth-Charge [Q] + Sonar [E] + KRAKEN LEVIATHAN!
    ===================================================================== */
    function trenchSandTex() {
        return L.canvasTex('abyssal-seabed-v1', 512, 512, (g, w, h) => {
            const gr = g.createRadialGradient(w / 2, h / 2, 30, w / 2, h / 2, 320);
            gr.addColorStop(0, '#0f2942'); gr.addColorStop(1, '#05111f');
            g.fillStyle = gr; g.fillRect(0, 0, w, h);
            const rnd = L.mulberry32(818);
            for (let i = 0; i < 65; i++) {
                g.strokeStyle = `rgba(34,211,238,${0.08 + rnd() * 0.14})`;
                g.lineWidth = 2;
                g.beginPath();
                const y = rnd() * h;
                g.moveTo(0, y);
                g.bezierCurveTo(w * 0.33, y + (rnd() - 0.5) * 35, w * 0.66, y + (rnd() - 0.5) * 35, w, y);
                g.stroke();
            }
        });
    }

    function buildAbyssPredator(kind) {
        const root = new THREE.Group();
        const hit = [];
        const isAngler = kind === 'angler';
        const isKraken = kind === 'kraken';

        if (isKraken) {
            const mantleM = std(0x881337, 0.35, 0.25, { emissive: 0x4c0519, emissiveIntensity: 0.45 });
            const bioCyan = basic(0x22d3ee);
            const bioGold = basic(0xfef08a);

            const mantle = new THREE.Mesh(new THREE.ConeGeometry(2.3, 5.8, 16), mantleM);
            mantle.rotation.x = -Math.PI * 0.38; mantle.position.set(0, 2.6, -1.4);
            const head = new THREE.Mesh(new THREE.SphereGeometry(1.95, 18, 14), mantleM);
            head.position.set(0, 1.4, 0.6);
            const beak = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.2, 10), std(0x1e293b, 0.3, 0.7));
            beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.9, 2.35);
            beak.userData.hitbox = 'head';
            root.add(mantle, head, beak);
            hit.push(mantle, head, beak);

            for (const sx of [-1.15, 1.15]) {
                const eye = new THREE.Mesh(new THREE.SphereGeometry(0.46, 12, 10), bioGold);
                eye.position.set(sx, 1.65, 1.85);
                eye.userData.hitbox = 'head';
                root.add(eye); hit.push(eye);
            }
            // Bioluminescent spots along Kraken mantle
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * TAU;
                const spot = new THREE.Mesh(new THREE.SphereGeometry(0.20, 8, 6), bioCyan);
                spot.position.set(Math.cos(a) * 1.45, 2.4 + (i % 2) * 0.7, -1.1 + Math.sin(a) * 1.1);
                root.add(spot);
            }
            const tentacles = [];
            for (let t = 0; t < 8; t++) {
                const a = (t / 8) * TAU;
                const tg = new THREE.Group();
                tg.position.set(Math.cos(a) * 1.5, 0.75, 1.2 + Math.sin(a) * 1.2);
                const seg1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 2.1, 5, 8), mantleM);
                seg1.rotation.x = Math.PI * 0.42; seg1.position.z = 1.1;
                const tip = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.4, 8), bioCyan);
                tip.rotation.x = Math.PI / 2; tip.position.z = 2.55;
                tg.add(seg1, tip);
                root.add(tg); hit.push(seg1);
                tentacles.push(tg);
            }
            return { root, hit, tentacles, tailPivot: null };
        }

        const sc = isAngler ? 1.28 : 1.0;
        const bodyCol = isAngler ? 0x311042 : 0x0f766e;
        const glowCol = isAngler ? 0xfacc15 : 0x22d3ee;
        const skinM = std(bodyCol, 0.28, 0.35, { emissive: bodyCol, emissiveIntensity: 0.28 });

        const torso = new THREE.Mesh(new THREE.SphereGeometry(0.75 * sc, 16, 12), skinM);
        torso.scale.set(isAngler ? 1.05 : 0.68, isAngler ? 1.0 : 0.72, isAngler ? 1.25 : 1.85);
        const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.72 * sc, 0.28 * sc, 0.68 * sc), skinM);
        jaw.position.set(0, -0.32 * sc, 0.65 * sc); jaw.rotation.x = 0.28;
        jaw.userData.hitbox = 'head';
        root.add(torso, jaw);
        hit.push(torso, jaw);

        for (const sx of [-0.28, 0.28]) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.13 * sc, 8, 6), basic(glowCol));
            eye.position.set(sx * sc, 0.22 * sc, 0.72 * sc);
            eye.userData.hitbox = 'head';
            root.add(eye);
            for (let f = -1; f <= 1; f += 2) {
                const fang = new THREE.Mesh(new THREE.ConeGeometry(0.045 * sc, 0.24 * sc, 6), basic(0xf8fafc));
                fang.position.set((sx + f * 0.08) * sc, -0.18 * sc, 0.92 * sc);
                root.add(fang);
            }
        }

        // Anglerfish glowing esca lantern lure!
        if (isAngler) {
            const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.35, 8), skinM);
            stalk.position.set(0, 0.85, 0.65); stalk.rotation.x = 0.62;
            const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), basic(0xfef08a));
            bulb.position.set(0, 1.35, 1.15);
            bulb.userData.hitbox = 'head';
            root.add(stalk, bulb); hit.push(bulb);
        } else {
            const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.78, 6), basic(0x22d3ee));
            dorsal.position.set(0, 0.68, -0.1); dorsal.rotation.x = -0.3;
            root.add(dorsal);
        }

        const tailPivot = new THREE.Group();
        tailPivot.position.set(0, 0, -1.05 * sc);
        const fin = new THREE.Mesh(new THREE.ConeGeometry(0.58 * sc, 0.85 * sc, 4), basic(glowCol));
        fin.scale.set(0.22, 1.15, 0.9); fin.rotation.x = -Math.PI / 2; fin.position.z = -0.35 * sc;
        tailPivot.add(fin);
        root.add(tailPivot);
        return { root, hit, tailPivot, tentacles: null };
    }

    MG.register({
        id: 'fun_abyssal_mech', cat: 'fun', order: 18,
        name: 'Abyssal Trench Exo-Suit', icon: '🤿', accent: '#06b6d4', badge: '4,000M DEEP',
        tagline: 'Walk the bioluminescent Mariana Trench in a Diving Exo-Suit, fire Depth-Charges & slay the Kraken!',
        desc: 'Descend 4,000 meters to the crushing bioluminescent floor of the Mariana Trench to defend Deep-Sea Research Habitat NEREUS-7! Stride in low-buoyancy Exo-Armor past glowing Neon Coral Pillars and erupting Black Smoker Hydrothermal Vents, fire [Q] Concussion Depth-Charge Torpedoes into packs of Viper-Sharks & Lantern Anglerfish, ping [E] Active Sonar to stun predators + boost crit damage, and vanquish the colossal ABYSSAL KRAKEN!',
        guide: {
            objective: 'Defend Research Habitat Dome NEREUS-7 from deep-sea Viper-Sharks, Lantern Anglerfish, and the colossal ABYSSAL KRAKEN!',
            tips: [
                'Press [Q] (9s cooldown) to launch a CONCUSSION DEPTH-CHARGE TORPEDO that detonates in a huge cyan shockwave!',
                'Press [E] (11s cooldown) for an ACTIVE SONAR PULSE—briefly stuns every abyssal creature and refills +20% Exo-Suit Hull Pressure!',
                'Stand on warm golden HYDROTHERMAL VENT RINGS sparingly: they launch you upward on thermal currents so you can vault onto coral ridges!'
            ]
        },
        heroLabel: 'FUN & SPECIALS • DEEP-SEA TRENCH DEFENSE', duration: 165,
        stars: [2800, 5600, 9200, 13400],
        standardWeapon: 'galil_ar', lockWeapon: true, infiniteMag: true, forgivingMisses: true, customMusic: true,
        weaponLabel: 'HARPOON GALIL + DEPTH TORPEDO [Q] + SONAR [E]', weaponNote: '[Q] Concussion Depth-Charge (9s) • [E] Sonar Stun Pulse (11s) • Hold [SPACE] Hydro-Jets!',
        keys: [['WASD', 'Exo-Suit Stride'], ['HOLD SPACE', 'Hydro-Thruster Boost'], ['Q', 'Depth-Charge Torpedo'], ['E', 'Active Sonar Stun']],
        map: {
            atmosphere: { skyTop: 0x020617, skyBottom: 0x082f49, fogColor: 0x041e34, fogDensity: 0.016, sunColor: 0x38bdf8, sunIntensity: 1.15, sunPos: [10, 60, 10], hemiSky: 0x22d3ee, hemiGround: 0x082f49, hemiIntensity: 0.95 },
            boxes: [
                B(0, -0.5, 0, 64, 1, 64, 'desert_sand'),
                B(-32, 10, 0, 2, 20, 64, 'concrete'), B(32, 10, 0, 2, 20, 64, 'concrete'),
                B(0, 10, -32, 64, 20, 2, 'concrete'), B(0, 10, 32, 64, 20, 2, 'concrete')
            ],
            spawn: { x: 0, y: 0.2, z: 15, yaw: 0 }
        },
        countdown: 3,
        build(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.start('abyssal');
            const D = S.data;
            Object.assign(D, {
                domeHp: 100, beasts: [], torpedoes: [], vents: [], torpCd: 0, sonarCd: 0,
                spawnCd: 1.2, slain: 0, kraken: null, krakenSpawned: false, krakenSlain: false
            });

            // Trench Floor + Towering Basalt Trench Cliffs + Overhead Shimmering Caustic Surface Rays!
            const bed = new THREE.Mesh(new THREE.PlaneGeometry(63, 63), new THREE.MeshStandardMaterial({ map: trenchSandTex(), roughness: 0.85 }));
            bed.rotation.x = -Math.PI / 2; bed.position.y = 0.02; S.add(bed);

            const basalt = std(0x0f172a, 0.92);
            for (let i = 0; i < 24; i++) {
                const a = (i / 24) * TAU, r = 29.5;
                const spire = new THREE.Mesh(new THREE.ConeGeometry(3.4 + (i % 3), 14 + (i % 4) * 3.5, 7), basalt);
                spire.position.set(Math.cos(a) * r, 6.5, Math.sin(a) * r);
                S.add(spire);
            }

            // Research Habitat Glass Dome NEREUS-7 at (0, 0, 18.5)!
            const domeG = new THREE.Group();
            domeG.position.set(0, 0, 18.5);
            const baseRing = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.6, 1.1, 24), std(0xf59e0b, 0.3, 0.85));
            baseRing.position.y = 0.55;
            const glass = new THREE.Mesh(new THREE.SphereGeometry(4.9, 24, 16, 0, TAU, 0, Math.PI * 0.5), new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.45, transparent: true, opacity: 0.55 }));
            glass.position.y = 1.0;
            const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), basic(0xfef08a));
            beacon.position.y = 6.2;
            const sign = A.sign('🤿 HABITAT NEREUS-7 — PROTECT DOME! 🤿', 7.2, 0.85, { bg: '#082f49', color: '#67e8f9', borderColor: '#22d3ee', size: 0.30, glow: '#22d3ee' });
            sign.position.set(0, 7.2, 0);
            domeG.add(baseRing, glass, beacon, sign);
            S.add(domeG);
            // Bioluminescent Perimeter Beacon Bulbs around Habitat NEREUS-7!
            const dPts = [];
            for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; dPts.push(V(Math.cos(a) * 5.4, 1.18, 18.5 + Math.sin(a) * 5.4)); }
            const dBulbs = A.bulbs(dPts, [0x22d3ee, 0xfacc15, 0x4ade80], 0.12);
            S.add(dBulbs); A.animateBulbs(S, dBulbs, 4, 'chase');
            S.collider(-5.0, 0, 13.5, 5.0, 5.5, 23.5);
            D.domePos = V(0, 2.0, 18.5);

            // Bioluminescent Coral Reef Forests & Elevated Basalt Sniper Ridges!
            const coralCols = [0x22d3ee, 0xe879f9, 0x4ade80, 0xf43f5e, 0xfacc15];
            const rnd = L.mulberry32(4000);
            for (let c = 0; c < 18; c++) {
                const cx = (rnd() - 0.5) * 46, cz = -20 + rnd() * 30;
                if (Math.hypot(cx, cz - 16) < 7.5) continue;
                const col = coralCols[c % coralCols.length];
                const cg = new THREE.Group(); cg.position.set(cx, 0, cz);
                const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.3, 0), basalt);
                rock.scale.y = 0.65; rock.position.y = 0.4; cg.add(rock);
                for (let br = 0; br < 3; br++) {
                    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.16, 1.8 + rnd() * 1.6, 10), basic(col));
                    tube.position.set((br - 1) * 0.42, 1.3, (rnd() - 0.5) * 0.4);
                    tube.rotation.z = (br - 1) * 0.22;
                    cg.add(tube);
                }
                S.add(cg);
            }

            // 3 Black Smoker Hydrothermal Updraft Vents!
            for (const [vx, vz] of [[-11, -3], [11, -3], [0, -10]]) {
                const chimney = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.2, 10, 1, true), basalt);
                chimney.position.set(vx, 1.1, vz); S.add(chimney);
                const glow = new THREE.Mesh(new THREE.CircleGeometry(1.15, 16), basic(0xf97316));
                glow.rotation.x = -Math.PI / 2; glow.position.set(vx, 0.12, vz); S.add(glow);
                const lbl = labelSprite('♨️ THERMAL UPDRAFT', '#fdba74', 2.2);
                lbl.position.set(vx, 2.8, vz); S.add(lbl);
                D.vents.push(V(vx, 0, vz));
            }

            // First-person Left-Hand Heavy Exo-Suit Titanium Pincer Claw!
            D.exoRig = new THREE.Group();
            const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.10, 0.48, 12), std(0xf59e0b, 0.3, 0.85));
            arm.rotation.x = Math.PI / 2; arm.position.set(-0.44, -0.34, -0.48);
            const clawL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.09, 0.22), std(0xe2e8f0, 0.2, 0.9));
            clawL.position.set(-0.50, -0.34, -0.74); clawL.rotation.y = -0.2;
            const clawR = clawL.clone(); clawR.position.x = -0.38; clawR.rotation.y = 0.2;
            const gauge = new THREE.Mesh(new THREE.RingGeometry(0.035, 0.055, 16), basic(0x22d3ee));
            gauge.position.set(-0.44, -0.22, -0.44);
            D.exoRig.add(arm, clawL, clawR, gauge);
            S.add(D.exoRig);
            S.animate(() => {
                const c = BO.App && BO.App.worldCamera;
                if (c && D.exoRig) {
                    D.exoRig.position.copy(c.position);
                    D.exoRig.quaternion.copy(c.quaternion);
                }
            });

            D.onKey = (e) => {
                if (MG.session !== S || MG.state !== 'running') return;
                if (e.code === 'KeyQ') this._fireDepthTorpedo(S);
                else if (e.code === 'KeyE') this._fireSonarPulse(S);
            };
            window.addEventListener('keydown', D.onKey);
        },
        dispose(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.stop();
            if (S.data.onKey) window.removeEventListener('keydown', S.data.onKey);
            if (S.data.exoRig && S.data.exoRig.parent) S.data.exoRig.parent.remove(S.data.exoRig);
        },
        _fireDepthTorpedo(S) {
            const D = S.data, cam = BO.App.worldCamera;
            if (D.torpCd > 0 || !cam) return;
            D.torpCd = 9.0;
            const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
            const tg = new THREE.Group();
            const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.20, 0.75, 6, 10), std(0xfacc15, 0.25, 0.85));
            hull.rotation.x = Math.PI / 2;
            const nose = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 8), basic(0x22d3ee));
            nose.position.z = 0.45;
            tg.add(hull, nose);
            tg.position.copy(cam.position).addScaledVector(fwd, 1.4);
            tg.lookAt(tg.position.clone().add(fwd));
            S.add(tg);
            tone(240, 95, 0.24, 'sawtooth', 0.12);
            D.torpedoes.push({ mesh: tg, vel: fwd.multiplyScalar(28), life: 2.6 });
        },
        _fireSonarPulse(S) {
            const D = S.data, P = BO.Player;
            if (D.sonarCd > 0) return;
            D.sonarCd = 11.0;
            if (BO.MinigameAudio) BO.MinigameAudio.sonarPing(); else tone(880, 440, 0.35, 'sine', 0.13);
            BO.FX.spawnParticles(P.pos.clone().add(V(0, 1.2, 0)), 28, 0x22d3ee, 8, 2, 0.55, 0.9);
            P.hp = Math.min(P.maxHp, P.hp + 25);
            let stunned = 0;
            for (const b of D.beasts) {
                if (b.tgt.alive) { b.stunT = 3.2; stunned++; }
            }
            MG.toast(`📡 ACTIVE SONAR PING — ${stunned} PREDATORS STUNNED (+25 HP)!`, '#67e8f9');
        },
        _spawnBeast(S, kind) {
            const D = S.data;
            const isKraken = kind === 'kraken';
            if (!isKraken && D.beasts.length >= 9) return;
            const built = buildAbyssPredator(kind);
            const pos = isKraken ? V(0, 4.5, -23) : V((Math.random() - 0.5) * 44, 2.2 + Math.random() * 5.5, -25 - Math.random() * 4);
            const maxHp = isKraken ? 62 : kind === 'angler' ? 6 : 3;
            const tgt = S.addTarget({
                kind: 'abyss_' + kind, mesh: built.root, hitMeshes: built.hit, pos,
                hp: maxHp, life: 0, points: isKraken ? 3200 : kind === 'angler' ? 340 : 210,
                appear: 'scale', death: 'burst', deathColor: isKraken ? 0xf43f5e : 0x22d3ee,
                onKill: () => {
                    D.slain++;
                    D.beasts = D.beasts.filter((x) => x.tgt !== tgt);
                    if (isKraken) {
                        D.krakenSlain = true;
                        BO.FX.spawnExplosion(tgt.basePos.clone(), 9.0, 0x22d3ee);
                        SFX.fanfare();
                        MG.finish('🐙 ABYSSAL KRAKEN VANQUISHED — NEREUS-7 SECURE!', { color: '#67e8f9', delay: 2.0 });
                    }
                }
            });
            const entry = { kind, isKraken, maxHp, tgt, built, speed: isKraken ? 2.6 : kind === 'angler' ? 3.5 : 5.6, phase: Math.random() * 6, stunT: 0, atkCd: 1.8 };
            D.beasts.push(entry);
            if (isKraken) {
                D.kraken = entry;
                MG.toast('🐙 SEISMIC TRENCH ALERT: COLOSSAL ABYSSAL KRAKEN SURFACING!', '#f43f5e');
                SFX.rumble(0.9);
            }
        },
        update(S, dt, lib, state) {
            if (state !== 'running') return;
            if (BO.MinigameAudio) BO.MinigameAudio.tick(dt);
            const D = S.data, P = BO.Player;
            D.torpCd = Math.max(0, D.torpCd - dt);
            D.sonarCd = Math.max(0, D.sonarCd - dt);

            // Underwater Low-Buoyancy Physics + Hydro-Thrusters [SPACE] + Black Smoker Updrafts!
            if (!P.onGround) P.vel.y += 9.5 * dt;
            if (P.keys['Space']) { P.vel.y = Math.min(8.5, P.vel.y + 19 * dt); P.onGround = false; }
            for (const v of D.vents) {
                if (Math.random() < dt * 8) BO.FX.spawnParticles(v.clone().add(V(0, 1.8, 0)), 1, 0x38bdf8, 1.2, 4.5, 0.5, 0.8);
                if (Math.hypot(P.pos.x - v.x, P.pos.z - v.z) < 1.9 && P.pos.y < 3.0) {
                    P.vel.y = 12.5; P.onGround = false;
                }
            }

            // Update Concussion Depth-Charge Torpedoes
            for (let i = D.torpedoes.length - 1; i >= 0; i--) {
                const tp = D.torpedoes[i];
                tp.life -= dt;
                tp.mesh.position.addScaledVector(tp.vel, dt);
                if (Math.random() < dt * 25) BO.FX.spawnParticles(tp.mesh.position, 2, 0xe0f2fe, 1.5, 1, 0.25, 0.5);
                let hit = tp.life <= 0 || tp.mesh.position.y <= 0.2;
                for (const b of D.beasts) {
                    if (b.tgt.alive && b.tgt.basePos.distanceTo(tp.mesh.position) < (b.isKraken ? 4.2 : 2.2)) { hit = true; break; }
                }
                if (hit) {
                    const c = tp.mesh.position.clone();
                    BO.FX.spawnExplosion(c, 6.2, 0x22d3ee);
                    SFX.rumble(0.55);
                    for (const b of D.beasts.slice()) {
                        if (b.tgt.alive && b.tgt.basePos.distanceTo(c) < 7.5) {
                            b.tgt.hp -= 8;
                            if (b.tgt.hp <= 0) {
                                S.award(300, b.tgt.basePos.clone(), '💥 DEPTH-CHARGE!', '#67e8f9');
                                S.kills++; S.bumpCombo();
                                b.tgt.kill({ pt: c });
                            }
                        }
                    }
                    S.scene.remove(tp.mesh); D.torpedoes.splice(i, 1);
                }
            }

            if (!D.krakenSpawned && (D.slain >= 15 || S.t >= 65)) {
                D.krakenSpawned = true;
                this._spawnBeast(S, 'kraken');
            }
            D.spawnCd -= dt;
            if (D.spawnCd <= 0) {
                D.spawnCd = 2.5;
                this._spawnBeast(S, Math.random() < 0.36 ? 'angler' : 'shark');
            }

            // Animate swimming Trench Predators & Kraken Tentacles!
            for (const b of D.beasts) {
                if (!b.tgt.alive) continue;
                b.phase += dt * 7.5;
                if (b.built.tailPivot) b.built.tailPivot.rotation.y = Math.sin(b.phase * 1.4) * 0.55;
                if (b.built.tentacles) {
                    b.built.tentacles.forEach((tg, idx) => {
                        tg.rotation.x = Math.sin(b.phase * 0.6 + idx) * 0.35;
                        tg.rotation.y = Math.cos(b.phase * 0.5 + idx) * 0.25;
                    });
                }
                if (b.stunT > 0) { b.stunT -= dt; continue; }

                const goal = b.isKraken || Math.random() < 0.45 ? D.domePos : P.pos.clone().add(V(0, 1.3, 0));
                const toG = D.domePos.clone().sub(b.tgt.basePos);
                const distDome = toG.length();
                const toP = P.pos.clone().add(V(0, 1.3, 0)).sub(b.tgt.basePos);
                const chaseVec = toP.length() < 11 ? toP : toG;
                const d = Math.max(0.1, chaseVec.length());
                if (d > (b.isKraken ? 8.5 : 3.2)) {
                    b.tgt.basePos.addScaledVector(chaseVec.divideScalar(d), b.speed * dt);
                }
                b.tgt.basePos.y = Math.max(1.2, b.tgt.basePos.y + Math.sin(b.phase * 0.4) * 0.02);
                b.tgt.root.position.copy(b.tgt.basePos);
                b.tgt.root.lookAt(P.pos.x, b.tgt.basePos.y, P.pos.z);

                b.atkCd -= dt;
                if (b.atkCd <= 0) {
                    if (b.tgt.basePos.distanceTo(P.pos) < (b.isKraken ? 13 : 4.2)) {
                        b.atkCd = 1.5;
                        P.takeDamage(b.isKraken ? 13 : 8, b.tgt.basePos, true);
                    } else if (distDome < 9.5) {
                        b.atkCd = 1.6;
                        D.domeHp = Math.max(0, D.domeHp - (b.isKraken ? 7 : 3.5));
                    }
                }
            }

            if (D.domeHp <= 0) MG.finish('HABITAT NEREUS-7 IMPLODED', { color: '#f87171' });
            else if (!P.alive) MG.finish('EXO-SUIT HULL BREACHED', { color: '#f87171' });
        },
        hud(S) {
            const D = S.data, kr = D.kraken && D.kraken.tgt.alive ? D.kraken : null;
            return `<div class="fun-panel">
                <div class="mgx-chip ${D.domeHp < 35 ? 'mgx-hot' : ''}">🤿 DOME HULL <b>${Math.ceil(D.domeHp)}%</b></div>
                <div class="mgx-chip ${D.torpCd <= 0 ? 'mgx-hot' : ''}">🚀 DEPTH-CHARGE [Q] <b>${D.torpCd <= 0 ? 'READY' : D.torpCd.toFixed(1) + 's'}</b></div>
                <div class="mgx-chip ${D.sonarCd <= 0 ? 'mgx-hot' : ''}">📡 SONAR [E] <b>${D.sonarCd <= 0 ? 'READY' : D.sonarCd.toFixed(1) + 's'}</b></div>
            </div>
            ${kr ? `<div class="fun-panel" style="margin-top:5px;"><div class="fun-bar-wrap"><div class="fun-bar-lbl"><span>🐙 COLOSSAL ABYSSAL KRAKEN</span><b>${Math.max(0, Math.round(kr.tgt.hp))} / ${kr.maxHp}</b></div><div class="fun-bar"><i style="width:${Math.max(0, Math.round(kr.tgt.hp / kr.maxHp * 100))}%;background:linear-gradient(90deg,#06b6d4,#f43f5e)"></i></div></div></div>` : ''}`;
        },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return {
                score: S.score, stars,
                title: D.krakenSlain ? 'LEVIATHAN SLAYER OF NEREUS-7' : 'TRENCH DIVE CONCLUDED',
                stats: [['ABYSSAL BEASTS SLAIN', D.slain], ['ABYSSAL KRAKEN', D.krakenSlain ? 'VANQUISHED' : D.krakenSpawned ? 'SURVIVED' : 'NOT SURFACED'], ['HABITAT DOME INTEGRITY', Math.ceil(D.domeHp) + '%']],
                xp: Math.round(185 + S.score * 0.032 + stars * 155)
            };
        }
    });

    /* =====================================================================
       19. JURASSIC PADDOCK JEEP SAFARI
       Isla Nublar Rainforest Paddock + Safari Tour Jeep + Red Road-Flare
       Lures [E] + High-Voltage Fence Surge [Q] + Raptors, Pteranodons & T-REX!
    ===================================================================== */
    function buildDinosaur(kind) {
        const root = new THREE.Group();
        const hit = [];
        const isRex = kind === 'trex';
        const isPtera = kind === 'ptera';

        if (isPtera) {
            const wingM = std(0x9a3412, 0.65, 0.1, { side: THREE.DoubleSide });
            const crestM = std(0xfacc15, 0.4);
            const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.85, 5, 8), wingM);
            torso.rotation.x = Math.PI / 2;
            const beak = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.05, 6), crestM);
            beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.12, 0.95);
            beak.userData.hitbox = 'head';
            const crest = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.65, 6), crestM);
            crest.rotation.x = -Math.PI * 0.42; crest.position.set(0, 0.28, 0.25);
            root.add(torso, beak, crest);
            hit.push(torso, beak);

            const wings = [];
            for (const sx of [-1, 1]) {
                const wg = new THREE.Group();
                const mem = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.06, 0.85), wingM);
                mem.position.x = sx * 1.05;
                wg.add(mem); root.add(wg); hit.push(mem);
                wings.push({ wg, sx });
            }
            return { root, hit, legs: [], wings, tail: null };
        }

        const sc = isRex ? 2.45 : 0.95;
        const hideM = std(isRex ? 0x4d3b27 : 0x3f6212, 0.78);
        const stripeM = std(isRex ? 0x78350f : 0xd97706, 0.7);
        const bellyM = std(0xd6d3d1, 0.85);

        const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.46 * sc, 1.15 * sc, 6, 12), hideM);
        body.rotation.x = Math.PI * 0.42; body.position.set(0, 1.18 * sc, 0);
        const belly = new THREE.Mesh(new THREE.CapsuleGeometry(0.36 * sc, 0.95 * sc, 5, 10), bellyM);
        belly.rotation.x = Math.PI * 0.42; belly.position.set(0, 1.04 * sc, 0.08 * sc);

        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * sc, 0.38 * sc, 0.72 * sc, 10), hideM);
        neck.position.set(0, 1.62 * sc, 0.68 * sc); neck.rotation.x = 0.45;
        const skull = new THREE.Mesh(new THREE.BoxGeometry(0.54 * sc, 0.48 * sc, 0.92 * sc), hideM);
        skull.position.set(0, 1.92 * sc, 1.12 * sc);
        skull.userData.hitbox = 'head';
        const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.46 * sc, 0.22 * sc, 0.78 * sc), stripeM);
        jaw.position.set(0, 1.62 * sc, 1.08 * sc); jaw.rotation.x = 0.22;
        jaw.userData.hitbox = 'head';

        for (const sx of [-0.24, 0.24]) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07 * sc, 8, 6), basic(0xfacc15));
            eye.position.set(sx * sc, 2.02 * sc, 1.25 * sc);
            root.add(eye);
            // Tiny forelimbs!
            const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07 * sc, 0.28 * sc, 4, 6), hideM);
            arm.position.set(sx * 1.3 * sc, 1.15 * sc, 0.65 * sc); arm.rotation.x = 0.6;
            root.add(arm);
        }

        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.38 * sc, 1.95 * sc, 10), stripeM);
        tail.rotation.x = -Math.PI * 0.48; tail.position.set(0, 1.12 * sc, -1.35 * sc);

        const legs = [];
        for (const sx of [-0.36, 0.36]) {
            const lg = new THREE.Group();
            lg.position.set(sx * sc, 0.95 * sc, -0.05 * sc);
            const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.20 * sc, 0.62 * sc, 5, 8), hideM);
            thigh.position.y = -0.35 * sc;
            const foot = new THREE.Mesh(new THREE.BoxGeometry(0.28 * sc, 0.14 * sc, 0.48 * sc), stripeM);
            foot.position.set(0, -0.86 * sc, 0.12 * sc);
            lg.add(thigh, foot);
            root.add(lg); hit.push(thigh);
            legs.push(lg);
        }

        root.add(body, belly, neck, skull, jaw, tail);
        hit.push(body, neck, skull, jaw, tail);
        root.traverse((m) => { if (m.isMesh) m.castShadow = true; });
        return { root, hit, legs, wings: null, tail };
    }

    function buildSafariJeep() {
        const g = new THREE.Group();
        const bodyTan = std(0xd6d3d1, 0.45, 0.35);
        const redStripe = std(0xdc2626, 0.35, 0.4);
        const rollCage = std(0x1e293b, 0.4, 0.8);
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.95, 4.8), bodyTan);
        chassis.position.y = 0.92;
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.56, 0.28, 4.4), redStripe);
        stripe.position.y = 0.95;
        const hood = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.32, 1.6), redStripe);
        hood.position.set(0, 1.48, 1.45);
        g.add(chassis, stripe, hood);
        for (const [wx, wz] of [[-1.3, 1.5], [1.3, 1.5], [-1.3, -1.5], [1.3, -1.5]]) {
            const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.38, 16), std(0x18181b, 0.9));
            tire.rotation.z = Math.PI / 2; tire.position.set(wx, 0.52, wz);
            g.add(tire);
        }
        for (const sx of [-1.05, 1.05]) {
            const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.35, 8), rollCage);
            bar.position.set(sx, 2.0, -0.4); g.add(bar);
        }
        for (const hx of [-0.78, 0.78]) {
            const hl = new THREE.Mesh(new THREE.CircleGeometry(0.22, 14), basic(0xfef08a));
            hl.position.set(hx, 1.05, 2.42); g.add(hl);
        }
        return g;
    }

    MG.register({
        id: 'fun_dino_safari', cat: 'fun', order: 19,
        name: 'Jurassic Paddock Jeep Safari', icon: '🦖', accent: '#84cc16', badge: 'DINO BREAKOUT',
        tagline: 'T-Rex Paddock Breach! Toss Red Flares [E], electrify 10,000V Fences [Q] & bring down Rexy!',
        desc: 'Tropical storm alert on Isla Nublar: the 10,000-Volt T-Rex Paddock has lost power and Safari Jeep #18 is stalled on the mud road! Hold off packs of leaping Velociraptors and swooping Pteranodons while protecting the Safari Jeep! Toss [E] Red Chemical Road-Flares to lure Dinosaurs away from you & the Jeep, trigger [Q] Emergency 10,000V Paddock Fence Arcs to fry flankers, and survive the earth-shaking charge of ALPHA TYRANNOSAURUS REX!',
        guide: {
            objective: 'Keep Safari Jeep #18 intact until extraction—or take down ALPHA TYRANNOSAURUS REX when it smashes through the Paddock Gate!',
            tips: [
                'Press [E] (10s cooldown) to throw a sizzling RED ROAD FLARE—all Raptors and even the T-Rex are irresistibly drawn to chase the flare for 5.5s!',
                'Press [Q] (14s cooldown) to pulse the 10,000-VOLT PERIMETER PYLONS, zapping up to 4 Dinosaurs with high-voltage arcs!',
                'Aim for the T-Rex\'s massive roaring Jaws & Skull for 1.5x critical rifle damage!'
            ]
        },
        heroLabel: 'FUN & SPECIALS • PREHISTORIC PADDOCK SURVIVAL', duration: 165,
        stars: [2800, 5600, 9200, 13600],
        standardWeapon: 'm249', secondaryWeapon: 'spas12_tac', lockWeapon: true, infiniteMag: true, forgivingMisses: true, customMusic: true,
        weaponLabel: 'RANGER M249 SAW + SPAS-12 + FLARE [E]', weaponNote: '[E] Toss Red Dino-Lure Flare (10s) • [Q] 10,000V Fence Surge (14s)',
        keys: [['WASD', 'Evade Through Mud'], ['E', 'Throw Red Flare (10s)'], ['Q', '10,000V Fence Surge (14s)'], ['1 / 2', 'Swap LMG / Shotgun']],
        map: {
            atmosphere: { skyTop: 0x0f172a, skyBottom: 0x134e4a, fogColor: 0x112b29, fogDensity: 0.011, sunColor: 0x99f6e4, sunIntensity: 1.05, sunPos: [-25, 45, 20], hemiSky: 0x5eead4, hemiGround: 0x1c1917, hemiIntensity: 0.85 },
            boxes: [
                B(0, -0.5, 0, 62, 1, 62, 'grass'),
                B(-31, 8, 0, 1, 16, 62, 'concrete'), B(31, 8, 0, 1, 16, 62, 'concrete'),
                B(0, 8, -31, 62, 16, 1, 'concrete'), B(0, 8, 31, 62, 16, 1, 'concrete')
            ],
            spawn: { x: 0, y: 0.1, z: 10, yaw: 0 }
        },
        countdown: 3,
        build(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.start('jurassic');
            const D = S.data;
            Object.assign(D, {
                jeepHp: 100, dinos: [], flares: [], pylons: [], flareCd: 0, surgeCd: 0,
                spawnCd: 1.2, slain: 0, trex: null, trexSpawned: false, trexSlain: false
            });

            // Muddy Safari Tour Track + Jungle Floor + Towering 10,000V Electrified Steel Paddock Fence & Concrete Gate!
            const groundTex = L.canvasTex('isla-mud-road', 512, 512, (g, w, h) => {
                g.fillStyle = '#14532d'; g.fillRect(0, 0, w, h);
                g.fillStyle = '#451a03'; g.fillRect(w / 2 - 68, 0, 136, h);
                g.strokeStyle = '#78350f'; g.lineWidth = 8;
                g.strokeRect(w / 2 - 48, 0, 26, h); g.strokeRect(w / 2 + 22, 0, 26, h);
            });
            const ground = new THREE.Mesh(new THREE.PlaneGeometry(61, 61), new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.92 }));
            ground.rotation.x = -Math.PI / 2; ground.position.y = 0.02; S.add(ground);

            // Iconic Torch-Lit Wooden JURASSIC PADDOCK Archway at North End (z = -24)!
            const gateWood = std(0x451a03, 0.85), concreteM = std(0x64748b, 0.8);
            for (const sx of [-7.5, 7.5]) {
                S.box(sx, 5.2, -24, 2.6, 10.4, 2.6, concreteM, { solid: true });
                S.add(A.torch(S, V(sx, 4.5, -22.4), 0xf97316, false));
            }
            S.box(0, 9.6, -24, 18.0, 2.0, 2.4, gateWood, { solid: false });
            const pSign = A.sign('⚠️ CAUTION: 10,000 VOLTS — TYRANNOSAUR PADDOCK 09 ⚠️', 13.5, 1.15, { bg: '#450a0a', color: '#fde047', borderColor: '#ef4444', size: 0.34, glow: '#f59e0b' });
            pSign.position.set(0, 9.6, -22.65); S.add(pSign);
            // Chasing Red/Amber High-Voltage Warning Bulbs along the Jurassic Paddock Arch!
            const archPts = [];
            for (let x = -7.5; x <= 7.5; x += 1.5) archPts.push(V(x, 10.65, -22.5));
            const archBulbs = A.bulbs(archPts, [0xef4444, 0xfacc15], 0.14);
            S.add(archBulbs); A.animateBulbs(S, archBulbs, 6, 'chase');

            // 10,000V Perimeter Fence Pylons with Red Warning Insulators & Steel Cables!
            const cableMat = basic(0x94a3b8);
            for (let i = -24; i <= 24; i += 12) {
                for (const side of [-27, 27]) {
                    const pyl = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.45, 8.5, 10), concreteM);
                    pyl.position.set(side, 4.25, i); S.add(pyl);
                    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), basic(0xef4444));
                    beacon.position.set(side, 8.7, i); S.add(beacon);
                    D.pylons.push(V(side, 5.5, i));
                }
            }
            for (const side of [-27, 27]) {
                for (const cy of [2.2, 4.5, 6.8]) {
                    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 52, 6), cableMat);
                    wire.rotation.x = Math.PI / 2; wire.position.set(side, cy, 0); S.add(wire);
                }
            }

            // Lush Jungle Trees & Boulder Cover around the road
            for (let t = 0; t < 16; t++) {
                const tx = (t % 2 ? 1 : -1) * (11 + (t % 4) * 3.8);
                const tz = -20 + Math.floor(t / 2) * 5.4;
                const tree = A.tree(1.45 + (t % 3) * 0.35);
                tree.position.set(tx, 0, tz); S.add(tree);
            }

            // Stalled Safari Jeep #18 at (0, 0, 14.5)
            const jeep = buildSafariJeep();
            jeep.position.set(0, 0, 14.5); jeep.rotation.y = 0.24;
            const jLbl = labelSprite('🚙 SAFARI JEEP #18', '#fde047', 2.4);
            jLbl.position.set(0, 3.2, 0); jeep.add(jLbl);
            S.add(jeep);
            S.collider(-1.5, 0, 12.2, 1.5, 2.4, 16.8);
            D.jeepPos = V(0, 0, 14.5);

            D.onKey = (e) => {
                if (MG.session !== S || MG.state !== 'running') return;
                if (e.code === 'KeyE') this._tossRoadFlare(S);
                else if (e.code === 'KeyQ') this._fenceSurge(S);
            };
            window.addEventListener('keydown', D.onKey);
        },
        dispose(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.stop();
            if (S.data.onKey) window.removeEventListener('keydown', S.data.onKey);
        },
        _tossRoadFlare(S) {
            const D = S.data, cam = BO.App.worldCamera, P = BO.Player;
            if (D.flareCd > 0 || !cam) return;
            D.flareCd = 10.0;
            const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
            const land = P.pos.clone().addScaledVector(V(fwd.x, 0, fwd.z).normalize(), 9.5);
            land.x = BO.Math.clamp(land.x, -22, 22);
            land.z = BO.Math.clamp(land.z, -20, 22);
            land.y = 0.12;

            const fg = new THREE.Group(); fg.position.copy(land);
            const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.55, 8), std(0xdc2626, 0.5));
            stick.rotation.z = Math.PI / 2;
            const glow = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), basic(0xf43f5e));
            glow.position.x = 0.28;
            const ptL = new THREE.PointLight(0xf43f5e, 1.8, 16, 1.5);
            ptL.position.y = 0.5;
            const lbl = labelSprite('🧨 DINO LURE FLARE!', '#fda4af', 2.2);
            lbl.position.y = 1.2;
            fg.add(stick, glow, ptL, lbl); S.add(fg);
            tone(580, 920, 0.18, 'sawtooth', 0.10);
            MG.toast('🧨 RED ROAD-FLARE LIT — DINOSAURS DISTRACTED!', '#fda4af');
            D.flares.push({ grp: fg, pos: land, life: 5.5 });
        },
        _fenceSurge(S) {
            const D = S.data;
            if (D.surgeCd > 0) return;
            D.surgeCd = 14.0;
            tone(160, 880, 0.30, 'sawtooth', 0.13);
            const live = D.dinos.filter((d) => d.tgt.alive).slice(0, 4);
            for (const d of live) {
                const nearPylon = D.pylons[Math.floor(Math.random() * D.pylons.length)];
                const hitPt = d.tgt.basePos.clone().add(V(0, 1.5, 0));
                BO.FX.spawnTracer(nearPylon, hitPt, 0x38bdf8, 0.18, 0.25);
                BO.FX.spawnParticles(hitPt, 14, 0xfef08a, 5, 3, 0.35, 0.8);
                d.tgt.hp -= 5;
                if (d.tgt.hp <= 0) {
                    S.award(280, hitPt, '⚡ 10,000V ZAP!', '#67e8f9');
                    S.kills++; S.bumpCombo();
                    d.tgt.kill({ pt: hitPt });
                }
            }
            MG.toast(`⚡ 10,000V PADDOCK SURGE ZAPPED ${live.length} DINOSAUR(S)!`, '#fde047');
        },
        _spawnDino(S, kind) {
            const D = S.data;
            const isRex = kind === 'trex';
            const isPtera = kind === 'ptera';
            if (!isRex && D.dinos.length >= 9) return;
            const built = buildDinosaur(kind);
            const pos = isRex ? V(0, 0, -25) : isPtera ? V((Math.random() - 0.5) * 36, 7.5, -24) : V((Math.random() - 0.5) * 34, 0, -23 - Math.random() * 4);
            const maxHp = isRex ? 68 : isPtera ? 3 : 5;
            const tgt = S.addTarget({
                kind: 'dino_' + kind, mesh: built.root, hitMeshes: built.hit, pos,
                hp: maxHp, life: 0, points: isRex ? 3400 : isPtera ? 240 : 280,
                appear: 'scale', death: isPtera ? 'burst' : 'tumble', deathColor: isRex ? 0xd97706 : 0x84cc16,
                onKill: () => {
                    D.slain++;
                    D.dinos = D.dinos.filter((x) => x.tgt !== tgt);
                    if (isRex) {
                        D.trexSlain = true;
                        SFX.fanfare();
                        MG.finish('🦖 ALPHA T-REX BROUGHT DOWN — SAFARI SAVED!', { color: '#a3e635', delay: 2.0 });
                    }
                }
            });
            const entry = { kind, isRex, isPtera, maxHp, tgt, built, speed: isRex ? 4.8 : isPtera ? 6.5 : 6.2, phase: Math.random() * 6, atkCd: 1.2 };
            D.dinos.push(entry);
            if (isRex) {
                D.trex = entry;
                if (BO.MinigameAudio) BO.MinigameAudio.kaijuRoar();
                SFX.rumble(1.0);
                MG.toast('🦖 SEISMIC TREMOR: ALPHA TYRANNOSAURUS REX HAS BREACHED THE GATE!', '#ef4444');
            }
        },
        update(S, dt, lib, state) {
            if (state !== 'running') return;
            if (BO.MinigameAudio) BO.MinigameAudio.tick(dt);
            const D = S.data, P = BO.Player;
            D.flareCd = Math.max(0, D.flareCd - dt);
            D.surgeCd = Math.max(0, D.surgeCd - dt);

            // Update active Red Road-Flares
            for (let i = D.flares.length - 1; i >= 0; i--) {
                const fl = D.flares[i];
                fl.life -= dt;
                if (Math.random() < dt * 16) BO.FX.spawnParticles(fl.pos.clone().add(V(0, 0.25, 0)), 2, 0xf43f5e, 1.8, 3.2, 0.35, 0.7);
                if (fl.life <= 0) { S.scene.remove(fl.grp); D.flares.splice(i, 1); }
            }

            if (!D.trexSpawned && (D.slain >= 15 || S.t >= 60)) {
                D.trexSpawned = true;
                this._spawnDino(S, 'trex');
            }
            D.spawnCd -= dt;
            if (D.spawnCd <= 0) {
                D.spawnCd = 2.4;
                this._spawnDino(S, Math.random() < 0.28 ? 'ptera' : 'raptor');
            }

            const activeFlare = D.flares.length > 0 ? D.flares[0].pos : null;
            for (const d of D.dinos) {
                if (!d.tgt.alive) continue;
                d.phase += dt * (d.isRex ? 6.5 : 11);

                // Animate Bipedal Dinosaur Stride, Swinging Tail, or Pteranodon Wing Flaps!
                if (d.built.legs.length) {
                    d.built.legs[0].rotation.x = Math.sin(d.phase) * 0.65;
                    d.built.legs[1].rotation.x = -Math.sin(d.phase) * 0.65;
                    if (d.built.tail) d.built.tail.rotation.y = Math.cos(d.phase) * 0.24;
                }
                if (d.built.wings) {
                    for (const w of d.built.wings) w.wg.rotation.z = w.sx * Math.sin(d.phase * 1.2) * 0.55;
                }

                const goal = (!d.isPtera && activeFlare) ? activeFlare : (d.tgt.basePos.distanceTo(P.pos) < 12 ? P.pos : D.jeepPos);
                const dx = goal.x - d.tgt.basePos.x, dz = goal.z - d.tgt.basePos.z;
                const dist = Math.max(0.1, Math.hypot(dx, dz));
                d.tgt.root.rotation.y = Math.atan2(dx, dz);

                if (dist > (d.isRex ? 3.2 : 1.9)) {
                    d.tgt.basePos.x += (dx / dist) * d.speed * dt;
                    d.tgt.basePos.z += (dz / dist) * d.speed * dt;
                    if (d.isPtera) d.tgt.basePos.y = 4.2 + Math.sin(d.phase * 0.5) * 2.2;
                    d.tgt.root.position.copy(d.tgt.basePos);
                } else if (!activeFlare) {
                    d.atkCd -= dt;
                    if (d.atkCd <= 0) {
                        d.atkCd = d.isRex ? 1.15 : 1.35;
                        if (goal === P.pos) P.takeDamage(d.isRex ? 16 : 9, d.tgt.basePos, true);
                        else D.jeepHp = Math.max(0, D.jeepHp - (d.isRex ? 9 : 4));
                    }
                }
            }

            if (D.jeepHp <= 0) MG.finish('SAFARI JEEP #18 CRUSHED', { color: '#f87171' });
            else if (!P.alive) MG.finish('CLEVER GIRL — DEVOURED IN THE PADDOCK', { color: '#f87171' });
        },
        hud(S) {
            const D = S.data, rex = D.trex && D.trex.tgt.alive ? D.trex : null;
            return `<div class="fun-panel">
                <div class="mgx-chip ${D.jeepHp < 35 ? 'mgx-hot' : ''}">🚙 JEEP #18 <b>${Math.ceil(D.jeepHp)}%</b></div>
                <div class="mgx-chip ${D.flareCd <= 0 ? 'mgx-hot' : ''}">🧨 FLARE LURE [E] <b>${D.flareCd <= 0 ? 'READY' : D.flareCd.toFixed(0) + 's'}</b></div>
                <div class="mgx-chip ${D.surgeCd <= 0 ? 'mgx-hot' : ''}">⚡ 10,000V SURGE [Q] <b>${D.surgeCd <= 0 ? 'READY' : D.surgeCd.toFixed(0) + 's'}</b></div>
            </div>
            ${rex ? `<div class="fun-panel" style="margin-top:5px;"><div class="fun-bar-wrap"><div class="fun-bar-lbl"><span>🦖 ALPHA TYRANNOSAURUS REX</span><b>${Math.max(0, Math.round(rex.tgt.hp))} / ${rex.maxHp}</b></div><div class="fun-bar"><i style="width:${Math.max(0, Math.round(rex.tgt.hp / rex.maxHp * 100))}%;background:linear-gradient(90deg,#84cc16,#ef4444)"></i></div></div></div>` : ''}`;
        },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return {
                score: S.score, stars,
                title: D.trexSlain ? 'APEX RANGER OF ISLA NUBLAR' : 'SAFARI EXTRACTION COMPLETE',
                stats: [['DINOSAURS NEUTRALIZED', D.slain], ['ALPHA T-REX', D.trexSlain ? 'FELLED' : D.trexSpawned ? 'SURVIVED' : 'NOT BREACHED'], ['JEEP #18 CONDITION', Math.ceil(D.jeepHp) + '%']],
                xp: Math.round(185 + S.score * 0.032 + stars * 155)
            };
        }
    });

    /* =====================================================================
       20. IRONKEEP CASTLE TREBUCHET SIEGE
       Walk Elevated Stone Battlements (y = 6.2m) + Tip 2 Boiling-Oil Cauldrons [E]
       + Fire 2 Heavy Siege Ballistae [E] + Shatter Rolling Siege Towers & Rams!
    ===================================================================== */
    function buildSiegeEngine(isTower) {
        const root = new THREE.Group();
        const hit = [];
        const timber = std(0x451a03, 0.85);
        const iron = std(0x334155, 0.45, 0.8);
        const wheels = [];

        for (const [wx, wz] of [[-1.5, 1.6], [1.5, 1.6], [-1.5, -1.6], [1.5, -1.6]]) {
            const w = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.28, 14), timber);
            w.rotation.z = Math.PI / 2; w.position.set(wx, 0.65, wz);
            root.add(w); wheels.push(w);
        }

        if (isTower) {
            const tower = new THREE.Mesh(new THREE.BoxGeometry(3.2, 6.8, 3.4), timber);
            tower.position.y = 4.0;
            const hideShield = new THREE.Mesh(new THREE.BoxGeometry(3.35, 4.5, 0.25), std(0x7f1d1d, 0.75));
            hideShield.position.set(0, 4.2, 1.75);
            const drawbridge = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.2, 0.2), iron);
            drawbridge.position.set(0, 6.4, 1.8);
            drawbridge.userData.hitbox = 'head';
            root.add(tower, hideShield, drawbridge);
            hit.push(tower, hideShield, drawbridge);
        } else {
            // Iron-Capped Battering Ram with Swinging Oak Log!
            const roof = new THREE.Mesh(new THREE.ConeGeometry(2.5, 2.2, 4), timber);
            roof.rotation.y = Math.PI / 4; roof.position.y = 2.8;
            const ramLog = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 4.8, 12), timber);
            ramLog.rotation.x = Math.PI / 2; ramLog.position.set(0, 1.55, 0.5);
            const ramHead = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.42, 0.75, 12), std(0xfacc15, 0.25, 0.88));
            ramHead.rotation.x = Math.PI / 2; ramHead.position.set(0, 1.55, 3.0);
            ramHead.userData.hitbox = 'head';
            root.add(roof, ramLog, ramHead);
            hit.push(roof, ramLog, ramHead);
        }
        return { root, hit, wheels };
    }

    MG.register({
        id: 'fun_castle_siege', cat: 'fun', order: 20,
        name: 'Ironkeep Castle Trebuchet Siege', icon: '🏰', accent: '#f97316', badge: 'CASTLE DEFENSE',
        tagline: 'Man the stone battlements! Pour Boiling Oil Cauldrons [E], fire Siege Ballistae & shatter Siege Towers!',
        desc: 'Stand atop the 6-meter crenellated stone ramparts of IRONKEEP CITADEL as Warlord Grimjaw\'s Iron Horde marches across the moat! Sprint between the East & West Guard Towers, crank and loose 2 Heavy Torsion Siege Ballistae [E] straight through Rolling Siege Towers, tip 2 Boiling-Pitch Cauldrons [E] over the murder-holes onto Iron Battering Rams hammering the Portcullis below, and slay WARLORD GRIMJAW!',
        guide: {
            objective: 'Defend the Ironkeep Oak Portcullis below your battlements by destroying Battering Rams, Siege Towers, Orc Sappers, and WARLORD GRIMJAW!',
            tips: [
                'Stand behind either HEAVY SIEGE BALLISTA on the rampart wings and press [E] (5.5s cooldown) to fire a flaming iron bolt for massive piercing AoE damage!',
                'When Battering Rams reach the Oak Gate directly beneath you, run to either BOILING OIL CAULDRON above the gate and press [E] (9s cooldown) to drench the gatehouse in liquid fire!',
                'Shoot red POWDER KEGS carried by Orc Sappers before they reach the castle wall to wipe out entire squads!'
            ]
        },
        heroLabel: 'FUN & SPECIALS • MEDIEVAL RAMPART SIEGE', duration: 165,
        stars: [2800, 5600, 9400, 13800],
        standardWeapon: 'mk14', secondaryWeapon: 'kar98k_irons', lockWeapon: true, infiniteMag: true, forgivingMisses: true, customMusic: true,
        weaponLabel: 'ROYAL MARKSMAN MK14 + BALLISTA & BOILING OIL [E]', weaponNote: '[E] at Ballistae (Flaming Bolt) or Gate Cauldrons (Pour Boiling Oil!)',
        keys: [['WASD', 'Patrol Ramparts'], ['E', 'Fire Ballista / Tip Oil'], ['1 / 2', 'Swap Marksman / Bolt'], ['LMB', 'Snipe Siege Horde']],
        map: {
            atmosphere: { skyTop: 0x1e1b4b, skyBottom: 0x9a3412, fogColor: 0x431407, fogDensity: 0.006, sunColor: 0xfdba74, sunIntensity: 1.55, sunPos: [0, 28, -55], hemiSky: 0xfed7aa, hemiGround: 0x292524, hemiIntensity: 0.85 },
            boxes: [
                // Battlefield ground + Castle Curtain Wall & Walkable Rampart Deck (y = 6.0m)!
                B(0, -0.5, -14, 70, 1, 76, 'grass'),
                B(0, 3.0, 12, 38, 6.0, 6.5, 'brick'),
                // Flanking Stone Bastion Towers
                B(-21, 4.2, 12, 7, 8.4, 8.5, 'brick'),
                B(21, 4.2, 12, 7, 8.4, 8.5, 'brick'),
                // Safety containment rails on back/sides of ramparts so player commands the high wall!
                B(0, 8.5, 15.6, 50, 5, 0.8, 'brick'),
                B(-24.8, 8.5, 12, 0.8, 5, 9, 'brick'),
                B(24.8, 8.5, 12, 0.8, 5, 9, 'brick'),
                // Low front crenellations (merlons) player can shoot over & between!
                B(-13, 6.65, 8.95, 2.2, 1.3, 0.6, 'brick'),
                B(-6.5, 6.65, 8.95, 2.2, 1.3, 0.6, 'brick'),
                B(6.5, 6.65, 8.95, 2.2, 1.3, 0.6, 'brick'),
                B(13, 6.65, 8.95, 2.2, 1.3, 0.6, 'brick')
            ],
            spawn: { x: 0, y: 6.15, z: 12.2, yaw: 0 }
        },
        countdown: 3,
        build(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.start('castle');
            const D = S.data;
            Object.assign(D, {
                gateHp: 100, units: [], bolts: [], ballistae: [], cauldrons: [],
                spawnCd: 1.0, engineCd: 6.5, killsCount: 0, bossSpawned: false, bossSlain: false
            });

            // Moat Water Trench + Timber Drawbridge Causeway leading to the Ironkeep Oak Portcullis!
            const moat = new THREE.Mesh(new THREE.PlaneGeometry(68, 7.5), new THREE.MeshStandardMaterial({ color: 0x0c4a6e, roughness: 0.2, metalness: 0.5 }));
            moat.rotation.x = -Math.PI / 2; moat.position.set(0, 0.05, 3.2); S.add(moat);
            const bridge = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.28, 8.2), std(0x451a03, 0.85));
            bridge.position.set(0, 0.14, 3.2); S.add(bridge);

            // Oak & Iron Portcullis Gate embedded in front of Curtain Wall at (0, 2.6, 8.65)!
            const gateDoor = new THREE.Mesh(new THREE.BoxGeometry(5.6, 5.2, 0.35), std(0x3b180c, 0.8));
            gateDoor.position.set(0, 2.6, 8.65); S.add(gateDoor);
            for (const x of [-2, -1, 0, 1, 2]) {
                const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5.2, 8), std(0x1e293b, 0.4, 0.85));
                bar.position.set(x * 1.1, 2.6, 8.42); S.add(bar);
            }
            for (const sx of [-18, -9, 9, 18]) {
                S.add(A.torch(S, V(sx, 6.2, 9.2), 0xf97316, false));
                const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3.6), std(0xb91c1c, 0.7, 0, { side: THREE.DoubleSide }));
                banner.position.set(sx, 3.8, 8.68); S.add(banner);
            }
            const sign = A.sign('🏰 IRONKEEP CITADEL — MAN BALLISTAE & BOILING OIL [E]! 🏰', 14, 1.1, { bg: '#431407', color: '#fde047', borderColor: '#f97316', size: 0.34, glow: '#f97316' });
            sign.position.set(0, 11.2, -36); S.add(sign);

            // 2 Heavy Torsion Siege Ballistae on Rampart Wings (x = -10, +10)!
            const oak = std(0x5c3a21, 0.8), brass = std(0xfacc15, 0.28, 0.86);
            for (const bx of [-10, 10]) {
                const bg = new THREE.Group();
                bg.position.set(bx, 6.0, 10.2);
                const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.52, 1.05, 10), oak); ped.position.y = 0.52;
                const stock = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 2.4), oak); stock.position.set(0, 1.1, -0.2);
                const bowArms = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.16, 0.22), brass); bowArms.position.set(0, 1.15, -1.1);
                const lbl = labelSprite('🏹 BALLISTA [E]', '#fde047', 2.1); lbl.position.set(0, 2.05, 0);
                bg.add(ped, stock, bowArms, lbl); S.add(bg);
                D.ballistae.push({ grp: bg, pos: V(bx, 6.0, 10.2), cd: 0 });
            }

            // 2 Bubbling Boiling-Pitch Cauldrons directly above the Portcullis Gate (x = -2.6, +2.6)!
            const ironM = std(0x18181b, 0.45, 0.85);
            for (const cx of [-2.6, 2.6]) {
                const cg = new THREE.Group();
                cg.position.set(cx, 6.0, 9.35);
                const pot = new THREE.Mesh(new THREE.SphereGeometry(0.68, 14, 10, 0, TAU, Math.PI * 0.25, Math.PI * 0.75), ironM);
                pot.position.y = 0.65;
                const lava = new THREE.Mesh(new THREE.CircleGeometry(0.58, 14), basic(0xf97316));
                lava.rotation.x = -Math.PI / 2; lava.position.y = 0.92;
                const lbl = labelSprite('🔥 BOILING OIL [E]', '#fb923c', 2.2); lbl.position.set(0, 1.85, 0);
                cg.add(pot, lava, lbl); S.add(cg);
                D.cauldrons.push({ grp: cg, pos: V(cx, 6.0, 9.35), cd: 0 });
            }

            D.onKey = (e) => {
                if (MG.session !== S || MG.state !== 'running') return;
                if (e.code === 'KeyE') this._useRampartEmplacement(S);
            };
            window.addEventListener('keydown', D.onKey);
        },
        dispose(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.stop();
            if (S.data.onKey) window.removeEventListener('keydown', S.data.onKey);
        },
        _useRampartEmplacement(S) {
            const D = S.data, P = BO.Player, cam = BO.App.worldCamera;
            // Check Boiling-Oil Cauldrons first
            for (const c of D.cauldrons) {
                if (P.pos.distanceTo(c.pos) < 3.2) {
                    if (c.cd > 0) { MG.toast(`⏳ CAULDRON REHEATING (${c.cd.toFixed(1)}s)`, '#94a3b8'); return; }
                    c.cd = 9.0;
                    const dropZone = V(c.pos.x * 0.5, 0.8, 6.5);
                    BO.FX.spawnExplosion(dropZone, 6.5, 0xf97316);
                    SFX.rumble(0.65);
                    let burned = 0;
                    for (const u of D.units.slice()) {
                        if (u.tgt.alive && Math.hypot(u.tgt.basePos.x - dropZone.x, u.tgt.basePos.z - dropZone.z) < 7.8) {
                            u.tgt.hp -= 12;
                            burned++;
                            if (u.tgt.hp <= 0) { S.kills++; S.bumpCombo(); u.tgt.kill({ pt: dropZone }); }
                        }
                    }
                    S.award(180 + burned * 200, dropZone.clone().add(V(0, 2, 0)), `🔥 BOILING PITCH x${burned}!`, '#fb923c');
                    MG.toast('🔥 BOILING OIL POURED OVER THE GATEHOUSE!', '#fb923c');
                    return;
                }
            }
            // Check Heavy Siege Ballistae
            for (const b of D.ballistae) {
                if (P.pos.distanceTo(b.pos) < 3.4 && cam) {
                    if (b.cd > 0) { MG.toast(`⏳ BALLISTA WINCHING (${b.cd.toFixed(1)}s)`, '#94a3b8'); return; }
                    b.cd = 5.5;
                    const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
                    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 2.4, 8), basic(0xfde047));
                    bolt.rotation.x = Math.PI / 2;
                    const start = b.pos.clone().add(V(0, 1.2, -1.2));
                    bolt.position.copy(start);
                    bolt.lookAt(start.clone().add(fwd));
                    S.add(bolt);
                    if (BO.MinigameAudio) BO.MinigameAudio.ballistaTwang(); else tone(220, 95, 0.20, 'sawtooth', 0.13);
                    D.bolts.push({ mesh: bolt, vel: fwd.multiplyScalar(44), life: 2.0 });
                    return;
                }
            }
        },
        _spawnHordeUnit(S, kind) {
            const D = S.data;
            const isEngine = kind === 'ram' || kind === 'tower';
            const isBoss = kind === 'boss';
            if (!isBoss && D.units.length >= 11) return;

            const sx = kind === 'ram' ? (Math.random() - 0.5) * 4 : (Math.random() - 0.5) * 32;
            const pos = V(sx, 0, -42 - Math.random() * 5);

            if (isEngine) {
                const eng = buildSiegeEngine(kind === 'tower');
                const maxHp = kind === 'tower' ? 18 : 14;
                const tgt = S.addTarget({
                    kind: 'siege_' + kind, mesh: eng.root, hitMeshes: eng.hit, pos,
                    hp: maxHp, life: 0, points: 620, appear: 'scale', death: 'burst', deathColor: 0xf97316,
                    onKill: () => {
                        BO.FX.spawnExplosion(tgt.basePos.clone().add(V(0, 2, 0)), 4.8, 0xf97316);
                        D.killsCount++;
                        D.units = D.units.filter((x) => x.tgt !== tgt);
                    }
                });
                D.units.push({ kind, isEngine: true, eng, tgt, speed: 2.3, atkCd: 1.8, phase: 0 });
            } else {
                const isSapper = kind === 'sapper';
                const fig = F.human({
                    skin: 0x4d7c0f, shirt: isBoss ? 0x991b1b : 0x292524, vest: isBoss ? 0xfacc15 : 0x57534e,
                    pants: 0x1c1917, hat: 'helmet', hatColor: isBoss ? 0xfacc15 : 0x334155,
                    gun: isBoss ? 'lmg' : 'rifle', eyes: 'angry', scale: isBoss ? 1.85 : 1.05
                });
                if (isSapper) {
                    const keg = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.68, 12), std(0xdc2626, 0.45));
                    keg.position.set(0, 1.15, 0.45); keg.userData.hitbox = 'head';
                    fig.root.add(keg); fig.hit.push(keg);
                }
                const maxHp = isBoss ? 58 : isSapper ? 2 : 3;
                const tgt = S.addTarget({
                    kind: 'orc_' + kind, mesh: fig.root, hitMeshes: fig.hit, pos,
                    hp: maxHp, life: 0, points: isBoss ? 3200 : isSapper ? 280 : 195,
                    appear: 'scale', death: isSapper ? 'burst' : 'knock', deathColor: isSapper ? 0xf97316 : 0x84cc16,
                    onKill: () => {
                        D.killsCount++;
                        if (isSapper) {
                            const c = tgt.basePos.clone().add(V(0, 1, 0));
                            BO.FX.spawnExplosion(c, 5.2, 0xf97316);
                            for (const o of D.units.slice()) {
                                if (o.tgt !== tgt && o.tgt.alive && o.tgt.basePos.distanceTo(c) < 6.5) {
                                    o.tgt.hp -= 5;
                                    if (o.tgt.hp <= 0) o.tgt.kill({ pt: c });
                                }
                            }
                        }
                        D.units = D.units.filter((x) => x.tgt !== tgt);
                        if (isBoss) {
                            D.bossSlain = true;
                            SFX.fanfare();
                            MG.finish('🏰 WARLORD GRIMJAW SLAIN — IRONKEEP STANDS UNBROKEN!', { color: '#fde047', delay: 2.0 });
                        }
                    }
                });
                const uObj = { kind, isBoss, maxHp, fig, tgt, speed: isSapper ? 4.6 : 3.2, atkCd: 1.8, phase: Math.random() * 6 };
                D.units.push(uObj);
                if (isBoss) {
                    D.boss = uObj;
                    MG.toast('🚨 SIEGE HORNS SOUND: WARLORD GRIMJAW LEADS THE FINAL ASSAULT!', '#ef4444');
                    SFX.horn && SFX.horn();
                }
            }
        },
        update(S, dt, lib, state) {
            if (state !== 'running') return;
            if (BO.MinigameAudio) BO.MinigameAudio.tick(dt);
            const D = S.data, P = BO.Player;
            for (const b of D.ballistae) b.cd = Math.max(0, b.cd - dt);
            for (const c of D.cauldrons) c.cd = Math.max(0, c.cd - dt);

            // Keep defender on ramparts if they slip off front crenel gap
            if (P.pos.y < 2.0) { P.pos.set(0, 6.2, 12.0); P.vel.set(0, 0, 0); }

            // Update Flaming Ballista Bolts
            for (let i = D.bolts.length - 1; i >= 0; i--) {
                const bl = D.bolts[i];
                bl.life -= dt;
                bl.mesh.position.addScaledVector(bl.vel, dt);
                BO.FX.spawnParticles(bl.mesh.position, 1, 0xf97316, 1.5, 1, 0.25, 0.5);
                let hit = bl.life <= 0 || bl.mesh.position.y <= 0.15;
                for (const u of D.units) {
                    if (u.tgt.alive && u.tgt.basePos.clone().add(V(0, 1.6, 0)).distanceTo(bl.mesh.position) < 2.6) { hit = true; break; }
                }
                if (hit) {
                    const c = bl.mesh.position.clone();
                    BO.FX.spawnExplosion(c, 5.5, 0xfacc15);
                    for (const u of D.units.slice()) {
                        if (u.tgt.alive && u.tgt.basePos.distanceTo(c) < 6.8) {
                            u.tgt.hp -= 14;
                            if (u.tgt.hp <= 0) {
                                S.award(280, c, '🏹 BALLISTA IMPALE!', '#fde047');
                                S.kills++; S.bumpCombo();
                                u.tgt.kill({ pt: c });
                            }
                        }
                    }
                    S.scene.remove(bl.mesh); D.bolts.splice(i, 1);
                }
            }

            if (!D.bossSpawned && (D.killsCount >= 18 || S.t >= 65)) {
                D.bossSpawned = true;
                this._spawnHordeUnit(S, 'boss');
            }
            D.spawnCd -= dt;
            if (D.spawnCd <= 0) {
                D.spawnCd = 2.2;
                this._spawnHordeUnit(S, Math.random() < 0.28 ? 'sapper' : 'raider');
            }
            D.engineCd -= dt;
            if (D.engineCd <= 0) {
                D.engineCd = 11.5;
                this._spawnHordeUnit(S, Math.random() < 0.5 ? 'ram' : 'tower');
            }

            const gatePt = V(0, 0, 6.8);
            for (const u of D.units.slice()) {
                if (!u.tgt.alive) continue;
                u.phase += dt * 8.5;
                const dx = gatePt.x - u.tgt.basePos.x, dz = gatePt.z - u.tgt.basePos.z;
                const dist = Math.max(0.1, Math.hypot(dx, dz));
                u.tgt.root.rotation.y = Math.atan2(dx, dz);

                if (dist > (u.isEngine ? 2.4 : u.kind === 'raider' ? 14 : 2.5)) {
                    u.tgt.basePos.x += (dx / dist) * u.speed * dt;
                    u.tgt.basePos.z += (dz / dist) * u.speed * dt;
                    u.tgt.root.position.copy(u.tgt.basePos);
                    if (u.fig) F.walk(u.fig, u.phase, 0.9, true);
                    if (u.eng) for (const w of u.eng.wheels) w.rotation.x += dt * 5;
                } else if (u.kind === 'sapper') {
                    BO.FX.spawnExplosion(u.tgt.basePos.clone().add(V(0, 1, 0)), 4.5, 0xef4444);
                    D.gateHp = Math.max(0, D.gateHp - 14);
                    MG.toast('💥 ORC SAPPER BLASTED THE OAK PORTCULLIS!', '#f87171');
                    u.tgt.remove(); D.units = D.units.filter((x) => x !== u);
                } else {
                    u.atkCd -= dt;
                    if (u.atkCd <= 0) {
                        u.atkCd = 1.9;
                        if (u.isEngine || dist < 4.5) {
                            D.gateHp = Math.max(0, D.gateHp - (u.isEngine ? 6.5 : 3.5));
                            SFX.clack();
                        } else {
                            BO.FX.spawnTracer(u.tgt.basePos.clone().add(V(0, 1.5, 0)), P.pos.clone().add(V(0, 1.1, 0)), 0xf97316, 0.05, 0.12);
                            P.takeDamage(u.isBoss ? 11 : 6, u.tgt.basePos, true);
                        }
                    }
                }
            }

            if (BO.HUD && BO.HUD.showPrompt) {
                for (const c of D.cauldrons) if (P.pos.distanceTo(c.pos) < 3.2) BO.HUD.showPrompt('🔥 [E] TIP BOILING-OIL CAULDRON ONTO GATE');
                for (const b of D.ballistae) if (P.pos.distanceTo(b.pos) < 3.4) BO.HUD.showPrompt('🏹 [E] LOOSE FLAMING BALLISTA BOLT');
            }

            if (D.gateHp <= 0) MG.finish('IRONKEEP PORTCULLIS SHATTERED', { color: '#f87171' });
            else if (!P.alive) MG.finish('SLAIN ATOP THE BATTLEMENTS', { color: '#f87171' });
        },
        hud(S) {
            const D = S.data, boss = D.boss && D.boss.tgt.alive ? D.boss : null;
            return `<div class="fun-panel">
                <div class="mgx-chip ${D.gateHp < 35 ? 'mgx-hot' : ''}">🏰 PORTCULLIS <b>${Math.ceil(D.gateHp)}%</b></div>
                <div class="mgx-chip">SIEGE HORDE SLAIN <b>${D.killsCount}</b></div>
                <div class="mgx-chip">🏹 BALLISTAE & 🔥 OIL <b>[E]</b></div>
            </div>
            ${boss ? `<div class="fun-panel" style="margin-top:5px;"><div class="fun-bar-wrap"><div class="fun-bar-lbl"><span>⚔️ WARLORD GRIMJAW</span><b>${Math.max(0, Math.round(boss.tgt.hp))} / ${boss.maxHp}</b></div><div class="fun-bar"><i style="width:${Math.max(0, Math.round(boss.tgt.hp / boss.maxHp * 100))}%;background:linear-gradient(90deg,#f97316,#dc2626)"></i></div></div></div>` : ''}`;
        },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return {
                score: S.score, stars,
                title: D.bossSlain ? 'LORD DEFENDER OF IRONKEEP' : 'SIEGE DEFENSE COMPLETE',
                stats: [['HORDE & ENGINES DESTROYED', D.killsCount], ['WARLORD GRIMJAW', D.bossSlain ? 'VANQUISHED' : D.bossSpawned ? 'SURVIVED' : 'NOT SUMMONED'], ['PORTCULLIS INTEGRITY', Math.ceil(D.gateHp) + '%']],
                xp: Math.round(185 + S.score * 0.032 + stars * 155)
            };
        }
    });
})(window);
