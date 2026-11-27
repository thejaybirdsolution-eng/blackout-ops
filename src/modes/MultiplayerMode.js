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

    const NEW_MODE_LIMITS = {
        infection: [1, 300], search_destroy: [4, 120],
        four_teams: [50, 480], bounty: [0, 300]
    };
    const SOLO_MODES = new Set(['ffa', 'gun_game', 'bounty']);

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
            BO.Sound.startMusic('mp');
            this.variant = opts.modeType || 'tdm';
            this.modeType = this.variant === 'hardcore_tdm' ? 'tdm'
                : this.variant === 'hardcore_ffa' ? 'ffa' : this.variant;
            this.isSolo = SOLO_MODES.has(this.modeType);
            this.mapId = opts.mapId || 'killhouse';
            this.difficulty = opts.difficulty || 'regular';
            this.customRules = Object.assign({}, DEFAULT_CUSTOM_RULES, opts.customRules || {});
            if (this.variant.startsWith('hardcore_')) {
                Object.assign(this.customRules, { playerHp: 30, enemyHp: 30, noHealthRegen: true, alwaysRadar: false });
            }
            if (this.modeType === 'search_destroy') this.customRules.killstreaksEnabled = false;
            this.armoryCredits = 350;
            this.camera = opts.camera || null;

            const scene = BO.World.build(this.mapId);
            const map = BO.World.mapData;
            const loadout = BO.Loadout.getActiveClass();

            this.bots = [];
            this.teamScores = this.modeType === 'four_teams' ? [0, 0, 0, 0] : [0, 0];
            this.playerTeam = BO.Net?.active ? BO.Net.myTeam : 0;
            this.bountyHolder = null;
            this.bountySeconds = new Map();
            this.searchBomb = null;
            this.searchRound = 1;
            this.sentry = null;
            this.counterUavTimer = 0;
            this.searchProgress = 0;
            this.elapsed = 0;
            this.playerCapturedHardpoint = false;
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

            if (NEW_MODE_LIMITS[this.modeType]) [this.scoreLimit, this.timeRemaining] = NEW_MODE_LIMITS[this.modeType];

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
            if (this.modeType === 'search_destroy') this._placeSearchMarker();
            this.searchRoundSeconds = this.timeRemaining;
            if (this.modeType === 'bounty') this._setBounty(BO.Math.pick([BO.Player, ...this.bots]));

            BO.Progression.recordStat('mpMatches', 1);
            BO.Events.emit('mp:started', { modeType: this.modeType, mapName: map.name });
            if (BO.Superpowers.enabled) {
                const key = BO.Settings.getKeybinds().armory.replace(/^(Key|Digit)/, '');
                BO.Events.emit('hud:toast', { text: `[${key}] SUPERPOWER ARMORY • Earn 100 credits per elimination`, color: '#c4b5fd' });
            }
            return scene;
        }

        _applyPlayerCustomRules() {
            const r = this.customRules;
            const php = Math.max(1, Math.min(1000, Number(r.playerHp) || 100));
            BO.Player.maxHp = php;
            BO.Player.hp = php;
            if (r.runnerArmor) BO.Player.armor = Math.min(BO.Player.maxArmor, 15);
            if (r.singlePrimary) {
                BO.Player.weapons.splice(1);
                BO.Player.activeSlot = 0;
            }

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
            this._removeSentry();
            if (this.searchMarker) {
                this.searchMarker.parent?.remove(this.searchMarker);
                this.searchMarker.geometry.dispose();
                this.searchMarker.material.dispose();
                this.searchMarker = null;
            }
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
            if (BO.Combat && typeof BO.Combat.setTargetPool === 'function') BO.Combat.setTargetPool([]);
            BO.Sound.stopMusic();
        }

        _spawnBots(map) {
            const r = this.customRules;
            const mfx = BO.Mods ? BO.Mods.fx(r.mods || {}, 'mp') : {};
            const isFFA = this.isSolo;
            const requested = Number.parseInt(r.enemyCount, 10);
            const baseCount = Number.isFinite(requested) ? requested : (isFFA ? 7 : 6);
            const enemyCount = this.modeType === 'four_teams' ? 12 : this.modeType === 'infection' ? BO.Math.clamp(baseCount, 1, 100) : BO.Math.clamp(Math.round(baseCount * (mfx.botCountMult || 1)) + (mfx.extraBots || 0), 0, 100);
            const teamCap = BO.Math.clamp(parseInt(r.teamSizeLimit, 10) || 6, 1, 100);
            const allyCount = this.modeType === 'four_teams' ? 3 : isFFA || r.noAllies ? 0 : Math.min(teamCap - 1, enemyCount, 100 - enemyCount);
            const healthScale = (r.fragileBots ? 0.5 : 1) * (r.toughBots ? 2 : 1) * (mfx.botHpMult || 1);
            const botSpeed = (r.speedScale || 1) * (r.slowBots ? 0.5 : 1) * (r.quickBots ? 1.5 : 1) * (mfx.botSpeedMult || 1);
            const ePool = WEAPON_POOLS[r.enemyWeaponMode] || WEAPON_POOLS.all;
            const enemyUnarmed = r.enemyWeaponMode === 'unarmed';
            const eHp = Math.max(1, Math.min(1000, Number(r.enemyHp) || 100));
            const respDelay = Math.max(0.15, (r.respawnDelay ?? 2.4) * (mfx.respawnDelayMult || 1) + (mfx.respawnDelayAdd || 0));

            let botId = 0;
            for (let a = 0; a < allyCount; a++) {
                const sp = this._pickBestSpawn(0);
                const wId = isFFA && this.modeType === 'gun_game' ? GUN_GAME_LADDER[0] : WEAPON_POOLS.all[a % WEAPON_POOLS.all.length];
                const bot = new BO.BotAI({
                    id: botId++,
                    team: 0,
                    difficulty: this.difficulty,
                    weaponId: wId,
                    unarmed: !!r.passiveBots,
                    maxHp: Math.max(1, Math.round((r.playerHp || 100) * healthScale)),
                    speedScale: botSpeed,
                    bigHeads: !!r.bigHeads || !!mfx.botBigHead,
                    respawnDelay: respDelay,
                    oneShotKills: !!r.oneShotKills,
                    x: sp.x, y: sp.y || 0, z: sp.z, yaw: sp.yaw || 0
                });
                this.bots.push(bot);
            }

            for (let e = 0; e < enemyCount; e++) {
                const team = this.modeType === 'four_teams' ? 1 + Math.floor(e / 4)
                    : this.modeType === 'infection' ? Number(e === 0) : isFFA ? e + 2 : 1;
                const sp = this._pickBestSpawn(team);
                const infected = this.modeType === 'infection' && team === 1;
                const wId = (isFFA && this.modeType === 'gun_game') ? GUN_GAME_LADDER[0] : ePool[e % ePool.length];
                const bot = new BO.BotAI({
                    id: botId++,
                    team,
                    difficulty: this.difficulty,
                    weaponId: infected ? 'combat_knife' : wId,
                    unarmed: !infected && enemyUnarmed || !!r.passiveBots,
                    maxHp: Math.max(1, Math.round(eHp * healthScale)),
                    speedScale: botSpeed,
                    bigHeads: !!r.bigHeads || !!mfx.botBigHead,
                    respawnDelay: respDelay,
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
            const isFFA = this.isSolo;
            const baseList = isFFA || team > 1
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
                    if (isFFA || team !== this.playerTeam) {
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
                const trapPenalty = minEnemyDist < 14 ? -45 : 0;
                const score = Math.min(minEnemyDist, 32) * 2.2 + Math.min(minAnyDist, 14) * 1.4
                    + (losExposed ? -55 : 14) + cooldownPenalty + clusterPenalty + trapPenalty + Math.random() * 1.5;

                if (score > bestScore) {
                    bestScore = score;
                    bestSp = sp;
                }
            }

            this.recentSpawnTimes.set(`${bestSp.x.toFixed(1)}_${bestSp.z.toFixed(1)}`, now);
            return bestSp;
        }

        _onPlayerHitBot(bot, dmg, hitbox, weaponInst, hitPt) {
            if (!bot || !bot.alive || bot.powerAlly) return false;
            const myTeam = (BO.Net && BO.Net.active) ? BO.Net.myTeam : 0;
            const isFFA = this.isSolo;
            const isHead = hitbox === 'head';
            if (this.customRules.headshotsOnly && !isHead) return false;

            let finalDmg = this.customRules.oneShotKills ? 9999 : dmg;
            if (this.customRules.shotgunRange && weaponInst?.stats.kind === 'gun' && BO.Player.pos.distanceTo(bot.pos) > 18) {
                finalDmg *= 0.5;
            }
            if (BO.Mods && this.customRules.mods) {
                finalDmg = BO.Mods.outgoingDamage(this.customRules.mods, finalDmg, { hitbox, weaponInst, target: null });
                if (finalDmg <= 0) return false;
            }
            if (this.customRules.explosiveRounds && !this.customRules.noExplosiveDamage && hitPt) {
                BO.FX.spawnExplosion(hitPt, 2.8, 0xf97316);
                BO.Sound.playExplosion(hitPt, 0.55);
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

            if (!isFFA && bot.team === this.playerTeam) return false;

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

            const killed = bot.takeDamage(finalDmg, 'player', weaponInst?.stats?.damage ?? dmg);
            if (!killed) {
                BO.Player.addUltimateCharge(3);
                return false;
            }

            this._awardPlayerKill(bot, isHead, wName, weaponInst?.cfg?.id || null);
            return true;
        }

        _awardPlayerKill(bot, isHead, weaponLabel, weaponId) {
            const kMods = (this.customRules && this.customRules.mods) || {};
            const mfx = BO.Mods ? BO.Mods.fx(kMods, 'mp') : {};
            if (BO.Mods) BO.Mods.onKill(kMods, null, {});
            if (kMods.vampirePlayer && BO.Player.alive) BO.Player.hp = Math.min(BO.Player.maxHp, BO.Player.hp + 15);
            if (mfx.botMartyrdom && bot && bot.pos) {
                const mPos = bot.pos.clone().add(new THREE.Vector3(0, 0.4, 0));
                setTimeout(() => {
                    if (this.active && !this.ended && BO.Combat?.onExplodeAt) {
                        BO.FX?.spawnExplosion?.(mPos, 3.5, 0xf97316);
                        BO.Combat.onExplodeAt(mPos, 3.8, 55, 'enemy', false, 0, 'martyrdom');
                    }
                }, 1100);
            }
            this.playerKills++;
            BO.Save.data.stats.mpBestKills = Math.max(BO.Save.data.stats.mpBestKills, this.playerKills);
            this.armoryCredits += 100;
            const weapon = BO.Player.activeWeapon;
            if (this.customRules.cleanMagazine && weapon?.stats.kind === 'gun') {
                const amount = Math.min(weapon.stats.magSize - weapon.mag, Math.ceil(weapon.stats.magSize / 2), weapon.reserve);
                weapon.mag += amount;
                weapon.reserve -= amount;
            }
            if (this.customRules.regenOnElim && BO.Player.alive) BO.Player.hp = BO.Player.maxHp;
            if (BO.Player.mpPerks.includes('hot_plate') && BO.Player.pos.distanceTo(bot.pos) < 6) {
                BO.Player.armor = Math.min(BO.Player.maxArmor, BO.Player.armor + 15);
            }
            this.currentStreak++;
            this.playerScore += (isHead ? 125 : 100) + ((mfx.bonusMatchScore || 0) * 50);
            BO.Sound.playPing?.();
            BO.Juice?.shake?.(isHead ? 0.095 : 0.045);

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
            const xpMult = (mfx.xpMult || 1) * (isHead ? (mfx.hsXpMult || 1) : 1);
            if (weaponId) BO.Progression.grantWeaponKill(weaponId, isHead, Math.round(120 * xpMult));
            BO.Progression.grantPlayerXP(Math.round((isHead ? 150 : 110) * xpMult));
            BO.Player.addUltimateCharge(22 * (mfx.ultKillMult || 1));

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
                BO.Events.emit('hud:banner', { title: 'OVERKILL!', sub: `4X UNSTOPPABLE FURY • ${weaponLabel}`, color: '#ef4444' });
            } else if (this.multikillCount === 5) {
                BO.Progression.awardMedal('frenzy_kill');
                BO.Sound.playMultikillVoice(5);
                BO.Events.emit('hud:banner', { title: 'KILLTACULAR!', sub: `5X RAPID ELIMINATION • ${weaponLabel}`, color: '#c084fc' });
            } else if (this.multikillCount >= 6) {
                BO.Progression.awardMedal(this.multikillCount === 6 ? 'killtrocity' : 'killimanjaro');
                BO.Sound.playMultikillVoice(this.multikillCount);
                BO.Events.emit('hud:banner', { title: this.multikillCount === 6 ? 'KILLTROCITY!' : (this.multikillCount === 7 ? 'KILLIMANJARO!' : `${this.multikillCount}X KILLIONAIRE!`), sub: 'TOTAL DOMINATION!', color: '#fde047' });
            }

            if (this.currentStreak === 5) { BO.Progression.awardMedal('bloodthirsty'); if (this.multikillCount < 2) BO.Sound.playAnnouncement('killing_spree'); }
            else if (this.currentStreak === 10) { BO.Progression.awardMedal('merciless'); if (this.multikillCount < 2) BO.Sound.playAnnouncement('killing_frenzy'); }
            else if (this.currentStreak === 15) { BO.Progression.awardMedal('ruthless'); if (this.multikillCount < 2) BO.Sound.playAnnouncement('running_riot'); }
            else if (this.currentStreak === 20) { BO.Progression.awardMedal('rampage_spree'); if (this.multikillCount < 2) BO.Sound.playAnnouncement('rampage'); }
            else if (this.currentStreak === 25) { BO.Progression.awardMedal('untouchable'); if (this.multikillCount < 2) BO.Sound.playAnnouncement('untouchable'); }

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

            if (this.modeType === 'tdm' || this.modeType === 'four_teams') this.teamScores[this.playerTeam] += this.customRules.headshotScore && isHead ? 2 : 1;
            this._handleVariantKill(BO.Player, bot);
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
            const isFFA = this.isSolo;
            let hits = 0;
            let killedAny = false;
            for (const b of this.bots) {
                if (!b.alive) continue;
                if (b.powerAlly || (!isFFA && b.team === this.playerTeam)) continue;
                const d = b.pos.distanceTo(pos);
                if (d <= rad) {
                    if (isFlash || wid === 'cryo_nova') {
                        b.stunTimer = Math.max(b.stunTimer, stunDur || 5.0);
                    } else {
                        const killed = b.takeDamage(dmg * (1 - (d / rad) * 0.5), 'player');
                        if (killed) {
                            killedAny = true;
                            this._awardPlayerKill(b, false, 'EXPLOSIVE', null);
                        }
                    }
                    hits++;
                }
            }
            if (hits > 0) BO.Events.emit('hud:hitmarker', { isHeadshot: false, isKill: killedAny });
        }

        activateStreak(slotIdxOrId) {
            if (this.customRules.killstreaksEnabled === false) return false;
            let ksId = typeof slotIdxOrId === 'number' ? this.equippedStreaks[slotIdxOrId] : slotIdxOrId;
            const qIdx = this.earnedStreaks.indexOf(ksId);
            if (qIdx === -1) return false;
            this.earnedStreaks.splice(qIdx, 1);

            BO.Progression.recordStat('mpKillstreaksCalled', 1);
            const ks = BO.AttachmentsData.KILLSTREAKS[ksId];
            BO.Sound.playKillstreakDeploy();
            BO.Events.emit('hud:banner', { title: ks.name.toUpperCase() + ' DEPLOYED', sub: 'TACTICAL SUPPORT INBOUND', color: '#38bdf8' });

            if (ksId === 'blackbird') {
                this.uavTimer = Math.max(this.uavTimer, 45);
            } else if (ksId === 'counter_uav') {
                this.counterUavTimer = 12;
            } else if (ksId === 'pave_low') {
                BO.FX.spawnChopper(BO.Player.pos.x, BO.Player.pos.z, 52);
            } else if (ksId === 'emergency_airdrop') {
                BO.Player.refillAllAmmo();
                this.uavTimer = Math.max(this.uavTimer, 20);
                BO.FX.spawnChopper(BO.Player.pos.x, BO.Player.pos.z, 16);
                BO.Events.emit('hud:toast', { text: 'RESUPPLIED • RECON AND AIR COVER ACTIVE', color: '#fbbf24' });
            } else if (ksId === 'emp') {
                this.uavTimer = 0;
                for (const bot of this.bots) {
                    if (this.isSolo || bot.team !== this.playerTeam) bot.stunTimer = Math.max(bot.stunTimer, 4.5);
                }
            } else if (ksId === 'sentry_gun') {
                this._removeSentry();
                const pos = BO.Player.pos.clone().add(new THREE.Vector3(-Math.sin(BO.Player.yaw), 0.95, -Math.cos(BO.Player.yaw)));
                const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.55),
                    new THREE.MeshStandardMaterial({ color: 0x263543, metalness: 0.43, roughness: 0.53 }));
                mesh.position.copy(pos);
                BO.World.scene.add(mesh);
                this.sentry = { pos, mesh, time: 18, cooldown: 0 };
            } else if (ksId === 'napalm_strike' || ksId === 'artillery') {
                const yaw = BO.Player.yaw;
                const center = BO.Player.pos.clone().add(new THREE.Vector3(-Math.sin(yaw) * 18, 0, -Math.cos(yaw) * 18));
                for (const offset of [-6, 0, 6]) {
                    const point = center.clone().add(new THREE.Vector3(Math.cos(yaw) * offset, 0, -Math.sin(yaw) * offset));
                    point.y = BO.World.getGroundHeight(point.x, point.z, center.y) + 0.15;
                    if (ksId === 'napalm_strike') BO.Combat._spawnNapalmPool(point, 4.5, 7);
                    else BO.FX.spawnExplosion(point, 5, 0xf97316);
                    this._onExplode(point, 5, ksId === 'artillery' ? 225 : 110, false, 0, ksId);
                }
                BO.Sound.playExplosion(0.8);
            } else if (ksId === 'uav') {
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

        _removeSentry() {
            if (!this.sentry) return;
            const { mesh } = this.sentry;
            mesh.parent?.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
            this.sentry = null;
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
            if (!this.customRules.endlessTime) this.timeRemaining = Math.max(0, this.timeRemaining - dt);

            if ((this.customRules.unlimitedAmmo || (this.modeType === 'bounty' && this.bountyHolder === BO.Player)) && BO.Player.activeWeapon) {
                const aw = BO.Player.activeWeapon;
                if (aw.stats.kind === 'gun') aw.mag = aw.stats.magSize;
            }

            if (this.customRules.reserveRefill && BO.Player.activeWeapon) {
                BO.Player.activeWeapon.reserve = BO.Player.activeWeapon.stats.reserveMax;
            }
            if (this.multikillTimer > 0) {
                this.multikillTimer -= dt;
                if (this.multikillTimer <= 0) this.multikillCount = 0;
            }
            if (this.uavTimer > 0) this.uavTimer = Math.max(0, this.uavTimer - dt);
            this.counterUavTimer = Math.max(0, this.counterUavTimer - dt);
            if (this.sentry) {
                const sentry = this.sentry;
                sentry.time -= dt;
                sentry.cooldown -= dt;
                if (sentry.time <= 0) this._removeSentry();
                else if (sentry.cooldown <= 0) {
                    sentry.cooldown = 0.66;
                    const target = this.bots.find((bot) => bot.alive && !bot.powerAlly &&
                        (this.isSolo || bot.team !== this.playerTeam) && bot.pos.distanceToSquared(sentry.pos) < 400 &&
                        BO.World.hasLineOfSight(sentry.pos.x, sentry.pos.y, sentry.pos.z, bot.pos.x, bot.pos.y + 1.2, bot.pos.z));
                    if (target) {
                        sentry.mesh.lookAt(target.pos.x, target.pos.y + 1.0, target.pos.z);
                        BO.Sound.playTurretFire(sentry.pos);
                        BO.FX.spawnTracer(sentry.pos, target.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xfacc15, 0.035, 0.08);
                        if (target.takeDamage(36, 'player')) this._awardPlayerKill(target, false, 'SENTRY GUN', null);
                    }
                }
            }
            const mfx = BO.Mods ? BO.Mods.fx(this.customRules.mods || {}, 'mp') : {};
            if (mfx.permUav) this.uavTimer = Math.max(this.uavTimer, 1.0);
            if (BO.Mods) {
                BO.Mods.tickMode('mp', dt, {
                    bots: this.bots,
                    damageBot: (b, d) => { if (b && b.alive && b.takeDamage) b.takeDamage(d, 'torso', false); }
                });
            }

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
                    const enemies = this.bots.filter((b) => b.alive && (this.isSolo || b.team !== this.playerTeam));
                    if (enemies.length > 0) {
                        const t = BO.Math.pick(enemies);
                        BO.FX.spawnTracer(BO.FX.chopper.group.position.clone(), t.pos.clone().add(new THREE.Vector3(0, 1, 0)), 0xf59e0b, 0.06, 0.16);
                        BO.Sound.playGunshot('lmg', false, false, BO.FX.chopper.group.position);
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
                    this.multikillCount = 0;
                    this.multikillTimer = 0;
                    BO.Progression.recordStat('mpDeaths', 1);
                    this.respawnTimer = Math.max(0.1, this.customRules.respawnDelay ?? 2.4);
                    if (this.modeType === 'bounty' && this.bountyHolder === BO.Player) this._setBounty(null);
                } else {
                    if (this.modeType !== 'search_destroy') this.respawnTimer -= dt;
                    if (this.respawnTimer <= 0 && this.modeType !== 'search_destroy') {
                        const sp = this._pickBestSpawn(this.playerTeam);
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
                            if (this.customRules.runnerArmor) BO.Player.armor = Math.min(BO.Player.maxArmor, 15);
                        }
                        if (this.modeType === 'infection' && this.playerTeam === 1) this._armInfectedPlayer();
                    }
                }
            }

            let objPos = null;
            if (this.modeType === 'dom') objPos = this._updateDomination(dt);
            else if (this.modeType === 'hardpoint') objPos = this._updateHardpoint(dt);
            else if (this.modeType === 'search_destroy') objPos = this._searchSite();

            const hitMeshes = [];
            const context = {
                playerAlive: BO.Player.alive,
                playerConcealed: this.counterUavTimer > 0,
                playerPos: BO.Player.pos,
                playerTeam: this.playerTeam,
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
                        if (this.modeType === 'tdm' || this.modeType === 'four_teams') this.teamScores[bot.team]++;
                        this._handleVariantKill(bot, BO.Player);
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
                    if (this.modeType === 'tdm' || this.modeType === 'four_teams') this.teamScores[killer.powerAlly ? 0 : killer.team]++;
                    this._handleVariantKill(killer, victim);
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

            const myTeam = this.playerTeam;
            for (const b of this.bots) {
                if (!b.alive) {
                    b.updateCorpse(dt);
                    if ((BO.Net?.active && !BO.Net.isHost) || this.modeType === 'search_destroy' || this.customRules.attrition) continue;
                    if (b.respawnTimer <= 0) {
                        b.spawnAt(this._pickBestSpawn(b.team));
                    } else {
                        b.respawnTimer -= dt;
                    }
                    continue;
                }
                b.update(dt, context);
                if (!b.powerAlly && (this.isSolo || b.team !== myTeam)) {
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

            if (this._updateVariant(dt)) return;
            if (!this.customRules.noScoreLimit && ['tdm', 'dom', 'hardpoint', 'four_teams'].includes(this.modeType)) {
                if (this.teamScores[this.playerTeam] >= this.scoreLimit) this._queueWinnerKillcam(true);
                else if (this.teamScores.some((score, side) => side !== this.playerTeam && score >= this.scoreLimit)) this._queueWinnerKillcam(false);
            } else if (this.modeType === 'ffa' && !this.customRules.noScoreLimit) {
                if (this.playerKills >= this.scoreLimit) this._queueWinnerKillcam(true);
                else if (this.bots.some((b) => b.kills >= this.scoreLimit)) this._queueWinnerKillcam(false);
            }

            if (!this.customRules.endlessTime && this.timeRemaining <= 0 && !this.ended && !this.killcamActive && !this.killcamPendingEnd) {
                const win = this.modeType === 'ffa'
                    ? this.playerKills >= Math.max(0, ...this.bots.map((b) => b.kills))
                    : this.teamScores[this.playerTeam] >= Math.max(...this.teamScores.filter((_, i) => i !== this.playerTeam));
                this._startWinnerKillcamOrEnd(win, win ? 'TIME LIMIT VICTORY' : 'TIME LIMIT DEFEAT');
            }
        }

        _armInfectedPlayer() {
            const p = BO.Player;
            p.weapons = [p._createWeaponInstance({ id: 'combat_knife', camo: 'default', attachments: {} }, false)];
            p.activeSlot = 0;
            p.lethalCount = 0;
            p.tacticalCount = 0;
            p.armor = 0;
            p.mpPerks = [];
            p.rebuildViewmodel();
        }

        _handleVariantKill(killer, victim) {
            if (this.modeType === 'bounty' && victim === this.bountyHolder) this._setBounty(killer);
            if (this.modeType !== 'infection' || (killer === BO.Player ? this.playerTeam : killer.team) !== 1) return;
            if (victim === BO.Player) this.playerTeam = 1;
            else {
                victim.team = 1;
                victim.weaponId = 'combat_knife';
                victim.unarmed = false;
            }
        }

        _setBounty(holder) {
            const old = this.bountyHolder;
            if (old === holder) return;
            if (old) {
                old.maxHp /= 2;
                old.hp = Math.min(old.hp, old.maxHp);
            }
            this.bountyHolder = holder;
            if (!holder) return;
            holder.maxHp *= 2;
            holder.hp *= 2;
            if (holder === BO.Player) {
                holder.reloading = false;
                BO.Sound.playObjectiveSignal('bounty');
            } else holder.reloadTimer = 0;
            const name = holder === BO.Player ? 'YOU' : holder.name;
            BO.Events.emit('hud:toast', { text: 'BOUNTY HOLDER • ' + name, color: '#fde047' });
        }

        _searchSite() {
            const map = BO.World.mapData;
            const sites = map.hardpoints?.length ? map.hardpoints : map.domFlags;
            return sites?.length ? sites[(this.searchRound - 1) % sites.length] : map.waypoints?.[0];
        }

        _placeSearchMarker() {
            const site = this._searchSite();
            if (!site) return;
            if (!this.searchMarker) {
                this.searchMarker = new THREE.Mesh(new THREE.RingGeometry(1.92, 2.02, 40),
                    new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
                this.searchMarker.rotation.x = -Math.PI / 2;
                BO.World.scene.add(this.searchMarker);
            }
            this.searchMarker.position.set(site.x, (site.y || 0) + 0.06, site.z);
        }

        tryInteract() {
            if (!this.active || this.modeType !== 'search_destroy' || this.ended || this.killcamActive || this.killcamPendingEnd || !BO.Player.alive) return;
            const site = this._searchSite();
            if (!site || BO.Math.dist3D(BO.Player.pos.x, BO.Player.pos.y, BO.Player.pos.z, site.x, site.y || 0, site.z) > 3.5) return;
            const attackTeam = (this.searchRound - 1) % 2;
            if (!this.searchBomb && this.playerTeam === attackTeam) {
                BO.Progression.recordStat('mpObjectives', 1);
                this._armSearchCharge();
            } else if (this.searchBomb && this.playerTeam !== attackTeam) {
                BO.Progression.recordStat('mpObjectives', 1);
                this._finishSearchRound(this.playerTeam, 'CHARGE DEFUSED');
            }
        }

        _armSearchCharge() {
            this.searchBomb = 35;
            this.searchProgress = 0;
            BO.Sound.playObjectiveSignal('charge_armed');
            BO.Events.emit('hud:toast', { text: 'CHARGE PLANTED • 35 SECONDS', color: '#fbbf24' });
        }

        _finishSearchRound(winningTeam, reason) {
            if (reason === 'CHARGE DEFUSED') BO.Sound.playObjectiveSignal('charge_safe');
            if (++this.teamScores[winningTeam] >= this.scoreLimit) {
                this._queueWinnerKillcam(winningTeam === this.playerTeam, reason);
                return;
            }
            this.searchRound++;
            this._placeSearchMarker();
            this.searchProgress = 0;
            this.searchBomb = null;
            this.timeRemaining = this.searchRoundSeconds;
            const cls = this.pendingClassIndex === null ? BO.Loadout.getActiveClass() : BO.Loadout.getClass(this.pendingClassIndex);
            this.pendingClassIndex = null;
            BO.Player.initForMatch('mp', this._pickBestSpawn(this.playerTeam), cls, false);
            this._applyPlayerCustomRules();
            this._applyModsAndProtocol();
            this.respawnTimer = 0;
            for (const bot of this.bots) bot.spawnAt(this._pickBestSpawn(bot.team));
            BO.Events.emit('hud:banner', { title: reason, sub: 'ROUND ' + this.searchRound, color: '#38bdf8' });
        }

        _updateVariant(dt) {
            const player = BO.Player;
            if (this.modeType === 'bounty') {
                if (!this.bountyHolder?.alive) this._setBounty(BO.Math.pick([player, ...this.bots].filter((p) => p.alive)));
                const holder = this.bountyHolder;
                if (holder) this.bountySeconds.set(holder, (this.bountySeconds.get(holder) || 0) + dt);
                if (this.timeRemaining <= 0 && !this.customRules.endlessTime) {
                    const playerSeconds = this.bountySeconds.get(player) || 0;
                    const win = this.bots.every((bot) => playerSeconds >= (this.bountySeconds.get(bot) || 0));
                    this._startWinnerKillcamOrEnd(win, win ? 'BOUNTY VICTORY' : 'BOUNTY DEFEAT');
                }
                return true;
            }
            if (this.modeType === 'infection') {
                const survivors = Number(this.playerTeam === 0 && player.alive) + this.bots.filter((bot) => bot.team === 0 && bot.alive).length;
                this.teamScores[0] = survivors;
                this.teamScores[1] = this.bots.length + 1 - survivors;
                const expired = this.timeRemaining <= 0 && !this.customRules.endlessTime;
                if (!survivors || expired) {
                    this._queueWinnerKillcam(this.playerTeam === (survivors ? 0 : 1), survivors ? 'SURVIVORS HOLD' : 'INFECTION COMPLETE');
                }
                return true;
            }
            if (this.modeType !== 'search_destroy') return false;
            const attackers = (this.searchRound - 1) % 2;
            const defenders = 1 - attackers;
            const alive = [0, 0];
            if (player.alive) alive[this.playerTeam]++;
            for (const bot of this.bots) if (bot.alive) alive[bot.team]++;
            if (!alive[defenders]) this._finishSearchRound(attackers, 'DEFENDERS ELIMINATED');
            else if (!this.searchBomb && (!alive[attackers] || (!this.customRules.endlessTime && this.timeRemaining <= 0))) {
                this._finishSearchRound(defenders, 'SITE SECURED');
            } else {
                const site = this._searchSite();
                const team = this.searchBomb ? defenders : attackers;
                const atSite = site && this.bots.some((bot) => bot.team === team && bot.alive &&
                    BO.Math.dist3D(bot.pos.x, bot.pos.y, bot.pos.z, site.x, site.y || 0, site.z) < 3.5);
                this.searchProgress = atSite ? this.searchProgress + dt : 0;
                if (this.searchBomb) {
                    const tickUnits = this.searchBomb <= 5 ? 2 : 1;
                    const priorTick = Math.ceil(this.searchBomb * tickUnits);
                    this.searchBomb -= dt;
                    if (this.searchBomb <= 0) {
                        BO.Sound.playExplosion(site ?? 0.8);
                        this._finishSearchRound(attackers, 'CHARGE DETONATED');
                    } else if (this.searchProgress >= 5) this._finishSearchRound(defenders, 'CHARGE DEFUSED');
                    else if (site && Math.ceil(this.searchBomb * tickUnits) < priorTick) {
                        BO.Sound.playObjectiveSignal('charge_tick', site);
                    }
                } else if (this.searchProgress >= 4) {
                    this._armSearchCharge();
                }
            }
            return true;
        }

        _updateDomination(dt) {
            let targetFlag = this.domStates[1] || this.domStates[0];
            for (let i = 0; i < this.domStates.length; i++) {
                const f = this.domStates[i];
                const playerCapturing = BO.Player.alive && BO.Math.dist2D(BO.Player.pos.x, BO.Player.pos.z, f.x, f.z) < 3.4;
                let allyCap = Number(playerCapturing);
                let enemyCap = 0;
                for (const b of this.bots) {
                    if (!b.alive) continue;
                    if (BO.Math.dist2D(b.pos.x, b.pos.z, f.x, f.z) < 3.4) {
                        if (b.team === 0) allyCap++; else enemyCap++;
                    }
                }
                const objMult = BO.Mods ? BO.Mods.objRateMult() : 1;
                if (allyCap > enemyCap && f.owner !== 0) {
                    f.progress += dt * 0.45 * objMult;
                    if (f.progress >= 1) {
                        f.owner = 0; f.progress = 0;
                        this.playerScore += 150;
                        if (playerCapturing) BO.Progression.recordStat('mpObjectives', 1);
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
                this.playerCapturedHardpoint = false;
                const nextHp = hps[this.hpIndex];
                if (BO.World.hardpointRing) BO.World.hardpointRing.position.set(nextHp.x, nextHp.y + 0.08, nextHp.z);
                BO.Events.emit('hud:toast', { text: 'HARDPOINT MOVED: ' + nextHp.label, color: '#f5a623' });
            }
            const cur = hps[this.hpIndex];
            const playerOnPoint = BO.Player.alive && BO.Math.dist2D(BO.Player.pos.x, BO.Player.pos.z, cur.x, cur.z) <= cur.r;
            let allies = Number(playerOnPoint);
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
            if (this.hpOwner === 0 && playerOnPoint) {
                if (!this.playerCapturedHardpoint) {
                    BO.Progression.recordStat('mpObjectives', 1);
                    this.playerCapturedHardpoint = true;
                }
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
            const myTeam = this.playerTeam;
            const rows = [{
                name: (BO.Save.data.callsign || 'YOU') + ' (YOU)',
                team: myTeam,
                isPlayer: true,
                kills: this.playerKills,
                deaths: this.playerDeaths,
                score: this.modeType === 'bounty' ? Math.floor(this.bountySeconds.get(BO.Player) || 0) : this.playerScore
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
                    score: this.modeType === 'bounty' ? Math.floor(this.bountySeconds.get(b) || 0) : b.score
                });
            }
            rows.sort((a, b) => b.score - a.score || b.kills - a.kills);
            return rows;
        }

        _endMatch(victory, customTitle = null) {
            if (this.ended) return;
            this.ended = true;
            this.killcamActive = false;
            BO.Sound.stopMusic();
            BO.Sound.playMatchStinger?.(!!victory);
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
