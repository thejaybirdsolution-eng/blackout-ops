/* ============================================================================
   FLIGHT CIRCUIT — 360 Trick Shot Pro Arena
   5 Iconic Textured Launch Towers (Dispatch Helipad, Freight Gantry, Cable Crane,
   Comms Mast, Refinery Smokestack), 3 Pneumatic Bounce Pads for 720°/1080° chains,
   Steel Ricochet Gongs, Explosive Propane Barrels, Aerial UAV Drone, 12-Lamp Spin
   Meter, World-Space Slow-Mo Chase Replay & Hype Trap Audio Integration!
============================================================================ */
(function (BO) {
    'use strict';
    const { group, part, box, rod, drum, ring, sign, std, basic, texMat, bouncePad, explosiveBarrel } = BO.CourseScenery;
    const A = BO.MinigameArt;
    const MA = () => BO.MinigameAudio;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);

    const pads = [
        { x: 0, z: 0, y: 26, name: 'Dispatch Helipad' },
        { x: -23, z: -4, y: 20, name: 'Freight Gantry' },
        { x: 23, z: -8, y: 25, name: 'Harbor Crane' },
        { x: -21, z: -39, y: 31, name: 'Comms Mast' },
        { x: 13, z: -46, y: 36, name: 'Refinery Stack' }
    ];
    const targets = [V(0, 0, -18), V(-1, 0, -16), V(3, 0, -23), V(-3, 0, -24), V(1, 0, -25)];

    function pad(D) { return pads[Math.min(pads.length - 1, D.round - 1)]; }
    function frame(p, i) { return Math.atan2(p.x - targets[i].x, p.z - targets[i].z); }

    function build(S) {
        const D = S.data;
        const metal = texMat('diamond_plate', 4, 4), rust = texMat('rusted_metal', 4, 6);
        const concrete = texMat('soviet_concrete', 4, 8);
        const gold = basic(0xffbb66), cyan = basic(0x38bdf8), red = basic(0xef4444);

        const animated = [];
        for (let i = 0; i < pads.length; i++) {
            const p = pads[i], g = group(S.scene, p.x, p.y, p.z);
            if (i) {
                const deck = S.box(p.x, p.y - 0.22, p.z, 5.8, 0.44, 5.8, metal, { solid: true });
                deck.receiveShadow = true;
                if (i === 4) {
                    drum(g, 0, -p.y / 2, 0, 2.45, 3.4, p.y, concrete, 22);
                    for (let h = 4; h < p.y; h += 4) drum(g, 0, -h, 0, 2.95, 2.95, 0.28, rust, 20);
                } else {
                    for (const x of [-2.2, 2.2]) for (const z of [-2.2, 2.2]) box(g, x, -p.y / 2, z, 0.30, p.y, 0.30, metal);
                    for (let h = 1; h < p.y - 3; h += 4) {
                        rod(g, V(-2.2, -h, 2.2), V(2.2, -h - 4, 2.2), 0.12, rust);
                        rod(g, V(-2.2, -h, -2.2), V(-2.2, -h - 4, 2.2), 0.12, rust);
                    }
                    if (i === 2) {
                        rod(g, V(-2, -2, 0), V(3, 6.5, 0), 0.30, rust);
                        rod(g, V(3, 6.5, 0), V(8.5, 6.5, -6), 0.24, metal);
                        rod(g, V(8.5, 6.5, -6), V(8.5, -4, -6), 0.05, metal);
                        box(g, 8.5, -4.6, -6, 1.8, 1.4, 1.4, rust);
                    }
                    if (i === 3) {
                        rod(g, V(-2, 0, 2), V(-2, 10, 2), 0.14, red);
                        const strobe = drum(g, -2, 10.2, 2, 0.22, 0.22, 0.44, gold);
                        animated.push({ obj: strobe, kind: 'blink' });
                    }
                }
            } else {
                // Helipad H-ring & spinning radar dish on Dispatch Roof
                const hRing = ring(g, 0, 0.04, 0.4, 1.9, 0.08, gold);
                hRing.rotation.x = -Math.PI / 2;
                const radar = group(g, 2.2, 1.5, 2.2);
                rod(radar, V(0, -1.5, 0), V(0, 0, 0), 0.1, metal);
                box(radar, 0, 0.2, 0, 1.6, 0.45, 0.12, cyan);
                animated.push({ obj: radar, kind: 'spin' });
            }
            const strip = group(g, 0, 0.045, 0);
            strip.rotation.y = frame(p, i);
            for (let j = 0; j < 3; j++) for (const side of [-1, 1]) {
                const chevron = box(strip, side * 0.32, 0.015, -0.23 - j * 0.68, 0.14, 0.03, 0.78, i === 0 ? gold : cyan);
                chevron.rotation.y = -side * 0.77;
            }
            if (i > 0) {
                sign(strip, `PAD ${i + 1} • ${p.name.toUpperCase()}`, 0, 2.9, -2.35, 4.9, 0.65, '#fde68a', '#111827');
                for (const sx of [-2.2, 2.2]) box(strip, sx, 1.45, -2.35, 0.16, 2.9, 0.16, metal);
            }
        }

        // Dynamic 12-Lamp Spin Progress Bar mounted to active launch pad
        const lampBar = group(S.scene);
        const lampGeometry = new THREE.BoxGeometry(0.2, 0.09, 0.55);
        D.lamps = Array.from({ length: 12 }, (_, i) => {
            const lamp = new THREE.Mesh(lampGeometry, basic(0x254451).clone());
            lamp.position.set(-2.2 + i * 0.4, 0.09, -2.35);
            lampBar.add(lamp);
            return lamp;
        });

        // 3 Pneumatic Bounce Pads for 720° / 1080° Mid-Air Double-Bounce Trickshots!
        const bouncePads = [
            bouncePad(S.scene, 0, 0, -9.5, 2.4, 0x22d3ee),
            bouncePad(S.scene, -11.5, 0, -18, 2.3, 0x38bdf8),
            bouncePad(S.scene, 11.5, 0, -24, 2.3, 0x38bdf8)
        ];

        // 2 Suspended Steel Ricochet Gongs (shoot while armed -> instant bank-shot into runner!)
        const gongs = [[-13.5, 7.2, -16], [13.5, 7.2, -26]].map(([gx, gy, gz]) => {
            const pl = A.steelPlate(0.95, 0xfacc15);
            const tg = S.addTarget({
                mesh: pl.mesh, hitMeshes: pl.hitMeshes, pos: V(gx, gy, gz),
                life: 0, appear: 'none', inT: 0.01, death: 'none', bonus: true
            });
            tg.isRicochetGong = true;
            return tg;
        });

        // 2 Explosive Red Propane Barrels near runner path (shoot for Explosive Bank-Shot!)
        const barrels = [[-6.5, 0, -17], [6.5, 0, -23]].map(([bx, by, bz]) => {
            const b = explosiveBarrel();
            const tg = S.addTarget({
                mesh: b.group, hitMeshes: b.hitMeshes, pos: V(bx, by, bz),
                life: 0, appear: 'none', inT: 0.01, death: 'burst', deathColor: 0xf97316, bonus: true
            });
            tg.isPropaneBarrel = true;
            return tg;
        });

        // Orbiting Aerial UAV Bonus Drone
        const dr = A.drone('speeder');
        const uav = S.addTarget({
            mesh: dr.mesh, hitMeshes: dr.hitMeshes, pos: V(0, 14, -22),
            life: 0, appear: 'scale', inT: 0.2, death: 'burst', deathColor: 0x22d3ee, bonus: true,
            onTick: (t, dt) => {
                t.root.position.set(Math.cos(S.t * 0.9) * 16, 13.5 + Math.sin(S.t * 2.1) * 1.8, -22 + Math.sin(S.t * 0.9) * 10);
                if (dr.rotors) for (const rt of dr.rotors) rt.rotation.y += dt * 28;
            }
        });
        uav.isBonusUav = true;

        // Illuminated Night/Sunset City Skyline Ring
        const rng = BO.MinigameLib.mulberry32(563);
        for (let i = 0; i < 32; i++) {
            const a = (i / 32) * Math.PI * 2, r = 56 + rng() * 18, x = Math.cos(a) * r, z = -18 + Math.sin(a) * r, h = 10 + rng() * 28;
            const bld = A.building(6 + rng() * 5, h, 6 + rng() * 5, 0x334155, i + 1, 0.55, true);
            bld.position.set(x, h / 2, z);
            bld.rotation.y = -a;
            S.add(bld);
        }

        // World-space Replay Stunt Double + Glowing Ribbon Trail + Tracer Shell
        const double = BO.MGFigures.human({ shirt: 0x25868e, pants: 0x253446, hat: 'helmet', hatColor: 0xf5b05a, gun: 'rifle' });
        S.add(double.root); double.root.visible = false;
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(96 * 3), 3));
        const trail = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x7fe9e8, transparent: true, opacity: 0.85 }));
        trail.frustumCulled = false; trail.visible = false; S.add(trail);
        const shell = part(S.scene, new THREE.SphereGeometry(0.11, 8, 6), gold, 0, 0, 0);
        shell.visible = false;

        D.flight = {
            samples: [], timer: 0, double, trail, shell, lampBar, bouncePads, gongs, barrels, uav, animated,
            from: V(), to: V(), lastPeak: 0, feedback: '', bestSnap: Infinity,
            practice: S.opts.flightRules === 'studio', ready: false,
            spinsDone: 0, nacSwap: false, barrelRoll: false, rollT: 0, bounceCount: 0, styleTags: [], lastQuarter: 0
        };
        if (D.flight.practice) S.duration = 0;
        if (MA()) MA().start('trickshot');
        reset(S);
    }

    function reset(S) {
        const D = S.data, p = pad(D), i = Math.min(4, D.round - 1), P = BO.Player;
        const yaw = frame(p, i);
        P.pos.set(p.x, p.y + 0.14, p.z);
        P.vel.set(0, 0, 0);
        P.yaw = yaw; P.pitch = -0.28;
        P.parkourRoll = 0;
        P.onGround = true;
        D.lastYaw = P.yaw;
        const f = D.flight;
        if (f && f.lampBar) {
            f.lampBar.position.set(p.x, p.y, p.z);
            f.lampBar.rotation.y = yaw;
        }
        if (f) {
            f.samples.length = 0; f.timer = 0; f.lastPeak = 0; f.ready = false;
            f.spinsDone = 0; f.nacSwap = false; f.barrelRoll = false; f.rollT = 0; f.bounceCount = 0;
            f.styleTags = []; f.lastQuarter = 0;
            f.double.root.visible = false; f.trail.visible = false; f.shell.visible = false;
        }
        if (MA()) MA().setLowpass(18000, 0.08);
    }

    function airborne(S) {
        const p = pad(S.data), P = BO.Player;
        return !P.onGround && (Math.abs(P.pos.x - p.x) > 2.85 || Math.abs(P.pos.z - p.z) > 2.85 || P.pos.y < p.y - 0.55);
    }

    function launch(S) {
        const D = S.data, P = BO.Player, p = pad(D);
        if (D.killcamT > 0) { D.killcamT = 0.001; return true; }
        if (Math.abs(P.pos.y - p.y) > 0.75 || Math.abs(P.pos.x - p.x) > 3.15 || Math.abs(P.pos.z - p.z) > 3.15) return false;
        const a = frame(p, Math.min(4, D.round - 1)), dx = -Math.sin(a), dz = -Math.cos(a);
        const edge = 3.55 / Math.max(Math.abs(dx), Math.abs(dz));
        P.pos.set(p.x + dx * edge, p.y + 0.45, p.z + dz * edge);
        P.vel.set(dx * 5.2, 4.6, dz * 5.2);
        P.onGround = false;
        D.jumped = true; D.lastYaw = P.yaw;
        BO.MinigameLib.SFX.whoosh(0.28);
        return true;
    }

    function styleKey(S, code) {
        const D = S.data, f = D.flight, P = BO.Player;
        if (!D.inAir || D.killcamT > 0) return false;
        if (code === 'KeyF' && !f.nacSwap) {
            f.nacSwap = true;
            f.styleTags.push('NAC-SWAP');
            P.inspectTimer = 0.75;
            BO.MinigameLib.SFX.clack();
            BO.Minigames.toast('★ STYLE: NAC-SWAP TWIRL (+450)!', '#38bdf8');
            return true;
        }
        if (code === 'KeyQ' && !f.barrelRoll) {
            f.barrelRoll = true; f.rollT = 0.55;
            f.styleTags.push('BARREL ROLL');
            BO.MinigameLib.SFX.whoosh(0.26);
            BO.Minigames.toast('★ STYLE: CORKSCREW BARREL ROLL (+550)!', '#c084fc');
            return true;
        }
        return false;
    }

    function checkBouncePads(S, dt) {
        const D = S.data, f = D.flight, P = BO.Player;
        for (const a of f.animated) {
            if (a.kind === 'spin') a.obj.rotation.y += dt * 1.4;
            else if (a.kind === 'blink') a.obj.visible = Math.sin(S.t * 6) > 0;
        }
        if (f.rollT > 0) {
            f.rollT = Math.max(0, f.rollT - dt);
            P.parkourRoll = Math.sin((1 - f.rollT / 0.55) * Math.PI * 2) * 0.85;
            if (f.rollT === 0) P.parkourRoll = 0;
        }
        for (const bp of f.bouncePads) {
            bp.glowRing.scale.setScalar(1 + Math.sin(S.t * 4.5) * 0.05);
            if (D.jumped && P.pos.y <= 1.25 && P.vel.y < 0 && Math.hypot(P.pos.x - bp.x, P.pos.z - bp.z) <= bp.radius + 0.5) {
                P.pos.y = 1.3;
                P.vel.y = 21.5;
                P.onGround = false;
                f.bounceCount++;
                if (!f.styleTags.includes('DOUBLE BOUNCE')) f.styleTags.push('DOUBLE BOUNCE');
                D.windowUsed = false;
                BO.FX.spawnParticles(V(bp.x, 0.6, bp.z), 20, 0x22d3ee, 6, 4, 0.45, 1.1);
                if (MA()) MA().bouncePad();
                BO.Minigames.toast('⚡ BOUNCE PAD LAUNCH! CHAIN 720°/1080°!', '#22d3ee');
                return true;
            }
        }
        return false;
    }

    function record(S, dt) {
        const D = S.data, f = D.flight;
        f.lastPeak = Math.max(f.lastPeak, Math.abs(D.spinAccum) * 180 / Math.PI);
        if (!D.inAir) return;
        f.timer -= dt; if (f.timer > 0) return;
        f.timer = 0.032;
        if (f.samples.length === 96) f.samples.shift();
        const p = BO.Player;
        f.samples.push({ pos: p.pos.clone(), yaw: p.yaw, pitch: p.pitch });
    }

    function beginReplay(S, pt) {
        const f = S.data.flight, P = BO.Player;
        f.samples.push({ pos: P.pos.clone(), yaw: P.yaw, pitch: P.pitch });
        if (f.samples.length > 96) f.samples.shift();
        f.from.copy(BO.App.worldCamera.position); f.to.copy(pt);
        const attr = f.trail.geometry.attributes.position;
        f.samples.forEach((v, i) => attr.setXYZ(i, v.pos.x, v.pos.y + 0.9, v.pos.z));
        attr.needsUpdate = true; f.trail.geometry.setDrawRange(0, f.samples.length);
        f.double.root.visible = true; f.trail.visible = true; f.ready = true; f.feedback = '';
        f.bestSnap = Math.min(f.bestSnap, S.data.lastSnap);
        f.holdPos = P.pos.clone();
        if (MA()) { MA().setLowpass(420, 0.06); MA().sniperKillcamBoom(); }
    }

    function replay(S, u) {
        const f = S.data.flight, P = BO.Player;
        if (f.holdPos) { P.pos.copy(f.holdPos); P.vel.set(0, 0, 0); }
        if (!f.ready || !f.samples.length) return;
        const cam = BO.App.worldCamera, flight = Math.min(1, u / 0.64) * (f.samples.length - 1);
        const i = Math.floor(flight), j = Math.min(i + 1, f.samples.length - 1), alpha = flight - i;
        const body = f.double.root, shot = Math.max(0, (u - 0.64) / 0.36);
        body.position.lerpVectors(f.samples[i].pos, f.samples[j].pos, alpha);
        body.rotation.y = f.samples[i].yaw + BO.Math.angleDiff(f.samples[i].yaw, f.samples[j].yaw) * alpha;
        BO.MGFigures.pose(f.double, 'aim');
        f.shell.visible = shot > 0; f.shell.position.lerpVectors(f.from, f.to, shot);
        const focus = f.from.clone().lerp(f.to, shot);
        if (!shot) { focus.copy(body.position); focus.y += 1; }
        const offset = V(6 + 3 * Math.cos(u * 2), 2.8 + 2 * Math.sin(u * 2), 5);
        cam.position.copy(focus).add(offset); cam.lookAt(focus); cam.updateMatrixWorld();
    }

    function stop(S) {
        const f = S.data.flight;
        if (MA()) MA().stop();
        if (!f) return;
        f.trail.geometry.dispose(); f.trail.material.dispose();
        f.double.root.visible = false; f.shell.visible = false; f.trail.visible = false;
    }

    BO.FlightCircuit = { build, reset, airborne, launch, styleKey, checkBouncePads, record, beginReplay, replay, stop, pad };
})(window.BO);
