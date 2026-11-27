/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Target Practice courses 11–13
     11. Beat Drop       — rhythm shooting; your shots are notes, hits build the song
     12. One Mag         — 30 rounds, 30 targets, 31 seconds, no reload
     13. Outlaw Pursuit  — on horseback, bandits ride up behind, beside and ahead
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const L = BO.MinigameLib;
    const A = BO.MinigameArt;
    const K = BO.MGCourseKit;
    const F = BO.MGFigures;
    const { B, SFX, std, basic, clamp01, Ease, TAU } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const lerp = (a, b, t) => a + (b - a) * t;
    const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));

    /* =====================================================================
       11. BEAT DROP — rhythm shooting
       The song is synthesised live. Drums always play; each on-time hit adds
       "groove", and groove unlocks the bass, chords, lead and sparkle layers.
    ===================================================================== */
    const BS = BO.BeatSongs;
    const LAYERS = [
        { id: 'bass', at: 15, label: 'BASS IN' },
        { id: 'chords', at: 35, label: 'CHORDS IN' },
        { id: 'lead', at: 55, label: 'LEAD IN' },
        { id: 'spark', at: 80, label: 'FULL MIX!' }
    ];
    const NEON = [0x22d3ee, 0xf472b6, 0xfacc15, 0xa3e635, 0xa78bfa];
    const bOsc = (...a) => BS.bOsc(...a);
    const bNoise = (...a) => BS.bNoise(...a);
    const songOf = (opts) => BS.get((opts && opts.song) || 'original');
    const modeOf = (opts) => (opts && BS.MODES[opts.mode]) ? opts.mode : 'medium';

    function beatTarget(color, radius) {
        const grp = new THREE.Group();
        const disc = new THREE.Mesh(
            new THREE.CylinderGeometry(radius, radius, 0.08, 40),
            new THREE.MeshStandardMaterial({ color: 0x070b18, emissive: color, emissiveIntensity: 0.72, roughness: 0.26, metalness: 0.35 })
        );
        disc.rotation.x = Math.PI / 2;
        const core = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.30, 28), basic(0xffffff));
        core.position.z = 0.052;
        core.userData.noHit = true;
        const halo = new THREE.Mesh(new THREE.RingGeometry(radius * 0.62, radius * 0.70, 36), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }));
        halo.position.z = 0.048;
        halo.userData.noHit = true;
        const rimMat = new THREE.MeshBasicMaterial({ color });
        const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.048, 8, 48), rimMat);
        rim.userData.noHit = true;
        const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.92, depthWrite: false });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.044, 8, 56), ringMat);
        ring.userData.noHit = true;
        grp.add(disc, core, halo, rim, ring);
        return { mesh: grp, hitMeshes: [disc], ring, disc, rim, baseColor: color };
    }

    MG.register({
        id: 'beat_drop', cat: 'target', order: 11,
        name: 'Beat Drop', icon: '🎵', accent: '#22d3ee',
        tagline: 'Shoot on the beat. Build the song.',
        desc: 'A neon stage and a live-synthesised track. Targets pop in time with the music, and a ring closes on each one. Fire as the ring meets the disc. Your gun plays notes instead of gunshots. Stay on time to build Groove, which brings in the bass, the chords, the lead and finally the full mix. Pick from 12 songs (difficulty 1 to 10) and four modes. One bullet breaks exactly one disc, even when discs are stacked.',
        hudSub: 'Fire when the ring meets the disc • on-time hits build the song',
        heroLabel: 'TARGET PRACTICE • RHYTHM • 12 SONGS • 4 MODES',
        duration: 61, stars: [15000, 35000, 60000, 85000], standardWeapon: 'p90', customMusic: true, forgivingMisses: true, infiniteMag: true,
        oneTargetPerShot: true, hasExample: true,
        blockFire: (S) => !!(S && S.opts && S.opts.exampleMode),
        hubOptions: [
            { key: 'song', label: 'SONG', default: 'original', choices: BS.SONGS.map((s) => ({ val: s.id, label: (s.id === 'original' ? '★ ' : s.diff + ' • ') + s.name.toUpperCase(), desc: `${s.name} — ${s.artist} • ${s.bpm} BPM • difficulty ${s.diff}/10. ${s.desc}` })) },
            { key: 'mode', label: 'MODE', default: 'medium', choices: Object.entries(BS.MODES).map(([k, m]) => ({ val: k, label: m.label, desc: m.desc })) }
        ],
        variantKey(o) { const s = songOf(o).id, m = modeOf(o); return s === 'original' && m === 'medium' ? '' : s + '/' + m; },
        variantLabel(o) { return songOf(o).name.toUpperCase() + ' • ' + BS.MODES[modeOf(o)].label; },
        starsFor(o) { return BS.stars(songOf(o), modeOf(o)); },
        map: {
            atmosphere: { skyTop: 0x05010f, skyBottom: 0x1e0b3a, fogColor: 0x0d0420, fogDensity: 0.02, sunColor: 0xc4b5fd, sunIntensity: 0.4, sunPos: [0, 40, 20], hemiSky: 0x7c3aed, hemiGround: 0x0b0216, hemiIntensity: 0.7 },
            skybox: 'skybox-space.png',
            boxes: [B(0, -0.5, -10, 80, 1, 80, 'concrete')],
            spawn: { x: 0, y: 0, z: 0, yaw: 0 }
        },
        keys: [['LMB', 'Shoot (on the beat)'], ['R', 'Retry from results']],
        build(S) {
            S.data.song = songOf(S.opts);
            S.data.mode = modeOf(S.opts);
            S.data.win = BS.MODES[S.data.mode].window;
            S.duration = S.data.song.length + 1;
            S.data.songT = 0;
            S.data.groove = 0;
            S.data.level = 0;
            S.data.judge = { PERFECT: 0, GREAT: 0, GOOD: 0, OFF: 0, MISS: 0 };
            S.data.grooveTime = [0, 0, 0, 0, 0];
            // stage floor with a glowing grid + perspective runway rails
            const grid = L.canvasTex('beat-grid', 256, 256, (g, w, h) => {
                g.fillStyle = '#06020d'; g.fillRect(0, 0, w, h);
                g.strokeStyle = '#6d28d9'; g.lineWidth = 2.5;
                g.strokeRect(0, 0, w, h);
                g.strokeStyle = 'rgba(34,211,238,0.28)'; g.lineWidth = 1;
                g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
            });
            grid.wrapS = grid.wrapT = THREE.RepeatWrapping;
            grid.repeat.set(20, 20);
            const floorMat = A.pbrMat('cyberpunk/Wet Urban Surfaces/reflective-neon-pavement-001.png', 14, 14, { emissive: 0x1e0b3a, emissiveMap: grid, emissiveIntensity: 0.45, roughness: 0.28, metalness: 0.45 });
            const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), floorMat);
            floor.rotation.x = -Math.PI / 2;
            floor.position.set(0, 0.003, -10);
            S.add(floor);
            S.solid(floor);
            const runwayStrips = [];
            for (const rx of [-2.45, 2.45]) {
                const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 13.8), new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.42 }));
                rail.position.set(rx, 0.02, -8.4);
                S.add(rail);
                runwayStrips.push(rail);
            }
            // DJ riser & mixer deck around the player
            S.box(0, 0.5, -1.0, 3.8, 1.0, 0.65, std(0x0b1120, 0.35, 0.6));
            const deckTop = new THREE.Mesh(new THREE.BoxGeometry(3.84, 0.05, 0.68), new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x22d3ee, emissiveIntensity: 0.32 }));
            deckTop.position.set(0, 1.025, -1.0);
            S.add(deckTop);
            const frontBar = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.06, 0.04), new THREE.MeshBasicMaterial({ color: 0xf472b6 }));
            frontBar.position.set(0, 0.88, -1.33);
            S.add(frontBar);
            for (const sx of [-1.05, 1.05]) {
                const platter = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 28), std(0x1e293b, 0.25, 0.75));
                platter.position.set(sx, 1.06, -1.0);
                S.add(platter);
                const spindle = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 6, 28), basic(0x22d3ee));
                spindle.rotation.x = Math.PI / 2;
                spindle.position.set(sx, 1.08, -1.0);
                S.add(spindle);
                S.animate((dt) => { platter.rotation.y += dt * 3.8; spindle.rotation.z -= dt * 2.2; });
            }
            for (let f = -2; f <= 2; f++) {
                const fader = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.22), basic(f === 0 ? 0xfacc15 : 0x67e8f9));
                fader.position.set(f * 0.16, 1.06, -1.0);
                S.add(fader);
            }
            S.collider(-2.2, 0, -1.4, -1.8, 3, 2.5);
            S.collider(1.8, 0, -1.4, 2.2, 3, 2.5);
            S.collider(-2.2, 0, 2.1, 2.2, 3, 2.5);

            // Recessed matte-obsidian target backdrop + glowing proscenium frame (high contrast for targets!)
            const wall = new THREE.Mesh(new THREE.BoxGeometry(34, 13, 0.4), std(0x06040d, 0.85, 0.15));
            wall.position.set(0, 6.4, -18.0);
            S.add(wall);
            S.solid(wall);
            const stageBackTex = L.canvasTex('beat-stage-back', 256, 128, (g, w, h) => {
                g.fillStyle = '#05020b'; g.fillRect(0, 0, w, h);
                g.strokeStyle = 'rgba(139,92,246,0.16)'; g.lineWidth = 1;
                for (let x = 0; x <= w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
                for (let y = 0; y <= h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
            });
            const playZone = new THREE.Mesh(new THREE.PlaneGeometry(17.2, 6.7), new THREE.MeshBasicMaterial({ map: stageBackTex }));
            playZone.position.set(0, 3.7, -17.65);
            S.add(playZone);
            const prosceniumRails = [];
            for (const [px, py, pw, ph, col] of [
                [0, 7.08, 17.4, 0.08, 0x22d3ee],
                [0, 0.36, 17.4, 0.08, 0xa78bfa],
                [-8.7, 3.72, 0.08, 6.8, 0x22d3ee],
                [8.7, 3.72, 0.08, 6.8, 0x22d3ee]
            ]) {
                const rail = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, 0.12), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.78 }));
                rail.position.set(px, py, -17.55);
                S.add(rail);
                prosceniumRails.push(rail);
            }
            // LED panels strictly in the upper header & outer wing flanks (never behind targets)
            const panels = [];
            for (let x = -4; x <= 4; x++) {
                for (let y = 0; y < 2; y++) {
                    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.05), new THREE.MeshBasicMaterial({ color: NEON[(x + y + 20) % NEON.length], transparent: true, opacity: 0.12 }));
                    p.position.set(x * 1.9, 8.0 + y * 1.25, -17.7);
                    S.add(p);
                    panels.push({ p, x, y });
                }
            }
            for (const side of [-1, 1]) {
                for (let y = 0; y < 4; y++) {
                    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), new THREE.MeshBasicMaterial({ color: NEON[(y + (side > 0 ? 1 : 3)) % NEON.length], transparent: true, opacity: 0.10 }));
                    p.position.set(side * 14.8, 1.8 + y * 2.1, -17.7);
                    S.add(p);
                    panels.push({ p, x: side * 7, y });
                }
            }

            // Symmetrical Left & Right Spectrum Equalizer Wings flanking the playfield
            const eq = [];
            const EQ_COLORS = [0xf472b6, 0xa78bfa, 0x818cf8, 0x38bdf8, 0x22d3ee, 0x2dd4bf, 0x4ade80, 0xa3e635, 0xfacc15, 0xfb923c, 0xf43f5e, 0xe879f9];
            const rnd = L.mulberry32(5);
            for (const side of [-1, 1]) {
                const wing = new THREE.Group();
                wing.position.set(side * 11.4, 0, -15.2);
                wing.rotation.y = side * -0.28;
                const plinth = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.34, 0.78), std(0x090d1a, 0.4, 0.65));
                plinth.position.set(0, 0.17, 0);
                wing.add(plinth);
                const plinthTrim = new THREE.Mesh(new THREE.BoxGeometry(5.22, 0.05, 0.80), basic(0x22d3ee));
                plinthTrim.position.set(0, 0.35, 0);
                wing.add(plinthTrim);
                for (let i = 0; i < 12; i++) {
                    // Mirror bass on the inside (near stage center) to treble on the outer edge
                    const bx = side * (-2.2 + i * 0.40);
                    const col = EQ_COLORS[i % EQ_COLORS.length];
                    const barMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.88 });
                    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1, 0.28), barMat);
                    bar.position.set(bx, 0.85, 0);
                    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.09, 0.30), new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.92 }));
                    cap.position.set(bx, 1.4, 0);
                    wing.add(bar, cap);
                    eq.push({ bar, cap, band: i, side, seed: rnd(), peak: 0.6 });
                }
                S.add(wing);
            }

            // Angled dual speaker towers outside the EQ wings
            for (const sx of [-15.2, 15.2]) {
                const tower = new THREE.Group();
                tower.position.set(sx, 0, -12.2);
                tower.rotation.y = sx < 0 ? 0.34 : -0.34;
                for (let j = 0; j < 3; j++) {
                    const spk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.85, 1.6), std(0x0b0f1c, 0.6, 0.3));
                    spk.position.set(0, 0.95 + j * 1.9, 0);
                    tower.add(spk);
                    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.04, 8, 28), basic(j === 1 ? 0xf472b6 : 0x22d3ee));
                    ring.position.set(0, 0.95 + j * 1.9, 0.82);
                    tower.add(ring);
                    const cone = new THREE.Mesh(new THREE.CircleGeometry(0.58, 24), std(0x1e293b, 0.45, 0.4));
                    cone.position.set(0, 0.95 + j * 1.9, 0.81);
                    tower.add(cone);
                    S.data.cones = S.data.cones || [];
                    S.data.cones.push(cone);
                }
                S.add(tower);
            }

            // Sweeping light beams framed along outer/upper flanks so they never wash out targets
            const beams = [];
            const beamXs = [-14.2, -11.0, -8.2, 8.2, 11.0, 14.2];
            for (let i = 0; i < beamXs.length; i++) {
                const cone = new THREE.Mesh(new THREE.ConeGeometry(1.35, 16, 18, 1, true), new THREE.MeshBasicMaterial({ color: NEON[i % NEON.length], transparent: true, opacity: 0.075, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
                cone.geometry.translate(0, -8, 0);
                const holder = new THREE.Group();
                holder.position.set(beamXs[i], 11.1, -14.8);
                holder.add(cone);
                S.add(holder);
                beams.push({ holder, ph: i * 1.1 });
            }
            const truss = new THREE.Mesh(new THREE.BoxGeometry(31, 0.38, 0.38), std(0x9ca3af, 0.35, 0.85));
            truss.position.set(0, 11.3, -15);
            S.add(truss);
            const title = A.sign('BEAT DROP', 6.4, 1.25, { bg: '#0b0216', color: '#f0abfc', borderColor: '#22d3ee', glow: '#f0abfc', size: 0.62 });
            title.position.set(0, 12.45, -17.65);
            S.add(title);
            if (BO.Assets && BO.Assets.applySkybox) BO.Assets.applySkybox(S.scene, 'skybox-space.png');
            if (BO.Assets && BO.Assets.placeGLB) {
                BO.Assets.placeGLBInstanced(S.scene, 'mini_arena_kit/column.glb', [
                    { pos: [-17.5, 0, -16.5], scale: 2.6 }, { pos: [17.5, 0, -16.5], scale: 2.6 },
                    { pos: [-19.5, 0, -8.5], scale: 2.4 }, { pos: [19.5, 0, -8.5], scale: 2.4 }
                ]);
                BO.Assets.placeGLBInstanced(S.scene, 'mini_arena_kit/trophy.glb', [
                    { pos: [-1.72, 1.04, -1.0], scale: 0.55 }, { pos: [1.72, 1.04, -1.0], scale: 0.55 }
                ]);
                BO.Assets.placeGLBInstanced(S.scene, 'pixel_fantasy/pixel-fantasy-canvas-market-stall.glb', [
                    { pos: [-20, 0, -3.5], rot: Math.PI / 2, scale: 1.85 },
                    { pos: [20, 0, -3.5], rot: -Math.PI / 2, scale: 1.85 }
                ]);
            }

            // Stage animation driven by the song clock
            S.animate((dt) => {
                const st = S.data.songT;
                const BEAT = S.data.song.beat;
                const ph = (st % BEAT) / BEAT;
                const pulse = Math.exp(-ph * 5);
                const lvl = S.data.level;
                const bar = Math.floor(st / (BEAT * 4));
                for (let i = 0; i < eq.length; i++) {
                    const e = eq[i];
                    const bassBoost = Math.max(0, 1 - e.band / 6) * pulse * (1.2 + lvl * 0.45);
                    const wave = Math.abs(Math.sin(st * (2.6 + e.band * 0.55 + e.seed * 3.0) + e.band * 0.65));
                    const targetH = Math.max(0.35, 0.35 + wave * (1.4 + lvl * 0.72) + bassBoost);
                    e.bar.scale.y = targetH;
                    e.bar.position.y = 0.36 + targetH * 0.5;
                    const topY = 0.36 + targetH;
                    e.peak = Math.max(topY + 0.08, e.peak - dt * 2.4);
                    e.cap.position.y = e.peak;
                    e.bar.material.opacity = 0.52 + lvl * 0.11 + pulse * 0.12;
                }
                for (const pp of panels) {
                    const wave = Math.sin(st * 3 + pp.x * 0.6 + pp.y * 0.9 + bar);
                    pp.p.material.opacity = 0.08 + Math.max(0, wave) * 0.12 * (1 + lvl) * 0.5 + pulse * 0.09 * lvl;
                }
                for (const r of prosceniumRails) {
                    r.material.opacity = 0.45 + lvl * 0.10 + pulse * 0.25;
                }
                for (const rs of runwayStrips) {
                    rs.material.opacity = 0.25 + pulse * 0.35 + lvl * 0.06;
                }
                for (const b of beams) {
                    b.holder.rotation.z = Math.sin(st * 0.9 + b.ph) * 0.55;
                    b.holder.rotation.x = Math.cos(st * 0.7 + b.ph) * 0.28 + 0.22;
                    b.holder.children[0].material.opacity = 0.035 + lvl * 0.02 + pulse * 0.035;
                }
                if (S.data.cones) for (const c of S.data.cones) c.scale.setScalar(1 + pulse * 0.14);
                deckTop.material.emissiveIntensity = 0.22 + pulse * 0.58;
            });
        },
        schedule(S) {
            const notes = BS.chart(S.data.song, S.data.mode);
            S.data.noteCount = notes.length;
            for (let i = 0; i < notes.length; i++) {
                const n = notes[i];
                n.c = NEON[n.ci % NEON.length];
                n.z = -14;
                const spawnT = i === 0 ? Math.max(0, n.t - n.approach) : Math.max(notes[i - 1].t + 0.01, n.t - n.approach);
                const approach = Math.max(0.06, n.t - spawnT);
                const grace = i < notes.length - 1 ? Math.min(0.22, Math.max(0.04, (notes[i + 1].t - n.t) * 0.45)) : 0.24;
                const inT = Math.min(0.09, approach * 0.35);
                S.at(spawnT, (S2) => {
                    // Enforce strictly one active target at a time across all difficulties.
                    for (let j = S2.targets.length - 1; j >= 0; j--) {
                        const old = S2.targets[j];
                        if (old.alive) {
                            S2.data.judge.MISS++;
                            S2.data.groove = Math.max(0, S2.data.groove - 12);
                            S2.breakCombo('TOO SLOW');
                        }
                        old.alive = false;
                        old.removed = true;
                        if (old.root && old.root.parent) old.root.parent.remove(old.root);
                        S2.targets.splice(j, 1);
                    }
                    const radius = n.radius;
                    const bt = beatTarget(n.c, radius);
                    const tg = S2.addTarget({
                        mesh: bt.mesh, hitMeshes: bt.hitMeshes, pos: V(n.x, n.y, n.z), yaw: 0,
                        points: 100, appear: 'scale', vanish: 'scale', inT, life: Math.max(0.04, approach - inT + grace), outT: 0.05,
                        death: 'pop', deathColor: n.c,
                        motion: n.drift ? (t, age, out) => out.set(Math.sin(age * 2.2) * n.drift * 0.5, 0, 0) : null,
                        onTick: (t) => {
                            const left = t.hitT - S2.data.songT;
                            const k = clamp01(left / approach);
                            const inSweet = Math.abs(left) <= 0.07 * (S2.data.win || 1);
                            bt.ring.scale.setScalar(1 + k * 2.4);
                            bt.ring.material.opacity = inSweet ? 1.0 : 0.35 + (1 - k) * 0.6;
                            bt.ring.material.color.setHex(inSweet ? 0xffffff : bt.baseColor);
                            bt.rim.material.color.setHex(inSweet ? 0xffffff : bt.baseColor);
                            bt.disc.material.emissiveIntensity = inSweet ? 1.55 : 0.48 + (1 - k) * 0.85;
                        },
                        onExpire: () => {
                            S2.data.judge.MISS++;
                            S2.data.groove = Math.max(0, S2.data.groove - 12);
                        }
                    });
                    tg.hitT = n.t;
                });
            }
        },
        onGo(S) {
            S.data.bus = BS.makeBus();
            if (S.data.bus) S.data.anchor = S.data.bus.ctx.currentTime + 0.03;
            S.data.nextStep = 0;
        },
        update(S, dt, lib, state) {
            const bus = S.data.bus;
            if (state === 'running' || state === 'finish') {
                if (bus) {
                    // audio clock is the master; re-anchor after a pause
                    const audioT = bus.ctx.currentTime - S.data.anchor;
                    if (Math.abs(audioT - S.t) > 0.12) S.data.anchor = bus.ctx.currentTime - S.t;
                    S.data.songT = S.t;
                    const STEP = S.data.song.step;
                    while (S.data.nextStep * STEP < S.t + 0.12) {
                        const when = Math.max(bus.ctx.currentTime, S.data.anchor + S.data.nextStep * STEP);
                        BS.playStep(bus, S.data.song, S.data.nextStep, when);
                        S.data.nextStep++;
                    }
                } else S.data.songT = S.t;
                if (state === 'running') S.data.grooveTime[S.data.level] += dt;
                if (state === 'running' && S.opts.exampleMode) {
                    const due = [];
                    let best = null, bestT = Infinity;
                    for (const tg of S.targets) {
                        if (!tg.alive || tg.hitT === undefined) continue;
                        if (tg.hitT < bestT) { bestT = tg.hitT; best = tg; }
                        if (S.data.songT >= tg.hitT - 0.008) due.push(tg);
                    }
                    due.sort((a, b) => a.hitT - b.hitT);
                    const cam = BO.App.worldCamera;
                    const aimAt = due[0] || best;
                    if (aimAt && cam) {
                        const dx = aimAt.root.position.x - cam.position.x;
                        const dy = aimAt.root.position.y - cam.position.y;
                        const dz = aimAt.root.position.z - cam.position.z;
                        const dist = Math.max(0.1, Math.hypot(dx, dz));
                        const wy = Math.atan2(-dx, -dz);
                        const wp = BO.Math.clamp(Math.atan2(dy, dist), -1.2, 1.2);
                        const timeLeft = aimAt.hitT - S.data.songT;
                        const trackSpd = timeLeft < 0.05 ? 1 : Math.min(1, dt * (timeLeft < 0.16 ? 28 : 14));
                        BO.Player.yaw += BO.Math.angleDiff(BO.Player.yaw, wy) * trackSpd;
                        BO.Player.pitch = BO.Math.lerp(BO.Player.pitch, wp, trackSpd);
                    }
                    for (const tg of due) {
                        if (!tg.alive) continue;
                        if (cam) {
                            const dx = tg.root.position.x - cam.position.x;
                            const dy = tg.root.position.y - cam.position.y;
                            const dz = tg.root.position.z - cam.position.z;
                            const dist = Math.max(0.1, Math.hypot(dx, dz));
                            BO.Player.yaw = Math.atan2(-dx, -dz);
                            BO.Player.pitch = BO.Math.clamp(Math.atan2(dy, dist), -1.2, 1.2);
                            const fwd = V(Math.cos(BO.Player.pitch) * -Math.sin(BO.Player.yaw), Math.sin(BO.Player.pitch), Math.cos(BO.Player.pitch) * -Math.cos(BO.Player.yaw));
                            const right = V().crossVectors(fwd, V(0, 1, 0)).normalize();
                            const muzzle = cam.position.clone().addScaledVector(fwd, 0.55).addScaledVector(right, 0.22).add(V(0, -0.16, 0));
                            BO.FX.spawnTracer(muzzle, tg.root.position.clone(), 0x22d3ee, 0.045, 0.12);
                            BO.FX.spawnParticles(muzzle, 4, 0xfef08a, 2.2, 0, 0.12, 0.55);
                            BO.Player.cameraShake = Math.max(BO.Player.cameraShake || 0, 0.006);
                        }
                        S.shots++;
                        S.shotHits++;
                        this.gunSound(S);
                        this.onHit(S, tg, { pt: tg.root.position.clone() });
                    }
                }
            }
            // groove decays slowly; layers follow it
            if (state === 'running') S.data.groove = Math.max(0, S.data.groove - dt * 1.5);
            let level = 0;
            for (let i = 0; i < LAYERS.length; i++) if (S.data.groove >= LAYERS[i].at) level = i + 1;
            if (level !== S.data.level) {
                if (level > S.data.level) { MG.toast(LAYERS[level - 1].label, '#67e8f9'); }
                else MG.toast('LOSING THE GROOVE', '#f472b6');
                S.data.level = level;
                if (bus) {
                    const t = bus.ctx.currentTime;
                    LAYERS.forEach((ly, i) => bus.layers[ly.id].gain.setTargetAtTime(i < level ? 1 : 0, t, 0.25));
                }
            }
        },
        gunSound(S) {
            const bus = S && S.data.bus;
            if (!bus) { SFX.tone(880, 880, 0.12, 'triangle', 0.1); return true; }
            const song = S.data.song, BEAT = song.beat;
            const totalEighth = Math.max(0, Math.round(S.data.songT / (BEAT * 0.5)));
            const bar = Math.floor(totalEighth / 8);
            const ch = song.chordsF[((bar % song.chordsF.length) + song.chordsF.length) % song.chordsF.length];
            const hookIdx = song.hook[((bar % 4) * 8 + (totalEighth % 8)) % 32];
            const chordFreq = ch.tones[Math.floor(totalEighth / 2) % ch.tones.length] * 2;
            const f = hookIdx >= 0 ? song.scaleF[hookIdx] : chordFreq;
            const t = bus.ctx.currentTime;
            if (song.rock) {
                bOsc(bus, 'fx', t, f * 0.5, f * 0.5, 0.24, 'sawtooth', 0.085, 2800);
                bOsc(bus, 'fx', t, f * 0.75, f * 0.75, 0.22, 'sawtooth', 0.065, 2800);
                bOsc(bus, 'fx', t, f, f, 0.26, 'triangle', 0.11);
                bNoise(bus, 'fx', t, 0.04, 4800, 'bandpass', 0.11);
            } else {
                bOsc(bus, 'fx', t, f, f, 0.30, 'triangle', 0.13);
                bOsc(bus, 'fx', t, f * 2, f * 2, 0.18, 'sine', 0.055);
                bNoise(bus, 'fx', t, 0.03, 7000, 'highpass', 0.08);
            }
            return true;
        },
        onShot(S) {
            // a shot that hits nothing costs a little groove (resolved after the ray test)
            S.data.lastShotHits = S.hits;
            setTimeout(() => { if (MG.session === S && S.hits === S.data.lastShotHits) S.data.groove = Math.max(0, S.data.groove - 3); }, 0);
        },
        onHit(S, ent, info) {
            if (!ent.mgTarget || !ent.alive) return false;
            // Stacked discs: the bullet breaks only the one that is due first (core already
            // guarantees one target per round, so the rest of the stack stays up).
            if (ent.hitT !== undefined) {
                for (const o of S.targets) {
                    if (o === ent || !o.alive || o.hitT === undefined || o.hitT >= ent.hitT) continue;
                    if (Math.abs(o.root.position.x - ent.root.position.x) < 1.3 && Math.abs(o.root.position.y - ent.root.position.y) < 1.3) ent = o;
                }
            }
            const d = S.data.songT - ent.hitT;
            const ad = Math.abs(d);
            const W = S.data.win || 1;
            let j, base, gr, col;
            if (ad <= 0.07 * W) { j = 'PERFECT'; base = 300; gr = 9; col = '#67e8f9'; }
            else if (ad <= 0.13 * W) { j = 'GREAT'; base = 200; gr = 6; col = '#a3e635'; }
            else if (ad <= 0.22 * W) { j = 'GOOD'; base = 100; gr = 3; col = '#fde68a'; }
            else { j = 'OFF'; base = 40; gr = 0; col = '#f9a8d4'; }
            S.data.judge[j]++;
            S.data.lastJudge = j === 'OFF' ? (d < 0 ? 'EARLY' : 'LATE') : j;
            S.data.lastJudgeT = performance.now();
            S.data.groove = Math.min(100, S.data.groove + gr);
            S.hits++;
            S.kills++;
            if (j !== 'OFF') S.bumpCombo(); else S.breakCombo(d < 0 ? 'EARLY' : 'LATE');
            const mult = S.comboMult;
            const pts = S.opts.exampleMode ? 0 : base * mult;
            S.award(pts, info.pt, (j === 'OFF' ? S.data.lastJudge : j) + (S.opts.exampleMode ? ' (DEMO)' : (mult > 1 ? ' x' + mult.toFixed(1).replace('.0', '') : '')), col);
            if (j === 'PERFECT' && S.data.bus) {
                const t = S.data.bus.ctx.currentTime;
                bOsc(S.data.bus, 'fx', t + 0.02, 1760, 1760, 0.25, 'sine', 0.05);
                bOsc(S.data.bus, 'fx', t + 0.07, 2637, 2637, 0.2, 'sine', 0.03);
            }
            const shockCol = j === 'PERFECT' ? 0x67e8f9 : j === 'GREAT' ? 0xa3e635 : j === 'GOOD' ? 0xfacc15 : 0xf472b6;
            const shockMat = new THREE.MeshBasicMaterial({ color: shockCol, transparent: true, opacity: 0.9, depthWrite: false });
            const shock = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.045, 6, 36), shockMat);
            shock.position.copy(ent.root.position);
            S.add(shock);
            let stAge = 0;
            S.animate((dt) => {
                stAge += dt;
                const p = clamp01(stAge / 0.26);
                shock.scale.setScalar(1 + p * 1.85);
                shockMat.opacity = (1 - p) * 0.85;
                if (p >= 1) { shock.parent?.remove(shock); shock.geometry.dispose(); shockMat.dispose(); return false; }
            });
            BO.FX.spawnParticles(ent.root.position, j === 'PERFECT' ? 12 : 6, shockCol, 4.5, 0, 0.28, 0.7);
            ent.kill(info);
            return true;
        },
        hud(S) {
            const g = S.data.groove;
            const song = S.data.song;
            const bar = Math.floor(S.data.songT / (song.beat * 4));
            const sec = BS.section(song, bar).toUpperCase();
            const fresh = performance.now() - (S.data.lastJudgeT || 0) < 450;
            const demoBadge = S.opts.exampleMode ? '<div class="mgx-chip mgx-hot">🎬 EXAMPLE PLAYBACK • 0 PTS (PRACTICE) • [ESC] PAUSE / TAKE CONTROL</div>' : '';
            return `${demoBadge}<div class="mgx-groove">
                <div class="mgx-groove-head"><small>${song.name.toUpperCase()} • ${song.bpm} BPM</small><span>${sec} • ${g.toFixed(0)}%</span></div>
                <div class="mgx-groove-bar"><i style="width:${g.toFixed(0)}%"></i>${LAYERS.map((ly) => `<em style="left:${ly.at}%"></em>`).join('')}</div>
                <div class="mgx-layers"><span class="on">DRUMS</span>${LAYERS.map((ly, i) => `<span class="${i < S.data.level ? 'on' : ''}">${ly.id.toUpperCase()}</span>`).join('')}</div></div>
                ${fresh ? `<div class="mgx-judge mgx-j-${S.data.lastJudge}">${S.data.lastJudge}</div>` : ''}`;
        },
        dispose(S) {
            const bus = S.data.bus;
            if (bus) {
                try { bus.out.gain.setTargetAtTime(0, bus.ctx.currentTime, 0.08); setTimeout(() => { try { bus.out.disconnect(); } catch (e) { /* gone */ } }, 600); } catch (e) { /* ignore */ }
            }
        },
        result(S) {
            const j = S.data.judge;
            const total = S.data.noteCount || 1;
            const fullMix = S.data.grooveTime[4];
            if (S.opts.exampleMode) {
                return {
                    score: 0, stars: 0,
                    title: '100% PERFECT POV EXAMPLE (0 POINTS AWARDED)',
                    stats: [
                        ['PERFECT', j.PERFECT], ['GREAT', j.GREAT], ['GOOD', j.GOOD],
                        ['MISSED', j.MISS + ' / ' + total], ['FULL MIX TIME', fullMix.toFixed(1) + 's'],
                        ['NOTE', 'Play yourself to earn points & stars!']
                    ],
                    accuracy: S.shots ? S.shotHits / S.shots : 0,
                    xp: 0
                };
            }
            const stars = BS.stars(S.data.song, S.data.mode).filter((th) => S.score >= th).length;
            return {
                score: S.score, stars,
                title: stars >= 4 ? 'PLATINUM RECORD' : stars === 3 ? 'GOLD RECORD' : stars === 2 ? 'SILVER' : stars === 1 ? 'BRONZE' : 'KEEP PRACTISING',
                stats: [
                    ['PERFECT', j.PERFECT], ['GREAT', j.GREAT], ['GOOD', j.GOOD],
                    ['MISSED', j.MISS + ' / ' + total], ['BEST STREAK', S.maxCombo], ['FULL MIX TIME', fullMix.toFixed(1) + 's'],
                    ['SONG', S.data.song.name.toUpperCase()], ['MODE', BS.MODES[S.data.mode].label]
                ],
                accuracy: S.shots ? S.shotHits / S.shots : 0,
                xp: Math.round(120 + S.score * 0.02 + stars * 150)
            };
        }
    });

    /* =====================================================================
       12. ONE MAG — 30 rounds, 30 targets, 31 seconds
    ===================================================================== */
    const ONE_MAG_ROUNDS = 30;
    MG.register({
        id: 'one_mag', cat: 'target', order: 12,
        name: 'One Mag', icon: '🔂', accent: '#94a3b8',
        tagline: '30 rounds. 30 targets. 31 seconds. No reload.',
        desc: 'The purist trial. You get one magazine of 30 rounds (the Lone Star DMR, or your own class weapon loaded with exactly 30), and it can only fire once every half second. Thirty steel plates appear, one after another, over 31 seconds. Every miss is a target you can no longer clear. They get smaller, further away and start to move. Hard.',
        hudSub: 'One magazine • one shot per 0.5s • every round counts',
        heroLabel: 'TARGET PRACTICE • CHALLENGE • 31 SECONDS',
        duration: 31, stars: [18, 24, 28, 30], starLabel: (th) => th + ' / 30',
        standardWeapon: 'mk14',
        fireInterval: 0.5, noReload: true, ringScoring: true, customMusic: true,
        formatBest: (b) => (b.extra && b.extra.hits !== undefined ? b.extra.hits + '/30 • ' : '') + Number(b.score).toLocaleString(),
        map: {
            atmosphere: { skyTop: 0x1e293b, skyBottom: 0xfb923c, fogColor: 0x9a6b4b, fogDensity: 0.008, sunColor: 0xffb070, sunIntensity: 1.5, sunPos: [-50, 14, -60], hemiSky: 0xfed7aa, hemiGround: 0x3b2f2a, hemiIntensity: 0.7 },
            skybox: 'skybox-morning.png',
            boxes: [B(0, -0.5, -25, 140, 1, 140, 'desert_sand')],
            spawn: { x: 0, y: 0, z: 0, yaw: 0 }
        },
        keys: [['LMB', 'Fire (0.5s between shots)'], ['R', 'Retry from results']],
        build(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.start('range');
            K.booth(S, { wood: 0x3f3f46, trim: 0x18181b, awning: '#475569' });
            const sign = A.sign('ONE MAG • NO RELOAD', 3.2, 0.5, { bg: '#0f172a', color: '#e2e8f0', borderColor: '#94a3b8', size: 0.5 });
            sign.position.set(0, 2.45, -1.42);
            S.add(sign);
            // Tactical 30-round magazine prop on counter + steel range gantry arch at z=-12
            const magBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.14), std(0x1f2937, 0.4, 0.8));
            magBody.position.set(-1.1, 1.18, -0.76); magBody.rotation.set(0.15, 0.3, Math.PI / 2); S.add(magBody);
            L.placeGLB(S.scene, 'staged_assets/3d_models/blaster_kit/clip-large.glb', { pos: [-1.1, 1.1, -0.76], rot: [0.15, 0.3, Math.PI / 2], scale: 0.7, hideFallback: magBody });
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/blaster_kit/crate-wide.glb', [
                { pos: [-11, 0, -14], rot: 0.1, scale: 1.8 }, { pos: [9, 0, -18], rot: -0.2, scale: 1.8 },
                { pos: [-13, 0, -34], rot: 0.15, scale: 2.0 }, { pos: [12, 0, -32], rot: -0.1, scale: 2.0 }
            ]);
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/blaster_kit/target-small.glb', [
                { pos: [-14, 0, -10], scale: 1.6 }, { pos: [14, 0, -20], scale: 1.6 }
            ]);
            if (BO.Assets && BO.Assets.applySkybox) BO.Assets.applySkybox(S.scene, 'skybox-morning.png');
            if (BO.Assets && BO.Assets.placeGLB) {
                BO.Assets.placeGLB(S.scene, 'mini_arena_kit/weapon-rack.glb', { pos: [-2.8, 0, -0.5], rot: 0.35, scale: 1.55 });
                BO.Assets.placeGLB(S.scene, 'weapons/barrett-m82_optimized.glb', { pos: [1.15, 1.15, -0.74], rot: [0, -0.3, 0], fitSize: [1.05, 0.3, 0.22] });
                BO.Assets.placeGLB(S.scene, 'pixel_fantasy/pixel-fantasy-canvas-market-stall.glb', { pos: [-17, 0, -6], rot: 0.6, scale: 1.85 });
                BO.Assets.placeGLB(S.scene, 'city_industrial_kit/building-e.glb', { pos: [24, 0, -24], rot: -Math.PI / 2, scale: 4.0 });
                BO.Assets.placeGLB(S.scene, 'city_industrial_kit/shipping-container-c.glb', { pos: [-22, 0, -26], rot: 0.35, scale: 2.2 });
            }
            const gM = std(0x334155, 0.5, 0.7);
            for (const gx of [-8.5, 8.5]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.26, 5.8, 0.26), gM); p.position.set(gx, 2.9, -12); S.add(p); }
            const gTop = new THREE.Mesh(new THREE.BoxGeometry(17.6, 0.32, 0.32), gM); gTop.position.set(0, 5.7, -12); S.add(gTop);
            const gSign = A.sign('ONE MAG • 30 ROUNDS • NO RELOAD', 7.2, 1.0, { bg: '#0f172a', color: '#f8fafc', borderColor: '#f59e0b', size: 0.52 });
            gSign.position.set(0, 5.85, -11.82); S.add(gSign);
            const bPts = [];
            for (let i = 0; i <= 18; i++) bPts.push(V(-8.1 + i * 0.9, 5.45, -11.85));
            const bulbs = A.bulbs(bPts, [0xfef08a, 0xf8fafc, 0xf59e0b], 0.08);
            S.add(bulbs); A.animateBulbs(S, bulbs, 6, 'chase');
            if (BO.Settings.getQualityPreset().pointLights) {
                const pl = new THREE.PointLight(0xffcf87, 1.5, 24, 1.5); pl.position.set(0, 3.2, -1.6); S.add(pl);
            }
            // berms and barricades at staggered distances
            for (const [x, z, w] of [[-9, -14, 4], [7, -18, 5], [-3, -26, 6], [11, -32, 4], [-12, -36, 5], [2, -42, 8]]) {
                const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.9, 0.9), std(0x7c6248, 1));
                b.position.set(x, 0.45, z);
                S.add(b);
                S.solid(b);
            }
            const berm = new THREE.Mesh(new THREE.BoxGeometry(70, 7, 4), std(0x8b6b45, 1));
            berm.position.set(0, 3.5, -52);
            S.add(berm);
            S.solid(berm);
            for (const [d, x] of [[10, -14], [20, 14], [30, -16], [40, 16]]) K.distanceSign(S, d + 'M', x, -d);
            for (let i = 0; i < 14; i++) {
                const r = A.rock(1 + (i % 3) * 0.6, 0x78716c);
                r.position.set((i % 2 ? 1 : -1) * (20 + (i * 7) % 15), 0.3, -8 - i * 3.3);
                S.add(r);
            }
            // round counter pips
            S.data.hitsByShot = [];
        },
        dispose() { if (BO.MinigameAudio) BO.MinigameAudio.stop(); },
        start(S) {
            const w = BO.Player.activeWeapon;
            if (w) { w.mag = ONE_MAG_ROUNDS; w.reserve = 0; }
        },
        onGo(S) { this.start(S); },
        schedule(S) {
            const rng = S.rng;
            const N = 30;
            for (let i = 0; i < N; i++) {
                const k = i / (N - 1);
                const at = 0.55 + i * 0.975 + (rng() - 0.5) * 0.25;
                const dist = lerp(10, 40, Math.min(1, k * 0.8 + rng() * 0.35));
                const x = (rng() - 0.5) * lerp(14, 26, k);
                const y = 0.9 + rng() * 2.2;
                const radius = lerp(0.5, 0.26, k) * (i % 5 === 4 ? 0.8 : 1);
                const life = lerp(2.6, 1.55, k);
                const mover = i >= 10 && rng() < 0.3 + k * 0.5;
                const amp = 1.4 + rng() * 2.5;
                const spd = lerp(1.0, 2.6, k) * (rng() < 0.5 ? 1 : -1);
                const ph = rng() * TAU;
                const isGold = (i % 5 === 4);
                S.at(at, (S2) => {
                    const t = A.steelPlate(radius, isGold ? 0xfde68a : 0xd4d4d8);
                    if (isGold && t.hitMeshes[0] && t.hitMeshes[0].material[1]) {
                        t.hitMeshes[0].material[1].emissive = new THREE.Color(0xa16207);
                        t.hitMeshes[0].material[1].emissiveIntensity = 0.45;
                    }
                    const pos = V(x, y, -dist);
                    S2.addTarget(Object.assign(t, {
                        pos, yaw: A.yawTo(pos, V(0, 1.6, 0)), points: 1000, life, appear: 'flip', death: 'knock', deathColor: isGold ? 0xfacc15 : 0xe5e7eb,
                        motion: mover ? K.sweep(amp, spd, ph) : null,
                        onKill: () => {
                            SFX.ding(1 + (i % 4) * 0.08);
                            if (BO.MinigameAudio) BO.MinigameAudio.steelPing(isGold ? 1.4 : 1.0 + (i % 4) * 0.06);
                            if (BO.Assets && BO.Assets.playClip) {
                                BO.Assets.playClip('overhaul/combat/mw2_ping.mp3', { volume: isGold ? 0.45 : 0.34, rateJitter: 0.05 });
                                BO.Assets.playClip('overhaul/combat/MW2Hitmarker.mp3', { volume: 0.28, rateJitter: 0.05 });
                            }
                        }
                    }));
                });
            }
        },
        update(S, dt, lib, state) {
            if (BO.MinigameAudio) BO.MinigameAudio.tick(dt);
            if (state !== 'running') return;
            const w = BO.Player.activeWeapon;
            const all = S.spawned >= 30 && !S.targets.some((t) => t.alive);
            if (all) MG.finish('ALL TARGETS', { color: '#e2e8f0' });
            else if (w && w.mag <= 0 && !MG.pendingShot) MG.finish('OUT OF AMMO', { color: '#fca5a5' });
        },
        hud(S) {
            const w = BO.Player.activeWeapon;
            const left = w ? Math.max(0, w.mag) : 0;
            let pips = '';
            for (let i = 0; i < ONE_MAG_ROUNDS; i++) pips += `<i class="${i < left ? 'live' : ''}"></i>`;
            return `<div class="mgx-mag"><small>ONE MAG • ${left} ROUNDS</small><div class="mgx-pips">${pips}</div><b>${S.kills} / 30 PLATES</b></div>`;
        },
        result(S) {
            const w = BO.Player.activeWeapon;
            const left = w ? Math.max(0, w.mag) : 0;
            const hits = S.kills;
            const stars = this.stars.filter((th) => hits >= th).length;
            const score = hits * 1000 + S.bullseyes * 250 + (hits === 30 ? 5000 : 0);
            return {
                score, stars, saveExtra: { hits },
                title: hits === 30 ? 'FLAWLESS MAGAZINE' : stars >= 3 ? 'GOLD' : stars === 2 ? 'SILVER' : stars === 1 ? 'BRONZE' : 'TRY AGAIN',
                stats: [
                    ['PLATES HIT', hits + ' / 30'], ['ROUNDS FIRED', S.shots], ['ACCURACY', S.shots ? Math.round(S.shotHits / S.shots * 100) + '%' : '—'],
                    ['BULLSEYES', S.bullseyes], ['ROUNDS LEFT', left], ['PLATES MISSED', 30 - hits]
                ],
                accuracy: S.shots ? S.shotHits / S.shots : 0,
                xp: Math.round(150 + hits * 25 + stars * 150)
            };
        }
    });

    /* =====================================================================
       13. OUTLAW PURSUIT — linear expedition across 5 frontier biomes!
    ===================================================================== */
    const TRAIL_PTS = (() => {
        const pts = [];
        const N = 34;
        for (let i = 0; i < N; i++) {
            const t = i / (N - 1);
            const z = -t * 1050;
            const x = Math.sin(t * Math.PI * 3.2) * 34 + Math.cos(t * Math.PI * 1.5) * 16;
            // Subtle elevation changes: high Mountain Pass early, dipping to River valley, flat Town & Highway
            const y = t < 0.22 ? Math.sin(t / 0.22 * Math.PI) * 5.5 : (t > 0.38 && t < 0.58 ? -Math.sin((t - 0.38) / 0.20 * Math.PI) * 1.4 : 0);
            pts.push(V(x, y, z));
        }
        return pts;
    })();

    function railFrame(R, s) {
        const u = R.closed ? (((s / R.len) % 1) + 1) % 1 : clamp01(s / R.len);
        const p = R.curve.getPointAt(u);
        const t = R.curve.getTangentAt(u);
        const side = V(t.z, 0, -t.x).normalize();   // right-hand side of travel
        return { p, t, side, yaw: Math.atan2(t.x, t.z) };
    }

    function ribbon(R, width, color, y, samples) {
        const pos = [];
        const idx = [];
        for (let i = 0; i <= samples; i++) {
            const f = railFrame(R, i / samples * R.len);
            const a = f.p.clone().addScaledVector(f.side, -width / 2);
            const b = f.p.clone().addScaledVector(f.side, width / 2);
            pos.push(a.x, y, a.z, b.x, y, b.z);
            if (i < samples) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setIndex(idx);
        g.computeVertexNormals();
        const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 1, side: THREE.DoubleSide }));
        m.receiveShadow = true;
        return m;
    }

    const BANDIT_COATS = [0x5b3a1e, 0x1c1917, 0x78350f, 0xd6d3d1, 0x44403c, 0x9a3412];
    function makeBandit(rng, mounted) {
        const pick = (a) => a[Math.floor(rng() * a.length) % a.length];
        const rider = F.human({
            skin: pick(F.SKINS), shirt: pick([0x7f1d1d, 0x44403c, 0x1e3a8a, 0x713f12, 0x3f6212]), pants: pick([0x292524, 0x3f2a14, 0x1f2937]),
            coat: rng() < 0.5 ? pick([0x3f2a14, 0x1c1917, 0x57534e]) : null, hat: 'cowboy', hatColor: pick([0x1c1917, 0x3f2a14, 0x57534e, 0x0c0a09]),
            bandana: pick([0xb91c1c, 0x111827, 0x7f1d1d, 0x1e3a8a]), gun: 'revolver', eyes: 'angry'
        });
        if (!mounted) return { rider };
        const horse = F.horse({ coat: pick(BANDIT_COATS), mane: 0x0c0a09 });
        F.mount(horse, rider);
        return { rider, horse };
    }

    function banditFire(S, tg) {
        const P = BO.Player;
        const cam = BO.App && BO.App.worldCamera;
        const gun = tg.fig.rider.parts.gun;
        const from = new THREE.Vector3();
        if (gun) gun.getWorldPosition(from); else tg.root.getWorldPosition(from);
        const to = cam ? cam.position.clone().add(V((Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 1.2)) : P.pos.clone();
        BO.FX.spawnTracer(from, to, 0xff7a3d, 0.03, 0.09);
        BO.FX.spawnParticles(from, 6, 0xfbbf24, 3, 2, 0.15, 0.6);
        SFX.noise(0.14, 1400, 'bandpass', 0.8, 0.42);
        SFX.tone(160, 70, 0.14, 'triangle', 0.18);
        S.data.hitsTaken = (S.data.hitsTaken || 0) + 1;
        const fwd = new THREE.Vector3();
        if (cam) { cam.getWorldDirection(fwd); S.award(-200, cam.position.clone().addScaledVector(fwd, 4), "YOU'RE HIT", '#f87171'); }
        S.breakCombo('SHOT BY A BANDIT');
        MG.flashScreen('rgba(220,38,38,0.32)');
        P.cameraShake = Math.max(P.cameraShake, 0.05);
    }

    MG.register({
        id: 'outlaw_pursuit', cat: 'target', order: 13,
        name: 'Outlaw Pursuit', icon: '🐎', accent: '#d97706',
        tagline: 'Linear chase across mountains, forests, rivers & streets.',
        desc: 'Gallop straight across the frontier through five vivid regions: high Mountain Pass cliffs, deep Pine Forest, a gleaming River Bank, Frontier Town streets, and busy Wagon & Motorcar Traffic. Outlaws close in from every angle!',
        hudSub: '5 Biomes • Look behind & ahead for bandits!',
        duration: 60, stars: [3500, 7000, 11000, 15500], standardWeapon: 'python_magnum', rail: true, customMusic: true,
        map: {
            atmosphere: { skyTop: 0x1e3a8a, skyBottom: 0xfdba74, fogColor: 0xe7b98a, fogDensity: 0.0042, sunColor: 0xffc58a, sunIntensity: 1.8, sunPos: [-80, 30, -40], hemiSky: 0xfed7aa, hemiGround: 0x7c4a1e, hemiIntensity: 0.85 },
            skybox: 'skybox-morning.png',
            boxes: [B(0, -1.2, -525, 520, 1, 1300, 'desert_sand')],
            spawn: { x: TRAIL_PTS[0].x, y: TRAIL_PTS[0].y, z: TRAIL_PTS[0].z, yaw: 0 }
        },
        build(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.start('western');
            if (BO.Assets && BO.Assets.applySkybox) BO.Assets.applySkybox(S.scene, 'skybox-morning.png');
            const R = K.rail(TRAIL_PTS, false, 0.5);
            S.data.rail = R;
            S.data.dist = 0;
            S.data.speed = 0;
            S.data.hitsTaken = 0;
            S.add(ribbon(R, 8, 0xb98a5a, 0.04, 480));
            S.add(ribbon(R, 3.6, 0xa47548, 0.06, 480));
            // your horse
            const mine = F.horse({ coat: 0xe7e5e4, mane: 0x44403c, saddle: 0x7c2d12 });
            mine.root.traverse((m) => { if (m.isMesh) m.castShadow = false; });
            if (BO.Settings.getQualityPreset().pointLights) {
                const hGlow = new THREE.PointLight(0xffb454, 1.5, 24, 1.4);
                hGlow.position.set(0, 3.2, 0.5);
                mine.root.add(hGlow);
            }
            S.add(mine.root);
            S.data.mine = mine;
            const rnd = L.mulberry32(1849);
            const vehicles = [];
            // 1. Mountain Pass (0..22%) -> Towering cliffs, peaks & mountain boulders
            for (let i = 0; i < 36; i++) {
                const f = railFrame(R, (i / 36) * R.len * 0.22);
                const side = i % 2 ? 1 : -1;
                const h = 14 + rnd() * 20, w = 8 + rnd() * 10;
                const peak = new THREE.Mesh(new THREE.ConeGeometry(w, h, 7), std(rnd() < 0.5 ? 0x6b7280 : 0x57534e, 0.95));
                peak.position.copy(f.p).addScaledVector(f.side, side * (16 + rnd() * 14)).add(V(0, h * 0.4, 0));
                S.add(peak);
            }
            // 2. Pine Forest (20..42%) -> Dense evergreens flanking the trail
            for (let i = 0; i < 65; i++) {
                const s = R.len * (0.20 + rnd() * 0.23);
                const f = railFrame(R, s);
                const side = rnd() < 0.5 ? -1 : 1;
                const tr = A.tree(1.4 + rnd() * 1.1, rnd() < 0.5 ? 0x166534 : 0x14532d);
                tr.position.copy(f.p).addScaledVector(f.side, side * (7.5 + rnd() * 18));
                S.add(tr);
            }
            // 3. Silver River Bank (40..62%) -> Shimmering flowing river alongside the path
            const riverPts = [];
            for (let i = 0; i <= 80; i++) {
                const f = railFrame(R, R.len * (0.38 + (i / 80) * 0.26));
                riverPts.push(f.p.clone().addScaledVector(f.side, 14).add(V(0, -0.45, 0)));
            }
            const riverMesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(riverPts), 80, 5.2, 8, false), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.18, metalness: 0.35 }));
            riverMesh.scale.y = 0.08;
            S.add(riverMesh);
            // 4. Frontier Town Streets (60..82%) -> Saloons, bank, general store & street lanterns
            const townLanterns = [];
            for (let i = 0; i < 24; i++) {
                const s = R.len * (0.60 + (i / 24) * 0.22);
                const f = railFrame(R, s);
                const side = i % 2 ? 1 : -1;
                const b = new THREE.Group();
                const w = 5.5, h = 4.4 + (i % 3) * 0.8;
                const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, 6.2), std([0x8b5a2b, 0x7c4a1e, 0xa16207, 0x5b3a1e][i % 4], 0.88));
                body.position.y = h / 2;
                const facade = new THREE.Mesh(new THREE.BoxGeometry(w, 1.4, 0.3), std(0x3f2a14, 0.85));
                facade.position.set(0, h + 0.6, 3);
                const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), basic(0xfde047));
                lamp.position.set(0, 3.0, 3.8);
                b.add(body, facade, lamp);
                b.position.copy(f.p).addScaledVector(f.side, side * 11.5);
                b.rotation.y = f.yaw + (side > 0 ? -Math.PI / 2 : Math.PI / 2);
                S.add(b);
                townLanterns.push(f.p.clone().addScaledVector(f.side, side * 8.2).add(V(0, 3.1, 0)));
            }
            if (townLanterns.length) {
                const tl = A.bulbs(townLanterns, [0xfbbf24, 0xf59e0b, 0xfde68a], 0.22);
                S.add(tl); A.animateBulbs(S, tl, 4, 'chase');
            }
            // 3D Frontier Landmarks across all 5 Biomes + Stagecoach Bounty Chests!
            if (BO.Assets && BO.Assets.placeGLBInstanced) {
                const passRocks = [], campTents = [], townStalls = [], townBarrels = [];
                for (let i = 0; i < 12; i++) {
                    const f = railFrame(R, (i / 12) * R.len * 0.20);
                    const p = f.p.clone().addScaledVector(f.side, (i % 2 ? 1 : -1) * 11);
                    passRocks.push({ pos: [p.x, p.y, p.z], rot: i, scale: 3.2 });
                }
                for (let i = 0; i < 6; i++) {
                    const f = railFrame(R, R.len * (0.23 + i * 0.03));
                    const p = f.p.clone().addScaledVector(f.side, (i % 2 ? 1 : -1) * 10);
                    campTents.push({ pos: [p.x, p.y, p.z], rot: f.yaw, scale: 2.2 });
                }
                for (let i = 0; i < 8; i++) {
                    const f = railFrame(R, R.len * (0.61 + i * 0.025));
                    const sd = i % 2 ? 1 : -1;
                    const p = f.p.clone().addScaledVector(f.side, sd * 7.6);
                    townStalls.push({ pos: [p.x, p.y, p.z], rot: f.yaw + (sd > 0 ? -Math.PI / 2 : Math.PI / 2), scale: 1.7 });
                    townBarrels.push({ pos: [p.x + f.t.x * 2.2, p.y, p.z + f.t.z * 2.2], scale: 1.4 });
                }
                BO.Assets.placeGLBInstanced(S.scene, 'castle_kit/rocks-large.glb', passRocks);
                BO.Assets.placeGLBInstanced(S.scene, 'mini_forest_kit/tent.glb', campTents);
                BO.Assets.placeGLBInstanced(S.scene, 'pixel_fantasy/pixel-fantasy-canvas-market-stall.glb', townStalls);
                BO.Assets.placeGLBInstanced(S.scene, 'pixel_fantasy/pixel-fantasy-wooden-barrel.glb', townBarrels);
                const wellF = railFrame(R, R.len * 0.68);
                const wellP = wellF.p.clone().addScaledVector(wellF.side, -7.8);
                BO.Assets.placeGLB(S.scene, 'pixel_fantasy/pixel-fantasy-timber-wellhead.glb', { pos: [wellP.x, wellP.y, wellP.z], scale: 1.65 });
            }
            for (let ci = 0; ci < 6; ci++) {
                const cf = railFrame(R, R.len * (0.16 + ci * 0.14));
                const cp = cf.p.clone().addScaledVector(cf.side, (ci % 2 ? 1 : -1) * 6.2);
                const cg = new THREE.Group();
                const fb = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 0.85), std(0xfacc15, 0.25, 0.85));
                fb.position.y = 0.45;
                cg.add(fb);
                if (BO.Assets && BO.Assets.placeGLB) BO.Assets.placeGLB(cg, 'mini_dungeon_kit/chest.glb', { fitSize: [1.3, 1.1, 1.0], hideFallback: fb });
                const ctg = S.addTarget({
                    mesh: cg, hitMeshes: [fb], pos: cp, yaw: cf.yaw, points: 350, bonus: true, life: 0,
                    appear: 'none', inT: 0.01, death: 'burst', deathColor: 0xfacc15,
                    onKill: () => {
                        SFX.fanfare();
                        if (BO.Assets && BO.Assets.playClip) BO.Assets.playClip('rpg_sfx/handleCoins.ogg', { volume: 0.48, rateJitter: 0.05 });
                        S.award(180, ctg.root.position.clone().add(V(0, 1.2, 0)), 'STAGECOACH GOLD!', '#fde047');
                    }
                });
            }
            // 5. Busy Road & Traffic (78..100%) -> Moving wagons & vintage motorcars
            for (let i = 0; i < 14; i++) {
                const vg = new THREE.Group();
                const col = [0xef4444, 0x3b82f6, 0x16a34a, 0x78350f, 0xfacc15][i % 5];
                const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.1, 3.6), std(col, 0.45, 0.3));
                body.position.y = 0.85;
                const roof = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.65, 2.2), std(i % 2 ? 0x1f2937 : 0xf5f5f4, 0.6));
                roof.position.y = 1.7;
                vg.add(body, roof);
                for (const [wx, wz] of [[-0.95, 1.1], [0.95, 1.1], [-0.95, -1.1], [0.95, -1.1]]) {
                    const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.22, 10), std(0x111827, 0.9));
                    wh.rotation.z = Math.PI / 2;
                    wh.position.set(wx, 0.36, wz);
                    vg.add(wh);
                }
                S.add(vg);
                vehicles.push({ obj: vg, s: R.len * (0.78 + (i / 14) * 0.22), dir: i % 2 ? 1 : -1, lane: i % 2 ? 3.2 : -3.2, spd: 8 + (i % 4) * 2.5 });
            }
            S.animate((dt) => {
                for (const v of vehicles) {
                    v.s += v.dir * v.spd * dt;
                    if (v.s > R.len - 5) v.s = R.len * 0.76;
                    if (v.s < R.len * 0.76) v.s = R.len - 6;
                    const f = railFrame(R, v.s);
                    v.obj.position.copy(f.p).addScaledVector(f.side, v.lane);
                    v.obj.rotation.y = f.yaw + (v.dir < 0 ? Math.PI : 0);
                }
            });
            // sniper rocks along the whole route
            S.data.rocks = [];
            for (let i = 0; i < 14; i++) {
                const s = (i + 0.5) / 14 * R.len;
                const f = railFrame(R, s);
                const side = i % 2 ? 1 : -1;
                const p = f.p.clone().addScaledVector(f.side, side * 14);
                const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(3.0, 0), std(0x9a6a44, 1));
                rock.scale.set(1.3, 0.7, 1.1);
                rock.position.set(p.x, p.y + 1.1, p.z);
                S.add(rock);
                S.solid(rock);
                S.data.rocks.push({ s, p: V(p.x, p.y + 3.15, p.z) });
            }
            this.preUpdate(S, 0, L, 'countdown');
        },
        preUpdate(S, dt, lib, state) {
            const R = S.data.rail;
            if (!R) return;
            const run = state === 'running' || state === 'finish' || state === 'results';
            const want = state === 'running' ? 14.5 : state === 'countdown' ? 0 : 6;
            S.data.speed = lerp(S.data.speed, want, Math.min(1, dt * 1.2));
            S.data.dist += S.data.speed * dt;
            S.data.gph = (S.data.gph || 0) + dt * (2 + S.data.speed * 0.62);
            const amt = clamp01(S.data.speed / 10);
            const bob = Math.abs(Math.cos(S.data.gph)) * 0.16 * amt;
            const r = K.driveRail(S, R, S.data.dist, dt, { bank: 0.05, pitchFollow: 0, eye: 2.35 + bob });
            if (r && S.data.mine) {
                const m = S.data.mine;
                m.root.position.set(r.p.x, 0, r.p.z);
                m.root.rotation.y = Math.atan2(r.tan.x, r.tan.z);
                // sit just behind the saddle so the neck and head are in view
                m.root.position.addScaledVector(r.tan, -0.15);
                F.gallop(m, S.data.gph, amt);
            }
            if (run && amt > 0.4) {
                const step = Math.floor(S.data.gph / Math.PI);
                if (step !== S.data._hoof) {
                    S.data._hoof = step;
                    SFX.noise(0.06, 260, 'lowpass', 1, 0.3);
                    SFX.noise(0.05, 320, 'lowpass', 1, 0.22, 0.07);
                }
                BO.Player.cameraShake = Math.max(BO.Player.cameraShake, 0.004 * amt);
            }
        },
        schedule(S) {
            K.ramp(S, { from: 2.5, to: 1.05, start: 1.2, end: 54.5, jitter: 0.3 }, (at, k, rng, i) => {
                const roll = rng();
                let kind;
                if (k < 0.2) kind = roll < 0.6 ? 'chase' : 'flank';
                else if (k < 0.5) kind = roll < 0.35 ? 'chase' : roll < 0.65 ? 'flank' : roll < 0.85 ? 'front' : 'ridge';
                else kind = roll < 0.25 ? 'chase' : roll < 0.5 ? 'flank' : roll < 0.7 ? 'front' : roll < 0.85 ? 'cutoff' : 'ridge';
                const side = rng() < 0.5 ? -1 : 1;
                const lat0 = (rng() - 0.5) * 4;
                const fuse = lerp(4.2, 2.6, k) + rng() * 1.2;
                const seed = Math.floor(rng() * 1e6);
                S.at(at, (S2) => spawnRider(S2, kind, side, lat0, fuse, seed, k));
            });
        },
        dispose() { if (BO.MinigameAudio) BO.MinigameAudio.stop(); },
        update(S, dt, lib, state) {
            if (BO.MinigameAudio) BO.MinigameAudio.tick(dt, { draw: true });
        },
        hud(S) {
            return S.data.hitsTaken ? `<div class="mgx-chip mgx-bad">TIMES SHOT: ${S.data.hitsTaken}</div>` : '';
        },
        result(S) {
            const stars = this.stars.filter((th) => S.score >= th).length;
            return {
                score: S.score, stars,
                title: stars >= 4 ? 'LEGEND OF THE WEST' : stars === 3 ? 'SHERIFF' : stars === 2 ? 'DEPUTY' : stars === 1 ? 'GREENHORN' : 'RIDE AGAIN',
                stats: [
                    ['ACCURACY', S.shots ? Math.round(S.shotHits / S.shots * 100) + '%' : '—'],
                    ['OUTLAWS DOWN', S.kills + ' / ' + S.spawned], ['HEADSHOTS', S.headshots],
                    ['BEST STREAK', S.maxCombo], ['GOT AWAY', S.expired], ['TIMES SHOT', S.data.hitsTaken || 0]
                ],
                accuracy: S.shots ? S.shotHits / S.shots : 0,
                xp: Math.round(120 + S.score * 0.06 + stars * 150)
            };
        }
    });

    function spawnRider(S, kind, side, lat0, fuse, seed, k) {
        const R = S.data.rail;
        const rng = L.mulberry32(seed);
        const mounted = kind !== 'ridge';
        const fig = makeBandit(rng, mounted);
        let rock = null;
            if (!mounted) {
                rock = S.data.rocks.find((r) => {
                    const ahead = r.s - S.data.dist;
                    return ahead > 35 && ahead < 110;
                });
                if (!rock) return;
            }
        const grp = new THREE.Group();
        grp.add(mounted ? fig.horse.root : fig.rider.root);
        F.pose(fig.rider, 'aimOne');
        const st = { t: 0, leaving: 0, fuse, gph: rng() * 6 };
        const place = (tg, dt) => {
            st.t += dt;
            if (!mounted) {
                tg.root.position.copy(rock.p);
                const cam = BO.App.worldCamera.position;
                tg.root.rotation.y = Math.atan2(cam.x - rock.p.x, cam.z - rock.p.z);
                return;
            }
            const t = st.t;
            let sOff, lat;
            if (kind === 'chase') { sOff = lerp(-34, -7, Ease.outCubic(clamp01(t / 3))) + Math.sin(t * 0.8) * 2; lat = lat0 + Math.sin(t * 1.3) * 1.3; }
            else if (kind === 'flank') { const e = Ease.outCubic(clamp01(t / 3.4)); sOff = lerp(-22, 0.6, e) + Math.sin(t * 0.9) * 1.6; lat = side * lerp(8, 3.4, e); }
            else if (kind === 'front') { sOff = lerp(46, 11, Ease.outCubic(clamp01(t / 4))) + Math.sin(t * 0.7) * 2; lat = lat0 + Math.sin(t * 1.1) * 1.6; }
            else { sOff = 22 - t * 1.5; lat = side * lerp(-16, 16, clamp01(t / 4.5)); }
            if (st.leaving > 0) { st.leaving += dt; sOff -= st.leaving * st.leaving * 4; lat += Math.sign(lat || 1) * st.leaving * 5; }
            const f = railFrame(R, S.data.dist + sOff);
            tg.root.position.copy(f.p).addScaledVector(f.side, lat);
            let yaw = f.yaw;
            if (kind === 'cutoff') yaw += side * 0.9;
            tg.root.rotation.y = yaw;
            st.gph += dt * 11;
            F.gallop(fig.horse, st.gph, 1);
            // twist in the saddle to aim at the player
            const cam = BO.App.worldCamera.position;
            const want = Math.atan2(cam.x - tg.root.position.x, cam.z - tg.root.position.z);
            fig.rider.parts.chest.rotation.y = BO.Math.clamp(wrapA(want - yaw), -2.4, 2.4);
            if (Math.random() < dt * 3) BO.FX.spawnParticles(tg.root.position.clone().add(V(0, 0.2, 0)), 2, 0xd6b370, 1.5, 1, 0.5, 1.4);
        };
        const tg = S.addTarget({
            mesh: grp, hitMeshes: fig.rider.hit, pos: V(0, -50, 0), points: 160, life: 0, appear: 'none', inT: 0.01,
            death: 'none', deathColor: 0xd6b370,
            onTick: (t, dt) => {
                place(t, dt);
                st.fuse -= dt;
                if (st.fuse <= 0 && st.leaving === 0 && MG.state === 'running') {
                    banditFire(S, t);
                    st.shots = (st.shots || 0) + 1;
                    st.fuse = 3.2;
                    if (st.shots >= 2 && mounted) st.leaving = 0.001;
                    if (st.shots >= 2 && !mounted) t.retire();
                }
                if (st.leaving > 2.2) t.retire();
            },
            onKill: (t) => {
                SFX.thunk();
                SFX.tone(420, 120, 0.25, 'sawtooth', 0.06);
                if (BO.Assets && BO.Assets.playClip) BO.Assets.playClip('overhaul/combat/MW2Hitmarker.mp3', { volume: 0.34, rateJitter: 0.06 });
                // rider tumbles off, horse bolts away
                const rider = fig.rider.root;
                S.scene.attach(rider);
                let vy = 2.5, tt = 0;
                const back = V(Math.sin(t.root.rotation.y), 0, Math.cos(t.root.rotation.y));
                S.animate((dt) => {
                    tt += dt;
                    vy -= 14 * dt;
                    rider.position.y = Math.max(0, rider.position.y + vy * dt);
                    rider.position.addScaledVector(back, -dt * 3);
                    rider.rotation.x = Math.max(-Math.PI / 2, rider.rotation.x - dt * 5);
                    if (tt > 2.5) { if (rider.parent) rider.parent.remove(rider); return false; }
                });
                if (mounted) {
                    const horse = fig.horse.root;
                    S.scene.attach(horse);
                    let ht = 0, hph = st.gph;
                    const dir = back.clone().applyAxisAngle(V(0, 1, 0), (Math.random() - 0.5) * 1.2);
                    horse.rotation.y = Math.atan2(dir.x, dir.z);
                    S.animate((dt) => {
                        ht += dt;
                        horse.position.addScaledVector(dir, dt * 15);
                        hph += dt * 12;
                        F.gallop(fig.horse, hph, 1);
                        if (ht > 2.5) { if (horse.parent) horse.parent.remove(horse); return false; }
                    });
                }
            }
        });
        tg.fig = fig;
        place(tg, 0);
        tg.root.updateMatrixWorld(true);
    }
})(window);
