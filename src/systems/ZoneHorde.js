/* ============================================================================
   BLACKOUT OPS — Horde nights and breaching
   - Every third night (second with Brutal Nights) the Lantern pulses and a horde
     converges on your base — or on you, if you are far from it.
   - Three waves arrive from one side of the compass, out of sight, and follow a
     shared flow field that runs *through* your walls at a cost: they mass at the
     weakest point of your perimeter and tear through it.
   - Any infected that is hunting you and gets stuck against a structure starts
     breaking it, so hiding behind a wall only buys time.
   - Survive until the waves are dead or dawn breaks for XP and a commendation.
============================================================================ */
(function (BO) {
    'use strict';

    class ZoneHorde {
        constructor() { this.reset(); }

        reset() {
            this.active = false;
            this.wave = 0;
            this.waves = 0;
            this.members = [];
            this.target = null;
            this.warnedNight = 0;
            this.doneNight = 0;
            this.nextWaveAt = 0;
            this.retargetAt = 0;
            this.kills = 0;
            this.stuckClock = 0;
        }

        stop() {
            this.reset();
        }

        get mode() { return BO.SurvivalMode; }
        get campaign() { return BO.SurvivalMode.campaign; }

        get every() { return this.campaign?.has('brutalNights') ? 2 : 3; }

        /** Night number of the next horde (the current one if it is under way). */
        nextHordeNight() {
            const c = this.campaign;
            const n = c.isNight ? c.nightNumber : c.nightNumber + 1;
            const e = this.every;
            let k = Math.ceil(n / e) * e;
            if (k === n && this.doneNight === n) k += e;
            return Math.max(e, k);
        }

        /** Short forecast for the HUD: 'tonight', 'in 2 days', or the live wave count. */
        forecast() {
            const c = this.campaign;
            if (!c || !this.mode.hostilesReleased) return '';
            if (this.active) return 'HORDE · wave ' + this.wave + '/' + this.waves + ' · ' + this.remaining() + ' left';
            const n = this.nextHordeNight();
            const tonight = c.isNight ? n === c.nightNumber : n === c.nightNumber + 1;
            if (tonight) return 'Horde tonight';
            const days = n - (c.isNight ? c.nightNumber : c.nightNumber + 1);
            return 'Horde in ' + days + ' day' + (days === 1 ? '' : 's');
        }

        remaining() { return this.members.filter((z) => z.alive).length + (this.waves - this.wave) * this.waveSize; }

        /* ------------------------------------------------------------ base */
        /** Centre of your largest cluster of structures, or null if you have not built. */
        baseCentre() {
            const parts = this.campaign.placed.filter((p) => p.alive && BO.ZoneBuild.isStruct(p.type));
            if (parts.length < 3) return null;
            let best = null, bestN = 0;
            for (const a of parts) {
                const near = parts.filter((b) => Math.hypot(a.x - b.x, a.z - b.z) < 14);
                if (near.length > bestN) { bestN = near.length; best = near; }
            }
            const x = best.reduce((s, p) => s + p.x, 0) / best.length;
            const z = best.reduce((s, p) => s + p.z, 0) / best.length;
            return { x, z, y: BO.World.terrainHeight(x, z), pieces: bestN };
        }

        pickTarget() {
            const p = BO.Player.pos;
            const base = this.baseCentre();
            if (base && Math.hypot(base.x - p.x, base.z - p.z) < 75) return { ...base, base: true };
            return { x: p.x, y: p.y, z: p.z, base: false };
        }

        /* ------------------------------------------------------------ lifecycle */
        update(dt) {
            const m = this.mode;
            const c = this.campaign;
            if (!c || !m.hostilesReleased || c.options.gameType === 'peaceful' || c.has('noRoamers')) return;
            const hordeNight = this.nextHordeNight();
            // Dusk warning on the day of a horde.
            if (!c.isNight && hordeNight === c.nightNumber + 1 && c.hour >= 16.5 && this.warnedNight !== hordeNight) {
                this.warnedNight = hordeNight;
                BO.Events.emit('hud:banner', { title: 'HORDE TONIGHT', sub: 'THE LANTERN IS PULSING · FORTIFY YOUR BASE OR FIND HIGH GROUND', color: '#ff7b6b' });
                BO.Sound?.playZombieGroan?.('brute', 0.9);
            }
            if (!this.active && c.isNight && c.nightNumber === hordeNight && this.doneNight !== hordeNight && (c.hour >= 20 || c.hour < 6)) {
                this.begin(hordeNight);
            }
            if (this.active) this.tick(dt);
            this.breachCheck(dt);
        }

        begin(night) {
            const m = this.mode;
            const c = this.campaign;
            this.active = true;
            this.night = night;
            this.wave = 0;
            this.waves = 3;
            const diff = { easy: 0.7, normal: 1, hard: 1.3, veteran: 1.45, nightmare: 1.6, apocalypse: 1.9 }[c.options.difficulty] || 1;
            this.waveSize = Math.round((5 + night * 1.6) * diff);
            this.members = [];
            this.kills = 0;
            this.target = this.pickTarget();
            this.bearing = Math.random() * Math.PI * 2;
            this.nextWaveAt = m.clock + 4;
            this.baseStart = this.target.base ? this.integrity() : null;
            BO.Events.emit('hud:banner', {
                title: 'THE HORDE IS COMING',
                sub: (this.target.base ? 'THEY ARE HEADING FOR YOUR BASE' : 'THEY ARE HUNTING YOU') + ' · FROM THE ' + this.compassWord(this.bearing).toUpperCase(),
                color: '#ff5a4a'
            });
            c.mark('hordesFaced', 1, 0);
        }

        compassWord(a) {
            // Bearing measured from +x towards +z; north is -z.
            const deg = ((Math.atan2(Math.cos(a), -Math.sin(a)) * 180 / Math.PI) + 360) % 360;
            return ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'][Math.round(deg / 45) % 8];
        }

        integrity() {
            const parts = this.campaign.placed.filter((p) => p.alive && p.part && BO.ZoneBuild.isStruct(p.type));
            if (!parts.length) return 0;
            return parts.reduce((s, p) => s + Math.max(0, p.part.hp) / (p.part.maxHp || p.part.hp || 1), 0) / parts.length;
        }

        spawnWave() {
            const m = this.mode;
            const nav = BO.World.nav;
            const t = this.target;
            this.wave++;
            let made = 0;
            const p = BO.Player.pos;
            for (let tries = 0; tries < this.waveSize * 6 && made < this.waveSize; tries++) {
                const a = this.bearing + (Math.random() - 0.5) * 0.9;
                const r = 62 + Math.random() * 30;
                const x = t.x + Math.cos(a) * r, z = t.z + Math.sin(a) * r;
                const B = BO.Zone.BOUNDS;
                if (x < B.minX + 6 || x > B.maxX - 6 || z < B.minZ + 6 || z > B.maxZ - 6) continue;
                const i = nav ? nav.idx(x, z) : -1;
                if (i < 0 || !nav.walk[i]) continue;
                const y = nav.y[i];
                if (Math.hypot(x - p.x, z - p.z) < 40) continue;
                const type = this.wave === 3 && made === 0 && this.night >= 6 ? 'butcher' : 'normal';
                const zb = m.spawnInfected(x, y, z, type, null, true);
                if (!zb) continue;
                zb.horde = true;
                zb.zs = { state: 'horde', seen: m.clock, home: { x: t.x, z: t.z }, x: t.x, z: t.z, until: 0, wander: 0 };
                this.members.push(zb);
                made++;
            }
            if (this.wave > 1) BO.Events.emit('hud:banner', { title: 'WAVE ' + this.wave + ' OF ' + this.waves, sub: made + ' MORE INFECTED INCOMING', color: '#ff7b6b' });
            m.refreshTargets();
        }

        tick(dt) {
            const m = this.mode;
            const c = this.campaign;
            for (const z of this.members) if (!z.alive && !z._hordeCounted && !z.despawned) { z._hordeCounted = true; this.kills++; }
            this.members = this.members.filter((z) => z.alive || z.deathTimer > 0);
            if (this.wave < this.waves && m.clock >= this.nextWaveAt) {
                this.spawnWave();
                this.nextWaveAt = m.clock + 50;
            }
            if (m.clock >= this.retargetAt) {
                this.retargetAt = m.clock + 6;
                const base = this.target.base ? this.baseCentre() : null;
                this.target = base && Math.hypot(base.x - BO.Player.pos.x, base.z - BO.Player.pos.z) < 75 ? { ...base, base: true } : { x: BO.Player.pos.x, y: BO.Player.pos.y, z: BO.Player.pos.z, base: false };
            }
            const alive = this.members.filter((z) => z.alive).length;
            if ((this.wave >= this.waves && alive === 0) || !c.isNight) this.finish(alive === 0);
        }

        finish(cleared) {
            const m = this.mode;
            const c = this.campaign;
            this.active = false;
            this.doneNight = this.night;
            // Stragglers lose interest at dawn.
            for (const z of this.members) if (z.alive) { z.horde = false; if (z.zs) z.zs.state = 'idle'; }
            this.members = [];
            const integ = this.baseStart != null ? Math.round(this.integrity() * 100) : null;
            c.mark('hordesSurvived', 1, cleared ? 300 : 180);
            BO.SurvivalCareer.awardCommendations?.(1);
            BO.Events.emit('hud:banner', {
                title: cleared ? 'HORDE DESTROYED' : 'YOU SURVIVED THE NIGHT',
                sub: this.kills + ' KILLED' + (integ != null ? ' · BASE INTEGRITY ' + integ + '%' : '') + ' · +1 COMMENDATION',
                color: '#8fe3c8'
            });
            c.save(true);
        }

        /* ------------------------------------------------------------ steering */
        structureNear(x, z, y, r = 2.4) {
            let best = null, bd = r;
            for (const p of this.campaign.placed) {
                if (!p.alive || !p.part || p.part.hp <= 0) continue;
                const b = BO.ZoneBuild.boxOf(p);
                if (y != null && (b.maxY < y + 0.3 || b.minY > y + 1.8)) continue;
                const dx = Math.max(b.minX - x, 0, x - b.maxX), dz = Math.max(b.minZ - z, 0, z - b.maxZ);
                const d = Math.hypot(dx, dz);
                if (d < bd) { bd = d; best = p; }
            }
            return best;
        }

        breachTarget(z) {
            const piece = z.breach;
            if (!piece || !piece.alive || !piece.part || piece.part.hp <= 0) { z.breach = null; return null; }
            const b = BO.ZoneBuild.boxOf(piece);
            const cx = BO.Math.clamp(z.pos.x, b.minX, b.maxX), cz = BO.Math.clamp(z.pos.z, b.minZ, b.maxZ);
            if (Math.hypot(cx - z.pos.x, cz - z.pos.z) > 3.2) { z.breach = null; return null; }
            return { x: cx, y: z.pos.y, z: cz, attackRange: 1.9, forceDirect: true, structure: piece.part };
        }

        /** Target for a horde member: breach point, flow-field step, or the player when close. */
        targetFor(z) {
            const br = this.breachTarget(z);
            if (br) return br;
            const P = BO.Player;
            const dp = Math.hypot(P.pos.x - z.pos.x, P.pos.z - z.pos.z);
            if (dp < 12 && Math.abs(P.pos.y - z.pos.y) < 2 && BO.World.hasLineOfSight(z.pos.x, z.pos.y + 1.2, z.pos.z, P.pos.x, P.pos.y + 1.2, P.pos.z)) return null;
            const nav = BO.World.nav;
            const t = this.target;
            if (!nav || !t) return null;
            const field = nav.flowTo(t.x, t.z, 120, true);
            const step = field && nav.flowStep(field, z.pos.x, z.pos.z, 2);
            if (!step) return null;
            if (Math.hypot(t.x - z.pos.x, t.z - z.pos.z) < 3) return null;
            const i = nav.idx(step.x, step.z);
            if (i >= 0 && !nav.walk[i] && nav.soft[i]) {
                const piece = this.structureNear(step.x, step.z, z.pos.y, 2.2);
                if (piece) { z.breach = piece; return this.breachTarget(z); }
            }
            return { x: step.x, y: step.y, z: step.z, attackRange: -1, forceDirect: true };
        }

        /** Hunters that make no progress against a structure start tearing it down. */
        breachCheck(dt) {
            this.stuckClock -= dt;
            if (this.stuckClock > 0) return;
            this.stuckClock = 0.5;
            const P = BO.Player.pos;
            for (const z of this.mode.zombies) {
                if (!z.alive || z.breach) continue;
                const hunting = z.horde || z.zs?.state === 'hunt';
                if (!hunting) { z._lastPos = null; continue; }
                const d = Math.hypot(P.x - z.pos.x, P.z - z.pos.z);
                if (!z._lastPos) { z._lastPos = { x: z.pos.x, z: z.pos.z, t: 0 }; continue; }
                const moved = Math.hypot(z.pos.x - z._lastPos.x, z.pos.z - z._lastPos.z);
                if (moved < 0.35 && d > 2.2) z._lastPos.t += 0.5; else { z._lastPos.x = z.pos.x; z._lastPos.z = z.pos.z; z._lastPos.t = 0; }
                if (z._lastPos.t >= 2) {
                    // Look a little way towards the player for the obstacle.
                    const k = Math.min(1.2, d) / Math.max(0.01, d);
                    const piece = this.structureNear(z.pos.x + (P.x - z.pos.x) * k, z.pos.z + (P.z - z.pos.z) * k, z.pos.y, 2.4);
                    if (piece) z.breach = piece;
                    z._lastPos.t = 0;
                }
            }
        }

        /** A breaching blow: heavies and bosses hit structures far harder. */
        strike(z, part) {
            const m = this.mode;
            const mult = z.bossLabel ? 4 : (z.spec?.hp || 100) > 250 ? 2.2 : 1.25;
            m.damagePart(part, z.damage * mult, 'melee');
            BO.FX.spawnParticles(new THREE.Vector3(z.pos.x, z.pos.y + 1.1, z.pos.z), 4, part.material === 'wood' ? 0xaa8254 : 0xbe9580, 2.4, 6, 0.4);
            if (Math.random() < 0.35) BO.Sound?.playMelee?.();
            BO.ZoneDirector.noise(z.pos.x, z.pos.z, 26, 'breach');
            if (part.hp <= 0) z.breach = null;
        }
    }

    BO.ZoneHorde = new ZoneHorde();
})(window.BO);
