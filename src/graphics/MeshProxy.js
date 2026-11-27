/* ============================================================================
   BLACKOUT OPS — Mesh Proxy LOD
   Bakes a multi-part character rig (soldier / beast, 100+ meshes) into one
   merged mesh per material, attached to the rig root. Far away the detailed
   parts are hidden and the proxy is drawn instead, cutting ~135 draw calls per
   operator down to the number of materials (typically 8–14).

   - Geometry is baked in the rig's local space, so the proxy follows the root
     transform (position / yaw) with zero per-frame cost.
   - Proxies are cached by key so a crowd of identical rigs shares GPU buffers.
   - Hit detection is unaffected: hidden detail meshes still raycast.
============================================================================ */
(function (BO) {
    'use strict';

    const cache = new Map();          // key -> [{ geometry, material }]
    const _inv = new THREE.Matrix4();
    const _m = new THREE.Matrix4();

    /** True when every ancestor between `o` and `root` (exclusive) is visible. */
    function visibleTo(o, root) {
        for (let t = o; t && t !== root; t = t.parent) if (!t.visible) return false;
        return true;
    }

    function mergeGroup(geos, withUv) {
        let count = 0;
        for (const g of geos) count += g.attributes.position.count;
        const pos = new Float32Array(count * 3);
        const nor = new Float32Array(count * 3);
        const uv = withUv ? new Float32Array(count * 2) : null;
        let o3 = 0, o2 = 0;
        for (const g of geos) {
            const p = g.attributes.position.array;
            pos.set(p, o3);
            if (g.attributes.normal) nor.set(g.attributes.normal.array, o3);
            if (uv && g.attributes.uv) uv.set(g.attributes.uv.array, o2);
            o3 += p.length;
            o2 += g.attributes.position.count * 2;
            g.dispose();
        }
        const out = new THREE.BufferGeometry();
        out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
        if (uv) out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        out.computeBoundingSphere();
        out.computeBoundingBox();
        return out;
    }

    /** Merge every visible, non-transparent, single-material mesh below `root` by material. */
    function bake(root) {
        root.updateMatrixWorld(true);
        _inv.copy(root.matrixWorld).invert();
        const groups = new Map();
        root.traverse((o) => {
            if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || o.userData.noProxy) return;
            if (Array.isArray(o.material) || !o.geometry || !o.geometry.attributes.position) return;
            if (o.material.transparent || !visibleTo(o, root)) return;
            _m.multiplyMatrices(_inv, o.matrixWorld);
            const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
            for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
            if (!g.attributes.normal) g.computeVertexNormals();
            g.applyMatrix4(_m);
            if (_m.determinant() < 0) {
                // Mirrored part: flip winding so faces are not culled from the outside.
                const p = g.attributes.position.array, n = g.attributes.normal.array, uv = g.attributes.uv && g.attributes.uv.array;
                for (let i = 0; i < p.length; i += 9) {
                    for (let k = 0; k < 3; k++) { const a = p[i + 3 + k]; p[i + 3 + k] = p[i + 6 + k]; p[i + 6 + k] = a; const b = n[i + 3 + k]; n[i + 3 + k] = n[i + 6 + k]; n[i + 6 + k] = b; }
                    if (uv) { const j = (i / 9) * 6; for (let k = 0; k < 2; k++) { const a = uv[j + 2 + k]; uv[j + 2 + k] = uv[j + 4 + k]; uv[j + 4 + k] = a; } }
                }
            }
            let list = groups.get(o.material);
            if (!list) groups.set(o.material, list = []);
            list.push(g);
        });
        const out = [];
        for (const [material, geos] of groups) {
            const withUv = !!material.map && geos.every((g) => !!g.attributes.uv);
            if (!withUv) for (const g of geos) if (g.attributes.uv) g.deleteAttribute('uv');
            out.push({ geometry: mergeGroup(geos, withUv), material });
        }
        return out;
    }

    const MeshProxy = {
        /**
         * Attach a merged proxy below `root` and return an LOD handle.
         * @param {THREE.Object3D} root   rig root (its own transform is excluded from the bake)
         * @param {string} [key]          cache key; rigs sharing a key share buffers
         * @returns {{root, proxy, detail:THREE.Object3D[], far:boolean}}
         */
        attach(root, key) {
            let parts = key ? cache.get(key) : null;
            if (!parts) {
                parts = bake(root);
                if (key) cache.set(key, parts);
            }
            const proxy = new THREE.Group();
            proxy.name = 'MeshProxy';
            for (const p of parts) {
                const m = new THREE.Mesh(p.geometry, p.material);
                m.castShadow = true;
                m.receiveShadow = false;
                m.userData.noProxy = true;
                m.userData.sharedGeometry = true;
                proxy.add(m);
            }
            proxy.visible = false;
            const detail = root.children.filter((c) => !c.isSprite && c.name !== 'MeshProxy');
            root.add(proxy);
            return { root, proxy, detail, far: false, parts: parts.length };
        },

        /** Switch an LOD handle between full detail and the merged proxy. */
        set(lod, far) {
            if (!lod || lod.far === far) return;
            lod.far = far;
            lod.proxy.visible = far;
            for (const c of lod.detail) c.visible = !far;
        },

        /** Remove the proxy group (shared geometry stays cached). */
        detach(lod) {
            if (!lod) return;
            this.set(lod, false);
            lod.proxy.removeFromParent();
        },

        cacheSize() { return cache.size; }
    };

    BO.MeshProxy = MeshProxy;
})(window.BO);
