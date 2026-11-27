/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Speed Runs (part 3 — Showcase Missions)
     8. Ninja Stealth       — Shinobi Katana/Shuriken Viewmodel, Koi River & LOS
     9. Three-Headed Dragon — Flagship Sculpted Titan Hydra + PBR Scales & Weakpoints
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const L = BO.MinigameLib;
    const A = BO.MinigameArt;
    const K = BO.MGCourseKit;
    const F = BO.MGFigures;
    const SR = BO.SpeedRunKit;
    const { B, SFX, std, basic, TAU } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));

    const NINJA_RAY = new THREE.Raycaster();
    function canSeeLOS(from, to, meshes) {
        const dir = to.clone().sub(from), dist = dir.length();
        if (dist < 0.3) return true;
        dir.divideScalar(dist);
        NINJA_RAY.set(from, dir); NINJA_RAY.near = 0.2; NINJA_RAY.far = Math.max(0.25, dist - 0.3);
        return NINJA_RAY.intersectObjects(meshes, false).length === 0;
    }

    function buildShinobiViewmodel() {
        const root = new THREE.Group();
        const sleeveM = std(0x1e1b4b, 0.8), skinM = std(0xe0ac69, 0.7), wrapM = std(0x111827, 0.85);
        const steelM = std(0xe2e8f0, 0.16, 0.92), tsubaM = std(0xd97706, 0.28, 0.88);

        // Right Arm + Katana Rig
        const rightPivot = new THREE.Group();
        rightPivot.position.set(0.24, -0.24, -0.38);
        const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.052, 0.34, 10), sleeveM);
        armR.rotation.x = Math.PI * 0.42; armR.position.set(0.05, -0.06, 0.12);
        const handR = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 8), skinM);
        handR.position.set(0, 0, -0.02);

        const katana = new THREE.Group();
        katana.rotation.set(-0.35, 0.15, 0.18);
        const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.019, 0.22, 8), wrapM);
        hilt.position.y = -0.04;
        const tsuba = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.014, 12), tsubaM);
        tsuba.position.y = 0.075;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.56, 0.028), steelM);
        blade.position.set(0, 0.36, -0.005); blade.rotation.x = -0.04;
        const edge = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.56, 0.01), basic(0x67e8f9));
        edge.position.set(0, 0.36, -0.02); edge.rotation.x = -0.04;
        const slashArc = new THREE.Mesh(
            new THREE.RingGeometry(0.32, 0.52, 18, 1, -0.4, Math.PI * 0.9),
            new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false })
        );
        slashArc.rotation.set(0.4, 0.2, 0); slashArc.position.set(-0.14, 0.24, -0.18);
        katana.add(hilt, tsuba, blade, edge);
        rightPivot.add(armR, handR, katana);

        // Left Arm + Ready Shuriken Rig
        const leftPivot = new THREE.Group();
        leftPivot.position.set(-0.24, -0.25, -0.36);
        const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.32, 10), sleeveM);
        armL.rotation.x = Math.PI * 0.44; armL.position.set(-0.04, -0.06, 0.12);
        const handL = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 8), skinM);
        const star = new THREE.Group(); star.position.set(0.02, 0.03, -0.06);
        const s1 = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), steelM); s1.scale.set(1.3, 0.16, 0.45);
        const s2 = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), steelM); s2.scale.set(0.45, 0.16, 1.3);
        star.add(s1, s2);
        leftPivot.add(armL, handL, star);

        root.add(rightPivot, leftPivot, slashArc);
        return { root, rightPivot, leftPivot, katana, star, slashArc };
    }

    /* =====================================================================
       8. NINJA — 3x Expanded Samurai Citadel + Shinobi Viewmodel + Koi River
    ===================================================================== */
    SR.define({
        id: 'sr_ninja', order: 8, name: 'Ninja Stealth', icon: '🥷', accent: '#6366f1', badge: 'STEALTH', music: 'contracts',
        musicState: (S) => ({ urgent: (S.data.guards || []).some((g) => g.alive && g.st.state === 'alert') }),
        tagline: '3x Larger Fortress! 3 Ways to Win: Ghost 3 Scrolls, Assassinate the Shogun, or Clear All 18 Guards!',
        desc: 'Infiltrate a massive 150m x 220m Samurai Citadel with your Shinobi Katana & Shurikens! Hide in Tall Bamboo Grass, avoid Nightingale Floors, cross the Koi River bridges, and win via 3 Scrolls + Torii, Shogun Assassination + Torii, or eliminating all 18 guards!',
        heroLabel: 'SPEED RUN • 3X GRAND SHINOBI CITADEL', stars: [300, 220, 165, 115], timeLimit: 540,
        blockFire: true, hideViewmodel: true, weaponNote: 'Shinobi Arsenal: Katana Flank/Plunge, 12 Shurikens, 5 Smokes, Rocks',
        keys: [['WASD', 'Sneak'], ['LMB / E', 'Katana / Scroll'], ['F', 'Shuriken (12)'], ['Q', 'Smoke Bomb (5)'], ['G / RMB', 'Throw Rock'], ['SHIFT', 'Shadow Dash']],
        guide: {
            objective: 'Achieve ANY of 3 Victory Conditions: (1) Steal 3 Scrolls + North Torii, (2) Kill the Red Shogun + North Torii, or (3) Eliminate all 18 Guards.',
            tips: [
                'Backstab or flank guards (or blind them with Smoke [Q] / Plunge from above) — frontal LMB is blocked!',
                'Hide inside Tall Green Bamboo Grass clusters to shrink guard detection radius by 70%.',
                'Use [F] Throwing Shurikens for silent ranged takedowns on patrols.'
            ]
        },
        map: {
            atmosphere: { skyTop: 0x020617, skyBottom: 0x1e1b4b, fogColor: 0x0f172a, fogDensity: 0.0075, sunColor: 0xc7d2fe, sunIntensity: 0.58, sunPos: [-40, 60, -60], hemiSky: 0x818cf8, hemiGround: 0x111827, hemiIntensity: 0.92, moon: true },
            skybox: 'skybox-night.png',
            boxes: [B(0, -0.5, -90, 170, 1, 240, 'grass')],
            spawn: { x: 0, y: 0, z: 16, yaw: 0 }
        },
        build(S) {
            K.groundPlane(S, 240, 0x14261c, 0.002);
            const wallM = A.pbrMat('fantasy_painterly/Stone Masonry Ruins/basalt-cliff-wall-001.png', 16, 1.5, { roughness: 0.88 }), shojiM = std(0xf1f5f9, 0.72), woodM = A.pbrMat('fantasy_painterly/Wood Bark Boards/charred-wood-boards-001.png', 4, 2, { roughness: 0.85 }), redM = std(0xb91c1c, 0.55), bambooM = std(0x16a34a, 0.7);
            const losMeshes = [];
            const addSol = (x, y, z, w, h, d, m) => { const bx = S.box(x, y, z, w, h, d, m, { solid: true }); losMeshes.push(bx); return bx; };
            const addWallSol = (x1, z1, x2, z2, h, m) => { const w = SR.wall(S, x1, z1, x2, z2, h, m); losMeshes.push(w); return w; };

            // 3x Larger Citadel Perimeter (-72..72, 20..-196) — added to losMeshes!
            addWallSol(-72, 20, -72, -196, 5.2, wallM); addWallSol(72, 20, 72, -196, 5.2, wallM);
            addWallSol(-72, -196, 72, -196, 5.2, wallM); addWallSol(-72, 20, 72, 20, 5.2, wallM);

            // Central Koi River + Twin Arched Bridges + Swimming Koi Fish & Water Shimmer
            const pond = new THREE.Mesh(new THREE.PlaneGeometry(142, 16), std(0x0284c7, 0.14, 0.42));
            pond.rotation.x = -Math.PI / 2; pond.position.set(0, 0.03, -52); S.add(pond);
            const shimmerMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false });
            const shimmers = [];
            for (let i = 0; i < 16; i++) {
                const sm = new THREE.Mesh(new THREE.PlaneGeometry(5 + (i % 3) * 2.2, 0.35), shimmerMat);
                sm.rotation.x = -Math.PI / 2; sm.position.set(-56 + i * 7.5, 0.045, -52 + Math.sin(i * 1.4) * 5.2);
                S.add(sm); shimmers.push({ m: sm, bx: sm.position.x, ph: i * 0.7 });
            }
            const koiList = [];
            const koiCols = [0xf97316, 0xfef08a, 0xef4444, 0xf8fafc];
            for (let i = 0; i < 12; i++) {
                const kg = new THREE.Group();
                const col = koiCols[i % koiCols.length];
                const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), std(col, 0.35)); body.scale.set(0.75, 0.65, 2.1);
                const tail = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.32, 4), std(0xfef3c7, 0.4)); tail.rotation.x = Math.PI / 2; tail.position.z = -0.42;
                kg.add(body, tail);
                const bx = -48 + (i / 12) * 96, bz = -52 + (i % 2 ? 3.2 : -3.2);
                kg.position.set(bx, 0.08, bz); S.add(kg);
                koiList.push({ g: kg, tail, bx, bz, rx: 5 + (i % 3) * 2, rz: 2.2, spd: 0.55 + (i % 4) * 0.15, ph: i * 1.3 });
            }

            for (const bx of [-22, 22]) {
                S.box(bx, 0.18, -52, 4.4, 0.35, 18, woodM, { solid: true });
                for (const sx of [-2.0, 2.0]) { const br = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.9, 18), redM); br.position.set(bx + sx, 0.65, -52); S.add(br); }
            }

            const buildings = [
                [-26, -12, 10, 4, 1], [26, -12, 10, 4, 1],
                [-42, -32, 9, 9, 2], [42, -32, 9, 9, 2],
                [-48, -86, 11, 11, 2], [48, -86, 11, 11, 2],
                [-16, -98, 12, 3, 1], [16, -98, 12, 3, 1],
                [-38, -142, 10, 10, 2], [38, -142, 10, 10, 2],
                [0, -146, 14, 12, 3]
            ];
            for (const [x, z, w, d, tiers] of buildings) {
                addSol(x, 1.8, z, w, 3.6, d, shojiM);
                for (let t = 0; t < tiers; t++) {
                    const rf = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * (0.82 - t * 0.2), 1.6, 4), woodM);
                    rf.rotation.y = Math.PI / 4; rf.position.set(x, 4.2 + t * 2.2, z); S.add(rf);
                }
            }

            S.data.grass = [[-14, 2], [14, -4], [-34, -22], [32, -26], [-28, -68], [28, -74], [-40, -118], [40, -122], [-18, -162], [18, -162]].map(([gx, gz]) => {
                const grp = new THREE.Group(); grp.position.set(gx, 0, gz);
                for (let k = 0; k < 10; k++) {
                    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 1.9, 6), bambooM);
                    b.position.set((Math.random() - 0.5) * 4.5, 0.95, (Math.random() - 0.5) * 4.5); grp.add(b);
                }
                S.add(grp); return V(gx, 0, gz);
            });

            S.data.creaks = [[-10, -28], [10, -28], [0, -86], [-18, -126], [18, -126]].map(([cx, cz]) => {
                const pl = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 5.5), std(0xd97706, 0.8));
                pl.rotation.x = -Math.PI / 2; pl.position.set(cx, 0.04, cz); S.add(pl);
                return { pos: V(cx, 0, cz), cd: 0 };
            });
            S.data.jumpPads = [[-42, -25], [42, -25], [-48, -78], [48, -78], [0, -138]].map(([jx, jz]) => {
                const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.3, 18), basic(0x38bdf8, { side: THREE.DoubleSide }));
                ring.rotation.x = -Math.PI / 2; ring.position.set(jx, 0.05, jz); S.add(ring);
                return { pos: V(jx, 0, jz), cd: 0 };
            });

            const ninjaTrees = [];
            for (let i = 0; i < 32; i++) {
                ninjaTrees.push({ pos: [(i % 2 ? -1 : 1) * (58 + (i % 4) * 2.5), 0, 12 - i * 6.4], rot: i * 0.7, scale: (1.5 + (i % 3) * 0.3) * 2.0 });
            }
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/mini_forest_kit/tree-high.glb', ninjaTrees);
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/mini_dungeon_kit/barrel.glb', [
                { pos: [-8, 0, -4], scale: 1.5 }, { pos: [8, 0, -4], scale: 1.5 },
                { pos: [-14, 0, -44], scale: 1.5 }, { pos: [14, 0, -44], scale: 1.5 }
            ]);
            for (const [lx, lz] of [[-8, 6], [8, 6], [-22, -52], [22, -52], [-12, -132], [12, -132], [-6, -184], [6, -184]]) S.add(A.torch(S, V(lx, 0, lz), 0xf97316, false));

            S.data.scrolls = [
                { name: 'WEST BAMBOO SCROLL', pos: V(-54, 1.1, -36), collected: false },
                { name: 'EAST PAGODA SCROLL', pos: V(54, 1.1, -92), collected: false },
                { name: 'INNER KEEP SCROLL', pos: V(-26, 1.1, -152), collected: false }
            ].map((sc) => {
                const m = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.85, 10), std(0xfacc15, 0.2, 0.8, { emissive: 0xca8a04, emissiveIntensity: 0.75 }));
                m.rotation.z = Math.PI / 2; m.position.copy(sc.pos); S.add(m);
                const halo = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.95, 20), basic(0xfde047, { side: THREE.DoubleSide }));
                halo.rotation.x = -Math.PI / 2; halo.position.set(sc.pos.x, 0.05, sc.pos.z); S.add(halo);
                return Object.assign(sc, { mesh: m, halo });
            });

            const torii = new THREE.Group();
            for (const sx of [-3.0, 3.0]) { const col = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 5.8, 10), redM); col.position.set(sx, 2.9, 0); torii.add(col); }
            const lintel = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.5, 0.5), redM); lintel.position.y = 5.4;
            const cap = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.32, 0.6), std(0x111827, 0.7)); cap.position.y = 5.8;
            const shrineLight = new THREE.Mesh(new THREE.RingGeometry(2.0, 2.4, 24), basic(0x38bdf8, { side: THREE.DoubleSide }));
            shrineLight.rotation.x = -Math.PI / 2; shrineLight.position.y = 0.04;
            torii.add(lintel, cap, shrineLight); torii.position.set(0, 0, -188); S.add(torii);
            const nLanterns = [];
            for (const bx of [-22, 22]) for (let lz = -60; lz <= -44; lz += 4) nLanterns.push(V(bx - 2.0, 1.25, lz), V(bx + 2.0, 1.25, lz));
            for (let tx = -3.6; tx <= 3.6; tx += 1.2) nLanterns.push(V(tx, 5.65, -188));
            const nBulbs = A.bulbs(nLanterns, [0xfde047, 0xf97316, 0xfef3c7], 0.14);
            S.add(nBulbs); A.animateBulbs(S, nBulbs, 3, 'twinkle');
            if (BO.Settings.getQualityPreset().pointLights) {
                const moonPl = new THREE.PointLight(0x818cf8, 1.4, 34, 1.4); moonPl.position.set(0, 7, 10); S.add(moonPl);
            }

            const guardDefs = [
                { p: [[-8, 4], [8, 4]] }, { p: [[-26, -4], [-10, -4]] }, { p: [[26, -4], [10, -4]] },
                { p: [[-48, -22], [-34, -22]] }, { p: [[48, -22], [34, -22]] },
                { p: [[-24, -40], [-18, -40]] }, { p: [[24, -40], [18, -40]] },
                { p: [[-10, -68], [10, -68]] }, { p: [[-46, -74], [-32, -74]] }, { p: [[46, -74], [32, -74]] },
                { p: [[-54, -98], [-38, -98]] }, { p: [[54, -98], [38, -98]] },
                { p: [[-18, -116], [18, -116]] }, { p: [[-42, -130], [-28, -130]] }, { p: [[42, -130], [28, -130]] },
                { p: [[-16, -156], [-4, -156]] }, { p: [[16, -156], [4, -156]] },
                { p: [[0, -132], [0, -162]], shogun: true }
            ];
            S.data.losMeshes = losMeshes;
            S.data.guards = guardDefs.map((gd, idx) => {
                const fig = F.human({ shirt: gd.shogun ? 0xdc2626 : idx >= 12 ? 0x7f1d1d : 0x374151, pants: 0x111827, mask: 0x1e293b, hat: 'helmet', hatColor: gd.shogun ? 0xfacc15 : 0x0f172a, gun: 'rifle', eyes: 'angry' });
                if (gd.shogun) fig.root.scale.setScalar(1.32);
                const cone = new THREE.Mesh(new THREE.CircleGeometry(gd.shogun ? 11.0 : 9.0, 20, -Math.PI * 0.25, Math.PI * 0.5), new THREE.MeshBasicMaterial({ color: gd.shogun ? 0xf97316 : 0xfacc15, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
                cone.rotation.x = -Math.PI / 2; cone.rotation.z = -Math.PI / 2; cone.position.y = 0.05; cone.userData.noHit = true; fig.root.add(cone);
                const st = { wp: gd.p.map((v) => V(v[0], 0, v[1])), wi: 0, wait: 0, state: 'patrol', invPos: null, invT: 0, alertT: 0, blindT: 0, fireT: 0, walkPh: idx * 1.1 };
                const tg = S.addTarget({ mesh: fig.root, hitMeshes: [], pos: st.wp[0].clone(), life: 0, appear: 'none', inT: 0.01, death: 'knock', deathColor: 0x4b5563, bonus: true });
                tg.guard = true; tg.isShogun = !!gd.shogun; tg.hp = gd.shogun ? 2 : 1; tg.fig = fig; tg.cone = cone; tg.st = st; return tg;
            });

            // Attach Custom First-Person Shinobi Katana & Shuriken Viewmodel to vmCamera
            const vm = buildShinobiViewmodel();
            if (BO.Player && BO.Player.vmCamera) BO.Player.vmCamera.add(vm.root);
            S.data.vm = vm; S.data.slashT = 0; S.data.flickT = 0;

            S.animate((dt) => {
                const t = performance.now() * 0.001;
                for (const sm of shimmers) {
                    sm.m.position.x = sm.bx + Math.sin(t * 1.4 + sm.ph) * 2.2;
                    sm.m.material.opacity = 0.16 + Math.sin(t * 2.4 + sm.ph) * 0.09;
                }
                for (const k of koiList) {
                    const ang = t * k.spd + k.ph;
                    const nx = k.bx + Math.cos(ang) * k.rx;
                    const nz = k.bz + Math.sin(ang * 1.3) * k.rz;
                    const dx = -Math.sin(ang) * k.rx * k.spd;
                    const dz = Math.cos(ang * 1.3) * k.rz * k.spd * 1.3;
                    k.g.position.set(nx, 0.08, nz);
                    k.g.rotation.y = Math.atan2(dx, dz);
                    k.tail.rotation.y = Math.sin(t * 10 + k.ph) * 0.45;
                }
            });

            Object.assign(S.data, { rocks: [], shurikens: [], smokes: [], rockCd: 0, shurikenLeft: 12, smokeLeft: 5, dashCd: 0, stealthKills: 0, scrollsGot: 0, shogunDown: false, spotted: 0 });
        },
        dispose(S) {
            if (S.data.vm && S.data.vm.root && S.data.vm.root.parent) {
                S.data.vm.root.parent.remove(S.data.vm.root);
            }
        },
        progress: (S) => {
            const D = S.data;
            return Math.min(1, Math.max(D.scrollsGot / 3, D.stealthKills / ((D.guards || []).length || 18), D.shogunDown ? 0.85 : 0));
        },
        onKey(S, code) {
            const D = S.data, P = BO.Player;
            if (MG.state !== 'running') return false;
            if (code === 'KeyG') { this._throwRock(S); return true; }
            if (code === 'KeyF') { this._throwShuriken(S); return true; }
            if (code === 'KeyQ') { this._popSmoke(S); return true; }
            if (code === 'ShiftLeft' && D.dashCd <= 0) {
                D.dashCd = 4.5; const fwd = P.getMoveDirectionVectors().forward;
                SR.stepMove(P.pos, fwd, 5.5, { radius: P.radius, height: P.standHeight, rayMeshes: D.losMeshes, minX: -70.5, maxX: 70.5, minZ: -194.5, maxZ: 18.5 });
                SFX.whoosh(0.28); MG.toast('SHADOW DASH!', '#a5f3fc'); return true;
            }
            if (code === 'KeyE') { if (!this._grabScroll(S)) this._tryAssassinate(S); return true; }
            return false;
        },
        _grabScroll(S) {
            const P = BO.Player;
            for (const sc of S.data.scrolls || []) {
                if (!sc.collected && Math.hypot(P.pos.x - sc.pos.x, P.pos.z - sc.pos.z) < 3.0) {
                    sc.collected = true; sc.mesh.visible = false; sc.halo.visible = false; S.data.scrollsGot++;
                    S.award(900, sc.pos, 'SECRET SCROLL!', '#fde047');
                    SR.stageBurst(S, sc.pos, `STOLE ${sc.name}`, S.data.scrollsGot - 1, 3, 0xfde047);
                    return true;
                }
            }
            return false;
        },
        _popSmoke(S) {
            if (S.data.smokeLeft <= 0) { MG.toast('NO SMOKE BOMBS LEFT', '#cbd5e1'); return false; }
            S.data.smokeLeft--;
            const p = BO.Player.pos.clone();
            S.data.smokes.push({ pos: p.clone(), t: 7.0 });
            BO.FX.spawnParticles(p.clone().add(V(0, 1.0, 0)), 32, 0x94a3b8, 3.2, 0.5, 1.6, 2.2);
            SFX.whoosh(0.4); MG.toast('SMOKE BOMB! VANISH IN SHADOWS!', '#a5f3fc'); return true;
        },
        _throwRock(S) {
            if (S.data.rockCd > 0) return;
            S.data.rockCd = 0.65; S.data.flickT = 0.25;
            const cam = BO.App.worldCamera, dir = new THREE.Vector3(); cam.getWorldDirection(dir);
            const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11, 0), std(0x9ca3af, 0.9));
            m.position.copy(cam.position).addScaledVector(dir, 0.8); S.add(m);
            S.data.rocks.push({ mesh: m, vel: dir.multiplyScalar(16).add(V(0, 4.2, 0)) }); SFX.whoosh(0.16);
        },
        _throwShuriken(S) {
            const D = S.data;
            if (D.shurikenLeft <= 0) { MG.toast('OUT OF SHURIKENS!', '#cbd5e1'); return; }
            D.shurikenLeft--; D.flickT = 0.30;
            const cam = BO.App.worldCamera, dir = new THREE.Vector3(); cam.getWorldDirection(dir);
            const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), std(0xe2e8f0, 0.2, 0.9));
            star.scale.set(1.4, 0.2, 1.4); star.position.copy(cam.position).addScaledVector(dir, 0.8); S.add(star);
            D.shurikens.push({ mesh: star, vel: dir.multiplyScalar(38), life: 2.2 }); SFX.whoosh(0.12);
        },
        _tryAssassinate(S) {
            const P = BO.Player, D = S.data;
            D.slashT = 0.32;
            SFX.whoosh(0.18);
            for (const g of D.guards || []) {
                if (!g.alive) continue;
                const d = Math.hypot(P.pos.x - g.root.position.x, P.pos.z - g.root.position.z);
                if (d > 3.2) continue;
                const fwdX = Math.sin(g.root.rotation.y), fwdZ = Math.cos(g.root.rotation.y);
                const dot = (fwdX * (P.pos.x - g.root.position.x) + fwdZ * (P.pos.z - g.root.position.z)) / Math.max(0.01, d);
                // No frontal cheese 1-tap: require flank/behind (dot < 0.35), smoke-blind, or aerial plunge!
                if (dot < 0.35 || g.st.blindT > 0 || P.vel.y < -1.0) {
                    g.kill({ pt: g.root.position.clone().add(V(0, 1.3, 0)) });
                    D.stealthKills++; S.kills++; S.bumpCombo(); SFX.shatter();
                    if (g.isShogun) { D.shogunDown = true; MG.toast('SHOGUN ASSASSINATED! EXTRACT AT NORTH TORII!', '#fde047'); }
                    BO.FX.spawnParticles(g.root.position.clone().add(V(0, 1.2, 0)), 16, 0x6366f1, 4, 2, 0.4, 1.0);
                    S.award(g.isShogun ? 1500 : 450, g.root.position.clone().add(V(0, 1.9, 0)), g.isShogun ? 'SHOGUN SLAIN!' : 'KATANA TAKEDOWN!', '#818cf8');
                    return true;
                }
                SFX.clack();
                if (g.st.state !== 'alert') { g.st.state = 'alert'; D.spotted++; g.cone.material.color.setHex(0xef4444); }
                MG.toast('FRONTAL BLOCKED! FLANK, SMOKE [Q], OR PLUNGE!', '#fca5a5');
                return false;
            }
            return false;
        },
        update(S, dt, lib, state) {
            const D = S.data, P = BO.Player;
            for (const sc of D.scrolls || []) if (!sc.collected) sc.mesh.rotation.x += dt * 3;
            // Animate Shinobi First-Person Viewmodel
            if (D.vm) {
                const spd = Math.hypot(P.vel.x, P.vel.z);
                const bob = Math.sin(P.bobPhase || 0) * Math.min(1, spd / 6) * 0.014;
                D.slashT = Math.max(0, D.slashT - dt);
                D.flickT = Math.max(0, D.flickT - dt);
                const sp = D.slashT > 0 ? Math.sin((1 - D.slashT / 0.32) * Math.PI) : 0;
                const fp = D.flickT > 0 ? Math.sin((1 - D.flickT / 0.30) * Math.PI) : 0;
                D.vm.rightPivot.position.set(0.24 - sp * 0.22, -0.24 + bob + sp * 0.08, -0.38 - sp * 0.14);
                D.vm.rightPivot.rotation.set(-sp * 1.15, sp * 0.95, sp * 0.85);
                D.vm.slashArc.material.opacity = sp > 0.15 ? sp * 0.65 : 0;
                D.vm.slashArc.rotation.z = -1.2 + (1 - D.slashT / 0.32) * 2.4;
                D.vm.star.visible = D.shurikenLeft > 0;
                D.vm.star.rotation.y += dt * 4.5;
                D.vm.leftPivot.position.set(-0.24 + fp * 0.14, -0.25 + bob + fp * 0.06, -0.36 - fp * 0.24);
                D.vm.leftPivot.rotation.set(-fp * 0.75, 0, fp * 0.4);
            }
            if (state !== 'running') return;
            D.rockCd = Math.max(0, D.rockCd - dt); D.dashCd = Math.max(0, D.dashCd - dt);
            if (P.triggerHeld && !D._lmbLatch) { D._lmbLatch = true; this._tryAssassinate(S); } else if (!P.triggerHeld) D._lmbLatch = false;
            if (P.adsHeld && !D._rmbLatch) { D._rmbLatch = true; this._throwRock(S); } else if (!P.adsHeld) D._rmbLatch = false;

            const hiddenInGrass = (D.grass || []).some((gp) => gp.distanceTo(P.pos) < 3.4);
            for (const cr of D.creaks || []) {
                if (cr.cd > 0) cr.cd -= dt;
                else if (cr.pos.distanceTo(P.pos) < 3.6 && Math.hypot(P.vel.x, P.vel.z) > 2.2) {
                    cr.cd = 3.5; SFX.clack(); MG.toast('CREAKING NIGHTINGALE FLOOR!', '#fde68a');
                    for (const g of D.guards) if (g.alive && g.st.state !== 'alert' && g.root.position.distanceTo(P.pos) < 22) { g.st.state = 'investigate'; g.st.invPos = P.pos.clone(); g.st.invT = 5.0; }
                }
            }
            for (const jp of D.jumpPads || []) {
                if (jp.cd > 0) jp.cd -= dt;
                else if (jp.pos.distanceTo(P.pos) < 1.6) { jp.cd = 1.5; P.vel.y = 12.5; SFX.boing(); }
            }

            for (let i = D.smokes.length - 1; i >= 0; i--) {
                D.smokes[i].t -= dt;
                if (Math.random() < dt * 8) BO.FX.spawnParticles(D.smokes[i].pos.clone().add(V((Math.random() - 0.5) * 2.5, 0.8, (Math.random() - 0.5) * 2.5)), 2, 0xcbd5e1, 1.0, 0.2, 0.8, 2.0);
                if (D.smokes[i].t <= 0) D.smokes.splice(i, 1);
            }
            const inSmoke = (pos) => D.smokes.some((sm) => sm.pos.distanceTo(pos) < 5.8);

            for (let i = D.shurikens.length - 1; i >= 0; i--) {
                const sh = D.shurikens[i]; sh.life -= dt; sh.mesh.position.addScaledVector(sh.vel, dt); sh.mesh.rotation.y += dt * 20;
                let rm = sh.life <= 0 || !canSeeLOS(sh.mesh.position.clone().addScaledVector(sh.vel, -dt), sh.mesh.position, D.losMeshes);
                if (!rm) for (const g of D.guards) if (g.alive && g.root.position.clone().add(V(0, 1.2, 0)).distanceTo(sh.mesh.position) < 1.1) {
                    rm = true; g.hp--;
                    if (g.hp <= 0) {
                        g.kill({ pt: sh.mesh.position.clone() }); D.stealthKills++; S.kills++; S.bumpCombo(); SFX.shatter();
                        if (g.isShogun) D.shogunDown = true;
                        S.award(450, g.root.position.clone().add(V(0, 1.8, 0)), 'SHURIKEN KILL!', '#a5f3fc');
                    } else { SFX.clack(); MG.popup(sh.mesh.position, 'SHOGUN ARMOR HIT!', '#fde047'); }
                    break;
                }
                if (rm) { S.scene.remove(sh.mesh); D.shurikens.splice(i, 1); }
            }

            for (let i = D.rocks.length - 1; i >= 0; i--) {
                const rk = D.rocks[i]; rk.vel.y -= 18 * dt; rk.mesh.position.addScaledVector(rk.vel, dt);
                if (rk.mesh.position.y <= 0.1) {
                    const hitPos = rk.mesh.position.clone(); hitPos.y = 0.05; S.scene.remove(rk.mesh); D.rocks.splice(i, 1); SFX.clack();
                    const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.45, 20), basic(0xe0f2fe, { transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
                    ring.rotation.x = -Math.PI / 2; ring.position.copy(hitPos); S.add(ring);
                    let rt = 0; S.animate((dt2) => { rt += dt2; ring.scale.setScalar(1 + rt * 14); ring.material.opacity = Math.max(0, 0.8 - rt * 1.4); if (rt > 0.6) { S.scene.remove(ring); return false; } });
                    for (const g of D.guards) if (g.alive && g.st.state !== 'alert' && g.root.position.distanceTo(hitPos) < 22) { g.st.state = 'investigate'; g.st.invPos = hitPos.clone(); g.st.invT = 5.0; }
                    MG.toast('ROCK DISTRACTION!', '#a5f3fc');
                }
            }

            for (const g of D.guards) {
                if (!g.alive) continue;
                const st = g.st;
                if (inSmoke(g.root.position)) { st.blindT = 2.0; if (st.state === 'alert') st.state = 'patrol'; g.cone.material.color.setHex(0x94a3b8); }
                if (st.blindT > 0) { st.blindT -= dt; continue; }

                let dest = st.wp[st.wi], spd = 2.1;
                if (st.state === 'investigate' && st.invPos) { dest = st.invPos; spd = 2.7; st.invT -= dt; if (st.invT <= 0) st.state = 'patrol'; }
                else if (st.state === 'alert') { dest = P.pos; spd = 3.9; }

                // River & Building Avoidance: route across nearest bridge when crossing river!
                let navX = dest.x, navZ = dest.z;
                const gZ = g.root.position.z;
                const gInRiverZone = gZ > -61 && gZ < -43;
                const crossingRiver = (gZ > -44 && dest.z < -60) || (gZ < -60 && dest.z > -44) || gInRiverZone;
                const onBridge = Math.abs(g.root.position.x - 22) < 1.8 || Math.abs(g.root.position.x + 22) < 1.8;
                if (crossingRiver && !onBridge) {
                    const bridgeX = g.root.position.x >= 0 ? 22 : -22;
                    navX = bridgeX;
                    navZ = gZ > -52 ? -42 : -62;
                }

                const dx = navX - g.root.position.x, dz = navZ - g.root.position.z, d = Math.hypot(dx, dz);
                if (d > 0.4) {
                    const dirX = dx / d, dirZ = dz / d;
                    g.root.position.x += dirX * spd * dt; g.root.position.z += dirZ * spd * dt;
                    if (BO.World && BO.World.resolveHorizontal) BO.World.resolveHorizontal(g.root.position, 0.45, 1.8, false);
                    g.root.rotation.y += wrapA(Math.atan2(dirX, dirZ) - g.root.rotation.y) * Math.min(1, dt * 6);
                    st.walkPh += dt * spd * 3.5; F.walk(g.fig, st.walkPh, 1, st.state === 'alert');
                } else if (st.state === 'patrol') { st.wait += dt; if (st.wait > 1.2) { st.wait = 0; st.wi = (st.wi + 1) % st.wp.length; } }

                const pDx = P.pos.x - g.root.position.x, pDz = P.pos.z - g.root.position.z, pDist = Math.hypot(pDx, pDz);
                const dot = (Math.sin(g.root.rotation.y) * pDx + Math.cos(g.root.rotation.y) * pDz) / Math.max(0.01, pDist);
                const maxSight = hiddenInGrass ? 2.8 : (g.isShogun ? 11.0 : 9.0);
                const los = pDist < maxSight && dot > 0.68 && !inSmoke(P.pos) && canSeeLOS(g.root.position.clone().add(V(0, 1.4, 0)), P.pos.clone().add(V(0, 1.2, 0)), D.losMeshes);
                // Separated sight buildup from alert firing so alerted guards DO fire inside their vision cone!
                if (los && st.state !== 'alert') {
                    st.alertT += dt;
                    if (st.alertT > 0.35) { st.state = 'alert'; D.spotted++; g.cone.material.color.setHex(0xef4444); SFX.buzzer(); MG.toast('SPOTTED!', '#f87171'); }
                }
                if (st.state === 'alert') {
                    st.fireT -= dt;
                    if (st.fireT <= 0 && pDist < 24 && !inSmoke(P.pos) && canSeeLOS(g.root.position.clone().add(V(0, 1.4, 0)), P.pos.clone().add(V(0, 1.2, 0)), D.losMeshes)) {
                        st.fireT = 0.9; BO.FX.spawnTracer(g.root.position.clone().add(V(0, 1.4, 0)), P.pos.clone().add(V(0, 1.2, 0)), 0xff5533, 0.03, 0.08);
                        SFX.noise(0.1, 1300, 'bandpass', 0.8, 0.25); P.takeDamage(18, g.root.position, false);
                    }
                }
            }

            const atTorii = Math.hypot(P.pos.x, P.pos.z + 188) < 5.5;
            if (D.stealthKills >= D.guards.length) SR.done(S, 'TOTAL SHINOBI ANNIHILATION!');
            else if (D.scrollsGot >= 3 && atTorii) SR.done(S, 'GHOST HEIST — 3 SCROLLS STOLEN!');
            else if (D.shogunDown && atTorii) SR.done(S, 'SHOGUN ASSASSINATED & EXTRACTED!');
            else if ((D.scrollsGot >= 3 || D.shogunDown) && !D._shrineHint) { D._shrineHint = true; MG.toast('OBJECTIVE MET — EXTRACT AT NORTH TORII (-188m)!', '#818cf8'); }
        },
        scoreText: (S) => S.data.stealthKills + ' / ' + (S.data.guards || []).length,
        hud(S) {
            const left = (S.data.guards || []).filter((g) => g.alive).length;
            return SR.panel(SR.chip('GUARDS', left) + SR.chip('SCROLLS', S.data.scrollsGot + ' / 3') + SR.chip('SHOGUN', S.data.shogunDown ? 'SLAIN' : 'ALIVE') + SR.chip('SHURIKEN [F]', S.data.shurikenLeft) + SR.chip('SMOKE [Q]', S.data.smokeLeft), S);
        },
        stats: (S) => [['GUARDS SLAIN', S.data.stealthKills + ' / ' + (S.data.guards || []).length], ['SCROLLS STOLEN', S.data.scrollsGot + ' / 3'], ['SHOGUN', S.data.shogunDown ? 'ASSASSINATED' : 'ALIVE'], ['TIMES SPOTTED', S.data.spotted]]
    });

    /* =====================================================================
       9. THREE-HEADED DRAGON — Flagship Sculpted Titan Hydra + PBR Scales
    ===================================================================== */
    const HEAD_CFG = [
        { id: 'frost', name: 'GLACIUS', col: 0x38bdf8, accent: 0xbae6fd, hex: '#38bdf8', x: -14, hp: 1750, fireRate: 2.7 },
        { id: 'pyro', name: 'IGNIS', col: 0xf97316, accent: 0xfef08a, hex: '#f97316', x: 0, hp: 2050, fireRate: 2.4 },
        { id: 'volt', name: 'VOLTARIS', col: 0xa855f7, accent: 0xe9d5ff, hex: '#a855f7', x: 14, hp: 1750, fireRate: 2.7 }
    ];

    function makeDragonScalePBR(key, baseHex, fissureHex) {
        const size = 512;
        const height = new Float32Array(size * size);
        const rnd = L.mulberry32(key.split('').reduce((a, c) => a + c.charCodeAt(0), 7));
        const rows = 14, cols = 14, cellW = size / cols, cellH = size / rows;
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const row = Math.floor(y / cellH);
                const ox = (row % 2) * (cellW * 0.5);
                const cx = ((x + ox) % cellW) / cellW - 0.5;
                const cy = (y % cellH) / cellH - 0.5;
                const d = Math.hypot(cx * 1.1, cy * 0.95);
                const ridge = Math.max(0, 1 - d * 1.9);
                const ridgeDetail = Math.sin(cx * 14) * 0.04 + Math.cos(cy * 14) * 0.04;
                height[y * size + x] = Math.min(1, Math.pow(ridge, 0.65) + ridgeDetail);
            }
        }
        const rawCanvasTex = (suffix, draw, linear) => {
            const c = document.createElement('canvas'); c.width = size; c.height = size;
            draw(c.getContext('2d'), size, size);
            const t = new THREE.CanvasTexture(c);
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            if (!linear && THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding;
            else if (linear && THREE.LinearEncoding) t.encoding = THREE.LinearEncoding;
            t.anisotropy = 4;
            return t;
        };

        const map = L.canvasTex('drg-alb-' + key, size, size, (g) => {
            const img = g.createImageData(size, size);
            const cBase = new THREE.Color(baseHex);
            for (let i = 0; i < size * size; i++) {
                const h = height[i];
                const shade = 0.32 + h * 0.68 + (rnd() - 0.5) * 0.05;
                img.data[i * 4] = Math.min(255, Math.round(cBase.r * 255 * shade));
                img.data[i * 4 + 1] = Math.min(255, Math.round(cBase.g * 255 * shade));
                img.data[i * 4 + 2] = Math.min(255, Math.round(cBase.b * 255 * shade));
                img.data[i * 4 + 3] = 255;
            }
            g.putImageData(img, 0, 0);
        });
        map.wrapS = map.wrapT = THREE.RepeatWrapping;

        const normalMap = rawCanvasTex('nrm', (g) => {
            const img = g.createImageData(size, size);
            const str = 3.2;
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const xm = (x - 1 + size) % size, xp = (x + 1) % size;
                    const ym = (y - 1 + size) % size, yp = (y + 1) % size;
                    const dx = (height[y * size + xp] - height[y * size + xm]) * str;
                    const dy = (height[yp * size + x] - height[ym * size + x]) * str;
                    const nx = -dx, ny = -dy, nz = 1.0;
                    const inv = 1 / Math.hypot(nx, ny, nz);
                    const idx = (y * size + x) * 4;
                    img.data[idx] = Math.round((nx * inv * 0.5 + 0.5) * 255);
                    img.data[idx + 1] = Math.round((ny * inv * 0.5 + 0.5) * 255);
                    img.data[idx + 2] = Math.round((nz * inv * 0.5 + 0.5) * 255);
                    img.data[idx + 3] = 255;
                }
            }
            g.putImageData(img, 0, 0);
        }, true);

        const roughnessMap = rawCanvasTex('rgh', (g) => {
            const img = g.createImageData(size, size);
            for (let i = 0; i < size * size; i++) {
                const v = Math.round((0.86 - height[i] * 0.56) * 255);
                img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
                img.data[i * 4 + 3] = 255;
            }
            g.putImageData(img, 0, 0);
        }, true);

        const emissiveMap = L.canvasTex('drg-emi-' + key, size, size, (g) => {
            g.fillStyle = '#000000'; g.fillRect(0, 0, size, size);
            g.strokeStyle = fissureHex;
            g.lineCap = 'round';
            for (let v = 0; v < 18; v++) {
                let vx = rnd() * size, vy = rnd() * size;
                g.lineWidth = 1.5 + rnd() * 2.5;
                g.globalAlpha = 0.55 + rnd() * 0.45;
                g.beginPath(); g.moveTo(vx, vy);
                for (let s = 0; s < 6; s++) { vx += (rnd() - 0.5) * 70; vy += (rnd() - 0.5) * 70; g.lineTo(vx, vy); }
                g.stroke();
            }
            g.globalAlpha = 1;
        });
        emissiveMap.wrapS = emissiveMap.wrapT = THREE.RepeatWrapping;
        return { map, normalMap, roughnessMap, emissiveMap };
    }

    SR.define({
        id: 'sr_hydra_dragon', order: 9, name: 'Three-Headed Dragon', icon: '🐉', accent: '#dc2626', badge: 'FINAL BOSS', music: 'siege',
        musicState: (S) => ({ wardenAwake: true, wardenPhase2: (S.data.heads || []).filter((h) => h.alive).length <= 1 }),
        tagline: 'Obsidian Caldera Final Boss! Glacius, Ignis & Voltaris + Weakpoint Crits!',
        desc: 'Stand atop the molten Obsidian Caldera Sanctuary as a colossal Three-Headed Dragon rises from the magma! Take cover behind the 6 obsidian pillars, snipe Open Maw & Eye weakpoints (2.5x CRIT!), shatter the Phase 2 Magma Heart Core, and survive cliff-climbing undead!',
        heroLabel: 'SPEED RUN • FINAL BOSS SANCTUARY', stars: [240, 175, 130, 95], timeLimit: 420,
        standardWeapon: 'scarh', weaponLabel: 'SCAR-H + HEAVY BARREL', weaponNote: 'Aim for Open Jaws, Eyes & Phase 2 Heart Core (2.5x CRIT)!',
        keys: [['WASD', 'Use Obsidian Pillars as Cover'], ['LMB', 'Shoot Weakpoints'], ['SHIFT', 'Sprint'], ['SPACE', 'Jump Shockwaves']],
        map: {
            skybox: 'skybox-alien.png',
            atmosphere: { skyTop: 0x1e1b4b, skyBottom: 0xea580c, fogColor: 0x431407, fogDensity: 0.0028, sunColor: 0xfdba74, sunIntensity: 1.95, sunPos: [24, 70, 40], hemiSky: 0xfb923c, hemiGround: 0x7c2d12, hemiIntensity: 1.35 },
            boxes: [B(0, -0.5, 0, 180, 1, 180, 'concrete')],
            spawn: { x: 0, y: 0, z: 14, yaw: 0 }
        },
        build(S) {
            if (BO.MinigameAudio && BO.MinigameAudio.playStagedMusic) {
                BO.MinigameAudio.playStagedMusic('audio/music/FreePD CC0 Music Tracks/Epic Dramatic/epic-dramatic-strength-of-the-titans-661803f4.m4a', 0.28);
            }
            L.placeGLB(S.scene, 'staged_assets/3d_models/castle_kit/tower-square-base.glb', { pos: [-21, 0, -4], scale: 3.2 });
            L.placeGLB(S.scene, 'staged_assets/3d_models/castle_kit/tower-square-base.glb', { pos: [21, 0, -4], scale: 3.2 });
            L.placeGLB(S.scene, 'staged_assets/3d_models/mini_dungeon_kit/rocks.glb', { pos: [0, 0, -21], scale: 4.5 });

            const torsoPBR = makeDragonScalePBR('torso', 0x2a272a, '#f97316');
            const obsM = new THREE.MeshStandardMaterial({
                map: torsoPBR.map, normalMap: torsoPBR.normalMap, roughnessMap: torsoPBR.roughnessMap,
                emissive: 0xf97316, emissiveMap: torsoPBR.emissiveMap, emissiveIntensity: 0.72, metalness: 0.35
            });
            const rockM = std(0x57534e, 0.88), pillarObsM = std(0x27272a, 0.35, 0.65), goldM = std(0xf59e0b, 0.25, 0.85), hornM = std(0xfef3c7, 0.42);

            const lava = new THREE.Mesh(new THREE.RingGeometry(23.5, 150, 36), basic(0xf97316));
            lava.rotation.x = -Math.PI / 2; lava.position.y = -10; S.add(lava);
            const peak = new THREE.Mesh(new THREE.CylinderGeometry(24, 38, 44, 20), rockM); peak.position.y = -22; S.add(peak);
            const pad = new THREE.Mesh(new THREE.CircleGeometry(24, 28), std(0x44403c, 0.85, 0.1, { emissive: 0x431407, emissiveIntensity: 0.35 })); pad.rotation.x = -Math.PI / 2; pad.position.y = 0.02; S.add(pad);
            const arenaRing = new THREE.Mesh(new THREE.RingGeometry(15.5, 16.4, 32), basic(0xf97316, { side: THREE.DoubleSide }));
            arenaRing.rotation.x = -Math.PI / 2; arenaRing.position.y = 0.04; S.add(arenaRing);

            // 6 Obsidian Temple Pillars with REAL Attack Cover (bullet + fireball + breath blocking!)
            S.data.pillarMeshes = [];
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * TAU + Math.PI / 6, px = Math.cos(a) * 12.5, pz = Math.sin(a) * 12.5;
                const pil = S.box(px, 2.1, pz, 2.2, 4.2, 2.2, pillarObsM, { solid: true });
                const cap = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.42, 2.6), goldM); cap.position.set(px, 4.35, pz); S.add(cap);
                S.data.pillarMeshes.push(pil, cap);
            }
            for (const [tx, tz] of [[-19, 10], [19, 10], [-19, -10], [19, -10]]) S.add(A.torch(S, V(tx, 0, tz), 0xf97316, false));
            const lavaPts = [];
            for (let i = 0; i < 32; i++) { const a = (i / 32) * TAU; lavaPts.push(V(Math.cos(a) * 23.4, 0.28, Math.sin(a) * 23.4)); }
            const lb = A.bulbs(lavaPts, [0xf97316, 0xef4444, 0xfacc15], 0.16); S.add(lb); A.animateBulbs(S, lb, 6, 'chase');
            if (BO.Settings.getQualityPreset().pointLights) {
                const vLight = new THREE.PointLight(0xf97316, 2.0, 58, 1.2); vLight.position.set(0, 12, -16); S.add(vLight);
            }

            // SCULPTED TITAN HYDRA DRAGON
            const titan = new THREE.Group();
            titan.position.set(0, -14, -46);

            const torso = new THREE.Mesh(new THREE.DodecahedronGeometry(17.5, 1), obsM);
            torso.scale.set(1.22, 1.48, 0.98); torso.position.set(0, 22, -1); titan.add(torso);
            for (const s of [-1, 1]) {
                const pec = new THREE.Mesh(new THREE.DodecahedronGeometry(7.6, 0), obsM);
                pec.scale.set(1.25, 0.85, 0.72); pec.position.set(s * 7.8, 28, 10.5); pec.rotation.set(0.22, s * 0.25, -s * 0.18); titan.add(pec);
                const trim = new THREE.Mesh(new THREE.BoxGeometry(10.5, 1.1, 1.4), goldM);
                trim.position.set(s * 7.8, 24.5, 14.2); trim.rotation.z = s * 0.22; titan.add(trim);
            }
            for (let r = 0; r < 6; r++) {
                const rib = new THREE.Mesh(new THREE.TorusGeometry(13.6 - r * 1.1, 0.82, 8, 22), goldM);
                rib.rotation.x = Math.PI / 2 + 0.18; rib.position.set(0, 12 + r * 4.3, 4.2); titan.add(rib);
                const belly = new THREE.Mesh(new THREE.CylinderGeometry(7.2 - r * 0.65, 8.2 - r * 0.65, 2.5, 6), goldM);
                belly.scale.set(1.15, 1, 0.48); belly.position.set(0, 13.5 + r * 4.1, 14.5 - r * 0.55); belly.rotation.x = -0.22; titan.add(belly);
                const backRidge = new THREE.Mesh(new THREE.ConeGeometry(1.6 - r * 0.12, 4.8, 5), obsM);
                backRidge.position.set(0, 15 + r * 4.4, -14.5 + r * 0.4); backRidge.rotation.x = -0.75; titan.add(backRidge);
            }

            // Magma Heart Core (Phase 2 Shootable 2.5x Weakpoint!)
            const heartCore = new THREE.Mesh(new THREE.OctahedronGeometry(4.6, 1), basic(0xf97316));
            heartCore.position.set(0, 26.5, 15.2); titan.add(heartCore);
            const heartInner = new THREE.Mesh(new THREE.SphereGeometry(2.8, 12, 10), basic(0xfef08a));
            heartInner.position.copy(heartCore.position); titan.add(heartInner);
            const heartRingA = new THREE.Mesh(new THREE.TorusGeometry(6.4, 0.48, 8, 24), goldM);
            heartRingA.position.copy(heartCore.position); titan.add(heartRingA);
            const heartRingB = new THREE.Mesh(new THREE.TorusGeometry(7.8, 0.42, 8, 24), obsM);
            heartRingB.position.copy(heartCore.position); titan.add(heartRingB);
            const heartHit = new THREE.Mesh(new THREE.SphereGeometry(5.2, 10, 8), L.HIDDEN_MAT);
            heartHit.position.copy(heartCore.position); titan.add(heartHit);
            const heartTg = S.addTarget({ mesh: new THREE.Group(), hitMeshes: [heartHit], pos: V(0, 0, 0), life: 0, appear: 'none', inT: 0.01, death: 'none', bonus: true });
            heartTg.isMagmaHeart = true;

            // 16-Segment Smoothly Articulated Curved Tail (tangent-aligned, zero shearing!)
            const tailSegs = [];
            for (let ts = 0; ts < 16; ts++) {
                const sg = new THREE.Group();
                const u = ts / 15;
                const rBase = Math.max(0.55, 3.1 - u * 2.45);
                const body = new THREE.Mesh(new THREE.CylinderGeometry(rBase * 0.84, rBase, 3.8, 10), obsM);
                body.rotation.x = Math.PI / 2;
                const scute = new THREE.Mesh(new THREE.CylinderGeometry(rBase * 0.6, rBase * 0.68, 3.2, 6), goldM);
                scute.rotation.x = Math.PI / 2; scute.scale.set(1.2, 0.4, 1); scute.position.y = -rBase * 0.65;
                const spine = new THREE.Mesh(new THREE.ConeGeometry(0.62 - u * 0.35, 2.8 - u * 1.2, 5), basic(ts % 2 === 0 ? 0xf97316 : 0xfacc15));
                spine.position.set(0, rBase + 0.65, 0); spine.rotation.x = -0.48;
                sg.add(body, scute, spine);
                if (ts === 15) {
                    for (const fs of [-1, 1]) {
                        const fluke = new THREE.Mesh(new THREE.ConeGeometry(1.15, 5.2, 4), obsM);
                        fluke.position.set(fs * 1.5, 0, 2.8); fluke.rotation.set(Math.PI * 0.5, 0, -fs * 0.48); sg.add(fluke);
                    }
                }
                titan.add(sg); tailSegs.push(sg);
            }

            // Animated Clawed Forearms Slamming the Caldera Rim
            const arms = [];
            for (const s of [-1, 1]) {
                const armGrp = new THREE.Group(); armGrp.position.set(s * 16.5, 27.5, 7);
                const pauldron = new THREE.Mesh(new THREE.DodecahedronGeometry(4.8, 0), obsM);
                pauldron.scale.set(1.25, 0.9, 1.1); armGrp.add(pauldron);
                const pTrim = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.48, 6, 16), goldM);
                pTrim.position.set(0, -0.7, 0.6); pTrim.rotation.y = s * 0.4; armGrp.add(pTrim);
                const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.2, 13, 10), obsM);
                upperArm.position.set(s * 3.0, -6.0, 4.0); upperArm.rotation.set(0.55, 0, -s * 0.35); armGrp.add(upperArm);
                const elbow = new THREE.Mesh(new THREE.SphereGeometry(2.8, 10, 8), goldM);
                elbow.position.set(s * 5.5, -11.0, 7.5); armGrp.add(elbow);
                const forearm = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.8, 13, 10), obsM);
                forearm.position.set(s * 6.3, -12.7, 12.5); forearm.rotation.set(1.05, 0, -s * 0.12); armGrp.add(forearm);
                const hand = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6, 0), obsM);
                hand.scale.set(1.2, 0.65, 1.2); hand.position.set(s * 6.7, -13.9, 17.5); armGrp.add(hand);
                for (let c = 0; c < 4; c++) {
                    const cx = s * 6.7 + (c - 1.5) * 1.15;
                    const knuckle = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 1.5, 6), obsM);
                    knuckle.position.set(cx, -14.1, 19.2); knuckle.rotation.x = Math.PI * 0.42; armGrp.add(knuckle);
                    const talon = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.4, 6), hornM);
                    talon.position.set(cx, -15.1, 20.3); talon.rotation.x = Math.PI * 0.78; armGrp.add(talon);
                }
                titan.add(armGrp);
                arms.push({ grp: armGrp, s, slamCd: s < 0 ? 5.0 : 8.5, slamming: 0 });
            }

            // Translucent Veined Dragon Wings Gusting Embers
            const wingShape = new THREE.Shape();
            wingShape.moveTo(0, 0);
            wingShape.quadraticCurveTo(14, 9, 32, 3);
            wingShape.quadraticCurveTo(25, -4, 27, -14);
            wingShape.quadraticCurveTo(19, -8, 16, -18);
            wingShape.quadraticCurveTo(10, -10, 7, -19);
            wingShape.quadraticCurveTo(3, -10, 0, -15);
            wingShape.closePath();
            const wingMemGeo = new THREE.ShapeGeometry(wingShape, 10);
            const wingMemMat = std(0x991b1b, 0.35, 0.15, { emissive: 0xef4444, emissiveIntensity: 0.58, transparent: true, opacity: 0.78, side: THREE.DoubleSide });
            const veinMat = basic(0xf97316);
            const wings = [];
            for (const s of [-1, 1]) {
                const wg = new THREE.Group(); wg.position.set(s * 12, 34, -4);
                const innerBone = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.25, 19, 8), goldM);
                innerBone.rotation.z = s * 1.24; innerBone.position.set(s * 8.8, 3.2, 0);
                const wristThumb = new THREE.Mesh(new THREE.ConeGeometry(0.58, 2.8, 6), hornM);
                wristThumb.position.set(s * 17.5, 8.2, 0.4); wristThumb.rotation.z = -s * 0.28;
                const outer = new THREE.Group(); outer.position.set(s * 17.5, 6.4, 0);
                const mem = new THREE.Mesh(wingMemGeo, wingMemMat); mem.scale.x = s; outer.add(mem);
                for (const [fx, fy] of [[32, 3], [27, -14], [16, -18], [7, -19], [0, -15]]) {
                    const len = Math.hypot(fx, fy);
                    const spar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.58, len, 6), obsM);
                    spar.position.set((s * fx) * 0.5, fy * 0.5, 0);
                    spar.rotation.z = Math.atan2(fy, s * fx) - Math.PI / 2;
                    const vein = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, len * 0.9, 5), veinMat);
                    vein.position.copy(spar.position).add(V(0, 0, 0.16)); vein.rotation.z = spar.rotation.z;
                    outer.add(spar, vein);
                }
                wg.add(innerBone, wristThumb, outer); titan.add(wg);
                wings.push({ wg, outer, s });
            }
            S.add(titan);
            Object.assign(S.data, { wings, arms, heartCore, heartInner, heartRingA, heartRingB, heartTg, tailSegs });

            // THREE BESPOKE SCULPTED DRAGON HEADS + 20-SEGMENT SEAMLESS NECKS + CRIT WEAKPOINTS
            const NECK_ANCHORS = { frost: V(-9, 12, -32), pyro: V(0, 15, -31), volt: V(9, 12, -32) };
            const HEAD_POS = { frost: V(-14, 27.5, -15.5), pyro: V(0, 30.5, -14.5), volt: V(14, 27.5, -15.5) };
            const invisibleHitMat = L.HIDDEN_MAT;

            S.data.heads = HEAD_CFG.map((hc, idx) => {
                const hg = new THREE.Group();
                const pbr = makeDragonScalePBR(hc.id, 0x2f2f38, hc.hex);
                const armorScale = new THREE.MeshStandardMaterial({
                    map: pbr.map, normalMap: pbr.normalMap, roughnessMap: pbr.roughnessMap,
                    emissive: hc.col, emissiveMap: pbr.emissiveMap, emissiveIntensity: 0.72, metalness: 0.42
                });
                const elemGlow = basic(hc.col);
                const eyeIrisMat = basic(hc.accent);
                const pupilMat = basic(0x050508);

                // 20 Seamless Muscular Neck Segments connecting torso (u=0) into skull (u=1.0)
                const neckSegs = [], neckGlowMats = [];
                for (let k = 0; k < 20; k++) {
                    const u = k / 19;
                    const r = 2.15 - u * 0.75;
                    const segG = new THREE.Group();
                    const segMat = armorScale.clone();
                    const ns = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.94, r * 1.06, 2.1, 10), segMat);
                    ns.rotation.x = Math.PI / 2;
                    const scute = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.68, r * 0.74, 1.85, 6), goldM);
                    scute.rotation.x = Math.PI / 2; scute.scale.set(1.22, 0.42, 1); scute.position.set(0, -r * 0.68, 0);
                    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.48 - u * 0.16, 2.5 - u * 0.5, 5), elemGlow);
                    fin.position.set(0, r + 0.6, -0.2); fin.rotation.x = -0.68;
                    segG.add(ns, scute, fin);
                    hg.add(segG); neckSegs.push(segG); neckGlowMats.push(segMat);
                }

                const basePos = HEAD_POS[hc.id].clone();
                const neckBase = NECK_ANCHORS[hc.id].clone();
                const headPivot = new THREE.Group();
                headPivot.position.copy(basePos);

                // Layered Angular Cranium + Brow Ridges + Cheekbone Armor
                const cranium = new THREE.Mesh(new THREE.DodecahedronGeometry(2.55, 0), armorScale);
                cranium.scale.set(1.04, 0.78, 1.35); cranium.position.set(0, 0.3, -0.2);
                const snoutBase = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.9, 4.9, 6), armorScale);
                snoutBase.rotation.x = Math.PI / 2; snoutBase.scale.set(1.05, 1, 0.72); snoutBase.position.set(0, -0.05, 3.6);
                const noseBridge = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 4.2), goldM);
                noseBridge.position.set(0, 0.72, 3.2);
                const nasalHorn = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.85, 6), hornM);
                nasalHorn.position.set(0, 1.25, 4.8); nasalHorn.rotation.x = 0.52;

                // Glowing Molten Throat Core (2.5x CRIT Weakpoint!) + Forked Tongue
                const throatGlow = new THREE.Mesh(new THREE.SphereGeometry(1.42, 12, 10), elemGlow);
                throatGlow.position.set(0, -0.78, 2.75); throatGlow.userData.weakpoint = 'MAW';
                const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 2.6), basic(hc.accent));
                tongue.position.set(0, -0.88, 3.8);
                const forkL = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.9, 4), basic(hc.accent));
                forkL.rotation.x = Math.PI / 2; forkL.rotation.z = 0.35; forkL.position.set(-0.18, 0, 1.55);
                const forkR = forkL.clone(); forkR.rotation.z = -0.35; forkR.position.x = 0.18;
                tongue.add(forkL, forkR);

                // Articulated Lower Jaw + Chin Spikes + Double-Row Curved Ivory Fangs
                const jaw = new THREE.Group(); jaw.position.set(0, -1.05, 1.15);
                const jawMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 1.58, 4.5, 6), armorScale);
                jawMesh.rotation.x = Math.PI / 2; jawMesh.scale.set(1.02, 1, 0.56); jawMesh.position.set(0, -0.15, 2.25);
                const chinSp = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.35, 5), hornM);
                chinSp.position.set(0, -0.78, 3.6); chinSp.rotation.x = Math.PI * 0.72;
                jaw.add(jawMesh, chinSp);

                for (const fx of [-1.08, -0.72, -0.36, 0.36, 0.72, 1.08]) {
                    const isCanine = Math.abs(fx) > 0.6 && Math.abs(fx) < 0.85;
                    const zF = 5.4 - Math.abs(fx) * 1.4;
                    const fangU = new THREE.Mesh(new THREE.ConeGeometry(isCanine ? 0.24 : 0.16, isCanine ? 1.1 : 0.65, 6), hornM);
                    fangU.position.set(fx, -0.92, zF); fangU.rotation.x = Math.PI - 0.18; headPivot.add(fangU);
                    const innerU = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.48, 5), hornM);
                    innerU.position.set(fx * 0.7, -0.76, zF - 0.45); innerU.rotation.x = Math.PI - 0.22; headPivot.add(innerU);
                    const fangL = new THREE.Mesh(new THREE.ConeGeometry(isCanine ? 0.2 : 0.14, isCanine ? 0.88 : 0.52, 6), hornM);
                    fangL.position.set(fx * 0.88, 0.42, zF - 1.2); fangL.rotation.x = 0.16; jaw.add(fangL);
                }

                // Bilateral Eyes (2.5x CRIT Weakpoints!), Cheek Plates, Nostril Vents & Elemental Crowns
                const voltRings = [], nostrils = [], weakMeshes = [throatGlow];
                for (const fx of [-1, 1]) {
                    const cheek = new THREE.Mesh(new THREE.ConeGeometry(1.22, 3.4, 5), armorScale);
                    cheek.position.set(fx * 2.2, -0.25, -0.6); cheek.rotation.set(-Math.PI * 0.48, fx * 0.35, -fx * 0.38); headPivot.add(cheek);
                    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), elemGlow);
                    nostril.position.set(fx * 0.65, 0.32, 5.65); headPivot.add(nostril); nostrils.push(nostril);
                    const brow = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.56, 2.4), goldM);
                    brow.position.set(fx * 1.55, 1.25, 1.7); brow.rotation.set(0.18, fx * 0.2, fx > 0 ? -0.35 : 0.35); headPivot.add(brow);
                    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.54, 10, 8), eyeIrisMat);
                    eye.position.set(fx * 1.62, 0.82, 2.28); eye.userData.weakpoint = 'EYE'; headPivot.add(eye);
                    weakMeshes.push(eye);
                    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.72, 0.3), pupilMat);
                    slit.position.set(fx * 1.92, 0.82, 2.58); slit.userData.noHit = true; headPivot.add(slit);

                    if (hc.id === 'frost') {
                        const iceHornMat = std(0xbae6fd, 0.15, 0.2, { emissive: 0x38bdf8, emissiveIntensity: 0.7, transparent: true, opacity: 0.85 });
                        for (let ic = 0; ic < 3; ic++) {
                            const sp = new THREE.Mesh(new THREE.ConeGeometry(0.5 - ic * 0.06, 5.4 - ic * 0.85, 5), iceHornMat);
                            sp.position.set(fx * (1.2 + ic * 0.75), 2.4 - ic * 0.52, -1.6 - ic * 0.35);
                            sp.rotation.set(-0.68, 0, -fx * (0.24 + ic * 0.22)); headPivot.add(sp);
                            const beard = new THREE.Mesh(new THREE.ConeGeometry(0.28, 2.2 - ic * 0.3, 5), iceHornMat);
                            beard.position.set(fx * (1.45 + ic * 0.28), -1.1 - ic * 0.25, 0.8 - ic * 0.8);
                            beard.rotation.set(Math.PI * 0.8, 0, -fx * 0.35); headPivot.add(beard);
                        }
                    } else if (hc.id === 'pyro') {
                        for (let seg = 0; seg < 4; seg++) {
                            const hSeg = new THREE.Mesh(new THREE.ConeGeometry(0.86 - seg * 0.16, 2.6, 7), seg % 2 === 1 ? goldM : elemGlow);
                            hSeg.position.set(fx * (1.5 + seg * 0.72), 1.9 + seg * 1.0, -1.3 - seg * 1.1);
                            hSeg.rotation.set(-0.68 + seg * 0.22, 0, -fx * (0.48 - seg * 0.08)); headPivot.add(hSeg);
                        }
                    } else {
                        const antMain = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.46, 5.8, 6), elemGlow);
                        antMain.position.set(fx * 1.65, 3.4, -1.2); antMain.rotation.set(-0.35, 0, -fx * 0.42); headPivot.add(antMain);
                        const antFork = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.26, 2.8, 6), eyeIrisMat);
                        antFork.position.set(fx * 2.4, 4.4, -0.4); antFork.rotation.set(0.25, 0, -fx * 0.78); headPivot.add(antFork);
                        const pRing = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.1, 6, 14), eyeIrisMat);
                        pRing.position.set(fx * 2.25, 4.2, -1.5); pRing.rotation.x = Math.PI / 2; headPivot.add(pRing);
                        voltRings.push(pRing);
                        const frillWeb = new THREE.Mesh(new THREE.CircleGeometry(2.5, 6, -Math.PI * 0.4, Math.PI * 0.8), std(hc.col, 0.35, 0.1, { emissive: hc.col, emissiveIntensity: 0.75, transparent: true, opacity: 0.72, side: THREE.DoubleSide }));
                        frillWeb.position.set(fx * 1.9, 0.1, 0.2); frillWeb.rotation.y = fx > 0 ? 0.55 : Math.PI - 0.55; headPivot.add(frillWeb);
                    }
                }
                if (hc.id === 'frost') {
                    const centerIce = new THREE.Mesh(new THREE.ConeGeometry(0.55, 5.4, 5), elemGlow);
                    centerIce.position.set(0, 2.75, -1.7); centerIce.rotation.x = -0.62; headPivot.add(centerIce);
                } else if (hc.id === 'pyro') {
                    for (let vc = 0; vc < 4; vc++) {
                        const crest = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.6 - vc * 0.3, 5), vc % 2 ? goldM : elemGlow);
                        crest.position.set(0, 2.15 - vc * 0.22, 0.4 - vc * 1.25); crest.rotation.x = -0.45; headPivot.add(crest);
                    }
                }

                const hitSphere = new THREE.Mesh(new THREE.SphereGeometry(3.8, 10, 8), invisibleHitMat);
                hitSphere.position.set(0, 0.2, 1.8);
                headPivot.add(cranium, snoutBase, noseBridge, nasalHorn, throatGlow, tongue, jaw, hitSphere);
                hg.add(headPivot);

                const tg = S.addTarget({ mesh: hg, hitMeshes: [cranium, snoutBase, jawMesh, hitSphere], pos: V(0, 0, 0), life: 0, appear: 'none', inT: 0.01, death: 'none', bonus: true });
                const critTg = S.addTarget({ mesh: new THREE.Group(), hitMeshes: weakMeshes, pos: V(0, 0, 0), life: 0, appear: 'none', inT: 0.01, death: 'none', bonus: true });
                const hObj = Object.assign(tg, {
                    dragonHead: true, idx, id: hc.id, name: hc.name, col: hc.col, accent: hc.accent,
                    hp: hc.hp, maxHp: hc.hp, basePos, curPos: basePos.clone(), neckBase, headPivot, jaw, throatGlow,
                    neckSegs, neckGlowMats, voltRings, nostrils, critTg,
                    atkT: 1.5 + idx * 1.0, rate: hc.fireRate, deadHead: false, empowered: false, flinchT: 0, breathFxT: 0
                });
                critTg.isDragonCrit = true; critTg.parentHead = hObj;
                return hObj;
            });

            S.data.shots = []; S.data.hazards = []; S.data.beams = []; S.data.phase2 = false; S.data.climbT = 0; S.data.headsDown = 0;
            this._poseHeads(S, 0, performance.now() * 0.001, false);
        },
        _poseHeads(S, dt, tNow, canAttack) {
            const D = S.data, P = BO.Player;
            const cubic = (p0, c1, c2, p3, u, out) => {
                const m = 1 - u;
                return out.set(
                    m * m * m * p0.x + 3 * m * m * u * c1.x + 3 * m * u * u * c2.x + u * u * u * p3.x,
                    m * m * m * p0.y + 3 * m * m * u * c1.y + 3 * m * u * u * c2.y + u * u * u * p3.y,
                    m * m * m * p0.z + 3 * m * m * u * c1.z + 3 * m * u * u * c2.z + u * u * u * p3.z
                );
            };
            const ptA = V(), ptB = V(), ctrl1 = V(), ctrl2 = V(), skullAttach = V();
            const tanV = V(), upV = V(), rightV = V(), prevUp = V();
            const mat4 = new THREE.Matrix4();

            for (const h of D.heads || []) {
                if (h.voltRings) for (let vi = 0; vi < h.voltRings.length; vi++) h.voltRings[vi].rotation.z = tNow * (vi ? -4.2 : 4.2);

                if (h.deadHead) {
                    h.curPos.lerp(V(h.basePos.x, -10, h.basePos.z - 5), Math.min(1, dt * 1.6));
                    h.headPivot.position.copy(h.curPos);
                    h.headPivot.rotation.x = BO.Math.lerp(h.headPivot.rotation.x, 1.05, Math.min(1, dt * 2.4));
                    h.jaw.rotation.x = 0.08;
                } else {
                    const spd = h.empowered ? 2.4 : 1.45;
                    h.flinchT = Math.max(0, h.flinchT - dt);
                    const flinchY = h.flinchT > 0 ? Math.sin((h.flinchT / 0.45) * Math.PI) * 2.1 : 0;
                    h.curPos.set(
                        h.basePos.x + Math.sin(tNow * spd + h.idx * 2.1) * 2.5,
                        h.basePos.y + Math.cos(tNow * 1.7 + h.idx) * 1.85 + flinchY,
                        h.basePos.z + Math.sin(tNow * 1.1 + h.idx) * 1.2 - flinchY * 0.8
                    );
                    h.headPivot.position.copy(h.curPos);
                    h.headPivot.lookAt(P.pos.x, P.pos.y + 1.5, P.pos.z);
                    if (h.flinchT > 0) h.headPivot.rotation.x -= Math.sin((h.flinchT / 0.45) * Math.PI) * 0.45;

                    const charging = canAttack && h.atkT < 0.85;
                    h.jaw.rotation.x = charging ? 0.68 : 0.16 + Math.abs(Math.sin(tNow * 2.6 + h.idx)) * 0.22;
                    h.throatGlow.scale.setScalar(charging ? 1.72 : 1.0);
                    if (Math.random() < dt * (charging ? 26 : 6)) {
                        const np = V();
                        (h.nostrils[Math.random() < 0.5 ? 0 : 1]).getWorldPosition(np);
                        BO.FX.spawnParticles(np, 1, h.col, 1.4, 1.2, 0.35, 0.7);
                    }
                    if (canAttack) {
                        h.atkT -= dt;
                        if (h.atkT <= 0) { h.atkT = h.rate * (h.empowered ? 0.65 : 1.0); this._fireHeadAttack(S, h); }
                    }
                }

                // Seamless 20-Segment Neck reaching all the way into skull rear socket (u=1.0) with parallel-transport orientation!
                h.headPivot.updateMatrixWorld(true);
                skullAttach.set(0, -0.25, -1.2).applyMatrix4(h.headPivot.matrixWorld);
                const swayC = Math.sin(tNow * 1.8 + h.idx * 2.0) * 2.4;
                ctrl1.set(h.neckBase.x + swayC, h.neckBase.y + 11.5, h.neckBase.z - 2.5);
                ctrl2.set(skullAttach.x - swayC * 0.75, skullAttach.y - 3.5, skullAttach.z - 8.5);
                prevUp.set(0, 1, 0);
                const segCount = h.neckSegs.length;
                const chargeWave = (!h.deadHead && h.atkT < 0.9) ? (1 - h.atkT / 0.9) : -1;
                for (let k = 0; k < segCount; k++) {
                    const u = k / segCount;
                    const uNext = (k + 1) / segCount;
                    cubic(h.neckBase, ctrl1, ctrl2, skullAttach, u, ptA);
                    cubic(h.neckBase, ctrl1, ctrl2, skullAttach, uNext, ptB);
                    h.neckSegs[k].position.copy(ptA);
                    tanV.copy(ptB).sub(ptA);
                    if (tanV.lengthSq() < 1e-6) tanV.set(0, 0, 1);
                    else tanV.normalize();
                    upV.copy(prevUp).addScaledVector(tanV, -prevUp.dot(tanV));
                    if (upV.lengthSq() < 1e-4) upV.set(0, 0, 1).cross(tanV);
                    upV.normalize();
                    rightV.copy(upV).cross(tanV).normalize();
                    prevUp.copy(upV);
                    mat4.makeBasis(rightV, upV, tanV);
                    h.neckSegs[k].quaternion.setFromRotationMatrix(mat4);
                    // Travelling Throat Glow Pulse!
                    if (chargeWave >= 0) {
                        const pulse = Math.max(0, 1 - Math.abs(u - chargeWave) * 4.5);
                        h.neckGlowMats[k].emissiveIntensity = 0.72 + pulse * 1.65;
                        h.neckSegs[k].scale.setScalar(1 + pulse * 0.22);
                    } else {
                        h.neckGlowMats[k].emissiveIntensity = 0.72;
                        h.neckSegs[k].scale.setScalar(1);
                    }
                }
            }
        },
        progress: (S) => {
            const hs = S.data.heads || []; if (!hs.length) return 0;
            const tot = hs.reduce((a, h) => a + h.maxHp, 0), rem = hs.reduce((a, h) => a + Math.max(0, h.hp), 0);
            return 1 - rem / tot;
        },
        update(S, dt, lib, state) {
            const D = S.data, P = BO.Player, tNow = performance.now() * 0.001;
            for (const w of D.wings || []) {
                w.wg.rotation.z = w.s * Math.sin(tNow * 1.35) * 0.22;
                if (w.outer) w.outer.rotation.z = w.s * Math.sin(tNow * 1.35 - 0.65) * 0.24;
            }
            // Clawed Forearm Cliff-Edge Slams
            for (const arm of D.arms || []) {
                arm.slamCd -= dt;
                if (arm.slamCd <= 0 && arm.slamming <= 0) { arm.slamming = 1.0; arm.slamCd = 7 + Math.random() * 5; }
                if (arm.slamming > 0) {
                    const prev = arm.slamming;
                    arm.slamming = Math.max(0, arm.slamming - dt * 1.35);
                    const lift = Math.sin(arm.slamming * Math.PI);
                    arm.grp.rotation.x = -lift * 0.42;
                    if (prev > 0.35 && arm.slamming <= 0.35) {
                        BO.FX.spawnParticles(V(arm.s * 16, 0.8, -22), 16, 0xf97316, 6, 6, 0.5, 1.2);
                        SFX.rumble(0.35);
                    }
                }
            }
            if (D.heartCore) {
                const pulse = 1 + Math.sin(tNow * (D.phase2 ? 8 : 5)) * 0.18;
                D.heartCore.scale.setScalar(pulse);
                D.heartInner.scale.setScalar(pulse);
            }
            if (D.heartRingA) { D.heartRingA.rotation.z = tNow * 1.1; D.heartRingA.rotation.x = Math.sin(tNow * 0.8) * 0.35; }
            if (D.heartRingB) { D.heartRingB.rotation.z = -tNow * 0.85; D.heartRingB.rotation.y = Math.cos(tNow * 0.7) * 0.4; }

            // 16-Segment Smooth Curved Tail with Tangent Rotation per Segment (zero shearing!)
            const tPt = V(), tNext = V();
            for (let ts = 0; ts < (D.tailSegs || []).length; ts++) {
                const seg = D.tailSegs[ts];
                const evalTail = (idx, out) => out.set(
                    Math.sin(tNow * 1.4 + idx * 0.36) * (1.2 + idx * 1.15),
                    6 + idx * 0.85 + Math.cos(tNow * 1.9 + idx * 0.3) * 0.7,
                    -15 - idx * 2.8
                );
                evalTail(ts, tPt);
                evalTail(ts + 1, tNext);
                seg.position.copy(tPt);
                seg.lookAt(tNext);
            }

            this._poseHeads(S, dt, tNow, state === 'running');
            if (Math.random() < dt * 18) BO.FX.spawnParticles(V((Math.random() - 0.5) * 44, -2, (Math.random() - 0.5) * 44), 1, 0xf97316, 1.5, -2.5, 1.4, 0.7);
            if (state !== 'running') return;

            const rad = Math.hypot(P.pos.x, P.pos.z);
            if (rad > 22.5) { P.pos.x *= 22.5 / rad; P.pos.z *= 22.5 / rad; }

            if (!D.phase2 && D.headsDown >= 2) {
                D.phase2 = true;
                const last = D.heads.find((h) => !h.deadHead);
                if (last) {
                    last.empowered = true; last.hp = Math.min(last.maxHp, last.hp + 450); last.headPivot.scale.setScalar(1.24);
                    MG.toast(`${last.name} APEX AWAKENING — SHOOT MAGMA HEART & CLIFF CLIMBERS!`, '#f87171'); SFX.rumble(0.75);
                }
            }
            if (D.phase2 && D.headsDown < 3) {
                D.climbT -= dt;
                if (D.climbT <= 0 && SR.alive(S) < 8) {
                    D.climbT = 3.0;
                    const a = (Math.random() - 0.5) * Math.PI * 1.4;
                    const z = SR.spawnZ(S, Math.random() < 0.45 ? 'sprinter' : 'shambler', Math.sin(a) * 23.5, Math.cos(a) * 23.5, { y: -5.5, speed: 3.2, hp: 165, damage: 12 });
                    z.srClimbT = 1.4; z.srClimbA = a;
                }
            }
            // Real Cliff-Climbing Animation for Phase 2 Undead Climbers
            for (const z of D.zs) {
                if (z.alive && z.srClimbT > 0) {
                    z.srClimbT = Math.max(0, z.srClimbT - dt);
                    const p = 1 - z.srClimbT / 1.4;
                    z.pos.x = Math.sin(z.srClimbA) * (23.8 - p * 2.2);
                    z.pos.z = Math.cos(z.srClimbA) * (23.8 - p * 2.2);
                    z.pos.y = -5.5 * (1 - p);
                    z.stunTimer = 0.08;
                    if (Math.random() < dt * 10) BO.FX.spawnParticles(z.pos.clone().add(V(0, 1, 0)), 1, 0x78716c, 2, 4, 0.35, 0.9);
                }
            }
            SR.updateZ(S, dt, null, state !== 'running');

            // Update Breath Cones / Lightning Beams
            for (let i = D.beams.length - 1; i >= 0; i--) {
                const bm = D.beams[i]; bm.t -= dt;
                bm.mesh.material.opacity = Math.max(0, (bm.t / bm.maxT) * 0.85);
                if (bm.t <= 0) { S.scene.remove(bm.mesh); D.beams.splice(i, 1); }
            }

            // Projectile Update + REAL Obsidian Pillar Cover Check!
            for (let i = D.shots.length - 1; i >= 0; i--) {
                const sh = D.shots[i]; sh.life -= dt;
                const prevPos = sh.mesh.position.clone();
                sh.mesh.position.addScaledVector(sh.vel, dt);
                if (sh.homing && P.alive) sh.vel.lerp(P.pos.clone().add(V(0, 1.1, 0)).sub(sh.mesh.position).normalize().multiplyScalar(15), Math.min(1, dt * 1.8));
                const blk = SR.rayBlocked(prevPos, sh.mesh.position, D.pillarMeshes);
                if (blk) {
                    BO.FX.spawnParticles(blk.point, 14, sh.col, 6, 7, 0.45, 1.15);
                    SFX.bonk();
                    S.scene.remove(sh.mesh); D.shots.splice(i, 1); continue;
                }
                if (sh.mesh.position.distanceTo(P.pos.clone().add(V(0, 1.1, 0))) < sh.rad + 0.7) {
                    P.takeDamage(sh.dmg, sh.mesh.position, true); BO.FX.spawnExplosion(sh.mesh.position.clone(), 2.2, sh.col);
                    S.scene.remove(sh.mesh); D.shots.splice(i, 1); continue;
                }
                if (sh.life <= 0 || sh.mesh.position.y <= 0.1) { BO.FX.spawnParticles(sh.mesh.position.clone(), 8, sh.col, 3, 2, 0.35, 1.0); S.scene.remove(sh.mesh); D.shots.splice(i, 1); }
            }
            for (let i = D.hazards.length - 1; i >= 0; i--) {
                const hz = D.hazards[i]; hz.t -= dt;
                if (hz.t <= 0) {
                    BO.FX.spawnExplosion(hz.pos.clone(), hz.rad, hz.col); SFX.rumble(0.45);
                    if (Math.hypot(P.pos.x - hz.pos.x, P.pos.z - hz.pos.z) <= hz.rad && P.pos.y < 1.5) P.takeDamage(hz.dmg, hz.pos, true);
                    S.scene.remove(hz.ring); D.hazards.splice(i, 1);
                }
            }
        },
        _fireHeadAttack(S, h) {
            const P = BO.Player, D = S.data, mPos = new THREE.Vector3();
            h.throatGlow.getWorldPosition(mPos);
            const pTarget = P.pos.clone().add(V(0, 1.15, 0));

            const spawnBeam = (from, to, col, rad, dur) => {
                const dir = to.clone().sub(from), len = dir.length();
                const geo = new THREE.CylinderGeometry(rad * 0.4, rad, len, 10, 1, true);
                geo.translate(0, len * 0.5, 0); geo.rotateX(Math.PI / 2);
                const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
                m.position.copy(from); m.lookAt(to); S.add(m);
                D.beams.push({ mesh: m, t: dur, maxT: dur });
            };
            const spawnOrb = (target, spd, col, rad, dmg, homing) => {
                const m = new THREE.Mesh(new THREE.SphereGeometry(rad, 10, 8), basic(col)); m.position.copy(mPos); S.add(m);
                D.shots.push({ mesh: m, vel: target.clone().sub(mPos).normalize().multiplyScalar(spd), rad, dmg, col, life: 4.5, homing });
            };
            const spawnTele = (x, z, delay, rad, col, dmg) => {
                const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, rad, 24), basic(col, { transparent: true, opacity: 0.65, side: THREE.DoubleSide }));
                ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.08, z); S.add(ring);
                D.hazards.push({ ring, pos: V(x, 0.2, z), t: delay, rad, col, dmg });
            };

            if (h.empowered) {
                const roll = Math.floor(Math.random() * 3);
                if (roll === 0) { MG.toast(`${h.name}: CATACLYSM METEORS!`, '#f97316'); for (let k = 0; k < 4; k++) spawnTele(P.pos.x + (Math.random() - 0.5) * 14, P.pos.z + (Math.random() - 0.5) * 14, 1.35 + k * 0.2, 3.2, 0xf97316, 22); }
                else if (roll === 1) { MG.toast(`${h.name}: APEX BARRAGE!`, '#facc15'); for (let k = -2; k <= 2; k++) spawnOrb(P.pos.clone().add(V(k * 3.5, 1.2, 0)), 22, h.col, 0.75, 16, false); }
                else { MG.toast(`${h.name}: SEISMIC ROAR!`, '#ef4444'); spawnTele(P.pos.x, P.pos.z, 1.1, 4.6, 0xef4444, 24); spawnOrb(pTarget, 14, h.accent, 0.85, 18, true); }
                return;
            }
            if (h.id === 'frost') {
                const blk = SR.rayBlocked(mPos, pTarget, D.pillarMeshes);
                spawnBeam(mPos, blk ? blk.point : pTarget, 0xbae6fd, 1.6, 0.48);
                if (blk) { BO.FX.spawnParticles(blk.point, 12, 0x38bdf8, 5, 5, 0.4, 1.1); SFX.bonk(); }
                else P.takeDamage(10, mPos, false);
                spawnOrb(pTarget, 19, h.col, 0.68, 13, false);
            } else if (h.id === 'pyro') {
                const blk = SR.rayBlocked(mPos, pTarget, D.pillarMeshes);
                spawnBeam(mPos, blk ? blk.point : pTarget, 0xfef08a, 1.35, 0.45);
                if (blk) { BO.FX.spawnParticles(blk.point, 14, 0xf97316, 5, 5, 0.4, 1.2); SFX.bonk(); }
                for (const ox of [-2.4, 0, 2.4]) spawnOrb(P.pos.clone().add(V(ox, 1.1, 0)), 20, 0xf97316, 0.65, 13, false);
            } else {
                const blk = SR.rayBlocked(mPos, pTarget, D.pillarMeshes);
                spawnBeam(mPos, blk ? blk.point : pTarget, 0xe9d5ff, 0.38, 0.35);
                if (blk) { BO.FX.spawnParticles(blk.point, 12, 0xa855f7, 6, 6, 0.4, 1.0); SFX.shatter(); }
                else { P.takeDamage(11, mPos, false); SFX.shatter(); }
                spawnOrb(pTarget, 13, 0xe9d5ff, 0.6, 13, true);
            }
        },
        onHit(S, ent, info) {
            const D = S.data;
            if (ent.isMagmaHeart) {
                if (!D.phase2 || D.headsDown >= 3) return false;
                const last = D.heads.find((h) => !h.deadHead);
                if (!last) return false;
                const critDmg = info.dmg * 2.5;
                last.hp -= critDmg; last.flinchT = 0.45;
                S.hits++; SFX.ding(1.3);
                BO.FX.spawnParticles(info.pt, 14, 0xfef08a, 6, 4, 0.45, 1.2);
                MG.popup(info.pt, `HEART CORE 2.5× CRIT! -${Math.round(critDmg)}`, '#fde047', true);
                if (last.hp <= 0) {
                    last.hp = 0; last.deadHead = true; last.hitMeshes = []; last.critTg.hitMeshes = [];
                    D.headsDown++; S.kills++; S.bumpCombo();
                    const hp = V(); last.headPivot.getWorldPosition(hp); BO.FX.spawnExplosion(hp, 8, last.col); SFX.rumble(0.75);
                    SR.done(S, 'THREE-HEADED DRAGON SLAIN!');
                }
                return true;
            }
            if (ent.isDragonCrit) {
                const h = ent.parentHead;
                if (!h || h.deadHead) return false;
                const critDmg = info.dmg * 2.5;
                h.hp -= critDmg; h.flinchT = 0.45; S.hits++; S.headshots++;
                SFX.ding(1.25); BO.Sound.playBossIntro && BO.Sound.playBossIntro();
                BO.FX.spawnParticles(info.pt, 12, h.accent, 5, 4, 0.45, 1.15);
                MG.popup(info.pt, `${info.mesh?.userData?.weakpoint || 'WEAKPOINT'} 2.5× CRIT!`, '#fde047', true);
                if (h.hp <= 0) {
                    h.hp = 0; h.deadHead = true; h.hitMeshes = []; ent.hitMeshes = []; D.headsDown++; S.kills++; S.bumpCombo();
                    const hp = V(); h.headPivot.getWorldPosition(hp); BO.FX.spawnExplosion(hp, 8, h.col); SFX.rumble(0.75);
                    SR.stageBurst(S, hp, `${h.name} SLAIN`, D.headsDown - 1, 3, h.col);
                    if (D.headsDown >= 3) SR.done(S, 'THREE-HEADED DRAGON SLAIN!');
                }
                return true;
            }
            if (ent.dragonHead) {
                if (ent.deadHead) return false;
                ent.hp -= info.dmg * 1.15; S.hits++; SFX.thunk();
                if (ent.hp <= 0) {
                    ent.hp = 0; ent.deadHead = true; ent.hitMeshes = []; ent.critTg.hitMeshes = []; D.headsDown++; S.kills++; S.bumpCombo();
                    const hp = V(); ent.headPivot.getWorldPosition(hp); BO.FX.spawnExplosion(hp, 8, ent.col); SFX.rumble(0.75);
                    SR.stageBurst(S, hp, `${ent.name} SLAIN`, D.headsDown - 1, 3, ent.col);
                    if (D.headsDown >= 3) SR.done(S, 'THREE-HEADED DRAGON SLAIN!');
                }
                return true;
            }
            return SR.hitZ(S, ent, info);
        },
        scoreText: (S) => S.data.headsDown + ' / 3',
        hud(S) {
            return SR.panel((S.data.heads || []).map((h) => {
                const pct = Math.max(0, Math.round(h.hp / h.maxHp * 100));
                return `<div class="sr-chip ${h.deadHead ? '' : h.empowered ? 'bad' : ''}">${h.name} ${h.deadHead ? '<b>SLAIN</b>' : `<span class="sr-bar"><i style="width:${pct}%;background:#${h.col.toString(16).padStart(6, '0')}"></i></span><b>${Math.round(h.hp)}</b>`}</div>`;
            }).join('') + (S.data.phase2 ? SR.chip('CLIMBERS', SR.alive(S), true) : ''), S);
        },
        stats: (S) => [['HEADS SLAIN', S.data.headsDown + ' / 3'], ['ZOMBIE CLIMBERS SLAIN', S.kills - S.data.headsDown]]
    });
})(window);
