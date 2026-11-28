#!/usr/bin/env python3
"""
Builds docs/OVERHAUL_PROMPTS_ALL.txt: one plain-text file with everything needed to run
the overhaul with an AI. It contains the quick start, project facts, the standing rules,
the run order, and every prompt as a copy-ready block.

Source of truth stays in docs/AI_STANDING_RULES.md and docs/PLAN_PROMPTS.md;
re-run this script after editing either:  python tools/build_prompts_txt.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RULES = (ROOT / "docs" / "AI_STANDING_RULES.md").read_text(encoding="utf-8")
PROMPTS = (ROOT / "docs" / "PLAN_PROMPTS.md").read_text(encoding="utf-8")
OUT = ROOT / "docs" / "OVERHAUL_PROMPTS_ALL.txt"

BAR = "=" * 78
SUB = "-" * 78


def md_to_text(md: str) -> str:
    """Plain-text rendering: headings become underlined titles, tables become aligned rows,
    code fences become clearly marked copy blocks, inline markdown is stripped."""
    out, in_code = [], False
    lines = md.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.strip().startswith("```"):
            in_code = not in_code
            out.append(">>>>> COPY FROM HERE >>>>>" if in_code else "<<<<< COPY TO HERE <<<<<")
            i += 1
            continue
        if in_code:
            out.append(line)
            i += 1
            continue
        if line.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r":?-{3,}:?", c) for c in cells):
                    rows.append([clean(c) for c in cells])
                i += 1
            widths = [max(len(r[k]) for r in rows if k < len(r)) for k in range(max(len(r) for r in rows))]
            for n, r in enumerate(rows):
                out.append("  " + "  |  ".join(c.ljust(widths[k]) for k, c in enumerate(r)).rstrip())
                if n == 0:
                    out.append("  " + "--+--".join("-" * w for w in widths))
            continue
        m = re.match(r"^(#{1,6})\s+(.*)", line)
        if m:
            title = clean(m.group(2))
            level = len(m.group(1))
            out.append("")
            if level == 1:
                out += [BAR, title.upper(), BAR]
            elif level == 2:
                out += [title, SUB]
            else:
                out += [title, "~" * len(title)]
            i += 1
            continue
        if line.strip() == "---":
            out.append("")
            i += 1
            continue
        out.append(clean(line))
        i += 1
    return "\n".join(out)


def clean(s: str) -> str:
    s = re.sub(r"\*\*(.+?)\*\*", r"\1", s)
    s = re.sub(r"(?<!\w)\*(.+?)\*(?!\w)", r"\1", s)
    s = re.sub(r"`([^`]+)`", r"\1", s)
    s = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1 (\2)", s)
    return s


HEADER = f"""{BAR}
BLACKOUT OPS: OPEN WORLD RPG & MINIGAMES OVERHAUL
EVERY AI PROMPT, PLUS EVERYTHING YOU NEED TO RUN THEM
{BAR}

Generated from docs/AI_STANDING_RULES.md and docs/PLAN_PROMPTS.md.
(Regenerate with:  python tools/build_prompts_txt.py)


QUICK START
-----------
1. Open a NEW AI coding session (Claude Code or similar) in this folder:
       C:\\Users\\PC\\.gemini\\antigravity\\scratch\\blackout-ops
2. Paste prompt S1 (copy everything between COPY FROM HERE and COPY TO HERE).
3. When the AI finishes, read its final report. Check:
     - every test result is listed with numbers, and all passed;
     - it says the work was merged to master and pushed;
     - nothing is listed as unfinished.
4. Then run H1 (live-site check), then the next prompt in RUN ORDER.
5. One prompt per session. If a session stops partway, start a new session and
   paste RESUME. Don't paste the original prompt again.
6. If a report looks wrong or too good to be true, run VERIFY for that phase.
7. Found a bug while playing? Fill in the BR template and paste it into H2.


INFORMATION THE AI (AND YOU) NEED
----------------------------------
Project folder ...... C:\\Users\\PC\\.gemini\\antigravity\\scratch\\blackout-ops
GitHub repo ......... https://github.com/thejaybirdsolution-eng/blackout-ops
Live game ........... https://thejaybirdsolution-eng.github.io/blackout-ops/
                      (GitHub Pages serves the master branch; it updates
                      about a minute after a push)
Branch to ship on ... master (each phase works on its own branch, then merges
                      into master and pushes)
Asset library ....... C:\\Users\\PC\\Desktop\\game assets  (read its README for
                      licences); in-game assets live in staged_assets\\
Run the game ........ double-click play.bat, or:  python server.py
Test server ......... python server.py --no-open --port 8791
Needed software ..... Python 3, Git, the GitHub CLI (gh, logged in), and
                      Playwright for headless tests:
                        pip install playwright
                        python -m playwright install chromium

Key documents (in the repo):
  docs/PLAN_OWRPG_AND_MINIGAMES.md . the full plan (Part A minigames, Part B
                                     Open World RPG) and the 63-course audit
  docs/AI_STANDING_RULES.md ........ rules every AI session must follow
  docs/PLAN_PROMPTS.md ............. the same prompts as this file (markdown)
  HANDOFF.md ....................... what has been built and where it lives
  DECISIONS.md ..................... architecture decisions (ADRs)
  docs/PROGRESS.md ................. written by an AI only when a session
                                     stops partway (read by RESUME)
  docs/BASELINE.md ................. performance and QA baseline (made by S1)

Existing test suites (headless, in the browser):
  _qa_runner.html (30 checks), _qa_hitboxes.html (56), _qa_owrpg.html (144)
  Phase A0 (prompt 1) adds tools/qa/ (minigame audit, bounds, HUD overlap,
  content counts, run_all.py).

Before every commit the AI must run:
  python tools/stamp_versions.py   (cache-busting ?v= stamps)
  python tools/bundle.py           (rebuilds index.bundled.html)

What the AI must NEVER commit:
  unreferenced files in staged_assets\\ (about 2.9 GB), your draft docs
  (docs/POLISH_PROMPT.md, docs/PROMPT_2_*.md, docs/PROMPT_3_*.md), or the
  revert_staged_assets scripts.
"""


def main():
    parts = [HEADER, "", BAR, "THE STANDING RULES (the AI reads this file itself; included here for reference)", BAR,
             md_to_text(RULES), "", md_to_text(PROMPTS), "", BAR, "END OF FILE", BAR, ""]
    text = "\n".join(parts)
    text = re.sub(r"\n{3,}", "\n\n", text)
    OUT.write_text(text.replace("\n", "\r\n"), encoding="utf-8", newline="")
    print(f"Wrote {OUT.relative_to(ROOT)} ({len(text.splitlines())} lines)")


if __name__ == "__main__":
    main()
