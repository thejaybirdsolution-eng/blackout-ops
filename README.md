# BLACKOUT OPS — Online Co-op & Offline COD-Style FPS, Zombies & Tower Defense

A 3D Call of Duty–style First-Person Shooter, Round-Based Zombies, and Castle Tower Defense game powered by Three.js r149, procedural PBR `CanvasTexture` shaders, procedural Web Audio API DSP, and PeerJS WebRTC P2P Online Multiplayer.

## 🌐 Play Online With Friends (GitHub Pages)
- **Live Online Game**: **[https://thejaybirdsolution-eng.github.io/blackout-ops/](https://thejaybirdsolution-eng.github.io/blackout-ops/)**
- **How to Invite Friends into Your Lobby**:
  1. Click **🌐 ONLINE SQUAD LOBBY (INVITE FRIENDS)** on the Main Menu (or click **🔗 CREATE ONLINE LOBBY & GET FRIEND LINK** inside the Deployment Lobby).
  2. Click **📋 COPY LINK** and send the URL (e.g. `https://thejaybirdsolution-eng.github.io/blackout-ops/?room=XXXXXX`) to your friends!
  3. When your friends open that link, they automatically join your exact lobby!
  4. Choose **COD Zombies**, **Tower Defense**, or **Multiplayer** (Co-op vs Bots or PvP Friends vs Friends + Bots) and click **DEPLOY SQUAD INTO COMBAT** to launch everyone into the match together.

## Launching Offline / Locally
- **Option 1 (Recommended)**: Double-click **`play.bat`** (or run `python server.py`) to launch the local HTTP server and open the game automatically.
- **Option 2 (Direct File)**: Double-click **`index.html`** directly in your browser.

## Features
- **Online Co-op & Solo COD Zombies** (9 Maps including 1:1 WaW / BO1 / BO2 Classics):
  - Shared Doors, Main Power Switch, Power-Ups, Co-op Teammate Revives (`[E]`), 20 Unique Zombies, 5 Boss Rounds (`5, 10, 20, 25, 50`), 6 Perk-a-Colas, Mystery Box, and 3-Tier Pack-a-Punch.
- **Online Co-op & Solo Tower Defense (Castle Siege)** (3 Castle Setups):
  - Defend 3 see-through/shoot-through Defense Wall Layers (`250 HP` each) and the `100 HP` Castle Heart with your squad, Sentry Turrets, Armored Guard Dogs, Allied Marines, and the 30s Intermission Shopkeeper.
- **Online PvP / Co-op & Bot Multiplayer** (`Nuketown`, `Shipment`, `Terminal`, `Rust`, `Killhouse`, `Crash Site`):
  - **Team Deathmatch**, **Free-For-All**, **Domination**, **Hardpoint**, and **Gun Game** + full Custom Game Rules and 15-second MW2 Winner Killcam.
- **Solo Survival (Exclusion Zone)**:
  - Guided 8-step deployment screen (quick-start presets, operation, difficulty, world & time, survival rules, modifiers, enemy roster, career) with a live summary and threat forecast. Hover any option for an explanation.
  - **Escalating days**: day 1 lets only the 4 weakest infected roam (about 3 at once). Each new day unlocks stronger infected and raises the roaming limit; nights add ~35% more. PMC scavengers arrive on day 2, Commander Sable on day 3, Blood Moons every third night.
  - **10-slot hotbar** (`1`–`0` or mouse wheel) for weapons, tools and usable items. An empty slot is bare hands. Drag items onto it from the inventory.
  - **Bare hands can gather**: branches, stones, fiber, tier-1 rock and trees, timber and standing trees break by hand at a quarter of a stone tool's speed; tier-2 deposits need the right tool.
  - **Field terminal**: Inventory (`Tab`), Crafting (`J`), Build (`B`), Map & travel (`M`/`T`), Skills (`K`), Journal (`O`), Guide (`L`). Station recipes unlock when you stand within 4 m of a workbench, campfire or kiln.
- **Minigames** (solo, main menu › **MINIGAMES**). Bronze, Silver, Gold and Platinum stars, personal bests, and a streak multiplier up to x4:
  - **Target Practice**: 10 scripted 60-second courses. Each uses a fixed seed, so it plays the same every time and gets harder as the clock runs: *Range Day* (pop-up bullseyes), *Coaster Chaos* (ride a banking roller coaster), *Boulder Run* (sprint ahead of a rolling boulder), *Skeet Storm* (clay discs), *Bandit Town* (outlaws shoot back; spare the townsfolk), *Drone Swarm* (night rooftop), *Sniper Ridge* (steel out to 200 m), *Heli Gunner* (orbit a city in a door seat), *Balloon Festival* (avoid skull balloons) and *Killhouse Blitz* (on-rails CQB with hostages).
  - **Boss Rush**: fight every boss one after another in the Colosseum. Magazines never run dry and health does not regenerate. You get a 30-second rest between bosses (`N` skips it) and only **three** max heals for the whole rush (`H`, rest periods only). Three modes (Gauntlet / Boss Parade / Titan Siege) and three difficulties.
  - **Whack-a-Mole**: shoot the moles in a carnival tent. *Classic* (3x3), *Frenzy* (4x4 with hard-hat moles) and *Mayhem* (5x4 with bombs).
  - Code lives in `src/minigames/` (core runtime, art kit, courses, Boss Rush, Whack-a-Mole, hub) and `css/minigames.css`.
- **Controls**: pause the game and choose **Controls & Keybinds** (also in Settings › Controls) to view every control for the current mode and rebind any key. Conflicts swap automatically.
- **Create-a-Class & Interactive 3D Gunsmith**:
  - 10 Custom Classes, 70 Weapons (50 Firearms, 10 Melee, 10 Magic/Wonder Weapons), 5 Attachment Slots, 10 Camos, Perks, Special Powers, and Ultimate Powers.
