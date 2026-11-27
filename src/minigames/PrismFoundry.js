/* ============================================================================
   PRISM FOUNDRY — AAA First-Person Arcane-Clockwork Platforming Campaign
   Cyan/Amber Polarity Phase Bridges [E], Magnetic Tether Anchors [Q], Mid-Air
   Lift [V], 8 Aerial Prism Cells, Rotating Laser Sweepers, Patrolling Clockwork
   Sentinel Drones, 3 Drive Relays, Rotating 3-Phase Governor Boss & Reactive
   Clockwork Synthwave Soundtrack (shifts Cyan Lydian <-> Amber Dorian!)
============================================================================ */
(function (BO) {
    'use strict';
    const { group, part, box, drum, rod, ring, sign, std, basic, texMat } = BO.CourseScenery;
    const A = BO.MinigameArt;
    const SFX = BO.MinigameLib.SFX, V = (x, y, z) => new THREE.Vector3(x, y, z);
    const MA = () => BO.MinigameAudio;
    const rooms = ['Casting hall', 'Piston gallery', 'Rotor spine', 'The governor'];
    const PALETTES = [0x6ff2e0, 0xffad66];

    function gear(parent, x, y, z, r, metal, teeth = 12) {
        const g = group(parent, x, y, z);
        ring(g, 0, 0, 0, r * 0.80, r * 0.13, metal);
        const hub = drum(g, 0, 0, 0, r * 0.27, r * 0.27, r * 0.25, metal, 12);
        hub.rotation.x = Math.PI / 2;
        for (let i = 0; i < teeth; i++) {
            const a = (i * Math.PI * 2) / teeth;
            const tooth = box(g, Math.sin(a) * r * 0.95, Math.cos(a) * r * 0.95, 0, r * 0.22, r * 0.26, r * 0.23, metal);
            tooth.rotation.z = -a;
            if (i % 3 === 0) {
                const spoke = box(g, Math.sin(a) * r * 0.48, Math.cos(a) * r * 0.48, 0, r * 0.12, r * 0.7, r * 0.16, metal);
                spoke.rotation.z = -a;
            }
        }
        return g;
    }

    function build(S) {
        const f = S.data.foundry = {
            phase: 0, room: 0, cells: 0, falls: 0, flips: 0, links: 0, prismsTaken: 0, sentinelsDown: 0,
            platforms: [], moving: [], gears: [], hooks: [], prisms: [], lasers: [], sentinels: [],
            plates: [], switches: [], check: V(0, 3.15, 1), activeHook: null, hookTime: 0, boost: true, engine: 0,
            cd: 0, shiftCd: 0, pullCd: 0, shotLatch: false, flash: 0, clock: 0, cycle: 0, bossTime: 0, bossHits: 0,
            sparks: [], complete: false, stageTimes: [], segmentStart: 0
        };
        BO.World.colliders = [];
        S.spawned = 9; // 3 Drive Relays + 3 Sentinel Drones + 3 Governor Seals
        S.scene.background = new THREE.Color(0x1b2c36);
        if (BO.Assets && BO.Assets.applySkybox) BO.Assets.applySkybox(S.scene, 'skybox-night.png');
        S.scene.fog = new THREE.FogExp2(0x1d2e3a, 0.0088);

        const Assets = BO.Assets;
        const deck = (Assets && Assets.pbrMat)
            ? Assets.pbrMat('cyberpunk/Industrial Maintenance/diamond-plate-walkway-001.png', 4, 4, { roughness: 0.36, metalness: 0.68 })
            : texMat('diamond_plate', 4, 4);
        const steel = texMat('rusted_metal', 4, 4), copper = std(0xc47b44, 0.36, 0.72);
        const gold = basic(0xffbf74), aqua = basic(0x72e8dc), laserM = basic(0xf97316);
        const mats = [aqua, gold], surface = [std(0x288d8a, 0.38, 0.54), std(0xb96c3e, 0.42, 0.54)];

        function platform(x, y, z, w, d, phase = -1) {
            const g = group(S.scene, x, y, z);
            const top = box(g, 0, -0.23, 0, w, 0.46, d, phase < 0 ? deck : surface[phase]);
            top.receiveShadow = true; top.castShadow = true;
            const edgeMat = phase < 0 ? copper : mats[phase];
            for (const side of [-1, 1]) {
                box(g, side * (w / 2 - 0.11), 0.015, 0, 0.14, 0.03, d - 0.12, edgeMat);
                box(g, 0, -0.46, side * (d / 2 - 0.3), w - 0.18, 0.28, 0.22, steel);
            }
            S.collider(x - w / 2, y - 0.55, z - d / 2, x + w / 2, y, z + d / 2);
            const p = { g, b: BO.World.colliders.at(-1), phase, x, y, z, w, d };
            if (phase >= 0) {
                const outline = new THREE.LineSegments(
                    new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 0.34, d)),
                    new THREE.LineBasicMaterial({ color: PALETTES[phase], transparent: true, opacity: 0.52 })
                );
                outline.position.set(x, y - 0.17, z); S.add(outline); p.outline = outline;
                p.b.active = phase === 0; g.visible = p.b.active; outline.visible = !p.b.active;
            }
            f.platforms.push(p); return p;
        }

        function press(x, y, z, w, d, axis, amp, rate) {
            const p = platform(x, y, z, w, d); p.axis = axis; p.amp = amp; p.rate = rate; f.moving.push(p);
            const foot = group(S.scene, x, -1, z); drum(foot, 0, 0, 0, 1.05, 1.5, 2.8, copper);
            p.piston = drum(S.scene, x, y / 2 - 0.6, z, 0.64, 0.64, 1, steel); return p;
        }

        function anchor(x, y, z) {
            const g = group(S.scene, x, y, z), loop = ring(g, 0, 0, 0, 0.80, 0.14, gold);
            part(g, new THREE.OctahedronGeometry(0.36), aqua, 0, 0, 0);
            rod(g, V(0, 0.8, 0), V(0, 6, 0), 0.09, copper);
            f.hooks.push({ g, loop, point: g.position });
        }

        function relay(x, y, z, label) {
            const g = group(S.scene, x, y, z); drum(g, 0, 0.13, 0, 0.92, 1.12, 0.3, steel, 8);
            for (const k of [-1, 1]) rod(g, V(k * 0.82, 0.28, 0), V(k * 0.55, 2.05, 0), 0.105, copper);
            const core = part(g, new THREE.OctahedronGeometry(0.56), aqua, 0, 1.5, 0);
            const halo = ring(g, 0, 1.5, 0, 0.90, 0.058, gold); sign(g, label, 0, 3.0, 0, 3.8, 0.56);
            if (Assets && Assets.placeGLB) {
                Assets.placeGLB(g, 'mini_dungeon_kit/chest.glb', { pos: [1.35, 0.02, 0.35], rot: -0.45, fitSize: [0.95, 0.8, 0.75] });
                Assets.placeGLB(g, 'platformer_kit/lever.glb', { pos: [-1.35, 0.02, 0.35], rot: 0.45, fitSize: [0.75, 0.95, 0.75] });
            }
            f.switches.push({ g, core, halo, done: false });
        }

        function prismCell(x, y, z) {
            const g = group(S.scene, x, y, z);
            const outer = ring(g, 0, 0, 0, 0.92, 0.075, aqua);
            const gem = part(g, new THREE.OctahedronGeometry(0.28), gold, 0, 0, 0);
            if (Assets && Assets.placeGLB) {
                Assets.placeGLB(gem, 'mini_dungeon_kit/coin.glb', { fitSize: [0.78, 0.78, 0.24] });
                Assets.placeGLB(g, 'mini_dungeon_kit/chest.glb', { pos: [0, -0.78, 0], fitSize: [0.62, 0.48, 0.52] });
            }
            f.prisms.push({ g, outer, gem, taken: false });
        }

        function laserSweeper(x, y, z, len = 7.5, spd = 1.65) {
            const piv = group(S.scene, x, y, z);
            drum(piv, 0, 0, 0, 0.35, 0.42, 0.65, copper, 10);
            box(piv, 0, 0.22, 0, len, 0.12, 0.12, laserM);
            f.lasers.push({ piv, x, y, z, half: len * 0.5, spd, hitCd: 0 });
        }

        function sentinel(x, y, z, phase) {
            const d = A.drone(phase ? 'armored' : 'speeder');
            d.mesh.position.set(x, y, z);
            const shield = ring(d.mesh, 0, 0, 0, 0.72, 0.055, mats[phase]);
            S.scene.add(d.mesh);
            f.sentinels.push({ mesh: d.mesh, rotors: d.rotors || [], shield, base: V(x, y, z), phase, alive: true, fireCd: 1.5 });
        }

        // Spatial platforming sequence: Phase Bridges -> Hydraulic Presses & Tether -> Rotor Spine -> Governor
        platform(0, 3, 0, 10, 13);
        platform(-2, 3.1, -10, 5.4, 5.5, 0);
        platform(1, 3.45, -16, 5.5, 5.7, 1);
        platform(1, 3.6, -24, 10, 11); relay(1, 3.6, -24, '01  /  CASTING');

        press(-2, 3.8, -34, 5.5, 6, 'x', 2.3, 1.1);
        press(1, 4.55, -42, 5.3, 6, 'y', 1.0, 1.4);
        anchor(0, 8.6, -44.5);
        platform(1, 4.5, -52, 10, 12); relay(1, 4.5, -54, '02  /  PRESSURE');
        laserSweeper(1, 4.7, -51, 8.2, 1.55);

        platform(-2, 4.8, -63, 5.7, 6, 1);
        platform(1.5, 5.25, -70.4, 5.4, 6.0, 0);
        press(0, 5.7, -78.2, 5.8, 7.3, 'x', 2.25, 1.4);
        anchor(0, 9.7, -80.8);
        platform(-1, 5.85, -89, 10, 14); relay(-1, 5.85, -90, '03  /  ROTOR');
        laserSweeper(-1, 6.05, -87.5, 8.4, -1.75);

        platform(0, 6, -99, 6.6, 8);
        platform(0, 6, -111, 22, 20);

        // 3 Patrolling Clockwork Sentinel Drones (match polarity [E] + fire [LMB]!)
        sentinel(0, 6.4, -20, 0);
        sentinel(-1, 7.3, -48, 1);
        sentinel(0, 8.4, -84, 0);

        // 8 Aerial Prism Cells
        for (const [px, py, pz] of [
            [-2, 4.7, -10], [1, 5.1, -16], [-1, 5.5, -34], [0, 7.6, -45.5],
            [-2, 6.5, -63], [1.5, 6.9, -70.4], [0, 8.8, -81.8], [0, 7.8, -99]
        ]) prismCell(px, py, pz);

        sign(S.scene, 'PRISM FOUNDRY', 0, 10, -12, 12, 1.6, '#ffcf98', '#14242c');
        sign(S.scene, 'THE RUNAWAY GOVERNOR', 0, 14.5, -123, 11, 1.15, '#ffcf98', '#14242c');

        // Cathedrals of Interlocking Gears, Industrial Tanks, Chimneys, Pipes & Platformer Props!
        const tankTr = [], chimneyTr = [], pipeTr = [], platDecorTr = [];
        for (let i = 0; i < 10; i++) {
            const z = 5 - i * 14.2;
            for (const side of [-1, 1]) {
                const x = side * (12 + (i % 2) * 1.0);
                box(S.scene, x, 4, z, 0.78, 22, 0.78, steel);
                rod(S.scene, V(x, -3, z), V(x, 9, z - 13.8), 0.19, copper);
                box(S.scene, x * 0.91, 12.8, z, 2.6, 0.22, 0.55, i % 2 ? gold : aqua);
                const g = gear(S.scene, x - 0.5 * side, 5 + (i % 3), z - 0.4, 2.4 + (i % 2), copper);
                g.rotation.y = side * Math.PI * 0.4; f.gears.push({ g, speed: side * (0.25 + (i % 3) * 0.1) });
                if (i % 2 === 0) tankTr.push({ pos: [side * 15.5, -4.6, z - 4], rot: side > 0 ? -Math.PI / 2 : Math.PI / 2, scale: 2.6 });
                else chimneyTr.push({ pos: [side * 16.5, -4.6, z - 2], scale: 3.4 });
                pipeTr.push({ pos: [side * 11.4, 2.5, z - 6], rot: side > 0 ? -Math.PI / 2 : Math.PI / 2, scale: 3.2 });
            }
            box(S.scene, 0, 14.8, z, 26.6, 0.55, 0.75, steel);
            if (i % 2 === 0) rod(S.scene, V(-12, 14.6, z), V(12, 14.6, z - 14), 0.15, copper);
            if (i < 8) platDecorTr.push({ pos: [(i % 2 ? 1 : -1) * 9.6, 3.2 + i * 0.35, z - 7], scale: 1.9 });
        }
        if (Assets && Assets.placeGLBInstanced) {
            Assets.placeGLBInstanced(S.scene, 'city_industrial_kit/detail-tank-large.glb', tankTr);
            Assets.placeGLBInstanced(S.scene, 'city_industrial_kit/chimney-large.glb', chimneyTr);
            Assets.placeGLBInstanced(S.scene, 'building_kit/detail-pipe.glb', pipeTr);
            Assets.placeGLBInstanced(S.scene, 'platformer_kit/platform-fortified.glb', platDecorTr);
        }
        if (Assets && Assets.placeGLB) {
            Assets.placeGLB(S.scene, 'platformer_kit/conveyor-belt.glb', { pos: [-3.6, 3.02, 2.5], fitSize: [2.2, 0.5, 3.8] });
            Assets.placeGLB(S.scene, 'platformer_kit/conveyor-belt.glb', { pos: [3.6, 3.02, 2.5], fitSize: [2.2, 0.5, 3.8] });
            Assets.placeGLB(S.scene, 'city_industrial_kit/shipping-container-b.glb', { pos: [-8.5, 6.0, -116], rot: 0.35, fitSize: [3.2, 2.8, 6.2] });
            Assets.placeGLB(S.scene, 'city_industrial_kit/shipping-container-c.glb', { pos: [8.5, 6.0, -116], rot: -0.35, fitSize: [3.2, 2.8, 6.2] });
        }

        box(S.scene, 0, -4.8, -54, 48, 0.4, 160, basic(0xd95326));
        for (let i = 0; i < 36; i++) {
            const s = part(S.scene, new THREE.OctahedronGeometry(0.08 + (i % 3) * 0.025), gold, (i % 2 ? 1 : -1) * (3 + (i % 8)), -3, -i * 3.8);
            f.sparks.push(s);
        }

        // Runaway Governor Turbine Boss with Rotating Seal Rotor
        f.turbine = group(S.scene, 0, 10, -122);
        drum(f.turbine, 0, -1.6, -0.9, 3.3, 4.7, 4.8, steel);
        f.wheel = gear(f.turbine, 0, 0, 0, 3.9, copper, 18);
        ring(f.turbine, 0, 0, 0.35, 2.2, 0.18, aqua);
        f.rotor = group(f.turbine, 0, 0, 0.75);
        for (let i = 0; i < 3; i++) {
            const a = (i * Math.PI * 2) / 3, plate = group(f.rotor, Math.sin(a) * 2.45, Math.cos(a) * 2.45, 0);
            const disk = drum(plate, 0, 0, 0, 0.86, 0.98, 0.38, steel, 12); disk.rotation.x = Math.PI / 2;
            const lens = part(plate, new THREE.IcosahedronGeometry(0.56, 1), gold, 0, 0, 0.27);
            const halo = ring(plate, 0, 0, 0.32, 0.96, 0.055, aqua);
            halo.visible = false;
            f.plates.push({ g: plate, lens, halo, dead: false, phase: i % 2 });
        }
        f.shock = ring(S.scene, 0, 6.18, -118, 1, 0.06, gold);
        f.shock.rotation.x = -Math.PI / 2; f.shock.visible = false;

        // First-Person Phase Gauntlet
        f.hand = group(S.scene);
        const gauntlet = group(f.hand, 0.245, -0.23, -0.44);
        box(gauntlet, 0, 0, 0, 0.16, 0.14, 0.36, steel);
        for (const side of [-1, 1]) rod(gauntlet, V(side * 0.076, 0, -0.05), V(side * 0.09, 0.045, -0.24), 0.019, copper);
        f.lamp = part(gauntlet, new THREE.IcosahedronGeometry(0.048, 1), aqua, 0, 0.071, -0.12);
        f.hand.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; o.frustumCulled = false; } });

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3));
        f.beam = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x72e8dc }));
        f.beam.visible = false; f.beam.frustumCulled = false; S.add(f.beam);
        f.beamEnd = V(); f.aim = V(); f.temp = V(); f.fireTime = 0;

        BO.Player.pos.copy(f.check); BO.Player.yaw = 0; BO.Player.pitch = -0.08;
        BO.Player.vel.set(0, 0, 0); BO.Player.hp = BO.Player.maxHp;
        if (MA()) MA().start('foundry');
    }

    function shift(S) {
        const f = S.data.foundry; if (f.shiftCd > 0) return;
        f.shiftCd = 0.22; f.phase = 1 - f.phase; f.flips++;
        for (const p of f.platforms) {
            if (p.phase >= 0) {
                p.b.active = p.phase === f.phase;
                p.g.visible = p.b.active;
                p.outline.visible = !p.b.active;
            }
        }
        f.lamp.material = basic(PALETTES[f.phase]);
        f.beam.material.color.setHex(PALETTES[f.phase]);
        SFX.clack();
        if (BO.Assets && BO.Assets.playClip) BO.Assets.playClip('rpg_sfx/metalLatch.ogg', { volume: 0.44, rateJitter: 0.06 });
    }

    function aimHook(S) {
        const f = S.data.foundry, cam = BO.App.worldCamera, dir = cam.getWorldDirection(f.aim);
        let best = null, bestAlignment = 0.72;
        for (const h of f.hooks) {
            f.temp.copy(h.point).sub(cam.position);
            if (f.temp.length() > 17.5) continue;
            const dot = f.temp.normalize().dot(dir);
            if (dot > bestAlignment) { bestAlignment = dot; best = h; }
        }
        return best;
    }

    function key(S, code) {
        const f = S.data.foundry, p = BO.Player;
        if (code === 'KeyE') { shift(S); return true; }
        if (code === 'KeyV') {
            if (!p.onGround && f.boost) {
                p.vel.y = Math.max(8.5, p.vel.y); f.boost = false;
                BO.FX.spawnParticles(p.pos.clone(), 12, PALETTES[f.phase], 3.5, 2, 0.35, 0.85);
                SFX.boing();
            }
            return true;
        }
        if (code === 'KeyQ') {
            const hook = aimHook(S);
            if (!f.pullCd && hook) { f.activeHook = hook; f.hookTime = 0.56; f.pullCd = 0.78; f.links++; SFX.whoosh(0.24); }
            else if (!hook) BO.Minigames.toast('Aim at a gold magnetic ring [Q]', '#ffe0ae');
            return true;
        }
        return false;
    }

    function fire(S) {
        const f = S.data.foundry, cam = BO.App.worldCamera;
        const dir = cam.getWorldDirection(f.aim);
        f.beamEnd.copy(cam.position).addScaledVector(dir, 30);
        f.cd = 0.22; f.fireTime = 0.12;
        f.beam.material.color.setHex(PALETTES[f.phase]);
        S.shots++; SFX.tone(f.phase ? 460 : 620, 220, 0.10, 'triangle', 0.1);

        // Check Clockwork Sentinel Drones
        for (const sn of f.sentinels) {
            if (!sn.alive) continue;
            const pos = sn.mesh.position;
            const along = f.aim.dot(pos.clone().sub(cam.position));
            if (along > 0 && along < 32 && cam.position.clone().addScaledVector(dir, along).distanceTo(pos) < 1.15) {
                f.beamEnd.copy(pos);
                if (f.phase !== sn.phase) {
                    BO.Minigames.toast('Press [E] to match ' + (sn.phase ? 'AMBER' : 'CYAN') + ' drone shield!', '#ffcf94');
                    SFX.bonk(); return;
                }
                sn.alive = false; sn.mesh.visible = false; f.sentinelsDown++;
                S.shotHits++; S.hits++; S.kills++; S.bumpCombo();
                BO.FX.spawnExplosion(pos.clone(), 2.8, PALETTES[f.phase]);
                S.award(Math.round(380 * S.comboMult), pos.clone(), 'SENTINEL SHATTERED!', '#8ce8db');
                SFX.shatter();
                if (BO.Assets && BO.Assets.playClip) BO.Assets.playClip('sfx/Impact Sounds (Kenney)/Audio/impactMetal_heavy_000.ogg', { volume: 0.42, rateJitter: 0.08 });
                return;
            }
        }

        // Check Governor Seals
        if (f.cells !== 3 || BO.Player.pos.z > -96) return;
        const plate = f.plates[f.bossHits]; if (!plate) return;
        const hit = plate.lens.getWorldPosition(f.temp), along = f.aim.dot(hit.clone().sub(cam.position));
        if (along < 0 || along > 31 || cam.position.clone().addScaledVector(dir, along).distanceTo(hit) > 1.15) return;
        f.beamEnd.copy(hit);
        if (f.phase !== plate.phase) {
            BO.Minigames.toast('Press [E] to match the ' + (plate.phase ? 'AMBER' : 'CYAN') + ' seal polarity!', '#ffcf94');
            SFX.bonk(); return;
        }
        plate.dead = true; plate.g.visible = false; f.bossHits++;
        S.shotHits++; S.hits++; S.kills++; S.bumpCombo();
        S.award(Math.round(950 * S.comboMult), hit.clone(), 'GOVERNOR SEAL CRACKED!');
        SFX.star(2);
        if (BO.Assets && BO.Assets.playClip) BO.Assets.playClip('sfx/Impact Sounds (Kenney)/Audio/impactGlass_heavy_001.ogg', { volume: 0.45, rateJitter: 0.06 });
        BO.FX.spawnParticles(hit, 22, PALETTES[f.phase], 5.5, 2, 0.5, 1.1);
        if (f.bossHits === 3) {
            f.complete = true; f.shock.visible = false;
            const speedBonus = Math.max(0, Math.round((150 - S.t) * 12));
            S.award(1800 + Math.max(0, 1800 - f.falls * 210) + speedBonus, f.turbine.position.clone(), 'FOUNDRY RESTARTED!', '#90edda');
            BO.Minigames.finish('FOUNDRY RESTARTED', { color: '#90edda' });
        }
    }

    function tick(S, dt, state) {
        const f = S.data.foundry, p = BO.Player, cam = BO.App.worldCamera;
        f.hand.position.copy(cam.position); f.hand.quaternion.copy(cam.quaternion);
        if (state !== 'running') return;
        if (MA()) MA().tick(dt, { amber: f.phase === 1, boss: f.cells === 3 });

        f.clock += dt; f.cd = Math.max(0, f.cd - dt); f.shiftCd = Math.max(0, f.shiftCd - dt); f.pullCd = Math.max(0, f.pullCd - dt);
        f.fireTime = Math.max(0, f.fireTime - dt);

        if (p.onGround) f.boost = true;
        if (f.activeHook) {
            const h = f.activeHook.point, t = f.temp.copy(h).sub(p.pos), len = t.length();
            f.hookTime -= dt;
            if (len < 1.85 || f.hookTime <= 0) { f.activeHook = null; p.vel.y = 5.4; f.boost = true; }
            else { p.pos.addScaledVector(t, Math.min(1, (dt * 19.5) / len)); p.vel.y = 1.6; p.onGround = false; f.beamEnd.copy(h); }
        }
        if (p.triggerHeld && !f.shotLatch && !f.cd) { f.shotLatch = true; fire(S); }
        else if (!p.triggerHeld) f.shotLatch = false;

        f.beam.visible = !!f.activeHook || f.fireTime > 0;
        if (f.beam.visible) {
            const a = f.lamp.getWorldPosition(f.temp), b = f.activeHook ? f.activeHook.point : f.beamEnd, buf = f.beam.geometry.attributes.position;
            buf.setXYZ(0, a.x, a.y, a.z); buf.setXYZ(1, b.x, b.y, b.z); buf.needsUpdate = true;
        }

        for (const m of f.moving) {
            const a = m.axis, was = m.g.position[a], b = m.b;
            const aboard = p.vel.y <= 0.1 && Math.abs(p.pos.y - b.maxY) < 0.2 && p.pos.x > b.minX - 0.1 && p.pos.x < b.maxX + 0.1 && p.pos.z > b.minZ - 0.1 && p.pos.z < b.maxZ + 0.1;
            m.g.position[a] = m[a] + Math.sin(f.clock * m.rate) * m.amp;
            const delta = m.g.position[a] - was;
            if (a === 'x') { b.minX += delta; b.maxX += delta; } else { b.minY += delta; b.maxY += delta; }
            if (aboard) p.pos[a] += delta;
            m.piston.position.x = m.g.position.x; m.piston.position.y = (m.g.position.y - 1.1) / 2; m.piston.scale.y = m.g.position.y + 0.6;
        }

        // Laser Sweepers (jump over!)
        for (const ls of f.lasers) {
            ls.piv.rotation.y += dt * ls.spd;
            ls.hitCd = Math.max(0, ls.hitCd - dt);
            if (ls.hitCd <= 0 && Math.abs(p.pos.y - ls.y) < 0.65) {
                const dx = p.pos.x - ls.x, dz = p.pos.z - ls.z;
                const d = Math.hypot(dx, dz);
                if (d < ls.half) {
                    const ang = Math.atan2(dz, dx) + ls.piv.rotation.y;
                    if (Math.abs(Math.sin(ang)) * d < 0.36) {
                        ls.hitCd = 0.9; p.takeDamage(14, V(ls.x, ls.y, ls.z), false); SFX.buzzer();
                        if (!p.alive) BO.Minigames.finish('LASER OVERLOAD', { color: '#ffab77' });
                    }
                }
            }
        }

        // Patrolling Clockwork Sentinel Drones
        for (const sn of f.sentinels) {
            if (!sn.alive) continue;
            sn.mesh.position.set(sn.base.x + Math.sin(f.clock * 1.4 + sn.base.z) * 3.4, sn.base.y + Math.sin(f.clock * 2.5) * 0.45, sn.base.z);
            sn.shield.rotation.y += dt * 2.8;
            for (const rt of sn.rotors) rt.rotation.y += dt * 26;
        }

        for (const pr of f.prisms) {
            if (pr.taken) continue;
            pr.gem.rotation.y += dt * 3.0; pr.outer.rotation.z += dt * 1.4;
            if (Math.abs(p.pos.z - pr.g.position.z) < 1.15 && Math.hypot(p.pos.x - pr.g.position.x, p.pos.y + 1.0 - pr.g.position.y) < 1.35) {
                pr.taken = true; pr.g.visible = false; f.prismsTaken++; f.boost = true;
                S.bumpCombo();
                S.award(Math.round(250 * S.comboMult), pr.g.position, 'PRISM • LIFT READY', '#8ce8db');
                SFX.ding(1.25);
                if (BO.Assets && BO.Assets.playClip) BO.Assets.playClip('overhaul/env/coin_collect.wav', { volume: 0.40, rateJitter: 0.08 });
            }
        }

        f.gears.forEach((v) => { v.g.rotation.z += v.speed * dt; });
        f.sparks.forEach((v, i) => { v.position.y = -4 + ((f.clock * (0.8 + (i % 3) * 0.3) + i * 1.7) % 7); v.rotation.y += dt; });
        f.hooks.forEach((h) => { h.loop.rotation.y = Math.sin(f.clock * 1.5) * 0.42; });

        f.switches.forEach((s, i) => {
            s.core.rotation.y += dt * 1.7; s.halo.rotation.y = f.clock * 1.4;
            if (!s.done && i === f.cells && p.pos.distanceTo(s.g.position) < 2.1) {
                s.done = true; f.cells++; f.room = f.cells; f.check.copy(s.g.position); f.check.y += 0.15; f.check.z += 1.1;
                f.stageTimes.push(S.t - f.segmentStart); f.segmentStart = S.t; p.hp = Math.min(p.maxHp, p.hp + 25);
                s.core.material = basic(0xffc27f);
                S.kills++; S.bumpCombo();
                S.award(Math.round(650 * S.comboMult), s.g.position, 'DRIVE ONLINE');
                SFX.star(2);
                BO.Minigames.toast(rooms[f.room] + (f.cells === 3 ? ' • Shoot the lit Governor seals [LMB]!' : ' • recovery point saved'), '#8ce8db');
            }
        });

        if (p.pos.y < 0.1 || Math.abs(p.pos.x) > 18) {
            f.falls++; f.activeHook = null; p.pos.copy(f.check); p.vel.set(0, 0, 0); f.boost = true;
            S.breakCombo('FELL INTO SMELTER'); S.award(-100);
            SFX.buzzer(); BO.Minigames.toast('Recovered at relay • −100 points', '#ffc68f');
        }

        f.wheel.rotation.z -= dt * (0.18 + f.cells * 0.14);
        f.rotor.rotation.z += dt * (f.cells === 3 ? 0.42 + f.bossHits * 0.16 : 0.12);
        for (let i = 0; i < 3; i++) {
            if (!f.plates[i].dead) {
                const live = i === f.bossHits && f.cells === 3;
                f.plates[i].lens.material = basic(live ? PALETTES[f.plates[i].phase] : 0x52616a);
                f.plates[i].lens.scale.setScalar(live ? 1.15 + 0.18 * Math.sin(f.clock * 5) : 0.75);
                f.plates[i].halo.visible = live;
                if (live) {
                    f.plates[i].halo.material = basic(PALETTES[f.plates[i].phase]);
                    f.plates[i].halo.scale.setScalar(1 + 0.1 * Math.sin(f.clock * 6));
                }
            }
        }

        if (f.cells === 3 && p.pos.z <= -96 && !f.complete) {
            f.bossTime += dt;
            const period = 4.4 - f.bossHits * 0.42, beat = f.bossTime / period;
            if (Math.floor(beat) > f.cycle) { f.cycle = Math.floor(beat); f.waveHit = false; SFX.rumble(0.25); }
            const radius = (beat % 1) * 25;
            f.shock.visible = true; f.shock.scale.setScalar(Math.max(0.1, radius));
            const dist = Math.hypot(p.pos.x, p.pos.z + 118);
            if (!f.waveHit && Math.abs(dist - radius) < 0.7 && p.pos.y < 6.68) {
                f.waveHit = true; p.takeDamage(18, f.shock.position, false);
                if (!p.alive) BO.Minigames.finish('GOVERNOR OVERLOAD', { color: '#ffab77' });
            }
        } else f.shock.visible = false;
    }

    function hud(S) {
        const f = S.data.foundry;
        const activeSeal = f.cells === 3 && f.bossHits < 3 ? f.plates[f.bossHits] : null;
        const next = f.cells < 3 ? 'DRIVE <b>' + (f.cells + 1) + '/3</b>' : activeSeal ? 'SEAL <b>' + (f.bossHits + 1) + '/3</b> (' + (activeSeal.phase ? 'AMBER' : 'CYAN') + ')' : 'RESTARTED';
        const govBar = f.cells === 3 && !f.complete
            ? `<div class="fun-panel"><div class="fun-bar-wrap"><div class="fun-bar-lbl"><span>RUNAWAY GOVERNOR • MATCH ${activeSeal && activeSeal.phase ? 'AMBER' : 'CYAN'} [E] + FIRE [LMB]</span><b>${3 - f.bossHits} / 3 SEALS</b></div><div class="fun-bar"><i style="width:${Math.round(((3 - f.bossHits) / 3) * 100)}%;background:${activeSeal && activeSeal.phase ? 'linear-gradient(90deg,#ea580c,#ffbf74)' : 'linear-gradient(90deg,#0891b2,#72e8dc)'}"></i></div></div></div>`
            : '';
        return `<div class="course-console foundry-console"><strong>${rooms[f.room]}</strong><span>${next}</span><span>POLARITY <b style="color:${f.phase ? '#ffbf74' : '#72e8dc'}">${f.phase ? 'AMBER' : 'CYAN'}</b> [E]</span><span>${aimHook(S) ? '<b style="color:#ffbf74">TETHER LOCK [Q]</b>' : 'LIFT <b>' + (f.boost ? 'READY [V]' : 'SPENT') + '</b>'}</span><span>DRONES <b>${f.sentinelsDown}/3</b></span><span>PRISMS <b>${f.prismsTaken}/8</b></span></div>${govBar}`;
    }

    function result(S) {
        const f = S.data.foundry, stars = S.rt.starsOf(S.def, S.opts).filter((n) => S.score >= n).length;
        return {
            score: S.score, stars, xp: 120 + stars * 150 + Math.round(S.score * 0.06),
            title: f.complete ? 'FOUNDRY RESTARTED' : 'FOUNDRY REPORT',
            stats: [['DRIVES ONLINE', f.cells + '/3'], ['GOVERNOR SEALS', f.bossHits + '/3'], ['SENTINELS', f.sentinelsDown + '/3'], ['PRISMS', f.prismsTaken + '/8'], ['RECOVERIES', f.falls], ['TIME', S.t.toFixed(1) + ' s']]
        };
    }

    BO.PrismFoundry = {
        build, key, tick, hud, result,
        dispose(S) {
            if (MA()) MA().stop();
            const f = S.data.foundry;
            if (f) {
                f.beam.geometry.dispose(); f.beam.material.dispose();
                for (const p of f.platforms) if (p.outline) { p.outline.geometry.dispose(); p.outline.material.dispose(); }
            }
        }
    };
})(window.BO);
