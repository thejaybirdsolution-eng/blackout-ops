/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Boss Rush
   Fight every boss one after another in the Colosseum. Bottomless magazines,
   no health regen, a 30 s rest between rounds and only THREE max heals for the
   entire rush — spend them wisely.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const L = BO.MinigameLib;
    const A = BO.MinigameArt;
    const { B, SFX, std, basic, clamp01, esc } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);

    const ARENA_R = 30;
    const REST_TIME = 30;
    const MAX_HEALS = 3;
    const BOSS_SCALE = 5;            // every boss is five times its normal size here

    const DIFFS = {
        recruit: { label: 'RECRUIT', hp: 0.7, dmg: 0.55, spd: 0.9, xp: 0.75 },
        veteran: { label: 'VETERAN', hp: 1.0, dmg: 0.85, spd: 1.0, xp: 1.0 },
        legend: { label: 'LEGEND', hp: 1.35, dmg: 1.25, spd: 1.1, xp: 1.6 }
    };
    const VARIANTS = {
        gauntlet: { label: 'THE GAUNTLET', desc: 'All 15 bosses, weakest to strongest — Super Bosses included.', filter: () => true },
        classic: { label: 'BOSS PARADE', desc: 'The 10 regular bosses only. A shorter, sharper rush.', filter: (b) => !b.isSuperBoss },
        titans: { label: 'TITAN SIEGE', desc: 'Only the 5 colossal Super Bosses, each with a Phase II rage.', filter: (b) => b.isSuperBoss }
    };

    function arenaBoxes() {
        return [B(0, -0.5, 0, 90, 1, 90, 'desert_sand')];
    }

    const PILLARS = [[13, 13], [-13, 13], [13, -13], [-13, -13]];

    function waypoints() {
        const wps = [{ id: 'c', x: 0, y: 0, z: 0, links: [] }];
        const n = 12;
        for (let i = 0; i < n; i++) {
            const a = i / n * Math.PI * 2;
            wps.push({ id: 'r' + i, x: Math.cos(a) * 22, y: 0, z: Math.sin(a) * 22, links: ['r' + ((i + 1) % n), 'r' + ((i + n - 1) % n)] });
        }
        for (let i = 0; i < 8; i++) {
            const a = i / 8 * Math.PI * 2 + Math.PI / 8;
            const id = 'm' + i;
            wps.push({ id, x: Math.cos(a) * 9, y: 0, z: Math.sin(a) * 9, links: ['c', 'm' + ((i + 1) % 8), 'm' + ((i + 7) % 8), 'r' + Math.round(i * 1.5) % 12] });
            wps[0].links.push(id);
            const r = wps.find((w) => w.id === 'r' + Math.round(i * 1.5) % 12);
            if (r) r.links.push(id);
        }
        return wps;
    }

    const BLESSINGS = [
        { key: 'Digit1', num: '1', id: 'wrath', name: 'WRATH', desc: '+15% Damage', color: '#ef4444', hex: 0xef4444, model: 'mini_dungeon_kit/weapon-sword.glb', x: -4.4 },
        { key: 'Digit2', num: '2', id: 'ironhide', name: 'IRONHIDE', desc: '+25 Max Armor & Refill', color: '#38bdf8', hex: 0x38bdf8, model: 'mini_dungeon_kit/shield-round.glb', x: 0 },
        { key: 'Digit3', num: '3', id: 'fleetfoot', name: 'FLEETFOOT', desc: '+10% Move Speed', color: '#facc15', hex: 0xfacc15, model: 'mini_dungeon_kit/potion.glb', x: 4.4 }
    ];

    function playClip(rel, volume = 0.4, rateJitter = 0.06) {
        if (BO.Assets && BO.Assets.playClip) BO.Assets.playClip(rel, { volume, rateJitter });
    }

    MG.register({
        id: 'boss_rush', cat: 'boss',
        name: 'Boss Rush', icon: '💀', accent: '#dc2626',
        tagline: 'Grand Citadel Colosseum. Every boss at 5x size. Gladiator Shrines & 3 Max Heals.',
        desc: 'Step into the Grand Citadel Colosseum and face every boss in the game, one after another, from The Butcher to Malakor, Eclipse Sovereign. Every boss is FIVE times its normal size and brings five signature attacks no other boss has. Your magazines never run dry, but your health does not regenerate. Between rounds you get 30 seconds to rest, claim Gladiator Blessing Shrines ([1] Wrath, [2] Ironhide, [3] Fleetfoot — 1 charge per 3 bosses!), and spend your THREE max heals ([H]) wisely.',
        hudSub: 'No HP regen • Rest: [H] Max Heal • [1/2/3] Gladiator Blessing Shrine',
        duration: 0, countdown: 3, infiniteMag: true, keepEquipment: true, forgivingMisses: true, customMusic: true,
        matchRules: { noHealthRegen: true },
        stars: [1, 2, 3, 4],
        starLabel: (th, i) => ['25% CLEARED', '50% CLEARED', 'FULL CLEAR', 'CLEAR + HEAL LEFT'][i],
        variants: VARIANTS, difficulties: DIFFS,
        map: {
            atmosphere: { skyTop: 0x1e1b4b, skyBottom: 0xf97316, fogColor: 0x2b1810, fogDensity: 0.0045, sunColor: 0xffb070, sunIntensity: 1.5, sunPos: [-40, 38, 60], hemiSky: 0xfdba74, hemiGround: 0x451a03, hemiIntensity: 0.8 },
            boxes: arenaBoxes(),
            spawn: { x: 0, y: 0, z: 20, yaw: 0 },
            waypoints: waypoints()
        },

        build(S) {
            const opts = S.opts;
            const variant = VARIANTS[opts.variant] ? opts.variant : 'gauntlet';
            const diff = DIFFS[opts.difficulty] ? opts.difficulty : 'veteran';
            if (BO.MinigameAudio) BO.MinigameAudio.start('siege');
            if (BO.Assets) {
                BO.Assets.applySkybox(S.scene, variant === 'titans' ? 'skybox-alien.png' : 'skybox-night.png');
                BO.Assets.crossfadeMusic(
                    variant === 'titans' ? 'music_curated/epic-dramatic-adventure-e9ece2c4.m4a' : 'music_curated/fantasy-behind-the-sword-fe2c66a5.m4a',
                    { volume: 0.22, fadeSec: 0.9 }
                );
            }
            S.data.variant = variant;
            S.data.diff = diff;
            S.data.queue = BO.ZombiesData.ORDERED_BOSSES.filter(VARIANTS[variant].filter);
            S.data.total = S.data.queue.length;
            S.data.bossIndex = 0;
            S.data.defeated = 0;
            S.data.heals = MAX_HEALS;
            S.data.healsUsed = 0;
            S.data.blessingCharges = 1;
            S.data.blessingsTaken = 0;
            S.data.wrathStacks = 0;
            S.data.ironhideStacks = 0;
            S.data.fleetfootStacks = 0;
            S.data.dmgMult = 1.0;
            S.data.spdBonus = 0;
            S.data.origMaxArmor = BO.Player.maxArmor || 150;
            S.data.phase = 'wait';
            S.data.phaseT = 0;
            S.data.zombies = [];
            S.data.projectiles = [];
            S.data.damageTaken = 0;
            S.data.damageDealt = 0;
            S.data.killTimes = [];
            S.data.prevHp = BO.Player.hp;
            S.data.prevPos = BO.Player.pos.clone();
            S.data.nextId = 1;

            // ---------- Grand Citadel Colosseum PBR Floor & Mosaic Seal ----------
            const sandMat = BO.Assets
                ? BO.Assets.pbrMat('fantasy_painterly/Sand Desert Coast/sun-baked-ground-001.png', 10, 10, { roughness: 0.94 })
                : new THREE.MeshStandardMaterial({ color: 0xc9a26b, roughness: 1 });
            const sand = new THREE.Mesh(new THREE.CircleGeometry(ARENA_R + 1.2, 64), sandMat);
            sand.rotation.x = -Math.PI / 2;
            sand.position.y = 0.01;
            sand.receiveShadow = true;
            S.add(sand);

            const sealMat = BO.Assets
                ? BO.Assets.pbrMat('fantasy_painterly/Decorative Tile Marble/onyx-gold-marble-001.png', 3, 3, { roughness: 0.45, metalness: 0.25 })
                : std(0x451a03, 0.6, 0.2);
            const centerSeal = new THREE.Mesh(new THREE.RingGeometry(3.2, 4.6, 48), sealMat);
            centerSeal.rotation.x = -Math.PI / 2;
            centerSeal.position.y = 0.022;
            S.add(centerSeal);
            const outerSeal = new THREE.Mesh(new THREE.RingGeometry(15.2, 16.0, 64), sealMat);
            outerSeal.rotation.x = -Math.PI / 2;
            outerSeal.position.y = 0.02;
            S.add(outerSeal);

            // Circular Colosseum Retaining Wall + Colliders
            const wallMat = BO.Assets
                ? BO.Assets.pbrMat('fantasy_painterly/Stone Masonry Ruins/ancient-courtyard-001.png', 16, 2, { side: THREE.BackSide, roughness: 0.9 })
                : std(0x8b7355, 0.95, 0, { side: THREE.BackSide });
            const wall = new THREE.Mesh(new THREE.CylinderGeometry(ARENA_R + 1.5, ARENA_R + 1.5, 6, 64, 1, true), wallMat);
            wall.position.y = 3;
            wall.receiveShadow = true;
            S.add(wall);
            S.solid(wall);

            const tierStoneMat = BO.Assets
                ? BO.Assets.pbrMat('fantasy_painterly/Stone Masonry Ruins/cracked-temple-blocks-001.png', 18, 2, { side: THREE.DoubleSide, roughness: 0.92 })
                : std(0x6b5a45, 0.95, 0, { side: THREE.DoubleSide });
            const cap = new THREE.Mesh(new THREE.TorusGeometry(ARENA_R + 1.6, 0.48, 8, 64), std(0x57534e, 0.85));
            cap.rotation.x = Math.PI / 2;
            cap.position.y = 6.1;
            S.add(cap);
            for (let i = 0; i < 56; i++) {
                const a = i / 56 * Math.PI * 2;
                const r = ARENA_R + 3.4;
                S.collider(Math.cos(a) * r - 2.4, 0, Math.sin(a) * r - 2.4, Math.cos(a) * r + 2.4, 8, Math.sin(a) * r + 2.4);
            }

            // Tiered Stands + Cheering Crowd
            for (let i = 0; i < 6; i++) {
                const tier = new THREE.Mesh(new THREE.CylinderGeometry(ARENA_R + 3 + i * 1.6, ARENA_R + 3 + i * 1.6, 1.2, 64, 1, true), i % 2 ? tierStoneMat : std(0x78716c, 0.95, 0, { side: THREE.DoubleSide }));
                tier.position.y = 6.2 + i * 1.2;
                S.add(tier);
                const step = new THREE.Mesh(new THREE.RingGeometry(ARENA_R + 2 + i * 1.6, ARENA_R + 3.6 + i * 1.6, 64), std(0x57534e, 0.95, 0, { side: THREE.DoubleSide }));
                step.rotation.x = -Math.PI / 2;
                step.position.y = 6.8 + i * 1.2;
                S.add(step);
            }
            S.data.crowd = A.crowd(S, ARENA_R + 3, 640, 6.9, 6, 1.6);

            // North Boss Gatehouse & South Champion Tunnel
            const gate = new THREE.Group();
            const archMat = std(0x57534e, 0.9);
            for (const sx of [-3.2, 3.2]) {
                const col = new THREE.Mesh(new THREE.BoxGeometry(1.4, 7.5, 2.4), archMat);
                col.position.set(sx, 3.75, 0);
                gate.add(col);
            }
            const lintel = new THREE.Mesh(new THREE.BoxGeometry(7.8, 1.6, 2.4), archMat);
            lintel.position.y = 7.3;
            gate.add(lintel);
            const dark = new THREE.Mesh(new THREE.PlaneGeometry(5, 6.5), basic(0x050302));
            dark.position.set(0, 3.25, -0.6);
            gate.add(dark);
            const port = new THREE.Group();
            for (let i = -5; i <= 5; i++) {
                const bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 6.4, 0.12), std(0x27272a, 0.5, 0.8));
                bar.position.set(i * 0.45, 3.2, 0);
                port.add(bar);
            }
            for (let j = 0; j < 4; j++) {
                const cross = new THREE.Mesh(new THREE.BoxGeometry(5, 0.12, 0.12), std(0x27272a, 0.5, 0.8));
                cross.position.set(0, 1 + j * 1.6, 0);
                port.add(cross);
            }
            port.position.z = 0.4;
            gate.add(port);
            const gsign = A.sign('CITADEL OF CHAMPIONS', 7.4, 0.95, { bg: '#450a0a', color: '#fde68a', borderColor: '#f59e0b', size: 0.48 });
            gsign.position.set(0, 8.7, 1.3);
            gate.add(gsign);
            gate.position.set(0, 0, -ARENA_R - 0.6);
            S.add(gate);
            S.data.port = port;

            const tunnel = gate.clone();
            tunnel.position.set(0, 0, ARENA_R + 0.6);
            tunnel.rotation.y = Math.PI;
            S.add(tunnel);

            // Cover Pillars (solid physics + 3D Citadel Columns)
            const pillarMat = BO.Assets
                ? BO.Assets.pbrMat('fantasy_painterly/Stone Masonry Ruins/carved-sandstone-001.png', 2, 4, { roughness: 0.85 })
                : std(0xa8a29e, 0.85);
            for (const [x, z] of PILLARS) {
                const pBox = S.box(x, 2.5, z, 2.2, 5, 2.2, pillarMat, { solid: true });
                const capP = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.5, 2.8), std(0x78716c, 0.9));
                capP.position.set(x, 5.2, z);
                S.add(capP);
                if (BO.Assets) {
                    BO.Assets.placeGLB(S.scene, 'mini_arena_kit/column.glb', { pos: [x, 0, z], fitSize: [2.7, 5.5, 2.7], hideFallback: [pBox, capP] });
                }
            }

            // Instanced Grand Citadel Towers, Banners, Statues, Siege Engines & Braziers!
            const lights = BO.Settings.getQualityPreset().pointLights;
            const brazierTransforms = [];
            const bannerTransforms = [];
            const keepBannerTransforms = [];
            for (let i = 0; i < 8; i++) {
                const a = i / 8 * Math.PI * 2 + Math.PI / 8;
                const bx = Math.cos(a) * (ARENA_R - 0.6), bz = Math.sin(a) * (ARENA_R - 0.6);
                const t = A.torch(S, V(bx, 0, bz), 0xff8a3c, lights && i % 2 === 0);
                S.add(t);
                brazierTransforms.push({ pos: [bx, 0, bz], rot: -a, fitSize: [1.3, 1.5, 1.3] });
                const ab = a + Math.PI / 8;
                const wx = Math.cos(ab) * (ARENA_R + 1.15), wz = Math.sin(ab) * (ARENA_R + 1.15);
                bannerTransforms.push({ pos: [wx, 2.2, wz], rot: -ab - Math.PI / 2, scale: 2.2 });
                keepBannerTransforms.push({ pos: [Math.cos(a) * (ARENA_R + 1.2), 3.0, Math.sin(a) * (ARENA_R + 1.2)], rot: -a - Math.PI / 2, fitSize: [1.8, 3.8, 0.6] });
            }

            const towerBaseTf = [], towerRoofTf = [], rimStatueTf = [];
            for (let i = 0; i < 12; i++) {
                const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
                const tr = ARENA_R + 13.5;
                const tx = Math.cos(a) * tr, tz = Math.sin(a) * tr;
                towerBaseTf.push({ pos: [tx, 6.5, tz], rot: -a, scale: 4.2 });
                towerRoofTf.push({ pos: [tx, 14.2, tz], rot: -a, scale: 4.2 });
                if (i % 2 === 0) {
                    const sr = ARENA_R + 2.4;
                    rimStatueTf.push({ pos: [Math.cos(a) * sr, 6.2, Math.sin(a) * sr], rot: -a - Math.PI / 2, scale: 2.4 });
                }
            }

            if (BO.Assets) {
                BO.Assets.placeGLBInstanced(S.scene, 'pixel_fantasy/pixel-fantasy-iron-brazier.glb', brazierTransforms, { fitSize: [1.2, 1.4, 1.2] });
                BO.Assets.placeGLBInstanced(S.scene, 'castle_kit/flag-banner-long.glb', bannerTransforms, { fitSize: [1.6, 4.2, 0.6] });
                BO.Assets.placeGLBInstanced(S.scene, 'pixel_fantasy/pixel-fantasy-giant-keep-banner.glb', keepBannerTransforms, { fitSize: [1.8, 3.8, 0.5] });
                BO.Assets.placeGLBInstanced(S.scene, 'castle_kit/tower-hexagon-base.glb', towerBaseTf, { fitSize: [5.5, 8.0, 5.5] });
                BO.Assets.placeGLBInstanced(S.scene, 'castle_kit/tower-hexagon-roof.glb', towerRoofTf, { fitSize: [5.8, 4.8, 5.8] });
                BO.Assets.placeGLBInstanced(S.scene, 'mini_arena_kit/statue.glb', rimStatueTf, { fitSize: [1.8, 3.4, 1.8] });

                // Gatehouse Lion Guardians, Siege Engines & Trophies
                for (const sx of [-5.2, 5.2]) {
                    BO.Assets.placeGLB(S.scene, 'pixel_fantasy/pixel-fantasy-standalone-lion-statue.glb', { pos: [sx, 0, -ARENA_R + 1.4], rot: 0, fitSize: [2.2, 3.2, 2.6] });
                    BO.Assets.placeGLB(S.scene, 'pixel_fantasy/pixel-fantasy-standalone-lion-statue.glb', { pos: [sx, 0, ARENA_R - 1.4], rot: Math.PI, fitSize: [2.2, 3.2, 2.6] });
                    BO.Assets.placeGLB(S.scene, 'mini_arena_kit/trophy.glb', { pos: [sx * 0.72, 8.1, -ARENA_R - 0.4], fitSize: [1.4, 1.8, 1.4] });
                }
                BO.Assets.placeGLB(S.scene, 'castle_kit/siege-ballista.glb', { pos: [-14, 13.8, -ARENA_R - 6], rot: 0.3, fitSize: [3.6, 2.6, 3.8] });
                BO.Assets.placeGLB(S.scene, 'castle_kit/siege-ballista.glb', { pos: [14, 13.8, -ARENA_R - 6], rot: -0.3, fitSize: [3.6, 2.6, 3.8] });
                BO.Assets.placeGLB(S.scene, 'castle_kit/siege-trebuchet.glb', { pos: [-22, 13.8, 0], rot: Math.PI / 2, fitSize: [4.5, 5.2, 4.5] });
                BO.Assets.placeGLB(S.scene, 'castle_kit/siege-trebuchet.glb', { pos: [22, 13.8, 0], rot: -Math.PI / 2, fitSize: [4.5, 5.2, 4.5] });
            }

            // ---------- South Sanctuary: Max Heal Altar + Armory + 3 Gladiator Blessing Shrines ----------
            const healZ = ARENA_R - 3.2;
            const altarFallback = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.9, 8), std(0x57534e, 0.8));
            altarFallback.position.set(0, 0.45, healZ);
            S.add(altarFallback);
            if (BO.Assets) {
                BO.Assets.placeGLB(S.scene, 'graveyard_kit/altar-stone.glb', { pos: [0, 0, healZ], fitSize: [2.2, 1.1, 1.4], hideFallback: altarFallback });
                BO.Assets.placeGLB(S.scene, 'graveyard_kit/candle-multiple.glb', { pos: [-0.85, 0.95, healZ], fitSize: [0.45, 0.45, 0.45] });
                BO.Assets.placeGLB(S.scene, 'graveyard_kit/candle-multiple.glb', { pos: [0.85, 0.95, healZ], fitSize: [0.45, 0.45, 0.45] });
                BO.Assets.placeGLB(S.scene, 'mini_arena_kit/weapon-rack.glb', { pos: [-7.4, 0, ARENA_R - 2.6], rot: 2.6, fitSize: [2.2, 2.2, 1.1] });
                BO.Assets.placeGLB(S.scene, 'pixel_fantasy/pixel-fantasy-wooden-weapon-rack.glb', { pos: [7.4, 0, ARENA_R - 2.6], rot: -2.6, fitSize: [2.2, 2.2, 1.1] });
            }
            const healSign = A.sign('[H] MAX HEAL ALTAR', 2.8, 0.42, { bg: '#052e16', color: '#86efac', borderColor: '#22c55e', size: 0.36 });
            healSign.position.set(0, 2.15, healZ);
            healSign.rotation.y = Math.PI;
            S.add(healSign);

            const orbs = [];
            for (let i = 0; i < MAX_HEALS; i++) {
                const orb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 1.3, roughness: 0.2 }));
                orb.position.set(-0.52 + i * 0.52, 1.35, healZ);
                S.add(orb);
                orbs.push(orb);
            }
            S.data.orbs = orbs;

            // 3 Gladiator Blessing Shrines (Rest-Phase Strategic Buffs: [1] Wrath, [2] Ironhide, [3] Fleetfoot)
            const shrineZ = ARENA_R - 6.8;
            const shrineNodes = BLESSINGS.map((b) => {
                const grp = new THREE.Group();
                grp.position.set(b.x, 0, shrineZ);
                const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.82, 0.85, 10), std(0x44403c, 0.8));
                ped.position.y = 0.42;
                grp.add(ped);
                if (BO.Assets) {
                    BO.Assets.placeGLB(grp, 'pixel_fantasy/pixel-fantasy-carved-weathered-limestone-ritual-altar.glb', { pos: [0, 0, 0], fitSize: [1.45, 0.92, 1.1], hideFallback: ped });
                }
                const relicSpin = new THREE.Group();
                relicSpin.position.y = 1.42;
                const relicFallback = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), new THREE.MeshStandardMaterial({ color: b.hex, emissive: b.hex, emissiveIntensity: 0.9, roughness: 0.25 }));
                relicSpin.add(relicFallback);
                if (BO.Assets) {
                    BO.Assets.placeGLB(relicSpin, b.model, { pos: [0, -0.25, 0], fitSize: [0.85, 0.85, 0.85], hideFallback: relicFallback });
                }
                grp.add(relicSpin);
                const aura = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.95, 28), new THREE.MeshBasicMaterial({ color: b.hex, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false }));
                aura.rotation.x = -Math.PI / 2;
                aura.position.y = 0.04;
                grp.add(aura);
                const lbl = A.sign(`[${b.num}] ${b.name} • ${b.desc}`, 2.6, 0.40, { bg: '#0f172a', color: b.color, borderColor: b.color, size: 0.32 });
                lbl.position.y = 2.25;
                lbl.rotation.y = Math.PI;
                grp.add(lbl);
                S.add(grp);
                return { grp, relicSpin, aura, lbl };
            });
            S.data.shrineNodes = shrineNodes;

            S.animate(() => {
                const t = performance.now() * 0.0022;
                orbs.forEach((o, i) => { o.position.y = 1.35 + Math.sin(t + i) * 0.08; });
                const activeShrines = S.data.phase === 'rest' && S.data.blessingCharges > 0;
                shrineNodes.forEach((sn, idx) => {
                    sn.relicSpin.rotation.y = t * 1.1 + idx;
                    sn.relicSpin.position.y = 1.42 + Math.sin(t * 1.5 + idx) * 0.09;
                    sn.aura.material.opacity = activeShrines ? 0.55 + Math.sin(t * 3 + idx) * 0.28 : 0.12;
                    sn.aura.scale.setScalar(activeShrines ? 1 + Math.sin(t * 3 + idx) * 0.08 : 0.88);
                    sn.lbl.visible = S.data.phase === 'rest';
                });
            });

            // Chasing crimson/gold Colosseum rim marquee bulbs + gate framing + spotlight
            const colPts = [];
            for (let i = 0; i < 36; i++) {
                const a = (i / 36) * Math.PI * 2;
                colPts.push(V(Math.cos(a) * (ARENA_R + 1.5), 6.35, Math.sin(a) * (ARENA_R + 1.5)));
            }
            for (let gx = -3.6; gx <= 3.6; gx += 0.9) colPts.push(V(gx, 8.1, -ARENA_R + 0.7), V(gx, 9.1, -ARENA_R + 0.7));
            const colBulbs = A.bulbs(colPts, [0xfacc15, 0xf97316, 0xef4444], 0.14);
            S.add(colBulbs); A.animateBulbs(S, colBulbs, 6, 'chase');
            if (lights) {
                const spot = new THREE.PointLight(0xffb070, 1.9, 68, 1.2);
                spot.position.set(0, 18, 0); S.add(spot);
            }
        },

        onGo(S) {
            S.data.phase = 'pre';
            S.data.phaseT = 1.2;
            BO.Sound.playAnnouncement && BO.Sound.playAnnouncement('match_start', 'Let the rush begin', 1);
            SFX.crowd(0.22);
            S.data.crowd.cheer(1);
        },

        _spawnBoss(S) {
            const spec = S.data.queue[S.data.bossIndex];
            const d = DIFFS[S.data.diff];
            // Effective HP grows steadily through the rush; normalise by each boss's armour so heavily
            // resistant bosses don't turn into five-minute bullet sponges.
            const res = spec.resistances || {};
            const armour = (1 - BO.Math.clamp(spec.defense || 0, 0, 0.7)) * (res.bullet ?? 1);
            const effective = (2400 + spec.hp * 0.26) * d.hp * (spec.isSuperBoss ? 1.15 : 1);
            const hp = Math.round(effective * BO.Math.clamp(armour, 0.2, 1));
            const ent = new BO.ZombieEntity({
                id: S.data.nextId++, spec, round: 20 + S.data.bossIndex * 3,
                hp, speed: Math.min(9, (spec.speed || 3) * d.spd), damage: Math.max(5, Math.round((spec.attack || 60) * d.dmg)),
                x: 0, y: 0, z: -ARENA_R + 6, splitCount: 0, hasGun: false, sizeMult: BOSS_SCALE
            });
            ent.mgBoss = true;
            BO.MinigameFeel?.onBossRound(S.data.bossIndex, S.data.queue.length);
            const sc = (spec.bodySpec && spec.bodySpec.scale) || [1, 1, 1];
            ent.radius = BO.Math.clamp(0.38 * sc[0] * BOSS_SCALE, 1.6, 4.2);
            ent.height *= BOSS_SCALE;
            ent.superMechanic = null;              // only the five Boss Rush signature attacks
            ent.pos.z = -ARENA_R + ent.radius + 1.5;
            ent.parts.root.position.copy(ent.pos);
            if (S.data.runner) S.data.runner.dispose();
            S.data.runner = new BO.BossAttacks.Runner(S, ent, ARENA_R);
            S.data.stompCd = 2;
            ent.stunTimer = 1.8; // brief roar in the gateway
            S.data.zombies.push(ent);
            S.data.boss = ent;
            S.data.bossSpawnT = S.t;
            S.data.bossLabel = spec.name;
            playClip('rpg_sfx/metalLatch.ogg', 0.48, 0.04);
            playClip('rpg_sfx/creak1.ogg', 0.36, 0.05);
            BO.Sound.playBossIntro();
            BO.Events.emit('hud:banner', {
                title: spec.name,
                sub: `BOSS ${S.data.bossIndex + 1} / ${S.data.total}${spec.isSuperBoss ? ' • SUPER BOSS' : ''} • ${DIFFS[S.data.diff].label}`,
                color: spec.isSuperBoss ? '#fbbf24' : '#f87171'
            });
            S.data.crowd.cheer(1);
            SFX.crowd(0.26);
        },

        _spawnProjectile(S, z, tx, ty, tz, extra) {
            const kind = (extra && extra.kind) || z.attackType;
            const col = kind === 'acid_spit' ? 0x4ade80 : (kind === 'fire_bolt' ? 0xf97316 : (kind === 'frost_shard' ? 0x38bdf8 : (kind === 'life_drain' ? 0xef4444 : 0xc084fc)));
            const count = (extra && extra.count) || (z.isSuperBoss ? 4 : 3);
            const spreadStep = (extra && extra.spread !== undefined) ? extra.spread : 0.16;
            const originY = (extra && extra.originY) || (z.isSuperBoss ? 3.1 : 1.4);
            const speed = (extra && extra.speed) || (z.isSuperBoss ? 21 : 19);
            const origin = V(z.pos.x, z.pos.y + originY, z.pos.z);
            for (let c = 0; c < count; c++) {
                const sa = (c - (count - 1) * 0.5) * spreadStep;
                const dir = V(tx - origin.x, ty - origin.y, tz - origin.z).normalize();
                if (sa) dir.applyAxisAngle(V(0, 1, 0), sa);
                const mesh = new THREE.Mesh(new THREE.SphereGeometry(z.isSuperBoss ? 0.27 : 0.22, 8, 8), new THREE.MeshBasicMaterial({ color: col }));
                mesh.position.copy(origin);
                S.add(mesh);
                S.data.projectiles.push({ kind, mesh, pos: origin.clone(), vel: dir.multiplyScalar(speed), damage: Math.round(z.damage * (z.isSuperBoss ? 0.58 : 0.65)), life: 3.5, color: col, owner: z });
            }
            BO.Sound.playZombieGroan(z.soundProfile, 0.75);
        },

        update(S, dt, lib, state) {
            const D = S.data;
            const P = BO.Player;
            if (BO.MinigameAudio) BO.MinigameAudio.tick(dt, { wardenAwake: D.phase === 'fight', wardenPhase2: !!(D.boss && D.boss.superEnraged) });
            if (!D.zombies) return;

            // Fleetfoot Gladiator Blessing (+10% horizontal movement stride per stack)
            if (D.spdBonus > 0 && P.alive && state === 'running' && D.prevPos) {
                const dx = P.pos.x - D.prevPos.x, dz = P.pos.z - D.prevPos.z;
                const distSq = dx * dx + dz * dz;
                if (distSq > 1e-6 && distSq < 4) {
                    P.pos.x += dx * D.spdBonus;
                    P.pos.z += dz * D.spdBonus;
                    BO.World.resolveHorizontal(P.pos, 0.4, 1.8, true);
                }
            }
            D.prevPos = P.pos.clone();

            // damage taken bookkeeping
            if (P.hp < D.prevHp) D.damageTaken += D.prevHp - P.hp;
            D.prevHp = P.hp;

            // orbs reflect heals left
            D.orbs.forEach((o, i) => { o.visible = i < D.heals; });

            // portcullis
            const portUp = D.phase === 'intro' || D.phase === 'fight';
            if (portUp !== D._wasPortUp && D._wasPortUp !== undefined) {
                playClip('rpg_sfx/metalLatch.ogg', 0.42, 0.05);
            }
            D._wasPortUp = portUp;
            D.portY = (D.portY || 0) + ((portUp ? 6 : 0) - (D.portY || 0)) * Math.min(1, dt * 1.5);
            D.port.position.y = D.portY;

            if (state === 'running') {
                if (!P.alive && D.phase !== 'dead') {
                    D.phase = 'dead';
                    MG.finish('DEFEATED', { color: '#ef4444', delay: 2.6 });
                    SFX.crowd(0.15);
                }
                D.phaseT -= dt;
                if (D.phase === 'pre' && D.phaseT <= 0) {
                    D.phase = 'intro';
                    D.phaseT = 2.2;
                    this._spawnBoss(S);
                } else if (D.phase === 'intro' && D.phaseT <= 0) {
                    D.phase = 'fight';
                } else if (D.phase === 'fight') {
                    if (D.boss && !D.boss.alive) {
                        BO.MinigameFeel?.onBossDown();
                        D.defeated++;
                        if (D.defeated % 3 === 0) D.blessingCharges++;
                        D.killTimes.push(S.t - D.bossSpawnT);
                        D.phase = 'victory';
                        D.phaseT = 3.2;
                        BO.State.timeScale = 0.35;
                        setTimeout(() => { if (BO.State.timeScale === 0.35) BO.State.timeScale = 1; }, 1300);
                        S.award(1000, D.boss.pos.clone().add(V(0, 3, 0)), 'BOSS DOWN', '#facc15');
                        BO.Events.emit('hud:banner', { title: `${D.boss.spec.name} DEFEATED`, sub: `${D.defeated} / ${D.total} • ${BO.Math.formatTime(S.t - D.bossSpawnT)}`, color: '#22c55e' });
                        playClip('overhaul/combat/bone_snap.wav', 0.52, 0.05);
                        playClip('overhaul/stingers/level_complete.wav', 0.36, 0.02);
                        BO.Sound.playRoundEnd();
                        SFX.crowd(0.32);
                        D.crowd.cheer(1.4);
                        for (const pr of D.projectiles) S.scene.remove(pr.mesh);
                        D.projectiles = [];
                        if (D.runner) { D.runner.dispose(); D.runner = null; }
                        for (const z of D.zombies) if (z.mgMinion && z.alive) z.takeDamage(1e9, 'torso', false);
                    }
                } else if (D.phase === 'victory' && D.phaseT <= 0) {
                    D.bossIndex++;
                    if (D.bossIndex >= D.total) {
                        D.phase = 'done';
                        D.completed = true;
                        MG.finish('RUSH COMPLETE!', { color: '#22c55e', delay: 2.4 });
                        SFX.fanfare();
                    } else {
                        D.phase = 'rest';
                        D.phaseT = REST_TIME;
                        D._restBeep = 99;
                        P.lethalCount = BO.AttachmentsData.LETHALS[P.lethalId]?.count || 2;
                        P.tacticalCount = BO.AttachmentsData.TACTICALS[P.tacticalId]?.count || 2;
                        const shrineHint = D.blessingCharges > 0 ? ' • [1/2/3] CLAIM BLESSING!' : '';
                        MG.toast((D.heals > 0 ? `REST — [H] MAX HEAL (${D.heals} LEFT)` : 'REST — NO HEALS LEFT') + shrineHint, D.blessingCharges > 0 ? '#fde047' : (D.heals > 0 ? '#4ade80' : '#f87171'));
                    }
                } else if (D.phase === 'rest') {
                    const n = Math.ceil(D.phaseT);
                    if (n <= 5 && n !== D._restBeep && n > 0) { D._restBeep = n; SFX.beep(false); }
                    if (D.phaseT <= 0) {
                        D.phase = 'intro';
                        D.phaseT = 2.2;
                        this._spawnBoss(S);
                    }
                }
            }

            // bosses
            const callbacks = {
                allowProjectiles: false,
                onMeleePlayer: (z) => { if (P.alive) P.takeDamage(z.damage, z.pos, false, z); },
                onRangedAttack: (z, tx, ty, tz, extra) => this._spawnProjectile(S, z, tx, ty, tz, extra)
            };
            if (D.runner) D.runner.update(dt, state === 'running' && D.phase === 'fight');
            // stomp: the stock melee range is far too short for a 5x boss, so giants crush whoever is underfoot
            const bz = D.boss;
            if (bz && bz.alive && D.phase === 'fight' && state === 'running') {
                D.stompCd -= dt;
                if (D.stompCd <= 0 && P.alive && Math.hypot(P.pos.x - bz.pos.x, P.pos.z - bz.pos.z) < bz.radius + 1.6) {
                    D.stompCd = 1.5;
                    bz.attackSwing = 1;
                    P.takeDamage(Math.round(bz.damage * 0.55), bz.pos, false, bz);
                    BO.FX.spawnExplosion(V(P.pos.x, 0.2, P.pos.z), 2.4, 0xd6d3d1);
                    playClip('sfx/Gameplay Effects (Desert Shooter)/explosion-a.ogg', 0.42, 0.08);
                    P.cameraShake = Math.max(P.cameraShake, 0.08);
                }
            }
            const frozen = state === 'finish' || state === 'results' || D.phase === 'intro';
            for (let i = D.zombies.length - 1; i >= 0; i--) {
                const z = D.zombies[i];
                if (frozen && z.alive) {
                    z.yaw = Math.atan2(P.pos.x - z.pos.x, P.pos.z - z.pos.z);
                    z.parts.root.rotation.y = z.yaw;
                    z.parts.root.position.copy(z.pos);
                    if (D.phase === 'intro' && state === 'running') { z.pos.z += dt * 2.2; }
                    continue;
                }
                if (z.mgScripted && z.alive) continue;
                const keep = z.update(dt, D.zombies, callbacks);
                if (z.alive) {
                    const r = Math.hypot(z.pos.x, z.pos.z), R = ARENA_R - Math.max(1, z.mgBoss ? z.radius + 0.5 : 1);
                    if (r > R) { z.pos.x *= R / r; z.pos.z *= R / r; }
                }
                if (!keep) { z.destroy(); D.zombies.splice(i, 1); }
            }

            // projectiles
            for (let i = D.projectiles.length - 1; i >= 0; i--) {
                const ep = D.projectiles[i];
                ep.life -= dt;
                const step = ep.vel.clone().multiplyScalar(dt);
                const hitWall = BO.World.raycastWorld(ep.pos, step.clone().normalize(), step.length() + 0.15);
                ep.pos.add(step);
                ep.mesh.position.copy(ep.pos);
                const hitPlayer = P.alive && BO.Math.dist3D(ep.pos.x, ep.pos.y, ep.pos.z, P.pos.x, P.pos.y + 1.1, P.pos.z) < 0.78;
                if (hitPlayer) {
                    P.takeDamage(ep.damage, ep.owner ? ep.owner.pos : ep.pos, false);
                    if (ep.kind === 'life_drain' && ep.owner && ep.owner.alive) ep.owner.hp = Math.min(ep.owner.maxHp, ep.owner.hp + 55);
                    BO.FX.spawnParticles(ep.pos, 8, ep.color, 3.5, 6, 0.4, 1.2);
                }
                if (hitPlayer || hitWall || ep.life <= 0) {
                    if (hitWall) BO.FX.spawnParticles(ep.pos, 6, ep.color, 3, 6, 0.35, 1.0);
                    S.scene.remove(ep.mesh);
                    D.projectiles.splice(i, 1);
                }
            }
        },

        extraTargets(S, pool) {
            for (const z of S.data.zombies || []) if (z.alive) for (const m of z.getHitboxMeshes()) pool.push(m);
        },

        onHit(S, ent, info) {
            const mult = S.data.dmgMult || 1;
            const scaledDmg = info.dmg * mult;
            if (ent.mgMinion) {
                const killedM = ent.takeDamage(scaledDmg, info.hitbox, info.hitbox === 'head', null, 'bullet');
                S.hits++;
                return killedM;
            }
            if (!ent.mgBoss) return undefined;
            if (S.data.phase === 'intro') return false;
            const isMelee = info.w && info.w.stats && info.w.stats.kind === 'melee';
            const before = ent.hp;
            const killed = ent.takeDamage(scaledDmg, info.hitbox, info.hitbox === 'head', null, isMelee ? 'melee' : 'bullet');
            S.data.damageDealt += Math.max(0, before - ent.hp);
            if (info.hitbox === 'head') S.headshots++;
            S.hits++;
            return killed;
        },

        onExplode(S, pos, rad, dmg, isFlash, stunDur, wid) {
            const mult = S.data.dmgMult || 1;
            for (const z of S.data.zombies || []) {
                if (!z.alive) continue;
                const d = z.pos.distanceTo(pos);
                if (d > rad + z.radius) continue;
                if (isFlash) { z.stunTimer = Math.max(z.stunTimer, (stunDur || 3) * 0.4); continue; }
                const before = z.hp;
                z.takeDamage(dmg * mult * (1 - (d / (rad + z.radius)) * 0.45), 'torso', false, null, 'explosive');
                S.data.damageDealt += Math.max(0, before - z.hp);
            }
        },

        onKey(S, code) {
            const D = S.data;
            const P = BO.Player;
            if (code === 'KeyH') {
                if (D.phase !== 'rest') { MG.toast('MAX HEALS CAN ONLY BE USED DURING REST', '#fca5a5'); return true; }
                if (D.heals <= 0) { MG.toast('NO MAX HEALS LEFT', '#f87171'); SFX.buzzer(); return true; }
                if (P.hp >= P.maxHp && P.armor >= (P.maxArmor || 150)) { MG.toast('ALREADY AT FULL STRENGTH', '#fde68a'); return true; }
                D.heals--;
                D.healsUsed++;
                P.hp = P.maxHp;
                P.armor = P.maxArmor || 150;
                D.prevHp = P.hp;
                SFX.heal();
                playClip('overhaul/stingers/chime_positive.wav', 0.44, 0.02);
                BO.FX.spawnParticles(P.pos.clone().add(V(0, 1.2, 0)), 30, 0x4ade80, 4, -2, 1.0, 1.4);
                MG.flashScreen('rgba(34,197,94,0.25)');
                MG.toast(`MAX HEAL USED — ${D.heals} REMAINING`, '#4ade80');
                return true;
            }
            const bl = BLESSINGS.find((b) => b.key === code);
            if (bl && D.phase === 'rest') {
                if (D.blessingCharges <= 0) {
                    const nextAt = Math.ceil((D.defeated + 1) / 3) * 3;
                    MG.toast(`NO SHRINE CHARGE — NEXT BLESSING UNLOCKS AT ${nextAt} BOSSES`, '#fca5a5');
                    SFX.buzzer();
                    return true;
                }
                D.blessingCharges--;
                D.blessingsTaken++;
                if (bl.id === 'wrath') {
                    D.wrathStacks++;
                    D.dmgMult = +(1 + D.wrathStacks * 0.15).toFixed(2);
                    MG.toast(`⚔ WRATH BLESSING CLAIMED! (+${Math.round(D.wrathStacks * 15)}% DAMAGE)`, bl.color);
                } else if (bl.id === 'ironhide') {
                    D.ironhideStacks++;
                    P.maxArmor = (P.maxArmor || 150) + 25;
                    P.armor = P.maxArmor;
                    MG.toast(`🛡 IRONHIDE BLESSING CLAIMED! (${P.maxArmor} MAX ARMOR & PLATES REFILLED)`, bl.color);
                } else if (bl.id === 'fleetfoot') {
                    D.fleetfootStacks++;
                    D.spdBonus = +(D.fleetfootStacks * 0.10).toFixed(2);
                    MG.toast(`⚡ FLEETFOOT BLESSING CLAIMED! (+${Math.round(D.fleetfootStacks * 10)}% MOVE SPEED)`, bl.color);
                }
                playClip('sfx/Digital Audio (Kenney)/Audio/powerUp7.ogg', 0.45, 0.04);
                playClip('overhaul/stingers/chime_positive.wav', 0.40, 0.02);
                BO.FX.spawnParticles(P.pos.clone().add(V(0, 1.2, 0)), 32, bl.hex, 4.5, -1.5, 1.0, 1.4);
                MG.flashScreen('rgba(250,204,21,0.22)');
                return true;
            }
            if (code === 'KeyN' && D.phase === 'rest') {
                D.phaseT = Math.min(D.phaseT, 0.01);
                MG.toast('READY — HERE IT COMES', '#fca5a5');
                return true;
            }
            return false;
        },

        scoreText(S) { return `${S.data.defeated} / ${S.data.total}`; },

        hud(S, lib, state) {
            const D = S.data;
            const P = BO.Player;
            const pips = Array.from({ length: MAX_HEALS }, (_, i) => `<i class="${i < D.heals ? 'on' : ''}"></i>`).join('');
            const buffs = [];
            if (D.wrathStacks > 0) buffs.push(`<span style="color:#fca5a5;margin-left:6px">⚔+${D.wrathStacks * 15}%</span>`);
            if (D.ironhideStacks > 0) buffs.push(`<span style="color:#7dd3fc;margin-left:6px">🛡+${D.ironhideStacks * 25}</span>`);
            if (D.fleetfootStacks > 0) buffs.push(`<span style="color:#fde047;margin-left:6px">⚡+${D.fleetfootStacks * 10}%</span>`);
            let html = `<div class="br-heals"><span>MAX HEALS</span><div class="br-pips">${pips}</div>${buffs.join('')}</div>`;
            const z = D.boss;
            if (z && (D.phase === 'fight' || D.phase === 'intro' || D.phase === 'victory')) {
                const frac = clamp01(z.hp / z.maxHp);
                const enr = z.superEnraged ? ' br-enraged' : '';
                html += `<div class="br-boss${enr}">
                    <div class="br-boss-top"><b>${esc(z.spec.name)}</b><span>${z.isSuperBoss ? 'SUPER BOSS • ' : ''}${D.bossIndex + 1}/${D.total}</span></div>
                    <div class="br-bar"><i style="width:${(frac * 100).toFixed(1)}%"></i><em style="left:50%"></em></div>
                    <div class="br-boss-sub"><span>${Math.ceil(z.hp).toLocaleString()} / ${z.maxHp.toLocaleString()}</span><span>${z.superEnraged ? 'PHASE II' : (z.isSuperBoss ? 'PHASE I' : '')}</span></div>
                    ${D.runner ? `<div class="br-moves">${D.runner.list.map((a) => `<span class="${a.cd <= 0 ? 'ready' : ''}" title="Tier ${a.def.tier}">${'▮'.repeat(a.def.tier)} ${esc(a.def.name)}</span>`).join('')}</div>` : ''}
                </div>`;
                if (D.runner && D.runner.labelT > 0) html += `<div class="bra-tele">⚠ ${esc(D.runner.label)}</div>`;
            }
            if (D.phase === 'rest') {
                const next = D.queue[D.bossIndex];
                const hpPct = Math.round(P.hp / P.maxHp * 100);
                const shrineRow = D.blessingCharges > 0
                    ? `<div class="br-rest-keys" style="margin-top:4px"><span style="color:#fca5a5"><kbd>1</kbd> WRATH (+15% DMG)</span><span style="color:#7dd3fc"><kbd>2</kbd> IRONHIDE (+25 ARMOR)</span><span style="color:#fde047"><kbd>3</kbd> FLEETFOOT (+10% SPD)</span></div>`
                    : `<div class="br-rest-hp" style="opacity:0.7">SHRINE RECHARGES EVERY 3 BOSSES (${3 - (D.defeated % 3)} TO GO)</div>`;
                html += `<div class="br-rest">
                    <small>CITADEL SANCTUARY • REST PERIOD</small>
                    <div class="br-rest-t">${Math.ceil(D.phaseT)}</div>
                    <div class="br-rest-next">NEXT: <b>${esc(next.name)}</b>${next.isSuperBoss ? ' <em>SUPER BOSS</em>' : ''}</div>
                    <div class="br-rest-hp">HEALTH ${hpPct}% • ARMOR ${Math.round(P.armor)} / ${P.maxArmor || 150}</div>
                    <div class="br-rest-keys"><span class="${D.heals > 0 ? '' : 'dim'}"><kbd>H</kbd> MAX HEAL (${D.heals} LEFT)</span><span><kbd>N</kbd> I'M READY</span></div>
                    ${shrineRow}
                </div>`;
            }
            return html;
        },

        result(S) {
            const D = S.data;
            const frac = D.total ? D.defeated / D.total : 0;
            let stars = 0;
            if (frac >= 0.25) stars = 1;
            if (frac >= 0.5) stars = 2;
            if (D.completed) stars = 3;
            if (D.completed && D.heals > 0) stars = 4;
            const timeBonus = D.completed ? Math.max(0, 6000 - Math.round(S.t) * 3) : 0;
            const score = D.defeated * 1000 + timeBonus + (D.completed ? D.heals * 750 : 0);
            const fastest = D.killTimes.length ? Math.min(...D.killTimes) : 0;
            const xpMul = DIFFS[D.diff].xp;
            return {
                score, stars,
                title: D.completed ? (stars === 4 ? 'FLAWLESS CHAMPION' : 'ARENA CHAMPION') : `FELL TO ${S.data.bossLabel || 'THE ARENA'}`,
                scoreLabel: 'RUSH SCORE',
                stats: [
                    ['BOSSES DEFEATED', `${D.defeated} / ${D.total}`],
                    ['TOTAL TIME', BO.Math.formatTime(S.t)],
                    ['MAX HEALS USED', `${D.healsUsed} / ${MAX_HEALS}`],
                    ['SHRINE BLESSINGS', D.blessingsTaken || 0],
                    ['DAMAGE DEALT', Math.round(D.damageDealt).toLocaleString()],
                    ['FASTEST KILL', fastest ? fastest.toFixed(1) + 's' : '—']
                ],
                graph: [0, ...D.killTimes.map((_, i) => i + 1)],
                graphLabel: 'BOSSES DEFEATED',
                xp: Math.round((300 + D.defeated * 400 + (D.completed ? 2500 : 0)) * xpMul),
                saveExtra: { defeated: D.defeated, total: D.total, time: Math.round(S.t), heals: D.heals }
            };
        },

        formatBest(prev) {
            const e = prev.extra || {};
            return `${Number(prev.score).toLocaleString()} (${e.defeated ?? '?'}/${e.total ?? '?'}${e.time ? ' • ' + BO.Math.formatTime(e.time) : ''})`;
        },

        dispose(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.stop();
            if (BO.Assets && BO.Assets.stopMusicClips) BO.Assets.stopMusicClips(0.3);
            BO.State.timeScale = 1;
            if (S.data.origMaxArmor) {
                BO.Player.maxArmor = S.data.origMaxArmor;
                BO.Player.armor = Math.min(BO.Player.armor, BO.Player.maxArmor);
            }
            if (S.data.runner) { S.data.runner.dispose(); S.data.runner = null; }
            for (const z of S.data.zombies || []) z.destroy();
            S.data.zombies = [];
            for (const pr of S.data.projectiles || []) S.scene.remove(pr.mesh);
            S.data.projectiles = [];
        }
    });

})(window);
