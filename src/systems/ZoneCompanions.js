/* ============================================================================
   BLACKOUT OPS — Wild Zone Companions & Taming (BO.ZoneCompanions)
   · Tame wild Grey Wolves (Zone Hound), Wild Boars (Tusk Charger) and Brown
     Bears (Apex War-Bear) in the field, or recruit a Haven Vanguard ranger
     at Haven / from rescued distress survivors.
   · Tactical stances (KeyY / survCompanion): Follow & Fight · Heel (Stealth) · Guard Post
   · Ranks I–V progression, Tracker's Nose loot/intel pings, Pack Saddle carry
     bonus (+12 kg), feeding & petting, non-lethal downed recovery, and full
     checkpoint persistence.
============================================================================ */
(function (BO) {
    'use strict';

    const ARCHETYPES = {
        wolf: {
            id: 'wolf', name: 'Zone Hound', subtitle: 'Loyal Grey Wolf',
            hp: 240, speed: 7.8, dmg: 36, rate: 0.95, range: 2.1,
            color: 0x737882, accent: 0x8fe3c8,
            treats: [['cooked_venison', 2], ['cooked_beef', 2], ['cooked_pork', 2], ['bone', 1], ['raw_venison', 1], ['raw_pork', 1]],
            need: 2,
            perk: 'Tracker\'s Nose: pings nearby unsearched crates, intel & drops every 18 s.'
        },
        boar: {
            id: 'boar', name: 'Tusk Charger', subtitle: 'Armoured Wild Boar',
            hp: 330, speed: 6.8, dmg: 44, rate: 1.15, range: 2.2, stun: 1.35, carryBonus: 12,
            color: 0x4f3e34, accent: 0xf2b45a,
            treats: [['berry_pie', 2], ['roast_mushroom', 2], ['berries', 1], ['mushroom', 1]],
            need: 2,
            perk: 'Pack Saddle (+12 kg carry limit) & knockdown tusk charge.'
        },
        bear: {
            id: 'bear', name: 'Apex War-Bear', subtitle: 'Tamed Grizzly',
            hp: 580, speed: 6.1, dmg: 68, rate: 1.35, range: 2.6, cleave: 2.5,
            color: 0x4c3322, accent: 0xff8a3a,
            treats: [['honey_ham', 3], ['cooked_fish', 2], ['honey', 2], ['raw_fish', 1]],
            need: 3,
            perk: 'Crushing cleave swipe & high-health tank against bosses and hordes.'
        },
        ranger: {
            id: 'ranger', name: 'Haven Vanguard', subtitle: 'Suppressed Scout',
            hp: 300, speed: 6.9, dmg: 34, rate: 0.58, range: 26, ranged: true,
            color: 0x3b4d3e, accent: 0x7ee8fa,
            treats: [], need: 1,
            perk: 'Fires suppressed 5.56 bursts from range without drawing Zone-wide noise.'
        }
    };

    const STANCES = [
        { id: 'follow', label: 'FOLLOW & FIGHT', desc: 'Follows your flank and engages nearby hostiles.' },
        { id: 'stealth', label: 'HEEL / STEALTH', desc: 'Stays close and holds attacks unless you are struck.' },
        { id: 'guard', label: 'GUARD POST', desc: 'Anchors here and defends a 22 m perimeter.' }
    ];

    const HEAL_FOODS = ['cooked_bear', 'cooked_beef', 'cooked_venison', 'cooked_pork', 'cooked_fish', 'cooked_mutton', 'cooked_fowl', 'cooked_rabbit', 'jerky', 'rations', 'canned'];
    const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

    class ZoneCompanions {
        constructor() {
            this.mode = null;
            this.comp = null;
            this.tameMarkers = new Map();
            this.objects = [];
            this.postMarker = null;
            this.pingClock = 10;
        }

        get campaign() { return this.mode?.campaign; }
        get active() { return !!this.comp; }

        start(mode, saved) {
            this.stop();
            this.mode = mode;
            this.installOnce();
            this.placeVanguardPost();
            if (saved?.comp) {
                const c = saved.comp;
                this.spawnCompanion(c.kind, c.pos || { x: BO.Player.pos.x + 2, y: BO.Player.pos.y, z: BO.Player.pos.z + 2 }, c, true);
            }
        }

        stop() {
            this.dismiss(true);
            for (const mk of this.tameMarkers.values()) mk.alive = false;
            this.tameMarkers.clear();
            for (const o of this.objects) o.removeFromParent?.();
            this.objects = [];
            this.postMarker = null;
            this.mode = null;
        }

        snapshot() {
            if (!this.comp) return null;
            const c = this.comp;
            return {
                comp: {
                    kind: c.kind, name: c.name, rank: c.rank, xp: c.xp,
                    hp: Math.round(c.hp), downed: c.downed,
                    stance: c.stance,
                    pos: { x: +c.pos.x.toFixed(2), y: +c.pos.y.toFixed(2), z: +c.pos.z.toFixed(2) },
                    guardPos: c.guardPos ? { ...c.guardPos } : null
                }
            };
        }

        installOnce() {
            if (this._installed) return;
            this._installed = true;
            // Boar Pack Saddle (+12 kg carry limit while Tusk Charger is active).
            const P = BO.SurvivalPack?.prototype;
            const lim = P && Object.getOwnPropertyDescriptor(P, 'limits');
            if (lim?.get) {
                Object.defineProperty(P, 'limits', {
                    configurable: true,
                    get() {
                        const base = lim.get.call(this);
                        const bonus = BO.ZoneCompanions?.carryBonus?.() || 0;
                        return bonus > 0 ? { ...base, weight: base.weight + bonus } : base;
                    }
                });
            }
        }

        carryBonus() {
            const c = this.comp;
            if (!c || c.downed > 0) return 0;
            return ARCHETYPES[c.kind]?.carryBonus || 0;
        }

        placeVanguardPost() {
            const m = this.mode;
            if (!m || m.campaign?.has('sv_no_npcs')) return;
            const haven = BO.Zone?.markers?.find((x) => x.id === 'haven') || { x: -135, z: 142 };
            const x = haven.x - 4.2, z = haven.z + 3.4;
            const y = BO.World.getGroundHeight(x, z, BO.World.terrainHeight(x, z) + 2);
            const g = new THREE.Group();
            const std = (col, ex = {}) => new THREE.MeshStandardMaterial({ color: col, roughness: 0.75, ...ex });
            const add = (w, h, d, col, px, py, pz, ex) => {
                const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), std(col, ex));
                mesh.position.set(px, py, pz);
                g.add(mesh);
                return mesh;
            };
            // Ranger figure + signal banner at Haven
            add(0.48, 0.72, 0.28, 0x3b4d3e, 0, 1.14, 0);
            add(0.28, 0.28, 0.28, 0xd4ad8c, 0, 1.70, 0);
            add(0.32, 0.08, 0.12, 0x7ee8fa, 0, 1.72, 0.11, { emissive: 0x38bdf8, emissiveIntensity: 0.8 });
            add(0.18, 0.78, 0.2, 0x28312b, -0.13, 0.4, 0);
            add(0.18, 0.78, 0.2, 0x28312b, 0.13, 0.4, 0);
            add(0.08, 2.3, 0.08, 0x5c4a38, 0.58, 1.15, 0);
            add(0.46, 0.34, 0.04, 0x8fe3c8, 0.82, 2.05, 0, { emissive: 0x2dd4bf, emissiveIntensity: 0.45 });
            g.position.set(x, y, z);
            m.scene.add(g);
            this.objects.push(g);
            this.postMarker = {
                id: 'comp:vanguard_post', x, y, z,
                name: 'Haven Vanguard Scout',
                label: 'Recruit Haven Vanguard (2 rations, 20× 5.56)',
                alive: true, vanguardPost: true, reach: 2.8
            };
            m.markers.push(this.postMarker);
        }

        buildMesh(kind) {
            const spec = ARCHETYPES[kind];
            const root = new THREE.Group();
            const std = (col, ex = {}) => new THREE.MeshStandardMaterial({ color: col, roughness: 0.72, ...ex });
            const legs = [];
            if (kind === 'ranger') {
                const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.68, 0.26), std(spec.color));
                torso.position.set(0, 1.12, 0);
                const cloak = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.56, 0.08), std(0x27352a));
                cloak.position.set(0, 1.10, -0.16);
                const head = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.27, 0.27), std(0xd4ad8c));
                head.position.set(0, 1.66, 0);
                const hood = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.16, 0.31), std(0x2d3d31));
                hood.position.set(0, 1.76, -0.02);
                const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.06), std(spec.accent, { emissive: spec.accent, emissiveIntensity: 0.9 }));
                visor.position.set(0, 1.66, 0.13);
                const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.11, 0.72), std(0x262b30, { metalness: 0.65 }));
                rifle.position.set(0.24, 1.12, 0.26);
                const supp = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.22, 8), std(0x1b1f23, { metalness: 0.8 }));
                supp.rotation.x = Math.PI / 2;
                supp.position.set(0.24, 1.14, 0.68);
                root.add(torso, cloak, head, hood, visor, rifle, supp);
                for (const lx of [-0.12, 0.12]) {
                    const p = new THREE.Group();
                    p.position.set(lx, 0.76, 0);
                    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.76, 0.18), std(0x262e28));
                    leg.position.y = -0.38;
                    p.add(leg);
                    root.add(p);
                    legs.push(p);
                }
                return { root, legs, height: 1.85, collar: visor };
            }
            const sz = kind === 'bear' ? 1.48 : kind === 'boar' ? 0.82 : 0.80;
            const legH = 0.42 * sz, bw = 0.40 * sz, bh = 0.36 * sz, bl = 0.92 * sz;
            const by = legH + bh * 0.45;
            const body = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bl), std(spec.color));
            body.position.set(0, by, 0);
            const head = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.74, bh * 0.74, bw * 0.82), std(spec.color));
            head.position.set(0, by + bh * 0.32, bl * 0.56);
            const snout = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.42, bh * 0.36, bw * 0.50), std(0x2d2520));
            snout.position.set(0, by + bh * 0.22, bl * 0.56 + bw * 0.52);
            // Glowing Resonance collar / harness so you never mistake your companion for a hostile!
            const collar = new THREE.Mesh(
                new THREE.BoxGeometry(bw * 0.86, bh * 0.24, bw * 0.28),
                std(spec.accent, { emissive: spec.accent, emissiveIntensity: 0.95, metalness: 0.4 })
            );
            collar.position.set(0, by + bh * 0.24, bl * 0.36);
            root.add(body, head, snout, collar);
            if (kind === 'wolf') {
                for (const ex of [-1, 1]) {
                    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.13, 4), std(spec.color));
                    ear.position.set(ex * bw * 0.24, by + bh * 0.78, bl * 0.52);
                    root.add(ear);
                }
                const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.34), std(spec.color));
                tail.position.set(0, by + 0.04, -bl * 0.58);
                tail.rotation.x = -0.35;
                root.add(tail);
            } else if (kind === 'boar') {
                for (const tx of [-1, 1]) {
                    const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.16, 5), std(0xf4efe2, { metalness: 0.3 }));
                    tusk.position.set(tx * bw * 0.26, by + bh * 0.16, bl * 0.56 + bw * 0.62);
                    tusk.rotation.x = 0.55;
                    root.add(tusk);
                }
                const pack = new THREE.Mesh(new THREE.BoxGeometry(bw * 1.28, bh * 0.55, bl * 0.48), std(0x7c5a38));
                pack.position.set(0, by + bh * 0.22, 0);
                root.add(pack);
            } else if (kind === 'bear') {
                const hump = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.92, bh * 0.35, bl * 0.42), std(spec.color));
                hump.position.set(0, by + bh * 0.52, bl * 0.15);
                root.add(hump);
            }
            for (const [lx, lz] of [[bw * 0.34, bl * 0.34], [-bw * 0.34, bl * 0.34], [bw * 0.34, -bl * 0.34], [-bw * 0.34, -bl * 0.34]]) {
                const pivot = new THREE.Group();
                pivot.position.set(lx, legH, lz);
                const leg = new THREE.Mesh(new THREE.BoxGeometry(0.10 * sz, legH, 0.10 * sz), std(spec.color));
                leg.position.y = -legH / 2;
                pivot.add(leg);
                root.add(pivot);
                legs.push(pivot);
            }
            return { root, legs, height: by + bh * 0.8, collar };
        }

        maxHpOf(kind, rank) {
            const base = ARCHETYPES[kind]?.hp || 240;
            return Math.round(base * (1 + (rank - 1) * 0.22));
        }

        dmgOf(kind, rank) {
            const base = ARCHETYPES[kind]?.dmg || 34;
            return Math.round(base * (1 + (rank - 1) * 0.18));
        }

        spawnCompanion(kind, pos, saved = null, quiet = false) {
            const m = this.mode;
            if (!m || !ARCHETYPES[kind]) return null;
            this.dismiss(true);
            const spec = ARCHETYPES[kind];
            const built = this.buildMesh(kind);
            const rank = BO.Math.clamp(saved?.rank || 1, 1, 5);
            const maxHp = this.maxHpOf(kind, rank);
            const y = BO.World.getGroundHeight(pos.x, pos.z, (pos.y ?? 0) + 2);
            const comp = {
                isCompanion: true, team: 0, alive: true,
                kind, spec,
                name: saved?.name || spec.name,
                rank, xp: saved?.xp || 0,
                maxHp, hp: saved?.hp != null ? Math.min(maxHp, Math.max(1, saved.hp)) : maxHp,
                downed: saved?.downed || 0,
                stance: saved?.stance || 'follow',
                guardPos: saved?.guardPos || null,
                pos: new THREE.Vector3(pos.x, y, pos.z),
                yaw: 0, phase: 0, attackCd: 0,
                root: built.root, legs: built.legs, height: built.height, collar: built.collar,
                getHitboxMeshes: () => []
            };
            comp.root.position.copy(comp.pos);
            m.scene.add(comp.root);
            comp.marker = {
                id: 'comp:active', x: comp.pos.x, y: comp.pos.y, z: comp.pos.z,
                name: comp.name, label: '', alive: true, companionInteract: true, reach: 2.7
            };
            m.markers.push(comp.marker);
            this.comp = comp;
            if (!quiet) {
                BO.FX?.spawnParticles?.(comp.pos.clone().setY(comp.pos.y + 0.9), 18, spec.accent, 3.6, 4, 0.7);
                BO.Sound?.playPerkBuy?.();
                BO.Events.emit('hud:banner', {
                    title: comp.name.toUpperCase() + ' JOINED YOU',
                    sub: spec.perk.toUpperCase() + ' · PRESS ' + BO.Settings.keyLabel(BO.Settings.getKeybinds().survCompanion || 'KeyY') + ' FOR ORDERS',
                    color: '#8fe3c8'
                });
            }
            return comp;
        }

        dismiss(silent = false) {
            if (!this.comp) return;
            const name = this.comp.name;
            this.comp.root.removeFromParent();
            this.comp.root.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
            if (this.comp.marker) {
                this.comp.marker.alive = false;
                const idx = this.mode?.markers.indexOf(this.comp.marker) ?? -1;
                if (idx >= 0) this.mode.markers.splice(idx, 1);
            }
            this.comp = null;
            if (!silent && this.mode) this.mode.toast(name + ' returned to Haven.');
        }

        onDistressRescued(pos) {
            if (this.comp || !this.mode) return false;
            this.spawnCompanion('ranger', pos);
            this.campaign?.mark('companionsTamed', 1, 80);
            return true;
        }

        cycleStance() {
            const c = this.comp;
            if (!c) {
                this.mode?.toast('No companion yet — tame a wolf, boar or bear in the wild, or recruit a Vanguard at Haven.');
                return false;
            }
            const idx = STANCES.findIndex((s) => s.id === c.stance);
            const next = STANCES[(idx + 1) % STANCES.length];
            c.stance = next.id;
            if (next.id === 'guard') c.guardPos = { x: c.pos.x, y: c.pos.y, z: c.pos.z };
            else c.guardPos = null;
            BO.Sound?.playUIClick?.();
            this.mode?.toast(c.name + ' · ' + next.label + ' — ' + next.desc);
            return true;
        }

        availableTreat(kind) {
            const pts = this.mode?.points || {};
            const spec = ARCHETYPES[kind];
            if (!spec) return null;
            if (this.campaign?.has('sv_free_craft')) return spec.treats[0] || ['bone', 2];
            for (const [itemId, val] of spec.treats) {
                if ((pts[itemId] || 0) > 0) return [itemId, val];
            }
            return null;
        }

        activate(marker) {
            const m = this.mode;
            if (!m || !marker) return false;
            if (marker.vanguardPost) {
                if (this.comp?.kind === 'ranger') {
                    m.toast('Your Haven Vanguard is already with you.');
                    return true;
                }
                if (!m.spend({ rations: 2, ammo556: 20 })) {
                    m.toast('Recruiting a Haven Vanguard requires 2 field rations and 20× 5.56 rounds.');
                    return true;
                }
                this.spawnCompanion('ranger', { x: marker.x + 1.2, y: marker.y, z: marker.z + 1.2 });
                this.campaign?.mark('companionsTamed', 1, 80);
                return true;
            }
            if (marker.tameAnimal) {
                const a = marker.tameAnimal;
                if (!a.alive) return true;
                const spec = ARCHETYPES[a.kind];
                const treat = this.availableTreat(a.kind);
                if (!treat) {
                    const names = spec.treats.slice(0, 3).map(([k]) => BO.SurvivalItemName(k)).join(', ');
                    m.toast('Carry ' + names + ' to tame this ' + a.spec.name.toLowerCase() + '.');
                    return true;
                }
                const [itemId, val] = treat;
                if (!this.campaign?.has('sv_free_craft')) m.points[itemId]--;
                a.tameProgress = (a.tameProgress || 0) + val;
                a.tameCalmed = m.clock + 15;
                a.state = 'wander';
                a.goal = null;
                BO.FX?.spawnParticles?.(a.pos.clone().setY(a.pos.y + a.height * 0.8), 10, spec.accent, 2.2, 3, 0.5);
                if (a.tameProgress >= spec.need) {
                    const spawnPos = { x: a.pos.x, y: a.pos.y, z: a.pos.z };
                    a.alive = false;
                    a.deathTimer = 0;
                    a.destroy();
                    const list = BO.ZoneWild?.animals;
                    const idx = list ? list.indexOf(a) : -1;
                    if (idx >= 0) list.splice(idx, 1);
                    const mk = this.tameMarkers.get(a.id);
                    if (mk) { mk.alive = false; this.tameMarkers.delete(a.id); }
                    this.spawnCompanion(a.kind, spawnPos);
                    this.campaign?.mark('companionsTamed', 1, 80);
                    m.refreshTargets();
                } else {
                    m.toast(a.spec.name + ' accepted ' + BO.SurvivalItemName(itemId) + ' (' + a.tameProgress + '/' + spec.need + ' — feed once more!).');
                }
                return true;
            }
            if (marker.companionInteract && this.comp) {
                const c = this.comp;
                if (c.downed > 0) {
                    if (m.spend({ bandage: 1 }) || m.spend({ medkits: 1 })) {
                        c.downed = 0;
                        c.hp = Math.round(c.maxHp * 0.75);
                        c.root.rotation.z = 0;
                        BO.FX?.spawnParticles?.(c.pos.clone().setY(c.pos.y + 0.8), 12, 0x8fe3c8, 2.5, 4, 0.5);
                        m.toast(c.name + ' is back on their feet!');
                    } else {
                        m.toast('Need 1 bandage or medkit to revive immediately (' + Math.ceil(c.downed) + ' s left).');
                    }
                    return true;
                }
                if (c.hp < c.maxHp) {
                    const food = HEAL_FOODS.find((id) => (m.points[id] || 0) > 0);
                    if (food && m.spend({ [food]: 1 })) {
                        const heal = Math.round(c.maxHp * 0.55);
                        c.hp = Math.min(c.maxHp, c.hp + heal);
                        this.grantXp(20);
                        BO.FX?.spawnParticles?.(c.pos.clone().setY(c.pos.y + 0.8), 10, 0x8fe3c8, 2.2, 4, 0.45);
                        m.toast('Fed ' + BO.SurvivalItemName(food) + ' to ' + c.name + ' (+' + heal + ' HP).');
                        return true;
                    }
                }
                m.composure = Math.min(100, (m.composure || 80) + 8);
                BO.FX?.spawnParticles?.(c.pos.clone().setY(c.pos.y + c.height), 8, c.spec.accent, 1.8, 2, 0.45);
                m.toast(c.kind === 'ranger' ? c.name + ': "Perimeter clear. Ready when you are."' : c.name + ' leans into your hand (+8 composure).');
                return true;
            }
            return false;
        }

        grantXp(amount) {
            const c = this.comp;
            if (!c || c.rank >= 5) return;
            c.xp += amount;
            const need = c.rank * 90;
            if (c.xp >= need) {
                c.xp -= need;
                c.rank++;
                c.maxHp = this.maxHpOf(c.kind, c.rank);
                c.hp = c.maxHp;
                BO.FX?.spawnParticles?.(c.pos.clone().setY(c.pos.y + 1.0), 16, 0xf2d07a, 3.2, 4, 0.65);
                this.mode?.toast(c.name + ' reached Rank ' + ROMAN[c.rank - 1] + ' (' + c.maxHp + ' HP, ' + this.dmgOf(c.kind, c.rank) + ' DMG)!');
            }
        }

        damageCompanion(amount) {
            const c = this.comp;
            if (!c || c.downed > 0) return;
            if (this.campaign?.has('sv_god_mode')) return;
            c.hp -= amount * 0.65;
            BO.FX?.spawnParticles?.(c.pos.clone().setY(c.pos.y + 0.7), 5, 0x991b1b, 2.2, 6, 0.35);
            if (c.hp <= 0) {
                c.hp = 0;
                c.downed = 22;
                c.root.rotation.z = Math.PI / 2;
                this.mode?.toast(c.name + ' is downed! Use a bandage to revive or wait 22 s.');
            }
        }

        /** Lets nearby infected fight an active, non-downed companion when closer than the player. */
        targetForZombie(z) {
            const c = this.comp;
            if (!c || c.downed > 0 || c.stance === 'stealth') return null;
            const dz = c.pos.distanceTo(z.pos);
            if (dz > 9.5) return null;
            const dp = BO.Player.pos.distanceTo(z.pos);
            if (dz < dp - 1.5) return { x: c.pos.x, y: c.pos.y, z: c.pos.z, companion: c, attackRange: 1.75, forceDirect: true };
            return null;
        }

        updateTamePrompts(p) {
            const m = this.mode;
            const wild = BO.ZoneWild?.animals || [];
            const seen = new Set();
            for (const a of wild) {
                if (!a.alive || !ARCHETYPES[a.kind]) continue;
                if (a.tameCalmed > m.clock && a.state === 'attack') a.state = 'wander';
                const d = a.pos.distanceTo(p.pos);
                if (d > 8.5) continue;
                seen.add(a.id);
                let mk = this.tameMarkers.get(a.id);
                if (!mk) {
                    mk = { id: 'tame:' + a.id, x: a.pos.x, y: a.pos.y, z: a.pos.z, name: a.spec.name, label: '', alive: true, tameAnimal: a, reach: 4.3 };
                    this.tameMarkers.set(a.id, mk);
                    m.markers.push(mk);
                }
                mk.x = a.pos.x; mk.y = a.pos.y; mk.z = a.pos.z; mk.alive = true;
                const spec = ARCHETYPES[a.kind];
                const treat = this.availableTreat(a.kind);
                const prog = a.tameProgress ? ` (${a.tameProgress}/${spec.need})` : '';
                mk.label = treat
                    ? `Offer ${BO.SurvivalItemName(treat[0])} to tame ${a.spec.name}${prog}`
                    : `Tame ${a.spec.name} (needs ${BO.SurvivalItemName(spec.treats[3]?.[0] || spec.treats[0][0])})`;
            }
            for (const [id, mk] of this.tameMarkers) {
                if (!seen.has(id)) {
                    mk.alive = false;
                    const idx = m.markers.indexOf(mk);
                    if (idx >= 0) m.markers.splice(idx, 1);
                    this.tameMarkers.delete(id);
                }
            }
            if (this.postMarker) {
                this.postMarker.label = this.comp?.kind === 'ranger'
                    ? 'Haven Vanguard active'
                    : 'Recruit Haven Vanguard (2 rations, 20× 5.56)';
            }
        }

        update(dt) {
            const m = this.mode;
            if (!m || !m.active) return;
            const p = BO.Player;
            this.updateTamePrompts(p);
            const c = this.comp;
            if (!c) return;

            // Update interaction marker on the companion
            if (c.marker) {
                c.marker.x = c.pos.x; c.marker.y = c.pos.y; c.marker.z = c.pos.z;
                c.marker.alive = Math.hypot(c.pos.x - p.pos.x, c.pos.z - p.pos.z) < 6;
                if (c.downed > 0) c.marker.label = `Revive ${c.name} (bandage · ${Math.ceil(c.downed)}s)`;
                else if (c.hp < c.maxHp) c.marker.label = `Feed ${c.name} (${Math.ceil(c.hp)}/${c.maxHp} HP)`;
                else c.marker.label = c.kind === 'ranger' ? `Check in with ${c.name} (Rank ${ROMAN[c.rank - 1]})` : `Pet ${c.name} (Rank ${ROMAN[c.rank - 1]})`;
            }

            if (c.downed > 0) {
                c.downed -= dt;
                if (c.downed <= 0) {
                    c.downed = 0;
                    c.hp = Math.round(c.maxHp * 0.55);
                    c.root.rotation.z = 0;
                    m.toast(c.name + ' recovered!');
                }
                return;
            }

            // Passive out-of-combat regen
            if (c.hp < c.maxHp) c.hp = Math.min(c.maxHp, c.hp + dt * 2.5);

            // Teleport leash when following (including across Dungeon / Arena / Fast-Travel jumps!)
            const anchor = c.stance === 'guard' && c.guardPos ? c.guardPos : p.pos;
            const distAnchor = Math.hypot(c.pos.x - anchor.x, c.pos.z - anchor.z);
            if (c.stance !== 'guard' && (distAnchor > 50 || Math.abs(c.pos.y - p.pos.y) > 18)) {
                const fwd = p.getMoveDirectionVectors().right;
                const tx = p.pos.x + fwd.x * 2.2, tz = p.pos.z + fwd.z * 2.2;
                const inSealed = !!(BO.ZoneDungeons?.inside || BO.ZoneLegends?.arena);
                c.pos.set(tx, inSealed ? p.pos.y : BO.World.getGroundHeight(tx, tz, p.pos.y + 2), tz);
                c.root.position.copy(c.pos);
            }

            // Zone Hound Tracker's Nose: ping nearby unsearched high-value container or bag
            if (c.kind === 'wolf' && c.stance !== 'stealth') {
                this.pingClock -= dt;
                if (this.pingClock <= 0) {
                    this.pingClock = 18;
                    const cont = m.loot?.list?.find((e) => !m.loot.searched.has(e.i) && (e.story || e.tier >= 2 || /gun_locker|military_crate|lab_cabinet/.test(e.type)) && Math.hypot(e.x - p.pos.x, e.z - p.pos.z) < 42);
                    if (cont) {
                        BO.FX?.spawnParticles?.(new THREE.Vector3(cont.x, cont.y + 1.2, cont.z), 12, 0x8fe3c8, 2.2, 1, 0.85);
                        m.toast('Zone Hound caught a scent — ' + (cont.marker?.name || 'cache') + ' ' + Math.round(Math.hypot(cont.x - p.pos.x, cont.z - p.pos.z)) + ' m away!');
                    }
                }
            }

            // Acquire hostile target
            c.attackCd = Math.max(0, c.attackCd - dt);
            const aggroRange = c.stance === 'stealth' ? 4.2 : c.stance === 'guard' ? 22 : 24;
            let best = null, bestD = aggroRange;
            for (const pool of [m.zombies, m.bots]) {
                for (let i = 0; i < pool.length; i++) {
                    const u = pool[i];
                    if (!u.alive || u.team === 0) continue;
                    const da = Math.hypot(u.pos.x - anchor.x, u.pos.z - anchor.z);
                    if (da > aggroRange) continue;
                    const dc = Math.hypot(u.pos.x - c.pos.x, u.pos.z - c.pos.z);
                    if (dc < bestD) { bestD = dc; best = u; }
                }
            }

            const spec = c.spec;
            let moveX = null, moveZ = null, spd = 0;
            if (best) {
                const dx = best.pos.x - c.pos.x, dz = best.pos.z - c.pos.z;
                const d = Math.hypot(dx, dz);
                if (spec.ranged) {
                    const los = BO.World.hasLineOfSight(c.pos.x, c.pos.y + 1.35, c.pos.z, best.pos.x, best.pos.y + 0.95, best.pos.z);
                    if (d <= spec.range && los) {
                        c.yaw = Math.atan2(dx, dz);
                        if (c.attackCd <= 0) {
                            c.attackCd = spec.rate;
                            const dmg = this.dmgOf(c.kind, c.rank);
                            BO.FX?.spawnTracer?.(c.pos.clone().setY(c.pos.y + 1.25), best.pos.clone().setY(best.pos.y + 0.95), 0x7ee8fa, 0.022, 0.07);
                            const killed = m.hit(best, dmg, 'torso', null, 'bullet', c);
                            this.grantXp(killed ? 18 : 4);
                        }
                    } else {
                        moveX = best.pos.x; moveZ = best.pos.z; spd = spec.speed;
                    }
                } else if (d <= spec.range + (best.radius || 0.45)) {
                    c.yaw = Math.atan2(dx, dz);
                    if (c.attackCd <= 0) {
                        c.attackCd = spec.rate;
                        const dmg = this.dmgOf(c.kind, c.rank);
                        const killed = m.hit(best, dmg, 'torso', null, 'melee', c);
                        if (spec.stun && best.alive) best.stunTimer = Math.max(best.stunTimer || 0, spec.stun);
                        if (spec.cleave) {
                            for (const z2 of m.zombies) {
                                if (z2 !== best && z2.alive && z2.pos.distanceTo(best.pos) <= spec.cleave) {
                                    m.hit(z2, Math.round(dmg * 0.65), 'torso', null, 'melee', c);
                                }
                            }
                        }
                        BO.FX?.spawnParticles?.(best.pos.clone().setY(best.pos.y + 0.9), 7, spec.accent, 2.8, 6, 0.35);
                        BO.Sound?.playMeleeHit?.();
                        this.grantXp(killed ? 22 : 5);
                    }
                } else {
                    moveX = best.pos.x; moveZ = best.pos.z; spd = spec.speed;
                }
            } else {
                const right = p.getMoveDirectionVectors().right;
                const goalX = c.stance === 'guard' && c.guardPos ? c.guardPos.x : p.pos.x + right.x * 2.4;
                const goalZ = c.stance === 'guard' && c.guardPos ? c.guardPos.z : p.pos.z + right.z * 2.4;
                const gd = Math.hypot(goalX - c.pos.x, goalZ - c.pos.z);
                if (gd > 1.6) {
                    moveX = goalX; moveZ = goalZ;
                    spd = gd > 7 ? spec.speed * 1.12 : spec.speed * 0.72;
                }
            }

            if (moveX !== null && spd > 0) {
                const want = Math.atan2(moveX - c.pos.x, moveZ - c.pos.z);
                let diff = ((want - c.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
                c.yaw += BO.Math.clamp(diff, -8 * dt, 8 * dt);
                const nx = c.pos.x + Math.sin(c.yaw) * spd * dt;
                const nz = c.pos.z + Math.cos(c.yaw) * spd * dt;
                const inSealed = !!(BO.ZoneDungeons?.inside || BO.ZoneLegends?.arena);
                if (inSealed) {
                    const tryPos = new THREE.Vector3(nx, c.pos.y, nz);
                    BO.World.resolveHorizontal?.(tryPos, 0.42, 1.4, false);
                    c.pos.x = tryPos.x; c.pos.z = tryPos.z;
                    c.pos.y = BO.World.getGroundHeight(c.pos.x, c.pos.z, p.pos.y + 1.5);
                } else if (!BO.Zone.inReservoir(nx, nz)) {
                    c.pos.x = nx; c.pos.z = nz;
                    c.pos.y = BO.World.getGroundHeight(nx, nz, c.pos.y + 1.6);
                }
                c.phase += dt * spd * 3.2;
            }
            const swing = spd > 0 ? Math.sin(c.phase) * Math.min(0.65, spd * 0.1) : 0;
            c.legs.forEach((l, i) => { l.rotation.x = (i % 2 === 0 ? swing : -swing); });
            c.root.position.copy(c.pos);
            c.root.rotation.y = c.yaw;
        }

        hudChip() {
            const c = this.comp;
            if (!c) return '';
            const st = c.downed > 0 ? 'DOWNED ' + Math.ceil(c.downed) + 's' : c.stance.toUpperCase();
            return `${c.name} ${ROMAN[c.rank - 1]} · ${Math.ceil(c.hp)}/${c.maxHp} · ${st}`;
        }
    }

    BO.ZoneCompanions = new ZoneCompanions();
    BO.ZoneCompanions.ARCHETYPES = ARCHETYPES;
    BO.ZoneCompanions.STANCES = STANCES;
})(window.BO);
