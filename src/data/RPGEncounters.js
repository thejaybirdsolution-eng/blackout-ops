/* Extra gates and the rooms that can only be reached through Mystery. */
(function (BO) {
    'use strict';

    const R = BO.RPGData.ROOMS;
    Object.assign(R, {
        shop: { id: 'shop', name: 'Traveling Shop', icon: '⚖', color: '#f2cb81', desc: 'Spend unbanked gold on potions, supplies, or gear.', weight: 9, minFloor: 2, quiet: true },
        puzzle: { id: 'puzzle', name: 'Rune Puzzle', icon: '⌘', color: '#b5a1ff', desc: 'Repeat the rune sequence for gold and a rare item.', weight: 10, minFloor: 2, quiet: true },
        speedrun: { id: 'speedrun', name: 'Speedrun', icon: '◴', color: '#ffd2a1', desc: 'Clear the floor before time runs out to double its clear bonus.', weight: 12, minFloor: 3 },
        hunt: { id: 'hunt', name: 'Bounty Hunt', icon: '⌖', color: '#f6a4ba', desc: 'A high-value elite flees with its guards. Defeat the pack for a bounty.', weight: 8, minFloor: 4 },
        crossfire: { id: 'crossfire', name: 'Crossfire', icon: '⟐', color: '#7edbff', desc: 'Two ranged patrols fire from opposite flanks. Break line of sight.', weight: 8, minFloor: 6 },
        sanctuary: { id: 'sanctuary', name: 'Sanctuary', icon: '☼', color: '#abeab0', desc: 'A field altar heals you or refills one potion, then you move on.', weight: 6, minFloor: 3, quiet: true },
        mystery: { id: 'mystery', name: 'Mystery', icon: '?', color: '#dfb7fa', desc: 'Any regular room or an encounter found only behind Mystery.', weight: 18, minFloor: 2, quiet: true },
        thief: { id: 'thief', name: 'The Thief', icon: '♠', color: '#f6a3a7', desc: 'A pickpocket takes half your unbanked gold.', secret: true, quiet: true },
        curse: { id: 'curse', name: 'Cursed Reliquary', icon: '☾', color: '#f1a1ca', desc: 'Gain a curse for the rest of the delve. Survive it to unlock rewards.', secret: true, quiet: true },
        blessing: { id: 'blessing', name: 'Blessing', icon: '✵', color: '#f8df94', desc: 'A spirit grants healing and a choice of free Boons.', secret: true, quiet: true },
        unlock: { id: 'unlock', name: 'Unlock Room', icon: '⚿', color: '#b5f3d3', desc: 'Discover a permanent curio available only here.', secret: true, quiet: true },
        bowling: { id: 'bowling', name: 'Vault Bowling', icon: '●', color: '#8ae4e2', desc: 'Knock down ten pins with up to two rolls. A strike unlocks Copperjack.', secret: true, quiet: true },
        miniboss: { id: 'miniboss', name: 'Mini-Boss', icon: '♞', color: '#fba496', desc: 'A champion and escalating reinforcements guard a prize.', secret: true },
        defend: { id: 'defend', name: 'Defend the Area', icon: '◎', color: '#80d9d0', desc: 'Stay inside the circle for two continuous minutes while enemies spawn.', secret: true },
        wager: { id: 'wager', name: 'Coin Wager', icon: '⚄', color: '#f1cc74', desc: 'Risk a small amount of unbanked gold for a chance to double it.', secret: true, quiet: true },
        fountain: { id: 'fountain', name: 'Fountain of Exchange', icon: '♒', color: '#8ddcff', desc: 'Trade a potion for gold or pay gold for a full heal.', secret: true, quiet: true },
        forge_room: { id: 'forge_room', name: 'Field Forge', icon: '⚒', color: '#fdab7c', desc: 'Spend unbanked scrap to raise the level of one packed item.', secret: true, quiet: true },
        relay_room: { id: 'relay_room', name: 'Charge Relay', icon: 'ϟ', color: '#8cf4ec', desc: 'Restore your Ultimate and reset ability cooldowns.', secret: true, quiet: true },
        mimic: { id: 'mimic', name: 'Mimic Vault', icon: '▣', color: '#f5d492', desc: 'An inviting chest turns into an elite ambush.', secret: true },
        darkroom: { id: 'darkroom', name: 'Blackout', icon: '◐', color: '#c6b3ea', desc: 'Fight fast attackers in a vault with its lights down.', secret: true },
        storm: { id: 'storm', name: 'Aether Storm', icon: '✧', color: '#e5abff', desc: 'Fast arc bursts sweep the floor. Win an Epic or better item.',
            secret: true, hazard: { name: 'Aether burst', radius: 3.4, period: 4.6, warning: 1.2, damage: 0.15, count: 7 } }
    });

    const ENCOUNTERS = [
        { name: 'Infiltration', formation: 'camps', factor: 0.90 },
        { name: 'Pincer', formation: 'flanks', factor: 0.96, speed: 1.08 },
        { name: 'Siege Line', formation: 'ranged', factor: 0.90, damage: 1.12 },
        { name: 'Rush', formation: 'rush', factor: 1.08, speed: 1.13 },
        { name: 'Heavy Column', formation: 'tanks', factor: 0.77, hp: 1.22 },
        { name: 'Hollow Guard', formation: 'mixed', factor: 0.94, hp: 1.10 },
        { name: 'Holding Action', formation: 'camps', factor: 1.12 },
        { name: 'Breakout', formation: 'flanks', factor: 1.02, damage: 1.07 },
        { name: 'Skirmish', formation: 'ranged', factor: 0.95, speed: 1.04 },
        { name: 'Stalkers', formation: 'rush', factor: 0.92, speed: 1.18 },
        { name: 'Iron Detail', formation: 'tanks', factor: 0.81, hp: 1.30 },
        { name: 'Long Patrol', formation: 'mixed', factor: 1.03 }
    ];
    BO.RPGEncounters = ENCOUNTERS;

    BO.RPGMysteryRoom = (floor, seed) => {
        const entries = Object.values(R).filter((room) => room.id !== 'mystery' && room.id !== 'boss' && (room.secret || (room.minFloor || 1) <= floor));
        const secret = entries.filter((room) => room.secret);
        const ordinary = entries.filter((room) => !room.secret);
        const favored = secret.filter((room) => ['unlock', 'bowling', 'defend', 'curse'].includes(room.id));
        const pool = [...ordinary, ...secret, ...secret, ...favored];
        return pool[(Math.floor(seed / 13) + floor * 37) % pool.length].id;
    };
})(window.BO);
