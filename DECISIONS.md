# Architectural Decision Records

Decisions that look odd out of context. Read before refactoring.

## ADR-001 — Open World RPG is a separate mode (`owrpg`), not an extension of Rogue Lite (`rpg`)
**Context:** Rogue Lite is single-room delves with unbanked loot; the open world needs persistent world state, factions and dialogue.
**Decision:** New mode key `owrpg`, its own modules under `src/owrpg/`, data under `src/data/OWRPG*.js`, state only in `BO.Save.data.owrpg`.
**Consequence:** The elemental combo idea is reused, but no Rogue Lite code paths are touched.

## ADR-002 — Zero-build IIFE modules
**Decision:** Every file is `(function (BO) { 'use strict'; ... })(window.BO);` loaded with `<script defer>`. No `import`/`export`.
**Consequence:** Works from `file://`, `server.py`, `play.bat` and GitHub Pages. Load order in `index.html` matters.

## ADR-003 — Deterministic dialogue checks
**Decision:** Checks compare attribute / reputation / item thresholds. No percentage rolls.
**Consequence:** Reloading never changes an outcome; locked options show what they need, which doubles as quest hinting.

## ADR-004 — Interiors are sealed spaces off-map (x, z > 700), not separate scenes
**Decision:** Interior geometry is part of the `meridian` box list at (900, 900); hatches teleport the player. `WorldBuilder.resolveHorizontal` already skips terrain clamping beyond the map edge + 200 m.
**Consequence:** One scene, one renderer path, POI streaming works unchanged (the interior is a POI by distance). Lighting switches by `OWRPGWorldData.isInterior()`.

## ADR-005 — Simulation tiers: per-frame / 10 Hz / 1 Hz
**Decision:** Movement, combat and engine AI run per frame; perception and status logic at 10 Hz (`OWRPGAI.tick10`); POI streaming, discovery, encounters and regen at 1 Hz (`OWRPGWorldSim.tick1`).
**Consequence:** Stealth math is frame-rate independent and cheap.

## ADR-006 — Engine AI only drives agents in combat
**Decision:** `BotAI.update` / `ZombieEntity.update` are only called for agents in `combat` (or neutral bots with a rival side nearby). Idle/suspicious/return behaviour is our own simple walker.
**Consequence:** `BotAI` acquires the player on sight at 42 m by itself; gating it is what makes stealth possible.

## ADR-007 — `BotAI.team` encodes the faction-war side, not hostility to the player
**Decision:** Side 0 = Militia/Aegis, side 1 = Raiders/Syndicate/Helix. Player hostility is passed per bot through `context.playerTeam`.
**Consequence:** Contested POIs fight on their own (Militia vs Syndicate at the Quarry) while both stay neutral to the player.

## ADR-008 — Heightfield resolution 2 m (plan said 1 m)
**Decision:** `res: 2` for the 640 m map (321² samples instead of 641²).
**Consequence:** World build ≈ 0.3 s, terrain memory ÷ 4. Walking stays smooth because `Terrain.height` interpolates with the mesh's triangle split.

## ADR-009 — Enemy HP tuned for 0.8–4.5 s trash TTK
**Decision:** Trash HP 90–240, bosses 2200–2400, validated by `OWRPGValidator._ttk` using a sustained-cadence carbine model.
**Consequence:** Raiders take 3–4 body shots or 2 headshots; boss fights lean on reactions and cover.

## ADR-010 — Distance culling for NPCs and props
**Decision:** Named NPCs hide beyond 110 m and props beyond 100 m; landmark struts are one `InstancedMesh`.
**Consequence:** ~160 draw calls in the open, ~180 in town (target 180).
