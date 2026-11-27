/* ============================================================================
   BLACKOUT OPS — MINIGAMES: FUN & SPECIALS FLAGSHIP BATCH 3B (Modes 21–22)
     21. Cyberpunk Hoverbike Neon Highway — 260 KM/H Synthwave Skybridge!
         First-person 3D Cyber-Hoverbike Cockpit & Handlebars, streaming
         holographic skyscrapers & rain-slicked neon highway, [A/D] Lane Bank,
         [SPACE] Plasma Ramp Jump, [E] Thermal Katana Slash, [Q] Nitro Overdrive,
         Yakuza Cyber-Bikers, Road Laser Gates & SYNDICATE VALKYRIE GUNSHIP!
     22. Pinball Wizard 3D Giant Table — Shrunk inside a colossal 50-meter
         Illuminated Carnival Pinball Machine! Brass Plunger Launch Lane,
         5 Electric Pop-Bumpers (knock enemies & you!), 5 Drop-Target Letters
         spelling [M-A-G-I-C] to unleash MULTIBALL JACKPOT FRENZY, Twin
         Swinging Giant Flippers, [E] Table Nudge & PINBALL WIZARD BOSS!
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
        const tex = L.canvasTex('funI-lbl:' + text + ':' + color, 256, 64, (g, w, h) => {
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
       21. CYBERPUNK HOVERBIKE NEON HIGHWAY
       260 KM/H Synthwave Skybridge + 3D Hoverbike Cockpit + Thermal Katana [E]
       + Nitro Overdrive [Q] + Cyber-Bikers, Laser Gates & VALKYRIE GUNSHIP!
    ===================================================================== */
    function neonRoadTex() {
        return L.canvasTex('cyber-highway-v1', 256, 512, (g, w, h) => {
            g.fillStyle = '#090d16'; g.fillRect(0, 0, w, h);
            // Glowing magenta edge rails + 4 cyan dashed lane dividers!
            g.fillStyle = '#ec4899';
            g.fillRect(4, 0, 8, h); g.fillRect(w - 12, 0, 8, h);
            g.strokeStyle = '#22d3ee'; g.lineWidth = 5; g.setLineDash([36, 28]);
            for (const lx of [w * 0.25, w * 0.5, w * 0.75]) {
                g.beginPath(); g.moveTo(lx, 0); g.lineTo(lx, h); g.stroke();
            }
            g.setLineDash([]);
        });
    }

    function buildCyberBiker(isGunship) {
        const root = new THREE.Group();
        const hit = [];
        if (isGunship) {
            const hullM = std(0x1e1b4b, 0.25, 0.85);
            const neonPink = basic(0xf43f5e);
            const neonCyan = basic(0x22d3ee);

            const fus = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.5, 6.2), hullM);
            const cockpit = new THREE.Mesh(new THREE.SphereGeometry(1.25, 14, 10), neonPink);
            cockpit.scale.set(1.1, 0.65, 1.45); cockpit.position.set(0, 0.55, 1.8);
            cockpit.userData.hitbox = 'head';
            root.add(fus, cockpit); hit.push(fus, cockpit);

            const rotors = [];
            for (const sx of [-3.6, 3.6]) {
                const wing = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.22, 1.8), hullM);
                wing.position.set(sx * 0.55, 0.2, 0);
                const shroud = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.16, 8, 20), neonCyan);
                shroud.rotation.x = Math.PI / 2; shroud.position.set(sx, 0.2, 0);
                const blade = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 0.22), basic(0xfef08a));
                blade.position.set(sx, 0.2, 0);
                root.add(wing, shroud, blade); hit.push(wing);
                rotors.push(blade);
            }
            return { root, hit, rotors };
        }

        // Sleek Akira-style Crimson/Cyan Syndicate Hoverbike + Neon Rider!
        const bikeM = std(0xdc2626, 0.22, 0.78);
        const trimM = basic(0x22d3ee);
        const chassis = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 1.85, 6, 12), bikeM);
        chassis.rotation.x = Math.PI / 2; chassis.position.y = 0.75;
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.1, 10), bikeM);
        nose.rotation.x = Math.PI / 2; nose.position.set(0, 0.78, 1.45);
        const thrusterL = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.55, 10), trimM);
        thrusterL.rotation.x = Math.PI / 2; thrusterL.position.set(-0.34, 0.68, -1.25);
        const thrusterR = thrusterL.clone(); thrusterR.position.x = 0.34;
        root.add(chassis, nose, thrusterL, thrusterR);
        hit.push(chassis, nose);

        const rider = F.human({
            skin: 0x0f172a, shirt: 0x1e1b4b, coat: 0xbe185d, pants: 0x090d16,
            hat: 'helmet', hatColor: 0x22d3ee, gun: 'smg', scale: 0.92
        });
        rider.root.position.set(0, 0.85, -0.1);
        rider.root.rotation.x = 0.35;
        F.pose(rider, 'aimOne');
        root.add(rider.root);
        hit.push(...rider.hit);
        return { root, hit, rotors: null };
    }

    MG.register({
        id: 'fun_hoverbike_highway', cat: 'fun', order: 21,
        name: 'Cyberpunk Hoverbike Neon Highway', icon: '🏍️', accent: '#ec4899', badge: '260 KM/H NEON',
        tagline: 'Tear down a 260 km/h Synthwave Skybridge! Slash Cyber-Bikers with Thermal Katana [E] & down the Valkyrie!',
        desc: 'Mount your prototype KUSANAGI-X9 Cyber-Hoverbike and tear down the rain-slicked Neo-Shinjuku Skybridge at 260 km/h! Bank smoothly across 4 neon lanes with [A / D], vault Red Plasma Road-Barriers with [SPACE], slash flanking Yakuza Cyber-Bikers in half with your [E] Thermal Neon Katana, ignite [Q] Nitro Overdrive for 2x Speed & Score, and shoot down the SYNDICATE VALKYRIE VTOL GUNSHIP!',
        guide: {
            objective: 'Survive the 260 km/h Neo-Shinjuku Skybridge pursuit, dodge Plasma Laser Gates, eliminate Cyber-Bikers, and destroy the Syndicate Valkyrie VTOL Gunship!',
            tips: [
                'Use [A / D] to carve smoothly across the highway and [SPACE] to hydro-hop right over low Red Laser Gates!',
                'Press [E] (3.5s cooldown) when a Yakuza Cyber-Biker pulls alongside your bike to cleave them instantly with your THERMAL KATANA (+450 pts)!',
                'Press [Q] (12s cooldown) for NITRO OVERDRIVE—boosts speed to 380 km/h, grants brief barrier invulnerability, and doubles score!'
            ]
        },
        heroLabel: 'FUN & SPECIALS • HIGH-SPEED CYBER VEHICULAR COMBAT', duration: 155,
        stars: [3000, 6200, 9800, 14500],
        standardWeapon: 'vector_kriss', lockWeapon: true, infiniteMag: true, forgivingMisses: true, customMusic: true,
        weaponLabel: 'VECTOR SMG + HOVERBIKE + THERMAL KATANA [E]', weaponNote: '[A/D] Steer Bike • [SPACE] Boost-Jump Gates • [E] Katana Slash • [Q] Nitro!',
        keys: [['A / D', 'Steer Hoverbike'], ['SPACE', 'Jump Laser Gates'], ['E', 'Thermal Katana (3.5s)'], ['Q', 'Nitro Overdrive (12s)']],
        map: {
            atmosphere: { skyTop: 0x050214, skyBottom: 0x4c0519, fogColor: 0x1a062b, fogDensity: 0.0085, sunColor: 0xf472b6, sunIntensity: 1.4, sunPos: [0, 22, -120], hemiSky: 0x38bdf8, hemiGround: 0x311042, hemiIntensity: 0.95 },
            skybox: 'skybox-night.png',
            boxes: [B(0, -0.5, 0, 24, 1, 140, 'asphalt')],
            spawn: { x: 0, y: 0.2, z: 12, yaw: 0 }
        },
        countdown: 3,
        build(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.start('cyberpunk');
            const D = S.data;
            Object.assign(D, {
                bikeX: 0, bikeY: 0, bikeVy: 0, bikeTilt: 0, bikeHp: 100, kmh: 260,
                katanaCd: 0, katanaAnim: 0, nitroT: 0, nitroCd: 0,
                roadTex: null, buildings: [], bikers: [], gates: [],
                spawnCd: 1.0, gateCd: 2.6, killsCount: 0, gunship: null, gunshipSpawned: false, gunshipDown: false
            });

            // Scrolling Neon Highway Deck + Synthwave Sun on Horizon + Streaming Hologram Skyscrapers!
            const rTex = A.loadTex('cyberpunk/Wet Urban Surfaces/reflective-neon-pavement-001.png', 2, 16);
            D.roadTex = rTex;
            const road = new THREE.Mesh(new THREE.PlaneGeometry(18, 160), new THREE.MeshStandardMaterial({ map: rTex, roughness: 0.22, metalness: 0.55 }));
            road.rotation.x = -Math.PI / 2; road.position.set(0, 0.03, -45); S.add(road);

            for (const sx of [-9.3, 9.3]) {
                const rail = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.1, 160), basic(0xec4899));
                rail.position.set(sx, 0.55, -45); S.add(rail);
            }

            // Giant Retro-Synthwave Striped Sun hovering over the distant skyline!
            const sunTex = L.canvasTex('synth-sun-v1', 256, 256, (g, w, h) => {
                const gr = g.createLinearGradient(0, 0, 0, h);
                gr.addColorStop(0, '#fef08a'); gr.addColorStop(0.55, '#f97316'); gr.addColorStop(1, '#ec4899');
                g.fillStyle = gr;
                g.beginPath(); g.arc(w / 2, h / 2, 118, 0, TAU); g.fill();
                g.globalCompositeOperation = 'destination-out';
                for (let y = 140; y < 245; y += 18) g.fillRect(0, y, w, (y - 125) * 0.09);
            });
            const sunDisc = new THREE.Mesh(new THREE.PlaneGeometry(58, 58), new THREE.MeshBasicMaterial({ map: sunTex, transparent: true, fog: false }));
            sunDisc.position.set(0, 26, -125); S.add(sunDisc);

            // 26 Streaming Cyberpunk Skyscrapers with Neon Kanji/Grid Windows!
            const bWinTex = L.canvasTex('cyber-tower-win', 128, 256, (g, w, h) => {
                g.fillStyle = '#090d16'; g.fillRect(0, 0, w, h);
                const rnd = L.mulberry32(2077);
                for (let y = 8; y < h - 8; y += 14) {
                    for (let x = 8; x < w - 8; x += 16) {
                        if (rnd() < 0.55) {
                            g.fillStyle = rnd() < 0.5 ? '#22d3ee' : '#f472b6';
                            g.fillRect(x, y, 10, 8);
                        }
                    }
                }
            });
            const towerMat = A.pbrMat('cyberpunk/Commercial Neon/led-strip-wall-cladding-001.png', 2, 4, { emissiveMap: bWinTex, emissive: 0xffffff, emissiveIntensity: 0.65, roughness: 0.38 });
            for (let i = 0; i < 26; i++) {
                const side = i % 2 ? 1 : -1;
                const bh = 22 + (i % 5) * 9;
                const mesh = new THREE.Mesh(new THREE.BoxGeometry(9, bh, 9), towerMat);
                mesh.position.set(side * (16.5 + (i % 3) * 4.5), bh / 2 - 8, -125 + i * 6.0);
                S.add(mesh);
                D.buildings.push(mesh);
            }

            // World-space Sculpted Player Hoverbike Nose, Cowling, Digital Speedometer & Thermal Katana Blade!
            const bikeG = new THREE.Group();
            const cowl = new THREE.Mesh(new THREE.ConeGeometry(0.62, 2.2, 12), std(0x0f172a, 0.2, 0.88));
            cowl.rotation.x = -Math.PI / 2; cowl.position.set(0, 0.85, -1.25);
            const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.35, 0.85), new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.38 }));
            windshield.rotation.x = 0.45; windshield.position.set(0, 1.18, -0.95);
            const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.15, 8), std(0xe2e8f0, 0.2, 0.9));
            bar.rotation.z = Math.PI / 2; bar.position.set(0, 1.05, -0.55);
            const katana = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.05, 0.14), basic(0xf43f5e));
            katana.position.set(0.8, 1.15, -0.9); katana.visible = false;
            bikeG.add(cowl, windshield, bar, katana);
            S.add(bikeG);
            D.bikeMesh = bikeG;
            D.katanaMesh = katana;

            D.onKey = (e) => {
                if (MG.session !== S || MG.state !== 'running') return;
                if (e.code === 'KeyE') this._katanaSlash(S);
                else if (e.code === 'KeyQ') {
                    if (D.nitroCd <= 0) {
                        D.nitroCd = 12.0; D.nitroT = 4.5;
                        tone(220, 880, 0.32, 'sawtooth', 0.13);
                        MG.toast('🔥 NITRO OVERDRIVE — 380 KM/H & 2X SCORE!', '#22d3ee');
                    }
                } else if (e.code === 'Space' && D.bikeY <= 0.08) {
                    D.bikeVy = 9.8;
                    SFX.boing();
                }
            };
            window.addEventListener('keydown', D.onKey);
        },
        dispose(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.stop();
            if (S.data.onKey) window.removeEventListener('keydown', S.data.onKey);
        },
        _katanaSlash(S) {
            const D = S.data, P = BO.Player;
            if (D.katanaCd > 0) return;
            D.katanaCd = 3.5;
            D.katanaAnim = 0.28;
            if (BO.MinigameAudio) BO.MinigameAudio.katanaSlash(); else tone(920, 260, 0.16, 'sawtooth', 0.13);
            let cleaved = 0;
            for (const b of D.bikers.slice()) {
                if (!b.isGunship && b.tgt.alive && b.tgt.basePos.distanceTo(P.pos) < 8.2) {
                    BO.FX.spawnExplosion(b.tgt.basePos.clone().add(V(0, 1, 0)), 3.5, 0xf43f5e);
                    S.award(450, b.tgt.basePos.clone().add(V(0, 1.8, 0)), '⚔️ THERMAL KATANA CLEAVE!', '#f472b6');
                    S.kills++; S.bumpCombo(); cleaved++;
                    b.tgt.kill({ pt: b.tgt.basePos });
                }
            }
            if (cleaved === 0) MG.toast('⚔️ THERMAL KATANA SLASH!', '#f472b6');
        },
        _spawnHighwayFoe(S, isGunship = false) {
            const D = S.data;
            if (!isGunship && D.bikers.length >= 7) return;
            const built = buildCyberBiker(isGunship);
            const laneX = isGunship ? 0 : (-6 + Math.floor(Math.random() * 4) * 4);
            const pos = V(laneX, isGunship ? 6.8 : 0, isGunship ? -42 : -85);
            const maxHp = isGunship ? 64 : 3;
            const tgt = S.addTarget({
                kind: isGunship ? 'valkyrie_gunship' : 'cyber_biker', mesh: built.root, hitMeshes: built.hit, pos,
                hp: maxHp, life: 0, points: isGunship ? 3500 : 260, appear: 'scale', death: 'burst',
                deathColor: isGunship ? 0x22d3ee : 0xf43f5e,
                onKill: () => {
                    BO.FX.spawnExplosion(tgt.basePos.clone().add(V(0, 1, 0)), isGunship ? 8.5 : 3.5, 0xf43f5e);
                    D.killsCount++;
                    D.bikers = D.bikers.filter((x) => x.tgt !== tgt);
                    if (isGunship) {
                        D.gunshipDown = true;
                        SFX.fanfare();
                        MG.finish('🏍️ SYNDICATE VALKYRIE SHOT DOWN — HIGHWAY LEGEND!', { color: '#22d3ee', delay: 2.0 });
                    }
                }
            });
            const obj = { tgt, built, isGunship, maxHp, targetZ: isGunship ? -26 : -4 - Math.random() * 14, laneX, fireCd: 1.8, phase: Math.random() * 6 };
            D.bikers.push(obj);
            if (isGunship) {
                D.gunship = obj;
                MG.toast('🚁 BOSS INTERCEPT: SYNDICATE VALKYRIE VTOL GUNSHIP ON DECK!', '#f43f5e');
            }
        },
        update(S, dt, lib, state) {
            if (state !== 'running') return;
            if (BO.MinigameAudio) BO.MinigameAudio.tick(dt);
            const D = S.data, P = BO.Player;
            D.katanaCd = Math.max(0, D.katanaCd - dt);
            D.nitroCd = Math.max(0, D.nitroCd - dt);
            D.nitroT = Math.max(0, D.nitroT - dt);

            const roadSpd = D.nitroT > 0 ? 72 : 48;
            D.kmh = Math.round(lerp(D.kmh, D.nitroT > 0 ? 380 : 260, dt * 5));
            D.roadTex.offset.y -= dt * (roadSpd * 0.085);

            // Stream Cyberpunk Skyscrapers past at highway speed!
            for (const b of D.buildings) {
                b.position.z += roadSpd * dt;
                if (b.position.z > 28) b.position.z -= 156;
            }

            // Lock Player onto their Hoverbike Cockpit with [A/D] Banking & [SPACE] Hydro-Hop!
            let steer = 0;
            if (P.keys['KeyA'] || P.keys['ArrowLeft']) steer -= 1;
            if (P.keys['KeyD'] || P.keys['ArrowRight']) steer += 1;
            D.bikeX = BO.Math.clamp(D.bikeX + steer * 15.5 * dt, -7.4, 7.4);
            D.bikeTilt = lerp(D.bikeTilt, -steer * 0.28, dt * 10);

            if (D.bikeY > 0 || D.bikeVy !== 0) {
                D.bikeVy -= 24 * dt;
                D.bikeY = Math.max(0, D.bikeY + D.bikeVy * dt);
                if (D.bikeY === 0) D.bikeVy = 0;
            }
            P.pos.set(D.bikeX, 0.35 + D.bikeY, 12);
            P.vel.set(0, 0, 0);
            D.bikeMesh.position.set(D.bikeX, D.bikeY, 12);
            D.bikeMesh.rotation.z = D.bikeTilt;

            if (D.katanaAnim > 0) {
                D.katanaAnim -= dt;
                D.katanaMesh.visible = true;
                D.katanaMesh.rotation.y = (1 - D.katanaAnim / 0.28) * Math.PI * 1.4 - 0.7;
            } else {
                D.katanaMesh.visible = false;
            }

            // Passive high-speed highway survival distance points
            if (Math.floor((S.t - dt) * 2) !== Math.floor(S.t * 2)) S.score += D.nitroT > 0 ? 40 : 20;

            // Spawn Red Plasma Road-Barrier Gates (jump over with SPACE or weave around!)
            D.gateCd -= dt;
            if (D.gateCd <= 0) {
                D.gateCd = 3.2;
                const gx = -5.5 + Math.floor(Math.random() * 3) * 5.5;
                const gg = new THREE.Group();
                gg.position.set(gx, 0, -95);
                const beam = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.95, 0.25), basic(0xef4444));
                beam.position.y = 0.65;
                const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.5, 8), std(0x94a3b8, 0.3, 0.8));
                postL.position.set(-2.6, 0.75, 0);
                const postR = postL.clone(); postR.position.x = 2.6;
                gg.add(beam, postL, postR); S.add(gg);
                D.gates.push({ grp: gg, x: gx, z: -95, hit: false });
            }

            for (let i = D.gates.length - 1; i >= 0; i--) {
                const g = D.gates[i];
                g.z += roadSpd * dt;
                g.grp.position.z = g.z;
                if (!g.hit && Math.abs(g.z - 12) < 1.1 && Math.abs(D.bikeX - g.x) < 2.75 && D.bikeY < 1.05) {
                    g.hit = true;
                    if (D.nitroT <= 0) {
                        D.bikeHp = Math.max(0, D.bikeHp - 14);
                        P.takeDamage(10, g.grp.position, true);
                        MG.toast('⚡ CLIPPED PLASMA LASER GATE (PRESS [SPACE] TO JUMP)!', '#f87171');
                    } else {
                        S.award(200, g.grp.position.clone().add(V(0, 1.5, 0)), '🔥 NITRO SMASH!', '#22d3ee');
                    }
                }
                if (g.z > 22) { S.scene.remove(g.grp); D.gates.splice(i, 1); }
            }

            // Spawn Cyber-Bikers & Valkyrie Gunship Boss
            if (!D.gunshipSpawned && (D.killsCount >= 15 || S.t >= 58)) {
                D.gunshipSpawned = true;
                this._spawnHighwayFoe(S, true);
            }
            D.spawnCd -= dt;
            if (D.spawnCd <= 0) { D.spawnCd = 2.3; this._spawnHighwayFoe(S, false); }

            for (const b of D.bikers) {
                if (!b.tgt.alive) continue;
                b.phase += dt * 3.5;
                if (b.isGunship) {
                    b.tgt.basePos.x = Math.sin(b.phase * 0.55) * 6.2;
                    b.tgt.basePos.y = 6.5 + Math.cos(b.phase * 0.8) * 1.1;
                    b.tgt.basePos.z = lerp(b.tgt.basePos.z, -24, dt * 1.8);
                    for (const r of b.built.rotors) r.rotation.y += dt * 28;
                } else {
                    b.tgt.basePos.z = lerp(b.tgt.basePos.z, 6.5 + Math.sin(b.phase) * 5.0, dt * 1.6);
                    b.tgt.basePos.x = lerp(b.tgt.basePos.x, b.laneX + Math.cos(b.phase * 0.8) * 1.4, dt * 2.0);
                }
                b.tgt.root.position.copy(b.tgt.basePos);
                b.tgt.root.lookAt(D.bikeX, b.tgt.basePos.y, 12);

                b.fireCd -= dt;
                if (b.fireCd <= 0) {
                    b.fireCd = b.isGunship ? 1.5 : 2.5;
                    BO.FX.spawnTracer(b.tgt.basePos.clone().add(V(0, 1.1, 0)), P.pos.clone().add(V(0, 1.0, 0)), b.isGunship ? 0xf43f5e : 0x22d3ee, 0.08, 0.14);
                    D.bikeHp = Math.max(0, D.bikeHp - (b.isGunship ? 7 : 4));
                    P.takeDamage(b.isGunship ? 8 : 5, b.tgt.basePos, true);
                }
            }

            if (D.bikeHp <= 0 || !P.alive) MG.finish('HOVERBIKE WRECKED ON THE SKYBRIDGE', { color: '#f87171' });
        },
        hud(S) {
            const D = S.data, gs = D.gunship && D.gunship.tgt.alive ? D.gunship : null;
            return `<div class="fun-panel">
                <div class="mgx-chip ${D.nitroT > 0 ? 'mgx-hot' : ''}">🏍️ SPEED <b>${D.kmh} KM/H</b></div>
                <div class="mgx-chip ${D.bikeHp < 35 ? 'mgx-hot' : ''}">BIKE HULL <b>${Math.ceil(D.bikeHp)}%</b></div>
                <div class="mgx-chip ${D.katanaCd <= 0 ? 'mgx-hot' : ''}">⚔️ KATANA [E] <b>${D.katanaCd <= 0 ? 'READY' : D.katanaCd.toFixed(1) + 's'}</b></div>
                <div class="mgx-chip ${D.nitroCd <= 0 ? 'mgx-hot' : ''}">🔥 NITRO [Q] <b>${D.nitroT > 0 ? 'ACTIVE!' : D.nitroCd <= 0 ? 'READY' : D.nitroCd.toFixed(0) + 's'}</b></div>
            </div>
            ${gs ? `<div class="fun-panel" style="margin-top:5px;"><div class="fun-bar-wrap"><div class="fun-bar-lbl"><span>🚁 SYNDICATE VALKYRIE VTOL GUNSHIP</span><b>${Math.max(0, Math.round(gs.tgt.hp))} / ${gs.maxHp}</b></div><div class="fun-bar"><i style="width:${Math.max(0, Math.round(gs.tgt.hp / gs.maxHp * 100))}%;background:linear-gradient(90deg,#ec4899,#22d3ee)"></i></div></div></div>` : ''}`;
        },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return {
                score: S.score, stars,
                title: D.gunshipDown ? 'CYBERPUNK SKYBRIDGE LEGEND' : 'HIGHWAY PURSUIT ENDED',
                stats: [['SYNDICATE BIKERS & VTOLS', D.killsCount], ['VALKYRIE GUNSHIP', D.gunshipDown ? 'DESTROYED' : D.gunshipSpawned ? 'ESCAPED' : 'NOT INTERCEPTED'], ['HOVERBIKE HULL', Math.ceil(D.bikeHp) + '%']],
                xp: Math.round(190 + S.score * 0.032 + stars * 160)
            };
        }
    });

    /* =====================================================================
       22. PINBALL WIZARD 3D GIANT TABLE
       Shrunk inside a Colossal 50m Illuminated Carnival Pinball Machine!
       5 Electric Pop-Bumpers + [M-A-G-I-C] Drop-Target Multiball Jackpot +
       Twin Swinging Giant Flippers + Brass Plunger Lane + [E] Table Nudge!
    ===================================================================== */
    function pinballPlayfieldTex() {
        return L.canvasTex('pinball-playfield-v1', 512, 1024, (g, w, h) => {
            const bg = g.createLinearGradient(0, 0, 0, h);
            bg.addColorStop(0, '#1e1b4b'); bg.addColorStop(0.5, '#311042'); bg.addColorStop(1, '#0f172a');
            g.fillStyle = bg; g.fillRect(0, 0, w, h);
            // Classic Pinball Starbursts, Orbit Lanes & "SHOOT AGAIN" Diamond!
            g.strokeStyle = '#facc15'; g.lineWidth = 10;
            g.strokeRect(18, 18, w - 36, h - 36);
            for (let r = 60; r <= 180; r += 40) {
                g.strokeStyle = r === 100 ? '#22d3ee' : '#ec4899';
                g.lineWidth = 6;
                g.beginPath(); g.arc(w / 2, 340, r, 0, TAU); g.stroke();
            }
            // Giant yellow bonus arrows pointing up-table!
            for (let i = 0; i < 3; i++) {
                const ay = 740 - i * 95;
                g.fillStyle = i % 2 ? '#fde047' : '#fb923c';
                g.beginPath();
                g.moveTo(w / 2, ay - 35); g.lineTo(w / 2 + 45, ay + 25); g.lineTo(w / 2 - 45, ay + 25);
                g.closePath(); g.fill();
            }
        });
    }

    MG.register({
        id: 'fun_pinball_arena', cat: 'fun', order: 22,
        name: 'Pinball Wizard 3D Giant Table', icon: '🎱', accent: '#facc15', badge: 'GIANT PINBALL',
        tagline: 'Fight inside a colossal 50m Neon Pinball Machine! Light [M-A-G-I-C] for MULTIBALL & shatter Chrome Spheres!',
        desc: 'You have been shrunk and dropped directly onto the illuminated playfield of a colossal 50-meter Carnival Pinball Machine! Sprint past 5 ringing 1,000-Point Electric Pop-Bumpers and Twin Swinging Giant Flippers, shoot the 5 glowing [M-A-G-I-C] Drop-Targets along the Backbox to unleash MULTIBALL JACKPOT FRENZY, press [E] TABLE NUDGE to ricochet giant rolling Chrome Pinballs into Bumper Combos, and defeat the backglass boss ARCADE WIZARD!',
        guide: {
            objective: 'Shatter giant rolling Chrome Pinballs, light all 5 [M-A-G-I-C] Drop-Targets for Multiball Jackpot, avoid falling into the Drain Pit, and defeat the ARCADE WIZARD!',
            tips: [
                'Shoot all 5 glowing letters [M] [A] [G] [I] [C] at the top of the table to trigger a +1,500 MULTIBALL JACKPOT and spawn Golden Bonus Balls!',
                'Press [E] TABLE NUDGE (7s cooldown, max 2 consecutive before TILT warning!) to slam every rolling Chrome Pinball into the Electric Pop-Bumpers for massive ricochet combos!',
                'Step into the right-side BRASS SPRING PLUNGER LANE anytime to launch yourself sky-high onto the Upper Bumper Deck!'
            ]
        },
        heroLabel: 'FUN & SPECIALS • GIANT CARNIVAL PINBALL ARENA', duration: 160,
        stars: [3200, 6500, 10500, 15500],
        standardWeapon: 'p90', lockWeapon: true, infiniteMag: true, forgivingMisses: true, customMusic: true,
        weaponLabel: 'JACKPOT P90 + TABLE NUDGE [E] + PLUNGER LAUNCH', weaponNote: 'Shoot [M-A-G-I-C] Drop-Targets • [E] Table Nudge (7s) • Plunger Lane on Right!',
        keys: [['WASD', 'Run Playfield'], ['E', 'Table NudgeSlam (7s)'], ['SPACE', 'Jump Rolling Chrome Balls'], ['LMB', 'Shatter Pinballs & Targets']],
        map: {
            atmosphere: { skyTop: 0x090418, skyBottom: 0x3b0764, fogColor: 0x1e0936, fogDensity: 0.006, sunColor: 0xfef08a, sunIntensity: 1.5, sunPos: [0, 55, 20], hemiSky: 0xf472b6, hemiGround: 0x1e1b4b, hemiIntensity: 1.0 },
            skybox: 'skybox-space.png',
            boxes: [
                B(0, -0.5, 0, 38, 1, 56, 'wood'),
                B(-19, 4, 0, 1.2, 8, 56, 'metal'), B(19, 4, 0, 1.2, 8, 56, 'metal'),
                B(0, 8, -28, 38, 16, 1.5, 'metal'), B(0, 4, 28, 38, 8, 1.2, 'metal'),
                // Plunger Lane Divider Wall on far right (x = 14.2)
                B(14.2, 1.5, 4, 0.6, 3.0, 42, 'metal')
            ],
            spawn: { x: 16.5, y: 0.2, z: 22, yaw: 0 }
        },
        countdown: 3,
        build(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.start('pinball');
            const D = S.data;
            Object.assign(D, {
                balls: [], bumpers: [], flippers: [], magicLetters: [], magicLit: [false, false, false, false, false],
                nudgeCd: 0, jackpots: 0, ballsShattered: 0, spawnCd: 1.0, wizard: null, wizardSpawned: false, wizardDown: false
            });

            // Illuminated Glossy Playfield + Tempered Overhead Glass Rails + Towering Arcade Backglass Scoreboard!
            const pf = new THREE.Mesh(new THREE.PlaneGeometry(37, 55), new THREE.MeshStandardMaterial({ map: pinballPlayfieldTex(), roughness: 0.16, metalness: 0.3 }));
            pf.rotation.x = -Math.PI / 2; pf.position.y = 0.03; S.add(pf);
            const wallDeckL = new THREE.Mesh(new THREE.PlaneGeometry(55, 7.6), A.pbrMat('cyberpunk/Commercial Neon/led-strip-wall-cladding-001.png', 10, 2, { roughness: 0.35 }));
            wallDeckL.position.set(-18.35, 3.8, 0); wallDeckL.rotation.y = Math.PI / 2; S.add(wallDeckL);
            const wallDeckR = wallDeckL.clone(); wallDeckR.position.x = 18.35; wallDeckR.rotation.y = -Math.PI / 2; S.add(wallDeckR);

            // Chasing Carnival Marquee Bulbs around the entire giant cabinet rim!
            const rimPts = [];
            for (let z = -26; z <= 26; z += 4) { rimPts.push(V(-18.2, 3.8, z), V(18.2, 3.8, z)); }
            const bulbs = A.bulbs(rimPts, [0xfacc15, 0xec4899, 0x22d3ee, 0x4ade80], 0.24);
            S.add(bulbs); A.animateBulbs(S, bulbs, 8, 'chase');

            const backglass = A.sign('🎱 PINBALL WIZARD — LIGHT [M-A-G-I-C] FOR MULTIBALL JACKPOT! 🎱', 26, 2.4, { bg: '#1e1b4b', color: '#fde047', borderColor: '#ec4899', size: 0.56, glow: '#ec4899' });
            backglass.position.set(-2, 10.5, -26.8); S.add(backglass);

            // Right-Side Brass Spring Plunger Shooter Lane (x = 16.5, z = 24)!
            const brass = std(0xfacc15, 0.22, 0.9), chrome = std(0xf8fafc, 0.08, 0.96);
            const plungerRod = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 4.5, 14), chrome);
            plungerRod.rotation.x = Math.PI / 2; plungerRod.position.set(16.5, 0.85, 25.5); S.add(plungerRod);
            const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 2.2, 14, 6, true), new THREE.MeshBasicMaterial({ color: 0xfacc15, wireframe: true }));
            spring.rotation.x = Math.PI / 2; spring.position.set(16.5, 0.85, 24.2); S.add(spring);
            const plLbl = labelSprite('🚀 SPRING PLUNGER BOOST!', '#fde047', 2.6);
            plLbl.position.set(16.5, 2.5, 22.5); S.add(plLbl);

            // 5 Giant 1,000-Point Electric Pop-Bumpers with Neon Mushroom Caps!
            const bumperLayout = [[-6.5, -10, 0xec4899], [2.5, -10, 0x22d3ee], [-2.0, -16, 0xfacc15], [-7.5, -2, 0x4ade80], [3.5, -2, 0xa855f7]];
            for (const [bx, bz, col] of bumperLayout) {
                const bg = new THREE.Group(); bg.position.set(bx, 0, bz);
                const stem = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, 1.3, 20), chrome); stem.position.y = 0.65;
                const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.95, 0.55, 24), std(col, 0.2, 0.4, { emissive: col, emissiveIntensity: 0.65 }));
                cap.position.y = 1.45;
                const ring = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.12, 8, 24), basic(0xfef08a));
                ring.rotation.x = Math.PI / 2; ring.position.y = 0.45;
                const lbl = labelSprite('1000 PTS', '#fef08a', 1.8); lbl.position.y = 2.35;
                bg.add(stem, cap, ring, lbl); S.add(bg);
                S.collider(bx - 1.5, 0, bz - 1.5, bx + 1.5, 2.0, bz + 1.5);
                D.bumpers.push({ grp: bg, cap, pos: V(bx, 0, bz), col, pulse: 0 });
            }

            // 5 Shootable [M - A - G - I - C] Drop-Targets along the Upper Backbox!
            const letters = ['M', 'A', 'G', 'I', 'C'];
            letters.forEach((ch, idx) => {
                const lx = -10 + idx * 4.0, lz = -22.5;
                const mesh = A.sign(ch, 2.2, 2.6, { bg: '#311042', color: '#fde047', borderColor: '#22d3ee', size: 1.35, glow: '#22d3ee' });
                const tgt = S.addTarget({
                    kind: 'drop_letter', mesh, pos: V(lx, 1.6, lz), hp: 1, life: 0, points: 250,
                    appear: 'none', death: 'none', bonus: true,
                    onDamage: (t) => {
                        t.hp = 999; // Stays alive & toggles lit state!
                        if (!D.magicLit[idx]) {
                            D.magicLit[idx] = true;
                            mesh.position.y = 0.85;
                            tone(520 + idx * 110, 880 + idx * 110, 0.18, 'triangle', 0.12);
                            S.award(300, V(lx, 2.8, lz), `✨ LETTER [${ch}] LIT!`, '#fde047');
                            if (D.magicLit.every(Boolean)) this._triggerMultiballJackpot(S);
                        }
                    }
                });
                D.magicLetters.push({ ch, mesh, tgt });
            });

            // Twin Giant Swinging Pinball Flippers guarding the Bottom Drain Pit (z = 19.5)!
            for (const [fx, side] of [[-6.5, 1], [2.5, -1]]) {
                const fg = new THREE.Group();
                fg.position.set(fx, 0.65, 18.5);
                const paddle = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.1, 0.95), std(0xef4444, 0.25, 0.3, { emissive: 0x991b1b, emissiveIntensity: 0.4 }));
                paddle.position.x = side * 2.4;
                const rubber = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 1.12, 16), chrome);
                rubber.position.x = 0;
                fg.add(paddle, rubber); S.add(fg);
                D.flippers.push({ grp: fg, pos: V(fx + side * 2.0, 0.65, 18.5), side, swing: 0, timer: 1.4 + (side > 0 ? 0 : 0.9) });
            }

            // Glowing Bottom "BALL DRAIN" Hazard Trench at z = 25.5!
            const drain = new THREE.Mesh(new THREE.PlaneGeometry(18, 3.2), basic(0xef4444));
            drain.rotation.x = -Math.PI / 2; drain.position.set(-2, 0.05, 25.8); S.add(drain);
            const drainLbl = labelSprite('⚠️ BALL DRAIN PIT — DO NOT FALL IN!', '#fca5a5', 3.4);
            drainLbl.position.set(-2, 1.5, 25.8); S.add(drainLbl);

            // Spawn 3 initial Chrome Pinballs!
            for (let i = 0; i < 3; i++) this._spawnPinball(S, false);

            D.onKey = (e) => {
                if (MG.session !== S || MG.state !== 'running') return;
                if (e.code === 'KeyE') this._tableNudge(S);
            };
            window.addEventListener('keydown', D.onKey);
        },
        dispose(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.stop();
            if (S.data.onKey) window.removeEventListener('keydown', S.data.onKey);
        },
        _triggerMultiballJackpot(S) {
            const D = S.data;
            D.jackpots++;
            D.magicLit = [false, false, false, false, false];
            for (const ml of D.magicLetters) ml.mesh.position.y = 1.6;
            if (BO.MinigameAudio) BO.MinigameAudio.pinballJackpot(); else SFX.fanfare();
            S.award(1500, V(-2, 4, -12), '🎰 M-A-G-I-C MULTIBALL JACKPOT (+1,500)!', '#fde047');
            MG.toast('🎰 MULTIBALL JACKPOT — GOLDEN 2X BONUS PINBALLS UNLEASHED!', '#fde047');
            for (let i = 0; i < 3; i++) this._spawnPinball(S, true);
        },
        _tableNudge(S) {
            const D = S.data;
            if (D.nudgeCd > 0) return;
            D.nudgeCd = 7.0;
            SFX.rumble(0.65);
            for (const b of D.balls) {
                if (!b.tgt.alive) continue;
                b.vel.z = -18 - Math.random() * 8;
                b.vel.x += (Math.random() - 0.5) * 18;
            }
            MG.toast('💥 TABLE NUDGE — PINBALLS LAUNCHED UP-FIELD!', '#22d3ee');
        },
        _spawnPinball(S, isGold = false) {
            const D = S.data;
            if (D.balls.length >= 9) return;
            const mat = isGold
                ? std(0xfacc15, 0.08, 0.96, { emissive: 0xca8a04, emissiveIntensity: 0.35 })
                : std(0xf8fafc, 0.05, 0.98, { emissive: 0x38bdf8, emissiveIntensity: 0.18 });
            const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.15, 24, 18), mat);
            sphere.userData.hitbox = 'head';
            const pos = V(-12 + Math.random() * 20, 1.15, -20 - Math.random() * 4);
            const tgt = S.addTarget({
                kind: isGold ? 'gold_pinball' : 'chrome_pinball', mesh: sphere, hitMeshes: [sphere], pos,
                hp: isGold ? 3 : 4, life: 0, points: isGold ? 650 : 320, appear: 'scale', death: 'shatter',
                deathColor: isGold ? 0xfacc15 : 0x38bdf8,
                onKill: () => {
                    D.ballsShattered++;
                    D.balls = D.balls.filter((x) => x.tgt !== tgt);
                }
            });
            D.balls.push({ tgt, sphere, isGold, vel: V((Math.random() - 0.5) * 12, 0, 8 + Math.random() * 6) });
        },
        _spawnWizardBoss(S) {
            const D = S.data;
            D.wizardSpawned = true;
            const fig = F.human({
                skin: 0xe0f2fe, shirt: 0x7e22ce, coat: 0x4c1d95, pants: 0x1e1b4b,
                hat: 'tophat', hatColor: 0xfacc15, eyes: 'angry', scale: 2.35
            });
            const tgt = S.addTarget({
                kind: 'arcade_wizard', mesh: fig.root, hitMeshes: fig.hit, pos: V(-2, 0, -19),
                hp: 56, life: 0, points: 3500, appear: 'scale', death: 'burst', deathColor: 0xfacc15,
                onKill: () => {
                    D.wizardDown = true;
                    BO.FX.spawnExplosion(tgt.basePos.clone().add(V(0, 2.5, 0)), 9.0, 0xfacc15);
                    SFX.fanfare();
                    MG.finish('🎱 GRAND PINBALL WIZARD DEFEATED — HIGH SCORE CHAMPION!', { color: '#fde047', delay: 2.0 });
                }
            });
            D.wizard = { tgt, fig, maxHp: 56, phase: 0, salvoCd: 2.4 };
            MG.toast('🧙‍♂️ BACKGLASS AWAKENED: THE ARCADE PINBALL WIZARD ENTERS THE PLAYFIELD!', '#ec4899');
        },
        update(S, dt, lib, state) {
            if (state !== 'running') return;
            if (BO.MinigameAudio) BO.MinigameAudio.tick(dt);
            const D = S.data, P = BO.Player;
            D.nudgeCd = Math.max(0, D.nudgeCd - dt);

            // Right-Side Brass Spring Plunger launches the player high up the playfield!
            if (P.pos.x > 14.5 && P.pos.z > 20.5) {
                P.vel.z = -32; P.vel.y = 13.5; P.onGround = false;
                SFX.boing();
                MG.toast('🚀 PLUNGER LAUNCHED ONTO THE PLAYFIELD!', '#fde047');
            }
            // Bottom Drain Pit hazard bounce-back
            if (P.pos.z > 24.5 && P.pos.x < 13.8) {
                P.takeDamage(14, P.pos, true);
                P.pos.set(16.5, 0.5, 21.5);
                MG.toast('⚠️ DRAINED! RE-LAUNCHING FROM PLUNGER LANE!', '#f87171');
            }

            // Animate Twin Giant Swinging Flippers!
            for (const fl of D.flippers) {
                fl.timer -= dt;
                if (fl.timer <= 0) { fl.timer = 1.9; fl.swing = 0.32; tone(280, 520, 0.10, 'square', 0.08); }
                if (fl.swing > 0) fl.swing = Math.max(0, fl.swing - dt);
                const ang = fl.side * (fl.swing > 0 ? 0.55 : -0.35);
                fl.grp.rotation.y = ang;
            }

            // Spawn Chrome Pinballs & Arcade Wizard Boss (after 14 shattered balls or 60s)!
            if (!D.wizardSpawned && (D.ballsShattered >= 14 || S.t >= 60)) {
                this._spawnWizardBoss(S);
            }
            D.spawnCd -= dt;
            if (D.spawnCd <= 0) { D.spawnCd = 2.8; this._spawnPinball(S, false); }

            // Real Pinball Table Slope Physics, Wall Ricochets, Pop-Bumper Hits & Flipper Returns!
            for (const b of D.balls) {
                if (!b.tgt.alive) continue;
                b.vel.z += 7.5 * dt; // Downward table slope gravity!
                b.tgt.basePos.x += b.vel.x * dt;
                b.tgt.basePos.z += b.vel.z * dt;
                b.sphere.rotation.x += b.vel.z * dt * 0.9;
                b.sphere.rotation.z -= b.vel.x * dt * 0.9;

                // Playfield wall bounces
                if (b.tgt.basePos.x < -16.8) { b.tgt.basePos.x = -16.8; b.vel.x = Math.abs(b.vel.x) * 0.95; }
                if (b.tgt.basePos.x > 12.6) { b.tgt.basePos.x = 12.6; b.vel.x = -Math.abs(b.vel.x) * 0.95; }
                if (b.tgt.basePos.z < -24.5) { b.tgt.basePos.z = -24.5; b.vel.z = Math.abs(b.vel.z) * 0.95; }
                if (b.tgt.basePos.z > 24.5) { b.tgt.basePos.z = -22; b.vel.z = 8; }

                // Electric Pop-Bumper Ricochets (+75 bonus bumper score!)
                for (const bmp of D.bumpers) {
                    const dx = b.tgt.basePos.x - bmp.pos.x, dz = b.tgt.basePos.z - bmp.pos.z;
                    const d = Math.hypot(dx, dz);
                    if (d < 2.95) {
                        const nx = dx / (d || 1), nz = dz / (d || 1);
                        b.tgt.basePos.x = bmp.pos.x + nx * 3.05;
                        b.tgt.basePos.z = bmp.pos.z + nz * 3.05;
                        b.vel.set(nx * 19, 0, nz * 19);
                        bmp.pulse = 0.2;
                        S.score += 75;
                        if (BO.MinigameAudio) BO.MinigameAudio.pinballBumper(); else tone(660, 990, 0.09, 'triangle', 0.07);
                        BO.FX.spawnParticles(bmp.pos.clone().add(V(0, 1.4, 0)), 8, bmp.col, 4, 2, 0.25, 0.6);
                    }
                }

                // Giant Flipper Returns!
                for (const fl of D.flippers) {
                    if (b.tgt.basePos.distanceTo(fl.pos) < 3.2 && b.vel.z > 0) {
                        b.vel.z = -22;
                        b.vel.x += (Math.random() - 0.5) * 14;
                        fl.swing = 0.3;
                    }
                }

                b.tgt.root.position.copy(b.tgt.basePos);

                // Player hit by giant rolling Chrome Pinball (jump over with SPACE!)
                if (Math.hypot(P.pos.x - b.tgt.basePos.x, P.pos.z - b.tgt.basePos.z) < 1.85 && P.pos.y < 1.4) {
                    P.takeDamage(12, b.tgt.basePos, true);
                    P.vel.y = 6.5;
                }
            }

            for (const bmp of D.bumpers) {
                if (bmp.pulse > 0) {
                    bmp.pulse = Math.max(0, bmp.pulse - dt);
                    const sc = 1 + bmp.pulse * 1.1;
                    bmp.cap.scale.set(sc, 1, sc);
                }
                if (Math.hypot(P.pos.x - bmp.pos.x, P.pos.z - bmp.pos.z) < 2.5) {
                    const push = P.pos.clone().sub(bmp.pos).setY(0).normalize();
                    P.pos.addScaledVector(push, 4.2);
                    P.vel.y = 7.5; P.onGround = false;
                    SFX.boing();
                }
            }

            if (D.wizard && D.wizard.tgt.alive) {
                const wz = D.wizard;
                wz.phase += dt * 2.4;
                wz.tgt.basePos.x = -2 + Math.sin(wz.phase) * 9.5;
                wz.tgt.root.position.copy(wz.tgt.basePos);
                wz.tgt.root.lookAt(P.pos.x, 0, P.pos.z);
                wz.salvoCd -= dt;
                if (wz.salvoCd <= 0) {
                    wz.salvoCd = 2.6;
                    BO.FX.spawnTracer(wz.tgt.basePos.clone().add(V(0, 3.2, 0)), P.pos.clone().add(V(0, 1.1, 0)), 0xec4899, 0.12, 0.18);
                    P.takeDamage(10, wz.tgt.basePos, true);
                }
            }

            if (!P.alive) MG.finish('TILT — GAME OVER ON THE PLAYFIELD', { color: '#f87171' });
        },
        hud(S) {
            const D = S.data, wz = D.wizard && D.wizard.tgt.alive ? D.wizard : null;
            const word = ['M', 'A', 'G', 'I', 'C'].map((c, i) => D.magicLit[i] ? `<b style="color:#fde047">[${c}]</b>` : `<span style="opacity:.45">${c}</span>`).join(' ');
            return `<div class="fun-panel">
                <div class="mgx-chip">🎰 JACKPOT <b>${word}</b></div>
                <div class="mgx-chip">🎱 SHATTERED <b>${D.ballsShattered}</b></div>
                <div class="mgx-chip ${D.nudgeCd <= 0 ? 'mgx-hot' : ''}">💥 NUDGE [E] <b>${D.nudgeCd <= 0 ? 'READY' : D.nudgeCd.toFixed(1) + 's'}</b></div>
            </div>
            ${wz ? `<div class="fun-panel" style="margin-top:5px;"><div class="fun-bar-wrap"><div class="fun-bar-lbl"><span>🧙‍♂️ ARCADE PINBALL WIZARD</span><b>${Math.max(0, Math.round(wz.tgt.hp))} / ${wz.maxHp}</b></div><div class="fun-bar"><i style="width:${Math.max(0, Math.round(wz.tgt.hp / wz.maxHp * 100))}%;background:linear-gradient(90deg,#facc15,#ec4899)"></i></div></div></div>` : ''}`;
        },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return {
                score: S.score, stars,
                title: D.wizardDown ? 'SUPREME PINBALL WIZARD' : 'BALL SAVED — TABLE COMPLETE',
                stats: [['PINBALLS SHATTERED', D.ballsShattered], ['MULTIBALL JACKPOTS', D.jackpots], ['PINBALL WIZARD BOSS', D.wizardDown ? 'DEFEATED' : D.wizardSpawned ? 'SURVIVED' : 'NOT SUMMONED']],
                xp: Math.round(190 + S.score * 0.032 + stars * 160)
            };
        }
    });
})(window);
