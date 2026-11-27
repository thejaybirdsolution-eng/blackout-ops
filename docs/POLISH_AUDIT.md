# BLACKOUT OPS — Cosmetic Polish Pass Audit

**Branch:** `polish/cosmetic-pass`  
**Baseline QA (`2026-11-27`):**
- `_qa_runner.html`: `3 / 4 PASSED` (pre-existing `MenuController.renderLegend` `bosses` tab TypeError at `src/ui/MenuController.js:1857`).
- `_qa_owrpg.html`: `119 / 120 PASSED` (baseline draw call check `274 calls` vs `target 180` on unmodified pre-existing OWRPG dirty tree); `BO.OWRPGValidator.runAll()` = `0 errors`.
- Browser console on `index.html`: `0` uncaught errors.
- Before screenshots captured under `docs/polish-screens/before-*.png`.

**Final Post-Polish QA (`2026-11-27`):**
- `_qa_runner.html`: `3 / 4 PASSED` (pre-existing `bosses` legend tab failure only; 0 regressions).
- `_qa_owrpg.html`: **`120 / 120 PASSED`** (`0` failures; `Validator: 0 errors`, `0 warnings`; Draw calls: `162 calls` < 180 target; Median frame cost: `2.0 ms`; `0` uncaught errors).
- `ConsoleErrors` reporter across all screens, menus, Zombies launch, and `?debug=hitboxes`: **`0`** uncaught errors.
- Visual, Settings (`#set-reduced-motion`, `#set-video-shake`, `#set-uivol`, `#set-mute-hidden`), Reduced Motion (`body.sv-reduced-motion`), and `?debug=hitboxes` wireframe verification passed with after screenshots in `docs/polish-screens/after-*.png` and `docs/polish-screens/hitbox-zombies-720.png`.

---

## 1. Visual Consistency

| ID | Area / Screen | File & Line | Issue | Planned Fix | Status |
|---|---|---|---|---|---|
| V-01 | Global CSS / Tokens | `css/styles.css:1–98`, `css/aaa-theme.css`, `css/ui-polish.css` | Four separate `:root` token blocks across `styles.css` and `aaa-theme.css`, plus `aaa-theme.css` using ~401 `!important`s and `styles.css` using ~146 `!important`s to override earlier rules. | Consolidate all `--aaa-*` palette, spacing (`4/8/12/16/24/32/48`), radius, font-size, z-index, and motion tokens into a single `:root` at the top of `css/styles.css`; refactor `aaa-theme.css` and mode CSS files to consume shared tokens and drop redundant `!important`s (~401 down to 58). | fixed |
| V-02 | Global CSS / Duplicates | `css/styles.css` | Duplicate definitions of `.btn`, `.menu-tile`, `.select-card`, and `.mod-row` in `css/styles.css`; legacy amber/sky-blue gradient scrollbar clashed with AAA graphite aesthetic. | Merged duplicated rules into single definitions using `--aaa-*` tokens and replaced legacy scrollbar with graphite rail + amber hover thumb. | fixed |
| V-03 | Main Menu | `css/styles.css`, `css/aaa-theme.css` | `.brand-tag` (`ONLINE & OFFLINE CO-OP`) inherited `clip-path` clipping trailing `P` to `CO-O`. | Reset `clip-path: none` on `.brand-tag`; verified unclipped at 1280×720 and 1920×1080. | fixed |
| V-04 | Main Menu | `css/aaa-theme.css` | `.mode-card-go` hid `INVITE →` on `.online-card` until hover. | Kept `.online-card .mode-card-go` visible (`--aaa-dim`) and highlighted green on hover/focus. | fixed |
| V-05 | Main Menu | `css/aaa-theme.css` | At `1280×720`, `.menu-col` overflowed and `.menu-mini-grid` left an empty grey 6th cell. | Tightened 720p padding/gaps, cleared empty 6th cell background, and capped `#menu-update-preview` clear of the 3D gun barrel. | fixed |
| V-06 | Minigames Hub | `css/minigames.css`, `css/aaa-theme.css` | `#screen-minigames .brand-title` rendered invisible via `color: transparent !important` conflict; stacked `.mgh-cats`/`.mgh-detail` children collapsed/overlapped at 720p. | Restored `--aaa-text` header color, added `flex-shrink: 0` on `.mgh-cats > *` & `.mgh-detail > *`, non-overlapping `.mgh-play`, and clean `<900px` collapse breakpoint. | fixed |
| V-07 | Gunsmith / Create-a-Class | `css/styles.css`, `css/aaa-theme.css` | Below `1000px`, `.cac-layout` squished panes; at 720p `.opt-card` items compressed/overlapped vertically inside `.opt-list`. | Added `.opt-list > .opt-card, .cac-slots > * { flex-shrink: 0; }` and clean `<900px` reflow; verified zero vertical overlap. | fixed |
| V-08 | Deployment Lobby | `css/styles.css`, `css/aaa-theme.css` | Sticky `#lobby-right .deploy-btn` overlapped `MATCH SUMMARY` at 720p. | Replaced sticky overlap with flex column flow + compact summary/button spacing; verified zero overlap at 720p. | fixed |
| V-09 | Barracks | `css/styles.css`, `css/aaa-theme.css` | `#barracks-tabs` tabs crowded/wrapped tightly. | Added uniform `gap`, `flex-wrap`, and `min-height: 32px` hit targets; verified 6 tabs with zero overlap. | fixed |
| V-10 | Settings (all tabs) | `css/ui-polish.css`, `css/aaa-theme.css`, `src/ui/UIPolish.js` | Missing Reduced Motion / Screen Shake under Video and UI Volume / Mute When Tab Hidden under Sound; inconsistent tab wrapping. | Unified tab wrapping/focus, standardized `--aaa-accent` toggles/ranges, and injected missing controls into Video and Sound tabs. | fixed |
| V-11 | Mode Stylesheets | `css/minigames.css`, `css/gm.css`, `css/survival-ui.css`, `css/rpg.css`, `css/update-log.css`, `css/modifier-board.css`, `css/vault-visuals.css`, `css/zone-thrill.css`, `css/ui-polish.css`, `css/aaa-theme.css` | Mode CSS used hardcoded legacy colors/scrollbars, suppressed `:focus-visible` outlines, and lacked OWRPG AAA alignment. | Aligned tokens/scrollbars across mode stylesheets, removed `outline: none` overrides on `:focus-visible`, and layered OWRPG overrides in `aaa-theme.css` (without touching dirty `css/owrpg.css`). | fixed |
| V-12 | In-Game HUD | `css/aaa-theme.css` | Corner HUD docks lacked consistent `--ui-scale` scaling; `#pointer-lock-hint` needed cleaner wrapping. | Added corner-origin `transform: scale(var(--ui-scale, 1))` on HUD corner docks (leaving crosshair unscaled) and formatted `#pointer-lock-hint`; verified Zombies HUD at 720p. | fixed |
| V-13 | Update Log | `index.html:649`, `src/data/UpdateLogData.js`, `css/update-log.css` | Header kicker ended at `NOV 26`; no summary entry for the polish pass; redundant `!important`s. | Updated kicker to `NOV 22 – NOV 27, 2026 (ET)`, cleaned `.ul-modal-box` tokens, and added Update #174. | fixed |
| V-14 | Empty / Loading / Error States | `css/aaa-theme.css`, `src/ui/UIPolish.js` | Shared styled empty/loading/error templates and network error toasts needed unification. | Added `.bo-empty-state`, `.bo-loading-state`, `.bo-skeleton`, `.bo-error-state`, `BO.UIPolish.renderState`, and `net:error` toast surfacing. | fixed |
| V-15 | Icons & Images | `assets/minigames/*.webp`, `assets/vault/*.webp`, `index.html` | Verify image assets exist on disk and icon-only close buttons carry accessible labels. | Verified all 9 minigame + 2 vault `.webp` files exist on disk; added `aria-label` on all icon-only `✕` close buttons. | fixed |

---

## 2. Hitboxes (UI Click Targets & 3D Hit Detection)

| ID | Area / Screen | File & Line | Issue | Planned Fix | Status |
|---|---|---|---|---|---|
| H-01 | UI Hit Targets | `css/aaa-theme.css` | Compact buttons, tabs, and rows risked falling below `32×32 px` (`44×44` touch). | Enforced `min-width: 32px; min-height: 32px` (44px on `@media (pointer: coarse)`) across interactive controls. | fixed |
| H-02 | Overlay Pointer-Events | `css/aaa-theme.css`, `src/ui/TooltipSystem.js` | Decorative overlays/tooltips/hidden modals could intercept pointer events or focus. | Enforced `pointer-events: none` on overlays/decorations/tooltips and `visibility: hidden; pointer-events: none` on `.hidden` UI containers. | fixed |
| H-03 | Survival Drag & Drop | `src/ui/SurvivalUI.js:395–431`, `css/survival-ui.css` | Inner slot children flickered dragover; invalid drops had no snap-back feedback or drag audio. | Disabled child `pointer-events` during `.sv-dragging`, added `dragleave` containment guard, `.bo-snap-back` shake on invalid drop, and drag/drop/disabled SFX. | fixed |
| H-04 | 3D Hitbox Debugger | `src/graphics/HitboxDebug.js`, `src/gm/GMDev.js`, `src/main.js`, `index.html` | No visual wireframe debugger existed to inspect animated 3D hitboxes. | Added `BO.HitboxDebug` (`?debug=hitboxes` + GMDev toggle, zero per-frame allocations) attached directly to hitbox meshes via `WeakMap` and verified wireframes in Zombies mode. | fixed |
| H-05 | Soldier / Bot Hitboxes | `src/graphics/SoldierModel.js:308` | Outer helmet `shell` was untagged (`head` inner sphere only). `hips`/plate carrier armor left as non-hitbox torso margin so base soldier silhouette isn't widened. | Tagged `SoldierModel` ballistic helmet `shell` as `'head'`; kept chest/limbs/hips gameplay proportions intact. | fixed |
| H-06 | Zombie & Quadruped Hitboxes | `src/graphics/ZombieModel.js:685`, `src/graphics/CharacterMeshBuilder.js:548` | Riot shield `viewport` window was untagged, allowing shots straight through shield glass; GLB monster proxy rescale (`targetH / 1.72`) and quadruped `snout`/`shin` need a dedicated balance pass. | Tagged riot shield `viewport` `'shield'` in both `ZombieModel.js` and `CharacterMeshBuilder.js`. Deferred GLB proxy rescale & quadruped `snout` expansion to preserve baseline silhouette balance until dedicated per-creature pass. | partial (fixed shield visor; deferred GLB rescale/quadruped snout) |
| H-07 | Shield Blocking & Dead Entities | `src/engine/CombatSystem.js:400–527`, `src/entities/ZombieEntity.js`, `src/entities/BotAI.js` | Penetrating rounds pierced past riot `'shield'` hitboxes; `getHitboxMeshes()` didn't guard dead/`hp <= 0` entities. | Stopped penetration (`pierceLeft = 0`) + spawned metal sparks + `playShieldRicochet` on `'shield'` hits (preserving `0.25x` chip math), and gated `getHitboxMeshes` / raycasts on `alive && !dead && hp > 0`. | fixed |
| H-08 | Interactable Range & Prompts | `src/modes/TowerDefenseMode.js:2559` | `getPromptText()` emitted `hud:toast` every frame when PaP was disabled instead of returning a static prompt. | Replaced per-frame toast side-effect in `getPromptText()` with clean non-affordable prompt text while keeping `[E]` press feedback intact. | fixed |

---

## 3. Animations

| ID | Area / Screen | File & Line | Issue | Planned Fix | Status |
|---|---|---|---|---|---|
| A-01 | Reduced Motion Setting | `src/core/Settings.js`, `src/ui/UIPolish.js`, `src/graphics/Juice.js`, `css/aaa-theme.css` | Missing Reduced Motion UI toggle under Settings › Video; `Juice._reduced()` and `aaa-theme.css` missed `prefers-reduced-motion` / `body.sv-reduced-motion` parity. | Exposed **Reduced Motion** & **Camera Screen Shake** under Settings › Video and synchronized `prefers-reduced-motion` + `body.sv-reduced-motion` everywhere (verified toggle in browser). | fixed |
| A-02 | Screen & Modal Transitions | `css/aaa-theme.css`, `src/ui/UIPolish.js` | Screens snapped abruptly; modals lacked focus trap/restore. | Added `transform`/`opacity` enter choreography (`--aaa-ease`) and modal focus trap/restore. | fixed |
| A-03 | Tabs & Selection Highlight | `src/ui/UIPolish.js`, `src/ui/SelectionHighlight.js` | Settings, Barracks, Guide, and Box Picker tabs lacked sliding selection underline/plate. | Registered `#settings-tabs`, `#barracks-tabs`, `#legend-tabs`, and `#box-picker-tabs` with `BO.SelectionHighlight`. | fixed |
| A-04 | Tooltips | `src/ui/TooltipSystem.js` | Instant pop caused flicker across adjacent items. | Added 140ms hover delay + 220ms warm neighbor instant reposition and `pointer-events: none`. | fixed |
| A-05 | HUD Feedback & Tickers | `src/ui/HUDController.js`, `css/aaa-theme.css` | Per-frame `killfeed` & `damage-arcs` `innerHTML` rewrites; instant points jump; single overwritten toast; uniform hitmarker. | Added keyed killfeed enter/exit rows, dirty-gated damage arcs, 3-item toast stack, headshot/kill hitmarker classes, and animated points ticker. | fixed |
| A-06 | Staggered Lists & Loading | `css/aaa-theme.css`, `src/ui/UIPolish.js` | Needed capped stagger and loading shimmer primitives. | Added capped `bo-stagger-item` helper and `.bo-skeleton` / `.bo-loading-state`. | fixed |
| A-07 | Viewmodel & Camera | `src/engine/PlayerController.js` | Per-frame `THREE.Euler` alloc, linear swap/ADS curves, missing empty-mag bolt lock state; kill screenshake disabled. | Hoisted `_tmpEuler`, applied smoothstep ADS & swap curves, locked `boltGroup` open on empty mag (`mag === 0`), honored `reducedMotion`/`screenShake`. | fixed |
| A-08 | Character Hit-Reacts & Walk | `src/entities/ZombieEntity.js`, `src/entities/BotAI.js`, `src/graphics/CharacterMeshBuilder.js` | Uniform flinch regardless of hit zone and linear death drop. | Added `hitZone`-aware head/torso/limb flinch tilts in `animateLimbs` and eased death collapse. | fixed |
| A-09 | Surface Bullet Impacts | `src/engine/CombatSystem.js` | World bullet impacts always spawned grey particles. | Mapped `worldHit` `surfaceMaterial` / `terrain` to metal/wood/earth/glass/water/concrete particle colors. | fixed |

---

## 4. Sounds

| ID | Area / Screen | File & Line | Issue | Planned Fix | Status |
|---|---|---|---|---|---|
| S-01 | Duplicate Method | `src/audio/SoundEngine.js` | `playUIHover()` defined twice (`L491` & `L1313`), dropping synth fallback. | Merged into a single method with clip + `uiGain` synth fallback (verified 0 duplicate methods). | fixed |
| S-02 | Missing UI Bus & Dead Sliders | `src/audio/SoundEngine.js`, `src/core/Settings.js`, `src/ui/UIPolish.js` | `hitmarkerVolume` and `zombieVolume` unused; no `uiGain` bus (`uiVolume`) or `muteWhenHidden` tab blur mute. | Added `uiGain` bus, wired `uiVolume`/`hitmarkerVolume`/`zombieVolume`, added `visibilitychange` muting, and exposed UI sliders under Settings › Sound. Direct gain readout check deferred because headless browser tool lacks `page.evaluate`. | fixed |
| S-03 | Clip-Only Missing Fallbacks | `src/audio/SoundEngine.js` | Clip-only cues went silent when `BO.Assets` wasn't loaded or under `file://`. | Added Web Audio procedural synth fallbacks for every clip-based method. | fixed |
| S-04 | Incomplete UI Sound Map | `src/audio/SoundEngine.js` | Missing dedicated cues for back, tab, toggle, slider, disabled, drag, drop, shield ricochet, equip, dry-fire. | Implemented full UI/combat cue set routed cleanly under combat levels. | fixed |
| S-05 | Global UI Delegation | `src/ui/UISounds.js`, `src/minigames/MinigameCore.js`, `src/minigames/MinigameHub.js`, `index.html` | Ad-hoc hover/click sound wiring. | Added global delegated `BO.UISounds` with hover/slider throttles + click dedupe and removed duplicate hover handlers in Minigame files. | fixed |
| S-06 | Gameplay Surface & Stance Audio | `src/audio/SoundEngine.js`, `src/engine/PlayerController.js` | `playFootstep` ignored crouch stance and always layered concrete WAV. | Passed `crouching` stance into `playFootstep()`, softened crouch step gain/pitch, and gated concrete clip to masonry/stone/earth surfaces. | fixed |
| S-07 | Audio Lifecycle & Unlock | `src/ui/UISounds.js`, `src/audio/SoundEngine.js` | First-input unlock reliability across browsers. | Added capture-phase first-input `pointerdown`/`keydown` `ensureContext()` unlock in `UISounds.js`. | fixed |

---

## 5. Accessibility

| ID | Area / Screen | File & Line | Issue | Planned Fix | Status |
|---|---|---|---|---|---|
| X-01 | Focus Management & Escape | `src/ui/UIPolish.js`, `index.html` | Modals lacked focus trapping/restoration; close `✕` buttons lacked `aria-label`. | Added `MutationObserver` modal focus trap/restore in `UIPolish.js` and `aria-label` on icon-only close buttons in `index.html`. | fixed |
| X-02 | Keyboard Tab Navigation | `src/ui/UIPolish.js` | Tablists lacked arrow-key roving navigation and `aria-selected` sync. | Added `[role="tablist"]` `ArrowLeft`/`ArrowRight`/`Home`/`End` navigation and `aria-selected` sync in `UIPolish.js`. | fixed |
| X-03 | Non-Color Signals | `src/ui/HUDController.js` | Scoreboard team badges relied heavily on color (`ALLIES`/`HOSTILES`). | Added `◆ ALLIES` and `✕ HOSTILES` symbols alongside team colors (RPGUI already pairs icons & text labels). | fixed |
| X-04 | 200% Browser Zoom | `css/aaa-theme.css`, `css/minigames.css` | Multi-column layouts needed narrow/zoom reflow rules. | Added `@media (max-width: 900px)` single-column & scrollable modal reflow rules. | fixed |
