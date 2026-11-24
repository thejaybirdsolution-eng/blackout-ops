/* ============================================================================
   BLACKOUT OPS — Survival item, tool & weapon iconography.
   Hand-drawn 24×24 line glyphs, tinted per category, shared by the hotbar,
   inventory, crafting and build screens.
============================================================================ */
(function (BO) {
    'use strict';

    const G = {
        fist: '<path d="M7 11V7.5a1.5 1.5 0 0 1 3 0V10m0-2.5V6.5a1.5 1.5 0 0 1 3 0V10m0-2.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-1.5A5.5 5.5 0 0 1 5 14.5V12a1.5 1.5 0 0 1 2-1"/>',
        pistol: '<path d="M3 7h15l1 3h-6l-1 2h-3l-1.5 6H4l1.6-6.4L3 10z"/><path d="M10 12l.7 2.2"/>',
        rifle: '<path d="M2 10h13l2-2h4v3l-4 1-1 2h-3l-1 5H9l1-5H6L4 13H2z"/><path d="M7 10V8h4v2"/>',
        blade: '<path d="M19 3 9 13l2 2L21 5V3z"/><path d="M7.5 14.5l2 2M5 17l2 2M8 16l-4.5 4.5"/>',
        coilgun: '<path d="M2 10h15l3 2-3 2H2z"/><path d="M6 8v8M9 8v8M12 8v8"/><path d="M9 14l-1 5"/>',
        axe: '<path d="M14 4l6 6"/><path d="M5 19 16 8"/><path d="M13.5 5.5c-2 0-4 1-5 3 2 1 3.5 2.5 4 4 2-1 3-3 3-5z"/>',
        pick: '<path d="M6 19 15 10"/><path d="M4 9c4-5 11-5 15 0"/><path d="M11 5.4 18.6 13"/>',
        shovel: '<path d="M5 19l9-9"/><path d="M13 7l4-4 4 4-4 4z"/><path d="M4 18l2 2"/>',
        saw: '<path d="M4 16 16 4"/><path d="M4 16c3 3 8 3 12 0"/><path d="M6.5 13.5l1 1M9 11l1 1M11.5 8.5l1 1M14 6l1 1"/>',
        drill: '<path d="M3 9h9v6H3z"/><path d="M12 10.5h4l5 1.5-5 1.5h-4"/><path d="M6 15v4h3"/>',
        log: '<ellipse cx="7" cy="12" rx="3" ry="5"/><path d="M7 7h11a3 5 0 0 1 0 10H7"/><ellipse cx="7" cy="12" rx="1.2" ry="2"/>',
        planks: '<path d="M3 6h18v4H3zM3 14h18v4H3z"/><path d="M8 6v4M15 14v4"/>',
        stone: '<path d="M4 15l3-7 6-2 5 3 2 6-4 4H8z"/><path d="M9 12l3 1 2-2"/>',
        ore: '<path d="M4 15l3-7 6-2 5 3 2 6-4 4H8z"/><path d="M9 10l2 2M13 9l1.5 2M10 15l2-1"/>',
        crystal: '<path d="M12 2l5 6-5 14-5-14z"/><path d="M7 8h10M12 2v20"/>',
        leaf: '<path d="M5 19C5 10 11 5 20 4c0 9-5 15-14 15"/><path d="M5 19l8-8"/>',
        drop: '<path d="M12 3c3 5 6 8 6 11a6 6 0 0 1-12 0c0-3 3-6 6-11z"/>',
        clay: '<path d="M4 16c0-4 3-7 8-7s8 3 8 7-4 4-8 4-8 0-8-4z"/><path d="M8 13c2-1 6-1 8 0"/>',
        cord: '<ellipse cx="12" cy="12" rx="7" ry="4"/><ellipse cx="12" cy="12" rx="4" ry="2"/><path d="M19 12v4"/>',
        ingot: '<path d="M3 16l3-6h12l3 6z"/><path d="M6 10l2-3h8l2 3"/>',
        brick: '<path d="M3 7h18v10H3z"/><path d="M3 12h18M9 7v5M15 12v5"/>',
        wire: '<path d="M4 18c3-6 4-6 6 0s3 6 6 0 3-6 4-2"/><path d="M4 6h16"/>',
        lens: '<circle cx="12" cy="12" r="7"/><path d="M9 9a4 4 0 0 1 4-1"/>',
        gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
        cloth: '<path d="M4 6c3 2 5 2 8 0s5-2 8 0v12c-3-2-5-2-8 0s-5 2-8 0z"/>',
        fuel: '<path d="M6 6h9l3 3v11H6z"/><path d="M9 3h4v3M9 12l5 5M14 12l-5 5"/>',
        coil: '<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M5 8h14M5 12h14M5 16h14"/>',
        can: '<ellipse cx="12" cy="6" rx="6" ry="2"/><path d="M6 6v12c0 1 3 2 6 2s6-1 6-2V6"/><path d="M6 11h12"/>',
        medkit: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M12 10v7M8.5 13.5h7"/>',
        bandage: '<path d="M5 15 15 5a3 3 0 0 1 4 4L9 19a3 3 0 0 1-4-4z"/><path d="M10 10l4 4M11 8.5l.01 0M8.5 11l.01 0"/>',
        bottle: '<path d="M10 2h4v3l2 3v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V8l2-3z"/><path d="M8 12h8"/>',
        cup: '<path d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z"/><path d="M17 10h2a2 2 0 0 1 0 4h-2M8 3v2M12 3v2"/>',
        bowl: '<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 7c0-2 2-2 2-4M13 7c0-2 2-2 2-4"/>',
        vial: '<path d="M9 3h6M10 3v6L5 18a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7 15h10"/>',
        syringe: '<path d="M14 4l6 6M17 7l-9 9-4 1 1-4 9-9"/><path d="M9 11l2 2M4 20l2-2"/>',
        flare: '<path d="M9 21l6-6"/><path d="M13 17l-6-6 6-6 6 6z"/><path d="M15 3l1 2M19 7l2 1"/>',
        mask: '<path d="M5 9c0-3 3-5 7-5s7 2 7 5v3c0 4-3 8-7 8s-7-4-7-8z"/><circle cx="9" cy="14" r="2"/><circle cx="15" cy="14" r="2"/>',
        wrench: '<path d="M14 6a4 4 0 0 0 5 5l-9 9a2 2 0 0 1-3-3l9-9a4 4 0 0 1-2-2z"/>',
        torch: '<path d="M10 21l2-10 2 10z"/><path d="M12 3c2 2 3 3.5 3 5a3 3 0 0 1-6 0c0-1.5 1-3 3-5z"/>',
        lantern: '<path d="M9 4h6M12 2v2M7 7h10l-1 12H8z"/><path d="M12 10c1 1 1.6 2 1.6 3a1.6 1.6 0 0 1-3.2 0c0-1 .6-2 1.6-3z"/>',
        scroll: '<path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M9 8h7M9 12h7M9 16h4"/>',
        seed: '<path d="M12 21c-5-2-7-6-6-12 3-2 9-2 12 0 1 6-1 10-6 12z"/><path d="M12 8v13"/>',
        hook: '<path d="M12 3v11a4 4 0 1 1-4-4"/><path d="M10 3h4"/>',
        plate: '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/>',
        flask: '<path d="M9 3h6M10 3v5l-5 8a3 3 0 0 0 3 5h8a3 3 0 0 0 3-5l-5-8V3"/><path d="M8 15c2 1 6 1 8 0"/>',
        rune: '<path d="M12 2l7 10-7 10-7-10z"/><path d="M12 7v10M9 10l3 2 3-2"/>',
        tech: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="8"/>',
        build: '<path d="M3 21h18M5 21V10l7-6 7 6v11"/><path d="M10 21v-6h4v6"/>',
        wall: '<path d="M3 5h18v14H3z"/><path d="M3 10h18M3 15h18M8 5v5M15 10v5M11 15v4"/>',
        floor: '<path d="M2 15l10-5 10 5-10 5z"/><path d="M7 12.5l10 5M17 12.5l-10 5"/>',
        roof: '<path d="M2 13 12 5l10 8"/><path d="M5 11v8h14v-8"/>',
        bed: '<path d="M3 18v-8h18v8M3 14h18"/><path d="M6 10V8h4v2"/>',
        bench: '<path d="M3 9h18v3H3zM5 12v7M19 12v7"/><path d="M8 9V6h3v3"/>',
        ladder: '<path d="M8 3v18M16 3v18M8 7h8M8 11h8M8 15h8M8 19h8"/>',
        fire: '<path d="M12 3c3 4 6 6 6 10a6 6 0 0 1-12 0c0-2 1-4 3-5 0 2 1 3 2 3-1-3 0-6 1-8z"/><path d="M5 21h14"/>',
        chest: '<path d="M3 9h18v11H3z"/><path d="M3 9c0-3 2-5 9-5s9 2 9 5M3 13h18M11 12h2v3h-2z"/>',
        kiln: '<path d="M5 21V9l7-5 7 5v12z"/><path d="M9 21v-5a3 3 0 0 1 6 0v5"/>',
        spikes: '<path d="M2 20h20M4 20l2-9 2 9M10 20l2-12 2 12M16 20l2-9 2 9"/>',
        door: '<path d="M6 21V3h12v18"/><path d="M15 12h.01M3 21h18"/>',
        turret: '<path d="M6 21l3-7h6l3 7M12 14V9"/><path d="M8 9h8v-4H8zM16 7h5"/>',
        generator: '<path d="M3 8h18v11H3z"/><path d="M13 10l-3 4h4l-3 4"/>',
        beacon: '<path d="M10 21h4l1-9H9z"/><path d="M12 3l2 4-2 3-2-3z"/><path d="M6 6l2 1M18 6l-2 1"/>',
        altar: '<path d="M4 21h16M6 21v-7h12v7M5 14h14"/><path d="M12 3l2 4-2 3-2-3z"/>',
        machine: '<path d="M4 6h16v13H4z"/><circle cx="12" cy="12.5" r="3.5"/><path d="M8 3v3M16 3v3"/>',
        snare: '<path d="M2 14c2-3 4-3 5 0s3 3 5 0 3-3 5 0 3 3 5 0"/><path d="M5 10l1 1M10 9l1 1M15 10l1 1"/>',
        platform: '<path d="M3 9h18v3H3zM5 12v9M19 12v9M12 12v9"/>',
        unknown: '<rect x="5" y="5" width="14" height="14" rx="3"/><path d="M10 10a2 2 0 1 1 3 1.7c-.7.4-1 .8-1 1.3M12 16h.01"/>'
    };

    const CAT_COLOR = {
        weapon: '#f8d17a', tool: '#9fd4c7', 'Raw materials': '#c9b28f', Components: '#a9b8c9',
        Consumables: '#9be3a6', Lighting: '#ffc46e', Keys: '#e2c7ff', Tools: '#9fd4c7', build: '#b7d3c3'
    };

    const ITEM_GLYPH = {
        scrap: 'gear', cloth: 'cloth', fuel: 'fuel', rations: 'can', medkits: 'medkit', coil: 'coil',
        timber: 'log', stone: 'stone', iron: 'ore', coal: 'ore', copper: 'ore', quartz: 'crystal',
        fiber: 'leaf', resin: 'drop', clay: 'clay', herbs: 'leaf', planks: 'planks', cord: 'cord',
        ingot: 'ingot', brick: 'brick', wire: 'wire', lens: 'lens', torch: 'torch', lantern: 'lantern',
        bandage: 'bandage', tea: 'cup', filter: 'mask', repair: 'wrench', caveMap: 'scroll', relic: 'crystal',
        aetherShard: 'crystal', stew: 'bowl', espresso: 'cup', antibiotic: 'vial', broth: 'bowl',
        aetherStim: 'syringe', orbitalFlare: 'flare', jugBrew: 'vial', speedTonic: 'vial',
        staminElixir: 'vial', deadshotTinc: 'vial', cropSeeds: 'seed', freshWater: 'bottle', salvageLine: 'hook'
    };
    const ITEM_TINT = {
        iron: '#d39a7c', coal: '#8d93a6', copper: '#7cc6ad', quartz: '#a8e3f5', relic: '#d6aef2',
        aetherShard: '#c79bff', medkits: '#ff8a8a', bandage: '#f1e6cf', jugBrew: '#ff9a9a',
        speedTonic: '#9ad0ff', staminElixir: '#a8f0a0', deadshotTinc: '#ffd27a', antibiotic: '#bff0e1',
        freshWater: '#8fd3ff', fuel: '#ffb36b', torch: '#ffb35c', lantern: '#ffe08a', coil: '#9fe2ff'
    };
    const TOOL_GLYPH = { axe: 'axe', pick: 'pick', shovel: 'shovel' };
    const TOOL_SPECIAL = { saw: 'saw', miningDrill: 'drill' };
    const BUILD_GLYPH = {
        wall: 'wall', stoneWall: 'wall', floor: 'floor', stoneFloor: 'floor', roof: 'roof', bed: 'bed',
        bench: 'bench', ladder: 'ladder', campfire: 'fire', chest: 'chest', wallTorch: 'torch', kiln: 'kiln',
        spikes: 'spikes', wire: 'snare', door: 'door', platform: 'platform', smelter: 'machine', hydro: 'bottle',
        turret: 'turret', generator: 'generator', beacon: 'beacon', infuser: 'altar'
    };

    function svg(glyph, color, size = 24) {
        return `<svg class="sv-ico" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${G[glyph] || G.unknown}</svg>`;
    }

    function weaponGlyph(weapon) {
        const kind = weapon?.stats?.kind;
        const cls = weapon?.stats?.class || weapon?.stats?.category || '';
        if (weapon?.survivalCoil) return 'coilgun';
        if (kind === 'melee') return 'blade';
        if (/pistol|handgun|sidearm/i.test(cls) || (weapon?.stats?.magSize || 99) <= 15 && /1911|deagle|glock|pistol|revolver|usp/i.test(weapon?.cfg?.id || '')) return 'pistol';
        return 'rifle';
    }

    BO.SurvivalIcons = {
        glyphs: G,
        svg,
        item(id, size) {
            const cat = BO.SurvivalFrontierData?.items?.[id]?.[1];
            return svg(ITEM_GLYPH[id] || 'unknown', ITEM_TINT[id] || CAT_COLOR[cat] || '#cfd8d3', size);
        },
        tool(id, size) {
            const t = BO.SurvivalFrontierData?.tools?.[id];
            const glyph = TOOL_SPECIAL[id] || TOOL_GLYPH[t?.family] || 'wrench';
            const tint = t?.level >= 4 ? '#c79bff' : t?.level >= 2 ? '#c7d3dc' : '#b8a68c';
            return svg(glyph, tint, size);
        },
        weapon(weapon, size) {
            return svg(weaponGlyph(weapon), weapon?.isPaP ? '#c084fc' : (weapon?.survivalMk > 1 ? '#fde68a' : CAT_COLOR.weapon), size);
        },
        build(id, size) { return svg(BUILD_GLYPH[id] || 'build', CAT_COLOR.build, size); },
        fist(size) { return svg('fist', '#e7d9c4', size); },
        named(glyph, color = '#cfe3da', size) { return svg(glyph, color, size); },
        categoryColor(cat) { return CAT_COLOR[cat] || '#cfd8d3'; }
    };
})(window.BO);
