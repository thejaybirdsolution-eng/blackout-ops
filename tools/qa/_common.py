"""Shared helpers for Blackout Ops headless QA scripts (tools/qa)."""
from __future__ import annotations

import json
import os
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent.parent
QA_DIR = Path(__file__).resolve().parent
OUT_DIR = QA_DIR / "out"
BASELINE_PATH = QA_DIR / "mg_baseline.json"

CHROMIUM_ARGS = [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--autoplay-policy=no-user-gesture-required",
    "--mute-audio",
]


def ensure_server(port: int) -> None:
    """Verify the local dev server is reachable on 127.0.0.1:<port>."""
    url = f"http://127.0.0.1:{port}/index.html"
    try:
        with urllib.request.urlopen(url, timeout=3) as resp:
            if resp.status != 200:
                raise RuntimeError(f"Server returned HTTP {resp.status} for {url}")
    except Exception as exc:
        raise SystemExit(
            f"[QA] Cannot reach {url}: {exc}\n"
            f"Start the server first: python server.py --no-open --port {port}"
        ) from exc


def launch_browser(playwright: Any):
    """Launch headless Chromium configured for deterministic WebGL rendering."""
    return playwright.chromium.launch(headless=True, args=CHROMIUM_ARGS)


def create_page(browser: Any, width: int = 1280, height: int = 720):
    """Create a fresh context + page with error/404 collectors attached."""
    context = browser.new_context(viewport={"width": width, "height": height})
    page = context.new_page()
    tracker: dict[str, list[str]] = {
        "page_errors": [],
        "console_errors": [],
        "http_errors": [],
    }

    def on_pageerror(err: Any) -> None:
        tracker["page_errors"].append(str(err))

    def on_console(msg: Any) -> None:
        if msg.type == "error":
            tracker["console_errors"].append(msg.text)

    def on_response(resp: Any) -> None:
        if resp.status >= 400 and "favicon.ico" not in resp.url:
            tracker["http_errors"].append(f"{resp.status} {resp.url}")

    page.on("pageerror", on_pageerror)
    page.on("console", on_console)
    page.on("response", on_response)
    return context, page, tracker


def clear_errors(tracker: dict[str, list[str]]) -> None:
    tracker["page_errors"].clear()
    tracker["console_errors"].clear()
    tracker["http_errors"].clear()


def snapshot_errors(tracker: dict[str, list[str]]) -> dict[str, list[str]]:
    return {
        "page_errors": list(tracker["page_errors"]),
        "console_errors": list(tracker["console_errors"]),
        "http_errors": list(tracker["http_errors"]),
    }


def boot_game(
    page: Any,
    port: int,
    html: str = "index.html",
    bundles: tuple[str, ...] = (),
    timeout_ms: int = 30000,
) -> None:
    """Load index.html (or index.bundled.html), wait for BO.App.renderer, and preload bundles."""
    url = f"http://127.0.0.1:{port}/{html}?qa=1"
    page.goto(url, wait_until="load", timeout=timeout_ms)
    page.wait_for_function(
        "() => window.BO && window.BO.App && window.BO.App.renderer && window.BO.Math && window.BO.Mods && window.BO.WeaponMesh",
        timeout=timeout_ms,
    )
    page.evaluate(
        """async (bundleList) => {
            if (BO.App && BO.App._safePointerLock) BO.App._safePointerLock = () => {};
            if (BO.BundleLoader && BO.BundleLoader.isBundled && BO.BundleLoader.isBundled()) {
                for (const key of bundleList) {
                    if (!BO.BundleLoader.isLoaded(key)) await BO.BundleLoader.ensure(key);
                }
            }
        }""",
        list(bundles),
    )


def get_all_courses(page: Any) -> list[dict[str, Any]]:
    """Return all registered minigames in category/order sequence."""
    return page.evaluate(
        """() => {
            const out = [];
            const cats = ['target', 'arcade', 'speed', 'fun', 'boss', 'mole'];
            const seen = new Set();
            for (const cat of cats) {
                for (const id of (BO.Minigames.order[cat] || [])) {
                    if (seen.has(id)) continue;
                    seen.add(id);
                    const d = BO.Minigames.defs.get(id);
                    out.push({
                        id: d.id,
                        cat: d.cat,
                        name: d.name,
                        duration: d.duration || 0,
                        rail: !!d.rail,
                    });
                }
            }
            for (const [id, d] of BO.Minigames.defs.entries()) {
                if (seen.has(id)) continue;
                seen.add(id);
                out.push({
                    id: d.id,
                    cat: d.cat,
                    name: d.name,
                    duration: d.duration || 0,
                    rail: !!d.rail,
                });
            }
            return out;
        }"""
    )


def render_one_frame(page: Any) -> None:
    """Render one frame synchronously when BO.App._loop is paused."""
    page.evaluate(
        """() => {
            const app = BO.App;
            if (!app || !app.renderer) return;
            app.renderer.info.reset();
            const post = BO.PostFX && BO.PostFX.begin(app.renderer);
            app.renderer.clear();
            if (BO.World && BO.World.scene) app.renderer.render(BO.World.scene, app.worldCamera);
            if (BO.PostFX) BO.PostFX.viewmodelPass(app.renderer); else app.renderer.clearDepth();
            if (BO.Player && BO.Player.vmScene) app.renderer.render(BO.Player.vmScene, BO.Player.vmCamera);
            if (post) BO.PostFX.end(app.renderer, 1/30, app.worldCamera);
        }"""
    )


def load_baseline() -> dict[str, Any]:
    if not BASELINE_PATH.is_file():
        return {"audit": {}, "bounds": {}, "hud": {}, "profiler": {}}
    data = json.loads(BASELINE_PATH.read_text(encoding="utf-8"))
    for key in ("audit", "bounds", "hud", "profiler"):
        data.setdefault(key, {})
    return data


def save_baseline(data: dict[str, Any]) -> None:
    BASELINE_PATH.write_text(
        json.dumps(data, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def normalize_reason(reason: str) -> str:
    """Strip fluctuating numeric details so baseline comparisons match failure codes stably."""
    if reason.startswith("A0.4.1_errors"):
        # Keep the error message, drop the count: A0.4.1_errors(2): msg -> A0.4.1_errors: msg
        idx = reason.find(":")
        return "A0.4.1_errors" + (reason[idx:] if idx >= 0 else "")
    # Strip trailing parenthesized metrics like A0.4.6_kills_gt_spawned(92/88) -> A0.4.6_kills_gt_spawned
    paren = reason.find("(")
    return reason[:paren] if paren > 0 else reason


def compare_baseline(
    section: str,
    current_failures: dict[str, list[str]],
    update: bool = False,
) -> dict[str, Any]:
    """Compare current failure dict {course_id: [reasons]} against mg_baseline.json using stable keys."""
    baseline = load_baseline()
    normalized_cur = {
        cid: sorted({normalize_reason(r) for r in reasons})
        for cid, reasons in sorted(current_failures.items())
        if reasons
    }
    if update:
        baseline[section] = normalized_cur
        save_baseline(baseline)
        return {"new": {}, "known": baseline[section], "fixed": {}}

    known_map: dict[str, list[str]] = baseline.get(section, {})
    new_failures: dict[str, list[str]] = {}
    known_failures: dict[str, list[str]] = {}
    fixed: dict[str, list[str]] = {}

    for cid, cur_list in sorted(normalized_cur.items()):
        known_set = set(known_map.get(cid, []))
        cur_set = set(cur_list)
        extra = sorted(cur_set - known_set)
        still = sorted(cur_set & known_set)
        if extra:
            new_failures[cid] = extra
        if still:
            known_failures[cid] = still

    for cid, reasons in sorted(known_map.items()):
        cur_set = set(normalized_cur.get(cid, []))
        resolved = sorted(set(reasons) - cur_set)
        if resolved:
            fixed[cid] = resolved

    return {"new": new_failures, "known": known_failures, "fixed": fixed}


def ensure_out_dir() -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    return OUT_DIR


def parse_only(only_arg: str | None) -> set[str] | None:
    if not only_arg:
        return None
    items = {part.strip() for part in only_arg.split(",") if part.strip()}
    return items or None
