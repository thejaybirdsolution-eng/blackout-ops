/* ============================================================================
   BLACKOUT OPS — The quest log
   A large catalog of distinct, hand-written quests across eight chapters —
   hunting specific infected and animals, gathering and crafting, cooking,
   building, finding places (the tallest point in the Zone, every landmark),
   clearing dungeons, holding an area for a set time, mining out a quarry,
   felling a whole grove, legendary bosses, arena duels and more.
   Four are tracked at once (on the HUD, compass and map); choose them in the
   Journal or let the log hand you the next one. Every quest completes once.
============================================================================ */
(function (BO) {
    'use strict';

    const CHAPTERS = [
        ['survivor', 'Survivor', '🎒'], ['hunter', 'Hunter', '🦌'], ['chef', 'Chef', '🍳'], ['builder', 'Builder', '🔨'],
        ['explorer', 'Explorer', '🧭'], ['miner', 'Miner & Woodsman', '⛏'], ['warrior', 'Warrior', '⚔'], ['legend', 'Legend', '👑']
    ];

    const Q = [];
    const q = (cat, id, title, text, goal, d = 1, extra = {}) => Q.push({ cat, id, title, text, goal, d, ...extra });
    const M = (key, n) => ({ t: 'metric', key, n });
    const HAVE = (item, n) => ({ t: 'have', item, n });
    const BUILD = (type, n) => ({ t: 'build', type, n });

    /* ---------------- Survivor */
    q('survivor', 'firstSteps', 'First Steps', 'Search 5 containers. Everything you need is lying around somewhere.', M('containers', 5), 1);
    q('survivor', 'packrat', 'Pack Rat', 'Search 40 containers in one expedition.', M('containers', 40), 3);
    q('survivor', 'firstAid', 'First Aid', 'Restore 150 health with bandages, kits and food.', M('healed', 150), 1);
    q('survivor', 'restful', 'A Proper Night\'s Sleep', 'Rest in a bed you built twice.', M('fieldRests', 2), 2);
    q('survivor', 'level5', 'Finding Your Feet', 'Reach survivor level 5.', { t: 'level', n: 5 }, 1);
    q('survivor', 'level10', 'Seasoned', 'Reach survivor level 10.', { t: 'level', n: 10 }, 3);
    q('survivor', 'level20', 'Zone Veteran', 'Reach survivor level 20.', { t: 'level', n: 20 }, 5);
    q('survivor', 'contracts5', 'Haven\'s Errand-Runner', 'Complete 5 Haven radio contracts.', M('contracts', 5), 3);
    q('survivor', 'caches2', 'Treasure Hunter', 'Open 2 treasure caches.', M('caches', 2), 3);
    q('survivor', 'secure5', 'Pushing Back', 'Secure 5 infested sites.', M('secured', 5), 2);
    q('survivor', 'secure15', 'Taking the Zone Back', 'Secure 15 infested sites.', M('secured', 15), 4);
    q('survivor', 'horde1', 'One Night at a Time', 'Survive a horde night.', M('hordesSurvived', 1), 3);
    q('survivor', 'walk2k', 'Long Walk', 'Travel 2 km on foot.', { t: 'distance', n: 2000, foot: true }, 2);
    q('survivor', 'swim', 'Cold Water', 'Swim 120 m in the reservoir.', { t: 'distance', n: 120, swim: true }, 2);
    q('survivor', 'eat20', 'Three Square Meals', 'Eat 20 times.', M('eaten', 20), 2);
    q('survivor', 'claim1', 'Wheels', 'Claim a parked vehicle.', M('vehiclesClaimed', 1), 1);
    q('survivor', 'claim5', 'Collector', 'Claim 5 parked vehicles.', M('vehiclesClaimed', 5), 4);
    q('survivor', 'ride1k', 'Road Trip', 'Ride 1.5 km on any vehicle.', { t: 'distance', n: 1500, ride: true }, 2);
    q('survivor', 'build1veh', 'Garage Project', 'Build one of the five build-only vehicles.', M('vehiclesBuilt', 1), 4);
    q('survivor', 'flawless', 'Untouchable', 'Kill 10 infected in a row without taking any damage.', { t: 'flawless', n: 10 }, 3);

    /* ---------------- Hunter */
    q('hunter', 'rabbits', 'Rabbit Season', 'Hunt 5 rabbits.', M('hunt_rabbit', 5), 1);
    q('hunter', 'fowl', 'Feathers Flying', 'Hunt 5 pheasants.', M('hunt_fowl', 5), 1);
    q('hunter', 'deer', 'Venison for Haven', 'Hunt 3 deer. They spook easily — crouch.', M('hunt_deer', 3), 2);
    q('hunter', 'boar', 'Tusks', 'Hunt 3 wild boar. They fight back.', M('hunt_boar', 3), 2);
    q('hunter', 'goats', 'Mountain Climber', 'Hunt 3 mountain goats in the Frostline.', M('hunt_goat', 3), 2);
    q('hunter', 'cattle', 'Feral Herd', 'Hunt 2 feral cattle.', M('hunt_cow', 2), 2);
    q('hunter', 'wolves', 'Pack Breaker', 'Kill 4 wolves. They hunt at night.', M('hunt_wolf', 4), 3);
    q('hunter', 'bear', 'Bear Necessities', 'Kill a brown bear.', M('hunt_bear', 1), 4);
    q('hunter', 'hunt25', 'Master of the Hunt', 'Hunt 25 animals of any kind.', M('hunted', 25), 4);
    q('hunter', 'hides', 'Tanner\'s Order', 'Have 10 raw hides.', HAVE('hide', 10), 2);
    q('hunter', 'feathers', 'Fletcher\'s Order', 'Have 20 feathers.', HAVE('feather', 20), 2);
    q('hunter', 'antlers', 'Trophy', 'Have 2 antlers.', HAVE('antler', 2), 3);
    q('hunter', 'wool', 'Warm Hands', 'Have 12 goat wool.', HAVE('wool', 12), 3);
    q('hunter', 'bones', 'Boneyard', 'Have 20 bones.', HAVE('bone', 20), 2);
    q('hunter', 'leather', 'Leatherworker', 'Tan 4 batches of leather.', M('crafted_tan', 4), 3);
    q('hunter', 'lArmor', 'Dressed for It', 'Craft leather armour.', M('crafted_leatherArmor', 1), 3);
    q('hunter', 'bArmor', 'Bone & Hide', 'Craft bone & hide armour.', M('crafted_boneArmor', 1), 4);

    /* ---------------- Chef */
    q('chef', 'cook5', 'Campfire Cook', 'Cook 5 meals.', M('meals', 5), 1);
    q('chef', 'cook15', 'Line Cook', 'Cook 15 meals.', M('meals', 15), 3);
    q('chef', 'cook40', 'Head Chef', 'Cook 40 meals.', M('meals', 40), 5);
    q('chef', 'venison', 'Roast Venison', 'Roast 3 venison.', M('crafted_cook_venison', 3), 2);
    q('chef', 'fish', 'Fish Fry', 'Grill 3 trout.', M('crafted_cook_fish', 3), 2);
    q('chef', 'bearsteak', 'Bear Steak', 'Sear a bear steak.', M('crafted_cook_bear', 1), 4);
    q('chef', 'eggs', 'Breakfast', 'Fry 4 eggs.', M('crafted_cook_egg', 4), 2);
    q('chef', 'mush', 'Forager\'s Supper', 'Roast mushrooms 3 times.', M('crafted_cook_mushroom', 3), 1);
    q('chef', 'jerky', 'Trail Food', 'Salt jerky twice.', M('crafted_jerky', 2), 2);
    q('chef', 'stew', 'Hunter\'s Stew', 'Cook a hunter\'s stew at a cooking station.', M('crafted_stew', 1), 3);
    q('chef', 'pie', 'Meat Pies', 'Bake meat pies at a cooking station.', M('crafted_meatPie', 1), 3);
    q('chef', 'omelette', 'Omelette', 'Make 2 mushroom omelettes.', M('crafted_omelette', 2), 3);
    q('chef', 'berrypie', 'Sweet Tooth', 'Bake a berry pie.', M('crafted_berryPie', 1), 3);
    q('chef', 'ham', 'Sunday Roast', 'Glaze a honey ham.', M('crafted_honeyHam', 1), 4);
    q('chef', 'feast', 'The Feast', 'Cook a survivor\'s feast — beef, fowl, fish, berries and honey.', M('crafted_feast', 1), 5);
    q('chef', 'golden', 'Golden Ration', 'Cook a golden ration.', M('crafted_goldenRation', 1), 5);
    q('chef', 'berries', 'Berry Picker', 'Have 25 wild berries.', HAVE('berries', 25), 1);
    q('chef', 'honey', 'Sticky Fingers', 'Raid 3 wild beehives.', M('harvest_beehive', 3), 2);
    q('chef', 'mushrooms', 'Mushroom Ring', 'Have 15 field mushrooms.', HAVE('mushroom', 15), 2);

    /* ---------------- Builder */
    q('builder', 'campfire', 'Light a Fire', 'Build a campfire.', BUILD('campfire', 1), 1);
    q('builder', 'firepit', 'Fire Camp', 'Build a fire camp.', BUILD('firepit', 1), 1);
    q('builder', 'cookstation', 'A Real Kitchen', 'Build a cooking station.', BUILD('cookstation', 1), 2);
    q('builder', 'bench', 'Workshop', 'Build a crafting table.', BUILD('bench', 1), 1);
    q('builder', 'bed', 'Somewhere to Lie Down', 'Build a bed.', BUILD('bed', 1), 1);
    q('builder', 'chests', 'Storage Solutions', 'Build 2 storage chests.', BUILD('chest', 2), 2);
    q('builder', 'walls', 'Four Walls', 'Have 8 walls standing.', { t: 'buildAny', types: ['wall', 'stoneWall'], n: 8 }, 2);
    q('builder', 'floors', 'Foundations', 'Have 6 floors standing.', { t: 'buildAny', types: ['floor', 'stoneFloor'], n: 6 }, 2);
    q('builder', 'fortress', 'Fortress', 'Have 30 building pieces standing at once.', { t: 'buildAny', types: null, n: 30 }, 4);
    q('builder', 'torches', 'Light the Way', 'Build 4 standing torches.', BUILD('wallTorch', 4), 2);
    q('builder', 'kiln', 'Kiln', 'Build a stone kiln.', BUILD('kiln', 1), 2);
    q('builder', 'tanrack', 'Tannery', 'Build a tanning rack.', BUILD('tanrack', 1), 2);
    q('builder', 'smoker', 'Smokehouse', 'Build a smokehouse.', BUILD('smoker', 1), 3);
    q('builder', 'stonewalls', 'Masonry', 'Have 4 masonry walls standing.', BUILD('stoneWall', 4), 3);
    q('builder', 'braid', 'Cordage', 'Braid cord 10 times.', M('crafted_braid', 10), 1);
    q('builder', 'boards', 'Sawmill', 'Saw boards 6 times.', M('crafted_sawBoards', 6), 2);
    q('builder', 'smelt', 'Smelter', 'Smelt iron 5 times.', M('crafted_smelt', 5), 2);
    q('builder', 'glass', 'Glassblower', 'Make glass 4 times.', M('crafted_glass', 4), 3);
    q('builder', 'gold', 'Goldsmith', 'Smelt 3 gold bars.', M('crafted_smeltGold', 3), 4);
    q('builder', 'powder', 'Chemist', 'Mix gunpowder 4 times.', M('crafted_gunpowder', 4), 3);
    q('builder', 'grenades', 'Grenadier', 'Craft 3 frag grenades.', M('crafted_grenade', 3), 3);
    q('builder', 'molotovs', 'Cocktail Hour', 'Craft 3 molotov cocktails.', M('crafted_molotov', 3), 2);
    q('builder', 'spyglass', 'Far Sight', 'Craft a spyglass.', M('crafted_spyglass', 1), 4);
    q('builder', 'lantern', 'Lamplighter', 'Craft a quartz lantern.', M('crafted_makeLantern', 1), 3);
    q('builder', 'candles', 'Candlemaker', 'Make tallow candles 3 times.', M('crafted_candle', 3), 2);
    q('builder', 'engine', 'Mechanic', 'Build 2 sets of engine parts.', M('crafted_engineParts', 2), 4);
    q('builder', 'fireworks', 'Showtime', 'Make signal fireworks.', M('crafted_fireworks', 1), 3);
    q('builder', 'crafted50', 'Maker', 'Craft 50 things.', M('crafted', 50), 3);

    /* ---------------- Explorer (locations resolved when the quest starts) */
    q('explorer', 'tallest', 'Top of the World', 'Find the tallest point in the Zone and stand on it.', { t: 'reach', loc: 'tallest', r: 7 }, 3);
    q('explorer', 'lowest', 'Rock Bottom', 'Find the lowest dry point in the Zone.', { t: 'reach', loc: 'lowest', r: 7 }, 3);
    q('explorer', 'haven', 'Haven', 'Find Haven, the survivor camp.', { t: 'reach', loc: 'haven', r: 14 }, 1);
    q('explorer', 'crane', 'Steel Giant', 'Reach the Kessel gantry crane.', { t: 'reach', loc: 'mk:kessel_crane', r: 12 }, 2);
    q('explorer', 'dam', 'The Dam', 'Reach the Spillway dam.', { t: 'reach', loc: 'mk:dam', r: 14 }, 2);
    q('explorer', 'minehead', 'Quarry Head', 'Reach the quarry mine head in the Frostline.', { t: 'reach', loc: 'mk:frost_mine', r: 12 }, 3);
    q('explorer', 'flare', 'Flare Stack', 'Reach the refinery flare stack.', { t: 'reach', loc: 'mk:cinder_flare', r: 12 }, 3);
    q('explorer', 'dome', 'Observation Dome', 'Reach the campus observation dome.', { t: 'reach', loc: 'mk:campus_dome', r: 12 }, 4);
    q('explorer', 'lantern', 'Into the Light', 'Stand within 45 m of the Lantern.', { t: 'reach', loc: 'lantern', r: 45 }, 5);
    q('explorer', 'nw', 'Edge of the Map: North-West', 'Reach the far north-west corner of the Zone.', { t: 'reach', loc: 'corner:nw', r: 25 }, 2);
    q('explorer', 'se', 'Edge of the Map: South-East', 'Reach the far south-east corner of the Zone.', { t: 'reach', loc: 'corner:se', r: 25 }, 3);
    q('explorer', 'regions5', 'Cartographer', 'Discover 5 regions.', { t: 'regions', n: 5 }, 2);
    q('explorer', 'regions10', 'Seen It All', 'Discover all 10 regions.', { t: 'regions', n: 10 }, 5);
    q('explorer', 'landmarks', 'Sightseer', 'Discover 4 landmarks.', M('landmarks', 4), 2);
    q('explorer', 'enterDungeon', 'Into the Dark', 'Enter any dungeon.', M('dungeonVisits', 1), 1);
    q('explorer', 'puzzles3', 'Puzzler', 'Solve 3 dungeon puzzles.', M('puzzles', 3), 3);
    for (const [id, name, d] of [['cellar', 'Kessler Root Cellar', 1], ['crypt', 'Saint Ansel Crypt', 2], ['mine', 'Pinebreak Mine Shaft', 3], ['pumps', 'Spillway Pump Station', 3], ['vault', 'Frostline Cold-Storage Vault', 4], ['furnace', 'Cinder Furnace Halls', 4], ['bunker', 'Sable Bunker K-7', 5], ['hive', 'The Hive Tunnels', 5], ['sublevel', 'Black Pine Sublevel B3', 5]]) {
        q('explorer', 'dgn_' + id, 'Clear: ' + name, 'Reach the end of ' + name + ' and open its chest.', M('dgn_clear_' + id, 1), d);
    }
    q('explorer', 'holdBarn', 'Hold the Barn', 'Stay within 25 m of the Old barn for 3 minutes without leaving.', { t: 'survive', loc: 'poi:barn', r: 25, secs: 180 }, 2);
    q('explorer', 'holdTown', 'Main Street', 'Spend 4 minutes inside Hollow Town without leaving it.', { t: 'survive', loc: 'region:hollow', r: 60, secs: 240 }, 3);
    q('explorer', 'holdDam', 'Hold the Dam', 'Stay within 30 m of the dam for 2 minutes.', { t: 'survive', loc: 'mk:dam', r: 30, secs: 120 }, 3);
    q('explorer', 'nightForest', 'Night in the Pines', 'Spend 2 minutes of night inside Pinebreak Forest.', { t: 'survive', loc: 'region:pine', r: 70, secs: 120, night: true }, 4);
    q('explorer', 'crater', 'Ground Zero', 'Survive 60 seconds inside the Crater.', { t: 'survive', loc: 'lantern', r: 70, secs: 60 }, 5);
    q('explorer', 'holdYards', 'Freight Yard Standoff', 'Stay inside the Kessel freight yards for 3 minutes.', { t: 'survive', loc: 'region:kessel', r: 55, secs: 180 }, 4);

    /* ---------------- Miner & Woodsman */
    q('miner', 'stone', 'Stonecutter', 'Have 40 stone.', HAVE('stone', 40), 1);
    q('miner', 'timber', 'Woodpile', 'Have 40 timber.', HAVE('timber', 40), 1);
    q('miner', 'iron', 'Iron Age', 'Have 20 iron ore.', HAVE('iron', 20), 2);
    q('miner', 'coal', 'Coal Scuttle', 'Have 15 coal.', HAVE('coal', 15), 2);
    q('miner', 'copper', 'Copper Wire', 'Have 15 copper ore.', HAVE('copper', 15), 2);
    q('miner', 'quartz', 'Glow Stones', 'Have 8 luminous quartz.', HAVE('quartz', 8), 3);
    q('miner', 'sand', 'Sandbox', 'Have 30 sand.', HAVE('sand', 30), 2);
    q('miner', 'sulfur', 'Brimstone', 'Mine 6 sulfur vents.', M('harvest_sulfur', 6), 3);
    q('miner', 'goldvein', 'Gold Rush', 'Mine 5 gold veins.', M('harvest_gold', 5), 4);
    q('miner', 'obsidian', 'Black Glass', 'Have 6 obsidian from the Crater.', HAVE('obsidian', 6), 5);
    q('miner', 'salt', 'Salt of the Earth', 'Have 10 rock salt.', HAVE('salt', 10), 2);
    q('miner', 'flint', 'Flintknapper', 'Collect flint from 6 gravel beds.', M('harvest_flintbed', 6), 1);
    q('miner', 'clay', 'Potter', 'Dig 5 clay banks.', M('harvest_clay', 5), 2);
    q('miner', 'ore30', 'Deep Miner', 'Mine 30 ore deposits.', M('oreHarvests', 30), 4);
    q('miner', 'trees10', 'Lumberjack', 'Fell 10 trees.', M('treesFelled', 10), 1);
    q('miner', 'trees50', 'Clear-Cutter', 'Fell 50 trees.', M('treesFelled', 50), 4);
    q('miner', 'quarry', 'Strip the Quarry', 'Mine 8 deposits within 70 m of the quarry mine head.', { t: 'mineArea', loc: 'mk:frost_mine', r: 70, n: 8 }, 4);
    q('miner', 'ashvents', 'Working the Ash', 'Mine 6 deposits inside the Cinder Refinery region.', { t: 'mineArea', loc: 'region:cinder', r: 80, n: 6 }, 4);
    q('miner', 'meadowStones', 'Clearing the Field', 'Gather 8 deposits within 60 m of the Kessler farmhouse.', { t: 'mineArea', loc: 'poi:farmhouse', r: 60, n: 8, any: true }, 2);
    q('miner', 'grove1', 'Clear the Grove', 'Fell every tree in the marked grove.', { t: 'grove', loc: 'grove:relay', r: 18 }, 2);
    q('miner', 'grove2', 'Pinebreak Stand', 'Fell every tree in a stand of Pinebreak Forest.', { t: 'grove', loc: 'grove:pine', r: 16 }, 3);
    q('miner', 'grove3', 'Highland Timber', 'Fell every tree in a Frostline grove.', { t: 'grove', loc: 'grove:frost', r: 16 }, 4);

    /* ---------------- Warrior (kill quests per infected type are added below) */
    q('warrior', 'kills50', 'Fifty', 'Kill 50 infected.', M('kills', 50), 2);
    q('warrior', 'kills250', 'Two Hundred and Fifty', 'Kill 250 infected.', M('kills', 250), 4);
    q('warrior', 'night30', 'Night Shift', 'Kill 30 infected at night.', M('nightKills', 30), 3);
    q('warrior', 'heads25', 'Headhunter', 'Land 25 headshot kills.', { t: 'stat', key: 'headshots', n: 25 }, 2);
    q('warrior', 'melee15', 'Up Close', 'Kill 15 infected with melee.', M('meleeKills', 15), 2);
    q('warrior', 'boom8', 'Demolition', 'Kill 8 infected with explosions or fire.', M('explosiveKills', 8), 3);
    q('warrior', 'champ5', 'Champion Slayer', 'Kill 5 champions.', { t: 'stat', key: 'champions', n: 5 }, 3);
    q('warrior', 'streak10', 'Rampage', 'Reach a 10-kill streak.', { t: 'streak', n: 10 }, 2);
    q('warrior', 'streak25', 'Zone Reaper', 'Reach a 25-kill streak.', { t: 'streak', n: 25 }, 4);
    q('warrior', 'pmc10', 'Sable Problem', 'Kill 10 PMC operators.', M('pmc', 10), 3);
    q('warrior', 'legendaryGun', 'Legendary', 'Hold a Legendary weapon.', { t: 'legendary' }, 4);

    /* ---------------- Legend */
    q('legend', 'arena1', 'First Blood', 'Win an arena duel.', M('arenaWins', 1), 3);
    q('legend', 'arena5', 'Crowd Favourite', 'Win 5 arena duels.', M('arenaWins', 5), 4);
    q('legend', 'arena10', 'Champion of the Pit', 'Beat all ten arena bosses.', { t: 'ladder', n: 10 }, 5);
    q('legend', 'dgnBoss', 'Deep Dweller', 'Defeat a dungeon boss.', M('dungeonBosses', 1), 4);
    q('legend', 'legend1', 'Legendary Hunt', 'Defeat any legendary boss.', M('legends', 1), 4);
    q('legend', 'legend6', 'Mythbreaker', 'Defeat 6 legendary bosses.', M('legends', 6), 5);
    for (const [id, name] of [['ravenous', 'The Ravenous'], ['lumberjack', 'The Lumberjack'], ['pyre', 'The Pyre Hound'], ['matriarch', 'The Grand Matriarch'], ['bride', 'The Night Bride'], ['plague', 'Dr. Plague'], ['colossus', 'The Iron Colossus'], ['apex', 'The Apex'], ['lycan', 'The Lycanthrope King'], ['ogre', 'The Ogre Emperor'], ['hydra', 'The Hydra of the Deep'], ['nyx', 'Overlord Nyx']]) {
        q('legend', 'slay_' + id, 'Slay ' + name, 'Meet ' + name + '\'s condition (see the Journal) and defeat it.', { t: 'legendDead', id }, 5);
    }

    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    class ZoneQuests {
        constructor() { this.active = []; this.done = new Set(); }
        get campaign() { return this.mode?.campaign; }
        get all() { return this.catalog || Q; }

        start(mode, saved) {
            this.mode = mode;
            this.buildKillQuests();
            this.done = new Set(saved?.done || []);
            this.active = (saved?.active || []).filter((a) => this.byId(a.id) && !this.done.has(a.id));
            this.clock = 1;
            this.lastPos = BO.Player.pos.clone();
            this.lastHurt = BO.ZoneThrill?.lastHurt ?? -99;
            this.places = saved?.places || {};
            this.fill();
        }

        stop() { this.mode = null; }
        snapshot() { return { done: [...this.done], active: this.active, places: this.places }; }
        byId(id) { return this.all.find((x) => x.id === id); }

        /** One "cull" quest for a spread of infected types across the roster, each unique. */
        buildKillQuests() {
            if (this.catalog) return;
            const roster = BO.ZombiesData.ORDERED_PROGRESSION.filter(Boolean);
            const picks = [0, 1, 2, 3, 5, 7, 9, 12, 15, 19, 24, 30, 36, 44, 52, 60, 69].filter((i) => roster[i]);
            const extra = picks.map((i, k) => {
                const z = roster[i];
                const n = Math.max(3, 15 - k);
                const day = Math.max(1, Math.ceil((i - 7) / 6) + 1);
                return { cat: 'warrior', id: 'cull_' + z.id, title: 'Cull: ' + z.name, text: 'Kill ' + n + ' ' + z.name + (day > 1 ? ' (they join the Zone around day ' + day + ').' : '.'), goal: M('kill_' + z.id, n), d: Math.min(5, 1 + Math.floor(k / 4)) };
            });
            this.catalog = [...Q, ...extra];
        }

        /* ------------------------------------------------------------ accepting */
        accept(id) {
            if (this.active.length >= 4 || this.done.has(id) || this.active.some((a) => a.id === id)) return false;
            const qd = this.byId(id);
            if (!qd) return false;
            const a = { id, base: this.baseFor(qd.goal), acc: 0 };
            const loc = this.resolve(qd);
            if (loc) a.loc = loc;
            if (qd.goal.t === 'grove') a.trees = this.groveTrees(loc, qd.goal.r);
            this.active.push(a);
            this.mode.toast('📜 Quest started: ' + qd.title + ' — ' + qd.text);
            return true;
        }

        drop(id) { this.active = this.active.filter((a) => a.id !== id); }

        /** Keep four quests going: easiest open ones first, chapters interleaved. */
        fill() {
            if (this.active.length >= 4) return;
            const open = this.all.filter((x) => !this.done.has(x.id) && !this.active.some((a) => a.id === x.id) && !this.blocked(x));
            open.sort((a, b) => a.d - b.d || CHAPTERS.findIndex((c) => c[0] === a.cat) - CHAPTERS.findIndex((c) => c[0] === b.cat));
            const cats = new Set(this.active.map((a) => this.byId(a.id)?.cat));
            for (const x of open) {
                if (this.active.length >= 4) break;
                if (cats.has(x.cat) && open.some((o) => !cats.has(o.cat) && o.d <= x.d)) continue;
                if (this.accept(x.id)) cats.add(x.cat);
            }
        }

        blocked(x) {
            const c = this.campaign;
            if (x.goal.t === 'build' || x.goal.t === 'buildAny') return false;
            if (/^hunt_|^hunted/.test(x.goal.key || '') && c?.has('sv_no_animals')) return true;
            if (x.cat === 'legend' && /arena|ladder/.test(x.id + x.goal.t) && c?.has('sv_no_npcs')) return true;
            return false;
        }

        baseFor(g) {
            const c = this.campaign;
            if (g.t === 'metric') return c.metrics[g.key] || 0;
            if (g.t === 'stat') return BO.ZoneThrill?.stats?.[g.key] || 0;
            if (g.t === 'flawless') return c.metrics.kills || 0;
            return 0;
        }

        /* ------------------------------------------------------------ locations */
        resolve(qd) {
            const g = qd.goal;
            if (!g.loc) return null;
            if (this.places[qd.id]) return this.places[qd.id];
            const Z = BO.Zone;
            let p = null;
            if (g.loc === 'tallest' || g.loc === 'lowest') p = this.extreme(g.loc === 'tallest');
            else if (g.loc === 'haven') p = { x: Z.HAVEN.x, z: Z.HAVEN.z };
            else if (g.loc === 'lantern') p = { x: Z.LANTERN.x, z: Z.LANTERN.z };
            else if (g.loc.startsWith('mk:')) { const mk = Z.markers.find((x) => x.id === g.loc.slice(3)); if (mk) p = { x: mk.x, z: mk.z }; }
            else if (g.loc.startsWith('poi:')) { const poi = Z.pois.find((x) => x.type === g.loc.slice(4)); if (poi) p = { x: poi.x, z: poi.z }; }
            else if (g.loc.startsWith('region:')) { const r = Z.REGIONS.find((x) => x.id === g.loc.slice(7)); if (r) p = { x: r.x, z: r.z }; }
            else if (g.loc.startsWith('corner:')) { const B = Z.BOUNDS; const k = g.loc.slice(7); p = { x: k.includes('w') ? B.minX + 14 : B.maxX - 14, z: k.includes('n') ? B.minZ + 14 : B.maxZ - 14 }; }
            else if (g.loc.startsWith('grove:')) p = this.findGrove(g.loc.slice(6), g.r);
            if (p) { p.label = qd.title; this.places[qd.id] = p; }
            return p;
        }

        extreme(high) {
            const Z = BO.Zone, B = Z.BOUNDS;
            let best = null;
            for (let x = B.minX + 8; x < B.maxX - 8; x += 4) for (let z = B.minZ + 8; z < B.maxZ - 8; z += 4) {
                const h = BO.World.terrainHeight(x, z);
                if (!high && Z.inReservoir(x, z)) continue;
                if (!best || (high ? h > best.y : h < best.y)) best = { x, z, y: h };
            }
            return best;
        }

        findGrove(region, r) {
            const trees = (BO.World.zone?.trees || []).filter((t) => t.alive && BO.Zone.regionAt(t.x, t.z).id === region);
            let best = null, bn = 0;
            for (let i = 0; i < trees.length; i += 3) {
                const t = trees[i];
                const n = trees.filter((o) => Math.hypot(o.x - t.x, o.z - t.z) < r).length;
                if (n > bn && n <= 18) { bn = n; best = { x: t.x, z: t.z }; }
            }
            return best;
        }

        groveTrees(loc, r) {
            if (!loc) return [];
            return (BO.World.zone?.trees || []).map((t, i) => [t, i]).filter(([t]) => t.alive && Math.hypot(t.x - loc.x, t.z - loc.z) < r).map(([, i]) => i);
        }

        /* ------------------------------------------------------------ progress */
        progress(a) {
            const qd = this.byId(a.id);
            const g = qd.goal;
            const c = this.campaign;
            const m = this.mode;
            switch (g.t) {
                case 'metric': return [Math.max(0, (c.metrics[g.key] || 0) - a.base), g.n];
                case 'stat': return [Math.max(0, (BO.ZoneThrill?.stats?.[g.key] || 0) - a.base), g.n];
                case 'have': return [Math.min(g.n, m.points[g.item] || 0), g.n];
                case 'build': return [c.placed.filter((p) => p.alive && p.type === g.type).length, g.n];
                case 'buildAny': return [c.placed.filter((p) => p.alive && (!g.types || g.types.includes(p.type))).length, g.n];
                case 'level': return [BO.ZoneThrill?.level || 1, g.n];
                case 'streak': return [Math.max(a.acc, BO.ZoneThrill?.streak || 0), g.n];
                case 'flawless': return [Math.max(0, (c.metrics.kills || 0) - a.base), g.n];
                case 'regions': return [c.visited.size, g.n];
                case 'legendary': return [BO.Player.weapons.some((w) => w.cfg?.rarity === 'legendary') ? 1 : 0, 1];
                case 'ladder': return [BO.ZoneLegends?.ladder || 0, g.n];
                case 'legendDead': return [BO.ZoneLegends?.state?.[g.id]?.s === 'dead' ? 1 : 0, 1];
                case 'reach': return [a.acc ? 1 : 0, 1];
                case 'survive': return [Math.floor(a.acc), g.secs];
                case 'mineArea': return [a.acc, g.n];
                case 'distance': return [Math.floor(a.acc), g.n];
                case 'grove': { const trees = BO.World.zone?.trees || []; const total = (a.trees || []).length || 1; return [(a.trees || []).filter((i) => !trees[i]?.alive).length, total]; }
            }
            return [0, 1];
        }

        update(dt) {
            const m = this.mode;
            if (!m || !m.active) return;
            const p = BO.Player;
            const c = this.campaign;
            const moved = Math.hypot(p.pos.x - this.lastPos.x, p.pos.z - this.lastPos.z);
            const step = moved < 25 ? moved : 0; // ignore teleports
            this.lastPos.copy(p.pos);
            const ore = (c.metrics.oreHarvests || 0), gath = (c.metrics.gatheredNodes || 0);
            const oreD = ore - (this._ore ?? ore), gathD = gath - (this._gath ?? gath);
            this._ore = ore; this._gath = gath;
            for (const a of this.active) {
                const qd = this.byId(a.id);
                const g = qd.goal;
                const inside = a.loc && Math.hypot(p.pos.x - a.loc.x, p.pos.z - a.loc.z) < g.r;
                if (g.t === 'reach' && inside && (!a.loc.y || p.pos.y > a.loc.y - 1.5)) a.acc = 1;
                if (g.t === 'survive') {
                    const ok = inside && p.alive && (!g.night || c.isNight);
                    if (ok) a.acc += dt;
                    else if (a.acc > 0 && !inside) { a.acc = 0; m.toast(qd.title + ': you left the area — the timer resets.'); }
                }
                if (g.t === 'mineArea' && inside) a.acc += g.any ? gathD : oreD;
                if (g.t === 'distance') {
                    const riding = !!c.vehicle, swimming = !!m.swimming;
                    if ((g.ride && riding) || (g.swim && swimming) || (g.foot && !riding && !swimming)) a.acc += step;
                }
                if (g.t === 'streak') a.acc = Math.max(a.acc, BO.ZoneThrill?.streak || 0);
                if (g.t === 'flawless' && (BO.ZoneThrill?.lastHurt ?? -99) !== this.lastHurt) a.base = c.metrics.kills || 0;
            }
            this.lastHurt = BO.ZoneThrill?.lastHurt ?? -99;
            this.clock -= dt;
            if (this.clock > 0) return;
            this.clock = 0.5;
            for (const a of [...this.active]) {
                const [cur, need] = this.progress(a);
                if (cur >= need) this.complete(a);
            }
        }

        complete(a) {
            const m = this.mode;
            const qd = this.byId(a.id);
            this.active = this.active.filter((x) => x !== a);
            this.done.add(a.id);
            this.campaign.mark('quests', 1, 0);
            const xp = 50 + qd.d * 45;
            BO.ZoneThrill?.xp(xp, 'Quest');
            const items = {};
            const pool = { survivor: ['medkits', 'bandage', 'canned'], hunter: ['leather', 'salt', 'cord'], chef: ['honey', 'berries', 'salt'], builder: ['planks', 'ingot', 'brick'],
                explorer: ['freshWater', 'battery', 'medkits'], miner: ['ingot', 'gold', 'coal'], warrior: ['ammo556', 'ammo9', 'gunkit'], legend: ['gold', 'relic', 'medkits'] }[qd.cat] || ['scrap'];
            for (let i = 0; i < Math.min(3, qd.d); i++) { const id = pool[i % pool.length]; items[id] = (items[id] || 0) + (id.startsWith('ammo') ? 20 : 1 + Math.floor(qd.d / 2)); }
            m.grant(items);
            if (qd.d >= 3) {
                const tier = Math.min(4, qd.d - 1);
                const wpool = BO.ZoneLoot.WEAPON_POOLS[tier];
                m.loot.offerWeapon(wpool[Math.floor(Math.random() * wpool.length)], tier, BO.Player.pos, { floor: qd.d >= 5 ? 3 : 2 });
            }
            if (qd.d >= 4 && BO.ZoneThrill) BO.ZoneThrill.rerolls++;
            BO.Events.emit('hud:banner', { title: 'QUEST COMPLETE', sub: qd.title.toUpperCase() + ' · +' + xp + ' XP', color: '#c8a2ff' });
            BO.Sound?.playMedal?.();
            setTimeout(() => this.mode && this.fill(), 4000);
        }

        /* ------------------------------------------------------------ outputs */
        points() {
            return this.active.filter((a) => a.loc).map((a) => ({ x: a.loc.x, z: a.loc.z, label: this.byId(a.id).title, kind: 'quest', area: this.byId(a.id).goal.r || 0 }));
        }

        hudHtml() {
            if (!this.active.length) return '';
            const p = BO.Player.pos;
            return '<header class="zt-qh">QUESTS</header>' + this.active.map((a) => {
                const qd = this.byId(a.id);
                const [cur, need] = this.progress(a);
                const d = a.loc ? Math.round(Math.hypot(a.loc.x - p.x, a.loc.z - p.z) / 5) * 5 : null;
                const label = qd.goal.t === 'survive' ? Math.floor(cur) + '/' + need + ' s' : qd.goal.t === 'distance' ? Math.floor(cur) + '/' + need + ' m' : cur + '/' + need;
                return `<div class="zt-k k-quest"><em>${CHAPTERS.find((c) => c[0] === qd.cat)?.[2] || '📜'}</em><b>${esc(qd.title)}</b><small>${label}${d !== null ? ' · ' + d + ' m' : ''}</small><i><u style="width:${Math.min(100, cur / need * 100).toFixed(0)}%"></u></i></div>`;
            }).join('');
        }

        journalHtml(tip) {
            const counts = `${this.done.size}/${this.all.length} complete · ${this.active.length}/4 tracked`;
            const rows = CHAPTERS.map(([id, name, ico]) => {
                const list = this.all.filter((x) => x.cat === id);
                return `<details class="zt-qcat" ${id === this.openCat ? 'open' : ''}><summary>${ico} ${esc(name)} <small>${list.filter((x) => this.done.has(x.id)).length}/${list.length}</small></summary>
                    ${list.map((x) => {
                        const act = this.active.find((a) => a.id === x.id);
                        const done = this.done.has(x.id);
                        const pr = act ? this.progress(act) : null;
                        return `<div class="zt-q ${done ? 'done' : act ? 'on' : ''}"${tip ? tip(x.title, x.text, 'Difficulty ' + '★'.repeat(x.d) + ' · +' + (50 + x.d * 45) + ' XP' + (x.d >= 3 ? ' + weapon' : '') + (x.d >= 4 ? ' + reroll' : '')) : ''}>
                            <b>${done ? '✓ ' : ''}${esc(x.title)}</b><small>${esc(x.text)}</small><em>${'★'.repeat(x.d)}</em>
                            ${done ? '<span>Done</span>' : act ? `<span>${pr[0]}/${pr[1]}</span><button class="sv-btn sm" data-act="questDrop" data-arg="${x.id}">Untrack</button>` : `<button class="sv-btn sm" data-act="questTrack" data-arg="${x.id}" ${this.active.length >= 4 ? 'disabled' : ''}>Track</button>`}</div>`;
                    }).join('')}</details>`;
            }).join('');
            return `<p class="sv-muted sm">${counts}. Track up to four; finished quests open the next automatically.</p>${rows}`;
        }
    }

    BO.ZoneQuests = new ZoneQuests();
    BO.ZoneQuests.CHAPTERS = CHAPTERS;
    BO.ZoneQuests.CATALOG = Q;
})(window.BO);
