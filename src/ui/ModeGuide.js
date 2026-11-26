/* Six plain-language field manuals, shared by the menu and the Survival terminal. */
(function (BO) {
    'use strict';

    const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const MODES = {
        zombies: { name: 'Zombies', intro: 'Turn a locked map into a stronghold and see how long you can last.', sections: [
            ['Start a match', 'Pick a map, difficulty and starting kit in the lobby. You can play solo or host a room and invite friends. Each new round starts after you clear the current one.'],
            ['Earn and spend points', 'Hits and kills earn points. Buy doors to open routes, grab wall weapons or use the Mystery Box for a random gun. Save some points for a way out before spending everything on weapons.'],
            ['Power, perks and upgrades', 'Find and flip the power switch to bring machines online. Buy perks for lasting benefits. Pack-a-Punch upgrades a weapon in three tiers. The machine shows the price of the next tier.'],
            ['Survive a crowd', 'Keep moving around a route with two exits. Use reload time between fights, watch doorways, and avoid letting the pack split you from your team. Aim at heads when it is safe to stop and shoot.'],
            ['Special enemies, bosses and weak points', 'Enemy silhouettes tell you whether to expect speed, armor, projectiles or an explosion. Special bosses have their own attacks. For a huge boss, look for exposed weak points and move out of marked attacks.'],
            ['Equipment and teammates', 'Lethal and tactical equipment serve different jobs. Place defenses to slow a wave, use power-ups when they drop, and interact near a downed teammate to revive them when the area is safe.'],
            ['Custom games', 'Zombie Customizer changes the enemy pool, spawn weights, stats, and starting round where available. Save modifier presets in the lobby to reuse the same rules.'],
            ['Enemy and guardian reference', 'Open the enemy roster below to look up individual enemies. The encounter and lobby tooltips show further details where those enemies are used.']
        ] },
        mp: { name: 'Multiplayer', intro: 'Play a bot match offline or host an arena for friends.', sections: [
            ['Start a match', 'Pick a map, game type, bot difficulty and rules. A solo match uses bots. Use Play with Friends to host a lobby, then share its invite link. Let your friends enter before deploying.'],
            ['Team Deathmatch', 'Eliminations score for your team. The default target is 50. Work together to watch more than one route and avoid spawning into the same fight one at a time.'],
            ['Free-for-All', 'Everyone is an opponent. The default target is 30 eliminations. Watch for players arriving late to a fight that you just finished.'],
            ['Domination', 'Stand near a flag to capture it. Holding flags earns points over time. Keep two of the three flags to win steadily. The default score target is 150.'],
            ['Hardpoint', 'Stand in the active area to score. The area moves during the match. Get to the next location early and use teammates to cover entrances. The default score target is 150.'],
            ['Gun Game', 'Each weapon elimination advances you to the next weapon in the ladder. Finish the ladder to win. Your normal custom class is replaced by the current ladder weapon.'],
            ['Classes, movement and rules', 'Create a Class sets weapons, attachments, perks, equipment and powers. Sprint, slide, mantle and vault to move between cover. Custom rules change bots, score, time, weapons and modifiers.'],
            ['Online troubleshooting', 'Host and guests should use the same site version. If a peer cannot connect, remake the lobby and share a fresh link. Bot play works without an online lobby.']
        ] },
        survival: { name: 'Survival', intro: 'Gather supplies, make a defensible shelter and stay alive through tougher days.', sections: [
            ['Deploy and choose an operation', 'The briefing shows the objective, difficulty, changes to the world and a threat forecast. Start with a suggested preset if you are new. Resume from the briefing to recover a saved expedition.'],
            ['The first day', 'Gather branches, stones and fiber by hand. Make basic tools before trying tougher deposits. Use daylight to find food, water and a sheltered place to prepare for the first night.'],
            ['Inventory, hotbar and crafting', 'Put weapons, food and tools in any of the ten hotbar slots. An empty slot lets you use your hands. In Crafting, a recipe tells you what it costs and whether it needs a workbench, campfire or kiln nearby.'],
            ['Read your meters', 'Eat and drink before they are empty. Shelter, clothing and heat help with temperature. Pay attention to radiation, injuries and noise. If a meter is hidden, it reappears when it needs attention.'],
            ['Build a base', 'Place foundations, walls, doors and roofs through Build. Repair damage after nights, then add storage, crafting areas and rooms with a purpose. Farm with suitable plots and water. Livestock need a secure pen and ongoing care.'],
            ['Get around and save', 'Use the map to mark sites, see routes and plan travel. Discover and activate fast-travel points before trying to use them. Checkpoints save expedition state. Leave from a safe area when possible and read any save warning before quitting.'],
            ['Progression, journals and research', 'Improve skills through play and invest your points in specialties. The Journal tracks tasks. Research and recipes tell you what station or material is missing. The Field Catalogue records discoveries and milestones.'],
            ['World events and bosses', 'More dangerous infected arrive as days pass. Nights and Blood Moons raise the pressure. Raid sites and dungeons for rare loot, help defend allied positions, and prepare food, ammo and an exit route before engaging a boss.'],
            ['People, companions and transport', 'Trade or accept work where NPCs are present. Use companions where the encounter allows them. Vehicles extend your reach but need resources and care. Signs, towers and waystones can reduce repeat travel.'],
            ['Advanced setup', 'The briefing can change survival rules, enemy rosters, difficulty and modifiers, or enable optional developer settings. Read the summary before deploying, because aggressive options change how the first day plays.']
        ] },
        rpg: { name: 'Rogue Lite', intro: 'Clear a floor, choose a door, then decide when to extract with the loot you found.', sections: [
            ['Start and choose an operative', 'At the Haven, pick one of three starting operatives. Each keeps a separate level, talents and equipped gear. The Roster lists twelve additional operatives and the exact task that unlocks each.'],
            ['Fight with elemental combos', 'A Primer applies Burn, Chill, Shock or Expose. A Detonator consumes every status on the target, so a target with two statuses causes two reactions. Damage charges your Ultimate. Use a potion while you still have time to recover.'],
            ['Learn the four reactions', 'Burn leads to Combust, which damages nearby enemies. Chill leads to Shatter, which hits hard and freezes the target. Shock leads to Overload, which arcs to nearby enemies. Expose leads to Rupture, which breaks armor.'],
            ['Choose doors and read the arena', 'The door sign explains the next floor, apart from Mystery doors. The arena label shows the layout and dimensions. Scouts, rushed packs, heavy columns and ranged patrols put pressure on different parts of the map. Bright hazard rings warn you to step away.'],
            ['Speedrun, Puzzle and Shop', 'Clear Speedrun before the timer ends for twice the floor-clear XP and gold bonus. At Rune Puzzle, memorize the symbols and enter them in order. In a Traveling Shop, spend unbanked gold to heal, refill or buy gear.'],
            ['Door types', 'Every door has a room sign and a door type. A Vault Door is ordinary. A Gilded Door costs gold but doubles the gold on the next floor. A Blood Door costs 15% of your max HP for 75% more XP. A Fractured Door makes enemies tougher but pays 50% more. A Veiled Door hides its room for a 30% bonus. An Hourglass Door seals 25 seconds after the floor is cleared. A Clover Door refills a potion. A Reliquary Door costs scrap and leads to a treasure chest. At least one door is always free and never seals.'],
            ['Mystery doors', 'A Mystery door can lead to a normal floor or an exclusive room. A thief takes half the gold you carry. A curse increases incoming damage, and a blessing offers healing and a Boon. Unlock rooms are the only source of Vault curios.'],
            ['Bowling, defense and mini-bosses', 'Use Aim and Power in the bowling room. You have two rolls to clear the pins and must clear them on the first for a strike. For defense, activate the altar and stay inside the circle for two uninterrupted minutes. A mini-boss can call reinforcements at half health.'],
            ['Extract, suspend or die', 'A Rest room or defeated guardian can have an Extraction Beacon. Extraction banks loot, gold, scrap and completed contract rewards. Death keeps XP and equipped gear but loses the unbanked haul unless insurance pays some gold back. Suspending saves your floor-start state.'],
            ['Loot, Boons and gear sets', 'Pick up gear and use the pack to compare it. A Boon lasts only for the current delve. Equip two or three pieces of the same legendary set to gain bonuses. Upgrade gear at the Haven Forge and buy more stash space with Vault Racks.'],
            ['Contracts and the Collection', 'Pick a contract before you leave and extract after finishing its objective to receive the payout. Use Collection to see progress and equip crests, frames, gate auras and footstep trails. A curio can also be equipped as a crest.'],
            ['Guardians and checkpoints', 'A guardian appears every fifth floor. Defeat it to open a later starting checkpoint. Checkpoints let you skip early floors, but you begin a fresh delve without previous Boons or unbanked loot.']
        ] },
        owrpg: { name: 'Open World RPG', intro: 'Operation Meridian: build a character, take sides and find out what is calling from the crater.', sections: [
            ['Create an operative', 'Pick a callsign, spend 8 points across five attributes (Brawn, Reflex, Tech, Perception, Presence), choose a starting Primer and a difficulty. You have three save slots.'],
            ['Navigate by landmarks', 'There are no quest arrows. Six skyline landmarks (35–58 m) mark the regions: Mast Alpha, the Goliath Crane, the Cooling Stack, the Excavator, the Dish Array and the Meridian Dome. Smoke columns often mean a camp. Open the map [M] to place compass pins; you can turn on a tracked-quest marker there.'],
            ['Talk, and pass checks', 'Dialogue options marked with an attribute, reputation or item need that value. Checks are fixed thresholds, not dice rolls, so reloading never changes them. Locked options show what they need.'],
            ['Every quest has three ways through', 'Main and faction quests can be solved by force, by tech or stealth, or by talking to the right person. Quests also react if you solve them before you are asked.'],
            ['Stealth and noise', 'The eye at the top of the screen shows how aware enemies are. Crouch to slow detection and quiet your steps; sprinting and unsuppressed gunfire carry far. Attacks with melee or suppressed weapons on unaware targets deal sneak-attack damage.'],
            ['Primers and Detonators', 'Q fires your Primer (Burn, Chill, Shock or Expose). F fires your Detonator, which consumes statuses for reactions: Combust, Shatter, Overload and Rupture. X uses your gadget and H a Med-Injector. Health regenerates to 60% only out of combat.'],
            ['Factions', 'Militia, Syndicate, Aegis and Helix track reputation from Hated to Sworn. Helping one costs you half as much with its rival. Hated factions shoot on sight; Shunned ones warn you first. Being caught stealing turns a faction hostile.'],
            ['Levels and perks', 'Quests and discoveries pay most of the XP. Every even level gives a perk point and every odd level from 3 gives an attribute point. Each perk tier is a choice between two perks; Medic Ines can retrain you for credits.'],
            ['Weight and travel', 'Carrying more than your limit slows your sprint and makes you louder; over 130% you cannot dodge. Wake Transit Pylons by touching them, then jump between them for one Relay Cell each.'],
            ['Saving', 'F5 quick-saves when you are out of combat and on the ground, F9 reloads. The game also saves when you discover places, finish quests, use pylons and enter or leave interiors.']
        ] },
        td: { name: 'Tower Defense', intro: 'Keep the castle heart alive while enemy waves break through the walls.', sections: [
            ['Start a siege', 'Pick a castle, set the waves and modifiers, and deploy. Play solo or invite human teammates from an online lobby.'],
            ['What you protect', 'Defensive wall layers slow attackers before they reach the castle heart. Shoot through the wall from a safe position. When a layer breaks, fall back and cover the next approach. The match ends when the heart is destroyed.'],
            ['Earn gold between waves', 'Defeating enemies earns gold. Spend it at the shopkeeper during the short intermission. The shop shows the price and effect before you buy. Save enough for the approach that is failing.'],
            ['Turrets, allies and towers', 'Use sentry turrets where they can see an approach for a long time. Dogs and marines add support. Sniper towers let you see farther, but a teammate on the ground can react faster to enemies at the heart.'],
            ['Weapons and armor', 'Use the shop and eligible stations to buy or upgrade weapons and gear. The Gunsmith station handles attachments. A custom loadout at the armory costs gold. Keep ammo and a close-range option ready before the intermission ends.'],
            ['Split jobs in co-op', 'Watch different paths, call out damage to the heart, and protect whoever is shopping or reviving. Save powerful equipment for a breach rather than spending it all on early enemies.'],
            ['Wave and enemy settings', 'The Zombie Customizer changes which enemies can spawn, their weights and eligible starting settings. You can save a preset and reuse it with a different castle.']
        ] },
        minigames: { name: 'Minigames', intro: '63 solo challenges across 5 categories: Fun & Specials, Target & Action, Speed Runs, Arcade Hall, and Boss Rush.', sections: [
            ['Pick a challenge & read its Start Menu Guide', 'Every minigame in the hub displays a dedicated How To Play Guide right in its detail panel (and via the Start Menu Guide button) covering objectives, controls, win conditions, and pro tips.'],
            ['Fun & Specials (22 Modes)', 'Blockbuster genres including Angry Birds Slingshot, Master Zombie Fortress Siege, 5-Minute Downhill Snowboarding, Mid-Air 360 Trick Shots, FPS Mario 1-1 to 1-4 + 3-Form Bowser, ATB Final Fantasy Story RPG, Bunker Inspection, Prop Hunt, Kaiju Rampage, Mech Titan, Chess FPS, Gladiator Colosseum, and more.'],
            ['Target & Action (16 Courses)', 'Practice on fixed-pattern courses, watch a first-person Beat Drop example, or try Whack-a-Mole, Sweetheart Shore and Mansion Raid.'],
            ['Speed Runs (9 Timed Runs)', 'Race through timed challenges including Getaway Chase, Deagle Meteor Splitter, Ninja Stealth and Three-Headed Dragon.'],
            ['Arcade Hall (15 Games) & Boss Rush', 'Try Quickdraw Duels, Ball Brawl and Switchyard in Arcade Hall, or face every boss in Boss Rush with three heals.'],
            ['Scoring and stars', 'Chain hits to build a streak multiplier. Bronze, Silver, Gold and Platinum stars track your best score or fastest time. Reserve ammo is unlimited unless a mode rules otherwise.']
        ] }
    };

    function dynamic(mode) {
        if (mode === 'rpg') {
            const D = BO.RPGData;
            return [
                ['Door reference', Object.values(D.ROOMS).map((room) =>
                    room.name + (room.secret ? ' (Mystery only)' : '') + ' — ' + room.desc)],
                ['Enemy weaknesses', Object.values(D.ENEMIES).map((enemy) =>
                    enemy.name + ' — ' + enemy.desc + (enemy.weak ? ' Weak to ' + D.REACTIONS[D.STATUSES[enemy.weak].reaction].name.toLowerCase() + '.' : ''))],
                ['Regions and guardians', D.BIOMES.map(({ name, floors }) => name + ' — floors ' + floors[0] +
                    (Number.isFinite(floors[1]) ? '–' + floors[1] : ' and deeper')).concat(D.BOSSES.map((boss, i) => 'Floor ' + (i + 1) * 5 + ' — ' + boss.name))],
                ['Gear set bonuses', Object.values(D.SETS).map((set) => set.name + ' — ' + set.bonuses.map((b) => b.pieces + ' pieces: ' + b.desc).join(' '))],
                ['Operative unlock requirements', BO.RPGUnlocks.OPERATIVES.map((op) => op.name + ' — ' + BO.RPGUnlocks.requirement(op))],
                ['Boon reference', D.BOONS.map((boon) => boon.name + ' — ' + boon.desc)]
            ];
        }
        if (mode === 'survival') return (BO.GMGuide?.() || []).map((topic) => [
            topic.title, [topic.text, ...topic.facts.map(([label, value]) => label + ' — ' + value),
                ...topic.lists.flatMap((list) => list.items.map((item) => list.h + ': ' + item))]
        ]);
        if (mode === 'zombies') return [['Enemy roster', (BO.ZombiesData.ORDERED_PROGRESSION || []).map((id) => {
            const entry = typeof id === 'string' ? BO.ZombiesData.get(id) : id;
            return entry?.name || '';
        }).filter(Boolean).join(' · ')]];
        return [];
    }

    function controls(mode) {
        if (mode === 'minigames') return ['Movement and aiming follow your normal controls. Challenge-specific prompts show the current heal, skip or retry key.'];
        const bindings = BO.Settings.getKeybinds();
        return BO.Settings.controlCatalog.flatMap((group) => group.actions)
            .filter((action) => action.ctx.includes(mode))
            .map((action) => BO.Settings.keyLabel(bindings[action.action]) + ' — ' + action.label);
    }

    BO.ModeGuide = {
        MODES,
        render(mode, query = '') {
            const pick = MODES[mode] || MODES.zombies;
            const sections = [...pick.sections, ['Controls in this mode', controls(mode)], ...dynamic(mode)];
            const term = query.trim().toLowerCase();
            const matches = sections.filter(([title, body]) => (title + ' ' + body).toLowerCase().includes(term));
            return `<div class="mode-guide-intro"><h3>${pick.name}</h3><p>${esc(pick.intro)}</p></div>` + (matches.length ? matches.map(([title, body], index) => `
                <details class="mode-guide-section" ${term || index === 0 ? 'open' : ''}>
                    <summary>${esc(title)}</summary>
                    ${Array.isArray(body) ? `<ul>${body.filter((line) => !term || title.toLowerCase().includes(term) || line.toLowerCase().includes(term)).map((line) => `<li>${esc(line)}</li>`).join('')}</ul>` : `<p>${esc(body)}</p>`}
                </details>`).join('') : '<p class="mode-guide-empty">No matching topics in this mode. Try a shorter word or another tab.</p>');
        }
    };
})(window.BO);
