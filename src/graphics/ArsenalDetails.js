/* ============================================================================
   BLACKOUT OPS — Per-Weapon Unique 3D Silhouettes, Classic Military Detailing
   & Undead Archetype Profiles (CoD4 / MW2 / BO1 Inspired Original Builds)
   Every single one of the 88 weapons gets a distinct look, finish, & silhouette.
============================================================================ */
(function (BO) {
    'use strict';

    // Per-firearm bespoke build profile (all 56 firearms distinctly specified)
    const FIREARM_PROFILES = {
        // --- 12 ASSAULT RIFLES ---
        m4a1: { arch: 'ar_quad', mat: 'gunmetal', bodyHex: 0x262c34, accMat: 'polymer', accHex: 0x8b7b5e, mag: 'stanag', stock: 'crane', extras: ['peq15', 'delta_ring', 'a2_fsb', 'rail_covers'] },
        ak47: { arch: 'ak_classic', mat: 'gunmetal', bodyHex: 0x202328, accMat: 'walnut', accHex: 0x8a4522, mag: 'banana_steel', stock: 'wood_ak', suppressGas: true, extras: ['ak_gas45', 'ak_hood_fsb', 'ak_selector', 'ak_cleaning_rod'] },
        scarh: { arch: 'scar_mono', mat: 'cerakote', bodyHex: 0x9f8b67, accMat: 'polymer', accHex: 0x2c2822, mag: 'scar_762', stock: 'scar_boot', suppressHandguard: true, extras: ['scar_upper', 'scar_cheek', 'triple_prong', 'scar_gas'] },
        m16a4: { arch: 'm16_long', mat: 'gunmetal', bodyHex: 0x222830, accMat: 'polymer', accHex: 0x16191e, mag: 'stanag', stock: 'm16_fixed', extras: ['a2_carry_arch', 'a2_fsb', 'ribbed_long_hg'] },
        famas_f1: { arch: 'famas_bp', mat: 'cerakote', bodyHex: 0x2e333b, accMat: 'polymer', accHex: 0x1b1e23, mag: 'stanag_rear', stock: 'bullpup_butt', suppressGas: true, suppressMagwell: true, extras: ['famas_bridge', 'famas_bipod', 'famas_cheek'] },
        galil_ar: { arch: 'galil_heavy', mat: 'gunmetal', bodyHex: 0x353b42, accMat: 'walnut', accHex: 0x5c3c22, mag: 'galil_35', stock: 'galil_folder', extras: ['galil_handle', 'galil_bipod', 'galil_vents', 'ak_hood_fsb'] },
        acr_68: { arch: 'acr_mono', mat: 'cerakote', bodyHex: 0x8a806c, accMat: 'cerakote', accHex: 0x3a3e46, mag: 'pmag_tan', stock: 'acr_folder', suppressHandguard: true, extras: ['acr_trapezoid', 'acr_upper_cut', 'acr_latch'] },
        aug_hbars: { arch: 'aug_bp', mat: 'cerakote', bodyHex: 0x4b583f, accMat: 'polymer', accHex: 0x20261e, mag: 'waffle_rear', stock: 'bullpup_butt', suppressGas: true, suppressMagwell: true, suppressHandguard: true, extras: ['aug_tulip', 'aug_vfg', 'aug_winter_guard', 'aug_slope'] },
        g36c_tac: { arch: 'g36_rail', mat: 'cerakote', bodyHex: 0x2a2f38, accMat: 'polymer', accHex: 0x171a20, mag: 'coupled_clear', stock: 'g36_skel', extras: ['g36_toprail', 'g36_vents', 'g36_latch'] },
        an94_abakan: { arch: 'an94_canted', mat: 'gunmetal', bodyHex: 0x262932, accMat: 'bakelite', accHex: 0x6f3126, mag: 'canted_bakelite', stock: 'g36_skel', suppressGas: true, extras: ['an94_pulley', 'an94_brake8', 'plum_hg'] },
        fal_osw: { arch: 'fal_battle', mat: 'gunmetal', bodyHex: 0x2b3038, accMat: 'walnut', accHex: 0x694529, mag: 'fal_20', stock: 'para_folder', extras: ['fal_side_handle', 'fal_long_hg', 'fal_slot_fh'] },
        xm8_storm: { arch: 'xm8_shell', mat: 'cerakote', bodyHex: 0x5d6772, accMat: 'polymer', accHex: 0x22262e, mag: 'stanag', stock: 'scar_boot', suppressHandguard: true, suppressGas: true, extras: ['xm8_carapace', 'xm8_arch', 'xm8_ovals'] },

        // --- 10 SUBMACHINE GUNS ---
        mp5: { arch: 'mp5_hk', mat: 'gunmetal', bodyHex: 0x1f242c, accMat: 'polymer', accHex: 0x14171d, mag: 'mp5_curved', stock: 'mp5_wire', suppressGas: true, extras: ['mp5_cocking_tube', 'mp5_hood', 'mp5_tri_hg'] },
        p90: { arch: 'p90_pdw', mat: 'cerakote', bodyHex: 0x353c46, accMat: 'polymer', accHex: 0x1b2028, mag: 'p90_top', stock: 'bullpup_butt', suppressGas: true, suppressHandguard: true, suppressMagwell: true, extras: ['p90_thumbhole', 'p90_rounds', 'p90_arch'] },
        ump45: { arch: 'ump_box', mat: 'cerakote', bodyHex: 0x242830, accMat: 'polymer', accHex: 0x16191f, mag: 'stick_45', stock: 'g36_skel', suppressGas: true, extras: ['ump_tall_rec', 'ump_vents', 'ump_sights'] },
        mp7_navy: { arch: 'mp7_pdw', mat: 'cerakote', bodyHex: 0x323945, accMat: 'polymer', accHex: 0x181c22, mag: 'grip_mag', stock: 'mp5_wire', suppressGas: true, suppressHandguard: true, suppressMagwell: true, extras: ['mp7_vfg', 'mp7_rails', 'mp7_nose'] },
        vector_kriss: { arch: 'vector_v', mat: 'cerakote', bodyHex: 0x3b414c, accMat: 'cerakote', accHex: 0x877758, mag: 'vector_canted', stock: 'vector_folder', suppressGas: true, suppressHandguard: true, extras: ['vector_v_drop', 'vector_low_bore', 'vector_shroud'] },
        aks74u: { arch: 'krinkov', mat: 'gunmetal', bodyHex: 0x24282f, accMat: 'bakelite', accHex: 0xa6461c, mag: 'bakelite_curved', stock: 'krink_tri', suppressGas: true, extras: ['krink_booster', 'krink_wood_stub', 'ak_gas45'] },
        mac10_uzi: { arch: 'mac10_box', mat: 'gunmetal', bodyHex: 0x383e46, accMat: 'polymer', accHex: 0x181b20, mag: 'grip_mag', stock: 'mac_wire', suppressGas: true, suppressHandguard: true, suppressMagwell: true, extras: ['mac_cock_knob', 'mac_strap', 'mac_stamped'] },
        pp19_bizon: { arch: 'bizon_helix', mat: 'gunmetal', bodyHex: 0x262b33, accMat: 'polymer', accHex: 0x16191f, mag: 'bizon_cylinder', stock: 'krink_tri', suppressGas: true, suppressMagwell: true, extras: ['bizon_ribbed_drum', 'ak_hood_fsb', 'ak_selector'] },
        thompson_m1: { arch: 'thompson_ww2', mat: 'brushed', bodyHex: 0x333840, accMat: 'walnut', accHex: 0x6f401d, mag: 'thompson_stick', stock: 'thompson_wood', suppressGas: true, suppressHandguard: true, extras: ['tommy_fins', 'tommy_cutts', 'tommy_rib_hg', 'tommy_knob'] },
        scorpion_evo: { arch: 'evo_cqb', mat: 'cerakote', bodyHex: 0x454d58, accMat: 'polymer', accHex: 0x20242c, mag: 'mp5_curved', stock: 'scar_boot', suppressGas: true, extras: ['evo_slant_well', 'evo_vents', 'evo_rib_rec'] },

        // --- 9 SHOTGUNS ---
        r870: { arch: 'pump_870', mat: 'gunmetal', bodyHex: 0x252a32, accMat: 'walnut', accHex: 0x6d4120, mag: 'tube_shell', stock: 'shotgun_grip', suppressGas: true, suppressMagwell: true, extras: ['pump_ribbing', 'side_saddle_6', 'bead_rib'] },
        m1014_cod4: { arch: 'benelli_m4', mat: 'cerakote', bodyHex: 0x232830, accMat: 'polymer', accHex: 0x171b22, mag: 'tube_shell', stock: 'crane', suppressGas: true, suppressMagwell: true, extras: ['m1014_split_hg', 'side_saddle_6', 'ghost_ring'] },
        model_1887_mw2: { arch: 'lever_1887', mat: 'brushed', bodyHex: 0x525864, accMat: 'walnut', accHex: 0x764522, mag: 'tube_shell', stock: 'thompson_wood', suppressGas: true, suppressHandguard: true, suppressMagwell: true, extras: ['lever_loop', 'lever_brass_plate', 'lever_forend'] },
        aa12: { arch: 'aa12_clamshell', mat: 'cerakote', bodyHex: 0x454d58, accMat: 'polymer', accHex: 0x20242c, mag: 'drum_20', stock: 'm16_fixed', suppressGas: true, suppressHandguard: true, extras: ['aa12_slab', 'aa12_carry', 'aa12_vents'] },
        spas12_tac: { arch: 'spas12_hook', mat: 'perforated', bodyHex: 0x242830, accMat: 'polymer', accHex: 0x16191f, mag: 'tube_shell', stock: 'spas_hook', suppressGas: true, suppressMagwell: true, extras: ['spas_heatshield', 'spas_over_hook', 'pump_ribbing'] },
        ksg_slug: { arch: 'ksg_dual', mat: 'cerakote', bodyHex: 0x363d48, accMat: 'polymer', accHex: 0x181c22, mag: 'tube_shell', stock: 'bullpup_butt', suppressGas: true, suppressHandguard: true, suppressMagwell: true, extras: ['ksg_twin_tubes', 'ksg_box_shell', 'ksg_vfg'] },
        saiga12_k: { arch: 'saiga_ak', mat: 'gunmetal', bodyHex: 0x272c34, accMat: 'polymer', accHex: 0x171a20, mag: 'saiga_box', stock: 'wood_ak', suppressGas: true, extras: ['saiga_rib_hg', 'ak_selector', 'ak_gas45'] },
        double_barrel: { arch: 'double_coach', mat: 'brushed', bodyHex: 0x3b424c, accMat: 'walnut', accHex: 0x75421d },
        striker_12: { arch: 'striker_drum', mat: 'perforated', bodyHex: 0x2c323b, accMat: 'polymer', accHex: 0x181c22, mag: 'striker_cyl', stock: 'mp5_wire', suppressGas: true, suppressMagwell: true, extras: ['striker_clock_drum', 'striker_vfg', 'striker_shroud'] },

        // --- 8 LIGHT MACHINE GUNS ---
        m249: { arch: 'saw_249', mat: 'cerakote', bodyHex: 0x2c333b, accMat: 'cerakote', accHex: 0x455336, mag: 'box_belt', stock: 'saw_para', suppressGas: true, extras: ['brass_belt', 'saw_heatshield', 'saw_carry', 'bipod_folded'] },
        rpd: { arch: 'rpd_drum', mat: 'gunmetal', bodyHex: 0x23272e, accMat: 'walnut', accHex: 0x7a4724, mag: 'drum_belt', stock: 'wood_ak', extras: ['brass_belt', 'ak_hood_fsb', 'rpd_handguard', 'bipod_folded'] },
        pkp_pecheneg: { arch: 'pkp_heavy', mat: 'gunmetal', bodyHex: 0x2d3238, accMat: 'cerakote', accHex: 0x3d4838, mag: 'box_belt', stock: 'pkp_cutout', extras: ['brass_belt', 'pkp_air_jacket', 'pkp_handle', 'bipod_folded'] },
        mg42_buzzsaw: { arch: 'mg42_perf', mat: 'perforated', bodyHex: 0x31363d, accMat: 'walnut', accHex: 0x5c3a1f, mag: 'drum_belt', stock: 'mg42_teardrop', suppressGas: true, suppressHandguard: true, extras: ['brass_belt', 'mg42_shroud', 'mg42_booster', 'mg42_aa_sight', 'bipod_folded'] },
        lsat_heavy: { arch: 'lsat_caseless', mat: 'cerakote', bodyHex: 0x4e5764, accMat: 'polymer', accHex: 0x1d222a, mag: 'box_belt', stock: 'crane', extras: ['lsat_feed_tray', 'lsat_quad', 'bipod_folded'] },
        steyr_aug_lmg: { arch: 'aug_hbar', mat: 'cerakote', bodyHex: 0x4b583e, accMat: 'polymer', accHex: 0x1c2118, mag: 'waffle_rear', stock: 'bullpup_butt', suppressGas: true, suppressMagwell: true, suppressHandguard: true, extras: ['aug_slope', 'aug_winter_guard', 'aug_bipod_long', 'aug_tulip'] },
        m60e4_pig: { arch: 'm60_pig', mat: 'gunmetal', bodyHex: 0x272b32, accMat: 'polymer', accHex: 0x16191e, mag: 'box_belt', stock: 'm60_heavy', suppressGas: true, suppressHandguard: true, extras: ['brass_belt', 'm60_tall_fsb', 'm60_rubber_hg', 'm60_gas_cyl', 'bipod_folded'] },
        minigun_death: { arch: 'minigun', mat: 'gunmetal', bodyHex: 0x262b33, accMat: 'polymer', accHex: 0x475569 },

        // --- 9 SNIPER & MARKSMAN RIFLES ---
        m40a3_cod4: { arch: 'm40_usmc', mat: 'cerakote', bodyHex: 0x415b38, accMat: 'cerakote', accHex: 0x2e4128, mag: 'flush_bolt', stock: 'mcmillan', suppressGas: true, suppressMagwell: true, extras: ['bolt_knob', 'mcmillan_cheek', 'bull_barrel', 'bipod_folded'] },
        r700_cod4: { arch: 'r700_sport', mat: 'brushed', bodyHex: 0x22262e, accMat: 'walnut', accHex: 0x5c361a, mag: 'flush_bolt', stock: 'r700_sport', suppressGas: true, suppressMagwell: true, extras: ['bolt_knob_chrome', 'r700_wood_bed', 'tapered_barrel'] },
        intervention: { arch: 'm200_cheytac', mat: 'perforated', bodyHex: 0x3b414a, accMat: 'cerakote', accHex: 0x252a32, mag: 'sniper_mag', stock: 'm200_skel', suppressGas: true, suppressHandguard: true, extras: ['m200_tubular_hg', 'm200_carry', 'm200_tank_brake', 'm200_monopod', 'bolt_knob', 'bipod_folded'] },
        mk14: { arch: 'ebr_chassis', mat: 'brushed', bodyHex: 0x4f5661, accMat: 'polymer', accHex: 0x1d2128, mag: 'scar_762', stock: 'ebr_rod', extras: ['ebr_oprod', 'ebr_chassis', 'ebr_cheek', 'bipod_folded'] },
        barrett_50cal: { arch: 'barrett_50', mat: 'gunmetal', bodyHex: 0x2e333c, accMat: 'polymer', accHex: 0x171a20, mag: 'barrett_mag', stock: 'barrett_heavy', suppressGas: true, extras: ['barrett_wedge_brake', 'barrett_carry', 'barrett_flutes', 'bipod_folded'] },
        l96a1_awm: { arch: 'l96_aw', mat: 'cerakote', bodyHex: 0x405f3e, accMat: 'polymer', accHex: 0x1b2419, mag: 'sniper_mag', stock: 'l96_thumb', suppressGas: true, extras: ['l96_chassis', 'l96_brake', 'bolt_knob', 'bipod_folded'] },
        dragunov_svd: { arch: 'svd_soviet', mat: 'gunmetal', bodyHex: 0x272b32, accMat: 'walnut', accHex: 0x804721, mag: 'svd_10', stock: 'svd_thumb', extras: ['svd_slotted_hg', 'svd_cheek_pad', 'svd_flash_hider'] },
        msr_remington: { arch: 'msr_tan', mat: 'cerakote', bodyHex: 0x948263, accMat: 'cerakote', accHex: 0x6b5d44, mag: 'sniper_mag', stock: 'msr_folder', suppressGas: true, suppressHandguard: true, extras: ['msr_octa_hg', 'msr_brake', 'bolt_knob', 'bipod_folded'] },
        kar98k_irons: { arch: 'kar98_mauser', mat: 'gunmetal', bodyHex: 0x2c3038, accMat: 'walnut', accHex: 0x72421e, mag: 'flush_bolt', stock: 'kar98_wood', suppressGas: true, suppressHandguard: true, suppressMagwell: true, extras: ['kar_full_wood', 'kar_bands', 'kar_bolt_bent', 'kar_rod'] },

        // --- 8 PISTOLS & LAUNCHER ---
        m1911: { arch: 'colt_1911', mat: 'brushed', bodyHex: 0x353b46, accMat: 'walnut', accHex: 0x6a3c1d, mag: 'pistol_std', extras: ['pistol_beavertail', 'pistol_walnut_panels'] },
        deagle: { arch: 'deagle_50', mat: 'brushed', bodyHex: 0xc2cbd4, accMat: 'polymer', accHex: 0x191d24, mag: 'pistol_deagle', extras: ['deagle_bevel', 'deagle_rib', 'deagle_vents'] },
        gold_deagle_cod4: { arch: 'deagle_gold', mat: 'gold', bodyHex: 0xfacc15, accMat: 'polymer', accHex: 0x16191f, mag: 'pistol_deagle', extras: ['deagle_bevel', 'deagle_rib', 'deagle_vents'] },
        glock18_auto: { arch: 'glock_18', mat: 'cerakote', bodyHex: 0x22262e, accMat: 'polymer', accHex: 0x14171c, mag: 'pistol_ext', extras: ['glock_box_slide', 'glock_selector', 'glock_rail'] },
        b23r_burst: { arch: 'b23r_tac', mat: 'cerakote', bodyHex: 0x303742, accMat: 'polymer', accHex: 0x191e26, mag: 'pistol_ext', extras: ['b23r_ports', 'b23r_guard_loop', 'b23r_bumper'] },
        python_magnum: { arch: 'revolver_357', mat: 'brushed', bodyHex: 0xd0d8e0, accMat: 'walnut', accHex: 0x70411e },
        five_seven: { arch: 'fn_57', mat: 'cerakote', bodyHex: 0x2a313a, accMat: 'cerakote', accHex: 0x5c646e, mag: 'pistol_std', extras: ['fn57_shroud', 'fn57_controls'] },
        rpg7_warhead: { arch: 'rpg7', mat: 'gunmetal', bodyHex: 0x3e4736, accMat: 'walnut', accHex: 0x754522 }
    };

    const ANOMALIES = {
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

    const TOOLS = {
        combat_knife: ['fuller', 0xcbd5e1, 3], tomahawk_axe: ['spike', 0xa07a52, 3],
        riot_baton: ['bands', 0x38bdf8, 4], machete_jungle: ['sawback', 0x94a3b8, 5],
        crowbar_heavy: ['bands', 0xdc2626, 3], trench_shovel: ['spade', 0x64748b, 3],
        katana_carbon: ['tsuba', 0xef4444, 7], sledge_hammer: ['maul', 0xf59e0b, 5],
        chainsaw_ripper: ['motor', 0xeab308, 7], reaper_scythe: ['crescent', 0xc084fc, 4]
    };

    const cache = new Map();
    const box = new THREE.BoxGeometry(1, 1, 1);
    const chamfer = new THREE.CylinderGeometry(0.5, 0.42, 1, 8, 1);
    const crystal = new THREE.OctahedronGeometry(0.5);
    const ring = new THREE.TorusGeometry(0.5, 0.08, 6, 14);
    const dark = 0x1a1f24;
    const steel = 0x87918d;
    const brass = 0xd4a437;

    let sharedSurface = null;
    let sharedLuminous = null;
    function getSurfaceMat() {
        if (!sharedSurface) sharedSurface = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.56, metalness: 0.48 });
        return sharedSurface;
    }
    function getLuminousMat() {
        if (!sharedLuminous) sharedLuminous = new THREE.MeshBasicMaterial({ vertexColors: true });
        return sharedLuminous;
    }

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
                const mat = glow ? getLuminousMat() : getSurfaceMat();
                if (!grouped.has(mat)) grouped.set(mat, { vertices: [], normals: [], colors: [] });
                const { vertices, normals, colors } = grouped.get(mat);
                tint.setHex(color);
                const geometry = { box, chamfer, crystal, ring }[form] || box;
                const index = geometry.index;
                const pos = geometry.attributes.position;
                const norm = geometry.attributes.normal;
                quaternion.setFromEuler(new THREE.Euler(rx, ry, rz));
                unit.set(w, h, l);
                matrix.compose(point.set(x, y, z), quaternion, unit);
                normalMatrix.getNormalMatrix(matrix);
                const count = index ? index.count : pos.count;
                for (let i = 0; i < count; i++) {
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

    function getFirearmProfile(id) {
        return FIREARM_PROFILES[id] || { arch: 'standard', mat: 'gunmetal', bodyHex: 0x2a2f38, accMat: 'polymer', accHex: 0x171a20, mag: 'stanag', stock: 'crane', extras: [] };
    }

    function firearmDetails(gun, spec, attachments, advancedFinish) {
        const profile = getFirearmProfile(spec.id);
        const m = spec.modelSpec;
        const fore = m.handguardLen || 0;
        const rec = m.receiverLen;
        const w = m.receiverW;
        const h = m.receiverH;
        const foreW = m.handguardW || w;
        const foreH = m.handguardH || h;
        const stockChoice = attachments.stock || 'std_stock';
        const hasStock = stockChoice !== 'no_stock' && m.stockStyle !== 'none';
        const color = advancedFinish ? 0x596362 : (profile.bodyHex || 0x424e53);
        const acc = profile.accHex || 0x2b2f36;
        const wood = 0x70411e;
        const bakelite = 0xa3431c;
        const foreZ = -rec * 0.5 - fore * 0.48;
        const muzStart = m.isPistol ? -rec * 0.5 : (-rec * 0.5 - fore * 0.82);
        const barrelTip = muzStart - m.barrelLen;
        const key = ['armory2', spec.id, profile.arch, stockChoice, attachments.optic || 'iron', advancedFinish].join('/');

        gun.add(detailGroup(key, (add) => {
            const extras = new Set(profile.extras || []);

            // --- Unique Forends, Receivers, Bridges & Hoods ---
            if (extras.has('peq15')) {
                add('box', 0x7f7055, w * 0.54, 0.008, foreZ - fore * 0.14, 0.024, 0.022, 0.072);
                add('crystal', 0xef4444, w * 0.62, 0.008, foreZ - fore * 0.25, 0.008, 0.008, 0.010, 0, 0, 0, true);
            }
            if (extras.has('delta_ring')) {
                add('chamfer', steel, 0, 0.004, -rec * 0.50, foreW * 1.16, 0.018, foreH * 1.12, Math.PI / 2);
            }
            if (extras.has('rail_covers')) {
                for (const s of [-1, 1]) add('box', acc, s * (foreW * 0.55), 0.004, foreZ, 0.011, foreH * 0.42, fore * 0.72);
            }
            if (extras.has('a2_fsb')) {
                add('box', dark, 0, h * 0.55, barrelTip + 0.055, 0.012, 0.036, 0.028, 0.25);
            }
            if (extras.has('a2_carry_arch') && (!attachments.optic || attachments.optic === 'iron')) {
                add('box', color, -0.011, h * 0.64, 0, 0.008, 0.024, rec * 0.72);
                add('box', color, 0.011, h * 0.64, 0, 0.008, 0.024, rec * 0.72);
                add('box', dark, 0, h * 0.78, 0, 0.026, 0.008, rec * 0.62);
            }
            if (extras.has('ribbed_long_hg')) {
                for (let i = 0; i < 8; i++) {
                    add('chamfer', dark, 0, 0.002, foreZ + (i - 3.5) * (fore / 8.5), foreW * 1.15, 0.010, foreH * 1.12, Math.PI / 2);
                }
            }
            if (extras.has('ak_gas45')) {
                add('box', dark, 0, h * 0.42, barrelTip + m.barrelLen * 0.42, 0.016, 0.032, 0.026, -0.58);
                add('chamfer', acc, 0, h * 0.30, foreZ, foreW * 0.78, fore * 0.86, foreH * 0.58, Math.PI / 2);
            }
            if (extras.has('ak_hood_fsb')) {
                add('ring', dark, 0, h * 0.44, barrelTip + 0.032, 0.022, 0.024, 0.012);
                add('box', steel, 0, h * 0.28, barrelTip + 0.032, 0.010, 0.026, 0.014);
            }
            if (extras.has('ak_selector')) {
                add('box', steel, w * 0.54, -h * 0.05, rec * 0.14, 0.004, 0.016, rec * 0.42, -0.18);
            }
            if (extras.has('ak_cleaning_rod')) {
                add('chamfer', steel, 0, -h * 0.16, barrelTip + m.barrelLen * 0.55, 0.006, m.barrelLen * 0.9, 0.006, Math.PI / 2);
            }
            if (extras.has('scar_upper')) {
                add('box', color, 0, h * 0.14, -rec * 0.30, w * 1.12, h * 1.04, rec * 1.28);
                for (const s of [-1, 1]) add('box', dark, s * w * 0.59, -0.006, foreZ, 0.008, 0.014, fore * 0.85);
            }
            if (extras.has('triple_prong')) {
                for (let p = 0; p < 3; p++) {
                    const a = p * Math.PI * 2 / 3;
                    add('box', steel, Math.cos(a) * 0.011, h * 0.12 + Math.sin(a) * 0.011, barrelTip - 0.02, 0.004, 0.004, 0.036);
                }
            }
            if (extras.has('famas_bridge')) {
                add('box', color, 0, h * 0.58, -rec * 0.12, w * 0.65, 0.026, rec * 1.25);
                add('box', dark, 0, h * 0.48, -rec * 0.15, 0.010, 0.016, 0.045);
            }
            if (extras.has('famas_bipod') || extras.has('galil_bipod') || extras.has('bipod_folded')) {
                const bz = extras.has('famas_bipod') ? -rec * 0.35 : (foreZ - fore * 0.35);
                const by = extras.has('famas_bipod') ? h * 0.35 : -foreH * 0.55;
                for (const s of [-1, 1]) {
                    add('chamfer', steel, s * (foreW * 0.56 + 0.01), by, bz, 0.010, 0.15, 0.010, Math.PI / 2);
                }
            }
            if (extras.has('galil_handle')) {
                add('box', steel, w * 0.58, h * 0.38, -0.02, 0.016, 0.026, 0.014, 0, 0, -0.35);
            }
            if (extras.has('galil_vents') || extras.has('g36_vents') || extras.has('evo_vents')) {
                for (let v = 0; v < 4; v++) {
                    const vz = foreZ - fore * 0.34 + v * (fore * 0.22);
                    for (const s of [-1, 1]) add('box', dark, s * (foreW * 0.54), 0.002, vz, 0.004, foreH * 0.42, 0.018);
                }
            }
            if (extras.has('acr_trapezoid')) {
                add('box', color, 0, 0.004, foreZ, foreW * 1.18, foreH * 1.05, fore * 1.02);
                add('box', acc, 0, h * 0.32, -rec * 0.08, w * 1.08, h * 0.44, rec * 0.92);
            }
            if (extras.has('aug_slope')) {
                add('box', color, 0, -0.004, 0.02, w * 1.14, h * 1.08, rec * 1.38);
                add('box', color, 0, h * 0.46, -0.06, w * 0.62, 0.024, rec * 0.72);
            }
            if (extras.has('aug_winter_guard')) {
                add('box', color, 0, -h * 0.52, rec * 0.02, 0.016, 0.084, 0.014, 0.25);
                add('box', color, 0, -h * 0.92, rec * 0.14, 0.016, 0.014, 0.13);
            }
            if (extras.has('aug_vfg') || extras.has('mp7_vfg') || extras.has('striker_vfg') || extras.has('ksg_vfg')) {
                add('chamfer', acc, 0, -foreH * 0.76, foreZ - 0.02, 0.024, 0.078, 0.024, 0.12);
            }
            if (extras.has('aug_tulip')) {
                add('chamfer', dark, 0, h * 0.11, barrelTip - 0.018, 0.024, 0.042, 0.024, Math.PI / 2);
            }
            if (extras.has('g36_toprail')) {
                add('box', color, 0, h * 0.58, -rec * 0.04, w * 0.66, 0.022, rec * 1.04);
                add('box', dark, 0, h * 0.48, -rec * 0.28, 0.016, 0.026, 0.026);
            }
            if (extras.has('an94_pulley')) {
                add('box', dark, w * 0.42, h * 0.16, foreZ - 0.03, 0.018, 0.024, fore * 0.88);
                add('chamfer', acc, 0, 0.002, foreZ, foreW * 1.12, fore * 0.95, foreH * 1.04, Math.PI / 2);
                add('box', steel, 0, h * 0.12, barrelTip - 0.014, 0.024, 0.030, 0.030);
            }
            if (extras.has('fal_side_handle')) {
                add('box', dark, -w * 0.56, 0.018, -rec * 0.25, 0.012, 0.042, 0.012, 0, 0, 0.42);
                add('chamfer', acc, 0, 0.004, foreZ, foreW * 1.06, fore * 1.02, foreH * 0.92, Math.PI / 2);
            }
            if (extras.has('xm8_carapace')) {
                add('chamfer', color, 0, 0.008, -rec * 0.18, w * 1.24, rec * 1.56, h * 1.22, Math.PI / 2);
                add('box', acc, 0, h * 0.50, -rec * 0.14, w * 0.68, 0.024, rec * 0.80);
            }

            // --- Unique SMG Details ---
            if (extras.has('mp5_cocking_tube')) {
                add('chamfer', color, 0, h * 0.36, foreZ - 0.02, 0.026, fore * 1.05, 0.026, Math.PI / 2);
                add('box', steel, -0.018, h * 0.42, foreZ - fore * 0.36, 0.022, 0.008, 0.010, 0, 0, 0.45);
                add('ring', dark, 0, h * 0.44, foreZ - fore * 0.46, 0.024, 0.024, 0.012);
                add('chamfer', acc, 0, -0.006, foreZ, foreW * 1.18, fore * 0.90, foreH * 0.96, Math.PI / 2);
            }
            if (extras.has('p90_thumbhole')) {
                add('box', color, 0, -0.006, 0.02, w * 1.22, h * 1.24, rec * 1.25);
                add('box', acc, 0, -h * 0.50, -rec * 0.24, w * 0.72, 0.088, 0.042, -0.35);
                add('box', dark, 0, h * 0.56, -rec * 0.26, w * 0.56, 0.022, rec * 0.45);
                // Translucent amber rounds in horizontal top magazine
                add('box', 0x452b12, 0, h * 0.62, -0.03, w * 0.92, 0.026, rec * 0.88);
                for (let r = 0; r < 8; r++) add('box', brass, (r % 2 ? 0.008 : -0.008), h * 0.62, -rec * 0.34 + r * 0.025, 0.012, 0.014, 0.008);
            }
            if (extras.has('ump_tall_rec')) {
                add('box', color, 0, 0.006, -0.04, w * 1.15, h * 1.18, rec * 1.06);
                add('box', dark, 0, -h * 0.48, -0.04, w * 0.95, 0.042, 0.068);
            }
            if (extras.has('mp7_nose')) {
                add('box', color, 0, 0.004, -0.03, w * 1.10, h * 1.05, rec * 1.12);
                add('box', dark, 0, -h * 0.20, -rec * 0.56, w * 0.95, h * 0.62, 0.072);
            }
            if (extras.has('vector_v_drop')) {
                add('box', color, 0, -h * 0.45, -rec * 0.20, w * 1.14, h * 1.32, rec * 0.56, 0.16);
                add('box', acc, 0, 0.012, -rec * 0.18, w * 1.16, h * 0.72, rec * 1.16);
                add('box', dark, 0, -h * 0.52, -rec * 0.48, w * 0.92, h * 0.58, 0.095);
            }
            if (extras.has('krink_booster')) {
                add('chamfer', dark, 0, h * 0.11, barrelTip - 0.018, 0.034, 0.046, 0.034, Math.PI / 2);
                add('chamfer', wood, 0, 0.002, foreZ, foreW * 1.18, fore * 0.92, foreH * 1.14, Math.PI / 2);
            }
            if (extras.has('mac_stamped')) {
                add('box', color, 0, 0.006, -0.02, w * 1.16, h * 1.12, rec * 1.08);
                add('chamfer', steel, 0, h * 0.62, 0.02, 0.024, 0.020, 0.024);
                add('box', acc, 0, -h * 0.40, -rec * 0.48, 0.018, 0.055, 0.008);
            }
            if (extras.has('bizon_ribbed_drum')) {
                add('chamfer', dark, 0, -h * 0.46, foreZ - 0.02, 0.056, fore * 1.08, 0.056, Math.PI / 2);
                for (let b = 0; b < 6; b++) {
                    add('ring', steel, 0, -h * 0.46, foreZ - fore * 0.42 + b * (fore * 0.16), 0.056, 0.056, 0.008);
                }
            }
            if (extras.has('tommy_fins')) {
                add('box', color, 0, 0.004, 0, w * 1.12, h * 1.08, rec);
                add('box', wood, 0, -0.012, foreZ, foreW * 1.12, foreH * 0.96, fore * 0.95);
                for (let f = 0; f < 7; f++) {
                    add('chamfer', steel, 0, h * 0.12, muzStart - 0.025 - f * 0.016, 0.028, 0.006, 0.028, Math.PI / 2);
                }
                add('chamfer', dark, 0, h * 0.12, barrelTip - 0.015, 0.024, 0.036, 0.024, Math.PI / 2);
                add('chamfer', steel, 0, h * 0.56, 0.02, 0.016, 0.016, 0.016);
            }
            if (extras.has('evo_slant_well')) {
                add('box', acc, 0, -h * 0.48, -rec * 0.24, w * 1.06, 0.056, 0.068, -0.35);
                add('box', color, 0, 0.014, -0.04, w * 1.12, h * 1.04, rec * 1.14);
            }

            // --- Unique Shotgun Details ---
            if (extras.has('pump_ribbing')) {
                add('chamfer', acc, 0, -0.014, foreZ, foreW * 1.32, fore * 0.88, foreH * 1.18, Math.PI / 2);
                for (let r = 0; r < 6; r++) {
                    add('ring', dark, 0, -0.014, foreZ - fore * 0.34 + r * (fore * 0.13), foreW * 0.68, foreW * 0.68, 0.010);
                }
            }
            if (extras.has('side_saddle_6')) {
                add('box', dark, -w * 0.54, 0.002, -0.02, 0.012, 0.038, 0.135);
                for (let sh = 0; sh < 5; sh++) {
                    add('chamfer', 0xb91c1c, -w * 0.58, 0.002, -0.065 + sh * 0.026, 0.014, 0.036, 0.014);
                    add('box', brass, -w * 0.58, -0.016, -0.065 + sh * 0.026, 0.014, 0.008, 0.014);
                }
            }
            if (extras.has('m1014_split_hg')) {
                add('box', acc, 0, -0.006, foreZ, foreW * 1.24, foreH * 1.15, fore * 0.92);
                add('box', steel, 0, h * 0.56, rec * 0.28, 0.022, 0.018, 0.018);
            }
            if (extras.has('lever_loop')) {
                add('box', brass, 0, -0.002, 0.01, w * 1.10, h * 0.96, rec * 0.72);
                add('ring', steel, 0, -h * 0.82, rec * 0.24, 0.022, 0.072, 0.115, 0, Math.PI / 2);
                add('box', wood, 0, -0.010, foreZ, foreW * 1.14, foreH * 0.88, fore * 0.88);
            }
            if (extras.has('aa12_slab')) {
                add('box', color, 0, 0.010, -rec * 0.14, w * 1.28, h * 1.28, rec * 1.52);
                add('box', dark, 0, h * 0.68, -rec * 0.12, w * 0.70, 0.020, rec * 1.10);
            }
            if (extras.has('spas_heatshield')) {
                add('chamfer', color, 0, 0.010, foreZ - 0.02, foreW * 1.28, fore * 1.18, foreH * 1.12, Math.PI / 2);
            }
            if (extras.has('spas_over_hook')) {
                // Signature SPAS-12 folded over-top metal hook stock!
                add('box', steel, -w * 0.42, h * 0.62, rec * 0.08, 0.008, 0.010, rec * 0.88);
                add('box', steel, w * 0.42, h * 0.62, rec * 0.08, 0.008, 0.010, rec * 0.88);
                add('box', dark, 0, h * 0.66, -rec * 0.28, w * 0.92, 0.012, 0.024);
                add('box', steel, 0, h * 0.72, -rec * 0.34, 0.022, 0.028, 0.044, -0.45);
            }
            if (extras.has('ksg_twin_tubes')) {
                add('box', color, 0, 0.004, -rec * 0.16, w * 1.24, h * 1.18, rec * 1.44);
                for (const s of [-1, 1]) {
                    add('chamfer', dark, s * 0.016, -h * 0.22, barrelTip + m.barrelLen * 0.45, 0.020, m.barrelLen * 0.90, 0.020, Math.PI / 2);
                }
            }
            if (extras.has('saiga_rib_hg')) {
                add('box', acc, 0, -0.002, foreZ, foreW * 1.26, foreH * 1.08, fore * 0.95);
            }
            if (extras.has('striker_clock_drum')) {
                add('chamfer', dark, 0, -h * 0.56, -0.02, 0.125, 0.068, 0.125, Math.PI / 2);
                add('chamfer', color, 0, 0.010, foreZ, foreW * 1.18, fore * 1.04, foreH * 1.08, Math.PI / 2);
            }

            // --- Unique LMG Details ---
            if (extras.has('brass_belt')) {
                for (let c = 0; c < 6; c++) {
                    add('chamfer', brass, -w * 0.62 - (c > 2 ? (c - 2) * 0.010 : 0), -h * 0.10 - c * 0.016, -0.035 + (c % 2) * 0.008, 0.010, 0.036, 0.010, 0, 0, Math.PI / 2);
                    add('box', dark, -w * 0.62 - (c > 2 ? (c - 2) * 0.010 : 0), -h * 0.10 - c * 0.016, -0.035, 0.016, 0.008, 0.016);
                }
            }
            if (extras.has('saw_heatshield')) {
                add('box', color, 0, h * 0.30, foreZ, foreW * 1.14, 0.024, fore * 1.04);
                add('box', dark, 0, h * 0.48, -rec * 0.12, 0.016, 0.042, 0.016);
                add('box', acc, 0, h * 0.68, -rec * 0.18, 0.018, 0.018, 0.088);
            }
            if (extras.has('pkp_air_jacket')) {
                add('chamfer', color, 0, h * 0.14, barrelTip + m.barrelLen * 0.56, 0.034, m.barrelLen * 0.85, 0.034, Math.PI / 2);
                add('box', acc, 0, h * 0.52, foreZ + 0.05, 0.018, 0.018, 0.12);
            }
            if (extras.has('mg42_shroud')) {
                add('box', color, 0, h * 0.08, barrelTip + m.barrelLen * 0.44, 0.046, 0.048, m.barrelLen * 0.98);
                add('chamfer', dark, 0, h * 0.12, barrelTip - 0.025, 0.032, 0.056, 0.032, Math.PI / 2);
                add('ring', steel, 0, h * 0.56, -rec * 0.32, 0.026, 0.026, 0.006);
            }
            if (extras.has('lsat_feed_tray')) {
                add('box', color, 0, h * 0.22, -rec * 0.04, w * 1.18, h * 0.85, rec * 1.08);
            }
            if (extras.has('aug_bipod_long')) {
                for (const s of [-1, 1]) add('chamfer', steel, s * 0.032, -0.032, barrelTip + 0.12, 0.010, 0.22, 0.010, Math.PI / 2);
            }
            if (extras.has('m60_tall_fsb')) {
                add('box', dark, 0, h * 0.52, barrelTip + 0.06, 0.012, 0.056, 0.020);
                add('box', acc, 0, -0.006, foreZ, foreW * 1.32, foreH * 1.18, fore * 1.04);
                add('chamfer', dark, 0, -h * 0.30, barrelTip + m.barrelLen * 0.42, 0.022, m.barrelLen * 0.72, 0.022, Math.PI / 2);
            }

            // --- Unique Sniper & Marksman Details ---
            if (extras.has('bolt_knob') || extras.has('bolt_knob_chrome')) {
                const bkMat = extras.has('bolt_knob_chrome') ? 0xe2e8f0 : dark;
                add('box', bkMat, w * 0.56, h * 0.22, rec * 0.18, 0.032, 0.010, 0.010, 0, 0, -0.45);
                add('crystal', bkMat, w * 0.80, h * 0.12, rec * 0.18, 0.022, 0.022, 0.022);
            }
            if (extras.has('mcmillan_cheek')) {
                add('box', color, 0, -0.014, foreZ, foreW * 1.24, foreH * 1.02, fore * 1.04);
                add('chamfer', dark, 0, h * 0.12, barrelTip + m.barrelLen * 0.45, 0.026, m.barrelLen * 0.90, 0.026, Math.PI / 2);
            }
            if (extras.has('r700_wood_bed')) {
                add('box', acc, 0, -0.012, -rec * 0.18, w * 1.18, h * 0.92, rec * 1.55);
            }
            if (extras.has('m200_tubular_hg')) {
                add('chamfer', color, 0, 0.008, foreZ - 0.04, 0.056, fore * 1.24, 0.056, Math.PI / 2);
                add('box', acc, w * 0.58, 0.010, -rec * 0.05, 0.014, 0.022, 0.14);
                add('box', dark, 0, h * 0.12, barrelTip - 0.028, 0.036, 0.028, 0.068);
                if (hasStock) add('chamfer', dark, 0, -0.072, rec * 0.5 + m.stockLen * 0.78, 0.014, 0.064, 0.014);
            }
            if (extras.has('ebr_chassis')) {
                add('box', color, 0, -0.010, -rec * 0.16, w * 1.16, h * 0.95, rec * 1.48);
                add('chamfer', steel, w * 0.48, h * 0.20, foreZ - 0.04, 0.010, fore * 0.95, 0.010, Math.PI / 2);
            }
            if (extras.has('barrett_wedge_brake')) {
                add('box', dark, 0, h * 0.12, barrelTip - 0.032, 0.058, 0.034, 0.075);
                add('box', steel, 0, h * 0.58, -rec * 0.18, 0.016, 0.038, 0.15);
                add('box', color, 0, 0.016, -0.02, w * 1.32, h * 1.28, rec * 1.18);
            }
            if (extras.has('l96_chassis')) {
                add('box', color, 0, -0.010, -rec * 0.12, w * 1.26, h * 1.06, rec * 1.36);
                add('box', dark, 0, h * 0.12, barrelTip - 0.022, 0.028, 0.026, 0.048);
            }
            if (extras.has('svd_slotted_hg')) {
                add('box', acc, 0, 0.002, foreZ, foreW * 1.08, foreH * 0.94, fore * 1.05);
                for (let sl = 0; sl < 5; sl++) add('box', dark, 0, 0.002, foreZ - fore * 0.34 + sl * (fore * 0.17), foreW * 1.12, 0.012, 0.012);
                add('chamfer', dark, 0, h * 0.12, barrelTip - 0.028, 0.018, 0.068, 0.018, Math.PI / 2);
            }
            if (extras.has('msr_octa_hg')) {
                add('chamfer', color, 0, 0.006, foreZ - 0.02, 0.052, fore * 1.18, 0.052, Math.PI / 2);
                add('box', dark, 0, h * 0.12, barrelTip - 0.022, 0.030, 0.026, 0.054);
            }
            if (extras.has('kar_full_wood')) {
                add('box', acc, 0, -0.008, -rec * 0.65 - m.barrelLen * 0.36, w * 1.04, h * 0.78, rec * 0.8 + m.barrelLen * 0.75);
                for (const bz of [-rec * 0.65, -rec * 0.5 - m.barrelLen * 0.56]) {
                    add('box', steel, 0, -0.006, bz, w * 1.12, h * 0.84, 0.018);
                }
                add('chamfer', steel, 0, -h * 0.25, barrelTip + 0.08, 0.006, 0.18, 0.006, Math.PI / 2);
            }

            // --- Unique Pistol Details ---
            if (extras.has('pistol_walnut_panels')) {
                for (const s of [-1, 1]) add('box', wood, s * w * 0.34, -h * 0.5 - 0.036, rec * 0.24, 0.008, 0.072, 0.030, 0.28);
            }
            if (extras.has('deagle_bevel')) {
                add('box', color, 0, h * 0.18, -rec * 0.16, w * 1.18, h * 1.04, rec * 1.24);
                add('box', dark, 0, -h * 0.32, -rec * 0.28, w * 1.02, h * 0.56, rec * 0.58);
                add('box', color, 0, h * 0.56, -rec * 0.18, w * 0.68, 0.010, rec * 0.85);
            }
            if (extras.has('glock_box_slide')) {
                add('box', color, 0, h * 0.14, -0.02, w * 1.14, h * 0.88, rec * 1.02);
                add('box', dark, 0, -h * 0.35, -rec * 0.28, w * 0.96, h * 0.45, rec * 0.46);
                add('box', steel, -w * 0.58, h * 0.10, rec * 0.40, 0.006, 0.014, 0.014);
            }
            if (extras.has('b23r_ports')) {
                add('box', acc, 0, -h * 0.52, -rec * 0.24, 0.016, 0.034, 0.056);
                add('box', steel, 0, h * 0.52, -rec * 0.25, w * 0.48, 0.006, 0.044);
            }
            if (extras.has('fn57_shroud')) {
                add('box', color, 0, h * 0.12, -0.01, w * 1.16, h * 0.92, rec * 1.04);
                add('box', acc, -w * 0.56, -0.008, -rec * 0.10, 0.006, 0.014, 0.034);
            }

            // --- Unique Stock Silhouettes ---
            if (hasStock) {
                const sLen = m.stockLen * (stockChoice === 'precision_stock' ? 1.12 : 1.0);
                const sz = rec * 0.5 + sLen * 0.5;
                if (profile.stock === 'scar_boot' || profile.stock === 'acr_folder') {
                    add('box', color, 0, -0.008, sz, 0.036, 0.068, sLen);
                    add('box', acc, 0, 0.032, sz + 0.01, 0.032, 0.018, sLen * 0.65);
                    add('box', dark, 0, -0.022, rec * 0.5 + sLen, 0.042, 0.095, 0.022);
                } else if (profile.stock === 'l96_thumb' || profile.stock === 'svd_thumb') {
                    const stCol = profile.stock === 'svd_thumb' ? wood : color;
                    add('box', stCol, 0, 0.016, sz, 0.028, 0.022, sLen);
                    add('box', stCol, 0, -0.044, sz, 0.026, 0.018, sLen * 0.92, -0.14);
                    add('box', dark, 0, -0.014, rec * 0.5 + sLen, 0.038, 0.092, 0.018);
                } else if (profile.stock === 'ebr_rod' || profile.stock === 'm200_skel') {
                    for (const s of [-1, 1]) add('chamfer', steel, s * 0.018, 0.008, sz, 0.012, sLen, 0.012, Math.PI / 2);
                    add('box', acc, 0, 0.026, sz + sLen * 0.14, 0.032, 0.016, sLen * 0.42);
                    add('box', dark, 0, -0.008, rec * 0.5 + sLen, 0.042, 0.088, 0.018);
                } else if (profile.stock === 'krink_tri' || profile.stock === 'galil_folder') {
                    add('box', steel, 0, 0.014, sz, 0.014, 0.012, sLen);
                    add('box', steel, 0, -0.026, sz, 0.012, 0.010, sLen, -0.16);
                    add('box', dark, 0, -0.008, rec * 0.5 + sLen, 0.028, 0.082, 0.016);
                } else if (profile.stock === 'mg42_teardrop' || profile.stock === 'thompson_wood' || profile.stock === 'wood_ak') {
                    add('box', acc, 0, -0.016, sz, 0.036, 0.072, sLen, 0.08);
                    add('box', steel, 0, -0.024, rec * 0.5 + sLen, 0.040, 0.082, 0.012);
                } else if (profile.stock === 'mcmillan' || profile.stock === 'r700_sport') {
                    add('box', acc, 0, -0.016, sz, 0.038, 0.070, sLen);
                    add('box', dark, 0, 0.026, sz + 0.01, 0.034, 0.020, sLen * 0.52);
                }
            }
        }));
    }

    function specialDetails(result, spec, advancedFinish) {
        const profile = ANOMALIES[spec.id] || TOOLS[spec.id];
        if (!profile) return result;
        const [type, color, count] = profile;
        const anchor = result.muzzleAnchor.position;
        const isArcane = spec.kind === 'magic';
        const key = ['armory2/spec', spec.id, type, advancedFinish].join('/');
        const parent = spec.modelSpec?.isMinigun ? result.boltGroup : result.gun;

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
                        add(type === 'orbit' ? 'ring' : 'crystal', glow, x * 0.076, y + v * 0.070, z + (i % 2) * 0.025,
                            0.052, 0.065, 0.077, 0.12, 0.24 * x, angle, true);
                    } else if (type === 'coil' || type === 'cascade') {
                        add(type === 'coil' ? 'ring' : 'crystal', glow, x * 0.084, y + v * 0.058,
                            z + 0.015 + 0.024 * i, 0.072, 0.068, 0.058, angle * 0.11, 0, angle, true);
                    } else {
                        const side = i % 2 ? -1 : 1;
                        add(type === 'vessel' ? 'chamfer' : 'box', color,
                            side * (0.068 + (i > 1 ? 0.014 : 0)), y - 0.014 + Math.floor(i / 2) * 0.026,
                            z + 0.021 * i, 0.026, type === 'fork' ? 0.110 : 0.065, 0.031,
                            Math.PI / 2 - i * 0.18, side * 0.15, 0);
                        add('crystal', glow, side * 0.082, y - 0.014 + Math.floor(i / 2) * 0.026,
                            z - 0.022 + 0.021 * i, 0.019, 0.023, 0.024, 0, 0, 0, true);
                    }
                }
            } else if (spec.modelSpec?.isMinigun) {
                for (let i = 0; i < 6; i++) {
                    const angle = 2 * Math.PI * i / 6;
                    add('chamfer', steel, Math.cos(angle) * 0.038, Math.sin(angle) * 0.038, -0.18,
                        0.020, 0.065, 0.020, Math.PI / 2);
                }
            } else {
                for (let i = 0; i < count; i++) {
                    const z = -0.08 - i * 0.028;
                    add(type === 'spike' ? 'crystal' : 'box', color, i % 2 ? -0.018 : 0.018, 0.016, z,
                        type === 'spade' ? 0.075 : 0.026, 0.012, 0.022 + i * 0.002, 0, 0, i % 2 ? -0.16 : 0.16);
                }
            }
        }));
        return result;
    }

    function hashId(id) {
        let result = 2166136261;
        for (const letter of id) result = Math.imul(result ^ letter.charCodeAt(0), 16777619);
        return result >>> 0;
    }

    // =========================================================================
    // BESPOKE 70-ZOMBIE + 10-BOSS + 5-SUPER-BOSS 3D SILHOUETTE OVERHAUL
    // Every single zombie ID maps to unique head, torso/back & limb silhouette
    // geometry so no two undead types ever look alike on the battlefield!
    // =========================================================================
    const ZOMBIE_PROFILES = {
        // Original 20
        shambler:        { head: 'jaw_crook',    back: 'rebar_impale',  acc: 0x78716c, glow: 0xff3333 },
        ankle_biter:     { head: 'feral_maw',    back: 'torn_vertebra', acc: 0xa8a29e, glow: 0xfacc15 },
        sprinter:        { head: 'swept_crest',  back: 'track_collar',  acc: 0xdc2626, glow: 0xf59e0b, arm: 'wrist_blades' },
        one_arm_ripper:  { head: 'scar_plate',   back: 'stump_bone',    acc: 0xd6d3d1, glow: 0xf97316, arm: 'bone_scythe' },
        hunch_spitter:   { head: 'spit_tubes',   back: 'acid_boils',    acc: 0x4ade80, glow: 0x22c55e },
        headless_charger:{ head: 'none',         back: 'bull_ram',      acc: 0x991b1b, glow: 0xef4444 },
        bloater:         { head: 'bloated_jaw',  back: 'gas_pustules',  acc: 0xa3e635, glow: 0xd9f99d },
        hopper:          { head: 'mantis_crest', back: 'dorsal_fin',    acc: 0x38bdf8, glow: 0x38bdf8, arm: 'mantis_scythe' },
        hellhound:       { head: 'hell_collar',  back: 'magma_spines',  acc: 0xf97316, glow: 0xff7b00 },
        nova_crawler:    { head: 'hazmat_dome',  back: 'chem_tank',     acc: 0x22c55e, glow: 0x4ade80 },
        shield_walker:   { head: 'swat_visor',   back: 'riot_pack',     acc: 0x3b82f6, glow: 0x60a5fa },
        twin_horror:     { head: 'third_eye',    back: 'stitch_spine',  acc: 0xe879f9, glow: 0xf0abfc },
        pyro_fiend:      { head: 'flame_crown',  back: 'brazier_cage',  acc: 0xea580c, glow: 0xfb923c },
        frost_wraith:    { head: 'ice_tiara',    back: 'glacier_spires',acc: 0x7dd3fc, glow: 0xe0f2fe },
        spider_ravager:  { head: 'arachnid_eyes',back: 'spider_legs',   acc: 0x881337, glow: 0xf43f5e },
        club_goliath:    { head: 'jaw_iron',     back: 'skull_pauldron',acc: 0xa8a29e, glow: 0xf59e0b, arm: 'chain_shackle' },
        shadow_stalker:  { head: 'assassin_cowl',back: 'void_cloak',    acc: 0x3b0764, glow: 0xc084fc, arm: 'void_daggers' },
        vampire_siren:   { head: 'vamp_tiara',   back: 'gothic_collar', acc: 0x991b1b, glow: 0xfef08a },
        iron_juggernaut: { head: 'slit_furnace', back: 'tank_stacks',   acc: 0x64748b, glow: 0xf43f5e },
        aether_revenant: { head: 'astral_crown', back: 'astrolabe',     acc: 0x9333ea, glow: 0xf0abfc },

        // Easy 17 (21-37)
        goblin_runt:     { head: 'goblin_ears',  back: 'loot_sack',     acc: 0x65a30d, glow: 0xfacc15, arm: 'shiv' },
        bone_lanky:      { head: 'skull_crest',  back: 'exposed_ribs',  acc: 0xe2e8f0, glow: 0x38bdf8 },
        spring_imp:      { head: 'imp_horns',    back: 'coil_springs',  acc: 0xdc2626, glow: 0xfde047 },
        twin_slime:      { head: 'slime_shell',  back: 'slime_orbs',    acc: 0x22c55e, glow: 0x86efac },
        plague_ratman:   { head: 'rat_snout',    back: 'sewer_tail',    acc: 0x78716c, glow: 0xef4444 },
        frost_gnome:     { head: 'gnome_cap',    back: 'ice_pack',      acc: 0x0284c7, glow: 0x7dd3fc },
        toxic_toad:      { head: 'toad_sac',     back: 'wart_ridge',    acc: 0x84cc16, glow: 0xfacc15 },
        sand_mummy:      { head: 'pharaoh_nemes',back: 'linen_wraps',   acc: 0xd6d3d1, glow: 0xf59e0b },
        shadow_imp:      { head: 'smoke_horns',  back: 'shadow_fins',   acc: 0x1e1b4b, glow: 0xa855f7 },
        acrobat_ghoul:   { head: 'jester_hood',  back: 'cape_ribbons',  acc: 0x7c3aed, glow: 0x22d3ee },
        scarecrow_fiend: { head: 'straw_hat',    back: 'cross_pole',    acc: 0xd97706, glow: 0xf97316 },
        mud_waddler:     { head: 'moss_slab',    back: 'swamp_rocks',   acc: 0x57534e, glow: 0x84cc16 },
        lightning_sprite:{ head: 'tesla_halo',   back: 'arc_fins',      acc: 0x06b6d4, glow: 0xfef08a },
        mitosis_ghoul:   { head: 'split_hemi',   back: 'twin_nuclei',   acc: 0x14b8a6, glow: 0x5eead4 },
        bone_hound:      { head: 'jackal_crest', back: 'bone_ridge',    acc: 0xe5e7eb, glow: 0xef4444 },
        ember_dwarf:     { head: 'magma_beard',  back: 'forge_anvil',   acc: 0xea580c, glow: 0xfef08a },
        swamp_witch:     { head: 'bog_antlers',  back: 'vial_rack',     acc: 0x4ade80, glow: 0xa855f7 },

        // Normal 17 (38-54)
        feral_werewolf:  { head: 'lupine_mane',  back: 'fur_hackles',   acc: 0x64748b, glow: 0xfef08a },
        jungle_tigerman: { head: 'tiger_ruff',   back: 'stripe_plates', acc: 0xf97316, glow: 0xfde047 },
        grizzly_bear:    { head: 'bear_muzzle',  back: 'grizzly_hump',  acc: 0x78350f, glow: 0xef4444 },
        swamp_ogre:      { head: 'ogre_jaw',     back: 'gut_cauldron',  acc: 0x65a30d, glow: 0xfacc15 },
        quad_blob:       { head: 'gel_nucleus',  back: 'quad_pods',     acc: 0xa855f7, glow: 0xf0abfc },
        blood_witch:     { head: 'crimson_tiara',back: 'blood_chalice', acc: 0xe11d48, glow: 0xfb7185 },
        sumo_gut:        { head: 'sumo_topknot', back: 'mawashi_belt',  acc: 0xdc2626, glow: 0xef4444 },
        stilts_stalker:  { head: 'lantern_cage', back: 'stilt_rods',    acc: 0x38bdf8, glow: 0x7dd3fc },
        kangaroo_fiend:  { head: 'roo_ears',     back: 'spring_tail',   acc: 0xd97706, glow: 0xfef08a },
        storm_shaman:    { head: 'totem_mask',   back: 'thunder_drums', acc: 0x2563eb, glow: 0x38bdf8, arm: 'totem_staff' },
        viking_berserker:{ head: 'winged_helm',  back: 'round_buckler', acc: 0xd4a437, glow: 0x60a5fa, arm: 'viking_axe' },
        ronin_undead:    { head: 'kabuto_crest', back: 'sashimono',     acc: 0xdc2626, glow: 0xfef08a, arm: 'katana_blade' },
        polar_mauler:    { head: 'frost_muzzle', back: 'iceberg_back',  acc: 0xe2e8f0, glow: 0x38bdf8 },
        mirror_wraith:   { head: 'prism_mask',   back: 'mirror_shards', acc: 0x818cf8, glow: 0xe0e7ff },
        stone_gargoyle:  { head: 'gargoyle_brow',back: 'pedestal_ribs', acc: 0x64748b, glow: 0xf97316 },
        cyber_assassin:  { head: 'cyber_visor',  back: 'neon_spine',    acc: 0x06b6d4, glow: 0x22d3ee, arm: 'neon_katana' },
        saber_tigerman:  { head: 'saber_fangs',  back: 'trophy_pelt',   acc: 0xfde68a, glow: 0xef4444 },

        // Hard 16 (55-70)
        manbearpig:          { head: 'pig_snout',    back: 'tattered_suit', acc: 0xf472b6, glow: 0xef4444 },
        alpha_werewolf:      { head: 'dire_crown',   back: 'blood_mane',    acc: 0x991b1b, glow: 0xef4444 },
        iron_ogre:           { head: 'siege_bucket', back: 'spiked_dome',   acc: 0x475569, glow: 0xf97316 },
        arch_witch:          { head: 'coven_crown',  back: 'grimoire_ring', acc: 0xa855f7, glow: 0xf0abfc },
        armored_warbear:     { head: 'war_chamfron', back: 'steel_barding', acc: 0x475569, glow: 0xfacc15 },
        swarm_broodmother:   { head: 'hive_mandible',back: 'egg_cluster',   acc: 0x84cc16, glow: 0xa3e635 },
        minotaur_charger:    { head: 'bull_horns',   back: 'chain_harness', acc: 0xd4a437, glow: 0xfacc15 },
        cyclops_crusher:     { head: 'cyclops_eye',  back: 'boulder_strap', acc: 0xb45309, glow: 0xfef08a },
        yeti_colossus:       { head: 'ram_ice_horns',back: 'frost_pelt',    acc: 0xbae6fd, glow: 0x38bdf8 },
        vampire_lord:        { head: 'dracula_crest',back: 'bat_mantle',    acc: 0x991b1b, glow: 0xef4444 },
        magma_brute:         { head: 'lava_jaw',     back: 'volcano_vents', acc: 0xea580c, glow: 0xfef08a },
        fracture_golem:      { head: 'crystal_spire',back: 'prism_geode',   acc: 0x38bdf8, glow: 0xe0f2fe },
        hydra_spawn:         { head: 'serpent_frill',back: 'hydra_sails',   acc: 0x16a34a, glow: 0xfacc15 },
        obsidian_golem:      { head: 'monolith_vis', back: 'rune_slabs',    acc: 0x312e81, glow: 0xc084fc },
        infernal_manbearpig: { head: 'hell_tusks',   back: 'hellfire_mane', acc: 0xf97316, glow: 0xfef08a },
        void_emperor:        { head: 'eclipse_crown',back: 'void_arches',   acc: 0x6d28d9, glow: 0x22d3ee }
    };

    function undeadDetails(parts, spec, width = 0.46, depth = 0.25) {
        const b = spec.bodySpec || {};
        const id = spec.id || 'default';
        const seed = hashId(id);
        const prof = ZOMBIE_PROFILES[id] || null;
        const accCol = prof ? prof.acc : [0x9b7049, 0x5e766a, 0xa69a7f, 0x725e59, 0x7a613f][seed % 5];
        const glowCol = prof ? prof.glow : (b.eyeColor || 0xef4444);

        // =====================================================================
        // COLOSSAL SUPER BOSS BESPOKE 3D RIGS (5 ICONIC ENCOUNTERS)
        // =====================================================================
        if (spec.isSuperBoss) {
            parts.bodyPivot.add(detailGroup('superboss/body/' + id, (add) => {
                const front = depth * 0.5 + 0.05;
                if (id === 'super_titan_colossus') {
                    // Twin roaring magma-furnace exhaust stacks + heavy siege pauldrons + chest reactor ring
                    for (const s of [-1, 1]) {
                        add('chamfer', dark, s * 0.22, 0.58, -front - 0.12, 0.11, 0.54, 0.11, -0.18, 0, s * 0.12);
                        add('crystal', 0xfbbf24, s * 0.24, 0.88, -front - 0.16, 0.12, 0.18, 0.12, 0, 0, 0, true);
                        add('box', 0x7c2d12, s * (width * 0.62), 0.56, 0, 0.22, 0.22, 0.34, 0, 0, -s * 0.2);
                        add('crystal', 0xf97316, s * (width * 0.68), 0.70, 0, 0.09, 0.22, 0.09, 0, 0, -s * 0.35, true);
                    }
                    add('ring', brass, 0, 0.40, front + 0.03, 0.28, 0.28, 0.06);
                    add('crystal', 0xfef08a, 0, 0.40, front + 0.06, 0.16, 0.16, 0.12, 0, 0, 0, true);
                } else if (id === 'super_seraph_harbinger') {
                    // Six radiant feather-blade wings + 3 interlocking celestial rings
                    for (const s of [-1, 1]) {
                        for (let tier = 0; tier < 3; tier++) {
                            const wy = 0.62 - tier * 0.18;
                            const spread = 0.48 + tier * 0.12;
                            add('box', 0xfef3c7, s * spread, wy, -0.18 - tier * 0.04, 0.66, 0.09, 0.03, 0.1, s * 0.28, s * (0.38 - tier * 0.26));
                            add('crystal', 0x38bdf8, s * (spread + 0.28), wy + 0.04, -0.20, 0.18, 0.05, 0.04, 0, 0, s * 0.2, true);
                        }
                    }
                    add('ring', 0xfacc15, 0, 0.46, -0.24, 0.88, 0.88, 0.05, 0.25, 0.2, 0, true);
                    add('ring', 0x38bdf8, 0, 0.46, -0.24, 0.66, 0.66, 0.04, -0.35, -0.25, 0.5, true);
                } else if (id === 'super_hydra_behemoth') {
                    // Towering venomous dorsal spine sails + whipping barbed dragon tail + glowing neck glands
                    for (let i = 0; i < 5; i++) {
                        add('crystal', i % 2 ? 0x4ade80 : 0x065f46, 0, 0.62 - i * 0.13, -front - 0.08 - i * 0.05, 0.10, 0.30 - i * 0.03, 0.18, -0.45, 0, 0, i % 2 === 1);
                    }
                    add('chamfer', 0x065f46, 0, -0.02, -front - 0.42, 0.18, 0.82, 0.18, -1.05);
                    add('crystal', 0xa3e635, 0, -0.28, -front - 0.78, 0.16, 0.26, 0.16, -1.2, 0, 0, true);
                    for (const s of [-1, 1]) add('crystal', 0x4ade80, s * 0.26, 0.52, front, 0.13, 0.16, 0.13, 0, 0, 0, true);
                } else if (id === 'super_dreadnought_mech') {
                    // Twin shoulder 6-cell Micro-Missile Pods + rear jetpack thrusters + chest core
                    for (const s of [-1, 1]) {
                        add('box', steel, s * 0.34, 0.70, -0.02, 0.22, 0.20, 0.28);
                        for (let r = 0; r < 2; r++) {
                            for (let c = 0; c < 3; c++) {
                                add('crystal', 0xef4444, s * 0.34 + (c - 1) * 0.055, 0.66 + r * 0.07, 0.13, 0.035, 0.035, 0.03, 0, 0, 0, true);
                            }
                        }
                        add('chamfer', dark, s * 0.16, 0.32, -front - 0.14, 0.13, 0.34, 0.13, 0.18);
                        add('crystal', 0x38bdf8, s * 0.16, 0.14, -front - 0.16, 0.10, 0.12, 0.10, 0, 0, 0, true);
                    }
                    add('box', brass, 0, 0.42, front + 0.05, 0.24, 0.18, 0.05);
                    add('crystal', 0x38bdf8, 0, 0.42, front + 0.08, 0.14, 0.10, 0.05, 0, 0, 0, true);
                } else if (id === 'super_void_sovereign') {
                    // Grand abyssal arch-wings + floating singularity core behind shoulders
                    for (const s of [-1, 1]) {
                        add('box', 0x3b0764, s * 0.46, 0.56, -0.22, 0.14, 0.78, 0.08, 0, 0, -s * 0.36);
                        add('crystal', 0xe879f9, s * 0.64, 0.82, -0.24, 0.14, 0.36, 0.10, 0, 0, -s * 0.48, true);
                    }
                    add('ring', 0x22d3ee, 0, 0.72, -0.28, 0.78, 0.78, 0.05, 0, 0, 0, true);
                    add('crystal', 0x090314, 0, 0.72, -0.28, 0.24, 0.24, 0.24);
                }
            }));

            if (parts.armR) {
                parts.armR.add(detailGroup('superboss/armR/' + id, (add) => {
                    if (id === 'super_titan_colossus') {
                        // Colossal Seismic Forge War-Hammer
                        add('chamfer', steel, 0.04, -0.62, 0.18, 0.07, 0.85, 0.07, 0.9);
                        add('box', dark, 0.04, -0.88, 0.48, 0.36, 0.24, 0.26, 0.9);
                        add('crystal', 0xf97316, 0.04, -0.88, 0.60, 0.22, 0.12, 0.08, 0.9, 0, 0, true);
                    } else if (id === 'super_seraph_harbinger') {
                        // Radiant Solar-Void Greatlance
                        add('chamfer', brass, 0, -0.52, 0.36, 0.04, 1.45, 0.04, 1.25);
                        add('crystal', 0x38bdf8, 0, -0.74, 0.98, 0.14, 0.38, 0.14, 1.25, 0, 0, true);
                    } else if (id === 'super_dreadnought_mech') {
                        // 6-Barrel Rotary Gatling Cannon
                        add('box', dark, 0.04, -0.38, 0.14, 0.18, 0.18, 0.32, 1.15);
                        for (let bIdx = 0; bIdx < 6; bIdx++) {
                            const a = (bIdx / 6) * Math.PI * 2;
                            add('chamfer', steel, 0.04 + Math.cos(a) * 0.05, -0.56 + Math.sin(a) * 0.05, 0.42, 0.026, 0.56, 0.026, 1.15);
                        }
                    } else if (id === 'super_void_sovereign') {
                        // Twin-Bladed Eclipse Glaive
                        add('chamfer', 0x1e1b4b, 0, -0.50, 0.25, 0.045, 1.55, 0.045, 1.15);
                        add('crystal', 0xe879f9, 0, -0.82, 0.92, 0.14, 0.44, 0.08, 1.15, 0, 0, true);
                        add('crystal', 0x22d3ee, 0, -0.18, -0.40, 0.12, 0.38, 0.08, 1.15, 0, 0, true);
                    }
                }));
            }

            if (parts.headGroup) {
                for (const head of parts.headGroup.children.filter((c) => c.isGroup)) {
                    head.add(detailGroup('superboss/head/' + id, (add) => {
                        if (id === 'super_titan_colossus') {
                            add('box', brass, 0, 0.16, 0.04, 0.30, 0.10, 0.26);
                            for (let k = -1; k <= 1; k++) add('crystal', 0xfbbf24, k * 0.10, 0.26, 0.08, 0.06, 0.16, 0.06, 0, 0, 0, true);
                        } else if (id === 'super_seraph_harbinger') {
                            add('chamfer', brass, 0, 0.0, 0.14, 0.22, 0.26, 0.08);
                            add('box', 0x38bdf8, 0, 0.01, 0.18, 0.035, 0.20, 0.03, 0, 0, 0, true);
                        } else if (id === 'super_hydra_behemoth') {
                            for (const s of [-1, 1]) add('box', 0x4ade80, s * 0.16, 0.04, -0.02, 0.14, 0.20, 0.03, 0, s * 0.45, -s * 0.3, true);
                        } else if (id === 'super_dreadnought_mech') {
                            add('box', steel, 0, 0.03, 0.02, 0.30, 0.24, 0.28);
                            add('box', 0xef4444, 0, 0.03, 0.165, 0.24, 0.055, 0.03, 0, 0, 0, true);
                        } else if (id === 'super_void_sovereign') {
                            add('ring', 0xe879f9, 0, 0.32, 0, 0.36, 0.36, 0.05, Math.PI / 2, 0, 0, true);
                            add('crystal', 0x22d3ee, 0, 0.36, 0, 0.12, 0.18, 0.12, 0, 0, 0, true);
                        }
                    }));
                }
            }
            return;
        }

        // =====================================================================
        // QUADRUPED DISTINCT HARNESSES, RIDGES & HEAD CRESTS
        // =====================================================================
        if (b.quadruped) {
            parts.bodyPivot.add(detailGroup('undead3/quad/' + id, (add) => {
                const backKind = prof?.back || 'magma_spines';
                if (backKind === 'magma_spines') {
                    add('ring', brass, 0, 0.08, 0.36, 0.34, 0.34, 0.06);
                    for (let i = 0; i < 4; i++) add('crystal', glowCol, 0, 0.26, 0.26 - i * 0.18, 0.08, 0.18, 0.10, -0.35, 0, 0, true);
                } else if (backKind === 'bone_ridge') {
                    for (let i = 0; i < 5; i++) {
                        add('box', 0xe5e7eb, 0, 0.23, 0.30 - i * 0.15, 0.28 - i * 0.03, 0.04, 0.05);
                        add('crystal', 0xe5e7eb, 0, 0.28, 0.30 - i * 0.15, 0.05, 0.12, 0.06);
                    }
                } else if (backKind === 'grizzly_hump') {
                    add('chamfer', accCol, 0, 0.22, 0.16, 0.44, 0.22, 0.38);
                    for (const s of [-1, 1]) add('crystal', 0xd6d3d1, s * 0.20, 0.18, 0.24, 0.06, 0.14, 0.06, 0, 0, -s * 0.4);
                } else if (backKind === 'iceberg_back') {
                    for (let i = 0; i < 5; i++) add('crystal', 0x7dd3fc, (i % 2 ? 0.1 : -0.1), 0.26, 0.25 - i * 0.14, 0.11, 0.24, 0.11, -0.2, 0, (i % 2 ? -0.25 : 0.25), true);
                } else if (backKind === 'steel_barding') {
                    add('box', steel, 0, 0.16, 0.05, 0.48, 0.24, 0.72);
                    add('box', brass, 0, 0.29, 0.05, 0.10, 0.05, 0.74);
                    for (const s of [-1, 1]) add('crystal', glowCol, s * 0.25, 0.24, 0.22, 0.07, 0.16, 0.07, 0, 0, -s * 0.45, true);
                } else {
                    for (const side of [-1, 1]) {
                        for (let i = 0; i < 3; i++) add('crystal', accCol, side * 0.12, 0.20, 0.24 - i * 0.16, 0.08, 0.14, 0.09, 0.16, 0, side * 0.35, !!b.glowingRibs);
                    }
                }
            }));
            return;
        }

        // =====================================================================
        // BIPED / FLOATING BESPOKE TORSO, BACK & SHOULDER SILHOUETTES (70/70)
        // =====================================================================
        parts.bodyPivot.add(detailGroup('undead3/body/' + id, (add) => {
            const front = depth * 0.5 + 0.02;
            const back = -depth * 0.5 - 0.02;
            const bk = prof?.back || '';

            if (bk === 'rebar_impale') {
                add('chamfer', steel, 0.14, 0.48, 0.02, 0.026, 0.62, 0.026, 0.55, 0, -0.38);
                add('box', accCol, -0.14, 0.38, front, 0.12, 0.22, 0.03, 0, 0, 0.14);
            } else if (bk === 'torn_vertebra') {
                for (let i = 0; i < 5; i++) add('box', 0xd6d3d1, 0, 0.08 - i * 0.07, back - i * 0.04, 0.09 - i * 0.01, 0.05, 0.06);
            } else if (bk === 'track_collar') {
                for (const s of [-1, 1]) {
                    add('box', accCol, s * (width * 0.48), 0.36, 0, 0.035, 0.34, depth * 0.92);
                    add('crystal', accCol, s * 0.18, 0.58, back, 0.05, 0.18, 0.06, -0.45, 0, -s * 0.2);
                }
            } else if (bk === 'stump_bone') {
                add('chamfer', 0xe5e7eb, -width * 0.58, 0.48, 0, 0.06, 0.22, 0.06, 0, 0, 0.85);
                add('box', 0x7f1d1d, -width * 0.52, 0.50, 0, 0.10, 0.12, 0.12);
            } else if (bk === 'acid_boils' || bk === 'gas_pustules' || bk === 'egg_cluster') {
                const count = bk === 'egg_cluster' ? 6 : 4;
                for (let i = 0; i < count; i++) {
                    const ang = (i / count) * Math.PI * 2;
                    add('crystal', glowCol, Math.cos(ang) * 0.16, 0.34 + Math.sin(ang) * 0.14, back - 0.08, 0.13, 0.13, 0.13, 0, 0, 0, true);
                }
            } else if (bk === 'bull_ram') {
                add('box', steel, 0, 0.40, front + 0.03, width * 0.95, 0.26, 0.07);
                for (const s of [-1, 1]) add('crystal', accCol, s * (width * 0.56), 0.52, front + 0.08, 0.08, 0.26, 0.08, 1.15, 0, -s * 0.25);
            } else if (bk === 'dorsal_fin' || bk === 'hydra_sails' || bk === 'shadow_fins' || bk === 'arc_fins') {
                for (let i = 0; i < 4; i++) {
                    add('box', glowCol, 0, 0.56 - i * 0.12, back - 0.07, 0.03, 0.14, 0.18 - i * 0.02, -0.35, 0, 0, bk === 'arc_fins');
                }
            } else if (bk === 'chem_tank') {
                for (const s of [-1, 1]) {
                    add('chamfer', steel, s * 0.11, 0.38, back - 0.08, 0.10, 0.36, 0.10);
                    add('box', glowCol, s * 0.11, 0.38, back - 0.13, 0.05, 0.24, 0.03, 0, 0, 0, true);
                }
            } else if (bk === 'riot_pack') {
                add('box', dark, 0, 0.40, back - 0.06, 0.30, 0.30, 0.12);
                add('crystal', 0x3b82f6, 0.18, 0.62, 0, 0.06, 0.06, 0.06, 0, 0, 0, true);
            } else if (bk === 'stitch_spine') {
                for (let i = 0; i < 5; i++) add('box', steel, 0, 0.50 - i * 0.08, front + 0.02, 0.16, 0.02, 0.03, 0, 0, (i % 2 ? 0.2 : -0.2));
            } else if (bk === 'brazier_cage' || bk === 'volcano_vents') {
                add('box', dark, 0, 0.48, back - 0.10, 0.28, 0.28, 0.18);
                add('crystal', glowCol, 0, 0.64, back - 0.10, 0.18, 0.24, 0.18, 0, 0, 0, true);
            } else if (bk === 'glacier_spires' || bk === 'prism_geode') {
                for (let c = 0; c < 5; c++) {
                    add('crystal', glowCol, (c - 2) * 0.10, 0.42 + (c % 2) * 0.14, back - 0.06, 0.09, 0.30, 0.09, -0.4, 0, (c - 2) * 0.22, true);
                }
            } else if (bk === 'spider_legs') {
                for (const s of [-1, 1]) {
                    for (let l = 0; l < 3; l++) {
                        add('chamfer', accCol, s * 0.24, 0.52 - l * 0.11, back - 0.06, 0.035, 0.42, 0.035, -0.25, 0, -s * (0.95 + l * 0.22));
                        add('crystal', glowCol, s * 0.48, 0.56 - l * 0.14, back - 0.10, 0.04, 0.24, 0.04, 0.2, 0, -s * 2.1);
                    }
                }
            } else if (bk === 'skull_pauldron' || bk === 'spiked_dome') {
                add('chamfer', 0xe5e7eb, -width * 0.56, 0.58, 0, 0.18, 0.16, 0.18);
                for (let k = -1; k <= 1; k++) add('crystal', steel, width * 0.56, 0.66, k * 0.07, 0.05, 0.18, 0.05);
            } else if (bk === 'void_cloak' || bk === 'bat_mantle' || bk === 'gothic_collar') {
                add('box', accCol, 0, 0.60, back - 0.02, width * 1.15, 0.22, 0.06, -0.25);
                add('box', dark, 0, 0.20, back - 0.05, width * 0.96, 0.56, 0.04, 0.12);
            } else if (bk === 'tank_stacks') {
                add('box', steel, 0, 0.38, back - 0.09, 0.34, 0.36, 0.16);
                for (const s of [-1, 1]) add('chamfer', dark, s * 0.12, 0.66, back - 0.10, 0.06, 0.28, 0.06);
                for (let t = 0; t < 3; t++) add('box', dark, 0, 0.24 + t * 0.10, front + 0.04, 0.36, 0.06, 0.04);
            } else if (bk === 'astrolabe' || bk === 'grimoire_ring' || bk === 'void_arches') {
                add('ring', glowCol, 0, 0.52, back - 0.14, 0.62, 0.62, 0.04, 0, 0, 0, true);
                add('ring', accCol, 0, 0.52, back - 0.14, 0.44, 0.44, 0.04, 0.4, 0.4, 0);
            } else if (bk === 'loot_sack') {
                add('chamfer', 0x78350f, 0.06, 0.38, back - 0.12, 0.26, 0.30, 0.24, -0.2);
            } else if (bk === 'exposed_ribs') {
                for (let r = 0; r < 4; r++) add('ring', 0xe2e8f0, 0, 0.22 + r * 0.08, 0, width * 0.95, depth * 1.05, 0.03, Math.PI / 2);
            } else if (bk === 'coil_springs') {
                for (const s of [-1, 1]) add('ring', steel, s * 0.14, -0.10, 0, 0.16, 0.16, 0.05, Math.PI / 2);
                add('chamfer', accCol, 0, 0.08, back - 0.14, 0.03, 0.38, 0.03, -0.9);
            } else if (bk === 'slime_orbs' || bk === 'quad_pods' || bk === 'twin_nuclei') {
                for (const s of [-1, 1]) add('crystal', glowCol, s * 0.16, 0.36, 0.04, 0.15, 0.15, 0.15, 0, 0, 0, true);
            } else if (bk === 'sewer_tail' || bk === 'spring_tail') {
                add('chamfer', accCol, 0, 0.02, back - 0.24, 0.05, 0.62, 0.05, -1.12);
            } else if (bk === 'cross_pole') {
                add('box', 0x78350f, 0, 0.52, back - 0.06, 0.88, 0.06, 0.06);
                add('box', 0x78350f, 0, 0.36, back - 0.06, 0.07, 0.68, 0.06);
            } else if (bk === 'swamp_rocks') {
                for (let i = 0; i < 4; i++) add('chamfer', 0x44403c, (i - 1.5) * 0.12, 0.48 + (i % 2) * 0.08, back - 0.06, 0.16, 0.14, 0.16);
            } else if (bk === 'forge_anvil') {
                add('box', dark, 0, 0.42, back - 0.10, 0.34, 0.22, 0.16);
                add('crystal', glowCol, 0, 0.56, back - 0.10, 0.14, 0.12, 0.14, 0, 0, 0, true);
            } else if (bk === 'vial_rack') {
                for (let v = -1; v <= 1; v++) add('chamfer', glowCol, v * 0.10, 0.28, front + 0.03, 0.05, 0.12, 0.05, 0, 0, 0.2, true);
            } else if (bk === 'sashimono') {
                add('chamfer', dark, 0.08, 0.68, back - 0.08, 0.025, 0.78, 0.025);
                add('box', accCol, 0.08, 0.82, back - 0.18, 0.02, 0.42, 0.22);
            } else if (bk === 'round_buckler') {
                add('chamfer', 0x78350f, 0, 0.38, back - 0.08, 0.46, 0.05, 0.46, Math.PI / 2);
                add('chamfer', brass, 0, 0.38, back - 0.11, 0.14, 0.06, 0.14, Math.PI / 2);
            } else if (bk === 'neon_spine') {
                for (let n = 0; n < 5; n++) add('box', glowCol, 0, 0.16 + n * 0.09, back - 0.03, 0.08, 0.04, 0.05, 0, 0, 0, true);
            } else if (bk === 'mawashi_belt') {
                add('ring', accCol, 0, 0.10, 0, width * 1.18, depth * 1.18, 0.10, Math.PI / 2);
            } else if (bk === 'thunder_drums') {
                for (let d = 0; d < 3; d++) {
                    const a = (d / 3) * Math.PI - Math.PI * 0.5 + Math.PI * 0.5;
                    add('chamfer', accCol, Math.cos(a) * 0.28, 0.64 + Math.sin(a) * 0.16, back - 0.10, 0.13, 0.06, 0.13, Math.PI / 2);
                }
            } else if (bk === 'rune_slabs') {
                for (const s of [-1, 1]) add('box', glowCol, s * 0.34, 0.54, back - 0.12, 0.12, 0.44, 0.05, 0, 0, -s * 0.18, true);
            } else if (bk === 'tattered_suit' || bk === 'hellfire_mane') {
                add('box', 0xdc2626, 0, 0.34, front + 0.02, 0.07, 0.28, 0.03); // Necktie / blaze strip!
                for (const s of [-1, 1]) add('crystal', glowCol, s * 0.22, 0.58, back - 0.04, 0.12, 0.22, 0.12, -0.3, 0, 0, bk === 'hellfire_mane');
            } else {
                const side = seed % 2 ? 1 : -1;
                for (let i = 0; i < 3; i++) {
                    add('box', accCol, side * width * 0.26, 0.50 - i * 0.09, front, 0.11, 0.06, 0.03, 0, 0, side * 0.1);
                }
            }
        }));

        // =====================================================================
        // BESPOKE FOREARM / MELEE WEAPON SILHOUETTES
        // =====================================================================
        if (prof?.arm && parts.armR) {
            parts.armR.add(detailGroup('undead3/arm/' + id, (add) => {
                if (prof.arm === 'bone_scythe' || prof.arm === 'mantis_scythe') {
                    add('crystal', accCol, 0.03, -0.56, 0.18, 0.06, 0.48, 0.14, 1.15, 0, 0, prof.arm === 'mantis_scythe');
                } else if (prof.arm === 'wrist_blades' || prof.arm === 'void_daggers') {
                    add('crystal', glowCol, 0.04, -0.52, 0.16, 0.04, 0.34, 0.07, 1.35, 0, 0, true);
                } else if (prof.arm === 'katana_blade' || prof.arm === 'neon_katana') {
                    add('box', prof.arm === 'neon_katana' ? glowCol : steel, 0, -0.58, 0.36, 0.022, 0.045, 0.72, 0.35, 0, 0, prof.arm === 'neon_katana');
                } else if (prof.arm === 'viking_axe') {
                    add('chamfer', 0x78350f, 0, -0.50, 0.22, 0.035, 0.58, 0.035, 1.1);
                    add('box', steel, 0, -0.64, 0.44, 0.03, 0.24, 0.18, 1.1);
                } else if (prof.arm === 'totem_staff') {
                    add('chamfer', 0x78350f, 0, -0.46, 0.20, 0.03, 1.05, 0.03, 1.2);
                    add('crystal', glowCol, 0, -0.62, 0.68, 0.12, 0.16, 0.12, 0, 0, 0, true);
                } else if (prof.arm === 'shiv') {
                    add('crystal', steel, 0, -0.54, 0.14, 0.03, 0.22, 0.05, 1.3);
                } else if (prof.arm === 'chain_shackle') {
                    add('ring', steel, 0, -0.44, 0.04, 0.15, 0.15, 0.04, Math.PI / 2);
                }
            }));
        }

        // =====================================================================
        // BESPOKE HEADGEAR, MASKS, HORNS, SNOUTS & CROWNS (70/70)
        // =====================================================================
        if (b.headless || !parts.headGroup) return;
        for (const head of parts.headGroup.children.filter((child) => child.isGroup)) {
            head.add(detailGroup('undead3/head/' + id, (add) => {
                const hd = prof?.head || '';
                if (hd === 'spit_tubes' || hd === 'hazmat_dome') {
                    add('chamfer', 0x26292e, 0, -0.055, 0.145, 0.11, 0.10, 0.10, Math.PI / 2);
                    for (const s of [-1, 1]) {
                        add('chamfer', accCol, s * 0.08, -0.075, 0.165, 0.06, 0.055, 0.06, 0, s * 0.4, 0);
                        add('box', glowCol, s * 0.056, 0.018, 0.152, 0.055, 0.038, 0.016, 0, 0, 0, true);
                    }
                } else if (hd === 'swat_visor' || hd === 'cyber_visor' || hd === 'monolith_vis' || hd === 'slit_furnace') {
                    add('box', dark, 0, 0.02, 0.152, 0.23, 0.065, 0.04);
                    add('box', glowCol, 0, 0.02, 0.172, 0.19, 0.026, 0.015, 0, 0, 0, true);
                } else if (hd === 'goblin_ears' || hd === 'roo_ears') {
                    const tall = hd === 'roo_ears';
                    for (const s of [-1, 1]) {
                        add('crystal', accCol, s * (tall ? 0.10 : 0.19), tall ? 0.24 : 0.03, 0, tall ? 0.06 : 0.18, tall ? 0.24 : 0.06, 0.05, 0, 0, -s * (tall ? 0.18 : 1.15));
                    }
                } else if (hd === 'rat_snout' || hd === 'pig_snout' || hd === 'hell_tusks') {
                    add('chamfer', accCol, 0, -0.035, 0.19, 0.11, 0.12, 0.11, Math.PI / 2);
                    if (hd !== 'rat_snout') {
                        for (const s of [-1, 1]) add('crystal', 0xe5e7eb, s * 0.075, -0.05, 0.21, 0.035, 0.14, 0.035, 0.5, 0, -s * 0.25);
                    }
                } else if (hd === 'gnome_cap') {
                    add('crystal', accCol, 0, 0.28, -0.01, 0.19, 0.36, 0.19);
                    add('box', 0xf8fafc, 0, -0.12, 0.13, 0.16, 0.14, 0.06);
                } else if (hd === 'straw_hat') {
                    add('chamfer', 0xd97706, 0, 0.14, 0, 0.44, 0.03, 0.44);
                    add('chamfer', 0xb45309, 0, 0.22, 0, 0.22, 0.16, 0.22);
                } else if (hd === 'jester_hood') {
                    for (const s of [-1, 1]) {
                        add('chamfer', accCol, s * 0.14, 0.20, -0.02, 0.08, 0.22, 0.08, 0, 0, -s * 0.55);
                        add('crystal', glowCol, s * 0.23, 0.27, -0.02, 0.05, 0.05, 0.05, 0, 0, 0, true);
                    }
                } else if (hd === 'pharaoh_nemes') {
                    add('box', brass, 0, 0.06, -0.02, 0.34, 0.26, 0.22);
                    add('crystal', glowCol, 0, 0.16, 0.14, 0.05, 0.09, 0.05, 0.3, 0, 0, true);
                } else if (hd === 'kabuto_crest') {
                    add('box', dark, 0, 0.06, -0.03, 0.32, 0.16, 0.28);
                    for (const s of [-1, 1]) add('box', brass, s * 0.09, 0.20, 0.13, 0.14, 0.04, 0.02, 0, 0, s * 0.55);
                } else if (hd === 'winged_helm') {
                    for (const s of [-1, 1]) add('box', 0xf8fafc, s * 0.18, 0.14, 0, 0.03, 0.20, 0.14, -0.25, 0, -s * 0.35);
                    add('box', 0xd97706, 0, -0.14, 0.13, 0.16, 0.16, 0.06);
                } else if (hd === 'sumo_topknot') {
                    add('chamfer', 0x0f172a, 0, 0.19, 0.02, 0.09, 0.12, 0.14, 0.6);
                } else if (hd === 'cyclops_eye') {
                    add('crystal', glowCol, 0, 0.03, 0.165, 0.13, 0.13, 0.06, 0, 0, 0, true);
                    add('box', brass, 0, 0.10, 0.15, 0.22, 0.04, 0.05);
                } else if (hd === 'bull_horns' || hd === 'ram_ice_horns') {
                    for (const s of [-1, 1]) add('crystal', hd === 'ram_ice_horns' ? 0x7dd3fc : 0xe5e7eb, s * 0.22, 0.18, 0.06, 0.08, 0.34, 0.08, 0.45, 0, -s * 0.85, hd === 'ram_ice_horns');
                    if (hd === 'bull_horns') add('ring', brass, 0, -0.05, 0.17, 0.07, 0.07, 0.02);
                } else if (hd === 'saber_fangs') {
                    for (const s of [-1, 1]) add('crystal', 0xfef3c7, s * 0.065, -0.14, 0.155, 0.035, 0.16, 0.035, Math.PI, 0, 0);
                } else if (hd === 'lantern_cage') {
                    add('box', dark, 0, 0.04, 0.02, 0.24, 0.26, 0.24);
                    add('crystal', glowCol, 0, 0.04, 0.02, 0.15, 0.18, 0.15, 0, 0, 0, true);
                } else if (hd === 'flame_crown' || hd === 'ice_tiara' || hd === 'astral_crown' || hd === 'crimson_tiara' || hd === 'coven_crown' || hd === 'eclipse_crown' || hd === 'dire_crown' || hd === 'dracula_crest') {
                    for (let k = -2; k <= 2; k++) {
                        add('crystal', glowCol, k * 0.055, 0.18 + (2 - Math.abs(k)) * 0.035, 0.06, 0.04, 0.14, 0.04, 0.15, 0, -k * 0.15, true);
                    }
                } else if (hd === 'arachnid_eyes') {
                    for (let e = 0; e < 6; e++) {
                        add('crystal', glowCol, (e - 2.5) * 0.038, 0.04 + (e % 2) * 0.03, 0.155, 0.026, 0.026, 0.02, 0, 0, 0, true);
                    }
                } else if (hd === 'assassin_cowl') {
                    add('crystal', dark, 0, 0.14, -0.02, 0.28, 0.28, 0.28);
                } else if (hd === 'totem_mask' || hd === 'prism_mask') {
                    add('box', accCol, 0, 0.02, 0.155, 0.24, 0.28, 0.03);
                    for (let f = -1; f <= 1; f++) add('box', glowCol, f * 0.07, 0.22, 0.14, 0.03, 0.16, 0.02, 0, 0, -f * 0.2, true);
                } else if (hd === 'magma_beard') {
                    add('crystal', glowCol, 0, -0.18, 0.13, 0.18, 0.22, 0.10, Math.PI, 0, 0, true);
                } else if (hd === 'toad_sac') {
                    add('chamfer', glowCol, 0, -0.12, 0.14, 0.20, 0.12, 0.18, 0, 0, 0, true);
                } else if (hd === 'tesla_halo') {
                    add('ring', glowCol, 0, 0.20, 0, 0.28, 0.28, 0.035, Math.PI / 2, 0, 0, true);
                } else if (hd === 'serpent_frill') {
                    for (const s of [-1, 1]) add('box', accCol, s * 0.15, 0.02, 0.0, 0.12, 0.20, 0.02, 0, s * 0.4, -s * 0.25);
                } else {
                    const side = seed & 1 ? 1 : -1;
                    add('box', accCol, side * 0.105, 0.03, 0.08, 0.04, 0.09, 0.04, 0, side * 0.35, side * 0.25);
                    if (b.glowingRibs || spec.isBoss) add('crystal', glowCol, 0, 0.17, 0.08, 0.06, 0.12, 0.06, 0.2, 0, 0, true);
                }
            }));
        }
    }

    BO.ArsenalDetails = { getFirearmProfile, firearmDetails, specialDetails, undeadDetails };
})(window.BO);
