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
                    const core = this._tagHitbox(
                        new THREE.Mesh(
                            this._geo(spec.isSuperBoss ? 'zsuper_core' : 'zboss_core', () => new THREE.OctahedronGeometry(spec.isSuperBoss ? 0.145 : 0.11, 0)),
                            eyeMat
                        ),
                        entity,
                        spec.isSuperBoss ? 'head' : 'torso'
                    );
                    core.position.set(0, 0.40, chestD * 0.5 + 0.045);
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
            const coatMat = new THREE.MeshStandardMaterial({ color: 0x453224, roughness: 0.74 });
            const underCoat = new THREE.MeshStandardMaterial({ color: 0x856448, roughness: 0.78 });
            const vestMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42, metalness: 0.62 });
            const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.28, metalness: 0.85 });
            const collarMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

            const bodyPivot = new THREE.Group();
            bodyPivot.position.y = 0.50;
            bodyPivot.userData.baseY = 0.50;
            root.add(bodyPivot);

            // Muscular chest + tapered waist/hindquarters + MOLLE tactical armor harness + glowing spine strip
            const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.16, 0.40, 10), coatMat);
            chest.rotation.x = Math.PI * 0.5; chest.scale.set(1.05, 1.0, 1.12); chest.position.set(0, 0.02, 0.16);
            const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.15, 0.42, 10), coatMat);
            waist.rotation.x = Math.PI * 0.5; waist.position.set(0, 0.0, -0.18);
            const bellyUnder = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.56), underCoat);
            bellyUnder.position.set(0, -0.09, 0.02);
            const vest = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 0.46), vestMat);
            vest.position.set(0, 0.07, 0.06);
            const spineGlow = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.40), collarMat);
            spineGlow.position.set(0, 0.21, 0.06);
            for (const s of [-1, 1]) {
                const pad = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.24), vestMat);
                pad.position.set(s * 0.21, 0.04, 0.18); pad.rotation.z = -s * 0.22;
                bodyPivot.add(pad);
            }
            const collar = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 16), vestMat);
            collar.position.set(0, 0.10, 0.34);
            for (let si = 0; si < 5; si++) {
                const a = (si / 5) * Math.PI * 2;
                const sp = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.07, 6), steelMat);
                sp.position.set(Math.cos(a) * 0.18, 0.10 + Math.sin(a) * 0.18, 0.34);
                sp.lookAt(Math.cos(a), 0.10 + Math.sin(a), 0.34); sp.rotateX(Math.PI * 0.5);
                bodyPivot.add(sp);
            }
            bodyPivot.add(chest, waist, bellyUnder, vest, spineGlow, collar);

            // Sculpted Cyber-Hound Head, Snout, Nose, Visor Eyes & Alert Ears
            const headGroup = new THREE.Group();
            headGroup.position.set(0, 0.18, 0.43);
            const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.155, 0), coatMat);
            head.scale.set(0.92, 0.88, 1.15);
            const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.078, 0.20, 6), coatMat);
            snout.rotation.x = Math.PI * 0.5; snout.scale.set(1.15, 1.0, 0.85); snout.position.set(0, -0.04, 0.17);
            const nose = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 6), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 }));
            nose.position.set(0, -0.02, 0.27);
            const visor = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.045, 0.08), vestMat);
            visor.position.set(0, 0.04, 0.11);
            const visorGlow = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.024, 0.09), eyeMat);
            visorGlow.position.set(0, 0.04, 0.115);
            headGroup.add(head, snout, nose, visor, visorGlow);
            for (const s of [-1, 1]) {
                const ear = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.15, 5), coatMat);
                ear.position.set(s * 0.08, 0.15, -0.03); ear.rotation.z = -s * 0.18;
                headGroup.add(ear);
            }
            bodyPivot.add(headGroup);

            const tail = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.32, 6), coatMat);
            tail.position.set(0, 0.15, -0.45);
            tail.rotation.x = -0.75;
            bodyPivot.add(tail);

            const legGeo = new THREE.CylinderGeometry(0.052, 0.042, 0.42, 8);
            const pawGeo = new THREE.BoxGeometry(0.085, 0.05, 0.11);
            const makeLeg = (x, z) => {
                const g = new THREE.Group();
                g.position.set(x, 0.42, z);
                const m = new THREE.Mesh(legGeo, coatMat); m.position.y = -0.20;
                const paw = new THREE.Mesh(pawGeo, underCoat); paw.position.set(0, -0.40, 0.02);
                g.add(m, paw);
                root.add(g);
                return g;
            };
            const armL = makeLeg(-0.14, 0.24);
            const armR = makeLeg(0.14, 0.24);
            const legL = makeLeg(-0.14, -0.25);
            const legR = makeLeg(0.14, -0.25);

            return { root, bodyPivot, headGroup, armL, armR, legL, legR, tail, haloGroup: null, isQuadruped: true };
        }

        buildSentryTurret() {
            const root = new THREE.Group();
            const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.82, roughness: 0.30 });
            const oliveMat = new THREE.MeshStandardMaterial({ color: 0x3f4e3a, metalness: 0.48, roughness: 0.50 });
            const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.25 });
            const glowMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
            const laserMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.75 });

            // Splayed hydraulic tripod with steel footpads + reinforced turret pedestal
            for (let i = 0; i < 3; i++) {
                const a = (i / 3) * Math.PI * 2;
                const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.96, 8), darkMat);
                leg.position.set(Math.cos(a) * 0.29, 0.42, Math.sin(a) * 0.29);
                leg.rotation.z = Math.cos(a) * 0.34;
                leg.rotation.x = -Math.sin(a) * 0.34;
                const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.06, 8), darkMat);
                pad.position.set(Math.cos(a) * 0.45, 0.03, Math.sin(a) * 0.45);
                root.add(leg, pad);
            }
            const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.28, 12), darkMat);
            hub.position.y = 0.86;
            const statusRing = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.025, 6, 18), glowMat);
            statusRing.rotation.x = Math.PI * 0.5; statusRing.position.y = 0.92;
            root.add(hub, statusRing);

            // Armored dual-barrel Gatling head + side ammo drum + laser sight + optic dome
            const headGroup = new THREE.Group();
            headGroup.position.set(0, 1.12, 0);
            const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.30, 0.54), oliveMat);
            const topHood = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.44, 6), darkMat);
            topHood.rotation.x = Math.PI * 0.5; topHood.position.set(0, 0.12, -0.02);
            const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.22, 12), darkMat);
            drum.rotation.z = Math.PI * 0.5; drum.position.set(-0.28, -0.02, 0.02);
            const belt = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.12), brassMat);
            belt.position.set(-0.20, 0.04, 0.02);

            for (const bx of [-0.09, 0.09]) {
                const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.038, 0.68, 8), darkMat);
                barrel.rotation.x = Math.PI * 0.5; barrel.position.set(bx, 0.02, 0.46);
                const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.28, 8), brassMat);
                shroud.rotation.x = Math.PI * 0.5; shroud.position.set(bx, 0.02, 0.32);
                const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.042, 0.10, 8), darkMat);
                muzzle.rotation.x = Math.PI * 0.5; muzzle.position.set(bx, 0.02, 0.78);
                headGroup.add(barrel, shroud, muzzle);
            }
            const sensor = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.12), glowMat);
            sensor.position.set(0, 0.22, 0.18);
            const laserStub = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.65, 6), laserMat);
            laserStub.rotation.x = Math.PI * 0.5; laserStub.position.set(0.16, 0.12, 0.52);
            headGroup.add(chassis, topHood, drum, belt, sensor, laserStub);
            root.add(headGroup);

            return { root, headGroup, sensor };
        }

        buildShopkeeper() {
            const root = new THREE.Group();
            const oakMat = new THREE.MeshStandardMaterial({ color: 0x4a2e19, roughness: 0.82 });
            const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.32, metalness: 0.78 });
            const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42, metalness: 0.75 });
            const cloakMat = new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.70 });
            const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.30, metalness: 0.82 });
            const crimsonCloth = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.85, side: THREE.DoubleSide });
            const skinMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.55 });
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

            // Carved Dark-Oak & Hammered-Brass Counter Stall
            const counter = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.96, 0.84), oakMat);
            counter.position.set(0, 0.48, 0.42);
            const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.14, 0.92), ironMat);
            plinth.position.set(0, 0.07, 0.42);
            const trim = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.11, 0.90), brassMat);
            trim.position.set(0, 0.98, 0.42);
            root.add(counter, plinth, trim);

            // Counter props: gold ingots + display carbine + brass lantern
            for (let g = 0; g < 3; g++) {
                const ingot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.10), goldTrimMat);
                ingot.position.set(-0.72 + (g % 2) * 0.2, 1.07 + Math.floor(g / 2) * 0.07, 0.42);
                root.add(ingot);
            }
            const propGun = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.11, 0.07), ironMat);
            propGun.position.set(0.56, 1.08, 0.42); propGun.rotation.y = 0.25;
            const lanternBody = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.10, 0.18, 6), new THREE.MeshBasicMaterial({ color: 0xfde047 }));
            lanternBody.position.set(0.95, 1.14, 0.44);
            const lanternCap = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.09, 6), brassMat);
            lanternCap.position.set(0.95, 1.26, 0.44);
            root.add(propGun, lanternBody, lanternCap);

            // Fluted Pillars & Slanted Crimson-Gold Canopy Awning + Ornate Header Sign
            for (const sx of [-1.06, 1.06]) {
                const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 2.45, 8), ironMat);
                post.position.set(sx, 1.22, 0.42);
                const cap = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), brassMat);
                cap.position.set(sx, 2.48, 0.42);
                root.add(post, cap);
            }
            const awning = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.08, 1.15), crimsonCloth);
            awning.position.set(0, 2.38, 0.38); awning.rotation.x = 0.22;
            const awningTrim = new THREE.Mesh(new THREE.BoxGeometry(2.40, 0.12, 0.08), goldTrimMat);
            awningTrim.position.set(0, 2.26, 0.94);
            const signFrame = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.54, 0.14), ironMat);
            signFrame.position.set(0, 2.72, 0.42);
            const sign = new THREE.Mesh(
                new THREE.PlaneGeometry(1.98, 0.44),
                new THREE.MeshBasicMaterial({ map: BO.Textures ? BO.Textures.createPerkSignTexture('SHOPKEEPER [E]', '#f59e0b') : null, color: 0xffffff })
            );
            sign.position.set(0, 2.72, 0.50);
            root.add(awning, awningTrim, signFrame, sign);

            // Armored Merchant NPC behind counter (cloak, pauldrons, hood, glowing visor, arms on counter)
            const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.30, 0.78, 8), cloakMat);
            torso.position.set(0, 1.22, -0.15);
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), skinMat);
            head.position.set(0, 1.78, -0.15);
            const hood = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.28, 8), cloakMat);
            hood.position.set(0, 1.92, -0.17); hood.rotation.x = -0.18;
            const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.075, 0.07), eyeMat);
            visor.position.set(0, 1.79, 0.02);
            const crownBand = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.025, 6, 14), goldTrimMat);
            crownBand.rotation.x = Math.PI * 0.5; crownBand.position.set(0, 1.88, -0.15);
            root.add(torso, head, hood, visor, crownBand);
            for (const s of [-1, 1]) {
                const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), goldTrimMat);
                pauldron.scale.set(1.2, 0.85, 1.0); pauldron.position.set(s * 0.28, 1.54, -0.14);
                const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.46, 8), cloakMat);
                arm.position.set(s * 0.26, 1.26, 0.05); arm.rotation.x = 0.88;
                root.add(pauldron, arm);
            }

            return { root, sign };
        }

        animateLimbs(parts, speed, phase, attackSwing = 0, flinch = 0) {
            const amp = BO.Math.clamp(speed / 4.0, 0, 1) * 0.68;

            if (parts.isQuadruped) {
                // Authentic 4-legged gallop gait + spine rock + head stabilize + tail lash + jaw snap
                const gAmp = BO.Math.clamp(speed / 5.0, 0, 1);
                const fL = Math.sin(phase) * 0.72 * gAmp;
                const fR = Math.sin(phase + 0.55) * 0.72 * gAmp;
                const hL = -Math.sin(phase + 0.15) * 0.72 * gAmp;
                const hR = -Math.sin(phase + 0.70) * 0.72 * gAmp;
                if (parts.armL) parts.armL.rotation.x = fL;
                if (parts.armR) parts.armR.rotation.x = fR;
                if (parts.legL) parts.legL.rotation.x = hL;
                if (parts.legR) parts.legR.rotation.x = hR;
                if (parts.bodyPivot) {
                    const baseY = parts.bodyPivot.userData.baseY ?? parts.bodyPivot.position.y;
                    parts.bodyPivot.position.y = baseY + Math.abs(Math.cos(phase)) * 0.08 * gAmp + Math.sin(phase * 0.5) * 0.012;
                    parts.bodyPivot.rotation.x = (parts.bodyPivot.userData.baseRotX || 0) + Math.sin(phase) * 0.11 * gAmp - flinch * 0.22;
                }
                if (parts.headGroup) {
                    parts.headGroup.rotation.x = -Math.sin(phase) * 0.08 * gAmp + flinch * -0.25 + (attackSwing > 0 ? Math.sin(attackSwing * Math.PI) * 0.25 : 0);
                    parts.headGroup.rotation.y = Math.sin(phase * 0.45) * 0.08;
                }
                if (parts.tail) {
                    parts.tail.rotation.y = Math.sin(phase * 1.8) * 0.38;
                    parts.tail.rotation.x = 0.58 + Math.cos(phase) * 0.16;
                }
                if (parts.jaws && parts.jaws.length) {
                    const snap = Math.PI * 0.5 + 0.24 + Math.abs(Math.sin(phase * 0.9)) * 0.14 + (attackSwing > 0 ? Math.sin(attackSwing * Math.PI) * 0.36 : 0);
                    for (let j = 0; j < parts.jaws.length; j++) parts.jaws[j].rotation.x = snap;
                }
                return;
            }

            if (parts.legL && parts.legL.visible) parts.legL.rotation.x = Math.sin(phase) * amp;
            if (parts.legR && parts.legR.visible) parts.legR.rotation.x = -Math.sin(phase) * amp;
            if (parts.haloGroup) parts.haloGroup.rotation.y = phase * 0.6;

            const moving = amp > 0.05;
            if (parts.bodyPivot) {
                const baseY = parts.bodyPivot.userData.baseY ?? parts.bodyPivot.position.y;
                const walkBob = moving ? Math.abs(Math.sin(phase)) * 0.05 : 0;
                const breathBob = Math.sin(phase * 0.6) * 0.012;
                parts.bodyPivot.position.y = baseY + walkBob + breathBob;
                parts.bodyPivot.rotation.x = (parts.bodyPivot.userData.baseRotX || 0) + flinch * -0.25 + (attackSwing > 0 ? Math.sin(attackSwing * Math.PI) * 0.28 : 0);
                // Expressive undead shambling lateral sway (soft idle sway even when standing)
                parts.bodyPivot.rotation.z = Math.sin(phase * 0.5) * (moving ? 0.08 : 0.025);
            }
            if (parts.headGroup) {
                parts.headGroup.rotation.z = Math.sin(phase * 0.5 + 0.8) * 0.10;
                parts.headGroup.rotation.y = Math.sin(phase * 0.35) * 0.12;
                parts.headGroup.rotation.x = flinch * -0.35;
            }
            if (parts.jaws && parts.jaws.length) {
                const jawOpen = 0.16 + Math.abs(Math.sin(phase * 0.9)) * 0.16 + (attackSwing > 0 ? Math.sin(attackSwing * Math.PI) * 0.42 : 0);
                for (let j = 0; j < parts.jaws.length; j++) parts.jaws[j].rotation.x = jawOpen;
            }
            if (attackSwing > 0) {
                const sw = Math.sin(attackSwing * Math.PI) * 1.15;
                if (parts.armL) parts.armL.rotation.x = -1.25 - sw;
                if (parts.armR) parts.armR.rotation.x = -1.35 - sw;
                if (parts.forearmL) parts.forearmL.rotation.x = -0.24 - sw * 0.38;
                if (parts.forearmR) parts.forearmR.rotation.x = -0.24 - sw * 0.38;
            } else {
                const armAmp = moving ? 0.18 * amp : 0.04;
                if (parts.armL) parts.armL.rotation.x = -1.25 + Math.sin(phase) * armAmp;
                if (parts.armR) parts.armR.rotation.x = -1.35 - Math.sin(phase) * armAmp;
                if (parts.forearmL) parts.forearmL.rotation.x = -0.24 - Math.sin(phase) * (moving ? 0.18 * amp : 0.05);
                if (parts.forearmR) parts.forearmR.rotation.x = -0.24 + Math.sin(phase) * (moving ? 0.18 * amp : 0.05);
            }
        }
    }

    BO.CharacterMesh = new CharacterMeshBuilder();
})(window);
