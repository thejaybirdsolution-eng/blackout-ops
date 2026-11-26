/* ============================================================================
   BLACKOUT OPS — COURSE SCENERY & AAA TEXTURED 3D PROP KIT
   Shared architectural & mechanical prop builders using BO.Textures PBR maps,
   beveled framing, vehicles, corrugated containers, turrets, lodges, bounce pads,
   and articulated boss / creature rigs. All dimensions are in world metres.
============================================================================ */
(function (BO) {
    'use strict';
    const { std, basic } = BO.MinigameLib;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);

    function part(parent, geometry, material, x, y, z) {
        const obj = new THREE.Mesh(geometry, material);
        obj.position.set(x, y, z);
        obj.castShadow = true;
        obj.receiveShadow = true;
        parent.add(obj);
        return obj;
    }
    function group(parent, x = 0, y = 0, z = 0) {
        const root = new THREE.Group();
        root.position.set(x, y, z);
        parent.add(root);
        return root;
    }
    function box(parent, x, y, z, w, h, d, material) {
        return part(parent, new THREE.BoxGeometry(w, h, d), material, x, y, z);
    }
    function drum(parent, x, y, z, a, b, h, material, sides = 12) {
        return part(parent, new THREE.CylinderGeometry(a, b, h, sides), material, x, y, z);
    }
    function rod(parent, from, to, radius, material, top = radius) {
        const dir = new THREE.Vector3().subVectors(to, from);
        const len = Math.max(0.001, dir.length());
        const o = drum(parent, (from.x + to.x) / 2, (from.y + to.y) / 2, (from.z + to.z) / 2, top, radius, len, material, 8);
        o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
        return o;
    }
    function ring(parent, x, y, z, r, tube, material) {
        const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 6, 40), material);
        m.position.set(x, y, z);
        parent.add(m);
        return m;
    }
    function sign(parent, title, x, y, z, w, h, color = '#a8e7de', bg = '#111d24') {
        const obj = BO.MinigameArt.sign(title, w, h, { bg, color, borderColor: color });
        obj.position.set(x, y, z);
        parent.add(obj);
        return obj;
    }
    function texMat(name, w = 4, h = 4) {
        return (BO.Textures && BO.Textures.getWorldMaterial)
            ? BO.Textures.getWorldMaterial(name, w, h)
            : std(0x475569, 0.85);
    }

    /** Detailed tactical Humvee / armored SUV with wheels, cabin, glass, roof rack & headlights. */
    function humvee(parent, x, y, z, yaw = 0, paintHex = 0x3f4d36, wrecked = false) {
        const g = group(parent, x, y, z);
        g.rotation.y = yaw;
        if (wrecked) g.rotation.z = 0.07;
        const bodyM = std(paintHex, 0.58, 0.36);
        const darkM = texMat('rusted_metal', 2, 2);
        const tireM = std(0x141619, 0.92, 0.08);
        const rimM = std(0x64748b, 0.38, 0.78);
        const glassM = new THREE.MeshStandardMaterial({ color: 0x1e3a4c, roughness: 0.15, metalness: 0.65, transparent: true, opacity: 0.72 });
        const lampM = basic(wrecked ? 0xf97316 : 0xfef08a);

        const chassis = box(g, 0, 0.68, 0, 2.25, 0.76, 4.55, bodyM);
        const cabin = box(g, 0, 1.38, -0.25, 2.08, 0.72, 2.55, bodyM);
        box(g, 0, 1.38, -0.25, 2.12, 0.52, 2.15, glassM);
        box(g, 0, 1.02, 1.52, 2.18, 0.22, 1.35, darkM); // Armored hood louver
        box(g, 0, 0.52, 2.32, 2.30, 0.28, 0.22, darkM); // Front bullbar
        box(g, 0, 0.52, -2.30, 2.28, 0.26, 0.18, darkM); // Rear bumper
        box(g, 0, 1.79, -0.25, 1.92, 0.08, 2.2, darkM);  // Roof rack

        for (const sx of [-0.82, 0.82]) {
            const hl = drum(g, sx, 0.76, 2.29, 0.14, 0.14, 0.06, lampM, 10);
            hl.rotation.x = Math.PI / 2;
            const tl = box(g, sx, 0.76, -2.29, 0.24, 0.12, 0.05, basic(0xef4444));
            void tl;
        }
        for (const sx of [-1.08, 1.08]) {
            for (const sz of [-1.45, 1.48]) {
                const wheel = drum(g, sx, 0.44, sz, 0.44, 0.44, 0.34, tireM, 14);
                wheel.rotation.z = Math.PI / 2;
                const hub = drum(g, sx + (sx > 0 ? 0.18 : -0.18), 0.44, sz, 0.22, 0.22, 0.04, rimM, 10);
                hub.rotation.z = Math.PI / 2;
            }
        }
        return { root: g, blocker: chassis, cabin };
    }

    /** Corrugated shipping container with corner castings, locking bars & PBR container texture. */
    function cargoContainer(S, x, y, z, w, h, d, variant = 'red', yaw = 0) {
        const matName = variant === 'blue' ? 'container_blue' : variant === 'olive' ? 'container_olive' : 'container_red';
        const g = group(S.scene, x, y, z);
        g.rotation.y = yaw;
        const body = box(g, 0, h / 2, 0, w, h, d, texMat(matName, Math.max(w, d), h));
        const trim = std(0x1e293b, 0.45, 0.75);
        for (const sx of [-1, 1]) {
            for (const sz of [-1, 1]) {
                box(g, sx * (w / 2 - 0.08), h / 2, sz * (d / 2 - 0.08), 0.18, h + 0.02, 0.18, trim);
            }
            for (const bxOff of [-0.35, 0.35]) {
                drum(g, bxOff * (w * 0.4), h / 2, sx * (d / 2 + 0.03), 0.025, 0.025, h * 0.88, std(0x94a3b8, 0.3, 0.85), 6);
            }
        }
        if (Math.abs(yaw) < 0.05) {
            S.collider(x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2);
            S.solid(body);
        }
        return { root: g, body };
    }

    /** Explosive red hazard barrel with yellow hazard bands (shootable / acid-detonatable). */
    function explosiveBarrel() {
        const g = new THREE.Group();
        const red = std(0xb91c1c, 0.42, 0.48);
        const band = std(0xfacc15, 0.38, 0.55);
        const rim = std(0x1f2937, 0.4, 0.8);
        const body = drum(g, 0, 0.52, 0, 0.38, 0.38, 1.04, red, 16);
        drum(g, 0, 0.52, 0, 0.388, 0.388, 0.20, band, 16);
        for (const ry of [0.04, 1.0]) {
            const r = ring(g, 0, ry, 0, 0.38, 0.024, rim);
            r.rotation.x = Math.PI / 2;
        }
        const cap = drum(g, 0.14, 1.06, 0, 0.055, 0.055, 0.06, basic(0xfef08a), 8);
        void cap;
        return { group: g, hitMeshes: [body] };
    }

    /** Automated Fortress Sentry Turret with tripod, rotating gun head & laser sight. */
    function sentryTurret() {
        const g = new THREE.Group();
        const dark = std(0x1e293b, 0.42, 0.78);
        const armor = std(0x475569, 0.38, 0.72);
        for (let i = 0; i < 3; i++) {
            const a = (i * Math.PI * 2) / 3;
            rod(g, V(0, 0.85, 0), V(Math.cos(a) * 0.68, 0, Math.sin(a) * 0.68), 0.055, dark);
        }
        drum(g, 0, 0.92, 0, 0.22, 0.26, 0.28, dark, 12);
        const head = group(g, 0, 1.18, 0);
        const housing = box(head, 0, 0, 0, 0.56, 0.36, 0.68, armor);
        const barrelL = drum(head, -0.13, -0.02, 0.56, 0.038, 0.045, 0.58, dark, 8);
        barrelL.rotation.x = Math.PI / 2;
        const barrelR = drum(head, 0.13, -0.02, 0.56, 0.038, 0.045, 0.58, dark, 8);
        barrelR.rotation.x = Math.PI / 2;
        const eye = part(head, new THREE.SphereGeometry(0.10, 10, 8), basic(0xef4444), 0, 0.12, 0.35);
        return { group: g, head, eye, hitMeshes: [housing] };
    }

    /** Glowing Pneumatic Bounce Pad / Shock Mattress for 360 Trick Shot. */
    function bouncePad(parent, x, y, z, radius = 2.2, color = 0x22d3ee) {
        const g = group(parent, x, y, z);
        drum(g, 0, 0.14, 0, radius, radius * 1.12, 0.28, std(0x1e293b, 0.45, 0.75), 24);
        const cushion = drum(g, 0, 0.30, 0, radius * 0.88, radius * 0.92, 0.14, std(0x0e7490, 0.35, 0.35), 24);
        const glowRing = ring(g, 0, 0.38, 0, radius * 0.76, 0.07, basic(color));
        glowRing.rotation.x = -Math.PI / 2;
        const innerRing = ring(g, 0, 0.39, 0, radius * 0.42, 0.05, basic(0xfef08a));
        innerRing.rotation.x = -Math.PI / 2;
        return { group: g, cushion, glowRing, innerRing, x, y, z, radius };
    }

    /** Timber & Stone Alpine Ski Lodge / Chalet with warm lit windows & smoking chimney. */
    function alpineChalet(parent, x, y, z, yaw = 0, scale = 1) {
        const g = group(parent, x, y, z);
        g.rotation.y = yaw;
        g.scale.setScalar(scale);
        const wood = texMat('wood_plank', 6, 4);
        const stone = texMat('bunker_stone', 6, 3);
        const snow = std(0xf1f5f9, 0.88);
        const warm = basic(0xfde68a);
        box(g, 0, 1.1, 0, 9.5, 2.2, 6.4, stone);
        box(g, 0, 3.3, 0, 9.2, 2.4, 6.1, wood);
        const roof = part(g, new THREE.ConeGeometry(6.8, 3.2, 4), wood, 0, 6.0, 0);
        roof.rotation.y = Math.PI / 4;
        const snowRoof = part(g, new THREE.ConeGeometry(7.0, 2.9, 4), snow, 0, 6.28, 0);
        snowRoof.rotation.y = Math.PI / 4;
        box(g, 3.4, 4.6, -1.6, 1.1, 5.8, 1.1, stone); // Stone chimney
        for (const wx of [-2.8, 0, 2.8]) {
            box(g, wx, 3.3, 3.08, 1.35, 1.05, 0.08, warm);
            box(g, wx, 3.3, -3.08, 1.35, 1.05, 0.08, warm);
        }
        return g;
    }

    BO.CourseScenery = {
        group, part, box, drum, rod, ring, sign, std, basic, texMat,
        humvee, cargoContainer, explosiveBarrel, sentryTurret, bouncePad, alpineChalet
    };
})(window.BO);
