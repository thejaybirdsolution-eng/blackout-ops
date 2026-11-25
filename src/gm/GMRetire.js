/* ============================================================================
   BLACKOUT OPS — Survival Gold: retired content (load time, BO.SurvivalRetired)
   Fewer, clearer choices. Runs once when the scripts load, before the field
   terminal builds its menus.
   · STATIONS: the arcane table, alchemy stand, infuser and cooking station are
     retired. Their recipes move to the two stations everyone already has:
     brewing and cooking to the campfire, attunement to the workbench.
   · BLUEPRINTS: the quantum chest (global teleport stash), the waystone
     (teleport home), and obsidian walls and stairs (1,400 HP blast-proof
     walls that made horde nights a formality) leave the build menu.
     Anything already built in a saved run keeps working.
   · MODIFIERS: rules that only inflate enemy health or damage are removed.
============================================================================ */
(function (BO) {
    'use strict';

    const RETIRED_BUILDS = new Set(['arcaneTable', 'alchemyStand', 'infuser', 'cookstation', 'quantumChest', 'waystone', 'obsidianWall', 'obsidianStairs']);
    const STATION_MOVE = { alchemy: 'campfire', arcane: 'bench', cookstation: 'campfire' };
    const RETIRED_MODIFIERS = ['sv_pmc_elite_squads', 'sv_one_life_titan', 'sv_apocalypse_chaos_sv'];

    BO.SurvivalRetired = {
        builds: RETIRED_BUILDS,
        stations: STATION_MOVE,
        isRetiredBuild(id) { return RETIRED_BUILDS.has(id); }
    };

    /* The obsidian trauma rig is replaced by the plate vest (gm/GMArmor.js). */
    const RETIRED_RECIPES = new Set(['obsidianArmor', 'craftObsidianArmor']);
    if (BO.SurvivalFrontierData?.recipes) {
        const list = BO.SurvivalFrontierData.recipes;
        for (let i = list.length - 1; i >= 0; i--) if (RETIRED_RECIPES.has(list[i].id)) list.splice(i, 1);
    }

    /* Recipes: move retired stations, and drop rune wording from the cut rune economy. */
    for (const r of BO.SurvivalFrontierData?.recipes || []) {
        if (STATION_MOVE[r.station]) r.station = STATION_MOVE[r.station];
        if (r.desc) r.desc = r.desc.replace(/\s*&\s*\+\d+\s*Runes per bottle/i, ' per bottle').replace(/\s*\+\d+\s*Runes/i, '');
    }

    /* Modifiers that are nothing but enemy stat inflation. */
    const R = BO.SurvivalRules;
    if (R?.modifiers) {
        for (const id of RETIRED_MODIFIERS) delete R.modifiers[id];
        for (const p of Object.values(R.presets || {})) {
            if (p.settings?.modifiers) p.settings.modifiers = p.settings.modifiers.filter((id) => !RETIRED_MODIFIERS.includes(id));
        }
    }
    const MC = BO.SurvivalModifiersCatalog;
    if (Array.isArray(MC?.ALL)) MC.ALL = MC.ALL.filter((m) => !RETIRED_MODIFIERS.includes(m.id || m.key));
})(window.BO);
