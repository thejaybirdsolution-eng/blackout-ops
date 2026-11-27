/* ============================================================================
   FLIGHT CIRCUIT — 360 Trick Shot Pro Arena
   5 Handcrafted Maps (Industrial Foundry, Snowy Alpine Cliffside, Neon Cyber
   Rooftops, Red-Rock Canyon Dam, Orbital Zero-G Gantry), 5 Launch Towers per
   arena, Bounce Pads, Ricochet Gongs, Propane Barrels, UAV Drone, Spin Lamps &
   World-Space Slow-Mo Chase Replay!
============================================================================ */
(function (BO) {
    'use strict';
    const { group, part, box, rod, drum, ring, sign, std, basic, texMat, bouncePad, explosiveBarrel } = BO.CourseScenery;
    const A = BO.MinigameArt;
    const L = BO.MinigameLib;
    const MA = () => BO.MinigameAudio;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);

    const MAP_DEFS = {
        industrial: {
            id: 'industrial', label: 'Foundry Tower', desc: 'Upgraded Foundry Tower, cranes, shipping containers & neon conduits.',
            skybox: null, skyTop: 0x0b1224, skyBottom: 0xd9561a, fogColor: 0x3b180a, fogDensity: 0.0042,
            hemiSky: 0xfdba74, hemiGround: 0x1e293b, grav: 1.0, floorMat: 'asphalt', floorTint: null,
            pads: [
                { x: 0, z: 0, y: 26, name: 'Dispatch Helipad' },
                { x: -23, z: -4, y: 20, name: 'Freight Gantry' },
                { x: 23, z: -8, y: 25, name: 'Harbor Crane' },
                { x: -21, z: -39, y: 31, name: 'Comms Mast' },
                { x: 13, z: -46, y: 36, name: 'Refinery Stack' }
            ]
        },
        alpine: {
            id: 'alpine', label: 'Alpine Cliffside', desc: 'Snowy alpine cliffside, pine ridges, timber chalets & gondola pylons.',
            skybox: 'skybox-day.png', skyTop: 0x0369a1, skyBottom: 0xe0f2fe, fogColor: 0xbae6fd, fogDensity: 0.0036,
            hemiSky: 0xe0f2fe, hemiGround: 0x475569, grav: 1.0, floorMat: 'snow', floorTint: 0xe2e8f0,
            pads: [
                { x: 0, z: 0, y: 26, name: 'Summit Gondola' },
                { x: -24, z: -6, y: 21, name: 'Glacier Pylon' },
                { x: 24, z: -10, y: 26, name: 'Timber Lookout' },
                { x: -19, z: -40, y: 32, name: 'Avalanche Ridge' },
                { x: 15, z: -45, y: 37, name: 'Peak Observatory' }
            ]
        },
        neon_cyber: {
            id: 'neon_cyber', label: 'Neon Cyber', desc: 'Cyberpunk skyscraper rooftop gap, neon rain & holo-billboards.',
            skybox: 'skybox-night.png', skyTop: 0x050314, skyBottom: 0x3b0764, fogColor: 0x1a0633, fogDensity: 0.0046,
            hemiSky: 0xf472b6, hemiGround: 0x0f172a, grav: 1.0, floorMat: 'asphalt', floorTint: 0x090d16,
            pads: [
                { x: 0, z: 0, y: 26, name: 'Arasaka Spire' },
                { x: -22, z: -6, y: 22, name: 'Holo Deck' },
                { x: 22, z: -9, y: 27, name: 'Synth Crane' },
                { x: -20, z: -38, y: 31, name: 'Netrunner Relay' },
                { x: 14, z: -46, y: 37, name: 'Skyline Apex' }
            ]
        },
        canyon_dam: {
            id: 'canyon_dam', label: 'Canyon Dam', desc: 'Massive Red-Rock Canyon Dam spillway drop & rushing river gorge.',
            skybox: 'skybox-morning.png', skyTop: 0x1e3a8a, skyBottom: 0xfdba74, fogColor: 0x7c2d12, fogDensity: 0.0038,
            hemiSky: 0xfed7aa, hemiGround: 0x7c2d12, grav: 1.0, floorMat: 'concrete', floorTint: 0x9a3412,
            pads: [
                { x: 0, z: 0, y: 26, name: 'Dam Crest' },
                { x: -24, z: -5, y: 22, name: 'West Spillway' },
                { x: 24, z: -7, y: 26, name: 'Turbine Crane' },
                { x: -20, z: -40, y: 32, name: 'Red Mesa Rim' },
                { x: 14, z: -45, y: 36, name: 'Canyon Overlook' }
            ]
        },
        orbital_ring: {
            id: 'orbital_ring', label: 'Orbital Ring', desc: 'Zero-G orbital gantry, space skybox, starfield & plasma jump rings.',
            skybox: 'skybox-space.png', skyTop: 0x020617, skyBottom: 0x0f172a, fogColor: 0x020617, fogDensity: 0.0022,
            hemiSky: 0x38bdf8, hemiGround: 0x1e1b4b, grav: 0.65, floorMat: 'diamond_plate', floorTint: 0x1e293b,
            pads: [
                { x: 0, z: 0, y: 26, name: 'Docking Bay 01' },
                { x: -23, z: -5, y: 21, name: 'Solar Gantry' },
                { x: 23, z: -8, y: 25, name: 'Plasma Pylon' },
                { x: -20, z: -39, y: 30, name: 'Telemetry Mast' },
                { x: 14, z: -46, y: 36, name: 'Orbital Core' }
            ]
        }
    };

    const targets = [V(0, 0, -18), V(-1, 0, -16), V(3, 0, -23), V(-3, 0, -24), V(1, 0, -25)];

    function mapDef(D) { return MAP_DEFS[D && D.mapId] || MAP_DEFS.industrial; }
    function padsFor(D) { return mapDef(D).pads; }
    function pad(D) { const ps = padsFor(D); return ps[Math.min(ps.length - 1, (D.round || 1) - 1)]; }
    function frame(p, i) { return Math.atan2(p.x - targets[i].x, p.z - targets[i].z); }

    function applyAtmosphere(S, m) {
        if (m.skybox) L.applySkybox(S.scene, m.skybox);
        else {
            S.scene.background = new THREE.Color(m.skyBottom);
            S.scene.traverse((o) => {
                if (o.isMesh && o.material && o.material.isShaderMaterial && o.material.uniforms && o.material.uniforms.uZenith) {
                    o.visible = true;
                    o.material.uniforms.uZenith.value.setHex(m.skyTop);
                    o.material.uniforms.uHorizon.value.setHex(m.skyBottom);
                }
            });
        }
        if (S.scene.fog) { S.scene.fog.color.setHex(m.fogColor); S.scene.fog.density = m.fogDensity; }
        S.scene.traverse((o) => {
            if (o.isHemisphereLight) { o.color.setHex(m.hemiSky); o.groundColor.setHex(m.hemiGround); }
        });
    }

    function buildThemedMap(S, m, animated) {
        const CS = BO.CourseScenery;
        const steel = texMat('diamond_plate', 4, 4), rust = texMat('rusted_metal', 4, 6);
        const concrete = texMat('soviet_concrete', 4, 8);
        const rng = L.mulberry32(563 + m.id.length * 97);

        if (m.floorTint) {
            const ov = new THREE.Mesh(new THREE.PlaneGeometry(132, 132), std(m.floorTint, m.id === 'neon_cyber' ? 0.25 : 0.85, m.id === 'orbital_ring' ? 0.55 : 0.08));
            ov.rotation.x = -Math.PI / 2; ov.position.set(0, 0.02, -16); ov.receiveShadow = true; S.add(ov);
        }

        if (m.id === 'industrial') {
            CS.cargoContainer(S, -16, 0, -20, 3.2, 2.9, 8.5, 'red', 0);
            CS.cargoContainer(S, 16, 0, -22, 3.2, 2.9, 8.5, 'blue', 0);
            CS.cargoContainer(S, -10, 0, -35, 8.5, 2.9, 3.2, 'olive', 0);
            CS.cargoContainer(S, 11, 0, -35, 8.5, 2.9, 3.2, 'red', 0);
            CS.humvee(S.scene, -16, 0, -7.5, 0.45, 0x3f4d36, false);
            L.placeGLBInstanced(S.scene, 'city_industrial_kit/chimney-large.glb', [
                { pos: [-38, 0, -45], scale: 5.5 }, { pos: [38, 0, -42], scale: 5.0 }
            ]);
            L.placeGLB(S.scene, 'city_industrial_kit/water-tower.glb', { pos: [-34, 0, -16], scale: 4.5 });
            for (const [tx, tz] of [[-18, -10], [18, -10], [-18, -32], [18, -32]]) S.add(A.torch(S, V(tx, 0, tz), 0xf97316, true));
            for (let i = 0; i < 28; i++) {
                const a = (i / 28) * Math.PI * 2, r = 56 + rng() * 18, x = Math.cos(a) * r, z = -18 + Math.sin(a) * r, h = 10 + rng() * 28;
                const bld = A.building(6 + rng() * 5, h, 6 + rng() * 5, 0x334155, i + 1, 0.55, true);
                bld.position.set(x, h / 2, z); bld.rotation.y = -a; S.add(bld);
            }
        } else if (m.id === 'alpine') {
            CS.alpineChalet(S.scene, -24, 0, -22, 0.5, 1.35);
            CS.alpineChalet(S.scene, 25, 0, -26, -0.4, 1.25);
            // Snowy mountain peaks & pine tree ridges
            const snowM = std(0xf8fafc, 0.85), rockM = std(0x475569, 0.9);
            const treeList = [];
            for (let i = 0; i < 26; i++) {
                const a = (i / 26) * Math.PI * 2, r = 52 + rng() * 22, x = Math.cos(a) * r, z = -18 + Math.sin(a) * r;
                const mh = 18 + rng() * 28, mr = 14 + rng() * 10;
                const peak = new THREE.Mesh(new THREE.ConeGeometry(mr, mh, 6), rockM);
                peak.position.set(x, mh * 0.5 - 1, z); S.add(peak);
                const cap = new THREE.Mesh(new THREE.ConeGeometry(mr * 0.55, mh * 0.52, 6), snowM);
                cap.position.set(x, mh * 0.76 - 0.5, z); S.add(cap);
                if (i < 18) treeList.push({ pos: [Math.cos(a) * (32 + rng() * 12), 0, -18 + Math.sin(a) * (30 + rng() * 12)], scale: 2.8 + rng() * 1.4, rot: rng() * Math.PI });
            }
            L.placeGLBInstanced(S.scene, 'mini_forest_kit/tree-high.glb', treeList);
            // Gondola pylons + overhead steel cable
            for (const gx of [-32, 32]) {
                box(S.scene, gx, 16, -18, 1.1, 32, 1.1, steel);
                box(S.scene, gx, 31.5, -18, 5.2, 0.8, 0.8, rust);
            }
            rod(S.scene, V(-32, 31.5, -18), V(32, 31.5, -18), 0.1, steel);
        } else if (m.id === 'neon_cyber') {
            // Neon skyscraper canyon + Holo-Billboards + Neon Rain!
            const holoMsgs = [
                ['SYNTH // 2099', '#090d16', '#22d3ee'], ['CYBER SHOT', '#3b0764', '#f472b6'],
                ['APEX NEON', '#0f172a', '#fde047'], ['GHOST GRID', '#052e16', '#4ade80']
            ];
            for (let i = 0; i < 24; i++) {
                const a = (i / 24) * Math.PI * 2, r = 50 + rng() * 18, x = Math.cos(a) * r, z = -18 + Math.sin(a) * r, h = 16 + rng() * 34;
                const bld = A.building(7 + rng() * 5, h, 7 + rng() * 5, i % 2 ? 0x1e1b4b : 0x0f172a, i + 7, 0.85, true);
                bld.position.set(x, h / 2, z); bld.rotation.y = -a; S.add(bld);
                if (i % 6 === 0) {
                    const [txt, bg, fg] = holoMsgs[(i / 6) % holoMsgs.length];
                    const hb = A.sign(txt, 8.5, 2.2, { bg, color: fg, borderColor: fg, glow: fg, size: 0.42 });
                    hb.position.set(x * 0.72, 14 + (i % 3) * 5, z * 0.72 - 4);
                    hb.lookAt(0, hb.position.y, -18);
                    S.add(hb);
                }
            }
            // Neon floor grid strips
            for (let gx = -24; gx <= 24; gx += 8) {
                box(S.scene, gx, 0.04, -18, 0.12, 0.04, 62, basic(gx % 16 === 0 ? 0xf472b6 : 0x22d3ee));
            }
            // Neon rain particle system
            const rCount = 320, rPos = new Float32Array(rCount * 3);
            for (let i = 0; i < rCount; i++) {
                rPos[i * 3] = (rng() - 0.5) * 70;
                rPos[i * 3 + 1] = rng() * 44;
                rPos[i * 3 + 2] = -18 + (rng() - 0.5) * 70;
            }
            const rGeo = new THREE.BufferGeometry();
            rGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3));
            const rain = new THREE.Points(rGeo, new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.24, transparent: true, opacity: 0.7 }));
            S.add(rain);
            animated.push({ obj: rain, kind: 'rain' });
        } else if (m.id === 'canyon_dam') {
            // Massive Concrete Dam Wall behind targets + Spillway Waterfall + Red-Rock Mesas!
            const mesaM = std(0x9a3412, 0.92), redRockM = std(0xb45309, 0.88);
            box(S.scene, 0, 14, -56, 76, 30, 8, concrete);
            for (const sx of [-18, -6, 6, 18]) {
                box(S.scene, sx, 16, -51.5, 2.2, 30, 2.5, rust);
            }
            // Spillway water chute & river channel below
            const waterM = new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 0.35, roughness: 0.18, transparent: true, opacity: 0.85 });
            const spill = new THREE.Mesh(new THREE.PlaneGeometry(18, 34), waterM);
            spill.position.set(0, 14, -51.2); spill.rotation.x = 0.18; S.add(spill);
            const river = new THREE.Mesh(new THREE.PlaneGeometry(24, 66), waterM);
            river.rotation.x = -Math.PI / 2; river.position.set(0, 0.05, -20); S.add(river);
            for (let i = 0; i < 20; i++) {
                const a = (i / 20) * Math.PI * 2, r = 52 + rng() * 18, x = Math.cos(a) * r, z = -18 + Math.sin(a) * r;
                const h = 14 + rng() * 26, w = 14 + rng() * 10;
                const mesa = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.65, w, h, 7), i % 2 ? mesaM : redRockM);
                mesa.position.set(x, h * 0.5, z); S.add(mesa);
            }
        } else if (m.id === 'orbital_ring') {
            // Space Starfield + Glowing Plasma Jump Rings + Orbital Reactor Cores!
            const sCount = 450, sPos = new Float32Array(sCount * 3);
            for (let i = 0; i < sCount; i++) {
                const a = rng() * Math.PI * 2, rad = 75 + rng() * 65;
                sPos[i * 3] = Math.cos(a) * rad;
                sPos[i * 3 + 1] = 10 + (rng() - 0.3) * 90;
                sPos[i * 3 + 2] = -18 + Math.sin(a) * rad;
            }
            const sGeo = new THREE.BufferGeometry();
            sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
            S.add(new THREE.Points(sGeo, new THREE.PointsMaterial({ color: 0xe0f2fe, size: 0.45 })));
            for (const [rx, ry, rz] of [[0, 15, -10], [-13, 14, -20], [13, 16, -24], [0, 21, -30]]) {
                const pr = ring(S.scene, rx, ry, rz, 3.6, 0.22, basic(0x38bdf8));
                pr.rotation.y = Math.PI * 0.15;
                animated.push({ obj: pr, kind: 'spin' });
            }
            for (const [cx, cz] of [[-38, -18], [38, -18], [0, -52]]) {
                const core = part(S.scene, new THREE.OctahedronGeometry(4.2, 0), basic(0xc084fc), cx, 18, cz);
                animated.push({ obj: core, kind: 'spin' });
            }
        }
    }

    function build(S) {
        const D = S.data;
        const m = mapDef(D);
        applyAtmosphere(S, m);
        const metal = texMat('diamond_plate', 4, 4), rust = texMat('rusted_metal', 4, 6);
        const concrete = texMat('soviet_concrete', 4, 8);
        const gold = basic(0xffbb66), cyan = basic(0x38bdf8), red = basic(0xef4444);

        const animated = [];
        buildThemedMap(S, m, animated);

        const pads = m.pads;
        for (let i = 0; i < pads.length; i++) {
            const p = pads[i], g = group(S.scene, p.x, p.y, p.z);
            if (i) {
                const deck = S.box(p.x, p.y - 0.22, p.z, 5.8, 0.44, 5.8, metal, { solid: true });
                deck.receiveShadow = true;
                if (i === 4) {
                    drum(g, 0, -p.y / 2, 0, 2.45, 3.4, p.y, concrete, 22);
                    for (let h = 4; h < p.y; h += 4) drum(g, 0, -h, 0, 2.95, 2.95, 0.28, rust, 20);
                } else {
                    for (const x of [-2.2, 2.2]) for (const z of [-2.2, 2.2]) box(g, x, -p.y / 2, z, 0.30, p.y, 0.30, metal);
                    for (let h = 1; h < p.y - 3; h += 4) {
                        rod(g, V(-2.2, -h, 2.2), V(2.2, -h - 4, 2.2), 0.12, rust);
                        rod(g, V(-2.2, -h, -2.2), V(-2.2, -h - 4, 2.2), 0.12, rust);
                    }
                    if (i === 2) {
                        rod(g, V(-2, -2, 0), V(3, 6.5, 0), 0.30, rust);
                        rod(g, V(3, 6.5, 0), V(8.5, 6.5, -6), 0.24, metal);
                        rod(g, V(8.5, 6.5, -6), V(8.5, -4, -6), 0.05, metal);
                        box(g, 8.5, -4.6, -6, 1.8, 1.4, 1.4, rust);
                    }
                    if (i === 3) {
                        rod(g, V(-2, 0, 2), V(-2, 10, 2), 0.14, red);
                        const strobe = drum(g, -2, 10.2, 2, 0.22, 0.22, 0.44, gold);
                        animated.push({ obj: strobe, kind: 'blink' });
                    }
                }
            } else {
                const hRing = ring(g, 0, 0.04, 0.4, 1.9, 0.08, gold);
                hRing.rotation.x = -Math.PI / 2;
                const radar = group(g, 2.2, 1.5, 2.2);
                rod(radar, V(0, -1.5, 0), V(0, 0, 0), 0.1, metal);
                box(radar, 0, 0.2, 0, 1.6, 0.45, 0.12, cyan);
                animated.push({ obj: radar, kind: 'spin' });
            }
            const strip = group(g, 0, 0.045, 0);
            strip.rotation.y = frame(p, i);
            for (let j = 0; j < 3; j++) for (const side of [-1, 1]) {
                const chevron = box(strip, side * 0.32, 0.015, -0.23 - j * 0.68, 0.14, 0.03, 0.78, i === 0 ? gold : cyan);
                chevron.rotation.y = -side * 0.77;
            }
            if (i > 0) {
                sign(strip, `PAD ${i + 1} • ${p.name.toUpperCase()}`, 0, 2.9, -2.35, 4.9, 0.65, '#fde68a', '#111827');
                for (const sx of [-2.2, 2.2]) box(strip, sx, 1.45, -2.35, 0.16, 2.9, 0.16, metal);
            }
        }

        // Dynamic 12-Lamp Spin Progress Bar mounted to active launch pad
        const lampBar = group(S.scene);
        const lampGeometry = new THREE.BoxGeometry(0.2, 0.09, 0.55);
        D.lamps = Array.from({ length: 12 }, (_, i) => {
            const lamp = new THREE.Mesh(lampGeometry, basic(0x254451).clone());
            lamp.position.set(-2.2 + i * 0.4, 0.09, -2.35);
            lampBar.add(lamp);
            return lamp;
        });

        // 3 Pneumatic Bounce Pads for 720° / 1080° Mid-Air Double-Bounce Trickshots!
        const bouncePads = [
            bouncePad(S.scene, 0, 0, -9.5, 2.4, 0x22d3ee),
            bouncePad(S.scene, -11.5, 0, -18, 2.3, 0x38bdf8),
            bouncePad(S.scene, 11.5, 0, -24, 2.3, 0x38bdf8)
        ];

        // 2 Suspended Steel Ricochet Gongs (shoot while armed -> instant bank-shot into runner!)
        const gongs = [[-13.5, 7.2, -16], [13.5, 7.2, -26]].map(([gx, gy, gz]) => {
            const pl = A.steelPlate(0.95, 0xfacc15);
            const tg = S.addTarget({
                mesh: pl.mesh, hitMeshes: pl.hitMeshes, pos: V(gx, gy, gz),
                life: 0, appear: 'none', inT: 0.01, death: 'none', bonus: true
            });
            tg.isRicochetGong = true;
            return tg;
        });

        // 2 Explosive Red Propane Barrels near runner path (shoot for Explosive Bank-Shot!)
        const barrels = [[-6.5, 0, -17], [6.5, 0, -23]].map(([bx, by, bz]) => {
            const b = explosiveBarrel();
            const tg = S.addTarget({
                mesh: b.group, hitMeshes: b.hitMeshes, pos: V(bx, by, bz),
                life: 0, appear: 'none', inT: 0.01, death: 'burst', deathColor: 0xf97316, bonus: true
            });
            tg.isPropaneBarrel = true;
            return tg;
        });

        // Orbiting Aerial UAV Bonus Drone
        const dr = A.drone('speeder');
        const uav = S.addTarget({
            mesh: dr.mesh, hitMeshes: dr.hitMeshes, pos: V(0, 14, -22),
            life: 0, appear: 'scale', inT: 0.2, death: 'burst', deathColor: 0x22d3ee, bonus: true,
            onTick: (t, dt) => {
                t.root.position.set(Math.cos(S.t * 0.9) * 16, 13.5 + Math.sin(S.t * 2.1) * 1.8, -22 + Math.sin(S.t * 0.9) * 10);
                if (dr.rotors) for (const rt of dr.rotors) rt.rotation.y += dt * 28;
            }
        });
        uav.isBonusUav = true;

        // World-space Replay Stunt Double + Glowing Ribbon Trail + Tracer Shell
        const double = BO.MGFigures.human({ shirt: 0x25868e, pants: 0x253446, hat: 'helmet', hatColor: 0xf5b05a, gun: 'rifle' });
        S.add(double.root); double.root.visible = false;
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(96 * 3), 3));
        const trail = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x7fe9e8, transparent: true, opacity: 0.85 }));
        trail.frustumCulled = false; trail.visible = false; S.add(trail);
        const shell = part(S.scene, new THREE.SphereGeometry(0.11, 8, 6), gold, 0, 0, 0);
        shell.visible = false;

        D.flight = {
            samples: [], timer: 0, double, trail, shell, lampBar, bouncePads, gongs, barrels, uav, animated,
            from: V(), to: V(), lastPeak: 0, feedback: '', bestSnap: Infinity, mapGrav: m.grav || 1.0,
            practice: !!D.isSandbox, ready: false,
            spinsDone: 0, nacSwap: false, barrelRoll: false, rollT: 0, bounceCount: 0, styleTags: [], lastQuarter: 0
        };
        if (D.isSandbox) S.duration = 0;
        if (MA()) MA().start('trickshot');
        reset(S);
    }

    function reset(S) {
        const D = S.data, p = pad(D), i = Math.min(4, (D.round || 1) - 1), P = BO.Player;
        const yaw = frame(p, i);
        P.pos.set(p.x, p.y + 0.14, p.z);
        P.vel.set(0, 0, 0);
        P.yaw = yaw; P.pitch = -0.28;
        P.parkourRoll = 0;
        P.onGround = true;
        D.lastYaw = P.yaw;
        const f = D.flight;
        if (f && f.lampBar) {
            f.lampBar.position.set(p.x, p.y, p.z);
            f.lampBar.rotation.y = yaw;
        }
        if (f) {
            f.samples.length = 0; f.timer = 0; f.lastPeak = 0; f.ready = false;
            f.spinsDone = 0; f.nacSwap = false; f.barrelRoll = false; f.rollT = 0; f.bounceCount = 0;
            f.styleTags = []; f.lastQuarter = 0;
            f.double.root.visible = false; f.trail.visible = false; f.shell.visible = false;
        }
        if (MA()) MA().setLowpass(18000, 0.08);
    }

    function airborne(S) {
        const p = pad(S.data), P = BO.Player;
        return !P.onGround && (Math.abs(P.pos.x - p.x) > 2.85 || Math.abs(P.pos.z - p.z) > 2.85 || P.pos.y < p.y - 0.55);
    }

    function launch(S) {
        const D = S.data, P = BO.Player, p = pad(D);
        if (D.killcamT > 0) { D.killcamT = 0.001; return true; }
        if (Math.abs(P.pos.y - p.y) > 0.75 || Math.abs(P.pos.x - p.x) > 3.15 || Math.abs(P.pos.z - p.z) > 3.15) return false;
        const a = frame(p, Math.min(4, (D.round || 1) - 1)), dx = -Math.sin(a), dz = -Math.cos(a);
        const edge = 3.55 / Math.max(Math.abs(dx), Math.abs(dz));
        P.pos.set(p.x + dx * edge, p.y + 0.45, p.z + dz * edge);
        P.vel.set(dx * 5.2, 4.6, dz * 5.2);
        P.onGround = false;
        D.jumped = true; D.lastYaw = P.yaw;
        BO.MinigameLib.SFX.whoosh(0.28);
        return true;
    }

    function styleKey(S, code) {
        const D = S.data, f = D.flight, P = BO.Player;
        if (!D.inAir || D.killcamT > 0) return false;
        if (code === 'KeyF' && !f.nacSwap) {
            f.nacSwap = true;
            f.styleTags.push('NAC-SWAP');
            P.inspectTimer = 0.75;
            BO.MinigameLib.SFX.clack();
            BO.Minigames.toast('★ STYLE: NAC-SWAP TWIRL (+450)!', '#38bdf8');
            return true;
        }
        if (code === 'KeyQ' && !f.barrelRoll) {
            f.barrelRoll = true; f.rollT = 0.55;
            f.styleTags.push('BARREL ROLL');
            BO.MinigameLib.SFX.whoosh(0.26);
            BO.Minigames.toast('★ STYLE: CORKSCREW BARREL ROLL (+550)!', '#c084fc');
            return true;
        }
        return false;
    }

    function checkBouncePads(S, dt) {
        const D = S.data, f = D.flight, P = BO.Player;
        for (const a of f.animated) {
            if (a.kind === 'spin') a.obj.rotation.y += dt * 1.4;
            else if (a.kind === 'blink') a.obj.visible = Math.sin(S.t * 6) > 0;
            else if (a.kind === 'rain') {
                const pos = a.obj.geometry.attributes.position;
                for (let i = 0; i < pos.count; i++) {
                    let y = pos.getY(i) - dt * 26;
                    if (y < 0) y = 44;
                    pos.setY(i, y);
                }
                pos.needsUpdate = true;
            }
        }
        if (f.rollT > 0) {
            f.rollT = Math.max(0, f.rollT - dt);
            P.parkourRoll = Math.sin((1 - f.rollT / 0.55) * Math.PI * 2) * 0.85;
            if (f.rollT === 0) P.parkourRoll = 0;
        }
        const bounceVel = D.sb ? D.sb.bouncePower : 21.5;
        for (const bp of f.bouncePads) {
            bp.glowRing.scale.setScalar(1 + Math.sin(S.t * 4.5) * 0.05);
            if (D.jumped && P.pos.y <= 1.25 && P.vel.y < 0 && Math.hypot(P.pos.x - bp.x, P.pos.z - bp.z) <= bp.radius + 0.5) {
                P.pos.y = 1.3;
                P.vel.y = bounceVel;
                P.onGround = false;
                f.bounceCount++;
                if (!f.styleTags.includes('DOUBLE BOUNCE')) f.styleTags.push('DOUBLE BOUNCE');
                D.windowUsed = false;
                BO.FX.spawnParticles(V(bp.x, 0.6, bp.z), 20, 0x22d3ee, 6, 4, 0.45, 1.1);
                if (MA()) MA().bouncePad();
                BO.Minigames.toast('⚡ BOUNCE PAD LAUNCH! CHAIN 720°/1080°!', '#22d3ee');
                return true;
            }
        }
        return false;
    }

    function record(S, dt) {
        const D = S.data, f = D.flight;
        f.lastPeak = Math.max(f.lastPeak, Math.abs(D.spinAccum) * 180 / Math.PI);
        if (!D.inAir) return;
        f.timer -= dt; if (f.timer > 0) return;
        f.timer = 0.032;
        if (f.samples.length === 96) f.samples.shift();
        const p = BO.Player;
        f.samples.push({ pos: p.pos.clone(), yaw: p.yaw, pitch: p.pitch });
    }

    function beginReplay(S, pt) {
        const f = S.data.flight, P = BO.Player;
        f.samples.push({ pos: P.pos.clone(), yaw: P.yaw, pitch: P.pitch });
        if (f.samples.length > 96) f.samples.shift();
        f.from.copy(BO.App.worldCamera.position); f.to.copy(pt);
        const attr = f.trail.geometry.attributes.position;
        f.samples.forEach((v, i) => attr.setXYZ(i, v.pos.x, v.pos.y + 0.9, v.pos.z));
        attr.needsUpdate = true; f.trail.geometry.setDrawRange(0, f.samples.length);
        f.double.root.visible = true; f.trail.visible = true; f.ready = true; f.feedback = '';
        f.bestSnap = Math.min(f.bestSnap, S.data.lastSnap);
        f.holdPos = P.pos.clone();
        if (MA()) { MA().setLowpass(420, 0.06); MA().sniperKillcamBoom(); }
    }

    function replay(S, u) {
        const f = S.data.flight, P = BO.Player;
        if (f.holdPos) { P.pos.copy(f.holdPos); P.vel.set(0, 0, 0); }
        if (!f.ready || !f.samples.length) return;
        const cam = BO.App.worldCamera, flight = Math.min(1, u / 0.64) * (f.samples.length - 1);
        const i = Math.floor(flight), j = Math.min(i + 1, f.samples.length - 1), alpha = flight - i;
        const body = f.double.root, shot = Math.max(0, (u - 0.64) / 0.36);
        body.position.lerpVectors(f.samples[i].pos, f.samples[j].pos, alpha);
        body.rotation.y = f.samples[i].yaw + BO.Math.angleDiff(f.samples[i].yaw, f.samples[j].yaw) * alpha;
        BO.MGFigures.pose(f.double, 'aim');
        f.shell.visible = shot > 0; f.shell.position.lerpVectors(f.from, f.to, shot);
        const focus = f.from.clone().lerp(f.to, shot);
        if (!shot) { focus.copy(body.position); focus.y += 1; }
        const offset = V(6 + 3 * Math.cos(u * 2), 2.8 + 2 * Math.sin(u * 2), 5);
        cam.position.copy(focus).add(offset); cam.lookAt(focus); cam.updateMatrixWorld();
    }

    function stop(S) {
        const f = S.data.flight;
        if (MA()) MA().stop();
        if (!f) return;
        f.trail.geometry.dispose(); f.trail.material.dispose();
        f.double.root.visible = false; f.shell.visible = false; f.trail.visible = false;
    }

    BO.FlightCircuit = { MAP_DEFS, build, reset, airborne, launch, styleKey, checkBouncePads, record, beginReplay, replay, stop, pad };
})(window.BO);
