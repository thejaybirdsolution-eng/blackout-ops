/* ============================================================================
   BLACKOUT OPS — Open World RPG · Summonable Rideable Mounts
   4 distinct custom 3D articulated mounts (Scrap Scout Bike, Nomad Hoverbike,
   Meridian Armored ATV, Aegis War Strider). Toggle with [T], boost with [Shift].
   Smooth terrain & slope tracking, night headlights, bob/lean animations,
   auto-dismount indoors/dialogue/death. Low draw calls (only active mount).
============================================================================ */
(function (BO) {
    'use strict';

    const Mounts = {
        mounted: false,
        activeId: null,
        mesh: null,
        headlight: null,
        parts: null,
        boostFuel: 100,
        boosting: false,
        speed: 0,
        animPhase: 0,
        _lastEye: null,

        get defs() { return (BO.OWRPGExpansionData && BO.OWRPGExpansionData.MOUNTS) || {}; },
        get s() { return BO.OWRPGMode.state; },

        reset() {
            this.dismount(true);
            this.boostFuel = 100;
            this.boosting = false;
            this.speed = 0;
        },

        isOwned(s, id) {
            return !!(s && s.player && s.player.mounts && s.player.mounts.owned.includes(id));
        },

        unlock(s, id) {
            if (!s || !s.player || !this.defs[id]) return false;
            if (!s.player.mounts) s.player.mounts = { owned: [], active: null };
            if (!s.player.mounts.owned.includes(id)) {
                s.player.mounts.owned.push(id);
                if (!s.player.mounts.active) s.player.mounts.active = id;
                BO.Events.emit('hud:banner', { title: 'MOUNT UNLOCKED', sub: `${this.defs[id].name} — Press [T] to summon`, color: '#38bdf8' });
                return true;
            }
            return false;
        },

        select(s, id) {
            if (!this.isOwned(s, id)) return false;
            s.player.mounts.active = id;
            if (this.mounted && this.activeId !== id) {
                this.dismount(true);
                this.mount();
            }
            return true;
        },

        toggle() {
            if (this.mounted) { this.dismount(); return; }
            this.mount();
        },

        mount() {
            const s = this.s;
            if (!s || !BO.Player.alive) return false;
            if (BO.OWRPGWorldData.isInterior(BO.Player.pos.x, BO.Player.pos.z)) {
                BO.OWRPGMode.toast('Cannot summon mount indoors.', '#f97316');
                return false;
            }
            const mState = s.player.mounts || { owned: [], active: null };
            const id = mState.active || mState.owned[0];
            if (!id || !this.defs[id]) {
                BO.OWRPGMode.toast('No mount unlocked yet — talk to Torin in Freestead!', '#f97316');
                return false;
            }
            this.dismount(true);
            this.activeId = id;
            this.mounted = true;
            this.mesh = this._buildMesh(id);
            BO.World.scene.add(this.mesh);
            BO.Player.adsHeld = false;
            BO.Player.adsAlpha = 0;
            BO.Player.reloading = false;
            BO.Combat?.cancelCharge?.();
            BO.Sound?.playUIClick?.();
            BO.OWRPGMode.toast(`Mounted: ${this.defs[id].name} ([Shift] Turbo · [T] Dismount)`, '#38bdf8');
            return true;
        },

        dismount(silent = false) {
            if (this.mesh) {
                this.mesh.removeFromParent();
                this.mesh = null;
            }
            this.headlight = null;
            this.parts = null;
            if (this.mounted) {
                this.mounted = false;
                this.activeId = null;
                this.boosting = false;
                this.speed = 0;
                BO.Player.eyeHeight = BO.Player.crouching ? 1.04 : 1.60;
                if (!silent) BO.OWRPGMode.toast('Dismounted', '#94a3b8');
            }
        },

        speedMult() {
            if (!this.mounted || !this.activeId) return 1;
            const d = this.defs[this.activeId];
            if (!d) return 1;
            const P = BO.Player;
            const wantsBoost = (P.keys?.ShiftLeft || P.keys?.ShiftRight) && this.boostFuel > 4 && Math.hypot(P.vel.x, P.vel.z) > 1;
            this.boosting = wantsBoost;
            const targetSpd = wantsBoost ? d.boostSpeed : d.speed;
            // Base walk speed in PlayerController is ~5.4 (sprint 7.1, tac 8.4)
            const baseRef = P.tacSprinting ? 8.4 : (P.sprinting ? 7.1 : 5.4);
            return targetSpd / Math.max(1, baseRef);
        },

        drMult() {
            if (!this.mounted || !this.activeId) return 1;
            const d = this.defs[this.activeId];
            return 1 - ((d && d.dr) || 0);
        },

        _buildMesh(id) {
            const def = this.defs[id];
            const g = new THREE.Group();
            const bodyMat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.45, metalness: 0.55 });
            const darkMat = new THREE.MeshStandardMaterial({ color: def.accent, roughness: 0.65, metalness: 0.6 });
            const glowMat = new THREE.MeshBasicMaterial({ color: def.hover ? 0x38bdf8 : 0xfde047 });
            const parts = { wheels: [], legs: [], thrusters: [] };

            if (id === 'scout_bike') {
                const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.4, 1.75), bodyMat);
                chassis.position.set(0, 0.55, 0);
                const fork = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.65, 0.16), darkMat);
                fork.position.set(0, 0.68, -0.78); fork.rotation.x = 0.35;
                const bars = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.06, 0.08), darkMat);
                bars.position.set(0, 0.98, -0.62);
                const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.08), glowMat);
                lamp.position.set(0, 0.85, -0.88);
                g.add(chassis, fork, bars, lamp);
                const wGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.16, 12);
                wGeo.rotateZ(Math.PI / 2);
                for (const wz of [-0.75, 0.72]) {
                    const w = new THREE.Mesh(wGeo, darkMat);
                    w.position.set(0, 0.32, wz);
                    g.add(w); parts.wheels.push(w);
                }
            } else if (id === 'hoverbike') {
                const hull = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.28, 2.2), bodyMat);
                hull.position.set(0, 0.65, 0);
                const nose = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.75, 6), bodyMat);
                nose.rotation.x = -Math.PI / 2; nose.position.set(0, 0.66, -1.35);
                const finL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.9), darkMat);
                finL.position.set(-0.4, 0.6, 0.35);
                const finR = finL.clone(); finR.position.x = 0.4;
                const thrL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.3, 8), glowMat);
                thrL.rotation.x = Math.PI / 2; thrL.position.set(-0.22, 0.6, 1.15);
                const thrR = thrL.clone(); thrR.position.x = 0.22;
                g.add(hull, nose, finL, finR, thrL, thrR);
                parts.thrusters.push(thrL, thrR);
            } else if (id === 'aegis_atv') {
                const body = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.45, 2.0), bodyMat);
                body.position.set(0, 0.62, 0);
                const cage = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.55, 1.1), darkMat);
                cage.position.set(0, 1.05, 0.15);
                const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.22), darkMat);
                bumper.position.set(0, 0.52, -1.08);
                const bar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.08), glowMat);
                bar.position.set(0, 0.75, -1.02);
                g.add(body, cage, bumper, bar);
                const wGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.24, 12);
                wGeo.rotateZ(Math.PI / 2);
                for (const [wx, wz] of [[-0.62, -0.72], [0.62, -0.72], [-0.62, 0.72], [0.62, 0.72]]) {
                    const w = new THREE.Mesh(wGeo, darkMat);
                    w.position.set(wx, 0.35, wz);
                    g.add(w); parts.wheels.push(w);
                }
            } else {
                // war_strider
                const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.95, 1.25), bodyMat);
                cockpit.position.set(0, 1.85, 0);
                const visor = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.26, 0.12), glowMat);
                visor.position.set(0, 1.98, -0.62);
                const podL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.9), darkMat);
                podL.position.set(-0.75, 1.95, -0.15);
                const podR = podL.clone(); podR.position.x = 0.75;
                const legL = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.35, 0.42), darkMat);
                legL.position.set(-0.45, 0.72, 0);
                const legR = legL.clone(); legR.position.x = 0.45;
                g.add(cockpit, visor, podL, podR, legL, legR);
                parts.legs.push(legL, legR);
            }

            const spot = new THREE.SpotLight(def.hover ? 0x7dd3fc : 0xfff3c4, 0, 42, Math.PI / 4, 0.45, 1.3);
            spot.position.set(0, def.strider ? 2.0 : 0.9, -0.9);
            const target = new THREE.Object3D();
            target.position.set(0, 0.2, -14);
            g.add(spot, target);
            spot.target = target;
            this.headlight = spot;
            this.parts = parts;
            return g;
        },

        update(dt) {
            if (!this.mounted || !this.mesh || !this.activeId) return;
            const P = BO.Player;
            if (!P.alive || BO.OWRPGWorldData.isInterior(P.pos.x, P.pos.z)) {
                this.dismount(true);
                return;
            }
            const def = this.defs[this.activeId];
            const hSpeed = Math.hypot(P.vel.x, P.vel.z);
            this.speed = hSpeed;
            if (this.boosting) this.boostFuel = Math.max(0, this.boostFuel - dt * 28);
            else this.boostFuel = Math.min(100, this.boostFuel + dt * 16);

            // Position & yaw tracking
            this.mesh.position.set(P.pos.x, P.pos.y, P.pos.z);
            this.mesh.rotation.y = P.yaw;

            // Terrain slope pitch & lean roll
            const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
            const hF = BO.World.terrainHeight(P.pos.x + fx * 1.1, P.pos.z + fz * 1.1);
            const hB = BO.World.terrainHeight(P.pos.x - fx * 1.1, P.pos.z - fz * 1.1);
            const slopePitch = Math.atan2(hF - hB, 2.2) * 0.6;
            const steerLean = ((P.keys?.KeyA ? 1 : 0) - (P.keys?.KeyD ? 1 : 0)) * (def.hover || this.activeId === 'scout_bike' ? 0.14 : 0.04) * Math.min(1, hSpeed / 8);
            this.mesh.rotation.x = BO.Math.damp(this.mesh.rotation.x, slopePitch, 10, dt);
            this.mesh.rotation.z = BO.Math.damp(this.mesh.rotation.z, steerLean, 10, dt);

            this.animPhase += dt * Math.max(1, hSpeed * 0.9);
            if (def.hover) {
                this.mesh.position.y += 0.22 + Math.sin(this.animPhase * 1.8) * 0.06;
            }
            if (this.parts) {
                for (const w of this.parts.wheels) w.rotation.x -= hSpeed * dt * 2.6;
                for (const t of this.parts.thrusters) t.scale.setScalar(this.boosting ? 1.35 : 0.95 + Math.sin(this.animPhase * 4) * 0.08);
                if (this.parts.legs.length === 2) {
                    const stride = Math.min(1, hSpeed / 6) * 0.45;
                    this.parts.legs[0].rotation.x = Math.sin(this.animPhase) * stride;
                    this.parts.legs[1].rotation.x = -Math.sin(this.animPhase) * stride;
                }
            }

            // Eye height adjustment
            const targetEye = def.strider ? 2.35 : 1.72;
            P.eyeHeight = BO.Math.damp(P.eyeHeight, targetEye + (hSpeed > 2 ? Math.sin(this.animPhase * 2) * 0.02 : 0), 12, dt);

            // Night headlights
            if (this.headlight) {
                const night = BO.OWRPGWorldSim && BO.OWRPGWorldSim.isNight();
                this.headlight.intensity = night ? 2.4 : 0;
            }
        }
    };

    BO.OWRPGMounts = Mounts;
})(window.BO);
