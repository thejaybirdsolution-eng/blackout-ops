#!/usr/bin/env python3
"""8-direction walk-out probe to verify minigame boundaries and fall safety."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _common as qa  # noqa: E402


PROBE_BOUNDS_JS = r"""(cfg) => {
    const { mgId, seconds } = cfg;
    const app = BO.App;
    const origLoop = app._loop;
    const dirs = [0, 45, 90, 135, 180, 225, 270, 315];

    try {
        app.startMatch({
            mode: 'minigame',
            mapId: 'mg_' + mgId,
            mgId,
            seed: 12345,
            mgOptions: { skipCountdown: true },
        });
        app._loop = () => {};

        const P = BO.Player;
        const MG = BO.Minigames;
        const def = MG.def;
        const isRail = !!(def.rail || P.rideState);
        const sp = { x: P.pos.x, y: P.pos.y, z: P.pos.z, yaw: P.yaw };

        // Compute play-space radius from authored bounds if present, else non-slab boxes, else 55m
        let playRadius = 55;
        if (def.map && def.map.bounds) {
            const b = def.map.bounds;
            if (typeof b.radius === 'number') {
                playRadius = b.radius;
            } else if (Array.isArray(b.poly) && b.poly.length) {
                playRadius = Math.max(...b.poly.map(([px, pz]) => Math.hypot(px - sp.x, pz - sp.z)));
            } else if (b.minX !== undefined && b.maxX !== undefined && b.minZ !== undefined && b.maxZ !== undefined) {
                playRadius = Math.max(
                    Math.hypot(b.minX - sp.x, b.minZ - sp.z),
                    Math.hypot(b.maxX - sp.x, b.minZ - sp.z),
                    Math.hypot(b.minX - sp.x, b.maxZ - sp.z),
                    Math.hypot(b.maxX - sp.x, b.maxZ - sp.z)
                );
            }
        } else if (def.map && Array.isArray(def.map.boxes) && def.map.boxes.length > 1) {
            let maxD = 0;
            for (const bx of def.map.boxes) {
                if (bx.w >= 160 && bx.d >= 160) continue; // ignore giant backdrop slab
                const cx = Math.abs(bx.x - sp.x) + bx.w * 0.5;
                const cz = Math.abs(bx.z - sp.z) + bx.d * 0.5;
                maxD = Math.max(maxD, Math.hypot(cx, cz));
            }
            if (maxD > 12) playRadius = Math.min(85, Math.max(25, maxD));
        }
        playRadius = Number(playRadius.toFixed(1));

        if (isRail) {
            return {
                mgId,
                cat: def.cat,
                name: def.name,
                skipped: true,
                skipReason: def.rail ? 'rail' : 'rideState',
                playRadius,
                maxDist: 0,
                minY: Number(sp.y.toFixed(2)),
                fallDirs: [],
                escapeDirs: [],
                dirs: [],
            };
        }

        const dt = 1 / 30;
        const steps = Math.ceil(seconds * 30);
        const dirResults = [];
        const fallDirs = [];
        const escapeDirs = [];
        let overallMaxDist = 0;
        let overallMinY = sp.y;

        for (const deg of dirs) {
            P.pos.set(sp.x, sp.y, sp.z);
            P.vel.set(0, 0, 0);
            P.yaw = deg * Math.PI / 180;
            P.pitch = 0;
            P.onGround = true;
            P.keys['KeyW'] = true;
            P.keys['ShiftLeft'] = true;

            let maxDist = 0;
            let minY = sp.y;
            for (let i = 0; i < steps; i++) {
                try { app._simulate(dt); } catch (e) { break; }
                const dist = Math.hypot(P.pos.x - sp.x, P.pos.z - sp.z);
                if (dist > maxDist) maxDist = dist;
                if (P.pos.y < minY) minY = P.pos.y;
                if (MG.state === 'results') break;
            }
            P.keys['KeyW'] = false;
            P.keys['ShiftLeft'] = false;

            const fell = minY < sp.y - 3.0;
            const escaped = maxDist > playRadius;
            if (fell) fallDirs.push(deg);
            if (escaped) escapeDirs.push(deg);
            if (maxDist > overallMaxDist) overallMaxDist = maxDist;
            if (minY < overallMinY) overallMinY = minY;

            dirResults.push({
                deg,
                maxDist: Number(maxDist.toFixed(2)),
                minY: Number(minY.toFixed(2)),
                fell,
                escaped,
            });
        }

        return {
            mgId,
            cat: def.cat,
            name: def.name,
            skipped: false,
            spawnY: Number(sp.y.toFixed(2)),
            playRadius,
            maxDist: Number(overallMaxDist.toFixed(2)),
            minY: Number(overallMinY.toFixed(2)),
            fallDirs,
            escapeDirs,
            dirs: dirResults,
        };
    } finally {
        BO.Player.keys['KeyW'] = false;
        BO.Player.keys['ShiftLeft'] = false;
        app._loop = origLoop;
        try { app.exitToMenu(); } catch (e) { /* ignore */ }
    }
}"""


def run_bounds(
    port: int,
    only: set[str] | None = None,
    seconds: int = 12,
    update_baseline: bool = False,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    qa.ensure_server(port)
    out_dir = qa.ensure_out_dir()
    rows: list[dict[str, Any]] = []
    failures: dict[str, list[str]] = {}

    with sync_playwright() as p:
        browser = qa.launch_browser(p)
        context, page, tracker = qa.create_page(browser)
        qa.boot_game(page, port, "index.html", bundles=("minigames",))
        courses = qa.get_all_courses(page)
        if only:
            courses = [c for c in courses if c["id"] in only]

        for idx, course in enumerate(courses, 1):
            if idx > 1 and (idx - 1) % 20 == 0:
                context.close()
                context, page, tracker = qa.create_page(browser)
                qa.boot_game(page, port, "index.html", bundles=("minigames",))

            qa.clear_errors(tracker)
            res = page.evaluate(PROBE_BOUNDS_JS, {"mgId": course["id"], "seconds": seconds})
            reasons: list[str] = []
            if res.get("fallDirs"):
                reasons.append(f"fell(dirs={res['fallDirs']},minY={res['minY']})")
            if res.get("escapeDirs"):
                reasons.append(f"escaped(dirs={res['escapeDirs']},maxDist={res['maxDist']}m>{res['playRadius']}m)")
            res["failures"] = reasons
            rows.append(res)
            if reasons:
                failures[course["id"]] = reasons

            tag = f"SKIP({res['skipReason']})" if res.get("skipped") else ("PASS" if not reasons else "; ".join(reasons))
            print(
                f"[{idx:02d}/{len(courses):02d}] {course['id']:22s} | maxDist={res['maxDist']:5.1f}m / {res['playRadius']:4.1f}m | {tag}",
                flush=True,
            )

        context.close()
        browser.close()

    cmp_res = qa.compare_baseline("bounds", failures, update=update_baseline)
    (out_dir / "mg_bounds.json").write_text(
        json.dumps({"courses": rows, "failures": failures, "baseline_diff": cmp_res}, indent=2) + "\n",
        encoding="utf-8",
    )

    md_lines = [
        "# Minigame Play-Space Bounds (`mg_bounds.py`)",
        "",
        f"- **Courses probed:** {len(rows)}",
        f"- **Passing / Skipped (rail/ride):** {len(rows) - len(failures)}/{len(rows)}",
        f"- **NEW failures vs baseline:** {len(cmp_res['new'])}",
        f"- **KNOWN failures (in baseline):** {len(cmp_res['known'])}",
        "",
        "| # | Course | Cat | Mode | Max Dist | Radius | Min Y | Fall Dirs | Escape Dirs | Status |",
        "|---|---|---|---|---|---|---|---|---|---|",
    ]
    for i, r in enumerate(rows, 1):
        mode = r.get("skipReason") if r.get("skipped") else "walk"
        falls = ",".join(map(str, r.get("fallDirs", []))) or "—"
        escs = ",".join(map(str, r.get("escapeDirs", []))) or "—"
        status = "SKIP" if r.get("skipped") else ("PASS" if not r["failures"] else "; ".join(r["failures"]))
        md_lines.append(
            f"| {i} | `{r['mgId']}` | {r['cat']} | {mode} | {r['maxDist']} m | {r['playRadius']} m | {r['minY']} | {falls} | {escs} | {status} |"
        )
    (out_dir / "mg_bounds.md").write_text("\n".join(md_lines) + "\n", encoding="utf-8")
    return rows, cmp_res


def main() -> int:
    parser = argparse.ArgumentParser(description="8-direction boundary walk-out test for minigames.")
    parser.add_argument("--only", help="Comma-separated course IDs to run")
    parser.add_argument("--port", type=int, default=8791, help="Local server port")
    parser.add_argument("--seconds", type=int, default=12, help="Walk duration per direction in seconds")
    parser.add_argument("--update-baseline", action="store_true", help="Write current failures to mg_baseline.json")
    args = parser.parse_args()

    _, cmp_res = run_bounds(
        port=args.port,
        only=qa.parse_only(args.only),
        seconds=args.seconds,
        update_baseline=args.update_baseline,
    )
    if cmp_res["new"]:
        print("\nNEW BOUNDS FAILURES vs baseline:")
        for cid, reasons in cmp_res["new"].items():
            print(f"  - {cid}: {reasons}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
