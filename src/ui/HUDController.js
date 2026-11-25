/* ============================================================================
   BLACKOUT OPS — In-Game HUD, Minimap Radar, Hitmarkers, Chalk Round & Scoreboard
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    const PERK_SHORT = {
        quick_revive: ['QR', '#38bdf8'],
        juggernog: ['JG', '#ef4444'],
        speed_cola: ['SC', '#22c55e'],
        double_tap: ['DT', '#f59e0b'],
        stamin_up: ['SU', '#eab308'],
        phd_flopper: ['PHD', '#a855f7'],
        deadshot: ['DD', '#ec4899'],
        mule_kick: ['MK', '#10b981'],
        electric_cherry: ['EC', '#06b6d4'],
        vulture_aid: ['VA', '#84cc16'],
        widows_wine: ['WW', '#cbd5e1'],
        elemental_pop: ['EP', '#f472b6'],
        golden_armor: ['AE', '#fde047'],
        eagle_eye: ['EE', '#60a5fa']
    };

    class HUDController {
        constructor() {
            this.hitmarkerTimer = 0;
            this.bannerTimer = 0;
            this.medalTimer = 0;
            this.toastTimer = 0;
            this.killfeedItems = [];
            this.fpsAccum = 0;
            this.fpsFrames = 0;
            this.lastFps = 60;
            this.scoreboardOpen = false;
            this._boundEvents = false;
        }

        init() {
            if (this._boundEvents) return;
            this._boundEvents = true;

            this.elHud = document.getElementById('hud-layer');
            this.elCh = document.getElementById('crosshair');
            this.elHitmarker = document.getElementById('hitmarker');
            this.elDmgVig = document.getElementById('damage-vignette');
            this.elFlash = document.getElementById('flash-overlay');
            this.elScope = document.getElementById('sniper-scope-overlay');
            this.elDmgArcs = document.getElementById('damage-arcs');
            this.elMinimap = document.getElementById('minimap-canvas');
            this.mmCtx = this.elMinimap ? this.elMinimap.getContext('2d') : null;
            this.elCompass = document.getElementById('hud-compass');
            this.elMpScore = document.getElementById('hud-mp-score');
            this.elZPowerUps = document.getElementById('hud-z-powerups');
            this.elFps = document.getElementById('hud-fps');
            this.elKillfeed = document.getElementById('killfeed');
            this.elBanner = document.getElementById('hud-banner');
            this.elMedal = document.getElementById('hud-medal');
            this.elPrompt = document.getElementById('hud-prompt');
            this.elToast = document.getElementById('hud-toast');
            this.elLockHint = document.getElementById('pointer-lock-hint');

            this.elZChalkRow = document.getElementById('hud-z-chalk-row');
            this.elRoundChalk = document.getElementById('hud-round-chalk');
            this.elPointsVal = document.getElementById('hud-points-val');
            this.elPointsPopups = document.getElementById('points-popups');
            this.elPerkTray = document.getElementById('hud-perk-tray');

            this.elPlates = [
                document.getElementById('plate-0'),
                document.getElementById('plate-1'),
                document.getElementById('plate-2')
            ];
            this.elHpFill = document.getElementById('hud-hp-fill');
            this.elHpText = document.getElementById('hud-hp-text');
            this.elTacBar = document.getElementById('hud-tac-bar');

            this.elKsDock = document.getElementById('hud-ks-dock');
            this.elWeaponName = document.getElementById('hud-weapon-name');
            this.elFireMode = document.getElementById('hud-fire-mode');
            this.elAmmoMag = document.getElementById('hud-ammo-mag');
            this.elAmmoRes = document.getElementById('hud-ammo-res');
            this.elLethalInfo = document.getElementById('hud-lethal');
            this.elTacticalInfo = document.getElementById('hud-tactical');
            this.elFieldInfo = document.getElementById('hud-field');
            this.elUltInfo = document.getElementById('hud-ult');
            this.elBossWrap = document.getElementById('boss-bar-wrap');
            this.elBossName = document.getElementById('boss-bar-name');
            this.elBossHp = document.getElementById('boss-bar-hp');
            this.elBossFill = document.getElementById('boss-bar-fill');
            this.elBossWeak = document.getElementById('boss-bar-weak');
            this.elScoreboardModal = document.getElementById('scoreboard-overlay');

            this.elBusterWrap = document.getElementById('hud-buster-charge');
            this.elBusterLbl = document.getElementById('buster-charge-label');
            this.elBusterFill = document.getElementById('buster-charge-fill');
            this.elTdStatus = document.getElementById('hud-td-status');
            this.elTdDirHints = document.getElementById('td-dir-hints');
            this.elEnemyTracker = document.getElementById('hud-enemy-tracker');
            this.elMultiBoss = document.getElementById('hud-multi-boss');
            this.elKillcam = document.getElementById('killcam-overlay');
            this.elKillcamTimer = document.getElementById('killcam-timer');
            this.elKillcamCard = document.getElementById('killcam-card');
            const skipBtn = document.getElementById('btn-skip-killcam');
            if (skipBtn) {
                skipBtn.onclick = () => {
                    if (BO.MPMode && BO.MPMode.skipKillcam) BO.MPMode.skipKillcam();
                };
            }

            BO.Events.on('hud:hitmarker', (d) => {
                this.hitmarkerTimer = 0.14;
                if (this.elHitmarker) {
                    this.elHitmarker.style.color = (d.isHeadshot || d.isKill) ? '#ef4444' : '#f8fafc';
                    this.elHitmarker.style.opacity = '1';
                    this.elHitmarker.style.transform = d.isKill ? 'scale(1.22)' : 'scale(1.0)';
                }
            });

            BO.Events.on('hud:banner', (b) => {
                this.bannerTimer = 3.2;
                if (this.elBanner) {
                    this.elBanner.classList.remove('hidden');
                    this.elBanner.querySelector('.banner-title').textContent = b.title || '';
                    this.elBanner.querySelector('.banner-title').style.color = b.color || '#f5a623';
                    this.elBanner.querySelector('.banner-sub').textContent = b.sub || '';
                }
            });

            BO.Events.on('hud:toast', (t) => {
                this.toastTimer = 2.6;
                if (this.elToast) {
                    this.elToast.classList.remove('hidden');
                    this.elToast.textContent = t.text;
                    this.elToast.style.color = t.color || '#f8fafc';
                }
            });

            BO.Events.on('progression:medal', (m) => {
                this.medalTimer = 2.6;
                if (this.elMedal) {
                    this.elMedal.classList.remove('hidden');
                    this.elMedal.innerHTML = `<div class="medal-chip" style="border-color:${m.color};color:${m.color}"><span>${m.icon}</span><span>${m.name.toUpperCase()}</span><span style="color:#94a3b8">+${m.xp} XP</span></div>`;
                }
            });

            BO.Events.on('progression:rankup', (r) => {
                BO.Events.emit('hud:banner', { title: `RANK UP! LEVEL ${r.level}`, sub: r.rankName.toUpperCase(), color: '#fde047' });
            });

            BO.Events.on('hud:killfeed', (k) => {
                this.killfeedItems.unshift({
                    html: `<span style="color:${k.isPlayerKiller ? '#f5a623' : '#94a3b8'}">${k.killer}</span> <span style="color:#64748b">[${k.weapon}${k.headshot ? ' ⌖' : ''}]</span> <span style="color:#f8fafc">${k.victim}</span>`,
                    timer: 5.0
                });
                if (this.killfeedItems.length > 5) this.killfeedItems.pop();
            });

            BO.Events.on('hud:points_popup', (p) => {
                if (!this.elPointsPopups) return;
                const div = document.createElement('div');
                div.className = 'pts-pop';
                div.textContent = '+' + p.amount;
                this.elPointsPopups.appendChild(div);
                setTimeout(() => { if (div.parentNode) div.parentNode.removeChild(div); }, 750);
            });
        }

        setVisible(visible) {
            if (!this.elHud) return;
            this.elHud.classList.toggle('hidden', !visible);
        }

        setScoreboardOpen(open) {
            this.scoreboardOpen = open;
            if (!this.elScoreboardModal) return;
            this.elScoreboardModal.classList.toggle('hidden', !open);
            if (open) this._renderScoreboard();
        }

        _renderScoreboard() {
            const body = document.getElementById('sb-body');
            const title = document.getElementById('sb-title');
            if (!body) return;
            if (BO.State.activeMode === 'mp') {
                const mp = BO.MPMode;
                title.textContent = `${BO.World.mapData.name} — ${mp.modeType.toUpperCase()} | SCORE ${mp.teamScores[0]} - ${mp.teamScores[1]}`;
                const rows = mp.getScoreboard();
                body.innerHTML = rows.map((r) => `
                    <tr class="${r.isPlayer ? 'sb-row-player' : ''}">
                        <td>${r.name}</td>
                        <td>${r.team === 0 ? '<span style="color:#38bdf8">ALLIES</span>' : '<span style="color:#ef4444">HOSTILES</span>'}</td>
                        <td>${r.kills}</td>
                        <td>${r.deaths}</td>
                        <td>${r.score}</td>
                    </tr>`).join('');
            } else if (BO.State.activeMode === 'td') {
                const td = BO.TowerDefenseMode;
                title.textContent = `${BO.World.mapData.name} — TOWER DEFENSE WAVE ${td.wave}`;
                const peerRows = [];
                if (BO.Net && BO.Net.active) {
                    for (const [pid, prof] of BO.Net.players.entries()) {
                        if (pid === BO.Net.myPeerId) continue;
                        peerRows.push(`
                            <tr>
                                <td>★ ${prof.callsign || 'FRIEND'}</td>
                                <td><span style="color:#38bdf8">CO-OP SQUAD</span></td>
                                <td>${prof.kills || 0}</td>
                                <td>${td.heartHp}/${td.heartMaxHp} HEART</td>
                                <td>${prof.score || 0} GOLD</td>
                            </tr>`);
                    }
                }
                body.innerHTML = `
                    <tr class="sb-row-player">
                        <td>${BO.Save.data.callsign || 'COMMANDER'} (YOU)</td>
                        <td><span style="color:#22c55e">DEFENDERS</span></td>
                        <td>${td.kills}</td>
                        <td>${td.heartHp}/${td.heartMaxHp} HEART</td>
                        <td>${td.gold} GOLD</td>
                    </tr>${peerRows.join('')}`;
            } else {
                const zm = BO.ZombiesMode;
                title.textContent = `${BO.World.mapData.name} — ZOMBIES ROUND ${BO.Math.toRoman(zm.round)}`;
                const peerRows = [];
                if (BO.Net && BO.Net.active) {
                    for (const [pid, prof] of BO.Net.players.entries()) {
                        if (pid === BO.Net.myPeerId) continue;
                        peerRows.push(`
                            <tr>
                                <td>★ ${prof.callsign || 'FRIEND'}</td>
                                <td><span style="color:#38bdf8">CO-OP SQUAD</span></td>
                                <td>${prof.kills || 0}</td>
                                <td>ALIVE</td>
                                <td>${prof.score || 0} PTS</td>
                            </tr>`);
                    }
                }
                body.innerHTML = `
                    <tr class="sb-row-player">
                        <td>${BO.Save.data.callsign || 'SURVIVOR'} (YOU)</td>
                        <td><span style="color:#dc2626">${BO.Net && BO.Net.active && BO.Net.players.size > 1 ? 'CO-OP SQUAD' : 'SOLO'}</span></td>
                        <td>${zm.kills}</td>
                        <td>${zm.headshots} HS</td>
                        <td>${zm.points} PTS</td>
                    </tr>${peerRows.join('')}`;
            }
        }

        update(dt) {
            if (!this.elHud || this.elHud.classList.contains('hidden')) return;

            const P = BO.Player;
            const mode = BO.State.activeMode;

            // FPS counter
            this.fpsFrames++;
            this.fpsAccum += dt;
            if (this.fpsAccum >= 0.4) {
                this.lastFps = Math.round(this.fpsFrames / this.fpsAccum);
                this.fpsFrames = 0;
                this.fpsAccum = 0;
                if (this.elFps) {
                    const show = BO.Settings.get('showFps');
                    this.elFps.classList.toggle('hidden', !show);
                    this.elFps.textContent = this.lastFps + ' FPS';
                }
            }

            // Timers
            if (this.hitmarkerTimer > 0) {
                this.hitmarkerTimer -= dt;
                if (this.hitmarkerTimer <= 0 && this.elHitmarker) this.elHitmarker.style.opacity = '0';
            }
            if (this.bannerTimer > 0) {
                this.bannerTimer -= dt;
                if (this.bannerTimer <= 0 && this.elBanner) this.elBanner.classList.add('hidden');
            }
            if (this.medalTimer > 0) {
                this.medalTimer -= dt;
                if (this.medalTimer <= 0 && this.elMedal) this.elMedal.classList.add('hidden');
            }
            if (this.toastTimer > 0) {
                this.toastTimer -= dt;
                if (this.toastTimer <= 0 && this.elToast) this.elToast.classList.add('hidden');
            }

            // Killfeed decay
            for (let i = this.killfeedItems.length - 1; i >= 0; i--) {
                this.killfeedItems[i].timer -= dt;
                if (this.killfeedItems[i].timer <= 0) this.killfeedItems.splice(i, 1);
            }
            if (this.elKillfeed) {
                this.elKillfeed.innerHTML = this.killfeedItems.map((k) => `<div class="kf-entry">${k.html}</div>`).join('');
            }

            // Pointer lock hint
            if (this.elLockHint) {
                const locked = !!document.pointerLockElement;
                this.elLockHint.classList.toggle('hidden', locked || BO.State.paused);
            }

            // Vignette & Flashbang
            if (this.elDmgVig) {
                const lowFrac = BO.Math.clamp(1 - P.hp / Math.max(1, P.maxHp), 0, 1);
                this.elDmgVig.style.opacity = String(lowFrac > 0.15 ? lowFrac * 0.9 : 0);
            }
            if (this.elFlash) {
                this.elFlash.style.opacity = String(BO.Math.clamp(P.flashBlindTimer / 1.5, 0, 0.95));
            }

            // Damage directional arcs
            if (this.elDmgArcs) {
                this.elDmgArcs.innerHTML = P.damageArcs.map((a) =>
                    `<div class="dmg-arc" style="transform:rotate(${a.angle}rad);opacity:${BO.Math.clamp(a.timer, 0, 1)}"></div>`
                ).join('');
            }

            const isKillcam = mode === 'mp' && BO.MPMode && BO.MPMode.killcamActive;
            if (this.elKillcam) {
                this.elKillcam.classList.toggle('hidden', !isKillcam);
                if (isKillcam && BO.MPMode.killcamData) {
                    const kd = BO.MPMode.killcamData;
                    const rem = Math.max(0, kd.endT - kd.playT);
                    const totalDur = Math.min(15.0, Math.max(1.0, kd.endT - kd.startT));
                    if (this.elKillcamTimer) {
                        this.elKillcamTimer.textContent = rem < 1.8 ? `SLOW-MO • ${rem.toFixed(1)}s` : `REPLAY ${rem.toFixed(1)}s / ${totalDur.toFixed(1)}s`;
                    }
                    if (this.elKillcamCard) {
                        this.elKillcamCard.innerHTML = `<span style="color:#38bdf8">${kd.meta.killerName}</span> <span style="color:#fde047">[${kd.meta.weaponLabel}${kd.meta.headshot ? ' • HEADSHOT' : ''}]</span> ➜ <span style="color:#ef4444">${kd.meta.victimName}</span>`;
                    }
                }
            }

            // Mega Buster Hold-to-Charge Bar
            if (this.elBusterWrap) {
                const charging = !isKillcam && !!(BO.Combat && BO.Combat.busterCharging && P.activeWeapon && P.activeWeapon.stats.magicType === 'megaman_plasma');
                this.elBusterWrap.classList.toggle('hidden', !charging);
                if (charging) {
                    const maxT = P.activeWeapon.stats.chargeMaxTime || 10.0;
                    const frac = BO.Math.clamp(BO.Combat.busterChargeTime / maxT, 0, 1);
                    const scaleX = (1 + frac * 9).toFixed(1);
                    if (this.elBusterFill) this.elBusterFill.style.width = Math.round(frac * 100) + '%';
                    if (this.elBusterLbl) {
                        this.elBusterLbl.textContent = frac >= 0.99
                            ? 'MEGA BUSTER • MAX 10.0x NOVA!'
                            : `MEGA BUSTER CHARGE • ${BO.Combat.busterChargeTime.toFixed(1)}s / 10.0s (${scaleX}x SIZE)`;
                    }
                }
            }

            // Crosshair spread & Sniper Scope (also mirrors winner's exact ADS/scope during player Killcam!)
            const w = P.activeWeapon;
            const playerKillcam = isKillcam && BO.MPMode && BO.MPMode.killcamData && BO.MPMode.killcamData.meta && BO.MPMode.killcamData.meta.killerKind === 'player';
            const allowFpvHud = !isKillcam || playerKillcam;
            const useScope = allowFpvHud && w && w.stats.useScopeOverlay && P.adsAlpha > 0.80;
            if (this.elScope) {
                this.elScope.classList.toggle('hidden', !useScope);
                const zRead = document.getElementById('scope-zoom-readout');
                if (zRead) {
                    if (useScope && w.stats.variableZoom) {
                        zRead.style.display = 'block';
                        zRead.textContent = `ZOOM: ${(P.scopeZoom || 4).toFixed(1)}x  •  [SCROLL / +/- : 1.0x – 20.0x]`;
                    } else {
                        zRead.style.display = 'none';
                    }
                }
            }
            if (this.elCh) {
                const showCh = allowFpvHud && P.adsAlpha < 0.55 && !useScope && BO.Settings.get('crosshairStyle') !== 'off';
                this.elCh.classList.toggle('hidden', !showCh);
                if (showCh && w) {
                    const col = BO.Settings.get('crosshairColor') || '#f8fafc';
                    const spd = Math.hypot(P.vel.x, P.vel.z);
                    const gap = Math.round(6 + w.stats.hipSpread * 340 + spd * 1.6 + P.recoilPitch * 120);
                    const ticks = this.elCh.children;
                    for (let i = 0; i < ticks.length; i++) ticks[i].style.background = col;
                    ticks[0].style.bottom = gap + 'px';
                    ticks[1].style.top = gap + 'px';
                    ticks[2].style.right = gap + 'px';
                    ticks[3].style.left = gap + 'px';
                }
            }

            // Compass
            if (this.elCompass) {
                const deg = Math.round(((-P.yaw * 180 / Math.PI) % 360 + 360) % 360);
                const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
                const label = dirs[Math.round(deg / 45) % 8];
                if (BO.State.activeMode === 'survival' && BO.SurvivalMode?.active && BO.SurvivalUI?.drawCompass) {
                    BO.SurvivalUI.drawCompass(this.elCompass, deg, label);
                } else {
                    if (this.elCompass.classList.contains('sv-compass')) { this.elCompass.classList.remove('sv-compass'); if (BO.SurvivalUI) BO.SurvivalUI._cmp = null; }
                    this.elCompass.textContent = `${label} • ${String(deg).padStart(3, '0')}°`;
                }
            }

            // Vitals (HP, Armor Plates, Tac Stamina)
            if (this.elHpFill) {
                this.elHpFill.style.width = BO.Math.clamp((P.hp / Math.max(1, P.maxHp)) * 100, 0, 100) + '%';
            }
            if (this.elHpText) {
                const vest = P.plateSlots;
                this.elHpText.textContent = vest
                    ? `${Math.ceil(P.hp)} / ${P.maxHp} HP  •  VEST ${vest.filter((s) => s && s.hp > 0).length}/3`
                    : `${Math.ceil(P.hp)} / ${P.maxHp} HP  •  ${P.armorReservePlates} PLATES [4]`;
            }
            for (let i = 0; i < 3; i++) {
                if (this.elPlates[i]) {
                    const slot = P.plateSlots ? P.plateSlots[i] : undefined;
                    const fill = slot !== undefined
                        ? (slot ? BO.Math.clamp(slot.hp / slot.max, 0, 1) * 100 : 0)
                        : BO.Math.clamp((P.armor - i * 50) / 50, 0, 1) * 100;
                    this.elPlates[i].style.width = fill + '%';
                    this.elPlates[i].style.background = slot ? slot.color : '';
                }
            }
            if (this.elTacBar) {
                this.elTacBar.style.width = Math.round(P.tacStamina * 100) + '%';
            }

            // Weapon & Gear
            const infAmmo = BO.Cheats && BO.Cheats.isActive('infammo');
            if (P.usingBareHands && P.survivalProp && BO.SurvivalMode?.campaign) {
                const prop = P.survivalProp;
                const pack = BO.SurvivalMode.campaign.pack;
                if (prop.kind === 'tool') {
                    const t = BO.SurvivalFrontierData.tools[prop.id];
                    const d = Math.ceil(pack.tools[prop.id] || 0);
                    if (this.elWeaponName) { this.elWeaponName.textContent = (t?.name || 'TOOL').toUpperCase(); this.elWeaponName.style.color = d > 0 ? '#9fe0c9' : '#ef6b6b'; }
                    if (this.elFireMode) this.elFireMode.textContent = 'TIER ' + (t?.level || 1) + ' ' + String(t?.family || '').toUpperCase() + ' · HOLD LMB TO SWING';
                    if (this.elAmmoMag) { this.elAmmoMag.textContent = String(d); this.elAmmoMag.style.color = d <= (t?.wear || 1) * 0.25 ? '#ef6b6b' : '#f8fafc'; }
                    if (this.elAmmoRes) this.elAmmoRes.textContent = '/ ' + (t?.wear || 0);
                } else {
                    const n = pack.inventory[prop.id] || 0;
                    if (this.elWeaponName) { this.elWeaponName.textContent = String(BO.SurvivalItemName(prop.id)).toUpperCase(); this.elWeaponName.style.color = '#9be3a6'; }
                    if (this.elFireMode) this.elFireMode.textContent = 'LMB TO USE · ' + BO.Settings.keyLabel(BO.Settings.getKeybinds().melee) + ' TO PUNCH';
                    if (this.elAmmoMag) { this.elAmmoMag.textContent = String(n); this.elAmmoMag.style.color = '#f8fafc'; }
                    if (this.elAmmoRes) this.elAmmoRes.textContent = 'LEFT';
                }
            } else if (P.usingBareHands) {
                const kbH = BO.Settings.getKeybinds();
                if (this.elWeaponName) {
                    this.elWeaponName.textContent = 'BARE HANDS';
                    this.elWeaponName.style.color = '#facc15';
                }
                if (this.elFireMode) this.elFireMode.textContent = 'RMB GUARD/PARRY · ' + BO.Settings.keyLabel(kbH.survDodge) + ' DODGE';
                if (this.elAmmoMag) {
                    this.elAmmoMag.textContent = P.parryFeedbackTimer > 0 ? 'PARRY!' : P.guardingWithHands ? 'GUARD' : (P.bareComboWindow > 0 ? `HIT ${P.bareComboStep + 1}` : 'FISTS');
                    this.elAmmoMag.style.color = P.parryFeedbackTimer > 0 ? '#facc15' : '#a6ddd0';
                }
                if (this.elAmmoRes) this.elAmmoRes.textContent = 'LMB PUNCH';
            } else if (w) {
                const isMeleeW = w.stats.kind === 'melee';
                if (this.elWeaponName) {
                    const mkTag = w.survivalMk > 1 ? ` Mk${w.survivalMk}` : '';
                    this.elWeaponName.textContent = w.stats.shortName + mkTag + (w.isPaP ? ' [PaP]' : '');
                    this.elWeaponName.style.color = w.isPaP ? '#c084fc' : (w.stats.kind === 'magic' ? '#38bdf8' : '#f8fafc');
                }
                if (this.elFireMode) this.elFireMode.textContent = (w.fireMode || 'auto').toUpperCase() + (w.stats.altFireMode ? ' [B]' : '');
                if (this.elAmmoMag) {
                    if (mode === 'survival' && !isMeleeW && BO.SurvivalMode?.jammed === w) {
                        this.elAmmoMag.textContent = 'JAM';
                        this.elAmmoMag.style.color = '#ef6b6b';
                    } else if (isMeleeW) {
                        this.elAmmoMag.textContent = 'BLADE';
                        this.elAmmoMag.style.color = '#f5a623';
                    } else if (infAmmo) {
                        this.elAmmoMag.textContent = 'INF';
                        this.elAmmoMag.style.color = '#22c55e';
                    } else {
                        this.elAmmoMag.textContent = P.reloading ? 'RLD' : String(w.mag);
                        this.elAmmoMag.style.color = w.mag <= Math.ceil(w.stats.magSize * 0.25) ? '#ef4444' : '#f8fafc';
                    }
                }
                if (this.elAmmoRes) {
                    this.elAmmoRes.textContent = (isMeleeW || infAmmo) ? '/ ∞' : ('/ ' + w.reserve);
                }
            }
            if (this.elLethalInfo) {
                const lName = (BO.AttachmentsData.LETHALS[P.lethalId]?.id || 'frag').toUpperCase().slice(0, 4);
                this.elLethalInfo.textContent = P.cookingFrag ? `COOK ${P.cookTimer.toFixed(1)}s` : `${lName} x${infAmmo ? '∞' : P.lethalCount}`;
            }
            if (this.elTacticalInfo) {
                const tName = (BO.AttachmentsData.TACTICALS[P.tacticalId]?.id || 'tac').toUpperCase().slice(0, 4);
                this.elTacticalInfo.textContent = `${tName} x${infAmmo ? '∞' : P.tacticalCount}`;
            }
            {
                const kbG = BO.Settings.getKeybinds();
                const gearKeys = [[this.elLethalInfo, kbG.lethal], [this.elTacticalInfo, kbG.tactical], [this.elFieldInfo, kbG.special], [this.elUltInfo, kbG.ultimate]];
                for (const [el, code] of gearKeys) {
                    const tag = el?.parentElement?.querySelector('span');
                    const text = '[' + BO.Settings.keyLabel(code) + ']';
                    if (tag && tag.textContent !== text) tag.textContent = text;
                }
                const hideSuper = mode === 'survival';
                this.elFieldInfo?.parentElement?.classList.toggle('hidden', hideSuper);
                this.elUltInfo?.parentElement?.classList.toggle('hidden', hideSuper);
            }
            if (this.elFieldInfo) {
                this.elFieldInfo.textContent = P.fieldActiveTimer > 0
                    ? `${P.fieldActiveTimer.toFixed(0)}s`
                    : (P.fieldCharge >= 1.0 ? 'READY' : Math.floor(P.fieldCharge * 100) + '%');
                this.elFieldInfo.style.color = P.fieldCharge >= 1.0 ? '#22c55e' : '#94a3b8';
            }
            if (this.elUltInfo) {
                this.elUltInfo.textContent = P.ultimateActiveTimer > 0
                    ? `${P.ultimateActiveTimer.toFixed(0)}s`
                    : (P.ultimateCharge >= 1.0 ? 'READY!' : Math.floor(P.ultimateCharge * 100) + '%');
                this.elUltInfo.style.color = P.ultimateCharge >= 1.0 ? '#fde047' : '#94a3b8';
            }

            // Mode-specific HUD
            if (this.elTdStatus) this.elTdStatus.classList.toggle('hidden', mode !== 'td');
            if (this.elTdDirHints && mode !== 'td') this.elTdDirHints.innerHTML = '';
            this._updateEnemyAndBossHUD(mode);
            if (mode === 'survival') {
                if (this.elZChalkRow) this.elZChalkRow.classList.add('hidden');
                if (this.elZPowerUps) this.elZPowerUps.innerHTML = '';
                if (this.elPerkTray) this.elPerkTray.innerHTML = '';
            } else if (mode === 'zombies') {
                const zm = BO.ZombiesMode;
                if (this.elZChalkRow) this.elZChalkRow.classList.remove('hidden');
                if (this.elMpScore) this.elMpScore.classList.add('hidden');
                if (this.elKsDock) this.elKsDock.classList.add('hidden');

                if (this.elRoundChalk) this.elRoundChalk.textContent = BO.Math.toRoman(zm.round);
                if (this.elPointsVal) this.elPointsVal.textContent = zm.points.toLocaleString('en-US');

                // Live Boss Health Bar (handled by multi-boss HUD)
                if (this.elBossWrap) this.elBossWrap.classList.add('hidden');

                if (this.elZPowerUps) {
                    const badges = [];
                    if (zm.instaKillTimer > 0) badges.push(`<div class="pu-badge" style="border-color:#facc15;color:#facc15">INSTA-KILL ${zm.instaKillTimer.toFixed(0)}s</div>`);
                    if (zm.doublePointsTimer > 0) badges.push(`<div class="pu-badge" style="border-color:#38bdf8;color:#38bdf8">2X POINTS ${zm.doublePointsTimer.toFixed(0)}s</div>`);
                    if (zm.fireSaleTimer > 0) badges.push(`<div class="pu-badge" style="border-color:#ec4899;color:#ec4899">FIRE SALE ${zm.fireSaleTimer.toFixed(0)}s</div>`);
                    if (zm.exfilActive) badges.push(`<div class="pu-badge" style="border-color:#22c55e;color:#22c55e">EXFIL ${zm.exfilTimer.toFixed(0)}s</div>`);
                    if (zm.getMapStatusBadges) {
                        for (const mb of zm.getMapStatusBadges()) {
                            badges.push(`<div class="pu-badge" style="border-color:${mb.color};color:${mb.color}">${mb.text}</div>`);
                        }
                    }
                    this.elZPowerUps.innerHTML = badges.join('');
                }

                if (this.elPerkTray) {
                    const icons = [];
                    P.zombiePerks.forEach((pk) => {
                        const soda = BO.ExpansionData.sodas.find((item) => item.id === pk);
                        const info = soda ? [soda.badge, soda.color] : (PERK_SHORT[pk] || [pk.slice(0, 2).toUpperCase(), '#f5a623']);
                        icons.push(`<div class="perk-icon" title="${soda?.name || info[0]}" style="color:${info[1]}">${info[0]}</div>`);
                    });
                    this.elPerkTray.innerHTML = icons.join('');
                }

                if (this.elPrompt) {
                    const pr = zm.getPromptText();
                    if (pr) {
                        this.elPrompt.classList.remove('hidden');
                        this.elPrompt.textContent = pr.text;
                        this.elPrompt.style.borderColor = pr.affordable ? '#f5a623' : '#ef4444';
                        this.elPrompt.style.color = pr.affordable ? '#f8fafc' : '#fca5a5';
                    } else {
                        this.elPrompt.classList.add('hidden');
                    }
                }
            } else if (mode === 'mp') {
                const mp = BO.MPMode;
                if (this.elZChalkRow) this.elZChalkRow.classList.add('hidden');
                if (this.elZPowerUps) this.elZPowerUps.innerHTML = '';
                if (this.elBossWrap) this.elBossWrap.classList.add('hidden');
                if (this.elPrompt) this.elPrompt.classList.add('hidden');
                if (this.elMpScore) {
                    this.elMpScore.classList.remove('hidden');
                    const objStr = mp.modeType === 'dom'
                        ? mp.domStates.map((d) => `<span style="color:${d.owner === 0 ? '#38bdf8' : (d.owner === 1 ? '#ef4444' : '#94a3b8')}">[${d.id}]</span>`).join(' ')
                        : (mp.modeType === 'hardpoint' ? `HP ${Math.ceil(mp.hpTimer)}s` : (mp.modeType === 'gun_game' ? `TIER ${mp.playerGunTier + 1}/16` : ''));
                    this.elMpScore.innerHTML = `
                        <span style="color:#38bdf8">${mp.modeType === 'ffa' ? mp.playerKills : mp.teamScores[0]}</span>
                        <span style="color:#94a3b8;font-size:12px">${BO.Math.formatTime(mp.timeRemaining)} ${objStr}</span>
                        <span style="color:#ef4444">${mp.modeType === 'ffa' ? Math.max(0, ...mp.bots.map((b) => b.kills)) : mp.teamScores[1]}</span>
                    `;
                }
                if (this.elPerkTray) {
                    this.elPerkTray.innerHTML = P.mpPerks.map((pid) => {
                        const pk = BO.AttachmentsData.PERKS[pid];
                        return pk ? `<div class="perk-icon" style="color:${pk.color}">${pk.name.slice(0, 2).toUpperCase()}</div>` : '';
                    }).join('');
                }
                if (this.elKsDock) {
                    this.elKsDock.classList.remove('hidden');
                    this.elKsDock.innerHTML = mp.equippedStreaks.map((ksId, idx) => {
                        const ready = mp.earnedStreaks.includes(ksId);
                        const ks = BO.AttachmentsData.KILLSTREAKS[ksId];
                        return `<div class="ks-slot ${ready ? 'ready' : ''}">[${5 + idx}] ${ks ? ks.name.toUpperCase() : ksId}</div>`;
                    }).join('');
                }
            } else if (mode === 'td') {
                const td = BO.TowerDefenseMode;
                if (this.elZChalkRow) this.elZChalkRow.classList.add('hidden');
                if (this.elZPowerUps) this.elZPowerUps.innerHTML = '';
                if (this.elBossWrap) this.elBossWrap.classList.add('hidden');
                if (this.elMpScore) this.elMpScore.classList.add('hidden');
                if (this.elKsDock) this.elKsDock.classList.add('hidden');

                if (this.elTdStatus) {
                    const phaseHtml = td.state === 'intermission'
                        ? `<span style="color:#22c55e;">INTERMISSION ${Math.ceil(td.intermissionTimer)}s • [T] SHOP • [N] SKIP</span>`
                        : `<span style="color:#f87171;">WAVE ${td.wave} • ${td.zombies.filter((z) => z.alive).length + td.remainingToSpawn} HOSTILES LEFT</span>`;
                    const heartPct = Math.round((td.heartHp / Math.max(1, td.heartMaxHp)) * 100);
                    const depCount = (td.deployables ? td.deployables.length : 0);
                    const hintCd = Math.max(0, Math.ceil(td.dirHintCooldown || 0));
                    const gongStr = td.overdriveTimer > 0 ? ` • ⚡ OVERDRIVE ${td.overdriveTimer.toFixed(0)}s` : '';
                    this.elTdStatus.innerHTML = `
                        <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:800;letter-spacing:1px;flex-wrap:wrap;gap:6px;">
                            <span>${phaseHtml}${gongStr}</span>
                            <span style="color:#fde047;">${td.gold} GOLD • 🛡 ${td.turrets.length} TUR • ⚙ ${depCount} DEP • 🐕 ${td.dogs.length} DOG • 🧟 RADAR ${hintCd}s</span>
                        </div>
                        <div class="td-layer-row">
                            ${td.layers.map((l) => {
                                const pct = Math.round((l.hp / Math.max(1, l.maxHp)) * 100);
                                const col = pct > 55 ? '#22c55e' : (pct > 25 ? '#f59e0b' : '#ef4444');
                                return `<div class="td-bar-card"><div>LAYER ${l.layer}: ${Math.ceil(l.hp)}/${l.maxHp}</div><div class="td-bar-bg"><div class="td-bar-fill" style="width:${pct}%;background:${col};"></div></div></div>`;
                            }).join('')}
                            <div class="td-bar-card" style="border-color:#38bdf8;">
                                <div style="color:#38bdf8;">CASTLE HEART: ${Math.ceil(td.heartHp)}/${td.heartMaxHp}</div>
                                <div class="td-bar-bg"><div class="td-bar-fill" style="width:${heartPct}%;background:#38bdf8;"></div></div>
                            </div>
                        </div>
                    `;
                }

                if (this.elPerkTray) {
                    const icons = [];
                    P.zombiePerks.forEach((pk) => {
                        const info = PERK_SHORT[pk] || [pk.slice(0, 2).toUpperCase(), '#f5a623'];
                        icons.push(`<div class="perk-icon" style="color:${info[1]};border-color:${info[1]}">${info[0]}</div>`);
                    });
                    if (icons.length > 0) {
                        icons.push(`<div style="font-size:10px;color:#94a3b8;align-self:center;margin-left:4px;">${P.zombiePerks.size}/8</div>`);
                    }
                    this.elPerkTray.innerHTML = icons.join('');
                }

                // Every 60s Quick Zombie Head Direction Hints (each zombie flashes its incoming direction!)
                if (this.elTdDirHints) {
                    if (td.dirHintActiveTimer > 0 && td.zombies && td.zombies.length > 0) {
                        const opacity = BO.Math.clamp(td.dirHintActiveTimer / 0.8, 0.25, 1.0);
                        const living = td.zombies.filter((z) => z.alive).slice(0, 24);
                        const cx = window.innerWidth * 0.5;
                        const cy = window.innerHeight * 0.5;
                        const rx = Math.min(window.innerWidth * 0.42, 420);
                        const ry = Math.min(window.innerHeight * 0.38, 280);
                        this.elTdDirHints.innerHTML = living.map((z) => {
                            const dx = z.pos.x - P.pos.x;
                            const dz = z.pos.z - P.pos.z;
                            const dist = Math.round(Math.hypot(dx, dz));
                            const worldAngle = Math.atan2(dx, dz);
                            const rel = BO.Math.wrapAngle(worldAngle - P.yaw + Math.PI);
                            const sx = cx + Math.sin(rel) * rx;
                            const sy = cy - Math.cos(rel) * ry;
                            const col = z.isBoss ? '#ef4444' : (z.isMagical ? '#c084fc' : (z.hasGun ? '#f59e0b' : '#4ade80'));
                            return `<div style="position:absolute;left:${sx.toFixed(0)}px;top:${sy.toFixed(0)}px;transform:translate(-50%,-50%);opacity:${opacity};text-align:center;filter:drop-shadow(0 0 6px ${col});">
                                <div style="font-size:18px;line-height:1;">${z.isBoss ? '💀' : '🧟'}</div>
                                <div style="font-size:9px;font-weight:800;color:${col};font-family:var(--font-mono);background:rgba(5,8,13,0.75);padding:1px 4px;border-radius:3px;">${dist}m</div>
                            </div>`;
                        }).join('');
                    } else {
                        this.elTdDirHints.innerHTML = '';
                    }
                }

                if (this.elPrompt) {
                    const pr = td.getPromptText();
                    if (pr) {
                        this.elPrompt.classList.remove('hidden');
                        this.elPrompt.textContent = pr.text;
                        this.elPrompt.style.borderColor = pr.affordable ? '#22c55e' : '#f5a623';
                        this.elPrompt.style.color = '#f8fafc';
                    } else {
                        this.elPrompt.classList.add('hidden');
                    }
                }
            }

            const hideSurvMap = mode === 'survival' && (
                !BO.SurvivalMode?.active ||
                BO.SurvivalMode.campaign?.has('sv_no_map_gps') ||
                BO.SurvivalMode.campaign?.has('sv_no_compass') ||
                BO.SurvivalMode.campaign?.has('sv_hide_hud')
            );
            if (this.elMinimap) this.elMinimap.classList.toggle('hidden', mode === 'survival' ? hideSurvMap : false);
            if (mode !== 'survival') this._drawMinimap();
            else if (!hideSurvMap) this._drawSurvivalMinimap();
            if (this.scoreboardOpen) this._renderScoreboard();
        }

        _updateEnemyAndBossHUD(mode) {
            const isWaveMode = (mode === 'td' || mode === 'zombies');
            if (!isWaveMode && mode !== 'survival') {
                if (this.elEnemyTracker) this.elEnemyTracker.classList.add('hidden');
                if (this.elMultiBoss) this.elMultiBoss.classList.add('hidden');
                return;
            }
            if (mode === 'survival') {
                if (this.elEnemyTracker) this.elEnemyTracker.classList.add('hidden');
                const sm = BO.SurvivalMode;
                const P = BO.Player;
                const survBosses = (sm && sm.active && sm.zombies)
                    ? sm.zombies.filter((z) => z && z.alive && (z.isBoss || z.isSuperBoss || z.bossLabel) && (!P || z.pos.distanceTo(P.pos) < 72))
                    : [];
                if (this.elMultiBoss) {
                    if (survBosses.length === 0) {
                        this.elMultiBoss.classList.add('hidden');
                        this.elMultiBoss.innerHTML = '';
                    } else {
                        this.elMultiBoss.classList.remove('hidden');
                        this.elMultiBoss.style.display = 'grid';
                        this.elMultiBoss.style.gridTemplateColumns = survBosses.length >= 2 ? 'repeat(2, minmax(0, 1fr))' : '1fr';
                        this.elMultiBoss.style.gap = '6px';
                        this.elMultiBoss.style.width = survBosses.length >= 2 ? 'min(640px, 90vw)' : 'min(560px, 86vw)';
                        this.elMultiBoss.innerHTML = survBosses.slice(0, 4).map((b) => {
                            const pct = BO.Math.clamp((b.hp / Math.max(1, b.maxHp)) * 100, 0, 100);
                            const isSuper = !!b.isSuperBoss;
                            const label = b.bossLabel || b.spec?.name || 'APEX BOSS';
                            const tags = `${b.wardTimer > 0 ? ' • 🛡 WARD' : ''}${b.superEnraged ? ' • 🔥 PHASE II' : ''}`;
                            return `
                                <div style="background:rgba(15,5,10,0.90);border:1px solid ${isSuper ? '#fbbf24' : '#ef4444'};border-radius:6px;padding:5px 9px;box-shadow:0 0 16px ${isSuper ? 'rgba(251,191,36,0.34)' : 'rgba(239,68,68,0.28)'};min-width:0;">
                                    <div style="display:flex;justify-content:space-between;gap:6px;font-size:11px;font-weight:800;letter-spacing:0.6px;margin-bottom:3px;white-space:nowrap;overflow:hidden;">
                                        <span style="color:${isSuper ? '#fde047' : '#fca5a5'};overflow:hidden;text-overflow:ellipsis;">${isSuper ? '👑 SUPER BOSS • ' : '☠ '}${label}${tags}</span>
                                        <span style="color:#fef08a;flex-shrink:0;">${Math.ceil(b.hp)}/${b.maxHp}</span>
                                    </div>
                                    <div style="height:${isSuper ? '9px' : '8px'};background:rgba(255,255,255,0.12);border-radius:4px;overflow:hidden">
                                        <div style="height:100%;width:${pct}%;background:${isSuper ? 'linear-gradient(90deg,#f59e0b,#ef4444,#fde047)' : 'linear-gradient(90deg,#dc2626,#f97316)'};transition:width 0.1s"></div>
                                    </div>
                                </div>
                            `;
                        }).join('');
                    }
                }
                return;
            }
            const src = mode === 'td' ? BO.TowerDefenseMode : BO.ZombiesMode;
            const list = (src && src.zombies) ? src.zombies : [];
            const living = [];
            const bosses = [];
            const counts = new Map();
            for (let i = 0; i < list.length; i++) {
                const z = list[i];
                if (!z || !z.alive) continue;
                living.push(z);
                if (z.isBoss) bosses.push(z);
                const key = z.spec ? z.spec.name : 'Hostile';
                counts.set(key, (counts.get(key) || 0) + 1);
            }
            const rem = Math.max(0, src ? (src.remainingToSpawn || 0) : 0);
            const totalLeft = living.length + rem;

            if (this.elEnemyTracker) {
                this.elEnemyTracker.classList.remove('hidden');
                const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
                const top = entries.slice(0, 10).map(([name, c]) =>
                    `<span style="display:inline-block;margin:1px 3px 1px 0;padding:1px 5px;border-radius:3px;background:rgba(15,23,42,0.85);border:1px solid rgba(148,163,184,0.28);color:#e2e8f0;font-size:10px"><b>${c}x</b> ${name}</span>`
                );
                if (entries.length > 10) {
                    top.push(`<span style="color:#94a3b8;font-size:10px">+${entries.length - 10} more</span>`);
                }
                const listHtml = top.length > 0 ? top.join('') : '<span style="color:#64748b;font-size:10px">No active hostiles on field</span>';
                this.elEnemyTracker.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:4px">
                        <span style="color:#f87171;font-weight:800;letter-spacing:1px;font-size:11px">ENEMIES: ${totalLeft} LEFT</span>
                        <span style="color:#94a3b8;font-size:10px">${living.length} ON FIELD • ${rem} QUEUED</span>
                    </div>
                    <div style="display:flex;flex-wrap:wrap;gap:2px">${listHtml}</div>
                `;
            }

            if (this.elMultiBoss) {
                if (bosses.length === 0) {
                    this.elMultiBoss.classList.add('hidden');
                    this.elMultiBoss.innerHTML = '';
                } else {
                    this.elMultiBoss.classList.remove('hidden');
                    // Side-by-side half-width bars whenever 2+ bosses are active!
                    const isMulti = bosses.length >= 2;
                    this.elMultiBoss.style.display = 'grid';
                    this.elMultiBoss.style.gridTemplateColumns = isMulti ? 'repeat(2, minmax(0, 1fr))' : '1fr';
                    this.elMultiBoss.style.gap = '6px';
                    this.elMultiBoss.style.width = isMulti ? 'min(640px, 90vw)' : 'min(560px, 86vw)';
                    this.elMultiBoss.innerHTML = bosses.slice(0, 6).map((b) => {
                        const pct = BO.Math.clamp((b.hp / Math.max(1, b.maxHp)) * 100, 0, 100);
                        const isSuper = !!b.isSuperBoss;
                        const tags = `${b.wardTimer > 0 ? ' • 🛡 WARD' : ''}${b.superEnraged ? ' • 🔥 PHASE II' : ''}`;
                        return `
                            <div style="background:rgba(15,5,10,0.90);border:1px solid ${isSuper ? '#fbbf24' : '#ef4444'};border-radius:6px;padding:${isMulti ? '4px 7px' : '5px 9px'};box-shadow:0 0 15px ${isSuper ? 'rgba(251,191,36,0.34)' : 'rgba(239,68,68,0.28)'};min-width:0;">
                                <div style="display:flex;justify-content:space-between;gap:6px;font-size:${isMulti ? '10px' : '11px'};font-weight:800;letter-spacing:0.6px;margin-bottom:3px;white-space:nowrap;overflow:hidden;">
                                    <span style="color:${isSuper ? '#fde047' : '#fca5a5'};overflow:hidden;text-overflow:ellipsis;">${isSuper ? '👑 SUPER BOSS • ' : '☠ '}${b.spec.name}${!isMulti && b.spec.title ? ' — ' + b.spec.title.toUpperCase() : ''}${tags}</span>
                                    <span style="color:#fef08a;flex-shrink:0;">${Math.ceil(b.hp)}/${b.maxHp}</span>
                                </div>
                                <div style="height:${isMulti ? '7px' : (isSuper ? '9px' : '8px')};background:rgba(255,255,255,0.12);border-radius:4px;overflow:hidden">
                                    <div style="height:100%;width:${pct}%;background:${isSuper ? 'linear-gradient(90deg,#f59e0b,#ef4444,#fde047)' : 'linear-gradient(90deg,#dc2626,#f97316)'};transition:width 0.1s"></div>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            }
        }

        _drawMinimap() {
            const ctx = this.mmCtx;
            if (!ctx || !BO.World.mapData) return;
            const W = 148, H = 148, CX = 74, CY = 74;
            const scale = BO.State.activeMode === 'td' ? 0.65 : 2.6;
            const P = BO.Player;

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = 'rgba(8, 12, 18, 0.9)';
            ctx.fillRect(0, 0, W, H);

            ctx.save();
            ctx.translate(CX, CY);
            ctx.rotate(P.yaw);

            // Map Architecture Boxes
            ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
            const boxes = BO.World.mapData.boxes;
            for (let i = 0; i < boxes.length; i++) {
                const b = boxes[i];
                if (b.h < 0.8 || b.y > 4.2) continue;
                const rx = (b.x - P.pos.x) * scale;
                const rz = (b.z - P.pos.z) * scale;
                const rw = b.w * scale;
                const rd = b.d * scale;
                ctx.fillRect(rx - rw * 0.5, rz - rd * 0.5, rw, rd);
            }

            if (BO.State.activeMode === 'zombies') {
                // Mystery Box, Power, Pack-a-Punch
                const mb = BO.World.mysteryBoxObj;
                if (mb) {
                    ctx.fillStyle = '#facc15';
                    ctx.fillRect((mb.x - P.pos.x) * scale - 3, (mb.z - P.pos.z) * scale - 3, 6, 6);
                }
                if (BO.World.mapData.packAPunch) {
                    const pap = BO.World.mapData.packAPunch;
                    ctx.fillStyle = '#c084fc';
                    ctx.fillRect((pap.x - P.pos.x) * scale - 3, (pap.z - P.pos.z) * scale - 3, 6, 6);
                }
                ctx.fillStyle = '#ef4444';
                for (const z of BO.ZombiesMode.zombies) {
                    if (!z.alive) continue;
                    ctx.beginPath();
                    ctx.arc((z.pos.x - P.pos.x) * scale, (z.pos.z - P.pos.z) * scale, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (BO.State.activeMode === 'mp') {
                const mp = BO.MPMode;
                const radarOn = !!(mp.customRules && mp.customRules.alwaysRadar);
                for (const b of mp.bots) {
                    if (!b.alive) continue;
                    const isAlly = mp.modeType !== 'ffa' && mp.modeType !== 'gun_game' && b.team === 0;
                    if (!isAlly && !radarOn && mp.uavTimer <= 0 && b.fireTimer <= 0 && b.pos.distanceTo(P.pos) > 14) continue;
                    ctx.fillStyle = isAlly ? '#38bdf8' : '#ef4444';
                    ctx.beginPath();
                    ctx.arc((b.pos.x - P.pos.x) * scale, (b.pos.z - P.pos.z) * scale, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (BO.State.activeMode === 'td') {
                const td = BO.TowerDefenseMode;
                if (td.heartObj) {
                    ctx.fillStyle = '#38bdf8';
                    ctx.fillRect((td.heartObj.x - P.pos.x) * scale - 4, (td.heartObj.z - P.pos.z) * scale - 4, 8, 8);
                }
                if (td.shopkeeperObj) {
                    ctx.fillStyle = '#fde047';
                    ctx.fillRect((td.shopkeeperObj.x - P.pos.x) * scale - 3, (td.shopkeeperObj.z - P.pos.z) * scale - 3, 6, 6);
                }
                ctx.fillStyle = '#22c55e';
                for (const d of td.dogs) {
                    ctx.beginPath(); ctx.arc((d.pos.x - P.pos.x) * scale, (d.pos.z - P.pos.z) * scale, 3, 0, Math.PI * 2); ctx.fill();
                }
                ctx.fillStyle = '#ef4444';
                for (const z of td.zombies) {
                    if (!z.alive) continue;
                    ctx.beginPath(); ctx.arc((z.pos.x - P.pos.x) * scale, (z.pos.z - P.pos.z) * scale, 2.6, 0, Math.PI * 2); ctx.fill();
                }
            }

            // Draw Online Squadmates / Remote Players on Minimap Radar
            if (BO.Net && BO.Net.active) {
                const isFFA = BO.State.activeMode === 'mp' && (BO.MPMode.modeType === 'ffa' || BO.MPMode.modeType === 'gun_game');
                for (const [pid, st] of BO.Net.remoteStates.entries()) {
                    if (pid === BO.Net.myPeerId || !st) continue;
                    const isEnemy = BO.State.activeMode === 'mp' && (isFFA || (st.team !== undefined && st.team !== BO.Net.myTeam));
                    ctx.fillStyle = (!st.alive || st.inLastStand) ? '#f59e0b' : (isEnemy ? '#ef4444' : '#22c55e');
                    ctx.beginPath();
                    ctx.arc((st.x - P.pos.x) * scale, (st.z - P.pos.z) * scale, 4.0, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();

            // Player center chevron
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.moveTo(CX, CY - 6);
            ctx.lineTo(CX + 5, CY + 5);
            ctx.lineTo(CX - 5, CY + 5);
            ctx.closePath();
            ctx.fill();
        }

        _drawSurvivalMinimap() {
            const ctx = this.mmCtx;
            const sm = BO.SurvivalMode;
            const Z = BO.Zone;
            if (!ctx || !sm?.active || !Z) return;
            const W = 148, H = 148, CX = 74, CY = 74;
            const P = BO.Player;
            const inDgn = !!(BO.ZoneDungeons?.inside || BO.ZoneLegends?.arena);
            const scale = inDgn ? 2.1 : 1.05;

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = inDgn ? 'rgba(12, 10, 18, 0.92)' : 'rgba(9, 15, 13, 0.90)';
            ctx.fillRect(0, 0, W, H);

            ctx.strokeStyle = 'rgba(143, 227, 200, 0.12)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(CX, CY, 44, 0, Math.PI * 2); ctx.stroke();

            ctx.save();
            ctx.translate(CX, CY);
            ctx.rotate(P.yaw);

            if (!inDgn) {
                ctx.strokeStyle = 'rgba(195, 185, 160, 0.28)';
                for (const rd of Z.roads || []) {
                    ctx.lineWidth = Math.max(1.5, (rd.w || 5) * scale * 0.65);
                    ctx.beginPath();
                    let started = false;
                    for (const [rx, rz] of rd.pts || []) {
                        const dx = (rx - P.pos.x) * scale, dz = (rz - P.pos.z) * scale;
                        if (!started) { ctx.moveTo(dx, dz); started = true; }
                        else ctx.lineTo(dx, dz);
                    }
                    ctx.stroke();
                }
                ctx.fillStyle = 'rgba(148, 175, 165, 0.30)';
                for (const poi of Z.pois || []) {
                    if (!poi.w || Math.abs(poi.x - P.pos.x) > 95 || Math.abs(poi.z - P.pos.z) > 95) continue;
                    const rx = (poi.x - P.pos.x) * scale, rz = (poi.z - P.pos.z) * scale;
                    const rw = poi.w * scale, rd = poi.d * scale;
                    ctx.fillRect(rx - rw * 0.5, rz - rd * 0.5, rw, rd);
                }
                ctx.fillStyle = '#8fe3c8';
                for (const b of sm.campaign?.placed || []) {
                    if (!b.alive || Math.abs(b.x - P.pos.x) > 85 || Math.abs(b.z - P.pos.z) > 85) continue;
                    ctx.fillRect((b.x - P.pos.x) * scale - 2, (b.z - P.pos.z) * scale - 2, 4, 4);
                }
                for (const mk of sm.markers || []) {
                    if (mk.alive === false || Math.abs(mk.x - P.pos.x) > 80 || Math.abs(mk.z - P.pos.z) > 80) continue;
                    if (mk.dungeon) {
                        ctx.fillStyle = '#c084fc';
                        ctx.fillRect((mk.x - P.pos.x) * scale - 2.5, (mk.z - P.pos.z) * scale - 2.5, 5, 5);
                    } else if (mk.id?.startsWith('bag:body')) {
                        ctx.fillStyle = '#f87171';
                        ctx.beginPath(); ctx.arc((mk.x - P.pos.x) * scale, (mk.z - P.pos.z) * scale, 3.5, 0, Math.PI * 2); ctx.fill();
                    }
                }
                ctx.fillStyle = 'rgba(163, 230, 53, 0.75)';
                for (const a of BO.ZoneWild?.animals || []) {
                    if (!a.alive || a.pos.distanceTo(P.pos) > 55) continue;
                    ctx.beginPath(); ctx.arc((a.pos.x - P.pos.x) * scale, (a.pos.z - P.pos.z) * scale, 2, 0, Math.PI * 2); ctx.fill();
                }
                const wp = BO.SurvivalUI?.mapWaypoint;
                if (wp) {
                    ctx.strokeStyle = 'rgba(126, 232, 250, 0.65)';
                    ctx.lineWidth = 1.4;
                    ctx.setLineDash([4, 4]);
                    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo((wp.x - P.pos.x) * scale, (wp.z - P.pos.z) * scale); ctx.stroke();
                    ctx.setLineDash([]);
                }
            } else {
                const sp = BO.ZoneDungeons?.inside?.sp || BO.ZoneLegends?.arena?.sp;
                ctx.fillStyle = 'rgba(192, 132, 252, 0.28)';
                for (const c of sp?.colliders || []) {
                    if (!c.active || (c.maxY - c.minY) < 1.0) continue;
                    const cx = ((c.minX + c.maxX) * 0.5 - P.pos.x) * scale;
                    const cz = ((c.minZ + c.maxZ) * 0.5 - P.pos.z) * scale;
                    ctx.fillRect(cx - (c.maxX - c.minX) * scale * 0.5, cz - (c.maxZ - c.minZ) * scale * 0.5, (c.maxX - c.minX) * scale, (c.maxZ - c.minZ) * scale);
                }
            }

            const comp = BO.ZoneCompanions?.comp;
            if (comp && comp.alive) {
                ctx.fillStyle = comp.downed > 0 ? '#facc15' : '#2dd4bf';
                ctx.beginPath(); ctx.arc((comp.pos.x - P.pos.x) * scale, (comp.pos.z - P.pos.z) * scale, 3.2, 0, Math.PI * 2); ctx.fill();
            }

            for (const z of sm.zombies || []) {
                if (!z.alive) continue;
                const d = z.pos.distanceTo(P.pos);
                if (d > 68) continue;
                if (!inDgn && d > 24 && z.zs?.state !== 'hunt' && !z.bossLabel && !z.champ) continue;
                ctx.fillStyle = z.bossLabel ? '#f43f5e' : z.champ ? '#fb923c' : '#ef4444';
                ctx.beginPath(); ctx.arc((z.pos.x - P.pos.x) * scale, (z.pos.z - P.pos.z) * scale, z.bossLabel ? 4 : 2.5, 0, Math.PI * 2); ctx.fill();
            }
            for (const b of sm.bots || []) {
                if (!b.alive || b.team === 0 || b.pos.distanceTo(P.pos) > 65) continue;
                ctx.fillStyle = '#f59e0b';
                ctx.beginPath(); ctx.arc((b.pos.x - P.pos.x) * scale, (b.pos.z - P.pos.z) * scale, 2.8, 0, Math.PI * 2); ctx.fill();
            }

            ctx.restore();

            ctx.fillStyle = '#f2b45a';
            ctx.beginPath();
            ctx.moveTo(CX, CY - 5.5);
            ctx.lineTo(CX - 4.2, CY + 4.5);
            ctx.lineTo(CX, CY + 2.2);
            ctx.lineTo(CX + 4.2, CY + 4.5);
            ctx.closePath();
            ctx.fill();
        }
    }

    BO.HUD = new HUDController();
})(window);
