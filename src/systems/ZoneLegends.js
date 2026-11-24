/* ============================================================================
   BLACKOUT OPS — The full roster, legendary hunts and the Pit Masters
   · Every infected type (70) now walks the Zone: the weakest first, harder
     ones joining the pool day by day (or all at once with a sandbox option).
   · Legendary hunts: twelve bosses that only appear after you meet their
     criteria (kills, hunting, cooking, mining, dungeons, vehicles…).
   · Pit Masters: NPCs who offer a boss duel. Say yes and you are taken to the
     arena; win and a portal home opens, with a reward chest and time to loot.
============================================================================ */
(function (BO) {
    'use strict';

    const LEGENDS = [
        { id: 'ravenous', name: 'The Ravenous', spec: 'boss_butcher', need: (c) => [c.metrics.kills || 0, 60], how: 'Kill 60 infected. The noise draws it.' },
        { id: 'lumberjack', name: 'The Lumberjack', spec: 'boss_butcher', need: (c) => [c.metrics.treesFelled || 0, 35], how: 'Fell 35 trees. It does not like what you are doing to its forest.' },
        { id: 'pyre', name: 'The Pyre Hound', spec: 'boss_cerberus', need: (c) => [c.metrics.meals || 0, 12], how: 'Cook 12 meals. It follows the smell of cooking.' },
        { id: 'matriarch', name: 'The Grand Matriarch', spec: 'boss_witch_queen', need: (c) => [c.metrics.puzzles || 0, 3], how: 'Solve 3 dungeon puzzles.' },
        { id: 'bride', name: 'The Night Bride', spec: 'boss_witch_queen', need: (c) => [c.metrics.nightKills || 0, 40], how: 'Kill 40 infected at night. Appears only at night.', night: true },
        { id: 'plague', name: 'Dr. Plague', spec: 'boss_plague', need: (c) => [c.metrics.secured || 0, 10], how: 'Secure 10 infested sites.' },
        { id: 'colossus', name: 'The Iron Colossus', spec: 'boss_colossus', need: (c) => [(c.metrics.vehiclesClaimed || 0) + (c.metrics.vehiclesBuilt || 0), 3], how: 'Claim or build 3 vehicles. It hunts engines.' },
        { id: 'apex', name: 'The Apex', spec: 'boss_manbearpig', need: (c) => [c.metrics.hunted || 0, 15], how: 'Hunt 15 animals. Something bigger hunts the hunter.' },
        { id: 'lycan', name: 'The Lycanthrope King', spec: 'boss_lycan_king', need: (c) => [c.metrics.hunt_wolf || 0, 6], how: 'Kill 6 wolves. Appears only at night.', night: true },
        { id: 'ogre', name: 'The Ogre Emperor', spec: 'boss_ogre_emperor', need: (c) => [c.metrics.oreHarvests || 0, 30], how: 'Mine 30 ore deposits.' },
        { id: 'hydra', name: 'The Hydra of the Deep', spec: 'boss_hydra_matron', need: (c) => [c.metrics.dungeonsCleared || 0, 3], how: 'Clear 3 dungeons.' },
        { id: 'nyx', name: 'Overlord Nyx', spec: 'boss_nyx', need: (c) => [c.metrics.legends || 0, 6], how: 'Defeat 6 other legendary bosses.' },
        { id: 'kronos', name: 'Kronos, Titan Colossus', spec: 'super_titan_colossus', need: (c) => [c.metrics.kills || 0, 110], how: 'Colossal Super Boss · Slay 110 infected in the Zone.' },
        { id: 'seraphim', name: 'Seraphim Nexus', spec: 'super_seraph_harbinger', need: (c) => [c.metrics.secured || 0, 6], how: 'Colossal Super Boss · Secure 6 infested or siege sites.' },
        { id: 'leviathan', name: 'Leviathan Hydra-Rex', spec: 'super_hydra_behemoth', need: (c) => [c.metrics.dungeonsCleared || 0, 2], how: 'Colossal Super Boss · Clear 2 Zone dungeons.' },
        { id: 'valkyr', name: 'Valkyr-09 Dreadnought', spec: 'super_dreadnought_mech', need: (c) => [c.metrics.pmc || 0, 12], how: 'Colossal Super Boss · Eliminate 12 PMC patrol soldiers.' },
        { id: 'malakor', name: 'Malakor, Eclipse Sovereign', spec: 'super_void_sovereign', need: (c) => [c.metrics.legends || 0, 8], how: 'Apex Super Boss · Defeat 8 Legendary Hunts. Appears at night.', night: true }
    ];

    const PIT_MASTERS = [
        { id: 'varga', name: 'Pit Master Varga', at: () => ({ x: BO.Zone.HAVEN.x + 6, z: BO.Zone.HAVEN.z - 4 }), line: '"Fancy yourself a fighter? I keep something in a cage for people like you."' },
        { id: 'oleg', name: 'Pit Master Oleg', poi: 'pharmacy', line: '"Ten bosses. One arena. Nobody has seen the tenth and lived."' },
        { id: 'mae', name: 'Pit Master Mae', poi: 'boathouse', line: '"You look bored. Let me fix that."' }
    ];

    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    class ZoneLegends {
        constructor() { this.state = {}; }
        get campaign() { return this.mode?.campaign; }

        /* ------------------------------------------------------------ install: full roster */
        static install() {
            if (ZoneLegends._installed) return;
            ZoneLegends._installed = true;
            const Z = BO.Zone;
            const ZD = BO.ZombiesData;
            Z.bestiary = () => ZD.ORDERED_PROGRESSION.filter(Boolean);
            const C = BO.SurvivalCampaign.prototype;
            const KEY = {
                crash: 'shambler|ankle_biter', relay: 'shambler|ankle_biter|sprinter', hollow: 'shambler|hunch_spitter|one_arm_ripper',
                kessel: 'shield|juggernaut|goliath|charger', pine: 'stalker|sprinter|ripper|wolf|lycan', spillway: 'waddler|bloater|spitter|drown|swamp',
                frost: 'goliath|frost|ice|yeti|charger', cinder: 'bloater|charger|juggernaut|fire|ember|lava', campus: 'stalker|shield|juggernaut|lab|mutant', crater: 'juggernaut|goliath|stalker|void'
            };
            C.getPool = function (area) {
                const all = this.roster;
                const day = this.mode.threat?.day || this.day;
                const tierBoost = Math.max(0, (BO.Zone.REGIONS.find((r) => r.id === area)?.threat || 1) - 1);
                const n = this.has('sv_all_enemies') ? all.length : Math.min(all.length, 8 + (day - 1) * 6 + tierBoost * 3);
                const allowed = all.slice(0, Math.max(1, n));
                const kw = KEY[area] ? new RegExp(KEY[area], 'i') : null;
                const preferred = kw ? allowed.filter((z) => kw.test(z.id) || kw.test(z.name || '')) : [];
                // Region favourites are doubled; the newest unlocks are always in the mix.
                return [...allowed, ...preferred, ...allowed.slice(-4)];
            };
            const canSave = C.canSave;
            C.canSave = function () { return canSave.call(this) && !BO.ZoneDungeons?.inside && !BO.ZoneLegends?.arena; };
        }

        start(mode, saved) {
            ZoneLegends.install();
            this.stop();
            this.mode = mode;
            this.state = JSON.parse(JSON.stringify(saved?.state || {}));
            this.ladder = saved?.ladder || 0;
            this.lastDay = mode.campaign.day;
            this.unlockedSeen = this.unlockedCount();
            this.objects = [];
            this.arena = null;
            this.dialog = null;
            this.legendClock = 6;
            if (!mode.campaign.has('sv_no_npcs')) for (const pm of PIT_MASTERS) this.placeNpc(pm);
        }

        stop() {
            if (this.arena) this.leaveArena(true);
            this.closeDialog(true);
            for (const o of this.objects || []) o.removeFromParent?.();
            this.objects = [];
            for (const L of LEGENDS) { const e = this.state[L.id]?.entity; if (e?.alive) { e.alive = false; e.despawned = true; e.deathTimer = 0; if (e.parts?.root) e.parts.root.visible = false; } }
            this.mode = null;
        }

        snapshot() {
            const st = {};
            for (const [k, v] of Object.entries(this.state)) st[k] = { s: v.s === 'spawned' ? 'met' : v.s };
            return { state: st, ladder: this.ladder };
        }

        unlockedCount() {
            const c = this.campaign;
            return c ? c.getPool(c.area?.id || 'crash').filter((v, i, a) => a.indexOf(v) === i).length : 0;
        }

        /* ------------------------------------------------------------ legendary hunts */
        legendStatus() {
            const c = this.campaign;
            return LEGENDS.map((L) => {
                let cur = 0, need = 1;
                try { [cur, need] = L.need(c); } catch (_) { /* metric missing */ }
                return { ...L, cur: Math.min(cur, need), need, s: this.state[L.id]?.s || 'locked' };
            });
        }

        updateLegends(dt) {
            const m = this.mode, c = this.campaign;
            this.legendClock -= dt;
            if (this.legendClock > 0) return;
            this.legendClock = 3;
            if (!m.hostilesReleased || BO.ZoneDungeons?.inside || this.arena || BO.ZoneFinale?.active || !BO.Player.alive) return;
            for (const L of this.legendStatus()) {
                const st = this.state[L.id] || (this.state[L.id] = { s: 'locked' });
                if (st.s === 'dead') continue;
                if (st.s === 'locked' && L.cur >= L.need) {
                    st.s = 'met';
                    st.at = m.clock + 20;
                    BO.Events.emit('hud:banner', { title: 'LEGENDARY HUNT', sub: L.name.toUpperCase() + ' HAS TAKEN NOTICE OF YOU', color: '#ff6b5b' });
                    BO.Sound?.playBossIntro?.();
                }
                if (st.s === 'met' && m.clock >= (st.at || 0) && (!L.night || c.isNight)) this.spawnLegend(L, st);
                if (st.s === 'spawned') {
                    const e = st.entity;
                    if (!e || e.despawned) { st.s = 'met'; st.at = m.clock + 60; }
                    else if (!e.alive && e.hp <= 0) this.legendDown(L, st);
                }
            }
        }

        spawnLegend(L, st) {
            const m = this.mode;
            const p = BO.Player.pos;
            const nav = BO.World.nav;
            let spot = null;
            for (let t = 0; t < 20 && !spot; t++) {
                const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 20;
                const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
                const j = nav?.idx(x, z) ?? -1;
                if (j >= 0 && nav.walk[j]) spot = { x, z, y: nav.y[j] };
            }
            if (!spot) return;
            const idx = LEGENDS.indexOf(L);
            const zb = m.spawnInfected(spot.x, BO.World.getGroundHeight(spot.x, spot.z, spot.y + 2), spot.z, 'normal', L.spec, true);
            if (!zb) return;
            zb.legend = L.id;
            zb.bossLabel = L.name;
            zb.maxHp = zb.hp = Math.round((1300 + idx * 320) * (m.tierSpec?.hp || 1) * (m.difficultyRules?.hp || 1));
            zb.damage = Math.round((28 + idx * 3) * (m.difficultyRules?.damage || 1));
            zb.speed = 2.9;
            zb.zs = { state: 'hunt', home: { x: spot.x, z: spot.z }, x: spot.x, z: spot.z, until: 0, seen: m.clock, wander: 0 };
            st.s = 'spawned';
            st.entity = zb;
            m.refreshTargets();
            BO.Events.emit('hud:banner', { title: L.name.toUpperCase(), sub: 'LEGENDARY BOSS · IT IS COMING FOR YOU', color: '#ff6b5b' });
        }

        legendDown(L, st) {
            const m = this.mode;
            st.s = 'dead';
            const pos = st.entity.pos.clone();
            st.entity = null;
            m.campaign.mark('legends', 1, 0);
            BO.ZoneThrill?.xp(400, 'Legend slain');
            m.campaign.pack.dropBag({ medkits: 3, gold: 2, ammo556: 40, ammo762: 30, relic: 1 }, pos);
            const pool = BO.ZoneLoot.WEAPON_POOLS[4];
            const wid = pool[Math.floor(Math.random() * pool.length)];
            m.loot.dropPickup(wid, 100, pos, BO.WeaponsData.get(wid)?.name, BO.ZoneThrill?.rollWeapon(wid, 4, 4) || null);
            BO.Events.emit('hud:banner', { title: 'LEGEND SLAIN', sub: L.name.toUpperCase() + ' · LEGENDARY WEAPON DROPPED', color: '#ffb43a' });
        }

        /* ------------------------------------------------------------ roster unlock news */
        updateRoster() {
            const c = this.campaign;
            if (c.day === this.lastDay) return;
            this.lastDay = c.day;
            const n = this.unlockedCount();
            if (n > this.unlockedSeen) {
                const fresh = c.roster.slice(this.unlockedSeen, n).map((z) => z.name).slice(0, 4);
                this.mode.toast('New infected now roam the Zone: ' + fresh.join(', ') + (n - this.unlockedSeen > 4 ? ' and ' + (n - this.unlockedSeen - 4) + ' more' : '') + '.');
                this.unlockedSeen = n;
            }
        }

        /* ------------------------------------------------------------ Pit Masters */
        placeNpc(pm) {
            const m = this.mode;
            let at = pm.at?.();
            if (!at) { const poi = BO.Zone.pois.find((p) => p.type === pm.poi); if (!poi) return; at = { x: poi.x + poi.w / 2 + 2, z: poi.z + poi.d / 2 + 2 }; }
            const y = BO.World.getGroundHeight(at.x, at.z, BO.World.terrainHeight(at.x, at.z) + 2);
            const g = new THREE.Group();
            const mat = (c) => new THREE.MeshStandardMaterial({ color: new THREE.Color(c).convertSRGBToLinear(), roughness: 0.8 });
            const add = (w, h, d, c, x, yy, z) => { const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)); mesh.position.set(x, yy, z); mesh.castShadow = true; g.add(mesh); return mesh; };
            add(0.5, 0.75, 0.3, 0x3a3228, 0, 1.15, 0); add(0.3, 0.3, 0.3, 0xd8b090, 0, 1.72, 0); add(0.55, 0.1, 0.32, 0xb02a2a, 0, 1.48, 0);
            add(0.18, 0.8, 0.2, 0x2a2a2a, -0.12, 0.4, 0); add(0.18, 0.8, 0.2, 0x2a2a2a, 0.12, 0.4, 0);
            add(0.12, 0.7, 0.12, 0x3a3228, -0.33, 1.1, 0); add(0.12, 0.7, 0.12, 0x3a3228, 0.33, 1.1, 0);
            const sign = add(0.5, 0.5, 0.05, 0xffb43a, 0, 2.45, 0);
            sign.material.emissive = new THREE.Color(0xff8a20); sign.material.emissiveIntensity = 1;
            g.position.set(at.x, y, at.z);
            m.scene.add(g);
            this.objects.push(g);
            m.markers.push({ id: 'pit:' + pm.id, x: at.x, y, z: at.z, name: pm.name, label: 'Talk to ' + pm.name + ' (boss duels)', alive: true, pit: pm, reach: 2.6 });
        }

        bosses() {
            return BO.ZombiesData.ORDERED_BOSSES.map((b, i) => ({ id: b.id, name: b.name.replace(/\b\w+/g, (w) => w[0] + w.slice(1).toLowerCase()), rank: i, hp: Math.round((1500 + i * 650) * (this.mode.tierSpec?.hp || 1)), beaten: i < this.ladder, open: i <= this.ladder || this.campaign.has('sv_all_unlocks') }));
        }

        openDialog(pm, confirm = null) {
            this.dialog = { pm, confirm };
            if (document.pointerLockElement) document.exitPointerLock();
            if (!this.dlgEl) {
                this.dlgEl = document.createElement('div');
                this.dlgEl.className = 'zt-box zt-dlg';
                document.body.appendChild(this.dlgEl);
                this.dlgEl.addEventListener('click', (e) => this.dialogClick(e));
            }
            const list = this.bosses();
            const b = confirm !== null ? list[confirm] : null;
            this.dlgEl.innerHTML = b ? `<div class="zt-box-in zt-confirm"><header><b>${esc(pm.name)}</b></header>
                    <p class="zt-line">"So — <b>${esc(b.name)}</b>. ${b.hp} health and a temper. You sure?"</p>
                    <p class="sv-muted">You will be taken to the arena. Win and a portal home opens, with a reward chest and 90 seconds to loot. Use the portal early to forfeit.</p>
                    <div class="zt-yesno"><button data-dlg-yes="${confirm}">Yes — take me to the arena</button><button data-dlg-no>No, not yet</button></div></div>`
                : `<div class="zt-box-in"><header><b>${esc(pm.name)}</b><span>${esc(pm.line)}</span><button data-dlg-close>Leave · Esc</button></header>
                    <div class="zt-ladder">${list.map((x) => `<button data-dlg-pick="${x.rank}" ${x.open ? '' : 'disabled'} class="${x.beaten ? 'beaten' : ''}"><em>${x.rank + 1}</em><b>${esc(x.name)}</b><small>${x.beaten ? 'Beaten · fight again' : x.open ? x.hp + ' HP · reward: Epic+ weapon' : 'Beat the previous boss first'}</small></button>`).join('')}</div></div>`;
        }

        dialogClick(e) {
            const t = e.target.closest('button');
            if (!t || !this.dialog) return;
            const d = t.dataset;
            if (d.dlgClose !== undefined) return this.closeDialog();
            if (d.dlgNo !== undefined) return this.openDialog(this.dialog.pm);
            if (d.dlgPick !== undefined) return this.openDialog(this.dialog.pm, +d.dlgPick);
            if (d.dlgYes !== undefined) { const rank = +d.dlgYes; this.closeDialog(true); this.enterArena(rank); BO.App?._safePointerLock?.(); }
        }

        closeDialog(silent) {
            if (!this.dialog) return;
            this.dialog = null;
            this.dlgEl?.remove();
            this.dlgEl = null;
            if (!silent && BO.State.screen === 'playing') BO.App?._safePointerLock?.();
        }

        handleKey(e) {
            if (!this.dialog) return false;
            if (e.code === 'Escape') { e.preventDefault(); this.closeDialog(); }
            return true;
        }

        /* ------------------------------------------------------------ the arena */
        enterArena(rank) {
            const m = this.mode;
            if (this.arena || BO.ZoneDungeons?.inside) return;
            const b = this.bosses()[rank];
            const ox = 6000, oz = 0, R = 22, H = 7;
            const sp = new BO.ZoneSpace(m, ox, oz, 0x6a5a4a);
            sp.box(ox, -0.25, oz, R * 2 + 1, 0.5, R * 2 + 1, 0x7a6a52);
            for (const [x, z, w, d] of [[ox - R, oz, 0.6, R * 2], [ox + R, oz, 0.6, R * 2], [ox, oz - R, R * 2, 0.6], [ox, oz + R, R * 2, 0.6]]) sp.box(x, H / 2, z, w, H, d, 0x5a4a3a);
            for (let i = 0; i < 8; i++) {
                const a = i / 8 * Math.PI * 2;
                const x = ox + Math.cos(a) * (R - 5), z = oz + Math.sin(a) * (R - 5);
                sp.box(x, 2.5, z, 1.4, 5, 1.4, 0x8a7a62);
                sp.box(x, 5.3, z, 0.6, 0.6, 0.6, 0xff8a20, false, { emissive: new THREE.Color(0xff7a10), emissiveIntensity: 1.6 });
            }
            const p = BO.Player;
            const wait = m.campaign.has('sv_no_cooldowns') ? 0.3 : 3;
            this.arena = { rank, b, sp, ret: { x: p.pos.x, y: p.pos.y, z: p.pos.z }, start: m.clock + wait, boss: null, won: false, portalAt: 0 };
            this.light = this.light || new THREE.PointLight(0xffc890, 1.2, 40, 1.4);
            this.light.position.set(ox, 9, oz);
            m.scene.add(this.light);
            p.pos.set(ox, 0.1, oz - R + 3);
            p.vel.set(0, 0, 0);
            p.yaw = Math.PI;
            BO.Events.emit('hud:banner', { title: 'THE ARENA', sub: b.name.toUpperCase() + ' · FIGHT BEGINS IN 3', color: '#ff6b5b' });
            m.campaign.mark('arenaFights', 1, 0);
        }

        updateArena(dt) {
            const A = this.arena, m = this.mode;
            if (!A) return;
            A.sp.tick?.(dt, m.clock);
            const p = BO.Player;
            if (!p.alive) return;
            if (Math.abs(p.pos.x - A.sp.ox) > 60) { this.leaveArena(true); return; }
            if (p.pos.y < -20) { p.pos.set(A.sp.ox, 0.2, A.sp.oz); p.vel.set(0, 0, 0); }
            if (!A.boss && !A.won && m.clock >= A.start) {
                const zb = m.spawnInfected(A.sp.ox, 0.05, A.sp.oz + 14, 'normal', A.b.id, true);
                if (zb) {
                    zb.arena = true;
                    zb.bossLabel = A.b.name;
                    zb.maxHp = zb.hp = Math.round(A.b.hp * (m.difficultyRules?.hp || 1));
                    zb.damage = Math.round((28 + A.rank * 5) * (m.difficultyRules?.damage || 1));
                    zb.speed = 2.6 + A.rank * 0.08;
                    zb.zs = { state: 'hunt', home: { x: A.sp.ox, z: A.sp.oz }, x: A.sp.ox, z: A.sp.oz, until: 0, seen: m.clock, wander: 0 };
                    A.boss = zb;
                    m.refreshTargets();
                    BO.Sound?.playBossIntro?.();
                    BO.Events.emit('hud:banner', { title: 'FIGHT!', sub: A.b.name.toUpperCase(), color: '#ff6b5b' });
                }
            }
            if (A.boss && !A.won && !A.boss.alive && A.boss.hp <= 0) {
                A.won = true;
                A.portalAt = m.clock + 90;
                if (A.rank >= this.ladder) this.ladder = A.rank + 1;
                m.campaign.mark('arenaWins', 1, 0);
                BO.ZoneThrill?.xp(200 + A.rank * 60, 'Arena victory');
                const sp = A.sp;
                const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.15, 8, 28), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x8fe3c8).convertSRGBToLinear() }));
                ring.position.set(sp.ox, 1.6, sp.oz);
                m.scene.add(ring); sp.meshes.push(ring); sp.portals?.push(ring);
                sp.marker({ id: 'arenaportal', x: sp.ox, y: 0, z: sp.oz, name: 'Portal home', label: 'Step through the portal home', arenaExit: true, reach: 2.2 });
                sp.box(sp.ox + 4, 0.45, sp.oz, 1.5, 0.9, 1, 0x8a6a2a, true, { emissive: new THREE.Color(0xffb43a), emissiveIntensity: 0.4 });
                sp.marker({ id: 'arenachest', x: sp.ox + 4, y: 0, z: sp.oz - 1, name: 'Arena reward chest', label: 'Open the reward chest', arenaChest: true, reach: 2.2 });
                BO.Events.emit('hud:banner', { title: 'VICTORY', sub: A.b.name.toUpperCase() + ' DEFEATED · PORTAL HOME OPEN FOR 90 S', color: '#ffb43a' });
            }
            if (A.won && m.clock > A.portalAt) this.leaveArena();
        }

        arenaChest(mk) {
            const A = this.arena, m = this.mode;
            mk.alive = false;
            const tier = Math.min(4, 2 + Math.floor(A.rank / 3));
            const a = BO.ZoneLoot.roll('military_crate', tier);
            m.grant({ ...a.items, medkits: 2, gold: 1 + Math.floor(A.rank / 2) });
            const pool = BO.ZoneLoot.WEAPON_POOLS[tier];
            const wid = pool[Math.floor(Math.random() * pool.length)];
            m.loot.offerWeapon(wid, tier, BO.Player.pos, { floor: A.rank >= 6 ? 4 : 3 });
            if (BO.ZoneThrill) BO.ZoneThrill.rerolls++;
            BO.Sound?.playMysteryBoxJingle?.();
        }

        leaveArena(silent) {
            const A = this.arena;
            if (!A) return;
            if (A.boss?.alive) { A.boss.alive = false; A.boss.despawned = true; A.boss.deathTimer = 0; if (A.boss.parts?.root) A.boss.parts.root.visible = false; }
            A.sp.dispose();
            this.light?.removeFromParent();
            this.arena = null;
            if (!silent && BO.Player.alive) { BO.Player.pos.set(A.ret.x, A.ret.y + 0.2, A.ret.z); BO.Player.vel.set(0, 0, 0); this.mode.toast(A.won ? 'You step back into the Zone, victorious.' : 'You forfeit the duel.'); }
            this.mode.refreshTargets?.();
        }

        status() {
            const A = this.arena, m = this.mode;
            if (!A) return null;
            if (A.won) return { headline: 'Victory · portal home closes in ' + Math.max(0, Math.ceil(A.portalAt - m.clock)) + ' s', sub: 'Open the reward chest, loot the boss, then step through the portal' };
            if (!A.boss) return { headline: 'The arena · ' + A.b.name, sub: 'Get ready…' };
            return { headline: A.b.name + ' · ' + Math.ceil(A.boss.hp) + ' HP', sub: 'Arena duel · the portal opens when it falls' };
        }

        activate(mk) {
            if (mk?.pit) { this.openDialog(mk.pit); return true; }
            if (mk?.arenaExit) { this.leaveArena(); return true; }
            if (mk?.arenaChest) { this.arenaChest(mk); return true; }
            return false;
        }

        update(dt) {
            if (!this.mode?.active) return;
            this.updateRoster();
            this.updateLegends(dt);
            this.updateArena(dt);
        }
    }

    ZoneLegends.install();
    BO.ZoneLegends = new ZoneLegends();
    BO.ZoneLegends.LEGENDS = LEGENDS;
    BO.ZoneLegendsClass = ZoneLegends;
})(window.BO);
