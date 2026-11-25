/* ============================================================================
   BLACKOUT OPS — Open World RPG · Quests
   Finite-state quests. Each stage has objective text and an optional map
   marker; 'on' maps world events (flag:<id>, kill:<enemyId>, item:<id>,
   discover:<poiId>, count:<flag>:<n>) to the next stage. Branch rewards are
   paid by OWRPGQuests.complete(id, branch). The 3-Path Rule: main/faction
   quests resolve by combat, tech/stealth or social leverage.
============================================================================ */
(function (BO) {
    'use strict';

    const QUESTS = {
        q_dry_artery: {
            name: 'The Dry Artery', giver: 'kessler', kind: 'main', region: 'haven_basin',
            summary: "Haven's Pump Three is dry. Someone planted a bypass in the culvert.",
            stages: {
                investigate: {
                    text: 'Find out what happened to Pump Three. Pull the bypass in the Culvert Sublevel, reroute at the Surface Junction, or find out who planted it.',
                    marker: 'pump_three',
                    on: { 'flag:culvert_valve_pulled': 'report', 'flag:junction_rerouted': 'report', 'flag:mags_shutoff': 'report', 'item:syndicate_ledger': 'report' }
                },
                report: { text: 'Report back to Warden Kessler in Freestead Town.', marker: 'freestead' }
            },
            branches: {
                combat: { label: 'Pulled the bypass by force', xp: 350, credits: 150, rep: { militia: 200 }, items: ['relay_cell'] },
                reroute: { label: 'Rerouted the main line', xp: 350, credits: 100, rep: { militia: 150 }, items: ['relay_cell'] },
                exposed: { label: 'Exposed the Syndicate', xp: 400, credits: 200, rep: { militia: 300 }, items: ['relay_cell'], flags: ['syndicate_exposed'] },
                diplomacy: { label: 'Talked the Syndicate down', xp: 400, credits: 100, rep: { militia: 150, syndicate: 100 }, items: ['relay_cell'] },
                betrayal: { label: 'Sold Haven out to the Syndicate', xp: 300, credits: 300, rep: { syndicate: 300, militia: -400 }, flags: ['mags_friend'] }
            },
            bonusFlag: { flag: 'kessler_bonus', credits: 50 }
        },
        q_overpass_bounty: {
            name: 'The Gutter King', giver: 'kessler', kind: 'side', region: 'haven_basin',
            summary: 'A raider warlord has taken the old overpass south of town.',
            stages: {
                hunt: { text: 'Kill Gutter King Vasko at the Raider Overpass.', marker: 'overpass', on: { 'kill:raider_boss': 'report' } },
                report: { text: 'Collect the bounty from Warden Kessler.', marker: 'freestead' }
            },
            branches: { killed: { label: 'Collected the bounty', xp: 300, credits: 200, rep: { militia: 100 } } }
        },
        q_relay_light: {
            name: 'Light on the Ridge', giver: 'sola', kind: 'side', region: 'haven_basin',
            summary: 'Relight the Abandoned Relay to restore comms and power its pylon.',
            stages: {
                fetch: { text: 'Find a relay fuse (the crashed Aegis convoy north of town), or jury-rig the mast panel with TCH 5.', marker: 'convoy', on: { 'item:relay_fuse': 'install', 'flag:relay_lit': 'report' } },
                install: { text: 'Install the fuse at the Abandoned Relay mast panel.', marker: 'relay', on: { 'flag:relay_lit': 'report' } },
                report: { text: 'Tell Engineer Sola the relay is live.', marker: 'freestead' }
            },
            branches: { lit: { label: 'Relit the relay', xp: 220, credits: 80, rep: { militia: 75 }, pylon: 'py_relay' } }
        },
        q_shale_nest: {
            name: 'Brood Fever', giver: 'ines', kind: 'side', region: 'haven_basin',
            summary: 'A brood laying nest in the Shale Cave is spreading fever to Haven children.',
            stages: {
                burn: { text: 'Destroy the three egg sacs in the Shale Cave (west ridge).', marker: 'shale_cave', on: { 'count:sacs_destroyed:3': 'report' } },
                report: { text: 'Tell Medic Ines the nest is gone.', marker: 'freestead' }
            },
            branches: { burned: { label: 'Burned the nest', xp: 260, credits: 60, rep: { militia: 75 }, items: ['medkit', 'medkit', 'medkit'] } }
        },
        q_convoy_manifest: {
            name: 'Two Buyers', giver: null, kind: 'faction', region: 'haven_basin',
            summary: 'The crashed convoy carried a manifest that Aegis and the Helix both want.',
            autoStart: 'item:convoy_manifest',
            stages: {
                deliver: { text: 'Deliver the convoy manifest to Lt. Vance (Aegis Checkpoint K-4) or Sister Calla (Helix Bloom Shrine). You can only choose one.', marker: 'checkpoint' }
            },
            branches: {
                aegis: { label: 'Gave it to Aegis', xp: 250, credits: 150, rep: { aegis: 250 } },
                helix: { label: 'Gave it to the Helix', xp: 250, credits: 150, rep: { helix: 250 } }
            }
        },
        q_meridian_signal: {
            name: 'Act I: The Carrier Wave', giver: 'kessler', kind: 'main', region: 'alpine_array',
            summary: 'A patterned signal is pulsing out of the Meridian crater.',
            stages: {
                reach_array: { text: 'Ask Lt. Vance at Aegis Checkpoint K-4 about the signal, or go straight to the crater.', marker: 'checkpoint', on: { 'discover:meridian_dome': 'done_dome' } },
                reach_dome: { text: 'Reach the Meridian Containment Dome.', marker: 'meridian_dome', on: { 'discover:meridian_dome': 'done_dome' } },
                done_dome: { text: 'You stood beneath the dome and heard the handshake. (Act II is in development.)', autoComplete: 'heard' }
            },
            branches: { heard: { label: 'Reached the dome', xp: 600, credits: 0, rep: {} } }
        }
    };

    BO.OWRPGQuestsData = { QUESTS };
})(window.BO);
