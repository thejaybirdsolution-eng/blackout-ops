/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Speed Runs (part 1) + shared kit
     0. BO.SpeedRunKit — Live Split-Pace / PB Delta, stage bursts, collision kit
     1. Gauntlet Sprint — Cyber-dusk killhouse, laser gates, jump rings & chains
     2. Outpost Rescue  — Military valley, Humvees, compass HUD, stims & ambushes
     4. The Splitter    — Deagle + radial containment, Bio-Core Catwalk & meteors
     6. Last 50         — Gothic GLB graveyard, collateral pierce & spectral rounds
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const L = BO.MinigameLib;
    const A = BO.MinigameArt;
    const K = BO.MGCourseKit;
    const { B, SFX, std, basic, TAU, esc } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);

    const fmtT = (sec) => {
        const m = Math.floor(sec / 60), s = sec - m * 60;
        return m + ':' + (s < 10 ? '0' : '') + s.toFixed(2);
    };

    const _srRay = new THREE.Raycaster();
    const _srDir = new THREE.Vector3();

    const SR = BO.SpeedRunKit = {
        fmtT,
        _lookupPB(def) {
            if (!def) return null;
            const save = BO.Save && BO.Save.data && BO.Save.data.minigames;
            if (!save || !save.best) return null;
            const key = MG && MG.bestKey ? MG.bestKey(def, MG.opts) : def.id;
            return save.best[key] || save.best[def.id] || null;
        },
        define(o) {
            const def = Object.assign({
                cat: 'speed', duration: 0, countdown: 3, lockWeapon: true, infiniteMag: true, forgivingMisses: true, customMusic: true,
                matchRules: { noHealthRegen: false }, noArmor: false,
                starLabel: (th) => '≤ ' + fmtT(th),
                formatBest(b) { const e = b.extra || {}; return e.done ? fmtT(e.time) : 'DNF • ' + Math.round((e.progress || 0) * 100) + '%'; },
                betterThan(res, prev) {
                    if (!prev) return true;
                    const a = res.saveExtra, b = prev.extra || {};
                    if (a.done && !b.done) return true;
                    if (!a.done) return !b.done && a.progress > (b.progress || 0);
                    return a.time < b.time;
                }
            }, o);
            const userBuild = o.build, userUpdate = o.update, userResult = o.stats, userDispose = o.dispose;
            def.build = function (S, lib) {
                if (BO.MinigameAudio) BO.MinigameAudio.start(o.music || 'tactical');
                const pb = SR._lookupPB(this);
                S.data.sr = {
                    done: false, time: 0, why: '', progress: 0,
                    splits: [], lastSplitDelta: null, lastSplitAt: -99,
                    pbTime: (pb && pb.extra && pb.extra.done && pb.extra.time > 0) ? pb.extra.time : 0,
                    pbSplits: (pb && pb.extra && Array.isArray(pb.extra.splits)) ? pb.extra.splits : [],
                    goldTime: (this.stars && this.stars[2]) || (this.stars && this.stars[0]) || 0
                };
                S.data.zs = []; S.data.zid = 1;
                if (userBuild) userBuild.call(this, S, lib);
            };
            def.update = function (S, dt, lib, state) {
                if (BO.MinigameAudio) BO.MinigameAudio.tick(dt, o.musicState ? o.musicState(S) : {});
                const sr = S.data.sr;
                if (state === 'running' && !sr.done && !sr.why) {
                    if (!BO.Player.alive) SR.fail(S, 'YOU DIED');
                    else if (o.timeLimit && S.t > o.timeLimit) SR.fail(S, 'TIME LIMIT');
                }
                if (userUpdate) userUpdate.call(this, S, dt, lib, state);
                sr.progress = Math.max(sr.progress, Math.min(1, o.progress ? o.progress(S) : 0));
            };
            def.result = function (S) {
                const sr = S.data.sr, t = sr.done ? sr.time : 0;
                const stars = sr.done ? this.stars.filter((th) => t <= th).length : 0;
                return {
                    score: sr.done ? Math.round(t * 100) : 0, stars,
                    title: sr.done ? (stars >= 4 ? 'RECORD PACE' : stars === 3 ? 'GOLD TIME' : stars === 2 ? 'SILVER TIME' : stars === 1 ? 'BRONZE TIME' : 'FINISHED') : 'DNF — ' + (sr.why || 'FAILED'),
                    scoreLabel: sr.done ? 'TIME' : 'DID NOT FINISH',
                    formatScore: (v) => (sr.done ? fmtT(v / 100) : Math.round(sr.progress * 100) + '%'),
                    stats: [['RESULT', sr.done ? 'COMPLETE' : sr.why || 'FAILED'], ['PROGRESS', Math.round(sr.progress * 100) + '%']].concat(userResult ? userResult(S) : []),
                    noGraph: true,
                    saveExtra: {
                        done: sr.done,
                        time: Math.round(t * 100) / 100,
                        progress: Math.round(sr.progress * 100) / 100,
                        splits: (sr.splits || []).map((v) => Math.round(v * 100) / 100)
                    },
                    xp: Math.round(150 + sr.progress * 250 + stars * 150)
                };
            };
            def.dispose = function (S, lib) {
                if (BO.MinigameAudio) BO.MinigameAudio.stop();
                if (userDispose) userDispose.call(this, S, lib);
                for (const z of S.data.zs || []) z.destroy();
                S.data.zs = [];
            };
            if (!def.extraTargets) def.extraTargets = (S, pool) => { for (const z of S.data.zs) if (z.alive) for (const m of z.getHitboxMeshes()) pool.push(m); };
            MG.register(def);
            return def;
        },
        done(S, label) {
            const sr = S.data.sr; if (sr.done || sr.why) return;
            sr.done = true; sr.time = S.t; sr.progress = 1; SFX.fanfare();
            if (BO.Assets && BO.Assets.playClip) BO.Assets.playClip('overhaul/stingers/level_complete.wav', { volume: 0.48, rateJitter: 0.03 });
            MG.finish(label || 'FINISHED!', { color: '#67e8f9', delay: 2.2 });
        },
        fail(S, why) {
            const sr = S.data.sr; if (sr.done || sr.why) return;
            sr.why = why; SFX.buzzer();
            MG.finish(why, { color: '#f87171', delay: 2.4 });
        },
        stageBurst(S, pos, label, splitIdx, totalStages, color = 0x22d3ee) {
            const sr = S && S.data && S.data.sr;
            if (pos) BO.FX.spawnParticles(pos, 22, color, 6.2, 4.0, 0.55, 1.25);
            SFX.ding(1.22);
            if (BO.Assets && BO.Assets.playClip) BO.Assets.playClip('overhaul/stingers/chime_positive.wav', { volume: 0.4, rateJitter: 0.05 });
            if (!sr) return 0;
            const idx = Math.max(0, splitIdx | 0);
            sr.splits[idx] = S.t;
            const targetTotal = sr.pbTime > 0 ? sr.pbTime : sr.goldTime;
            const refTime = (sr.pbSplits && sr.pbSplits[idx] > 0)
                ? sr.pbSplits[idx]
                : (targetTotal > 0 ? targetTotal * ((idx + 1) / Math.max(1, totalStages || 1)) : 0);
            let deltaStr = '';
            if (refTime > 0) {
                const delta = S.t - refTime;
                sr.lastSplitDelta = delta;
                sr.lastSplitAt = S.t;
                deltaStr = ` (${delta <= 0 ? '-' : '+'}${Math.abs(delta).toFixed(1)}s)`;
            }
            if (label) MG.toast(label + deltaStr, sr.lastSplitDelta !== null && sr.lastSplitDelta <= 0 ? '#4ade80' : '#fde68a');
            return sr.lastSplitDelta || 0;
        },
        paceChip(S) {
            const sr = S && S.data && S.data.sr;
            if (!sr) return '';
            const hasPB = sr.pbTime > 0;
            const target = hasPB ? sr.pbTime : sr.goldTime;
            const lbl = hasPB ? 'PB DELTA' : 'GOLD PACE';
            if (!target || target <= 0) return '';
            if (S.t <= 0.05) {
                return `<div class="sr-chip">${hasPB ? 'PB TARGET' : 'GOLD TARGET'}<b>${fmtT(target)}</b></div>`;
            }
            let delta;
            if (sr.lastSplitDelta !== null && (S.t - sr.lastSplitAt) < 2.8) {
                delta = sr.lastSplitDelta;
            } else {
                const p = Math.max(0.02, sr.progress || 0);
                delta = S.t - target * p;
            }
            const ahead = delta <= 0.05;
            const txt = (delta <= 0 ? '-' : '+') + Math.abs(delta).toFixed(1) + 's';
            const col = ahead ? '#4ade80' : '#fca5a5';
            const bdr = ahead ? 'border-color:rgba(74,222,128,0.55);' : '';
            return `<div class="sr-chip ${ahead ? '' : 'bad'}" style="${bdr}">${lbl}<b style="color:${col}">${txt}</b></div>`;
        },
        clampCircle(pos, maxR) {
            const r = Math.hypot(pos.x, pos.z);
            if (r > maxR && r > 1e-4) {
                const s = maxR / r;
                pos.x *= s;
                pos.z *= s;
                return true;
            }
            return false;
        },
        stepMove(pos, dir, dist, opts = {}) {
            if (!dist || dist <= 0) return pos;
            const hLen = Math.hypot(dir.x, dir.z);
            if (hLen < 1e-5) return pos;
            const nx = dir.x / hLen, nz = dir.z / hLen;
            const steps = Math.max(1, Math.ceil(dist / 0.32));
            const stepDist = dist / steps;
            const rad = opts.radius || 0.4;
            const ht = opts.height || 1.8;
            const isPlayer = opts.isPlayer !== false;
            const eye = opts.eyeY ?? 1.05;
            for (let i = 0; i < steps; i++) {
                if (opts.rayMeshes && opts.rayMeshes.length) {
                    _srDir.set(nx, 0, nz);
                    _srRay.set(V(pos.x, pos.y + eye, pos.z), _srDir);
                    _srRay.near = 0.05;
                    _srRay.far = stepDist + rad + 0.12;
                    if (_srRay.intersectObjects(opts.rayMeshes, false).length > 0) break;
                }
                pos.x += nx * stepDist;
                pos.z += nz * stepDist;
                if (BO.World && BO.World.resolveHorizontal) {
                    BO.World.resolveHorizontal(pos, rad, ht, isPlayer);
                }
                if (opts.minX !== undefined) pos.x = BO.Math.clamp(pos.x, opts.minX, opts.maxX);
                if (opts.minZ !== undefined) pos.z = BO.Math.clamp(pos.z, opts.minZ, opts.maxZ);
                if (opts.maxR !== undefined) SR.clampCircle(pos, opts.maxR);
            }
            return pos;
        },
        rayBlocked(from, to, meshes) {
            if (!meshes || !meshes.length) return null;
            _srDir.copy(to).sub(from);
            const dist = _srDir.length();
            if (dist < 0.15) return null;
            _srDir.divideScalar(dist);
            _srRay.set(from, _srDir);
            _srRay.near = 0.05;
            _srRay.far = Math.max(0.08, dist - 0.12);
            const hits = _srRay.intersectObjects(meshes, false);
            return hits.length ? hits[0] : null;
        },
        spawnZ(S, specId, x, z, o = {}) {
            const spec = BO.ZombiesData.get(specId);
            const ent = new BO.ZombieEntity({
                id: S.data.zid++, spec, round: o.round || 8, hp: o.hp || spec.hp, speed: o.speed || spec.speed,
                damage: o.damage || Math.round(spec.attack * 0.7), x, y: o.y || 0, z, splitCount: 0, hasGun: false, sizeMult: o.size
            });
            ent.srTag = o.tag; S.data.zs.push(ent); return ent;
        },
        updateZ(S, dt, cb, frozen) {
            const P = BO.Player;
            const callbacks = Object.assign({ allowProjectiles: false, onMeleePlayer: (z) => { if (P.alive) P.takeDamage(z.damage, z.pos, false, z); } }, cb || {});
            const zs = S.data.zs;
            for (let i = zs.length - 1; i >= 0; i--) {
                const z = zs[i];
                if (z.alive && (frozen || z.srHold)) z.stunTimer = Math.max(z.stunTimer, 0.05);
                const keep = z.update(dt, zs, callbacks);
                if (!keep) { z.destroy(); zs.splice(i, 1); }
            }
        },
        hitZ(S, z, info, onDeath) {
            if (z && z.alive && z.isChronoCrystal) {
                const shave = z.shaveSec || 1.5;
                S.t = Math.max(0.05, S.t - shave);
                S.hits++; S.kills++; S.bumpCombo();
                if (BO.Assets && BO.Assets.playClip) {
                    BO.Assets.playClip('overhaul/stingers/chime_positive.wav', { volume: 0.45, rateJitter: 0.06 });
                    BO.Assets.playClip('overhaul/combat/mw2_ping.mp3', { volume: 0.38, rateJitter: 0.05 });
                }
                BO.FX.spawnParticles(info.pt, 18, 0x22d3ee, 5.5, 3, 0.45, 1.1);
                MG.popup(info.pt, `-${shave.toFixed(1)}s CHRONO SHAVE!`, '#67e8f9', true);
                z.kill(info);
                return true;
            }
            if (!z || !z.alive || !z.takeDamage) return false;
            if (z.srHold) z.srHold = false;
            const killed = z.takeDamage(info.dmg, info.hitbox, info.hitbox === 'head', null, 'bullet');
            S.hits++;
            if (BO.Assets && BO.Assets.playClip) {
                BO.Assets.playClip(info.hitbox === 'head' ? 'overhaul/combat/mw2_ping.mp3' : 'overhaul/combat/MW2Hitmarker.mp3', { volume: 0.3, rateJitter: 0.06 });
            }
            if (info.hitbox === 'head') S.headshots++;
            if (killed) { S.kills++; S.bumpCombo(); if (onDeath) onDeath(z); }
            return killed;
        },
        alive: (S, tag) => S.data.zs.filter((z) => z.alive && (tag === undefined || z.srTag === tag)).length,
        chip: (label, val, bad) => `<div class="sr-chip ${bad ? 'bad' : ''}">${esc(label)}<b>${val}</b></div>`,
        panel: (html, S) => `<div class="sr-panel">${html}${SR.paceChip(S || (MG && MG.session))}</div>`,
        wall(S, x1, z1, x2, z2, h = 3, mat) {
            const w = Math.abs(x2 - x1) || 0.6, d = Math.abs(z2 - z1) || 0.6;
            return S.box((x1 + x2) / 2, h / 2, (z1 + z2) / 2, w, h, d, mat || std(0x57534e, 0.9), { solid: true });
        }
    };

    /* =====================================================================
       1. GAUNTLET SPRINT — Cyber-Dusk Killhouse, Laser Gates, Jump Rings & Chains
    ===================================================================== */
    const GAUNTLET = [
        { z: -22, foes: [['shambler', -4, 0], ['shambler', 4, -2], ['shambler', 0, -5]] },
        { z: -44, foes: [['sprinter', -6, 0], ['sprinter', 6, 0], ['shambler', 0, -3], ['hopper', 2, -6]] },
        { z: -68, foes: [['one_arm_ripper', -3, 0], ['one_arm_ripper', 3, 0], ['sprinter', -7, -5], ['sprinter', 7, -5], ['shambler', 0, -7]] },
        { z: -92, foes: [['hopper', -5, 0], ['hopper', 5, 0], ['headless_charger', 0, -4], ['sprinter', -2, -8], ['sprinter', 2, -8]] },
        { z: -116, foes: [['bloater', 0, 0], ['shambler', -6, -3], ['shambler', 6, -3], ['one_arm_ripper', -3, -7], ['one_arm_ripper', 3, -7]] },
        { z: -142, foes: [['club_goliath', 0, -4], ['sprinter', -6, 0], ['sprinter', 6, 0], ['hopper', -4, -9], ['hopper', 4, -9], ['headless_charger', 0, 2]] }
    ];
    SR.define({
        id: 'sr_gauntlet', order: 1, name: 'Gauntlet Sprint', icon: '🏃', accent: '#22d3ee',
        tagline: 'Run the cyber-dusk killhouse. Chain barrels. Drop all 28.',
        desc: 'A 150-metre cyber-dusk killhouse with retractable neon laser gates, animated chevron speed strips, aerial jump boost rings, and chain-detonating fuel barrels. Clear each zone to shatter the laser barrier ahead!',
        heroLabel: 'SPEED RUN • COURSE CLEAR', stars: [150, 110, 80, 60], timeLimit: 420,
        standardWeapon: 'm4a1', weaponLabel: 'M4A1', weaponNote: 'Bottomless magazine',
        keys: [['WASD', 'Run'], ['LMB', 'Shoot'], ['SHIFT', 'Sprint']],
        map: {
            skybox: 'skybox-night.png',
            atmosphere: { skyTop: 0x090d1f, skyBottom: 0x312e81, fogColor: 0x0f172a, fogDensity: 0.0052, sunColor: 0x38bdf8, sunIntensity: 1.25, sunPos: [26, 48, -40], hemiSky: 0x67e8f9, hemiGround: 0x1e293b, hemiIntensity: 0.92, moon: true },
            boxes: [B(0, -0.5, -75, 60, 1, 190, 'concrete')],
            spawn: { x: 0, y: 0, z: 2, yaw: 0 }
        },
        build(S) {
            if (BO.Assets && BO.Assets.applySkybox) BO.Assets.applySkybox(S.scene, 'skybox-night.png');
            const stone = A.pbrMat('cyberpunk/Commercial Neon/led-strip-wall-cladding-001.png', 24, 1.2, { roughness: 0.52, metalness: 0.35 });
            SR.wall(S, -12.5, 6, -12, -160, 4.8, stone);
            SR.wall(S, 12, 6, 12.5, -160, 4.8, stone);
            SR.wall(S, -12, -160, 12, -160.5, 4.8, stone);
            SR.wall(S, -12, 6, 12, 6.5, 4.8, stone);
            const floorGlow = new THREE.Mesh(new THREE.PlaneGeometry(24, 166), A.pbrMat('cyberpunk/Wet Urban Surfaces/rain-slick-concrete-001.png', 6, 38, { roughness: 0.32, metalness: 0.38 }));
            floorGlow.rotation.x = -Math.PI / 2; floorGlow.position.set(0, 0.02, -77); S.add(floorGlow);

            // Cyber-Industrial Skyline & Start-Bay Weapon Racks flanking the killhouse
            if (BO.Assets && BO.Assets.placeGLBInstanced) {
                const outerInd = [], outerChim = [], wallTanks = [];
                for (let i = 0; i < 10; i++) {
                    const oz = -8 - i * 16;
                    outerInd.push({ pos: [-22, 0, oz], rot: Math.PI / 2, scale: 4.4 }, { pos: [22, 0, oz], rot: -Math.PI / 2, scale: 4.4 });
                    if (i % 2 === 0) outerChim.push({ pos: [-25, 0, oz - 4], scale: 3.6 }, { pos: [25, 0, oz - 4], scale: 3.6 });
                    wallTanks.push({ pos: [i % 2 ? -10.8 : 10.8, 0, oz - 3], rot: i, scale: 1.5 });
                }
                BO.Assets.placeGLBInstanced(S.scene, 'city_industrial_kit/building-c.glb', outerInd);
                BO.Assets.placeGLBInstanced(S.scene, 'city_industrial_kit/chimney-large.glb', outerChim);
                BO.Assets.placeGLBInstanced(S.scene, 'city_industrial_kit/detail-tank-large.glb', wallTanks);
                BO.Assets.placeGLB(S.scene, 'mini_arena_kit/weapon-rack.glb', { pos: [-9.8, 0, 3.8], rot: 0.4, scale: 1.6 });
                BO.Assets.placeGLB(S.scene, 'blaster_kit/crate-wide.glb', { pos: [9.8, 0, 3.8], rot: -0.35, scale: 1.7 });
            }

            // Solid Shipping Container cover without overlapping primitive box
            for (const [x, z, w, d] of [[-5, -14, 3.2, 1.4], [5, -34, 3.2, 1.4], [0, -56, 5.2, 1.4], [-6, -80, 1.4, 4.2], [6, -80, 1.4, 4.2], [0, -104, 6.2, 1.4], [-5, -128, 2.2, 2.2], [5, -132, 2.2, 2.2]]) {
                S.box(x, 0.95, z, w, 1.9, d, L.HIDDEN_MAT, { solid: true, shadow: false });
                L.placeGLB(S.scene, 'staged_assets/3d_models/city_industrial_kit/shipping-container-b.glb', { pos: [x, 0, z], fitSize: [w, 1.9, d] });
            }

            // Shootable Overhead Zone Chrono-Crystals (-1.5s time shave each!)
            if (BO.CourseScenery && BO.CourseScenery.spawnChronoCrystal) {
                for (let ci = 0; ci < GAUNTLET.length; ci++) {
                    BO.CourseScenery.spawnChronoCrystal(S, V((ci % 2 ? 1 : -1) * 6.5, 3.8, GAUNTLET[ci].z + 8), 1.5, 1.0, 0x22d3ee);
                }
            }

            // Animated chevron speed pad texture
            const chevTex = L.canvasTex('sr-chev-pad', 128, 256, (g, w, h) => {
                g.fillStyle = '#082f49';
                g.fillRect(0, 0, w, h);
                g.strokeStyle = '#22d3ee';
                g.lineWidth = 10;
                for (let y = 24; y < h + 40; y += 52) {
                    g.beginPath();
                    g.moveTo(16, y + 24);
                    g.lineTo(w / 2, y);
                    g.lineTo(w - 16, y + 24);
                    g.stroke();
                }
                g.strokeStyle = '#fde047';
                g.lineWidth = 4;
                g.strokeRect(4, 0, w - 8, h);
            });
            chevTex.wrapS = chevTex.wrapT = THREE.RepeatWrapping;
            chevTex.repeat.set(1, 2);
            const chevMat = new THREE.MeshBasicMaterial({ map: chevTex, side: THREE.DoubleSide });

            S.data.boostPads = [];
            S.data.zoneGates = [];
            S.data.zoneCleared = [];
            const pylonM = std(0x1e293b, 0.35, 0.8);

            for (let i = 0; i < GAUNTLET.length; i++) {
                const g = GAUNTLET[i];
                const gz = g.z + 8;
                const sign = A.sign('ZONE ' + (i + 1), 2.8, 0.65, { bg: '#0c4a6e', color: '#e0f2fe', borderColor: '#22d3ee', size: 0.5 });
                sign.position.set(-11.8, 2.8, gz); sign.rotation.y = Math.PI / 2; S.add(sign);
                const arch = new THREE.Mesh(new THREE.BoxGeometry(24, 0.28, 0.35), basic(0x22d3ee)); arch.position.set(0, 4.4, gz); S.add(arch);
                S.add(A.torch(S, V(-10.8, 0, g.z), 0x22d3ee, false)); S.add(A.torch(S, V(10.8, 0, g.z), 0x22d3ee, false));

                // Retractable Neon Laser Zone Gate
                const gatePylons = [];
                for (const sx of [-11.5, 11.5]) {
                    const py = new THREE.Mesh(new THREE.BoxGeometry(0.65, 4.3, 0.65), pylonM);
                    py.position.set(sx, 2.15, gz); S.add(py);
                    gatePylons.push(py);
                }
                const bars = [];
                const barMat = new THREE.MeshBasicMaterial({ color: i === 0 ? 0x22d3ee : 0xf43f5e, transparent: true, opacity: i === 0 ? 0.0 : 0.78 });
                for (let b = 0; b < 3; b++) {
                    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 22.8, 8), barMat.clone());
                    bar.rotation.z = Math.PI / 2;
                    bar.position.set(0, 0.9 + b * 1.15, gz);
                    bar.visible = i > 0;
                    S.add(bar);
                    bars.push(bar);
                }
                S.data.zoneGates.push({ z: gz, bars, open: i === 0, anim: i === 0 ? 1 : 0 });
                S.data.zoneCleared.push(false);

                const px = (i % 2 ? 1 : -1) * 3.5;
                const pz = g.z + 10;
                const pad = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 4.6), chevMat);
                pad.rotation.x = -Math.PI / 2; pad.position.set(px, 0.04, pz); S.add(pad);
                for (const rx of [-1.65, 1.65]) {
                    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 4.6), basic(0x22d3ee));
                    rail.position.set(px + rx, 0.07, pz); S.add(rail);
                }
                S.data.boostPads.push({ x: px, z: pz, cd: 0 });
                for (const [id, x, dz] of g.foes) { const z = SR.spawnZ(S, id, x, g.z + dz, { tag: i }); z.srHold = true; }
            }

            // Elevated Jump Boost Rings + Floor Launchers
            S.data.jumpRings = [];
            for (const [jx, jz] of [[0, -49], [0, -99], [0, -130]]) {
                const lPad = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.16, 18), std(0x0e7490, 0.3, 0.6));
                lPad.position.set(jx, 0.08, jz + 4.5); S.add(lPad);
                const lGlow = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.5, 18), basic(0xfde047, { side: THREE.DoubleSide }));
                lGlow.rotation.x = -Math.PI / 2; lGlow.position.set(jx, 0.17, jz + 4.5); S.add(lGlow);
                const ring = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.22, 10, 28), basic(0x38bdf8));
                ring.position.set(jx, 3.6, jz); S.add(ring);
                const inner = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.08, 8, 24), basic(0xfde047));
                inner.position.set(jx, 3.6, jz); S.add(inner);
                S.data.jumpRings.push({ ring, inner, padPos: V(jx, 0, jz + 4.5), ringPos: V(jx, 3.6, jz), padCd: 0, ringCd: 0 });
            }

            // Paired Explosive Barrels for Chain Combos!
            const barrelSpots = [
                [0, -25], [2.4, -26.8],
                [-4, -67], [-1.5, -69],
                [4, -95], [1.6, -97.2],
                [0, -136], [2.5, -138.2]
            ];
            S.data.barrels = [];
            S.data.chainQueue = [];
            const detonateBarrel = (tg, chainCount) => {
                if (!tg || tg._detonated) return;
                tg._detonated = true;
                const pos = tg.root.position.clone().add(V(0, 0.8, 0));
                BO.FX.spawnExplosion(pos, 7.5 + chainCount * 1.2, chainCount > 1 ? 0xfacc15 : 0xf97316);
                SFX.rumble(0.5);
                if (chainCount > 1) {
                    MG.popup(pos.clone().add(V(0, 1.4, 0)), `CHAIN x${chainCount}!`, '#fde047', true);
                    SFX.combo(chainCount);
                }
                for (const z of S.data.zs) {
                    if (z.alive && z.pos.distanceTo(tg.root.position) < 10.5) {
                        z.srHold = false;
                        if (z.takeDamage(280 + chainCount * 60, 'torso', false, null, 'explosive')) { S.kills++; S.bumpCombo(); }
                    }
                }
                for (const other of S.data.barrels || []) {
                    if (other !== tg && other.alive && !other._detonated && other.root.position.distanceTo(tg.root.position) < 6.8) {
                        S.data.chainQueue.push({ tg: other, t: 0.13, chain: chainCount + 1 });
                    }
                }
            };
            S.data._detonateBarrel = detonateBarrel;
            for (const [bx, bz] of barrelSpots) {
                const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 1.15, 12), std(0xdc2626, 0.4, 0.4)); bar.position.y = 0.58;
                const band = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.22, 12), basic(0xfacc15)); band.position.y = 0.65;
                const grp = new THREE.Group(); grp.add(bar, band);
                const tg = S.addTarget({
                    mesh: grp, hitMeshes: [bar], pos: V(bx, 0, bz), life: 0, appear: 'none', inT: 0.01, death: 'pop', deathColor: 0xf97316, bonus: true,
                    onKill: (t) => detonateBarrel(t, 1)
                });
                S.data.barrels.push(tg);
            }

            // Finish Arch + Flare Cannons
            const fin = A.sign('FINISH', 5.5, 1.1, { bg: '#14532d', color: '#fde68a', borderColor: '#facc15', size: 0.6 });
            fin.position.set(0, 3.2, -159.6); S.add(fin);
            for (const fx of [-5.2, 5.2]) {
                const col = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 4.6, 10), pylonM);
                col.position.set(fx, 2.3, -159.2); S.add(col);
                const tip = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8), basic(0xfacc15));
                tip.position.set(fx, 4.7, -159.2); S.add(tip);
            }
            const gBulbs = [];
            for (let gx = -2.8; gx <= 2.8; gx += 0.7) gBulbs.push(V(gx, 2.55, -159.3), V(gx, 3.85, -159.3));
            for (const g of GAUNTLET) for (let lx = -9; lx <= 9; lx += 4.5) gBulbs.push(V(lx, 4.25, g.z + 8));
            const gb = A.bulbs(gBulbs, [0x22d3ee, 0xfacc15, 0xf8fafc], 0.11);
            S.add(gb); A.animateBulbs(S, gb, 7, 'chase');
            if (BO.Settings.getQualityPreset().pointLights) {
                const pl = new THREE.PointLight(0x22d3ee, 1.5, 28, 1.4); pl.position.set(0, 4.0, -8); S.add(pl);
            }
            S.animate((dt) => {
                chevTex.offset.y -= dt * 2.4;
                for (const jr of S.data.jumpRings || []) {
                    jr.inner.rotation.z += dt * 3.0;
                    jr.ring.scale.setScalar(1 + Math.sin(performance.now() * 0.005) * 0.06);
                }
                for (const zGate of S.data.zoneGates || []) {
                    if (zGate.open && zGate.anim < 1) {
                        zGate.anim = Math.min(1, zGate.anim + dt * 4.5);
                        for (const b of zGate.bars) {
                            b.scale.y = Math.max(0.01, 1 - zGate.anim);
                            b.material.opacity = (1 - zGate.anim) * 0.78;
                            if (zGate.anim >= 1) b.visible = false;
                        }
                    }
                }
            });
            S.data.total = S.data.zs.length; S.data._boostT = 0;
        },
        progress: (S) => 1 - SR.alive(S) / S.data.total,
        update(S, dt, lib, state) {
            const P = BO.Player, D = S.data;
            if (state === 'running') {
                // Collision-checked speed pad / jump ring boost!
                if (D._boostT > 0) {
                    D._boostT -= dt;
                    const fwd = P.getMoveDirectionVectors().forward;
                    SR.stepMove(P.pos, fwd, 5.4 * dt, { radius: P.radius, height: P.standHeight, minX: -11.4, maxX: 11.4, minZ: -159.4, maxZ: 5.4 });
                    P.vel.x = BO.Math.lerp(P.vel.x, fwd.x * 11.5, Math.min(1, dt * 6));
                    P.vel.z = BO.Math.lerp(P.vel.z, fwd.z * 11.5, Math.min(1, dt * 6));
                }
                for (const bp of D.boostPads || []) {
                    if (bp.cd > 0) bp.cd -= dt;
                    else if (Math.hypot(P.pos.x - bp.x, P.pos.z - bp.z) < 2.3) {
                        bp.cd = 3.5; D._boostT = 2.0; SFX.whoosh(0.26); MG.toast('SPEED BOOST PAD!', '#22d3ee');
                    }
                }
                for (const jr of D.jumpRings || []) {
                    if (jr.padCd > 0) jr.padCd -= dt;
                    else if (Math.hypot(P.pos.x - jr.padPos.x, P.pos.z - jr.padPos.z) < 2.0) {
                        jr.padCd = 1.6; P.vel.y = 10.2; SFX.boing();
                    }
                    if (jr.ringCd > 0) jr.ringCd -= dt;
                    else if (P.pos.clone().add(V(0, 1.0, 0)).distanceTo(jr.ringPos) < 2.8) {
                        jr.ringCd = 3.0; D._boostT = 2.3; SFX.star(1);
                        BO.FX.spawnParticles(jr.ringPos, 18, 0xfde047, 5.5, 2, 0.45, 1.1);
                        MG.toast('BOOST RING! OVERDRIVE!', '#fde047');
                    }
                }
                for (let i = D.chainQueue.length - 1; i >= 0; i--) {
                    const cq = D.chainQueue[i];
                    cq.t -= dt;
                    if (cq.t <= 0) {
                        D.chainQueue.splice(i, 1);
                        if (cq.tg && cq.tg.alive) cq.tg.kill({ pt: cq.tg.root.position.clone() });
                        D._detonateBarrel(cq.tg, cq.chain);
                    }
                }
            }

            const openGate = (idx) => {
                const zGate = D.zoneGates[idx];
                if (zGate && !zGate.open) {
                    zGate.open = true;
                    SFX.shatter();
                    BO.FX.spawnParticles(V(0, 2.2, zGate.z), 20, 0x22d3ee, 7, 5, 0.45, 1.1);
                }
            };
            for (let i = 0; i < GAUNTLET.length; i++) {
                const g = GAUNTLET[i];
                if (Math.abs(g.z - P.pos.z) < 24 || P.pos.z < g.z + 12) openGate(i);
                if (!D.zoneCleared[i] && SR.alive(S, i) === 0) {
                    D.zoneCleared[i] = true;
                    SR.stageBurst(S, V(0, 2.2, g.z), `ZONE ${i + 1} CLEAR`, i, GAUNTLET.length, 0x22d3ee);
                    if (i + 1 < GAUNTLET.length) openGate(i + 1);
                }
            }
            for (const z of D.zs) if (z.srHold && Math.abs(z.pos.z - P.pos.z) < 26) { z.srHold = false; z.stunTimer = 0.4; }
            SR.updateZ(S, dt, null, state !== 'running');
            if (state === 'running' && SR.alive(S) === 0) {
                for (const fx of [-5.2, 5.2]) BO.FX.spawnExplosion(V(fx, 4.9, -159.2), 4.5, fx < 0 ? 0x22d3ee : 0xfacc15);
                BO.FX.spawnParticles(V(0, 4.5, -159.2), 34, 0xfde047, 8, 6, 0.85, 1.4);
                SR.done(S, 'COURSE CLEAR');
            }
        },
        onHit(S, ent, info) { return SR.hitZ(S, ent, info); },
        scoreText(S) { return (S.data.total - SR.alive(S)) + ' / ' + S.data.total; },
        hud(S) {
            let next = -1; for (let i = 0; i < GAUNTLET.length; i++) if (SR.alive(S, i) > 0) { next = i; break; }
            return SR.panel(SR.chip('ENEMIES LEFT', SR.alive(S)) + (next >= 0 ? SR.chip('ZONE', (next + 1) + ' / 6') : ''), S);
        },
        stats: (S) => [['ENEMIES', (S.data.total - SR.alive(S)) + ' / ' + S.data.total], ['HEADSHOTS', S.headshots], ['ACCURACY', S.shots ? Math.round(S.shotHits / S.shots * 100) + '%' : '—']]
    });

    /* =====================================================================
       2. OUTPOST RESCUE — Military Valley, Humvees, Compass HUD, Stims & Ambushes
    ===================================================================== */
    const OUTPOSTS = [
        { name: 'ALPHA', x: 0, z: -55, horde: 10, types: ['shambler', 'sprinter'] },
        { name: 'BRAVO', x: 52, z: 28, horde: 14, types: ['shambler', 'hopper', 'one_arm_ripper'] },
        { name: 'CHARLIE', x: -52, z: 28, horde: 18, types: ['sprinter', 'one_arm_ripper', 'headless_charger', 'shambler'] }
    ];
    SR.define({
        id: 'sr_outposts', order: 2, name: 'Outpost Rescue', icon: '🛡️', accent: '#16a34a', music: 'range',
        tagline: 'Fight through a fortified valley! Save all 3 military outposts.',
        desc: 'Dirt supply roads link Alpha, Bravo & Charlie across a cratered valley guarded by Humvee gun trucks, roadside stim supply crates, and scout ambushes. Follow your compass HUD and save all three outposts!',
        heroLabel: 'SPEED RUN • MILITARY VALLEY DEFENSE', stars: [240, 175, 130, 100], timeLimit: 480,
        standardWeapon: 'm249', weaponLabel: 'M249 SAW', weaponNote: 'Bottomless belt',
        keys: [['WASD', 'Move'], ['LMB', 'Shoot'], ['SHIFT', 'Sprint']],
        map: {
            atmosphere: { skyTop: 0x0c4a6e, skyBottom: 0xbbf7d0, fogColor: 0xa7c4a0, fogDensity: 0.005, sunColor: 0xfff7d6, sunIntensity: 1.5, sunPos: [-40, 60, 20], hemiSky: 0xd9f99d, hemiGround: 0x365314, hemiIntensity: 0.85 },
            skybox: 'skybox-morning.png',
            boxes: [B(0, -0.5, 0, 200, 1, 200, 'grass')],
            spawn: { x: 0, y: 0, z: 25, yaw: 0 }
        },
        build(S) {
            K.groundPlane(S, 200, 0x3f6212, 0.002);
            const sand = std(0xc2a26b, 0.95), wood = std(0x78350f, 0.85), dirt = std(0x57534e, 0.98), steelM = std(0x334155, 0.5, 0.6);
            const roadN = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 80), dirt); roadN.rotation.x = -Math.PI / 2; roadN.position.set(0, 0.02, -16); S.add(roadN);
            const roadEW = new THREE.Mesh(new THREE.PlaneGeometry(110, 6.8), dirt); roadEW.rotation.x = -Math.PI / 2; roadEW.position.set(0, 0.02, 26); S.add(roadEW);
            const hubPad = new THREE.Mesh(new THREE.CircleGeometry(9, 24), std(0x374151, 0.9)); hubPad.rotation.x = -Math.PI / 2; hubPad.position.set(0, 0.03, 25); S.add(hubPad);
            const hubPts = [];
            for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; hubPts.push(V(Math.cos(a) * 8.8, 0.25, 25 + Math.sin(a) * 8.8)); }
            const hb = A.bulbs(hubPts, [0x4ade80, 0xfacc15], 0.14); S.add(hb); A.animateBulbs(S, hb, 5, 'chase');
            if (BO.Settings.getQualityPreset().pointLights) {
                const pl = new THREE.PointLight(0xffe0a3, 1.4, 34, 1.4); pl.position.set(0, 6, 25); S.add(pl);
            }

            // Contoured Canyon Berms & Shell Craters along the valley!
            const bermMat = std(0x524632, 0.95);
            const craterMat = std(0x27211b, 0.98);
            const craterRimM = std(0x574c3a, 0.95);
            for (const [bx, bz, w, h, d, ry] of [
                [-14, -8, 6, 2.2, 26, 0.08], [14, -18, 6, 2.4, 28, -0.06],
                [24, 12, 26, 2.3, 6, 0.1], [-24, 12, 26, 2.3, 6, -0.1],
                [28, 40, 28, 2.6, 7, -0.05], [-28, 40, 28, 2.6, 7, 0.05]
            ]) {
                const berm = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.42, w * 0.56, h, 8), bermMat);
                berm.scale.set(1, 1, d / w); berm.position.set(bx, h * 0.42, bz); berm.rotation.y = ry;
                S.add(berm);
            }
            for (const [cx, cz, cr] of [[-4.5, 4, 2.4], [5.0, -28, 2.8], [18, 21.5, 2.6], [-22, 22, 2.5], [38, 30.5, 2.7], [-36, 30, 2.9]]) {
                const rim = new THREE.Mesh(new THREE.TorusGeometry(cr, 0.35, 6, 18), craterRimM);
                rim.rotation.x = Math.PI / 2; rim.position.set(cx, 0.08, cz); S.add(rim);
                const pit = new THREE.Mesh(new THREE.CircleGeometry(cr * 0.92, 16), craterMat);
                pit.rotation.x = -Math.PI / 2; pit.position.set(cx, 0.03, cz); S.add(pit);
            }

            // Detailed Wheeled Military Humvees with Rotating Roof Guns & Headlight Cones!
            S.data.roofGuns = [];
            const addHumvee = (x, z, yaw, col) => {
                const hv = BO.CourseScenery.humvee(S.scene, x, 0, z, yaw, col, false);
                S.solid(hv.blocker); S.solid(hv.cabin);
                S.collider(x - 1.65, 0, z - 2.35, x + 1.65, 2.1, z + 2.35);
                // Rotating Pintle Roof Turret + Gun Shield
                const turret = new THREE.Group();
                turret.position.set(0, 1.88, -0.25);
                const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.48, 0.14, 12), steelM);
                const shield = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.42, 0.08), std(col, 0.6, 0.4));
                shield.position.set(0, 0.22, 0.32);
                const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.72), steelM);
                gunBody.position.set(0, 0.26, 0.18);
                const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 1.05, 8), steelM);
                barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.28, 0.88);
                turret.add(ring, shield, gunBody, barrel);
                hv.root.add(turret);
                S.data.roofGuns.push({ turret, phase: x * 0.2 + z * 0.1 });
                // Twin Headlight Cones
                const beamMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide });
                for (const hx of [-0.82, 0.82]) {
                    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.95, 5.5, 10, 1, true), beamMat);
                    cone.rotation.x = -Math.PI / 2; cone.position.set(hx, 0.72, 5.05);
                    hv.root.add(cone);
                }
            };
            addHumvee(-5.8, -18, 0.35, 0x365314);
            addHumvee(26, 20.5, -0.25, 0x4d5b34);
            addHumvee(-28, 32.5, 0.4, 0x3f6212);
            addHumvee(7.5, 19, -0.65, 0x3f4d36);

            const rnd = L.mulberry32(99);
            const forestTreeTr = [], forestRockTr = [];
            for (let i = 0; i < 48; i++) {
                const a = (i / 48) * TAU, r = 74 + rnd() * 20;
                const ts = (1.7 + rnd() * 0.9) * 1.9;
                forestTreeTr.push({ pos: [Math.cos(a) * r, 0, Math.sin(a) * r], rot: rnd() * 6, scale: ts });
                if (i % 2 === 0) forestRockTr.push({ pos: [Math.cos(a + 0.05) * (r - 6), 0, Math.sin(a + 0.05) * (r - 6)], rot: rnd() * 6, scale: 2.2 + rnd() * 2.0 });
            }
            for (let i = 0; i < 20; i++) {
                const x = (rnd() - 0.5) * 90, z = (rnd() - 0.5) * 80;
                if (Math.hypot(x, z - 25) < 10 || OUTPOSTS.some((o) => Math.hypot(x - o.x, z - o.z) < 11)) continue;
                forestRockTr.push({ pos: [x, 0, z], rot: rnd() * 6, scale: 1.4 + rnd() * 1.2 });
            }
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/mini_forest_kit/tree-high.glb', forestTreeTr);
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/mini_forest_kit/rocks-high.glb', forestRockTr);
            // GLB Tents + Fortified 3D Palisades, Ballistas, Water Tower & Armory Racks
            if (BO.Assets && BO.Assets.applySkybox) BO.Assets.applySkybox(S.scene, 'skybox-morning.png');
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/mini_forest_kit/tent.glb', OUTPOSTS.map((o) => ({ pos: [o.x - 3.6, 0, o.z - 3.0], scale: 2.0 })));
            if (BO.Assets && BO.Assets.placeGLBInstanced) {
                BO.Assets.placeGLBInstanced(S.scene, 'castle_kit/siege-ballista.glb', OUTPOSTS.map((o) => ({ pos: [o.x + 3.6, 0, o.z - 2.8], rot: Math.atan2(-o.x, -o.z), scale: 1.7 })));
                BO.Assets.placeGLBInstanced(S.scene, 'mini_arena_kit/weapon-rack.glb', OUTPOSTS.map((o) => ({ pos: [o.x + 2.4, 0, o.z + 2.2], rot: 0.5, scale: 1.45 })));
                BO.Assets.placeGLB(S.scene, 'city_industrial_kit/water-tower.glb', { pos: [-8.5, 0, 29], scale: 2.6 });
                BO.Assets.placeGLB(S.scene, 'pixel_fantasy/pixel-fantasy-palisade-wall.glb', { pos: [8.5, 0, 31], rot: -0.4, scale: 1.8 });
            }
            if (BO.CourseScenery && BO.CourseScenery.spawnChronoCrystal) {
                for (const [cx, cz] of [[0, -32], [32, 26], [-32, 26], [0, 4]]) {
                    BO.CourseScenery.spawnChronoCrystal(S, V(cx, 2.4, cz), 2.0, 1.1, 0x4ade80);
                }
            }
            for (const o of OUTPOSTS) {
                S.box(o.x - 3.6, 0.95, o.z - 3.0, 2.8, 1.9, 3.2, L.HIDDEN_MAT, { solid: true, shadow: false });
            }

            const dirSg = A.sign('← CHARLIE | ↑ ALPHA | BRAVO →', 6.4, 0.8, { bg: '#1e293b', color: '#fde047', borderColor: '#22c55e', size: 0.40 });
            dirSg.position.set(0, 2.6, 17); S.add(dirSg);

            // Roadside Supply / Stim Boost Crates
            S.data.stims = [[0, -14], [16, 26], [-16, 26], [36, 26], [-36, 26]].map(([sx, sz]) => {
                const cg = new THREE.Group();
                const crate = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.75, 0.8), std(0x14532d, 0.5, 0.3));
                crate.position.y = 0.38;
                const band = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.14, 0.84), basic(0x4ade80));
                band.position.y = 0.45;
                const cross1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.48, 0.14), basic(0x86efac));
                cross1.position.y = 1.25;
                const cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.14), basic(0x86efac));
                cross2.position.y = 1.25;
                cg.add(crate, band, cross1, cross2);
                cg.position.set(sx, 0, sz); S.add(cg);
                return { g: cg, cross1, cross2, x: sx, z: sz, cd: 0 };
            });

            // Mid-road Scout Ambushes
            S.data.ambushes = [
                { id: 'amb_a', x: 0, z: -12, rad: 12, done: false, spawn: [[-7, -20], [7, -22], [0, -28]] },
                { id: 'amb_b', x: 24, z: 26, rad: 11, done: false, spawn: [[32, 18], [34, 34], [40, 26]] },
                { id: 'amb_c', x: -24, z: 26, rad: 11, done: false, spawn: [[-32, 18], [-34, 34], [-40, 26]] }
            ];

            S.data.radars = [];
            S.data.posts = OUTPOSTS.map((o) => {
                const g = new THREE.Group();
                const concreteBase = new THREE.Mesh(new THREE.CircleGeometry(7.2, 24), std(0x334155, 0.9));
                concreteBase.rotation.x = -Math.PI / 2; concreteBase.position.y = 0.025; g.add(concreteBase);
                for (let i = 0; i < 12; i++) {
                    const a = i / 12 * TAU; if (i === 9) continue;
                    const bx = Math.cos(a) * 5.2, bz = Math.sin(a) * 5.2;
                    const bag = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.05, 0.9), sand);
                    bag.position.set(bx, 0.52, bz); bag.rotation.y = -a + Math.PI / 2; g.add(bag);
                    // Real bullet-blocking & player-blocking bounds on outpost sandbags!
                    S.solid(bag);
                    S.collider(o.x + bx - 0.72, 0, o.z + bz - 0.72, o.x + bx + 0.72, 1.15, o.z + bz + 0.72);
                }
                const tower = new THREE.Mesh(new THREE.BoxGeometry(2.3, 5.6, 2.3), wood); tower.position.y = 2.8; g.add(tower); S.solid(tower);
                const cap = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.3, 4), std(0x451a03, 0.85)); cap.position.y = 6.2; cap.rotation.y = Math.PI / 4; g.add(cap);
                const dish = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.5, 10), steelM); dish.position.set(0, 7.6, 0); dish.rotation.x = 0.7; g.add(dish);
                S.data.radars.push(dish);
                const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide })); flag.position.set(0.75, 7.4, 0); g.add(flag);
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6), std(0xd4d4d8, 0.4, 0.7)); pole.position.y = 7.1; g.add(pole);
                const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.45, 24, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
                beacon.position.y = 14; g.add(beacon);
                const sign = A.sign('OUTPOST ' + o.name, 3, 0.6, { bg: '#14532d', color: '#f0fdf4', borderColor: '#22c55e', size: 0.45 }); sign.position.set(0, 3.8, 1.2); g.add(sign);
                g.position.set(o.x, 0, o.z); S.add(g);
                S.add(A.torch(S, V(o.x - 3.2, 0, o.z + 3.2), 0xf97316, false));
                S.add(A.torch(S, V(o.x + 3.2, 0, o.z + 3.2), 0xf97316, false));
                S.collider(o.x - 1.2, 0, o.z - 1.2, o.x + 1.2, 5.6, o.z + 1.2);
                return Object.assign({}, o, { g, flag, beacon, hp: 100, state: 'idle' });
            });

            S.data._stimT = 0; S.data._savedCount = 0;
            S.animate((dt) => {
                const t = performance.now() * 0.004;
                for (const d of S.data.radars || []) d.rotation.y += dt * 2.2;
                for (const rg of S.data.roofGuns || []) rg.turret.rotation.y = Math.sin(t * 0.45 + rg.phase) * 0.9;
                for (const st of S.data.stims || []) {
                    const ready = st.cd <= 0;
                    st.cross1.visible = st.cross2.visible = ready;
                    if (ready) {
                        st.cross1.rotation.y += dt * 2.4; st.cross2.rotation.y += dt * 2.4;
                        st.cross1.position.y = st.cross2.position.y = 1.25 + Math.sin(t + st.x) * 0.12;
                    }
                }
                for (const p of S.data.posts || []) {
                    p.flag.rotation.y = Math.sin(t + p.x) * 0.35;
                    if (p.beacon) {
                        p.beacon.rotation.y += dt * 1.4;
                        p.beacon.material.color.setHex(p.state === 'saved' ? 0x38bdf8 : p.state === 'attack' ? 0xef4444 : 0xfacc15);
                    }
                }
            });
        },
        progress: (S) => S.data.posts.reduce((a, p) => a + (p.state === 'saved' ? 1 : p.state === 'attack' ? 0.3 : 0), 0) / 3,
        update(S, dt, lib, state) {
            const P = BO.Player, D = S.data;
            if (state === 'running') {
                if (D._stimT > 0) {
                    D._stimT -= dt;
                    const fwd = P.getMoveDirectionVectors().forward;
                    if (P.keys['KeyW'] || P.keys['ShiftLeft']) {
                        SR.stepMove(P.pos, fwd, 3.4 * dt, { radius: P.radius, height: P.standHeight, minX: -96, maxX: 96, minZ: -96, maxZ: 96 });
                    }
                }
                for (const st of D.stims || []) {
                    if (st.cd > 0) st.cd -= dt;
                    else if (Math.hypot(P.pos.x - st.x, P.pos.z - st.z) < 2.4) {
                        st.cd = 20; D._stimT = 4.5;
                        P.hp = Math.min(P.maxHp, P.hp + 35);
                        SFX.heal();
                        BO.FX.spawnParticles(V(st.x, 1.0, st.z), 16, 0x4ade80, 4.5, 2, 0.45, 1.0);
                        MG.toast('STIM SUPPLY! +35 HP & SPEED BOOST', '#4ade80');
                    }
                }
                for (const amb of D.ambushes || []) {
                    if (!amb.done && Math.hypot(P.pos.x - amb.x, P.pos.z - amb.z) < amb.rad) {
                        amb.done = true;
                        MG.toast('ROADSIDE SCOUT AMBUSH!', '#fde047');
                        for (const [sx, sz] of amb.spawn) SR.spawnZ(S, 'sprinter', sx, sz, { tag: 'ambush', speed: 4.3 });
                    }
                }
                for (const p of D.posts) {
                    if (p.state === 'idle' && Math.hypot(P.pos.x - p.x, P.pos.z - p.z) < 9.5) {
                        p.state = 'attack'; MG.toast('OUTPOST ' + p.name + ' UNDER ATTACK!', '#fca5a5');
                        BO.Sound.playBossIntro && BO.Sound.playBossIntro();
                        for (let i = 0; i < p.horde; i++) {
                            const a = i / p.horde * TAU + Math.random() * 0.3, r = 32 + Math.random() * 12;
                            const z = SR.spawnZ(S, p.types[i % p.types.length], p.x + Math.cos(a) * r, p.z + Math.sin(a) * r, { tag: p.name });
                            z.srPost = p;
                        }
                    } else if (p.state === 'attack' && SR.alive(S, p.name) === 0) {
                        p.state = 'saved'; p.flag.material.color.setHex(0x38bdf8);
                        S.award(1000, V(p.x, 6, p.z), 'SAVED', '#86efac');
                        SR.stageBurst(S, V(p.x, 3, p.z), `OUTPOST ${p.name} SAVED`, D._savedCount++, 3, 0x4ade80);
                    }
                }
                if (D.posts.every((p) => p.state === 'saved')) SR.done(S, 'ALL OUTPOSTS SAVED');
            }
            SR.updateZ(S, dt, {
                getTarget: (z) => {
                    const p = z.srPost;
                    if (!p || p.state !== 'attack' || Math.hypot(P.pos.x - z.pos.x, P.pos.z - z.pos.z) < 4.5) return null;
                    return { x: p.x, y: 0, z: p.z, attackRange: 5.8 };
                },
                onAttackCustomTarget: (z) => {
                    const p = z.srPost; if (!p || p.state !== 'attack') return;
                    p.hp = Math.max(0, p.hp - 0.55);
                    if (p.hp <= 0) SR.fail(S, 'OUTPOST ' + p.name + ' DESTROYED');
                }
            }, state !== 'running');
        },
        onHit(S, ent, info) { return SR.hitZ(S, ent, info); },
        scoreText(S) { return S.data.posts.filter((p) => p.state === 'saved').length + ' / 3'; },
        hud(S) {
            const P = BO.Player;
            const posts = S.data.posts;
            const target = posts.find((p) => p.state === 'attack') ||
                posts.filter((p) => p.state === 'idle').sort((a, b) => Math.hypot(a.x - P.pos.x, a.z - P.pos.z) - Math.hypot(b.x - P.pos.x, b.z - P.pos.z))[0];
            let compassChip = '';
            if (target) {
                const dist = Math.round(Math.hypot(target.x - P.pos.x, target.z - P.pos.z));
                const fwd = P.getMoveDirectionVectors().forward;
                const toX = target.x - P.pos.x, toZ = target.z - P.pos.z;
                const angWorld = Math.atan2(toX, toZ);
                const angFwd = Math.atan2(fwd.x, fwd.z);
                const rel = Math.atan2(Math.sin(angWorld - angFwd), Math.cos(angWorld - angFwd));
                const arrows = ['⬆', '↖', '⬅', '↙', '⬇', '↘', '➡', '↗'];
                const idx = Math.round(((rel + TAU) % TAU) / (TAU / 8)) % 8;
                compassChip = SR.chip(target.state === 'attack' ? 'DEFEND' : 'NEXT', `${arrows[idx]} ${target.name} ${dist}m`, target.state === 'attack');
            }
            const postHtml = posts.map((p) => `<div class="sr-chip ${p.state === 'attack' && p.hp < 40 ? 'bad' : ''}">${p.name} ${p.state === 'saved' ? '<b>SAVED</b>' : p.state === 'idle' ? '<b>WAITING</b>' : `<span class="sr-bar"><i style="width:${p.hp}%;background:${p.hp > 50 ? '#22c55e' : p.hp > 25 ? '#f59e0b' : '#ef4444'}"></i></span><b>${SR.alive(S, p.name)} LEFT</b>`}</div>`).join('');
            return SR.panel(compassChip + postHtml + (S.data._stimT > 0 ? SR.chip('STIM', S.data._stimT.toFixed(1) + 's') : ''), S);
        },
        stats: (S) => [['OUTPOSTS SAVED', S.data.posts.filter((p) => p.state === 'saved').length + ' / 3'], ['KILLS', S.kills], ['WEAKEST OUTPOST', Math.round(Math.min(...S.data.posts.map((p) => p.hp))) + '%']]
    });

    /* =====================================================================
       4. THE SPLITTER — Deagle + Radial Containment, Bio-Core Catwalk & Meteors
    ===================================================================== */
    const SPLITS = 30, SPLIT_HP = 230, ARENA_R = 26;
    const GEN_COLS = [0x14b8a6, 0x38bdf8, 0xa3e635, 0xf43f5e];
    SR.define({
        id: 'sr_splitter', order: 4, name: 'The Splitter', icon: '🧫', accent: '#14b8a6',
        tagline: 'Desert Eagle ONLY! After 30 splits, dodge falling sky meteors while finishing them!',
        desc: 'Armed strictly with a Desert Eagle .50 inside a cryo-containment bio-lab with a central Bio-Core Catwalk & Overcharge Plasma Crates. Every kill splits the mutant in two—30 splits total (61 mutants). After 30 splits, meteors rain down hurting ONLY YOU!',
        heroLabel: 'SPEED RUN • DEAGLE + METEOR FINALE', stars: [220, 170, 130, 100], timeLimit: 480,
        standardWeapon: 'deagle', weaponLabel: 'DESERT EAGLE .50', weaponNote: 'Desert Eagle only • Dodge meteors after 30 splits!',
        keys: [['WASD', 'Dodge Meteors & Mutants'], ['LMB', 'Deagle Shot']],
        map: {
            atmosphere: { skyTop: 0x042f2e, skyBottom: 0x134e4a, fogColor: 0x0f2f2c, fogDensity: 0.011, sunColor: 0x99f6e4, sunIntensity: 0.9, sunPos: [10, 50, 10], hemiSky: 0x5eead4, hemiGround: 0x042f2e, hemiIntensity: 0.9 },
            boxes: [B(0, -0.5, 0, 80, 1, 80, 'concrete')],
            ramps: [
                { axis: 'z', x: 0, w: 3.6, z1: -8.2, z2: -4.1, y1: 0, y2: 1.55 },
                { axis: 'z', x: 0, w: 3.6, z1: 8.2, z2: 4.1, y1: 0, y2: 1.55 }
            ],
            spawn: { x: 0, y: 0, z: 18, yaw: 0 }
        },
        build(S) {
            const R = ARENA_R;
            const wall = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.5, R + 0.5, 6.5, 48, 1, true), std(0x115e59, 0.8, 0.2, { side: THREE.BackSide }));
            wall.position.y = 3.25; S.add(wall); S.solid(wall);
            const floor = new THREE.Mesh(new THREE.CircleGeometry(R + 0.5, 48), std(0x0f3b38, 0.85)); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.01; S.add(floor);
            const ring = new THREE.Mesh(new THREE.RingGeometry(8.5, 9.2, 36), basic(0x14b8a6, { side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; S.add(ring);

            // Central Raised Bio-Core Catwalk + Ramps
            const deckMat = A.pbrMat('cyberpunk/Industrial Maintenance/service-catwalk-grate-001.png', 4, 4, { roughness: 0.4, metalness: 0.65 });
            S.box(0, 1.4, 0, 8.2, 0.3, 8.2, deckMat, { solid: true });
            const corePillar = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.35, 5.2, 16), new THREE.MeshStandardMaterial({ color: 0x2dd4bf, emissive: 0x14b8a6, emissiveIntensity: 0.85, transparent: true, opacity: 0.65 }));
            corePillar.position.set(0, 2.6, 0); S.add(corePillar);
            S.collider(-1.1, 0, -1.1, 1.1, 5.2, 1.1); S.solid(corePillar);
            for (const rz of [-1, 1]) {
                const rampDeck = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.22, 4.4), deckMat);
                rampDeck.position.set(0, 0.78, rz * 6.15);
                rampDeck.rotation.x = rz * Math.atan2(1.55, 4.1);
                S.add(rampDeck); S.solid(rampDeck);
            }
            for (const sx of [-4.0, 4.0]) {
                const rail = S.box(sx, 2.1, 0, 0.14, 1.1, 8.2, std(0x2dd4bf, 0.4, 0.6), { solid: true });
                void rail;
            }

            // Cryo-Columns around mid-ring
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * TAU + Math.PI / 6;
                const cx = Math.cos(a) * 14.5, cz = Math.sin(a) * 14.5;
                S.box(cx, 2.4, cz, 1.5, 4.8, 1.5, L.HIDDEN_MAT, { solid: true, shadow: false });
                const base = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 0.55, 12), std(0x1f2937, 0.35, 0.8));
                base.position.set(cx, 0.28, cz);
                const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 3.8, 12), new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.75, transparent: true, opacity: 0.6 }));
                tube.position.set(cx, 2.4, cz);
                const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.85, 0.5, 12), std(0x1f2937, 0.35, 0.8));
                cap.position.set(cx, 4.55, cz);
                S.add(base, tube, cap);
            }

            // Perimeter Bio Vats
            const vats = [];
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * TAU, vx = Math.cos(a) * (R - 1.9), vz = Math.sin(a) * (R - 1.9);
                const capMat = std(0x1f2937, 0.3, 0.8);
                const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 3.8, 14), new THREE.MeshStandardMaterial({ color: 0x2dd4bf, emissive: 0x0d9488, emissiveIntensity: 0.7, transparent: true, opacity: 0.55, roughness: 0.1 }));
                tank.position.set(vx, 2.3, vz);
                const base = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.6, 14), capMat); base.position.set(vx, 0.3, vz);
                const lid = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.0, 0.5, 14), capMat); lid.position.set(vx, 4.4, vz);
                const orb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), basic(0x5eead4)); orb.position.set(vx, 2.0, vz);
                S.add(tank, base, lid, orb); vats.push({ orb, phase: i * 0.9 });
            }

            // Overcharge Plasma Crates + Alien Skybox + 3D Industrial Bio-Tanks & Chrono-Crystals!
            if (BO.Assets && BO.Assets.applySkybox) BO.Assets.applySkybox(S.scene, 'skybox-alien.png');
            if (BO.Assets && BO.Assets.placeGLBInstanced) {
                const labCols = [], labTanks = [];
                for (let i = 0; i < 8; i++) {
                    const a = (i / 8) * TAU + Math.PI / 8;
                    labCols.push({ pos: [Math.cos(a) * (R - 0.8), 0, Math.sin(a) * (R - 0.8)], rot: -a, scale: 2.2 });
                    if (i % 2 === 0) labTanks.push({ pos: [Math.cos(a) * (R - 3.2), 0, Math.sin(a) * (R - 3.2)], rot: a, scale: 1.5 });
                }
                BO.Assets.placeGLBInstanced(S.scene, 'building_kit/column.glb', labCols);
                BO.Assets.placeGLBInstanced(S.scene, 'city_industrial_kit/detail-tank-large.glb', labTanks);
            }
            if (BO.CourseScenery && BO.CourseScenery.spawnChronoCrystal) {
                for (let i = 0; i < 4; i++) {
                    const a = (i / 4) * TAU;
                    BO.CourseScenery.spawnChronoCrystal(S, V(Math.cos(a) * 11.5, 3.2, Math.sin(a) * 11.5), 1.5, 0.95, 0x2dd4bf);
                }
            }
            S.data.plasmaCrates = [];
            for (let i = 0; i < 4; i++) {
                const a = (i / 4) * TAU + Math.PI / 4;
                const px = Math.cos(a) * 16.5, pz = Math.sin(a) * 16.5;
                const g = new THREE.Group();
                const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.95, 1.1), std(0x0f172a, 0.3, 0.8));
                box.position.y = 0.48;
                const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), basic(0x22d3ee));
                core.position.y = 1.45;
                g.add(box, core);
                if (BO.Assets && BO.Assets.placeGLB) {
                    BO.Assets.placeGLB(g, 'blaster_kit/crate-medium.glb', { fitSize: [1.15, 0.95, 1.15], hideFallback: box });
                }
                g.position.set(px, 0, pz); S.add(g);
                S.data.plasmaCrates.push({ g, core, x: px, z: pz, cd: 0 });
            }

            S.animate(() => {
                const t = performance.now() * 0.002;
                ring.scale.setScalar(0.95 + Math.sin(t * 2) * 0.05);
                corePillar.rotation.y = t * 0.8;
                for (const v of vats) v.orb.position.y = 2.3 + Math.sin(t * 1.4 + v.phase) * 1.1;
                for (const pc of S.data.plasmaCrates || []) {
                    pc.core.visible = pc.cd <= 0;
                    if (pc.core.visible) { pc.core.rotation.y = t * 2.2; pc.core.position.y = 1.45 + Math.sin(t * 2.5 + pc.x) * 0.14; }
                }
            });

            const sPts = [];
            for (let i = 0; i < 28; i++) { const a = (i / 28) * TAU; sPts.push(V(Math.cos(a) * R, 5.6, Math.sin(a) * R)); }
            const sb = A.bulbs(sPts, [0x2dd4bf, 0xf97316, 0xfde047], 0.15); S.add(sb); A.animateBulbs(S, sb, 6, 'chase');
            const sSign = A.sign('BIO-CONTAINMENT • 30 SPLITS', 7.5, 1.1, { bg: '#042f2e', color: '#99f6e4', borderColor: '#2dd4bf', size: 0.55 });
            sSign.position.set(0, 5.2, -R + 1.2); S.add(sSign);
            if (BO.Settings.getQualityPreset().pointLights) {
                const pl = new THREE.PointLight(0x2dd4bf, 1.6, 36, 1.3); pl.position.set(0, 8, 0); S.add(pl);
            }
            Object.assign(S.data, { splits: 0, killed: 0, meteors: [], craters: [], meteorT: 0.6, overchargeT: 0 });
            this._spawn(S, 0, -12, 0);
        },
        _spawn(S, x, z, gen = 0) {
            const clamped = SR.clampCircle(V(x, 0, z), ARENA_R - 3.0);
            const gIdx = Math.min(3, gen);
            const size = [1.32, 1.08, 0.90, 0.76][gIdx];
            const spd = 2.8 + gIdx * 0.42;
            const e = SR.spawnZ(S, 'mitosis_ghoul', clamped.x, clamped.z, { hp: SPLIT_HP, speed: spd, damage: 17, size });
            e.srGen = gIdx;
            e.stunTimer = 0.45;
            if (e.mesh) {
                const col = GEN_COLS[gIdx];
                e.mesh.traverse((o) => {
                    if (o.isMesh && o.material && !o.material._srCloned) {
                        o.material = o.material.clone();
                        o.material._srCloned = true;
                        if (o.material.emissive) { o.material.emissive.setHex(col); o.material.emissiveIntensity = 0.42 + gIdx * 0.14; }
                    }
                });
            }
            return e;
        },
        progress: (S) => S.data.killed / (1 + SPLITS * 2),
        update(S, dt, lib, state) {
            const D = S.data, P = BO.Player;
            if (state === 'running') {
                SR.clampCircle(P.pos, ARENA_R - 0.85);
                if (D.overchargeT > 0) D.overchargeT -= dt;
                for (const pc of D.plasmaCrates || []) {
                    if (pc.cd > 0) pc.cd -= dt;
                    else if (Math.hypot(P.pos.x - pc.x, P.pos.z - pc.z) < 2.1) {
                        pc.cd = 18; D.overchargeT = 6.0;
                        P.hp = Math.min(P.maxHp, P.hp + 25);
                        SFX.heal();
                        BO.FX.spawnParticles(V(pc.x, 1.2, pc.z), 18, 0x22d3ee, 5, 2, 0.5, 1.1);
                        MG.toast('PLASMA OVERCHARGE! +25 HP & 2x DMG', '#22d3ee');
                    }
                }
            }
            for (const z of D.zs) if (z.alive) SR.clampCircle(z.pos, ARENA_R - 1.0);
            SR.updateZ(S, dt, null, state !== 'running');

            if (state === 'running' && D.splits >= SPLITS && SR.alive(S) > 0) {
                D.meteorT -= dt;
                if (D.meteorT <= 0) {
                    D.meteorT = 0.72;
                    const rawTarget = V(P.pos.x + (Math.random() - 0.5) * 11, 0, P.pos.z + (Math.random() - 0.5) * 11);
                    SR.clampCircle(rawTarget, ARENA_R - 3.5);
                    const tx = rawTarget.x, tz = rawTarget.z;
                    const outerRing = new THREE.Mesh(new THREE.RingGeometry(2.85, 3.25, 24), basic(0xef4444, { transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
                    outerRing.rotation.x = -Math.PI / 2; outerRing.position.set(tx, 0.06, tz); S.add(outerRing);
                    const fillDisc = new THREE.Mesh(new THREE.CircleGeometry(3.0, 24), basic(0xf97316, { transparent: true, opacity: 0.42, side: THREE.DoubleSide }));
                    fillDisc.rotation.x = -Math.PI / 2; fillDisc.position.set(tx, 0.055, tz); fillDisc.scale.setScalar(0.08); S.add(fillDisc);
                    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.15, 0), std(0xf97316, 0.3, 0.2, { emissive: 0xef4444, emissiveIntensity: 0.95 }));
                    rock.position.set(tx, 28, tz); S.add(rock);
                    D.meteors.push({ rock, outerRing, fillDisc, tx, tz, y: 28, startY: 28, spd: 21 });
                }
            }
            for (let i = D.meteors.length - 1; i >= 0; i--) {
                const m = D.meteors[i];
                m.y -= m.spd * dt;
                m.rock.position.y = m.y; m.rock.rotation.x += dt * 5; m.rock.rotation.z += dt * 4;
                const fallFrac = BO.Math.clamp(1 - (m.y - 0.6) / (m.startY - 0.6), 0.08, 1.0);
                m.fillDisc.scale.setScalar(fallFrac);
                m.fillDisc.material.color.setHex(fallFrac > 0.72 ? 0xef4444 : 0xf97316);
                if (Math.random() < dt * 26) BO.FX.spawnParticles(m.rock.position.clone(), 2, 0xfb923c, 1.8, -3, 0.32, 0.9);
                if (m.y <= 0.6) {
                    const hitPos = V(m.tx, 0.5, m.tz);
                    BO.FX.spawnExplosion(hitPos, 3.6, 0xf97316); SFX.rumble(0.42);
                    const crater = new THREE.Mesh(new THREE.CircleGeometry(2.6, 18), basic(0x1c1917, { transparent: true, opacity: 0.75, depthWrite: false }));
                    crater.rotation.x = -Math.PI / 2; crater.position.set(m.tx, 0.035, m.tz); S.add(crater);
                    D.craters.push({ mesh: crater, t: 5.5 });
                    if (D.craters.length > 18) { const old = D.craters.shift(); S.scene.remove(old.mesh); }
                    if (Math.hypot(P.pos.x - m.tx, P.pos.z - m.tz) <= 3.35) {
                        P.takeDamage(20, hitPos, true);
                        MG.flashScreen('rgba(239,68,68,0.35)');
                    }
                    S.scene.remove(m.rock); S.scene.remove(m.outerRing); S.scene.remove(m.fillDisc); D.meteors.splice(i, 1);
                }
            }
            for (let i = D.craters.length - 1; i >= 0; i--) {
                const c = D.craters[i]; c.t -= dt;
                if (c.t <= 0) { S.scene.remove(c.mesh); D.craters.splice(i, 1); }
                else if (c.t < 1.5) c.mesh.material.opacity = (c.t / 1.5) * 0.75;
            }
            if (state === 'running' && D.killed >= 1 + SPLITS * 2 && SR.alive(S) === 0) SR.done(S, 'MUTATION ERADICATED');
        },
        onHit(S, ent, info) {
            const D = S.data;
            const modInfo = D.overchargeT > 0 ? Object.assign({}, info, { dmg: info.dmg * 2.0 }) : info;
            return SR.hitZ(S, ent, modInfo, (z) => {
                D.killed++;
                if (D.splits < SPLITS) {
                    D.splits++;
                    const nextGen = (z.srGen || 0) + 1;
                    for (const s of [-1, 1]) {
                        const a = z.yaw + Math.PI / 2;
                        const pos = SR.clampCircle(V(z.pos.x + Math.cos(a) * s * 1.25, 0, z.pos.z + Math.sin(a) * s * 1.25), ARENA_R - 3.0);
                        this._spawn(S, pos.x, pos.z, nextGen);
                    }
                    BO.FX.spawnParticles(z.pos.clone().add(V(0, 1, 0)), 16, GEN_COLS[Math.min(3, nextGen)], 4, 4, 0.5, 1.2);
                    SFX.tone(300, 600, 0.2, 'sine', 0.12);
                    if (D.splits === 10 || D.splits === 20) {
                        SR.stageBurst(S, z.pos.clone().add(V(0, 1.5, 0)), `${D.splits} SPLITS`, D.splits === 10 ? 0 : 1, 3, 0x14b8a6);
                    } else if (D.splits === SPLITS) {
                        SR.stageBurst(S, z.pos.clone().add(V(0, 1.5, 0)), 'METEOR SHOWER', 2, 3, 0xf97316);
                        MG.toast('NO MORE SPLITS — INCOMING METEOR SHOWER!', '#f97316'); SFX.rumble(0.7);
                    }
                }
            });
        },
        scoreText(S) { return S.data.killed + ' / ' + (1 + SPLITS * 2); },
        hud(S) {
            const D = S.data;
            return SR.panel(
                SR.chip('SPLITS LEFT', SPLITS - D.splits, D.splits >= SPLITS) +
                SR.chip('ALIVE', SR.alive(S)) +
                SR.chip(D.splits >= SPLITS ? 'HAZARD' : 'KILLED', D.splits >= SPLITS ? '☄ METEORS!' : (D.killed + ' / ' + (1 + SPLITS * 2)), D.splits >= SPLITS) +
                (D.overchargeT > 0 ? SR.chip('OVERCHARGE', D.overchargeT.toFixed(1) + 's') : ''),
                S
            );
        },
        stats: (S) => [['KILLED', S.data.killed + ' / ' + (1 + SPLITS * 2)], ['SPLITS', S.data.splits + ' / ' + SPLITS], ['HEADSHOTS', S.headshots]]
    });

    /* =====================================================================
       6. LAST 50 — Gothic GLB Graveyard, Collateral Pierce & Spectral Rounds
    ===================================================================== */
    SR.define({
        id: 'sr_last50', order: 6, name: 'Last 50', icon: '🔫', accent: '#b91c1c', music: 'siege',
        musicState: (S) => ({ wardenAwake: S.data.spawned >= 20, wardenPhase2: S.data.spawned >= 38 }),
        tagline: '50 bullets. 50 zombies spawned ONE BY ONE—headshots only! Line up collaterals!',
        desc: 'A gothic moonlit graveyard, a single M1911 and 50 rounds. Zombies emerge one by one faster each time. Line up well-aimed headshots to pierce 2 heads at once, and hit 10-headshot streaks for clutch Spectral Round drops!',
        heroLabel: 'SPEED RUN • ENDLESS ACCELERATION', stars: [200, 150, 115, 90], timeLimit: 420, fixedAmmo: true, infiniteMag: false,
        standardWeapon: 'm1911', weaponLabel: 'M1911', weaponNote: '50 rounds + 10x streak spectral drops',
        keys: [['WASD', 'Move'], ['LMB', 'Shoot (heads only)'], ['R', 'Reload']],
        map: {
            atmosphere: { skyTop: 0x090d16, skyBottom: 0x334155, fogColor: 0x1e293b, fogDensity: 0.024, sunColor: 0xcbd5e1, sunIntensity: 0.45, sunPos: [20, 40, -30], hemiSky: 0x94a3b8, hemiGround: 0x1c1917, hemiIntensity: 0.82, moon: true },
            boxes: [B(0, -0.5, 0, 90, 1, 90, 'grass')],
            spawn: { x: 0, y: 0, z: 0, yaw: 0 }
        },
        build(S) {
            K.groundPlane(S, 90, 0x1a2618, 0.002);
            // Perimeter Wrought-Iron Fence GLBs + Solid Boundary Colliders
            for (const [x1, z1, x2, z2] of [[-24, -24, 24, -23.6], [-24, 23.6, 24, 24], [-24, -24, -23.6, 24], [23.6, -24, 24, 24]]) {
                SR.wall(S, x1, z1, x2, z2, 2.2, L.HIDDEN_MAT);
            }
            const fenceTr = [], pillarTr = [];
            for (let s = -22; s <= 22; s += 4) {
                fenceTr.push({ pos: [s, 0, -23.8], scale: 2.0 }, { pos: [s, 0, 23.8], scale: 2.0 });
                fenceTr.push({ pos: [-23.8, 0, s], rot: Math.PI / 2, scale: 2.0 }, { pos: [23.8, 0, s], rot: Math.PI / 2, scale: 2.0 });
                if (s % 8 === 0) {
                    pillarTr.push({ pos: [s, 0, -23.8], scale: 2.0 }, { pos: [s, 0, 23.8], scale: 2.0 });
                    pillarTr.push({ pos: [-23.8, 0, s], scale: 2.0 }, { pos: [23.8, 0, s], scale: 2.0 });
                }
            }
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/graveyard_kit/iron-fence.glb', fenceTr);
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/graveyard_kit/iron-fence-border-column.glb', pillarTr);

            // Gothic Mausoleums (North & South) with GLB Crypts + Solid Colliders
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/graveyard_kit/crypt-large.glb', [
                { pos: [0, 0, -18.5], scale: 2.4 },
                { pos: [0, 0, 18.5], rot: Math.PI, scale: 2.4 }
            ]);
            for (const [ax, az] of [[0, -18.5], [0, 18.5]]) {
                S.box(ax, 1.8, az, 5.2, 3.6, 5.2, L.HIDDEN_MAT, { solid: true, shadow: false });
                S.add(A.torch(S, V(ax - 3.6, 0, az + 1.2), 0xf97316, true));
                S.add(A.torch(S, V(ax + 3.6, 0, az + 1.2), 0xf97316, true));
                const cPts = []; for (let cx = -3.6; cx <= 3.6; cx += 0.9) cPts.push(V(ax + cx, 4.4, az));
                const cb = A.bulbs(cPts, [0xef4444, 0xf97316, 0xfde047], 0.11); S.add(cb); A.animateBulbs(S, cb, 5, 'twinkle');
            }

            // GLB Tombstones, Crosses, Side Crypts & Gnarled Trees with Solid Colliders
            const rnd = L.mulberry32(50);
            const roundGraves = [], crossGraves = [], decoGraves = [], treeTr = [], cryptTr = [];
            for (let i = 0; i < 30; i++) {
                const x = (rnd() - 0.5) * 38, z = (rnd() - 0.5) * 34;
                if (Math.hypot(x, z) < 5.5 || Math.abs(z) > 15 && Math.abs(x) < 5) continue;
                const rot = (rnd() - 0.5) * 0.5;
                S.box(x, 0.72, z, 0.9, 1.44, 0.55, L.HIDDEN_MAT, { solid: true, shadow: false });
                const tr = { pos: [x, 0, z], rot, scale: 1.55 };
                if (i % 3 === 0) crossGraves.push(tr);
                else if (i % 3 === 1) decoGraves.push(tr);
                else roundGraves.push(tr);
            }
            for (const [cx, cz, ry] of [[-15, -10, 0.4], [15, -10, -0.4], [-15, 10, 2.7], [15, 10, -2.7]]) {
                cryptTr.push({ pos: [cx, 0, cz], rot: ry, scale: 1.8 });
                S.box(cx, 1.2, cz, 2.6, 2.4, 2.6, L.HIDDEN_MAT, { solid: true, shadow: false });
            }
            for (let i = 0; i < 10; i++) {
                const a = (i / 10) * TAU;
                treeTr.push({ pos: [Math.cos(a) * 21.2, 0, Math.sin(a) * 21.2], rot: i * 1.1, scale: 2.1 + (i % 3) * 0.4 });
            }
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/graveyard_kit/gravestone-round.glb', roundGraves);
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/graveyard_kit/gravestone-cross.glb', crossGraves);
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/graveyard_kit/gravestone-decorative.glb', decoGraves);
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/graveyard_kit/crypt-a.glb', cryptTr);
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/graveyard_kit/pine-crooked.glb', treeTr);
            if (BO.Assets && BO.Assets.applySkybox) BO.Assets.applySkybox(S.scene, 'skybox-night.png');
            if (BO.Assets && BO.Assets.placeGLB) {
                BO.Assets.placeGLB(S.scene, 'graveyard_kit/altar-stone.glb', { pos: [-4.2, 0, 0], rot: Math.PI / 2, scale: 1.7 });
                BO.Assets.placeGLB(S.scene, 'graveyard_kit/altar-stone.glb', { pos: [4.2, 0, 0], rot: -Math.PI / 2, scale: 1.7 });
                BO.Assets.placeGLBInstanced(S.scene, 'graveyard_kit/candle-multiple.glb', [
                    { pos: [-4.2, 1.05, 0], scale: 1.5 }, { pos: [4.2, 1.05, 0], scale: 1.5 },
                    { pos: [-2.4, 0, -16.2], scale: 1.6 }, { pos: [2.4, 0, 16.2], scale: 1.6 }
                ]);
                BO.Assets.placeGLBInstanced(S.scene, 'pixel_fantasy/pixel-fantasy-iron-brazier.glb', [
                    { pos: [-11, 0, -11], scale: 1.5 }, { pos: [11, 0, -11], scale: 1.5 },
                    { pos: [-11, 0, 11], scale: 1.5 }, { pos: [11, 0, 11], scale: 1.5 }
                ]);
                BO.Assets.placeGLB(S.scene, 'graveyard_kit/character-skeleton.glb', { pos: [0, 3.6, -18.5], scale: 1.8 });
                BO.Assets.placeGLB(S.scene, 'graveyard_kit/character-vampire.glb', { pos: [0, 3.6, 18.5], rot: Math.PI, scale: 1.8 });
            }
            if (BO.CourseScenery && BO.CourseScenery.spawnChronoCrystal) {
                for (const [cx, cz] of [[-12, 0], [12, 0], [0, -11], [0, 11]]) {
                    const ctg = BO.CourseScenery.spawnChronoCrystal(S, V(cx, 2.5, cz), 1.5, 0.9, 0xf87171);
                    ctg.bonusRound = 1;
                }
            }

            // Swirling Ground Fog + Moonbeam Shafts
            const fogTex = L.canvasTex('gy-fog', 128, 128, (g, w, h) => {
                const gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
                gr.addColorStop(0, 'rgba(148,163,184,0.34)');
                gr.addColorStop(1, 'rgba(148,163,184,0)');
                g.fillStyle = gr; g.fillRect(0, 0, w, h);
            });
            const fogMat = new THREE.MeshBasicMaterial({ map: fogTex, transparent: true, depthWrite: false, opacity: 0.42 });
            const fogPatches = [];
            for (let i = 0; i < 10; i++) {
                const a = (i / 10) * TAU;
                const fm = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), fogMat);
                fm.rotation.x = -Math.PI / 2;
                fm.position.set(Math.cos(a) * (7 + (i % 3) * 5), 0.22 + (i % 3) * 0.12, Math.sin(a) * (7 + (i % 3) * 5));
                S.add(fm); fogPatches.push({ m: fm, spd: (i % 2 ? 1 : -1) * 0.22, bx: fm.position.x, bz: fm.position.z, ph: i });
            }
            const beamMat = new THREE.MeshBasicMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
            for (const [bx, bz] of [[-7, -6], [8, 5], [-9, 8], [7, -9]]) {
                const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 4.2, 28, 12, 1, true), beamMat);
                shaft.position.set(bx, 13.5, bz); shaft.rotation.set(0.18, 0, -0.14); S.add(shaft);
            }
            S.animate((dt) => {
                const t = performance.now() * 0.001;
                for (const fp of fogPatches) {
                    fp.m.rotation.z += fp.spd * dt;
                    fp.m.position.x = fp.bx + Math.sin(t * 0.35 + fp.ph) * 1.6;
                    fp.m.position.z = fp.bz + Math.cos(t * 0.3 + fp.ph) * 1.6;
                }
                for (const pk of S.data.pickups || []) {
                    pk.mesh.rotation.y += dt * 3.0;
                    pk.mesh.position.y = 1.05 + Math.sin(t * 4 + pk.x) * 0.18;
                }
            });
            Object.assign(S.data, { spawnT: 0.8, spawned: 0, killed: 0, body: 0, hsStreak: 0, collaterals: 0, pickups: [] });
        },
        start() {
            const w = BO.Player.activeWeapon;
            if (w) { w.mag = 8; w.reserve = 42; }
        },
        onShot(S) {
            if (!S.data._hitThisShot) S.data.hsStreak = 0;
            S.data._hitThisShot = false;
        },
        progress: (S) => S.data.killed / 50,
        update(S, dt, lib, state) {
            const D = S.data, P = BO.Player;
            if (state === 'running') {
                if (D.spawned < 50) {
                    D.spawnT -= dt;
                    if (D.spawnT <= 0) {
                        const a = Math.random() * TAU, r = 20 + Math.random() * 2.2;
                        const spd = 1.65 + D.spawned * 0.088;
                        const specId = D.spawned >= 30 ? 'sprinter' : 'shambler';
                        const z = SR.spawnZ(S, specId, Math.cos(a) * r, Math.sin(a) * r, { speed: spd, hp: 99999, damage: 14 });
                        if (D.spawned >= 30 && z.mesh) {
                            z.srRedSprint = true;
                            const aura = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.72, 16), basic(0xef4444, { transparent: true, opacity: 0.65, side: THREE.DoubleSide }));
                            aura.rotation.x = -Math.PI / 2; aura.position.y = 0.06; aura.userData.noHit = true;
                            z.mesh.add(aura);
                        }
                        D.spawned++;
                        D.spawnT = Math.max(0.28, 2.25 * Math.pow(0.954, D.spawned));
                    }
                }
                for (let i = D.pickups.length - 1; i >= 0; i--) {
                    const pk = D.pickups[i];
                    if (Math.hypot(P.pos.x - pk.x, P.pos.z - pk.z) < 2.5) {
                        const w = P.activeWeapon;
                        if (w) w.reserve += 2;
                        SFX.heal();
                        BO.FX.spawnParticles(V(pk.x, 1.1, pk.z), 16, 0x67e8f9, 4, 2, 0.45, 1.0);
                        MG.toast('+2 SPECTRAL ROUNDS!', '#67e8f9');
                        S.scene.remove(pk.mesh); D.pickups.splice(i, 1);
                    }
                }
                if (D.killed >= 50) SR.done(S, 'ALL 50 DOWN');
                const w = P.activeWeapon;
                if (w && w.mag <= 0 && w.reserve <= 0 && !MG.pendingShot && SR.alive(S) + (50 - D.spawned) > 0) SR.fail(S, 'OUT OF AMMO');
            }
            for (const z of D.zs) {
                if (z.alive && z.srRedSprint && Math.random() < dt * 12) {
                    BO.FX.spawnParticles(z.pos.clone().add(V(0, 0.9, 0)), 1, 0xef4444, 1.2, 0.5, 0.28, 0.8);
                }
            }
            SR.updateZ(S, dt, null, state !== 'running');
        },
        onHit(S, ent, info) {
            if (ent && ent.alive && ent.isChronoCrystal) {
                S.data._hitThisShot = true;
                if (ent.bonusRound && BO.Player.activeWeapon) BO.Player.activeWeapon.reserve += ent.bonusRound;
                return SR.hitZ(S, ent, info);
            }
            if (!ent || !ent.alive || !ent.takeDamage) return false;
            const D = S.data;
            S.hits++; D._hitThisShot = true;
            if (info.hitbox !== 'head') {
                D.body++; D.hsStreak = 0; ent.stunTimer = Math.max(ent.stunTimer, 0.35);
                MG.popup(info.pt, 'HEADSHOTS ONLY', '#fca5a5'); SFX.thunk(); return false;
            }
            const killHead = (z, pt, isCollat) => {
                z.takeDamage(1e7, 'head', true, null, 'bullet');
                S.headshots++; S.kills++; D.killed++; D.hsStreak++; S.bumpCombo();
                if (BO.Assets && BO.Assets.playClip) {
                    BO.Assets.playClip('overhaul/combat/mw2_ping.mp3', { volume: 0.38, rateJitter: 0.06 });
                }
                if (isCollat) {
                    D.collaterals++;
                    MG.popup(pt, 'COLLATERAL PIERCE!', '#fde047', true);
                    SFX.star(2);
                    if (BO.Assets && BO.Assets.playClip) BO.Assets.playClip('overhaul/combat/LevelUpMW2.mp3', { volume: 0.38, rateJitter: 0.03 });
                }
                if (D.killed % 10 === 0 && D.killed < 50) {
                    SR.stageBurst(S, pt, `${D.killed} / 50`, Math.floor(D.killed / 10) - 1, 5, 0xb91c1c);
                }
                if (D.hsStreak > 0 && D.hsStreak % 10 === 0) {
                    const orb = new THREE.Group();
                    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), basic(0x67e8f9));
                    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.05, 8, 18), basic(0xfde047));
                    halo.rotation.x = Math.PI / 2;
                    orb.add(core, halo);
                    const px = BO.Math.clamp(z.pos.x, -21, 21), pz = BO.Math.clamp(z.pos.z, -21, 21);
                    orb.position.set(px, 1.05, pz); S.add(orb);
                    D.pickups.push({ mesh: orb, x: px, z: pz });
                    MG.toast('10x HEADSHOT STREAK — SPECTRAL ROUNDS DROPPED!', '#67e8f9');
                }
            };
            killHead(ent, info.pt, false);

            // Collateral Headshot Pierce: check 1 lined-up zombie head along bullet direction
            if (info.dir && D.killed < 50) {
                const wallHit = BO.World.raycastWorld(info.pt, info.dir, 22);
                _srRay.set(info.pt, info.dir);
                _srRay.near = 0.05;
                _srRay.far = wallHit ? wallHit.distance : 22;
                const next = BO.Combat._castTargets(_srRay).find((hit) => {
                    const z = hit.object.userData.entity;
                    return z !== ent && z?.alive && D.zs.includes(z) && BO.Hitboxes.zoneAt(hit) === 'head';
                });
                if (next) killHead(next.object.userData.entity, next.point, true);
            }
            return true;
        },
        scoreText(S) { return S.data.killed + ' / 50'; },
        hud(S) {
            const w = BO.Player.activeWeapon, left = w ? w.mag + w.reserve : 0, need = 50 - S.data.killed;
            return SR.panel(
                SR.chip('ROUNDS', left, left < need) +
                SR.chip('ZOMBIES LEFT', need) +
                SR.chip('HS STREAK', S.data.hsStreak % 10 + ' / 10') +
                SR.chip('SPAWNED', S.data.spawned + ' / 50'),
                S
            );
        },
        stats: (S) => [['HEADSHOT KILLS', S.data.killed + ' / 50'], ['COLLATERALS', S.data.collaterals], ['BODY SHOTS', S.data.body], ['ROUNDS FIRED', S.shots + ' / 50']]
    });
})(window);
