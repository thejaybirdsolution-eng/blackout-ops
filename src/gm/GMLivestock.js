/* ============================================================================
   BLACKOUT OPS — Survival Gold: livestock (BO.GM 'livestock')
   Closes the hunt → farm → kitchen loop with two buildable pens.
   · CHICKEN COOP (farm tab): set wild eggs (pheasants drop them) in the coop;
     each hatches into a hen at the next dawn. Up to 4 hens.
   · GOAT PEN (farm tab): hunting a mountain goat sometimes leaves a goat kid
     (35%). Carry it home and put it in the pen. Up to 3 goats.
   · FEED: each animal eats 1 feed at dawn. Hens eat crop seeds, wheat or
     berries; goats eat plant fiber, herbs or wheat. The trough holds 12.
   · PRODUCE at dawn, if fed: a hen lays 1 egg (and drops a feather half the
     time); a goat gives 1 goat milk, and 1 wool every other day. Collect it
     at the pen.
   · NEGLECT: two dawns in a row without feed and one animal wanders off.
     The Base chip says when a pen is hungry or has produce waiting.
============================================================================ */
(function (BO) {
    'use strict';
    const GM = BO.GM;
    const F = BO.SurvivalFrontierData;
    const CD = BO.SurvivalCampaignData;

    const KINDS = {
        coop: {
            name: 'Chicken coop', animal: 'hen', animals: 'hens', cap: 4, color: 0xf2efe6, stock: 'egg',
            feed: ['cropSeeds', 'wheat', 'berries'], feedText: 'crop seeds, wheat or berries'
        },
        goatPen: {
            name: 'Goat pen', animal: 'goat', animals: 'goats', cap: 3, color: 0xd8d2c4, stock: 'goat_kid',
            feed: ['fiber', 'herbs', 'wheat'], feedText: 'plant fiber, herbs or wheat'
        }
    };
    const TROUGH = 12;
    const STORE = 12;
    const KID_CHANCE = 0.35;
    const FENCE_R = 2.3;

    /* ---------------------------------------------------------- load-time data */
    (function registerData() {
        if (!F || !CD) return;
        Object.assign(F.items, {
            goat_kid: ['Goat kid', 'Livestock', 4.0],
            goat_milk: ['Goat milk', 'Food', 0.4]
        });
        if (BO.ZoneWild?.FOOD) BO.ZoneWild.FOOD.goat_milk = { f: 8, h: 3, w: 16 };
        const add = (b) => { if (!CD.build.some((x) => x.id === b.id)) CD.build.push(b); };
        add({ id: 'coop', name: 'Chicken coop', size: [1.4, 1.15, 1.1], cost: { planks: 6, fiber: 4, cord: 2 }, color: 0x9a6a3a,
            detail: 'A fenced hen house. Set wild eggs in it to hatch hens; fed hens lay an egg every dawn. Feed: crop seeds, wheat or berries.' });
        add({ id: 'goatPen', name: 'Goat pen', size: [1.3, 0.8, 0.8], cost: { planks: 8, cord: 3, stone: 4 }, color: 0x7a5a3a,
            detail: 'A fenced pen with a trough. Bring a goat kid from a goat hunt; fed goats give milk every dawn and wool every other day. Feed: plant fiber, herbs or wheat.' });
    })();

    const Livestock = {
        rate: 6,
        KINDS,

        start(mode, saved) {
            this.mode = mode;
            GM.ui.panel('pen', { title: (sub) => this.title(sub), render: (sub) => this.render(sub) });
            this.pens = new Map(); // piece id → state
            this.saved = saved?.pens || {};
            this.dawnKey = saved?.dawnKey ?? null;
            for (const p of mode.campaign.placed) if (p.alive && KINDS[p.type]) this.adopt(p);
        },

        stop() {
            for (const st of this.pens?.values() || []) this.disposeVisual(st);
            this.pens = new Map();
            this.mode = null;
        },

        snapshot() {
            const pens = {};
            for (const [id, st] of this.pens) pens[id] = { n: st.n, hatching: st.hatching, feed: st.feed, hungry: st.hungry, eggs: st.eggs, milk: st.milk, wool: st.wool, feather: st.feather, day: st.day };
            return { pens, dawnKey: this.dawnKey };
        },

        /* ------------------------------------------------ pens */
        adopt(piece) {
            if (this.pens.has(piece.id)) return this.pens.get(piece.id);
            const prev = this.saved[piece.id] || {};
            const st = { piece, kind: piece.type, n: prev.n || 0, hatching: prev.hatching || 0, feed: prev.feed || 0, hungry: prev.hungry || 0,
                eggs: prev.eggs || 0, milk: prev.milk || 0, wool: prev.wool || 0, feather: prev.feather || 0, day: prev.day || 0, animals: [], group: null };
            this.pens.set(piece.id, st);
            const m = this.mode;
            if (!m.markers.some((k) => k.id === 'gmpen:' + piece.id)) {
                m.markers.push({ id: 'gmpen:' + piece.id, x: piece.x, y: piece.y, z: piece.z, name: KINDS[piece.type].name, label: 'Tend the ' + KINDS[piece.type].name.toLowerCase(), alive: true });
            }
            this.buildVisual(st);
            return st;
        },

        onBuild(piece) {
            if (!this.mode) return; // resuming a save rebuilds pieces before start(); start() adopts them
            if (KINDS[piece.type]) {
                this.adopt(piece);
                GM.first('pen_' + piece.type, KINDS[piece.type].name, piece.type === 'coop' ? 'Set wild eggs to hatch hens. Fed hens lay every dawn.' : 'Bring a goat kid from a goat hunt. Fed goats give milk every dawn.');
            }
        },

        onHunt(animal, drops) {
            if (animal?.kind === 'goat' && Math.random() < KID_CHANCE) {
                drops.goat_kid = 1;
                GM.toast('A goat kid was left behind. Carry it home to a Goat pen.', '#d8d2c4');
            }
        },

        interact(marker) {
            if (!String(marker.id).startsWith('gmpen:')) return false;
            const id = marker.id.slice(6);
            if (!this.pens.has(id)) return true;
            GM.ui.open('pen', { id });
            return true;
        },

        /* ------------------------------------------------ dawn */
        currentDawn() {
            const c = this.mode.campaign;
            return c.hour >= 6 ? c.day : c.day - 1;
        },

        dawn() {
            for (const st of this.pens.values()) {
                if (!st.piece.alive) continue;
                const k = KINDS[st.kind];
                // Animals already in the pen eat and produce; chicks hatched this dawn start tomorrow.
                const adults = st.n;
                if (st.hatching) {
                    const room = Math.max(0, k.cap - st.n);
                    const born = Math.min(room, st.hatching);
                    st.n += born;
                    st.hatching = 0;
                    if (born) GM.toast(born + ' chick' + (born === 1 ? '' : 's') + ' hatched in the coop.', '#fde68a');
                }
                if (!adults) { this.syncAnimals(st); continue; }
                if (st.feed >= adults) {
                    st.feed -= adults;
                    st.hungry = 0;
                    st.day++;
                    if (st.kind === 'coop') {
                        st.eggs = Math.min(STORE, st.eggs + adults);
                        for (let i = 0; i < adults; i++) if (Math.random() < 0.5) st.feather = Math.min(STORE, st.feather + 1);
                    } else {
                        st.milk = Math.min(STORE, st.milk + adults);
                        if (st.day % 2 === 0) st.wool = Math.min(STORE, st.wool + adults);
                    }
                } else {
                    st.feed = 0;
                    st.hungry++;
                    if (st.hungry >= 2) {
                        st.n--;
                        st.hungry = 0;
                        GM.toast('A hungry ' + k.animal + ' wandered off from the ' + k.name.toLowerCase() + '. Keep the trough filled.', '#f87171');
                    } else {
                        GM.toast('The ' + k.name.toLowerCase() + ' went hungry this morning: no produce. Fill the trough today.', '#f59e0b');
                    }
                }
                this.syncAnimals(st);
            }
        },

        /* ------------------------------------------------ actions */
        uiAct(cmd, arg) {
            const [id, item] = String(arg).split('|');
            const st = this.pens.get(id);
            if (!st) return true;
            const k = KINDS[st.kind];
            const m = this.mode;
            const pts = m.points;
            if (cmd === 'feed') {
                const have = pts[item] || 0;
                const n = Math.min(have, TROUGH - st.feed);
                if (!k.feed.includes(item) || n <= 0) { BO.SurvivalUI.feedback = st.feed >= TROUGH ? 'The trough is full.' : 'You carry none of that.'; return true; }
                pts[item] -= n;
                st.feed += n;
                GM.sting?.('trade');
            } else if (cmd === 'stock') {
                const room = k.cap - st.n - st.hatching;
                const have = pts[k.stock] || 0;
                const n = Math.min(room, have, st.kind === 'coop' ? 4 : 1);
                if (n <= 0) { BO.SurvivalUI.feedback = room <= 0 ? 'The ' + k.name.toLowerCase() + ' is full.' : st.kind === 'coop' ? 'You carry no wild eggs. Pheasants drop them.' : 'You carry no goat kid. Hunt mountain goats in the alpine.'; return true; }
                pts[k.stock] -= n;
                if (st.kind === 'coop') st.hatching += n;
                else { st.n += n; this.syncAnimals(st); }
                GM.toast(st.kind === 'coop' ? n + ' egg' + (n === 1 ? '' : 's') + ' set to hatch at dawn.' : 'The goat kid settles into the pen.', '#86efac');
            } else if (cmd === 'collect') {
                const gain = {};
                if (st.eggs) gain.egg = st.eggs;
                if (st.feather) gain.feather = st.feather;
                if (st.milk) gain.goat_milk = st.milk;
                if (st.wool) gain.wool = st.wool;
                if (!Object.keys(gain).length) { BO.SurvivalUI.feedback = 'Nothing to collect yet. Produce comes at dawn.'; return true; }
                st.eggs = st.feather = st.milk = st.wool = 0;
                m.grant(gain);
                m.campaign.mark('livestockCollected', 1, 6);
            }
            return true;
        },

        /* ------------------------------------------------ UI */
        title(sub) { const st = this.pens.get(sub?.id); return st ? KINDS[st.kind].name : 'Pen'; },

        render(sub) {
            const esc = GM.esc;
            const st = this.pens.get(sub?.id);
            if (!st) return '<p class="gm-muted">This pen is gone.</p>';
            const k = KINDS[st.kind];
            const pts = this.mode.points;
            const icon = (id, s = 22) => BO.SurvivalIcons?.item?.(id, s) || '';
            const feedBtns = k.feed.map((id) => {
                const have = pts[id] || 0;
                return `<button class="sv-btn sm" data-act="gm" data-arg="livestock.feed:${esc(st.piece.id)}|${id}" ${have && st.feed < TROUGH ? '' : 'disabled'}>${icon(id, 18)} ${esc(GM.itemName(id))} · ${have}</button>`;
            }).join('');
            const produce = st.kind === 'coop' ? [['egg', st.eggs], ['feather', st.feather]] : [['goat_milk', st.milk], ['wool', st.wool]];
            const waiting = produce.filter(([, n]) => n > 0);
            const stockHave = pts[k.stock] || 0;
            const room = k.cap - st.n - st.hatching;
            const fedDays = st.n ? Math.floor(st.feed / st.n) : 0;
            return `<div class="gm-pen">
                <div class="gm-kv"><div><dt>${esc(k.animals)}</dt><dd>${st.n} / ${k.cap}</dd></div>${st.kind === 'coop' ? `<div><dt>Hatching at dawn</dt><dd>${st.hatching}</dd></div>` : ''}<div><dt>Trough</dt><dd>${st.feed} / ${TROUGH}</dd></div><div><dt>Fed for</dt><dd>${st.n ? fedDays + ' dawn' + (fedDays === 1 ? '' : 's') : '—'}</dd></div></div>
                ${st.hungry ? `<p class="gm-warn">Went hungry this morning. Another hungry dawn and one ${esc(k.animal)} leaves.</p>` : ''}
                <h4>Stock</h4>
                <p class="gm-muted sm">${st.kind === 'coop' ? 'Set wild eggs (pheasants drop them) to hatch into hens at the next dawn.' : 'Bring a goat kid: hunting a mountain goat leaves one 35% of the time.'}</p>
                <button class="sv-btn ${stockHave && room > 0 ? 'primary' : ''}" data-act="gm" data-arg="livestock.stock:${esc(st.piece.id)}" ${stockHave && room > 0 ? '' : 'disabled'}>${icon(k.stock, 18)} ${st.kind === 'coop' ? 'Set eggs to hatch' : 'Put the goat kid in'} · you carry ${stockHave}</button>
                <h4>Feed <small class="gm-muted">${esc(k.feedText)} · 1 per ${esc(k.animal)} each dawn</small></h4>
                <div class="gm-pen-feed">${feedBtns}</div>
                <h4>Produce</h4>
                <p>${waiting.length ? waiting.map(([id, n]) => icon(id, 18) + ' ' + n + ' ' + esc(GM.itemName(id))).join(' · ') : '<span class="gm-muted">Nothing yet. Fed animals produce at dawn.</span>'}</p>
                <button class="sv-btn ${waiting.length ? 'primary' : ''}" data-act="gm" data-arg="livestock.collect:${esc(st.piece.id)}" ${waiting.length ? '' : 'disabled'}>Collect</button>
            </div>`;
        },

        baseNeeds() {
            let hungry = 0, ready = 0;
            for (const st of this.pens.values()) {
                if (!st.piece.alive || !st.n) continue;
                if (st.feed < st.n) hungry++;
                if (st.eggs + st.milk + st.wool + st.feather > 0) ready++;
            }
            const out = [];
            if (hungry) out.push(hungry + ' pen' + (hungry === 1 ? '' : 's') + ' hungry');
            if (ready) out.push(ready + ' pen' + (ready === 1 ? '' : 's') + ' to collect');
            return out;
        },

        baseCards(ui) {
            if (!this.pens.size) return [];
            const rows = [...this.pens.values()].filter((st) => st.piece.alive).map((st) => {
                const k = KINDS[st.kind];
                return `<li><span>${GM.esc(k.name)}</span><em>${st.n}/${k.cap} ${GM.esc(k.animals)} · trough ${st.feed}/${TROUGH}${st.feed < st.n ? ' · <b class="gm-bad">hungry</b>' : ''}</em></li>`;
            }).join('');
            return [ui.section('Livestock', `<ul class="gm-list">${rows}</ul>`, this.pens.size + ' pen' + (this.pens.size === 1 ? '' : 's'))];
        },

        /* ------------------------------------------------ visuals */
        buildVisual(st) {
            const scene = this.mode?.scene || BO.SurvivalMode?.scene;
            if (!scene || st.group) return;
            const g = new THREE.Group();
            const wood = new THREE.MeshStandardMaterial({ color: new THREE.Color(0x8a6440).convertSRGBToLinear(), roughness: 0.9 });
            const p = st.piece;
            const posts = 12;
            for (let i = 0; i < posts; i++) {
                const a = (i / posts) * Math.PI * 2;
                const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), wood);
                post.position.set(Math.cos(a) * FENCE_R, 0.45, Math.sin(a) * FENCE_R);
                g.add(post);
                const a2 = ((i + 1) / posts) * Math.PI * 2;
                const mx = (Math.cos(a) + Math.cos(a2)) / 2 * FENCE_R, mz = (Math.sin(a) + Math.sin(a2)) / 2 * FENCE_R;
                const len = 2 * FENCE_R * Math.sin(Math.PI / posts);
                for (const h of [0.35, 0.72]) {
                    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 0.05), wood);
                    rail.position.set(mx, h, mz);
                    rail.rotation.y = -Math.atan2(mz, mx) + Math.PI / 2;
                    g.add(rail);
                }
            }
            g.position.set(p.x, p.y, p.z);
            scene.add(g);
            st.group = g;
            this.syncAnimals(st);
        },

        makeAnimal(kind) {
            const k = KINDS[kind];
            const body = new THREE.MeshStandardMaterial({ color: new THREE.Color(k.color).convertSRGBToLinear(), roughness: 0.9 });
            const dark = new THREE.MeshStandardMaterial({ color: new THREE.Color(kind === 'coop' ? 0xd8a03a : 0x5a5048).convertSRGBToLinear(), roughness: 0.9 });
            const a = new THREE.Group();
            if (kind === 'coop') {
                const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.28), body); b.position.y = 0.22; a.add(b);
                const h = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), body); h.position.set(0, 0.36, 0.14); a.add(h);
                const beak = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.06), dark); beak.position.set(0, 0.35, 0.22); a.add(beak);
                const comb = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.07), new THREE.MeshStandardMaterial({ color: 0xc0302a })); comb.position.set(0, 0.44, 0.14); a.add(comb);
                for (const lx of [0.05, -0.05]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 0.03), dark); l.position.set(lx, 0.07, 0); a.add(l); }
            } else {
                const b = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.3, 0.62), body); b.position.y = 0.5; a.add(b);
                const h = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.26), body); h.position.set(0, 0.72, 0.38); a.add(h);
                for (const hx of [0.06, -0.06]) { const horn = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.04), dark); horn.position.set(hx, 0.88, 0.32); a.add(horn); }
                for (const [lx, lz] of [[0.11, 0.22], [-0.11, 0.22], [0.11, -0.22], [-0.11, -0.22]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.36, 0.07), dark); l.position.set(lx, 0.18, lz); a.add(l); }
            }
            a.userData = { tx: 0, tz: 0, t: 0, phase: Math.random() * 6 };
            a.traverse((o) => { if (o.isMesh) o.castShadow = true; });
            return a;
        },

        syncAnimals(st) {
            if (!st.group) return;
            while (st.animals.length < st.n) {
                const a = this.makeAnimal(st.kind);
                const ang = Math.random() * Math.PI * 2, r = 0.9 + Math.random() * 0.9;
                a.position.set(Math.cos(ang) * r, 0, Math.sin(ang) * r);
                st.group.add(a);
                st.animals.push(a);
            }
            while (st.animals.length > st.n) {
                const a = st.animals.pop();
                a.removeFromParent();
                a.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
            }
        },

        disposeVisual(st) {
            if (!st.group) return;
            st.group.removeFromParent();
            st.group.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
            st.group = null;
            st.animals = [];
        },

        /* ------------------------------------------------ frame */
        update(dt) {
            const m = this.mode;
            if (!m?.active) return;
            const key = this.currentDawn();
            if (this.dawnKey == null) this.dawnKey = key;
            else if (key > this.dawnKey) { for (let i = this.dawnKey; i < key; i++) this.dawn(); this.dawnKey = key; }
            const p = BO.Player.pos;
            for (const [id, st] of this.pens) {
                if (!st.piece.alive) {
                    this.disposeVisual(st);
                    const mk = m.markers.find((k) => k.id === 'gmpen:' + id);
                    if (mk) mk.alive = false;
                    this.pens.delete(id);
                    continue;
                }
                if (!st.group || Math.hypot(st.piece.x - p.x, st.piece.z - p.z) > 70) continue;
                // Wander inside the fence.
                for (const a of st.animals) {
                    const u = a.userData;
                    u.t -= dt;
                    if (u.t <= 0) {
                        const ang = Math.random() * Math.PI * 2, r = 0.8 + Math.random() * (FENCE_R - 1.2);
                        u.tx = Math.cos(ang) * r; u.tz = Math.sin(ang) * r;
                        u.t = 2 + Math.random() * 4;
                    }
                    const dx = u.tx - a.position.x, dz = u.tz - a.position.z;
                    const d = Math.hypot(dx, dz);
                    if (d > 0.05) {
                        const sp = (st.kind === 'coop' ? 0.5 : 0.35) * dt;
                        a.position.x += dx / d * Math.min(sp, d);
                        a.position.z += dz / d * Math.min(sp, d);
                        a.rotation.y = Math.atan2(dx, dz);
                    } else {
                        u.phase += dt * 6;
                        a.rotation.x = st.kind === 'coop' ? Math.max(0, Math.sin(u.phase)) * 0.35 : 0; // pecking
                    }
                }
            }
        }
    };

    GM.register('livestock', Livestock);
})(window.BO);
