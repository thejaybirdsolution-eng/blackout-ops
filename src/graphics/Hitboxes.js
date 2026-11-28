/* ============================================================================
   BLACKOUT OPS — Hitboxes
   One place that decides what a bullet can hit on an enemy.

   • Procedural rigs (soldiers, zombies, beasts): every visible body mesh is a
     hit surface, zoned head / torso / limb by which part of the rig it hangs
     from. Helmets, hands, boots and gear count; held weapons, auras, contact
     shadows and other effects do not.
   • Hidden parts never count (a crawler's missing legs, a decapitated head, a
     procedural body that a GLB model has replaced). Far-LOD detail that
     MeshProxy hides still counts, because the proxy shows the same pose.
   • GLB models: rigid parts are hit directly; skinned meshes are cut into
     rigid per-bone copies of their own triangles (built once per geometry
     from skin weights) and parented to the bones, so the hit surface is the
     model itself and follows every animation frame.
   • Each entity carries a bounding radius so CombatSystem can skip the
     triangle test for enemies a ray cannot reach.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const _v = new THREE.Vector3();
    const _m = new THREE.Matrix4();
    const _inv = new THREE.Matrix4();
    const _sphere = new THREE.Sphere();

    // Invisible but raycastable: the renderer skips material.visible === false, the raycaster does not.
    const PROXY_MAT = new THREE.MeshBasicMaterial({ visible: false });
    PROXY_MAT.name = 'bo-hitbox-proxy';

    const LIMB_RE = /arm|hand|leg|thigh|calf|shin|foot|ball|toe|tail|wing|finger|thumb|index|middle|ring|pinky/i;
    const HEAD_RE = /^head|[-_ ]head|skull|helm|face|jaw/i;

    function isEffectMaterial(mat) {
        const list = Array.isArray(mat) ? mat : [mat];
        for (const m of list) {
            if (!m) return true;
            if (m.visible === false || m.colorWrite === false) return true;
            if (m.blending === THREE.AdditiveBlending) return true;
            if (m.transparent && (m.opacity < 0.45 || m.depthWrite === false)) return true;
            if (m.wireframe) return true;
        }
        return false;
    }

    function zoneByAncestry(obj, parts, root) {
        for (let o = obj; o && o !== root; o = o.parent) {
            if (o.userData.hitZone) return o.userData.hitZone;
            if (o === parts.headGroup) return 'head';
            if (o === parts.armL || o === parts.armR || o === parts.legL || o === parts.legR ||
                o === parts.forearmL || o === parts.forearmR || o === parts.tail) return 'limb';
        }
        return 'torso';
    }

    function zoneByName(name) {
        if (!name) return 'torso';
        if (HEAD_RE.test(name)) return 'head';
        if (LIMB_RE.test(name)) return 'limb';
        return 'torso';
    }

    /** Bounding sphere of every hit mesh, expressed in root-local space (radius before root scale). */
    function measure(entity, list, root) {
        root.updateMatrixWorld(true);
        _inv.copy(root.matrixWorld).invert();
        const rootScale = root.matrixWorld.getMaxScaleOnAxis() || 1;
        let minY = Infinity, maxY = -Infinity;
        const centers = [];
        for (const m of list) {
            const g = m.geometry;
            if (!g) continue;
            if (!g.boundingSphere) g.computeBoundingSphere();
            _sphere.copy(g.boundingSphere).applyMatrix4(_m.multiplyMatrices(_inv, m.matrixWorld));
            centers.push(_sphere.center.x, _sphere.center.y, _sphere.center.z, _sphere.radius);
            minY = Math.min(minY, _sphere.center.y - _sphere.radius);
            maxY = Math.max(maxY, _sphere.center.y + _sphere.radius);
        }
        if (!centers.length) { entity._hitCY = 0.9; entity._hitR = 1.2; return; }
        const cy = (minY + maxY) * 0.5;
        let r = 0;
        for (let i = 0; i < centers.length; i += 4) {
            const d = Math.hypot(centers[i], centers[i + 1] - cy, centers[i + 2]) + centers[i + 3];
            if (d > r) r = d;
        }
        // Stored unscaled so a later sizeMult/scale change is picked up from the root matrix.
        entity._hitCY = cy * 1;
        entity._hitR = r;
        entity._hitScale0 = rootScale;
    }

    /* ---------------------------------------------------------------- skinned proxies */
    const proxyCache = new WeakMap(); // geometry -> [{ joint, box: Box3 }]

    function segmentJoint(bones, idx) {
        // Fingers, toes, clavicles and twist bones fold into the nearest parent that is a real body segment.
        let b = bones[idx];
        while (b && b.isBone) {
            const n = b.name || '';
            const minor = /index|middle|ring|pinky|thumb|leaf|ball|toe|clavicle|twist|_end$|-end$/i.test(n) || /^root$/i.test(n);
            if (!minor) break;
            if (!b.parent || !b.parent.isBone) break;
            b = b.parent;
        }
        return b;
    }

    // BufferAttribute.getComponent arrived after r149.
    const comp = (attr, i, k) => (k === 0 ? attr.getX(i) : k === 1 ? attr.getY(i) : k === 2 ? attr.getZ(i) : attr.getW(i));

    /**
     * Splits a skinned mesh into rigid per-bone pieces: every triangle goes to the body segment that
     * dominates its vertices, expressed in that bone's bind space. Parented to the bone, a piece moves
     * exactly like the skin it was cut from, so the hit surface is the model itself, frame by frame.
     * Built once per geometry and shared by every instance.
     */
    function buildSkinBoxes(skinned) {
        const geo = skinned.geometry;
        const cached = proxyCache.get(geo);
        if (cached) return cached;
        const pos = geo.attributes.position, si = geo.attributes.skinIndex, sw = geo.attributes.skinWeight;
        const index = geo.index;
        const bones = skinned.skeleton.bones;
        const bindM = skinned.bindMatrix;
        const segOf = new Int32Array(pos.count);
        for (let i = 0; i < pos.count; i++) {
            let best = 0, bw = -1;
            for (let k = 0; k < 4; k++) {
                const w = comp(sw, i, k);
                if (w > bw) { bw = w; best = comp(si, i, k); }
            }
            const seg = segmentJoint(bones, best);
            segOf[i] = seg ? bones.indexOf(seg) : -1;
        }
        const buckets = new Map(); // segIdx -> number[] (positions in bone space)
        const toBone = new Map();
        const v = new THREE.Vector3();
        const triCount = index ? index.count / 3 : pos.count / 3;
        for (let t = 0; t < triCount; t++) {
            const a = index ? index.getX(t * 3) : t * 3, b = index ? index.getX(t * 3 + 1) : t * 3 + 1, c = index ? index.getX(t * 3 + 2) : t * 3 + 2;
            // Majority vote of the three vertices' segments.
            const sa = segOf[a], sb = segOf[b], sc = segOf[c];
            const seg = (sa === sb || sa === sc) ? sa : (sb === sc ? sb : sa);
            if (seg < 0) continue;
            let mtx = toBone.get(seg);
            if (!mtx) { mtx = new THREE.Matrix4().multiplyMatrices(skinned.skeleton.boneInverses[seg], bindM); toBone.set(seg, mtx); }
            let arr = buckets.get(seg);
            if (!arr) { arr = []; buckets.set(seg, arr); }
            for (const vi of [a, b, c]) { v.fromBufferAttribute(pos, vi).applyMatrix4(mtx); arr.push(v.x, v.y, v.z); }
        }
        const out = [];
        for (const [seg, arr] of buckets) {
            if (arr.length < 9 * 4) continue; // fewer than 4 triangles: decoration fragment
            const g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
            g.computeBoundingSphere();
            g.computeBoundingBox();
            out.push({ joint: bones[seg].name, geometry: g, center: new THREE.Vector3() });
        }
        proxyCache.set(geo, out);
        return out;
    }

    const Hitboxes = {
        PROXY_MAT,
        zoneByName,

        /**
         * Tags every visible body mesh of a procedural rig and caches the hit list on the entity.
         * Call again after the rig changes (e.g. a GLB replaced the body).
         */
        prepare(entity, parts) {
            parts = parts || entity.parts;
            if (!parts || !parts.root) return [];
            const root = parts.root;
            const list = [];
            const skipTree = (o) => o === parts.gunBody || o === parts.haloGroup || o.userData.noHit || o.userData.isWeapon || o.name === 'MeshProxy' || o.name === 'bo-contact-shadow';
            const walk = (o) => {
                if (skipTree(o) || o.isSprite || o.isPoints || o.isLine) return;
                if (o.isMesh && !o.userData.hitDisabled) {
                    if (o.userData.entity === entity && o.userData.hitbox) list.push(o);
                    else if ((!o.userData.entity || o.userData.autoHit) && !isEffectMaterial(o.material)) {
                        o.userData.entity = entity;
                        o.userData.hitbox = zoneByAncestry(o, parts, root);
                        o.userData.autoHit = true;
                        list.push(o);
                    }
                }
                for (let i = 0; i < o.children.length; i++) walk(o.children[i]);
            };
            walk(root);
            entity._hitList = list;
            measure(entity, list, root);
            return list;
        },

        /** Replaces an entity's hit list with surfaces taken from a GLB model mounted under its root. */
        fromModel(entity, model, opts = {}) {
            const root = entity.parts.root;
            const list = [];
            let hasHead = false;
            const torsoMeshes = [];
            model.updateMatrixWorld(true);
            model.traverse((o) => {
                if (!o.isMesh || o.userData.hitProxy) return;
                o.userData.noHit = true;
                o.userData.glbPart = true;
                if (o.isSkinnedMesh && o.skeleton) {
                    for (const entry of buildSkinBoxes(o)) {
                        const { joint } = entry;
                        const bone = o.skeleton.bones.find((b) => b.name === joint);
                        if (!bone) continue;
                        const proxy = new THREE.Mesh(entry.geometry, PROXY_MAT);
                        proxy.position.copy(entry.center);
                        proxy.castShadow = false;
                        proxy.receiveShadow = false;
                        proxy.frustumCulled = false;
                        proxy.name = 'hit:' + joint + ':' + (o.name || 'skin');
                        proxy.userData.entity = entity;
                        proxy.userData.hitbox = opts.zone ? opts.zone(joint) : zoneByName(joint);
                        proxy.userData.hitProxy = true;
                        proxy.userData.sharedGeometry = true;
                        if (proxy.userData.hitbox === 'head') hasHead = true;
                        bone.add(proxy);
                        list.push(proxy);
                    }
                } else {
                    // Rigid part: the visible geometry is the hit surface.
                    let name = o.name;
                    for (let p = o; p && p !== model && (!name || /^(mesh|object|node)/i.test(name)); p = p.parent) name = p.name;
                    const zone = opts.zone ? opts.zone(name) : zoneByName(name);
                    o.userData.noHit = false;
                    o.userData.entity = entity;
                    o.userData.hitbox = zone;
                    if (zone === 'head') hasHead = true;
                    if (zone === 'torso') torsoMeshes.push(o);
                    list.push(o);
                }
            });
            // Models whose head is modelled into the torso (ghosts) get a head sphere over the top of the torso.
            if (!hasHead && torsoMeshes.length) {
                const t = torsoMeshes[0];
                t.geometry.computeBoundingBox();
                const bb = t.geometry.boundingBox;
                const h = bb.max.y - bb.min.y;
                const r = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) * 0.36;
                const head = new THREE.Mesh(new THREE.SphereGeometry(Math.max(r, h * 0.16), 10, 8), PROXY_MAT);
                head.position.set((bb.min.x + bb.max.x) / 2, bb.max.y - Math.max(r, h * 0.16), (bb.min.z + bb.max.z) / 2);
                head.userData.entity = entity;
                head.userData.hitbox = 'head';
                head.userData.hitProxy = true;
                head.userData.ownedGeometry = true;
                head.name = 'hit:head';
                t.add(head);
                list.push(head);
            }
            // The procedural body underneath no longer takes hits.
            for (const m of entity._hitList || []) if (!list.includes(m)) m.userData.hitDisabled = true;
            entity._hitList = list;
            measure(entity, list, root);
            return list;
        },

        /** Appends the entity's currently hittable meshes to `out`. */
        collect(entity, out = []) {
            const parts = entity.parts;
            if (!parts || !parts.root || !parts.root.visible) return out;
            const list = entity._hitList || this.prepare(entity, parts);
            const root = parts.root;
            for (let i = 0; i < list.length; i++) {
                const m = list[i];
                if (m.userData.hitDisabled || !m.parent) continue;
                let live = true;
                for (let o = m.userData.hitProxy ? m.parent : m; o && o !== root; o = o.parent) {
                    if (!o.visible && !o.userData.lodDetail) { live = false; break; }
                }
                if (live) out.push(m);
            }
            return out;
        },

        /** World-space bounding sphere used for ray broad-phase. Generous on purpose: it must never cull a real hit. */
        sphere(entity, target) {
            const root = entity.parts && entity.parts.root;
            if (!root) return null;
            if (entity._hitR == null) this.prepare(entity, entity.parts);
            const s = root.matrixWorld.getMaxScaleOnAxis() || 1;
            target.center.set(0, entity._hitCY || 0.9, 0).applyMatrix4(root.matrixWorld);
            target.radius = (entity._hitR || 1.2) * s * 1.35 + 0.35;
            return target;
        },

        /** Frees geometry created for GLB proxies. */
        dispose(entity) {
            for (const m of entity._hitList || []) {
                if (m.userData.ownedGeometry && m.geometry) m.geometry.dispose();
            }
            entity._hitList = null;
        }
    };

    BO.Hitboxes = Hitboxes;
})(window);
