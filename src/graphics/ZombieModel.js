/* ============================================================================
   BLACKOUT OPS — Sculpted Organic Zombie, Boss & Quadruped Model Builder
   Replaces primitive box anatomy with vertex-sculpted skulls, hinged mandibles,
   curved teeth, organic lathe-turned torsos, curved exposed ribs, anatomical
   limbs, clawed hands, contoured boots, and sculpted canine quadrupeds.
   Preserves exact rig hierarchy, hitbox tags, bodySpec flags & CharacterShading.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const TAU = Math.PI * 2;
    const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
    const lerp = (a, b, t) => a + (b - a) * t;
    const gauss = (x, mu, sig) => {
        const d = (x - mu) / sig;
        return Math.exp(-0.5 * d * d);
    };

    function lathe(pts, segs = 16, scaleZ = 1) {
        const geo = new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), segs);
        if (scaleZ !== 1) geo.scale(1, 1, scaleZ);
        geo.computeVertexNormals();
        return geo;
    }

    function sculptGrid(slices, segs, evalFn) {
        const pos = [], uvs = [], idx = [], cols = segs + 1;
        for (let iy = 0; iy <= slices; iy++) {
            const v = iy / slices;
            for (let ix = 0; ix <= segs; ix++) {
                const u = ix / segs;
                const p = evalFn(v, u * TAU, u);
                pos.push(p[0], p[1], p[2]);
                uvs.push(u, v);
            }
        }
        for (let iy = 0; iy < slices; iy++) {
            for (let ix = 0; ix < segs; ix++) {
                const a = iy * cols + ix, b = a + 1, c = a + cols, d = c + 1;
                idx.push(a, c, b, b, c, d);
            }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geo.setIndex(idx);
        geo.computeVertexNormals();
        return geo;
    }

    // Sculpted undead anatomical torso (y in [0.02 .. 0.59] in bodyPivot space)
    function makeTorsoGeo(chestW, chestD, lean = false) {
        const hw = chestW * 0.5;
        const hd = chestD * 0.5;
        return sculptGrid(18, 22, (v, th) => {
            const y = lerp(0.03, 0.58, v);
            const sinT = Math.sin(th), cosT = Math.cos(th);
            const front = Math.max(0, cosT);
            const back = Math.max(0, -cosT);

            // Waist-to-ribcage-to-shoulder taper
            let rx = hw * lerp(0.74, 0.70, Math.sin(v * Math.PI * 0.45));
            rx = lerp(rx, hw * 1.04, Math.pow(Math.max(0, (v - 0.25) / 0.55), 0.75));
            if (v > 0.80) rx *= lerp(1.0, 0.48, (v - 0.80) / 0.20);

            let rz = hd * lerp(0.78, 0.72, Math.sin(v * Math.PI * 0.45));
            rz = lerp(rz, hd * 1.04, Math.pow(Math.max(0, (v - 0.25) / 0.55), 0.8));
            if (v > 0.80) rz *= lerp(1.0, 0.52, (v - 0.80) / 0.20);

            // Anatomical pectoral swells, sunken sternum, thoracic hunch & spinal furrow
            const pec = (lean ? 0.008 : 0.020) * front * gauss(v, 0.66, 0.14) * (1 - 0.45 * gauss(sinT, 0, 0.25));
            const sternum = -0.012 * Math.pow(front, 10) * gauss(v, 0.62, 0.14);
            const ribs = (lean ? -0.014 : -0.006) * Math.sin(v * 28.0) * front * gauss(v, 0.46, 0.16);
            const spine = -0.014 * Math.pow(back, 6) * gauss(v, 0.52, 0.26);
            const hunchZ = -0.025 * gauss(v, 0.72, 0.20);

            return [rx * sinT, y, (rz + pec + sternum + ribs + spine) * cosT + hunchZ];
        });
    }

    // Sculpted undead cranium + gaunt cheekbones + brow ridge + eye sockets + nasal cavity
    function makeSkullGeo() {
        return sculptGrid(20, 24, (v, th) => {
            const y = lerp(-0.105, 0.165, v);
            const sinT = Math.sin(th), cosT = Math.cos(th);
            const front = Math.max(0, cosT);
            const side = Math.abs(sinT);

            // Cranial vault widest at temples, tapering smoothly into gaunt jaw & chin
            const dome = Math.pow(Math.sin(clamp(v, 0.02, 0.98) * Math.PI), 0.52);
            let rx = 0.128 * dome;
            let rz = 0.138 * dome;
            if (v < 0.44) {
                const j = clamp(v / 0.44, 0, 1);
                rx *= lerp(0.56, 1.0, j);
                rz *= lerp(0.68, 1.0, j);
            }

            // Overhanging brow ridge
            const brow = 0.024 * Math.pow(front, 3.0) * gauss(v, 0.57, 0.065);
            // Deeply sunken orbital eye sockets
            const eyeL = gauss(th - 0.42, 0, 0.22);
            const eyeR = gauss(th - (TAU - 0.42), 0, 0.22);
            const socket = -0.026 * (eyeL + eyeR) * gauss(v, 0.45, 0.075);
            // Sharp gaunt zygomatic cheekbones & hollow lower cheeks
            const cheek = 0.018 * (gauss(th - 0.68, 0, 0.24) + gauss(th - (TAU - 0.68), 0, 0.24)) * gauss(v, 0.34, 0.08);
            const hollow = -0.016 * Math.pow(side, 2.0) * gauss(v, 0.21, 0.08);
            // Sculpted nose bridge & sunken nasal pit
            const nose = 0.022 * Math.pow(front, 16.0) * gauss(v, 0.38, 0.055);
            // Protruding upper dental ridge
            const muzzle = 0.018 * Math.pow(front, 7.0) * gauss(v, 0.16, 0.075);

            return [(rx + cheek * 0.45 + hollow * 0.6) * sinT, y, (rz + brow + socket + cheek + nose + muzzle) * cosT];
        });
    }

    // Sculpted U-shaped lower mandible jawbone
    function makeMandibleGeo() {
        const pts = [];
        for (let i = 0; i <= 12; i++) {
            const t = i / 12;
            const ang = lerp(-Math.PI * 0.48, Math.PI * 0.48, t);
            pts.push(new THREE.Vector3(Math.sin(ang) * 0.068, -0.02 * Math.cos(ang), Math.cos(ang) * 0.092));
        }
        const curve = new THREE.CatmullRomCurve3(pts);
        return new THREE.TubeGeometry(curve, 14, 0.024, 7, false);
    }

    // Sculpted bloated abdomen with organic asymmetric lumps
    function makeBloatedBellyGeo() {
        const geo = new THREE.SphereGeometry(0.36, 16, 14);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
            const lump = 1.0 + 0.09 * Math.sin(x * 11 + y * 7) + 0.07 * Math.cos(z * 13 - y * 9);
            const sag = y < 0 ? 1.12 : 0.94;
            pos.setXYZ(i, x * 1.08 * lump, y * 0.98 * sag, z * 0.98 * lump);
        }
        geo.computeVertexNormals();
        return geo;
    }

    function hookZombieBuilder() {
        const CM = BO.CharacterMesh;
        if (!CM || CM.__sculptedZombies) return;
        CM.__sculptedZombies = true;

        CM.buildZombieFromSpec = function (spec, entity) {
            const root = new THREE.Group();
            const bs = spec.bodySpec || {};
            const sc = bs.scale || [1, 1, 1];
            root.scale.set(sc[0], sc[1], sc[2]);

            if (bs.quadruped) {
                const parts = this._buildQuadrupedFromSpec(root, spec, entity);
                BO.ArsenalDetails.undeadDetails(parts, spec);
                return parts;
            }

            const key = spec.id || 'default';
            const idLow = String(key).toLowerCase();
            const isArmored = bs.torsoShape === 'armored' || idLow.includes('knight') || idLow.includes('juggernaut') || idLow.includes('armored') || idLow.includes('panzer');
            const isSlime = idLow.includes('slime') || idLow.includes('ooze') || idLow.includes('gelatin');
            const isGhost = idLow.includes('ghost') || idLow.includes('wraith') || idLow.includes('phantom') || idLow.includes('specter') || !!bs.floating;
            const isSkeleton = idLow.includes('skeleton') || idLow.includes('bone') || idLow.includes('lich');

            const skinMat = this._mat('zskin2_' + key, () => {
                const map = (!isSlime && !isGhost && BO.Textures?.createZombieSkinTexture)
                    ? BO.Textures.createZombieSkinTexture(bs.skinColor || 0x5c6958)
                    : null;
                const bumpMap = (!isSlime && !isGhost && BO.Textures?.createBumpTexture) ? BO.Textures.createBumpTexture('skin') : null;
                return new THREE.MeshStandardMaterial({
                    color: map ? 0xffffff : (bs.skinColor || 0x5c6958),
                    map,
                    bumpMap,
                    bumpScale: 0.032,
                    roughness: isSlime ? 0.18 : 0.72,
                    metalness: isSlime ? 0.12 : 0.04,
                    transparent: isSlime || isGhost,
                    opacity: isSlime ? 0.78 : (isGhost ? 0.82 : 1.0),
                    emissive: bs.glowingRibs ? bs.glowingRibs : (isGhost ? (bs.eyeColor || 0x38bdf8) : 0x000000),
                    emissiveIntensity: bs.glowingRibs ? 0.28 : (isGhost ? 0.22 : 0)
                });
            });
            const outfitStyle = isArmored ? 'swat' : /acid|spitter|toxic|nova|plague/.test(idLow) ? 'hazmat' : /doctor|scientist|lab|aether|crawler/.test(idLow) ? 'lab' : /soviet|officer|commissar|trench/.test(idLow) ? 'soviet' : /soldier|heavy|commando|marine|sprinter/.test(idLow) ? 'bdu' : 'tattered';
            const shirtMat = this._mat('zshirt2_' + key, () => {
                const T = BO.Textures;
                const map = T ? (isArmored ? T.createGunmetalTexture(bs.shirtColor || 0x333935) : (T.createMilitaryFatigueTexture ? T.createMilitaryFatigueTexture(outfitStyle, bs.shirtColor || 0x333935) : T.createZombieClothTexture(bs.shirtColor || 0x333935))) : null;
                const bumpMap = T?.createBumpTexture ? T.createBumpTexture(isArmored ? 'metal' : 'cloth') : null;
                return new THREE.MeshStandardMaterial({
                    color: map ? 0xffffff : (bs.shirtColor || 0x333935),
                    map,
                    bumpMap,
                    bumpScale: isArmored ? 0.015 : 0.035,
                    roughness: isArmored ? 0.34 : 0.88,
                    metalness: isArmored ? 0.80 : 0.05,
                    transparent: isGhost,
                    opacity: isGhost ? 0.80 : 1.0
                });
            });
            const pantsMat = this._mat('zpants2_' + key, () => {
                const T = BO.Textures;
                const map = T?.createMilitaryFatigueTexture ? T.createMilitaryFatigueTexture(outfitStyle === 'lab' ? 'tattered' : outfitStyle, bs.pantsColor || 0x24262a) : null;
                const bumpMap = T?.createBumpTexture ? T.createBumpTexture('cloth') : null;
                return new THREE.MeshStandardMaterial({
                    color: map ? 0xffffff : (bs.pantsColor || 0x24262a),
                    map,
                    bumpMap,
                    bumpScale: 0.030,
                    roughness: 0.90
                });
            });
            const trimMat = this._mat('ztrim_' + key, () => new THREE.MeshStandardMaterial({
                color: isArmored ? 0x334155 : (bs.pantsColor || 0x1e242b),
                roughness: isArmored ? 0.35 : 0.68,
                metalness: isArmored ? 0.84 : 0.30
            }));
            const bootMat = this._mat('zboot', () => new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.78, metalness: 0.20 }));
            const fleshMat = this._mat('zflesh', () => new THREE.MeshStandardMaterial({ color: 0x5c1414, roughness: 0.48, metalness: 0.08 }));
            const boneMat = this._mat('zbone', () => new THREE.MeshStandardMaterial({ color: 0xd9d3c0, roughness: 0.56 }));
            const steelMat = this._mat('zsteel', () => new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.30, metalness: 0.88 }));
            const eyeMat = this._mat('zeye_' + key, () => new THREE.MeshBasicMaterial({ color: bs.eyeColor || 0xff3333 }));
            const eyeCoreMat = this._mat('zeyecore', () => new THREE.MeshBasicMaterial({ color: 0xffffff }));
            const sockMat = this._mat('zsock_m', () => new THREE.MeshBasicMaterial({ color: 0x070406 }));

            const isCrawler = !!bs.missingLegs && !bs.floating;
            const isFloating = !!bs.floating;

            const bodyPivot = new THREE.Group();
            bodyPivot.position.y = isCrawler ? 0.28 : (isFloating ? 1.15 : 0.86);
            bodyPivot.userData.baseY = bodyPivot.position.y;
            if (isCrawler) bodyPivot.rotation.x = 1.18;
            else if (bs.torsoShape === 'hunched') bodyPivot.rotation.x = 0.26;
            else if (bs.torsoShape === 'bloated') bodyPivot.rotation.x = 0.10;
            bodyPivot.userData.baseRotX = bodyPivot.rotation.x;
            root.add(bodyPivot);

            const isBroad = bs.torsoShape === 'broad' || isArmored || spec.isBoss;
            const isLean = bs.torsoShape === 'lean' || isSkeleton;
            const chestW = isBroad ? 0.54 : (isLean ? 0.36 : 0.45);
            const chestD = isBroad ? 0.32 : (isLean ? 0.20 : 0.25);

            // ================================================================
            // 1. SCULPTED ORGANIC TORSO (ZERO PRIMITIVE BOXES)
            // ================================================================
            if (bs.torsoShape === 'bloated') {
                const belly = this._tagHitbox(
                    new THREE.Mesh(this._geo('z_bloat_belly2', makeBloatedBellyGeo), skinMat),
                    entity, 'torso'
                );
                belly.position.set(0, 0.22, 0.04);

                const upperGeo = this._geo('z_bloat_up2', () => makeTorsoGeo(0.46, 0.28, false));
                const upper = this._tagHitbox(new THREE.Mesh(upperGeo, shirtMat), entity, 'torso');
                upper.position.set(0, 0.16, -0.02);

                const flapGeo = this._geo('z_flap_curve', () => lathe([[0.09, 0], [0.12, 0.18], [0.06, 0.34]], 8, 0.35));
                for (const s of [-1, 1]) {
                    const flap = new THREE.Mesh(flapGeo, shirtMat);
                    flap.position.set(s * 0.23, 0.14, 0.24);
                    flap.rotation.z = -s * 0.22;
                    bodyPivot.add(flap);
                }
                bodyPivot.add(belly, upper);
            } else if (bs.torsoShape === 'floating' || isFloating) {
                const chest = this._tagHitbox(
                    new THREE.Mesh(this._geo('z_float_torso2', () => makeTorsoGeo(0.42, 0.24, true)), shirtMat),
                    entity, 'torso'
                );
                chest.position.y = 0.08;
                const shroudGeo = this._geo('z_float_shroud2', () => sculptGrid(14, 20, (v, th) => {
                    const y = lerp(-0.36, 0.16, v);
                    const r = lerp(0.28, 0.15, v) + Math.sin(th * 6.0) * 0.035 * (1 - v);
                    return [r * Math.sin(th), y, r * Math.cos(th) * 0.82];
                }));
                const cloakTail = new THREE.Mesh(shroudGeo, shirtMat);
                bodyPivot.add(chest, cloakTail);
            } else {
                const tKey = isBroad ? 'ztorso_broad2' : (isLean ? 'ztorso_lean2' : 'ztorso_std2');
                const torsoMesh = this._tagHitbox(
                    new THREE.Mesh(this._geo(tKey, () => makeTorsoGeo(chestW, chestD, isLean)), shirtMat),
                    entity, 'torso'
                );
                const pelvisGeo = this._geo('zpelvis_lathe_' + tKey, () => lathe([
                    [chestW * 0.32, -0.08], [chestW * 0.42, -0.02], [chestW * 0.40, 0.08]
                ], 14, chestD / chestW * 1.1));
                const pelvis = new THREE.Mesh(pelvisGeo, pantsMat);

                // Recessed organic chest wound cavity + 3 curved 3D rib arcs!
                const woundGeo = this._geo('zwound_sphere', () => new THREE.SphereGeometry(0.11, 10, 8));
                const wound = new THREE.Mesh(woundGeo, fleshMat);
                wound.scale.set(chestW * 2.1, 1.3, 0.28);
                wound.position.set(0, 0.38, chestD * 0.48);
                bodyPivot.add(torsoMesh, pelvis, wound);

                const ribCurveGeo = this._geo('zrib_arc2', () => {
                    const c = new THREE.CatmullRomCurve3([
                        new THREE.Vector3(-0.085, 0, -0.02),
                        new THREE.Vector3(-0.04, 0.008, 0.014),
                        new THREE.Vector3(0.04, 0.008, 0.014),
                        new THREE.Vector3(0.085, 0, -0.02)
                    ]);
                    return new THREE.TubeGeometry(c, 10, 0.012, 6, false);
                });
                for (let r = 0; r < 3; r++) {
                    const rib = new THREE.Mesh(ribCurveGeo, boneMat);
                    rib.position.set(0, 0.30 + r * 0.068, chestD * 0.48);
                    bodyPivot.add(rib);
                }

                // Draped collar folds & curved diagonal webbing strap
                const collarGeo = this._geo('zcollar_curve', () => lathe([[0.09, 0], [0.14, 0.04], [0.11, 0.09]], 12, 0.78));
                const collar = new THREE.Mesh(collarGeo, shirtMat);
                collar.position.set(0, 0.53, 0.01);
                const strapGeo = this._geo('zstrap_torus', () => new THREE.TorusGeometry(chestW * 0.46, 0.026, 6, 18));
                const strap = new THREE.Mesh(strapGeo, trimMat);
                strap.position.set(0, 0.36, 0.01);
                strap.scale.set(0.85, 1.15, (chestD * 0.55) / (chestW * 0.46));
                strap.rotation.set(0.35, 0.15, 0.65);
                bodyPivot.add(collar, strap);

                if (isArmored) {
                    const plateGeo = this._geo('zplate_curved', () => lathe([
                        [chestW * 0.46, 0.22], [chestW * 0.52, 0.38], [chestW * 0.48, 0.54]
                    ], 14, (chestD + 0.06) / chestW));
                    const plate = new THREE.Mesh(plateGeo, steelMat);
                    bodyPivot.add(plate);
                }
            }

            // Contoured Duty Belt + Rounded Buckle & Tactical Pouches
            const beltGeo = this._geo('zbelt_lathe_' + (isBroad ? 'b' : 's'), () => lathe([
                [chestW * 0.43, 0.02], [chestW * 0.46, 0.055], [chestW * 0.43, 0.09]
            ], 16, chestD / chestW * 1.05));
            const belt = new THREE.Mesh(beltGeo, trimMat);
            const buckle = new THREE.Mesh(this._geo('zbuckle_cyl', () => new THREE.CylinderGeometry(0.048, 0.048, 0.028, 10)), steelMat);
            buckle.rotation.x = Math.PI * 0.5;
            buckle.position.set(0, 0.055, chestD * 0.45);
            bodyPivot.add(belt, buckle);
            for (const sx of [-1, 1]) {
                const pouch = new THREE.Mesh(this._geo('zpouch_cap', () => new THREE.CapsuleGeometry(0.038, 0.05, 4, 8)), trimMat);
                pouch.position.set(sx * chestW * 0.44, 0.04, 0.03);
                bodyPivot.add(pouch);
            }

            // Sculpted Shoulder Deltoids / Curved Armored Pauldrons
            const shoulderX = chestW * 0.48 + 0.05;
            const shGeo = isArmored
                ? this._geo('zpauldron_dome', () => new THREE.SphereGeometry(0.115, 10, 8, 0, TAU, 0, Math.PI * 0.58))
                : this._geo('zdeltoid', () => new THREE.SphereGeometry(0.092, 10, 8));
            const shMat = isArmored ? steelMat : shirtMat;
            for (const s of [-1, 1]) {
                const sh = new THREE.Mesh(shGeo, shMat);
                sh.position.set(s * shoulderX, 0.53, 0);
                if (isArmored) sh.rotation.z = -s * 0.42;
                bodyPivot.add(sh);
            }

            // Muscular Neck + Curved Sternocleidomastoid Tendons
            if (!bs.headless) {
                const neck = new THREE.Mesh(this._geo('zneck_lathe', () => lathe([
                    [0.088, 0], [0.068, 0.08], [0.072, 0.15]
                ], 12)), skinMat);
                neck.position.set(0, 0.55, 0.01);
                bodyPivot.add(neck);
                for (const s of [-1, 1]) {
                    const tend = new THREE.Mesh(this._geo('ztendon', () => new THREE.CylinderGeometry(0.016, 0.022, 0.14, 6)), fleshMat);
                    tend.position.set(s * 0.040, 0.62, 0.055);
                    tend.rotation.z = -s * 0.16;
                    bodyPivot.add(tend);
                }
            }

            // Boss Aura, Glowing Core, Back Sac, Spikes, Wings, Tentacles
            if (spec.isBoss || spec.isMagical) {
                const auraCol = spec.isBoss ? 0xef4444 : 0xc084fc;
                const aura = new THREE.Mesh(
                    this._geo('zaura', () => new THREE.TorusGeometry(0.52, 0.032, 6, 22)),
                    this._mat('zaura_m_' + auraCol, () => new THREE.MeshBasicMaterial({ color: auraCol, transparent: true, opacity: 0.72 }))
                );
                aura.rotation.x = Math.PI * 0.5;
                aura.position.y = 0.05;
                root.add(aura);

                if (spec.isBoss) {
                    const core = this._tagHitbox(
                        new THREE.Mesh(this._geo(spec.isSuperBoss ? 'zsuper_core' : 'zboss_core', () => new THREE.OctahedronGeometry(spec.isSuperBoss ? 0.145 : 0.11, 0)), eyeMat),
                        entity, spec.isSuperBoss ? 'head' : 'torso'
                    );
                    core.position.set(0, 0.40, chestD * 0.5 + 0.04);
                    bodyPivot.add(core);
                }
                if (spec.isSuperBoss) {
                    const superRing = new THREE.Mesh(
                        this._geo('zsuper_ring', () => new THREE.TorusGeometry(0.68, 0.042, 6, 28)),
                        this._mat('zsuper_ring_m', () => new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.85 }))
                    );
                    superRing.rotation.x = Math.PI * 0.5;
                    superRing.position.y = 0.08;
                    root.add(superRing);
                }
            }

            if (bs.glowingRibs) {
                const ribGlowMat = this._mat('zrib_g_' + key, () => new THREE.MeshBasicMaterial({ color: bs.glowingRibs }));
                for (let r = 0; r < 3; r++) {
                    const rib = new THREE.Mesh(this._geo('rib_glow_tor', () => new THREE.TorusGeometry(chestW * 0.36, 0.018, 6, 16)), ribGlowMat);
                    rib.rotation.x = Math.PI * 0.5;
                    rib.scale.set(1.0, (chestD * 0.54) / (chestW * 0.36), 1.0);
                    rib.position.set(0, 0.28 + r * 0.10, 0.01);
                    bodyPivot.add(rib);
                }
            }

            if (bs.backSac) {
                const sacMat = this._mat('zsac_' + key, () => new THREE.MeshStandardMaterial({
                    color: bs.backSac, emissive: bs.backSac, emissiveIntensity: 0.72, roughness: 0.26
                }));
                const sac = this._tagHitbox(new THREE.Mesh(this._geo('back_sac', () => new THREE.SphereGeometry(0.25, 12, 10)), sacMat), entity, 'torso');
                sac.scale.set(1.05, 1.15, 0.90);
                sac.position.set(0, 0.40, -(chestD * 0.5 + 0.14));
                const sacSub = new THREE.Mesh(this._geo('back_sac_sub', () => new THREE.SphereGeometry(0.13, 10, 8)), sacMat);
                sacSub.position.set(0.16, 0.28, -(chestD * 0.5 + 0.12));
                bodyPivot.add(sac, sacSub);
            }

            if (bs.boneSpikes || spec.isBoss) {
                const spGeo = this._geo('spike', () => new THREE.ConeGeometry(0.052, 0.28, 7));
                for (const s of [-1, 1]) {
                    const sp = new THREE.Mesh(spGeo, boneMat);
                    sp.position.set(s * (shoulderX + 0.02), 0.66, 0);
                    sp.rotation.z = -s * 0.45;
                    bodyPivot.add(sp);
                }
            }

            if (bs.wings) {
                const wingMat = this._mat('zwing_' + key, () => new THREE.MeshStandardMaterial({
                    color: bs.shirtColor || 0x450a0a, roughness: 0.65, side: THREE.DoubleSide
                }));
                const wMemGeo = this._geo('wing_mem_lathe', () => sculptGrid(6, 8, (v, th) => {
                    const u = th / TAU;
                    const x = u * 0.62;
                    const y = (v - 0.5) * 0.44 * (1 - u * 0.35) - Math.sin(u * Math.PI * 3) * 0.04 * (1 - v);
                    return [x, y, Math.sin(u * Math.PI) * 0.03];
                }));
                const wBoneGeo = this._geo('wing_bone', () => new THREE.CylinderGeometry(0.022, 0.028, 0.62, 6));
                for (const s of [-1, 1]) {
                    const wg = new THREE.Group();
                    wg.position.set(s * 0.20, 0.48, -chestD * 0.5 - 0.04);
                    wg.rotation.set(0.14, s * 0.48, -s * 0.22);
                    const mem = new THREE.Mesh(wMemGeo, wingMat);
                    if (s < 0) mem.scale.x = -1;
                    const wb = new THREE.Mesh(wBoneGeo, boneMat); wb.rotation.z = Math.PI * 0.5; wb.position.set(s * 0.30, 0.21, 0);
                    wg.add(mem, wb);
                    bodyPivot.add(wg);
                }
            }

            if (bs.tentacles) {
                const tMat = this._mat('ztent_' + key, () => new THREE.MeshStandardMaterial({ color: 0x1e1b4b, emissive: 0x581c87, emissiveIntensity: 0.42 }));
                const tGeo = this._geo('tentacle_curve', () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(0, 0.26, -0.14),
                    new THREE.Vector3(0.06, 0.54, -0.26),
                    new THREE.Vector3(0, 0.78, -0.18)
                ]), 10, 0.036, 6, false));
                for (let t = 0; t < 4; t++) {
                    const ten = new THREE.Mesh(tGeo, tMat);
                    ten.position.set((t - 1.5) * 0.14, 0.24, -chestD * 0.5 - 0.04);
                    ten.rotation.z = (t - 1.5) * 0.24;
                    bodyPivot.add(ten);
                }
            }

            if (idLow.includes('wolf') || idLow.includes('lycan') || idLow.includes('tiger') || idLow.includes('demon')) {
                const tail = new THREE.Mesh(this._geo('ztail', () => new THREE.CylinderGeometry(0.025, 0.055, 0.52, 7)), skinMat);
                tail.position.set(0, 0.02, -chestD * 0.5 - 0.16);
                tail.rotation.x = -0.85;
                bodyPivot.add(tail);
            }

            let haloGroup = null;
            if (bs.haloCrystal) {
                haloGroup = new THREE.Group();
                haloGroup.position.set(0, 0.92, 0);
                const cMat = this._mat('zcrys_' + key, () => new THREE.MeshBasicMaterial({ color: bs.haloCrystal }));
                const cGeo = this._geo('crystal', () => new THREE.OctahedronGeometry(0.10, 0));
                for (let c = 0; c < 4; c++) {
                    const a = (c / 4) * TAU;
                    const shard = new THREE.Mesh(cGeo, cMat);
                    shard.position.set(Math.cos(a) * 0.54, 0.05, Math.sin(a) * 0.54);
                    haloGroup.add(shard);
                }
                bodyPivot.add(haloGroup);
            }

            // ================================================================
            // 2. SCULPTED UNDEAD CRANIUM, SUNKEN ORBITS, MANDIBLE & FANGS
            // ================================================================
            const headGroup = new THREE.Group();
            headGroup.position.set(0, 0.77, 0.04);
            const jaws = [];
            if (bs.headless) {
                const spine = this._tagHitbox(
                    new THREE.Mesh(this._geo('spine', () => new THREE.CylinderGeometry(0.068, 0.095, 0.18, 8)),
                        this._mat('spine_glow', () => new THREE.MeshBasicMaterial({ color: 0xef4444 }))),
                    entity, 'torso'
                );
                spine.position.y = -0.09;
                headGroup.add(spine);
            } else {
                const headCount = 1 + (bs.extraHeads || 0);
                const skullGeo = this._geo('z_skull_sculpt2', makeSkullGeo);
                const jawGeo = this._geo('z_mandible2', makeMandibleGeo);
                const toothGeo = this._geo('z_tooth_cone', () => new THREE.ConeGeometry(0.0085, 0.024, 5));

                for (let h = 0; h < headCount; h++) {
                    const hx = headCount === 1 ? 0 : (h === 0 ? -0.17 : 0.17);
                    const hg = new THREE.Group();
                    hg.position.set(hx, 0, 0);

                    const skull = this._tagHitbox(new THREE.Mesh(skullGeo, skinMat), entity, 'head');
                    hg.add(skull);

                    // Deep recessed orbital darks + glowing spherical eyeballs + white pupil cores
                    for (const sx of [-1, 1]) {
                        const sock = new THREE.Mesh(this._geo('zsock_sph', () => new THREE.SphereGeometry(0.032, 8, 6)), sockMat);
                        sock.scale.set(1.1, 0.8, 0.55);
                        sock.position.set(sx * 0.050, 0.026, 0.112);

                        const eye = new THREE.Mesh(this._geo('zeye_sph', () => new THREE.SphereGeometry(0.019, 8, 6)), eyeMat);
                        eye.position.set(sx * 0.050, 0.026, 0.120);

                        const pup = new THREE.Mesh(this._geo('zpup_sph', () => new THREE.SphereGeometry(0.008, 6, 6)), eyeCoreMat);
                        pup.position.set(sx * 0.050, 0.026, 0.135);
                        hg.add(sock, eye, pup);
                    }

                    // Hinged U-shaped lower mandible + bloody mouth interior + jagged teeth!
                    const jaw = new THREE.Mesh(jawGeo, skinMat);
                    jaw.position.set(0, -0.085, 0.022);
                    jaw.rotation.x = 0.24;
                    jaws.push(jaw);
                    const mouthCav = new THREE.Mesh(this._geo('zmouth_sph', () => new THREE.SphereGeometry(0.055, 8, 6)), fleshMat);
                    mouthCav.scale.set(1.15, 0.65, 0.65);
                    mouthCav.position.set(0, -0.068, 0.098);
                    hg.add(jaw, mouthCav);

                    for (let ti = -2; ti <= 2; ti++) {
                        const tx = ti * 0.019;
                        const tz = 0.124 - Math.abs(ti) * 0.006;
                        const ut = new THREE.Mesh(toothGeo, boneMat);
                        ut.position.set(tx, -0.056, tz);
                        ut.rotation.x = Math.PI;
                        const lt = new THREE.Mesh(toothGeo, boneMat);
                        lt.position.set(tx, -0.011, tz - 0.026);
                        hg.add(ut);
                        jaw.add(lt);
                    }

                    // Bespoke creature silhouettes (zero boxes!)
                    if (idLow.includes('witch')) {
                        const hatMat = this._mat('witch_hat', () => new THREE.MeshStandardMaterial({ color: 0x1a0d33, roughness: 0.72 }));
                        const bandMat = this._mat('witch_band', () => new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.25 }));
                        const brim = new THREE.Mesh(this._geo('what_brim', () => new THREE.CylinderGeometry(0.30, 0.31, 0.028, 16)), hatMat);
                        brim.position.y = 0.145;
                        const band = new THREE.Mesh(this._geo('what_band', () => new THREE.CylinderGeometry(0.155, 0.165, 0.045, 14)), bandMat);
                        band.position.y = 0.175;
                        const cone = new THREE.Mesh(this._geo('what_cone', () => new THREE.ConeGeometry(0.155, 0.44, 12)), hatMat);
                        cone.position.set(0, 0.39, -0.03);
                        cone.rotation.x = -0.18;
                        hg.add(brim, band, cone);
                    }
                    if (idLow.includes('wolf') || idLow.includes('lycan') || idLow.includes('tiger') || idLow.includes('bear')) {
                        const isBear = idLow.includes('bear') && !idLow.includes('wolf');
                        const earGeo = isBear
                            ? this._geo('bear_ear', () => new THREE.SphereGeometry(0.055, 8, 8))
                            : this._geo('beast_ear', () => new THREE.ConeGeometry(0.055, 0.16, 7));
                        for (const s of [-1, 1]) {
                            const ear = new THREE.Mesh(earGeo, skinMat);
                            ear.position.set(s * 0.105, isBear ? 0.16 : 0.20, 0.01);
                            if (!isBear) ear.rotation.z = -s * 0.28;
                            hg.add(ear);
                        }
                        const snout = new THREE.Mesh(this._geo('beast_snout_cyl', () => new THREE.CylinderGeometry(0.048, 0.072, 0.15, 10)), skinMat);
                        snout.rotation.x = Math.PI * 0.5;
                        snout.position.set(0, -0.032, 0.17);
                        const noseTip = new THREE.Mesh(this._geo('beast_nose_sph', () => new THREE.SphereGeometry(0.028, 8, 6)), bootMat);
                        noseTip.position.set(0, -0.018, 0.245);
                        hg.add(snout, noseTip);
                    }
                    if (idLow.includes('pig') || idLow.includes('ogre') || idLow.includes('boar')) {
                        const tGeo = this._geo('tusk', () => new THREE.ConeGeometry(0.025, 0.14, 7));
                        for (const s of [-1, 1]) {
                            const t = new THREE.Mesh(tGeo, boneMat);
                            t.position.set(s * 0.072, -0.055, 0.175);
                            t.rotation.set(0.45, 0, -s * 0.22);
                            hg.add(t);
                        }
                    }
                    if (bs.helmet || isArmored) {
                        const helmDome = this._tagHitbox(
                            new THREE.Mesh(this._geo('zhelm_dome', () => new THREE.SphereGeometry(0.168, 14, 10, 0, TAU, 0, Math.PI * 0.58)), steelMat),
                            entity, 'head'
                        );
                        helmDome.position.set(0, 0.045, -0.005);
                        const helmRim = new THREE.Mesh(this._geo('zhelm_rim', () => new THREE.CylinderGeometry(0.170, 0.178, 0.032, 16)), trimMat);
                        helmRim.position.set(0, 0.055, -0.005);
                        hg.add(helmDome, helmRim);
                    }
                    if (bs.horns || spec.isBoss) {
                        const hornMat = this._mat('horn_mat', () => new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.35, metalness: 0.3 }));
                        const hGeo = this._geo('horn', () => new THREE.ConeGeometry(0.040, 0.26, 7));
                        for (const s of [-1, 1]) {
                            const hMesh = new THREE.Mesh(hGeo, hornMat);
                            hMesh.position.set(s * 0.118, 0.19, -0.01);
                            hMesh.rotation.set(-0.18, 0, -s * 0.42);
                            hg.add(hMesh);
                        }
                    }
                    headGroup.add(hg);
                }
            }
            bodyPivot.add(headGroup);

            // ================================================================
            // 3. SCULPTED ANATOMICAL ARMS & CLAWED HANDS (ZERO BOXES)
            // ================================================================
            const uArmGeo = this._geo('zuarm_lathe2', () => lathe([
                [0.048, -0.25], [0.062, -0.13], [0.068, 0.0]
            ], 10));
            const fArmGeo = this._geo('zfarm_lathe2', () => lathe([
                [0.034, -0.23], [0.048, -0.10], [0.052, 0.0]
            ], 10));
            const palmGeo = this._geo('zpalm_sph', () => {
                const g = new THREE.SphereGeometry(0.042, 8, 6);
                g.scale(0.85, 1.05, 0.48);
                return g;
            });
            const fingerGeo = this._geo('zfinger_cap', () => new THREE.CapsuleGeometry(0.008, 0.045, 3, 5));

            const buildArmGeometry = (armGroup) => {
                const upperArm = this._tagHitbox(new THREE.Mesh(uArmGeo, shirtMat), entity, 'limb');
                const cuff = new THREE.Mesh(this._geo('zcuff', () => new THREE.CylinderGeometry(0.058, 0.062, 0.038, 10)), trimMat);
                cuff.position.y = -0.235;
                const elbow = new THREE.Mesh(this._geo('zelbow', () => new THREE.SphereGeometry(0.052, 8, 6)), skinMat);
                elbow.position.y = -0.255;

                const forePivot = new THREE.Group();
                forePivot.position.set(0, -0.255, 0);
                forePivot.rotation.x = -0.24;
                const foreArm = this._tagHitbox(new THREE.Mesh(fArmGeo, skinMat), entity, 'limb');
                const hand = new THREE.Mesh(palmGeo, skinMat);
                hand.position.set(0, -0.245, 0.01);
                forePivot.add(foreArm, hand);

                for (let f = -1; f <= 1; f++) {
                    const fg = new THREE.Mesh(fingerGeo, bs.razorClaws ? eyeMat : boneMat);
                    fg.position.set(f * 0.021, -0.295, 0.022);
                    fg.rotation.x = -0.45;
                    forePivot.add(fg);
                }
                if (bs.razorClaws) {
                    const claw = new THREE.Mesh(this._geo('claw', () => new THREE.ConeGeometry(0.036, 0.25, 6)), eyeMat);
                    claw.position.set(0, -0.35, 0.035);
                    claw.rotation.x = Math.PI - 0.3;
                    forePivot.add(claw);
                }
                armGroup.add(upperArm, cuff, elbow, forePivot);
                return forePivot;
            };

            const armL = new THREE.Group();
            armL.position.set(-shoulderX - 0.02, 0.50, 0);
            let forearmL = null;
            if (!bs.missingLeftArm) {
                forearmL = buildArmGeometry(armL);
                if (bs.riotShield) {
                    const shieldMat = this._mat('riot_shield', () => new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.32, metalness: 0.86 }));
                    const shield = this._tagHitbox(new THREE.Mesh(this._geo('shield_geo', () => new THREE.BoxGeometry(0.60, 0.98, 0.08)), shieldMat), entity, 'shield');
                    shield.position.set(-0.08, -0.34, 0.24);
                    shield.rotation.x = 1.25;
                    const viewport = new THREE.Mesh(this._geo('shield_vp', () => new THREE.BoxGeometry(0.38, 0.14, 0.095)),
                        this._mat('shield_vp_m', () => new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 })));
                    viewport.position.set(-0.08, -0.14, 0.32);
                    viewport.rotation.x = 1.25;
                    armL.add(shield, viewport);
                }
            }
            armL.rotation.x = -1.25;

            const armR = new THREE.Group();
            armR.position.set(shoulderX + 0.02, 0.50, 0);
            let forearmR = null;
            if (bs.giantClubArm) {
                const clubMat = this._mat('club_mat_' + key, () => new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.52, metalness: 0.45 }));
                const club = this._tagHitbox(
                    new THREE.Mesh(this._geo('club_arm_lathe', () => lathe([[0.06, -0.78], [0.15, -0.50], [0.11, -0.22], [0.075, 0]], 10)), clubMat),
                    entity, 'limb'
                );
                club.position.set(0.05, 0, 0.02);
                const cSpike1 = new THREE.Mesh(this._geo('cspike', () => new THREE.ConeGeometry(0.032, 0.14, 6)), steelMat);
                cSpike1.position.set(0.15, -0.58, 0.02); cSpike1.rotation.z = -Math.PI * 0.5;
                const cSpike2 = cSpike1.clone(); cSpike2.position.set(-0.05, -0.64, 0.12); cSpike2.rotation.set(Math.PI * 0.5, 0, 0);
                armR.add(club, cSpike1, cSpike2);
            } else {
                forearmR = buildArmGeometry(armR);
                if (idLow.includes('witch')) {
                    const staff = new THREE.Mesh(this._geo('wstaff', () => new THREE.CylinderGeometry(0.022, 0.026, 1.25, 7)), trimMat);
                    staff.position.set(0, -0.45, 0.18);
                    staff.rotation.x = 1.25;
                    const orb = new THREE.Mesh(this._geo('worb', () => new THREE.OctahedronGeometry(0.095, 1)), eyeMat);
                    orb.position.set(0, -0.62, 0.78);
                    armR.add(staff, orb);
                }
            }
            armR.rotation.x = -1.35;
            bodyPivot.add(armL, armR);

            if (bs.extraArms && bs.extraArms >= 2) {
                const eL = new THREE.Group();
                eL.position.set(-shoulderX, 0.24, 0.04);
                buildArmGeometry(eL);
                eL.rotation.set(-0.95, 0, -0.35);

                const eR = new THREE.Group();
                eR.position.set(shoulderX, 0.24, 0.04);
                buildArmGeometry(eR);
                eR.rotation.set(-0.95, 0, 0.35);
                bodyPivot.add(eL, eR);
            }

            // ================================================================
            // 4. SCULPTED ANATOMICAL LEGS & CONTOURED BOOTS (ZERO BOXES)
            // ================================================================
            const thighGeo = this._geo('zthigh_lathe2', () => lathe([
                [0.068, -0.36], [0.088, -0.16], [0.096, 0.0]
            ], 12));
            const shinGeo = this._geo('zshin_lathe2', () => lathe([
                [0.052, -0.36], [0.072, -0.14], [0.066, 0.0]
            ], 12));
            const kneeGeo = this._geo('zknee_sph', () => {
                const g = new THREE.SphereGeometry(0.068, 9, 7);
                g.scale(0.95, 1.05, 1.05);
                return g;
            });
            const bootAnkleGeo = this._geo('zboot_ankle', () => lathe([[0.066, 0], [0.070, 0.11], [0.060, 0.14]], 12));
            const bootToeGeo = this._geo('zboot_vamp', () => new THREE.CapsuleGeometry(0.062, 0.11, 5, 10));

            const buildLegGroup = (xPos) => {
                const lg = new THREE.Group();
                lg.position.set(xPos, 0.80, 0);
                const thigh = this._tagHitbox(new THREE.Mesh(thighGeo, pantsMat), entity, 'limb');
                const knee = new THREE.Mesh(kneeGeo, trimMat);
                knee.position.set(0, -0.36, 0.015);
                const shin = this._tagHitbox(new THREE.Mesh(shinGeo, pantsMat), entity, 'limb');
                shin.position.y = -0.37;

                const bootAnkle = new THREE.Mesh(bootAnkleGeo, bootMat);
                bootAnkle.position.y = -0.78;
                const bootVamp = new THREE.Mesh(bootToeGeo, bootMat);
                bootVamp.rotation.x = Math.PI * 0.5;
                bootVamp.scale.set(1.05, 1.0, 0.72);
                bootVamp.position.set(0, -0.75, 0.055);
                lg.add(thigh, knee, shin, bootAnkle, bootVamp);
                return lg;
            };

            const legSpread = isBroad ? 0.16 : 0.135;
            const legL = buildLegGroup(-legSpread);
            const legR = buildLegGroup(legSpread);
            if (!bs.missingLegs && !isFloating) {
                root.add(legL, legR);
            } else {
                legL.visible = false;
                legR.visible = false;
            }

            const parts = { root, bodyPivot, headGroup, armL, armR, legL, legR, haloGroup, forearmL, forearmR, jaws };
            BO.ArsenalDetails.undeadDetails(parts, spec, chestW, chestD);
            return parts;
        };

        // ====================================================================
        // SCULPTED QUADRUPEDS (HELLHOUNDS / CERBERUS)
        // ====================================================================
        CM._buildQuadrupedFromSpec = function (root, spec, entity) {
            const bs = spec.bodySpec || {};
            const key = spec.id || 'hound';
            const furMat = this._mat('qfur_' + key, () => new THREE.MeshStandardMaterial({
                color: bs.skinColor || 0x221715,
                roughness: 0.78,
                emissive: bs.shirtColor || 0x7c1d0c,
                emissiveIntensity: 0.35
            }));
            const boneMat = this._mat('zbone', () => new THREE.MeshStandardMaterial({ color: 0xded9c8, roughness: 0.52 }));
            const eyeMat = this._mat('qeye_' + key, () => new THREE.MeshBasicMaterial({ color: bs.eyeColor || 0xff7b00 }));

            const bodyPivot = new THREE.Group();
            bodyPivot.position.y = 0.54;
            bodyPivot.userData.baseY = 0.54;
            root.add(bodyPivot);

            const bodyGeo = this._geo('qhound_body2', () => {
                const g = lathe([
                    [0.01, -0.44], [0.15, -0.34], [0.13, -0.14], [0.19, 0.10], [0.21, 0.28], [0.14, 0.42], [0.01, 0.46]
                ], 14, 0.92);
                g.rotateX(Math.PI * 0.5);
                return g;
            });
            const bodyMesh = this._tagHitbox(new THREE.Mesh(bodyGeo, furMat), entity, 'torso');
            const tail = new THREE.Mesh(this._geo('hound_tail', () => new THREE.CylinderGeometry(0.022, 0.048, 0.44, 7)), furMat);
            tail.position.set(0, 0.10, -0.48);
            tail.rotation.x = 0.65;
            bodyPivot.add(bodyMesh, tail);

            for (let s = 0; s < 4; s++) {
                const sp = new THREE.Mesh(this._geo('hound_sp', () => new THREE.ConeGeometry(0.03, 0.12, 6)), boneMat);
                sp.position.set(0, 0.21, 0.26 - s * 0.18);
                sp.rotation.x = -0.35;
                bodyPivot.add(sp);
            }

            const headGroup = new THREE.Group();
            headGroup.position.set(0, 0.16, 0.46);
            const headCount = 1 + (bs.extraHeads || 0);
            const jaws = [];
            for (let h = 0; h < headCount; h++) {
                const offsetX = headCount === 1 ? 0 : (h - (headCount - 1) * 0.5) * 0.30;
                const hg = new THREE.Group();
                hg.position.set(offsetX, h === 1 && headCount === 3 ? 0.08 : 0, 0);
                const headMesh = this._tagHitbox(new THREE.Mesh(this._geo('qhound_skull', () => new THREE.SphereGeometry(0.135, 10, 8)), furMat), entity, 'head');
                headMesh.scale.set(0.92, 0.90, 1.12);
                const snout = new THREE.Mesh(this._geo('qhound_snout', () => new THREE.CylinderGeometry(0.042, 0.072, 0.19, 9)), furMat);
                snout.rotation.x = Math.PI * 0.5;
                snout.position.set(0, -0.015, 0.17);
                const jaw = new THREE.Mesh(this._geo('qhound_jaw', () => new THREE.CapsuleGeometry(0.032, 0.12, 4, 6)), furMat);
                jaw.rotation.x = Math.PI * 0.5 + 0.28;
                jaw.position.set(0, -0.075, 0.15);
                jaws.push(jaw);
                const fangL = new THREE.Mesh(this._geo('hfang', () => new THREE.ConeGeometry(0.015, 0.055, 6)), boneMat);
                fangL.position.set(-0.040, -0.06, 0.23); fangL.rotation.x = Math.PI;
                const fangR = fangL.clone(); fangR.position.x = 0.040;
                const earL = new THREE.Mesh(this._geo('hound_ear', () => new THREE.ConeGeometry(0.045, 0.14, 6)), furMat);
                earL.position.set(-0.085, 0.14, -0.04); earL.rotation.z = 0.22;
                const earR = earL.clone(); earR.position.x = 0.085; earR.rotation.z = -0.22;
                const eyeL = new THREE.Mesh(this._geo('eye_sph', () => new THREE.SphereGeometry(0.022, 6, 6)), eyeMat);
                eyeL.position.set(-0.060, 0.04, 0.118);
                const eyeR = eyeL.clone(); eyeR.position.x = 0.060;
                hg.add(headMesh, snout, jaw, fangL, fangR, earL, earR, eyeL, eyeR);
                headGroup.add(hg);
            }
            bodyPivot.add(headGroup);

            const upperGeo = this._geo('hound_uleg', () => new THREE.CylinderGeometry(0.065, 0.05, 0.24, 8));
            const lowerGeo = this._geo('hound_lleg', () => new THREE.CylinderGeometry(0.048, 0.04, 0.24, 8));
            const pawGeo = this._geo('hound_paw_sph', () => new THREE.SphereGeometry(0.058, 8, 6));
            const makeLeg = (x, z) => {
                const g = new THREE.Group();
                g.position.set(x, 0.44, z);
                const u = this._tagHitbox(new THREE.Mesh(upperGeo, furMat), entity, 'limb'); u.position.y = -0.11;
                const l = new THREE.Mesh(lowerGeo, furMat); l.position.y = -0.32;
                const p = new THREE.Mesh(pawGeo, furMat);
                p.scale.set(0.95, 0.55, 1.35);
                p.position.set(0, -0.43, 0.03);
                g.add(u, l, p);
                root.add(g);
                return g;
            };
            const armL = makeLeg(-0.17, 0.28);
            const armR = makeLeg(0.17, 0.28);
            const legL = makeLeg(-0.15, -0.28);
            const legR = makeLeg(0.15, -0.28);

            return { root, bodyPivot, headGroup, armL, armR, legL, legR, tail, jaws, haloGroup: null, isQuadruped: true };
        };

        // ====================================================================
        // SCULPTED ALLIED GUARD DOG
        // ====================================================================
        CM.buildGuardDog = function () {
            const root = new THREE.Group();
            const coatMat = new THREE.MeshStandardMaterial({ color: 0x3f2e21, roughness: 0.78 });
            const vestMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.55 });
            const collarMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

            const bodyPivot = new THREE.Group();
            bodyPivot.position.y = 0.48;
            bodyPivot.userData.baseY = 0.48;
            root.add(bodyPivot);

            const bodyGeo = this._geo('gdog_body', () => {
                const g = lathe([[0.01, -0.36], [0.14, -0.26], [0.12, -0.08], [0.18, 0.16], [0.15, 0.34], [0.01, 0.38]], 14, 0.90);
                g.rotateX(Math.PI * 0.5);
                return g;
            });
            const torso = new THREE.Mesh(bodyGeo, coatMat);
            const vest = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.185, 0.42, 12), vestMat);
            vest.rotation.x = Math.PI * 0.5;
            vest.position.set(0, 0.03, 0.04);
            const collar = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 8, 16), collarMat);
            collar.position.set(0, 0.06, 0.30);
            bodyPivot.add(torso, vest, collar);

            const headGroup = new THREE.Group();
            headGroup.position.set(0, 0.14, 0.42);
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), coatMat);
            head.scale.set(0.92, 0.90, 1.10);
            const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.068, 0.16, 9), coatMat);
            snout.rotation.x = Math.PI * 0.5;
            snout.position.set(0, -0.02, 0.15);
            const earL = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 6), coatMat);
            earL.position.set(-0.07, 0.13, -0.03);
            const earR = earL.clone(); earR.position.x = 0.07;
            const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.020, 6, 6), eyeMat);
            eyeL.position.set(-0.05, 0.04, 0.11);
            const eyeR = eyeL.clone(); eyeR.position.x = 0.05;
            headGroup.add(head, snout, earL, earR, eyeL, eyeR);
            bodyPivot.add(headGroup);

            const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.040, 0.28, 6), coatMat);
            tail.position.set(0, 0.12, -0.40);
            tail.rotation.x = 0.5;
            bodyPivot.add(tail);

            const legGeo = new THREE.CylinderGeometry(0.048, 0.036, 0.40, 8);
            const pawGeo = new THREE.SphereGeometry(0.052, 8, 6);
            const makeLeg = (x, z) => {
                const g = new THREE.Group();
                g.position.set(x, 0.40, z);
                const m = new THREE.Mesh(legGeo, coatMat); m.position.y = -0.19;
                const p = new THREE.Mesh(pawGeo, coatMat); p.scale.set(0.95, 0.55, 1.3); p.position.set(0, -0.39, 0.02);
                g.add(m, p);
                root.add(g);
                return g;
            };
            const armL = makeLeg(-0.13, 0.25);
            const armR = makeLeg(0.13, 0.25);
            const legL = makeLeg(-0.13, -0.25);
            const legR = makeLeg(0.13, -0.25);

            return { root, bodyPivot, headGroup, armL, armR, legL, legR, tail, jaws: null, haloGroup: null, isQuadruped: true };
        };
    }

    hookZombieBuilder();
})(window);
