/* ============================================================================
   BLACKOUT OPS — 3D Hitbox Wireframe Debugger
   Zero-build IIFE module (ADR-002).
   Enabled automatically with ?debug=hitboxes in URL or toggled from GMDev / F9.
   Zero per-frame allocations: attaches one shared LineSegments wireframe child
   per tagged hitbox mesh via WeakMap so it inherits animated bone transforms.
   ============================================================================ */
(function (BO) {
    'use strict';

    const COLORS = {
        head: 0xff3b30,
        crit: 0xff3b30,
        torso: 0x22c55e,
        body: 0x22c55e,
        limb: 0x38bdf8,
        arm: 0x38bdf8,
        leg: 0x38bdf8,
        shield: 0xfacc15,
        armor: 0xfacc15,
        other: 0xe879f9
    };

    const MATS = {}, SKIN_MATS = {};
    const wireMap = new WeakMap();
    const attached = new Set();

    function getMat(zone) {
        const key = COLORS[zone] ? zone : 'other';
        if (!MATS[key]) {
            MATS[key] = new THREE.LineBasicMaterial({
                color: COLORS[key],
                transparent: true,
                opacity: 0.9,
                depthTest: false
            });
        }
        return MATS[key];
    }

    function normalizeZone(mesh) {
        const u = mesh && mesh.userData;
        if (!u) return '';
        const raw = u.hitbox || u.hitZone || u.hitboxZone || u.damageZone || (u.isHitbox ? 'torso' : '');
        if (!raw || typeof raw !== 'string') return raw ? 'torso' : '';
        const s = raw.toLowerCase();
        if (s.includes('head') || s.includes('crit') || s.includes('weak')) return 'head';
        if (s.includes('shield') || s.includes('armor')) return 'shield';
        if (s.includes('limb') || s.includes('arm') || s.includes('leg')) return 'limb';
        if (s.includes('torso') || s.includes('body') || s.includes('chest')) return 'torso';
        return 'other';
    }

    function ensureWire(mesh) {
        if (!mesh || !mesh.isMesh || !mesh.geometry) return null;
        if (mesh.userData && mesh.userData.isHitboxDebug) return null;
        const zone = normalizeZone(mesh);
        if (!zone) return null;

        let line = wireMap.get(mesh);
        if (!line) {
            if (mesh.userData.skinSnap) {
                SKIN_MATS[zone] ||= new THREE.MeshBasicMaterial({ color: COLORS[zone], wireframe: true, depthTest: false });
                line = new THREE.Mesh(mesh.geometry, SKIN_MATS[zone]);
                line.frustumCulled = false;
            } else {
                line = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 20), getMat(zone));
            }
            line.renderOrder = 998;
            line.raycast = () => {};
            line.userData.isHitboxDebug = true;
            line.userData.zone = zone;
            wireMap.set(mesh, line);
            mesh.add(line);
        } else if (line.parent !== mesh) {
            mesh.add(line);
        }
        if (mesh.userData.skinSnap) mesh.visible = true;
        line.visible = true;
        attached.add(line);
        return line;
    }

    function removeWire(line) {
        const mesh = line.parent;
        if (mesh) wireMap.delete(mesh);
        if (mesh?.userData.skinSnap) mesh.visible = false;
        else line.geometry.dispose();
        line.removeFromParent();
        attached.delete(line);
    }

    function hasUrlFlag() {
        try {
            return /[?&]debug=([^&]*hitboxes[^&]*)/i.test(window.location.search || '');
        } catch (_) {
            return false;
        }
    }

    const HitboxDebug = {
        enabled: hasUrlFlag(),
        _lastScanMs: 0,

        isEnabled() {
            return this.enabled;
        },

        setEnabled(on) {
            this.enabled = !!on;
            if (!this.enabled) {
                this.clear();
            } else {
                this.update(true);
            }
            return this.enabled;
        },

        toggle() {
            return this.setEnabled(!this.enabled);
        },

        clear() {
            attached.forEach(removeWire);
        },

        update(force) {
            if (!this.enabled) return;
            const now = performance.now();
            if (!force && now - this._lastScanMs < 120) return;
            this._lastScanMs = now;

            // Prune detached wires whose parent mesh left the scene
            attached.forEach((line) => {
                let ancestor = line.parent;
                while (ancestor && ancestor !== BO.World.scene) ancestor = ancestor.parent;
                if (!ancestor) removeWire(line);
                else line.visible = false;
            });

            const pool = BO.Combat && BO.Combat.targetPool;
            if (Array.isArray(pool)) {
                const refreshed = new Set();
                for (let i = 0; i < pool.length; i++) {
                    const m = pool[i];
                    if (!m) continue;
                    const ent = m.userData && m.userData.entity;
                    const dead = ent && (ent.alive === false || ent.dead === true || (typeof ent.hp === 'number' && ent.hp <= 0));
                    if (dead) {
                        const existing = wireMap.get(m);
                        if (existing) existing.visible = false;
                        continue;
                    }
                    if (m.userData.skinSnap && !refreshed.has(ent)) {
                        BO.Hitboxes.refresh(ent, true);
                        refreshed.add(ent);
                    }
                    ensureWire(m);
                }
            }

            // Also scan active scene for tagged hitboxes outside Combat.targetPool (e.g., shields, minigames, OWRPG)
            const scene = BO.World && BO.World.scene;
            if (scene) {
                scene.traverse((obj) => {
                    if (!obj.isMesh || !obj.visible || obj.userData?.hitDisabled) return;
                    if (obj.userData && (obj.userData.hitbox || obj.userData.hitZone || obj.userData.hitboxZone || obj.userData.damageZone || obj.userData.isHitbox)) {
                        const ent = obj.userData.entity;
                        if (ent && (ent.alive === false || ent.dead === true || (typeof ent.hp === 'number' && ent.hp <= 0))) {
                            const existing = wireMap.get(obj);
                            if (existing) existing.visible = false;
                            return;
                        }
                        if (!obj.userData.skinSnap) {
                            let hidden = false;
                            for (let p = obj.parent; p && p !== scene; p = p.parent) {
                                if (!p.visible && !p.userData?.lodDetail) { hidden = true; break; }
                            }
                            if (hidden) {
                                const existing = wireMap.get(obj);
                                if (existing) existing.visible = false;
                                return;
                            }
                        }
                        ensureWire(obj);
                    }
                });
            }
        }
    };

    BO.HitboxDebug = HitboxDebug;
})(window.BO = window.BO || {});
