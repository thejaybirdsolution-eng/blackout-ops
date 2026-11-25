/* ============================================================================
   BLACKOUT OPS — Open World RPG · World Art (runtime populate for 'meridian')
   Builds the six skyline landmarks, instanced vegetation and rocks, water
   sheets, transit pylon meshes and fog-piercing beacons. Animated by
   BO.OWRPGWorldArt.animate(world, clock) each frame from OWRPGMode.
============================================================================ */
(function (BO) {
    'use strict';

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
    // Struts are collected per material and drawn as one InstancedMesh each (keeps lattice towers to 1 draw call).
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

    const Art = {
        populate(world, scene) {
            const D = BO.OWRPGWorldData;
            const t = world.terrain;
            const out = { beacons: [], plumes: [], arcs: [], spinners: [], pylons: {}, waters: [] };
            world.owrpg = out;
            strutBatches = new Map();
            for (const L of D.LANDMARKS) this['_lm_' + L.id](world, scene, L, t.height(L.x, L.z), out);
            this._vegetation(world, scene, D);
            this._water(scene, D, out);
            for (const p of D.PYLONS) out.pylons[p.id] = this._pylon(world, scene, p, t.height(p.x, p.z));
            flushStruts(scene);
            return out;
        },

        _beacon(scene, out, x, y, z, color, size = 0.7) {
            const m = new THREE.Mesh(new THREE.SphereGeometry(size, 10, 8), glow(color));
            m.position.set(x, y, z);
            scene.add(m);
            out.beacons.push(m);
            return m;
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
            const geo = new THREE.LatheGeometry(pts, 28);
            const m = mesh(scene, world, geo, std(0x8a8f86, { side: THREE.DoubleSide, roughness: 0.95 }), L.x, y - 3, L.z);
            m.rotation.z = 0.06; // sunken lean
            for (let i = 0; i < 8; i++) {
                const p = new THREE.Mesh(new THREE.SphereGeometry(4 + i * 0.8, 10, 8), new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.16, fog: false, depthWrite: false }));
                p.position.set(L.x, y + L.h + i * 5, L.z);
                scene.add(p);
                out.plumes.push({ m: p, base: y + L.h, phase: i / 8 });
            }
            // Ring of colliders approximating the shell base.
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
            for (let i = 0; i < 10; i++) {
                const b = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 2.4), std(0x52525b));
                const a = i / 10 * Math.PI * 2;
                b.position.set(Math.cos(a) * 7, Math.sin(a) * 7, 0);
                wheel.add(b);
            }
            this._beacon(scene, out, L.x - 2, y + L.h, L.z, L.color, 0.6);
        },

        _lm_dishes(world, scene, L, y, out) {
            const mat = std(0xe5e7eb, { metalness: 0.3, roughness: 0.4, side: THREE.DoubleSide });
            for (let i = 0; i < 3; i++) {
                const x = L.x + (i - 1) * 26, z = L.z + (i === 1 ? -6 : 4);
                const gy = world.terrain.height(x, z);
                mesh(scene, world, new THREE.CylinderGeometry(1.2, 2, 16, 10), mat, x, gy + 8, z);
                addCol(world, x, z, 1.6, 1.6, gy, gy + 16);
                const dish = new THREE.Mesh(new THREE.SphereGeometry(11, 24, 10, 0, Math.PI * 2, 0, 0.9), mat);
                dish.position.set(x, gy + 21, z);
                dish.rotation.x = -0.9 - i * 0.12;
                dish.rotation.y = i * 0.5;
                dish.castShadow = true;
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
            const light = new THREE.PointLight(0xa855f7, 2.2, 90, 1.6);
            light.position.set(L.x, y + 30, L.z);
            scene.add(light);
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
            const nearAnchor = (x, z) => D.POIS.some((p) => !p.interior && Math.hypot(x - p.x, z - p.z) < p.r + 6) ||
                D.PYLONS.some((p) => Math.hypot(x - p.x, z - p.z) < 6) || D.LANDMARKS.some((l) => Math.hypot(x - l.x, z - l.z) < 16);
            for (let i = 0; i < 2600 && lists.pine.length + lists.broad.length + lists.dead.length < 1300; i++) {
                const x = D.BOUNDS.minX + 12 + r() * (D.BOUNDS.maxX - D.BOUNDS.minX - 24);
                const z = D.BOUNDS.minZ + 12 + r() * (D.BOUNDS.maxZ - D.BOUNDS.minZ - 24);
                const h = t.height(x, z);
                if (h < D.WATER + 0.4 || t.slope(x, z) > 0.9 || nearAnchor(x, z)) continue;
                const road = D.ROADS.some((rd) => rd.pts.some((pt, k) => k < rd.pts.length - 1 && Math.hypot(x - pt[0], z - pt[1]) < 6));
                if (road) continue;
                const reg = D.regionAt(x, z).id;
                const dens = { haven_basin: 0.55, alpine_array: 0.7, rust_sprawl: 0.12, mire_delta: 0.35, ash_quarry: 0.15, meridian_core: 0.1 }[reg];
                if (r() > dens) continue;
                const kind = reg === 'alpine_array' ? 'pine' : (reg === 'haven_basin' ? (r() < 0.55 ? 'broad' : 'pine') : 'dead');
                lists[kind].push({ x, z, y: h, s: 0.8 + r() * 0.7 });
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
                trunk.castShadow = crown.castShadow = true;
                trunk.frustumCulled = crown.frustumCulled = false;
                scene.add(trunk, crown);
            }
            // Boulders.
            const rocks = [];
            for (let i = 0; i < 260; i++) {
                const x = D.BOUNDS.minX + 10 + r() * 620, z = D.BOUNDS.minZ + 10 + r() * 620;
                if (nearAnchor(x, z)) continue;
                rocks.push({ x, z, s: 0.5 + r() * 1.6 });
            }
            const rm = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0x7b7d76, roughness: 0.95, flatShading: true }), rocks.length);
            rocks.forEach((rk, i) => {
                const y = t.height(rk.x, rk.z);
                dummy.position.set(rk.x, y + rk.s * 0.3, rk.z);
                dummy.rotation.set(rk.x % 3, rk.z % 3, 0);
                dummy.scale.set(rk.s * 1.3, rk.s * 0.7, rk.s);
                dummy.updateMatrix();
                rm.setMatrixAt(i, dummy.matrix);
                if (rk.s > 1.1) world.colliders.push({ minX: rk.x - rk.s, maxX: rk.x + rk.s, minY: y, maxY: y + rk.s * 0.8, minZ: rk.z - rk.s * 0.8, maxZ: rk.z + rk.s * 0.8, active: true });
            });
            rm.castShadow = true;
            rm.frustumCulled = false;
            scene.add(rm);
        },

        _water(scene, D, out) {
            const sheet = (w, d, x, y, z, color, opacity) => {
                const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.12, metalness: 0.3, depthWrite: false }));
                m.rotation.x = -Math.PI / 2;
                m.position.set(x, y, z);
                scene.add(m);
                out.waters.push(m);
            };
            sheet(250, 250, 210, D.WATER, 20, 0x2c4a3a, 0.82);       // Mire
            sheet(40, 40, -180, -11.6, -60, 0x3d4a52, 0.8);           // Quarry sump
            sheet(36, 36, 180, -6.4, -190, 0x4c1d95, 0.7);            // Crater pool
            // Interior flood water is a batched box (see world data).
        },

        animate(world, clock) {
            const o = world.owrpg;
            if (!o) return;
            const blink = Math.sin(clock * 3) > 0.1;
            for (const b of o.beacons) b.visible = blink;
            for (const s of o.spinners) { if (s.axis === 'z') s.obj.rotation.z += s.speed * 0.016; else s.obj.rotation.y += s.speed * 0.016; }
            for (const p of o.plumes) {
                const k = (clock * 0.05 + p.phase) % 1;
                p.m.position.y = p.base + k * 40;
                p.m.scale.setScalar(0.6 + k * 1.6);
                p.m.material.opacity = 0.2 * (1 - k);
            }
            for (const a of o.arcs) {
                a.t -= 0.016;
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
            for (const p of Object.values(o.pylons)) if (p.active) p.rings.forEach((r, i) => { r.rotation.z = clock * (1 + i * 0.6); });
            if (o.obelisk) o.obelisk.material.emissiveIntensity = 0.7 + Math.sin(clock * 1.3) * 0.3;
        }
    };

    BO.OWRPGWorldArt = Art;
})(window.BO);
