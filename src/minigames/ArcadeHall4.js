/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Arcade Hall (part 4)
     12. Starfall Shield — meteors split when shot; protect the city below
     13. Fishing Hole    — fish can only be hit mid-leap; shooting water scares them
     14. Paint Wars      — paint the wall your colour before the rival drone does
     15. Safe Cracker    — fire when the dial's notch lines up with the marker
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const L = BO.MinigameLib;
    const A = BO.MinigameArt;
    const AK = BO.MGArcadeKit;
    const { SFX, std, basic, clamp01, TAU } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const ARC = { cat: 'arcade', infiniteMag: true, forgivingMisses: true, lockWeapon: true, oneTargetPerShot: true };
    const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));

    /* =====================================================================
       12. STARFALL SHIELD
    ===================================================================== */
    const MET = { L: { r: 1.5, pts: 50, dmg: 16, next: 'M' }, M: { r: 0.95, pts: 80, dmg: 10, next: 'S' }, S: { r: 0.55, pts: 120, dmg: 6, next: null } };
    MG.register(Object.assign({}, ARC, {
        id: 'starfall_shield', order: 12, name: 'Starfall Shield', icon: '☄️', accent: '#f97316',
        tagline: 'Every meteor you shoot breaks in two.',
        desc: 'Meteors are falling on the city in the valley below. A big meteor splits into two medium ones when shot, a medium one into two small ones, and only small ones are destroyed outright. Anything that lands damages the city. Keep it standing for 60 seconds.',
        heroLabel: 'ARCADE HALL • DEFENCE • 60 SECONDS', duration: 60, stars: [3000, 7000, 12000, 17000],
        standardWeapon: 'g36c_tac', weaponLabel: 'G36C', weaponNote: 'Bottomless magazine',
        keys: [['LMB', 'Shoot meteors'], ['R', 'Retry from results']],
        map: AK.map({ skyTop: 0x020617, skyBottom: 0x7c2d12, fogColor: 0x431407, fogDensity: 0.004, sunColor: 0xfdba74, sunIntensity: 0.7 }),
        build(S) {
            AK.hall(S, { title: 'STARFALL SHIELD', accent: '#f97316', ground: 0x292524 });
            const city = [];
            for (let i = 0; i < 14; i++) {
                const h = 4 + (i * 37 % 9);
                const b = A.building(3.2, h, 3.2, [0x334155, 0x475569, 0x1e293b][i % 3], i + 5, 0.55, true);
                b.position.set(-22 + i * 3.4, h / 2 - 6, -38 - (i % 3) * 2);
                S.add(b);
                city.push(b);
            }
            const valley = new THREE.Mesh(new THREE.PlaneGeometry(80, 30), std(0x1c1917, 1));
            valley.rotation.x = -Math.PI / 2; valley.position.set(0, -6, -40); S.add(valley);
            Object.assign(S.data, { city, cityHp: 100, spawnT: 0.8, splits: 0, smashed: 0, landed: 0 });
        },
        _meteor(S, size, pos, vel) {
            const M = MET[size];
            const g = new THREE.Group();
            const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(M.r, 0), new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.9, emissive: 0xea580c, emissiveIntensity: 0.35, flatShading: true }));
            const glow = new THREE.Mesh(new THREE.SphereGeometry(M.r * 1.35, 10, 8), new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.25, depthWrite: false }));
            glow.userData.noHit = true;
            g.add(rock, glow);
            const tg = S.addTarget({ mesh: g, hitMeshes: [rock], pos, life: 0, appear: 'scale', inT: 0.1, death: 'burst', deathColor: 0xf97316, bonus: true });
            tg.vel = vel; tg.size = size;
            tg.onTick = (t, dt) => {
                if (!t.alive || MG.state !== 'running') return;
                t.root.position.addScaledVector(t.vel, dt);
                t.pivot.rotation.x += dt * 1.5; t.pivot.rotation.y += dt;
                if (Math.random() < 0.4) BO.FX.spawnParticles(t.root.position, 1, 0xfb923c, 1, 0, 0.4, M.r);
                if (t.root.position.y < -4) {
                    const D = S.data;
                    D.landed++;
                    D.cityHp = Math.max(0, D.cityHp - M.dmg);
                    BO.FX.spawnExplosion(t.root.position.clone(), M.r * 3, 0xf97316);
                    SFX.rumble(0.35);
                    S.breakCombo('CITY HIT');
                    t.remove();
                    if (D.cityHp <= 0) MG.finish('THE CITY FELL', { color: '#f87171' });
                }
            };
            return tg;
        },
        update(S, dt, lib, state) {
            const D = S.data;
            if (state !== 'running') return;
            D.spawnT -= dt;
            if (D.spawnT <= 0) {
                D.spawnT = Math.max(0.9, 2.4 - S.t * 0.025);
                const x = (Math.random() - 0.5) * 36, z = -26 - Math.random() * 8;
                const tx = (Math.random() - 0.5) * 40;
                this._meteor(S, Math.random() < 0.7 ? 'L' : 'M', V(x, 28, z), V((tx - x) / 9, -3.6 - S.t * 0.03, -0.6));
            }
        },
        onHit(S, ent, info) {
            if (!ent.alive || !ent.size) return false;
            const D = S.data, M = MET[ent.size];
            S.hits++; S.kills++;
            ent.kill(info);
            S.bumpCombo();
            S.award(M.pts * S.comboMult, info.pt, M.next ? 'SPLIT' : 'SMASHED', '#fdba74');
            SFX.shatter();
            if (M.next) {
                D.splits++;
                const p = ent.root.position.clone();
                for (const s of [-1, 1]) this._meteor(S, M.next, p.clone().add(V(s * M.r * 0.8, 0, 0)), V(ent.vel.x + s * 2.6, ent.vel.y * 0.9 + 1.5, ent.vel.z));
            } else D.smashed++;
            return true;
        },
        hud(S) { const D = S.data; return `<div class="ah3-panel"><div class="sr-chip ${D.cityHp < 35 ? 'bad' : ''}">CITY <span class="sr-bar"><i style="width:${D.cityHp}%;background:${D.cityHp > 50 ? '#22c55e' : D.cityHp > 25 ? '#f59e0b' : '#ef4444'}"></i></span><b>${D.cityHp}</b></div>${AK.chip('SPLITS', D.splits)}${AK.chip('SMASHED', D.smashed)}</div>`; },
        result(S) {
            const D = S.data;
            const bonus = D.cityHp > 0 ? D.cityHp * 30 : 0;
            S.score += bonus;
            const stars = this.stars.filter((th) => S.score >= th).length;
            return { score: S.score, stars, title: D.cityHp <= 0 ? 'THE CITY FELL' : D.cityHp >= 80 ? 'GUARDIAN OF THE VALLEY' : 'CITY SAVED', stats: [['CITY LEFT', D.cityHp + '%'], ['CITY BONUS', bonus], ['SPLITS', D.splits], ['SMASHED', D.smashed], ['LANDED', D.landed], ['BEST STREAK', S.maxCombo]], xp: Math.round(120 + S.score * 0.04 + stars * 120) };
        }
    }));

    /* =====================================================================
       13. FISHING HOLE
    ===================================================================== */
    const POND = { x: 0, z: -12, r: 8 };
    function fishMesh(kind) {
        const g = new THREE.Group();
        const col = kind === 'gold' ? 0xfacc15 : kind === 'boot' ? 0x44403c : [0x60a5fa, 0xf97316, 0x94a3b8, 0x34d399][Math.floor(Math.random() * 4)];
        if (kind === 'boot') {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.35), std(col, 0.8));
            const foot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.7), std(col, 0.8)); foot.position.set(0, -0.2, 0.2);
            g.add(leg, foot);
            return { g, hit: [leg, foot] };
        }
        const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.3, metalness: kind === 'gold' ? 0.8 : 0.2, emissive: kind === 'gold' ? 0x854d0e : 0x000000 });
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 10), mat);
        body.scale.set(0.5, 0.7, 1.4);
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.45, 4), mat);
        tail.rotation.x = Math.PI / 2; tail.position.z = -0.7; tail.scale.set(0.3, 1, 1);
        g.add(body, tail);
        return { g, hit: [body, tail] };
    }
    MG.register(Object.assign({}, ARC, {
        id: 'fishing_hole', order: 13, name: 'Fishing Hole', icon: '🎣', accent: '#0ea5e9',
        tagline: 'Hit them mid-leap. Shooting water scares them off.',
        desc: 'Fish swim under the surface of the pond and only now and then leap out. You can only hit a fish while it is in the air. A shot that splashes the water scares every fish nearby back to the bottom for a few seconds. Golden fish are worth a fortune; old boots cost you.',
        heroLabel: 'ARCADE HALL • TIMING • 60 SECONDS', duration: 60, stars: [2000, 4500, 7500, 11000],
        standardWeapon: 'five_seven', weaponLabel: 'FIVE-SEVEN', weaponNote: 'Bottomless magazine',
        keys: [['LMB', 'Shoot leaping fish'], ['R', 'Retry from results']],
        map: AK.map({ skyTop: 0x0369a1, skyBottom: 0xbae6fd, fogColor: 0x7dd3fc, fogDensity: 0.006, sunIntensity: 1.6 }),
        build(S) {
            AK.hall(S, { title: 'FISHING HOLE', accent: '#0ea5e9', ground: 0x3f6212 });
            const water = new THREE.Mesh(new THREE.CircleGeometry(POND.r, 48), new THREE.MeshStandardMaterial({ color: 0x0e7490, roughness: 0.08, metalness: 0.35, transparent: true, opacity: 0.88 }));
            water.rotation.x = -Math.PI / 2; water.position.set(POND.x, 0.05, POND.z);
            S.add(water);
            const rim = new THREE.Mesh(new THREE.TorusGeometry(POND.r, 0.35, 8, 48), std(0x78716c, 0.9));
            rim.rotation.x = Math.PI / 2; rim.position.set(POND.x, 0.1, POND.z); S.add(rim);
            for (let i = 0; i < 8; i++) { const t = A.tree(1 + Math.random() * 0.5); const a = i / 8 * TAU; t.position.set(POND.x + Math.cos(a) * (POND.r + 4), 0, POND.z + Math.sin(a) * (POND.r + 4) - 2); S.add(t); }
            const waterEnt = { alive: true, isWater: true };
            water.userData.entity = waterEnt; water.userData.hitbox = 'torso';
            const shadows = [];
            for (let i = 0; i < 7; i++) {
                const sh = new THREE.Mesh(new THREE.CircleGeometry(0.45, 12), new THREE.MeshBasicMaterial({ color: 0x082f49, transparent: true, opacity: 0.55, depthWrite: false }));
                sh.rotation.x = -Math.PI / 2; sh.scale.set(0.6, 1.6, 1);
                S.add(sh);
                shadows.push({ m: sh, a: Math.random() * TAU, r: 1 + Math.random() * (POND.r - 2), w: (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 0.4), scared: 0 });
            }
            Object.assign(S.data, { water, shadows, jumpT: 0.8, caught: 0, gold: 0, boots: 0, splashes: 0 });
        },
        extraTargets(S, pool) { if (S.data.water) pool.push(S.data.water); },
        update(S, dt, lib, state) {
            const D = S.data;
            for (const s of D.shadows) {
                s.scared = Math.max(0, s.scared - dt);
                s.a += s.w * dt * (s.scared > 0 ? 3 : 1);
                s.m.position.set(POND.x + Math.cos(s.a) * s.r, 0.07, POND.z + Math.sin(s.a) * s.r);
                s.m.rotation.z = -s.a;
                s.m.material.opacity = s.scared > 0 ? 0.15 : 0.55;
            }
            if (state !== 'running') return;
            D.jumpT -= dt;
            if (D.jumpT <= 0) {
                D.jumpT = Math.max(0.45, 1.3 - S.t * 0.012) * (0.7 + Math.random() * 0.6);
                const ready = D.shadows.filter((s) => s.scared <= 0);
                if (!ready.length) return;
                const s = ready[Math.floor(Math.random() * ready.length)];
                const r = Math.random();
                const kind = r < 0.08 ? 'gold' : r < 0.18 ? 'boot' : 'fish';
                const from = s.m.position.clone();
                const ang = Math.random() * TAU, dist = 2 + Math.random() * 2.5;
                const to = from.clone().add(V(Math.cos(ang) * dist, 0, Math.sin(ang) * dist));
                const toR = Math.hypot(to.x - POND.x, to.z - POND.z);
                if (toR > POND.r - 0.8) to.set(POND.x + (to.x - POND.x) / toR * (POND.r - 1), 0, POND.z + (to.z - POND.z) / toR * (POND.r - 1));
                const dur = kind === 'gold' ? 0.85 : 1.1 + Math.random() * 0.5, peak = 2.2 + Math.random() * 1.8;
                const m = fishMesh(kind);
                const tg = S.addTarget({ mesh: m.g, hitMeshes: m.hit, pos: from.clone(), life: 0, appear: 'none', inT: 0.01, death: 'fall', deathColor: kind === 'gold' ? 0xfacc15 : 0x7dd3fc, bonus: true });
                tg.kind = kind;
                let tt = 0;
                tg.onTick = (t, dt2) => {
                    if (!t.alive) return;
                    tt += dt2;
                    const k = tt / dur;
                    if (k >= 1) { BO.FX.spawnParticles(to.clone().add(V(0, 0.1, 0)), 8, 0xbae6fd, 2.5, 6, 0.3, 0.8); t.remove(); return; }
                    t.root.position.lerpVectors(from, to, k);
                    t.root.position.y = Math.sin(k * Math.PI) * peak - 0.2;
                    t.root.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
                    t.pivot.rotation.x = (k - 0.5) * 2.2;
                };
                BO.FX.spawnParticles(from.clone().add(V(0, 0.1, 0)), 8, 0xbae6fd, 2.5, 6, 0.3, 0.8);
                SFX.noise(0.15, 1400, 'bandpass', 0.6, 0.12);
            }
        },
        onHit(S, ent, info) {
            const D = S.data;
            if (ent.isWater) {
                D.splashes++;
                for (const s of D.shadows) if (s.m.position.distanceTo(info.pt) < 4) s.scared = 3.5;
                BO.FX.spawnParticles(info.pt, 12, 0xbae6fd, 3, 8, 0.4, 0.9);
                S.breakCombo('SPLASH');
                MG.popup(info.pt, 'SPLASH! FISH SCARED', '#7dd3fc');
                return false;
            }
            if (!ent.alive || !ent.kind) return false;
            S.hits++;
            ent.kill(info);
            if (ent.kind === 'boot') { D.boots++; S.penalties++; S.award(-150, info.pt, 'OLD BOOT', '#f87171'); S.breakCombo('JUNK'); SFX.bonk(); return true; }
            S.kills++;
            S.bumpCombo();
            if (ent.kind === 'gold') { D.gold++; S.award(500 * S.comboMult, info.pt, 'GOLDEN FISH!', '#facc15'); SFX.fanfare(); }
            else { D.caught++; S.award(120 * S.comboMult, info.pt, 'CATCH', '#7dd3fc'); SFX.ding(1.3); }
            return true;
        },
        hud(S) { const D = S.data; return `<div class="ah3-panel">${AK.chip('CAUGHT', D.caught)}${AK.chip('GOLDEN', D.gold)}${D.boots ? AK.chip('BOOTS', D.boots, true) : ''}</div>`; },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return { score: S.score, stars, title: D.gold >= 3 ? 'GOLDEN ANGLER' : 'GONE FISHING', stats: [['FISH', D.caught], ['GOLDEN FISH', D.gold], ['BOOTS', D.boots], ['SPLASHES', D.splashes], ['BEST STREAK', S.maxCombo]], xp: Math.round(120 + S.score * 0.04 + stars * 120) };
        }
    }));

    /* =====================================================================
       14. PAINT WARS
    ===================================================================== */
    const PW = { w: 16, h: 8, cols: 32, rows: 16, z: -12, cy: 4.4 };
    const MINE = '#38bdf8', RIVAL = '#f472b6';
    MG.register(Object.assign({}, ARC, {
        id: 'paint_wars', order: 14, name: 'Paint Wars', icon: '🎨', accent: '#38bdf8',
        tagline: 'Out-paint the drone. Coverage wins.',
        desc: 'Every shot splats your blue paint on the big wall. A rival drone sprays pink and drops paint bombs, and a second drone joins halfway. Shoot a drone to stun it for a moment. When the clock runs out, the colour that covers more of the wall wins; your stars depend on your coverage.',
        heroLabel: 'ARCADE HALL • TERRITORY • 60 SECONDS', duration: 60, stars: [35, 50, 65, 80], starLabel: (th) => th + '% WALL',
        standardWeapon: 'p90', weaponLabel: 'P90 PAINT GUN', weaponNote: 'Bottomless paint', fireInterval: 0.09, tracerColor: 0x38bdf8,
        formatBest: (b) => (b.extra ? b.extra.pct + '% • ' : '') + Number(b.score).toLocaleString(),
        keys: [['LMB', 'Paint / stun drones'], ['R', 'Retry from results']],
        map: AK.map({ skyTop: 0x1e3a8a, skyBottom: 0xfae8ff, fogColor: 0xf5d0fe, fogDensity: 0.004, sunIntensity: 1.5 }),
        build(S) {
            AK.hall(S, { title: 'PAINT WARS', accent: '#38bdf8', ground: 0x334155 });
            const cv = document.createElement('canvas');
            cv.width = PW.cols * 16; cv.height = PW.rows * 16;
            const g = cv.getContext('2d');
            g.fillStyle = '#e5e7eb'; g.fillRect(0, 0, cv.width, cv.height);
            const tex = new THREE.CanvasTexture(cv);
            tex.userData.mgOwned = true;
            const wall = new THREE.Mesh(new THREE.PlaneGeometry(PW.w, PW.h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }));
            wall.position.set(0, PW.cy, PW.z);
            S.add(wall);
            const frame = new THREE.Mesh(new THREE.BoxGeometry(PW.w + 0.6, PW.h + 0.6, 0.3), std(0x1f2937, 0.7));
            frame.position.set(0, PW.cy, PW.z - 0.2); S.add(frame);
            wall.userData.entity = { alive: true, isWall: true }; wall.userData.hitbox = 'torso';
            Object.assign(S.data, { wall, g, tex, owner: new Uint8Array(PW.cols * PW.rows), mine: 0, rival: 0, drones: [], stuns: 0, dirty: false });
            this._drone(S, 0);
        },
        _drone(S, i) {
            const D = S.data;
            const m = A.drone(i ? 'gunship' : 'scout');
            const body = new THREE.Group(); body.add(m.mesh || m); (m.mesh || m).scale.setScalar(2.6);
            const tint = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), basic(0xf472b6)); tint.position.y = -0.3; tint.userData.noHit = true; body.add(tint);
            const tg = S.addTarget({ mesh: body, pos: V(i ? 5 : -5, PW.cy, PW.z + 1.2), life: 0, appear: 'scale', inT: 0.3, bonus: true });
            tg.drone = true; tg.stun = 0; tg.goal = V(0, PW.cy, PW.z + 1.2); tg.sprayT = 0; tg.bombT = 4 + i * 2; tg.speed = 3 + i;
            D.drones.push(tg);
            return tg;
        },
        _paint(S, cx, cy, rad, who) {
            const D = S.data;
            for (let y = cy - rad; y <= cy + rad; y++) for (let x = cx - rad; x <= cx + rad; x++) {
                if (x < 0 || y < 0 || x >= PW.cols || y >= PW.rows) continue;
                if ((x - cx) * (x - cx) + (y - cy) * (y - cy) > rad * rad + 1) continue;
                const k = y * PW.cols + x;
                if (D.owner[k] === who) continue;
                if (D.owner[k] === 1) D.mine--; else if (D.owner[k] === 2) D.rival--;
                D.owner[k] = who;
                if (who === 1) D.mine++; else D.rival++;
                D.g.fillStyle = who === 1 ? MINE : RIVAL;
                D.g.fillRect(x * 16, y * 16, 16, 16);
                D.dirty = true;
            }
        },
        _cell(p) { return [Math.floor((p.x + PW.w / 2) / PW.w * PW.cols), Math.floor((PW.cy + PW.h / 2 - p.y) / PW.h * PW.rows)]; },
        extraTargets(S, pool) { if (S.data.wall) pool.push(S.data.wall); },
        update(S, dt, lib, state) {
            const D = S.data;
            if (D.dirty) { D.tex.needsUpdate = true; D.dirty = false; }
            if (state !== 'running') return;
            if (S.t > 30 && D.drones.length < 2) { this._drone(S, 1); MG.toast('A SECOND DRONE JOINS', '#f9a8d4'); }
            for (const d of D.drones) {
                if (d.stun > 0) { d.stun -= dt; d.pivot.rotation.z = Math.sin(d.stun * 30) * 0.3; continue; }
                d.pivot.rotation.z = 0;
                const p = d.root.position;
                if (p.distanceTo(d.goal) < 0.4) d.goal.set((Math.random() - 0.5) * (PW.w - 2), PW.cy + (Math.random() - 0.5) * (PW.h - 1.5), PW.z + 1.2);
                const step = d.goal.clone().sub(p);
                p.addScaledVector(step.normalize(), Math.min(d.speed * (1 + S.t / 60) * dt, p.distanceTo(d.goal)));
                d.sprayT -= dt;
                if (d.sprayT <= 0) { d.sprayT = 0.12; const [cx, cy] = this._cell(p); this._paint(S, cx, cy, 1, 2); }
                d.bombT -= dt;
                if (d.bombT <= 0) {
                    d.bombT = 6;
                    const [cx, cy] = this._cell(p);
                    setTimeout(() => { if (MG.session === S && MG.state === 'running') { this._paint(S, cx, cy, 3, 2); SFX.noise(0.2, 600, 'lowpass', 0.8, 0.3); } }, 600);
                    MG.popup(p.clone(), 'PAINT BOMB!', '#f472b6');
                }
            }
        },
        onHit(S, ent, info) {
            const D = S.data;
            if (ent.isWall) {
                const [cx, cy] = this._cell(info.pt);
                this._paint(S, cx, cy, 1, 1);
                S.hits++;
                return false;
            }
            if (ent.drone) {
                S.hits++;
                if (ent.stun <= 0) { ent.stun = 2.5; D.stuns++; S.award(150, info.pt, 'STUNNED', '#38bdf8'); SFX.bonk(); }
                return false;
            }
            return false;
        },
        scoreText(S) { return (S.data.mine / (PW.cols * PW.rows) * 100).toFixed(1) + '%'; },
        hud(S) { const D = S.data, N = PW.cols * PW.rows; const a = D.mine / N * 100, b = D.rival / N * 100; return `<div class="ah3-panel"><div class="sr-chip">YOU <b style="color:${MINE}">${a.toFixed(1)}%</b></div><div class="sr-chip">RIVAL <b style="color:${RIVAL}">${b.toFixed(1)}%</b></div>${AK.chip('STUNS', D.stuns)}</div>`; },
        result(S) {
            const D = S.data, N = PW.cols * PW.rows;
            const pct = Math.round(D.mine / N * 100);
            S.score = D.mine * 10 + D.stuns * 150;
            const stars = this.stars.filter((th) => pct >= th).length;
            return { score: S.score, stars, saveExtra: { pct }, title: D.mine > D.rival ? 'WALL CLAIMED' : 'OUT-PAINTED', stats: [['YOUR COVERAGE', pct + '%'], ['RIVAL COVERAGE', Math.round(D.rival / N * 100) + '%'], ['DRONE STUNS', D.stuns], ['SHOTS', S.shots]], noGraph: true, xp: Math.round(120 + pct * 6 + stars * 120) };
        }
    }));

    /* =====================================================================
       15. SAFE CRACKER
    ===================================================================== */
    MG.register(Object.assign({}, ARC, {
        id: 'safe_cracker', order: 15, name: 'Safe Cracker', icon: '🔐', accent: '#a3a3a3',
        tagline: 'Fire when the notch meets the marker.',
        desc: 'A spinning safe dial with a red notch. Shoot the dial at the moment the notch lines up with the gold marker on top to set one number. Each safe needs more numbers, and the dial spins faster, changes direction and speeds up and slows down. Three bad shots trip the alarm and jam the safe. Crack as many as you can in 75 seconds.',
        heroLabel: 'ARCADE HALL • PRECISION TIMING • 75 SECONDS', duration: 75, stars: [1500, 3500, 6500, 10000],
        standardWeapon: 'python_magnum', weaponLabel: 'PYTHON .357', weaponNote: 'One shot every 0.35 s', fireInterval: 0.35,
        keys: [['LMB', 'Set the number (shoot the dial)'], ['R', 'Retry from results']],
        map: AK.map({ skyTop: 0x0c0a09, skyBottom: 0x292524, fogColor: 0x1c1917, fogDensity: 0.02, sunIntensity: 0.6 }),
        build(S) {
            AK.hall(S, { title: 'SAFE CRACKER', accent: '#a3a3a3', ground: 0x1c1917 });
            const safe = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 2), std(0x3f3f46, 0.35, 0.8));
            safe.position.set(0, 2.5, -8);
            S.add(safe); S.solid(safe);
            const door = new THREE.Group();
            door.position.set(-2.1, 2.5, -6.95);
            const plate = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.2, 0.15), std(0x52525b, 0.3, 0.85));
            plate.position.x = 2.1; plate.userData.noHit = true;
            door.add(plate);
            S.add(door);
            const dialTex = L.canvasTex('safe-dial', 256, 256, (g, w, h) => {
                g.fillStyle = '#d4d4d8'; g.beginPath(); g.arc(128, 128, 126, 0, TAU); g.fill();
                g.fillStyle = '#18181b'; g.font = '700 18px Bahnschrift, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
                for (let i = 0; i < 40; i++) {
                    const a = i / 40 * TAU;
                    g.fillRect(128 + Math.sin(a) * 104 - 1, 128 - Math.cos(a) * 104 - (i % 5 ? 4 : 9), 2, i % 5 ? 8 : 18);
                    if (i % 5 === 0) g.fillText(String(i * 2.5 | 0), 128 + Math.sin(a) * 80, 128 - Math.cos(a) * 80);
                }
                g.fillStyle = '#dc2626'; g.beginPath(); g.moveTo(128, 2); g.lineTo(118, 26); g.lineTo(138, 26); g.closePath(); g.fill();
            });
            const dial = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.2, 40), [std(0x71717a, 0.3, 0.8), new THREE.MeshStandardMaterial({ map: dialTex, roughness: 0.4, metalness: 0.4 }), std(0x71717a, 0.3, 0.8)]);
            dial.rotation.x = Math.PI / 2;
            const dialG = new THREE.Group();
            dialG.add(dial);
            dialG.position.set(2.1, 0.2, 0.2);
            door.add(dialG);
            const marker = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 3), basic(0xfacc15));
            marker.rotation.z = Math.PI; marker.position.set(0, 4.95, -6.8); marker.userData.noHit = true;
            S.add(marker);
            const pins = [];
            for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshStandardMaterial({ color: 0x27272a, emissive: 0x000000 })); p.position.set(-1.25 + i * 0.5, 0.55, -6.8); S.add(p); pins.push(p); }
            dial.userData.entity = { alive: true, isDial: true }; dial.userData.hitbox = 'torso';
            Object.assign(S.data, { door, dialG, dial, pins, safeN: 0, cracked: 0, jams: 0, perfect: 0 });
            this._newSafe(S);
        },
        _newSafe(S) {
            const D = S.data;
            const n = D.safeN;
            Object.assign(D, { need: Math.min(6, 3 + Math.floor(n / 2)), set: 0, alarms: 0, ang: Math.random() * TAU, dir: 1, speed: 1.5 + n * 0.35, wobble: n >= 2 ? 0.5 + n * 0.1 : 0, tol: Math.max(0.09, 0.24 - n * 0.025), safeT: 0, opening: 0 });
            D.door.rotation.y = 0;
            D.pins.forEach((p, i) => { p.visible = i < D.need; p.material.emissive.setHex(0); p.material.color.setHex(0x27272a); });
        },
        extraTargets(S, pool) { if (S.data.dial && !S.data.opening) pool.push(S.data.dial); },
        update(S, dt, lib, state) {
            const D = S.data;
            if (D.opening > 0) {
                D.opening -= dt;
                D.door.rotation.y = Math.min(1.6, D.door.rotation.y + dt * 2.5);
                if (D.opening <= 0) { D.safeN++; this._newSafe(S); }
                return;
            }
            if (state !== 'running') return;
            D.safeT += dt;
            const sp = D.speed * (1 + Math.sin(S.t * 2.1) * D.wobble);
            D.ang = wrapA(D.ang + sp * D.dir * dt);
            D.dialG.rotation.z = -D.ang;
        },
        onHit(S, ent, info) {
            const D = S.data;
            if (!ent.isDial || D.opening > 0) return false;
            S.hits++;
            const off = Math.abs(wrapA(D.ang));
            if (off <= D.tol) {
                const perfect = off <= D.tol * 0.35;
                if (perfect) D.perfect++;
                D.pins[D.set].material.emissive.setHex(0x22c55e); D.pins[D.set].material.color.setHex(0x22c55e);
                D.set++;
                S.bumpCombo();
                S.award((perfect ? 200 : 100) * S.comboMult, info.pt, perfect ? 'PERFECT CLICK' : 'CLICK', '#86efac');
                SFX.clack(); SFX.tone(1200, 1200, 0.05, 'square', 0.08);
                D.dir *= -1;
                D.speed *= 1.06;
                D.ang = wrapA(D.ang + Math.PI * (0.5 + Math.random()));
                if (D.set >= D.need) {
                    D.cracked++; S.kills++;
                    const bonus = 500 + D.need * 100 + Math.max(0, Math.round((20 - D.safeT) * 30));
                    S.award(bonus, info.pt.clone().add(V(0, 1, 0)), 'SAFE CRACKED', '#facc15');
                    SFX.fanfare();
                    D.opening = 1.4;
                }
            } else {
                D.alarms++;
                S.breakCombo('BAD TIMING');
                SFX.buzzer();
                MG.flashScreen('rgba(220,38,38,0.2)');
                if (D.alarms >= 3) {
                    D.jams++;
                    S.award(-300, info.pt, 'ALARM — SAFE JAMMED', '#f87171');
                    D.safeN++;
                    this._newSafe(S);
                } else MG.popup(info.pt, `ALARM ${D.alarms} / 3`, '#fca5a5');
            }
            return false;
        },
        hud(S) { const D = S.data; return `<div class="ah3-panel">${AK.chip('SAFE', D.safeN + 1)}${AK.chip('NUMBERS', D.set + ' / ' + D.need)}${AK.chip('ALARM', D.alarms + ' / 3', D.alarms > 0)}${AK.chip('CRACKED', D.cracked)}</div>`; },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return { score: S.score, stars, title: D.cracked >= 6 ? 'MASTER SAFECRACKER' : D.cracked ? 'IN AND OUT' : 'ALARM BELLS', stats: [['SAFES CRACKED', D.cracked], ['SAFES JAMMED', D.jams], ['PERFECT CLICKS', D.perfect], ['BEST STREAK', S.maxCombo]], xp: Math.round(120 + S.score * 0.04 + stars * 120) };
        }
    }));
})(window);
