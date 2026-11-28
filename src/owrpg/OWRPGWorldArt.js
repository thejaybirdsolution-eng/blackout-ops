/* ============================================================================
   BLACKOUT OPS — Open World RPG · World Art 2.0 (1280 x 1280 m & 12 Dungeons)
   - GPU-instanced trees, rocks, castles, crypts, banners & dungeon dressing
   - Keeps total draw calls well below 180 across the 4x larger world!
   - Distance-culls detailed settlement/dungeon 3D GLB clusters cleanly.
============================================================================ */
(function (BO) {
    'use strict';

    // Multiplies the Kenney dead-trunk palette (orange-brown) toward each biome's weathered wood.
    const DEAD_TINT = {
        rust_sprawl: 0x8f7a6c, barrow_moor: 0x7c7684, mire_delta: 0x6e6a52, ash_quarry: 0x7a7470,
        sunscorched_badlands: 0xd8c2a4, sunken_coast: 0xb8b2aa, meridian_core: 0x5f566a, obsidian_dragonwilds: 0x3a2f2c
    };

    function rng(seed) {
        let a = seed >>> 0;
        return () => {
            a = (a + 0x6D2B79F5) >>> 0;
            let t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    const std = (color, opts) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.8, metalness: 0.2 }, opts || {}));
    const glow = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, fog: false, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });

    function addCol(world, x, z, hw, hd, y0, y1) {
        world.colliders.push({ minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd, minY: y0, maxY: y1, active: true });
    }
    function mesh(scene, world, geo, mat, x, y, z, solid = true) {
        const m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        m.castShadow = true;
        m.receiveShadow = true;
        scene.add(m);
        if (solid) world.worldMeshes.push(m);
        return m;
    }

    let strutBatches = null;
    function strut(scene, world, mat, x1, y1, z1, x2, y2, z2, r = 0.18) {
        const a = new THREE.Vector3(x1, y1, z1), b = new THREE.Vector3(x2, y2, z2);
        const m = new THREE.Object3D();
        m.position.copy(a).add(b).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
        m.scale.set(r, a.distanceTo(b), r);
        m.updateMatrix();
        let list = strutBatches.get(mat);
        if (!list) strutBatches.set(mat, list = []);
        list.push(m.matrix.clone());
    }
    function flushStruts(scene) {
        const geo = new THREE.CylinderGeometry(1, 1, 1, 5);
        for (const [mat, list] of strutBatches) {
            const im = new THREE.InstancedMesh(geo, mat, list.length);
            list.forEach((mx, i) => im.setMatrixAt(i, mx));
            im.castShadow = true;
            im.frustumCulled = false;
            scene.add(im);
        }
        strutBatches = null;
    }

    const WEATHER_COLORS = {
        haven_basin: 0xfde68a,
        whispering_woods: 0x86efac,
        rust_sprawl: 0xd6b08c,
        barrow_moor: 0xc4b5fd,
        mire_delta: 0x84cc16,
        ash_quarry: 0xf97316,
        sunscorched_badlands: 0xfbbf24,
        sunken_coast: 0x67e8f9,
        alpine_array: 0xe2e8f0,
        frostfang_peaks: 0xbae6fd,
        meridian_core: 0xc084fc,
        obsidian_dragonwilds: 0xef4444
    };

    const Art = {
        populate(world, scene) {
            const D = BO.OWRPGWorldData;
            const t = world.terrain;
            const out = { beacons: [], plumes: [], arcs: [], spinners: [], pylons: {}, waters: [], flames: [], weather: null, weatherRegion: 'haven_basin', culledGroups: [] };
            world.owrpg = out;
            strutBatches = new Map();
            if (BO.Assets && BO.Assets.applySkybox) {
                BO.Assets.applySkybox(scene, 'skybox-morning.png');
            }
            for (const L of D.LANDMARKS) {
                const fn = this['_lm_' + L.id] || this._lm_spire;
                fn.call(this, world, scene, L, t.height(L.x, L.z), out);
            }
            this._vegetation(world, scene, D);
            this._water(scene, D, out);
            for (const p of D.PYLONS) {
                out.pylons[p.id] = this._pylon(world, scene, p, t.height(p.x, p.z));
                // A 6 m pylon is a couple of pixels beyond ~420 m; stop drawing it there (6 draw calls each).
                out.culledGroups.push({ group: out.pylons[p.id].group, x: p.x, z: p.z, r: 420 });
            }
            flushStruts(scene);
            this._townWarmth(scene, D, t, out);
            this._weatherMotes(scene, out);
            this._dressFrontierAndDungeons(scene, D, t, out);
            return out;
        },

        _dressFrontierAndDungeons(scene, D, t, out) {
            if (!BO.Assets || !BO.Assets.placeGLB) return;
            const addCluster = (cx, cz, radius, buildFn) => {
                const g = new THREE.Group();
                scene.add(g);
                out.culledGroups.push({ group: g, x: cx, z: cz, r: radius });
                buildFn(g);
            };
            const pSurface = (grp, path, x, z, rot, scale) => {
                BO.Assets.placeGLB(grp, path, { pos: [x, t.height(x, z), z], rot, scale, castShadow: false, guardScene: scene });
            };

            // 1. Freestead Town
            const T = D.TOWN;
            addCluster(T.x, T.z, 95, (g) => {
                pSurface(g, 'mini_forest_kit/tent.glb', T.x - 22, T.z - 6, 0.4, 3.4);
                pSurface(g, 'mini_arena_kit/weapon-rack.glb', T.x - 5, T.z - 6, -0.6, 2.3);
                pSurface(g, 'mini_arena_kit/banner.glb', T.x + 4, T.z - 16, 0.2, 2.8);
                pSurface(g, 'mini_arena_kit/statue.glb', T.x, T.z + 7, 0.8, 2.8);
                pSurface(g, 'pixel_fantasy/pixel-fantasy-canvas-market-stall.glb', T.x + 18, T.z - 4, -0.5, 2.2);
                pSurface(g, 'pixel_fantasy/pixel-fantasy-timber-wellhead.glb', T.x, T.z, 0, 2.0);
                pSurface(g, 'pixel_fantasy/pixel-fantasy-cargo-handcart.glb', T.x - 18, T.z + 6, 0.7, 2.0);
            });

            // 2. Whispering Pinewoods (Ranger's Watch Lodge & Root-Barrow)
            addCluster(-445, 395, 130, (g) => {
                pSurface(g, 'mini_forest_kit/tent.glb', -432, 368, 0.5, 3.5);
                pSurface(g, 'mini_forest_kit/target.glb', -406, 368, -0.4, 2.5);
                pSurface(g, 'pixel_fantasy/pixel-fantasy-wooden-weapon-rack.glb', -414, 355, 0, 2.2);
                pSurface(g, 'castle_kit/gate.glb', -475, 442, 0, 3.2);
                pSurface(g, 'pixel_fantasy/pixel-fantasy-giant-keep-banner.glb', -482, 442, 0, 2.6);
            });

            // 3. Barrow-Moor Graveyard (Grimhollow Chapel, Marrow Crypt, Crimson Manor)
            addCluster(-470, 5, 150, (g) => {
                pSurface(g, 'graveyard_kit/crypt-large.glb', -475, -82, 0, 3.2);
                pSurface(g, 'graveyard_kit/altar-stone.glb', -425, 22, 0, 2.6);
                pSurface(g, 'graveyard_kit/coffin.glb', -483, -72, 0.3, 2.4);
                pSurface(g, 'graveyard_kit/candle-multiple.glb', -422, 18, 0, 2.4);
                pSurface(g, 'castle_kit/flag-banner-long.glb', -525, 88, 0, 3.2);
                pSurface(g, 'castle_kit/flag-banner-long.glb', -545, 88, 0, 3.2);
            });

            // 4. Sunscorched Badlands (Dustwind Oasis & Sunfang Pyramid)
            addCluster(435, 430, 150, (g) => {
                pSurface(g, 'pixel_fantasy/pixel-fantasy-canvas-market-stall.glb', 392, 402, 0.4, 2.4);
                pSurface(g, 'pixel_fantasy/pixel-fantasy-wooden-barrel.glb', 380, 403, 0, 2.0);
                pSurface(g, 'pixel_fantasy/pixel-fantasy-standalone-lion-statue.glb', 478, 478, 0, 2.8);
                pSurface(g, 'pixel_fantasy/pixel-fantasy-standalone-lion-statue.glb', 492, 478, 0, 2.8);
            });

            // 5. Frostfang Peaks & Obsidian Dragonwilds
            addCluster(-455, -445, 140, (g) => {
                pSurface(g, 'castle_kit/siege-ballista.glb', -442, -432, 0.4, 3.0);
                pSurface(g, 'castle_kit/flag-banner-long.glb', -448, -438, 0, 3.5);
                pSurface(g, 'castle_kit/flag-banner-long.glb', -462, -438, 0, 3.5);
            });
            addCluster(420, -420, 160, (g) => {
                pSurface(g, 'pixel_fantasy/pixel-fantasy-iron-brazier.glb', 478, -480, 0, 2.8);
                pSurface(g, 'pixel_fantasy/pixel-fantasy-iron-brazier.glb', 492, -480, 0, 2.8);
                pSurface(g, 'pixel_fantasy/pixel-fantasy-carved-weathered-limestone-ritual-altar.glb', 430, -395, 0, 2.6);
                pSurface(g, 'mini_forest_kit/tent.glb', 345, -340, 0.6, 3.4);
            });

            // 6. Dress all 12 Sealed Dungeons with distance-culled 3D banners, braziers, altars & columns!
            for (let i = 1; i < (D.DUNGEONS || []).length; i++) {
                const dng = D.DUNGEONS[i];
                addCluster(dng.x, dng.z + 30, 95, (g) => {
                    const pInt = (path, dx, dz, rot, scale) => {
                        BO.Assets.placeGLB(g, path, { pos: [dng.x + dx, 0, dng.z + dz], rot, scale, castShadow: false, guardScene: scene });
                    };
                    pInt('pixel_fantasy/pixel-fantasy-iron-brazier.glb', -6, 6, 0, 2.2);
                    pInt('pixel_fantasy/pixel-fantasy-iron-brazier.glb', 6, 6, 0, 2.2);
                    pInt('pixel_fantasy/pixel-fantasy-iron-brazier.glb', -6, 52, 0, 2.4);
                    pInt('pixel_fantasy/pixel-fantasy-iron-brazier.glb', 6, 52, 0, 2.4);
                    pInt('mini_dungeon_kit/banner.glb', -14.5, 22, Math.PI / 2, 2.8);
                    pInt('mini_dungeon_kit/banner.glb', 14.5, 22, -Math.PI / 2, 2.8);
                    pInt('mini_dungeon_kit/barrel.glb', 12, 18, 0.3, 2.2);
                    pInt('graveyard_kit/altar-stone.glb', 0, 60, 0, 2.4);
                });
                const dLight = new THREE.PointLight(i === 11 ? 0xf97316 : (i >= 9 ? 0x38bdf8 : 0xfbbf24), 1.6, 55, 1.5);
                dLight.position.set(dng.x, 4.2, dng.z + 34);
                scene.add(dLight);
            }
        },

        _townWarmth(scene, D, t, out) {
            const T = D.TOWN;
            const dummy = new THREE.Object3D();
            const fx = T.x - 4, fz = T.z + 5, fy = t.height(fx, fz);
            const logIm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.1, 0.9, 6), std(0x4a3525, { roughness: 0.9 }), 3);
            for (let i = 0; i < 3; i++) {
                dummy.position.set(fx, fy + 0.1, fz);
                dummy.rotation.set(0, (i / 3) * Math.PI, Math.PI / 2);
                dummy.scale.set(1, 1, 1);
                dummy.updateMatrix();
                logIm.setMatrixAt(i, dummy.matrix);
            }
            logIm.instanceMatrix.needsUpdate = true;
            scene.add(logIm);

            const flame = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.65, 6), glow(0xf97316, 0.9));
            flame.position.set(fx, fy + 0.42, fz);
            scene.add(flame);
            const fireLight = new THREE.PointLight(0xff9233, 1.8, 26, 1.6);
            fireLight.position.set(fx, fy + 1.2, fz);
            scene.add(fireLight);
            out.flames.push({ mesh: flame, light: fireLight, baseY: fy + 0.42 });

            const lanterns = [[4, -24], [4, 24], [29, 3], [-12, -8]];
            const postIm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.09, 2.8, 6), std(0x27272a, { metalness: 0.6 }), lanterns.length);
            const bulbIm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 8, 6), glow(0xfbbf24, 0.95), lanterns.length);
            lanterns.forEach(([dx, dz], i) => {
                const lx = T.x + dx, lz = T.z + dz, ly = t.height(lx, lz);
                dummy.rotation.set(0, 0, 0);
                dummy.position.set(lx, ly + 1.4, lz);
                dummy.updateMatrix();
                postIm.setMatrixAt(i, dummy.matrix);
                dummy.position.set(lx, ly + 2.85, lz);
                dummy.updateMatrix();
                bulbIm.setMatrixAt(i, dummy.matrix);
            });
            postIm.instanceMatrix.needsUpdate = true;
            bulbIm.instanceMatrix.needsUpdate = true;
            scene.add(postIm, bulbIm);
        },

        _weatherMotes(scene, out) {
            const COUNT = 160;
            const pos = new Float32Array(COUNT * 3);
            for (let i = 0; i < COUNT; i++) {
                pos[i * 3] = (Math.random() - 0.5) * 48;
                pos[i * 3 + 1] = Math.random() * 14;
                pos[i * 3 + 2] = (Math.random() - 0.5) * 48;
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            const mat = new THREE.PointsMaterial({ color: WEATHER_COLORS.haven_basin, size: 0.16, transparent: true, opacity: 0.6, depthWrite: false });
            const pts = new THREE.Points(geo, mat);
            pts.frustumCulled = false;
            scene.add(pts);
            out.weather = { points: pts, geo, mat, count: COUNT };
        },

        setRegionWeather(world, regId) {
            const w = world.owrpg && world.owrpg.weather;
            if (!w || world.owrpg.weatherRegion === regId) return;
            world.owrpg.weatherRegion = regId;
            w.mat.color.setHex(WEATHER_COLORS[regId] || 0xfde68a);
        },

        _beacon(scene, out, x, y, z, color, size = 0.7) {
            const m = new THREE.Mesh(new THREE.SphereGeometry(size, 10, 8), glow(color));
            m.position.set(x, y, z);
            scene.add(m);
            out.beacons.push(m);
            return m;
        },

        _lm_spire(world, scene, L, y, out) {
            const ob = mesh(scene, world, new THREE.CylinderGeometry(1.4, 3.6, L.h, 7), std(0x3f3f46, { metalness: 0.45, roughness: 0.65 }), L.x, y + L.h / 2, L.z);
            void ob;
            addCol(world, L.x, L.z, 3.2, 3.2, y, y + L.h);
            this._beacon(scene, out, L.x, y + L.h + 1.4, L.z, L.color, 1.1);
        },

        _lm_mast_alpha(world, scene, L, y, out) {
            const mat = std(0x7c6a58, { metalness: 0.6, roughness: 0.6 });
            const s = 2.2, H = L.h;
            const legs = [[-s, -s], [s, -s], [s, s], [-s, s]];
            for (const [lx, lz] of legs) strut(scene, world, mat, L.x + lx, y, L.z + lz, L.x + lx * 0.35, y + H, L.z + lz * 0.35, 0.22);
            for (let h = 6; h < H; h += 6) {
                const k = 1 - (h / H) * 0.65;
                for (let i = 0; i < 4; i++) {
                    const [ax, az] = legs[i], [bx, bz] = legs[(i + 1) % 4];
                    strut(scene, world, mat, L.x + ax * k, y + h, L.z + az * k, L.x + bx * k, y + h, L.z + bz * k, 0.1);
                }
            }
            mesh(scene, world, new THREE.BoxGeometry(3, 0.3, 3), mat, L.x, y + H, L.z);
            const beacon = this._beacon(scene, out, L.x, y + H + 1.2, L.z, L.color, 0.9);
            const beam = new THREE.Mesh(new THREE.ConeGeometry(3.2, 26, 12, 1, true), new THREE.MeshBasicMaterial({ color: L.color, transparent: true, opacity: 0.12, fog: false, depthWrite: false, side: THREE.DoubleSide }));
            beam.rotation.z = Math.PI / 2;
            beam.position.set(13, 0, 0);
            const pivot = new THREE.Group();
            pivot.position.copy(beacon.position);
            pivot.add(beam);
            scene.add(pivot);
            out.spinners.push({ obj: pivot, speed: 0.9 });
            addCol(world, L.x, L.z, s, s, y, y + 1.2);
        },

        _lm_goliath(world, scene, L, y, out) {
            const mat = std(0xd4a017, { metalness: 0.5, roughness: 0.5 });
            const H = L.h, span = 26;
            for (const dx of [-span / 2, span / 2]) for (const dz of [-3, 3]) {
                mesh(scene, world, new THREE.BoxGeometry(1.4, H, 1.4), mat, L.x + dx, y + H / 2, L.z + dz);
                addCol(world, L.x + dx, L.z + dz, 0.7, 0.7, y, y + H);
            }
            mesh(scene, world, new THREE.BoxGeometry(span + 6, 2.4, 8), mat, L.x, y + H, L.z);
            mesh(scene, world, new THREE.BoxGeometry(4, 3, 4), std(0x3f3f46), L.x + 4, y + H - 2.4, L.z);
            strut(scene, world, std(0x27272a), L.x + 4, y + H - 4, L.z, L.x + 4, y + 10, L.z, 0.06);
            this._beacon(scene, out, L.x - span / 2, y + H + 1.6, L.z, 0xff3b30, 0.5);
            this._beacon(scene, out, L.x + span / 2, y + H + 1.6, L.z, 0xff3b30, 0.5);
        },

        _lm_cooling_stack(world, scene, L, y, out) {
            const pts = [];
            for (let i = 0; i <= 12; i++) {
                const k = i / 12;
                pts.push(new THREE.Vector2(9 + 6 * Math.pow(Math.abs(k - 0.62) / 0.62, 1.6) * (k < 0.62 ? 1 : 0.55), k * L.h));
            }
            const geo = new THREE.LatheGeometry(pts, 24);
            const m = mesh(scene, world, geo, std(0x8a8f86, { side: THREE.DoubleSide, roughness: 0.95 }), L.x, y - 3, L.z);
            m.rotation.z = 0.06;
            for (let i = 0; i < 6; i++) {
                const p = new THREE.Mesh(new THREE.SphereGeometry(4 + i * 0.8, 10, 8), new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.16, fog: false, depthWrite: false }));
                p.position.set(L.x, y + L.h + i * 5, L.z);
                scene.add(p);
                out.plumes.push({ m: p, base: y + L.h, phase: i / 6 });
            }
            for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; addCol(world, L.x + Math.cos(a) * 14, L.z + Math.sin(a) * 14, 2.4, 2.4, y - 3, y + 12); }
        },

        _lm_excavator(world, scene, L, y, out) {
            const mat = std(0xb45309, { metalness: 0.5, roughness: 0.7 });
            mesh(scene, world, new THREE.BoxGeometry(14, 8, 9), mat, L.x, y + 4, L.z);
            addCol(world, L.x, L.z, 7, 4.5, y, y + 8);
            mesh(scene, world, new THREE.BoxGeometry(8, 7, 7), mat, L.x - 2, y + 11.5, L.z);
            const boom = mesh(scene, world, new THREE.BoxGeometry(30, 2.2, 2.2), mat, L.x + 14, y + 20, L.z, false);
            boom.rotation.z = 0.45;
            const wheel = new THREE.Mesh(new THREE.TorusGeometry(7, 0.9, 8, 24), mat);
            wheel.position.set(L.x + 27, y + 27, L.z);
            scene.add(wheel);
            out.spinners.push({ obj: wheel, speed: 0.15, axis: 'z' });
            this._beacon(scene, out, L.x - 2, y + L.h, L.z, L.color, 0.6);
        },

        _lm_dishes(world, scene, L, y, out) {
            const mat = std(0xe5e7eb, { metalness: 0.3, roughness: 0.4, side: THREE.DoubleSide });
            for (let i = 0; i < 3; i++) {
                const x = L.x + (i - 1) * 26, z = L.z + (i === 1 ? -6 : 4);
                const gy = world.terrain.height(x, z);
                mesh(scene, world, new THREE.CylinderGeometry(1.2, 2, 16, 10), mat, x, gy + 8, z);
                addCol(world, x, z, 1.6, 1.6, gy, gy + 16);
                const dish = new THREE.Mesh(new THREE.SphereGeometry(11, 20, 10, 0, Math.PI * 2, 0, 0.9), mat);
                dish.position.set(x, gy + 21, z);
                dish.rotation.x = -0.9 - i * 0.12;
                dish.rotation.y = i * 0.5;
                scene.add(dish);
                this._beacon(scene, out, x, gy + L.h, z, 0xff3b30, 0.45);
            }
        },

        _lm_obelisk(world, scene, L, y, out) {
            const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(24, 1), new THREE.MeshStandardMaterial({ color: 0x6d28d9, emissive: 0x3b0764, emissiveIntensity: 0.6, wireframe: true }));
            dome.position.set(L.x, y + 10, L.z);
            scene.add(dome);
            out.spinners.push({ obj: dome, speed: 0.03 });
            const ob = mesh(scene, world, new THREE.OctahedronGeometry(4, 0), new THREE.MeshStandardMaterial({ color: 0x1e1030, emissive: 0x9333ea, emissiveIntensity: 0.9, metalness: 0.7, roughness: 0.3 }), L.x, y + 26, L.z);
            ob.scale.set(1, 7.5, 1);
            addCol(world, L.x, L.z, 3.4, 3.4, y, y + 50);
            out.obelisk = ob;
            const arcMat = new THREE.LineBasicMaterial({ color: 0xd8b4fe, transparent: true, opacity: 0.9, fog: false });
            for (let i = 0; i < 4; i++) {
                const g = new THREE.BufferGeometry().setFromPoints(new Array(9).fill(0).map(() => new THREE.Vector3()));
                const line = new THREE.Line(g, arcMat);
                scene.add(line);
                out.arcs.push({ line, cx: L.x, cy: y + 26, cz: L.z, t: Math.random() });
            }
            this._beacon(scene, out, L.x, y + L.h, L.z, L.color, 1.2);
        },

        _pylon(world, scene, p, y) {
            const g = new THREE.Group();
            const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2, 0.6, 12), std(0x334155, { metalness: 0.7 }));
            base.position.y = 0.3;
            const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 5, 8), std(0x64748b, { metalness: 0.8, roughness: 0.3 }));
            coil.position.y = 3;
            const ringMat = new THREE.MeshBasicMaterial({ color: 0x475569, fog: false });
            const rings = [];
            for (let i = 0; i < 3; i++) {
                const r = new THREE.Mesh(new THREE.TorusGeometry(0.9 - i * 0.15, 0.08, 6, 20), ringMat);
                r.rotation.x = Math.PI / 2;
                r.position.y = 2 + i * 1.4;
                g.add(r);
                rings.push(r);
            }
            const tip = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), ringMat);
            tip.position.y = 5.8;
            g.add(base, coil, tip);
            g.position.set(p.x, y, p.z);
            scene.add(g);
            addCol(world, p.x, p.z, 0.6, 0.6, y, y + 5.5);
            return { group: g, rings, ringMat, active: false };
        },

        setPylonActive(world, id, on) {
            const p = world.owrpg && world.owrpg.pylons[id];
            if (!p) return;
            p.active = on;
            p.ringMat.color.setHex(on ? 0x22d3ee : 0x475569);
        },

        _vegetation(world, scene, D) {
            const r = rng(884120);
            const lists = { pine: [], broad: [], dead: [] };
            const t = world.terrain;
            const nearAnchor = (x, z) => D.POIS.some((p) => !p.interior && Math.hypot(x - p.x, z - p.z) < p.r + 7) ||
                D.PYLONS.some((p) => Math.hypot(x - p.x, z - p.z) < 7) ||
                D.LANDMARKS.some((l) => Math.hypot(x - l.x, z - l.z) < 16) ||
                D.INTERACTS.some((it) => !it.int && Math.hypot(x - it.x, z - it.z) < 6);
            const span = D.BOUNDS.maxX - D.BOUNDS.minX - 32;
            const densMap = {
                haven_basin: 0.55, whispering_woods: 0.85, alpine_array: 0.68, frostfang_peaks: 0.55,
                rust_sprawl: 0.14, barrow_moor: 0.42, mire_delta: 0.38, ash_quarry: 0.15,
                sunscorched_badlands: 0.08, sunken_coast: 0.22, meridian_core: 0.12, obsidian_dragonwilds: 0.20
            };
            for (let i = 0; i < 6500 && lists.pine.length + lists.broad.length + lists.dead.length < 2800; i++) {
                const x = D.BOUNDS.minX + 16 + r() * span;
                const z = D.BOUNDS.minZ + 16 + r() * span;
                const h = t.height(x, z);
                if (h < D.WATER + 0.4 || t.slope(x, z) > 0.9 || nearAnchor(x, z)) continue;
                if (D.roadInfo(x, z) || D.railDist(x, z) < 4.5) continue;
                const reg = D.regionAt(x, z).id;
                if (r() > (densMap[reg] || 0.2)) continue;
                let kind = 'dead';
                if (reg === 'alpine_array' || reg === 'frostfang_peaks') kind = 'pine';
                else if (reg === 'whispering_woods' || reg === 'haven_basin') kind = r() < 0.5 ? 'broad' : 'pine';
                else if (reg === 'sunken_coast') kind = r() < 0.4 ? 'broad' : 'dead';
                lists[kind].push({ x, z, y: h, s: 0.85 + r() * 0.8, reg });
            }
            const defs = {
                pine: { trunk: new THREE.CylinderGeometry(0.16, 0.3, 4.2, 6), crown: new THREE.ConeGeometry(1.8, 5.4, 7), crownY: 4.7, tc: 0x5a4332, cc: 0x2f4a33 },
                broad: { trunk: new THREE.CylinderGeometry(0.2, 0.32, 3.4, 6), crown: new THREE.IcosahedronGeometry(2.2, 0), crownY: 4.3, tc: 0x5e4a38, cc: 0x56713c },
                dead: { trunk: new THREE.CylinderGeometry(0.12, 0.26, 4.6, 5), crown: new THREE.BoxGeometry(2.2, 0.12, 0.12), crownY: 3.6, tc: 0x3a332e, cc: 0x3a332e }
            };
            const dummy = new THREE.Object3D();
            for (const [kind, list] of Object.entries(lists)) {
                if (!list.length) continue;
                const d = defs[kind];
                const trunk = new THREE.InstancedMesh(d.trunk, std(d.tc, { roughness: 0.95, metalness: 0 }), list.length);
                const crown = new THREE.InstancedMesh(d.crown, new THREE.MeshStandardMaterial({ color: d.cc, roughness: 0.85, flatShading: true }), list.length);
                list.forEach((tr, i) => {
                    dummy.position.set(tr.x, tr.y + d.trunk.parameters.height * tr.s / 2, tr.z);
                    dummy.rotation.set(0, (tr.x * 13.1 + tr.z) % 6.28, 0);
                    dummy.scale.setScalar(tr.s);
                    dummy.updateMatrix();
                    trunk.setMatrixAt(i, dummy.matrix);
                    dummy.position.set(tr.x, tr.y + d.crownY * tr.s, tr.z);
                    dummy.updateMatrix();
                    crown.setMatrixAt(i, dummy.matrix);
                    world.colliders.push({ minX: tr.x - 0.3 * tr.s, maxX: tr.x + 0.3 * tr.s, minY: tr.y, maxY: tr.y + 5 * tr.s, minZ: tr.z - 0.3 * tr.s, maxZ: tr.z + 0.3 * tr.s, active: true, tree: true, navIgnore: true });
                });
                trunk.castShadow = crown.castShadow = false;
                trunk.frustumCulled = crown.frustumCulled = false;
                scene.add(trunk, crown);
                if (BO.Assets && BO.Assets.placeGLBInstanced) {
                    const modelPath = kind === 'dead' ? 'graveyard_kit/trunk.glb' : (kind === 'pine' ? 'mini_forest_kit/tree-high.glb' : 'mini_forest_kit/tree.glb');
                    const hScale = kind === 'pine' ? 8.2 : (kind === 'broad' ? 6.8 : 5.2);
                    const trs = list.map((tr) => ({ pos: [tr.x, tr.y, tr.z], rot: (tr.x * 13.1 + tr.z) % 6.28, scale: tr.s * hScale }));
                    BO.Assets.placeGLBInstanced(scene, modelPath, trs, {
                        fitSize: [1, 1, 1], uniform: true, hideFallback: [trunk, crown],
                        castShadow: false, frustumCulled: false, guardScene: scene,
                        // The dead-trunk model's bright orange wood read as clay blobs: weather it per region.
                        onLoad: kind !== 'dead' ? null : (holder) => {
                            const c = new THREE.Color();
                            holder.traverse((o) => {
                                if (!o.isInstancedMesh) return;
                                // Own material: desaturate the atlas wood to its luminance, then the per-tree tint colours it.
                                o.material = o.material.clone();
                                o.material.onBeforeCompile = (sh) => {
                                    sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>',
                                        'float boLum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));\n' +
                                        'diffuseColor.rgb = vec3(clamp(boLum * 2.7, 0.0, 1.4));\n#include <color_fragment>');
                                };
                                o.material.customProgramCacheKey = () => 'boDeadWood1';
                                list.forEach((tr, i) => {
                                    c.setHex(DEAD_TINT[tr.reg] || 0x8a7c70).offsetHSL(0, 0, (((tr.x * 7.3 + tr.z * 3.1) % 1 + 1) % 1) * 0.08 - 0.04);
                                    if (c.convertSRGBToLinear) c.convertSRGBToLinear();
                                    o.setColorAt(i, c);
                                });
                                if (o.instanceColor) o.instanceColor.needsUpdate = true;
                            });
                        }
                    });
                }
            }
            const rocks = [];
            for (let i = 0; i < 620; i++) {
                const x = D.BOUNDS.minX + 16 + r() * span, z = D.BOUNDS.minZ + 16 + r() * span;
                if (nearAnchor(x, z) || D.roadInfo(x, z)) continue;
                rocks.push({ x, z, s: 0.6 + r() * 1.9 });
            }
            const rm = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0x7b7d76, roughness: 0.95, flatShading: true }), rocks.length);
            const rockTrs = [];
            rocks.forEach((rk, i) => {
                const y = t.height(rk.x, rk.z);
                dummy.position.set(rk.x, y + rk.s * 0.3, rk.z);
                dummy.rotation.set(rk.x % 3, rk.z % 3, 0);
                dummy.scale.set(rk.s * 1.3, rk.s * 0.7, rk.s);
                dummy.updateMatrix();
                rm.setMatrixAt(i, dummy.matrix);
                rockTrs.push({ pos: [rk.x, y, rk.z], rot: rk.z % 3, scale: [rk.s * 2.1, rk.s * 1.2, rk.s * 1.8] });
                if (rk.s > 1.2) world.colliders.push({ minX: rk.x - rk.s, maxX: rk.x + rk.s, minY: y, maxY: y + rk.s * 0.8, minZ: rk.z - rk.s * 0.8, maxZ: rk.z + rk.s * 0.8, active: true, navIgnore: true });
            });
            rm.castShadow = false;
            rm.frustumCulled = false;
            scene.add(rm);
            if (BO.Assets && BO.Assets.placeGLBInstanced && rockTrs.length) {
                BO.Assets.placeGLBInstanced(scene, 'mini_forest_kit/rocks-low.glb', rockTrs, {
                    fitSize: [1, 1, 1], hideFallback: rm, castShadow: false, frustumCulled: false, guardScene: scene
                });
            }
        },

        _water(scene, D, out) {
            const sheet = (w, d, x, y, z, color, opacity) => {
                const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.12, metalness: 0.3, depthWrite: false }));
                m.rotation.x = -Math.PI / 2;
                m.position.set(x, y, z);
                scene.add(m);
                out.waters.push(m);
            };
            sheet(280, 280, 215, D.WATER, 25, 0x2c4a3a, 0.82);
            sheet(240, 240, 510, D.WATER, -55, 0x1e4e5f, 0.80);
            sheet(40, 40, -180, -11.6, -60, 0x3d4a52, 0.8);
            sheet(36, 36, 180, -6.4, -190, 0x4c1d95, 0.7);
        },

        animate(world, clock, dt = 0.016) {
            const o = world.owrpg;
            if (!o) return;
            const step = Math.min(0.1, dt || 0.016);
            const blink = Math.sin(clock * 3) > 0.1;
            for (const b of o.beacons) b.visible = blink;
            for (const s of o.spinners) { if (s.axis === 'z') s.obj.rotation.z += s.speed * step; else s.obj.rotation.y += s.speed * step; }
            for (const p of o.plumes) {
                const k = (clock * 0.05 + p.phase) % 1;
                p.m.position.y = p.base + k * 40;
                p.m.scale.setScalar(0.6 + k * 1.6);
                p.m.material.opacity = 0.2 * (1 - k);
            }
            for (const a of o.arcs) {
                a.t -= step;
                if (a.t > 0) continue;
                a.t = 0.08 + Math.random() * 0.25;
                const pos = a.line.geometry.attributes.position;
                const ang = Math.random() * Math.PI * 2, R = 18 + Math.random() * 8;
                const ex = a.cx + Math.cos(ang) * R, ey = a.cy - 10 + Math.random() * 20, ez = a.cz + Math.sin(ang) * R;
                for (let i = 0; i < pos.count; i++) {
                    const k = i / (pos.count - 1), j = i === 0 || i === pos.count - 1 ? 0 : 2.2;
                    pos.setXYZ(i, a.cx + (ex - a.cx) * k + (Math.random() - 0.5) * j, a.cy + (ey - a.cy) * k + (Math.random() - 0.5) * j, a.cz + (ez - a.cz) * k + (Math.random() - 0.5) * j);
                }
                pos.needsUpdate = true;
            }
            for (const f of o.flames) {
                f.mesh.scale.set(0.9 + Math.sin(clock * 11) * 0.15, 0.9 + Math.cos(clock * 15) * 0.2, 0.9 + Math.sin(clock * 9) * 0.15);
                f.light.intensity = 1.6 + Math.sin(clock * 13) * 0.35;
            }
            if (BO.Player && o.culledGroups) {
                const px = BO.Player.pos.x, pz = BO.Player.pos.z;
                for (const cg of o.culledGroups) {
                    const vis = BO.Math.dist2D(px, pz, cg.x, cg.z) < cg.r;
                    if (cg.group.visible !== vis) cg.group.visible = vis;
                }
            }
            if (o.weather && BO.Player) {
                const P = BO.Player;
                o.weather.points.visible = !BO.OWRPGWorldData.isInterior(P.pos.x, P.pos.z);
                if (o.weather.points.visible) {
                    o.weather.points.position.set(P.pos.x, P.pos.y, P.pos.z);
                    const arr = o.weather.geo.attributes.position.array;
                    const fall = (o.weatherRegion === 'alpine_array' || o.weatherRegion === 'frostfang_peaks') ? -1.6 : ((o.weatherRegion === 'ash_quarry' || o.weatherRegion === 'obsidian_dragonwilds') ? 1.1 : 0.25);
                    for (let i = 0; i < o.weather.count; i++) {
                        arr[i * 3 + 1] += fall * step;
                        arr[i * 3] += Math.sin(clock + i) * 0.35 * step;
                        if (arr[i * 3 + 1] > 14) arr[i * 3 + 1] = 0.5;
                        else if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] = 13.5;
                    }
                    o.weather.geo.attributes.position.needsUpdate = true;
                }
            }
            for (const p of Object.values(o.pylons)) if (p.active) p.rings.forEach((r, i) => { r.rotation.z = clock * (1 + i * 0.6); });
            if (o.obelisk) o.obelisk.material.emissiveIntensity = 0.7 + Math.sin(clock * 1.3) * 0.3;
        }
    };

    BO.OWRPGWorldArt = Art;
})(window.BO);
