
(function (BO) {
    'use strict';

    const areas = [
        { id: 'relay', name: 'Relay Lowlands', x: 0, y: 0, z: 105, color: 0x849468, level: 1, tier: 1 },
        { id: 'pine', name: 'Pinebreak Woods', x: -155, y: 0, z: 50, color: 0x648459, level: 1, tier: 1 },
        { id: 'freight', name: 'Freight Works', x: 120, y: 0, z: 15, color: 0xa18b72, level: 1, tier: 1 },
        { id: 'basin', name: 'Spillway Marsh', x: 185, y: 0, z: -85, color: 0x788f73, level: 1, tier: 2 },
        { id: 'airfield', name: 'Derelict Airfield', x: 180, y: 0, z: 155, color: 0x8d97a6, level: 1, tier: 2 },
        { id: 'radar', name: 'Radar Ridge', x: 95, y: 11, z: -185, color: 0x6fa4b8, level: 1, tier: 2 },
        { id: 'frost', name: 'Frostline Quarry', x: -195, y: 0, z: -180, color: 0xb4d0d9, level: 3, tier: 3, bounds: [-245, -135, -235, -125], entrance: [-135, -175], breachCost: { scrap: 4, fuel: 2 } },
        { id: 'cinder', name: 'Cinder Flats', x: 195, y: 0, z: 75, color: 0xbd8060, level: 5, tier: 3, bounds: [145, 245, 25, 125], entrance: [145, 75], breachCost: { scrap: 6, fuel: 3 } },
        { id: 'trench', name: 'Research Trench', x: 0, y: -8, z: -195, color: 0x9c7cba, level: 1, tier: 3 }
    ];
    const ranks = [
        [1, 'Drifter'], [2, 'Scout'], [4, 'Ranger'], [6, 'Pathfinder'], [9, 'Warden'], [13, 'Vanguard'], [18, 'Zone Marshal']
    ];
    const vehicles = [
        { id: 'skates', name: 'Roller skates', level: 1, speed: 1.65, offroad: 0.95, color: 0xcd9a83, detail: 'Fast on paved highways, slower on mud and dirt.' },
        { id: 'bike', name: 'Trail bicycle', level: 2, speed: 2.10, offroad: 1.60, color: 0x82c39d, detail: 'Nimble road and cross-country transit across the valley.' },
        { id: 'mount', name: 'Pack horse', level: 3, speed: 1.85, offroad: 2.10, color: 0x9c745a, detail: 'Dominates rough terrain, marsh mud, and mountain slopes.' },
        { id: 'glider', name: 'Ridge glider', level: 4, speed: 2.40, offroad: 2.40, color: 0xcfc590, detail: 'Launch off Relay Tower, Slateback Ridge, or ATC Tower for long aerial glides.' },
        { id: 'rover', name: 'Salvage rover', level: 6, speed: 2.90, offroad: 2.30, color: 0x8394a4, detail: 'High-speed heavy valley cruiser. Draws distant infected with engine noise.' }
    ];
    const build = [
        { id: 'wall', name: 'Timber wall', size: [2.8, 2.6, 0.24], cost: { timber: 4 }, color: 0x8d694b, detail: 'Solid cover that can be shot apart.' },
        { id: 'floor', name: 'Raised floor', size: [2.8, 0.24, 2.8], cost: { timber: 4 }, color: 0x966f48, detail: 'A flat foundation for shelter pieces.' },
        { id: 'roof', name: 'Shelter roof', size: [2.8, 0.23, 2.8], cost: { timber: 3, fiber: 2 }, color: 0x5c7666, detail: 'Requires a nearby wall. Climb above it with a ladder.' },
        { id: 'bed', name: 'Field bed', size: [1.8, 0.40, 0.9], cost: { timber: 3, cloth: 2 }, color: 0x7f8c65, detail: 'Rest, recover composure and save the expedition.' },
        { id: 'bench', name: 'Crafting table', size: [1.2, 0.85, 0.75], cost: { timber: 4, stone: 2, scrap: 1 }, color: 0xa18257, detail: 'A workbench: unlocks bench recipes, tool upgrades and weapon forging nearby.' },
        { id: 'ladder', name: 'Ladder', size: [0.66, 2.7, 0.20], cost: { timber: 3, cord: 1 }, color: 0xc2a672, detail: 'Climb to a nearby roof or dismount to the ground.' },
        { id: 'campfire', name: 'Campfire', size: [0.65, 0.27, 0.65], cost: { timber: 2, stone: 3 }, color: 0xcf8061, detail: 'Cook meals, brew tea and tonics, and keep warm at night.' }
    ];
    const stock = {
        ration: { name: 'Field ration', cost: { scrap: 1 }, gain: { rations: 1 } },
        aid: { name: 'Trauma kit', cost: { scrap: 2, cloth: 1 }, gain: { medkits: 1 } },
        salvage: { name: 'Bundle of salvage', cost: { cloth: 2 }, gain: { scrap: 3 } },
        cloth: { name: 'Clean linen', cost: { rations: 1 }, gain: { cloth: 2 } },
        fuel: { name: 'Rail fuel', cost: { scrap: 2 }, gain: { fuel: 1 } },
        coil: { name: 'Recovered coil', cost: { scrap: 4, fuel: 1 }, gain: { coil: 1 } },
        ammo: { name: 'Ammunition pouch', cost: { scrap: 2 }, ammo: 22 },
        plates: { name: 'Armor plate', cost: { scrap: 3 }, plates: 1 },
        bike: { name: 'Trail bicycle', cost: { scrap: 3 }, vehicle: 'bike' },
        mount: { name: 'Pack horse', cost: { rations: 2, scrap: 2 }, vehicle: 'mount' },
        glider: { name: 'Ridge glider', cost: { cloth: 3, scrap: 3 }, vehicle: 'glider' },
        rover: { name: 'Salvage rover', cost: { fuel: 3, scrap: 6 }, vehicle: 'rover' }
    };

    const contacts = [
        ['rowan','Quartermaster Rowan','relay',-18,122,'Reserve caches lie north along the highway. Stock medical gear before descending the trench.',['ration','plates'],{scrap:2},['Supply run','salvaged',8,100]],
        ['mara','Medic Mara','relay',22,124,'Trauma kits are scarce out in the Tier 3 frontier. Bring clean cloth for medical trades.',['aid','cloth'],{cloth:1},['Field clinic','healed',50,110]],
        ['reed','Mechanic Reed','relay',26,102,'Take the Grand Rail Loop or a bicycle down the highway. Fuel powers both trains and fast travel.',['bike','fuel'],null,['Rolling stock','rail',1,150]],
        ['inez','Surveyor Inez','relay',-24,102,'Every discovered sector opens a fast-travel beacon. Ziplines bridge the cliffs and lowlands.',[],null,['Survey circuit','visited',4,170]],
        ['bell','Cook Bell','relay',-12,138,'Turn raw rations into hot stew at the shelter stove or a campfire.',['ration'],{rations:1},['Hot supper','cooked',1,85]],
        ['lark','Carpenter Lark','pine',-136,56,'Build forward outposts in Pinebreak or the outer ring so you always have a bed nearby.',['salvage'],null,['Raise a shelter','built',3,130]],
        ['niko','Hunter Niko','pine',-158,32,'Gunfire echoes for a hundred meters across the valley. Use suppressed fire or stealth takedowns.',['ammo'],{rations:1},['Cull the pack','infected',5,125]],
        ['sela','Stablehand Sela','pine',-145,86,'Pack horses shrug off mud, forest slopes, and quarry snow.',['mount','ration'],null,['Pinebreak courier','rides',2,110]],
        ['reedwood','Forester Moss','pine',-178,66,'Tall perimeter pines yield extra timber and crash down onto anything underneath.',['salvage','cloth'],null,['Timber clearance','breaches',3,115]],
        ['tilly','Runner Tilly','pine',-132,96,'Stick to the asphalt highway with roller skates for fast inner-ring runs.',['ration'],{cloth:2},null],
        ['wright','Railmaster Wright','freight',88,-32,'Feed the locomotive 5 salvage and 2 fuel to ride the 1,100m Grand Rail Loop.',['fuel','ammo'],null,['Freight service','rail',1,125]],
        ['suri','Armorer Suri','freight',138,24,'Clear weapon jams with reload. Upgrade firearms to Mk III before hitting the Airfield or Trench.',['ammo','plates'],null,['Range work','kills',8,180]],
        ['oren','Recycler Oren','freight',108,34,'Coils power the prototype cannon—check the Field Hospital or Airfield Hangar first.',['coil','salvage'],null,['Parts manifest','salvaged',14,160]],
        ['wisp','Lookout Wisp','airfield',212,158,'Jump off the 11m Airfield ATC tower or the 16m Relay Tower with a ridge glider.',['glider'],null,['Clear skies','glides',1,180]],
        ['tess','Dispatcher Tess','airfield',162,152,'The Airfield runway is a straight shot for a salvage rover. Watch for PMC reinforcements.',['rover','fuel'],null,['Motor pool','rides',3,180]],
        ['brook','Hydrologist Brook','basin',162,-62,'Opening the spillway floods the entire eastern basin permanently. Loot first!',['cloth','ration'],null,['Spillway test','flood',1,150]],
        ['fenn','Ferryman Fenn','basin',208,-42,'The zipline and rail bridge stay clear above the flooded basin.',['fuel'],{fuel:1},null],
        ['tallow','Marsh Doctor Tallow','radar',86,-178,'Radar Ridge gives clear sniper overwatch down toward Freight Works and the Trench ramp.',['aid'],null,['Exposure report','radiation',45,130]],
        ['pike','Sentry Pike','basin',174,-118,'I can cover your flank when pushing into Cinder Flats or clearing PMC routes.',['ammo'],null,['Clear the route','pmc',3,170],'helper'],
        ['kestrel','Quarry Ward Kestrel','frost',-155,-172,'Pale Maul prowls the northwest quarry. Breach the gate early or reach Level 3 to enter.',['plates','aid'],null,['Pale Maul','frostBoss',1,260],'frostBoss'],
        ['ana','Ice Driller Ana','frost',-212,-198,'Sub-zero frost drains stamina fast. Pack horses hold footing on quarry ice.',['coil','ration'],{fuel:1},null],
        ['boone','Prospector Boone','frost',-210,-152,'Quartz and copper veins run rich across Frostline Quarry and Echo Cavern.',['salvage'],{scrap:3},null],
        ['ember','Kiln Keeper Ember','cinder',195,62,'Cinder Regent guards these blazing flats. Bring armor plates and thermal broth.',['plates','ammo'],null,['Cinder Regent','cinderBoss',1,350],'cinderBoss'],
        ['cal','Ash Trader Cal','cinder',218,96,'Tier 3 frontier zones pay +75% runes and XP, but tougher infected arrive earlier.',['fuel','ration','aid'],null,null],
        ['vera','Lab Runner Vera','trench',-20,-182,'The Research Trench sits 8m underground. Watch your radiation meter and bring a filter.',['ammo','aid'],{cloth:2},['Containment breach','apex',1,220]],
        ['orin','Evac Officer Orin','pine',-110,-116,'Bring the Aether Core to Evac Ridge and hold the perimeter until extraction lands.',['aid','ammo'],null,['Get out alive','core',1,160]]
    ].map(([id, name, area, x, z, hint, shop, gift, quest, special]) =>
        ({ id, name, area, x, y: area === 'trench' ? -8 : area === 'radar' ? 11 : 0, z, hint, shop, gift, quest, special }));

    const pools = {
        mixed: { name: 'Mixed patrols', keywords: '', extra: 'An escalating mix of infected and PMC reinforcements.' },
        horde: { name: 'Infected surge', keywords: 'shambler|sprinter|ankle_biter|ripper|bloater|hopper|crawler|shield_walker|ghoul|ratman|mummy|goblin|lanky|scarecrow|hunch_spitter|headless|mud_waddler|ravager|goliath', extra: 'Classic undead hordes with 30% faster spawn rates.' },
        mutants: { name: 'Aether mutants', keywords: 'wraith|witch|slime|hydra|aether|void|blob|mitosis|sprite|gnome|shaman|vampire|broodmother|fracture|twin_horror|toxic_toad|shadow_imp|shadow_stalker|magma_brute', extra: 'Favours Aether, magical, and splitting mutant infected.' },
        patrols: { name: 'PMC occupation', keywords: 'shambler|sprinter|ripper|headless|shield_walker|cyber_assassin|ronin|berserker|juggernaut|iron_ogre|warbear|obsidian|ratman|bone_hound|werewolf', extra: 'Additional PMC patrols contest surface routes alongside armored and feral infected.' }
    };
    const defaults = { difficulty: 'standard', pool: 'mixed', dayLength: 360, startHour: 8, survivalNeeds: true,
        weather: true, autosave: true, encounterRate: 1 };
    BO.SurvivalCampaignData = { areas, ranks, vehicles, build, stock, contacts, pools, defaults };
})(window.BO);
