/* ============================================================================
   BLACKOUT OPS — Articulated 3D Character, 20-Zombie, 5-Boss & Bot Mesh Builder
   Supports shaped torsos, missing limbs/head, extra arms/heads, back sacs,
   riot shields, giant cleaver/club arms, horns, wings, tentacles & crystal halos.
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
                return this._buildQuadrupedFromSpec(root, spec, entity);
            }

            const key = spec.id;
            const skinMat = this._mat('zskin_' + key, () => new THREE.MeshStandardMaterial({
                color: bs.skinColor || 0x5c6958,
                roughness: 0.84,
                emissive: bs.glowingRibs ? bs.glowingRibs : 0x000000,
                emissiveIntensity: bs.glowingRibs ? 0.22 : 0
            }));
            const shirtMat = this._mat('zshirt_' + key, () => new THREE.MeshStandardMaterial({
                color: bs.shirtColor || 0x333935,
                roughness: bs.torsoShape === 'armored' ? 0.36 : 0.88,
                metalness: bs.torsoShape === 'armored' ? 0.72 : 0.08
            }));
            const pantsMat = this._mat('zpants_' + key, () => new THREE.MeshStandardMaterial({
                color: bs.pantsColor || 0x24262a,
                roughness: 0.92
            }));
            const eyeMat = this._mat('zeye_' + key, () => new THREE.MeshBasicMaterial({
                color: bs.eyeColor || 0xff3333
            }));

            const isCrawler = !!bs.missingLegs && !bs.floating;
            const isFloating = !!bs.floating;

            const bodyPivot = new THREE.Group();
            bodyPivot.position.y = isCrawler ? 0.28 : (isFloating ? 1.15 : 0.84);
            if (isCrawler) bodyPivot.rotation.x = 1.18;
            if (bs.torsoShape === 'hunched') bodyPivot.rotation.x = 0.24;
            root.add(bodyPivot);

            // Shaped Torso
            let torsoMesh;
            if (bs.torsoShape === 'bloated') {
                torsoMesh = new THREE.Mesh(this._geo('torso_bloat', () => new THREE.SphereGeometry(0.38, 12, 10)), shirtMat);
                torsoMesh.scale.set(1.05, 1.0, 0.92);
            } else if (bs.torsoShape === 'lean') {
                torsoMesh = new THREE.Mesh(this._geo('torso_lean', () => new THREE.BoxGeometry(0.36, 0.62, 0.20)), shirtMat);
            } else if (bs.torsoShape === 'broad' || bs.torsoShape === 'armored') {
                torsoMesh = new THREE.Mesh(this._geo('torso_broad', () => new THREE.BoxGeometry(0.56, 0.64, 0.34)), shirtMat);
            } else if (bs.torsoShape === 'floating') {
                torsoMesh = new THREE.Mesh(this._geo('torso_float', () => new THREE.ConeGeometry(0.30, 0.85, 8)), shirtMat);
                torsoMesh.rotation.x = Math.PI;
            } else {
                torsoMesh = new THREE.Mesh(this._geo('torso_std', () => new THREE.BoxGeometry(0.46, 0.58, 0.26)), shirtMat);
            }
            this._tagHitbox(torsoMesh, entity, 'torso');
            torsoMesh.position.y = 0.28;
            bodyPivot.add(torsoMesh);

            // Glowing Ribcage / Core
            if (bs.glowingRibs) {
                const ribMat = this._mat('zrib_' + key, () => new THREE.MeshBasicMaterial({ color: bs.glowingRibs }));
                for (let r = 0; r < 3; r++) {
                    const rib = new THREE.Mesh(this._geo('rib', () => new THREE.BoxGeometry(0.36, 0.045, 0.28)), ribMat);
                    rib.position.set(0, 0.18 + r * 0.11, 0.02);
                    bodyPivot.add(rib);
                }
            }

            // Glowing Back Acid/Bile Sac
            if (bs.backSac) {
                const sacMat = this._mat('zsac_' + key, () => new THREE.MeshStandardMaterial({
                    color: bs.backSac, emissive: bs.backSac, emissiveIntensity: 0.65, roughness: 0.3
                }));
                const sac = this._tagHitbox(
                    new THREE.Mesh(this._geo('back_sac', () => new THREE.SphereGeometry(0.24, 10, 10)), sacMat),
                    entity, 'torso'
                );
                sac.position.set(0, 0.38, -0.24);
                bodyPivot.add(sac);
            }

            // Bone Spikes on Shoulders
            if (bs.boneSpikes) {
                const boneMat = this._mat('zbone', () => new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.7 }));
                const spGeo = this._geo('spike', () => new THREE.ConeGeometry(0.06, 0.26, 6));
                const spL = new THREE.Mesh(spGeo, boneMat);
                spL.position.set(-0.30, 0.62, 0);
                spL.rotation.z = 0.45;
                const spR = new THREE.Mesh(spGeo, boneMat);
                spR.position.set(0.30, 0.62, 0);
                spR.rotation.z = -0.45;
                bodyPivot.add(spL, spR);
            }

            // Wings (Crimson Leech & Overlord Nyx)
            if (bs.wings) {
                const wingMat = this._mat('zwing_' + key, () => new THREE.MeshStandardMaterial({
                    color: bs.shirtColor || 0x450a0a, roughness: 0.7, side: THREE.DoubleSide
                }));
                const wGeo = this._geo('wing', () => new THREE.BoxGeometry(0.55, 0.42, 0.04));
                const wL = new THREE.Mesh(wGeo, wingMat);
                wL.position.set(-0.46, 0.48, -0.18);
                wL.rotation.set(0.15, -0.45, 0.25);
                const wR = new THREE.Mesh(wGeo, wingMat);
                wR.position.set(0.46, 0.48, -0.18);
                wR.rotation.set(0.15, 0.45, -0.25);
                bodyPivot.add(wL, wR);
            }

            // Back Shadow Tentacles
            if (bs.tentacles) {
                const tMat = this._mat('ztent_' + key, () => new THREE.MeshStandardMaterial({ color: 0x1e1b4b, emissive: 0x581c87, emissiveIntensity: 0.35 }));
                const tGeo = this._geo('tentacle', () => new THREE.CylinderGeometry(0.03, 0.06, 0.65, 6));
                for (let t = 0; t < 4; t++) {
                    const ten = new THREE.Mesh(tGeo, tMat);
                    ten.position.set((t - 1.5) * 0.14, 0.35, -0.24);
                    ten.rotation.set(-0.55, 0, (t - 1.5) * 0.22);
                    bodyPivot.add(ten);
                }
            }

            // Orbiting Crystal Halo (Frost Wraith, Aether Revenant, Overlord Nyx)
            let haloGroup = null;
            if (bs.haloCrystal) {
                haloGroup = new THREE.Group();
                haloGroup.position.set(0, 0.85, 0);
                const cMat = this._mat('zcrys_' + key, () => new THREE.MeshBasicMaterial({ color: bs.haloCrystal }));
                const cGeo = this._geo('crystal', () => new THREE.OctahedronGeometry(0.10, 0));
                for (let c = 0; c < 4; c++) {
                    const a = (c / 4) * Math.PI * 2;
                    const shard = new THREE.Mesh(cGeo, cMat);
                    shard.position.set(Math.cos(a) * 0.52, 0.05, Math.sin(a) * 0.52);
                    haloGroup.add(shard);
                }
                bodyPivot.add(haloGroup);
            }

            // Head(s) or Headless Glowing Spine
            const headGroup = new THREE.Group();
            headGroup.position.set(0, 0.72, 0.04);
            if (bs.headless) {
                const spine = this._tagHitbox(
                    new THREE.Mesh(this._geo('spine', () => new THREE.CylinderGeometry(0.07, 0.10, 0.16, 8)),
                        this._mat('spine_glow', () => new THREE.MeshBasicMaterial({ color: 0xef4444 }))),
                    entity, 'torso'
                );
                spine.position.y = -0.08;
                headGroup.add(spine);
            } else {
                const headCount = 1 + (bs.extraHeads || 0);
                for (let h = 0; h < headCount; h++) {
                    const hx = headCount === 1 ? 0 : (h === 0 ? -0.16 : 0.16);
                    const hg = new THREE.Group();
                    hg.position.set(hx, 0, 0);
                    const hm = this._tagHitbox(
                        new THREE.Mesh(this._geo('head', () => new THREE.BoxGeometry(0.27, 0.29, 0.27)), skinMat),
                        entity, 'head'
                    );
                    hg.add(hm);
                    const eyeL = new THREE.Mesh(this._geo('eye', () => new THREE.BoxGeometry(0.055, 0.035, 0.03)), eyeMat);
                    eyeL.position.set(-0.06, 0.03, 0.135);
                    const eyeR = eyeL.clone();
                    eyeR.position.x = 0.06;
                    hg.add(eyeL, eyeR);

                    if (bs.helmet) {
                        const helm = this._tagHitbox(
                            new THREE.Mesh(this._geo('helmet', () => new THREE.BoxGeometry(0.32, 0.20, 0.32)), shirtMat),
                            entity, 'head'
                        );
                        helm.position.y = 0.09;
                        hg.add(helm);
                    }
                    if (bs.horns) {
                        const hornMat = this._mat('horn_mat', () => new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.4 }));
                        const hGeo = this._geo('horn', () => new THREE.ConeGeometry(0.04, 0.22, 6));
                        const hL = new THREE.Mesh(hGeo, hornMat);
                        hL.position.set(-0.12, 0.20, 0);
                        hL.rotation.z = 0.35;
                        const hR = new THREE.Mesh(hGeo, hornMat);
                        hR.position.set(0.12, 0.20, 0);
                        hR.rotation.z = -0.35;
                        hg.add(hL, hR);
                    }
                    headGroup.add(hg);
                }
            }
            bodyPivot.add(headGroup);

            // Primary Arms (supporting missingLeftArm, giantClubArm, riotShield, razorClaws)
            const armGeo = this._geo('arm', () => new THREE.BoxGeometry(0.14, 0.52, 0.14));
            const armL = new THREE.Group();
            armL.position.set(-0.33, 0.50, 0);
            if (!bs.missingLeftArm) {
                const armLMesh = this._tagHitbox(new THREE.Mesh(armGeo, skinMat), entity, 'limb');
                armLMesh.position.y = -0.22;
                armL.add(armLMesh);
                if (bs.riotShield) {
                    const shieldMat = this._mat('riot_shield', () => new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.85 }));
                    const shield = this._tagHitbox(
                        new THREE.Mesh(this._geo('shield_geo', () => new THREE.BoxGeometry(0.58, 0.95, 0.08)), shieldMat),
                        entity, 'shield'
                    );
                    shield.position.set(-0.08, -0.32, 0.22);
                    shield.rotation.x = 1.25;
                    armL.add(shield);
                }
                if (bs.razorClaws) {
                    const claw = new THREE.Mesh(this._geo('claw', () => new THREE.ConeGeometry(0.04, 0.26, 5)), eyeMat);
                    claw.position.set(0, -0.54, 0);
                    claw.rotation.x = Math.PI;
                    armL.add(claw);
                }
            }
            armL.rotation.x = -1.25;

            const armR = new THREE.Group();
            armR.position.set(0.33, 0.50, 0);
            if (bs.giantClubArm) {
                const clubMat = this._mat('club_mat_' + key, () => new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.5, metalness: 0.45 }));
                const club = this._tagHitbox(
                    new THREE.Mesh(this._geo('club_arm', () => new THREE.BoxGeometry(0.26, 0.78, 0.22)), clubMat),
                    entity, 'limb'
                );
                club.position.set(0.06, -0.34, 0);
                armR.add(club);
            } else {
                const armRMesh = this._tagHitbox(new THREE.Mesh(armGeo, skinMat), entity, 'limb');
                armRMesh.position.y = -0.22;
                armR.add(armRMesh);
                if (bs.razorClaws) {
                    const claw = new THREE.Mesh(this._geo('claw', () => new THREE.ConeGeometry(0.04, 0.26, 5)), eyeMat);
                    claw.position.set(0, -0.54, 0);
                    claw.rotation.x = Math.PI;
                    armR.add(claw);
                }
            }
            armR.rotation.x = -1.35;
            bodyPivot.add(armL, armR);

            // Extra Pair of Lower Arms (4-Armed Mutants & Bosses!)
            if (bs.extraArms && bs.extraArms >= 2) {
                const eL = new THREE.Group();
                eL.position.set(-0.32, 0.26, 0.04);
                const eLm = this._tagHitbox(new THREE.Mesh(armGeo, skinMat), entity, 'limb');
                eLm.position.y = -0.22;
                eL.add(eLm);
                eL.rotation.set(-0.95, 0, -0.35);

                const eR = new THREE.Group();
                eR.position.set(0.32, 0.26, 0.04);
                const eRm = this._tagHitbox(new THREE.Mesh(armGeo, skinMat), entity, 'limb');
                eRm.position.y = -0.22;
                eR.add(eRm);
                eR.rotation.set(-0.95, 0, 0.35);
                bodyPivot.add(eL, eR);
            }

            // Legs (omitted if missingLegs or floating)
            const legGeo = this._geo('leg', () => new THREE.BoxGeometry(0.18, 0.72, 0.18));
            const legL = new THREE.Group();
            legL.position.set(-0.13, 0.72, 0);
            const legLMesh = this._tagHitbox(new THREE.Mesh(legGeo, pantsMat), entity, 'limb');
            legLMesh.position.y = -0.36;
            legL.add(legLMesh);

            const legR = new THREE.Group();
            legR.position.set(0.13, 0.72, 0);
            const legRMesh = this._tagHitbox(new THREE.Mesh(legGeo, pantsMat), entity, 'limb');
            legRMesh.position.y = -0.36;
            legR.add(legRMesh);

            if (!bs.missingLegs && !isFloating) {
                root.add(legL, legR);
            } else {
                legL.visible = false;
                legR.visible = false;
            }

            return { root, bodyPivot, headGroup, armL, armR, legL, legR, haloGroup };
        }

        _buildQuadrupedFromSpec(root, spec, entity) {
            const bs = spec.bodySpec || {};
            const key = spec.id;
            const furMat = this._mat('qfur_' + key, () => new THREE.MeshStandardMaterial({
                color: bs.skinColor || 0x221715,
                roughness: 0.80,
                emissive: bs.shirtColor || 0x7c1d0c,
                emissiveIntensity: 0.35
            }));
            const eyeMat = this._mat('qeye_' + key, () => new THREE.MeshBasicMaterial({ color: bs.eyeColor || 0xff7b00 }));

            const bodyPivot = new THREE.Group();
            bodyPivot.position.y = 0.54;
            root.add(bodyPivot);

            const torso = this._tagHitbox(
                new THREE.Mesh(this._geo('hound_torso', () => new THREE.BoxGeometry(0.42, 0.36, 0.82)), furMat),
                entity, 'torso'
            );
            bodyPivot.add(torso);

            const headGroup = new THREE.Group();
            headGroup.position.set(0, 0.14, 0.50);
            const headCount = 1 + (bs.extraHeads || 0); // 3 heads for Inferno Cerberus!
            for (let h = 0; h < headCount; h++) {
                const offsetX = headCount === 1 ? 0 : (h - (headCount - 1) * 0.5) * 0.28;
                const hg = new THREE.Group();
                hg.position.set(offsetX, h === 1 && headCount === 3 ? 0.08 : 0, 0);
                const headMesh = this._tagHitbox(
                    new THREE.Mesh(this._geo('hound_head', () => new THREE.BoxGeometry(0.24, 0.23, 0.32)), furMat),
                    entity, 'head'
                );
                const eyeL = new THREE.Mesh(this._geo('eye', () => new THREE.BoxGeometry(0.055, 0.035, 0.03)), eyeMat);
                eyeL.position.set(-0.06, 0.04, 0.15);
                const eyeR = eyeL.clone();
                eyeR.position.x = 0.06;
                hg.add(headMesh, eyeL, eyeR);
                headGroup.add(hg);
            }
            bodyPivot.add(headGroup);

            const legGeo = this._geo('hound_leg', () => new THREE.BoxGeometry(0.12, 0.46, 0.12));
            const makeLeg = (x, z) => {
                const g = new THREE.Group();
                g.position.set(x, 0.44, z);
                const m = this._tagHitbox(new THREE.Mesh(legGeo, furMat), entity, 'limb');
                m.position.y = -0.22;
                g.add(m);
                root.add(g);
                return g;
            };
            const armL = makeLeg(-0.16, 0.28);
            const armR = makeLeg(0.16, 0.28);
            const legL = makeLeg(-0.16, -0.28);
            const legR = makeLeg(0.16, -0.28);

            return { root, bodyPivot, headGroup, armL, armR, legL, legR, haloGroup: null };
        }

        // Legacy wrapper kept for safety
        buildZombie(type, entity) {
            const spec = BO.ZombiesData ? BO.ZombiesData.get(type) : { id: type, bodySpec: {} };
            return this.buildZombieFromSpec(spec, entity);
        }

        buildSoldier(team, entity) {
            const root = new THREE.Group();
            const isAlly = team === 0;
            const armorHex = isAlly ? 0x2e4c6d : 0x5c2626;
            const bduHex = isAlly ? 0x26313d : 0x292524;
            const visorHex = isAlly ? 0x38bdf8 : 0xf43f5e;

            const armorMat = this._mat('sol_armor_' + team, () => new THREE.MeshStandardMaterial({ color: armorHex, roughness: 0.55, metalness: 0.35 }));
            const bduMat = this._mat('sol_bdu_' + team, () => new THREE.MeshStandardMaterial({ color: bduHex, roughness: 0.85 }));
            const visorMat = this._mat('sol_visor_' + team, () => new THREE.MeshBasicMaterial({ color: visorHex }));

            const bodyPivot = new THREE.Group();
            bodyPivot.position.y = 0.82;
            root.add(bodyPivot);

            const torso = this._tagHitbox(
                new THREE.Mesh(this._geo('torso_std', () => new THREE.BoxGeometry(0.46, 0.58, 0.26)), armorMat),
                entity, 'torso'
            );
            torso.position.y = 0.28;
            bodyPivot.add(torso);

            const headGroup = new THREE.Group();
            headGroup.position.set(0, 0.73, 0);
            const helmet = this._tagHitbox(
                new THREE.Mesh(this._geo('sol_head', () => new THREE.BoxGeometry(0.28, 0.30, 0.28)), bduMat),
                entity, 'head'
            );
            const visor = new THREE.Mesh(this._geo('sol_visor', () => new THREE.BoxGeometry(0.24, 0.08, 0.04)), visorMat);
            visor.position.set(0, 0.03, 0.135);
            headGroup.add(helmet, visor);
            bodyPivot.add(headGroup);

            const armGeo = this._geo('arm', () => new THREE.BoxGeometry(0.14, 0.52, 0.14));
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

            const gunBody = new THREE.Mesh(
                this._geo('bot_gun', () => new THREE.BoxGeometry(0.06, 0.09, 0.52)),
                this._mat('bot_gun_mat', () => new THREE.MeshStandardMaterial({ color: 0x171a20, roughness: 0.4, metalness: 0.8 }))
            );
            gunBody.position.set(-0.08, -0.35, 0.22);
            gunBody.rotation.x = 0.95;
            armR.add(gunBody);

            bodyPivot.add(armL, armR);

            const legGeo = this._geo('leg', () => new THREE.BoxGeometry(0.18, 0.72, 0.18));
            const legL = new THREE.Group();
            legL.position.set(-0.12, 0.72, 0);
            const legLMesh = this._tagHitbox(new THREE.Mesh(legGeo, bduMat), entity, 'limb');
            legLMesh.position.y = -0.36;
            legL.add(legLMesh);

            const legR = new THREE.Group();
            legR.position.set(0.12, 0.72, 0);
            const legRMesh = this._tagHitbox(new THREE.Mesh(legGeo, bduMat), entity, 'limb');
            legRMesh.position.y = -0.36;
            legR.add(legRMesh);

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

            // Counter Stall + Canopy
            const counter = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.95, 0.85), new THREE.MeshStandardMaterial({ color: 0x5c3c22, roughness: 0.85 }));
            counter.position.set(0, 0.48, 0.75);
            const trim = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.12, 0.92), armorMat);
            trim.position.set(0, 0.96, 0.75);
            const postL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.3, 0.12), counter.material);
            postL.position.set(-0.95, 1.15, 0.75);
            const postR = postL.clone();
            postR.position.x = 0.95;
            const sign = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.42, 0.14), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
            sign.position.set(0, 2.25, 0.75);
            root.add(counter, trim, postL, postR, sign);

            // Shopkeeper Figure behind counter
            const torso = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.72, 0.30), robeMat);
            torso.position.set(0, 1.15, -0.05);
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.32, 0.30), skinMat);
            head.position.set(0, 1.70, -0.05);
            const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.06), eyeMat);
            visor.position.set(0, 1.72, 0.11);
            const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.16, 12), armorMat);
            hat.position.set(0, 1.90, -0.05);
            root.add(torso, head, visor, hat);

            return { root, sign };
        }

        animateLimbs(parts, speed, phase, attackSwing = 0, flinch = 0) {
            const amp = BO.Math.clamp(speed / 4.0, 0, 1) * 0.65;
            if (parts.legL && parts.legL.visible) parts.legL.rotation.x = Math.sin(phase) * amp;
            if (parts.legR && parts.legR.visible) parts.legR.rotation.x = -Math.sin(phase) * amp;
            if (parts.haloGroup) parts.haloGroup.rotation.y = phase * 0.6;
            if (parts.bodyPivot) {
                const baseY = parts.bodyPivot.userData.baseY ?? parts.bodyPivot.position.y;
                parts.bodyPivot.position.y = baseY + Math.abs(Math.sin(phase)) * 0.045 * (amp > 0.05 ? 1 : 0);
                parts.bodyPivot.rotation.x = (parts.bodyPivot.userData.baseRotX || 0) + flinch * -0.25 + (attackSwing > 0 ? Math.sin(attackSwing * Math.PI) * 0.25 : 0);
            }
            if (attackSwing > 0) {
                const sw = Math.sin(attackSwing * Math.PI) * 1.1;
                parts.armL.rotation.x = -1.25 - sw;
                parts.armR.rotation.x = -1.35 - sw;
            }
        }
    }

    BO.CharacterMesh = new CharacterMeshBuilder();
})(window);
