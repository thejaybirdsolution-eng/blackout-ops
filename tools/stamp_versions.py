#!/usr/bin/env python3
"""
BLACKOUT OPS — Content-hash cache busting for index.html.

Every local <script src> and <link href> in index.html gets ?v=<first 8 hex of the
file's SHA-256>. A file's URL changes exactly when its bytes change, so returning
players (GitHub Pages / any static host) always fetch edited code and keep cached
copies of everything else. Run it before committing, then `python tools/bundle.py`
to rebuild index.bundled.html from the stamped index.

Usage:
    python tools/stamp_versions.py            # rewrite index.html in place
    python tools/stamp_versions.py --check    # exit 1 if any stamp is stale
"""
import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX_HTML = ROOT / "index.html"
REF_RE = re.compile(r'((?:src|href)=")((?:src|css|vendor)/[^"?#]+)(?:\?v=[^"]*)?(")')


def digest(rel: str) -> str:
    return hashlib.sha256((ROOT / rel).read_bytes()).hexdigest()[:8]


def main() -> int:
    check = "--check" in sys.argv[1:]
    html = INDEX_HTML.read_bytes().decode("utf-8")  # bytes: keep the file's own line endings
    missing, stale = [], []

    def stamp(m: re.Match) -> str:
        rel = m.group(2)
        if not (ROOT / rel).is_file():
            missing.append(rel)
            return m.group(0)
        new = f"{m.group(1)}{rel}?v={digest(rel)}{m.group(3)}"
        if new != m.group(0):
            stale.append(rel)
        return new

    out = REF_RE.sub(stamp, html)
    if missing:
        print("Missing files referenced by index.html:", *missing, sep="\n  ")
        return 1
    if check:
        if stale:
            print(f"{len(stale)} stale version stamp(s):", *stale, sep="\n  ")
            return 1
        print("All version stamps current.")
        return 0
    if out != html:
        INDEX_HTML.write_bytes(out.encode("utf-8"))
    print(f"Stamped {len(stale)} reference(s); {len(REF_RE.findall(html)) - len(stale)} already current.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
