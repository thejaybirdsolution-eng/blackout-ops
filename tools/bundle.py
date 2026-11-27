#!/usr/bin/env python3
"""
BLACKOUT OPS — Dev-Only Mode Bundler (ADR-002 compliant).
Reads script order from index.html, emits per-mode concatenated IIFE bundles in
dist/bundles/, computes SHA-256 cache-bust hashes and raw/gzip sizes, and writes
index.bundled.html for fast cold load while leaving unbundled index.html untouched.

Usage:
    python tools/bundle.py
"""
import hashlib
import gzip
import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX_HTML = ROOT / "index.html"
BUNDLED_HTML = ROOT / "index.bundled.html"
OUT_DIR = ROOT / "dist" / "bundles"

SCRIPT_RE = re.compile(r'([ \t]*)<script\s+defer\s+src="([^"]+)"\s*>\s*</script>')
CSS_RE = re.compile(r'(<link\s+rel="stylesheet"\s+href=")([^"]+)(")')


def clean_path(src: str) -> str:
    return src.split("?", 1)[0].strip()


def classify_script(path: str) -> str:
    """Assign a script to a bundle preserving index.html load dependencies."""
    if path.startswith("vendor/"):
        return "vendor"

    # Keep lightweight core UIs or bundle full mode UI+sim together cleanly
    if (
        path.startswith("src/minigames/")
    ):
        return "minigames"

    if (
        path.startswith("src/rpg/")
        or path in (
            "src/data/RPGData.js",
            "src/data/RPGItemsData.js",
            "src/data/RPGEncounters.js",
            "src/modes/RPGMode.js",
            "src/ui/RPGUI.js",
        )
    ):
        return "rpg"

    if (
        path.startswith("src/owrpg/")
        or path.startswith("src/data/OWRPG")
        or path in (
            "src/modes/OWRPGMode.js",
            "src/ui/OWRPGUI.js",
            "src/ui/OWRPGPipPad.js",
        )
    ):
        return "owrpg"

    if (
        path.startswith("src/gm/")
        or path.startswith("src/data/Survival")
        or path.startswith("src/data/Zone")
        or path.startswith("src/systems/Survival")
        or path.startswith("src/systems/Zone")
        or path in (
            "src/engine/WorldCore.js",
            "src/systems/SpatialHash.js",
            "src/systems/NodeBatch.js",
            "src/modes/SurvivalMode.js",
            "src/ui/SurvivalIcons.js",
            "src/ui/SurvivalUI.js",
        )
    ):
        return "survival"

    return "core"


def build_bundle(name: str, files: list[str]) -> dict:
    parts = [
        f"/* BLACKOUT OPS — {name}.bundle.js ({len(files)} files) | Dev-generated IIFE bundle (ADR-002) */\n"
    ]
    raw_bytes_total = 0
    for rel in files:
        p = ROOT / rel
        if not p.is_file():
            raise FileNotFoundError(f"Missing script listed in index.html: {rel}")
        text = p.read_text(encoding="utf-8")
        raw_bytes_total += len(text.encode("utf-8"))
        parts.append(f"\n/* --- {rel} --- */\n")
        parts.append(text.rstrip())
        parts.append("\n;\n")

    content = "".join(parts).encode("utf-8")
    digest = hashlib.sha256(content).hexdigest()[:10]
    gz = gzip.compress(content, compresslevel=6)

    out_path = OUT_DIR / f"{name}.bundle.js"
    out_path.write_bytes(content)

    return {
        "name": name,
        "path": f"dist/bundles/{name}.bundle.js",
        "hash": digest,
        "fileCount": len(files),
        "rawBytes": len(content),
        "gzipBytes": len(gz),
        "files": files,
    }


def scan_assets() -> list[dict]:
    assets_dir = ROOT / "assets"
    if not assets_dir.is_dir():
        return []
    out = []
    for p in sorted(assets_dir.rglob("*")):
        if p.is_file():
            rel = p.relative_to(ROOT).as_posix()
            out.append({"path": rel, "bytes": p.stat().st_size})
    return out


def main() -> int:
    html = INDEX_HTML.read_text(encoding="utf-8")
    matches = list(SCRIPT_RE.finditer(html))
    if not matches:
        raise RuntimeError("No <script defer src=...> tags found in index.html")

    buckets: dict[str, list[str]] = {
        "vendor": [],
        "core": [],
        "rpg": [],
        "owrpg": [],
        "survival": [],
        "minigames": [],
    }

    for m in matches:
        rel = clean_path(m.group(2))
        bucket = classify_script(rel)
        buckets[bucket].append(rel)

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    manifest = {
        "version": 1,
        "bundles": {},
        "assets": scan_assets(),
    }

    for key, files in buckets.items():
        if not files:
            continue
        info = build_bundle(key, files)
        manifest["bundles"][key] = info

    manifest_path = OUT_DIR / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    # Emit minimal manifest for inline embed in index.bundled.html (paths & hashes only)
    inline_manifest = {
        "version": manifest["version"],
        "bundles": {
            k: {
                "path": v["path"],
                "hash": v["hash"],
                "rawBytes": v["rawBytes"],
                "gzipBytes": v["gzipBytes"],
            }
            for k, v in manifest["bundles"].items()
            if k not in ("vendor", "core")
        },
    }

    # Build index.bundled.html preserving head meta/links and body markup
    first_script_start = matches[0].start()
    last_script_end = matches[-1].end()
    v_info = manifest["bundles"]["vendor"]
    c_info = manifest["bundles"]["core"]

    # Cache-bust CSS hrefs by file content hash
    head_part = html[:first_script_start]
    def _bust_css(m):
        href_clean = clean_path(m.group(2))
        css_file = ROOT / href_clean
        if css_file.is_file():
            h = hashlib.sha256(css_file.read_bytes()).hexdigest()[:8]
            return f'{m.group(1)}{href_clean}?h={h}{m.group(3)}'
        return m.group(0)

    head_part = CSS_RE.sub(_bust_css, head_part)
    script_block = (
        f'    <script>\n'
        f'        window.BO = window.BO || {{}};\n'
        f'        window.BO.BUNDLE_MANIFEST = {json.dumps(inline_manifest)};\n'
        f'    </script>\n'
        f'    <script defer src="{v_info["path"]}?h={v_info["hash"]}"></script>\n'
        f'    <script defer src="{c_info["path"]}?h={c_info["hash"]}"></script>'
    )
    bundled_html = head_part + script_block + html[last_script_end:]
    BUNDLED_HTML.write_text(bundled_html, encoding="utf-8")

    print("Built dist/bundles/ + index.bundled.html:")
    total_raw = 0
    total_gz = 0
    for k, v in manifest["bundles"].items():
        total_raw += v["rawBytes"]
        total_gz += v["gzipBytes"]
        print(
            f"  {k:10s}: {v['fileCount']:3d} files | "
            f"{v['rawBytes']/1024:7.1f} KB raw | {v['gzipBytes']/1024:6.1f} KB gz | #{v['hash']}"
        )
    init_gz = (v_info["gzipBytes"] + c_info["gzipBytes"]) / 1024.0
    print(f"Initial load (vendor+core): {init_gz:.1f} KB gz across 2 requests (down from {len(matches)} requests, {total_gz/1024:.1f} KB gz total)")
    if manifest["assets"]:
        asset_kb = sum(a["bytes"] for a in manifest["assets"]) / 1024.0
        print(f"Assets: {len(manifest['assets'])} files, {asset_kb:.1f} KB total")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
