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
            ['Infection', 'One knife-wielding infected bot starts the outbreak. If an infected kills you, respawn with a knife on the infected side. Survivors win by reaching the time limit.'],
            ['Search and Destroy', 'One life per round. Follow the site marker and interact to plant or defuse. The teams switch roles each round.'],
            ['Four Teams and Hardcore', 'Four Teams is a 4v4v4v4 kill race. Both Hardcore variants start you with 30 health and remove normal health regeneration.'],
            ['King of the Hill Bounty', 'Eliminate the current holder to take the bounty. While you hold it, your health max doubles and your weapon never needs reloading. The longest total time as holder wins.'],
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
        rpg: { name: 'Rogue Lite', intro: 'Clear a floor, collect Isaac-style relics and orbitals, choose a door, and extract with your haul.', sections: [
            ['Start and choose an operative', 'At the Haven, pick one of three starting operatives. Each keeps a separate level, talents and equipped gear. The Roster lists twelve additional operatives and the exact task that unlocks each.'],
            ['Relics, Charged Actives, Pills & Tarot', 'Discover 40 passive shot-modifying artifacts (multishot, homing, bouncing, chain lightning, explosive shots, Brimstone beams) and 3D orbitals in Treasure, Shop, Devil, and Angel pedestals. Activate Charged Relics with [G], pop Mystery Pills or Tarot Cards with [T], and plant Bombs with [B] to crack Tinted Rocks and Golden Reliquaries. Collecting 3 matching artifacts triggers powerful character transformations.'],
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
        owrpg: { name: 'Open World RPG', intro: 'Operation Meridian: a 1280 m frontier of twelve regions. Start at level 1, grind your way up, map the land and hunt its Champions.', sections: [
            ['Create an operative', 'Pick a callsign, spend 8 points across five attributes (Brawn, Reflex, Tech, Perception, Presence), choose a starting Primer and a difficulty, and decide whether to start with the compass and minimap on. You have three save slots and every operative begins at level 1.'],
            ['Navigate: minimap, map, Atlas & Mounts', 'The rotating minimap (top left) shows terrain, settlements, dungeons, pylons, tracked quest markers, events, pins and enemies hunting you; press N to cycle its range or turn it back on. The land starts under fog and clears as you walk it. The Pip-Pad Map shows the whole Expanse with every region\'s charted percentage, and the Atlas tab tracks your completion. Summon one of 4 Mounts [T] to cross the Expanse fast, and wake Transit Pylons to fast-travel.'],
            ['Hidden sites', '156 sites are hidden across the regions: treasure caches, lore tomes, wayside shrines (five-minute blessings, reusable every ten minutes), skill shards (Mastery XP), survey vistas (chart a wide area at once), hidden stashes and Altars of Trials that summon a Champion. Each kind starts its own exploration quest the first time you find one.'],
            ['Champions & respawns', 'Any hostile can spawn as a Champion with an aura and 1–3 affixes such as Vampiric, Shielded, Arcane or Summoner; read the line under its health bar. Champions drop sigils and better loot. Enemies respawn ten minutes after they die, when you leave an area, and when you reload a save.'],
            ['Quest tracking', 'Track up to three quests from the Quests tab. They appear on the HUD with live distances, as bearings on the compass and as markers on the minimap.'],
            ['World Events & bounties', 'Twenty-one regional events (hold, wave, hunt and Champion-led) appear near you while you explore. Bounty Board contracts live in the Pip-Pad.'],
            ['RPG Gun Stats, Armor Sets & Durability', 'Every weapon carries Meridian-only RPG stats (Crit %, Armor Pen, Passive Trait, Elemental Damage) visible in your Pip-Pad Inventory without altering arcade modes. Equip multi-slot Helmets, Rigs, Boots & Relics to activate 2-piece and 3-piece Armor Set bonuses. Weapons & armor gradually wear down during fights; repair them with Field Repair Kits [G] or the Pip-Pad Workbench.'],
            ['Talk, and pass checks', 'Dialogue options marked with an attribute, reputation or item need that value. Checks are fixed thresholds, not dice rolls, so reloading never changes them. Locked options show what they need.'],
            ['Every quest has three ways through', 'Main and faction quests can be solved by force, by tech or stealth, or by talking to the right person. Quests also react if you solve them before you are asked.'],
            ['Stealth and noise', 'The eye at the top of the screen shows how aware enemies are. Crouch to slow detection and quiet your steps; sprinting and unsuppressed gunfire carry far. Attacks with melee or suppressed weapons on unaware targets deal sneak-attack damage.'],
            ['5-Element Primers, Detonators & Ultimates', 'Q fires your Primer (Burn, Chill, Shock, Venom, Void, or Expose). F fires your Detonator to trigger chain reactions. X uses your Gadget, U unleashes unlockable Ultimates, and H injects Meds. Health regenerates to 60% only out of combat.'],
            ['Factions & Codex', 'Militia, Syndicate, Aegis and Helix track reputation from Hated to Sworn. Helping one costs you half as much with its rival. Complete Codex milestones in the Pip-Pad to claim exclusive weapons and relics.'],
            ['Levels, Mastery and perks', 'Levels are a deliberate grind: 600 XP for level 2, about 39,000 for level 11. Kills five or more levels below you pay a quarter of their XP. Seven Mastery skills (up to 99) level by doing. Every even level gives a perk point across nine trees (108 perks) and every odd level from 3 gives an attribute point; Medic Ines can retrain you for credits.'],
            ['Developer tools', 'Open them from the pause menu button or F8: grants, teleport, world events, map reveal, Champion spawns, Mastery levels and the integrity validator.'],
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
            ['Pick a challenge, toggle 3-2-1 Countdown & Sandbox', 'Every minigame in the hub displays a dedicated How To Play Guide covering objectives, controls, win conditions, and pro tips. Toggle the instant-start 3-2-1 COUNTDOWN button in the hub header to jump straight into runs, or open Sandbox Mode on supported trickshot courses to practice with zero timer and full target controls.'],
            ['Fun & Specials (22 Modes)', 'Blockbuster genres including Angry Birds FPS, Master Zombie Fortress Siege, 5-Minute Downhill Snowboarding, 5-Map 360 Trickshot (+ Sandbox), FPS Mario 1-1 to 1-4 + Bowser, ATB Final Fantasy Story RPG (with Quest Compass), Bunker Inspection (2.8x Magnifying Glass), Midnight Toyshop Prop Hunt (5-Kill Disco Party Mode), Kaiju Rampage, Orbital Breach Zero-G, Abyssal Mech, Jurassic Safari, Cyberpunk Hoverbike, Pinball Wizard (Q/E Flippers & M-A-G-I-C Multiball), Chess FPS, Gladiator Colosseum, and more.'],
            ['Target & Action (16 Courses)', 'Practice on fixed-pattern courses, watch a first-person Beat Drop example, or try Whack-a-Mole, Sweetheart Shore and Mansion Raid.'],
            ['Speed Runs (9 Timed Runs)', 'Race through timed challenges including Getaway Chase, Deagle Meteor Splitter, Ninja Stealth and Three-Headed Dragon.'],
            ['Arcade Hall (15 Games) & Boss Rush', 'Try Quickdraw Duels, Ball Brawl and Switchyard in Arcade Hall, or face every boss in Boss Rush with three heals.'],
            ['Scoring and stars', 'Chain hits to build a streak multiplier. Bronze, Silver, Gold and Platinum stars track your best score or fastest time. Reserve ammo is unlimited unless a mode rules otherwise. Targets ring, shatter or thunk depending on what they are made of, and the announcer calls your combos and the last ten seconds.'],
            ['Daily Featured & Arcade Rank', 'Three courses are featured each day with a star goal and bonus XP. Clear all three to build a streak (+10% bonus XP per day, up to double). Your total stars set your Arcade Rank, from Rookie to Arcade Legend.']
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

    function activeMinigameGuide() {
        if (BO.State?.activeMode !== 'minigame') return null;
        const MG = BO.Minigames;
        const def = (MG && (MG.def || (MG.session && MG.session.def))) || null;
        if (!def) return null;

        const g = def.guide || {};
        const objective = g.objective || def.desc || def.tagline || 'Complete the challenge cleanly to earn Platinum stars.';
        const overviewLines = [objective];
        if (def.desc && def.desc !== objective) overviewLines.push(def.desc);

        const keyLines = (def.keys && def.keys.length)
            ? def.keys.map(([k, t]) => `[${k}] — ${t}`)
            : ['[WASD] — Move', '[MOUSE] — Aim', '[LMB] — Fire / Action', '[R] — Reload (reserve ammo is unlimited)'];

        const tips = g.tips ? g.tips.slice() : [];
        if (!tips.length) {
            if (def.cat === 'speed') tips.push('Beat the clock thresholds shown below to earn Gold and Platinum stars.');
            else if (def.cat === 'target') tips.push('Chain accurate hits without missing to build up to a 4x streak multiplier.');
            else if (def.cat === 'arcade') tips.push('Focus on accuracy and avoid penalty targets to protect your streak.');
            else if (def.cat === 'boss') tips.push('You only get 3 heals for the entire run — press [H] wisely during rest windows.');
            else tips.push('Review the controls above; this mode uses specialized mechanics and abilities.');
        }
        if (def.weaponNote && !tips.includes(def.weaponNote)) tips.push(def.weaponNote);

        const sections = [
            ['Objective & How to Play', overviewLines.length === 1 ? overviewLines[0] : overviewLines],
            ['Controls in ' + def.name, keyLines],
            ['Tips & Winning Strategy', tips]
        ];

        const opts = (MG.session && MG.session.opts) || MG.hubOpts || {};
        if (typeof MG.starsOf === 'function' && def.cat !== 'boss') {
            const stars = MG.starsOf(def, opts) || [];
            if (stars.length) {
                const labels = ['Bronze', 'Silver', 'Gold', 'Platinum'];
                sections.push(['Star Thresholds', stars.map((th, i) => `${labels[i] || ('Star ' + (i + 1))}: ${def.starLabel ? def.starLabel(th, i) : Number(th).toLocaleString()}`)]);
            }
        }

        const catLabels = { fun: 'Fun & Specials', target: 'Target & Action', speed: 'Speed Run', arcade: 'Arcade Hall', boss: 'Boss Rush' };
        const catLabel = catLabels[def.cat] || 'Minigame';
        return {
            name: `${def.icon ? def.icon + ' ' : ''}${def.name}`,
            intro: `${catLabel}${def.tagline ? ' — ' + def.tagline : ''}`,
            sections,
            openAllTop: true
        };
    }

    BO.ModeGuide = {
        MODES,
        render(mode, query = '') {
            const activeMg = mode === 'minigames' ? activeMinigameGuide() : null;
            const pick = activeMg || MODES[mode] || MODES.zombies;
            const sections = activeMg
                ? [...activeMg.sections]
                : [...pick.sections, ['Controls in this mode', controls(mode)], ...dynamic(mode)];
            const term = query.trim().toLowerCase();
            const matches = sections.filter(([title, body]) => (title + ' ' + (Array.isArray(body) ? body.join(' ') : body)).toLowerCase().includes(term));
            return `<div class="mode-guide-intro"><h3>${esc(pick.name)}</h3><p>${esc(pick.intro)}</p></div>` + (matches.length ? matches.map(([title, body], index) => `
                <details class="mode-guide-section" ${term || index === 0 || (activeMg && index < 3) ? 'open' : ''}>
                    <summary>${esc(title)}</summary>
                    ${Array.isArray(body) ? `<ul>${body.filter((line) => !term || title.toLowerCase().includes(term) || line.toLowerCase().includes(term)).map((line) => `<li>${esc(line)}</li>`).join('')}</ul>` : `<p>${esc(body)}</p>`}
                </details>`).join('') : '<p class="mode-guide-empty">No matching topics in this mode. Try a shorter word or another tab.</p>');
        }
    };
})(window.BO);
