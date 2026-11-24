/* ============================================================================
   BLACKOUT OPS — Survival Gold: readable, tactile gathering (BO.GM 'gather')
   · LOOK TARGET: the deposit you are looking at within 6 m gets a warm rim
     outline and a floating label: name, the tool that works it, what it gives
     and how broken it is.
   · ORE GLINT: veins near you pulse so ore reads at a glance.
   · STRIKE FEEL: every hit shakes the deposit, darkens it a crack stage and
     plays a material crunch whose pitch climbs with consecutive hits.
   · BURST + MAGNET: a broken deposit throws its items out; they arc to you and
     pop into the pack one after another.
   · PICKUP FEED: "+3 Fieldstone" lines with icons beside the hotbar, merged
     within a short window. Replaces the old "Found …" toast for every pickup.
   · REGROWTH: a picked deposit shows a small sprout before it fully regrows.
============================================================================ */
(function (BO) {
    'use strict';
    const GM = BO.GM;
    const data = BO.SurvivalFrontierData;

    const LOOK_RANGE = 6;
    const LOOK_COS = 0.94;
    const FEED_MERGE = 2.2;
    const FEED_LIFE = 3.2;
    const FEED_MAX = 5;
    const DROP_POOL = 28;
    const SPROUT_FRACTION = 0.3;
    const SPROUT_SCALE = 0.45;

    const MATERIAL = {
        kindling: 'wood', pine: 'wood', hardwood: 'wood',
        roots: 'plant', herbs: 'plant',
        clay: 'soil', buried: 'soil'
    };
    const TONE = {
        wood: { base: 196, noise: 900, type: 'lowpass', wave: 'triangle' },
        stone: { base: 330, noise: 2600, type: 'bandpass', wave: 'square' },
        plant: { base: 523, noise: 4200, type: 'highpass', wave: 'sine' },
        soil: { base: 147, noise: 500, type: 'lowpass', wave: 'triangle' }
    };
    const TOOL_WORD = { axe: 'axe', pick: 'pickaxe', shovel: 'shovel' };

    const itemName = (id) => data.items[id]?.[0] || GM.itemName(id);
    const itemColor = (id) => {
        for (const spec of Object.values(data.resources)) if (spec.gain[id]) return spec.color;
        return 0xd9c38a;
    };

    const Gather = {
        start(mode) {
            this.mode = mode;
            this.pack = mode.campaign.pack;
            this.target = null;
            this.outline = [];
            this.outlineMat = new THREE.MeshBasicMaterial({ color: 0xffd98a, side: THREE.BackSide, transparent: true, opacity: 0.85, depthWrite: false });
            this.shakes = new Map();
            this.tinted = new Set();
            this.combo = 0;
            this.lastHitAt = -9;
            this.origin = null;
            this.feedLines = new Map();
            this.drops = [];
            this.pool = [];
            this.nextSproutCheck = 0;
            this.nextTintCheck = 0;
            this.camDir = new THREE.Vector3();
            this.tmp = new THREE.Vector3();
            this.buildDom();
            this.buildPool();
            this.patch();
        },

        stop() {
            this.unpatch();
            this.clearOutline();
            this.outlineMat?.dispose();
            for (const d of this.pool) { d.mesh.removeFromParent(); d.mesh.geometry.dispose(); d.mesh.material.dispose(); }
            this.pool = [];
            this.drops = [];
            this.label?.remove();
            this.feedEl?.remove();
            this.label = this.feedEl = null;
            this.mode = this.pack = null;
        },

        /* ------------------------------------------------------------ setup */
        buildDom() {
            this.label = document.createElement('div');
            this.label.id = 'gm-look';
            this.label.className = 'gm-look hidden';
            document.body.appendChild(this.label);
            this.feedEl = document.createElement('div');
            this.feedEl.id = 'gm-feed';
            this.feedEl.className = 'gm-feed';
            document.body.appendChild(this.feedEl);
        },

        buildPool() {
            const geo = new THREE.OctahedronGeometry(0.11, 0);
            for (let i = 0; i < DROP_POOL; i++) {
                const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x332a10, roughness: 0.5 }));
                mesh.visible = false;
                this.mode.scene.add(mesh);
                this.pool.push({ mesh, busy: false });
            }
        },

        patch() {
            const self = this;
            const pack = this.pack;
            this._orig = { strike: pack.strike, showNode: pack.showNode };
            pack.strike = function (nodeId, toolId, strength) {
                const node = this.resources.get(nodeId);
                const before = node ? node.hp : 0;
                if (node) self.origin = { x: node.marker.x, y: node.marker.y + 0.6, z: node.marker.z };
                let res;
                try { res = self._orig.strike.call(this, nodeId, toolId, strength); }
                finally { self.origin = null; }
                if (node && node.hp < before) self.onHit(node, node.hp <= 0);
                return res;
            };
            pack.showNode = function (node, shown) {
                if (shown && node._sprout && node.hp > 0) self.endSprout(node);
                return self._orig.showNode.call(this, node, shown);
            };
        },

        unpatch() {
            if (!this._orig || !this.pack) return;
            this.pack.strike = this._orig.strike;
            this.pack.showNode = this._orig.showNode;
            this._orig = null;
        },

        /* ------------------------------------------------------------ strike feel */
        onHit(node, broke) {
            const m = this.mode;
            const kind = node.kind;
            const mat = MATERIAL[kind] || 'stone';
            this.combo = m.clock - this.lastHitAt < 1.5 ? Math.min(this.combo + 1, 12) : 0;
            this.lastHitAt = m.clock;
            this.playHit(mat, broke);
            this.shakes.set(node, { until: m.clock + (broke ? 0 : 0.18), amp: broke ? 0 : 0.05 });
            if (!broke) this.tint(node, 1 - node.hp / node.spec.strokes);
            else this.clearTint(node);
        },

        playHit(mat, broke) {
            const S = BO.Sound;
            if (!S?.playTone) return;
            S.ensureContext?.();
            const t = TONE[mat];
            const f = t.base * Math.pow(2, this.combo / 12);
            S.playTone(f, f * 0.82, broke ? 0.16 : 0.07, t.wave, broke ? 0.09 : 0.06);
            S.playNoise(broke ? 0.22 : 0.08, t.noise, t.type, 1.1, broke ? 0.22 : 0.13);
            if (broke) S.playTone(f * 1.5, f * 2, 0.14, 'sine', 0.06, 0.06);
        },

        tint(node, frac) {
            const k = 1 - 0.38 * Math.max(0, Math.min(1, frac));
            for (const mesh of node.geometry) {
                const mat = mesh.material;
                if (!mesh.userData.baseColor) mesh.userData.baseColor = mat.color.getHex();
                mat.color.setHex(mesh.userData.baseColor).multiplyScalar(k);
            }
            this.tinted.add(node);
            this.pack.batch?.touch(node);
        },

        clearTint(node) {
            for (const mesh of node.geometry) {
                if (mesh.userData.baseColor != null) mesh.material.color.setHex(mesh.userData.baseColor);
            }
            this.tinted.delete(node);
            this.pack.batch?.touch(node);
        },

        /* ------------------------------------------------------------ pickups */
        /** Called by SurvivalMode.grant with the items that made it into the pack. */
        feed(items) {
            const entries = Object.entries(items).filter(([, n]) => n > 0);
            if (!entries.length) return;
            if (this.origin) {
                // Items from a broken deposit fly out first and land in the feed as they arrive.
                const o = this.origin;
                let delay = 0;
                for (const [id, count] of entries) {
                    const pieces = Math.min(count, 4);
                    for (let i = 0; i < pieces; i++) {
                        const share = i === pieces - 1 ? count - Math.floor(count / pieces) * (pieces - 1) : Math.floor(count / pieces);
                        this.spawnDrop(o, id, share, delay);
                        delay += 0.06;
                    }
                }
                return;
            }
            for (const [id, count] of entries) this.addFeed(id, count);
            GM.sting('pickup');
        },

        spawnDrop(origin, id, count, delay) {
            const slot = this.pool.find((d) => !d.busy);
            if (!slot) { this.addFeed(id, count); return; }
            slot.busy = true;
            const a = Math.random() * Math.PI * 2;
            slot.id = id;
            slot.count = count;
            slot.t = -delay;
            slot.pos = new THREE.Vector3(origin.x, origin.y, origin.z);
            slot.vel = new THREE.Vector3(Math.cos(a) * 2.2, 3.6 + Math.random() * 1.2, Math.sin(a) * 2.2);
            slot.mesh.material.color.setHex(itemColor(id));
            slot.mesh.position.copy(slot.pos);
            slot.mesh.visible = false;
            this.drops.push(slot);
        },

        updateDrops(dt) {
            const p = BO.Player.pos;
            const target = this.tmp.set(p.x, p.y + 1.0, p.z);
            for (let i = this.drops.length - 1; i >= 0; i--) {
                const d = this.drops[i];
                d.t += dt;
                if (d.t < 0) continue;
                d.mesh.visible = true;
                if (d.t < 0.32) {
                    // Burst out of the deposit under gravity.
                    d.vel.y -= 14 * dt;
                    d.pos.addScaledVector(d.vel, dt);
                } else {
                    // Magnet: accelerate toward the player's chest.
                    const pull = Math.min(1, (d.t - 0.32) * 4.5);
                    d.pos.lerp(target, Math.min(1, dt * (5 + pull * 14)));
                }
                d.mesh.position.copy(d.pos);
                d.mesh.rotation.y += dt * 9;
                if (d.t > 0.32 && d.pos.distanceTo(target) < 0.35 || d.t > 1.6) {
                    d.busy = false;
                    d.mesh.visible = false;
                    this.drops.splice(i, 1);
                    this.addFeed(d.id, d.count);
                    GM.sting('pickup');
                }
            }
        },

        addFeed(id, count) {
            const now = this.mode.clock;
            let line = this.feedLines.get(id);
            if (line && now - line.at < FEED_MERGE) {
                line.count += count;
                line.at = now;
                line.el.querySelector('.n').textContent = '+' + line.count;
                line.el.classList.remove('bump');
                void line.el.offsetWidth;
                line.el.classList.add('bump');
                return;
            }
            if (line) line.el.remove();
            const el = document.createElement('div');
            el.className = 'gm-feed-line bump';
            const icon = BO.SurvivalIcons?.item ? BO.SurvivalIcons.item(id, 18) : '';
            el.innerHTML = '<span class="ico">' + icon + '</span><span class="n">+' + count + '</span><span class="nm">' + GM.esc(itemName(id)) + '</span>';
            this.feedEl.prepend(el);
            line = { id, count, at: now, el };
            this.feedLines.set(id, line);
            const lines = [...this.feedLines.values()].sort((a, b) => b.at - a.at);
            for (const old of lines.slice(FEED_MAX)) { old.el.remove(); this.feedLines.delete(old.id); }
        },

        updateFeed() {
            const now = this.mode.clock;
            for (const [id, line] of this.feedLines) {
                const age = now - line.at;
                if (age > FEED_LIFE) { line.el.remove(); this.feedLines.delete(id); }
                else line.el.style.opacity = age > FEED_LIFE - 0.6 ? String((FEED_LIFE - age) / 0.6) : '1';
            }
        },

        /* ------------------------------------------------------------ look target */
        findTarget() {
            const cam = BO.App?.worldCamera;
            if (!cam || this.mode.rider || BO.SurvivalUI?.open) return null;
            cam.getWorldDirection(this.camDir);
            const e = cam.position;
            let best = null;
            let bestScore = -Infinity;
            for (const node of this.pack.resources.values()) {
                if (node.hp <= 0) continue;
                const mk = node.marker;
                const dx = mk.x - e.x;
                const dz = mk.z - e.z;
                if (dx > LOOK_RANGE || dx < -LOOK_RANGE || dz > LOOK_RANGE || dz < -LOOK_RANGE) continue;
                const dy = mk.y + 0.4 - e.y;
                const d = Math.hypot(dx, dy, dz);
                if (d > LOOK_RANGE || d < 0.01) continue;
                const cos = (dx * this.camDir.x + dy * this.camDir.y + dz * this.camDir.z) / d;
                // Closer deposits get a wider cone so the one at your feet is easy to pick.
                if (cos < LOOK_COS - (1 - d / LOOK_RANGE) * 0.12) continue;
                const score = cos * 4 - d * 0.15;
                if (score > bestScore) { bestScore = score; best = node; }
            }
            return best;
        },

        setTarget(node) {
            if (node === this.target) return;
            this.clearOutline();
            this.target = node;
            if (!node) return;
            for (const mesh of node.geometry) {
                const o = new THREE.Mesh(mesh.geometry, this.outlineMat);
                o.position.copy(mesh.position);
                o.quaternion.copy(mesh.quaternion);
                o.scale.copy(mesh.scale).multiplyScalar(1.13);
                o.renderOrder = 2;
                o.userData.src = mesh;
                this.mode.scene.add(o);
                this.outline.push(o);
            }
        },

        clearOutline() {
            for (const o of this.outline) o.removeFromParent();
            this.outline = [];
            this.target = null;
        },

        labelHtml(node) {
            const { spec } = node;
            const pack = this.pack;
            let how;
            let cls = '';
            if (!spec.tool) how = 'bare hands';
            else {
                const tool = pack.pickTool(spec);
                if (tool) how = data.tools[tool]?.name || tool;
                else if (pack.handBreakable(spec)) { how = 'bare hands · slow'; cls = 'warn'; }
                else { how = 'needs ' + (spec.tier > 1 ? 'tier ' + spec.tier + ' ' : '') + TOOL_WORD[spec.tool]; cls = 'bad'; }
            }
            const claimed = !spec.tool && GM.get('threat')?.inClaim?.(node.marker.x, node.marker.z);
            const gives = Object.entries(spec.gain).map(([id, n]) => '+' + (claimed ? Math.max(1, Math.round(n * 0.5)) : n) + ' ' + GM.esc(itemName(id))).join(' · ');
            const frac = node.hp / spec.strokes;
            const bar = frac < 0.999 ? '<div class="bar"><i style="width:' + Math.round(frac * 100) + '%"></i></div>' : '';
            return '<b>' + GM.esc(spec.name) + '</b><span class="how ' + cls + '">' + GM.esc(how) + '</span><div class="gives">' + gives +
                (claimed ? ' <em>· picked-over ground</em>' : '') + '</div>' + bar;
        },

        updateLabel() {
            const node = this.target;
            const el = this.label;
            if (!node || !el) { el?.classList.add('hidden'); return; }
            const cam = BO.App.worldCamera;
            const v = this.tmp.set(node.marker.x, node.marker.y + 0.95, node.marker.z).project(cam);
            if (v.z > 1) { el.classList.add('hidden'); return; }
            const html = this.labelHtml(node);
            if (html !== this._lastHtml) { el.innerHTML = html; this._lastHtml = html; }
            el.style.left = ((v.x * 0.5 + 0.5) * window.innerWidth) + 'px';
            el.style.top = ((-v.y * 0.5 + 0.5) * window.innerHeight) + 'px';
            el.classList.remove('hidden');
        },

        /* ------------------------------------------------------------ per-frame */
        updateShakes() {
            const now = this.mode.clock;
            for (const [node, s] of this.shakes) {
                const done = now >= s.until;
                for (const mesh of node.geometry) {
                    if (mesh.userData.restPos == null) mesh.userData.restPos = mesh.position.clone();
                    if (done) mesh.position.copy(mesh.userData.restPos);
                    else {
                        const k = (s.until - now) / 0.18;
                        mesh.position.copy(mesh.userData.restPos);
                        mesh.position.x += (Math.random() - 0.5) * s.amp * 2 * k;
                        mesh.position.z += (Math.random() - 0.5) * s.amp * 2 * k;
                    }
                }
                if (done) {
                    for (const mesh of node.geometry) mesh.userData.restPos = null;
                    this.shakes.delete(node);
                }
            }
            for (const o of this.outline) o.position.copy(o.userData.src.position);
        },

        updateGlint() {
            const batch = this.pack.batch;
            if (!batch) return;
            const pulse = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(this.mode.clock * 3.2));
            for (const node of this.pack.resources.values()) {
                if (!node._batch?.live || node.hp <= 0 || node.spec.tool !== 'pick' || node.kind === 'boulder') continue;
                for (let i = 1; i < node.geometry.length; i++) node.geometry[i].material.emissiveIntensity = pulse;
            }
        },

        /** Picked deposits show a small sprout for the last stretch before they regrow. */
        updateSprouts() {
            const m = this.mode;
            const day = m.campaign.options?.dayLength || 360;
            for (const node of this.pack.resources.values()) {
                if (node.hp > 0 || node._sprout || !node.renewAt || node.spec.tool) continue;
                if (node.renewAt - m.clock > day * SPROUT_FRACTION) continue;
                this.beginSprout(node);
            }
            for (const node of this.tinted) if (node.hp >= node.spec.strokes) this.clearTint(node);
        },

        beginSprout(node) {
            const c = node.marker;
            node._sprout = true;
            for (const mesh of node.geometry) {
                mesh.userData.full = { pos: mesh.position.clone(), scale: mesh.scale.clone() };
                mesh.position.set(c.x + (mesh.position.x - c.x) * SPROUT_SCALE, c.y + (mesh.position.y - c.y) * SPROUT_SCALE, c.z + (mesh.position.z - c.z) * SPROUT_SCALE);
                mesh.scale.multiplyScalar(SPROUT_SCALE);
            }
            this._orig.showNode.call(this.pack, node, true);
            this.pack.batch?.touch(node);
        },

        endSprout(node) {
            node._sprout = false;
            for (const mesh of node.geometry) {
                const f = mesh.userData.full;
                if (!f) continue;
                mesh.position.copy(f.pos);
                mesh.scale.copy(f.scale);
                mesh.userData.full = null;
            }
            this.pack.batch?.touch(node);
        },

        update(dt) {
            if (!this.pack) return;
            const m = this.mode;
            this.setTarget(BO.Player.alive ? this.findTarget() : null);
            this.updateShakes();
            this.updateLabel();
            this.updateDrops(dt);
            this.updateFeed();
            this.updateGlint();
            if (m.clock >= this.nextSproutCheck) {
                this.nextSproutCheck = m.clock + 1;
                this.updateSprouts();
            }
        }
    };

    GM.register('gather', Gather);
})(window.BO);
