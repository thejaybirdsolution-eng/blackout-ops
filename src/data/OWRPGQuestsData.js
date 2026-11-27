/* ============================================================================
   BLACKOUT OPS — Open World RPG · Quests (Base + 11 Flagship Expansion Quests)
   Finite-state quests across all 6 Meridian regions. Preserves every stage,
   branch, and event hook for _qa_owrpg.html.
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
            branches: { killed: { label: 'Collected the bounty', xp: 300, credits: 200, rep: { militia: 100 }, items: ['w_model1887_twin'] } }
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
                done_dome: { text: 'You stood beneath the dome and heard the handshake.', autoComplete: 'heard' }
            },
            branches: { heard: { label: 'Reached the dome', xp: 600, credits: 150, rep: {} } }
        },

        /* -------------------- 11 NEW REGIONAL QUESTS -------------------- */
        q_scrap_wheels: {
            name: 'Wheels for the Road', giver: 'torin', kind: 'side', region: 'haven_basin',
            summary: 'Quartermaster Torin can assemble a Scrap Scout Bike if you gather scrap and check the Crashed Convoy.',
            stages: {
                gather: { text: 'Collect Scrap Metal (2+) or investigate the Crashed Convoy north of Freestead.', marker: 'convoy', on: { 'discover:convoy': 'report', 'item:scrap_metal': 'report' } },
                report: { text: 'Return to Quartermaster Torin in Freestead Town to claim your Scrap Scout Bike.', marker: 'freestead' }
            },
            branches: {
                built: { label: 'Assembled Scrap Scout Bike', xp: 200, credits: 75, rep: { militia: 60 }, items: ['schematic_scout_bike', 'tool_field_repair'], mount: 'scout_bike' }
            }
        },
        q_workbench_trials: {
            name: 'Trial by Fire', giver: 'torin', kind: 'side', region: 'haven_basin',
            summary: 'Test Basin hardware by clearing raiders at Goliath Crane in Rust Sprawl.',
            stages: {
                clear: { text: 'Defeat the raiders guarding Goliath Crane in Rust Sprawl.', marker: 'goliath', on: { 'discover:goliath': 'report', 'kill:raider_pyro': 'report' } },
                report: { text: 'Report to Quartermaster Torin in Freestead.', marker: 'freestead' }
            },
            branches: {
                done: { label: 'Proved the Basin loadout', xp: 280, credits: 180, rep: { militia: 90 }, items: ['tool_scrap_flamer', 'w_m4a1_warden'] }
            }
        },
        q_rust_smugglers: {
            name: 'Rail Yard Smugglers', giver: 'mags', kind: 'faction', region: 'rust_sprawl',
            summary: 'Mags wants competition cleared off the Goliath Crane siding — or bought out.',
            stages: {
                handle: { text: 'Clear out the Syndicate Deadeye at Goliath Crane or discover the Rail Yard siding.', marker: 'goliath', on: { 'kill:syn_sniper': 'report', 'kill:raider_bruiser': 'report' } },
                report: { text: 'Report back to Mags Orrin at Ironclad Rail Yard.', marker: 'rail_yard' }
            },
            branches: {
                enforced: { label: 'Cleared the tracks by force', xp: 360, credits: 240, rep: { syndicate: 180 }, items: ['schematic_hoverbike', 'w_ak47_rust'], mount: 'hoverbike' },
                haggled: { label: 'Negotiated rail passage', xp: 340, credits: 300, rep: { syndicate: 120, militia: 60 }, items: ['schematic_hoverbike'], mount: 'hoverbike' }
            }
        },
        q_mire_plague: {
            name: 'Waters of the Hydra', giver: 'lyra', kind: 'main', region: 'mire_delta',
            summary: 'Dr. Lyra Chen needs the Mire Plague Hydra slain and a toxin sample from Cooling Stack Nest.',
            stages: {
                hunt: { text: 'Slay the Mire Plague Hydra at the Cooling Stack Nest in Mire Delta.', marker: 'mire_nest', on: { 'kill:boss_mire_hydra': 'report' } },
                report: { text: 'Bring word to Dr. Lyra Chen at Quarry Dig Camp.', marker: 'quarry_camp' }
            },
            branches: {
                slain: { label: 'Purged the Mire Hydra', xp: 520, credits: 320, rep: { aegis: 180, militia: 100 }, items: ['w_an94_cryo', 'relic_brood_heart'] }
            }
        },
        q_sunken_barge: {
            name: 'Salvage in the Mire', giver: 'torin', kind: 'side', region: 'mire_delta',
            summary: 'An armored cargo barge ran aground in Mire Delta carrying pre-collapse armor crates.',
            stages: {
                locate: { text: 'Reach the Sunken Cargo Barge in Mire Delta and loot its locker.', marker: 'sunken_barge', on: { 'discover:sunken_barge': 'report' } },
                report: { text: 'Return to Quartermaster Torin in Freestead.', marker: 'freestead' }
            },
            branches: {
                salvaged: { label: 'Recovered barge armor', xp: 320, credits: 200, rep: { militia: 100 }, items: ['rig_juggernaut', 'boots_warden'] }
            }
        },
        q_quarry_titans: {
            name: 'Core of the Ash Pit', giver: 'kessler', kind: 'side', region: 'ash_quarry',
            summary: 'A towering Ash Quarry Colossus has awakened in Excavator Pit.',
            stages: {
                slay: { text: 'Defeat the Ash Quarry Colossus in Excavator Pit.', marker: 'quarry_pit', on: { 'kill:boss_quarry_colossus': 'report' } },
                report: { text: 'Report the kill to Warden Kessler in Freestead.', marker: 'freestead' }
            },
            branches: {
                slain: { label: 'Felled the Ash Colossus', xp: 580, credits: 360, rep: { militia: 200 }, items: ['tool_breach_hammer', 'w_ksg_breach'] }
            }
        },
        q_quarry_truce: {
            name: 'Iron & Ember', giver: 'lyra', kind: 'faction', region: 'ash_quarry',
            summary: 'Militia and Syndicate are deadlocked at Quarry Dig Camp. Broker a truce or pick a side.',
            stages: {
                resolve: { text: 'Collect a Quarry Core Sample in Excavator Pit or speak with Mags / Kessler.', marker: 'quarry_pit', on: { 'item:quarry_core_sample': 'report' } },
                report: { text: 'Deliver the Quarry Core Sample to Dr. Lyra Chen at Quarry Dig Camp.', marker: 'quarry_camp' }
            },
            branches: {
                truce: { label: 'Brokered Quarry Neutrality', xp: 420, credits: 260, rep: { militia: 140, syndicate: 140 }, items: ['relic_warden'] },
                aegis_claim: { label: 'Handed survey to Aegis', xp: 420, credits: 280, rep: { aegis: 220 }, items: ['w_m249_bastion'] }
            }
        },
        q_alpine_rogue: {
            name: 'Iron on the Ridge', giver: 'vance', kind: 'main', region: 'alpine_array',
            summary: 'A Rogue Mecha Unit X-9 has gone berserk on Deep-Space Dish Ridge.',
            stages: {
                destroy: { text: 'Destroy Rogue Mecha Unit X-9 at Deep-Space Dish Ridge.', marker: 'dish_ridge', on: { 'kill:boss_alpine_warden': 'report' } },
                report: { text: 'Report to Lt. Imre Vance at Aegis Checkpoint K-4.', marker: 'checkpoint' }
            },
            branches: {
                destroyed: { label: 'Decommissioned Unit X-9', xp: 680, credits: 420, rep: { aegis: 260 }, items: ['schematic_aegis_atv', 'w_scar_aegis'], mount: 'aegis_atv' }
            }
        },
        q_alpine_blackbox: {
            name: 'Silent Telemetry', giver: 'lyra', kind: 'side', region: 'alpine_array',
            summary: 'Recover the flight blackbox sealed inside Bunker Delta in Alpine Array.',
            stages: {
                recover: { text: 'Recover the Aegis Flight Blackbox from Bunker Delta.', marker: 'bunker_delta', on: { 'item:aegis_blackbox': 'report' } },
                report: { text: 'Bring the Aegis Flight Blackbox to Dr. Lyra Chen.', marker: 'quarry_camp' }
            },
            branches: {
                decoded: { label: 'Decoded telemetry logs', xp: 540, credits: 320, rep: { aegis: 200 }, items: ['helm_arctech', 'tool_nano_patch'] }
            }
        },
        q_helix_cipher: {
            name: 'Harmonic Resonance', giver: 'calla', kind: 'faction', region: 'meridian_core',
            summary: 'Sister Calla seeks the Helix Harmonic Cipher left in the Crater Anomaly Rift.',
            stages: {
                seek: { text: 'Retrieve the Helix Harmonic Cipher from the Crater Anomaly Rift.', marker: 'crater_rift', on: { 'item:helix_cipher': 'report' } },
                report: { text: 'Return the cipher to Sister Calla at the Helix Bloom Shrine.', marker: 'helix_shrine' }
            },
            branches: {
                blessed: { label: 'Shared the Harmonic Cipher', xp: 640, credits: 360, rep: { helix: 280 }, items: ['w_void_staff', 'helm_ghost'] },
                studied: { label: 'Copied cipher for Aegis instead', xp: 640, credits: 380, rep: { aegis: 260, helix: -150 }, items: ['w_acr_specops', 'relic_arctech'] }
            }
        },
        q_sovereign_hunt: {
            name: 'Crown of the Crater', giver: 'kessler', kind: 'main', region: 'meridian_core',
            summary: 'The Meridian Sovereign guards the Containment Dome at the heart of the blast crater.',
            stages: {
                slay: { text: 'Defeat The Meridian Sovereign inside Meridian Containment Dome.', marker: 'meridian_dome', on: { 'kill:boss_meridian_sovereign': 'report' } },
                report: { text: 'Return victorious to Warden Kessler in Freestead Town.', marker: 'freestead' }
            },
            branches: {
                triumph: { label: 'Shattered the Crater Sovereign', xp: 1000, credits: 750, rep: { militia: 350, aegis: 250 }, items: ['schematic_war_strider', 'w_raygun_proto', 'relic_crater_shard'], mount: 'war_strider' }
            }
        }
    };

    BO.OWRPGQuestsData = { QUESTS };
})(window.BO);
