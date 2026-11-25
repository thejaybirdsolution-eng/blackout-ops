/* Rogue Lite roster requirements, collectible catalog, and permanent records. */
(function (BO) {
    'use strict';

    const D = BO.RPGData;
    const OPERATIVES = [
        { id: 'wayfarer', kit: 'vanguard', name: 'Wayfarer', icon: '✦', color: '#f1d090', hp: 128, weapon: 'acr_68', metric: 'extractions', goal: 3,
            role: 'Treasure runner', perk: 'Prospector', desc: 'Find 35% more gold and bring two extra pack slots.', fx: { goldFind: 35, packSlots: 2 } },
        { id: 'ashwright', kit: 'pyrotech', name: 'Ashwright', icon: '♨', color: '#fc9870', hp: 102, weapon: 'p90', metric: 'reactions', goal: 75,
            role: 'Reaction specialist', perk: 'Furnace Heart', desc: 'Deal 30% more reaction damage, with 18% longer status duration.', fx: { reactionDmg: 30, statusDur: 18 } },
        { id: 'oathkeeper', kit: 'vanguard', name: 'Oathkeeper', icon: '♜', color: '#d3bc83', hp: 156, weapon: 'scarh', metric: 'bossKills', goal: 3,
            role: 'Guardian breaker', perk: 'Oath of Iron', desc: 'Deal 32% more damage to elites and guardians.', fx: { eliteDmg: 32 } },
        { id: 'glasswing', kit: 'tempest', name: 'Glasswing', icon: '◇', color: '#a7e8fa', hp: 85, weapon: 'l96a1_awm', metric: 'speedWins', goal: 2,
            role: 'Precision sprinter', perk: 'Thin Air', desc: 'Headshots deal 42% more damage and cooldowns are 15% shorter.', fx: { headDmg: 42, cdr: 15 } },
        { id: 'glyphkeeper', kit: 'tempest', name: 'Glyphkeeper', icon: '⌘', color: '#c6b3ff', hp: 106, weapon: 'm16a4', metric: 'puzzles', goal: 3,
            role: 'Runic caster', perk: 'Inscription', desc: 'Ultimate charges 40% faster and abilities deal 15% more damage.', fx: { ultCharge: 40, abilityDmg: 15 } },
        { id: 'mirewarden', kit: 'vanguard', name: 'Mirewarden', icon: '❧', color: '#b2e0a3', hp: 136, weapon: 'rpd', metric: 'defenses', goal: 1,
            role: 'Area defender', perk: 'Rooted', desc: 'Take 14% less damage and lose 60% less Momentum when hit.', fx: { dmgReduce: 14, momentumKeep: 60 } },
        { id: 'copperjack', kit: 'pyrotech', name: 'Copperjack', icon: '⚒', color: '#eeb880', hp: 116, weapon: 'm249', metric: 'strikes', goal: 1,
            role: 'Flame gunner', perk: 'Hot Chamber', desc: 'Gun hits have a 20% chance to Burn and deal 12% more damage.', fx: { burnChance: 20, gunDmg: 12 } },
        { id: 'nightcourier', kit: 'tempest', name: 'Night Courier', icon: '☾', color: '#aab4ff', hp: 96, weapon: 'vector_kriss', metric: 'curseExtractions', goal: 1,
            role: 'Curse runner', perk: 'Last Light', desc: 'Carry one extra potion and charge Ultimate 25% faster.', fx: { potionsMax: 1, ultCharge: 25 } },
        { id: 'rosemedic', kit: 'pyrotech', name: 'Rose Medic', icon: '✚', color: '#f4acc4', hp: 119, weapon: 'ump45', metric: 'contracts', goal: 5,
            role: 'Sustain specialist', perk: 'Field Alchemy', desc: 'Potions heal 40% more and every kill restores 5 HP.', fx: { potionHeal: 40, killHeal: 5 } },
        { id: 'gildedhound', kit: 'vanguard', name: 'Gilded Hound', icon: '❖', color: '#f5db7e', hp: 124, weapon: 'ksg_slug', metric: 'legendariesBanked', goal: 5,
            role: 'Close-range collector', perk: 'Golden Bite', desc: 'Kills heal 4% of max HP and items drop more often.', fx: { killHealPct: 4, dropBonus: 0.45 } },
        { id: 'starcaller', kit: 'tempest', name: 'Starcaller', icon: '✵', color: '#8cddd2', hp: 101, weapon: 'mk14', metric: 'curios', goal: 4,
            role: 'Storm conductor', perk: 'Constellation', desc: 'Gun hits have an 18% chance to Shock and reactions deal 22% more damage.', fx: { shockChance: 18, reactionDmg: 22 } },
        { id: 'nullregent', kit: 'pyrotech', name: 'Null Regent', icon: '♛', color: '#dbc9ff', hp: 114, weapon: 'spas12_tac', metric: 'extractedFloor', goal: 30,
            role: 'Deep vault caster', perk: 'Fault Crown', desc: 'Deal 25% more ability damage and gain 20% more XP.', fx: { abilityDmg: 25, xpGain: 20 } }
    ];

    for (const character of OPERATIVES) {
        const kit = D.CLASSES[character.kit];
        D.CLASSES[character.id] = {
            ...kit, ...character, baseHp: character.hp, startWeapon: character.weapon,
            blurb: character.desc, passive: { name: character.perk, desc: character.desc + ' Also inherits ' + kit.name + '’s ' + kit.passive.name + '.' }
        };
        D.TALENTS[character.id] = D.TALENTS[character.kit];
        D.CLASS_ORDER.push(character.id);
    }

    const CATEGORIES = {
        crest: { name: 'Crests', effect: 'Changes the emblem on your operative card and delve HUD.' },
        frame: { name: 'Frames', effect: 'Changes the trim and pattern on Haven and delve panels.' },
        gate: { name: 'Gate auras', effect: 'Changes the trim and particle color around opened doors.' },
        trail: { name: 'Footstep trails', effect: 'Leaves colored sparks as you move through a delve.' },
        curio: { name: 'Vault curios', effect: 'A rare crest found only in a Mystery door’s Unlock room.' }
    };

    const THEMES = [
        ['amber', 'Amber', '#f1bc66', 'kills', 20, 30], ['fern', 'Fern', '#99db91', 'extractions', 1, 1],
        ['cinder', 'Cinder', '#f18765', 'reactions', 10, 20], ['frost', 'Frost', '#99d9ff', 'bossKills', 1, 1],
        ['indigo', 'Indigo', '#b5a7ff', 'contracts', 1, 1], ['pearl', 'Pearl', '#f2e8cf', 'puzzles', 1, 1],
        ['copper', 'Copper', '#df9669', 'speedWins', 1, 1], ['verdigris', 'Verdigris', '#76d5c4', 'defenses', 1, 1],
        ['rose', 'Rose', '#f4a0b6', 'strikes', 1, 1], ['midnight', 'Midnight', '#9baffc', 'curseExtractions', 1, 1],
        ['opal', 'Opal', '#e4c1f7', 'legendariesBanked', 1, 1], ['ivory', 'Ivory', '#f6d78a', 'extractedFloor', 5, 2]
    ];
    const SIGILS = [
        ['spark', 'Spark', '✦', 2], ['crown', 'Crown', '♛', 6], ['eye', 'Eye', '◉', 10],
        ['moon', 'Moon', '☾', 14], ['leaf', 'Leaf', '❧', 18], ['spire', 'Spire', '▲', 22]
    ];
    const catalog = [];
    for (const [slotIndex, slot] of ['crest', 'frame', 'gate', 'trail'].entries()) {
        for (const [theme, colorName, color, metric, initial, step] of THEMES) {
            for (const [sigil, sigilName, icon, pattern] of SIGILS) {
                catalog.push({
                    id: slot + '_' + theme + '_' + sigil, slot, color, icon, pattern, metric,
                    name: colorName + ' ' + sigilName, goal: initial + (slotIndex + (pattern - 2)) * step
                });
            }
        }
    }
    const curios = [
        ['Sunken Bell', '♧', '#83dfc9'], ['Gilded Key', '⚿', '#f2c470'], ['Glass Moth', '✶', '#cad8fb'],
        ['Thief’s Calling Card', '♠', '#ebadab'], ['White Raven', '❖', '#dfecfa'], ['Mercury Rose', '✿', '#f29fc6'],
        ['Salt Crown', '♕', '#f2e7c3'], ['Broken Hourglass', '⌛', '#e2b073'], ['Lantern Seed', '✺', '#8fd7a3'],
        ['Gutter Star', '✷', '#b8a2ef'], ['Bone Dice', '⚄', '#e3d6a6'], ['Empty Halo', '☉', '#c2bef8'],
        ['Furnace Pearl', '◉', '#fe967c'], ['Moon Coin', '☾', '#9cbdea'], ['Black Orchid', '✻', '#d5a4e0'],
        ['Last Compass', '⌖', '#82d9d5'], ['Hollow Chalice', '♜', '#dfa58e'], ['Ember Feather', '❧', '#f6af80']
    ].map(([name, icon, color], i) => ({ id: 'curio_' + (i + 1), slot: 'curio', name, icon, color }));
    catalog.push(...curios);

    const METRICS = {
        kills: ['Defeat', 'enemies'], extractions: ['Complete', 'extractions'], reactions: ['Trigger', 'elemental reactions'],
        bossKills: ['Defeat', 'guardians'], contracts: ['Bank', 'completed contracts'], puzzles: ['Solve', 'rune puzzles'],
        speedWins: ['Beat', 'speedrun timers'], defenses: ['Clear', 'defense rooms'], strikes: ['Roll', 'bowling strikes'],
        curseExtractions: ['Extract with a curse', 'times'], legendariesBanked: ['Bank', 'legendary items'],
        extractedFloor: ['Extract at floor', 'or deeper'], curios: ['Find', 'Vault curios']
    };
    const byId = Object.fromEntries(catalog.map((item) => [item.id, item]));

    BO.RPGUnlocks = {
        OPERATIVES, CATEGORIES, catalog, curios, byId,
        value(profile, metric) {
            if (metric === 'contracts') return Object.values(profile.contractCompletions).reduce((sum, count) => sum + count, 0);
            return profile.stats[metric] ?? profile.unlockRecords[metric] ?? 0;
        },
        requirement(item) {
            if (!item.metric) return 'Find in an Unlock room behind a Mystery door.';
            const [verb, target] = METRICS[item.metric];
            if (item.goal === 1 && item.metric === 'curseExtractions') return 'Extract while carrying a curse.';
            const singular = { enemies: 'enemy', 'legendary items': 'legendary item' };
            const noun = item.goal === 1 && target.endsWith('s') ? (singular[target] || target.slice(0, -1)) : target;
            return verb + ' ' + item.goal + ' ' + noun + '.';
        },
        unlocked(profile, item) {
            return item.metric ? this.value(profile, item.metric) >= item.goal : profile.curios.includes(item.id);
        },
        record(profile, metric, amount = 1) {
            profile.unlockRecords[metric] = (profile.unlockRecords[metric] || 0) + amount;
        },
        equipped(profile, slot) {
            return byId[profile.cosmetics[slot]] || null;
        }
    };
})(window.BO);
