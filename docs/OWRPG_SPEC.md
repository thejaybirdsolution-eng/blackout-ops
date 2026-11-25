# Open World RPG — "Operation Meridian" (mode key `owrpg`)

Locked design spec for the Open World RPG mode. Code is the source of truth for numbers; this file explains them.

## Design pillars
1. **Diegetic navigation.** No floating quest arrows. Six skyline landmarks (35–58 m), smoke columns and the map/compass pins do the work. A tracked-quest compass marker exists but is **off by default** (Pip-Pad → Map).
2. **Skill + build parity.** Aim and positioning decide fights; attributes and perks change *how* you solve problems (stealth, hacking, dialogue, elemental reactions), not just HP pools.
3. **Exclusive choices.** Perk tiers are XOR pairs; faction gains cost 50% with the rival; Sworn locks the rival's Sworn tier; quest branches are mutually exclusive.
4. **Travel friction.** Fast travel only between woken Transit Pylons, 1 Relay Cell per jump. Encumbrance slows sprint and adds noise instead of freezing movement.
5. **Fair recovery.** Deterministic dialogue checks (no RNG to save-scum), out-of-combat regen to 60% only, Med-Injectors and dodge for skill-based recovery.

## World
- Map id `meridian`, bounds `[-320, 320]` on X/Z, heightfield `res: 2`, `chunk: 64`, LOD swap at 135 m.
- Regions: Haven Basin (−190, 190) · Rust Sprawl (40, 200) · Mire Delta (210, 20) · Ash Quarry (−180, −60) · Alpine Array (−60, −220) · Meridian Core (180, −190).
- POIs stream in at `r + 85 m`, out past `r + 150 m`; max 22 active agents. Cleared camps respawn after 900 s of play; interiors and unique bosses never respawn.
- Wilderness encounters every 25–40 s of travel outside POIs.
- Sealed interiors live off-map at x, z > 700 (Culvert Sublevel at 900, 900); entered through hatches by teleport.
- Day/night: 2400 s cycle (40 min). Sight range scales 0.6–1.0 with daylight.

## Attributes (base 5, range 1–10, 8 creation points)
| Attr | Effect (5 is neutral for relative effects) |
|---|---|
| BRW | Max HP = 60 + 8·BRW · Carry = 35 + 6·BRW kg · melee +6%/pt |
| RFX | ADS time ÷ (1 + 0.035·(RFX−5)) · spread × (1 − 0.03·(RFX−5)) |
| TCH | Cooldowns × (1 − 0.04·(TCH−5)) · status potency/duration +7%/pt |
| PRC | Weakspot × (1.5 + 0.045·PRC) · noise × (1 − 0.04·(PRC−5)) |
| PRS | Buy × (1 − 0.035·(PRS−5)) · sell = 35% × (1 + 0.035·(PRS−5)) · rep gains +8%/pt |

## Progression
- `XP_next(L) = round(150·L^1.65 + 50·L)`, cap 20.
- Perk point at every even level (10 total); attribute point at every odd level ≥ 3 (9 total).
- 3 trees × 5 tiers (levels 2/6/10/14/18); each tier is an XOR pair and needs the previous tier of the same tree. Respec at Medic Ines: 0, then 150 × count credits.
- Enemies ≥ 5 levels below you give 25% XP. Quests and discovery are the main XP source.

## Damage
```
Dmg = Base · M_stat · M_crit · M_stealth · M_expose · 100 / (100 + max(0, Armor − Pen)) · difficulty
```
- `M_crit` on headshots = weakspot multiplier (+ affix/perk). The engine's own head multiplier is divided out first.
- `M_stealth` = 2.25 (+ perk) when the target is not in combat and the hit is melee or from a suppressed weapon.
- `M_expose` = 1.25; Rupture halves armor for 10 s.
- Incoming: `amount · difficulty · 100 / (100 + rigArmor)` (− crouch perk), bot fire × 0.78.
- Difficulty: Story (out 1.3 / in 0.6), Tactical (1 / 1), Blackout (0.85 / 1.35).

## Statuses and reactions
Burn (DoT) → **Combust** AoE · Chill (slow) → **Shatter** ×3 single target · Shock (stun) → **Overload** arcs · Expose (+25% dmg) → **Rupture** armor break.

## Stealth
States: idle → suspicious → combat (→ return when leashed). Perception runs at 10 Hz:
- Sight cone 110° (bots 40 m, beasts 26 m, × daylight), within 4 m always seen, peripheral 30% rate inside 12 m.
- Gain/s = (0.15 + 2·(1 − d/sight)^1.5) × crouch 0.45 × sprint 1.3 × (1 − Eagle Eye).
- Footsteps: sprint 14 m, walk 7 m, × crouch 0.35 × noise multipliers. Gunfire: 55 m (suppressed 9 m).
- Group alert within the same POI or 22 m. Lose track after 12 s without sight beyond 25 m.

## Factions
Militia ⟷ Syndicate, Aegis ⟷ Helix. Reputation −1000…+1500. Tiers: Hated ≤ −500 (hostile), Shunned (warn at 12 m, fire after 4 s), Neutral, Trusted ≥ 250 (12% discount), Sworn ≥ 750 (20%). Killing a member: −60 with them, +15 with the rival. Hitting a neutral member or being seen stealing sets `provoked_<faction>` (hostile). Contested POIs record an owner after one side is wiped out.

## Quests (3-Path Rule)
**The Dry Artery** (Kessler): combat — clear the Culvert Sublevel and pull the bypass valve; tech — TCH 6/schematic at the Surface Junction; social — PRS 7 / BRW 8 / Syndicate Trusted with Mags Orrin, or steal her ledger (Lockpick / TCH 7 / BRW 8); betrayal — take Mags' deal. Pre-solving it before meeting Kessler triggers his reactive `prefixed` node.
Side: The Gutter King (bounty), Light on the Ridge (relay), Brood Fever (egg sacs), Two Buyers (Aegis XOR Helix), Act I: The Carrier Wave (main hook to Act II).

## Saves
`BO.Save.data.owrpg = { schemaVersion, activeSlot, slots[3] }`. Compact deltas only. `OWRPGSave.migrate()` runs ordered upgraders and default-fills. Quick-save blocked in combat or mid-air. Checkpoints on discovery, quest completion, pylons and interior transitions.
