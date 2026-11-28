/* ============================================================================
   BLACKOUT OPS — Operator model (replaces the box-and-cylinder soldier).

   Built from turned (lathe) shells, capsules and chamfered hard parts with a
   three-tier detail hierarchy:
     primary   — silhouette: high-cut helmet with NVG, plate carrier, rifle
     secondary — mag pouches, radio + antenna, cummerbund, knee/elbow pads, ear-pro
     tertiary  — MOLLE webbing (texture), buckles, sling, rail slots, emissive optics

   Materials: woven Cordura with MOLLE rows (procedural), printed camo fatigues,
   matte polymer, bare steel, rubber soles, and emissive team-coded NVG lenses
   and optic dot that bloom through the post chain.

   Rig contract is identical to the previous builder so every mode keeps working:
   root (feet) › bodyPivot (y 0.84, userData.baseY) › headGroup / armL / armR (gunBody)
   root › legL / legR (hip pivots at y 0.78). Hitbox tags: torso, head, limb.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const TEAM = {
        0: { carrier: 0x3d5168, fatigue: 0x39463a, accent: 0x5ec8ff, helmet: 0x435668 },
        1: { carrier: 0x6a3a33, fatigue: 0x4a3f35, accent: 0xff5a4a, helmet: 0x5d3a34 },
        2: { carrier: 0x6c5427, fatigue: 0x555044, accent: 0xfbbf24, helmet: 0x67532d },
        3: { carrier: 0x574363, fatigue: 0x454254, accent: 0xc084fc, helmet: 0x554661 }
    };

    // ---------------------------------------------------------------- textures
    const texCache = {};

    /** Author colours in sRGB (as an artist picks them) and convert to the linear values three.js shades with. */
    function lin(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }

    function canvas(w, h) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        return c;
    }

    function toTex(c, srgb) {
        const t = new THREE.CanvasTexture(c);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.anisotropy = 8;
        if (srgb && THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding;
        t.userData.sharedAsset = true; // cached in texCache and reused by every soldier
        return t;
    }

    /** Woven Cordura: twill weave, stitched MOLLE webbing rows, edge-worn fibres. */
    function corduraTexture(hex, molle = true) {
        const key = 'cordura_' + hex + (molle ? '_m' : '_p');
        if (texCache[key]) return texCache[key];
        const S = 256;
        const c = canvas(S, S);
        const g = c.getContext('2d');
        const base = new THREE.Color(hex);
        const css = (col, k, a) => `rgba(${Math.round(Math.min(1, col.r * k) * 255)},${Math.round(Math.min(1, col.g * k) * 255)},${Math.round(Math.min(1, col.b * k) * 255)},${a})`;
        g.fillStyle = css(base, 1, 1);
        g.fillRect(0, 0, S, S);
        // Twill: diagonal fine threads.
        for (let i = -S; i < S * 2; i += 3) {
            g.strokeStyle = i % 6 === 0 ? css(base, 1.12, 0.35) : css(base, 0.82, 0.35);
            g.lineWidth = 1;
            g.beginPath(); g.moveTo(i, 0); g.lineTo(i + S, S); g.stroke();
        }
        // Mottled dye variation.
        for (let i = 0; i < 260; i++) {
            const x = Math.random() * S, y = Math.random() * S, r = 4 + Math.random() * 18;
            const grd = g.createRadialGradient(x, y, 0, x, y, r);
            const k = 0.86 + Math.random() * 0.26;
            grd.addColorStop(0, css(base, k, 0.22));
            grd.addColorStop(1, css(base, k, 0));
            g.fillStyle = grd;
            g.fillRect(x - r, y - r, r * 2, r * 2);
        }
        // MOLLE: 1" webbing rows with bar-tack stitching every 1.5".
        for (let y = 20; molle && y < S; y += 42) {
            g.fillStyle = css(base, 0.7, 0.9);
            g.fillRect(0, y, S, 14);
            g.fillStyle = css(base, 1.18, 0.5);
            g.fillRect(0, y, S, 1.5);
            g.fillStyle = css(base, 0.45, 0.7);
            g.fillRect(0, y + 13, S, 1.5);
            for (let x = 0; x < S; x += 32) {
                g.fillStyle = css(base, 0.4, 0.85);
                g.fillRect(x, y - 1, 3, 16);
                g.strokeStyle = css(base, 1.25, 0.5);
                g.setLineDash([2, 2]);
                g.beginPath(); g.moveTo(x + 1.5, y + 1); g.lineTo(x + 1.5, y + 13); g.stroke();
                g.setLineDash([]);
            }
        }
        // Fibre fuzz / wear speckle.
        const img = g.getImageData(0, 0, S, S);
        for (let i = 0; i < img.data.length; i += 4) {
            const n = (Math.random() - 0.5) * 16;
            img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
        }
        g.putImageData(img, 0, 0);
        return (texCache[key] = toTex(c, true));
    }

    /** Four-colour disruptive camo print with soft blob edges and fabric grain. */
    function camoTexture(hex) {
        const key = 'camo_' + hex;
        if (texCache[key]) return texCache[key];
        const S = 256;
        const c = canvas(S, S);
        const g = c.getContext('2d');
        const base = new THREE.Color(hex);
        const tones = [1.0, 0.72, 1.28, 0.55].map((k) => {
            const t = base.clone().multiplyScalar(k);
            return `rgb(${Math.min(255, t.r * 255) | 0},${Math.min(255, t.g * 255) | 0},${Math.min(255, t.b * 255) | 0})`;
        });
        g.fillStyle = tones[0];
        g.fillRect(0, 0, S, S);
        for (let layer = 1; layer < 4; layer++) {
            g.fillStyle = tones[layer];
            const n = layer === 3 ? 26 : 42;
            for (let i = 0; i < n; i++) {
                const cx = Math.random() * S, cy = Math.random() * S;
                const rr = (layer === 3 ? 6 : 12) + Math.random() * 16;
                g.beginPath();
                for (let a = 0; a <= 12; a++) {
                    const ang = (a / 12) * Math.PI * 2;
                    const rad = rr * (0.6 + Math.random() * 0.6);
                    const x = cx + Math.cos(ang) * rad * 1.5, y = cy + Math.sin(ang) * rad;
                    if (a === 0) g.moveTo(x, y); else g.lineTo(x, y);
                }
                g.closePath();
                g.fill();
                // Wrap blobs so the print tiles.
                g.save(); g.translate(cx > S / 2 ? -S : S, 0); g.fill(); g.restore();
            }
        }
        // Rip-stop grid.
        g.strokeStyle = 'rgba(0,0,0,0.10)';
        for (let i = 0; i < S; i += 8) {
            g.beginPath(); g.moveTo(i, 0); g.lineTo(i, S); g.stroke();
            g.beginPath(); g.moveTo(0, i); g.lineTo(S, i); g.stroke();
        }
        return (texCache[key] = toTex(c, true));
    }

    /** Grain/stipple normal-ish bump shared by polymer and rubber. */
    function stippleBump() {
        if (texCache.stipple) return texCache.stipple;
        const S = 128;
        const c = canvas(S, S);
        const g = c.getContext('2d');
        g.fillStyle = '#808080';
        g.fillRect(0, 0, S, S);
        for (let i = 0; i < 1800; i++) {
            const v = 110 + Math.random() * 60 | 0;
            g.fillStyle = `rgb(${v},${v},${v})`;
            g.fillRect(Math.random() * S, Math.random() * S, 1 + Math.random() * 2, 1 + Math.random() * 2);
        }
        return (texCache.stipple = toTex(c, false));
    }

    // ---------------------------------------------------------------- geometry
    function lathe(points, segments, scaleZ) {
        const geo = new THREE.LatheGeometry(points.map((p) => new THREE.Vector2(p[0], p[1])), segments);
        if (scaleZ && scaleZ !== 1) geo.scale(1, 1, scaleZ);
        geo.computeVertexNormals();
        return geo;
    }

    function capsule(r, len, capSeg = 6, radial = 12) {
        return new THREE.CapsuleGeometry(r, len, capSeg, radial);
    }

    class SoldierModel {
        constructor() {
            this.geos = {};
            this.mats = {};
        }

        _g(key, fn) {
            let g = this.geos[key];
            if (!g) { g = fn(); if (g?.userData) g.userData.sharedAsset = true; this.geos[key] = g; }
            return g;
        }
        _m(key, fn) {
            let m = this.mats[key];
            if (!m) { m = fn(); if (m?.userData) m.userData.sharedAsset = true; this.mats[key] = m; }
            return m;
        }

        _materials(team) {
            const T = TEAM[team] || TEAM[1];
            const bump = stippleBump();
            return {
                carrier: this._m('carrier' + team, () => new THREE.MeshStandardMaterial({
                    map: corduraTexture(T.carrier), roughness: 0.88, metalness: 0.0, bumpMap: bump, bumpScale: 0.004
                })),
                fatigue: this._m('fatigue' + team, () => new THREE.MeshStandardMaterial({
                    map: camoTexture(T.fatigue), roughness: 0.92, metalness: 0.0
                })),
                helmet: this._m('helmet' + team, () => new THREE.MeshStandardMaterial({
                    map: corduraTexture(T.helmet, false), roughness: 0.78, metalness: 0.05, bumpMap: bump, bumpScale: 0.003
                })),
                polymer: this._m('polymer', () => new THREE.MeshStandardMaterial({
                    color: lin(0x23262b), roughness: 0.72, metalness: 0.0, bumpMap: bump, bumpScale: 0.002
                })),
                rubber: this._m('rubber', () => new THREE.MeshStandardMaterial({ color: lin(0x17191c), roughness: 0.95, metalness: 0.0 })),
                steel: this._m('steel', () => new THREE.MeshStandardMaterial({ color: lin(0x8b939d), roughness: 0.34, metalness: 1.0 })),
                gunmetal: this._m('gunmetal', () => new THREE.MeshStandardMaterial({ color: lin(0x2a2e34), roughness: 0.42, metalness: 0.85, bumpMap: bump, bumpScale: 0.0015 })),
                balaclava: this._m('balaclava', () => new THREE.MeshStandardMaterial({ color: lin(0x2b2d30), roughness: 0.96, metalness: 0.0, bumpMap: bump, bumpScale: 0.003 })),
                glove: this._m('glove', () => new THREE.MeshStandardMaterial({ color: lin(0x3a3730), roughness: 0.82, metalness: 0.0, bumpMap: bump, bumpScale: 0.003 })),
                lens: this._m('lens' + team, () => new THREE.MeshStandardMaterial({
                    color: lin(0x050607), roughness: 0.08, metalness: 0.2,
                    emissive: new THREE.Color(T.accent), emissiveIntensity: 2.4
                })),
                glass: this._m('glass', () => new THREE.MeshStandardMaterial({ color: lin(0x0b0f14), roughness: 0.05, metalness: 0.6 })),
                webbing: this._m('webbing', () => new THREE.MeshStandardMaterial({ color: lin(0x2e2f2b), roughness: 0.9, metalness: 0.0 })),
                optic: this._m('opticdot', () => new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.12, 0.08).multiplyScalar(3) }))
            };
        }

        _tag(mesh, entity, hitbox) {
            mesh.userData.entity = entity;
            mesh.userData.hitbox = hitbox;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            return mesh;
        }

        _mesh(geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
            const m = new THREE.Mesh(geo, mat);
            m.position.set(x, y, z);
            m.rotation.set(rx, ry, rz);
            m.castShadow = true;
            m.receiveShadow = true;
            return m;
        }

        // ------------------------------------------------------------ torso
        _buildTorso(bodyPivot, M, entity) {
            const g = this._g.bind(this);
            // Turned torso shell: waist → ribcage → chest → shoulder yoke, flattened front-to-back.
            const torsoGeo = g('torso', () => lathe([
                [0.0, -0.02], [0.145, -0.02], [0.152, 0.06], [0.168, 0.16], [0.188, 0.28],
                [0.198, 0.38], [0.196, 0.46], [0.178, 0.52], [0.13, 0.565], [0.07, 0.585], [0.0, 0.59]
            ], 18, 0.66));
            const torso = this._tag(new THREE.Mesh(torsoGeo, M.fatigue), entity, 'torso');
            torso.position.y = 0.0;
            bodyPivot.add(torso);

            // Hips / belt line.
            const hips = this._mesh(g('hips', () => capsule(0.13, 0.17, 6, 14)), M.fatigue, 0, -0.04, 0, 0, 0, Math.PI / 2);
            hips.scale.set(1, 1, 0.82);
            bodyPivot.add(hips);
            const belt = this._mesh(g('belt', () => lathe([[0.168, -0.035], [0.176, 0.0], [0.176, 0.05], [0.168, 0.085]], 20, 0.72)), M.webbing, 0, -0.02, 0);
            bodyPivot.add(belt);
            const buckle = this._mesh(g('buckle', () => new THREE.BoxGeometry(0.07, 0.05, 0.02)), M.polymer, 0, 0.01, 0.13);
            bodyPivot.add(buckle);

            // Plate carrier: front + back plate bags, cummerbund, shoulder straps.
            const plateGeo = g('plate', () => new THREE.BoxGeometry(0.33, 0.36, 0.06));
            const front = this._mesh(plateGeo, M.carrier, 0, 0.33, 0.145, -0.04);
            const back = this._mesh(plateGeo, M.carrier, 0, 0.34, -0.14, 0.04);
            bodyPivot.add(front, back);
            const cummer = this._mesh(g('cummer', () => lathe([[0.2, 0.0], [0.205, 0.04], [0.205, 0.13], [0.2, 0.17]], 22, 0.74)), M.carrier, 0, 0.12, 0);
            bodyPivot.add(cummer);
            for (const sx of [-0.115, 0.115]) {
                const strap = this._mesh(g('strap', () => new THREE.BoxGeometry(0.065, 0.035, 0.30)), M.carrier, sx, 0.535, 0.0, 0.0);
                bodyPivot.add(strap);
                const pad = this._mesh(g('shpad', () => new THREE.BoxGeometry(0.075, 0.028, 0.12)), M.polymer, sx, 0.555, 0.02);
                bodyPivot.add(pad);
            }

            // Triple rifle-mag shingle with bungee retention and kydex inserts.
            for (let i = -1; i <= 1; i++) {
                const x = i * 0.092;
                const pouch = this._mesh(g('magpouch', () => new THREE.BoxGeometry(0.082, 0.13, 0.055)), M.carrier, x, 0.25, 0.195);
                const flap = this._mesh(g('magflap', () => new THREE.BoxGeometry(0.084, 0.03, 0.06)), M.carrier, x, 0.325, 0.197, 0.18);
                const mag = this._mesh(g('magtop', () => new THREE.BoxGeometry(0.028, 0.05, 0.05)), M.polymer, x, 0.345, 0.19, -0.1);
                const pull = this._mesh(g('pull', () => new THREE.BoxGeometry(0.018, 0.022, 0.008)), M.webbing, x, 0.36, 0.22);
                bodyPivot.add(pouch, flap, mag, pull);
            }
            // Admin pouch above mags with a team patch.
            const admin = this._mesh(g('admin', () => new THREE.BoxGeometry(0.2, 0.09, 0.03)), M.carrier, 0, 0.43, 0.185, -0.06);
            const patch = this._mesh(g('patch', () => new THREE.BoxGeometry(0.06, 0.036, 0.006)), M.lens, 0.055, 0.44, 0.202, -0.06);
            patch.material = M.lens;
            bodyPivot.add(admin, patch);
            // Side frag pouches.
            for (const sx of [-1, 1]) {
                const frag = this._mesh(g('frag', () => new THREE.CylinderGeometry(0.035, 0.035, 0.085, 12)), M.carrier, sx * 0.205, 0.17, 0.05);
                const spoon = this._mesh(g('spoon', () => new THREE.BoxGeometry(0.012, 0.04, 0.02)), M.steel, sx * 0.205, 0.225, 0.07);
                bodyPivot.add(frag, spoon);
            }
            // Back: radio, antenna whip, hydration bladder.
            const radio = this._mesh(g('radio', () => new THREE.BoxGeometry(0.11, 0.2, 0.07)), M.polymer, 0.07, 0.38, -0.205);
            const radioPouch = this._mesh(g('radiop', () => new THREE.BoxGeometry(0.12, 0.17, 0.075)), M.carrier, 0.07, 0.355, -0.2);
            const whip = this._mesh(g('whip', () => new THREE.CylinderGeometry(0.004, 0.007, 0.5, 6)), M.rubber, 0.1, 0.68, -0.22, -0.18, 0, -0.08);
            const knob = this._mesh(g('knob', () => new THREE.CylinderGeometry(0.012, 0.012, 0.02, 10)), M.steel, 0.1, 0.49, -0.21);
            const hydro = this._mesh(g('hydro', () => capsule(0.065, 0.12, 4, 10)), M.carrier, -0.07, 0.34, -0.2);
            hydro.scale.set(1, 1, 0.55);
            bodyPivot.add(radio, radioPouch, whip, knob, hydro);
            // Neck.
            const neck = this._mesh(g('neck', () => new THREE.CylinderGeometry(0.058, 0.07, 0.11, 14)), M.balaclava, 0, 0.62, 0);
            bodyPivot.add(neck);
        }

        // ------------------------------------------------------------ head
        _buildHead(bodyPivot, M, entity) {
            const g = this._g.bind(this);
            const headGroup = new THREE.Group();
            headGroup.position.set(0, 0.74, 0);
            // Balaclava-covered head (hitbox).
            const head = this._tag(new THREE.Mesh(g('head', () => new THREE.SphereGeometry(0.105, 18, 14)), M.balaclava), entity, 'head');
            head.scale.set(0.95, 1.08, 1.02);
            headGroup.add(head);
            // High-cut ballistic helmet shell (also tagged head so outer helmet matches visible mesh).
            const shell = this._tag(this._mesh(g('helmet', () => lathe([
                [0.128, -0.005], [0.136, 0.02], [0.135, 0.06], [0.124, 0.1], [0.1, 0.135], [0.06, 0.158], [0.0, 0.165]
            ], 22, 1.12)), M.helmet, 0, 0.03, -0.004), entity, 'head');
            shell.scale.set(1.0, 1.0, 1.0);
            headGroup.add(shell);
            // Accessory rails and velcro top panel.
            for (const sx of [-1, 1]) {
                const rail = this._mesh(g('hrail', () => new THREE.BoxGeometry(0.014, 0.03, 0.14)), M.polymer, sx * 0.136, 0.05, -0.005, 0, 0, sx * 0.12);
                const cup = this._mesh(g('earcup', () => new THREE.CylinderGeometry(0.046, 0.05, 0.035, 16)), M.polymer, sx * 0.112, -0.005, 0.0, 0, 0, Math.PI / 2);
                const band = this._mesh(g('earband', () => new THREE.BoxGeometry(0.012, 0.075, 0.02)), M.rubber, sx * 0.12, 0.04, 0.0, 0, 0, sx * -0.25);
                headGroup.add(rail, cup, band);
            }
            const velcro = this._mesh(g('velcro', () => new THREE.BoxGeometry(0.1, 0.012, 0.09)), M.carrier, 0, 0.19, -0.01, -0.1);
            headGroup.add(velcro);
            // Counterweight pouch on the back.
            const cw = this._mesh(g('cw', () => new THREE.BoxGeometry(0.09, 0.06, 0.035)), M.carrier, 0, 0.06, -0.142, 0.25);
            headGroup.add(cw);
            // NVG shroud, mount arm and binocular tubes with glowing lenses.
            const shroud = this._mesh(g('shroud', () => new THREE.BoxGeometry(0.05, 0.035, 0.022)), M.steel, 0, 0.11, 0.146, -0.35);
            const arm = this._mesh(g('nvgarm', () => new THREE.BoxGeometry(0.03, 0.05, 0.04)), M.polymer, 0, 0.09, 0.17, -0.15);
            headGroup.add(shroud, arm);
            const tubeGeo = g('tube', () => new THREE.CylinderGeometry(0.019, 0.022, 0.075, 16));
            const lensGeo = g('lens', () => new THREE.CircleGeometry(0.0175, 16));
            for (const sx of [-0.028, 0.028]) {
                const tube = this._mesh(tubeGeo, M.polymer, sx, 0.065, 0.2, Math.PI / 2);
                const lens = new THREE.Mesh(lensGeo, M.lens);
                lens.position.set(sx, 0.065, 0.2385);
                headGroup.add(tube, lens);
            }
            // Ballistic goggles under the NVG.
            const goggle = this._mesh(g('goggle', () => new THREE.BoxGeometry(0.17, 0.045, 0.03)), M.glass, 0, 0.018, 0.098);
            const strapG = this._mesh(g('gstrap', () => lathe([[0.112, 0.0], [0.112, 0.02]], 22, 1.05)), M.rubber, 0, 0.008, 0);
            headGroup.add(goggle, strapG);
            const category = entity?.weaponId ? BO.WeaponsData.get(entity.weaponId).category : '';
            if (category === 'Sniper Rifle') {
                const hood = this._mesh(g('recon_hood', () => new THREE.SphereGeometry(0.14, 13, 8, 0, Math.PI * 2, 0, Math.PI / 2)), M.fatigue, 0, 0.055, -0.03);
                hood.scale.set(1.07, 1.22, 1.2);
                const neckWrap = this._mesh(g('neck_wrap', () => new THREE.CylinderGeometry(0.108, 0.13, 0.105, 12)), M.fatigue, 0, -0.055, -0.015);
                headGroup.add(hood, neckWrap);
            } else if (category === 'LMG' || category === 'Launcher') {
                const shield = this._mesh(g('breacher_mask', () => new THREE.BoxGeometry(0.179, 0.086, 0.055)), M.carrier, 0, -0.037, 0.089);
                headGroup.add(shield);
            }
            bodyPivot.add(headGroup);
            return headGroup;
        }

        // ------------------------------------------------------------ arms
        _buildArm(side, M, entity) {
            const g = this._g.bind(this);
            // Shoulder pivot › upper arm, elbow pad; elbow pivot › forearm, cuff, glove.
            const arm = new THREE.Group();
            const upper = this._tag(new THREE.Mesh(g('uarm', () => capsule(0.058, 0.2, 5, 12)), M.fatigue), entity, 'limb');
            upper.position.y = -0.13;
            const pocket = this._mesh(g('slvpocket', () => new THREE.BoxGeometry(0.03, 0.08, 0.07)), M.fatigue, side * 0.055, -0.1, 0.0);
            const flag = this._mesh(g('slvflag', () => new THREE.BoxGeometry(0.006, 0.035, 0.05)), M.carrier, side * 0.072, -0.09, 0.0);
            const elbow = this._mesh(g('elbowpad', () => new THREE.SphereGeometry(0.055, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)), M.polymer, 0, -0.27, -0.02, -Math.PI / 2 - 0.3);
            const fore = new THREE.Group();
            fore.name = 'forearm';
            fore.position.y = -0.27;
            const foreMesh = this._tag(new THREE.Mesh(g('farm', () => capsule(0.05, 0.18, 5, 12)), M.fatigue), entity, 'limb');
            foreMesh.position.set(0, -0.10, 0.0);
            const cuff = this._mesh(g('cuff', () => new THREE.CylinderGeometry(0.052, 0.054, 0.04, 14)), M.glove, 0, -0.20, 0.005);
            const hand = this._mesh(g('hand', () => new THREE.BoxGeometry(0.075, 0.1, 0.05)), M.glove, 0, -0.26, 0.008);
            const knuckle = this._mesh(g('knuckle', () => new THREE.BoxGeometry(0.07, 0.025, 0.02)), M.polymer, 0, -0.28, 0.036);
            fore.add(foreMesh, cuff, hand, knuckle);
            arm.add(upper, pocket, flag, elbow, fore);
            arm.userData.fore = fore;
            return arm;
        }

        // ------------------------------------------------------------ carbine
        _buildCarbine(M) {
            const g = this._g.bind(this);
            const gun = new THREE.Group();
            const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { gun.add(this._mesh(geo, mat, x, y, z, rx, ry, rz)); };
            // Upper receiver + lower receiver with magwell flare.
            add(g('c_upper', () => new THREE.BoxGeometry(0.05, 0.045, 0.2)), M.gunmetal, 0, 0.02, 0);
            add(g('c_lower', () => new THREE.BoxGeometry(0.046, 0.05, 0.14)), M.gunmetal, 0, -0.025, 0.02);
            add(g('c_magwell', () => new THREE.BoxGeometry(0.052, 0.04, 0.06)), M.gunmetal, 0, -0.055, -0.02);
            // Free-float handguard with rail slots.
            add(g('c_hg', () => new THREE.CylinderGeometry(0.03, 0.03, 0.24, 8)), M.gunmetal, 0, 0.018, -0.22, Math.PI / 2, 0, Math.PI / 8);
            for (let i = 0; i < 6; i++) add(g('c_slot', () => new THREE.BoxGeometry(0.062, 0.012, 0.016)), M.polymer, 0, 0.018, -0.13 - i * 0.034);
            add(g('c_rail', () => new THREE.BoxGeometry(0.022, 0.01, 0.42)), M.gunmetal, 0, 0.049, -0.09);
            // Barrel, gas block, muzzle brake.
            add(g('c_barrel', () => new THREE.CylinderGeometry(0.011, 0.012, 0.16, 12)), M.steel, 0, 0.018, -0.41, Math.PI / 2);
            add(g('c_muzzle', () => new THREE.CylinderGeometry(0.017, 0.017, 0.055, 12)), M.gunmetal, 0, 0.018, -0.5, Math.PI / 2);
            for (let i = 0; i < 3; i++) add(g('c_port', () => new THREE.BoxGeometry(0.036, 0.006, 0.006)), M.rubber, 0, 0.03, -0.485 - i * 0.012);
            // Curved magazine (two angled segments) + baseplate.
            add(g('c_mag1', () => new THREE.BoxGeometry(0.03, 0.09, 0.06)), M.polymer, 0, -0.11, -0.025, -0.12);
            add(g('c_mag2', () => new THREE.BoxGeometry(0.03, 0.07, 0.058)), M.polymer, 0, -0.185, -0.04, -0.32);
            add(g('c_magbp', () => new THREE.BoxGeometry(0.034, 0.012, 0.064)), M.rubber, 0, -0.222, -0.055, -0.32);
            // Pistol grip, trigger guard, angled foregrip.
            add(g('c_grip', () => new THREE.BoxGeometry(0.032, 0.09, 0.04)), M.polymer, 0, -0.08, 0.07, 0.35);
            add(g('c_tguard', () => new THREE.BoxGeometry(0.012, 0.006, 0.06)), M.gunmetal, 0, -0.055, 0.03);
            add(g('c_afg', () => new THREE.BoxGeometry(0.03, 0.04, 0.075)), M.polymer, 0, -0.022, -0.27, 0.45);
            // Buffer tube + adjustable stock with cheek riser and butt pad.
            add(g('c_buffer', () => new THREE.CylinderGeometry(0.014, 0.014, 0.16, 12)), M.gunmetal, 0, 0.012, 0.17, Math.PI / 2);
            add(g('c_stock', () => new THREE.BoxGeometry(0.04, 0.075, 0.11)), M.polymer, 0, 0.0, 0.25);
            add(g('c_cheek', () => new THREE.BoxGeometry(0.036, 0.022, 0.08)), M.polymer, 0, 0.045, 0.24);
            add(g('c_butt', () => new THREE.BoxGeometry(0.044, 0.085, 0.018)), M.rubber, 0, -0.004, 0.31);
            // Red-dot optic: housing, hood, glass and emissive dot.
            add(g('c_mount', () => new THREE.BoxGeometry(0.03, 0.022, 0.045)), M.gunmetal, 0, 0.06, -0.01);
            add(g('c_optic', () => new THREE.CylinderGeometry(0.022, 0.022, 0.06, 16)), M.gunmetal, 0, 0.088, -0.01, Math.PI / 2);
            add(g('c_glass', () => new THREE.CircleGeometry(0.018, 16)), M.glass, 0, 0.088, -0.0405, Math.PI);
            add(g('c_dot', () => new THREE.CircleGeometry(0.0035, 8)), M.optic, 0, 0.088, -0.041, Math.PI);
            // Sling loop + sling segment.
            add(g('c_sloop', () => new THREE.TorusGeometry(0.012, 0.003, 6, 12)), M.steel, 0.028, 0.0, 0.2, 0, Math.PI / 2);
            add(g('c_sling', () => new THREE.BoxGeometry(0.006, 0.025, 0.25)), M.webbing, 0.03, -0.02, 0.06, 0.12);
            return gun;
        }

        // ------------------------------------------------------------ legs
        _buildLeg(side, M, entity) {
            const g = this._g.bind(this);
            // Hip pivot › thigh; knee pivot (-0.37) › shin; ankle pivot (-0.32 below knee) › boot.
            const leg = new THREE.Group();
            const thigh = this._tag(new THREE.Mesh(g('thigh', () => capsule(0.078, 0.24, 5, 12)), M.fatigue), entity, 'limb');
            thigh.position.y = -0.18;
            const cargo = this._mesh(g('cargo', () => new THREE.BoxGeometry(0.03, 0.12, 0.1)), M.fatigue, side * 0.08, -0.2, 0.0);
            const cargoFlap = this._mesh(g('cargoflap', () => new THREE.BoxGeometry(0.034, 0.03, 0.104)), M.fatigue, side * 0.082, -0.145, 0.0);
            const shinG = new THREE.Group();
            shinG.name = 'shin';
            shinG.position.y = -0.37;
            const knee = this._mesh(g('kneepad', () => new THREE.SphereGeometry(0.068, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2)), M.polymer, 0, 0, 0.04, Math.PI / 2 - 0.15);
            knee.scale.set(1, 1.15, 0.7);
            const kneeStrap = this._mesh(g('kneestrap', () => lathe([[0.072, 0.0], [0.072, 0.018]], 16, 1.0)), M.rubber, 0, -0.02, 0.0);
            const shin = this._tag(new THREE.Mesh(g('shin', () => capsule(0.062, 0.24, 5, 12)), M.fatigue), entity, 'limb');
            shin.position.set(0, -0.17, -0.005);
            const footG = new THREE.Group();
            footG.name = 'ankle';
            footG.position.y = -0.32;
            // Boot: lugged sole, upper, toe cap, laces.
            const upper = this._mesh(g('bootup', () => new THREE.CylinderGeometry(0.066, 0.07, 0.12, 14)), M.polymer, 0, 0, 0.0);
            const foot = this._mesh(g('bootfoot', () => new THREE.BoxGeometry(0.11, 0.075, 0.23)), M.polymer, 0, -0.045, 0.045);
            const toe = this._mesh(g('boottoe', () => new THREE.SphereGeometry(0.056, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)), M.polymer, 0, -0.06, 0.15, Math.PI / 2);
            toe.scale.set(1, 0.85, 0.7);
            const sole = this._mesh(g('sole', () => new THREE.BoxGeometry(0.118, 0.024, 0.25)), M.rubber, 0, -0.084, 0.05);
            for (let i = 0; i < 4; i++) {
                const lug = this._mesh(g('lug', () => new THREE.BoxGeometry(0.11, 0.01, 0.018)), M.rubber, 0, -0.10, -0.04 + i * 0.06);
                footG.add(lug);
            }
            const laces = this._mesh(g('laces', () => new THREE.BoxGeometry(0.04, 0.012, 0.11)), M.webbing, 0, -0.005, 0.09, -0.35);
            footG.add(upper, foot, toe, sole, laces);
            shinG.add(knee, kneeStrap, shin, footG);
            leg.add(thigh, cargo, cargoFlap, shinG);
            if (side > 0) {
                // Drop-leg holster on the strong side.
                const holster = this._mesh(g('holster', () => new THREE.BoxGeometry(0.04, 0.16, 0.08)), M.polymer, 0.1, -0.18, 0.01, 0, 0, 0.06);
                const pistol = this._mesh(g('pgrip', () => new THREE.BoxGeometry(0.028, 0.06, 0.035)), M.gunmetal, 0.1, -0.08, -0.005, 0.25);
                const legStrap = this._mesh(g('legstrap', () => lathe([[0.084, 0.0], [0.084, 0.02]], 16, 1.0)), M.webbing, 0, -0.22, 0.0);
                leg.add(holster, pistol, legStrap);
            }
            leg.userData.shin = shinG;
            leg.userData.foot = footG;
            return leg;
        }

        build(team, entity) {
            const M = this._materials(team);
            const root = new THREE.Group();
            root.name = 'SM_Operator_' + (team === 0 ? 'Ally' : 'Hostile');

            const bodyPivot = new THREE.Group();
            bodyPivot.position.y = 0.84;
            bodyPivot.userData.baseY = 0.84;
            root.add(bodyPivot);

            this._buildTorso(bodyPivot, M, entity);
            const headGroup = this._buildHead(bodyPivot, M, entity);

            const armL = this._buildArm(-1, M, entity);
            armL.position.set(-0.235, 0.5, 0.04);
            armL.rotation.set(-0.85, -0.35, 0);
            const armR = this._buildArm(1, M, entity);
            armR.position.set(0.235, 0.5, 0.04);
            armR.rotation.set(-0.95, 0.15, 0);

            const gunBody = this._buildCarbine(M);
            const weapon = entity?.weaponId ? BO.WeaponsData.get(entity.weaponId) : null;
            const category = weapon?.category;
            if (category === 'SMG' || category === 'Pistol') gunBody.scale.set(0.83, 0.84, category === 'Pistol' ? 0.45 : 0.73);
            else if (category === 'LMG' || category === 'Launcher') {
                gunBody.scale.set(1.25, 1.18, 1.12);
                const rear = this._mesh(this._g('heavy_pack', () => new THREE.BoxGeometry(0.24, 0.3, 0.13)), M.carrier, -0.02, 0.33, -0.25);
                bodyPivot.add(rear);
                for (const side of [-1, 1]) {
                    const plate = this._mesh(this._g('heavy_shoulder', () => new THREE.BoxGeometry(0.13, 0.09, 0.15)), M.carrier, 0, 0.018, -0.02);
                    (side < 0 ? armL : armR).add(plate);
                }
            } else if (category === 'Sniper Rifle') gunBody.scale.z = 1.35;
            if (weapon?.kind === 'melee') {
                gunBody.clear();
                const blade = this._mesh(this._g('combat_blade', () => new THREE.BoxGeometry(0.026, 0.045, 0.24)), M.steel, 0, 0, -0.1);
                const grip = this._mesh(this._g('blade_grip', () => new THREE.BoxGeometry(0.042, 0.049, 0.12)), M.polymer, 0, 0, 0.058);
                gunBody.add(blade, grip);
            }
            // The weapon rides on the torso and the arms reach for it (two-bone IK), so the grip,
            // foregrip and stock stay planted whatever the pose.
            gunBody.userData.isWeapon = true;
            gunBody.userData.hold = weapon?.kind === 'melee' ? 'melee' : (category === 'Pistol' ? 'pistol' : (category === 'LMG' || category === 'Launcher' ? 'heavy' : 'rifle'));
            bodyPivot.add(gunBody);
            bodyPivot.add(armL, armR);

            const legL = this._buildLeg(-1, M, entity);
            legL.position.set(-0.1, 0.78, 0);
            const legR = this._buildLeg(1, M, entity);
            legR.position.set(0.1, 0.78, 0);
            root.add(legL, legR);

            const parts = {
                root, bodyPivot, headGroup, armL, armR, legL, legR, gunBody, haloGroup: null,
                forearmL: armL.userData.fore, forearmR: armR.userData.fore,
                shinL: legL.userData.shin, shinR: legR.userData.shin,
                footL: legL.userData.foot, footR: legR.userData.foot,
                isSoldier: true
            };
            this.animate(parts, { speed: 0, phase: Math.random() * 6 }, 1);
            return parts;
        }

        /* ================================================================ ANIMATION
           State: { speed, phase, aim 0..1, recoil 0..1, flinch 0..1, hitZone, reload 0..1,
                    crouch 0..1, downed, sprint, melee 0..1, pitch (rad, + = down), look (rad) }
           Legs: hip/knee/ankle with the stance leg setting hip height (natural bob, real crouch).
           Arms: two-bone IK onto the weapon's grip and foregrip; relaxed swing when unarmed. */
        animate(parts, st, dt) {
            const A = parts.anim || (parts.anim = { a: 0, run: 0, crouch: 0, aim: 0, sprint: 0, recoil: 0, flinch: 0, reload: 0, melee: 0, downed: 0, t: Math.random() * 9, lastT: performance.now() });
            const nowT = performance.now();
            if (dt == null) dt = Math.min(0.1, (nowT - A.lastT) / 1000);
            A.lastT = nowT;
            dt = Math.min(0.1, Math.max(0, dt));
            const k = (rate) => Math.min(1, rate * dt);
            const speed = st.speed || 0;
            A.t += dt;
            A.a += (clamp01(speed / 2.6) - A.a) * k(9);
            A.run += (clamp01((speed - 3.6) / 2.2) - A.run) * k(7);
            A.crouch += ((st.crouch || 0) - A.crouch) * k(10);
            A.downed += ((st.downed ? 1 : 0) - A.downed) * k(6);
            A.aim += ((st.aim || 0) - A.aim) * k(10);
            A.sprint += ((st.sprint || (A.run > 0.6 && (st.aim || 0) < 0.3) ? 1 : 0) - A.sprint) * k(8);
            A.recoil = Math.max(st.recoil || 0, A.recoil - dt * 9);
            A.flinch = Math.max(st.flinch || 0, A.flinch - dt * 6);
            A.reload += ((st.reload || 0) - A.reload) * k(14);
            A.melee = st.melee || 0;
            const phase = st.phase || 0;
            const a = A.a * (1 - A.downed), run = A.run * (1 - A.downed);
            const crouch = Math.max(A.crouch, A.downed);
            const aim = A.aim * (1 - A.sprint * 0.85);

            // ---------------------------------------------------------------- legs
            const LT = 0.37, LS = 0.32, LF = 0.10;
            let hip = 0;
            const legPose = (leg, shin, foot, ph) => {
                const sp = Math.sin(ph), cp = Math.cos(ph);
                const thigh = sp * (0.42 + 0.3 * run) * a * (1 - crouch * 0.5) + crouch * 1.0 + A.downed * 0.35;
                const knee = a * (0.1 + (0.62 + 0.55 * run) * Math.max(0, cp)) * (1 - crouch * 0.4) + crouch * 1.72 + A.downed * 0.25;
                leg.rotation.set(-thigh, 0, 0);
                shin.rotation.set(knee, 0, 0);
                foot.rotation.set(thigh - knee + Math.max(0, -sp) * 0.25 * a, 0, 0);
                hip = Math.max(hip, LT * Math.cos(thigh) + LS * Math.cos(thigh - knee) + LF);
            };
            if (parts.shinL && parts.footL) {
                legPose(parts.legL, parts.shinL, parts.footL, phase);
                legPose(parts.legR, parts.shinR, parts.footR, phase + Math.PI);
            }
            const drop = Math.max(0, (LT + LS + LF) - hip) + A.downed * 0.08;
            parts.legL.position.y = 0.78 - drop;
            parts.legR.position.y = 0.78 - drop;
            parts.legL.rotation.z = -0.04 * crouch;
            parts.legR.rotation.z = 0.04 * crouch;

            // ---------------------------------------------------------------- torso & head
            const held = parts.heldWeapon && parts.heldWeapon.parent ? parts.heldWeapon : parts.gunBody;
            const hold = held && held.visible !== false ? (held.userData.hold || 'rifle') : 'none';
            const bladed = (hold === 'rifle' || hold === 'heavy') ? 0.12 + 0.18 * aim : 0;
            const BP = parts.bodyPivot;
            BP.position.y = (BP.userData.baseY || 0.84) - drop + Math.sin(A.t * 1.6) * 0.004;
            BP.rotation.x = 0.04 * a + 0.2 * A.sprint * a + 0.22 * crouch - A.flinch * (st.hitZone === 'head' ? 0.12 : 0.24) - A.recoil * 0.03 + A.reload * 0.06;
            BP.rotation.y = bladed - Math.sin(phase) * 0.07 * a + (st.hitZone === 'limb' ? A.flinch * 0.16 : 0);
            BP.rotation.z = Math.sin(phase) * 0.03 * a + (st.hitZone === 'limb' ? A.flinch * 0.12 : 0);
            const pitch = clamp(st.pitch || 0, -0.7, 0.7);
            if (parts.headGroup) {
                const hg = parts.headGroup;
                const idleLook = (1 - a) * (1 - aim) * Math.sin(A.t * 0.37) * 0.3;
                hg.rotation.set(
                    -BP.rotation.x * 0.8 + pitch * 0.7 - A.flinch * (st.hitZone === 'head' ? 0.5 : 0.22) + A.reload * 0.3,
                    -BP.rotation.y + (st.look || 0) + idleLook,
                    -BP.rotation.z * 0.6
                );
            }

            // ---------------------------------------------------------------- weapon + arms
            if (hold === 'none') {
                // Unarmed: arms hang and swing against the legs.
                const sw = Math.sin(phase) * (0.35 + 0.4 * run) * a;
                parts.armL.rotation.set(sw + A.flinch * 0.3, 0, -0.1);
                parts.armR.rotation.set(-sw + A.flinch * 0.3, 0, 0.1);
                if (parts.forearmL) parts.forearmL.rotation.set(-0.25 - 0.9 * run, 0, 0);
                if (parts.forearmR) parts.forearmR.rotation.set(-0.25 - 0.9 * run, 0, 0);
                return;
            }
            const gun = held;
            const anc = gripAnchors(gun);
            // Pose the weapon in torso space.
            const bob = Math.sin(phase * 2) * 0.012 * a;
            let bx, by, bz, gp, gy, gr;
            if (hold === 'pistol') {
                // Grip-anchored: two-handed extension when aiming, tucked low-ready otherwise.
                bx = lerp(0.07, 0.02, aim); by = lerp(0.26, 0.47, aim) + bob; bz = lerp(0.24, 0.44, aim);
                gp = lerp(0.85, 0, aim); gy = -bladed; gr = 0;
            } else if (hold === 'melee') {
                bx = 0.16; by = 0.3 + bob; bz = 0.28; gp = -0.5 + A.melee * 2.0; gy = 0.2; gr = 0;
            } else {
                const heavy = hold === 'heavy';
                // Butt position: aim = shouldered; low ready = muzzle down and across the body;
                // sprint = port arms, muzzle up toward the support shoulder.
                bx = lerp(heavy ? 0.15 : 0.1, 0.12, aim); by = lerp(heavy ? 0.33 : 0.42, heavy ? 0.36 : 0.5, aim) + bob; bz = lerp(0.06, 0.03, aim);
                gp = lerp(heavy ? 0.15 : 0.45, 0, aim); gy = lerp(heavy ? -0.1 : -0.35, 0, aim) - bladed; gr = 0;
                bx = lerp(bx, 0.15, A.sprint); by = lerp(by, 0.3, A.sprint); bz = lerp(bz, 0.12, A.sprint);
                gp = lerp(gp, -0.6, A.sprint); gy = lerp(gy, -0.85 - bladed, A.sprint);
            }
            gp += pitch * aim;
            // Recoil kicks the butt back and the muzzle up; reload rolls the gun and dips it.
            bz -= A.recoil * 0.045; gp -= A.recoil * 0.12;
            gr += A.reload * 0.75; gp += A.reload * 0.35; by -= A.reload * 0.06;
            gp -= A.flinch * 0.25;
            _q1.setFromAxisAngle(_Y, gy).multiply(_q2.setFromAxisAngle(_X, gp)).multiply(_q2.setFromAxisAngle(_Y, Math.PI)).multiply(_q2.setFromAxisAngle(_Z, gr));
            if (aim > 0.01 && hold !== 'melee') {
                // When aiming the barrel is laid in body space (feet frame), so torso lean, bob and twist never tip it off target.
                _q3.setFromAxisAngle(_X, gp).multiply(_q2.setFromAxisAngle(_Y, Math.PI)).multiply(_q2.setFromAxisAngle(_Z, gr));
                _q2.setFromEuler(BP.rotation).invert();
                _q3.premultiply(_q2);
                _q1.slerp(_q3, clamp01(aim * 1.4));
            }
            gun.quaternion.copy(_q1);
            if (hold === 'pistol' || hold === 'melee') {
                _v1.copy(anc.grip).multiply(gun.scale).applyQuaternion(_q1);
                gun.position.set(bx, by, bz).sub(_v1);
            } else {
                _v1.copy(anc.butt).multiply(gun.scale).applyQuaternion(_q1);
                gun.position.set(bx, by, bz).sub(_v1);
            }
            // Hand targets in torso space.
            const tR = _v2.copy(anc.grip).multiply(gun.scale).applyQuaternion(_q1).add(gun.position);
            let tL;
            if (hold === 'pistol') tL = _v3.copy(anc.grip).add(_v4.set(-0.035, -0.02, 0.01)).multiply(gun.scale).applyQuaternion(_q1).add(gun.position);
            else if (hold === 'melee') tL = null;
            else tL = _v3.copy(anc.fore).multiply(gun.scale).applyQuaternion(_q1).add(gun.position);
            // Reload: support hand goes to the magazine, then down to the belt and back.
            if (tL && A.reload > 0.02) {
                const r = A.reload;
                _v5.copy(anc.mag).multiply(gun.scale).applyQuaternion(_q1).add(gun.position);
                const belt = _v4.set(-0.12, 0.08, 0.12);
                const cyc = Math.sin(A.t * 5.5) * 0.5 + 0.5;
                _v5.lerp(belt, cyc * 0.6);
                tL.lerp(_v5, Math.min(1, r * 1.4));
            }
            ikArm(parts.armR, parts.forearmR, tR, 1);
            if (tL) ikArm(parts.armL, parts.forearmL, tL, -1);
            else {
                const sw = Math.sin(phase) * 0.4 * a;
                parts.armL.rotation.set(sw - 0.2, 0, -0.18);
                if (parts.forearmL) parts.forearmL.rotation.set(-0.7, 0, 0);
            }
        }
    }

    const _X = new THREE.Vector3(1, 0, 0), _Y = new THREE.Vector3(0, 1, 0), _Z = new THREE.Vector3(0, 0, 1);
    const _DOWN = new THREE.Vector3(0, -1, 0);
    const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion();
    const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _v4 = new THREE.Vector3(), _v5 = new THREE.Vector3();
    const _d = new THREE.Vector3(), _pole = new THREE.Vector3(), _e = new THREE.Vector3(), _u = new THREE.Vector3(), _f = new THREE.Vector3();
    const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
    const clamp01 = (v) => clamp(v, 0, 1);
    const lerp = (x, y, t) => x + (y - x) * t;

    /** Grip / foregrip / magazine / butt points of a held weapon in its own space, measured once from its bounds. */
    function gripAnchors(gun) {
        if (gun.userData.anchors) return gun.userData.anchors;
        const sq = gun.quaternion.clone(), sp = gun.position.clone(), ss = gun.scale.clone(), par = gun.parent;
        if (par) par.remove(gun);
        gun.position.set(0, 0, 0); gun.quaternion.identity(); gun.scale.set(1, 1, 1);
        gun.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(gun);
        gun.position.copy(sp); gun.quaternion.copy(sq); gun.scale.copy(ss);
        if (par) par.add(gun);
        if (box.isEmpty()) box.set(new THREE.Vector3(-0.03, -0.1, -0.5), new THREE.Vector3(0.03, 0.06, 0.31));
        const L = box.max.z - box.min.z, cx = (box.min.x + box.max.x) / 2;
        const top = box.max.y, bot = box.min.y;
        const midY = lerp(bot, top, 0.62);
        const hold = gun.userData.hold || 'rifle';
        const anchors = hold === 'pistol' || L < 0.32
            ? { butt: new THREE.Vector3(cx, midY, box.max.z), grip: new THREE.Vector3(cx, lerp(bot, top, 0.3), box.max.z - L * 0.22), fore: new THREE.Vector3(cx, lerp(bot, top, 0.3), box.max.z - L * 0.22), mag: new THREE.Vector3(cx, bot, box.max.z - L * 0.25) }
            : hold === 'melee'
                ? { butt: new THREE.Vector3(cx, 0, box.max.z), grip: new THREE.Vector3(cx, 0, box.max.z - L * 0.22), fore: new THREE.Vector3(cx, 0, box.max.z - L * 0.22), mag: new THREE.Vector3(cx, 0, box.max.z - L * 0.22) }
                : { butt: new THREE.Vector3(cx, midY, box.max.z), grip: new THREE.Vector3(cx, lerp(bot, top, 0.45), box.max.z - L * 0.29), fore: new THREE.Vector3(cx, lerp(bot, top, 0.72), box.max.z - L * 0.56), mag: new THREE.Vector3(cx, lerp(bot, top, 0.35), box.max.z - L * 0.42) };
        gun.userData.anchors = anchors;
        return anchors;
    }

    /** Two-bone IK in the torso frame: shoulder (arm.position) → elbow (0.27) → palm (0.265). */
    function ikArm(arm, fore, target, side) {
        if (!arm || !fore) return;
        const LU = 0.27, LFo = 0.265;
        const S = arm.position;
        _d.copy(target).sub(S);
        let D = _d.length();
        if (D < 1e-4) return;
        _d.divideScalar(D);
        D = clamp(D, 0.1, LU + LFo - 0.003);
        // Elbows point down, out and slightly back.
        _pole.set(side * 0.65, -0.9, -0.35);
        _pole.addScaledVector(_d, -_pole.dot(_d));
        if (_pole.lengthSq() < 1e-6) _pole.set(0, -1, 0);
        _pole.normalize();
        const cosA = clamp((LU * LU + D * D - LFo * LFo) / (2 * LU * D), -1, 1);
        const sinA = Math.sqrt(1 - cosA * cosA);
        _u.copy(_d).multiplyScalar(cosA).addScaledVector(_pole, sinA); // upper-arm direction
        arm.quaternion.setFromUnitVectors(_DOWN, _u);
        _e.copy(S).addScaledVector(_u, LU);
        _f.copy(S).addScaledVector(_d, D).sub(_e).normalize();
        _q3.copy(arm.quaternion).invert();
        _f.applyQuaternion(_q3);
        fore.quaternion.setFromUnitVectors(_DOWN, _f);
    }

    const model = new SoldierModel();
    BO.SoldierModel = model;
    if (BO.CharacterMesh) {
        BO.CharacterMesh._legacyBuildSoldier = BO.CharacterMesh.buildSoldier;
        BO.CharacterMesh.buildSoldier = function (team, entity) {
            return model.build(TEAM[team] ? team : 1, entity);
        };
    }
})(window);
