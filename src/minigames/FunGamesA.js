/* ============================================================================
   BLACKOUT OPS — MINIGAMES: FUN SECTION (Part 1: 1–3)
     1. Skybreak Sling— see SkybreakSling.js
     2. Master Zombie — siege a detailed multi-zone Human Fortress (strict LOS, sniper tower, kiting AI)
     3. Snowboarding  — 5-minute mountain run with unavoidable -> tight-avoid obstacles + Zombie Chasers
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const L = BO.MinigameLib;
    const A = BO.MinigameArt;
    const K = BO.MGCourseKit;
    const F = BO.MGFigures;
    const SR = BO.SpeedRunKit;
    const { B, SFX, std, basic, TAU, clamp01 } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);

    /* =====================================================================
       2. MASTER ZOMBIE — Multi-Zone Bastion Fortress + Strict LOS + Player-Like AI
    ===================================================================== */
    const HUMAN_SPECS = [
        { name: 'SGT. VANCE (HEAVY)', hp: 3120, coat: 0x1e293b, hat: 'helmet', gun: 'rifle', rof: 0.22, magMax: 60, dmg: 16, y: 0, role: 'heavy', wps: [[-3.5, -14], [3.5, -14], [0, -18], [-6, -24]] },
        { name: 'AGENT KESTREL (TOWER SNIPER)', hp: 2160, coat: 0x064e3b, hat: 'cap', gun: 'rifle', rof: 1.25, magMax: 10, dmg: 44, y: 4.3, role: 'sniper', wps: [[10.5, -24], [13.5, -24], [12, -26.5]] },
        { name: 'BREACHER COLE (SHOTGUN)', hp: 2640, coat: 0x7f1d1d, hat: 'beanie', gun: 'rifle', rof: 0.85, magMax: 12, dmg: 30, y: 0, role: 'shotgun', wps: [[-12, -17], [-10, -25], [-4, -27], [-13, -29]] },
        { name: 'MEDIC REED (SUPPORT)', hp: 2320, coat: 0xf8fafc, hat: 'cap', gun: 'pistol', rof: 0.48, magMax: 24, dmg: 18, y: 0, medic: true, role: 'medic', wps: [[2, -26], [-2, -29], [5, -28], [0, -22]] }
    ];

    const LOS_RAY = new THREE.Raycaster();
    function hasLOS(from, to, losMeshes) {
        const dir = to.clone().sub(from);
        const dist = dir.length();
        if (dist < 0.4) return true;
        dir.divideScalar(dist);
        LOS_RAY.set(from, dir);
        LOS_RAY.near = 0.25;
        LOS_RAY.far = Math.max(0.3, dist - 0.35);
        return LOS_RAY.intersectObjects(losMeshes, false).length === 0;
    }

    MG.register({
        id: 'fun_master_zombie', cardImage: 'assets/minigames/fun_master_zombie.webp', cat: 'fun', order: 2, name: 'Master Zombie', icon: '👑', accent: '#22c55e', badge: 'SIEGE',
        tagline: 'Evolve through 3 Bio-Stages, breach Bastion Omega, convert fallen defenders & dismantle the 2-Phase Warden.',
        desc: 'Storm a floodlit military quarantine citadel. Smash the steel Pressure Lock doors, detonate red fuel barrels, destroy automated sentry turrets, collect Biomass to evolve from Alpha Infected to Apex Overlord (Triple Acid Pools + Predator Pounce), convert slain defenders into Infected Soldiers, and defeat the 2-Phase Bastion Warden!',
        heroLabel: 'CITADEL SIEGE • 3-STAGE BIO-EVOLUTION', duration: 300, stars: [2500, 6000, 10500, 16000],
        standardWeapon: 'm1911', lockWeapon: true, blockFire: true, hideViewmodel: true, customMusic: true, weaponNote: 'Bio-Evolution Abilities • Collect green Biomass orbs to evolve!',
        keys: [['LMB', 'Acid Spit (Triple at Stage 2)'], ['RMB / V', 'Dual-Claw Rend'], ['C', 'Predator Pounce Leap'], ['F', 'Spore Rupture AoE'], ['E', 'Mark Defender / Rally Horde'], ['1 / 2 / 3 / 4', 'Horde Summons & Boss Ult']],
        guide: {
            objective: 'Breach the Pressure Lock doors, destroy the bastion defenders and turrets, evolve with Biomass, and destroy the 2-Phase Bastion Warden.',
            tips: [
                'Press [C] to Predator Pounce 14m forward with a landing shockwave. Spit acid at red fuel barrels to nuke defenders!',
                'Collect green Biomass orbs to reach Stage 2 (Triple Acid + Acid Pools) and Stage 3 (Acid Pools heal you & your horde!).',
                'Every defender you kill rises as an Infected Soldier ally! Capture the Inner Yard nest to cut defender healing.'
            ]
        },
        map: {
            atmosphere: { skyTop: 0x070b14, skyBottom: 0x261447, fogColor: 0x161430, fogDensity: 0.0085, sunColor: 0xc084fc, sunIntensity: 1.1, sunPos: [20, 48, 22], hemiSky: 0x7e22ce, hemiGround: 0x1c1917, hemiIntensity: 0.95 },
            boxes: [B(0, -0.5, -10, 110, 1, 110, 'asphalt')],
            spawn: { x: 0, y: 0, z: 18, yaw: 0 }
        },
        build(S) {
            const CS = BO.CourseScenery;
            const wallM = CS.texMat('bunker_stone', 12, 4), darkWallM = CS.texMat('soviet_concrete', 4, 5);
            const woodM = CS.texMat('wood_crate', 4, 2), sandM = CS.texMat('sandbag', 4, 2), metalM = CS.texMat('diamond_plate', 4, 4);
            const losMeshes = [];
            const addOpaque = (x, y, z, w, h, d, m) => {
                const bx = S.box(x, y, z, w, h, d, m, { solid: true });
                losMeshes.push(bx);
                return bx;
            };

            // Highway approach markings & concrete jersey barriers
            for (let rz = 22; rz >= -6; rz -= 5.5) {
                const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 2.4), basic(0xeab308));
                stripe.rotation.x = -Math.PI / 2; stripe.position.set(0, 0.03, rz); S.add(stripe);
            }
            // Detailed 3D Wrecked Armored Humvees as tactical LOS cover!
            for (const [vx, vz, yaw, col] of [[-5.8, 7.5, 0.28, 0x7f1d1d], [6.4, 2.2, -0.35, 0x1e3a5f], [-8.5, -2.5, 0.65, 0x3f4d36]]) {
                const hv = CS.humvee(S.scene, vx, 0, vz, yaw, col, true);
                S.collider(vx - 1.35, 0, vz - 2.2, vx + 1.35, 1.85, vz + 2.2);
                losMeshes.push(hv.blocker, hv.cabin);
            }
            for (const [tx, tz] of [[-13, 12], [13, 12], [-15, 0], [15, 0], [-14, -36], [14, -36]]) S.add(A.torch(S, V(tx, 0, tz), 0xf97316, true));

            // Fortress Perimeter Walls with Textured Stone & Battlements
            addOpaque(-11.5, 2.0, -10, 13, 4.0, 1.3, wallM);
            addOpaque(11.5, 2.0, -10, 13, 4.0, 1.3, wallM);
            addOpaque(-18, 2.0, -14.5, 1.3, 4.0, 9, wallM);
            addOpaque(-18, 2.0, -30.5, 1.3, 4.0, 13, wallM);
            addOpaque(18, 2.0, -14.5, 1.3, 4.0, 9, wallM);
            addOpaque(18, 2.0, -30.5, 1.3, 4.0, 13, wallM);
            addOpaque(0, 2.0, -37, 37, 4.0, 1.3, wallM);

            for (const [cx, cz] of [[-18, -10], [18, -10], [-18, -37], [18, -37]]) {
                addOpaque(cx, 2.7, cz, 3.4, 5.4, 3.4, darkWallM);
            }
            const sign = A.sign('BASTION OMEGA — QUARANTINE CITADEL', 9.2, 1.15, { bg: '#0f172a', color: '#fde047', borderColor: '#ef4444', size: 0.40 });
            sign.position.set(0, 5.4, -9.7); S.add(sign);

            // Inner Tactical Cover: Sculpted Sandbags, Military Crates, Corrugated Quarantine Container & Med-Bay Bunker
            if (BO.MapDetail && BO.MapDetail.buildSandbagProp) {
                S.add(BO.MapDetail.buildSandbagProp({ x: 0, y: 0.72, z: -15, w: 4.6, h: 1.44, d: 1.1 }));
                const sbCol = S.box(0, 0.72, -15, 4.5, 1.4, 1.0, L.HIDDEN_MAT, { solid: true });
                losMeshes.push(sbCol);
            } else {
                addOpaque(0, 0.75, -15, 4.4, 1.5, 1.1, sandM);
            }
            const cont = CS.cargoContainer(S, -10.5, 0, -21, 3.2, 2.6, 6.4, 'olive', 0);
            losMeshes.push(cont.body);
            if (BO.MapDetail && BO.MapDetail.buildCrateProp) {
                S.add(BO.MapDetail.buildCrateProp({ x: 0, y: 0.9, z: -25, w: 2.8, h: 1.8, d: 2.8 }));
                const crCol = S.box(0, 0.9, -25, 2.8, 1.8, 2.8, L.HIDDEN_MAT, { solid: true });
                losMeshes.push(crCol);
            } else {
                addOpaque(0, 0.9, -25, 3.0, 1.8, 3.0, woodM);
            }
            addOpaque(-11.5, 1.5, -31.5, 5.8, 3.0, 4.6, CS.texMat('lab_panel', 6, 3));
            const medSign = A.sign('MED BAY + TRIAGE', 3.8, 0.65, { bg: '#991b1b', color: '#ffffff', borderColor: '#ffffff', size: 0.42 });
            medSign.position.set(-11.5, 3.3, -29.1); S.add(medSign);

            // Sniper Watchtower with Diamond-Plate Deck & Steel Struts
            for (const [px, pz] of [[9.5, -22.5], [14.5, -22.5], [9.5, -27.5], [14.5, -27.5]]) {
                addOpaque(px, 2.1, pz, 0.65, 4.2, 0.65, metalM);
            }
            addOpaque(12, 4.1, -25, 6.2, 0.45, 6.2, CS.texMat('wood_plank', 6, 6));
            const twRoof = new THREE.Mesh(new THREE.ConeGeometry(4.8, 1.8, 4), darkWallM);
            twRoof.rotation.y = Math.PI / 4; twRoof.position.set(12, 7.6, -25); S.add(twRoof);
            addOpaque(12, 4.85, -22.05, 6.0, 1.0, 0.35, sandM);
            const twSign = A.sign('SNIPER WATCHTOWER', 4.6, 0.6, { bg: '#064e3b', color: '#a7f3d0', borderColor: '#10b981', size: 0.42 });
            twSign.position.set(12, 6.5, -22.0); S.add(twSign);

            S.spawned = HUMAN_SPECS.length + 1;
            BO.BastionWarden.build(S, losMeshes);
            if (BO.MinigameAudio) BO.MinigameAudio.start('siege');
            S.data.nests = [[-3, 5, 'Motor pool'], [5, -18, 'Inner yard']].map(([x, z, name]) => {
                const root = new THREE.Group();
                root.position.set(x, 0.08, z);
                const rim = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.07, 6, 36), basic(0xdbad62).clone());
                rim.rotation.x = Math.PI / 2; root.add(rim);
                const buds = new THREE.Group();
                for (let i = 0; i < 7; i++) {
                    const a = i * TAU / 7;
                    const bud = new THREE.Mesh(new THREE.IcosahedronGeometry(0.31, 0), std(0x706299, 0.42));
                    bud.position.set(Math.cos(a) * 2.2, 0.25, Math.sin(a) * 2.2);
                    bud.scale.y = 1.8; buds.add(bud);
                }
                root.add(buds); S.add(root);
                return { root, rim, buds, name, fill: 0, captured: false };
            });
            S.data.mark = null; S.data.markTime = 0;
            const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.24), basic(0xffba68));
            marker.visible = false; S.add(marker); S.data.marker = marker;
            S.data.losMeshes = losMeshes;
            S.data.humans = HUMAN_SPECS.map((hs, i) => {
                const fig = F.human({ shirt: hs.coat, pants: 0x111827, hat: hs.hat, hatColor: hs.coat, gun: hs.gun, eyes: 'angry' });
                // Extra loaded gear props (backpack + tactical shoulder pads)
                const pack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.44, 0.18), std(0x1e293b, 0.7));
                pack.position.set(0, 1.15, -0.22); fig.root.add(pack);
                const plate = new THREE.Group();
                const rail = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.13, 0.055), std(0x172327, 0.7));
                const vitality = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.075, 0.062), basic([0xe4b575,0x8fd8ed,0xed8778,0x8ce5bb][i]));
                plate.position.y = 2.2; plate.add(rail, vitality); fig.root.add(plate);
                const startWp = hs.wps[0];
                const tg = S.addTarget({ mesh: fig.root, hitMeshes: [], pos: V(startWp[0], hs.y, startWp[1]), life: 0, appear: 'none', inT: 0.01, death: 'knock', deathColor: 0xef4444, bonus: true });
                return Object.assign(tg, { spec: hs, fig, plate, vitality, hp: Math.round(hs.hp * 0.55), maxHp: Math.round(hs.hp * 0.55), mag: hs.magMax, reloadT: 0, fireCd: 0.8 + i * 0.3, healCd: 5.0, nadeCd: 6.0 + i * 2.0, smokeDropped: false, wpIdx: 0, walkPh: i * 1.4, strafeSign: i % 2 ? 1 : -1 });
            });
            S.data.allies = [];
            S.data.acid = [];
            S.data.nades = [];
            S.data.zid = 1;
            // All special moves start ON COOLDOWN, and all cooldown timers are DOUBLED!
            Object.assign(S.data, { cdAcid: 2.0, cdMelee: 1.1, cd5: 30, cdUnc: 30, cdSpd: 80, spdActive: 0, ult: 0, autoComT: 10, autoUncT: 25, humansLeft: 4 });
            BO.Player.maxHp = 320; BO.Player.hp = 320;
        },
        _spawnAlly(S, kindId, x, z, isBoss = false) {
            const spec = BO.ZombiesData.get(kindId);
            const ent = new BO.ZombieEntity({ id: S.data.zid++, spec, round: 10, hp: isBoss ? 1800 : spec.hp * 1.5, speed: spec.speed * 1.25, damage: isBoss ? 70 : Math.max(26, spec.attack), x, y: 0, z, splitCount: 0, hasGun: false, sizeMult: isBoss ? 1.35 : 1.0 });
            ent.allyTeam = true; S.data.allies.push(ent); return ent;
        },
        _reinforce(S, kind) {
            const nest = S.data.nests[1].captured ? S.data.nests[1] : S.data.nests[0];
            const pos = nest.captured ? nest.root.position : { x: 0, z: 12 };
            this._spawnAlly(S, kind, pos.x + (S.rng() - 0.5) * 2, pos.z);
        },
        _summon5(S) {
            if (S.data.cd5 > 0) return false;
            S.data.cd5 = 30; const P = BO.Player;
            for (let i = 0; i < 5; i++) this._spawnAlly(S, 'shambler', P.pos.x + (i - 2) * 1.2, P.pos.z - 2.0);
            MG.toast('HORDE: 5 ZOMBIES SPAWNED!', '#4ade80'); SFX.crowd(0.25); return true;
        },
        _summonUncommon(S) {
            if (S.data.cdUnc > 0) return false;
            S.data.cdUnc = 30;
            const pool = ['sprinter', 'hopper', 'one_arm_ripper', 'bloater', 'headless_charger'];
            const pick = pool[Math.floor(Math.random() * pool.length)];
            this._spawnAlly(S, pick, BO.Player.pos.x, BO.Player.pos.z - 2.2);
            MG.toast('UNCOMMON: ' + pick.replace(/_/g, ' ').toUpperCase(), '#38bdf8'); SFX.ding(1.1); return true;
        },
        _speedBoost(S) {
            if (S.data.cdSpd > 0) return false;
            S.data.cdSpd = 80; S.data.spdActive = 10;
            MG.toast('+50% SPEED FRENZY (10s)!', '#facc15'); SFX.whoosh(0.28); return true;
        },
        _summonBoss(S) {
            if (S.data.ult < 100) { MG.toast('ULT NOT READY (' + Math.floor(S.data.ult) + '%)', '#cbd5e1'); return false; }
            S.data.ult = 0;
            this._spawnAlly(S, 'club_goliath', BO.Player.pos.x, BO.Player.pos.z - 2.6, true);
            MG.toast('EPIC BOSS SUMMONED!', '#c084fc'); SFX.rumble(0.7); return true;
        },
        onKey(S, code) {
            if (MG.state !== 'running') return false;
            if (code === 'KeyF') { BO.BastionWarden.slam(S, this); return true; }
            if (code === 'KeyC') return BO.BastionWarden.pounce(S, this);
            if (code === 'KeyE') {
                const eye = BO.App.worldCamera.position, facing = BO.App.worldCamera.getWorldDirection(V());
                let best = 0.90, chosen = null;
                for (const h of S.data.humans) {
                    if (!h.alive) continue;
                    const chest = h.root.position.clone().add(V(0, 1.2, 0));
                    const alignment = chest.clone().sub(eye).normalize().dot(facing);
                    if (alignment > best && hasLOS(eye, chest, S.data.losMeshes)) { best = alignment; chosen = h; }
                }
                if (chosen) {
                    S.data.mark = chosen; S.data.markTime = 8;
                    if (BO.MinigameAudio) BO.MinigameAudio.hordeRoar();
                    MG.toast('HORDE FOCUS (+35% DMG): ' + chosen.spec.name, '#ffc685');
                } else {
                    // Rally nearby allies and heal them slightly!
                    for (const al of S.data.allies) if (al.alive) al.hp = Math.min(al.maxHp, al.hp + 35);
                    if (BO.MinigameAudio) BO.MinigameAudio.hordeRoar();
                    MG.toast('HORDE RALLIED & HEALED!', '#86efac');
                }
                return true;
            }
            if (code === 'Digit1') return this._summon5(S);
            if (code === 'Digit2') return this._summonUncommon(S);
            if (code === 'Digit3') return this._speedBoost(S);
            if (code === 'Digit4' || code === 'KeyQ') return this._summonBoss(S);
            if (code === 'KeyV') return this._clawMelee(S);
            return false;
        },
        _clawMelee(S) {
            if (S.data.cdMelee > 0) return false;
            S.data.cdMelee = 1.0; S.data.siege.handBeat = 1;
            const P = BO.Player, fwd = P.getMoveDirectionVectors().forward, evo = S.data.siege.evoStage || 1;
            const range = evo >= 3 ? 6.0 : 4.8, dmg = evo >= 3 ? 155 : evo >= 2 ? 125 : 105;
            BO.FX.spawnParticles(P.pos.clone().addScaledVector(fwd, 2.2).add(V(0, 1.2, 0)), evo >= 3 ? 22 : 14, 0x4ade80, 5.5, 2, 0.35, 1.1);
            if (BO.MinigameAudio) BO.MinigameAudio.clawRend(); else SFX.thunk();
            BO.BastionWarden.damage(S, dmg + 15, P.pos.clone().addScaledVector(fwd, 2.2), range * 0.85, this);
            for (const h of S.data.humans) {
                if (h.alive && h.root.position.distanceTo(P.pos) <= range) this._damageHuman(S, h, dmg, evo >= 3 ? 'APEX CLEAVE!' : 'CLAW SLASH!');
            }
            return true;
        },
        _damageHuman(S, h, dmg, tag) {
            if (!h.alive) return;
            if (S.data.mark === h) dmg = Math.round(dmg * 1.35);
            dmg = Math.min(h.hp, dmg); h.hp -= dmg;
            S.data.ult = Math.min(100, S.data.ult + (S.data.siege.evoStage >= 3 ? 14 : 10));
            S.award(Math.round(dmg * 1.5), h.root.position.clone().add(V(0, 1.8, 0)), tag || null, '#86efac');
            if (h.hp <= 0) {
                const pos = h.root.position.clone();
                h.kill({ pt: pos.clone().add(V(0, 1.2, 0)) });
                S.data.humansLeft--; S.kills++; S.bumpCombo(); S.data.ult = Math.min(100, S.data.ult + 28);
                BO.BastionWarden.dropBiomass(S, pos, 3);
                // Infected Conversion: slain defender rises as an Infected Soldier ally!
                this._spawnAlly(S, 'armored_brute', pos.x, pos.z);
                MG.toast(`${h.spec.name} INFECTED & CONVERTED TO YOUR HORDE!`, '#86efac');
                if (S.data.humansLeft <= 0) BO.BastionWarden.wake(S);
            }
        },
        update(S, dt, lib, state) {
            const D = S.data, P = BO.Player;
            BO.BastionWarden.update(S, dt, state, this);
            if (state !== 'running') return;
            D.cdAcid = Math.max(0, D.cdAcid - dt); D.cdMelee = Math.max(0, D.cdMelee - dt);
            D.cd5 = Math.max(0, D.cd5 - dt); D.cdUnc = Math.max(0, D.cdUnc - dt); D.cdSpd = Math.max(0, D.cdSpd - dt);
            if (!P.alive) { MG.finish('MASTER ZOMBIE DEFEATED', { color: '#f87171' }); return; }

            for (const nest of D.nests) {
                const inside = P.pos.distanceToSquared(nest.root.position) < 5.1;
                if (!nest.captured) {
                    nest.fill = BO.Math.clamp(nest.fill + dt * (inside ? 1 : -0.6), 0, 3);
                    nest.buds.scale.y = 1 + nest.fill * 0.5;
                    if (nest.fill >= 3) {
                        nest.captured = true; MG.toast(nest.name + (nest === D.nests[1] ? ' captured • medical supply cut' : ' captured • forward spawn active'), '#84ffb0'); nest.rim.material.color.setHex(0x84ffb0);
                        P.hp = Math.min(P.maxHp, P.hp + 70); S.award(600, nest.root.position, 'NEST ROOTED');
                        BO.BastionWarden.dropBiomass(S, nest.root.position, 2);
                        SFX.star(2); BO.FX.spawnParticles(nest.root.position, 18, 0x84ffb0, 4, 2, 0.7, 1);
                    }
                }
                nest.buds.rotation.y += dt * (nest.captured ? 0.28 : 0.08);
            }
            D.markTime = Math.max(0, D.markTime - dt);
            if (!D.markTime || !D.mark?.alive) D.mark = null;
            D.marker.visible = !!D.mark;
            if (D.mark) {
                D.marker.position.copy(D.mark.root.position); D.marker.position.y += 2.5 + Math.sin(S.t * 5) * 0.1;
                D.marker.rotation.y += dt * 3;
            }
            if (D.spdActive > 0) {
                D.spdActive -= dt;
                if (Math.hypot(P.vel.x, P.vel.z) > 0.5) { P.pos.x += P.vel.x * 0.5 * dt; P.pos.z += P.vel.z * 0.5 * dt; }
            }
            D.ult = Math.min(100, D.ult + dt * 1.8);
            D.autoComT -= dt;
            if (D.autoComT <= 0) { D.autoComT = 10; this._reinforce(S, 'shambler'); MG.toast('AUTO HORDE: +1 ZOMBIE', '#86efac'); }
            D.autoUncT -= dt;
            if (D.autoUncT <= 0) { D.autoUncT = 25; this._reinforce(S, S.rng() < 0.5 ? 'sprinter' : 'hopper'); MG.toast('AUTO HORDE: +1 UNCOMMON', '#38bdf8'); }

            if (P.triggerHeld && !D._lmb && D.cdAcid <= 0) {
                D._lmb = true; D.cdAcid = 0.85; D.siege.handBeat = 0.85;
                const cam = BO.App.worldCamera, baseDir = new THREE.Vector3(); cam.getWorldDirection(baseDir);
                const spreads = D.siege.evoStage >= 2 ? [-0.08, 0, 0.08] : [0];
                for (const ang of spreads) {
                    const dir = baseDir.clone().applyAxisAngle(V(0, 1, 0), ang);
                    const m = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), basic(0x4ade80));
                    m.position.copy(cam.position).addScaledVector(dir, 0.9); S.add(m);
                    D.acid.push({ mesh: m, prev: m.position.clone(), vel: dir.multiplyScalar(29).add(V(0, 1.5, 0)), life: 3.0 });
                }
                if (BO.MinigameAudio) BO.MinigameAudio.acidSpit(); else SFX.pop();
            } else if (!P.triggerHeld) D._lmb = false;
            if (P.adsHeld && !D._rmb) { D._rmb = true; this._clawMelee(S); } else if (!P.adsHeld) D._rmb = false;

            for (let i = D.acid.length - 1; i >= 0; i--) {
                const ac = D.acid[i];
                ac.prev.copy(ac.mesh.position);
                ac.life -= dt; ac.vel.y -= 9.8 * dt;
                ac.mesh.position.addScaledVector(ac.vel, dt);
                const w = D.siege, pos = ac.mesh.position;
                const lockHit = !w.gateOpen && Math.abs(pos.z + 9.4) < 0.88 && Math.abs(pos.x) < 4.8 && pos.y < 3.5;
                const engineHit = w.awake && Math.hypot(pos.x - w.root.position.x, pos.z - w.root.position.z) < 2.6 && pos.y < 4.8;
                const barrelHit = w.barrels.some((b) => b.alive && Math.hypot(pos.x - b.x, pos.z - b.z) < 0.9 && pos.y < 1.3);
                const turretHit = w.turrets.some((t) => t.alive && Math.hypot(pos.x - t.x, pos.z - t.z) < 0.9 && pos.y < 1.6);
                let hit = lockHit || engineHit || barrelHit || turretHit || ac.mesh.position.y <= 0.15 || !hasLOS(ac.prev, ac.mesh.position, D.losMeshes);
                if (!hit) for (const h of D.humans) if (h.alive && h.root.position.clone().add(V(0, 1.1, 0)).distanceTo(ac.mesh.position) < 1.25) { hit = true; break; }
                if (hit || ac.life <= 0) {
                    BO.FX.spawnExplosion(ac.mesh.position.clone(), 3.2, 0x4ade80);
                    if (BO.MinigameAudio) BO.MinigameAudio.acidSplash(); else SFX.pop();
                    if (w.evoStage >= 2 && ac.mesh.position.y <= 0.6) BO.BastionWarden.spawnAcidPool(S, ac.mesh.position);
                    BO.BastionWarden.damage(S, 108, ac.mesh.position, 3.7, this);
                    for (const h of D.humans) if (h.alive && h.root.position.distanceTo(ac.mesh.position) < 3.7) this._damageHuman(S, h, 80, 'ACID BURN!');
                    S.scene.remove(ac.mesh); D.acid.splice(i, 1);
                }
            }

            // Defender Grenades & Tactical Explosives
            for (let i = D.nades.length - 1; i >= 0; i--) {
                const nd = D.nades[i]; nd.life -= dt;
                const warning = 1 + 0.45 * (0.5 + 0.5 * Math.sin(nd.life * (nd.life < 0.55 ? 28 : 13)));
                nd.mesh.scale.setScalar(warning); nd.vel.y -= 14 * dt; nd.mesh.position.addScaledVector(nd.vel, dt);
                if (nd.mesh.position.y <= 0.15) { nd.mesh.position.y = 0.15; nd.vel.y *= -0.35; nd.vel.x *= 0.6; nd.vel.z *= 0.6; }
                if (nd.life <= 0) {
                    const ep = nd.mesh.position.clone();
                    BO.FX.spawnExplosion(ep, 4.2, nd.col); SFX.rumble(0.45);
                    if (P.pos.distanceTo(ep) < 4.5) P.takeDamage(nd.dmg, ep, false);
                    for (const al of D.allies) if (al.alive && al.pos.distanceTo(ep) < 4.5) al.takeDamage(nd.dmg * 2, 'torso', false, null, 'blast');
                    S.scene.remove(nd.mesh); D.nades.splice(i, 1);
                }
            }

            for (const h of D.humans) {
                if (!h.alive) continue;
                const fraction = Math.max(0, h.hp / h.maxHp);
                h.vitality.scale.x = fraction; h.vitality.position.x = (fraction - 1) * 0.64;
                const camera = BO.App.worldCamera.position;
                h.plate.rotation.y = Math.atan2(camera.x - h.root.position.x, camera.z - h.root.position.z) - h.root.rotation.y;
                if (h.spec.medic && !D.nests[1].captured) {
                    h.healCd -= dt;
                    if (h.healCd <= 0) {
                        h.healCd = 5.0;
                        for (const o of D.humans) if (o.alive && o.hp < o.maxHp) {
                            o.hp = Math.min(o.maxHp, o.hp + 140);
                            BO.FX.spawnTracer(h.root.position.clone().add(V(0, 1.3, 0)), o.root.position.clone().add(V(0, 1.3, 0)), 0x4ade80, 0.05, 0.16);
                        }
                    }
                    if (!h.smokeDropped && h.hp < h.maxHp * 0.5) {
                        h.smokeDropped = true;
                        BO.FX.spawnParticles(h.root.position.clone().add(V(0, 1.2, 0)), 22, 0xe2e8f0, 4, 1, 1.2, 1.8);
                    }
                }
                const eye = h.root.position.clone().add(V(0, 1.45, 0));
                let visibleTgt = null, visibleEnt = null, bestD = 38;
                const pEye = P.pos.clone().add(V(0, 1.2, 0));
                const pd = eye.distanceTo(pEye);
                if (pd < bestD && hasLOS(eye, pEye, D.losMeshes)) { bestD = pd; visibleTgt = pEye; visibleEnt = null; }
                for (const al of D.allies) {
                    if (!al.alive) continue;
                    const aEye = al.pos.clone().add(V(0, 1.1, 0));
                    const ad = eye.distanceTo(aEye);
                    if (ad < bestD && hasLOS(eye, aEye, D.losMeshes)) { bestD = ad; visibleTgt = aEye; visibleEnt = al; }
                }

                let moving = false;
                if (h.spec.y < 1) {
                    if (visibleTgt && bestD < 6.5) {
                        const away = h.root.position.clone().sub(visibleTgt); away.y = 0; away.normalize();
                        const lat = V(-away.z * h.strafeSign, 0, away.x * h.strafeSign).multiplyScalar(0.5);
                        const step = away.add(lat).normalize().multiplyScalar(3.6 * dt);
                        h.root.position.x = BO.Math.clamp(h.root.position.x + step.x, -16, 16);
                        h.root.position.z = BO.Math.clamp(h.root.position.z + step.z, -35, -12);
                        moving = true;
                    } else {
                        const wp = h.spec.wps[h.wpIdx];
                        const dx = wp[0] - h.root.position.x, dz = wp[1] - h.root.position.z;
                        const wd = Math.hypot(dx, dz);
                        if (wd > 0.5) {
                            h.root.position.x += (dx / wd) * 2.5 * dt;
                            h.root.position.z += (dz / wd) * 2.5 * dt;
                            moving = true;
                            if (!visibleTgt) h.root.rotation.y = Math.atan2(dx, dz);
                        } else { h.wpIdx = (h.wpIdx + 1) % h.spec.wps.length; }
                    }
                } else {
                    const wp = h.spec.wps[h.wpIdx];
                    const dx = wp[0] - h.root.position.x, dz = wp[1] - h.root.position.z, wd = Math.hypot(dx, dz);
                    if (wd > 0.35) { h.root.position.x += (dx / wd) * 1.9 * dt; h.root.position.z += (dz / wd) * 1.9 * dt; moving = true; }
                    else h.wpIdx = (h.wpIdx + 1) % h.spec.wps.length;
                }

                if (moving) { h.walkPh += dt * 8; F.walk(h.fig, h.walkPh, 1, !!visibleTgt); }
                if (visibleTgt) {
                    h.root.rotation.y = Math.atan2(visibleTgt.x - h.root.position.x, visibleTgt.z - h.root.position.z);
                    F.pose(h.fig, 'aim');
                    // Fully loaded tactical grenades / equipment from custom loadouts!
                    h.nadeCd -= dt;
                    if (h.nadeCd <= 0 && h.spec.role !== 'medic' && bestD < 28) {
                        h.nadeCd = h.spec.role === 'heavy' ? 9.0 : h.spec.role === 'shotgun' ? 10.0 : 11.5;
                        const ndCol = h.spec.role === 'shotgun' ? 0xf97316 : h.spec.role === 'sniper' ? 0x38bdf8 : 0xef4444;
                        const nm = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), basic(ndCol));
                        nm.position.copy(eye); S.add(nm);
                        const arc = visibleTgt.clone().sub(eye).multiplyScalar(0.85).add(V(0, 6.2, 0));
                        D.nades.push({ mesh: nm, vel: arc, life: 1.5, dmg: h.spec.role === 'heavy' ? 28 : 20, col: ndCol });
                    }
                    if (h.reloadT > 0) { h.reloadT -= dt; if (h.reloadT <= 0) h.mag = h.spec.magMax; }
                    else {
                        h.fireCd -= dt;
                        if (h.fireCd <= 0) {
                            h.fireCd = (h.spec.role === 'sniper' && bestD < 8) ? 0.35 : h.spec.rof;
                            h.mag--; if (h.mag <= 0) h.reloadT = 1.8;
                            if (h.spec.role === 'shotgun') {
                                for (let p = 0; p < 4; p++) {
                                    const sp = visibleTgt.clone().add(V((Math.random() - 0.5) * 1.4, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 1.4));
                                    BO.FX.spawnTracer(eye, sp, 0xfb923c, 0.025, 0.08);
                                }
                            } else {
                                BO.FX.spawnTracer(eye, visibleTgt, h.spec.role === 'sniper' ? 0x38bdf8 : 0xfacc15, h.spec.role === 'sniper' ? 0.05 : 0.03, 0.09);
                            }
                            SFX.noise(0.07, 1200, 'bandpass', 1, 0.16);
                            if (!visibleEnt) P.takeDamage(h.spec.dmg, h.root.position, false);
                            else visibleEnt.takeDamage(h.spec.dmg * 1.4, 'torso', false, null, 'bullet');
                        }
                    }
                }
            }

            for (let i = D.allies.length - 1; i >= 0; i--) {
                const z = D.allies[i];
                let nearest = null, nd = Infinity;
                if (D.siege.gateOpen) {
                    for (const h of D.humans) {
                        if (!h.alive) continue;
                        const d = z.pos.distanceTo(h.root.position);
                        if (d < nd) { nd = d; nearest = h; }
                    }
                    if (D.mark && D.mark.alive) nearest = D.mark;
                }
                const gateLock = !D.siege.gateOpen ? D.siege.doors.find((d) => d.hp > 0) : null;
                const keep = z.update(dt, D.allies, {
                    allowProjectiles: false,
                    getTarget: () => gateLock
                        ? { x: gateLock.side * 2.35, y: 0, z: -9.15, attackRange: 2.2 }
                        : nearest
                            ? { x: nearest.root.position.x, y: 0, z: nearest.root.position.z, attackRange: 2.3 }
                            : D.siege.awake ? { x: D.siege.root.position.x, y: 0, z: D.siege.root.position.z, attackRange: 3.2 } : null,
                    onAttackCustomTarget: (zz) => {
                        if (gateLock) BO.BastionWarden.damage(S, 60, V(gateLock.side * 2.35, 1.2, -9.35), 1.8);
                        else if (nearest && nearest.alive) this._damageHuman(S, nearest, Math.max(14, zz.damage * 0.6));
                        else if (D.siege.awake) BO.BastionWarden.damage(S, zz.damage * 0.45, zz.pos, 4);
                    },
                    onMeleePlayer: () => {}
                });
                if (!keep) { z.destroy(); D.allies.splice(i, 1); }
            }
        },
        result(S) {
            const d = S.data, stars = S.def.stars.filter(n => S.score >= n).length;
            return { score: S.score, stars, xp: 120 + Math.round(S.score * 0.06) + stars * 150,
                title: d.siege.hp <= 0 ? 'BASTION OVERRUN' : 'SIEGE REPORT',
                stats: [['DEFENDERS DEFEATED', (4 - d.humansLeft) + '/4'], ['NESTS ROOTED', d.nests.filter(n => n.captured).length + '/2'],
                    ['REINFORCEMENTS', d.zid - 1], ['WARDEN INTEGRITY', Math.ceil(d.siege.hp/d.siege.maxHp*100)+'%']] };
        },
        dispose(S) {
            for (const z of S.data.allies || []) z.destroy();
            S.data.allies = [];
            if (BO.MinigameAudio) BO.MinigameAudio.stop();
        },
        hud(S) {
            const D = S.data;
            const rooting = D.nests.find(n => n.fill > 0 && !n.captured);
            const sk = (k, lbl, cd, readyTxt) => `<div class="fun-sk ${cd <= 0 ? 'ready' : ''}"><b>[${k}] ${lbl}</b><small>${cd <= 0 ? readyTxt : cd.toFixed(1) + 's'}</small></div>`;
            const siege = D.siege;
            const evoNames = ['', 'STAGE 1 ALPHA', 'STAGE 2 TYRANT', 'STAGE 3 APEX'];
            const wardenPct = Math.max(0, Math.ceil((100 * siege.hp) / siege.maxHp));
            const mission = !siege.gateOpen ? 'BREACH • Shatter both green pressure locks' : siege.awake ? (siege.attack === 'recover' ? 'WARDEN CORE EXPOSED • STRIKE NOW!' : (siege.phase2 ? 'WARDEN OVERCLOCKED • ' : 'WARDEN ONLINE • ') + siege.attack.toUpperCase()) : 'INNER YARD • Eliminate defenders & turrets';
            const wardenBar = siege.awake && siege.hp > 0 ? `<div class="fun-panel"><div class="fun-bar-wrap"><div class="fun-bar-lbl"><span>BASTION WARDEN ${siege.phase2 ? '• PHASE 2' : ''} ${siege.attack === 'recover' ? '• EXPOSED 1.9x' : ''}</span><b>${siege.hp} / ${siege.maxHp} (${wardenPct}%)</b></div><div class="fun-bar"><i style="width:${wardenPct}%;background:${siege.attack === 'recover' ? 'linear-gradient(90deg,#84cc16,#fde047)' : siege.phase2 ? 'linear-gradient(90deg,#0284c7,#38bdf8)' : 'linear-gradient(90deg,#ea580c,#fbbf24)'}"></i></div></div></div>` : '';
            return `<div class="course-console siege-console"><strong>${mission}</strong><span><b>${evoNames[siege.evoStage || 1]}</b> (${siege.biomass} BIO)</span><span>[C] POUNCE <b>${siege.pounceCd > 0 ? siege.pounceCd.toFixed(1) + 's' : 'READY'}</b></span><span>[F] RUPTURE <b>${siege.slamCd > 0 ? siege.slamCd.toFixed(1) + 's' : 'READY'}</b></span><span>HORDE <b>${D.allies.filter((a) => a.alive).length}</b></span></div>${wardenBar}<div class="fun-panel"><div class="mgx-chip">DEFENDERS <b>${D.humansLeft} / 4</b></div><div class="mgx-chip">TURRETS <b>${siege.turrets.filter((t) => t.alive).length}/2</b></div><div class="mgx-chip">NESTS <b>${D.nests.filter((n) => n.captured).length}/2</b></div><div class="mgx-chip">${rooting ? 'ROOTING ' + Math.floor(rooting.fill / 3 * 100) + '%' : D.mark ? 'MARKED ' + Math.ceil(D.markTime) + 's' : '[E] MARK / RALLY'}</div></div>
                <div class="fun-skills">
                    ${sk('LMB', siege.evoStage >= 2 ? 'TRIPLE ACID' : 'ACID', D.cdAcid, 'READY')}
                    ${sk('RMB/V', siege.evoStage >= 3 ? 'APEX CLAWS' : 'CLAWS', D.cdMelee, 'READY')}
                    ${sk('1', '5 ZOMBIES', D.cd5, 'SPAWN')}
                    ${sk('2', 'UNCOMMON', D.cdUnc, 'SPAWN')}
                    ${sk('3', '+50% SPD', D.cdSpd, D.spdActive > 0 ? 'ACTIVE!' : 'FRENZY')}
                    <div class="fun-sk ${D.ult >= 100 ? 'ready' : ''}"><b>[4/Q] EPIC BOSS</b><small>${D.ult >= 100 ? 'SUMMON!' : Math.floor(D.ult) + '%'}</small></div>
                </div>`;
        }
    });

    /* =====================================================================
       3. SNOWBOARDING — Summit Rally Boardercross & Alpine Endurance
    ===================================================================== */
    const SNOW_LEN = 7400; // ~5 minutes at 16..33 m/s
    MG.register({
        id: 'fun_snowboarding', cardImage: 'assets/minigames/fun_snowboarding.webp', cat: 'fun', order: 3, name: 'Snowboarding', icon: '🏂', accent: '#38bdf8', badge: 'BOARDERCROSS',
        tagline: 'Race rivals down Peak 9 Resort. Chain Indy/Backflip/Uber tricks, rail transfers & slipstream boost!',
        desc: 'Two alpine events in one: race three rival riders down the 1.84 km Summit Rally resort circuit (timber chalets, Crystal Ice Cavern, copper rail transfers, gold big-air kickers, Indy/Backflip/Superman Uber Tricks, slipstream drafting & avalanche finale), or tackle the 7.4 km Alpine Endurance obstacle run!',
        hubOptions: [{ key:'snowCourse', label:'EVENT', default:'rally', choices:[
            {val:'rally',label:'Summit Rally',desc:'1.84 km Boardercross: W/S tuck/brake, A/D carve, Space jump, E+WASD grabs & flips, Q Superman Uber, F boost, C camera.'},
            {val:'endurance',label:'Alpine Endurance',desc:'Classic 7.4 km obstacle run with ice walls, random hazards and zombie chasers.'}] }],
        variantKey: o => o.snowCourse === 'endurance' ? '' : 'rally',
        variantLabel: o => o.snowCourse === 'endurance' ? 'ALPINE ENDURANCE' : 'SUMMIT RALLY',
        starsFor: o => o.snowCourse === 'endurance' ? [4500,10000,16500,24000] : [1800,4300,6800,9500],
        hideViewmodel: S => !!S.data.rally, blockFire: S => !!S.data.rally, customMusic: true,
        heroLabel: 'BOARDERCROSS • TWO EVENTS', duration: 0, stars: [4500, 10000, 16500, 24000],
        standardWeapon: 'mp7_navy', lockWeapon: true, infiniteMag: true, weaponLabel: 'SUMMIT BOARD / MP7', weaponNote: 'Rally: [E+WASD] Spins/Flips • [Q] Uber Trick • [F] Nitro | Endurance: [LMB] Shoot Ice',
        keys: [['W / S', 'Tuck / Flip'], ['A / D', 'Carve / Spin'], ['SPACE', 'Jump / Rail Pop'], ['Hold & Release E', 'Indy / Method / Flip'], ['Q (Mid-Air)', 'Superman Uber (45% Boost)'], ['F / C', 'Nitro Boost / Camera']],
        dispose(S) { if (BO.MinigameAudio) BO.MinigameAudio.stop(); },
        guide: {
            objective: 'In Summit Rally, race three riders to the finish. Tuck with W, brake with S and use F to spend 35 boost. Approach a rail head-on to grind. C switches cameras. Alpine Endurance uses the original five-zone obstacle course.',
            tips: [
                'Red floor chevrons = JUMP [SPACE] over spike traps; Yellow = SLIDE [C] under timber beams; Blue = SHOOT ice walls.',
                'Watch between main obstacles for RANDOM TRAPS: carve around lateral Rolling Snowballs, Falling Icicles (cyan rings), and Frost Geysers!',
                'Thread consecutive blue gates for a growing bonus. Hold E while airborne, then release before landing to bank a grab.'
            ]
        },
        blockKeys: ['KeyW', 'KeyS', 'Space', 'KeyC', 'ControlLeft'],
        map: {
            atmosphere: { skyTop: 0x0369a1, skyBottom: 0xe0f2fe, fogColor: 0xbae6fd, fogDensity: 0.0042, sunColor: 0xffffff, sunIntensity: 1.8, sunPos: [40, 80, -100], hemiSky: 0xe0f2fe, hemiGround: 0x64748b, hemiIntensity: 0.95 },
            boxes: [B(0, -0.5, -SNOW_LEN * 0.5, 180, 1, SNOW_LEN + 240, 'concrete')],
            spawn: { x: 0, y: 0, z: 0, yaw: 0 }
        },
        build(S) {
            if (S.opts.snowCourse !== 'endurance') { BO.SummitRally.build(S); return; }
            if (BO.MinigameAudio) BO.MinigameAudio.start('snow');
            const slopeM = std(0xf1f5f9, 0.85), cliffM = std(0x475569, 0.9);
            const snowPlane = new THREE.Mesh(new THREE.PlaneGeometry(34, SNOW_LEN + 160), slopeM);
            snowPlane.rotation.x = -Math.PI / 2; snowPlane.position.set(0, 0.02, -SNOW_LEN * 0.5); S.add(snowPlane);
            const rnd = L.mulberry32(8801);
            // Both ranges use the same transforms at the snow line. Four draw calls
            // cover the full descent, including the distant second ridge.
            for (const distant of [false, true]) {
                const count = distant ? 128 : 224;
                const rock = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 6), cliffM, count);
                const caps = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 6), slopeM, count);
                const placement = new THREE.Object3D();
                for (let i = 0; i < count; i++) {
                    const side = i % 2 ? -1 : 1, radius = (distant ? 26 : 12) + rnd() * 16;
                    const height = (distant ? 40 : 9) + rnd() * (distant ? 48 : 29);
                    const x = side * (13 + radius + (distant ? 46 : 0));
                    const z = 20 - (i / count) * (SNOW_LEN + 120);
                    placement.position.set(x, height / 2 - 1, z); placement.rotation.y = rnd() * TAU;
                    placement.scale.set(radius, height, radius * 1.8); placement.updateMatrix(); rock.setMatrixAt(i, placement.matrix);
                    const cap = 0.42 + rnd() * 0.23;
                    placement.position.y += height * (1 - cap) / 2 + 0.02;
                    placement.scale.multiplyScalar(cap); placement.scale.x *= 1.07; placement.scale.z *= 1.07;
                    placement.updateMatrix(); caps.setMatrixAt(i, placement.matrix);
                }
                S.add(rock); S.add(caps);
            }
            for (let z = -30; z > -SNOW_LEN; z -= 65) {
                const tr = A.tree(1.8 + rnd() * 0.9, 0x0f766e);
                tr.position.set((rnd() < 0.5 ? -1 : 1) * (12.2 + rnd() * 2), 0, z); S.add(tr);
            }
            const zones = ['ZONE 1: GLACIAL SUMMIT', 'ZONE 2: PINE CANYON', 'ZONE 3: AVALANCHE GORGE', 'ZONE 4: NEON ICE TUNNEL', 'ZONE 5: ZOMBIE CHASE FINALE'];
            zones.forEach((lbl, zi) => {
                const zz = -zi * (SNOW_LEN * 0.2) - 25;
                const sg = A.sign(lbl, 12, 1.8, { bg: '#0c4a6e', color: '#fde047', borderColor: '#38bdf8', size: 0.44 });
                sg.position.set(0, 5.2, zz); S.add(sg);
            });

            const board = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.04, 1.45), std(0xf43f5e, 0.35, 0.2));
            for (const side of [-1, 1]) {
                const tip = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 8), board.material);
                tip.scale.set(1, 0.19, 1.2); tip.position.set(0, 0.025, side * 0.69); board.add(tip);
                const binding = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.038, 6, 12, Math.PI), std(0x273746, 0.68));
                binding.position.set(0, 0.05, side * 0.29); board.add(binding);
            }
            S.add(board);

            S.data.obstacles = []; S.data.extraTraps = []; S.data.riders = []; S.data.projs = [];
            const trapM = std(0x18181b, 0.4, 0.8), beamM = std(0x78350f, 0.85), iceM = new THREE.MeshStandardMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.84, roughness: 0.12 });
            const spikeMat = basic(0xef4444), warnMat = basic(0xfacc15), snowBallM = std(0xe2e8f0, 0.7), rampM = std(0xfacc15, 0.3, 0.5);

            for (let z = -70, stepIdx = 0; z > -SNOW_LEN + 90; z -= 54, stepIdx++) {
                const pct = -z / SNOW_LEN;
                const lateAvoidable = pct >= 0.72;
                const kind = stepIdx % 3;
                const sideGap = (stepIdx % 2 === 0) ? 1 : -1;
                const obsW = lateAvoidable ? 19.2 : 23.0;
                const obsX = lateAvoidable ? sideGap * -1.7 : 0;

                const chv = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 1.1), basic(kind === 0 ? 0xef4444 : kind === 1 ? 0xfacc15 : 0x38bdf8));
                chv.rotation.x = -Math.PI / 2; chv.position.set(0, 0.05, z + 16); S.add(chv);

                if (kind === 0) {
                    const g = new THREE.Group();
                    const plate = new THREE.Mesh(new THREE.BoxGeometry(obsW, 0.18, 1.35), trapM); plate.position.y = 0.09; g.add(plate);
                    const count = Math.floor(obsW / 1.5);
                    for (let k = -count / 2; k <= count / 2; k++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.78, 5), spikeMat); sp.position.set(k * 1.5, 0.48, 0); g.add(sp); }
                    g.position.set(obsX, 0, z); S.add(g);
                    S.data.obstacles.push({ kind: 'trap', mesh: g, x: obsX, z, w: obsW, hit: false });
                } else if (kind === 1) {
                    const g = new THREE.Group();
                    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, obsW, 10), beamM); bar.rotation.z = Math.PI / 2; bar.position.y = 1.48;
                    const warn = new THREE.Mesh(new THREE.BoxGeometry(obsW - 0.6, 0.22, 0.78), warnMat); warn.position.y = 1.48;
                    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.4, 0.4), beamM); p1.position.set(-obsW * 0.48, 1.2, 0);
                    const p2 = p1.clone(); p2.position.x = obsW * 0.48;
                    g.add(bar, warn, p1, p2); g.position.set(obsX, 0, z); S.add(g);
                    S.data.obstacles.push({ kind: 'beam', mesh: g, x: obsX, z, w: obsW, hit: false });
                } else {
                    const panels = lateAvoidable ? [-5.5 * sideGap, 1.8 * sideGap] : [-7.5, 0, 7.5];
                    for (const px of panels) {
                        const wall = new THREE.Mesh(new THREE.BoxGeometry(7.2, 2.6, 0.9), iceM);
                        const tg = S.addTarget({ mesh: wall, pos: V(px, 1.3, z), life: 0, appear: 'none', inT: 0.01, death: 'shatter', deathColor: 0x67e8f9, points: 250, bonus: true });
                        S.data.obstacles.push({ kind: 'ice', mesh: tg.root, tg, x: px, z, w: 7.2, hit: false });
                    }
                }

                // RANDOM EXTRA TRAPS between main obstacles!
                const randZ = z - 24 - rnd() * 6;
                const randX = (rnd() - 0.5) * 14;
                const tRoll = rnd();
                if (tRoll < 0.28) {
                    // Rolling Giant Snowball crossing the slope
                    const ball = new THREE.Mesh(new THREE.SphereGeometry(1.15, 12, 10), snowBallM);
                    ball.position.set(randX, 1.15, randZ); S.add(ball);
                    S.data.extraTraps.push({ type: 'boulder', mesh: ball, x: randX, z: randZ, vx: (rnd() < 0.5 ? -1 : 1) * (4.2 + rnd() * 3.5), rad: 1.35, hit: false });
                } else if (tRoll < 0.54) {
                    // Dropping Icicle Spire with cyan warning circle on snow
                    const ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.4, 18), basic(0x38bdf8, { side: THREE.DoubleSide }));
                    ring.rotation.x = -Math.PI / 2; ring.position.set(randX, 0.06, randZ); S.add(ring);
                    const icicle = new THREE.Mesh(new THREE.ConeGeometry(0.85, 3.6, 6), iceM);
                    icicle.rotation.x = Math.PI; icicle.position.set(randX, 9.5, randZ); S.add(icicle);
                    S.data.extraTraps.push({ type: 'icicle', mesh: icicle, ring, x: randX, z: randZ, y: 9.5, falling: false, rad: 1.45, hit: false });
                } else if (tRoll < 0.78) {
                    // Frost Steam Geyser Vent
                    const vent = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.45, 0.2, 14), trapM);
                    vent.position.set(randX, 0.1, randZ); S.add(vent);
                    const plume = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 1.0, 3.2, 10), basic(0xbae6fd, { transparent: true, opacity: 0.72 }));
                    plume.position.set(randX, 1.7, randZ); S.add(plume);
                    S.data.extraTraps.push({ type: 'geyser', mesh: plume, vent, x: randX, z: randZ, ph: rnd() * 6, rad: 1.5, hit: false });
                } else if (tRoll < 0.90) {
                    // Neon Laser Slalom Gate
                    const gate = new THREE.Group();
                    const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.0, 8), spikeMat); pL.position.set(-2.2, 1.5, 0);
                    const pR = pL.clone(); pR.position.x = 2.2;
                    const las = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.18, 0.18), spikeMat); las.position.y = 1.2;
                    gate.add(pL, pR, las); gate.position.set(randX, 0, randZ); S.add(gate);
                    S.data.extraTraps.push({ type: 'slalom', mesh: gate, x: randX, z: randZ, w: 4.5, hit: false });
                } else {
                    // Gold Alpine Launch Ramp!
                    const ramp = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.8, 3.2), rampM);
                    ramp.rotation.x = 0.25; ramp.position.set(randX, 0.35, randZ); S.add(ramp);
                    S.data.extraTraps.push({ type: 'ramp', mesh: ramp, x: randX, z: randZ, w: 3.6, hit: false });
                }
            }
            const finish = A.sign('ALPINE FINISH LINE!', 14, 2.6, { bg: '#0c4a6e', color: '#fde68a', borderColor: '#38bdf8', size: 0.56 });
            finish.position.set(0, 4.2, -SNOW_LEN); S.add(finish);

            const gates = [];
            const gateMat = basic(0x1ed5df), orange = basic(0xff8d4e);
            for (let n = 0; 140 + n * 162 < SNOW_LEN - 40; n++) {
                const x = Math.sin(n * 2.17) * 6.5, z = -140 - n * 162;
                const group = new THREE.Group(); group.position.set(x, 0, z);
                for (const side of [-1, 1]) {
                    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.08, 2.6, 6), gateMat);
                    pole.position.set(side * 2.2, 1.3, 0); group.add(pole);
                    const pennant = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.47, 0.06), side < 0 ? orange : gateMat);
                    pennant.position.set(side * 2.6, 2.29, 0); group.add(pennant);
                }
                S.add(group); gates.push({ x, z });
            }
            S.data.sb = { gates, gateIndex: 0, streak: 0, cleanGates: 0, grabs: 0, grabTime: 0, bank: 0, edge: 0, scoreFraction: 0, x: 0, z: 0, y: 0, vy: 0, speed: 16, slideT: 0, hp: 150, chasersSpawned: false, board };
            BO.Player.rideState = { kind: 'minigame', pos: V(0, 0, 0), roll: 0, pitch: 0, eye: 1.62 };
        },
        progress: (S) => S.data.rally ? S.data.rally.s / BO.SummitRally.length : clamp01(-S.data.sb.z / SNOW_LEN),
        onKey(S, code) {
            if (MG.state !== 'running') return false;
            if (S.data.rally) return BO.SummitRally.key(S, code);
            const sb = S.data.sb;
            if (code === 'Space' && sb.y <= 0.04) { sb.vy = 11.2; sb.slideT = 0; SFX.boing(); return true; }
            if (code === 'KeyC' || code === 'ControlLeft') { sb.slideT = 0.95; SFX.whoosh(0.18); return true; }
            return false;
        },
        preUpdate(S, dt, lib, state) {
            if (S.data.rally) { BO.SummitRally.tick(S, dt, state); return; }
            const sb = S.data.sb, P = BO.Player, k = P.keys;
            if (state === 'running') {
                sb.speed = Math.min(33, sb.speed + dt * 0.062);
                sb.z -= sb.speed * dt;
                const steer = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
                sb.edge = BO.Math.damp(sb.edge, steer, 9, dt);
                sb.x = BO.Math.clamp(sb.x + sb.edge * 15 * dt, -10.8, 10.8);
                if (sb.y > 0 || sb.vy > 0) { sb.vy -= 25 * dt; sb.y = Math.max(0, sb.y + sb.vy * dt); }
                if (sb.slideT > 0) sb.slideT -= dt;
                sb.scoreFraction += dt * 42;
                const points = Math.floor(sb.scoreFraction);
                if (points) { S.award(points); sb.scoreFraction -= points; }
                if (sb.y > 0.12 && k.KeyE) sb.grabTime += dt;
                if (sb.y === 0 && sb.grabTime > 0) {
                    if (!k.KeyE && sb.grabTime >= 0.18) {
                        sb.grabs++; S.award(180 + Math.floor(sb.grabTime * 400), V(sb.x, 1, sb.z), 'CLEAN GRAB');
                        SFX.ding(1.1);
                    } else if (k.KeyE) { sb.speed = Math.max(15, sb.speed - 2); MG.toast('Release the grab before landing', '#ffc997'); }
                    sb.grabTime = 0;
                }
                sb.bank = BO.Math.damp(sb.bank, k.KeyE && sb.y > 0.12 ? 0.72 : 0, 10, dt);
                const gate = sb.gates[sb.gateIndex];
                if (gate && sb.z <= gate.z) {
                    sb.gateIndex++;
                    if (Math.abs(sb.x - gate.x) < 2.2) {
                        sb.cleanGates++; sb.streak++; S.award(100 * Math.min(5, sb.streak), V(gate.x, 2, gate.z), 'GATE ' + sb.streak);
                        SFX.ding(1 + Math.min(5, sb.streak) * 0.08);
                    } else sb.streak = 0;
                }
                if (Math.random() < dt * 16) BO.FX.spawnParticles(V(sb.x, 0.1, sb.z), 1, 0xffffff, 2, 1, 0.3, 0.7);
            }
            const eyeH = sb.slideT > 0 ? 0.68 : 1.62;
            if (P.rideState) {
                P.rideState.pos.set(sb.x, sb.y, sb.z);
                P.rideState.eye = eyeH;
                P.rideState.roll = -sb.edge * 0.14;
            }
            sb.board.position.set(sb.x, sb.y + 0.04, sb.z - 0.55);
            sb.board.rotation.y = -sb.edge * 0.25; sb.board.rotation.z = sb.bank - sb.edge * 0.16;
        },
        update(S, dt, lib, state) {
            if (S.data.rally) return;
            const D = S.data, sb = D.sb;
            if (state !== 'running') return;
            if (BO.MinigameAudio) {
                BO.MinigameAudio.tick(dt, { boost: sb.speed > 26 });
                BO.MinigameAudio.updateBoardAudio(sb.speed, sb.edge, sb.y <= 0.04, false, sb.speed > 26);
            }

            for (const o of D.obstacles) {
                if (o.hit || Math.abs(sb.z - o.z) > 1.2) continue;
                if (o.kind === 'ice' && o.tg && !o.tg.alive) { o.hit = true; continue; }
                if (Math.abs(sb.x - o.x) < o.w * 0.5 + 0.28) {
                    const dodged = (o.kind === 'trap' && sb.y > 0.62) || (o.kind === 'beam' && sb.slideT > 0);
                    if (dodged) {
                        o.hit = true; S.award(90, V(sb.x, sb.y + 1, sb.z), o.kind === 'beam' ? 'LOW LINE' : 'CLEAN CLEAR');
                    } else {
                        o.hit = true;
                        sb.hp = Math.max(0, sb.hp - 25);
                        sb.speed = Math.max(15, sb.speed - 4);
                        SFX.bonk(); MG.flashScreen('rgba(220,38,38,0.35)');
                        MG.toast(o.kind === 'trap' ? 'TRAP HIT! JUMP [SPACE]' : o.kind === 'beam' ? 'BEAM HIT! SLIDE [C]' : 'ICE CRASH! SHOOT IT!', '#f87171');
                        if (sb.hp <= 0) { MG.finish('WIPEOUT ON THE MOUNTAIN!', { color: '#f87171' }); return; }
                    }
                }
            }

            // Random extra traps update & collisions
            for (const et of D.extraTraps) {
                if (et.z > sb.z + 18 || et.z < sb.z - 120) continue;
                if (et.type === 'boulder') {
                    et.x += et.vx * dt;
                    if (Math.abs(et.x) > 10.2) et.vx *= -1;
                    et.mesh.position.x = et.x;
                    et.mesh.rotation.z -= et.vx * dt * 0.9;
                    if (!et.hit && Math.abs(sb.z - et.z) < 1.25 && Math.abs(sb.x - et.x) < et.rad && sb.y < 1.35) {
                        et.hit = true; sb.hp = Math.max(0, sb.hp - 20); SFX.bonk(); MG.flashScreen('rgba(239,68,68,0.3)');
                        MG.toast('SMASHED BY ROLLING SNOWBALL!', '#fca5a5');
                        if (sb.hp <= 0) { MG.finish('WIPEOUT ON THE MOUNTAIN!', { color: '#f87171' }); return; }
                    }
                } else if (et.type === 'icicle') {
                    if (!et.falling && et.z > sb.z - 42) et.falling = true;
                    if (et.falling && et.y > 1.8) { et.y = Math.max(1.8, et.y - 16 * dt); et.mesh.position.y = et.y; }
                    if (!et.hit && Math.abs(sb.z - et.z) < 1.15 && Math.abs(sb.x - et.x) < et.rad && sb.y < 2.2) {
                        et.hit = true; sb.hp = Math.max(0, sb.hp - 18); SFX.shatter(); MG.flashScreen('rgba(56,189,248,0.35)');
                        MG.toast('FALLING ICICLE HIT!', '#93c5fd');
                        if (sb.hp <= 0) { MG.finish('WIPEOUT ON THE MOUNTAIN!', { color: '#f87171' }); return; }
                    }
                } else if (et.type === 'geyser') {
                    const active = Math.sin(S.t * 2.8 + et.ph) > -0.1;
                    et.mesh.visible = active;
                    if (active && !et.hit && Math.abs(sb.z - et.z) < 1.3 && Math.abs(sb.x - et.x) < et.rad && sb.y < 2.4) {
                        et.hit = true; sb.hp = Math.max(0, sb.hp - 15); sb.vy = Math.max(sb.vy, 9.0); SFX.whoosh(0.3);
                        MG.toast('FROST GEYSER BLAST!', '#bae6fd');
                        if (sb.hp <= 0) { MG.finish('WIPEOUT ON THE MOUNTAIN!', { color: '#f87171' }); return; }
                    }
                } else if (et.type === 'slalom') {
                    if (!et.hit && Math.abs(sb.z - et.z) < 1.0 && Math.abs(sb.x - et.x) < et.w * 0.5 && sb.y < 1.3 && sb.slideT <= 0) {
                        et.hit = true; sb.hp = Math.max(0, sb.hp - 18); SFX.buzzer();
                        MG.toast('SLALOM GATE HIT! CARVE AROUND OR SLIDE!', '#fca5a5');
                        if (sb.hp <= 0) { MG.finish('WIPEOUT ON THE MOUNTAIN!', { color: '#f87171' }); return; }
                    }
                } else if (et.type === 'ramp') {
                    if (!et.hit && Math.abs(sb.z - et.z) < 1.6 && Math.abs(sb.x - et.x) < et.w * 0.5) {
                        et.hit = true; sb.vy = 14.5; sb.y = Math.max(sb.y, 0.2); S.award(350, V(sb.x, sb.y + 2, sb.z), 'BIG AIR! +350', '#fde047'); SFX.star(2);
                    }
                }
            }

            if (-sb.z >= SNOW_LEN * 0.72 && !sb.chasersSpawned) {
                sb.chasersSpawned = true;
                MG.toast('ZOMBIE SNOWBOARDERS CATCHING UP — HOLD ON!', '#fca5a5');
                for (let i = 0; i < 5; i++) {
                    const zm = F.human({ skin: 0x65a30d, shirt: 0x3f6212, pants: 0x1e293b, mask: 0x18181b, eyes: 'angry' });
                    const bd = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 1.5), basic(0x4ade80)); zm.root.add(bd);
                    const tg = S.addTarget({ mesh: zm.root, hitMeshes: zm.hit, pos: V((i - 2) * 4.0, 0, sb.z + 24), life: 0, appear: 'none', inT: 0.01, death: 'tumble', deathColor: 0x4ade80, points: 500, hp: 2, bonus: true });
                    tg.offX = (i - 2) * 3.8; tg.offZ = 15 + i * 3; tg.fireT = 2.0 + i * 0.5;
                    D.riders.push(tg);
                }
            }
            for (const rd of D.riders) {
                if (!rd.alive) continue;
                rd.offZ = Math.max(7.0, rd.offZ - dt * 1.9);
                rd.root.position.set(BO.Math.clamp(rd.offX + Math.sin(S.t * 2 + rd.offZ) * 3.2, -10.5, 10.5), 0.1, sb.z + rd.offZ);
                rd.root.rotation.y = Math.PI;
                rd.fireT -= dt;
                if (rd.fireT <= 0) {
                    rd.fireT = 2.2;
                    const pMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), basic(0x4ade80));
                    pMesh.position.copy(rd.root.position).add(V(0, 1.3, -0.5)); S.add(pMesh);
                    const vel = V(sb.x, sb.y + 1.0, sb.z - 4).sub(pMesh.position).normalize().multiplyScalar(sb.speed + 16);
                    D.projs.push({ mesh: pMesh, vel, life: 2.5 }); SFX.pop();
                }
            }
            for (let i = D.projs.length - 1; i >= 0; i--) {
                const pr = D.projs[i];
                pr.life -= dt; pr.mesh.position.addScaledVector(pr.vel, dt);
                if (pr.mesh.position.distanceTo(V(sb.x, sb.y + 1.1, sb.z)) < 1.1) {
                    sb.hp = Math.max(0, sb.hp - 15); MG.flashScreen('rgba(74,222,128,0.35)');
                    S.scene.remove(pr.mesh); D.projs.splice(i, 1);
                    if (sb.hp <= 0) { MG.finish('SHOT DOWN BY ZOMBIE RIDERS', { color: '#f87171' }); return; }
                    continue;
                }
                if (pr.life <= 0) { S.scene.remove(pr.mesh); D.projs.splice(i, 1); }
            }
            if (-sb.z >= SNOW_LEN) { S.award(3000 + sb.hp * 20); MG.finish('5-MINUTE MOUNTAIN CONQUERED!', { color: '#38bdf8' }); }
        },
        result(S) {
            if (S.data.rally) return BO.SummitRally.result(S);
            const b = S.data.sb, stars = S.def.stars.filter(n => S.score >= n).length;
            return { score: S.score, stars, xp: 120 + Math.round(S.score * 0.06) + stars * 150,
                title: -b.z >= SNOW_LEN ? 'MOUNTAIN CLEARED' : 'RUN REPORT',
                stats: [['DISTANCE', Math.min(SNOW_LEN, Math.round(-b.z)) + ' m'], ['GATES CLEARED', b.cleanGates + '/' + b.gateIndex],
                    ['CLEAN GRABS', b.grabs], ['BOARD HEALTH', b.hp + '/150']] };
        },
        hud(S) {
            if (S.data.rally) return BO.SummitRally.hud(S);
            const sb = S.data.sb, pct = Math.round(clamp01(-sb.z / SNOW_LEN) * 100);
            const next = S.data.obstacles.find(o => !o.hit && o.z < sb.z && o.z > sb.z - 75 && (o.kind !== 'ice' || o.tg?.alive));
            const action = next ? ({ trap: 'JUMP', beam: 'DUCK', ice: 'BREAK ICE' }[next.kind] + ' · ' + Math.ceil(sb.z - next.z) + ' m') : '';
            const modeLbl = sb.grabTime > 0 ? 'GRAB ' + sb.grabTime.toFixed(1) + 's' : 'GATES ' + sb.cleanGates + '/' + sb.gateIndex + ' • GRABS ' + sb.grabs;
            return `<div class="fun-panel"><div class="mgx-chip">SPEED <b>${Math.round(sb.speed * 3.6)} KM/H</b></div><div class="mgx-chip">SLOPE <b>${pct}%</b></div><div class="mgx-chip ${sb.hp < 45 ? 'mgx-bad' : ''}">HP <b>${sb.hp}</b></div><div class="mgx-chip">${modeLbl}</div>${action ? '<div class="mgx-chip">' + action + '</div>' : ''}</div>`;
        }
    });
})(window);
