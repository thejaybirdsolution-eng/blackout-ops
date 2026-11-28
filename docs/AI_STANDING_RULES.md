# Standing rules for any AI working on the Overhaul Plan

Read this file in full before doing anything. Then read `docs/PLAN_OWRPG_AND_MINIGAMES.md`, `HANDOFF.md` and the newest ADRs at the end of `DECISIONS.md`. These rules apply to every phase prompt in `docs/PLAN_PROMPTS.md`.

## The project
- Blackout Ops is a zero-build, browser-based Three.js r149 FPS. Every module is an IIFE that attaches to `window.BO` (ADR-002). There is no npm, no bundler step for development and no Node: the game runs straight from `index.html` through `python server.py`.
- Live site: https://thejaybirdsolution-eng.github.io/blackout-ops/. GitHub Pages serves the `master` branch root, so anything pushed to `master` goes live within about a minute.
- Repo: `C:\Users\PC\.gemini\antigravity\scratch\blackout-ops`, remote `origin` = `https://github.com/thejaybirdsolution-eng/blackout-ops.git`.

## How to work
1. **Read before writing.** Before changing a system, read the files that own it and grep for every caller of what you change. Never guess an API: open the file.
2. **Root causes, not patches.** If one bug appears in several courses or systems, fix the shared code once and migrate every caller. Leave no old path behind: delete dead code, update every reference, and keep the codebase one consistent system.
3. **No placeholders.** No TODOs, stubs, empty handlers, fake data or "coming soon" UI. Everything you add must work end to end in the game.
4. **Keep existing behaviour unless the plan changes it.** Existing saves must still load. When a save shape changes, bump the version and write a migration in the owning save module (`OWRPGSave.js`, `SaveSystem.js`).
5. **Performance budget.** No per-frame allocations in hot paths (reuse scratch vectors); use the `BO.HUD.setText/setHtml/setStyle` gated writes (ADR-031) for every per-frame DOM update; use `placeGLBInstanced` and shared materials for repeated props. GPU memory must stay flat across matches: keep `BO.GPULedger` (ADR-030) working, and add any new long-lived scene to `GPULedger._collectKept()`.
6. **Design quality.** UI follows the existing visual language (`css/ui-redesign.css`, `css/aaa-theme.css`): consistent spacing, clear hierarchy, readable contrast, no overlap with the crosshair safe zone, and smooth eased animations on every state change.
7. **Use the asset library.** 3D models, audio and textures are in `staged_assets/` (only files referenced from code are committed) and in `C:\Users\PC\Desktop\game assets`. Check the README there for licences before using an asset. If you add a new asset, copy it into `staged_assets/` and commit only the files you reference.

## Testing (required before every commit)
Start the server: `python server.py --no-open --port 8791` (run it in the background).

Run everything below and fix every failure before committing:
- `_qa_runner.html` (30/30), `_qa_hitboxes.html` (56/56), `_qa_owrpg.html` (all checks).
- The smoke test on `index.html` and on `index.bundled.html`: every mode plus all 63 minigames, with zero page errors, zero console errors and zero 404s.
- `tools/qa/mg_audit.py` and `tools/qa/mg_bounds.py` once Phase A0 has created them: every course you touched must pass its acceptance contract (plan section A0.4).
- A per-mode profiler: no p95 frame regression above 10%, and geometry/texture counts flat across 3 matches.
- Look at the result with your own eyes: take headless screenshots of every screen or course you changed and review them before committing.

If the QA tooling has to run headless, use Playwright with Chromium (`pip install playwright`, then `python -m playwright install chromium`).

## Finishing every phase
1. Run `python tools/stamp_versions.py`, then `python tools/bundle.py`.
2. Docs in the same commit:
   - an ADR in `DECISIONS.md` for every architectural decision;
   - a section at the top of `HANDOFF.md` describing what changed and where it lives;
   - one player-facing entry in `src/data/UpdateLogData.js`, appended with the next id, written in the existing first-person style;
   - tick the completed steps in `docs/PLAN_OWRPG_AND_MINIGAMES.md` by adding "✅ Done (commit `<hash>`)" under each step heading.
3. Git:
   - work on a branch named in the phase prompt;
   - commit with a detailed message;
   - merge into `master` (no fast-forward, with a merge commit message summarising the phase);
   - push `master` to `origin`;
   - confirm GitHub Pages deployed the new commit (`gh api repos/thejaybirdsolution-eng/blackout-ops/pages/builds/latest`).
   - Never commit `staged_assets/` files that nothing references, the user's `docs/POLISH_PROMPT.md`/`PROMPT_*` files, or the `revert_staged_assets.*` scripts.
4. Final report: what you changed (with file links), every test result with numbers, anything left unfinished, and the exact next prompt to run.

## If you run out of context or time
Before stopping, commit work in progress to the phase branch (not `master`), and write `docs/PROGRESS.md` with:
- the phase and step you are on;
- what is done;
- what remains, as a checklist;
- any open bugs, with file and line.

The next session starts from the RESUME prompt in `docs/PLAN_PROMPTS.md`.
