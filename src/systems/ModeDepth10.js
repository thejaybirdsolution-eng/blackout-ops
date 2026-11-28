/* ============================================================================
   BLACKOUT OPS — Mode Depth 1.0 Layer (All 7 Modes)
   Adds the 1.0 depth features without altering dirty files or game balance:
   - Zombies: Power-on next-step clarity, per-map PB leaderboard & co-op roles
   - Tower Defense: Active deployable synergies, next-wave archetype preview
   - Multiplayer: Post-match 3-map vote in AAR & custom rule presets
   - Survival: Dawn/Dusk daily phase cues & ending telemetry card
   - Rogue Lite: Floor-5 synergy banner & instructive run-end debrief
   - Minigames: Daily Seeded Course + Personal-Best Ghost delta on results
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    function hashDate(str) {
        let h = 2166136261;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }

    const MP_PRESETS = {
        standard: {
            id: 'standard', name: 'Standard Arena', desc: 'Default 100 HP tactical rules and killstreaks.',
            rules: { playerHp: 100, enemyHp: 100, headshotsOnly: false, unlimitedAmmo: false, explosiveRounds: false, gravityScale: 1.0, speedScale: 1.0, killstreaksEnabled: true }
        },
        tactical_hc: {
            id: 'tactical_hc', name: 'Tactical Hardcore', desc: '35 HP lethal skirmish, faster movement, minimal margins.',
            rules: { playerHp: 35, enemyHp: 50, headshotsOnly: false, unlimitedAmmo: false, explosiveRounds: false, gravityScale: 1.0, speedScale: 1.08, killstreaksEnabled: true }
        },
        arcade_chaos: {
            id: 'arcade_chaos', name: 'Arcade Mayhem', desc: 'Low gravity, infinite ammo, explosive rounds & 1.15x speed.',
            rules: { playerHp: 120, enemyHp: 100, headshotsOnly: false, unlimitedAmmo: true, explosiveRounds: true, gravityScale: 0.65, speedScale: 1.15, killstreaksEnabled: true }
        }
    };

    const Depth = {
        MP_PRESETS,
        votedMapId: null,
        _hooked: false,

        init() {
            if (!this._hooked) {
                this._hooked = true;
                this._hookZombies();
                this._hookTD();
                this._hookAAR();
                if (typeof document !== 'undefined') {
                    document.addEventListener('bundle:loaded', () => this.ensureHooks());
                }
            }
            this.ensureHooks();
        },

        ensureHooks() {
            if (!this._hSV && BO.SurvivalMode) { this._hSV = true; this._hookSurvival(); }
            if (!this._hRPG && BO.RPGMode && BO.RPGUI) { this._hRPG = true; this._hookRPG(); }
            if (!this._hMG && BO.Minigames) { this._hMG = true; this._hookMinigames(); }
        },

        /* ====================================================== 1. ZOMBIES */
        _zRecords() {
            const d = BO.Save?.data;
            if (!d) return {};
            if (!d.zombiesRecords || typeof d.zombiesRecords !== 'object') d.zombiesRecords = {};
            return d.zombiesRecords;
        },

        getZombiesBest(mapId) {
            return this._zRecords()[mapId] || { round: 0, kills: 0, exfils: 0 };
        },

        _hookZombies() {
            const Z = BO.ZombiesMode;
            if (!Z) return;
            const origBadges = Z.getMapStatusBadges.bind(Z);
            Z.getMapStatusBadges = () => {
                const list = origBadges() || [];
                if (BO.World?.mapData?.powerSwitch && !BO.World.powerOn) {
                    list.unshift({ text: 'OBJECTIVE: FLIP POWER SWITCH FOR PERKS & PaP', color: '#facc15' });
                } else if (BO.World?.powerOn) {
                    const best = this.getZombiesBest(Z.mapId).round || Z.round;
                    list.push({ text: `MAP BEST: R${best}${Z.round >= 10 ? ' · EXFIL AVAILABLE' : ''}`, color: '#4ade80' });
                }
                if (BO.Net?.active && BO.Net.peers && BO.Net.peers.size > 0) {
                    list.push({ text: 'SQUAD ROLES: FRONT · MEDIC · DOORS', color: '#38bdf8' });
                }
                return list;
            };
        },

        /* ==================================================== 2. TOWER DEFENSE */
        getTdSynergies(td = BO.TowerDefenseMode) {
            if (!td || !td.active) return [];
            const ids = new Set();
            for (const d of (td.deployables || [])) if (d && d.id) ids.add(d.id);
            const hasDog = (td.dogs || []).some((k) => k && k.hp > 0);
            const hasTurret = (td.turrets || []).length > 0 || ids.has('turret');
            const out = [];
            if (hasDog && hasTurret) out.push({ id: 'pack', name: 'Pack Overwatch', desc: 'K9 + Sentry (+15% Turret cadence)', color: '#fbbf24' });
            if (ids.has('cryo_projector') && ids.has('tesla_coil')) out.push({ id: 'conduit', name: 'Shatter Conduit', desc: 'Cryo + Tesla (+20% Storm arc)', color: '#38bdf8' });
            if (ids.has('shield_gen') && ids.has('healing_fountain')) out.push({ id: 'bastion', name: 'Bastion Lock', desc: 'Regenerator + Med Station Keep aura', color: '#4ade80' });
            return out;
        },

        getTdNextWavePreview(wave = 1) {
            const nextW = Math.max(1, (wave || 0) + 1);
            const isBoss = nextW % 5 === 0;
            const hasBrutes = nextW >= 3;
            const tags = [];
            tags.push(isBoss ? 'BOSS SIEGE WAVE' : `WAVE ${nextW} ASSAULT`);
            if (nextW <= 2) tags.push('Fast Walkers & Shamblers');
            else if (isBoss) tags.push('Armored Boss + Mixed Escort');
            else if (hasBrutes) tags.push('Runners + Brutes + Acid Spitters');
            return tags.join(' · ');
        },

        _hookTD() {
            const TD = BO.TowerDefenseMode;
            if (!TD) return;
            const origHUD = TD.getHUDData ? TD.getHUDData.bind(TD) : null;
            if (origHUD) {
                TD.getHUDData = () => {
                    const data = origHUD();
                    if (!data) return data;
                    const syns = this.getTdSynergies(TD);
                    data.synergies = syns;
                    data.nextWavePreview = this.getTdNextWavePreview(TD.wave);
                    return data;
                };
            }
            const origInter = TD.getInteractPrompt ? TD.getInteractPrompt.bind(TD) : null;
            if (origInter) {
                TD.getInteractPrompt = () => {
                    const res = origInter();
                    if (res && TD.state === 'intermission') {
                        const syns = this.getTdSynergies(TD);
                        const synTxt = syns.length ? ` • SYNERGY: ${syns.map((s) => s.name).join(', ')}` : '';
                        res.text += ` | NEXT: ${this.getTdNextWavePreview(TD.wave)}${synTxt}`;
                    }
                    return res;
                };
            }
        },

        /* ==================================================== 3. MULTIPLAYER */
        getMpVoteOptions(excludeId) {
            const all = BO.MapsData?.listByMode?.('mp') || [];
            const pool = all.filter((m) => m.id !== excludeId);
            const list = pool.length >= 3 ? pool : all;
            const copy = list.slice();
            for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const t = copy[i]; copy[i] = copy[j]; copy[j] = t;
            }
            return copy.slice(0, 3);
        },

        applyMpPreset(presetId) {
            const p = MP_PRESETS[presetId];
            if (!p || !BO.MPMode) return null;
            Object.assign(BO.MPMode.customRules, p.rules);
            return p;
        },

        /* ==================================================== 4. SURVIVAL */
        _hookSurvival() {
            const SV = BO.SurvivalMode;
            if (!SV) return;
            const origStart = SV.start.bind(SV);
            const origUpdate = SV.update.bind(SV);
            SV.start = (camera, cfg) => {
                const scene = origStart(camera, cfg);
                this._svPhaseNotified = '';
                return scene;
            };
            SV.update = (dt) => {
                origUpdate(dt);
                if (!SV.active || !SV.campaign) return;
                const phase = SV.clock < 0.35 ? 'dawn' : (SV.clock > 0.68 ? 'night' : 'day');
                if (phase !== this._svPhaseNotified) {
                    this._svPhaseNotified = phase;
                    if (phase === 'night') {
                        BO.Events?.emit('hud:toast', { text: 'DUSK FALLS — Secure doors & light campfires before hostiles surge', color: '#f97316' });
                    } else if (phase === 'dawn' && SV.lastDay > 1) {
                        BO.Events?.emit('hud:toast', { text: `DAY ${SV.lastDay} DAWN — Resupply & fortify before dusk`, color: '#facc15' });
                    }
                }
            };
        },

        /* ==================================================== 5. ROGUE LITE */
        getRpgSynergies(run) {
            if (!run) return [];
            const boons = run.boons ? Array.from(run.boons) : [];
            const out = [];
            if (boons.length >= 2) out.push(`Boon Resonance (${boons.length} active)`);
            if ((run.reactions || 0) >= 8) out.push('Elemental Chain Surge (+Reaction momentum)');
            if (run.curse) out.push('Curse Pact (High-risk extraction multiplier)');
            if (!out.length) out.push('Foundational Delve (Collect relics & trigger Primer+Detonator combos)');
            return out;
        },

        _closestRpgUnlock(profileData) {
            const U = BO.RPGUnlocks;
            if (!U || !profileData) return null;
            let best = null, bestRatio = -1;
            for (const op of (U.OPERATIVES || [])) {
                const cur = U.value(profileData, op.metric) || 0;
                if (cur >= op.goal) continue;
                const ratio = cur / Math.max(1, op.goal);
                if (ratio > bestRatio) {
                    bestRatio = ratio;
                    best = { name: op.name, remaining: op.goal - cur, text: U.requirement(op) };
                }
            }
            return best;
        },

        _hookRPG() {
            const R = BO.RPGMode;
            if (R && R._enterFloor) {
                const origEnter = R._enterFloor.bind(R);
                R._enterFloor = () => {
                    origEnter();
                    if (R.run && R.run.floor % 5 === 0) {
                        const syn = this.getRpgSynergies(R.run);
                        BO.Events?.emit('hud:toast', { text: `GUARDIAN FLOOR ${R.run.floor} · ${syn[0]}`, color: '#fbbf24' });
                    }
                };
            }
            const UI = BO.RPGUI;
            if (UI && UI.showReport) {
                const origReport = UI.showReport.bind(UI);
                UI.showReport = (r) => {
                    origReport(r);
                    const modal = document.querySelector('#rpg-modal .rpg-modal-body, .rpg-modal-body');
                    if (!modal) return;
                    const syn = this.getRpgSynergies(BO.RPGMode?.run || r);
                    const nextOp = this._closestRpgUnlock(BO.RPGProfile?.data);
                    const tip = r.outcome === 'extract'
                        ? 'Banked haul increases upgrade headroom at the Haven Forge.'
                        : (r.reactions < 5 ? 'Tip: Pair Primer [Q] then Detonator [F] on targets for AoE reaction damage.' : 'Tip: Extract via Rest/Boss beacons whenever unbanked epics pile up.');
                    const box = document.createElement('div');
                    box.style.cssText = 'margin-top:12px;padding:10px 12px;border:1px solid rgba(255,178,63,.28);background:rgba(15,23,42,.55);border-radius:6px;font-size:12px;';
                    box.innerHTML = `<b style="color:#ffb23f;letter-spacing:.08em">EXPEDITION DEBRIEF</b>
                        <div style="margin-top:4px;color:#e2e8f0">Build Synergy: <b>${esc(syn.join(' · '))}</b></div>
                        <div style="margin-top:3px;color:#cbd5e1">${esc(tip)}</div>
                        ${nextOp ? `<div style="margin-top:4px;color:#4ade80">Closest Operative Unlock: <b>${esc(nextOp.name)}</b> — ${esc(nextOp.text)} (${nextOp.remaining} left)</div>` : ''}`;
                    const actions = modal.querySelector('.rpg-row-end');
                    if (actions) modal.insertBefore(box, actions);
                    else modal.appendChild(box);
                };
            }
        },

        /* ==================================================== 6. MINIGAMES */
        getDailyMinigame() {
            const MG = BO.Minigames;
            const dayKey = new Date().toISOString().slice(0, 10);
            const all = MG ? Array.from(MG.defs.values()).filter((d) => d.cat !== 'boss') : [];
            if (!all.length) return { date: dayKey, def: null, best: null };
            const idx = hashDate('BO-DAILY-' + dayKey) % all.length;
            const def = all[idx];
            const store = BO.Save?.data?.minigames?.daily || {};
            return { date: dayKey, def, best: store[dayKey] || null };
        },

        _hookMinigames() {
            const MG = BO.Minigames;
            if (!MG || !MG.finish) return;
            const origStart = MG.start.bind(MG);
            MG.start = (camera, opts = {}) => {
                const def = opts.def || (opts.id ? MG.get(opts.id) : MG.def);
                let prevScore = null;
                if (def && BO.Save?.data?.minigames?.best) {
                    const key = MG.bestKey(def, opts);
                    prevScore = BO.Save.data.minigames.best[key]?.score ?? null;
                }
                this._mgPrevBest = prevScore;
                this._mgIsDaily = !!opts.daily;
                return origStart(camera, opts);
            };

            const origFinish = MG.finish.bind(MG);
            MG.finish = (label, opts) => {
                const prev = this._mgPrevBest;
                origFinish(label, opts);
                const res = MG._lastRes;
                if (!res) return;
                // Record Daily Seed score if flagged
                if (this._mgIsDaily && BO.Save?.data?.minigames) {
                    const m = BO.Save.data.minigames;
                    m.daily = m.daily || {};
                    const dayKey = new Date().toISOString().slice(0, 10);
                    const curBest = m.daily[dayKey]?.score;
                    const better = res.timeScore ? (curBest == null || res.score < curBest) : (curBest == null || res.score > curBest);
                    if (better) {
                        m.daily[dayKey] = { id: MG.def?.id, score: res.score, stars: res.stars };
                        BO.Save.save?.();
                    }
                    BO.emitGameEvent?.('game:minigameDaily', { date: dayKey, score: res.score, stars: res.stars });
                }
                // Inject PB Ghost delta pill into #mg-results
                const card = document.querySelector('#mg-results .mg-res-best');
                if (card && prev != null && !card.dataset.ghostAdded) {
                    card.dataset.ghostAdded = '1';
                    const diff = res.score - prev;
                    const improved = res.timeScore ? diff < 0 : diff > 0;
                    const fmt = res.formatScore ? res.formatScore(Math.abs(diff)) : Math.abs(Math.round(diff)).toLocaleString();
                    const sign = diff === 0 ? '±0' : (diff > 0 ? '+' + fmt : '−' + fmt);
                    const col = improved ? '#4ade80' : (diff === 0 ? '#facc15' : '#f97316');
                    const span = document.createElement('span');
                    span.style.cssText = `display:inline-block;margin-left:10px;padding:2px 7px;border-radius:4px;border:1px solid ${col};color:${col};font-weight:700;font-size:11px;`;
                    span.textContent = `GHOST VS PB: ${sign}${this._mgIsDaily ? ' (DAILY +50% XP)' : ''}`;
                    card.appendChild(span);
                }
            };
        },

        /* ==================================================== 7. AAR OVERLAYS */
        _hookAAR() {
            if (!BO.Events) return;
            BO.Events.on('match:ended', (report) => {
                if (!report) return;
                if (report.mode === 'zombies' && BO.ZombiesMode) {
                    const recs = this._zRecords();
                    const id = BO.ZombiesMode.mapId;
                    const prev = recs[id] || { round: 0, kills: 0, exfils: 0 };
                    recs[id] = {
                        round: Math.max(prev.round || 0, report.round || 0),
                        kills: Math.max(prev.kills || 0, report.kills || 0),
                        exfils: (prev.exfils || 0) + (report.victory ? 1 : 0)
                    };
                    BO.Save?.save?.();
                }

                // Defer 1 microtask so MenuController.showAAR has written its DOM first
                setTimeout(() => this._enhanceAAR(report), 0);
            });
        },

        _enhanceAAR(report) {
            const statsEl = document.getElementById('aar-stats');
            const sbWrap = document.getElementById('aar-scoreboard');
            if (!statsEl || !sbWrap) return;

            if (report.mode === 'zombies' && BO.ZombiesMode) {
                const best = this.getZombiesBest(BO.ZombiesMode.mapId);
                const card = document.createElement('div');
                card.className = 'select-card';
                card.innerHTML = `<div class="card-head">MAP RECORD R${best.round}</div><div class="card-sub">Best Kills: ${best.kills} · Exfils: ${best.exfils}</div>`;
                statsEl.appendChild(card);
            } else if (report.mode === 'td' && BO.TowerDefenseMode) {
                const syns = this.getTdSynergies(BO.TowerDefenseMode);
                const card = document.createElement('div');
                card.className = 'select-card';
                card.innerHTML = `<div class="card-head">${syns.length} SYNERGIES</div><div class="card-sub">${syns.length ? esc(syns.map((s) => s.name).join(' · ')) : 'Combine K9+Sentry or Cryo+Tesla'}</div>`;
                statsEl.appendChild(card);
            } else if (report.mode === 'mp' && BO.MPMode) {
                const picks = this.getMpVoteOptions(BO.MPMode.mapId);
                const voteBox = document.createElement('div');
                voteBox.id = 'aar-map-vote';
                voteBox.style.cssText = 'margin-top:12px;padding:12px;border:1px solid rgba(255,178,63,.28);background:rgba(15,23,42,.65);border-radius:6px;';
                voteBox.innerHTML = `<div style="font-size:11px;letter-spacing:.12em;color:#ffb23f;margin-bottom:8px;font-weight:700;">NEXT MAP VOTE</div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        ${picks.map((m) => `<button type="button" class="btn btn-sm js-mp-vote" data-map="${esc(m.id)}">${esc(m.name)}</button>`).join('')}
                        <button type="button" class="btn btn-sm btn-primary" id="btn-aar-next-map" style="margin-left:auto;">PLAY NEXT MAP →</button>
                    </div>`;
                sbWrap.appendChild(voteBox);
                this.votedMapId = picks[0] ? picks[0].id : null;
                const btns = voteBox.querySelectorAll('.js-mp-vote');
                const syncActive = () => btns.forEach((b) => b.classList.toggle('btn-primary', b.dataset.map === this.votedMapId));
                syncActive();
                btns.forEach((b) => {
                    b.onclick = () => { BO.Sound?.playUIClick?.(); this.votedMapId = b.dataset.map; syncActive(); };
                });
                const go = voteBox.querySelector('#btn-aar-next-map');
                if (go) {
                    go.onclick = () => {
                        BO.Sound?.playUIClick?.();
                        if (BO.Menus) {
                            BO.Menus.selectedMap = this.votedMapId || BO.MPMode.mapId;
                            BO.Menus.onStartMatch?.({
                                mode: 'mp',
                                mapId: this.votedMapId || BO.MPMode.mapId,
                                gameType: BO.MPMode.modeType,
                                difficulty: BO.MPMode.difficulty
                            });
                        }
                    };
                }
            }
        }
    };

    BO.ModeDepth10 = Depth;
    Depth.init();
})(window);
