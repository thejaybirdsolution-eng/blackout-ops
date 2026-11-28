/* ============================================================================
   BLACKOUT OPS — Survival interface
   · Deployment screen: guided, step-by-step launch settings with live summary
   · Field Terminal: Inventory · Crafting · Build · Map · Skills · Journal · Guide
   · Context panels: contacts, storage, Sites of Grace, infusion altar, respawn
   · In-match HUD: objective bar, vitals, 10-slot hotbar, harvest feedback
============================================================================ */
(function (BO) {
    'use strict';

    const data = BO.SurvivalCampaignData;
    const career = BO.SurvivalCareer;
    const frontier = BO.SurvivalFrontierData;
    const rules = () => BO.SurvivalRules || {};
    const deepData = () => BO.SurvivalDeepData || {};
    const Icons = () => BO.SurvivalIcons;

    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const tip = (title, body, sub) => ` data-tip-title="${esc(title)}" data-tip="${esc(body)}"${sub ? ` data-tip-sub="${esc(sub)}"` : ''}`;
    const itemName = (id) => BO.SurvivalItemName ? BO.SurvivalItemName(id) : id;
    const keyOf = (action) => BO.Settings.keyLabel(BO.Settings.getKeybinds()[action]);
    const pct = (v, max = 100) => Math.max(0, Math.min(100, (v / (max || 1)) * 100));
    const plural = (n, word) => n + ' ' + word + (n === 1 ? '' : 's');

    /* ---------------------------------------------------------------- copy */
    const ITEM_INFO = {
        scrap: 'Salvaged metal parts. The common currency of the zone: trade it, build with it and craft ammunition.',
        cloth: 'Clean fabric for dressings, packs and bedding.',
        fuel: 'Rail and lantern fuel. Also pays for fast travel between discovered areas.',
        rations: 'Sealed field meal. Restores 35 food. Cook it at a campfire for a hot meal.',
        medkits: 'Trauma kit. Restores 55 health (75 with Field Medic).',
        coil: 'Superconducting coil from an MRI unit. Powers the coil prototype weapon.',
        timber: 'Rough timber from branches and trees. The base of most early building and tools.',
        stone: 'Fieldstone for tools, kilns and masonry.',
        iron: 'Iron ore. Smelt it in a kiln with coal to make iron bars.',
        coal: 'Fuel for the kiln. Mine it, or burn timber at a campfire to make charcoal.',
        copper: 'Copper ore. Draw it into wire at a workbench.',
        quartz: 'Luminous quartz. Cut it into lenses or refine it into Aether shards.',
        fiber: 'Plant fiber. Braid it into cord for tools and bindings.',
        resin: 'Pine resin. Used for torches, filters and some brews.',
        clay: 'Wet clay. Fire it in a kiln into bricks.',
        herbs: 'Bitterleaf. Medicinal herb for dressings, tea and tonics.',
        planks: 'Sawn boards. Stronger building stock and tool handles.',
        cord: 'Braided cord. Binds tool heads and building parts.',
        ingot: 'Iron bar. Needed for iron tools, packs, machines and weapon upgrades.',
        brick: 'Fired brick for masonry walls and stone foundations.',
        wire: 'Copper wire for lanterns, drills, snares and repeaters.',
        lens: 'Quartz lens. Focuses the beam of a lantern.',
        torch: 'Burns for 90 seconds. Use it, or press your light key, to light the way.',
        lantern: 'Reusable light that burns for 4 minutes. Each lighting uses one fuel.',
        bandage: 'Herbal dressing. Restores 27 health and stops bleeding.',
        tea: 'Bitterleaf tea. Restores composure, water and clears some radiation.',
        filter: 'Respirator filter. Cuts radiation buildup by 82% for two minutes.',
        repair: 'Field repair kit. Restores 24 durability to your held or equipped tool.',
        caveMap: 'Survey notes about Echo Cavern below the research trench.',
        relic: 'The Resonant Core. Required for the Hauler frame pack.',
        aetherShard: 'Luminous crystal from Frostline seam 6, refined by Black Pine. Powers resonance tools, stims, relay beacons and mods. Found in lab cabinets and refined at a kiln from quartz.',
        stew: 'Hearty stew: +65 food, +35 water, +25 health and warmth.',
        espresso: 'Field espresso: composure, water and a stamina boost.',
        antibiotic: 'Cures bleeding and infection and clears 30% radiation.',
        broth: 'Thermal broth: warms you by 18°C. Essential on freezing nights.',
        aetherStim: 'Combat stim: +45 health, full stamina and +30% speed for 20 seconds.',
        orbitalFlare: 'Calls a supply cache down from a weather balloon.',
        jugBrew: 'Juggernaut tonic: +75 max health and damage resistance for 3 minutes.',
        speedTonic: 'Quick-Hands tonic: faster reloads and fire rate for 3 minutes.',
        staminElixir: 'Stamin-Up elixir: faster sprinting and less stamina drain for 3 minutes.',
        deadshotTinc: 'Deadshot tincture: +45% headshot damage for 3 minutes.',
        cropSeeds: 'Plant these in the Relay garden beds or homestead planters and water them.',
        freshWater: 'Filtered water. Restores 50 water. Collect it at hand pumps or rain barrels.',
        salvageLine: 'Weighted line for catching fresh fish and salvage at waterside stations or along the Spillway Reservoir shore.',
        ammo9: '9×19mm handgun and submachine gun ammunition.',
        ammo556: '5.56×45mm intermediate rifle ammunition.',
        ammo762: '7.62mm full-power rifle, marksman and machine-gun ammunition.',
        ammo12: '12-gauge buckshot shells for shotguns.',
        brass: 'Spent cartridge casings. Hand-load into live ammunition at a workbench.',
        powder: 'Smokeless and black propellant for hand-loading ammunition and explosives.',
        primers: 'Boxer primers required to reload spent brass.',
        gunkit: 'Weapon repair kit. Restores 35% condition to a worn firearm and clears active jams.',
        splint: 'Field splint. Sets a broken leg after a hard fall so you stop limping.',
        painkillers: 'Analgesic tablets: +10 HP, +20 composure, and suppresses fracture limping for 90 seconds.',
        canned: 'Sealed canned food (+30 food, +8 water). Safe to eat cold.',
        battery: 'High-drain cell scavenged from electronics, radios and lab gear.',
        radioParts: 'Transceiver module used to repair radio towers and build field electronics.',
        circuit: 'Printed circuit board for turrets, optics and resonance devices.',
        keycard: 'Black Pine Campus security keycard.',
        thermals: 'Insulated thermal underlayer: grants +12°C cold protection passively while carried.',
        raw_venison: 'Fresh deer meat (+10 food raw, risk of sickness). Roast it for +30 food and +6 HP.',
        cooked_venison: 'Char-seared venison steak (+30 food, +6 HP).',
        raw_pork: 'Raw wild boar meat (+10 food raw, risk of sickness). Cook before eating.',
        cooked_pork: 'Roasted boar chop (+30 food, +6 HP).',
        raw_rabbit: 'Lean rabbit meat (+7 food raw, risk of sickness). Roast for +21 food.',
        cooked_rabbit: 'Spit-roasted rabbit (+21 food, +3 HP).',
        raw_fowl: 'Plucked pheasant (+7 food raw, risk of sickness). Roast for +21 food.',
        cooked_fowl: 'Crisp roast pheasant (+21 food, +3 HP).',
        raw_mutton: 'Mountain goat meat (+9 food raw, risk of sickness). Roast for +27 food.',
        cooked_mutton: 'Herb-seared mutton (+27 food, +6 HP).',
        raw_bear: 'Dense bear meat (+13 food raw, risk of sickness). Roast for a massive +39 food and +9 HP.',
        cooked_bear: 'Thick bear steak (+39 food, +9 HP).',
        raw_wolf: 'Stringy wolf meat (+6 food raw, risk of sickness). Better roasted (+18 food) or fed to a companion.',
        cooked_wolf: 'Charred wolf meat (+18 food, +3 HP).',
        raw_beef: 'Prime cattle cut (+12 food raw, risk of sickness). Roast for +36 food and +9 HP.',
        cooked_beef: 'Prime rib roast (+36 food, +9 HP).',
        raw_fish: 'Fresh reservoir trout (+8 food raw, risk of sickness). Catch with a salvage line; fry for +24 food.',
        cooked_fish: 'Pan-fried reservoir trout (+24 food, +6 HP).',
        egg: 'Wild pheasant egg (+4 food raw). Fry at a fire or whip into an omelette.',
        fried_egg: 'Sunny-side camp egg (+12 food, +3 HP).',
        mushroom: 'Woodland cap (+3 food raw). Roast at a campfire or simmer into soup.',
        roast_mushroom: 'Fire-toasted mushrooms (+9 food, +3 HP).',
        berries: 'Sweet forest berries (+5 food, +3 water). Also prized by wild boars.',
        honey: 'Wild golden honeycomb (+8 food, +4 HP). Never spoils; loved by brown bears.',
        jerky: 'Smoke-cured meat strips (+18 food, +2 HP). Ultralight trail ration.',
        hunter_stew: 'Rich venison, mushroom and herb stew (+70 food, +35 water, +30 HP, lasting warmth).',
        meat_pie: 'Baked crust packed with roast pork and egg (+45 food, +15 HP).',
        omelette: 'Three-egg mushroom omelette (+35 food, +20 HP, instant stamina surge).',
        mushroom_soup: 'Hot woodland broth (+30 food, +30 water, +10 HP, warms the core).',
        berry_pie: 'Warm forest berry tart (+40 food, +10 HP, +30 composure).',
        honey_ham: 'Honey-glazed boar roast (+55 food, +20 HP, 60 s health regeneration).',
        survivor_feast: 'Grand banquet (+100 food, +50 water, +50 HP, +50 composure, 2 min regeneration).',
        golden_ration: 'Gold-infused combat delicacy (+20 food, +60 HP, 30 s rapid regeneration).',
        hide: 'Untanned animal pelt. Cure it into cured leather at a crafting table or tanning rack.',
        leather: 'Supple cured leather for armour vests, bedrolls and heavy gear.',
        wool: 'Thick mountain fleece for warm bedding and winter insulation.',
        bone: 'Sturdy animal bone. Grind into bone meal fertiliser, reinforce armour, or toss to tame a lone wolf.',
        fat: 'Rendered animal tallow for candles, molotov fuel and cooking.',
        feather: 'Stiff flight feathers from wild fowl.',
        antler: 'Dense stag antler trophy used in bonecraft and trades.',
        bonemeal: 'Crushed bone fertiliser: apply to a growing crop bed to surge growth by 75% and boost harvest yield by 50%.',
        obsidian: 'Volcanic Crater glass. Extremely hard — forge Obsidian blast walls, Obsidian plate armour, and weapon cores.',
        gold_ore: 'Raw gold-bearing mountain ore. Smelt it in a stone kiln into pure gold bars.',
        gold: 'High-purity gold bar smelted from Frostline veins. Used in precision optics, resonance circuits and golden rations.',
        sand: 'Fine river sand dug from Spillway wetlands. Fire in a kiln to blow clear glass.',
        glass: 'Clear fired glass pane for bottles, spyglasses and optical lenses.',
        bottle: 'Blown glass bottle used to pack incendiary molotov cocktails.',
        flint: 'Sharp-edged chert nodule gathered from gravel beds for flint tools and strikers.',
        sulfur: 'Yellow volcanic brimstone mined from ash vents; essential for gunpowder and fireworks.',
        salt: 'Crystalline rock salt for curing jerky and tanning raw hides into leather.',
        candle: 'Tallow candle: burns for 4 minutes of warm handheld light when lit.',
        leather_armor: 'Stitched leather vest: restores +60 armour.',
        hide_armor: 'Bone-reinforced heavy coat: restores +100 armour.',
        obsidian_armor: 'Volcanic glass & alloy trauma rig: raises max armour to 180 and restores +140 armour.',
        frag_grenade: 'Fragmentation grenade. Use from pack to arm on your belt, or hold on hotbar and throw directly.',
        molotov: 'Incendiary firebomb. Detonates in a 6 m carpet of flame that burns infected and clears nests.',
        spyglass: '4.5× brass recon optic. Use to look through a rangefinding scope and mark nearby sites, threats and dungeons.',
        bedroll: 'Portable wool-and-hide roll. Sleep rough anywhere safe to skip night or recover composure.',
        fishing_bait: 'Scented bait: automatically used when casting a salvage line to cut bite wait nearly in half and double your fish & salvage catch.',
        scrap_wheel: 'Reinforced rubber-and-iron wheel for building custom vehicles.',
        engine_parts: 'Rebuilt small-block engine assembly for custom Zone vehicles.',
        fireworks: 'Signal skyrocket: calls an immediate supply airdrop, but alerts every infected within 200 m.',
        optic_kit: 'Precision lens & rail kit crafted at an Armory bench for mounting rifle scopes and sights.',
        suppressor_kit: 'Baffled muzzle suppressor kit that cuts gunshot noise down to 22 m.',
        mag_kit: 'High-tension spring & extended magazine housing kit.'
    };
    const MODE_META = {
        expedition: { glyph: 'crystal', tags: ['Story', 'Boss'], length: 'Medium' },
        homestead: { glyph: 'build', tags: ['Building', 'Relaxed'], length: 'Short' },
        survey: { glyph: 'scroll', tags: ['Exploration'], length: 'Medium' },
        salvage: { glyph: 'pick', tags: ['Gathering', 'Hauling'], length: 'Medium' },
        bounty: { glyph: 'rifle', tags: ['Combat', 'Hunt'], length: 'Short' },
        siege: { glyph: 'wall', tags: ['Defense', 'Waves'], length: 'Short' },
        bloodmoon: { glyph: 'fire', tags: ['Defense', 'Night'], length: 'Medium' },
        gauntlet: { glyph: 'blade', tags: ['Bosses', 'Hard'], length: 'Long' },
        scavenger: { glyph: 'fist', tags: ['Unarmed start', 'Crafting'], length: 'Long' },
        freeplay: { glyph: 'leaf', tags: ['Sandbox', 'Endless'], length: 'Endless' }
    };
    const DIFF_INFO = {
        customLite: 'For learning the zone. Enemies are fragile, slow to appear and few in number.',
        relaxed: 'Forgiving fights with breathing room between encounters.',
        standard: 'The intended balance of scarcity and danger.',
        hard: 'Tougher infected, harder hits and more of them.',
        veteran: 'Punishing fights. Mistakes are costly.',
        nightmare: 'Relentless pressure for seasoned survivors.',
        apocalypse: 'Maximum threat. Expect to lose expeditions.'
    };
    const START_TIMES = [
        [6, '06:00', 'Dawn', 'Begin at first light with a full day ahead.'],
        [8, '08:00', 'Morning', 'The default. Plenty of daylight to gather and build before night.'],
        [12, '12:00', 'Noon', 'Half a day of light before the first night.'],
        [18, '18:00', 'Dusk', 'Night arrives within the hour. Find shelter fast.'],
        [22, '22:00', 'Night', 'Start in darkness. Night brings more roaming infected.'],
        [0, '00:00', 'Midnight', 'The hardest start: six hours of darkness.']
    ];
    const DAY_LENGTHS = [
        [180, '3 min', 'A full day-night cycle every 3 real minutes. Days and threat escalate fast.'],
        [360, '6 min', 'The default. A full day-night cycle every 6 real minutes.'],
        [720, '12 min', 'Long days. Threat escalates slowly, leaving more time to build.']
    ];
    const ENCOUNTER = [
        [0.7, 'Sparse', 'About 30% fewer roaming enemies at any time.'],
        [1, 'Standard', 'The normal number of roaming enemies for each day.'],
        [1.5, 'Intense', '50% more enemies may roam at once.']
    ];
    const STATION_NAME = {
        hand: 'By hand',
        bench: 'Workbench',
        campfire: 'Campfire',
        kiln: 'Kiln',
        cookstation: 'Cooking station',
        alchemy: 'Alchemy stand',
        arcane: 'Arcane table'
    };
    const STATION_TIP = {
        hand: 'Craft anywhere, straight from your backpack.',
        bench: 'Stand within 4 m of the Relay shelter, a Survivor Fort, or a crafting table you built.',
        campfire: 'Stand within 4 m of a campfire you built (safehouse & fort stoves also work).',
        kiln: 'Stand within 4 m of a stone kiln you built.',
        cookstation: 'Stand within 4 m of a cooking station you built. It also counts as a campfire.',
        alchemy: 'Stand within 4 m of an Alchemy Brewing Stand you built or found in a fort.',
        arcane: 'Stand within 4 m of an Arcane Enchanting Table you built or found.'
    };
    const CRAFT_CATS = [
        ['all', 'All recipes', 'grid'], ['tools', 'Tools', 'axe'], ['materials', 'Materials', 'ingot'],
        ['medical', 'Medical', 'medkit'], ['potions', 'Alchemy', 'flask'], ['food', 'Food & drink', 'cup'],
        ['lighting', 'Lighting', 'torch'], ['gear', 'Gear & gadgets', 'chest'], ['weapons', 'Weapons', 'rifle'], ['vehicles', 'Vehicles', 'wheel']
    ];
    const BUILD_TABS = [
        ['shelter', 'Shelter', 'roof'], ['craft', 'Workshop', 'bench'], ['light', 'Light & fire', 'torch'], ['storage', 'Storage', 'chest'],
        ['farm', 'Farm & water', 'seed'], ['defence', 'Defence', 'spikes'], ['power', 'Power', 'battery']
    ];
    const BUILD_TAB_OF = {};
    for (const [tab, ids] of Object.entries({
        shelter: ['wall', 'floor', 'roof', 'door', 'woodDoor', 'ironDoor', 'doubleGate', 'ladder', 'bed', 'platform', 'woodStairs', 'stoneStairs', 'obsidianStairs',
            'stoneWall', 'stoneFloor', 'halfWall', 'stoneHalfWall', 'windowWall', 'archway', 'catwalk', 'railing', 'pillar', 'concreteWall', 'obsidianWall', 'outpost'],
        craft: ['bench', 'kiln', 'smelter', 'armoryBench', 'tanrack', 'smoker', 'cookstation', 'alchemyStand', 'arcaneTable', 'infuser'],
        light: ['campfire', 'firepit', 'wallTorch', 'lanternPost', 'floodlight', 'searchlight', 'beacon'],
        storage: ['chest', 'supplyCrate', 'ironVault', 'quantumChest', 'autoCollector', 'stashUplink'],
        farm: ['planter', 'rainbarrel', 'compostBin', 'coop', 'goatPen', 'wellPump', 'hydro', 'purifier', 'growLamp'],
        defence: ['spikes', 'wire', 'barbedWire', 'spikeWall', 'sandbagWall', 'watchtower', 'turret', 'eFence', 'alarm'],
        power: ['generator', 'solarPanel', 'batteryBank', 'windTurbine', 'pylon']
    })) for (const id of ids) BUILD_TAB_OF[id] = tab;
    /** Blueprints retired from the build menu (kept in data so old saves still load). */
    const BUILD_HIDDEN = BO.SurvivalRetired?.builds || new Set();
    const RECIPE_CAT = {
        braid: 'materials', sawBoards: 'materials', smelt: 'materials', fireBricks: 'materials', drawWire: 'materials',
        cutLens: 'materials', charcoal: 'materials', smeltAetherAlloy: 'materials', makePowder: 'materials', salvageRadio: 'materials',
        splint: 'lighting', makeLantern: 'lighting',
        dressing: 'medical', craftAntibiotic: 'medical', craftAetherStim: 'medical', makeFilter: 'medical', medkit: 'medical', makeSplint: 'medical',
        brewTea: 'food', cookStew: 'food', brewEspresso: 'food', brewBroth: 'food', cook: 'food',
        brewJug: 'food', brewSpeed: 'food', brewStamin: 'food', brewDeadshot: 'food',
        fieldRepair: 'gear', weighTheLine: 'gear', craftOrbitalFlare: 'gear', ammo: 'gear', incendiary: 'gear',
        makeGunkit: 'gear', makeThermals: 'gear',
        reload9: 'weapons', reload556: 'weapons', reload762: 'weapons', reload12: 'weapons',
        coilgun: 'weapons'
    };
    if (BO.ZoneExpansionData?.ITEM_DESCRIPTIONS) Object.assign(ITEM_INFO, BO.ZoneExpansionData.ITEM_DESCRIPTIONS);
    BO.SurvivalItemInfo = ITEM_INFO;
    const TABS = [
        { id: 'inventory', label: 'Inventory', bind: 'survInventory', glyph: 'chest' },
        { id: 'crafting', label: 'Crafting', bind: 'survCraft', glyph: 'wrench' },
        { id: 'build', label: 'Build', bind: 'survBuild', glyph: 'build' },
        { id: 'map', label: 'Map', bind: 'survMap', glyph: 'scroll' },
        { id: 'base', label: 'Base', bind: 'survBase', glyph: 'build' },
        { id: 'skills', label: 'Skills', bind: 'survSkills', glyph: 'tech' },
        { id: 'journal', label: 'Journal', bind: 'survJournal', glyph: 'flask' },
        { id: 'catalogue', label: 'Catalogue', bind: 'survCatalogue', glyph: 'feather' },
        { id: 'legend', label: 'Guide', bind: 'survLegend', glyph: 'rune' }
    ];
    const ALIAS = { pack: 'inventory', workshop: 'crafting', travel: 'fasttravel', tech: 'skills', objectives: 'journal', record: 'journal' };
    const CONTEXT = new Set(['gmRespawn', 'gmPanel', 'chest', 'npc', 'shrine', 'infuser', 'fasttravel', 'respawn', 'ending', 'epilogue']);
    const COMPACT_SECTIONS = new Set(['inventory', 'crafting', 'build', 'chest', 'npc', 'shrine', 'infuser', 'fasttravel']);
    const STEPS = [
        ['quick', 'Quick start', 'Pick a ready-made expedition'],
        ['operation', 'Operation', 'What you are trying to do'],
        ['difficulty', 'Difficulty', 'How dangerous the zone is'],
        ['world', 'World & time', 'Clock, weather and encounters'],
        ['rules', 'Survival rules', 'Needs and saving'],
        ['modifiers', 'Modifiers', 'Optional twists'],
        ['roster', 'Enemy roster', 'Which infected can appear'],
        ['career', 'The Archive', 'Mastery tree, kits, stash packing, blueprints and chronicle']
    ];
    const RES_COLOR = {
        pine: '#7fb07a', hardwood: '#b2a36b', boulder: '#a9b3ae', iron: '#d39a7c', coal: '#7d8191', copper: '#7cc6ad',
        quartz: '#a8e3f5', deep: '#d6aef2', clay: '#b88b6d', buried: '#b7cf8f', kindling: '#a88a62', stones: '#b4b9b1',
        roots: '#93b97c', herbs: '#8fc77a',
        emerald_vein: '#34d399', diamond_seam: '#38bdf8', lapis_outcrop: '#60a5fa', flux_vein: '#f87171',
        wheat_patch: '#facc15', root_patch: '#fb923c', melon_patch: '#84cc16', reed_clump: '#a3e635'
    };

    function costRows(cost, have) {
        return Object.entries(cost || {}).map(([id, need]) => {
            const owned = have[id] || 0;
            const ok = owned >= need;
            return `<li class="sv-cost ${ok ? 'ok' : 'short'}"${tip(itemName(id), ITEM_INFO[id] || 'Crafting material.', 'You have ' + owned)}>
                <span class="sv-cost-ico">${Icons().item(id, 18)}</span><span class="sv-cost-name">${esc(itemName(id))}</span>
                <span class="sv-cost-num"><b>${owned}</b>/${need}</span></li>`;
        }).join('');
    }
    function costInline(cost, have) {
        return Object.entries(cost || {}).map(([id, need]) =>
            `<span class="sv-chip-cost ${((have[id] || 0) >= need) ? 'ok' : 'short'}">${Icons().item(id, 14)}${need}</span>`).join('');
    }
    function meter(label, value, max, cls, title, body) {
        return `<div class="sv-vital ${cls || ''}"${tip(title || label, body || '')}>
            <span class="sv-vital-l">${label}</span>
            <span class="sv-vital-bar"><i style="width:${pct(value, max)}%"></i></span>
            <span class="sv-vital-v">${Math.round(value)}</span></div>`;
    }

    class SurvivalUI {
        constructor() {
            this.section = null;
            this.step = 'quick';
            this.packFilter = 'All';
            this.packSort = 'category';
            this.craftCat = 'all';
            this.mapLayers = { sites: true, threats: true, contacts: true, resources: false, base: true };
            this.mapZoom = 1;
            this.mapPan = { x: 0, z: 0 };
            this.mapWaypoint = null;
            this._mapDrag = null;
            this.scrollMemo = {};
        }

        get open() { return !!this.dialog?.open; }

        /* ------------------------------------------------------------ lifecycle */
        show(section, deploy, subject) {
            if (!this.dialog) this.create();
            section = ALIAS[section] || section;
            if (BO.GM?.get('loot')?.pendingRespawn && BO.SurvivalMode.active) section = 'gmRespawn'; // the fallen choose a bed first
            this.returnToBriefing = section === 'legend' && !BO.SurvivalMode.active;
            if (this.section !== section) this.feedback = null;
            this.section = section;
            this.subject = subject;
            if (deploy) this.deploy = deploy;
            if (section !== 'briefing' && BO.SurvivalMode.active) {
                BO.App._clearInputState();
                if (document.pointerLockElement) document.exitPointerLock();
            }
            BO.Tooltips?.hide?.();
            if (!this.open) this.dialog.showModal();
            const isDeploy = section === 'briefing' || (section === 'legend' && this.returnToBriefing);
            this.dialog.classList.toggle('sv-is-deploy', isDeploy);
            this.dialog.classList.toggle('sv-compact', !isDeploy && COMPACT_SECTIONS.has(section));
            this.dialog.dataset.section = section || '';
            this.render();
        }

        create() {
            this.dialog = document.createElement('dialog');
            this.dialog.className = 'sv-shell';
            this.dialog.setAttribute('aria-label', 'Survival');
            this.dialog.innerHTML = '<div class="sv-root"></div><div class="sv-map-tip" hidden></div>';
            this.root = this.dialog.querySelector('.sv-root');
            this.mapTip = this.dialog.querySelector('.sv-map-tip');
            document.body.append(this.dialog);

            this.dialog.addEventListener('cancel', (event) => {
                event.preventDefault();
                if (this.section === 'respawn' || this.section === 'gmRespawn') return;
                if (this.section === 'legend' && this.returnToBriefing) { this.section = 'briefing'; this.render(); return; }
                if (this.section === 'briefing') this.close();
                else this.resume();
            });
            this.dialog.addEventListener('mousedown', (event) => {
                if (event.target !== this.dialog) return;
                if (this.section === 'respawn' || this.section === 'gmRespawn' || this.section === 'ending' || this.section === 'epilogue' || this.section === 'briefing') return;
                BO.Sound?.playUIClick?.();
                this.resume();
            });
            this.root.addEventListener('submit', (e) => e.preventDefault());
            this.root.addEventListener('click', (e) => {
                if (e.target.closest('.mm-shell')) return;
                const el = e.target.closest('[data-act]');
                if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
                this.act(el.dataset.act, el.dataset.arg, e, el);
            });
            this.root.addEventListener('contextmenu', (e) => {
                if (this.moveFromTile(e, 'half')) return;
                const slot = e.target.closest('[data-hb-slot]');
                if (slot && this.section === 'inventory') {
                    e.preventDefault();
                    BO.SurvivalMode.campaign?.hotbar.clear(Number(slot.dataset.hbSlot));
                    this.render();
                }
            });
            this.root.addEventListener('input', (e) => {
                if (e.target.id === 'sv-seed-input') {
                    const clean = String(e.target.value || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20);
                    career.remember({ ...career.profile.options, seed: clean, daily: false });
                    const tag = this.root.querySelector('#sv-sum-seed');
                    if (tag) tag.textContent = clean || 'Random';
                    return;
                }
                if (e.target.id === 'sv-craft-search') {
                    this.craftQuery = e.target.value;
                    const host = this.root.querySelector('#sv-rec-rows');
                    if (host) { host.innerHTML = this.craftRows(this.craftList().all).rows; host.scrollTop = 0; }
                    return;
                }
                if (e.target.matches('[data-survival-guide-search]')) {
                    const content = this.root.querySelector('[data-survival-guide-topics]');
                    if (content) content.innerHTML = BO.ModeGuide.render('survival', e.target.value);
                }
            });
            // Drag & drop onto the hotbar.
            this._dragSourceEl = null;
            this._dragDropped = false;
            this.root.addEventListener('dragstart', (e) => {
                const el = e.target.closest('[data-drag]');
                if (!el) return;
                this._dragSourceEl = el;
                this._dragDropped = false;
                e.dataTransfer.setData('text/plain', el.dataset.drag);
                e.dataTransfer.effectAllowed = 'move';
                this.root.classList.add('sv-dragging');
                BO.Sound?.playUIDragStart?.();
            });
            this.root.addEventListener('dragend', () => {
                this.root.classList.remove('sv-dragging');
                this.root.querySelectorAll('.is-drop').forEach((n) => n.classList.remove('is-drop'));
                if (!this._dragDropped && this._dragSourceEl && this._dragSourceEl.isConnected) {
                    const src = this._dragSourceEl;
                    src.classList.remove('bo-snap-back');
                    void src.offsetWidth;
                    src.classList.add('bo-snap-back');
                    setTimeout(() => src.classList.remove('bo-snap-back'), 240);
                    BO.Sound?.playUIDisabled?.();
                }
                this._dragSourceEl = null;
                this._dragDropped = false;
            });
            this.root.addEventListener('dragover', (e) => {
                const slot = e.target.closest('[data-hb-slot], [data-drop-clear]');
                if (!slot) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                this.root.querySelectorAll('.is-drop').forEach((n) => n !== slot && n.classList.remove('is-drop'));
                slot.classList.add('is-drop');
            });
            this.root.addEventListener('dragleave', (e) => {
                const slot = e.target.closest('[data-hb-slot], [data-drop-clear]');
                if (slot && (!e.relatedTarget || !slot.contains(e.relatedTarget))) {
                    slot.classList.remove('is-drop');
                }
            });
            this.root.addEventListener('drop', (e) => {
                const slot = e.target.closest('[data-hb-slot], [data-drop-clear]');
                if (!slot) return;
                e.preventDefault();
                slot.classList.remove('is-drop');
                const payload = e.dataTransfer.getData('text/plain');
                const hotbar = BO.SurvivalMode.campaign?.hotbar;
                if (!hotbar || !payload) return;
                const [kind, ...rest] = payload.split(':');
                const id = rest.join(':');
                let changed = false;
                if (slot.dataset.dropClear !== undefined) {
                    if (kind === 'slot') { hotbar.clear(Number(id)); changed = true; }
                } else {
                    const to = Number(slot.dataset.hbSlot);
                    if (kind === 'slot') { hotbar.move(Number(id), to); changed = true; }
                    else if (typeof this.assignToHotbar === 'function') { this.assignToHotbar(to, kind, id); changed = true; }
                }
                if (changed) {
                    this._dragDropped = true;
                    BO.Sound?.playUIDrop?.();
                    this.render();
                }
            });
            this.root.addEventListener('mousedown', (e) => {
                if (e.target.id !== 'sv-map-canvas' || e.button !== 0 || this.section !== 'map') return;
                this._mapDrag = { cx: e.clientX, cy: e.clientY, startPan: { ...this.mapPan }, moved: false, canvas: e.target };
            });
            this.root.addEventListener('mousemove', (e) => {
                if (this._mapDrag && this.section === 'map') {
                    const dx = e.clientX - this._mapDrag.cx;
                    const dy = e.clientY - this._mapDrag.cy;
                    if (!this._mapDrag.moved && Math.hypot(dx, dy) > 4) this._mapDrag.moved = true;
                    if (this._mapDrag.moved) {
                        const rect = this._mapDrag.canvas.getBoundingClientRect();
                        const b = this._mapBounds();
                        const spanX = (b.x1 - b.x0) / Math.max(1, this.mapZoom);
                        const spanZ = (b.z1 - b.z0) / Math.max(1, this.mapZoom);
                        this.mapPan.x = this._mapDrag.startPan.x - (dx / Math.max(1, rect.width)) * spanX;
                        this.mapPan.z = this._mapDrag.startPan.z - (dy / Math.max(1, rect.height)) * spanZ;
                        this.mapTip.hidden = true;
                        this.drawMap();
                        return;
                    }
                }
                if (e.target.id === 'sv-map-canvas') this.mapHover(e);
                else if (!this.mapTip.hidden) this.mapTip.hidden = true;
            });
            window.addEventListener('mouseup', (e) => {
                const drag = this._mapDrag;
                this._mapDrag = null;
                if (!drag || drag.moved || this.section !== 'map' || e.target !== drag.canvas) return;
                const rect = drag.canvas.getBoundingClientRect();
                const px = ((e.clientX - rect.left) / Math.max(1, rect.width)) * drag.canvas.width;
                const py = ((e.clientY - rect.top) / Math.max(1, rect.height)) * drag.canvas.height;
                const proj = this._mapProjection(drag.canvas);
                const wx = Math.round(proj.wx(px));
                const wz = Math.round(proj.wz(py));
                if (BO.GM?.active && BO.GM.get('dev')?.mapClick?.(wx, wz)) return; // Dev Mode: click to teleport
                if (this.mapWaypoint && Math.hypot(wx - this.mapWaypoint.x, wz - this.mapWaypoint.z) < 12 / Math.max(1, this.mapZoom)) {
                    this.mapWaypoint = null;
                } else {
                    this.mapWaypoint = { x: wx, z: wz };
                }
                this.render();
            });
            this.root.addEventListener('wheel', (e) => {
                // Shift + scroll over a stack moves one per notch; plain scrolling still scrolls the list.
                if (e.shiftKey && (e.deltaY || e.deltaX) && e.target.closest?.('[data-mv-act]')) {
                    e.preventDefault();
                    // Trackpads fire many small wheel events; one item per 70 ms keeps it controllable.
                    const now = performance.now();
                    if (now - (this._mvWheelAt || 0) < 70) return;
                    this._mvWheelAt = now;
                    this.moveFromTile(e, 'one');
                    return;
                }
                if (e.target.id !== 'sv-map-canvas' || this.section !== 'map') return;
                e.preventDefault();
                const next = e.deltaY < 0 ? Math.min(4, this.mapZoom + 0.5) : Math.max(1, this.mapZoom - 0.5);
                if (next !== this.mapZoom) {
                    this.mapZoom = next;
                    if (next === 1) this.mapPan = { x: 0, z: 0 };
                    this.drawMap();
                    const zEl = this.root.querySelector('#sv-map-zoom');
                    if (zEl) zEl.textContent = this.mapZoom.toFixed(1).replace(/\.0$/, '') + '×';
                }
            }, { passive: false });
            this.root.addEventListener('mouseleave', () => { this.mapTip.hidden = true; });
        }

        /**
         * Survival compass tape: cardinal points plus pips for the Lantern, the current objective,
         * your pinned waypoint, the nearest secured safehouse and your body bag. ±90° field of view.
         */
        drawCompass(el, deg, label) {
            const PX = 2.1; // pixels per degree
            const hidden = !!BO.SurvivalMode.campaign?.has('sv_no_map_gps') || !!BO.SurvivalMode.campaign?.has('sv_no_compass');
            el.style.visibility = hidden ? 'hidden' : '';
            if (hidden) return;
            if (!this._cmp || this._cmp.el !== el || !el.classList.contains('sv-compass')) {
                el.classList.add('sv-compass');
                el.innerHTML = '<div class="cmp-tape"></div><div class="cmp-read"></div><i class="cmp-mid"></i>';
                const tape = el.firstChild;
                const marks = [];
                for (let a = 0; a < 360; a += 15) {
                    const card = a % 45 === 0 ? ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][a / 45] : null;
                    const m = document.createElement('span');
                    m.className = card ? 'cmp-card' + (a % 90 === 0 ? ' major' : '') : 'cmp-tick';
                    m.textContent = card || '';
                    tape.appendChild(m);
                    marks.push({ a, m });
                }
                const pips = {};
                for (const [id, cls, glyph] of [['lantern', 'lantern', '✦'], ['objective', 'obj', '◆'], ['waypoint', 'wp', '●'], ['safe', 'safe', '⌂'], ['body', 'body', '✚'], ['event', 'event', '⚑'], ['contract', 'contract', '✪'], ['site', 'site', '☠']]) {
                    const p = document.createElement('span');
                    p.className = 'cmp-pip ' + cls;
                    p.innerHTML = `<b>${glyph}</b><small></small>`;
                    tape.appendChild(p);
                    pips[id] = p;
                }
                this._cmp = { el, marks, pips, read: el.children[1] };
            }
            const cmp = this._cmp;
            const wrap = (d) => ((d + 540) % 360) - 180;
            for (const { a, m } of cmp.marks) {
                const off = wrap(a - deg);
                const vis = Math.abs(off) < 92;
                m.style.display = vis ? '' : 'none';
                if (vis) m.style.transform = `translateX(${(off * PX).toFixed(1)}px)`;
            }
            cmp.read.textContent = String(deg).padStart(3, '0') + '°';
            const P = BO.Player;
            const v = P.getMoveDirectionVectors();
            const f = v.forward, r = v.right;
            const mode = BO.SurvivalMode;
            const c = mode.campaign;
            const place = (id, t, showDist = true) => {
                const pip = cmp.pips[id];
                if (!t) { pip.style.display = 'none'; return; }
                const dx = t.x - P.pos.x, dz = t.z - P.pos.z;
                const dist = Math.hypot(dx, dz);
                if (dist < 2) { pip.style.display = 'none'; return; }
                const rel = Math.atan2(dx * r.x + dz * r.z, dx * f.x + dz * f.z) * 180 / Math.PI;
                const clamped = Math.max(-88, Math.min(88, rel));
                pip.style.display = '';
                pip.classList.toggle('edge', clamped !== rel);
                pip.style.transform = `translateX(${(clamped * PX).toFixed(1)}px)`;
                pip.lastChild.textContent = showDist ? (dist >= 1000 ? (dist / 1000).toFixed(1) + ' km' : Math.round(dist) + ' m') : '';
            };
            place('lantern', BO.Zone.LANTERN, false);
            place('objective', c?.objectives.target?.());
            place('waypoint', this.mapWaypoint);
            let best = null, bd = Infinity;
            for (const s of c?.objectives.safehouses?.() || []) {
                const d = Math.hypot(s.x - P.pos.x, s.z - P.pos.z);
                if (d < bd) { bd = d; best = s; }
            }
            place('safe', bd > 30 ? best : null);
            const body = c?.pack.bags.get('bag:body' + mode.deaths);
            place('body', body || null);
            const evs = BO.ZoneEvents?.points() || [];
            let ev = null, ed = Infinity;
            for (const e of evs) { const d = Math.hypot(e.x - P.pos.x, e.z - P.pos.z); if (d < ed) { ed = d; ev = e; } }
            place('event', ev);
            if (ev) cmp.pips.event.style.color = ev.color;
            let kp = null, kd = Infinity;
            for (const k of BO.ZoneContracts?.points() || []) { const d = Math.hypot(k.x - P.pos.x, k.z - P.pos.z); if (d < kd) { kd = d; kp = k; } }
            place('contract', kp);
            place('site', BO.ZoneInfest?.nearestInfested?.(150) || null);
        }

        /** Called every frame while the terminal is open and the world keeps running. Taking damage snaps you out. */
        liveRefresh() {
            const hp = BO.Player.hp;
            // Only a real attacker closes the menu: bleeding, hunger, cold and radiation ticks do not.
            const sm = BO.SurvivalMode;
            const pp = BO.Player.pos;
            const attacker = [...(sm.zombies || []), ...(sm.bots || [])].some((e) => e.alive && e.team !== 0 && Math.hypot(e.pos.x - pp.x, e.pos.z - pp.z) < 7);
            if (this._hpSeen !== undefined && hp < this._hpSeen - 0.5 && BO.Player.alive && attacker) {
                this._hpSeen = undefined;
                this.resume();
                BO.SurvivalMode.toast('You are under attack!');
                return;
            }
            this._hpSeen = hp;
        }

        resume() {
            this._hpSeen = undefined;
            if (this.section === 'respawn' || (this.section === 'gmRespawn' && BO.GM?.get('loot')?.pendingRespawn)) return;
            const playing = BO.SurvivalMode.active && this.section !== 'briefing';
            this.close();
            if (playing) BO.App._safePointerLock();
        }

        close() {
            if (!this.open) return;
            const playing = BO.SurvivalMode.active && this.section !== 'briefing';
            BO.Tooltips?.hide?.();
            this.mapTip.hidden = true;
            this.dialog.close();
            this.feedback = null;
            this.selItem = null;
            if (playing) BO.App._clearInputState();
        }

        /** Keyboard while the terminal is open (called from the global key handler). */
        handleKey(e) {
            if (!this.open || this.section === 'briefing' || this.section === 'respawn' || this.section === 'gmRespawn') return;
            const kb = BO.Settings.getKeybinds();
            const code = e.code;
            for (const t of TABS) {
                if (code === kb[t.bind]) {
                    e.preventDefault();
                    if (this.section === t.id || (t.id === 'map' && code === kb.survTravel)) this.resume();
                    else this.switchTab(t.id);
                    return;
                }
            }
            if (code === kb.survTravel) {
                e.preventDefault();
                if (this.section === 'fasttravel') this.resume();
                else this.switchTab('fasttravel');
                return;
            }
            if (this.section === 'inventory' && this.selItem) {
                for (let i = 0; i < 10; i++) {
                    if (code === kb['hotbar' + (i + 1)]) {
                        e.preventDefault();
                        const s = this.selItem;
                        this.assignToHotbar(i, s.kind, s.id);
                        this.render();
                        return;
                    }
                }
            }
        }

        switchTab(id) {
            this.section = id;
            this.subject = null;
            this.feedback = null;
            if (this.dialog) {
                const isDeploy = id === 'briefing' || (id === 'legend' && this.returnToBriefing);
                this.dialog.classList.toggle('sv-is-deploy', isDeploy);
                this.dialog.classList.toggle('sv-compact', !isDeploy && COMPACT_SECTIONS.has(id));
                this.dialog.dataset.section = id || '';
            }
            this.render();
        }

        /* ------------------------------------------------------------ actions */
        act(name, arg, event, el) {
            const mode = BO.SurvivalMode;
            const c = mode.campaign;
            BO.Sound?.playUIClick?.();
            switch (name) {
                // ----- deployment
                case 'step': this.step = arg; return this.renderBriefing(true);
                case 'opt': {
                    const opts = { ...career.profile.options };
                    const key = el.dataset.key;
                    opts[key] = ['startHour', 'dayLength', 'encounterRate'].includes(key) ? Number(arg) : arg;
                    career.remember(opts);
                    this.activePreset = null;
                    return this.renderBriefing();
                }
                case 'toggle': {
                    const opts = { ...career.profile.options };
                    opts[arg] = !opts[arg];
                    career.remember(opts);
                    this.activePreset = null;
                    return this.renderBriefing();
                }
                case 'preset': {
                    const p = rules().presets?.[arg];
                    if (!p) return;
                    career.remember({ ...data.defaults, gameType: 'expedition', modifiers: [], disabledEnemies: career.profile.options.disabledEnemies, ...p.settings });
                    this.activePreset = arg;
                    return this.renderBriefing();
                }
                case 'roster': {
                    const opts = { ...career.profile.options };
                    const set = new Set(opts.disabledEnemies);
                    const total = BO.Zone.bestiary().length;
                    if (set.has(arg)) set.delete(arg);
                    else if (set.size < total - 1) set.add(arg);
                    opts.disabledEnemies = [...set];
                    career.remember(opts);
                    if (BO.ZombieCustomizer) BO.ZombieCustomizer.setDisabledEnemies(opts.disabledEnemies);
                    return this.renderBriefing();
                }
                case 'rosterBulk': {
                    const opts = { ...career.profile.options };
                    const ids = BO.Zone.bestiary().map((z) => z.id);
                    // 'light' keeps the six lighter types; 'noHeavy' drops the three armoured heavies.
                    opts.disabledEnemies = arg === 'all' ? [] : arg === 'light' ? ids.slice(6) : ids.slice(-3);
                    career.remember(opts);
                    if (BO.ZombieCustomizer) BO.ZombieCustomizer.setDisabledEnemies(opts.disabledEnemies);
                    return this.renderBriefing();
                }
                case 'openZombieCustomizer': {
                    if (!BO.Menus || !BO.Menus.openEnemyPoolModal) return;
                    BO.Sound?.playUIClick?.();
                    const wasOpen = this.dialog && this.dialog.open;
                    if (wasOpen) this.dialog.close();
                    BO.Menus.openEnemyPoolModal({
                        mode: 'survival',
                        onClose: () => {
                            if (wasOpen && this.dialog && !this.dialog.open) this.dialog.showModal();
                            this.renderBriefing();
                        }
                    });
                    return;
                }
                case 'deploy': {
                    const callback = this.deploy;
                    const resume = arg === 'resume' ? career.checkpoint : null;
                    const options = resume ? resume.options : career.profile.options;
                    if (!options || !callback) return;
                    this.close();
                    callback({ mode: 'survival', mapId: 'exclusion_zone', ...options, ...(resume ? { resume } : {}) });
                    return;
                }
                case 'legendFromBrief': this.section = 'legend'; this.returnToBriefing = true; return this.render();
                case 'devToggle': { const D = BO.GM?.get('dev'); if (D) { D.setEnabled(!D.enabled); BO.Sound?.playUIClick?.(); } return this.render(); }
                case 'backToBrief': this.section = 'briefing'; return this.render();
                case 'closeBrief': return this.close();
                case 'buyMastery':
                    career.buyMastery(arg);
                    return this.renderBriefing();
                case 'intelOpen':
                    this.intelOpen = this.intelOpen === arg ? null : arg;
                    return this.renderBriefing();
                case 'respecMastery': {
                    const refunded = career.respecMastery();
                    if (refunded > 0) BO.Events.emit('hud:toast', { text: 'Mastery reset: +' + refunded + ' commendations refunded.', color: '#a6ddd0' });
                    return this.renderBriefing();
                }
                case 'setKit':
                    career.setKit(arg);
                    return this.renderBriefing();
                case 'setTier': {
                    const t = Math.max(1, Math.min(career.maxTier, Number(arg) || 1));
                    career.remember({ ...career.profile.options, zoneTier: t });
                    return this.renderBriefing();
                }
                case 'rollSeed': {
                    const nextSeed = BO.ZoneSeed ? BO.ZoneSeed.randomSeed() : 'ZONE-001';
                    career.remember({ ...career.profile.options, seed: nextSeed, daily: false });
                    return this.renderBriefing();
                }
                case 'clearSeed': {
                    career.remember({ ...career.profile.options, seed: '', daily: false });
                    return this.renderBriefing();
                }
                case 'dailyRun': {
                    if (!BO.ZoneSeed) return;
                    const d = BO.ZoneSeed.daily();
                    career.remember({ ...career.profile.options, gameType: 'expedition', difficulty: d.difficulty, startHour: d.startHour, modifiers: d.modifiers, seed: d.seed, daily: true });
                    this.activePreset = null;
                    return this.renderBriefing();
                }
                case 'packStash': {
                    const [itemId, deltaStr] = String(arg || '').split(':');
                    career.adjustPackedStash?.(itemId, Number(deltaStr) || 0);
                    return this.renderBriefing();
                }
                case 'clearPacked':
                    career.clearPackedStash?.();
                    return this.renderBriefing();
                case 'resetCareer': {
                    if (!this._confirmReset) {
                        this._confirmReset = true;
                        setTimeout(() => { this._confirmReset = false; }, 5000);
                        return this.renderBriefing();
                    }
                    this._confirmReset = false;
                    career.resetCareer?.();
                    return this.renderBriefing();
                }
                case 'a11yColor': {
                    BO.Settings?.set?.('colorBlindMode', arg || 'none');
                    return this.section === 'briefing' ? this.renderBriefing() : this.render();
                }
                case 'a11ySub': {
                    BO.Settings?.set?.('subtitles', !BO.Settings?.get?.('subtitles'));
                    return this.section === 'briefing' ? this.renderBriefing() : this.render();
                }
                case 'a11yMotion': {
                    BO.Settings?.set?.('reducedMotion', !BO.Settings?.get?.('reducedMotion'));
                    return this.section === 'briefing' ? this.renderBriefing() : this.render();
                }
            }
            if (!mode.active || !c) return;
            const deep = c.deep;
            const pack = c.pack;
            const hotbar = c.hotbar;
            switch (name) {
                case 'tab': return this.switchTab(arg);
                case 'close': return this.resume();
                case 'selItem': {
                    const [kind, ...rest] = arg.split(':');
                    this.selItem = { kind, id: rest.join(':') };
                    this.selSide = el.dataset.side || null;
                    if (this.section === 'chest' && kind === 'item' && el.dataset.side) {
                        const dir = el.dataset.side === 'pack' ? 'store' : 'take';
                        const chestKey = BO.ZoneWorldPlus?.resolveChestKey?.(this.subject) || this.subject;
                        if (event.shiftKey || event.detail >= 2) pack.transfer(chestKey, this.selItem.id, event.shiftKey ? 'all' : 'one', dir === 'store');
                    }
                    break;
                }
                case 'filter': this.packFilter = arg; break;
                case 'sort': this.packSort = arg; break;
                case 'hbPut': {
                    const s = this.selItem;
                    if (s) this.assignToHotbar(Number(arg), s.kind, s.id);
                    break;
                }
                case 'hbSlot': {
                    const i = Number(arg);
                    const s = this.selItem;
                    const entry = hotbar.slots[i];
                    if (s && this.section === 'inventory' && el.closest('.sv-assign-mode')) this.assignToHotbar(i, s.kind, s.id);
                    else if (entry) this.selItem = { kind: entry.kind, id: entry.kind === 'weapon' ? String(entry.ref) : entry.id };
                    else { hotbar.select(i); this.feedback = 'Slot ' + (i + 1) + ' selected: bare hands.'; }
                    break;
                }
                case 'hbActive': hotbar.select(Number(arg)); break;
                case 'hbClear': hotbar.clear(Number(arg)); break;
                case 'use': {
                    const ok = mode.consume(arg);
                    if (!ok && !(pack.inventory[arg] > 0)) this.feedback = 'None left.';
                    break;
                }
                case 'drop': { const [id, amt] = arg.split(':'); pack.drop(id, amt); break; }
                case 'transfer': {
                    const [dir, id, amt] = arg.split(':');
                    const chestKey = BO.ZoneWorldPlus?.resolveChestKey?.(this.subject) || this.subject;
                    pack.transfer(chestKey, id, amt, dir === 'store');
                    break;
                }
                case 'equipTool': {
                    if (pack.tools[arg] > 0) pack.equipped = arg;
                    const idx = hotbar.indexOf({ kind: 'tool', id: arg });
                    if (idx >= 0) hotbar.select(idx);
                    break;
                }
                case 'repairTool': {
                    const prev = pack.equipped;
                    pack.equipped = arg;
                    if (!pack.use('repair')) { pack.equipped = prev; this.feedback = 'This tool is already in top condition.'; }
                    break;
                }
                case 'repairGun': {
                    const ref = Number(arg);
                    const w = BO.Player.weapons[ref];
                    if (!w || w.stats.kind === 'melee') break;
                    if (!(mode.points.gunkit > 0) && !c.has('sv_free_craft')) { this.feedback = 'No weapon repair kits in pack.'; break; }
                    if ((w.cond ?? 100) >= (w.maxCond ?? 100) - 1) { this.feedback = 'This firearm is already in top condition.'; break; }
                    if (!c.has('sv_free_craft')) mode.points.gunkit--;
                    w.maxCond = Math.max(40, (w.maxCond ?? 100) - 5);
                    w.cond = Math.min(w.maxCond, (w.cond ?? 50) + 35);
                    if (mode.jammed === w) mode.jammed = null;
                    this.feedback = (w.stats.shortName || w.stats.name || 'Weapon') + ' repaired to ' + Math.round(w.cond) + '%.';
                    break;
                }
                case 'openGunsmith': {
                    if (BO.ZoneArmory) { this.close(); BO.ZoneArmory.open(Number(arg)); return; }
                    break;
                }
                case 'plate': BO.Player.insertArmorPlate(); break;
                case 'light': pack.shortcut(); break;
                case 'flask': deep?.useFlask(); break;
                case 'talisman': deep?.equipTalisman(arg); break;
                case 'withdrawStash': {
                    if (c.area?.id !== 'relay') {
                        this.feedback = 'Return to Relay Sanctuary to withdraw banked items.';
                        break;
                    }
                    const taken = career.withdrawStash(pack);
                    const count = Object.values(taken || {}).reduce((a, b) => a + b, 0);
                    this.feedback = count ? 'Withdrew ' + count + ' item(s) from Safe-House Stash.' : 'Stash empty or backpack full.';
                    hotbar.reconcile();
                    break;
                }
                case 'craftCat': this.craftCat = arg; break;
                case 'buildTab': this.buildTab = arg; break;
                case 'recipe':
                    this.selRecipe = arg;
                    if (event?.shiftKey || event?.detail >= 2) this.craftRecipe(arg, event?.ctrlKey ? 5 : 1);
                    break;
                case 'craft': this.craftRecipe(arg, Number(el.dataset.times) || (event?.shiftKey ? 5 : 1)); break;
                case 'buildSel':
                    this.selBuild = arg;
                    if (event?.detail >= 2 && BO.ZoneBuild.begin(arg)) return this.resume();
                    break;
                case 'place': if (BO.ZoneBuild.begin(arg)) return this.resume(); break;
                case 'openFastTravel': this.section = 'fasttravel'; break;
                case 'openFullMap': this.section = 'map'; break;
                case 'wpAction':
                    if (BO.ZoneWorldPlus?.handleUiAction?.(arg, this.subject, this)) return;
                    break;
                case 'rotate': c.buildRotation = 1 - c.buildRotation; break;
                case 'repairBase': deep?.repairBase(); break;
                case 'dismantle': deep?.dismantleNearest(); break;
                case 'layer': this.mapLayers[arg] = !this.mapLayers[arg]; break;
                case 'mapZoom': {
                    const next = Math.max(1, Math.min(4, (this.mapZoom || 1) + (Number(arg) || 0)));
                    this.mapZoom = next;
                    if (next === 1) this.mapPan = { x: 0, z: 0 };
                    break;
                }
                case 'mapReset':
                    this.mapZoom = 1;
                    this.mapPan = { x: 0, z: 0 };
                    break;
                case 'clearWaypoint':
                    this.mapWaypoint = null;
                    break;
                case 'travel': if (c.travel(arg)) return this.resume(); this.feedback = 'Fast travel is not possible right now.'; break;
                case 'ride': if (c.ride(arg === 'off' ? null : arg)) return this.resume(); break;
                case 'questTrack': BO.ZoneQuests?.accept(arg); break;
                case 'questDrop': BO.ZoneQuests?.drop(arg); break;
                case 'unlockTech': deep?.unlockTech(arg); break;
                case 'attr': deep?.upgradeAttribute(arg); break;
                case 'claim': c.objectives.claim(arg); break;
                case 'intelOpen': this.intelOpen = this.intelOpen === arg ? null : arg; break;
                case 'save': this.feedback = c.save() ? 'Checkpoint saved in this browser.' : 'You can only save when no enemies are within 9 m (and not during a siege, evacuation or Iron run).'; break;
                case 'reward': c.reward(this.subject); break;
                case 'trade': if (!c.trade(this.subject, arg)) this.feedback = 'You cannot afford that trade (or your pack is full).'; break;
                case 'special': if (c.special(this.subject)) return this.resume(); break;
                case 'sleep': c.sleepUntilDawn(); break;
                case 'warp': {
                    const dest = deep?.allShrines.find((s) => s.id === arg);
                    if (dest && c.canSave()) {
                        BO.Player.pos.set(dest.x, dest.y, dest.z);
                        BO.Player.vel.set(0, 0, 0);
                        deep.lastRestPoint = { x: dest.x, y: dest.y, z: dest.z };
                        mode.toast('Warped to ' + dest.name + '.');
                        return this.resume();
                    }
                    this.feedback = 'You cannot warp while enemies are nearby.';
                    break;
                }
                case 'infuse': deep?.applyInfusion(arg); break;
                case 'respawn': deep?.respawnAtGrace(); this.section = 'map'; return this.resume();
                case 'endRun': this.close(); mode.finish(false); return;
                case 'decide': c.objectives.decide(arg); return;
                case 'epiFinish': BO.ZoneFinale.finish(); return;
                case 'epiExplore': BO.ZoneFinale.keepExploring(); return;
                case 'upgradeGun': {
                    const ref = Number(arg);
                    if (BO.Player.weapons[ref]) {
                        BO.Player.equipSurvivalSlot(ref, null, true);
                        hotbar.reconcile();
                        deep?.upgradeEquippedWeapon();
                    }
                    break;
                }
                case 'gm': {
                    const handled = BO.GM?.ui?.act(arg, el, event);
                    if (handled === 'close') return this.resume();
                    if (!BO.GM?.get('loot')?.pendingRespawn && this.section === 'gmRespawn') return;
                    break;
                }
                default: return;
            }
            this.render();
        }

        /**
         * Shared quick-move for every container screen (chest, satchel, vehicle trunk, stash uplink).
         * A stack tile carries data-mv-act / data-mv-arg (with N where the count goes) / data-mv-max.
         */
        moveFromTile(e, how) {
            const el = e.target.closest?.('[data-mv-act]');
            if (!el || !this.open) return false;
            e.preventDefault();
            const max = Math.max(1, Number(el.dataset.mvMax) || 1);
            const n = how === 'half' ? Math.ceil(max / 2) : 1;
            this.act(el.dataset.mvAct, String(el.dataset.mvArg).replace(/N$/, String(n)), e, el);
            return true;
        }

        assignToHotbar(index, kind, id) {
            const c = BO.SurvivalMode.campaign;
            const hotbar = c?.hotbar;
            if (!hotbar) return;
            let entry = null;
            if (kind === 'weapon') entry = { kind: 'weapon', ref: Number(id) };
            else if (kind === 'tool') entry = { kind: 'tool', id };
            else if (kind === 'item') {
                if (!BO.SurvivalHotbar.usable.has(id)) {
                    this.feedback = itemName(id) + ' cannot be held. Only weapons, tools and usable items fit on the hotbar.';
                    return;
                }
                entry = { kind: 'item', id };
            }
            if (entry && hotbar.assign(index, entry)) this.feedback = hotbar.label(entry) + ' placed in slot ' + (index + 1) + '.';
        }

        /* ------------------------------------------------------------ render root */
        render() {
            if (!this.dialog) return;
            this.rememberScroll();
            const s = this.section;
            this.dialog.classList.toggle('sv-is-deploy', s === 'briefing' || (s === 'legend' && this.returnToBriefing));
            if (s === 'briefing') return this.renderBriefing(true);
            if (s === 'legend' && this.returnToBriefing) {
                this.root.innerHTML = `<div class="sv-deploy-frame sv-legend-solo">
                    <header class="sv-dhead"><div class="sv-dhead-title"><span class="sv-kicker">Survival</span><h2>Field guide</h2></div>
                    <button class="sv-btn" data-act="backToBrief"${tip('Back', 'Return to the deployment screen.')}>← Back to deployment</button></header>
                    ${this._survivalGuideHtml()}</div>`;
                this.restoreScroll();
                return;
            }
            const mode = BO.SurvivalMode;
            if (!mode.active || !mode.campaign) return;
            this.root.innerHTML = this.renderTerminal();
            if (s === 'map') this.drawMap();
            this.restoreScroll();
        }

        _survivalGuideHtml() {
            return `<div class="sv-guide-host" data-scroll="guide">
                <label class="mode-guide-search">Search Survival <input type="search" data-survival-guide-search></label>
                <div data-survival-guide-topics>${BO.ModeGuide.render('survival')}</div>
            </div>`;
        }

        rememberScroll() {
            this.root?.querySelectorAll('[data-scroll]').forEach((n) => { this.scrollMemo[(this.section || '') + ':' + n.dataset.scroll] = n.scrollTop; });
        }
        restoreScroll() {
            this.root?.querySelectorAll('[data-scroll]').forEach((n) => {
                const v = this.scrollMemo[(this.section || '') + ':' + n.dataset.scroll];
                if (v) n.scrollTop = v;
            });
        }

        /* ================================================================
           DEPLOYMENT SCREEN
        ================================================================ */
        renderBriefing(full = false) {
            this.rememberScroll();
            const o = career.profile.options;
            const r = rules();
            const presetMatch = this.activePreset || this.matchPreset(o);
            const stepIndex = STEPS.findIndex(([id]) => id === this.step);
            const body = {
                quick: () => this.stepQuick(presetMatch),
                operation: () => this.stepOperation(o),
                difficulty: () => this.stepDifficulty(o),
                world: () => this.stepWorld(o),
                rules: () => this.stepRules(o),
                modifiers: () => this.stepModifiers(o),
                roster: () => this.stepRoster(o),
                career: () => this.record(true)
            }[this.step]();
            const xp = career.profile.xp;
            const lvlBase = (career.level - 1) ** 2 * 110;
            const lvlPct = career.level >= 50 ? 100 : pct(xp - lvlBase, career.nextXP - lvlBase);
            this.root.innerHTML = `<div class="sv-deploy-frame">
                <header class="sv-dhead">
                    <div class="sv-dhead-title">
                        <span class="sv-kicker">Solo expedition · 20× Exclusion Zone (500 × 450 m)</span>
                        <h2>Survival</h2>
                    </div>
                    <div class="sv-career-chip"${tip('Survival career', 'Your survival level carries across expeditions. Levels unlock vehicles (trail bicycle at 2, pack horse at 3, salvage rover at 6) and deployment kits.', xp.toLocaleString() + ' XP total')}>
                        <span class="sv-lvl">${career.level}</span>
                        <span class="sv-career-meta"><b>${esc(career.rank)}</b><span class="sv-xpbar"><i style="width:${lvlPct}%"></i></span>
                        <small>${career.level >= 50 ? 'Max level' : (career.nextXP - xp).toLocaleString() + ' XP to level ' + (career.level + 1)}</small></span>
                    </div>
                    <div class="sv-dhead-actions">
                        <button class="sv-btn ${BO.GM?.get('dev')?.enabled ? 'dev-on' : 'ghost'}" data-act="devToggle"${tip('Dev Mode', 'Testing toolkit for Survival: god mode, creative flight, noclip, any item, free build, unlock or lock anything, spawn anything, teleport anywhere, and every mission with start / end / restart. Press F8 in a run to open the Dev panel. Dev runs show a DEV chip.', BO.GM?.get('dev')?.enabled ? 'ON · click to turn off' : 'OFF · click to turn on')}>${BO.GM?.get('dev')?.enabled ? '⚙ Dev mode ON' : '⚙ Dev mode'}</button>
                        <button class="sv-btn ghost" data-act="legendFromBrief"${tip('Field guide', 'Survival rules, controls and practical advice.')}>Field guide</button>
                        <button class="sv-btn ghost" data-act="closeBrief"${tip('Back', 'Return to the main menu. Your settings are remembered.')}>✕ Back</button>
                    </div>
                </header>
                <div class="sv-deploy-grid">
                    <nav class="sv-steps" aria-label="Deployment steps">
                        ${STEPS.map(([id, label, sub], i) => `<button class="sv-step ${id === this.step ? 'active' : ''}" data-act="step" data-arg="${id}"${tip(label, sub + '.')}>
                            <span class="sv-step-n">${String(i + 1).padStart(2, '0')}</span>
                            <span class="sv-step-t"><b>${label}</b><small>${this.stepValue(id, o, presetMatch)}</small></span></button>`).join('')}
                    </nav>
                    <main class="sv-step-body sv-scroll" data-scroll="step-${this.step}">
                        <div class="sv-step-head"><span class="sv-kicker">Step ${stepIndex + 1} of ${STEPS.length}</span><h3>${STEPS[stepIndex][1]}</h3><p>${STEPS[stepIndex][2]}.</p></div>
                        ${body}
                        <div class="sv-step-nav">
                            ${stepIndex > 0 ? `<button class="sv-btn ghost" data-act="step" data-arg="${STEPS[stepIndex - 1][0]}"${tip('Back: ' + STEPS[stepIndex - 1][1], STEPS[stepIndex - 1][2] + '.')}>← ${STEPS[stepIndex - 1][1]}</button>` : '<span></span>'}
                            ${stepIndex < STEPS.length - 1 ? `<button class="sv-btn" data-act="step" data-arg="${STEPS[stepIndex + 1][0]}"${tip('Next: ' + STEPS[stepIndex + 1][1], STEPS[stepIndex + 1][2] + '.')}>${STEPS[stepIndex + 1][1]} →</button>` : ''}
                        </div>
                    </main>
                    <aside class="sv-summary sv-scroll" data-scroll="summary">${this.summary(o, presetMatch)}</aside>
                </div>
            </div>`;
            if (this.step === 'modifiers') this.bindModifiers();
            this.restoreScroll();
        }

        matchPreset(o) {
            const presets = rules().presets || {};
            for (const [id, p] of Object.entries(presets)) {
                const want = BO.SurvivalCampaignOptions({ ...data.defaults, gameType: 'expedition', modifiers: [], ...p.settings });
                const same = ['gameType', 'difficulty', 'pool', 'dayLength', 'startHour', 'encounterRate', 'survivalNeeds', 'weather']
                    .every((k) => String(want[k]) === String(o[k])) &&
                    want.modifiers.length === o.modifiers.length && want.modifiers.every((m) => o.modifiers.includes(m));
                if (same) return id;
            }
            return null;
        }

        stepValue(id, o, preset) {
            const r = rules();
            switch (id) {
                case 'quick': return preset ? esc(r.presets[preset].name) : 'Custom setup';
                case 'operation': return esc(r.modes[o.gameType]?.name);
                case 'difficulty': return 'Tier ' + (o.zoneTier || 1) + ' · ' + esc(r.difficulties[o.difficulty]?.name);
                case 'world': return (o.daily ? 'Daily · ' : o.seed ? esc(o.seed) + ' · ' : '') + START_TIMES.find(([h]) => h === o.startHour)?.[1];
                case 'rules': return (o.survivalNeeds ? 'Needs on' : 'Needs off') + ' · ' + (o.autosave ? 'autosave' : 'manual saves');
                case 'modifiers': return o.modifiers.length ? plural(o.modifiers.length, 'active modifier') : 'None';
                case 'roster': {
                    const total = BO.Zone.bestiary().length;
                    return (total - o.disabledEnemies.length) + ' of ' + total + ' enabled';
                }
                case 'career': return 'Level ' + career.level + ' · ' + esc(BO.SurvivalMeta?.KITS?.[career.profile.kit]?.name || career.rank);
            }
            return '';
        }

        stepQuick(preset) {
            const r = rules();
            const presets = Object.entries(r.presets || {});
            return `<p class="sv-lede">Start from a curated expedition, then fine-tune anything in the steps on the left. Hover a card for details.</p>
                <div class="sv-card-grid presets">${presets.map(([id, p]) => {
                    const s = { ...data.defaults, gameType: 'expedition', modifiers: [], ...p.settings };
                    const mode = r.modes[s.gameType];
                    const diff = r.difficulties[s.difficulty];
                    const meta = MODE_META[s.gameType] || {};
                    return `<button class="sv-card ${preset === id ? 'selected' : ''}" data-act="preset" data-arg="${id}"${tip(p.name, p.description, mode.name + ' · ' + diff.name + ' · ' + plural(s.modifiers.length, 'modifier'))}>
                        <span class="sv-card-ico">${Icons().named(meta.glyph || 'unknown', '#9fe0c9', 26)}</span>
                        <span class="sv-card-main"><b>${esc(p.name)}</b><small>${esc(p.description)}</small>
                        <span class="sv-tags"><i>${esc(mode.name)}</i><i>${esc(diff.name)}</i>${s.modifiers.length ? `<i>${s.modifiers.length} mods</i>` : ''}</span></span>
                        ${preset === id ? '<span class="sv-check">✓</span>' : ''}</button>`;
                }).join('')}</div>`;
        }

        stepOperation(o) {
            const r = rules();
            return `<p class="sv-lede">Your operation decides the win condition. Every operation shares the same zone, crafting and day-night threat escalation.</p>
                <div class="sv-card-grid modes">${Object.entries(r.modes).map(([id, m]) => {
                    const meta = MODE_META[id] || {};
                    return `<button class="sv-card ${o.gameType === id ? 'selected' : ''}" data-act="opt" data-key="gameType" data-arg="${id}"${tip(m.name, m.description, 'Length: ' + (meta.length || '—'))}>
                        <span class="sv-card-ico">${Icons().named(meta.glyph || 'unknown', '#9fe0c9', 26)}</span>
                        <span class="sv-card-main"><b>${esc(m.name)}</b><small>${esc(m.description)}</small>
                        <span class="sv-tags">${(meta.tags || []).map((t) => `<i>${esc(t)}</i>`).join('')}<i class="dim">${esc(meta.length || '')}</i></span></span>
                        ${o.gameType === id ? '<span class="sv-check">✓</span>' : ''}</button>`;
                }).join('')}</div>`;
        }

        stepDifficulty(o) {
            const r = rules();
            const all = Object.entries(r.difficulties);
            const maxOf = (k) => Math.max(...all.map(([, d]) => d[k]));
            const bar = (label, v, k, unit, body) => `<span class="sv-statbar"${tip(label, body)}><span>${label}</span><span class="sv-statbar-track"><i style="width:${pct(v, maxOf(k))}%"></i></span><b>${unit(v)}</b></span>`;
            const tiers = BO.SurvivalMeta?.ZONE_TIERS || [];
            const curTier = o.zoneTier || 1;
            const maxTier = career.maxTier || 1;
            const ts = BO.SurvivalMeta?.tierSpec ? BO.SurvivalMeta.tierSpec(curTier) : tiers[0];
            const tierHtml = tiers.length ? `<div class="sv-field sv-tier-box">
                <div class="sv-field-h"><b>Zone Tier (${curTier} / ${tiers.length}) · ${esc(ts?.name || '')}</b><small>Complete any ending at your highest unlocked tier to unlock the next. Higher tiers multiply threat, radiation, loot, XP and bonus commendations.</small></div>
                <div class="sv-ztier-strip">${tiers.map((t) => {
                    const locked = t.tier > maxTier;
                    const active = t.tier === curTier;
                    return `<button class="sv-ztier-btn ${active ? 'selected' : ''} ${locked ? 'locked' : ''}" data-act="setTier" data-arg="${t.tier}" ${locked ? 'disabled' : ''}${tip('Tier ' + t.tier + ' · ' + t.name, t.desc, locked ? 'Locked — clear Tier ' + (t.tier - 1) + ' first' : 'HP ×' + t.hp.toFixed(2) + ' · DMG ×' + t.dmg.toFixed(2) + ' · Loot ×' + t.loot.toFixed(2) + ' · +' + t.bonusComm + ' Comm.')}>
                        <b>T${t.tier}</b><small>${locked ? '🔒' : '×' + t.loot.toFixed(1)}</small></button>`;
                }).join('')}</div>
                ${ts ? `<div class="sv-ztier-meta"><span>HP <b>×${ts.hp.toFixed(2)}</b></span><span>Damage <b>×${ts.dmg.toFixed(2)}</b></span><span>Roam Cap <b>×${ts.cap.toFixed(2)}</b></span><span>Rad <b>×${ts.rad.toFixed(2)}</b></span><span>Loot <b>×${ts.loot.toFixed(2)}</b></span><span>XP <b>×${ts.xp.toFixed(2)}</b></span><span class="gold">+${ts.bonusComm} Comm.</span></div>` : ''}
            </div>` : '';
            return `${tierHtml}<p class="sv-lede">Difficulty scales enemy toughness, damage and spawn speed, and caps how many may roam once the zone reaches full escalation.</p>
                <div class="sv-diff-list">${all.map(([id, d]) => `<button class="sv-diff ${o.difficulty === id ? 'selected' : ''}" data-act="opt" data-key="difficulty" data-arg="${id}"${tip(d.name, DIFF_INFO[id] || '')}>
                    <span class="sv-diff-name"><b>${esc(d.name)}</b><small>${esc(DIFF_INFO[id] || '')}</small></span>
                    <span class="sv-diff-bars">
                        ${bar('Enemy health', d.hp, 'hp', (v) => '×' + v.toFixed(2), 'Multiplies the health of every infected and PMC.')}
                        ${bar('Damage taken', d.damage, 'damage', (v) => '×' + v.toFixed(2), 'Multiplies the damage enemies deal to you.')}
                        ${bar('Spawn speed', d.rate, 'rate', (v) => '×' + v.toFixed(2), 'How quickly new roamers replace the ones you clear.')}
                        ${bar('Max roaming', d.enemyCap, 'enemyCap', (v) => String(v), 'The most roaming enemies allowed once the zone is fully escalated (around day 7). Day 1 allows about 15% of this.')}
                    </span>${o.difficulty === id ? '<span class="sv-check">✓</span>' : ''}</button>`).join('')}</div>`;
        }

        segmented(key, value, items) {
            return `<div class="sv-seg" role="radiogroup">${items.map(([v, label, sub, body]) =>
                `<button class="sv-seg-btn ${String(value) === String(v) ? 'selected' : ''}" role="radio" aria-checked="${String(value) === String(v)}" data-act="opt" data-key="${key}" data-arg="${v}"${tip(label + (sub && body ? ' · ' + sub : ''), body || sub || '')}>
                    <b>${esc(label)}</b>${sub && body ? `<small>${esc(sub)}</small>` : ''}</button>`).join('')}</div>`;
        }

        toggle(key, value, title, body) {
            return `<button class="sv-switch ${value ? 'on' : ''}" role="switch" aria-checked="${!!value}" data-act="toggle" data-arg="${key}"${tip(title, body, value ? 'Currently ON' : 'Currently OFF')}>
                <span class="sv-switch-track"><i></i></span><span class="sv-switch-t"><b>${esc(title)}</b><small>${esc(body)}</small></span></button>`;
        }

        stepWorld(o) {
            const daily = BO.ZoneSeed ? BO.ZoneSeed.daily() : null;
            const dailyDone = daily && career.profile.dailyCompleted === daily.date;
            const seedBlock = `<div class="sv-field sv-seed-box">
                <div class="sv-field-h"><b>World seed & Daily Expedition</b><small>Seeds deterministically shape container loot rolls, rare weapon finds and zone variation. Share a seed to replay the exact same Zone.</small></div>
                <div class="sv-seed-row">
                    <input id="sv-seed-input" class="sv-seed-input" type="text" maxlength="20" placeholder="Random seed (e.g. KESTREL-409)" value="${esc(o.seed || '')}"${tip('World seed', 'The same seed gives the same loot rolls, so you can replay or share an expedition. Leave empty for a random seed.')} />
                    <button class="sv-btn sm" data-act="rollSeed"${tip('Roll seed', 'Generate a new callsign seed.')}>Roll</button>
                    ${o.seed ? `<button class="sv-btn sm ghost" data-act="clearSeed"${tip('Clear seed', 'Use a fresh random seed on deploy.')}>Clear</button>` : ''}
                </div>
                ${daily ? `<div class="sv-daily-card ${o.daily ? 'active' : ''}">
                    <div><b>Daily Expedition · ${esc(daily.seed)}</b>
                    <small>${esc(rules().difficulties[daily.difficulty]?.name || daily.difficulty)} · ${daily.modifiers.map((m) => rules().modifiers[m]?.name || m).join(', ')} · ${dailyDone ? '✓ Completed today' : '+' + daily.bonusCommendations + ' Bonus Commendations'}</small></div>
                    <button class="sv-btn sm ${o.daily ? 'primary' : ''}" data-act="dailyRun"${tip('Daily Expedition', 'Load today’s fixed seed, difficulty, start hour and two modifiers — the same for everyone today. Win it once a day for bonus commendations.')}>${o.daily ? 'Active' : 'Load Daily'}</button>
                </div>` : ''}
            </div>`;
            return `${seedBlock}<div class="sv-field"><div class="sv-field-h"><b>Starting time</b><small>When on the 24-hour clock you deploy. Night runs 19:00–06:00 and raises the roaming limit.</small></div>
                    ${this.segmented('startHour', o.startHour, START_TIMES)}</div>
                <div class="sv-field"><div class="sv-field-h"><b>Day length</b><small>Real time for one full day-night cycle. Threat escalates once per in-game day.</small></div>
                    ${this.segmented('dayLength', o.dayLength, DAY_LENGTHS.map(([v, l, b]) => [v, l, '', b]))}</div>
                <div class="sv-field"><div class="sv-field-h"><b>Encounter rate</b><small>Scales how many enemies may roam at once on top of the day's limit.</small></div>
                    ${this.segmented('encounterRate', o.encounterRate, ENCOUNTER.map(([v, l, b]) => [v, l, '', b]))}</div>
                <div class="sv-field"><div class="sv-field-h"><b>Enemy pool</b><small>Flavours which unlocked infected appear and whether PMC patrols join in (from day 2).</small></div>
                    <div class="sv-card-grid pools">${Object.entries(data.pools).map(([id, p]) => `<button class="sv-card compact ${o.pool === id ? 'selected' : ''}" data-act="opt" data-key="pool" data-arg="${id}"${tip(p.name, this.poolTooltip(id, o), o.pool === id ? 'Selected' : 'Click to select')}>
                        <span class="sv-card-main"><b>${esc(p.name)}</b><small>${esc(p.extra)}</small></span>${o.pool === id ? '<span class="sv-check">✓</span>' : ''}</button>`).join('')}</div></div>
                <div class="sv-field">${this.toggle('weather', o.weather, 'Dynamic weather', 'Overcast, ash rain and radiation fog roll through. Ash rain can jam worn weapons; fog thickens and raises radiation.')}</div>`;
        }

        /** Plain-text list of the infected a pool favours, with the day each one joins. */
        poolTooltip(poolId, o) {
            const pool = data.pools[poolId];
            const roster = BO.Zone.bestiary().filter((z) => !o.disabledEnemies.includes(z.id));
            if (!roster.length) return pool.extra + '\n\nNo enemies are enabled in the roster.';
            const diff = rules().difficulties[o.difficulty];
            const dayOf = (i) => {
                for (let d = 1; d < 40; d++) if (rules().threat(d, false, o, diff, roster.length).poolSize > i) return d;
                return 40;
            };
            const indexed = roster.map((z, i) => ({ z, day: dayOf(i) }));
            const kw = pool.keywords ? new RegExp(pool.keywords, 'i') : null;
            const matches = kw ? indexed.filter(({ z }) => kw.test(z.id)) : indexed;
            const line = ({ z, day }) => '• ' + z.name + ' (day ' + day + ')';
            let body = pool.extra + '\n\n';
            if (!kw) {
                body += 'Draws from every enabled infected (' + roster.length + '), weakest first:\n' + indexed.slice(0, 14).map(line).join('\n') +
                    (indexed.length > 14 ? '\n…and ' + (indexed.length - 14) + ' more, up to ' + indexed[indexed.length - 1].z.name + '.' : '') +
                    '\n\nStandard PMC patrols join on day 2 and Commander Sable arrives on day 3.';
            } else if (matches.length >= 3) {
                body += 'Favours these ' + matches.length + ' infected (each still joins on its day):\n' + matches.slice(0, 16).map(line).join('\n') +
                    (matches.length > 16 ? '\n…and ' + (matches.length - 16) + ' more.' : '') +
                    '\n\nThe two newest unlocks always stay in rotation, and biomes with their own wildlife (woods, quarry, flats, marsh, trench) keep their local types.';
            } else {
                body += 'Only ' + matches.length + ' enabled infected ' + (matches.length === 1 ? 'matches' : 'match') + ' this pool, so it plays like Mixed patrols:\n' + indexed.slice(0, 10).map(line).join('\n') + '\n…';
            }
            if (poolId === 'patrols') body += '\n\nAlso: armed PMC patrols (rifles and SMGs) join from day 2, more each day (max 8).';
            if (poolId === 'horde') body += '\n\nSpawns 30% more often than other pools.';
            return body;
        }

        a11yBar() {
            const cb = BO.Settings?.get?.('colorBlindMode') || 'none';
            const sub = BO.Settings?.get?.('subtitles') !== false;
            const red = !!BO.Settings?.get?.('reducedMotion');
            const modes = [['none', 'Standard'], ['protanopia', 'Protanopia'], ['deuteranopia', 'Deuteranopia'], ['tritanopia', 'Tritanopia']];
            return `<div class="sv-a11y-bar">
                <b>Accessibility</b>
                ${modes.map(([id, label]) => `<button class="sv-btn xs ${cb === id ? 'primary' : 'ghost'}" data-act="a11yColor" data-arg="${id}"${tip('Color-vision filter', 'Adjusts Zone palette and danger/safe hues for ' + label.toLowerCase() + '.')}>${label}</button>`).join('')}
                <button class="sv-btn xs ${sub ? 'primary' : 'ghost'}" data-act="a11ySub"${tip('Radio & Audio Subtitles', 'Shows live closed captions for radio alerts, Warden pulses, horde warnings and directional threat cues.')}>Subtitles: ${sub ? 'ON' : 'OFF'}</button>
                <button class="sv-btn xs ${red ? 'primary' : 'ghost'}" data-act="a11yMotion"${tip('Reduced Shake & Flash', 'Tones down camera shake and Lantern pulse screen flashes.')}>Reduced Shake: ${red ? 'ON' : 'OFF'}</button>
            </div>`;
        }

        stepRules(o) {
            const safe = rules().openingSecondsFor ? rules().openingSecondsFor(o) : 60;
            return `${this.a11yBar()}<div class="sv-field">${this.toggle('survivalNeeds', o.survivalNeeds, 'Survival needs', 'Food, water, body temperature and radiation drain over time and hurt you when depleted. Turn off for a pure building and combat run.')}</div>
                <div class="sv-field">${this.toggle('autosave', o.autosave, 'Autosave when safe', 'Saves a checkpoint every 45 seconds whenever no enemies are within 9 m. You can always save manually from the Journal.')}</div>
                <div class="sv-info-card"${tip('Safe period', 'No enemies can spawn during the opening safe period. Add the Extended Safe Start modifier to double it.')}>
                    ${Icons().named('plate', '#9fe0c9', 22)}<div><b>${safe} second safe period</b><small>Nothing hostile spawns at the start. Use it to gather branches, stones and fiber and craft your first tools.</small></div></div>
                <div class="sv-info-card"${tip('Day-by-day escalation', 'Day 1 only lets the 4 weakest infected roam, a few at a time. Each new day unlocks stronger infected and raises the roaming limit. PMC patrols arrive on day 2 and Commander Sable on day 3.')}>
                    ${Icons().named('fire', '#f2b45a', 22)}<div><b>Escalating threat</b><small>Day 1 is quiet. Every dawn brings tougher infected and more of them. Blood Moons rise every third night.</small></div></div>`;
        }

        stepModifiers(o) {
            return '<div id="sv-mod-host">' + (BO.ModifierMenuUI?.renderHtml({ mode: 'survival', active: o.modifiers }) || '') + '</div>';
        }

        bindModifiers() {
            const host = this.root.querySelector('#sv-mod-host');
            if (!host || !BO.ModifierMenuUI) return;
            BO.ModifierMenuUI.bindContainer(host, {
                mode: 'survival',
                getActive: () => career.profile.options.modifiers || [],
                onChange: (next) => {
                    career.remember({ ...career.profile.options, modifiers: next });
                    this.activePreset = null;
                    const o = career.profile.options;
                    const aside = this.root.querySelector('.sv-summary');
                    if (aside) aside.innerHTML = this.summary(o, this.matchPreset(o));
                    const stepV = this.root.querySelector('.sv-step[data-arg="modifiers"] small');
                    if (stepV) stepV.textContent = this.stepValue('modifiers', o);
                    const quickV = this.root.querySelector('.sv-step[data-arg="quick"] small');
                    if (quickV) quickV.innerHTML = this.stepValue('quick', o, this.matchPreset(o));
                }
            });
        }

        stepRoster(o) {
            const list = BO.Zone.bestiary();
            const disabled = new Set(o.disabledEnemies);
            const unlockDay = (i) => {
                for (let d = 1; d < 30; d++) if (rules().threat(d, false, o, rules().difficulties[o.difficulty], 999).poolSize > i) return d;
                return 30;
            };
            let lastDay = 0;
            const onRows = [];
            const offList = [];
            // Day thresholds are computed against the enabled roster, matching the in-game director.
            let enabledIndex = 0;
            const zc = BO.ZombieCustomizer;
            const withDay = [];
            list.forEach((z) => {
                if (disabled.has(z.id)) {
                    offList.push(z);
                    return;
                }
                const customDay = zc ? zc.getStartRound(z.id) : null;
                const d = customDay != null ? customDay : unlockDay(enabledIndex++);
                withDay.push({ z, d, custom: customDay != null });
            });
            withDay.sort((a, b) => a.d - b.d);
            withDay.forEach(({ z, d, custom }) => {
                if (d !== lastDay) {
                    onRows.push(`<div class="sv-roster-day">Joins on day ${d}</div>`);
                    lastDay = d;
                }
                const modMark = zc && zc.isCustomized(z.id) ? ' ✎' : '';
                onRows.push(`<button class="sv-enemy on" data-act="roster" data-arg="${z.id}" data-tip-enemy="${z.id}"${tip(z.name, (z.simpleDesc || 'Infected variant.'), 'Enabled · joins Survival on day ' + d + (custom ? ' (custom)' : '') + ' · click to disable')}>
                    <span class="sv-enemy-box">✓</span><b>${esc(z.name)}${modMark}</b><small>${esc(z.rarity || '')}</small></button>`);
            });
            const offRows = offList.map((z) => `<button class="sv-enemy off" data-act="roster" data-arg="${z.id}" data-tip-enemy="${z.id}"${tip(z.name, (z.simpleDesc || 'Infected variant.'), 'Disabled · click to enable')}>
                    <span class="sv-enemy-box"></span><b>${esc(z.name)}</b><small>${esc(z.rarity || '')}</small></button>`);
            const modCnt = zc ? zc.getCustomizedCount() : 0;
            const setupName = zc ? (zc.config.activePresetName || 'Default') : 'Default';
            return `<p class="sv-lede">Customize which infected appear, edit any zombie's stats (HP, speed, attack, armor, resistances), pick the exact day each zombie can start appearing, tune per-zombie &amp; category spawn %, and save setups.</p>
                <div class="sv-row-actions">
                    <button class="sv-btn primary sm" data-act="openZombieCustomizer"${tip('Zombie Customizer', 'Edit zombie stats, choose start day/round, edit per-zombie & category spawn %, and save/load zombie configs.')}>⚙ Edit Stats, Start Day, Spawn % &amp; Setups (${esc(setupName)}${modCnt ? ' · ' + modCnt + ' edited' : ''})</button>
                    <button class="sv-btn ghost sm" data-act="rosterBulk" data-arg="all"${tip('Enable all', 'Allow every infected variant to appear when its day comes.')}>Enable all</button>
                    <button class="sv-btn ghost sm" data-act="rosterBulk" data-arg="light"${tip('Lighter roster', 'Keep only the six lighter infected: no chargers, bloaters, riot walkers, stalkers or heavies.')}>Lighter six only</button>
                    <button class="sv-btn ghost sm" data-act="rosterBulk" data-arg="noHeavy"${tip('No heavies', 'Disable the shadow stalker, club goliath and iron juggernaut.')}>No heavies</button>
                </div>
                <div class="sv-roster">${onRows.join('')}${offRows.length ? `<div class="sv-roster-day off">Disabled (${offList.length})</div>` + offRows.join('') : ''}</div>`;
        }

        summary(o, preset) {
            const r = rules();
            const mode = r.modes[o.gameType];
            const diff = r.difficulties[o.difficulty];
            const rosterSize = BO.Zone.bestiary().length - o.disabledEnemies.length;
            const days = [1, 2, 3, 4, 5, 6, 7].map((d) => r.threat(d, false, o, diff, rosterSize));
            const maxCap = Math.max(...days.map((t) => t.cap), 1);
            const safe = r.openingSecondsFor ? r.openingSecondsFor(o) : 60;
            const start = START_TIMES.find(([h]) => h === o.startHour);
            const mods = o.modifiers.map((id) => r.modifiers[id]).filter(Boolean);
            const checkpoint = career.checkpoint;
            const packedCount = Object.values(career.profile.packedStash || {}).reduce((a, b) => a + (Number(b) || 0), 0);
            const zTier = BO.SurvivalMeta?.tierSpec ? BO.SurvivalMeta.tierSpec(o.zoneTier || 1) : null;
            return `<div class="sv-sum-head"><span class="sv-kicker">Deployment${o.daily ? ' · DAILY EXPEDITION' : ''}</span><h3>${esc(mode?.name)}</h3><p>${esc(mode?.description)}</p></div>
                <dl class="sv-facts">
                    <div${tip('Zone Tier', zTier?.desc || '')}><dt>Zone Tier</dt><dd>Tier ${o.zoneTier || 1}${zTier ? ' · ' + esc(zTier.name) : ''}</dd></div>
                    <div${tip('Difficulty', DIFF_INFO[o.difficulty] || '')}><dt>Difficulty</dt><dd>${esc(diff?.name)}</dd></div>
                    <div${tip('World seed', 'Deterministic seed for loot tables and zone rolls.')}><dt>Seed</dt><dd id="sv-sum-seed">${o.seed ? esc(o.seed) : 'Random'}</dd></div>
                    <div${tip('Start', start?.[3] || '')}><dt>Start</dt><dd>${esc(start?.[1])} · ${esc(start?.[2])}</dd></div>
                    <div${tip('Day length', 'One full day-night cycle in real time.')}><dt>Day length</dt><dd>${o.dayLength / 60} min</dd></div>
                    <div${tip('Safe period', 'Seconds before anything hostile can spawn.')}><dt>Safe period</dt><dd>${safe}s</dd></div>
                    <div${tip('Survival needs', 'Food, water, temperature and radiation.')}><dt>Needs</dt><dd>${o.survivalNeeds ? 'On' : 'Off'}</dd></div>
                    <div${tip('Deployment kit', BO.SurvivalMeta?.KITS?.[career.profile.kit]?.desc || 'Standard balanced kit.')}><dt>Kit</dt><dd>${esc(BO.SurvivalMeta?.KITS?.[career.profile.kit]?.name || 'Standard')}${packedCount ? ' · +' + packedCount + ' stash' : ''}</dd></div>
                </dl>
                <div class="sv-threat"${tip('Threat forecast', 'How many infected may roam at once (bar) and how many enemy types are unlocked (number) on each day. Nights allow about 35% more.')}>
                    <div class="sv-threat-h"><b>Threat forecast</b><small>Roaming limit by day</small></div>
                    <div class="sv-threat-bars">${days.map((t) => `<div class="sv-tbar"><span class="sv-tbar-v">${t.cap}</span><i style="height:${Math.max(8, pct(t.cap, maxCap))}%"></i><span class="sv-tbar-d">D${t.day}</span><span class="sv-tbar-p">${t.poolSize}</span></div>`).join('')}</div>
                    <div class="sv-threat-legend"><span><i class="bar"></i>Max roaming</span><span><b>n</b> enemy types</span></div>
                </div>
                <div class="sv-sum-mods"><div class="sv-threat-h"><b>Modifiers</b><small>${mods.length ? mods.length + ' active' : 'None'}</small></div>
                    <div class="sv-modchips">${mods.length ? mods.slice(0, 14).map((m) => `<span class="sv-modchip"${tip(m.name, m.description || m.desc || '')}>${esc(m.ico || '◆')} ${esc(m.name)}</span>`).join('') + (mods.length > 14 ? `<span class="sv-modchip dim">+${mods.length - 14} more</span>` : '') : '<span class="sv-muted">Standard rules.</span>'}</div></div>
                <div class="sv-deploy-actions">
                    <button class="sv-btn primary big" data-act="deploy" data-arg="new"${tip('Deploy', 'Start a new expedition with these settings.' + (checkpoint ? ' This replaces your saved checkpoint once you save again.' : ''))}>Deploy</button>
                    ${checkpoint ? `<button class="sv-btn big" data-act="deploy" data-arg="resume"${tip('Resume checkpoint', 'Continue your saved expedition with the settings it was started with.', 'Saved at ' + BO.Math.formatTime(checkpoint.clock) + ' of play · ' + esc(r.modes[checkpoint.options?.gameType]?.name || ''))}>Resume checkpoint <small>${BO.Math.formatTime(checkpoint.clock)}</small></button>` : ''}
                </div>`;
        }

        record(interactive = false) {
            const p = career.profile;
            const stats = p.stats || {};
            const meta = BO.SurvivalMeta || { MASTERY: {}, MASTERY_BRANCHES: {}, KITS: {} };
            let fastest = 0;
            try { fastest = Number(localStorage.getItem('boSurvivalFastest')) || 0; } catch (_) { /* storage disabled */ }
            const numbers = [
                ['Expeditions', stats.runs], ['Extractions', stats.extracts], ['Eliminations', stats.kills],
                ['Bosses defeated', stats.bosses], ['Hordes survived', stats.hordesSurvived], ['Garrisons cleared', stats.garrisons],
                ['Weapons forged', stats.weaponsForged], ['Items crafted', stats.crafted], ['Structures built', stats.built]
            ];
            const comm = p.commendations || 0;
            const spent = career.spentCommendations ? career.spentCommendations() : 0;
            const endings = p.endings || {};
            const endingMedals = [
                ['seal', 'Lantern Sealed', '#8fe3c8', 'Overloaded the Lantern core. Unlocks Signal Ghost kit.'],
                ['extract', 'Data Extracted', '#9fd4ff', 'Carried Black Pine research out. Unlocks Zone Archivist kit.'],
                ['seize', 'Lantern Seized', '#f2b45a', 'Claimed the anomaly. Unlocks Lantern Keeper kit.']
            ].map(([id, label, col, desc]) => {
                const cnt = endings[id] || 0;
                return `<div class="sv-medal ${cnt > 0 ? 'got' : ''}" style="--mc:${col}"${tip(label, desc, cnt > 0 ? 'Completed ' + cnt + '×' : 'Not yet reached')}>
                    <b>${cnt > 0 ? '✦' : '◇'} ${esc(label)}</b><small>${cnt > 0 ? cnt + '× cleared' : 'Unclaimed'}</small></div>`;
            }).join('');

            const branches = meta.MASTERY_BRANCHES || { logistics: { name: 'Logistics', color: '#8fe3c8' }, combat: { name: 'Combat', color: '#f2b45a' }, anomaly: { name: 'Anomaly', color: '#c59bff' } };
            const masterySections = Object.entries(branches).map(([bId, bSpec]) => {
                const nodes = Object.entries(meta.MASTERY || {}).filter(([, m]) => (m.branch || 'logistics') === bId);
                if (!nodes.length) return '';
                return `<div class="sv-mbranch"><div class="sv-mbranch-h" style="--bc:${bSpec.color}"><i></i><b>${esc(bSpec.name)}</b></div>
                    <div class="sv-meta-grid">${nodes.map(([id, m]) => {
                        const rank = career.masteryRank(id);
                        const maxed = rank >= m.max;
                        const afford = !maxed && comm >= m.cost;
                        const pips = Array.from({ length: m.max }, (_, i) => `<i class="${i < rank ? 'on' : ''}"></i>`).join('');
                        return `<div class="sv-mastery-card ${maxed ? 'maxed' : ''}"${tip(m.name, m.desc, 'Rank ' + rank + ' / ' + m.max + ' · Cost: ' + m.cost + ' Commendation(s)')}>
                            <div class="sv-mastery-h"><b>${esc(m.name)}</b><small>${rank}/${m.max}</small></div>
                            <small>${esc(m.desc)}</small>
                            <div class="sv-mastery-pips">${pips}</div>
                            ${interactive ? `<button class="sv-btn sm ${afford ? 'primary' : ''}" data-act="buyMastery" data-arg="${id}" ${maxed || !afford ? 'disabled' : ''}>${maxed ? 'Maxed' : 'Upgrade · ' + m.cost + ' Comm.'}</button>` : ''}
                        </div>`;
                    }).join('')}</div></div>`;
            }).join('');

            const curKit = p.kit || 'standard';
            const kitHtml = Object.entries(meta.KITS || {}).map(([id, k]) => {
                const unlocked = career.level >= k.level && (career.kitUnlocked ? career.kitUnlocked(id) : true);
                const selected = curKit === id;
                const loadText = [BO.SurvivalItemAmounts(k.items), k.ammo ? k.ammo + ' ammo' : '', k.vehicle || '', k.techPoints ? '+' + k.techPoints + ' TP' : ''].filter(Boolean).join(' · ') || 'Standard rifle load';
                return `<button class="sv-kit-card ${selected ? 'selected' : ''}" ${interactive && unlocked ? `data-act="setKit" data-arg="${id}"` : ''} ${unlocked && interactive ? '' : 'disabled'}${tip(k.name, k.desc, (k.unlock ? 'Ending unlock: ' + (k.unlockLabel || k.unlock) : 'Unlocks at Level ' + k.level) + ' · ' + loadText)}>
                    <b>${esc(k.name)}<em>${unlocked ? (selected ? 'ACTIVE' : 'LV ' + k.level) : k.unlock ? '🔒 ' + (k.unlockLabel || k.unlock.toUpperCase()) : '🔒 LV ' + k.level}</em></b>
                    <small>${esc(k.desc)}</small>
                    <span class="sv-kit-items">${esc(loadText)}</span>
                </button>`;
            }).join('');

            const bpSet = new Set(p.blueprints || []);
            const bpDiscount = career.masteryRank('blueprint_cache') > 0;
            const bpHtml = (deepData().weaponSchematics || []).map((sch) => {
                const got = bpSet.has(sch.id);
                return `<span class="sv-modchip ${got ? '' : 'dim'}"${tip(sch.name + ' Blueprint', got ? 'Permanently unlocked across runs — craftable immediately at any Workbench' + (bpDiscount ? ' (-25% cost from Blueprint Archivist).' : '.') : 'Unlock by forging in-run or claiming boss spoils.')}>${got ? '✓ ' : '🔒 '}${esc(sch.name)}</span>`;
            }).join('');

            const stashEntries = Object.entries(p.stash || {}).filter(([id, n]) => frontier.items[id] && n > 0);
            const packed = p.packedStash || {};
            const packedTotal = Object.values(packed).reduce((a, b) => a + (Number(b) || 0), 0);
            const stashHtml = stashEntries.length
                ? stashEntries.map(([id, n]) => {
                    const pk = packed[id] || 0;
                    if (!interactive) return `<span class="sv-modchip"${tip(itemName(id) + ' ×' + n, 'Stored in your Archive Stash from past extractions.')}>${esc(itemName(id))} ×${n}</span>`;
                    return `<div class="sv-stash-item ${pk > 0 ? 'packed' : ''}"${tip(itemName(id), 'Click + to pack from your Archive Stash into your drop pack for the next expedition.')}>
                        <span><b>${esc(itemName(id))}</b><small>${n} in stash${pk ? ' · ' + pk + ' packed' : ''}</small></span>
                        <span class="sv-stash-ctl">
                            <button class="sv-btn xs ghost" data-act="packStash" data-arg="${id}:-1" ${pk <= 0 ? 'disabled' : ''}>−</button>
                            <em>${pk}</em>
                            <button class="sv-btn xs" data-act="packStash" data-arg="${id}:1" ${pk >= n ? 'disabled' : ''}>+</button>
                        </span></div>`;
                }).join('')
                : '<span class="sv-muted sm">Empty — complete expeditions or extract supplies to bank items for future runs.</span>';

            const history = p.history || [];
            const historyHtml = history.length
                ? `<div class="sv-chronicle">${history.slice(0, 12).map((h) => {
                    const endLabel = h.ending ? ({ seal: 'Sealed', extract: 'Extracted', seize: 'Seized' }[h.ending] || h.ending) : h.victory ? 'Cleared' : 'Lost';
                    return `<div class="sv-chron-row ${h.victory ? 'win' : 'loss'}">
                        <span class="sv-chron-badge">${esc(endLabel)}</span>
                        <span class="sv-chron-main"><b>Tier ${h.tier || 1} · ${esc(rules().difficulties[h.difficulty]?.name || h.difficulty)}</b>
                        <small>${esc(h.date || '')}${h.seed ? ' · ' + esc(h.seed) : ''}${h.daily ? ' (Daily)' : ''} · ${esc(meta.KITS?.[h.kit]?.name || h.kit)}</small></span>
                        <span class="sv-chron-stats"><b>D${h.days || 1}</b><b>${h.kills || 0} kills</b><b>${BO.Math.formatTime(h.time || 0)}</b>${h.commendations ? `<b class="gold">+${h.commendations}c</b>` : ''}</span>
                    </div>`;
                }).join('')}</div>`
                : '<p class="sv-muted sm">No completed expeditions recorded yet. Finish a run to log it in the Chronicle.</p>';

            return `<div class="sv-stats">${numbers.map(([label, n]) => `<div class="sv-stat"><b>${(n || 0).toLocaleString()}</b><small>${label}</small></div>`).join('')}
                    <div class="sv-stat"><b>Tier ${career.maxTier}/10</b><small>Max Zone Tier</small></div>
                    <div class="sv-stat"><b>${comm}</b><small>Commendations</small></div>
                    ${fastest ? `<div class="sv-stat"><b>${BO.Math.formatTime(fastest)}</b><small>Fastest victory</small></div>` : ''}</div>
                <div class="sv-medals">${endingMedals}</div>
                ${BO.ZoneArchive ? (() => { const s = BO.ZoneArchive.summary(); return `
                <h4 class="sv-sub">Feats <small>${s.feats}/${s.featsTotal} unlocked · each pays commendations once</small></h4>
                ${BO.ZoneArchive.featsHtml(esc)}
                <h4 class="sv-sub">Intel · Project Lantern <small>${s.intel}/${s.intelTotal} documents recovered · every 4th pays a commendation</small></h4>
                ${BO.ZoneArchive.intelHtml(esc, this.intelOpen)}`; })() : ''}
                <div class="sv-meta-bar">
                    <div><b>Archive Mastery Tree</b><small>Permanent perks across all expeditions. Earned from level-ups, bosses, hordes, dailies and endings.</small></div>
                    <div class="sv-meta-bar-r"><b>${comm} Commendation${comm === 1 ? '' : 's'}</b>
                    ${interactive && spent > 0 ? `<button class="sv-btn sm ghost" data-act="respecMastery"${tip('Respec Mastery', 'Refund all ' + spent + ' spent commendations and reset your mastery tree for free.')}>Respec (+${spent})</button>` : ''}</div>
                </div>
                ${masterySections}
                <h4 class="sv-sub">Deployment kits ${interactive ? '<small>Choose your starting loadout (8 kits)</small>' : `<small>Active: ${esc(meta.KITS?.[curKit]?.name || 'Standard')}</small>`}</h4>
                <div class="sv-kit-grid">${kitHtml}</div>
                <h4 class="sv-sub">Archive Stash <small>Cap ${career.stashCap ? career.stashCap() : 25}/stack${interactive && packedTotal ? ' · ' + packedTotal + ' packed for drop' : ''}</small>${interactive && packedTotal ? ` <button class="sv-btn xs ghost" data-act="clearPacked">Clear packed</button>` : ''}</h4>
                <div class="${interactive && stashEntries.length ? 'sv-stash-grid' : 'sv-modchips'}">${stashHtml}</div>
                <h4 class="sv-sub">Permanent Blueprint Vault <small>${bpSet.size}/${(deepData().weaponSchematics || []).length}${bpDiscount ? ' · -25% forge cost' : ''}</small></h4>
                <div class="sv-modchips">${bpHtml}</div>
                <h4 class="sv-sub">Expedition Chronicle <small>${history.length} logged</small></h4>
                ${historyHtml}
                ${interactive ? `<div class="sv-archive-foot"><button class="sv-btn sm ghost danger" data-act="resetCareer"${tip('Reset Archive Career', 'Permanently wipes your level, commendations, mastery, kits, stash, intel, feats, chronicle and saved checkpoint. Click twice to confirm.')}>${this._confirmReset ? 'Click again to wipe Archive & Career' : 'Reset Archive Career'}</button></div>` : ''}`;
        }

        /* ================================================================
           FIELD TERMINAL
        ================================================================ */
        renderTerminal() {
            const mode = BO.SurvivalMode;
            const c = mode.campaign;
            const deep = c.deep;
            const p = BO.Player;
            const s = this.section;
            const ctx = CONTEXT.has(s);
            const activeTab = ctx ? null : s;
            let body = '';
            let title = '';
            switch (s) {
                case 'inventory': body = this.tabInventory(); break;
                case 'crafting': body = this.tabCrafting(); break;
                case 'build': body = this.tabBuild(); break;
                case 'map': body = this.tabMap(); break;
                case 'skills': body = this.tabSkills(); break;
                case 'journal': body = this.tabJournal(); break;
                case 'legend': body = this._survivalGuideHtml(); break;
                case 'chest': title = BO.ZoneWorldPlus?.chestTitle?.(this.subject) || 'Storage chest'; body = this.ctxChest(); break;
                case 'npc': body = this.ctxNpc(); title = BO.ZoneWorldPlus?.npcTitle?.(this.subject) || c.contact(this.subject)?.name || 'Contact'; break;
                case 'shrine': title = 'Site of Grace'; body = this.ctxShrine(); break;
                case 'infuser': title = 'Aether infusion altar'; body = this.ctxInfuser(); break;
                case 'fasttravel': title = 'Fast Travel Network'; body = this.ctxFastTravel(); break;
                case 'respawn': title = 'You fell'; body = this.ctxRespawn(); break;
                case 'ending': title = 'The Lantern'; body = this.ctxEnding(); break;
                case 'epilogue': title = ''; body = BO.ZoneFinale.epilogue(this.subject || c.objectives.ending); break;
                case 'gmRespawn': title = 'You fell'; body = BO.GM?.get('loot')?.renderRespawn() || ''; break;
                case 'gmPanel': title = BO.GM?.ui?.title(this.subject) || ''; body = BO.GM?.ui?.render(this.subject) || ''; break;
                default: body = BO.GM?.ui?.renderTab?.(s) ?? this.tabMap();
            }
            const safeLeft = Math.max(0, Math.ceil((mode.openingSeconds || 60) - mode.clock));
            const t = mode.threat;
            const kb = BO.Settings.getKeybinds();
            const tabs = s === 'respawn' || s === 'gmRespawn' || s === 'ending' || s === 'epilogue' ? '' : TABS.map((tab) => `<button class="sv-tab ${activeTab === tab.id ? 'active' : ''}" data-act="tab" data-arg="${tab.id}"${tip(tab.label, ({
                inventory: 'Backpack, hotbar, weapons, tools and field kit.',
                crafting: 'Every recipe in one place, filtered by category. Station recipes need you nearby.',
                build: 'Place walls, stations, storage, traps and machines in front of you.',
                map: 'Field map, fast travel and vehicles.',
                base: 'Power grid, territory, settlers, outposts, hauls, threat ladder and the weather forecast.',
                skills: 'Survivor skills (one point per level), the Technology tree, story progress and Archive mastery.',
                journal: 'Objective, challenges, contracts, activities and career.',
                catalogue: 'Field Catalogue: everything you have found, what is still missing, and the set bonuses for completing each set.',
                legend: 'Searchable encyclopedia of everything in Survival.'
            })[tab.id], 'Hotkey: ' + BO.Settings.keyLabel(kb[tab.bind]))}>
                ${Icons().named(tab.glyph, activeTab === tab.id ? '#0d1513' : '#9fd4c7', 16)}<span>${tab.label}</span><kbd>${BO.Settings.keyLabel(kb[tab.bind])}</kbd></button>`).join('');
            const hp = p.hp;
            const vitals = `<div class="sv-vitals">
                ${meter('HP', hp, p.maxHp, hp < p.maxHp * 0.35 ? 'danger' : 'hp', 'Health', Math.ceil(hp) + ' / ' + p.maxHp + '. Regenerates slowly while food and water are both above 75%.')}
                ${c.options.survivalNeeds ? meter('FOOD', mode.hunger, 100, mode.hunger < 25 ? 'danger' : 'food', 'Food', 'Drains over time. At 0 you lose health. Eat rations, stew or cooked meals.') : ''}
                ${c.options.survivalNeeds ? meter('H2O', deep?.hydration ?? 100, 100, (deep?.hydration ?? 100) < 25 ? 'danger' : 'water', 'Water', 'Drains faster in heat. At 0 you lose health. Drink filtered water from pumps.') : ''}
                ${meter('RAD', mode.radiation, 100, mode.radiation > 60 ? 'danger' : 'rad', 'Radiation', 'Builds up underground and in flood water. Above 75 it hurts. Filters, tea and antibiotics reduce it.')}
                <div class="sv-vital temp"${tip('Body temperature', 'Cold below 2°C drains stamina and below -3°C hurts. Fires, shelters and broth warm you.')}><span class="sv-vital-l">TEMP</span><b>${Math.round(deep?.temp ?? 20)}°C</b></div>
                ${(() => {
                    const w = p.activeWeapon;
                    const cond = w && BO.ZoneLoot.caliberOf(w) ? Math.round(w.cond ?? 75) : null;
                    return cond === null ? '' : `<div class="sv-vital chip ${cond < 30 ? 'warn' : ''}"${tip('Weapon condition', (w.name || 'Weapon') + ' at ' + cond + '%. Below 45% it can jam (press reload to clear); below 15% it misfires. Repair with a gun repair kit.')}>${Icons().named('wrench', cond < 30 ? '#fbbf24' : '#c7d3dc', 15)}<b>${cond}%</b></div>`;
                })()}
                <div class="sv-vital chip"${tip('Campus keycards', 'Recovered from burned nests and named infected. Three open the Black Pine campus gate.')}>${Icons().named('keycard', '#38bdf8', 15)}<b>${c.objectives.keycards}/3</b></div>
                ${mode.fracture ? `<div class="sv-vital chip warn"${tip('Fractured leg', 'You limp and cannot sprint. Craft and use a splint; painkillers dull it for a while.')}>${Icons().named('medkit', '#fbbf24', 15)}<b>Fracture</b></div>` : ''}
                <div class="sv-vital chip"${tip('Armor', 'Armor absorbs damage. Insert spare plates with ' + keyOf('survPlate') + '.')}>${Icons().named('plate', '#c7d3dc', 15)}<b>${Math.round(p.armor)} · ${p.armorReservePlates}</b></div>
            </div>`;
            const status = `<div class="sv-clock"${tip('Time & threat', 'Day ' + c.day + (c.isNight ? ' (night)' : '') + '. ' + (t ? 'Up to ' + t.cap + ' infected may roam right now, drawn from the ' + t.poolSize + ' weakest types.' : 'Hostiles are not active yet.'))}>
                <b>Day ${c.day}</b><span>${c.clockFace}</span><span>${esc(mode.localWeather || mode.weather)}</span>${mode.hostilesReleased ? `<span class="sv-threat-pill ${c.isNight ? 'night' : ''}">${mode.roamingCount}/${t?.cap ?? '-'} roaming</span>` : `<span class="sv-threat-pill safe">Safe ${safeLeft}s</span>`}</div>`;
            return `<div class="sv-frame">
                <header class="sv-thead">
                    <div class="sv-brand">${Icons().named('pack', '#8fe3c8', 20)}<div><span class="sv-kicker">Field terminal</span><b>${esc(c.area?.name || 'Exclusion Zone')}</b></div></div>
                    <nav class="sv-tabs">${tabs}</nav>
                    ${status}
                    ${s === 'respawn' || s === 'gmRespawn' ? '' : `<button class="sv-close" data-act="close"${tip('Close', 'Return to the game (ESC, or press the tab hotkey again).')}>✕</button>`}
                </header>
                ${vitals}
                ${!mode.hostilesReleased ? `<div class="sv-banner safe">Safe period: ${safeLeft}s until hostiles can spawn. Gather branches, stones and fiber by hand and craft your first tools.</div>` : ''}
                ${deep?.bloodMoonActive ? `<div class="sv-banner danger">Blood Moon: ${Math.max(0, Math.ceil(deep.bloodMoonUntil - mode.clock))}s of surging infected remain.</div>` : ''}
                ${ctx && title ? `<div class="sv-ctx-title"><h2>${esc(title)}</h2></div>` : ''}
                <section class="sv-body sv-body-${s}">${body}</section>
                <footer class="sv-foot">${this.feedback ? `<span class="sv-feedback" role="status">${esc(this.feedback)}</span>` : `<span class="sv-hints">${this.footHints(s)}</span>`}</footer>
            </div>`;
        }

        footHints(s) {
            const k = (a) => `<kbd>${keyOf(a)}</kbd>`;
            switch (s) {
                case 'inventory': return 'Drag items onto the hotbar · select an item and press 1–0 to place it · right-click a slot to clear it · <kbd>ESC</kbd> close';
                case 'chest': return 'Click to inspect · shift-click moves the stack · right-click moves half · shift+scroll or double-click moves one · <kbd>ESC</kbd> close';
                case 'crafting': return 'Shift-click any recipe to craft · station recipes unlock within 4 m · ' + k('survCraft') + ' or <kbd>ESC</kbd> close';
                case 'build': return 'Double-click any structure to start placing · <kbd>R</kbd> rotates · ' + k('survBuild') + ' or <kbd>ESC</kbd> close';
                case 'fasttravel': return 'Click any unlocked beacon, fort, signpost or safehouse to travel · ' + k('survTravel') + ' or <kbd>ESC</kbd> close';
                case 'map': return 'Hover markers for details · toggle layers on the right · ' + k('survMap') + ' or <kbd>ESC</kbd> close';
                case 'respawn': return 'Choose how to continue.';
                case 'npc': return 'Trades use materials from your backpack · <kbd>ESC</kbd> close';
                default: return 'Switch tabs with their hotkeys · <kbd>ESC</kbd> close';
            }
        }

        /* ---------------------------------------------------------- inventory */
        hotbarStrip(assignMode) {
            const c = BO.SurvivalMode.campaign;
            const hb = c.hotbar;
            const kb = BO.Settings.getKeybinds();
            return `<div class="sv-hotbar-edit ${assignMode ? 'sv-assign-mode' : ''}">
                <div class="sv-hb-head"><b>Hotbar</b><small>${assignMode ? 'Click a slot to place the selected item there.' : 'Drag weapons, tools and usable items here. Empty slots are bare hands.'}</small></div>
                <div class="sv-hb-row">${hb.slots.map((e, i) => {
                    const label = hb.label(e);
                    return `<button class="sv-hb ${i === hb.selected ? 'active' : ''} ${e ? '' : 'empty'}" data-act="hbSlot" data-arg="${i}" data-hb-slot="${i}" ${e ? `draggable="true" data-drag="slot:${i}"` : ''}${tip('Slot ' + (i + 1) + ' · ' + label, e ? 'Click to inspect. Drag to rearrange. Right-click to clear.' : 'Empty slot: selecting it in game gives you bare hands.', 'Key: ' + BO.Settings.keyLabel(kb['hotbar' + (i + 1)]))}>
                        <span class="sv-hb-key">${BO.Settings.keyLabel(kb['hotbar' + (i + 1)])}</span>${this.entryIcon(e, 26)}${this.entryBadge(e)}</button>`;
                }).join('')}<div class="sv-hb-clear" data-drop-clear${tip('Remove from hotbar', 'Drop a hotbar slot here to clear it.')}>✕</div></div></div>`;
        }

        entryIcon(e, size = 24) {
            const I = Icons();
            if (!e) return `<span class="sv-ico-fist">${I.fist(size)}</span>`;
            if (e.kind === 'weapon') return I.weapon(BO.Player.weapons[e.ref], size);
            if (e.kind === 'tool') return I.tool(e.id, size);
            return I.item(e.id, size);
        }

        entryBadge(e) {
            if (!e) return '';
            const c = BO.SurvivalMode.campaign;
            if (e.kind === 'item') return `<span class="sv-hb-n">${c.pack.inventory[e.id] || 0}</span>`;
            if (e.kind === 'tool') {
                const t = frontier.tools[e.id];
                const d = c.pack.tools[e.id] || 0;
                return `<span class="sv-dura"><i style="width:${pct(d, t.wear)}%" class="${d / t.wear < 0.25 ? 'low' : ''}"></i></span>`;
            }
            const w = BO.Player.weapons[e.ref];
            return w && w.stats.kind !== 'melee' ? `<span class="sv-hb-n">${w.mag}</span>` : '';
        }

        tabInventory() {
            const c = BO.SurvivalMode.campaign;
            const pack = c.pack;
            const p = BO.Player;
            const deep = c.deep;
            const dd = deepData();
            const inv = pack.inventory;
            const lim = pack.limits;
            const weight = pack.weight();
            const cats = ['All', 'Food', 'Ammunition', 'Raw materials', 'Components', 'Consumables', 'Equipment', 'Lighting', 'Tools', 'Keys'];
            const order = Object.keys(frontier.items);
            let items = Object.entries(inv).filter(([id, n]) => n > 0 && frontier.items[id] && (this.packFilter === 'All' || frontier.items[id][1] === this.packFilter));
            const sorters = {
                category: (a, b) => cats.indexOf(frontier.items[a[0]][1]) - cats.indexOf(frontier.items[b[0]][1]) || order.indexOf(a[0]) - order.indexOf(b[0]),
                name: (a, b) => itemName(a[0]).localeCompare(itemName(b[0])),
                weight: (a, b) => frontier.items[b[0]][2] * b[1] - frontier.items[a[0]][2] * a[1],
                count: (a, b) => b[1] - a[1]
            };
            items.sort(sorters[this.packSort] || sorters.category);
            const used = pack.slots();
            const empties = this.packFilter === 'All' ? Math.max(0, lim.slots - used) : 0;
            const sel = this.selItem;
            const hotLoot = BO.GM?.active ? (BO.GM.get('loot')?.hot || {}) : {};
            const catalogue = BO.GM?.active ? BO.GM.get('catalogue') : null;
            const RAR = { common: '', uncommon: '#86efac', rare: '#60a5fa', legendary: '#fbbf24' };
            const tiles = items.map(([id, n]) => {
                const [name, cat, kg] = frontier.items[id];
                const usable = BO.SurvivalHotbar.usable.has(id);
                const hot = (hotLoot[id] || 0) > 0;
                const rar = RAR[catalogue?.byKey?.get('it:' + id)?.rarity] || '';
                return `<button class="sv-tile ${sel?.kind === 'item' && sel.id === id ? 'selected' : ''} ${hot ? 'hot' : ''}" ${rar ? `style="--rar:${rar}"` : ''} data-act="selItem" data-arg="item:${id}" ${usable ? `draggable="true" data-drag="item:${id}"` : ''}${tip(name + ' ×' + n, ITEM_INFO[id] || cat, cat + ' · ' + (kg * n).toFixed(1) + ' kg' + (usable ? ' · usable, can go on the hotbar' : '') + (hot ? ' · HOT: stash it at base for the haul bonus' : ''))}>
                    ${Icons().item(id, 30)}<span class="sv-tile-n">${n}</span><span class="sv-tile-name">${esc(name)}</span>${usable ? '<span class="sv-tile-use"></span>' : ''}${hot ? '<span class="sv-tile-hot">◆</span>' : ''}${rar ? '<span class="sv-tile-rar"></span>' : ''}</button>`;
            }).join('') + Array.from({ length: Math.min(empties, 40) }, () => '<span class="sv-tile empty"></span>').join('');

            const weapons = p.weapons.map((w, ref) => {
                const cond = Math.round(w.cond ?? 100);
                const rar = BO.ZoneThrill?.rarityOf?.(w);
                return `<button class="sv-eq ${sel?.kind === 'weapon' && sel.id === String(ref) ? 'selected' : ''}" ${rar && rar.id !== 'common' ? `style="--rar:${rar.css}"` : ''} data-act="selItem" data-arg="weapon:${ref}" draggable="true" data-drag="weapon:${ref}"${tip(w.stats.name || w.stats.shortName, w.stats.kind === 'melee' ? 'Melee weapon.' : 'Magazine ' + w.mag + '/' + w.stats.magSize + ' · ' + w.reserve + ' in reserve.', (rar ? rar.name + ' · ' : '') + cond + '% condition · drag onto the hotbar')}>
                ${Icons().weapon(w, 26)}<span class="sv-eq-t"><b>${esc(w.stats.shortName || w.stats.name)}${w.survivalMk > 1 ? ' <em>Mk ' + w.survivalMk + '</em>' : ''}</b><small>${w.stats.kind === 'melee' ? 'Melee' : w.mag + ' / ' + w.reserve} · ${cond}%</small><span class="sv-dura wide"><i style="width:${cond}%" class="${cond < 25 ? 'low' : ''}"></i></span></span></button>`;
            }).join('');
            const tools = Object.entries(pack.tools).map(([id, d]) => {
                const t = frontier.tools[id];
                return `<button class="sv-eq ${sel?.kind === 'tool' && sel.id === id ? 'selected' : ''} ${d > 0 ? '' : 'broken'}" data-act="selItem" data-arg="tool:${id}" draggable="true" data-drag="tool:${id}"${tip(t.name, 'Tier ' + t.level + ' ' + t.family + ' · gathering power ' + t.power + '.', Math.ceil(d) + ' / ' + t.wear + ' durability')}>
                    ${Icons().tool(id, 26)}<span class="sv-eq-t"><b>${esc(t.name)}</b><span class="sv-dura wide"><i style="width:${pct(d, t.wear)}%" class="${d / t.wear < 0.25 ? 'low' : ''}"></i></span></span></button>`;
            }).join('') || '<p class="sv-muted sm">No tools yet. Craft a stone hatchet or pickaxe from timber, stone and braided cord.</p>';
            const lit = pack.lightUntil > BO.SurvivalMode.clock;
            return `<div class="sv-inv">
                <aside class="sv-inv-eq sv-scroll" data-scroll="eq">
                    <h4 class="sv-sub">Weapons</h4>${weapons}
                    <h4 class="sv-sub">Tools</h4>${tools}
                    <h4 class="sv-sub">Field kit</h4>
                    <div class="sv-kit">
                        <button class="sv-btn sm ${p.armorReservePlates ? '' : 'dis'}" data-act="plate" ${p.armorReservePlates && p.armor < p.maxArmor ? '' : 'disabled'}${tip('Insert armor plate', 'Spend a spare plate to restore armor. Hotkey: ' + keyOf('survPlate'))}>${Icons().named('plate', '#c7d3dc', 16)} Plate (${p.armorReservePlates})</button>
                        <button class="sv-btn sm" data-act="light"${tip(lit ? 'Put out light' : 'Light torch / lantern', 'Hotkey: ' + keyOf('survLight') + '. A lantern needs one fuel per lighting.')}>${Icons().named(lit ? 'lantern' : 'torch', '#ffc46e', 16)} ${lit ? 'Light off' : 'Light'}</button>
                        <button class="sv-btn sm" data-act="flask" ${(inv.bandage || 0) + (inv.medkits || 0) + (inv.splint || 0) > 0 ? '' : 'disabled'}${tip('Quick heal', 'Uses the best medical item you carry. Hotkey: ' + keyOf('survFlask'))}>${Icons().named('medkit', '#9be3a6', 16)} Heal (${(inv.bandage || 0) + (inv.medkits || 0)})</button>
                    </div>
                    ${pack.filtered ? `<p class="sv-muted sm">Respirator filter active · ${Math.ceil(pack.filterUntil - BO.SurvivalMode.clock)}s</p>` : ''}
                    ${(() => {
                        const stashList = Object.entries(career.profile.stash || {}).filter(([id, n]) => frontier.items[id] && n > 0);
                        if (!stashList.length) return '';
                        const atRelay = c.area?.id === 'relay';
                        return `<h4 class="sv-sub">Safe-house stash <small>${stashList.reduce((s, [, n]) => s + n, 0)}</small></h4>
                            <div class="sv-chip-row">${stashList.map(([id, n]) => `<span class="sv-modchip">${esc(itemName(id))} ×${n}</span>`).join('')}</div>
                            <button class="sv-btn sm" data-act="withdrawStash" ${atRelay ? '' : 'disabled'}${tip('Withdraw Safe-House Stash', atRelay ? 'Move banked items from past extractions into your backpack.' : 'Return to Relay Sanctuary to withdraw banked items.')}>${atRelay ? 'Withdraw to pack' : 'Relay only'}</button>`;
                    })()}
                </aside>
                <section class="sv-inv-pack">
                    <div class="sv-pack-head">
                        <div class="sv-pack-cap"${tip(lim.name, 'Carry weight and unique stacks are both limited. Craft a bigger pack at a workbench.', weight.toFixed(1) + ' / ' + lim.weight + ' kg · ' + used + ' / ' + lim.slots + ' stacks')}>
                            <b>${esc(lim.name)}</b>
                            <span class="sv-cap-bar"><i style="width:${pct(weight, lim.weight)}%" class="${weight / lim.weight > 0.9 ? 'full' : ''}"></i></span>
                            <small>${weight.toFixed(1)} / ${lim.weight} kg · ${used}/${lim.slots} stacks</small>
                        </div>
                        <div class="sv-pack-tools">
                            <div class="sv-filter">${cats.map((cat) => `<button class="${cat === this.packFilter ? 'active' : ''}" data-act="filter" data-arg="${cat}"${tip(cat, cat === 'All' ? 'Show everything in your pack.' : 'Show only ' + cat.toLowerCase() + '.')}>${cat === 'Raw materials' ? 'Raw' : cat}</button>`).join('')}</div>
                            <label class="sv-sort"${tip('Sort', 'Change the order of your backpack.')}><span>Sort</span>${['category', 'name', 'weight', 'count'].map((k) => `<button class="${this.packSort === k ? 'active' : ''}" data-act="sort" data-arg="${k}">${k}</button>`).join('')}</label>
                        </div>
                    </div>
                    <div class="sv-grid sv-scroll" data-scroll="grid" data-drop-clear>${tiles || '<p class="sv-muted">Nothing here yet.</p>'}</div>
                    ${this.hotbarStrip(!!sel && (sel.kind !== 'item' || BO.SurvivalHotbar.usable.has(sel.id)))}
                </section>
                <aside class="sv-detail sv-scroll" data-scroll="detail">${this.detailPanel(sel)}</aside>
            </div>`;
        }

        detailPanel(sel) {
            const c = BO.SurvivalMode.campaign;
            const pack = c.pack;
            const hb = c.hotbar;
            const I = Icons();
            if (!sel) {
                return `<div class="sv-empty-detail">${I.named('chest', '#5f7f75', 44)}<b>Select an item</b><p>Click anything in your backpack, equipment or hotbar to see what it does and what you can do with it.</p>
                    <ul class="sv-howto"><li><b>Bare hands</b> break branches, stones, fiber, and tier-1 trees and rocks — slowly.</li><li><b>Tools</b> gather four times faster and reach tier-2 deposits.</li><li>Hold a tool on the hotbar and click to swing it.</li></ul></div>`;
            }
            const slotButtons = (kind, id) => `<div class="sv-put"><small>Put on hotbar</small><div class="sv-put-row">${hb.slots.map((e, i) =>
                `<button class="${hb.indexOf(kind === 'weapon' ? { kind, ref: Number(id) } : { kind, id }) === i ? 'here' : ''} ${e ? 'used' : ''}" data-act="hbPut" data-arg="${i}"${tip('Slot ' + (i + 1), e ? 'Replaces ' + hb.label(e) + ' (it moves to this item\'s old slot).' : 'Empty slot.')}>${BO.Settings.keyLabel(BO.Settings.getKeybinds()['hotbar' + (i + 1)])}</button>`).join('')}</div></div>`;
            if (sel.kind === 'item') {
                const id = sel.id;
                const n = pack.inventory[id] || 0;
                const info = frontier.items[id];
                if (!info) return '';
                const usable = BO.SurvivalHotbar.usable.has(id);
                const chestOpen = this.section === 'chest';
                return `<div class="sv-detail-head">${I.item(id, 44)}<div><h3>${esc(info[0])}</h3><small>${esc(info[1])} · ${info[2]} kg each</small></div></div>
                    <p class="sv-detail-text">${esc(ITEM_INFO[id] || 'Crafting material.')}</p>
                    ${BO.GM?.active ? (BO.GM.get('compare')?.plateHtml?.(id) || '') : ''}
                    <dl class="sv-kv"><div><dt>Carried</dt><dd>${n}</dd></div><div><dt>Weight</dt><dd>${(info[2] * n).toFixed(2)} kg</dd></div></dl>
                    <div class="sv-actions">
                        ${usable ? `<button class="sv-btn primary" data-act="use" data-arg="${id}" ${n ? '' : 'disabled'}${tip('Use', 'Consume one now.')}>Use</button>` : ''}
                        ${chestOpen ? `<button class="sv-btn" data-act="transfer" data-arg="store:${id}:one" ${n ? '' : 'disabled'}>Store 1</button><button class="sv-btn" data-act="transfer" data-arg="store:${id}:all" ${n ? '' : 'disabled'}>Store all</button>` : ''}
                        <button class="sv-btn ghost" data-act="drop" data-arg="${id}:one" ${n ? '' : 'disabled'}${tip('Drop one', 'Drops one on the ground in a bag you can pick up again.')}>Drop 1</button>
                        ${n > 1 ? `<button class="sv-btn ghost" data-act="drop" data-arg="${id}:all"${tip('Drop stack', 'Drops the whole stack in a bag on the ground.')}>Drop all</button>` : ''}
                    </div>
                    ${usable && n ? slotButtons('item', id) : ''}`;
            }
            if (sel.kind === 'tool') {
                const t = frontier.tools[sel.id];
                const d = pack.tools[sel.id] ?? 0;
                const targets = Object.values(frontier.resources).filter((r) => r.tool === t.family && r.tier <= t.level).map((r) => r.name);
                return `<div class="sv-detail-head">${I.tool(sel.id, 44)}<div><h3>${esc(t.name)}</h3><small>Tier ${t.level} ${t.family}</small></div></div>
                    <div class="sv-dura big"><i style="width:${pct(d, t.wear)}%" class="${d / t.wear < 0.25 ? 'low' : ''}"></i></div>
                    <dl class="sv-kv"><div><dt>Durability</dt><dd>${Math.ceil(d)} / ${t.wear}</dd></div><div><dt>Power</dt><dd>${t.power} per swing</dd></div><div><dt>Vs. hands</dt><dd>${Math.round(t.power / 0.25)}× faster</dd></div></dl>
                    <p class="sv-detail-text">Works: ${esc(targets.join(', ') || '—')}.</p>
                    <div class="sv-actions">
                        <button class="sv-btn primary" data-act="equipTool" data-arg="${sel.id}" ${d > 0 ? '' : 'disabled'}${tip('Hold', 'Select this tool on the hotbar.')}>Hold</button>
                        <button class="sv-btn" data-act="repairTool" data-arg="${sel.id}" ${(pack.inventory.repair || 0) > 0 && d < t.wear ? '' : 'disabled'}${tip('Repair', 'Uses one field repair kit: +24 durability.', 'Kits: ' + (pack.inventory.repair || 0))}>Repair</button>
                    </div>${slotButtons('tool', sel.id)}`;
            }
            if (sel.kind === 'weapon') {
                const ref = Number(sel.id);
                const w = BO.Player.weapons[ref];
                if (!w) return '';
                const st = w.stats;
                const rar = w.cfg?.rarity && BO.ZoneThrill ? BO.ZoneThrill.describe({ rarity: w.cfg.rarity, perks: w.cfg.perks || [], title: w.cfg.title }, st.name || st.shortName) : null;
                const cond = Math.round(w.cond ?? 100), maxCond = Math.round(w.maxCond ?? 100);
                const atts = Object.values(w.cfg?.attachments || {}).filter(Boolean).map((id) => BO.AttachmentsData?.ATTACHMENTS?.[id]?.name || id);
                const core = w.cfg?.survCore ? BO.ZoneArmory?.CORES?.[w.cfg.survCore]?.name : null;
                const canRepair = st.kind !== 'melee' && ((pack.inventory.gunkit || 0) > 0 || BO.SurvivalMode.campaign?.has('sv_free_craft')) && cond < maxCond - 1;
                const atBench = BO.SurvivalMode.campaign?.stationAvailable('bench') || BO.SurvivalMode.campaign?.stationAvailable('armoryBench');
                return `<div class="sv-detail-head">${I.weapon(w, 44)}<div><h3>${esc(rar ? rar.title : (st.name || st.shortName))}${w.survivalMk > 1 ? ' Mk ' + w.survivalMk : ''}</h3><small>${rar ? `<span style="color:${rar.rarity.color};font-weight:700">${esc(rar.rarity.name)}</span> · ` : ''}${st.kind === 'melee' ? 'Melee weapon' : esc(w.fireMode || st.fireMode || '').toUpperCase()}${st.suppressed ? ' · SUPPRESSED' : ''}</small></div></div>
                    ${rar?.traits?.length ? `<p class="sv-detail-text" style="color:${rar.rarity.color}">Traits: <b>${esc(rar.traits.join(' · '))}</b></p>` : ''}
                    ${atts.length || core ? `<p class="sv-detail-text">Fitted: ${esc([...atts, ...(core ? [core] : [])].join(', '))}</p>` : ''}
                    <dl class="sv-kv">${st.kind === 'melee' ? `<div><dt>Damage</dt><dd>${st.damage}</dd></div>` : `
                        <div><dt>Damage</dt><dd>${st.damage}</dd></div><div><dt>Magazine</dt><dd>${w.mag} / ${st.magSize}</dd></div>
                        <div><dt>Reserve</dt><dd>${w.reserve}</dd></div><div><dt>Condition</dt><dd>${cond}%${maxCond < 100 ? ` <small>(max ${maxCond}%)</small>` : ''}</dd></div>`}</dl>
                    <p class="sv-detail-text">${st.kind === 'melee' ? 'Swing with the fire button.' : 'Reload from matching calibre rounds in your pack, repair wear with weapon repair kits, and fit 3D optics, suppressors & elemental cores at a workbench.'}</p>
                    <div class="sv-actions">
                        ${st.kind !== 'melee' ? `<button class="sv-btn" data-act="repairGun" data-arg="${ref}" ${canRepair ? '' : 'disabled'}${tip('Repair firearm', 'Uses 1 weapon repair kit (+35% condition, clears jams).', 'Kits: ' + (pack.inventory.gunkit || 0))}>Repair</button>` : ''}
                        ${BO.ZoneArmory ? `<button class="sv-btn primary" data-act="openGunsmith" data-arg="${ref}" ${atBench ? '' : 'disabled'}${tip('Gunsmith & Anvil', atBench ? 'Fit 3D scopes, suppressors, extended mags, camos and Resonance cores.' : 'Stand near a crafting table or Armory bench to customize this weapon.')}>Gunsmith</button>` : ''}
                    </div>
                    ${slotButtons('weapon', ref)}`;
            }
            return '';
        }

        ctxChest() {
            const c = BO.SurvivalMode.campaign;
            const pack = c.pack;
            const chestKey = BO.ZoneWorldPlus?.resolveChestKey?.(this.subject) || this.subject;
            const limits = BO.ZoneWorldPlus?.chestLimits?.(this.subject) || { weight: 54, slots: 18, label: 'Chest' };
            const stored = pack.chests.get(chestKey) || {};
            const sel = this.selItem;
            const grid = (items, side) => Object.entries(items).filter(([id, n]) => frontier.items[id] && n > 0).map(([id, n]) => `
                <button class="sv-tile ${sel?.kind === 'item' && sel.id === id && this.selSide === side ? 'selected' : ''}" data-act="selItem" data-arg="item:${id}" data-side="${side}" data-mv-act="transfer" data-mv-arg="${side === 'pack' ? 'store' : 'take'}:${id}:N" data-mv-max="${n}"${tip(itemName(id) + ' ×' + n, ITEM_INFO[id] || '', 'Shift-click moves the stack · right-click moves half · shift+scroll or double-click moves one')}>
                ${Icons().item(id, 28)}<span class="sv-tile-n">${n}</span><span class="sv-tile-name">${esc(itemName(id))}</span></button>`).join('');
            const chestW = pack.weight(stored);
            const selStored = sel?.kind === 'item' ? stored[sel.id] || 0 : 0;
            return `<div class="sv-chest">
                <section><div class="sv-pack-cap"><b>Backpack</b><span class="sv-cap-bar"><i style="width:${pct(pack.weight(), pack.limits.weight)}%"></i></span><small>${pack.weight().toFixed(1)} / ${pack.limits.weight} kg</small></div>
                    <div class="sv-grid sv-scroll" data-scroll="pgrid">${grid(pack.inventory, 'pack') || '<p class="sv-muted">Your pack is empty.</p>'}</div></section>
                <section><div class="sv-pack-cap"><b>${esc(limits.label || 'Chest')}</b><span class="sv-cap-bar"><i style="width:${pct(chestW, limits.weight)}%"></i></span><small>${chestW.toFixed(1)} / ${limits.weight} kg · ${pack.slots(stored)}/${limits.slots} stacks</small></div>
                    <div class="sv-grid sv-scroll" data-scroll="cgrid">${grid(stored, 'chest') || '<p class="sv-muted">Empty storage.</p>'}</div></section>
                <aside class="sv-detail sv-scroll">${sel?.kind === 'item' ? `${this.detailPanel(sel)}
                    ${selStored ? `<div class="sv-actions"><button class="sv-btn sm" data-act="transfer" data-arg="take:${sel.id}:one">Take 1</button><button class="sv-btn sm primary" data-act="transfer" data-arg="take:${sel.id}:all">Take all (${selStored})</button></div>` : ''}` : '<div class="sv-empty-detail"><b>Quick Transfer</b><p>Shift-click a stack to move all of it, right-click to move half, and hold Shift while scrolling over it (or double-click) to move one at a time.</p></div>'}</aside>
            </div>`;
        }

        /* ---------------------------------------------------------- crafting */
        recipes() {
            const mode = BO.SurvivalMode;
            const c = mode.campaign;
            const pack = c.pack;
            const deep = c.deep;
            const inv = BO.GM?.get('storage')?.available?.() || pack.inventory;
            const out = [];
            const techName = (id) => deepData().techTree?.find((t) => t.id === id)?.name || id;
            const status = (r) => {
                if (r.owned) return 'owned';
                if (r.lock) return 'locked';
                if (!c.stationAvailable(r.station)) return 'station';
                if (!mode.canAfford(r.cost)) return 'missing';
                if (r.blocked) return 'blocked';
                return 'ready';
            };
            for (const r of frontier.recipes) {
                if (r.pack !== undefined && r.pack <= pack.level) continue;
                const entry = { key: 'f:' + r.id, id: r.id, name: r.name, desc: r.desc, station: r.station, cost: r.cost,
                    gain: r.gain, cat: r.pack !== undefined ? 'gear' : (RECIPE_CAT[r.id] || r.cat || 'materials') };
                if (r.tech && deep && !deep.hasTech(r.tech)) entry.lock = 'Research “' + techName(r.tech) + '” in Skills.';
                if (r.pack !== undefined && r.pack !== pack.level + 1) entry.lock = 'Craft the previous pack first.';
                if (r.pack !== undefined) entry.glyph = 'chest';
                if (!entry.lock && mode.canAfford(r.cost) && c.stationAvailable(r.station) && !pack.canCraft(r)) entry.blocked = 'Not enough pack room for the result.';
                out.push(entry);
            }
            for (const [id, t] of Object.entries(frontier.tools)) {
                const owned = pack.tools[id] > 0;
                out.push({ key: 't:' + id, id, name: t.name, station: t.station, cost: t.cost, cat: 'tools', tool: true,
                    desc: 'Tier ' + t.level + ' ' + t.family + ' · ' + t.wear + ' durability · power ' + t.power + '. ' +
                        (t.family === 'axe' ? 'Fells trees and breaks timber.' : t.family === 'pick' ? 'Mines stone and ore.' : 'Digs clay and buried salvage.'),
                    owned, ownedText: owned ? Math.ceil(pack.tools[id]) + ' / ' + t.wear + ' durability' : null });
            }
            for (const r of BO.SurvivalData.recipes) {
                const station = r.id === 'cook' ? 'campfire' : 'bench';
                out.push({ key: 'l:' + r.id, id: r.id, name: r.name, desc: r.detail + (r.id === 'coilgun' ? ' Replaces your secondary weapon.' : ''), station,
                    cost: r.cost, cat: RECIPE_CAT[r.id] || 'gear', legacy: true, glyph: { ammo: 'rifle', medkit: 'medkit', cook: 'bowl', incendiary: 'fire', coilgun: 'coilgun' }[r.id] });
            }
            for (const sch of deepData().weaponSchematics || []) {
                const unlocked = deep?.hasTech(sch.tech) || deep?.unlockedSchematics.has(sch.id);
                const spec = BO.WeaponsData.get(sch.id);
                out.push({ key: 'w:' + sch.id, id: sch.id, name: sch.name, cost: sch.cost, station: 'bench', cat: 'weapons', glyph: spec?.kind === 'melee' ? 'blade' : 'rifle',
                    desc: 'Forge a ' + (spec?.name || sch.name) + ' and equip it' + (sch.ammo > 1 ? ' with ' + sch.ammo + ' rounds' : '') + '. Replaces the weapon in your active slot when both are full.',
                    lock: unlocked ? null : 'Research “' + techName(sch.tech) + '” or find its schematic.', forge: true });
            }
            if (!BO.GM?.active) BO.Player.weapons.forEach((w, ref) => {
                if (w.stats.kind === 'melee' || w.survivalCoil) return;
                const mk = w.survivalMk || 1;
                const base = mk === 1 ? { ingot: 2, scrap: 3 } : { ingot: 3, aetherShard: 1, wire: 2 };
                const uMult = deep?.modFx?.upgradeCostMult || 1;
                const cost = uMult < 1 ? Object.fromEntries(Object.entries(base).map(([k, v]) => [k, Math.max(1, Math.round(v * uMult))])) : base;
                out.push({ key: 'u:' + ref, id: String(ref), name: 'Upgrade ' + (w.stats.shortName || w.stats.name) + ' to Mk ' + (mk + 1), cost, station: 'bench', cat: 'weapons', glyph: 'rifle',
                    desc: 'More damage, a larger magazine and faster reloads.', owned: mk >= 3, ownedText: 'Already Mk III',
                    lock: deep?.hasTech('t2_gunsmith') ? null : 'Research “Weapon Mk II / III Bench” in Skills.', upgrade: true });
            });
            for (const r of out) {
                r.status = status(r);
                r.canCraft = r.status === 'ready';
                r.have = inv;
            }
            return out;
        }

        craftRecipe(key, times = 1) {
            const mode = BO.SurvivalMode;
            const c = mode.campaign;
            const [kind, id] = [key.slice(0, 1), key.slice(2)];
            let made = 0;
            for (let i = 0; i < times; i++) {
                let ok = false;
                if (kind === 'f' || kind === 't') ok = c.pack.craft(id);
                else if (kind === 'l') ok = mode.craft(id);
                else if (kind === 'w') ok = c.deep?.forgeWeapon(id);
                else if (kind === 'u') {
                    const ref = Number(id);
                    BO.Player.equipSurvivalSlot(ref, null, true);
                    c.hotbar.reconcile();
                    ok = c.deep?.upgradeEquippedWeapon();
                }
                if (!ok) break;
                made++;
            }
            c.hotbar.reconcile();
            const label = this.recipes().find((r) => r.key === key)?.name || 'Item';
            if (made > 1) this.feedback = label + ' crafted ×' + made + '.';
            else if (made === 1) this.feedback = label + (kind === 'u' ? ' complete.' : kind === 'w' ? ' forged and equipped.' : ' crafted.');
            else if (!made) this.feedback = 'Cannot craft that right now.';
        }

        /** Recipes the player has discovered, with "almost" (one ingredient short) flagged. */
        craftList() {
            const RM = BO.GM?.active ? BO.GM.get('recipes') : null;
            const raw = this.recipes();
            const all = RM ? raw.filter((r) => RM.recipeVisible(r)) : raw;
            for (const r of all) {
                if (r.status !== 'missing') continue;
                const short = Object.entries(r.cost || {}).filter(([id, n]) => (r.have[id] || 0) < n).map(([id, n]) => [id, n - (r.have[id] || 0)]);
                if (short.length === 1) { r.status = 'almost'; r.short = short[0]; }
            }
            return { all, hidden: raw.length - all.length };
        }

        craftRows(all) {
            const rank = { ready: 0, almost: 1, missing: 2, blocked: 3, station: 4, locked: 5, owned: 6 };
            const groups = { ready: 'Craftable now', almost: 'One ingredient away', missing: 'Missing materials', blocked: 'Pack full', station: 'Needs a station', locked: 'Locked', owned: 'Owned' };
            const q = String(this.craftQuery || '').trim().toLowerCase();
            const match = (r) => !q || r.name.toLowerCase().includes(q) || String(r.desc || '').toLowerCase().includes(q) ||
                Object.keys(r.cost || {}).some((id) => itemName(id).toLowerCase().includes(q)) || Object.keys(r.gain || {}).some((id) => itemName(id).toLowerCase().includes(q));
            const list = all.filter((r) => (q || this.craftCat === 'all' || r.cat === this.craftCat) && match(r))
                .sort((a, b) => rank[a.status] - rank[b.status] || a.name.localeCompare(b.name));
            const icon = (r, size) => r.tool ? Icons().tool(r.id, size) : r.glyph ? Icons().named(r.glyph, '#cfe3da', size) : Icons().item(Object.keys(r.gain || {})[0] || r.id, size);
            const statusText = { ready: 'Ready', almost: 'One ingredient short', missing: 'Missing materials', station: 'Needs a station', locked: 'Locked', owned: 'Owned', blocked: 'Pack full' };
            const pack = BO.SurvivalMode.campaign.pack.inventory;
            let lastGroup = null;
            const rows = list.map((r) => {
                const head = r.status !== lastGroup ? `<div class="sv-rec-group g-${r.status}">${groups[r.status]}</div>` : '';
                lastGroup = r.status;
                const fromStore = Object.entries(r.cost || {}).some(([id, n]) => (pack[id] || 0) < n && (r.have[id] || 0) >= n);
                const sub = r.status === 'almost' ? 'Need ' + r.short[1] + ' × ' + esc(itemName(r.short[0]))
                    : STATION_NAME[r.station] + (r.status === 'owned' && r.ownedText ? ' · ' + esc(r.ownedText) : '') + (fromStore && r.status === 'ready' ? ' · uses base storage' : '');
                return head + `<button class="sv-rec ${r.key === this.selRecipe ? 'selected' : ''} st-${r.status}" data-act="recipe" data-arg="${r.key}"${tip(r.name, r.desc || '', r.status === 'station' ? 'Needs ' + STATION_NAME[r.station] : statusText[r.status])}>
                <span class="sv-rec-ico">${icon(r, 24)}</span><span class="sv-rec-t"><b>${esc(r.name)}</b><small>${sub}</small></span>
                <span class="sv-rec-st">${r.status === 'ready' ? '●' : r.status === 'almost' ? '◐' : r.status === 'locked' ? '🔒' : r.status === 'owned' ? '✓' : ''}</span></button>`;
            }).join('') || `<p class="sv-muted">${q ? 'No discovered recipe matches “' + esc(q) + '”.' : 'No recipes in this category yet.'}</p>`;
            return { list, rows };
        }

        tabCrafting() {
            const c = BO.SurvivalMode.campaign;
            const { all, hidden } = this.craftList();
            const { list, rows } = this.craftRows(all);
            if (!this.selRecipe || !all.some((r) => r.key === this.selRecipe)) this.selRecipe = list[0]?.key;
            const sel = all.find((r) => r.key === this.selRecipe);
            const here = c.stations;
            const icon = (r, size) => r.tool ? Icons().tool(r.id, size) : r.glyph ? Icons().named(r.glyph, '#cfe3da', size) : Icons().item(Object.keys(r.gain || {})[0] || r.id, size);
            const stationBar = `<div class="sv-stations">${['hand', 'bench', 'campfire', 'kiln'].filter((st) => st === 'hand' || st === 'bench' || st === 'campfire' || st === 'kiln' || here.includes(st) || all.some((r) => r.station === st)).map((st) => `<span class="sv-station ${here.includes(st) ? 'on' : ''}"${tip(STATION_NAME[st] || st, STATION_TIP[st] || '', here.includes(st) ? 'Available here' : 'Not in reach')}>${Icons().named({ hand: 'fist', bench: 'bench', campfire: 'fire', kiln: 'kiln', cookstation: 'stove', alchemy: 'flask', arcane: 'rune' }[st] || 'wrench', here.includes(st) ? '#9fe0c9' : '#56645f', 15)}${STATION_NAME[st] || st}</span>`).join('')}</div>`;
            const cats = CRAFT_CATS.map(([id, label, glyph]) => {
                const n = all.filter((r) => (id === 'all' || r.cat === id) && r.status === 'ready').length;
                return `<button class="sv-cat ${this.craftCat === id ? 'active' : ''}" data-act="craftCat" data-arg="${id}"${tip(label, n + ' recipe(s) you can craft right now.')}>${Icons().named(glyph, this.craftCat === id ? '#0d1513' : '#9fd4c7', 16)}<span>${label}</span>${n ? `<em>${n}</em>` : ''}</button>`;
            }).join('');
            let detail = '<div class="sv-empty-detail"><b>Select a recipe</b></div>';
            if (sel) {
                const reason = sel.status === 'locked' ? sel.lock : sel.status === 'station' ? 'Stand within 4 m of a ' + STATION_NAME[sel.station].toLowerCase() + '.' :
                    sel.status === 'almost' ? 'Only ' + sel.short[1] + ' × ' + itemName(sel.short[0]) + ' short.' :
                    sel.status === 'missing' ? 'Gather the missing materials.' : sel.status === 'owned' ? (sel.ownedText || 'Already owned.') : sel.status === 'blocked' ? sel.blocked : '';
                const gainList = sel.gain && Object.keys(sel.gain).length ? Object.entries(sel.gain).map(([id, n]) => `<span class="sv-gain">${Icons().item(id, 18)} ${n} × ${esc(itemName(id))}</span>`).join('') : '';
                const repeatable = (sel.key.startsWith('f:') && !sel.key.includes('Pack') && frontier.recipes.find((r) => r.id === sel.id)?.pack === undefined) || sel.key === 'l:ammo' || sel.key === 'l:medkit';
                detail = `<div class="sv-detail-head">${icon(sel, 44)}<div><h3>${esc(sel.name)}</h3><small>${STATION_NAME[sel.station]}</small></div></div>
                    <p class="sv-detail-text">${esc(sel.desc || '')}</p>
                    ${gainList ? `<div class="sv-gains"><small>Produces</small>${gainList}</div>` : ''}
                    <h4 class="sv-sub">Ingredients</h4><ul class="sv-costs">${costRows(sel.cost, sel.have)}</ul>
                    <div class="sv-req ${c.stationAvailable(sel.station) ? 'ok' : 'short'}"${tip(STATION_NAME[sel.station], STATION_TIP[sel.station])}>${c.stationAvailable(sel.station) ? '✓' : '✕'} ${STATION_NAME[sel.station]}${sel.station === 'hand' ? '' : c.stationAvailable(sel.station) ? ' in reach' : ' not in reach'}</div>
                    ${sel.lock ? `<div class="sv-req short">🔒 ${esc(sel.lock)}</div>` : ''}
                    <div class="sv-actions">
                        <button class="sv-btn primary" data-act="craft" data-arg="${sel.key}" ${sel.canCraft ? '' : 'disabled'}${tip('Craft', sel.canCraft ? 'Craft one now.' : reason)}>${sel.forge ? 'Forge' : sel.upgrade ? 'Upgrade' : 'Craft'}</button>
                        ${repeatable ? `<button class="sv-btn" data-act="craft" data-arg="${sel.key}" data-times="5" ${sel.canCraft ? '' : 'disabled'}${tip('Craft up to 5', 'Repeats the recipe until you run out of materials or room (max 5).')}>×5</button>` : ''}
                    </div>${!sel.canCraft && reason ? `<p class="sv-reason">${esc(reason)}</p>` : ''}`;
            }
            return `<div class="sv-craft">
                <nav class="sv-cats">${stationBar}${cats}</nav>
                <div class="sv-rec-col">
                    <input id="sv-craft-search" class="sv-search" type="search" autocomplete="off" spellcheck="false" placeholder="Search recipes or ingredients…" value="${esc(this.craftQuery || '')}"${tip('Search', 'Filters every discovered recipe by name, ingredient or result.')} />
                    <section id="sv-rec-rows" class="sv-rec-list sv-scroll" data-scroll="recipes-${this.craftCat}">${rows}</section>
                    ${hidden ? `<p class="sv-undiscovered">${hidden} recipe${hidden === 1 ? '' : 's'} still to discover · pick up new materials to reveal them</p>` : ''}
                </div>
                <aside class="sv-detail sv-scroll" data-scroll="rdetail">${detail}</aside>
            </div>`;
        }

        /* ---------------------------------------------------------- build */
        tabBuild() {
            const mode = BO.SurvivalMode;
            const c = mode.campaign;
            const deep = c.deep;
            const inv = BO.GM?.get('storage')?.available?.() || mode.points;
            const RM = BO.GM?.active ? BO.GM.get('recipes') : null;
            const listed = data.build.filter((b) => !BUILD_HIDDEN.has(b.id));
            const known = listed.filter((b) => !RM || RM.buildVisible(b));
            const hidden = listed.length - known.length;
            const tabOf = (b) => BUILD_TAB_OF[b.id] || 'craft';
            const costOfB = (b) => BO.buildCostOf(b);
            if (!this.buildTab || !BUILD_TABS.some(([id]) => id === this.buildTab)) this.buildTab = 'shelter';
            const pieces = known.filter((b) => tabOf(b) === this.buildTab);
            const tabs = BUILD_TABS.map(([id, label, glyph]) => {
                const n = known.filter((b) => tabOf(b) === id).length;
                const ready = known.filter((b) => tabOf(b) === id && mode.canAfford(costOfB(b))).length;
                return `<button class="sv-btab ${this.buildTab === id ? 'active' : ''}" data-act="buildTab" data-arg="${id}" ${n ? '' : 'disabled'}${tip(label, n ? n + ' known blueprint(s), ' + ready + ' affordable.' : 'No blueprints discovered here yet.')}>${Icons().named(glyph, this.buildTab === id ? '#0d1513' : '#9fd4c7', 15)}<span>${label}</span>${ready ? `<em>${ready}</em>` : ''}</button>`;
            }).join('');
            const undiscovered = hidden ? `<p class="sv-undiscovered">${hidden} blueprint${hidden === 1 ? '' : 's'} still to discover · hold every material once to reveal one</p>` : '';
            if (!pieces.length) {
                return `<div class="sv-build"><div class="sv-bcol"><nav class="sv-btabs">${tabs}</nav><section class="sv-bgrid sv-scroll" data-scroll="bgrid-${this.buildTab}"><p class="sv-muted">No blueprints discovered in this tab yet.</p></section>${undiscovered}</div><aside class="sv-detail"><p class="sv-muted">Pick a tab with blueprints.</p></aside></div>`;
            }
            if (!this.selBuild || !pieces.some((b) => b.id === this.selBuild)) this.selBuild = pieces[0].id;
            const costOf = (b) => BO.buildCostOf(b);
            const techName = (id) => deepData().techTree?.find((t) => t.id === id)?.name || id;
            const cards = pieces.map((b) => {
                const techOk = (!b.tech || deep?.hasTech(b.tech)) && !BO.GM?.get('base')?.buildBlock?.(b.id);
                const afford = mode.canAfford(costOf(b));
                return `<button class="sv-bcard ${b.id === this.selBuild ? 'selected' : ''} ${!techOk ? 'locked' : afford ? 'ready' : ''}" data-act="buildSel" data-arg="${b.id}"${tip(b.name, b.detail, techOk ? (afford ? 'You can afford this' : 'Missing materials') : 'Locked: research ' + techName(b.tech))}>
                    ${Icons().build(b.id, 30)}<b>${esc(b.name)}</b><span class="sv-bcost">${costInline(costOf(b), inv)}</span>${!techOk ? '<span class="sv-lock">🔒</span>' : ''}</button>`;
            }).join('');
            const b = pieces.find((x) => x.id === this.selBuild);
            const cost = costOf(b);
            const gmWhy = BO.GM?.get('base')?.buildBlock?.(b.id) || '';
            const techOk = (!b.tech || deep?.hasTech(b.tech)) && !gmWhy;
            const can = techOk && mode.canAfford(cost);
            const why = gmWhy ? gmWhy : !techOk ? 'Research “' + techName(b.tech) + '” in Skills first.' : !mode.canAfford(cost) ? 'Gather the missing materials.' : '';
            const built = c.placed.filter((x) => x.alive).length;
            const structural = BO.ZoneBuild.isStruct(b.id);
            const parts = c.placed.filter((x) => x.alive && BO.ZoneBuild.isStruct(x.type));
            const avgSup = parts.length ? Math.round(parts.reduce((a, x) => a + (x.support ?? 1), 0) / parts.length * 100) : null;
            const weakest = parts.length ? Math.round(Math.min(...parts.map((x) => x.support ?? 1)) * 100) : null;
            const H = BO.ZoneHorde;
            return `<div class="sv-build">
                <div class="sv-bcol"><nav class="sv-btabs">${tabs}</nav>
                <section class="sv-bgrid sv-scroll" data-scroll="bgrid-${this.buildTab}">${cards}</section>${undiscovered}</div>
                <aside class="sv-detail sv-scroll" data-scroll="bdetail">
                    <div class="sv-detail-head">${Icons().build(b.id, 44)}<div><h3>${esc(b.name)}</h3><small>${b.size.map((v) => v.toFixed(1)).join(' × ')} m</small></div></div>
                    <p class="sv-detail-text">${esc(b.detail)}</p>
                    <h4 class="sv-sub">Materials</h4><ul class="sv-costs">${costRows(cost, inv)}</ul>
                    ${b.tech ? `<div class="sv-req ${techOk ? 'ok' : 'short'}">${techOk ? '✓' : '🔒'} ${esc(techName(b.tech))}</div>` : ''}
                    <div class="sv-actions"><button class="sv-btn primary" data-act="place" data-arg="${b.id}" ${can ? '' : 'disabled'}${tip('Build', can ? 'Closes the terminal and shows a preview that follows your aim. Left-click places (repeatedly), R rotates, right-click or ' + keyOf('survBuild') + ' exits.' : why)}>Build</button></div>
                    ${structural ? `<p class="sv-muted sm">Snaps to the 2.8 m grid: foundations on the ground, floors beside floors, walls on floor edges or other walls, upper floors and roofs on wall tops. Support drops ${b.id.startsWith('stone') || b.id === 'door' ? '6% per level up and 20%' : '12% per level up and 30%'} per cell outward; below 10% it cannot stand.</p>` : '<p class="sv-muted sm">Place it on the ground or on any floor you have built.</p>'}
                    ${why ? `<p class="sv-reason">${esc(why)}</p>` : ''}
                    <h4 class="sv-sub">Base</h4>
                    <dl class="sv-kv"><div${tip('Base level', 'Rises with the variety of structure types you have standing (every 3 types).')}><dt>Base level</dt><dd>${deep?.baseLevel ?? 1} / 5</dd></div><div><dt>Structures</dt><dd>${built} / 160</dd></div>
                        <div${tip('Structural integrity', 'Average and weakest support across your structural pieces. Blue is solid, red is barely holding.')}><dt>Integrity</dt><dd>${avgSup == null ? '—' : avgSup + '% avg · ' + weakest + '% weakest'}</dd></div>
                        <div${tip('Horde nights', 'Every third night a horde converges on your base (or on you). They tear through the weakest walls.')}><dt>Next horde</dt><dd>${esc(H.forecast() || 'After the safe period')}</dd></div></dl>
                    <div class="sv-actions wrap">
                        <button class="sv-btn sm" data-act="repairBase"${tip('Repair nearby', 'Fully repair damaged structures within 14 m: 1 timber per timber piece, 1 brick per masonry piece.')}>Repair nearby</button>
                        <button class="sv-btn sm ghost" data-act="dismantle"${tip('Dismantle nearest', 'Remove your closest structure within 4 m for a partial refund.')}>Dismantle nearest</button>
                    </div>
                </aside></div>`;
        }

        /* ---------------------------------------------------------- map */
        tabMap() {
            const mode = BO.SurvivalMode;
            const c = mode.campaign;
            const pPos = BO.Player.pos;
            const navHalf = career.masteryRank('navigator') >= 2;
            const blocked = c.has('footOnly') ? 'On Foot Only modifier.' : !c.canSave() ? 'Not while hostiles are close.' : (c.deep?.bleeding || 0) > 0 ? 'Stop the bleeding first.' : c.pack.weight() > c.pack.limits.weight ? 'You are overloaded.' : '';
            const points = c.travelPoints;
            const travel = points.length ? points.map((t) => {
                const dist = Math.round(Math.hypot(t.x - pPos.x, t.z - pPos.z));
                const hours = Math.max(0.5, dist / 100) * (navHalf ? 0.5 : 1);
                const why = dist < 15 ? 'You are here.' : blocked;
                return `<button class="sv-trow" data-act="travel" data-arg="${esc(t.id)}" ${why ? 'disabled' : ''}${tip(t.name, why || 'Travel ' + dist + ' m. ' + hours.toFixed(1) + ' hours pass and you get hungrier on the way.', t.kind)}>
                    <span class="sv-dot" style="background:${t.kind === 'Safehouse' ? '#8fe3c8' : t.kind === 'Settlement' ? '#f2d07a' : '#9fd4ff'}"></span><b>${esc(t.name)}</b><small>${why || hours.toFixed(1) + ' h · ' + dist + ' m'}</small></button>`;
            }).join('') : '<p class="sv-muted sm">Secure a safehouse or repair a radio tower to unlock fast travel.</p>';
            const regions = BO.Zone.REGIONS.map((r) => {
                const seen = c.visited.has(r.id);
                const pips = '●'.repeat(r.threat) + '○'.repeat(5 - r.threat);
                return `<li class="${seen ? '' : 'unseen'}"${tip(seen ? r.name : 'Unknown region', seen ? 'Threat ' + r.threat + ' of 5.' + (r.threat >= 4 ? ' You cannot build here.' : '') : 'Not discovered yet. Explore it on foot.')}><span class="sv-dot" style="background:#${r.color.toString(16).padStart(6, '0')}"></span><b>${seen ? esc(r.name) : 'Unknown region'}</b><small class="sv-pips t${r.threat}">${pips}</small></li>`;
            }).join('');
            const layers = [['sites', 'Landmarks'], ['threats', 'Threats'], ['contacts', 'Haven'], ['resources', 'Resources'], ['base', 'Your base']]
                .map(([id, label]) => `<button class="sv-layer ${this.mapLayers[id] ? 'on' : ''}" data-act="layer" data-arg="${id}"${tip(label, 'Show or hide ' + label.toLowerCase() + ' on the map.')}><i></i>${label}</button>`).join('');
            const wp = this.mapWaypoint;
            const wpDist = wp ? Math.round(Math.hypot(wp.x - pPos.x, wp.z - pPos.z)) : 0;
            const focusTravel = this.mapFocus === 'travel';
            this.mapFocus = null;
            const o = c.objectives;
            return `<div class="sv-map-wrap">
                <div class="sv-map-stage"><canvas id="sv-map-canvas" width="1200" height="1080" aria-label="Exclusion Zone map"></canvas>
                    <div class="sv-map-compass">N</div></div>
                <aside class="sv-map-side sv-scroll" data-scroll="mapside">
                    <div class="sv-objective"><span class="sv-kicker">${esc(o.actName || 'Objective')}</span><p>${esc(mode.objective)}</p>${o.hint ? `<small class="sv-muted">${esc(o.hint)}</small>` : ''}</div>
                    <div class="sv-map-controls">
                        <span class="sv-map-zoom">Zoom <b id="sv-map-zoom">${this.mapZoom.toFixed(1).replace(/\.0$/, '')}×</b> · 500×450 m</span>
                        <button class="sv-btn sm" data-act="mapZoom" data-arg="-0.5" ${this.mapZoom <= 1 ? 'disabled' : ''}${tip('Zoom out', 'Scroll wheel also zooms.')}>−</button>
                        <button class="sv-btn sm" data-act="mapZoom" data-arg="0.5" ${this.mapZoom >= 4 ? 'disabled' : ''}${tip('Zoom in', 'Scroll on the map to zoom in, then drag to pan.')}>+</button>
                        <button class="sv-btn sm ghost" data-act="mapReset"${tip('Reset view', 'Show the whole Exclusion Zone.')}>Reset</button>
                    </div>
                    ${wp ? `<div class="sv-map-wp"><span>Pin (${wp.x}, ${wp.z}) · <b>${wpDist} m</b></span><button class="sv-btn sm ghost" data-act="clearWaypoint">Clear</button></div>`
                        : '<p class="sv-muted sm">Click the map to pin a waypoint (it shows on your compass) · scroll to zoom · drag to pan.</p>'}
                    <h4 class="sv-sub">Layers</h4><div class="sv-layers">${layers}</div>
                    <h4 class="sv-sub ${focusTravel ? 'flash' : ''}">Fast travel <small>${navHalf ? 'Navigator: half time' : 'costs time'}</small></h4><div class="sv-tlist">${travel}</div>
                    <h4 class="sv-sub">Vehicles <small>${c.vehicle ? 'Riding' : 'On foot'}</small></h4><div class="sv-tlist">${data.vehicles.map((v) => {
                        const owned = c.hasVehicle(v.id);
                        const on = c.vehicle === v.id;
                        // 1.0 vehicles are found in the world or built; the old level gate no longer exists.
                        const how = v.found ? 'Parked at a ' + String(v.found).replace(/_/g, ' ') : v.build ? 'Build: ' + BO.SurvivalItemAmounts(v.build) : Number.isFinite(v.level) ? 'Level ' + v.level : 'Haven trade or a kit';
                        return `<button class="sv-trow ${on ? 'on' : ''}" data-act="ride" data-arg="${on ? 'off' : v.id}" ${owned ? '' : 'disabled'}${tip(v.name, v.detail, owned ? (on ? 'Click to dismount' : 'Click to ride · roads ×' + v.speed + ', off-road ×' + v.offroad) : how)}>
                            ${Icons().named(v.id === 'mount' ? 'leaf' : 'gear', owned ? '#9fd4c7' : '#56645f', 16)}<b>${esc(v.name)}</b><small>${on ? 'Riding · click to dismount' : owned ? 'Road ×' + v.speed + ' · off-road ×' + v.offroad : esc(how)}</small></button>`;
                    }).join('')}</div>
                    <h4 class="sv-sub">Regions <small>${c.visited.size}/${BO.Zone.REGIONS.length} discovered</small></h4><ul class="sv-region-list">${regions}</ul>
                </aside></div>`;
        }

        _mapBounds() {
            const B = BO.Zone.BOUNDS;
            return { x0: B.minX, x1: B.maxX, z0: B.minZ, z1: B.maxZ };
        }

        _mapProjection(canvas) {
            const b = this._mapBounds();
            const W = canvas.width;
            const H = canvas.height;
            const zoom = Math.max(1, Math.min(4, this.mapZoom || 1));
            const fullW = b.x1 - b.x0;
            const fullH = b.z1 - b.z0;
            const spanX = fullW / zoom;
            const spanZ = fullH / zoom;
            const maxPanX = (fullW - spanX) / 2;
            const maxPanZ = (fullH - spanZ) / 2;
            this.mapPan.x = Math.max(-maxPanX, Math.min(maxPanX, this.mapPan?.x || 0));
            this.mapPan.z = Math.max(-maxPanZ, Math.min(maxPanZ, this.mapPan?.z || 0));
            const cx = (b.x0 + b.x1) / 2 + this.mapPan.x;
            const cz = (b.z0 + b.z1) / 2 + this.mapPan.z;
            const x0 = cx - spanX / 2;
            const x1 = cx + spanX / 2;
            const z0 = cz - spanZ / 2;
            const z1 = cz + spanZ / 2;
            return {
                b, x0, x1, z0, z1, zoom,
                sx: (x) => ((x - x0) / (x1 - x0)) * W,
                sz: (z) => ((z - z0) / (z1 - z0)) * H,
                wx: (px) => x0 + (px / W) * (x1 - x0),
                wz: (py) => z0 + (py / H) * (z1 - z0)
            };
        }

        /** Shaded-relief image of the Zone, built once from the live terrain (2 m per pixel). */
        _mapRelief() {
            if (BO.Zone._relief) return BO.Zone._relief;
            const b = this._mapBounds();
            const S = 2;
            const W = Math.round((b.x1 - b.x0) / S), H = Math.round((b.z1 - b.z0) / S);
            const cv = document.createElement('canvas');
            cv.width = W; cv.height = H;
            const ctx = cv.getContext('2d');
            const img = ctx.createImageData(W, H);
            const T = BO.World.terrain;
            const hAt = (x, z) => T ? T.height(x, z) : 0;
            const colorAt = BO.Zone.colorAt;
            for (let j = 0; j < H; j++) {
                for (let i = 0; i < W; i++) {
                    const x = b.x0 + i * S + 1, z = b.z0 + j * S + 1;
                    const h = hAt(x, z);
                    const dx = hAt(x + S, z) - hAt(x - S, z), dz = hAt(x, z + S) - hAt(x, z - S);
                    const slope = Math.hypot(dx, dz) / (2 * S);
                    const col = colorAt ? colorAt(x, z, h, slope) : [0.4, 0.45, 0.38];
                    // Light from the north-west; a faint contour every 5 m.
                    const shade = BO.Math.clamp(0.82 + (-dx * 0.7 - dz * 0.7) * 0.22, 0.45, 1.25);
                    const contour = Math.abs((h / 5) - Math.round(h / 5)) < 0.06 ? 0.85 : 1;
                    const water = BO.Zone.inReservoir(x, z) && h < BO.Zone.WATER;
                    const k = (n) => Math.max(0, Math.min(255, Math.round(n * 255 * 0.78 * shade * contour)));
                    const o = (j * W + i) * 4;
                    if (water) { img.data[o] = 38; img.data[o + 1] = 78; img.data[o + 2] = 96; }
                    else { img.data[o] = k(col[0]); img.data[o + 1] = k(col[1]); img.data[o + 2] = k(col[2]); }
                    img.data[o + 3] = 255;
                }
            }
            ctx.putImageData(img, 0, 0);
            BO.Zone._relief = cv;
            return cv;
        }

        drawMap() {
            const canvas = this.root.querySelector('#sv-map-canvas');
            if (!canvas) return;
            const mode = BO.SurvivalMode;
            const c = mode.campaign;
            const Z = BO.Zone;
            const proj = this._mapProjection(canvas);
            const { b, sx, sz, zoom } = proj;
            const ctx = canvas.getContext('2d');
            const W = canvas.width;
            const H = canvas.height;
            const ppm = W / (b.x1 - b.x0) * zoom; // pixels per metre
            const hits = this.mapHits = [];
            const hit = (x, z, title, body, r = 12) => hits.push({ x: sx(x), y: sz(z), r, title, body });
            ctx.fillStyle = '#0d1412';
            ctx.fillRect(0, 0, W, H);
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(this._mapRelief(), sx(b.x0), sz(b.z0), sx(b.x1) - sx(b.x0), sz(b.z1) - sz(b.z0));
            // Undiscovered regions sit under a survey haze.
            for (const r of Z.REGIONS) {
                if (c.visited.has(r.id)) continue;
                const R = r.r * ppm * 1.1;
                const g = ctx.createRadialGradient(sx(r.x), sz(r.z), 0, sx(r.x), sz(r.z), R);
                g.addColorStop(0, 'rgba(10,16,14,0.62)');
                g.addColorStop(0.75, 'rgba(10,16,14,0.45)');
                g.addColorStop(1, 'rgba(10,16,14,0)');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(sx(r.x), sz(r.z), R, 0, Math.PI * 2); ctx.fill();
            }
            // 50 m grid
            ctx.strokeStyle = 'rgba(200,230,220,0.07)';
            ctx.lineWidth = 1;
            for (let x = Math.ceil(b.x0 / 50) * 50; x <= b.x1; x += 50) { ctx.beginPath(); ctx.moveTo(sx(x), 0); ctx.lineTo(sx(x), H); ctx.stroke(); }
            for (let z = Math.ceil(b.z0 / 50) * 50; z <= b.z1; z += 50) { ctx.beginPath(); ctx.moveTo(0, sz(z)); ctx.lineTo(W, sz(z)); ctx.stroke(); }
            // Roads and rail
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            for (const road of Z.ROADS) {
                ctx.beginPath(); road.pts.forEach(([x, z], i) => (i ? ctx.lineTo(sx(x), sz(z)) : ctx.moveTo(sx(x), sz(z))));
                ctx.strokeStyle = 'rgba(20,22,22,0.7)';
                ctx.lineWidth = Math.max(3, road.w * ppm + 2);
                ctx.stroke();
                ctx.strokeStyle = road.mat === 'asphalt' ? 'rgba(170,170,160,0.85)' : 'rgba(170,150,115,0.8)';
                ctx.lineWidth = Math.max(1.8, road.w * ppm);
                ctx.stroke();
            }
            ctx.beginPath(); Z.RAIL.forEach(([x, z], i) => (i ? ctx.lineTo(sx(x), sz(z)) : ctx.moveTo(sx(x), sz(z))));
            ctx.strokeStyle = 'rgba(60,46,36,0.9)'; ctx.lineWidth = 4; ctx.stroke();
            ctx.strokeStyle = 'rgba(214,190,140,0.85)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 5]); ctx.stroke(); ctx.setLineDash([]);
            // Buildings
            for (const poi of Z.pois) {
                if (!poi.w) continue;
                const seen = c.visited.has(poi.region);
                const rot = (poi.rot || 0) & 1;
                const w = (rot ? poi.d : poi.w) * ppm, d = (rot ? poi.w : poi.d) * ppm;
                ctx.fillStyle = seen ? 'rgba(222,214,196,0.85)' : 'rgba(150,150,140,0.35)';
                ctx.strokeStyle = 'rgba(10,12,12,0.9)'; ctx.lineWidth = 1;
                ctx.fillRect(sx(poi.x) - w / 2, sz(poi.z) - d / 2, w, d);
                ctx.strokeRect(sx(poi.x) - w / 2, sz(poi.z) - d / 2, w, d);
                if (seen && zoom >= 2) hit(poi.x, poi.z, poi.name, Z.REGIONS.find((r) => r.id === poi.region)?.name || '', Math.max(6, Math.min(w, d) / 2));
            }
            // Perimeter fence
            ctx.strokeStyle = 'rgba(242,120,90,0.55)'; ctx.lineWidth = 2; ctx.setLineDash([10, 6]);
            ctx.strokeRect(sx(b.x0 + 4), sz(b.z0 + 4), sx(b.x1 - 4) - sx(b.x0 + 4), sz(b.z1 - 4) - sz(b.z0 + 4));
            ctx.setLineDash([]);
            const label = (text, x, z, color = 'rgba(236,244,240,0.95)', size = 14, dy = 0) => {
                ctx.font = `700 ${size}px Bahnschrift, "Segoe UI", sans-serif`;
                ctx.textAlign = 'center';
                const w = ctx.measureText(text).width;
                ctx.fillStyle = 'rgba(8,14,12,0.78)';
                ctx.fillRect(sx(x) - w / 2 - 6, sz(z) + dy - size, w + 12, size + 7);
                ctx.fillStyle = color;
                ctx.fillText(text, sx(x), sz(z) + dy + 2);
            };
            const icon = (x, z, shape, color, size = 9, dim = false) => {
                ctx.save();
                ctx.translate(sx(x), sz(z));
                ctx.fillStyle = dim ? 'rgba(110,118,114,0.9)' : color;
                ctx.strokeStyle = 'rgba(8,14,12,0.95)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                if (shape === 'diamond') { ctx.moveTo(0, -size); ctx.lineTo(size, 0); ctx.lineTo(0, size); ctx.lineTo(-size, 0); ctx.closePath(); }
                else if (shape === 'house') { ctx.moveTo(-size, size * 0.8); ctx.lineTo(-size, -size * 0.1); ctx.lineTo(0, -size); ctx.lineTo(size, -size * 0.1); ctx.lineTo(size, size * 0.8); ctx.closePath(); }
                else if (shape === 'tower') { ctx.moveTo(0, -size * 1.2); ctx.lineTo(size * 0.7, size); ctx.lineTo(-size * 0.7, size); ctx.closePath(); }
                else if (shape === 'skull') { ctx.arc(0, -1, size * 0.8, 0, Math.PI * 2); }
                else if (shape === 'star') {
                    for (let i = 0; i < 10; i++) {
                        const r = i % 2 ? size * 0.45 : size, a = i / 10 * Math.PI * 2 - Math.PI / 2;
                        if (i) ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); else ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
                    }
                    ctx.closePath();
                } else ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
                ctx.fill(); ctx.stroke();
                if (shape === 'skull') {
                    ctx.fillStyle = 'rgba(8,14,12,0.95)';
                    ctx.fillRect(-size * 0.4, -size * 0.3, size * 0.25, size * 0.25);
                    ctx.fillRect(size * 0.15, -size * 0.3, size * 0.25, size * 0.25);
                }
                ctx.restore();
            };
            // Region names with threat pips
            const pipCol = ['#8fe3c8', '#8fe3c8', '#f2d07a', '#f2b45a', '#ff7b6b', '#d58bff'];
            for (const r of Z.REGIONS) {
                const seen = c.visited.has(r.id);
                const ly = r.z - r.r * 0.55;
                label(seen ? r.name.toUpperCase() : '? ? ?', r.x, ly, seen ? 'rgba(236,244,240,0.96)' : 'rgba(170,186,180,0.7)', 13);
                label('●'.repeat(r.threat) + '○'.repeat(5 - r.threat), r.x, ly, pipCol[r.threat], 10, 16);
                hit(r.x, ly, seen ? r.name : 'Undiscovered region', seen ? 'Threat ' + r.threat + '/5 · ' + r.biome + (r.threat >= 4 ? ' · no building allowed' : '') : 'Explore it on foot to reveal it.', 34);
            }
            const o = c.objectives;
            // The Lantern
            const L = Z.LANTERN;
            const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 380);
            const lg = ctx.createRadialGradient(sx(L.x), sz(L.z), 0, sx(L.x), sz(L.z), 40 * ppm);
            lg.addColorStop(0, `rgba(190,150,255,${0.35 + pulse * 0.25})`);
            lg.addColorStop(1, 'rgba(190,150,255,0)');
            ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(sx(L.x), sz(L.z), 40 * ppm, 0, Math.PI * 2); ctx.fill();
            icon(L.x, L.z, 'star', '#c9a8ff', 12);
            label('THE LANTERN', L.x, L.z, '#d9c3ff', 13, 26);
            hit(L.x, L.z, 'The Lantern', 'The light at the heart of the Crater. Everything in the Zone is drawn to it. Extreme radiation.', 16);
            const mastIdx = o.steps.findIndex((s) => s.id === 'mast');
            for (const mk of mode.markers) {
                if (mk.kind === 'safehouse' && this.mapLayers.sites) {
                    const sec = o.secured.has(mk.id);
                    icon(mk.x, mk.z, 'house', '#8fe3c8', 9, !sec);
                    if (zoom >= 1.5 || sec) label(mk.name, mk.x, mk.z, sec ? '#bff3e1' : 'rgba(200,210,206,0.8)', 11, 22);
                    hit(mk.x, mk.z, mk.name, sec ? 'Secured safehouse: respawn point, workbench, stove and fast travel.' : 'Unsecured. Clear hostiles within 25 m and interact at the door to claim it.', 11);
                } else if ((mk.kind === 'tower' || mk.kind === 'mast') && this.mapLayers.sites) {
                    const relay = c.activities?.relays.get(mk.id);
                    const on = mk.kind === 'mast' ? o.step > mastIdx || o.freeplay : relay?.powered;
                    icon(mk.x, mk.z, 'tower', on ? '#9fd4ff' : '#ff8a6b', 9);
                    hit(mk.x, mk.z, mk.name, on ? 'Online.' + (mk.kind === 'tower' ? ' Radio towers are fast-travel points.' : '') : mk.kind === 'mast' ? 'Needs 2 copper wire and 1 battery at the top.' : 'Offline. Climb it with 1 copper wire and 1 fuel to repair.', 11);
                } else if (mk.kind === 'nest' && this.mapLayers.threats) {
                    icon(mk.x, mk.z, 'skull', '#ff6b5b', 9, mk.alive === false);
                    hit(mk.x, mk.z, mk.name, mk.alive === false ? 'Burned. The area is calmer now.' : 'Infected nest: raises local threat. Burn it (2 fuel and a light, or a molotov/explosive) to recover a campus keycard.', 11);
                } else if (mk.kind === 'gate' && this.mapLayers.sites) {
                    icon(mk.x, mk.z, 'diamond', o.gateOpen ? '#8fe3c8' : '#f2b45a', 8);
                    hit(mk.x, mk.z, mk.name, o.gateOpen ? 'Open.' : 'Locked. Needs three campus keycards (' + o.keycards + '/3).', 10);
                } else if (mk.discover && mk.found && this.mapLayers.sites) {
                    icon(mk.x, mk.z, 'diamond', '#e9dfb9', 6);
                    hit(mk.x, mk.z, mk.name, 'Landmark discovered.', 9);
                }
            }
            if (this.mapLayers.sites && c.activities) {
                for (const r of c.activities.relays.values()) {
                    icon(r.x, r.z, 'tower', r.powered ? '#9fd4ff' : '#ff8a6b', 9);
                    if (zoom >= 1.5) label(r.name, r.x, r.z, r.powered ? '#cfe7ff' : 'rgba(230,200,190,0.85)', 11, 22);
                    hit(r.x, r.z, r.name, r.powered ? 'Online. Radio towers are fast-travel points.' : 'Offline. Climb it and repair the relay with 1 copper wire and 1 fuel.', 11);
                }
            }
            if (BO.ZoneInfest && this.mapLayers.threats) {
                for (const s of BO.ZoneInfest.known()) {
                    const col = s.cleared ? (s.opened ? '#5c8a74' : '#8fe3c8') : '#ff6b5b';
                    icon(s.x, s.z, s.cleared ? 'diamond' : 'skull', col, s.kind === 'poi' ? 7 : 6, s.cleared && s.opened);
                    if (zoom >= 2.2) label(s.name, s.x, s.z, col, 10, 16);
                    hit(s.x, s.z, s.name + (s.cleared ? ' · secured' : ' · infested'), s.cleared ? (s.opened ? 'Secured; stash already opened. No roaming infected spawn nearby.' : 'Secured. The supply stash here is unlocked — go open it.') : 'About ' + (s.active ? BO.ZoneInfest.aliveMembers(s).length : s.left) + ' infected' + (s.alpha && !s.alphaDead ? ', led by a champion' : '') + '. Clear them to secure the site and unlock its stash.', 9);
                }
            }
            for (const k of BO.ZoneContracts?.points() || []) {
                ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
                if (k.area) { ctx.beginPath(); ctx.arc(sx(k.x), sz(k.z), Math.max(10, k.area * (sx(k.x + 1) - sx(k.x))), 0, Math.PI * 2); ctx.stroke(); }
                ctx.setLineDash([]);
                icon(k.x, k.z, 'star', '#ffd27a', 10);
                label(k.label, k.x, k.z, '#ffd27a', 11, 26);
                hit(k.x, k.z, 'Contract · ' + k.label, k.kind === 'bounty' ? 'A named champion was last seen inside the circle.' : 'Haven radio contract.', 14);
            }
            for (const ev of BO.ZoneEvents?.points() || []) {
                const pulseR = 10 + 6 * Math.sin(performance.now() / 300);
                ctx.strokeStyle = ev.color; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(sx(ev.x), sz(ev.z), pulseR, 0, Math.PI * 2); ctx.stroke();
                icon(ev.x, ev.z, ev.kind === 'herd' ? 'skull' : 'diamond', ev.color, 9);
                label(ev.label, ev.x, ev.z, ev.color, 11, 26);
                hit(ev.x, ev.z, ev.label, ev.kind === 'herd' ? 'A migrating herd. It follows a route across the Zone; noise pulls members off it.' : ev.kind === 'airdrop' ? 'High-tier military supplies — a PMC squad is coming for it too.' : 'A survivor is pinned down. Clear the infected around them in time.', 14);
            }
            const FR = BO.ZoneFrontier;
            if (FR?.active && this.mapLayers.threats) {
                for (const g of FR.garrisons) {
                    const st = FR.garrisonState(g);
                    if (!c.visited.has(g.region)) continue;
                    icon(g.x, g.z, 'diamond', st === 'cleared' ? '#8fe3c8' : '#f2b45a', 8, st === 'cleared');
                    if (zoom >= 1.5) label('PMC', g.x, g.z, st === 'cleared' ? '#bff3e1' : '#f7d9a6', 10, -12);
                    const back = c.metrics['garrison_' + g.id] ? Math.max(0, c.metrics['garrison_' + g.id] + 4 - c.day) : 0;
                    hit(g.x, g.z, 'PMC garrison · ' + g.name, st === 'cleared' ? 'Cleared. Reoccupied in ' + back + ' day' + (back === 1 ? '' : 's') + '.' : 'Held by about ' + (g.left ?? g.size) + ' armed operators. Shooting raises their alarm: the siren draws infected and reinforcements arrive in 30 s. Clearing it drops a supply cache.', 10);
                }
            }
            {
                const master = c.has('sv_master_map');
                for (const e of BO.ZoneDungeons?.entrances || []) {
                    if (!master && !c.visited.has(BO.Zone.regionAt(e.x, e.z).id)) continue;
                    const st = BO.ZoneDungeons.st(e.d.id);
                    icon(e.x, e.z, 'house', st.cleared ? '#8fe3c8' : '#c8a2ff', 8, st.cleared);
                    if (zoom >= 1.5) label(e.d.name, e.x, e.z, '#e2d4ff', 10, 18);
                    hit(e.x, e.z, e.d.name + ' · ' + e.d.size + ' dungeon', e.d.blurb + (st.cleared ? ' (Cleared.)' : ''), 10);
                }
                for (const mk of mode.markers) {
                    if (!mk.alive) continue;
                    if (mk.pit) { icon(mk.x, mk.z, 'star', '#ffb43a', 9); if (zoom >= 1.5) label(mk.name, mk.x, mk.z, '#ffd9a0', 10, 18); hit(mk.x, mk.z, mk.name, 'Offers arena boss duels.', 10); }
                    else if (mk.vehicle && mk.id.startsWith('veh:') && (master || c.visited.has(BO.Zone.regionAt(mk.x, mk.z).id))) { icon(mk.x, mk.z, 'circle', '#9fd4ff', 7); hit(mk.x, mk.z, mk.name, 'A parked vehicle. Walk up and claim it.', 9); }
                    else if (mk.masterbox) { icon(mk.x, mk.z, 'star', '#b46bff', 10); hit(mk.x, mk.z, 'Box of Wonders', 'Unlimited items, weapons and vehicles.', 10); }
                }
                if (master) {
                    for (const pk of mode.loot.pickups.values()) { const col = pk.roll ? (BO.ZoneThrill.RARITY.find((r) => r.id === pk.roll.rarity)?.css || '#ccc') : '#ccc'; icon(pk.x, pk.z, 'diamond', col, 4); hit(pk.x, pk.z, pk.marker.name, 'Weapon on the ground.', 6); }
                    for (const z of mode.zombies) if (z.alive && (z.bossLabel || z.champion)) { icon(z.pos.x, z.pos.z, 'skull', z.bossLabel ? '#ff4a4a' : '#ffb43a', z.bossLabel ? 10 : 6); hit(z.pos.x, z.pos.z, z.bossLabel || z.champion.name, z.bossLabel ? 'Boss' : 'Champion', 8); }
                    for (const k of BO.ZoneContracts?.list || []) if (k.kind === 'cache') { icon(k.sx, k.sz, 'star', '#ffb43a', 8); }
                }
            }
            if (FR?.car && this.mapLayers.sites) {
                icon(FR.car.position.x, FR.car.position.z, 'circle', '#d6be8c', 7);
                hit(FR.car.position.x, FR.car.position.z, 'Freight handcar', 'Ride it along the rail line: W/S to pump, up to ~45 km/h. Loud.', 9);
            }
            if (this.mapLayers.threats) {
                for (const z of mode.zombies) {
                    if (!z.alive || !z.bossLabel) continue;
                    if (Math.hypot(z.pos.x - BO.Player.pos.x, z.pos.z - BO.Player.pos.z) > 60) continue;
                    icon(z.pos.x, z.pos.z, 'skull', '#d58bff', 11);
                    hit(z.pos.x, z.pos.z, z.bossLabel, 'A named heavy infected. Carries a campus keycard.', 12);
                }
            }
            // Haven and its people
            if (this.mapLayers.contacts) {
                const Hv = Z.HAVEN;
                icon(Hv.x, Hv.z, 'house', '#f2d07a', 11, o.step < o.steps.findIndex((s) => s.id === 'haven') && !o.freeplay);
                label('HAVEN', Hv.x, Hv.z, '#f7e3a6', 12, 24);
                hit(Hv.x, Hv.z, 'Haven', 'Survivor settlement: traders, contracts, garden plots and the dispatch board.', 14);
                if (zoom >= 2) for (const n of c.npcs) {
                    const npc = n.npc;
                    ctx.fillStyle = '#8eea9d'; ctx.strokeStyle = 'rgba(8,14,12,0.9)'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(sx(npc.x), sz(npc.z), 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                    hit(npc.x, npc.z, npc.name, (npc.hint || '').trim(), 7);
                }
            }
            if (this.mapLayers.resources) {
                for (const node of c.pack.resources.values()) {
                    if (node.hp <= 0) continue;
                    ctx.fillStyle = RES_COLOR[node.kind] || '#ccc';
                    ctx.beginPath(); ctx.arc(sx(node.marker.x), sz(node.marker.z), 3.4, 0, Math.PI * 2); ctx.fill();
                    hit(node.marker.x, node.marker.z, node.spec.name, node.spec.tool ? 'Needs ' + ({ axe: 'an axe', pick: 'a pickaxe', shovel: 'a shovel' }[node.spec.tool]) + (node.spec.tier > 1 ? ' (tier ' + node.spec.tier + ')' : ' or slow bare hands') : 'Gather by hand.', 6);
                }
            }
            if (this.mapLayers.base) {
                ctx.fillStyle = 'rgba(159,224,201,0.95)';
                for (const piece of c.placed) if (piece.alive) ctx.fillRect(sx(piece.x) - 2.5, sz(piece.z) - 2.5, 5, 5);
                const any = c.placed.find((x) => x.alive);
                if (any) hit(any.x, any.z, 'Your base', c.placed.filter((x) => x.alive).length + ' structures.', 14);
                for (const [id, bag] of c.pack.bags) {
                    const body = id.startsWith('bag:body');
                    icon(bag.x, bag.z, body ? 'skull' : 'diamond', body ? '#fde047' : '#e8e08a', body ? 9 : 5);
                    hit(bag.x, bag.z, body ? 'Your body bag' : 'Dropped bag', (body ? 'Everything you carried when you fell. ' : '') + (BO.SurvivalItemAmounts(bag.items) || 'Empty'), 9);
                }
            }
            if (this.mapLayers.sites || this.mapLayers.contacts) {
                BO.ZoneWorldPlus?.drawMapMarkers?.(ctx, sx, sz, hit, label, zoom);
            }
            BO.GM?.get('hud')?.drawMap?.(ctx, sx, sz, ppm, hit, label);
            // Waypoint
            const p = BO.Player;
            if (this.mapWaypoint) {
                const wp = this.mapWaypoint;
                ctx.strokeStyle = 'rgba(126,232,250,0.65)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
                ctx.beginPath(); ctx.moveTo(sx(p.pos.x), sz(p.pos.z)); ctx.lineTo(sx(wp.x), sz(wp.z)); ctx.stroke(); ctx.setLineDash([]);
                ctx.strokeStyle = '#7ee8fa'; ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.arc(sx(wp.x), sz(wp.z), 9, 0, Math.PI * 2); ctx.stroke();
                ctx.fillStyle = '#7ee8fa'; ctx.beginPath(); ctx.arc(sx(wp.x), sz(wp.z), 3, 0, Math.PI * 2); ctx.fill();
                const dist = Math.round(Math.hypot(wp.x - p.pos.x, wp.z - p.pos.z));
                label(dist + ' m', wp.x, wp.z, '#7ee8fa', 12, -14);
                hit(wp.x, wp.z, 'Pinned waypoint', dist + ' m away (' + wp.x + ', ' + wp.z + ') — click again to clear.', 12);
            }
            // Player
            const f = p.getMoveDirectionVectors().forward;
            const ang = Math.atan2(f.z, f.x);
            ctx.save();
            ctx.translate(sx(p.pos.x), sz(p.pos.z));
            ctx.rotate(ang);
            ctx.fillStyle = 'rgba(242,180,90,0.22)';
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 44, -0.5, 0.5); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#f2b45a'; ctx.strokeStyle = '#1a120a'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-8, 8); ctx.lineTo(-4, 0); ctx.lineTo(-8, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.restore();
            hit(p.pos.x, p.pos.z, 'You', (c.area?.name || '') + ' · ' + Math.round(p.pos.x) + ', ' + Math.round(p.pos.z) + ' · ' + Math.round(p.pos.y) + ' m elevation', 14);
            // Scale bar
            const barMeters = zoom >= 2.5 ? 25 : zoom >= 1.5 ? 50 : 100;
            const barPx = barMeters * ppm;
            ctx.fillStyle = 'rgba(8,14,12,0.75)';
            ctx.fillRect(18, H - 36, barPx + 20, 22);
            ctx.strokeStyle = '#9fe0c9'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(26, H - 22); ctx.lineTo(26 + barPx, H - 22); ctx.moveTo(26, H - 27); ctx.lineTo(26, H - 18); ctx.moveTo(26 + barPx, H - 27); ctx.lineTo(26 + barPx, H - 18); ctx.stroke();
            ctx.font = '700 11px monospace'; ctx.fillStyle = '#cfe8df'; ctx.textAlign = 'left';
            ctx.fillText(barMeters + ' m', 30, H - 26);
        }

        mapHover(e) {
            const canvas = e.target;
            const rect = canvas.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
            const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
            let best = null;
            let bestD = Infinity;
            for (const h of this.mapHits || []) {
                const d = Math.hypot(h.x - x, h.y - y);
                const scale = canvas.width / rect.width;
                if (d < Math.max(h.r, 9) * scale && d < bestD && !(h.r >= 35 && best)) { best = h; bestD = d; }
            }
            if (!best) { this.mapTip.hidden = true; return; }
            this.mapTip.innerHTML = `<b>${esc(best.title)}</b><span>${esc(best.body)}</span>`;
            this.mapTip.hidden = false;
            const tw = this.mapTip.offsetWidth;
            const th = this.mapTip.offsetHeight;
            let left = e.clientX + 16;
            let top = e.clientY + 16;
            if (left + tw > window.innerWidth - 10) left = e.clientX - tw - 16;
            if (top + th > window.innerHeight - 10) top = e.clientY - th - 16;
            this.mapTip.style.left = left + 'px';
            this.mapTip.style.top = top + 'px';
        }

        /* ---------------------------------------------------------- skills */
        tabSkills() {
            const c = BO.SurvivalMode.campaign;
            const deep = c.deep;
            const dd = deepData();
            if (!deep) return '<p class="sv-muted">Skills are unavailable.</p>';
            const nameOf = (id) => dd.techTree.find((t) => t.id === id)?.name || id;
            const offGrid = !!deep.modFx?.noAutomation;
            const infTp = c.has('sv_unlimited_tech');
            const tiers = [1, 2, 3, 4].map((tier) => `<div class="sv-tier"><div class="sv-tier-h">Tier ${tier}</div>${dd.techTree.filter((n) => n.tier === tier).map((n) => {
                const owned = deep.hasTech(n.id);
                const reqOk = !n.req || deep.hasTech(n.req);
                const afford = infTp || deep.techPoints >= n.cost;
                const st = owned ? 'owned' : !reqOk ? 'locked' : afford ? 'ready' : 'short';
                return `<div class="sv-node st-${st}"${tip(n.name, n.desc, owned ? 'Researched' : !reqOk ? 'Requires ' + nameOf(n.req) : (infTp ? '0 Tech Points (Unlimited Tech active)' : n.cost + ' Tech Point(s)'))}>
                    <b>${esc(n.name)}</b><small>${esc(n.desc)}</small>
                    ${n.req ? `<span class="sv-node-req">${deep.hasTech(n.req) ? '✓' : '🔒'} ${esc(nameOf(n.req))}</span>` : ''}
                    <button class="sv-btn sm ${st === 'ready' ? 'primary' : ''}" data-act="unlockTech" data-arg="${n.id}" ${st === 'ready' ? '' : 'disabled'}>${owned ? 'Researched' : !reqOk ? 'Locked' : 'Research · ' + (infTp ? 'FREE' : n.cost + ' TP')}</button></div>`;
            }).join('')}</div>`).join('');
            const o = c.objectives;
            let lastAct = 0;
            const story = o.steps.filter((s) => s.id !== 'done').map((s, i) => {
                const head = s.act !== lastAct ? `<h4 class="sv-sub">${esc(({ 1: 'Act 1 · Signal', 2: 'Act 2 · Cartography', 3: 'Act 3 · Breach' })[s.act])}</h4>` : '';
                lastAct = s.act;
                const st = o.freeplay || i < o.step ? 'done' : i === o.step ? 'now' : 'later';
                return head + `<div class="sv-story st-${st}"${tip(s.title, st === 'later' ? 'Not yet.' : s.hint || '')}><i>${st === 'done' ? '✓' : st === 'now' ? '▸' : ''}</i><span>${st === 'later' ? '???' : esc(s.title)}</span></div>`;
            }).join('');
            const M = BO.SurvivalMeta?.MASTERY || {};
            const mastery = Object.entries(M).map(([id, m]) => {
                const rank = career.masteryRank(id);
                return `<div class="sv-attr"${tip(m.name || id, m.desc || m.bonus || '', 'Rank ' + rank + ' of ' + (m.max || 3) + ' · bought with commendations between runs')}>
                    <span class="sv-attr-dot" style="background:#f2d07a"></span><span class="sv-attr-t"><b>${esc(m.name || id)}</b><small>${esc(m.desc || m.bonus || '')}</small></span>
                    <span class="sv-pips">${Array.from({ length: m.max || 3 }, (_, i) => `<i class="${i < rank ? 'on' : ''}" style="--c:#f2d07a"></i>`).join('')}</span></div>`;
            }).join('');
            return `<div class="sv-skills">
                <section class="sv-tech sv-scroll" data-scroll="tech">
                    ${BO.GM?.active ? (BO.GM.get('skills')?.renderTree?.() || '') : ''}
                    <div class="sv-sec-h"><h3>Technology</h3><span class="sv-pill">${infTp ? '∞ Tech Points' : deep.techPoints + ' Tech Point' + (deep.techPoints === 1 ? '' : 's')}</span>${offGrid ? '<span class="sv-pill warn">Automation disabled by modifier</span>' : ''}</div>
                    <p class="sv-muted sm">Levels give skill points (above). Tech Points come from exploring: kindle Sites of Grace, defeat bosses, secure every third infested site and complete Field Catalogue sets.</p>
                    <div class="sv-tiers">${tiers}</div>
                </section>
                <aside class="sv-attrs sv-scroll" data-scroll="attrs">
                    <div class="sv-sec-h"><h3>The Lantern</h3><span class="sv-pill">${esc(o.actName)}</span></div>
                    <div class="sv-story-list">${story}</div>
                    <div class="sv-sec-h"><h3>Archive mastery</h3><span class="sv-pill gold">${career.profile?.commendations ?? 0} commendations</span></div>
                    <p class="sv-muted sm">Permanent between expeditions. Earn commendations from bosses, endings and extractions.</p>
                    ${mastery || '<p class="sv-muted sm">No mastery tracks available.</p>'}
                </aside></div>`;
        }

        /* ---------------------------------------------------------- journal */
        tabJournal() {
            const mode = BO.SurvivalMode;
            const c = mode.campaign;
            const r = rules();
            const challenges = c.objectives.list().map((ch) => {
                const frac = ch.criteria.reduce((a, [k, n]) => a + Math.min(1, (c.metrics[k] || 0) / n), 0) / ch.criteria.length;
                return `<div class="sv-chal ${ch.claimed ? 'claimed' : ch.ready ? 'ready' : ''}"${tip(ch.name, ch.info, 'Reward: ' + (BO.SurvivalItemAmounts(ch.reward) || '—') + ' · ' + ch.xp + ' XP')}>
                    <div class="sv-chal-t"><b>${esc(ch.name)}</b><small>${esc(ch.info)}</small></div>
                    <div class="sv-prog"><i style="width:${ch.claimed ? 100 : Math.round(frac * 100)}%"></i></div>
                    <div class="sv-chal-f"><small>${ch.claimed ? 'Claimed' : esc(ch.progress)}</small>
                    <button class="sv-btn sm ${ch.ready && !ch.claimed ? 'primary' : ''}" data-act="claim" data-arg="${ch.id}" ${ch.ready && !ch.claimed ? '' : 'disabled'}>${ch.claimed ? '✓' : ch.ready ? 'Claim' : ch.xp + ' XP'}</button></div></div>`;
            }).join('');
            const contracts = data.contacts.filter((n) => n.quest).map((n) => {
                const [name, key, need, xp] = n.quest;
                const have = Math.min(c.metrics[key] || 0, need);
                const done = c.claims[n.id + ':quest'];
                return `<div class="sv-contract ${done ? 'claimed' : have >= need ? 'ready' : ''}"${tip(name, n.hint.trim(), 'Given by ' + n.name + (done ? ' · claimed' : have >= need ? ' · return to claim' : ''))}>
                    <b>${esc(name)}</b><small>${esc(n.name)}</small><span class="sv-prog sm"><i style="width:${pct(have, need)}%"></i></span><em>${done ? '✓' : have + '/' + need}</em></div>`;
            }).join('');
            const checkpoint = career.checkpoint;
            return `<div class="sv-journal sv-scroll" data-scroll="journal">
                ${this.a11yBar()}
                <div class="sv-jhero">
                    <div><span class="sv-kicker">${esc(r.modes[c.options.gameType]?.name)} · ${esc(r.difficulties[c.options.difficulty]?.name)}</span><h3>${esc(mode.objective)}</h3><p>${esc(r.modes[c.options.gameType]?.description)}</p></div>
                    <div class="sv-jstats">
                        <div><b>${c.day}</b><small>Day</small></div><div><b>${mode.kills}</b><small>Kills</small></div>
                        <div><b>${BO.ZoneThrill?.level || 1}</b><small>Level</small></div><div><b>${BO.ZoneInfest?.securedCount() || 0}</b><small>Sites held</small></div>
                        <div><b>${mode.salvaged}</b><small>Salvaged</small></div><div><b>${BO.Math.formatTime(mode.clock)}</b><small>Time</small></div>
                    </div>
                    <div class="sv-jsave">
                        ${c.objectives.ending ? `<button class="sv-btn primary" data-act="epiFinish"${tip('Finish the expedition', 'You have decided the Lantern. End the run and see your results.')}>Finish expedition</button>` : ''}
                        <button class="sv-btn" data-act="save" ${c.canSave() ? '' : 'disabled'}${tip('Save checkpoint', 'Saves this expedition in your browser. Only possible with no enemies within 9 m.')}>Save checkpoint</button>
                        <small>${checkpoint ? 'Last save at ' + BO.Math.formatTime(checkpoint.clock) : 'No checkpoint yet'}${c.options.autosave ? ' · autosave on' : ''}</small>
                    </div>
                </div>
                <div class="sv-jcols">
                    <section><h4 class="sv-sub">Field challenges</h4>${challenges}</section>
                    <section><h4 class="sv-sub">${BO.GM?.active ? 'Survivor skills' : 'Survivor perks'}</h4>${BO.ZoneThrill ? BO.ZoneThrill.summaryHtml() : ''}
                        <h4 class="sv-sub">Haven contracts</h4><div class="sv-contracts">${(BO.ZoneContracts?.list || []).map((k) => { const pr = BO.ZoneContracts.progress(k); return `<div class="sv-contract"${tip(k.title, k.sub, '+' + k.xp + ' XP and a weapon reward')}><b>${esc(k.title)}</b><small>${esc(k.sub)}</small><span class="sv-prog sm"><i style="width:${pr ? pct(pr[0], pr[1]) : 0}%"></i></span><em>${pr ? pr[0] + '/' + pr[1] : '+' + k.xp}</em></div>`; }).join('') || '<p class="sv-muted sm">Haven radios new contracts every few minutes.</p>'}</div>
                        <p class="sv-muted sm">${BO.ZoneInfest ? esc(BO.ZoneInfest.chip()) + ' sites secured.' : ''}</p>
                        ${contracts ? `<h4 class="sv-sub">Contacts</h4><div class="sv-contracts">${contracts}</div>` : ''}
                        ${c.activities ? `<div class="sv-activities">${c.activities.renderJournal()}</div>` : ''}</section>
                    <section><h4 class="sv-sub">Intel <small>${BO.ZoneArchive?.summary().intel || 0}/16</small></h4>${BO.ZoneArchive ? BO.ZoneArchive.intelHtml(esc, this.intelOpen) : ''}
                        <h4 class="sv-sub">Career</h4>${this.record()}</section>
                </div>
                <div class="sv-jcols zt-jcols">
                    <section class="zt-jwide"><h4 class="sv-sub">Quest log</h4>${BO.ZoneQuests ? BO.ZoneQuests.journalHtml(tip) : ''}</section>
                    <section><h4 class="sv-sub">Legendary hunts</h4><div class="zt-legs">${(BO.ZoneLegends?.legendStatus() || []).map((L) => `<div class="zt-leg s-${L.s}"${tip(L.name, L.how, L.s === 'dead' ? 'Slain' : L.s === 'locked' ? 'Not yet awakened' : 'Hunting you')}><b>${L.s === 'dead' ? '✓ ' : ''}${esc(L.name)}</b><small>${esc(L.how)}</small><span class="sv-prog sm"><i style="width:${pct(L.cur, L.need)}%"></i></span><em>${L.s === 'dead' ? 'Slain' : L.s === 'locked' ? L.cur + '/' + L.need : 'AWAKE'}</em></div>`).join('')}</div>
                        <h4 class="sv-sub">Dungeons</h4><div class="zt-legs">${(BO.ZoneDungeons?.list() || []).map((d) => `<div class="zt-leg ${d.st.cleared ? 's-dead' : ''}"${tip(d.name, d.blurb, d.size + ' · ' + d.rooms.length + ' rooms · entrance beside the ' + d.near.replace(/_/g, ' '))}><b>${d.st.cleared ? '✓ ' : ''}${esc(d.name)}</b><small>${esc(d.size)} · ${d.rooms.length} rooms${d.rooms.some((r) => r.puzzle) ? ' · puzzle' : ''}${d.rooms.some((r) => r.boss) ? ' · boss' : ''}</small><em>${d.st.cleared ? 'Cleared' : d.st.visits ? 'Visited' : '—'}</em></div>`).join('')}</div>
                        <h4 class="sv-sub">Arena ladder</h4><p class="sv-muted sm">${BO.ZoneLegends?.ladder || 0}/10 bosses beaten. Talk to a Pit Master (Haven, Hollow Town pharmacy, Spillway boathouse) to fight.</p></section>
                </div></div>`;
        }

        /* ---------------------------------------------------------- contexts */
        ctxNpc() {
            if (BO.ZoneWorldPlus?.handlesNpc?.(this.subject)) {
                return BO.ZoneWorldPlus.renderNpcPanel(this.subject, this, { esc, tip, costInline, Icons });
            }
            const mode = BO.SurvivalMode;
            const c = mode.campaign;
            const npc = c.contact(this.subject);
            if (!npc) return '';
            const gift = npc.gift && !c.claims[npc.id + ':gift'];
            const q = npc.quest;
            const have = q ? Math.min(c.metrics[q[1]] || 0, q[2]) : 0;
            const done = q && c.claims[npc.id + ':quest'];
            const claimable = gift || (q && have >= q[2] && !done);
            const area = data.areas.find((a) => a.id === npc.area);
            const shop = npc.shop.map((id) => {
                const item = data.stock[id];
                const owned = item.vehicle && c.hasVehicle(item.vehicle);
                const afford = mode.canAfford(item.cost);
                const gives = item.gain ? BO.SurvivalItemAmounts(item.gain) : item.ammo ? item.ammo + ' rounds for each weapon' : item.plates ? item.plates + ' armor plate' : item.vehicle ? 'Vehicle (ride it from the map)' : '';
                return `<div class="sv-shop ${owned ? 'owned' : ''}"${tip(item.name, 'You get: ' + gives + '.', 'Costs ' + BO.SurvivalItemAmounts(item.cost))}>
                    ${item.gain ? Icons().item(Object.keys(item.gain)[0], 26) : Icons().named(item.plates ? 'plate' : item.ammo ? 'rifle' : item.vehicle === 'glider' ? 'flare' : 'gear', '#cfe3da', 26)}<span class="sv-shop-t"><b>${esc(item.name)}</b><small>${esc(gives)}</small></span>
                    <span class="sv-bcost">${costInline(item.cost, mode.points)}</span>
                    <button class="sv-btn sm ${afford && !owned ? 'primary' : ''}" data-act="trade" data-arg="${id}" ${owned || !afford ? 'disabled' : ''}>${owned ? 'Owned' : 'Trade'}</button></div>`;
            }).join('');
            return `<div class="sv-npc">
                <section class="sv-npc-card">
                    <span class="sv-kicker">${esc(area?.name || '')}</span>
                    <blockquote>“${esc(npc.hint.trim())}”</blockquote>
                    ${q ? `<div class="sv-contract big ${done ? 'claimed' : have >= q[2] ? 'ready' : ''}"><b>Contract · ${esc(q[0])}</b><span class="sv-prog"><i style="width:${pct(have, q[2])}%"></i></span><small>${done ? 'Claimed' : have + ' / ' + q[2] + ' · ' + q[3] + ' XP + supplies'}</small></div>` : ''}
                    <div class="sv-actions wrap">
                        ${claimable ? `<button class="sv-btn primary" data-act="reward"${tip(gift ? 'Collect supplies' : 'Claim contract', gift ? 'A one-time gift from this contact: ' + BO.SurvivalItemAmounts(npc.gift) : 'Claim your contract reward.')}>${gift ? 'Collect supplies' : 'Claim contract'}</button>` : ''}
                        ${npc.special && !c.claims[npc.id + ':special'] ? `<button class="sv-btn ${npc.special === 'helper' ? '' : 'danger'}" data-act="special"${tip(npc.special === 'helper' ? 'Recruit' : 'Challenge boss', npc.special === 'helper' ? 'This contact joins you and fights at your side.' : 'Summon this area\'s Zone Boss right here. Be ready.')}>${npc.special === 'helper' ? 'Recruit' : 'Challenge boss'}</button>` : ''}
                    </div>
                </section>
                <section class="sv-npc-shop sv-scroll" data-scroll="shop"><h4 class="sv-sub">Trades</h4>${shop || '<p class="sv-muted">This contact has nothing to trade.</p>'}</section>
            </div>`;
        }

        ctxFastTravel() {
            const mode = BO.SurvivalMode;
            const c = mode.campaign;
            const pPos = BO.Player.pos;
            const navHalf = career.masteryRank('navigator') >= 2;
            const nearWaystone = c.placed?.some((p) => p.alive && p.type === 'waystone' && Math.hypot(p.x - pPos.x, p.z - pPos.z) < 6) ||
                BO.ZoneWorldPlus?.isNearSignpost?.(pPos.x, pPos.z);
            const blocked = c.has('footOnly') ? 'On Foot Only modifier active.' : !c.canSave() ? 'Clear nearby hostiles first.' : (c.deep?.bleeding || 0) > 0 ? 'Stop bleeding first.' : c.pack.weight() > c.pack.limits.weight ? 'Overloaded — drop or stash weight.' : '';
            const points = c.travelPoints || [];
            const rows = points.length ? points.map((t) => {
                const dist = Math.round(Math.hypot(t.x - pPos.x, t.z - pPos.z));
                const free = nearWaystone || t.kind === 'Waystone' || t.free;
                const hours = free ? 0 : Math.max(0.4, dist / 110) * (navHalf ? 0.5 : 1);
                const why = dist < 14 ? 'Here now' : blocked;
                const dotCol = t.kind === 'Safehouse' ? '#8fe3c8' : t.kind === 'Settlement' ? '#f2d07a' : t.kind === 'Fort' ? '#fb923c' : t.kind === 'Waystone' ? '#c084fc' : t.kind === 'Signpost' ? '#38bdf8' : '#9fd4ff';
                return `<button class="sv-trow sv-ft-row" data-act="travel" data-arg="${esc(t.id)}" ${why ? 'disabled' : ''}${tip(t.name, why || (free ? 'Instant transit (' + dist + ' m) — zero time or food cost!' : 'Travel ' + dist + ' m · ' + hours.toFixed(1) + 'h elapsed.'), t.kind)}>
                    <span class="sv-dot" style="background:${dotCol}"></span>
                    <span class="sv-ft-main"><b>${esc(t.name)}</b><small>${esc(t.kind)} · ${dist} m</small></span>
                    <span class="sv-ft-cost ${free ? 'free' : ''}">${why ? esc(why) : (free ? 'INSTANT' : hours.toFixed(1) + 'h')}</span>
                </button>`;
            }).join('') : '<p class="sv-muted">Attune roadside Transit Signposts, secure Safehouses, clear Survivor Forts, repair Radio Towers, or build Resonance Waystones to unlock Fast Travel destinations.</p>';

            return `<div class="sv-ft-popup">
                <div class="sv-ft-head">
                    <span class="sv-muted sm">${points.length} destination${points.length === 1 ? '' : 's'} unlocked${nearWaystone ? ' · <b style="color:#8fe3c8">Beacon/Signpost link: 0h instant transit!</b>' : ''}</span>
                    <button class="sv-btn sm ghost" data-act="openFullMap">Open Full Map [${keyOf('survMap')}]</button>
                </div>
                ${blocked ? `<div class="sv-req short">${esc(blocked)}</div>` : ''}
                <div class="sv-ft-grid sv-scroll" data-scroll="ft">${rows}</div>
            </div>`;
        }

        ctxShrine() {
            const c = BO.SurvivalMode.campaign;
            const deep = c.deep;
            const dd = deepData();
            const warps = deep.allShrines.filter((s) => deep.kindledShrines.has(s.id) && s.id !== this.subject)
                .map((s) => `<button class="sv-trow" data-act="warp" data-arg="${s.id}"${tip(s.name, 'Warp there instantly. Free, but not while enemies are near.')}>${Icons().named('beacon', '#fde047', 16)}<b>${esc(s.name)}</b><small>Warp</small></button>`).join('');
            const cost = deep.attributeCost();
            return `<div class="sv-shrine">
                <section class="sv-npc-card">
                    <p class="sv-good">Health restored, Aether Flask refilled (${deep.flaskCharges}/${deep.flaskMax}), bleeding and infection cured.</p>
                    <div class="sv-actions wrap"><button class="sv-btn primary" data-act="sleep" ${c.canSave() ? '' : 'disabled'}${tip('Sleep until morning', 'Skip to 06:00, fully recover and save. Not possible with enemies nearby.')}>Sleep until morning</button></div>
                    <h4 class="sv-sub">Warp</h4><div class="sv-tlist">${warps || '<p class="sv-muted sm">Kindle another Site of Grace to warp between them.</p>'}</div>
                </section>
                <section class="sv-attrs sv-scroll" data-scroll="sattrs"><div class="sv-sec-h"><h3>Level up</h3><span class="sv-pill gold">${deep.runes.toLocaleString()} runes</span></div>
                    ${Object.entries(dd.attributes).map(([id, a]) => `<div class="sv-attr"${tip(a.name, a.bonus)}><span class="sv-attr-dot" style="background:${a.color}"></span><span class="sv-attr-t"><b>${esc(a.name)} · ${deep.attributes[id] || 0}</b><small>${esc(a.bonus)}</small></span>
                        <button class="sv-btn sm" data-act="attr" data-arg="${id}" ${deep.runes >= cost ? '' : 'disabled'}>+1 · ${cost}</button></div>`).join('')}
                </section></div>`;
        }

        ctxInfuser() {
            const mode = BO.SurvivalMode;
            const deep = mode.campaign.deep;
            const dd = deepData();
            const grounded = !!deep.grounded;
            const afford = (grounded || deep.runes >= 120) && mode.canAfford({ quartz: 2, aetherShard: 1 });
            return `<div class="sv-npc-shop sv-scroll" data-scroll="inf"><p class="sv-muted">${grounded ? 'Resonance mods last the whole expedition. Up to two can be active. Each costs 2 quartz and 1 resonance crystal.' : 'Infusions last the whole expedition. Up to two can be active. Each costs 2 quartz, 1 Aether shard and 120 runes.'}</p>
                ${Object.entries(dd.infusions || {}).map(([id, inf]) => {
                    const on = deep.hasInfusion(id);
                    return `<div class="sv-shop ${on ? 'owned' : ''}"${tip(inf.name, inf.desc)}>${Icons().named('crystal', '#c79bff', 28)}<span class="sv-shop-t"><b>${esc(inf.name)}</b><small>${esc(inf.desc)}</small></span>
                        <button class="sv-btn sm ${!on && afford ? 'primary' : ''}" data-act="infuse" data-arg="${id}" ${on || !afford || deep.infusions.length >= 2 ? 'disabled' : ''}>${on ? 'Active' : 'Infuse'}</button></div>`;
                }).join('')}</div>`;
        }

        ctxEnding() {
            const o = BO.SurvivalMode.campaign.objectives;
            const card = (id, name, glyph, color, lede, cost) => `<button class="sv-ending" data-act="decide" data-arg="${id}" style="--end:${color}"${tip(name, cost)}>
                ${Icons().named(glyph, color, 40)}<b>${name}</b><p>${lede}</p><small>${cost}</small></button>`;
            return `<div class="sv-respawn sv-ending-wrap">
                <h3>The light is louder down here.</h3>
                <p>The research data ${o.hasData ? 'in your pack names it' : 'would have named it'}: <b>Project Lantern</b>, a resonance engine that was meant to power the valley and instead drew the infection to it like moths. Haven is listening on the relay. Whatever you choose, the Zone will remember.</p>
                <div class="sv-ending-grid">
                    ${card('seal', 'Seal it', 'beacon', '#8fe3c8', 'Overload the core and bury the Crater. The infected lose their beacon and scatter — slowly, the Zone can heal.', '+6 commendations. The beam goes dark: fewer infected everywhere, no more horde nights, and unlocks the Signal Ghost kit.')}
                    ${card('extract', 'Extract the data', 'flask', '#9fd4ff', 'Leave the Lantern running and walk out with the research. Someone outside will pay for this — or weaponise it.', '+4 commendations. Banks two shares of your pack into the Archive stash and unlocks the Zone Archivist kit.')}
                    ${card('seize', 'Seize it', 'rune', '#f2b45a', 'Take control of the resonance. The infected bend toward you now. Haven will never trust you again.', '+5 commendations. Infected barely notice you. Unlocks the Lantern Keeper kit for future runs.')}
                </div>
                <div class="sv-actions center"><button class="sv-btn ghost" data-act="close"${tip('Not yet', 'Step back from the Lantern. You can return and decide later.')}>Not yet</button></div>
            </div>`;
        }

        ctxRespawn() {
            const deep = BO.SurvivalMode.campaign.deep;
            return `<div class="sv-respawn">
                ${Icons().named('beacon', '#fde047', 54)}
                <h3>The zone claimed you — but not for good.</h3>
                <p>${deep?.lostEcho ? `Your Aether Echo with <b>${deep.lostEcho.runes} runes</b> waits where you fell. Reclaim it before you die again.` : 'You can return to your last Site of Grace or field bed.'}</p>
                <div class="sv-actions center">
                    <button class="sv-btn primary big" data-act="respawn"${tip('Respawn', 'Return to your last rest point with full health and a refilled flask.')}>Respawn at rest point</button>
                    <button class="sv-btn big ghost" data-act="endRun"${tip('End expedition', 'Finish this run now and see your results.')}>End expedition</button>
                </div></div>`;
        }

        /* ================================================================
           IN-MATCH HUD
        ================================================================ */
        ensureHud() {
            if (!this._subBound) {
                this._subBound = true;
                this._subHost = document.getElementById('sv-subtitles');
                if (!this._subHost) {
                    this._subHost = document.createElement('div');
                    this._subHost.id = 'sv-subtitles';
                    this._subHost.setAttribute('aria-live', 'polite');
                    document.body.append(this._subHost);
                }
                const pushSub = (payload) => {
                    if (!BO.SurvivalMode?.active || BO.Settings?.get?.('subtitles') === false || !payload?.text) return;
                    const line = document.createElement('div');
                    line.className = 'sv-sub-line ' + (payload.kind || '');
                    line.innerHTML = (payload.tag ? `<em>[${esc(payload.tag)}]</em>` : '') + esc(payload.text);
                    this._subHost.append(line);
                    while (this._subHost.children.length > 3) this._subHost.firstChild.remove();
                    setTimeout(() => line.remove(), Math.max(1500, (payload.dur || 3.2) * 1000));
                };
                BO.Events.on('survival:subtitle', pushSub);
                BO.Events.on('hud:banner', (b) => {
                    if (!BO.SurvivalMode?.active || !b?.title) return;
                    pushSub({ tag: 'RADIO', text: b.title + (b.sub ? ' — ' + b.sub : ''), kind: 'radio', dur: 4.2 });
                });
            }
            if (this.hud) return this.hud;
            const layer = document.getElementById('hud-layer');
            const top = document.getElementById('hud-survival');
            top.innerHTML = '<div class="svh-obj"><b></b><span></span></div><div class="svh-chips"></div>';
            const wrap = document.createElement('div');
            wrap.id = 'sv-hud';
            wrap.innerHTML = `<div class="svh-vitals"></div><div class="svh-hotbar"><div class="svh-hb-name"></div><div class="svh-hb-row"></div></div>
                <div class="svh-harvest" hidden><b></b><span><i></i></span></div><div class="svh-hints"></div>`;
            layer.append(wrap);
            this.hud = {
                top, wrap,
                obj: top.querySelector('.svh-obj b'), objSub: top.querySelector('.svh-obj span'), chips: top.querySelector('.svh-chips'),
                vitals: wrap.querySelector('.svh-vitals'), hbName: wrap.querySelector('.svh-hb-name'), hbRow: wrap.querySelector('.svh-hb-row'),
                harvest: wrap.querySelector('.svh-harvest'), harvestName: wrap.querySelector('.svh-harvest b'), harvestBar: wrap.querySelector('.svh-harvest i'),
                hints: wrap.querySelector('.svh-hints')
            };
            return this.hud;
        }

        updateHud() {
            const mode = BO.SurvivalMode;
            const show = mode.active && BO.State.activeMode === 'survival' && !!mode.campaign;
            const topEl = document.getElementById('hud-survival');
            topEl.hidden = !show;
            if (this.hud) this.hud.wrap.hidden = !show;
            document.getElementById('hud-layer')?.classList.toggle('is-survival', show);
            if (!show) return;
            const h = this.ensureHud();
            const c = mode.campaign;
            const deep = c.deep;
            const p = BO.Player;
            const now = mode.clock;
            // ---- top objective bar
            const boss = [...mode.zombies, ...mode.bots].find((u) => u.alive && u.bossLabel && u.pos.distanceTo(p.pos) < 26);
            const safeLeft = Math.max(0, Math.ceil((mode.openingSeconds || 60) - now));
            let headline = mode.objective;
            let sub = '';
            const horde = BO.ZoneHorde;
            if (!mode.hostilesReleased) { headline = 'Safe period · ' + safeLeft + 's'; sub = mode.objective; }
            else if (BO.ZoneDungeons?.inside || BO.ZoneLegends?.arena) { const ds = BO.ZoneDungeons?.status() || BO.ZoneLegends.status(); headline = ds.headline; sub = ds.sub; }
            else if (BO.ZoneFinale?.active) { const fs = BO.ZoneFinale.status(); headline = fs.headline; sub = fs.sub; }
            else if (horde?.active) { headline = horde.forecast(); sub = horde.target?.base ? 'Defend your base until the waves are dead or dawn breaks' : 'Survive until the waves are dead or dawn breaks'; }
            else if (boss) { headline = boss.bossLabel + ' · ' + Math.ceil(boss.hp) + ' HP'; sub = (boss.gmBoss && BO.GM?.get('bosses')?.hint?.()) || mode.objective; }
            else if (deep?.bloodMoonActive) { headline = 'Blood Moon · ' + Math.max(0, Math.ceil(deep.bloodMoonUntil - now)) + 's'; sub = mode.objective; }
            topEl.classList.toggle('is-safe-prep', !mode.hostilesReleased);
            topEl.classList.toggle('is-blood-moon', !!deep?.bloodMoonActive || !!horde?.active || !!BO.ZoneFinale?.status()?.danger);
            topEl.classList.toggle('is-night', c.isNight);
            if (h.obj.textContent !== headline) h.obj.textContent = headline;
            if (h.objSub.textContent !== sub) h.objSub.textContent = sub;
            const vehicle = data.vehicles.find((v) => v.id === c.vehicle);
            const t = mode.threat;
            const chips = [
                `<span><b>DAY ${c.day}</b> ${c.clockFace}</span>`,
                `<span>${esc(mode.localWeather || mode.weather)}</span>`,
                `<span>${esc(c.area?.name || '')}</span>`,
                mode.hostilesReleased && t ? `<span class="${c.isNight ? 'night' : ''}">${mode.roamingCount}/${t.cap} roaming</span>` : '',
                mode.hostilesReleased && !horde?.active ? `<span class="${/tonight/.test(horde.forecast()) ? 'night' : ''}">${esc(horde.forecast())}</span>` : '',
                ...(BO.ZoneEvents?.chips() || []).map((t) => `<span class="night">${esc(t)}</span>`),
                BO.ZoneInfest?.chip() ? `<span class="held">${esc(BO.ZoneInfest.chip())}</span>` : '',
                deep?.stealthFactor < 0.65 ? '<span class="stealth">Hidden</span>' : '',
                BO.ZoneCompanions?.hudChip?.() ? `<span class="held">${esc(BO.ZoneCompanions.hudChip())}</span>` : '',
                vehicle ? `<span class="held">${esc(vehicle.name)} · ${Math.round(Math.hypot(p.vel.x, p.vel.z) * 3.6)} KM/H</span>` : ''
            ].join('');
            if (h.chipsHtml !== chips) { h.chips.innerHTML = chips; h.chipsHtml = chips; }
            // ---- vitals
            const needs = c.options.survivalNeeds !== false;
            const v = (cls, label, val, max, warn) => `<div class="svh-v ${cls} ${warn ? 'warn' : ''}"><span>${label}</span><i><b style="width:${pct(val, max)}%"></b></i></div>`;
            const temp = Math.round(deep?.temp ?? 20);
            // 1.0 contextual HUD: comfortable meters stay hidden and fade in when they matter.
            const ctxHud = BO.Settings.get('contextualHud') !== false;
            const hyd = deep?.hydration ?? 100;
            const vit = (needs ? ((!ctxHud || mode.hunger < 45) ? v('food', 'FOOD', mode.hunger, 100, mode.hunger < 25) : '') + ((!ctxHud || hyd < 45) ? v('water', 'H2O', hyd, 100, hyd < 25) : '') : '') +
                ((!ctxHud || mode.radiation > 0.5) ? v('rad', 'RAD', mode.radiation, 100, mode.radiation > 60) : '') +
                ((!ctxHud || temp < 8 || temp > 28) ? `<div class="svh-v temp ${temp < 2 ? 'cold' : temp > 31 ? 'hot' : ''}"><span>TEMP</span><em>${temp}°C</em></div>` : '') +
                ((!ctxHud || (mode.noise || 0) > 0.4) ? v('noise ' + (mode.noise > 5 ? 'loud' : ''), 'NOISE', Math.min(9, mode.noise || 0), 9, mode.noise > 5) : '') +
                ((BO.ZoneFrontier?.tox || 0) > 1 ? v('tox', 'TOX', BO.ZoneFrontier.tox, 100, BO.ZoneFrontier.tox > 40) : '') +
                (temp < -3 ? '<div class="svh-v status">FREEZING</div>' : temp < 2 ? '<div class="svh-v status">COLD</div>' : '') +
                ((BO.ZoneFrontier?.wet || 0) > 30 ? '<div class="svh-v status wet">WET</div>' : '') +
                (BO.ZoneFrontier?.riding ? '<div class="svh-v status ok">HANDCAR · ' + Math.round(Math.abs(BO.ZoneFrontier.carV) * 3.6) + ' KM/H</div>' : '') +
                (deep?.bleeding > 0 ? '<div class="svh-v status">BLEEDING</div>' : '') + (mode.fracture ? '<div class="svh-v status">FRACTURE</div>' : '') +
                (mode.jammed && mode.jammed === p.activeWeapon ? '<div class="svh-v status">JAMMED · RELOAD</div>' : '') + ((deep?.infection || 0) >= 40 ? '<div class="svh-v status">INFECTED</div>' : '') +
                (c.pack.filtered ? '<div class="svh-v status ok">FILTER</div>' : '');
            if (h.vitHtml !== vit) { h.vitals.innerHTML = vit; h.vitHtml = vit; }
            // ---- hotbar
            const hb = c.hotbar;
            const kb = BO.Settings.getKeybinds();
            const sig = hb.version + '|' + hb.selected + '|' + hb.slots.map((e) => {
                if (!e) return '-';
                if (e.kind === 'item') return e.id + (c.pack.inventory[e.id] || 0);
                if (e.kind === 'tool') return e.id + Math.ceil(c.pack.tools[e.id] || 0);
                const w = p.weapons[e.ref];
                return 'w' + e.ref + (w ? w.cfg.id + w.mag : '');
            }).join(',') + kb.hotbar1 + kb.hotbar10;
            if (h.hbSig !== sig) {
                h.hbSig = sig;
                h.hbRow.innerHTML = hb.slots.map((e, i) => `<div class="svh-slot ${i === hb.selected ? 'active' : ''} ${e ? '' : 'empty'}">
                    <span class="svh-k">${BO.Settings.keyLabel(kb['hotbar' + (i + 1)])}</span>${e ? this.entryIcon(e, 26) : ''}${this.entryBadge(e)}</div>`).join('');
                h.hbName.textContent = hb.label(hb.held);
                h.hbName.classList.remove('fade');
                void h.hbName.offsetWidth;
                h.hbName.classList.add('fade');
            }
            // ---- harvest feedback
            const ls = c.pack.lastStrike;
            const search = mode.loot?.progress;
            const showH = search || (ls && now - ls.at < 1.6);
            h.harvest.hidden = !showH;
            if (search) {
                h.harvestName.textContent = search.name;
                h.harvestBar.style.width = Math.round(search.frac * 100) + '%';
                h.harvest.classList.remove('blocked', 'hand');
            } else if (showH) {
                h.harvestName.textContent = ls.name;
                h.harvestBar.style.width = Math.round((1 - ls.frac) * 100) + '%';
                h.harvest.classList.toggle('blocked', !!ls.blocked);
                h.harvest.classList.toggle('hand', !!ls.hand);
            }
            // ---- control hints
            const showHints = BO.Settings.get('showControlHints') !== false;
            const hintsHtml = showHints ? ['survInventory', 'survCraft', 'survBuild', 'survMap'].map((a) => `<span><kbd>${keyOf(a)}</kbd>${({ survInventory: 'Inventory', survCraft: 'Craft', survBuild: 'Build', survMap: 'Map' })[a]}</span>`).join('') : '';
            if (h.hintsHtml !== hintsHtml) { h.hints.innerHTML = hintsHtml; h.hintsHtml = hintsHtml; }
            // ---- interaction prompt
            const prompt = BO.HUD.elPrompt;
            if (prompt) {
                prompt.classList.toggle('hidden', !mode.prompt || !!BO.ZoneBuild?.active);
                const text = mode.prompt ? '[' + keyOf('interact') + '] ' + mode.prompt : '';
                if (prompt.textContent !== text) prompt.textContent = text;
                prompt.style.color = '#e6f4ee';
                prompt.style.borderColor = '#8fe3c8';
            }
        }
    }

    BO.SurvivalUI = new SurvivalUI();
})(window.BO);
