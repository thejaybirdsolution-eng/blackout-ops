/* ============================================================================
   BLACKOUT OPS — The Lantern: story, safehouses and field challenges
   Act 1 · Signal       — survive the crash, secure the ranger station, restore
                          the Relay mast, find the Haven survivors.
   Act 2 · Cartography  — repair three radio towers to triangulate the Lantern,
                          burn three nests to recover campus keycards.
   Act 3 · Breach       — open the campus, recover the research data, descend
                          into the Crater and decide the Lantern's fate.
   Also owns safehouses (respawn, workbench, fast travel) and field challenges.
============================================================================ */
(function (BO) {
    'use strict';

    const STEPS = [
        { id: 'wreck', act: 1, title: 'Search the helicopter wreck', hint: 'The wreck is right beside you. Look for the military crate.' },
        { id: 'reach', act: 1, title: 'Reach the ranger station in Relay Basin', hint: 'Follow the road north-east. The green-sided building by the trees.' },
        { id: 'secure', act: 1, title: 'Secure the ranger station', hint: 'Clear any infected within 25 m, then interact at the door.' },
        { id: 'mast', act: 1, title: 'Restore the Relay radio mast', hint: 'Bring 2 copper wire and 1 battery to the top of the mast on the hill west of the station.' },
        { id: 'haven', act: 1, title: 'Answer the broadcast: find Haven', hint: 'The survivors are in a sandbagged camp east of the mast.' },
        { id: 'towers', act: 2, title: 'Repair the three radio towers', hint: 'Pinebreak Forest, the Spillway dam and Frostline summit. Each needs 1 copper wire and 1 fuel.' },
        { id: 'keycards', act: 2, title: 'Burn three nests and recover the campus keycards', hint: 'Nests in Hollow Town and Pinebreak Forest. Burn them with a molotov or explosives — or 2 fuel and a light.' },
        { id: 'gate', act: 3, title: 'Open the Black Pine campus gate', hint: 'Bring the three keycards to the campus gate north of the Crater.' },
        { id: 'data', act: 3, title: 'Recover the Lantern research data', hint: 'Search the labs inside the campus walls.' },
        { id: 'lantern', act: 3, title: 'Descend into the Crater and reach the Lantern', hint: 'The beam marks the way. Radiation is extreme — bring filters.' },
        { id: 'done', act: 3, title: 'The Lantern has been decided', hint: '' }
    ];
    const ACT_NAMES = { 1: 'Act 1 · Signal', 2: 'Act 2 · Cartography', 3: 'Act 3 · Breach' };
    const fieldChallenges = [
        { id: 'trail', name: 'Scavenger', info: 'Gather eight resources, craft five items and search fifteen containers.', criteria: [['gatheredNodes', 8], ['crafted', 5], ['containers', 15]], reward: { rations: 2, cloth: 2, scrap: 3 }, xp: 110 },
        { id: 'base', name: 'Safe Haven', info: 'Build five pieces, rest in a field bed and stock a chest with four items.', criteria: [['built', 5], ['fieldRests', 1], ['storedItems', 4]], reward: { planks: 4, brick: 3, torch: 2 }, xp: 135 },
        { id: 'explorer', name: 'Surveyor', info: 'Discover five regions and six landmarks.', criteria: [['visited', 5], ['landmarks', 6]], reward: { fuel: 2, wire: 2, filter: 1 }, xp: 175 },
        { id: 'foundry', name: 'Ore to Iron', info: 'Mine four deposits and make two kiln recipes.', criteria: [['oreHarvests', 4], ['kilnJobs', 2]], reward: { ingot: 2, coal: 4 }, xp: 150 },
        { id: 'hunter', name: 'Night Watch', info: 'Defeat six infected at night.', criteria: [['nightKills', 6]], reward: { medkits: 2, torch: 3 }, xp: 175 },
        { id: 'gunsmith', name: 'Gunsmith', info: 'Hand-load ammunition twice and repair a weapon.', criteria: [['crafted_reload9', 1], ['crafted_makeGunkit', 1]], reward: { powder: 3, primers: 20, brass: 20 }, xp: 160 },
        { id: 'farmer', name: 'Zone Homestead', info: 'Harvest two garden crops, draw water twice and reel one salvage line haul.', criteria: [['cropsHarvested', 2], ['waterDrawn', 2], ['salvageHauls', 1]], reward: { stew: 2, freshWater: 2, aetherShard: 1 }, xp: 185 }
    ];

    class SurvivalObjectives {
        constructor(campaign) {
            this.campaign = campaign;
            this.mode = campaign.mode;
            this.kind = campaign.options.gameType;
            this.step = 0;
            this.secured = new Set();
            this.nests = new Set();
            this.keycards = 0;
            this.challenges = new Set();
            this.gateOpen = false;
            this.hasData = false;
            this.activeWave = [];
        }

        get freeplay() { return this.kind === 'freeplay'; }
        get current() { return STEPS[this.step] || STEPS[STEPS.length - 1]; }

        setup(snapshot) {
            if (snapshot) {
                this.step = snapshot.step || 0;
                this.secured = new Set(snapshot.secured || []);
                this.nests = new Set(snapshot.nests || []);
                this.keycards = snapshot.keycards || 0;
                this.challenges = new Set(snapshot.challenges || []);
                this.gateOpen = !!snapshot.gateOpen;
                this.hasData = !!snapshot.hasData;
                this.wardenDown = !!snapshot.wardenDown;
                this.ending = snapshot.ending || null;
                this.keepExploring = !!snapshot.keepExploring;
            }
            const m = this.mode;
            // Campus gate: a steel barrier across the opening in the south wall.
            const gm = BO.Zone.markers.find((mk) => mk.id === 'campus_gate');
            if (gm && !this.gateOpen) {
                const mesh = m.mesh(new THREE.BoxGeometry(11.6, 3.2, 0.6), 0x55606a, gm.x, gm.y + 1.6, gm.z, { metalness: 0.6, roughness: 0.4 });
                this.gate = { mesh, collider: m.solid(mesh, 11.6, 3.2, 0.6) };
            }
            for (const mk of m.markers) {
                if (mk.kind === 'safehouse' && this.secured.has(mk.id)) this.markSecured(mk, true);
                if (mk.kind === 'nest' && this.nests.has(mk.id)) { mk.alive = false; if (mk.light) mk.light.visible = false; }
            }
            if (!snapshot && this.freeplay) this.step = STEPS.length - 1;
            const mast = m.markers.find((mk) => mk.id === 'mast');
            if (mast && this.step > STEPS.findIndex((s) => s.id === 'mast')) mast.alive = false;
        }

        snapshot() {
            return { step: this.step, secured: [...this.secured], nests: [...this.nests], keycards: this.keycards, challenges: [...this.challenges], gateOpen: this.gateOpen, hasData: this.hasData,
                wardenDown: !!this.wardenDown, ending: this.ending || null, keepExploring: !!this.keepExploring };
        }

        get unsafeToSave() { return false; }

        get objective() {
            if (this.ending) return (BO.ZoneEndings?.[this.ending]?.title || 'The Lantern is decided').toLowerCase().replace(/^./, (ch) => ch.toUpperCase()) + ' · free roam';
            if (this.freeplay) return 'Free roam · scavenge, build and survive as long as you can.';
            const s = this.current;
            if (s.id === 'lantern' && !this.wardenDown) return 'Reach the Lantern and defeat its Warden';
            if (s.id === 'lantern') return 'Decide the fate of the Lantern';
            if (s.id === 'towers') return s.title + ' · ' + (this.campaign.activities?.relayCount || 0) + '/3';
            if (s.id === 'keycards') return s.title + ' · ' + this.keycards + '/3';
            return s.title;
        }

        get actName() { return this.freeplay ? 'Free roam' : ACT_NAMES[this.current.act]; }
        get hint() { return this.freeplay ? '' : this.current.hint; }
        get steps() { return STEPS; }

        advance(toId) {
            const idx = STEPS.findIndex((s) => s.id === toId);
            if (idx <= this.step) return;
            const prevAct = this.current.act;
            this.step = idx;
            const s = this.current;
            this.campaign.mark('story_' + STEPS[idx - 1].id, 1, 120);
            if (s.act !== prevAct) BO.Events.emit('hud:banner', { title: ACT_NAMES[s.act].toUpperCase(), sub: s.title.toUpperCase(), color: '#b69cff' });
            else this.mode.toast('New objective: ' + s.title);
            BO.Sound?.playPerkBuy?.();
            this.campaign.save(true);
        }

        /* --------------------------------------------------------------- safehouses */
        safehouses() {
            return this.mode.markers.filter((mk) => mk.kind === 'safehouse' && this.secured.has(mk.id)).map((mk) => ({ id: mk.id, name: mk.name, x: mk.x, y: mk.y, z: mk.z }));
        }

        safehouseNear(pos, r) {
            return this.mode.markers.some((mk) => mk.kind === 'safehouse' && this.secured.has(mk.id) && Math.hypot(mk.x - pos.x, mk.z - pos.z) < r && Math.abs(mk.y - pos.y) < 4);
        }

        travelPoints() {
            const pts = this.safehouses().map((s) => ({ ...s, kind: 'Safehouse' }));
            const acts = this.campaign.activities;
            if (acts) for (const r of acts.relays.values()) if (r.powered) pts.push({ id: 'tower:' + r.id, name: r.name, x: r.x + 3, y: r.y, z: r.z + 3, kind: 'Radio tower' });
            pts.push({ id: 'haven', name: 'Haven', x: BO.Zone.HAVEN.x, y: 0, z: BO.Zone.HAVEN.z + 8, kind: 'Settlement', locked: this.step < 5 && !this.freeplay });
            return pts.filter((p) => !p.locked);
        }

        markSecured(mk, quiet = false) {
            this.secured.add(mk.id);
            mk.label = mk.name + ' · safehouse (workbench, stove, respawn)';
            mk.secured = true;
            if (mk.light) { mk.light.material.color.setHex(0x8fe3c8); mk.light.material.emissive.setHex(0x8fe3c8); }
            if (!quiet) {
                this.campaign.mark('safehouses', 1, 90);
                BO.Events.emit('hud:banner', { title: 'SAFEHOUSE SECURED', sub: mk.name.toUpperCase() + ' · RESPAWN POINT · WORKBENCH · FAST TRAVEL', color: '#8fe3c8' });
            }
        }

        trySecure(mk) {
            const m = this.mode;
            if (this.secured.has(mk.id)) {
                BO.SurvivalUI.show('crafting');
                return true;
            }
            const threats = [...m.zombies, ...m.bots].filter((e) => e.alive && e.team !== 0 && Math.hypot(e.pos.x - mk.x, e.pos.z - mk.z) < 25);
            if (threats.length) {
                m.toast(threats.length + ' hostile' + (threats.length === 1 ? '' : 's') + ' within 25 m. Clear them before you can secure this building.');
                return true;
            }
            this.markSecured(mk);
            if (mk.id === 'safehouse_ranger' && this.current.id === 'secure') this.advance('mast');
            else if (mk.id === 'safehouse_ranger' && this.step < STEPS.findIndex((s) => s.id === 'mast')) this.advance('mast');
            this.campaign.save(true);
            return true;
        }

        /* --------------------------------------------------------------- nests */
        burnNest(mk) {
            if (mk.alive === false || this.nests.has(mk.id)) return;
            this.nests.add(mk.id);
            mk.alive = false;
            if (mk.light) mk.light.visible = false;
            this.campaign.mark('nests', 1, 150);
            this.campaign.mark('nest_' + mk.id, 1, 0);
            BO.FX.spawnExplosion?.(new THREE.Vector3(mk.x, mk.y + 1, mk.z), 4, 0xff7a1a);
            for (let i = 0; i < 4; i++) this.mode.ignite(new THREE.Vector3(mk.x + (Math.random() - 0.5) * 6, mk.y, mk.z + (Math.random() - 0.5) * 6));
            this.keycards++;
            this.mode.points.keycard = (this.mode.points.keycard || 0) + 1;
            BO.Events.emit('hud:banner', { title: 'NEST DESTROYED', sub: mk.name.toUpperCase() + ' · KEYCARD RECOVERED (' + this.keycards + '/3) · LOCAL THREAT DOWN', color: '#f2b45a' });
            if (this.current.id === 'keycards' && this.keycards >= 3) this.advance('gate');
        }

        tryBurn(mk) {
            const m = this.mode;
            if (!m.hostilesReleased) { m.toast('Nothing stirs here yet.'); return true; }
            const lit = m.campaign.pack.lightUntil > m.clock || (m.points.torch || 0) > 0;
            if ((m.points.fuel || 0) < 2 || !lit) {
                m.toast('Burning a nest needs 2 fuel and a light (torch or lantern) — or throw a molotov or explosive into it.');
                return true;
            }
            m.spend({ fuel: 2 });
            // The nest's brood rushes out as it catches.
            for (let i = 0; i < 4; i++) {
                const a = Math.random() * Math.PI * 2;
                const zb = m.spawnInfected(mk.x + Math.cos(a) * 9, null, mk.z + Math.sin(a) * 9, 'normal', null, true);
                if (zb) { zb.zs = { state: 'hunt', seen: m.clock, home: { x: mk.x, z: mk.z }, x: mk.x, z: mk.z, until: 0, wander: 0 }; }
            }
            this.burnNest(mk);
            return true;
        }

        /* --------------------------------------------------------------- hooks */
        onStoryContainer(entry) {
            const m = this.mode;
            if (entry.story === 'wreck') {
                m.grant({ ammo9: 14, bandage: 2, cloth: 2, canned: 1 });
                m.toast('You find the pilot\'s radio, still crackling: "…anyone… Relay mast is down… Haven… east of the ranger station…"');
                this.advance('reach');
            } else if (entry.story === 'lab_data') {
                this.hasData = true;
                m.points.radioParts = (m.points.radioParts || 0);
                BO.Events.emit('hud:banner', { title: 'RESEARCH DATA RECOVERED', sub: 'PROJECT LANTERN · THE SOURCE LIES IN THE CRATER', color: '#b69cff' });
                if (this.current.id === 'data') this.advance('lantern');
            }
        }

        onBossKilled(entity) {
            if (entity.survivalType && entity.survivalType !== 'warden') {
                this.keycards = Math.min(3, this.keycards + 1);
                this.mode.points.keycard = (this.mode.points.keycard || 0) + 1;
                this.mode.toast('The boss carried a campus keycard (' + this.keycards + '/3).');
                if (this.current.id === 'keycards' && this.keycards >= 3) this.advance('gate');
            }
        }

        onNewDay() {}

        activate(marker) {
            const m = this.mode;
            if (marker.kind === 'safehouse') return this.trySecure(marker);
            if (marker.kind === 'nest') return this.tryBurn(marker);
            if (marker.id === 'mast') {
                if (this.step < STEPS.findIndex((s) => s.id === 'mast') && !this.freeplay) {
                    m.toast('The transmitter is dead. Secure the ranger station first so you have somewhere to fall back to.');
                    return true;
                }
                if (this.step > STEPS.findIndex((s) => s.id === 'mast')) { m.toast('The mast is broadcasting. Haven is listening.'); return true; }
                if (!m.spend({ wire: 2, battery: 1 })) {
                    m.toast('The transmitter needs 2 copper wire and 1 battery. Batteries turn up in desks, cars and electrical cabinets.');
                    return true;
                }
                BO.Events.emit('hud:banner', { title: 'RELAY MAST ONLINE', sub: '"…this is Haven… we hear you… sandbagged camp, east of the hill…"', color: '#8fe3c8' });
                this.campaign.mark('mastRestored', 1, 200);
                marker.alive = false;
                this.advance('haven');
                return true;
            }
            if (marker.id === 'campus_gate') {
                if (this.gateOpen) return true;
                if (this.keycards < 3) { m.toast('The gate reader blinks red. Three campus keycards required (' + this.keycards + '/3).'); return true; }
                this.gateOpen = true;
                if (this.gate) { m.removeSolid(this.gate.mesh, this.gate.collider); this.gate.mesh.visible = false; }
                BO.Events.emit('hud:banner', { title: 'CAMPUS GATE OPEN', sub: 'BLACK PINE RESEARCH CAMPUS · THREAT LEVEL SEVERE', color: '#f2b45a' });
                if (this.current.id === 'gate') this.advance('data');
                return true;
            }
            if (marker.id === 'lantern') {
                if (this.ending) { m.toast(this.ending === 'seal' ? 'The core is cold and dark.' : 'The Lantern hums at your touch.'); return true; }
                if (this.current.id !== 'lantern' && !this.freeplay) {
                    m.toast('The Lantern hums. You do not understand it yet — the campus labs may hold the answers.');
                    return true;
                }
                if (!this.wardenDown) { BO.ZoneFinale.begin(); return true; }
                BO.SurvivalUI.show('ending');
                return true;
            }
            return false;
        }

        decide(ending) {
            BO.ZoneFinale.decide(ending);
        }

        update() {
            if (this.freeplay) return;
            const p = BO.Player.pos;
            const s = this.current;
            if (s.id === 'reach') {
                const st = this.mode.markers.find((mk) => mk.id === 'safehouse_ranger');
                if (st && Math.hypot(st.x - p.x, st.z - p.z) < 14) this.advance('secure');
            } else if (s.id === 'haven') {
                if (Math.hypot(BO.Zone.HAVEN.x - p.x, BO.Zone.HAVEN.z - p.z) < 14) {
                    BO.Events.emit('hud:banner', { title: 'HAVEN', sub: '"WELCOME. WE NEED THOSE TOWERS FIXED IF WE\'RE EVER FINDING THAT LIGHT."', color: '#8fe3c8' });
                    this.advance('towers');
                }
            } else if (s.id === 'towers') {
                if ((this.campaign.activities?.relayCount || 0) >= 3) this.advance('keycards');
            } else if (s.id === 'keycards') {
                if (this.keycards >= 3) this.advance('gate');
            } else if (s.id === 'data') {
                if (this.hasData) this.advance('lantern');
            }
        }

        /** World position of the current story objective, for the compass. */
        target() {
            if (this.freeplay) return null;
            const m = this.mode;
            const p = BO.Player.pos;
            const near = (list) => list.reduce((best, e) => (!best || Math.hypot(e.x - p.x, e.z - p.z) < Math.hypot(best.x - p.x, best.z - p.z) ? e : best), null);
            const mk = (id) => m.markers.find((x) => x.id === id);
            switch (this.current.id) {
                case 'wreck': return m.markers.find((x) => x.container?.story === 'wreck');
                case 'reach': case 'secure': return mk('safehouse_ranger');
                case 'mast': return mk('mast') || BO.Zone.markers.find((x) => x.id === 'mast');
                case 'haven': return BO.Zone.HAVEN;
                case 'towers': return near([...(this.campaign.activities?.relays.values() || [])].filter((r) => !r.powered));
                case 'keycards': return near(m.markers.filter((x) => x.kind === 'nest' && x.alive !== false));
                case 'gate': return mk('campus_gate');
                case 'data': return m.markers.find((x) => x.container?.story === 'lab_data');
                case 'lantern': return BO.Zone.LANTERN;
                default: return null;
            }
        }

        routeEvac() { return true; }

        /* --------------------------------------------------------------- challenges */
        list() {
            return fieldChallenges.map((challenge) => ({
                ...challenge, claimed: this.challenges.has(challenge.id),
                ready: challenge.criteria.every(([key, count]) => (this.campaign.metrics[key] || 0) >= count),
                progress: challenge.criteria.map(([key, count]) => Math.min(this.campaign.metrics[key] || 0, count) + '/' + count).join(' · ')
            }));
        }

        claim(id) {
            const challenge = this.list().find((item) => item.id === id);
            if (!challenge?.ready || challenge.claimed) return false;
            this.challenges.add(id);
            this.campaign.mark('fieldChallenges', 1, 0);
            BO.SurvivalCareer.tick(this.campaign.run, 'challenge_' + id, 1, challenge.xp);
            this.mode.grant(challenge.reward);
            this.mode.toast(challenge.name + ' complete · +' + challenge.xp + ' XP');
            return true;
        }
    }

    BO.SurvivalObjectives = SurvivalObjectives;
    BO.SurvivalStorySteps = STEPS;
})(window.BO);
