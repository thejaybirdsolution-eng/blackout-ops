/* Skybreak Sling | first-person demolition range */
(function (BO) {
    'use strict';
    const { Minigames: MG, MinigameLib: L, MinigameArt: Art, MGCourseKit: Kit } = BO;
    const { B, std, basic, SFX } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const rounds = [
        { name: 'Kestrel', role: 'Impact', color: 0xff9858, speed: 41, radius: 3.5, damage: 2 },
        { name: 'Swift', role: 'Pierce', color: 0x74ebea, speed: 55, radius: 1.9, damage: 4 },
        { name: 'Osprey', role: 'Burst', color: 0xf8cc63, speed: 33, radius: 5.5, damage: 3 }
    ];
    const forts = [
        [-11, -20, 2, 'WEST SPAN'], [9, -23, 2, 'EAST SPAN'],
        [-3, -30, 3, 'RELAY NINE'], [5, -40, 4, 'THE LIGHTHOUSE']
    ];
    const gravity = 14.5;
    function mesh(parent, geometry, material, x, y, z) {
        const m = new THREE.Mesh(geometry, material);
        m.position.set(x, y, z);
        parent.add(m);
        return m;
    }
    function glider(round) {
        const g = new THREE.Group(), enamel = std(round.color, 0.34, 0.36), brass = std(0xd2a864, 0.35, 0.7);
        const hull = mesh(g, new THREE.OctahedronGeometry(0.34), enamel, 0, 0, 0);
        hull.scale.set(0.68, 0.76, 1.9);
        for (const side of [-1, 1]) {
            const wing = mesh(g, new THREE.ConeGeometry(0.25, 0.84, 3), enamel, side * 0.42, 0, -0.09);
            wing.rotation.z = -side * 1.85;
            wing.scale.z = 0.55;
            const fin = mesh(g, new THREE.BoxGeometry(0.07, 0.21, 0.31), brass, side * 0.13, 0.12, -0.38);
            fin.rotation.z = -side * 0.45;
        }
        mesh(g, new THREE.SphereGeometry(0.105, 8, 6), basic(0xfff2c9), 0, 0.12, 0.24);
        return g;
    }
    function build(S) {
        const D = S.data, scene = S.scene, rng = L.mulberry32(731);
        Object.assign(D, { selected: 0, charge: 0, drawing: false, wind: 0, knocked: 0,
            blocks: [], cores: [], shots: [], direction: V(), origin: V(), velocity: V(), scratch: V(), local: V() });
        Kit.cloudLayer(S, 12, 35, 160);
        const rock = std(0x445969, 0.95), copper = std(0xbc744e, 0.62, 0.45);
        const steel = std(0x254652, 0.54, 0.55), timber = std(0xb48357, 0.86);
        const crystal = std(0x69cada, 0.24, 0.52), light = basic(0xffda86);
        // Stepped basalt cliffs flank the channel, leaving every shot lane open.
        const crag = new THREE.CylinderGeometry(0.8, 1.1, 1, 6);
        for (let i = 0; i < 56; i++) {
            const x = (i % 2 ? 1 : -1) * (21 + rng() * 19), z = 12 - rng() * 78;
            const h = 2 + rng() * 11, r = 2 + rng() * 4;
            mesh(scene, crag, rock, x, h / 2 - 1, z).scale.set(r, h, r);
        }
        const deck = mesh(scene, new THREE.BoxGeometry(10, 0.6, 6), timber, 0, 0, 4.5);
        deck.receiveShadow = true;
        for (const side of [-1, 1]) {
            mesh(scene, new THREE.BoxGeometry(0.16, 0.16, 5.8), copper, side * 4.85, 1.15, 4.5);
            for (const z of [1.8, 4.5, 7.2]) mesh(scene, new THREE.BoxGeometry(0.16, 1.25, 0.16), steel, side * 4.85, 0.62, z);
        }
        // A tapered striped windsock gives the same wind reading as the instruments.
        mesh(scene, new THREE.CylinderGeometry(0.055, 0.09, 3.5, 8), copper, -4.6, 2.05, 1.75);
        D.sock = new THREE.Group();
        D.sock.position.set(-4.6, 3.75, 1.75); scene.add(D.sock);
        for (let i = 0; i < 5; i++) {
            const radius = 0.21 - i * 0.027;
            const stripe = mesh(D.sock, new THREE.CylinderGeometry(radius - 0.027, radius, 0.26, 12, 1, true),
                i % 2 ? light : copper, 0.13 + i * 0.26, 0, 0);
            stripe.rotation.z = -Math.PI / 2;
        }
        D.launcher = new THREE.Group();
        scene.add(D.launcher);
        const limb = new THREE.CylinderGeometry(0.024, 0.045, 0.29, 8);
        for (const side of [-1, 1]) {
            mesh(D.launcher, limb, copper, side * 0.095, 0, 0).rotation.z = -side * 0.48;
            mesh(D.launcher, new THREE.SphereGeometry(0.033, 10, 8), light, side * 0.16, 0.13, 0);
        }
        mesh(D.launcher, new THREE.CylinderGeometry(0.047, 0.055, 0.24, 10), steel, 0, -0.19, 0);
        const bandGeometry = new THREE.BufferGeometry();
        bandGeometry.setAttribute('position', new THREE.Float32BufferAttribute([-0.16, 0.13, 0, 0, 0.07, 0.08, 0.16, 0.13, 0], 3));
        D.band = new THREE.Line(bandGeometry, new THREE.LineBasicMaterial({ color: 0xffd99a }));
        D.band.frustumCulled = false;
        D.launcher.add(D.band);
        D.loaded = rounds.map(r => {
            const g = glider(r);
            g.scale.setScalar(0.18); g.rotation.y = Math.PI;
            D.launcher.add(g); return g;
        });
        D.dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.065, 6, 4), basic(0xffe7a8), 26);
        D.dots.frustumCulled = false; D.dots.visible = false; scene.add(D.dots);
        D.dotMatrix = new THREE.Matrix4();
        // Recycle gliders. Hidden slots stay in the scene for normal session disposal.
        for (const round of rounds) for (let i = 0; i < 9; i++) {
            const model = glider(round); model.visible = false; scene.add(model);
            D.shots.push({ model, round, vel: V(), seen: new Set() });
        }
        const shell = new THREE.IcosahedronGeometry(0.45), halo = new THREE.TorusGeometry(0.56, 0.052, 6, 20);
        for (const [x, z, floors, name] of forts) {
            mesh(scene, new THREE.BoxGeometry(7.4, 0.8, 4), rock, x, 0.4, z);
            const sign = Art.sign(name, 3.6, 0.6, { bg: '#173541', color: '#ffe3ae', borderColor: '#be8156' });
            sign.position.set(x, 0.54, z + 2.04); scene.add(sign);
            let below = [];
            function block(dx, y, width, height, material, hp, feet) {
                const m = mesh(scene, new THREE.BoxGeometry(width, height, 1.75), material, x + dx, y, z);
                const b = { m, width, height, hp, feet, falling: false, t: 0, spin: rng() - 0.5 };
                D.blocks.push(b); return b;
            }
            function core(dx, y, feet) {
                const g = new THREE.Group(); g.position.set(x + dx, y, z); scene.add(g);
                mesh(g, shell, light, 0, 0, 0);
                const ring = mesh(g, halo, copper, 0, 0, 0);
                D.cores.push({ g, ring, y, feet, dead: false, phase: rng() * 6 });
            }
            for (let n = 0; n < floors; n++) {
                const base = 0.8 + n * 2.25;
                const posts = [-1, 1].map(side => block(side * 1.95, base + 0.96, 0.48, 1.92,
                    n === 0 ? steel : timber, n === 0 ? 4 : 2, below));
                core(n % 2 ? -0.64 : 0.64, base + 0.68, below);
                below = [block(0, base + 2.085, 4.9, 0.33, n % 2 ? crystal : timber, n % 2 ? 1 : 2, posts)];
            }
            core(0, 1.5 + floors * 2.25, below);
        }
        S.spawned = D.cores.length;
    }
    function strike(S, p, position) {
        const D = S.data, r = p.round;
        BO.FX.spawnParticles(position, 14, r.color, 5, 3, 0.45, 1);
        if (r === rounds[2]) {
            BO.FX.spawnExplosion(position, r.radius, r.color);
            SFX.rumble(0.4);
        } else SFX.bonk();
        let scored = false;
        for (const b of D.blocks) {
            if (b.falling || !b.m.visible) continue;
            const v = b.m.position;
            const gap = Math.hypot(Math.max(0, Math.abs(v.x-position.x)-b.width/2), Math.max(0, Math.abs(v.y-position.y)-b.height/2), Math.max(0, Math.abs(v.z-position.z)-0.875));
            if (gap <= r.radius && (b.hp -= r.damage) <= 0) { b.falling = true; scored = true; }
        }
        for (const c of D.cores) if (!c.dead && c.g.position.distanceTo(position) <= r.radius + 0.48) {
            breakCore(S, c); scored = true;
        }
        if (scored && !p.scored) { p.scored = true; S.shotHits++; S.hits++; }
    }
    function breakCore(S, c) {
        c.dead = true; c.g.visible = false; S.data.knocked++; S.kills++; S.bumpCombo();
        S.award(350 * S.comboMult, c.g.position, 'RELAY DOWN', '#ffdc91');
        BO.FX.spawnParticles(c.g.position, 12, 0xffdd90, 4, 2, 0.48, 1);
        SFX.pop();
    }
    function flight(S, dt) {
        const D = S.data;
        for (const p of D.shots) {
            if (!p.model.visible) continue;
            // Small ballistic steps prevent the Swift skipping thin glass at low frame rates.
            const steps = Math.ceil(dt / 0.006);
            for (let j = 0; j < steps && p.model.visible; j++) {
                const h = dt / steps, point = p.model.position;
                point.addScaledVector(p.vel, h); point.x += 0.5 * p.wind * h * h; point.y -= 0.5 * gravity * h * h;
                p.vel.x += p.wind * h; p.vel.y -= gravity * h; p.life -= h;
                const target = D.blocks.find(b => !b.falling && !p.seen.has(b) && Math.abs(point.x-b.m.position.x) < b.width/2+0.15 && Math.abs(point.y-b.m.position.y) < b.height/2+0.15 && Math.abs(point.z-b.m.position.z) < 1.03)
                    || D.cores.find(c => !c.dead && c.g.position.distanceToSquared(point) < 0.55);
                if (target || point.y < 0.25) {
                    strike(S, p, point);
                    if (target && p.pierces > 0) { p.seen.add(target); p.pierces--; }
                    else p.model.visible = false;
                }
                if (p.life <= 0) p.model.visible = false;
            }
            if (p.model.visible) p.model.lookAt(D.scratch.copy(p.model.position).add(p.vel));
        }
    }
    function update(S, dt, lib, state) {
        const D = S.data, P = BO.Player, cam = BO.App.worldCamera;
        P.pos.x = THREE.MathUtils.clamp(P.pos.x, -4.4, 4.4);
        P.pos.z = THREE.MathUtils.clamp(P.pos.z, 2.2, 6.7);
        P.pos.y = Math.max(0.3, P.pos.y);
        const running = state === 'running', held = running && P.triggerHeld;
        if (!running) { D.drawing = false; D.charge = 0; }
        if (held) { D.drawing = true; D.charge = Math.min(1, D.charge + dt / 0.85); }
        const r = rounds[D.selected], pull = D.charge;
        D.wind = Math.sin(S.t * 0.17) * 3.8;
        D.sock.rotation.y = -Math.atan2(1, D.wind);
        D.sock.rotation.z = -0.32 + Math.min(0.22, Math.abs(D.wind) * 0.06) + Math.sin(S.t * 7) * 0.05;
        cam.getWorldDirection(D.direction);
        D.launcher.position.copy(cam.position).add(D.local.set(0.24, -0.21, -0.63).applyQuaternion(cam.quaternion));
        D.launcher.quaternion.copy(cam.quaternion);
        const pouch = 0.07 + pull * 0.27;
        D.band.geometry.attributes.position.setXYZ(1, 0, 0.07, pouch);
        D.band.geometry.attributes.position.needsUpdate = true;
        D.loaded.forEach((m, i) => { m.visible = i === D.selected; m.position.set(0, 0.07, pouch); });
        D.origin.copy(D.launcher.position).add(D.local.set(0, 0.07, pouch).applyQuaternion(cam.quaternion));
        D.velocity.copy(D.direction).multiplyScalar(r.speed * (0.57 + 0.43 * pull)); D.velocity.y += 2.4;
        D.dots.visible = held;
        if (held) {
            let count = 0;
            for (let i = 1; i <= 26; i++) {
                const t = i * 0.055, v = D.scratch.copy(D.origin).addScaledVector(D.velocity, t);
                v.y -= 0.5 * gravity * t * t; v.x += 0.5 * D.wind * t * t;
                if (v.y < 0.25) break;
                D.dots.setMatrixAt(count++, D.dotMatrix.makeTranslation(v.x, v.y, v.z));
            }
            D.dots.count = count; D.dots.instanceMatrix.needsUpdate = true;
        }
        if (!held && D.drawing) {
            const p = D.shots.find(s => s.round === r && !s.model.visible);
            if (p) {
                p.model.visible = true; p.model.position.copy(D.origin); p.vel.copy(D.velocity);
                p.wind = D.wind; p.life = 3.2; p.pierces = D.selected === 1 ? 2 : 0;
                p.scored = false; p.seen.clear(); S.shots++; SFX.launch();
            }
            D.drawing = false; D.charge = 0;
        }
        if (!running) return;
        flight(S, dt);
        for (const b of D.blocks) {
            if (!b.m.visible) continue;
            if (!b.falling && b.feet.length && b.feet.every(f => f.falling)) b.falling = true;
            if (!b.falling) continue;
            b.t += dt; b.m.position.y -= 16 * b.t * dt;
            b.m.rotation.z += b.spin * 3 * dt;
            if (b.m.position.y <= 0.35) {
                b.m.visible = false;
                BO.FX.spawnParticles(b.m.position, 5, b.m.material.color.getHex(), 3, 1.5, 0.34, 0.65);
                S.award(45, b.m.position);
            }
        }
        for (const c of D.cores) {
            if (c.dead) continue;
            if (c.feet.length && c.feet.every(f => f.falling)) { breakCore(S, c); continue; }
            c.g.position.y = c.y + Math.sin(S.t * 2.8 + c.phase) * 0.09;
            c.ring.rotation.y = S.t * 2 + c.phase; c.ring.rotation.z = 0.38;
        }
        if (D.knocked === D.cores.length) {
            const secondsLeft = Math.max(0, Math.floor(90 - S.t));
            S.award(2000 + secondsLeft * 35, null, null);
            MG.finish('ALL RELAYS DOWN', { color: '#ffdc91' });
        }
    }
    MG.register({
        id: 'fun_angry_birds', cat: 'fun', order: 1, name: 'Skybreak Sling FPS', icon: '🪶', badge: 'SLINGSHOT', accent: '#f6b979',
        tagline: 'Fly the fault line. Bring down the relay towers.',
        desc: 'Launch mechanical gliders across a basalt channel. Read the wind and dismantle four signal towers before the clock runs out.',
        guide: { objective: 'Break all 15 amber relay cores in 90 seconds.', tips: ['Hold fire to draw the sling and preview the flight path. Release to launch.', 'Cut both uprights beneath a floor to collapse every relay it supports.', 'Swift pierces multiple targets. Osprey scatters damage across nearby supports.'] },
        keys: [['Hold LMB', 'Draw and preview arc'], ['Release LMB', 'Launch'], ['1 / 2 / 3', 'Kestrel / Swift / Osprey'], ['WASD', 'Move on deck']],
        heroLabel: 'SKYBREAK • RELAY DEMOLITION', duration: 90, stars: [2200, 4800, 8000, 12000],
        standardWeapon: 'm1911', lockWeapon: true, blockFire: true, hideViewmodel: true, weaponLabel: 'SKYBREAK SLING',
        weaponNote: 'Hold to draw, release to launch. Gliders have unlimited reserves.',
        map: { atmosphere: { skyTop: 0x548aa6, skyBottom: 0xffce9a, fogColor: 0xeac8aa, fogDensity: 0.008, sunColor: 0xffdda8, sunIntensity: 1.6, sunPos: [-30, 45, 18], hemiSky: 0xfbe3bf, hemiGround: 0x476675, hemiIntensity: 1 },
            boxes: [B(0, -0.55, -20, 180, 1, 180, 'swamp_water')], spawn: { x: 0, y: 0.35, z: 4.5, yaw: 0 } },
        build, update,
        result(S) {
            const stars = S.def.stars.filter(threshold => S.score >= threshold).length;
            const accuracy = S.shots ? S.shotHits / S.shots : 0;
            return { score: S.score, stars, accuracy, xp: Math.round(120 + S.score * 0.06 + stars * 150),
                title: S.kills === S.spawned ? 'CHANNEL CLEARED' : 'SHIFT COMPLETE',
                stats: [['RELAYS DOWN', S.kills + ' / ' + S.spawned], ['GLIDERS LAUNCHED', S.shots],
                    ['SCORING SHOTS', Math.round(accuracy * 100) + '%'], ['SUPPORTS BROKEN', S.data.blocks.filter(b => b.falling).length]] };
        },
        onKey(S, code) {
            const index = ['Digit1', 'Digit2', 'Digit3'].indexOf(code);
            if (index < 0 || MG.state !== 'running') return false;
            S.data.selected = index; SFX.clack(); return true;
        },
        hud(S) {
            const D = S.data, r = rounds[D.selected];
            return '<div class="skybreak-hud"><strong>' + r.name + ' <small>' + r.role + '</small></strong><span>Draw <b>' + Math.round(D.charge * 100) + '%</b></span><span>Wind <b>' + (D.wind < 0 ? '← ' : '→ ') + Math.abs(D.wind).toFixed(1) + '</b></span><span>Relays <b>' + D.knocked + ' / ' + D.cores.length + '</b></span></div>';
        }
    });
})(window.BO);
