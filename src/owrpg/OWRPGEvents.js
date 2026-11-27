/* ============================================================================
   BLACKOUT OPS — Open World RPG · Dynamic World Events (18 Regional Event Types)
   Spawns timed dynamic events near the player while exploring the Meridian
   Expanse: Supply Drop, Faction Skirmish, Brood Swarm, Convoy Raid, Void
   Anomaly Storm, Relay Defense, Rogue Mecha, Black-Market Cache.
============================================================================ */
(function (BO) {
    'use strict';

    const EVENT_TYPES = [
        { id: 'pinewood_rescue', title: 'Pinewood Rescue Signal', color: '#4ade80', dur: 130, enemies: ['forest_poacher', 'orc_reaver'], goal: 'hold', hold: 35, loot: 'raider', xp: 290, credits: 170, desc: 'Stay within 12 m of the signal for 35 seconds to finish the rescue uplink.' },
        { id: 'wolf_migration', title: 'Moonlit Wolf Migration', color: '#86efac', dur: 160, enemies: ['timber_wolf', 'timber_wolf'], goal: 'waves', waves: 3, loot: 'brood', xp: 360, credits: 180, desc: 'Survive three approaching wolf packs.' },
        { id: 'grave_procession', title: 'Procession of the Restless', color: '#c4b5fd', dur: 190, enemies: ['skeleton_warrior', 'grave_zombie', 'barrow_ghost'], goal: 'waves', waves: 3, loot: 'undead', xp: 640, credits: 320, desc: 'Break three waves of the grave procession.' },
        { id: 'blood_moon', title: 'Blood-Moon Hunt', color: '#fb7185', dur: 130, enemies: ['blood_vampire', 'crypt_keeper'], loot: 'undead', xp: 540, credits: 290, desc: 'Defeat the Nightlord and its keeper before the blood-moon window closes.' },
        { id: 'sunfang_survey', title: 'Sunfang Survey Beacon', color: '#fbbf24', dur: 160, enemies: ['sunfang_guardian', 'dune_scorpion'], goal: 'hold', hold: 45, loot: 'locked', xp: 760, credits: 380, desc: 'Hold the 12 m survey ring for 45 seconds while constructs converge.' },
        { id: 'tidal_incursion', title: 'Corsair Tidefall', color: '#22d3ee', dur: 200, enemies: ['drowned_corsair', 'abyssal_siren'], goal: 'waves', waves: 3, loot: 'undead', xp: 890, credits: 420, desc: 'Repel three waves of the drowned tide.' },
        { id: 'frost_resonance', title: 'Frostspire Resonance', color: '#7dd3fc', dur: 170, enemies: ['frost_knight', 'frost_wyrmling'], goal: 'hold', hold: 50, loot: 'aegis', xp: 1150, credits: 540, desc: 'Remain near the resonance beacon for 50 seconds to stabilize the glacier.' },
        { id: 'glacier_hunt', title: 'Glacier Colossus Hunt', color: '#e0f2fe', dur: 140, enemies: ['glacier_troll', 'glacier_troll'], loot: 'locked', xp: 1250, credits: 600, desc: 'Bring down both ice-trolls before they leave the hunting grounds.' },
        { id: 'dragonwild_siege', title: 'Ashfall Siege', color: '#fb923c', dur: 240, enemies: ['ashen_drake', 'obsidian_cultist', 'dragonwild_juggernaut'], goal: 'waves', waves: 3, loot: 'dragon', xp: 1900, credits: 850, desc: 'Withstand three assault waves from the Dragonwilds.' },
        { id: 'gilded_hoard', title: 'The Gilded Hoard', color: '#fde047', dur: 90, enemies: ['treasure_puglin', 'puglin_scamp', 'puglin_scamp'], loot: 'locked', xp: 420, credits: 480, desc: 'Defeat the golden hoarder and recover its guarded cache.' },
        { id: 'supply_drop', title: 'Orbital Supply Drop', color: '#38bdf8', dur: 110, enemies: ['raider', 'raider_pyro', 'raider_bruiser'], loot: 'locked', xp: 240, credits: 160, desc: 'Eliminate scavengers guarding the supply pod.' },
        { id: 'faction_skirmish', title: 'Faction Skirmish', color: '#f5a623', dur: 110, enemies: ['militia', 'militia_scout', 'enforcer', 'syn_gunner'], loot: 'syndicate', xp: 260, credits: 180, desc: 'Intervene in the firefight between Militia and Syndicate.' },
        { id: 'brood_swarm', title: 'Brood Swarm Surge', color: '#84cc16', dur: 100, enemies: ['crawler', 'brood_venom_mite', 'stalker', 'brood_blight_hound'], loot: 'brood', xp: 250, credits: 140, desc: 'Purge the surging Brood pack.' },
        { id: 'convoy_raid', title: 'Convoy Ambush', color: '#ef4444', dur: 110, enemies: ['raider', 'raider_marksman', 'raider_bruiser'], loot: 'cache', xp: 230, credits: 170, desc: 'Drive off raiders ambushing the supply convoy.' },
        { id: 'void_storm', title: 'Void Anomaly Storm', color: '#c084fc', dur: 120, enemies: ['helix_voidweaver', 'brood_void_stalker', 'helix_zealot'], loot: 'helix', xp: 340, credits: 240, desc: 'Close the Void rift by defeating its guardians.' },
        { id: 'relay_defense', title: 'Relay Surge Defense', color: '#facc15', dur: 100, enemies: ['syn_arc_tech', 'enforcer', 'brood_blight_hound'], loot: 'aegis', xp: 290, credits: 210, desc: 'Eliminate the disruptor squad jamming the relay.' },
        { id: 'rogue_mecha', title: 'Rogue Aegis Patrol', color: '#60a5fa', dur: 120, enemies: ['aegis', 'aegis_heavy', 'aegis_cryo'], loot: 'aegis', xp: 360, credits: 260, desc: 'Disable the malfunctioning Aegis heavy squad.' },
        { id: 'black_market', title: 'Black-Market Stash', color: '#fbbf24', dur: 110, enemies: ['enforcer', 'syn_sniper', 'syn_arc_tech'], loot: 'locked', xp: 310, credits: 250, desc: 'Defeat the Syndicate smugglers and seize their cache.' }
    ];

    const Events = {
        types: EVENT_TYPES,
        activeEvent: null,
        cooldown: 55,
        _n: 0,

        reset() {
            this.clear();
            this.cooldown = 55;
        },

        clear() {
            if (this.activeEvent) {
                if (this.activeEvent.beacon) this.activeEvent.beacon.removeFromParent();
                for (const a of this.activeEvent.agents) {
                    if (BO.OWRPGAI.agents.includes(a)) BO.OWRPGAI.despawn(a);
                }
                this.activeEvent = null;
            }
        },

        tick(dt) {
            const s = BO.OWRPGMode.state;
            const P = BO.Player;
            if (!s || !P.alive) return;
            const inside = BO.OWRPGWorldData.isInterior(P.pos.x, P.pos.z);

            if (this.activeEvent) {
                const ev = this.activeEvent;
                ev.t -= dt;
                if (ev.beacon) ev.beacon.rotation.y += dt * 1.8;
                const aliveHostiles = ev.agents.filter((a) => a.alive && a.hostile).length;
                ev.remaining = aliveHostiles;
                const distance = BO.Math.dist2D(P.pos.x, P.pos.z, ev.x, ev.z);
                if (ev.def.goal === 'hold') {
                    if (!inside && distance <= 12) ev.progress += dt;
                    ev.desc = ev.def.desc + ' · ' + Math.floor(ev.progress) + '/' + ev.def.hold + 's';
                    if (ev.progress >= ev.def.hold) { this._complete(ev); return; }
                } else if (aliveHostiles === 0) {
                    if (ev.def.goal === 'waves' && ev.wave < ev.def.waves) {
                        for (const a of ev.agents) if (BO.OWRPGAI.agents.includes(a)) BO.OWRPGAI.despawn(a);
                        ev.wave++;
                        ev.agents = this._spawnSquad(ev.def, ev.x, ev.z, 'evt_' + (++this._n));
                        ev.total = ev.remaining = ev.agents.length;
                        ev.desc = ev.def.desc + ' · Wave ' + ev.wave + '/' + ev.def.waves;
                        BO.OWRPGMode.toast('Wave ' + ev.wave + ' incoming', ev.color);
                    } else { this._complete(ev); return; }
                }
                if (ev.t <= 0 || inside || BO.Math.dist2D(P.pos.x, P.pos.z, ev.x, ev.z) > 210) {
                    BO.OWRPGMode.toast(`World Event ended: ${ev.title}`, '#94a3b8');
                    this.clear();
                    this.cooldown = 75;
                }
                return;
            }

            if (inside || BO.OWRPGAI.agents.filter(a => a.alive).length > 14) return;
            this.cooldown -= dt;
            if (this.cooldown <= 0) {
                this.spawnNearPlayer();
                this.cooldown = 115;
            }
        },

        spawnNearPlayer(forcedId = null) {
            const P = BO.Player;
            const D = BO.OWRPGWorldData;
            if (this.activeEvent || D.isInterior(P.pos.x, P.pos.z)) return null;
            const reg = D.regionAt(P.pos.x, P.pos.z);
            const ang = Math.random() * Math.PI * 2;
            const dist = 52 + Math.random() * 24;
            const x = BO.Math.clamp(P.pos.x + Math.cos(ang) * dist, D.BOUNDS.minX + 24, D.BOUNDS.maxX - 24);
            const z = BO.Math.clamp(P.pos.z + Math.sin(ang) * dist, D.BOUNDS.minZ + 24, D.BOUNDS.maxZ - 24);
            if (BO.World.terrainHeight(x, z) < D.WATER + 0.3 || BO.Math.dist2D(x, z, D.TOWN.x, D.TOWN.z) < 55) return null;

            const def = forcedId ? (EVENT_TYPES.find((e) => e.id === forcedId) || EVENT_TYPES[0]) : this._pickForRegion(reg.id);
            const id = 'evt_' + (++this._n);
            const agents = this._spawnSquad(def, x, z, id);
            if (!agents.length) return null;

            const y = BO.World.terrainHeight(x, z);
            const beacon = new THREE.Group();
            const pillar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.18, 0.28, 16, 8),
                new THREE.MeshBasicMaterial({ color: new THREE.Color(def.color), transparent: true, opacity: 0.45, fog: false })
            );
            pillar.position.y = 8;
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(1.4, 0.09, 6, 20),
                new THREE.MeshBasicMaterial({ color: new THREE.Color(def.color), fog: false })
            );
            ring.rotation.x = Math.PI / 2;
            ring.position.y = 1.2;
            beacon.add(pillar, ring);
            beacon.position.set(x, y, z);
            BO.World.scene.add(beacon);

            this.activeEvent = {
                progress: 0, wave: 1,
                id: def.id, title: def.title, desc: def.desc, color: def.color,
                x, z, t: def.dur, maxT: def.dur, agents, beacon, def,
                total: agents.filter((a) => a.hostile).length,
                remaining: agents.filter((a) => a.hostile).length
            };
            BO.Events.emit('hud:banner', { title: 'WORLD EVENT', sub: `${def.title} — ${Math.round(dist)}m away`, color: def.color });
            return this.activeEvent;
        },

        _spawnSquad(def, x, z, id) {
            return def.enemies.map((eid, i) => {
                const a = BO.OWRPGAI.spawn(eid, x + (i % 2)*5 - 2.5, z + Math.floor(i / 2)*5 - 2.5, { poiId: id, leash: 80, postR: 8 });
                if (a) {
                    // Event squads are explicit adversaries even when their parent faction is friendly.
                    a.eventHostile = true; a.hostile = true;
                    BO.OWRPGAI.engage(a);
                }
                return a;
            }).filter(Boolean);
        },

        _pickForRegion(regId) {
            const byReg = {
                haven_basin: ['supply_drop', 'convoy_raid', 'brood_swarm'],
                rust_sprawl: ['faction_skirmish', 'black_market', 'convoy_raid'],
                mire_delta: ['brood_swarm', 'supply_drop', 'relay_defense'],
                ash_quarry: ['faction_skirmish', 'rogue_mecha', 'supply_drop'],
                alpine_array: ['rogue_mecha', 'relay_defense', 'supply_drop'],
                meridian_core: ['void_storm', 'rogue_mecha', 'black_market'],
                whispering_woods: ['pinewood_rescue', 'wolf_migration', 'gilded_hoard'],
                barrow_moor: ['grave_procession', 'blood_moon'],
                sunscorched_badlands: ['sunfang_survey', 'gilded_hoard'],
                sunken_coast: ['tidal_incursion', 'black_market'],
                frostfang_peaks: ['frost_resonance', 'glacier_hunt'],
                obsidian_dragonwilds: ['dragonwild_siege', 'void_storm']
            };
            const pool = byReg[regId] || EVENT_TYPES.map((e) => e.id);
            const pickId = BO.Math.pick(pool);
            return EVENT_TYPES.find((e) => e.id === pickId) || EVENT_TYPES[0];
        },

        _complete(ev) {
            const s = BO.OWRPGMode.state;
            const def = ev.def;
            if (ev.beacon) ev.beacon.removeFromParent();
            BO.OWRPGMode.giveXp(def.xp, ev.title);
            s.player.credits += def.credits;
            s.stats.eventsCleared = (s.stats.eventsCleared || 0) + 1;
            const loot = BO.OWRPGInventory.rollLoot(s, def.loot || 'cache', 3);
            BO.OWRPGInteriors.dropBag(new THREE.Vector3(ev.x, BO.World.terrainHeight(ev.x, ev.z), ev.z), loot);
            BO.Sound?.playQuestFanfare?.();
            BO.Events.emit('hud:banner', { title: 'EVENT CLEARED', sub: `${ev.title} · +${def.xp} XP · +${def.credits} cr`, color: '#4ade80' });
            this.clear();
            this.cooldown = 95;
        }
    };

    BO.OWRPGEvents = Events;
})(window.BO);
