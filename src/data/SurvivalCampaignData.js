
(function (BO) {
    'use strict';

    const areas = [
        { id: 'relay', name: 'Relay Lowlands', x: 0, y: 0, z: 24, color: 0x849468, level: 1 },
        { id: 'pine', name: 'Pinebreak Woods', x: -43, y: 0, z: 14, color: 0x648459, level: 1 },
        { id: 'freight', name: 'Freight Works', x: 25, y: 0, z: 0, color: 0xa18b72, level: 1 },
        { id: 'basin', name: 'Spillway Marsh', x: 43, y: 0, z: -17, color: 0x788f73, level: 1 },
        { id: 'frost', name: 'Frostline Quarry', x: -45, y: 0, z: -43, color: 0xb4d0d9, level: 3, bounds: [-55, -34, -55, -34], entrance: [-35, -44] },
        { id: 'cinder', name: 'Cinder Flats', x: 44, y: 0, z: 28, color: 0xbd8060, level: 5, bounds: [34, 55, 17, 43], entrance: [35, 30] },
        { id: 'trench', name: 'Research Trench', x: 0, y: -5, z: -51, color: 0x9c7cba, level: 1 }
    ];
    const ranks = [
        [1, 'Drifter'], [2, 'Scout'], [4, 'Ranger'], [6, 'Pathfinder'], [9, 'Warden'], [13, 'Vanguard'], [18, 'Zone Marshal']
    ];
    const vehicles = [
        { id: 'skates', name: 'Roller skates', level: 1, speed: 1.52, offroad: 0.85, color: 0xcd9a83, detail: 'Fast on the central paved road, slow on dirt.' },
        { id: 'bike', name: 'Trail bicycle', level: 2, speed: 1.70, offroad: 1.39, color: 0x82c39d, detail: 'Efficient road and trail travel.' },
        { id: 'mount', name: 'Pack horse', level: 3, speed: 1.42, offroad: 1.53, color: 0x9c745a, detail: 'Best footing in mud and on rough ground.' },
        { id: 'glider', name: 'Ridge glider', level: 4, speed: 1.45, offroad: 1.45, color: 0xcfc590, detail: 'Deploy on a roof or ledge, then step off and steer during descent.' },
        { id: 'rover', name: 'Salvage rover', level: 6, speed: 2.05, offroad: 1.65, color: 0x8394a4, detail: 'Fast transport. Bulky and loud when moving.' }
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

    // Each contact offers a distinct combination of supplies, leads, contracts and specialist stock.
    const contacts = [
        ['rowan','Quartermaster Rowan','relay',-5,30,'A reserve stash is marked north of the road. Keep medical stock for the trench.',['ration','plates'],{scrap:2},['Supply run','salvaged',8,100]],
        ['mara','Medic Mara','relay',6,31,'Trauma kits are scarce past the quarry. I trade clean cloth for medical supplies.',['aid','cloth'],{cloth:1},['Field clinic','healed',50,110]],
        ['reed','Mechanic Reed','relay',8,24,'Cycling is quickest on pavement. Bring fuel if you plan to restore the railway.',['bike','fuel'],null,['Rolling stock','rail',1,150]],
        ['inez','Surveyor Inez','relay',-7,24,'Mark the people you meet. Each new biome adds a safe fast-travel destination. ',[],null,['Survey circuit','visited',4,170]],
        ['bell','Cook Bell','relay',-3,37,'The shelter and a field campfire can turn a ration into a hot meal.',['ration'],{rations:1},['Hot supper','cooked',1,85]],
        ['lark','Carpenter Lark','pine',-37,15,'Build from the ground up. Place a floor, a wall, then a supported roof.',['salvage'],null,['Raise a shelter','built',3,130]],
        ['niko','Hunter Niko','pine',-43,7,'The infected react to noise. Take a short route at dusk when sight lines are good.',['ammo'],{rations:1},['Cull the pack','infected',5,125]],
        ['sela','Stablehand Sela','pine',-40,26,'A pack horse holds its pace on rough ground and wet trails.',['mount','ration'],null,['Pinebreak courier','rides',2,110]],
        ['reedwood','Forester Moss','pine',-47,21,'The outer trunks can break. A fallen tree can crush anything in its path.',['salvage','cloth'],null,['Timber clearance','breaches',3,115]],
        ['tilly','Runner Tilly','pine',-37,32,'Skates are free from the travel kit. Stick to the road to keep your speed.',['ration'],{cloth:2},null],
        ['wright','Railmaster Wright','freight',15,-6,'Feed the locomotive fuel and salvage, then interact to board and dismount.',['fuel','ammo'],null,['Freight service','rail',1,125]],
        ['suri','Armorer Suri','freight',30,8,'Clear a stoppage with reload. Inspect the magazine by hand before entering the trench.',['ammo','plates'],null,['Range work','kills',8,180]],
        ['oren','Recycler Oren','freight',20,10,'Coils can be traded, but the hospital already has one if you need a first prototype.',['coil','salvage'],null,['Parts manifest','salvaged',14,160]],
        ['wisp','Lookout Wisp','freight',30,-13,'The tall relay platform is a good spot to unfold the ridge glider.',['glider'],null,['Clear skies','glides',1,180]],
        ['tess','Dispatcher Tess','freight',35,2,'A rover needs fuel and salvage up front. It is the quickest surface vehicle.',['rover','fuel'],null,['Motor pool','rides',3,180]],
        ['brook','Hydrologist Brook','basin',41,-10,'The dam floods the basin permanently. Rescue supplies before opening the gate.',['cloth','ration'],null,['Spillway test','flood',1,150]],
        ['fenn','Ferryman Fenn','basin',47,-4,'The raised road and rail bridge stay above the flooded sector.',['fuel'],{fuel:1},null],
        ['tallow','Marsh Doctor Tallow','basin',46,-22,'Radiation recedes outside the trench. Leave a kit for the return leg.',['aid'],null,['Exposure report','radiation',45,130]],
        ['pike','Sentry Pike','basin',38,-28,'I can join your patrol. Clear hostile patrols before calling extraction.',['ammo'],null,['Clear the route','pmc',3,170],'helper'],
        ['kestrel','Quarry Ward Kestrel','frost',-40,-42,'The Pale Maul guards this quarry. You can challenge it from here.',['plates','aid'],null,['Pale Maul','frostBoss',1,260],'frostBoss'],
        ['ana','Ice Driller Ana','frost',-49,-47,'Snow reduces footing. Pack horses handle the quarry trail well.',['coil','ration'],{fuel:1},null],
        ['boone','Prospector Boone','frost',-49,-38,'Haul quarry salvage back to a workbench and build yourself a base.',['salvage'],{scrap:3},null],
        ['ember','Kiln Keeper Ember','cinder',44,24,'The Cinder Regent patrols the dry flats. Challenge it when you are supplied.',['plates','ammo'],null,['Cinder Regent','cinderBoss',1,350],'cinderBoss'],
        ['cal','Ash Trader Cal','cinder',49,35,'Fuel and rations keep this outpost alive. Stock up before nightfall.',['fuel','ration','aid'],null,null],
        ['vera','Lab Runner Vera','trench',-7,-42,'The Apex guards the core. Break off to surface level if radiation climbs too high.',['ammo','aid'],{cloth:2},['Containment breach','apex',1,220]],
        ['orin','Evac Officer Orin','pine',-21,-24,'Bring the core to Evac Ridge and stay near the beacon until extraction is ready.',['aid','ammo'],null,['Get out alive','core',1,160]]
    ].map(([id, name, area, x, z, hint, shop, gift, quest, special]) =>
        ({ id, name, area, x, y: area === 'trench' ? -4.5 : 0, z, hint, shop, gift, quest, special }));

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
