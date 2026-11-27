/* ============================================================================
   BLACKOUT OPS — The heart of the Zone: the Warden and the Lantern
   Touching the Lantern with the research data wakes its guardian.
   Phase 1  The Warden fights alone and calls the brood every 20 s.
   Phase 2  (below 66%) The Lantern starts to pulse: a 3-second charge, then a
            blast that hits anything in its line of sight. Break line of sight
            behind the basalt monoliths. The Warden moves faster.
   Phase 3  (below 33%) Pulses come faster, radiation surges, and the Warden's
            slams knock you back.
   Win and the Lantern is yours to decide. Each ending changes the world, pays
   out in the Archive, and you may finish the expedition or keep exploring.
============================================================================ */
(function (BO) {
    'use strict';

    const ENDINGS = {
        seal: {
            title: 'THE LANTERN IS SEALED', color: '#8fe3c8',
            text: 'You overload the core. The light folds in on itself and the Crater goes quiet. Across the Zone the infected stop, as if listening for something that is no longer there — then they scatter. Haven sees the beam go dark from the hill. For the first time in a year, the night is just night.',
            effect: 'The beam is gone. Roaming infected are thinner everywhere (−35%) and horde nights stop.',
            commendations: 6
        },
        extract: {
            title: 'EXTRACTED WITH THE DATA', color: '#9fd4ff',
            text: 'You leave the Lantern humming and walk out with everything Black Pine knew. Somewhere beyond the fence, people will pay for this — or build another one. Haven never learns what you carried out. The beam keeps burning behind you.',
            effect: 'The world stays as it is. A large share of your pack is banked into the Archive stash.',
            commendations: 4
        },
        seize: {
            title: 'THE LANTERN IS YOURS', color: '#f2b45a',
            text: 'You put your hand on the core and the resonance answers. The brood turns its head toward you as one — and does not attack. The beam turns gold. Haven goes silent on the radio. Whatever you are now, the Zone belongs to you.',
            effect: 'The beam turns gold. Infected notice you far less (−60% detection) unless you attack them. Unlocks the Keeper kit.',
            commendations: 5
        }
    };

    class ZoneFinale {
        constructor() { this.reset(); }

        reset() {
            this.active = false;
            this.warden = null;
            this.phase = 0;
            this.nextAdds = 0;
            this.pulseAt = 0;
            this.charging = false;
            this.slamAt = 0;
            this.won = false;
            this.effect = null;
        }

        get mode() { return BO.SurvivalMode; }
        get campaign() { return BO.SurvivalMode.campaign; }
        get core() {
            const L = BO.Zone.LANTERN;
            const ly = BO.World.zone?.lantern?.baseY ?? BO.World.terrainHeight(L.x, L.z);
            return { x: L.x, y: ly + 9, z: L.z };
        }

        stop() {
            if (BO.World.zone?.lantern) BO.World.zone.lantern.fx = null;
            this.reset();
        }

        /** Restore world effects of an ending chosen earlier this run (after loading a save). */
        applySaved(o) {
            if (o.ending && o.keepExploring) this.applyEffect(o.ending, true);
        }

        begin() {
            const m = this.mode;
            if (this.active) return;
            const c = this.core;
            this.active = true;
            this.phase = 1;
            this.nextAdds = m.clock + 8;
            this.pulseAt = 0;
            // Clear any wandering Warden from earlier visits, then raise the real one at the core.
            for (const z of m.zombies) if (z.alive && z.survivalType === 'warden') { z.alive = false; z.deathTimer = 0; if (z.parts?.root) z.parts.root.visible = false; }
            const a = Math.atan2(BO.Player.pos.z - c.z, BO.Player.pos.x - c.x);
            const x = c.x + Math.cos(a) * 6, z = c.z + Math.sin(a) * 6;
            const w = m.spawnInfected(x, BO.World.getGroundHeight(x, z, c.y), z, 'warden', null, true);
            if (!w) { this.active = false; return; }
            const diff = { easy: 0.75, normal: 1, hard: 1.25, veteran: 1.4, nightmare: 1.6, apocalypse: 1.9 }[this.campaign.options.difficulty] || 1;
            const tierHp = m.tierSpec?.hp || 1;
            w.maxHp = w.hp = Math.round(2200 * diff * tierHp);
            w.baseSpeed = w.speed;
            w.baseDamage = w.damage;
            w.zs = { state: 'hunt', seen: m.clock, home: { x: c.x, z: c.z }, x: c.x, z: c.z, until: 0, wander: 0 };
            w.isFinale = true;
            this.warden = w;
            BO.World.zone.lantern.fx = (L, clock) => this.lanternFx(L, clock);
            BO.Events.emit('hud:banner', { title: 'THE WARDEN', sub: 'THE LANTERN\'S GUARDIAN WAKES · KEEP THE MONOLITHS BETWEEN YOU AND THE LIGHT', color: '#d58bff' });
            BO.Sound?.playZombieGroan?.('brute', 1);
            BO.Player.cameraShake = Math.max(BO.Player.cameraShake || 0, 0.25);
            m.refreshTargets();
        }

        /** Retreat or death: the Warden withdraws into the light and recovers. */
        abort(reason) {
            const m = this.mode;
            if (this.warden?.alive) { this.warden.alive = false; this.warden.deathTimer = 0; if (this.warden.parts?.root) this.warden.parts.root.visible = false; }
            for (const z of m.zombies) if (z.alive && z.finaleAdd) { z.alive = false; z.deathTimer = 0; if (z.parts?.root) z.parts.root.visible = false; }
            if (BO.World.zone?.lantern) BO.World.zone.lantern.fx = null;
            this.reset();
            m.toast(reason);
        }

        lanternFx(L, clock) {
            if (this.charging) {
                const k = 1 - Math.max(0, this.pulseAt - this.mode.clock) / 3;
                L.beam.material.color.setHex(0xff6b5b);
                L.beam.material.opacity = 0.3 + k * 0.6;
                L.glow.color.setHex(0xff5a4a);
                L.glow.intensity = 3 + k * 9;
                L.spire.material.emissiveIntensity = 1 + k * 3;
            } else if (this.active) {
                L.beam.material.color.setHex(0xd6b8ff);
                L.glow.color.setHex(0xb08cff);
            }
        }

        /** Clear line from the Lantern core to the player's head? */
        exposed() {
            const c = this.core;
            const p = BO.Player.pos;
            return BO.World.hasLineOfSight(c.x, c.y, c.z, p.x, p.y + 1.5, p.z);
        }

        update(dt) {
            if (!this.active) return;
            const m = this.mode;
            const P = BO.Player;
            const w = this.warden;
            const c = this.core;
            const dist = Math.hypot(P.pos.x - c.x, P.pos.z - c.z);
            if (!P.alive) return this.abort('The Warden withdraws into the light. Return when you are ready.');
            if (dist > 85) return this.abort('You fled the Crater. The Warden withdraws into the light and recovers.');
            if (!w.alive) return this.victory();
            const frac = w.hp / w.maxHp;
            const phase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
            if (phase !== this.phase) {
                this.phase = phase;
                w.speed = w.baseSpeed * (phase === 2 ? 1.3 : 1.5);
                w.damage = Math.round(w.baseDamage * (phase === 3 ? 1.4 : 1.15));
                this.pulseAt = m.clock + 5;
                BO.Events.emit('hud:banner', {
                    title: 'PHASE ' + phase,
                    sub: phase === 2 ? 'THE LANTERN IS PULSING · BREAK LINE OF SIGHT WHEN IT GLOWS RED' : 'THE WARDEN IS ENRAGED · THE CRATER BURNS',
                    color: '#ff7b6b'
                });
            }
            // The brood answers its guardian.
            if (m.clock >= this.nextAdds) {
                this.nextAdds = m.clock + (phase === 3 ? 15 : 20);
                const n = 2 + phase;
                for (let i = 0; i < n; i++) {
                    const a = Math.random() * Math.PI * 2, r = 24 + Math.random() * 10;
                    const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
                    const zb = m.spawnInfected(x, BO.World.getGroundHeight(x, z, c.y + 10), z, 'normal', null, true);
                    if (zb) { zb.finaleAdd = true; zb.zs = { state: 'hunt', seen: m.clock, home: { x: c.x, z: c.z }, x: c.x, z: c.z, until: 0, wander: 0 }; }
                }
                m.refreshTargets();
            }
            // Lantern pulses.
            if (phase >= 2 && this.pulseAt) {
                const left = this.pulseAt - m.clock;
                if (!this.charging && left <= 3) {
                    this.charging = true;
                    if (BO.Sound?.playLanternCharge) BO.Sound.playLanternCharge();
                    else BO.Sound?.playZombieGroan?.('wraith', 0.8);
                }
                if (left <= 0) {
                    this.charging = false;
                    this.pulseAt = m.clock + (phase === 3 ? 9 : 14);
                    BO.FX.spawnExplosion?.(new THREE.Vector3(c.x, c.y, c.z), 6, 0xff6b5b);
                    BO.Sound?.playLanternPulse?.();
                    const shakeScale = BO.Settings?.get?.('reducedMotion') ? 0.35 : 1;
                    P.cameraShake = Math.max(P.cameraShake || 0, 0.18 * shakeScale);
                    if (this.exposed()) {
                        const resMult = Math.max(0.55, 1 - (BO.SurvivalCareer?.masteryRank?.('resonance') || 0) * 0.12);
                        P.takeDamage(Math.round((phase === 3 ? 45 : 32) * resMult));
                        m.radiation = Math.min(100, m.radiation + Math.round(20 * resMult));
                        m.toast('The pulse tore through you. Keep a monolith between you and the Lantern!');
                    }
                    // The pulse also scorches exposed brood.
                    for (const z of m.zombies) {
                        if (z.alive && z.finaleAdd && BO.World.hasLineOfSight(c.x, c.y, c.z, z.pos.x, z.pos.y + 1.2, z.pos.z)) m.hit(z, 80, 'torso', null, 'fire');
                    }
                }
            }
            // Phase 3: shockwave slams and burning radiation.
            if (phase === 3) {
                m.radiation = Math.min(100, m.radiation + dt * 1.2);
                if (m.clock >= this.slamAt && Math.hypot(w.pos.x - P.pos.x, w.pos.z - P.pos.z) < 6) {
                    this.slamAt = m.clock + 6;
                    BO.FX.spawnExplosion?.(w.pos.clone(), 4, 0xb08cff);
                    P.takeDamage(22, w.pos);
                    const dx = P.pos.x - w.pos.x, dz = P.pos.z - w.pos.z, d = Math.hypot(dx, dz) || 1;
                    P.vel.x += dx / d * 14; P.vel.z += dz / d * 14; P.vel.y = 6;
                    P.cameraShake = Math.max(P.cameraShake || 0, 0.22);
                }
            }
        }

        /** HUD readout during the fight. */
        status() {
            if (!this.active || !this.warden) return null;
            const left = this.pulseAt ? Math.max(0, this.pulseAt - this.mode.clock) : 0;
            return {
                headline: 'THE WARDEN · PHASE ' + this.phase + ' · ' + Math.max(0, Math.ceil(this.warden.hp)) + ' / ' + this.warden.maxHp,
                sub: this.charging ? 'LANTERN PULSE IN ' + Math.ceil(left) + ' — GET BEHIND A MONOLITH!' + (this.exposed() ? ' YOU ARE EXPOSED' : ' (covered)') :
                    this.phase >= 2 ? 'Next pulse in ' + Math.ceil(left) + ' s' : 'Bring it down. Its brood answers every 20 s.',
                danger: this.charging && this.exposed(),
                frac: this.warden.hp / this.warden.maxHp
            };
        }

        victory() {
            const m = this.mode;
            for (const z of m.zombies) if (z.alive && z.finaleAdd) { z.zs = { ...z.zs, state: 'idle' }; z.finaleAdd = false; }
            this.active = false;
            this.won = true;
            this.charging = false;
            if (BO.World.zone?.lantern) BO.World.zone.lantern.fx = null;
            const o = this.campaign.objectives;
            o.wardenDown = true;
            this.campaign.mark('wardenKilled', 1, 500);
            BO.Events.emit('hud:banner', { title: 'THE WARDEN FALLS', sub: 'THE LANTERN IS UNGUARDED · DECIDE ITS FATE', color: '#d58bff' });
            this.campaign.save(true, true);
            setTimeout(() => { if (m.active && BO.Player.alive) BO.SurvivalUI.show('ending'); }, 2600);
        }

        endingCommendations(ending) {
            return ENDINGS[ending]?.commendations || 0;
        }

        /* ------------------------------------------------------------ endings */
        decide(ending) {
            const spec = ENDINGS[ending];
            if (!spec) return;
            const c = this.campaign;
            const o = c.objectives;
            if (o.ending) return;
            o.ending = ending;
            o.step = o.steps.length - 1;
            c.mark('ending_' + ending, 1, 600);
            const career = BO.SurvivalCareer;
            const tier = this.mode.zoneTier || 1;
            const tierBonus = this.mode.tierSpec?.bonusComm || 0;
            career.awardCommendations?.(spec.commendations + tierBonus);
            career.recordEnding?.(ending, tier);
            if (ending === 'extract') {
                career.bankExtraction?.(this.mode.points);
                career.bankExtraction?.(this.mode.points); // the research buys a second share
            }
            this.applyEffect(ending);
            BO.Events?.emit?.('survival:ending', { ending, tier });
            BO.emitGameEvent?.('game:survivalEnding', { ending, tier });
            BO.SurvivalUI.show('epilogue', null, ending);
        }

        applyEffect(ending, quiet = false) {
            const L = BO.World.zone?.lantern;
            this.effect = ending;
            if (ending === 'seal' && L) {
                L.fx = (lan) => { lan.beam.visible = false; lan.halo.visible = false; lan.glow.intensity = 0.3; lan.spire.material.emissiveIntensity = 0.05; };
            } else if (ending === 'seize' && L) {
                L.fx = (lan) => { lan.beam.material.color.setHex(0xffcf6b); lan.halo.material.color.setHex(0xffb84a); lan.glow.color.setHex(0xffc46b); lan.spire.material.emissive.setHex(0xffa630); };
            }
            if (!quiet) this.campaign.save(true, true);
        }

        /** World modifiers from the ending, read by the director and horde. */
        get spawnMult() { return this.effect === 'seal' ? 0.65 : 1; }
        get detectMult() { return this.effect === 'seize' ? 0.4 : 1; }
        get hordesOff() { return this.effect === 'seal'; }

        keepExploring() {
            const o = this.campaign.objectives;
            o.keepExploring = true;
            this.campaign.save(true, true);
            BO.SurvivalUI.resume();
            BO.Events.emit('hud:banner', { title: 'THE ZONE GOES ON', sub: 'FREE ROAM · FINISH THE EXPEDITION FROM THE JOURNAL WHENEVER YOU LIKE', color: ENDINGS[o.ending]?.color || '#8fe3c8' });
        }

        finish() {
            const o = this.campaign.objectives;
            this.mode.finish(true, o.ending === 'operation' ? null : o.ending, true);
        }

        epilogue(ending) {
            const spec = ENDINGS[ending];
            const m = this.mode;
            const c = this.campaign;
            const o = c.objectives;
            const stat = (n, l) => `<div><b>${n}</b><small>${l}</small></div>`;
            return `<div class="sv-epilogue" style="--end:${spec.color}">
                <h2>${spec.title}</h2>
                <p class="sv-epi-text">${spec.text}</p>
                <div class="sv-epi-effect"><b>What changes</b><span>${spec.effect}</span></div>
                <div class="sv-jstats sv-epi-stats">
                    ${stat(c.day, 'Days survived')}${stat(m.kills, 'Kills')}${stat(c.visited.size + '/' + BO.Zone.REGIONS.length, 'Regions')}
                    ${stat(o.secured.size, 'Safehouses')}${stat(c.metrics.garrisons || 0, 'Garrisons cleared')}${stat(c.metrics.hordesSurvived || 0, 'Hordes survived')}
                    ${stat(c.metrics.bosses || 0, 'Named infected')}${stat(m.deaths || 0, 'Deaths')}${stat(BO.Math.formatTime(m.clock), 'Time')}
                </div>
                <p class="sv-muted sm">+${spec.commendations} commendations for the Archive.</p>
                <div class="sv-actions center">
                    <button class="sv-btn primary big" data-act="epiFinish">Finish the expedition</button>
                    <button class="sv-btn big ghost" data-act="epiExplore">Keep exploring the Zone</button>
                </div></div>`;
        }
    }

    BO.ZoneFinale = new ZoneFinale();
    BO.ZoneEndings = ENDINGS;
})(window.BO);
