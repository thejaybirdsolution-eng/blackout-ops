#!/usr/bin/env python3
"""Minigame HUD safe-zone and overlap auditor (#mg-hud and #hud-layer)."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _common as qa  # noqa: E402


AUDIT_HUD_JS = r"""(cfg) => {
    const { mgId, delaySec } = cfg;
    const app = BO.App;
    const origLoop = app._loop;

    try {
        app.startMatch({
            mode: 'minigame',
            mapId: 'mg_' + mgId,
            mgId,
            seed: 12345,
            mgOptions: { skipCountdown: true },
        });
        app._loop = () => {};
        const steps = Math.max(1, Math.round(delaySec * 30));
        for (let i = 0; i < steps; i++) {
            try { app._simulate(1 / 30); } catch (e) { break; }
        }
        // Render one frame so layout/styles are flushed
        if (app.renderer) {
            app.renderer.info.reset();
            const post = BO.PostFX && BO.PostFX.begin(app.renderer);
            app.renderer.clear();
            if (BO.World && BO.World.scene) app.renderer.render(BO.World.scene, app.worldCamera);
            if (BO.PostFX) BO.PostFX.viewmodelPass(app.renderer); else app.renderer.clearDepth();
            if (BO.Player && BO.Player.vmScene) app.renderer.render(BO.Player.vmScene, BO.Player.vmCamera);
            if (post) BO.PostFX.end(app.renderer, 1/30, app.worldCamera);
        }

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const safeZone = {
            left: vw * 0.35,
            right: vw * 0.65,
            top: vh * 0.35,
            bottom: vh * 0.65,
        };

        const IGNORE_IDS = new Set([
            'hud-layer', 'mg-hud', 'mg-flash', 'mg-popups', 'mg-reticle',
            'crosshair', 'hitmarker', 'damage-vignette', 'flash-overlay',
            'sniper-scope-overlay', 'damage-arcs', 'td-dir-hints',
            'pointer-lock-hint', 'hud-medal', 'hud-toast',
        ]);
        const IGNORE_CLASSES = new Set([
            'mg-hud', 'mg-flash', 'mg-popups', 'mg-pop', 'mg-reticle',
            'mg-top', 'mg-side', 'mg-extra', 'dmg-arc', 'ch-tick',
        ]);
        const IGNORE_ANCESTORS = '#damage-arcs, #crosshair, #pointer-lock-hint, #sniper-scope-overlay, #td-dir-hints, #mg-popups';

        const roots = [document.getElementById('mg-hud'), document.getElementById('hud-layer')].filter(Boolean);
        const candidates = [];
        const isVisible = (el) => {
            let cur = el;
            while (cur && cur.nodeType === 1) {
                const cs = getComputedStyle(cur);
                if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity || '1') <= 0.05) return false;
                cur = cur.parentElement;
            }
            return true;
        };

        const describe = (el) => {
            let s = el.tagName.toLowerCase();
            if (el.id) s += '#' + el.id;
            if (el.className && typeof el.className === 'string') {
                const cls = el.className.trim().split(/\s+/).filter(Boolean).slice(0, 2);
                if (cls.length) s += '.' + cls.join('.');
            }
            return s;
        };

        // Collect widget-level elements (leaf or styled card/chip/panel without only structural children)
        const seenEl = new Set();
        for (const root of roots) {
            const all = [root, ...root.querySelectorAll('*')];
            for (const el of all) {
                if (seenEl.has(el)) continue;
                seenEl.add(el);
                if (IGNORE_IDS.has(el.id)) continue;
                if ([...el.classList].some((c) => IGNORE_CLASSES.has(c))) continue;
                if (el.closest(IGNORE_ANCESTORS)) continue;
                if (!isVisible(el)) continue;
                const rect = el.getBoundingClientRect();
                if (rect.width < 2 || rect.height < 2) continue;
                // Skip full-screen invisible wrappers (>85% of viewport width & height)
                if (rect.width > vw * 0.85 && rect.height > vh * 0.85) continue;

                // Only include leaf-ish elements or direct styled HUD widgets (skip pure text spans inside a tiny row)
                const cs = getComputedStyle(el);
                const hasBg = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent';
                const hasBorder = parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderLeftWidth) > 0;
                const hasDirectText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
                if (!hasBg && !hasBorder && !hasDirectText && el.children.length > 0) continue;

                candidates.push({
                    el,
                    desc: describe(el),
                    rect: {
                        left: Number(rect.left.toFixed(1)),
                        top: Number(rect.top.toFixed(1)),
                        right: Number(rect.right.toFixed(1)),
                        bottom: Number(rect.bottom.toFixed(1)),
                        width: Number(rect.width.toFixed(1)),
                        height: Number(rect.height.toFixed(1)),
                    },
                });
            }
        }

        const safeHits = [];
        for (const c of candidates) {
            const r = c.rect;
            const ix = Math.min(r.right, safeZone.right) - Math.max(r.left, safeZone.left);
            const iy = Math.min(r.bottom, safeZone.bottom) - Math.max(r.top, safeZone.top);
            if (ix > 4 && iy > 4) {
                safeHits.push({ element: c.desc, rect: r, ix: Number(ix.toFixed(1)), iy: Number(iy.toFixed(1)) });
            }
        }

        // Intended sibling stacks inside the same container (e.g. ammo icon/number or stat label/value)
        const allowPair = (a, b) => {
            if (a.el.contains(b.el) || b.el.contains(a.el)) return true;
            const cardA = a.el.closest('.weapon-dock, .vitals-box, #hud-fps, #boss-bar-wrap, .mg-course, .mg-clock, .mg-scorebox, .mg-combo, .mg-stat-row');
            const cardB = b.el.closest('.weapon-dock, .vitals-box, #hud-fps, #boss-bar-wrap, .mg-course, .mg-clock, .mg-scorebox, .mg-combo, .mg-stat-row');
            if (cardA && cardA === cardB) return true;
            return false;
        };

        const overlaps = [];
        for (let i = 0; i < candidates.length; i++) {
            for (let j = i + 1; j < candidates.length; j++) {
                const A = candidates[i];
                const B = candidates[j];
                if (allowPair(A, B)) continue;
                const ix = Math.min(A.rect.right, B.rect.right) - Math.max(A.rect.left, B.rect.left);
                const iy = Math.min(A.rect.bottom, B.rect.bottom) - Math.max(A.rect.top, B.rect.top);
                if (ix > 4 && iy > 4) {
                    overlaps.push({
                        a: A.desc,
                        b: B.desc,
                        ix: Number(ix.toFixed(1)),
                        iy: Number(iy.toFixed(1)),
                    });
                }
            }
        }

        return {
            mgId,
            cat: BO.Minigames.def.cat,
            name: BO.Minigames.def.name,
            elementCount: candidates.length,
            safeZoneHits: safeHits,
            overlaps,
        };
    } finally {
        app._loop = origLoop;
        try { app.exitToMenu(); } catch (e) { /* ignore */ }
    }
}"""


def run_hud(
    port: int,
    only: set[str] | None = None,
    delay: float = 2.0,
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
            if idx > 1 and (idx - 1) % 25 == 0:
                context.close()
                context, page, tracker = qa.create_page(browser)
                qa.boot_game(page, port, "index.html", bundles=("minigames",))

            qa.clear_errors(tracker)
            res = page.evaluate(AUDIT_HUD_JS, {"mgId": course["id"], "delaySec": delay})
            reasons: list[str] = []
            for sh in res.get("safeZoneHits", []):
                reasons.append(f"safe_zone({sh['element']})")
            for ov in res.get("overlaps", []):
                reasons.append(f"overlap({ov['a']} vs {ov['b']})")
            res["failures"] = reasons
            rows.append(res)
            if reasons:
                failures[course["id"]] = reasons

            status = "PASS" if not reasons else f"FAIL (safe={len(res['safeZoneHits'])}, overlap={len(res['overlaps'])})"
            print(f"[{idx:02d}/{len(courses):02d}] {course['id']:22s} | elems={res['elementCount']:2d} | {status}", flush=True)

        context.close()
        browser.close()

    cmp_res = qa.compare_baseline("hud", failures, update=update_baseline)
    (out_dir / "mg_hud.json").write_text(
        json.dumps({"courses": rows, "failures": failures, "baseline_diff": cmp_res}, indent=2) + "\n",
        encoding="utf-8",
    )

    md_lines = [
        "# Minigame HUD Safe-Zone & Overlap Audit (`mg_hud.py`)",
        "",
        f"- **Courses checked:** {len(rows)}",
        f"- **Passing:** {len(rows) - len(failures)}/{len(rows)}",
        f"- **NEW failures vs baseline:** {len(cmp_res['new'])}",
        f"- **KNOWN failures (in baseline):** {len(cmp_res['known'])}",
        "",
        "| # | Course | Cat | Safe-Zone Hits | Overlaps | Status |",
        "|---|---|---|---|---|---|",
    ]
    for i, r in enumerate(rows, 1):
        sz = ", ".join(h["element"] for h in r["safeZoneHits"][:3]) or "—"
        ov = ", ".join(f"{o['a']}×{o['b']}" for o in r["overlaps"][:3]) or "—"
        st = "PASS" if not r["failures"] else "FAIL"
        md_lines.append(f"| {i} | `{r['mgId']}` | {r['cat']} | {sz} | {ov} | {st} |")
    (out_dir / "mg_hud.md").write_text("\n".join(md_lines) + "\n", encoding="utf-8")
    return rows, cmp_res


def main() -> int:
    parser = argparse.ArgumentParser(description="Check minigame HUD safe-zone and element overlaps.")
    parser.add_argument("--only", help="Comma-separated course IDs to run")
    parser.add_argument("--port", type=int, default=8791, help="Local server port")
    parser.add_argument("--delay", type=float, default=2.0, help="Seconds after start to inspect HUD")
    parser.add_argument("--update-baseline", action="store_true", help="Write current failures to mg_baseline.json")
    args = parser.parse_args()

    _, cmp_res = run_hud(
        port=args.port,
        only=qa.parse_only(args.only),
        delay=args.delay,
        update_baseline=args.update_baseline,
    )
    if cmp_res["new"]:
        print("\nNEW HUD FAILURES vs baseline:")
        for cid, reasons in cmp_res["new"].items():
            print(f"  - {cid}: {reasons}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
