/* ============================================================================
   BLACKOUT OPS — ANGRY BIRDS FPS (Authentic 3D Slingshot Fortress Destruction)
   Iconic 3D Birds (Red, Chuck Turbo, Bomb TNT, The Blues Triple-Split),
   Wooden Y-Slingshot with Elastic Bands, Green Bad Piggies (Minion, Corporal
   Helmet Pig, King Pig with Golden Crown), Wood/Stone/Ice/TNT Fortresses,
   Sunny Piggy Island Rolling Hills, & Playful Accordion/Pizzicato Theme!
============================================================================ */
(function (BO) {
    'use strict';
    const { Minigames: MG, MinigameLib: L, MinigameArt: Art, MGCourseKit: Kit } = BO;
    const { B, std, basic, SFX } = L;
    const MA = () => BO.MinigameAudio;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);

    const BIRDS = [
        { id: 'red', name: 'RED', role: 'Classic Smash', color: 0xdc2626, belly: 0xfef3c7, speed: 39, radius: 3.4, damage: 2.5, scale: 1.0, ability: 'Battle Cry Knockback' },
        { id: 'chuck', name: 'CHUCK', role: 'Turbo Wood-Buster', color: 0xfacc15, belly: 0xfef9c3, speed: 46, radius: 2.6, damage: 3.5, scale: 0.96, ability: 'Click Mid-Air: TURBO BOOST!' },
        { id: 'bomb', name: 'BOMB', role: 'Explosive TNT', color: 0x18181b, belly: 0x52525b, speed: 32, radius: 6.2, damage: 5.0, scale: 1.18, ability: 'Click Mid-Air: DETONATE!' },
        { id: 'blues', name: 'THE BLUES', role: 'Ice Triple-Split', color: 0x38bdf8, belly: 0xe0f2fe, speed: 41, radius: 2.4, damage: 2.2, scale: 0.72, ability: 'Click Mid-Air: TRIPLE SPLIT!' }
    ];

    const FORTS = [
        [-11.5, -20, 2, 'WOODEN OUTPOST', 'wood'],
        [10.0, -23, 2, 'ICE PAVILION', 'ice'],
        [-3.0, -31, 3, 'STONE CITADEL', 'stone'],
        [6.0, -41, 4, "KING PIG'S PALACE", 'king']
    ];
    const GRAVITY = 14.5;

    function mesh(parent, geometry, material, x, y, z) {
        const m = new THREE.Mesh(geometry, material);
        m.position.set(x, y, z);
        m.castShadow = true;
        m.receiveShadow = true;
        parent.add(m);
        return m;
    }

    /** Iconic 3D Angry Bird model (Red, triangular Chuck, round Bomb with fuse, tiny Blues). */
    function buildBird(bird) {
        const g = new THREE.Group();
        const bodyMat = std(bird.color, 0.42, 0.08);
        const bellyMat = std(bird.belly, 0.55);
        const whiteM = basic(0xffffff), blackM = basic(0x09090b), beakM = std(0xf59e0b, 0.35);

        if (bird.id === 'chuck') {
            // Iconic yellow triangular pyramid body!
            const cone = mesh(g, new THREE.ConeGeometry(0.42, 0.78, 12), bodyMat, 0, 0.08, 0);
            cone.scale.set(1, 1, 0.92);
            const belly = mesh(g, new THREE.SphereGeometry(0.28, 10, 8), bellyMat, 0, -0.14, 0.16);
            belly.scale.set(1, 0.7, 0.7);
        } else {
            mesh(g, new THREE.SphereGeometry(0.38, 16, 12), bodyMat, 0, 0, 0);
            const belly = mesh(g, new THREE.SphereGeometry(0.29, 12, 10), bellyMat, 0, -0.11, 0.16);
            belly.scale.set(0.95, 0.85, 0.65);
        }

        // Big expressive cartoon eyes & iconic thick angry eyebrows!
        for (const s of [-1, 1]) {
            mesh(g, new THREE.SphereGeometry(0.105, 10, 8), whiteM, s * 0.13, 0.07, 0.30);
            mesh(g, new THREE.SphereGeometry(0.052, 8, 6), blackM, s * 0.13, 0.07, 0.38);
            const brow = mesh(g, new THREE.BoxGeometry(0.19, 0.055, 0.05), std(bird.id === 'chuck' ? 0x991b1b : 0x111111, 0.8), s * 0.13, 0.18, 0.34);
            brow.rotation.z = s * 0.36;
        }
        // Iconic 2-part orange beak
        const topBeak = mesh(g, new THREE.ConeGeometry(0.11, 0.24, 6), beakM, 0, -0.02, 0.42);
        topBeak.rotation.x = Math.PI / 2;
        const botBeak = mesh(g, new THREE.ConeGeometry(0.08, 0.16, 6), std(0xd97706, 0.4), 0, -0.09, 0.38);
        botBeak.rotation.x = Math.PI / 2 + 0.2;

        // Tail feathers
        for (let t = -1; t <= 1; t++) {
            const feather = mesh(g, new THREE.BoxGeometry(0.05, 0.14, 0.18), blackM, t * 0.05, 0.04 + Math.abs(t) * 0.03, -0.38);
            feather.rotation.x = 0.3;
        }

        // Distinctive crest / burning fuse
        if (bird.id === 'bomb') {
            mesh(g, new THREE.CylinderGeometry(0.03, 0.03, 0.22, 8), std(0x78716c, 0.85), 0, 0.45, 0).rotation.z = -0.25;
            mesh(g, new THREE.SphereGeometry(0.075, 8, 6), basic(0xfde047), 0.04, 0.56, 0);
            mesh(g, new THREE.SphereGeometry(0.045, 6, 4), basic(0xf97316), 0.04, 0.58, 0);
        } else {
            const crest = mesh(g, new THREE.CapsuleGeometry(0.06, 0.18, 4, 8), bodyMat, 0, 0.42, 0.02);
            crest.rotation.x = -0.35;
        }
        g.scale.setScalar(bird.scale);
        return g;
    }

    /** Iconic 3D Green Bad Piggy (Minion, Helmet Corporal, or King Pig with Golden Crown!). */
    function buildPig(role = 'minion') {
        const g = new THREE.Group();
        const r = role === 'king' ? 0.62 : role === 'helmet' ? 0.46 : 0.40;
        const greenM = std(0x65c928, 0.45, 0.05);
        const snoutM = std(0x9be846, 0.45, 0.05);
        const darkGreenM = std(0x14532d, 0.8);
        const whiteM = basic(0xffffff), blackM = basic(0x09090b);

        mesh(g, new THREE.SphereGeometry(r, 16, 12), greenM, 0, 0, 0);
        // Protruding oval piggy snout + 2 nostrils!
        const snout = mesh(g, new THREE.CylinderGeometry(r * 0.36, r * 0.40, r * 0.28, 14), snoutM, 0, -r * 0.04, r * 0.92);
        snout.rotation.x = Math.PI / 2;
        for (const s of [-1, 1]) {
            mesh(g, new THREE.SphereGeometry(r * 0.09, 6, 6), darkGreenM, s * r * 0.14, -r * 0.02, r * 1.06);
            // Wide goofy eyes + pupils
            mesh(g, new THREE.SphereGeometry(r * 0.22, 10, 8), whiteM, s * r * 0.42, r * 0.14, r * 0.78);
            mesh(g, new THREE.SphereGeometry(r * 0.095, 8, 6), blackM, s * r * 0.44, r * 0.14, r * 0.96);
            // Round piggy ears on top
            mesh(g, new THREE.SphereGeometry(r * 0.20, 8, 6), greenM, s * r * 0.65, r * 0.76, 0);
            mesh(g, new THREE.SphereGeometry(r * 0.11, 6, 6), darkGreenM, s * r * 0.65, r * 0.76, r * 0.12);
        }
        // Cheeky grin
        mesh(g, new THREE.BoxGeometry(r * 0.42, r * 0.08, r * 0.08), whiteM, 0, -r * 0.36, r * 0.88);

        if (role === 'helmet') {
            const helm = mesh(g, new THREE.SphereGeometry(r * 1.06, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.54), std(0x64748b, 0.35, 0.7), 0, r * 0.12, 0);
            const brim = mesh(g, new THREE.CylinderGeometry(r * 1.15, r * 1.18, r * 0.10, 16), std(0x475569, 0.4, 0.7), 0, r * 0.12, 0);
            void helm; void brim;
        } else if (role === 'king') {
            const goldM = std(0xfacc15, 0.25, 0.82);
            mesh(g, new THREE.CylinderGeometry(r * 0.62, r * 0.48, r * 0.55, 8), goldM, 0, r * 1.12, 0);
            for (let k = 0; k < 5; k++) {
                const a = (k / 5) * Math.PI * 2;
                mesh(g, new THREE.SphereGeometry(r * 0.11, 8, 6), basic(k % 2 ? 0xef4444 : 0x38bdf8), Math.cos(a) * r * 0.56, r * 1.12, Math.sin(a) * r * 0.56);
            }
        }
        return g;
    }

    function sfxClip(relPath, volume = 0.38, rateJitter = 0.08) {
        if (BO.Assets && BO.Assets.playClip) BO.Assets.playClip(relPath, { volume, rateJitter });
    }

    function build(S) {
        const D = S.data, scene = S.scene, rng = L.mulberry32(731);
        const Assets = BO.Assets;
        Object.assign(D, {
            selected: 0, charge: 0, drawing: false, wind: 0, knocked: 0, activeShot: null,
            blocks: [], pigs: [], eggs: [], eggsTaken: 0, shots: [], direction: V(), origin: V(), velocity: V(), scratch: V(), local: V(),
            oinkTimer: 2.5
        });
        if (Assets && Assets.applySkybox) Assets.applySkybox(scene, 'skybox-day.png');
        Kit.cloudLayer(S, 14, 34, 170);

        // Lush Sunny Piggy Island Rolling Green Hills & Wooden Slingshot Perch!
        const grassM = (Assets && Assets.pbrMat)
            ? Assets.pbrMat('fantasy_painterly/Grass Meadows/emerald-meadow-grass-001.png', 18, 18, { roughness: 0.86 })
            : std(0x4ade80, 0.88);
        const darkGrassM = std(0x22c55e, 0.9), dirtM = std(0x92400e, 0.92);
        const woodM = BO.CourseScenery.texMat('wood_plank', 4, 2);
        const stoneM = BO.CourseScenery.texMat('bunker_stone', 4, 4);
        const iceM = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: 0.14, metalness: 0.15, transparent: true, opacity: 0.78 });
        const tntM = new THREE.MeshStandardMaterial({ map: L.signTex('TNT', { bg: '#b91c1c', color: '#fef08a', borderColor: '#facc15', w: 256, h: 256, size: 0.42 }), roughness: 0.65 });

        const meadowOverlay = mesh(scene, new THREE.PlaneGeometry(176, 176), grassM, 0, 0.01, -20);
        meadowOverlay.rotation.x = -Math.PI / 2;
        meadowOverlay.castShadow = false;

        // Scenic rolling green hills + GPU-instanced 3D Forest Trees & Boulders flanking Piggy Island
        const tallTreeTr = [], smallTreeTr = [], rockTr = [];
        for (let i = 0; i < 36; i++) {
            const x = (i % 2 ? 1 : -1) * (20 + rng() * 24), z = 10 - rng() * 76;
            const rad = 4.5 + rng() * 6.5, h = 2.8 + rng() * 6.2;
            const hill = mesh(scene, new THREE.SphereGeometry(rad, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), i % 2 ? grassM : darkGrassM, x, -0.4, z);
            hill.scale.set(1.2, h / rad, 1.3);
            if (rng() < 0.62) {
                const sc = 2.2 + rng() * 1.6;
                (i % 2 === 0 ? tallTreeTr : smallTreeTr).push({ pos: [x * 0.86, 0, z], rot: rng() * Math.PI * 2, scale: sc });
            }
            if (i % 3 === 0) {
                rockTr.push({ pos: [x * 0.74, 0, z + (rng() - 0.5) * 4], rot: rng() * Math.PI * 2, scale: 1.8 + rng() * 1.1 });
            }
        }
        if (Assets && Assets.placeGLBInstanced) {
            Assets.placeGLBInstanced(scene, 'mini_forest_kit/tree-high.glb', tallTreeTr);
            Assets.placeGLBInstanced(scene, 'mini_forest_kit/tree.glb', smallTreeTr);
            Assets.placeGLBInstanced(scene, 'mini_forest_kit/rocks-high.glb', rockTr);
            // Castle watchtowers, siege catapults & royal banners framing Piggy Island & King Pig's Palace!
            Assets.placeGLBInstanced(scene, 'castle_kit/tower-hexagon-base.glb', [
                { pos: [-19, 0, -34], scale: 2.3 }, { pos: [19, 0, -34], scale: 2.3 },
                { pos: [0.5, 0, -45.5], scale: 2.5 }, { pos: [11.5, 0, -45.5], scale: 2.5 }
            ]);
            Assets.placeGLBInstanced(scene, 'castle_kit/tower-hexagon-mid.glb', [
                { pos: [-19, 3.6, -34], scale: 2.2 }, { pos: [19, 3.6, -34], scale: 2.2 },
                { pos: [0.5, 3.9, -45.5], scale: 2.4 }, { pos: [11.5, 3.9, -45.5], scale: 2.4 }
            ]);
            Assets.placeGLBInstanced(scene, 'castle_kit/tower-hexagon-roof.glb', [
                { pos: [-19, 7.0, -34], scale: 2.3 }, { pos: [19, 7.0, -34], scale: 2.3 },
                { pos: [0.5, 7.6, -45.5], scale: 2.5 }, { pos: [11.5, 7.6, -45.5], scale: 2.5 }
            ]);
            Assets.placeGLBInstanced(scene, 'castle_kit/siege-catapult.glb', [
                { pos: [-16.5, 0, -14], rot: 0.35, scale: 1.9 },
                { pos: [16.5, 0, -16], rot: -0.35, scale: 1.9 }
            ]);
            Assets.placeGLBInstanced(scene, 'castle_kit/flag-banner-long.glb', [
                { pos: [-5.1, 1.2, 1.8], scale: 1.8 }, { pos: [5.1, 1.2, 1.8], scale: 1.8 },
                { pos: [1.5, 2.5, -41], scale: 2.2 }, { pos: [10.5, 2.5, -41], scale: 2.2 }
            ]);
        }
        if (Assets && Assets.placeGLB) {
            Assets.placeGLB(scene, 'pixel_fantasy/pixel-fantasy-giant-keep-banner.glb', { pos: [6.0, 2.8, -44.8], fitSize: [3.4, 5.2, 0.8] });
            Assets.placeGLB(scene, 'mini_forest_kit/tent.glb', { pos: [-7.8, 0, 4.2], rot: 0.45, fitSize: [3.2, 2.4, 3.2] });
            Assets.placeGLB(scene, 'mini_forest_kit/target.glb', { pos: [7.6, 0, 2.5], rot: -0.35, fitSize: [1.5, 1.8, 0.8] });
            // Royal Piglin/Imp Court Jesters flanking King Pig's Palace!
            Assets.placeGLB(scene, 'monsters/Puglin.glb', { pos: [1.2, 0.85, -40.2], rot: 0.25, fitSize: [1.3, 1.5, 1.3] });
            Assets.placeGLB(scene, 'monsters/Imp.glb', { pos: [10.8, 0.85, -40.2], rot: -0.25, fitSize: [1.3, 1.5, 1.3] });
        }

        // 3 Golden Egg Bonus Pedestals (+750 pts each when struck by a Bird or blast!)
        const goldEggMat = std(0xfacc15, 0.16, 0.92, { emissive: 0xca8a04, emissiveIntensity: 0.35 });
        for (const [ex, ey, ez] of [[0, 2.65, -18.5], [-12.5, 3.1, -30.5], [13.5, 3.4, -36.5]]) {
            const ped = mesh(scene, new THREE.CylinderGeometry(0.55, 0.72, ey - 0.55, 12), stoneM, ex, (ey - 0.55) * 0.5, ez);
            if (Assets && Assets.placeGLB) {
                Assets.placeGLB(scene, 'mini_arena_kit/column.glb', { pos: [ex, 0, ez], fitSize: [1.25, ey - 0.45, 1.25], hideFallback: ped });
            }
            const eggG = new THREE.Group();
            eggG.position.set(ex, ey, ez);
            const eggMesh = mesh(eggG, new THREE.SphereGeometry(0.42, 16, 14), goldEggMat, 0, 0, 0);
            eggMesh.scale.set(0.86, 1.24, 0.86);
            const halo = mesh(eggG, new THREE.TorusGeometry(0.62, 0.045, 8, 22), basic(0xfef08a), 0, 0, 0);
            if (Assets && Assets.placeGLB) {
                Assets.placeGLB(eggG, 'mini_arena_kit/trophy.glb', { pos: [0, -0.35, 0], fitSize: [0.85, 0.95, 0.85] });
            }
            scene.add(eggG);
            D.eggs.push({ g: eggG, halo, pos: V(ex, ey, ez), taken: false });
        }

        // Raised Grassy & Timber Slingshot Mound
        mesh(scene, new THREE.BoxGeometry(10.5, 0.65, 6.2), woodM, 0, 0, 4.5);
        for (const side of [-1, 1]) {
            mesh(scene, new THREE.BoxGeometry(0.18, 0.18, 6.0), woodM, side * 5.05, 1.05, 4.5);
            for (const z of [1.8, 4.5, 7.2]) mesh(scene, new THREE.BoxGeometry(0.2, 1.15, 0.2), dirtM, side * 5.05, 0.58, z);
        }

        // Windsock with Red & White Stripes
        mesh(scene, new THREE.CylinderGeometry(0.055, 0.085, 3.6, 8), woodM, -4.75, 2.05, 1.75);
        D.sock = new THREE.Group(); D.sock.position.set(-4.75, 3.8, 1.75); scene.add(D.sock);
        for (let i = 0; i < 5; i++) {
            const rad = 0.22 - i * 0.028;
            const stripe = mesh(D.sock, new THREE.CylinderGeometry(rad - 0.028, rad, 0.27, 12, 1, true), i % 2 ? basic(0xffffff) : basic(0xdc2626), 0.13 + i * 0.27, 0, 0);
            stripe.rotation.z = -Math.PI / 2;
        }

        // Iconic First-Person Giant Wooden Y-Slingshot with Elastic Bands & Leather Pouch!
        D.launcher = new THREE.Group(); scene.add(D.launcher);
        const slingWood = std(0x7c4a21, 0.82);
        const forkBase = mesh(D.launcher, new THREE.CylinderGeometry(0.055, 0.068, 0.30, 10), slingWood, 0, -0.22, 0);
        void forkBase;
        for (const side of [-1, 1]) {
            const prong = mesh(D.launcher, new THREE.CylinderGeometry(0.036, 0.048, 0.34, 10), slingWood, side * 0.105, 0.02, 0);
            prong.rotation.z = -side * 0.46;
            mesh(D.launcher, new THREE.CylinderGeometry(0.044, 0.044, 0.05, 10), std(0x1f2937, 0.8), side * 0.175, 0.16, 0);
        }
        const bandGeo = new THREE.BufferGeometry();
        bandGeo.setAttribute('position', new THREE.Float32BufferAttribute([-0.175, 0.16, 0, 0, 0.08, 0.09, 0.175, 0.16, 0], 3));
        D.band = new THREE.Line(bandGeo, new THREE.LineBasicMaterial({ color: 0x3f2314, linewidth: 3 }));
        D.band.frustumCulled = false; D.launcher.add(D.band);
        D.pouch = mesh(D.launcher, new THREE.BoxGeometry(0.11, 0.09, 0.03), std(0x451a03, 0.9), 0, 0.08, 0.11);
        D.loaded = BIRDS.map((b) => {
            const m = buildBird(b);
            m.scale.multiplyScalar(0.24);
            m.rotation.y = Math.PI;
            D.launcher.add(m);
            return m;
        });
        D.launcher.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; o.frustumCulled = false; } });

        // White dotted Angry Birds aim trajectory preview!
        D.dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.085, 8, 6), basic(0xffffff), 28);
        D.dots.frustumCulled = false; D.dots.visible = false; scene.add(D.dots);
        D.dotMatrix = new THREE.Matrix4();

        // Reusable Bird Projectile Pool
        for (const bird of BIRDS) for (let i = 0; i < 9; i++) {
            const model = buildBird(bird); model.visible = false; scene.add(model);
            D.shots.push({ model, bird, vel: V(), seen: new Set(), usedAbility: false });
        }

        // Build 4 Authentic Piggy Fortresses (Wood, Stone, Ice & TNT Crates!)
        for (const [x, z, floors, name, theme] of FORTS) {
            mesh(scene, new THREE.BoxGeometry(8.2, 0.85, 4.4), stoneM, x, 0.42, z);
            const sg = Art.sign(name, 4.4, 0.65, { bg: '#14532d', color: '#fef08a', borderColor: '#84cc16' });
            sg.position.set(x, 0.52, z + 2.24); scene.add(sg);
            let below = [];
            function block(dx, y, width, height, mat, hp, feet, kind = 'wood') {
                const m = mesh(scene, new THREE.BoxGeometry(width, height, 1.8), mat, x + dx, y, z);
                const b = { m, width, height, hp, feet, kind, falling: false, t: 0, spin: rng() - 0.5 };
                D.blocks.push(b); return b;
            }
            function pig(dx, y, role, feet) {
                const g = buildPig(role);
                g.position.set(x + dx, y, z);
                scene.add(g);
                D.pigs.push({ g, y, role, feet, dead: false, hp: role === 'king' ? 2 : role === 'helmet' ? 1.5 : 1, phase: rng() * 6 });
            }
            for (let n = 0; n < floors; n++) {
                const base = 0.85 + n * 2.3;
                const matPost = theme === 'ice' && n > 0 ? iceM : (n === 0 && (theme === 'stone' || theme === 'king') ? stoneM : woodM);
                const kindPost = matPost === iceM ? 'ice' : matPost === stoneM ? 'stone' : 'wood';
                const hpPost = kindPost === 'stone' ? 4 : kindPost === 'ice' ? 1.2 : 2.2;
                const posts = [-1, 1].map((side) => block(side * 2.05, base + 0.98, 0.52, 1.96, matPost, hpPost, below, kindPost));
                // Place a red TNT crate on floor 0 of Stone Citadel & King Pig's Palace!
                if (n === 0 && (theme === 'stone' || theme === 'king')) {
                    block(0, base + 0.58, 1.15, 1.15, tntM, 1, below, 'tnt');
                } else {
                    pig(n % 2 ? -0.68 : 0.68, base + 0.55, n === floors - 1 && theme !== 'wood' ? 'helmet' : 'minion', below);
                }
                const roofKind = (theme === 'ice' || n % 2 === 1) ? 'ice' : 'wood';
                below = [block(0, base + 2.12, 5.2, 0.34, roofKind === 'ice' ? iceM : woodM, roofKind === 'ice' ? 1.2 : 2.2, posts, roofKind)];
            }
            pig(0, 1.48 + floors * 2.3, theme === 'king' ? 'king' : (theme === 'stone' ? 'helmet' : 'minion'), below);
        }
        S.spawned = D.pigs.length;
        if (MA()) MA().start('angrybirds');
    }

    function popEgg(S, egg) {
        if (!egg || egg.taken) return;
        egg.taken = true; egg.g.visible = false; S.data.eggsTaken++;
        S.bumpCombo();
        S.award(Math.round(750 * S.comboMult), egg.pos, '★ GOLDEN EGG BONUS! +750 ★', '#fde047');
        BO.FX.spawnExplosion(egg.pos, 3.6, 0xfacc15);
        SFX.star(3);
        sfxClip('rpg_sfx/handleCoins.ogg', 0.48, 0.06);
        sfxClip('overhaul/env/coin_collect.wav', 0.42, 0.05);
    }

    function popPig(S, pig) {
        if (pig.dead) return;
        pig.dead = true; pig.g.visible = false; S.data.knocked++; S.kills++; S.bumpCombo();
        const pts = pig.role === 'king' ? 1200 : pig.role === 'helmet' ? 550 : 350;
        S.award(pts * S.comboMult, pig.g.position, pig.role === 'king' ? 'KING PIG POPPED!' : 'PIGGY POP!', '#84cc16');
        BO.FX.spawnParticles(pig.g.position, 18, 0x84cc16, 4.5, 2.5, 0.55, 1.1);
        SFX.pop();
        sfxClip('overhaul/combat/crunch_splat.wav', 0.34, 0.12);
        if (pig.role === 'king') sfxClip('rpg_sfx/handleCoins.ogg', 0.45, 0.05);
        if (MA()) MA().pigOink(pig.role === 'king');
    }

    function explodeTNT(S, b) {
        const pos = b.m.position.clone();
        b.falling = true; b.m.visible = false;
        BO.FX.spawnExplosion(pos, 7.2, 0xf97316);
        SFX.rumble(0.8);
        sfxClip('sfx/Gameplay Effects (Desert Shooter)/explosion-a.ogg', 0.52, 0.08);
        sfxClip('sfx/Sci-Fi Sounds (Kenney)/Audio/explosionCrunch_000.ogg', 0.36, 0.08);
        S.award(450, pos, 'TNT CHAIN BLAST!', '#facc15');
        for (const ob of S.data.blocks) {
            if (!ob.falling && ob.m.visible && ob.m.position.distanceTo(pos) < 6.4) {
                if (ob.kind === 'tnt') explodeTNT(S, ob);
                else ob.falling = true;
            }
        }
        for (const pg of S.data.pigs) if (!pg.dead && pg.g.position.distanceTo(pos) < 6.8) popPig(S, pg);
        for (const eg of S.data.eggs || []) if (!eg.taken && eg.pos.distanceTo(pos) < 6.8) popEgg(S, eg);
    }

    function strike(S, p, position) {
        const D = S.data, bSpec = p.bird;
        BO.FX.spawnParticles(position, 14, bSpec.color, 5, 3, 0.45, 1);
        if (bSpec.id === 'bomb') {
            BO.FX.spawnExplosion(position, bSpec.radius, 0xf97316);
            SFX.rumble(0.65);
            sfxClip('sfx/Gameplay Effects (Desert Shooter)/explosion-b.ogg', 0.50, 0.08);
        } else {
            sfxClip(bSpec.id === 'blues' ? 'sfx/Impact Sounds (Kenney)/Audio/impactGlass_heavy_000.ogg' : 'sfx/Impact Sounds (Kenney)/Audio/impactWood_heavy_000.ogg', 0.38, 0.1);
            if (MA()) MA().woodBreak(); else SFX.bonk();
        }

        let scored = false;
        for (const b of D.blocks) {
            if (b.falling || !b.m.visible) continue;
            const v = b.m.position;
            const gap = Math.hypot(Math.max(0, Math.abs(v.x - position.x) - b.width / 2), Math.max(0, Math.abs(v.y - position.y) - b.height / 2), Math.max(0, Math.abs(v.z - position.z) - 0.9));
            if (gap <= bSpec.radius) {
                if (b.kind === 'tnt') { explodeTNT(S, b); scored = true; continue; }
                let mult = 1;
                if (bSpec.id === 'chuck' && b.kind === 'wood') mult = 2.4;
                if (bSpec.id === 'blues' && b.kind === 'ice') mult = 3.0;
                if (bSpec.id === 'bomb' && b.kind === 'stone') mult = 2.5;
                if ((b.hp -= bSpec.damage * mult) <= 0) { b.falling = true; scored = true; }
            }
        }
        for (const pg of D.pigs) {
            if (!pg.dead && pg.g.position.distanceTo(position) <= bSpec.radius + 0.55) {
                popPig(S, pg); scored = true;
            }
        }
        for (const eg of D.eggs || []) {
            if (!eg.taken && eg.pos.distanceTo(position) <= bSpec.radius + 0.65) {
                popEgg(S, eg); scored = true;
            }
        }
        if (scored && !p.scored) { p.scored = true; S.shotHits++; S.hits++; }
    }

    function triggerMidAirAbility(S) {
        const D = S.data, p = D.activeShot;
        if (!p || !p.model.visible || p.usedAbility) return false;
        p.usedAbility = true;
        if (p.bird.id === 'chuck') {
            p.vel.multiplyScalar(1.85);
            BO.FX.spawnParticles(p.model.position, 14, 0xfacc15, 5, 2, 0.35, 0.9);
            if (MA()) MA().birdLaunch(1);
            MG.toast('⚡ CHUCK TURBO BOOST!', '#facc15');
            return true;
        }
        if (p.bird.id === 'bomb') {
            strike(S, p, p.model.position.clone());
            p.model.visible = false;
            D.activeShot = null;
            MG.toast('💥 BOMB DETONATION!', '#f97316');
            return true;
        }
        if (p.bird.id === 'blues') {
            for (const ang of [-0.14, 0.14]) {
                const clone = D.shots.find((s) => s.bird === p.bird && !s.model.visible);
                if (clone) {
                    clone.model.visible = true; clone.model.position.copy(p.model.position);
                    clone.vel.copy(p.vel).applyAxisAngle(V(0, 1, 0), ang);
                    clone.wind = p.wind; clone.life = p.life; clone.scored = false; clone.seen.clear(); clone.usedAbility = true;
                }
            }
            if (MA()) MA().birdLaunch(3);
            MG.toast('🐦 THE BLUES TRIPLE SPLIT!', '#38bdf8');
            return true;
        }
        return false;
    }

    function flight(S, dt) {
        const D = S.data;
        for (const p of D.shots) {
            if (!p.model.visible) continue;
            const steps = Math.ceil(dt / 0.006);
            for (let j = 0; j < steps && p.model.visible; j++) {
                const h = dt / steps, pt = p.model.position;
                pt.addScaledVector(p.vel, h); pt.x += 0.5 * p.wind * h * h; pt.y -= 0.5 * GRAVITY * h * h;
                p.vel.x += p.wind * h; p.vel.y -= GRAVITY * h; p.life -= h;
                const target = D.blocks.find((b) => !b.falling && !p.seen.has(b) && Math.abs(pt.x - b.m.position.x) < b.width / 2 + 0.22 && Math.abs(pt.y - b.m.position.y) < b.height / 2 + 0.22 && Math.abs(pt.z - b.m.position.z) < 1.05)
                    || D.pigs.find((pg) => !pg.dead && pg.g.position.distanceToSquared(pt) < 0.72)
                    || (D.eggs && D.eggs.find((eg) => !eg.taken && eg.pos.distanceToSquared(pt) < 0.85));
                if (target || pt.y < 0.28) {
                    strike(S, p, pt);
                    if (target && p.pierces > 0) { p.seen.add(target); p.pierces--; }
                    else { p.model.visible = false; if (D.activeShot === p) D.activeShot = null; }
                }
                if (p.life <= 0) { p.model.visible = false; if (D.activeShot === p) D.activeShot = null; }
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
        if (running && MA()) MA().tick(dt);
        if (running) {
            D.oinkTimer -= dt;
            if (D.oinkTimer <= 0 && D.pigs.some((pg) => !pg.dead)) {
                D.oinkTimer = 4.5 + Math.random() * 4;
                if (MA()) MA().pigOink(false);
            }
        }
        if (held) {
            if (!D.drawing) {
                if (triggerMidAirAbility(S)) return;
                sfxClip('rpg_sfx/creak1.ogg', 0.30, 0.08);
                if (MA()) MA().slingStretch();
            }
            D.drawing = true;
            D.charge = Math.min(1, D.charge + dt / 0.85);
        }
        const bSpec = BIRDS[D.selected], pull = D.charge;
        D.wind = Math.sin(S.t * 0.17) * 3.4;
        D.sock.rotation.y = -Math.atan2(1, D.wind);
        D.sock.rotation.z = -0.32 + Math.min(0.22, Math.abs(D.wind) * 0.06) + Math.sin(S.t * 7) * 0.05;
        cam.getWorldDirection(D.direction);
        D.launcher.position.copy(cam.position).add(D.local.set(0.24, -0.22, -0.62).applyQuaternion(cam.quaternion));
        D.launcher.quaternion.copy(cam.quaternion);

        const pouchZ = 0.09 + pull * 0.28;
        D.band.geometry.attributes.position.setXYZ(1, 0, 0.08, pouchZ);
        D.band.geometry.attributes.position.needsUpdate = true;
        D.pouch.position.set(0, 0.08, pouchZ + 0.03);
        D.loaded.forEach((m, i) => { m.visible = i === D.selected; m.position.set(0, 0.08, pouchZ - 0.02); });
        D.origin.copy(D.launcher.position).add(D.local.set(0, 0.08, pouchZ).applyQuaternion(cam.quaternion));
        D.velocity.copy(D.direction).multiplyScalar(bSpec.speed * (0.58 + 0.42 * pull)); D.velocity.y += 2.5;
        D.dots.visible = held;
        if (held) {
            let count = 0;
            for (let i = 1; i <= 28; i++) {
                const t = i * 0.055, v = D.scratch.copy(D.origin).addScaledVector(D.velocity, t);
                v.y -= 0.5 * GRAVITY * t * t; v.x += 0.5 * D.wind * t * t;
                if (v.y < 0.25) break;
                D.dots.setMatrixAt(count++, D.dotMatrix.makeTranslation(v.x, v.y, v.z));
            }
            D.dots.count = count; D.dots.instanceMatrix.needsUpdate = true;
        }
        if (!held && D.drawing) {
            const p = D.shots.find((s) => s.bird === bSpec && !s.model.visible);
            if (p) {
                p.model.visible = true; p.model.position.copy(D.origin); p.vel.copy(D.velocity);
                p.wind = D.wind; p.life = 3.5; p.pierces = bSpec.id === 'chuck' ? 2 : 0;
                p.scored = false; p.seen.clear(); p.usedAbility = false;
                D.activeShot = p; S.shots++;
                if (MA()) MA().birdLaunch(D.selected); else SFX.launch();
            }
            D.drawing = false; D.charge = 0;
        }
        if (!running) return;
        flight(S, dt);

        for (const b of D.blocks) {
            if (!b.m.visible) continue;
            if (!b.falling && b.feet.length && b.feet.every((f) => f.falling)) b.falling = true;
            if (!b.falling) continue;
            b.t += dt; b.m.position.y -= 16 * b.t * dt;
            b.m.rotation.z += b.spin * 3 * dt;
            if (b.m.position.y <= 0.35) {
                b.m.visible = false;
                BO.FX.spawnParticles(b.m.position, 6, b.kind === 'ice' ? 0x7dd3fc : b.kind === 'stone' ? 0x94a3b8 : 0xb45309, 3, 1.5, 0.34, 0.7);
                S.award(50, b.m.position);
            }
        }
        for (const pg of D.pigs) {
            if (pg.dead) continue;
            if (pg.feet.length && pg.feet.every((f) => f.falling)) { popPig(S, pg); continue; }
            pg.g.position.y = pg.y + Math.abs(Math.sin(S.t * 3.0 + pg.phase)) * 0.08;
            pg.g.rotation.y = Math.sin(S.t * 1.4 + pg.phase) * 0.32;
        }
        for (const eg of D.eggs || []) {
            if (eg.taken) continue;
            eg.g.rotation.y += dt * 1.9;
            eg.halo.rotation.x = Math.sin(S.t * 2.5) * 0.6;
        }
        if (D.knocked === D.pigs.length) {
            const secondsLeft = Math.max(0, Math.floor(90 - S.t));
            S.award(2000 + secondsLeft * 35, null, null);
            sfxClip('overhaul/stingers/level_complete.wav', 0.45, 0.02);
            MG.finish('ALL BAD PIGGIES POPPED!', { color: '#84cc16' });
        }
    }

    MG.register({
        id: 'fun_angry_birds', cat: 'fun', order: 1, name: 'Angry Birds FPS', icon: '🐦', badge: 'SLINGSHOT', accent: '#ef4444',
        tagline: 'Pull back the wooden slingshot! Fling Red, Chuck, Bomb & The Blues to topple King Pig’s fortresses!',
        desc: 'Defend Piggy Island from your grassy wooden slingshot perch! Launch Red, Chuck (click mid-air for Turbo Boost!), Bomb (click mid-air to Detonate!), and The Blues (click mid-air for Triple Split!) to smash wood, stone, ice & TNT fortresses and pop King Pig and his Bad Piggies!',
        guide: { objective: 'Pop all Bad Piggies (including Helmet Pigs and King Pig) across four fortresses in 90 seconds.', tips: ['Hold LMB to draw the wooden slingshot and see the white dotted flight arc. Release to fling!', 'Click LMB again while a bird is in flight to trigger Chuck’s Turbo Boost, Bomb’s TNT blast, or The Blues’ Triple Split!', 'Aim for red TNT crates or bottom wooden supports to collapse entire pig towers at once!'] },
        keys: [['Hold / Release LMB', 'Draw & fling bird'], ['Click LMB Mid-Air', 'Bird special ability'], ['1 / 2 / 3 / 4', 'Red / Chuck / Bomb / Blues'], ['WASD', 'Move on perch']],
        heroLabel: 'ANGRY BIRDS • PIGGY FORTRESS SMASH', duration: 90, stars: [2200, 4800, 8000, 12000],
        standardWeapon: 'm1911', lockWeapon: true, blockFire: true, hideViewmodel: true, customMusic: true,
        weaponLabel: 'WOODEN Y-SLINGSHOT', weaponNote: 'Hold LMB to aim • Release to launch • Click mid-air for Bird Ability!',
        map: {
            atmosphere: { skyTop: 0x38bdf8, skyBottom: 0xdbeafe, fogColor: 0xbae6fd, fogDensity: 0.0045, sunColor: 0xfff8dc, sunIntensity: 1.75, sunPos: [-25, 55, 20], hemiSky: 0xe0f2fe, hemiGround: 0x15803d, hemiIntensity: 1.0 },
            boxes: [B(0, -0.55, -20, 180, 1, 180, 'nuketown_grass')],
            spawn: { x: 0, y: 0.35, z: 4.5, yaw: 0 }
        },
        build, update,
        dispose() { if (MA()) MA().stop(); },
        result(S) {
            const stars = S.def.stars.filter((threshold) => S.score >= threshold).length;
            const accuracy = S.shots ? S.shotHits / S.shots : 0;
            return {
                score: S.score, stars, accuracy, xp: Math.round(120 + S.score * 0.06 + stars * 150),
                title: S.kills === S.spawned ? '3-STAR PIGGY WIPEOUT!' : 'SLINGSHOT REPORT',
                stats: [['PIGS POPPED', S.kills + ' / ' + S.spawned], ['BIRDS FLUNG', S.shots], ['HIT RATE', Math.round(accuracy * 100) + '%'], ['BLOCKS SMASHED', S.data.blocks.filter((b) => b.falling).length]]
            };
        },
        onKey(S, code) {
            const index = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(code);
            if (index < 0 || MG.state !== 'running') return false;
            S.data.selected = index; SFX.clack();
            MG.toast(`${BIRDS[index].name} READY — ${BIRDS[index].ability}`, '#fde047');
            return true;
        },
        hud(S) {
            const D = S.data, b = BIRDS[D.selected];
            return `<div class="course-console" style="border-bottom-color:#ef4444"><strong>🐦 ${b.name} (${b.role})</strong><span>DRAW <b>${Math.round(D.charge * 100)}%</b></span><span>WIND <b>${(D.wind < 0 ? '← ' : '→ ') + Math.abs(D.wind).toFixed(1)}</b></span><span>PIGS LEFT <b>${D.pigs.length - D.knocked} / ${D.pigs.length}</b></span><span>🥚 EGGS <b>${D.eggsTaken || 0}/3</b></span><span>[1-4] SWITCH BIRD</span></div>`;
        }
    });
})(window.BO);
