/* ============================================================================
   BLACKOUT OPS — Open World RPG · Dialogue Trees (Base + Expansion NPCs & Quests)
   Preserves all _qa_owrpg.html paths (kessler, mags, etc.) while adding Torin,
   Dr. Lyra Chen, and all 11 new quests across the 6 regions.
============================================================================ */
(function (BO) {
    'use strict';

    const q = (ctx, id) => ctx.quest(id);
    const active = (ctx, id) => q(ctx, id).state === 'active';

    const TREES = {
        /* ------------------------------------------------------------ KESSLER */
        kessler: {
            name: 'Warden Kessler',
            entry: (ctx) => {
                if (ctx.flags.kessler_betrayed) return 'hostile_bark';
                const qa = q(ctx, 'q_dry_artery');
                if (qa.state === 'inactive' && (ctx.flags.culvert_valve_pulled || ctx.flags.junction_rerouted || ctx.flags.mags_shutoff)) return 'prefixed';
                if (qa.state === 'inactive') return 'intro_1';
                if (qa.state === 'active' && qa.stage === 'report') return 'turnin';
                return 'hub';
            },
            nodes: {
                intro_1: {
                    text: "Pump Three went dead at dawn. The Syndicate swears they didn't cap the line, which means someone planted a bypass down in the culvert. Haven has four days of water in the cisterns. Maybe five if we stop washing.",
                    choices: [
                        { text: '[PRC 7] (Notice the clay on his boots) "You already went down there. What chased you out?"', req: { attr: ['PRC', 7] }, next: 'admit_brood', fx: { xp: 45, setFlag: 'kessler_read' } },
                        { text: '[TCH 6] "Give me the pressure schematics. I can reroute from the surface junction."', req: { attr: ['TCH', 6] }, next: 'schematic_grant', fx: { grantItem: 'pressure_schematic', xp: 45, startQuest: 'q_dry_artery' } },
                        { text: '"How much is working water worth to Haven?"', next: 'negotiate_pay' },
                        { text: '"I\'ll check the culvert."', next: 'accept_std', fx: { startQuest: 'q_dry_artery' } }
                    ]
                },
                admit_brood: {
                    text: "...Brood. A nest of them in the lower tunnel, and something big under the water that the little ones feed. I lost Tamsin down there and I'm not sending another ranger. If you go, take the keycard and don't be a hero near the flooded chamber.",
                    choices: [{ text: '"I\'ll handle it." (Take the keycard)', next: 'accept_std', fx: { grantItem: 'culvert_keycard', startQuest: 'q_dry_artery' } }]
                },
                schematic_grant: {
                    text: "You can read these? Then you're worth more than half my rangers. The junction box is on the east face of the pumphouse. Reroute the main line and the bypass starves. Nobody has to go below.",
                    choices: [{ text: '"Consider it done."', next: 'END', fx: { grantItem: 'culvert_keycard' } }]
                },
                negotiate_pay: {
                    text: 'Haven pays in credits, beds and a name people remember. Two hundred if the water runs by sundown. And if you find out who planted that bypass, I want to know.',
                    choices: [
                        { text: '[PRS 6] "Make it two-fifty. You need this more than I do."', req: { attr: ['PRS', 6] }, next: 'accept_std', fx: { setFlag: 'kessler_bonus', startQuest: 'q_dry_artery', grantItem: 'culvert_keycard', xp: 30 } },
                        { text: '"Deal."', next: 'accept_std', fx: { startQuest: 'q_dry_artery', grantItem: 'culvert_keycard' } }
                    ]
                },
                accept_std: {
                    text: "The pumphouse is east of the gate. Follow the dirt road toward the overpass and look for the concrete block with the pipes. Watch for raiders on the way. They've been bold since the rains.",
                    choices: [{ text: '(Leave)', next: 'END' }]
                },
                prefixed: {
                    text: "The cistern gauges jumped an hour ago. Folks are dancing in the wash-house. Rangers say a drifter went into the culvert alone. That was you, wasn't it? Haven owes you before I even had the chance to ask.",
                    choices: [{ text: '"Just passing through. The water seemed important."', next: 'turnin', fx: { startQuest: 'q_dry_artery', stage: ['q_dry_artery', 'report'] } }]
                },
                turnin: {
                    text: 'Well? Is Pump Three flowing?',
                    choices: [
                        { text: '"The bypass is pulled. The thing guarding it is dead." (Hand over the valve)', req: { flag: 'culvert_valve_pulled' }, next: 'thanks', fx: { takeItem: 'bypass_valve', complete: ['q_dry_artery', 'combat'] } },
                        { text: '"I rerouted the main line at the junction. The bypass is starved."', req: { flag: 'junction_rerouted' }, next: 'thanks', fx: { complete: ['q_dry_artery', 'reroute'] } },
                        { text: '"The Syndicate planted it. Here are their books." (Give the ledger)', req: { item: 'syndicate_ledger' }, next: 'ledger', fx: { takeItem: 'syndicate_ledger', complete: ['q_dry_artery', 'exposed'] } },
                        { text: '"I talked Mags Orrin into shutting it off herself."', req: { flag: 'mags_shutoff' }, next: 'thanks_dip', fx: { complete: ['q_dry_artery', 'diplomacy'] } },
                        { text: '"Not yet."', next: 'END' }
                    ]
                },
                thanks: {
                    text: "Then Haven drinks tonight. Here: what I promised, and a Relay Cell from the stores. Those pylons the old world left will carry you if you can find them powered. And there is something else, when you're ready. Ask me about the signal.",
                    choices: [{ text: '"Tell me about the signal."', next: 'signal' }, { text: '(Leave)', next: 'END' }]
                },
                thanks_dip: {
                    text: "You walked into the rail yard and talked? Either you're a fool or the best negotiator in the Basin. The water's back, and nobody died for it. Haven won't forget. Ask me about the signal when you have a moment.",
                    choices: [{ text: '"Tell me about the signal."', next: 'signal' }, { text: '(Leave)', next: 'END' }]
                },
                ledger: {
                    text: "Payments to 'culvert labour', signed by Orrin's own clerk. They wanted us thirsty enough to buy water by the barrel. The council will hear about this, and so will every trader on the rail. You've done the Basin a real service.",
                    choices: [{ text: '"Tell me about the signal."', next: 'signal' }, { text: '(Leave)', next: 'END' }]
                },
                signal: {
                    text: "Since the rains, Mast Alpha has been picking up a carrier wave out of the Meridian crater. It's a pattern, not noise. Aegis has a checkpoint on the alpine road and they won't answer our hails. Find out what they know, or go see the dome yourself.",
                    choices: [
                        { text: '"I\'ll look into it."', req: { quest: ['q_meridian_signal', 'inactive'] }, next: 'END', fx: { startQuest: 'q_meridian_signal' } },
                        { text: '(Leave)', next: 'END' }
                    ]
                },
                hub: {
                    text: (ctx) => active(ctx, 'q_dry_artery') ? 'The cisterns are dropping. What do you need?' : 'Ranger. Haven stands because of people like you. What is it?',
                    choices: [
                        { text: '"Where\'s the pumphouse again?"', req: { quest: ['q_dry_artery', 'active'] }, next: 'accept_std' },
                        { text: '"Any work for a gun?" (Raider bounty)', req: { quest: ['q_overpass_bounty', 'inactive'] }, next: 'bounty' },
                        { text: '"Vasko is dead."', req: { stage: ['q_overpass_bounty', 'report'] }, next: 'bounty_done', fx: { complete: ['q_overpass_bounty', 'killed'] } },
                        { text: '"What\'s happening in Ash Quarry?"', req: { quest: ['q_quarry_titans', 'inactive'], quest2: undefined }, next: 'quarry_offer' },
                        { text: '"The Ash Quarry Colossus is dead."', req: { stage: ['q_quarry_titans', 'report'] }, next: 'quarry_done', fx: { complete: ['q_quarry_titans', 'slain'] } },
                        { text: '"Tell me about the Meridian Sovereign."', req: { quest: ['q_meridian_signal', 'completed'], quest2: undefined }, next: 'sovereign_offer' },
                        { text: '"The Meridian Sovereign has fallen."', req: { stage: ['q_sovereign_hunt', 'report'] }, next: 'sovereign_done', fx: { complete: ['q_sovereign_hunt', 'triumph'] } },
                        { text: '"Tell me about the signal."', req: { quest: ['q_dry_artery', 'completed'] }, next: 'signal' },
                        { text: '(Leave)', next: 'END' }
                    ]
                },
                bounty: {
                    text: "A raider who calls himself the Gutter King has taken the old overpass south of town. Two hundred credits for his head, plus whatever gear he hoards.",
                    choices: [{ text: '"I\'ll take the contract."', next: 'END', fx: { startQuest: 'q_overpass_bounty' } }, { text: '"Not now."', next: 'END' }]
                },
                bounty_done: { text: 'The caravans will be glad to hear it. Clean work — take this Nomad Lever 1887 from our armory.', choices: [{ text: '(Leave)', next: 'END' }] },
                quarry_offer: {
                    text: "Miners out of Ash Quarry say tremors woke something massive inside Excavator Pit — a walking furnace they call the Ash Colossus. Put it down before it reaches the Basin road.",
                    choices: [
                        { text: '"I\'ll hunt it down."', req: { quest: ['q_quarry_titans', 'inactive'] }, next: 'END', fx: { startQuest: 'q_quarry_titans' } },
                        { text: '"Maybe later."', next: 'END' }
                    ]
                },
                quarry_done: { text: 'You brought down a Quarry Colossus? Take this Breaching Hammer and KSG slug gun. You earned them.', choices: [{ text: '(Leave)', next: 'END' }] },
                sovereign_offer: {
                    text: "Scouts report an apex entity nesting inside the Meridian Containment Dome — the Sovereign. If you clear the crater, Torin has an Aegis War Strider chassis ready to imprint to your callsign.",
                    choices: [
                        { text: '"I\'ll end the Sovereign."', req: { quest: ['q_sovereign_hunt', 'inactive'] }, next: 'END', fx: { startQuest: 'q_sovereign_hunt' } },
                        { text: '"I need better gear first."', next: 'END' }
                    ]
                },
                sovereign_done: { text: "The Basin is finally safe from the crater's heart. The War Strider is yours, Ranger.", choices: [{ text: '(Leave)', next: 'END' }] },
                hostile_bark: { text: 'You sold us to the rail barons. Get out of my sight before the rangers decide what you\'re worth.', choices: [{ text: '(Leave)', next: 'END' }] }
            }
        },

        /* ------------------------------------------------------------ DOTTIE */
        dottie: {
            name: 'Dottie Vail',
            entry: () => 'hub',
            nodes: {
                hub: {
                    text: "Dottie's Supply. If it shoots, heals, or bolts onto your rig, I've either got it or I know who stole it. Prices go down for friends of Haven.",
                    choices: [
                        { text: '(Trade)', next: 'END', fx: { vendor: 'freestead_store' } },
                        { text: '"What are Relay Cells for?"', next: 'cells' },
                        { text: '(Leave)', next: 'END' }
                    ]
                },
                cells: {
                    text: "Old-world batteries. A charged pylon will throw you across the Basin, one cell a jump. You have to wake each pylon by hand first.",
                    choices: [{ text: '"Good to know."', next: 'hub' }]
                }
            }
        },

        /* ------------------------------------------------------------ INES */
        ines: {
            name: 'Medic Ines',
            entry: (ctx) => {
                const s = q(ctx, 'q_shale_nest');
                if (s.state === 'active' && s.stage === 'report') return 'nest_done';
                return 'hub';
            },
            nodes: {
                hub: {
                    text: 'Sit, if you are bleeding. If you are not bleeding, you are blocking my light.',
                    choices: [
                        { text: '"Patch me up." (Restore health)', next: 'healed', fx: { heal: 9999 } },
                        { text: '"Something has you worried."', req: { quest: ['q_shale_nest', 'inactive'] }, next: 'nest_offer' },
                        { text: '"I want to rethink my training." (Respec perks)', next: 'END', fx: { respec: 1 } },
                        { text: '(Leave)', next: 'END' }
                    ]
                },
                healed: { text: 'There. Try to keep the holes on the outside this time.', choices: [{ text: '(Leave)', next: 'END' }] },
                nest_offer: {
                    text: "Three children came in this week with brood fever. All of them had been near the shale cave on the western ridge. Burn the egg sacs, all three, before they hatch.",
                    choices: [
                        { text: '[PRC 6] "Fever spreads from the sacs\' spores, not the bites. Close quarters only, then."', req: { attr: ['PRC', 6] }, next: 'nest_tip', fx: { xp: 30, startQuest: 'q_shale_nest', grantItem: 'medkit' } },
                        { text: '"I\'ll burn them."', next: 'END', fx: { startQuest: 'q_shale_nest' } }
                    ]
                },
                nest_tip: { text: 'Exactly right. Take this injector, and hold your breath when they pop.', choices: [{ text: '(Leave)', next: 'END' }] },
                nest_done: {
                    text: 'The fever broke in all three last night. Thank you.',
                    choices: [{ text: '"Glad they\'re safe."', next: 'END', fx: { complete: ['q_shale_nest', 'burned'] } }]
                }
            }
        },

        /* ------------------------------------------------------------ SOLA */
        sola: {
            name: 'Engineer Sola',
            entry: (ctx) => {
                const s = q(ctx, 'q_relay_light');
                if (s.state === 'active' && s.stage === 'report') return 'relay_done';
                return 'hub';
            },
            nodes: {
                hub: {
                    text: "Mind the solder. If you're here to tell me the relay is still dark, I know. I can see it from the roof.",
                    choices: [
                        { text: '"What\'s wrong with the relay?"', req: { quest: ['q_relay_light', 'inactive'] }, next: 'relay_offer' },
                        { text: '"Where would I find a fuse?"', req: { quest: ['q_relay_light', 'active'] }, next: 'fuse_hint' },
                        { text: '(Leave)', next: 'END' }
                    ]
                },
                relay_offer: {
                    text: "The Abandoned Relay on the western ridge blew its fuse in the storm. Relit, it powers the pylon beside it. Aegis convoys carried spare fuses — one went down north of here.",
                    choices: [{ text: '"I\'ll get the relay running."', next: 'END', fx: { startQuest: 'q_relay_light' } }]
                },
                fuse_hint: { text: 'Crashed convoy, north of town by the crossroads. Or jury-rig the panel with TCH 5.', choices: [{ text: '(Leave)', next: 'END' }] },
                relay_done: {
                    text: "I heard the outer farms on the band an hour ago! You've earned this, and the pylon out there is live now.",
                    choices: [{ text: '"Happy to help."', next: 'END', fx: { complete: ['q_relay_light', 'lit'] } }]
                }
            }
        },

        /* ------------------------------------------------------------ TORIN (NEW) */
        torin: {
            name: 'Quartermaster Torin',
            entry: (ctx) => {
                if (active(ctx, 'q_scrap_wheels') && q(ctx, 'q_scrap_wheels').stage === 'report') return 'wheels_done';
                if (active(ctx, 'q_workbench_trials') && q(ctx, 'q_workbench_trials').stage === 'report') return 'trials_done';
                if (active(ctx, 'q_sunken_barge') && q(ctx, 'q_sunken_barge').stage === 'report') return 'barge_done';
                return 'hub';
            },
            nodes: {
                hub: {
                    text: "Grease, steel, and spare pistons — welcome to the Freestead Forge. Keep your guns maintained on the repair bench and let me know if you want wheels.",
                    choices: [
                        { text: '(Browse Forge, Tools & Mount Keys)', next: 'END', fx: { vendor: 'torin_bench' } },
                        { text: '"Can you build me a Scrap Scout Bike?"', req: { quest: ['q_scrap_wheels', 'inactive'] }, next: 'wheels_offer' },
                        { text: '"Got any field hardware to test?"', req: { quest: ['q_workbench_trials', 'inactive'] }, next: 'trials_offer' },
                        { text: '"Heard anything about salvage in Mire Delta?"', req: { quest: ['q_sunken_barge', 'inactive'] }, next: 'barge_offer' },
                        { text: '(Leave)', next: 'END' }
                    ]
                },
                wheels_offer: {
                    text: "I've got a half-built Scout Bike frame sitting by the palisade. Bring me Scrap Metal or scout the Crashed Convoy north of town for spare coils and I'll register it to you ([T] to mount).",
                    choices: [{ text: '"Consider it done."', next: 'END', fx: { startQuest: 'q_scrap_wheels' } }]
                },
                wheels_done: {
                    text: "Solid parts! Here are the ignition keys to your Scrap Scout Bike, plus a Field Repair Kit. Press [T] outside town to ride and [Shift] to boost.",
                    choices: [{ text: '"Time to ride."', next: 'END', fx: { complete: ['q_scrap_wheels', 'built'] } }]
                },
                trials_offer: {
                    text: "Raiders took over Goliath Crane down in Rust Sprawl. Go knock them off the tracks and I'll hand over a Scrap Flamer and a Warden SOPMOD M4.",
                    choices: [{ text: '"I\'ll test your hardware on them."', next: 'END', fx: { startQuest: 'q_workbench_trials' } }]
                },
                trials_done: {
                    text: "Clean field test! That Scrap Flamer and SOPMOD M4 are yours.",
                    choices: [{ text: '"Appreciate it."', next: 'END', fx: { complete: ['q_workbench_trials', 'done'] } }]
                },
                barge_offer: {
                    text: "A supply barge ran aground at the edge of Mire Delta. Check its hull for surviving plate gear and report back.",
                    choices: [{ text: '"I\'ll check the barge."', next: 'END', fx: { startQuest: 'q_sunken_barge' } }]
                },
                barge_done: {
                    text: "You made it out of the Mire alive! Take this Ironclad Siege Rig and Warden Trail Boots.",
                    choices: [{ text: '"Thanks, Torin."', next: 'END', fx: { complete: ['q_sunken_barge', 'salvaged'] } }]
                }
            }
        },

        /* ------------------------------------------------------------ MAGS */
        mags: {
            name: 'Mags Orrin',
            entry: (ctx) => {
                if (ctx.flags.mags_hostile) return 'hostile';
                if (active(ctx, 'q_rust_smugglers') && q(ctx, 'q_rust_smugglers').stage === 'report') return 'smugglers_done';
                return 'hub';
            },
            nodes: {
                hub: {
                    text: "Welcome to the Ironclad yard. Everything here is for sale, including the truth if you can afford it. What do you want?",
                    choices: [
                        { text: '(Trade)', next: 'END', fx: { vendor: 'syndicate_fence' } },
                        { text: '"Somebody bypassed Haven\'s Pump Three."', req: { quest: ['q_dry_artery', 'active'], notFlag: 'mags_talked' }, next: 'pump', fx: { setFlag: 'mags_talked' } },
                        { text: '"About Pump Three..."', req: { quest: ['q_dry_artery', 'active'], flag: 'mags_talked' }, next: 'pump' },
                        { text: '"Need help clearing the Goliath Crane tracks?"', req: { quest: ['q_rust_smugglers', 'inactive'] }, next: 'smugglers_offer' },
                        { text: '(Leave)', next: 'END' }
                    ]
                },
                pump: {
                    text: "Bypassed? Tragic. If Haven ever needs water I'll sell it by the barrel, at a fair rate. ...You don't look convinced. Fine. Say what you came to say.",
                    choices: [
                        { text: '[PRS 7] "Once Haven finds out, every caravan on the rail will boycott you. Shut it off and I\'ll say it was a fault."', req: { attr: ['PRS', 7] }, next: 'shutoff', fx: { setFlag: 'mags_shutoff', stage: ['q_dry_artery', 'report'], xp: 80 } },
                        { text: '[BRW 8] (Lean over her desk) "Shut it off. Now."', req: { attr: ['BRW', 8] }, next: 'shutoff_threat', fx: { setFlag: 'mags_shutoff', stage: ['q_dry_artery', 'report'], rep: { syndicate: -100 }, xp: 60 } },
                        { text: '[Syndicate Trusted] "We\'re on the same side. Turn it off as a favour to me."', req: { rep: ['syndicate', 250] }, next: 'shutoff', fx: { setFlag: 'mags_shutoff', stage: ['q_dry_artery', 'report'] } },
                        { text: '"What\'s it worth to you if Haven stays thirsty?"', next: 'deal' },
                        { text: '"Never mind."', next: 'END' }
                    ]
                },
                shutoff: { text: "...Fine. A 'fault.' I'll send a runner to close the line. You're wasted on that farm town, you know. Come see me when you want real money.", choices: [{ text: '(Leave)', next: 'END' }] },
                shutoff_threat: { text: 'Easy! Easy. It\'s off. Get your hands off my ledgers. And don\'t come back here unarmed.', choices: [{ text: '(Leave)', next: 'END' }] },
                deal: {
                    text: "Smart. Tell Kessler the culvert's a lost cause and the brood own it. Haven buys from me for a season, and you get three hundred credits plus a friend in the Syndicate.",
                    choices: [
                        { text: '"Deal." (Betray Haven)', next: 'deal_done', fx: { setFlag: 'kessler_betrayed', complete: ['q_dry_artery', 'betrayal'] } },
                        { text: '"No."', next: 'END' }
                    ]
                },
                deal_done: { text: "Pleasure. Stay away from Haven for a while. Kessler has a long memory and a short temper.", choices: [{ text: '(Leave)', next: 'END' }] },
                smugglers_offer: {
                    text: "Squatters and rogue deadeyes camped under Goliath Crane east of here. Clear them off my rail spur and I'll gift you a Nomad Hoverbike.",
                    choices: [{ text: '"Deal. I\'ll clear Goliath Crane."', next: 'END', fx: { startQuest: 'q_rust_smugglers' } }]
                },
                smugglers_done: {
                    text: "Tracks are clear and the rail rolls again. Here's your Nomad Hoverbike key.",
                    choices: [
                        { text: '"Pleasure doing business."', next: 'END', fx: { complete: ['q_rust_smugglers', 'enforced'] } },
                        { text: '[PRS 6] "Keep the peace with Haven caravans too."', req: { attr: ['PRS', 6] }, next: 'END', fx: { complete: ['q_rust_smugglers', 'haggled'] } }
                    ]
                },
                hostile: { text: 'You have some nerve showing your face here.', choices: [{ text: '(Leave)', next: 'END' }] }
            }
        },

        /* ------------------------------------------------------------ VANCE */
        vance: {
            name: 'Lt. Imre Vance',
            entry: (ctx) => {
                if (active(ctx, 'q_meridian_signal') && q(ctx, 'q_meridian_signal').stage === 'reach_array') return 'signal';
                if (active(ctx, 'q_alpine_rogue') && q(ctx, 'q_alpine_rogue').stage === 'report') return 'rogue_done';
                return 'hub';
            },
            nodes: {
                hub: {
                    text: 'Checkpoint K-4. Civilians turn around. You are not a civilian, I take it. State your business.',
                    choices: [
                        { text: '(Requisition gear)', next: 'END', fx: { vendor: 'aegis_quarter' } },
                        { text: '"I have your convoy manifest." (Give to Aegis)', req: { item: 'convoy_manifest' }, next: 'manifest', fx: { takeItem: 'convoy_manifest', complete: ['q_convoy_manifest', 'aegis'] } },
                        { text: '"What is happening up at Dish Ridge?"', req: { quest: ['q_alpine_rogue', 'inactive'] }, next: 'rogue_offer' },
                        { text: '"I have a Helix Harmonic Cipher if Aegis wants to copy it."', req: { item: 'helix_cipher', quest: ['q_helix_cipher', 'active'] }, next: 'cipher_aegis', fx: { takeItem: 'helix_cipher', complete: ['q_helix_cipher', 'studied'] } },
                        { text: '(Leave)', next: 'END' }
                    ]
                },
                manifest: { text: "The Kestrel convoy's manifest. Our cargo is still unaccounted for, but now we know where to look. The Directorate thanks you.", choices: [{ text: '(Leave)', next: 'END' }] },
                signal: {
                    text: "The carrier wave? We've logged it for six weeks. It's coming from inside the Containment Dome. The Helix say it's the Meridian waking up.",
                    choices: [
                        { text: '[TCH 7] "Let me see the logs. That\'s a handshake protocol, not a warning."', req: { attr: ['TCH', 7] }, next: 'logs', fx: { xp: 80, setFlag: 'signal_handshake', stage: ['q_meridian_signal', 'reach_dome'] } },
                        { text: '"I\'m going to the dome."', next: 'END', fx: { stage: ['q_meridian_signal', 'reach_dome'] } }
                    ]
                },
                logs: { text: "...A handshake. Something in there is waiting for an answer. Go. Report what you see, and for God's sake don't answer it.", choices: [{ text: '(Leave)', next: 'END' }] },
                rogue_offer: {
                    text: "Our automated defense mecha, Unit X-9, went rogue at Deep-Space Dish Ridge. Bring it down and you can commandeer our Armored ATV.",
                    choices: [{ text: '"I\'ll take down Unit X-9."', next: 'END', fx: { startQuest: 'q_alpine_rogue' } }]
                },
                rogue_done: {
                    text: "Outstanding work, operative. Unit X-9 is scrap and the Meridian Armored ATV is cleared for your callsign.",
                    choices: [{ text: '"Thank you, Lieutenant."', next: 'END', fx: { complete: ['q_alpine_rogue', 'destroyed'] } }]
                },
                cipher_aegis: {
                    text: "A Helix harmonic decryption key! Our cryptographers will neutralize their dome link. Take this Cryo ACR and Harmonic Coil.",
                    choices: [{ text: '(Leave)', next: 'END' }]
                }
            }
        },

        /* ------------------------------------------------------------ LYRA (NEW) */
        lyra: {
            name: 'Dr. Lyra Chen',
            entry: (ctx) => {
                if (active(ctx, 'q_mire_plague') && q(ctx, 'q_mire_plague').stage === 'report') return 'mire_done';
                if (active(ctx, 'q_alpine_blackbox') && q(ctx, 'q_alpine_blackbox').stage === 'report') return 'blackbox_done';
                if (active(ctx, 'q_quarry_truce') && q(ctx, 'q_quarry_truce').stage === 'report') return 'truce_done';
                return 'hub';
            },
            nodes: {
                hub: {
                    text: "Keep your visor sealed — ash and Meridian spores don't mix well. I'm logging anomalous bio-signatures across the Quarry, Mire, and Alpine ridges.",
                    choices: [
                        { text: '(Inspect Field Kit & Cryo Gear)', next: 'END', fx: { vendor: 'lyra_field' } },
                        { text: '"Tell me about the Mire Delta mutation."', req: { quest: ['q_mire_plague', 'inactive'] }, next: 'mire_offer' },
                        { text: '"How can we resolve the Quarry standoff?"', req: { quest: ['q_quarry_truce', 'inactive'] }, next: 'truce_offer' },
                        { text: '"Need anything from Bunker Delta?"', req: { quest: ['q_alpine_blackbox', 'inactive'] }, next: 'blackbox_offer' },
                        { text: '(Leave)', next: 'END' }
                    ]
                },
                mire_offer: {
                    text: "A colossal Brood organism — the Mire Plague Hydra — is saturating the delta with corrosive venom. Put it down at the Cooling Stack Nest and report back.",
                    choices: [{ text: '"I\'ll purge the Hydra."', next: 'END', fx: { startQuest: 'q_mire_plague' } }]
                },
                mire_done: {
                    text: "Bio-readings in the Mire just dropped by 70%! Take this Boreal AN-94 and the Matriarch Venom Heart.",
                    choices: [{ text: '"Glad to help, Doctor."', next: 'END', fx: { complete: ['q_mire_plague', 'slain'] } }]
                },
                truce_offer: {
                    text: "Militia and Syndicate are fighting over Excavator Pit blindly. Pull a Quarry Core Sample from the pit so we have hard mineral data.",
                    choices: [{ text: '"I\'ll grab the core sample."', next: 'END', fx: { startQuest: 'q_quarry_truce' } }]
                },
                truce_done: {
                    text: "This Quarry Core Sample proves the pit is unstable for heavy mining. Who should receive the survey?",
                    choices: [
                        { text: '"Publish it to both Militia and Syndicate to force a truce."', next: 'END', fx: { takeItem: 'quarry_core_sample', complete: ['q_quarry_truce', 'truce'] } },
                        { text: '"Hand it strictly to Aegis Directorate."', next: 'END', fx: { takeItem: 'quarry_core_sample', complete: ['q_quarry_truce', 'aegis_claim'] } }
                    ]
                },
                blackbox_offer: {
                    text: "An Aegis flight blackbox is still locked inside Bunker Delta in Alpine Array. Recover it and I'll give you my Arc-Tech Neural Cowl.",
                    choices: [{ text: '"I\'ll recover the blackbox."', next: 'END', fx: { startQuest: 'q_alpine_blackbox' } }]
                },
                blackbox_done: {
                    text: "The telemetry is intact! Here is the Arc-Tech Neural Cowl and Nano-Patch kit as promised.",
                    choices: [{ text: '"Pleasure working with you."', next: 'END', fx: { takeItem: 'aegis_blackbox', complete: ['q_alpine_blackbox', 'decoded'] } }]
                }
            }
        },

        /* ------------------------------------------------------------ CALLA */
        calla: {
            name: 'Sister Calla',
            entry: (ctx) => {
                if (active(ctx, 'q_helix_cipher') && q(ctx, 'q_helix_cipher').stage === 'report') return 'cipher_done';
                return 'hub';
            },
            nodes: {
                hub: {
                    text: 'The bloom is gentle today. Can you feel it humming in your teeth? The Meridian remembers everything, stranger, and it will remember you too.',
                    choices: [
                        { text: '(Exchange)', next: 'END', fx: { vendor: 'helix_exchange' } },
                        { text: '"I recovered an Aegis convoy manifest." (Give to Helix)', req: { item: 'convoy_manifest' }, next: 'manifest', fx: { takeItem: 'convoy_manifest', complete: ['q_convoy_manifest', 'helix'] } },
                        { text: '"What is the signal from the dome?"', req: { quest: ['q_meridian_signal', 'active'] }, next: 'signal' },
                        { text: '"Do the Helix need help in the Crater Rift?"', req: { quest: ['q_helix_cipher', 'inactive'] }, next: 'cipher_offer' },
                        { text: '(Leave)', next: 'END' }
                    ]
                },
                manifest: { text: "Aegis hid samples on that convoy, Meridian tissue, living. Now we know where they took them. The bloom will remember this.", choices: [{ text: '(Leave)', next: 'END' }] },
                signal: { text: "It's a lullaby turned the wrong way round. Walk into the crater and listen for yourself. Aegis will tell you to be afraid. Don't be.", choices: [{ text: '(Leave)', next: 'END' }] },
                cipher_offer: {
                    text: "Our Harmonic Cipher fell into the Crater Anomaly Rift east of the dome. Recover it for the Helix and the Void Staff is yours.",
                    choices: [{ text: '"I\'ll retrieve the cipher."', next: 'END', fx: { startQuest: 'q_helix_cipher' } }]
                },
                cipher_done: {
                    text: "The harmonic notes sing clearly again. Take the Meridian Void Staff with our blessing.",
                    choices: [{ text: '"May the bloom guide you."', next: 'END', fx: { takeItem: 'helix_cipher', complete: ['q_helix_cipher', 'blessed'] } }]
                }
            }
        }
    };

    BO.OWRPGDialogueData = { TREES };
})(window.BO);
