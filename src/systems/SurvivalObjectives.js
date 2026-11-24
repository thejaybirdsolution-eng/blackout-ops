
(function (BO) {
    'use strict';

    const cairns = [
        ['relay','Relay Watch',9,0,21], ['pine','Pinebreak Survey',-34,0,-10], ['freight','Freight Signal',32,0,10],
        ['ridge','Slateback Benchmark',-49,5.6,36.9], ['basin','Basin Marker',48,0,-14], ['trench','Trench Survey',6,-5,-51]
    ];
    const delivery = { iron: 12, planks: 8, coal: 4, scrap: 10 };
    const encounterSites = [[-36, 0, -18], [-43, 0, -35], [-17, 0, -38], [-25, 0, -15], [-46, 0, -25]];
    const fieldChallenges = [
        { id: 'trail', name: 'Trail Kit', info: 'Gather eight nodes, craft five items, and open one supply cache.', criteria: [['gatheredNodes', 8], ['crafted', 5], ['fieldCaches', 1]], reward: { rations: 2, cloth: 2, scrap: 3 }, xp: 110 },
        { id: 'base', name: 'Safe Haven', info: 'Build five pieces, rest in a field bed, and stock a chest with four items.', criteria: [['built', 5], ['fieldRests', 1], ['storedItems', 4]], reward: { planks: 4, brick: 3, torch: 2 }, xp: 135 },
        { id: 'explorer', name: 'Surveyor', info: 'Discover five areas and record three cairns.', criteria: [['visited', 5], ['cairns', 3]], reward: { fuel: 2, wire: 2, filter: 1 }, xp: 175 },
        { id: 'foundry', name: 'Ore to Iron', info: 'Mine four deposits and make two kiln recipes.', criteria: [['oreHarvests', 4], ['kilnJobs', 2]], reward: { ingot: 2, coal: 4 }, xp: 150 },
        { id: 'hunter', name: 'Night Watch', info: 'Defeat six infected at night.', criteria: [['nightKills', 6]], reward: { medkits: 2, torch: 3 }, xp: 175 },
        { id: 'farmer', name: 'Zone Homestead', info: 'Harvest two garden crops, draw water twice, and reel one salvage line haul.', criteria: [['cropsHarvested', 2], ['waterDrawn', 2], ['salvageHauls', 1]], reward: { stew: 2, freshWater: 2, aetherShard: 1 }, xp: 165 },
        { id: 'sanctuary', name: 'Grace & Tech', info: 'Kindle two Sites of Grace and research two Technology nodes.', criteria: [['shrinesKindled', 2], ['techUnlocked', 2]], reward: { aetherShard: 2, ingot: 2, quartz: 2 }, xp: 200 }
    ];

    class SurvivalObjectives {
        constructor(campaign) {
            this.campaign = campaign;
            this.mode = campaign.mode;
            this.kind = campaign.options.gameType;
            this.surveyed = new Set();
            this.caches = new Set();
            this.challenges = new Set();
            this.delivery = false;
            this.wave = 0;
            this.waveClearedAt = 0;
            this.siegeDone = false;
            this.activeWave = [];
            this.siegeSpawned = false;
        }

        setup(snapshot) {
            const m = this.mode;
            this.surveyed = new Set(snapshot?.surveyed);
            this.caches = new Set(snapshot?.caches);
            this.challenges = new Set(snapshot?.challenges);
            this.delivery = !!snapshot?.delivery;
            this.wave = snapshot?.wave || 0;
            this.waveClearedAt = snapshot?.waveClearedAt || 0;
            this.siegeDone = !!snapshot?.siegeDone;
            // Hostile waves cannot be saved. A checkpoint between waves resumes the intermission.
            this.siegeSpawned = false;
            for (const [id, label, x, y, z] of cairns) {
                if (!this.surveyed.has(id)) m.marker({ id: 'survey:' + id, name: label, x, y, z, label: 'Record ' + label, color: 0x8af3d1 });
            }
            for (const [id, x, y, z] of [['camp', -15, 0, 22], ['quarry', -50, 0, -41], ['rail', 33, 0, -12]]) {
                if (!this.caches.has(id)) m.marker({ id: 'field-cache:' + id, name: 'Field crate', x, y, z, label: 'Open field crate', color: 0xe6c485 });
            }
            m.marker({ id: 'field-board', name: 'Expedition board', x: 2.8, y: 0, z: 33.7, label: 'Read field challenges', color: 0xa6ddd0 });
        }

        snapshot() {
            return {
                surveyed: [...this.surveyed], caches: [...this.caches], challenges: [...this.challenges],
                delivery: this.delivery, wave: this.wave, waveClearedAt: this.waveClearedAt, siegeDone: this.siegeDone
            };
        }

        get unsafeToSave() { return this.activeWave.some((enemy) => enemy.alive); }

        get progress() {
            const m = this.mode;
            const s = this.campaign.metrics;
            switch (this.kind) {
                case 'homestead': {
                    const structures = new Set(this.campaign.placed.filter((piece) => piece.alive).map((piece) => piece.type)).size;
                    return { ready: structures >= 6 && s.crafted >= 8 && m.clock >= 180,
                        text: 'Homestead · structures ' + Math.min(structures, 6) + '/6 · crafted ' + Math.min(s.crafted || 0, 8) + '/8 · ' + Math.min(Math.floor(m.clock), 180) + '/180s' };
                }
                case 'survey': return { ready: this.campaign.visited.size >= 6 && this.surveyed.size >= 3,
                    text: 'Survey · areas ' + Math.min(this.campaign.visited.size, 6) + '/6 · cairns ' + Math.min(this.surveyed.size, 3) + '/3' };
                case 'salvage': return { ready: this.delivery, text: 'Deliver at Evac Ridge · ' + Object.entries(delivery).map(([key, n]) =>
                    Math.min(m.points[key] || 0, n) + '/' + n + ' ' + BO.SurvivalItemName(key).toLowerCase()).join(' · ') };
                case 'bounty': return { ready: !!s.sable && !!(s.frostBoss || s.cinderBoss || s.geodeBoss),
                    text: 'Bounty · Sable ' + (s.sable ? 'defeated' : 'at large') + ' · contract boss ' + (s.frostBoss || s.cinderBoss || s.geodeBoss ? 'defeated' : 'pending') };
                case 'siege': return { ready: this.siegeDone,
                    text: this.activeWave.length ? 'Ridge Siege · wave ' + this.wave + '/3 · ' + this.activeWave.filter((enemy) => enemy.alive).length + ' hostiles' :
                        this.wave ? 'Ridge Siege · wave ' + this.wave + ' cleared' : 'Go to Evac Ridge and start the three-wave siege.' };
                case 'bloodmoon': {
                    const moons = this.campaign.deep?.bloodMoonsSurvived || 0;
                    const defenses = this.campaign.placed.filter((p) => p.alive).length;
                    return { ready: moons >= 1 && defenses >= 4,
                        text: `Blood Moon Defense · structures ${Math.min(defenses, 4)}/4 · Blood Moons survived ${Math.min(moons, 1)}/1` };
                }
                case 'gauntlet': {
                    const bosses = s.bosses || 0;
                    return { ready: bosses >= 3, text: `Zone Boss Gauntlet · bosses defeated ${Math.min(bosses, 3)}/3` };
                }
                case 'scavenger': {
                    const forged = s.weaponsForged || 0;
                    return { ready: forged >= 1 && (s.kills || 0) >= 8,
                        text: `Zero-to-Hero · weapons forged ${Math.min(forged, 1)}/1 · kills ${Math.min(s.kills || 0, 8)}/8` };
                }
                case 'freeplay': return { ready: true, text: 'Free Roam · explore, trade, build, or evacuate from Evac Ridge.' };
                default: return { ready: m.core, text: 'Recover the research core below the central ramp.' };
            }
        }

        get objective() {
            if (this.mode.exfil) return null;
            if (this.progress.ready && this.kind !== 'freeplay') return 'Objective complete · call evacuation at Evac Ridge.';
            return this.progress.text;
        }

        routeEvac() {
            const m = this.mode;
            if (m.exfil) return true;
            if (!m.hostilesReleased) {
                m.toast('Evacuation opens after the safe period.');
                return false;
            }
            if (this.kind === 'salvage' && !this.delivery && m.spend(delivery)) {
                this.delivery = true;
                this.campaign.mark('deliveries', 1, 100);
            }
            if (this.kind === 'siege' && !this.siegeDone) {
                if (!this.unsafeToSave && (!this.wave || m.clock >= this.waveClearedAt + 5)) this.startWave();
                else m.toast('Clear the current wave and regroup before starting the next.');
                return false;
            }
            if (!this.progress.ready) {
                m.toast(this.progress.text);
                return false;
            }
            return true;
        }

        startWave() {
            const m = this.mode;
            if (!m.hostilesReleased || this.wave >= 3) return;
            this.wave++;
            this.siegeSpawned = true;
            for (let i = 0; i < 4 + this.wave * 2; i++) {
                const [x, y, z] = encounterSites[i % encounterSites.length];
                const type = this.wave === 3 && i === 0 ? 'siegeBoss' : 'siege';
                const spawned = m.spawnInfected(x + Math.floor(i / 5) * 1.6, y, z, type);
                if (spawned) this.activeWave.push(spawned);
            }
            m.toast('Ridge Siege · wave ' + this.wave + ' inbound.');
        }

        update() {
            if (!this.siegeSpawned || this.unsafeToSave) return;
            this.siegeSpawned = false;
            this.activeWave = [];
            this.waveClearedAt = this.mode.clock;
            this.campaign.mark('siegeWaves', 1, 68);
            if (this.wave === 3) {
                this.siegeDone = true;
                this.mode.toast('Siege survived. Use Evac Ridge again to call extraction.');
            } else this.mode.toast('Wave clear. Use the ridge beacon again after five seconds.');
        }

        activate(marker) {
            const m = this.mode;
            const [kind, id] = marker.id.split(':');
            if (kind === 'survey') {
                this.surveyed.add(id);
                this.campaign.mark('cairns', 1, 30);
                m.toast(marker.name + ' logged · +30 XP');
            } else if (kind === 'field-cache') {
                this.caches.add(id);
                this.campaign.mark('fieldCaches', 1, 17);
                const found = { camp: { rations: 1, herbs: 2, timber: 2 }, quarry: { stone: 4, coal: 2, cloth: 1 },
                    rail: { scrap: 3, fuel: 1, rations: 1 } };
                m.grant(found[id]);
            } else if (marker.id === 'field-board') {
                BO.SurvivalUI.show('objectives');
                return true;
            } else return false;
            marker.alive = false;
            marker.light.visible = false;
            return true;
        }

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
})(window.BO);
