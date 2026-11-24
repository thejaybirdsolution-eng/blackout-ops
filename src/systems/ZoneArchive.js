/* ============================================================================
   BLACKOUT OPS — The Archive: intel and feats that persist between expeditions
   - Intel: sixteen documents, recordings and letters hidden in fixed containers
     across the Zone. Together they tell what Project Lantern was and how the
     valley fell. Once found they stay in the Archive forever; every fourth
     document earns a commendation and the full set is a feat.
   - Feats: long-term goals checked live during a run and across your career.
     Each pays commendations once, with a banner when it unlocks.
============================================================================ */
(function (BO) {
    'use strict';

    const INTEL = [
        { id: 'i01', region: 'crash', kind: 'Flight log', title: 'Medevac 2-7, final entry',
            text: 'Wind shear off the crater rim — or something that felt like wind. Every instrument pointed at the light at once. Pilot reports a hum in his teeth. Losing altitude over the valley floor. If anyone finds this: the beam is not a fire. Do not fly toward it.' },
        { id: 'i02', region: 'relay', kind: 'Ranger notebook', title: 'Ranger Hale, week one',
            text: 'Deer walking in circles around the basin, all facing the campus. Called it in. Black Pine security told us to keep the public off the north road and "let the resonance trials run." Nobody told us what a resonance trial was.' },
        { id: 'i03', region: 'relay', kind: 'Radio transcript', title: 'Mast relay — static capture',
            text: '"...Haven to anyone... we have water and a fence... the dead don\'t cross the stream on the east side, we don\'t know why... if you can hear this, follow the mast lights..." [Repeats every 40 minutes. Timestamp: 211 days ago.]' },
        { id: 'i04', region: 'hollow', kind: 'Police report', title: 'Hollow PD incident #4471',
            text: 'Fourteen residents found standing in the church yard at 0300 facing north. Unresponsive, pupils fixed. By morning three had bitten their families. Requested state support. Black Pine sent a liaison instead, with sealed orders and a Geiger counter.' },
        { id: 'i05', region: 'hollow', kind: 'Letter', title: 'To Mara, from the school',
            text: 'The teachers keep the blinds down so the children can\'t see the light at night. Little Teo says it sings. He draws it every day — a tall diamond with a line going up to the stars. I am scared of how calm he is. Come get us if the bridge is open. — Your sister' },
        { id: 'i06', region: 'kessel', kind: 'Shipping manifest', title: 'Kessel yard, crate KX-90',
            text: 'Contents: 6× resonance coil (cryo), 1× focusing lattice, "Lantern core assembly — DO NOT VIBRATE." Destination: Black Pine Campus, lab 3. Signed for by Dr. Ines Varga, Project Director. Shipment insured for more than the town is worth.' },
        { id: 'i07', region: 'kessel', kind: 'PMC orders', title: 'Halberd Group — standing orders',
            text: 'Secure all Black Pine materiel. Survivors are to be turned away from the yards. Infected are a secondary concern — they ignore personnel who stay quiet. Recovered research outranks recovered people. Payment on delivery of the core data.' },
        { id: 'i08', region: 'pine', kind: 'Field recording', title: 'Mill foreman, recorded on a phone',
            text: '[Wind, saws idling.] "They come out of the den at dusk now, the long-armed ones. Not hunting. Walking south, toward the crater, like they\'re being called home. We stopped cutting. You can feel it in the timber — everything in this forest leans toward that light."' },
        { id: 'i09', region: 'pine', kind: 'Research memo', title: 'Varga — "Biological coupling"',
            text: 'Unexpected result: tissue exposed to the Lantern field above 40 hertz begins to resonate in sympathy and does not stop when the field is removed. The subjects are not dead. They are tuned. Recommend we pause trials. Recommendation denied by the board.' },
        { id: 'i10', region: 'spillway', kind: 'Engineer\'s log', title: 'Turbine hall, night shift',
            text: 'The dam was meant to power the Lantern. Instead the Lantern started powering the dam — turbines spinning with the sluices closed. Output meters climbed past their limits. We cut the lines and it kept going. The water hums now. Don\'t drink downstream.' },
        { id: 'i11', region: 'spillway', kind: 'Letter', title: 'Boathouse, unsent',
            text: 'Took the boat out to the middle of the reservoir. Quiet out there — the infected won\'t come into deep water. Thought about rowing until morning and never coming back. Came back anyway. Somebody has to fix the towers so Haven can find the source.' },
        { id: 'i12', region: 'frost', kind: 'Survey data', title: 'Summit tower triangulation',
            text: 'Three towers, three bearings, one point: 22 east, 14 south of grid origin — dead centre of the crater. Signal strength rises every night by a fraction of a percent. Whatever the Lantern is doing, it is not stable. It is growing.' },
        { id: 'i13', region: 'frost', kind: 'Mine report', title: 'Quarry: crystal seam 6',
            text: 'Seam six is luminous. Miners report hearing their own heartbeats in the rock. Black Pine bought the whole seam and shipped it to the campus. The Pale Maul was a miner before. We recognised his boots.' },
        { id: 'i14', region: 'cinder', kind: 'Control room log', title: 'Refinery emergency stop',
            text: 'Lantern draw spiked and the cracking towers ignited one after another. Ash has been falling ever since. Halberd took the control room and the fuel. They wear masks now. Breathing the ash makes you cough, and coughing brings the dead.' },
        { id: 'i15', region: 'campus', kind: 'Director\'s journal', title: 'Varga — the last entry',
            text: 'The Warden was a volunteer. Captain Rhys Okoye, security chief, the only one who could stand next to the core without bleeding from the eyes. He stayed to hold it shut while we ran. He is still holding it. I think it is holding him too.' },
        { id: 'i16', region: 'campus', kind: 'Board minutes', title: 'Black Pine board — emergency session',
            text: 'Options presented: (1) overload the core and bury the crater; (2) recover the research and abandon the site; (3) continue the trials under Halberd protection. The board voted for option 3. The minutes end mid-sentence. The valley ended a week later.' }
    ];

    const FEATS = [
        { id: 'first_haven', name: 'Somewhere to Sleep', desc: 'Secure your first safehouse.', comm: 1, check: (x) => [x.m.safehouses || 0, 1] },
        { id: 'signal', name: 'Signal in the Static', desc: 'Restore the Relay mast.', comm: 1, check: (x) => [x.m.mastRestored || 0, 1] },
        { id: 'towers', name: 'Triangulated', desc: 'Repair all three radio towers in one expedition.', comm: 2, check: (x) => [x.c.activities?.relayCount || 0, 3] },
        { id: 'nests', name: 'Scorched Earth', desc: 'Burn three nests in one expedition.', comm: 2, check: (x) => [x.m.nests || 0, 3] },
        { id: 'gate', name: 'Clearance Granted', desc: 'Open the Black Pine campus gate.', comm: 2, check: (x) => [x.c.objectives.gateOpen ? 1 : 0, 1] },
        { id: 'warden', name: 'Relieved of Duty', desc: 'Defeat the Warden.', comm: 3, check: (x) => [x.m.wardenKilled || 0, 1] },
        { id: 'seal', name: 'Lights Out', desc: 'Seal the Lantern.', comm: 2, check: (x) => [x.p.endings?.seal ? 1 : 0, 1] },
        { id: 'extract', name: 'Whistleblower', desc: 'Extract the research data.', comm: 2, check: (x) => [x.p.endings?.extract ? 1 : 0, 1] },
        { id: 'seize', name: 'The New Warden', desc: 'Seize the Lantern.', comm: 2, check: (x) => [x.p.endings?.seize ? 1 : 0, 1] },
        { id: 'all_endings', name: 'Every Ending', desc: 'Reach all three endings across your career.', comm: 5, check: (x) => [['seal', 'extract', 'seize'].filter((e) => x.p.endings?.[e]).length, 3] },
        { id: 'deathless', name: 'Untouched', desc: 'Decide the Lantern without dying once in that expedition.', comm: 4, check: (x) => [x.c.objectives.ending && !(x.mode.deaths > 0) ? 1 : 0, 1] },
        { id: 'swift', name: 'Before the Fifth Dawn', desc: 'Decide the Lantern before day 5.', comm: 4, check: (x) => [x.c.objectives.ending && x.c.day < 5 ? 1 : 0, 1] },
        { id: 'cartographer', name: 'Cartographer', desc: 'Discover all ten regions in one expedition.', comm: 2, check: (x) => [x.c.visited.size, BO.Zone.REGIONS.length] },
        { id: 'survivor10', name: 'Long Haul', desc: 'Reach day 10 in one expedition.', comm: 2, check: (x) => [x.c.day, 10] },
        { id: 'horde1', name: 'Held the Line', desc: 'Survive a horde night.', comm: 1, check: (x) => [x.m.hordesSurvived || 0, 1] },
        { id: 'horde3', name: 'Siege Veteran', desc: 'Survive three horde nights in one expedition.', comm: 3, check: (x) => [x.m.hordesSurvived || 0, 3] },
        { id: 'fortress', name: 'Fortress', desc: 'Have 40 structures standing at once.', comm: 2, check: (x) => [x.c.placed.filter((p) => p.alive).length, 40] },
        { id: 'skyline', name: 'Skyline', desc: 'Place a structural piece on a third storey (over 5 m up).', comm: 1, check: (x) => [x.c.placed.some((p) => p.alive && BO.ZoneBuild.isStruct(p.type) && p.y - BO.World.terrainHeight(p.x, p.z) > 5) ? 1 : 0, 1] },
        { id: 'garrison1', name: 'Hostile Takeover', desc: 'Clear a PMC garrison.', comm: 1, check: (x) => [x.m.garrisons || 0, 1] },
        { id: 'garrison5', name: 'Halberd\'s Nightmare', desc: 'Clear five PMC garrisons in one expedition.', comm: 3, check: (x) => [x.m.garrisons || 0, 5] },
        { id: 'guardians4', name: 'Monster Hunter', desc: 'Defeat four named infected in one expedition.', comm: 3, check: (x) => [x.m.bosses || 0, 4] },
        { id: 'gunsmith', name: 'Hand-Loaded', desc: 'Hand-load ammunition at a bench.', comm: 1, check: (x) => [['reload9', 'reload556', 'reload762', 'reload12'].some((r) => x.m['crafted_' + r]) ? 1 : 0, 1] },
        { id: 'railroad', name: 'Rail Baron', desc: 'Ride the freight handcar.', comm: 1, check: (x) => [x.m.handcarRides || 0, 1] },
        { id: 'intel8', name: 'Investigator', desc: 'Recover eight intel documents.', comm: 2, check: (x) => [(x.p.intel || []).length, 8] },
        { id: 'intel16', name: 'The Black Pine Dossier', desc: 'Recover all sixteen intel documents.', comm: 5, check: (x) => [(x.p.intel || []).length, INTEL.length] }
    ];

    class ZoneArchive {
        constructor() {
            this.glints = new Map();
            this.placement = null;
        }

        get career() { return BO.SurvivalCareer; }
        get profile() {
            const p = this.career.profile;
            if (!Array.isArray(p.intel)) p.intel = [];
            if (!p.feats || typeof p.feats !== 'object') p.feats = {};
            return p;
        }

        /** Fixed container index for each document (deterministic for the shared world). */
        placements() {
            if (this.placement) return this.placement;
            const map = new Map();
            const used = new Set();
            const hash = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
            for (const doc of INTEL) {
                const pool = BO.Zone.containers.map((c, i) => ({ c, i })).filter(({ c, i }) => c.region === doc.region && !c.story && !used.has(i) && c.type !== 'fuel_drum');
                if (!pool.length) continue;
                const pick = pool[hash(doc.id) % pool.length];
                used.add(pick.i);
                map.set(pick.i, doc);
            }
            this.placement = map;
            return map;
        }

        intelAt(entry) { return this.placements().get(entry.i) || null; }
        has(id) { return this.profile.intel.includes(id); }
        doc(id) { return INTEL.find((d) => d.id === id); }

        start(mode) {
            this.stop();
            this.mode = mode;
            this.featClock = 4;
            // A faint glint over containers holding documents you have not read yet.
            for (const [i, doc] of this.placements()) {
                if (this.has(doc.id)) continue;
                const c = BO.Zone.containers[i];
                const glint = mode.mesh(new THREE.OctahedronGeometry(0.12), 0xf7e3a6, c.x, c.y + 1.45, c.z, { emissive: 0xf7e3a6, emissiveIntensity: 0.9 });
                this.glints.set(doc.id, glint);
            }
        }

        stop() {
            for (const g of this.glints.values()) g.visible = false;
            this.glints.clear();
            this.mode = null;
        }

        /** Called when a container is searched; returns true if it held a new document. */
        onSearched(entry) {
            const doc = this.intelAt(entry);
            if (!doc || this.has(doc.id)) return false;
            const p = this.profile;
            p.intel.push(doc.id);
            const n = p.intel.length;
            const g = this.glints.get(doc.id);
            if (g) { g.visible = false; this.glints.delete(doc.id); }
            let bonus = '';
            if (n % 4 === 0) { this.career.awardCommendations(1); bonus = ' · +1 COMMENDATION'; }
            else this.career.awardCommendations(0.4); // persist
            BO.Events.emit('hud:banner', { title: 'INTEL RECOVERED · ' + n + '/' + INTEL.length, sub: (doc.kind + ': ' + doc.title).toUpperCase() + bonus + ' · READ IT IN THE JOURNAL', color: '#f7e3a6' });
            BO.Sound?.playPerkBuy?.();
            this.mode?.campaign?.mark('intelFound', 1, 40);
            return true;
        }

        /* ------------------------------------------------------------ feats */
        ctx() {
            const mode = BO.SurvivalMode;
            return { mode, c: mode.campaign, m: mode.campaign?.metrics || {}, p: this.profile };
        }

        featList() {
            const x = this.mode?.campaign ? this.ctx() : { mode: {}, c: null, m: {}, p: this.profile };
            return FEATS.map((f) => {
                const done = !!this.profile.feats[f.id];
                let cur = 0, need = 1;
                if (!done && x.c) { try { [cur, need] = f.check(x); } catch (_) { /* not applicable yet */ } }
                else if (!done && /intel|endings/.test(f.id + f.desc)) { try { [cur, need] = f.check({ ...x, c: { objectives: {}, visited: new Set(), placed: [], activities: null } }); } catch (_) { /* ignore */ } }
                return { ...f, done, when: this.profile.feats[f.id] || null, cur: Math.min(cur, need), need };
            });
        }

        checkFeats() {
            if (!this.mode?.campaign) return;
            const x = this.ctx();
            const p = this.profile;
            for (const f of FEATS) {
                if (p.feats[f.id]) continue;
                let ok = false;
                try { const [cur, need] = f.check(x); ok = cur >= need; } catch (_) { ok = false; }
                if (!ok) continue;
                p.feats[f.id] = new Date().toISOString().slice(0, 10);
                this.career.awardCommendations(f.comm);
                BO.Events.emit('hud:banner', { title: 'FEAT UNLOCKED · ' + f.name.toUpperCase(), sub: f.desc.toUpperCase() + ' · +' + f.comm + ' COMMENDATION' + (f.comm === 1 ? '' : 'S'), color: '#f2d07a' });
                BO.Sound?.playPerkBuy?.();
            }
        }

        update(dt) {
            if (!this.mode) return;
            this.featClock -= dt;
            if (this.featClock <= 0) { this.featClock = 3; this.checkFeats(); }
            const t = performance.now() * 0.002;
            for (const g of this.glints.values()) { g.rotation.y = t; g.position.y += Math.sin(t * 2) * 0.0015; }
        }

        /* ------------------------------------------------------------ UI */
        intelHtml(esc, open) {
            const got = new Set(this.profile.intel);
            const regions = BO.Zone?.REGIONS || [];
            const nameOf = (id) => regions.find((r) => r.id === id)?.name || id;
            const rows = INTEL.map((d, k) => {
                const have = got.has(d.id);
                if (!have) return `<div class="sv-intel locked"><span class="sv-intel-n">${String(k + 1).padStart(2, '0')}</span><b>Undiscovered · ${esc(nameOf(d.region))}</b><small>Search containers in ${esc(nameOf(d.region))}. Unread documents glint faintly.</small></div>`;
                const isOpen = open === d.id;
                return `<button class="sv-intel ${isOpen ? 'open' : ''}" data-act="intelOpen" data-arg="${d.id}"><span class="sv-intel-n">${String(k + 1).padStart(2, '0')}</span><b>${esc(d.title)}</b><small>${esc(d.kind)} · ${esc(nameOf(d.region))}</small>${isOpen ? `<p>${esc(d.text)}</p>` : ''}</button>`;
            }).join('');
            return `<div class="sv-intel-list">${rows}</div>`;
        }

        featsHtml(esc) {
            const list = this.featList();
            return `<div class="sv-feats">${list.map((f) => `<div class="sv-feat ${f.done ? 'done' : ''}" title="${esc(f.desc)}">
                <b>${f.done ? '✦' : '◇'} ${esc(f.name)}</b><small>${esc(f.desc)}</small>
                <span class="sv-feat-f">${f.done ? 'Unlocked ' + esc(f.when) : (f.need > 1 ? f.cur + '/' + f.need : '')}<em>+${f.comm}c</em></span>
                ${!f.done && f.need > 1 ? `<i class="sv-feat-bar"><i style="width:${Math.round(f.cur / f.need * 100)}%"></i></i>` : ''}</div>`).join('')}</div>`;
        }

        summary() {
            const done = Object.keys(this.profile.feats).length;
            return { intel: this.profile.intel.length, intelTotal: INTEL.length, feats: done, featsTotal: FEATS.length };
        }
    }

    BO.ZoneArchive = new ZoneArchive();
    BO.ZoneArchive.INTEL = INTEL;
    BO.ZoneArchive.FEATS = FEATS;
})(window.BO);
