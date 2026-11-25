/* ============================================================================
   BLACKOUT OPS — Open World RPG Mode ("Operation Meridian")
   Mode lifecycle and the glue between engine and OWRPG systems:
   - start/stop/suspend, character slots, quick-save (F5) / quick-load (F9),
     rolling checkpoints on discovery, interior transitions and quest stages
   - per-frame physics/combat, 10 Hz perception + statuses, 1 Hz world sim
   - player hooks: speed (encumbrance/holster), incoming damage (armor),
     cheat-death perk, out-of-combat regeneration (to 60%)
   Systems live in src/owrpg/*, data in src/data/OWRPG*.js, UI in OWRPGUI.js.
============================================================================ */
(function (BO) {
    'use strict';

    const UP = new THREE.Vector3(0, 1, 0);
    const SEC_FIXED = 0.1;

    const Mode = {
        active: false,
        state: null,
        slot: 0,
        camera: null,
        acc10: 0,
        acc1: 0,
        camoT: 0,
        holstered: false,
        combatT: 0,
        cheatCd: 0,
        pendingVendor: null,
        lastMag: null,
        prompt: null,
        lastSaveLabel: '',

        /* ================================================== lifecycle */
        /** opts: { slot, newChar?: { name, attrs, difficulty }, camera } */
        start(opts) {
            this.camera = opts.camera;
            this.slot = opts.slot || 0;
            const Save = BO.OWRPGSave;
            let s = opts.newChar ? null : Save.read(this.slot);
            const fresh = !s;
            if (fresh) s = Save.defaultSlot(Object.assign({ index: this.slot }, opts.newChar || {}));
            this.state = s;
            this.active = true;
            this.acc10 = this.acc1 = 0;
            this.camoT = 0; this.holstered = false; this.combatT = 0; this.cheatCd = 0;
            this.lastMag = null;
            if (fresh) {
                this._starterKit(s);
                const pr = opts.newChar && opts.newChar.primer;
                if (pr && BO.OWRPGStatsData.ABILITIES.primer[pr]) s.player.abilities.primer = pr;
            }

            if (BO.Combat) BO.Combat.reset(this.camera);
            BO.OWRPGCombat.reset();
            BO.OWRPGAI.clear();
            const scene = BO.World.build('meridian');
            BO.OWRPGWorldSim.init(scene);
            BO.OWRPGInteriors.build(scene);

            const p = s.player;
            const inside = p.interiorId || BO.OWRPGWorldData.isInterior(p.pos[0], p.pos[2]);
            const y = inside ? 0.1 : BO.World.terrainHeight(p.pos[0], p.pos[2]) + 0.2;
            BO.Player.initForMatch('owrpg', { x: p.pos[0], y: p.pos[1] != null ? Math.max(p.pos[1], y) : y, z: p.pos[2], yaw: p.yaw }, this._loadoutCfg(), false);
            BO.Player.lethalCount = 0;
            BO.Player.tacticalCount = 0;
            this.refreshLoadout(true);
            this.applyDerived();
            BO.Player.hp = p.hp ? Math.min(p.hp, BO.Player.maxHp) : BO.Player.maxHp;

            BO.Combat.onHitEnemy = (ent, dmg, hitbox, dist, w) => BO.OWRPGCombat.onGunHit(ent, dmg, hitbox, dist, w);
            BO.Combat.onExplodeAt = (pos, radius, damage) => {
                for (const a of BO.OWRPGAI.agentsNear(pos, radius, false)) BO.OWRPGCombat.damage(a, damage * 0.6, { source: 'ability' });
            };
            BO.Combat.onActivateKillstreak = null;
            BO.Sound.startMusic('rpg');
            BO.OWRPGUI.showHud();
            if (fresh) {
                BO.Events.emit('hud:banner', { title: 'OPERATION MERIDIAN', sub: 'Freestead Town, Haven Basin — find Warden Kessler in the brick HQ', color: '#f5a623' });
                this.save(this.slot, 'New character');
            } else {
                BO.Events.emit('hud:banner', { title: 'THE MERIDIAN EXPANSE', sub: `${p.name} · Level ${p.level}`, color: '#f5a623' });
            }
            if (BO.OWRPGValidator && BO.Settings.get('owrpgDev')) BO.OWRPGValidator.runAll(true);
            return scene;
        },

        _starterKit(s) {
            const I = BO.OWRPGInventory;
            const prim = I.add(s, 'w_carbine', 1);
            const sec = I.add(s, 'w_pistol', 1);
            const rig = I.add(s, 'rig_light', 1);
            I.add(s, 'medkit', 2);
            I.add(s, 'ammo_box', 2);
            s.player.equipped = { primary: prim.uid, secondary: sec.uid, rig: rig.uid };
        },

        stop() {
            if (!this.active) return;
            this.active = false;
            BO.OWRPGAI.clear();
            BO.OWRPGInteriors.clear();
            BO.OWRPGCombat.reset();
            BO.OWRPGUI.hideAll();
            if (BO.Combat) { BO.Combat.onHitEnemy = null; BO.Combat.onExplodeAt = null; BO.Combat.setTargetPool([]); }
            BO.Sound.stopMusic();
        },

        /** Called on exit-to-menu: autosave (unless dead) then stop. */
        suspend() {
            if (this.active && BO.Player.alive) this.save(this.slot, 'Exit');
            this.stop();
        },

        /* ================================================== saving */
        _snapshot() {
            const s = this.state;
            const P = BO.Player;
            s.player.pos = [+P.pos.x.toFixed(2), +P.pos.y.toFixed(2), +P.pos.z.toFixed(2)];
            s.player.yaw = +P.yaw.toFixed(3);
            s.player.hp = Math.round(P.hp);
            return s;
        },

        canSave() {
            const P = BO.Player;
            if (!this.active || !P.alive) return 'You are dead.';
            if (BO.OWRPGAI.anyHostileInCombat()) return 'Cannot save during combat.';
            if (!P.onGround || P.sliding) return 'Cannot save while airborne.';
            return '';
        },

        save(slot = this.slot, label = 'Save') {
            BO.OWRPGSave.write(slot, this._snapshot());
            this.lastSaveLabel = label;
        },

        quickSave() {
            const why = this.canSave();
            if (why) { this.toast(why, '#f97316'); return false; }
            this.save(this.slot, 'Quick save');
            this.toast('Game saved', '#a3e635');
            return true;
        },

        quickLoad() {
            const s = BO.OWRPGSave.read(this.slot);
            if (!s) { this.toast('No save in this slot', '#f97316'); return; }
            const cam = this.camera;
            this.stop();
            BO.State.activeMode = 'owrpg';
            this.start({ slot: this.slot, camera: cam });
            this.toast('Loaded', '#a3e635');
        },

        /** Rolling checkpoint: silent autosave when it's safe. */
        checkpoint(label) {
            if (this.canSave()) return;
            this.save(this.slot, label);
        },

        /* ================================================== loadout & stats */
        _weaponCfg(entry) {
            const d = BO.OWRPGStatsData.ITEMS[entry.id];
            const spec = BO.WeaponsData.get(d.base);
            const camo = { common: 'default', rare: 'carbon', epic: 'dark_matter', legendary: 'gold' }[entry.rarity] || 'default';
            return { id: d.base, camo, attachments: { optic: spec.modelSpec && spec.modelSpec.defaultScope ? 'sniper_scope' : 'iron', muzzle: d.suppressed ? 'suppressor' : 'none', underbarrel: 'none', magazine: 'std_mag', stock: 'std_stock' } };
        },

        _loadoutCfg() {
            const I = BO.OWRPGInventory;
            const prim = I.equippedEntry(this.state, 'primary') || I.equippedEntry(this.state, 'secondary');
            const sec = I.equippedEntry(this.state, 'secondary');
            return {
                primary: prim ? this._weaponCfg(prim) : { id: 'm1911', camo: 'default', attachments: { optic: 'iron', muzzle: 'none', underbarrel: 'none', magazine: 'std_mag', stock: 'std_stock' } },
                secondary: sec && prim !== sec ? this._weaponCfg(sec) : null,
                perks: [], lethal: 'frag', tactical: 'flashbang', fieldUpgrade: 'munitions_box', ultimatePower: 'gravity_spikes'
            };
        },

        /** Rebuild the player's weapons from equipped items (keeps ammo where possible). */
        refreshLoadout(initial = false) {
            const P = BO.Player;
            const I = BO.OWRPGInventory;
            const s = this.state;
            const d = BO.OWRPGCharacter.derived(s);
            const entries = [I.equippedEntry(s, 'primary'), I.equippedEntry(s, 'secondary')].filter(Boolean);
            const old = P.weapons || [];
            this.weaponEntries = entries;
            P.weapons = entries.map((e, i) => {
                const w = P._createWeaponInstance(this._weaponCfg(e), 0);
                w.stats.adsTime /= d.adsMult;
                w.stats.hipSpread *= d.spreadMult;
                w.stats.adsSpread *= d.spreadMult;
                w.reserve = initial ? Math.round(w.stats.reserveMax * 0.6) : (old[i] && old[i].cfg.id === w.cfg.id ? old[i].reserve : Math.round(w.stats.reserveMax * 0.4));
                if (!initial && old[i] && old[i].cfg.id === w.cfg.id) w.mag = old[i].mag;
                return w;
            });
            if (!P.weapons.length) P.weapons = [P._createWeaponInstance(this._loadoutCfg().primary, 0)];
            P.activeSlot = Math.min(P.activeSlot || 0, P.weapons.length - 1);
            P.reloading = false;
            P.rebuildViewmodel();
            this.lastMag = null;
        },

        activeWeaponEntry() { return this.weaponEntries ? this.weaponEntries[BO.Player.activeSlot] || null : null; },

        applyDerived() {
            const P = BO.Player;
            const d = BO.OWRPGCharacter.derived(this.state);
            const frac = P.maxHp > 0 ? P.hp / P.maxHp : 1;
            P.maxHp = d.maxHp;
            P.hp = Math.max(1, Math.min(P.maxHp, Math.round(P.maxHp * frac)));
            P.armor = 0; P.maxArmor = 0; P.armorReservePlates = 0;
            P.selfRevives = 0;
        },

        /* ================================================== player hooks */
        speedMult() {
            if (!this.active) return 1;
            const enc = BO.OWRPGCharacter.encumbrance(this.state);
            return enc.speed * (this.holstered && BO.Player.sprinting ? 1.12 : 1) * (this.stimT > 0 ? 1.25 : 1);
        },

        modifyIncomingDamage(amount) { return BO.OWRPGCombat.modifyIncoming(amount) * (this.stimT > 0 ? 0.8 : 1); },

        onPlayerHurt() { this.combatT = 6; },

        tryPreventDeath(P) {
            const fx = BO.OWRPGCharacter.perkFx(this.state);
            if (fx.cheatDeath && this.cheatCd <= 0) {
                this.cheatCd = fx.cheatDeath;
                P.hp = 1;
                P.invulnTimer = 1.5;
                this.toast('UNSTOPPABLE — still standing!', '#f97316');
                return true;
            }
            return false;
        },

        /* ================================================== rewards & state */
        toast(text, color = '#e2e8f0') { BO.Events.emit('hud:toast', { text, color }); },

        giveXp(amount, label, quiet) {
            const s = this.state;
            const levels = BO.OWRPGCharacter.addXp(s, amount);
            if (!quiet || label) BO.OWRPGUI.xpPop(Math.round(amount), label);
            if (levels > 0) {
                this.applyDerived();
                BO.Player.hp = BO.Player.maxHp;
                BO.Sound.playPerkBuy();
                BO.Events.emit('hud:banner', { title: `LEVEL ${s.player.level}`, sub: `${s.player.perkPoints ? s.player.perkPoints + ' perk point(s) · ' : ''}${s.player.attrPoints ? s.player.attrPoints + ' attribute point(s) · ' : ''}Open the Pip-Pad [Tab]`, color: '#fbbf24' });
            }
        },

        changeRep(f, v) {
            const delta = BO.OWRPGFactions.add(this.state, f, v);
            if (delta) this.toast(`${BO.OWRPGFactionsData.FACTIONS[f].short} ${delta > 0 ? '+' : ''}${delta}`, BO.OWRPGFactionsData.FACTIONS[f].color);
            BO.OWRPGAI.refreshHostility();
        },

        setFlag(id, val) {
            const s = this.state;
            if (s.worldFlags[id] === val) return;
            s.worldFlags[id] = val;
            if (val) BO.OWRPGQuests.onEvent(s, 'flag', id);
        },

        itemEvent(id) { BO.OWRPGQuests.onEvent(this.state, 'item', id); },

        reward(r, label) {
            const s = this.state;
            if (r.xp) this.giveXp(r.xp, 'Quest');
            if (r.credits) s.player.credits += r.credits;
            for (const it of r.items || []) BO.OWRPGInventory.add(s, it, 1);
            for (const [f, v] of Object.entries(r.rep || {})) this.changeRep(f, v);
            if (r.pylon) { s.pylons[r.pylon] = true; BO.OWRPGWorldArt.setPylonActive(BO.World, r.pylon, true); }
            BO.Events.emit('hud:banner', { title: 'QUEST COMPLETE', sub: `${label}${r.label ? ' — ' + r.label : ''}${r.credits ? ' · +' + r.credits + ' cr' : ''}`, color: '#a3e635' });
            this.checkpoint('Quest complete');
        },

        heal(n) { const P = BO.Player; P.hp = Math.min(P.maxHp, P.hp + n); },
        healFull() { BO.Player.hp = BO.Player.maxHp; this.toast('Fully healed', '#4ade80'); },

        dropLoot(pos, table, rolls) {
            if (!table) return;
            const loot = BO.OWRPGInventory.rollLoot(this.state, table, rolls + 1);
            BO.OWRPGInteriors.dropBag(pos, loot);
        },

        giveLootReport(loot, source) {
            const s = this.state;
            BO.OWRPGInventory.grantLoot(s, loot);
            for (const it of loot.items) this.itemEvent(it.id);
            BO.OWRPGUI.lootToast(loot, source);
        },

        smokeHint(x, z) {
            const y = BO.World.terrainHeight(x, z);
            for (let i = 0; i < 3; i++) BO.FX.spawnParticles(new THREE.Vector3(x, y + 2 + i * 2, z), 8, 0x6b7280, 1.2, -1.5, 2.5, 3);
        },

        /* ================================================== UI routes */
        openDialogue(npcId) { BO.OWRPGUI.openDialogue(npcId); },
        openStash() { BO.OWRPGUI.openStash(); },
        openRespec() { BO.OWRPGUI.openPipPad('perks', true); },

        usePylon(py) {
            const s = this.state;
            if (!s.pylons[py.id]) {
                s.pylons[py.id] = true;
                BO.OWRPGWorldArt.setPylonActive(BO.World, py.id, true);
                this.giveXp(50, 'Pylon online');
                this.toast(`${py.name} is online. Jumps cost 1 Relay Cell.`, '#22d3ee');
                this.checkpoint('Pylon');
                return;
            }
            BO.OWRPGUI.openTravel(py.id);
        },

        travelTo(id) {
            const s = this.state;
            const py = BO.OWRPGWorldData.PYLONS.find((p) => p.id === id);
            if (!py || !s.pylons[id]) return 'That pylon is offline.';
            if (BO.OWRPGAI.anyHostileInCombat()) return 'Cannot travel during combat.';
            if (s.player.relayCells < 1) return 'You need a Relay Cell.';
            s.player.relayCells--;
            const P = BO.Player;
            P.pos.set(py.x + 2.5, BO.World.terrainHeight(py.x + 2.5, py.z + 2.5) + 0.3, py.z + 2.5);
            P.vel.set(0, 0, 0);
            BO.OWRPGAI.clear();
            BO.OWRPGWorldSim.poiAgents = {};
            BO.FX.spawnParticles(P.pos.clone().addScaledVector(UP, 1), 30, 0x22d3ee, 5, 2, 0.6, 1.4);
            this.toast(`Arrived at ${py.name}`, '#22d3ee');
            this.checkpoint('Fast travel');
            return '';
        },

        useConsumable(uid) {
            const s = this.state;
            const I = BO.OWRPGInventory;
            const e = I.byUid(s, uid);
            if (!e) return;
            const d = I.def(e.id);
            if (d.heal) {
                const fx = BO.OWRPGCharacter.perkFx(s);
                BO.OWRPGCombat.heal = { left: d.heal * (1 + (fx.medMult || 0)), rate: d.heal / 1.5 };
            } else if (d.ammo) {
                for (const w of BO.Player.weapons) if (w.stats.kind !== 'melee') w.reserve = w.stats.reserveMax;
                this.toast('Ammunition restocked', '#fbbf24');
            } else if (d.stim) {
                this.stimT = d.stim;
                this.toast('Stim: +25% speed, damage resistance', '#f472b6');
            } else return;
            I.remove(s, e.id, 1);
        },

        quickMed() {
            const s = this.state;
            const e = s.player.inventory.find((x) => x.id === 'medkit');
            if (!e) { this.toast('No Med-Injectors', '#f97316'); return; }
            if (BO.Player.hp >= BO.Player.maxHp) { this.toast('Already at full health', '#94a3b8'); return; }
            this.useConsumable(e.uid);
        },

        /* ================================================== input */
        interact() {
            if (!this.active || !BO.Player.alive || BO.OWRPGUI.deathOpen) return;
            const t = BO.OWRPGInteriors.nearest();
            if (t) BO.OWRPGInteriors.interact(t);
        },

        /** Mode keys (rebindable via Settings). Returns true when consumed. */
        handleKey(code, kb, e) {
            if (!this.active) return false;
            if (!BO.Player.alive || BO.OWRPGUI.deathOpen) return code !== 'Escape';
            if (code === kb.owAbility1) { BO.OWRPGCombat.cast('primer'); return true; }
            if (code === kb.owAbility2) { BO.OWRPGCombat.cast('detonator'); return true; }
            if (code === kb.owGadget) { BO.OWRPGCombat.cast('gadget'); return true; }
            if (code === kb.owMed) { this.quickMed(); return true; }
            if (code === kb.owCharacter || code === 'Tab') { e && e.preventDefault(); BO.OWRPGUI.openPipPad('character'); return true; }
            if (code === kb.owQuestLog) { BO.OWRPGUI.openPipPad('quests'); return true; }
            if (code === kb.owMap) { BO.OWRPGUI.openPipPad('map'); return true; }
            if (code === kb.owQuickSave) { e && e.preventDefault(); this.quickSave(); return true; }
            if (code === kb.owQuickLoad) { e && e.preventDefault(); this.quickLoad(); return true; }
            if (code === kb.owHolster) { this.holstered = !this.holstered; this.toast(this.holstered ? 'Weapon holstered (+12% sprint)' : 'Weapon drawn', '#94a3b8'); return true; }
            if (code === kb.owDodge) {
                if (!BO.OWRPGCharacter.encumbrance(this.state).dodge) { this.toast('Overburdened — cannot dodge', '#f97316'); return true; }
                if (BO.Player.tryDodgeRoll) BO.Player.tryDodgeRoll();
                const fx = BO.OWRPGCharacter.perkFx(this.state);
                if (fx.dodgeCamo) this.camoT = Math.max(this.camoT, fx.dodgeCamo);
                return true;
            }
            if (code === 'F8') { BO.OWRPGUI.toggleDev(); return true; }
            return false;
        },

        /** Shared bindings that do nothing here (grenades, streaks, shops, plates). */
        isSuppressed(code, kb) {
            const mine = [kb.owAbility1, kb.owAbility2, kb.owGadget, kb.owMed, kb.owHolster, kb.owDodge, kb.owQuestLog, kb.owMap];
            if (mine.includes(code)) return false;
            return [kb.lethal, kb.tactical, kb.special, kb.ultimate, 'KeyZ', kb.armory, kb.armor, kb.exfil, 'Digit3', 'Digit5', 'Digit6', 'Digit7'].includes(code);
        },

        /* ================================================== frame */
        update(dt) {
            if (!this.active || !this.state) return;
            const s = this.state;
            const P = BO.Player;
            if (!P.alive) { if (!BO.OWRPGUI.deathOpen) { s.stats.deaths++; BO.OWRPGUI.showDeath(); } return; }
            s.playtimeSec += dt;
            if (this.camoT > 0) this.camoT -= dt;
            if (this.cheatCd > 0) this.cheatCd -= dt;
            if (this.combatT > 0) this.combatT -= dt;
            if (this.stimT > 0) this.stimT -= dt;
            if (BO.OWRPGAI.anyHostileInCombat()) this.combatT = Math.max(this.combatT, 2);

            BO.OWRPGCombat.update(dt);
            BO.OWRPGAI.update(dt);
            BO.OWRPGWorldSim.update(dt);
            BO.OWRPGInteriors.update(dt);
            BO.OWRPGWorldArt.animate(BO.World, s.worldClock);

            // Gunfire noise: unsuppressed shots carry 55 m, suppressed 9 m.
            const w = P.weapons[P.activeSlot];
            if (w) {
                if (this.lastMag !== null && w.mag < this.lastMag && this.lastSlot === P.activeSlot) BO.OWRPGAI.noise(P.pos, w.stats.suppressed ? 9 : 55);
                this.lastMag = w.mag;
                this.lastSlot = P.activeSlot;
            }

            this.acc10 += dt;
            while (this.acc10 >= SEC_FIXED) { this.acc10 -= SEC_FIXED; BO.OWRPGAI.tick10(SEC_FIXED); }
            this.acc1 += dt;
            if (this.acc1 >= 1) {
                this.acc1 -= 1;
                BO.OWRPGWorldSim.tick1(1);
                if (this.combatT <= 0 && P.hp < P.maxHp * 0.6) P.hp = Math.min(P.maxHp * 0.6, P.hp + 2.5);
                if (this.pendingVendor) { const v = this.pendingVendor; this.pendingVendor = null; BO.OWRPGUI.openVendor(v); }
            }
            this.prompt = BO.OWRPGInteriors.nearest();
        }
    };

    BO.OWRPGMode = Mode;
})(window.BO);
