/* ============================================================================
   BLACKOUT OPS — Hard-surface bevels for every box in the game.

   Real objects never have razor 90° edges; a 2–5 cm chamfer is what lets an edge
   catch a highlight and read as manufactured metal, poured concrete or milled
   polymer. THREE.BoxGeometry is swapped for a subclass that chamfers its edges
   and corners with smooth (rounded) normals, so weapons, characters, world
   architecture and props across every mode pick it up at once.

   Left untouched (falls back to the stock box):
   - calls that pass segment counts (the caller wants a specific grid)
   - 1×1×1 unit cubes, which are scaled afterwards and would stretch the bevel
   - boxes too small for the bevel to be visible, and Low quality
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const BaseBox = THREE.BoxGeometry;
    const CFG = { ratio: 0.14, max: 0.045, archMax: 0.014, archRatio: 0.04, min: 0.0015 };

    function bevelEnabled() {
        try {
            return !(BO && BO.Settings && BO.Settings.get('quality') === 'low');
        } catch (e) {
            return true;
        }
    }

    /**
     * Remap a 3×3×3-segment box grid into a chamfered box. Grid coordinates sit at
     * ±H and ±H/3; outer rows stay on the face, inner rows move to (H − r) so every
     * face keeps a flat centre and a one-step bevel band. Edge/corner vertices are
     * pushed onto the rounding radius and take the rounding direction as normal,
     * giving smooth highlight roll-off across the chamfer.
     */
    function applyBevel(geo, hx, hy, hz, r) {
        const pos = geo.attributes.position;
        const nor = geo.attributes.normal;
        const ix = hx - r, iy = hy - r, iz = hz - r;
        const remap = (c, H, inner) => {
            const s = c < 0 ? -1 : 1;
            return Math.abs(c) > H * 0.67 ? s * H : s * inner;
        };
        for (let i = 0; i < pos.count; i++) {
            let x = remap(pos.getX(i), hx, ix);
            let y = remap(pos.getY(i), hy, iy);
            let z = remap(pos.getZ(i), hz, iz);
            const cx = Math.max(-ix, Math.min(ix, x));
            const cy = Math.max(-iy, Math.min(iy, y));
            const cz = Math.max(-iz, Math.min(iz, z));
            let nx = x - cx, ny = y - cy, nz = z - cz;
            const len = Math.hypot(nx, ny, nz);
            if (len > 1e-9) {
                nx /= len; ny /= len; nz /= len;
                x = cx + nx * r; y = cy + ny * r; z = cz + nz * r;
                nor.setXYZ(i, nx, ny, nz);
            }
            pos.setXYZ(i, x, y, z);
        }
        pos.needsUpdate = true;
        nor.needsUpdate = true;
        geo.computeBoundingBox();
        geo.computeBoundingSphere();
    }

    class BeveledBoxGeometry extends BaseBox {
        constructor(width = 1, height = 1, depth = 1, widthSegments = 1, heightSegments = 1, depthSegments = 1) {
            const explicitSegments = arguments.length > 3;
            const unit = width === 1 && height === 1 && depth === 1;
            const m = Math.min(Math.abs(width), Math.abs(height), Math.abs(depth));
            const maxDim = Math.max(Math.abs(width), Math.abs(height), Math.abs(depth));
            const isArch = maxDim >= 2.2;
            const r = isArch
                ? Math.min(CFG.archMax, m * CFG.archRatio)
                : Math.min(CFG.max, m * CFG.ratio);
            const plain = explicitSegments || unit || !(r >= CFG.min) || !isFinite(r) || !bevelEnabled();
            if (plain) {
                super(width, height, depth, widthSegments, heightSegments, depthSegments);
                return;
            }
            super(width, height, depth, 3, 3, 3);
            this.parameters = { width, height, depth, widthSegments: 1, heightSegments: 1, depthSegments: 1 };
            this.userData.bevel = r;
            applyBevel(this, Math.abs(width) * 0.5, Math.abs(height) * 0.5, Math.abs(depth) * 0.5, r);
        }
    }

    THREE.BoxGeometry = BeveledBoxGeometry;
    THREE.BoxBufferGeometry = BeveledBoxGeometry;
    BO.Bevel = { CFG, BaseBox, applyBevel };
})(window);
