/* ============================================================================
   BLACKOUT OPS — High-Detail Articulated 3D Character, 70-Zombie, 10-Boss & Bot Mesh Builder
   Millimeter-precision procedural undead anatomy: sculpted craniums, cheekbones,
   sunken eye sockets with glowing cores, hinged jaws with bone teeth, neck tendons,
   tapered ribcage/waist, torn tactical fatigues, articulated elbow/knee joints,
   clawed hands, combat boots, bespoke creature builds, and expressive shambling.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    class CharacterMeshBuilder {
        constructor() {
            this.geos = {};
            this.mats = {};
        }

        _geo(key, creator) {
            if (!this.geos[key]) this.geos[key] = creator();
            return this.geos[key];
        }

        _mat(key, creator) {
            if (!this.mats[key]) this.mats[key] = creator();
            return this.mats[key];
        }

        _tagHitbox(mesh, entity, hitbox) {
            mesh.userData.entity = entity;
            mesh.userData.hitbox = hitbox;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            return mesh;
        }

        buildZombieFromSpec(spec, entity) {
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
                    roughness: isSlime ? 0.18 : 0.78,
                    metalness: isSlime ? 0.12 : 0.04,
                    transparent: isSlime || isGhost,
                    opacity: isSlime ? 0.78 : (isGhost ? 0.82 : 1.0),
                    emissive: bs.glowingRibs ? bs.glowingRibs : (isGhost ? (bs.eyeColor || 0x38bdf8) : 0x000000),
                    emissiveIntensity: bs.glowingRibs ? 0.28 : (isGhost ? 0.20 : 0)
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
                    roughness: isArmored ? 0.30 : 0.86,
                    metalness: isArmored ? 0.84 : 0.08,
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
            const bootMat = this._mat('zboot', () => new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.72, metalness: 0.25 }));
            const fleshMat = this._mat('zflesh', () => new THREE.MeshStandardMaterial({ color: 0x5c1414, roughness: 0.55, metalness: 0.08 }));
            const boneMat = this._mat('zbone', () => new THREE.MeshStandardMaterial({ color: 0xded9c8, roughness: 0.52 }));
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

            // ================================================================
            // 1. MULTI-PART SCULPTED ANATOMICAL TORSO & TACTICAL UNIFORM
            // ================================================================
            const isBroad = bs.torsoShape === 'broad' || isArmored || spec.isBoss;
            const isLean = bs.torsoShape === 'lean' || isSkeleton;
            const chestW = isBroad ? 0.56 : (isLean ? 0.36 : 0.46);
            const chestD = isBroad ? 0.32 : (isLean ? 0.20 : 0.25);

            if (bs.torsoShape === 'bloated') {
                // Organic multi-lobe grotesque bloated body + upper chest hump
                const belly = this._tagHitbox(
                    new THREE.Mesh(this._geo('torso_bloat_belly', () => new THREE.SphereGeometry(0.37, 12, 10)), skinMat),
                    entity, 'torso'
                );
                belly.scale.set(1.08, 0.96, 0.98);
                belly.position.set(0, 0.22, 0.04);
                const upper = this._tagHitbox(
                    new THREE.Mesh(this._geo('torso_bloat_up', () => new THREE.BoxGeometry(0.48, 0.30, 0.28)), shirtMat),
                    entity, 'torso'
                );
                upper.position.set(0, 0.44, -0.02);
                // Torn shirt flaps clinging to the swollen belly
                const flapL = new THREE.Mesh(this._geo('zflap', () => new THREE.BoxGeometry(0.14, 0.36, 0.06)), shirtMat);
                flapL.position.set(-0.24, 0.26, 0.26); flapL.rotation.z = 0.22;
                const flapR = flapL.clone(); flapR.position.x = 0.24; flapR.rotation.z = -0.22;
                bodyPivot.add(belly, upper, flapL, flapR);
            } else if (bs.torsoShape === 'floating' || isFloating) {
                // Layered spectral cloak torso + tattered floating lower robe tail
                const chest = this._tagHitbox(
                    new THREE.Mesh(this._geo('torso_float_c', () => new THREE.CylinderGeometry(0.24, 0.14, 0.50, 8)), shirtMat),
                    entity, 'torso'
                );
                chest.position.y = 0.34;
                const cloakTail = new THREE.Mesh(this._geo('torso_float_tail', () => new THREE.ConeGeometry(0.28, 0.64, 8)), shirtMat);
                cloakTail.rotation.x = Math.PI;
                cloakTail.position.y = -0.06;
                bodyPivot.add(chest, cloakTail);
            } else {
                // Realistic V-tapered humanoid chest + narrower abdomen + pelvis
                const chestGeoKey = isBroad ? 'chest_broad' : (isLean ? 'chest_lean' : 'chest_std');
                const chest = this._tagHitbox(
                    new THREE.Mesh(this._geo(chestGeoKey, () => new THREE.BoxGeometry(chestW, 0.34, chestD)), shirtMat),
                    entity, 'torso'
                );
                chest.position.y = 0.41;

                const waistGeoKey = isBroad ? 'waist_broad' : (isLean ? 'waist_lean' : 'waist_std');
                const waist = this._tagHitbox(
                    new THREE.Mesh(this._geo(waistGeoKey, () => new THREE.BoxGeometry(chestW * 0.82, 0.24, chestD * 0.84)), shirtMat),
                    entity, 'torso'
                );
                waist.position.y = 0.16;

                const pelvis = new THREE.Mesh(this._geo('zpelvis_' + chestGeoKey, () => new THREE.BoxGeometry(chestW * 0.86, 0.14, chestD * 0.86)), pantsMat);
                pelvis.position.y = 0.0;

                // Torn jacket opening revealing decayed chest wound & pale ribs underneath!
                const wound = new THREE.Mesh(this._geo('zwound', () => new THREE.BoxGeometry(chestW * 0.36, 0.24, 0.03)), fleshMat);
                wound.position.set(0, 0.37, chestD * 0.5 + 0.005);
                bodyPivot.add(chest, waist, pelvis, wound);

                for (let r = 0; r < 3; r++) {
                    const rib = new THREE.Mesh(this._geo('zrib_bone', () => new THREE.BoxGeometry(chestW * 0.32, 0.022, 0.035)), boneMat);
                    rib.position.set(0, 0.30 + r * 0.065, chestD * 0.5 + 0.012);
                    bodyPivot.add(rib);
                }

                // Tactical jacket collar flaps & diagonal ammo webbing strap
                const collarL = new THREE.Mesh(this._geo('zcollar', () => new THREE.BoxGeometry(0.11, 0.10, 0.06)), shirtMat);
                collarL.position.set(-0.11, 0.57, chestD * 0.36); collarL.rotation.set(0.25, 0.3, -0.25);
                const collarR = collarL.clone(); collarR.position.x = 0.11; collarR.rotation.set(0.25, -0.3, 0.25);
                const strap = new THREE.Mesh(this._geo('zstrap', () => new THREE.BoxGeometry(0.065, 0.56, chestD + 0.03)), trimMat);
                strap.position.set(0, 0.34, 0);
                strap.rotation.z = 0.42;
                bodyPivot.add(collarL, collarR, strap);

                // Armored breastplate & tactical chest rig for armored/broad/boss zombies
                if (isArmored) {
                    const plate = new THREE.Mesh(this._geo('zplate', () => new THREE.BoxGeometry(chestW * 0.90, 0.32, chestD + 0.055)), steelMat);
                    plate.position.set(0, 0.41, 0.01);
                    const sternum = new THREE.Mesh(this._geo('zsternum', () => new THREE.BoxGeometry(0.10, 0.28, chestD + 0.085)), trimMat);
                    sternum.position.set(0, 0.41, 0.015);
                    bodyPivot.add(plate, sternum);
                }
            }

            // Duty Belt + Metallic Buckle + Side Tactical Pouches
            const belt = new THREE.Mesh(this._geo('zbelt_main', () => new THREE.BoxGeometry(chestW * 0.92, 0.075, chestD * 0.96)), trimMat);
            belt.position.set(0, 0.05, 0);
            const buckle = new THREE.Mesh(this._geo('zbuckle', () => new THREE.BoxGeometry(0.09, 0.085, 0.04)), steelMat);
            buckle.position.set(0, 0.05, chestD * 0.48 + 0.01);
            const pouchL = new THREE.Mesh(this._geo('zpouch', () => new THREE.BoxGeometry(0.08, 0.11, 0.09)), trimMat);
            pouchL.position.set(-chestW * 0.45, 0.04, 0.04);
            const pouchR = pouchL.clone(); pouchR.position.x = chestW * 0.45;
            bodyPivot.add(belt, buckle, pouchL, pouchR);

            // Sculpted Shoulder Deltoid Caps / Heavy Armored Pauldrons
            const shoulderX = chestW * 0.5 + 0.06;
            const shGeo = isArmored
                ? this._geo('zpauldron_arm', () => new THREE.BoxGeometry(0.19, 0.15, 0.24))
                : this._geo('zdeltoid', () => new THREE.SphereGeometry(0.095, 8, 7));
            const shMat = isArmored ? steelMat : shirtMat;
            const shL = new THREE.Mesh(shGeo, shMat);
            shL.position.set(-shoulderX, 0.53, 0);
            const shR = shL.clone(); shR.position.x = shoulderX;
            bodyPivot.add(shL, shR);

            // Muscular Neck + Dark Exposed Throat Tendons
            if (!bs.headless) {
                const neck = new THREE.Mesh(this._geo('zneck', () => new THREE.CylinderGeometry(0.072, 0.092, 0.15, 8)), skinMat);
                neck.position.set(0, 0.62, 0.01);
                const tendonL = new THREE.Mesh(this._geo('ztendon', () => new THREE.CylinderGeometry(0.018, 0.022, 0.14, 5)), fleshMat);
                tendonL.position.set(-0.042, 0.62, 0.058); tendonL.rotation.z = 0.14;
                const tendonR = tendonL.clone(); tendonR.position.x = 0.042; tendonR.rotation.z = -0.14;
                bodyPivot.add(neck, tendonL, tendonR);
            }

            // Magical / Boss Emissive Ground Aura + Chest Energy Core
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
                    const core = new THREE.Mesh(
                        this._geo('zboss_core', () => new THREE.OctahedronGeometry(0.11, 0)),
                        eyeMat
                    );
                    core.position.set(0, 0.40, chestD * 0.5 + 0.045);
                    bodyPivot.add(core);
                }
            }

            // Glowing Ribcage / Radioactive Core
            if (bs.glowingRibs) {
                const ribGlowMat = this._mat('zrib_g_' + key, () => new THREE.MeshBasicMaterial({ color: bs.glowingRibs }));
                for (let r = 0; r < 3; r++) {
                    const rib = new THREE.Mesh(this._geo('rib_glow', () => new THREE.BoxGeometry(chestW * 0.78, 0.038, chestD + 0.04)), ribGlowMat);
                    rib.position.set(0, 0.24 + r * 0.10, 0.01);
                    bodyPivot.add(rib);
                }
            }

            // Glowing Back Acid/Bile Sac
            if (bs.backSac) {
                const sacMat = this._mat('zsac_' + key, () => new THREE.MeshStandardMaterial({
                    color: bs.backSac, emissive: bs.backSac, emissiveIntensity: 0.72, roughness: 0.26
                }));
                const sac = this._tagHitbox(
                    new THREE.Mesh(this._geo('back_sac', () => new THREE.SphereGeometry(0.25, 10, 10)), sacMat),
                    entity, 'torso'
                );
                sac.scale.set(1.05, 1.15, 0.90);
                sac.position.set(0, 0.40, -(chestD * 0.5 + 0.14));
                const sacSub = new THREE.Mesh(this._geo('back_sac_sub', () => new THREE.SphereGeometry(0.13, 8, 8)), sacMat);
                sacSub.position.set(0.16, 0.28, -(chestD * 0.5 + 0.12));
                bodyPivot.add(sac, sacSub);
            }

            // Jagged Bone Spikes on Shoulders & Spine
            if (bs.boneSpikes || spec.isBoss) {
                const spGeo = this._geo('spike', () => new THREE.ConeGeometry(0.055, 0.28, 6));
                const spL = new THREE.Mesh(spGeo, boneMat);
                spL.position.set(-shoulderX - 0.02, 0.66, 0); spL.rotation.z = 0.45;
                const spR = new THREE.Mesh(spGeo, boneMat);
                spR.position.set(shoulderX + 0.02, 0.66, 0); spR.rotation.z = -0.45;
                bodyPivot.add(spL, spR);
            }

            // Sculpted Bat/Demon Wings
            if (bs.wings) {
                const wingMat = this._mat('zwing_' + key, () => new THREE.MeshStandardMaterial({
                    color: bs.shirtColor || 0x450a0a, roughness: 0.65, side: THREE.DoubleSide
                }));
                const wGeo = this._geo('wing_mem', () => new THREE.BoxGeometry(0.58, 0.44, 0.035));
                const wBoneGeo = this._geo('wing_bone', () => new THREE.CylinderGeometry(0.022, 0.028, 0.62, 6));
                for (const s of [-1, 1]) {
                    const wg = new THREE.Group();
                    wg.position.set(s * 0.22, 0.48, -chestD * 0.5 - 0.04);
                    wg.rotation.set(0.14, s * 0.48, -s * 0.22);
                    const mem = new THREE.Mesh(wGeo, wingMat); mem.position.x = s * 0.30;
                    const wb = new THREE.Mesh(wBoneGeo, boneMat); wb.rotation.z = Math.PI * 0.5; wb.position.set(s * 0.30, 0.21, 0);
                    wg.add(mem, wb);
                    bodyPivot.add(wg);
                }
            }

            // Back Shadow Tentacles
            if (bs.tentacles) {
                const tMat = this._mat('ztent_' + key, () => new THREE.MeshStandardMaterial({ color: 0x1e1b4b, emissive: 0x581c87, emissiveIntensity: 0.42 }));
                const tGeo = this._geo('tentacle', () => new THREE.CylinderGeometry(0.025, 0.062, 0.72, 6));
                for (let t = 0; t < 4; t++) {
                    const ten = new THREE.Mesh(tGeo, tMat);
                    ten.position.set((t - 1.5) * 0.15, 0.36, -chestD * 0.5 - 0.14);
                    ten.rotation.set(-0.58, 0, (t - 1.5) * 0.24);
                    bodyPivot.add(ten);
                }
            }

            // Beast Tail (Werewolf, Tigerman, Bear, ManBearPig)
            if (idLow.includes('wolf') || idLow.includes('lycan') || idLow.includes('tiger') || idLow.includes('demon')) {
                const tail = new THREE.Mesh(this._geo('ztail', () => new THREE.CylinderGeometry(0.025, 0.055, 0.52, 6)), skinMat);
                tail.position.set(0, 0.02, -chestD * 0.5 - 0.16);
                tail.rotation.x = -0.85;
                bodyPivot.add(tail);
            }

            // Orbiting Crystal Halo
            let haloGroup = null;
            if (bs.haloCrystal) {
                haloGroup = new THREE.Group();
                haloGroup.position.set(0, 0.92, 0);
                const cMat = this._mat('zcrys_' + key, () => new THREE.MeshBasicMaterial({ color: bs.haloCrystal }));
                const cGeo = this._geo('crystal', () => new THREE.OctahedronGeometry(0.10, 0));
                for (let c = 0; c < 4; c++) {
                    const a = (c / 4) * Math.PI * 2;
                    const shard = new THREE.Mesh(cGeo, cMat);
                    shard.position.set(Math.cos(a) * 0.54, 0.05, Math.sin(a) * 0.54);
                    haloGroup.add(shard);
                }
                bodyPivot.add(haloGroup);
            }

            // ================================================================
            // 2. MILLIMETER-PRECISION SCULPTED UNDEAD SKULL & CREATURE HEADS
            // ================================================================
            const headGroup = new THREE.Group();
            headGroup.position.set(0, 0.77, 0.04);
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
                for (let h = 0; h < headCount; h++) {
                    const hx = headCount === 1 ? 0 : (h === 0 ? -0.17 : 0.17);
                    const hg = new THREE.Group();
                    hg.position.set(hx, 0, 0);

                    // Sculpted rounded cranium dome + chiseled upper face + cheekbones
                    const cranium = this._tagHitbox(
                        new THREE.Mesh(this._geo('zcranium', () => new THREE.SphereGeometry(0.145, 10, 8)), skinMat),
                        entity, 'head'
                    );
                    cranium.scale.set(0.95, 1.05, 1.02);
                    cranium.position.set(0, 0.035, -0.005);

                    const faceBlock = this._tagHitbox(
                        new THREE.Mesh(this._geo('zface', () => new THREE.BoxGeometry(0.22, 0.17, 0.21)), skinMat),
                        entity, 'head'
                    );
                    faceBlock.position.set(0, -0.025, 0.035);

                    // Pronounced cheekbones + overhanging brow ridge + nasal bridge
                    const brow = new THREE.Mesh(this._geo('zbrow2', () => new THREE.BoxGeometry(0.245, 0.042, 0.075)), skinMat);
                    brow.position.set(0, 0.052, 0.125);
                    const cheekL = new THREE.Mesh(this._geo('zcheek', () => new THREE.BoxGeometry(0.068, 0.055, 0.06)), skinMat);
                    cheekL.position.set(-0.088, -0.025, 0.118);
                    const cheekR = cheekL.clone(); cheekR.position.x = 0.088;
                    const nose = new THREE.Mesh(this._geo('znose', () => new THREE.BoxGeometry(0.042, 0.052, 0.045)), skinMat);
                    nose.position.set(0, -0.005, 0.148);
                    nose.rotation.x = -0.25;

                    // Deep sunken eye sockets + glowing undead irises + bright white inner pupils
                    const sockL = new THREE.Mesh(this._geo('zsock2', () => new THREE.BoxGeometry(0.068, 0.048, 0.028)), sockMat);
                    sockL.position.set(-0.056, 0.018, 0.132);
                    const sockR = sockL.clone(); sockR.position.x = 0.056;
                    const eyeL = new THREE.Mesh(this._geo('zeye2', () => new THREE.BoxGeometry(0.044, 0.028, 0.026)), eyeMat);
                    eyeL.position.set(-0.056, 0.018, 0.142);
                    const eyeR = eyeL.clone(); eyeR.position.x = 0.056;
                    const pupL = new THREE.Mesh(this._geo('zpup', () => new THREE.BoxGeometry(0.016, 0.014, 0.012)), eyeCoreMat);
                    pupL.position.set(-0.056, 0.018, 0.153);
                    const pupR = pupL.clone(); pupR.position.x = 0.056;

                    // Hinged snarling lower jaw + dark bloody mouth cavity + upper & lower bone teeth!
                    const jaw = new THREE.Mesh(this._geo('zjaw', () => new THREE.BoxGeometry(0.165, 0.062, 0.175)), skinMat);
                    jaw.position.set(0, -0.118, 0.052);
                    jaw.rotation.x = 0.16;
                    const mouthCav = new THREE.Mesh(this._geo('zmouth2', () => new THREE.BoxGeometry(0.132, 0.052, 0.045)), fleshMat);
                    mouthCav.position.set(0, -0.082, 0.130);
                    const upperTeeth = new THREE.Mesh(this._geo('zteeth_u', () => new THREE.BoxGeometry(0.115, 0.018, 0.020)), boneMat);
                    upperTeeth.position.set(0, -0.064, 0.145);
                    const lowerTeeth = new THREE.Mesh(this._geo('zteeth_l', () => new THREE.BoxGeometry(0.105, 0.016, 0.018)), boneMat);
                    lowerTeeth.position.set(0, -0.098, 0.145);

                    hg.add(cranium, faceBlock, brow, cheekL, cheekR, nose, sockL, sockR, eyeL, eyeR, pupL, pupR, jaw, mouthCav, upperTeeth, lowerTeeth);

                    // Bespoke Creature Silhouettes
                    if (idLow.includes('witch')) {
                        const hatMat = this._mat('witch_hat', () => new THREE.MeshStandardMaterial({ color: 0x1a0d33, roughness: 0.72 }));
                        const bandMat = this._mat('witch_band', () => new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.25 }));
                        const brim = new THREE.Mesh(this._geo('what_brim', () => new THREE.CylinderGeometry(0.30, 0.31, 0.028, 14)), hatMat);
                        brim.position.y = 0.145;
                        const band = new THREE.Mesh(this._geo('what_band', () => new THREE.CylinderGeometry(0.155, 0.165, 0.045, 12)), bandMat);
                        band.position.y = 0.175;
                        const cone = new THREE.Mesh(this._geo('what_cone', () => new THREE.ConeGeometry(0.155, 0.44, 10)), hatMat);
                        cone.position.set(0, 0.39, -0.03);
                        cone.rotation.x = -0.18;
                        hg.add(brim, band, cone);
                    }
                    if (idLow.includes('wolf') || idLow.includes('lycan') || idLow.includes('tiger') || idLow.includes('bear')) {
                        const isBear = idLow.includes('bear') && !idLow.includes('wolf');
                        const earGeo = isBear
                            ? this._geo('bear_ear', () => new THREE.SphereGeometry(0.055, 7, 7))
                            : this._geo('beast_ear', () => new THREE.ConeGeometry(0.055, 0.16, 6));
                        const eL = new THREE.Mesh(earGeo, skinMat);
                        eL.position.set(-0.11, isBear ? 0.16 : 0.20, 0.01);
                        if (!isBear) eL.rotation.z = 0.28;
                        const eR = eL.clone(); eR.position.x = 0.11;
                        if (!isBear) eR.rotation.z = -0.28;
                        const snout = new THREE.Mesh(this._geo('beast_snout', () => new THREE.BoxGeometry(0.135, 0.095, 0.145)), skinMat);
                        snout.position.set(0, -0.035, 0.185);
                        const noseTip = new THREE.Mesh(this._geo('beast_nose', () => new THREE.BoxGeometry(0.055, 0.038, 0.03)), bootMat);
                        noseTip.position.set(0, -0.010, 0.258);
                        hg.add(eL, eR, snout, noseTip);
                    }
                    if (idLow.includes('pig') || idLow.includes('ogre') || idLow.includes('boar')) {
                        const tGeo = this._geo('tusk', () => new THREE.ConeGeometry(0.025, 0.14, 6));
                        const tL = new THREE.Mesh(tGeo, boneMat); tL.position.set(-0.075, -0.055, 0.185); tL.rotation.set(0.45, 0, 0.22);
                        const tR = new THREE.Mesh(tGeo, boneMat); tR.position.set(0.075, -0.055, 0.185); tR.rotation.set(0.45, 0, -0.22);
                        hg.add(tL, tR);
                    }
                    if (bs.helmet || isArmored) {
                        // Sculpted rounded PASGT / M1 tactical combat helmet + brow rim + visor bar
                        const helmDome = this._tagHitbox(
                            new THREE.Mesh(this._geo('zhelm_dome', () => new THREE.SphereGeometry(0.172, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.58)), steelMat),
                            entity, 'head'
                        );
                        helmDome.position.set(0, 0.045, -0.005);
                        const helmRim = new THREE.Mesh(this._geo('zhelm_rim', () => new THREE.CylinderGeometry(0.175, 0.182, 0.035, 12)), trimMat);
                        helmRim.position.set(0, 0.055, -0.005);
                        hg.add(helmDome, helmRim);
                    }
                    if (bs.horns || spec.isBoss) {
                        const hornMat = this._mat('horn_mat', () => new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.35, metalness: 0.3 }));
                        const hGeo = this._geo('horn', () => new THREE.ConeGeometry(0.042, 0.26, 6));
                        const hL = new THREE.Mesh(hGeo, hornMat);
                        hL.position.set(-0.125, 0.20, -0.01); hL.rotation.set(-0.18, 0, 0.42);
                        const hR = new THREE.Mesh(hGeo, hornMat);
                        hR.position.set(0.125, 0.20, -0.01); hR.rotation.set(-0.18, 0, -0.42);
                        hg.add(hL, hR);
                    }
                    headGroup.add(hg);
                }
            }
            bodyPivot.add(headGroup);

            // ================================================================
            // 3. ARTICULATED MULTI-SEGMENT ARMS (Bicep + Elbow + Forearm + Clawed Hand)
            // ================================================================
            const buildArmGeometry = (armGroup, side) => {
                const upperArm = this._tagHitbox(
                    new THREE.Mesh(this._geo('zupper_arm', () => new THREE.CylinderGeometry(0.068, 0.056, 0.26, 8)), shirtMat),
                    entity, 'limb'
                );
                upperArm.position.y = -0.13;
                const cuff = new THREE.Mesh(this._geo('zcuff', () => new THREE.CylinderGeometry(0.062, 0.065, 0.04, 8)), trimMat);
                cuff.position.y = -0.24;
                const elbow = new THREE.Mesh(this._geo('zelbow', () => new THREE.SphereGeometry(0.055, 7, 6)), skinMat);
                elbow.position.y = -0.26;
                const foreArm = this._tagHitbox(
                    new THREE.Mesh(this._geo('zforearm', () => new THREE.CylinderGeometry(0.052, 0.042, 0.24, 8)), skinMat),
                    entity, 'limb'
                );
                foreArm.position.set(0, -0.37, 0.03);
                foreArm.rotation.x = -0.22;
                const hand = new THREE.Mesh(this._geo('zhand', () => new THREE.BoxGeometry(0.075, 0.085, 0.045)), skinMat);
                hand.position.set(0, -0.50, 0.06);
                hand.rotation.x = -0.25;
                armGroup.add(upperArm, cuff, elbow, foreArm, hand);

                // 3 curved bony fingers/claws on each hand!
                const fingerGeo = this._geo('zfinger', () => new THREE.BoxGeometry(0.016, 0.065, 0.018));
                for (let f = -1; f <= 1; f++) {
                    const fg = new THREE.Mesh(fingerGeo, bs.razorClaws ? eyeMat : boneMat);
                    fg.position.set(f * 0.024, -0.56, 0.075);
                    fg.rotation.x = -0.45;
                    armGroup.add(fg);
                }
                if (bs.razorClaws) {
                    const claw = new THREE.Mesh(this._geo('claw', () => new THREE.ConeGeometry(0.038, 0.26, 5)), eyeMat);
                    claw.position.set(0, -0.62, 0.08);
                    claw.rotation.x = Math.PI - 0.3;
                    armGroup.add(claw);
                }
            };

            const armL = new THREE.Group();
            armL.position.set(-shoulderX - 0.02, 0.50, 0);
            if (!bs.missingLeftArm) {
                buildArmGeometry(armL, -1);
                if (bs.riotShield) {
                    const shieldMat = this._mat('riot_shield', () => new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.32, metalness: 0.86 }));
                    const shield = this._tagHitbox(
                        new THREE.Mesh(this._geo('shield_geo', () => new THREE.BoxGeometry(0.60, 0.98, 0.08)), shieldMat),
                        entity, 'shield'
                    );
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
            if (bs.giantClubArm) {
                const clubMat = this._mat('club_mat_' + key, () => new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.52, metalness: 0.45 }));
                const club = this._tagHitbox(
                    new THREE.Mesh(this._geo('club_arm', () => new THREE.CylinderGeometry(0.14, 0.08, 0.80, 8)), clubMat),
                    entity, 'limb'
                );
                club.position.set(0.05, -0.36, 0.02);
                const cSpike1 = new THREE.Mesh(this._geo('cspike', () => new THREE.ConeGeometry(0.032, 0.14, 5)), steelMat);
                cSpike1.position.set(0.15, -0.58, 0.02); cSpike1.rotation.z = -Math.PI * 0.5;
                const cSpike2 = cSpike1.clone(); cSpike2.position.set(-0.05, -0.64, 0.12); cSpike2.rotation.set(Math.PI * 0.5, 0, 0);
                armR.add(club, cSpike1, cSpike2);
            } else {
                buildArmGeometry(armR, 1);
                if (idLow.includes('witch')) {
                    // Arcane Witch Staff with glowing orb
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

            // Extra Pair of Lower Arms (4-Armed Mutants & Bosses!)
            if (bs.extraArms && bs.extraArms >= 2) {
                const eL = new THREE.Group();
                eL.position.set(-shoulderX, 0.24, 0.04);
                buildArmGeometry(eL, -1);
                eL.rotation.set(-0.95, 0, -0.35);

                const eR = new THREE.Group();
                eR.position.set(shoulderX, 0.24, 0.04);
                buildArmGeometry(eR, 1);
                eR.rotation.set(-0.95, 0, 0.35);
                bodyPivot.add(eL, eR);
            }

            // ================================================================
            // 4. ARTICULATED MULTI-SEGMENT LEGS (Thigh + Knee Pad + Shin + Combat Boot)
            // ================================================================
            const buildLegGroup = (xPos) => {
                const lg = new THREE.Group();
                lg.position.set(xPos, 0.80, 0);
                const thigh = this._tagHitbox(
                    new THREE.Mesh(this._geo('zthigh', () => new THREE.CylinderGeometry(0.090, 0.074, 0.36, 8)), pantsMat),
                    entity, 'limb'
                );
                thigh.position.y = -0.18;
                const knee = new THREE.Mesh(this._geo('zknee', () => new THREE.BoxGeometry(0.125, 0.105, 0.125)), trimMat);
                knee.position.set(0, -0.37, 0.025);
                const shin = this._tagHitbox(
                    new THREE.Mesh(this._geo('zshin', () => new THREE.CylinderGeometry(0.068, 0.056, 0.33, 8)), pantsMat),
                    entity, 'limb'
                );
                shin.position.y = -0.55;
                const boot = new THREE.Mesh(this._geo('zboot_g', () => new THREE.BoxGeometry(0.132, 0.12, 0.23)), bootMat);
                boot.position.set(0, -0.74, 0.045);
                lg.add(thigh, knee, shin, boot);
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

            const parts = { root, bodyPivot, headGroup, armL, armR, legL, legR, haloGroup };
            BO.ArsenalDetails.undeadDetails(parts, spec, chestW, chestD);
            return parts;
        }

        _buildQuadrupedFromSpec(root, spec, entity) {
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

            // Muscular tapered canine ribcage + narrower hindquarters + dorsal spine ridges
            const chest = this._tagHitbox(
                new THREE.Mesh(this._geo('hound_chest', () => new THREE.BoxGeometry(0.42, 0.36, 0.46)), furMat),
                entity, 'torso'
            );
            chest.position.set(0, 0.03, 0.18);
            const waist = this._tagHitbox(
                new THREE.Mesh(this._geo('hound_waist', () => new THREE.BoxGeometry(0.32, 0.28, 0.42)), furMat),
                entity, 'torso'
            );
            waist.position.set(0, 0.0, -0.22);
            const tail = new THREE.Mesh(this._geo('hound_tail', () => new THREE.CylinderGeometry(0.025, 0.05, 0.44, 6)), furMat);
            tail.position.set(0, 0.10, -0.52);
            tail.rotation.x = 0.65;
            bodyPivot.add(chest, waist, tail);

            for (let s = 0; s < 4; s++) {
                const sp = new THREE.Mesh(this._geo('hound_sp', () => new THREE.ConeGeometry(0.03, 0.12, 5)), boneMat);
                sp.position.set(0, 0.22, 0.28 - s * 0.18);
                sp.rotation.x = -0.35;
                bodyPivot.add(sp);
            }

            const headGroup = new THREE.Group();
            headGroup.position.set(0, 0.16, 0.48);
            const headCount = 1 + (bs.extraHeads || 0); // 3 heads for Inferno Cerberus!
            for (let h = 0; h < headCount; h++) {
                const offsetX = headCount === 1 ? 0 : (h - (headCount - 1) * 0.5) * 0.30;
                const hg = new THREE.Group();
                hg.position.set(offsetX, h === 1 && headCount === 3 ? 0.08 : 0, 0);
                const headMesh = this._tagHitbox(
                    new THREE.Mesh(this._geo('hound_head', () => new THREE.BoxGeometry(0.24, 0.22, 0.26)), furMat),
                    entity, 'head'
                );
                const snout = new THREE.Mesh(this._geo('hound_snout', () => new THREE.BoxGeometry(0.14, 0.10, 0.18)), furMat);
                snout.position.set(0, -0.02, 0.18);
                const jaw = new THREE.Mesh(this._geo('hound_jaw', () => new THREE.BoxGeometry(0.12, 0.05, 0.15)), furMat);
                jaw.position.set(0, -0.09, 0.16); jaw.rotation.x = 0.28;
                const fangL = new THREE.Mesh(this._geo('hfang', () => new THREE.ConeGeometry(0.015, 0.055, 5)), boneMat);
                fangL.position.set(-0.045, -0.07, 0.24); fangL.rotation.x = Math.PI;
                const fangR = fangL.clone(); fangR.position.x = 0.045;
                const earL = new THREE.Mesh(this._geo('hound_ear', () => new THREE.ConeGeometry(0.045, 0.14, 5)), furMat);
                earL.position.set(-0.085, 0.15, -0.04); earL.rotation.z = 0.22;
                const earR = earL.clone(); earR.position.x = 0.085; earR.rotation.z = -0.22;
                const eyeL = new THREE.Mesh(this._geo('eye', () => new THREE.BoxGeometry(0.052, 0.032, 0.03)), eyeMat);
                eyeL.position.set(-0.065, 0.04, 0.125);
                const eyeR = eyeL.clone(); eyeR.position.x = 0.065;
                hg.add(headMesh, snout, jaw, fangL, fangR, earL, earR, eyeL, eyeR);
                headGroup.add(hg);
            }
            bodyPivot.add(headGroup);

            const upperGeo = this._geo('hound_uleg', () => new THREE.CylinderGeometry(0.065, 0.05, 0.24, 7));
            const lowerGeo = this._geo('hound_lleg', () => new THREE.CylinderGeometry(0.048, 0.04, 0.24, 7));
            const pawGeo = this._geo('hound_paw', () => new THREE.BoxGeometry(0.10, 0.06, 0.14));
            const makeLeg = (x, z) => {
                const g = new THREE.Group();
                g.position.set(x, 0.44, z);
                const u = this._tagHitbox(new THREE.Mesh(upperGeo, furMat), entity, 'limb'); u.position.y = -0.11;
                const l = new THREE.Mesh(lowerGeo, furMat); l.position.y = -0.32;
                const p = new THREE.Mesh(pawGeo, furMat); p.position.set(0, -0.43, 0.03);
                g.add(u, l, p);
                root.add(g);
                return g;
            };
            const armL = makeLeg(-0.17, 0.28);
            const armR = makeLeg(0.17, 0.28);
            const legL = makeLeg(-0.15, -0.28);
            const legR = makeLeg(0.15, -0.28);

            return { root, bodyPivot, headGroup, armL, armR, legL, legR, haloGroup: null };
        }

        // Legacy wrapper kept for safety
        buildZombie(type, entity) {
            const spec = BO.ZombiesData ? BO.ZombiesData.get(type) : { id: type, bodySpec: {} };
            return this.buildZombieFromSpec(spec, entity);
        }

        buildSoldier(team, entity, role = null) {
            const root = new THREE.Group();
            const isAlly = team === 0;
            const armorHex = isAlly ? 0x2e4c6d : 0x5c2626;
            const bduHex = isAlly ? 0x283529 : 0x2b2523;
            const visorHex = isAlly ? 0x38bdf8 : 0xf43f5e;
            const T = BO.Textures;

            const armorMat = this._mat('sol2_armor_' + team, () => new THREE.MeshStandardMaterial({
                color: T?.createCerakoteTexture ? 0xffffff : armorHex,
                map: T?.createCerakoteTexture ? T.createCerakoteTexture(armorHex) : null,
                bumpMap: T?.createBumpTexture ? T.createBumpTexture('metal') : null,
                bumpScale: 0.014,
                roughness: 0.45, metalness: 0.46
            }));
            const bduMat = this._mat('sol2_bdu_' + team, () => new THREE.MeshStandardMaterial({
                color: T?.createMilitaryFatigueTexture ? 0xffffff : bduHex,
                map: T?.createMilitaryFatigueTexture ? T.createMilitaryFatigueTexture('bdu', bduHex) : null,
                bumpMap: T?.createBumpTexture ? T.createBumpTexture('cloth') : null,
                bumpScale: 0.025,
                roughness: 0.84
            }));
            const bootMat = this._mat('zboot', () => new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.72, metalness: 0.25 }));
            const visorMat = this._mat('sol_visor_' + team, () => new THREE.MeshBasicMaterial({ color: visorHex }));
            const steelMat = this._mat('zsteel', () => new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.30, metalness: 0.88 }));

            const bodyPivot = new THREE.Group();
            bodyPivot.position.y = 0.84;
            bodyPivot.userData.baseY = 0.84;
            root.add(bodyPivot);

            // Tactical Plate Carrier + Triple Rifle Mag Pouches + Shoulder Pads + Radio Pack
            const torso = this._tagHitbox(
                new THREE.Mesh(this._geo('torso_std', () => new THREE.BoxGeometry(0.46, 0.56, 0.26)), bduMat),
                entity, 'torso'
            );
            torso.position.y = 0.28;
            const plate = new THREE.Mesh(this._geo('sol_plate', () => new THREE.BoxGeometry(0.42, 0.38, 0.31)), armorMat);
            plate.position.y = 0.34;
            bodyPivot.add(torso, plate);
            for (const mx of [-0.11, 0, 0.11]) {
                const pouch = new THREE.Mesh(this._geo('sol_pouch', () => new THREE.BoxGeometry(0.085, 0.14, 0.065)), armorMat);
                pouch.position.set(mx, 0.22, 0.175);
                bodyPivot.add(pouch);
            }
            const radio = new THREE.Mesh(this._geo('sol_radio', () => new THREE.BoxGeometry(0.18, 0.24, 0.10)), armorMat);
            radio.position.set(0, 0.35, -0.18);
            const whip = new THREE.Mesh(this._geo('sol_whip', () => new THREE.CylinderGeometry(0.008, 0.010, 0.42, 5)), steelMat);
            whip.position.set(0.06, 0.58, -0.20);
            bodyPivot.add(radio, whip);

            for (const sx of [-0.28, 0.28]) {
                const pad = new THREE.Mesh(this._geo('sol_shpad', () => new THREE.BoxGeometry(0.12, 0.14, 0.18)), armorMat);
                pad.position.set(sx, 0.52, 0);
                bodyPivot.add(pad);
            }

            // Tactical MICH Helmet + NVG Shroud + Illuminated Goggles
            const headGroup = new THREE.Group();
            headGroup.position.set(0, 0.74, 0);
            const helmet = this._tagHitbox(
                new THREE.Mesh(this._geo('sol_head_s', () => new THREE.SphereGeometry(0.145, 10, 8)), bduMat),
                entity, 'head'
            );
            const dome = new THREE.Mesh(this._geo('zhelm_dome', () => new THREE.SphereGeometry(0.172, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.58)), armorMat);
            dome.position.y = 0.04;
            const nvgMount = new THREE.Mesh(this._geo('sol_nvg', () => new THREE.BoxGeometry(0.055, 0.045, 0.045)), steelMat);
            nvgMount.position.set(0, 0.11, 0.145);
            const visor = new THREE.Mesh(this._geo('sol_visor', () => new THREE.BoxGeometry(0.22, 0.068, 0.048)), visorMat);
            visor.position.set(0, 0.025, 0.125);
            headGroup.add(helmet, dome, nvgMount, visor);
            bodyPivot.add(headGroup);

            const armGeo = this._geo('arm', () => new THREE.CylinderGeometry(0.068, 0.054, 0.52, 8));
            const armL = new THREE.Group();
            armL.position.set(-0.30, 0.48, 0.06);
            armL.rotation.set(-0.85, -0.35, 0);
            const armLMesh = this._tagHitbox(new THREE.Mesh(armGeo, bduMat), entity, 'limb');
            armLMesh.position.y = -0.22;
            armL.add(armLMesh);

            const armR = new THREE.Group();
            armR.position.set(0.30, 0.48, 0.06);
            armR.rotation.set(-0.95, 0.15, 0);
            const armRMesh = this._tagHitbox(new THREE.Mesh(armGeo, bduMat), entity, 'limb');
            armRMesh.position.y = -0.22;
            armR.add(armRMesh);

            // Multi-part 3D Tactical Carbine Silhouette in Hands
            const gunMat = this._mat('bot_gun_mat', () => new THREE.MeshStandardMaterial({ color: 0x171a20, roughness: 0.36, metalness: 0.84 }));
            const gunBody = new THREE.Group();
            gunBody.position.set(-0.08, -0.35, 0.22);
            gunBody.rotation.x = 0.95;
            const gRec = new THREE.Mesh(this._geo('bot_grec', () => new THREE.BoxGeometry(0.055, 0.080, 0.34)), gunMat);
            const gBar = new THREE.Mesh(this._geo('bot_gbar', () => new THREE.CylinderGeometry(0.015, 0.017, 0.28, 8)), steelMat);
            gBar.rotation.x = Math.PI * 0.5; gBar.position.set(0, 0.012, -0.29);
            const gMag = new THREE.Mesh(this._geo('bot_gmag', () => new THREE.BoxGeometry(0.032, 0.14, 0.062)), gunMat);
            gMag.position.set(0, -0.09, -0.04); gMag.rotation.x = -0.20;
            const gOptic = new THREE.Mesh(this._geo('bot_gopt', () => new THREE.BoxGeometry(0.038, 0.042, 0.075)), gunMat);
            gOptic.position.set(0, 0.058, 0);
            const gStock = new THREE.Mesh(this._geo('bot_gstk', () => new THREE.BoxGeometry(0.042, 0.085, 0.18)), gunMat);
            gStock.position.set(0, -0.01, 0.25);
            gunBody.add(gRec, gBar, gMag, gOptic, gStock);
            armR.add(gunBody);
            bodyPivot.add(armL, armR);

            const buildSolLeg = (xPos) => {
                const lg = new THREE.Group();
                lg.position.set(xPos, 0.78, 0);
                const lm = this._tagHitbox(new THREE.Mesh(this._geo('sol_leg', () => new THREE.CylinderGeometry(0.085, 0.065, 0.66, 8)), bduMat), entity, 'limb');
                lm.position.y = -0.33;
                const knee = new THREE.Mesh(this._geo('sol_knee', () => new THREE.BoxGeometry(0.115, 0.105, 0.115)), armorMat);
                knee.position.set(0, -0.36, 0.025);
                const bt = new THREE.Mesh(this._geo('zboot_g', () => new THREE.BoxGeometry(0.132, 0.12, 0.23)), bootMat);
                bt.position.set(0, -0.70, 0.04);
                lg.add(lm, knee, bt);
                return lg;
            };
            const legL = buildSolLeg(-0.125);
            const legR = buildSolLeg(0.125);
            root.add(legL, legR);

            return { root, bodyPivot, headGroup, armL, armR, legL, legR, gunBody, haloGroup: null };
        }

        buildGuardDog(entity) {
            const root = new THREE.Group();
            const coatMat = new THREE.MeshStandardMaterial({ color: 0x3f2e21, roughness: 0.78 });
            const vestMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.55 });
            const collarMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

            const bodyPivot = new THREE.Group();
            bodyPivot.position.y = 0.48;
            bodyPivot.userData.baseY = 0.48;
            root.add(bodyPivot);

            const torso = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.74), coatMat);
            const vest = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.24, 0.42), vestMat);
            vest.position.set(0, 0.08, 0.04);
            const collar = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 8, 16), collarMat);
            collar.position.set(0, 0.09, 0.34);
            bodyPivot.add(torso, vest, collar);

            const headGroup = new THREE.Group();
            headGroup.position.set(0, 0.16, 0.44);
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.20, 0.28), coatMat);
            const snout = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.11, 0.16), coatMat);
            snout.position.set(0, -0.03, 0.18);
            const earL = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 5), coatMat);
            earL.position.set(-0.07, 0.14, -0.04);
            const earR = earL.clone();
            earR.position.x = 0.07;
            const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.02), eyeMat);
            eyeL.position.set(-0.05, 0.04, 0.14);
            const eyeR = eyeL.clone();
            eyeR.position.x = 0.05;
            headGroup.add(head, snout, earL, earR, eyeL, eyeR);
            bodyPivot.add(headGroup);

            const tail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.28), coatMat);
            tail.position.set(0, 0.14, -0.42);
            tail.rotation.x = 0.5;
            bodyPivot.add(tail);

            const legGeo = new THREE.BoxGeometry(0.10, 0.42, 0.10);
            const makeLeg = (x, z) => {
                const g = new THREE.Group();
                g.position.set(x, 0.40, z);
                const m = new THREE.Mesh(legGeo, coatMat);
                m.position.y = -0.20;
                g.add(m);
                root.add(g);
                return g;
            };
            const armL = makeLeg(-0.13, 0.25);
            const armR = makeLeg(0.13, 0.25);
            const legL = makeLeg(-0.13, -0.25);
            const legR = makeLeg(0.13, -0.25);

            return { root, bodyPivot, headGroup, armL, armR, legL, legR, haloGroup: null };
        }

        buildSentryTurret() {
            const root = new THREE.Group();
            const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.78, roughness: 0.35 });
            const oliveMat = new THREE.MeshStandardMaterial({ color: 0x4b5842, metalness: 0.45, roughness: 0.55 });
            const glowMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });

            for (let i = 0; i < 3; i++) {
                const a = (i / 3) * Math.PI * 2;
                const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.95, 8), darkMat);
                leg.position.set(Math.cos(a) * 0.28, 0.42, Math.sin(a) * 0.28);
                leg.rotation.z = Math.cos(a) * 0.32;
                leg.rotation.x = -Math.sin(a) * 0.32;
                root.add(leg);
            }
            const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.20, 0.26, 12), darkMat);
            hub.position.y = 0.85;
            root.add(hub);

            const headGroup = new THREE.Group();
            headGroup.position.set(0, 1.08, 0);
            const box = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.46), oliveMat);
            const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.52, 8), darkMat);
            b1.rotation.x = Math.PI * 0.5;
            b1.position.set(-0.08, 0.02, 0.38);
            const b2 = b1.clone();
            b2.position.x = 0.08;
            const sensor = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.07, 0.06), glowMat);
            sensor.position.set(0, 0.16, 0.16);
            headGroup.add(box, b1, b2, sensor);
            root.add(headGroup);

            return { root, headGroup, sensor };
        }

        buildShopkeeper() {
            const root = new THREE.Group();
            const robeMat = new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.72 });
            const armorMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.35, metalness: 0.7 });
            const skinMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 });
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

            // Sleek Compact Counter Stall + Canopy (flush back-wall footprint!)
            const counter = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.95, 0.75), new THREE.MeshStandardMaterial({ color: 0x5c3c22, roughness: 0.85 }));
            counter.position.set(0, 0.48, 0.42);
            const trim = new THREE.Mesh(new THREE.BoxGeometry(2.06, 0.10, 0.82), armorMat);
            trim.position.set(0, 0.96, 0.42);
            const postL = new THREE.Mesh(new THREE.BoxGeometry(0.10, 2.3, 0.10), counter.material);
            postL.position.set(-0.92, 1.15, 0.42);
            const postR = postL.clone();
            postR.position.x = 0.92;
            const sign = new THREE.Mesh(
                new THREE.BoxGeometry(1.94, 0.46, 0.12),
                new THREE.MeshBasicMaterial({ map: BO.Textures ? BO.Textures.createPerkSignTexture('SHOPKEEPER [E]', '#f59e0b') : null, color: 0xffffff })
            );
            sign.position.set(0, 2.28, 0.42);
            root.add(counter, trim, postL, postR, sign);

            // Shopkeeper Figure behind counter
            const torso = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.72, 0.28), robeMat);
            torso.position.set(0, 1.15, -0.15);
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), skinMat);
            head.position.set(0, 1.70, -0.15);
            const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.075, 0.06), eyeMat);
            visor.position.set(0, 1.72, 0.01);
            const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.14, 12), armorMat);
            hat.position.set(0, 1.88, -0.15);
            root.add(torso, head, visor, hat);

            return { root, sign };
        }

        animateLimbs(parts, speed, phase, attackSwing = 0, flinch = 0) {
            const amp = BO.Math.clamp(speed / 4.0, 0, 1) * 0.68;
            if (parts.legL && parts.legL.visible) parts.legL.rotation.x = Math.sin(phase) * amp;
            if (parts.legR && parts.legR.visible) parts.legR.rotation.x = -Math.sin(phase) * amp;
            if (parts.haloGroup) parts.haloGroup.rotation.y = phase * 0.6;
            if (parts.bodyPivot) {
                const baseY = parts.bodyPivot.userData.baseY ?? parts.bodyPivot.position.y;
                parts.bodyPivot.position.y = baseY + Math.abs(Math.sin(phase)) * 0.05 * (amp > 0.05 ? 1 : 0);
                parts.bodyPivot.rotation.x = (parts.bodyPivot.userData.baseRotX || 0) + flinch * -0.25 + (attackSwing > 0 ? Math.sin(attackSwing * Math.PI) * 0.28 : 0);
                // Expressive undead shambling lateral sway
                parts.bodyPivot.rotation.z = Math.sin(phase * 0.5) * 0.08 * (amp > 0.05 ? 1 : 0);
            }
            if (parts.headGroup) {
                parts.headGroup.rotation.z = Math.sin(phase * 0.5 + 0.8) * 0.10;
            }
            if (attackSwing > 0) {
                const sw = Math.sin(attackSwing * Math.PI) * 1.15;
                if (parts.armL) parts.armL.rotation.x = -1.25 - sw;
                if (parts.armR) parts.armR.rotation.x = -1.35 - sw;
            } else if (amp > 0.05) {
                if (parts.armL) parts.armL.rotation.x = -1.25 + Math.sin(phase) * 0.18 * amp;
                if (parts.armR) parts.armR.rotation.x = -1.35 - Math.sin(phase) * 0.18 * amp;
            }
        }
    }

    BO.CharacterMesh = new CharacterMeshBuilder();
})(window);
