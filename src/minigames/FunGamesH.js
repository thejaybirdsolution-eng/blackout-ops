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
        SFX.tone(f0, f1, dur, type, vol, delay);
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
       4,000m Mariana Trench Floor + Volumetric Caustic Sunbeams + Glowing
       Jellyfish & Kelp + Hydrothermal Magma Bubble-Lift Vents + NEREUS-7
       Glass Complex & Wrecked Submersibles + Cloaked Stalkers + Multi-Segment
       Kraken + Sonar Pulse [Q] + Harpoon Barrage [RMB] + Hydraulic Slam [E]!
    ===================================================================== */
    function trenchSandTex() {
        return L.canvasTex('abyssal-seabed-v2', 512, 512, (g, w, h) => {
            const gr = g.createRadialGradient(w / 2, h / 2, 30, w / 2, h / 2, 320);
            gr.addColorStop(0, '#0f2942'); gr.addColorStop(1, '#040d1a');
            g.fillStyle = gr; g.fillRect(0, 0, w, h);
            const rnd = L.mulberry32(818);
            for (let i = 0; i < 85; i++) {
                g.strokeStyle = `rgba(34,211,238,${0.08 + rnd() * 0.16})`;
                g.lineWidth = 2;
                g.beginPath();
                const y = rnd() * h;
                g.moveTo(0, y);
                g.bezierCurveTo(w * 0.33, y + (rnd() - 0.5) * 35, w * 0.66, y + (rnd() - 0.5) * 35, w, y);
                g.stroke();
            }
        });
    }

    function buildWreckedSub() {
        const g = new THREE.Group();
        const rust = std(0x78350f, 0.82, 0.45);
        const hullY = std(0xb45309, 0.65, 0.35);
        const darkM = std(0x1e293b, 0.5, 0.7);
        const body = new THREE.Mesh(new THREE.CapsuleGeometry(1.15, 3.4, 8, 14), hullY);
        body.rotation.z = Math.PI / 2;
        body.position.y = 1.0;
        const conning = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.78, 1.3, 12), rust);
        conning.position.set(0.2, 2.1, 0);
        const viewport = new THREE.Mesh(new THREE.SphereGeometry(0.85, 14, 10), new THREE.MeshStandardMaterial({ color: 0x0ea5e9, emissive: 0x0284c7, emissiveIntensity: 0.35, transparent: true, opacity: 0.5 }));
        viewport.position.set(2.35, 1.0, 0);
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.4, 8), darkM);
        tail.rotation.z = Math.PI / 2; tail.position.set(-2.6, 1.0, 0);
        const sos = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), basic(0xf97316));
        sos.position.set(0.2, 2.85, 0);
        g.add(body, conning, viewport, tail, sos);
        return { grp: g, sos };
    }

    function buildAbyssPredator(kind) {
        const root = new THREE.Group();
        const hit = [];
        const isAngler = kind === 'angler';
        const isStalker = kind === 'stalker';
        const isKraken = kind === 'kraken';

        if (isKraken) {
            const mantleM = std(0x701a3c, 0.32, 0.35, { emissive: 0x4c0519, emissiveIntensity: 0.55 });
            const armorM = std(0x1e1b4b, 0.25, 0.75);
            const bioCyan = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });

            const mantle = new THREE.Mesh(new THREE.ConeGeometry(2.6, 6.4, 18), mantleM);
            mantle.rotation.x = -Math.PI * 0.38; mantle.position.set(0, 3.0, -1.5);
            const armorCap = new THREE.Mesh(new THREE.ConeGeometry(2.75, 2.4, 8), armorM);
            armorCap.rotation.x = -Math.PI * 0.38; armorCap.position.set(0, 3.5, -1.8);
            const head = new THREE.Mesh(new THREE.SphereGeometry(2.15, 20, 16), mantleM);
            head.position.set(0, 1.5, 0.65);
            const beak = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.4, 10), armorM);
            beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.9, 2.65);
            beak.userData.hitbox = 'head';
            root.add(mantle, armorCap, head, beak);
            hit.push(mantle, head, beak);

            // 3 Glowing Crimson Weak-Spot Eyes (headshot crit + ink stagger!)
            const eyes = [];
            for (const [ex, ey, ez, r] of [[-1.25, 1.75, 2.05, 0.52], [1.25, 1.75, 2.05, 0.52], [0, 2.55, 2.15, 0.44]]) {
                const eye = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), eyeMat);
                eye.position.set(ex, ey, ez);
                eye.userData.hitbox = 'head';
                root.add(eye); hit.push(eye);
                eyes.push(eye);
            }

            // Pulsing bioluminescent vein ribs along the mantle
            const veins = [];
            for (let i = 0; i < 10; i++) {
                const a = (i / 10) * TAU;
                const vein = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 2.8, 4, 6), bioCyan);
                vein.position.set(Math.cos(a) * 1.65, 2.6 + (i % 2) * 0.5, -1.1 + Math.sin(a) * 1.15);
                vein.rotation.x = -0.75;
                vein.rotation.z = Math.cos(a) * 0.3;
                root.add(vein);
                veins.push(vein);
            }

            // 8 Multi-Segment Sinuous Undulating Tentacles with Glowing Suckers!
            const tentacles = [];
            for (let t = 0; t < 8; t++) {
                const a = (t / 8) * TAU;
                const baseG = new THREE.Group();
                baseG.position.set(Math.cos(a) * 1.65, 0.85, 1.1 + Math.sin(a) * 1.3);
                baseG.rotation.y = Math.cos(a) * 0.55;
                const segs = [];
                let parent = baseG;
                for (let s = 0; s < 4; s++) {
                    const segG = new THREE.Group();
                    if (s > 0) segG.position.set(0, 0, 1.35);
                    const rad = 0.36 - s * 0.065;
                    const segMesh = new THREE.Mesh(
                        s === 3 ? new THREE.ConeGeometry(rad, 1.5, 8) : new THREE.CapsuleGeometry(rad, 1.15, 5, 8),
                        s === 3 ? bioCyan : mantleM
                    );
                    segMesh.rotation.x = Math.PI / 2;
                    segMesh.position.z = 0.68;
                    segG.add(segMesh);
                    hit.push(segMesh);
                    // Glowing suckers along underside of each tentacle segment!
                    if (s < 3) {
                        for (const sz of [0.35, 0.95]) {
                            const sucker = new THREE.Mesh(new THREE.SphereGeometry(rad * 0.45, 7, 5), bioCyan);
                            sucker.position.set(0, -rad * 0.85, sz);
                            segG.add(sucker);
                        }
                    }
                    parent.add(segG);
                    segs.push(segG);
                    parent = segG;
                }
                root.add(baseG);
                tentacles.push({ baseG, segs });
            }
            return { root, hit, tentacles, veins, eyes, tailPivot: null, cloakMats: null };
        }

        const sc = isAngler ? 1.32 : isStalker ? 1.1 : 1.0;
        const bodyCol = isAngler ? 0x311042 : isStalker ? 0x0e7490 : 0x0f766e;
        const glowCol = isAngler ? 0xfacc15 : isStalker ? 0xf43f5e : 0x22d3ee;
        const skinM = isStalker
            ? new THREE.MeshStandardMaterial({ color: bodyCol, emissive: 0x164e63, emissiveIntensity: 0.3, transparent: true, opacity: 0.24, roughness: 0.2 })
            : std(bodyCol, 0.28, 0.35, { emissive: bodyCol, emissiveIntensity: 0.28 });

        const torso = new THREE.Mesh(new THREE.SphereGeometry(0.75 * sc, 16, 12), skinM);
        torso.scale.set(isAngler ? 1.05 : 0.64, isAngler ? 1.0 : 0.68, isAngler ? 1.25 : 1.95);
        const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.72 * sc, 0.28 * sc, 0.68 * sc), skinM);
        jaw.position.set(0, -0.32 * sc, 0.65 * sc); jaw.rotation.x = 0.28;
        jaw.userData.hitbox = 'head';
        root.add(torso, jaw);
        hit.push(torso, jaw);

        const weakHalo = new THREE.Mesh(new THREE.TorusGeometry(0.85 * sc, 0.05, 6, 18), new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.0 }));
        weakHalo.position.set(0, 0.1 * sc, 0.5 * sc);
        root.add(weakHalo);

        for (const sx of [-0.28, 0.28]) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.14 * sc, 8, 6), basic(glowCol));
            eye.position.set(sx * sc, 0.22 * sc, 0.72 * sc);
            eye.userData.hitbox = 'head';
            root.add(eye);
            for (let f = -1; f <= 1; f += 2) {
                const fang = new THREE.Mesh(new THREE.ConeGeometry(0.045 * sc, 0.24 * sc, 6), basic(0xf8fafc));
                fang.position.set((sx + f * 0.08) * sc, -0.18 * sc, 0.92 * sc);
                root.add(fang);
            }
        }

        if (isAngler) {
            const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.35, 8), skinM);
            stalk.position.set(0, 0.85, 0.65); stalk.rotation.x = 0.62;
            const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), basic(0xfef08a));
            bulb.position.set(0, 1.35, 1.15);
            bulb.userData.hitbox = 'head';
            root.add(stalk, bulb); hit.push(bulb);
        } else {
            const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.84, 6), basic(glowCol));
            dorsal.position.set(0, 0.68, -0.1); dorsal.rotation.x = -0.3;
            root.add(dorsal);
        }

        const tailPivot = new THREE.Group();
        tailPivot.position.set(0, 0, -1.05 * sc);
        const fin = new THREE.Mesh(new THREE.ConeGeometry(0.58 * sc, 0.85 * sc, 4), basic(glowCol));
        fin.scale.set(0.22, 1.15, 0.9); fin.rotation.x = -Math.PI / 2; fin.position.z = -0.35 * sc;
        tailPivot.add(fin);
        root.add(tailPivot);
        return { root, hit, tailPivot, tentacles: null, skinM: isStalker ? skinM : null, weakHalo };
    }

    MG.register({
        id: 'fun_abyssal_mech', cat: 'fun', order: 18,
        name: 'Abyssal Trench Exo-Suit', icon: '🤿', accent: '#06b6d4', badge: '4,000M DEEP',
        tagline: 'Walk the bioluminescent Mariana Trench! Ping Sonar [Q], fire Harpoon Barrage [RMB] & Hydraulic Slam [E]!',
        desc: 'Descend 4,080 meters beneath swaying volumetric sunbeams and bioluminescent jellyfish to defend Research Complex NEREUS-7! Ride upward Hydrothermal Magma Bubble-Lifts, ping [Q] Active Sonar to emit a 3D cyan shockwave that reveals Cloaked Stalkers & exposes weakspots, unleash [RMB] 3-Torpedo Harpoon Barrages, smash packs with [E] Hydraulic Ground-Slam, and slay the multi-tentacled ABYSSAL KRAKEN!',
        guide: {
            objective: 'Defend Research Complex NEREUS-7 from Viper-Sharks, Anglerfish, Cloaked Stalkers, and the multi-tentacled ABYSSAL KRAKEN!',
            tips: [
                'Press [Q] (8s cooldown) for ACTIVE SONAR PULSE—emits a 3D cyan ring wave that reveals Cloaked Stalkers, highlights weakspots (+50% crit), stuns predators & repairs +20 HP!',
                'Click [RMB] (6.5s cooldown) to launch a 3-TORPEDO HARPOON BARRAGE with explosive cyan shockwaves!',
                'Press [E] (8s cooldown) for a HYDRAULIC GROUND-SLAM (extra damage when slamming down from Magma Bubble-Lift Currents!)—and aim for the Kraken\'s 3 Crimson Eyes to trigger ink-staggers!'
            ]
        },
        heroLabel: 'FUN & SPECIALS • DEEP-SEA TRENCH DEFENSE', duration: 170,
        stars: [3000, 6200, 10200, 14800],
        standardWeapon: 'galil_ar', lockWeapon: true, infiniteMag: true, forgivingMisses: true, customMusic: true,
        matchRules: { noAds: true },
        blockKeys: ['KeyQ', 'KeyE'],
        weaponLabel: 'HARPOON GALIL + SONAR [Q] + HARPOON BARRAGE [RMB] + SLAM [E]', weaponNote: '[Q] Sonar Reveal & Stun • [RMB] Harpoon Torpedo Barrage • [E] Hydraulic Ground-Slam',
        keys: [['WASD / SPACE', 'Exo-Suit / Hydro-Jets'], ['Q', 'Sonar Pulse (Reveal)'], ['RMB', 'Harpoon Barrage (x3)'], ['E', 'Hydraulic Ground-Slam']],
        map: {
            atmosphere: { skyTop: 0x010814, skyBottom: 0x05283d, fogColor: 0x031a2c, fogDensity: 0.015, sunColor: 0x38bdf8, sunIntensity: 1.25, sunPos: [12, 65, 10], hemiSky: 0x22d3ee, hemiGround: 0x062033, hemiIntensity: 1.0 },
            boxes: [
                B(0, -0.5, 0, 64, 1, 64, 'desert_sand'),
                B(-32, 10, 0, 2, 20, 64, 'concrete'), B(32, 10, 0, 2, 20, 64, 'concrete'),
                B(0, 10, -32, 64, 20, 2, 'concrete'), B(0, 10, 32, 64, 20, 2, 'concrete')
            ],
            spawn: { x: 0, y: 0.2, z: 14, yaw: 0 }
        },
        countdown: 3,
        build(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.start('abyssal');
            const D = S.data;
            Object.assign(D, {
                domeHp: 100, beasts: [], torpedoes: [], vents: [], sonarWaves: [], jellies: [], kelps: [], sunbeams: [],
                torpCd: 0, sonarCd: 0, slamCd: 0, pendingSlam: false,
                spawnCd: 1.1, slain: 0, kraken: null, krakenSpawned: false, krakenSlain: false
            });

            // Trench Floor + Towering Basalt Trench Cliffs
            const bed = new THREE.Mesh(new THREE.PlaneGeometry(63, 63), new THREE.MeshStandardMaterial({ map: trenchSandTex(), roughness: 0.85 }));
            bed.rotation.x = -Math.PI / 2; bed.position.y = 0.02; S.add(bed);

            const basalt = std(0x0f172a, 0.92);
            for (let i = 0; i < 24; i++) {
                const a = (i / 24) * TAU, r = 29.5;
                const spire = new THREE.Mesh(new THREE.ConeGeometry(3.4 + (i % 3), 15 + (i % 4) * 3.5, 7), basalt);
                spire.position.set(Math.cos(a) * r, 7.0, Math.sin(a) * r);
                S.add(spire);
            }

            // Swaying Volumetric Caustic Sunbeams piercing down from the ocean surface!
            const beamMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.075, depthWrite: false, side: THREE.DoubleSide });
            for (const [bx, bz, tilt] of [[-14, -8, 0.14], [12, -10, -0.12], [-4, 2, 0.08], [16, 8, -0.16], [-16, 12, 0.11], [2, -18, -0.09]]) {
                const shaft = new THREE.Mesh(new THREE.ConeGeometry(4.6, 38, 12, 1, true), beamMat);
                shaft.position.set(bx, 18.5, bz);
                shaft.rotation.z = tilt;
                S.add(shaft);
                D.sunbeams.push({ mesh: shaft, baseZ: tilt, ph: Math.random() * 6 });
            }

            // NEREUS-7 Multi-Dome Research Complex at (0, 0, 19.5)
            const domeG = new THREE.Group();
            domeG.position.set(0, 0, 19.5);
            const brassRing = std(0xf59e0b, 0.28, 0.86);
            const domeGlassM = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.5, transparent: true, opacity: 0.56 });
            const baseRing = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.6, 1.15, 24), brassRing);
            baseRing.position.y = 0.58;
            const glass = new THREE.Mesh(new THREE.SphereGeometry(4.9, 24, 16, 0, TAU, 0, Math.PI * 0.5), domeGlassM);
            glass.position.y = 1.05;
            const coreLab = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 1.9, 12), basic(0xfef08a));
            coreLab.position.y = 1.6;
            const auxPod = new THREE.Mesh(new THREE.SphereGeometry(2.4, 16, 12, 0, TAU, 0, Math.PI * 0.5), domeGlassM);
            auxPod.position.set(-6.4, 0.6, 0.5);
            const auxBase = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.7, 0.7, 16), brassRing);
            auxBase.position.set(-6.4, 0.35, 0.5);
            const sign = A.sign('🤿 NEREUS-7 COMPLEX — PROTECT HABITAT DOME! 🤿', 8.2, 0.9, { bg: '#082f49', color: '#67e8f9', borderColor: '#22d3ee', size: 0.29, glow: '#22d3ee' });
            sign.position.set(0, 7.2, 0);
            domeG.add(baseRing, glass, coreLab, auxPod, auxBase, sign);
            S.add(domeG);
            const dPts = [];
            for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; dPts.push(V(Math.cos(a) * 5.4, 1.22, 19.5 + Math.sin(a) * 5.4)); }
            const dBulbs = A.bulbs(dPts, [0x22d3ee, 0xfacc15, 0x4ade80], 0.13);
            S.add(dBulbs); A.animateBulbs(S, dBulbs, 4, 'chase');
            S.collider(-5.0, 0, 14.5, 5.0, 5.5, 24.5);
            D.domePos = V(0, 2.0, 19.5);

            // 2 Wrecked Submersibles on the Trench Floor!
            const sub1 = buildWreckedSub(); sub1.grp.position.set(-16.5, 0, 5.5); sub1.grp.rotation.set(0.15, 0.65, -0.22); S.add(sub1.grp);
            const sub2 = buildWreckedSub(); sub2.grp.position.set(17.0, 0, -9.0); sub2.grp.rotation.set(-0.12, -2.1, 0.18); S.add(sub2.grp);
            S.animate(() => {
                const blink = Math.sin(S.t * 6) > 0 ? 0xf97316 : 0x451a03;
                sub1.sos.material.color.setHex(blink);
                sub2.sos.material.color.setHex(blink);
            });

            // Bioluminescent Coral Pillars & Swaying Glowing Kelp Forests!
            const coralCols = [0x22d3ee, 0xe879f9, 0x4ade80, 0xf43f5e, 0xfacc15];
            const rnd = L.mulberry32(4000);
            for (let c = 0; c < 18; c++) {
                const cx = (rnd() - 0.5) * 48, cz = -22 + rnd() * 32;
                if (Math.hypot(cx, cz - 17) < 8.5) continue;
                const col = coralCols[c % coralCols.length];
                const cg = new THREE.Group(); cg.position.set(cx, 0, cz);
                const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.3, 0), basalt);
                rock.scale.y = 0.65; rock.position.y = 0.4; cg.add(rock);
                for (let br = 0; br < 3; br++) {
                    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.16, 1.8 + rnd() * 1.8, 10), basic(col));
                    tube.position.set((br - 1) * 0.42, 1.3, (rnd() - 0.5) * 0.4);
                    tube.rotation.z = (br - 1) * 0.22;
                    cg.add(tube);
                }
                S.add(cg);
                // Swaying Bioluminescent Kelp stalks beside coral clusters
                const kelp = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 5.5 + rnd() * 3.5, 7), basic(c % 2 ? 0x10b981 : 0x06b6d4));
                kelp.position.set(cx + 1.1, 2.8, cz - 0.8);
                S.add(kelp);
                D.kelps.push({ mesh: kelp, ph: rnd() * 6 });
            }

            // 8 Drifting Bioluminescent Jellyfish!
            const jCols = [0xe879f9, 0x22d3ee, 0xf472b6, 0x38bdf8];
            for (let j = 0; j < 8; j++) {
                const jg = new THREE.Group();
                const jc = jCols[j % jCols.length];
                const bell = new THREE.Mesh(
                    new THREE.SphereGeometry(0.72, 14, 10, 0, TAU, 0, Math.PI * 0.55),
                    new THREE.MeshBasicMaterial({ color: jc, transparent: true, opacity: 0.62, side: THREE.DoubleSide })
                );
                const core = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), basic(0xfef08a));
                core.position.y = 0.18;
                jg.add(bell, core);
                for (let t = 0; t < 4; t++) {
                    const a = (t / 4) * TAU;
                    const tend = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.015, 1.6, 6), basic(jc));
                    tend.position.set(Math.cos(a) * 0.35, -0.75, Math.sin(a) * 0.35);
                    jg.add(tend);
                }
                const jx = (rnd() - 0.5) * 44, jy = 5.5 + rnd() * 6.5, jz = -18 + rnd() * 30;
                jg.position.set(jx, jy, jz);
                S.add(jg);
                D.jellies.push({ grp: jg, baseY: jy, ph: rnd() * 6 });
            }

            // 3 Hydrothermal Magma Vents launching Upward Bubble-Lift Currents!
            const liftMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide });
            for (const [vx, vz] of [[-11, -3], [11, -3], [0, -10]]) {
                const chimney = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.2, 10, 1, true), basalt);
                chimney.position.set(vx, 1.1, vz); S.add(chimney);
                const magma = new THREE.Mesh(new THREE.CircleGeometry(1.25, 16), basic(0xf97316));
                magma.rotation.x = -Math.PI / 2; magma.position.set(vx, 0.14, vz); S.add(magma);
                const column = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.15, 12, 14, 1, true), liftMat);
                column.position.set(vx, 6.2, vz); S.add(column);
                const lbl = labelSprite('🫧 BUBBLE-LIFT VENT', '#67e8f9', 2.3);
                lbl.position.set(vx, 2.9, vz); S.add(lbl);
                D.vents.push(V(vx, 0, vz));
            }

            // First-person Left-Hand Heavy Exo-Suit Titanium Pincer Claw Rig!
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
        },
        dispose(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.stop();
            if (S.data.exoRig && S.data.exoRig.parent) S.data.exoRig.parent.remove(S.data.exoRig);
        },
        onKey(S, code) {
            if (MG.state !== 'running') return false;
            if (code === 'KeyQ') { this._fireSonarPulse(S); return true; }
            if (code === 'KeyE') { this._triggerGroundSlam(S); return true; }
            return false;
        },
        onHit(S, tg, info) {
            if (tg.kind && tg.kind.startsWith('abyss_')) {
                const entry = S.data.beasts.find((b) => b.tgt === tg);
                if (entry) {
                    // Sonar-highlighted enemies take +50% crit bonus!
                    if (entry.revealedT > 0 && tg.hp > 1) tg.hp -= 0.5;
                    // Hitting Kraken crimson eyes triggers ink-cloud & stagger!
                    if (entry.isKraken && info.hitbox === 'head') {
                        entry.eyeHits = (entry.eyeHits || 0) + 1;
                        if (entry.eyeHits % 5 === 0) {
                            entry.stunT = 2.0;
                            BO.FX.spawnParticles(tg.basePos.clone().add(V(0, 1.8, 0)), 32, 0x1e1b4b, 7.5, 2, 0.8, 1.6);
                            BO.FX.spawnParticles(tg.basePos.clone().add(V(0, 1.8, 0)), 14, 0xf43f5e, 5.5, 2, 0.5, 1.0);
                            MG.toast('🐙 KRAKEN EYE CRIT — INK CLOUD & STAGGERED!', '#f472b6');
                            SFX.rumble(0.5);
                        }
                    }
                }
            }
            return undefined;
        },
        _fireHarpoonBarrage(S) {
            const D = S.data, cam = BO.App.worldCamera;
            if (D.torpCd > 0 || !cam) return;
            D.torpCd = 6.5;
            const baseFwd = new THREE.Vector3(); cam.getWorldDirection(baseFwd);
            for (const ang of [-0.09, 0, 0.09]) {
                const dir = baseFwd.clone().applyAxisAngle(V(0, 1, 0), ang);
                const tg = new THREE.Group();
                const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.78, 6, 10), std(0xfacc15, 0.25, 0.85));
                hull.rotation.x = Math.PI / 2;
                const nose = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.42, 8), basic(0x22d3ee));
                nose.rotation.x = Math.PI / 2; nose.position.z = 0.55;
                tg.add(hull, nose);
                tg.position.copy(cam.position).addScaledVector(dir, 1.4);
                tg.lookAt(tg.position.clone().add(dir));
                S.add(tg);
                D.torpedoes.push({ mesh: tg, vel: dir.multiplyScalar(32), life: 2.5 });
            }
            tone(260, 110, 0.26, 'sawtooth', 0.13);
            MG.toast('🔱 HARPOON TORPEDO BARRAGE FIRED!', '#fde047');
        },
        _fireSonarPulse(S) {
            const D = S.data, P = BO.Player;
            if (D.sonarCd > 0) return;
            D.sonarCd = 8.0;
            if (BO.MinigameAudio) BO.MinigameAudio.sonarPing(); else tone(880, 440, 0.35, 'sine', 0.14);

            // Emit 3D Cyan Expanding Wave across the trench!
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(1.2, 0.16, 8, 36),
                new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.92 })
            );
            ring.rotation.x = Math.PI / 2;
            ring.position.set(P.pos.x, Math.max(0.35, P.pos.y + 0.4), P.pos.z);
            S.add(ring);
            D.sonarWaves.push({ mesh: ring, t: 0, dur: 1.05 });

            P.hp = Math.min(P.maxHp, P.hp + 20);
            let revealed = 0;
            for (const b of D.beasts) {
                if (!b.tgt.alive) continue;
                b.stunT = Math.max(b.stunT, 2.8);
                b.revealedT = 8.5;
                revealed++;
                if (b.built.skinM) b.built.skinM.opacity = 0.95;
                if (b.built.weakHalo) b.built.weakHalo.material.opacity = 0.85;
            }
            MG.toast(`📡 SONAR WAVE — ${revealed} PREDATORS REVEALED & STUNNED (+20 HP)!`, '#67e8f9');
        },
        _triggerGroundSlam(S) {
            const D = S.data, P = BO.Player;
            if (D.slamCd > 0) return;
            D.slamCd = 8.0;
            if (P.pos.y > 0.8) {
                P.vel.y = -26;
                D.pendingSlam = true;
                tone(320, 120, 0.20, 'square', 0.12);
            } else {
                this._executeSlamImpact(S);
            }
        },
        _executeSlamImpact(S) {
            const D = S.data, P = BO.Player;
            D.pendingSlam = false;
            const c = V(P.pos.x, 0.35, P.pos.z);
            BO.FX.spawnExplosion(c, 7.5, 0x22d3ee);
            BO.FX.spawnParticles(c, 28, 0xfacc15, 8, 3, 0.45, 1.0);
            SFX.rumble(0.75);
            BO.Juice?.shake?.(0.12);
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(1.5, 0.22, 8, 32),
                new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.95 })
            );
            ring.rotation.x = Math.PI / 2; ring.position.copy(c);
            S.add(ring);
            D.sonarWaves.push({ mesh: ring, t: 0, dur: 0.65 });

            let hitCnt = 0;
            for (const b of D.beasts.slice()) {
                if (!b.tgt.alive) continue;
                const d = b.tgt.basePos.distanceTo(c);
                if (d < 10.5) {
                    b.tgt.hp -= 7;
                    b.stunT = Math.max(b.stunT, 2.2);
                    const push = b.tgt.basePos.clone().sub(c).setY(0).normalize();
                    b.tgt.basePos.addScaledVector(push, 4.5);
                    hitCnt++;
                    if (b.tgt.hp <= 0) {
                        S.award(320, b.tgt.basePos.clone(), '💥 HYDRAULIC SLAM!', '#fde047');
                        S.kills++; S.bumpCombo();
                        b.tgt.kill({ pt: c });
                    }
                }
            }
            MG.toast(`🔨 HYDRAULIC GROUND-SLAM — HIT ${hitCnt} PREDATOR(S)!`, '#fde047');
        },
        _spawnBeast(S, kind) {
            const D = S.data;
            const isKraken = kind === 'kraken';
            if (!isKraken && D.beasts.length >= 9) return;
            const built = buildAbyssPredator(kind);
            const pos = isKraken ? V(0, 5.2, -23) : V((Math.random() - 0.5) * 44, 2.2 + Math.random() * 5.5, -25 - Math.random() * 4);
            const maxHp = isKraken ? 72 : kind === 'angler' ? 6 : kind === 'stalker' ? 5 : 3;
            const tgt = S.addTarget({
                kind: 'abyss_' + kind, mesh: built.root, hitMeshes: built.hit, pos,
                hp: maxHp, life: 0, points: isKraken ? 3600 : kind === 'angler' ? 350 : kind === 'stalker' ? 420 : 210,
                appear: 'scale', death: 'burst', deathColor: isKraken ? 0xf43f5e : 0x22d3ee,
                onKill: () => {
                    D.slain++;
                    D.beasts = D.beasts.filter((x) => x.tgt !== tgt);
                    if (isKraken) {
                        D.krakenSlain = true;
                        BO.FX.spawnExplosion(tgt.basePos.clone(), 10.0, 0x22d3ee);
                        SFX.fanfare();
                        MG.finish('🐙 ABYSSAL KRAKEN VANQUISHED — NEREUS-7 SECURE!', { color: '#67e8f9', delay: 2.2 });
                    }
                }
            });
            const speed = isKraken ? 2.6 : kind === 'angler' ? 3.5 : kind === 'stalker' ? 6.2 : 5.5;
            const entry = { kind, isKraken, maxHp, tgt, built, speed, phase: Math.random() * 6, stunT: 0, revealedT: 0, atkCd: 1.8 };
            D.beasts.push(entry);
            if (isKraken) {
                D.kraken = entry;
                if (BO.MinigameAudio) BO.MinigameAudio.kaijuRoar();
                MG.toast('🐙 SEISMIC TRENCH ALERT: COLOSSAL ABYSSAL KRAKEN SURFACING!', '#f43f5e');
                SFX.rumble(0.95);
            }
        },
        update(S, dt, lib, state) {
            if (state !== 'running') return;
            if (BO.MinigameAudio) BO.MinigameAudio.tick(dt);
            const D = S.data, P = BO.Player;
            D.torpCd = Math.max(0, D.torpCd - dt);
            D.sonarCd = Math.max(0, D.sonarCd - dt);
            D.slamCd = Math.max(0, D.slamCd - dt);

            // RMB triggers Harpoon Torpedo Barrage!
            if (P.adsHeld && !D._rmb) { D._rmb = true; this._fireHarpoonBarrage(S); }
            else if (!P.adsHeld) D._rmb = false;

            // Animate volumetric caustic sunbeams, jellyfish & kelp
            for (const sb of D.sunbeams) sb.mesh.rotation.z = sb.baseZ + Math.sin(S.t * 0.65 + sb.ph) * 0.05;
            for (const kl of D.kelps) kl.mesh.rotation.z = Math.sin(S.t * 1.4 + kl.ph) * 0.14;
            for (const jf of D.jellies) {
                jf.grp.position.y = jf.baseY + Math.sin(S.t * 1.5 + jf.ph) * 0.9;
                const sc = 1 + Math.sin(S.t * 3.5 + jf.ph) * 0.12;
                jf.grp.scale.set(sc, 1 / sc, sc);
            }

            // Expanding 3D Sonar & Slam Waves
            for (let i = D.sonarWaves.length - 1; i >= 0; i--) {
                const sw = D.sonarWaves[i];
                sw.t += dt;
                const p = sw.t / sw.dur;
                sw.mesh.scale.setScalar(1 + p * 26);
                sw.mesh.material.opacity = Math.max(0, (1 - p) * 0.9);
                if (p >= 1) { S.scene.remove(sw.mesh); D.sonarWaves.splice(i, 1); }
            }

            // Underwater Low-Buoyancy Physics + Hydro-Jets [SPACE] + Bubble-Lift Vents + Hydraulic Slam!
            if (!P.onGround) P.vel.y += 9.5 * dt;
            if (P.keys['Space']) { P.vel.y = Math.min(9.0, P.vel.y + 20 * dt); P.onGround = false; }
            for (const v of D.vents) {
                if (Math.random() < dt * 14) BO.FX.spawnParticles(v.clone().add(V(0, 1.5, 0)), 2, 0x38bdf8, 1.4, 6.5, 0.55, 0.9);
                if (Math.hypot(P.pos.x - v.x, P.pos.z - v.z) < 2.2 && P.pos.y < 7.5) {
                    P.vel.y = Math.max(P.vel.y, 13.8);
                    P.onGround = false;
                }
            }
            if (D.pendingSlam && (P.onGround || P.pos.y <= 0.35)) this._executeSlamImpact(S);

            // Update Harpoon Torpedoes
            for (let i = D.torpedoes.length - 1; i >= 0; i--) {
                const tp = D.torpedoes[i];
                tp.life -= dt;
                tp.mesh.position.addScaledVector(tp.vel, dt);
                if (Math.random() < dt * 28) BO.FX.spawnParticles(tp.mesh.position, 2, 0xe0f2fe, 1.5, 1, 0.25, 0.5);
                let hit = tp.life <= 0 || tp.mesh.position.y <= 0.2;
                for (const b of D.beasts) {
                    if (b.tgt.alive && b.tgt.basePos.distanceTo(tp.mesh.position) < (b.isKraken ? 4.4 : 2.3)) { hit = true; break; }
                }
                if (hit) {
                    const c = tp.mesh.position.clone();
                    BO.FX.spawnExplosion(c, 5.8, 0x22d3ee);
                    SFX.rumble(0.45);
                    for (const b of D.beasts.slice()) {
                        if (b.tgt.alive && b.tgt.basePos.distanceTo(c) < 7.2) {
                            b.tgt.hp -= 6;
                            if (b.tgt.hp <= 0) {
                                S.award(300, b.tgt.basePos.clone(), '🔱 HARPOON HIT!', '#67e8f9');
                                S.kills++; S.bumpCombo();
                                b.tgt.kill({ pt: c });
                            }
                        }
                    }
                    S.scene.remove(tp.mesh); D.torpedoes.splice(i, 1);
                }
            }

            if (!D.krakenSpawned && (D.slain >= 14 || S.t >= 62)) {
                D.krakenSpawned = true;
                this._spawnBeast(S, 'kraken');
            }
            D.spawnCd -= dt;
            if (D.spawnCd <= 0) {
                D.spawnCd = 2.4;
                const r = Math.random();
                this._spawnBeast(S, r < 0.28 ? 'stalker' : r < 0.60 ? 'angler' : 'shark');
            }

            // Animate Swimming Trench Predators & Multi-Segment Kraken Tentacles!
            for (const b of D.beasts) {
                if (!b.tgt.alive) continue;
                b.phase += dt * (b.isKraken ? 3.8 : 7.5);
                if (b.revealedT > 0) {
                    b.revealedT = Math.max(0, b.revealedT - dt);
                    if (b.revealedT === 0) {
                        if (b.built.skinM) b.built.skinM.opacity = 0.24;
                        if (b.built.weakHalo) b.built.weakHalo.material.opacity = 0.0;
                    }
                }
                if (b.built.tailPivot) b.built.tailPivot.rotation.y = Math.sin(b.phase * 1.4) * 0.55;
                if (b.built.veins) {
                    const pulse = 0.5 + 0.5 * Math.sin(S.t * 4);
                    b.built.veins.forEach((v, idx) => { v.scale.setScalar(0.88 + 0.22 * Math.sin(S.t * 5 + idx) * pulse); });
                }
                if (b.built.tentacles) {
                    b.built.tentacles.forEach((ten, idx) => {
                        ten.baseG.rotation.x = Math.sin(b.phase + idx * 0.8) * 0.24;
                        ten.segs.forEach((sg, sIdx) => {
                            sg.rotation.x = Math.sin(b.phase * 1.15 + idx * 0.9 - sIdx * 0.75) * (0.28 + sIdx * 0.08);
                            sg.rotation.y = Math.cos(b.phase * 0.85 + idx * 0.7 - sIdx * 0.6) * 0.22;
                        });
                    });
                }
                if (b.stunT > 0) { b.stunT -= dt; continue; }

                const toG = D.domePos.clone().sub(b.tgt.basePos);
                const distDome = toG.length();
                const toP = P.pos.clone().add(V(0, 1.3, 0)).sub(b.tgt.basePos);
                const chaseVec = (b.isKraken && distDome < 16) ? toG : (toP.length() < 13 ? toP : toG);
                const d = Math.max(0.1, chaseVec.length());
                if (d > (b.isKraken ? 8.8 : 3.2)) {
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
            const depth = Math.round(4085 - BO.Player.pos.y * 3);
            const visorFrame = `<div style="position:fixed;inset:0;pointer-events:none;z-index:-1;box-shadow:inset 0 0 90px rgba(6,182,212,0.28),inset 0 0 22px rgba(34,211,238,0.35);border:3px solid rgba(34,211,238,0.25);border-radius:28px;"></div>`;
            return `${visorFrame}
            <div class="fun-panel">
                <div class="mgx-chip ${D.domeHp < 35 ? 'mgx-hot' : ''}">🤿 DOME <b>${Math.ceil(D.domeHp)}%</b></div>
                <div class="mgx-chip">🌊 DEPTH <b>${depth}M</b></div>
                <div class="mgx-chip ${D.sonarCd <= 0 ? 'mgx-hot' : ''}">📡 SONAR [Q] <b>${D.sonarCd <= 0 ? 'READY' : D.sonarCd.toFixed(1) + 's'}</b></div>
                <div class="mgx-chip ${D.torpCd <= 0 ? 'mgx-hot' : ''}">🔱 HARPOON [RMB] <b>${D.torpCd <= 0 ? 'READY' : D.torpCd.toFixed(1) + 's'}</b></div>
                <div class="mgx-chip ${D.slamCd <= 0 ? 'mgx-hot' : ''}">🔨 SLAM [E] <b>${D.slamCd <= 0 ? 'READY' : D.slamCd.toFixed(1) + 's'}</b></div>
            </div>
            ${kr ? `<div class="fun-panel" style="margin-top:5px;"><div class="fun-bar-wrap"><div class="fun-bar-lbl"><span>🐙 COLOSSAL ABYSSAL KRAKEN (AIM AT CRIMSON EYES!)</span><b>${Math.max(0, Math.round(kr.tgt.hp))} / ${kr.maxHp}</b></div><div class="fun-bar"><i style="width:${Math.max(0, Math.round(kr.tgt.hp / kr.maxHp * 100))}%;background:linear-gradient(90deg,#06b6d4,#f43f5e)"></i></div></div></div>` : ''}`;
        },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return {
                score: S.score, stars,
                title: D.krakenSlain ? 'LEVIATHAN SLAYER OF NEREUS-7' : 'TRENCH DIVE CONCLUDED',
                stats: [['ABYSSAL BEASTS SLAIN', D.slain], ['ABYSSAL KRAKEN', D.krakenSlain ? 'VANQUISHED' : D.krakenSpawned ? 'SURVIVED' : 'NOT SURFACED'], ['HABITAT DOME INTEGRITY', Math.ceil(D.domeHp) + '%']],
                xp: Math.round(190 + S.score * 0.032 + stars * 160)
            };
        }
    });

    /* =====================================================================
       19. JURASSIC PADDOCK JEEP SAFARI
       Monsoon Rainstorm + Atmospheric Lightning Flashes + Sparking 10kV
       Containment Fences & Shootable Capacitors + Swaying Palm/Fern Jungle +
       Detailed Safari Jeep w/ Turret Spotlight & Horn + Articulated Fanged
       Dinosaurs + Signal Flare [Q] 2x Crit Lure + Multi-Wave Breakout Finale!
    ===================================================================== */
    function dinoScaleTex(baseHex, stripeHex) {
        return L.canvasTex('dino-sc:' + baseHex + ':' + stripeHex, 256, 256, (g, w, h) => {
            g.fillStyle = baseHex; g.fillRect(0, 0, w, h);
            g.fillStyle = stripeHex;
            for (let y = 0; y < h; y += 34) {
                g.beginPath();
                g.moveTo(0, y); g.lineTo(w, y + 14); g.lineTo(w, y + 26); g.lineTo(0, y + 12);
                g.closePath(); g.fill();
            }
            const rnd = L.mulberry32(991);
            for (let i = 0; i < 240; i++) {
                g.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.08)';
                g.beginPath(); g.arc(rnd() * w, rnd() * h, 3 + rnd() * 4, 0, TAU); g.fill();
            }
        });
    }

    function buildDinosaur(kind) {
        const root = new THREE.Group();
        const hit = [];
        const isRex = kind === 'trex';
        const isPtera = kind === 'ptera';

        if (isPtera) {
            const wingTex = dinoScaleTex('#9a3412', '#451a03');
            const wingM = new THREE.MeshStandardMaterial({ map: wingTex, roughness: 0.62, side: THREE.DoubleSide });
            const crestM = std(0xfacc15, 0.4);
            const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.85, 5, 8), wingM);
            torso.rotation.x = Math.PI / 2;
            const beak = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.15, 6), crestM);
            beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.12, 0.98);
            beak.userData.hitbox = 'head';
            const crest = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.72, 6), crestM);
            crest.rotation.x = -Math.PI * 0.42; crest.position.set(0, 0.30, 0.25);
            root.add(torso, beak, crest);
            hit.push(torso, beak);

            const wings = [];
            for (const sx of [-1, 1]) {
                const wg = new THREE.Group();
                const mem = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 0.9), wingM);
                mem.position.x = sx * 1.1;
                wg.add(mem); root.add(wg); hit.push(mem);
                wings.push({ wg, sx });
            }
            return { root, hit, legs: [], wings, tailPivot: null, jawPivot: null };
        }

        const sc = isRex ? 2.55 : 0.96;
        const hideTex = dinoScaleTex(isRex ? '#5c4028' : '#3f6212', isRex ? '#291c11' : '#ca8a04');
        const hideM = new THREE.MeshStandardMaterial({ map: hideTex, roughness: 0.72, metalness: 0.08 });
        const bellyM = std(0xd6d3d1, 0.85);
        const fangM = basic(0xf8fafc);

        const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.46 * sc, 1.18 * sc, 6, 12), hideM);
        body.rotation.x = Math.PI * 0.42; body.position.set(0, 1.18 * sc, 0);
        const belly = new THREE.Mesh(new THREE.CapsuleGeometry(0.36 * sc, 0.96 * sc, 5, 10), bellyM);
        belly.rotation.x = Math.PI * 0.42; belly.position.set(0, 1.04 * sc, 0.08 * sc);

        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * sc, 0.38 * sc, 0.74 * sc, 10), hideM);
        neck.position.set(0, 1.62 * sc, 0.68 * sc); neck.rotation.x = 0.45;
        const skull = new THREE.Mesh(new THREE.BoxGeometry(0.56 * sc, 0.44 * sc, 0.96 * sc), hideM);
        skull.position.set(0, 1.94 * sc, 1.15 * sc);
        skull.userData.hitbox = 'head';

        // Upper fang row
        for (let f = -2; f <= 2; f++) {
            for (const sx of [-0.21, 0.21]) {
                const fang = new THREE.Mesh(new THREE.ConeGeometry(0.036 * sc, 0.14 * sc, 5), fangM);
                fang.rotation.x = Math.PI;
                fang.position.set(sx * sc, 1.68 * sc, (1.02 + f * 0.13) * sc);
                root.add(fang);
            }
        }

        // Articulated Lower Jaw Pivot with Fang Row (snaps open on charge/roar!)
        const jawPivot = new THREE.Group();
        jawPivot.position.set(0, 1.72 * sc, 0.78 * sc);
        const lowerJaw = new THREE.Mesh(new THREE.BoxGeometry(0.46 * sc, 0.18 * sc, 0.82 * sc), hideM);
        lowerJaw.position.set(0, -0.06 * sc, 0.38 * sc);
        lowerJaw.userData.hitbox = 'head';
        jawPivot.add(lowerJaw);
        for (let f = -1; f <= 2; f++) {
            for (const sx of [-0.17, 0.17]) {
                const lFang = new THREE.Mesh(new THREE.ConeGeometry(0.03 * sc, 0.11 * sc, 5), fangM);
                lFang.position.set(sx * sc, 0.06 * sc, (0.28 + f * 0.14) * sc);
                jawPivot.add(lFang);
            }
        }
        root.add(jawPivot);
        hit.push(lowerJaw);

        // Glowing predator eyes visible through monsoon mist!
        for (const sx of [-0.24, 0.24]) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075 * sc, 8, 6), basic(isRex ? 0xf43f5e : 0xfacc15));
            eye.position.set(sx * sc, 2.02 * sc, 1.28 * sc);
            root.add(eye);
            const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07 * sc, 0.28 * sc, 4, 6), hideM);
            arm.position.set(sx * 1.3 * sc, 1.15 * sc, 0.65 * sc); arm.rotation.x = 0.6;
            root.add(arm);
        }

        // Counter-balancing articulated tail
        const tailPivot = new THREE.Group();
        tailPivot.position.set(0, 1.12 * sc, -0.58 * sc);
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.38 * sc, 2.15 * sc, 10), hideM);
        tail.rotation.x = -Math.PI * 0.48; tail.position.set(0, 0, -0.95 * sc);
        tailPivot.add(tail);
        root.add(tailPivot);

        const legs = [];
        for (const sx of [-0.36, 0.36]) {
            const lg = new THREE.Group();
            lg.position.set(sx * sc, 0.95 * sc, -0.05 * sc);
            const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.20 * sc, 0.62 * sc, 5, 8), hideM);
            thigh.position.y = -0.35 * sc;
            const foot = new THREE.Mesh(new THREE.BoxGeometry(0.28 * sc, 0.14 * sc, 0.48 * sc), hideM);
            foot.position.set(0, -0.86 * sc, 0.12 * sc);
            lg.add(thigh, foot);
            root.add(lg); hit.push(thigh);
            legs.push(lg);
        }

        root.add(body, belly, neck, skull);
        hit.push(body, neck, skull, tail);
        root.traverse((m) => { if (m.isMesh) m.castShadow = true; });
        return { root, hit, legs, wings: null, tailPivot, jawPivot };
    }

    function buildSafariJeep() {
        const g = new THREE.Group();
        const bodyTan = std(0xd6d3d1, 0.42, 0.35);
        const redStripe = std(0xdc2626, 0.32, 0.42);
        const rollCage = std(0x1e293b, 0.38, 0.82);
        const glassM = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 });

        const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.95, 4.9), bodyTan);
        chassis.position.y = 0.92;
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.62, 0.30, 4.5), redStripe);
        stripe.position.y = 0.96;
        const hood = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.32, 1.65), redStripe);
        hood.position.set(0, 1.48, 1.48);
        const winch = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.1, 10), rollCage);
        winch.rotation.z = Math.PI / 2; winch.position.set(0, 0.72, 2.55);
        const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.75, 0.08), glassM);
        windshield.position.set(0, 1.88, 0.72); windshield.rotation.x = -0.25;
        const spareTire = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.32, 14), std(0x18181b, 0.9));
        spareTire.rotation.x = Math.PI / 2; spareTire.position.set(0, 1.15, -2.55);
        g.add(chassis, stripe, hood, winch, windshield, spareTire);

        for (const [wx, wz] of [[-1.32, 1.5], [1.32, 1.5], [-1.32, -1.5], [1.32, -1.5]]) {
            const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.40, 16), std(0x18181b, 0.9));
            tire.rotation.z = Math.PI / 2; tire.position.set(wx, 0.54, wz);
            g.add(tire);
        }
        // Full Overhead Roll-Cage + Lightbar!
        for (const sx of [-1.08, 1.08]) {
            const postF = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.45, 8), rollCage);
            postF.position.set(sx, 2.02, 0.68);
            const postB = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.45, 8), rollCage);
            postB.position.set(sx, 2.02, -1.9);
            const topRail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.65, 8), rollCage);
            topRail.rotation.x = Math.PI / 2; topRail.position.set(sx, 2.72, -0.6);
            g.add(postF, postB, topRail);
        }
        const roofBar = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 2.25, 8), rollCage);
        roofBar.rotation.z = Math.PI / 2; roofBar.position.set(0, 2.72, 0.55);
        g.add(roofBar);

        // Turret Spotlight Assembly on Roll-Cage!
        const turret = new THREE.Group();
        turret.position.set(0, 2.86, 0.55);
        const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.42, 12), rollCage);
        lamp.rotation.x = Math.PI / 2;
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.22, 12), basic(0xfef08a));
        lens.position.z = -0.22; lens.rotation.y = Math.PI;
        const beam = new THREE.Mesh(
            new THREE.ConeGeometry(3.8, 18, 14, 1, true),
            new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.085, depthWrite: false, side: THREE.DoubleSide })
        );
        beam.rotation.x = -Math.PI / 2; beam.position.z = -9.2;
        turret.add(lamp, lens, beam);
        g.add(turret);

        for (const hx of [-0.78, 0.78]) {
            const hl = new THREE.Mesh(new THREE.CircleGeometry(0.22, 14), basic(0xfef08a));
            hl.position.set(hx, 1.05, 2.48); g.add(hl);
        }
        return { grp: g, turret };
    }

    MG.register({
        id: 'fun_dino_safari', cat: 'fun', order: 19,
        name: 'Jurassic Paddock Jeep Safari', icon: '🦖', accent: '#84cc16', badge: 'DINO BREAKOUT',
        tagline: 'Monsoon Paddock Breakout! Toss Signal Flares [Q] for 2x Crit Lures, shoot Fence Capacitors & bring down Rexy!',
        desc: 'Monsoon lightning illuminates Isla Nublar as the 10,000V T-Rex Paddock fails around stalled Safari Jeep #18! Survive multi-wave breakouts of fanged Velociraptors & swooping Pteranodons amid swaying palms, monsoon rain streaks, and sparking containment fences! Toss [Q] Red Signal Flares to lure predators for 2x CRIT COMBOS, shoot glowing High-Voltage Fence Capacitors to chain-electrocute packs, honk the Jeep Horn & Spotlight [E], and face ALPHA TYRANNOSAURUS REX!',
        guide: {
            objective: 'Survive Wave 1 (Raptors) & Wave 2 (Pteranodons), protect Safari Jeep #18, and defeat ALPHA TYRANNOSAURUS REX in Wave 3!',
            tips: [
                'Press [Q] (9s cooldown) to toss a RED SIGNAL FLARE—lures ground dinosaurs to swarm it AND grants 2X CRITICAL DAMAGE on lured predators!',
                'Shoot the 4 glowing cyan HIGH-VOLTAGE FENCE CAPACITORS along the perimeter fence to unleash a 10,000V chain-lightning shock across nearby dinos!',
                'Press [E] (8s cooldown) to blast Safari Jeep #18\'s Horn & Spotlight Flash, knocking back nearby predators—and aim for the T-Rex\'s snapping fanged jaws!'
            ]
        },
        heroLabel: 'FUN & SPECIALS • PREHISTORIC PADDOCK SURVIVAL', duration: 170,
        stars: [3000, 6200, 10200, 14800],
        standardWeapon: 'm249', secondaryWeapon: 'spas12_tac', lockWeapon: true, infiniteMag: true, forgivingMisses: true, customMusic: true,
        blockKeys: ['KeyQ', 'KeyE'],
        weaponLabel: 'RANGER M249 SAW + SPAS-12 + FLARE [Q] + JEEP HORN [E]', weaponNote: '[Q] Signal Flare (2x Crit Lure) • Shoot Fence Capacitors (10kV Zap!) • [E] Jeep Horn/Flash',
        keys: [['WASD', 'Evade Through Mud'], ['Q', 'Toss Signal Flare (2x Crit)'], ['E', 'Jeep Horn & Flash'], ['SHOOT CAPS', '10kV Fence Zap']],
        map: {
            atmosphere: { skyTop: 0x090f1d, skyBottom: 0x134e4a, fogColor: 0x0f2726, fogDensity: 0.013, sunColor: 0x99f6e4, sunIntensity: 1.0, sunPos: [-25, 45, 20], hemiSky: 0x5eead4, hemiGround: 0x1c1917, hemiIntensity: 0.82 },
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
                jeepHp: 100, dinos: [], flares: [], capacitors: [], palms: [],
                flareCd: 0, hornCd: 0, wave: 1, lightningCd: 6.5, flashT: 0,
                spawnCd: 1.1, slain: 0, trex: null, trexSpawned: false, trexSlain: false
            });

            // Wet Muddy Safari Track + PBR Moss/Wetlands Floor!
            const groundTex = L.canvasTex('isla-mud-road-v2', 512, 512, (g, w, h) => {
                g.fillStyle = '#14532d'; g.fillRect(0, 0, w, h);
                g.fillStyle = '#3b1806'; g.fillRect(w / 2 - 72, 0, 144, h);
                g.strokeStyle = '#78350f'; g.lineWidth = 10;
                g.strokeRect(w / 2 - 50, 0, 28, h); g.strokeRect(w / 2 + 22, 0, 28, h);
            });
            const ground = new THREE.Mesh(new THREE.PlaneGeometry(61, 61), new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.35, metalness: 0.15 }));
            ground.rotation.x = -Math.PI / 2; ground.position.y = 0.02; S.add(ground);

            // Torch-Lit JURASSIC PADDOCK Concrete Archway at North End (z = -24)
            const gateWood = std(0x451a03, 0.85), concreteM = std(0x64748b, 0.8);
            for (const sx of [-7.5, 7.5]) {
                S.box(sx, 5.2, -24, 2.6, 10.4, 2.6, concreteM, { solid: true });
                S.add(A.torch(S, V(sx, 4.5, -22.4), 0xf97316, false));
            }
            S.box(0, 9.6, -24, 18.0, 2.0, 2.4, gateWood, { solid: false });
            const pSign = A.sign('⚠️ 10,000 VOLTS — TYRANNOSAUR PADDOCK 09 ⚠️', 13.5, 1.15, { bg: '#450a0a', color: '#fde047', borderColor: '#ef4444', size: 0.34, glow: '#f59e0b' });
            pSign.position.set(0, 9.6, -22.65); S.add(pSign);
            const archPts = [];
            for (let x = -7.5; x <= 7.5; x += 1.5) archPts.push(V(x, 10.65, -22.5));
            const archBulbs = A.bulbs(archPts, [0xef4444, 0xfacc15], 0.14);
            S.add(archBulbs); A.animateBulbs(S, archBulbs, 6, 'chase');

            // Electrified Containment Fence Pylons + Steel Cables + 4 Shootable High-Voltage Capacitors!
            const cableMat = basic(0x94a3b8);
            for (let i = -24; i <= 24; i += 12) {
                for (const side of [-27, 27]) {
                    const pyl = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.45, 8.5, 10), concreteM);
                    pyl.position.set(side, 4.25, i); S.add(pyl);
                    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), basic(0xef4444));
                    beacon.position.set(side, 8.7, i); S.add(beacon);
                }
            }
            for (const side of [-27, 27]) {
                for (const cy of [2.2, 4.5, 6.8]) {
                    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 52, 6), cableMat);
                    wire.rotation.x = Math.PI / 2; wire.position.set(side, cy, 0); S.add(wire);
                }
            }

            // 4 Shootable High-Voltage Fence Capacitors!
            for (const [cx, cz] of [[-24.5, -10], [24.5, -10], [-24.5, 10], [24.5, 10]]) {
                const cg = new THREE.Group();
                const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.85, 2.4, 12), std(0x334155, 0.3, 0.85));
                coil.position.y = 1.2;
                const orbMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
                const orb = new THREE.Mesh(new THREE.SphereGeometry(0.62, 14, 10), orbMat);
                orb.position.y = 2.75; orb.userData.hitbox = 'head';
                const lbl = labelSprite('⚡ 10KV CAPACITOR', '#67e8f9', 2.2);
                lbl.position.y = 3.85;
                cg.add(coil, orb, lbl);
                const capObj = { pos: V(cx, 2.75, cz), orbMat, lbl, cd: 0 };
                S.addTarget({
                    kind: 'fence_capacitor', mesh: cg, hitMeshes: [coil, orb], pos: V(cx, 0, cz),
                    hp: 9999, life: 0, points: 200, appear: 'none', death: 'none', bonus: true,
                    onDamage: (t) => {
                        t.hp = 9999;
                        if (capObj.cd > 0) return;
                        capObj.cd = 12.0;
                        orbMat.setHex(0x475569);
                        lbl.visible = false;
                        this._triggerCapacitorArc(S, capObj.pos);
                    }
                });
                D.capacitors.push(capObj);
            }

            // Lush Swaying Palm Trees & Tropical Fern Clusters!
            const fernM = std(0x15803d, 0.82, 0, { side: THREE.DoubleSide });
            for (let t = 0; t < 16; t++) {
                const tx = (t % 2 ? 1 : -1) * (10.5 + (t % 4) * 3.8);
                const tz = -20 + Math.floor(t / 2) * 5.4;
                const palm = A.palm(1.1 + (t % 3) * 0.25);
                palm.position.set(tx, 0, tz); palm.rotation.y = t * 1.1;
                S.add(palm);
                D.palms.push(palm);

                // Ground fern rosette
                const fg = new THREE.Group(); fg.position.set(tx + (t % 2 ? -1.4 : 1.4), 0.1, tz + 1.1);
                for (let f = 0; f < 5; f++) {
                    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.35, 4), fernM);
                    leaf.rotation.z = 0.85; leaf.rotation.y = (f / 5) * TAU;
                    leaf.position.y = 0.4; fg.add(leaf);
                }
                S.add(fg);
            }

            // Detailed Safari Patrol Jeep #18 at (0, 0, 14.5)
            const builtJeep = buildSafariJeep();
            builtJeep.grp.position.set(0, 0, 14.5); builtJeep.grp.rotation.y = 0.24;
            const jLbl = labelSprite('🚙 SAFARI JEEP #18', '#fde047', 2.5);
            jLbl.position.set(0, 3.6, 0); builtJeep.grp.add(jLbl);
            S.add(builtJeep.grp);
            S.collider(-1.5, 0, 12.2, 1.5, 2.4, 16.8);
            D.jeepPos = V(0, 0, 14.5);
            D.jeepTurret = builtJeep.turret;
        },
        dispose(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.stop();
        },
        onKey(S, code) {
            if (MG.state !== 'running') return false;
            if (code === 'KeyQ') { this._tossRoadFlare(S); return true; }
            if (code === 'KeyE') { this._jeepHornFlash(S); return true; }
            return false;
        },
        onHit(S, tg) {
            if (tg.kind && tg.kind.startsWith('dino_')) {
                const entry = S.data.dinos.find((d) => d.tgt === tg);
                if (entry && S.data.flares.length > 0 && !entry.isPtera) {
                    // Signal Flare 2x Crit Combo on lured predators!
                    if (tg.hp > 1) tg.hp -= 1;
                    S.award(85, tg.basePos.clone().add(V(0, 2.1, 0)), '🧨 2X FLARE CRIT!', '#fda4af');
                }
            }
            return undefined;
        },
        _triggerCapacitorArc(S, origin) {
            const D = S.data;
            tone(180, 960, 0.32, 'sawtooth', 0.14);
            let zapped = 0;
            for (const d of D.dinos.slice()) {
                if (!d.tgt.alive) continue;
                if (d.tgt.basePos.distanceTo(origin) < 28 && zapped < 5) {
                    const hitPt = d.tgt.basePos.clone().add(V(0, 1.6, 0));
                    BO.FX.spawnTracer(origin, hitPt, 0x38bdf8, 0.20, 0.28);
                    BO.FX.spawnParticles(hitPt, 16, 0xfef08a, 5.5, 3, 0.35, 0.85);
                    d.tgt.hp -= 6;
                    zapped++;
                    if (d.tgt.hp <= 0) {
                        S.award(320, hitPt, '⚡ 10,000V CAPACITOR ZAP!', '#67e8f9');
                        S.kills++; S.bumpCombo();
                        d.tgt.kill({ pt: hitPt });
                    }
                }
            }
            MG.toast(`⚡ CAPACITOR DISCHARGE — ZAPPED ${zapped} DINOSAUR(S)!`, '#67e8f9');
        },
        _jeepHornFlash(S) {
            const D = S.data;
            if (D.hornCd > 0) return;
            D.hornCd = 8.0;
            // Dual-tone Jeep Klaxon Horn!
            tone(392, 392, 0.28, 'sawtooth', 0.14);
            tone(494, 494, 0.28, 'sawtooth', 0.12, 0.03);
            BO.FX.spawnExplosion(D.jeepPos.clone().add(V(0, 2.2, 0)), 6.0, 0xfef08a);
            let pushed = 0;
            for (const d of D.dinos) {
                if (!d.tgt.alive) continue;
                const dist = d.tgt.basePos.distanceTo(D.jeepPos);
                if (dist < 14) {
                    const away = d.tgt.basePos.clone().sub(D.jeepPos).setY(0).normalize();
                    d.tgt.basePos.addScaledVector(away, 6.0);
                    d.atkCd = 2.0;
                    pushed++;
                }
            }
            MG.toast(`📯 JEEP #18 KLAXON & SPOTLIGHT FLASH — REPELLED ${pushed} DINO(S)!`, '#fde047');
        },
        _tossRoadFlare(S) {
            const D = S.data, cam = BO.App.worldCamera, P = BO.Player;
            if (D.flareCd > 0 || !cam) return;
            D.flareCd = 9.0;
            const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
            const land = P.pos.clone().addScaledVector(V(fwd.x, 0, fwd.z).normalize(), 9.5);
            land.x = BO.Math.clamp(land.x, -22, 22);
            land.z = BO.Math.clamp(land.z, -20, 22);
            land.y = 0.12;

            const fg = new THREE.Group(); fg.position.copy(land);
            const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.55, 8), std(0xdc2626, 0.5));
            stick.rotation.z = Math.PI / 2;
            const glow = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), basic(0xf43f5e));
            glow.position.x = 0.28;
            const ptL = new THREE.PointLight(0xf43f5e, 2.0, 18, 1.5);
            ptL.position.y = 0.5;
            const lbl = labelSprite('🧨 2X CRIT LURE!', '#fda4af', 2.4);
            lbl.position.y = 1.3;
            fg.add(stick, glow, ptL, lbl); S.add(fg);
            tone(580, 920, 0.18, 'sawtooth', 0.11);
            MG.toast('🧨 SIGNAL FLARE LIT — DINOS LURED FOR 2X CRIT COMBOS!', '#fda4af');
            D.flares.push({ grp: fg, pos: land, life: 6.0 });
        },
        _spawnDino(S, kind) {
            const D = S.data;
            const isRex = kind === 'trex';
            const isPtera = kind === 'ptera';
            if (!isRex && D.dinos.length >= 9) return;
            const built = buildDinosaur(kind);
            const pos = isRex ? V(0, 0, -25) : isPtera ? V((Math.random() - 0.5) * 36, 7.5, -24) : V((Math.random() - 0.5) * 34, 0, -23 - Math.random() * 4);
            const maxHp = isRex ? 76 : isPtera ? 3 : 5;
            const tgt = S.addTarget({
                kind: 'dino_' + kind, mesh: built.root, hitMeshes: built.hit, pos,
                hp: maxHp, life: 0, points: isRex ? 3800 : isPtera ? 260 : 300,
                appear: 'scale', death: isPtera ? 'burst' : 'tumble', deathColor: isRex ? 0xd97706 : 0x84cc16,
                onKill: () => {
                    D.slain++;
                    D.dinos = D.dinos.filter((x) => x.tgt !== tgt);
                    if (isRex) {
                        D.trexSlain = true;
                        SFX.fanfare();
                        MG.finish('🦖 ALPHA T-REX BROUGHT DOWN — SAFARI SAVED!', { color: '#a3e635', delay: 2.2 });
                    }
                }
            });
            const entry = { kind, isRex, isPtera, maxHp, tgt, built, speed: isRex ? 4.8 : isPtera ? 6.8 : 6.4, phase: Math.random() * 6, stepCount: 0, atkCd: 1.2 };
            D.dinos.push(entry);
            if (isRex) {
                D.trex = entry;
                D.wave = 3;
                if (BO.MinigameAudio) BO.MinigameAudio.kaijuRoar();
                SFX.rumble(1.0);
                MG.flashScreen('rgba(255,255,255,0.35)');
                MG.toast('🦖 WAVE 3 FINALE: ALPHA TYRANNOSAURUS REX HAS BREACHED!', '#ef4444');
            }
        },
        update(S, dt, lib, state) {
            if (state !== 'running') return;
            if (BO.MinigameAudio) BO.MinigameAudio.tick(dt);
            const D = S.data, P = BO.Player;
            D.flareCd = Math.max(0, D.flareCd - dt);
            D.hornCd = Math.max(0, D.hornCd - dt);

            // Swaying jungle palms & sweeping Jeep turret spotlight!
            for (let i = 0; i < D.palms.length; i++) {
                const p = D.palms[i];
                if (p.userData.fronds) {
                    for (const fr of p.userData.fronds) fr.rotation.z = fr.userData.baseZ + Math.sin(S.t * 2.2 + i) * 0.08;
                }
            }
            if (D.jeepTurret) D.jeepTurret.rotation.y = Math.sin(S.t * 0.9) * 0.55;

            // Monsoon Rainstorm Streaks + Periodic Lightning Flashes + Fence Sparks!
            if (Math.random() < dt * 42) {
                const rx = P.pos.x + (Math.random() - 0.5) * 24;
                const rz = P.pos.z + (Math.random() - 0.5) * 24;
                const ry = 8 + Math.random() * 4;
                BO.FX.spawnTracer(V(rx, ry, rz), V(rx - 0.5, 0.2, rz + 0.4), 0x93c5fd, 0.015, 0.08);
            }
            D.lightningCd -= dt;
            if (D.lightningCd <= 0) {
                D.lightningCd = 8.5 + Math.random() * 6.5;
                MG.flashScreen('rgba(224,242,254,0.34)');
                SFX.rumble(0.7);
            }
            if (Math.random() < dt * 4) {
                const side = Math.random() < 0.5 ? -27 : 27;
                BO.FX.spawnParticles(V(side, 2.2 + Math.random() * 4.5, (Math.random() - 0.5) * 44), 4, 0x38bdf8, 4, 2, 0.22, 0.6);
            }

            // Capacitor recharge
            for (const c of D.capacitors) {
                if (c.cd > 0) {
                    c.cd = Math.max(0, c.cd - dt);
                    if (c.cd === 0) { c.orbMat.setHex(0x22d3ee); c.lbl.visible = true; }
                }
            }

            // Update active Red Signal Flares
            for (let i = D.flares.length - 1; i >= 0; i--) {
                const fl = D.flares[i];
                fl.life -= dt;
                if (Math.random() < dt * 18) BO.FX.spawnParticles(fl.pos.clone().add(V(0, 0.25, 0)), 2, 0xf43f5e, 1.8, 3.2, 0.35, 0.7);
                if (fl.life <= 0) { S.scene.remove(fl.grp); D.flares.splice(i, 1); }
            }

            // Multi-Wave Breakout Progression!
            if (D.wave === 1 && D.slain >= 5) {
                D.wave = 2;
                MG.toast('🦅 WAVE 2: MONSOON PTERANODON SKY RAID!', '#fde047');
            }
            if (!D.trexSpawned && (D.slain >= 14 || S.t >= 58)) {
                D.trexSpawned = true;
                this._spawnDino(S, 'trex');
            }
            D.spawnCd -= dt;
            if (D.spawnCd <= 0) {
                D.spawnCd = D.wave >= 2 ? 2.2 : 2.6;
                const spawnPtera = D.wave >= 2 && Math.random() < 0.36;
                this._spawnDino(S, spawnPtera ? 'ptera' : 'raptor');
            }

            const activeFlare = D.flares.length > 0 ? D.flares[0].pos : null;
            for (const d of D.dinos) {
                if (!d.tgt.alive) continue;
                const prevCycle = Math.floor(d.phase / Math.PI);
                d.phase += dt * (d.isRex ? 6.2 : 11);
                const curCycle = Math.floor(d.phase / Math.PI);

                if (d.built.legs.length) {
                    d.built.legs[0].rotation.x = Math.sin(d.phase) * 0.65;
                    d.built.legs[1].rotation.x = -Math.sin(d.phase) * 0.65;
                    if (d.built.tailPivot) d.built.tailPivot.rotation.y = Math.cos(d.phase) * 0.26;
                    if (d.built.jawPivot) {
                        const openAmt = d.tgt.basePos.distanceTo(P.pos) < 12 ? 0.42 + Math.sin(S.t * 8) * 0.14 : 0.18 + Math.sin(d.phase * 0.5) * 0.1;
                        d.built.jawPivot.rotation.x = openAmt;
                    }
                    // Heavy T-Rex Stomp Dust Plumes!
                    if (d.isRex && curCycle !== prevCycle) {
                        BO.FX.spawnParticles(d.tgt.basePos.clone().add(V(0, 0.2, 0)), 10, 0x78350f, 3.8, 2.2, 0.45, 0.9);
                        if (BO.MinigameAudio) BO.MinigameAudio.kaijuStep();
                        BO.Juice?.shake?.(0.045);
                    }
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
            const readyCaps = D.capacitors.filter((c) => c.cd <= 0).length;
            return `<div class="fun-panel">
                <div class="mgx-chip">⚠️ WAVE <b>${D.wave}/3</b></div>
                <div class="mgx-chip ${D.jeepHp < 35 ? 'mgx-hot' : ''}">🚙 JEEP #18 <b>${Math.ceil(D.jeepHp)}%</b></div>
                <div class="mgx-chip ${D.flareCd <= 0 ? 'mgx-hot' : ''}">🧨 FLARE [Q] <b>${D.flareCd <= 0 ? 'READY (2X CRIT)' : D.flareCd.toFixed(0) + 's'}</b></div>
                <div class="mgx-chip ${D.hornCd <= 0 ? 'mgx-hot' : ''}">📯 JEEP HORN [E] <b>${D.hornCd <= 0 ? 'READY' : D.hornCd.toFixed(0) + 's'}</b></div>
                <div class="mgx-chip">⚡ 10KV CAPS <b>${readyCaps}/4</b></div>
            </div>
            ${rex ? `<div class="fun-panel" style="margin-top:5px;"><div class="fun-bar-wrap"><div class="fun-bar-lbl"><span>🦖 ALPHA TYRANNOSAURUS REX</span><b>${Math.max(0, Math.round(rex.tgt.hp))} / ${rex.maxHp}</b></div><div class="fun-bar"><i style="width:${Math.max(0, Math.round(rex.tgt.hp / rex.maxHp * 100))}%;background:linear-gradient(90deg,#84cc16,#ef4444)"></i></div></div></div>` : ''}`;
        },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return {
                score: S.score, stars,
                title: D.trexSlain ? 'APEX RANGER OF ISLA NUBLAR' : 'SAFARI EXTRACTION COMPLETE',
                stats: [['DINOSAURS NEUTRALIZED', D.slain], ['ALPHA T-REX', D.trexSlain ? 'FELLED' : D.trexSpawned ? 'SURVIVED' : 'NOT BREACHED'], ['JEEP #18 CONDITION', Math.ceil(D.jeepHp) + '%']],
                xp: Math.round(190 + S.score * 0.032 + stars * 160)
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
            skybox: 'skybox-morning.png',
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

            // Battlefield courtyard stone/grass surface + Moat Water Trench + Timber Drawbridge Causeway
            const bfFloor = new THREE.Mesh(new THREE.PlaneGeometry(70, 76), A.pbrMat('fantasy_painterly/Transitions/grass-to-cobbles-001.png', 12, 12, { roughness: 0.9 }));
            bfFloor.rotation.x = -Math.PI / 2; bfFloor.position.set(0, 0.01, -14); bfFloor.receiveShadow = true; S.add(bfFloor);
            const moat = new THREE.Mesh(new THREE.PlaneGeometry(68, 7.5), new THREE.MeshStandardMaterial({ color: 0x0c4a6e, roughness: 0.2, metalness: 0.5 }));
            moat.rotation.x = -Math.PI / 2; moat.position.set(0, 0.05, 3.2); S.add(moat);
            const bridge = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.28, 8.2), A.pbrMat('fantasy_painterly/Wood Bark Boards/charred-wood-boards-001.png', 3, 3));
            bridge.position.set(0, 0.14, 3.2); S.add(bridge);
            L.placeGLB(S.scene, 'staged_assets/3d_models/castle_kit/bridge-draw.glb', {
                pos: [0, 0, 3.2], fitSize: [8.4, 1.2, 8.2], hideFallback: bridge
            });

            // Authentic 3D Castle Kit: Oak Portcullis Gate, Stone Curtain Walls, Crenellations, Flanking Bastion Towers & Banners
            const gateDoor = new THREE.Mesh(new THREE.BoxGeometry(5.6, 5.2, 0.35), std(0x3b180c, 0.8));
            gateDoor.position.set(0, 2.6, 8.65); S.add(gateDoor);
            L.placeGLB(S.scene, 'staged_assets/3d_models/castle_kit/gate.glb', {
                pos: [0, 0, 8.65], fitSize: [6.4, 6.2, 2.4], hideFallback: gateDoor
            });
            L.placeGLB(S.scene, 'staged_assets/3d_models/castle_kit/metal-gate.glb', {
                pos: [0, 0, 8.42], fitSize: [4.8, 5.0, 0.6]
            });
            // Flanking Stone Bastion Towers (Base -> Mid -> Roof stacked seamlessly)
            for (const tx of [-21, 21]) {
                L.placeGLB(S.scene, 'staged_assets/3d_models/castle_kit/tower-square-base.glb', { pos: [tx, 0, 12], fitSize: [7.2, 4.4, 8.6] });
                L.placeGLB(S.scene, 'staged_assets/3d_models/castle_kit/tower-square-mid.glb', { pos: [tx, 4.2, 12], fitSize: [7.0, 4.4, 8.4] });
                L.placeGLB(S.scene, 'staged_assets/3d_models/castle_kit/tower-square-top-roof.glb', { pos: [tx, 8.5, 12], fitSize: [7.4, 4.2, 8.8] });
            }
            // Instanced Curtain Wall Battlements & Crenellated Merlons along rampart front
            const wallTr = [], halfWallTr = [], bannerTr = [];
            for (const wx of [-16, -11, -6, 6, 11, 16]) {
                wallTr.push({ pos: [wx, 0, 9.0], rot: 0 });
                halfWallTr.push({ pos: [wx, 6.0, 8.95], rot: 0 });
            }
            for (const sx of [-18, -9, 9, 18]) bannerTr.push({ pos: [sx, 3.8, 8.5], rot: 0 });
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/castle_kit/wall.glb', wallTr, { fitSize: [5.0, 6.0, 1.4] });
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/castle_kit/wall-half.glb', halfWallTr, { fitSize: [3.2, 1.35, 0.8] });
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/castle_kit/flag-banner-long.glb', bannerTr, { fitSize: [1.6, 3.8, 0.6] });
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
                L.placeGLB(bg, 'staged_assets/3d_models/castle_kit/siege-ballista.glb', {
                    rot: Math.PI, fitSize: [2.6, 1.7, 2.5], hideFallback: [ped, stock, bowArms]
                });
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
