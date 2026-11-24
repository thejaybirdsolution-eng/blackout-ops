(function (BO) {
    'use strict';

    const items = BO.SurvivalFrontierData.items;
    const recipes = BO.SurvivalFrontierData.recipes;
    Object.assign(items, {
        cropSeeds: ['Relay crop seeds', 'Raw materials', 0.04],
        freshWater: ['Filtered water', 'Consumables', 0.56],
        salvageLine: ['Weighted salvage line', 'Tools', 0.43]
    });
    recipes.push({
        id: 'weighTheLine', name: 'Weighted salvage line', station: 'hand',
        cost: { scrap: 1, cord: 1 }, gain: { salvageLine: 1 },
        desc: 'Cast for material caches from three marked waterside stations. Press interact when the float goes under.'
    });

    const plots = [
        { id: 'beans', name: 'Relay bean bed', x: 18, y: 0, z: 152, color: 0x89b56f, grow: 72, loot: { rations: 3, cropSeeds: 2 } },
        { id: 'fiber', name: 'Relay fiber bed', x: 30, y: 0, z: 152, color: 0xc9ac67, grow: 54, loot: { fiber: 6, cropSeeds: 2 } },
        { id: 'bitterleaf', name: 'Relay herb bed', x: 42, y: 0, z: 152, color: 0x6fb290, grow: 60, loot: { herbs: 5, cropSeeds: 2 } }
    ];
    const pumps = [
        { id: 'relay', name: 'Relay rainwater filter', x: 24, y: 0, z: 140 },
        { id: 'marsh', name: 'Spillway hand pump', x: 204, y: 0, z: -48 },
        { id: 'west', name: 'West catchment filter', x: -162, y: 0, z: -72 }
    ];
    const shore = [
        { id: 'west', name: 'Pinebreak cistern', x: -152, y: 0, z: -48, color: 0x789faf,
            loot: [{ scrap: 2, cord: 1 }, { rations: 1, fuel: 1 }, { timber: 3, cloth: 1 }] },
        { id: 'spillway', name: 'Flood channel', x: 166, y: 0, z: -92, color: 0x91bdbe,
            loot: [{ copper: 3, scrap: 1 }, { clay: 4, fuel: 1 }, { iron: 2, quartz: 1 }] },
        { id: 'freight', name: 'Freight drainage basin', x: 138, y: 0, z: 36, color: 0x98b1b2,
            loot: [{ iron: 2, cloth: 1 }, { wire: 2, salvageLine: 1 }, { scrap: 3, fuel: 1 }] }
    ];
    const relays = [
        { id: 'pine', name: 'Pinebreak repeater', x: -175, y: 0, z: 82 },
        { id: 'freight', name: 'Freight repeater', x: 108, y: 0, z: -64 },
        { id: 'ridge', name: 'Radar Ridge repeater', x: 98, y: 11, z: -176 }
    ];
    const surveys = [
        { id: 'fork', name: 'Pinebreak Trail Fork', x: -115, y: 0, z: 96, loot: { cord: 1 } },
        { id: 'spire', name: 'Slateback Summit', x: -208, y: 20, z: 158, loot: { quartz: 2, coil: 1 } },
        { id: 'cistern', name: 'Hidden Waterworks', x: 198, y: 0, z: -112, loot: { fuel: 1, freshWater: 1 } },
        { id: 'echo', name: 'Echo Survey Bench', x: -64, y: -8, z: -218, loot: { quartz: 2, filter: 1 } }
    ];
    const routes = [
        { id: 'med', name: 'Hospital circuit', sites: ['hospital', 'pine'], labels: ['Field hospital', 'Pinebreak repeater'], reward: { medkits: 2, cloth: 2 } },
        { id: 'rail', name: 'Rail inspection', sites: ['freight', 'marsh'], labels: ['Freight repeater', 'Spillway hand pump'], reward: { fuel: 2, scrap: 3 } },
        { id: 'ridge', name: 'Ridge survey', sites: ['crest', 'west'], labels: ['Slateback Summit', 'Pinebreak cistern'], reward: { wire: 2, quartz: 2 } }
    ];
    const dropSites = [
        { x: -58, y: 0, z: -55, name: 'west of the trench highway' },
        { x: -128, y: 0, z: 8, name: 'at the Pinebreak treeline' },
        { x: 146, y: 0, z: 54, name: 'south of the freight depot' },
        { x: 185, y: 0, z: 172, name: 'along the Derelict Airfield runway' }
    ];
    const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    const remaining = (seconds) => Math.max(0, Math.ceil(seconds)) + 's';
    const activitySites = [
        ...plots.map((site) => ({ ...site, category: 'Garden' })),
        ...pumps.map((site) => ({ ...site, category: 'Water' })),
        ...shore.map((site) => ({ ...site, category: 'Salvage' })),
        ...relays.map((site) => ({ ...site, category: 'Signal' })),
        ...surveys.map((site) => ({ ...site, category: 'Discovery' }))
    ];
    BO.SurvivalActivitiesData = { plots, pumps, shore, relays, surveys, routes };

    class SurvivalActivities {
        constructor(campaign) {
            this.campaign = campaign;
            this.mode = campaign.mode;
            this.garden = new Map();
            this.pumps = new Map();
            this.shore = new Map();
            this.relays = new Map();
            this.surveys = new Map();
            this.routeClaims = new Set();
            this.route = null;
            this.cast = null;
            this.drop = null;
            this.dropIndex = 0;
            this.nextDrop = 120;
            this.signalClaimed = false;
            this.ownMarkers = new Set();
            this.owned = new Set();
        }

        setup(snapshot) {
            for (const plot of plots) this.addPlot(plot);
            for (const pump of pumps) {
                const { x, y, z } = pump;
                const base = this.mesh(new THREE.CylinderGeometry(0.44, 0.55, 1.04, 8), 0x446578, x, y + 0.52, z);
                const spout = this.mesh(new THREE.BoxGeometry(0.53, 0.12, 0.12), 0x8b9da1, x + 0.34, y + 0.82, z);
                spout.rotation.y = 0.18;
                this.pumps.set(pump.id, { ...pump, base, marker: this.marker('pump', pump), readyAt: 0 });
            }
            for (const site of shore) {
                const { x, y, z } = site;
                const water = this.mesh(new THREE.CircleGeometry(1.95, 12), 0x3d7c86, x + 1.78, y + 0.048, z,
                    { opacity: 0.68, transparent: true, depthWrite: false, metalness: 0.24, roughness: 0.32 });
                water.rotation.x = -Math.PI / 2;
                this.mesh(new THREE.BoxGeometry(1.08, 0.21, 0.66), 0x807462, x, y + 0.12, z);
                const float = this.mesh(new THREE.SphereGeometry(0.12, 6, 4), 0xf3bd66, x + 1.45, y + 0.15, z - 0.32,
                    { emissive: 0xee9136, emissiveIntensity: 0.38 });
                float.visible = false;
                this.shore.set(site.id, { ...site, float, marker: this.marker('shore', site), hauled: 0, readyAt: 0 });
            }
            for (const relay of relays) {
                const { x, y, z } = relay;
                this.mesh(new THREE.CylinderGeometry(0.05, 0.10, 2.65, 7), 0x647e77, x, y + 1.32, z);
                this.mesh(new THREE.BoxGeometry(0.92, 0.09, 0.07), 0x98a597, x, y + 2.45, z).rotation.z = 0.14;
                const lamp = this.mesh(new THREE.OctahedronGeometry(0.12), 0xb17b5e, x, y + 2.68, z,
                    { emissive: 0xa44625, emissiveIntensity: 0.35 });
                this.relays.set(relay.id, { ...relay, lamp, marker: this.marker('relay', relay), powered: false });
            }
            for (const survey of surveys) {
                const { x, y, z } = survey;
                this.mesh(new THREE.BoxGeometry(0.76, 0.22, 0.57), 0x55574b, x, y + 0.11, z);
                const plaque = this.mesh(new THREE.BoxGeometry(0.67, 0.54, 0.11), 0xb7a16d, x, y + 0.59, z);
                plaque.rotation.x = -0.27;
                this.surveys.set(survey.id, { ...survey, plaque, marker: this.marker('survey', survey), claimed: false });
            }
            this.board = this.marker('board', { id: 'relay', name: 'Relay dispatch and seeds', x: -4, y: 0, z: 34.8 });
            this.mesh(new THREE.BoxGeometry(1.38, 0.98, 0.14), 0x778477, this.board.x, this.board.y + 1.10, this.board.z);
            this.mesh(new THREE.BoxGeometry(0.17, 0.97, 0.21), 0x8d7157, this.board.x, this.board.y + 0.48, this.board.z);
            for (const [id, x, y, z, name] of [
                ['hospital', -21.8, 0, 11.8, 'Hospital dispatch seal'],
                ['crest', -49.9, 7.2, 32.9, 'Summit dispatch seal']
            ]) {
                const post = this.marker('stamp', { id, x, y, z, name });
                this.mesh(new THREE.BoxGeometry(0.30, 1.2, 0.12), 0xb7a16d, x, y + 0.6, z);
                post.alive = false;
            }
            if (snapshot) this.restore(snapshot);
            this.update(0);
        }

        mesh(geometry, color, x, y, z, options) {
            const mesh = this.mode.mesh(geometry, color, x, y, z, options);
            this.owned.add(mesh);
            return mesh;
        }

        marker(kind, site) {
            const marker = { id: 'activity-' + kind + ':' + site.id, key: site.id, activity: kind,
                x: site.x, y: site.y, z: site.z, name: site.name, label: site.name, alive: true };
            this.mode.markers.push(marker);
            this.ownMarkers.add(marker);
            return marker;
        }

        addPlot(plot) {
            const { x, y, z, color } = plot;
            this.mesh(new THREE.BoxGeometry(1.42, 0.23, 1.22), 0x6d5840, x, y + 0.11, z);
            this.mesh(new THREE.BoxGeometry(1.19, 0.10, 1.01), 0x4b382a, x, y + 0.23, z);
            const plants = [];
            for (const a of [-0.38, 0, 0.38]) {
                for (const b of [-0.30, 0.30]) {
                    const shoot = this.mesh(new THREE.ConeGeometry(0.13, 0.43, 5), color, x + a, y + 0.29, z + b);
                    shoot.visible = false;
                    plants.push(shoot);
                }
            }
            this.garden.set(plot.id, { ...plot, marker: this.marker('plot', plot), plants, stage: 'empty', growth: 0 });
        }

        update(dt) {
            for (const plot of this.garden.values()) {
                if (plot.stage === 'growing') {
                    const rate = (this.campaign.isNight ? 0.67 : 1) * (this.mode.weather === 'Ash rain' ? 0.85 : 1) * (this.campaign.has('fastGrow') ? 2.5 : 1);
                    plot.growth += Math.max(0, dt) * rate;
                    if (plot.growth >= plot.grow) plot.stage = 'ready';
                }
                const scale = plot.stage === 'dry' ? 0.29 : Math.min(1.32, 0.35 + plot.growth / plot.grow);
                for (const shoot of plot.plants) {
                    shoot.visible = plot.stage !== 'empty';
                    shoot.scale.set(scale, scale, scale);
                    shoot.position.y = plot.y + 0.26 + scale * 0.21;
                }
                plot.marker.label = this.plotLabel(plot);
            }
            for (const pump of this.pumps.values()) {
                pump.marker.label = this.mode.clock < pump.readyAt ? pump.name + ' · ' + remaining(pump.readyAt - this.mode.clock) : 'Draw water · ' + pump.name;
            }
            this.updateShore();
            this.updateDrop();
            this.updateRouteMarkers();
            this.board.label = this.boardLabel();
        }

        plotLabel(plot) {
            if (plot.stage === 'empty') return 'Plant crop seed · ' + plot.name;
            if (plot.stage === 'dry') return 'Water seedling · ' + plot.name;
            if (plot.stage === 'ready') return 'Harvest · ' + plot.name;
            return plot.name + ' · ' + Math.floor(Math.min(100, plot.growth / plot.grow * 100)) + '% grown';
        }

        updateShore() {
            const clock = this.mode.clock;
            if (this.cast) {
                const site = this.shore.get(this.cast.id);
                if (distance(site, BO.Player.pos) > 4.1 || clock > this.cast.bite + 3.5) {
                    this.cast = null;
                    site.readyAt = clock + 7;
                    site.float.visible = false;
                    this.mode.toast('The salvage float slipped free. Recast in a few seconds.');
                }
            }
            for (const site of this.shore.values()) {
                const cast = this.cast?.id === site.id ? this.cast : null;
                site.float.visible = !!cast;
                if (cast) {
                    site.float.position.y = site.y + (clock >= cast.bite ? 0.05 : 0.19) + Math.sin(clock * 4) * 0.044;
                    site.marker.label = clock >= cast.bite ? 'Reel in now · ' + site.name : 'Watch the salvage float';
                } else if (clock < site.readyAt) {
                    site.marker.label = site.name + ' · ' + remaining(site.readyAt - clock);
                } else site.marker.label = 'Cast salvage line · ' + site.name;
            }
        }

        updateDrop() {
            const clock = this.mode.clock;
            if (!this.drop && clock >= this.nextDrop) {
                const site = dropSites[this.dropIndex % dropSites.length];
                this.addDrop({ site: this.dropIndex % dropSites.length, arrival: clock + 12, expires: clock + 96 });
                this.dropIndex++;
                this.mode.toast('Weather balloon inbound ' + site.name + '.');
            }
            if (!this.drop) return;
            if (clock >= this.drop.expires) {
                this.removeDrop();
                this.nextDrop = clock + 190;
                return;
            }
            const { arrival, marker, crate, tether, balloon } = this.drop;
            const height = Math.max(0, arrival - clock) * 0.61;
            crate.position.y = marker.y + 0.27 + height;
            balloon.position.y = marker.y + 2.15 + height;
            tether.position.y = marker.y + 1.16 + height;
            balloon.visible = tether.visible = clock < arrival;
            marker.label = clock < arrival ? 'Weather balloon lands in ' + remaining(arrival - clock) : 'Recover weather-balloon cache';
        }

        addDrop(state) {
            const site = dropSites[state.site];
            if (!site) return;
            const marker = this.marker('drop', { ...site, id: String(state.site), name: 'Weather-balloon cache' });
            const crate = this.mesh(new THREE.BoxGeometry(0.82, 0.54, 0.70), 0xc19a5b, site.x, site.y + 0.27, site.z);
            const balloon = this.mesh(new THREE.SphereGeometry(0.71, 10, 7), 0xce7853, site.x, site.y + 2.15, site.z);
            balloon.scale.y = 1.27;
            const tether = this.mesh(new THREE.CylinderGeometry(0.027, 0.027, 1.28, 5), 0xc8c2a4, site.x, site.y + 1.16, site.z);
            this.drop = { ...state, marker, crate, balloon, tether };
        }

        removeDrop() {
            if (!this.drop) return;
            const { marker, crate, balloon, tether } = this.drop;
            this.ownMarkers.delete(marker);
            const index = this.mode.markers.indexOf(marker);
            if (index !== -1) this.mode.markers.splice(index, 1);
            for (const mesh of [crate, balloon, tether]) {
                this.owned.delete(mesh);
                this.mode.disposeOwned(mesh);
            }
            this.drop = null;
        }

        updateRouteMarkers() {
            const stage = this.route && routes[this.route.index]?.sites[this.route.step];
            for (const marker of this.ownMarkers) {
                if (marker.activity === 'stamp') marker.alive = marker.key === stage;
            }
        }

        boardLabel() {
            if (!this.seedIssued) return 'Collect starter seeds and water';
            if (this.relayCount === relays.length && !this.signalClaimed) return 'Collect repeater-network reward';
            if (this.route) return this.route.step >= routes[this.route.index].sites.length ? 'Claim dispatch reward' : 'Review active dispatch';
            return this.routeClaims.size === routes.length ? 'Review dispatch board' : 'Accept supply dispatch';
        }

        get relayCount() {
            return [...this.relays.values()].filter((site) => site.powered).length;
        }

        activate(marker) {
            if (!marker?.activity || !this.ownMarkers.has(marker)) return false;
            if (marker.activity === 'plot') this.tendPlot(marker.key);
            else if (marker.activity === 'pump') this.usePump(marker.key);
            else if (marker.activity === 'shore') this.useShore(marker.key);
            else if (marker.activity === 'relay') this.powerRelay(marker.key);
            else if (marker.activity === 'survey') this.survey(marker.key);
            else if (marker.activity === 'board') this.useBoard();
            else if (marker.activity === 'drop') this.lootDrop();
            else if (marker.activity === 'stamp') this.checkIn(marker.key);
            return true;
        }

        tendPlot(id) {
            const plot = this.garden.get(id);
            const m = this.mode;
            if (plot.stage === 'empty') {
                if (!m.spend({ cropSeeds: 1 })) return m.toast('Collect starter seeds at Relay dispatch or harvest an existing crop.');
                plot.stage = 'dry';
                plot.growth = 0;
                m.toast('Seed planted. Use filtered water on the bed.');
            } else if (plot.stage === 'dry') {
                if (!m.spend({ freshWater: 1 })) return m.toast('Draw filtered water from a hand pump.');
                plot.stage = 'growing';
                m.toast('Bed watered. Come back when the crop is mature.');
            } else if (plot.stage === 'ready') {
                plot.stage = 'empty';
                plot.growth = 0;
                this.campaign.mark('cropsHarvested', 1, 16);
                const cMult = this.campaign.deep?.modFx?.cropYieldMult || 1;
                const loot = cMult > 1 ? Object.fromEntries(Object.entries(plot.loot).map(([k, v]) => [k, v * cMult])) : plot.loot;
                m.grant(loot);
            } else m.toast(this.plotLabel(plot) + '.');
            plot.marker.label = this.plotLabel(plot);
        }

        usePump(id) {
            if (id === 'marsh' && this.checkIn('marsh')) return;
            const pump = this.pumps.get(id);
            const clock = this.mode.clock;
            if (clock < pump.readyAt) return this.mode.toast(pump.name + ' is refilling.');
            if (this.campaign.pack.room('freshWater', 1) < 1) return this.mode.toast('Leave room for filtered water in your pack.');
            const pSpd = this.campaign.deep?.modFx?.pumpSpeedMult || 1;
            pump.readyAt = clock + 24 / pSpd;
            this.mode.grant({ freshWater: 1 });
            this.campaign.mark('waterDrawn', 1, 2);
        }

        useShore(id) {
            const m = this.mode;
            const clock = m.clock;
            const site = this.shore.get(id);
            if (this.cast?.id === id) {
                if (clock < this.cast.bite) return m.toast('Wait until the float dips.');
                if (clock > this.cast.bite + 3.5) {
                    this.updateShore();
                    return;
                }
                this.cast = null;
                site.float.visible = false;
                site.readyAt = clock + 33;
                const fMult = this.campaign.deep?.modFx?.fishBonus || 1;
                const haul = site.loot[site.hauled % site.loot.length];
                m.grant(fMult > 1 ? Object.fromEntries(Object.entries(haul).map(([k, v]) => [k, v * fMult])) : haul);
                site.hauled++;
                this.campaign.mark('salvageHauls', 1, 21);
                if (id === 'west') this.checkIn('west');
                return;
            }
            if (id === 'west' && this.checkIn('west')) return;
            if (clock < site.readyAt) return m.toast(site.name + ' needs time to settle.');
            if (!m.points.salvageLine) return m.toast('Craft a weighted salvage line in your backpack.');
            if (this.cast) return m.toast('Reel in your line at the other station first.');
            const waitMult = (this.campaign.has('fastGrow') ? 0.5 : 1) / (this.campaign.deep?.modFx?.fishSpeedMult || 1);
            this.cast = { id, bite: clock + (5.5 + (site.hauled % 3) * 1.25) * waitMult };
            m.toast('Line cast. Interact when the float dips.');
        }

        powerRelay(id) {
            if (this.checkIn(id)) return;
            const relay = this.relays.get(id);
            const m = this.mode;
            if (relay.powered) return m.toast(relay.name + ' online · ' + this.relayCount + '/' + relays.length);
            if (!m.spend({ wire: 1, fuel: 1 })) return m.toast('Each repeater needs one copper wire and one fuel.');
            this.setRelay(relay);
            this.campaign.mark('repeaters', 1, 28);
            m.toast('Repeater restored · ' + this.relayCount + '/' + relays.length);
            if (this.relayCount === relays.length) this.nextDrop = Math.min(this.nextDrop, m.clock + 20);
        }

        setRelay(relay) {
            relay.powered = true;
            relay.marker.label = relay.name + ' online';
            relay.lamp.material.color.setHex(0x95d9a0);
            relay.lamp.material.emissive.setHex(0x62b383);
        }

        survey(id) {
            const survey = this.surveys.get(id);
            if (id === 'spire' && this.checkIn('crest')) return;
            if (survey.claimed) return this.mode.toast(survey.name + ' logged in your field journal.');
            this.claimSurvey(survey);
            this.campaign.mark('surveySites', 1, 35);
            this.mode.grant(survey.loot);
            this.mode.toast('Surveyed ' + survey.name + ' · ' + this.surveyCount + '/' + surveys.length);
        }

        claimSurvey(survey) {
            survey.claimed = true;
            survey.marker.label = survey.name + ' surveyed';
            survey.plaque.material.color.setHex(0x8fae84);
        }

        get surveyCount() {
            return [...this.surveys.values()].filter((site) => site.claimed).length;
        }

        useBoard() {
            const m = this.mode;
            if (!this.seedIssued) {
                this.seedIssued = true;
                m.grant({ cropSeeds: 3, freshWater: 2 });
                m.toast('Starter crops collected. Plant and water the beds beside the Relay deck.');
                return;
            }
            if (this.relayCount === relays.length && !this.signalClaimed) {
                this.signalClaimed = true;
                this.campaign.mark('relayNetworks', 1, 180);
                m.grant({ wire: 3, fuel: 2, medkits: 2 });
                return;
            }
            if (this.route) {
                const route = routes[this.route.index];
                if (this.route.step < route.sites.length) return m.toast(route.name + ' · next stop ' + route.labels[this.route.step]);
                this.routeClaims.add(route.id);
                this.route = null;
                this.campaign.mark('dispatches', 1, 80);
                m.grant(route.reward);
                m.toast(route.name + ' completed.');
                return;
            }
            const index = routes.findIndex((item) => !this.routeClaims.has(item.id));
            if (index < 0) return m.toast('All three delivery routes have been completed.');
            this.route = { index, step: 0 };
            this.updateRouteMarkers();
            m.toast('Dispatch accepted: ' + routes[index].name + ' · first stop ' + routes[index].labels[0]);
        }

        checkIn(key) {
            if (!this.route) return false;
            const route = routes[this.route.index];
            if (route.sites[this.route.step] !== key) return false;
            this.route.step++;
            this.updateRouteMarkers();
            this.mode.toast(this.route.step < route.sites.length
                ? 'Dispatch sealed. Next stop ' + route.labels[this.route.step] + '.'
                : 'Dispatch route sealed. Return to the Relay board for your reward.');
            return true;
        }

        lootDrop() {
            if (!this.drop || this.mode.clock < this.drop.arrival) return;
            this.removeDrop();
            this.nextDrop = this.mode.clock + (this.relayCount === relays.length ? 115 : 185);
            this.campaign.mark('supplyDrops', 1, 39);
            this.mode.grant({ scrap: 3, medkits: 1, fuel: 1, cloth: 2 });
        }

        useItem(id) {
            if (id !== 'freshWater' || !this.mode.spend({ freshWater: 1 })) return false;
            this.mode.composure = Math.min(100, this.mode.composure + 15);
            this.mode.radiation = Math.max(0, this.mode.radiation - 5);
            if (this.campaign.deep) {
                this.campaign.deep.hydration = Math.min(100, this.campaign.deep.hydration + 50);
                this.campaign.deep.temp = Math.max(15, this.campaign.deep.temp - 4);
            }
            this.mode.toast('Drank filtered water (+50 hydration).');
            return true;
        }

        get brief() {
            if (!this.route) return '';
            const route = routes[this.route.index];
            return route.name + ' · ' + (route.labels[this.route.step] || 'return to the Relay dispatch board');
        }

        get mapSites() {
            return this.drop ? [...activitySites, { ...dropSites[this.drop.site], name: 'Weather-balloon cache', category: 'World event' }]
                : activitySites;
        }

        renderJournal() {
            const plantStatus = [...this.garden.values()].map((plot) => '<li>' + this.plotLabel(plot) + '</li>').join('');
            const signalStatus = [...this.relays.values()].map((relay) => '<li>' + relay.name + ' · ' + (relay.powered ? 'online' : 'offline') + '</li>').join('');
            const surveyStatus = [...this.surveys.values()].map((site) => '<li>' + site.name + ' · ' + (site.claimed ? 'surveyed' : 'unvisited') + '</li>').join('');
            const weatherStatus = this.drop ? 'Cache ' + dropSites[this.drop.site].name + ' · ' +
                (this.mode.clock < this.drop.arrival ? 'landing in ' + remaining(this.drop.arrival - this.mode.clock) : 'expires in ' + remaining(this.drop.expires - this.mode.clock))
                : 'Next weather balloon in ' + remaining(this.nextDrop - this.mode.clock);
            return '<section class="frontier-guide"><h3>Field activities</h3><p>' +
                (this.brief || 'Accept a delivery route at Relay dispatch.') +
                '</p><p>' + weatherStatus + '.</p><h4>Garden</h4><ul>' + plantStatus +
                '</ul><h4>Repeater network</h4><ul>' + signalStatus + '</ul><h4>Survey landmarks</h4><ul>' + surveyStatus + '</ul></section>';
        }

        snapshot() {
            return {
                seedIssued: !!this.seedIssued, signalClaimed: this.signalClaimed,
                garden: [...this.garden].map(([id, plot]) => [id, { stage: plot.stage, growth: plot.growth }]),
                pumps: [...this.pumps].map(([id, site]) => [id, site.readyAt]),
                shore: [...this.shore].map(([id, site]) => [id, { hauled: site.hauled, readyAt: site.readyAt }]),
                relays: [...this.relays].filter(([, site]) => site.powered).map(([id]) => id),
                surveys: [...this.surveys].filter(([, site]) => site.claimed).map(([id]) => id),
                route: this.route ? { ...this.route } : null, routeClaims: [...this.routeClaims],
                cast: this.cast ? { ...this.cast } : null,
                drop: this.drop ? { site: this.drop.site, arrival: this.drop.arrival, expires: this.drop.expires } : null,
                dropIndex: this.dropIndex, nextDrop: this.nextDrop
            };
        }

        restore(state) {
            for (const [id, plot] of state.garden || []) if (this.garden.has(id)) Object.assign(this.garden.get(id), plot);
            for (const [id, readyAt] of state.pumps || []) if (this.pumps.has(id)) this.pumps.get(id).readyAt = readyAt;
            for (const [id, site] of state.shore || []) if (this.shore.has(id)) Object.assign(this.shore.get(id), site);
            for (const id of state.relays || []) if (this.relays.has(id)) this.setRelay(this.relays.get(id));
            for (const id of state.surveys || []) if (this.surveys.has(id)) this.claimSurvey(this.surveys.get(id));
            this.seedIssued = !!state.seedIssued;
            this.signalClaimed = !!state.signalClaimed;
            this.route = state.route && routes[state.route.index] ? state.route : null;
            this.routeClaims = new Set(state.routeClaims || []);
            this.cast = state.cast && this.shore.has(state.cast.id) ? state.cast : null;
            this.dropIndex = Number(state.dropIndex) || 0;
            this.nextDrop = Number.isFinite(state.nextDrop) ? state.nextDrop : this.mode.clock + 90;
            if (state.drop && state.drop.expires > this.mode.clock) this.addDrop(state.drop);
            else if (state.drop) this.nextDrop = this.mode.clock + 90;
        }

        stop() {
            for (const mesh of this.owned) this.mode.disposeOwned(mesh);
            this.owned.clear();
            for (const marker of this.ownMarkers) {
                const index = this.mode.markers.indexOf(marker);
                if (index !== -1) this.mode.markers.splice(index, 1);
            }
            this.ownMarkers.clear();
        }
    }

    BO.SurvivalActivities = SurvivalActivities;
})(window.BO);
