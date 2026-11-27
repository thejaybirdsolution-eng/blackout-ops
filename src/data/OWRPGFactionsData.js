/* ============================================================================
   BLACKOUT OPS — Open World RPG · Factions Data
   Four factions with rivals (negative spillover), reputation tiers, colors and
   expanded vendor stock (weapons, multi-slot armor, tools & repair kits).
============================================================================ */
(function (BO) {
    'use strict';

    const FACTIONS = {
        militia: { name: 'Freestead Militia', short: 'Militia', color: '#f5a623', rival: 'syndicate',
            blurb: 'Frontier rangers defending clean water and the settlements of the Basin.' },
        syndicate: { name: 'Ironclad Syndicate', short: 'Syndicate', color: '#ef4444', rival: 'militia',
            blurb: 'Industrial salvagers, rail barons and black-market mercenaries.' },
        aegis: { name: 'Aegis Directorate', short: 'Aegis', color: '#38bdf8', rival: 'helix',
            blurb: 'Pre-collapse military scientists enforcing the Meridian quarantine.' },
        helix: { name: 'Children of the Helix', short: 'Helix', color: '#c084fc', rival: 'aegis',
            blurb: 'Transhumanist researchers who would harness the Meridian mutations.' }
    };
    const HOSTILE_GROUPS = ['raiders', 'brood'];

    const REP_MIN = -1000, REP_MAX = 1500;
    const SPILLOVER = 0.5;
    const TIERS = [
        { id: 'hated', name: 'Hated', min: -1000, color: '#dc2626' },
        { id: 'shunned', name: 'Shunned', min: -499, color: '#f97316' },
        { id: 'neutral', name: 'Neutral', min: -149, color: '#cbd5e1' },
        { id: 'trusted', name: 'Trusted', min: 250, color: '#4ade80' },
        { id: 'sworn', name: 'Sworn', min: 750, color: '#fbbf24' }
    ];
    const TIER_DISCOUNT = { hated: null, shunned: null, neutral: 0, trusted: 0.12, sworn: 0.2 };

    const START_REP = { militia: 0, syndicate: 0, aegis: 0, helix: 0 };

    const VENDORS = {
        freestead_store: {
            name: "Dottie's Supply", faction: 'militia',
            stock: ['medkit', 'ammo_box', 'stim', 'relay_cell', 'tool_field_repair', 'w_carbine', 'w_rifle', 'w_ump45_enforcer', 'w_m40a3_ranger', 'rig_light', 'helm_scav', 'boots_scav', 'helm_warden', 'boots_warden']
        },
        torin_bench: {
            name: "Torin's Forge & Garage", faction: 'militia',
            stock: ['tool_field_repair', 'tool_nano_patch', 'tool_scrap_flamer', 'tool_arc_welder', 'tool_riot_plate', 'tool_emergency_beacon', 'rig_warden', 'rig_plated', 'w_m4a1_warden', 'w_stg44_relic', 'schematic_scout_bike']
        },
        syndicate_fence: {
            name: 'Rail Yard Fence', faction: 'syndicate',
            stock: ['ammo_box', 'stim', 'medkit', 'tool_field_repair', 'tool_thermal_cutter', 'tool_breach_hammer', 'w_shotgun', 'w_lmg', 'w_smg', 'w_ak47_rust', 'w_deagle_judge', 'w_p90_arc', 'rig_plated', 'helm_juggernaut', 'boots_juggernaut', 'rig_juggernaut', 'relay_cell']
        },
        aegis_quarter: {
            name: 'Aegis Quartermaster', faction: 'aegis',
            stock: ['medkit', 'relay_cell', 'tool_nano_patch', 'tool_kinetic_shield', 'tool_overcharge_cell', 'w_dmr', 'w_acr_specops', 'w_m249_bastion', 'w_scar_aegis', 'rig_aegis', 'helm_arctech', 'boots_arctech'],
            minTier: 'neutral'
        },
        helix_exchange: {
            name: 'Helix Exchange', faction: 'helix',
            stock: ['stim', 'medkit', 'tool_nano_patch', 'tool_overcharge_cell', 'w_vector', 'w_f2000_helix', 'w_mp7_ghost', 'w_void_staff', 'rig_arctech', 'relic_arctech', 'helm_ghost', 'boots_ghost', 'relay_cell'],
            minTier: 'neutral'
        },
        lyra_field: {
            name: "Dr. Lyra's Field Kit", faction: 'aegis',
            stock: ['medkit', 'stim', 'tool_nano_patch', 'tool_overcharge_cell', 'w_an94_cryo', 'w_python_frontier', 'rig_ghost', 'relic_ghost'],
            minTier: 'neutral'
        }
    };

    BO.OWRPGFactionsData = { FACTIONS, HOSTILE_GROUPS, REP_MIN, REP_MAX, SPILLOVER, TIERS, TIER_DISCOUNT, START_REP, VENDORS };
})(window.BO);
