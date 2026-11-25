# BLACKOUT OPS — RPG MODE: Design Brainstorm & Decisions

> **Pitch (5-second hook):** *Pick a class, delve floor by floor into the Blackout Vaults, chain elemental combos with your abilities — then extract to bank your loot, or push deeper and risk losing it all.*

This document records the original design decisions for **Rogue Lite**, the mode originally called RPG.

### Vault roster and Mystery doors

- Three starting operative kits plus twelve unlockable operatives. Each unlock has its own achievement, and each operative has an inherited kit, a separate progression record, and a new passive and starting loadout.
- The Haven Collection contains 288 milestone cosmetics across four equipment types and 18 curios. Curios come from mystery Unlock rooms and also work as crests.
- Traveling Shop, Rune Puzzle, Speedrun, Bounty Hunt, Crossfire, Sanctuary and Mystery join the regular door pool. Mystery can also reveal 14 exclusive encounters, including a two-roll bowling lane, a two-minute defense challenge and a pickpocket cutscene. Guardian floors still occur every five floors.
- Arena seeds vary layout, dimensions and enemy deployment. Would-be neighbors alternate between odd and even widths. The six-tab Game Guide replaces the old Legend and includes a searchable Rogue Lite door, operative, enemy and gear reference.

### Deep Vaults expansion

- Five new regions span floors 26–50 and beyond. Guardians first appear every five floors through floor 50, then cycle at higher depths.
- Pressure Vents, Surge Circuit and Null Fracture first appear as gate choices for floors 3, 8 and 16. Brightening floor rings warn of an eruption. Clearing a hazard room disarms it and unlocks its reward chest.
- The Haven lists ten repeatable contracts. Select one before starting a delve. Only progress made at or beyond its required floor counts, and payouts are banked on successful extraction.
- Four three-piece legendary sets award bonuses at two and three equipped pieces. The guardians on floors 30, 35, 40 and 45 drop a piece of their own set and favor pieces the player does not already carry or own.
- The Field Guide records defeated enemies and guardians and lists region rosters, room rules, weaknesses and set effects. Vault Racks add eight stash slots per upgrade.

Every decision was judged against the project's six standards (Fun, Appeal, Loops, Dev discipline, Greybox-first, RPG fun) and five wisdoms (ambition, deliberate thinking, system-wide cohesion, flagship UI, zero placeholders).

---

## 0. Constraints discovered in the codebase

* The game is a **first-person shooter** (Three.js r149, no build step, plain `<script defer>` files under the global `BO` namespace).
* Reusable pieces: `BO.World.build(mapId)` builds any map object made of boxes/ramps/lights/waypoints; `BO.ZombieEntity` is a full enemy AI (pathing, ranged attacks, bosses); `BO.Combat` handles every gun and calls `onHitEnemy`; `BO.Player` handles movement, damage and death; `BO.Save.data` persists anything (unknown keys survive `deepMerge`).
* So the RPG mode should be a **first-person action RPG** built on that engine, not a separate turn-based game. That keeps the controls the player already knows (strong game feel from day one) and lets the RPG layer focus on decisions.

---

## 1. Overall structure — 10 ideas

| # | Idea | Verdict |
|---|------|---------|
| 1 | Open-world quest RPG (towns, NPC quests) | Huge content cost; Survival already owns "open world". ✗ |
| 2 | Linear story campaign with set levels | Low replayability, content-heavy. ✗ |
| 3 | Turn-based tactics layer on top of the FPS | Fights the engine's real-time feel. ✗ |
| 4 | Endless arena waves with levels | Too close to Zombies. ✗ |
| 5 | **Extraction delve (floor by floor) with a persistent character** | Natural risk/reward, short sessions, great pacing. ✓ |
| 6 | Roguelike with full reset each run | No long-term growth; weak meta loop. ✗ |
| 7 | Hub + mission board of handmade maps | Content-heavy, less variety. ✗ |
| 8 | Co-op raid bosses only | Thin core loop. ✗ |
| 9 | Monster-collector (allies as party) | Large AI scope for a slice. ✗ |
| 10 | Diablo-style procedural dungeon + town | Close to #5 but no extraction tension. Partial ✓ |

**Picked: #5 + #10 → "Delve & Extract".** A persistent character (levels, talents, gear) runs **delves** of procedurally built arena floors. Loot and gold found in a delve are **unbanked** until you reach an **Extraction Beacon**. Dying loses the unbanked haul. This gives risk-reward tension, meaningful failure, and combat-to-downtime pacing (delve ↔ Haven).

### The three loops
* **Core (seconds):** shoot + use class abilities → apply a status → detonate it for an elemental reaction → enemy drops loot.
* **Session (10–20 min):** Haven → pick a starting depth → clear floor → choose the next room (risk vs reward) → boss every 5 floors → extract or push on.
* **Meta (hours):** character level 1–10 with a talent tree, gear with build-changing affixes and legendaries, Haven upgrades, depth checkpoints, deepest-floor record.

---

## 2. Combat — 10 ideas

| # | Idea | Verdict |
|---|------|---------|
| 1 | Guns only, bigger numbers per level | Stat inflation, no new decisions. ✗ |
| 2 | Mana-based spell list | Extra resource UI; cooldowns read clearer in an FPS. ✗ |
| 3 | **Cooldown abilities: Primer + Detonator + Ultimate** | Small, readable, combo-driven. ✓ |
| 4 | Combo strings for melee | Engine's melee is a single knife swing. ✗ |
| 5 | **Status effects (Burn / Chill / Shock / Expose)** | Gives enemies counterplay and gives builds identity. ✓ |
| 6 | Elemental weaknesses per enemy | Good, cheap via existing resistances. ✓ (folded into #5) |
| 7 | Stance switching | Hidden-state complexity. ✗ |
| 8 | Aggro / taunt system | Only relevant with parties. ✗ for solo slice |
| 9 | Parry windows | Engine supports it only for bare hands. ✗ |
| 10 | **Momentum (style meter)** — chain kills without getting hit | Rewards skill (intrinsic loop). ✓ |

**Picked: #3 + #5/#6 + #10.** One simple, consistent rule creates emergent combos:

> **Primers apply a status. Detonators consume *every* status on the target, and each consumed status triggers its reaction.**

| Status | Applied by | Lasting effect | Reaction when detonated |
|--------|-----------|----------------|-------------------------|
| 🔥 Burn | fire abilities | damage over time | **Combust** — explosion that damages nearby enemies |
| ❄ Chill | ice abilities | −45 % move speed | **Shatter** — detonation damage ×2 + freeze |
| ⚡ Shock | lightning abilities | — | **Overload** — arc jumps to 3 nearby enemies |
| ◎ Expose | heavy hits | takes +20 % damage | **Rupture** — big flat bonus + armour break |

Two statuses on one target = two reactions. Talents let classes borrow other elements, so hybrids are real builds.

---

## 3. XP & levelling — 10 ideas

| # | Idea | Verdict |
|---|------|---------|
| 1 | Flat XP per kill | Rewards grinding weak floors. ✗ alone |
| 2 | Use-based skill XP (level what you use) | Slow, hidden, encourages busywork. ✗ |
| 3 | **Objective/milestone XP (floor clears, bosses, extraction)** | Pulls players forward. ✓ |
| 4 | **Depth multiplier (deeper = more XP)** | Risk-reward. ✓ |
| 5 | XP banked only on extraction | Doubles the punishment of death; disrespects time. ✗ |
| 6 | XP as a currency spent on stats (Souls) | Pure stat inflation. ✗ |
| 7 | First-kill bestiary bonus | Nice but minor. ✗ (scope) |
| 8 | **Momentum multiplier (up to ×2 for clean kill chains)** | Rewards mastery, not time. ✓ |
| 9 | Shared party XP | No party in slice. ✗ |
| 10 | **Catch-up bonus when under-levelled for the floor** | Negative feedback loop keeps flow. ✓ |

**Picked: kill + objective XP × depth × Momentum, plus a catch-up bonus.** XP is **never lost** (respect for time); gold and items are what you risk.

* Level cap **10** for the slice. Curve: `xpToNext(L) = round(120 × L^1.55)`.
* **Every level is qualitative:** even levels unlock a **talent tier** (choose 1 of 3, mutually exclusive), odd levels raise max HP and potion strength *and* unlock a passive line shown in the UI. No "+2 %" levels.
* Respec is **free at the Haven** (respec freedom → experimentation).

---

## 4. Classes & buildcraft — 10 ideas

| # | Idea | Verdict |
|---|------|---------|
| 1 | Classless stat allocation | Weak identity at a glance. ✗ |
| 2 | **3 distinct classes, each owning an element** | Strong silhouettes, readable. ✓ |
| 3 | Dual-class at level X | Scope. ✗ |
| 4 | **Exclusive talent tiers (1 of 3)** | Real trade-offs. ✓ |
| 5 | Large passive web | Too big for a slice. ✗ |
| 6 | Weapon-defined classes | Gear already covers weapons. ✗ |
| 7 | **Cross-element talents (hybrids)** | Emergence. ✓ |
| 8 | Pet/companion classes | AI scope. ✗ |
| 9 | Transformations | Scope. ✗ |
| 10 | **Run-only Boons (pick 1 of 3 after elites/bosses)** | Roguelite buildcraft inside each delve. ✓ |

**Picked: #2 + #4 + #7 + #10.**

* **Vanguard** (Expose, frontline): *Breach Charge* (dash, Expose), *Concussion Slam* (AoE detonator), ult *Juggernaut Protocol*. Passive: less damage up close, kills heal.
* **Pyrotech** (Burn, area control): *Napalm Lob* (Burn pool), *Flashover* (cone detonator), ult *Firestorm*. Passive: +gun damage to Burning foes.
* **Tempest** (Chill + Shock, precision): *Cryo Lance* (piercing Chill line), *Arc Lash* (chain detonator that also Shocks), ult *Storm Cell*. Passive: Shocked foes conduct gun damage.

---

## 5. Loot & itemisation — 10 ideas

| # | Idea | Verdict |
|---|------|---------|
| 1 | Random stat rolls by rarity | Classic but linear. Partial ✓ |
| 2 | **Uniques/Legendaries that change mechanics (with a downside)** | Build-defining. ✓ |
| 3 | Set bonuses | Needs many items. ✗ (later) |
| 4 | **Affixes that alter play (on-kill, on-status, on-reaction)** | Interacts with the combo rule. ✓ |
| 5 | Gear score | Hides decisions behind a number. ✗ |
| 6 | Crafting from materials | Inventory bloat. ✗ |
| 7 | Socketed runes | Extra UI layer. ✗ |
| 8 | **Real guns from the arsenal as weapon drops** | Reuses 50+ guns; clear feedback. ✓ |
| 9 | Unidentified items | Busywork. ✗ |
| 10 | **Auto-salvage of junk + limited pack slots** | No inventory flood, keeps resource tension. ✓ |

**Picked:** three gear slots — **Weapon** (a real gun + affixes), **Rig** (defence), **Relic** (combo/ability effects). Rarities Common → Rare (1 affix) → Epic (2) → Legendary (2 + unique). Commons are salvaged into Scrap automatically. Delve pack holds 6 items.

---

## 6. Enemies & encounters — 10 ideas

| # | Idea | Verdict |
|---|------|---------|
| 1 | Reuse all 70 zombies at random | No roles, no counterplay. ✗ |
| 2 | **Role-based archetypes (Grunt, Runner, Brute, Spitter, Mender, Hexer, Bomber)** | Forces adaptation. ✓ |
| 3 | **Elite affixes (Vampiric, Warded, Hasted, Volatile)** | Variety from one rule. ✓ |
| 4 | **Weaknesses per archetype tied to statuses** | Rewards reading the fight. ✓ |
| 5 | Patrol + aggro radius (camps) | Lets players open fights on their terms. ✓ |
| 6 | Waves inside rooms | Reuse from Zombies; fine for "Ambush" rooms. Partial ✓ |
| 7 | Mini-bosses | Covered by elites. ✗ |
| 8 | **Bosses every 5 floors with phases** | Reuses boss AI. ✓ |
| 9 | Enemy squads with formations | Scope. ✗ |
| 10 | Traps / hazards | Cheap later addition. ✗ (later) |

**Picked: #2 + #3 + #4 + #5 + #8.** Enemies stand at camps until you come close or shoot them (pull fights on purpose). Menders heal allies (kill them first), Hexers silence abilities, Brutes are armoured until Exposed.

---

## 7. Dungeon structure & pacing — 10 ideas

| # | Idea | Verdict |
|---|------|---------|
| 1 | One huge procedural dungeon | Hard to keep readable in a greybox engine. ✗ |
| 2 | **One arena per floor, rebuilt per floor** | Fast build, readable fights. ✓ |
| 3 | **Next-room choice (Combat / Elite / Treasure / Shrine / Rest)** | Player agency + risk-reward. ✓ |
| 4 | Fixed layouts | Low replay value. ✗ |
| 5 | **Biome every 5 floors (palette + enemy mix)** | Visual progress. ✓ |
| 6 | Timed floors | Stress without choice. ✗ |
| 7 | **Hidden caches on ledges** | Rewards exploration. ✓ |
| 8 | Keys & locked doors | Backtracking friction. ✗ |
| 9 | **Checkpoints at boss floors** | Respect for time. ✓ |
| 10 | Endless depth after floor 15 | Long-term ceiling. ✓ |

---

## 8. Economy — 10 ideas

| # | Idea | Verdict |
|---|------|---------|
| 1 | **Gold for Merchant, Forge and Haven upgrades** | Gold always useful. ✓ |
| 2 | **Scrap from salvage for the Forge** | Turns junk into upgrades. ✓ |
| 3 | Durability repairs | Busywork tax. ✗ |
| 4 | **Consumables (potions) as a steady sink** | Attrition + sink. ✓ |
| 5 | Gambling vendor | Already in Zombies (Mystery Box). ✗ |
| 6 | **Forge: reroll an affix / promote rarity** | Late-game sink. ✓ |
| 7 | **Permanent Haven upgrades (escalating costs)** | Meta sink. ✓ |
| 8 | Real-money style premium | ✗ |
| 9 | Bounties | Later. ✗ |
| 10 | **Insurance (keep part of the haul on death)** | Softens failure, costs gold. ✓ |

---

## 9. Failure — 10 ideas → pick

Permadeath ✗ · lose XP ✗ · lose equipped gear ✗ · **lose unbanked loot & gold ✓** · durability ✗ · debuff on death ✗ · corpse run ✗ (backtracking) · **insurance upgrade ✓** · second wind once per delve ✓ (Haven upgrade) · difficulty-scaled penalty ✗.

## 10. Hub — 10 ideas → pick

3D walkable town ✗ (friction) · **one-screen Haven with tabs (Delve, Loadout, Talents, Stash, Merchant, Forge, Upgrades) ✓** · NPC dialogue ✗ · crafting bench ✗ · trophy room ✗ (later) · **deepest-floor record + checkpoints ✓** · daily seeds ✗ · **free respec ✓** · fast-start "Delve again" ✓ · codex ✗ (later).

---

## Accessibility & appeal checklist
* Difficulty: **Story / Normal / Veteran** (enemy HP & damage scale).
* All ability keys rebindable in Settings → Controls (RPG section). Key hints always on the HUD.
* Clear colour + icon per status; reaction names pop as floating text; damage numbers.
* Haven is one click away from a new delve ("Delve again"), no unskippable screens.
