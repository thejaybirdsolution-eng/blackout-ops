/* ============================================================================
   BLACKOUT OPS — Unified Player Profile System (v3 Slice Owner)
   Manages shared identity across all 7 modes inside BO.Save.data.profile:
   - Account Level 1–100 & cross-mode XP bus
   - 12 Calling Cards, 12 Emblems, 12 Titles & Cross-Mode Cosmetic Rewards
   - Deterministic Offline 3 Daily + 5 Weekly Challenges (zero-server seeded)
   - Unified 70-Weapon Armory catalog adapter & mode progression summaries
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO = global.BO || {};

    function fnv1a(str) {
        let h = 2166136261;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }

    function isoWeekKey(d = new Date()) {
        const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
        const day = dt.getUTCDay() || 7;
        dt.setUTCDate(dt.getUTCDate() + 4 - day);
        const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((dt - yearStart) / 86400000) + 1) / 7);
        return `${dt.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    }

    const CALLING_CARDS = [
        { id: 'card_blackout', name: 'Blackout Vanguards', bg: 'linear-gradient(120deg,#181c24,#2b3340 60%,#ffb23f33)', req: 'Unlocked by default' },
        { id: 'card_zombies_slayer', name: 'Undead Containment', bg: 'linear-gradient(120deg,#2a0d0f,#5c191d 60%,#ef444455)', req: 'Survive Round 10+ in Zombies' },
        { id: 'card_mp_ace', name: 'Arena Tactician', bg: 'linear-gradient(120deg,#0c1e2e,#1e3a5f 60%,#38bdf855)', req: 'Win 3 Multiplayer matches' },
        { id: 'card_td_bastion', name: 'Bastion Architect', bg: 'linear-gradient(120deg,#102619,#1e462d 60%,#4ade8055)', req: 'Clear Wave 5+ in Tower Defense' },
        { id: 'card_zone_lantern', name: 'Exclusion Lantern', bg: 'linear-gradient(120deg,#261b0b,#4d3612 60%,#fbbf2455)', req: 'Complete a Survival Exclusion Zone ending' },
        { id: 'card_vault_delver', name: 'Deep Vault Seeker', bg: 'linear-gradient(120deg,#1f1333,#3b1f63 60%,#c084fc55)', req: 'Reach Floor 10+ or Extract in Rogue Lite' },
        { id: 'card_meridian', name: 'Meridian Horizon', bg: 'linear-gradient(120deg,#1a1f29,#473620 60%,#f5a62355)', req: 'Complete quests in Open World RPG' },
        { id: 'card_sharpshooter', name: 'Platinum Circuit', bg: 'linear-gradient(120deg,#231126,#4a194a 60%,#ec489955)', req: 'Complete a Minigames Daily Seed' },
        { id: 'card_arsenal', name: 'Master Quartermaster', bg: 'linear-gradient(120deg,#14171c,#2c323c 60%,#f8fafc33)', req: 'Reach Profile Level 10' },
        { id: 'card_veteran', name: 'Tier-One Operator', bg: 'linear-gradient(120deg,#221a09,#5e4514 60%,#fde04766)', req: 'Reach Profile Level 25' },
        { id: 'card_coop', name: 'Strike Team Comms', bg: 'linear-gradient(120deg,#0e2426,#154549 60%,#22d3ee55)', req: 'Complete 5 Daily/Weekly Challenges' },
        { id: 'card_operation_blackout', name: 'Operation Blackout', bg: 'linear-gradient(120deg,#111317,#4d2f0c 55%,#ffb23f88)', req: 'Complete the Operation Blackout Finale' }
    ];

    const EMBLEMS = [
        { id: 'emb_star', name: 'Task Force Star', icon: '★', color: '#ffb23f' },
        { id: 'emb_skull', name: 'Horde Breaker', icon: '☠', color: '#ef4444' },
        { id: 'emb_crosshair', name: 'Zeroed Optic', icon: '⌖', color: '#38bdf8' },
        { id: 'emb_shield', name: 'Keep Bulwark', icon: '🛡', color: '#4ade80' },
        { id: 'emb_lantern', name: 'Zone Signal', icon: '◈', color: '#fbbf24' },
        { id: 'emb_relic', name: 'Vault Seal', icon: '✦', color: '#c084fc' },
        { id: 'emb_compass', name: 'Expanse Ranger', icon: '◎', color: '#f5a623' },
        { id: 'emb_trophy', name: 'Arcade Crown', icon: '♛', color: '#f472b6' },
        { id: 'emb_bolt', name: 'Overdrive Core', icon: '⚡', color: '#22d3ee' },
        { id: 'emb_blade', name: 'Close Quarters', icon: '⚔', color: '#cbd5e1' },
        { id: 'emb_phoenix', name: 'Unbroken', icon: '♨', color: '#f97316' },
        { id: 'emb_blackout', name: 'Blackout Prime', icon: '⬢', color: '#fde047' }
    ];

    const TITLES = [
        'OPERATIVE', 'PATHFINDER', 'HORDE BREAKER', 'ARENA ACE', 'SIEGE WARDEN',
        'ZONE SURVIVOR', 'VAULT RUNNER', 'MERIDIAN RANGER', 'MARKSMAN', 'QUARTERMASTER',
        'COMMANDER', 'BLACKOUT LEGEND'
    ];

    const CHALLENGE_TEMPLATES = [
        { id: 'play_any', kind: 'matches', label: 'Deploy & finish sessions across any mode', goal: 2, xp: 350, weeklyMult: 4 },
        { id: 'z_rounds', kind: 'zombies_kills', label: 'Eliminate hostiles in Zombies', goal: 35, xp: 400, weeklyMult: 4 },
        { id: 'mp_kills', kind: 'mp_kills', label: 'Score eliminations in Multiplayer', goal: 12, xp: 380, weeklyMult: 4 },
        { id: 'td_waves', kind: 'td_waves', label: 'Hold Castle Defense waves', goal: 4, xp: 400, weeklyMult: 3 },
        { id: 'mg_plays', kind: 'minigame_runs', label: 'Finish Minigame courses', goal: 3, xp: 320, weeklyMult: 3 },
        { id: 'rpg_floors', kind: 'rpg_progress', label: 'Advance Rogue Lite delves', goal: 1, xp: 450, weeklyMult: 3 },
        { id: 'ow_quests', kind: 'owrpg_quests', label: 'Advance Operation Meridian quest stages', goal: 1, xp: 420, weeklyMult: 3 },
        { id: 'sv_play', kind: 'survival_runs', label: 'Deploy to the Exclusion Zone', goal: 1, xp: 420, weeklyMult: 2 }
    ];

    const PROFILE_DEFAULTS = {
        level: 1,
        xp: 0,
        totalXp: 0,
        callingCard: 'card_blackout',
        emblem: 'emb_star',
        title: 'OPERATIVE',
        unlockedCards: ['card_blackout'],
        unlockedEmblems: ['emb_star'],
        unlockedTitles: ['OPERATIVE'],
        unlockedRewards: [],
        challengesCompleted: 0,
        lastMode: null,
        lastMapId: null,
        lastPlayedAt: 0,
        onboardingDone: false,
        challenges: { dailyKey: '', daily: [], weeklyKey: '', weekly: [] },
        campaign: { completed: {}, activeMissionId: null, choices: {} }
    };

    const ProfileSystem = {
        CALLING_CARDS,
        EMBLEMS,
        TITLES,
        MAX_LEVEL: 100,
        _hooked: false,

        init() {
            if (this._hooked) return;
            this._hooked = true;
            try { BO.Save?.assertSliceOwner?.('profile', 'ProfileSystem'); } catch (e) { console.warn(e); }
            this.getState();
            this._ensureChallenges();
            this._bindEvents();
        },

        xpForLevel(lv) {
            return Math.round(500 + Math.max(0, lv - 1) * 140);
        },

        getState() {
            const data = BO.Save?.data;
            if (!data) return Object.assign({}, PROFILE_DEFAULTS);
            if (!data.profile || typeof data.profile !== 'object') {
                data.profile = JSON.parse(JSON.stringify(PROFILE_DEFAULTS));
            }
            const p = data.profile;
            for (const [k, v] of Object.entries(PROFILE_DEFAULTS)) {
                if (p[k] === undefined) p[k] = typeof v === 'object' && v !== null ? JSON.parse(JSON.stringify(v)) : v;
            }
            return p;
        },

        save() { BO.Save?.save?.(); },

        grantXp(amount, source = 'mode') {
            const gain = Math.max(0, Math.round(Number(amount) || 0));
            if (!gain) return 0;
            const p = this.getState();
            p.xp += gain;
            p.totalXp += gain;
            let leveled = 0;
            while (p.level < this.MAX_LEVEL && p.xp >= this.xpForLevel(p.level)) {
                p.xp -= this.xpForLevel(p.level);
                p.level++;
                leveled++;
            }
            if (p.level >= 5) this.unlockCosmetic('title', 'PATHFINDER');
            if (p.level >= 10) {
                this.unlockCosmetic('card', 'card_arsenal');
                this.unlockCosmetic('title', 'QUARTERMASTER');
            }
            if (p.level >= 25) {
                this.unlockCosmetic('card', 'card_veteran');
                this.unlockCosmetic('title', 'COMMANDER');
            }
            this.save();
            BO.Events?.emit?.('profile:updated', { level: p.level, leveled, gain, source });
            if (leveled > 0) {
                BO.Sound?.playPerkBuy?.();
                BO.Events?.emit?.('hud:toast', { text: `ACCOUNT LEVEL UP: LV ${p.level}`, color: '#ffb23f' });
            }
            return leveled;
        },

        unlockCosmetic(slot, id, notify = false) {
            const p = this.getState();
            const map = { card: 'unlockedCards', emblem: 'unlockedEmblems', title: 'unlockedTitles' };
            const key = map[slot];
            if (!key) return false;
            if (!Array.isArray(p[key])) p[key] = [];
            if (p[key].includes(id)) return false;
            p[key].push(id);
            this.save();
            if (notify) BO.Events?.emit?.('hud:toast', { text: `UNLOCKED ${slot.toUpperCase()}: ${id}`, color: '#4ade80' });
            return true;
        },

        equipCosmetic(slot, id) {
            const p = this.getState();
            if (slot === 'card' && p.unlockedCards.includes(id)) p.callingCard = id;
            else if (slot === 'emblem' && p.unlockedEmblems.includes(id)) p.emblem = id;
            else if (slot === 'title' && p.unlockedTitles.includes(id)) p.title = id;
            else return false;
            this.save();
            BO.Events?.emit?.('profile:updated', p);
            return true;
        },

        _ensureChallenges() {
            const p = this.getState();
            const dKey = new Date().toISOString().slice(0, 10);
            const wKey = isoWeekKey();
            let dirty = false;

            if (!p.challenges || typeof p.challenges !== 'object') {
                p.challenges = { dailyKey: '', daily: [], weeklyKey: '', weekly: [] };
            }
            if (p.challenges.dailyKey !== dKey || !Array.isArray(p.challenges.daily) || p.challenges.daily.length !== 3) {
                p.challenges.dailyKey = dKey;
                p.challenges.daily = this._pickChallenges('D:' + dKey, 3, false);
                dirty = true;
            }
            if (p.challenges.weeklyKey !== wKey || !Array.isArray(p.challenges.weekly) || p.challenges.weekly.length !== 5) {
                p.challenges.weeklyKey = wKey;
                p.challenges.weekly = this._pickChallenges('W:' + wKey, 5, true);
                dirty = true;
            }
            if (dirty) this.save();
            return p.challenges;
        },

        _pickChallenges(seedKey, count, weekly) {
            const pool = CHALLENGE_TEMPLATES.slice();
            let h = fnv1a(seedKey);
            for (let i = pool.length - 1; i > 0; i--) {
                h = fnv1a(seedKey + ':' + h + ':' + i);
                const j = h % (i + 1);
                const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
            }
            return pool.slice(0, count).map((tpl) => ({
                id: `${weekly ? 'w' : 'd'}_${tpl.id}`,
                kind: tpl.kind,
                label: tpl.label,
                goal: weekly ? tpl.goal * tpl.weeklyMult : tpl.goal,
                progress: 0,
                xp: weekly ? tpl.xp * 3 : tpl.xp,
                claimed: false
            }));
        },

        getChallenges() {
            return this._ensureChallenges();
        },

        progressChallengeKind(kind, amount = 1) {
            const ch = this._ensureChallenges();
            let changed = false;
            for (const list of [ch.daily, ch.weekly]) {
                for (const c of list) {
                    if (c.claimed) continue;
                    if (c.kind === kind || c.kind === 'matches') {
                        const next = Math.min(c.goal, (c.progress || 0) + amount);
                        if (next !== c.progress) { c.progress = next; changed = true; }
                    }
                }
            }
            if (changed) this.save();
        },

        claimChallenge(id) {
            const ch = this._ensureChallenges();
            for (const list of [ch.daily, ch.weekly]) {
                const c = list.find((x) => x.id === id);
                if (c && !c.claimed && (c.progress || 0) >= c.goal) {
                    c.claimed = true;
                    const p = this.getState();
                    p.challengesCompleted = (p.challengesCompleted || 0) + 1;
                    if (p.challengesCompleted >= 5) {
                        this.unlockCosmetic('card', 'card_coop', true);
                        this.unlockCosmetic('emblem', 'emb_bolt');
                    }
                    this.grantXp(c.xp, 'challenge');
                    BO.Sound?.playPerkBuy?.();
                    return c.xp;
                }
            }
            return 0;
        },

        getArmoryCatalog() {
            const order = BO.WeaponsData?.ORDER || [];
            const get = BO.WeaponsData?.get;
            return order.map((id) => {
                const spec = get ? get(id) : null;
                const rec = BO.Save?.getWeaponRecord?.(id) || { xp: 0, level: 1, kills: 0, unlockedCamos: ['default'] };
                return {
                    id,
                    name: spec?.name || id,
                    category: spec?.category || 'Weapon',
                    tier: spec?.tier || 'common',
                    damage: spec?.damage || 0,
                    rpm: spec?.rpm || 0,
                    level: rec.level || 1,
                    kills: rec.kills || 0,
                    camos: (rec.unlockedCamos || ['default']).length
                };
            });
        },

        getModeSummaries() {
            const d = BO.Save?.data || {};
            const st = d.stats || {};
            const zRecs = d.zombiesRecords || {};
            let bestZ = 0;
            for (const r of Object.values(zRecs)) bestZ = Math.max(bestZ, r.round || 0);
            for (const v of Object.values(st.highestRoundByMap || {})) bestZ = Math.max(bestZ, v || 0);
            const mgBest = Object.values(d.minigames?.best || {});
            const mgStars = mgBest.reduce((s, r) => s + (r?.stars || 0), 0);
            const owSlots = BO.OWRPGSave?.list ? BO.OWRPGSave.list().filter(Boolean) : (d.owrpg?.slots || []).filter(Boolean);
            const bestOwLvl = owSlots.reduce((m, s) => Math.max(m, s.level || (s.player?.level || 0)), 0);
            const rpgDeep = Number(BO.RPGProfile?.data?.deepest || d.rpg?.deepest || 0);
            const tdWave = Number(st.tdBestWave || 0);
            const svEndings = Number(d.survivalCareer?.endings ? Object.keys(d.survivalCareer.endings).length : 0);

            return {
                zombies: bestZ > 0 ? `BEST ROUND ${bestZ}` : `${st.zombiesKills || 0} KILLS`,
                mp: `${st.mpWins || 0} WINS · ${st.mpKills || 0} KILLS`,
                survival: svEndings > 0 ? `${svEndings} ENDINGS CLEARED` : 'READY TO DEPLOY',
                rpg: rpgDeep > 0 ? `DEEPEST FLOOR ${rpgDeep}` : 'HAVEN READY',
                owrpg: bestOwLvl > 0 ? `OPERATIVE LV ${bestOwLvl}` : 'ACT I–VI READY',
                td: tdWave > 0 ? `BEST WAVE ${tdWave}` : '3 CASTLES',
                minigames: mgStars > 0 ? `${mgStars} STARS EARNED` : '63 COURSES'
            };
        },

        markOnboardingDone() {
            const p = this.getState();
            p.onboardingDone = true;
            this.save();
        },

        _bindEvents() {
            const onModeStart = (d) => {
                if (!d || !d.mode) return;
                const p = this.getState();
                p.lastMode = d.mode;
                p.lastMapId = d.mapId || null;
                p.lastPlayedAt = Date.now();
                if (d.mode === 'survival') this.progressChallengeKind('survival_runs', 1);
                this.save();
            };

            const onMatchEnded = (rep) => {
                if (!rep) return;
                if (rep.mode === 'zombies') {
                    this.grantXp(120 + (rep.round || 1) * 35 + (rep.victory ? 250 : 0), 'zombies');
                    this.progressChallengeKind('zombies_kills', Math.max(1, rep.kills || 1));
                    if ((rep.round || 0) >= 10) {
                        this.unlockCosmetic('card', 'card_zombies_slayer', true);
                        this.unlockCosmetic('emblem', 'emb_skull');
                        this.unlockCosmetic('title', 'HORDE BREAKER');
                    }
                } else if (rep.mode === 'mp') {
                    this.grantXp(150 + (rep.kills || 0) * 18 + (rep.victory ? 220 : 0), 'mp');
                    this.progressChallengeKind('mp_kills', Math.max(1, rep.kills || 1));
                    if ((BO.Save?.data?.stats?.mpWins || 0) >= 3) {
                        this.unlockCosmetic('card', 'card_mp_ace', true);
                        this.unlockCosmetic('emblem', 'emb_crosshair');
                        this.unlockCosmetic('title', 'ARENA ACE');
                    }
                } else if (rep.mode === 'td') {
                    const st = BO.Save?.data?.stats;
                    if (st) st.tdBestWave = Math.max(st.tdBestWave || 0, rep.wave || 0);
                    this.grantXp(140 + (rep.wave || 1) * 45 + (rep.victory ? 240 : 0), 'td');
                    this.progressChallengeKind('td_waves', Math.max(1, rep.wave || 1));
                    if ((rep.wave || 0) >= 5) {
                        this.unlockCosmetic('card', 'card_td_bastion', true);
                        this.unlockCosmetic('emblem', 'emb_shield');
                        this.unlockCosmetic('title', 'SIEGE WARDEN');
                    }
                } else {
                    this.grantXp(150, rep.mode || 'match');
                }
            };

            if (BO.Events) {
                BO.Events.on('match:ended', onMatchEnded);
                BO.Events.on('owrpg:quest', (ev) => {
                    this.progressChallengeKind('owrpg_quests', 1);
                    if (ev?.kind === 'completed') {
                        this.grantXp(180, 'owrpg');
                        this.unlockCosmetic('card', 'card_meridian');
                        this.unlockCosmetic('emblem', 'emb_compass');
                        this.unlockCosmetic('title', 'MERIDIAN RANGER');
                    }
                });
            }

            if (typeof document !== 'undefined') {
                document.addEventListener('game:modeStart', (e) => onModeStart(e.detail));
                document.addEventListener('game:survivalEnding', () => {
                    this.grantXp(450, 'survival');
                    this.unlockCosmetic('card', 'card_zone_lantern', true);
                    this.unlockCosmetic('emblem', 'emb_lantern');
                    this.unlockCosmetic('title', 'ZONE SURVIVOR');
                });
                document.addEventListener('game:minigameDaily', () => {
                    this.grantXp(220, 'minigames_daily');
                    this.progressChallengeKind('minigame_runs', 1);
                    this.unlockCosmetic('card', 'card_sharpshooter', true);
                    this.unlockCosmetic('emblem', 'emb_trophy');
                    this.unlockCosmetic('title', 'MARKSMAN');
                });
            }
        }
    };

    BO.ProfileSystem = ProfileSystem;
    ProfileSystem.init();
})(window);
