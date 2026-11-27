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
            const sand = new THREE.Mesh(new THREE.CircleGeometry(R + 0.8, 56), new THREE.MeshStandardMaterial({ map: sandTex, roughness: 0.95 }));
            sand.rotation.x = -Math.PI / 2; sand.position.y = 0.02; sand.receiveShadow = true; S.add(sand);

            const wallMat = std(0xa8a29e, 0.88), archDark = std(0x57534e, 0.92), crimson = std(0x991b1b, 0.75), gold = std(0xfacc15, 0.25, 0.88);
            const wall = new THREE.Mesh(new THREE.CylinderGeometry(R + 1.2, R + 1.2, 5.8, 56, 1, true), new THREE.MeshStandardMaterial({ color: 0xa8a29e, roughness: 0.9, side: THREE.BackSide }));
            wall.position.y = 2.9; S.add(wall); S.solid(wall);
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
       Low-Gravity EVA Spacewalk outside Station HELIOS-9 above a Rotating
       3D Earth + EVA Jetpack [SPACE / C] + Mag-Boot Slam [Q] + Plasma-Weld
       4 Decompressing Hull Breaches [E] + Void-Carrier Boss!
    ===================================================================== */
    function earthContinentTex() {
        return L.canvasTex('orbital-earth-v1', 512, 256, (g, w, h) => {
            const ocean = g.createLinearGradient(0, 0, 0, h);
            ocean.addColorStop(0, '#0c4a6e');
            ocean.addColorStop(0.5, '#0284c7');
            ocean.addColorStop(1, '#082f49');
            g.fillStyle = ocean; g.fillRect(0, 0, w, h);
            const rnd = L.mulberry32(402);
            g.fillStyle = '#15803d';
            for (let i = 0; i < 28; i++) {
                g.beginPath();
                g.ellipse(rnd() * w, 35 + rnd() * (h - 70), 18 + rnd() * 48, 12 + rnd() * 28, rnd() * 2, 0, TAU);
                g.fill();
            }
            g.fillStyle = 'rgba(255,255,255,0.38)';
            for (let c = 0; c < 34; c++) {
                g.beginPath();
                g.ellipse(rnd() * w, rnd() * h, 24 + rnd() * 55, 5 + rnd() * 10, 0.2, 0, TAU);
                g.fill();
            }
        });
    }

    function solarArrayTex() {
        return L.canvasTex('helios-solar-v1', 128, 256, (g, w, h) => {
            g.fillStyle = '#1e3a8a'; g.fillRect(0, 0, w, h);
            g.strokeStyle = '#60a5fa'; g.lineWidth = 2;
            for (let y = 0; y <= h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
            for (let x = 0; x <= w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
            g.strokeStyle = '#facc15'; g.lineWidth = 4;
            g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke();
        });
    }

    function buildVoidDrone(isCarrier) {
        const sc = isCarrier ? 2.5 : 1.0;
        const root = new THREE.Group();
        const hit = [];
        const chitin = std(0x311042, 0.28, 0.78);
        const neon = basic(isCarrier ? 0xf43f5e : 0x22d3ee);

        const hull = new THREE.Mesh(new THREE.SphereGeometry(0.65 * sc, 18, 14), chitin);
        hull.scale.set(1.2, 0.75, 1.35);
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.28 * sc, 12, 10), neon);
        eye.position.set(0, 0.05 * sc, 0.72 * sc);
        eye.userData.hitbox = 'head';
        const gyroRing = new THREE.Mesh(new THREE.TorusGeometry(0.95 * sc, 0.07 * sc, 8, 24), std(0x94a3b8, 0.22, 0.9));
        gyroRing.rotation.x = Math.PI / 2;

        root.add(hull, eye, gyroRing);
        hit.push(hull, eye);
        for (const sx of [-1, 1]) {
            const pincer = new THREE.Mesh(new THREE.ConeGeometry(0.16 * sc, 0.95 * sc, 8), chitin);
            pincer.rotation.x = Math.PI / 2; pincer.position.set(sx * 0.72 * sc, -0.1 * sc, 0.65 * sc);
            root.add(pincer); hit.push(pincer);
        }
        return { root, hit, gyroRing };
    }

    MG.register({
        id: 'fun_orbital_breach', cat: 'fun', order: 17,
        name: 'Zero-G Orbital Hull Breach', icon: '🛰️', accent: '#06b6d4', badge: 'ZERO-G EVA',
        tagline: 'Float in Zero-G above rotating Earth, plasma-weld 4 hull breaches & repel Alien Void-Drones!',
        desc: 'Step out of the airlock onto the exterior hull of Orbital Station HELIOS-9, 400km above a rotating sunlit Earth! Micro-meteoroids and Boarding Alien Void-Drones have ruptured 4 Hull Bulkheads—oxygen is venting into space! Glide in low-gravity EVA using [SPACE] Thruster Boost & [Q] Mag-Boot Anchor Slam, press [E] at sparking Hull Breaches to Plasma-Weld them shut, and destroy the colossal VOID-CARRIER MOTHERSHIP!',
        guide: {
            objective: 'Keep Station Oxygen above 0% by Plasma-Welding sparking Hull Breaches [E] while eliminating Void-Drones and the Void-Carrier Mothership!',
            tips: [
                'In Zero-G EVA, holding [SPACE] fires upward RCS thrusters for huge orbital leaps across modules, while [Q] slams your Mag-Boots straight down onto the hull deck!',
                'Each unsealed Hull Breach drains Station O2—float up to any red sparking rupture and press [E] to seal it (+18% O2 + +500 pts)!',
                'Aim for the glowing cyan/crimson central Photoreceptor Eye on Void-Drones and the Void-Carrier for 1.5x critical damage!'
            ]
        },
        heroLabel: 'FUN & SPECIALS • ORBITAL EVA DEFENSE', duration: 165,
        stars: [2800, 5600, 9200, 13400],
        standardWeapon: 'acr_68', lockWeapon: true, infiniteMag: true, forgivingMisses: true, customMusic: true,
        weaponLabel: 'ORBITAL ACR 6.8 + EVA THRUSTERS + WELDER [E]', weaponNote: 'Hold [SPACE] EVA Thrust • [Q] Mag-Boot Slam • [E] Plasma-Weld Hull Breach',
        keys: [['WASD', 'EVA Glide'], ['HOLD SPACE', 'RCS Jetpack Up'], ['Q', 'Mag-Boot Slam'], ['E', 'Weld Hull Breach'], ['LMB', 'Fire Orbital Rifle']],
        map: {
            atmosphere: { skyTop: 0x000005, skyBottom: 0x020617, fogColor: 0x020617, fogDensity: 0.0012, sunColor: 0xffffff, sunIntensity: 2.0, sunPos: [80, 60, -40], hemiSky: 0x38bdf8, hemiGround: 0x0f172a, hemiIntensity: 0.75 },
            boxes: [
                // Exterior Hull Spine + Crosswalk Modules + Elevated Habitation Ring Decks
                B(0, -0.6, 0, 18, 1.2, 44, 'metal'),
                B(0, -0.6, -6, 40, 1.2, 12, 'metal'),
                B(-15, 2.2, -6, 9, 0.8, 10, 'metal'),
                B(15, 2.2, -6, 9, 0.8, 10, 'metal')
            ],
            spawn: { x: 0, y: 0.2, z: 16, yaw: 0 }
        },
        countdown: 3,
        build(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.start('orbital');
            const D = S.data;
            Object.assign(D, {
                o2: 100, breaches: [], drones: [], welds: 0, droneKills: 0,
                spawnCd: 1.5, ruptureCd: 11.0, carrier: null, carrierSpawned: false, carrierDown: false
            });

            // 1. Deep-Space Starfield (450 stars) + Colossal Rotating 3D Planet Earth + Atmosphere Halo below!
            const starPos = [];
            const rnd = L.mulberry32(2099);
            for (let i = 0; i < 450; i++) {
                const u = rnd() * 2 - 1, th = rnd() * TAU, rad = 180 + rnd() * 60;
                const s = Math.sqrt(1 - u * u);
                starPos.push(rad * s * Math.cos(th), Math.abs(rad * u) + 8, rad * s * Math.sin(th));
            }
            const starGeo = new THREE.BufferGeometry();
            starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
            S.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.85 })));

            const earthG = new THREE.Group();
            earthG.position.set(0, -96, -75);
            const earth = new THREE.Mesh(new THREE.SphereGeometry(78, 40, 28), new THREE.MeshStandardMaterial({ map: earthContinentTex(), roughness: 0.65, metalness: 0.1 }));
            const atmo = new THREE.Mesh(new THREE.SphereGeometry(80.2, 36, 24), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.18, side: THREE.BackSide }));
            earthG.add(earth, atmo); S.add(earthG);
            S.animate((dt) => { earth.rotation.y += dt * 0.045; });

            // 2. Sculpted Orbital Station HELIOS-9 Hull Plating, Pressurized Habitation Cylinders, Airlock & Giant Rotating Solar Wings!
            const hullWhite = std(0xe2e8f0, 0.32, 0.55), goldFoil = std(0xf59e0b, 0.25, 0.88), trussMat = std(0x475569, 0.4, 0.8);
            for (const [cx, cz, rotZ] of [[0, -24, Math.PI / 2], [0, 22, Math.PI / 2]]) {
                const mod = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, 12, 20), hullWhite);
                mod.rotation.z = rotZ; mod.position.set(cx, 2.2, cz); S.add(mod);
                const foilBand = new THREE.Mesh(new THREE.CylinderGeometry(3.88, 3.88, 2.4, 20), goldFoil);
                foilBand.rotation.z = rotZ; foilBand.position.set(cx, 2.2, cz); S.add(foilBand);
            }
            // Low perimeter handrails along hull deck
            for (const sx of [-8.8, 8.8]) {
                const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 42, 8), goldFoil);
                rail.rotation.x = Math.PI / 2; rail.position.set(sx, 0.9, 0); S.add(rail);
            }

            // 4 Giant Articulated Solar Panel Arrays flanking the station!
            const sMat = new THREE.MeshStandardMaterial({ map: solarArrayTex(), roughness: 0.2, metalness: 0.5, side: THREE.DoubleSide });
            D.solarWings = [];
            for (const sx of [-26, 26]) {
                const wingG = new THREE.Group();
                wingG.position.set(sx, 2.4, -6);
                const mast = new THREE.Mesh(new THREE.BoxGeometry(12, 0.35, 0.35), trussMat);
                wingG.add(mast);
                for (const sz of [-5.5, 5.5]) {
                    const panel = new THREE.Mesh(new THREE.PlaneGeometry(9.5, 8.5), sMat);
                    panel.rotation.x = Math.PI / 2; panel.position.set(0, 0, sz);
                    wingG.add(panel);
                }
                S.add(wingG);
                D.solarWings.push(wingG);
            }
            const sign = A.sign('🛰️ ORBITAL STATION HELIOS-9 — WELD HULL BREACHES [E]! 🛰️', 11.5, 1.0, { bg: '#082f49', color: '#67e8f9', borderColor: '#38bdf8', size: 0.32, glow: '#38bdf8' });
            sign.position.set(0, 6.8, -22.5); S.add(sign);
            // Chasing Orbital Runway Nav-Bulbs along the HELIOS-9 hull spine!
            const navPts = [];
            for (let z = -20; z <= 18; z += 3.5) { navPts.push(V(-8.8, 1.02, z), V(8.8, 1.02, z)); }
            const navBulbs = A.bulbs(navPts, [0x22d3ee, 0xfacc15, 0xffffff], 0.11);
            S.add(navBulbs); A.animateBulbs(S, navBulbs, 6, 'chase');

            // 4 Hull Breach Bulkhead Nodes (2 start ruptured so player has immediate EVA action!)
            const breachCoords = [[-5.5, 0.1, -14], [5.5, 0.1, -14], [-14.5, 2.65, -6], [14.5, 2.65, -6]];
            breachCoords.forEach(([bx, by, bz], idx) => {
                const bg = new THREE.Group(); bg.position.set(bx, by, bz);
                const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 0.18, 18), trussMat);
                const core = new THREE.Mesh(new THREE.CircleGeometry(0.85, 16), basic(0xef4444));
                core.rotation.x = -Math.PI / 2; core.position.y = 0.11;
                const lbl = labelSprite('⚠️ BREACH — WELD [E]', '#f87171', 2.4);
                lbl.position.y = 1.6;
                bg.add(plate, core, lbl); S.add(bg);
                const ruptured = idx < 2;
                core.material.color.setHex(ruptured ? 0xef4444 : 0x22c55e);
                lbl.visible = ruptured;
                D.breaches.push({ pos: V(bx, by, bz), core, lbl, ruptured });
            });

            D.onKey = (e) => {
                if (MG.session !== S || MG.state !== 'running') return;
                if (e.code === 'KeyE') this._weldBreach(S);
                else if (e.code === 'KeyQ') {
                    BO.Player.vel.y = -18;
                    tone(320, 90, 0.18, 'square', 0.11);
                    MG.toast('🧲 MAG-BOOT ANCHOR SLAM!', '#38bdf8');
                }
            };
            window.addEventListener('keydown', D.onKey);
        },
        dispose(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.stop();
            if (S.data.onKey) window.removeEventListener('keydown', S.data.onKey);
        },
        _weldBreach(S) {
            const D = S.data, P = BO.Player;
            for (const br of D.breaches) {
                if (br.ruptured && P.pos.distanceTo(br.pos) < 3.4) {
                    br.ruptured = false;
                    br.core.material.color.setHex(0x22c55e);
                    br.lbl.visible = false;
                    D.welds++;
                    D.o2 = Math.min(100, D.o2 + 18);
                    BO.FX.spawnParticles(br.pos.clone().add(V(0, 0.4, 0)), 22, 0x38bdf8, 5, 3, 0.45, 0.9);
                    if (BO.MinigameAudio) BO.MinigameAudio.plasmaWeld(); else tone(480, 1120, 0.24, 'triangle', 0.12);
                    S.award(500, br.pos.clone().add(V(0, 1.4, 0)), '🔧 HULL SEALED (+18% O2)!', '#67e8f9');
                    return;
                }
            }
        },
        _spawnDrone(S, isCarrier = false) {
            const D = S.data;
            if (!isCarrier && D.drones.length >= 8) return;
            const built = buildVoidDrone(isCarrier);
            const a = Math.random() * TAU, r = isCarrier ? 26 : 20 + Math.random() * 8;
            const pos = V(Math.cos(a) * r, isCarrier ? 9.5 : 4 + Math.random() * 6, Math.sin(a) * r - 4);
            const maxHp = isCarrier ? 52 : 3;
            const tgt = S.addTarget({
                kind: isCarrier ? 'void_carrier' : 'void_drone', mesh: built.root, hitMeshes: built.hit, pos,
                hp: maxHp, life: 0, points: isCarrier ? 2800 : 240, appear: 'scale', death: 'burst',
                deathColor: isCarrier ? 0xf43f5e : 0x22d3ee,
                onKill: () => {
                    D.droneKills++;
                    D.drones = D.drones.filter((d) => d.tgt !== tgt);
                    if (isCarrier) {
                        D.carrierDown = true;
                        BO.FX.spawnExplosion(tgt.basePos.clone(), 8.5, 0xf43f5e);
                        SFX.fanfare();
                        MG.finish('🛰️ VOID-CARRIER DESTROYED — STATION HELIOS-9 SAVED!', { color: '#67e8f9', delay: 2.0 });
                    }
                }
            });
            const obj = { tgt, built, isCarrier, maxHp, phase: Math.random() * 6, fireCd: 2.0 + Math.random() };
            D.drones.push(obj);
            if (isCarrier) {
                D.carrier = obj;
                MG.toast('🚨 ORBITAL ALERT: ALIEN VOID-CARRIER MOTHERSHIP DE-CLOAKING!', '#f43f5e');
            }
        },
        update(S, dt, lib, state) {
            if (state !== 'running') return;
            if (BO.MinigameAudio) BO.MinigameAudio.tick(dt);
            const D = S.data, P = BO.Player;

            // Authentic Low-Gravity EVA Physics + Hold [SPACE] RCS Jetpack Thrust + Tether Safety Recovery!
            if (!P.onGround) P.vel.y += 12.2 * dt; // Counteract ~65% of Earth gravity for true lunar/orbital float!
            if (P.keys['Space']) {
                P.vel.y = Math.min(9.5, P.vel.y + 22 * dt);
                P.onGround = false;
            }
            if (P.pos.y < -8) {
                P.pos.set(0, 2.5, 0); P.vel.set(0, 0, 0);
                MG.toast('🪝 EVA SAFETY TETHER RETRACTED TO HULL!', '#38bdf8');
            }

            for (const sw of D.solarWings) sw.rotation.x = Math.sin(S.t * 0.35) * 0.25;

            // Active Hull Breaches vent white O2 plumes & drain Station Oxygen!
            let openBreaches = 0;
            for (const br of D.breaches) {
                if (br.ruptured) {
                    openBreaches++;
                    if (Math.random() < dt * 12) BO.FX.spawnParticles(br.pos.clone().add(V(0, 0.3, 0)), 2, 0xe0f2fe, 2.2, 5.5, 0.4, 0.7);
                }
            }
            D.o2 = Math.max(0, D.o2 - openBreaches * 1.35 * dt);

            D.ruptureCd -= dt;
            if (D.ruptureCd <= 0) {
                D.ruptureCd = 12.5;
                const intact = D.breaches.filter((b) => !b.ruptured);
                if (intact.length) {
                    const pick = intact[Math.floor(Math.random() * intact.length)];
                    pick.ruptured = true; pick.core.material.color.setHex(0xef4444); pick.lbl.visible = true;
                    BO.FX.spawnExplosion(pick.pos.clone(), 2.2, 0xf97316);
                    MG.toast('⚠️ MICRO-METEOROID HULL RUPTURE — WELD WITH [E]!', '#fca5a5');
                }
            }

            // Spawn Void-Drones & summon Void-Carrier Mothership after 14 drone kills or 65s!
            if (!D.carrierSpawned && (D.droneKills >= 14 || S.t >= 65)) {
                D.carrierSpawned = true;
                this._spawnDrone(S, true);
            }
            D.spawnCd -= dt;
            if (D.spawnCd <= 0) { D.spawnCd = 2.6; this._spawnDrone(S, false); }

            for (const d of D.drones) {
                if (!d.tgt.alive) continue;
                d.phase += dt * 2.2;
                d.built.gyroRing.rotation.z += dt * 4.5;
                d.built.gyroRing.rotation.x = Math.PI / 2 + Math.sin(d.phase) * 0.4;
                const goalY = d.isCarrier ? 8.5 + Math.sin(d.phase) * 1.5 : 2.8 + Math.sin(d.phase * 1.4) * 1.8;
                const dx = P.pos.x - d.tgt.basePos.x, dz = P.pos.z - d.tgt.basePos.z;
                const dist = Math.max(0.1, Math.hypot(dx, dz));
                if (dist > (d.isCarrier ? 16 : 7.5)) {
                    d.tgt.basePos.x += (dx / dist) * (d.isCarrier ? 2.5 : 4.2) * dt;
                    d.tgt.basePos.z += (dz / dist) * (d.isCarrier ? 2.5 : 4.2) * dt;
                }
                d.tgt.basePos.y = lerp(d.tgt.basePos.y, goalY, dt * 2);
                d.tgt.root.position.copy(d.tgt.basePos);
                d.tgt.root.lookAt(P.pos.x, P.pos.y + 1.2, P.pos.z);

                d.fireCd -= dt;
                if (d.fireCd <= 0) {
                    d.fireCd = d.isCarrier ? 1.6 : 2.6;
                    BO.FX.spawnTracer(d.tgt.basePos.clone(), P.pos.clone().add(V(0, 1.1, 0)), d.isCarrier ? 0xf43f5e : 0x22d3ee, 0.08, 0.14);
                    P.takeDamage(d.isCarrier ? 11 : 6, d.tgt.basePos, true);
                }
            }

            if (BO.HUD && BO.HUD.showPrompt) {
                for (const br of D.breaches) {
                    if (br.ruptured && P.pos.distanceTo(br.pos) < 3.4) {
                        BO.HUD.showPrompt('🔧 [E] PLASMA-WELD HULL BREACH (+18% O2)');
                        break;
                    }
                }
            }

            if (D.o2 <= 0) MG.finish('STATION HELIOS-9 DECOMPRESSED (0% O2)', { color: '#f87171' });
            else if (!P.alive) MG.finish('LOST IN ORBITAL EVA', { color: '#f87171' });
        },
        hud(S) {
            const D = S.data, openB = D.breaches.filter((b) => b.ruptured).length;
            const c = D.carrier && D.carrier.tgt.alive ? D.carrier : null;
            return `<div class="fun-panel">
                <div class="mgx-chip ${D.o2 < 35 ? 'mgx-hot' : ''}">🫧 STATION O2 <b>${Math.ceil(D.o2)}%</b></div>
                <div class="mgx-chip ${openB > 0 ? 'mgx-hot' : ''}">⚠️ OPEN BREACHES <b>${openB}</b></div>
                <div class="mgx-chip">WELDS <b>${D.welds}</b></div>
                <div class="mgx-chip">VOID-DRONES <b>${D.droneKills}</b></div>
            </div>
            ${c ? `<div class="fun-panel" style="margin-top:5px;"><div class="fun-bar-wrap"><div class="fun-bar-lbl"><span>🛸 VOID-CARRIER MOTHERSHIP</span><b>${Math.max(0, Math.round(c.tgt.hp))} / ${c.maxHp}</b></div><div class="fun-bar"><i style="width:${Math.max(0, Math.round(c.tgt.hp / c.maxHp * 100))}%;background:linear-gradient(90deg,#06b6d4,#f43f5e)"></i></div></div></div>` : ''}`;
        },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return {
                score: S.score, stars,
                title: D.carrierDown ? 'COMMANDER OF ORBITAL STATION HELIOS-9' : 'EVA SHIFT COMPLETE',
                stats: [['HULL BREACHES WELDED', D.welds], ['VOID-DRONES DESTROYED', D.droneKills], ['STATION O2 REMAINING', Math.ceil(D.o2) + '%']],
                xp: Math.round(185 + S.score * 0.032 + stars * 155)
            };
        }
    });
})(window);
