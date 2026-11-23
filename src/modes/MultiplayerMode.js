/* ============================================================================
   BLACKOUT OPS — Offline & Online Multiplayer, Custom Games & 15s MW2 Winner Killcam
   Supports TDM, FFA, Domination, Hardpoint, Gun Game + full Custom Game
   settings (enemy count, team size limit, enemy no-weapons/restrictions,
   custom kills/time/player HP/enemy HP, fun & serious modifiers), anti-cluster
   spawning, Epic Multi-Kill Announcer, Mid-Battle Class Change, & 15s Killcam.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    const GUN_GAME_LADDER = [
        'm1911', 'deagle', 'mp5', 'p90', 'ump45',
        'r870', 'aa12', 'm4a1', 'ak47', 'scarh',
        'm16a4', 'm249', 'rpd', 'mk14', 'intervention', 'raygun'
    ];

    const WEAPON_POOLS = {
        all: ['m4a1', 'mp5', 'ak47', 'scarh', 'ump45', 'p90', 'r870', 'm249', 'mk14', 'acr_68', 'famas_f1', 'galil_ar'],
        pistols: ['m1911', 'deagle', 'gold_deagle_cod4', 'five_seven', 'b23r_burst', 'python_magnum'],
        snipers: ['m40a3_cod4', 'r700_cod4', 'intervention', 'msr_remington', 'l96a1_awm', 'barrett_50cal'],
        shotguns: ['r870', 'm1014_cod4', 'model_1887_mw2', 'spas12_tac', 'aa12'],
        smgs: ['mp5', 'ump45', 'p90', 'mp7_navy', 'vector_kriss', 'aks74u'],
        ar: ['m4a1', 'ak47', 'acr_68', 'scarh', 'famas_f1', 'galil_ar', 'fal_osw'],
        melee: ['combat_knife', 'katana_carbon', 'tomahawk_axe', 'sledge_hammer'],
        rpg: ['rpg7_warhead'],
        raygun: ['raygun']
    };

    const DEFAULT_CUSTOM_RULES = {
        enemyCount: 6,
        teamSizeLimit: 6,
        enemyWeaponMode: 'all',
        playerWeaponMode: 'custom',
        scoreLimit: 0,
        timeLimit: 0,
        enemyHp: 100,
        playerHp: 100,
        respawnDelay: 2.4,
        headshotsOnly: false,
        oneShotKills: false,
        unlimitedAmmo: false,
        explosiveRounds: false,
        bigHeads: false,
        alwaysRadar: false,
        killstreaksEnabled: true,
        gravityScale: 1.0,
        speedScale: 1.0,
        jumpScale: 1.0,
        killcamEnabled: true
    };

    class MultiplayerMode {
        constructor() {
            this.active = false;
            this.modeType = 'tdm';
            this.mapId = 'killhouse';
            this.difficulty = 'regular';
            this.customRules = Object.assign({}, DEFAULT_CUSTOM_RULES);
            this.bots = [];

            this.teamScores = [0, 0];
            this.scoreLimit = 50;
            this.timeRemaining = 480;
            this.elapsed = 0;

            this.playerKills = 0;
            this.playerDeaths = 0;
            this.playerHeadshots = 0;
            this.playerScore = 0;
            this.currentStreak = 0;
            this.multikillCount = 0;
            this.multikillTimer = 0;
            this.playerGunTier = 0;
            this.respawnTimer = 0;
            this.pendingClassIndex = null;
            this.ended = false;

            this.equippedStreaks = ['uav', 'predator', 'chopper'];
            this.earnedStreaks = [];
            this.uavTimer = 0;
            this.nukeTimer = -1;

            this.domStates = [];
            this.domTickTimer = 0;
            this.hpIndex = 0;
            this.hpTimer = 45;
            this.hpOwner = -1;
            this.hpTickTimer = 0;
            this.chopperFireCooldown = 0.5;

            this.recentSpawnTimes = new Map();

            this.camera = null;
            this.kcFrames = [];
            this.kcPendingFx = [];
            this.kcAccum = 0;
            this.lastKillMeta = null;
            this.killcamPendingEnd = null;
            this.killcamActive = false;
            this.killcamData = null;
            this.playerAvatar3P = null;
        }

        getDefaultCustomRules() {
            return Object.assign({}, DEFAULT_CUSTOM_RULES, { mods: {}, startProtocol: 'custom' });
        }

        _applyModsAndProtocol() {
            if (!BO.Mods) return;
            const cr = this.customRules || {};
            if (cr.startProtocol && cr.startProtocol !== 'custom' && (!cr.playerWeaponMode || cr.playerWeaponMode === 'custom')) {
                BO.Mods.applyStartProtocol(cr.startProtocol, 'mp');
            }
            BO.Mods.applyPlayerStart(cr.mods || {}, 'mp');
        }

        start(opts) {
            this.active = true;
            this.modeType = opts.modeType || 'tdm';
            this.mapId = opts.mapId || 'killhouse';
            this.difficulty = opts.difficulty || 'regular';
            this.customRules = Object.assign({}, DEFAULT_CUSTOM_RULES, opts.customRules || {});
            this.camera = opts.camera || null;

            const scene = BO.World.build(this.mapId);
            const map = BO.World.mapData;
            const loadout = BO.Loadout.getActiveClass();

            this.bots = [];
            this.teamScores = [0, 0];
            this.elapsed = 0;
            this.playerKills = 0;
            this.playerDeaths = 0;
            this.playerHeadshots = 0;
            this.playerScore = 0;
            this.currentStreak = 0;
            this.multikillCount = 0;
            this.multikillTimer = 0;
            this.playerGunTier = 0;
            this.respawnTimer = 0;
            this.pendingClassIndex = null;
            this.ended = false;

            this.equippedStreaks = loadout.killstreaks ? loadout.killstreaks.slice() : ['uav', 'predator', 'chopper'];
            this.earnedStreaks = [];
            this.uavTimer = 0;
            this.nukeTimer = -1;
            this.recentSpawnTimes.clear();

            this.kcFrames = [];
            this.kcPendingFx = [];
            this.kcAccum = 0;
            this.lastKillMeta = null;
            this.killcamPendingEnd = null;
            this.killcamActive = false;
            this.killcamData = null;
            this.playerAvatar3P = BO.CharacterMesh.buildSoldier(0, null);
            this.playerAvatar3P.root.visible = false;
            if (BO.World.scene) BO.World.scene.add(this.playerAvatar3P.root);

            if (this.modeType === 'tdm') { this.scoreLimit = 50; this.timeRemaining = 480; }
            else if (this.modeType === 'ffa') { this.scoreLimit = 30; this.timeRemaining = 480; }
            else if (this.modeType === 'dom') { this.scoreLimit = 150; this.timeRemaining = 600; }
            else if (this.modeType === 'hardpoint') { this.scoreLimit = 150; this.timeRemaining = 540; }
            else if (this.modeType === 'gun_game') { this.scoreLimit = GUN_GAME_LADDER.length; this.timeRemaining = 480; }

            if (this.customRules.scoreLimit > 0 && this.modeType !== 'gun_game') {
                this.scoreLimit = Math.max(1, Math.min(500, Math.round(this.customRules.scoreLimit)));
            }
            if (this.customRules.timeLimit > 0) {
                this.timeRemaining = Math.max(60, Math.min(3600, Math.round(this.customRules.timeLimit * 60)));
            }

            const myTeam = (BO.Net && BO.Net.active) ? BO.Net.myTeam : 0;
            const spawnList = myTeam === 1 && map.team1Spawns && map.team1Spawns.length > 0 ? map.team1Spawns : map.team0Spawns;
            const playerSpawn = spawnList[Math.floor(Math.random() * spawnList.length)] || map.team0Spawns[0];
            BO.Player.initForMatch('mp', playerSpawn, loadout, false);
            this._applyPlayerCustomRules();
            this._applyModsAndProtocol();

            BO.Combat.reset(opts.camera);
            BO.Combat.onHitEnemy = (ent, dmg, hitbox, dist, w, pt, dir) => this._onPlayerHitBot(ent, dmg, hitbox, w, pt);
            BO.Combat.onExplodeAt = (pos, rad, dmg, owner, isFlash, stunDur, wid) => this._onExplode(pos, rad, dmg, isFlash, stunDur, wid);
            BO.Combat.onActivateKillstreak = (ksId) => this.activateStreak(ksId);

            this._spawnBots(map);
            this._setupObjectives(map);

            BO.Progression.recordStat('mpMatches', 1);
            BO.Events.emit('mp:started', { modeType: this.modeType, mapName: map.name });
            return scene;
        }

        _applyPlayerCustomRules() {
            const r = this.customRules;
            const php = Math.max(1, Math.min(1000, Number(r.playerHp) || 100));
            BO.Player.maxHp = php;
            BO.Player.hp = php;

            if (this.modeType === 'gun_game') {
                BO.Player.weapons = [BO.Player._createWeaponInstance({ id: GUN_GAME_LADDER[this.playerGunTier], camo: 'default', attachments: {} }, false)];
                BO.Player.activeSlot = 0;
                BO.Player.rebuildViewmodel();
            } else if (r.playerWeaponMode && r.playerWeaponMode !== 'custom') {
                const pool = WEAPON_POOLS[r.playerWeaponMode] || WEAPON_POOLS.all;
                const wId = pool[0];
                const spec = BO.WeaponsData.get(wId);
                BO.Player.weapons = [BO.Player._createWeaponInstance({
                    id: wId, camo: 'default',
                    attachments: { optic: spec.modelSpec?.defaultScope ? 'sniper_scope' : 'iron', muzzle: 'none', underbarrel: 'none', magazine: 'std_mag', stock: 'std_stock' }
                }, false)];
                BO.Player.activeSlot = 0;
                BO.Player.rebuildViewmodel();
            }
        }

        queueClassChange(classIdx) {
            this.pendingClassIndex = BO.Math.clamp(classIdx, 0, 9);
            BO.Loadout.setSelectedClassIndex(this.pendingClassIndex);
            const cls = BO.Loadout.getClass(this.pendingClassIndex);
            BO.Events.emit('hud:toast', {
                text: `NEXT SPAWN CLASS: ${cls.name} (${BO.WeaponsData.get(cls.primary.id).shortName})`,
                color: '#38bdf8'
            });
        }

        stop() {
            this.active = false;
            this.killcamPendingEnd = null;
            this.killcamActive = false;
            this.killcamData = null;
            for (const b of this.bots) b.destroy();
            this.bots = [];
            if (this.playerAvatar3P && this.playerAvatar3P.root && BO.World.scene) {
                BO.World.scene.remove(this.playerAvatar3P.root);
            }
            this.playerAvatar3P = null;
            this.kcFrames = [];
        }

        _spawnBots(map) {
            const r = this.customRules;
            const isFFA = this.modeType === 'ffa' || this.modeType === 'gun_game';
            const enemyCount = BO.Math.clamp(parseInt(r.enemyCount, 10) || (isFFA ? 7 : 6), 1, 18);
            const teamCap = BO.Math.clamp(parseInt(r.teamSizeLimit, 10) || 6, 1, 12);
            const allyCount = isFFA ? 0 : Math.max(0, Math.min(teamCap - 1, Math.min(enemyCount, 11)));
            const ePool = WEAPON_POOLS[r.enemyWeaponMode] || WEAPON_POOLS.all;
            const enemyUnarmed = r.enemyWeaponMode === 'unarmed';
            const eHp = Math.max(1, Math.min(1000, Number(r.enemyHp) || 100));

            let botId = 0;
            for (let a = 0; a < allyCount; a++) {
                const sp = this._pickBestSpawn(0);
                const wId = isFFA && this.modeType === 'gun_game' ? GUN_GAME_LADDER[0] : WEAPON_POOLS.all[a % WEAPON_POOLS.all.length];
                const bot = new BO.BotAI({
                    id: botId++,
                    team: 0,
                    difficulty: this.difficulty,
                    weaponId: wId,
                    unarmed: false,
                    maxHp: r.playerHp || 100,
                    speedScale: r.speedScale || 1.0,
                    bigHeads: !!r.bigHeads,
                    respawnDelay: r.respawnDelay ?? 2.4,
                    oneShotKills: !!r.oneShotKills,
                    x: sp.x, y: sp.y || 0, z: sp.z, yaw: sp.yaw || 0
                });
                this.bots.push(bot);
            }

            for (let e = 0; e < enemyCount; e++) {
                const team = isFFA ? (e + 2) : 1;
                const sp = this._pickBestSpawn(1);
                const wId = (isFFA && this.modeType === 'gun_game') ? GUN_GAME_LADDER[0] : ePool[e % ePool.length];
                const bot = new BO.BotAI({
                    id: botId++,
                    team,
                    difficulty: this.difficulty,
                    weaponId: wId,
                    unarmed: enemyUnarmed,
                    maxHp: eHp,
                    speedScale: r.speedScale || 1.0,
                    bigHeads: !!r.bigHeads,
                    respawnDelay: r.respawnDelay ?? 2.4,
                    oneShotKills: !!r.oneShotKills,
                    x: sp.x, y: sp.y || 0, z: sp.z, yaw: sp.yaw || 0
                });
                this.bots.push(bot);
            }
        }

        _setupObjectives(map) {
            this.domStates = (map.domFlags || []).map((f) => ({
                id: f.id, x: f.x, y: f.y, z: f.z, owner: -1, progress: 0
            }));
            this.hpIndex = 0;
            this.hpTimer = 45;
            if (BO.World.hardpointRing && map.hardpoints && map.hardpoints.length > 0) {
                const hp = map.hardpoints[0];
                BO.World.hardpointRing.visible = this.modeType === 'hardpoint';
                BO.World.hardpointRing.position.set(hp.x, hp.y + 0.08, hp.z);
            }
        }

        _pickBestSpawn(team) {
            const map = BO.World.mapData;
            const isFFA = this.modeType === 'ffa' || this.modeType === 'gun_game';
            const baseList = isFFA
                ? map.team0Spawns.concat(map.team1Spawns)
                : (team === 0 ? map.team0Spawns : map.team1Spawns);
            const fallbackList = map.team0Spawns.concat(map.team1Spawns);
            const candidates = baseList.length > 0 ? baseList : fallbackList;

            const now = this.elapsed;
            let bestSp = candidates[0];
            let bestScore = -Infinity;

            for (let i = 0; i < candidates.length; i++) {
                const sp = candidates[i];
                const key = `${sp.x.toFixed(1)}_${sp.z.toFixed(1)}`;
                const lastUsed = this.recentSpawnTimes.get(key);
                const cooldownPenalty = (lastUsed !== undefined && (now - lastUsed) < 2.2) ? -60 : 0;

                let minEnemyDist = 999;
                let minAnyDist = 999;
                let losExposed = false;

                if (BO.Player.alive) {
                    const dp = BO.Math.dist3D(sp.x, sp.y || 0, sp.z, BO.Player.pos.x, BO.Player.pos.y, BO.Player.pos.z);
                    minAnyDist = Math.min(minAnyDist, dp);
                    if (isFFA || team !== 0) {
                        minEnemyDist = Math.min(minEnemyDist, dp);
                        if (dp < 22 && BO.World.hasLineOfSight(sp.x, (sp.y || 0) + 1.4, sp.z, BO.Player.pos.x, BO.Player.pos.y + 1.4, BO.Player.pos.z)) {
                            losExposed = true;
                        }
                    }
                }

                for (let b = 0; b < this.bots.length; b++) {
                    const bot = this.bots[b];
                    if (!bot.alive) continue;
                    const db = BO.Math.dist3D(sp.x, sp.y || 0, sp.z, bot.pos.x, bot.pos.y, bot.pos.z);
                    minAnyDist = Math.min(minAnyDist, db);
                    const isHostile = isFFA || (bot.team !== team);
                    if (isHostile) {
                        minEnemyDist = Math.min(minEnemyDist, db);
                        if (db < 18 && BO.World.hasLineOfSight(sp.x, (sp.y || 0) + 1.4, sp.z, bot.pos.x, bot.pos.y + 1.4, bot.pos.z)) {
                            losExposed = true;
                        }
                    }
                }

                const clusterPenalty = minAnyDist < 2.8 ? -200 : (minAnyDist < 5.5 ? -30 : 0);
                const score = Math.min(minEnemyDist, 32) * 2.2 + Math.min(minAnyDist, 14) * 1.4
                    + (losExposed ? -28 : 12) + cooldownPenalty + clusterPenalty + Math.random() * 1.5;

                if (score > bestScore) {
                    bestScore = score;
                    bestSp = sp;
                }
            }

            this.recentSpawnTimes.set(`${bestSp.x.toFixed(1)}_${bestSp.z.toFixed(1)}`, now);
            return bestSp;
        }

        _onPlayerHitBot(bot, dmg, hitbox, weaponInst, hitPt) {
            if (!bot || !bot.alive) return false;
            const myTeam = (BO.Net && BO.Net.active) ? BO.Net.myTeam : 0;
            const isFFA = this.modeType === 'ffa' || this.modeType === 'gun_game';
            const isHead = hitbox === 'head';
            if (this.customRules.headshotsOnly && !isHead) return false;

            let finalDmg = this.customRules.oneShotKills ? 9999 : dmg;
            if (BO.Mods && this.customRules.mods) {
                finalDmg = BO.Mods.outgoingDamage(this.customRules.mods, finalDmg, { hitbox, weaponInst, target: null });
                if (finalDmg <= 0) return false;
            }
            if (this.customRules.explosiveRounds && hitPt) {
                BO.FX.spawnExplosion(hitPt, 2.8, 0xf97316);
                BO.Sound.playExplosion(0.45);
                finalDmg *= 1.5;
            }
            const wName = weaponInst?.stats?.shortName || 'MELEE';

            if (bot.isRemotePlayer && BO.Net && BO.Net.active) {
                BO.Net.broadcast({
                    type: 'mp_hit_player',
                    targetPeerId: bot.peerId,
                    dmg: finalDmg,
                    attackerCallsign: BO.Save.data.callsign || 'YOU',
                    attackerTeam: myTeam,
                    weaponLabel: wName,
                    weaponId: weaponInst?.cfg?.id || null,
                    isHead
                });
                BO.Player.addUltimateCharge(4);
                return false;
            }

            if (!isFFA && bot.team === myTeam) return false;

            if (BO.Net && BO.Net.active && !BO.Net.isHost) {
                BO.Net.sendToHost({
                    type: 'mp_hit_bot',
                    botId: bot.id,
                    dmg: finalDmg,
                    attackerCallsign: BO.Save.data.callsign || 'YOU',
                    attackerTeam: myTeam,
                    weaponLabel: wName,
                    isHead
                });
            }

            const killed = bot.takeDamage(finalDmg, 'player');
            if (!killed) {
                BO.Player.addUltimateCharge(3);
                return false;
            }

            this._awardPlayerKill(bot, isHead, wName, weaponInst?.cfg?.id || null);
            return true;
        }

        _awardPlayerKill(bot, isHead, weaponLabel, weaponId) {
            const kMods = (this.customRules && this.customRules.mods) || {};
            if (BO.Mods) BO.Mods.onKill(kMods, null, {});
            if (kMods.vampirePlayer && BO.Player.alive) BO.Player.hp = Math.min(BO.Player.maxHp, BO.Player.hp + 15);
            this.playerKills++;
            this.currentStreak++;
            this.playerScore += isHead ? 125 : 100;

            if (!this.killcamPendingEnd) {
                this.lastKillMeta = {
                    killerKind: 'player',
                    killerBotId: null,
                    killerName: BO.Save.data.callsign || 'YOU',
                    victimName: bot.name,
                    weaponLabel,
                    headshot: isHead,
                    killTime: this.elapsed
                };
            }

            if (isHead) {
                this.playerHeadshots++;
                BO.Progression.recordStat('mpHeadshots', 1);
                BO.Progression.awardMedal('headshot');
            }
            BO.Progression.recordStat('mpKills', 1);
            BO.Progression.recordStat('mpScore', 100);
            if (weaponId) BO.Progression.grantWeaponKill(weaponId, isHead, 120);
            BO.Progression.grantPlayerXP(isHead ? 150 : 110);
            BO.Player.addUltimateCharge(22);

            if (BO.Player.mpPerks.includes('quick_fix')) BO.Player.regenDelayTimer = 0;
            if (BO.Player.mpPerks.includes('scavenger')) {
                const w = BO.Player.activeWeapon;
                if (w) w.reserve = Math.min(w.stats.reserveMax, w.reserve + w.stats.magSize);
            }
            if (BO.Player.pos.distanceTo(bot.pos) < 4.0) BO.Progression.awardMedal('point_blank');
            else if (BO.Player.pos.distanceTo(bot.pos) > 32.0) BO.Progression.awardMedal('longshot');
            if (BO.Player.sliding) BO.Progression.awardMedal('slide_kill');

            this.multikillCount++;
            this.multikillTimer = 4.5;
            if (this.multikillCount === 2) {
                BO.Progression.awardMedal('double_kill');
                BO.Sound.playMultikillVoice(2);
                BO.Events.emit('hud:banner', { title: 'DOUBLE KILL!', sub: `2X RAPID ELIMINATION • ${weaponLabel}`, color: '#fde047' });
            } else if (this.multikillCount === 3) {
                BO.Progression.awardMedal('triple_kill');
                BO.Sound.playMultikillVoice(3);
                BO.Events.emit('hud:banner', { title: 'TRIPLE KILL!', sub: `3X MULTIKILL • ${weaponLabel}`, color: '#f97316' });
            } else if (this.multikillCount === 4) {
                BO.Progression.awardMedal('fury_kill');
                BO.Sound.playMultikillVoice(4);
                BO.Events.emit('hud:banner', { title: 'QUAD KILL!', sub: `4X UNSTOPPABLE FURY • ${weaponLabel}`, color: '#ef4444' });
            } else if (this.multikillCount >= 5) {
                BO.Progression.awardMedal('frenzy_kill');
                BO.Sound.playMultikillVoice(this.multikillCount);
                BO.Events.emit('hud:banner', { title: `${this.multikillCount}X MEGA KILL!`, sub: 'TOTAL DOMINATION!', color: '#c084fc' });
            }

            if (this.currentStreak === 5) BO.Progression.awardMedal('bloodthirsty');
            else if (this.currentStreak === 10) BO.Progression.awardMedal('merciless');
            else if (this.currentStreak === 15) BO.Progression.awardMedal('ruthless');

            if (this.customRules.killstreaksEnabled !== false) {
                const hardline = BO.Player.mpPerks.includes('hardline') ? 1 : 0;
                for (const ksId of this.equippedStreaks) {
                    const ks = BO.AttachmentsData.KILLSTREAKS[ksId];
                    if (ks && this.currentStreak === Math.max(2, ks.kills - hardline)) {
                        if (!this.earnedStreaks.includes(ksId)) {
                            this.earnedStreaks.push(ksId);
                            BO.Sound.playKillstreakReady();
                            BO.Events.emit('hud:banner', { title: ks.name.toUpperCase() + ' READY!', sub: `PRESS [${5 + this.equippedStreaks.indexOf(ksId)}] TO DEPLOY`, color: '#f5a623' });
                        }
                    }
                }
            }

            if (this.modeType === 'tdm') this.teamScores[0]++;
            if (this.modeType === 'gun_game') {
                this.playerGunTier++;
                if (this.playerGunTier < GUN_GAME_LADDER.length) {
                    const nextW = GUN_GAME_LADDER[this.playerGunTier];
                    BO.Player.weapons = [BO.Player._createWeaponInstance({ id: nextW, camo: 'gold', attachments: {} }, false)];
                    BO.Player.activeSlot = 0;
                    BO.Player.rebuildViewmodel();
                    BO.Events.emit('hud:toast', { text: 'PROMOTED: ' + BO.WeaponsData.get(nextW).shortName, color: '#f5a623' });
                } else {
                    this._queueWinnerKillcam(true);
                }
            }

            BO.Events.emit('hud:killfeed', {
                killer: BO.Save.data.callsign || 'YOU',
                victim: bot.name,
                weapon: weaponLabel,
                isPlayerKiller: true,
                headshot: isHead
            });
        }

        _onExplode(pos, rad, dmg, isFlash, stunDur, wid) {
            const isFFA = this.modeType === 'ffa' || this.modeType === 'gun_game';
            let hits = 0;
            for (const b of this.bots) {
                if (!b.alive) continue;
                if (!isFFA && b.team === 0) continue;
                const d = b.pos.distanceTo(pos);
                if (d <= rad) {
                    if (isFlash || wid === 'cryo_nova') {
                        b.stunTimer = Math.max(b.stunTimer, stunDur || 5.0);
                    } else {
                        const killed = b.takeDamage(dmg * (1 - (d / rad) * 0.5), 'player');
                        if (killed) this._awardPlayerKill(b, false, 'EXPLOSIVE', null);
                    }
                    hits++;
                }
            }
            if (hits > 0) BO.Events.emit('hud:hitmarker', { isHeadshot: false, isKill: true });
        }

        activateStreak(slotIdxOrId) {
            if (this.customRules.killstreaksEnabled === false) return false;
            let ksId = typeof slotIdxOrId === 'number' ? this.equippedStreaks[slotIdxOrId] : slotIdxOrId;
            const qIdx = this.earnedStreaks.indexOf(ksId);
            if (qIdx === -1) return false;
            this.earnedStreaks.splice(qIdx, 1);

            BO.Progression.recordStat('mpKillstreaksCalled', 1);
            const ks = BO.AttachmentsData.KILLSTREAKS[ksId];
            BO.Sound.playKillstreakReady();
            BO.Events.emit('hud:banner', { title: ks.name.toUpperCase() + ' DEPLOYED', sub: 'TACTICAL SUPPORT INBOUND', color: '#38bdf8' });

            if (ksId === 'uav') {
                this.uavTimer = 25;
            } else if (ksId === 'care_package') {
                BO.Player.refillAllAmmo();
                BO.Player.armor = BO.Player.maxArmor;
                BO.Player.armorReservePlates = 3;
                if (!this.earnedStreaks.includes('chopper')) this.earnedStreaks.push('chopper');
                BO.Events.emit('hud:toast', { text: 'CARE PACKAGE: ARMOR, AMMO & CHOPPER GRANTED!', color: '#f5a623' });
            } else if (ksId === 'predator') {
                const center = BO.Player.pos.clone().add(new THREE.Vector3(-Math.sin(BO.Player.yaw) * 14, 0, -Math.cos(BO.Player.yaw) * 14));
                BO.FX.spawnExplosion(center, 9.5, 0xff5500);
                BO.Sound.playExplosion(1.0);
                this._onExplode(center, 11.0, 350, false, 0);
            } else if (ksId === 'chopper') {
                BO.FX.spawnChopper(0, 0, 30);
            } else if (ksId === 'juggernaut') {
                BO.Player.isJuggernaut = true;
                BO.Player.juggernautTimer = 40;
                BO.Player.maxHp = 350;
                BO.Player.hp = 350;
                BO.Player.armor = BO.Player.maxArmor;
            } else if (ksId === 'nuke') {
                this.nukeTimer = 8.0;
                BO.Sound.playNukeSiren();
                BO.Events.emit('hud:banner', { title: 'TACTICAL NUKE INBOUND', sub: 'IMPACT IN 8 SECONDS', color: '#ef4444' });
            }
            return true;
        }

        recordKillcamFx(fx) {
            if (!this.active || this.ended || this.killcamActive) return;
            this.kcPendingFx.push(fx);
        }

        _recordReplaySnapshot(dt) {
            if (this.killcamActive || this.customRules.killcamEnabled === false) return;
            this.kcAccum += dt;
            if (this.kcAccum < 0.04) return;
            this.kcAccum = 0;

            const P = BO.Player;
            const botsSnap = {};
            for (let i = 0; i < this.bots.length; i++) {
                const b = this.bots[i];
                botsSnap[b.id] = { x: b.pos.x, y: b.pos.y, z: b.pos.z, yaw: b.yaw, alive: b.alive, phase: b.animPhase };
            }
            const curWeaponId = (P.activeWeapon && P.activeWeapon.cfg) ? P.activeWeapon.cfg.id : null;
            const reloadFrac = P.reloading ? (1 - (P.reloadTimer / Math.max(0.01, P.reloadDuration))) : 0;
            this.kcFrames.push({
                t: this.elapsed,
                p: {
                    x: P.pos.x,
                    y: P.pos.y + P.eyeHeight,
                    z: P.pos.z,
                    yaw: P.yaw,
                    pitch: P.pitch,
                    alive: P.alive,
                    adsAlpha: P.adsAlpha || 0,
                    fov: this.camera ? this.camera.fov : (BO.Settings.get('fov') || 90),
                    recoilZ: P.recoilZ || 0,
                    recoilPitch: P.recoilPitch || 0,
                    swayX: P.swayX || 0,
                    swayY: P.swayY || 0,
                    bobPhase: P.bobPhase || 0,
                    horizSpeed: Math.hypot(P.vel.x, P.vel.z),
                    tacSprinting: !!P.tacSprinting,
                    sliding: !!P.sliding,
                    reloading: !!P.reloading,
                    reloadFrac,
                    weaponId: curWeaponId
                },
                bots: botsSnap,
                fx: this.kcPendingFx.splice(0, this.kcPendingFx.length)
            });
            if (this.kcFrames.length > 480) {
                this.kcFrames.shift();
            }
        }

        _queueWinnerKillcam(victory, customTitle = null) {
            if (this.killcamPendingEnd || this.killcamActive || this.ended) return;
            if (this.customRules.killcamEnabled === false || !this.lastKillMeta) {
                this._endMatch(victory, customTitle);
                return;
            }
            this.killcamPendingEnd = { victory, customTitle, timer: 1.6 };
            BO.Events.emit('hud:banner', {
                title: victory ? 'VICTORY!' : 'MATCH OVER',
                sub: 'FINAL KILLCAM INCOMING...',
                color: victory ? '#22c55e' : '#ef4444'
            });
        }

        _startWinnerKillcamOrEnd(victory, customTitle = null) {
            if (this.killcamActive || this.ended) return;
            this.killcamPendingEnd = null;
            if (this.customRules.killcamEnabled === false || !this.lastKillMeta || this.kcFrames.length < 4) {
                this._endMatch(victory, customTitle);
                return;
            }
            this.kcAccum = 1;
            this._recordReplaySnapshot(0.05);

            const endT = this.kcFrames[this.kcFrames.length - 1].t;
            const startT = Math.max(this.kcFrames[0].t, endT - 15.0);
            const clipFrames = this.kcFrames.filter((f) => f.t >= startT);
            if (clipFrames.length < 3) {
                this._endMatch(victory, customTitle);
                return;
            }

            if (BO.App && BO.App._clearInputState) BO.App._clearInputState();
            BO.Sound.playKillcamStart();

            this.killcamActive = true;
            this.killcamData = {
                victory,
                customTitle,
                meta: this.lastKillMeta,
                frames: clipFrames,
                startT: clipFrames[0].t,
                endT: clipFrames[clipFrames.length - 1].t,
                killT: this.lastKillMeta.killTime || endT,
                playT: clipFrames[0].t,
                emittedFxIdx: -1
            };
        }

        skipKillcam() {
            if (!this.killcamActive || !this.killcamData) return;
            const d = this.killcamData;
            this.killcamActive = false;
            this.killcamData = null;
            if (this.playerAvatar3P) this.playerAvatar3P.root.visible = false;
            BO.Player.vmAnchor.visible = true;
            BO.Player.adsAlpha = 0;
            if (this.camera) {
                this.camera.fov = BO.Settings.get('fov') || 90;
                this.camera.updateProjectionMatrix();
            }
            this._endMatch(d.victory, d.customTitle);
        }

        _updateKillcam(dt) {
            const kd = this.killcamData;
            if (!kd || !this.camera) return;

            const nearShot = Math.abs(kd.playT - kd.killT) < 0.85 || (kd.endT - kd.playT) < 1.6;
            const playbackRate = nearShot ? 0.42 : 1.0;
            kd.playT += dt * playbackRate;

            if (kd.playT >= kd.endT + 0.35) {
                this.skipKillcam();
                return;
            }

            const frames = kd.frames;
            let idx = 0;
            while (idx < frames.length - 2 && frames[idx + 1].t < kd.playT) idx++;
            const f0 = frames[idx];
            const f1 = frames[Math.min(frames.length - 1, idx + 1)];
            const alpha = (f1.t > f0.t) ? BO.Math.clamp((kd.playT - f0.t) / (f1.t - f0.t), 0, 1) : 0;

            while (kd.emittedFxIdx < idx) {
                kd.emittedFxIdx++;
                const fxs = frames[kd.emittedFxIdx].fx || [];
                for (const fx of fxs) {
                    if (fx.kind === 'tracer') {
                        BO.FX.spawnTracer(new THREE.Vector3(fx.sx, fx.sy, fx.sz), new THREE.Vector3(fx.ex, fx.ey, fx.ez), fx.color || 0xffd166, 0.025, 0.09);
                    } else if (fx.kind === 'shot' && kd.meta.killerKind === 'player') {
                        BO.Player.triggerMuzzleFlash();
                        BO.Sound.playGunshot(fx.soundProfile || 'ar_light', !!fx.suppressed, !!fx.isPaP, 0.85);
                    } else if (fx.kind === 'hitmarker' && kd.meta.killerKind === 'player') {
                        BO.Sound.playHitmarker(!!fx.isHeadshot, !!fx.isKill);
                        BO.Events.emit('hud:hitmarker', { isHeadshot: !!fx.isHeadshot, isKill: !!fx.isKill });
                    }
                }
            }

            for (const b of this.bots) {
                const s0 = f0.bots[b.id];
                const s1 = f1.bots[b.id] || s0;
                if (!s0) continue;
                b.parts.root.visible = s0.alive;
                const bx = BO.Math.lerp(s0.x, s1.x, alpha);
                const by = BO.Math.lerp(s0.y, s1.y, alpha);
                const bz = BO.Math.lerp(s0.z, s1.z, alpha);
                b.parts.root.position.set(bx, by, bz);
                b.parts.root.rotation.y = s0.yaw + BO.Math.angleDiff(s0.yaw, s1.yaw) * alpha;
                const bSpd = Math.hypot(s1.x - s0.x, s1.z - s0.z) / Math.max(0.01, f1.t - f0.t);
                BO.CharacterMesh.animateLimbs(b.parts, bSpd, BO.Math.lerp(s0.phase || 0, s1.phase || 0, alpha), 0, 0);
            }

            if (kd.meta.killerKind === 'player') {
                if (this.playerAvatar3P) this.playerAvatar3P.root.visible = false;
                const px = BO.Math.lerp(f0.p.x, f1.p.x, alpha);
                const py = BO.Math.lerp(f0.p.y, f1.p.y, alpha);
                const pz = BO.Math.lerp(f0.p.z, f1.p.z, alpha);
                const yaw = f0.p.yaw + BO.Math.angleDiff(f0.p.yaw, f1.p.yaw) * alpha;
                const pitch = BO.Math.lerp(f0.p.pitch, f1.p.pitch, alpha);
                this.camera.position.set(px, py, pz);
                this.camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));

                BO.Player.applyKillcamViewmodelPose({
                    adsAlpha: BO.Math.lerp(f0.p.adsAlpha || 0, f1.p.adsAlpha || 0, alpha),
                    fov: BO.Math.lerp(f0.p.fov || 90, f1.p.fov || 90, alpha),
                    recoilZ: BO.Math.lerp(f0.p.recoilZ || 0, f1.p.recoilZ || 0, alpha),
                    recoilPitch: BO.Math.lerp(f0.p.recoilPitch || 0, f1.p.recoilPitch || 0, alpha),
                    swayX: BO.Math.lerp(f0.p.swayX || 0, f1.p.swayX || 0, alpha),
                    swayY: BO.Math.lerp(f0.p.swayY || 0, f1.p.swayY || 0, alpha),
                    bobPhase: BO.Math.lerp(f0.p.bobPhase || 0, f1.p.bobPhase || 0, alpha),
                    horizSpeed: BO.Math.lerp(f0.p.horizSpeed || 0, f1.p.horizSpeed || 0, alpha),
                    tacSprinting: f0.p.tacSprinting,
                    sliding: f0.p.sliding,
                    reloading: f0.p.reloading,
                    reloadFrac: BO.Math.lerp(f0.p.reloadFrac || 0, f1.p.reloadFrac || 0, alpha),
                    weaponId: f0.p.weaponId
                }, this.camera, dt);
            } else {
                BO.Player.vmAnchor.visible = false;
                BO.Player.adsAlpha = 0;
                if (this.camera) {
                    this.camera.fov = BO.Settings.get('fov') || 90;
                    this.camera.updateProjectionMatrix();
                }
                if (this.playerAvatar3P) {
                    this.playerAvatar3P.root.visible = f0.p.alive;
                    this.playerAvatar3P.root.position.set(
                        BO.Math.lerp(f0.p.x, f1.p.x, alpha),
                        BO.Math.lerp(f0.p.y, f1.p.y, alpha) - 1.60,
                        BO.Math.lerp(f0.p.z, f1.p.z, alpha)
                    );
                    this.playerAvatar3P.root.rotation.y = f0.p.yaw + BO.Math.angleDiff(f0.p.yaw, f1.p.yaw) * alpha + Math.PI;
                }
                const kb = this.bots.find((x) => x.id === kd.meta.killerBotId);
                const b0 = kb ? f0.bots[kb.id] : null;
                const b1 = kb ? (f1.bots[kb.id] || b0) : null;
                if (kb && b0) {
                    kb.parts.root.visible = false;
                    const kx = BO.Math.lerp(b0.x, b1.x, alpha);
                    const ky = BO.Math.lerp(b0.y, b1.y, alpha) + 1.52;
                    const kz = BO.Math.lerp(b0.z, b1.z, alpha);
                    const byaw = b0.yaw + BO.Math.angleDiff(b0.yaw, b1.yaw) * alpha;
                    this.camera.position.set(kx, ky, kz);
                    this.camera.quaternion.setFromEuler(new THREE.Euler(0, byaw + Math.PI, 0, 'YXZ'));
                }
            }
        }

        update(dt) {
            if (!this.active || this.ended) return;

            if (this.killcamActive) {
                this._updateKillcam(dt);
                return;
            }

            this.elapsed += dt;
            this.timeRemaining = Math.max(0, this.timeRemaining - dt);

            if (this.customRules.unlimitedAmmo && BO.Player.activeWeapon) {
                const aw = BO.Player.activeWeapon;
                if (aw.stats.kind === 'gun') aw.mag = aw.stats.magSize;
            }

            if (this.multikillTimer > 0) {
                this.multikillTimer -= dt;
                if (this.multikillTimer <= 0) this.multikillCount = 0;
            }
            if (this.uavTimer > 0) this.uavTimer = Math.max(0, this.uavTimer - dt);

            if (this.nukeTimer > 0) {
                this.nukeTimer -= dt;
                if (this.nukeTimer <= 0) {
                    BO.FX.spawnExplosion(new THREE.Vector3(0, 4, 0), 30, 0xffffff);
                    BO.Sound.playExplosion(1.0);
                    this._endMatch(true, 'TACTICAL NUKE VICTORY');
                    return;
                }
            }

            if (BO.FX.chopper) {
                this.chopperFireCooldown -= dt;
                if (this.chopperFireCooldown <= 0) {
                    this.chopperFireCooldown = 1.6;
                    const enemies = this.bots.filter((b) => b.alive && (this.modeType === 'ffa' || b.team !== 0));
                    if (enemies.length > 0) {
                        const t = BO.Math.pick(enemies);
                        BO.FX.spawnTracer(BO.FX.chopper.group.position.clone(), t.pos.clone().add(new THREE.Vector3(0, 1, 0)), 0xf59e0b, 0.06, 0.16);
                        BO.Sound.playGunshot('lmg', false, false, 0.6);
                        if (t.takeDamage(120, 'player')) {
                            this._awardPlayerKill(t, false, 'ATTACK CHOPPER', null);
                        }
                    }
                }
            }

            if (!BO.Player.alive) {
                if (this.respawnTimer <= 0) {
                    if (BO.App && BO.App._clearInputState) BO.App._clearInputState();
                    this.playerDeaths++;
                    this.currentStreak = 0;
                    BO.Progression.recordStat('mpDeaths', 1);
                    this.respawnTimer = this.customRules.respawnDelay ?? 2.4;
                } else {
                    this.respawnTimer -= dt;
                    if (this.respawnTimer <= 0) {
                        const sp = this._pickBestSpawn(0);
                        if (this.pendingClassIndex !== null) {
                            const newLoadout = BO.Loadout.getClass(this.pendingClassIndex);
                            this.pendingClassIndex = null;
                            BO.Player.initForMatch('mp', sp, newLoadout, false);
                            this._applyPlayerCustomRules();
                            this._applyModsAndProtocol();
                            BO.Events.emit('hud:toast', { text: `CLASS SWITCHED TO ${newLoadout.name}`, color: '#22c55e' });
                        } else {
                            BO.Player.pos.set(sp.x, sp.y || 0, sp.z);
                            BO.Player.yaw = sp.yaw || 0;
                            BO.Player.hp = BO.Player.maxHp;
                            BO.Player.alive = true;
                            BO.Player.refillAllAmmo();
                        }
                    }
                }
            }

            let objPos = null;
            if (this.modeType === 'dom') objPos = this._updateDomination(dt);
            else if (this.modeType === 'hardpoint') objPos = this._updateHardpoint(dt);

            const hitMeshes = [];
            const context = {
                playerAlive: BO.Player.alive,
                playerPos: BO.Player.pos,
                playerTeam: 0,
                bots: this.bots,
                modeType: this.modeType,
                objectivePos: objPos,
                onRecordFx: (fx) => this.recordKillcamFx(fx),
                onBotShootPlayer: (bot, dmg) => {
                    if (!BO.Player.alive) return;
                    BO.Player.takeDamage(dmg, bot.pos, false);
                    if (!BO.Player.alive) {
                        bot.kills++;
                        bot.score += 100;
                        if (this.modeType === 'tdm') this.teamScores[1]++;
                        const wShort = BO.WeaponsData.get(bot.weaponId).shortName;
                        if (!this.killcamPendingEnd) {
                            this.lastKillMeta = {
                                killerKind: 'bot',
                                killerBotId: bot.id,
                                killerName: bot.name,
                                victimName: BO.Save.data.callsign || 'YOU',
                                weaponLabel: wShort,
                                headshot: false,
                                killTime: this.elapsed
                            };
                        }
                        BO.Events.emit('hud:killfeed', {
                            killer: bot.name,
                            victim: BO.Save.data.callsign || 'YOU',
                            weapon: wShort,
                            isPlayerKiller: false
                        });
                    }
                },
                onBotKillBot: (killer, victim) => {
                    killer.kills++;
                    killer.score += 100;
                    if (this.modeType === 'tdm') {
                        if (killer.team === 0) this.teamScores[0]++;
                        else this.teamScores[1]++;
                    }
                    const wShort = BO.WeaponsData.get(killer.weaponId).shortName;
                    if (!this.killcamPendingEnd) {
                        this.lastKillMeta = {
                            killerKind: 'bot',
                            killerBotId: killer.id,
                            killerName: killer.name,
                            victimName: victim.name,
                            weaponLabel: wShort,
                            headshot: false,
                            killTime: this.elapsed
                        };
                    }
                    BO.Events.emit('hud:killfeed', {
                        killer: killer.name,
                        victim: victim.name,
                        weapon: wShort,
                        isPlayerKiller: false
                    });
                }
            };

            const myTeam = (BO.Net && BO.Net.active) ? BO.Net.myTeam : 0;
            for (const b of this.bots) {
                if (!b.alive) {
                    if (b.respawnTimer <= 0) {
                        b.spawnAt(this._pickBestSpawn(b.team === 0 ? 0 : 1));
                    } else {
                        b.respawnTimer -= dt;
                    }
                    continue;
                }
                b.update(dt, context);
                if (this.modeType === 'ffa' || this.modeType === 'gun_game' || b.team !== myTeam) {
                    const ms = b.getHitboxMeshes();
                    for (let m = 0; m < ms.length; m++) hitMeshes.push(ms[m]);
                }
            }
            if (BO.Net && BO.Net.active) {
                const remoteMeshes = BO.Net.getRemoteHitboxMeshes();
                for (let r = 0; r < remoteMeshes.length; r++) hitMeshes.push(remoteMeshes[r]);
            }
            BO.Combat.setTargetPool(hitMeshes);

            this._recordReplaySnapshot(dt);

            if (this.killcamPendingEnd) {
                this.killcamPendingEnd.timer -= dt;
                if (this.killcamPendingEnd.timer <= 0) {
                    const pe = this.killcamPendingEnd;
                    this._startWinnerKillcamOrEnd(pe.victory, pe.customTitle);
                }
                return;
            }

            if (this.modeType === 'tdm' || this.modeType === 'dom' || this.modeType === 'hardpoint') {
                if (this.teamScores[0] >= this.scoreLimit) this._queueWinnerKillcam(true);
                else if (this.teamScores[1] >= this.scoreLimit) this._queueWinnerKillcam(false);
            } else if (this.modeType === 'ffa') {
                if (this.playerKills >= this.scoreLimit) this._queueWinnerKillcam(true);
                else if (this.bots.some((b) => b.kills >= this.scoreLimit)) this._queueWinnerKillcam(false);
            }

            if (this.timeRemaining <= 0 && !this.ended && !this.killcamActive && !this.killcamPendingEnd) {
                const win = this.modeType === 'ffa'
                    ? this.playerKills >= Math.max(0, ...this.bots.map((b) => b.kills))
                    : this.teamScores[0] >= this.teamScores[1];
                this._startWinnerKillcamOrEnd(win, win ? 'TIME LIMIT VICTORY' : 'TIME LIMIT DEFEAT');
            }
        }

        _updateDomination(dt) {
            let targetFlag = this.domStates[1] || this.domStates[0];
            for (let i = 0; i < this.domStates.length; i++) {
                const f = this.domStates[i];
                let allyCap = BO.Player.alive && BO.Math.dist2D(BO.Player.pos.x, BO.Player.pos.z, f.x, f.z) < 3.4 ? 1 : 0;
                let enemyCap = 0;
                for (const b of this.bots) {
                    if (!b.alive) continue;
                    if (BO.Math.dist2D(b.pos.x, b.pos.z, f.x, f.z) < 3.4) {
                        if (b.team === 0) allyCap++; else enemyCap++;
                    }
                }
                if (allyCap > enemyCap && f.owner !== 0) {
                    f.progress += dt * 0.45;
                    if (f.progress >= 1) {
                        f.owner = 0; f.progress = 0;
                        this.playerScore += 150;
                        BO.Events.emit('hud:toast', { text: `CAPTURED FLAG ${f.id}`, color: '#38bdf8' });
                    }
                } else if (enemyCap > allyCap && f.owner !== 1) {
                    f.progress += dt * 0.45;
                    if (f.progress >= 1) {
                        f.owner = 1; f.progress = 0;
                        BO.Events.emit('hud:toast', { text: `HOSTILES CAPTURED FLAG ${f.id}`, color: '#ef4444' });
                    }
                }
                const vis = BO.World.domFlagObjs[i];
                if (vis) {
                    const hex = f.owner === 0 ? 0x38bdf8 : (f.owner === 1 ? 0xef4444 : 0xf8fafc);
                    vis.banner.material.color.setHex(hex);
                    vis.ring.material.color.setHex(hex);
                }
                if (f.owner !== 0) targetFlag = f;
            }

            this.domTickTimer += dt;
            if (this.domTickTimer >= 1.5) {
                this.domTickTimer = 0;
                for (const f of this.domStates) {
                    if (f.owner === 0) this.teamScores[0]++;
                    else if (f.owner === 1) this.teamScores[1]++;
                }
            }
            return targetFlag;
        }

        _updateHardpoint(dt) {
            const hps = BO.World.mapData.hardpoints || [];
            if (hps.length === 0) return null;
            this.hpTimer -= dt;
            if (this.hpTimer <= 0) {
                this.hpIndex = (this.hpIndex + 1) % hps.length;
                this.hpTimer = 45;
                const nextHp = hps[this.hpIndex];
                if (BO.World.hardpointRing) BO.World.hardpointRing.position.set(nextHp.x, nextHp.y + 0.08, nextHp.z);
                BO.Events.emit('hud:toast', { text: 'HARDPOINT MOVED: ' + nextHp.label, color: '#f5a623' });
            }
            const cur = hps[this.hpIndex];
            let allies = BO.Player.alive && BO.Math.dist2D(BO.Player.pos.x, BO.Player.pos.z, cur.x, cur.z) <= cur.r ? 1 : 0;
            let enemies = 0;
            for (const b of this.bots) {
                if (b.alive && BO.Math.dist2D(b.pos.x, b.pos.z, cur.x, cur.z) <= cur.r) {
                    if (b.team === 0) allies++; else enemies++;
                }
            }
            this.hpOwner = allies > 0 && enemies === 0 ? 0 : (enemies > 0 && allies === 0 ? 1 : -1);
            if (BO.World.hardpointRing) {
                BO.World.hardpointRing.material.color.setHex(this.hpOwner === 0 ? 0x38bdf8 : (this.hpOwner === 1 ? 0xef4444 : 0xf59e0b));
            }
            this.hpTickTimer += dt;
            if (this.hpTickTimer >= 1.0) {
                this.hpTickTimer = 0;
                if (this.hpOwner === 0) { this.teamScores[0]++; this.playerScore += 15; }
                else if (this.hpOwner === 1) this.teamScores[1]++;
            }
            return cur;
        }

        getScoreboard() {
            const myTeam = (BO.Net && BO.Net.active) ? BO.Net.myTeam : 0;
            const rows = [{
                name: (BO.Save.data.callsign || 'YOU') + ' (YOU)',
                team: myTeam,
                isPlayer: true,
                kills: this.playerKills,
                deaths: this.playerDeaths,
                score: this.playerScore
            }];
            if (BO.Net && BO.Net.active) {
                for (const [pid, prof] of BO.Net.players.entries()) {
                    if (pid === BO.Net.myPeerId) continue;
                    rows.push({
                        name: `★ ${prof.callsign || 'FRIEND'}`,
                        team: prof.team ?? 0,
                        isPlayer: false,
                        kills: prof.kills || 0,
                        deaths: prof.deaths || 0,
                        score: prof.score || 0
                    });
                }
            }
            for (const b of this.bots) {
                rows.push({
                    name: b.name,
                    team: b.team,
                    isPlayer: false,
                    kills: b.kills,
                    deaths: b.deaths,
                    score: b.score
                });
            }
            rows.sort((a, b) => b.score - a.score || b.kills - a.kills);
            return rows;
        }

        _endMatch(victory, customTitle = null) {
            if (this.ended) return;
            this.ended = true;
            this.killcamActive = false;
            if (victory) {
                BO.Progression.recordStat('mpWins', 1);
                BO.Progression.grantPlayerXP(600);
            }
            BO.Progression.flushSave();

            BO.Events.emit('match:ended', {
                mode: 'mp',
                victory,
                title: customTitle || (victory ? 'VICTORY' : 'DEFEAT'),
                mapName: BO.World.mapData.name,
                modeType: this.modeType.toUpperCase(),
                teamScores: this.teamScores.slice(),
                kills: this.playerKills,
                deaths: this.playerDeaths,
                headshots: this.playerHeadshots,
                score: this.playerScore,
                scoreboard: this.getScoreboard(),
                time: BO.Math.formatTime(this.elapsed)
            });
        }
    }

    BO.MPMode = new MultiplayerMode();
})(window);
