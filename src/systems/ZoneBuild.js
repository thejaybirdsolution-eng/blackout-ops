/* ============================================================================
   BLACKOUT OPS — Zone construction: snap building and structural integrity
   - Build mode shows a ghost that follows your aim and snaps to a 2.8 m modular
     grid: foundations to the world grid, floors to neighbouring floors, walls to
     floor edges or onto other walls, upper floors and roofs onto wall tops.
   - Every structural piece carries support (0–100%). Ground contact gives 100%;
     each step up loses a little, each step out loses more (stone carries further
     than timber). Nothing can be placed without support, and when a supporting
     piece is destroyed everything that depended on it collapses.
   - In build mode, every structure is tinted by its integrity.
============================================================================ */
(function (BO) {
    'use strict';

    const G = 2.8;
    const ROOF_OFF = 2.72; // legacy placement offset used by SurvivalCampaign.place for roofs
    const STRUCT = {
        floor: { kind: 'floor', mat: 'wood' }, stoneFloor: { kind: 'floor', mat: 'stone' },
        catwalk: { kind: 'floor', mat: 'stone' },
        roof: { kind: 'floor', mat: 'wood', roof: true }, platform: { kind: 'block', mat: 'wood' },
        woodStairs: { kind: 'block', mat: 'wood' }, stoneStairs: { kind: 'block', mat: 'stone' }, obsidianStairs: { kind: 'block', mat: 'stone' },
        wall: { kind: 'wall', mat: 'wood' }, stoneWall: { kind: 'wall', mat: 'stone' },
        obsidianWall: { kind: 'wall', mat: 'stone' }, door: { kind: 'wall', mat: 'stone', door: true },
        woodDoor: { kind: 'wall', mat: 'wood', door: true }, ironDoor: { kind: 'wall', mat: 'stone', door: true }, doubleGate: { kind: 'wall', mat: 'stone', door: true },
        halfWall: { kind: 'wall', mat: 'wood' }, stoneHalfWall: { kind: 'wall', mat: 'stone' },
        windowWall: { kind: 'wall', mat: 'wood' }, archway: { kind: 'wall', mat: 'stone' },
        railing: { kind: 'wall', mat: 'wood' }, pillar: { kind: 'wall', mat: 'stone' }
    };
    const LOSS = { wood: { v: 0.12, h: 0.3 }, stone: { v: 0.06, h: 0.2 } };
    /** Structural hit points: a timber wall holds a few minutes of clawing, masonry much longer, obsidian holds against anything. */
    const HP = {
        floor: 260, wall: 220, roof: 160, platform: 300, stoneFloor: 640, stoneWall: 560, obsidianWall: 1400, door: 420,
        woodStairs: 280, stoneStairs: 620, obsidianStairs: 1350,
        woodDoor: 240, ironDoor: 580, doubleGate: 520,
        halfWall: 180, stoneHalfWall: 420, windowWall: 210, archway: 520,
        catwalk: 360, railing: 140, pillar: 680
    };
    const E = 0.08;

    const tmpV = new THREE.Vector3();

    function boxOf(piece) {
        const [w, h, d] = piece.size;
        const bottom = piece.y + (piece.type === 'roof' ? ROOF_OFF : 0);
        return { minX: piece.x - w / 2, maxX: piece.x + w / 2, minY: bottom, maxY: bottom + h, minZ: piece.z - d / 2, maxZ: piece.z + d / 2 };
    }
    const overlap1 = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0);

    /** Integrity colour: blue (solid) → green → yellow → red (barely holding). */
    function supportColor(s, out) {
        if (s > 0.85) return out.setHex(0x4aa3ff);
        if (s > 0.55) return out.setHex(0x52d483);
        if (s > 0.3) return out.setHex(0xf2c94c);
        return out.setHex(0xff5a4a);
    }

    class ZoneBuild {
        constructor() {
            this.type = null;
            this.rot = 0;
            this.ghost = null;
            this.falling = [];
            this.tint = false;
        }

        get mode() { return BO.SurvivalMode; }
        get campaign() { return BO.SurvivalMode.campaign; }
        get active() { return !!this.type; }
        isStruct(type) { return !!STRUCT[type]; }

        structural() {
            return this.campaign.placed.filter((p) => p.alive && STRUCT[p.type]);
        }

        /* ------------------------------------------------------------ integrity */
        groundedBox(b) {
            const W = BO.World;
            let lo = Infinity;
            for (const [x, z] of [[b.minX + 0.2, b.minZ + 0.2], [b.maxX - 0.2, b.minZ + 0.2], [b.minX + 0.2, b.maxZ - 0.2], [b.maxX - 0.2, b.maxZ - 0.2], [(b.minX + b.maxX) / 2, (b.minZ + b.maxZ) / 2]]) {
                lo = Math.min(lo, W.terrainHeight(x, z));
            }
            return b.minY - lo < 0.45;
        }

        /** Link type from b (supporter) to a: 'v' if a rests on b, 'h' if side by side, else null. */
        link(a, b) {
            const ox = overlap1(a.minX, a.maxX, b.minX, b.maxX), oz = overlap1(a.minZ, a.maxZ, b.minZ, b.maxZ);
            if (ox < -E || oz < -E) return null;
            if (Math.abs(a.minY - b.maxY) < 0.16 && ox > 0.04 && oz > 0.04) return 'v';
            const oy = overlap1(a.minY, a.maxY, b.minY, b.maxY);
            if (oy > -0.02 && (ox > 0.25 || oz > 0.25)) return 'h';
            return null;
        }

        /** Max-propagation of support over the structure graph (plus an optional candidate). */
        solve(extra = null) {
            const list = this.structural().map((p) => ({ p, b: boxOf(p), mat: STRUCT[p.type].mat, s: 0 }));
            if (extra) list.push({ p: extra, b: boxOf(extra), mat: STRUCT[extra.type].mat, s: 0, extra: true });
            for (const n of list) n.s = this.groundedBox(n.b) ? 1 : 0;
            const links = list.map(() => []);
            for (let i = 0; i < list.length; i++) for (let j = 0; j < list.length; j++) {
                if (i === j) continue;
                const t = this.link(list[i].b, list[j].b);
                if (t) links[i].push([j, t]);
            }
            for (let pass = 0; pass < 40; pass++) {
                let changed = false;
                for (let i = 0; i < list.length; i++) {
                    if (list[i].s >= 1) continue;
                    const loss = LOSS[list[i].mat];
                    let best = list[i].s;
                    for (const [j, t] of links[i]) {
                        const v = list[j].s - (t === 'v' ? loss.v : loss.h);
                        if (v > best) best = v;
                    }
                    if (best > list[i].s + 1e-4) { list[i].s = best; changed = true; }
                }
                if (!changed) break;
            }
            for (const n of list) if (!n.extra) n.p.support = Math.max(0, n.s);
            return extra ? Math.max(0, list[list.length - 1].s) : null;
        }

        /** Recompute support and bring down anything left hanging. */
        settle() {
            this.solve();
            const doomed = this.structural().filter((p) => (p.support ?? 1) < 0.05);
            if (!doomed.length) { this.refreshTint(); return; }
            for (const p of doomed) this.collapse(p);
            // Furniture standing on collapsed floors falls with them.
            for (const p of this.campaign.placed) {
                if (!p.alive || STRUCT[p.type]) continue;
                const onDoomed = doomed.some((d) => { const b = boxOf(d); return p.x > b.minX && p.x < b.maxX && p.z > b.minZ && p.z < b.maxZ && Math.abs(p.y - b.maxY) < 0.3; });
                if (onDoomed) this.collapse(p);
            }
            this.mode.toast(doomed.length + ' unsupported piece' + (doomed.length === 1 ? '' : 's') + ' collapsed.');
            BO.Sound?.playExplosion?.(0.25);
            this.settle();
        }

        collapse(piece) {
            const m = this.mode;
            piece.alive = false;
            if (piece.part) {
                piece.part.hp = 0;
                m.removeSolid(piece.part.mesh, piece.part.collider);
            }
            const marker = m.markers.find((mk) => mk.id === 'build:' + piece.id);
            if (marker) marker.alive = false;
            BO.ZoneArmory?.onPieceRemoved?.(piece);
            BO.ZoneWorldPlus?.onPieceRemoved?.(piece);
            const mesh = piece.mesh;
            if (mesh) {
                this.falling.push({ mesh, vy: 0, spin: (Math.random() - 0.5) * 3, t: 0 });
                BO.FX.spawnParticles(mesh.position.clone(), 10, STRUCT[piece.type]?.mat === 'stone' ? 0xbe9580 : 0xaa8254, 4, 9, 0.6);
            }
        }

        /** Called by SurvivalMode when a build piece is destroyed by damage. */
        onPieceLost(piece) {
            if (!piece) return;
            BO.ZoneArmory?.onPieceRemoved?.(piece);
            BO.ZoneWorldPlus?.onPieceRemoved?.(piece);
            if (!STRUCT[piece.type]) return;
            this.settle();
        }

        /* ------------------------------------------------------------ build mode */
        begin(type) {
            const spec = BO.SurvivalCampaignData.build.find((b) => b.id === type);
            if (!spec) return false;
            const c = this.campaign;
            if (spec.tech && c.deep && !c.deep.hasTech(spec.tech)) {
                const node = BO.SurvivalDeepData?.techTree.find((t) => t.id === spec.tech);
                this.mode.toast('Research “' + (node?.name || spec.tech) + '” in Skills first.');
                return false;
            }
            this.end(true);
            this.type = type;
            this.spec = spec;
            const geo = new THREE.BoxGeometry(1, 1, 1);
            const mat = new THREE.MeshBasicMaterial({ color: 0x52d483, transparent: true, opacity: 0.38, depthWrite: false });
            this.ghost = new THREE.Mesh(geo, mat);
            const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
            this.ghost.add(edges);
            this.ghost.renderOrder = 10;
            this.mode.scene.add(this.ghost);
            this.ensureLabel();
            this.tint = true;
            this.solve();
            this.refreshTint();
            return true;
        }

        end(silent = false) {
            if (!this.type && !this.ghost) return;
            this.type = null;
            if (this.ghost) { this.ghost.removeFromParent(); this.ghost.geometry.dispose(); this.ghost = null; }
            if (this.label) this.label.hidden = true;
            this.tint = false;
            this.refreshTint();
            if (!silent) this.mode.toast('Left build mode.');
        }

        rotate() { this.rot = (this.rot + 1) % 4; }

        ensureLabel() {
            if (this.label) { this.label.hidden = false; return; }
            const el = document.createElement('div');
            el.id = 'zb-label';
            el.className = 'zb-label';
            document.getElementById('hud-layer')?.appendChild(el) || document.body.appendChild(el);
            this.label = el;
        }

        refreshTint() {
            const col = new THREE.Color();
            for (const p of this.campaign?.placed || []) {
                if (!p.alive || !p.mesh || !STRUCT[p.type]) continue;
                const m = p.mesh.material;
                if (this.tint) {
                    supportColor(p.support ?? 1, col);
                    m.emissive.copy(col);
                    m.emissiveIntensity = 0.16;
                } else {
                    m.emissive.setHex(0x000000);
                    m.emissiveIntensity = 0;
                }
            }
        }

        /** Aim point: what the crosshair touches within 9 m (or the ground under that point). */
        aimPoint() {
            const cam = BO.App.worldCamera;
            const origin = cam.position.clone();
            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).normalize();
            if (this.ghost) this.ghost.visible = false;
            const hit = BO.World.raycastWorld(origin, dir, 9);
            if (this.ghost) this.ghost.visible = true;
            if (hit) return { x: hit.point.x, y: hit.point.y, z: hit.point.z, normal: hit.face?.normal, object: hit.object, origin, dir, dist: hit.distance };
            const p = origin.clone().addScaledVector(dir, 6);
            return { x: p.x, y: BO.World.getGroundHeight(p.x, p.z, p.y + 1), z: p.z, origin, dir, dist: 9 };
        }

        orientedSize(alongX) {
            const s = this.spec.size;
            return alongX ? [s[0], s[1], s[2]] : [s[2], s[1], s[0]];
        }

        /** All snap candidates for the current type, as { x, bottom, z, size }. */
        candidates(aim) {
            const type = this.type;
            const st = STRUCT[type];
            const mine = this.structural().map((p) => ({ p, b: boxOf(p), k: STRUCT[p.type].kind }));
            const out = [];
            const s = this.spec.size;
            if (st.kind === 'floor' || st.kind === 'block') {
                const fs = [s[0], s[1], s[2]];
                for (const { b, k } of mine) {
                    const cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
                    if (k === 'floor' || k === 'block') {
                        // Neighbouring cells at the same top height.
                        const top = b.maxY - fs[1];
                        for (const [dx, dz] of [[G, 0], [-G, 0], [0, G], [0, -G]]) out.push({ x: cx + dx, bottom: top, z: cz + dz, size: fs });
                    } else if (k === 'wall') {
                        // Upper floor / roof resting on a wall top, on either side.
                        const alongX = (b.maxX - b.minX) > (b.maxZ - b.minZ);
                        const n = alongX ? [[0, G / 2], [0, -G / 2]] : [[G / 2, 0], [-G / 2, 0]];
                        for (const [dx, dz] of n) out.push({ x: cx + dx, bottom: b.maxY, z: cz + dz, size: fs });
                    }
                }
                if (!st.roof) {
                    // Free foundation on the world grid.
                    const gx = Math.round(aim.x / G) * G, gz = Math.round(aim.z / G) * G;
                    let hi = -Infinity, lo = Infinity;
                    for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]]) {
                        const h = BO.World.terrainHeight(gx + ox * (G / 2 - 0.2), gz + oz * (G / 2 - 0.2));
                        hi = Math.max(hi, h); lo = Math.min(lo, h);
                    }
                    out.push({ x: gx, bottom: hi - 0.04, z: gz, size: fs, ground: true, steep: hi - lo > 1.3 });
                }
            } else if (st.kind === 'wall') {
                for (const { b, k } of mine) {
                    const cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
                    if (k === 'floor' || k === 'block') {
                        for (const [dx, dz, alongX] of [[0, G / 2, true], [0, -G / 2, true], [G / 2, 0, false], [-G / 2, 0, false]]) {
                            out.push({ x: cx + dx, bottom: b.maxY, z: cz + dz, size: this.orientedSize(alongX) });
                        }
                    } else if (k === 'wall') {
                        const alongX = (b.maxX - b.minX) > (b.maxZ - b.minZ);
                        out.push({ x: cx, bottom: b.maxY, z: cz, size: this.orientedSize(alongX) });
                    }
                }
                // Free-standing wall on a grid edge.
                const alongX = (this.rot % 2 === 0) === (Math.abs(Math.sin(BO.Player.yaw)) < 0.7071);
                const gx = alongX ? Math.round(aim.x / G) * G : Math.round((aim.x - G / 2) / G) * G + G / 2;
                const gz = alongX ? Math.round((aim.z - G / 2) / G) * G + G / 2 : Math.round(aim.z / G) * G;
                const h = BO.World.getGroundHeight(gx, gz, aim.y + 0.6);
                out.push({ x: gx, bottom: h - 0.05, z: gz, size: this.orientedSize(alongX), ground: true });
            }
            return out;
        }

        occupied(cand) {
            const b = { minX: cand.x - cand.size[0] / 2, maxX: cand.x + cand.size[0] / 2, minY: cand.bottom, maxY: cand.bottom + cand.size[1], minZ: cand.z - cand.size[2] / 2, maxZ: cand.z + cand.size[2] / 2 };
            for (const p of this.campaign.placed) {
                if (!p.alive || !p.size) continue;
                const o = boxOf(p);
                if (overlap1(b.minX, b.maxX, o.minX, o.maxX) > 0.2 && overlap1(b.minZ, b.maxZ, o.minZ, o.maxZ) > 0.2 && overlap1(b.minY, b.maxY, o.minY, o.maxY) > 0.1) return true;
            }
            return false;
        }

        /** Evaluate the current aim: the chosen placement and why it can or cannot be built. */
        evaluate() {
            const aim = this.aimPoint();
            const p = BO.Player;
            const type = this.type;
            let cand;
            if (STRUCT[type]) {
                // Score each snap by how close its centre lies to the aim ray (what you are pointing near),
                // preferring attached snaps over free foundations.
                let best = null, bd = Infinity;
                const o = aim.origin, dv = aim.dir, tMax = Math.min(9, aim.dist + 1.6);
                for (const c of this.candidates(aim)) {
                    if (this.occupied(c)) continue;
                    const cy = c.bottom + c.size[1] / 2;
                    tmpV.set(c.x - o.x, cy - o.y, c.z - o.z);
                    const t = BO.Math.clamp(tmpV.dot(dv), 0, tMax);
                    const rx = o.x + dv.x * t - c.x, ry = o.y + dv.y * t - cy, rz = o.z + dv.z * t - c.z;
                    const d = Math.hypot(rx, ry, rz) + (c.ground ? 0.8 : 0) + (t >= tMax ? 0.6 : 0);
                    if (d < bd) { bd = d; best = c; }
                }
                cand = best && bd < 2.2 ? best : null;
            } else {
                const turn = (Math.round(p.yaw / (Math.PI / 2)) + this.rot) % 2;
                const size = turn ? [this.spec.size[2], this.spec.size[1], this.spec.size[0]] : this.spec.size;
                const x = Math.round(aim.x * 4) / 4, z = Math.round(aim.z * 4) / 4;
                cand = { x, z, bottom: BO.World.getGroundHeight(x, z, aim.y + 0.3), size };
            }
            if (!cand) return { ok: false, why: 'Aim at the ground, a floor edge or a wall top' };
            const res = { cand, ok: true, why: '', support: 1 };
            const dist = Math.hypot(cand.x - p.pos.x, cand.z - p.pos.z);
            if (dist > 8) { res.ok = false; res.why = 'Too far away'; }
            const B = BO.Zone.BOUNDS;
            if (cand.x < B.minX + 16 || cand.x > B.maxX - 16 || cand.z < B.minZ + 16 || cand.z > B.maxZ - 16) { res.ok = false; res.why = 'Outside the buildable Zone'; }
            if (BO.Zone.regionAt(cand.x, cand.z).threat >= 4) { res.ok = false; res.why = 'The ground here is too unstable'; }
            if (cand.steep) { res.ok = false; res.why = 'Too steep for a foundation'; }
            if (BO.World.terrainHeight(cand.x, cand.z) < BO.Zone.WATER && BO.Zone.inReservoir(cand.x, cand.z)) { res.ok = false; res.why = 'Cannot build in deep water'; }
            const piece = { x: cand.x, z: cand.z, y: cand.bottom - (type === 'roof' ? ROOF_OFF : 0), size: cand.size, type };
            if (STRUCT[type]) {
                res.support = this.solve(piece);
                if (res.support < 0.1 && res.ok) { res.ok = false; res.why = 'No support — build from a foundation or wall'; }
            } else if (this.occupied(cand) && res.ok) { res.ok = false; res.why = 'Something is already there'; }
            // Generic collision with the world (structures that only touch are fine).
            if (res.ok) {
                const { size } = cand;
                const bottom = cand.bottom;
                let blocked = false;
                BO.World.queryColliders(cand.x - size[0] / 2, cand.z - size[2] / 2, cand.x + size[0] / 2, cand.z + size[2] / 2, (c) => {
                    if (c.active && !c.tree && !c.structure && c.maxY > bottom + 0.1 && c.minY < bottom + size[1] - 0.06 &&
                        c.maxX > cand.x - size[0] / 2 + 0.1 && c.minX < cand.x + size[0] / 2 - 0.1 &&
                        c.maxZ > cand.z - size[2] / 2 + 0.1 && c.minZ < cand.z + size[2] / 2 - 0.1) { blocked = true; return true; }
                    return false;
                });
                if (blocked) { res.ok = false; res.why = 'Blocked'; }
                if (res.ok && STRUCT[type]?.kind === 'wall') {
                    const px = p.pos.x, pz = p.pos.z;
                    if (px > cand.x - size[0] / 2 - 0.35 && px < cand.x + size[0] / 2 + 0.35 && pz > cand.z - size[2] / 2 - 0.35 && pz < cand.z + size[2] / 2 + 0.35 &&
                        p.pos.y < bottom + size[1] && p.pos.y + 1.8 > bottom) { res.ok = false; res.why = 'You are standing there'; }
                }
            }
            if (res.ok && this.campaign.placed.filter((x) => x.alive).length >= 160) { res.ok = false; res.why = 'Structure limit reached (160)'; }
            res.piece = piece;
            return res;
        }

        update(dt) {
            // Falling debris.
            for (let i = this.falling.length - 1; i >= 0; i--) {
                const f = this.falling[i];
                f.t += dt; f.vy -= 14 * dt;
                f.mesh.position.y += f.vy * dt;
                f.mesh.rotation.x += f.spin * dt;
                f.mesh.rotation.z += f.spin * 0.6 * dt;
                if (f.t > 1.4) { f.mesh.visible = false; this.falling.splice(i, 1); }
            }
            if (!this.type) return;
            const m = this.mode;
            if (!m.active || !BO.Player.alive || BO.SurvivalUI.open) { if (this.ghost) this.ghost.visible = !BO.SurvivalUI.open && this.ghost.visible; }
            const r = this.last = this.evaluate();
            const g = this.ghost;
            if (!r.cand) {
                g.visible = false;
            } else {
                g.visible = true;
                const { cand } = r;
                g.scale.set(cand.size[0], cand.size[1], cand.size[2]);
                g.position.set(cand.x, cand.bottom + cand.size[1] / 2, cand.z);
                const col = new THREE.Color();
                if (!r.ok) col.setHex(0xff5a4a); else if (STRUCT[this.type]) supportColor(r.support, col); else col.setHex(0x52d483);
                g.material.color.copy(col);
            }
            const cost = typeof this.spec.cost === 'number' ? { scrap: this.spec.cost } : this.spec.cost;
            const afford = Object.entries(cost).every(([id, n]) => (m.points[id] || 0) >= n);
            const kb = BO.Settings.getKeybinds();
            const integ = STRUCT[this.type] && r.cand ? ' · integrity <b class="' + (r.support > 0.55 ? 'ok' : r.support > 0.3 ? 'mid' : 'low') + '">' + Math.round(r.support * 100) + '%</b>' : '';
            const html = `<div class="zb-title">${this.spec.name}${integ}</div>
                <div class="zb-cost ${afford ? '' : 'short'}">${BO.SurvivalItemAmounts(cost)}${afford ? '' : ' · not enough materials'}</div>
                ${r.ok ? '' : `<div class="zb-why">${r.why}</div>`}
                <div class="zb-keys"><span><kbd>LMB</kbd> place</span><span><kbd>R</kbd> rotate</span><span><kbd>RMB</kbd>/<kbd>${BO.Settings.keyLabel(kb.survBuild)}</kbd> exit</span></div>`;
            if (this._html !== html) { this.label.innerHTML = html; this._html = html; }
        }

        place() {
            if (!this.type) return false;
            const m = this.mode;
            const c = this.campaign;
            const r = this.evaluate();
            if (!r.ok) { m.toast(r.why || 'Cannot build here.'); BO.Sound.playEmptyClick?.(); return false; }
            const cost = typeof this.spec.cost === 'number' ? { scrap: this.spec.cost } : this.spec.cost;
            if (!m.spend(cost)) { m.toast('Required: ' + BO.SurvivalItemAmounts(cost)); return false; }
            const id = String(c.placed.length);
            c.place({ ...r.piece, id, alive: true });
            const piece = c.placed[c.placed.length - 1];
            this.afterPlace(piece, true);
            c.mark('built', 1, 19);
            BO.Sound?.playMelee?.();
            BO.FX.spawnParticles(new THREE.Vector3(r.cand.x, r.cand.bottom + 0.2, r.cand.z), 6, 0xd8c39a, 2, 6, 0.4);
            BO.ZoneDirector?.noise?.(r.cand.x, r.cand.z, 30, 'build');
            this.solve();
            this.refreshTint();
            return true;
        }

        /** Structural colliders are breakable: the nav grid treats them as soft walls hordes can tear through. */
        afterPlace(piece, fresh = false) {
            const part = piece.part;
            if (!part?.collider) return;
            // Real surfaces instead of flat colours: planks, fortified timber, masonry, steel doors.
            const key = { floor: 'wood_plank', wall: 'wood_fort', roof: 'dark_slate_roof', platform: 'wood_crate', stoneFloor: 'castle_stone', stoneWall: 'brick', door: 'diamond_plate' }[piece.type];
            if (key && piece.mesh && !piece.mesh.userData.textured) {
                const [w, h, d] = piece.size;
                const mat = BO.Textures.getWorldMaterial(key, Math.max(w, d), h).clone();
                piece.mesh.material.dispose();
                piece.mesh.material = mat;
                piece.mesh.userData.textured = true;
                piece.mesh.castShadow = piece.mesh.receiveShadow = true;
            }
            part.collider.structure = true;
            const fortMult = 1 + (BO.SurvivalCareer?.masteryRank?.('fortifier') || 0) * 0.2;
            const base = Math.round((HP[piece.type] || 200) * (this.campaign.deep?.modFx?.structureHpMult || 1) * fortMult);
            part.maxHp = base;
            if (fresh) part.hp = base;
            else part.hp = Math.min(base, part.hp);
            BO.World.notifyColliderChanged?.(part.collider);
        }

        /** After a checkpoint restore: flag colliders and compute support (no collapse on load). */
        restored() {
            for (const p of this.campaign.placed) if (p.alive) this.afterPlace(p);
            this.solve();
        }
    }

    BO.ZoneBuild = new ZoneBuild();
    BO.ZoneBuild.boxOf = boxOf;
})(window.BO);
