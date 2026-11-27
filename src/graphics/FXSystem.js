/* ============================================================================
   BLACKOUT OPS — Pooled 3D Visual Effects, Tracers, Decals, Fireballs & Chopper
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const _tmpDecalTgt = new THREE.Vector3();
    const _tmpRingOff = new THREE.Vector3();
    const _tmpExpPos = new THREE.Vector3();
    const _tmpExpNorm = new THREE.Vector3(0, 1, 0);

    class FXSystem {
        constructor() {
            this.scene = null;
            this.particles = [];
            this.tracers = [];
            this.decals = [];
            this.decalCursor = 0;
            this.decalGeo = new THREE.PlaneGeometry(0.14, 0.14);
            this.decalMat = new THREE.MeshBasicMaterial({ color: 0x0f1115, transparent: true, opacity: 0.78, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
            this.scorchMat = new THREE.MeshBasicMaterial({ color: 0x0b0b0c, transparent: true, opacity: 0.65, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
            this.particleGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
            this.shellGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.028, 6);
            this.shellMat = new THREE.MeshStandardMaterial({ color: 0xd4a442, roughness: 0.3, metalness: 0.9 });
            this.chopper = null;
        }

        attachScene(scene) {
            this.scene = scene;
            this.particles = [];
            this.tracers = [];
            this.decals = [];
            this.decalCursor = 0;
            this.chopper = null;
        }

        clear() {
            if (this.scene) {
                for (let i = 0; i < this.particles.length; i++) {
                    const p = this.particles[i];
                    this.scene.remove(p.mesh);
                    if (!p.sharedMat && p.mesh.material) p.mesh.material.dispose();
                }
                for (let i = 0; i < this.tracers.length; i++) {
                    const t = this.tracers[i];
                    this.scene.remove(t.mesh);
                    if (t.mesh.geometry) t.mesh.geometry.dispose();
                    if (t.mesh.material) t.mesh.material.dispose();
                }
                for (let i = 0; i < this.decals.length; i++) {
                    this.scene.remove(this.decals[i]);
                }
                if (this.chopper && this.chopper.group) {
                    this.scene.remove(this.chopper.group);
                }
            }
            this.particles.length = 0;
            this.tracers.length = 0;
            this.decals.length = 0;
            this.decalCursor = 0;
            this.chopper = null;
        }

        spawnTracer(start, end, color = 0xffd166, width = 0.028, life = 0.09) {
            if (!this.scene) return;
            const dist = start.distanceTo(end);
            if (dist < 0.2) return;
            const geo = new THREE.CylinderGeometry(width * 0.5, width, Math.min(dist, 28), 6);
            geo.rotateX(Math.PI * 0.5);
            const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
            const mesh = new THREE.Mesh(geo, mat);
            const mid = start.clone().lerp(end, 0.5);
            mesh.position.copy(mid);
            mesh.lookAt(end);
            this.scene.add(mesh);
            this.tracers.push({ mesh, life, maxLife: life });
        }

        spawnParticles(pos, count, color, speed = 4.5, gravity = 9.8, life = 0.5, sizeScale = 1.0) {
            if (!this.scene) return;
            const cap = BO.Settings.getQualityPreset().maxParticles;
            if (this.particles.length >= cap) return;
            const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 });
            for (let i = 0; i < count; i++) {
                const m = new THREE.Mesh(this.particleGeo, mat);
                m.position.copy(pos);
                m.scale.setScalar((0.5 + Math.random() * 0.9) * sizeScale);
                const vel = new THREE.Vector3(
                    (Math.random() - 0.5) * 2 * speed,
                    (0.2 + Math.random() * 1.1) * speed,
                    (Math.random() - 0.5) * 2 * speed
                );
                this.scene.add(m);
                this.particles.push({
                    mesh: m,
                    vel,
                    gravity,
                    life: life * (0.7 + Math.random() * 0.5),
                    maxLife: life,
                    spin: (Math.random() - 0.5) * 12,
                    sharedMat: i > 0 // dispose mat once
                });
            }
        }

        spawnShellCasing(pos, rightDir) {
            if (!this.scene) return;
            if (this.particles.length > BO.Settings.getQualityPreset().maxParticles) return;
            const m = new THREE.Mesh(this.shellGeo, this.shellMat);
            m.position.copy(pos);
            const vel = rightDir.clone().multiplyScalar(2.4 + Math.random() * 1.2);
            vel.y += 1.8 + Math.random() * 0.8;
            this.scene.add(m);
            this.particles.push({
                mesh: m,
                vel,
                gravity: 14,
                life: 0.95,
                maxLife: 0.95,
                spin: 18,
                sharedMat: true,
                sharedGeo: true
            });
        }

        spawnDecal(pos, normal, isExplosion = false) {
            if (!this.scene) return;
            const maxD = BO.Settings.getQualityPreset().maxDecals;
            if (maxD <= 0) return;
            let mesh;
            if (this.decals.length < maxD) {
                mesh = new THREE.Mesh(this.decalGeo, isExplosion ? this.scorchMat : this.decalMat);
                this.scene.add(mesh);
                this.decals.push(mesh);
            } else {
                mesh = this.decals[this.decalCursor % maxD];
                this.decalCursor++;
                mesh.material = isExplosion ? this.scorchMat : this.decalMat;
            }
            mesh.position.copy(pos).addScaledVector(normal, 0.015);
            _tmpDecalTgt.copy(pos).add(normal);
            mesh.lookAt(_tmpDecalTgt);
            mesh.scale.setScalar(isExplosion ? 10.5 : (0.85 + Math.random() * 0.45));
        }

        spawnExplosion(pos, radius = 5.0, color = 0xff7722) {
            if (!this.scene) return;
            // Expanding fireball + shockwave ring + debris particles
            const sphereGeo = new THREE.SphereGeometry(0.6, 14, 12);
            const sphereMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
            const sphere = new THREE.Mesh(sphereGeo, sphereMat);
            sphere.position.copy(pos);
            this.scene.add(sphere);
            this.tracers.push({ mesh: sphere, life: 0.35, maxLife: 0.35, growTo: radius * 0.72 });

            const ringGeo = new THREE.RingGeometry(0.3, 0.65, 24);
            ringGeo.rotateX(-Math.PI * 0.5);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            _tmpRingOff.set(pos.x, pos.y + 0.12, pos.z);
            ring.position.copy(_tmpRingOff);
            this.scene.add(ring);
            this.tracers.push({ mesh: ring, life: 0.40, maxLife: 0.40, growTo: radius * 1.4 });

            this.spawnParticles(pos, 22, 0xff8833, 8.5, 11.0, 0.65, 2.2);
            this.spawnParticles(pos, 14, 0x262626, 4.5, 2.5, 0.95, 2.8);
            _tmpExpPos.set(pos.x, 0.02, pos.z);
            this.spawnDecal(_tmpExpPos, _tmpExpNorm, true);
        }

        spawnConeShockwave(origin, forward) {
            if (!this.scene) return;
            for (let i = 0; i < 4; i++) {
                const ring = new THREE.Mesh(
                    new THREE.TorusGeometry(0.35 + i * 0.15, 0.045, 8, 20),
                    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 })
                );
                ring.position.copy(origin).addScaledVector(forward, 1.2 + i * 1.1);
                ring.lookAt(origin.clone().addScaledVector(forward, 10));
                this.scene.add(ring);
                this.tracers.push({ mesh: ring, life: 0.28 + i * 0.04, maxLife: 0.32, growTo: 2.8 + i * 0.9 });
            }
        }

        spawnChopper(centerX = 0, centerZ = 0, duration = 30) {
            if (!this.scene) return null;
            if (this.chopper && this.chopper.group) {
                this.scene.remove(this.chopper.group);
            }
            const g = new THREE.Group();
            const hullMat = new THREE.MeshStandardMaterial({ color: 0x262f28, roughness: 0.5, metalness: 0.6 });
            const glassMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });

            const fuselage = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 4.2), hullMat);
            const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.9, 1.2), glassMat);
            cockpit.position.set(0, -0.1, 2.2);
            const tail = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 3.6), hullMat);
            tail.position.set(0, 0.25, -3.5);
            const rotor = new THREE.Group();
            rotor.position.set(0, 0.9, 0);
            const b1 = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.06, 0.26), hullMat);
            const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 6.2), hullMat);
            rotor.add(b1, b2);
            g.add(fuselage, cockpit, tail, rotor);
            g.position.set(centerX, 15.5, centerZ + 14);
            this.scene.add(g);

            this.chopper = { group: g, rotor, angle: 0, timer: duration, fireCooldown: 0.4, centerX, centerZ };
            return this.chopper;
        }

        update(dt) {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.life -= dt;
                if (p.life <= 0) {
                    this.scene.remove(p.mesh);
                    if (!p.sharedMat && p.mesh.material) p.mesh.material.dispose();
                    this.particles.splice(i, 1);
                    continue;
                }
                p.vel.y -= p.gravity * dt;
                p.mesh.position.addScaledVector(p.vel, dt);
                if (p.mesh.position.y < 0.04) {
                    p.mesh.position.y = 0.04;
                    p.vel.y *= -0.35;
                    p.vel.x *= 0.7;
                    p.vel.z *= 0.7;
                }
                p.mesh.rotation.x += p.spin * dt;
                p.mesh.rotation.y += p.spin * 0.7 * dt;
                if (!p.sharedMat && p.mesh.material) {
                    p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
                }
            }

            for (let i = this.tracers.length - 1; i >= 0; i--) {
                const t = this.tracers[i];
                t.life -= dt;
                if (t.life <= 0) {
                    this.scene.remove(t.mesh);
                    if (t.mesh.geometry) t.mesh.geometry.dispose();
                    if (t.mesh.material) t.mesh.material.dispose();
                    this.tracers.splice(i, 1);
                    continue;
                }
                const frac = 1 - t.life / t.maxLife;
                if (t.growTo) {
                    t.mesh.scale.setScalar(1 + frac * t.growTo);
                }
                if (t.mesh.material) {
                    t.mesh.material.opacity = Math.max(0, (1 - frac) * 0.9);
                }
            }

            if (this.chopper) {
                this.chopper.timer -= dt;
                this.chopper.angle += dt * 0.55;
                this.chopper.rotor.rotation.y += dt * 24;
                const r = 15.0;
                const nx = this.chopper.centerX + Math.cos(this.chopper.angle) * r;
                const nz = this.chopper.centerZ + Math.sin(this.chopper.angle) * r;
                this.chopper.group.position.set(nx, 15.0 + Math.sin(this.chopper.angle * 2) * 0.6, nz);
                this.chopper.group.lookAt(this.chopper.centerX, 2, this.chopper.centerZ);
                if (this.chopper.timer <= 0) {
                    this.scene.remove(this.chopper.group);
                    this.chopper = null;
                }
            }
        }
    }

    BO.FX = new FXSystem();
})(window);
