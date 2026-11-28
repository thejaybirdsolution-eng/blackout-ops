# Blackout Ops — Headless QA Suite (`tools/qa`)

Automated QA harness for all 63 minigames, the Open World RPG content scoreboard, the 3 HTML QA runners, the 69/69 smoke test (`index.html` and `index.bundled.html`), and the 3-match GPU/frame-time profiler.

## Prerequisites

Install Python dependencies once:

```bash
pip install playwright pillow
python -m playwright install chromium
```

## Starting the Server

Every script expects the local dev server running on port `8791` (or pass `--port`):

```bash
python server.py --no-open --port 8791
```

## Scripts

| Script | Purpose | Key Options | Outputs |
|---|---|---|---|
| `run_all.py` | Full exit-gate suite (`_qa_runner`, `_qa_hitboxes`, `_qa_owrpg`, 69/69 smoke on unbundled & bundled, 3-match profiler, `mg_audit`, `mg_bounds`, `mg_hud`, `ow_content`) | `--port 8791`, `--update-baseline`, `--skip-slow` | Console summary, exit `1` on any failure or NEW regression |
| `mg_audit.py` | Deterministic `1/30 s` stepped playthrough of all 63 minigames using `def.qaBot` (if defined) or default LOS aim-bot; checks A0.4 acceptance contract | `--only id1,id2`, `--seeds N`, `--port 8791`, `--check-stars`, `--update-baseline` | `out/mg_audit.json`, `out/mg_audit.md` |
| `mg_bounds.py` | 8-direction `12 s` sprint walk-out probe from spawn on every non-rail course; reports falls (`< spawnY - 3 m`) and escapes | `--only id1,id2`, `--seconds 12`, `--port 8791`, `--update-baseline` | `out/mg_bounds.json`, `out/mg_bounds.md` |
| `mg_hud.py` | Measures `getBoundingClientRect` for every visible HUD widget 2 s after start; fails on crosshair safe-zone (`30% x 30%` centre) hits or `> 4 px` overlaps | `--only id1,id2`, `--delay 2.0`, `--port 8791`, `--update-baseline` | `out/mg_hud.json`, `out/mg_hud.md` |
| `mg_sheet.py` | Captures spawn screenshots 1.4 s after start and builds labelled 4x4 PNG contact sheets | `--only id1,id2`, `--delay 1.4`, `--port 8791` | `out/sheet_01.png` ... `out/sheet_04.png` (gitignored) |
| `ow_content.py` | Boots Open World (slot 2) and prints the Part B content scoreboard (NPCs, checks, quests, triggers, dungeons, recipes, activities, achievements) | `--port 8791` | `out/ow_content.json`, `out/ow_content.md` |

## Baseline & Regression Tracking (`mg_baseline.json`)

`tools/qa/mg_baseline.json` records current known failures for `audit`, `bounds`, and `hud`.
- A failure present in `mg_baseline.json` is reported as **KNOWN** and does not fail the run.
- Any failure **not** in `mg_baseline.json` is reported as **NEW** and exits with code `1`.
- As phases A0.3–A2.5 resolve issues, re-run with `--update-baseline` (or delete resolved entries) until `mg_baseline.json` is empty.

## A0.4 Acceptance Contract (enforced in `mg_audit.py` & `mg_hud.py`)

1. **Clean finish:** zero page, console, HTTP, or `_simulate` errors, ending on `results`.
2. **Valid spawn:** on ground (`|spawnY - groundY| <= 1.2 m` for non-rail), not inside a collider, first target within `±35°` of initial view (unless `firstLook`).
3. **Bounds:** player cannot leave play space or fall below `spawnY - 3 m` (unless rail/ride).
4. **Visibility:** `neverVisible === 0` (every non-penalty target seen with line of sight while alive).
5. **Stars:** enabled via `--check-stars` once `qaBot` hooks exist (`>= 3★` on golden bot).
6. **Results integrity:** `shotHits <= shots`, `accuracy <= 100%`, `kills <= spawned` (unless `resultTargets: false`), non-zero score on hits (unless `timeScore`).
7. **HUD:** enforced by `mg_hud.py` (no central `30% x 30%` crosshair safe-zone intersection, no `> 4 px` widget overlap).
8. **Performance & GPU:** `p95 _simulate <= 8.0 ms`, flat GPU geometry/texture counts after exit.

---

## Triage Ledger (populated in Phase A0.3)

| Course | Flag | Verdict | Cause | Fix Phase |
|---|---|---|---|---|
| — | — | — | — | — |

## Course Ledger (populated in Phase A2)

| Course | Fixes Made | Golden-Bot Median | New Star Thresholds | Notes |
|---|---|---|---|---|
| — | — | — | — | — |
