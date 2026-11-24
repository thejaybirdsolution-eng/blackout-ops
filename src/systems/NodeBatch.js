(function (BO) {
    'use strict';

    /**
     * Chunked static batching for Survival resource deposits.
     *
     * Each deposit is built from a handful of small meshes with their own material, which made
     * ~2,400 draw calls on their own. Distant deposits are merged into one vertex-coloured mesh per
     * world cell, so a cell costs a single draw call. Deposits near the player stay as real meshes
     * ("live") so per-node effects (highlight, cracks, shake) keep working.
     *
     * The original meshes are never destroyed: they keep their world matrix for raycasts and are
     * simply detached from the scene while batched.
     */
    const CELL = 24;
    const LIVE_RADIUS = 14;
    const VIEW_RADIUS = 150;
    const REBUILDS_PER_FRAME = 2;

    const material = () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.02 });

    class NodeBatch {
        constructor(scene) {
            this.scene = scene;
            this.cells = new Map();
            this.dirty = new Set();
            this.material = material();
            this.nextLiveCheck = 0;
            this.lastLive = { x: Infinity, z: Infinity };
        }

        key(x, z) { return Math.floor(x / CELL) + ',' + Math.floor(z / CELL); }

        /** Register a deposit. `node.geometry` are its meshes; `node.marker` gives its position. */
        add(node) {
            const k = this.key(node.marker.x, node.marker.z);
            let cell = this.cells.get(k);
            if (!cell) {
                const [cx, cz] = k.split(',').map(Number);
                cell = { key: k, nodes: new Set(), mesh: null, cx: (cx + 0.5) * CELL, cz: (cz + 0.5) * CELL };
                this.cells.set(k, cell);
            }
            for (const mesh of node.geometry) mesh.updateMatrixWorld(true);
            node._batch = { cell, shown: node.hp > 0, live: false };
            cell.nodes.add(node);
            for (const mesh of node.geometry) {
                mesh.visible = node._batch.shown;
                mesh.removeFromParent();
            }
            this.dirty.add(cell);
        }

        /** Remove a deposit for good (dungeon teardown). */
        remove(node) {
            const b = node._batch;
            if (!b) return;
            b.cell.nodes.delete(node);
            this.dirty.add(b.cell);
            node._batch = null;
        }

        /** Show or hide a deposit (depleted, regrown). */
        setShown(node, shown) {
            const b = node._batch;
            if (!b) {
                for (const mesh of node.geometry) mesh.visible = shown;
                return;
            }
            if (b.shown === shown) return;
            b.shown = shown;
            for (const mesh of node.geometry) mesh.visible = shown;
            if (!b.live) this.dirty.add(b.cell);
        }

        setLive(node, live) {
            const b = node._batch;
            if (!b || b.live === live) return;
            b.live = live;
            for (const mesh of node.geometry) {
                if (live) this.scene.add(mesh);
                else mesh.removeFromParent();
                mesh.visible = b.shown;
            }
            this.dirty.add(b.cell);
        }

        /** A deposit's meshes moved or changed colour: refresh its matrices and re-bake its cell. */
        touch(node) {
            for (const mesh of node.geometry) mesh.updateMatrixWorld(true);
            if (node._batch && !node._batch.live) this.dirty.add(node._batch.cell);
        }

        isLive(node) { return !node._batch || node._batch.live; }

        /** Merge every shown, non-live deposit of a cell into a single mesh. */
        rebuild(cell) {
            if (cell.mesh) {
                cell.mesh.removeFromParent();
                cell.mesh.geometry.dispose();
                cell.mesh = null;
            }
            const parts = [];
            let count = 0;
            for (const node of cell.nodes) {
                if (!node._batch.shown || node._batch.live) continue;
                for (const mesh of node.geometry) {
                    let g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
                    g.applyMatrix4(mesh.matrixWorld);
                    const mat = mesh.material;
                    const c = mat.color.clone();
                    if (mat.emissive && mat.emissiveIntensity) c.add(mat.emissive.clone().multiplyScalar(mat.emissiveIntensity * 0.6));
                    parts.push({ g, c });
                    count += g.attributes.position.count;
                }
            }
            if (!count) return;
            const pos = new Float32Array(count * 3);
            const nor = new Float32Array(count * 3);
            const col = new Float32Array(count * 3);
            let o = 0;
            for (const { g, c } of parts) {
                const p = g.attributes.position;
                const n = g.attributes.normal;
                pos.set(p.array, o * 3);
                if (n) nor.set(n.array, o * 3);
                for (let i = 0; i < p.count; i++) {
                    col[(o + i) * 3] = c.r;
                    col[(o + i) * 3 + 1] = c.g;
                    col[(o + i) * 3 + 2] = c.b;
                }
                o += p.count;
                g.dispose();
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
            geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
            geo.computeBoundingSphere();
            const mesh = new THREE.Mesh(geo, this.material);
            mesh.matrixAutoUpdate = false;
            mesh.name = 'nodeBatch:' + cell.key;
            mesh.receiveShadow = true;
            cell.mesh = mesh;
            this.scene.add(mesh);
        }

        /** Build every dirty cell now (used once after world setup). */
        flushAll() {
            for (const cell of this.dirty) this.rebuild(cell);
            this.dirty.clear();
        }

        update(px, pz, clock) {
            if (clock >= this.nextLiveCheck || Math.abs(px - this.lastLive.x) > 3 || Math.abs(pz - this.lastLive.z) > 3) {
                this.nextLiveCheck = clock + 0.5;
                this.lastLive.x = px;
                this.lastLive.z = pz;
                const reach = LIVE_RADIUS + CELL;
                for (const cell of this.cells.values()) {
                    const near = Math.abs(cell.cx - px) < reach && Math.abs(cell.cz - pz) < reach;
                    if (cell.mesh) cell.mesh.visible = Math.abs(cell.cx - px) < VIEW_RADIUS && Math.abs(cell.cz - pz) < VIEW_RADIUS;
                    if (!near && !cell.anyLive) continue;
                    let anyLive = false;
                    for (const node of cell.nodes) {
                        const live = node._batch.shown && Math.hypot(node.marker.x - px, node.marker.z - pz) < LIVE_RADIUS;
                        this.setLive(node, live);
                        if (live) anyLive = true;
                    }
                    cell.anyLive = anyLive;
                }
            }
            let n = 0;
            for (const cell of this.dirty) {
                this.rebuild(cell);
                this.dirty.delete(cell);
                if (++n >= REBUILDS_PER_FRAME) break;
            }
        }

        dispose() {
            for (const cell of this.cells.values()) {
                if (cell.mesh) {
                    cell.mesh.removeFromParent();
                    cell.mesh.geometry.dispose();
                }
            }
            this.material.dispose();
            this.cells.clear();
            this.dirty.clear();
        }
    }

    BO.NodeBatch = NodeBatch;
})(window.BO);
