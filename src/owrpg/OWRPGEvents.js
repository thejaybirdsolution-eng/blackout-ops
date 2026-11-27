/* ============================================================================
   BLACKOUT OPS — Open World RPG · Dynamic World Events (8 Event Types)
   Spawns timed dynamic events near the player while exploring the Meridian
   Expanse: Supply Drop, Faction Skirmish, Brood Swarm, Convoy Raid, Void
   Anomaly Storm, Relay Defense, Rogue Mecha, Black-Market Cache.
============================================================================ */
(function (BO) {
    'use strict';

    const EVENT_TYPES = [
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
                if (aliveHostiles === 0) {
                    this._complete(ev);
                    return;
                }
                if (ev.t <= 0 || inside || BO.Math.dist2D(P.pos.x, P.pos.z, ev.x, ev.z) > 210) {
                    BO.OWRPGMode.toast(`World Event ended: ${ev.title}`, '#94a3b8');
                    this.clear();
                    this.cooldown = 75;
                }
                return;
            }

            if (inside || BO.OWRPGAI.agents.length > 14) return;
            this.cooldown -= dt;
            if (this.cooldown <= 0) {
                this.spawnNearPlayer();
                this.cooldown = 115;
            }
        },

        spawnNearPlayer(forcedId = null) {
            const P = BO.Player;
            const D = BO.OWRPGWorldData;
            const reg = D.regionAt(P.pos.x, P.pos.z);
            const ang = Math.random() * Math.PI * 2;
            const dist = 52 + Math.random() * 24;
            const x = BO.Math.clamp(P.pos.x + Math.cos(ang) * dist, D.BOUNDS.minX + 24, D.BOUNDS.maxX - 24);
            const z = BO.Math.clamp(P.pos.z + Math.sin(ang) * dist, D.BOUNDS.minZ + 24, D.BOUNDS.maxZ - 24);
            if (BO.World.terrainHeight(x, z) < D.WATER + 0.3 || BO.Math.dist2D(x, z, D.TOWN.x, D.TOWN.z) < 55) return null;

            const def = forcedId ? (EVENT_TYPES.find((e) => e.id === forcedId) || EVENT_TYPES[0]) : this._pickForRegion(reg.id);
            const id = 'evt_' + (++this._n);
            const agents = [];
            def.enemies.forEach((eid, i) => {
                const a = BO.OWRPGAI.spawn(eid, x + (i % 2) * 4 - 2, z + Math.floor(i / 2) * 4 - 2, { poiId: id, leash: 75, postR: 8 });
                if (a) agents.push(a);
            });
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
                id: def.id, title: def.title, desc: def.desc, color: def.color,
                x, z, t: def.dur, maxT: def.dur, agents, beacon, def,
                total: agents.filter((a) => a.hostile).length,
                remaining: agents.filter((a) => a.hostile).length
            };
            BO.Events.emit('hud:banner', { title: 'WORLD EVENT', sub: `${def.title} — ${Math.round(dist)}m away`, color: def.color });
            return this.activeEvent;
        },

        _pickForRegion(regId) {
            const byReg = {
                haven_basin: ['supply_drop', 'convoy_raid', 'brood_swarm'],
                rust_sprawl: ['faction_skirmish', 'black_market', 'convoy_raid'],
                mire_delta: ['brood_swarm', 'supply_drop', 'relay_defense'],
                ash_quarry: ['faction_skirmish', 'rogue_mecha', 'supply_drop'],
                alpine_array: ['rogue_mecha', 'relay_defense', 'supply_drop'],
                meridian_core: ['void_storm', 'rogue_mecha', 'black_market']
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
            this.activeEvent = null;
            this.cooldown = 95;
        }
    };

    BO.OWRPGEvents = Events;
})(window.BO);
