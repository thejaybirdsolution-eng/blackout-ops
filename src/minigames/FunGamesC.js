/* ============================================================================
   BLACKOUT OPS — MINIGAMES: FUN SECTION (Part 3: 6–7)
     6. Final Fantasy RPG — Full 3D Explorable World, Story Quests, Recruit 3 Allies, Shop, 20 Enemies, 3 Bosses
     7. Bunker Inspection — 10-min checkpoint with Equippable 20/50/100 Sign Manual & 100% Observable Visual Signs
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const L = BO.MinigameLib;
    const A = BO.MinigameArt;
    const K = BO.MGCourseKit;
    const F = BO.MGFigures;
    const { B, SFX, std, basic, TAU, esc } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);

    /* =====================================================================
       6. FINAL FANTASY — FULL EXPLORABLE STORY RPG
    ===================================================================== */
    const FF_EQUIP = {
        weapons: [
            { id: 'iron_blade', name: 'Iron Blade', atk: 14, mag: 4, price: 0 },
            { id: 'mythril_saber', name: 'Mythril Saber', atk: 24, mag: 8, price: 240 },
            { id: 'flame_rod', name: 'Flame Rod', atk: 12, mag: 26, price: 260 },
            { id: 'wind_dagger', name: 'Zephyr Twinblade', atk: 30, mag: 10, price: 380 },
            { id: 'sun_halberd', name: 'Radiant Halberd', atk: 36, mag: 16, price: 540 },
            { id: 'astral_staff', name: 'Astral Sage Staff', atk: 18, mag: 44, price: 620 },
            { id: 'masamune', name: 'Masamune Edge', atk: 46, mag: 18, price: 880 },
            { id: 'excalibur', name: 'Excalibur Prime', atk: 58, mag: 28, price: 1400 }
        ],
        armors: [
            { id: 'travel_cloak', name: 'Traveler Mail', def: 6, hp: 25, price: 0 },
            { id: 'emerald_robe', name: 'Emerald Silks', def: 10, hp: 50, price: 220 },
            { id: 'canyon_leather', name: 'Canyon Guard Coat', def: 14, hp: 70, price: 340 },
            { id: 'knight_plate', name: 'Ironhold Plate', def: 20, hp: 110, price: 520 },
            { id: 'crystal_vest', name: 'Crystal Aegis', def: 26, hp: 140, price: 850 },
            { id: 'omega_aegis', name: 'Omega Crown Armor', def: 34, hp: 200, price: 1500 }
        ]
    };

    const FF_ENEMIES = [
        { name: 'Goblin Scout', hp: 115, atk: 17, col: 0x4ade80, shape: 'goblin', weak: 'fire', gil: 55, xp: 45 },
        { name: 'Blue Flan', hp: 130, atk: 16, col: 0x38bdf8, shape: 'slime', weak: 'thunder', gil: 60, xp: 48 },
        { name: 'Cactuar', hp: 125, atk: 24, col: 0x84cc16, shape: 'cactus', weak: 'ice', gil: 110, xp: 70 },
        { name: 'Bomb', hp: 155, atk: 26, col: 0xf97316, shape: 'orb', weak: 'ice', gil: 75, xp: 60 },
        { name: 'Skeleton Captain', hp: 175, atk: 25, col: 0xe5e7eb, shape: 'knight', weak: 'holy', gil: 85, xp: 68 },
        { name: 'Gargoyle', hp: 195, atk: 28, col: 0x64748b, shape: 'winged', weak: 'holy', gil: 95, xp: 75 },
        { name: 'Malboro', hp: 245, atk: 30, col: 0x16a34a, shape: 'slime', weak: 'fire', gil: 120, xp: 90 },
        { name: 'Coeurl', hp: 215, atk: 32, col: 0x6366f1, shape: 'beast', weak: 'ice', gil: 110, xp: 85 },
        { name: 'Tonberry', hp: 255, atk: 36, col: 0x15803d, shape: 'goblin', weak: 'thunder', gil: 145, xp: 105 },
        { name: 'Wyvern', hp: 275, atk: 34, col: 0xdc2626, shape: 'winged', weak: 'ice', gil: 140, xp: 100 },
        { name: 'Chimera', hp: 295, atk: 38, col: 0xa855f7, shape: 'beast', weak: 'thunder', gil: 155, xp: 115 },
        { name: 'Dark Knight', hp: 325, atk: 40, col: 0x1e293b, shape: 'knight', weak: 'holy', gil: 175, xp: 125 },
        { name: 'Iron Giant', hp: 375, atk: 44, col: 0x475569, shape: 'knight', weak: 'thunder', gil: 210, xp: 145 },
        { name: 'Behemoth', hp: 400, atk: 46, col: 0x7c3aed, shape: 'beast', weak: 'fire', gil: 235, xp: 160 },
        { name: 'Sand Worm', hp: 345, atk: 40, col: 0xd97706, shape: 'slime', weak: 'ice', gil: 190, xp: 135 },
        { name: 'Lichling', hp: 310, atk: 42, col: 0x9333ea, shape: 'orb', weak: 'fire', gil: 180, xp: 130 },
        { name: 'Void Eye', hp: 285, atk: 39, col: 0xec4899, shape: 'orb', weak: 'holy', gil: 165, xp: 120 },
        { name: 'Mimic Chest', hp: 330, atk: 45, col: 0xf59e0b, shape: 'cactus', weak: 'thunder', gil: 320, xp: 150 },
        { name: 'Cerberus Pup', hp: 340, atk: 44, col: 0xb91c1c, shape: 'beast', weak: 'ice', gil: 205, xp: 145 },
        { name: 'Astral Drake', hp: 430, atk: 50, col: 0x0ea5e9, shape: 'winged', weak: 'thunder', gil: 280, xp: 190 }
    ];

    const FF_BOSSES = {
        aria_guard: { name: 'GUARDIAN: FOREST MALBORO', hp: 560, atk: 34, col: 0x16a34a, shape: 'slime', weak: 'fire', gil: 350, xp: 240, sc: 1.55 },
        vex_guard: { name: 'GUARDIAN: CANYON WYVERN', hp: 720, atk: 44, col: 0xdc2626, shape: 'winged', weak: 'ice', gil: 480, xp: 320, sc: 1.65 },
        boss1: { name: 'BOSS I: IFRIT INFERNO', hp: 980, atk: 52, col: 0xf97316, shape: 'beast', weak: 'ice', gil: 750, xp: 520, sc: 1.85 },
        boss2: { name: 'BOSS II: BAHAMUT PRIME', hp: 1420, atk: 62, col: 0x38bdf8, shape: 'winged', weak: 'thunder', gil: 1100, xp: 800, sc: 2.0 },
        boss3: { name: 'FINAL BOSS: OMEGA ASTRAL', hp: 2100, atk: 74, col: 0xc084fc, shape: 'orb', weak: 'holy', gil: 2000, xp: 1500, sc: 2.2 }
    };

    const FF_SPELLS = [
        { id: 'fira', name: 'Fira', mp: 14, elem: 'fire', col: 0xf97316, pwr: 2.1, desc: 'Fire blast' },
        { id: 'blizzara', name: 'Blizzara', mp: 14, elem: 'ice', col: 0x38bdf8, pwr: 2.1, desc: 'Ice lance' },
        { id: 'thundara', name: 'Thundara', mp: 15, elem: 'thunder', col: 0xfacc15, pwr: 2.25, desc: 'Bolt strike' },
        { id: 'cura', name: 'Cura', mp: 14, elem: 'heal', col: 0x4ade80, pwr: 1.0, desc: 'Heal lowest' },
        { id: 'haste', name: 'Haste', mp: 16, elem: 'buff', status: 'haste', col: 0x38bdf8, desc: '+ATB Speed' },
        { id: 'protect', name: 'Protect', mp: 14, elem: 'buff', status: 'protect', col: 0xfde047, desc: '-40% DMG Taken' },
        { id: 'libra', name: 'Libra', mp: 4, elem: 'scan', col: 0xa5f3fc, desc: 'Reveal weakness' }
    ];

    const FF_SUMMONS = [
        { id: 'ifrit', name: 'SUMMON IFRIT', mp: 28, elem: 'fire', col: 0xf97316, dmg: 310 },
        { id: 'shiva', name: 'SUMMON SHIVA', mp: 28, elem: 'ice', col: 0x38bdf8, dmg: 310 },
        { id: 'bahamut', name: 'SUMMON BAHAMUT', mp: 42, elem: 'holy', col: 0xc084fc, dmg: 460 }
    ];

    function buildFFMonsterMesh(spec, sc = 1) {
        const g = new THREE.Group();
        const m = std(spec.col, 0.35, 0.25, { emissive: spec.col, emissiveIntensity: 0.22 });
        const darkM = std(0x18181b, 0.6, 0.4);
        const steelM = std(0xe2e8f0, 0.22, 0.85);
        if (spec.shape === 'winged') {
            // Dragon / Wyvern / Bahamut with swept wings, horned head & tail
            const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.58 * sc, 0.72 * sc, 1.65 * sc, 12), m); torso.position.y = 1.55 * sc;
            const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * sc, 0.42 * sc, 0.9 * sc, 10), m); neck.position.set(0, 2.55 * sc, 0.35 * sc); neck.rotation.x = 0.35;
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.68 * sc, 0.56 * sc, 0.95 * sc), m); head.position.set(0, 2.95 * sc, 0.72 * sc);
            const tail = new THREE.Mesh(new THREE.ConeGeometry(0.32 * sc, 1.9 * sc, 8), m); tail.position.set(0, 0.9 * sc, -1.1 * sc); tail.rotation.x = -1.2;
            g.add(torso, neck, head, tail);
            for (const s of [-1, 1]) {
                const w = new THREE.Mesh(new THREE.BoxGeometry(2.3 * sc, 0.10 * sc, 1.1 * sc), m);
                w.position.set(s * 1.45 * sc, 2.15 * sc, -0.15 * sc); w.rotation.set(0.15, -s * 0.22, s * 0.42); g.add(w);
                const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12 * sc, 0.65 * sc, 6), basic(0xfde047));
                horn.position.set(s * 0.28 * sc, 3.35 * sc, 0.55 * sc); horn.rotation.set(-0.4, 0, -s * 0.35); g.add(horn);
                const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11 * sc, 7, 6), basic(0xfef08a));
                eye.position.set(s * 0.22 * sc, 3.02 * sc, 1.15 * sc); g.add(eye);
            }
        } else if (spec.shape === 'knight') {
            // Armored Knight / Iron Giant with pauldrons & broadsword
            const torso = new THREE.Mesh(new THREE.BoxGeometry(1.35 * sc, 1.55 * sc, 0.88 * sc), m); torso.position.y = 1.65 * sc;
            const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.45 * sc, 0.50 * sc, 0.65 * sc, 12), m); helm.position.y = 2.75 * sc;
            const visor = new THREE.Mesh(new THREE.BoxGeometry(0.62 * sc, 0.14 * sc, 0.15 * sc), basic(0xef4444)); visor.position.set(0, 2.76 * sc, 0.46 * sc);
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.18 * sc, 2.4 * sc, 0.08 * sc), steelM); blade.position.set(1.05 * sc, 2.1 * sc, 0.55 * sc); blade.rotation.z = -0.22;
            const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.55 * sc, 0.14 * sc, 0.16 * sc), basic(0xfacc15)); hilt.position.set(0.86 * sc, 1.15 * sc, 0.55 * sc);
            g.add(torso, helm, visor, blade, hilt);
            for (const s of [-1, 1]) {
                const pld = new THREE.Mesh(new THREE.SphereGeometry(0.48 * sc, 10, 8), steelM); pld.position.set(s * 0.92 * sc, 2.25 * sc, 0); g.add(pld);
                const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.24 * sc, 0.28 * sc, 0.95 * sc, 8), darkM); leg.position.set(s * 0.36 * sc, 0.48 * sc, 0); g.add(leg);
            }
        } else if (spec.shape === 'beast') {
            // Ifrit / Behemoth / Coeurl with bull horns & fiery mane
            const torso = new THREE.Mesh(new THREE.SphereGeometry(0.95 * sc, 12, 10), m); torso.scale.set(1.1, 1.25, 0.95); torso.position.y = 1.55 * sc;
            const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.58 * sc, 0), m); head.position.set(0, 2.65 * sc, 0.28 * sc);
            const mane = new THREE.Mesh(new THREE.ConeGeometry(0.65 * sc, 1.0 * sc, 8), basic(0xf97316)); mane.position.set(0, 3.1 * sc, -0.1 * sc);
            g.add(torso, head, mane);
            for (const s of [-1, 1]) {
                const horn = new THREE.Mesh(new THREE.ConeGeometry(0.16 * sc, 0.85 * sc, 7), basic(0xfde047));
                horn.position.set(s * 0.52 * sc, 3.15 * sc, 0.25 * sc); horn.rotation.z = -s * 0.48; g.add(horn);
                const eye = new THREE.Mesh(new THREE.SphereGeometry(0.13 * sc, 7, 6), basic(0xfef08a));
                eye.position.set(s * 0.25 * sc, 2.72 * sc, 0.78 * sc); g.add(eye);
            }
        } else if (spec.shape === 'cactus') {
            // Iconic Cactuar running pose!
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.32 * sc, 0.32 * sc, 1.75 * sc, 10), m); trunk.position.y = 1.25 * sc;
            const topCap = new THREE.Mesh(new THREE.SphereGeometry(0.32 * sc, 10, 8), m); topCap.position.y = 2.12 * sc;
            const armL = new THREE.Mesh(new THREE.BoxGeometry(0.85 * sc, 0.22 * sc, 0.22 * sc), m); armL.position.set(-0.55 * sc, 1.55 * sc, 0);
            const armLu = new THREE.Mesh(new THREE.BoxGeometry(0.22 * sc, 0.65 * sc, 0.22 * sc), m); armLu.position.set(-0.88 * sc, 1.85 * sc, 0);
            const armR = new THREE.Mesh(new THREE.BoxGeometry(0.85 * sc, 0.22 * sc, 0.22 * sc), m); armR.position.set(0.55 * sc, 1.35 * sc, 0);
            const armRd = new THREE.Mesh(new THREE.BoxGeometry(0.22 * sc, 0.60 * sc, 0.22 * sc), m); armRd.position.set(0.88 * sc, 1.05 * sc, 0);
            const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.09 * sc, 7, 6), basic(0x111111)); mouth.scale.set(0.8, 1.4, 0.4); mouth.position.set(0, 1.78 * sc, 0.32 * sc);
            g.add(trunk, topCap, armL, armLu, armR, armRd, mouth);
            for (const s of [-1, 1]) {
                const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07 * sc, 7, 6), basic(0x111111));
                eye.position.set(s * 0.14 * sc, 1.98 * sc, 0.30 * sc); g.add(eye);
            }
        } else if (spec.shape === 'orb') {
            // Bomb / Void Eye / Omega Astral with orbiting celestial rings!
            const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.92 * sc, 1), m); core.position.y = 1.75 * sc;
            const r1 = new THREE.Mesh(new THREE.TorusGeometry(1.38 * sc, 0.08 * sc, 8, 24), basic(0xfacc15)); r1.position.y = 1.75 * sc; r1.rotation.x = 0.65;
            const r2 = new THREE.Mesh(new THREE.TorusGeometry(1.62 * sc, 0.06 * sc, 8, 24), basic(0x38bdf8)); r2.position.y = 1.75 * sc; r2.rotation.set(-0.55, 0.7, 0);
            g.add(core, r1, r2);
            for (const s of [-1, 1]) {
                const eye = new THREE.Mesh(new THREE.SphereGeometry(0.16 * sc, 8, 6), basic(0xfef08a));
                eye.position.set(s * 0.34 * sc, 1.85 * sc, 0.85 * sc); g.add(eye);
            }
        } else {
            // Slime / Flan / Malboro / Goblin
            const dome = new THREE.Mesh(new THREE.SphereGeometry(1.05 * sc, 14, 12), m); dome.scale.set(1.15, 0.92, 1.15); dome.position.y = 1.05 * sc;
            const crown = new THREE.Mesh(new THREE.ConeGeometry(0.45 * sc, 0.75 * sc, 8), basic(0xfde047)); crown.position.y = 2.05 * sc;
            g.add(dome, crown);
            for (const s of [-1, 1]) {
                const eye = new THREE.Mesh(new THREE.SphereGeometry(0.16 * sc, 8, 6), basic(0xfef08a));
                eye.position.set(s * 0.36 * sc, 1.25 * sc, 0.96 * sc); g.add(eye);
            }
        }
        return g;
    }

    MG.register({
        id: 'fun_final_fantasy', cat: 'fun', order: 6, name: 'Final Fantasy RPG', icon: '⚔️', accent: '#3b82f6', badge: 'STORY RPG',
        tagline: 'Start Solo! Explore an entire World, recruit all 3 Allies via quests, Shop, Bag & 3 Bosses!',
        desc: 'An entire explorable Final Fantasy world! Begin alone in Crystalia Village with just yourself. Visit the Weapon/Item Shop & Inn, venture out into Whispering Woods, Sunscorch Canyon, and Ironhold Citadel to complete each companion\'s recruitment quest (Aria, Vex & Titus), loot 8 chests, battle 20 random enemy types to level up, and conquer 3 legendary Bosses!',
        heroLabel: 'FUN • FULL EXPLORABLE STORY JRPG', duration: 0, stars: [4000, 9000, 15000, 24000],
        standardWeapon: 'm1911', lockWeapon: true, blockFire: true, hideViewmodel: true, customMusic: true,
        weaponNote: 'WASD Explore World • [E] Talk / Shop / Quests • [1–6] Battle Hotkeys or Mouse',
        keys: [['WASD', 'Explore World'], ['E', 'Interact (NPCs / Shop / Chests / Bosses)'], ['1–6 / MOUSE', 'Command ATB Battles']],
        map: {
            atmosphere: { skyTop: 0x050816, skyBottom: 0x1e3a8a, fogColor: 0x0f172a, fogDensity: 0.0055, sunColor: 0xbfdbfe, sunIntensity: 1.45, sunPos: [20, 60, 20], hemiSky: 0x60a5fa, hemiGround: 0x1e1b4b, hemiIntensity: 0.95 },
            boxes: [B(0, -0.5, -18, 200, 1, 200, 'concrete')],
            spawn: { x: 0, y: 0, z: 28, yaw: 0 }
        },
        build(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.start('ff:explore');
            K.groundPlane(S, 200, 0x14532d, 0.002);
            const pathM = std(0x78716c, 0.95), woodM = std(0x78350f, 0.85), sandM = std(0xb45309, 0.9), stoneM = std(0x334155, 0.85);
            const roofM = std(0x991b1b, 0.75), winM = basic(0xfef08a), postM = std(0x1f2937, 0.5, 0.7);
            // Crossroad stone paths from Crystalia Village (0,24) to Woods(-48,-4), Canyon(48,-4), Citadel(-26,-52), Astral(0,-76)
            const addRoad = (x, z, w, d, m = pathM) => { const r = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); r.rotation.x = -Math.PI / 2; r.position.set(x, 0.02, z); S.add(r); };
            addRoad(0, 24, 24, 24, stoneM); // Village Plaza
            addRoad(0, -24, 5, 96);          // Main North-South Road
            addRoad(0, -4, 98, 5);           // West-East Woods-Canyon Road
            addRoad(-13, -52, 26, 4.5);      // Spur to Ironhold Citadel
            addRoad(48, -4, 34, 34, sandM);  // Sunscorch Canyon desert plateau
            addRoad(0, -76, 22, 22, std(0x1e1b4b, 0.5, 0.4)); // Astral Sanctum

            // Crystalia Village Buildings (Inn & Gear Shop with Pitched Roofs & Warm Windows) + Central Mana Fountain!
            for (const [bx, roofCol] of [[-8, 0x065f46], [8, 0x9a3412]]) {
                S.box(bx, 2.2, 26, 6, 4.4, 5, woodM, { solid: true });
                const roof = new THREE.Mesh(new THREE.ConeGeometry(4.8, 2.4, 4), std(roofCol, 0.75));
                roof.position.set(bx, 5.5, 26); roof.rotation.y = Math.PI / 4; S.add(roof);
                for (const wx of [-1.6, 1.6]) {
                    const win = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 0.12), winM);
                    win.position.set(bx + wx, 2.5, 23.48); S.add(win);
                }
            }
            // Central Crystalia Mana Fountain with rotating crystal spire
            const fBasin = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.9, 0.65, 20), stoneM); fBasin.position.set(0, 0.32, 24);
            const fWater = new THREE.Mesh(new THREE.CircleGeometry(2.35, 20), std(0x38bdf8, 0.15, 0.3, { emissive: 0x0284c7, emissiveIntensity: 0.5 })); fWater.rotation.x = -Math.PI / 2; fWater.position.set(0, 0.67, 24);
            const fSpire = new THREE.Mesh(new THREE.OctahedronGeometry(0.85, 0), std(0x7dd3fc, 0.1, 0.4, { emissive: 0x38bdf8, emissiveIntensity: 0.9 })); fSpire.scale.set(0.65, 1.8, 0.65); fSpire.position.set(0, 2.4, 24);
            S.add(fBasin, fWater, fSpire); S.data.fountainSpire = fSpire;

            // Glowing Roadside Lantern Posts
            for (const [lx, lz] of [[-3.5, 14], [3.5, 14], [-3.5, -18], [3.5, -18], [-24, -7.5], [24, -7.5]]) {
                const lp = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 3.6, 8), postM); lp.position.set(lx, 1.8, lz);
                const orb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), winM); orb.position.set(lx, 3.7, lz);
                S.add(lp, orb);
            }
            // Astral Sanctum Magic Rune Circle
            const rune = new THREE.Mesh(new THREE.RingGeometry(7.2, 8.2, 36), basic(0xc084fc, { side: THREE.DoubleSide }));
            rune.rotation.x = -Math.PI / 2; rune.position.set(0, 0.06, -76); S.add(rune);

            const innSg = A.sign('INN [E] FREE REST', 4.6, 0.85, { bg: '#064e3b', color: '#a7f3d0', borderColor: '#34d399', size: 0.46 }); innSg.position.set(-8, 4.9, 23.3); S.add(innSg);
            const shopSg = A.sign('WEAPONS & BAG SHOP [E]', 5.0, 0.85, { bg: '#451a03', color: '#fde68a', borderColor: '#f59e0b', size: 0.42 }); shopSg.position.set(8, 4.9, 23.3); S.add(shopSg);
            void roofM;

            // Scenic Trees in Emerald Woods & Rocks in Sunscorch Canyon & Obsidian Pillars in Sanctum
            const rnd = L.mulberry32(991);
            for (let i = 0; i < 36; i++) {
                const tr = A.tree(1.6 + rnd() * 0.9, 0x065f46);
                tr.position.set(-22 - rnd() * 52, 0, 14 - rnd() * 44); S.add(tr);
            }
            for (let i = 0; i < 18; i++) {
                const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2 + rnd() * 2, 0), sandM);
                rk.position.set(28 + rnd() * 42, 1.4, 14 - rnd() * 44); S.add(rk);
            }
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * TAU;
                const cr = new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 0), std(0x38bdf8, 0.15, 0.2, { emissive: 0x0ea5e9, emissiveIntensity: 0.7 }));
                cr.scale.set(0.6, 2.8, 0.6); cr.position.set(Math.cos(a) * 11, 2.8, -76 + Math.sin(a) * 11); S.add(cr);
            }
            // Ironhold Citadel gate
            S.box(-26, 3.0, -56, 12, 6, 3, stoneM, { solid: true });
            const citSg = A.sign('IRONHOLD CITADEL — BOSS I', 6.5, 0.95, { bg: '#7f1d1d', color: '#fef08a', borderColor: '#facc15', size: 0.44 }); citSg.position.set(-26, 6.6, -54.2); S.add(citSg);
            const astSg = A.sign('ASTRAL SANCTUM — FINAL BOSSES', 7.5, 0.95, { bg: '#3b0764', color: '#e9d5ff', borderColor: '#c084fc', size: 0.44 }); astSg.position.set(0, 5.2, -84); S.add(astSg);

            // Overworld NPCs & Quest Givers!
            const spawnNpc = (id, name, opts, pos, tagCol) => {
                const fig = F.human(opts); fig.root.position.copy(pos); S.add(fig.root);
                const sg = A.sign(name + ' [E]', 3.2, 0.55, { bg: '#0f172a', color: '#ffffff', borderColor: tagCol, size: 0.4 });
                sg.position.set(pos.x, 2.55, pos.z); S.add(sg);
                return { id, name, fig, sg, pos };
            };
            S.data.npcs = [
                spawnNpc('elder', 'ELDER ALDRIC', { shirt: 0x475569, coat: 0x334155, hair: 0xe5e7eb, gun: 'none' }, V(0, 0, 20), '#93c5fd'),
                spawnNpc('inn', 'INNKEEPER MAY', { shirt: 0x10b981, hair: 0xfde047, longHair: true, gun: 'none' }, V(-8, 0, 22), '#34d399'),
                spawnNpc('shop', 'BLACKSMITH', { shirt: 0xd97706, hair: 0x1f2937, hat: 'beanie', gun: 'none' }, V(8, 0, 22), '#f59e0b'),
                spawnNpc('aria', 'ARIA (MAGE)', { shirt: 0xf472b6, hair: 0xfbbf24, longHair: true, gun: 'pistol' }, V(-48, 0, -4), '#f472b6'),
                spawnNpc('vex', 'VEX (ROGUE)', { shirt: 0x10b981, hair: 0x111827, mask: 0x18181b, gun: 'pistol' }, V(48, 0, -4), '#10b981'),
                spawnNpc('titus', 'TITUS (PALADIN)', { shirt: 0xfacc15, pants: 0x334155, hat: 'helmet', hatColor: 0x94a3b8, gun: 'rifle' }, V(-26, 0, -51), '#facc15'),
                spawnNpc('sanctum', 'ASTRAL GATE', { shirt: 0xa855f7, eyes: 'angry', gun: 'none' }, V(0, 0, -76), '#c084fc')
            ];

            // 8 Overworld Treasure Chests
            const chestSpots = [
                [-14, 16, { item: 'wep', idx: 1, label: 'Mythril Saber!' }], [14, 16, { item: 'gil', amt: 250, label: '250 Gil!' }],
                [-60, 10, { item: 'arm', idx: 1, label: 'Emerald Silks!' }], [-56, -18, { item: 'item', key: 'elixir', amt: 2, label: '2x Elixir!' }],
                [60, 8, { item: 'wep', idx: 3, label: 'Zephyr Twinblade!' }], [58, -18, { item: 'arm', idx: 2, label: 'Canyon Guard Coat!' }],
                [-34, -56, { item: 'arm', idx: 3, label: 'Ironhold Plate!' }], [10, -72, { item: 'wep', idx: 6, label: 'Masamune Edge!' }]
            ];
            S.data.chests = chestSpots.map(([cx, cz, loot], i) => {
                const cg = new THREE.Group();
                const base = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.55, 0.82), std(0x78350f, 0.6)); base.position.y = 0.28;
                const lid = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.28, 0.86), std(0xb45309, 0.5)); lid.position.y = 0.66;
                const trim = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.10, 0.88), std(0xfacc15, 0.25, 0.85)); trim.position.y = 0.55;
                const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.42, 3.2, 10), basic(0xfde047, { transparent: true, opacity: 0.28 })); beam.position.y = 1.9;
                cg.add(base, lid, trim, beam); cg.position.set(cx, 0, cz); S.add(cg);
                return { id: i, pos: V(cx, 0, cz), mesh: cg, lid, beam, loot, opened: false };
            });

            // START SOLO WITH ONLY 1 CHARACTER! Allies must be found & recruited via Story Quests!
            S.data.party = [
                { id: 'player', name: 'PLAYER', cls: 'Knight', lv: 1, xp: 0, hp: 220, maxHp: 220, mp: 65, maxMp: 65, baseAtk: 34, spd: 28, atb: 100, limit: 25, limName: 'OMNISLASH', status: [], def: 12, spName: 'CROSS-SLASH', spCost: 14, wep: FF_EQUIP.weapons[0], arm: FF_EQUIP.armors[0] }
            ];
            S.data.alliesPool = {
                aria: { id: 'aria', name: 'ARIA', cls: 'Mage', lv: 2, xp: 0, hp: 185, maxHp: 185, mp: 135, maxMp: 135, baseAtk: 26, spd: 32, atb: 100, limit: 25, limName: 'METEOR STORM', status: [], def: 9, spName: 'FIRAGA BLAST', spCost: 16, heal: true, wep: FF_EQUIP.weapons[2], arm: FF_EQUIP.armors[1] },
                vex: { id: 'vex', name: 'VEX', cls: 'Rogue', lv: 3, xp: 0, hp: 215, maxHp: 215, mp: 85, maxMp: 85, baseAtk: 42, spd: 38, atb: 100, limit: 25, limName: 'PHANTOM RUSH', status: [], def: 11, spName: 'TWIN FANG', spCost: 15, wep: FF_EQUIP.weapons[3], arm: FF_EQUIP.armors[2] },
                titus: { id: 'titus', name: 'TITUS', cls: 'Paladin', lv: 4, xp: 0, hp: 310, maxHp: 310, mp: 75, maxMp: 75, baseAtk: 38, spd: 24, atb: 100, limit: 25, limName: 'HOLY AEGIS', status: [], def: 18, spName: 'HOLY SMITE', spCost: 14, wep: FF_EQUIP.weapons[4], arm: FF_EQUIP.armors[3] }
            };
            // Healing Save Crystals in the overworld wilds!
            S.data.crystals = [V(-24, 0, 6), V(26, 0, -4), V(0, 0, -42)].map((cp) => {
                const cm = new THREE.Mesh(new THREE.OctahedronGeometry(0.9, 0), std(0x38bdf8, 0.1, 0.3, { emissive: 0x0ea5e9, emissiveIntensity: 0.9 }));
                cm.scale.set(0.65, 1.8, 0.65); cm.position.set(cp.x, 1.8, cp.z); S.add(cm);
                return { pos: cp, mesh: cm, cd: 0 };
            });

            S.data.ownedWeps = [0]; S.data.ownedArms = [0];
            S.data.gil = 200;
            S.data.bag = { potion: 5, hipotion: 1, ether: 2, phoenix: 1, bomb: 2, elixir: 0 };
            S.data.quests = { aria: false, vex: false, titus: false, boss2: false, boss3: false };
            S.data.mode = 'explore'; // 'explore' | 'battle' | 'shop' | 'dialog'
            S.data.encMeter = 0; S.data.lastWalkPos = BO.Player.pos.clone();
            S.data.battleStage = null;

            const ui = document.createElement('div');
            ui.id = 'ff-rpg-ui'; ui.className = 'ff-shell'; ui.style.display = 'none';
            ui.addEventListener('mousedown', (e) => e.stopPropagation());
            document.body.appendChild(ui);
            S.data.ui = ui;

            const qh = document.createElement('div');
            qh.className = 'ff-quest'; document.body.appendChild(qh);
            S.data.questUi = qh;

            const mapBox = document.createElement('div');
            mapBox.className = 'ff-map';
            mapBox.innerHTML = '<canvas width="148" height="148"></canvas>';
            document.body.appendChild(mapBox);
            S.data.mapBox = mapBox; S.data.mapCtx = mapBox.querySelector('canvas').getContext('2d');
            this._updateQuestHUD(S);
            this._drawMiniMap(S);
        },
        _drawMiniMap(S) {
            const g = S.data.mapCtx; if (!g) return;
            const w = 148, h = 148, toXY = (wx, wz) => [w * 0.5 + wx * 0.72, h * 0.62 + wz * 0.72];
            g.fillStyle = '#060a16'; g.fillRect(0, 0, w, h);
            g.strokeStyle = 'rgba(96,165,250,0.28)'; g.lineWidth = 3;
            const [vx, vz] = toXY(0, 24), [nx, nz] = toXY(0, -76), [wx, wz] = toXY(-48, -4), [ex, ez] = toXY(48, -4), [cx, cz] = toXY(-26, -52);
            g.beginPath(); g.moveTo(vx, vz); g.lineTo(nx, nz); g.moveTo(wx, wz); g.lineTo(ex, ez); g.moveTo(w * 0.5, vz - 54); g.lineTo(cx, cz); g.stroke();
            const dot = (px, pz, col, r = 4) => { const [x, y] = toXY(px, pz); g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
            dot(0, 24, '#34d399', 5); dot(-48, -4, '#f472b6', 4); dot(48, -4, '#10b981', 4); dot(-26, -51, '#facc15', 4.5); dot(0, -76, '#c084fc', 5);
            for (const ch of S.data.chests || []) if (!ch.opened) dot(ch.pos.x, ch.pos.z, '#fde047', 2.2);
            const qt = this._questTarget(S); const [qx, qy] = toXY(qt.pos.x, qt.pos.z);
            g.strokeStyle = '#fde047'; g.lineWidth = 1.5; g.beginPath(); g.arc(qx, qy, 7, 0, TAU); g.stroke();
            dot(BO.Player.pos.x, BO.Player.pos.z, '#ffffff', 3.5);
        },
        _questTarget(S) {
            const Q = S.data.quests;
            if (!Q.aria) return { title: 'Find & Help ARIA in Whispering Woods (West)', pos: V(-48, 0, -4) };
            if (!Q.vex) return { title: 'Find & Help VEX in Sunscorch Canyon (East)', pos: V(48, 0, -4) };
            if (!Q.titus) return { title: 'Aid TITUS & Slay IFRIT at Ironhold Citadel (NW)', pos: V(-26, 0, -51) };
            if (!Q.boss2) return { title: 'Confront BAHAMUT at Astral Sanctum (Far North)', pos: V(0, 0, -76) };
            return { title: 'Vanquish OMEGA ASTRAL at Astral Sanctum!', pos: V(0, 0, -76) };
        },
        _updateQuestHUD(S) {
            const qh = S.data.questUi; if (!qh) return;
            const qt = this._questTarget(S);
            const dist = Math.round(BO.Player.pos.distanceTo(qt.pos));
            const area = BO.Player.pos.z > 10 && Math.abs(BO.Player.pos.x) < 16 ? 'CRYSTALIA VILLAGE (SAFE)' : BO.Player.pos.x < -18 && BO.Player.pos.z > -32 ? 'EMERALD WOODS' : BO.Player.pos.x > 18 ? 'SUNSCORCH CANYON' : BO.Player.pos.z < -60 ? 'ASTRAL SANCTUM' : 'OVERWORLD WILDS';
            qh.innerHTML = `<small>${area}</small><div><b>QUEST:</b> ${esc(qt.title)}</div><div style="margin-top:4px;color:#93c5fd;">TARGET: <b>${dist}m</b> • PARTY: <b>${S.data.party.length}/4</b> • GIL: <b>${S.data.gil}</b></div>`;
        },
        onKey(S, code) {
            if (MG.state !== 'running') return false;
            if (S.data.mode === 'explore' && code === 'KeyE') { this._interact(S); return true; }
            if (S.data.mode === 'battle' && S.data.subMenu === 'main') {
                const u = S.data.party[S.data.turnIdx];
                if (code === 'Digit1') { this._cmd(S, (u && u.limit >= 100) ? 'limit' : 'atk'); return true; }
                if (code === 'Digit2') { this._cmd(S, 'sp'); return true; }
                if (code === 'Digit3') { this._cmd(S, 'magic'); return true; }
                if (code === 'Digit4') { this._cmd(S, 'summon'); return true; }
                if (code === 'Digit5') { this._cmd(S, 'bag'); return true; }
                if (code === 'Digit6') { this._cmd(S, 'def'); return true; }
            }
            return false;
        },
        _interact(S) {
            const D = S.data, P = BO.Player;
            for (const ch of D.chests) {
                if (!ch.opened && P.pos.distanceTo(ch.pos) < 3.4) {
                    ch.opened = true;
                    if (ch.lid) { ch.lid.rotation.x = -1.25; ch.lid.position.set(0, 0.82, -0.35); }
                    if (ch.beam) ch.beam.visible = false;
                    SFX.ding(1.3);
                    const lt = ch.loot;
                    if (lt.item === 'gil') D.gil += lt.amt;
                    else if (lt.item === 'wep' && !D.ownedWeps.includes(lt.idx)) D.ownedWeps.push(lt.idx);
                    else if (lt.item === 'arm' && !D.ownedArms.includes(lt.idx)) D.ownedArms.push(lt.idx);
                    else if (lt.item === 'item') D.bag[lt.key] = (D.bag[lt.key] || 0) + lt.amt;
                    S.award(300, ch.pos, lt.label, '#fde047');
                    MG.toast('TREASURE CHEST: ' + lt.label, '#fde047');
                    this._updateQuestHUD(S);
                    return;
                }
            }
            for (const npc of D.npcs) {
                if (P.pos.distanceTo(npc.pos) < 4.5) {
                    if (npc.id === 'inn') {
                        for (const u of D.party) { u.hp = u.maxHp; u.mp = u.maxMp; }
                        SFX.heal(); MG.toast('RESTED AT INN! ALL PARTY HP/MP RESTORED!', '#34d399'); return;
                    }
                    if (npc.id === 'shop') { this._openShop(S); return; }
                    if (npc.id === 'elder') { this._showDialog(S, 'ELDER ALDRIC', 'Darkness gathers at the Northern Sanctum. Recruit Aria in the West Woods, Vex in the East Canyon, and Titus at Ironhold Citadel before facing Omega Astral!'); return; }
                    if (npc.id === 'aria') {
                        if (D.quests.aria) this._showDialog(S, 'ARIA', 'Already by your side! Let us march on Omega Astral.');
                        else this._startBattle(S, FF_BOSSES.aria_guard, 'aria');
                        return;
                    }
                    if (npc.id === 'vex') {
                        if (D.quests.vex) this._showDialog(S, 'VEX', 'My twinblades are yours—next stop, Ironhold Citadel!');
                        else this._startBattle(S, FF_BOSSES.vex_guard, 'vex');
                        return;
                    }
                    if (npc.id === 'titus') {
                        if (D.quests.titus) this._showDialog(S, 'TITUS', 'Ironhold stands firm. To the Northern Sanctum!');
                        else this._startBattle(S, FF_BOSSES.boss1, 'boss1');
                        return;
                    }
                    if (npc.id === 'sanctum') {
                        if (!D.quests.boss2) this._startBattle(S, FF_BOSSES.boss2, 'boss2');
                        else this._startBattle(S, FF_BOSSES.boss3, 'boss3');
                        return;
                    }
                }
            }
            MG.toast('Walk up to an NPC, Chest or Sanctum Gate first!', '#cbd5e1');
        },
        _showDialog(S, speaker, text) {
            const D = S.data, el = D.ui;
            D.mode = 'dialog';
            if (document.pointerLockElement) document.exitPointerLock();
            el.style.display = 'block';
            el.innerHTML = `<div><b style="color:#fde68a">${esc(speaker)}</b><p style="margin:6px 0 10px;line-height:1.45">${esc(text)}</p><button class="ff-btn" id="ff-dlg-ok">CONTINUE</button></div>`;
            el.querySelector('#ff-dlg-ok').onclick = () => { el.style.display = 'none'; D.mode = 'explore'; };
        },
        _openShop(S) {
            const D = S.data, el = D.ui;
            D.mode = 'shop';
            if (document.pointerLockElement) document.exitPointerLock();
            el.style.display = 'block';
            const renderShop = () => {
                const items = [
                    { k: 'potion', n: 'Potion (+90 HP)', p: 45 },
                    { k: 'hipotion', n: 'Hi-Potion (+190 HP)', p: 110 },
                    { k: 'ether', n: 'Ether (+50 MP)', p: 80 },
                    { k: 'phoenix', n: 'Phoenix Down', p: 140 },
                    { k: 'bomb', n: 'Fire Bomb (220 DMG)', p: 120 },
                    { k: 'elixir', n: 'Elixir (Full Party Heal)', p: 320 }
                ];
                el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><b>CRYSTALIA WEAPONS & ITEM SHOP</b><b style="color:#facc15">GIL: ${D.gil}</b></div>
                    <div class="ff-cmds" style="margin-bottom:8px;">
                        ${items.map((it) => `<button class="ff-btn" data-buyi="${it.k}" data-p="${it.p}">${it.n} (${it.p}G) [${D.bag[it.k] || 0}]</button>`).join('')}
                        ${FF_EQUIP.weapons.map((w, wi) => !w.price ? '' : `<button class="ff-btn ${D.ownedWeps.includes(wi) ? 'on' : ''}" data-buyw="${wi}">${w.name} +${w.atk}ATK (${D.ownedWeps.includes(wi) ? 'OWNED' : w.price + 'G'})</button>`).join('')}
                        ${FF_EQUIP.armors.map((a, ai) => !a.price ? '' : `<button class="ff-btn ${D.ownedArms.includes(ai) ? 'on' : ''}" data-buya="${ai}">${a.name} +${a.def}DEF (${D.ownedArms.includes(ai) ? 'OWNED' : a.price + 'G'})</button>`).join('')}
                    </div>
                    <button class="ff-btn" id="ff-shop-exit">LEAVE SHOP</button>`;
                el.querySelectorAll('[data-buyi]').forEach((b) => { b.onclick = () => { const p = +b.dataset.p; if (D.gil >= p) { D.gil -= p; D.bag[b.dataset.buyi] = (D.bag[b.dataset.buyi] || 0) + 1; SFX.ding(1.2); renderShop(); this._updateQuestHUD(S); } }; });
                el.querySelectorAll('[data-buyw]').forEach((b) => { b.onclick = () => { const wi = +b.dataset.buyw, w = FF_EQUIP.weapons[wi]; if (!D.ownedWeps.includes(wi) && D.gil >= w.price) { D.gil -= w.price; D.ownedWeps.push(wi); SFX.ding(1.3); renderShop(); this._updateQuestHUD(S); } }; });
                el.querySelectorAll('[data-buya]').forEach((b) => { b.onclick = () => { const ai = +b.dataset.buya, a = FF_EQUIP.armors[ai]; if (!D.ownedArms.includes(ai) && D.gil >= a.price) { D.gil -= a.price; D.ownedArms.push(ai); SFX.ding(1.3); renderShop(); this._updateQuestHUD(S); } }; });
                el.querySelector('#ff-shop-exit').onclick = () => { el.style.display = 'none'; D.mode = 'explore'; };
            };
            renderShop();
        },
        _startBattle(S, encSpec, questTag) {
            const D = S.data, P = BO.Player;
            D.mode = 'battle'; D.questTag = questTag; D.subMenu = 'main'; D.turnIdx = 0; D.busy = false;
            if (document.pointerLockElement) document.exitPointerLock();
            const scale = Math.max(1, D.party.length * 0.45);
            D.enemy = {
                name: encSpec.name, weak: encSpec.weak || 'fire', scanned: false, atb: 35,
                hp: Math.round(encSpec.hp * (questTag ? 1 : scale)),
                maxHp: Math.round(encSpec.hp * (questTag ? 1 : scale)),
                atk: encSpec.atk, gil: encSpec.gil || 90, xp: encSpec.xp || 70, isBoss: !!questTag
            };
            D.party.forEach((u, i) => { u.atb = i === 0 ? 100 : Math.min(95, 55 + i * 15); u.status = []; u.guard = false; });
            if (D.battleGroup) S.scene.remove(D.battleGroup);
            const grp = new THREE.Group();
            const fwd = V(-Math.sin(P.yaw), 0, -Math.cos(P.yaw));
            const center = P.pos.clone().addScaledVector(fwd, 9);
            const eMesh = buildFFMonsterMesh(encSpec, encSpec.sc || 1);
            eMesh.position.copy(center).addScaledVector(fwd, 2.5);
            eMesh.lookAt(P.pos.x, 1, P.pos.z);
            grp.add(eMesh);
            D.heroFigs = D.party.map((u, i) => {
                const hf = F.human({ shirt: u.id === 'aria' ? 0xf472b6 : u.id === 'vex' ? 0x10b981 : u.id === 'titus' ? 0xfacc15 : 0x3b82f6, pants: 0x1e293b, longHair: u.id === 'aria', gun: 'pistol' });
                const right = V(-fwd.z, 0, fwd.x);
                hf.root.position.copy(center).addScaledVector(fwd, -3.5).addScaledVector(right, (i - (D.party.length - 1) * 0.5) * 2.1);
                hf.root.lookAt(eMesh.position.x, 0, eMesh.position.z);
                grp.add(hf.root); return hf;
            });
            D.enemyMesh = eMesh; D.battleGroup = grp; S.add(grp);
            if (BO.MinigameAudio) BO.MinigameAudio.start(questTag ? 'ff:boss' : 'ff:battle');
            D.log = questTag ? `⚠ ${D.enemy.name} ENGAGES!` : `Ambush! Wild ${D.enemy.name} blocks the path!`;
            D.ui.style.display = 'block';
            this._refreshBattleUI(S);
        },
        _refreshBattleUI(S) {
            const D = S.data, el = D.ui; if (!el || D.mode !== 'battle') return;
            const u = D.party[D.turnIdx] || D.party[0], en = D.enemy;
            const enPct = Math.max(0, Math.round(en.hp / en.maxHp * 100));
            const actReady = u.hp > 0 && u.atb >= 100 && !D.busy;
            let cmds = '';
            if (D.subMenu === 'main') {
                const lim = u.limit >= 100;
                cmds = `<button class="ff-btn ${lim ? 'ff-btn-limit' : ''}" data-act="${lim ? 'limit' : 'atk'}" ${actReady ? '' : 'disabled'}>${lim ? '🌟 LIMIT: ' + esc(u.limName) : '⚔ ATTACK'}</button>
                    <button class="ff-btn" data-act="sp" ${actReady ? '' : 'disabled'}>✨ ${esc(u.spName)} (${u.spCost}MP)</button>
                    <button class="ff-btn" data-act="magic" ${actReady ? '' : 'disabled'}>🔮 MAGIC</button>
                    <button class="ff-btn" data-act="summon" ${actReady ? '' : 'disabled'}>🐉 SUMMON</button>
                    <button class="ff-btn" data-act="bag" ${actReady ? '' : 'disabled'}>🎒 BAG</button>
                    <button class="ff-btn" data-act="equip" ${actReady ? '' : 'disabled'}>🛡 EQUIP</button>
                    <button class="ff-btn" data-act="def" ${actReady ? '' : 'disabled'}>🛡 GUARD</button>
                    ${!en.isBoss ? `<button class="ff-btn" data-act="flee" ${actReady ? '' : 'disabled'}>🏃 FLEE</button>` : ''}`;
            } else if (D.subMenu === 'magic') {
                cmds = FF_SPELLS.map((sp) => `<button class="ff-btn" data-spell="${sp.id}" title="${sp.desc}">${sp.name} (${sp.mp}MP)</button>`).join('') + '<button class="ff-btn" data-act="back">↩ BACK</button>';
            } else if (D.subMenu === 'summon') {
                cmds = FF_SUMMONS.map((sm) => `<button class="ff-btn" data-sum="${sm.id}">🐉 ${sm.name} (${sm.mp}MP)</button>`).join('') + '<button class="ff-btn" data-act="back">↩ BACK</button>';
            } else if (D.subMenu === 'bag') {
                cmds = ['potion', 'hipotion', 'ether', 'phoenix', 'bomb', 'elixir'].map((k) => `<button class="ff-btn" data-bag="${k}">${k.toUpperCase()} (${D.bag[k] || 0})</button>`).join('') + '<button class="ff-btn" data-act="back">↩ BACK</button>';
            } else {
                cmds = D.ownedWeps.map((wi) => { const w = FF_EQUIP.weapons[wi]; return `<button class="ff-btn ${u.wep.id === w.id ? 'on' : ''}" data-wep="${wi}">🗡 ${w.name}</button>`; }).join('') +
                    D.ownedArms.map((ai) => { const a = FF_EQUIP.armors[ai]; return `<button class="ff-btn ${u.arm.id === a.id ? 'on' : ''}" data-arm="${ai}">🛡 ${a.name}</button>`; }).join('') +
                    '<button class="ff-btn" data-act="back">↩ DONE</button>';
            }
            const weakStr = en.scanned ? `<span class="ff-st">WEAK: ${en.weak.toUpperCase()}</span>` : '';
            el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <b>${esc(en.name)} ${weakStr}</b>
                <div class="fun-bar" style="width:240px;"><i style="width:${enPct}%;background:linear-gradient(90deg,#dc2626,#facc15)"></i></div>
                <span>${Math.max(0, en.hp)} / ${en.maxHp} HP</span>
            </div>
            <div class="ff-grid">
                <div class="ff-party">${D.party.map((p, i) => `<div class="ff-unit ${i === D.turnIdx ? 'active' : ''}">
                    <b>${p.name} <small style="color:#94a3b8">Lv.${p.lv}</small>${(p.status || []).map((st) => `<span class="ff-st">${st.toUpperCase()}</span>`).join('')}</b>
                    <span>HP ${p.hp}/${p.maxHp} • MP ${p.mp}</span>
                    <div class="ff-bars"><div class="ff-atb" title="ATB"><i style="width:${Math.min(100, p.atb)}%"></i></div><div class="ff-lim" title="LIMIT"><i style="width:${Math.min(100, p.limit)}%"></i></div></div>
                </div>`).join('')}</div>
                <div><div style="font-size:11px;color:#fde68a;margin-bottom:5px;">ATB READY: <b>${u.name}</b> • LIMIT ${Math.floor(u.limit)}% • ${u.wep.name}</div><div class="ff-cmds">${cmds}</div></div>
            </div>
            <div class="ff-log">${esc(D.log)}</div>`;
            el.querySelectorAll('[data-act]').forEach((b) => { b.onclick = () => this._cmd(S, b.dataset.act); });
            el.querySelectorAll('[data-spell]').forEach((b) => { b.onclick = () => this._castSpell(S, b.dataset.spell); });
            el.querySelectorAll('[data-sum]').forEach((b) => { b.onclick = () => this._castSummon(S, b.dataset.sum); });
            el.querySelectorAll('[data-bag]').forEach((b) => { b.onclick = () => this._useBag(S, b.dataset.bag); });
            el.querySelectorAll('[data-wep]').forEach((b) => { b.onclick = () => { u.wep = FF_EQUIP.weapons[+b.dataset.wep]; D.log = `${u.name} equipped ${u.wep.name}!`; this._refreshBattleUI(S); }; });
            el.querySelectorAll('[data-arm]').forEach((b) => { b.onclick = () => { u.arm = FF_EQUIP.armors[+b.dataset.arm]; D.log = `${u.name} equipped ${u.arm.name}!`; this._refreshBattleUI(S); }; });
        },
        _cmd(S, act) {
            const D = S.data, u = D.party[D.turnIdx];
            if (D.busy || !u || u.hp <= 0) return;
            if (act === 'bag' || act === 'equip' || act === 'magic' || act === 'summon') { D.subMenu = act; this._refreshBattleUI(S); return; }
            if (act === 'back') { D.subMenu = 'main'; this._refreshBattleUI(S); return; }
            if (act === 'flee') { this._endBattle(S, false); MG.toast('FLED FROM BATTLE', '#cbd5e1'); return; }
            if (u.atb < 100) return;
            u.guard = false;
            if (act === 'def') { u.guard = true; u.atb = 35; D.log = `${u.name} braces in Guard stance (+ATB refund)!`; this._nextTurn(S); return; }
            const isLim = act === 'limit', isSp = act === 'sp';
            if (isSp && u.mp < u.spCost) { D.log = 'Not enough MP!'; this._refreshBattleUI(S); return; }
            if (isSp) u.mp -= u.spCost;
            if (isLim) u.limit = 0;
            u.atb = 0;
            const mult = isLim ? 3.8 : isSp ? 2.15 : 1.0;
            const dmg = Math.round((u.baseAtk + u.lv * 4 + (u.wep?.atk || 0) + (isSp || isLim ? (u.wep?.mag || 0) * 1.4 : 0)) * mult * (0.9 + Math.random() * 0.25));
            D.enemy.hp -= dmg; S.award(dmg * 2);
            if (!isLim) u.limit = Math.min(100, u.limit + 22);
            BO.FX.spawnTracer(D.heroFigs[D.turnIdx].root.position.clone().add(V(0, 1.3, 0)), D.enemyMesh.position.clone().add(V(0, 1.4, 0)), isLim ? 0xfacc15 : isSp ? 0x38bdf8 : 0xe2e8f0, isLim ? 0.14 : 0.08, 0.22);
            BO.FX.spawnExplosion(D.enemyMesh.position.clone().add(V(0, 1.4, 0)), isLim ? 5.5 : isSp ? 3.5 : 1.8, isLim ? 0xfacc15 : 0x38bdf8);
            if (isLim && BO.MinigameAudio) BO.MinigameAudio.ffLimit(); else SFX[isLim ? 'star' : 'thunk'](isLim ? 3 : undefined);
            D.log = isLim ? `🌟 LIMIT BREAK! ${u.name} unleashes ${u.limName} for ${dmg} DMG!` : `${u.name} ${isSp ? u.spName : 'strikes'} for ${dmg} DMG!`;
            this._afterAction(S);
        },
        _castSpell(S, spId) {
            const D = S.data, u = D.party[D.turnIdx], sp = FF_SPELLS.find((x) => x.id === spId);
            if (!sp || D.busy || u.atb < 100) return;
            if (u.mp < sp.mp) { D.log = 'Not enough MP!'; this._refreshBattleUI(S); return; }
            u.mp -= sp.mp; u.atb = 0; D.subMenu = 'main';
            if (sp.elem === 'scan') {
                D.enemy.scanned = true; SFX.ding(1.3); D.log = `Libra reveals ${D.enemy.name} is WEAK to ${D.enemy.weak.toUpperCase()}!`;
                this._nextTurn(S); return;
            }
            if (sp.elem === 'heal') {
                let low = D.party[0]; for (const p of D.party) if (p.hp > 0 && p.hp / p.maxHp < low.hp / low.maxHp) low = p;
                const amt = 135 + (u.wep?.mag || 0) * 1.5; low.hp = Math.min(low.maxHp, low.hp + Math.round(amt));
                SFX.heal(); D.log = `${u.name} casts Cura -> ${low.name} +${Math.round(amt)} HP!`;
                this._nextTurn(S); return;
            }
            if (sp.elem === 'buff') {
                if (!u.status.includes(sp.status)) u.status.push(sp.status);
                SFX.star(2); D.log = `${u.name} casts ${sp.name}! (${sp.desc})`;
                this._nextTurn(S); return;
            }
            const weakHit = D.enemy.weak === sp.elem;
            const dmg = Math.round((42 + u.lv * 5 + (u.wep?.mag || 10) * 2.2) * sp.pwr * (weakHit ? 1.75 : 1.0));
            D.enemy.hp -= dmg; S.award(dmg * 2); u.limit = Math.min(100, u.limit + 20);
            BO.FX.spawnExplosion(D.enemyMesh.position.clone().add(V(0, 1.5, 0)), weakHit ? 4.5 : 3.0, sp.col);
            if (BO.MinigameAudio) BO.MinigameAudio.ffSpell(sp.elem); else SFX.thunk();
            D.log = `${u.name} casts ${sp.name} for ${dmg} DMG!${weakHit ? ' 🔥 WEAKNESS HIT (1.75x)!' : ''}`;
            this._afterAction(S);
        },
        _castSummon(S, sumId) {
            const D = S.data, u = D.party[D.turnIdx], sm = FF_SUMMONS.find((x) => x.id === sumId);
            if (!sm || D.busy || u.atb < 100) return;
            if (u.mp < sm.mp) { D.log = 'Not enough MP!'; this._refreshBattleUI(S); return; }
            u.mp -= sm.mp; u.atb = 0; D.subMenu = 'main';
            const weakHit = D.enemy.weak === sm.elem;
            const dmg = Math.round((sm.dmg + (u.wep?.mag || 0) * 2.5) * (weakHit ? 1.5 : 1.0));
            D.enemy.hp -= dmg; S.award(dmg * 3);
            BO.FX.spawnExplosion(D.enemyMesh.position.clone().add(V(0, 1.8, 0)), 7.5, sm.col); SFX.rumble(0.6);
            D.log = `🐉 EIDOLON ${sm.name}! Deals ${dmg} massive damage!${weakHit ? ' (ELEMENTAL WEAKNESS!)' : ''}`;
            this._afterAction(S);
        },
        _useBag(S, item) {
            const D = S.data, bag = D.bag, u = D.party[D.turnIdx];
            if (!bag[item]) { D.log = 'Out of that item!'; this._refreshBattleUI(S); return; }
            bag[item]--; D.subMenu = 'main';
            if (item === 'potion' || item === 'hipotion') { const amt = item === 'hipotion' ? 190 : 90; u.hp = Math.min(u.maxHp, u.hp + amt); SFX.heal(); D.log = `${u.name} used ${item} (+${amt} HP)!`; }
            else if (item === 'ether') { u.mp = Math.min(u.maxMp, u.mp + 50); SFX.ding(1.2); D.log = `${u.name} +50 MP!`; }
            else if (item === 'phoenix') { const ko = D.party.find((p) => p.hp <= 0) || u; ko.hp = Math.round(ko.maxHp * 0.65); SFX.heal(); D.log = `Revived ${ko.name}!`; }
            else if (item === 'elixir') { for (const p of D.party) if (p.hp > 0) { p.hp = p.maxHp; p.mp = p.maxMp; } SFX.heal(); D.log = 'Elixir restored full HP & MP to everyone!'; }
            else if (item === 'bomb') { D.enemy.hp -= 220; BO.FX.spawnExplosion(D.enemyMesh.position.clone().add(V(0, 1.5, 0)), 4, 0xf97316); SFX.rumble(0.5); D.log = 'Fire Bomb hits for 220 DMG!'; }
            this._afterAction(S);
        },
        _afterAction(S) {
            const D = S.data; D.subMenu = 'main';
            if (D.enemy.hp <= 0) {
                D.enemy.hp = 0; S.kills++; S.award(D.enemy.isBoss ? 2500 : 500);
                D.gil += D.enemy.gil;
                for (const u of D.party) {
                    if (u.hp <= 0) continue;
                    u.xp += D.enemy.xp;
                    while (u.xp >= u.lv * 110) { u.xp -= u.lv * 110; u.lv++; u.maxHp += 28; u.hp = u.maxHp; u.maxMp += 10; u.mp = u.maxMp; u.baseAtk += 5; }
                }
                if (BO.MinigameAudio) BO.MinigameAudio.ffVictory(); else SFX.fanfare();
                const qt = D.questTag;
                this._endBattle(S, true);
                if (qt === 'aria' && !D.quests.aria) { D.quests.aria = true; D.party.push(D.alliesPool.aria); const n = D.npcs.find((x) => x.id === 'aria'); if (n) n.fig.root.visible = false; MG.toast('ARIA JOINED YOUR PARTY!', '#f472b6'); }
                else if (qt === 'vex' && !D.quests.vex) { D.quests.vex = true; D.party.push(D.alliesPool.vex); const n = D.npcs.find((x) => x.id === 'vex'); if (n) n.fig.root.visible = false; MG.toast('VEX JOINED YOUR PARTY!', '#10b981'); }
                else if (qt === 'boss1' && !D.quests.titus) { D.quests.titus = true; D.party.push(D.alliesPool.titus); const n = D.npcs.find((x) => x.id === 'titus'); if (n) n.fig.root.visible = false; MG.toast('IFRIT SLAIN — TITUS JOINED YOUR PARTY!', '#facc15'); }
                else if (qt === 'boss2') { D.quests.boss2 = true; MG.toast('BAHAMUT VANQUISHED! APPROACH SANCTUM AGAIN FOR OMEGA!', '#38bdf8'); }
                else if (qt === 'boss3') { D.quests.boss3 = true; MG.finish('OMEGA ASTRAL CONQUERED — WORLD SAVED!', { color: '#fde047' }); }
                this._updateQuestHUD(S);
                return;
            }
            this._nextTurn(S);
        },
        _endBattle(S) {
            const D = S.data;
            if (D.battleGroup) { S.scene.remove(D.battleGroup); D.battleGroup = null; }
            D.ui.style.display = 'none';
            D.mode = 'explore';
            if (BO.MinigameAudio) BO.MinigameAudio.start('ff:explore');
            this._updateQuestHUD(S);
        },
        _nextTurn(S) {
            const D = S.data;
            let next = D.party.findIndex((p, i) => i > D.turnIdx && p.hp > 0 && p.atb >= 100);
            if (next < 0) next = D.party.findIndex((p) => p.hp > 0 && p.atb >= 100);
            if (next >= 0) { D.turnIdx = next; this._refreshBattleUI(S); return; }
            D.busy = true; this._refreshBattleUI(S);
            setTimeout(() => {
                if (MG.session !== S || MG.state !== 'running' || D.mode !== 'battle') return;
                const alive = D.party.filter((p) => p.hp > 0);
                if (!alive.length) { MG.finish('PARTY WIPED OUT', { color: '#f87171' }); return; }
                const tgt = alive[Math.floor(Math.random() * alive.length)];
                const defTot = tgt.def + (tgt.arm?.def || 0);
                let raw = Math.max(8, D.enemy.atk - defTot);
                if (tgt.status && tgt.status.includes('protect')) raw = Math.round(raw * 0.6);
                const dmg = tgt.guard ? Math.round(raw * 0.4) : raw;
                tgt.hp = Math.max(0, tgt.hp - dmg);
                tgt.limit = Math.min(100, (tgt.limit || 0) + 28);
                for (const p of alive) p.atb = Math.min(100, p.atb + (p.status?.includes('haste') ? 75 : 48));
                BO.FX.spawnTracer(D.enemyMesh.position.clone().add(V(0, 1.4, 0)), D.heroFigs[D.party.indexOf(tgt)].root.position.clone().add(V(0, 1.2, 0)), 0xef4444, 0.08, 0.14);
                SFX.bonk(); D.log = `${D.enemy.name} strikes ${tgt.name} for ${dmg} DMG!`;
                if (!D.party.some((p) => p.hp > 0)) { MG.finish('PARTY WIPED OUT', { color: '#f87171' }); return; }
                D.turnIdx = D.party.findIndex((p) => p.hp > 0 && p.atb >= 100);
                if (D.turnIdx < 0) { const first = D.party.findIndex((p) => p.hp > 0); D.turnIdx = first; D.party[first].atb = 100; }
                D.busy = false;
                this._refreshBattleUI(S);
            }, 340);
        },
        update(S, dt, lib, state) {
            const D = S.data, P = BO.Player;
            if (state === 'running' && BO.MinigameAudio) BO.MinigameAudio.tick(dt);
            if (D.fountainSpire) { D.fountainSpire.rotation.y += dt * 1.4; D.fountainSpire.position.y = 2.4 + Math.sin(S.t * 2.5) * 0.18; }
            if (D.mode !== 'explore') {
                if (document.pointerLockElement && MG.state === 'running') document.exitPointerLock();
                if (D.enemyMesh) D.enemyMesh.rotation.y += dt * 0.9;
                if (D.mode === 'battle' && !D.busy && D.party[D.turnIdx]?.atb < 100) {
                    for (const p of D.party) if (p.hp > 0) p.atb = Math.min(100, p.atb + dt * (p.spd || 28) * (p.status?.includes('haste') ? 1.65 : 1.0));
                    if (D.party[D.turnIdx].atb >= 100) { SFX.ding(1.15); this._refreshBattleUI(S); }
                }
                return;
            }
            if (state !== 'running') return;
            for (const cr of D.crystals || []) {
                cr.mesh.rotation.y += dt * 1.8;
                if (cr.cd > 0) cr.cd -= dt;
                else if (P.pos.distanceTo(cr.pos) < 2.6) {
                    cr.cd = 14; for (const u of D.party) { u.hp = u.maxHp; u.mp = u.maxMp; }
                    SFX.heal(); MG.toast('MANA CRYSTAL! FULL HP/MP RESTORED!', '#38bdf8');
                }
            }
            if (P.keys?.ShiftLeft && Math.hypot(P.vel.x, P.vel.z) > 0.5) { P.pos.x += P.vel.x * 0.45 * dt; P.pos.z += P.vel.z * 0.45 * dt; }
            const moved = P.pos.distanceTo(D.lastWalkPos);
            D.lastWalkPos.copy(P.pos);
            if (moved > 0.01) {
                this._updateQuestHUD(S);
                this._drawMiniMap(S);
                const inVillage = P.pos.z > 10 && Math.abs(P.pos.x) < 16;
                if (!inVillage) {
                    D.encMeter += moved;
                    if (D.encMeter >= 26) {
                        D.encMeter = 0;
                        const spec = FF_ENEMIES[Math.floor(Math.random() * FF_ENEMIES.length)];
                        this._startBattle(S, spec, null);
                    }
                }
            }
        },
        dispose(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.stop();
            if (S.data.ui) S.data.ui.remove();
            if (S.data.questUi) S.data.questUi.remove();
            if (S.data.mapBox) S.data.mapBox.remove();
        }
    });

    /* =====================================================================
       7. BUNKER INSPECTION — Equippable 20/50/100 Sign Manual + 100% Observable Visual Signs
    ===================================================================== */
    const VISUAL_SIGNS = (() => {
        const defs = [
            { cat: 'FACE', label: 'Crimson Glowing Pupils', trait: 'glowEye' },
            { cat: 'FACE', label: 'Necrotic Grey/Green Skin Pallor', trait: 'sickSkin' },
            { cat: 'FACE', label: 'Spasming Jaw / Erratic Head Twitch', trait: 'twitch' },
            { cat: 'FACE', label: 'Slanted Red Scowl & Pale Lips', trait: 'scowl' },
            { cat: 'SKIN', label: 'Blackened Vein Patches on Neck', trait: 'veinNeck' },
            { cat: 'SKIN', label: 'Blood-Stained Torn Shirt Collar', trait: 'bloodShirt' },
            { cat: 'SKIN', label: 'Green Fungal Pustule Spots on Torso', trait: 'rash' },
            { cat: 'WOUNDS', label: 'Fresh Bite Mark Scar on Shoulder', trait: 'biteShoulder' },
            { cat: 'WOUNDS', label: 'Dark Rot & Blackened Hands', trait: 'rotHands' },
            { cat: 'WOUNDS', label: 'Bloody Emergency Forearm Bandage', trait: 'bandage' },
            { cat: 'BEHAVIOR', label: 'Hunched Trembling Fever Shiver', trait: 'hunch' },
            { cat: 'BEHAVIOR', label: 'Toxic Green Spore Cloud on Collar', trait: 'spores' },
            { cat: 'BEHAVIOR', label: 'Heavy Wheezing / Dark Mist Cough', trait: 'cough' },
            { cat: 'BADGE', label: 'Expired RED STAMP Quarantine Pass', trait: 'badBadgeRed' },
            { cat: 'BADGE', label: 'Blood-Smudged / Torn Bunker ID', trait: 'badBadgeBlood' },
            { cat: 'BADGE', label: 'Forged Crooked Ink-Smear Permit', trait: 'badBadgeCrook' }
        ];
        const tiers = ['Mild', 'Acute', 'Severe', 'Late-Stage', 'Critical', 'Strain-B', 'Variant-X'];
        const out = [];
        for (let i = 0; i < 100; i++) {
            const base = defs[i % defs.length];
            const tier = Math.floor(i / defs.length);
            out.push({ id: i + 1, cat: base.cat, trait: base.trait, label: tier === 0 ? base.label : `${base.label} (${tiers[tier % tiers.length]})` });
        }
        return out;
    })();

    const DIFF_CONF = {
        easy: { label: 'EASY (20 SIGNS / 20 BULLETS)', signs: 20, bullets: 20, infRate: 0.36 },
        normal: { label: 'NORMAL (50 SIGNS / 50 BULLETS)', signs: 50, bullets: 50, infRate: 0.44 },
        hard: { label: 'HARD (100 SIGNS / 100 BULLETS)', signs: 100, bullets: 100, infRate: 0.52 }
    };

    function badgeTex(type, name = 'CITIZEN') {
        return L.canvasTex('bpass2-' + type + '-' + name, 160, 200, (g, w, h) => {
            g.fillStyle = '#f8fafc'; g.fillRect(0, 0, w, h);
            g.strokeStyle = '#334155'; g.lineWidth = 5; g.strokeRect(3, 3, w - 6, h - 6);
            g.fillStyle = '#1e293b'; g.fillRect(12, 12, w - 24, 26);
            g.fillStyle = '#fde68a'; g.font = 'bold 12px monospace'; g.textAlign = 'center'; g.fillText('SECTOR-4 PASS', w / 2, 29);
            g.fillStyle = '#94a3b8'; g.fillRect(22, 48, 52, 56);
            g.fillStyle = '#334155'; g.font = 'bold 11px sans-serif'; g.textAlign = 'left';
            g.fillText(name.slice(0, 10), 82, 64);
            g.fillStyle = '#64748b'; g.font = '10px monospace';
            g.fillText(type === 'badBadgeRed' ? 'EXP: 2024' : 'EXP: 2027', 82, 82);
            g.fillText('CLR: B-09', 82, 96);
            g.font = '900 18px sans-serif'; g.textAlign = 'center';
            if (type === 'clean') {
                g.strokeStyle = '#16a34a'; g.lineWidth = 2.5; g.strokeRect(24, 126, w - 48, 34);
                g.fillStyle = '#16a34a'; g.fillText('CLEARED', w / 2, 149);
            } else if (type === 'badBadgeRed') {
                g.strokeStyle = '#b91c1c'; g.lineWidth = 2; g.strokeRect(24, 126, w - 48, 34);
                g.fillStyle = '#b91c1c'; g.fillText('REVOKED', w / 2, 149);
            } else if (type === 'badBadgeBlood') {
                g.strokeStyle = '#16a34a'; g.lineWidth = 2.5; g.strokeRect(24, 126, w - 48, 34);
                g.fillStyle = '#16a34a'; g.fillText('CLEARED', w / 2, 149);
                g.fillStyle = 'rgba(127,29,29,0.55)'; g.beginPath(); g.arc(118, 134, 18, 0, TAU); g.fill();
            } else {
                g.save(); g.translate(w / 2, 143); g.rotate(-0.18);
                g.fillStyle = 'rgba(217,119,6,0.85)'; g.fillText('UNVERIFIED', 0, 0);
                g.restore();
            }
        });
    }

    const VISITOR_NAMES = ['Miller', 'Chen', 'Kovacs', 'Reyes', 'Okafor', 'Sato', 'Vance', 'Lindqvist', 'Navarro', 'Patel', 'Keller', 'Morales'];
    const VISITOR_QUOTES = [
        'Please let me in, the streets outside are swarming.',
        'My transit papers were checked two blocks back.',
        'Just looking for shelter until sunrise, officer.',
        'It\'s freezing out here in the quarantine fog.'
    ];

    MG.register({
        id: 'fun_inspection', cat: 'fun', order: 7, name: 'Bunker Inspection', icon: '🪪', accent: '#eab308', badge: '10 MIN',
        tagline: 'NO auto-scan! Inspect layered visitors, toggle UV Lamp [L] & Question [Q], use your Manual!',
        desc: 'Ten-minute Quarantine Checkpoint shift! NO automatic scanner—inspect richly detailed visitors in line! Look closely with [RMB] Zoom & [L] UV Lamp for subtle discolored veins, faint sclera tint, micro-twitches, scars, coughs & ID discrepancies. Question ([Q]) nervous entrants or close the Steel Gate ([G]) when outbreaks happen!',
        heroLabel: 'FUN • PURE VISUAL CHECKPOINT • 10 MINUTES', duration: 600, stars: [1500, 3500, 6200, 10000],
        standardWeapon: 'm1911', lockWeapon: true, fixedAmmo: true, infiniteMag: false, customMusic: true,
        hubOptions: [{ key: 'inspDiff', label: 'DIFFICULTY', default: 'easy', choices: Object.entries(DIFF_CONF).map(([k, v]) => ({ val: k, label: k.toUpperCase(), desc: v.label })) }],
        weaponLabel: 'SMALL PISTOL (20 / 50 / 100 BULLETS)', weaponNote: 'NO Auto-Scan • [L] UV Lamp • [T] IR Thermometer • [Q] Question • [F] Manual',
        keys: [['F / TAB', 'Field Manual'], ['RMB', 'Zoom In'], ['L', 'UV Lamp'], ['T', 'IR Temp Scan'], ['Q', 'Question'], ['E / X', 'Approve / Deny'], ['G', 'Gate Shutter']],
        guide: {
            objective: 'Work a 10-minute Bunker gate shift. Admit healthy survivors [E] and reject infected visitors [X] using pure visual inspection.',
            tips: [
                'There is ZERO auto-scanning! Use [RMB] Zoom and [L] UV Lamp to catch subtle pale olive skin, faint crimson pupils, bruised fingertips, or tiny neck veins.',
                'Check the visitor\'s held Sector-4 Pass for REVOKED tags, smudged blood stains, or crooked forged stamps.',
                'Press [G] to drop the Steel Gate Shutter if a sleeper mutates behind you inside the bunker!'
            ]
        },
        map: {
            atmosphere: { skyTop: 0x090d16, skyBottom: 0x1e293b, fogColor: 0x18181b, fogDensity: 0.011, sunColor: 0xfef3c7, sunIntensity: 1.0, sunPos: [10, 40, 20], hemiSky: 0x94a3b8, hemiGround: 0x18181b, hemiIntensity: 0.85 },
            boxes: [B(0, -0.5, -10, 96, 1, 96, 'concrete')],
            spawn: { x: 0, y: 0, z: 1.5, yaw: 0 }
        },
        build(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.start('bunker');
            const diffKey = (S.opts && DIFF_CONF[S.opts.inspDiff]) ? S.opts.inspDiff : 'easy';
            S.data.dc = DIFF_CONF[diffKey];
            K.groundPlane(S, 96, 0x27272a, 0.002);
            const wallM = std(0x475569, 0.85), gateM = std(0x334155, 0.55, 0.5), bunkM = std(0x334155, 0.8), steelM = std(0x1f2937, 0.4, 0.8);
            const hazTex = L.canvasTex('bunker-haz', 128, 32, (g, w, h) => {
                g.fillStyle = '#eab308'; g.fillRect(0, 0, w, h); g.fillStyle = '#111827';
                for (let x = -32; x < w + 32; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 12, 0); g.lineTo(x - 4, h); g.lineTo(x - 16, h); g.closePath(); g.fill(); }
            });
            const hazMat = new THREE.MeshStandardMaterial({ map: hazTex, roughness: 0.55 });
            this._box(S, -10.5, 2.2, -6, 15, 4.4, 0.8, wallM);
            this._box(S, 10.5, 2.2, -6, 15, 4.4, 0.8, wallM);
            this._box(S, 0, 0.52, -6, 6, 1.04, 1.1, gateM);
            // Hazard stripe floor zone + overhead steel frame + fluorescent light + rotating amber beacon
            const bayFloor = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 4.2), hazMat); bayFloor.rotation.x = -Math.PI / 2; bayFloor.position.set(0, 0.03, -8.2); S.add(bayFloor);
            const frameTop = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.45, 1.15), hazMat); frameTop.position.set(0, 3.65, -6); S.add(frameTop);
            const fluo = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.12, 0.35), basic(0xfef9c3)); fluo.position.set(0, 3.35, -7.2); S.add(fluo);
            const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.36, 12), basic(0xf59e0b)); beacon.position.set(2.8, 4.05, -6); S.add(beacon);
            const statusLamp = new THREE.Mesh(new THREE.SphereGeometry(0.20, 10, 8), basic(0x22c55e)); statusLamp.position.set(-2.6, 3.35, -5.35); S.add(statusLamp);
            // Desk APPROVE (Green) / DENY (Red) physical buttons + 3D Magnified Pass Display Board on counter!
            const btnOk = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.35), basic(0x22c55e)); btnOk.position.set(-1.35, 1.09, -5.65);
            const btnNo = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.35), basic(0xef4444)); btnNo.position.set(-0.75, 1.09, -5.65);
            const deskPass = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.18), new THREE.MeshBasicMaterial({ map: badgeTex('clean', 'WAIT'), side: THREE.DoubleSide }));
            deskPass.position.set(1.75, 1.72, -5.42); deskPass.rotation.y = -0.25;
            S.add(btnOk, btnNo, deskPass);
            // Sandbag barricades outside checkpoint
            for (const sx of [-4.2, 4.2]) {
                for (let b = 0; b < 3; b++) {
                    const bag = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.42, 0.72), std(0x78716c, 0.95));
                    bag.position.set(sx, 0.21 + b * 0.40, -10.5); S.add(bag);
                }
            }
            this._box(S, -18, 2.5, 14, 1, 5, 42, wallM);
            this._box(S, 18, 2.5, 14, 1, 5, 42, wallM);
            this._box(S, 0, 2.5, 34, 36, 5, 1, wallM);
            const shutter = new THREE.Mesh(new THREE.BoxGeometry(6.0, 3.2, 0.25), steelM);
            shutter.position.set(0, 5.2, -6.0); S.add(shutter);

            const deskLt = new THREE.PointLight(0xfef9c3, 1.75, 14, 1.5); deskLt.position.set(0, 3.1, -7.2); S.add(deskLt);
            const uvLt = new THREE.PointLight(0x818cf8, 0, 9, 1.4); uvLt.position.set(0, 2.1, -6.5); S.add(uvLt);

            const sg = A.sign('CHECKPOINT OMEGA • [F] MANUAL • [L] UV • [T] TEMP • [Q] QUESTION', 8.8, 0.82, { bg: '#1e293b', color: '#fef08a', borderColor: '#facc15', size: 0.32 });
            sg.position.set(0, 4.35, -5.8); S.add(sg);
            for (const bx of [-13, 13]) for (const bz of [10, 18, 26]) this._box(S, bx, 0.7, bz, 2.6, 1.4, 1.4, bunkM);
            for (const [cx, cz] of [[-5, 22], [5, 22], [0, 30]]) this._box(S, cx, 0.55, cz, 2.2, 1.1, 1.2, std(0x78350f, 0.8));

            // Waiting Queue behind the active inspection bay
            S.data.queueFigs = [0, 1, 2].map((qi) => {
                const qf = F.human(F.randomCivilian(Math.random));
                qf.root.position.set(-0.4 + (qi % 2 ? 0.6 : -0.3), 0, -10.5 - qi * 2.4);
                S.add(qf.root); return qf;
            });

            Object.assign(S.data, { survivors: [], entrant: null, manualOpen: false, manualCat: 'ALL', nextDelay: 1.2, correct: 0, wrong: 0, outbreaks: 0, uvOn: false, gateClosed: false, shutter, deskLt, uvLt, statusLamp, beacon, deskPass, dialogTxt: '' });
            this._buildManualUI(S);
            this._nextEntrant(S);
        },
        _box(S, x, y, z, w, h, d, m) {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
            mesh.position.set(x, y, z); S.add(mesh); S.collider(x - w / 2, y - h / 2, z - d / 2, x + w / 2, y + h / 2, z + d / 2);
        },
        start(S) {
            const w = BO.Player.activeWeapon;
            if (w) { const tot = S.data.dc.bullets; w.mag = Math.min(8, tot); w.reserve = Math.max(0, tot - w.mag); }
        },
        _buildManualUI(S) {
            const old = document.getElementById('insp-manual-ui'); if (old) old.remove();
            const el = document.createElement('div');
            el.id = 'insp-manual-ui'; el.className = 'insp-manual'; el.style.display = 'none';
            el.addEventListener('mousedown', (e) => e.stopPropagation());
            document.body.appendChild(el);
            S.data.manualEl = el;
            this._renderManual(S);
        },
        _renderManual(S) {
            const D = S.data, el = D.manualEl; if (!el) return;
            const activeSigns = VISUAL_SIGNS.slice(0, D.dc.signs);
            const cats = ['ALL', 'FACE', 'SKIN', 'WOUNDS', 'BEHAVIOR', 'BADGE'];
            const list = D.manualCat === 'ALL' ? activeSigns : activeSigns.filter((s) => s.cat === D.manualCat);
            el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;"><h3>📋 FIELD MANUAL (${D.dc.signs} SIGNS)</h3><button class="ff-btn" id="insp-close" style="padding:3px 8px;">✕ [F]</button></div>
                <div class="insp-tabs">${cats.map((c) => `<button class="${D.manualCat === c ? 'on' : ''}" data-mc="${c}">${c}</button>`).join('')}</div>
                <div class="insp-list">${list.map((s) => `<div><b>#${s.id} [${s.cat}]</b> ${esc(s.label)}</div>`).join('')}</div>`;
            el.querySelectorAll('[data-mc]').forEach((b) => { b.onclick = () => { D.manualCat = b.dataset.mc; this._renderManual(S); }; });
            el.querySelector('#insp-close').onclick = () => this._toggleManual(S, false);
        },
        _toggleManual(S, force) {
            const D = S.data; if (!D.manualEl) return;
            D.manualOpen = force !== undefined ? force : !D.manualOpen;
            D.manualEl.style.display = D.manualOpen ? 'flex' : 'none';
            if (D.manualOpen && document.pointerLockElement) document.exitPointerLock();
            SFX.clack();
        },
        _nextEntrant(S) {
            const D = S.data;
            if (D.entrant && D.entrant.fig && D.entrant.fig.root.parent) D.entrant.fig.root.parent.remove(D.entrant.fig.root);
            const infected = Math.random() < D.dc.infRate;
            const pool = VISUAL_SIGNS.slice(0, D.dc.signs);
            const sign = infected ? pool[Math.floor(Math.random() * pool.length)] : null;
            const tr = sign ? sign.trait : null;
            const vName = VISITOR_NAMES[Math.floor(Math.random() * VISITOR_NAMES.length)];

            const fig = F.human(F.randomCivilian(Math.random, {
                skin: (tr === 'sickSkin') ? 0xc2c8ae : undefined,
                eyes: (tr === 'scowl') ? 'angry' : 'normal',
                shirt: (tr === 'bloodShirt') ? 0x5c1a1a : undefined,
                hat: Math.random() < 0.45 ? (Math.random() < 0.5 ? 'cap' : 'beanie') : 'none',
                longHair: Math.random() < 0.35
            }));
            // Rich visitor clothing accessories: layered scarf/collar + travel backpack
            const collar = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.045, 6, 14), std([0x334155, 0x78350f, 0x064e3b, 0x4c1d95][Math.floor(Math.random() * 4)], 0.8));
            collar.rotation.x = Math.PI / 2; collar.position.set(0, 1.35, 0.02); fig.root.add(collar);
            if (Math.random() < 0.65) {
                const pack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 0.16), std(0x44403c, 0.85));
                pack.position.set(0, 1.08, -0.2); fig.root.add(pack);
            }
            if (Math.random() < 0.3) {
                for (const s of [-1, 1]) {
                    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.02), std(0x0f172a, 0.2, 0.5));
                    lens.position.set(s * 0.075, 1.56, 0.2); fig.root.add(lens);
                }
            }

            // SUBTLE YET NOTICEABLE visual symptoms (require a closer look with [RMB] / [L] UV!)
            const uvSpots = [];
            if (tr === 'glowEye') {
                for (const s of [-1, 1]) {
                    const ge = new THREE.Mesh(new THREE.SphereGeometry(0.026, 6, 6), std(0x7f1d1d, 0.4, 0, { emissive: 0x991b1b, emissiveIntensity: 0.55 }));
                    ge.position.set(s * 0.075, 1.56, 0.185); fig.root.add(ge);
                }
            } else if (tr === 'veinNeck') {
                const vn = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.105, 0.09, 10), std(0x4c1d95, 0.7, 0, { transparent: true, opacity: 0.68 }));
                vn.position.set(0, 1.40, 0.01); fig.root.add(vn); uvSpots.push(vn);
            } else if (tr === 'rash') {
                for (let r = 0; r < 5; r++) {
                    const sp = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), std(0x65a30d, 0.65));
                    sp.position.set((r - 2) * 0.045 + 0.02, 1.18 + (r % 2) * 0.06, 0.165); fig.root.add(sp); uvSpots.push(sp);
                }
            } else if (tr === 'biteShoulder') {
                const bt = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.014, 5, 10), std(0x7f1d1d, 0.6));
                bt.position.set(0.21, 1.29, 0.09); bt.rotation.y = 0.6; fig.root.add(bt);
            } else if (tr === 'rotHands') {
                for (const h of [fig.parts.armL, fig.parts.armR]) {
                    if (h) { const hd = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.12, 0.11), std(0x27272a, 0.75)); hd.position.y = -0.35; h.add(hd); }
                }
            } else if (tr === 'bandage') {
                const bn = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.16, 8), std(0xe2e8f0, 0.9));
                bn.position.set(0.24, 1.06, 0.05); fig.root.add(bn);
                const bd = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.15), std(0x991b1b, 0.8));
                bd.position.set(0.24, 1.06, 0.06); fig.root.add(bd); uvSpots.push(bd);
            }
            const badgeKind = (tr === 'badBadgeRed' || tr === 'badBadgeBlood' || tr === 'badBadgeCrook') ? tr : 'clean';
            const passTex = badgeTex(badgeKind, vName);
            const card = new THREE.Mesh(new THREE.PlaneGeometry(0.30, 0.38), new THREE.MeshBasicMaterial({ map: passTex, side: THREE.DoubleSide }));
            card.position.set(-0.30, 1.24, 0.27);
            if (tr === 'badBadgeCrook') card.rotation.z = 0.22;
            fig.root.add(card);
            if (D.deskPass) { D.deskPass.material.map = passTex; D.deskPass.material.needsUpdate = true; }

            fig.root.position.set(0, 0, -9.8);
            S.add(fig.root);
            D.dialogTxt = `"${VISITOR_QUOTES[Math.floor(Math.random() * VISITOR_QUOTES.length)]}"`;
            const fever = infected && Math.random() < 0.75;
            const tempC = fever ? (39.1 + Math.random() * 2.4) : (36.3 + Math.random() * 0.9);
            D.entrant = { fig, infected, sign, tr, vName, uvSpots, coughT: 2.2, questionBoost: 0, tempC: tempC.toFixed(1), tempScanned: false, walkZ: -9.8 };
        },
        _decide(S, approve) {
            const D = S.data, ent = D.entrant;
            if (!ent) return;
            const wasInf = ent.infected;
            const ok = (approve && !wasInf) || (!approve && wasInf);
            if (BO.MinigameAudio) BO.MinigameAudio.bunkerStamp(ok);
            if (D.statusLamp) D.statusLamp.material.color.setHex(ok ? 0x22c55e : 0xef4444);
            if (ok) { D.correct++; S.bumpCombo(); S.award(300 * S.comboMult, V(0, 2, -6), 'GOOD CALL!', '#86efac'); }
            else { D.wrong++; S.breakCombo('BAD CALL!'); S.award(-180, V(0, 2, -6), wasInf ? 'LET INFECTED IN!' : 'DENIED CLEAN PERSON!', '#fca5a5'); }

            if (approve) {
                const sx = (Math.random() - 0.5) * 24, sz = 10 + Math.random() * 18;
                ent.fig.root.position.set(sx, 0, sz);
                const surv = { fig: ent.fig, infected: false, sleeper: wasInf, incubateT: wasInf ? (20 + Math.random() * 180) : Infinity, walkPh: Math.random() * 5, tg: null };
                if (wasInf) {
                    const tg = S.addTarget({ mesh: ent.fig.root, hitMeshes: ent.fig.hit, pos: V(sx, 0, sz), life: 0, appear: 'none', inT: 0.01, death: 'knock', deathColor: 0xef4444, bonus: true });
                    tg.isBunkerHost = true; tg.survRef = surv; surv.tg = tg;
                }
                D.survivors.push(surv);
            } else if (ent.fig.root.parent) {
                ent.fig.root.parent.remove(ent.fig.root);
            }
            D.entrant = null; D.dialogTxt = ''; D.nextDelay = 1.1;
        },
        onKey(S, code) {
            const D = S.data;
            if (MG.state !== 'running') return false;
            if (code === 'KeyF' || code === 'Tab') { this._toggleManual(S); return true; }
            if (code === 'KeyL') {
                D.uvOn = !D.uvOn;
                D.uvLt.intensity = D.uvOn ? 2.4 : 0; D.deskLt.intensity = D.uvOn ? 0.45 : 1.65;
                SFX.clack(); MG.toast(D.uvOn ? 'UV LAMP ON' : 'UV LAMP OFF', '#818cf8'); return true;
            }
            if (code === 'KeyG') {
                D.gateClosed = !D.gateClosed;
                if (BO.MinigameAudio) BO.MinigameAudio.bunkerShutter(); else SFX.rumble(0.25);
                MG.toast(D.gateClosed ? 'GATE SHUTTER LOCKED' : 'GATE OPEN', '#fde047'); return true;
            }
            if (!D.entrant) return false;
            if (code === 'KeyT') {
                D.entrant.tempScanned = true;
                const hot = parseFloat(D.entrant.tempC) >= 38.5;
                SFX.ding(hot ? 0.75 : 1.35);
                MG.toast(`🌡 IR THERMOMETER: ${D.entrant.tempC}°C ${hot ? '(HIGH FEVER!)' : '(NORMAL)'}`, hot ? '#f87171' : '#4ade80');
                return true;
            }
            if (code === 'KeyQ') {
                D.entrant.questionBoost = 3.5;
                D.dialogTxt = D.entrant.infected ? '"J-just hurry up and stamp it... please..."' : '"Everything is in order, check my Sector-4 ID!"';
                SFX.pop(); return true;
            }
            if (code === 'KeyE' && !D.gateClosed) { this._decide(S, true); return true; }
            if (code === 'KeyX' && !D.gateClosed) { this._decide(S, false); return true; }
            return false;
        },
        update(S, dt, lib, state) {
            const D = S.data, P = BO.Player;
            if (D.shutter) D.shutter.position.y = BO.Math.lerp(D.shutter.position.y, D.gateClosed ? 2.4 : 5.4, dt * 8);
            const hasOutbreak = D.survivors.some((s) => s.infected);
            if (D.beacon) D.beacon.material.color.setHex(hasOutbreak && Math.sin(S.t * 14) > 0 ? 0xef4444 : 0xf59e0b);
            if (state === 'running' && BO.MinigameAudio) BO.MinigameAudio.tick(dt, { outbreak: hasOutbreak });
            if (state !== 'running') return;
            if (!D.entrant) {
                D.nextDelay -= dt; if (D.nextDelay <= 0) this._nextEntrant(S);
            } else {
                const ent = D.entrant, tr = ent.tr;
                if (ent.walkZ < -7.2) {
                    ent.walkZ = Math.min(-7.2, ent.walkZ + dt * 3.8);
                    ent.fig.root.position.z = ent.walkZ;
                    F.walk(ent.fig, S.t * 9, 1, false);
                }
                if (ent.questionBoost > 0) ent.questionBoost -= dt;
                // Subtle natural breathing & nervous behavior cues!
                ent.fig.root.position.y = Math.sin(S.t * 2.2) * 0.015;
                if (tr === 'twitch') {
                    const amp = ent.questionBoost > 0 ? 0.24 : 0.12;
                    ent.fig.root.rotation.y = (Math.sin(S.t * 17) > 0.72) ? Math.sin(S.t * 35) * amp : 0;
                }
                if (tr === 'hunch') {
                    ent.fig.root.position.x = Math.sin(S.t * 28) * 0.02;
                    ent.fig.root.rotation.x = 0.14;
                }
                if (tr === 'spores' && (D.uvOn || Math.random() < dt * 2.5)) {
                    if (Math.random() < dt * 4.5) BO.FX.spawnParticles(ent.fig.root.position.clone().add(V(0, 1.32, 0.12)), 1, D.uvOn ? 0xa3e635 : 0x65a30d, 0.8, -0.3, 0.45, 0.55);
                }
                if (tr === 'cough') {
                    ent.coughT -= dt * (ent.questionBoost > 0 ? 2 : 1);
                    if (ent.coughT <= 0) {
                        ent.coughT = 2.8;
                        if (BO.MinigameAudio) BO.MinigameAudio.bunkerCough();
                        BO.FX.spawnParticles(ent.fig.root.position.clone().add(V(0, 1.48, 0.25)), 4, 0x4d7c0f, 1.5, 0.15, 0.45, 0.65);
                    }
                }
                if (D.uvOn && ent.uvSpots) {
                    for (const sp of ent.uvSpots) sp.material.emissive && sp.material.emissive.setHex(0x84cc16);
                }
            }
            for (let i = D.survivors.length - 1; i >= 0; i--) {
                const sv = D.survivors[i];
                if (sv.sleeper && !sv.infected) {
                    sv.incubateT -= dt;
                    if (sv.incubateT <= 0) { sv.infected = true; D.outbreaks++; MG.toast('⚠ BUNKER OUTBREAK! KILL INFECTED!', '#ef4444'); SFX.buzzer(); }
                }
                if (!sv.infected) continue;
                if (sv.tg && !sv.tg.alive) { D.survivors.splice(i, 1); continue; }
                let victim = null, vd = Infinity;
                for (const o of D.survivors) { if (o !== sv && !o.infected) { const d = sv.fig.root.position.distanceTo(o.fig.root.position); if (d < vd) { vd = d; victim = o; } } }
                const tp = victim ? victim.fig.root.position : P.pos;
                const dx = tp.x - sv.fig.root.position.x, dz = tp.z - sv.fig.root.position.z, dist = Math.max(0.1, Math.hypot(dx, dz));
                sv.fig.root.position.x += (dx / dist) * 3.4 * dt; sv.fig.root.position.z += (dz / dist) * 3.4 * dt;
                sv.fig.root.rotation.y = Math.atan2(dx, dz); sv.walkPh += dt * 10; F.walk(sv.fig, sv.walkPh, 1, true);
                if (victim && dist < 1.35) {
                    victim.infected = true; victim.sleeper = false;
                    const tg = S.addTarget({ mesh: victim.fig.root, hitMeshes: victim.fig.hit, pos: victim.fig.root.position.clone(), life: 0, appear: 'none', inT: 0.01, death: 'knock', deathColor: 0xef4444, bonus: true });
                    tg.isBunkerHost = true; tg.survRef = victim; victim.tg = tg;
                    MG.toast('SURVIVOR BITTEN & INFECTED!', '#f87171');
                }
            }
        },
        onHit(S, ent, info) {
            if (!ent.isBunkerHost || !ent.alive) return false;
            const sv = ent.survRef;
            if (!sv || !sv.infected) { S.award(-250, info.pt, 'HEALTHY SURVIVOR!', '#f87171'); return false; }
            ent.kill(info); S.kills++; S.award(450, info.pt, 'INFECTED TERMINATED!', '#86efac'); SFX.thunk(); return true;
        },
        result(S) {
            const D = S.data, healthy = D.survivors.filter((s) => !s.infected && !s.sleeper).length;
            const totalScore = S.score + healthy * 350;
            return { score: totalScore, stars: this.stars.filter((th) => totalScore >= th).length, title: healthy >= 8 ? 'HAWK-EYE WARDEN' : 'SHIFT COMPLETE', stats: [['CLEAN SURVIVORS', healthy], ['CORRECT CALLS', D.correct], ['MISTAKES', D.wrong], ['OUTBREAKS QUELLED', S.kills]] };
        },
        dispose(S) { if (BO.MinigameAudio) BO.MinigameAudio.stop(); if (S.data.manualEl) S.data.manualEl.remove(); },
        hud(S) {
            const D = S.data, w = BO.Player.activeWeapon, ammo = w ? w.mag + w.reserve : 0;
            const healthy = D.survivors.filter((s) => !s.infected).length, inf = D.survivors.filter((s) => s.infected).length;
            const tempChip = D.entrant && D.entrant.tempScanned ? `<div class="mgx-chip ${parseFloat(D.entrant.tempC) >= 38.5 ? 'mgx-bad' : 'mgx-hot'}">TEMP <b>${D.entrant.tempC}°C</b></div>` : `<div class="mgx-chip">TEMP <b>[T] SCAN</b></div>`;
            return `<div class="fun-panel"><div class="mgx-chip">SURVIVORS <b>${healthy}</b></div><div class="mgx-chip ${inf > 0 ? 'mgx-bad' : ''}">OUTBREAKS <b>${inf}</b></div><div class="mgx-chip">AMMO <b>${ammo}</b></div>${tempChip}<div class="mgx-chip">${D.uvOn ? '🔦 UV ON' : '💡 STD LIGHT'}</div><div class="mgx-chip"><b>[F]</b> MANUAL • <b>[E]</b> IN / <b>[X]</b> DENY</div></div>
            ${D.entrant ? `<div class="fun-panel" style="margin-top:4px;font-size:11.5px;color:#fde68a;"><b>${D.entrant.vName}:</b> ${esc(D.dialogTxt)}</div>` : ''}`;
        }
    });
})(window);
