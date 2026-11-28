/* ============================================================================
   BLACKOUT OPS — SunShadow: stable, camera-following sun shadows

   Before: arena maps used one fixed shadow box at the map origin (anything
   past ~36 m had no shadow), Survival stretched a 2048 map over ±85 m (blurry
   8 cm texels), and the Open World re-centred on the player every frame with
   no snapping, so shadow edges crawled whenever you moved.

   Now, every frame before the world renders:
   • maps that fit inside the quality extent are framed once, tightly;
   • larger worlds get a shadow box that follows the camera, biased toward
     where you are looking, and is snapped to whole shadow-map texels in light
     space, so edges stay rock steady while you walk, strafe or turn;
   • extent, bias and filter softness scale with the graphics preset, and the
     Open World keeps its time-of-day sun direction.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const _basis = new THREE.Matrix4(), _basisInv = new THREE.Matrix4();
    const _c = new THREE.Vector3(), _f = new THREE.Vector3(), _d = new THREE.Vector3(), _zero = new THREE.Vector3();
    const UP = new THREE.Vector3(0, 1, 0), UPZ = new THREE.Vector3(0, 0, 1);

    const EXTENT = { low: 0, medium: 30, high: 38, ultra: 48 };

    const SunShadow = {
        scene: null,
        sun: null,
        offset: new THREE.Vector3(30, 60, 20),
        mapCenter: new THREE.Vector3(),
        mapHalf: Infinity,
        stats: { mode: 'none', extent: 0, texel: 0 },

        _bind(scene) {
            this.scene = scene;
            this.sun = scene.children.find((o) => o.isDirectionalLight && o.castShadow) || null;
            if (!this.sun) return;
            const sun = this.sun;
            if (!sun.target.parent) scene.add(sun.target);
            this.offset.copy(sun.position).sub(sun.target.position);
            if (this.offset.lengthSq() < 4) this.offset.set(30, 60, 20);
            // Playable bounds from the map's boxes (arena maps) or its declared size (terrain worlds).
            const md = BO.World.mapData || {};
            let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
            for (const b of md.boxes || []) {
                const hw = (b.w || 0) / 2, hd = (b.d || 0) / 2;
                if (b.x - hw < minX) minX = b.x - hw; if (b.x + hw > maxX) maxX = b.x + hw;
                if (b.z - hd < minZ) minZ = b.z - hd; if (b.z + hd > maxZ) maxZ = b.z + hd;
            }
            const large = BO.World.large || md.mode === 'survival' || md.mode === 'owrpg' || !isFinite(minX);
            if (large) { this.mapHalf = Infinity; return; }
            this.mapCenter.set((minX + maxX) / 2, 0, (minZ + maxZ) / 2);
            this.mapHalf = Math.max(maxX - minX, maxZ - minZ) / 2 + 3;
        },

        update(camera) {
            const scene = BO.World && BO.World.scene;
            if (!scene || !camera) return;
            if (scene !== this.scene || (this.sun && this.sun.parent !== scene)) this._bind(scene);
            const sun = this.sun;
            if (!sun || !sun.castShadow || !sun.shadow) return;
            const q = BO.Settings.getQualityPreset();
            if (!q.shadows) return;
            const mode = BO.State.activeMode;
            const open = mode === 'owrpg' || mode === 'survival';
            let ext = (EXTENT[q.name] || 38) * (open ? 1.3 : 1);
            // The Open World animates the sun (time of day); keep its current direction.
            const offset = mode === 'owrpg' ? _d.copy(sun.position).sub(sun.target.position) : this.offset;
            if (offset.lengthSq() < 4) offset.set(30, 60, 20);
            let follow = true;
            if (!open && this.mapHalf <= ext) {
                // Whole map fits: frame it tightly and leave it still.
                ext = this.mapHalf;
                _c.copy(this.mapCenter);
                follow = false;
            } else {
                camera.getWorldDirection(_f);
                _f.y = 0;
                if (_f.lengthSq() < 1e-6) _f.set(0, 0, -1);
                _f.normalize();
                _c.copy(camera.position).addScaledVector(_f, ext * 0.42);
                _c.y = camera.position.y - 1.6;
            }
            const cam = sun.shadow.camera;
            const dist = offset.length();
            if (Math.abs(cam.right - ext) > 1e-3 || Math.abs(cam.far - (dist + ext * 2.5)) > 0.5) {
                cam.left = -ext; cam.right = ext; cam.top = ext; cam.bottom = -ext;
                cam.near = 0.5;
                cam.far = dist + ext * 2.5;
                cam.updateProjectionMatrix();
                // Bias tuned to texel size: larger boxes need a little more normal offset.
                const texel = (2 * ext) / sun.shadow.mapSize.x;
                sun.shadow.bias = -0.00025 - texel * 0.0015;
                sun.shadow.normalBias = Math.min(0.06, 0.012 + texel * 0.55);
            }
            // Snap the box centre to whole texels in light space so edges never crawl.
            const texel = (2 * ext) / sun.shadow.mapSize.x;
            _d.copy(offset).normalize();
            _basis.lookAt(_d, _zero, Math.abs(_d.y) > 0.98 ? UPZ : UP);
            _basisInv.copy(_basis).transpose();
            _c.applyMatrix4(_basisInv);
            _c.x = Math.round(_c.x / texel) * texel;
            _c.y = Math.round(_c.y / texel) * texel;
            _c.applyMatrix4(_basis);
            sun.target.position.copy(_c);
            sun.position.copy(_c).add(offset);
            sun.target.updateMatrixWorld();
            this.stats.mode = follow ? 'follow' : 'framed';
            this.stats.extent = ext;
            this.stats.texel = texel;
        }
    };

    BO.SunShadow = SunShadow;
})(window);
