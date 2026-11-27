/* ============================================================================
   BLACKOUT OPS — MINIGAMES: procedural art kit
   Every prop is built from primitives + canvas textures (no asset files).
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const L = BO.MinigameLib;
    const { canvasTex, std, basic, HIDDEN_MAT } = L;

    function outlinePath(g, draw, fill, stroke, lw) {
        g.beginPath();
        draw(g);
        g.fillStyle = fill;
        g.fill();
        if (stroke) { g.lineWidth = lw || 6; g.strokeStyle = stroke; g.stroke(); }
    }

    const A = {
        /* --------------------------------------------- staged PBR textures */
        loadTex(relPath, repeatX = 1, repeatY = 1) {
            return L.loadTex ? L.loadTex(relPath, repeatX, repeatY) : null;
        },

        pbrMat(relPath, repeatX = 1, repeatY = 1, opts = {}) {
            return L.pbrMat ? L.pbrMat(relPath, repeatX, repeatY, opts) : std(0x64748b, 0.8);
        },

        applySkybox(scene, file) {
            return L.applySkybox ? L.applySkybox(scene, file) : null;
        },

        loadGLB(relPath) {
            return L.loadGLB ? L.loadGLB(relPath) : Promise.resolve(null);
        },

        placeGLB(parent, relPath, opts) {
            return L.placeGLB ? L.placeGLB(parent, relPath, opts) : null;
        },

        placeGLBInstanced(parent, relPath, transforms, opts) {
            return L.placeGLBInstanced ? L.placeGLBInstanced(parent, relPath, transforms, opts) : null;
        },

        /* ------------------------------------------------------ bullseye */
        bullseyeTex(style = 'classic') {
            return canvasTex('bull:' + style, 512, 512, (g, w) => {
                const c = w / 2;
                const rings = style === 'steel'
                    ? ['#e5e7eb', '#9ca3af', '#e5e7eb', '#9ca3af', '#ef4444']
                    : style === 'olympic'
                        ? ['#f8fafc', '#111827', '#3b82f6', '#ef4444', '#facc15']
                        : ['#f8fafc', '#dc2626', '#f8fafc', '#dc2626', '#facc15'];
                for (let i = 0; i < 5; i++) {
                    g.beginPath();
                    g.arc(c, c, c * (1 - i * 0.2) - 2, 0, Math.PI * 2);
                    g.fillStyle = rings[i];
                    g.fill();
                    g.lineWidth = 4;
                    g.strokeStyle = 'rgba(15,23,42,0.75)';
                    g.stroke();
                }
                g.fillStyle = 'rgba(15,23,42,0.55)';
                g.font = '900 30px Bahnschrift, sans-serif';
                g.textAlign = 'center';
                g.textBaseline = 'middle';
                for (let i = 0; i < 4; i++) g.fillText(String(6 + i), c, c - c * (0.9 - i * 0.2));
                g.beginPath(); g.arc(c, c, 6, 0, Math.PI * 2); g.fillStyle = '#111827'; g.fill();
            });
        },

        /** Round target on a post. Pivot at ground; face points +Z. */
        bullseye(radius = 0.42, height = 1.35, style = 'classic') {
            const grp = new THREE.Group();
            const face = new THREE.Mesh(
                new THREE.CylinderGeometry(radius, radius, 0.05, 40),
                [std(0x5b3a1f, 0.8), new THREE.MeshStandardMaterial({ map: A.bullseyeTex(style), roughness: 0.75 }), std(0x7c5a35, 0.9)]
            );
            face.rotation.x = Math.PI / 2;
            face.position.set(0, height, 0);
            face.castShadow = true;
            grp.add(face);
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, height - radius + 0.05, 0.07), std(0x3f3f46, 0.5, 0.6));
            post.position.set(0, (height - radius) / 2, -0.06);
            post.userData.noHit = true;
            grp.add(post);
            const foot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.3), std(0x27272a, 0.5, 0.6));
            foot.position.set(0, 0.025, -0.06);
            foot.userData.noHit = true;
            grp.add(foot);
            return { mesh: grp, hitMeshes: [face], ringCenter: new THREE.Vector3(0, height, 0.03), ringRadius: radius };
        },

        /** Steel plate (gong). */
        steelPlate(radius = 0.5, color = 0xd4d4d8) {
            const grp = new THREE.Group();
            const plate = new THREE.Mesh(
                new THREE.CylinderGeometry(radius, radius, 0.06, 36),
                [std(0x52525b, 0.4, 0.9), new THREE.MeshStandardMaterial({ map: A.bullseyeTex('steel'), color, roughness: 0.35, metalness: 0.7 }), std(0x3f3f46, 0.5, 0.8)]
            );
            plate.rotation.x = Math.PI / 2;
            plate.castShadow = true;
            grp.add(plate);
            for (const sx of [-1, 1]) {
                const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.9, 5), std(0x71717a, 0.4, 0.9));
                chain.position.set(sx * radius * 0.55, radius + 0.42, 0);
                chain.userData.noHit = true;
                grp.add(chain);
            }
            return { mesh: grp, hitMeshes: [plate], ringCenter: new THREE.Vector3(0, 0, 0.04), ringRadius: radius };
        },

        /* --------------------------------------------------- silhouettes */
        silhouetteTex(type) {
            return canvasTex('sil:' + type, 256, 512, (g) => {
                const pal = {
                    bandit: { body: '#c8a36a', line: '#1c1917', accent: '#b91c1c' },
                    outlaw: { body: '#9a7448', line: '#1c1917', accent: '#111827' },
                    civilian: { body: '#bfdbfe', line: '#1e3a8a', accent: '#f9a8d4' },
                    hostile: { body: '#57534e', line: '#dc2626', accent: '#1c1917' },
                    hostage: { body: '#f5f5f4', line: '#ca8a04', accent: '#fde047' }
                }[type] || { body: '#c8a36a', line: '#111', accent: '#b91c1c' };
                const L = pal.line;
                g.lineJoin = 'round';
                const handsUp = type === 'civilian' || type === 'hostage';
                // legs
                outlinePath(g, (c) => { c.moveTo(86, 330); c.lineTo(70, 505); c.lineTo(114, 505); c.lineTo(128, 380); c.lineTo(142, 505); c.lineTo(186, 505); c.lineTo(170, 330); c.closePath(); }, pal.body, L, 7);
                // arms
                if (handsUp) {
                    outlinePath(g, (c) => { c.moveTo(70, 190); c.lineTo(28, 70); c.lineTo(58, 60); c.lineTo(96, 175); c.closePath(); }, pal.body, L, 7);
                    outlinePath(g, (c) => { c.moveTo(186, 190); c.lineTo(228, 70); c.lineTo(198, 60); c.lineTo(160, 175); c.closePath(); }, pal.body, L, 7);
                } else {
                    outlinePath(g, (c) => { c.moveTo(70, 185); c.lineTo(36, 300); c.lineTo(62, 308); c.lineTo(92, 205); c.closePath(); }, pal.body, L, 7);
                    outlinePath(g, (c) => { c.moveTo(186, 185); c.lineTo(250, 215); c.lineTo(244, 240); c.lineTo(176, 222); c.closePath(); }, pal.body, L, 7);
                    // weapon
                    g.fillStyle = '#18181b';
                    if (type === 'hostile') g.fillRect(186, 200, 70, 18);
                    else { g.fillRect(226, 206, 30, 12); g.fillRect(236, 214, 9, 18); }
                }
                // torso
                outlinePath(g, (c) => { c.moveTo(70, 172); c.lineTo(186, 172); c.lineTo(176, 340); c.lineTo(80, 340); c.closePath(); }, pal.body, L, 7);
                // head
                outlinePath(g, (c) => c.arc(128, 122, 46, 0, Math.PI * 2), pal.body, L, 7);
                if (type === 'bandit' || type === 'outlaw') {
                    outlinePath(g, (c) => { c.moveTo(84, 126); c.lineTo(172, 126); c.lineTo(128, 168); c.closePath(); }, pal.accent, L, 4);
                    outlinePath(g, (c) => { c.ellipse(128, 86, 86, 14, 0, 0, Math.PI * 2); }, '#3f2a14', L, 5);
                    outlinePath(g, (c) => { c.moveTo(92, 86); c.lineTo(100, 32); c.lineTo(156, 32); c.lineTo(164, 86); c.closePath(); }, '#3f2a14', L, 5);
                    g.fillStyle = L; g.fillRect(104, 106, 14, 8); g.fillRect(138, 106, 14, 8);
                } else if (type === 'hostile') {
                    outlinePath(g, (c) => { c.arc(128, 112, 50, Math.PI, 0); c.closePath(); }, '#292524', L, 5);
                    g.fillStyle = '#ef4444'; g.fillRect(96, 116, 64, 10);
                } else {
                    g.fillStyle = L;
                    g.beginPath(); g.arc(110, 116, 6, 0, Math.PI * 2); g.arc(146, 116, 6, 0, Math.PI * 2); g.fill();
                    g.lineWidth = 5; g.strokeStyle = L; g.beginPath(); g.arc(128, 132, 18, 0.2, Math.PI - 0.2); g.stroke();
                }
                // chest marking
                if (type === 'civilian' || type === 'hostage') {
                    g.fillStyle = pal.accent;
                    g.fillRect(78, 236, 100, 40);
                    g.fillStyle = '#1e293b';
                    g.font = '900 22px Bahnschrift, sans-serif';
                    g.textAlign = 'center';
                    g.fillText(type === 'hostage' ? 'HOSTAGE' : "DON'T", 128, 256);
                    g.font = '900 18px Bahnschrift, sans-serif';
                    g.fillText(type === 'hostage' ? 'HOLD FIRE' : 'SHOOT', 128, 274);
                } else {
                    g.strokeStyle = 'rgba(28,25,23,0.55)';
                    g.lineWidth = 3;
                    for (let r = 14; r <= 56; r += 14) { g.beginPath(); g.arc(128, 252, r, 0, Math.PI * 2); g.stroke(); }
                }
            });
        },

        /** Cardboard figure 1.8m tall. Body + head hit zones. Pivot at feet, faces +Z. */
        silhouette(type = 'bandit', scale = 1) {
            const grp = new THREE.Group();
            const h = 1.8 * scale, w = 0.9 * scale;
            const tex = A.silhouetteTex(type);
            const card = new THREE.Mesh(
                new THREE.PlaneGeometry(w, h),
                new THREE.MeshStandardMaterial({
                    map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.72,
                    emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.34
                })
            );
            card.position.y = h / 2;
            card.castShadow = true;
            card.userData.noHit = true;
            grp.add(card);
            const isFriend = type === 'civilian' || type === 'hostage';
            const halo = new THREE.Mesh(
                new THREE.PlaneGeometry(w * 1.12, h * 1.06),
                new THREE.MeshBasicMaterial({
                    color: isFriend ? 0x38bdf8 : 0xef4444,
                    transparent: true, opacity: 0.28, side: THREE.DoubleSide
                })
            );
            halo.position.set(0, h / 2, -0.025);
            halo.userData.noHit = true;
            grp.add(halo);
            const torso = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.52, h * 0.62), HIDDEN_MAT);
            torso.position.set(0, h * 0.5, 0.01);
            torso.userData.hitbox = 'torso';
            const head = new THREE.Mesh(new THREE.CircleGeometry(w * 0.2, 16), HIDDEN_MAT);
            head.position.set(0, h * 0.76, 0.02);
            head.userData.hitbox = 'head';
            grp.add(torso, head);
            const back = new THREE.Mesh(new THREE.BoxGeometry(0.05, h * 0.5, 0.05), std(0x44403c, 0.8));
            back.position.set(0, h * 0.25, -0.05);
            back.userData.noHit = true;
            grp.add(back);
            return { mesh: grp, hitMeshes: [head, torso], ringCenter: new THREE.Vector3(0, h * 0.55, 0) };
        },

        /* ---------------------------------------------------------- clay */
        clay() {
            const grp = new THREE.Group();
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.135, 0.04, 22), std(0xf97316, 0.55));
            const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.1, 0.025, 22), std(0x1c1917, 0.6));
            dome.position.y = 0.03;
            body.castShadow = true;
            grp.add(body, dome);
            // generous hit disc so shotgun pellets register fairly
            const hit = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), HIDDEN_MAT);
            grp.add(hit);
            return { mesh: grp, hitMeshes: [hit], ringCenter: new THREE.Vector3() };
        },

        /* --------------------------------------------------------- drone */
        drone(variant = 'scout') {
            const grp = new THREE.Group();
            const col = variant === 'armored' ? 0xb45309 : variant === 'speeder' ? 0x0e7490 : 0x27272a;
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.42), std(col, 0.35, 0.7));
            body.castShadow = true;
            grp.add(body);
            const dome = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), std(0x0f172a, 0.2, 0.3, { emissive: 0x0ea5e9, emissiveIntensity: 0.25 }));
            dome.position.y = 0.06;
            grp.add(dome);
            const rotors = [];
            for (let i = 0; i < 4; i++) {
                const a = Math.PI / 4 + i * Math.PI / 2;
                const arm = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.05), std(0x3f3f46, 0.4, 0.7));
                arm.position.set(Math.cos(a) * 0.2, 0.02, Math.sin(a) * 0.2);
                arm.rotation.y = -a;
                grp.add(arm);
                const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.008, 16), new THREE.MeshBasicMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.35 }));
                rotor.position.set(Math.cos(a) * 0.38, 0.07, Math.sin(a) * 0.38);
                rotor.userData.noHit = true;
                grp.add(rotor);
                rotors.push(rotor);
                const led = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), basic(i < 2 ? 0xef4444 : 0x22c55e));
                led.position.set(Math.cos(a) * 0.38, 0.0, Math.sin(a) * 0.38);
                led.userData.noHit = true;
                grp.add(led);
            }
            if (variant === 'armored') {
                const plate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), std(0x78350f, 0.3, 0.9));
                plate.position.y = -0.08;
                grp.add(plate);
            }
            // glowing underbelly ring so drones read clearly against a night skyline
            const glowCol = variant === 'armored' ? 0xf59e0b : variant === 'speeder' ? 0x22d3ee : 0xf43f5e;
            const glow = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.035, 6, 20), basic(glowCol));
            glow.rotation.x = Math.PI / 2;
            glow.position.y = -0.08;
            glow.userData.noHit = true;
            grp.add(glow);
            const halo = new THREE.Mesh(new THREE.CircleGeometry(0.55, 20), new THREE.MeshBasicMaterial({ color: glowCol, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }));
            halo.rotation.x = Math.PI / 2;
            halo.position.y = -0.1;
            halo.userData.noHit = true;
            grp.add(halo);
            const hit = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 6), HIDDEN_MAT);
            grp.add(hit);
            grp.userData.rotors = rotors;
            return { mesh: grp, hitMeshes: [hit], ringCenter: new THREE.Vector3(), rotors };
        },

        /* ------------------------------------------------------- balloon */
        balloon(kind = 'red') {
            const colors = { red: 0xef4444, blue: 0x3b82f6, green: 0x22c55e, yellow: 0xfacc15, purple: 0xa855f7, pink: 0xec4899, gold: 0xfbbf24, bomb: 0x111111 };
            const c = colors[kind] ?? 0xef4444;
            const grp = new THREE.Group();
            const m = kind === 'gold'
                ? new THREE.MeshStandardMaterial({ color: c, roughness: 0.2, metalness: 0.85, emissive: 0x7c4a03, emissiveIntensity: 0.4 })
                : new THREE.MeshStandardMaterial({ color: c, roughness: 0.28, metalness: 0.05, emissive: c, emissiveIntensity: kind === 'bomb' ? 0 : 0.14 });
            const ball = new THREE.Mesh(new THREE.SphereGeometry(0.34, 22, 16), m);
            ball.scale.set(1, 1.18, 1);
            ball.position.y = 1.35;
            ball.castShadow = true;
            grp.add(ball);
            const knot = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.09, 8), m);
            knot.position.y = 0.92;
            knot.rotation.x = Math.PI;
            knot.userData.noHit = true;
            grp.add(knot);
            const string = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.9, 4), basic(0xe5e7eb));
            string.position.y = 0.45;
            string.userData.noHit = true;
            grp.add(string);
            if (kind === 'bomb') {
                const skull = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map: A.skullTex(), transparent: true }));
                skull.position.set(0, 1.38, 0.345);
                skull.userData.noHit = true;
                grp.add(skull);
                const skull2 = skull.clone();
                skull2.position.z = -0.345;
                skull2.rotation.y = Math.PI;
                grp.add(skull2);
            }
            return { mesh: grp, hitMeshes: [ball], ringCenter: new THREE.Vector3(0, 1.35, 0) };
        },

        skullTex() {
            return canvasTex('skull', 128, 128, (g) => {
                g.fillStyle = '#f43f5e';
                g.beginPath(); g.arc(64, 54, 34, 0, Math.PI * 2); g.fill();
                g.fillRect(44, 70, 40, 30);
                g.fillStyle = '#111';
                g.beginPath(); g.arc(50, 54, 10, 0, Math.PI * 2); g.arc(78, 54, 10, 0, Math.PI * 2); g.fill();
                g.fillRect(52, 86, 6, 14); g.fillRect(62, 86, 6, 14); g.fillRect(72, 86, 6, 14);
            });
        },

        /* ---------------------------------------------------------- mole */
        mole(variant = 'normal') {
            const grp = new THREE.Group();
            const fur = variant === 'gold'
                ? new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.25, metalness: 0.85, emissive: 0x854d0e, emissiveIntensity: 0.35 })
                : std(variant === 'helmet' ? 0x5b3519 : 0x6b3a1f, 0.85);
            const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 22, 16), fur);
            body.scale.set(1, 1.3, 0.92);
            body.position.y = 0.36;
            body.castShadow = true;
            grp.add(body);
            const belly = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), variant === 'gold' ? fur : std(0xd6a77a, 0.9));
            belly.scale.set(1, 1.15, 0.5);
            belly.position.set(0, 0.28, 0.2);
            grp.add(belly);
            const snout = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), variant === 'gold' ? fur : std(0xe7b98d, 0.8));
            snout.scale.set(1.1, 0.8, 1);
            snout.position.set(0, 0.52, 0.28);
            grp.add(snout);
            const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), std(0xf472b6, 0.35));
            nose.position.set(0, 0.56, 0.4);
            grp.add(nose);
            const eyeW = std(0xffffff, 0.3), eyeB = std(0x0a0a0a, 0.2);
            const eyes = [];
            for (const sx of [-1, 1]) {
                const e = new THREE.Mesh(new THREE.SphereGeometry(0.058, 12, 10), eyeW);
                e.position.set(sx * 0.11, 0.68, 0.26);
                const p = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), eyeB);
                p.position.set(0, 0, 0.04);
                e.add(p);
                grp.add(e);
                eyes.push(e);
                const ear = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), fur);
                ear.position.set(sx * 0.2, 0.76, 0.06);
                grp.add(ear);
                for (let k = -1; k <= 1; k++) {
                    const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.2, 3), basic(0x1c1917));
                    wh.rotation.z = Math.PI / 2 + k * 0.18;
                    wh.position.set(sx * 0.18, 0.52 + k * 0.025, 0.34);
                    wh.userData.noHit = true;
                    grp.add(wh);
                }
            }
            const teeth = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.02), std(0xffffff, 0.3));
            teeth.position.set(0, 0.44, 0.36);
            grp.add(teeth);
            for (const sx of [-1, 1]) {
                const paw = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), std(0xf0abfc, 0.6));
                paw.scale.set(1.2, 0.6, 1);
                paw.position.set(sx * 0.2, 0.18, 0.28);
                grp.add(paw);
            }
            let helmet = null;
            if (variant === 'helmet') {
                helmet = new THREE.Group();
                const dome = new THREE.Mesh(new THREE.SphereGeometry(0.29, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), std(0xfacc15, 0.35, 0.2));
                const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.03, 20), std(0xeab308, 0.4, 0.2));
                const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 10), basic(0xfef9c3));
                lamp.rotation.x = Math.PI / 2;
                lamp.position.set(0, 0.13, 0.26);
                helmet.add(dome, brim, lamp);
                helmet.position.y = 0.78;
                grp.add(helmet);
            }
            if (variant === 'gold') {
                const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.1, 6, 1, true), new THREE.MeshStandardMaterial({ color: 0xfde047, metalness: 0.9, roughness: 0.2, side: THREE.DoubleSide, emissive: 0xa16207, emissiveIntensity: 0.5 }));
                crown.position.y = 0.88;
                grp.add(crown);
            }
            const hit = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), HIDDEN_MAT);
            hit.scale.set(1, 1.25, 1);
            hit.position.y = 0.48;
            grp.add(hit);
            return { mesh: grp, hitMeshes: [hit], ringCenter: new THREE.Vector3(0, 0.55, 0.3), eyes, helmet, body };
        },

        bomb() {
            const grp = new THREE.Group();
            const ball = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 14), std(0x18181b, 0.3, 0.6));
            ball.position.y = 0.4;
            ball.castShadow = true;
            grp.add(ball);
            const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 10), std(0x52525b, 0.4, 0.8));
            cap.position.y = 0.72;
            grp.add(cap);
            const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.16, 5), std(0xa8a29e, 0.9));
            fuse.position.set(0.03, 0.82, 0);
            fuse.rotation.z = -0.4;
            fuse.userData.noHit = true;
            grp.add(fuse);
            const spark = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), basic(0xfde047));
            spark.position.set(0.07, 0.9, 0);
            spark.userData.noHit = true;
            grp.add(spark);
            const band = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 6, 24), basic(0xdc2626));
            band.rotation.x = Math.PI / 2;
            band.position.y = 0.4;
            band.userData.noHit = true;
            grp.add(band);
            const hit = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), HIDDEN_MAT);
            hit.position.y = 0.42;
            grp.add(hit);
            return { mesh: grp, hitMeshes: [hit], ringCenter: new THREE.Vector3(0, 0.4, 0.3), spark };
        },

        /* ------------------------------------------------------- scenery */
        table(w = 3, d = 0.8, h = 1.0, top = 0x6b4f2e) {
            const grp = new THREE.Group();
            const slab = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), std(top, 0.7));
            slab.position.y = h;
            slab.castShadow = slab.receiveShadow = true;
            grp.add(slab);
            for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
                const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, h, 0.07), std(0x27272a, 0.5, 0.6));
                leg.position.set(sx * (w / 2 - 0.1), h / 2, sz * (d / 2 - 0.08));
                grp.add(leg);
            }
            const front = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.7, 0.04), std(0x3f3f46, 0.6, 0.3));
            front.position.set(0, h * 0.45, -d / 2 + 0.02);
            grp.add(front);
            return grp;
        },

        bulbs(points, colors = [0xfde047, 0xf97316, 0xef4444, 0x22d3ee, 0xa3e635], size = 0.06) {
            const grp = new THREE.Group();
            const list = [];
            points.forEach((p, i) => {
                const m = new THREE.MeshBasicMaterial({ color: colors[i % colors.length] });
                const b = new THREE.Mesh(new THREE.SphereGeometry(size, 8, 6), m);
                b.position.copy(p);
                b.userData.base = new THREE.Color(colors[i % colors.length]);
                grp.add(b);
                list.push(b);
            });
            grp.userData.bulbs = list;
            return grp;
        },

        /** Points along a sagging string between a and b. */
        sagPoints(a, b, n, sag = 0.4) {
            const out = [];
            for (let i = 0; i <= n; i++) {
                const t = i / n;
                const p = a.clone().lerp(b, t);
                p.y -= Math.sin(t * Math.PI) * sag;
                out.push(p);
            }
            return out;
        },

        animateBulbs(S, grp, speed = 3, pattern = 'chase') {
            const list = grp.userData.bulbs;
            let t = 0;
            S.animate((dt) => {
                t += dt * speed;
                for (let i = 0; i < list.length; i++) {
                    const on = pattern === 'chase' ? ((Math.floor(t) + i) % 3 !== 0) : (Math.sin(t + i * 0.7) > -0.2);
                    list[i].material.color.copy(list[i].userData.base).multiplyScalar(on ? 1 : 0.25);
                }
            });
        },

        windowsTex(seed = 1, lit = 0.45, tint = '#fde68a', base = '#1e293b') {
            return canvasTex('win:' + seed + ':' + lit + tint + base, 128, 256, (g, w, h) => {
                const rnd = L.mulberry32(seed * 97 + 13);
                g.fillStyle = base;
                g.fillRect(0, 0, w, h);
                for (let y = 8; y < h - 8; y += 20) {
                    for (let x = 8; x < w - 8; x += 20) {
                        const on = rnd() < lit;
                        g.fillStyle = on ? tint : 'rgba(15,23,42,0.85)';
                        g.globalAlpha = on ? 0.6 + rnd() * 0.4 : 1;
                        g.fillRect(x, y, 12, 13);
                    }
                }
                g.globalAlpha = 1;
            });
        },

        building(w, h, d, color = 0x334155, seed = 1, lit = 0.4, night = false) {
            const tex = A.windowsTex(seed % 6, lit, night ? '#fde68a' : '#93c5fd', night ? '#0f172a' : '#475569').clone();
            tex.needsUpdate = true;
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.userData.mgOwned = true;
            tex.repeat.set(Math.max(1, Math.round(w / 6)), Math.max(1, Math.round(h / 12)));
            const side = new THREE.MeshStandardMaterial({ map: tex, color, roughness: 0.7, metalness: 0.2, emissive: night ? 0xffffff : 0x000000, emissiveMap: night ? tex : null, emissiveIntensity: night ? 0.55 : 0 });
            const roof = std(0x1f2937, 0.85);
            const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, roof, roof, side, side]);
            m.position.y = h / 2;
            m.castShadow = m.receiveShadow = true;
            return m;
        },

        tree(scale = 1, color = 0x166534) {
            const grp = new THREE.Group();
            const bark = std(0x5b3a1f, 0.92);
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11 * scale, 0.21 * scale, 1.5 * scale, 9), bark);
            trunk.position.y = 0.75 * scale;
            trunk.castShadow = true;
            grp.add(trunk);
            const c1 = std(color, 0.88);
            const c2 = std(new THREE.Color(color).offsetHSL(0.02, 0.04, 0.06).getHex(), 0.86);
            const lobes = [
                [0, 2.05, 0, 1.05, 0.85, c1],
                [-0.52, 1.75, 0.35, 0.72, 0.68, c1],
                [0.54, 1.80, -0.30, 0.70, 0.66, c2],
                [0.10, 2.72, 0.08, 0.82, 0.76, c2]
            ];
            const crown = new THREE.Group();
            crown.position.y = 1.45 * scale;
            for (const [lx, ly, lz, r, sy, mat] of lobes) {
                const cl = new THREE.Mesh(new THREE.IcosahedronGeometry(r * scale, 1), mat);
                cl.position.set(lx * scale, (ly - 1.45) * scale, lz * scale);
                cl.scale.set(1.08, sy, 1.08);
                cl.castShadow = true;
                crown.add(cl);
            }
            grp.add(crown);
            grp.userData.crown = crown;
            return grp;
        },

        palm(scale = 1) {
            const grp = new THREE.Group();
            const bark = std(0x745333, 0.92);
            const frondMat = new THREE.MeshStandardMaterial({ color: 0x1a7f3e, roughness: 0.76, side: THREE.DoubleSide });
            const cocoMat = std(0x4a2c14, 0.85);
            let y = 0, x = 0;
            for (let i = 0; i < 8; i++) {
                const seg = new THREE.Mesh(new THREE.CylinderGeometry((0.16 - i * 0.011) * scale, (0.19 - i * 0.010) * scale, 0.64 * scale, 10), bark);
                seg.position.set(x, y + 0.30 * scale, 0);
                seg.rotation.z = -0.045 * i;
                seg.castShadow = true;
                grp.add(seg);
                x += Math.sin(0.045 * i) * 0.56 * scale;
                y += 0.58 * scale;
            }
            // Cluster of 3 coconuts nestled under the crown
            for (let c = 0; c < 3; c++) {
                const ca = (c / 3) * Math.PI * 2;
                const coco = new THREE.Mesh(new THREE.SphereGeometry(0.14 * scale, 10, 8), cocoMat);
                coco.scale.set(1, 1.15, 1);
                coco.position.set(x + Math.cos(ca) * 0.17 * scale, y - 0.14 * scale, Math.sin(ca) * 0.17 * scale);
                grp.add(coco);
            }
            // 10 gracefully arching drooping tropical palm fronds (zero spiky cones!)
            if (!A._palmFrondGeo) {
                const segs = 10;
                const pos = [], uvs = [], idx = [];
                for (let i = 0; i <= segs; i++) {
                    const t = i / segs;
                    const fx = t * 2.45;
                    const fy = Math.sin(t * Math.PI * 0.65) * 0.52 - Math.pow(t, 2.2) * 0.95;
                    const hw = 0.28 * Math.sin(Math.pow(t, 0.65) * Math.PI) + 0.03 * (1 - t);
                    pos.push(fx, fy, -hw, fx, fy + 0.04 * (1 - t), 0, fx, fy, hw);
                    uvs.push(t, 0, t, 0.5, t, 1);
                }
                for (let i = 0; i < segs; i++) {
                    const b = i * 3;
                    idx.push(b, b + 3, b + 1, b + 1, b + 3, b + 4, b + 1, b + 4, b + 2, b + 2, b + 4, b + 5);
                }
                const g = new THREE.BufferGeometry();
                g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
                g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
                g.setIndex(idx);
                g.computeVertexNormals();
                A._palmFrondGeo = g;
            }
            const fronds = [];
            for (let i = 0; i < 10; i++) {
                const holder = new THREE.Group();
                holder.position.set(x, y, 0);
                holder.rotation.y = (i / 10) * Math.PI * 2 + (i % 2) * 0.16;
                holder.rotation.z = (i % 2 === 0 ? 0.18 : -0.06);
                holder.userData.baseZ = holder.rotation.z;
                const frond = new THREE.Mesh(A._palmFrondGeo, frondMat);
                frond.scale.setScalar(scale * (i % 2 === 0 ? 0.95 : 1.08));
                frond.castShadow = true;
                holder.add(frond);
                grp.add(holder);
                fronds.push(holder);
            }
            grp.userData.fronds = fronds;
            return grp;
        },

        rock(scale = 1, color = 0x57534e) {
            const r = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 0), std(color, 0.95));
            r.scale.set(1, 0.7, 1.2);
            r.rotation.set(Math.random(), Math.random(), Math.random());
            r.castShadow = r.receiveShadow = true;
            return r;
        },

        sign(text, w = 4, h = 1, opts = {}) {
            const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: L.signTex(text, Object.assign({ w: 512, h: Math.round(512 * h / w) }, opts)), side: THREE.DoubleSide }));
            return m;
        },

        torch(S, pos, color = 0xf97316, light = true) {
            const grp = new THREE.Group();
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.075, 1.4, 8), std(0x3f2a14, 0.9));
            pole.position.y = 0.7;
            const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.13, 0.24, 12), std(0x27272a, 0.45, 0.75));
            bowl.position.y = 1.45;
            const coals = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshStandardMaterial({ color: 0x1a0a04, emissive: color, emissiveIntensity: 1.4, roughness: 0.9 }));
            coals.scale.y = 0.35;
            coals.position.y = 1.55;
            const flameGroup = new THREE.Group();
            flameGroup.position.y = 1.78;
            const fMat = (BO.MapDetail && BO.MapDetail._createFlameMaterial)
                ? BO.MapDetail._createFlameMaterial()
                : new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
            const pGeo = new THREE.PlaneGeometry(0.38, 0.56, 4, 8);
            for (let k = 0; k < 3; k++) {
                const fl = new THREE.Mesh(pGeo, fMat);
                fl.rotation.y = (k / 3) * Math.PI;
                flameGroup.add(fl);
            }
            grp.add(pole, bowl, coals, flameGroup);
            grp.position.copy(pos);
            let pl = null;
            if (light && BO.Settings.getQualityPreset().pointLights) {
                pl = new THREE.PointLight(color, 1.6, 14, 2);
                pl.position.set(0, 2, 0);
                grp.add(pl);
            }
            const seed = Math.random() * 10;
            S.animate((dt) => {
                const t = performance.now() * 0.001 + seed;
                const f = 0.85 + Math.sin(t * 13) * 0.1 + Math.sin(t * 29) * 0.06;
                flameGroup.scale.set(0.92 + Math.sin(t * 7) * 0.08, f, 0.92);
                if (BO.MapDetail && BO.MapDetail._fireUniforms) {
                    for (let u = 0; u < BO.MapDetail._fireUniforms.length; u++) BO.MapDetail._fireUniforms[u].value = t;
                }
                if (pl) pl.intensity = 1.4 * f;
            });
            return grp;
        },

        /** Instanced spectator crowd on a ring of stands. */
        crowd(S, radius, count, y0, rows = 4, rowStep = 1.1) {
            const geo = new THREE.BoxGeometry(0.42, 0.7, 0.32);
            const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.9 }), count);
            const headGeo = new THREE.SphereGeometry(0.17, 8, 6);
            const heads = new THREE.InstancedMesh(headGeo, new THREE.MeshStandardMaterial({ roughness: 0.8 }), count);
            const rnd = L.mulberry32(77);
            const shirt = [0xef4444, 0x3b82f6, 0xfacc15, 0x22c55e, 0xf97316, 0xa855f7, 0xe5e7eb, 0x111827];
            const skin = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac];
            const seats = [];
            const dummy = new THREE.Object3D();
            const col = new THREE.Color();
            for (let i = 0; i < count; i++) {
                const row = i % rows;
                const a = rnd() * Math.PI * 2;
                const r = radius + row * rowStep;
                seats.push({ a, r, y: y0 + row * rowStep * 0.75, ph: rnd() * 6.28, amp: 0.05 + rnd() * 0.12 });
                mesh.setColorAt(i, col.setHex(shirt[Math.floor(rnd() * shirt.length)]));
                heads.setColorAt(i, col.setHex(skin[Math.floor(rnd() * skin.length)]));
            }
            S.add(mesh); S.add(heads);
            let t = 0, excite = 0;
            const api = { cheer(v = 1) { excite = Math.max(excite, v); } };
            let frame = 0;
            S.animate((dt) => {
                t += dt;
                excite = Math.max(0, excite - dt * 0.35);
                if ((frame++ & 1) === 1) return;
                for (let i = 0; i < count; i++) {
                    const s = seats[i];
                    const jump = Math.max(0, Math.sin(t * (4 + excite * 6) + s.ph)) * (s.amp + excite * 0.35);
                    const x = Math.cos(s.a) * s.r, z = Math.sin(s.a) * s.r;
                    dummy.position.set(x, s.y + 0.35 + jump, z);
                    dummy.rotation.set(0, -s.a - Math.PI / 2, 0);
                    dummy.updateMatrix();
                    mesh.setMatrixAt(i, dummy.matrix);
                    dummy.position.y += 0.52;
                    dummy.updateMatrix();
                    heads.setMatrixAt(i, dummy.matrix);
                }
                mesh.instanceMatrix.needsUpdate = true;
                heads.instanceMatrix.needsUpdate = true;
            });
            return api;
        },

        /** Yaw that makes a target's +Z face a point. */
        yawTo(from, to) { return Math.atan2(to.x - from.x, to.z - from.z); }
    };

    BO.MinigameArt = A;
})(window);
