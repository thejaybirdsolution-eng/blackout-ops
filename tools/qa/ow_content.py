#!/usr/bin/env python3
"""Open World RPG content scoreboard (NPCs, quests, triggers, dungeons, crafting, items, activities)."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _common as qa  # noqa: E402


COUNT_OWRPG_JS = r"""() => {
    BO.State.paused = true;
    BO.App.startMatch({
        mode: 'owrpg',
        slot: 2,
        newChar: { name: 'QA', attrs: { BRW: 6, RFX: 6, TCH: 6, PRC: 6, PRS: 6 }, difficulty: 'tactical' },
    });
    BO.State.paused = true;

    const WD = BO.OWRPGWorldData || {};
    const SD = BO.OWRPGStatsData || {};
    const QD = BO.OWRPGQuestsData || {};
    const A2 = BO.OWRPGAct2 || {};
    const DD = BO.OWRPGDialogueData || {};
    const FD = BO.OWRPGFactionsData || {};
    const EX = BO.OWRPGExpansionData || {};
    const DISC = BO.OWRPGDiscoveryData || {};

    const npcs = WD.NPCS || [];
    const trees = DD.TREES || {};
    let dialogueNodes = 0;
    let dialogueChoices = 0;
    let attrOrSkillChecks = 0;
    for (const t of Object.values(trees)) {
        const nodes = Object.values(t.nodes || {});
        dialogueNodes += nodes.length;
        for (const n of nodes) {
            for (const c of (n.choices || [])) {
                dialogueChoices++;
                if (c.req && (c.req.attr || c.req.skill)) attrOrSkillChecks++;
            }
        }
    }

    const allQuests = Object.assign({}, QD.QUESTS || {}, A2.QUESTS || {});
    const questsByKind = {};
    const triggerTypes = {};
    for (const q of Object.values(allQuests)) {
        const k = q.kind || 'unknown';
        questsByKind[k] = (questsByKind[k] || 0) + 1;
        if (q.autoStart) {
            const tp = q.autoStart.split(':')[0];
            triggerTypes[tp] = (triggerTypes[tp] || 0) + 1;
        }
        for (const st of Object.values(q.stages || {})) {
            for (const trig of Object.keys(st.on || {})) {
                const tp = trig.split(':')[0];
                triggerTypes[tp] = (triggerTypes[tp] || 0) + 1;
            }
        }
    }

    const interacts = WD.INTERACTS || [];
    const interactKinds = {};
    for (const it of interacts) {
        const k = it.kind || 'unknown';
        interactKinds[k] = (interactKinds[k] || 0) + 1;
    }

    const dungeons = WD.DUNGEONS || [];
    const uniqueDungeons = dungeons.filter((d) => d.id === 'culvert_sublevel' || !!d.layout || !!d.uniqueLayout).length;

    const items = SD.ITEMS || {};
    const itemsByType = {};
    let uniqueItems = 0;
    for (const it of Object.values(items)) {
        const tp = it.type || 'other';
        itemsByType[tp] = (itemsByType[tp] || 0) + 1;
        if (it.rarity === 'unique' || it.unique) uniqueItems++;
    }

    const armorSets = EX.ARMOR_SETS || {};
    const recipesObj = (BO.OWRPGRecipesData && BO.OWRPGRecipesData.RECIPES) || BO.OWRPGRecipesData || {};
    const recipesCount = Array.isArray(recipesObj) ? recipesObj.length : Object.keys(recipesObj).length;
    const activitiesObj = BO.OWRPGActivities || {};
    const activitiesCount = Array.isArray(activitiesObj) ? activitiesObj.length : Object.keys(activitiesObj).filter((k) => typeof activitiesObj[k] === 'object').length;
    const achievementsObj = (BO.OWRPGAchievementsData && BO.OWRPGAchievementsData.ACHIEVEMENTS) || {};
    const achievementsCount = Array.isArray(achievementsObj) ? achievementsObj.length : Object.keys(achievementsObj).length;

    const discoverySites = BO.OWRPGDiscoveries ? BO.OWRPGDiscoveries.generate(884120).length : 0;

    const out = {
        regions: (WD.REGIONS || []).length,
        pois: (WD.POIS || []).length,
        pylons: (WD.PYLONS || []).length,
        landmarks: (WD.LANDMARKS || []).length,
        interacts: interacts.length,
        interactKinds,
        resourceNodes: interactKinds.resource_node || 0,
        npcs: npcs.length,
        dialogueTrees: Object.keys(trees).length,
        dialogueNodes,
        dialogueChoices,
        attrOrSkillChecks,
        questsTotal: Object.keys(allQuests).length,
        questsByKind,
        triggerTypesInUse: triggerTypes,
        triggerTypeCount: Object.keys(triggerTypes).length,
        bounties: (EX.BOUNTIES || []).length,
        dungeonsTotal: dungeons.length,
        dungeonsUniqueLayout: uniqueDungeons,
        itemsTotal: Object.keys(items).length,
        itemsByType,
        uniqueItems,
        rarities: Object.keys(SD.RARITY || {}).length,
        affixes: Object.keys(SD.AFFIXES || {}).length,
        armorSets: Object.keys(armorSets).length,
        attrs: (SD.ATTR_IDS || []).length,
        skills: Object.keys(SD.SKILLS || {}).length,
        perkTrees: Object.keys(SD.PERK_TREES || {}).length,
        abilitiesBase: Object.keys(SD.ABILITIES || {}).length,
        abilitiesExpansion: Object.keys(EX.EXPANSION_ABILITIES || {}).length,
        abilitiesTotal: Object.keys(SD.ABILITIES || {}).length + Object.keys(EX.EXPANSION_ABILITIES || {}).length,
        standingStones: Object.keys(SD.STANDING_STONES || {}).length,
        companions: Object.keys(A2.COMPANIONS || {}).length,
        factions: Object.keys(FD.FACTIONS || {}).length,
        vendors: Object.keys(FD.VENDORS || {}).length,
        mounts: Object.keys(EX.MOUNTS || {}).length,
        schedules: (A2.SCHEDULES || []).length,
        discoverySites,
        loreEntries: (DISC.LORE || []).length,
        recipes: recipesCount,
        activities: activitiesCount,
        achievements: achievementsCount,
    };

    try { BO.App.exitToMenu(); } catch (e) { /* ignore */ }
    return out;
}"""


def run_ow_content(port: int) -> dict[str, Any]:
    qa.ensure_server(port)
    out_dir = qa.ensure_out_dir()

    with sync_playwright() as p:
        browser = qa.launch_browser(p)
        context, page, tracker = qa.create_page(browser)
        qa.boot_game(page, port, "index.html", bundles=("owrpg",))
        data = page.evaluate(COUNT_OWRPG_JS)
        errs = qa.snapshot_errors(tracker)
        context.close()
        browser.close()

    data["errors"] = errs
    (out_dir / "ow_content.json").write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")

    rows = [
        ("Regions", data["regions"], "12"),
        ("POIs", data["pois"], "—"),
        ("Fast-travel pylons", data["pylons"], "12"),
        ("Landmarks", data["landmarks"], "12"),
        ("Named NPCs", data["npcs"], "60+"),
        ("Dialogue trees / nodes / choices", f"{data['dialogueTrees']} / {data['dialogueNodes']} / {data['dialogueChoices']}", "—"),
        ("Dialogue attr/skill checks", data["attrOrSkillChecks"], "60+"),
        ("Quests total", data["questsTotal"], "120+"),
        ("Quests by kind", ", ".join(f"{k}:{v}" for k, v in sorted(data["questsByKind"].items())), "—"),
        ("Quest trigger types in use", f"{data['triggerTypeCount']} ({', '.join(sorted(data['triggerTypesInUse']))})", "12"),
        ("Bounties", data["bounties"], "radiant"),
        ("Dungeons (unique layout / total)", f"{data['dungeonsUniqueLayout']} / {data['dungeonsTotal']}", "12 / 12"),
        ("Resource nodes", data["resourceNodes"], "~120"),
        ("Crafting recipes", data["recipes"], "80+"),
        ("Items total", data["itemsTotal"], "—"),
        ("Rarity tiers / Affixes / Armor sets / Uniques", f"{data['rarities']} / {data['affixes']} / {data['armorSets']} / {data['uniqueItems']}", "6 / ~30 / 10 / 30"),
        ("Attributes / Skills / Perk trees", f"{data['attrs']} / {data['skills']} / {data['perkTrees']}", "5 / 10 / 12"),
        ("Abilities (base + expansion)", f"{data['abilitiesTotal']} ({data['abilitiesBase']}+{data['abilitiesExpansion']})", "24"),
        ("Standing stones", data["standingStones"], "8"),
        ("Companions", data["companions"], "5"),
        ("Factions / Vendors", f"{data['factions']} / {data['vendors']}", "—"),
        ("Mounts", data["mounts"], "4"),
        ("Discovery sites / Lore", f"{data['discoverySites']} / {data['loreEntries']}", "156"),
        ("Activities", data["activities"], "10"),
        ("Achievements", data["achievements"], "~60"),
    ]

    md_lines = [
        "# Open World RPG Content Scoreboard (`ow_content.py`)",
        "",
        "| Metric | Current | Part B Target |",
        "|---|---|---|",
    ]
    print("\n=== Open World RPG Content Scoreboard ===")
    for metric, cur, tgt in rows:
        print(f"  {metric:44s}: {str(cur):28s} (target: {tgt})")
        md_lines.append(f"| {metric} | {cur} | {tgt} |")
    (out_dir / "ow_content.md").write_text("\n".join(md_lines) + "\n", encoding="utf-8")
    return data


def main() -> int:
    parser = argparse.ArgumentParser(description="Count Open World RPG content tables and targets.")
    parser.add_argument("--port", type=int, default=8791, help="Local server port")
    args = parser.parse_args()

    data = run_ow_content(port=args.port)
    errs = data.get("errors", {})
    if errs.get("page_errors") or errs.get("console_errors") or errs.get("http_errors"):
        print("Errors during OWRPG content boot:", errs)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
