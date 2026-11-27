/* ============================================================================
   BASTION WARDEN — Master Zombie Citadel Gate, Commander Claws, Turrets,
   Searchlights, Explosive Barrels, Biomass Orbs & 2-Phase Walking Warden Boss
============================================================================ */
(function (BO) {
    'use strict';
    const { group, part, box, drum, rod, ring, sign, std, basic, texMat, sentryTurret, explosiveBarrel } = BO.CourseScenery;
    const { SFX } = BO.MinigameLib;
    const MA = () => BO.MinigameAudio;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);

    const BW_RAY = new THREE.Raycaster();
    function hasBiLOS(from, to, extraMeshes) {
        const wm = (BO.World && BO.World.worldMeshes && BO.World.worldMeshes.length) ? BO.World.worldMeshes : null;
        const list = wm || extraMeshes;
        if (!list || !list.length) return true;
        const dir = to.clone().sub(from);
        const dist = dir.length();
        if (dist < 0.45) return true;
        dir.divideScalar(dist);
        BW_RAY.set(from, dir);
        BW_RAY.near = 0.2;
        BW_RAY.far = Math.max(0.25, dist - 0.30);
        if (BW_RAY.intersectObjects(list, false).length > 0) return false;
        // Reverse check prevents one-sided mesh backface leaks
        BW_RAY.set(to, dir.clone().negate());
        BW_RAY.near = 0.2;
        BW_RAY.far = Math.max(0.25, dist - 0.30);
        if (BW_RAY.intersectObjects(list, false).length > 0) return false;
        if (wm && extraMeshes && extraMeshes.length) {
            BW_RAY.set(from, dir);
            BW_RAY.far = Math.max(0.25, dist - 0.30);
            if (BW_RAY.intersectObjects(extraMeshes, false).length > 0) return false;
        }
        return true;
    }

    function makeHands(S) {
        const root = group(S.scene);
        const flesh = std(0x3a4f30, 0.65, 0.08);
        const rotFlesh = std(0x273322, 0.78, 0.05);
        const bone = std(0xe6d2a2, 0.42, 0.12);
        const cuffMat = std(0x1e293b, 0.85, 0.1);
        const carapaceMat = std(0x311042, 0.32, 0.55, { emissive: 0x6b21a8, emissiveIntensity: 0.35 });
        const veinMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, emissive: 0x65a30d, emissiveIntensity: 1.1, roughness: 0.3 });
        const sacMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, emissive: 0x22c55e, emissiveIntensity: 1.25, roughness: 0.2, transparent: true, opacity: 0.92 });
        const clawTipMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0x84cc16, emissiveIntensity: 0.45, roughness: 0.28, metalness: 0.25 });
        const stage2Parts = [], stage3Parts = [], sacs = [], clawTips = [];

        const wrists = [-1, 1].map((side) => {
            const wrist = group(root, side * 0.29, -0.24, -0.46);
            // Layered muscular mutated forearm + tattered quarantine sleeve cuff
            rod(wrist, V(0, -0.17, 0.27), V(0, -0.02, 0.03), 0.078, flesh, 0.062);
            rod(wrist, V(side * 0.02, -0.12, 0.20), V(side * 0.015, -0.02, 0.05), 0.044, rotFlesh, 0.036);
            const cuff = part(wrist, new THREE.CylinderGeometry(0.082, 0.092, 0.075, 10), cuffMat, 0, -0.14, 0.22);
            cuff.rotation.x = Math.PI * 0.35;

            // Contoured palm + exposed dorsal bone ridge
            const palm = part(wrist, new THREE.IcosahedronGeometry(0.094, 1), flesh, 0, 0, -0.025);
            palm.scale.set(0.95, 0.50, 1.08);
            const ridge = part(wrist, new THREE.BoxGeometry(0.042, 0.024, 0.14), bone, 0, 0.032, 0.04);
            ridge.rotation.x = -0.15;

            // Glowing bioluminescent acid sacs & pulsing vein network
            for (const [sx, sy, sz, sr] of [[side * 0.032, 0.036, 0.09, 0.032], [side * -0.024, 0.024, 0.15, 0.026]]) {
                const sac = part(wrist, new THREE.SphereGeometry(sr, 10, 8), sacMat, sx, sy, sz);
                sac.scale.set(0.9, 0.72, 1.3);
                sacs.push(sac);
            }
            for (let i = 0; i < 4; i++) {
                rod(wrist, V((i - 1.5) * 0.022, 0.038, 0.14), V((i - 1.5) * 0.032, 0.026, -0.052), 0.005, veinMat);
            }

            // 4 Razor-clawed mutated fingers + opposable thumb + knuckle spikes
            for (let i = 0; i < 4; i++) {
                const x = (i - 1.5) * 0.034;
                const knk = part(wrist, new THREE.ConeGeometry(0.014, 0.036, 5), bone, x, 0.028, -0.068);
                knk.rotation.x = -0.4;
                const tip = V(x * 1.42, 0.048, -0.165 + Math.abs(x) * 0.45);
                rod(wrist, V(x, 0, -0.045), tip, 0.019, flesh, 0.012);
                const talon = rod(wrist, tip, V(tip.x * 1.06, -0.018, tip.z - 0.095), 0.014, clawTipMat, 0.001);
                clawTips.push(talon);
            }
            rod(wrist, V(side * -0.056, 0, 0), V(side * -0.118, 0.032, -0.098), 0.024, flesh, 0.013);
            clawTips.push(rod(wrist, V(side * -0.118, 0.032, -0.098), V(side * -0.132, -0.012, -0.168), 0.013, clawTipMat, 0.001));

            // Stage 2 Evolution Visuals: jagged forearm bone spikes & swollen acid glands
            const s2 = group(wrist); s2.visible = false;
            for (let k = 0; k < 3; k++) {
                const sp = part(s2, new THREE.ConeGeometry(0.018, 0.09, 5), bone, side * 0.058, 0.02 - k * 0.032, 0.04 + k * 0.065);
                sp.rotation.set(-0.55, 0, -side * 0.9);
            }
            const bigSac = part(s2, new THREE.SphereGeometry(0.044, 10, 8), sacMat, side * -0.018, 0.048, 0.02);
            bigSac.scale.set(1.0, 0.7, 1.35);
            sacs.push(bigSac);
            stage2Parts.push(s2);

            // Stage 3 Apex Evolution Visuals: obsidian-violet carapace + glowing dorsal crystals
            const s3 = group(wrist); s3.visible = false;
            const plate = part(s3, new THREE.BoxGeometry(0.11, 0.038, 0.20), carapaceMat, 0, 0.042, 0.09);
            plate.rotation.x = -0.28;
            for (let k = 0; k < 3; k++) {
                const crys = part(s3, new THREE.OctahedronGeometry(0.024, 0), clawTipMat, side * 0.02, 0.072 - k * 0.018, 0.01 + k * 0.065);
                crys.scale.set(0.65, 1.8, 0.65);
                crys.rotation.x = -0.35;
            }
            stage3Parts.push(s3);

            wrist.rotation.set(0, side * 0.21, side * 0.32);
            return wrist;
        });
        root.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; o.frustumCulled = false; } });
        return { root, wrists, stage2Parts, stage3Parts, sacs, veinMat, clawTipMat, clawTips };
    }

    function build(S, losMeshes) {
        const steel = texMat('diamond_plate', 4, 4);
        const rust = texMat('rusted_metal', 4, 4);
        const copper = std(0xb87344, 0.38, 0.72), armor = std(0x475a66, 0.44, 0.66);
        const amber = basic(0xffa75a), acid = basic(0x84ff4f), shell = std(0x2e2a38, 0.65);

        // Reinforced Pressure-Lock Blast Gate + Overhead Catwalk Bridge + Rotating Beacons
        const gate = group(S.scene, 0, 0, -10);
        const doors = [-1, 1].map((side) => {
            const panel = group(gate, side * 2.35, 0, 0);
            const slab = box(panel, 0, 1.7, 0, 4.65, 3.4, 0.56, steel);
            if (losMeshes) losMeshes.push(slab);
            if (S.solid) S.solid(slab);
            for (let j = 0; j < 5; j++) box(panel, 0, 0.42 + j * 0.6, 0.34, 4.38, 0.14, 0.18, armor);
            box(panel, side * -2.18, 1.7, 0.45, 0.12, 3.2, 0.12, amber);
            const coupler = drum(panel, 0, 1.55, 0.48, 0.64, 0.64, 0.42, copper);
            coupler.rotation.x = Math.PI / 2;
            const lens = part(panel, new THREE.IcosahedronGeometry(0.44, 1), acid, 0, 1.55, 0.80);
            const halo = ring(panel, 0, 1.55, 0.74, 0.58, 0.048, acid);
            return { panel, slab, lens, halo, side, hp: 2 };
        });
        // Gate overhead gantry & strobes
        box(gate, 0, 3.65, 0, 10.2, 0.5, 1.4, rust);
        const strobes = [-4.6, 4.6].map((sx) => {
            const b = part(gate, new THREE.SphereGeometry(0.22, 10, 8), basic(0xef4444), sx, 4.1, 0.6);
            return b;
        });
        S.collider(-4.72, 0, -10.45, 4.72, 3.4, -9.55);
        const barrier = BO.World.colliders.at(-1);
        sign(gate, 'PRESSURE LOCK — ACID / RUPTURE', 0, 4.35, 0.72, 6.2, 0.72, '#bef264', '#0f1b16');

        // Sweeping Fortress Searchlight Cones mounted on corner bastions
        const searchlights = [[-17.2, 5.2, -10], [17.2, 5.2, -10]].map(([sx, sy, sz], idx) => {
            const piv = group(S.scene, sx, sy, sz);
            box(piv, 0, 0, 0, 0.7, 0.55, 0.8, armor);
            const cone = new THREE.Mesh(
                new THREE.ConeGeometry(4.2, 22, 16, 1, true),
                new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.09, side: THREE.DoubleSide, depthWrite: false })
            );
            cone.position.set(0, -5.2, 10.5);
            cone.rotation.x = -Math.PI * 0.34;
            piv.add(cone);
            return { piv, phase: idx * Math.PI };
        });

        // 2 Automated Fortress Sentry Turrets (destroyable for Biomass + score!)
        const turrets = [[-6.5, 0, -13.2], [6.5, 0, -13.2]].map(([tx, ty, tz]) => {
            const t = sentryTurret();
            t.group.position.set(tx, ty, tz);
            S.scene.add(t.group);
            S.collider(tx - 0.55, 0, tz - 0.55, tx + 0.55, 1.6, tz + 0.55);
            return { ...t, x: tx, y: ty, z: tz, hp: 320, maxHp: 320, alive: true, fireCd: 1.2 };
        });

        // 5 Explosive Red Hazard Barrels placed near chokepoints & cover
        const barrels = [[-3.8, -14.8], [5.8, -16.5], [-8.2, -23.5], [3.5, -26.0], [-4.2, 3.5]].map(([bx, bz]) => {
            const b = explosiveBarrel();
            b.group.position.set(bx, 0, bz);
            S.scene.add(b.group);
            return { ...b, x: bx, z: bz, alive: true };
        });

        // Bastion Warden Mech-Walker in rear cradle
        const root = group(S.scene, 0, 0, -32), body = group(root, 0, 2.9, 0);
        box(body, 0, 0, 0, 3.7, 1.72, 2.9, armor);
        box(body, 0, 0.74, -0.3, 2.9, 0.60, 2.05, shell);
        const face = drum(body, 0, 0.18, 1.48, 0.88, 0.88, 0.38, copper, 16);
        face.rotation.x = Math.PI / 2;
        const iris = ring(body, 0, 0.18, 1.75, 0.65, 0.085, amber);
        const eye = part(body, new THREE.IcosahedronGeometry(0.50, 1), amber, 0, 0.18, 1.72);
        for (const side of [-1, 1]) {
            box(body, side * 1.98, 0.05, 0, 0.58, 1.32, 2.25, copper);
            // Shoulder missile pods
            box(body, side * 1.65, 1.15, -0.25, 0.82, 0.62, 1.15, rust);
            for (let m = 0; m < 3; m++) {
                const tube = drum(body, side * (1.42 + m * 0.22), 1.15, 0.36, 0.08, 0.08, 0.14, basic(0xf97316), 8);
                tube.rotation.x = Math.PI / 2;
            }
            for (let i = 0; i < 4; i++) box(body, side * 2.02, 0.72, -0.8 + i * 0.49, 0.48, 0.12, 0.22, steel);
            drum(body, side * 1.15, 1.08, -0.85, 0.24, 0.32, 1.45, steel);
        }
        const legs = [];
        for (const side of [-1, 1]) for (const front of [-1, 1]) {
            const hip = group(root, side * 1.4, 2.65, front * 0.9);
            rod(hip, V(0, 0, 0), V(side * 1.15, -0.48, front * 0.64), 0.23, armor);
            rod(hip, V(side * 1.15, -0.48, front * 0.64), V(side * 1.5, -2.45, front * 0.84), 0.17, copper, 0.28);
            box(hip, side * 1.5, -2.48, front * 0.84, 0.82, 0.3, 1.15, steel);
            legs.push({ hip, phase: side * front > 0 ? 0 : Math.PI });
        }

        const wave = ring(S.scene, 0, 0.15, 0, 1, 0.075, amber);
        wave.rotation.x = -Math.PI / 2; wave.visible = false;
        const reticle = ring(S.scene, 0, 0.12, 0, 2.5, 0.11, amber);
        reticle.rotation.x = -Math.PI / 2; reticle.visible = false;
        const mark = group(S.scene); mark.visible = false;
        for (const side of [-1, 1]) box(mark, side * 2.1, 0.16, 0, 0.14, 0.08, 20, amber);

        S.data.siege = {
            hands: makeHands(S), doors, barrier, strobes, searchlights, turrets, barrels,
            acidPools: [], biomassOrbs: [], plasmaCells: [],
            root, body, iris, eye, legs, wave, reticle, mark,
            gateOpen: false, opening: 0, awake: false, phase2: false,
            hp: 1500, maxHp: 1500, t: 0, cycle: 0, clock: 2.8, attack: 'walk',
            origin: V(), impact: V(), waveRadius: 0, waveHit: false,
            handBeat: 0, slamCd: 0, pounceCd: 0, claws: 0, summons: 0,
            biomass: 0, evoStage: 1, stepTimer: 0
        };
    }

    function dropBiomass(S, pos, count = 2) {
        const w = S.data.siege;
        for (let i = 0; i < count; i++) {
            const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), basic(0x84ff4f));
            m.position.set(pos.x + (Math.random() - 0.5) * 1.6, 0.55, pos.z + (Math.random() - 0.5) * 1.6);
            S.scene.add(m);
            w.biomassOrbs.push({ mesh: m, life: 28, ph: Math.random() * 6 });
        }
    }

    function spawnAcidPool(S, pos) {
        const w = S.data.siege;
        const g = new THREE.Group();
        g.position.set(pos.x, 0.05, pos.z);
        const pool = new THREE.Mesh(
            new THREE.CircleGeometry(2.35, 22),
            new THREE.MeshBasicMaterial({ color: 0x65f03c, transparent: true, opacity: 0.48, side: THREE.DoubleSide })
        );
        pool.rotation.x = -Math.PI / 2;
        const core = new THREE.Mesh(
            new THREE.CircleGeometry(1.35, 18),
            new THREE.MeshBasicMaterial({ color: 0xbef264, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
        );
        core.rotation.x = -Math.PI / 2; core.position.y = 0.01;
        const rim = new THREE.Mesh(
            new THREE.RingGeometry(2.15, 2.42, 24),
            new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
        );
        rim.rotation.x = -Math.PI / 2; rim.position.y = 0.015;
        g.add(pool, core, rim);
        const bubbles = [];
        for (let b = 0; b < 5; b++) {
            const ang = (b / 5) * Math.PI * 2, rad = 0.5 + (b % 2) * 0.75;
            const bm = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), basic(0xd9f99d));
            bm.position.set(Math.cos(ang) * rad, 0.08, Math.sin(ang) * rad);
            g.add(bm);
            bubbles.push({ mesh: bm, ph: b * 1.3 });
        }
        S.scene.add(g);
        w.acidPools.push({ mesh: g, mats: [pool.material, core.material, rim.material], bubbles, x: pos.x, z: pos.z, life: 6.5, tick: 0 });
    }

    function detonateBarrel(S, b, def) {
        if (!b.alive) return;
        b.alive = false; b.group.visible = false;
        const bp = V(b.x, 0.7, b.z);
        BO.FX.spawnExplosion(bp, 6.2, 0xf97316);
        SFX.rumble(0.75);
        S.award(350, bp, 'FUEL BARREL BLAST!', '#fb923c');
        dropBiomass(S, bp, 1);
        for (const h of S.data.humans) {
            if (h.alive && h.root.position.distanceTo(bp) < 6.8) def._damageHuman(S, h, 380, 'BARREL BLAST!');
        }
        damage(S, 320, bp, 6.8, def);
    }

    function damage(S, amount, pos, radius, def) {
        const w = S.data.siege;
        // Detonate nearby fuel barrels
        for (const b of w.barrels) {
            if (b.alive && Math.hypot(pos.x - b.x, pos.z - b.z) < radius + 0.85) detonateBarrel(S, b, def);
        }
        // Damage Fortress Sentry Turrets
        for (const t of w.turrets) {
            if (!t.alive) continue;
            if (Math.hypot(pos.x - t.x, pos.z - t.z) < radius + 0.9) {
                t.hp -= amount;
                BO.FX.spawnParticles(V(t.x, 1.2, t.z), 8, 0xfacc15, 4, 2, 0.3, 0.8);
                if (t.hp <= 0) {
                    t.alive = false; t.group.visible = false;
                    BO.FX.spawnExplosion(V(t.x, 1.0, t.z), 3.6, 0xf97316);
                    SFX.rumble(0.5); S.bumpCombo();
                    S.award(500, V(t.x, 1.5, t.z), 'TURRET DESTROYED!', '#fde047');
                    dropBiomass(S, V(t.x, 0.4, t.z), 2);
                }
            }
        }
        // Detonate Phase-2 Plasma Cells to stagger Warden immediately!
        for (let i = w.plasmaCells.length - 1; i >= 0; i--) {
            const pc = w.plasmaCells[i];
            if (pc.mesh.position.distanceTo(pos) < radius + 1.1) {
                BO.FX.spawnExplosion(pc.mesh.position, 5.2, 0x38bdf8);
                SFX.rumble(0.6);
                S.scene.remove(pc.mesh); w.plasmaCells.splice(i, 1);
                if (w.awake && w.hp > 0) {
                    w.attack = 'recover'; w.clock = 3.6; w.reticle.visible = false; w.wave.visible = false;
                    w.hp = Math.max(1, w.hp - 180);
                    S.award(450, w.body.getWorldPosition(V()), 'PLASMA OVERLOAD STUN!', '#38bdf8');
                    BO.Minigames.toast('WARDEN STAGGERED! CORE WIDE OPEN!', '#38bdf8');
                }
            }
        }
        // Breach Pressure Lock Doors
        if (!w.gateOpen) {
            for (const door of w.doors) {
                if (!door.hp || Math.hypot(pos.x - door.side * 2.35, pos.z + 9.35) > radius + 1.05) continue;
                door.hp--;
                door.lens.material = basic(door.hp ? 0xffb051 : 0x293533);
                door.halo.visible = door.hp > 0;
                BO.FX.spawnParticles(door.lens.getWorldPosition(V()), 14, door.hp ? 0xffb051 : 0x9af860, 4, 2, 0.4, 0.9);
                SFX.clack();
                S.award(120, door.lens.getWorldPosition(V()), door.hp ? 'LOCK CRACKED' : 'LOCK SHATTERED');
            }
            if (w.doors.every((d) => !d.hp)) {
                w.gateOpen = true;
                w.barrier.active = false;
                SFX.rumble(0.65);
                if (MA()) MA().hordeRoar();
                S.bumpCombo();
                S.award(500, V(0, 2.2, -9.4), 'BASTION BREACHED!', '#a8f67d');
                BO.Minigames.toast('PRESSURE LOCK BREACHED! Destroy the turrets & defenders!', '#a8f67d');
                S.data.cd5 = 0;
            }
        }
        // Damage Warden Boss
        if (!w.awake || w.hp <= 0 || Math.hypot(pos.x - w.root.position.x, pos.z - w.root.position.z) > radius + 2.45) return;
        const exposed = w.attack === 'recover';
        const hit = Math.min(w.hp, Math.round(amount * (exposed ? 1.9 : 0.72)));
        if (hit <= 0) return;
        w.hp -= hit;
        S.data.ult = Math.min(100, S.data.ult + (exposed ? 9 : 4.5));
        S.award(Math.round(hit * 1.3), w.body.getWorldPosition(V()), exposed ? 'EXPOSED CORE!' : 'WARDEN ARMOR', exposed ? '#fde047' : '#a8f67d');

        // Phase 2 Overclock at 50% HP!
        if (!w.phase2 && w.hp > 0 && w.hp <= w.maxHp * 0.5) {
            w.phase2 = true;
            BO.FX.spawnExplosion(w.root.position.clone().add(V(0, 2.6, 0)), 6.0, 0x38bdf8);
            SFX.rumble(0.9);
            if (MA()) MA().evolveSting();
            BO.Minigames.toast('WARDEN PHASE 2 OVERCLOCKED • Strike cyan plasma cells to stagger!', '#38bdf8');
            for (const sx of [-7, 7]) {
                const cell = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), basic(0x38bdf8));
                cell.position.set(sx, 0.9, -22);
                S.scene.add(cell);
                w.plasmaCells.push({ mesh: cell, ph: sx });
            }
        }
        if (w.hp <= 0) {
            w.hp = 0;
            BO.FX.spawnExplosion(w.root.position.clone().add(V(0, 2.2, 0)), 7.5, 0xffad65);
            w.root.visible = false;
            w.reticle.visible = false; w.wave.visible = false; w.mark.visible = false;
            S.kills++; S.bumpCombo();
            const timeBonus = Math.round(Math.max(0, (S.duration || 300) - S.t) * 20);
            S.award(3000 + timeBonus, w.root.position.clone().add(V(0, 2.6, 0)), 'WARDEN DESTROYED!', '#fde047');
            BO.Minigames.finish('BASTION SILENCED', { color: '#b3ee89' });
        }
    }

    function wake(S) {
        const w = S.data.siege;
        if (w.awake) return;
        w.awake = true; w.gateOpen = true; w.barrier.active = false;
        BO.Player.hp = Math.min(BO.Player.maxHp, BO.Player.hp + 150);
        S.data.cd5 = 0; S.data.ult = 100;
        BO.Minigames.toast('BASTION WARDEN AWAKENS • Jump shock rings, crack its glowing core!', '#ffd395');
        SFX.rumble(0.85);
        if (MA()) MA().hordeRoar();
    }

    function slam(S, def) {
        const w = S.data.siege;
        if (w.slamCd > 0) return;
        w.slamCd = 5.5; w.handBeat = 1; w.claws++;
        const pos = BO.Player.pos.clone();
        BO.FX.spawnExplosion(pos, 5.4, 0x84ff4f);
        SFX.rumble(0.5);
        if (MA()) MA().acidSplash();
        // Expanding 3D Bio-Rupture Shockwave Ring + Erupting Toxic Spikes
        const ringM = new THREE.Mesh(
            new THREE.RingGeometry(0.8, 1.35, 32),
            new THREE.MeshBasicMaterial({ color: 0xa3e635, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
        );
        ringM.rotation.x = -Math.PI / 2;
        ringM.position.set(pos.x, 0.14, pos.z);
        const spikes = [];
        for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2;
            const sp = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.6, 5), basic(k % 2 ? 0x4ade80 : 0xa3e635));
            sp.position.set(pos.x + Math.cos(a) * 2.4, 0.4, pos.z + Math.sin(a) * 2.4);
            sp.rotation.z = -Math.cos(a) * 0.3; sp.rotation.x = Math.sin(a) * 0.3;
            S.scene.add(sp); spikes.push(sp);
        }
        S.scene.add(ringM);
        let rt = 0;
        S.animate((dt) => {
            rt += dt;
            ringM.scale.setScalar(1 + rt * 11);
            ringM.material.opacity = Math.max(0, 0.9 - rt * 1.9);
            const scY = rt < 0.18 ? rt / 0.18 : Math.max(0.01, 1 - (rt - 0.18) / 0.34);
            for (const sp of spikes) sp.scale.set(1, scY, 1);
            if (rt > 0.52) {
                S.scene.remove(ringM);
                for (const sp of spikes) S.scene.remove(sp);
                return false;
            }
        });
        if (w.evoStage >= 2) spawnAcidPool(S, pos);
        for (const h of S.data.humans) {
            if (h.alive && h.root.position.distanceTo(pos) < 6.2) def._damageHuman(S, h, 185, 'SPORE RUPTURE!');
        }
        damage(S, 175, pos, 6.2, def);
    }

    function pounce(S, def) {
        const w = S.data.siege, P = BO.Player;
        if (w.pounceCd > 0) return false;
        w.pounceCd = 4.5; w.handBeat = 1;
        const fwd = P.getMoveDirectionVectors().forward;
        P.vel.x = fwd.x * 16.5;
        P.vel.z = fwd.z * 16.5;
        P.vel.y = 8.4;
        P.onGround = false;
        w._pouncing = true;
        if (MA()) MA().hordeRoar();
        BO.Minigames.toast('PREDATOR POUNCE!', '#a3e635');
        return true;
    }

    function update(S, dt, state, def) {
        const w = S.data.siege, p = BO.Player, cam = BO.App.worldCamera;
        w.hands.root.position.copy(cam.position);
        w.hands.root.quaternion.copy(cam.quaternion);
        w.handBeat = Math.max(0, w.handBeat - dt * 2.7);
        w.spitBeat = Math.max(0, (w.spitBeat || 0) - dt * 3.2);
        const evo = w.evoStage || 1;
        if (w.hands.stage2Parts) for (const p2 of w.hands.stage2Parts) p2.visible = evo >= 2;
        if (w.hands.stage3Parts) for (const p3 of w.hands.stage3Parts) p3.visible = evo >= 3;
        const bob = state === 'running' ? S.t : performance.now() * 0.001;
        if (w.hands.veinMat) {
            w.hands.veinMat.emissive.setHex(evo >= 3 ? 0xfacc15 : evo >= 2 ? 0x22d3ee : 0x65a30d);
            w.hands.veinMat.emissiveIntensity = 1.0 + Math.sin(bob * 5) * 0.35;
        }
        if (w.hands.sacs) {
            w.hands.sacs.forEach((sc, idx) => {
                const pulse = 1 + Math.sin(bob * 6 + idx) * 0.14 + (w.spitBeat || 0) * 0.35;
                sc.scale.set(0.9 * pulse, 0.72 * pulse, 1.3 * pulse);
            });
        }
        w.hands.wrists.forEach((wrist, i) => {
            const side = i ? 1 : -1, reach = Math.sin(w.handBeat * Math.PI), spit = Math.sin((w.spitBeat || 0) * Math.PI);
            wrist.position.set(
                side * (0.29 - reach * 0.11 + spit * 0.05),
                -0.24 + 0.012 * Math.sin(bob * 2.3 + i) + reach * 0.12 - spit * 0.04,
                -0.46 - reach * 0.24 + spit * 0.07
            );
            wrist.rotation.set(
                reach * -0.45 + spit * 0.24,
                side * (0.21 + reach * 0.48),
                side * (0.32 + 0.07 * Math.sin(bob * 2.5) - reach * 0.18)
            );
        });
        for (const sl of w.searchlights) sl.piv.rotation.y = Math.sin(bob * 0.55 + sl.phase) * 0.62;
        w.strobes.forEach((st, i) => { st.visible = Math.sin(bob * 8 + i * Math.PI) > 0; });
        if (!w.gateOpen) for (const d of w.doors) if (d.hp > 0) d.lens.rotation.y += dt * 2.0;

        if (state !== 'running') return;
        if (MA()) MA().tick(dt, { wardenAwake: w.awake, wardenPhase2: w.phase2 });

        w.slamCd = Math.max(0, w.slamCd - dt);
        w.pounceCd = Math.max(0, w.pounceCd - dt);

        // Pounce landing shockwave
        if (w._pouncing && p.onGround && p.vel.y <= 0.1) {
            w._pouncing = false;
            BO.FX.spawnExplosion(p.pos.clone(), 4.2, 0x84ff4f);
            if (MA()) MA().clawRend();
            for (const h of S.data.humans) if (h.alive && h.root.position.distanceTo(p.pos) < 4.8) def._damageHuman(S, h, 145, 'POUNCE SLAM!');
            damage(S, 140, p.pos, 4.8, def);
        }

        // Collect Biomass Orbs -> Trigger 3-Stage Bio-Evolution!
        for (let i = w.biomassOrbs.length - 1; i >= 0; i--) {
            const ob = w.biomassOrbs[i];
            ob.life -= dt;
            ob.mesh.rotation.y += dt * 3.4;
            ob.mesh.position.y = 0.55 + Math.sin(S.t * 4 + ob.ph) * 0.18;
            if (ob.mesh.position.distanceTo(p.pos.clone().add(V(0, 0.8, 0))) < 2.2) {
                w.biomass++;
                p.hp = Math.min(p.maxHp, p.hp + 25);
                S.award(180, ob.mesh.position, 'BIOMASS +1', '#a3e635');
                SFX.ding(1.25);
                S.scene.remove(ob.mesh); w.biomassOrbs.splice(i, 1);
                if (w.evoStage === 1 && w.biomass >= 4) {
                    w.evoStage = 2; p.maxHp = 420; p.hp = Math.min(p.maxHp, p.hp + 120);
                    if (MA()) MA().evolveSting();
                    BO.Minigames.toast('EVOLVED: STAGE 2 BROOD TYRANT! Triple Acid + Corrosive Pools!', '#a3e635');
                } else if (w.evoStage === 2 && w.biomass >= 9) {
                    w.evoStage = 3; p.maxHp = 520; p.hp = p.maxHp;
                    if (MA()) MA().evolveSting();
                    BO.Minigames.toast('EVOLVED: STAGE 3 APEX OVERLORD! Acid Pools Heal Horde + Shockwave Claws!', '#fde047');
                }
                continue;
            }
            if (ob.life <= 0) { S.scene.remove(ob.mesh); w.biomassOrbs.splice(i, 1); }
        }

        // Corrosive Acid Pools (damage enemies & heal horde in Stage 3) + bubbling toxic spore plumes
        for (let i = w.acidPools.length - 1; i >= 0; i--) {
            const ap = w.acidPools[i];
            ap.life -= dt; ap.tick -= dt;
            const fade = Math.min(1, ap.life * 0.35);
            if (ap.mats) {
                ap.mats[0].opacity = 0.45 * fade;
                ap.mats[1].opacity = 0.55 * fade;
                ap.mats[2].opacity = 0.72 * fade;
            } else if (ap.mesh.material) {
                ap.mesh.material.opacity = Math.min(0.48, ap.life * 0.15);
            }
            if (ap.bubbles) {
                for (const b of ap.bubbles) {
                    const cyc = (S.t * 2.2 + b.ph) % 1;
                    b.mesh.position.y = 0.04 + cyc * 0.32;
                    b.mesh.scale.setScalar(Math.sin(cyc * Math.PI) * 1.15);
                }
            }
            if (Math.random() < dt * 7) {
                BO.FX.spawnParticles(V(ap.x + (Math.random() - 0.5) * 2.6, 0.15, ap.z + (Math.random() - 0.5) * 2.6), 1, 0x84ff4f, 1.2, 2.4, 0.45, 0.7);
            }
            if (ap.tick <= 0) {
                ap.tick = 0.5;
                for (const h of S.data.humans) if (h.alive && Math.hypot(h.root.position.x - ap.x, h.root.position.z - ap.z) < 2.6) def._damageHuman(S, h, 38, 'ACID POOL');
                if (w.evoStage >= 3 && Math.hypot(p.pos.x - ap.x, p.pos.z - ap.z) < 2.6) p.hp = Math.min(p.maxHp, p.hp + 14);
            }
            if (ap.life <= 0) { S.scene.remove(ap.mesh); w.acidPools.splice(i, 1); }
        }

        // Automated Fortress Sentry Turrets (STRICT Bidirectional LOS — ZERO Wall-Shooting!)
        const extraLos = S.data.losMeshes;
        for (const t of w.turrets) {
            if (!t.alive || !w.gateOpen) continue;
            const muzzle = V(t.x, 1.32, t.z);
            let tgt = null, bestD = 24;
            const pd = Math.hypot(p.pos.x - t.x, p.pos.z - t.z);
            const pChest = p.pos.clone().add(V(0, 1.05, 0));
            if (pd < bestD && hasBiLOS(muzzle, pChest, extraLos)) { bestD = pd; tgt = pChest; }
            let allyTgt = null;
            for (const al of S.data.allies) {
                if (!al.alive) continue;
                const ad = Math.hypot(al.pos.x - t.x, al.pos.z - t.z);
                if (ad < bestD) {
                    const aChest = al.pos.clone().add(V(0, 1.0, 0));
                    if (hasBiLOS(muzzle, aChest, extraLos)) { bestD = ad; tgt = aChest; allyTgt = al; }
                }
            }
            if (tgt) {
                t.head.rotation.y = Math.atan2(tgt.x - t.x, tgt.z - t.z);
                t.fireCd -= dt;
                if (t.fireCd <= 0) {
                    t.fireCd = 0.42;
                    BO.FX.spawnTracer(muzzle, tgt, 0xef4444, 0.03, 0.07);
                    SFX.noise(0.04, 1500, 'bandpass', 1.4, 0.10);
                    if (allyTgt) allyTgt.takeDamage(18, 'torso', false, null, 'bullet');
                    else p.takeDamage(9, V(t.x, 1.2, t.z), false);
                }
            }
        }

        // Plasma Cells bobbing in Phase 2
        for (const pc of w.plasmaCells) {
            pc.mesh.rotation.y += dt * 2.5;
            pc.mesh.position.y = 1.0 + Math.sin(S.t * 3.5 + pc.ph) * 0.22;
        }

        if (w.gateOpen && w.opening < 1) {
            w.opening = Math.min(1, w.opening + dt * 0.72);
            for (const door of w.doors) {
                door.panel.position.x = door.side * (2.35 + 4.7 * w.opening);
                door.panel.updateMatrixWorld(true);
            }
        }
        if (!w.awake || w.hp <= 0) return;

        w.t += dt; w.clock -= dt;
        const stride = w.attack === 'walk' ? (w.phase2 ? 1.35 : 1.0) : 0.13;
        w.root.position.x = BO.Math.clamp(w.root.position.x + Math.sin(w.t * 0.85) * dt * 2.6 * stride, -11.5, 11.5);
        w.root.position.z = BO.Math.damp(w.root.position.z, -24.0, 0.65, dt);
        w.root.rotation.y = Math.atan2(p.pos.x - w.root.position.x, p.pos.z - w.root.position.z);
        w.body.position.y = 2.9 + Math.sin(w.t * 5) * 0.14 * stride;
        w.legs.forEach((l) => { l.hip.rotation.x = Math.sin(w.t * 3 + l.phase) * 0.21 * stride; });
        if (w.attack === 'walk') {
            w.stepTimer -= dt;
            if (w.stepTimer <= 0) { w.stepTimer = w.phase2 ? 0.65 : 0.9; if (MA()) MA().wardenStep(); }
        }
        w.iris.rotation.z += dt * (w.attack === 'recover' ? 6.0 : 2.6);
        w.eye.material = basic(w.attack === 'recover' ? 0x84ff4f : w.phase2 ? 0x38bdf8 : 0xffa75a);
        w.eye.scale.setScalar(w.attack === 'recover' ? 1.6 + Math.sin(w.t * 10) * 0.16 : 1);

        if (w.attack === 'walk' && w.clock <= 0) {
            w.cycle++; w.attack = w.cycle % 2 ? 'pulse' : 'strike'; w.clock = w.phase2 ? 1.2 : 1.45;
            w.origin.copy(w.root.position); w.impact.copy(p.pos); w.waveHit = false;
            w.reticle.position.set(w.impact.x, 0.14, w.impact.z); w.reticle.visible = w.attack === 'strike';
            w.mark.visible = w.attack === 'pulse'; w.mark.position.copy(w.origin);
            BO.Minigames.toast(w.attack === 'pulse' ? 'GROUND PULSE • JUMP OVER THE SHOCK RING!' : 'MORTAR LOCK • EVADE AMBER ZONE!', '#ffc988');
            SFX.beep(false);
        } else if (w.attack === 'pulse' && w.clock <= 0) {
            w.mark.visible = false; w.wave.visible = true; w.wave.position.set(w.origin.x, 0.3, w.origin.z);
            w.waveRadius = 0.2; w.attack = 'wave'; w.clock = 2.7; SFX.rumble(0.55);
        } else if (w.attack === 'wave') {
            const before = w.waveRadius; w.waveRadius += dt * (w.phase2 ? 17.5 : 15); w.wave.scale.setScalar(w.waveRadius);
            const dist = Math.hypot(p.pos.x - w.origin.x, p.pos.z - w.origin.z);
            if (!w.waveHit && dist >= before - 0.65 && dist <= w.waveRadius + 0.65 && p.pos.y < 0.65) {
                w.waveHit = true; p.takeDamage(28, w.origin, false);
            }
            for (const al of S.data.allies) {
                if (!al.alive) continue;
                const ad = Math.hypot(al.pos.x - w.origin.x, al.pos.z - w.origin.z);
                if (ad >= before - 0.5 && ad <= w.waveRadius + 0.5) al.takeDamage(22, 'torso', false, null, 'blast');
            }
            if (w.clock <= 0) {
                w.wave.visible = false; w.attack = 'recover'; w.clock = 2.9;
                BO.Minigames.toast('WARDEN CORE EXPOSED • Strike now for 1.9x damage!', '#a8f67d');
            }
        } else if (w.attack === 'strike') {
            w.reticle.scale.setScalar(1 + Math.max(0, w.clock) * 0.38);
            if (w.clock <= 0) {
                BO.FX.spawnExplosion(w.impact, 3.8, 0xffac52); w.reticle.visible = false;
                if (p.pos.distanceTo(w.impact) < 3.4) p.takeDamage(36, w.impact, false);
                for (const al of S.data.allies) if (al.alive && al.pos.distanceTo(w.impact) < 3.5) al.takeDamage(55, 'torso', false, null, 'blast');
                w.attack = 'recover'; w.clock = 2.9;
                BO.Minigames.toast('WARDEN CORE EXPOSED • Strike now for 1.9x damage!', '#a8f67d');
            }
        } else if (w.attack === 'recover' && w.clock <= 0) {
            w.attack = 'walk'; w.clock = w.phase2 ? 1.35 : 2.2;
        }
    }

    BO.BastionWarden = { build, damage, wake, slam, pounce, dropBiomass, spawnAcidPool, update, hasBiLOS };
})(window.BO);
