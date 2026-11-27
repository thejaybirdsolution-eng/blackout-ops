/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Arcade Hall (part 4)
     12. Starfall Shield — meteors split when shot; protect the city below
     13. Fishing Hole    — fish can only be hit mid-leap; shooting water scares them
     14. Paint Wars      — paint the wall your colour before the rival drone does
     15. Safe Cracker    — fire when the dial's notch lines up with the marker
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const L = BO.MinigameLib;
    const A = BO.MinigameArt;
    const AK = BO.MGArcadeKit;
    const { SFX, std, basic, clamp01, TAU } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const ARC = { cat: 'arcade', infiniteMag: true, forgivingMisses: true, lockWeapon: true, oneTargetPerShot: true, customMusic: true, dispose() { if (BO.MinigameAudio) BO.MinigameAudio.stop(); } };
    const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));

    /* =====================================================================
       12. STARFALL SHIELD
    ===================================================================== */
    const MET = { L: { r: 1.5, pts: 50, dmg: 16, next: 'M' }, M: { r: 0.95, pts: 80, dmg: 10, next: 'S' }, S: { r: 0.55, pts: 120, dmg: 6, next: null } };
    MG.register(Object.assign({}, ARC, {
        id: 'starfall_shield', order: 12, name: 'Starfall Shield', icon: '☄️', accent: '#f97316',
        tagline: 'Every meteor you shoot breaks in two.',
        desc: 'Meteors are falling on the city in the valley below. A big meteor splits into two medium ones when shot, a medium one into two small ones, and only small ones are destroyed outright. Anything that lands damages the city. Keep it standing for 60 seconds.',
        heroLabel: 'ARCADE HALL • DEFENCE • 60 SECONDS', duration: 60, stars: [3000, 7000, 12000, 17000],
        standardWeapon: 'g36c_tac', weaponLabel: 'G36C', weaponNote: 'Bottomless magazine',
        keys: [['LMB', 'Shoot meteors'], ['R', 'Retry from results']],
        map: AK.map({ skybox: 'skybox-space.png', skyTop: 0x020617, skyBottom: 0x7c2d12, fogColor: 0x431407, fogDensity: 0.004, sunColor: 0xfdba74, sunIntensity: 0.7 }),
        build(S) {
            AK.hall(S, { title: 'STARFALL SHIELD', accent: '#f97316', ground: 0x292524, music: 'tactical' });
            const city = [];
            for (let i = 0; i < 14; i++) {
                const h = 4 + (i * 37 % 9);
                const b = A.building(3.2, h, 3.2, [0x334155, 0x475569, 0x1e293b][i % 3], i + 5, 0.55, true);
                b.position.set(-22 + i * 3.4, h / 2 - 6, -38 - (i % 3) * 2);
                S.add(b);
                A.placeGLB(S.scene, i % 2 === 0 ? 'city_industrial_kit/building-a.glb' : 'city_industrial_kit/building-d.glb', {
                    pos: [-22 + i * 3.4, -6, -38 - (i % 3) * 2],
                    fitSize: [3.4, h + 1.2, 3.4],
                    hideFallback: b
                });
                city.push(b);
            }
            A.placeGLB(S.scene, 'city_industrial_kit/water-tower.glb', { pos: [-26, -6, -34], scale: 2.5 });
            A.placeGLB(S.scene, 'city_industrial_kit/detail-tank.glb', { pos: [26, -6, -34], scale: 2.5 });
            const valley = new THREE.Mesh(new THREE.PlaneGeometry(80, 30), std(0x1c1917, 1));
            valley.rotation.x = -Math.PI / 2; valley.position.set(0, -6, -40); S.add(valley);
            // Shimmering Planetary Energy Shield Dome & Twin Anti-Meteor Laser Dishes!
            const dome = new THREE.Mesh(new THREE.SphereGeometry(24, 32, 16, 0, TAU, 0, Math.PI * 0.5), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.10, wireframe: true }));
            dome.position.set(0, -6, -38); S.add(dome);
            for (const dx of [-18, 18]) {
                const dish = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.9, 14), std(0x94a3b8, 0.3, 0.8));
                dish.position.set(dx, -4.5, -32); dish.rotation.x = -0.6; S.add(dish);
            }
            Object.assign(S.data, { city, dome, cityHp: 100, spawnT: 0.8, splits: 0, smashed: 0, landed: 0 });
        },
        _meteor(S, size, pos, vel) {
            const M = MET[size];
            const g = new THREE.Group();
            const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(M.r, 1), new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.85, emissive: 0xea580c, emissiveIntensity: 0.55, flatShading: true }));
            const magmaRing = new THREE.Mesh(new THREE.TorusGeometry(M.r * 1.08, M.r * 0.09, 6, 18), basic(0xfde047));
            magmaRing.userData.noHit = true;
            const glow = new THREE.Mesh(new THREE.SphereGeometry(M.r * 1.38, 12, 10), new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.24, depthWrite: false }));
            glow.userData.noHit = true;
            g.add(rock, magmaRing, glow);
            const tg = S.addTarget({ mesh: g, hitMeshes: [rock], pos, life: 0, appear: 'scale', inT: 0.1, death: 'burst', deathColor: 0xf97316, bonus: true });
            tg.vel = vel; tg.size = size; tg.body = g;
            tg.onTick = (t, dt) => {
                if (!t.alive || MG.state !== 'running') return;
                t.root.position.addScaledVector(t.vel, dt);
                t.body.rotation.x += dt * 1.5; t.body.rotation.y += dt;
                if (Math.random() < 0.4) BO.FX.spawnParticles(t.root.position, 1, 0xfb923c, 1, 0, 0.4, M.r);
                if (t.root.position.y < -4) {
                    const D = S.data;
                    D.landed++;
                    D.cityHp = Math.max(0, D.cityHp - M.dmg);
                    BO.FX.spawnExplosion(t.root.position.clone(), M.r * 3, 0xf97316);
                    SFX.rumble(0.35);
                    S.breakCombo('CITY HIT');
                    t.remove();
                    if (D.cityHp <= 0) MG.finish('THE CITY FELL', { color: '#f87171' });
                }
            };
            return tg;
        },
        update(S, dt, lib, state) {
            const D = S.data;
            if (state !== 'running') return;
            D.spawnT -= dt;
            if (D.spawnT <= 0) {
                D.spawnT = Math.max(0.9, 2.4 - S.t * 0.025);
                const x = (Math.random() - 0.5) * 36, z = -26 - Math.random() * 8;
                const tx = (Math.random() - 0.5) * 40;
                this._meteor(S, Math.random() < 0.7 ? 'L' : 'M', V(x, 28, z), V((tx - x) / 9, -3.6 - S.t * 0.03, -0.6));
            }
        },
        onHit(S, ent, info) {
            if (!ent.alive || !ent.size) return false;
            const D = S.data, M = MET[ent.size];
            S.hits++; S.kills++;
            ent.kill(info);
            S.bumpCombo();
            S.award(M.pts * S.comboMult, info.pt, M.next ? 'SPLIT' : 'SMASHED', '#fdba74');
            SFX.shatter();
            if (M.next) {
                D.splits++;
                const p = ent.root.position.clone();
                for (const s of [-1, 1]) this._meteor(S, M.next, p.clone().add(V(s * M.r * 0.8, 0, 0)), V(ent.vel.x + s * 2.6, ent.vel.y * 0.9 + 1.5, ent.vel.z));
            } else D.smashed++;
            return true;
        },
        hud(S) { const D = S.data; return `<div class="ah3-panel"><div class="sr-chip ${D.cityHp < 35 ? 'bad' : ''}">CITY <span class="sr-bar"><i style="width:${D.cityHp}%;background:${D.cityHp > 50 ? '#22c55e' : D.cityHp > 25 ? '#f59e0b' : '#ef4444'}"></i></span><b>${D.cityHp}</b></div>${AK.chip('SPLITS', D.splits)}${AK.chip('SMASHED', D.smashed)}</div>`; },
        result(S) {
            const D = S.data;
            const bonus = D.cityHp > 0 ? D.cityHp * 30 : 0;
            S.score += bonus;
            const stars = this.stars.filter((th) => S.score >= th).length;
            return { score: S.score, stars, title: D.cityHp <= 0 ? 'THE CITY FELL' : D.cityHp >= 80 ? 'GUARDIAN OF THE VALLEY' : 'CITY SAVED', stats: [['CITY LEFT', D.cityHp + '%'], ['CITY BONUS', bonus], ['SPLITS', D.splits], ['SMASHED', D.smashed], ['LANDED', D.landed], ['BEST STREAK', S.maxCombo]], xp: Math.round(120 + S.score * 0.04 + stars * 120) };
        }
    }));

    /* =====================================================================
       13. FISHING HOLE — Alpine Trout Lagoon, Cascade Waterfall, Wooden Dock,
           Chum Feeder Bell, 5 Sculpted Catch Species & Leviathan Trophy!
    ===================================================================== */
    const POND = { x: 0, z: -13.5, r: 9.2 };

    function fishScaleTex(c1, c2, stripeCol) {
        return L.canvasTex('fish-sc:' + c1 + ':' + c2, 128, 64, (g, w, h) => {
            const gr = g.createLinearGradient(0, 0, 0, h);
            gr.addColorStop(0, c1);
            gr.addColorStop(0.65, c2);
            gr.addColorStop(1, '#f8fafc');
            g.fillStyle = gr; g.fillRect(0, 0, w, h);
            if (stripeCol) {
                g.fillStyle = stripeCol;
                g.fillRect(0, h * 0.42, w, 7);
            }
            g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 1.5;
            for (let x = 8; x < w; x += 12) {
                for (let y = 8; y < h; y += 12) {
                    g.beginPath(); g.arc(x, y, 6, -Math.PI * 0.4, Math.PI * 0.4); g.stroke();
                }
            }
        });
    }

    function buildCatchMesh(kind) {
        const g = new THREE.Group();
        const hit = [];

        if (kind === 'boot') {
            // Soggy stitched leather boot with laces & rubber sole
            const leather = std(0x44403c, 0.85), soleM = std(0x1c1917, 0.95), brass = std(0xd97706, 0.4, 0.7);
            const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.56, 12), leather);
            shaft.position.y = 0.16; shaft.rotation.x = -0.12;
            const vamp = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.34, 6, 10), leather);
            vamp.rotation.x = Math.PI / 2; vamp.position.set(0, -0.12, 0.16);
            const sole = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.66), soleM);
            sole.position.set(0, -0.26, 0.14);
            const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 6, 14), brass);
            cuff.rotation.x = Math.PI / 2; cuff.position.y = 0.43;
            g.add(shaft, vamp, sole, cuff);
            hit.push(shaft, vamp, sole);
            return { g, hit, tailPivot: null };
        }

        if (kind === 'puffer') {
            // Spiky Sea-Mine Pufferfish (HAZARD — do not shoot!)
            const bodyMat = std(0xa855f7, 0.45, 0.1, { emissive: 0x581c87, emissiveIntensity: 0.35 });
            const belly = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 12), bodyMat);
            const spikeMat = basic(0xfde047);
            for (let i = 0; i < 14; i++) {
                const phi = Math.acos(1 - 2 * (i + 0.5) / 14);
                const theta = Math.PI * (1 + Math.sqrt(5)) * i;
                const sp = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.24, 6), spikeMat);
                sp.position.set(Math.sin(phi) * Math.cos(theta) * 0.48, Math.cos(phi) * 0.48, Math.sin(phi) * Math.sin(theta) * 0.48);
                sp.lookAt(sp.position.clone().multiplyScalar(2));
                sp.rotateX(Math.PI / 2);
                sp.userData.noHit = true;
                g.add(sp);
            }
            for (const sx of [-0.18, 0.18]) {
                const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), basic(0xef4444));
                eye.position.set(sx, 0.12, 0.40);
                g.add(eye);
            }
            g.add(belly);
            hit.push(belly);
            return { g, hit, tailPivot: null };
        }

        // Sculpted Anatomical Fish: Trout, Bass, Golden Koi, or Trophy Leviathan!
        const cfg = kind === 'leviathan'
            ? { sc: 1.85, tex: fishScaleTex('#0f172a', '#0284c7', '#38bdf8'), fin: 0x38bdf8, metal: 0.45, em: 0x0369a1 }
            : kind === 'gold'
                ? { sc: 1.22, tex: fishScaleTex('#f59e0b', '#fde047', '#ef4444'), fin: 0xfef08a, metal: 0.82, em: 0xa16207 }
                : kind === 'trout'
                    ? { sc: 1.0, tex: fishScaleTex('#065f46', '#34d399', '#f472b6'), fin: 0x6ee7b7, metal: 0.25, em: 0x000000 }
                    : { sc: 1.08, tex: fishScaleTex('#1e3a8a', '#60a5fa', '#fde047'), fin: 0x93c5fd, metal: 0.25, em: 0x000000 };

        const sc = cfg.sc;
        const bodyMat = new THREE.MeshStandardMaterial({ map: cfg.tex, roughness: 0.22, metalness: cfg.metal, emissive: cfg.em, emissiveIntensity: cfg.em ? 0.35 : 0 });
        const finMat = new THREE.MeshStandardMaterial({ color: cfg.fin, roughness: 0.35, metalness: 0.2, side: THREE.DoubleSide });

        const torso = new THREE.Mesh(new THREE.SphereGeometry(0.38 * sc, 18, 14), bodyMat);
        torso.scale.set(0.52, 0.78, 1.55);
        const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.16 * sc, 0.36 * sc, 5), finMat);
        dorsal.scale.set(0.25, 1, 1.4); dorsal.position.set(0, 0.34 * sc, -0.05 * sc); dorsal.rotation.x = -0.35;
        g.add(torso, dorsal);
        hit.push(torso);

        // Pectoral side fins + glossy eyes with white glint
        for (const s of [-1, 1]) {
            const pec = new THREE.Mesh(new THREE.ConeGeometry(0.11 * sc, 0.28 * sc, 4), finMat);
            pec.position.set(s * 0.20 * sc, -0.08 * sc, 0.14 * sc);
            pec.rotation.set(0.4, 0, s * 1.15);
            pec.userData.noHit = true;
            const eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.058 * sc, 8, 6), basic(0xffffff));
            eyeW.position.set(s * 0.15 * sc, 0.08 * sc, 0.42 * sc);
            const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.032 * sc, 6, 6), basic(0x090d16));
            pupil.position.set(s * 0.175 * sc, 0.08 * sc, 0.44 * sc);
            g.add(pec, eyeW, pupil);
        }

        // Articulated Forked Tail Fin Pivot (wags realistically mid-leap!)
        const tailPivot = new THREE.Group();
        tailPivot.position.set(0, 0, -0.54 * sc);
        const upperFluke = new THREE.Mesh(new THREE.ConeGeometry(0.18 * sc, 0.42 * sc, 4), finMat);
        upperFluke.scale.set(0.22, 1, 1); upperFluke.position.set(0, 0.12 * sc, -0.16 * sc); upperFluke.rotation.x = -Math.PI * 0.62;
        const lowerFluke = upperFluke.clone();
        lowerFluke.position.y = -0.12 * sc; lowerFluke.rotation.x = -Math.PI * 0.38;
        tailPivot.add(upperFluke, lowerFluke);
        g.add(tailPivot);
        hit.push(upperFluke, lowerFluke);

        if (kind === 'leviathan') {
            const crown = new THREE.Mesh(new THREE.TorusGeometry(0.16 * sc, 0.035 * sc, 6, 14), basic(0xfacc15));
            crown.rotation.x = Math.PI / 2; crown.position.set(0, 0.34 * sc, 0.26 * sc);
            g.add(crown);
        }
        return { g, hit, tailPivot };
    }

    MG.register(Object.assign({}, ARC, {
        id: 'fishing_hole', order: 13, name: 'Fishing Hole', icon: '🎣', accent: '#0ea5e9',
        tagline: 'Alpine Trout Lagoon! Ring the Chum Bell for a Feeding Frenzy & bag the Trophy Leviathan!',
        desc: 'Cast lead over a crystal Alpine Trout Lagoon fed by a roaring stone waterfall! Rainbow Trout, Largemouth Bass, gleaming 500-pt Golden Koi, and 2-HP Trophy Leviathans arc out of the shimmering water—you can ONLY score them mid-leap! Shoot the hanging Brass Chum Feeder Bell above the dock (12s cooldown) to scatter fish pellets and trigger a massive 5-fish FEEDING FRENZY! Spare soggy Old Boots and spiky Purple Puffer-Mines, and don\'t splash the water or nearby fish dive!',
        guide: {
            objective: 'Shoot leaping Trout, Bass, Golden Koi, and 2-HP Trophy Leviathans mid-air while avoiding water splashes, soggy Boots, and spiky Purple Puffer-Mines!',
            tips: [
                'Shoot the golden 🔔 CHUM BELL hanging on the wooden pier post (every 12s) to drop bait and launch 5 fish into the air at once!',
                'Watch for expanding white SURFACE RIPPLE RINGS—they telegraph exactly where a fish is about to breach 0.55s beforehand!',
                'Trophy Leviathans are giant armored blue-silver monsters that take 2 shots in a single leap for a massive +900 bonus!'
            ]
        },
        heroLabel: 'ARCADE HALL • ALPINE LAGOON ANGLER • 60 SECONDS', duration: 60, stars: [2600, 5800, 9600, 14200],
        standardWeapon: 'five_seven', weaponLabel: 'FIVE-SEVEN ANGLER', weaponNote: 'Shoot 🔔 Chum Bell for Feeding Frenzy • Avoid Water, Boots & Spiky Puffers!',
        keys: [['LMB', 'Snipe Leaping Fish / Ring Chum Bell'], ['R', 'Retry from results']],
        map: AK.map({ skyTop: 0x0369a1, skyBottom: 0xbae6fd, fogColor: 0x7dd3fc, fogDensity: 0.005, sunIntensity: 1.65 }),
        build(S) {
            AK.hall(S, { title: 'FISHING HOLE • ALPINE LAGOON', accent: '#0ea5e9', ground: 0x365314, music: 'range' });

            // Shimmering Procedural Lagoon Water + Cobblestone Bank + Cattail Reeds + Lotus Flowers
            const waterTex = L.canvasTex('lagoon-water-v2', 256, 256, (g, w, h) => {
                const rad = g.createRadialGradient(w / 2, h / 2, 16, w / 2, h / 2, w / 2);
                rad.addColorStop(0, '#0284c7');
                rad.addColorStop(0.7, '#0369a1');
                rad.addColorStop(1, '#082f49');
                g.fillStyle = rad; g.fillRect(0, 0, w, h);
                g.strokeStyle = 'rgba(186,230,253,0.28)'; g.lineWidth = 2;
                for (let r = 28; r < 120; r += 26) { g.beginPath(); g.arc(w / 2, h / 2, r, 0, TAU); g.stroke(); }
            });
            const water = new THREE.Mesh(new THREE.CircleGeometry(POND.r, 56), new THREE.MeshStandardMaterial({ map: waterTex, roughness: 0.06, metalness: 0.38, transparent: true, opacity: 0.90 }));
            water.rotation.x = -Math.PI / 2; water.position.set(POND.x, 0.06, POND.z);
            S.add(water);

            // Natural mossy boulder ring around the lagoon shore
            for (let i = 0; i < 28; i++) {
                const a = (i / 28) * TAU;
                const rk = A.rock(0.65 + (i % 3) * 0.22, i % 2 ? 0x57534e : 0x44403c);
                rk.position.set(POND.x + Math.cos(a) * (POND.r + 0.25), 0.18, POND.z + Math.sin(a) * (POND.r + 0.25));
                S.add(rk);
            }

            // Back Stone Cliff & Animated Foaming Waterfall feeding the lagoon (z = -23)
            const cliffG = new THREE.Group();
            cliffG.position.set(0, 0, POND.z - POND.r - 1.2);
            for (const [cx, cy, cz, sc] of [[0, 2.6, 0, 3.6], [-3.2, 2.0, 0.6, 2.8], [3.2, 2.1, 0.5, 2.9], [-5.5, 1.3, 1.4, 2.1], [5.5, 1.4, 1.4, 2.1]]) {
                const cr = A.rock(sc, 0x44403c); cr.position.set(cx, cy, cz); cliffG.add(cr);
            }
            const fallTex = L.canvasTex('waterfall-foam', 64, 128, (g, w, h) => {
                g.fillStyle = '#38bdf8'; g.fillRect(0, 0, w, h);
                g.fillStyle = 'rgba(255,255,255,0.65)';
                for (let i = 0; i < 22; i++) g.fillRect((i * 19) % w, (i * 23) % h, 6, 22);
            });
            fallTex.wrapS = fallTex.wrapT = THREE.RepeatWrapping;
            const waterfall = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 5.2), new THREE.MeshBasicMaterial({ map: fallTex, transparent: true, opacity: 0.88 }));
            waterfall.position.set(0, 2.6, 1.65); waterfall.rotation.x = -0.18;
            cliffG.add(waterfall);
            S.add(cliffG);
            S.animate((dt) => {
                fallTex.offset.y += dt * 1.8;
                if (Math.random() < dt * 14) BO.FX.spawnParticles(V(0, 0.25, POND.z - POND.r + 0.6), 2, 0xe0f2fe, 2.0, 1.8, 0.35, 0.65);
            });

            // Cattail Reeds, Lily Pads with Pink Lotus Blossoms & Perimeter Pines
            const stemM = std(0x15803d, 0.8), cattailM = std(0x451a03, 0.9);
            for (let i = 0; i < 14; i++) {
                const a = 0.35 + (i / 14) * (TAU - 0.7);
                if (Math.sin(a) > 0.72) continue; // keep front view open
                const rx = POND.x + Math.cos(a) * (POND.r - 0.35), rz = POND.z + Math.sin(a) * (POND.r - 0.35);
                for (let k = 0; k < 3; k++) {
                    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.35 + k * 0.2, 6), stemM);
                    st.position.set(rx + (k - 1) * 0.18, 0.68, rz);
                    const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.22, 4, 8), cattailM);
                    head.position.set(rx + (k - 1) * 0.18, 1.25 + k * 0.15, rz);
                    S.add(st); S.add(head);
                }
            }
            for (let l = 0; l < 8; l++) {
                const a = (l / 8) * TAU + 0.3, r = 2.4 + (l % 3) * 2.1;
                const lx = POND.x + Math.cos(a) * r, lz = POND.z + Math.sin(a) * r;
                const pad = new THREE.Mesh(new THREE.CircleGeometry(0.62, 16, 0.25, TAU - 0.5), std(0x16a34a, 0.7));
                pad.rotation.x = -Math.PI / 2; pad.position.set(lx, 0.085, lz); S.add(pad);
                if (l % 2 === 0) {
                    const lotus = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.16, 7), std(0xf472b6, 0.5));
                    lotus.rotation.x = Math.PI; lotus.position.set(lx, 0.16, lz); S.add(lotus);
                }
            }
            for (let i = 0; i < 10; i++) {
                const t = A.tree(1.2 + (i % 3) * 0.35);
                const a = i / 10 * TAU;
                if (Math.sin(a) > 0.65) continue;
                t.position.set(POND.x + Math.cos(a) * (POND.r + 4.2), 0, POND.z + Math.sin(a) * (POND.r + 4.2));
                S.add(t);
            }

            // Timber Angler Pier jutting into the right side of the Lagoon + Shootable Brass Chum Feeder Bell!
            const dockG = new THREE.Group();
            dockG.position.set(5.8, 0, -6.8); dockG.rotation.y = 0.38;
            const woodM = std(0x78350f, 0.82), darkWood = std(0x451a03, 0.88);
            const deck = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.18, 5.2), woodM);
            deck.position.set(0, 0.55, -1.8); dockG.add(deck);
            for (const [px, pz] of [[-0.95, 0.4], [0.95, 0.4], [-0.95, -4.0], [0.95, -4.0]]) {
                const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.4, 10), darkWood);
                piling.position.set(px, 0.55, pz); dockG.add(piling);
            }
            // Lantern + Tackle Box on the pier
            S.add(A.torch(S, V(4.4, 0.55, -10.2), 0xfde047, false));
            S.add(dockG);

            // Shootable Brass Chum Feeder Bell hanging over the water at (-5.6, 2.55, -8.8)!
            const chumPost = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 3.2, 10), darkWood);
            chumPost.position.set(-6.4, 1.6, -8.8);
            const chumArm = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.12), darkWood);
            chumArm.position.set(-5.75, 3.05, -8.8);
            S.add(chumPost); S.add(chumArm);

            const bellGrp = new THREE.Group();
            const bellDome = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.36, 0.48, 16), std(0xfacc15, 0.22, 0.88, { emissive: 0xa16207, emissiveIntensity: 0.35 }));
            const bellRim = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.045, 8, 18), basic(0xfef08a));
            bellRim.rotation.x = Math.PI / 2; bellRim.position.y = -0.22;
            const bellSign = A.sign('🔔 SHOOT: CHUM FRENZY', 2.3, 0.42, { bg: '#0c4a6e', color: '#fde047', borderColor: '#38bdf8', size: 0.16 });
            bellSign.position.set(0, 0.62, 0);
            bellGrp.add(bellDome, bellRim, bellSign);
            const chumTarget = S.addTarget({
                mesh: bellGrp, hitMeshes: [bellDome], pos: V(-5.15, 2.55, -8.8),
                hp: 999999, life: 0, points: 0, appear: 'none', bonus: true,
                onDamage: () => this._ringChumBell(S)
            });

            const waterEnt = { alive: true, isWater: true };
            water.userData.entity = waterEnt; water.userData.hitbox = 'torso';

            const shadows = [];
            for (let i = 0; i < 9; i++) {
                const sh = new THREE.Mesh(new THREE.CircleGeometry(0.48, 12), new THREE.MeshBasicMaterial({ color: 0x041e30, transparent: true, opacity: 0.58, depthWrite: false }));
                sh.rotation.x = -Math.PI / 2; sh.scale.set(0.55, 1.65, 1);
                S.add(sh);
                shadows.push({ m: sh, a: Math.random() * TAU, r: 1.4 + Math.random() * (POND.r - 2.6), w: (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.45), scared: 0 });
            }
            Object.assign(S.data, {
                water, shadows, chumTarget, chumCd: 0, ripples: [], pendingLeaps: [],
                jumpT: 0.65, caught: 0, gold: 0, leviathans: 0, boots: 0, splashes: 0
            });
        },
        _ringChumBell(S) {
            const D = S.data;
            if (D.chumCd > 0) {
                MG.popup(V(-5.15, 3.1, -8.8), `CHUM RELOADING (${D.chumCd.toFixed(1)}s)`, '#94a3b8');
                return;
            }
            D.chumCd = 12.0;
            D.chumTarget.pivot.rotation.z = 0.45;
            SFX.tone(1180, 1560, 0.22, 'triangle', 0.14);
            SFX.tone(1560, 2080, 0.26, 'triangle', 0.12, 0.08);
            BO.FX.spawnParticles(V(POND.x, 1.2, POND.z), 28, 0xfde047, 7.5, 4, 0.65, 0.8);
            MG.toast('🔔 CHUM BELL RUNG — 5-FISH FEEDING FRENZY!', '#fde047');
            // Clear any scared fish & queue 5 immediate staggered breaches including guaranteed Gold or Leviathan!
            for (const sh of D.shadows) sh.scared = 0;
            for (let k = 0; k < 5; k++) {
                const forcedKind = k === 4 ? 'leviathan' : k === 2 ? 'gold' : (k % 2 ? 'trout' : 'bass');
                this._queueFishBreach(S, D.shadows[k % D.shadows.length].m.position.clone(), forcedKind, 0.18 + k * 0.16);
            }
        },
        _queueFishBreach(S, fromPos, forcedKind, delay = 0.52) {
            const D = S.data;
            const r = Math.random();
            const kind = forcedKind || (r < 0.08 ? 'leviathan' : r < 0.19 ? 'gold' : r < 0.28 ? 'boot' : r < 0.36 ? 'puffer' : r < 0.68 ? 'trout' : 'bass');
            const ringCol = kind === 'gold' ? 0xfde047 : kind === 'leviathan' ? 0x38bdf8 : kind === 'puffer' ? 0xc084fc : 0xe0f2fe;
            const ring = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.30, 24), new THREE.MeshBasicMaterial({ color: ringCol, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
            ring.rotation.x = -Math.PI / 2;
            ring.position.set(fromPos.x, 0.09, fromPos.z);
            S.add(ring);
            D.pendingLeaps.push({ from: fromPos, kind, tLeft: delay, maxT: delay, ring });
        },
        _launchFish(S, from, kind) {
            const ang = Math.random() * TAU, dist = 2.4 + Math.random() * 2.8;
            const to = from.clone().add(V(Math.cos(ang) * dist, 0, Math.sin(ang) * dist));
            const toR = Math.hypot(to.x - POND.x, to.z - POND.z);
            if (toR > POND.r - 1.0) to.set(POND.x + (to.x - POND.x) / toR * (POND.r - 1.1), 0, POND.z + (to.z - POND.z) / toR * (POND.r - 1.1));
            const dur = kind === 'gold' ? 1.05 : kind === 'leviathan' ? 1.55 : 1.2 + Math.random() * 0.45;
            const peak = kind === 'leviathan' ? 3.8 : 2.5 + Math.random() * 1.6;
            const built = buildCatchMesh(kind);
            const hp = kind === 'leviathan' ? 2 : 1;
            const tg = S.addTarget({
                mesh: built.g, hitMeshes: built.hit, pos: from.clone(), hp, life: 0,
                appear: 'none', inT: 0.01, death: 'fall',
                deathColor: kind === 'gold' ? 0xfacc15 : kind === 'leviathan' ? 0x38bdf8 : kind === 'puffer' ? 0xa855f7 : 0x7dd3fc,
                bonus: true,
                onDamage: (t, info) => {
                    BO.FX.spawnParticles(info.pt, 10, 0x38bdf8, 4, 4, 0.35, 0.9);
                    MG.popup(info.pt, 'LEVIATHAN HIT (1 MORE!)', '#38bdf8');
                }
            });
            tg.kind = kind;
            let tt = 0;
            tg.onTick = (t, dt2) => {
                if (!t.alive) return;
                tt += dt2;
                const k = tt / dur;
                if (k >= 1) {
                    BO.FX.spawnParticles(to.clone().add(V(0, 0.12, 0)), 10, 0xbae6fd, 2.8, 6, 0.35, 0.85);
                    t.remove();
                    return;
                }
                t.root.position.lerpVectors(from, to, k);
                t.root.position.y = Math.sin(k * Math.PI) * peak - 0.15;
                t.root.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
                t.pivot.rotation.x = (k - 0.5) * 2.1;
                if (built.tailPivot) built.tailPivot.rotation.y = Math.sin(tt * 26) * 0.42;
                if (Math.random() < dt2 * 10) BO.FX.spawnParticles(t.root.position, 1, 0xe0f2fe, 0.8, 1.2, 0.25, 0.45);
            };
            BO.FX.spawnParticles(from.clone().add(V(0, 0.12, 0)), 10, 0xbae6fd, 2.8, 6, 0.35, 0.85);
            SFX.noise(0.15, 1400, 'bandpass', 0.6, 0.12);
        },
        extraTargets(S, pool) { if (S.data.water) pool.push(S.data.water); },
        update(S, dt, lib, state) {
            const D = S.data;
            D.chumCd = Math.max(0, D.chumCd - dt);
            if (D.chumTarget) {
                D.chumTarget.pivot.rotation.z *= Math.pow(0.04, dt);
                D.chumTarget.mesh && (D.chumTarget.pivot.scale.setScalar(D.chumCd <= 0 ? 1 + Math.sin(S.t * 6) * 0.06 : 0.92));
            }
            for (const s of D.shadows) {
                s.scared = Math.max(0, s.scared - dt);
                s.a += s.w * dt * (s.scared > 0 ? 3.2 : 1);
                s.m.position.set(POND.x + Math.cos(s.a) * s.r, 0.08, POND.z + Math.sin(s.a) * s.r);
                s.m.rotation.z = -s.a;
                s.m.material.opacity = s.scared > 0 ? 0.14 : 0.58;
            }
            if (state !== 'running') return;

            // Advance expanding surface telegraph ripples -> launch fish when ring completes!
            for (let i = D.pendingLeaps.length - 1; i >= 0; i--) {
                const pl = D.pendingLeaps[i];
                pl.tLeft -= dt;
                const p = 1 - Math.max(0, pl.tLeft / pl.maxT);
                pl.ring.scale.setScalar(1 + p * 3.6);
                pl.ring.material.opacity = 0.85 * (1 - p * 0.7);
                if (pl.tLeft <= 0) {
                    S.scene.remove(pl.ring);
                    D.pendingLeaps.splice(i, 1);
                    this._launchFish(S, pl.from, pl.kind);
                }
            }

            D.jumpT -= dt;
            if (D.jumpT <= 0) {
                D.jumpT = Math.max(0.42, 1.18 - S.t * 0.011) * (0.75 + Math.random() * 0.5);
                const ready = D.shadows.filter((s) => s.scared <= 0);
                if (!ready.length) return;
                const s = ready[Math.floor(Math.random() * ready.length)];
                this._queueFishBreach(S, s.m.position.clone(), null, 0.50);
            }
        },
        onHit(S, ent, info) {
            const D = S.data;
            if (ent.isWater) {
                D.splashes++;
                for (const s of D.shadows) if (s.m.position.distanceTo(info.pt) < 4.2) s.scared = 3.2;
                BO.FX.spawnParticles(info.pt, 14, 0xbae6fd, 3.2, 8, 0.4, 0.9);
                S.breakCombo('WATER SPLASH');
                MG.popup(info.pt, 'SPLASH! FISH SPOOKED', '#7dd3fc');
                return false;
            }
            if (!ent.alive || !ent.kind) return false;
            S.hits++;
            if (ent.hp > 1) {
                ent.hp--;
                if (ent.onDamage) ent.onDamage(ent, info);
                SFX.ding(1.2);
                return false;
            }
            ent.kill(info);
            if (ent.kind === 'boot') {
                D.boots++; S.penalties++; S.award(-150, info.pt, '🥾 OLD BOOT!', '#f87171'); S.breakCombo('OLD BOOT'); SFX.bonk(); return true;
            }
            if (ent.kind === 'puffer') {
                D.boots++; S.penalties++;
                BO.FX.spawnExplosion(info.pt, 2.0, 0xa855f7);
                for (const s of D.shadows) s.scared = Math.max(s.scared, 2.2);
                S.award(-240, info.pt, '🐡 PUFFER MINE!', '#f87171');
                S.breakCombo('PUFFER BLAST'); SFX.buzzer();
                return true;
            }
            S.kills++;
            S.bumpCombo();
            if (ent.kind === 'leviathan') {
                D.leviathans++; D.caught++;
                S.award(Math.round(900 * S.comboMult), info.pt, '👑 TROPHY LEVIATHAN!', '#38bdf8');
                SFX.fanfare();
            } else if (ent.kind === 'gold') {
                D.gold++; D.caught++;
                S.award(Math.round(520 * S.comboMult), info.pt, '✨ GOLDEN KOI!', '#facc15');
                SFX.fanfare();
            } else {
                D.caught++;
                const pts = ent.kind === 'bass' ? 160 : 135;
                S.award(Math.round(pts * S.comboMult), info.pt, ent.kind === 'bass' ? '🐟 PRIZE BASS' : '🐟 RAINBOW TROUT', '#7dd3fc');
                SFX.ding(1.3);
            }
            return true;
        },
        hud(S) {
            const D = S.data;
            const chumTxt = D.chumCd <= 0 ? 'READY!' : D.chumCd.toFixed(0) + 's';
            return `<div class="ah3-panel">${AK.chip('CAUGHT', D.caught)}${AK.chip('GOLD KOI', D.gold)}${AK.chip('LEVIATHANS', D.leviathans)}<div class="mgx-chip ${D.chumCd <= 0 ? 'mgx-hot' : ''}">🔔 CHUM BELL <b>${chumTxt}</b></div></div>`;
        },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return { score: S.score, stars, title: D.leviathans >= 2 || D.gold >= 3 ? 'MASTER LAGOON ANGLER' : 'GONE FISHING', stats: [['TOTAL CAUGHT', D.caught], ['GOLDEN KOI', D.gold], ['TROPHY LEVIATHANS', D.leviathans], ['JUNK / PUFFERS', D.boots], ['WATER SPLASHES', D.splashes], ['BEST STREAK', S.maxCombo]], xp: Math.round(135 + S.score * 0.04 + stars * 130) };
        }
    }));

    /* =====================================================================
       14. PAINT WARS
    ===================================================================== */
    const PW = { w: 16, h: 8, cols: 32, rows: 16, z: -12, cy: 4.4 };
    const MINE = '#38bdf8', RIVAL = '#f472b6';
    MG.register(Object.assign({}, ARC, {
        id: 'paint_wars', order: 14, name: 'Paint Wars', icon: '🎨', accent: '#38bdf8',
        tagline: 'Out-paint the drone. Coverage wins.',
        desc: 'Every shot splats your blue paint on the big wall. A rival drone sprays pink and drops paint bombs, and a second drone joins halfway. Shoot a drone to stun it for a moment. When the clock runs out, the colour that covers more of the wall wins; your stars depend on your coverage.',
        heroLabel: 'ARCADE HALL • TERRITORY • 60 SECONDS', duration: 60, stars: [35, 50, 65, 80], starLabel: (th) => th + '% WALL',
        standardWeapon: 'p90', weaponLabel: 'P90 PAINT GUN', weaponNote: 'Bottomless paint', fireInterval: 0.09, tracerColor: 0x38bdf8,
        formatBest: (b) => (b.extra ? b.extra.pct + '% • ' : '') + Number(b.score).toLocaleString(),
        keys: [['LMB', 'Paint / stun drones'], ['R', 'Retry from results']],
        map: AK.map({ skybox: 'skybox-day.png', skyTop: 0x1e3a8a, skyBottom: 0xfae8ff, fogColor: 0xf5d0fe, fogDensity: 0.004, sunIntensity: 1.5 }),
        build(S) {
            AK.hall(S, { title: 'PAINT WARS', accent: '#38bdf8', ground: 0x334155, music: 'pinball' });
            if (BO.MinigameAudio && BO.MinigameAudio.playStagedMusic) {
                BO.MinigameAudio.playStagedMusic('audio/music/FreePD CC0 Music Tracks/Electronic/electronic-backbeat-ac7c5c7b.m4a', 0.22);
            }
            A.placeGLB(S.scene, 'city_industrial_kit/shipping-container-a.glb', { pos: [-11.5, 0, -10.5], rot: 0.22, scale: 2.0 });
            A.placeGLB(S.scene, 'city_industrial_kit/shipping-container-b.glb', { pos: [11.5, 0, -10.5], rot: -0.22, scale: 2.0 });
            const cv = document.createElement('canvas');
            cv.width = PW.cols * 16; cv.height = PW.rows * 16;
            const g = cv.getContext('2d');
            g.fillStyle = '#e5e7eb'; g.fillRect(0, 0, cv.width, cv.height);
            const tex = new THREE.CanvasTexture(cv);
            tex.userData.mgOwned = true;
            const wall = new THREE.Mesh(new THREE.PlaneGeometry(PW.w, PW.h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }));
            wall.position.set(0, PW.cy, PW.z);
            S.add(wall);
            const frame = new THREE.Mesh(new THREE.BoxGeometry(PW.w + 0.6, PW.h + 0.6, 0.3), std(0x1f2937, 0.7));
            frame.position.set(0, PW.cy, PW.z - 0.2); S.add(frame);
            wall.userData.entity = { alive: true, isWall: true }; wall.userData.hitbox = 'torso';
            Object.assign(S.data, { wall, g, tex, owner: new Uint8Array(PW.cols * PW.rows), mine: 0, rival: 0, drones: [], stuns: 0, dirty: false });
            this._drone(S, 0);
        },
        _drone(S, i) {
            const D = S.data;
            const m = A.drone(i ? 'gunship' : 'scout');
            const body = new THREE.Group(); body.add(m.mesh || m); (m.mesh || m).scale.setScalar(2.6);
            const tint = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), basic(0xf472b6)); tint.position.y = -0.3; tint.userData.noHit = true; body.add(tint);
            const tg = S.addTarget({ mesh: body, pos: V(i ? 5 : -5, PW.cy, PW.z + 1.2), life: 0, appear: 'scale', inT: 0.3, bonus: true });
            tg.drone = true; tg.body = body; tg.stun = 0; tg.goal = V(0, PW.cy, PW.z + 1.2); tg.sprayT = 0; tg.bombT = 4 + i * 2; tg.speed = 3 + i;
            D.drones.push(tg);
            return tg;
        },
        _paint(S, cx, cy, rad, who) {
            const D = S.data;
            for (let y = cy - rad; y <= cy + rad; y++) for (let x = cx - rad; x <= cx + rad; x++) {
                if (x < 0 || y < 0 || x >= PW.cols || y >= PW.rows) continue;
                if ((x - cx) * (x - cx) + (y - cy) * (y - cy) > rad * rad + 1) continue;
                const k = y * PW.cols + x;
                if (D.owner[k] === who) continue;
                if (D.owner[k] === 1) D.mine--; else if (D.owner[k] === 2) D.rival--;
                D.owner[k] = who;
                if (who === 1) D.mine++; else D.rival++;
                D.g.fillStyle = who === 1 ? MINE : RIVAL;
                D.g.fillRect(x * 16, y * 16, 16, 16);
                D.dirty = true;
            }
        },
        _cell(p) { return [Math.floor((p.x + PW.w / 2) / PW.w * PW.cols), Math.floor((PW.cy + PW.h / 2 - p.y) / PW.h * PW.rows)]; },
        extraTargets(S, pool) { if (S.data.wall) pool.push(S.data.wall); },
        update(S, dt, lib, state) {
            const D = S.data;
            if (D.dirty) { D.tex.needsUpdate = true; D.dirty = false; }
            if (state !== 'running') return;
            if (S.t > 30 && D.drones.length < 2) { this._drone(S, 1); MG.toast('A SECOND DRONE JOINS', '#f9a8d4'); }
            for (const d of D.drones) {
                if (d.stun > 0) { d.stun -= dt; d.body.rotation.z = Math.sin(d.stun * 30) * 0.3; continue; }
                d.body.rotation.z = 0;
                const p = d.root.position;
                if (p.distanceTo(d.goal) < 0.4) d.goal.set((Math.random() - 0.5) * (PW.w - 2), PW.cy + (Math.random() - 0.5) * (PW.h - 1.5), PW.z + 1.2);
                const step = d.goal.clone().sub(p);
                p.addScaledVector(step.normalize(), Math.min(d.speed * (1 + S.t / 60) * dt, p.distanceTo(d.goal)));
                d.sprayT -= dt;
                if (d.sprayT <= 0) { d.sprayT = 0.12; const [cx, cy] = this._cell(p); this._paint(S, cx, cy, 1, 2); }
                d.bombT -= dt;
                if (d.bombT <= 0) {
                    d.bombT = 6;
                    const [cx, cy] = this._cell(p);
                    setTimeout(() => { if (MG.session === S && MG.state === 'running') { this._paint(S, cx, cy, 3, 2); SFX.noise(0.2, 600, 'lowpass', 0.8, 0.3); } }, 600);
                    MG.popup(p.clone(), 'PAINT BOMB!', '#f472b6');
                }
            }
        },
        onHit(S, ent, info) {
            const D = S.data;
            if (ent.isWall) {
                const [cx, cy] = this._cell(info.pt);
                this._paint(S, cx, cy, 1, 1);
                S.hits++;
                return false;
            }
            if (ent.drone) {
                S.hits++;
                if (ent.stun <= 0) { ent.stun = 2.5; D.stuns++; S.award(150, info.pt, 'STUNNED', '#38bdf8'); SFX.bonk(); }
                return false;
            }
            return false;
        },
        scoreText(S) { return (S.data.mine / (PW.cols * PW.rows) * 100).toFixed(1) + '%'; },
        hud(S) { const D = S.data, N = PW.cols * PW.rows; const a = D.mine / N * 100, b = D.rival / N * 100; return `<div class="ah3-panel"><div class="sr-chip">YOU <b style="color:${MINE}">${a.toFixed(1)}%</b></div><div class="sr-chip">RIVAL <b style="color:${RIVAL}">${b.toFixed(1)}%</b></div>${AK.chip('STUNS', D.stuns)}</div>`; },
        result(S) {
            const D = S.data, N = PW.cols * PW.rows;
            const pct = Math.round(D.mine / N * 100);
            S.score = D.mine * 10 + D.stuns * 150;
            const stars = this.stars.filter((th) => pct >= th).length;
            return { score: S.score, stars, saveExtra: { pct }, title: D.mine > D.rival ? 'WALL CLAIMED' : 'OUT-PAINTED', stats: [['YOUR COVERAGE', pct + '%'], ['RIVAL COVERAGE', Math.round(D.rival / N * 100) + '%'], ['DRONE STUNS', D.stuns], ['SHOTS', S.shots]], noGraph: true, xp: Math.round(120 + pct * 6 + stars * 120) };
        }
    }));

    /* =====================================================================
       15. SAFE CRACKER
    ===================================================================== */
    MG.register(Object.assign({}, ARC, {
        id: 'safe_cracker', order: 15, name: 'Safe Cracker', icon: '🔐', accent: '#a3a3a3',
        tagline: 'Fire when the notch meets the marker.',
        desc: 'A spinning safe dial with a red notch. Shoot the dial at the moment the notch lines up with the gold marker on top to set one number. Each safe needs more numbers, and the dial spins faster, changes direction and speeds up and slows down. Three bad shots trip the alarm and jam the safe. Crack as many as you can in 75 seconds.',
        heroLabel: 'ARCADE HALL • PRECISION TIMING • 75 SECONDS', duration: 75, stars: [1500, 3500, 6500, 10000],
        standardWeapon: 'python_magnum', weaponLabel: 'PYTHON .357', weaponNote: 'One shot every 0.35 s', fireInterval: 0.35,
        keys: [['LMB', 'Set the number (shoot the dial)'], ['R', 'Retry from results']],
        map: AK.map({ skybox: 'skybox-night.png', skyTop: 0x0c0a09, skyBottom: 0x292524, fogColor: 0x1c1917, fogDensity: 0.02, sunIntensity: 0.6 }),
        build(S) {
            AK.hall(S, { title: 'SAFE CRACKER', accent: '#a3a3a3', ground: 0x1c1917, music: 'contracts' });
            A.placeGLB(S.scene, 'mini_dungeon_kit/chest.glb', { pos: [-4.4, 0, -7.2], rot: 0.35, scale: 2.0 });
            A.placeGLB(S.scene, 'mini_dungeon_kit/coin.glb', { pos: [-4.4, 1.35, -7.2], scale: 1.8 });
            A.placeGLB(S.scene, 'city_industrial_kit/detail-tank-large.glb', { pos: [5.4, 0, -8.5], scale: 2.2 });
            const safe = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 2), std(0x3f3f46, 0.35, 0.8));
            safe.position.set(0, 2.5, -8);
            S.add(safe); S.solid(safe);
            // Gleaming stacked Gold Bullion visible when door swings open!
            const goldM = std(0xfacc15, 0.2, 0.9);
            for (let r = 0; r < 3; r++) for (let c = -1; c <= 1; c++) {
                const bar = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.4, 0.45), goldM);
                bar.position.set(c * 0.95, 1.3 + r * 0.42, -6.98); S.add(bar);
            }
            const door = new THREE.Group();
            door.position.set(-2.1, 2.5, -6.95);
            const plate = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.2, 0.18), std(0x52525b, 0.28, 0.88));
            plate.position.x = 2.1; plate.userData.noHit = true;
            door.add(plate);
            // Brass Hinge Cylinders + 4 Locking Steel Bolts + 4-Spoke Captain's Vault Handle!
            const brassM = std(0xf59e0b, 0.22, 0.9), chromeM = std(0xe2e8f0, 0.2, 0.92);
            for (const hy of [-1.45, 1.45]) {
                const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.65, 12), brassM);
                hinge.position.set(0.05, hy, 0.12); hinge.userData.noHit = true; door.add(hinge);
            }
            for (const by of [-1.4, -0.5, 0.5, 1.4]) {
                const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.45, 10), chromeM);
                bolt.rotation.z = Math.PI / 2; bolt.position.set(4.18, by, 0.02); bolt.userData.noHit = true; door.add(bolt);
            }
            for (let sp = 0; sp < 4; sp++) {
                const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.95, 8), brassM);
                spoke.position.set(0.85, -1.1, 0.20); spoke.rotation.z = (sp / 4) * Math.PI; spoke.userData.noHit = true;
                door.add(spoke);
            }
            const alarmBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), basic(0x7f1d1d));
            alarmBeacon.position.set(0, 5.25, -7.8); S.add(alarmBeacon);
            S.add(door);
            const dialTex = L.canvasTex('safe-dial', 256, 256, (g, w, h) => {
                g.fillStyle = '#d4d4d8'; g.beginPath(); g.arc(128, 128, 126, 0, TAU); g.fill();
                g.fillStyle = '#18181b'; g.font = '700 18px Bahnschrift, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
                for (let i = 0; i < 40; i++) {
                    const a = i / 40 * TAU;
                    g.fillRect(128 + Math.sin(a) * 104 - 1, 128 - Math.cos(a) * 104 - (i % 5 ? 4 : 9), 2, i % 5 ? 8 : 18);
                    if (i % 5 === 0) g.fillText(String(i * 2.5 | 0), 128 + Math.sin(a) * 80, 128 - Math.cos(a) * 80);
                }
                g.fillStyle = '#dc2626'; g.beginPath(); g.moveTo(128, 2); g.lineTo(118, 26); g.lineTo(138, 26); g.closePath(); g.fill();
            });
            const dial = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.2, 40), [std(0x71717a, 0.3, 0.8), new THREE.MeshStandardMaterial({ map: dialTex, roughness: 0.4, metalness: 0.4 }), std(0x71717a, 0.3, 0.8)]);
            dial.rotation.x = Math.PI / 2;
            const dialG = new THREE.Group();
            dialG.add(dial);
            dialG.position.set(2.1, 0.2, 0.2);
            door.add(dialG);
            const marker = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 3), basic(0xfacc15));
            marker.rotation.z = Math.PI; marker.position.set(0, 4.95, -6.8); marker.userData.noHit = true;
            S.add(marker);
            const pins = [];
            for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshStandardMaterial({ color: 0x27272a, emissive: 0x000000 })); p.position.set(-1.25 + i * 0.5, 0.55, -6.8); S.add(p); pins.push(p); }
            dial.userData.entity = { alive: true, isDial: true }; dial.userData.hitbox = 'torso';
            Object.assign(S.data, { door, dialG, dial, pins, safeN: 0, cracked: 0, jams: 0, perfect: 0 });
            this._newSafe(S);
        },
        _newSafe(S) {
            const D = S.data;
            const n = D.safeN;
            Object.assign(D, { need: Math.min(6, 3 + Math.floor(n / 2)), set: 0, alarms: 0, ang: Math.random() * TAU, dir: 1, speed: 1.5 + n * 0.35, wobble: n >= 2 ? 0.5 + n * 0.1 : 0, tol: Math.max(0.09, 0.24 - n * 0.025), safeT: 0, opening: 0 });
            D.door.rotation.y = 0;
            D.pins.forEach((p, i) => { p.visible = i < D.need; p.material.emissive.setHex(0); p.material.color.setHex(0x27272a); });
        },
        extraTargets(S, pool) { if (S.data.dial && !S.data.opening) pool.push(S.data.dial); },
        update(S, dt, lib, state) {
            const D = S.data;
            if (D.opening > 0) {
                D.opening -= dt;
                D.door.rotation.y = Math.min(1.6, D.door.rotation.y + dt * 2.5);
                if (D.opening <= 0) { D.safeN++; this._newSafe(S); }
                return;
            }
            if (state !== 'running') return;
            D.safeT += dt;
            const sp = D.speed * (1 + Math.sin(S.t * 2.1) * D.wobble);
            D.ang = wrapA(D.ang + sp * D.dir * dt);
            D.dialG.rotation.z = -D.ang;
        },
        onHit(S, ent, info) {
            const D = S.data;
            if (!ent.isDial || D.opening > 0) return false;
            S.hits++;
            const off = Math.abs(wrapA(D.ang));
            if (off <= D.tol) {
                const perfect = off <= D.tol * 0.35;
                if (perfect) D.perfect++;
                D.pins[D.set].material.emissive.setHex(0x22c55e); D.pins[D.set].material.color.setHex(0x22c55e);
                D.set++;
                S.bumpCombo();
                S.award((perfect ? 200 : 100) * S.comboMult, info.pt, perfect ? 'PERFECT CLICK' : 'CLICK', '#86efac');
                SFX.clack(); SFX.tone(1200, 1200, 0.05, 'square', 0.08);
                D.dir *= -1;
                D.speed *= 1.06;
                D.ang = wrapA(D.ang + Math.PI * (0.5 + Math.random()));
                if (D.set >= D.need) {
                    D.cracked++; S.kills++;
                    const bonus = 500 + D.need * 100 + Math.max(0, Math.round((20 - D.safeT) * 30));
                    S.award(bonus, info.pt.clone().add(V(0, 1, 0)), 'SAFE CRACKED', '#facc15');
                    SFX.fanfare();
                    D.opening = 1.4;
                }
            } else {
                D.alarms++;
                S.breakCombo('BAD TIMING');
                SFX.buzzer();
                MG.flashScreen('rgba(220,38,38,0.2)');
                if (D.alarms >= 3) {
                    D.jams++;
                    S.award(-300, info.pt, 'ALARM — SAFE JAMMED', '#f87171');
                    D.safeN++;
                    this._newSafe(S);
                } else MG.popup(info.pt, `ALARM ${D.alarms} / 3`, '#fca5a5');
            }
            return false;
        },
        hud(S) { const D = S.data; return `<div class="ah3-panel">${AK.chip('SAFE', D.safeN + 1)}${AK.chip('NUMBERS', D.set + ' / ' + D.need)}${AK.chip('ALARM', D.alarms + ' / 3', D.alarms > 0)}${AK.chip('CRACKED', D.cracked)}</div>`; },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return { score: S.score, stars, title: D.cracked >= 6 ? 'MASTER SAFECRACKER' : D.cracked ? 'IN AND OUT' : 'ALARM BELLS', stats: [['SAFES CRACKED', D.cracked], ['SAFES JAMMED', D.jams], ['PERFECT CLICKS', D.perfect], ['BEST STREAK', S.maxCombo]], xp: Math.round(120 + S.score * 0.04 + stars * 120) };
        }
    }));
})(window);
