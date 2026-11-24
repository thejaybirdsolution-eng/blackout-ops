/* ============================================================================
   BLACKOUT OPS — Survival 1.0: the Behaviour Ladder, Light Claim & the living Zone
   · BEHAVIOUR LADDER — enemies never gain HP or damage from the calendar. Each
     day (and each Zone Tier, worth two days) unlocks a new behaviour that a
     share of roamers carry:
       D2 Flankers      circle to your side or back instead of charging
       D3 Screamers     shriek when they spot you, pulling every infected in 45 m
       D4 Blood-trackers smell a bleeding survivor from 60 m away
       D5 Swimmers      follow you into deep water
       D6 Ambushers     wait motionless in the dark, then lunge
       D7 Lightbreakers hunt and smash your placed lights first
       D9 Pack hunters  coordinate to surround you and cut off retreat
   · LIGHT CLAIM — placed lights hold ground: no roaming infected spawn inside
     their radius. Torches and fires burn fuel; floodlights need power. Lights
     only claim within 30 m of something you built, and total claimed area is
     capped by your base tier. Hordes ignore claims.
   · SWIMMING — swim stamina; when it runs out you drown.
   · LURES — noisemakers draw infected; meat bait draws predators. Predators
     and infected fight each other, so you can lure one onto the other.
   · TENSION BUDGET — events and storms wait while a horde or boss fight runs.
============================================================================ */
(function (BO) {
    'use strict';
    const GM = BO.GM;

    const LADDER = [
        { day: 2, role: 'flanker', name: 'Flankers', text: 'Some infected now circle to your side or back.' },
        { day: 3, role: 'screamer', name: 'Screamers', text: 'Screamers shriek when they see you, calling every infected nearby.' },
        { day: 4, role: 'tracker', name: 'Blood-trackers', text: 'If you bleed, trackers smell you from 60 m. Bandage fast.' },
        { day: 5, role: 'swimmer', name: 'Swimmers', text: 'Deep water is no longer safe. Swimmers follow you in.' },
        { day: 6, role: 'ambusher', name: 'Ambushers', text: 'Ambushers wait motionless in dark places, then lunge.' },
        { day: 7, role: 'lightbreaker', name: 'Lightbreakers', text: 'Lightbreakers hunt your torches and floodlights first.' },
        { day: 9, role: 'pack', name: 'Pack hunters', text: 'Packs coordinate to surround you. Keep an exit open.' }
    ];
    const ROLE_TINT = { flanker: 0xd4a017, screamer: 0xe879f9, tracker: 0xdc2626, swimmer: 0x0ea5e9, ambusher: 0x4b5563, lightbreaker: 0xfacc15, pack: 0xf97316 };

    /* Claim lights: radius (m), fuel hours (0 = none), powered */
    const LIGHTS = {
        wallTorch: { r: 6, fuel: 24, name: 'Standing torch', refuel: ['resin', 'cloth', 'fiber'] },
        campfire: { r: 7, fuel: 12, name: 'Campfire', refuel: ['timber'] },
        firepit: { r: 9, fuel: 16, name: 'Fire camp', refuel: ['timber'] },
        lanternPost: { r: 10, fuel: 48, name: 'Lantern post', refuel: ['fuel'] },
        floodlight: { r: 18, fuel: 0, power: 3, name: 'Floodlight' },
        searchlight: { r: 14, fuel: 0, power: 4, name: 'Searchlight' }
    };
    const ANCHOR_R = 30;
    const TIER_AREA = [0, 2500, 6000, 12000];

    const Threat = {
        rate: 8,

        start(mode, saved) {
            this.mode = mode;
            this.fuel = new Map(saved?.fuel || []);
            this.lures = [];
            this.lastDay = mode.campaign.day;
            this.seenRoles = new Set(saved?.seenRoles || []);
            this.claimGrid = new GM.SpatialGrid(12);
            this.claims = [];
            this.claimDirty = true;
            this.screamCd = new Map();
            this.swimStam = 1;
            this.patch();
            this.installRecipes();
        },

        stop() { this.unpatch(); this.mode = null; },

        snapshot() { return { fuel: [...this.fuel], seenRoles: [...this.seenRoles] }; },

        /* ---------------------------------------------------------- recipes */
        installRecipes() {
            const F = BO.SurvivalFrontierData;
            if (this._installed) return;
            this._installed = true;
            Object.assign(F.items, {
                noisemaker: ['Rattle noisemaker', 'Equipment', 0.3],
                meatBait: ['Blood bait', 'Equipment', 0.4]
            });
            F.recipes.push(
                { id: 'gmNoisemaker', name: 'Rattle noisemaker', station: 'hand', cost: { scrap: 2, fiber: 2 }, gain: { noisemaker: 1 }, desc: 'Throw it from the hotbar: it rattles for 30 s and drags every infected within 70 m toward it. Lead them into a PMC camp or away from your base.' },
                { id: 'gmBait', name: 'Blood bait', station: 'hand', cost: { fiber: 1 }, anyOf: ['raw_venison', 'raw_pork', 'raw_rabbit', 'raw_fowl', 'raw_mutton', 'raw_beef', 'raw_bear', 'raw_wolf'], gain: { meatBait: 1 }, desc: 'Throw it: wolves and bears within 90 m come for the meat and fight anything in the way. Uses 1 raw meat.' }
            );
            const baitRecipe = F.recipes.find((r) => r.id === 'gmBait');
            // Bait accepts any raw meat: pick whichever you carry when crafted.
            Object.defineProperty(baitRecipe, 'cost', {
                configurable: true,
                get() {
                    const inv = BO.SurvivalMode.points || {};
                    const meat = baitRecipe.anyOf.find((id) => (inv[id] || 0) > 0) || 'raw_venison';
                    return { fiber: 1, [meat]: 1 };
                }
            });
            BO.SurvivalHotbar?.usable?.add?.('noisemaker');
            BO.SurvivalHotbar?.usable?.add?.('meatBait');
            if (BO.SurvivalItemInfo) {
                BO.SurvivalItemInfo.noisemaker = 'Lure: rattles for 30 s, pulling infected within 70 m. Throw it with the fire button from the hotbar.';
                BO.SurvivalItemInfo.meatBait = 'Lure: draws wolves and bears within 90 m. Predators attack infected they run into.';
            }
        },

        /* ---------------------------------------------------------- patches */
        patch() {
            const D = BO.ZoneDirector;
            const self = this;
            this._orig = { getTarget: D.getTarget, think: BO.ZoneWild?.think, perception: D.perception, consume: BO.SurvivalMode.consume };
            D.getTarget = function (zb) {
                const t = self.targetFor(zb);
                if (t !== undefined) return t;
                return self._orig.getTarget.call(this, zb);
            };
            D.perception = function () {
                const per = self._orig.perception.call(this);
                const w = GM.get('weather');
                if (w?.senseMult) {
                    const s = w.senseMult();
                    per.sight *= s.sight;
                    per.hear *= s.hear;
                }
                return per;
            };
            if (BO.ZoneWild && this._orig.think) {
                BO.ZoneWild.think = function (a, d, dt, noises) {
                    if (self.animalOverride(a, d, dt)) return;
                    return self._orig.think.call(this, a, d, dt, noises);
                };
            }
            const mode = BO.SurvivalMode;
            mode.consume = function (id) {
                if (id === 'noisemaker' || id === 'meatBait') return self.throwLure(id);
                return self._orig.consume.call(this, id);
            };
        },

        unpatch() {
            if (!this._orig) return;
            BO.ZoneDirector.getTarget = this._orig.getTarget;
            BO.ZoneDirector.perception = this._orig.perception;
            if (BO.ZoneWild && this._orig.think) BO.ZoneWild.think = this._orig.think;
            BO.SurvivalMode.consume = this._orig.consume;
            this._orig = null;
            for (const l of this.lures) l.mesh?.removeFromParent();
            this.lures = [];
        },

        /* ---------------------------------------------------------- ladder */
        get step() {
            const m = this.mode;
            return m.campaign.day + ((m.zoneTier || 1) - 1) * 2;
        },

        unlockedRoles() { return LADDER.filter((l) => this.step >= l.day).map((l) => l.role); },

        onSpawn(zb, type, required) {
            if (!zb || zb.bossLabel || zb.horde || zb.gmRole) return;
            const roles = this.unlockedRoles();
            if (!roles.length) return;
            const share = Math.min(0.55, 0.22 + roles.length * 0.05);
            if (Math.random() > share) return;
            const role = roles[Math.floor(Math.random() * roles.length)];
            zb.gmRole = role;
            const root = zb.parts?.root;
            if (root) {
                const tint = ROLE_TINT[role];
                root.traverse?.((o) => { if (o.isMesh && o.material && o.material.emissive && !o.userData.gmTinted) { o.material = o.material.clone(); o.material.emissive.setHex(tint); o.material.emissiveIntensity = 0.12; o.userData.gmTinted = true; } });
            }
            if (role === 'ambusher') { const s = BO.ZoneDirector.sense(zb); s.state = 'idle'; zb.gmAmbushHome = { x: zb.pos.x, z: zb.pos.z }; }
        },

        /** Returns a target override, null (chase the player) or undefined (no opinion). */
        targetFor(zb) {
            const s = BO.ZoneDirector.sense(zb);
            const p = BO.Player.pos;
            const d = Math.hypot(zb.pos.x - p.x, zb.pos.z - p.z);
            // Lures beat everything for infected that can hear them.
            const lure = this.lures.find((l) => l.kind === 'noisemaker' && Math.hypot(l.x - zb.pos.x, l.z - zb.pos.z) < 70);
            if (lure && s.state !== 'hunt') return { x: lure.x + Math.sin(zb.id) * 1.5, y: lure.y, z: lure.z + Math.cos(zb.id) * 1.5, attackRange: -1, forceDirect: false };
            // Predators nearby draw infected into a fight.
            const pred = this.nearestPredator(zb.pos, 7);
            if (pred && (s.state !== 'hunt' || pred.pos.distanceTo(zb.pos) < d)) return { x: pred.pos.x, y: pred.pos.y, z: pred.pos.z, target: pred, attackRange: 1.8, forceDirect: true };
            switch (zb.gmRole) {
                case 'lightbreaker': {
                    const light = this.nearestLight(zb.pos, 45);
                    if (light && s.state !== 'hunt') return { x: light.x, y: light.y, z: light.z, attackRange: -1, forceDirect: false };
                    break;
                }
                case 'ambusher': {
                    if (s.state !== 'hunt' && zb.gmAmbushHome) return { x: zb.gmAmbushHome.x, y: zb.pos.y, z: zb.gmAmbushHome.z, attackRange: -1, forceDirect: true };
                    break;
                }
                case 'flanker': {
                    if (s.state === 'hunt' && d > 5 && d < 40) {
                        const yaw = BO.Player.yaw || 0;
                        const side = (zb.id % 2 ? 1 : -1);
                        const ang = yaw + Math.PI / 2 * side + (zb.id % 3 === 0 ? Math.PI / 2 * side : 0);
                        return { x: p.x - Math.sin(ang) * 5, y: p.y, z: p.z - Math.cos(ang) * 5, attackRange: -1, forceDirect: false };
                    }
                    break;
                }
                case 'pack': {
                    if (s.state === 'hunt' && d > 3.2 && d < 30) {
                        const mates = this.mode.zombies.filter((o) => o.alive && o.gmRole === 'pack' && o.zs?.state === 'hunt');
                        const i = mates.indexOf(zb);
                        const ang = (i / Math.max(1, mates.length)) * Math.PI * 2;
                        return { x: p.x + Math.cos(ang) * 3.2, y: p.y, z: p.z + Math.sin(ang) * 3.2, attackRange: -1, forceDirect: false };
                    }
                    break;
                }
                default: break;
            }
            return undefined;
        },

        nearestPredator(pos, r) {
            const W = BO.ZoneWild;
            if (!W?.animals) return null;
            let best = null, bd = r;
            for (const a of W.animals) {
                if (!a.alive || !['hunt', 'territorial'].includes(a.spec?.temper)) continue;
                const d = a.pos.distanceTo(pos);
                if (d < bd) { bd = d; best = a; }
            }
            return best;
        },

        /** Predators chasing bait or fighting infected; returns true when we moved the animal. */
        animalOverride(a, d, dt) {
            if (!a.alive || !['hunt', 'territorial'].includes(a.spec?.temper)) return false;
            const m = this.mode;
            const bait = this.lures.find((l) => l.kind === 'meatBait' && Math.hypot(l.x - a.pos.x, l.z - a.pos.z) < 90);
            let tx = null, tz = null, foe = null;
            let best = 14;
            for (const z of m.zombies) {
                if (!z.alive || z.bossLabel) continue;
                const dz = z.pos.distanceTo(a.pos);
                if (dz < best) { best = dz; foe = z; }
            }
            if (foe && (a.state !== 'attack' || best < d)) { tx = foe.pos.x; tz = foe.pos.z; }
            else if (bait) { tx = bait.x; tz = bait.z; }
            else return false;
            const s = a.spec;
            const want = Math.atan2(tx - a.pos.x, tz - a.pos.z);
            const diff = ((want - a.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
            a.yaw += BO.Math.clamp(diff, -6 * dt, 6 * dt);
            const dist = Math.hypot(tx - a.pos.x, tz - a.pos.z);
            if (dist > 1.4 + a.radius) {
                const nx = a.pos.x + Math.sin(a.yaw) * s.speed * dt, nz = a.pos.z + Math.cos(a.yaw) * s.speed * dt;
                const nav = BO.World.nav;
                const j = nav?.idx(nx, nz) ?? -1;
                if (j >= 0 && nav.walk[j] && !BO.Zone.inReservoir(nx, nz)) {
                    a.pos.x = nx; a.pos.z = nz;
                    a.pos.y = BO.World.getGroundHeight(nx, nz, a.pos.y + 1.2);
                }
                a.phase += dt * s.speed * 3;
            } else if (foe && a.attackCd <= 0) {
                a.attackCd = 1.1;
                m.hit(foe, (s.dmg || 10) * 2.4, 'torso', null, 'melee', a);
                BO.Sound?.playZombieGroan?.(a.kind === 'bear' ? 'roar_heavy' : 'growl_beast', 0.35);
                if (foe.zs) { foe.zs.state = 'curious'; foe.zs.x = a.pos.x; foe.zs.z = a.pos.z; foe.zs.until = m.clock + 10; }
            }
            a.timer -= dt;
            a.attackCd -= dt;
            const swing = Math.sin(a.phase) * 0.6;
            a.legs?.forEach((l, i) => { l.rotation.x = (i % 2 ? swing : -swing); });
            a.root.position.copy(a.pos);
            a.root.rotation.y = a.yaw;
            return true;
        },

        throwLure(id) {
            const m = this.mode;
            if (!(m.points[id] > 0)) return false;
            const p = BO.Player;
            const f = p.getMoveDirectionVectors().forward;
            const x = p.pos.x + f.x * 12, z = p.pos.z + f.z * 12;
            const y = GM.ground(x, z, p.pos.y + 4);
            m.points[id]--;
            const mesh = m.mesh(new THREE.SphereGeometry(id === 'noisemaker' ? 0.18 : 0.22, 8, 6), id === 'noisemaker' ? 0xd4d4d8 : 0x991b1b, x, y + 0.2, z, { emissive: id === 'noisemaker' ? 0xfacc15 : 0xdc2626, emissiveIntensity: 0.5 });
            this.lures.push({ kind: id, x, y, z, until: m.clock + (id === 'noisemaker' ? 30 : 45), mesh, tick: 0 });
            GM.toast(id === 'noisemaker' ? 'Noisemaker thrown: infected within 70 m will come to it.' : 'Blood bait thrown: predators within 90 m will come for it.', '#fcd34d');
            GM.first('lure', 'Lure thrown', 'Use the Zone against itself');
            m.campaign.mark('lures', 1, 6);
            return true;
        },

        updateLures(dt) {
            const m = this.mode;
            for (let i = this.lures.length - 1; i >= 0; i--) {
                const l = this.lures[i];
                if (m.clock > l.until) { m.disposeOwned(l.mesh); this.lures.splice(i, 1); continue; }
                l.tick -= dt;
                if (l.kind === 'noisemaker' && l.tick <= 0) {
                    l.tick = 3;
                    BO.ZoneDirector.noise(l.x, l.z, 70, 'lure');
                    BO.Sound?.playSpatialNoise?.(0.25, 2400, 'bandpass', 3, 0.25, 0);
                    BO.FX?.spawnParticles?.(new THREE.Vector3(l.x, l.y + 0.4, l.z), 4, 0xfacc15, 2, 2, 0.3);
                }
                if (l.mesh) l.mesh.position.y = l.y + 0.2 + Math.abs(Math.sin(m.clock * 8)) * 0.08;
            }
        },

        /* ---------------------------------------------------------- light claim */
        lightSpec(type) { return LIGHTS[type]; },

        baseTier() { return GM.get('base')?.benchTier?.() || 1; },

        anchored(piece) {
            const c = this.mode.campaign;
            if (BO.ZoneInfest?.isSafe?.(piece.x, piece.z)) return true;
            return c.placed.some((o) => o.alive && o !== piece && !LIGHTS[o.type] && Math.hypot(o.x - piece.x, o.z - piece.z) < ANCHOR_R);
        },

        lightActive(piece) {
            const spec = LIGHTS[piece.type];
            if (!spec || !piece.alive) return false;
            if (spec.power) return !!GM.get('base')?.isPowered?.(piece);
            if (!spec.fuel) return true;
            return (this.fuel.get(piece.id) ?? Infinity) > this.mode.campaign.totalHours;
        },

        rebuildClaims() {
            const c = this.mode.campaign;
            this.claimGrid.clear();
            this.claims = [];
            const home = GM.get('base')?.homePoint?.() || BO.Player.pos;
            const cap = TIER_AREA[Math.min(3, this.baseTier())] || 2500;
            const lights = c.placed.filter((pc) => LIGHTS[pc.type] && pc.alive)
                .map((pc) => ({ pc, spec: LIGHTS[pc.type], d: Math.hypot(pc.x - home.x, pc.z - home.z) }))
                .sort((a, b) => a.d - b.d);
            let area = 0;
            const rMult = GM.product('claimRadiusMult');
            for (const { pc, spec } of lights) {
                if (spec.fuel && !this.fuel.has(pc.id)) this.fuel.set(pc.id, c.totalHours + spec.fuel);
                pc.gmClaim = 'off';
                if (!this.lightActive(pc)) { pc.gmClaim = spec.power ? 'unpowered' : 'out'; continue; }
                if (!this.anchored(pc)) { pc.gmClaim = 'unanchored'; continue; }
                const r = spec.r * rMult;
                const a = Math.PI * r * r;
                if (area + a > cap) { pc.gmClaim = 'capped'; continue; }
                area += a;
                pc.gmClaim = 'on';
                const claim = { x: pc.x, z: pc.z, r, piece: pc };
                this.claims.push(claim);
                this.claimGrid.add(claim, pc.x, pc.z, r);
            }
            this.claimArea = area;
            this.claimCap = cap;
            this.claimDirty = false;
            this.ensureLightMarkers();
        },

        ensureLightMarkers() {
            const m = this.mode;
            for (const pc of m.campaign.placed) {
                const spec = LIGHTS[pc.type];
                if (!spec || !spec.fuel || !pc.alive) continue;
                const id = 'gmlight:' + pc.id;
                let mk = m.markers.find((k) => k.id === id);
                if (!mk) { mk = { id, x: pc.x, y: pc.y, z: pc.z, name: spec.name, alive: true, reach: 2.6 }; m.markers.push(mk); }
                const left = Math.max(0, Math.ceil((this.fuel.get(pc.id) ?? 0) - m.campaign.totalHours));
                mk.label = (left > 0 ? 'Refuel ' + spec.name.toLowerCase() + ' (' + left + ' h left)' : 'Relight ' + spec.name.toLowerCase()) + ' · ' + spec.refuel.map((r) => GM.itemName(r)).join(' / ');
            }
        },

        interact(marker) {
            if (!marker.id?.startsWith('gmlight:')) return false;
            const m = this.mode;
            const id = marker.id.slice(8);
            const pc = m.campaign.placed.find((p) => p.id === id && p.alive);
            if (!pc) return true;
            const spec = LIGHTS[pc.type];
            const item = spec.refuel.find((r) => (m.points[r] || 0) > 0);
            if (!item) { GM.toast('Needs ' + spec.refuel.map((r) => GM.itemName(r)).join(' or ') + ' to burn.', '#f59e0b'); return true; }
            m.points[item]--;
            const now = m.campaign.totalHours;
            this.fuel.set(pc.id, Math.min(now + spec.fuel * 2, Math.max(now, this.fuel.get(pc.id) || now) + spec.fuel));
            this.claimDirty = true;
            GM.sting('claim');
            GM.toast(spec.name + ' refuelled.', '#4ade80');
            return true;
        },

        canSpawnAt(x, z) {
            if (BO.ZoneHorde?.active) return true;
            for (const c of this.claimGrid.query(x, z)) if (Math.hypot(c.x - x, c.z - z) < c.r) return false;
            return true;
        },

        inClaim(x, z) { return !this.canSpawnAtRaw(x, z); },
        canSpawnAtRaw(x, z) { for (const c of this.claimGrid.query(x, z)) if (Math.hypot(c.x - x, c.z - z) < c.r) return false; return true; },

        nearestLight(pos, r) {
            let best = null, bd = r;
            for (const pc of this.mode.campaign.placed) {
                if (!pc.alive || !LIGHTS[pc.type] || pc.gmClaim !== 'on') continue;
                const d = Math.hypot(pc.x - pos.x, pc.z - pos.z);
                if (d < bd) { bd = d; best = pc; }
            }
            return best;
        },

        updateLightbreakers() {
            const m = this.mode;
            for (const z of m.zombies) {
                if (!z.alive || z.gmRole !== 'lightbreaker' || z.zs?.state === 'hunt') continue;
                const light = this.nearestLight(z.pos, 1.9);
                if (!light) continue;
                if (LIGHTS[light.type].fuel) this.fuel.set(light.id, m.campaign.totalHours - 0.01);
                else if (light.part) m.damagePart(light.part, 999, 'melee');
                else light.gmBroken = m.campaign.totalHours + 12;
                this.claimDirty = true;
                BO.FX?.spawnParticles?.(new THREE.Vector3(light.x, light.y + 1, light.z), 12, 0xfacc15, 4, 5, 0.4);
                BO.Sound?.playWallBreak?.();
                GM.toast('A Lightbreaker smashed your ' + LIGHTS[light.type].name.toLowerCase() + '!', '#facc15');
            }
        },

        /* ---------------------------------------------------------- per-role ticks */
        updateRoles(dt) {
            const m = this.mode;
            const p = BO.Player;
            const deep = m.campaign.deep;
            const bleeding = (deep?.bleeding || 0) > 0;
            const swimming = !!m.swimming;
            for (const z of m.zombies) {
                if (!z.alive || !z.gmRole) continue;
                const s = BO.ZoneDirector.sense(z);
                const d = Math.hypot(z.pos.x - p.pos.x, z.pos.z - p.pos.z);
                switch (z.gmRole) {
                    case 'screamer': {
                        if (s.state === 'hunt' && (this.screamCd.get(z) || 0) < m.clock && d < 50) {
                            this.screamCd.set(z, m.clock + 20);
                            BO.ZoneDirector.noise(z.pos.x, z.pos.z, 45, 'scream');
                            for (const o of m.zombies) {
                                if (o.alive && o !== z && o.pos.distanceTo(z.pos) < 45 && o.zs) { o.zs.state = 'hunt'; o.zs.seen = m.clock; }
                            }
                            BO.Sound?.playSpatialInfected?.('wail_void', z.pos, 'Screamer shriek');
                            BO.FX?.spawnParticles?.(z.pos.clone().setY(z.pos.y + 1.6), 18, 0xe879f9, 6, 1, 0.5);
                            GM.toast('A Screamer shrieked — everything nearby knows where you are.', '#e879f9');
                        }
                        break;
                    }
                    case 'tracker': {
                        if (bleeding && d < 60 && s.state !== 'hunt') {
                            s.state = 'curious'; s.x = p.pos.x; s.z = p.pos.z; s.until = m.clock + 15;
                            if (!this._trackWarn || this._trackWarn < m.clock) { this._trackWarn = m.clock + 25; GM.toast('Something is following your blood trail.', '#dc2626'); }
                        }
                        break;
                    }
                    case 'swimmer': {
                        if (swimming && d < 40 && d > 1.3) {
                            const sp = 2.8 * dt;
                            z.pos.x += (p.pos.x - z.pos.x) / d * sp;
                            z.pos.z += (p.pos.z - z.pos.z) / d * sp;
                            z.pos.y = Math.max(BO.World.terrainHeight(z.pos.x, z.pos.z), BO.Zone.WATER - 2.1);
                            s.state = 'hunt'; s.seen = m.clock;
                        }
                        break;
                    }
                    case 'ambusher': {
                        if (s.state !== 'hunt' && d < 7) {
                            s.state = 'hunt'; s.seen = m.clock;
                            z.gmLunge = m.clock + 1.6;
                            z.speed *= 1.8;
                            BO.Sound?.playSpatialInfected?.('screech_fast', z.pos, 'Ambush!');
                            p.cameraShake = Math.max(p.cameraShake || 0, 0.06);
                        } else if (z.gmLunge && m.clock > z.gmLunge) {
                            z.speed /= 1.8;
                            z.gmLunge = 0;
                        }
                        break;
                    }
                    default: break;
                }
            }
        },

        /* ---------------------------------------------------------- swimming */
        updateSwim(dt) {
            const m = this.mode;
            const p = BO.Player;
            if (!p.alive) return;
            const rebreather = GM.get('gear')?.hasRebreather?.();
            if (m.swimming && !rebreather) {
                this.swimStam = Math.max(0, this.swimStam - dt / 35);
                p.tacStamina = Math.min(p.tacStamina, this.swimStam);
                if (this.swimStam <= 0) {
                    GM.setStatus('drowning', { until: m.clock + 0.5 });
                    this._drownTick = (this._drownTick || 0) - dt;
                    if (this._drownTick <= 0) { this._drownTick = 1; p.takeDamage(6); BO.Sound?.playTone?.(180, 90, 0.3, 'sine', 0.12); }
                } else if (this.swimStam < 0.3 && !this._swimWarned) { this._swimWarned = true; GM.toast('Your arms are burning — get out of the water.', '#0ea5e9'); }
            } else {
                this.swimStam = Math.min(1, this.swimStam + dt / 8);
                if (this.swimStam > 0.6) this._swimWarned = false;
            }
        },
        swimFraction() { return this.mode?.swimming ? this.swimStam : null; },

        /* ---------------------------------------------------------- tension budget */
        busy() {
            return !!(BO.ZoneHorde?.active || BO.ZoneFinale?.active || GM.get('bosses')?.fighting?.() || BO.ZoneDungeons?.inside || BO.ZoneLegends?.arena);
        },

        /* ---------------------------------------------------------- update */
        update(dt) {
            const m = this.mode;
            const c = m.campaign;
            if (c.day !== this.lastDay) {
                this.lastDay = c.day;
                const fresh = LADDER.filter((l) => this.step >= l.day && !this.seenRoles.has(l.role));
                for (const l of fresh) this.seenRoles.add(l.role);
                if (fresh.length) {
                    setTimeout(() => GM.banner('NEW BEHAVIOUR: ' + fresh.map((f) => f.name.toUpperCase()).join(' · '), fresh.map((f) => f.text).join(' '), '#f472b6'), 2600);
                }
            }
            if (this.claimDirty || (this._claimClock = (this._claimClock || 0) - dt) <= 0) {
                this._claimClock = 2;
                this.rebuildClaims();
            }
            const p = BO.Player.pos;
            if (!this.canSpawnAtRaw(p.x, p.z)) {
                if (!GM.hasStatus('claimed')) GM.first('claim', 'Ground claimed', 'Lights hold this ground: no roaming spawns inside');
                GM.setStatus('claimed', { until: m.clock + 0.5 });
            }
            // Hunted status: anything actively hunting within 60 m.
            const hunted = m.zombies.some((z) => z.alive && z.zs?.state === 'hunt' && Math.hypot(z.pos.x - p.x, z.pos.z - p.z) < 60) ||
                m.bots.some((b) => b.alive && b.team !== 0 && b.target === BO.Player && Math.hypot(b.pos.x - p.x, b.pos.z - p.z) < 60);
            if (hunted) GM.setStatus('hunted', { until: m.clock + 3 });
            else if ((BO.ZoneDirector.detected || 0) === 0 && m.hostilesReleased) GM.setStatus('hidden', { until: m.clock + 0.4 });
            this.updateRoles(dt);
            this.updateLightbreakers();
            this.updateLures(dt);
            this.updateSwim(dt);
        },

        onBuild() { this.claimDirty = true; },
        onPieceLost() { this.claimDirty = true; },

        mapCircles() {
            return this.claims.map((c) => ({ x: c.x, z: c.z, r: c.r, color: 'rgba(74,222,128,0.18)', stroke: 'rgba(74,222,128,0.55)' }));
        },
        mapPins() {
            return this.lures.map((l) => ({ x: l.x, z: l.z, color: '#facc15', label: l.kind === 'noisemaker' ? 'Noisemaker' : 'Bait', glyph: '◎' }));
        },

        ladderInfo() {
            return LADDER.map((l) => ({ ...l, unlocked: this.step >= l.day }));
        },
        LIGHTS
    };

    GM.register('threat', Threat);
})(window.BO);
