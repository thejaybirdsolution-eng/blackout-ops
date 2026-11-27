/* ============================================================================
   BLACKOUT OPS — Open World RPG · Act II–VI Expansion Quests, Companions & NG+
   Authoring full multi-path questlines across Regions 2–6 (Rust Sprawl,
   Mire Delta, Ash Quarry, Alpine Array, Meridian Core & Dragonwilds):
   - Combat / Tech-Stealth / Social paths on every quest
   - Deterministic skill/attribute checks (ADR-003)
   - Faction territory consequences, 3 recruitable Companions, NPC schedules
   Injected into OWRPGStatsData / OWRPGQuestsData / OWRPGDialogueData before
   OWRPGValidator.js executes so all graph & ref integrity checks pass (0 errs).
============================================================================ */
(function (BO) {
    'use strict';

    const SD = BO.OWRPGStatsData;
    const QD = BO.OWRPGQuestsData.QUESTS;
    const DD = BO.OWRPGDialogueData.TREES;

    /* ---------------------------------------------------- 1. Quest Items */
    Object.assign(SD.ITEMS, {
        dish_override_key: {
            id: 'dish_override_key',
            name: 'Dish Array Override Token',
            type: 'quest',
            weight: 0.2,
            value: 0,
            desc: 'Encrypted Aegis authorization shard used to realign Alpine Dish Ridge without triggering orbital lockdown.'
        },
        crate_cipher_chip: {
            id: 'crate_cipher_chip',
            name: 'Smuggler Rail Cipher Chip',
            type: 'quest',
            weight: 0.2,
            value: 0,
            desc: 'Syndicate manifest key linking Goliath Crane shipments to the Ash Quarry extraction rig.'
        },
        companion_signal_tag: {
            id: 'companion_signal_tag',
            name: 'Meridian Companion Transponder',
            type: 'quest',
            weight: 0.2,
            value: 0,
            desc: 'Encrypted short-range beacon synchronizing squadmate tactics across the Meridian Expanse.'
        }
    });

    /* ---------------------------------------------------- 2. Act II–VI Quests */
    Object.assign(QD, {
        q_act2_sprawl_signal: {
            name: 'Iron Frequency (Act II)',
            giver: 'mags',
            region: 'rust_sprawl',
            kind: 'main',
            summary: 'Trace the hijacked Goliath Crane relay inside Rust Sprawl and secure Syndicate telemetry for Act II.',
            stages: {
                investigate: {
                    text: 'Reach the Goliath Crane in Rust Sprawl and neutralize or bypass its Syndicate hijackers.',
                    marker: 'goliath',
                    on: {
                        'kill:syn_sniper': 'secure',
                        'flag:act2_crane_hacked': 'secure',
                        'flag:act2_crane_truce': 'secure'
                    }
                },
                secure: {
                    text: 'Report back to Mags Orrin at Ironclad Rail Yard.',
                    marker: 'rail_yard',
                    on: { 'flag:act2_sprawl_done': 'done' }
                },
                done: {
                    text: 'Rust Sprawl telemetry secured.',
                    autoComplete: 'combat'
                }
            },
            branches: {
                combat: {
                    label: 'Eliminated the Goliath sniper team',
                    xp: 380, credits: 260,
                    items: ['crate_cipher_chip'],
                    rep: { syndicate: -60, militia: 90 },
                    flags: ['act2_sprawl_complete']
                },
                tech: {
                    label: 'Spliced the Goliath crane transponder silently',
                    xp: 420, credits: 240,
                    items: ['crate_cipher_chip', 'relay_cell'],
                    rep: { militia: 60, aegis: 50 },
                    flags: ['act2_sprawl_complete', 'sprawl_stealth_clear']
                },
                social: {
                    label: 'Brokered an Ironclad data-sharing truce',
                    xp: 400, credits: 300,
                    items: ['crate_cipher_chip'],
                    rep: { syndicate: 140 },
                    flags: ['act2_sprawl_complete', 'sprawl_syndicate_truce']
                }
            }
        },

        q_act2_goliath_ledger: {
            name: 'Heavy Freight Ledger',
            giver: 'torin',
            region: 'rust_sprawl',
            kind: 'side',
            summary: 'Recover lost Militia ordnance manifests from the Smuggler Foundry Yard.',
            stages: {
                recover: {
                    text: 'Track stolen Militia freight in Smuggler Foundry Yard.',
                    marker: 'foundry_yard',
                    on: {
                        'kill:enforcer': 'return_torin',
                        'discover:foundry_yard': 'return_torin',
                        'flag:act2_ledger_bought': 'return_torin'
                    }
                },
                return_torin: {
                    text: 'Return the freight status to Quartermaster Torin in Freestead.',
                    marker: 'freestead',
                    on: { 'flag:act2_ledger_done': 'done' }
                },
                done: { text: 'Militia supply line restored.', autoComplete: 'combat' }
            },
            branches: {
                combat: { label: 'Reclaimed shipment by force', xp: 260, credits: 190, items: ['ammo_box'], rep: { militia: 110, syndicate: -70 }, flags: ['foundry_militia_raided'] },
                tech: { label: 'Copied digital ledger via terminal', xp: 280, credits: 160, items: ['relay_cell'], rep: { militia: 80 }, flags: ['foundry_copied'] },
                social: { label: 'Purchased amnesty manifest quietly', xp: 250, credits: 120, items: ['stim'], rep: { militia: 60, syndicate: 60 }, flags: ['foundry_amnesty'] }
            }
        },

        q_act3_mire_relay: {
            name: 'Spore Tide (Act III)',
            giver: 'lyra',
            region: 'mire_delta',
            kind: 'main',
            summary: 'Sample the mutated Cooling Stack brood in Mire Delta and neutralize the Mire Hydra threat.',
            stages: {
                collect: {
                    text: 'Clear Cooling Stack Nest or inspect the Sunken Cargo Barge for stabilized toxin readings.',
                    marker: 'mire_nest',
                    on: {
                        'kill:boss_mire_hydra': 'report',
                        'item:mire_toxin_sample': 'report',
                        'flag:act3_mire_purged': 'report',
                        'flag:act3_mire_bribe': 'report'
                    }
                },
                report: {
                    text: 'Deliver the Mire Delta findings to Dr. Lyra Chen at Quarry Dig Camp.',
                    marker: 'quarry_camp',
                    on: { 'flag:act3_mire_done': 'done' }
                },
                done: { text: 'Mire Delta telemetry delivered.', autoComplete: 'combat' }
            },
            branches: {
                combat: { label: 'Slew the Mire Hydra apex brood', xp: 520, credits: 360, items: ['elixir_wisdom'], rep: { aegis: 120, militia: 70 }, flags: ['act3_mire_complete'] },
                tech: { label: 'Triggered sonic bio-scrubber on Sunken Barge', xp: 540, credits: 320, items: ['w_p90_arc'], rep: { aegis: 140 }, flags: ['act3_mire_complete', 'mire_scrubbed'] },
                social: { label: 'Traded anti-venom formula with Sister Calla', xp: 500, credits: 340, items: ['elixir_swallow'], rep: { helix: 110, aegis: 60 }, flags: ['act3_mire_complete', 'mire_helix_accord'] }
            }
        },

        q_act3_coven_cure: {
            name: 'Bitter Antidote',
            giver: 'ines',
            region: 'mire_delta',
            kind: 'side',
            summary: 'Secure clean bog reagents from Witch Coven Bog before infection spreads to Freestead.',
            stages: {
                gather: {
                    text: 'Visit Witch Coven Bog in Mire Delta to secure reagents.',
                    marker: 'coven_hut',
                    on: {
                        'kill:mire_witch': 'return_ines',
                        'discover:coven_hut': 'return_ines',
                        'flag:act3_coven_trade': 'return_ines'
                    }
                },
                return_ines: {
                    text: 'Bring reagent telemetry back to Medic Ines in Freestead.',
                    marker: 'freestead',
                    on: { 'flag:act3_coven_done': 'done' }
                },
                done: { text: 'Antidote stock synthesized.', autoComplete: 'combat' }
            },
            branches: {
                combat: { label: 'Dispersed the Coven & seized vials', xp: 340, credits: 220, items: ['medkit', 'elixir_swallow'], rep: { militia: 100, helix: -60 }, flags: ['coven_purged'] },
                tech: { label: 'Extracted pure distillate via analyzer', xp: 360, credits: 240, items: ['elixir_swallow'], rep: { militia: 90, aegis: 50 }, flags: ['coven_distilled'] },
                social: { label: 'Negotiated medicinal herb swap', xp: 350, credits: 200, items: ['medkit'], rep: { militia: 80, helix: 80 }, flags: ['coven_accord'] }
            }
        },

        q_act4_quarry_breach: {
            name: 'Ash & Iron (Act IV)',
            giver: 'vance',
            region: 'ash_quarry',
            kind: 'main',
            summary: 'Break the deadlock in Ash Quarry, defeat the Excavator Pit Colossus, and stabilize frontline control.',
            stages: {
                assault: {
                    text: 'Enter Excavator Pit and dismantle the Colossus threat or claim Quarry control.',
                    marker: 'quarry_pit',
                    on: {
                        'kill:boss_quarry_colossus': 'report',
                        'flag:act4_quarry_hacked': 'report',
                        'flag:act4_quarry_pact': 'report'
                    }
                },
                report: {
                    text: 'Report Ash Quarry status to Lt. Imre Vance at Checkpoint K-4.',
                    marker: 'checkpoint',
                    on: { 'flag:act4_quarry_done': 'done' }
                },
                done: { text: 'Ash Quarry secured.', autoComplete: 'combat' }
            },
            branches: {
                combat: { label: 'Destroyed the Quarry Colossus', xp: 680, credits: 460, items: ['w_scar_aegis'], rep: { aegis: 150, syndicate: -90 }, flags: ['act4_quarry_complete', 'quarry_aegis_hold'] },
                tech: { label: 'Overloaded seismic excavator pylons', xp: 710, credits: 420, items: ['relay_cell', 'aegis_blackbox'], rep: { aegis: 120, militia: 80 }, flags: ['act4_quarry_complete', 'quarry_militia_hold'] },
                social: { label: 'Partitioned quarry ore rights peacefully', xp: 690, credits: 520, items: ['quarry_core_sample'], rep: { syndicate: 130, aegis: 90 }, flags: ['act4_quarry_complete', 'quarry_syndicate_hold'] }
            }
        },

        q_act4_deep_vein: {
            name: 'Deep-Vein Extraction',
            giver: 'mags',
            region: 'ash_quarry',
            kind: 'side',
            summary: 'Investigate seismic blasts in Deep-Vein Minehead for rare Syndicate alloys.',
            stages: {
                probe: {
                    text: 'Scout Deep-Vein Minehead in Ash Quarry.',
                    marker: 'quarry_minehead',
                    on: {
                        'kill:brood_iron_goliath': 'return_mags',
                        'discover:quarry_minehead': 'return_mags',
                        'flag:act4_vein_dealt': 'return_mags'
                    }
                },
                return_mags: {
                    text: 'Report ore survey to Mags Orrin.',
                    marker: 'rail_yard',
                    on: { 'flag:act4_vein_done': 'done' }
                },
                done: { text: 'Deep-Vein route charted.', autoComplete: 'combat' }
            },
            branches: {
                combat: { label: 'Cleared Iron Goliath from shaft', xp: 450, credits: 320, items: ['scrap_metal', 'circuitry'], rep: { syndicate: 110 }, flags: ['deep_vein_cleared'] },
                tech: { label: 'Mapped fault line with seismic scan', xp: 470, credits: 300, items: ['circuitry'], rep: { aegis: 90, syndicate: 60 }, flags: ['deep_vein_mapped'] },
                social: { label: 'Sold exclusive drilling claim', xp: 460, credits: 420, items: ['stim'], rep: { syndicate: 140 }, flags: ['deep_vein_sold'] }
            }
        },

        q_act5_alpine_uplink: {
            name: 'Skyline Silent (Act V)',
            giver: 'vance',
            region: 'alpine_array',
            kind: 'main',
            summary: 'Cleanse Deep-Space Dish Ridge in Alpine Array and unlock the real Act V uplink for Meridian Core.',
            stages: {
                dish: {
                    text: 'Reclaim Deep-Space Dish Ridge and deal with the Alpine Warden.',
                    marker: 'dish_ridge',
                    on: {
                        'kill:boss_alpine_warden': 'debrief',
                        'item:dish_override_key': 'debrief',
                        'flag:act5_dish_negotiated': 'debrief'
                    }
                },
                debrief: {
                    text: 'Transmit uplink keys to Lt. Imre Vance at Checkpoint K-4.',
                    marker: 'checkpoint',
                    on: { 'flag:act5_alpine_done': 'done' }
                },
                done: { text: 'Alpine Array aligned toward Meridian Core.', autoComplete: 'combat' }
            },
            branches: {
                combat: { label: 'Defeated the Alpine Warden atop Dish Ridge', xp: 860, credits: 580, items: ['w_acr_specops'], rep: { aegis: 180, helix: -80 }, flags: ['act5_alpine_complete', 'alpine_aegis_secured'] },
                tech: { label: 'Injected stealth override key into Dish Array', xp: 900, credits: 520, items: ['dish_override_key', 'w_mp7_ghost'], rep: { aegis: 150 }, flags: ['act5_alpine_complete', 'alpine_aegis_secured', 'dish_ghost_hack'] },
                social: { label: 'Shared orbital telemetry with Helix observers', xp: 880, credits: 600, items: ['helix_cipher'], rep: { aegis: 100, helix: 130 }, flags: ['act5_alpine_complete', 'alpine_shared_link'] }
            }
        },

        q_act5_blacklab_purge: {
            name: 'Black-Site Sublevel Protocol',
            giver: 'sola',
            region: 'alpine_array',
            kind: 'side',
            summary: 'Recover cold-fusion stabilizers from Aegis Black-Site Perimeter.',
            stages: {
                reach: {
                    text: 'Locate cold-fusion lockboxes at Aegis Black-Site Perimeter.',
                    marker: 'blacklab_surface',
                    on: {
                        'kill:aegis_cryo': 'return_sola',
                        'discover:blacklab_surface': 'return_sola',
                        'flag:act5_blacklab_accord': 'return_sola'
                    }
                },
                return_sola: {
                    text: 'Bring schematics to Engineer Sola in Freestead.',
                    marker: 'freestead',
                    on: { 'flag:act5_blacklab_done': 'done' }
                },
                done: { text: 'Stabilizer specs logged.', autoComplete: 'combat' }
            },
            branches: {
                combat: { label: 'Breached Black-Site perimeter', xp: 580, credits: 390, items: ['circuitry', 'relay_cell'], rep: { militia: 110, aegis: -90 }, flags: ['blacklab_breached'] },
                tech: { label: 'Spoofed cryo lockdown remotely', xp: 610, credits: 360, items: ['w_p90_arc'], rep: { militia: 90, aegis: 80 }, flags: ['blacklab_spoofed'] },
                social: { label: 'Secured licensed Aegis transfer', xp: 590, credits: 410, items: ['relay_cell'], rep: { aegis: 120, militia: 70 }, flags: ['blacklab_licensed'] }
            }
        },

        q_act6_meridian_finale: {
            name: 'Crown of Meridian (Act VI Finale)',
            giver: 'calla',
            region: 'meridian_core',
            kind: 'main',
            summary: 'Enter the Meridian Containment Dome, resolve the Meridian Sovereign crisis, and shape the future of the Expanse.',
            stages: {
                breach: {
                    text: 'Reach the Meridian Containment Dome in Meridian Core and confront the Meridian Sovereign.',
                    marker: 'meridian_dome',
                    on: {
                        'kill:boss_meridian_sovereign': 'converge',
                        'item:sovereign_core': 'converge',
                        'flag:act6_harmonic_pact': 'converge'
                    }
                },
                converge: {
                    text: 'Return to Sister Calla at Helix Bloom Shrine to finalize Meridian Core settlement.',
                    marker: 'helix_shrine',
                    on: { 'flag:act6_meridian_done': 'done' }
                },
                done: { text: 'Operation Meridian Finale resolved. New Game+ unlocked.', autoComplete: 'combat' }
            },
            branches: {
                combat: { label: 'Shattered the Meridian Sovereign', xp: 1400, credits: 1000, items: ['w_raygun_proto', 'sovereign_core'], rep: { militia: 200, aegis: 200 }, flags: ['meridian_act6_complete', 'ending_shattered'] },
                tech: { label: 'Reprogrammed containment lattice', xp: 1450, credits: 950, items: ['w_tesla_coil', 'sovereign_core'], rep: { aegis: 220, syndicate: 120 }, flags: ['meridian_act6_complete', 'ending_contained'] },
                social: { label: 'Harmonized Meridian Core & Helix Shrine', xp: 1420, credits: 1100, items: ['w_f2000_helix'], rep: { helix: 250, militia: 140 }, flags: ['meridian_act6_complete', 'ending_harmonized'] }
            }
        },

        q_act6_dragon_pact: {
            name: 'Ashes of the Crater',
            giver: 'eryndor',
            region: 'obsidian_dragonwilds',
            kind: 'side',
            summary: 'Survey Obsidian Vault Threshold for Dragonwild resonance stabilizing Meridian Core.',
            stages: {
                survey: {
                    text: 'Reach Obsidian Vault Threshold or defeat an Ashen Drake.',
                    marker: 'dragon_citadel_gate',
                    on: {
                        'discover:dragon_citadel_gate': 'return_eryndor',
                        'kill:boss_abyssal_archon': 'return_eryndor',
                        'flag:act6_dragon_sealed': 'return_eryndor'
                    }
                },
                return_eryndor: {
                    text: 'Report findings to Scholar Eryndor at Dragonbone Outpost.',
                    marker: 'dragonbone_outpost',
                    on: { 'flag:act6_dragon_done': 'done' }
                },
                done: { text: 'Crater resonance documented.', autoComplete: 'combat' }
            },
            branches: {
                combat: { label: 'Purged the Obsidian Vault gatekeepers', xp: 980, credits: 720, items: ['elixir_thunderbolt'], rep: { aegis: 150, militia: 110 }, flags: ['dragonwild_purged'] },
                tech: { label: 'Deployed obsidian frequency dampener', xp: 1020, credits: 680, items: ['relay_cell', 'elixir_wisdom'], rep: { aegis: 180 }, flags: ['dragonwild_dampened'] },
                social: { label: 'Preserved ancient archive for joint study', xp: 1000, credits: 760, items: ['helix_cipher'], rep: { helix: 160, aegis: 120 }, flags: ['dragonwild_archive'] }
            }
        }
    });

    /* ---------------------------------------------------- 3. Dialogue Injection */
    function injectTree(npcId, hubChoices, extraNodes) {
        const t = DD[npcId];
        if (!t || !t.nodes || !t.nodes.hub) return;
        const hub = t.nodes.hub;
        hub.choices = [...hubChoices, ...hub.choices];
        Object.assign(t.nodes, extraNodes);
    }

    // Rust Sprawl + Ash Quarry Minehead: Mags
    injectTree('mags', [
        { text: '[ACT II] "Need intel on Rust Sprawl & Goliath Crane?"', req: { quest: ['q_act2_sprawl_signal', 'inactive'] }, next: 'act2_offer' },
        { text: '[ACT II] "Goliath Crane telemetry is ready." (Complete Act II)', req: { stage: ['q_act2_sprawl_signal', 'secure'] }, next: 'act2_turnin' },
        { text: '[SIDE] "Anything new near Deep-Vein Minehead?"', req: { quest: ['q_act4_deep_vein', 'inactive'] }, next: 'vein_offer' },
        { text: '[SIDE] "Deep-Vein ore survey is done."', req: { stage: ['q_act4_deep_vein', 'return_mags'] }, next: 'vein_turnin' },
        { text: '[COMPANION] "Send Tinker Torque with me for field support."', req: { flag: 'act2_sprawl_complete', notFlag: 'comp_torque_recruited' }, next: 'recruit_torque' }
    ], {
        act2_offer: {
            text: "Goliath Crane's signal tower is broadcasting junk cipher into my rail switches. Take out their sniper nest, spoof the dish, or negotiate a Syndicate data split — your call.",
            choices: [
                { text: '"I\'ll handle Goliath Crane."', next: 'END', fx: { startQuest: 'q_act2_sprawl_signal' } },
                { text: '[TCH 6] "I can bypass the crane array remotely if you give me the rail cipher."', req: { attr: ['TCH', 6] }, next: 'END', fx: { startQuest: 'q_act2_sprawl_signal', setFlag: 'act2_crane_hacked', grantItem: 'crate_cipher_chip', xp: 60 } },
                { text: '[PRS 6] "Tell your spotters to stand down — we split the salvage."', req: { attr: ['PRS', 6] }, next: 'END', fx: { startQuest: 'q_act2_sprawl_signal', setFlag: 'act2_crane_truce', xp: 60 } },
                { text: '"Maybe later."', next: 'hub' }
            ]
        },
        act2_turnin: {
            text: "Clean signal across the tracks again. How did you settle it up on the crane?",
            choices: [
                { text: '"Dropped the hijackers cleanly."', next: 'END', fx: { complete: ['q_act2_sprawl_signal', 'combat'], setFlag: 'act2_sprawl_done' } },
                { text: '[TCH 6] "Rewired the dish silently without firing a shot."', req: { attr: ['TCH', 6] }, next: 'END', fx: { complete: ['q_act2_sprawl_signal', 'tech'], setFlag: 'act2_sprawl_done' } },
                { text: '[PRS 6] "Cut a revenue deal with their crew."', req: { attr: ['PRS', 6] }, next: 'END', fx: { complete: ['q_act2_sprawl_signal', 'social'], setFlag: 'act2_sprawl_done' } }
            ]
        },
        vein_offer: {
            text: "Deep-Vein Minehead in Ash Quarry has been shaking my railcars loose. Clear out the Iron Goliath down there or bring me a seismic read.",
            choices: [
                { text: '"I\'ll check Deep-Vein Minehead."', next: 'END', fx: { startQuest: 'q_act4_deep_vein' } },
                { text: '"Not right now."', next: 'hub' }
            ]
        },
        vein_turnin: {
            text: "You're back from Deep-Vein in one piece. How should we file the claim?",
            choices: [
                { text: '"Cleared the tunnel brood by force."', next: 'END', fx: { complete: ['q_act4_deep_vein', 'combat'], setFlag: 'act4_vein_done' } },
                { text: '[TCH 7] "Brought back fault-line telemetry."', req: { attr: ['TCH', 7] }, next: 'END', fx: { complete: ['q_act4_deep_vein', 'tech'], setFlag: 'act4_vein_done' } },
                { text: '[PRS 7] "Sold exclusive Syndicate drilling rights."', req: { attr: ['PRS', 7] }, next: 'END', fx: { complete: ['q_act4_deep_vein', 'social'], setFlag: 'act4_vein_done' } }
            ]
        },
        recruit_torque: {
            text: "Tinker Torque's drone rig is already primed. Treat him right — his field patches keep operatives breathing and abilities cycling faster.",
            choices: [
                { text: '"Welcome aboard, Torque."', next: 'END', fx: { setFlag: 'comp_torque_recruited', grantItem: 'companion_signal_tag' } }
            ]
        }
    });

    // Torin: Act II Side + Companion Soren
    injectTree('torin', [
        { text: '[SIDE] "Missing freight out at the Smuggler Foundry?"', req: { quest: ['q_act2_goliath_ledger', 'inactive'] }, next: 'ledger_offer' },
        { text: '[SIDE] "Foundry ledger update ready."', req: { stage: ['q_act2_goliath_ledger', 'return_torin'] }, next: 'ledger_turnin' },
        { text: '[COMPANION] "Assign Vanguard Soren to my squad."', req: { notFlag: 'comp_soren_recruited' }, next: 'recruit_soren' }
    ], {
        ledger_offer: {
            text: "Smugglers hauled three crates of Militia plates into the Foundry Yard. Hit them, clone their manifest, or buy them quiet.",
            choices: [
                { text: '"I\'ll recover it."', next: 'END', fx: { startQuest: 'q_act2_goliath_ledger' } },
                { text: '"Hold off for now."', next: 'hub' }
            ]
        },
        ledger_turnin: {
            text: "Good work near the Foundry. What's the verdict?",
            choices: [
                { text: '"Took the ordnance back head-on."', next: 'END', fx: { complete: ['q_act2_goliath_ledger', 'combat'], setFlag: 'act2_ledger_done' } },
                { text: '[TCH 5] "Cloned the shipping ledger without raising alarm."', req: { attr: ['TCH', 5] }, next: 'END', fx: { complete: ['q_act2_goliath_ledger', 'tech'], setFlag: 'act2_ledger_done' } },
                { text: '[PRS 5] "Paid an amnesty broker to reroute it."', req: { attr: ['PRS', 5] }, next: 'END', fx: { complete: ['q_act2_goliath_ledger', 'social'], setFlag: 'act2_ledger_done' } }
            ]
        },
        recruit_soren: {
            text: "Vanguard Soren is itching to get out of the yard. His heavy plating draws fire and shaves damage off everyone close by.",
            choices: [
                { text: '"Soren, fall in."', next: 'END', fx: { setFlag: 'comp_soren_recruited', grantItem: 'companion_signal_tag' } }
            ]
        }
    });

    // Lyra: Act III Mire Delta
    injectTree('lyra', [
        { text: '[ACT III] "Ready to tackle Cooling Stack Nest & the Mire?"', req: { quest: ['q_act3_mire_relay', 'inactive'] }, next: 'act3_offer' },
        { text: '[ACT III] "Here is the Mire Delta spore data."', req: { stage: ['q_act3_mire_relay', 'report'] }, next: 'act3_turnin' }
    ], {
        act3_offer: {
            text: "Spore output in Mire Delta spiked overnight. Neutralize the Mire Hydra at Cooling Stack Nest, purge the Sunken Barge scrubber, or broker an anti-venom swap.",
            choices: [
                { text: '"Deploying to Mire Delta."', next: 'END', fx: { startQuest: 'q_act3_mire_relay' } },
                { text: '[TCH 7] "Load the sonic scrubber bypass code onto my Pip-Pad."', req: { attr: ['TCH', 7] }, next: 'END', fx: { startQuest: 'q_act3_mire_relay', setFlag: 'act3_mire_purged', xp: 75 } },
                { text: '"Later, Doctor."', next: 'hub' }
            ]
        },
        act3_turnin: {
            text: "These spore metrics are remarkable. How did you handle the delta?",
            choices: [
                { text: '"Put the Mire Hydra down for good."', next: 'END', fx: { complete: ['q_act3_mire_relay', 'combat'], setFlag: 'act3_mire_done' } },
                { text: '[TCH 7] "Sterilized the water via the Sunken Barge scrubbers."', req: { attr: ['TCH', 7] }, next: 'END', fx: { complete: ['q_act3_mire_relay', 'tech'], setFlag: 'act3_mire_done' } },
                { text: '[PRS 7] "Coordinated Helix botanical cultures."', req: { attr: ['PRS', 7] }, next: 'END', fx: { complete: ['q_act3_mire_relay', 'social'], setFlag: 'act3_mire_done' } }
            ]
        }
    });

    // Ines: Act III Side Coven Cure
    injectTree('ines', [
        { text: '[SIDE] "Need reagents from Witch Coven Bog?"', req: { quest: ['q_act3_coven_cure', 'inactive'] }, next: 'coven_offer' },
        { text: '[SIDE] "I have the Coven Bog serum readings."', req: { stage: ['q_act3_coven_cure', 'return_ines'] }, next: 'coven_turnin' }
    ], {
        coven_offer: {
            text: "The swamp witches hoard clean bog distillates that stabilize field stims. Seize, distill, or bargain for a sample.",
            choices: [
                { text: '"I\'ll head to the Coven Bog."', next: 'END', fx: { startQuest: 'q_act3_coven_cure' } },
                { text: '"Another time."', next: 'hub' }
            ]
        },
        coven_turnin: {
            text: "My synthesizer is ready. How did you pull the reagent?",
            choices: [
                { text: '"Cleared the bog and confiscated the vials."', next: 'END', fx: { complete: ['q_act3_coven_cure', 'combat'], setFlag: 'act3_coven_done' } },
                { text: '[TCH 6] "Distilled a sterile micro-sample cleanly."', req: { attr: ['TCH', 6] }, next: 'END', fx: { complete: ['q_act3_coven_cure', 'tech'], setFlag: 'act3_coven_done' } },
                { text: '[PRS 6] "Traded clean bandages for surplus stock."', req: { attr: ['PRS', 6] }, next: 'END', fx: { complete: ['q_act3_coven_cure', 'social'], setFlag: 'act3_coven_done' } }
            ]
        }
    });

    // Vance: Act IV Quarry + Act V Dish Ridge + Companion Kael
    injectTree('vance', [
        { text: '[ACT IV] "Give me orders for Ash Quarry & the Colossus."', req: { quest: ['q_act4_quarry_breach', 'inactive'] }, next: 'act4_offer' },
        { text: '[ACT IV] "Ash Quarry situation resolved."', req: { stage: ['q_act4_quarry_breach', 'report'] }, next: 'act4_turnin' },
        { text: '[ACT V] "Brief me on Alpine Array & Dish Ridge."', req: { quest: ['q_act5_alpine_uplink', 'inactive'] }, next: 'act5_offer' },
        { text: '[ACT V] "Dish Ridge uplink telemetry secured."', req: { stage: ['q_act5_alpine_uplink', 'debrief'] }, next: 'act5_turnin' },
        { text: '[COMPANION] "Assign Ghost Kael to cover my flanks."', req: { notFlag: 'comp_kael_recruited' }, next: 'recruit_kael' }
    ], {
        act4_offer: {
            text: "Excavator Pit is crawling with heavy iron mutants and fighting between Syndicate and Militia squads. Break the Colossus or stabilize the quarry.",
            choices: [
                { text: '"Heading to Ash Quarry now."', next: 'END', fx: { startQuest: 'q_act4_quarry_breach' } },
                { text: '"Check back soon."', next: 'hub' }
            ]
        },
        act4_turnin: {
            text: "Ash Quarry seismic monitors settled down. Who holds the pit now?",
            choices: [
                { text: '"Aegis holds it — Colossus destroyed."', next: 'END', fx: { complete: ['q_act4_quarry_breach', 'combat'], setFlag: 'act4_quarry_done' } },
                { text: '[TCH 7] "Rerouted seismic pylons to Militia grid."', req: { attr: ['TCH', 7] }, next: 'END', fx: { complete: ['q_act4_quarry_breach', 'tech'], setFlag: 'act4_quarry_done' } },
                { text: '[PRS 7] "Syndicate & Aegis agreed on split shifts."', req: { attr: ['PRS', 7] }, next: 'END', fx: { complete: ['q_act4_quarry_breach', 'social'], setFlag: 'act4_quarry_done' } }
            ]
        },
        act5_offer: {
            text: "The Alpine Warden locked Deep-Space Dish Ridge before we could lock Meridian Core's frequency. Take the ridge or slip my override shard into the console.",
            choices: [
                { text: '"On my way to Dish Ridge."', next: 'END', fx: { startQuest: 'q_act5_alpine_uplink' } },
                { text: '[TCH 8] "Give me the override shard — I\'ll ghost the array."', req: { attr: ['TCH', 8] }, next: 'END', fx: { startQuest: 'q_act5_alpine_uplink', grantItem: 'dish_override_key' } },
                { text: '"Standing by."', next: 'hub' }
            ]
        },
        act5_turnin: {
            text: "Orbital lock acquired. How did Dish Ridge fall?",
            choices: [
                { text: '"Warden eliminated. Dish Ridge is Aegis airspace."', next: 'END', fx: { complete: ['q_act5_alpine_uplink', 'combat'], setFlag: 'act5_alpine_done' } },
                { text: '[TCH 8] "Flashed the override key into the main dish."', req: { attr: ['TCH', 8] }, next: 'END', fx: { complete: ['q_act5_alpine_uplink', 'tech'], setFlag: 'act5_alpine_done' } },
                { text: '[PRS 8] "Opened shared bandwidth to Helix monitors."', req: { attr: ['PRS', 8] }, next: 'END', fx: { complete: ['q_act5_alpine_uplink', 'social'], setFlag: 'act5_alpine_done' } }
            ]
        },
        recruit_kael: {
            text: "Ghost Kael is our sharpest recon marksman. He spots targets at range and pushes your weakspot multipliers higher.",
            choices: [
                { text: '"Kael, link comms with me."', next: 'END', fx: { setFlag: 'comp_kael_recruited', grantItem: 'companion_signal_tag' } }
            ]
        }
    });

    // Sola: Act V Blacklab Side
    injectTree('sola', [
        { text: '[SIDE] "Tell me about the Aegis Black-Site cold-fusion lockboxes."', req: { quest: ['q_act5_blacklab_purge', 'inactive'] }, next: 'blacklab_offer' },
        { text: '[SIDE] "Black-Site telemetry logged."', req: { stage: ['q_act5_blacklab_purge', 'return_sola'] }, next: 'blacklab_turnin' }
    ], {
        blacklab_offer: {
            text: "Up at Aegis Black-Site Perimeter in the Alpine foothills, there's cryo-stabilizer tech Freestead badly needs. Breaching, spoofing, or negotiating — get us those specs.",
            choices: [
                { text: '"I\'ll retrieve them."', next: 'END', fx: { startQuest: 'q_act5_blacklab_purge' } },
                { text: '"Wait on that."', next: 'hub' }
            ]
        },
        blacklab_turnin: {
            text: "Telemetry looks solid! How did you clear the Black-Site perimeter?",
            choices: [
                { text: '"Fought through their cryo detail."', next: 'END', fx: { complete: ['q_act5_blacklab_purge', 'combat'], setFlag: 'act5_blacklab_done' } },
                { text: '[TCH 7] "Spoofed the perimeter terminal cleanly."', req: { attr: ['TCH', 7] }, next: 'END', fx: { complete: ['q_act5_blacklab_purge', 'tech'], setFlag: 'act5_blacklab_done' } },
                { text: '[PRS 7] "Convinced the garrison to license it."', req: { attr: ['PRS', 7] }, next: 'END', fx: { complete: ['q_act5_blacklab_purge', 'social'], setFlag: 'act5_blacklab_done' } }
            ]
        }
    });

    // Calla: Act VI Meridian Core Finale
    injectTree('calla', [
        { text: '[ACT VI FINALE] "I am ready to confront the Meridian Containment Dome."', req: { quest: ['q_act6_meridian_finale', 'inactive'] }, next: 'act6_offer' },
        { text: '[ACT VI FINALE] "The Meridian Sovereign crisis is settled."', req: { stage: ['q_act6_meridian_finale', 'converge'] }, next: 'act6_turnin' }
    ], {
        act6_offer: {
            text: "The Meridian Sovereign wakes inside the Containment Dome. You can shatter its core, rewrite its containment lattice, or harmonize its pulse with the Helix.",
            choices: [
                { text: '"I\'ll enter Meridian Containment Dome."', next: 'END', fx: { startQuest: 'q_act6_meridian_finale' } },
                { text: '[PRS 8] "Teach me the Helix harmonic chant before I go."', req: { attr: ['PRS', 8] }, next: 'END', fx: { startQuest: 'q_act6_meridian_finale', setFlag: 'act6_harmonic_pact', xp: 120 } },
                { text: '"I need more preparation."', next: 'hub' }
            ]
        },
        act6_turnin: {
            text: "The Expanse itself exhales. What future did you choose for Meridian Core?",
            choices: [
                { text: '"Shattered the Sovereign forever. Humanity walks free."', next: 'END', fx: { complete: ['q_act6_meridian_finale', 'combat'], setFlag: 'act6_meridian_done' } },
                { text: '[TCH 8] "Contained the lattice under precision lockdown."', req: { attr: ['TCH', 8] }, next: 'END', fx: { complete: ['q_act6_meridian_finale', 'tech'], setFlag: 'act6_meridian_done' } },
                { text: '[PRS 8] "Harmonized Meridian & the Helix Shrine."', req: { attr: ['PRS', 8] }, next: 'END', fx: { complete: ['q_act6_meridian_finale', 'social'], setFlag: 'act6_meridian_done' } }
            ]
        }
    });

    // Eryndor: Dragonwilds Side
    injectTree('eryndor', [
        { text: '[SIDE] "What stirs at the Obsidian Vault Threshold?"', req: { quest: ['q_act6_dragon_pact', 'inactive'] }, next: 'dragon_offer' },
        { text: '[SIDE] "Vault Threshold scan complete."', req: { stage: ['q_act6_dragon_pact', 'return_eryndor'] }, next: 'dragon_turnin' }
    ], {
        dragon_offer: {
            text: "Abyssal resonance bleeds out of the Obsidian Vault Threshold. Purge its guardians, place a dampener, or preserve the ancient runes.",
            choices: [
                { text: '"I\'ll survey the Threshold."', next: 'END', fx: { startQuest: 'q_act6_dragon_pact' } },
                { text: '"Not today."', next: 'hub' }
            ]
        },
        dragon_turnin: {
            text: "Remarkable work near the Crater! How shall I log your methodology?",
            choices: [
                { text: '"Fought past the Obsidian gatekeepers."', next: 'END', fx: { complete: ['q_act6_dragon_pact', 'combat'], setFlag: 'act6_dragon_done' } },
                { text: '[TCH 8] "Stabilized resonance with a tech dampener."', req: { attr: ['TCH', 8] }, next: 'END', fx: { complete: ['q_act6_dragon_pact', 'tech'], setFlag: 'act6_dragon_done' } },
                { text: '[PRS 8] "Brokered joint Helix-Aegis archive preservation."', req: { attr: ['PRS', 8] }, next: 'END', fx: { complete: ['q_act6_dragon_pact', 'social'], setFlag: 'act6_dragon_done' } }
            ]
        }
    });

    /* ---------------------------------------------------- 4. Companions, Schedules & Territory */
    BO.OWRPGAct2 = {
        COMPANIONS: {
            soren: {
                id: 'soren',
                name: 'Vanguard Soren',
                role: 'Frontline Shieldbearer',
                faction: 'militia',
                flag: 'comp_soren_recruited',
                color: '#f5a623',
                weapon: 'm4a1_tech',
                dmgMult: 1.0,
                range: 34,
                cooldown: 1.05,
                auraLabel: '+12% Damage Resistance',
                aura: { dmgReduce: 0.12 },
                blurb: 'Freestead heavy vanguard. Draws aggression and bolsters nearby armor defense.'
            },
            kael: {
                id: 'kael',
                name: 'Ghost Kael',
                role: 'Aegis Recon Marksman',
                faction: 'aegis',
                flag: 'comp_kael_recruited',
                color: '#38bdf8',
                weapon: 'mk14',
                dmgMult: 1.25,
                range: 52,
                cooldown: 1.4,
                auraLabel: '+15% Weakspot Multiplier',
                aura: { critBonus: 0.15 },
                blurb: 'Alpine sniper operative. Picks off distant elites and sharpens tactical targeting.'
            },
            torque: {
                id: 'torque',
                name: 'Tinker Torque',
                role: 'Syndicate Tech Specialist',
                faction: 'syndicate',
                flag: 'comp_torque_recruited',
                color: '#a3e635',
                weapon: 'p90',
                dmgMult: 0.9,
                range: 28,
                cooldown: 0.85,
                auraLabel: '+15% Ability Haste & Field Regen',
                aura: { cdBonus: 0.15, regenPerSec: 2.0 },
                blurb: 'Rail Yard engineer. Accelerates Primer/Detonator cycles and repairs micro-wounds.'
            }
        },
        SCHEDULES: [
            { start: 600, end: 1199, id: 'morning', label: 'Dawn Shift · Vendors stocked & patrols deploying' },
            { start: 1200, end: 1899, id: 'day', label: 'Midday · Full frontier traffic & scouting' },
            { start: 1900, end: 2399, id: 'night', label: 'Nightfall · Settlements fortified & nocturnal brood active' },
            { start: 0, end: 599, id: 'night', label: 'Deep Night · Reduced visibility · stealth advantage' }
        ],
        TERRITORY_SHIFTS: [
            { flag: 'sprawl_syndicate_truce', poi: 'goliath', owner: 'syndicate', desc: 'Syndicate & Militia share Goliath Crane salvage' },
            { flag: 'quarry_aegis_hold', poi: 'quarry_camp', owner: 'aegis', desc: 'Aegis Directorate fortifies Quarry Dig Camp' },
            { flag: 'quarry_militia_hold', poi: 'quarry_camp', owner: 'militia', desc: 'Freestead Militia secures Quarry Dig Camp' },
            { flag: 'quarry_syndicate_hold', poi: 'quarry_camp', owner: 'syndicate', desc: 'Ironclad Syndicate runs Quarry ore logistics' },
            { flag: 'alpine_aegis_secured', poi: 'dish_ridge', owner: 'aegis', desc: 'Aegis holds Deep-Space Dish Ridge uplink' }
        ]
    };
})(window.BO);
