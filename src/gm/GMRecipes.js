/* ============================================================================
   BLACKOUT OPS — Survival Gold: recipe discovery & "Next Up" (BO.GM 'recipes')
   · DISCOVERY: a recipe or blueprint appears once you have held one of its
     ingredients (blueprints: every ingredient). New ones announce themselves
     with a chime: "New recipe: Braided cord". The opening essentials and
     anything you can already afford are always visible.
   · ALMOST: recipes one ingredient short are flagged so the crafting screen
     can sort them right under "craftable now".
   · NEXT UP: after the First Night, one line under the top bar names the most
     useful thing you are closest to making and where its missing part grows.
============================================================================ */
(function (BO) {
    'use strict';
    const GM = BO.GM;
    const data = BO.SurvivalFrontierData;

    /* Always visible: the First Night essentials. */
    const ALWAYS_RECIPES = new Set(['f:braid', 'f:splint', 'f:dressing', 'f:sawBoards', 'f:weaveCloth', 't:stoneAxe', 't:stonePick', 't:trenchSpade']);
    const ALWAYS_BUILDS = new Set(['bench', 'wall', 'floor', 'roof', 'woodDoor', 'wallTorch', 'campfire', 'bed', 'chest']);

    /* The "Next Up" ladder, in priority order. kind: tool | build | pack | item */
    const LADDER = [
        { kind: 'tool', id: 'stonePick', why: 'mines ore and boulders' },
        { kind: 'build', id: 'campfire', why: 'cooks food and keeps you warm' },
        { kind: 'build', id: 'chest', why: 'stores your haul at base' },
        { kind: 'tool', id: 'trenchSpade', why: 'digs clay and buried salvage' },
        { kind: 'build', id: 'kiln', why: 'smelts iron and fires bricks' },
        { kind: 'tool', id: 'ironPick', why: 'breaks tier-2 copper and quartz' },
        { kind: 'tool', id: 'ironAxe', why: 'fells hardwood twice as fast' },
        { kind: 'pack', level: 1, recipe: 'trailPack', why: '17 slots, 34 kg' },
        { kind: 'build', id: 'stoneWall', why: 'masonry holds a horde far longer' },
        { kind: 'item', id: 'lantern', recipe: 'makeLantern', why: 'reusable light' },
        { kind: 'pack', level: 2, recipe: 'rucksack', why: '23 slots, 51 kg' },
        { kind: 'build', id: 'planter', why: 'grow your own food' },
        { kind: 'build', id: 'rainbarrel', why: 'water for crops and you' },
        { kind: 'build', id: 'generator', why: 'powers lights and turrets' },
        { kind: 'tool', id: 'miningDrill', why: 'tier-3 deposits and resonant geodes' },
        { kind: 'pack', level: 3, recipe: 'hauler', why: '32 slots, 76 kg' }
    ];

    const costOf = (spec) => (BO.buildCostOf ? BO.buildCostOf(spec) : (typeof spec.cost === 'number' ? { scrap: spec.cost } : spec.cost || {}));

    const Recipes = {
        rate: 4,

        start(mode, saved) {
            this.mode = mode;
            this.seen = new Set(saved?.seen || []);
            this.revealed = new Set(saved?.revealed || []);
            this.built = new Set(saved?.built || []);
            this.primed = !!saved;
            this.next = null;
            this.el = document.createElement('div');
            this.el.id = 'gm-next';
            this.el.className = 'gm-next hidden';
            document.body.appendChild(this.el);
            this.scan(true);
        },

        stop() {
            this.el?.remove();
            this.el = null;
            this.mode = null;
        },

        snapshot() { return { seen: [...this.seen], revealed: [...this.revealed], built: [...this.built] }; },

        onBuild(piece) { if (piece?.type) this.built.add(piece.type); },

        /* ------------------------------------------------------------ discovery */
        haveNow(id) {
            const m = this.mode;
            return (m.points[id] || 0) > 0 || (m.campaign.pack.tools[id] || 0) > 0;
        },

        recipeVisible(r) {
            if (!this.mode) return true;
            if (ALWAYS_RECIPES.has(r.key) || r.status === 'ready' || r.status === 'owned') return true;
            if (r.upgrade) return true;
            const ids = Object.keys(r.cost || {});
            return !ids.length || ids.some((id) => this.seen.has(id));
        },

        buildVisible(b) {
            if (!this.mode) return true;
            if (ALWAYS_BUILDS.has(b.id) || this.built.has(b.id)) return true;
            const ids = Object.keys(costOf(b));
            if (ids.every((id) => this.seen.has(id))) return true;
            return BO.SurvivalMode.canAfford(costOf(b));
        },

        /** Recipe status refined with "almost": exactly one ingredient short. */
        shortOf(cost, have) {
            const short = [];
            for (const [id, n] of Object.entries(cost || {})) {
                const h = have[id] || 0;
                if (h < n) short.push([id, n - h]);
            }
            return short;
        },

        scan(silent = false) {
            const m = this.mode;
            let fresh = false;
            for (const [id, n] of Object.entries(m.points)) if (n > 0 && !this.seen.has(id)) { this.seen.add(id); fresh = true; }
            for (const [id, n] of Object.entries(m.campaign.pack.tools)) if (n > 0 && !this.seen.has(id)) { this.seen.add(id); fresh = true; }
            if (!fresh && this.primed) return;
            const UI = BO.SurvivalUI;
            const newRecipes = [];
            const newBuilds = [];
            if (UI?.recipes) {
                for (const r of UI.recipes()) {
                    if (r.status === 'owned' || this.revealed.has(r.key) || !this.recipeVisible(r)) continue;
                    this.revealed.add(r.key);
                    if (!ALWAYS_RECIPES.has(r.key)) newRecipes.push(r.name);
                }
            }
            for (const b of BO.SurvivalCampaignData.build) {
                if (BO.SurvivalRetired?.isRetiredBuild(b.id)) continue;
                const key = 'b:' + b.id;
                if (this.revealed.has(key) || !this.buildVisible(b)) continue;
                this.revealed.add(key);
                if (!ALWAYS_BUILDS.has(b.id)) newBuilds.push(b.name);
            }
            // The first scan of a fresh run only records what is visible; it does not announce it.
            if (!this.primed) { this.primed = true; return; }
            if (silent) return;
            const all = [...newRecipes.map((n) => 'recipe: ' + n), ...newBuilds.map((n) => 'blueprint: ' + n)];
            if (!all.length) return;
            GM.tone([[880, 880, 0.07], [1175, 1175, 0.07], [1568, 1568, 0.16]], 0.07, 'sine');
            if (all.length === 1) GM.toast('New ' + all[0], '#bae6fd');
            else GM.toast(all.length + ' new: ' + all.slice(0, 2).map((s) => s.replace(/^(recipe|blueprint): /, '')).join(', ') + (all.length > 2 ? ' +' + (all.length - 2) + ' more' : '') + ' · open Crafting or Build', '#bae6fd');
        },

        /* ------------------------------------------------------------ next up */
        stepDone(step) {
            const c = this.mode.campaign;
            const pack = c.pack;
            if (step.kind === 'tool') return (pack.tools[step.id] || 0) > 0;
            if (step.kind === 'build') return c.placed.some((p) => p.alive && p.type === step.id) || this.built.has(step.id);
            if (step.kind === 'pack') return pack.level >= step.level;
            if (step.kind === 'item') return (this.mode.points[step.id] || 0) > 0;
            return true;
        },

        stepSpec(step) {
            if (step.kind === 'tool') { const t = data.tools[step.id]; return t && { name: t.name, cost: t.cost, station: t.station }; }
            if (step.kind === 'build') { const b = BO.SurvivalCampaignData.build.find((x) => x.id === step.id); return b && { name: b.name, cost: costOf(b), station: 'build', tech: b.tech, id: b.id }; }
            const r = data.recipes.find((x) => x.id === step.recipe);
            return r && { name: r.name, cost: r.cost, station: r.station };
        },

        nearestFor(itemId) {
            const kinds = Object.entries(data.resources).filter(([, s]) => s.gain[itemId]).map(([k]) => k);
            if (!kinds.length) return '';
            const p = BO.Player.pos;
            let best = null;
            let bd = Infinity;
            for (const node of this.mode.campaign.pack.resources.values()) {
                if (node.hp <= 0 || !kinds.includes(node.kind)) continue;
                const d = Math.hypot(node.marker.x - p.x, node.marker.z - p.z);
                if (d < bd) { bd = d; best = node; }
            }
            return best ? best.spec.name + ' ' + Math.round(bd) + ' m' : '';
        },

        computeNext() {
            const m = this.mode;
            const c = m.campaign;
            const have = GM.get('storage')?.available?.() || m.points;
            for (const step of LADDER) {
                if (this.stepDone(step)) continue;
                const spec = this.stepSpec(step);
                if (!spec) continue;
                if (spec.tech && c.deep && !c.deep.hasTech(spec.tech)) continue;
                if (spec.id && GM.get('base')?.buildBlock?.(spec.id)) continue;
                const short = this.shortOf(spec.cost, have);
                if (!short.length) {
                    const where = spec.station === 'build' ? 'open Build (' + BO.Settings.keyLabel(BO.Settings.getKeybinds().survBuild) + ')'
                        : spec.station === 'hand' ? 'open Crafting (' + BO.Settings.keyLabel(BO.Settings.getKeybinds().survCraft) + ')'
                            : 'craft it at your ' + ({ bench: 'workbench', kiln: 'kiln', campfire: 'campfire' }[spec.station] || spec.station);
                    return { name: spec.name, why: step.why, text: 'ready · ' + where, ready: true };
                }
                const [id, n] = short[0];
                const near = this.nearestFor(id);
                return { name: spec.name, why: step.why, text: 'need ' + n + ' ' + GM.itemName(id) + (near ? ' · ' + near : '') + (short.length > 1 ? ' · +' + (short.length - 1) + ' more' : ''), ready: false };
            }
            return null;
        },

        renderNext() {
            const el = this.el;
            if (!el) return;
            const night = GM.get('night');
            const show = BO.Settings.get('nextUpHint') !== false && !(night?.tracking && !night.complete) && !BO.SurvivalUI?.open;
            const next = show ? this.computeNext() : null;
            if (!next) { el.classList.add('hidden'); return; }
            const html = '<span class="k">NEXT</span><b>' + GM.esc(next.name) + '</b><span class="why">' + GM.esc(next.why) + '</span><span class="' + (next.ready ? 'ok' : 'need') + '">' + GM.esc(next.text) + '</span>';
            if (html !== this._html) { el.innerHTML = html; this._html = html; }
            el.classList.remove('hidden');
        },

        update() {
            if (!this.mode) return;
            this.scan();
            this.renderNext();
        }
    };

    GM.register('recipes', Recipes);
})(window.BO);
