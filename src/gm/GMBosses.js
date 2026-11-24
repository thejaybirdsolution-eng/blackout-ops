/* ============================================================================
   BLACKOUT OPS — Survival 1.0: The seven final bosses (all optional)
   Lairs are revealed by Haven radio (days 2, 4 and 6) or by finding them.
   Walk up to a lair and challenge it when you are ready. Every arena has a
   leash (run too far and the fight resets), and a boss you cannot reach
   regenerates and pelts you with debris — no rooftop cheese.
     1 THE WARDEN            Crater   · the story finale (the Lantern pulse)
     2 THE HOLLOW MOTHER     Hollow   · invulnerable while 3+ egg sacs live;
                                         burn or tear the sacs; acid pools
                                         dissolve dropped gear      → Hive gland
     3 THE PINEBREAK STALKER Pinebreak· night only; invisible past 6 m unless
                                         lit; takes little damage unseen
                                                                    → Night-sight monocle
     4 THE FROSTLINE COLOSSUS Frostline· freezing aura; armoured until fire
                                         heats its plates; rockslides
                                                                    → Thermal rig + wind turbines
     5 THE CINDER LEVIATHAN  Cinder   · burrows, erupts where you make noise,
                                         leaves lava; noisemakers bait it
                                                                    → Fireproof hauler pack
     6 COMMANDER SABLE       Kessel   · human tactician: squad, mortars and
                                         reinforcements while his radio relays stand
                                                                    → PMC codebook
     7 THE DROWNED CHOIR     Spillway · resonators drag you into the water and
                                         shield the conductor; swimmers rise
                                                                    → Rebreather + boat schematic
============================================================================ */
(function (BO) {
    'use strict';
    const GM = BO.GM;

    const DEFS = {
        mother: { name: 'The Hollow Mother', region: 'hollow', reveal: 2, arena: 26, base: 'boss_witch_queen', hp: 2600, speed: 2.3, dmg: 34, scale: 1.25, skin: 0x5b6b3a, shirt: 0x2f3b1f, eye: 0xb6ff3a, reward: 'hiveGland', rewardName: 'Hive gland', rewardText: 'Your light claims reach 50% further.' },
        stalker: { name: 'The Pinebreak Stalker', region: 'pine', reveal: 2, arena: 34, base: 'boss_lycan_king', hp: 2100, speed: 4.6, dmg: 30, scale: 1.1, skin: 0x1f2326, shirt: 0x0b0d0e, eye: 0xe5e7eb, night: true, reward: 'monocle', rewardName: 'Night-sight monocle', rewardText: 'You see in the dark without carrying a light.' },
        colossus: { name: 'The Frostline Colossus', region: 'frost', reveal: 4, arena: 36, base: 'boss_ogre_emperor', hp: 3600, speed: 1.9, dmg: 48, scale: 1.55, skin: 0xb8d4e3, shirt: 0x5b7f95, eye: 0x7dd3fc, reward: 'thermalRig', rewardName: 'Thermal rig', rewardText: 'Immune to cold, no lava burns, and the wind turbine blueprint.' },
        leviathan: { name: 'The Cinder Leviathan', region: 'cinder', reveal: 6, arena: 38, base: 'boss_hydra_matron', hp: 3300, speed: 3.2, dmg: 44, scale: 1.3, skin: 0x7c2d12, shirt: 0x431407, eye: 0xfb923c, reward: 'fireproofPack', rewardName: 'Fireproof hauler pack', rewardText: '+10 pack slots and +10 kg; your body bag survives lava.' },
        sable: { name: 'Commander Sable', region: 'kessel', reveal: 4, arena: 40, human: true, hp: 1100, reward: 'codebook', rewardName: 'PMC codebook', rewardText: 'PMC patrols hold fire unless you shoot first, and a daily Sable fire team answers your call.' },
        choir: { name: 'The Drowned Choir', region: 'spillway', reveal: 6, arena: 34, base: 'boss_plague', hp: 2800, speed: 2.6, dmg: 36, scale: 1.2, skin: 0x2b5a6e, shirt: 0x0f2a36, eye: 0x67e8f9, reward: 'rebreather', rewardName: 'Rebreather & boat schematic', rewardText: 'Unlimited swimming, and you can build the reservoir skiff.' }
    };

    const Bosses = {
        rate: 0,

        start(mode, saved) {
            this.mode = mode;
            this.state = JSON.parse(JSON.stringify(saved?.state || {}));
            this.rewards = new Set(saved?.rewards || []);
            this.fight = null;
            this.impacts = [];
            this.objects = [];
            this.lairs = {};
            this.revealDay = saved?.revealDay || 0;
            this.retireLegends();
            this.placeLairs();
            this.patch();
            if (this.rewards.has('fireproofPack')) this.applyPack();
            GM.ui.panel('bosses', { title: () => 'Final bosses', render: () => this.renderList() });
        },

        stop() {
            this.endFight(true);
            this.unpatch();
            for (const o of this.objects) o.removeFromParent?.();
            this.objects = [];
            this.mode = null;
        },

        snapshot() { return { state: this.state, rewards: [...this.rewards], revealDay: this.revealDay }; },

        hasReward(id) { return !!this.rewards?.has(id); },
        fighting() { return !!this.fight; },

        /* ---------------------------------------------------------- setup */
        retireLegends() {
            const L = BO.ZoneLegends;
            if (!L) return;
            this._legendsUpdate = this._legendsUpdate || L.updateLegends;
            L.updateLegends = function () {};
            for (const mk of this.mode.markers) if (mk.id?.startsWith('pit:')) mk.alive = false;
            for (const o of L.objects || []) if (o) o.visible = false;
        },

        placeLairs() {
            const m = this.mode;
            const nav = BO.World.nav;
            for (const [id, d] of Object.entries(DEFS)) {
                const r = BO.Zone.REGIONS.find((x) => x.id === d.region);
                if (!r) continue;
                let at = null;
                for (let tries = 0; tries < 60 && !at; tries++) {
                    const a = tries * 2.4, rad = tries * 0.9;
                    const x = r.x + Math.cos(a) * rad, z = r.z + Math.sin(a) * rad;
                    const j = nav?.idx(x, z) ?? -1;
                    if (j < 0 || !nav.walk[j]) continue;
                    if (id !== 'choir' && BO.Zone.inReservoir(x, z)) continue;
                    if (BO.Zone.pois?.some((p) => Math.abs(p.x - x) < (p.w || 8) / 2 + 2 && Math.abs(p.z - z) < (p.d || 8) / 2 + 2)) continue;
                    at = { x, y: nav.y[j], z };
                }
                if (id === 'choir') {
                    const R = BO.Zone.RESERVOIR;
                    if (R) { const x = (R.x ?? R.cx ?? r.x) + 0, z = (R.z ?? R.cz ?? r.z) + (R.r || R.rz || 20) + 6; const j = nav?.idx(x, z) ?? -1; if (j >= 0 && nav.walk[j]) at = { x, y: nav.y[j], z }; }
                }
                if (!at) at = { x: r.x, y: GM.ground(r.x, r.z), z: r.z };
                const st = this.state[id] || (this.state[id] = { s: 'hidden' });
                const obelisk = m.mesh(new THREE.CylinderGeometry(0.25, 0.5, 3.2, 6), 0x1f2937, at.x, at.y + 1.6, at.z, { emissive: d.eye || 0xef4444, emissiveIntensity: 0.35 });
                obelisk.visible = st.s !== 'dead';
                this.lairs[id] = { ...at, def: d, obelisk };
                const mk = { id: 'gmlair:' + id, x: at.x + 1.2, y: at.y, z: at.z, name: d.name, alive: st.s !== 'dead', reach: 3, label: '' };
                m.markers.push(mk);
                this.lairs[id].marker = mk;
                this.refreshLair(id);
            }
        },

        refreshLair(id) {
            const L = this.lairs[id];
            const st = this.state[id];
            const d = L.def;
            L.marker.alive = st.s !== 'dead';
            L.marker.label = d.night && !this.mode.campaign.isNight ? d.name + ' only answers at night' : 'Challenge ' + d.name + ' (optional final boss)';
        },

        patch() {
            const m = this.mode;
            const self = this;
            this._orig = { explode: m.explode, limits: Object.getOwnPropertyDescriptor(Object.getPrototypeOf(m.campaign.pack), 'limits') };
            m.explode = function (pos, radius, damage, flash, stun, kind) {
                self.onExplosion(pos, radius, damage, kind);
                return self._orig.explode.call(this, pos, radius, damage, flash, stun, kind);
            };
            const FR = BO.ZoneFrontier;
            if (FR && !this._ambientWrapped) {
                const orig = FR.ambient;
                this._ambientOrig = orig;
                FR.ambient = function () {
                    let t = orig.call(this);
                    const f = self.fight;
                    if (f?.id === 'colossus' && f.boss?.alive && f.boss.pos.distanceTo(BO.Player.pos) < 22) t -= 15;
                    if (self.hasReward('thermalRig') && t < 12) t = 12;
                    return t;
                };
                this._ambientWrapped = true;
            }
        },

        unpatch() {
            if (!this._orig || !this.mode) return;
            this.mode.explode = this._orig.explode;
            if (this._ambientWrapped && BO.ZoneFrontier) { BO.ZoneFrontier.ambient = this._ambientOrig; this._ambientWrapped = false; }
            delete this.mode.campaign.pack.limits;
            if (BO.ZoneLegends && this._legendsUpdate) BO.ZoneLegends.updateLegends = this._legendsUpdate;
            this._orig = null;
        },

        applyPack() {
            const pack = this.mode.campaign.pack;
            const desc = this._orig.limits;
            Object.defineProperty(pack, 'limits', {
                configurable: true,
                get() { const l = desc.get.call(this); return { ...l, slots: l.slots + 10, weight: l.weight + 10, name: (l.name || 'Pack') + ' (fireproof hauler)' }; }
            });
        },

        /* ---------------------------------------------------------- lair interaction */
        interactLair(marker) {
            if (!marker.id?.startsWith('gmlair:')) return false;
            const id = marker.id.slice(7);
            const d = DEFS[id];
            const st = this.state[id];
            if (!d || st.s === 'dead') return true;
            if (this.fight) { GM.toast('You are already in a boss fight.', '#ef4444'); return true; }
            if (d.night && !this.mode.campaign.isNight) { GM.toast(d.name + ' only hunts at night.', '#cbd5e1'); return true; }
            if (BO.ZoneHorde?.active || BO.ZoneFinale?.active) { GM.toast('Not now — survive what is already coming.', '#ef4444'); return true; }
            this.beginFight(id);
            return true;
        },

        /* ---------------------------------------------------------- spawning */
        makeSpec(d) {
            const base = BO.ZombiesData.get(d.base);
            const spec = JSON.parse(JSON.stringify(base));
            spec.id = base.id;
            spec.name = d.name.toUpperCase();
            spec.isBoss = true;
            spec.bodySpec = { ...(spec.bodySpec || {}), skinColor: d.skin, shirtColor: d.shirt, eyeColor: d.eye };
            if (spec.bodySpec.scale) spec.bodySpec.scale = spec.bodySpec.scale.map((v) => v * d.scale);
            return spec;
        },

        spawnBossEntity(id, x, z) {
            const m = this.mode;
            const d = DEFS[id];
            const y = GM.ground(x, z);
            const diff = m.difficultyRules || { hp: 1, damage: 1 };
            const e = new BO.ZombieEntity({ id: m.nextEnemy++, spec: this.makeSpec(d), x, y, z, round: 1, hp: Math.round(d.hp * diff.hp), speed: d.speed, damage: Math.round(d.dmg * diff.damage) });
            e.survivalType = 'gm_' + id;
            e.bossLabel = d.name;
            e.gmBoss = id;
            e.zs = { state: 'hunt', seen: m.clock, home: { x, z }, x, z, until: 0, wander: 0 };
            m.zombies.push(e);
            m.refreshTargets();
            return e;
        },

        beginFight(id) {
            const m = this.mode;
            const L = this.lairs[id];
            const d = DEFS[id];
            const f = { id, def: d, cx: L.x, cz: L.z, r: d.arena, started: m.clock, unreach: 0, phase: 1, adds: [], props: [], t: {} };
            this.fight = f;
            GM.sting('boss');
            GM.banner(d.name.toUpperCase(), this.intro(id), '#ef4444');
            this.ring(L.x, L.z, d.arena, 0xef4444, Infinity, true);
            if (d.human) this.setupSable(f);
            else {
                const a = Math.random() * Math.PI * 2;
                f.boss = this.spawnBossEntity(id, L.x + Math.cos(a) * 8, L.z + Math.sin(a) * 8);
                if (id === 'mother') this.setupMother(f);
                if (id === 'choir') this.setupChoir(f);
                if (id === 'leviathan') { f.t.burrow = m.clock + 5; f.surfaced = true; }
                if (id === 'colossus') { f.t.slide = m.clock + 8; f.heated = 0; }
                if (id === 'stalker') { f.t.reposition = m.clock + 10; }
            }
            this.state[id].s = 'fighting';
            this.refreshLair(id);
        },

        intro(id) {
            return {
                mother: 'SHE IS UNTOUCHABLE WHILE THREE EGG SACS LIVE · BURN THEM OR TEAR THEM (E) · AVOID THE ACID',
                stalker: 'IT VANISHES IN THE DARK · LIGHT IT UP: TORCHES, FLARES, SEARCHLIGHTS · UNSEEN IT BARELY BLEEDS',
                colossus: 'ITS PLATES ARE FROZEN SOLID · FIRE HEATS THEM · WATCH FOR ROCKSLIDES · STAY WARM',
                leviathan: 'IT HUNTS YOUR NOISE FROM BELOW · BAIT IT WITH A NOISEMAKER · HIT IT WHEN IT SURFACES',
                sable: 'CUT HIS THREE RADIO RELAYS (E) TO STOP REINFORCEMENTS AND MORTARS · KEEP MOVING',
                choir: 'THE SONG DRAGS YOU INTO THE WATER · SMASH THE THREE RESONATORS (E OR EXPLOSIVES) TO BREAK HER SHIELD'
            }[id] || '';
        },

        /* ---------------------------------------------------------- props */
        ring(x, z, r, color, ttl, persistent = false) {
            const m = this.mode;
            const y = GM.ground(x, z) + 0.08;
            const mesh = m.mesh(new THREE.RingGeometry(Math.max(0.1, r - 0.25), r, 48), color, x, y, z, { emissive: color, emissiveIntensity: 0.8, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false });
            mesh.rotation.x = -Math.PI / 2;
            const o = { mesh, until: m.clock + ttl, persistent };
            this.objects.push(mesh);
            if (persistent && this.fight) this.fight.props.push(mesh);
            else setTimeout(() => this.mode && this.mode.disposeOwned(mesh), Math.min(60000, ttl * 1000));
            return o;
        },

        impact(x, z, r, delay, dmg, kind = 'rock', after = null) {
            const color = kind === 'mortar' ? 0xf97316 : kind === 'acid' ? 0x84cc16 : kind === 'erupt' ? 0xff3d00 : 0xe5e7eb;
            this.ring(x, z, r, color, delay + 0.2);
            this.impacts.push({ x, z, r, at: this.mode.clock + delay, dmg, kind, after });
        },

        resolveImpacts() {
            const m = this.mode;
            const p = BO.Player;
            for (let i = this.impacts.length - 1; i >= 0; i--) {
                const im = this.impacts[i];
                if (m.clock < im.at) continue;
                this.impacts.splice(i, 1);
                const pos = new THREE.Vector3(im.x, GM.ground(im.x, im.z) + 0.5, im.z);
                if (im.kind === 'acid') this.addPool(im.x, im.z, 2.4, 'acid', 18);
                else {
                    BO.FX?.spawnExplosion?.(pos, im.r * 0.8, im.kind === 'erupt' ? 0xff5a1f : im.kind === 'mortar' ? 0xf97316 : 0xbfc7cf);
                    BO.Sound?.playExplosion?.(0.8);
                    p.cameraShake = Math.max(p.cameraShake || 0, 0.08);
                }
                const d = Math.hypot(p.pos.x - im.x, p.pos.z - im.z);
                if (im.dmg && d < im.r && p.alive) p.takeDamage(im.dmg * (1 - d / (im.r * 1.6)), pos, true);
                for (const z of m.zombies) if (z.alive && !z.gmBoss && Math.hypot(z.pos.x - im.x, z.pos.z - im.z) < im.r) m.hit(z, im.dmg * 0.8, 'torso', null, 'explosive', { team: 0 });
                im.after?.(pos);
            }
        },

        addPool(x, z, r, kind, ttl) {
            const m = this.mode;
            const color = kind === 'acid' ? 0x84cc16 : 0xff3d00;
            const mesh = m.mesh(new THREE.CircleGeometry(r, 16), color, x, GM.ground(x, z) + 0.07, z, { emissive: color, emissiveIntensity: 0.8, transparent: true, opacity: 0.8, depthWrite: false });
            mesh.rotation.x = -Math.PI / 2;
            const pool = { x, z, r, kind, until: m.clock + ttl, mesh };
            (this.pools = this.pools || []).push(pool);
            return pool;
        },

        updatePools(dt) {
            const m = this.mode;
            const p = BO.Player;
            for (let i = (this.pools || []).length - 1; i >= 0; i--) {
                const pl = this.pools[i];
                if (m.clock > pl.until) { m.disposeOwned(pl.mesh); this.pools.splice(i, 1); continue; }
                if (p.alive && Math.hypot(p.pos.x - pl.x, p.pos.z - pl.z) < pl.r && p.onGround) {
                    if (!(pl.kind === 'lava' && this.hasReward('thermalRig'))) p.takeDamage((pl.kind === 'acid' ? 14 : 24) * dt);
                }
            }
        },

        destroysItemsAt(pos) { return (this.pools || []).some((pl) => Math.hypot(pl.x - pos.x, pl.z - pos.z) < pl.r + 0.3); },

        /* ---------------------------------------------------------- Hollow Mother */
        setupMother(f) {
            const m = this.mode;
            f.sacs = [];
            for (let i = 0; i < 4; i++) {
                const a = i / 4 * Math.PI * 2 + 0.4;
                const x = f.cx + Math.cos(a) * (f.r * 0.6), z = f.cz + Math.sin(a) * (f.r * 0.6);
                const y = GM.ground(x, z);
                const mesh = m.mesh(new THREE.SphereGeometry(0.85, 12, 10), 0x9acd32, x, y + 0.85, z, { emissive: 0x4d7c0f, emissiveIntensity: 0.6, roughness: 0.3 });
                mesh.scale.set(1, 1.3, 1);
                f.props.push(mesh);
                const marker = { id: 'gmsac:' + i, x, y, z, name: 'Egg sac', label: 'Tear the egg sac (acid splash)', alive: true, reach: 2.4 };
                m.markers.push(marker);
                f.sacs.push({ x, y, z, hp: 120, mesh, marker, hatch: m.clock + 6 + i * 3 });
            }
            f.t.acid = m.clock + 8;
        },

        motherTick(f, dt) {
            const m = this.mode;
            const p = BO.Player.pos;
            for (const s of f.sacs) {
                if (s.hp <= 0) continue;
                for (const fire of m.fire) if (fire.pos.distanceTo(new THREE.Vector3(s.x, fire.pos.y, s.z)) < 2) s.hp -= 45 * dt;
                s.mesh.scale.y = 1.3 + Math.sin(m.clock * 4 + s.x) * 0.08;
                if (m.clock > s.hatch) {
                    s.hatch = m.clock + 15;
                    const zb = m.spawnInfected(s.x + 1, null, s.z + 1, 'normal', null, true);
                    if (zb) { zb.zs = { state: 'hunt', seen: m.clock, home: { x: s.x, z: s.z }, x: s.x, z: s.z, until: 0, wander: 0 }; f.adds.push(zb); }
                }
                if (s.hp <= 0) this.popSac(f, s);
            }
            if (m.clock > f.t.acid) {
                f.t.acid = m.clock + 9;
                this.impact(p.x, p.z, 2.4, 1.5, 10, 'acid');
            }
        },

        popSac(f, s) {
            s.hp = 0;
            s.marker.alive = false;
            s.mesh.visible = false;
            BO.FX?.spawnParticles?.(new THREE.Vector3(s.x, s.y + 0.8, s.z), 20, 0x9acd32, 5, 6, 0.6);
            BO.Sound?.playZombieGroan?.('wail_void', 0.6);
            const left = f.sacs.filter((x) => x.hp > 0).length;
            GM.toast(left >= 3 ? 'An egg sac bursts. ' + left + ' remain.' : left > 0 ? 'Her shield is down! ' + left + ' sacs remain.' : 'Every sac is gone — she is exposed.', '#a3e635');
        },

        /* ---------------------------------------------------------- Stalker */
        stalkerTick(f, dt) {
            const m = this.mode;
            const b = f.boss;
            const p = BO.Player;
            const d = b.pos.distanceTo(p.pos);
            const seen = this.stalkerSeen(b, d);
            if (b.parts?.root) b.parts.root.visible = seen;
            b.gmSeen = seen;
            if (m.clock > f.t.reposition && d < 30) {
                f.t.reposition = m.clock + 11 + Math.random() * 5;
                const yaw = p.yaw || 0;
                const x = p.pos.x + Math.sin(yaw) * 14, z = p.pos.z + Math.cos(yaw) * 14;
                const j = BO.World.nav?.idx(x, z) ?? -1;
                if (j >= 0 && BO.World.nav.walk[j] && Math.hypot(x - f.cx, z - f.cz) < f.r) { b.pos.set(x, GM.ground(x, z), z); BO.Sound?.playSpatialInfected?.('growl_beast', b.pos, 'Something circles behind you'); }
            }
        },

        stalkerSeen(b, d) {
            const m = this.mode;
            const c = m.campaign;
            if (d < 6) return true;
            if (b.gmRevealed && b.gmRevealed > m.clock) return true;
            if (c.pack.lightUntil > m.clock && d < 18) return true;
            if (m.fire.some((f) => f.pos.distanceTo(b.pos) < 7)) return true;
            if (!GM.get('threat')?.canSpawnAtRaw?.(b.pos.x, b.pos.z)) return true;
            if (this.hasReward('monocle')) return true;
            return !c.isNight && c.darkness < 0.4;
        },

        /* ---------------------------------------------------------- Colossus */
        colossusTick(f) {
            const m = this.mode;
            const p = BO.Player.pos;
            if (m.clock > f.t.slide) {
                f.t.slide = m.clock + (f.boss.hp < f.boss.maxHp * 0.5 ? 9 : 13);
                for (let i = 0; i < 3; i++) {
                    const a = Math.random() * Math.PI * 2, r = i === 0 ? 0 : 3 + Math.random() * 5;
                    this.impact(p.x + Math.cos(a) * r, p.z + Math.sin(a) * r, 2.6, 2, 42, 'rock');
                }
                GM.toast('Rockslide!', '#e5e7eb');
            }
            if (f.boss.parts?.root) {
                const hot = f.heated > m.clock;
                f.boss.parts.root.traverse?.((o) => { if (o.isMesh && o.material?.emissive) o.material.emissive.setHex(hot ? 0xff7a1a : 0x7dd3fc); });
            }
        },

        /* ---------------------------------------------------------- Leviathan */
        leviathanTick(f) {
            const m = this.mode;
            const b = f.boss;
            const p = BO.Player.pos;
            if (f.surfaced && m.clock > f.t.burrow) {
                f.surfaced = false;
                f.t.erupt = m.clock + 6;
                if (b.parts?.root) b.parts.root.visible = false;
                b.stunTimer = 99;
                BO.FX?.spawnParticles?.(b.pos.clone(), 24, 0x7c2d12, 6, 6, 0.6);
                GM.toast('It burrows. Stay quiet — or give it something louder to hunt.', '#fb923c');
            } else if (!f.surfaced && m.clock > f.t.erupt) {
                const lure = GM.get('threat')?.lures?.find((l) => l.kind === 'noisemaker' && Math.hypot(l.x - f.cx, l.z - f.cz) < f.r + 10);
                const noise = (BO.ZoneDirector.noises || []).filter((n) => m.clock - n.t < 6 && Math.hypot(n.x - f.cx, n.z - f.cz) < f.r + 8).pop();
                const tgt = lure || noise || p;
                const x = tgt.x, z = tgt.z;
                f.surfaced = true;
                f.t.erupt = Infinity;
                this.impact(x, z, 3.2, 1.3, 48, 'erupt', () => {
                    b.pos.set(x, GM.ground(x, z), z);
                    if (b.parts?.root) b.parts.root.visible = true;
                    b.stunTimer = lure ? 4 : 0.8;
                    f.baited = lure ? m.clock + 4 : 0;
                    this.addPool(x + 2, z + 1, 2.2, 'lava', 25);
                    f.t.burrow = m.clock + (lure ? 9 : 7);
                    if (lure) GM.toast('It took the bait — it is stunned!', '#fde68a');
                });
            }
        },

        /* ---------------------------------------------------------- Sable */
        setupSable(f) {
            const m = this.mode;
            const a = Math.random() * Math.PI * 2;
            const x = f.cx + Math.cos(a) * 10, z = f.cz + Math.sin(a) * 10;
            const diff = m.difficultyRules || { hp: 1 };
            const boss = m.spawnBot(x, GM.ground(x, z), z, 'm4a1', Math.round(DEFS.sable.hp * diff.hp), 1, true);
            if (!boss) { this.endFight(true); return; }
            boss.name = 'Commander Sable';
            boss.bossLabel = 'Commander Sable';
            boss.gmBoss = 'sable';
            boss.post = { x: f.cx, y: 0, z: f.cz, r: f.r * 0.7 };
            f.boss = boss;
            for (let i = 0; i < 4; i++) this.sableAdd(f);
            f.relays = [];
            for (let i = 0; i < 3; i++) {
                const ang = i / 3 * Math.PI * 2;
                const rx = f.cx + Math.cos(ang) * f.r * 0.75, rz = f.cz + Math.sin(ang) * f.r * 0.75;
                const ry = GM.ground(rx, rz);
                const mesh = m.mesh(new THREE.CylinderGeometry(0.08, 0.14, 4.5, 5), 0x6b7280, rx, ry + 2.25, rz, { emissive: 0xef4444, emissiveIntensity: 0.5 });
                f.props.push(mesh);
                const marker = { id: 'gmrelay:' + i, x: rx, y: ry, z: rz, name: 'Sable radio relay', label: 'Cut the radio relay', alive: true, reach: 2.6 };
                m.markers.push(marker);
                f.relays.push({ x: rx, z: rz, mesh, marker, alive: true });
            }
            f.t.mortar = m.clock + 10;
            f.t.reinforce = m.clock + 25;
            f.t.smoke = m.clock + 15;
        },

        sableAdd(f) {
            const m = this.mode;
            const a = Math.random() * Math.PI * 2;
            const x = f.cx + Math.cos(a) * 14, z = f.cz + Math.sin(a) * 14;
            const bot = m.spawnBot(x, GM.ground(x, z), z, ['ak47', 'mp5', 'r870'][Math.floor(Math.random() * 3)], 130, 1, true);
            if (bot) { bot.post = { x: f.cx, y: 0, z: f.cz, r: f.r * 0.8 }; bot.gmProvoked = true; f.adds.push(bot); }
        },

        sableTick(f) {
            const m = this.mode;
            const p = BO.Player.pos;
            const live = f.relays.filter((r) => r.alive).length;
            if (live && m.clock > f.t.mortar) {
                f.t.mortar = m.clock + 12;
                this.impact(p.x, p.z, 3.6, 2.2, 55, 'mortar');
                BO.Sound?.playTone?.(900, 300, 1.6, 'sine', 0.06);
            }
            if (live && m.clock > f.t.reinforce) {
                f.t.reinforce = m.clock + 25;
                this.sableAdd(f); this.sableAdd(f);
                GM.toast('Sable radios for reinforcements.', '#f87171');
            }
            if (m.clock > f.t.smoke && f.boss.alive) {
                f.t.smoke = m.clock + 18;
                BO.FX?.spawnParticles?.(f.boss.pos.clone().setY(f.boss.pos.y + 1), 40, 0x9ca3af, 5, 1, 2.5, 2.4);
            }
            f.boss.gmProvoked = true;
        },

        /* ---------------------------------------------------------- Choir */
        setupChoir(f) {
            const m = this.mode;
            f.resonators = [];
            for (let i = 0; i < 3; i++) {
                const ang = i / 3 * Math.PI * 2 + 0.3;
                const x = f.cx + Math.cos(ang) * f.r * 0.7, z = f.cz + Math.sin(ang) * f.r * 0.7;
                const y = Math.max(GM.ground(x, z), BO.Zone.WATER - 1.3);
                const mesh = m.mesh(new THREE.CylinderGeometry(0.35, 0.5, 2.6, 8), 0x0e7490, x, y + 1.3, z, { emissive: 0x67e8f9, emissiveIntensity: 0.9 });
                f.props.push(mesh);
                const marker = { id: 'gmreso:' + i, x, y, z, name: 'Resonator', label: 'Smash the resonator', alive: true, reach: 2.8, hits: 0 };
                m.markers.push(marker);
                f.resonators.push({ x, y, z, hp: 3, mesh, marker });
            }
            f.t.swimmers = m.clock + 10;
            f.t.hum = 0;
        },

        choirTick(f, dt) {
            const m = this.mode;
            const p = BO.Player;
            const live = f.resonators.filter((r) => r.hp > 0);
            if (live.length && p.alive) {
                const R = BO.Zone.RESERVOIR;
                const wx = R?.x ?? R?.cx ?? f.cx, wz = R?.z ?? R?.cz ?? f.cz;
                const dx = wx - p.pos.x, dz = wz - p.pos.z;
                const d = Math.hypot(dx, dz) || 1;
                const pull = 0.9 * live.length / 3;
                p.pos.x += dx / d * pull * dt;
                p.pos.z += dz / d * pull * dt;
                f.t.hum -= dt;
                if (f.t.hum <= 0) { f.t.hum = 2.4; BO.Sound?.playTone?.(196 + live.length * 30, 180, 2.2, 'sine', 0.05); }
            }
            for (const r of f.resonators) if (r.hp > 0) r.mesh.material.emissiveIntensity = 0.7 + Math.sin(m.clock * 6 + r.x) * 0.3;
            if (m.clock > f.t.swimmers) {
                f.t.swimmers = m.clock + 12;
                for (let i = 0; i < 2; i++) {
                    const a = Math.random() * Math.PI * 2;
                    const x = f.cx + Math.cos(a) * 10, z = f.cz + Math.sin(a) * 10;
                    const zb = m.spawnInfected(x, null, z, 'normal', null, true);
                    if (zb) { zb.gmRole = 'swimmer'; zb.zs = { state: 'hunt', seen: m.clock, home: { x, z }, x, z, until: 0, wander: 0 }; f.adds.push(zb); }
                }
            }
        },

        hitResonator(f, r, dmg = 1) {
            r.hp -= dmg;
            BO.FX?.spawnParticles?.(new THREE.Vector3(r.x, r.y + 1.3, r.z), 14, 0x67e8f9, 4, 3, 0.4);
            BO.Sound?.playWallHit?.();
            if (r.hp <= 0) {
                r.marker.alive = false;
                r.mesh.visible = false;
                const left = f.resonators.filter((x) => x.hp > 0).length;
                GM.toast(left ? 'A resonator shatters. ' + left + ' still sing.' : 'The song breaks — the conductor is exposed!', '#67e8f9');
            }
        },

        /* ---------------------------------------------------------- explosion hook */
        onExplosion(pos, radius, damage) {
            const f = this.fight;
            if (!f) return;
            for (const s of f.sacs || []) if (s.hp > 0 && Math.hypot(s.x - pos.x, s.z - pos.z) < radius + 1) { s.hp -= damage * 1.5; if (s.hp <= 0) this.popSac(f, s); }
            for (const r of f.resonators || []) if (r.hp > 0 && Math.hypot(r.x - pos.x, r.z - pos.z) < radius + 1) this.hitResonator(f, r, 3);
            for (const r of f.relays || []) if (r.alive && Math.hypot(r.x - pos.x, r.z - pos.z) < radius + 1) this.cutRelay(f, r);
        },

        cutRelay(f, r) {
            r.alive = false;
            r.marker.alive = false;
            r.mesh.material.emissive.setHex(0x111111);
            r.mesh.rotation.z = 0.6;
            BO.Sound?.playWallBreak?.();
            const left = f.relays.filter((x) => x.alive).length;
            GM.toast(left ? 'Relay down. ' + left + ' left.' : 'All relays cut — no more mortars or reinforcements!', '#fde68a');
        },

        /* ---------------------------------------------------------- damage rules */
        outgoingDamageMult(entity, kind) {
            const f = this.fight;
            if (!f || entity !== f.boss) return 1;
            const m = this.mode;
            switch (f.id) {
                case 'mother': return f.sacs.filter((s) => s.hp > 0).length >= 3 ? 0.04 : 1;
                case 'stalker': return entity.gmSeen ? 1.15 : 0.3;
                case 'colossus':
                    if (kind === 'fire') { f.heated = m.clock + 6; return 1.3; }
                    return f.heated > m.clock ? 1.6 : 0.25;
                case 'leviathan': return !f.surfaced ? 0 : f.baited > m.clock ? 1.5 : 1;
                case 'sable': return f.relays.some((r) => r.alive) ? 0.5 : 1;
                case 'choir': return f.resonators.some((r) => r.hp > 0) ? 0.05 : 1;
                default: return 1;
            }
        },

        interactProp(marker) {
            const f = this.fight;
            if (!f) return false;
            const id = marker.id || '';
            if (id.startsWith('gmsac:')) {
                const s = f.sacs?.[Number(id.slice(6))];
                if (s && s.hp > 0) {
                    s.hp -= 40;
                    BO.Player.takeDamage(8);
                    BO.Sound?.playMelee?.();
                    BO.FX?.spawnParticles?.(new THREE.Vector3(s.x, s.y + 0.8, s.z), 8, 0x9acd32, 3, 3, 0.4);
                    if (s.hp <= 0) this.popSac(f, s);
                }
                return true;
            }
            if (id.startsWith('gmreso:')) { const r = f.resonators?.[Number(id.slice(7))]; if (r && r.hp > 0) this.hitResonator(f, r, 1); return true; }
            if (id.startsWith('gmrelay:')) { const r = f.relays?.[Number(id.slice(8))]; if (r && r.alive) this.cutRelay(f, r); return true; }
            return false;
        },

        /* ---------------------------------------------------------- fight loop */
        update(dt) {
            const m = this.mode;
            const c = m.campaign;
            // Radio reveals.
            for (const [id, d] of Object.entries(DEFS)) {
                const st = this.state[id];
                const L = this.lairs[id];
                if (!L) continue;
                if (st.s === 'hidden' && (c.day >= d.reveal || GM.dist2(L, BO.Player.pos) < 60)) {
                    st.s = 'known';
                    BO.Sound?.playRadioChirp?.('in');
                    GM.banner('HAVEN RADIO: ' + d.name.toUpperCase(), 'A LAIR IS MARKED ON YOUR MAP · OPTIONAL FINAL BOSS · REWARD: ' + d.rewardName.toUpperCase(), '#fca5a5');
                }
                if (L.obelisk) L.obelisk.material.emissiveIntensity = st.s === 'known' ? 0.4 + Math.sin(m.clock * 2) * 0.25 : 0.2;
                if ((m.clock | 0) % 5 === 0) this.refreshLair(id);
            }
            this.resolveImpacts();
            this.updatePools(dt);
            const f = this.fight;
            if (!f) return;
            const p = BO.Player;
            if (!f.boss || !f.boss.alive) { if (f.boss && !f.boss.alive && f.boss.hp <= 0) this.win(f); else this.endFight(); return; }
            // Leash.
            const dp = Math.hypot(p.pos.x - f.cx, p.pos.z - f.cz);
            if (dp > f.r + 15) { GM.toast('You left the arena. ' + f.def.name + ' recovers.', '#f59e0b'); this.endFight(); return; }
            const db = Math.hypot(f.boss.pos.x - f.cx, f.boss.pos.z - f.cz);
            if (db > f.r && !f.def.human) { f.boss.pos.x += (f.cx - f.boss.pos.x) * 0.2; f.boss.pos.z += (f.cz - f.boss.pos.z) * 0.2; }
            // Anti-cheese: unreachable player.
            const ground = GM.ground(p.pos.x, p.pos.z, p.pos.y + 0.5);
            const unreachable = (p.pos.y - ground > 2.6 && !f.def.human) || (m.swimming && f.id !== 'choir');
            f.unreach = unreachable ? f.unreach + dt : Math.max(0, f.unreach - dt * 2);
            if (f.unreach > 8) {
                f.boss.hp = Math.min(f.boss.maxHp, f.boss.hp + f.boss.maxHp * 0.1 * dt);
                f.t.debris = (f.t.debris || 0) - dt;
                if (f.t.debris <= 0) { f.t.debris = 2; this.impact(p.pos.x, p.pos.z, 2, 0.9, 15, 'rock'); if (!f.warnedCheese) { f.warnedCheese = true; GM.toast(f.def.name + ' cannot reach you — it regenerates and hurls debris. Come down and fight.', '#f59e0b'); } }
            }
            if (f.boss.zs) { f.boss.zs.state = 'hunt'; f.boss.zs.seen = m.clock; }
            switch (f.id) {
                case 'mother': this.motherTick(f, dt); break;
                case 'stalker': this.stalkerTick(f, dt); break;
                case 'colossus': this.colossusTick(f, dt); break;
                case 'leviathan': this.leviathanTick(f, dt); break;
                case 'sable': this.sableTick(f, dt); break;
                case 'choir': this.choirTick(f, dt); break;
                default: break;
            }
            // Phase 2 at half health.
            if (f.phase === 1 && f.boss.hp < f.boss.maxHp * 0.5) {
                f.phase = 2;
                if (f.boss.speed) f.boss.speed *= 1.2;
                GM.banner(f.def.name.toUpperCase() + ' · ENRAGED', 'PHASE 2', '#ef4444');
            }
        },

        hint() {
            const f = this.fight;
            if (!f) return '';
            switch (f.id) {
                case 'mother': { const n = f.sacs.filter((s) => s.hp > 0).length; return n >= 3 ? 'Shielded · ' + n + ' egg sacs alive — burn or tear them' : n + ' sacs left · she can be hurt'; }
                case 'stalker': return f.boss.gmSeen ? 'Revealed — hit it now' : 'Unseen — light it up';
                case 'colossus': return f.heated > this.mode.clock ? 'Plates glowing — full damage' : 'Frozen plates — use fire';
                case 'leviathan': return f.surfaced ? (f.baited > this.mode.clock ? 'Baited and stunned — unload!' : 'Surfaced — attack') : 'Burrowed — throw a noisemaker';
                case 'sable': { const n = f.relays.filter((r) => r.alive).length; return n ? n + ' radio relays up — cut them' : 'Relays down — finish Sable'; }
                case 'choir': { const n = f.resonators.filter((r) => r.hp > 0).length; return n ? n + ' resonators singing — smash them' : 'Song broken — the conductor is exposed'; }
                default: return '';
            }
        },

        onKill(entity) {
            if (this.fight && entity === this.fight.boss) this.win(this.fight);
        },

        win(f) {
            if (!this.fight || f !== this.fight) return;
            const m = this.mode;
            const d = f.def;
            this.state[f.id].s = 'dead';
            this.rewards.add(d.reward);
            if (d.reward === 'fireproofPack') this.applyPack();
            m.campaign.mark('gmBosses', 1, 400);
            BO.ZoneThrill?.xp?.(500, d.name);
            GM.sting('haul');
            GM.banner(d.name.toUpperCase() + ' DEFEATED', 'REWARD: ' + d.rewardName.toUpperCase() + ' · ' + d.rewardText.toUpperCase(), '#fde68a');
            const L = this.lairs[f.id];
            if (L.obelisk) L.obelisk.visible = false;
            this.refreshLair(f.id);
            const drop = { scrap: 10, ingot: 4, medkits: 2 };
            if (f.id === 'colossus') drop.wire = 4;
            m.campaign.pack.dropBag(drop, { x: f.boss.pos.x, y: f.boss.pos.y, z: f.boss.pos.z });
            this.endFight(false, true);
            m.campaign.save(true, true);
            if ([...this.rewards].length >= 6) GM.banner('ALL SIX ZONE TERRORS FALLEN', 'ONLY THE WARDEN REMAINS', '#fde68a');
        },

        endFight(silent = false, won = false) {
            const f = this.fight;
            if (!f || !this.mode) { this.fight = null; return; }
            const m = this.mode;
            for (const mesh of f.props) m.disposeOwned(mesh);
            for (const s of f.sacs || []) s.marker.alive = false;
            for (const r of f.resonators || []) r.marker.alive = false;
            for (const r of f.relays || []) r.marker.alive = false;
            if (!won && f.boss?.alive) { f.boss.alive = false; f.boss.despawned = true; f.boss.deathTimer = 0; if (f.boss.parts?.root) f.boss.parts.root.visible = false; }
            for (const a of f.adds) if (a.alive && !won) { a.alive = false; a.despawned = true; a.deathTimer = 0; if (a.parts?.root) a.parts.root.visible = false; }
            if (!won && this.state[f.id]?.s === 'fighting') this.state[f.id].s = 'known';
            this.fight = null;
            this.impacts = [];
            if (!silent && !won) GM.toast('The fight is over for now. The lair waits.', '#cbd5e1');
            this.refreshLair(f.id);
        },

        /** Die in an arena: your body bag lands at the arena edge, never in a pool. */
        arenaReturn() {
            const f = this.fight;
            if (!f) return null;
            const p = BO.Player.pos;
            const a = Math.atan2(p.z - f.cz, p.x - f.cx);
            const x = f.cx + Math.cos(a) * (f.r + 4), z = f.cz + Math.sin(a) * (f.r + 4);
            this.endFight(true);
            return { x, y: GM.ground(x, z), z };
        },

        /* ---------------------------------------------------------- interact dispatch */
        interactAll(marker) { return this.interactProp(marker) || this.interactLair(marker); },

        mapPins() {
            const out = [];
            for (const [id, L] of Object.entries(this.lairs || {})) {
                const st = this.state[id];
                if (st.s === 'hidden') continue;
                out.push({ x: L.x, z: L.z, color: st.s === 'dead' ? '#6b7280' : '#ef4444', label: L.def.name + (st.s === 'dead' ? ' (defeated)' : ' · reward: ' + L.def.rewardName), glyph: '☠' });
            }
            return out;
        },

        hudChips() {
            const f = this.fight;
            if (!f) return [];
            const p = BO.Player.pos;
            const out = [{ text: this.hint(), cls: 'danger' }];
            for (const r of [...(f.resonators || []).filter((x) => x.hp > 0), ...(f.relays || []).filter((x) => x.alive)]) {
                const d = Math.round(Math.hypot(r.x - p.x, r.z - p.z));
                const ang = Math.atan2(r.x - p.x, -(r.z - p.z)) * 180 / Math.PI;
                const dir = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(((ang + 360) % 360) / 45) % 8];
                out.push({ text: (f.id === 'choir' ? 'Resonator ' : 'Relay ') + d + ' m ' + dir, cls: 'warn' });
            }
            return out;
        },

        renderList() {
            const esc = GM.esc;
            const rows = Object.entries(DEFS).map(([id, d]) => {
                const st = this.state[id]?.s || 'hidden';
                return `<div class="gm-row"><b>${st === 'hidden' ? '??? (not yet located)' : esc(d.name)}</b><span>${st === 'dead' ? 'Defeated · ' + esc(d.rewardName) : st === 'hidden' ? 'Haven radio will mark it, or find it yourself' : 'Reward: ' + esc(d.rewardName) + ' — ' + esc(d.rewardText)}</span></div>`;
            }).join('');
            const warden = BO.ZoneFinale && (BO.SurvivalMode.campaign?.objectives?.ending ? 'Defeated · the Lantern is decided' : 'The Lantern\'s guardian waits in the Crater (story finale)');
            return `<div>${rows}<div class="gm-row"><b>The Warden</b><span>${esc(warden || '')}</span></div></div>`;
        },

        baseCards(ui) {
            const dead = Object.values(this.state).filter((s) => s.s === 'dead').length;
            return [ui.section('Final bosses', this.renderList(), dead + ' / 6 + the Warden')];
        }
    };
    Bosses.interact = Bosses.interactAll;

    GM.register('bosses', Bosses);
})(window.BO);
