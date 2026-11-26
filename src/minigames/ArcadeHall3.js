/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Arcade Hall (part 3)
      7. Bottle Juggler — keep glass bottles in the air; every hit bumps one back up
      8. Color Lock     — only the colour on the signal lamp scores, and it keeps changing
      9. Number Crunch  — numbered balloons, shoot them in ascending order
     10. Echo Panels    — watch the light sequence, then shoot it back from memory
     11. Switchyard     — flip track switches so gold reaches the bank and TNT the pit
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const L = BO.MinigameLib;
    const A = BO.MinigameArt;
    const K = BO.MGCourseKit;
    const { B, SFX, std, basic, clamp01, TAU, esc } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);

    /* ------------------------------------------------------------ shared kit */
    const AK = BO.MGArcadeKit = {
        hall(S, o) {
            K.groundPlane(S, 140, o.ground ?? 0x1f2937);
            const acc = o.accent || '#f59e0b';
            // Classic-Whack quality striped carnival dome + boards + chasing marquee bulbs + prize shelves!
            const stripes = L.canvasTex('ak-tent:' + acc, 512, 64, (g, w, h) => {
                for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#fef3c7' : acc; g.fillRect(i * 32, 0, 32, h); }
            });
            stripes.wrapS = THREE.RepeatWrapping; stripes.repeat.set(4, 1);
            const dome = new THREE.Mesh(new THREE.ConeGeometry(28, 10, 36, 1, true), new THREE.MeshStandardMaterial({ map: stripes, side: THREE.BackSide, roughness: 0.85 }));
            dome.position.set(0, 18.5, -14); S.add(dome);
            const ringWall = new THREE.Mesh(new THREE.CylinderGeometry(28, 28, 13, 36, 1, true), new THREE.MeshStandardMaterial({ map: stripes, side: THREE.BackSide, roughness: 0.9 }));
            ringWall.position.set(0, 7.0, -14); S.add(ringWall);
            const floor = new THREE.Mesh(new THREE.CircleGeometry(28, 36), new THREE.MeshStandardMaterial({
                map: L.canvasTex('ak-boards', 256, 256, (g, w, h) => {
                    g.fillStyle = '#5c4028'; g.fillRect(0, 0, w, h);
                    for (let y = 0; y < h; y += 24) { g.fillStyle = y % 48 ? '#4a321f' : '#6b4a2f'; g.fillRect(0, y, w, 22); }
                }), roughness: 0.88
            }));
            floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.01, -14); S.add(floor);
            const sagPts = [];
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * TAU;
                sagPts.push(...A.sagPoints(V(0, 12.2, -14), V(Math.cos(a) * 26, 8.8, -14 + Math.sin(a) * 26), 10, 0.8));
            }
            const stringLights = A.bulbs(sagPts, [0xfde047, 0x38bdf8, 0xf472b6, 0x4ade80], 0.09);
            S.add(stringLights); A.animateBulbs(S, stringLights, 5, 'chase');

            K.booth(S, { w: 7.4, tall: true, roofY: 5.4, wood: o.wood ?? 0x3f3f46, trim: 0x18181b, awning: o.awning || acc });
            const sign = A.sign(o.title, 4.6, 0.62, { bg: '#0f172a', color: '#f8fafc', borderColor: acc, size: 0.48, glow: acc });
            sign.position.set(0, 4.92, -1.55); S.add(sign);
            const mPts = [];
            for (let i = 0; i <= 16; i++) { const x = -2.4 + (i / 16) * 4.8; mPts.push(V(x, 5.26, -1.52), V(x, 4.58, -1.52)); }
            const mb = A.bulbs(mPts, [0xfde047, 0xffffff], 0.045);
            S.add(mb); A.animateBulbs(S, mb, 7, 'chase');
            const plushCols = [0xf472b6, 0x60a5fa, 0xfacc15, 0xa78bfa, 0x4ade80];
            for (const side of [-1, 1]) {
                for (let sh = 0; sh < 2; sh++) {
                    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.07, 4.2), std(0x78350f, 0.8));
                    plank.position.set(side * 4.1, 1.5 + sh * 1.1, -3.2); S.add(plank);
                    for (let p = 0; p < 4; p++) {
                        const toy = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), std(plushCols[(p + sh + (side > 0 ? 2 : 0)) % plushCols.length], 0.9));
                        toy.position.set(side * 4.1, 1.75 + sh * 1.1, -4.5 + p * 0.85); S.add(toy);
                    }
                }
            }
        },
        map(atm, groundMat) {
            return {
                atmosphere: Object.assign({ skyTop: 0x0b1020, skyBottom: 0x312e81, fogColor: 0x1e1b4b, fogDensity: 0.01, sunColor: 0xe0e7ff, sunIntensity: 0.9, sunPos: [10, 40, 20], hemiSky: 0xc7d2fe, hemiGround: 0x1e1b4b, hemiIntensity: 1.0 }, atm || {}),
                boxes: [B(0, -0.5, -20, 140, 1, 140, groundMat || 'concrete')],
                spawn: { x: 0, y: 0, z: 0.2, yaw: 0 }
            };
        },
        /** Persistent shootable object (life 0 = stays until killed). */
        tgt(S, mesh, pos, o) {
            return S.addTarget(Object.assign({ mesh, pos, life: 0, appear: 'scale', inT: 0.15, death: 'pop', points: 100 }, o || {}));
        },
        textTex(key, text, o = {}) {
            return L.canvasTex('ak:' + key, o.w || 128, o.h || 128, (g, w, h) => {
                if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, w, h); } else g.clearRect(0, 0, w, h);
                g.font = `900 ${Math.round(h * (o.size || 0.62))}px Bahnschrift, Impact, sans-serif`;
                g.textAlign = 'center'; g.textBaseline = 'middle';
                g.lineWidth = h * 0.08; g.strokeStyle = o.stroke || 'rgba(0,0,0,0.8)';
                const maxW = Math.round(w * 0.88);
                g.strokeText(text, w / 2, h / 2 + h * 0.04, maxW);
                g.fillStyle = o.color || '#ffffff';
                g.fillText(text, w / 2, h / 2 + h * 0.04, maxW);
            });
        },
        chip: (label, val, bad) => `<div class="mgx-chip ${bad ? 'mgx-bad' : ''}">${esc(label)} <b>${val}</b></div>`,
        lives: (n, max) => `<div class="mgx-chip">LIVES <b>${'♥'.repeat(Math.max(0, n))}${'♡'.repeat(Math.max(0, max - n))}</b></div>`
    };
    const ARC = { cat: 'arcade', infiniteMag: true, forgivingMisses: true, lockWeapon: true, oneTargetPerShot: true };

    /* =====================================================================
       7. BOTTLE JUGGLER — Corkscrew Air-Cannon Bar + Etched Vintage Bottles
    ===================================================================== */
    function bottleLabelTex(colHex, brand) {
        const hex = '#' + colHex.toString(16).padStart(6, '0');
        return L.canvasTex('btl-lbl:' + hex + ':' + brand, 128, 128, (g, w, h) => {
            g.fillStyle = hex; g.fillRect(0, 0, w, h);
            g.fillStyle = '#fef3c7'; g.fillRect(8, 28, w - 16, 72);
            g.strokeStyle = '#92400e'; g.lineWidth = 4; g.strokeRect(12, 32, w - 24, 64);
            g.fillStyle = '#451a03'; g.font = '900 22px Bahnschrift, Impact, sans-serif';
            g.textAlign = 'center'; g.textBaseline = 'middle';
            g.fillText(brand, w / 2, 64, w - 30);
        });
    }
    function bottleMesh(col, idx = 0) {
        const g = new THREE.Group();
        const brands = ['SARSAPARILLA', 'TONIC 99', 'EMERALD ALE', 'RUBY FIZZ', 'GOLD RESERVE'];
        const glass = new THREE.MeshStandardMaterial({ color: col, roughness: 0.12, metalness: 0.18, transparent: true, opacity: 0.86, emissive: col, emissiveIntensity: 0.25 });
        const lblMat = new THREE.MeshStandardMaterial({ map: bottleLabelTex(col, brands[idx % brands.length]), roughness: 0.32, metalness: 0.12 });
        const baseRing = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.18, 0.08, 16), glass);
        baseRing.position.y = -0.24;
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.44, 16), [lblMat, glass, glass]);
        const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.165, 14, 10, 0, TAU, 0, Math.PI * 0.5), glass);
        shoulder.position.y = 0.21;
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.095, 0.26, 12), glass);
        neck.position.y = 0.43;
        const lip = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.016, 6, 14), glass);
        lip.rotation.x = Math.PI / 2; lip.position.y = 0.55;
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.06, 12), std(0xfacc15, 0.25, 0.85));
        cap.position.y = 0.58;
        cap.userData.noHit = true;
        g.add(baseRing, body, shoulder, neck, lip, cap);
        return { g, hit: [baseRing, body, shoulder, neck] };
    }
    MG.register(Object.assign({}, ARC, {
        id: 'bottle_juggler', order: 7, name: 'Bottle Juggler', icon: '🍾', accent: '#10b981',
        tagline: 'Triple brass air-cannons! Never let a vintage bottle hit the sawdust!',
        desc: 'Step up to the Brass Saloon Air-Cannon Bar! Three pressurised brass mortars lob etched vintage glass bottles high over the illuminated backbar. Every shot bumps a bottle back skyward and climbs its combo pitch—while a cushioned Green Safety Mat slides across the floor for emergency bounce saves! Three shattered bottles ends the show.',
        heroLabel: 'ARCADE HALL • KEEP-IT-UP • 60 SECONDS', duration: 60, stars: [2500, 7000, 14000, 22000],
        standardWeapon: 'm1911', weaponLabel: 'M1911', weaponNote: 'Bottomless magazine • chain bumps on the same bottle!',
        keys: [['LMB', 'Bump bottle skyward'], ['R', 'Retry from results']],
        map: AK.map({ skyTop: 0x0c4a6e, skyBottom: 0x67e8f9, fogColor: 0x7dd3fc, fogDensity: 0.006, sunIntensity: 1.5 }),
        build(S) {
            AK.hall(S, { title: 'BOTTLE JUGGLER', accent: '#10b981', ground: 0x14532d });
            // Ornate Mahogany & Brass Backbar Stage + 3 Pressurised Air-Cannon Mortars!
            const mahogany = std(0x451a03, 0.65, 0.15), brass = std(0xf59e0b, 0.25, 0.86), mirrorMat = std(0x0f766e, 0.18, 0.65);
            const backWall = new THREE.Mesh(new THREE.BoxGeometry(18.4, 9.2, 0.5), mahogany);
            backWall.position.set(0, 4.6, -16.2); S.add(backWall); S.solid(backWall);
            const mirror = new THREE.Mesh(new THREE.PlaneGeometry(16.4, 6.8), mirrorMat);
            mirror.position.set(0, 4.9, -15.92); S.add(mirror);
            for (const sy of [1.8, 3.6, 5.4]) {
                const shelf = new THREE.Mesh(new THREE.BoxGeometry(16.0, 0.12, 0.45), mahogany);
                shelf.position.set(0, sy, -15.7); S.add(shelf);
            }
            const cannons = [];
            for (const cx of [-4.2, 0, 4.2]) {
                const cg = new THREE.Group(); cg.position.set(cx, 0, -12);
                const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.78, 0.55, 16), mahogany); ped.position.y = 0.28;
                const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 0.95, 16), brass); barrel.position.y = 0.92;
                const muzzle = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.06, 8, 18), brass); muzzle.rotation.x = Math.PI / 2; muzzle.position.y = 1.40;
                cg.add(ped, barrel, muzzle); S.add(cg);
                cannons.push(cg);
            }
            // Sliding Cushioned Bounce Mat along the floor (auto-bounces any bottle that lands on it!)
            const bouncePad = new THREE.Group();
            const padBase = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.24, 1.8), std(0x10b981, 0.4, 0.2, { emissive: 0x059669, emissiveIntensity: 0.35 }));
            padBase.position.y = 0.12;
            const padRim = new THREE.Mesh(new THREE.BoxGeometry(3.35, 0.08, 1.95), basic(0xfde047));
            padRim.position.y = 0.25;
            bouncePad.add(padBase, padRim); bouncePad.position.set(0, 0, -12);
            S.add(bouncePad);
            Object.assign(S.data, { lives: 3, bottles: [], cannons, bouncePad, nextB: 0.5, launched: 0, bestChain: 0, bumps: 0 });
        },
        update(S, dt, lib, state) {
            const D = S.data;
            if (D.bouncePad) D.bouncePad.position.x = Math.sin(S.t * 1.35) * 4.8;
            if (state !== 'running') return;
            D.nextB -= dt;
            if (D.nextB <= 0 && D.bottles.filter((b) => b.alive).length < 5) {
                D.nextB = Math.max(3.8, 7.6 - S.t * 0.06);
                const cIdx = D.launched % 3;
                const launchX = [-4.2, 0, 4.2][cIdx];
                const m = bottleMesh([0x22c55e, 0x0ea5e9, 0xa855f7, 0xf97316, 0xfacc15][D.launched % 5], D.launched);
                const b = AK.tgt(S, m.g, V(launchX, 1.55, -12), { hitMeshes: m.hit, death: 'shatter', deathColor: 0x86efac, bonus: true });
                b.vel = V((Math.random() - 0.5) * 2.6 - launchX * 0.25, 9.6, 0);
                b.body = m.g;
                b.chain = 0;
                BO.FX.spawnParticles(V(launchX, 1.5, -12), 10, 0xfde047, 3.2, 2.5, 0.35, 0.7);
                b.onTick = (t, dt2) => {
                    if (MG.state !== 'running' || !t.alive) return;
                    t.vel.y -= 7.5 * dt2;
                    t.root.position.addScaledVector(t.vel, dt2);
                    const p = t.root.position;
                    if (Math.random() < dt2 * 10) BO.FX.spawnParticles(p, 1, 0xa7f3d0, 0.6, 0.2, 0.25, 0.45);
                    if (Math.abs(p.x) > 6.5) { t.vel.x = -Math.sign(p.x) * Math.abs(t.vel.x); p.x = Math.sign(p.x) * 6.5; }
                    if (p.y > 7.8) t.vel.y = Math.min(t.vel.y, 0);
                    t.body.rotation.z += (t.vel.x * 0.8 + 1.8) * dt2;
                    if (p.y < 0.42 && t.vel.y < 0) {
                        if (D.bouncePad && Math.abs(p.x - D.bouncePad.position.x) < 1.75) {
                            t.vel.y = 8.4; p.y = 0.45;
                            SFX.boing();
                            MG.popup(p.clone().add(V(0, 0.6, 0)), 'MAT SAVE!', '#6ee7b7');
                            return;
                        }
                        t.kill({ pt: p.clone() });
                        SFX.shatter();
                        D.lives--;
                        S.breakCombo('DROPPED');
                        MG.toast(D.lives > 0 ? `BOTTLE DROPPED • ${D.lives} LIVES` : 'LAST BOTTLE DROPPED', '#f87171');
                        if (D.lives <= 0) MG.finish('ALL DROPPED', { color: '#f87171' });
                    }
                };
                D.bottles.push(b);
                D.launched++;
                SFX.launch();
            }
        },
        onHit(S, ent, info) {
            if (!ent.alive || ent.vel === undefined) return false;
            const D = S.data;
            ent.chain++;
            D.bumps++;
            D.bestChain = Math.max(D.bestChain, ent.chain);
            ent.vel.y = 6.2 + Math.random() * 1.8;
            ent.vel.x = (Math.random() - 0.5) * 3 - ent.root.position.x * 0.3;
            S.hits++; S.kills++;
            S.bumpCombo();
            const pts = Math.round((30 + Math.min(ent.chain, 20) * 10) * S.comboMult);
            S.award(pts, info.pt, 'x' + ent.chain, '#6ee7b7');
            SFX.tone(600 + ent.chain * 40, 900 + ent.chain * 40, 0.12, 'triangle', 0.14);
            return false;
        },
        hud(S) { const D = S.data; return `<div class="ah3-panel">${AK.lives(D.lives, 3)}${AK.chip('IN THE AIR', D.bottles.filter((b) => b.alive).length)}${AK.chip('BEST CHAIN', D.bestChain)}</div>`; },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return { score: S.score, stars, title: D.lives > 0 ? 'STILL JUGGLING' : 'SMASHED', stats: [['BUMPS', D.bumps], ['BEST CHAIN', D.bestChain], ['BOTTLES', D.launched], ['LIVES LEFT', Math.max(0, D.lives)], ['BEST STREAK', S.maxCombo], ['ACCURACY', S.shots ? Math.round(S.shotHits / S.shots * 100) + '%' : '—']], xp: Math.round(120 + S.score * 0.04 + stars * 120) };
        }
    }));

    /* =====================================================================
       8. COLOR LOCK — Grand Prism Reactor Stage (4-Lens Signal Tower,
          Colorblind-Friendly Shape Symbols, Wildcard Rainbow Prisms,
          Chain-Zap Capacitors, Skull Hazard Locks & Fever Overdrive!)
    ===================================================================== */
    const CL_COLS = [
        { n: 'RUBY RED', sym: '◆', shape: 'diamond', c: 0xef4444, dark: 0x7f1d1d, css: '#ef4444' },
        { n: 'COBALT BLUE', sym: '●', shape: 'circle', c: 0x3b82f6, dark: 0x1e3a8a, css: '#38bdf8' },
        { n: 'EMERALD GREEN', sym: '▲', shape: 'tri', c: 0x22c55e, dark: 0x14532d, css: '#4ade80' },
        { n: 'SOLAR GOLD', sym: '★', shape: 'star', c: 0xfacc15, dark: 0x854d0e, css: '#fde047' }
    ];

    function clTileFaceTex(key, bgHex, borderHex, symbol, subText) {
        return L.canvasTex('cl-face:' + key, 192, 128, (g, w, h) => {
            const grad = g.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, bgHex);
            grad.addColorStop(1, '#090d16');
            g.fillStyle = grad; g.fillRect(0, 0, w, h);
            g.strokeStyle = borderHex; g.lineWidth = 8;
            g.strokeRect(6, 6, w - 12, h - 12);
            g.fillStyle = borderHex;
            for (const [rx, ry] of [[16, 16], [w - 16, 16], [16, h - 16], [w - 16, h - 16]]) {
                g.beginPath(); g.arc(rx, ry, 4, 0, TAU); g.fill();
            }
            g.fillStyle = '#ffffff';
            g.font = '900 54px Bahnschrift, Impact, sans-serif';
            g.textAlign = 'center'; g.textBaseline = 'middle';
            g.shadowColor = borderHex; g.shadowBlur = 12;
            g.fillText(symbol, w / 2, h * 0.44);
            g.shadowBlur = 0;
            if (subText) {
                g.font = '900 20px Bahnschrift, sans-serif';
                g.fillStyle = '#fef08a';
                g.fillText(subText, w / 2, h * 0.80, w - 24);
            }
        });
    }

    function buildPrismCell(ci, specialKind) {
        const grp = new THREE.Group();
        const chrome = std(0x94a3b8, 0.25, 0.86);
        const housingMat = std(0x1e293b, 0.5, 0.65);

        const housing = new THREE.Mesh(new THREE.BoxGeometry(1.92, 1.24, 0.14), housingMat);
        const bezel = new THREE.Mesh(new THREE.BoxGeometry(1.78, 1.10, 0.18), chrome);
        for (const sx of [-0.98, 0.98]) {
            const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.34, 10), chrome);
            hinge.rotation.z = Math.PI / 2; hinge.position.set(sx, 0, -0.02);
            hinge.userData.noHit = true;
            grp.add(hinge);
        }

        let faceMat, rimCol;
        if (specialKind === 'prism') {
            faceMat = new THREE.MeshStandardMaterial({
                map: clTileFaceTex('prism', '#a855f7', '#fde047', '✦', 'RAINBOW WILD'),
                emissive: 0xc084fc, emissiveIntensity: 0.55, roughness: 0.2
            });
            rimCol = 0xfde047;
        } else if (specialKind === 'chain') {
            const C = CL_COLS[ci];
            faceMat = new THREE.MeshStandardMaterial({
                map: clTileFaceTex('chain-' + ci, C.css, '#ffffff', '⚡' + C.sym, 'CHAIN ZAP'),
                emissive: C.c, emissiveIntensity: 0.65, roughness: 0.2
            });
            rimCol = 0xffffff;
        } else if (specialKind === 'skull') {
            faceMat = new THREE.MeshStandardMaterial({
                map: clTileFaceTex('skull', '#450a0a', '#ef4444', '☠', 'DO NOT SHOOT'),
                emissive: 0x7f1d1d, emissiveIntensity: 0.45, roughness: 0.35
            });
            rimCol = 0x111827;
        } else {
            const C = CL_COLS[ci];
            faceMat = new THREE.MeshStandardMaterial({
                map: clTileFaceTex('std-' + ci, '#' + C.dark.toString(16).padStart(6, '0'), C.css, C.sym, C.n.split(' ')[0]),
                emissive: C.c, emissiveIntensity: 0.48, roughness: 0.25
            });
            rimCol = C.c;
        }

        const lens = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.96, 0.22), [chrome, chrome, chrome, chrome, faceMat, housingMat]);
        const neonBorder = new THREE.Mesh(new THREE.BoxGeometry(1.72, 1.04, 0.19), basic(rimCol));
        neonBorder.userData.noHit = true;
        grp.add(housing, bezel, neonBorder, lens);
        return { grp, hit: [housing, bezel, lens], neonBorder };
    }

    MG.register(Object.assign({}, ARC, {
        id: 'color_lock', order: 8, name: 'Color Lock', icon: '🚦', accent: '#f43f5e',
        tagline: 'Grand Prism Reactor! Match the 4-lens signal tower, trigger Chain Zaps & Fever Overdrive!',
        desc: 'Step onto the Prism Reactor Game-Show Stage! A towering 4-lens Signal Pylon & Countdown Ring broadcast the LIVE colour and symbol (◆ Red, ● Blue, ▲ Green, ★ Gold), plus a NEXT-COLOUR preview lens so you can pre-aim switches! Shoot matching cells to charge your FEVER OVERDRIVE bar—at 100% Charge, EVERY cell turns Solar Gold for 5 seconds of penalty-free jackpot fire! Watch for ⚡ Chain-Zap Capacitors (auto-detonate every live tile on the board!), ✦ Rainbow Prisms (always valid + +2s bonus time!), and ☠ Skull Locks!',
        guide: {
            objective: 'Shoot mechanical prism cells matching the LIVE colour/symbol on the Signal Tower while avoiding mismatched colours and ☠ Skull Locks!',
            tips: [
                'Watch the NEXT PREVIEW badge and rotating countdown ring above the board—when < 1.0s remains, pre-aim a tile of the upcoming colour!',
                '⚡ CHAIN-ZAP tiles matching the live colour arc lightning into EVERY other live tile on the wall for an instant multi-kill!',
                'Build 8 clean hits to trigger 5 seconds of 🔥 FEVER OVERDRIVE where ALL tiles turn Gold and score bonus points with zero wrong-colour penalties!'
            ]
        },
        heroLabel: 'ARCADE HALL • PRISM REACTOR SHOW • 60 SECONDS', duration: 60, stars: [3600, 8200, 14500, 21500],
        standardWeapon: 'five_seven', weaponLabel: 'FIVE-SEVEN TACTICAL', weaponNote: 'Bottomless magazine • ⚡ Chain Zaps • ✦ Wild Prisms • 🔥 Fever Mode',
        keys: [['LMB', 'Shoot Live Colour / Wild Prism'], ['R', 'Retry from results']],
        map: AK.map({ skyTop: 0x090418, skyBottom: 0x3b0764, fogColor: 0x1e1b4b, fogDensity: 0.008 }),
        build(S) {
            AK.hall(S, { title: 'COLOR LOCK • PRISM REACTOR', accent: '#f43f5e' });

            const steel = std(0x1e293b, 0.45, 0.75), chrome = std(0xcbd5e1, 0.22, 0.88);
            const boardBack = new THREE.Mesh(new THREE.BoxGeometry(17.4, 7.6, 0.55), steel);
            boardBack.position.set(0, 4.1, -14.55); S.add(boardBack); S.solid(boardBack);

            for (let i = 0; i < 18; i++) {
                const sx = -6.5 + (i % 6) * 2.6, sy = 1.65 + Math.floor(i / 6) * 1.75;
                const bay = new THREE.Mesh(new THREE.BoxGeometry(2.05, 1.36, 0.12), std(0x090d16, 0.8));
                bay.position.set(sx, sy, -14.26);
                const bayTrim = new THREE.Mesh(new THREE.BoxGeometry(2.14, 1.44, 0.06), chrome);
                bayTrim.position.set(sx, sy, -14.29);
                S.add(bayTrim); S.add(bay);
            }

            const sideTubes = [];
            for (const side of [-1, 1]) {
                const colX = side * 9.4;
                const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.9, 1.1, 16), steel);
                ped.position.set(colX, 0.55, -13.8);
                const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.75, 0.8, 16), steel);
                cap.position.set(colX, 7.7, -13.8);
                const coreTube = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 6.2, 16), basic(CL_COLS[0].c));
                coreTube.position.set(colX, 4.1, -13.8);
                sideTubes.push(coreTube);
                for (let r = 0; r < 5; r++) {
                    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.06, 8, 20), chrome);
                    coil.rotation.x = Math.PI / 2; coil.position.set(colX, 1.7 + r * 1.2, -13.8);
                    S.add(coil);
                }
                S.add(ped); S.add(cap); S.add(coreTube);
            }

            const towerG = new THREE.Group();
            towerG.position.set(0, 8.55, -13.85);
            const towerHousing = new THREE.Mesh(new THREE.BoxGeometry(8.6, 1.55, 0.65), steel);
            towerG.add(towerHousing);
            const towerLenses = CL_COLS.map((c, idx) => {
                const lx = -3.0 + idx * 2.0;
                const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.22, 20), chrome);
                bezel.rotation.x = Math.PI / 2; bezel.position.set(lx, 0, 0.28);
                const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.46, 18, 14), new THREE.MeshStandardMaterial({
                    color: c.dark, emissive: c.c, emissiveIntensity: idx === 0 ? 1.8 : 0.08, roughness: 0.2
                }));
                bulb.scale.z = 0.45; bulb.position.set(lx, 0, 0.34);
                towerG.add(bezel, bulb);
                return bulb;
            });
            const timerHalo = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.065, 8, 28), basic(0xffffff));
            timerHalo.position.set(-3.0, 0, 0.42);
            towerG.add(timerHalo);
            S.add(towerG);

            const liveSignMat = new THREE.MeshBasicMaterial({ map: L.signTex('LIVE: ◆ RUBY RED', { w: 512, h: 96, bg: '#450a0a', color: '#ffffff', borderColor: '#ef4444', size: 0.52 }) });
            const liveSign = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 0.95), liveSignMat);
            liveSign.position.set(0, 7.25, -14.12);
            S.add(liveSign);

            Object.assign(S.data, {
                towerLenses, timerHalo, sideTubes, liveSign, liveSignMat,
                live: 0, next: 1, switchT: 5.2, switchMax: 5.2, spawnT: 0.35,
                slots: new Array(18).fill(null),
                feverCharge: 0, feverT: 0, chainZaps: 0, right: 0, wrong: 0
            });
            this._refreshSignalVisuals(S);
        },
        _refreshSignalVisuals(S) {
            const D = S.data;
            const isFever = D.feverT > 0;
            const cur = CL_COLS[D.live];
            const colHex = isFever ? 0xfacc15 : cur.c;
            D.towerLenses.forEach((b, idx) => {
                const active = isFever || idx === D.live;
                b.material.emissiveIntensity = active ? 1.85 : (idx === D.next ? 0.35 : 0.06);
                b.scale.setScalar(active ? 1.12 : 0.92);
                b.scale.z = 0.45;
            });
            D.timerHalo.position.x = -3.0 + D.live * 2.0;
            D.timerHalo.material.color.setHex(isFever ? 0xfde047 : 0xffffff);
            for (const tb of D.sideTubes) tb.material.color.setHex(colHex);
            D.liveSignMat.map = L.signTex(
                isFever ? '🔥 FEVER OVERDRIVE — ALL TILES SCORE! 🔥' : `LIVE: ${cur.sym} ${cur.n}   (NEXT: ${CL_COLS[D.next].sym})`,
                { w: 512, h: 96, bg: isFever ? '#78350f' : '#0f172a', color: isFever ? '#fef08a' : cur.css, borderColor: isFever ? '#facc15' : cur.css, size: 0.44 }
            );
            D.liveSignMat.needsUpdate = true;
        },
        update(S, dt, lib, state) {
            const D = S.data;
            if (state !== 'running') return;

            if (D.feverT > 0) {
                D.feverT = Math.max(0, D.feverT - dt);
                D.timerHalo.scale.setScalar(1 + Math.sin(S.t * 18) * 0.12);
                if (D.feverT <= 0) {
                    MG.toast('FEVER ENDED — BACK TO SIGNAL LOCK!', CL_COLS[D.live].css);
                    this._refreshSignalVisuals(S);
                }
            } else {
                D.switchT -= dt;
                const frac = clamp01(D.switchT / D.switchMax);
                D.timerHalo.scale.setScalar(0.55 + frac * 0.55);
                if (D.switchT < 1.0) {
                    const blinkNext = Math.floor(D.switchT * 10) % 2 === 0;
                    for (const tb of D.sideTubes) tb.material.color.setHex(blinkNext ? CL_COLS[D.next].c : CL_COLS[D.live].c);
                }
                if (D.switchT <= 0) {
                    D.live = D.next;
                    D.next = (D.live + 1 + Math.floor(Math.random() * 3)) % 4;
                    D.switchMax = Math.max(3.0, 5.2 - S.t * 0.032);
                    D.switchT = D.switchMax;
                    this._refreshSignalVisuals(S);
                    MG.toast(`${CL_COLS[D.live].sym} ${CL_COLS[D.live].n} IS LIVE!`, CL_COLS[D.live].css);
                    SFX.tone(880, 1320, 0.16, 'square', 0.10);
                }
            }

            for (const tg of D.slots) {
                if (!tg || !tg.alive) continue;
                if (tg.specialKind === 'prism') {
                    tg.neonBorder.material.color.setHSL((S.t * 1.4) % 1, 0.95, 0.6);
                    tg.pivot.rotation.z = Math.sin(S.t * 6) * 0.05;
                } else if (D.feverT > 0 && tg.specialKind !== 'skull') {
                    tg.neonBorder.material.color.setHex(0xfde047);
                }
            }

            D.spawnT -= dt;
            if (D.spawnT <= 0) {
                D.spawnT = Math.max(0.24, 0.52 - S.t * 0.004);
                const free = D.slots.map((s, i) => (s && s.alive ? -1 : i)).filter((i) => i >= 0);
                if (!free.length) return;
                const i = free[Math.floor(Math.random() * free.length)];
                const r = Math.random();
                let specialKind = null;
                let ci = Math.random() < 0.46 ? D.live : Math.floor(Math.random() * 4);
                if (r < 0.08) { specialKind = 'prism'; }
                else if (r < 0.18) { specialKind = 'chain'; ci = D.live; }
                else if (S.t > 8 && r < 0.25) { specialKind = 'skull'; }

                const cell = buildPrismCell(ci, specialKind);
                const pos = V(-6.5 + (i % 6) * 2.6, 1.65 + Math.floor(i / 6) * 1.75, -14.08);
                const tg = S.addTarget({
                    mesh: cell.grp, hitMeshes: cell.hit, pos,
                    life: Math.max(1.35, 2.5 - S.t * 0.012), appear: 'flip',
                    death: specialKind === 'prism' ? 'burst' : 'shatter',
                    deathColor: specialKind === 'prism' ? 0xfde047 : specialKind === 'skull' ? 0xef4444 : CL_COLS[ci].c,
                    bonus: true
                });
                tg.ci = ci;
                tg.specialKind = specialKind;
                tg.neonBorder = cell.neonBorder;
                D.slots[i] = tg;
            }
        },
        onHit(S, ent, info) {
            if (!ent.alive || ent.ci === undefined) return false;
            const D = S.data;
            S.hits++;
            ent.kill(info);

            if (ent.specialKind === 'skull') {
                D.wrong++; S.penalties++; D.feverCharge = Math.max(0, D.feverCharge - 35);
                S.award(-250, info.pt, '☠ SKULL LOCK!', '#f87171');
                S.breakCombo('SKULL LOCK');
                SFX.buzzer();
                MG.flashScreen('rgba(220,38,38,0.3)');
                return true;
            }

            const isValid = (D.feverT > 0) || (ent.specialKind === 'prism') || (ent.ci === D.live);
            if (isValid) {
                D.right++; S.kills++;
                S.bumpCombo();
                if (ent.specialKind === 'prism') {
                    S.t = Math.max(0, S.t - 2.0);
                    S.award(Math.round(300 * S.comboMult), info.pt, '✦ WILD PRISM (+2s)!', '#fde047');
                    SFX.fanfare();
                } else if (ent.specialKind === 'chain') {
                    D.chainZaps++;
                    let chained = 1;
                    const origin = ent.root.position.clone();
                    for (const other of D.slots) {
                        if (other && other !== ent && other.alive && other.specialKind !== 'skull' && (other.ci === D.live || D.feverT > 0 || other.specialKind === 'prism')) {
                            BO.FX.spawnTracer(origin, other.root.position.clone(), 0xfde047, 0.16, 0.22);
                            other.kill({ pt: other.root.position.clone() });
                            D.right++; S.kills++; S.bumpCombo(); chained++;
                        }
                    }
                    S.award(Math.round(160 * chained * S.comboMult), info.pt, `⚡ CHAIN ZAP x${chained}!`, '#fde047');
                    SFX.tone(520, 1480, 0.24, 'sawtooth', 0.14);
                } else {
                    const colObj = CL_COLS[ent.ci];
                    const basePts = D.feverT > 0 ? 180 : 120;
                    S.award(Math.round(basePts * S.comboMult), info.pt, D.feverT > 0 ? '🔥 FEVER GOLD!' : `${colObj.sym} ${colObj.n.split(' ')[0]}`, D.feverT > 0 ? '#fde047' : colObj.css);
                    SFX.ding(D.feverT > 0 ? 1.35 : 1.1);
                }

                if (D.feverT <= 0) {
                    D.feverCharge = Math.min(100, D.feverCharge + (ent.specialKind ? 24 : 13));
                    if (D.feverCharge >= 100) {
                        D.feverCharge = 0;
                        D.feverT = 5.0;
                        this._refreshSignalVisuals(S);
                        MG.toast('🔥 FEVER OVERDRIVE (5s) — EVERY TILE SCORES GOLD!', '#fde047');
                        SFX.fanfare();
                    }
                }
            } else {
                D.wrong++; S.penalties++;
                D.feverCharge = Math.max(0, D.feverCharge - 25);
                S.award(-150, info.pt, `WRONG! NEED ${CL_COLS[D.live].sym}`, '#f87171');
                S.breakCombo('WRONG COLOUR');
                SFX.buzzer();
                MG.flashScreen('rgba(220,38,38,0.25)');
            }
            return true;
        },
        hud(S) {
            const D = S.data, c = CL_COLS[D.live], nx = CL_COLS[D.next];
            const liveBadge = D.feverT > 0
                ? `<div class="mgx-chip mgx-hot">🔥 FEVER OVERDRIVE <b>${D.feverT.toFixed(1)}s</b></div>`
                : `<div class="mgx-chip" style="border-color:${c.css}">LIVE <b style="color:${c.css}">${c.sym} ${c.n}</b></div><div class="mgx-chip">NEXT <b style="color:${nx.css}">${nx.sym} ${D.switchT.toFixed(1)}s</b></div>`;
            return `<div class="ah3-panel">${liveBadge}${AK.chip('FEVER', Math.round(D.feverCharge) + '%')}${D.wrong ? AK.chip('FAULTS', D.wrong, true) : ''}</div>`;
        },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return { score: S.score, stars, title: stars >= 3 ? 'PRISM REACTOR GRANDMASTER' : 'REACTOR CYCLE COMPLETE', stats: [['VALID HITS', D.right], ['CHAIN ZAPS', D.chainZaps], ['FAULTS', D.wrong], ['BEST STREAK', S.maxCombo], ['ACCURACY', S.shots ? Math.round(S.shotHits / S.shots * 100) + '%' : '—']], xp: Math.round(135 + S.score * 0.04 + stars * 130) };
        }
    }));

    /* =====================================================================
       9. NUMBER CRUNCH — Carnival Launch Baskets + Glossy Knotted Balloons
    ===================================================================== */
    MG.register(Object.assign({}, ARC, {
        id: 'number_crunch', order: 9, name: 'Number Crunch', icon: '🔢', accent: '#eab308',
        tagline: 'One, two, three… pop the carnival bouquet in ascending order, fast!',
        desc: 'Wicker launch baskets release numbered helium balloons beneath a glowing NEXT-NUMBER scoreboard! Pop them in strict ascending order: 1, then 2, then 3. Popping out of sequence costs 2 seconds off the clock. Every finished bouquet awards a speed bonus and adds one more balloon to the next wave!',
        heroLabel: 'ARCADE HALL • SEQUENCE • 60 SECONDS', duration: 60, stars: [2500, 6000, 10000, 15000],
        standardWeapon: 'python_magnum', weaponLabel: 'PYTHON .357', weaponNote: 'Bottomless cylinder • watch the NEXT # board!',
        keys: [['LMB', 'Pop the next number'], ['R', 'Retry from results']],
        map: AK.map({ skyTop: 0x1d4ed8, skyBottom: 0xfef3c7, fogColor: 0xfde68a, fogDensity: 0.005, sunIntensity: 1.6 }),
        build(S) {
            AK.hall(S, { title: 'NUMBER CRUNCH', accent: '#eab308', ground: 0x3f6212 });
            // Wicker Helium Launch Baskets + Sandbags + Giant Overhead NEXT NUMBER Digital Display!
            const wicker = std(0x92400e, 0.88), trim = std(0x451a03, 0.9), brass = std(0xfacc15, 0.28, 0.85);
            for (const bx of [-5.2, -1.7, 1.7, 5.2]) {
                const bg = new THREE.Group(); bg.position.set(bx, 0, -11.5);
                const tub = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.48, 0.68, 14), wicker); tub.position.y = 0.34;
                const lip = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.055, 6, 16), trim); lip.rotation.x = Math.PI / 2; lip.position.y = 0.68;
                const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.82, 10), brass); tank.position.set(0.32, 0.45, 0);
                bg.add(tub, lip, tank); S.add(bg);
            }
            const nextSignMat = new THREE.MeshBasicMaterial({ map: L.signTex('POP NEXT: #1', { w: 512, h: 112, bg: '#1e1b4b', color: '#fde047', borderColor: '#facc15', size: 0.56 }) });
            const nextSign = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.05), nextSignMat);
            nextSign.position.set(0, 6.85, -13.2); S.add(nextSign);
            Object.assign(S.data, { size: 4, next: 1, set: [], setT: 0, sets: 0, wrong: 0, gapT: 0.35, nextSignMat });
        },
        _updateNextSign(S) {
            const D = S.data;
            if (!D.nextSignMat) return;
            const txt = D.next <= D.size ? `POP NEXT: #${D.next}  (OF ${D.size})` : 'SET CLEAR!';
            D.nextSignMat.map = L.signTex(txt, { w: 512, h: 112, bg: '#1e1b4b', color: D.next <= D.size ? '#fde047' : '#86efac', borderColor: '#facc15', size: 0.48 });
            D.nextSignMat.needsUpdate = true;
        },
        _spawnSet(S) {
            const D = S.data;
            D.set = []; D.next = 1; D.setT = 0;
            this._updateNextSign(S);
            const taken = [];
            for (let n = 1; n <= D.size; n++) {
                let x, y, tries = 0;
                do { x = (Math.random() - 0.5) * 12; y = 1.5 + Math.random() * 3.8; tries++; } while (tries < 30 && taken.some(([a, b]) => Math.hypot(a - x, b - y) < 1.55));
                taken.push([x, y]);
                const g = new THREE.Group();
                const col = [0xef4444, 0x3b82f6, 0x22c55e, 0xa855f7, 0xf97316, 0xec4899][n % 6];
                const bMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.18, metalness: 0.12, emissive: col, emissiveIntensity: 0.12 });
                const ball = new THREE.Mesh(new THREE.SphereGeometry(0.56, 20, 14), bMat);
                ball.scale.y = 1.18;
                const knot = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.12, 8), bMat);
                knot.rotation.x = Math.PI; knot.position.y = -0.68; knot.userData.noHit = true;
                const highlightRing = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.04, 8, 24), basic(0xfde047));
                highlightRing.visible = (n === 1); highlightRing.userData.noHit = true;
                const label = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.82), new THREE.MeshBasicMaterial({ map: AK.textTex('n' + n, String(n)), transparent: true, depthWrite: false }));
                label.position.z = 0.61; label.userData.noHit = true;
                const str = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.15, 4), basic(0xffffff));
                str.position.y = -1.25; str.userData.noHit = true;
                g.add(ball, knot, highlightRing, label, str);
                const ph = Math.random() * TAU, z = -10 - Math.random() * 2.8;
                const tg = S.addTarget({
                    mesh: g, hitMeshes: [ball], pos: V(x, y, z), life: 0, appear: 'scale', death: 'pop', deathColor: col, bonus: true, faceCamera: true,
                    motion: (t, age, out) => out.set(Math.sin(age * 0.7 + ph) * 0.6, Math.sin(age * 1.1 + ph) * 0.3, 0),
                    onTick: (t) => { highlightRing.visible = (t.num === D.next); if (highlightRing.visible) highlightRing.scale.setScalar(1 + Math.sin(S.t * 10) * 0.08); }
                });
                tg.num = n;
                D.set.push(tg);
            }
        },
        update(S, dt, lib, state) {
            const D = S.data;
            if (state !== 'running') return;
            D.setT += dt;
            if (!D.set.some((t) => t.alive)) { D.gapT -= dt; if (D.gapT <= 0) { this._spawnSet(S); D.gapT = 0.75; } }
        },
        onHit(S, ent, info) {
            if (!ent.alive || ent.num === undefined) return false;
            const D = S.data;
            S.hits++;
            if (ent.num === D.next) {
                ent.kill(info);
                S.kills++;
                S.bumpCombo();
                S.award(60 * S.comboMult, info.pt, String(ent.num), '#fde68a');
                SFX.pop();
                D.next++;
                this._updateNextSign(S);
                if (D.next > D.size) {
                    const bonus = Math.max(100, Math.round(400 + D.size * 120 - D.setT * 70));
                    S.award(bonus, info.pt.clone().add(V(0, 1, 0)), 'SET CLEAR', '#86efac');
                    SFX.fanfare();
                    D.sets++;
                    D.size = Math.min(12, D.size + 1);
                }
            } else {
                D.wrong++;
                S.t = Math.min(S.duration - 0.1, S.t + 2);
                S.breakCombo('WRONG NUMBER');
                MG.popup(info.pt, `-2s (need ${D.next})`, '#f87171', true);
                SFX.buzzer();
                MG.flashScreen('rgba(220,38,38,0.25)');
            }
            return true;
        },
        hud(S) { const D = S.data; return `<div class="ah3-panel">${AK.chip('NEXT', D.next <= D.size ? D.next : '—')}${AK.chip('SET SIZE', D.size)}${AK.chip('SETS', D.sets)}${D.wrong ? AK.chip('WRONG', D.wrong, true) : ''}</div>`; },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return { score: S.score, stars, title: stars >= 3 ? 'HUMAN CALCULATOR' : 'TIME!', stats: [['SETS CLEARED', D.sets], ['LARGEST SET', D.size - (D.next > D.size ? 0 : 1)], ['WRONG POPS', D.wrong], ['BEST STREAK', S.maxCombo]], xp: Math.round(120 + S.score * 0.04 + stars * 120) };
        }
    }));

    /* =====================================================================
       10. ECHO PANELS — Synthesizer Soundstage + Beveled Musical Pads
    ===================================================================== */
    const EP_COLS = [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x14b8a6, 0x3b82f6, 0x8b5cf6, 0xec4899, 0xf8fafc];
    const EP_NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5'];
    const EP_TONES = [262, 294, 330, 349, 392, 440, 494, 523, 587];
    MG.register(Object.assign({}, ARC, {
        id: 'echo_panels', order: 10, name: 'Echo Panels', icon: '🧠', accent: '#8b5cf6',
        tagline: 'Watch the synthesizer matrix. Remember the melody. Shoot it back!',
        desc: 'Nine beveled synthesizer pads light up one after another on the Soundstage Console, each playing its own musical note. When the melody ends, shoot the exact same pads in order! Every cleared round adds another note. Three lives, 120 seconds.',
        heroLabel: 'ARCADE HALL • MEMORY • 120 SECONDS', duration: 120, stars: [1500, 4000, 8000, 12000],
        standardWeapon: 'mk14', weaponLabel: 'LONE STAR DMR', weaponNote: 'Fires only while repeating the pattern',
        keys: [['LMB', 'Repeat the sequence'], ['R', 'Retry from results']],
        map: AK.map({ skyTop: 0x020617, skyBottom: 0x1e1b4b }),
        build(S) {
            AK.hall(S, { title: 'ECHO PANELS', accent: '#8b5cf6' });
            const chassisMat = std(0x0f172a, 0.45, 0.72), chrome = std(0x94a3b8, 0.25, 0.88);
            const frame = new THREE.Mesh(new THREE.BoxGeometry(6.9, 6.9, 0.42), chassisMat);
            frame.position.set(0, 3.4, -9.35);
            S.add(frame); S.solid(frame);
            const trim = new THREE.Mesh(new THREE.BoxGeometry(7.1, 7.1, 0.24), chrome);
            trim.position.set(0, 3.4, -9.45); S.add(trim);

            // Flanking Acoustic Speaker Towers with pulsing woofers
            const woofers = [];
            for (const sx of [-4.6, 4.6]) {
                const cab = new THREE.Mesh(new THREE.BoxGeometry(1.5, 5.4, 1.1), chassisMat);
                cab.position.set(sx, 2.7, -9.2); S.add(cab);
                for (const wy of [1.4, 2.8, 4.2]) {
                    const wf = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.08, 8, 20), basic(0x8b5cf6));
                    wf.position.set(sx, wy, -8.62); S.add(wf);
                    woofers.push(wf);
                }
            }

            const panels = [];
            for (let i = 0; i < 9; i++) {
                const padG = new THREE.Group();
                const bezel = new THREE.Mesh(new THREE.BoxGeometry(1.82, 1.82, 0.14), chrome);
                const mat = new THREE.MeshStandardMaterial({ color: EP_COLS[i], emissive: EP_COLS[i], emissiveIntensity: 0.16, roughness: 0.28, metalness: 0.15 });
                const m = new THREE.Mesh(new THREE.BoxGeometry(1.64, 1.64, 0.20), mat);
                const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.75), new THREE.MeshBasicMaterial({ map: AK.textTex('ep-n' + i, EP_NOTES[i], { size: 0.48 }), transparent: true, depthWrite: false }));
                lbl.position.z = 0.11; lbl.userData.noHit = true;
                padG.add(bezel, m, lbl);
                const tg = AK.tgt(S, padG, V(-2 + (i % 3) * 2, 5.4 - Math.floor(i / 3) * 2, -9.05), { hitMeshes: [bezel, m], appear: 'none', inT: 0.01, bonus: true });
                tg.idx = i; tg.mat = mat; tg.glow = 0;
                tg.onTick = (t, dt) => {
                    t.glow = Math.max(0, t.glow - dt * 2.5);
                    t.mat.emissiveIntensity = 0.16 + t.glow * 1.75;
                    t.pivot.position.z = t.glow * 0.14;
                };
                panels.push(tg);
            }
            Object.assign(S.data, { panels, woofers, len: 3, seq: [], input: 0, phase: 'wait', phaseT: 1.2, lives: 3, best: 0, rounds: 0 });
        },
        blockFire(S) { return S.data.phase !== 'input'; },
        _newSeq(S) {
            const D = S.data;
            D.seq = [];
            for (let i = 0; i < D.len; i++) { let k; do { k = Math.floor(Math.random() * 9); } while (D.seq.length && k === D.seq[D.seq.length - 1]); D.seq.push(k); }
            D.phase = 'show'; D.showI = 0; D.phaseT = 0.5; D.input = 0;
        },
        _flash(S, i, v = 0.15) {
            const p = S.data.panels[i]; p.glow = 1;
            for (const wf of S.data.woofers || []) { wf.material.color.setHex(EP_COLS[i]); wf.scale.setScalar(1.22); }
            SFX.tone(EP_TONES[i], EP_TONES[i], 0.32, 'triangle', v);
        },
        update(S, dt, lib, state) {
            const D = S.data;
            for (const wf of D.woofers || []) wf.scale.setScalar(1 + (wf.scale.x - 1) * Math.pow(0.05, dt));
            if (state !== 'running') return;
            D.phaseT -= dt;
            if (D.phase === 'wait' && D.phaseT <= 0) this._newSeq(S);
            else if (D.phase === 'show' && D.phaseT <= 0) {
                if (D.showI < D.seq.length) { this._flash(S, D.seq[D.showI]); D.showI++; D.phaseT = Math.max(0.32, 0.6 - D.len * 0.02); }
                else { D.phase = 'input'; MG.toast('YOUR TURN', '#c4b5fd'); }
            }
        },
        onHit(S, ent, info) {
            const D = S.data;
            if (ent.idx === undefined || D.phase !== 'input') return false;
            S.hits++;
            this._flash(S, ent.idx, 0.2);
            if (ent.idx === D.seq[D.input]) {
                D.input++;
                S.bumpCombo();
                S.award(50 * D.len, info.pt, '', '#c4b5fd');
                if (D.input >= D.seq.length) {
                    S.kills++;
                    D.rounds++;
                    D.best = Math.max(D.best, D.len);
                    S.award(200 * D.len, info.pt.clone().add(V(0, 1, 0)), 'ROUND ' + D.len, '#86efac');
                    SFX.fanfare();
                    D.len++;
                    D.phase = 'wait'; D.phaseT = 1.1;
                }
            } else {
                D.lives--;
                S.breakCombo('WRONG PANEL');
                SFX.buzzer();
                MG.flashScreen('rgba(220,38,38,0.25)');
                if (D.lives <= 0) { D.phase = 'over'; MG.finish('OUT OF LIVES', { color: '#f87171' }); }
                else { MG.toast(`WRONG • ${D.lives} LIVES • NEW SEQUENCE`, '#fca5a5'); D.phase = 'wait'; D.phaseT = 1.4; }
            }
            return false;
        },
        hud(S) { const D = S.data; return `<div class="ah3-panel">${AK.lives(D.lives, 3)}${AK.chip('LENGTH', D.len)}${AK.chip(D.phase === 'input' ? 'STEP' : 'WATCH', D.phase === 'input' ? (D.input + 1) + ' / ' + D.seq.length : '…')}</div>`; },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return { score: S.score, stars, title: D.best >= 10 ? 'PERFECT RECALL' : 'GAME OVER', stats: [['LONGEST SEQUENCE', D.best], ['ROUNDS', D.rounds], ['LIVES LEFT', Math.max(0, D.lives)], ['TIME', BO.Math.formatTime(S.t)]], noGraph: true, xp: Math.round(120 + S.score * 0.04 + stars * 120) };
        }
    }));

    /* =====================================================================
       11. SWITCHYARD — Old-West Canyon Mining Yard + Crisp Readable Signs
    ===================================================================== */
    const LANES = [-4, 0, 4];
    function cartMesh(kind) {
        const g = new THREE.Group();
        const woodM = std(kind === 'express' ? 0xf59e0b : 0x57534e, 0.55, 0.55);
        const tub = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.82, 2.05), woodM);
        tub.position.y = 0.72;
        const rim = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.12, 2.15), std(0x1f2937, 0.4, 0.7));
        rim.position.y = 1.14;
        g.add(tub, rim);
        const wheels = [];
        for (const [x, z] of [[-0.74, 0.72], [0.74, 0.72], [-0.74, -0.72], [0.74, -0.72]]) {
            const w = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.14, 10), std(0x18181b, 0.5, 0.75));
            w.rotation.z = Math.PI / 2; w.position.set(x, 0.26, z); g.add(w); wheels.push(w);
        }
        if (kind === 'tnt' || kind === 'double_tnt') {
            const sticks = kind === 'double_tnt' ? 5 : 3;
            for (let i = 0; i < sticks; i++) {
                const s = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.95, 10), std(0xb91c1c, 0.6));
                s.rotation.x = Math.PI / 2; s.position.set((i - (sticks - 1) * 0.5) * 0.28, 1.24, 0); g.add(s);
            }
            const fuse = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), basic(0xfde047)); fuse.position.set(0, 1.56, 0.5); g.add(fuse);
        } else {
            const isGem = kind === 'gem', isExp = kind === 'express';
            const pile = new THREE.Mesh(new THREE.SphereGeometry(0.78, 12, 8, 0, TAU, 0, Math.PI / 2), new THREE.MeshStandardMaterial({
                color: isGem ? 0x67e8f9 : isExp ? 0xfef08a : 0xfacc15, metalness: 0.9, roughness: 0.22,
                emissive: isGem ? 0x0891b2 : isExp ? 0xca8a04 : 0x854d0e, emissiveIntensity: isExp ? 0.8 : 0.42
            }));
            pile.position.y = 1.08; pile.scale.set(1, 0.65, 1.2); g.add(pile);
        }
        S_add_noHit(g);
        return { g, wheels };
    }
    function S_add_noHit(g) { g.traverse((o) => { o.userData.noHit = true; }); }
    function switchTex(toBank) { return AK.textTex(toBank ? 'sw-bank2' : 'sw-pit2', toBank ? '◀ TO BANK' : 'TO PIT ▶', { w: 384, h: 128, size: 0.34, bg: toBank ? '#14532d' : '#7f1d1d', color: '#fef08a' }); }
    MG.register(Object.assign({}, ARC, {
        id: 'switchyard', order: 11, name: 'Switchyard', icon: '🚂', accent: '#d97706',
        tagline: 'Gold & Express Gems to the Bank! Route TNT & Double-TNT into the Blast Pit!',
        desc: 'Mine carts thunder out of three timbered canyon tunnels! Shoot track switches cleanly to route Gold, Express Gold, and Gems LEFT to the Armored Bank Vault, while diverting TNT and Double-TNT bombs RIGHT into the glowing Lava Pit!',
        heroLabel: 'ARCADE HALL • ROUTING • 60 SECONDS', duration: 60, stars: [2400, 5200, 8800, 13000],
        standardWeapon: 'm1911', weaponLabel: 'M1911', weaponNote: 'Bottomless magazine',
        keys: [['LMB', 'Flip track switch'], ['R', 'Retry from results']],
        guide: {
            objective: 'Route Gold, Express Gold, and Gems into the GREEN BANK (Left), and divert TNT crates into the RED PIT (Right).',
            tips: [
                'Shoot any switch board once to toggle between ◀ TO BANK and TO PIT ▶—listen for the lever clack.',
                'Express Gold carts glow bright gold and move fast for 2x points!',
                '3 TNT blasts inside the Bank closes the Switchyard early.'
            ]
        },
        map: AK.map({ skyTop: 0x431407, skyBottom: 0xfdba74, fogColor: 0x9a3412, fogDensity: 0.0065, sunIntensity: 1.45 }, 'desert_sand'),
        build(S) {
            AK.hall(S, { title: 'SWITCHYARD', accent: '#d97706', ground: 0x78350f });
            const tie = std(0x5b3a1e, 0.9), steel = std(0x9ca3af, 0.3, 0.8), rockM = std(0x92400e, 0.9), woodM = std(0x451a03, 0.88);
            // Red-rock canyon walls framing the mining yard + timbered tunnel portals at z = -42!
            for (const s of [-1, 1]) {
                const cliff = new THREE.Mesh(new THREE.BoxGeometry(8, 12, 46), rockM);
                cliff.position.set(s * 17, 6, -24); S.add(cliff);
            }
            for (const x of LANES) {
                for (const sx of [-0.55, 0.55]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 35), steel); r.position.set(x + sx, 0.08, -25); S.add(r); }
                for (let z = -42; z < -8; z += 1.2) { const t = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.07, 0.28), tie); t.position.set(x, 0.03, z); S.add(t); }
                // Timbered mine tunnel arch + lantern
                const portal = new THREE.Group();
                for (const sx of [-1.25, 1.25]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.2, 1.4), woodM); p.position.set(sx, 1.6, 0); portal.add(p); }
                const beam = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.55, 1.5), woodM); beam.position.y = 3.2;
                const hole = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.9), basic(0x090d16)); hole.position.set(0, 1.45, -0.5);
                const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), basic(0xfde047)); lamp.position.set(0, 2.85, 0.78);
                portal.add(beam, hole, lamp); portal.position.set(x, 0, -42); S.add(portal);
            }
            // Crisp, cleanly-sized BANK & PIT signs (readable, never oversized!)
            const bank = A.sign('◀ GOLD BANK VAULT', 4.4, 0.95, { bg: '#14532d', color: '#fef08a', borderColor: '#22c55e', size: 0.36 });
            bank.position.set(-9.2, 3.1, -8.5); bank.rotation.y = 0.55; S.add(bank);
            const pit = A.sign('BLAST PIT (TNT) ▶', 4.4, 0.95, { bg: '#450a0a', color: '#fecaca', borderColor: '#ef4444', size: 0.36 });
            pit.position.set(9.2, 3.1, -8.5); pit.rotation.y = -0.55; S.add(pit);

            // Armored Bank Vault (left) + Glowing Lava Pit (right)
            const vault = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.4, 3.4), std(0x166534, 0.5, 0.4)); vault.position.set(-9.2, 1.2, -8.5); S.add(vault);
            const vDoor = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.25, 16), std(0xfacc15, 0.25, 0.85)); vDoor.rotation.z = Math.PI / 2; vDoor.position.set(-7.35, 1.2, -8.5); S.add(vDoor);
            const hole = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 1.8, 0.12, 20), basic(0xf97316)); hole.position.set(9.2, 0.05, -8.5); S.add(hole);
            const rim = new THREE.Mesh(new THREE.TorusGeometry(2.15, 0.22, 8, 24), std(0x27272a, 0.7, 0.4)); rim.rotation.x = Math.PI / 2; rim.position.set(9.2, 0.14, -8.5); S.add(rim);

            const switches = LANES.map((x, i) => {
                const mat = new THREE.MeshBasicMaterial({ map: switchTex(i % 2 === 0) });
                const m = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.82, 0.14), mat);
                const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.4, 8), steel); post.position.y = -1.1; post.userData.noHit = true;
                const lever = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.12), std(0xfacc15, 0.4, 0.5));
                lever.position.set(0, -0.55, 0.15); lever.rotation.z = i % 2 === 0 ? 0.55 : -0.55; lever.userData.noHit = true;
                const g = new THREE.Group(); g.add(m, post, lever);
                const tg = AK.tgt(S, g, V(x, 1.85, -7.4), { hitMeshes: [m], appear: 'none', inT: 0.01, bonus: true });
                tg.toBank = i % 2 === 0; tg.mat = mat; tg.lever = lever; tg.cd = 0; tg.lane = i;
                return tg;
            });
            Object.assign(S.data, { switches, carts: [], spawnT: 0.9, strikes: 0, banked: 0, pitted: 0, lost: 0 });
        },
        update(S, dt, lib, state) {
            const D = S.data;
            for (const sw of D.switches) sw.cd = Math.max(0, sw.cd - dt);
            if (state !== 'running') return;
            D.spawnT -= dt;
            if (D.spawnT <= 0) {
                D.spawnT = Math.max(0.85, 2.2 - S.t * 0.024);
                const r = Math.random();
                const kind = r < 0.08 ? 'gem' : r < 0.22 ? 'express' : r < 0.62 ? 'gold' : r < 0.85 ? 'tnt' : 'double_tnt';
                const lane = Math.floor(Math.random() * 3);
                const built = cartMesh(kind);
                built.g.position.set(LANES[lane], 0, -42);
                S.add(built.g);
                const baseSpd = kind === 'express' ? 7.2 : 4.2;
                D.carts.push({ mesh: built.g, wheels: built.wheels, kind, lane, z: -42, speed: baseSpd + Math.random() * 2 + S.t * 0.055, exit: null, t: 0 });
            }
            for (let i = D.carts.length - 1; i >= 0; i--) {
                const c = D.carts[i];
                for (const wh of c.wheels) wh.rotation.x += c.speed * dt * 2.2;
                if ((c.kind === 'tnt' || c.kind === 'double_tnt') && Math.random() < dt * 8) BO.FX.spawnParticles(c.mesh.position.clone().add(V(0, 1.6, 0.5)), 1, 0xfde047, 1.8, 1.2, 0.25, 0.5);
                if (!c.exit) {
                    c.z += c.speed * dt;
                    c.mesh.position.z = c.z;
                    if (c.z >= -7.6) { c.exit = D.switches[c.lane].toBank ? 'bank' : 'pit'; c.from = c.mesh.position.clone(); }
                } else {
                    c.t += dt * 1.75;
                    const to = V(c.exit === 'bank' ? -9.2 : 9.2, 0, -8.5);
                    c.mesh.position.lerpVectors(c.from, to, Math.min(1, c.t));
                    if (c.t >= 1) { this._resolve(S, c); S.scene.remove(c.mesh); D.carts.splice(i, 1); }
                }
            }
        },
        _resolve(S, c) {
            const D = S.data;
            const at = c.mesh.position.clone().add(V(0, 2, 0));
            const isBomb = c.kind === 'tnt' || c.kind === 'double_tnt';
            if (c.exit === 'bank') {
                if (isBomb) {
                    D.strikes += (c.kind === 'double_tnt' ? 2 : 1); S.penalties++;
                    BO.FX.spawnExplosion(at, 3.6, 0xf97316);
                    SFX.rumble(0.5);
                    S.award(-300, at, 'BOOM!', '#f87171');
                    S.breakCombo('TNT IN THE BANK');
                    MG.flashScreen('rgba(249,115,22,0.3)');
                    if (D.strikes >= 3) MG.finish('THE BANK BLEW UP', { color: '#f87171' });
                } else {
                    D.banked++; S.kills++; S.bumpCombo();
                    const pts = c.kind === 'gem' ? 450 : c.kind === 'express' ? 320 : 160;
                    const lbl = c.kind === 'gem' ? 'GEMS!' : c.kind === 'express' ? 'EXPRESS GOLD!' : 'GOLD';
                    S.award(pts * S.comboMult, at, lbl, '#fde68a'); SFX.ding(1.2);
                }
            } else if (isBomb) {
                D.pitted++; S.kills++; S.bumpCombo();
                S.award((c.kind === 'double_tnt' ? 140 : 80) * S.comboMult, at, 'SAFE!', '#86efac');
                BO.FX.spawnExplosion(at.add(V(0, -1.6, 0)), 1.8, 0xf97316); SFX.thunk();
            } else {
                D.lost++; S.award(-100, at, 'LOST IN THE PIT', '#f87171'); S.breakCombo('GOLD LOST'); SFX.comboBreak();
            }
        },
        onHit(S, ent) {
            if (ent.toBank === undefined) return false;
            S.hits++;
            if (ent.cd > 0) return false;
            ent.cd = 0.16;
            ent.toBank = !ent.toBank;
            ent.mat.map = switchTex(ent.toBank);
            ent.mat.needsUpdate = true;
            if (ent.lever) ent.lever.rotation.z = ent.toBank ? 0.55 : -0.55;
            SFX.clack();
            return false;
        },
        hud(S) { const D = S.data; return `<div class="ah3-panel">${AK.chip('BANKED', D.banked)}${AK.chip('TNT SAFE', D.pitted)}${AK.chip('BLASTS', D.strikes + ' / 3', D.strikes > 0)}</div>`; },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return { score: S.score, stars, title: D.strikes >= 3 ? 'YARD CLOSED' : stars >= 3 ? 'YARD MASTER' : 'SHIFT OVER', stats: [['CARTS BANKED', D.banked], ['TNT IN THE PIT', D.pitted], ['GOLD LOST', D.lost], ['BANK BLASTS', D.strikes], ['BEST STREAK', S.maxCombo]], xp: Math.round(120 + S.score * 0.04 + stars * 120) };
        },
        dispose(S) { for (const c of S.data.carts || []) S.scene.remove(c.mesh); }
    }));
})(window);
