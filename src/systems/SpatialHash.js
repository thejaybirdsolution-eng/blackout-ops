/* ============================================================================
   BLACKOUT OPS — Zero-Allocation 2D Spatial Hash Grid
   Zero-build IIFE module (ADR-002).
   Used by Survival markers & prompts to query nearby entries in O(1) cell
   lookups instead of linear 1,000+ element scans per frame.
   ============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO = global.BO || {};

    class SpatialHash {
        constructor(cellSize = 12) {
            this.cellSize = Math.max(1, Number(cellSize) || 12);
            this.inv = 1 / this.cellSize;
            this.buckets = new Map();
            this.itemCell = new WeakMap();
        }

        _hash(cx, cz) {
            // Bijective signed integer pair key in Safe Integer range (|cx|,|cz| < 32768)
            return ((cx + 32768) * 65536) + (cz + 32768);
        }

        _cellCoord(v) {
            return Math.floor(v * this.inv);
        }

        insert(item, x, z) {
            if (!item || !Number.isFinite(x) || !Number.isFinite(z)) return;
            const prevKey = this.itemCell.get(item);
            const cx = this._cellCoord(x);
            const cz = this._cellCoord(z);
            const key = this._hash(cx, cz);
            if (prevKey === key) return;
            if (prevKey !== undefined) {
                const prevBucket = this.buckets.get(prevKey);
                if (prevBucket) {
                    const idx = prevBucket.indexOf(item);
                    if (idx !== -1) prevBucket.splice(idx, 1);
                }
            }
            let bucket = this.buckets.get(key);
            if (!bucket) {
                bucket = [];
                this.buckets.set(key, bucket);
            }
            bucket.push(item);
            this.itemCell.set(item, key);
        }

        remove(item) {
            if (!item) return;
            const key = this.itemCell.get(item);
            if (key === undefined) return;
            const bucket = this.buckets.get(key);
            if (bucket) {
                const idx = bucket.indexOf(item);
                if (idx !== -1) bucket.splice(idx, 1);
            }
            this.itemCell.delete(item);
        }

        clear() {
            this.buckets.clear();
            this.itemCell = new WeakMap();
        }

        /**
         * Appends candidate items within [x-radius, x+radius] x [z-radius, z+radius]
         * into caller-provided `out` array (zero allocations when `out` is reused).
         */
        queryNear(x, z, radius, out = []) {
            out.length = 0;
            const minX = this._cellCoord(x - radius);
            const maxX = this._cellCoord(x + radius);
            const minZ = this._cellCoord(z - radius);
            const maxZ = this._cellCoord(z + radius);
            for (let cx = minX; cx <= maxX; cx++) {
                for (let cz = minZ; cz <= maxZ; cz++) {
                    const bucket = this.buckets.get(this._hash(cx, cz));
                    if (!bucket) continue;
                    for (let i = 0; i < bucket.length; i++) {
                        out.push(bucket[i]);
                    }
                }
            }
            return out;
        }
    }

    BO.SpatialHash = SpatialHash;
})(window);
