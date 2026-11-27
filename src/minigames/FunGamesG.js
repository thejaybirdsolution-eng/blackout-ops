/* ============================================================================
   BLACKOUT OPS — MINIGAMES: FUN & SPECIALS FLAGSHIP BATCH 2B (Modes 16–17)
     16. Gladiator Roman Colosseum — Sun-scorched Imperial Amphitheater with
         600 cheering spectators, Caesar's Velarium Box, Rising Spike-Floor
         Traps, Scythed War-Chariots, Armored Lion-Beasts, Retiarius Gladiators,
         Crowd Favor Meter (Emperor's Golden Gift Drops!), and Champion SPARTACUS REX!
     17. Zero-G Orbital Hull Breach — Float in low-gravity EVA outside Solar
         Station HELIOS-9 above a rotating 3D Earth & Starfield! Use [SPACE / C]
         EVA Jetpack Thrusters, [Q] Mag-Boot Anchor Slam, [E] Plasma-Weld 4
         Decompressing Hull Breaches to restore Oxygen, and blast Boarding
         Alien Void-Drones & the Leviathan Void-Carrier!
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

    function labelSprite(text, color, wScale = 2.5) {
        const tex = L.canvasTex('funG-lbl:' + text + ':' + color, 256, 64, (g, w, h) => {
            g.clearRect(0, 0, w, h);
            g.font = '900 28px Bahnschrift, Impact, sans-serif';
            g.textAlign = 'center'; g.textBaseline = 'middle';
            g.lineWidth = 7; g.strokeStyle = 'rgba(0,0,0,0.84)';
            g.strokeText(text, w / 2, h / 2, 240);
            g.fillStyle = color; g.fillText(text, w / 2, h / 2, 240);
        });
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
        s.scale.set(wScale, 0.58, 1);
        return s;
    }

    /* =====================================================================
       16. GLADIATOR ROMAN COLOSSEUM
       Imperial Sand Amphitheater + Scythed War-Chariots + Armored Lions +
       Rising Spike Grates + Crowd Favor & SPARTACUS REX!
    ===================================================================== */
    function buildWarChariot(rng) {
        const root = new THREE.Group();
        const hit = [];
        const horse = F.horse({ coat: 0x5c3a21, mane: 0x1c1917 });
        horse.root.position.set(0, 0, 1.85);
        root.add(horse.root);

        // Bronze-plated Roman Chariot Cab + Spinning Scythed Spoke Wheels + Plumed Charioteer!
        const bronze = std(0xd97706, 0.26, 0.86);
        const crimson = std(0x991b1b, 0.65);
        const steel = std(0xe2e8f0, 0.2, 0.92);

        const cab = new THREE.Group();
        cab.position.set(0, 0, -0.85);
        const floor = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.16, 1.55), std(0x451a03, 0.8));
        floor.position.y = 0.58;
        const shieldFront = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.76, 1.15, 16, 1, true, -Math.PI * 0.55, Math.PI * 1.1), crimson);
        shieldFront.position.set(0, 1.12, 0.1);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.06, 8, 18, Math.PI * 1.1), bronze);
        rim.rotation.x = Math.PI / 2; rim.rotation.z = -Math.PI * 0.05; rim.position.set(0, 1.68, 0.1);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 2.4, 8), std(0x451a03, 0.8));
        pole.rotation.x = Math.PI / 2; pole.position.set(0, 0.68, 1.5);
        cab.add(floor, shieldFront, rim, pole);
        hit.push(shieldFront, floor);

        const wheels = [];
        for (const sx of [-0.92, 0.92]) {
            const wg = new THREE.Group();
            wg.position.set(sx, 0.58, 0);
            const tire = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.065, 8, 20), bronze);
            tire.rotation.y = Math.PI / 2;
            const blade = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.72, 6), steel);
            blade.rotation.z = -sx * Math.PI / 2; blade.position.x = sx * 0.36;
            wg.add(tire, blade);
            cab.add(wg);
            wheels.push(wg);
        }

        const driver = F.human({
            skin: F.SKINS[0], shirt: 0x991b1b, coat: 0xb45309, pants: 0x451a03,
            hat: 'helmet', hatColor: 0xfacc15, eyes: 'angry', scale: 0.98
        });
        driver.root.position.set(0, 0.62, -0.1);
        F.pose(driver, 'aimOne');
        cab.add(driver.root);
        hit.push(...driver.hit);

        root.add(cab);
        return { root, hit, horse, wheels, driver };
    }

    function buildArmoredLion() {
        const root = new THREE.Group();
        const hit = [];
        const tawny = std(0xd97706, 0.78);
        const maneM = std(0x78350f, 0.90);
        const goldArmor = std(0xfacc15, 0.25, 0.86);

        const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.05, 6, 12), tawny);
        torso.rotation.x = Math.PI / 2; torso.position.y = 0.76;
        const barding = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.65, 14, 1, true, -Math.PI * 0.6, Math.PI * 1.2), goldArmor);
        barding.rotation.z = Math.PI / 2; barding.position.set(0, 0.85, 0.15);
        const mane = new THREE.Mesh(new THREE.DodecahedronGeometry(0.56, 1), maneM);
        mane.position.set(0, 0.98, 0.72);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.56), tawny);
        head.position.set(0, 0.98, 1.02);
        head.userData.hitbox = 'head';
        for (const sx of [-0.14, 0.14]) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), basic(0xfef08a));
            eye.position.set(sx, 1.08, 1.29);
            const fang = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 6), std(0xffffff, 0.3));
            fang.rotation.x = Math.PI; fang.position.set(sx, 0.76, 1.24);
            root.add(eye, fang);
        }
        const legs = [];
        for (const [lx, lz] of [[-0.28, 0.52], [0.28, 0.52], [-0.28, -0.52], [0.28, -0.52]]) {
            const lg = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.52, 4, 8), tawny);
            lg.position.set(lx, 0.36, lz);
            root.add(lg); legs.push(lg);
        }
        root.add(torso, barding, mane, head);
        hit.push(torso, barding, mane, head);
        root.traverse((m) => { if (m.isMesh) m.castShadow = true; });
        return { root, hit, legs };
    }

    function buildGladiator(isBoss) {
        const sc = isBoss ? 1.55 : 1.02;
        const fig = F.human({
            skin: 0xc68642, shirt: isBoss ? 0x991b1b : 0x78350f, vest: isBoss ? 0xfacc15 : 0x94a3b8,
            pants: 0x451a03, hat: 'helmet', hatColor: isBoss ? 0xfacc15 : 0xcbd5e1, eyes: 'angry', scale: sc
        });
        // Roman Scutum Tower Shield on Left Arm + Gladius Broadsword on Right Arm + Red Crest Plume!
        const crest = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.42), std(0xdc2626, 0.7));
        crest.position.set(0, 0.52, 0);
        fig.parts.headG.add(crest);

        const shield = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.98, 0.08), std(isBoss ? 0x991b1b : 0x7f1d1d, 0.45, 0.4));
        const bossKnob = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), std(0xfacc15, 0.25, 0.88));
        bossKnob.position.z = 0.05;
        shield.add(bossKnob);
        shield.position.set(-0.18, -0.45, 0.22);
        fig.parts.armL.add(shield);

        const sword = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.88), std(0xe2e8f0, 0.18, 0.92));
        sword.position.set(0, -0.64, 0.42);
        fig.parts.armR.add(sword);
        F.pose(fig, 'shield');
        return fig;
    }

    MG.register({
        id: 'fun_colosseum', cat: 'fun', order: 16,
        name: 'Gladiator Roman Colosseum', icon: '🏛️', accent: '#f59e0b', badge: 'IMPERIAL ARENA',
        tagline: 'Win the roar of 600 Romans! Dodge War-Chariots & Spike Grates, earn Caesar\'s Favor & slay Spartacus!',
        desc: 'Enter the sun-drenched Flavian Colosseum before Emperor Aurelius and 600 roaring spectators! Battle Armored Nemean Lions, Scythed Roman War-Chariots circling the sand, and Shielded Legionaries while dodging telegraphing Iron Spike Floor Grates! Chain stylish kills and press [E] Battle-Roar to fill your CROWD FAVOR meter to 100%—prompting Caesar to toss Golden Imperial Supply Chests (+Armor, +HP & +500 Favor Bonus)—before the portcullis rises for Champion SPARTACUS REX!',
        guide: {
            objective: 'Survive the Colosseum trials, build Crowd Favor for Emperor Supply Drops, and defeat Champion SPARTACUS REX when the North Gate opens!',
            tips: [
                'Press [E] GLADIATOR TAUNT / SHIELD BASH (8s cooldown) to knock back nearby Lions & Legionaries AND gain an instant +25% Crowd Favor boost from the cheering stands!',
                'Watch the 4 Iron Floor Grates—when a grate glows ORANGE, step off within 1.2s before steel spikes thrust upward (lure enemies onto them for instant impale kills!).',
                'Scythed War-Chariots circle the outer sand ring fast: snipe the Charioteer to send the chariot crashing in a shower of bronze sparks!'
            ]
        },
        heroLabel: 'FUN & SPECIALS • IMPERIAL ARENA SPECTACLE', duration: 165,
        stars: [2800, 5600, 9200, 13500],
        standardWeapon: 'spas12_tac', secondaryWeapon: 'python_magnum', lockWeapon: true, infiniteMag: true, forgivingMisses: true, customMusic: true,
        weaponLabel: 'GLADIATOR SPAS-12 + PYTHON + SHIELD BASH [E]', weaponNote: '[E] Taunt & Shield-Bash Knockback (+25% Favor) • Lure foes onto Spike Grates!',
        keys: [['WASD', 'Circle the Sand'], ['E', 'Taunt & Shield Bash (8s)'], ['1 / 2', 'Swap Shotgun / Magnum'], ['SPACE', 'Leap Chariots & Spikes']],
        map: {
            atmosphere: { skyTop: 0x0284c7, skyBottom: 0xfde68a, fogColor: 0xfed7aa, fogDensity: 0.0045, sunColor: 0xfffbeb, sunIntensity: 1.9, sunPos: [-35, 55, 40], hemiSky: 0xfef3c7, hemiGround: 0x92400e, hemiIntensity: 0.9 },
            skybox: 'skybox-day.png',
            boxes: [B(0, -0.5, 0, 80, 1, 80, 'desert_sand')],
            spawn: { x: 0, y: 0.1, z: 14, yaw: 0 }
        },
        countdown: 3,
        build(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.start('colosseum');
            const D = S.data;
            const R = 25.5;
            Object.assign(D, {
                arenaR: R, favor: 20, gifts: [], grates: [], foes: [], chariots: [],
                tauntCd: 0, spawnCd: 1.4, chariotCd: 5.5, killsCount: 0, bossSpawned: false, bossSlain: false
            });

            // Sun-baked Colosseum Sand Floor + Circular Travertine Wall + 5-Tiered Stands + 560 Cheering Spectators + Crimson Velarium Awning!
            const sandTex = L.canvasTex('colosseum-sand-v2', 512, 512, (g, w, h) => {
                g.fillStyle = '#d6b07a'; g.fillRect(0, 0, w, h);
                const rnd = L.mulberry32(77);
                for (let i = 0; i < 2500; i++) {
                    g.fillStyle = `rgba(120,65,20,${rnd() * 0.18})`;
                    g.fillRect(rnd() * w, rnd() * h, 3, 3);
                }
                g.strokeStyle = 'rgba(153,27,27,0.32)'; g.lineWidth = 8;
                g.beginPath(); g.arc(w / 2, h / 2, 190, 0, TAU); g.stroke();
            });
            const sand = new THREE.Mesh(new THREE.CircleGeometry(R + 0.8, 56), A.pbrMat('fantasy_painterly/Transitions/sand-to-grass-001.png', 10, 10, { color: 0xe7c99b, roughness: 0.92 }));
            sand.rotation.x = -Math.PI / 2; sand.position.y = 0.02; sand.receiveShadow = true; S.add(sand);

            const wallMat = A.pbrMat('fantasy_painterly/Stone Masonry Ruins/ancient-courtyard-001.png', 16, 2, { color: 0xd6cfc2, roughness: 0.88 });
            const archDark = std(0x57534e, 0.92), crimson = std(0x991b1b, 0.75), gold = std(0xfacc15, 0.25, 0.88);
            const wall = new THREE.Mesh(new THREE.CylinderGeometry(R + 1.2, R + 1.2, 5.8, 56, 1, true), A.pbrMat('fantasy_painterly/Stone Masonry Ruins/ancient-courtyard-001.png', 18, 2, { roughness: 0.9, side: THREE.BackSide }));
            wall.position.y = 2.9; S.add(wall); S.solid(wall);
            // Instanced castle kit arches, pillars, walls & imperial banners ringing the Colosseum bowl
            const colWallTr = [], colBannerTr = [];
            for (let i = 0; i < 24; i++) {
                const a = (i / 24) * TAU;
                const angY = -a + Math.PI / 2;
                colWallTr.push({ pos: [Math.cos(a) * (R + 1.4), 0, Math.sin(a) * (R + 1.4)], rot: angY });
                if (i % 2 === 0) colBannerTr.push({ pos: [Math.cos(a) * (R + 0.6), 4.2, Math.sin(a) * (R + 0.6)], rot: angY });
            }
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/castle_kit/wall.glb', colWallTr, { fitSize: [6.8, 5.8, 1.4] });
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/castle_kit/flag-banner-long.glb', colBannerTr, { fitSize: [1.5, 3.6, 0.5] });
            L.placeGLB(S.scene, 'staged_assets/3d_models/castle_kit/gate.glb', { pos: [0, 0, -(R + 0.8)], fitSize: [7.6, 6.2, 2.2] });
            for (let i = 0; i < 48; i++) {
                const a = (i / 48) * TAU, cr = R + 2.6;
                S.collider(Math.cos(a) * cr - 2.2, 0, Math.sin(a) * cr - 2.2, Math.cos(a) * cr + 2.2, 7, Math.sin(a) * cr + 2.2);
            }
            for (let t = 0; t < 5; t++) {
                const tier = new THREE.Mesh(new THREE.CylinderGeometry(R + 2.4 + t * 1.5, R + 2.4 + t * 1.5, 1.2, 56, 1, true), std(t % 2 ? 0x78716c : 0xa8a29e, 0.92, 0, { side: THREE.DoubleSide }));
                tier.position.y = 5.8 + t * 1.2; S.add(tier);
            }
            D.crowd = A.crowd(S, R + 2.8, 540, 6.4, 5, 1.5);

            // Overhead Crimson Sailcloth Velarium Sun-Sails!
            for (let v = 0; v < 12; v++) {
                const a = (v / 12) * TAU;
                const sail = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 11.5), new THREE.MeshStandardMaterial({ color: v % 2 ? 0x991b1b : 0xfef3c7, side: THREE.DoubleSide, roughness: 0.85 }));
                sail.rotation.x = Math.PI / 2 - 0.18;
                sail.rotation.z = -a + Math.PI / 2;
                sail.position.set(Math.cos(a) * (R + 4.2), 13.8, Math.sin(a) * (R + 4.2));
                S.add(sail);
            }

            // Emperor Caesar's Royal Marble Box (East Side) + North Boss Portcullis Gate!
            const boxG = new THREE.Group();
            boxG.position.set(R + 0.6, 5.8, 0); boxG.rotation.y = -Math.PI / 2;
            const canopy = new THREE.Mesh(new THREE.BoxGeometry(7.5, 4.2, 3.6), crimson); canopy.position.y = 2.1;
            const caesar = F.human({ coat: 0x7e22ce, shirt: 0xf8fafc, hat: 'crown', hatColor: 0xfacc15, scale: 1.15 });
            caesar.root.position.set(0, 0.2, 1.1);
            const empSign = A.sign('👑 CAESAR AURELIUS — EARN 100% FAVOR!', 6.8, 0.85, { bg: '#450a0a', color: '#fde047', borderColor: '#facc15', size: 0.30 });
            empSign.position.set(0, 4.5, 1.85);
            boxG.add(canopy, caesar.root, empSign);
            S.add(boxG);
            D.caesar = caesar;
            // Chasing Imperial Gold Torch-Bulbs along Caesar's Royal Box & Colosseum Rim!
            const rimPts = [];
            for (let i = 0; i < 32; i++) { const a = (i / 32) * TAU; rimPts.push(V(Math.cos(a) * (R + 0.9), 5.65, Math.sin(a) * (R + 0.9))); }
            const colBulbs = A.bulbs(rimPts, [0xfde047, 0xf97316, 0xfef3c7], 0.14);
            S.add(colBulbs); A.animateBulbs(S, colBulbs, 5, 'chase');

            // 4 Marble Victory Columns for chariot cover + 4 Rising Iron Spike-Trap Grates!
            for (const [px, pz] of [[-9.5, -9.5], [9.5, -9.5], [-9.5, 9.5], [9.5, 9.5]]) {
                const col = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.98, 5.6, 16), wallMat);
                col.position.set(px, 2.8, pz); S.add(col); S.solid(col);
                S.collider(px - 1.0, 0, pz - 1.0, px + 1.0, 5.6, pz + 1.0);
                S.add(A.torch(S, V(px, 5.6, pz), 0xf97316, false));
            }

            const grateCoords = [[-6.5, 0], [6.5, 0], [0, -6.5], [0, 6.5]];
            for (let i = 0; i < grateCoords.length; i++) {
                const [gx, gz] = grateCoords[i];
                const frame = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 4.2), std(0x27272a, 0.5, 0.8));
                frame.position.set(gx, 0.04, gz); S.add(frame);
                const warnGlow = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 3.8), new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.0 }));
                warnGlow.rotation.x = -Math.PI / 2; warnGlow.position.set(gx, 0.09, gz); S.add(warnGlow);
                const spikesG = new THREE.Group();
                spikesG.position.set(gx, -1.3, gz);
                for (let sx = -1.2; sx <= 1.2; sx += 0.8) {
                    for (let sz = -1.2; sz <= 1.2; sz += 0.8) {
                        const sp = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.35, 6), std(0xe2e8f0, 0.2, 0.92));
                        sp.position.set(sx, 0.65, sz);
                        spikesG.add(sp);
                    }
                }
                S.add(spikesG);
                D.grates.push({ pos: V(gx, 0, gz), warnGlow, spikesG, timer: 2.5 + i * 2.2, phase: 'idle' });
            }

            D.onKey = (e) => {
                if (MG.session !== S || MG.state !== 'running') return;
                if (e.code === 'KeyE') this._gladiatorTaunt(S);
            };
            window.addEventListener('keydown', D.onKey);
        },
        dispose(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.stop();
            if (S.data.onKey) window.removeEventListener('keydown', S.data.onKey);
        },
        _addFavor(S, amt) {
            const D = S.data;
            D.favor = Math.min(100, D.favor + amt);
            if (D.favor >= 100) {
                D.favor = 0;
                D.crowd.cheer(1.5);
                SFX.crowd(0.35); SFX.fanfare();
                const gx = (Math.random() - 0.5) * 10, gz = (Math.random() - 0.5) * 10;
                const chest = new THREE.Group();
                chest.position.set(gx, 0, gz);
                const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.75, 0.8), std(0xfacc15, 0.22, 0.9, { emissive: 0xca8a04, emissiveIntensity: 0.45 }));
                box.position.y = 0.38;
                const lbl = labelSprite('👑 CAESAR\'S GIFT (+HP & +600)', '#fde047', 2.6);
                lbl.position.y = 1.45;
                chest.add(box, lbl); S.add(chest);
                D.gifts.push({ mesh: chest, pos: V(gx, 0, gz) });
                MG.toast('👑 CAESAR IS THRILLED — GOLDEN GIFT TOSSED INTO THE ARENA!', '#fde047');
            }
        },
        _gladiatorTaunt(S) {
            const D = S.data, P = BO.Player;
            if (D.tauntCd > 0) return;
            D.tauntCd = 8.0;
            D.crowd.cheer(1.1);
            SFX.crowd(0.24);
            tone(180, 340, 0.26, 'sawtooth', 0.13);
            BO.FX.spawnParticles(P.pos.clone().add(V(0, 1.0, 0)), 22, 0xfacc15, 6, 3, 0.45, 0.9);
            let bashed = 0;
            for (const f of D.foes) {
                if (!f.tgt.alive) continue;
                const d = f.tgt.basePos.distanceTo(P.pos);
                if (d < 5.5) {
                    const push = f.tgt.basePos.clone().sub(P.pos).setY(0).normalize();
                    f.tgt.basePos.addScaledVector(push, 4.5);
                    f.tgt.root.position.copy(f.tgt.basePos);
                    bashed++;
                }
            }
            this._addFavor(S, 25);
            MG.toast(bashed > 0 ? `🛡️ SHIELD BASHED ${bashed} FOE(S) +25% CROWD FAVOR!` : '⚔️ ROARED TO THE CROWD (+25% FAVOR)!', '#fde047');
        },
        _spawnArenaFoe(S, isBoss = false) {
            const D = S.data;
            if (!isBoss && D.foes.length >= 8) return;
            const a = isBoss ? -Math.PI / 2 : Math.random() * TAU;
            const pos = V(Math.cos(a) * (D.arenaR - 2.5), 0, Math.sin(a) * (D.arenaR - 2.5));
            const isLion = !isBoss && Math.random() < 0.46;

            if (isLion) {
                const lion = buildArmoredLion();
                const tgt = S.addTarget({
                    kind: 'nemean_lion', mesh: lion.root, hitMeshes: lion.hit, pos,
                    hp: 4, life: 0, points: 240, appear: 'scale', death: 'tumble', deathColor: 0xd97706,
                    onKill: () => {
                        D.killsCount++; this._addFavor(S, 14);
                        D.foes = D.foes.filter((x) => x.tgt !== tgt);
                    }
                });
                D.foes.push({ tgt, isLion: true, lion, speed: 5.8, atkCd: 0.9, phase: Math.random() * 6 });
            } else {
                const fig = buildGladiator(isBoss);
                const maxHp = isBoss ? 48 : 6;
                const tgt = S.addTarget({
                    kind: isBoss ? 'spartacus_rex' : 'legionary', mesh: fig.root, hitMeshes: fig.hit, pos,
                    hp: maxHp, life: 0, points: isBoss ? 3000 : 310, appear: 'scale', death: 'knock', deathColor: 0xef4444,
                    onKill: () => {
                        D.killsCount++; this._addFavor(S, 18);
                        D.foes = D.foes.filter((x) => x.tgt !== tgt);
                        if (isBoss) {
                            D.bossSlain = true;
                            D.crowd.cheer(2.0); SFX.fanfare();
                            MG.finish('🏛️ CHAMPION OF ROME — SPARTACUS REX VANQUISHED!', { color: '#fde047', delay: 2.0 });
                        }
                    }
                });
                const fObj = { tgt, isLion: false, isBoss, maxHp, fig, speed: isBoss ? 4.4 : 3.4, atkCd: 1.2, phase: Math.random() * 6 };
                D.foes.push(fObj);
                if (isBoss) {
                    D.boss = fObj;
                    MG.toast('🚨 PORTCULLIS OPEN: CHAMPION SPARTACUS REX ENTERS THE SAND!', '#ef4444');
                    BO.Sound.playBossIntro && BO.Sound.playBossIntro();
                }
            }
        },
        _spawnChariot(S) {
            const D = S.data;
            if (D.chariots.length >= 2) return;
            const ch = buildWarChariot(Math.random);
            const a0 = Math.random() * TAU;
            const pos = V(Math.cos(a0) * 18.5, 0, Math.sin(a0) * 18.5);
            const tgt = S.addTarget({
                kind: 'war_chariot', mesh: ch.root, hitMeshes: ch.hit, pos,
                hp: 7, life: 0, points: 550, appear: 'scale', death: 'burst', deathColor: 0xfacc15,
                onKill: () => {
                    BO.FX.spawnExplosion(tgt.basePos.clone().add(V(0, 1, 0)), 4.2, 0xf97316);
                    D.killsCount++; this._addFavor(S, 28);
                    D.crowd.cheer(1.2);
                    D.chariots = D.chariots.filter((x) => x.tgt !== tgt);
                }
            });
            D.chariots.push({ tgt, ch, ang: a0, radius: 18.2, dir: Math.random() < 0.5 ? 1 : -1, gph: 0 });
        },
        update(S, dt, lib, state) {
            if (state !== 'running') return;
            if (BO.MinigameAudio) BO.MinigameAudio.tick(dt);
            const D = S.data, P = BO.Player;
            D.tauntCd = Math.max(0, D.tauntCd - dt);
            if (D.caesar) D.caesar.root.position.y = 0.2 + Math.abs(Math.sin(S.t * 3.5)) * (D.favor > 60 ? 0.22 : 0.05);

            // Collect Caesar's Golden Supply Chests
            for (let i = D.gifts.length - 1; i >= 0; i--) {
                const gf = D.gifts[i];
                gf.mesh.rotation.y += dt * 2.2;
                if (Math.hypot(P.pos.x - gf.pos.x, P.pos.z - gf.pos.z) < 2.2) {
                    P.hp = Math.min(P.maxHp, P.hp + 45);
                    P.armor = Math.min(100, (P.armor || 0) + 50);
                    S.award(600, gf.pos.clone().add(V(0, 1.4, 0)), '👑 CAESAR\'S BLESSING!', '#fde047');
                    tone(520, 1040, 0.22, 'triangle', 0.12);
                    S.scene.remove(gf.mesh); D.gifts.splice(i, 1);
                }
            }

            // Update 4 Rising Iron Spike Floor Grates (impales both enemies & careless players!)
            for (const gr of D.grates) {
                gr.timer -= dt;
                if (gr.phase === 'idle' && gr.timer <= 0) {
                    gr.phase = 'warn'; gr.timer = 1.25;
                    gr.warnGlow.material.opacity = 0.55;
                } else if (gr.phase === 'warn' && gr.timer <= 0) {
                    gr.phase = 'up'; gr.timer = 1.6;
                    gr.warnGlow.material.opacity = 0.85;
                    gr.spikesG.position.y = 0;
                    SFX.clack();
                    if (Math.abs(P.pos.x - gr.pos.x) < 1.9 && Math.abs(P.pos.z - gr.pos.z) < 1.9 && P.pos.y < 0.9) {
                        P.takeDamage(18, gr.pos, true);
                    }
                    for (const f of D.foes.slice()) {
                        if (f.tgt.alive && !f.isBoss && Math.abs(f.tgt.basePos.x - gr.pos.x) < 2.1 && Math.abs(f.tgt.basePos.z - gr.pos.z) < 2.1) {
                            S.award(300, f.tgt.basePos.clone().add(V(0, 1.5, 0)), '🩸 SPIKE IMPALE!', '#fca5a5');
                            this._addFavor(S, 20);
                            f.tgt.kill({ pt: f.tgt.basePos });
                        }
                    }
                } else if (gr.phase === 'up' && gr.timer <= 0) {
                    gr.phase = 'idle'; gr.timer = 5.5 + Math.random() * 2.5;
                    gr.warnGlow.material.opacity = 0;
                }
                gr.spikesG.position.y = lerp(gr.spikesG.position.y, gr.phase === 'up' ? 0 : -1.3, dt * 14);
            }

            // Spawn Lions, Legionaries, War-Chariots & Spartacus Rex Boss (after 14 kills or 65s)!
            if (!D.bossSpawned && (D.killsCount >= 14 || S.t >= 65)) {
                D.bossSpawned = true;
                this._spawnArenaFoe(S, true);
            }
            D.spawnCd -= dt;
            if (D.spawnCd <= 0) { D.spawnCd = 2.8; this._spawnArenaFoe(S, false); }
            D.chariotCd -= dt;
            if (D.chariotCd <= 0) { D.chariotCd = 11.0; this._spawnChariot(S); }

            // Update Scythed Roman War-Chariots thundering around the outer track!
            for (const c of D.chariots) {
                if (!c.tgt.alive) continue;
                c.ang += c.dir * 0.72 * dt;
                c.gph += dt * 13;
                const cx = Math.cos(c.ang) * c.radius, cz = Math.sin(c.ang) * c.radius;
                c.tgt.basePos.set(cx, 0, cz);
                c.tgt.root.position.copy(c.tgt.basePos);
                c.tgt.root.rotation.y = Math.atan2(-Math.sin(c.ang) * c.dir, Math.cos(c.ang) * c.dir);
                F.gallop(c.ch.horse, c.gph, 1);
                for (const w of c.ch.wheels) w.rotation.x += dt * 14;
                if (Math.random() < dt * 8) BO.FX.spawnParticles(c.tgt.basePos, 2, 0xd6b07a, 2, 1, 0.35, 0.8);
                if (P.pos.distanceTo(c.tgt.basePos) < 2.5 && P.pos.y < 1.1) {
                    P.takeDamage(16, c.tgt.basePos, true);
                    const push = P.pos.clone().sub(c.tgt.basePos).setY(0).normalize();
                    P.pos.addScaledVector(push, 3.2);
                }
            }

            // Update Lions & Gladiators
            for (const f of D.foes) {
                if (!f.tgt.alive) continue;
                f.phase += dt * 9;
                const dx = P.pos.x - f.tgt.basePos.x, dz = P.pos.z - f.tgt.basePos.z;
                const dist = Math.max(0.1, Math.hypot(dx, dz));
                f.tgt.root.rotation.y = Math.atan2(dx, dz);
                if (dist > 1.75) {
                    f.tgt.basePos.x += (dx / dist) * f.speed * dt;
                    f.tgt.basePos.z += (dz / dist) * f.speed * dt;
                    f.tgt.root.position.copy(f.tgt.basePos);
                    if (f.fig) F.walk(f.fig, f.phase, 1, true);
                    if (f.lion) {
                        f.lion.legs.forEach((lg, idx) => { lg.rotation.x = Math.sin(f.phase * 1.4 + (idx < 2 ? 0 : Math.PI)) * 0.65; });
                    }
                } else {
                    f.atkCd -= dt;
                    if (f.atkCd <= 0) {
                        f.atkCd = f.isBoss ? 0.95 : 1.25;
                        P.takeDamage(f.isBoss ? 15 : 9, f.tgt.basePos, true);
                    }
                }
            }

            if (!P.alive) MG.finish('FALLEN UPON THE COLOSSEUM SAND', { color: '#f87171' });
        },
        hud(S) {
            const D = S.data, boss = D.boss && D.boss.tgt.alive ? D.boss : null;
            return `<div class="fun-panel">
                <div class="mgx-chip">👍 CROWD FAVOR <b>${Math.round(D.favor)}%</b></div>
                <div class="mgx-chip">GLADIATORS SLAIN <b>${D.killsCount}</b></div>
                <div class="mgx-chip ${D.tauntCd <= 0 ? 'mgx-hot' : ''}">🛡️ TAUNT & BASH [E] <b>${D.tauntCd <= 0 ? 'READY' : D.tauntCd.toFixed(1) + 's'}</b></div>
            </div>
            ${boss ? `<div class="fun-panel" style="margin-top:5px;"><div class="fun-bar-wrap"><div class="fun-bar-lbl"><span>🏛️ CHAMPION SPARTACUS REX</span><b>${Math.max(0, Math.round(boss.tgt.hp))} / ${boss.maxHp}</b></div><div class="fun-bar"><i style="width:${Math.max(0, Math.round(boss.tgt.hp / boss.maxHp * 100))}%;background:linear-gradient(90deg,#dc2626,#facc15)"></i></div></div></div>` : ''}`;
        },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return {
                score: S.score, stars,
                title: D.bossSlain ? 'CHAMPION OF CAESAR\'S COLOSSEUM' : 'ARENA TRIAL COMPLETE',
                stats: [['ARENA KILLS', D.killsCount], ['SPARTACUS REX', D.bossSlain ? 'VANQUISHED' : D.bossSpawned ? 'SURVIVED' : 'NOT SUMMONED'], ['BEST STREAK', S.maxCombo]],
                xp: Math.round(185 + S.score * 0.032 + stars * 155)
            };
        }
    });

    /* =====================================================================
       17. ZERO-G ORBITAL HULL BREACH
       Crystal-clear 2-Step Orbital Defense outside Station HELIOS-9:
         STEP 1: Follow 3D Beacon Pillars & HUD Radar Pointers to 4 Red
                 Hull Breaches and HOLD [LMB / E] to Plasma-Weld Seal (X / 4)
         STEP 2: Destroy all 3 Reactor Cores on the Void-Carrier Mothership!
       Features 6-DOF EVA Thrusters (WASD + SPACE/C/CTRL + SHIFT Boost Fuel),
       Auto Magnetic Tether (>85m), Explosive O2 Canisters, Spinning Radar
       Dishes, skybox-space.png & Glowing Earth Limb!
    ===================================================================== */
    function earthContinentTex() {
        return L.canvasTex('orbital-earth-v2', 1024, 512, (g, w, h) => {
            const ocean = g.createLinearGradient(0, 0, 0, h);
            ocean.addColorStop(0, '#075985');
            ocean.addColorStop(0.28, '#0284c7');
            ocean.addColorStop(0.55, '#0369a1');
            ocean.addColorStop(1, '#082f49');
            g.fillStyle = ocean; g.fillRect(0, 0, w, h);
            const rnd = L.mulberry32(4027);
            for (let i = 0; i < 42; i++) {
                g.fillStyle = i % 3 === 0 ? '#166534' : i % 3 === 1 ? '#15803d' : '#a16207';
                g.beginPath();
                g.ellipse(rnd() * w, 65 + rnd() * (h - 130), 28 + rnd() * 90, 18 + rnd() * 48, rnd() * 2.2, 0, TAU);
                g.fill();
            }
            // Polar ice caps
            g.fillStyle = 'rgba(224,242,254,0.85)';
            g.fillRect(0, 0, w, 34);
            g.fillRect(0, h - 34, w, 34);
            // Swirling white cloud bands
            g.fillStyle = 'rgba(255,255,255,0.42)';
            for (let c = 0; c < 68; c++) {
                g.beginPath();
                g.ellipse(rnd() * w, rnd() * h, 42 + rnd() * 110, 7 + rnd() * 16, (rnd() - 0.5) * 0.4, 0, TAU);
                g.fill();
            }
        });
    }

    function solarArrayTex() {
        return L.canvasTex('helios-solar-v2', 256, 512, (g, w, h) => {
            g.fillStyle = '#0f172a'; g.fillRect(0, 0, w, h);
            g.fillStyle = '#1e3a8a'; g.fillRect(6, 6, w - 12, h - 12);
            g.strokeStyle = '#38bdf8'; g.lineWidth = 2;
            for (let y = 0; y <= h; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
            for (let x = 0; x <= w; x += 42) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
            g.strokeStyle = '#facc15'; g.lineWidth = 5;
            g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke();
        });
    }

    function buildVoidDrone() {
        const root = new THREE.Group();
        const hit = [];
        const chitin = std(0x311042, 0.25, 0.82, { emissive: 0x1e1b4b, emissiveIntensity: 0.3 });
        const neon = basic(0x22d3ee);
        const coreEye = basic(0xf43f5e);

        const hull = new THREE.Mesh(new THREE.SphereGeometry(0.72, 18, 14), chitin);
        hull.scale.set(1.25, 0.78, 1.38);
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10), coreEye);
        eye.position.set(0, 0.06, 0.82);
        eye.userData.hitbox = 'head';
        const gyroRing = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.08, 8, 24), std(0x94a3b8, 0.2, 0.92));
        gyroRing.rotation.x = Math.PI / 2;
        const glowRing = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.04, 6, 20), neon);
        glowRing.rotation.x = Math.PI / 2;

        root.add(hull, eye, gyroRing, glowRing);
        hit.push(hull, eye);
        for (const sx of [-1, 1]) {
            const pincer = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.05, 8), chitin);
            pincer.rotation.x = Math.PI / 2; pincer.position.set(sx * 0.78, -0.1, 0.72);
            root.add(pincer); hit.push(pincer);
        }
        return { root, hit, gyroRing };
    }

    function buildVoidCarrierHull() {
        const root = new THREE.Group();
        const hullM = std(0x1e1b4b, 0.28, 0.84, { emissive: 0x311042, emissiveIntensity: 0.35 });
        const trimM = std(0x475569, 0.22, 0.9);
        const crimson = basic(0xf43f5e);
        const cyan = basic(0x22d3ee);

        // Colossal alien mothership chassis (spans ~24m wide!)
        const spine = new THREE.Mesh(new THREE.BoxGeometry(7.5, 3.2, 14.5), hullM);
        const prow = new THREE.Mesh(new THREE.ConeGeometry(3.8, 6.5, 6), hullM);
        prow.rotation.x = Math.PI / 2; prow.position.set(0, 0, 10.2);
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.0, 4.5), trimM);
        bridge.position.set(0, 2.3, 1.5);
        const bridgeVisor = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.7, 0.4), crimson);
        bridgeVisor.position.set(0, 2.4, 3.8);
        root.add(spine, prow, bridge, bridgeVisor);

        for (const sx of [-1, 1]) {
            const wing = new THREE.Mesh(new THREE.BoxGeometry(9.5, 1.1, 6.8), hullM);
            wing.position.set(sx * 7.8, -0.2, -1.0);
            wing.rotation.z = -sx * 0.14;
            const rib = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.28, 0.5), cyan);
            rib.position.set(sx * 7.8, 0.42, 1.8);
            rib.rotation.z = -sx * 0.14;
            const talon = new THREE.Mesh(new THREE.ConeGeometry(0.9, 5.2, 6), trimM);
            talon.rotation.x = Math.PI / 2; talon.position.set(sx * 11.5, -0.6, 3.5);
            root.add(wing, rib, talon);
        }

        const haloRing = new THREE.Mesh(new THREE.TorusGeometry(6.2, 0.22, 10, 36), cyan);
        haloRing.rotation.x = Math.PI / 2; haloRing.position.set(0, -1.4, 0);
        root.add(haloRing);
        return { root, haloRing };
    }

    function projectEdgePointer(cam, worldPos, label, color) {
        if (!cam) return '';
        const W = window.innerWidth, H = window.innerHeight;
        const rel = worldPos.clone().sub(cam.position);
        const dist = Math.round(rel.length());
        const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
        const behind = rel.dot(fwd) < 0;

        const v = worldPos.clone().project(cam);
        let sx = (v.x * 0.5 + 0.5) * W;
        let sy = (-v.y * 0.5 + 0.5) * H;
        if (behind) {
            sx = W - sx;
            sy = H - sy;
            const dx = sx - W / 2, dy = sy - H / 2;
            const mag = Math.hypot(dx, dy) || 1;
            sx = W / 2 + (dx / mag) * W;
            sy = H / 2 + (dy / mag) * H;
        }
        const padX = 88, padTop = 128, padBot = 92;
        const clampedX = Math.max(padX, Math.min(W - padX, sx));
        const clampedY = Math.max(padTop, Math.min(H - padBot, sy));
        const offScreen = behind || sx < padX || sx > W - padX || sy < padTop || sy > H - padBot;

        const dx = sx - W / 2, dy = sy - H / 2;
        const ang = Math.atan2(dy, dx);
        const arrows = ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗'];
        const arrow = offScreen ? arrows[((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8] : '◎';
        return `<div style="position:fixed;left:${Math.round(clampedX)}px;top:${Math.round(clampedY)}px;transform:translate(-50%,-50%);padding:4px 9px;border-radius:999px;background:rgba(6,10,22,0.88);border:2px solid ${color};color:${color};font:900 11px var(--font-mono);letter-spacing:1px;white-space:nowrap;box-shadow:0 0 14px ${color}66;pointer-events:none;z-index:34;">${arrow} ${label} • ${dist}m</div>`;
    }

    MG.register({
        id: 'fun_orbital_breach', cat: 'fun', order: 17,
        name: 'Zero-G Orbital Hull Breach', icon: '🛰️', accent: '#06b6d4', badge: 'ZERO-G EVA',
        tagline: 'Step 1: Fly to 4 Red Beacon Pillars & Weld Hull Breaches [LMB/E]. Step 2: Destroy Void-Carrier Reactor Cores!',
        desc: 'Float outside Orbital Station HELIOS-9 in full 6-DOF Zero-G EVA above the glowing curved limb of Earth! Follow the towering crimson holographic beacon pillars and live HUD radar pointers to all 4 Hull Breaches, hold [LMB] or [E] to fire your Plasma Welder until sealed, detonate Explosive O2 Canisters against Void-Drones, and shatter the 3 Reactor Cores of the VOID-CARRIER MOTHERSHIP!',
        guide: {
            objective: 'STEP 1: Fly to all 4 Red Hull Breaches & hold [LMB / E] to Plasma-Weld Seal (4/4). STEP 2: Destroy all 3 Reactor Cores on the Void-Carrier Mothership!',
            tips: [
                'Full 6-DOF EVA Thrusters: [WASD] glide, [SPACE] thrust up, [C / CTRL] thrust down, and [SHIFT] EVA Boost! An automatic Magnetic Tether reels you safely back if you drift past 85m.',
                'Follow the towering 3D Crimson Beacon Pillars or screen-edge radar pointers (`BREACH A • 18m →`) straight to each breach and HOLD [LMB] or [E] to weld it shut!',
                'Shoot glowing Red/Cyan O2 Canisters near Void-Drones for massive cryo-plasma blasts—and when the Void-Carrier arrives, destroy all 3 glowing Reactor Cores!'
            ]
        },
        heroLabel: 'FUN & SPECIALS • ORBITAL EVA DEFENSE', duration: 180,
        stars: [3000, 6200, 10200, 14800],
        standardWeapon: 'acr_68', lockWeapon: true, infiniteMag: true, forgivingMisses: true, customMusic: true,
        blockKeys: ['KeyC', 'ControlLeft', 'ControlRight', 'KeyE'],
        blockFire: (S) => !!(S && S.data && S.data.isWelding),
        weaponLabel: 'ORBITAL ACR 6.8 + PLASMA WELDER [LMB/E] + 6-DOF EVA', weaponNote: 'Hold [LMB/E] at Red Breaches to Weld • [SPACE] Up • [C/CTRL] Down • [SHIFT] EVA Boost',
        keys: [['WASD', 'EVA Thrust'], ['SPACE / C', 'Up / Down Thrust'], ['SHIFT', 'EVA Boost'], ['HOLD LMB / E', 'Plasma-Weld Breach']],
        map: {
            atmosphere: { skyTop: 0x000005, skyBottom: 0x020617, fogColor: 0x020617, fogDensity: 0.0008, sunColor: 0xffffff, sunIntensity: 2.1, sunPos: [85, 65, -45], hemiSky: 0x38bdf8, hemiGround: 0x0f172a, hemiIntensity: 0.85 },
            skybox: 'skybox-space.png',
            boxes: [
                // Exterior Hull Spine + Crosswalk Modules + Elevated Habitation Ring Decks
                B(0, -0.6, 0, 18, 1.2, 46, 'metal'),
                B(0, -0.6, -6, 42, 1.2, 12, 'metal'),
                B(-15, 2.2, -6, 9, 0.8, 10, 'metal'),
                B(15, 2.2, -6, 9, 0.8, 10, 'metal')
            ],
            spawn: { x: 0, y: 0.25, z: 16, yaw: 0 }
        },
        countdown: 3,
        build(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.start('orbital');
            const D = S.data;
            Object.assign(D, {
                o2: 100, breaches: [], drones: [], canisters: [], welds: 0, droneKills: 0,
                spawnCd: 1.5, carrier: null, carrierSpawned: false, carrierDown: false,
                evaVel: V(0, 0, 0), evaFuel: 100, tetherWarnT: 0, isWelding: false, activeWeld: null,
                coresDestroyed: 0, totalCores: 3, weldBeam: null, radarDishes: [], solarWings: []
            });

            // Initialize 6-DOF EVA rideState so movement is silky smooth without gravity stutter
            BO.Player.rideState = { kind: 'minigame', pos: BO.Player.pos.clone(), roll: 0, pitch: 0, eye: 1.62 };

            // 1. Deep-Space Starfield (560 stars) + Colossal Rotating Curved Earth Limb + Atmosphere Halo!
            const starPos = [];
            const rnd = L.mulberry32(2099);
            for (let i = 0; i < 560; i++) {
                const u = rnd() * 2 - 1, th = rnd() * TAU, rad = 190 + rnd() * 80;
                const s = Math.sqrt(1 - u * u);
                starPos.push(rad * s * Math.cos(th), rad * u + 14, rad * s * Math.sin(th));
            }
            const starGeo = new THREE.BufferGeometry();
            starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
            S.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xe0f2fe, size: 0.9 })));

            const earthG = new THREE.Group();
            earthG.position.set(0, -148, -48);
            const earth = new THREE.Mesh(
                new THREE.SphereGeometry(132, 48, 36),
                new THREE.MeshStandardMaterial({ map: earthContinentTex(), roughness: 0.62, metalness: 0.08 })
            );
            const atmoInner = new THREE.Mesh(
                new THREE.SphereGeometry(135.2, 42, 28),
                new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.24, side: THREE.BackSide })
            );
            const atmoOuter = new THREE.Mesh(
                new THREE.SphereGeometry(139.0, 36, 24),
                new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.11, side: THREE.BackSide })
            );
            earthG.add(earth, atmoInner, atmoOuter); S.add(earthG);
            S.animate((dt) => { earth.rotation.y += dt * 0.028; });

            // 2. Detailed PBR Space Station HELIOS-9 Modules, Airlocks, Solar Arrays & Spinning Radar Dishes!
            const pbrHull = A.pbrMat('cyberpunk/Industrial Maintenance/bolted-fan-housing-wall-001.png', 4, 2, { roughness: 0.35, metalness: 0.65 });
            const pbrFloor = A.pbrMat('cyberpunk/Power Floor/blue-cooling-vent-panel-001.png', 6, 12, { roughness: 0.42, metalness: 0.58 });
            const pbrTrim = A.pbrMat('cyberpunk/Power Floor/orange-warning-trim-floor-001.png', 8, 2, { roughness: 0.4, metalness: 0.5 });
            const pbrConduit = A.pbrMat('cyberpunk/Utility Panels/conduit-wall-surface-001.png', 2, 2, { roughness: 0.45, metalness: 0.6 });
            const goldFoil = std(0xf59e0b, 0.22, 0.9), trussMat = std(0x475569, 0.38, 0.82);

            const deckSkin = new THREE.Mesh(new THREE.PlaneGeometry(17.6, 45.4), pbrFloor);
            deckSkin.rotation.x = -Math.PI / 2; deckSkin.position.set(0, 0.03, 0); S.add(deckSkin);
            const wingSkin = new THREE.Mesh(new THREE.PlaneGeometry(41.4, 11.6), pbrTrim);
            wingSkin.rotation.x = -Math.PI / 2; wingSkin.position.set(0, 0.04, -6); S.add(wingSkin);

            for (const [cx, cy, cz, len, r] of [[0, 2.5, -24, 14, 3.8], [0, 2.5, 23, 12, 3.6], [-15, 4.6, -6, 9, 2.4], [15, 4.6, -6, 9, 2.4]]) {
                const mod = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 22), pbrHull);
                mod.rotation.z = Math.PI / 2; mod.position.set(cx, cy, cz); S.add(mod);
                const foilBand = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.08, r + 0.08, len * 0.24, 22), goldFoil);
                foilBand.rotation.z = Math.PI / 2; foilBand.position.set(cx, cy, cz); S.add(foilBand);
                const dockRing = new THREE.Mesh(new THREE.TorusGeometry(r * 0.92, 0.16, 10, 22), pbrConduit);
                dockRing.rotation.y = Math.PI / 2; dockRing.position.set(cx + len * 0.5, cy, cz); S.add(dockRing);
            }

            // Perimeter safety rails & glowing guide strips
            for (const sx of [-8.8, 8.8]) {
                const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 44, 8), goldFoil);
                rail.rotation.x = Math.PI / 2; rail.position.set(sx, 0.92, 0); S.add(rail);
            }

            // 4 Giant Articulated Solar Panel Arrays flanking the station!
            const sMat = new THREE.MeshStandardMaterial({ map: solarArrayTex(), roughness: 0.18, metalness: 0.55, side: THREE.DoubleSide });
            for (const sx of [-28, 28]) {
                const wingG = new THREE.Group();
                wingG.position.set(sx, 2.8, -6);
                const mast = new THREE.Mesh(new THREE.BoxGeometry(14, 0.42, 0.42), trussMat);
                wingG.add(mast);
                for (const sz of [-6.0, 6.0]) {
                    const panel = new THREE.Mesh(new THREE.PlaneGeometry(11.0, 9.2), sMat);
                    panel.rotation.x = Math.PI / 2; panel.position.set(0, 0, sz);
                    wingG.add(panel);
                }
                S.add(wingG);
                D.solarWings.push(wingG);
            }

            // 2 Spinning Orbital Radar Dishes atop the Forward & Aft Habitation Modules!
            for (const [rx, ry, rz] of [[-4.5, 6.8, -24], [4.5, 6.8, -24]]) {
                const rg = new THREE.Group(); rg.position.set(rx, ry, rz);
                const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 2.2, 10), trussMat);
                mast.position.y = -1.0;
                const dish = new THREE.Mesh(new THREE.ConeGeometry(1.75, 0.85, 18, 1, true), std(0xe2e8f0, 0.25, 0.8, { side: THREE.DoubleSide }));
                dish.rotation.x = -Math.PI * 0.65;
                const feed = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), basic(0x22d3ee));
                feed.position.set(0, 0.35, 0.75);
                rg.add(mast, dish, feed); S.add(rg);
                D.radarDishes.push(rg);
            }

            const sign = A.sign('🛰️ HELIOS-9: STEP 1 SEAL 4 HULL BREACHES [LMB/E] • STEP 2 DESTROY CARRIER CORES 🛰️', 15.5, 1.1, { bg: '#082f49', color: '#67e8f9', borderColor: '#38bdf8', size: 0.27, glow: '#38bdf8' });
            sign.position.set(0, 7.6, -22.2); S.add(sign);

            // Chasing Orbital Runway Nav-Bulbs along the HELIOS-9 hull spine!
            const navPts = [];
            for (let z = -20; z <= 18; z += 3.5) { navPts.push(V(-8.8, 1.05, z), V(8.8, 1.05, z)); }
            const navBulbs = A.bulbs(navPts, [0x22d3ee, 0xfacc15, 0xffffff], 0.12);
            S.add(navBulbs); A.animateBulbs(S, navBulbs, 6, 'chase');

            // 3. 4 Active Hull Breach Nodes with Towering 3D Crimson Beacon Pillars & Spinning Chevron Rings!
            const breachSpecs = [
                { id: 'A', pos: [-5.8, 0.08, -14] },
                { id: 'B', pos: [5.8, 0.08, -14] },
                { id: 'C', pos: [-15.0, 2.62, -6] },
                { id: 'D', pos: [15.0, 2.62, -6] }
            ];
            for (const sp of breachSpecs) {
                const [bx, by, bz] = sp.pos;
                const bg = new THREE.Group(); bg.position.set(bx, by, bz);
                const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.48, 0.22, 20), trussMat);
                const coreMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
                const core = new THREE.Mesh(new THREE.CircleGeometry(0.95, 18), coreMat);
                core.rotation.x = -Math.PI / 2; core.position.y = 0.13;

                // Towering 22m holographic crimson beacon pillar visible across the entire station!
                const beamMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide });
                const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.98, 22, 16, 1, true), beamMat);
                pillar.position.y = 11.0;

                // 2 Spinning warning chevron rings around the breach beacon!
                const chev1 = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.11, 6, 4), new THREE.MeshBasicMaterial({ color: 0xf87171 }));
                chev1.rotation.x = Math.PI / 2; chev1.position.y = 2.4;
                const chev2 = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.09, 6, 4), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
                chev2.rotation.x = Math.PI / 2; chev2.position.y = 4.6;

                const lbl = labelSprite(`⚠️ BREACH ${sp.id} • WELD [LMB/E]`, '#f87171', 2.9);
                lbl.position.y = 3.5;

                bg.add(plate, core, pillar, chev1, chev2, lbl);
                S.add(bg);
                D.breaches.push({
                    id: sp.id, pos: V(bx, by, bz), grp: bg, core, coreMat, beamMat, pillar, chev1, chev2, lbl,
                    ruptured: true, progress: 0
                });
            }

            // 4. 6 Explosive Pressurized O2 Canisters placed around the station for AoE chain blasts!
            const canCoords = [[-7.2, 0.7, -4], [7.2, 0.7, -4], [0, 0.7, -18], [-12.5, 3.3, -6], [12.5, 3.3, -6], [0, 0.7, 6]];
            for (const [cx, cy, cz] of canCoords) {
                const cg = new THREE.Group();
                const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.35, 14), std(0xdc2626, 0.3, 0.7));
                const band = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.32, 14), basic(0x22d3ee));
                const cap = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8), std(0xe2e8f0, 0.25, 0.85));
                cap.position.y = 0.68;
                const lbl = labelSprite('💥 O2 TANK', '#67e8f9', 1.6); lbl.position.y = 1.45;
                cg.add(body, band, cap, lbl);
                const tgt = S.addTarget({
                    kind: 'o2_canister', mesh: cg, hitMeshes: [body, band, cap], pos: V(cx, cy, cz),
                    hp: 1, life: 0, points: 150, appear: 'none', death: 'burst', deathColor: 0x38bdf8, bonus: true,
                    onKill: () => {
                        const c = tgt.basePos.clone();
                        BO.FX.spawnExplosion(c, 7.5, 0x38bdf8);
                        SFX.rumble(0.7);
                        for (const d of D.drones.slice()) {
                            if (d.tgt.alive && d.tgt.basePos.distanceTo(c) < 10.5) {
                                d.tgt.hp -= 12;
                                if (d.tgt.hp <= 0) {
                                    S.award(320, d.tgt.basePos.clone(), '💥 O2 CRYO BLAST!', '#67e8f9');
                                    S.kills++; S.bumpCombo();
                                    d.tgt.kill({ pt: c });
                                }
                            }
                        }
                    }
                });
                D.canisters.push(tgt);
            }

            // 5. 3D Plasma Welder Beam Mesh (shown while sealing a breach!)
            const beamGeo = new THREE.CylinderGeometry(0.055, 0.09, 1, 10);
            beamGeo.translate(0, 0.5, 0);
            beamGeo.rotateX(Math.PI / 2);
            D.weldBeam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.92 }));
            D.weldBeam.visible = false;
            S.add(D.weldBeam);
        },
        dispose(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.stop();
        },
        onKey(S, code) {
            if (MG.state !== 'running') return false;
            if (code === 'KeyQ') {
                S.data.evaVel.y = -18;
                tone(320, 90, 0.18, 'square', 0.11);
                MG.toast('🧲 MAG-BOOT ANCHOR SLAM!', '#38bdf8');
                return true;
            }
            return false;
        },
        preUpdate(S, dt, lib, state) {
            const D = S.data, P = BO.Player;
            const rs = P.rideState;
            if (!rs || rs.kind !== 'minigame') return;
            if (state !== 'running') { rs.pos.copy(P.pos); return; }

            const { forward, right } = P.getMoveDirectionVectors();
            const kb = BO.Settings.getKeybinds();
            let ix = 0, iz = 0, iy = 0;
            if (P.keys[kb.forward] || P.keys['KeyW']) iz += 1;
            if (P.keys[kb.back] || P.keys['KeyS']) iz -= 1;
            if (P.keys[kb.right] || P.keys['KeyD']) ix += 1;
            if (P.keys[kb.left] || P.keys['KeyA']) ix -= 1;
            if (P.keys[kb.jump] || P.keys['Space']) iy += 1;
            if (P.keys['KeyC'] || P.keys['ControlLeft'] || P.keys['ControlRight']) iy -= 1;

            const boosting = (P.keys['ShiftLeft'] || P.keys['ShiftRight']) && D.evaFuel > 3 && (ix !== 0 || iz !== 0 || iy !== 0);
            if (boosting) D.evaFuel = Math.max(0, D.evaFuel - 34 * dt);
            else D.evaFuel = Math.min(100, D.evaFuel + 22 * dt);

            const thrust = boosting ? 36 : 21;
            const maxSpd = boosting ? 19 : 11.5;
            const accel = new THREE.Vector3();
            if (iz !== 0) accel.addScaledVector(forward, iz);
            if (ix !== 0) accel.addScaledVector(right, ix);
            accel.y += iy;
            if (accel.lengthSq() > 0) accel.normalize().multiplyScalar(thrust);

            D.evaVel.addScaledVector(accel, dt);
            // Smooth Zero-G stabilization damping so player glides crisply and stops cleanly
            const damp = Math.exp(-3.4 * dt);
            D.evaVel.multiplyScalar(damp);
            if (D.evaVel.length() > maxSpd) D.evaVel.setLength(maxSpd);

            rs.pos.addScaledVector(D.evaVel, dt);

            // Station deck landing / underside freedom & horizontal module collision
            BO.World.resolveHorizontal(rs.pos, P.radius, P.standHeight, true);
            const floorY = BO.World.getGroundHeight(rs.pos.x, rs.pos.z, rs.pos.y);
            if (floorY > -20 && rs.pos.y < floorY && rs.pos.y > floorY - 1.4 && D.evaVel.y <= 0) {
                rs.pos.y = floorY;
                D.evaVel.y = 0;
            }
            rs.pos.y = Math.max(-14, Math.min(34, rs.pos.y));

            // Automatic safe Magnetic Tether pull-back if drifting >85m from station center!
            const center = V(0, 4, -4);
            const distFromStation = rs.pos.distanceTo(center);
            if (distFromStation > 85) {
                const pullDir = center.clone().sub(rs.pos).normalize();
                D.evaVel.addScaledVector(pullDir, 55 * dt);
                rs.pos.addScaledVector(pullDir, 22 * dt);
                if (D.tetherWarnT <= 0) {
                    D.tetherWarnT = 2.0;
                    MG.toast('🧲 MAGNETIC TETHER ENGAGED — REELING BACK TO STATION!', '#38bdf8');
                    tone(520, 780, 0.22, 'sine', 0.10);
                }
            }
            D.tetherWarnT = Math.max(0, D.tetherWarnT - dt);
            rs.roll = lerp(rs.roll || 0, -ix * 0.045, dt * 8);
        },
        _spawnDrone(S) {
            const D = S.data;
            if (D.drones.length >= 8) return;
            const built = buildVoidDrone();
            const a = Math.random() * TAU, r = 20 + Math.random() * 10;
            const pos = V(Math.cos(a) * r, 3.5 + Math.random() * 7, Math.sin(a) * r - 6);
            const tgt = S.addTarget({
                kind: 'void_drone', mesh: built.root, hitMeshes: built.hit, pos,
                hp: 3, life: 0, points: 250, appear: 'scale', death: 'burst', deathColor: 0x22d3ee,
                onKill: () => {
                    D.droneKills++;
                    D.drones = D.drones.filter((d) => d.tgt !== tgt);
                }
            });
            D.drones.push({ tgt, built, phase: Math.random() * 6, fireCd: 2.0 + Math.random() });
        },
        _spawnCarrierBoss(S) {
            const D = S.data;
            if (D.carrierSpawned) return;
            D.carrierSpawned = true;
            const hull = buildVoidCarrierHull();
            hull.root.position.set(0, 14, -38);
            S.add(hull.root);

            const coreOffsets = [
                { name: 'PORT CORE', off: V(-8.0, -0.5, 1.5) },
                { name: 'DORSAL CORE', off: V(0, 2.2, 4.2) },
                { name: 'STARBOARD CORE', off: V(8.0, -0.5, 1.5) }
            ];
            const cores = [];
            for (const co of coreOffsets) {
                const cg = new THREE.Group();
                const orb = new THREE.Mesh(new THREE.SphereGeometry(1.35, 18, 14), basic(0xf43f5e));
                orb.userData.hitbox = 'head';
                const ring = new THREE.Mesh(new THREE.TorusGeometry(1.95, 0.16, 8, 24), basic(0xfef08a));
                const beacon = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.4, 0.7, 16, 12, 1, true),
                    new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide })
                );
                beacon.position.y = 8.0;
                const lbl = labelSprite(`☢️ ${co.name}`, '#fda4af', 2.4);
                lbl.position.y = 2.6;
                cg.add(orb, ring, beacon, lbl);
                const maxHp = 20;
                const tgt = S.addTarget({
                    kind: 'carrier_core', mesh: cg, hitMeshes: [orb], pos: hull.root.position.clone().add(co.off),
                    hp: maxHp, life: 0, points: 1400, appear: 'scale', death: 'burst', deathColor: 0xf43f5e,
                    onKill: () => {
                        D.coresDestroyed++;
                        BO.FX.spawnExplosion(tgt.basePos.clone(), 6.8, 0xf43f5e);
                        SFX.rumble(0.75);
                        MG.toast(`💥 ${co.name} DESTROYED (${D.coresDestroyed} / 3)!`, '#fde047');
                        if (D.coresDestroyed >= D.totalCores && !D.carrierDown) {
                            D.carrierDown = true;
                            BO.FX.spawnExplosion(hull.root.position.clone(), 12.0, 0x22d3ee);
                            hull.root.visible = false;
                            SFX.fanfare();
                            MG.finish('🛰️ VOID-CARRIER REACTOR CORES DESTROYED — HELIOS-9 SAVED!', { color: '#67e8f9', delay: 2.2 });
                        }
                    }
                });
                cores.push({ name: co.name, off: co.off, tgt, ring, maxHp });
            }
            D.carrier = { hull, pos: V(0, 13.5, -34), phase: 0, fireCd: 1.8, cores };
            if (BO.MinigameAudio) BO.MinigameAudio.kaijuRoar();
            SFX.rumble(0.95);
            MG.toast('🚨 STEP 2: VOID-CARRIER ARRIVED — DESTROY ALL 3 REACTOR CORES!', '#f43f5e');
        },
        update(S, dt, lib, state) {
            if (state !== 'running') return;
            if (BO.MinigameAudio) BO.MinigameAudio.tick(dt);
            const D = S.data, P = BO.Player, cam = BO.App.worldCamera;

            for (const sw of D.solarWings) sw.rotation.x = Math.sin(S.t * 0.35) * 0.25;
            for (const rd of D.radarDishes) rd.rotation.y += dt * 1.4;

            // Animate Breach Beacon Pillars + Handle Plasma-Welding ([LMB] or [E])
            let openBreaches = 0;
            let weldingTarget = null;
            const fwd = new THREE.Vector3();
            if (cam) cam.getWorldDirection(fwd);

            for (const br of D.breaches) {
                if (br.ruptured) {
                    openBreaches++;
                    br.chev1.rotation.z += dt * 2.8;
                    br.chev2.rotation.z -= dt * 3.6;
                    const pulse = 0.20 + Math.sin(S.t * 6) * 0.08;
                    br.beamMat.opacity = pulse;
                    if (Math.random() < dt * 10) BO.FX.spawnParticles(br.pos.clone().add(V(0, 0.35, 0)), 2, 0xe0f2fe, 2.2, 5.2, 0.38, 0.7);

                    const dist = P.pos.distanceTo(br.pos);
                    if (dist < 5.2 && !weldingTarget) {
                        const toBr = br.pos.clone().sub(cam ? cam.position : P.pos).normalize();
                        const holdingE = !!P.keys['KeyE'];
                        const holdingLMB = !!P.triggerHeld && toBr.dot(fwd) > 0.68;
                        if (holdingE || holdingLMB) weldingTarget = br;
                    }
                }
            }

            D.isWelding = !!weldingTarget;
            D.activeWeld = weldingTarget;
            if (weldingTarget) {
                weldingTarget.progress = Math.min(1, weldingTarget.progress + dt * 0.72);
                // Show 3D Plasma Welder Beam + orange sparks shower!
                if (D.weldBeam && cam) {
                    const start = cam.position.clone().addScaledVector(fwd, 0.45).add(V(0, -0.22, 0));
                    const end = weldingTarget.pos.clone().add(V(0, 0.2, 0));
                    const len = start.distanceTo(end);
                    D.weldBeam.visible = true;
                    D.weldBeam.position.copy(start);
                    D.weldBeam.lookAt(end);
                    D.weldBeam.scale.set(1, 1, Math.max(0.1, len));
                    D.weldBeam.material.color.setHex(Math.random() < 0.5 ? 0x38bdf8 : 0xf97316);
                }
                if (Math.random() < dt * 38) {
                    BO.FX.spawnParticles(weldingTarget.pos.clone().add(V(0, 0.25, 0)), 3, Math.random() < 0.6 ? 0xf97316 : 0xfef08a, 5.5, 3.5, 0.28, 0.8);
                }
                if (Math.floor((weldingTarget.progress - dt * 0.72) * 8) !== Math.floor(weldingTarget.progress * 8)) {
                    tone(420 + weldingTarget.progress * 520, 620 + weldingTarget.progress * 620, 0.08, 'sawtooth', 0.06);
                }
                if (weldingTarget.progress >= 1) {
                    weldingTarget.ruptured = false;
                    weldingTarget.coreMat.setHex(0x22c55e);
                    weldingTarget.beamMat.color.setHex(0x22c55e);
                    weldingTarget.beamMat.opacity = 0.08;
                    weldingTarget.pillar.scale.set(0.35, 0.22, 0.35);
                    weldingTarget.chev1.visible = false;
                    weldingTarget.chev2.visible = false;
                    weldingTarget.lbl.visible = false;
                    D.welds++;
                    D.o2 = Math.min(100, D.o2 + 20);
                    BO.FX.spawnParticles(weldingTarget.pos.clone().add(V(0, 0.5, 0)), 34, 0x4ade80, 7, 3, 0.55, 1.1);
                    if (BO.MinigameAudio) BO.MinigameAudio.plasmaWeld(); else tone(480, 1180, 0.26, 'triangle', 0.14);
                    SFX.star(2);
                    S.award(500, weldingTarget.pos.clone().add(V(0, 1.6, 0)), `🔧 BREACH ${weldingTarget.id} SEALED (+20% O2)!`, '#4ade80');
                    if (D.welds >= 4 && !D.carrierSpawned) this._spawnCarrierBoss(S);
                }
            } else {
                if (D.weldBeam) D.weldBeam.visible = false;
                for (const br of D.breaches) if (br.ruptured) br.progress = Math.max(0, br.progress - dt * 0.35);
            }

            // Station O2 drains only while breaches remain unsealed!
            D.o2 = Math.max(0, D.o2 - openBreaches * 0.85 * dt);

            // Safety escalation: if player hasn't triggered Step 2 by 75s, summon Carrier anyway
            if (!D.carrierSpawned && S.t >= 75) this._spawnCarrierBoss(S);

            // Spawn Void-Drones
            D.spawnCd -= dt;
            if (D.spawnCd <= 0) { D.spawnCd = D.carrierSpawned ? 3.2 : 2.6; this._spawnDrone(S); }

            for (const d of D.drones) {
                if (!d.tgt.alive) continue;
                d.phase += dt * 2.2;
                d.built.gyroRing.rotation.z += dt * 4.5;
                d.built.gyroRing.rotation.x = Math.PI / 2 + Math.sin(d.phase) * 0.4;
                const goalY = 2.8 + Math.sin(d.phase * 1.4) * 1.8;
                const dx = P.pos.x - d.tgt.basePos.x, dz = P.pos.z - d.tgt.basePos.z;
                const dist = Math.max(0.1, Math.hypot(dx, dz));
                if (dist > 8.5) {
                    d.tgt.basePos.x += (dx / dist) * 4.2 * dt;
                    d.tgt.basePos.z += (dz / dist) * 4.2 * dt;
                }
                d.tgt.basePos.y = lerp(d.tgt.basePos.y, goalY, dt * 2);
                d.tgt.root.position.copy(d.tgt.basePos);
                d.tgt.root.lookAt(P.pos.x, P.pos.y + 1.2, P.pos.z);

                d.fireCd -= dt;
                if (d.fireCd <= 0) {
                    d.fireCd = 2.6;
                    BO.FX.spawnTracer(d.tgt.basePos.clone(), P.pos.clone().add(V(0, 1.1, 0)), 0x22d3ee, 0.08, 0.14);
                    P.takeDamage(6, d.tgt.basePos, true);
                }
            }

            // Update Multi-Core Void-Carrier Mothership!
            if (D.carrier && !D.carrierDown) {
                const cr = D.carrier;
                cr.phase += dt * 0.9;
                cr.pos.x = Math.sin(cr.phase) * 14;
                cr.pos.y = 12.5 + Math.cos(cr.phase * 1.3) * 1.8;
                cr.pos.z = lerp(cr.pos.z, -24, dt * 0.6);
                cr.hull.root.position.copy(cr.pos);
                cr.hull.root.lookAt(0, 6, 8);
                cr.hull.haloRing.rotation.z += dt * 1.5;

                const q = cr.hull.root.quaternion;
                for (const c of cr.cores) {
                    if (!c.tgt.alive) continue;
                    c.ring.rotation.y += dt * 3.5;
                    c.ring.rotation.x += dt * 2.2;
                    c.tgt.basePos.copy(c.off).applyQuaternion(q).add(cr.pos);
                    c.tgt.root.position.copy(c.tgt.basePos);
                }

                cr.fireCd -= dt;
                if (cr.fireCd <= 0) {
                    cr.fireCd = 1.7;
                    BO.FX.spawnTracer(cr.pos.clone(), P.pos.clone().add(V(0, 1.1, 0)), 0xf43f5e, 0.12, 0.18);
                    P.takeDamage(10, cr.pos, true);
                }
            }

            if (D.o2 <= 0) MG.finish('STATION HELIOS-9 DECOMPRESSED (0% O2)', { color: '#f87171' });
            else if (!P.alive) MG.finish('LOST IN ORBITAL EVA', { color: '#f87171' });
        },
        hud(S) {
            const D = S.data, P = BO.Player, cam = BO.App && BO.App.worldCamera;
            const step1Done = D.welds >= 4;
            const coresLeft = D.totalCores - D.coresDestroyed;

            // Crystal-clear 2-Step Objective Banner
            const objBanner = `<div style="width:100%;max-width:640px;padding:7px 14px;border-radius:10px;background:rgba(6,10,22,0.92);border:2px solid ${step1Done ? '#f43f5e' : '#38bdf8'};box-shadow:0 0 22px rgba(6,182,212,0.28);text-align:center;">
                <div style="font:900 12px var(--font-ui);letter-spacing:1.4px;color:${step1Done ? '#4ade80' : '#fde047'};">${step1Done ? '✅' : '▶'} STEP 1: FLY TO RED HULL BREACHES & HOLD [LMB / E] TO WELD SEAL (${D.welds} / 4)</div>
                <div style="font:900 12px var(--font-ui);letter-spacing:1.4px;margin-top:3px;color:${step1Done ? '#fda4af' : 'rgba(203,213,225,0.48)'};">${step1Done ? '▶' : '⏳'} STEP 2: DESTROY THE VOID-CARRIER REACTOR CORES (${D.coresDestroyed} / 3)</div>
            </div>`;

            // Live Circular Weld Progress Ring when sealing a breach or prompt when near one!
            let weldOverlay = '';
            if (D.activeWeld) {
                const pct = Math.round(D.activeWeld.progress * 100);
                const deg = Math.round(D.activeWeld.progress * 360);
                weldOverlay = `<div style="position:fixed;left:50%;top:62%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;z-index:36;">
                    <div style="width:74px;height:74px;border-radius:50%;background:conic-gradient(#22d3ee ${deg}deg, rgba(15,23,42,0.8) 0);display:grid;place-items:center;box-shadow:0 0 24px rgba(34,211,238,0.65);">
                        <div style="width:56px;height:56px;border-radius:50%;background:#060a16;display:grid;place-items:center;font:900 16px var(--font-mono);color:#67e8f9;">${pct}%</div>
                    </div>
                    <div style="padding:3px 10px;border-radius:999px;background:rgba(6,10,22,0.9);border:1px solid #38bdf8;font:900 11px var(--font-ui);letter-spacing:1.4px;color:#fde047;">🔥 SEALING BREACH ${D.activeWeld.id}... ${pct}%</div>
                </div>`;
            } else {
                for (const br of D.breaches) {
                    if (br.ruptured && P.pos.distanceTo(br.pos) < 5.2) {
                        weldOverlay = `<div style="position:fixed;left:50%;top:62%;transform:translate(-50%,-50%);padding:6px 14px;border-radius:999px;background:rgba(6,10,22,0.92);border:2px solid #fde047;font:900 12px var(--font-ui);letter-spacing:1.4px;color:#fde047;box-shadow:0 0 18px rgba(250,204,21,0.45);z-index:36;">🔧 HOLD [LMB] OR [E] TO WELD BREACH ${br.id} (+20% O2)</div>`;
                        break;
                    }
                }
            }

            // Directional HUD Screen-Edge / Radar Pointers with live metre distances
            let pointers = '';
            if (cam) {
                for (const br of D.breaches) {
                    if (br.ruptured) pointers += projectEdgePointer(cam, br.pos.clone().add(V(0, 1.5, 0)), `BREACH ${br.id}`, '#f87171');
                }
                if (D.carrier && !D.carrierDown) {
                    for (const c of D.carrier.cores) {
                        if (c.tgt.alive) pointers += projectEdgePointer(cam, c.tgt.basePos, c.name, '#fb7185');
                    }
                }
            }

            // Carrier multi-core HP bar
            let bossBar = '';
            if (D.carrier && !D.carrierDown) {
                const hpSum = D.carrier.cores.reduce((acc, c) => acc + (c.tgt.alive ? c.tgt.hp : 0), 0);
                const maxSum = D.carrier.cores.reduce((acc, c) => acc + c.maxHp, 0);
                bossBar = `<div class="fun-panel" style="margin-top:4px;"><div class="fun-bar-wrap"><div class="fun-bar-lbl"><span>🛸 VOID-CARRIER REACTOR CORES (${coresLeft} LEFT)</span><b>${Math.max(0, Math.round(hpSum))} / ${maxSum}</b></div><div class="fun-bar"><i style="width:${Math.max(0, Math.round(hpSum / maxSum * 100))}%;background:linear-gradient(90deg,#06b6d4,#f43f5e)"></i></div></div></div>`;
            }

            return `${objBanner}
            <div class="fun-panel">
                <div class="mgx-chip ${D.o2 < 35 ? 'mgx-hot' : ''}">🫧 O2 <b>${Math.ceil(D.o2)}%</b></div>
                <div class="mgx-chip">🚀 EVA FUEL <b>${Math.round(D.evaFuel)}%</b></div>
                <div class="mgx-chip">🔧 SEALED <b>${D.welds}/4</b></div>
                <div class="mgx-chip">👾 DRONES <b>${D.droneKills}</b></div>
            </div>
            ${bossBar}${weldOverlay}${pointers}`;
        },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return {
                score: S.score, stars,
                title: D.carrierDown ? 'COMMANDER OF ORBITAL STATION HELIOS-9' : 'EVA SHIFT COMPLETE',
                stats: [['HULL BREACHES WELDED', D.welds + ' / 4'], ['CARRIER CORES DESTROYED', D.coresDestroyed + ' / 3'], ['STATION O2 REMAINING', Math.ceil(D.o2) + '%']],
                xp: Math.round(190 + S.score * 0.032 + stars * 160)
            };
        }
    });
})(window);
