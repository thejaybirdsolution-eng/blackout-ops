/* ============================================================================
   BLACKOUT OPS — Enemy dossier
   Rendered portraits of every infected and boss (built from the real in-game
   models) plus the rich hover card used by every enemy roster, pool and guide.
   Any element with data-tip-enemy="<id>" shows this card as its tooltip.
============================================================================ */
(function (BO) {
    'use strict';

    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const cache = new Map();
    let renderer = null;
    let scene = null;
    let camera = null;
    let pivot = null;

    const MOVE_NAME = {
        lumber: 'Lumbering', crawl_fast: 'Fast crawler', sprint: 'Sprinter', hop_erratic: 'Erratic hopper',
        flank_circle: 'Flanker', charge_bull: 'Charger', stomp_march: 'Unstoppable march', leap_pounce: 'Leaping pouncer',
        zig_zag: 'Zig-zagger', hover_drift: 'Floater', teleport_blink: 'Teleporter'
    };
    const ATK_NAME = {
        melee: 'Claws & bites', double_claw: 'Double claw', acid_spit: 'Acid spit (ranged)', suicide_blast: 'Suicide blast',
        pounce: 'Pounce', toxic_cloud: 'Toxic cloud', shield_bash: 'Shield bash', fire_bolt: 'Fire bolt (ranged)',
        frost_shard: 'Frost shard (ranged)', shockwave_slam: 'Shockwave slam', life_drain: 'Life drain (ranged)', aether_bolt: 'Aether bolt (ranged)'
    };
    const RARITY = { easy: ['Common', '#86efac'], normal: ['Uncommon', '#7dd3fc'], hard: ['Elite', '#fbbf24'] };

    function allSpecs() {
        const z = BO.ZombiesData || {};
        return [...(z.ORDERED_PROGRESSION || []), ...(z.ORDERED_BOSSES || [])];
    }

    function specById(id) {
        if (!id) return null;
        return BO.ZombiesData?.get?.(id) || allSpecs().find((s) => s.id === id) || null;
    }

    function hex(n) { return '#' + (Number(n) >>> 0).toString(16).padStart(6, '0').slice(-6); }

    function ensureRenderer() {
        if (renderer || typeof THREE === 'undefined') return !!renderer;
        try {
            const canvas = document.createElement('canvas');
            renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
            renderer.setPixelRatio(1);
            renderer.setSize(192, 192, false);
            if ('outputEncoding' in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
            const hemi = new THREE.HemisphereLight(0xe4f2ec, 0x101814, 1.15);
            const key = new THREE.DirectionalLight(0xfff1dc, 1.55);
            key.position.set(2.4, 4, 3.2);
            const rim = new THREE.DirectionalLight(0x8fe3c8, 0.9);
            rim.position.set(-3, 2.2, -2.5);
            scene.add(hemi, key, rim);
            pivot = new THREE.Group();
            scene.add(pivot);
        } catch (e) {
            renderer = null;
        }
        return !!renderer;
    }

    /** Data-URL portrait of an enemy's real model, rendered once and cached. */
    function portrait(id) {
        if (cache.has(id)) return cache.get(id);
        const spec = specById(id);
        if (!spec || !ensureRenderer()) return '';
        let url = '';
        try {
            while (pivot.children.length) pivot.remove(pivot.children[0]);
            const built = BO.CharacterMesh.buildZombieFromSpec(spec, null);
            const root = built.root || built;
            pivot.add(root);
            pivot.rotation.set(0, -0.55, 0);
            pivot.updateMatrixWorld(true);
            const box = new THREE.Box3().setFromObject(root);
            const { center, radius } = box.getBoundingSphere(new THREE.Sphere());
            const dist = Math.max(1.6, 1.12 * radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)));
            camera.position.set(center.x + dist * 0.12, center.y + dist * 0.08, center.z + dist);
            camera.far = Math.max(50, dist + 3 * radius);
            camera.updateProjectionMatrix();
            camera.lookAt(center.x, center.y, center.z);
            renderer.setClearColor(0x000000, 0);
            renderer.render(scene, camera);
            url = renderer.domElement.toDataURL('image/png');
            pivot.remove(root);
        } catch (e) {
            url = '';
        }
        cache.set(id, url);
        return url;
    }

    function speedLabel(v) {
        if (v < 2.3) return 'Slow';
        if (v < 3.3) return 'Average';
        if (v < 4.3) return 'Fast';
        return 'Very fast';
    }

    function sizeInfo(spec) {
        const sc = spec.bodySpec?.scale || [1, 1, 1];
        const h = 1.8 * (sc[1] || 1) * (spec.bodySpec?.quadruped ? 0.6 : 1) * (spec.isBoss ? 1.25 : 1);
        const bulk = Math.max(sc[0] || 1, sc[2] || 1);
        const vol = (sc[0] || 1) * (sc[1] || 1) * (sc[2] || 1) * (spec.isBoss ? 1.8 : 1);
        const label = vol < 0.45 ? 'Small' : vol < 1.2 ? 'Human-sized' : vol < 2.6 ? 'Large' : 'Huge';
        return { height: h, label, build: bulk >= 1.4 ? 'heavy build' : bulk <= 0.75 ? 'slight build' : 'average build' };
    }

    function looks(spec) {
        const bs = spec.bodySpec || {};
        const color = (n) => {
            if (n == null) return null;
            const c = Number(n) >>> 0;
            const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            const l = (max + min) / 510;
            if (max - min < 24) return l < 0.25 ? 'black' : l < 0.6 ? 'grey' : 'pale white';
            let hue;
            if (max === r) hue = ((g - b) / (max - min)) * 60;
            else if (max === g) hue = (2 + (b - r) / (max - min)) * 60;
            else hue = (4 + (r - g) / (max - min)) * 60;
            if (hue < 0) hue += 360;
            const name = hue < 15 ? 'red' : hue < 40 ? 'orange' : hue < 65 ? 'yellow' : hue < 160 ? 'green' : hue < 200 ? 'teal' : hue < 255 ? 'blue' : hue < 290 ? 'purple' : hue < 335 ? 'magenta' : 'red';
            return (l < 0.3 ? 'dark ' : l > 0.7 ? 'pale ' : '') + name;
        };
        const bits = [];
        const skin = color(bs.skinColor);
        if (skin) bits.push(skin + ' skin');
        const eyes = color(bs.eyeColor);
        if (eyes) bits.push(eyes + ' eyes');
        const extras = { horns: 'horns', wings: 'wings', tentacles: 'tentacles', extraArms: 'extra arms', extraHeads: 'extra heads',
            boneSpikes: 'bone spikes', glowingRibs: 'glowing ribs', helmet: 'a helmet', riotShield: 'a riot shield', haloCrystal: 'a crystal halo',
            floating: 'floats above the ground', headless: 'no head', missingLegs: 'no legs', giantClubArm: 'a giant club arm', razorClaws: 'razor claws', backSac: 'a swollen back sac' };
        const feats = Object.keys(extras).filter((k) => bs[k]).map((k) => extras[k]);
        if (bs.quadruped) bits.unshift('four-legged');
        if (bs.torsoShape && !['normal', 'lean'].includes(bs.torsoShape)) bits.push(bs.torsoShape + ' torso');
        return [bits.join(', '), feats.length ? 'with ' + feats.join(', ') : ''].filter(Boolean).join(' ');
    }

    function stars(n) { return '★'.repeat(n) + '<i>' + '★'.repeat(5 - n) + '</i>'; }

    /** Full dossier card (HTML) used inside tooltips and the field guide. */
    function card(spec, extra = '') {
        if (!spec) return '';
        const d = BO.ZombiesData.describe ? BO.ZombiesData.describe(spec) : { threat: 1, threatLabel: '', traits: [], weak: [], resists: [], tip: '', movement: '', attack: '' };
        const size = sizeInfo(spec);
        const [rarity, rcol] = spec.isBoss ? ['Boss', '#f87171'] : (RARITY[spec.rarity] || ['Infected', '#cbd5e1']);
        const img = portrait(spec.id);
        const stat = (label, value, sub, pctVal) => `<div class="ei-stat"><span>${label}</span><b>${value}</b>${sub ? `<small>${sub}</small>` : ''}${pctVal != null ? `<i style="--v:${Math.max(4, Math.min(100, pctVal))}%"></i>` : ''}</div>`;
        const look = looks(spec);
        return `<div class="ei-card">
            <div class="ei-head">
                <div class="ei-portrait" style="--glow:${hex(spec.bodySpec?.eyeColor ?? 0x8fe3c8)}">${img ? `<img src="${img}" alt="">` : '<span>?</span>'}</div>
                <div class="ei-title">
                    <b>${esc(spec.name)}</b>
                    <span class="ei-rarity" style="color:${rcol}">${rarity}${spec.isMagical ? ' · Magical' : ''}</span>
                    <span class="ei-threat">${stars(d.threat)} <em>${esc(d.threatLabel)} threat</em></span>
                </div>
            </div>
            <p class="ei-desc">${esc(spec.simpleDesc || '')}</p>
            <div class="ei-stats">
                ${stat('Health', spec.hp, spec.isBoss ? 'boss pool' : '', (spec.hp / 1100) * 100)}
                ${stat('Speed', speedLabel(spec.speed || 0), (spec.speed || 0).toFixed(1) + ' m/s', ((spec.speed || 0) / 5.5) * 100)}
                ${stat('Attack', spec.attack || 0, 'per hit', ((spec.attack || 0) / 90) * 100)}
                ${stat('Armor', Math.round((spec.defense || 0) * 100) + '%', 'damage reduction', (spec.defense || 0) * 200)}
                ${stat('Size', size.label, size.height.toFixed(1) + ' m · ' + size.build)}
                ${stat('Movement', esc(MOVE_NAME[spec.movementHabit] || 'Walker'), '')}
            </div>
            <dl class="ei-rows">
                <div><dt>Looks</dt><dd>${esc(look ? look.charAt(0).toUpperCase() + look.slice(1) + '.' : 'Rotting humanoid.')}</dd></div>
                <div><dt>Moves</dt><dd>${esc(d.movement)}</dd></div>
                <div><dt>Attacks</dt><dd>${esc(ATK_NAME[spec.attackType] || 'Melee')} — ${esc(d.attack)}</dd></div>
                ${d.traits.length ? `<div><dt>Traits</dt><dd class="ei-chips">${d.traits.map((t) => `<span>${esc(t)}</span>`).join('')}</dd></div>` : ''}
                ${d.weak.length ? `<div><dt>Weak to</dt><dd class="ei-good">${esc(d.weak.join(', '))}</dd></div>` : ''}
                ${d.resists.length ? `<div><dt>Resists</dt><dd class="ei-bad">${esc(d.resists.join(', '))}</dd></div>` : ''}
            </dl>
            ${d.tip ? `<p class="ei-tip"><b>Tip</b> ${esc(d.tip)}</p>` : ''}
            ${extra ? `<p class="ei-extra">${esc(extra)}</p>` : ''}
        </div>`;
    }

    BO.EnemyInfo = { portrait, card, specById, speedLabel, sizeInfo, looks };
})(window.BO);
