
/* Original procedural geometry for the armory and undead wardrobe. */
(function (BO) {
    'use strict';

    // Every entry specifies a body profile, a finish, and the count of its signature detail.
    const firearms = {
        m4a1: ['stepped', 0x424e53, 4], ak47: ['wood', 0x8b492a, 3],
        scarh: ['slab', 0xa99168, 2], m16a4: ['shroud', 0x374345, 7],
        famas_f1: ['carry', 0x566354, 3], galil_ar: ['lattice', 0x7c7460, 5],
        acr_68: ['slab', 0x8c8571, 5], aug_hbars: ['bullpup', 0x606846, 4],
        g36c_tac: ['carry', 0x424752, 6], an94_abakan: ['stepped', 0x614940, 6],
        fal_osw: ['wood', 0x775338, 5], xm8_storm: ['spine', 0x707d83, 3],
        mp5: ['ribbed', 0x49565e, 6], p90: ['bullpup', 0x58807c, 6],
        ump45: ['lattice', 0x333b47, 4], mp7_navy: ['stepped', 0x58728b, 3],
        vector_kriss: ['drop', 0x6d6554, 5], aks74u: ['wood', 0xa27644, 2],
        mac10_uzi: ['slab', 0x66777d, 3], pp19_bizon: ['helix', 0x59676c, 8],
        thompson_m1: ['wood', 0x694525, 7], scorpion_evo: ['spine', 0x6a5963, 5],
        r870: ['pump', 0x8c5940, 7], m1014_cod4: ['shroud', 0x71817c, 4],
        model_1887_mw2: ['lever', 0xa87a43, 3], aa12: ['slab', 0x726955, 6],
        spas12_tac: ['shroud', 0x52606a, 8], ksg_slug: ['bullpup', 0xa08461, 3],
        saiga12_k: ['lattice', 0x6f6853, 3], double_barrel: ['twin', 0x936039, 2],
        striker_12: ['drum', 0x5a625c, 6], m249: ['belt', 0x938268, 6],
        rpd: ['wood', 0x70452d, 4], pkp_pecheneg: ['shroud', 0x58684b, 9],
        mg42_buzzsaw: ['shroud', 0x7e8279, 10], lsat_heavy: ['belt', 0x687c86, 4],
        steyr_aug_lmg: ['bullpup', 0x778356, 7], m60e4_pig: ['belt', 0x777466, 8],
        minigun_death: ['rotary', 0x949ca3, 6], m40a3_cod4: ['cheek', 0x78836d, 3],
        r700_cod4: ['cheek', 0x8a5d42, 2], intervention: ['truss', 0x73838b, 4],
        mk14: ['cheek', 0x776a56, 5], barrett_50cal: ['truss', 0xa38968, 6],
        l96a1_awm: ['truss', 0x697a5d, 3], dragunov_svd: ['wood', 0xa16539, 6],
        msr_remington: ['truss', 0x817b8c, 5], kar98k_irons: ['lever', 0x845232, 6],
        m1911: ['slide', 0x69747e, 5], deagle: ['slide', 0xb4b6bb, 3],
        gold_deagle_cod4: ['slide', 0xcfae5e, 7], glock18_auto: ['slide', 0x454954, 8],
        b23r_burst: ['stepped', 0x668591, 3], python_magnum: ['revolver', 0x8b9297, 6],
        five_seven: ['slide', 0x577276, 6], rpg7_warhead: ['heatshield', 0x8d664a, 6]
    };

    const anomalies = {
        raygun: ['orbit', 0xec7756, 3], tesla_wunder: ['coil', 0xf3ba58, 5],
        zeus_cannon: ['petal', 0xeb9656, 5], winters_howl_bo1: ['fork', 0x7edeee, 4],
        baby_gun_bo1: ['vessel', 0xade261, 3], wave_gun_bo1: ['twin', 0x8478e6, 4],
        scavenger_bo1: ['fork', 0xcf7971, 2], raygun_mk2: ['twin', 0x61d1e7, 3],
        blundergat_bo2: ['cascade', 0xb89c90, 4], paralyzer_bo2: ['orbit', 0xecc672, 2],
        sliquifier_bo2: ['vessel', 0xb898e4, 4], void_singularity: ['orbit', 0xa684e8, 5],
        inferno_drake: ['cascade', 0xe87c4d, 5], cryo_sceptre: ['petal', 0xa4dff5, 6],
        solar_lance: ['fork', 0xe9d999, 3], apothicon_servant_bo3: ['petal', 0xb287b7, 7],
        necro_skull: ['orbit', 0xa5e4be, 4], acid_hydra: ['vessel', 0x9bc57a, 6],
        chrono_shatter: ['coil', 0x919fea, 4], death_of_orion_bo4: ['cascade', 0x78bda8, 6],
        alistairs_folly_bo4: ['coil', 0xd1a17e, 3], megaman_buster: ['twin', 0x65a5eb, 5]
    };

    const tools = {
        combat_knife: ['fuller', 0x71848e, 3], tomahawk_axe: ['spike', 0xa07a52, 3],
        riot_baton: ['bands', 0x6aaaba, 4], machete_jungle: ['fuller', 0x758664, 5],
        crowbar_heavy: ['bands', 0x9d554c, 3], trench_shovel: ['spade', 0x969273, 3],
        katana_carbon: ['bands', 0x9a504c, 7], sledge_hammer: ['spike', 0xd7ae67, 5],
        chainsaw_ripper: ['fuller', 0xc49152, 7], reaper_scythe: ['spike', 0xab8ac3, 4]
    };

    const surface = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.67, metalness: 0.40 });
    const luminous = new THREE.MeshBasicMaterial({ vertexColors: true });
    const cache = new Map();
    const box = new THREE.BoxGeometry(1, 1, 1);
    const chamfer = new THREE.CylinderGeometry(0.5, 0.42, 1, 6, 1);
    const crystal = new THREE.OctahedronGeometry(0.5);
    const ring = new THREE.TorusGeometry(0.5, 0.07, 4, 12);
    const dark = 0x22282a;
    const steel = 0x87918d;

    function detailGroup(key, build) {
        if (!cache.has(key)) {
            const grouped = new Map();
            const quaternion = new THREE.Quaternion();
            const matrix = new THREE.Matrix4();
            const point = new THREE.Vector3();
            const normal = new THREE.Vector3();
            const normalMatrix = new THREE.Matrix3();
            const unit = new THREE.Vector3(1, 1, 1);
            const tint = new THREE.Color();
            const add = (form, color, x, y, z, w, h, l, rx = 0, ry = 0, rz = 0, glow = false) => {
                const mat = glow ? luminous : surface;
                if (!grouped.has(mat)) grouped.set(mat, { vertices: [], normals: [], colors: [] });
                const { vertices, normals, colors } = grouped.get(mat);
                tint.setHex(color);
                const geometry = { box, chamfer, crystal, ring }[form];
                const index = geometry.index;
                const pos = geometry.attributes.position;
                const norm = geometry.attributes.normal;
                quaternion.setFromEuler(new THREE.Euler(rx, ry, rz));
                unit.set(w, h, l);
                matrix.compose(point.set(x, y, z), quaternion, unit);
                normalMatrix.getNormalMatrix(matrix);
                for (let i = 0; i < (index ? index.count : pos.count); i++) {
                    const j = index ? index.getX(i) : i;
                    point.fromBufferAttribute(pos, j).applyMatrix4(matrix);
                    normal.fromBufferAttribute(norm, j).applyNormalMatrix(normalMatrix);
                    vertices.push(point.x, point.y, point.z);
                    normals.push(normal.x, normal.y, normal.z);
                    colors.push(tint.r, tint.g, tint.b);
                }
            };
            build(add);
            const group = new THREE.Group();
            group.name = key;
            for (const [mat, { vertices, normals, colors }] of grouped) {
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
                geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
                geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                group.add(new THREE.Mesh(geometry, mat));
            }
            cache.set(key, group);
        }
        return cache.get(key).clone();
    }

    function firearmDetails(gun, spec, attachments, advancedFinish) {
        const [type, finish, count] = firearms[spec.id];
        const m = spec.modelSpec;
        const fore = m.handguardLen || 0;
        const rec = m.receiverLen;
        const w = m.receiverW;
        const h = m.receiverH;
        const stock = attachments.stock || 'std_stock';
        const color = advancedFinish ? 0x596362 : finish;
        const key = ['armory', spec.id, type, stock, advancedFinish].join('/');
        gun.add(detailGroup(key, (add) => {
            // Side panels sit below the sight line, clear of animated bolts and removable magazines.
            const back = type === 'bullpup' || type === 'drop' ? rec * 0.21 : rec * 0.075;
            const shell = ['slide', 'slab', 'spine', 'drop'].includes(type) ? 'box' : 'chamfer';
            const shellLength = type === 'slab' || type === 'drop' ? 0.72 : type === 'slide' ? 0.66 : 0.55;
            for (const side of [-1, 1]) {
                const x = side * (w * 0.50 + 0.003);
                const angle = type === 'spine' ? side * 0.20 : 0;
                add(shell, color, x, -h * 0.12, back, w * 0.19, h * 0.61, rec * shellLength, angle);
                const start = type === 'slide' ? rec * 0.14 : rec * 0.07;
                for (let i = 0; i < count; i++) {
                    const z = start + i * rec * (type === 'slide' ? 0.29 : 0.25) / count;
                    add('box', dark, x + side * w * 0.10, h * -0.14, z, 0.003, h * 0.26,
                        Math.min(0.005, rec * 0.025), type === 'slide' ? -0.33 : i % 2 ? -0.22 : 0.22);
                }
            }

            const foreZ = -rec * 0.5 - fore * 0.46;
            const foreW = m.handguardW || w;
            const foreH = m.handguardH || h;
            if (type === 'carry' || type === 'spine') {
                for (const side of [-1, 1]) {
                    const x = side * (w * 0.48 + 0.006);
                    add('box', color, x, h * 0.32, -rec * 0.10, 0.016, 0.019, rec * 0.86, -0.12);
                    add('box', steel, x, h * 0.18, rec * 0.28, 0.012, 0.027, rec * 0.16, 0.32);
                }
            } else if (type === 'drop' || type === 'bullpup') {
                add('chamfer', color, 0, -h * 0.40, -rec * 0.20,
                    w * 1.30, h * 0.89, rec * 0.36, 0.29, 0, Math.PI / 2);
                if (type === 'bullpup' && stock !== 'no_stock') {
                    add('box', color, 0, -h * 0.27, rec * 0.36, w * 1.36, h * 0.76, rec * 0.24, -0.15);
                }
            } else if (['pump', 'shroud', 'ribbed', 'helix', 'heatshield', 'stepped'].includes(type) && fore > 0) {
                const radius = Math.max(0.018, foreW * (type === 'helix' ? 0.66 : 0.49));
                for (let i = 0; i < count; i++) {
                    const z = foreZ + fore * ((i + 0.5) / count - 0.5) * 0.77;
                    if (type === 'helix' || type === 'heatshield') {
                        add('chamfer', i % 2 ? color : dark, 0, -foreH * 0.44, z,
                            radius * 2.1, fore / (count + 3), foreH * 1.37, Math.PI / 2, 0, i * 0.18);
                    } else {
                        for (const side of [-1, 1]) {
                            add('box', i % 3 === 0 ? dark : color, side * foreW * 0.52,
                                -0.008, z, 0.011, foreH * 0.29, fore / (count * 2.2),
                                type === 'stepped' ? 0.28 : 0);
                        }
                    }
                }
            } else if (type === 'twin') {
                for (const side of [-1, 1]) {
                    add('chamfer', steel, side * 0.020, h * 0.12, -rec * 0.5 - fore * 0.9 - m.barrelLen * 0.26,
                        0.027, m.barrelLen * 0.61, 0.027, Math.PI * 0.5);
                }
            } else if (type === 'belt' || type === 'lattice' || type === 'drum') {
                for (let i = 0; i < count; i++) {
                    const z = -rec * 0.28 + i * rec * 0.57 / count;
                    const y = type === 'belt' ? -h * 0.34 : -h * 0.35 + (i % 2) * h * 0.20;
                    add('chamfer', i % 2 ? color : steel, -w * 0.57, y, z,
                        0.012, 0.024, 0.012, 0, 0, type === 'lattice' ? 0.50 : 0.22);
                }
            } else if ((type === 'truss' || type === 'cheek' || type === 'wood') && stock !== 'no_stock' && m.stockLen > 0) {
                const stockLength = m.stockLen;
                for (const side of [-1, 1]) {
                    add('box', color, side * 0.017, type === 'cheek' ? 0.018 : -0.027,
                        rec * 0.5 + stockLength * 0.48, 0.012, type === 'wood' ? 0.050 : 0.022,
                        stockLength * 0.77, type === 'truss' ? 0.22 : 0.05);
                }
            } else if (type === 'lever') {
                add('ring', color, 0, -h * 0.80, rec * 0.24, rec * 0.38, h * 0.94, 0.018, 0, Math.PI / 2);
            } else if (type === 'revolver') {
                add('chamfer', color, 0, -h * 0.12, -rec * 0.066, w * 1.62, rec * 0.32, h * 0.95, Math.PI / 2);
            }
        }));
    }

    function specialDetails(result, spec, advancedFinish) {
        const profile = anomalies[spec.id] || tools[spec.id] || firearms[spec.id];
        const [type, color, count] = profile;
        const anchor = result.muzzleAnchor.position;
        const isArcane = spec.kind === 'magic';
        const key = ['armory', spec.id, type, advancedFinish].join('/');
        const parent = type === 'rotary' ? result.boltGroup : result.gun;
        parent.add(detailGroup(key, (add) => {
            if (isArcane) {
                const z = anchor.z + 0.065;
                const y = anchor.y;
                const glow = advancedFinish ? 0xf0a3ef : color;
                for (let i = 0; i < count; i++) {
                    const angle = Math.PI * 2 * i / count;
                    const x = Math.cos(angle);
                    const v = Math.sin(angle);
                    if (type === 'orbit' || type === 'petal') {
                        add(type === 'orbit' ? 'ring' : 'crystal', glow, x * 0.077, y + v * 0.071, z + (i % 2) * 0.025,
                            0.052, 0.065, 0.077, 0.12, 0.24 * x, angle, true);
                    } else if (type === 'coil' || type === 'cascade') {
                        add(type === 'coil' ? 'ring' : 'crystal', glow, x * 0.086, y + v * 0.060,
                            z + 0.015 + 0.024 * i, 0.074, 0.069, 0.059, angle * 0.11, 0, angle, true);
                    } else {
                        const side = i % 2 ? -1 : 1;
                        add(type === 'vessel' ? 'chamfer' : 'box', color,
                            side * (0.069 + (i > 1 ? 0.014 : 0)), y - 0.014 + Math.floor(i / 2) * 0.026,
                            z + 0.021 * i, 0.026, type === 'fork' ? 0.110 : 0.065, 0.031,
                            Math.PI / 2 - i * 0.18, side * 0.15, 0);
                        add('crystal', glow, side * 0.083, y - 0.014 + Math.floor(i / 2) * 0.026,
                            z - 0.022 + 0.021 * i, 0.019, 0.023, 0.024, 0, 0, 0, true);
                    }
                }
            } else if (type === 'rotary') {
                for (let i = 0; i < count; i++) {
                    const angle = 2 * Math.PI * i / count;
                    add('chamfer', color, Math.cos(angle) * 0.046, Math.sin(angle) * 0.046, -0.16,
                        0.022, 0.082, 0.022, Math.PI / 2);
                }
            } else {
                for (let i = 0; i < count; i++) {
                    const z = type === 'bands' ? 0.04 - i * 0.020 : -0.10 - i * 0.027;
                    add(type === 'spike' ? 'crystal' : 'box', color, i % 2 ? -0.020 : 0.020, 0.014, z,
                        type === 'spade' ? 0.080 : 0.029, 0.012, 0.022 + i * 0.002, 0, 0, i % 2 ? -0.16 : 0.16);
                }
                if (type === 'spade') add('chamfer', color, 0, 0, -0.26, 0.11, 0.098, 0.024, Math.PI / 2);
            }
        }));
        return result;
    }

    function hashId(id) {
        let result = 2166136261;
        for (const letter of id) result = Math.imul(result ^ letter.charCodeAt(0), 16777619);
        return result >>> 0;
    }

    function undeadDetails(parts, spec, width, depth) {
        const b = spec.bodySpec || {};
        const id = spec.id || 'default';
        const seed = hashId(id);
        const isArmor = b.torsoShape === 'armored' || spec.isBoss || /panzer|armored|knight|juggernaut/.test(id);
        const spectral = b.floating || b.glowingRibs;
        const color = spectral ? (b.eyeColor || 0x7bbcb4) : [0x9b7049, 0x5e766a, 0xa69a7f, 0x725e59, 0x7a613f][seed % 5];
        if (b.quadruped) {
            parts.bodyPivot.add(detailGroup('undead/harness/' + id, (add) => {
                for (const side of [-1, 1]) {
                    for (let i = 0; i < 3; i++) {
                        const spread = ((seed >>> 9) & 31) * 0.001;
                        add('crystal', color, side * (0.072 + i * 0.011), 0.17 + spread, 0.24 - i * 0.16,
                            0.089 + spread, 0.11 + i * 0.019, 0.095, 0.16, 0, side * 0.35, !!spectral);
                    }
                }
            }));
            return;
        }
        parts.bodyPivot.add(detailGroup('undead/body/' + id, (add) => {
            const side = seed % 2 ? 1 : -1;
            const front = depth * 0.50 + (isArmor ? 0.054 : 0.017);
            const plates = 2 + (seed % 3);
            const fastening = (seed >>> 7) & 7;
            const rise = 0.062 + fastening * 0.004;
            const lean = ((seed >>> 15) & 7) * 0.035;
            for (let i = 0; i < plates; i++) {
                const y = 0.54 - i * rise;
                if (spectral) {
                    add('crystal', color, side * width * 0.25, y, front,
                        0.095, 0.064, 0.055, 0, i * 0.21, side * 0.22, true);
                } else {
                    add(isArmor ? 'chamfer' : 'box', color, side * width * 0.29, y, front,
                        isArmor ? 0.165 : 0.112, 0.059, isArmor ? 0.035 : 0.019, 0, 0, side * (i * 0.14 - lean));
                    if (isArmor) add('box', dark, side * width * 0.34, y + 0.011, front + 0.019, 0.073, 0.011, 0.010);
                }
            }
            if (!spectral && b.torsoShape !== 'bloated') {
                add('box', color, width * -0.25 * side, 0.32, -front, 0.089, 0.30, 0.025, 0, 0, side * 0.24);
            }
        }));
        if (b.headless || !parts.headGroup) return;
        // Face details are children of the existing head, so head damage and animation keep their behavior.
        for (const head of parts.headGroup.children.filter((child) => child.isGroup)) {
            head.add(detailGroup('undead/head/' + id, (add) => {
                const side = seed & 1 ? 1 : -1;
                if (isArmor && !spectral) {
                    add('chamfer', color, side * 0.105, 0.057, 0.061, 0.074, 0.091, 0.081, 0.08, -side * 0.28, side * 0.36);
                    add('box', dark, side * 0.057, 0.105, 0.096, 0.084, 0.025, 0.039, -0.12, side * 0.25);
                } else if (spectral) {
                    add('crystal', color, side * 0.095, 0.089, 0.059, 0.053, 0.127, 0.062, 0.18, 0, -side * 0.22, true);
                } else {
                    add('box', color, side * 0.101, -0.010, 0.075, 0.034, 0.077, 0.015, 0.02, side * 0.48, side * 0.37);
                    add('box', dark, side * 0.106, 0.014, 0.080, 0.027, 0.009, 0.016, 0, side * 0.38);
                }
            }));
        }
    }

    BO.ArsenalDetails = { firearmDetails, specialDetails, undeadDetails };
})(window.BO);
