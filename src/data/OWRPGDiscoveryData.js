/* ============================================================================
   BLACKOUT OPS — Open World RPG · Discovery Data
   Hidden-site archetypes, shrine blessings and the lore library read from
   tomes. Site placement is generated deterministically from terrain at
   runtime (OWRPGDiscoveries), so this file holds only definitions.
============================================================================ */
(function (BO) {
    'use strict';

    /* Per region: how many of each site to scatter. 12 regions × 13 = 156 sites. */
    const PER_REGION = { cache: 4, tome: 2, shrine: 1, shard: 2, vista: 1, cairn: 2, altar: 1 };

    const TYPES = {
        cache: {
            name: 'Treasure Cache', icon: '✦', color: '#fbbf24', xp: 40, skill: ['delving', 30],
            prompt: 'Open Treasure Cache', model: 'pixel_fantasy/pixel-fantasy-treasure-chest.glb', fit: [1.3, 1.0, 1.0],
            sound: ['rpg_sfx/creak1.ogg', 'rpg_sfx/handleCoins.ogg'],
            desc: 'Buried strongboxes from before the Fall. Each holds credits, Pre-Fall coins and a chance at gear.'
        },
        tome: {
            name: 'Lore Tome', icon: '❦', color: '#e9c46a', xp: 30, skill: ['arcana', 35],
            prompt: 'Read Lore Tome', model: 'mini_dungeon_kit/table.glb', fit: [1.4, 0.95, 0.9],
            sound: ['rpg_sfx/bookOpen.ogg', 'rpg_sfx/bookFlip1.ogg'],
            desc: 'Field journals, sermons and black-box transcripts that piece together what broke the Meridian.'
        },
        shrine: {
            name: 'Wayside Shrine', icon: '✧', color: '#5eead4', xp: 25, skill: ['foraging', 25], cooldown: 600,
            prompt: 'Pray at Wayside Shrine', model: 'pixel_fantasy/pixel-fantasy-root-entangled-wayside-shrine.glb', fit: [1.8, 2.4, 1.8],
            sound: ['overhaul/stingers/chime_positive.wav'],
            desc: 'Grants a 5-minute blessing. Shrines can be used again every 10 minutes.'
        },
        shard: {
            name: 'Skill Shard', icon: '◈', color: '#a78bfa', xp: 35, skill: null,
            prompt: 'Absorb Skill Shard', model: null, fit: null,
            sound: ['sfx/Digital Audio (Kenney)/Audio/powerUp3.ogg'],
            desc: 'Crystallised memories of a craft. Absorbing one grants a large burst of Mastery XP.'
        },
        vista: {
            name: 'Survey Vista', icon: '⛰', color: '#38bdf8', xp: 80, skill: ['exploration', 120], revealR: 260,
            prompt: 'Synchronise Survey Vista', model: 'castle_kit/flag-banner-long.glb', fit: [1.2, 4.6, 0.5],
            sound: ['overhaul/stingers/level_complete.wav'],
            desc: 'High ground with a surveyor\'s beacon. Synchronising charts a wide area of the map at once.'
        },
        cairn: {
            name: 'Hidden Stash', icon: '▲', color: '#a8a29e', xp: 30, skill: ['mining', 25],
            prompt: 'Search Hidden Stash', model: 'mini_dungeon_kit/stones.glb', fit: [1.6, 0.9, 1.6],
            sound: ['rpg_sfx/handleSmallLeather.ogg'],
            desc: 'Rock cairns hiding a smuggler\'s stash. Good odds of rare gear.'
        },
        altar: {
            name: 'Altar of Trials', icon: '☗', color: '#f43f5e', xp: 150, skill: ['slayer', 140],
            prompt: 'Invoke the Altar of Trials', model: 'pixel_fantasy/pixel-fantasy-carved-weathered-limestone-ritual-altar.glb', fit: [2.2, 1.4, 1.6],
            sound: ['sfx/Impact Sounds (Kenney)/Audio/impactBell_heavy_000.ogg'],
            desc: 'Summons a Champion of the region with two of its retinue. Slay the Champion to claim the altar\'s reward.'
        }
    };

    /* Shrine blessings: fx keys are read by OWRPGCharacter.perkFx (s.player.blessing). */
    const BLESSINGS = [
        { id: 'b_hunter', name: "Hunter's Blessing", color: '#f97316', desc: '+15% weapon damage and +10% critical chance.', fx: { allDmgMult: 0.15, bonusCritChance: 0.10 } },
        { id: 'b_warden', name: "Warden's Blessing", color: '#38bdf8', desc: '+25 armor and +40 max HP.', fx: { armor: 25, maxHp: 40 } },
        { id: 'b_scholar', name: "Scholar's Blessing", color: '#c084fc', desc: '+25% character XP and +25% Mastery XP.', fx: { xpMult: 0.25, skillXpMult: 0.25 } },
        { id: 'b_wind', name: 'Blessing of the Wind', color: '#5eead4', desc: '+15% movement speed and -30% movement noise.', fx: { speedMult: 0.15, noise: -0.30 } },
        { id: 'b_ember', name: 'Ember Blessing', color: '#fb923c', desc: 'Every 4th firearm hit applies Burn.', fx: { nthBurn: 4 } },
        { id: 'b_frost', name: 'Frost Blessing', color: '#7dd3fc', desc: 'Every 4th firearm hit applies Chill and +15% elemental resistance.', fx: { nthChill: 4, allElemRes: 0.15 } },
        { id: 'b_fortune', name: 'Blessing of Fortune', color: '#fde047', desc: '+40% credits found and +30% cache bonus-item chance.', fx: { creditFind: 0.40, cacheLuck: 0.30 } },
        { id: 'b_slayer', name: "Slayer's Blessing", color: '#f43f5e', desc: '+25% damage to beasts, bosses and Champions.', fx: { monsterDmg: 0.25, champDmg: 0.25 } }
    ];
    const BLESSING_SEC = 300;

    /* Original lore for the Meridian Expanse. Tomes pick an entry by region first, then any unread. */
    const LORE = [
        { id: 'l_fall', region: 'haven_basin', title: 'The Night the Dome Went Dark', text: 'Pump Three\'s logbook stops mid-sentence. The last line reads: "Core pressure off the gauge, every light in the basin flickering in time with it, like a heartbeat." Nobody in Haven remembers who wrote it.' },
        { id: 'l_freestead', region: 'haven_basin', title: 'Freestead Charter', text: 'We claim no land beyond the walls we can defend and no water beyond the wells we dig. Any traveller who raises no weapon inside the gate eats at our table. — signed by the eleven families of Freestead.' },
        { id: 'l_pines', region: 'whispering_woods', title: 'Ranger\'s Notebook, Page 9', text: 'The pines hum at night. Not wind. A low tone, felt in the teeth. The wolves go quiet when it starts and the poachers pack up and leave. I am staying to find the source.' },
        { id: 'l_puglins', region: 'whispering_woods', title: 'On the Hoarding of Puglins', text: 'They steal anything that shines: lenses, shell casings, wedding rings. Follow a fat one home and you will find a burrow lined with a decade of lost treasure. Bring a shotgun. They bite.' },
        { id: 'l_syndicate', region: 'rust_sprawl', title: 'Syndicate Ledger (Torn)', text: 'Water futures up 400% since the pumps failed. Recommend we keep at least one pump failing. Scarcity is a resource. — M.O.' },
        { id: 'l_crane', region: 'rust_sprawl', title: 'Goliath Crane Safety Placard', text: 'MAXIMUM LOAD 900 TONNES. Someone has scratched underneath: "Maximum load reached 14 March. It was carrying the old reactor lid. Then the lid started carrying it."' },
        { id: 'l_barrow', region: 'barrow_moor', title: 'Sexton\'s Lament', text: 'We buried them deep and sang them down, as our grandmothers taught us. Since the Fall the songs no longer hold. The dead walk the moor at moonrise and they hum the same low tone as the pines.' },
        { id: 'l_vampire', region: 'barrow_moor', title: 'The Nightlord\'s Bargain', text: 'It offered the village safety from the walking dead in exchange for one guest a month. The village agreed. In a year there were no guests left, and then there was no village.' },
        { id: 'l_mire', region: 'mire_delta', title: 'Brood Containment Memo', text: 'Specimens are NOT reacting to cold. They are reacting to the hum. Recommend all field teams carry tone generators. Recommend we stop pretending we know what we released.' },
        { id: 'l_barge', region: 'mire_delta', title: 'Bargemaster\'s Last Entry', text: 'Fog so thick the lanterns drowned. Something knocked on the hull three times, waited, then knocked three more. The crew wants to turn back. I want to know what is knocking.' },
        { id: 'l_quarry', region: 'ash_quarry', title: 'Quarry Truce Terms', text: 'Militia hold the north benches by day. Syndicate hold the south pits by night. Neither side fires on the ore trains. The truce lasted nine days. The ore trains are still running, with nobody aboard.' },
        { id: 'l_mesa', region: 'sunscorched_badlands', title: 'The Sunfang Inscriptions', text: 'Older than the Meridian. Older than the cities. The glyphs describe a crown of light falling from the sky and a guardian built to stand watch beneath it until the light returned.' },
        { id: 'l_scorpion', region: 'sunscorched_badlands', title: 'Prospector\'s Warning', text: 'If the sand is warm at midnight, walk away. That is the dune scorpions breathing underneath you, a hundred of them, waiting for something heavy enough to be worth surfacing for.' },
        { id: 'l_coast', region: 'sunken_coast', title: 'Harbourmaster\'s Tide Table', text: 'The tide no longer follows the moon. It follows the Core. When the dome pulses, the sea draws back half a mile and the drowned corsairs walk out across the seabed to whatever is calling them.' },
        { id: 'l_siren', region: 'sunken_coast', title: 'The Siren\'s Song (Transcribed)', text: 'It is not a song. It is the hum, slowed down and given a voice. Every sailor who heard it describes it as their mother calling them home for supper.' },
        { id: 'l_aegis', region: 'alpine_array', title: 'Aegis Directive 77', text: 'The Array is not a weapon. The Array is a lid. Under no circumstances is the Array to be powered down, regardless of the cost to surrounding settlements. Acknowledge and destroy.' },
        { id: 'l_frost', region: 'frostfang_peaks', title: 'Frost Knight\'s Oath', text: 'We swore to hold the pass until the thaw. The thaw has not come in eleven years. Our armour has frozen to our skin and our oath has frozen to our souls. We hold.' },
        { id: 'l_troll', region: 'frostfang_peaks', title: 'Glacier Survey Core #4', text: 'Ice layer dated to the Fall contains intact biological tissue at a depth of 40 metres. The tissue is warm. The tissue is growing. Abandoning the drill site.' },
        { id: 'l_helix', region: 'meridian_core', title: 'Helix Sermon of the Open Door', text: 'The Core is not broken. The Core is opening. What the Aegis call a catastrophe we call a door, and every door is an invitation. Will you be standing at the threshold when it swings wide?' },
        { id: 'l_core', region: 'meridian_core', title: 'Engineer\'s Final Diagnostic', text: 'Containment field at 3%. Output at 4000% of rated. The hum is the field failing at a frequency the human ear can almost hear. When it stops humming, run.' },
        { id: 'l_dragons', region: 'obsidian_dragonwilds', title: 'The Ashfall Chronicle', text: 'The drakes came after the crown of light fell. They nest in the obsidian because nothing else can bear the heat of their sleep. Their elders remember the sky before the Meridian, and they are not grateful.' },
        { id: 'l_juggernaut', region: 'obsidian_dragonwilds', title: 'Cult of the Obsidian Flame', text: 'We feed the Juggernaut the ore of the fallen crown and it grows. When it is tall enough to touch the sky, the crown will return to it, and the drakes will kneel. So it is written. So we build.' },
        { id: 'l_militia', region: null, title: 'Militia Recruitment Poster', text: 'HAVEN NEEDS YOU. Clean water. Hot meals. A wall at your back and a rifle in your hands. Report to Warden Kessler. Bring your own boots.' },
        { id: 'l_cartographer', region: null, title: 'The Cartographers\' Guild Creed', text: 'Every map is a promise that the world can be known. Walk where no one has walked, write down what you see, and leave the next traveller a little less lost than you were.' }
    ];

    BO.OWRPGDiscoveryData = { PER_REGION, TYPES, BLESSINGS, BLESSING_SEC, LORE };
})(window.BO);
