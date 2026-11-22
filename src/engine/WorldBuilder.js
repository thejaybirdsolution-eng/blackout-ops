/* ============================================================================
   BLACKOUT OPS — 3D World Builder, Physics/Collision, LOS & A* Pathfinding
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    class WorldBuilder {
        constructor() {
            this.scene = null;
            this.mapData = null;
            this.colliders = []; // { minX, maxX, minY, maxY, minZ, maxZ, doorId? }
            this.ramps = [];
            this.worldMeshes = [];
            this.interactives = []; // doors, perks, wallbuys, box, pap, power, windows, teleporter, armor, exfil
            this.powerLights = [];
            this.fireFlames = [];
            this.mysteryBoxObj = null;
            this.domFlagObjs = [];
            this.hardpointRing = null;
            this.exfilBeacon = null;
            this.teleporterRings = [];
            this.waypointMap = new Map();
            this.unlockedZones = new Set(['spawn']);
            this.powerOn = false;
            this.raycaster = new THREE.Raycaster();
        }

        build(mapId) {
            this.mapData = BO.MapsData.get(mapId);
            const scene = new THREE.Scene();
            this.scene = scene;

            this.colliders = [];
            this.ramps = this.mapData.ramps ? this.mapData.ramps.slice() : [];
            this.worldMeshes = [];
            this.interactives = [];
            this.powerLights = [];
            this.fireFlames = [];
            this.mysteryBoxObj = null;
            this.domFlagObjs = [];
            this.hardpointRing = null;
            this.exfilBeacon = null;
            this.teleporterRings = [];
            this.rotatingLandmarks = [];
            this.traps = [];
            this.elevators = [];
            this.defconSwitches = [];
            this.activeSkyDrops = [];
            this.derRieseBulbs = [];
            this.derRiesePapGate = null;
            this.derRieseBridge = null;
            this.kinoCurtains = null;
            this.ascensionRocket = null;
            this.ascensionPapGate = null;
            this.ascensionConsoleBulbs = [];
            this.fivePanicGate = null;
            this.nuketownSign = null;
            this.centrifugeHazards = [];
            this.unlockedZones = new Set(['spawn']);
            this.powerOn = false;

            this.clearVisualFilters();
            if (this.mapData.bwUntilPower) {
                const cv = document.getElementById('game-canvas');
                if (cv) cv.style.filter = 'grayscale(100%) contrast(1.18)';
            }

            const atm = this.mapData.atmosphere;
            scene.fog = new THREE.FogExp2(atm.fogColor, atm.fogDensity);
            scene.background = new THREE.Color(atm.skyBottom);

            // Procedural Sky Dome
            this._buildSkyDome(scene, atm);

            // Lighting
            const q = BO.Settings.getQualityPreset();
            const hemi = new THREE.HemisphereLight(atm.hemiSky, atm.hemiGround, atm.hemiIntensity);
            scene.add(hemi);

            const sun = new THREE.DirectionalLight(atm.sunColor, atm.sunIntensity);
            sun.position.set(atm.sunPos[0], atm.sunPos[1], atm.sunPos[2]);
            if (q.shadows) {
                sun.castShadow = true;
                sun.shadow.mapSize.width = q.shadowMapSize;
                sun.shadow.mapSize.height = q.shadowMapSize;
                sun.shadow.camera.near = 2;
                sun.shadow.camera.far = 120;
                const d = 36;
                sun.shadow.camera.left = -d;
                sun.shadow.camera.right = d;
                sun.shadow.camera.top = d;
                sun.shadow.camera.bottom = -d;
                sun.shadow.bias = -0.0005;
            }
            scene.add(sun);

            // Map Geometry (Boxes)
            for (let i = 0; i < this.mapData.boxes.length; i++) {
                const b = this.mapData.boxes[i];
                const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
                const mat = BO.Textures.getWorldMaterial(b.mat, Math.max(b.w, b.d), b.h);
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(b.x, b.y, b.z);
                mesh.receiveShadow = true;
                mesh.castShadow = b.h > 0.7;
                scene.add(mesh);
                this.worldMeshes.push(mesh);

                this.colliders.push({
                    minX: b.x - b.w * 0.5,
                    maxX: b.x + b.w * 0.5,
                    minY: b.y - b.h * 0.5,
                    maxY: b.y + b.h * 0.5,
                    minZ: b.z - b.d * 0.5,
                    maxZ: b.z + b.d * 0.5,
                    enemiesOnly: !!b.enemiesOnly,
                    active: true
                });
            }

            // Smooth Visual Ramps
            for (let i = 0; i < this.ramps.length; i++) {
                this._buildRampMesh(scene, this.ramps[i]);
            }

            // Map Point Lights & Fire Barrels
            if (this.mapData.lights) {
                for (let i = 0; i < this.mapData.lights.length; i++) {
                    const l = this.mapData.lights[i];
                    if (l.prop === 'fire_barrel') {
                        this._buildFireBarrel(scene, l);
                    } else {
                        this._buildLamp(scene, l, q.pointLights);
                    }
                }
            }

            // Mode-specific Props & Global Map Landmarks
            if (this.mapData.mode === 'zombies') {
                this._buildZombiesProps(scene);
            } else if (this.mapData.mode === 'mp') {
                this._buildMPProps(scene);
            }
            this._buildMapLandmarks(scene);

            // Build Waypoint Graph
            this.waypointMap.clear();
            if (this.mapData.waypoints) {
                for (let i = 0; i < this.mapData.waypoints.length; i++) {
                    const wp = this.mapData.waypoints[i];
                    this.waypointMap.set(wp.id, wp);
                }
            }

            BO.FX.attachScene(scene);
            return scene;
        }

        _buildSkyDome(scene, atm) {
            const c = document.createElement('canvas');
            c.width = 16;
            c.height = 128;
            const ctx = c.getContext('2d');
            const g = ctx.createLinearGradient(0, 0, 0, 128);
            const top = '#' + new THREE.Color(atm.skyTop).getHexString();
            const bot = '#' + new THREE.Color(atm.skyBottom).getHexString();
            g.addColorStop(0, top);
            g.addColorStop(0.55, bot);
            g.addColorStop(1, bot);
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 16, 128);

            const tex = new THREE.CanvasTexture(c);
            const sky = new THREE.Mesh(
                new THREE.SphereGeometry(360, 24, 16),
                new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false })
            );
            scene.add(sky);

            if (atm.moon) {
                const moon = new THREE.Mesh(
                    new THREE.CircleGeometry(14.0, 24),
                    new THREE.MeshBasicMaterial({ color: 0xff5544, fog: false })
                );
                moon.position.set(68, 118, -190);
                moon.lookAt(0, 0, 0);
                scene.add(moon);
            }
        }

        _buildRampMesh(scene, r) {
            const mat = BO.Textures.getWorldMaterial(r.mat || 'concrete', 4, 4);
            const dx = r.axis === 'x' ? (r.x2 - r.x1) : 0;
            const dz = r.axis === 'z' ? (r.z2 - r.z1) : 0;
            const run = Math.max(Math.abs(dx), Math.abs(dz));
            const rise = r.y2 - r.y1;
            const len = Math.hypot(run, rise);
            const angle = Math.atan2(rise, run);

            const w = r.axis === 'z' ? r.w : len;
            const d = r.axis === 'z' ? len : r.w;
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, d), mat);
            mesh.receiveShadow = true;
            mesh.castShadow = true;

            if (r.axis === 'z') {
                mesh.position.set(r.x, (r.y1 + r.y2) * 0.5 - 0.11, (r.z1 + r.z2) * 0.5);
                mesh.rotation.x = r.z2 < r.z1 ? angle : -angle;
            } else {
                mesh.position.set((r.x1 + r.x2) * 0.5, (r.y1 + r.y2) * 0.5 - 0.11, r.z);
                mesh.rotation.z = r.x2 > r.x1 ? angle : -angle;
            }
            scene.add(mesh);
            this.worldMeshes.push(mesh);
        }

        _buildLamp(scene, l, allowPoint) {
            const fixture = new THREE.Mesh(
                new THREE.BoxGeometry(0.65, 0.14, 0.26),
                new THREE.MeshBasicMaterial({ color: l.alwaysOn ? l.color : 0x333842 })
            );
            fixture.position.set(l.x, l.y, l.z);
            scene.add(fixture);

            let pt = null;
            if (allowPoint) {
                pt = new THREE.PointLight(l.color, l.alwaysOn ? l.intensity : 0.12, l.distance, 1.6);
                pt.position.set(l.x, l.y - 0.25, l.z);
                scene.add(pt);
            }
            if (!l.alwaysOn) {
                this.powerLights.push({ fixture, light: pt, color: l.color, intensity: l.intensity });
            }
        }

        _buildFireBarrel(scene, l) {
            const by = l.baseY || 0;
            const barrelMat = BO.Textures.getWorldMaterial('rusted_metal', 1, 1);
            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.95, 12), barrelMat);
            barrel.position.set(l.x, by + 0.48, l.z);
            barrel.castShadow = true;
            scene.add(barrel);
            this.worldMeshes.push(barrel);
            this.colliders.push({
                minX: l.x - 0.38, maxX: l.x + 0.38,
                minY: by, maxY: by + 0.96,
                minZ: l.z - 0.38, maxZ: l.z + 0.38,
                active: true
            });

            const flame = new THREE.Mesh(
                new THREE.ConeGeometry(0.28, 0.68, 8),
                new THREE.MeshBasicMaterial({ color: 0xff6b1a, transparent: true, opacity: 0.85 })
            );
            flame.position.set(l.x, by + 1.15, l.z);
            scene.add(flame);
            const light = new THREE.PointLight(0xff6b2b, l.intensity, l.distance, 1.6);
            light.position.set(l.x, by + 1.35, l.z);
            scene.add(light);
            this.fireFlames.push({ flame, light, baseInt: l.intensity });
        }

        clearVisualFilters() {
            const cv = document.getElementById('game-canvas');
            if (cv) cv.style.filter = '';
        }

        isInSlowZone(x, y, z) {
            if (!this.mapData || !Array.isArray(this.mapData.slowZones)) return false;
            const safe = this.mapData.boardwalkSafeZones;
            if (Array.isArray(safe)) {
                for (let i = 0; i < safe.length; i++) {
                    const b = safe[i];
                    if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) return false;
                }
            }
            for (let i = 0; i < this.mapData.slowZones.length; i++) {
                const sz = this.mapData.slowZones[i];
                if (y <= (sz.maxY ?? 0.35) && x >= sz.minX && x <= sz.maxX && z >= sz.minZ && z <= sz.maxZ) {
                    return true;
                }
            }
            return false;
        }

        _spawnPerkMachine(p) {
            const scene = this.scene;
            if (!scene) return null;
            const g = new THREE.Group();
            g.position.set(p.x, p.y, p.z);
            g.rotation.y = p.rotY || 0;

            const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1e26, roughness: 0.4, metalness: 0.65 });
            const body = new THREE.Mesh(new THREE.BoxGeometry(1.05, 2.25, 0.78), bodyMat);
            body.position.y = 1.125;
            body.castShadow = true;
            g.add(body);

            const signTex = BO.Textures.createPerkSignTexture(p.name, p.color);
            const sign = new THREE.Mesh(
                new THREE.PlaneGeometry(0.92, 0.65),
                new THREE.MeshBasicMaterial({ map: signTex })
            );
            sign.position.set(0, 1.72, 0.40);
            g.add(sign);

            const neon = new THREE.Mesh(
                new THREE.BoxGeometry(0.96, 0.14, 0.82),
                new THREE.MeshBasicMaterial({ color: p.color })
            );
            neon.position.y = 2.26;
            g.add(neon);

            const perkLight = new THREE.PointLight(p.color, 1.1, 6.5);
            perkLight.position.set(0, 1.8, 0.8);
            g.add(perkLight);

            scene.add(g);
            this.worldMeshes.push(body);
            this.colliders.push({
                minX: p.x - 0.55, maxX: p.x + 0.55,
                minY: p.y, maxY: p.y + 2.3,
                minZ: p.z - 0.55, maxZ: p.z + 0.55,
                active: true
            });

            const inter = {
                type: 'perk',
                id: p.id,
                data: p,
                x: p.x, y: p.y + 1.0, z: p.z,
                radius: 2.3,
                group: g
            };
            this.interactives.push(inter);
            return inter;
        }

        _spawnPaPMachine(pap) {
            const scene = this.scene;
            if (!scene || !pap) return null;
            const g = new THREE.Group();
            g.position.set(pap.x, pap.y, pap.z);
            g.rotation.y = pap.rotY || 0;

            const forge = new THREE.Mesh(
                new THREE.BoxGeometry(1.85, 2.35, 1.05),
                new THREE.MeshStandardMaterial({ color: 0x231936, roughness: 0.35, metalness: 0.8 })
            );
            forge.position.y = 1.175;
            forge.castShadow = true;
            g.add(forge);

            const signTex = BO.Textures.createPerkSignTexture('PACK-A-PUNCH', '#c084fc');
            const sign = new THREE.Mesh(
                new THREE.PlaneGeometry(1.5, 0.65),
                new THREE.MeshBasicMaterial({ map: signTex })
            );
            sign.position.set(0, 1.85, 0.54);
            g.add(sign);

            const slotGlow = new THREE.Mesh(
                new THREE.BoxGeometry(0.75, 0.24, 0.12),
                new THREE.MeshBasicMaterial({ color: 0xc084fc })
            );
            slotGlow.position.set(0, 1.1, 0.52);
            g.add(slotGlow);

            scene.add(g);
            this.worldMeshes.push(forge);
            this.colliders.push({
                minX: pap.x - 0.95, maxX: pap.x + 0.95,
                minY: pap.y, maxY: pap.y + 2.4,
                minZ: pap.z - 0.55, maxZ: pap.z + 0.55,
                active: true
            });

            const inter = {
                type: 'pack_a_punch',
                id: 'pack_a_punch',
                x: pap.x, y: pap.y + 1.1, z: pap.z,
                radius: 2.8,
                slotGlow,
                locked: !!pap.locked,
                lockReason: pap.lockReason || '',
                upgrading: false,
                timer: 0,
                heldWeapon: null
            };
            this.interactives.push(inter);
            return inter;
        }

        _buildSwitchMesh(x, y, z, rotY = 0, initialHex = 0x22c55e) {
            const g = new THREE.Group();
            g.position.set(x, y, z);
            g.rotation.y = rotY;
            const panel = new THREE.Mesh(
                new THREE.BoxGeometry(0.42, 0.62, 0.16),
                new THREE.MeshStandardMaterial({ color: 0x262c35, roughness: 0.5, metalness: 0.7 })
            );
            const lamp = new THREE.Mesh(
                new THREE.SphereGeometry(0.065, 8, 8),
                new THREE.MeshBasicMaterial({ color: initialHex })
            );
            lamp.position.set(0, 0.18, 0.10);
            const handle = new THREE.Mesh(
                new THREE.BoxGeometry(0.06, 0.26, 0.08),
                new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4, metalness: 0.6 })
            );
            handle.position.set(0.11, -0.02, 0.12);
            handle.rotation.x = -0.45;
            g.add(panel, lamp, handle);
            this.scene.add(g);
            return { group: g, lamp, handle };
        }

        _buildZombiesProps(scene) {
            // 1. Purchaseable Doors / Debris Gates (multi-floor Y aware!)
            for (const d of this.mapData.doors) {
                let mesh;
                if (d.style === 'couch_debris') {
                    mesh = new THREE.Group();
                    mesh.position.set(d.x, d.y, d.z);
                    const sofaMat = new THREE.MeshStandardMaterial({ color: 0x5c3a28, roughness: 0.88 });
                    const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x3b2618, roughness: 0.85 });
                    const frameMat = BO.Textures.getWorldMaterial('wood_plank', 1, 1);
                    const base = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.92, d.h * 0.38, Math.min(1.2, d.d * 1.4)), sofaMat);
                    base.position.y = -d.h * 0.25;
                    base.rotation.z = 0.08;
                    const back = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.88, d.h * 0.42, Math.min(0.65, d.d * 0.7)), sofaMat);
                    back.position.set(0.1, 0, -Math.min(0.3, d.d * 0.25));
                    back.rotation.x = -0.25;
                    const crate = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.45, d.h * 0.30, 0.48), darkWoodMat);
                    crate.position.set(-d.w * 0.22, -d.h * 0.34, 0.22);
                    const plank = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.98, 0.22, 0.24), frameMat);
                    plank.position.set(0, d.h * 0.18, 0.16);
                    plank.rotation.z = -0.18;
                    const plank2 = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.98, 0.20, 0.22), frameMat);
                    plank2.position.set(0, -d.h * 0.02, -0.12);
                    plank2.rotation.z = 0.14;
                    mesh.add(base, back, crate, plank, plank2);
                } else {
                    const mat = new THREE.MeshStandardMaterial({
                        color: d.requiresPower ? 0x3b2640 : 0x4b3b2c,
                        roughness: 0.72,
                        metalness: 0.55
                    });
                    mesh = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h, d.d), mat);
                    mesh.position.set(d.x, d.y, d.z);
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;

                    const stripe = new THREE.Mesh(
                        new THREE.BoxGeometry(d.w + 0.04, 0.24, d.d + 0.04),
                        new THREE.MeshBasicMaterial({ color: d.requiresPower ? 0xa855f7 : 0xf59e0b })
                    );
                    mesh.add(stripe);

                    // Cross-brace security bars & permanent doorway casing
                    const braceMat = new THREE.MeshStandardMaterial({ color: 0x1e242c, roughness: 0.45, metalness: 0.75 });
                    const spansX = d.w > d.d;
                    const barUpper = new THREE.Mesh(
                        new THREE.BoxGeometry(spansX ? d.w * 0.96 : d.w + 0.06, 0.12, spansX ? d.d + 0.06 : d.d * 0.96),
                        braceMat
                    );
                    barUpper.position.y = d.h * 0.28;
                    const barLower = barUpper.clone();
                    barLower.position.y = -d.h * 0.28;
                    mesh.add(barUpper, barLower);

                    if (d.h >= 2.5) {
                        const frameMat = new THREE.MeshStandardMaterial({ color: 0x262b33, roughness: 0.55, metalness: 0.65 });
                        const fGroup = new THREE.Group();
                        fGroup.position.set(d.x, d.y, d.z);
                        const jambT = 0.12;
                        const spanDepth = (spansX ? d.d : d.w) + 0.18;
                        const halfSpan = (spansX ? d.w : d.d) * 0.5;
                        for (const s of [-1, 1]) {
                            const j = new THREE.Mesh(
                                new THREE.BoxGeometry(spansX ? jambT : spanDepth, d.h + 0.1, spansX ? spanDepth : jambT),
                                frameMat
                            );
                            j.position.set(spansX ? s * halfSpan : 0, 0, spansX ? 0 : s * halfSpan);
                            fGroup.add(j);
                        }
                        const lintel = new THREE.Mesh(
                            new THREE.BoxGeometry(spansX ? d.w + 0.24 : spanDepth, 0.14, spansX ? spanDepth : d.d + 0.24),
                            frameMat
                        );
                        lintel.position.y = d.h * 0.5;
                        fGroup.add(lintel);
                        scene.add(fGroup);
                    }
                }

                scene.add(mesh);
                this.worldMeshes.push(mesh);

                const col = {
                    minX: d.x - d.w * 0.5, maxX: d.x + d.w * 0.5,
                    minY: d.y - d.h * 0.5, maxY: d.y + d.h * 0.5,
                    minZ: d.z - d.d * 0.5, maxZ: d.z + d.d * 0.5,
                    active: true,
                    doorId: d.id
                };
                this.colliders.push(col);

                this.interactives.push({
                    type: 'door',
                    id: d.id,
                    data: d,
                    x: d.x, y: d.y, z: d.z,
                    radius: 2.9,
                    mesh,
                    collider: col,
                    opened: false
                });
            }

            // 2. Barricaded Windows w/ 6 repairable wood planks each (multi-floor Y aware!)
            const plankMat = BO.Textures.getWorldMaterial('wood_plank', 1, 1);
            for (const w of this.mapData.windows) {
                const wy = w.y || 0;
                const plankMeshes = [];
                for (let i = 0; i < 6; i++) {
                    const pw = w.axis === 'z' ? (w.w - 0.1) : 0.12;
                    const pd = w.axis === 'z' ? 0.12 : (w.w - 0.1);
                    const pm = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.14, pd), plankMat);
                    const rowY = wy + 1.24 + (i % 3) * 0.42;
                    const offset = (i < 3 ? -0.14 : 0.14);
                    pm.position.set(
                        w.x + (w.axis === 'x' ? offset : 0),
                        rowY,
                        w.z + (w.axis === 'z' ? offset : 0)
                    );
                    pm.rotation.z = (i % 2 === 0 ? 0.08 : -0.07);
                    scene.add(pm);
                    plankMeshes.push(pm);
                }

                const colW = w.axis === 'z' ? w.w : 0.7;
                const colD = w.axis === 'z' ? 0.7 : w.w;
                this.colliders.push({
                    minX: w.x - colW * 0.5, maxX: w.x + colW * 0.5,
                    minY: wy, maxY: wy + 3.0,
                    minZ: w.z - colD * 0.5, maxZ: w.z + colD * 0.5,
                    active: true
                });

                this.interactives.push({
                    type: 'window',
                    id: w.id,
                    data: w,
                    x: w.inside[0], y: wy + 1.0, z: w.inside[2],
                    radius: 2.5,
                    planksRemaining: 6,
                    maxPlanks: 6,
                    plankMeshes
                });
            }

            // 3. Perk-a-Cola Machines (supports Randomized Perk Slots on Shi No Numa!)
            if (this.mapData.randomizePerks && Array.isArray(this.mapData.perkSlots)) {
                const templates = [
                    { id: 'juggernog', name: 'Juggernog', cost: 2500, color: '#ef4444', desc: '250 Max HP', requiresPower: false },
                    { id: 'speed_cola', name: 'Speed Cola', cost: 3000, color: '#22c55e', desc: '2x Reload Speed', requiresPower: false },
                    { id: 'double_tap', name: 'Double Tap 2.0', cost: 2000, color: '#f59e0b', desc: 'Double Bullets', requiresPower: false },
                    { id: 'quick_revive', name: 'Quick Revive', cost: 500, color: '#38bdf8', desc: 'Solo Self-Revive', requiresPower: false }
                ];
                for (let i = templates.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    const tmp = templates[i]; templates[i] = templates[j]; templates[j] = tmp;
                }
                this.mapData.perkSlots.forEach((slot, idx) => {
                    const t = templates[idx % templates.length];
                    this._spawnPerkMachine(Object.assign({}, t, {
                        x: slot.x, y: slot.y || 0, z: slot.z, rotY: slot.rotY || 0,
                        desc: `${t.desc} (${slot.zoneLabel || 'Hut'})`
                    }));
                });
            } else if (Array.isArray(this.mapData.perks)) {
                for (const p of this.mapData.perks) {
                    this._spawnPerkMachine(p);
                }
            }

            // 4. Chalk Wall Buys + Grenade Walls + Sniper Cabinets + Armor Station
            for (const wb of this.mapData.wallBuys) {
                const spec = BO.WeaponsData.get(wb.weaponId);
                const tex = BO.Textures.createChalkWallBuyTexture(spec.shortName, wb.cost);
                const sign = new THREE.Mesh(
                    new THREE.PlaneGeometry(1.45, 0.72),
                    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
                );
                sign.position.set(wb.x, wb.y, wb.z);
                sign.rotation.y = wb.rotY;
                scene.add(sign);

                this.interactives.push({
                    type: 'wall_buy',
                    id: 'wb_' + wb.weaponId,
                    data: wb,
                    x: wb.x, y: wb.y, z: wb.z,
                    radius: 2.5
                });
            }

            if (Array.isArray(this.mapData.grenadeWalls)) {
                for (const gw of this.mapData.grenadeWalls) {
                    const tex = BO.Textures.createChalkWallBuyTexture('FRAG GRENADES', gw.cost || 250);
                    const sign = new THREE.Mesh(
                        new THREE.PlaneGeometry(1.35, 0.68),
                        new THREE.MeshBasicMaterial({ map: tex, transparent: true })
                    );
                    sign.position.set(gw.x, gw.y, gw.z);
                    sign.rotation.y = gw.rotY || 0;
                    scene.add(sign);
                    this.interactives.push({
                        type: 'grenade_wall',
                        id: gw.id || 'grenade_wall',
                        data: gw,
                        cost: gw.cost || 250,
                        x: gw.x, y: gw.y, z: gw.z,
                        radius: 2.4
                    });
                }
            }

            if (Array.isArray(this.mapData.sniperCabinets)) {
                for (const sc of this.mapData.sniperCabinets) {
                    const cg = new THREE.Group();
                    cg.position.set(sc.x, sc.y, sc.z);
                    cg.rotation.y = sc.rotY || 0;
                    const body = new THREE.Mesh(
                        new THREE.BoxGeometry(1.5, 1.9, 0.36),
                        new THREE.MeshStandardMaterial({ color: 0x3b2618, roughness: 0.75 })
                    );
                    const gunBar = new THREE.Mesh(
                        new THREE.BoxGeometry(0.10, 1.15, 0.08),
                        new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.7 })
                    );
                    gunBar.position.set(0, 0, 0.14);
                    const doorPivot = new THREE.Group();
                    doorPivot.position.set(-0.72, 0, 0.20);
                    const glass = new THREE.Mesh(
                        new THREE.BoxGeometry(1.42, 1.78, 0.04),
                        new THREE.MeshStandardMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.38, roughness: 0.1 })
                    );
                    glass.position.set(0.71, 0, 0);
                    doorPivot.add(glass);
                    cg.add(body, gunBar, doorPivot);
                    scene.add(cg);

                    this.interactives.push({
                        type: 'sniper_cabinet',
                        id: sc.id || 'sniper_cabinet',
                        data: sc,
                        cost: sc.cost || 1500,
                        weaponId: sc.weaponId || 'm40a3_cod4',
                        doorPivot,
                        opened: false,
                        x: sc.x, y: sc.y, z: sc.z,
                        radius: 2.5
                    });
                }
            }

            if (this.mapData.armorWall) {
                const aw = this.mapData.armorWall;
                const tex = BO.Textures.createChalkWallBuyTexture('ARMOR PLATES', aw.cost);
                const sign = new THREE.Mesh(
                    new THREE.PlaneGeometry(1.45, 0.72),
                    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
                );
                sign.position.set(aw.x, aw.y, aw.z);
                sign.rotation.y = aw.rotY;
                scene.add(sign);

                this.interactives.push({
                    type: 'armor_wall',
                    id: 'armor_wall',
                    data: aw,
                    x: aw.x, y: aw.y, z: aw.z,
                    radius: 2.4
                });
            }

            // 5. Mystery Box Pads + Active Mystery Box Chest
            if (this.mapData.mysteryBoxPads && this.mapData.mysteryBoxPads.length > 0) {
                const pad = this.mapData.mysteryBoxPads[0];
                const boxGroup = new THREE.Group();
                boxGroup.position.set(pad.x, pad.y, pad.z);
                boxGroup.rotation.y = pad.rotY;

                const chest = new THREE.Mesh(
                    new THREE.BoxGeometry(1.75, 0.65, 0.85),
                    BO.Textures.getWorldMaterial('wood_crate', 2, 1)
                );
                chest.position.y = 0.325;
                chest.castShadow = true;
                boxGroup.add(chest);

                const lidPivot = new THREE.Group();
                lidPivot.position.set(0, 0.65, -0.42);
                const lid = new THREE.Mesh(
                    new THREE.BoxGeometry(1.78, 0.14, 0.88),
                    new THREE.MeshStandardMaterial({ color: 0x5c3c22, roughness: 0.7 })
                );
                lid.position.set(0, 0.07, 0.42);
                lidPivot.add(lid);
                boxGroup.add(lidPivot);

                const beacon = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.18, 0.35, 36, 12, 1, true),
                    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.28, side: THREE.DoubleSide })
                );
                beacon.position.y = 18;
                boxGroup.add(beacon);

                const previewAnchor = new THREE.Group();
                previewAnchor.position.set(0, 1.15, 0);
                boxGroup.add(previewAnchor);

                scene.add(boxGroup);

                const boxInteractive = {
                    type: 'mystery_box',
                    id: 'mystery_box',
                    padIndex: 0,
                    x: pad.x, y: pad.y + 0.6, z: pad.z,
                    radius: 2.5,
                    group: boxGroup,
                    lidPivot,
                    previewAnchor,
                    beacon,
                    state: 'idle',
                    rollTimer: 0,
                    readyTimer: 0,
                    rolledWeaponId: null,
                    previewMesh: null
                };
                this.mysteryBoxObj = boxInteractive;
                this.interactives.push(boxInteractive);
            }

            // 6. Power Switch + Subtle Wall Markings
            if (this.mapData.powerSwitch) {
                const ps = this.mapData.powerSwitch;
                const sw = this._buildSwitchMesh(ps.x, ps.y, ps.z, ps.rotY || 0, 0xef4444);
                this.interactives.push({
                    type: 'power_switch',
                    id: 'power_switch',
                    x: ps.x, y: ps.y, z: ps.z,
                    radius: 2.5,
                    indicator: sw.lamp,
                    lever: sw.handle,
                    activated: false
                });
            }
            this._buildPowerWallArrows(scene);

            // 7. Pack-a-Punch Forge Machine
            if (this.mapData.packAPunch) {
                this._spawnPaPMachine(this.mapData.packAPunch);
            }

            // 8. Traps (Electro-Shock, Flogger, Fire Trap, Auto-Turret, Zipline)
            if (Array.isArray(this.mapData.traps)) {
                for (const tr of this.mapData.traps) {
                    const baseY = tr.y || 0;
                    const sw = this._buildSwitchMesh(tr.switchX, baseY + 1.35, tr.switchZ, tr.switchRotY || 0, 0x22c55e);
                    const fxGroup = new THREE.Group();
                    fxGroup.position.set(tr.x, baseY, tr.z);
                    if (tr.kind === 'electro_shock') {
                        const boltMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.78 });
                        for (let i = 0; i < 4; i++) {
                            const bar = new THREE.Mesh(
                                new THREE.BoxGeometry(tr.axis === 'z' ? 3.2 : 0.10, 0.08, tr.axis === 'z' ? 0.10 : 3.2),
                                boltMat
                            );
                            bar.position.y = 0.65 + i * 0.55;
                            fxGroup.add(bar);
                        }
                        fxGroup.visible = false;
                    } else if (tr.kind === 'fire_trap') {
                        const fMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.72 });
                        for (let i = -2; i <= 2; i++) {
                            const cone = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.1, 8), fMat);
                            cone.position.set(tr.axis === 'z' ? i * 0.62 : 0, 1.05, tr.axis === 'z' ? 0 : i * 0.62);
                            fxGroup.add(cone);
                        }
                        fxGroup.visible = false;
                    } else if (tr.kind === 'auto_turret') {
                        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.38, 1.3, 8), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 }));
                        stand.position.y = 0.65;
                        const gunHead = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.95), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85 }));
                        gunHead.position.y = 1.38;
                        fxGroup.add(stand, gunHead);
                        fxGroup.visible = true;
                        fxGroup.userData.gunHead = gunHead;
                    } else if (tr.kind === 'zipline') {
                        const wireLen = Math.hypot((tr.destX - tr.x), (tr.destY - baseY), (tr.destZ - tr.z));
                        const wire = new THREE.Mesh(
                            new THREE.CylinderGeometry(0.03, 0.03, wireLen, 6),
                            new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85 })
                        );
                        wire.position.set((tr.destX - tr.x) * 0.5, (tr.destY - baseY) * 0.5 + 1.8, (tr.destZ - tr.z) * 0.5);
                        wire.lookAt(tr.destX, tr.destY + 1.8, tr.destZ);
                        wire.rotateX(Math.PI * 0.5);
                        fxGroup.add(wire);
                        fxGroup.visible = true;
                    }
                    scene.add(fxGroup);

                    const trapObj = {
                        id: tr.id,
                        kind: tr.kind,
                        label: tr.label || 'TRAP',
                        cost: tr.cost || 1000,
                        duration: tr.duration || 20,
                        cooldownDuration: tr.cooldown || 35,
                        requiresPower: tr.requiresPower !== false,
                        x: tr.x, y: baseY, z: tr.z,
                        radius: tr.radius || 2.6,
                        destX: tr.destX, destY: tr.destY, destZ: tr.destZ, destZone: tr.destZone,
                        activeTimer: 0,
                        cooldownTimer: 0,
                        fireAccum: 0,
                        lamp: sw.lamp,
                        handle: sw.handle,
                        fxGroup,
                        rotorRef: null
                    };
                    this.traps.push(trapObj);
                    this.interactives.push({
                        type: 'trap',
                        id: 'trap_' + tr.id,
                        trap: trapObj,
                        x: tr.switchX, y: baseY + 1.35, z: tr.switchZ,
                        radius: 2.5
                    });
                }
            }

            // 9. Teleporters & Link Pads
            const tpPads = [];
            if (this.mapData.teleporter) {
                tpPads.push(Object.assign({ cost: this.mapData.teleporter.cost }, this.mapData.teleporter.padA));
                tpPads.push(Object.assign({ cost: this.mapData.teleporter.cost }, this.mapData.teleporter.padB));
            }
            if (Array.isArray(this.mapData.teleporters)) {
                for (const p of this.mapData.teleporters) tpPads.push(p);
            }
            tpPads.forEach((pad, idx) => {
                const py = pad.y || 0;
                const ring = new THREE.Mesh(
                    new THREE.TorusGeometry(1.35, 0.12, 10, 28),
                    new THREE.MeshBasicMaterial({ color: pad.color || (idx % 2 === 0 ? 0x38bdf8 : 0xa855f7) })
                );
                ring.rotation.x = Math.PI * 0.5;
                ring.position.set(pad.x, py + 0.12, pad.z);
                scene.add(ring);
                this.teleporterRings.push(ring);

                this.interactives.push({
                    type: 'teleporter',
                    id: pad.id || ('teleporter_' + idx),
                    data: pad,
                    cost: pad.cost !== undefined ? pad.cost : 250,
                    x: pad.x, y: py + 0.8, z: pad.z,
                    radius: 2.4
                });
            });

            if (Array.isArray(this.mapData.linkPads)) {
                for (const lp of this.mapData.linkPads) {
                    const ring = new THREE.Mesh(
                        new THREE.TorusGeometry(1.55, 0.10, 8, 28),
                        new THREE.MeshBasicMaterial({ color: lp.color || 0x22c55e })
                    );
                    ring.rotation.x = Math.PI * 0.5;
                    ring.position.set(lp.x, (lp.y || 0) + 0.08, lp.z);
                    scene.add(ring);
                    this.teleporterRings.push(ring);
                    this.interactives.push({
                        type: lp.kind || 'mainframe_pad',
                        id: lp.id || 'link_pad',
                        data: lp,
                        x: lp.x, y: (lp.y || 0) + 0.8, z: lp.z,
                        radius: 2.5
                    });
                }
            }

            // 10. "Five" Rideable Multi-Floor Elevators & 4 Red DEFCON Switches
            if (Array.isArray(this.mapData.elevators)) {
                for (const el of this.mapData.elevators) {
                    const cabGroup = new THREE.Group();
                    const startY = el.startAtBottom ? el.bottomY : el.topY;
                    cabGroup.position.set(el.x, startY, el.z);
                    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.72, roughness: 0.38 });
                    const cabFloor = new THREE.Mesh(new THREE.BoxGeometry(el.w, 0.24, el.d), BO.Textures.getWorldMaterial('diamond_plate', 2, 2));
                    cabFloor.position.y = -0.12;
                    const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(el.w, 0.20, el.d), metalMat);
                    cabRoof.position.y = 3.1;
                    cabGroup.add(cabFloor, cabRoof);
                    // Side grate struts
                    for (let sx = -1; sx <= 1; sx += 2) {
                        for (let sz = -1; sz <= 1; sz += 2) {
                            const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.1, 0.16), metalMat);
                            post.position.set(sx * (el.w * 0.45), 1.55, sz * (el.d * 0.45));
                            cabGroup.add(post);
                        }
                    }
                    scene.add(cabGroup);

                    const floorCol = {
                        minX: el.x - el.w * 0.5, maxX: el.x + el.w * 0.5,
                        minY: startY - 0.30, maxY: startY,
                        minZ: el.z - el.d * 0.5, maxZ: el.z + el.d * 0.5,
                        active: true
                    };
                    this.colliders.push(floorCol);

                    const elevObj = {
                        id: el.id,
                        label: el.label,
                        x: el.x, z: el.z,
                        w: el.w, d: el.d,
                        bottomY: el.bottomY, topY: el.topY,
                        bottomZone: el.bottomZone, topZone: el.topZone,
                        cabY: startY,
                        targetY: startY,
                        moving: false,
                        cabGroup,
                        floorCollider: floorCol,
                        cost: el.cost !== undefined ? el.cost : 250
                    };
                    this.elevators.push(elevObj);

                    const rideInter = {
                        type: 'elevator_ride',
                        id: el.id + '_ride',
                        elevator: elevObj,
                        cost: elevObj.cost,
                        x: el.x, y: startY + 1.0, z: el.z,
                        radius: 2.2
                    };
                    elevObj.rideInteractive = rideInter;
                    this.interactives.push(rideInter);

                    // Top & Bottom call buttons
                    if (el.callTop) {
                        this.interactives.push({
                            type: 'elevator_call',
                            id: el.id + '_call_top',
                            elevator: elevObj,
                            callFloorY: el.topY,
                            x: el.callTop.x, y: el.topY + 1.2, z: el.callTop.z,
                            radius: 2.2
                        });
                    }
                    if (el.callBottom) {
                        this.interactives.push({
                            type: 'elevator_call',
                            id: el.id + '_call_bot',
                            elevator: elevObj,
                            callFloorY: el.bottomY,
                            x: el.callBottom.x, y: el.bottomY + 1.2, z: el.callBottom.z,
                            radius: 2.2
                        });
                    }
                }
            }

            if (Array.isArray(this.mapData.defconSwitches)) {
                this.mapData.defconSwitches.forEach((ds, idx) => {
                    const sw = this._buildSwitchMesh(ds.x, ds.y, ds.z, ds.rotY || 0, 0xef4444);
                    const swObj = {
                        index: idx,
                        activated: false,
                        lamp: sw.lamp,
                        handle: sw.handle
                    };
                    this.defconSwitches.push(swObj);
                    this.interactives.push({
                        type: 'defcon_switch',
                        id: ds.id || ('defcon_' + idx),
                        defconObj: swObj,
                        x: ds.x, y: ds.y, z: ds.z,
                        radius: 2.4
                    });
                });
            }

            // 11. Shi No Numa Telephone Easter Egg
            if (Array.isArray(this.mapData.telephones)) {
                for (const ph of this.mapData.telephones) {
                    const pg = new THREE.Group();
                    pg.position.set(ph.x, ph.y || 1.0, ph.z);
                    const base = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.28), new THREE.MeshStandardMaterial({ color: 0x1e1e1e, roughness: 0.5 }));
                    const handset = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.10), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 }));
                    handset.position.y = 0.16;
                    pg.add(base, handset);
                    scene.add(pg);
                    this.interactives.push({
                        type: 'telephone',
                        id: ph.id || 'phone_ee',
                        triggered: false,
                        x: ph.x, y: (ph.y || 1.0), z: ph.z,
                        radius: 2.2
                    });
                }
            }

            // 12. Ascension Lunar Landers & Soyuz Rocket Console
            if (Array.isArray(this.mapData.lunarLanders)) {
                for (const ll of this.mapData.lunarLanders) {
                    const py = ll.y || 0;
                    const lg = new THREE.Group();
                    lg.position.set(ll.x, py, ll.z);
                    const deck = new THREE.Mesh(
                        new THREE.CylinderGeometry(2.1, 2.3, 0.28, 12),
                        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 })
                    );
                    deck.position.y = 0.14;
                    const podRing = new THREE.Mesh(
                        new THREE.TorusGeometry(1.75, 0.10, 8, 24),
                        new THREE.MeshBasicMaterial({ color: ll.color || 0xf59e0b })
                    );
                    podRing.rotation.x = Math.PI * 0.5;
                    podRing.position.y = 0.30;
                    lg.add(deck, podRing);
                    scene.add(lg);
                    this.teleporterRings.push(podRing);

                    this.interactives.push({
                        type: 'lunar_lander',
                        id: 'lander_' + ll.code,
                        code: ll.code,
                        label: ll.label,
                        cost: ll.cost !== undefined ? ll.cost : 250,
                        data: ll,
                        x: ll.x, y: py + 0.9, z: ll.z,
                        radius: 2.5
                    });
                }
            }

            if (this.mapData.rocketLaunchConsole) {
                const rc = this.mapData.rocketLaunchConsole;
                const rg = new THREE.Group();
                rg.position.set(rc.x, rc.y, rc.z);
                rg.rotation.y = rc.rotY || 0;
                const box = new THREE.Mesh(
                    new THREE.BoxGeometry(1.1, 1.0, 0.45),
                    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.65, roughness: 0.45 })
                );
                rg.add(box);
                this.ascensionConsoleBulbs = [];
                for (let b = 0; b < 3; b++) {
                    const bulb = new THREE.Mesh(
                        new THREE.SphereGeometry(0.08, 8, 8),
                        new THREE.MeshBasicMaterial({ color: 0xef4444 })
                    );
                    bulb.position.set((b - 1) * 0.28, 0.24, 0.24);
                    rg.add(bulb);
                    this.ascensionConsoleBulbs.push(bulb);
                }
                const btn = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.10, 0.10, 0.08, 10),
                    new THREE.MeshBasicMaterial({ color: 0x22c55e })
                );
                btn.rotation.x = Math.PI * 0.5;
                btn.position.set(0, -0.14, 0.25);
                rg.add(btn);
                scene.add(rg);

                this.interactives.push({
                    type: 'rocket_launch',
                    id: 'rocket_launch',
                    x: rc.x, y: rc.y, z: rc.z,
                    radius: 2.5
                });
            }
        }

        _buildPowerWallArrows(scene) {
            const ps = this.mapData.powerSwitch;
            if (!ps) return;

            // Very small, subtle, barely-noticeable hand-scrawled "power ->" wall markings (only 1 or 2 per map)
            const signs = Array.isArray(this.mapData.powerSigns) ? this.mapData.powerSigns.slice(0, 2) : [];
            for (const s of signs) {
                const tex = BO.Textures.createPowerArrowTexture(s.dir || 'right');
                const mat = new THREE.MeshBasicMaterial({
                    map: tex,
                    transparent: true,
                    opacity: 0.42,
                    depthWrite: false,
                    side: THREE.DoubleSide,
                    polygonOffset: true,
                    polygonOffsetFactor: -2
                });
                const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.21), mat);
                mesh.position.set(s.x, s.y || 1.38, s.z);
                mesh.rotation.y = s.rotY || 0;
                scene.add(mesh);
            }
        }

        _buildMapLandmarks(scene) {
            if (Array.isArray(this.mapData.wallWritings)) {
                for (const w of this.mapData.wallWritings) {
                    const tex = BO.Textures.createWallWritingTexture(w.text, w.color || 'rgba(170, 24, 24, 0.88)', w.sub || '');
                    const mesh = new THREE.Mesh(
                        new THREE.PlaneGeometry(w.w || 1.6, w.h || 0.8),
                        new THREE.MeshBasicMaterial({
                            map: tex,
                            transparent: true,
                            depthWrite: false,
                            side: THREE.DoubleSide,
                            polygonOffset: true,
                            polygonOffsetFactor: -2
                        })
                    );
                    mesh.position.set(w.x, w.y || 1.7, w.z);
                    mesh.rotation.y = w.rotY || 0;
                    scene.add(mesh);
                }
            }

            if (!Array.isArray(this.mapData.landmarks)) return;
            for (const lm of this.mapData.landmarks) {
                if (lm.kind === 'hanging_paratrooper') {
                    // Shi No Numa Central Hut Hanging Paratrooper
                    const g = new THREE.Group();
                    g.position.set(lm.x, lm.y || 2.2, lm.z);
                    const ropeMat = new THREE.MeshBasicMaterial({ color: 0xd6d3d1 });
                    for (let r = -1; r <= 1; r += 2) {
                        const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.8, 6), ropeMat);
                        rope.position.set(r * 0.18, 0.9, 0);
                        g.add(rope);
                    }
                    const uniformMat = new THREE.MeshStandardMaterial({ color: 0x3f4d34, roughness: 0.85 });
                    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.65, 0.24), uniformMat);
                    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), new THREE.MeshStandardMaterial({ color: 0x6b7280 }));
                    head.position.y = -0.45;
                    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.72, 0.20), uniformMat);
                    legs.position.y = 0.68;
                    g.add(torso, head, legs);
                    scene.add(g);
                } else if (lm.kind === 'flogger') {
                    // Shi No Numa Spinning Spiked Flogger Trap Beam
                    const g = new THREE.Group();
                    g.position.set(lm.x, lm.y || 2.8, lm.z);
                    const woodMat = BO.Textures.getWorldMaterial('wood_plank', 1, 1);
                    const postL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.4, 0.35), woodMat);
                    postL.position.set(-2.1, -1.1, 0);
                    const postR = postL.clone();
                    postR.position.x = 2.1;
                    const rotor = new THREE.Group();
                    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 3.8, 12), woodMat);
                    drum.rotation.z = Math.PI * 0.5;
                    rotor.add(drum);
                    const spikeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
                    for (let i = 0; i < 8; i++) {
                        const ang = (i / 8) * Math.PI * 2;
                        const blade = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 0.75), spikeMat);
                        blade.rotation.x = ang;
                        rotor.add(blade);
                    }
                    g.add(postL, postR, rotor);
                    scene.add(g);
                    const flTrap = this.traps.find((t) => t.kind === 'flogger');
                    if (flTrap) {
                        flTrap.rotorRef = rotor;
                    } else {
                        this.rotatingLandmarks.push({ mesh: rotor, axis: 'x', speed: 2.8 });
                    }
                } else if (lm.kind === 'centrifuge_arm') {
                    // Ascension Central Centrifuge Rotating Beam (Crouch-safe at y ~ 1.38!)
                    const g = new THREE.Group();
                    g.position.set(lm.x, lm.y || 1.38, lm.z);
                    const steelMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.75, roughness: 0.35 });
                    const hazardMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
                    const arm = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.28, 0.34), steelMat);
                    const podL = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.85, 12), hazardMat);
                    podL.position.x = -3.4;
                    const podR = podL.clone();
                    podR.position.x = 3.4;
                    g.add(arm, podL, podR);
                    scene.add(g);
                    this.rotatingLandmarks.push({ mesh: g, axis: 'y', speed: 1.05 });
                    this.centrifugeHazards.push({ x: lm.x, y: lm.y || 1.38, z: lm.z, radius: 3.7, group: g });
                } else if (lm.kind === 'soyuz_rocket') {
                    // Ascension Towering Multi-Stage Soyuz Rocket + Gantry + PaP Blast Door
                    const g = new THREE.Group();
                    g.position.set(lm.x, lm.y || 0, lm.z);
                    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.5 });
                    const darkMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.7 });
                    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.4 });
                    const core = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.4, 16, 16), whiteMat);
                    core.position.y = 8;
                    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.15, 4.2, 16), orangeMat);
                    nose.position.y = 18.1;
                    const exhaust = new THREE.Mesh(
                        new THREE.ConeGeometry(1.6, 5.0, 12),
                        new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.88 })
                    );
                    exhaust.rotation.x = Math.PI;
                    exhaust.position.y = -2.2;
                    exhaust.visible = false;
                    g.add(core, nose, exhaust);
                    for (let b = 0; b < 4; b++) {
                        const ang = (b / 4) * Math.PI * 2;
                        const booster = new THREE.Mesh(new THREE.ConeGeometry(0.75, 6.5, 12), darkMat);
                        booster.position.set(Math.cos(ang) * 1.55, 3.25, Math.sin(ang) * 1.55);
                        g.add(booster);
                    }
                    scene.add(g);
                    this.ascensionRocket = {
                        group: g,
                        exhaust,
                        baseX: lm.x, baseY: lm.y || 0, baseZ: lm.z,
                        y: lm.y || 0,
                        launched: false,
                        exploded: false
                    };
                    if (lm.papGate) {
                        const pg = lm.papGate;
                        const gateMat = new THREE.MeshStandardMaterial({ color: 0x262f3b, metalness: 0.8, roughness: 0.35 });
                        const gateMesh = new THREE.Mesh(new THREE.BoxGeometry(pg.w, pg.h, pg.d), gateMat);
                        gateMesh.position.set(pg.x, pg.y, pg.z);
                        scene.add(gateMesh);
                        const gateCol = {
                            minX: pg.x - pg.w * 0.5, maxX: pg.x + pg.w * 0.5,
                            minY: pg.y - pg.h * 0.5, maxY: pg.y + pg.h * 0.5,
                            minZ: pg.z - pg.d * 0.5, maxZ: pg.z + pg.d * 0.5,
                            active: true
                        };
                        this.colliders.push(gateCol);
                        this.ascensionPapGate = {
                            mesh: gateMesh, collider: gateCol,
                            closedY: pg.y, openY: pg.y + pg.h + 0.6, targetOpen: false
                        };
                    }
                } else if (lm.kind === 'stage_curtains') {
                    // Kino der Toten Crimson Velvet Stage Curtains (Start CLOSED until Power!)
                    const baseY = lm.y || 0.45;
                    const velvetMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.9 });
                    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.7 });
                    const curtainL = new THREE.Mesh(new THREE.BoxGeometry(6.8, 5.2, 0.35), velvetMat);
                    curtainL.position.set(lm.x - 3.4, baseY + 2.55, lm.z);
                    const curtainR = new THREE.Mesh(new THREE.BoxGeometry(6.8, 5.2, 0.35), velvetMat);
                    curtainR.position.set(lm.x + 3.4, baseY + 2.55, lm.z);
                    const valance = new THREE.Mesh(new THREE.BoxGeometry(19.6, 0.95, 0.42), velvetMat);
                    valance.position.set(lm.x, baseY + 4.75, lm.z);
                    const trim = new THREE.Mesh(new THREE.BoxGeometry(19.8, 0.14, 0.46), goldMat);
                    trim.position.set(lm.x, baseY + 4.25, lm.z);
                    scene.add(curtainL, curtainR, valance, trim);
                    const curtainCol = {
                        minX: lm.x - 6.8, maxX: lm.x + 6.8,
                        minY: baseY, maxY: baseY + 5.2,
                        minZ: lm.z - 0.22, maxZ: lm.z + 0.22,
                        active: true
                    };
                    this.colliders.push(curtainCol);
                    this.kinoCurtains = {
                        left: curtainL, right: curtainR,
                        collider: curtainCol,
                        baseX: lm.x, openFrac: 0, targetOpen: false
                    };
                } else if (lm.kind === 'der_riese_pap_cage') {
                    // Der Riese Mainframe Pack-a-Punch Steel Shutter + 3 Red->Green Teleporter Bulbs
                    const shutterMat = new THREE.MeshStandardMaterial({ color: 0x262c34, metalness: 0.78, roughness: 0.35 });
                    const shutter = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.8, 0.25), shutterMat);
                    shutter.position.set(lm.x, lm.y || 1.4, lm.z);
                    scene.add(shutter);
                    const col = {
                        minX: lm.x - 1.3, maxX: lm.x + 1.3,
                        minY: 0, maxY: 2.8,
                        minZ: lm.z - 0.15, maxZ: lm.z + 0.15,
                        active: true
                    };
                    this.colliders.push(col);
                    this.derRiesePapGate = {
                        mesh: shutter, collider: col,
                        closedY: lm.y || 1.4, openY: (lm.y || 1.4) + 2.9, targetOpen: false
                    };
                    this.derRieseBulbs = [];
                    for (let i = 0; i < 3; i++) {
                        const bulb = new THREE.Mesh(
                            new THREE.SphereGeometry(0.14, 10, 10),
                            new THREE.MeshBasicMaterial({ color: 0xef4444 })
                        );
                        bulb.position.set(lm.x + (i - 1) * 0.75, (lm.y || 1.4) + 1.75, lm.z + 0.22);
                        scene.add(bulb);
                        this.derRieseBulbs.push(bulb);
                    }
                } else if (lm.kind === 'der_riese_bridge') {
                    // Der Riese Suspended Shortcut Bridge (Lowers on Power Switch!)
                    const pivot = new THREE.Group();
                    pivot.position.set(lm.x, lm.y || 0.08, lm.z);
                    const deck = new THREE.Mesh(
                        new THREE.BoxGeometry(lm.w || 4.6, 0.22, lm.d || 3.4),
                        BO.Textures.getWorldMaterial('diamond_plate', 2, 2)
                    );
                    deck.position.z = (lm.d || 3.4) * 0.5;
                    pivot.add(deck);
                    pivot.rotation.x = -Math.PI * 0.48; // Upright blocking shortcut initially
                    scene.add(pivot);

                    const blockCol = {
                        minX: lm.x - (lm.w || 4.6) * 0.5, maxX: lm.x + (lm.w || 4.6) * 0.5,
                        minY: 0, maxY: 3.4,
                        minZ: lm.z - 0.35, maxZ: lm.z + 0.35,
                        active: true
                    };
                    this.colliders.push(blockCol);
                    this.derRieseBridge = {
                        pivot, blockCollider: blockCol,
                        loweredFrac: 0, targetLowered: false
                    };
                } else if (lm.kind === 'five_panic_door') {
                    // "Five" Sealed DEFCON 5 Panic Room Blast Door
                    const gateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 });
                    const mesh = new THREE.Mesh(new THREE.BoxGeometry(lm.w || 3.8, lm.h || 3.2, lm.d || 0.45), gateMat);
                    mesh.position.set(lm.x, lm.y || 7.6, lm.z);
                    scene.add(mesh);
                    const col = {
                        minX: lm.x - (lm.w || 3.8) * 0.5, maxX: lm.x + (lm.w || 3.8) * 0.5,
                        minY: (lm.y || 7.6) - (lm.h || 3.2) * 0.5, maxY: (lm.y || 7.6) + (lm.h || 3.2) * 0.5,
                        minZ: lm.z - (lm.d || 0.45) * 0.5, maxZ: lm.z + (lm.d || 0.45) * 0.5,
                        active: true
                    };
                    this.colliders.push(col);
                    this.fivePanicGate = {
                        mesh, collider: col,
                        closedY: lm.y || 7.6, openY: (lm.y || 7.6) + (lm.h || 3.2) + 0.3, targetOpen: false
                    };
                } else if (lm.kind === 'nuketown_sign') {
                    // Nuketown Electronic Live Population Signboard (Counts down from 99!)
                    const tex = BO.Textures.createNuketownSignTexture(99);
                    const signMesh = new THREE.Mesh(
                        new THREE.PlaneGeometry(lm.w || 4.4, lm.h || 2.2),
                        new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
                    );
                    signMesh.position.set(lm.x, lm.y || 2.3, lm.z);
                    signMesh.rotation.y = lm.rotY || 0;
                    scene.add(signMesh);
                    this.nuketownSign = { mesh: signMesh, tex };
                } else if (lm.kind === 'nuketown_bus') {
                    // Walk-through 1950s Nuketown Teal School Bus Shell
                    const bx = lm.x, by = lm.y || 0, bz = lm.z;
                    const bg = new THREE.Group();
                    bg.position.set(bx, by, bz);
                    const busMat = BO.Textures.getWorldMaterial('bus_teal', 4, 2);
                    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.6 });
                    const floor = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.28, 9.6), BO.Textures.getWorldMaterial('diamond_plate', 2, 4));
                    floor.position.y = 0.14;
                    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.24, 9.8), busMat);
                    roof.position.y = 2.65;
                    const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.35, 9.6), busMat);
                    sideL.position.set(-1.35, 1.4, 0);
                    const sideR1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.35, 3.4), busMat);
                    sideR1.position.set(1.35, 1.4, -3.1);
                    const sideR2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.35, 3.4), busMat);
                    sideR2.position.set(1.35, 1.4, 3.1);
                    const nose = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.5, 1.4), glassMat);
                    nose.position.set(0, 0.9, -4.4);
                    bg.add(floor, roof, sideL, sideR1, sideR2, nose);
                    scene.add(bg);
                    this.worldMeshes.push(floor, roof, sideL, sideR1, sideR2, nose);
                    this.colliders.push(
                        { minX: bx - 1.4, maxX: bx + 1.4, minY: by, maxY: by + 0.28, minZ: bz - 4.8, maxZ: bz + 4.8, active: true },
                        { minX: bx - 1.45, maxX: bx + 1.45, minY: by + 2.53, maxY: by + 2.77, minZ: bz - 4.9, maxZ: bz + 4.9, active: true },
                        { minX: bx - 1.44, maxX: bx - 1.26, minY: by + 0.25, maxY: by + 2.58, minZ: bz - 4.8, maxZ: bz + 4.8, active: true },
                        { minX: bx + 1.26, maxX: bx + 1.44, minY: by + 0.25, maxY: by + 2.58, minZ: bz - 4.8, maxZ: bz - 1.4, active: true },
                        { minX: bx + 1.26, maxX: bx + 1.44, minY: by + 0.25, maxY: by + 2.58, minZ: bz + 1.4, maxZ: bz + 4.8, active: true },
                        { minX: bx - 1.35, maxX: bx + 1.35, minY: by + 0.15, maxY: by + 1.65, minZ: bz - 5.1, maxZ: bz - 3.7, active: true }
                    );
                } else if (lm.kind === 'crash_plane_wing') {
                    // Nacht der Untoten Airfield Crashed German Bomber Wing Outside
                    const wing = new THREE.Mesh(
                        new THREE.BoxGeometry(7.5, 0.28, 2.2),
                        BO.Textures.getWorldMaterial('rusted_metal', 3, 1)
                    );
                    wing.position.set(lm.x, lm.y || 1.2, lm.z);
                    wing.rotation.set(0.18, 0.42, -0.32);
                    scene.add(wing);
                } else if (lm.kind === 'stage_curtains_static') {
                    // Optional helper
                } else if (lm.kind === 'nuketown_mushroom_cloud') {
                    // Nuketown Horizon Atomic Mushroom Cloud
                    const g = new THREE.Group();
                    g.position.set(lm.x, lm.y || 0, lm.z);
                    const stemMat = new THREE.MeshBasicMaterial({ color: 0x9a3412, fog: false });
                    const capMat = new THREE.MeshBasicMaterial({ color: 0xf97316, fog: false });
                    const glowMat = new THREE.MeshBasicMaterial({ color: 0xfde047, fog: false });
                    const stem = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 6.5, 28, 14), stemMat);
                    stem.position.y = 14;
                    const cap = new THREE.Mesh(new THREE.SphereGeometry(12.5, 16, 12), capMat);
                    cap.scale.set(1.4, 0.65, 1.4);
                    cap.position.y = 28;
                    const ring = new THREE.Mesh(new THREE.TorusGeometry(9.5, 1.6, 10, 24), glowMat);
                    ring.rotation.x = Math.PI * 0.5;
                    ring.position.y = 20;
                    g.add(stem, cap, ring);
                    scene.add(g);
                } else if (lm.kind === 'nuketown_sign_bo1') {
                    // Black Ops 1 Sunny Rainbow Nuketown Welcome Sign
                    const c = document.createElement('canvas');
                    c.width = 512; c.height = 256;
                    const ctx = c.getContext('2d');
                    ctx.fillStyle = '#0ea5e9';
                    ctx.fillRect(0, 0, 512, 256);
                    ctx.fillStyle = '#fef08a';
                    ctx.fillRect(10, 10, 492, 236);
                    ctx.fillStyle = '#1e293b';
                    ctx.fillRect(18, 18, 476, 220);
                    ctx.fillStyle = '#ef4444';
                    ctx.fillRect(18, 18, 476, 16);
                    ctx.fillStyle = '#facc15';
                    ctx.font = 'bold 42px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('NUKETOWN', 256, 86);
                    ctx.fillStyle = '#f8fafc';
                    ctx.font = 'bold 26px sans-serif';
                    ctx.fillText('WELCOME TO OUR ATOMIC HOME', 256, 132);
                    ctx.fillStyle = '#38bdf8';
                    ctx.font = 'bold 34px monospace';
                    ctx.fillText('POPULATION: 28', 256, 190);
                    const tex = new THREE.CanvasTexture(c);
                    const board = new THREE.Mesh(
                        new THREE.PlaneGeometry(lm.w || 4.4, lm.h || 2.2),
                        new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
                    );
                    board.position.set(lm.x, lm.y || 2.3, lm.z);
                    board.rotation.y = lm.rotY || 0;
                    scene.add(board);
                } else if (lm.kind === 'nuketown_mannequin') {
                    // Classic 1950s Nuketown Test Mannequin Figure
                    const g = new THREE.Group();
                    g.position.set(lm.x, lm.y || 0, lm.z);
                    g.rotation.y = lm.rotY || 0;
                    const dressCol = lm.color || 0xe2d5c3;
                    const skinM = new THREE.MeshStandardMaterial({ color: 0xe7d6c4, roughness: 0.55 });
                    const suitM = new THREE.MeshStandardMaterial({ color: dressCol, roughness: 0.7 });
                    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 0.08, 12), skinM);
                    base.position.y = 0.04;
                    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.78, 0.18), suitM);
                    legs.position.y = 0.45;
                    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.58, 0.22), suitM);
                    torso.position.y = 1.12;
                    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), skinM);
                    head.position.y = 1.56;
                    g.add(base, legs, torso, head);
                    scene.add(g);
                } else if (lm.kind === 'terminal_plane_wings') {
                    // MW2 Terminal 747 Jetliner Swept Wings, 4 Engines & Tail Stabilizer
                    const g = new THREE.Group();
                    g.position.set(lm.x, lm.y || 1.6, lm.z);
                    const wingMat = BO.Textures.getWorldMaterial('plane_hull', 6, 3);
                    const engMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
                    const wingGeo = new THREE.BoxGeometry(11.5, 0.28, 5.2);
                    const wingL = new THREE.Mesh(wingGeo, wingMat);
                    wingL.position.set(-9.5, 0.15, 0);
                    wingL.rotation.y = 0.25;
                    const wingR = new THREE.Mesh(wingGeo, wingMat);
                    wingR.position.set(9.5, 0.15, 0);
                    wingR.rotation.y = -0.25;
                    g.add(wingL, wingR);
                    for (const ex of [-11.5, -6.5, 6.5, 11.5]) {
                        const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.55, 2.4, 14), engMat);
                        eng.rotation.x = Math.PI * 0.5;
                        eng.position.set(ex, -0.55, -0.4);
                        g.add(eng);
                    }
                    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.32, 4.8, 3.6), BO.Textures.getWorldMaterial('burger_red', 2, 2));
                    tailFin.position.set(0, 4.4, 13.5);
                    g.add(tailFin);
                    scene.add(g);
                } else if (lm.kind === 'terminal_burger_sign' || lm.kind === 'terminal_departures') {
                    const c = document.createElement('canvas');
                    c.width = 512; c.height = 160;
                    const ctx = c.getContext('2d');
                    if (lm.kind === 'terminal_burger_sign') {
                        ctx.fillStyle = '#7f1d1d'; ctx.fillRect(0, 0, 512, 160);
                        ctx.strokeStyle = '#facc15'; ctx.lineWidth = 10; ctx.strokeRect(8, 8, 496, 144);
                        ctx.fillStyle = '#fde047'; ctx.font = 'bold 56px sans-serif'; ctx.textAlign = 'center';
                        ctx.fillText('BURGER TOWN', 256, 98);
                    } else {
                        ctx.fillStyle = '#090d16'; ctx.fillRect(0, 0, 512, 160);
                        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 6; ctx.strokeRect(6, 6, 500, 148);
                        ctx.fillStyle = '#fde047'; ctx.font = 'bold 28px monospace'; ctx.textAlign = 'center';
                        ctx.fillText('ZAKHAEV INTL • DEPARTURES', 256, 48);
                        ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 20px monospace';
                        ctx.fillText('FLIGHT 418 • GATE B2 • BOARDING', 256, 95);
                        ctx.fillStyle = '#ef4444'; ctx.fillText('STATUS: LOCKDOWN SECTOR', 256, 130);
                    }
                    const tex = new THREE.CanvasTexture(c);
                    const m = new THREE.Mesh(new THREE.PlaneGeometry(lm.w || 5.2, lm.h || 1.7), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
                    m.position.set(lm.x, lm.y || 3.4, lm.z);
                    m.rotation.y = lm.rotY || 0;
                    scene.add(m);
                } else if (lm.kind === 'rust_derrick_spire') {
                    // MW2 Rust Iconic High Steel Oil Derrick Spire Crown & Crane Boom
                    const g = new THREE.Group();
                    g.position.set(lm.x, lm.y || 8.2, lm.z);
                    const sMat = new THREE.MeshStandardMaterial({ color: 0x7c4529, metalness: 0.65, roughness: 0.55 });
                    for (const [cx, cz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) {
                        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 9.0, 8), sMat);
                        beam.position.set(cx * 0.65, 4.4, cz * 0.65);
                        beam.rotation.z = cx > 0 ? 0.14 : -0.14;
                        beam.rotation.x = cz > 0 ? -0.14 : 0.14;
                        g.add(beam);
                    }
                    const crown = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 2.2), sMat);
                    crown.position.y = 8.9;
                    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.10, 4.5, 8), sMat);
                    mast.position.y = 11.2;
                    g.add(crown, mast);
                    scene.add(g);
                } else if (lm.kind === 'castle_banner') {
                    const g = new THREE.Group();
                    g.position.set(lm.x, lm.y || 3.5, lm.z);
                    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8), new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.8 }));
                    const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.8, 0.06), new THREE.MeshStandardMaterial({ color: lm.color || 0x1d4ed8, roughness: 0.85 }));
                    cloth.position.set(0, -0.3, 0.08);
                    g.add(pole, cloth);
                    scene.add(g);
                }
            }
        }

        // --- MAP QUEST & DYNAMIC INTERACTION HELPERS ---
        setDerRieseBulb(index, linked) {
            const b = this.derRieseBulbs[index];
            if (b) b.material.color.setHex(linked ? 0x22c55e : 0xef4444);
        }

        setDerRiesePapUnlocked(unlocked) {
            if (this.derRiesePapGate) this.derRiesePapGate.targetOpen = !!unlocked;
            const pap = this.interactives.find((i) => i.type === 'pack_a_punch');
            if (pap) {
                pap.locked = !unlocked;
                if (unlocked) pap.lockReason = '';
            }
        }

        setDefconSwitchState(swObj, active) {
            if (!swObj) return;
            swObj.activated = !!active;
            swObj.lamp.material.color.setHex(active ? 0x22c55e : 0xef4444);
            swObj.handle.rotation.x = active ? 0.55 : -0.45;
        }

        setFivePanicDoorOpen(open) {
            if (this.fivePanicGate) this.fivePanicGate.targetOpen = !!open;
        }

        setAscensionLanderBulb(index, active) {
            const b = this.ascensionConsoleBulbs[index];
            if (b) b.material.color.setHex(active ? 0x22c55e : 0xef4444);
        }

        launchAscensionRocket() {
            if (!this.ascensionRocket || this.ascensionRocket.launched) return;
            this.ascensionRocket.launched = true;
            this.ascensionRocket.exhaust.visible = true;
            if (this.ascensionPapGate) this.ascensionPapGate.targetOpen = true;
            const pap = this.interactives.find((i) => i.type === 'pack_a_punch');
            if (pap) {
                pap.locked = false;
                pap.lockReason = '';
            }
            BO.Sound.playRocketLaunch();
        }

        updateNuketownPopulation(popCount) {
            if (this.nuketownSign && this.nuketownSign.tex) {
                BO.Textures.updateNuketownSignTexture(this.nuketownSign.tex, popCount);
            }
        }

        launchSkyDrop(kind, spec, pad) {
            if (!this.scene || !pad) return;
            const g = new THREE.Group();
            const startY = 42.0;
            g.position.set(pad.x, startY, pad.z);

            const body = new THREE.Mesh(
                new THREE.BoxGeometry(1.15, 2.25, 0.85),
                new THREE.MeshStandardMaterial({ color: kind === 'pack_a_punch' ? 0x3b0764 : 0x1e293b, emissive: kind === 'pack_a_punch' ? 0x9333ea : 0x38bdf8, emissiveIntensity: 0.7 })
            );
            const flame = new THREE.Mesh(
                new THREE.ConeGeometry(1.1, 3.4, 10),
                new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.82 })
            );
            flame.position.y = 2.4;
            g.add(body, flame);
            this.scene.add(g);

            const targetBeacon = new THREE.Mesh(
                new THREE.RingGeometry(1.0, 1.35, 24),
                new THREE.MeshBasicMaterial({ color: 0xf97316, side: THREE.DoubleSide })
            );
            targetBeacon.rotation.x = -Math.PI * 0.5;
            targetBeacon.position.set(pad.x, (pad.y || 0) + 0.06, pad.z);
            this.scene.add(targetBeacon);

            this.activeSkyDrops.push({
                kind,
                spec,
                pad,
                mesh: g,
                beacon: targetBeacon,
                y: startY,
                speed: 22.0
            });
        }

        activateTrap(trapObj) {
            if (!trapObj || trapObj.activeTimer > 0 || trapObj.cooldownTimer > 0) return false;
            trapObj.activeTimer = trapObj.duration;
            trapObj.lamp.material.color.setHex(0xf97316);
            trapObj.handle.rotation.x = 0.65;
            if (trapObj.kind === 'electro_shock' || trapObj.kind === 'fire_trap') {
                trapObj.fxGroup.visible = true;
            }
            BO.Sound.playTrapZap();
            return true;
        }

        _buildMPProps(scene) {
            if (this.mapData.domFlags) {
                for (const f of this.mapData.domFlags) {
                    const g = new THREE.Group();
                    g.position.set(f.x, f.y, f.z);
                    const pole = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.05, 0.05, 3.2, 8),
                        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 })
                    );
                    pole.position.y = 1.6;
                    const banner = new THREE.Mesh(
                        new THREE.BoxGeometry(0.9, 0.55, 0.05),
                        new THREE.MeshBasicMaterial({ color: 0xf8fafc })
                    );
                    banner.position.set(0.45, 2.75, 0);
                    const ring = new THREE.Mesh(
                        new THREE.RingGeometry(2.6, 2.9, 28),
                        new THREE.MeshBasicMaterial({ color: 0xf8fafc, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
                    );
                    ring.rotation.x = -Math.PI * 0.5;
                    ring.position.y = 0.06;
                    g.add(pole, banner, ring);
                    scene.add(g);
                    this.domFlagObjs.push({ id: f.id, group: g, banner, ring });
                }
            }

            if (this.mapData.hardpoints) {
                const hp = this.mapData.hardpoints[0];
                const ring = new THREE.Mesh(
                    new THREE.RingGeometry(hp.r - 0.3, hp.r, 32),
                    new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide, transparent: true, opacity: 0.72 })
                );
                ring.rotation.x = -Math.PI * 0.5;
                ring.position.set(hp.x, hp.y + 0.08, hp.z);
                ring.visible = false;
                scene.add(ring);
                this.hardpointRing = ring;
            }
        }

        activatePower() {
            if (this.powerOn) return;
            this.powerOn = true;
            this.clearVisualFilters();
            for (const pl of this.powerLights) {
                pl.fixture.material.color.setHex(pl.color);
                if (pl.light) pl.light.intensity = pl.intensity;
            }
            for (const inter of this.interactives) {
                if (inter.type === 'power_switch') {
                    inter.activated = true;
                    inter.indicator.material.color.setHex(0x22c55e);
                    inter.lever.rotation.x = 0.65;
                } else if (inter.type === 'door' && inter.data.autoOpenOnPower && !inter.opened) {
                    this.openDoor(inter);
                }
            }
            if (this.derRieseBridge) {
                this.derRieseBridge.targetLowered = true;
                this.derRieseBridge.blockCollider.active = false;
                this.unlockedZones.add('power_ct');
            }
            if (this.kinoCurtains) {
                this.kinoCurtains.targetOpen = true;
                if (this.kinoCurtains.collider) this.kinoCurtains.collider.active = false;
            }
            BO.Sound.playPowerOn();
        }

        openDoor(doorInteractive) {
            if (!doorInteractive || doorInteractive.opened) return;
            doorInteractive.opened = true;
            doorInteractive.mesh.visible = false;
            doorInteractive.collider.active = false;
            const idx = this.worldMeshes.indexOf(doorInteractive.mesh);
            if (idx !== -1) this.worldMeshes.splice(idx, 1);

            this.unlockedZones.add(doorInteractive.data.fromZone);
            this.unlockedZones.add(doorInteractive.data.toZone);
            BO.Sound.playUIClick();
            BO.FX.spawnParticles(new THREE.Vector3(doorInteractive.x, doorInteractive.y, doorInteractive.z), 16, 0x8b6f47, 5, 10, 0.6, 1.8);
        }

        moveMysteryBox(padIndex) {
            const pads = this.mapData.mysteryBoxPads;
            if (!pads || !this.mysteryBoxObj) return;
            const p = pads[padIndex % pads.length];
            this.mysteryBoxObj.padIndex = padIndex % pads.length;
            this.mysteryBoxObj.x = p.x;
            this.mysteryBoxObj.y = p.y + 0.6;
            this.mysteryBoxObj.z = p.z;
            this.mysteryBoxObj.group.position.set(p.x, p.y, p.z);
            this.mysteryBoxObj.group.rotation.y = p.rotY;
        }

        spawnExfilBeacon(x, z) {
            if (!this.scene || this.exfilBeacon) return;
            const beacon = new THREE.Mesh(
                new THREE.CylinderGeometry(0.45, 1.8, 35, 16, 1, true),
                new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
            );
            beacon.position.set(x, 17.5, z);
            this.scene.add(beacon);
            this.exfilBeacon = beacon;
        }

        getGroundHeight(x, z, curY) {
            let maxFloor = -50;
            // Boxes below feet (allowing <= 0.55m step-up)
            for (let i = 0; i < this.colliders.length; i++) {
                const c = this.colliders[i];
                if (!c.active) continue;
                if (x >= c.minX - 0.15 && x <= c.maxX + 0.15 && z >= c.minZ - 0.15 && z <= c.maxZ + 0.15) {
                    if (c.maxY <= curY + 0.55 && c.maxY > maxFloor) {
                        maxFloor = c.maxY;
                    }
                }
            }
            // Smooth Ramps
            for (let i = 0; i < this.ramps.length; i++) {
                const r = this.ramps[i];
                if (r.axis === 'z') {
                    const minZ = Math.min(r.z1, r.z2);
                    const maxZ = Math.max(r.z1, r.z2);
                    if (x >= r.x - r.w * 0.5 - 0.1 && x <= r.x + r.w * 0.5 + 0.1 && z >= minZ - 0.15 && z <= maxZ + 0.15) {
                        const t = BO.Math.clamp((z - r.z1) / (r.z2 - r.z1), 0, 1);
                        const ry = BO.Math.lerp(r.y1, r.y2, t);
                        if (ry <= curY + 0.95 && ry > maxFloor) maxFloor = ry;
                    }
                } else {
                    const minX = Math.min(r.x1, r.x2);
                    const maxX = Math.max(r.x1, r.x2);
                    if (z >= r.z - r.w * 0.5 - 0.1 && z <= r.z + r.w * 0.5 + 0.1 && x >= minX - 0.15 && x <= maxX + 0.15) {
                        const t = BO.Math.clamp((x - r.x1) / (r.x2 - r.x1), 0, 1);
                        const ry = BO.Math.lerp(r.y1, r.y2, t);
                        if (ry <= curY + 0.95 && ry > maxFloor) maxFloor = ry;
                    }
                }
            }
            return maxFloor > -49 ? maxFloor : 0;
        }

        resolveCeiling(pos, prevY, radius, height) {
            let lowestCeiling = Infinity;
            const prevTop = prevY + height - 0.14;
            const curTop = pos.y + height;
            for (let i = 0; i < this.colliders.length; i++) {
                const c = this.colliders[i];
                if (!c.active) continue;
                if (pos.x < c.minX - radius || pos.x > c.maxX + radius || pos.z < c.minZ - radius || pos.z > c.maxZ + radius) {
                    continue;
                }
                if (c.minY >= prevTop && c.minY < curTop && c.minY < lowestCeiling) {
                    lowestCeiling = c.minY;
                }
            }
            if (lowestCeiling < Infinity) {
                pos.y = Math.min(pos.y, lowestCeiling - height - 0.02);
                return true;
            }
            return false;
        }

        resolveHorizontal(pos, radius, height, isPlayer = false) {
            const footStep = pos.y + 0.45;
            const topY = pos.y + height - 0.05;
            for (let pass = 0; pass < 2; pass++) {
                for (let i = 0; i < this.colliders.length; i++) {
                    const c = this.colliders[i];
                    if (!c.active) continue;
                    if (c.enemiesOnly && isPlayer) continue;
                    if (c.maxY <= footStep || c.minY >= topY) continue;

                    const closestX = BO.Math.clamp(pos.x, c.minX, c.maxX);
                    const closestZ = BO.Math.clamp(pos.z, c.minZ, c.maxZ);
                    const dx = pos.x - closestX;
                    const dz = pos.z - closestZ;
                    const distSq = dx * dx + dz * dz;

                    if (distSq < radius * radius) {
                        if (distSq > 0.00001) {
                            const dist = Math.sqrt(distSq);
                            const push = radius - dist;
                            pos.x += (dx / dist) * push;
                            pos.z += (dz / dist) * push;
                        } else {
                            // Inside AABB fallback: push out nearest edge
                            const penLeft = Math.abs(pos.x - c.minX);
                            const penRight = Math.abs(c.maxX - pos.x);
                            const penBack = Math.abs(pos.z - c.minZ);
                            const penFront = Math.abs(c.maxZ - pos.z);
                            const m = Math.min(penLeft, penRight, penBack, penFront);
                            if (m === penLeft) pos.x = c.minX - radius;
                            else if (m === penRight) pos.x = c.maxX + radius;
                            else if (m === penBack) pos.z = c.minZ - radius;
                            else pos.z = c.maxZ + radius;
                        }
                    }
                }
            }
        }

        hasLineOfSight(ax, ay, az, bx, by, bz) {
            const origin = new THREE.Vector3(ax, ay, az);
            const target = new THREE.Vector3(bx, by, bz);
            const dir = target.sub(origin);
            const dist = dir.length();
            if (dist < 0.1) return true;
            dir.divideScalar(dist);
            this.raycaster.set(origin, dir);
            this.raycaster.far = dist - 0.15;
            const hits = this.raycaster.intersectObjects(this.worldMeshes, false);
            return hits.length === 0;
        }

        raycastWorld(origin, dir, maxDist) {
            this.raycaster.set(origin, dir);
            this.raycaster.far = maxDist;
            const hits = this.raycaster.intersectObjects(this.worldMeshes, false);
            return hits.length > 0 ? hits[0] : null;
        }

        findNearestWaypoint(x, y, z, onlyUnlocked = false) {
            let best = null;
            let bestScore = Infinity;
            for (const wp of this.waypointMap.values()) {
                if (onlyUnlocked && wp.zone && !this.unlockedZones.has(wp.zone)) continue;
                const d = BO.Math.dist3D(x, y, z, wp.x, wp.y, wp.z);
                if (d < bestScore) {
                    bestScore = d;
                    best = wp;
                }
            }
            return best;
        }

        findPath(startX, startY, startZ, goalX, goalY, goalZ, respectZones = false) {
            const startWp = this.findNearestWaypoint(startX, startY, startZ, respectZones);
            const goalWp = this.findNearestWaypoint(goalX, goalY, goalZ, respectZones);
            if (!startWp || !goalWp) return [{ x: goalX, y: goalY, z: goalZ }];
            if (startWp.id === goalWp.id) return [{ x: goalX, y: goalY, z: goalZ }];

            const open = [startWp.id];
            const cameFrom = Object.create(null);
            const gScore = Object.create(null);
            const fScore = Object.create(null);
            gScore[startWp.id] = 0;
            fScore[startWp.id] = BO.Math.dist3D(startWp.x, startWp.y, startWp.z, goalWp.x, goalWp.y, goalWp.z);
            const closed = new Set();

            while (open.length > 0) {
                let bestIdx = 0;
                for (let i = 1; i < open.length; i++) {
                    if ((fScore[open[i]] ?? Infinity) < (fScore[open[bestIdx]] ?? Infinity)) bestIdx = i;
                }
                const currId = open.splice(bestIdx, 1)[0];
                if (currId === goalWp.id) {
                    const path = [{ x: goalX, y: goalY, z: goalZ }];
                    let c = currId;
                    while (c) {
                        const w = this.waypointMap.get(c);
                        if (w) path.unshift({ x: w.x, y: w.y, z: w.z });
                        c = cameFrom[c];
                    }
                    return path;
                }
                closed.add(currId);
                const curr = this.waypointMap.get(currId);
                if (!curr || !curr.links) continue;

                for (let i = 0; i < curr.links.length; i++) {
                    const nbId = curr.links[i];
                    if (closed.has(nbId)) continue;
                    const nb = this.waypointMap.get(nbId);
                    if (!nb) continue;
                    if (respectZones && nb.zone && !this.unlockedZones.has(nb.zone)) continue;

                    const tentativeG = (gScore[currId] ?? Infinity) + BO.Math.dist3D(curr.x, curr.y, curr.z, nb.x, nb.y, nb.z);
                    if (tentativeG < (gScore[nbId] ?? Infinity)) {
                        cameFrom[nbId] = currId;
                        gScore[nbId] = tentativeG;
                        fScore[nbId] = tentativeG + BO.Math.dist3D(nb.x, nb.y, nb.z, goalWp.x, goalWp.y, goalWp.z);
                        if (open.indexOf(nbId) === -1) open.push(nbId);
                    }
                }
            }
            return [{ x: goalX, y: goalY, z: goalZ }];
        }

        _animateGateSlide(gate, dt) {
            if (!gate) return;
            const want = gate.targetOpen ? gate.openY : gate.closedY;
            gate.mesh.position.y = BO.Math.damp(gate.mesh.position.y, want, 6, dt);
            const openEnough = Math.abs(gate.mesh.position.y - gate.openY) < 0.85;
            if (gate.collider) gate.collider.active = !(gate.targetOpen && openEnough);
        }

        updateAnimatedProps(dt, elapsed) {
            for (let i = 0; i < this.fireFlames.length; i++) {
                const ff = this.fireFlames[i];
                const flicker = 0.85 + Math.sin(elapsed * 14 + i) * 0.15 + Math.random() * 0.1;
                ff.flame.scale.set(0.9 + Math.sin(elapsed * 9) * 0.1, flicker, 0.9);
                ff.light.intensity = ff.baseInt * flicker;
            }
            for (let i = 0; i < this.teleporterRings.length; i++) {
                this.teleporterRings[i].rotation.z += dt * 1.4;
            }
            for (let i = 0; i < this.rotatingLandmarks.length; i++) {
                const rl = this.rotatingLandmarks[i];
                rl.mesh.rotation[rl.axis] += dt * rl.speed;
            }
            if (this.exfilBeacon) {
                this.exfilBeacon.rotation.y += dt * 1.2;
            }

            // Animate Flogger trap rotor spin + Electric/Fire FX flicker
            for (let i = 0; i < this.traps.length; i++) {
                const tr = this.traps[i];
                if (tr.rotorRef) {
                    const spd = tr.activeTimer > 0 ? 11.5 : 0.35;
                    tr.rotorRef.rotation.x += dt * spd;
                }
                if (tr.fxGroup && (tr.kind === 'electro_shock' || tr.kind === 'fire_trap')) {
                    tr.fxGroup.visible = tr.activeTimer > 0;
                    if (tr.activeTimer > 0 && tr.kind === 'fire_trap') {
                        tr.fxGroup.scale.y = 0.85 + Math.sin(elapsed * 22) * 0.18;
                    }
                }
            }

            // Animate Der Riese Suspended Bridge & Kino Velvet Stage Curtains
            if (this.derRieseBridge && this.derRieseBridge.targetLowered && this.derRieseBridge.loweredFrac < 1) {
                this.derRieseBridge.loweredFrac = Math.min(1, this.derRieseBridge.loweredFrac + dt * 0.9);
                this.derRieseBridge.pivot.rotation.x = BO.Math.lerp(-Math.PI * 0.48, 0, this.derRieseBridge.loweredFrac);
            }
            if (this.kinoCurtains && this.kinoCurtains.targetOpen && this.kinoCurtains.openFrac < 1) {
                this.kinoCurtains.openFrac = Math.min(1, this.kinoCurtains.openFrac + dt * 0.75);
                const f = this.kinoCurtains.openFrac;
                this.kinoCurtains.left.scale.x = BO.Math.lerp(1.0, 0.35, f);
                this.kinoCurtains.right.scale.x = BO.Math.lerp(1.0, 0.35, f);
                this.kinoCurtains.left.position.x = BO.Math.lerp(this.kinoCurtains.baseX - 3.4, this.kinoCurtains.baseX - 5.65, f);
                this.kinoCurtains.right.position.x = BO.Math.lerp(this.kinoCurtains.baseX + 3.4, this.kinoCurtains.baseX + 5.65, f);
                if (this.kinoCurtains.collider && f > 0.35) {
                    this.kinoCurtains.collider.active = false;
                }
            }

            // Animate Sliding PaP Gates (Der Riese, Ascension, "Five" Panic Room)
            this._animateGateSlide(this.derRiesePapGate, dt);
            this._animateGateSlide(this.ascensionPapGate, dt);
            this._animateGateSlide(this.fivePanicGate, dt);

            // Animate Ascension Launching Soyuz Rocket
            if (this.ascensionRocket && this.ascensionRocket.launched && !this.ascensionRocket.exploded) {
                if (this.ascensionRocket.y < 150) {
                    this.ascensionRocket.y += (9 + Math.min(26, this.ascensionRocket.y * 0.35)) * dt;
                    this.ascensionRocket.group.position.y = this.ascensionRocket.y;
                    this.ascensionRocket.exhaust.scale.y = 0.9 + Math.sin(elapsed * 30) * 0.25;
                } else {
                    this.ascensionRocket.group.visible = false;
                }
            }

            // Animate "Five" Vertical Rideable Elevators
            for (let i = 0; i < this.elevators.length; i++) {
                const el = this.elevators[i];
                if (!el.moving) continue;
                const diff = el.targetY - el.cabY;
                const step = Math.sign(diff) * Math.min(Math.abs(diff), dt * 3.4);
                el.cabY += step;
                el.cabGroup.position.y = el.cabY;
                el.floorCollider.minY = el.cabY - 0.30;
                el.floorCollider.maxY = el.cabY;
                if (el.rideInteractive) el.rideInteractive.y = el.cabY + 1.0;
                if (Math.abs(el.targetY - el.cabY) < 0.02) {
                    el.cabY = el.targetY;
                    el.cabGroup.position.y = el.cabY;
                    el.floorCollider.minY = el.cabY - 0.30;
                    el.floorCollider.maxY = el.cabY;
                    if (el.rideInteractive) el.rideInteractive.y = el.cabY + 1.0;
                    el.moving = false;
                    if (el.bottomZone) this.unlockedZones.add(el.bottomZone);
                    if (el.topZone) this.unlockedZones.add(el.topZone);
                }
            }

            // Animate Nuketown Falling Sky-Drop Meteors (spawn Perks & PaP upon crater touchdown!)
            for (let i = this.activeSkyDrops.length - 1; i >= 0; i--) {
                const sd = this.activeSkyDrops[i];
                sd.y -= sd.speed * dt;
                sd.mesh.position.y = sd.y;
                sd.mesh.rotation.y += dt * 4.0;
                const targetY = sd.pad.y || 0;
                if (sd.y <= targetY) {
                    this.scene.remove(sd.mesh);
                    this.scene.remove(sd.beacon);
                    BO.FX.spawnExplosion(new THREE.Vector3(sd.pad.x, targetY + 0.5, sd.pad.z), 4.5, 0xf97316);
                    BO.Sound.playExplosion(0.75);
                    if (sd.kind === 'pack_a_punch') {
                        this._spawnPaPMachine(Object.assign({ x: sd.pad.x, y: targetY, z: sd.pad.z, rotY: sd.pad.rotY || 0 }, sd.spec));
                        BO.Events.emit('hud:banner', { title: 'PACK-A-PUNCH HAS LANDED!', sub: `${sd.pad.label || 'CRATER PAD'} — READY TO UPGRADE`, color: '#c084fc' });
                    } else {
                        this._spawnPerkMachine(Object.assign({}, sd.spec, { x: sd.pad.x, y: targetY, z: sd.pad.z, rotY: sd.pad.rotY || 0 }));
                        BO.Events.emit('hud:banner', { title: `${sd.spec.name.toUpperCase()} DROPPED!`, sub: `LANDED AT ${sd.pad.label || 'BACKYARD'}`, color: sd.spec.color || '#38bdf8' });
                    }
                    this.activeSkyDrops.splice(i, 1);
                }
            }
        }
    }

    BO.World = new WorldBuilder();
})(window);
