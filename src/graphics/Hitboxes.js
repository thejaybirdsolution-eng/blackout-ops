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
   • GLB models: rigid parts are hit directly; skinned meshes get per-bone hit
     groups over a CPU-skinned copy of their vertices, re-skinned from the live
     skeleton whenever a shot reaches them, so the hit surface is the deformed
     skin itself, joints included.
   • Each entity carries a bounding radius so CombatSystem can skip the
     triangle test for enemies a ray cannot reach.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const _v = new THREE.Vector3();
    const _m = new THREE.Matrix4();
    const _sphere = new THREE.Sphere();
    const _skinWorld = new THREE.Matrix4();
    const _bounds = new THREE.Box3(), _boneBox = new THREE.Box3();

    // Invisible but raycastable: the renderer skips material.visible === false, the raycaster does not.
    const PROXY_MAT = new THREE.MeshBasicMaterial({ visible: false });
    PROXY_MAT.name = 'bo-hitbox-proxy';
    const proxyMaterials = [PROXY_MAT,
        new THREE.MeshBasicMaterial({ visible: false, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
    ];
    for (const m of proxyMaterials) m.userData.sharedAsset = true;

    const LIMB_RE = /arm|hand|leg|thigh|calf|shin|foot|ball|toe|tail|wing|finger|thumb|index|middle|ring|pinky/i;
    const HEAD_RE = /^head|[-_ ]head|skull|helm|face|jaw|(?:^|[-_ ])ear(?:$|[-_ .])/i;

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

    // SoldierModel animates joints. Its rigid pieces (including ear cups and
    // stretched armor) keep their local transforms on those joints.
    function soldierJointBounds(list) {
        const groups = new Map();
        for (const mesh of list) {
            const joint = mesh.parent;
            if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
            mesh.updateMatrix();
            _sphere.copy(mesh.geometry.boundingSphere).applyMatrix4(mesh.matrix);
            const box = groups.get(joint) || new THREE.Box3();
            box.union(_sphere.getBoundingBox(_boneBox));
            groups.set(joint, box);
        }
        return Array.from(groups, ([joint, box]) => ({ joint, sphere: box.getBoundingSphere(new THREE.Sphere()) }));
    }

    /* ---------------------------------------------------------------- skinned proxies */

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
     * Skinned hit groups. Per geometry (cached, shared by every instance): each vertex's bind-space
     * position, its four bone influences, and the triangle list split by body segment (fingers and
     * toes folded into hand/foot). Per instance: one Float32Array of CPU-skinned vertex positions
     * shared by all of that mesh's segment groups. `refresh()` re-skins it from the live skeleton,
     * so the hit surface is the deformed skin itself, joints included.
     */
    const skinCache = new WeakMap();
    function skinLayout(skinned) {
        const geo = skinned.geometry;
        let L = skinCache.get(geo);
        if (L) return L;
        const pos = geo.attributes.position, si = geo.attributes.skinIndex, sw = geo.attributes.skinWeight;
        const n = pos.count;
        const bones = skinned.skeleton.bones;
        const boneBounds = bones.map(() => new THREE.Box3());
        const bindPos = new Float32Array(n * 3);
        const be = skinned.bindMatrix.elements;
        const idx = new Uint16Array(n * 4), wts = new Float32Array(n * 4);
        const segOf = new Int32Array(n);
        const segments = bones.map((_, i) => bones.indexOf(segmentJoint(bones, i)));
        for (let i = 0; i < n; i++) {
            const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
            bindPos[i * 3] = be[0] * x + be[4] * y + be[8] * z + be[12];
            bindPos[i * 3 + 1] = be[1] * x + be[5] * y + be[9] * z + be[13];
            bindPos[i * 3 + 2] = be[2] * x + be[6] * y + be[10] * z + be[14];
            _v.fromArray(bindPos, i * 3);
            let best = 0, bw = -1, sum = 0;
            for (let k = 0; k < 4; k++) {
                const w = comp(sw, i, k), b = comp(si, i, k);
                idx[i * 4 + k] = b; wts[i * 4 + k] = w; sum += w;
                if (w > 0) boneBounds[b].expandByPoint(_v);
                if (w > bw) { bw = w; best = b; }
            }
            if (sum > 0 && Math.abs(sum - 1) > 1e-3) for (let k = 0; k < 4; k++) wts[i * 4 + k] /= sum;
            segOf[i] = segments[best];
        }
        const index = geo.index;
        const triCount = index ? index.count / 3 : n / 3;
        const buckets = new Map();
        for (let t = 0; t < triCount; t++) {
            const a = index ? index.getX(t * 3) : t * 3, b = index ? index.getX(t * 3 + 1) : t * 3 + 1, c = index ? index.getX(t * 3 + 2) : t * 3 + 2;
            const sa = segOf[a], sb = segOf[b], sc = segOf[c];
            const seg = (sa === sb || sa === sc) ? sa : (sb === sc ? sb : sa);
            if (seg < 0) continue;
            let arr = buckets.get(seg);
            if (!arr) { arr = []; buckets.set(seg, arr); }
            arr.push(a, b, c);
        }
        const groups = [];
        for (const [seg, arr] of buckets) {
            const verts = Array.from(new Set(arr));
            groups.push({ joint: bones[seg].name, index: n > 65535 ? new Uint32Array(arr) : new Uint16Array(arr), verts: Uint32Array.from(verts) });
        }
        const influences = [];
        boneBounds.forEach((box, bone) => {
            if (!box.isEmpty()) influences.push({ bone, box });
        });
        L = { n, bindPos, idx, wts, groups, influences };
        skinCache.set(geo, L);
        return L;
    }

    /** Re-skins one instance's vertices from its live skeleton and refits each group's bounding sphere. */
    function reskin(snap, force = false) {
        const sk = snap.skinned;
        const L = snap.layout;
        const skel = sk.skeleton;
        skel.update();
        const bm = skel.boneMatrices;
        const inv = sk.bindMatrixInverse.elements;
        // Compare the actual transforms. Consecutive pellets can share work even on a
        // slow frame, while two different poses within 12 ms must remain distinct.
        if (!force && snap.lastBones.every((value, i) => value === bm[i]) &&
            snap.lastInverse.equals(sk.bindMatrixInverse)) return;
        snap.lastBones.set(bm.subarray(0, snap.lastBones.length));
        snap.lastInverse.copy(sk.bindMatrixInverse);
        const out = snap.positions, bp = L.bindPos, idx = L.idx, wts = L.wts;
        for (let i = 0, n = L.n; i < n; i++) {
            const x = bp[i * 3], y = bp[i * 3 + 1], z = bp[i * 3 + 2];
            let ox = 0, oy = 0, oz = 0;
            for (let k = 0; k < 4; k++) {
                const w = wts[i * 4 + k];
                if (w === 0) continue;
                const o = idx[i * 4 + k] * 16;
                ox += w * (bm[o] * x + bm[o + 4] * y + bm[o + 8] * z + bm[o + 12]);
                oy += w * (bm[o + 1] * x + bm[o + 5] * y + bm[o + 9] * z + bm[o + 13]);
                oz += w * (bm[o + 2] * x + bm[o + 6] * y + bm[o + 10] * z + bm[o + 14]);
            }
            out[i * 3] = inv[0] * ox + inv[4] * oy + inv[8] * oz + inv[12];
            out[i * 3 + 1] = inv[1] * ox + inv[5] * oy + inv[9] * oz + inv[13];
            out[i * 3 + 2] = inv[2] * ox + inv[6] * oy + inv[10] * oz + inv[14];
        }
        if (BO.HitboxDebug?.enabled) snap.attr.needsUpdate = true;
        for (const g of snap.groups) {
            const vs = g.verts;
            let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
            for (let j = 0; j < vs.length; j++) {
                const o = vs[j] * 3, px = out[o], py = out[o + 1], pz = out[o + 2];
                if (px < minX) minX = px; if (px > maxX) maxX = px;
                if (py < minY) minY = py; if (py > maxY) maxY = py;
                if (pz < minZ) minZ = pz; if (pz > maxZ) maxZ = pz;
            }
            const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
            g.box.min.set(minX, minY, minZ);
            g.box.max.set(maxX, maxY, maxZ);
            g.sphere.center.set(cx, cy, cz);
            g.sphere.radius = Math.hypot(maxX - cx, maxY - cy, maxZ - cz) + 1e-4;
        }
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
            entity._jointBounds = parts.isSoldier ? soldierJointBounds(list) : null;
            entity._hitList = list;
            return list;
        },

        /** Replaces an entity's hit list with surfaces taken from a GLB model mounted under its root. */
        fromModel(entity, model, opts = {}) {
            const root = entity.parts.root;
            const list = [];
            let hasHead = false;
            const torsoMeshes = [];
            root.updateWorldMatrix(true, false);
            root.updateMatrixWorld(true);
            model.traverse((o) => {
                if (!o.isMesh || o.userData.hitProxy) return;
                o.userData.noHit = true;
                o.userData.glbPart = true;
                if (o.isSkinnedMesh && o.skeleton) {
                    const layout = skinLayout(o);
                    const positions = new Float32Array(layout.n * 3);
                    const attr = new THREE.BufferAttribute(positions, 3);
                    const snap = { skinned: o, layout, positions, attr, groups: [],
                        lastBones: new Float32Array(o.skeleton.bones.length * 16), lastInverse: new THREE.Matrix4() };
                    for (const g of layout.groups) {
                        const geom = new THREE.BufferGeometry();
                        geom.setAttribute('position', attr);
                        geom.setIndex(new THREE.BufferAttribute(g.index, 1));
                        geom.boundingBox = new THREE.Box3();
                        geom.boundingSphere = new THREE.Sphere();
                        const matSide = Array.isArray(o.material) ? o.material[0]?.side : o.material?.side;
                        const proxy = new THREE.Mesh(geom, proxyMaterials[matSide] || PROXY_MAT);
                        proxy.visible = false; // CPU collision geometry, never upload it for drawing.
                        proxy.castShadow = false;
                        proxy.receiveShadow = false;
                        proxy.frustumCulled = false;
                        proxy.matrixAutoUpdate = false; // identity: lives in the skinned mesh's own space
                        proxy.name = 'hit:' + g.joint + ':' + (o.name || 'skin');
                        proxy.userData.entity = entity;
                        proxy.userData.hitbox = opts.zone ? opts.zone(g.joint) : zoneByName(g.joint);
                        proxy.userData.hitProxy = true;
                        proxy.userData.skinSnap = snap;
                        proxy.userData.ownedGeometry = true;
                        if (proxy.userData.hitbox === 'head') hasHead = true;
                        o.add(proxy);
                        snap.groups.push({ verts: g.verts, sphere: geom.boundingSphere, box: geom.boundingBox });
                        list.push(proxy);
                    }
                    reskin(snap, true);
                    (entity._skinSnaps || (entity._skinSnaps = [])).push(snap);
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
            // Some rigid models have a single head-and-body mesh. Classify the actual
            // triangle impact in mesh space so empty space beside the head stays empty.
            if (!hasHead && torsoMeshes.length) {
                const torso = torsoMeshes[0];
                if (!torso.geometry.boundingBox) torso.geometry.computeBoundingBox();
                const bb = torso.geometry.boundingBox;
                torso.userData.headMinY = bb.max.y - (bb.max.y - bb.min.y) * 0.30;
            }
            // The procedural body underneath no longer takes hits.
            for (const m of entity._hitList || []) if (!list.includes(m)) m.userData.hitDisabled = true;
            entity._jointBounds = null;
            entity._hitList = list;

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
                let o = m.userData.hitProxy ? m.parent : m;
                while (o && o !== root && (o.visible || o.userData.lodDetail)) o = o.parent;
                if (o === root) out.push(m);
            }
            return out;
        },

        zoneAt(hit) {
            const mesh = hit.object;
            if (mesh.userData.headMinY != null &&
                mesh.worldToLocal(_v.copy(hit.point)).y >= mesh.userData.headMinY) return 'head';
            return mesh.userData.hitbox || 'torso';
        },

        // Broad phase over live rigid surfaces and bone influence bounds. A weighted
        // skinned vertex is inside the union's AABB even at the extremes of a pose.
        inRay(entity, rc, sphere) {
            const root = entity.parts.root;
            if (entity._jointBounds) {
                for (const group of entity._jointBounds) {
                    group.joint.updateWorldMatrix(true, false);
                    sphere.copy(group.sphere).applyMatrix4(group.joint.matrixWorld);
                    if (rc.ray.intersectsSphere(sphere) && rc.ray.origin.distanceTo(sphere.center) <= rc.far + sphere.radius) {
                        root.updateMatrixWorld(true);
                        return true;
                    }
                }
                return false;
            }
            root.updateWorldMatrix(true, false);
            root.updateMatrixWorld(true);
            const list = entity._hitList || this.prepare(entity);
            for (const mesh of list) {
                if (mesh.userData.skinSnap || mesh.userData.hitDisabled) continue;
                const g = mesh.geometry;
                if (!g.boundingSphere) g.computeBoundingSphere();
                sphere.copy(g.boundingSphere).applyMatrix4(mesh.matrixWorld);
                if (rc.ray.intersectsSphere(sphere) && rc.ray.origin.distanceTo(sphere.center) <= rc.far + sphere.radius) return true;
            }
            for (const snap of entity._skinSnaps || []) {
                const sk = snap.skinned, skeleton = sk.skeleton;
                _skinWorld.multiplyMatrices(sk.matrixWorld, sk.bindMatrixInverse);
                _bounds.makeEmpty();
                for (const { bone, box } of snap.layout.influences) {
                    _m.multiplyMatrices(_skinWorld, skeleton.bones[bone].matrixWorld).multiply(skeleton.boneInverses[bone]);
                    _bounds.union(_boneBox.copy(box).applyMatrix4(_m));
                }
                if (_bounds.distanceToPoint(rc.ray.origin) <= rc.far && rc.ray.intersectsBox(_bounds)) return true;
            }
            return false;
        },

        refresh(entity, force = false) {
            if (!entity._skinSnaps) return;
            entity.parts.root.updateWorldMatrix(true, false);
            entity.parts.root.updateMatrixWorld(true);
            for (const snap of entity._skinSnaps) reskin(snap, force);
        },

        /** Frees geometry created for GLB proxies. */
        dispose(entity) {
            for (const m of entity._hitList || []) {
                if (m.userData.ownedGeometry && m.geometry) {
                    m.removeFromParent();
                    m.geometry.dispose();
                }
            }
            entity._jointBounds = null;
            entity._hitList = null;
            entity._skinSnaps = null;
        }
    };

    BO.Hitboxes = Hitboxes;
})(window);
