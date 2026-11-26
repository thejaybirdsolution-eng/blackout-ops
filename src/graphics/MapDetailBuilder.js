/* ============================================================================
   BLACKOUT OPS — AAA Map Detail, Architectural Relief, Hero Props,
   Volumetric Fire, 1950s Vehicles, Wind-Sway Grass & Procedural Trees
   Pure presentation layer: preserves 100% of map colliders & gameplay metrics.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    function seeded(seed) {
        let s = (seed | 0) || 1;
        return () => {
            s = (s + 0x6D2B79F5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    class MapDetailBuilder {
        constructor() {
            this.geos = {};
            this.mats = {};
            this._grassUniforms = [];
            this._fireUniforms = [];
            this._swayTrees = [];
        }

        _geo(key, fn) {
            if (!this.geos[key]) this.geos[key] = fn();
            return this.geos[key];
        }

        _mat(key, fn) {
            if (!this.mats[key]) this.mats[key] = fn();
            return this.mats[key];
        }

        resetFrameState() {
            this._grassUniforms.length = 0;
            this._fireUniforms.length = 0;
            this._swayTrees.length = 0;
        }

        update(dt, elapsed) {
            for (let i = 0; i < this._grassUniforms.length; i++) {
                this._grassUniforms[i].value = elapsed;
            }
            for (let i = 0; i < this._fireUniforms.length; i++) {
                this._fireUniforms[i].value = elapsed;
            }
            for (let i = 0; i < this._swayTrees.length; i++) {
                const tr = this._swayTrees[i];
                tr.crown.rotation.z = Math.sin(elapsed * 1.15 + tr.phase) * 0.024;
                tr.crown.rotation.x = Math.cos(elapsed * 0.92 + tr.phase * 1.3) * 0.018;
            }
        }

        // ====================================================================
        // 1. MULTI-PART 3D WOODEN CRATES & MILITARY AMMO CRATES
        // ====================================================================
        buildCrateProp(b) {
            const g = new THREE.Group();
            g.position.set(b.x, b.y, b.z);
            const w = b.w, h = b.h, d = b.d;
            const slatMat = BO.Textures.getWorldMaterial('wood_crate', Math.max(w, d), h);
            const frameMat = BO.Textures.getWorldMaterial('wood_plank', 1, 1);
            const ironMat = this._mat('crate_iron', () => new THREE.MeshStandardMaterial({
                color: 0x262b33, roughness: 0.42, metalness: 0.78
            }));
            const brassMat = this._mat('crate_brass', () => new THREE.MeshStandardMaterial({
                color: 0xc29b38, roughness: 0.28, metalness: 0.88
            }));
            const ammoMat = this._mat('crate_ammo_od', () => new THREE.MeshStandardMaterial({
                color: 0x3b4832, roughness: 0.56, metalness: 0.36
            }));

            // Recessed inner plank body
            const inset = Math.min(0.06, Math.min(w, h, d) * 0.08);
            const inner = new THREE.Mesh(
                new THREE.BoxGeometry(Math.max(0.1, w - inset * 2), Math.max(0.1, h - inset * 2), Math.max(0.1, d - inset * 2)),
                slatMat
            );
            inner.castShadow = h > 0.5;
            inner.receiveShadow = true;
            g.add(inner);

            // 12 raised outer timber frame rails
            const beam = Math.min(0.09, Math.min(w, h, d) * 0.14);
            for (const sy of [-1, 1]) {
                for (const sz of [-1, 1]) {
                    const rx = new THREE.Mesh(new THREE.BoxGeometry(w, beam, beam), frameMat);
                    rx.position.set(0, sy * (h * 0.5 - beam * 0.5), sz * (d * 0.5 - beam * 0.5));
                    rx.castShadow = true;
                    g.add(rx);
                }
                for (const sx of [-1, 1]) {
                    const rz = new THREE.Mesh(new THREE.BoxGeometry(beam, beam, d), frameMat);
                    rz.position.set(sx * (w * 0.5 - beam * 0.5), sy * (h * 0.5 - beam * 0.5), 0);
                    rz.castShadow = true;
                    g.add(rz);
                }
            }
            for (const sx of [-1, 1]) {
                for (const sz of [-1, 1]) {
                    const post = new THREE.Mesh(new THREE.BoxGeometry(beam, h, beam), frameMat);
                    post.position.set(sx * (w * 0.5 - beam * 0.5), 0, sz * (d * 0.5 - beam * 0.5));
                    post.castShadow = true;
                    g.add(post);
                }
            }

            // 8 dark-steel corner brackets + lid clasp
            const brk = Math.min(0.13, beam * 1.35);
            const brkGeo = new THREE.BoxGeometry(brk, brk, brk);
            for (const sx of [-1, 1]) {
                for (const sy of [-1, 1]) {
                    for (const sz of [-1, 1]) {
                        const c = new THREE.Mesh(brkGeo, ironMat);
                        c.position.set(sx * (w * 0.5 - brk * 0.45), sy * (h * 0.5 - brk * 0.45), sz * (d * 0.5 - brk * 0.45));
                        g.add(c);
                    }
                }
            }
            const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.14, 0.04), brassMat);
            clasp.position.set(0, h * 0.5 - beam * 0.9, d * 0.5 + 0.01);
            g.add(clasp);

            // Ground-level supply crates get a stamped steel ammo can & brass belt on top
            if (b.y < 1.2 && Math.min(w, d) >= 0.85 && h <= 1.35) {
                const can = new THREE.Group();
                can.position.set(w * 0.14, h * 0.5 + 0.11, -d * 0.10);
                can.rotation.y = 0.38;
                const canBody = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.22, 0.18), ammoMat);
                const canLid = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.20), ammoMat);
                canLid.position.y = 0.11;
                const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.04), ironMat);
                handle.position.y = 0.14;
                can.add(canBody, canLid, handle);
                g.add(can);
            }
            return g;
        }

        // ====================================================================
        // 2. SCULPTED ORGANIC SANDBAG BARRICADES (INSTANCED BURLAP BAGS)
        // ====================================================================
        buildSandbagProp(b) {
            const g = new THREE.Group();
            g.position.set(b.x, b.y, b.z);
            const w = b.w, h = b.h, d = b.d;
            const alongX = w >= d;
            const len = alongX ? w : d;
            const thick = alongX ? d : w;

            const bagMat = BO.Textures.getWorldMaterial('sandbag', 1, 1);
            const bagGeo = this._geo('sandbag_pillow_v1', () => {
                const geo = new THREE.SphereGeometry(0.5, 10, 7);
                const pos = geo.attributes.position;
                for (let i = 0; i < pos.count; i++) {
                    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
                    // Flatten bottom/top slightly and pinch the ends like a tied burlap sack
                    const endPinch = 1.0 - Math.pow(Math.abs(x) * 2.0, 2.2) * 0.35;
                    y *= 0.82 * endPinch;
                    z *= 0.94 * endPinch;
                    // Subtle mid-sag
                    y -= (1.0 - Math.min(1, Math.abs(x) * 2.0)) * 0.04;
                    pos.setXYZ(i, x, y, z);
                }
                geo.computeVertexNormals();
                return geo;
            });

            const bagL = 0.56, bagH = 0.21, bagD = Math.min(0.42, Math.max(0.28, thick * 0.52));
            const rows = Math.max(2, Math.round(h / bagH));
            const cols = Math.max(1, Math.round(len / (bagL * 0.88)));
            const depthRows = Math.max(1, Math.round(thick / (bagD * 0.88)));
            const total = rows * cols * depthRows;

            const inst = new THREE.InstancedMesh(bagGeo, bagMat, total);
            inst.castShadow = true;
            inst.receiveShadow = true;

            const rng = seeded(Math.round((b.x * 37 + b.z * 73 + b.y * 13) * 100));
            const dummy = new THREE.Object3D();
            let idx = 0;
            for (let r = 0; r < rows; r++) {
                const y = -h * 0.5 + (r + 0.5) * (h / rows);
                const stagger = (r % 2) * (bagL * 0.35);
                for (let dr = 0; dr < depthRows; dr++) {
                    const dOff = depthRows === 1 ? 0 : (-thick * 0.5 + (dr + 0.5) * (thick / depthRows));
                    for (let c = 0; c < cols; c++) {
                        let lOff = -len * 0.5 + (c + 0.5) * (len / cols) + (stagger - bagL * 0.17);
                        lOff = Math.max(-len * 0.5 + bagL * 0.42, Math.min(len * 0.5 - bagL * 0.42, lOff));
                        const jx = (rng() - 0.5) * 0.03;
                        const jz = (rng() - 0.5) * 0.03;
                        if (alongX) {
                            dummy.position.set(lOff + jx, y, dOff + jz);
                            dummy.rotation.set((rng() - 0.5) * 0.06, (rng() - 0.5) * 0.14, (rng() - 0.5) * 0.06);
                        } else {
                            dummy.position.set(dOff + jx, y, lOff + jz);
                            dummy.rotation.set((rng() - 0.5) * 0.06, Math.PI * 0.5 + (rng() - 0.5) * 0.14, (rng() - 0.5) * 0.06);
                        }
                        dummy.scale.set(bagL * (0.94 + rng() * 0.12), (h / rows) * 1.15, bagD * (0.94 + rng() * 0.12));
                        dummy.updateMatrix();
                        inst.setMatrixAt(idx++, dummy.matrix);
                    }
                }
            }
            inst.instanceMatrix.needsUpdate = true;
            g.add(inst);
            return g;
        }

        // ====================================================================
        // 3. DETAILED 3D WORKBENCHES / TABLES
        // ====================================================================
        buildTableProp(b) {
            const g = new THREE.Group();
            g.position.set(b.x, b.y, b.z);
            const w = b.w, h = b.h, d = b.d;
            const topMat = BO.Textures.getWorldMaterial(b.mat || 'wood_plank', w, d);
            const legMat = BO.Textures.getWorldMaterial('rusted_metal', 1, 1);

            const topThick = Math.min(0.11, h * 0.15);
            const top = new THREE.Mesh(new THREE.BoxGeometry(w, topThick, d), topMat);
            top.position.y = h * 0.5 - topThick * 0.5;
            top.castShadow = true;
            top.receiveShadow = true;
            g.add(top);

            // Apron skirt under tabletop
            const apron = new THREE.Mesh(
                new THREE.BoxGeometry(Math.max(0.1, w - 0.14), topThick * 1.2, Math.max(0.1, d - 0.14)),
                legMat
            );
            apron.position.y = h * 0.5 - topThick * 1.4;
            g.add(apron);

            // 4 legs + lower stretcher crossbars
            const legH = h - topThick;
            const legW = 0.085;
            const lx = Math.max(0.1, w * 0.5 - 0.10);
            const lz = Math.max(0.1, d * 0.5 - 0.10);
            const legGeo = new THREE.BoxGeometry(legW, legH, legW);
            for (const sx of [-1, 1]) {
                for (const sz of [-1, 1]) {
                    const leg = new THREE.Mesh(legGeo, legMat);
                    leg.position.set(sx * lx, -topThick * 0.5, sz * lz);
                    leg.castShadow = true;
                    g.add(leg);
                }
            }
            const railY = -h * 0.25;
            const railX = new THREE.Mesh(new THREE.BoxGeometry(lx * 2, 0.05, 0.05), legMat);
            railX.position.set(0, railY, 0);
            const railZ1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, lz * 2), legMat);
            railZ1.position.set(-lx, railY, 0);
            const railZ2 = railZ1.clone(); railZ2.position.x = lx;
            g.add(railX, railZ1, railZ2);
            return g;
        }

        // ====================================================================
        // 4. VOLUMETRIC ANIMATED GLSL FIRE BARRELS & BRAZIERS
        // ====================================================================
        _createFlameMaterial() {
            const uTime = { value: 0 };
            this._fireUniforms.push(uTime);
            const mat = new THREE.ShaderMaterial({
                uniforms: { uTime },
                vertexShader: /* glsl */`
                    uniform float uTime;
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        vec3 p = position;
                        float h = clamp(uv.y, 0.0, 1.0);
                        float sway = sin(uTime * 6.5 + h * 4.5 + p.x * 3.0) * 0.085 * h;
                        float flutter = cos(uTime * 11.0 + h * 7.0) * 0.045 * h;
                        p.x += sway;
                        p.z += flutter;
                        p.x *= (1.0 - h * 0.58);
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
                    }
                `,
                fragmentShader: /* glsl */`
                    uniform float uTime;
                    varying vec2 vUv;
                    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
                    float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
                      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y); }
                    float fbm(vec2 p){
                        float v = 0.0, a = 0.5;
                        for(int i=0;i<4;i++){ v += a*noise(p); p *= 2.05; a *= 0.5; }
                        return v;
                    }
                    void main() {
                        vec2 uv = vUv;
                        float dx = abs(uv.x - 0.5) * 2.0;
                        float scroll = uTime * 2.8;
                        float n = fbm(vec2(uv.x * 4.2, uv.y * 3.4 - scroll));
                        float n2 = fbm(vec2(uv.x * 7.5 + 3.1, uv.y * 5.2 - scroll * 1.45));
                        float turb = n * 0.65 + n2 * 0.35;

                        float shape = (1.0 - dx * dx) * (1.0 - pow(uv.y, 1.15));
                        float mask = smoothstep(0.18, 0.62, shape + (turb - 0.45) * 0.68);
                        if (mask < 0.02) discard;

                        vec3 coreCol = vec3(1.6, 1.35, 0.72);
                        vec3 midCol  = vec3(1.35, 0.48, 0.06);
                        vec3 tipCol  = vec3(0.75, 0.12, 0.02);
                        float heat = clamp(shape * 1.15 + turb * 0.4 - uv.y * 0.45, 0.0, 1.0);
                        vec3 col = mix(tipCol, midCol, smoothstep(0.15, 0.55, heat));
                        col = mix(col, coreCol, smoothstep(0.55, 0.92, heat));

                        gl_FragColor = vec4(col, mask * 0.92);
                    }
                `,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });
            return mat;
        }

        _createEmberPoints(count = 24, radius = 0.24, height = 1.15) {
            const pos = new Float32Array(count * 3);
            const seed = new Float32Array(count * 3);
            for (let i = 0; i < count; i++) {
                const a = Math.random() * Math.PI * 2;
                const r = Math.random() * radius;
                pos[i * 3] = Math.cos(a) * r;
                pos[i * 3 + 1] = Math.random() * height;
                pos[i * 3 + 2] = Math.sin(a) * r;
                seed[i * 3] = Math.random();
                seed[i * 3 + 1] = 0.5 + Math.random() * 0.8;
                seed[i * 3 + 2] = Math.random() * 6.28;
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
            const uTime = { value: 0 };
            this._fireUniforms.push(uTime);
            const mat = new THREE.ShaderMaterial({
                uniforms: { uTime, uHeight: { value: height } },
                vertexShader: /* glsl */`
                    attribute vec3 aSeed;
                    uniform float uTime;
                    uniform float uHeight;
                    varying float vAlpha;
                    void main() {
                        float life = fract(aSeed.x + uTime * (0.42 * aSeed.y));
                        vec3 p = position;
                        p.y = life * uHeight;
                        p.x += sin(uTime * 3.2 + aSeed.z + life * 5.0) * 0.14 * life;
                        p.z += cos(uTime * 2.7 + aSeed.z + life * 4.2) * 0.14 * life;
                        vec4 mv = modelViewMatrix * vec4(p, 1.0);
                        gl_Position = projectionMatrix * mv;
                        gl_PointSize = clamp((1.0 - life) * 26.0 / max(-mv.z, 0.5), 2.0, 7.0);
                        vAlpha = sin(life * 3.14159);
                    }
                `,
                fragmentShader: /* glsl */`
                    varying float vAlpha;
                    void main() {
                        float d = length(gl_PointCoord - 0.5) * 2.0;
                        if (d > 1.0) discard;
                        float glow = pow(1.0 - d, 1.8);
                        gl_FragColor = vec4(1.4, 0.65, 0.15, glow * vAlpha * 0.95);
                    }
                `,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            return new THREE.Points(geo, mat);
        }

        buildFireBarrel(scene, l, worldBuilder) {
            const by = l.baseY || 0;
            const g = new THREE.Group();
            g.position.set(l.x, by, l.z);

            const barrelMat = BO.Textures.getWorldMaterial('rusted_metal', 1, 1);
            const rimMat = this._mat('barrel_rim', () => new THREE.MeshStandardMaterial({
                color: 0x352822, roughness: 0.58, metalness: 0.68
            }));
            const emberBedMat = this._mat('ember_bed', () => new THREE.MeshStandardMaterial({
                color: 0x1a0b06, emissive: 0xff5a14, emissiveIntensity: 1.5, roughness: 0.9
            }));

            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.36, 0.94, 18), barrelMat);
            barrel.position.y = 0.47;
            barrel.castShadow = true;
            barrel.receiveShadow = true;
            g.add(barrel);

            // Rolled top/bottom rims + 2 stamped reinforcement ribs
            for (const ry of [0.03, 0.32, 0.64, 0.93]) {
                const hoop = new THREE.Mesh(
                    new THREE.TorusGeometry(ry > 0.9 || ry < 0.05 ? 0.362 : 0.356, 0.022, 8, 20),
                    rimMat
                );
                hoop.rotation.x = Math.PI * 0.5;
                hoop.position.y = ry;
                g.add(hoop);
            }

            // Glowing coal bed recessed slightly inside top rim
            const coals = new THREE.Mesh(new THREE.CircleGeometry(0.32, 16), emberBedMat);
            coals.rotation.x = -Math.PI * 0.5;
            coals.position.y = 0.84;
            g.add(coals);

            // Crossed volumetric animated flame ribbons
            const flameGroup = new THREE.Group();
            flameGroup.position.y = 1.18;
            const flameMat = this._createFlameMaterial();
            const planeGeo = this._geo('vol_flame_plane', () => new THREE.PlaneGeometry(0.64, 0.88, 6, 10));
            for (let k = 0; k < 3; k++) {
                const f = new THREE.Mesh(planeGeo, flameMat);
                f.rotation.y = (k / 3) * Math.PI;
                flameGroup.add(f);
            }
            g.add(flameGroup);

            // Rising sparks
            const embers = this._createEmberPoints(22, 0.22, 1.25);
            embers.position.y = 0.85;
            g.add(embers);

            const light = new THREE.PointLight(0xff7228, l.intensity, l.distance, 1.6);
            light.position.set(0, 1.38, 0);
            g.add(light);

            scene.add(g);
            worldBuilder.worldMeshes.push(barrel);
            worldBuilder.colliders.push({
                minX: l.x - 0.38, maxX: l.x + 0.38,
                minY: by, maxY: by + 0.96,
                minZ: l.z - 0.38, maxZ: l.z + 0.38,
                active: true
            });
            worldBuilder.fireFlames.push({ flame: flameGroup, light, baseInt: l.intensity });
        }

        // ====================================================================
        // 5. SCULPTED 1950s NUKETOWN BUS, MOVING TRUCK & MANNEQUINS
        // ====================================================================
        buildNuketownBus(scene, lm, worldBuilder) {
            const bx = lm.x, by = lm.y || 0, bz = lm.z;
            const bg = new THREE.Group();
            bg.position.set(bx, by, bz);

            const busMat = BO.Textures.getWorldMaterial('bus_teal', 4, 2);
            const floorMat = BO.Textures.getWorldMaterial('diamond_plate', 2, 4);
            const trimMat = this._mat('bus_cream', () => new THREE.MeshStandardMaterial({ color: 0xe6e1d4, roughness: 0.45, metalness: 0.15 }));
            const chromeMat = this._mat('bus_chrome', () => new THREE.MeshStandardMaterial({ color: 0xdbe2ea, roughness: 0.20, metalness: 0.92 }));
            const tireMat = this._mat('bus_tire', () => new THREE.MeshStandardMaterial({ color: 0x16181c, roughness: 0.90 }));
            const glassMat = this._mat('bus_glass', () => new THREE.MeshPhysicalMaterial({
                color: 0x162636, roughness: 0.12, metalness: 0.25, transparent: true, opacity: 0.62, clearcoat: 0.9
            }));
            const seatMat = this._mat('bus_seat', () => new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.78 }));
            const headLightMat = this._mat('bus_headlight', () => new THREE.MeshStandardMaterial({
                color: 0xfff8dc, emissive: 0xfef08a, emissiveIntensity: 1.35, roughness: 0.15
            }));

            // Floor chassis
            const floor = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.28, 9.6), floorMat);
            floor.position.y = 0.22;
            floor.receiveShadow = true;
            floor.castShadow = true;

            // Curved retro roof crown (chamfered arch)
            const roofMain = new THREE.Mesh(new THREE.BoxGeometry(2.86, 0.20, 9.7), trimMat);
            roofMain.position.y = 2.66;
            roofMain.castShadow = true;
            const roofCrown = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.36, 9.3, 14, 1, false, -Math.PI * 0.5, Math.PI), trimMat);
            roofCrown.rotation.z = Math.PI * 0.5;
            roofCrown.rotation.y = Math.PI * 0.5;
            roofCrown.scale.set(1, 0.22, 1);
            roofCrown.position.y = 2.75;

            // Lower waist panels + upper pillars + window mullions (left side & 2 right segments with doorway gap)
            const addSideAssembly = (xPos, zCenter, zLen, winCount) => {
                const lower = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.15, zLen), busMat);
                lower.position.set(xPos, 0.85, zCenter);
                lower.castShadow = true;
                lower.receiveShadow = true;
                const belt = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.10, zLen + 0.04), chromeMat);
                belt.position.set(xPos, 1.44, zCenter);
                const header = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, zLen), trimMat);
                header.position.set(xPos, 2.42, zCenter);
                const glass = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.84, zLen - 0.2), glassMat);
                glass.position.set(xPos, 1.88, zCenter);
                bg.add(lower, belt, header, glass);
                worldBuilder.worldMeshes.push(lower, header);

                for (let i = 0; i <= winCount; i++) {
                    const pz = zCenter - zLen * 0.5 + 0.12 + (i / winCount) * (zLen - 0.24);
                    const pil = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.90, 0.12), trimMat);
                    pil.position.set(xPos, 1.88, pz);
                    bg.add(pil);
                }
            };
            addSideAssembly(-1.35, 0, 9.5, 6);
            addSideAssembly(1.35, -3.1, 3.3, 2);
            addSideAssembly(1.35, 3.1, 3.3, 2);

            // Rear bulkhead with emergency window & tail lights
            const rearPanel = new THREE.Mesh(new THREE.BoxGeometry(2.74, 1.25, 0.18), busMat);
            rearPanel.position.set(0, 0.85, 4.74);
            const rearTop = new THREE.Mesh(new THREE.BoxGeometry(2.74, 0.35, 0.18), trimMat);
            rearTop.position.set(0, 2.42, 4.74);
            bg.add(rearPanel, rearTop);

            // 1950s Engine Hood, Radiator Grille, Headlights & Chrome Bumper (front at -Z)
            const hood = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.05, 1.38), busMat);
            hood.position.set(0, 0.78, -4.45);
            hood.castShadow = true;
            const hoodCap = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.15, 1.36, 12, 1, false, -Math.PI * 0.5, Math.PI), busMat);
            hoodCap.rotation.z = Math.PI * 0.5;
            hoodCap.rotation.y = Math.PI * 0.5;
            hoodCap.scale.set(1, 0.24, 1);
            hoodCap.position.set(0, 1.30, -4.45);

            const grille = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.58, 0.08), chromeMat);
            grille.position.set(0, 0.78, -5.15);
            for (let gi = -2; gi <= 2; gi++) {
                const bar = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.04, 0.11), tireMat);
                bar.position.set(0, 0.78 + gi * 0.10, -5.16);
                bg.add(bar);
            }
            const bumperF = new THREE.Mesh(new THREE.BoxGeometry(2.72, 0.18, 0.18), chromeMat);
            bumperF.position.set(0, 0.34, -5.18);
            const bumperR = bumperF.clone();
            bumperR.position.z = 4.92;
            bg.add(hood, hoodCap, grille, bumperF, bumperR);

            // Dual round headlights + amber turn signals
            for (const sx of [-0.94, 0.94]) {
                const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.17, 0.10, 14), chromeMat);
                bezel.rotation.x = Math.PI * 0.5;
                bezel.position.set(sx, 0.88, -5.14);
                const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.11, 14), headLightMat);
                lamp.rotation.x = Math.PI * 0.5;
                lamp.position.set(sx, 0.88, -5.15);
                bg.add(bezel, lamp);
            }

            // Windshield frame
            const wsGlass = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.92, 0.05), glassMat);
            wsGlass.position.set(0, 1.92, -4.72);
            wsGlass.rotation.x = 0.14;
            bg.add(wsGlass);

            // 4 Wheels + Chrome Hubcaps
            for (const wx of [-1.26, 1.26]) {
                for (const wz of [-3.35, 2.85]) {
                    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.28, 18), tireMat);
                    tire.rotation.z = Math.PI * 0.5;
                    tire.position.set(wx, 0.44, wz);
                    tire.castShadow = true;
                    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.30, 14), chromeMat);
                    hub.rotation.z = Math.PI * 0.5;
                    hub.position.set(wx, 0.44, wz);
                    bg.add(tire, hub);
                }
            }

            // Interior Steering Wheel + Perimeter Bench Seats (leaves center aisle clear!)
            const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.025, 8, 16), tireMat);
            wheel.position.set(-0.78, 1.32, -3.55);
            wheel.rotation.x = Math.PI * 0.35;
            bg.add(wheel);
            for (let sz = -2.2; sz <= 3.6; sz += 1.45) {
                const benchL = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.36, 0.62), seatMat);
                benchL.position.set(-0.96, 0.56, sz);
                const backL = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.48, 0.12), seatMat);
                backL.position.set(-0.96, 0.94, sz + 0.25);
                bg.add(benchL, backL);
                if (sz > -0.8) {
                    const benchR = benchL.clone(); benchR.position.x = 0.96;
                    const backR = backL.clone(); backR.position.x = 0.96;
                    bg.add(benchR, backR);
                }
            }

            bg.add(floor, roofMain, roofCrown);
            scene.add(bg);
            worldBuilder.worldMeshes.push(floor, roofMain, hood);

            // Preserve exact walkthrough colliders
            worldBuilder.colliders.push(
                { minX: bx - 1.4, maxX: bx + 1.4, minY: by, maxY: by + 0.28, minZ: bz - 4.8, maxZ: bz + 4.8, active: true },
                { minX: bx - 1.45, maxX: bx + 1.45, minY: by + 2.53, maxY: by + 2.77, minZ: bz - 4.9, maxZ: bz + 4.9, active: true },
                { minX: bx - 1.44, maxX: bx - 1.26, minY: by + 0.25, maxY: by + 2.58, minZ: bz - 4.8, maxZ: bz + 4.8, active: true },
                { minX: bx + 1.26, maxX: bx + 1.44, minY: by + 0.25, maxY: by + 2.58, minZ: bz - 4.8, maxZ: bz - 1.4, active: true },
                { minX: bx + 1.26, maxX: bx + 1.44, minY: by + 0.25, maxY: by + 2.58, minZ: bz + 1.4, maxZ: bz + 4.8, active: true },
                { minX: bx - 1.35, maxX: bx + 1.35, minY: by + 0.15, maxY: by + 1.65, minZ: bz - 5.1, maxZ: bz - 3.7, active: true }
            );
        }

        buildMannequin(scene, lm) {
            const g = new THREE.Group();
            g.position.set(lm.x, lm.y || 0, lm.z);
            g.rotation.y = lm.rotY || 0;
            const dressCol = lm.color || 0xe2d5c3;
            const skinM = this._mat('man_skin', () => new THREE.MeshStandardMaterial({ color: 0xe6d3c2, roughness: 0.42 }));
            const suitM = new THREE.MeshStandardMaterial({ color: dressCol, roughness: 0.58 });
            const hairM = this._mat('man_hair', () => new THREE.MeshStandardMaterial({ color: 0x261d17, roughness: 0.65 }));
            const plinthM = this._mat('man_plinth', () => new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.38, metalness: 0.65 }));

            const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.08, 18), plinthM);
            base.position.y = 0.04;
            base.castShadow = true;

            // Contoured lathe torso + skirt/slacks
            const lowerGeo = this._geo('man_legs', () => new THREE.LatheGeometry([
                [0.14, 0.0], [0.16, 0.35], [0.15, 0.72], [0.13, 0.78]
            ].map(p => new THREE.Vector2(p[0], p[1])), 16));
            const legs = new THREE.Mesh(lowerGeo, suitM);
            legs.position.y = 0.08;
            legs.castShadow = true;

            const torsoGeo = this._geo('man_torso', () => {
                const geo = new THREE.LatheGeometry([
                    [0.13, 0.0], [0.11, 0.16], [0.16, 0.38], [0.17, 0.52], [0.06, 0.62], [0.055, 0.72]
                ].map(p => new THREE.Vector2(p[0], p[1])), 16);
                geo.scale(1.0, 1.0, 0.72);
                geo.computeVertexNormals();
                return geo;
            });
            const torso = new THREE.Mesh(torsoGeo, suitM);
            torso.position.y = 0.84;
            torso.castShadow = true;

            const head = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 12), skinM);
            head.scale.set(0.92, 1.08, 0.96);
            head.position.y = 1.66;
            const hair = new THREE.Mesh(new THREE.SphereGeometry(0.132, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), hairM);
            hair.position.set(0, 1.68, -0.01);
            hair.rotation.x = -0.35;

            for (const s of [-1, 1]) {
                const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.030, 0.54, 10), skinM);
                arm.position.set(s * 0.21, 1.14, 0.04);
                arm.rotation.set(-0.25, 0, s * 0.16);
                g.add(arm);
            }
            g.add(base, legs, torso, head, hair);
            scene.add(g);
        }

        dressMysteryBox(boxGroup, w = 1.75, h = 0.65, d = 0.85) {
            const ironMat = this._mat('crate_iron', () => new THREE.MeshStandardMaterial({ color: 0x22262e, roughness: 0.42, metalness: 0.82 }));
            const brassMat = this._mat('crate_brass', () => new THREE.MeshStandardMaterial({ color: 0xd4a438, roughness: 0.28, metalness: 0.88 }));
            for (const sx of [-1, 1]) {
                const strap = new THREE.Mesh(new THREE.BoxGeometry(0.08, h + 0.03, d + 0.04), ironMat);
                strap.position.set(sx * w * 0.34, h * 0.5, 0);
                const handle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.016, 6, 12), ironMat);
                handle.rotation.y = Math.PI * 0.5;
                handle.position.set(sx * (w * 0.5 + 0.02), h * 0.55, 0);
                boxGroup.add(strap, handle);
            }
            const lockPlate = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.20, 0.05), brassMat);
            lockPlate.position.set(0, h * 0.72, d * 0.5 + 0.02);
            const glowSeam = new THREE.Mesh(
                new THREE.BoxGeometry(w * 0.94, 0.025, d * 0.94),
                new THREE.MeshBasicMaterial({ color: 0xfde047 })
            );
            glowSeam.position.y = h + 0.005;
            boxGroup.add(lockPlate, glowSeam);
        }

        // ====================================================================
        // 6. WORLD-LEVEL ARCHITECTURAL DRESSING, GRASS TUFTS & 3D TREES
        // ====================================================================
        dressWorld(worldBuilder) {
            if (!worldBuilder || worldBuilder.large || !worldBuilder.mapData) return;
            const scene = worldBuilder.scene;
            const boxes = worldBuilder.mapData.boxes || [];

            const trimMats = {
                siding: this._mat('arch_trim_cream', () => new THREE.MeshStandardMaterial({ color: 0xd9d4c6, roughness: 0.86 })),
                stone: this._mat('arch_trim_stone', () => new THREE.MeshStandardMaterial({ color: 0x4f545c, roughness: 0.92 })),
                roof: this._mat('arch_roof_fascia', () => new THREE.MeshStandardMaterial({ color: 0x1f242c, roughness: 0.88 })),
                plinth: BO.Textures.getWorldMaterial('concrete', 4, 1)
            };

            const creamMatrices = [];
            const stoneMatrices = [];
            const plinthMatrices = [];
            const fasciaMatrices = [];
            const dummy = new THREE.Object3D();

            const pushMat = (arr, x, y, z, sx, sy, sz) => {
                dummy.position.set(x, y, z);
                dummy.rotation.set(0, 0, 0);
                dummy.scale.set(sx, sy, sz);
                dummy.updateMatrix();
                arr.push(dummy.matrix.clone());
            };

            // Detect grass footprints and building exclusion footprints
            const grassRects = [];
            const solidRects = [];
            let hasTruck = false;
            let truckCab = null;

            for (let i = 0; i < boxes.length; i++) {
                const b = boxes[i];
                if (b.mat === 'nuketown_grass') {
                    grassRects.push(b);
                    continue;
                }
                if (b.h > 0.3 && b.y < 3.5) {
                    solidRects.push({
                        minX: b.x - b.w * 0.5 - 0.5, maxX: b.x + b.w * 0.5 + 0.5,
                        minZ: b.z - b.d * 0.5 - 0.5, maxZ: b.z + b.d * 0.5 + 0.5
                    });
                }
                if (b.mat === 'truck_yellow' && b.w > 2.0 && b.d > 2.0 && b.h > 2.0) {
                    hasTruck = true;
                    truckCab = b;
                }

                // 1) Architectural corner pilasters & grounded foundation plinths on exterior/interior walls
                const isWall = b.h >= 2.2 && Math.min(b.w, b.d) <= 1.1 && Math.max(b.w, b.d) >= 1.8;
                if (isWall) {
                    const isSiding = /siding/.test(b.mat || '');
                    const isMasonry = /brick|stone|concrete|castle/.test(b.mat || '');
                    if (isSiding || isMasonry) {
                        const target = isSiding ? creamMatrices : stoneMatrices;
                        const alongX = b.w >= b.d;
                        const thick = (alongX ? b.d : b.w) + 0.08;
                        const pilW = 0.16;
                        for (const s of [-1, 1]) {
                            const px = alongX ? b.x + s * (b.w * 0.5 - pilW * 0.4) : b.x;
                            const pz = alongX ? b.z : b.z + s * (b.d * 0.5 - pilW * 0.4);
                            pushMat(target, px, b.y, pz, alongX ? pilW : thick, b.h + 0.02, alongX ? thick : pilW);
                        }
                        // Top cornice trim board under roof line
                        pushMat(target, b.x, b.y + b.h * 0.5 - 0.09, b.z, b.w + 0.08, 0.18, b.d + 0.08);
                        // Grounded concrete foundation plinth for ground-level walls
                        if (b.y - b.h * 0.5 <= 0.15) {
                            pushMat(plinthMatrices, b.x, 0.11, b.z, b.w + 0.10, 0.22, b.d + 0.10);
                        }
                    }
                }

                // 2) Roof eaves, gutters & pitched gable crest on dark_slate_roof slabs
                if (b.mat === 'dark_slate_roof' && b.w >= 4 && b.d >= 4) {
                    const roofTop = b.y + b.h * 0.5;
                    pushMat(fasciaMatrices, b.x, b.y - b.h * 0.35, b.z, b.w + 0.36, 0.14, b.d + 0.36);
                    // Pitched gable prism / stepped shingle ridge above flat slab
                    const ridgeGeo = this._buildGableRoofGeo(b.w + 0.3, Math.min(2.2, Math.min(b.w, b.d) * 0.18), b.d + 0.3);
                    const ridgeMesh = new THREE.Mesh(ridgeGeo, BO.Textures.getWorldMaterial('dark_slate_roof', b.w, b.d));
                    ridgeMesh.position.set(b.x, roofTop, b.z);
                    ridgeMesh.castShadow = true;
                    ridgeMesh.receiveShadow = true;
                    scene.add(ridgeMesh);
                }
            }

            // 3) Window sill & header trim casings from mapData.windows
            const windows = worldBuilder.mapData.windows || [];
            for (let i = 0; i < windows.length; i++) {
                const w = windows[i];
                const wy = w.y || 0;
                const spanX = w.axis === 'z';
                const ww = w.w || 2.2;
                pushMat(stoneMatrices, w.x, wy + 0.92, w.z, spanX ? ww + 0.22 : 0.82, 0.12, spanX ? 0.82 : ww + 0.22);
                pushMat(stoneMatrices, w.x, wy + 2.75, w.z, spanX ? ww + 0.22 : 0.82, 0.14, spanX ? 0.82 : ww + 0.22);
            }

            const flushInstanced = (matrices, mat) => {
                if (!matrices.length) return;
                const unitGeo = new THREE.BoxGeometry(1, 1, 1);
                const inst = new THREE.InstancedMesh(unitGeo, mat, matrices.length);
                inst.castShadow = true;
                inst.receiveShadow = true;
                for (let i = 0; i < matrices.length; i++) inst.setMatrixAt(i, matrices[i]);
                inst.instanceMatrix.needsUpdate = true;
                scene.add(inst);
            };
            flushInstanced(creamMatrices, trimMats.siding);
            flushInstanced(stoneMatrices, trimMats.stone);
            flushInstanced(plinthMatrices, trimMats.plinth);
            flushInstanced(fasciaMatrices, trimMats.roof);

            // 4) Dress Nuketown Moving Truck cab (wheels, grille, bumper, windshield, headlights)
            if (hasTruck && truckCab) {
                this._dressMovingTruck(scene, truckCab);
            }

            // 5) 3D Wind-Swaying Grass Tufts on lawn zones
            if (grassRects.length > 0) {
                this._scatterGrassTufts(scene, grassRects, solidRects, worldBuilder.mapData);
                this._placePerimeterTrees(scene, grassRects, solidRects, worldBuilder.mapData);
            }
        }

        _buildGableRoofGeo(w, h, d) {
            const hw = w * 0.5, hd = d * 0.5;
            const alongZ = d >= w;
            let pos, idx;
            if (alongZ) {
                pos = new Float32Array([
                    -hw, 0, -hd,  hw, 0, -hd,  0, h, -hd,
                    -hw, 0,  hd,  hw, 0,  hd,  0, h,  hd
                ]);
                idx = [
                    0, 2, 1, 3, 4, 5,
                    0, 3, 5, 0, 5, 2,
                    1, 2, 5, 1, 5, 4
                ];
            } else {
                pos = new Float32Array([
                    -hw, 0, -hd, -hw, 0,  hd, -hw, h, 0,
                     hw, 0, -hd,  hw, 0,  hd,  hw, h, 0
                ]);
                idx = [
                    0, 1, 2, 3, 5, 4,
                    0, 2, 5, 0, 5, 3,
                    1, 4, 5, 1, 5, 2
                ];
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geo.setIndex(idx);
            geo.computeVertexNormals();
            return geo;
        }

        _dressMovingTruck(scene, cab) {
            const g = new THREE.Group();
            const tireMat = this._mat('bus_tire', () => new THREE.MeshStandardMaterial({ color: 0x16181c, roughness: 0.90 }));
            const chromeMat = this._mat('bus_chrome', () => new THREE.MeshStandardMaterial({ color: 0xdbe2ea, roughness: 0.20, metalness: 0.92 }));
            const glassMat = this._mat('bus_glass', () => new THREE.MeshPhysicalMaterial({
                color: 0x162636, roughness: 0.12, metalness: 0.25, transparent: true, opacity: 0.62, clearcoat: 0.9
            }));
            const lampMat = this._mat('bus_headlight', () => new THREE.MeshStandardMaterial({
                color: 0xfff8dc, emissive: 0xfef08a, emissiveIntensity: 1.2, roughness: 0.15
            }));

            const cx = cab.x, cz = cab.z;
            // Front bumper, grille, windshield & headlights (cab faces -Z)
            const bumper = new THREE.Mesh(new THREE.BoxGeometry(cab.w + 0.12, 0.22, 0.20), chromeMat);
            bumper.position.set(cx, 0.36, cz - cab.d * 0.5 - 0.08);
            const grille = new THREE.Mesh(new THREE.BoxGeometry(cab.w * 0.58, 0.62, 0.08), chromeMat);
            grille.position.set(cx, 0.92, cz - cab.d * 0.5 - 0.03);
            const ws = new THREE.Mesh(new THREE.BoxGeometry(cab.w * 0.86, 0.72, 0.06), glassMat);
            ws.position.set(cx, 1.88, cz - cab.d * 0.5 - 0.02);
            g.add(bumper, grille, ws);

            for (const sx of [-1, 1]) {
                const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 12), lampMat);
                hl.rotation.x = Math.PI * 0.5;
                hl.position.set(cx + sx * (cab.w * 0.38), 0.92, cz - cab.d * 0.5 - 0.03);
                g.add(hl);
            }
            // 4 Truck Wheels along the full cab + trailer length
            for (const wx of [cx - cab.w * 0.46, cx + cab.w * 0.46]) {
                for (const wz of [cz - 0.2, cz + 7.2]) {
                    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.30, 16), tireMat);
                    tire.rotation.z = Math.PI * 0.5;
                    tire.position.set(wx, 0.46, wz);
                    tire.castShadow = true;
                    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.32, 12), chromeMat);
                    hub.rotation.z = Math.PI * 0.5;
                    hub.position.set(wx, 0.46, wz);
                    g.add(tire, hub);
                }
            }
            scene.add(g);
        }

        _scatterGrassTufts(scene, grassRects, solidRects, mapData) {
            const count = 440;
            const rng = seeded(4049);
            const tuftGeo = this._geo('grass_tuft_v1', () => {
                // 3 intersecting tapered grass blades per tuft
                const pos = [], nrm = [], uvs = [], idx = [];
                let vBase = 0;
                for (let b = 0; b < 3; b++) {
                    const ang = (b / 3) * Math.PI;
                    const ca = Math.cos(ang), sa = Math.sin(ang);
                    const hw = 0.065, h = 0.26 + (b % 2) * 0.06;
                    const lean = 0.05;
                    pos.push(
                        -hw * ca, 0, -hw * sa,
                         hw * ca, 0,  hw * sa,
                        -hw * 0.4 * ca + lean * sa, h * 0.6, -hw * 0.4 * sa - lean * ca,
                         hw * 0.4 * ca + lean * sa, h * 0.6,  hw * 0.4 * sa - lean * ca,
                         lean * 1.6 * sa, h, -lean * 1.6 * ca
                    );
                    for (let k = 0; k < 5; k++) nrm.push(0, 1, 0);
                    uvs.push(0, 0, 1, 0, 0.2, 0.6, 0.8, 0.6, 0.5, 1);
                    idx.push(
                        vBase, vBase + 1, vBase + 2,
                        vBase + 1, vBase + 3, vBase + 2,
                        vBase + 2, vBase + 3, vBase + 4
                    );
                    vBase += 5;
                }
                const g = new THREE.BufferGeometry();
                g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
                g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
                g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
                g.setIndex(idx);
                return g;
            });

            const uTime = { value: 0 };
            this._grassUniforms.push(uTime);
            const grassMat = new THREE.MeshStandardMaterial({
                color: 0x5c7338,
                roughness: 0.88,
                side: THREE.DoubleSide
            });
            grassMat.onBeforeCompile = (shader) => {
                shader.uniforms.uGrassTime = uTime;
                shader.vertexShader = shader.vertexShader
                    .replace('#include <common>', `#include <common>
uniform float uGrassTime;
varying float vBladeH;`)
                    .replace('#include <begin_vertex>', `#include <begin_vertex>
vBladeH = clamp(position.y / 0.30, 0.0, 1.0);
#ifdef USE_INSTANCING
    vec3 instPos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
    float sway = sin(uGrassTime * 2.1 + instPos.x * 0.45 + instPos.z * 0.35) * 0.065 * vBladeH * vBladeH;
    transformed.x += sway;
    transformed.z += sway * 0.55;
#endif`)
                    .replace('#include <color_fragment>', `#include <color_fragment>`);
                shader.fragmentShader = shader.fragmentShader
                    .replace('#include <common>', `#include <common>
varying float vBladeH;`)
                    .replace('#include <color_fragment>', `#include <color_fragment>
diffuseColor.rgb *= mix(0.62, 1.24, vBladeH);`);
            };
            grassMat.customProgramCacheKey = () => 'boGrass1';

            const insideSolid = (x, z) => {
                // Keep doorways and walkways clear
                if (Math.abs(x) < 10.6) return true;
                if (x > -24 && x < -9.5 && z > -10.8 && z < 8.8) return true;
                if (x > 9.5 && x < 24 && z > -10.8 && z < 8.8) return true;
                for (let i = 0; i < solidRects.length; i++) {
                    const r = solidRects[i];
                    if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) return true;
                }
                return false;
            };

            const inst = new THREE.InstancedMesh(tuftGeo, grassMat, count);
            inst.receiveShadow = true;
            const dummy = new THREE.Object3D();
            const cTmp = new THREE.Color();
            let placed = 0, tries = 0;
            while (placed < count && tries < count * 8) {
                tries++;
                const rect = grassRects[Math.floor(rng() * grassRects.length)];
                const x = rect.x + (rng() - 0.5) * (rect.w - 1.6);
                const z = rect.z + (rng() - 0.5) * (rect.d - 1.6);
                if (insideSolid(x, z)) continue;
                dummy.position.set(x, rect.y + rect.h * 0.5, z);
                dummy.rotation.y = rng() * Math.PI * 2;
                const sc = 0.78 + rng() * 0.65;
                dummy.scale.set(sc, sc * (0.85 + rng() * 0.4), sc);
                dummy.updateMatrix();
                inst.setMatrixAt(placed, dummy.matrix);
                cTmp.setHSL(0.24 + (rng() - 0.5) * 0.04, 0.36 + rng() * 0.14, 0.32 + rng() * 0.12);
                inst.setColorAt(placed, cTmp);
                placed++;
            }
            inst.count = placed;
            inst.instanceMatrix.needsUpdate = true;
            if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
            scene.add(inst);
        }

        _placePerimeterTrees(scene, grassRects, solidRects, mapData) {
            const barkMat = BO.Textures.getWorldMaterial('wood_fort', 1, 2);
            const leafMat = this._mat('tree_leaf_mat', () => new THREE.MeshStandardMaterial({
                color: 0x3b592c, roughness: 0.88, metalness: 0.0
            }));
            const spots = [
                [-26.8, -21.5], [-26.2, 18.8], [26.8, -21.5], [26.2, 18.8],
                [-14.5, 19.2], [14.5, 19.2], [-25.5, -13.0], [25.5, -13.0]
            ];
            const pads = mapData.skyDropPads || [];
            const rng = seeded(7717);
            for (let i = 0; i < spots.length; i++) {
                const [tx, tz] = spots[i];
                let blocked = false;
                for (let j = 0; j < solidRects.length; j++) {
                    const r = solidRects[j];
                    if (tx >= r.minX - 0.8 && tx <= r.maxX + 0.8 && tz >= r.minZ - 0.8 && tz <= r.maxZ + 0.8) {
                        blocked = true; break;
                    }
                }
                for (let p = 0; p < pads.length; p++) {
                    if (Math.hypot(tx - pads[p].x, tz - pads[p].z) < 3.5) { blocked = true; break; }
                }
                if (blocked) continue;

                const tree = new THREE.Group();
                tree.position.set(tx, 0, tz);
                const h = 4.4 + rng() * 1.4;

                // Tapered curved trunk + root flare
                const trunkGeo = new THREE.CylinderGeometry(0.16, 0.30, h * 0.58, 9);
                const trunk = new THREE.Mesh(trunkGeo, barkMat);
                trunk.position.y = h * 0.29;
                trunk.castShadow = true;
                trunk.receiveShadow = true;
                tree.add(trunk);

                const crown = new THREE.Group();
                crown.position.y = h * 0.55;
                for (let b = 0; b < 4; b++) {
                    const ang = (b / 4) * Math.PI * 2 + rng() * 0.5;
                    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 1.5, 7), barkMat);
                    br.position.set(Math.cos(ang) * 0.45, 0.35, Math.sin(ang) * 0.45);
                    br.rotation.z = -Math.cos(ang) * 0.65;
                    br.rotation.x = Math.sin(ang) * 0.65;
                    crown.add(br);

                    const cl = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95 + rng() * 0.35, 1), leafMat);
                    cl.position.set(Math.cos(ang) * 0.95, 0.95 + rng() * 0.4, Math.sin(ang) * 0.95);
                    cl.scale.set(1.15, 0.82, 1.15);
                    cl.castShadow = true;
                    cl.receiveShadow = true;
                    crown.add(cl);
                }
                const topCanopy = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 1), leafMat);
                topCanopy.position.y = 1.65;
                topCanopy.scale.set(1.2, 0.88, 1.2);
                topCanopy.castShadow = true;
                crown.add(topCanopy);

                tree.add(crown);
                scene.add(tree);
                this._swayTrees.push({ crown, phase: i * 1.3 });
            }
        }
    }

    BO.MapDetail = new MapDetailBuilder();
})(window);
