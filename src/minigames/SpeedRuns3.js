/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Speed Runs (part 3 — Showcase Missions)
     8. Ninja Stealth       — Moonlit Fortress, Koi Pond, Secret Scrolls, Smoke Bombs, LOS Raycasting
     9. Three-Headed Dragon — Obsidian Caldera Boss Arena + Sculpted Titanic Dragon Body & 3 Heads
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

    /* =====================================================================
       8. NINJA — 3x Expanded Samurai Citadel (3 Victory Paths, Shurikens, Roof Jumps, Stealth Grass)
    ===================================================================== */
    SR.define({
        id: 'sr_ninja', order: 8, name: 'Ninja Stealth', icon: '🥷', accent: '#6366f1', badge: 'STEALTH',
        tagline: '3x Larger Fortress! 3 Ways to Win: Ghost 3 Scrolls, Assassinate the Shogun, or Clear All 18 Guards!',
        desc: 'Infiltrate a massive 150m x 220m Samurai Citadel! Hide in Tall Bamboo Grass, cross Creaking Nightingale Floors slowly, use Roof-Jump Pads ([SPACE]), throw Silent Shurikens ([F]), Smoke Bombs ([Q]), and Rocks ([G/RMB]). WIN 3 WAYS: Steal all 3 Scrolls + Extract, Assassinate the Shogun + Extract, or Defeat all 18 Guards!',
        heroLabel: 'SPEED RUN • 3X GRAND SHINOBI CITADEL', stars: [300, 220, 165, 115], timeLimit: 540,
        blockFire: true, hideViewmodel: true, weaponNote: 'Shinobi Arsenal: Katana Backstab, 12 Shurikens, 5 Smokes, Rocks',
        keys: [['WASD', 'Sneak'], ['LMB / E', 'Katana / Scroll'], ['F', 'Shuriken (12)'], ['Q', 'Smoke Bomb (5)'], ['G / RMB', 'Throw Rock'], ['SHIFT', 'Shadow Dash']],
        guide: {
            objective: 'Achieve ANY of 3 Victory Conditions: (1) Steal 3 Scrolls + North Torii, (2) Kill the Red Shogun + North Torii, or (3) Eliminate all 18 Guards.',
            tips: [
                'Hide inside Tall Green Bamboo Grass clusters to shrink guard detection radius by 70%!',
                'Avoid sprinting across golden Creaking Nightingale floors—they emit sound ripples that lure nearby guards.',
                'Use [F] Throwing Shurikens for silent ranged takedowns on unarmored patrols.'
            ]
        },
        map: {
            atmosphere: { skyTop: 0x020617, skyBottom: 0x1e1b4b, fogColor: 0x0f172a, fogDensity: 0.0075, sunColor: 0xc7d2fe, sunIntensity: 0.58, sunPos: [-40, 60, -60], hemiSky: 0x818cf8, hemiGround: 0x111827, hemiIntensity: 0.92, moon: true },
            boxes: [B(0, -0.5, -90, 170, 1, 240, 'grass')],
            spawn: { x: 0, y: 0, z: 16, yaw: 0 }
        },
        build(S) {
            K.groundPlane(S, 240, 0x14261c, 0.002);
            const wallM = std(0x27272a, 0.88), shojiM = std(0xf1f5f9, 0.72), woodM = std(0x451a03, 0.85), redM = std(0xb91c1c, 0.55), bambooM = std(0x16a34a, 0.7);
            const losMeshes = [];
            const addSol = (x, y, z, w, h, d, m) => { const bx = S.box(x, y, z, w, h, d, m, { solid: true }); losMeshes.push(bx); return bx; };

            // 3x Larger Citadel Perimeter (-72..72, 20..-196)
            SR.wall(S, -72, 20, -72, -196, 5.2, wallM); SR.wall(S, 72, 20, 72, -196, 5.2, wallM);
            SR.wall(S, -72, -196, 72, -196, 5.2, wallM); SR.wall(S, -72, 20, 72, 20, 5.2, wallM);

            // Central Koi River + Twin Arched Bridges
            const pond = new THREE.Mesh(new THREE.PlaneGeometry(142, 16), std(0x0284c7, 0.15, 0.35));
            pond.rotation.x = -Math.PI / 2; pond.position.set(0, 0.03, -52); S.add(pond);
            for (const bx of [-22, 22]) {
                S.box(bx, 0.18, -52, 4.4, 0.35, 18, woodM, { solid: true });
                for (const sx of [-2.0, 2.0]) { const br = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.9, 18), redM); br.position.set(bx + sx, 0.65, -52); S.add(br); }
            }

            // Multi-District Pagodas & Shoji Screens across 3x compound!
            const buildings = [
                [-26, -12, 10, 4, 1], [26, -12, 10, 4, 1],
                [-42, -32, 9, 9, 2], [42, -32, 9, 9, 2],
                [-48, -86, 11, 11, 2], [48, -86, 11, 11, 2],
                [-16, -98, 12, 3, 1], [16, -98, 12, 3, 1],
                [-38, -142, 10, 10, 2], [38, -142, 10, 10, 2],
                [0, -146, 14, 12, 3] // Shogun Inner Keep
            ];
            for (const [x, z, w, d, tiers] of buildings) {
                addSol(x, 1.8, z, w, 3.6, d, shojiM);
                for (let t = 0; t < tiers; t++) {
                    const rf = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * (0.82 - t * 0.2), 1.6, 4), woodM);
                    rf.rotation.y = Math.PI / 4; rf.position.set(x, 4.2 + t * 2.2, z); S.add(rf);
                }
            }

            // Tall Stealth Bamboo Grass Patches (crouch/stand inside reduces sight detection!)
            S.data.grass = [[-14, 2], [14, -4], [-34, -22], [32, -26], [-28, -68], [28, -74], [-40, -118], [40, -122], [-18, -162], [18, -162]].map(([gx, gz]) => {
                const grp = new THREE.Group(); grp.position.set(gx, 0, gz);
                for (let k = 0; k < 10; k++) {
                    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 1.9, 6), bambooM);
                    b.position.set((Math.random() - 0.5) * 4.5, 0.95, (Math.random() - 0.5) * 4.5); grp.add(b);
                }
                S.add(grp); return V(gx, 0, gz);
            });

            // Creaking Nightingale Floorboards + Bamboo Roof-Jump Pads!
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

            for (let i = 0; i < 32; i++) {
                const tr = A.tree(1.5 + (i % 3) * 0.3, i % 2 ? 0xf472b6 : 0x14532d);
                tr.position.set((i % 2 ? -1 : 1) * (58 + (i % 4) * 2.5), 0, 12 - i * 6.4); S.add(tr);
            }
            for (const [lx, lz] of [[-8, 6], [8, 6], [-22, -52], [22, -52], [-12, -132], [12, -132], [-6, -184], [6, -184]]) S.add(A.torch(S, V(lx, 0, lz), 0xf97316, false));

            // 3 Golden Secret Scrolls!
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

            // North Imperial Torii Gate (Extraction)
            const torii = new THREE.Group();
            for (const sx of [-3.0, 3.0]) { const col = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 5.8, 10), redM); col.position.set(sx, 2.9, 0); torii.add(col); }
            const lintel = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.5, 0.5), redM); lintel.position.y = 5.4;
            const cap = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.32, 0.6), std(0x111827, 0.7)); cap.position.y = 5.8;
            const shrineLight = new THREE.Mesh(new THREE.RingGeometry(2.0, 2.4, 24), basic(0x38bdf8, { side: THREE.DoubleSide }));
            shrineLight.rotation.x = -Math.PI / 2; shrineLight.position.y = 0.04;
            torii.add(lintel, cap, shrineLight); torii.position.set(0, 0, -188); S.add(torii);

            // 18 Samurai Guards + Armored Shogun Boss!
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
            Object.assign(S.data, { rocks: [], shurikens: [], smokes: [], rockCd: 0, shurikenLeft: 12, smokeLeft: 5, dashCd: 0, stealthKills: 0, scrollsGot: 0, shogunDown: false, spotted: 0 });
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
                P.pos.addScaledVector(fwd, 5.5); SFX.whoosh(0.28); MG.toast('SHADOW DASH!', '#a5f3fc'); return true;
            }
            if (code === 'KeyE') { if (!this._grabScroll(S)) this._tryAssassinate(S); return true; }
            return false;
        },
        _grabScroll(S) {
            const P = BO.Player;
            for (const sc of S.data.scrolls || []) {
                if (!sc.collected && Math.hypot(P.pos.x - sc.pos.x, P.pos.z - sc.pos.z) < 3.0) {
                    sc.collected = true; sc.mesh.visible = false; sc.halo.visible = false; S.data.scrollsGot++;
                    SFX.star(2); S.award(900, sc.pos, 'SECRET SCROLL!', '#fde047'); MG.toast(`STOLE ${sc.name} (${S.data.scrollsGot}/3)!`, '#fde047'); return true;
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
            S.data.rockCd = 0.65;
            const cam = BO.App.worldCamera, dir = new THREE.Vector3(); cam.getWorldDirection(dir);
            const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11, 0), std(0x9ca3af, 0.9));
            m.position.copy(cam.position).addScaledVector(dir, 0.8); S.add(m);
            S.data.rocks.push({ mesh: m, vel: dir.multiplyScalar(16).add(V(0, 4.2, 0)) }); SFX.whoosh(0.16);
        },
        _throwShuriken(S) {
            const D = S.data;
            if (D.shurikenLeft <= 0) { MG.toast('OUT OF SHURIKENS!', '#cbd5e1'); return; }
            D.shurikenLeft--;
            const cam = BO.App.worldCamera, dir = new THREE.Vector3(); cam.getWorldDirection(dir);
            const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), std(0xe2e8f0, 0.2, 0.9));
            star.scale.set(1.4, 0.2, 1.4); star.position.copy(cam.position).addScaledVector(dir, 0.8); S.add(star);
            D.shurikens.push({ mesh: star, vel: dir.multiplyScalar(38), life: 2.2 }); SFX.whoosh(0.12);
        },
        _tryAssassinate(S) {
            const P = BO.Player;
            for (const g of S.data.guards || []) {
                if (!g.alive) continue;
                const d = Math.hypot(P.pos.x - g.root.position.x, P.pos.z - g.root.position.z);
                if (d > 3.2) continue;
                const fwdX = Math.sin(g.root.rotation.y), fwdZ = Math.cos(g.root.rotation.y);
                const dot = (fwdX * (P.pos.x - g.root.position.x) + fwdZ * (P.pos.z - g.root.position.z)) / Math.max(0.01, d);
                if (dot < 0.45 || g.st.blindT > 0 || g.st.state !== 'alert' || P.vel.y < -1.0) {
                    g.kill({ pt: g.root.position.clone().add(V(0, 1.3, 0)) });
                    S.data.stealthKills++; S.kills++; S.bumpCombo(); SFX.shatter();
                    if (g.isShogun) { S.data.shogunDown = true; MG.toast('SHOGUN ASSASSINATED! EXTRACT AT NORTH TORII!', '#fde047'); }
                    BO.FX.spawnParticles(g.root.position.clone().add(V(0, 1.2, 0)), 16, 0x6366f1, 4, 2, 0.4, 1.0);
                    S.award(g.isShogun ? 1500 : 450, g.root.position.clone().add(V(0, 1.9, 0)), g.isShogun ? 'SHOGUN SLAIN!' : 'KATANA TAKEDOWN!', '#818cf8');
                    return true;
                }
            }
            MG.toast('SNEAK BEHIND GUARD, USE SMOKE [Q], OR SHURIKEN [F]!', '#cbd5e1'); return false;
        },
        update(S, dt, lib, state) {
            const D = S.data, P = BO.Player;
            for (const sc of D.scrolls || []) if (!sc.collected) sc.mesh.rotation.x += dt * 3;
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
                const dx = dest.x - g.root.position.x, dz = dest.z - g.root.position.z, d = Math.hypot(dx, dz);
                if (d > 0.4) {
                    const dirX = dx / d, dirZ = dz / d;
                    g.root.position.x += dirX * spd * dt; g.root.position.z += dirZ * spd * dt;
                    g.root.rotation.y += wrapA(Math.atan2(dirX, dirZ) - g.root.rotation.y) * Math.min(1, dt * 6);
                    st.walkPh += dt * spd * 3.5; F.walk(g.fig, st.walkPh, 1, st.state === 'alert');
                } else if (st.state === 'patrol') { st.wait += dt; if (st.wait > 1.2) { st.wait = 0; st.wi = (st.wi + 1) % st.wp.length; } }

                const pDx = P.pos.x - g.root.position.x, pDz = P.pos.z - g.root.position.z, pDist = Math.hypot(pDx, pDz);
                const dot = (Math.sin(g.root.rotation.y) * pDx + Math.cos(g.root.rotation.y) * pDz) / Math.max(0.01, pDist);
                const maxSight = hiddenInGrass ? 2.8 : (g.isShogun ? 11.0 : 9.0);
                const los = pDist < maxSight && dot > 0.68 && !inSmoke(P.pos) && canSeeLOS(g.root.position.clone().add(V(0, 1.4, 0)), P.pos.clone().add(V(0, 1.2, 0)), D.losMeshes);
                if (los) {
                    st.alertT += dt;
                    if (st.alertT > 0.35 && st.state !== 'alert') { st.state = 'alert'; D.spotted++; g.cone.material.color.setHex(0xef4444); SFX.buzzer(); MG.toast('SPOTTED!', '#f87171'); }
                } else if (st.state === 'alert') {
                    st.fireT -= dt;
                    if (st.fireT <= 0 && pDist < 24 && canSeeLOS(g.root.position.clone().add(V(0, 1.4, 0)), P.pos.clone().add(V(0, 1.2, 0)), D.losMeshes)) {
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
            return SR.panel(SR.chip('GUARDS', left) + SR.chip('SCROLLS', S.data.scrollsGot + ' / 3') + SR.chip('SHOGUN', S.data.shogunDown ? 'SLAIN' : 'ALIVE') + SR.chip('SHURIKEN [F]', S.data.shurikenLeft) + SR.chip('SMOKE [Q]', S.data.smokeLeft));
        },
        stats: (S) => [['GUARDS SLAIN', S.data.stealthKills + ' / ' + (S.data.guards || []).length], ['SCROLLS STOLEN', S.data.scrollsGot + ' / 3'], ['SHOGUN', S.data.shogunDown ? 'ASSASSINATED' : 'ALIVE'], ['TIMES SPOTTED', S.data.spotted]]
    });

    /* =====================================================================
       9. THREE-HEADED DRAGON — Obsidian Caldera Boss Arena + Sculpted Titan Hydra
    ===================================================================== */
    const HEAD_CFG = [
        { id: 'frost', name: 'FROSTMAW', col: 0x38bdf8, accent: 0xbae6fd, x: -14, hp: 1650, fireRate: 2.6 },
        { id: 'pyro', name: 'PYROCLAST', col: 0xf97316, accent: 0xfef08a, x: 0, hp: 1950, fireRate: 2.3 },
        { id: 'volt', name: 'VOLTSCALE', col: 0xa855f7, accent: 0xe9d5ff, x: 14, hp: 1650, fireRate: 2.6 }
    ];

    SR.define({
        id: 'sr_hydra_dragon', order: 9, name: 'Three-Headed Dragon', icon: '🐉', accent: '#dc2626', badge: 'FINAL BOSS',
        tagline: 'Obsidian Caldera Final Boss! Sculpted 3-Headed Titan Dragon + Phase 2 Apex Climbers.',
        desc: 'Stand atop the molten Obsidian Caldera Sanctuary as a towering sculpted Three-Headed Hydra Dragon rises from the magma abyss! Destroy all 3 independently animated heads—Frostmaw, Pyroclast, and Voltscale—dodge Phase 2 Apex Cataclysm attacks, and repel undead climbers!',
        heroLabel: 'SPEED RUN • FINAL BOSS SANCTUARY', stars: [240, 175, 130, 95], timeLimit: 420,
        standardWeapon: 'scarh', weaponLabel: 'SCAR-H + HEAVY BARREL', weaponNote: 'Aim for glowing jaws & horns!',
        keys: [['WASD', 'Dodge on Caldera Peak'], ['LMB', 'Shoot Dragon Heads'], ['SHIFT', 'Sprint'], ['SPACE', 'Jump Shockwaves']],
        map: {
            atmosphere: { skyTop: 0x1e1b4b, skyBottom: 0xea580c, fogColor: 0x431407, fogDensity: 0.0028, sunColor: 0xfdba74, sunIntensity: 1.95, sunPos: [24, 70, 40], hemiSky: 0xfb923c, hemiGround: 0x7c2d12, hemiIntensity: 1.35 },
            boxes: [B(0, -0.5, 0, 180, 1, 180, 'concrete')],
            spawn: { x: 0, y: 0, z: 14, yaw: 0 }
        },
        build(S) {
            const rockM = std(0x57534e, 0.88), obsM = std(0x27272a, 0.35, 0.6), goldM = std(0xf59e0b, 0.25, 0.85), hornM = std(0xfef3c7, 0.45);
            // Volcanic Caldera Arena + Molten Magma Ocean below + Ruined Temple Columns & Glowing Lava Fissures
            const lava = new THREE.Mesh(new THREE.RingGeometry(23.5, 150, 36), basic(0xf97316));
            lava.rotation.x = -Math.PI / 2; lava.position.y = -10; S.add(lava);
            const peak = new THREE.Mesh(new THREE.CylinderGeometry(24, 38, 44, 20), rockM); peak.position.y = -22; S.add(peak);
            const pad = new THREE.Mesh(new THREE.CircleGeometry(24, 28), std(0x44403c, 0.85, 0.1, { emissive: 0x431407, emissiveIntensity: 0.35 })); pad.rotation.x = -Math.PI / 2; pad.position.y = 0.02; S.add(pad);
            // Glowing magma runes inlaid into the boss floor
            const arenaRing = new THREE.Mesh(new THREE.RingGeometry(15.5, 16.4, 32), basic(0xf97316, { side: THREE.DoubleSide }));
            arenaRing.rotation.x = -Math.PI / 2; arenaRing.position.y = 0.04; S.add(arenaRing);
            // Ruined Obsidian Temple Pillars (provide cover against straight fireballs!) + Flaming Braziers
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * TAU + Math.PI / 6, px = Math.cos(a) * 12.5, pz = Math.sin(a) * 12.5;
                S.box(px, 2.0, pz, 2.0, 4.0, 2.0, obsM, { solid: true });
                const cap = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.4, 2.5), goldM); cap.position.set(px, 4.1, pz); S.add(cap);
            }
            for (const [tx, tz] of [[-19, 10], [19, 10], [-19, -10], [19, -10]]) S.add(A.torch(S, V(tx, 0, tz), 0xf97316, false));

            // DRASTICALLY UPGRADED TITAN DRAGON SCULPT (Layered Scales, Magma Heart, Coiled Tail, Articulated Wings, Curved S-Necks, Distinct Head Archetypes)
            const titan = new THREE.Group();
            titan.position.set(0, -14, -46);
            const torso = new THREE.Mesh(new THREE.SphereGeometry(18, 22, 16), obsM); torso.scale.set(1.28, 1.48, 1.05); torso.position.y = 22; titan.add(torso);
            // Overlapping chest armor plates + dorsal magma spine ridge
            for (let r = 0; r < 6; r++) {
                const rib = new THREE.Mesh(new THREE.TorusGeometry(14.2 - r * 1.15, 0.85, 8, 20), goldM);
                rib.rotation.x = Math.PI / 2 + 0.16; rib.position.set(0, 12 + r * 4.4, 4.5); titan.add(rib);
                const plate = new THREE.Mesh(new THREE.BoxGeometry(10 - r * 0.9, 2.2, 2.4), obsM);
                plate.position.set(0, 14 + r * 4.2, 16.5 - r * 0.5); plate.rotation.x = -0.25; titan.add(plate);
            }
            const heartCore = new THREE.Mesh(new THREE.OctahedronGeometry(4.8, 1), basic(0xf97316));
            heartCore.position.set(0, 26, 15.2); titan.add(heartCore);
            // Coiled spiked tail sweeping behind caldera rim
            for (let ts = 0; ts < 10; ts++) {
                const seg = new THREE.Mesh(new THREE.ConeGeometry(2.6 - ts * 0.18, 5.5, 8), obsM);
                seg.position.set(Math.sin(ts * 0.45) * 18, 8 + ts * 1.2, -16 - ts * 3.5);
                seg.rotation.z = Math.cos(ts * 0.45) * 0.5; titan.add(seg);
            }
            // Giant multi-jointed clawed forearms gripping cliff
            for (const s of [-1, 1]) {
                const sh = new THREE.Mesh(new THREE.SphereGeometry(4.2, 12, 10), goldM); sh.position.set(s * 16, 26, 8); titan.add(sh);
                const arm = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.4, 24, 12), obsM);
                arm.position.set(s * 20, 16, 15); arm.rotation.set(0.75, 0, -s * 0.35); titan.add(arm);
                for (let c = -2; c <= 2; c++) {
                    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.75, 3.6, 6), hornM);
                    claw.position.set(s * 23 + c * 1.1, 14.5, 23); claw.rotation.x = Math.PI * 0.7; titan.add(claw);
                }
            }
            const wings = [];
            for (const s of [-1, 1]) {
                const wg = new THREE.Group(); wg.position.set(s * 14, 34, -2);
                const inner = new THREE.Mesh(new THREE.BoxGeometry(20, 1.8, 1.8), goldM); inner.position.set(s * 10, 4, 0); inner.rotation.z = s * 0.35;
                const outer = new THREE.Group(); outer.position.set(s * 18, 7, 0);
                for (let f = 0; f < 4; f++) {
                    const spar = new THREE.Mesh(new THREE.BoxGeometry(24, 0.9, 0.9), obsM);
                    spar.position.set(s * 12, -f * 4.5, 0); spar.rotation.z = s * (0.2 - f * 0.25); outer.add(spar);
                }
                const mem = new THREE.Mesh(new THREE.PlaneGeometry(42, 28), std(0x991b1b, 0.45, 0.2, { emissive: 0x7f1d1d, emissiveIntensity: 0.55, transparent: true, opacity: 0.92, side: THREE.DoubleSide }));
                mem.position.set(s * 10, -8, 0); outer.add(mem);
                wg.add(inner, outer); titan.add(wg); wings.push({ wg, outer, s });
            }
            S.add(titan); S.data.wings = wings; S.data.heartCore = heartCore;

            // THREE UNIQUE SCULPTED ARTICULATED HEADS (Frostmaw / Pyroclast / Voltscale) with 10-segment S-curve necks!
            S.data.heads = HEAD_CFG.map((hc, idx) => {
                const hg = new THREE.Group(); hg.position.set(hc.x, 12, -26);
                const armorScale = std(0x3f3f46, 0.28, 0.6, { emissive: hc.col, emissiveIntensity: 0.52 });
                const elemGlow = basic(hc.col);
                const neckSegs = [];
                for (let k = 0; k < 10; k++) {
                    const segG = new THREE.Group();
                    const ns = new THREE.Mesh(new THREE.CylinderGeometry(1.75 - k * 0.08, 1.95 - k * 0.08, 3.2, 12), armorScale);
                    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.58, 2.4, 5), elemGlow);
                    fin.position.set(0, 0.4, -1.8); fin.rotation.x = -0.8;
                    const chestBand = new THREE.Mesh(new THREE.TorusGeometry(1.75 - k * 0.07, 0.22, 6, 14), goldM);
                    chestBand.rotation.x = Math.PI / 2;
                    segG.add(ns, fin, chestBand);
                    segG.position.set(0, k * 2.1, k * 1.15);
                    hg.add(segG); neckSegs.push(segG);
                }
                const headPivot = new THREE.Group(); headPivot.position.set(0, 19.5, 11.2);
                const cranium = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.4, 6.8), armorScale);
                const snout = new THREE.Mesh(new THREE.BoxGeometry(3.1, 1.9, 5.2), armorScale); snout.position.set(0, -0.2, 5.0);
                const throatGlow = new THREE.Mesh(new THREE.SphereGeometry(1.4, 12, 10), elemGlow); throatGlow.position.set(0, -0.9, 4.0);
                const jaw = new THREE.Group(); jaw.position.set(0, -1.4, 2.2);
                const jawMesh = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.05, 4.8), armorScale); jawMesh.position.set(0, 0, 2.4); jaw.add(jawMesh);
                for (const fx of [-1.0, -0.45, 0.45, 1.0]) {
                    const fangU = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.95, 6), hornM); fangU.position.set(fx, -1.1, 6.8); fangU.rotation.x = Math.PI; headPivot.add(fangU);
                    const fangL = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.75, 6), hornM); fangL.position.set(fx, 0.55, 4.4); jaw.add(fangL);
                }
                for (const fx of [-1, 1]) {
                    const brow = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.65, 2.4), goldM); brow.position.set(fx * 1.5, 1.35, 2.6); brow.rotation.z = fx > 0 ? -0.35 : 0.35; headPivot.add(brow);
                    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), basic(hc.accent)); eye.position.set(fx * 1.55, 0.85, 3.6); headPivot.add(eye);
                    if (hc.id === 'frost') {
                        // Crystalline Ice Crown & Cheek Frills
                        for (let ic = 0; ic < 3; ic++) {
                            const sp = new THREE.Mesh(new THREE.ConeGeometry(0.42, 4.6 - ic * 0.8, 5), elemGlow);
                            sp.position.set(fx * (1.8 + ic * 0.4), 2.5 - ic * 0.6, -1.2 - ic * 0.5); sp.rotation.set(-0.6, 0, -fx * (0.28 + ic * 0.2)); headPivot.add(sp);
                        }
                    } else if (hc.id === 'pyro') {
                        // Massive Curved Obsidian Ram Horns
                        const horn1 = new THREE.Mesh(new THREE.ConeGeometry(0.78, 5.8, 7), elemGlow); horn1.position.set(fx * 1.9, 3.0, -1.5); horn1.rotation.set(-0.5, 0, -fx * 0.35); headPivot.add(horn1);
                        const crest = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 3.6), goldM); crest.position.set(0, 2.2, 0); headPivot.add(crest);
                    } else {
                        // Crackling Twin Lightning-Rod Antlers & Serpent Frill
                        const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.45, 5.6, 6), elemGlow); ant.position.set(fx * 1.6, 3.4, -1.0); ant.rotation.set(-0.3, 0, -fx * 0.4); headPivot.add(ant);
                        const frill = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.2, 0.25), elemGlow); frill.position.set(fx * 2.4, 0, 0.6); frill.rotation.y = fx * 0.55; headPivot.add(frill);
                    }
                }
                headPivot.add(cranium, snout, throatGlow, jaw); hg.add(headPivot);

                const tg = S.addTarget({ mesh: hg, hitMeshes: [cranium, snout, jawMesh], pos: V(hc.x, 10, -26), life: 0, appear: 'none', inT: 0.01, death: 'none', bonus: true });
                return Object.assign(tg, {
                    dragonHead: true, idx, id: hc.id, name: hc.name, col: hc.col, accent: hc.accent,
                    hp: hc.hp, maxHp: hc.hp, basePos: V(hc.x, 10, -26), headPivot, jaw, throatGlow, neckSegs,
                    atkT: 1.5 + idx * 1.0, rate: hc.fireRate, deadHead: false, empowered: false
                });
            });

            S.data.shots = []; S.data.hazards = []; S.data.phase2 = false; S.data.climbT = 0; S.data.headsDown = 0;
        },
        progress: (S) => {
            const hs = S.data.heads || []; if (!hs.length) return 0;
            const tot = hs.reduce((a, h) => a + h.maxHp, 0), rem = hs.reduce((a, h) => a + Math.max(0, h.hp), 0);
            return 1 - rem / tot;
        },
        update(S, dt, lib, state) {
            const D = S.data, P = BO.Player, tNow = performance.now() * 0.001;
            for (const w of D.wings || []) {
                w.wg.rotation.z = w.s * Math.sin(tNow * 1.35) * 0.24;
                if (w.outer) w.outer.rotation.z = w.s * Math.sin(tNow * 1.35 - 0.6) * 0.22;
            }
            if (D.heartCore) D.heartCore.scale.setScalar(1 + Math.sin(tNow * 5) * 0.16);
            if (Math.random() < dt * 18) BO.FX.spawnParticles(V((Math.random() - 0.5) * 44, -2, (Math.random() - 0.5) * 44), 1, 0xf97316, 1.5, -2.5, 1.4, 0.7);
            if (state !== 'running') return;

            const rad = Math.hypot(P.pos.x, P.pos.z);
            if (rad > 22.5) { P.pos.x *= 22.5 / rad; P.pos.z *= 22.5 / rad; }

            for (const h of D.heads || []) {
                if (h.deadHead) { h.root.position.y = BO.Math.lerp(h.root.position.y, -20, dt * 1.5); h.headPivot.rotation.x = BO.Math.lerp(h.headPivot.rotation.x, 0.9, dt * 2); continue; }
                const sway = Math.sin(tNow * (h.empowered ? 2.4 : 1.5) + h.idx * 2.1);
                h.root.position.set(h.basePos.x + sway * 2.4, h.basePos.y + Math.cos(tNow * 1.8 + h.idx) * 1.8, h.basePos.z);
                h.headPivot.lookAt(P.pos.x, P.pos.y + 1.5, P.pos.z);
                // Smooth undulating serpentine S-curve across all 10 neck segments!
                h.neckSegs.forEach((seg, si) => {
                    const u = si / 9;
                    seg.position.x = Math.sin(tNow * 2.2 + h.idx * 1.7 + u * 3.2) * (1 - u) * 2.2;
                    seg.rotation.y = Math.cos(tNow * 2.0 + u * 2.5) * 0.22;
                });
                const mouthCharge = h.atkT < 0.65 ? 0.55 : 0.14 + Math.abs(Math.sin(tNow * 2.6 + h.idx)) * 0.25;
                h.jaw.rotation.x = mouthCharge;
                h.throatGlow.scale.setScalar(h.atkT < 0.65 ? 1.55 : 1.0);
                h.atkT -= dt;
                if (h.atkT <= 0) { h.atkT = h.rate * (h.empowered ? 0.65 : 1.0); this._fireHeadAttack(S, h); }
            }

            if (!D.phase2 && D.headsDown >= 2) {
                D.phase2 = true;
                const last = D.heads.find((h) => !h.deadHead);
                if (last) {
                    last.empowered = true; last.hp = Math.min(last.maxHp, last.hp + 450); last.headPivot.scale.setScalar(1.24);
                    MG.toast(`${last.name} APEX AWAKENING — ZOMBIES SCALING THE CALDERA!`, '#f87171'); SFX.rumble(0.75);
                }
            }
            if (D.phase2 && D.headsDown < 3) {
                D.climbT -= dt;
                if (D.climbT <= 0 && SR.alive(S) < 8) {
                    D.climbT = 3.0;
                    const a = (Math.random() - 0.5) * Math.PI * 1.4;
                    SR.spawnZ(S, Math.random() < 0.45 ? 'sprinter' : 'shambler', Math.sin(a) * 22, Math.cos(a) * 22, { y: -1.5, speed: 3.2, hp: 165, damage: 12 });
                }
            }
            SR.updateZ(S, dt, null, state !== 'running');

            for (let i = D.shots.length - 1; i >= 0; i--) {
                const sh = D.shots[i]; sh.life -= dt; sh.mesh.position.addScaledVector(sh.vel, dt);
                if (sh.homing && P.alive) sh.vel.lerp(P.pos.clone().add(V(0, 1.1, 0)).sub(sh.mesh.position).normalize().multiplyScalar(15), Math.min(1, dt * 1.8));
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
                else { MG.toast(`${h.name}: SEISMIC ROAR!`, '#ef4444'); spawnTele(P.pos.x, P.pos.z, 1.1, 4.6, 0xef4444, 24); spawnOrb(P.pos.clone().add(V(0, 1.2, 0)), 14, h.accent, 0.85, 18, true); }
                return;
            }
            if (h.id === 'frost') { spawnOrb(P.pos.clone().add(V(0, 1.1, 0)), 19, h.col, 0.7, 14, false); spawnTele(P.pos.x + (Math.random() - 0.5) * 6, P.pos.z + (Math.random() - 0.5) * 6, 1.4, 2.8, 0x38bdf8, 16); }
            else if (h.id === 'pyro') { for (const ox of [-2.4, 0, 2.4]) spawnOrb(P.pos.clone().add(V(ox, 1.1, 0)), 20, 0xf97316, 0.65, 13, false); }
            else { spawnTele(P.pos.x, P.pos.z, 1.25, 3.0, 0xa855f7, 18); spawnOrb(P.pos.clone().add(V(0, 1.2, 0)), 13, 0xe9d5ff, 0.6, 13, true); }
        },
        onHit(S, ent, info) {
            if (ent.dragonHead) {
                if (ent.deadHead) return false;
                ent.hp -= info.dmg * 1.15; S.hits++; SFX.thunk();
                if (ent.hp <= 0) {
                    ent.hp = 0; ent.deadHead = true; ent.hitMeshes = []; S.data.headsDown++; S.kills++; S.bumpCombo();
                    const hp = new THREE.Vector3(); ent.headPivot.getWorldPosition(hp); BO.FX.spawnExplosion(hp, 8, ent.col); SFX.rumble(0.75);
                    MG.toast(`${ent.name} SLAIN! (${S.data.headsDown}/3)`, '#fde047');
                    if (S.data.headsDown >= 3) SR.done(S, 'THREE-HEADED DRAGON SLAIN!');
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
            }).join('') + (S.data.phase2 ? SR.chip('CLIMBERS', SR.alive(S), true) : ''));
        },
        stats: (S) => [['HEADS SLAIN', S.data.headsDown + ' / 3'], ['ZOMBIE CLIMBERS SLAIN', S.kills - S.data.headsDown]]
    });
})(window);
