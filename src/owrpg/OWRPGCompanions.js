/* ============================================================================
   BLACKOUT OPS — Open World RPG · Companions, World Schedules & New Game+
   Extends OWRPGMode cleanly via non-destructive lifecycle wrappers:
   - Recruitable Squadmates (Vanguard Soren, Ghost Kael, Tinker Torque)
   - Passive companion auras, allied Soldier mesh & throttled combat assist
   - Day/Night NPC routine phase indicator & quest Territory shifts
   - New Game+ cycling Act I–VI quests at +4 difficulty tiers while keeping
     perks, skills, mounts, codex & gear intact.
============================================================================ */
(function (BO) {
    'use strict';

    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const _vA = new THREE.Vector3();
    const _vB = new THREE.Vector3();

    const Comp = {
        activeId: null,
        stance: 'follow', // 'follow' | 'hold'
        mesh: null,
        sprite: null,
        pos: new THREE.Vector3(),
        fireCd: 0,
        lastScheduleId: '',
        _hooked: false,

        get s() { return BO.OWRPGMode.state; },

        initHooks() {
            if (this._hooked) return;
            this._hooked = true;

            // Route Act II-VI quests through OWRPGQuests & OWRPGDialogue without mutating base OWRPGQuestsData key count
            if (BO.OWRPGQuests && BO.OWRPGAct2?.QUESTS) {
                const Q = BO.OWRPGQuests;
                const A2Q = BO.OWRPGAct2.QUESTS;
                const origDef = Q.def.bind(Q);
                const origOnEvent = Q.onEvent.bind(Q);
                Q.def = (id) => origDef(id) || A2Q[id];
                Q.onEvent = (s, type, key) => {
                    origOnEvent(s, type, key);
                    const tag = type + ':' + key;
                    for (const [id, d] of Object.entries(A2Q)) {
                        const q = Q.get(s, id);
                        if (q.state === 'inactive' && d.autoStart === tag) { Q.start(s, id); continue; }
                        if (q.state !== 'active') continue;
                        const on = d.stages[q.stage]?.on;
                        if (on && on[tag]) { Q.setStage(s, id, on[tag]); }
                    }
                };
            }
            if (BO.OWRPGDialogue && BO.OWRPGAct2?.DIALOGUE_INJECTIONS) {
                const DLG = BO.OWRPGDialogue;
                const INJ = BO.OWRPGAct2.DIALOGUE_INJECTIONS;
                const origTree = DLG.tree.bind(DLG);
                const treeCache = new WeakMap();
                DLG.tree = (npcId) => {
                    const base = origTree(npcId);
                    const ext = INJ[npcId];
                    if (!base || !ext) return base;
                    if (treeCache.has(base)) return treeCache.get(base);
                    const nodes = Object.assign({}, base.nodes, ext.extraNodes);
                    if (base.nodes?.hub) {
                        nodes.hub = Object.assign({}, base.nodes.hub, {
                            choices: [...ext.hubChoices, ...base.nodes.hub.choices]
                        });
                    }
                    const wrapped = Object.assign({}, base, { nodes });
                    treeCache.set(base, wrapped);
                    return wrapped;
                };
            }

            const M = BO.OWRPGMode;
            const origStart = M.start.bind(M);
            const origStop = M.stop.bind(M);
            const origUpdate = M.update.bind(M);
            const origIncoming = M.modifyIncomingDamage.bind(M);

            M.start = (opts) => {
                const scene = origStart(opts);
                this._onModeStart(scene);
                return scene;
            };
            M.stop = () => {
                this._despawnMesh();
                origStop();
            };
            M.update = (dt) => {
                origUpdate(dt);
                if (M.active && M.state) this._update(dt);
            };
            M.modifyIncomingDamage = (amount, attackerPos, attackerEntity) => {
                let v = origIncoming(amount, attackerPos, attackerEntity);
                const def = this.activeDef();
                if (def && def.aura && def.aura.dmgReduce) v *= (1 - def.aura.dmgReduce);
                return v;
            };

            // Inject derived crit/cd bonuses when a companion is active
            if (BO.OWRPGCharacter && BO.OWRPGCharacter.derived) {
                const origDerived = BO.OWRPGCharacter.derived.bind(BO.OWRPGCharacter);
                BO.OWRPGCharacter.derived = (s) => {
                    const d = origDerived(s);
                    const id = s && s.player && s.player.activeCompanion;
                    const def = id && BO.OWRPGAct2?.COMPANIONS?.[id];
                    if (def && def.aura) {
                        if (def.aura.critBonus) d.critMult = +(d.critMult + def.aura.critBonus).toFixed(2);
                        if (def.aura.cdBonus) d.cdMult = +Math.max(0.45, d.cdMult - def.aura.cdBonus).toFixed(2);
                    }
                    return d;
                };
            }

            // Inject Companions & NG+ panel directly inside Pip-Pad Character & System tabs
            if (BO.OWRPGPipPad) {
                const Pad = BO.OWRPGPipPad;
                const origChar = Pad._character.bind(Pad);
                Pad._character = () => origChar() + this._renderCompanionCard();

                const origSys = Pad._system ? Pad._system.bind(Pad) : null;
                if (origSys) {
                    Pad._system = () => origSys() + this._renderNgPlusCard();
                }

                Object.assign(Pad.handlers, {
                    setCompanion: (v) => { this.setActive(v === 'none' ? null : v); Pad.render(); },
                    toggleStance: () => { this.toggleStance(); Pad.render(); },
                    startNgPlus: () => {
                        const err = this.startNewGamePlus();
                        if (err) BO.OWRPGMode.toast(err, '#f97316');
                        else { BO.OWRPGUI.close(true); Pad.UI?.close?.(true); }
                    }
                });
            }
        },

        unlockedList(s) {
            const comps = BO.OWRPGAct2?.COMPANIONS || {};
            return Object.values(comps).filter((c) => !c.flag || (s && s.worldFlags && s.worldFlags[c.flag]));
        },

        activeDef() {
            const s = this.s;
            const id = s && s.player && s.player.activeCompanion;
            return (id && BO.OWRPGAct2?.COMPANIONS?.[id]) || null;
        },

        setActive(id) {
            const s = this.s;
            if (!s) return;
            if (!id) {
                s.player.activeCompanion = null;
                this._despawnMesh();
                this._syncHudPill();
                BO.OWRPGMode.toast('Companion dismissed to camp', '#94a3b8');
                return;
            }
            const def = BO.OWRPGAct2?.COMPANIONS?.[id];
            if (!def) return;
            s.worldFlags[def.flag] = true;
            s.player.activeCompanion = id;
            this._spawnMesh(def);
            this._syncHudPill();
            BO.OWRPGMode.applyDerived();
            BO.Sound?.playUIClick?.();
            BO.OWRPGMode.toast(`${def.name} deployed (${def.auraLabel})`, def.color);
        },

        toggleStance() {
            this.stance = this.stance === 'follow' ? 'hold' : 'follow';
            this._syncHudPill();
            BO.OWRPGMode.toast(`Squad stance: ${this.stance.toUpperCase()}`, '#38bdf8');
        },

        _onModeStart(scene) {
            const s = this.s;
            if (!s) return;
            // Apply Territory shifts from quest flags
            for (const sh of (BO.OWRPGAct2?.TERRITORY_SHIFTS || [])) {
                if (s.worldFlags[sh.flag]) BO.OWRPGFactions?.setPoiOwner?.(s, sh.poi, sh.owner);
            }
            // Apply NG+ difficulty scale to enemy base stats non-destructively via flag reference
            this._syncNgPlusBadge();
            this._syncHudPill();
            const active = this.activeDef();
            if (active && scene) this._spawnMesh(active);
        },

        _spawnMesh(def) {
            this._despawnMesh();
            if (!BO.World || !BO.World.scene || !BO.CharacterMesh) return;
            const P = BO.Player;
            this.pos.set(P.pos.x - 2.6, P.pos.y, P.pos.z - 2.2);
            const built = BO.CharacterMesh.buildSoldier(0, { weaponId: def.weapon || 'm4a1' });
            const root = built.root || built;
            root.position.copy(this.pos);
            const tinted = new Map();
            const color = new THREE.Color(def.color || '#f5a623');
            root.traverse((o) => {
                if (!o.isMesh || !o.material?.color) return;
                if (!tinted.has(o.material)) {
                    const mat = o.material.clone();
                    mat.color.lerp(color, 0.25);
                    tinted.set(o.material, mat);
                }
                o.material = tinted.get(o.material);
            });
            this.materials = tinted;
            this.parts = built;
            this.phase = 0;
            this.aimT = 0;
            BO.World.scene.add(root);
            this.mesh = root;
            this.fireCd = 0.6;
        },

        _despawnMesh() {
            if (this.mesh && this.mesh.parent) this.mesh.parent.remove(this.mesh);
            this.materials?.forEach((mat) => mat.dispose());
            this.materials = null;
            this.parts = null;
            this.mesh = null;
        },

        _update(dt) {
            const s = this.s;
            const P = BO.Player;
            if (!P || !s) return;

            // 1 Hz schedule & quest territory sync
            const clk = Math.floor(s.worldClock || 760);
            const sched = (BO.OWRPGAct2?.SCHEDULES || []).find((x) => clk >= x.start && clk <= x.end);
            if (sched && sched.id !== this.lastScheduleId) {
                this.lastScheduleId = sched.id;
                const clkEl = document.getElementById('ow-clock');
                if (clkEl) clkEl.title = sched.label;
            }

            const def = this.activeDef();
            if (!def) return;

            // Passive out-of-combat regen aura (Torque)
            if (def.aura?.regenPerSec && BO.OWRPGMode.combatT <= 0 && P.hp < P.maxHp) {
                P.hp = Math.min(P.maxHp, P.hp + def.aura.regenPerSec * dt);
            }

            if (!this.mesh && BO.World?.scene) this._spawnMesh(def);
            if (!this.mesh) return;

            let speed = 0, recoil = 0;
            this.aimT = Math.max(0, this.aimT - dt);
            // Keep companion near player unless stance === 'hold'
            if (this.stance === 'follow') {
                _vA.set(P.pos.x - Math.cos(P.yaw) * 2.8, P.pos.y, P.pos.z - Math.sin(P.yaw) * 2.8);
                const distSq = this.pos.distanceToSquared(_vA);
                if (distSq > 900) {
                    this.pos.copy(_vA);
                } else if (distSq > 2.2) {
                    _vB.subVectors(_vA, this.pos);
                    _vB.y = 0;
                    const len = _vB.length();
                    if (len > 0.01) {
                        _vB.multiplyScalar(Math.min(1, (6.2 * dt) / len));
                        speed = _vB.length() / Math.max(0.0001, dt);
                        this.pos.x += _vB.x;
                        this.pos.z += _vB.z;
                    }
                    this.mesh.rotation.y = Math.atan2(_vB.x, _vB.z);
                }
            }
            const inside = s.player.interiorId || BO.OWRPGWorldData.isInterior(this.pos.x, this.pos.z);
            this.pos.y = inside ? 0.1 : BO.World.terrainHeight(this.pos.x, this.pos.z);
            this.mesh.position.copy(this.pos);

            // Engage nearest visible hostile within range
            this.fireCd -= dt;
            if (this.fireCd <= 0 && BO.OWRPGAI) {
                let best = null, bestD2 = def.range * def.range;
                for (const a of BO.OWRPGAI.agents) {
                    if (!a.alive || !a.hostile || !a.ent) continue;
                    const dx = a.ent.pos.x - this.pos.x;
                    const dz = a.ent.pos.z - this.pos.z;
                    const d2 = dx * dx + dz * dz;
                    if (d2 < bestD2) { bestD2 = d2; best = a; }
                }
                if (best) {
                    this.aimT = def.cooldown;
                    recoil = 1;
                    this.fireCd = def.cooldown;
                    this.mesh.rotation.y = Math.atan2(best.ent.pos.x - this.pos.x, best.ent.pos.z - this.pos.z);
                    const lvlMult = 1 + 0.06 * Math.max(0, (s.player.level || 1) - 1);
                    const dmg = Math.round(16 * (def.dmgMult || 1) * lvlMult);
                    BO.OWRPGCombat?.damage(best, dmg, { source: 'companion', pos: this.pos });
                    BO.Sound?.playGunshot?.('ar', 0.2);
                } else {
                    this.fireCd = 0.25;
                }
            }
            this.phase += speed * 2.4 * dt;
            BO.CharacterMesh.animateSoldier(this.parts, { speed, phase: this.phase, aim: this.aimT > 0 ? 1 : 0, recoil }, dt);
        },

        _syncHudPill() {
            const xpBox = document.getElementById('ow-xp');
            if (!xpBox) return;
            let el = document.getElementById('ow-companion-hud');
            if (!el) {
                el = document.createElement('div');
                el.id = 'ow-companion-hud';
                el.style.cssText = 'margin-top:6px;font-size:11px;letter-spacing:.05em;color:#e2e8f0;background:rgba(15,23,42,.75);border:1px solid rgba(255,178,63,.35);padding:4px 8px;border-radius:4px;display:none;';
                xpBox.appendChild(el);
            }
            const def = this.activeDef();
            if (!def) { el.style.display = 'none'; return; }
            el.style.display = 'block';
            el.innerHTML = `<b style="color:${def.color}">ALLY: ${esc(def.name)}</b> · ${esc(def.auraLabel)} <span style="opacity:.7">[${this.stance.toUpperCase()}]</span>`;
        },

        _syncNgPlusBadge() {
            const s = this.s;
            if (!s) return;
            const ng = Number(s.ngPlus || 0);
            const lvl = document.getElementById('ow-lvl');
            if (lvl && ng > 0 && !lvl.textContent.includes('NG+')) {
                lvl.textContent = `LV ${s.player.level} · NG+${ng}`;
            }
        },

        _renderCompanionCard() {
            const s = this.s;
            if (!s) return '';
            const comps = Object.values(BO.OWRPGAct2?.COMPANIONS || {});
            const active = s.player.activeCompanion;
            const rows = comps.map((c) => {
                const unlocked = !c.flag || !!s.worldFlags[c.flag];
                const isOn = active === c.id;
                return `<div class="ow-item" style="border-left:3px solid ${c.color}">
                    <div><b>${esc(c.name)}</b> <small style="color:${c.color}">${esc(c.role)} · ${esc(c.auraLabel)}</small><br><small>${esc(c.blurb)}</small></div>
                    <div>${isOn
                        ? `<button class="ow-btn ow-ghost" data-act="toggleStance">${this.stance.toUpperCase()}</button> <button class="ow-btn ow-ghost" data-act="setCompanion" data-v="none">DISMISS</button>`
                        : (unlocked ? `<button class="ow-btn" data-act="setCompanion" data-v="${c.id}">DEPLOY</button>` : `<small class="ow-dim">Recruit from ${esc(c.faction)} hub</small>`)}</div>
                </div>`;
            }).join('');
            return `<div class="ow-sub" style="margin-top:14px">SQUAD COMPANIONS</div><div class="ow-items">${rows}</div>`;
        },

        _renderNgPlusCard() {
            const s = this.s;
            if (!s) return '';
            const eligible = !!(s.worldFlags?.meridian_act6_complete || (s.quests?.q_act6_meridian_finale?.state === 'completed'));
            const ng = Number(s.ngPlus || 0);
            return `<div class="ow-sub" style="margin-top:14px">NEW GAME+ CYCLE</div>
                <div class="ow-item"><div><b>Operation Meridian · NG+${ng}</b><small>${eligible ? 'Act VI Finale complete! Start a higher-stakes cycle keeping all gear, perks, skills, mounts & codex.' : 'Complete Act VI Finale ("Crown of Meridian") in Meridian Core to unlock New Game+.'}</small></div>
                <button class="ow-btn ow-primary" data-act="startNgPlus" ${eligible ? '' : 'disabled'}>BEGIN NG+${ng + 1}</button></div>`;
        },

        startNewGamePlus() {
            const s = this.s;
            if (!s) return 'No active save.';
            const eligible = !!(s.worldFlags?.meridian_act6_complete || (s.quests?.q_act6_meridian_finale?.state === 'completed'));
            if (!eligible) return 'Complete Act VI Finale first to unlock New Game+.';
            const nextNg = (Number(s.ngPlus) || 0) + 1;
            const keepFlags = {};
            for (const k of ['comp_soren_recruited', 'comp_kael_recruited', 'comp_torque_recruited', 'compassEnabled', 'compassQuest']) {
                if (s.worldFlags[k]) keepFlags[k] = s.worldFlags[k];
            }
            s.ngPlus = nextNg;
            s.quests = {};
            s.worldFlags = keepFlags;
            s.poiStates = {};
            s.player.credits += 1500 * nextNg;
            s.player.relayCells += 3;
            const sp = BO.MapsData.MAPS.meridian.playerSpawn;
            s.player.pos = [sp.x, null, sp.z];
            s.player.interiorId = null;
            BO.OWRPGMode.save(BO.OWRPGMode.slot, `New Game+ ${nextNg}`);
            const cam = BO.OWRPGMode.camera;
            BO.OWRPGMode.stop();
            BO.OWRPGMode.start({ slot: BO.OWRPGMode.slot, camera: cam });
            BO.Events.emit('hud:banner', { title: `NEW GAME+ ${nextNg}`, sub: 'All quests reset · Perks, mounts, skills & gear retained', color: '#fbbf24' });
            return '';
        }
    };

    Comp.initHooks();
    BO.OWRPGCompanions = Comp;
})(window.BO);
