/* ============================================================================
   BLACKOUT OPS — Survival item, tool & weapon iconography.
   Hand-drawn 24×24 line glyphs, tinted per category, shared by the hotbar,
   inventory, crafting and build screens. Every item, tool and buildable has a
   dedicated glyph and tint — zero placeholder question marks.
============================================================================ */
(function (BO) {
    'use strict';

    const G = {
        grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
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
        key: '<circle cx="7.5" cy="12" r="4"/><path d="M11.5 12H21M17.5 12v3.5M20.5 12v2.5"/>',
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
        // Wild Zone, Ammunition, Food, Dungeon & Armory glyphs
        ammo: '<path d="M7 20V10l2.5-6 2.5 6v10zM14.5 20v-8l2-5 2 5v8z"/><path d="M6 16h7M14 16h5"/>',
        shell: '<rect x="7" y="5" width="10" height="15" rx="1.5"/><path d="M7 15h10M9 5V3h6v2"/>',
        powder: '<path d="M6 18c1-5 3.5-9 6-9s5 4 6 9z"/><circle cx="9" cy="15" r=".7"/><circle cx="13" cy="13" r=".7"/><circle cx="14.5" cy="16" r=".7"/>',
        chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
        battery: '<rect x="6" y="6" width="12" height="15" rx="2"/><path d="M9.5 3h5v3h-5zM12 10l-2 3.5h4L12 17"/>',
        card: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 14h4M15 14h2"/>',
        splint: '<path d="M7 3v18M17 3v18M5 8h14M5 12h14M5 16h14"/>',
        pill: '<rect x="4" y="9" width="16" height="6" rx="3" transform="rotate(-35 12 12)"/><path d="M10 10l4 4"/>',
        meat: '<path d="M6 8c3-4 10-4 12 1s-1 10-6 10c-4 0-8-3-8-7 0-1.5.7-2.8 2-4z"/><circle cx="13.5" cy="11" r="2"/>',
        roast: '<path d="M6 10c3-4 10-4 12 1s-1 9-6 9c-4 0-8-3-8-6.5 0-1.5.7-2.5 2-3.5z"/><circle cx="13.5" cy="12.5" r="1.8"/><path d="M9 5c0-1.5 1.5-1.5 1.5-3M14 5c0-1.5 1.5-1.5 1.5-3"/>',
        fish: '<path d="M3 12c3-4.5 8-5.5 13-2l5-3-1.5 5 1.5 5-5-3c-5 3.5-10 2.5-13-2z"/><circle cx="7.5" cy="11.5" r=".8"/>',
        egg: '<path d="M12 3c4 0 7 5.5 7 10.5A7 7 0 0 1 5 13.5C5 8.5 8 3 12 3z"/>',
        mushroom: '<path d="M4 12a8 7 0 0 1 16 0z"/><path d="M10 12v7a2 2 0 0 0 4 0v-7"/><circle cx="9" cy="9" r=".9"/><circle cx="14" cy="8.5" r=".9"/>',
        berries: '<circle cx="9" cy="14" r="3"/><circle cx="15" cy="14" r="3"/><circle cx="12" cy="18" r="3"/><path d="M12 11V5c2-1 4-1 5 1"/>',
        honey: '<path d="M7 7h10l1.5 4v8a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-8z"/><path d="M8 4h8v3H8zM6 12h12"/>',
        pie: '<path d="M3 14l2-4c4-2 10-2 14 0l2 4z"/><path d="M3 14c0 3 4 5 9 5s9-2 9-5"/><path d="M9 11l1.5 2M15 11l-1.5 2"/>',
        pelt: '<path d="M6 4l3 2h6l3-2 2 4-2 3 1 5-3 4h-8l-3-4 1-5-2-3z"/>',
        feather: '<path d="M20 4C13 4 7 9 5 17l-2 3 3-2c8-2 13-8 14-14z"/><path d="M4 19L16 7"/>',
        bone: '<path d="M7 5a2.2 2.2 0 1 0-2 3.2L15.8 19a2.2 2.2 0 1 0 3.2-2L8.2 6.2A2.2 2.2 0 0 0 7 5z"/>',
        antler: '<path d="M12 21v-7M12 14L6 8V4M12 14l6-6V4M8 10V6M16 10V6M4 7h2M18 7h2"/>',
        candle: '<rect x="9" y="10" width="6" height="11" rx="1"/><path d="M12 3c1.5 1.8 2.2 3 2.2 4.2a2.2 2.2 0 0 1-4.4 0C9.8 6 10.5 4.8 12 3z"/><path d="M6 21h12"/>',
        vest: '<path d="M6 4l3 3h6l3-3 3 4-2 4v8H5v-8L3 8z"/><path d="M9 12h6M9 16h6"/>',
        grenade: '<ellipse cx="12" cy="14" rx="5.5" ry="6.5"/><path d="M10 7.5V5h4v2.5M14 5l3 2v3"/><path d="M7 14h10M12 8v12"/>',
        molotov: '<path d="M9 9h6l2 3.5V20a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 20v-7.5z"/><path d="M10.5 6h3v3h-3z"/><path d="M12 6c0-2 2-3 4-3-1 1.5-.5 3 1 3.5"/>',
        spyglass: '<path d="M3 16l6-3 9-6 3 4.5-9 6-5.5 2.5z"/><path d="M9 13l2.5 3.8M15 9l2.8 4.2"/>',
        bedroll: '<ellipse cx="7" cy="13" rx="3.5" ry="5"/><path d="M7 8h11a3.5 5 0 0 1 0 10H7"/><path d="M12 8v10M16 8v10"/>',
        wheel: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/><path d="M12 4v5.5M12 14.5V20M4 12h5.5M14.5 12H20M6.3 6.3l3.9 3.9M13.8 13.8l3.9 3.9M17.7 6.3l-3.9 3.9M10.2 13.8l-3.9 3.9"/>',
        stove: '<rect x="3" y="9" width="18" height="12" rx="1.5"/><path d="M6 9V6h6v3M17 9V4"/><circle cx="8.5" cy="15" r="2"/><path d="M14 13h4v5h-4z"/>',
        smoker: '<path d="M5 10L12 4l7 6v11H5z"/><path d="M9 21v-6h6v6M12 4V2m3 1c0-1 1.5-1 1.5-2"/>',
        rack: '<path d="M4 4v17M20 4v17M4 6h16M4 19h16"/><path d="M8 8l2 2h4l2-2-1 8H9z"/>',
        scope: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
        suppressor: '<rect x="2" y="9" width="14" height="6" rx="1.5"/><path d="M16 10.5h6v3h-6zM6 9v6M10 9v6"/>',
        paw: '<ellipse cx="12" cy="15.5" rx="4.2" ry="3.5"/><circle cx="6.5" cy="10.5" r="1.7"/><circle cx="10" cy="8" r="1.7"/><circle cx="14" cy="8" r="1.7"/><circle cx="17.5" cy="10.5" r="1.7"/>',
        portal: '<ellipse cx="12" cy="12" rx="7" ry="9"/><ellipse cx="12" cy="12" rx="3.5" ry="5"/><path d="M12 3v2M12 19v2"/>',
        skull: '<path d="M12 3a7 7 0 0 0-7 7c0 2.6 1.3 4.6 3 5.7V19h8v-3.3c1.7-1.1 3-3.1 3-5.7a7 7 0 0 0-7-7z"/><circle cx="9.5" cy="11" r="1.3"/><circle cx="14.5" cy="11" r="1.3"/><path d="M10 19v2M14 19v2"/>',
        // Zone Expansion glyphs (Minecraft-inspired relics, crops, potions, stairs & gadgets)
        emerald: '<polygon points="12,2 19,7 19,17 12,22 5,17 5,7"/><polygon points="12,6 15.5,8.5 15.5,15.5 12,18 8.5,15.5 8.5,8.5"/>',
        diamond: '<polygon points="7,4 17,4 21,9 12,21 3,9"/><path d="M3 9h18M7 4l5 17M17 4l-5 17"/>',
        pearl: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/><path d="M9 7.5a5 5 0 0 1 5.5 1"/>',
        totem: '<path d="M9 4h6v5l4 2-4 2v7H9v-7L5 11l4-2z"/><path d="M10.5 7h.01M13.5 7h.01M12 12v5"/>',
        apple: '<path d="M12 7c-4-1-7 2-7 6.5C5 18 8 21 12 20c4 1 7-2 7-6.5C19 9 16 6 12 7z"/><path d="M12 7c0-2 1.5-3.5 3.5-4M10 4.5c1.2.2 2 1 2 2.5"/>',
        carrot: '<path d="M6 18 15 6c2 1 3 2 3 4L6 18z"/><path d="M15 6l2-3M17 7l3-1M14 5V2"/>',
        bread: '<path d="M4 13c0-4 3.5-6 8-6s8 2 8 6v4H4z"/><path d="M9 9l1 2.5M14 9l1 2.5"/>',
        wheat: '<path d="M12 21V5M9 8l3 3 3-3M9 12l3 3 3-3M9 16l3 3 3-3M12 3l-1.5 2.5L12 7l1.5-1.5z"/>',
        melon: '<path d="M4 10a8 8 0 0 0 16 0z"/><path d="M6.5 10a5.5 5.5 0 0 0 11 0M10 12.5h.01M14 12.5h.01M12 14h.01"/>',
        tnt: '<rect x="4" y="6" width="16" height="14" rx="1.5"/><path d="M4 11h16M4 15h16M12 6V3c1.5-1 3 0 4-1"/>',
        grapple: '<path d="M12 10v11M12 4l-5 5M12 4l5 5M12 4l-2 6M12 4l2 6"/>',
        magnet: '<path d="M6 5v7a6 6 0 0 0 12 0V5h-3.5v7a2.5 2.5 0 0 1-5 0V5z"/><path d="M6 8.5h3.5M14.5 8.5H18"/>',
        shears: '<circle cx="7" cy="18" r="2.5"/><circle cx="17" cy="18" r="2.5"/><path d="M9 16 18 4M15 16 6 4"/>',
        stairs: '<path d="M3 20h18V5h-4.5v5H12v5H7.5v5H3z"/>',
        tower: '<path d="M5 21l2-10h10l2 10M4 11h16V7H4zM8 7V4h8v3M9 21l3-6 3 6"/>',
        arch: '<path d="M4 21V5h16v16h-4v-7a4 4 0 0 0-8 0v7z"/>',
        hopper: '<path d="M3 5h18l-6 8v6l-6 2v-8z"/>',
        unknown: '<rect x="5" y="5" width="14" height="14" rx="3"/><path d="M10 10a2 2 0 1 1 3 1.7c-.7.4-1 .8-1 1.3M12 16h.01"/>'
    };

    const CAT_COLOR = {
        weapon: '#f8d17a', tool: '#9fd4c7', Food: '#f4b97a', Ammunition: '#9fd4ff', Equipment: '#b5d6c6',
        'Raw materials': '#c9b28f', Components: '#a9b8c9', Consumables: '#9be3a6',
        Lighting: '#ffc46e', Keys: '#e2c7ff', Tools: '#9fd4c7', build: '#b7d3c3'
    };

    const ITEM_GLYPH = {
        // Core & Frontier
        scrap: 'gear', cloth: 'cloth', fuel: 'fuel', rations: 'can', medkits: 'medkit', coil: 'coil',
        timber: 'log', stone: 'stone', iron: 'ore', coal: 'ore', copper: 'ore', quartz: 'crystal',
        fiber: 'leaf', resin: 'drop', clay: 'clay', herbs: 'leaf', planks: 'planks', cord: 'cord',
        ingot: 'ingot', brick: 'brick', wire: 'wire', lens: 'lens', torch: 'torch', lantern: 'lantern',
        bandage: 'bandage', tea: 'cup', filter: 'mask', repair: 'wrench', caveMap: 'scroll', relic: 'crystal',
        aetherShard: 'crystal', stew: 'bowl', espresso: 'cup', antibiotic: 'vial', broth: 'bowl',
        aetherStim: 'syringe', orbitalFlare: 'flare', jugBrew: 'vial', speedTonic: 'vial',
        staminElixir: 'vial', deadshotTinc: 'vial', cropSeeds: 'seed', freshWater: 'bottle', salvageLine: 'hook',
        thermals: 'vest',
        // ZoneLoot ammunition, reloading & electronics
        ammo9: 'ammo', ammo556: 'ammo', ammo762: 'ammo', ammo12: 'shell',
        brass: 'ammo', powder: 'powder', primers: 'powder',
        gunkit: 'wrench', splint: 'splint', painkillers: 'pill', canned: 'can',
        battery: 'battery', radioParts: 'machine', circuit: 'chip', keycard: 'card',
        // Wild Zone raw & cooked food + cooking-station meals
        raw_venison: 'meat', cooked_venison: 'roast',
        raw_pork: 'meat', cooked_pork: 'roast',
        raw_rabbit: 'meat', cooked_rabbit: 'roast',
        raw_fowl: 'meat', cooked_fowl: 'roast',
        raw_mutton: 'meat', cooked_mutton: 'roast',
        raw_bear: 'meat', cooked_bear: 'roast',
        raw_wolf: 'meat', cooked_wolf: 'roast',
        raw_beef: 'meat', cooked_beef: 'roast',
        raw_fish: 'fish', cooked_fish: 'fish',
        egg: 'egg', fried_egg: 'egg',
        mushroom: 'mushroom', roast_mushroom: 'mushroom',
        berries: 'berries', honey: 'honey', jerky: 'roast',
        hunter_stew: 'bowl', meat_pie: 'pie', omelette: 'pie', mushroom_soup: 'bowl',
        berry_pie: 'pie', honey_ham: 'roast', survivor_feast: 'bowl', golden_ration: 'roast',
        // Wild Zone materials & crafted gear
        hide: 'pelt', leather: 'pelt', feather: 'feather', bone: 'bone', bonemeal: 'powder',
        fat: 'drop', wool: 'cloth', antler: 'antler',
        sand: 'powder', glass: 'lens', bottle: 'bottle', flint: 'stone',
        sulfur: 'ore', salt: 'crystal', gold_ore: 'ore', gold: 'ingot', obsidian: 'crystal',
        candle: 'candle', leather_armor: 'vest', hide_armor: 'vest', obsidian_armor: 'vest',
        plate_ceramic: 'plate', plate_steel: 'plate', plate_composite: 'plate',
        frag_grenade: 'grenade', molotov: 'molotov', spyglass: 'spyglass',
        bedroll: 'bedroll', fishing_bait: 'hook', fireworks: 'flare',
        scrap_wheel: 'wheel', engine_parts: 'machine',
        // Armory attachment kits
        optic_kit: 'scope', suppressor_kit: 'suppressor', mag_kit: 'ammo', grip_kit: 'wrench',
        // Zone Expansion items, relics, potions, farming crops & tactical gadgets
        emerald_chip: 'emerald', diamond_shard: 'diamond', abyssal_alloy: 'ingot',
        lapis_prism: 'crystal', flux_dust: 'powder', slime_gel: 'drop',
        cinder_rod: 'torch', wraith_tear: 'drop', spider_silk: 'cord', xp_bottle: 'flask',
        phase_pearl: 'pearl', chorus_fruit: 'berries', resurrection_idol: 'totem',
        gilded_apple: 'apple', enchanted_apple: 'apple', milk_flask: 'bottle',
        swiftness_draught: 'flask', leaping_draught: 'flask', strength_draught: 'flask',
        night_vision_draught: 'flask', fire_ward_draught: 'flask', turtle_shell_brew: 'flask',
        phantom_draught: 'flask', regen_draught: 'flask',
        wheat: 'wheat', flour: 'powder', bread: 'bread', apple: 'apple',
        carrot: 'carrot', golden_carrot: 'carrot', potato: 'egg', baked_potato: 'roast',
        pumpkin: 'can', pumpkin_pie: 'pie', sugar_reed: 'wheat', sugar: 'powder',
        cocoa_beans: 'seed', cookie_ration: 'pie', melon_slice: 'melon', glistering_melon: 'melon',
        rabbit_ragout: 'bowl', cake_slice: 'pie',
        grappling_hook: 'grapple', tnt_charge: 'tnt', magnet_charm: 'magnet',
        super_boss_beacon: 'beacon', abyssal_armor: 'vest', fort_flare: 'flare'
    };

    const ITEM_TINT = {
        iron: '#d39a7c', coal: '#8d93a6', copper: '#7cc6ad', quartz: '#a8e3f5', relic: '#d6aef2',
        aetherShard: '#c79bff', medkits: '#ff8a8a', bandage: '#f1e6cf', jugBrew: '#ff9a9a',
        speedTonic: '#9ad0ff', staminElixir: '#a8f0a0', deadshotTinc: '#ffd27a', antibiotic: '#bff0e1',
        freshWater: '#8fd3ff', fuel: '#ffb36b', torch: '#ffb35c', lantern: '#ffe08a', coil: '#9fe2ff',
        // New tints
        ammo9: '#ffd88a', ammo556: '#9fd4ff', ammo762: '#ffb07a', ammo12: '#ff7a6b',
        brass: '#e2b95b', powder: '#9aa0a8', primers: '#d4c39a', gunkit: '#9fd4c7',
        splint: '#d8c39e', painkillers: '#9fe0ff', canned: '#b5cf98', battery: '#7ee8a8',
        radioParts: '#9fc5d8', circuit: '#6ad49a', keycard: '#ffd27a', thermals: '#9fd4ff',
        raw_venison: '#e07a7a', raw_pork: '#eb8f8f', raw_rabbit: '#e5958e', raw_fowl: '#ebb09a',
        raw_mutton: '#df7d7d', raw_bear: '#c95f5f', raw_wolf: '#c46c6c', raw_beef: '#d96666', raw_fish: '#7ec8e3',
        cooked_venison: '#d98a4e', cooked_pork: '#e09658', cooked_rabbit: '#dba065', cooked_fowl: '#e5ac67',
        cooked_mutton: '#d4874c', cooked_bear: '#b8683c', cooked_wolf: '#be7648', cooked_beef: '#c97842', cooked_fish: '#e8a864',
        egg: '#f5ecd4', fried_egg: '#ffe07a', mushroom: '#d4b48c', roast_mushroom: '#c98d55',
        berries: '#e06388', honey: '#ffbe42', jerky: '#b5633c',
        hunter_stew: '#e59a54', meat_pie: '#e2ad6b', omelette: '#ffd86b', mushroom_soup: '#d4b185',
        berry_pie: '#df7aa0', honey_ham: '#f09c4f', survivor_feast: '#ffd27a', golden_ration: '#ffe066',
        hide: '#b08968', leather: '#9c6644', feather: '#e6eef2', bone: '#ede8dc', bonemeal: '#f2efe4',
        fat: '#f2dfb3', wool: '#f0ece1', antler: '#d6c3a5',
        sand: '#e6d19c', glass: '#bceeff', bottle: '#a8e4f7', flint: '#8c929c',
        sulfur: '#ebe04b', salt: '#f4f1ea', gold_ore: '#ebb844', gold: '#ffd24a', obsidian: '#9b6bff',
        candle: '#ffd98a', leather_armor: '#b87d52', hide_armor: '#c9b496', obsidian_armor: '#b48cff',
        plate_ceramic: '#e7e5e4', plate_steel: '#94a3b8', plate_composite: '#a78bfa',
        frag_grenade: '#8fb87a', molotov: '#ff8a47', spyglass: '#e8c468',
        bedroll: '#8fc2a9', fishing_bait: '#eb9486', fireworks: '#ff7ad9',
        scrap_wheel: '#9aa4ad', engine_parts: '#b5c4d4',
        optic_kit: '#7ee8fa', suppressor_kit: '#9fd4c7', mag_kit: '#ffd27a', grip_kit: '#c7d3dc',
        // Zone Expansion tints
        emerald_chip: '#34d399', diamond_shard: '#38bdf8', abyssal_alloy: '#c084fc',
        lapis_prism: '#60a5fa', flux_dust: '#f87171', slime_gel: '#86efac',
        cinder_rod: '#fb923c', wraith_tear: '#e2e8f0', spider_silk: '#f1f5f9', xp_bottle: '#bef264',
        phase_pearl: '#a855f7', chorus_fruit: '#d8b4fe', resurrection_idol: '#facc15',
        gilded_apple: '#fde047', enchanted_apple: '#e879f9', milk_flask: '#f8fafc',
        swiftness_draught: '#7dd3fc', leaping_draught: '#86efac', strength_draught: '#fca5a5',
        night_vision_draught: '#818cf8', fire_ward_draught: '#fdba74', turtle_shell_brew: '#94a3b8',
        phantom_draught: '#cbd5e1', regen_draught: '#f472b6',
        wheat: '#facc15', flour: '#fef3c7', bread: '#d97706', apple: '#f87171',
        carrot: '#fb923c', golden_carrot: '#fde047', potato: '#d6bc8b', baked_potato: '#e09f5a',
        pumpkin: '#f97316', pumpkin_pie: '#fb923c', sugar_reed: '#a3e635', sugar: '#f8fafc',
        cocoa_beans: '#a16207', cookie_ration: '#d97706', melon_slice: '#f43f5e', glistering_melon: '#fbbf24',
        rabbit_ragout: '#ea580c', cake_slice: '#fbcfe8',
        grappling_hook: '#94a3b8', tnt_charge: '#ef4444', magnet_charm: '#60a5fa',
        super_boss_beacon: '#f43f5e', abyssal_armor: '#a855f7', fort_flare: '#fb7185'
    };

    const TOOL_GLYPH = { axe: 'axe', pick: 'pick', shovel: 'shovel' };
    const TOOL_SPECIAL = { saw: 'saw', miningDrill: 'drill', shears: 'shears' };
    const BUILD_GLYPH = {
        wall: 'wall', stoneWall: 'wall', obsidianWall: 'wall', floor: 'floor', stoneFloor: 'floor', roof: 'roof',
        bed: 'bed', bench: 'bench', ladder: 'ladder', campfire: 'fire', firepit: 'fire',
        cookstation: 'stove', tanrack: 'rack', smoker: 'smoker',
        chest: 'chest', wallTorch: 'torch', kiln: 'kiln',
        spikes: 'spikes', wire: 'snare', door: 'door', platform: 'platform', smelter: 'machine', hydro: 'bottle',
        turret: 'turret', generator: 'generator', beacon: 'beacon', infuser: 'altar',
        planter: 'seed', rainbarrel: 'drop', waystone: 'portal', armoryBench: 'scope',
        // Zone Expansion buildables
        woodStairs: 'stairs', stoneStairs: 'stairs', obsidianStairs: 'stairs',
        woodDoor: 'door', ironDoor: 'door', doubleGate: 'door',
        supplyCrate: 'chest', ironVault: 'chest', quantumChest: 'portal',
        alchemyStand: 'flask', arcaneTable: 'rune', autoCollector: 'hopper',
        wellPump: 'drop', compostBin: 'leaf',
        halfWall: 'wall', stoneHalfWall: 'wall', windowWall: 'wall', archway: 'arch',
        catwalk: 'floor', railing: 'splint', pillar: 'wall', watchtower: 'tower',
        sandbagWall: 'brick', barbedWire: 'snare', spikeWall: 'spikes', floodlight: 'lantern'
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
            return svg(ITEM_GLYPH[id] || 'gear', ITEM_TINT[id] || CAT_COLOR[cat] || '#cfd8d3', size);
        },
        tool(id, size) {
            const t = BO.SurvivalFrontierData?.tools?.[id];
            const glyph = TOOL_SPECIAL[id] || TOOL_GLYPH[t?.family] || 'wrench';
            const tint = t?.level >= 4 ? '#c084fc' : id.startsWith('diamond') ? '#38bdf8' : t?.level >= 2 ? '#c7d3dc' : '#b8a68c';
            return svg(glyph, tint, size);
        },
        weapon(weapon, size) {
            const rarCol = BO.ZoneThrill?.rarityOf?.(weapon)?.css;
            const col = weapon?.isPaP ? '#c084fc' : (rarCol && rarCol !== '#c9cdd2' ? rarCol : (weapon?.survivalMk > 1 ? '#fde68a' : CAT_COLOR.weapon));
            return svg(weaponGlyph(weapon), col, size);
        },
        build(id, size) {
            const tint = id === 'obsidianWall' || id === 'obsidianStairs' || id === 'waystone' || id === 'quantumChest' || id === 'arcaneTable' ? '#b48cff'
                : id === 'cookstation' || id === 'firepit' || id === 'smoker' || id === 'alchemyStand' ? '#ffb07a'
                : id === 'floodlight' ? '#fde047'
                : CAT_COLOR.build;
            return svg(BUILD_GLYPH[id] || 'build', tint, size);
        },
        fist(size) { return svg('fist', '#e7d9c4', size); },
        named(glyph, color = '#cfe3da', size) { return svg(glyph, color, size); },
        categoryColor(cat) { return CAT_COLOR[cat] || '#cfd8d3'; }
    };
})(window.BO);
