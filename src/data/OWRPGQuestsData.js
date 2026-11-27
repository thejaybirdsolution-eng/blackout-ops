/* ============================================================================
   BLACKOUT OPS — Open World RPG · Quests 2.0 (40 Quests Across 12 Regions & 12 Dungeons)
   Categories: main · faction · side · contract (Witcher hunts) · delve (Dungeons) · explore (self-starting)
   Preserves 100% of original quest stages/branches for _qa_owrpg.html.
============================================================================ */
(function (BO) {
    'use strict';

    const QUESTS = {
        /* ==================== ORIGINAL 17 QUESTS (PRESERVED) ==================== */
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
                combat: { label: 'Pulled the bypass by force', xp: 320, credits: 150, rep: { militia: 200 }, items: ['relay_cell'] },
                reroute: { label: 'Rerouted the main line', xp: 320, credits: 100, rep: { militia: 150 }, items: ['relay_cell'] },
                exposed: { label: 'Exposed the Syndicate', xp: 360, credits: 200, rep: { militia: 300 }, items: ['relay_cell'], flags: ['syndicate_exposed'] },
                diplomacy: { label: 'Talked the Syndicate down', xp: 360, credits: 100, rep: { militia: 150, syndicate: 100 }, items: ['relay_cell'] },
                betrayal: { label: 'Sold Haven out to the Syndicate', xp: 280, credits: 300, rep: { syndicate: 300, militia: -400 }, flags: ['mags_friend'] }
            },
            bonusFlag: { flag: 'kessler_bonus', credits: 50 }
        },
        q_overpass_bounty: {
            name: 'The Gutter King', giver: 'kessler', kind: 'contract', region: 'haven_basin',
            summary: 'A raider warlord has taken the old overpass south of town.',
            stages: {
                hunt: { text: 'Kill Gutter King Vasko at the Raider Overpass.', marker: 'overpass', on: { 'kill:raider_boss': 'report' } },
                report: { text: 'Collect the bounty from Warden Kessler.', marker: 'freestead' }
            },
            branches: { killed: { label: 'Collected the bounty', xp: 280, credits: 200, rep: { militia: 100 }, items: ['w_model1887_twin'] } }
        },
        q_relay_light: {
            name: 'Light on the Ridge', giver: 'sola', kind: 'side', region: 'haven_basin',
            summary: 'Relight the Abandoned Relay to restore comms and power its pylon.',
            stages: {
                fetch: { text: 'Find a relay fuse (the crashed Aegis convoy north of town), or jury-rig the mast panel with TCH 5.', marker: 'convoy', on: { 'item:relay_fuse': 'install', 'flag:relay_lit': 'report' } },
                install: { text: 'Install the fuse at the Abandoned Relay mast panel.', marker: 'relay', on: { 'flag:relay_lit': 'report' } },
                report: { text: 'Tell Engineer Sola the relay is live.', marker: 'freestead' }
            },
            branches: { lit: { label: 'Relit the relay', xp: 200, credits: 80, rep: { militia: 75 }, pylon: 'py_relay' } }
        },
        q_shale_nest: {
            name: 'Brood Fever', giver: 'ines', kind: 'side', region: 'haven_basin',
            summary: 'A brood laying nest in the Shale Cave is spreading fever to Haven children.',
            stages: {
                burn: { text: 'Destroy the three egg sacs in the Shale Cave (west ridge).', marker: 'shale_cave', on: { 'count:sacs_destroyed:3': 'report' } },
                report: { text: 'Tell Medic Ines the nest is gone.', marker: 'freestead' }
            },
            branches: { burned: { label: 'Burned the nest', xp: 240, credits: 60, rep: { militia: 75 }, items: ['medkit', 'medkit', 'elixir_swallow'] } }
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
            branches: { heard: { label: 'Reached the dome', xp: 550, credits: 180, rep: {} } }
        },
        q_scrap_wheels: {
            name: 'Wheels for the Road', giver: 'torin', kind: 'side', region: 'haven_basin',
            summary: 'Quartermaster Torin can assemble a Scrap Scout Bike if you gather scrap and check the Crashed Convoy.',
            stages: {
                gather: { text: 'Collect Scrap Metal or investigate the Crashed Convoy north of Freestead.', marker: 'convoy', on: { 'discover:convoy': 'report', 'item:scrap_metal': 'report' } },
                report: { text: 'Return to Quartermaster Torin in Freestead Town to claim your Scrap Scout Bike.', marker: 'freestead' }
            },
            branches: { built: { label: 'Assembled Scrap Scout Bike', xp: 180, credits: 75, rep: { militia: 60 }, items: ['schematic_scout_bike', 'tool_field_repair'] } }
        },
        q_workbench_trials: {
            name: 'Trial by Fire', giver: 'torin', kind: 'side', region: 'haven_basin',
            summary: 'Test Basin hardware by clearing raiders at Goliath Crane in Rust Sprawl.',
            stages: {
                clear: { text: 'Defeat the raiders guarding Goliath Crane in Rust Sprawl.', marker: 'goliath', on: { 'discover:goliath': 'report', 'kill:raider_pyro': 'report' } },
                report: { text: 'Report to Quartermaster Torin in Freestead.', marker: 'freestead' }
            },
            branches: { done: { label: 'Proved the Basin loadout', xp: 260, credits: 180, rep: { militia: 90 }, items: ['tool_scrap_flamer', 'w_m4a1_warden'] } }
        },
        q_rust_smugglers: {
            name: 'Rail Yard Smugglers', giver: 'mags', kind: 'faction', region: 'rust_sprawl',
            summary: 'Mags wants competition cleared off the Goliath Crane siding — or bought out.',
            stages: {
                handle: { text: 'Clear out the Syndicate Deadeye at Goliath Crane or defeat the Scrap Bruiser.', marker: 'goliath', on: { 'kill:syn_sniper': 'report', 'kill:raider_bruiser': 'report' } },
                report: { text: 'Report back to Mags Orrin at Ironclad Rail Yard.', marker: 'rail_yard' }
            },
            branches: {
                enforced: { label: 'Cleared the tracks by force', xp: 340, credits: 240, rep: { syndicate: 180 }, items: ['schematic_hoverbike', 'w_ak47_rust'] },
                haggled: { label: 'Negotiated rail passage', xp: 320, credits: 300, rep: { syndicate: 120, militia: 60 }, items: ['schematic_hoverbike'] }
            }
        },
        q_mire_plague: {
            name: 'Waters of the Hydra', giver: 'lyra', kind: 'contract', region: 'mire_delta',
            summary: 'Dr. Lyra Chen needs the Mire Plague Hydra slain at Cooling Stack Nest.',
            stages: {
                hunt: { text: 'Slay the Mire Plague Hydra at the Cooling Stack Nest in Mire Delta.', marker: 'mire_nest', on: { 'kill:boss_mire_hydra': 'report' } },
                report: { text: 'Bring word to Dr. Lyra Chen at Quarry Dig Camp.', marker: 'quarry_camp' }
            },
            branches: { slain: { label: 'Purged the Mire Hydra', xp: 480, credits: 320, rep: { aegis: 180, militia: 100 }, items: ['w_an94_cryo', 'relic_brood_heart'] } }
        },
        q_sunken_barge: {
            name: 'Salvage in the Mire', giver: 'torin', kind: 'side', region: 'mire_delta',
            summary: 'An armored cargo barge ran aground in Mire Delta carrying pre-collapse armor crates.',
            stages: {
                locate: { text: 'Reach the Sunken Cargo Barge in Mire Delta and loot its locker.', marker: 'sunken_barge', on: { 'discover:sunken_barge': 'report' } },
                report: { text: 'Return to Quartermaster Torin in Freestead.', marker: 'freestead' }
            },
            branches: { salvaged: { label: 'Recovered barge armor', xp: 300, credits: 200, rep: { militia: 100 }, items: ['rig_juggernaut', 'boots_warden'] } }
        },
        q_quarry_titans: {
            name: 'Core of the Ash Pit', giver: 'kessler', kind: 'contract', region: 'ash_quarry',
            summary: 'A towering Ash Quarry Colossus has awakened in Excavator Pit.',
            stages: {
                slay: { text: 'Defeat the Ash Quarry Colossus in Excavator Pit.', marker: 'quarry_pit', on: { 'kill:boss_quarry_colossus': 'report' } },
                report: { text: 'Report the kill to Warden Kessler in Freestead.', marker: 'freestead' }
            },
            branches: { slain: { label: 'Felled the Ash Colossus', xp: 540, credits: 360, rep: { militia: 200 }, items: ['tool_breach_hammer', 'w_ksg_breach'] } }
        },
        q_quarry_truce: {
            name: 'Iron & Ember', giver: 'lyra', kind: 'faction', region: 'ash_quarry',
            summary: 'Militia and Syndicate are deadlocked at Quarry Dig Camp. Broker a truce or pick a side.',
            stages: {
                resolve: { text: 'Collect a Quarry Core Sample in Excavator Pit.', marker: 'quarry_pit', on: { 'item:quarry_core_sample': 'report' } },
                report: { text: 'Deliver the Quarry Core Sample to Dr. Lyra Chen at Quarry Dig Camp.', marker: 'quarry_camp' }
            },
            branches: {
                truce: { label: 'Brokered Quarry Neutrality', xp: 400, credits: 260, rep: { militia: 140, syndicate: 140 }, items: ['relic_warden'] },
                aegis_claim: { label: 'Handed survey to Aegis', xp: 400, credits: 280, rep: { aegis: 220 }, items: ['w_m249_bastion'] }
            }
        },
        q_alpine_rogue: {
            name: 'Iron on the Ridge', giver: 'vance', kind: 'main', region: 'alpine_array',
            summary: 'A Rogue Mecha Unit X-9 has gone berserk on Deep-Space Dish Ridge.',
            stages: {
                destroy: { text: 'Destroy Rogue Mecha Unit X-9 at Deep-Space Dish Ridge.', marker: 'dish_ridge', on: { 'kill:boss_alpine_warden': 'report' } },
                report: { text: 'Report to Lt. Imre Vance at Aegis Checkpoint K-4.', marker: 'checkpoint' }
            },
            branches: { destroyed: { label: 'Decommissioned Unit X-9', xp: 640, credits: 420, rep: { aegis: 260 }, items: ['schematic_aegis_atv', 'w_scar_aegis'] } }
        },
        q_alpine_blackbox: {
            name: 'Silent Telemetry', giver: 'lyra', kind: 'side', region: 'alpine_array',
            summary: 'Recover the flight blackbox sealed inside Bunker Delta in Alpine Array.',
            stages: {
                recover: { text: 'Recover the Aegis Flight Blackbox from Bunker Delta.', marker: 'bunker_delta', on: { 'item:aegis_blackbox': 'report' } },
                report: { text: 'Bring the Aegis Flight Blackbox to Dr. Lyra Chen.', marker: 'quarry_camp' }
            },
            branches: { decoded: { label: 'Decoded telemetry logs', xp: 500, credits: 320, rep: { aegis: 200 }, items: ['helm_arctech', 'tool_nano_patch'] } }
        },
        q_helix_cipher: {
            name: 'Harmonic Resonance', giver: 'calla', kind: 'faction', region: 'meridian_core',
            summary: 'Sister Calla seeks the Helix Harmonic Cipher left in the Crater Anomaly Rift.',
            stages: {
                seek: { text: 'Retrieve the Helix Harmonic Cipher from the Crater Anomaly Rift.', marker: 'crater_rift', on: { 'item:helix_cipher': 'report' } },
                report: { text: 'Return the cipher to Sister Calla at the Helix Bloom Shrine.', marker: 'helix_shrine' }
            },
            branches: {
                blessed: { label: 'Shared the Harmonic Cipher', xp: 600, credits: 360, rep: { helix: 280 }, items: ['w_void_staff', 'helm_ghost'] },
                studied: { label: 'Copied cipher for Aegis instead', xp: 600, credits: 380, rep: { aegis: 260, helix: -150 }, items: ['w_acr_specops', 'relic_arctech'] }
            }
        },
        q_sovereign_hunt: {
            name: 'Crown of the Crater', giver: 'kessler', kind: 'main', region: 'meridian_core',
            summary: 'The Meridian Sovereign guards the Containment Dome at the heart of the blast crater.',
            stages: {
                slay: { text: 'Defeat The Meridian Sovereign inside Meridian Containment Dome.', marker: 'meridian_dome', on: { 'kill:boss_meridian_sovereign': 'report' } },
                report: { text: 'Return victorious to Warden Kessler in Freestead Town.', marker: 'freestead' }
            },
            branches: { triumph: { label: 'Shattered the Crater Sovereign', xp: 950, credits: 750, rep: { militia: 350, aegis: 250 }, items: ['schematic_war_strider', 'w_raygun_proto', 'relic_crater_shard'] } }
        },

        /* ==================== 14 NEW FRONTIER, DUNGEON & DRAGONWILDS QUESTS ==================== */
        q_whisper_poachers: {
            name: 'Shadows in the Pines', giver: 'halvar', kind: 'side', region: 'whispering_woods',
            summary: 'Poachers have erected a fortified palisade in Whispering Pinewoods.',
            stages: {
                clear: { text: 'Eliminate Pinewood Poachers at the Poacher Palisade.', marker: 'poacher_palisade', on: { 'kill:forest_poacher': 'report', 'discover:poacher_palisade': 'report' } },
                report: { text: "Report back to Captain Halvar at Ranger's Watch Lodge.", marker: 'whisper_lodge' }
            },
            branches: { cleared: { label: 'Drove out the poachers', xp: 340, credits: 220, rep: { militia: 140 }, pylon: 'py_whisper', items: ['w_galil_veteran', 'elixir_swallow'] } }
        },
        q_barrow_orc_delve: {
            name: 'Delve: Whispering Root-Barrow', giver: 'halvar', kind: 'delve', region: 'whispering_woods',
            summary: 'Warchief Thornback rallies orc reavers beneath the Root-Barrow Mound.',
            stages: {
                delve: { text: 'Enter Whispering Root-Barrow and slay Warchief Thornback.', marker: 'barrow_gate', on: { 'kill:boss_thornback_orc': 'report' } },
                report: { text: "Return to Captain Halvar at Ranger's Watch Lodge.", marker: 'whisper_lodge' }
            },
            branches: { slain: { label: 'Conquered Root-Barrow', xp: 520, credits: 320, rep: { militia: 180 }, items: ['rig_warden', 'elixir_wisdom'] } }
        },
        q_elderwood_harvest: {
            name: 'Heartwood & Iron', giver: 'halvar', kind: 'side', region: 'whispering_woods',
            summary: 'Gather Elderwood Timber from ancient trees in Whispering Pinewoods to fortify the lodge.',
            stages: {
                gather: { text: 'Harvest Elderwood Timber from Ancient Elderwood trees in Whispering Pinewoods.', marker: 'whisper_lodge', on: { 'item:elderwood_log': 'report' } },
                report: { text: "Deliver the timber to Captain Halvar at Ranger's Watch Lodge.", marker: 'whisper_lodge' }
            },
            branches: { delivered: { label: 'Delivered Elderwood Timber', xp: 280, credits: 180, rep: { militia: 100 }, items: ['boots_warden', 'relay_cell'] } }
        },
        q_foundry_delve: {
            name: 'Delve: Ironclad Foundry Depths', giver: 'mags', kind: 'delve', region: 'rust_sprawl',
            summary: 'Rogue Foreman Kragg has sealed himself inside the subterranean Ironclad Foundry Depths.',
            stages: {
                delve: { text: 'Enter Ironclad Foundry Depths at Smuggler Foundry Yard and defeat Foreman Kragg.', marker: 'foundry_yard', on: { 'kill:boss_foundry_kragg': 'report' } },
                report: { text: 'Report to Mags Orrin at Ironclad Rail Yard.', marker: 'rail_yard' }
            },
            branches: { reclaimed: { label: 'Reclaimed the Foundry Depths', xp: 620, credits: 420, rep: { syndicate: 220 }, items: ['helm_juggernaut', 'tool_thermal_cutter'] } }
        },
        q_marrow_crypt_delve: {
            name: 'Delve: Sunken Crypt of Marrow', giver: 'orlok', kind: 'delve', region: 'barrow_moor',
            summary: 'Arch-Lich Malgath is raising the dead across Barrow-Moor from the Sunken Crypt of Marrow.',
            stages: {
                delve: { text: 'Enter the Sunken Crypt of Marrow at Marrow Boneyard and slay Arch-Lich Malgath.', marker: 'marrow_crypt_yard', on: { 'kill:boss_lich_malgath': 'report' } },
                report: { text: 'Return to Grave-Warden Orlok at Grimhollow Sanctuary.', marker: 'grimhollow_chapel' }
            },
            branches: { banished: { label: 'Banished Arch-Lich Malgath', xp: 780, credits: 480, rep: { helix: 220 }, pylon: 'py_grimhollow', items: ['helm_lichplate', 'rig_lichplate'] } }
        },
        q_crimson_vampire_hunt: {
            name: 'Contract: Lord of Crimson Manor', giver: 'orlok', kind: 'contract', region: 'barrow_moor',
            summary: 'Lord Vespera the Undying feasts within the Crimson Sanctum Vaults beneath Vampire Manor.',
            stages: {
                hunt: { text: 'Delve into Crimson Sanctum Vaults at Crimson Manor and slay Lord Vespera.', marker: 'vampire_manor', on: { 'kill:boss_lord_vespera': 'report' } },
                report: { text: 'Claim the Witcher contract reward from Grave-Warden Orlok.', marker: 'grimhollow_chapel' }
            },
            branches: { slain: { label: 'Staked Lord Vespera', xp: 920, credits: 580, rep: { helix: 240 }, items: ['boots_lichplate', 'relic_lich_phylactery'] } }
        },
        q_coven_cavern_delve: {
            name: 'Contract: The Bog Hag-Mother', giver: 'orlok', kind: 'contract', region: 'mire_delta',
            summary: 'Hag-Mother Morwen brews hex-plagues inside the Mire Witch Coven Cavern.',
            stages: {
                hunt: { text: 'Enter Mire Witch Coven Cavern at Witch Coven Bog and slay Hag-Mother Morwen.', marker: 'coven_hut', on: { 'kill:boss_coven_morwen': 'report' } },
                report: { text: 'Return to Grave-Warden Orlok at Grimhollow Sanctuary.', marker: 'grimhollow_chapel' }
            },
            branches: { purged: { label: 'Ended the Coven Sabbat', xp: 960, credits: 600, rep: { aegis: 180, helix: 180 }, items: ['elixir_thunderbolt', 'elixir_wisdom'] } }
        },
        q_dwarven_mine_delve: {
            name: 'Delve: Deep-Vein Molten Core', giver: 'lyra', kind: 'delve', region: 'ash_quarry',
            summary: 'Molten Golem Ignis blocks the mithril seams inside the Deep-Vein Quarry Mines.',
            stages: {
                delve: { text: 'Enter Deep-Vein Quarry Mines at Deep-Vein Minehead and shatter Molten Golem Ignis.', marker: 'quarry_minehead', on: { 'kill:boss_molten_ignis': 'report' } },
                report: { text: 'Report back to Dr. Lyra Chen at Quarry Dig Camp.', marker: 'quarry_camp' }
            },
            branches: { shattered: { label: 'Opened the Deep-Vein seams', xp: 1150, credits: 680, rep: { aegis: 240 }, items: ['w_mg42_scrap', 'tool_nano_patch'] } }
        },
        q_badlands_mesa: {
            name: 'Blood on Redrock Mesa', giver: 'zahra', kind: 'faction', region: 'sunscorched_badlands',
            summary: 'Redrock Desperados are raiding every Dustwind caravan crossing the Badlands.',
            stages: {
                raid: { text: 'Assault Redrock Outlaw Mesa and eliminate Redrock Desperados.', marker: 'redrock_mesa', on: { 'kill:badlands_outlaw': 'report', 'discover:redrock_mesa': 'report' } },
                report: { text: 'Return to Caravan Master Zahra at Dustwind Caravan Oasis.', marker: 'dustwind_oasis' }
            },
            branches: { secured: { label: 'Secured the Badlands trade route', xp: 880, credits: 560, rep: { syndicate: 240 }, pylon: 'py_oasis', items: ['w_rpg7_demolisher', 'relay_cell'] } }
        },
        q_sunfang_tomb_delve: {
            name: "Delve: Sunfang Pharaoh's Tomb", giver: 'zahra', kind: 'delve', region: 'sunscorched_badlands',
            summary: 'Ancient Sunfang Pharaoh Kharim guards the Golden Sunfang Idol beneath the desert pyramid.',
            stages: {
                delve: { text: "Enter Sunfang Pharaoh's Tomb at Sunfang Pyramid Plaza and defeat Sand-King Kharim.", marker: 'sunfang_ruins', on: { 'kill:boss_pharaoh_kharim': 'report' } },
                report: { text: 'Bring word to Caravan Master Zahra at Dustwind Caravan Oasis.', marker: 'dustwind_oasis' }
            },
            branches: { plundered: { label: 'Claimed the Sunfang treasure', xp: 1350, credits: 850, rep: { syndicate: 280 }, items: ['w_gold_deagle_king', 'elixir_wisdom'] } }
        },
        q_drowned_sanctum_delve: {
            name: 'Delve: Abyssal Tide Sanctum', giver: 'zahra', kind: 'delve', region: 'sunken_coast',
            summary: 'Tide-Caller Nereus drags coastal salvage crews into the Abyssal Tide Sanctum.',
            stages: {
                delve: { text: 'Enter Abyssal Tide Sanctum at Tide-Sanctum Arch and slay Tide-Caller Nereus.', marker: 'abyssal_gate', on: { 'kill:boss_tide_nereus': 'report' } },
                report: { text: 'Report to Caravan Master Zahra at Dustwind Caravan Oasis.', marker: 'dustwind_oasis' }
            },
            branches: { calmed: { label: 'Calmed the Sunken Ruin Coast', xp: 1550, credits: 920, rep: { syndicate: 220, militia: 160 }, pylon: 'py_coast', items: ['rig_arctech', 'relay_cell'] } }
        },
        q_blacklab_delve: {
            name: 'Delve: Aegis Sublevel 9', giver: 'vance', kind: 'delve', region: 'alpine_array',
            summary: 'Prototype Omega-Zero broke containment in Aegis Black-Site Sublevel 9.',
            stages: {
                delve: { text: 'Descend into Aegis Black-Site Sublevel 9 and terminate Prototype Omega-Zero.', marker: 'blacklab_surface', on: { 'kill:boss_omega_zero': 'report' } },
                report: { text: 'Report to Lt. Imre Vance at Aegis Checkpoint K-4.', marker: 'checkpoint' }
            },
            branches: { terminated: { label: 'Terminated Prototype Omega-Zero', xp: 1850, credits: 1100, rep: { aegis: 320 }, items: ['w_minigun_titan', 'boots_arctech'] } }
        },
        q_frostspire_delve: {
            name: 'Crown of Frostspire Keep', giver: 'eryndor', kind: 'delve', region: 'frostfang_peaks',
            summary: 'Frost-King Valdris rules the frozen citadel Undercroft in Frostfang Peaks.',
            stages: {
                delve: { text: 'Storm Frostspire Citadel Undercroft at Frostspire Castle Keep and defeat Frost-King Valdris.', marker: 'frostspire_courtyard', on: { 'kill:boss_frost_valdris': 'report' } },
                report: { text: 'Report to Scholar Eryndor at Dragonbone Expedition Camp.', marker: 'dragonbone_outpost' }
            },
            branches: { crowned: { label: 'Shattered the Frost-King', xp: 2400, credits: 1450, rep: { aegis: 350 }, pylon: 'py_frostspire', items: ['w_intervention_apex', 'helm_dragonwild'] } }
        },
        q_dragonwild_vault: {
            name: 'Act II: Scourge of the Dragonwilds', giver: 'eryndor', kind: 'main', region: 'obsidian_dragonwilds',
            summary: 'Vaelgor the Ashen Wyrm slumbers atop an ancient Meridian core in the Obsidian Dragonwild Vault.',
            stages: {
                slay: { text: 'Enter the Obsidian Dragonwild Vault at Obsidian Vault Threshold and slay Vaelgor the Ashen Wyrm.', marker: 'dragon_citadel_gate', on: { 'kill:boss_dragon_vaelgor': 'report' } },
                report: { text: 'Return in triumph to Scholar Eryndor at Dragonbone Expedition Camp.', marker: 'dragonbone_outpost' }
            },
            branches: { legend: { label: 'Dragonwilds Dragonslayer', xp: 4200, credits: 2500, rep: { militia: 400, aegis: 400, helix: 250 }, pylon: 'py_dragonwild', items: ['w_fire_staff', 'rig_dragonwild', 'relic_dragon_heart'] } }
        },

        /* ==================== EXPLORATION QUESTS (Cartography · Discoveries · Champions) ====================
           Self-starting: each begins the first time you chart land or find a site of its kind, and counts
           numeric world flags written by OWRPGCartography / OWRPGDiscoveries / OWRPGChampions. */
        q_atlas_cartographer: {
            name: "The Cartographers' Guild", kind: 'explore', region: null, autoStart: 'flag:explored_pct',
            summary: 'An old guild creed promises a reward to anyone who maps the Expanse. The fog lifts wherever you walk.',
            stages: {
                survey: { text: 'Chart 15% of the Meridian Expanse (Atlas tab tracks progress).', on: { 'count:explored_pct:15': 'expand' } },
                expand: { text: 'Chart 35% of the Expanse. Survey Vistas chart wide areas at once.', on: { 'count:explored_pct:35': 'master' } },
                master: { text: 'Chart 60% of the Expanse to earn the Guild\'s seal.', on: { 'count:explored_pct:60': 'sealed' } },
                sealed: { text: 'The Guild seal is yours.', autoComplete: 'charted' }
            },
            branches: { charted: { label: 'Guild Cartographer', xp: 3200, credits: 1200, items: ['elixir_wisdom', 'elixir_wisdom'], rep: { militia: 150 } } }
        },
        q_lorekeeper: {
            name: 'Lorekeeper of the Expanse', kind: 'explore', region: null, autoStart: 'flag:first_tome',
            summary: 'Field journals and black-box transcripts are scattered across every region. Together they tell what broke the Meridian.',
            stages: {
                gather: { text: 'Recover 5 Lore Tomes.', on: { 'count:found_tome:5': 'archive' } },
                archive: { text: 'Recover 12 Lore Tomes to complete the first archive.', on: { 'count:found_tome:12': 'done' } },
                done: { text: 'The archive is complete.', autoComplete: 'archived' }
            },
            branches: { archived: { label: 'Keeper of the Archive', xp: 2200, credits: 600, items: ['elixir_wisdom', 'runic_shard'] } }
        },
        q_pilgrim_road: {
            name: "The Pilgrim's Road", kind: 'explore', region: null, autoStart: 'flag:first_shrine',
            summary: 'Root-wrapped wayside shrines still answer prayers. Pilgrims once walked between them all.',
            stages: {
                walk: { text: 'Pray at 6 different Wayside Shrines.', on: { 'count:found_shrine:6': 'done' } },
                done: { text: 'The road is walked.', autoComplete: 'walked' }
            },
            branches: { walked: { label: 'Pilgrim of the Expanse', xp: 1600, credits: 350, items: ['elixir_thunderbolt', 'elixir_swallow'] } }
        },
        q_fortune_bold: {
            name: 'Fortune Favours the Bold', kind: 'explore', region: null, autoStart: 'flag:first_cache',
            summary: 'Pre-Fall strongboxes lie buried under every region. Somebody hid a fortune before the dome went dark.',
            stages: {
                dig: { text: 'Open 10 Treasure Caches.', on: { 'count:found_cache:10': 'hoard' } },
                hoard: { text: 'Open 25 Treasure Caches.', on: { 'count:found_cache:25': 'done' } },
                done: { text: 'The hoard is yours.', autoComplete: 'rich' }
            },
            branches: { rich: { label: 'Treasure Hunter', xp: 1900, credits: 1800, items: ['rig_aegis'] } }
        },
        q_eyes_expanse: {
            name: 'Eyes Over the Expanse', kind: 'explore', region: null, autoStart: 'flag:first_vista',
            summary: 'Surveyor beacons crown the high ground of every region. Synchronising one charts the land around it.',
            stages: {
                sync: { text: 'Synchronise 6 Survey Vistas (shown as ? on the minimap).', on: { 'count:found_vista:6': 'all' } },
                all: { text: 'Synchronise all 12 Survey Vistas.', on: { 'count:found_vista:12': 'done' } },
                done: { text: 'Every beacon is lit.', autoComplete: 'synced' }
            },
            branches: { synced: { label: 'Master Surveyor', xp: 2600, credits: 700, items: ['elixir_wisdom'] } }
        },
        q_champion_hunter: {
            name: 'Hunter of Champions', kind: 'explore', region: null, autoStart: 'flag:first_champion',
            summary: 'Champions — larger, aura-wrapped enemies with deadly affixes — roam every region. Collectors pay for their sigils.',
            stages: {
                hunt: { text: 'Slay 5 Champions.', on: { 'count:champions_slain:5': 'legend' } },
                legend: { text: 'Slay 15 Champions.', on: { 'count:champions_slain:15': 'done' } },
                done: { text: 'Your name is known.', autoComplete: 'apex' }
            },
            branches: { apex: { label: 'Champion Hunter', xp: 2800, credits: 1400, items: ['elixir_thunderbolt', 'relay_cell'] } }
        },
        q_trial_fire: {
            name: 'Trial by Fire', kind: 'explore', region: null, autoStart: 'flag:first_altar',
            summary: 'Altars of Trials summon a Champion and its retinue. Each victory is recorded in the stone.',
            stages: {
                trials: { text: 'Win 3 Altar Trials.', on: { 'count:trials_won:3': 'done' } },
                done: { text: 'The stones remember you.', autoComplete: 'tried' }
            },
            branches: { tried: { label: 'Altar Champion', xp: 2400, credits: 900, items: ['elixir_thunderbolt'] } }
        },
        q_echoes_mastery: {
            name: 'Echoes of Mastery', kind: 'explore', region: null, autoStart: 'flag:first_shard',
            summary: 'Crystallised memories of forgotten crafts pulse in the wilds. Each one teaches a lifetime in a moment.',
            stages: {
                absorb: { text: 'Absorb 8 Skill Shards.', on: { 'count:found_shard:8': 'done' } },
                done: { text: 'The echoes settle.', autoComplete: 'echo' }
            },
            branches: { echo: { label: 'Echo-Touched', xp: 1700, credits: 300, items: ['elixir_wisdom'] } }
        },
        q_smugglers_trail: {
            name: "Smuggler's Trail", kind: 'explore', region: null, autoStart: 'flag:first_cairn',
            summary: 'Cairns of piled stone mark a smuggling network that ran gear between the regions.',
            stages: {
                follow: { text: 'Search 8 Hidden Stashes.', on: { 'count:found_cairn:8': 'done' } },
                done: { text: 'The network is exposed.', autoComplete: 'exposed' }
            },
            branches: { exposed: { label: 'Trail Breaker', xp: 1300, credits: 1000, rep: { militia: 100, syndicate: -100 } } }
        }
    };

    BO.OWRPGQuestsData = { QUESTS };
})(window.BO);
