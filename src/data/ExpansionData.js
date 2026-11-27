
/* Additional custom-game rules, class perks, soda recipes and powers. */
(function (BO) {
    'use strict';

    const classPerks = [
        [
            ['stride', 'Strider', 'Walk 12% faster.'],
            ['airfoil', 'Airfoil', 'Triple your steering response while airborne.'],
            ['rebound', 'Rebound', 'Jump 18% higher.'],
            ['sprinter_recovery', 'Second Gear', 'Recover tactical sprint stamina twice as quickly.'],
            ['slider', 'Rail Runner', 'Slides last 35% longer.'],
            ['light_mount', 'Light Mount', 'Halve the movement penalty of heavy weapons.'],
            ['mudskipper', 'Mudskipper', 'Ignore movement penalties from deep mud.'],
            ['runner_plates', 'Plate Runner', 'Apply armor plates 35% faster.'],
            ['high_step', 'High Step', 'Keep your footing for an extra 0.18s after leaving a ledge.'],
            ['reverse_gear', 'Reverse Gear', 'Move 20% faster when backing up.']
        ],
        [
            ['bore', 'Long Bore', 'Increase effective range by 25%.', { range: 1.25 }],
            ['shock_mount', 'Shock Mount', 'Reduce vertical and horizontal recoil by 28%.', { recoil: 0.72 }],
            ['focus_lens', 'Focus Lens', 'Reduce aimed dispersion by 28%.', { adsSpread: 0.72 }],
            ['speed_sight', 'Speed Sight', 'Reach full aim 25% faster.', { adsTime: 0.75 }],
            ['deep_pockets', 'Deep Pockets', 'Carry 40% more reserve ammunition.', { reserve: 1.4 }],
            ['twin_stack', 'Twin Stack', 'Increase magazine capacity by 25%.', { mag: 1.25 }],
            ['overclock', 'Overclock', 'Cycle your weapons 12% faster.', { rpm: 1.12 }],
            ['piercer', 'Piercer', 'Add one penetration to each firearm.', { penetration: 1 }],
            ['precision_tip', 'Precision Tip', 'Increase headshot damage multiplier by 20%.', { headMult: 1.2 }],
            ['wide_fuse', 'Wide Fuse', 'Weapon explosions have 20% more radius.', { radius: 1.2 }]
        ],
        [
            ['duelist', 'Duelist', 'Deal 25% more firearm damage within 6 m.'],
            ['skyline', 'Skyline', 'Deal 30% more firearm damage while airborne.'],
            ['ambusher', 'Ambusher', 'Crouched hits from 12 m or more deal 20% more damage.'],
            ['finishing_school', 'Finishing School', 'Body shots deal 25% more damage against foes below 30% HP.'],
            ['round_one', 'Cold Chamber', 'The first bullet fired from a full magazine deals 35% more damage.'],
            ['last_cartridge', 'Last Cartridge', 'The final bullet in a magazine deals 40% more damage.'],
            ['sidearm_specialist', 'Sidearm Specialist', 'Pistol damage increases by 22%.'],
            ['bayonet_drill', 'Bayonet Drill', 'Your quick melee reaches 1 m farther.'],
            ['bulwark', 'Bulwark', 'Take 22% less damage while crouched and stationary.'],
            ['hot_plate', 'Hot Plate', 'Close-range kills restore 15 points of existing armor capacity.']
        ]
    ];

    const sodas = [
        ['opening_bell', 'Opening Bell', 'Your first hit against each non-boss deals 45% extra damage.', 2200],
        ['giant_slayer', 'Giant Slayer', 'Your damage to bosses rises by 20% while you are over 15 m away.', 4200],
        ['crossfire', 'Crossfire Cola', 'Alternating impact zones on the same zombie deals 35% more damage.', 3100],
        ['relay', 'Relay Raspberry', 'Switching targets within 2 seconds boosts the next hit by 25%.', 3200],
        ['ground_level', 'Ground Level', 'Your shots deal 30% more damage to airborne zombies.', 2400],
        ['vault_breaker', 'Vault Breaker', 'Hit zombies for 75% more damage during an active window vault.', 2500],
        ['bare_knuckle', 'Bare Knuckle Brew', 'Quick melee returns 30% sooner.', 2350],
        ['trigger_freeze', 'Trigger Freeze', 'The first shot after 3 seconds without firing briefly stuns what it hits.', 3600],
        ['countdown', 'Countdown Cream', 'Every fifth hit on a zombie weakens its melee damage by 35% for 5 seconds.', 3500],
        ['hush_money', 'Hush Money', 'Earn 30 bonus points for each suppressed-weapon elimination.', 2650],
        ['clean_break', 'Clean Break', 'Earn 100 extra points for clearing a round without taking damage.', 2600],
        ['audit', 'Audit Ale', 'Every tenth personal elimination pays a 200-point commission.', 3000],
        ['scrap_stamp', 'Scrap Stamp', 'Supply crates from your kills contain 35% more supplies.', 2800],
        ['crate_keeper', 'Crate Keeper', 'Supply crates persist for an extra 25 seconds.', 2050],
        ['long_life', 'Long-Life Lemon', 'Power-up drops stay available 12 seconds longer.', 2200],
        ['long_reach', 'Long Reach', 'Collect power-ups from up to 3 m away on your floor.', 2450],
        ['repair_rate', 'Day Labor', 'Rebuilt window planks pay an extra 15 points each.', 2000],
        ['quick_board', 'Double Board', 'Rebuild up to two planks per interaction.', 2800],
        ['gate_share', 'Gate Share', 'Receive a 20% rebate when opening paid gates.', 2850],
        ['box_credit', 'Box Credit', 'Receive a 150-point rebate on paid Mystery Box rolls.', 2950],
        ['forge_credit', 'Forge Credit', 'Receive a 10% rebate on Pack-a-Punch upgrades.', 4200],
        ['builder_bond', 'Builder Bond', 'Receive a 15% supply rebate on fortifications.', 4000],
        ['trap_manager', 'Trap Manager', 'Paid traps refund one fifth of their activation price.', 2900],
        ['rail_pass', 'Rail Pass', 'Paid rides refund 30% of the fare.', 2150],
        ['night_guard', 'Night Guard', 'Take 20% less damage while fighting in an unpowered facility.', 2700],
        ['rear_guard', 'Rear Guard', 'Take 25% less damage from attackers behind you.', 3450],
        ['surge_guard', 'Surge Guard', 'The first damaging hit each round is reduced by 60%.', 3350],
        ['knife_change', 'Knife Change', 'Melee kills feed three rounds from reserve into your equipped gun.', 3050],
        ['rush_order', 'Rush Order', 'Manual reloads are 30% faster during exfil.', 3000],
        ['cargo_net', 'Cargo Net', 'Collect supply crates from 4 m away on your floor.', 2350]
    ].map(([id, name, desc, cost], i) => ({
        id, name, desc, cost, badge: String(i + 1).padStart(2, '0'),
        color: ['#5eead4', '#93c5fd', '#fda4af', '#fde68a', '#c4b5fd'][i % 5]
    }));

    const powers = [
        ['fire_ball', 'Fire Ball', 'A slow-moving fire sphere burns enemies along its path.', 60, 2400, '#fb923c'],
        ['thunder_bolt', 'Thunder Bolt', 'Call down lightning on the point you aim at.', 60, 2600, '#93c5fd'],
        ['holy_shield', 'Holy Shield', 'Gain 120 regenerating overshield for 30 seconds.', 300, 3200, '#fde68a'],
        ['spider_web', 'Spider Web', 'Mire a patch of floor. Enemies move at half speed inside and two-thirds speed for 30 seconds after leaving.', 40, 2100, '#e2e8f0'],
        ['icicle', 'Icicle', 'Launch a giant ice spear that damages and carries enemies until it stops.', 120, 3300, '#67e8f9'],
        ['mind_control', 'Mind Control', 'Turn the enemy you aim at into an ally for 20 seconds.', 100, 3000, '#c4b5fd'],
        ['earth_storm', 'Earth Storm', 'Raise 30 stones from the floor and launch them in a spreading volley.', 120, 3500, '#d6a77a']
    ].map(([id, name, desc, cooldown, cost, color]) => ({ id, name, desc, cooldown, cost, color }));

    const matchSwitches = [
        ['Armory', [
            ['noLethals', 'Disable lethal equipment'],
            ['noTacticals', 'Disable tactical equipment'],
            ['noMelee', 'Disable quick and weapon melee'],
            ['noField', 'Disable field upgrades'],
            ['noUltimates', 'Disable ultimates'],
            ['noClassPerks', 'Disable class perks'],
            ['reserveRefill', 'Endless reserve ammo'],
            ['oneInChamber', 'One-round magazines'],
            ['slowFire', 'Half-rate player weapons'],
            ['fastFire', 'Double-rate player weapons'],
            ['slowReload', 'Double player reload time'],
            ['noExplosiveDamage', 'Disable player explosive damage'],
            ['singlePrimary', 'Spawn with the primary slot only'],
            ['shotgunRange', 'Player bullets deal half damage beyond 18 m'],
            ['cleanMagazine', 'Replace half of the active magazine on elimination'],
            ['runnerArmor', 'Restore 15 armor when respawning']
        ]],
        ['Movement and health', [
            ['noSprint', 'Disable sprint'],
            ['noSlide', 'Disable sliding'],
            ['noJump', 'Disable jumping'],
            ['noAds', 'Hipfire only'],
            ['noHealthRegen', 'Disable player health regeneration'],
            ['regenOnElim', 'Heal to full on elimination'],
            ['lowProfile', 'Force crouch'],
            ['stickyFloor', 'Slow ground acceleration']
        ]],
        ['Bots and scoring', [
            ['noAllies', 'Solo team'],
            ['passiveBots', 'Disarm all bots'],
            ['slowBots', 'Half-speed bots'],
            ['quickBots', '1.5× bot move speed'],
            ['fragileBots', 'Bots spawn with half health'],
            ['toughBots', 'Bots spawn with double health'],
            ['attrition', 'Bots do not respawn'],
            ['headshotScore', 'Headshot kills award double team score'],
            ['endlessTime', 'Disable time limit'],
            ['noScoreLimit', 'Disable score limit except Gun Game'],
            ['noPowers', 'Disable the Superpower shop']
        ]]
    ];

    BO.ExpansionData = { classPerks, sodas, powers, matchSwitches };

    classPerks.forEach((entries, i) => {
        const color = ['#38bdf8', '#f43f5e', '#eab308'][i];
        for (const [id, name, desc, weaponMods] of entries) {
            BO.AttachmentsData.PERKS[id] = { id, tier: i + 1, name, desc, color, unlockLevel: 1, weaponMods };
        }
    });
})(window.BO);
