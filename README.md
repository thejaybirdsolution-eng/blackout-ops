# BLACKOUT OPS — Offline COD-Style FPS & Zombies

A 100% offline 3D Call of Duty–style First-Person Shooter and Round-Based Zombies game powered by Three.js r149, procedural PBR `CanvasTexture` shaders, and procedural Web Audio API DSP.

## Launching Offline
- **Option 1 (Recommended)**: Double-click **`play.bat`** (or run `python server.py`) to launch the local offline HTTP server and open the game automatically.
- **Option 2 (Direct File)**: Double-click **`index.html`** directly in your browser — works offline with zero external network dependencies.

## Features
- **COD Zombies Mode** (`Der Bunker` & `Station Omega`):
  - Classic M1911 starter or Custom Class deployment.
  - Round waves with Roman numeral chalk counter (`I–V`, `6+`), 24-zombie active cap, Hellhound rounds every 5th wave, Armored Brutes, and Nova Screamers.
  - Barricaded windows (tear & `[E]` repair for `+10 PTS`), buyable Sector Doors, Power Switch, 6 Perk-a-Cola machines (`Quick Revive`, `Juggernog`, `Speed Cola`, `Double Tap 2.0`, `Stamin-Up`, `Deadshot Daiquiri`), Chalk Wall Buys, Armor Plates, Mystery Box (with Wonder Weapons `Ray Gun` & `Thundergun` + Teddy Bear relocation), Pack-a-Punch Forge (`Mustang & Sally`, `Porter's X2 Ray Gun`, etc.), 6 spinning Power-Ups, Station Omega Teleporter, and Round 10+ Helicopter Exfil (`[H]`).
- **Offline Multiplayer Bot Modes** (`Killhouse` & `Crash Site`):
  - **Team Deathmatch**, **Free-For-All**, **Domination** (`A/B/C` flags), **Hardpoint**, and **Gun Game** (16-weapon ladder).
  - 4 Bot Difficulties (`Recruit` → `Veteran`) & 6 Killstreaks (`Recon UAV`, `Care Package`, `Precision Airstrike`, `Attack Chopper`, `Juggernaut Suit`, `Tactical Nuke`).
- **Create-a-Class & Interactive 3D Gunsmith**:
  - 10 Custom Classes, 15 Loadout Weapons + 2 Wonder Weapons, 5 Attachment Slots (`Optic`, `Muzzle`, `Underbarrel`, `Magazine`, `Stock`), 10 Camos (including animated `Dark Matter`), Lethals, Tacticals, 12 Perks, 4 Field Upgrades, and 360° interactive 3D weapon preview.
- **Progression & Barracks**:
  - 55 Military Ranks, 10 Prestige tiers, Weapon Levels `1–20`, 16 Medals, 18 Challenges, Combat Record, and JSON Save Export/Import.

## Controls
- **Move**: `W A S D` | **Sprint / Tac-Sprint / Sniper Hold Breath**: `Shift`
- **Jump / Slide-Cancel**: `Space` | **Crouch / Slide**: `C` or `Ctrl`
- **Fire**: `Left Click` | **ADS / Scope**: `Right Click` | **Reload**: `R`
- **Switch Weapon**: `1`, `2`, or `Mouse Wheel` | **Fire Mode**: `B`
- **Interact (Doors / Perks / Mystery Box / PaP / Repairs)**: `E`
- **Melee**: `V` | **Lethal**: `G` (hold to cook Frag, double-tap to detonate C4) | **Tactical**: `Q`
- **Field Upgrade**: `X` | **Armor Plate**: `4` | **Killstreaks**: `5`, `6`, `7`
- **Call Zombies Exfil (Round 10+)**: `H` | **Scoreboard**: `Tab` | **Pause**: `P` or `Esc`
