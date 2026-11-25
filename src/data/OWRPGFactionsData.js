/* ============================================================================
   BLACKOUT OPS — Open World RPG · Factions Data
   Four factions with rivals (negative spillover), reputation tiers, colors and
   vendor stock. Raiders and the Brood are always hostile and have no reputation.
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
    // Always-hostile groups: not in the reputation matrix.
    const HOSTILE_GROUPS = ['raiders', 'brood'];

    const REP_MIN = -1000, REP_MAX = 1500;
    const SPILLOVER = 0.5; // rival loses 50% of what you gain
    const TIERS = [
        { id: 'hated', name: 'Hated', min: -1000, color: '#dc2626' },
        { id: 'shunned', name: 'Shunned', min: -499, color: '#f97316' },
        { id: 'neutral', name: 'Neutral', min: -149, color: '#cbd5e1' },
        { id: 'trusted', name: 'Trusted', min: 250, color: '#4ade80' },
        { id: 'sworn', name: 'Sworn', min: 750, color: '#fbbf24' }
    ];
    const TIER_DISCOUNT = { hated: null, shunned: null, neutral: 0, trusted: 0.12, sworn: 0.2 };

    const START_REP = { militia: 0, syndicate: 0, aegis: 0, helix: 0 };

    // Vendor stock per faction (item ids). Prices come from item value × modifiers.
    const VENDORS = {
        freestead_store: { name: "Dottie's Supply", faction: 'militia', stock: ['medkit', 'ammo_box', 'stim', 'relay_cell', 'w_carbine', 'w_rifle', 'rig_light', 'rig_plated'] },
        syndicate_fence: { name: 'Rail Yard Fence', faction: 'syndicate', stock: ['ammo_box', 'stim', 'medkit', 'w_shotgun', 'w_lmg', 'w_smg', 'rig_plated', 'relay_cell'] },
        aegis_quarter: { name: 'Aegis Quartermaster', faction: 'aegis', stock: ['medkit', 'relay_cell', 'w_dmr', 'rig_aegis'], minTier: 'neutral' },
        helix_exchange: { name: 'Helix Exchange', faction: 'helix', stock: ['stim', 'medkit', 'w_vector', 'relay_cell'], minTier: 'neutral' }
    };

    BO.OWRPGFactionsData = { FACTIONS, HOSTILE_GROUPS, REP_MIN, REP_MAX, SPILLOVER, TIERS, TIER_DISCOUNT, START_REP, VENDORS };
})(window.BO);
