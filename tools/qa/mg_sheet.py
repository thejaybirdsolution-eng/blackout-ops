#!/usr/bin/env python3
"""Capture spawn screenshots of all minigames and compose 4x4 labelled contact sheets."""
from __future__ import annotations

import argparse
import io
import math
import sys
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _common as qa  # noqa: E402


STEP_SHOT_JS = r"""(cfg) => {
    const { mgId, delaySec } = cfg;
    const app = BO.App;
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
    const renderFrame = () => {
        if (!app.renderer) return;
        app.renderer.info.reset();
        const post = BO.PostFX && BO.PostFX.begin(app.renderer);
        app.renderer.clear();
        if (BO.World && BO.World.scene) app.renderer.render(BO.World.scene, app.worldCamera);
        if (BO.PostFX) BO.PostFX.viewmodelPass(app.renderer); else app.renderer.clearDepth();
        if (BO.Player && BO.Player.vmScene) app.renderer.render(BO.Player.vmScene, BO.Player.vmCamera);
        if (post) BO.PostFX.end(app.renderer, 1/30, app.worldCamera);
    };
    renderFrame();
    renderFrame();
}"""


def build_sheets(port: int, only: set[str] | None = None, delay: float = 1.4) -> list[Path]:
    qa.ensure_server(port)
    out_dir = qa.ensure_out_dir()
    tiles: list[tuple[int, dict[str, Any], Image.Image]] = []

    with sync_playwright() as p:
        browser = qa.launch_browser(p)
        context, page, _ = qa.create_page(browser)
        qa.boot_game(page, port, "index.html", bundles=("minigames",))
        courses = qa.get_all_courses(page)
        if only:
            courses = [c for c in courses if c["id"] in only]

        for idx, course in enumerate(courses, 1):
            if idx > 1 and (idx - 1) % 20 == 0:
                context.close()
                context, page, _ = qa.create_page(browser)
                qa.boot_game(page, port, "index.html", bundles=("minigames",))

            page.evaluate(STEP_SHOT_JS, {"mgId": course["id"], "delaySec": delay})
            page.wait_for_timeout(60)
            png_bytes = page.screenshot(type="png")
            page.evaluate("() => { try { BO.App.exitToMenu(); } catch (e) {} }")
            img = Image.open(io.BytesIO(png_bytes)).convert("RGB")
            tiles.append((idx, course, img))
            print(f"[{idx:02d}/{len(courses):02d}] captured {course['id']}", flush=True)

        context.close()
        browser.close()

    tile_w, tile_h = 480, 270
    header_h = 28
    pad = 8
    cols, rows = 4, 4
    per_sheet = cols * rows
    font = ImageFont.load_default()
    sheets: list[Path] = []
    total_sheets = max(1, math.ceil(len(tiles) / per_sheet))

    for s_idx in range(total_sheets):
        chunk = tiles[s_idx * per_sheet : (s_idx + 1) * per_sheet]
        sheet_w = cols * tile_w + (cols + 1) * pad
        sheet_h = rows * (tile_h + header_h) + (rows + 1) * pad
        canvas = Image.new("RGB", (sheet_w, sheet_h), (10, 14, 23))
        draw = ImageDraw.Draw(canvas)

        for k, (num, course, img) in enumerate(chunk):
            r = k // cols
            c = k % cols
            x0 = pad + c * (tile_w + pad)
            y0 = pad + r * (tile_h + header_h + pad)
            draw.rectangle([x0, y0, x0 + tile_w - 1, y0 + header_h - 1], fill=(22, 30, 46))
            label = f"#{num} {course['id']} [{course['cat']}] - {course['name']}"
            draw.text((x0 + 8, y0 + 8), label[:58], fill=(248, 250, 252), font=font)
            resized = img.resize((tile_w, tile_h), Image.Resampling.LANCZOS)
            canvas.paste(resized, (x0, y0 + header_h))

        out_path = out_dir / f"sheet_{s_idx + 1:02d}.png"
        canvas.save(out_path)
        sheets.append(out_path)
        print(f"Saved {out_path}")

    return sheets


def main() -> int:
    parser = argparse.ArgumentParser(description="Build 4x4 labelled contact sheets of minigame spawns.")
    parser.add_argument("--only", help="Comma-separated course IDs to capture")
    parser.add_argument("--port", type=int, default=8791, help="Local server port")
    parser.add_argument("--delay", type=float, default=1.4, help="Seconds after start before screenshot")
    args = parser.parse_args()

    build_sheets(port=args.port, only=qa.parse_only(args.only), delay=args.delay)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
