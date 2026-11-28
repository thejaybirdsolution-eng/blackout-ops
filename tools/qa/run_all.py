#!/usr/bin/env python3
"""Master QA gate runner for Blackout Ops (existing suites + smoke 69/69 + profiler + minigame/OWRPG checks)."""
from __future__ import annotations

import argparse
import re
import sys
import time
from pathlib import Path
from typing import Any

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _common as qa  # noqa: E402
import mg_audit  # noqa: E402
import mg_bounds  # noqa: E402
import mg_hud  # noqa: E402
import ow_content  # noqa: E402


def run_html_suite(page: Any, port: int, path: str, kind: str) -> dict[str, Any]:
    url = f"http://127.0.0.1:{port}/{path}"
    page.goto(url, wait_until="domcontentloaded", timeout=30000)

    if kind == "runner":
        page.wait_for_function(
            "() => (document.getElementById('status')?.textContent || '').startsWith('COMPLETE:')",
            timeout=180000,
        )
        res = page.evaluate(
            """() => {
                const status = document.getElementById('status')?.textContent || '';
                const fails = [...document.querySelectorAll('#log .fail')].map((e) => e.textContent);
                return { status, fails };
            }"""
        )
        m = re.search(r"COMPLETE:\s*(\d+)\s*/\s*(\d+)", res["status"])
        passed, total = (int(m.group(1)), int(m.group(2))) if m else (0, 0)
        return {"pass": total > 0 and passed == total, "passed": passed, "total": total, "fails": res["fails"]}

    if kind == "hitboxes":
        page.wait_for_function("() => !!window.__QA_DONE", timeout=180000)
        res = page.evaluate("() => window.__QA_DONE")
        return {
            "pass": res["total"] > 0 and res["fail"] == 0 and len(res.get("errors", [])) == 0,
            "passed": res["pass"],
            "total": res["total"],
            "fails": [r["name"] + ": " + r["detail"] for r in res["results"] if not r["pass"]] + res.get("errors", []),
        }

    if kind == "owrpg":
        page.wait_for_function("() => !!window.__qaResult", timeout=180000)
        res = page.evaluate(
            """() => {
                const r = window.__qaResult;
                const fails = [...document.querySelectorAll('#log .fail')].map((e) => e.textContent);
                return { pass: r.pass, total: r.total, fails };
            }"""
        )
        return {
            "pass": res["total"] > 0 and res["pass"] == res["total"],
            "passed": res["pass"],
            "total": res["total"],
            "fails": res["fails"],
        }

    raise ValueError(f"Unknown suite kind: {kind}")


SMOKE_STEP_JS = r"""(cfg) => {
    const app = BO.App;
    const origLoop = app._loop;
    const errs = [];
    try {
        app.startMatch(cfg);
        app._loop = () => {};
        for (let i = 0; i < 10; i++) {
            try { app._simulate(1 / 30); } catch (e) { errs.push(e && e.message ? e.message : String(e)); break; }
        }
    } catch (e) {
        errs.push(e && e.message ? e.message : String(e));
    } finally {
        app._loop = origLoop;
        try { app.exitToMenu(); } catch (e) { errs.push('exitToMenu: ' + (e && e.message ? e.message : String(e))); }
    }
    return errs;
}"""


def run_smoke(port: int, html: str) -> dict[str, Any]:
    non_mg = [
        {"label": "mode:mp", "cfg": {"mode": "mp", "modeType": "tdm", "mapId": "mp_nuketown", "difficulty": "regular"}},
        {"label": "mode:zombies", "cfg": {"mode": "zombies", "mapId": "der_bunker", "difficulty": "normal"}},
        {"label": "mode:td", "cfg": {"mode": "td", "mapId": "td_castle_1"}},
        {"label": "mode:survival", "cfg": {"mode": "survival"}},
        {"label": "mode:rpg", "cfg": {"mode": "rpg"}},
        {
            "label": "mode:owrpg",
            "cfg": {
                "mode": "owrpg",
                "slot": 2,
                "newChar": {"name": "QA", "attrs": {"BRW": 6, "RFX": 6, "TCH": 6, "PRC": 6, "PRS": 6}, "difficulty": "tactical"},
            },
        },
    ]

    bundles = ("minigames", "owrpg", "rpg", "survival")
    failures: list[str] = []
    total_count = 0

    with sync_playwright() as p:
        browser = qa.launch_browser(p)
        context, page, tracker = qa.create_page(browser)
        qa.boot_game(page, port, html, bundles=bundles)
        courses = qa.get_all_courses(page)
        all_runs = non_mg + [
            {
                "label": f"mg:{c['id']}",
                "cfg": {
                    "mode": "minigame",
                    "mapId": "mg_" + c["id"],
                    "mgId": c["id"],
                    "seed": 12345,
                    "mgOptions": {"skipCountdown": True},
                },
            }
            for c in courses
        ]
        total_count = len(all_runs)

        for idx, item in enumerate(all_runs, 1):
            if idx > 1 and (idx - 1) % 20 == 0:
                context.close()
                context, page, tracker = qa.create_page(browser)
                qa.boot_game(page, port, html, bundles=bundles)

            qa.clear_errors(tracker)
            sim_errs = page.evaluate(SMOKE_STEP_JS, item["cfg"])
            errs = qa.snapshot_errors(tracker)
            combined = sim_errs + errs["page_errors"] + errs["console_errors"] + errs["http_errors"]
            if combined:
                failures.append(f"{item['label']}: {combined[0][:140]}")
                print(f"    [FAIL] {item['label']}: {combined[0][:140]}", flush=True)
            elif idx % 15 == 0 or idx == total_count:
                print(f"    [{idx:02d}/{total_count:02d}] ok ({html})", flush=True)

        context.close()
        browser.close()

    return {
        "pass": len(failures) == 0,
        "passed": total_count - len(failures),
        "total": total_count,
        "fails": failures,
    }


PROFILE_3_MATCHES_JS = r"""(cfg) => {
    const app = BO.App;
    const r = app.renderer;
    const origLoop = app._loop;
    const runs = [];
    try {
        for (let m = 0; m < 3; m++) {
            app.startMatch(cfg);
            app._loop = () => {};
            const times = [];
            for (let i = 0; i < 120; i++) {
                const t0 = performance.now();
                app._simulate(1 / 30);
                if (i > 4) times.push(performance.now() - t0);
            }
            times.sort((a, b) => a - b);
            const p95 = times[Math.min(times.length - 1, Math.floor(times.length * 0.95))] || 0;
            app._loop = origLoop;
            app.exitToMenu();
            runs.push({
                match: m + 1,
                p95Ms: Number(p95.toFixed(3)),
                geometries: r ? r.info.memory.geometries : 0,
                textures: r ? r.info.memory.textures : 0,
            });
        }
    } finally {
        app._loop = origLoop;
        try { app.exitToMenu(); } catch (e) { /* ignore */ }
    }
    return runs;
}"""


def run_profiler(port: int, update_baseline: bool = False) -> dict[str, Any]:
    modes = [
        ("mp", {"mode": "mp", "modeType": "tdm", "mapId": "mp_nuketown", "difficulty": "regular"}),
        ("zombies", {"mode": "zombies", "mapId": "der_bunker", "difficulty": "normal"}),
        (
            "owrpg",
            {
                "mode": "owrpg",
                "slot": 2,
                "newChar": {"name": "QA", "attrs": {"BRW": 6, "RFX": 6, "TCH": 6, "PRC": 6, "PRS": 6}, "difficulty": "tactical"},
            },
        ),
        (
            "minigame:range_day",
            {"mode": "minigame", "mapId": "mg_range_day", "mgId": "range_day", "seed": 12345, "mgOptions": {"skipCountdown": True}},
        ),
    ]
    fails: list[str] = []
    details: dict[str, Any] = {}
    measured_p95: dict[str, float] = {}

    with sync_playwright() as p:
        browser = qa.launch_browser(p)
        for label, cfg in modes:
            context, page, _ = qa.create_page(browser)
            qa.boot_game(page, port, "index.html", bundles=("minigames", "owrpg"))
            runs = page.evaluate(PROFILE_3_MATCHES_JS, cfg)
            context.close()
            details[label] = runs
            # Use min of match 2 & 3 for steady p95 to avoid single-frame GC spikes on CPU CI
            steady_p95 = min(runs[1]["p95Ms"], runs[2]["p95Ms"])
            measured_p95[label] = steady_p95
            d_geo = runs[2]["geometries"] - runs[1]["geometries"]
            d_tex = runs[2]["textures"] - runs[1]["textures"]
            if d_geo > 2 or d_tex > 2:
                fails.append(f"{label}: GPU not flat m2->m3 (dGeo={d_geo}, dTex={d_tex})")
            if label.startswith("minigame:") and steady_p95 > 8.0:
                fails.append(f"{label}: p95={steady_p95:.2f}ms > 8.0ms")
        browser.close()

    baseline = qa.load_baseline()
    prof_base: dict[str, float] = baseline.setdefault("profiler", {})
    if update_baseline:
        baseline["profiler"] = measured_p95
        qa.save_baseline(baseline)
    else:
        for label, val in measured_p95.items():
            base = prof_base.get(label)
            if base is not None:
                # Allow 10% regression above baseline, with a 4.0ms floor for sub-4ms simulation modes
                limit = max(base * 1.10, 4.0)
                if val > limit:
                    fails.append(f"{label}: p95 regression {val:.2f}ms > {limit:.2f}ms (base {base:.2f}ms)")

    return {"pass": len(fails) == 0, "details": details, "fails": fails}


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the complete Blackout Ops QA suite.")
    parser.add_argument("--port", type=int, default=8791, help="Local server port")
    parser.add_argument("--update-baseline", action="store_true", help="Refresh mg_baseline.json from current runs")
    parser.add_argument("--skip-slow", action="store_true", help="Skip HTML QA suites (for rapid iteration only)")
    args = parser.parse_args()

    qa.ensure_server(args.port)
    t_start = time.time()
    summary: list[tuple[str, bool, str]] = []

    if not args.skip_slow:
        with sync_playwright() as p:
            browser = qa.launch_browser(p)
            for label, path, kind in [
                ("_qa_runner.html", "_qa_runner.html", "runner"),
                ("_qa_hitboxes.html", "_qa_hitboxes.html", "hitboxes"),
                ("_qa_owrpg.html", "_qa_owrpg.html", "owrpg"),
            ]:
                print(f"\n>>> Running {label} ...", flush=True)
                context, page, tracker = qa.create_page(browser)
                res = run_html_suite(page, args.port, path, kind)
                errs = qa.snapshot_errors(tracker)
                context.close()
                ok = res["pass"] and not errs["page_errors"] and not errs["http_errors"]
                detail = f"{res['passed']}/{res['total']}"
                if not ok:
                    detail += f" fails={res['fails'][:2]} errs={errs['page_errors'][:1] + errs['http_errors'][:1]}"
                summary.append((label, ok, detail))
                print(f"    {label}: {'PASS' if ok else 'FAIL'} ({detail})", flush=True)
            browser.close()

    for html in ("index.html", "index.bundled.html"):
        print(f"\n>>> Running Smoke 69/69 on {html} ...", flush=True)
        res = run_smoke(args.port, html)
        summary.append((f"Smoke ({html})", res["pass"], f"{res['passed']}/{res['total']}" + (f" {res['fails'][:2]}" if res["fails"] else "")))
        print(f"    Smoke ({html}): {'PASS' if res['pass'] else 'FAIL'} ({res['passed']}/{res['total']})", flush=True)

    print("\n>>> Running 3-Match Profiler & GPU Flatness Check ...", flush=True)
    prof = run_profiler(args.port, update_baseline=args.update_baseline)
    prof_detail = ", ".join(
        f"{k}: p95={max(r['p95Ms'] for r in v):.2f}ms dG={v[2]['geometries']-v[1]['geometries']} dT={v[2]['textures']-v[1]['textures']}"
        for k, v in prof["details"].items()
    )
    summary.append(("Profiler & GPU Flatness", prof["pass"], prof_detail if prof["pass"] else "; ".join(prof["fails"])))
    print(f"    Profiler: {'PASS' if prof['pass'] else 'FAIL'} ({prof_detail})", flush=True)

    print("\n>>> Running mg_audit.py ...", flush=True)
    audit_rows, audit_cmp = mg_audit.run_audit(port=args.port, update_baseline=args.update_baseline)
    audit_ok = len(audit_cmp["new"]) == 0
    summary.append((
        "mg_audit.py",
        audit_ok,
        f"{len(audit_rows)} courses | new={len(audit_cmp['new'])} known={len(audit_cmp['known'])} fixed={len(audit_cmp['fixed'])}",
    ))

    print("\n>>> Running mg_bounds.py ...", flush=True)
    bounds_rows, bounds_cmp = mg_bounds.run_bounds(port=args.port, update_baseline=args.update_baseline)
    bounds_ok = len(bounds_cmp["new"]) == 0
    summary.append((
        "mg_bounds.py",
        bounds_ok,
        f"{len(bounds_rows)} courses | new={len(bounds_cmp['new'])} known={len(bounds_cmp['known'])} fixed={len(bounds_cmp['fixed'])}",
    ))

    print("\n>>> Running mg_hud.py ...", flush=True)
    hud_rows, hud_cmp = mg_hud.run_hud(port=args.port, update_baseline=args.update_baseline)
    hud_ok = len(hud_cmp["new"]) == 0
    summary.append((
        "mg_hud.py",
        hud_ok,
        f"{len(hud_rows)} courses | new={len(hud_cmp['new'])} known={len(hud_cmp['known'])} fixed={len(hud_cmp['fixed'])}",
    ))

    print("\n>>> Running ow_content.py ...", flush=True)
    ow = ow_content.run_ow_content(port=args.port)
    ow_errs = ow["errors"]["page_errors"] + ow["errors"]["console_errors"] + ow["errors"]["http_errors"]
    ow_ok = len(ow_errs) == 0
    summary.append((
        "ow_content.py",
        ow_ok,
        f"NPCs={ow['npcs']} Quests={ow['questsTotal']} Triggers={ow['triggerTypeCount']} UniqueDungeons={ow['dungeonsUniqueLayout']}/{ow['dungeonsTotal']}",
    ))

    elapsed = time.time() - t_start
    print("\n" + "=" * 78)
    print(f"BLACKOUT OPS QA SUMMARY ({elapsed:.1f}s)")
    print("=" * 78)
    all_pass = True
    for name, ok, detail in summary:
        if not ok:
            all_pass = False
        print(f"  [{'PASS' if ok else 'FAIL'}] {name:28s} | {detail}")
    print("=" * 78)
    return 0 if all_pass else 1


if __name__ == "__main__":
    raise SystemExit(main())
