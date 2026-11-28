#!/usr/bin/env python3
"""Deterministic 63-course minigame audit and A0.4 acceptance contract checker."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _common as qa  # noqa: E402


RUN_COURSE_JS = r"""(cfg) => {
    const { mgId, seed, capSeconds, untimedCap } = cfg;
    const app = BO.App;
    const r = app.renderer;
    const gpuBefore = {
        geometries: r ? r.info.memory.geometries : 0,
        textures: r ? r.info.memory.textures : 0,
    };

    const simErrors = [];
    const origLoop = app._loop;
    let simSteps = 0;
    let minY = Infinity;
    let spawnPos = null;
    let spawnGroundY = null;
    let spawnColliders = [];
    let isRail = false;
    let firstTargetBearingDeg = null;
    let hasQaBot = false;
    const stepTimes = [];

    const everSeen = new WeakMap();
    const seenLos = new WeakMap();
    let everCount = 0;
    let losCount = 0;

    let res = null;
    let summary = null;

    try {
        app.startMatch({
            mode: 'minigame',
            mapId: 'mg_' + mgId,
            mgId,
            seed,
            mgOptions: { skipCountdown: true },
        });
        app._loop = () => {};

        const P = BO.Player;
        const MG = BO.Minigames;
        const def = MG.def;
        const S = MG.session;
        const cam = app.worldCamera;
        hasQaBot = typeof def.qaBot === 'function';
        isRail = !!(def.rail || P.rideState);

        spawnPos = {
            x: Number(P.pos.x.toFixed(3)),
            y: Number(P.pos.y.toFixed(3)),
            z: Number(P.pos.z.toFixed(3)),
            yaw: Number(P.yaw.toFixed(4)),
        };
        minY = P.pos.y;
        spawnGroundY = Number(BO.World.getGroundHeight(P.pos.x, P.pos.z, P.pos.y + 0.5).toFixed(3));

        const pr = 0.35;
        const pMinY = P.pos.y + 0.15;
        const pMaxY = P.pos.y + 1.65;
        for (const c of (BO.World.colliders || [])) {
            if (!c || !c.active || c.enemiesOnly) continue;
            if (P.pos.x + pr > c.minX && P.pos.x - pr < c.maxX &&
                P.pos.z + pr > c.minZ && P.pos.z - pr < c.maxZ &&
                pMaxY > c.minY && pMinY < c.maxY) {
                spawnColliders.push({
                    minX: c.minX, maxX: c.maxX, minY: c.minY, maxY: c.maxY, minZ: c.minZ, maxZ: c.maxZ,
                });
            }
        }

        const dt = 1 / 30;
        const maxSec = def.duration > 0
            ? Math.min(def.duration + 8, capSeconds)
            : Math.min(untimedCap, capSeconds);
        const maxSteps = Math.ceil(maxSec * 30);

        const tmpCenter = new THREE.Vector3();
        const tmpBox = new THREE.Box3();
        const fwdX = -Math.sin(spawnPos.yaw);
        const fwdZ = -Math.cos(spawnPos.yaw);

        const getEntityCenter = (ent, fallbackMesh) => {
            if (ent && typeof ent.worldCenter === 'function') {
                return ent.worldCenter(tmpCenter);
            }
            const obj = (ent && (ent.root || (ent.parts && ent.parts.root))) || fallbackMesh;
            if (obj) {
                tmpBox.setFromObject(obj);
                if (!tmpBox.isEmpty()) return tmpBox.getCenter(tmpCenter);
                if (obj.getWorldPosition) return obj.getWorldPosition(tmpCenter);
            }
            return null;
        };

        const aimAtVec = (vec) => {
            if (!vec) return;
            const cx = cam.position.x;
            const cy = cam.position.y;
            const cz = cam.position.z;
            const dx = vec.x - cx;
            const dy = vec.y - cy;
            const dz = vec.z - cz;
            const horiz = Math.hypot(dx, dz);
            if (horiz < 1e-5 && Math.abs(dy) < 1e-5) return;
            P.yaw = Math.atan2(-dx, -dz);
            P.pitch = BO.Math.clamp(Math.atan2(dy, horiz), -1.48, 1.48);
            cam.rotation.set(P.pitch, P.yaw, 0, 'YXZ');
            cam.updateMatrixWorld(true);
        };

        const seenErr = new Set();
        const pushErr = (prefix, e) => {
            const msg = prefix + ': ' + (e && e.message ? e.message : String(e));
            if (!seenErr.has(msg)) {
                seenErr.add(msg);
                simErrors.push(msg);
            }
        };

        const botCtx = {
            P,
            camera: cam,
            step: 0,
            dt,
            aimAt: aimAtVec,
            fire: () => {
                try {
                    BO.Combat.handleFireInput(false, false);
                    BO.Combat.handleFireInput(true, true);
                } catch (e) {
                    pushErr('fire', e);
                }
            },
            move: (forward = 0, strafe = 0, sprint = false) => {
                P.keys['KeyW'] = forward > 0;
                P.keys['KeyS'] = forward < 0;
                P.keys['KeyD'] = strafe > 0;
                P.keys['KeyA'] = strafe < 0;
                P.keys['ShiftLeft'] = !!sprint;
            },
            jump: () => {
                P.keys['Space'] = true;
            },
            interact: (code = 'KeyE') => {
                try {
                    if (def.onKey) def.onKey(S, code, MG.lib);
                } catch (e) {
                    pushErr('interact', e);
                }
            },
        };

        for (let step = 0; step < maxSteps; step++) {
            if (MG.state === 'results') break;
            simSteps++;

            // Reset transient bot keys before next step
            P.keys['Space'] = false;

            const camX = cam.position.x;
            const camY = cam.position.y;
            const camZ = cam.position.z;

            // Gather living non-penalty targets from Session.targets and Combat.targetPool
            const stepEntities = [];
            const stepSeen = new Set();
            const addCand = (ent, mesh) => {
                if (!ent || stepSeen.has(ent)) return;
                if (ent.alive === false || ent.removed || ent.penalty) return;
                stepSeen.add(ent);
                const c = getEntityCenter(ent, mesh);
                if (!c) return;
                stepEntities.push({ ent, pos: c.clone() });
            };

            if (S && S.targets) {
                for (const tg of S.targets) addCand(tg, tg.root);
            }
            const pool = BO.Combat.targetPool || [];
            for (const m of pool) {
                const ent = (m && m.userData && m.userData.entity) || m;
                addCand(ent, m);
            }

            let bestEnt = null;
            let bestDistSq = Infinity;

            for (const item of stepEntities) {
                const { ent, pos } = item;
                if (typeof ent === 'object' && ent !== null) {
                    if (!everSeen.has(ent)) {
                        everSeen.set(ent, true);
                        everCount++;
                    }
                    if (firstTargetBearingDeg === null && !ent.bonus) {
                        const vx = pos.x - spawnPos.x;
                        const vz = pos.z - spawnPos.z;
                        const len = Math.hypot(vx, vz);
                        if (len > 0.25) {
                            const dot = Math.max(-1, Math.min(1, (vx * fwdX + vz * fwdZ) / len));
                            firstTargetBearingDeg = Number((Math.acos(dot) * 180 / Math.PI).toFixed(2));
                        }
                    }
                }
                const los = BO.World.hasLineOfSight(camX, camY, camZ, pos.x, pos.y, pos.z);
                if (los) {
                    if (typeof ent === 'object' && ent !== null && !seenLos.has(ent)) {
                        seenLos.set(ent, true);
                        losCount++;
                    }
                    const d2 = (pos.x - camX) ** 2 + (pos.y - camY) ** 2 + (pos.z - camZ) ** 2;
                    if (d2 < bestDistSq) {
                        bestDistSq = d2;
                        bestEnt = item;
                    }
                }
            }

            if (hasQaBot) {
                window.__qaBot = true;
                botCtx.step = step;
                try {
                    def.qaBot(S, MG.lib, botCtx);
                } catch (e) {
                    pushErr('qaBot', e);
                }
            } else if (bestEnt) {
                aimAtVec(bestEnt.pos);
                const allowAds = !(MG.matchRules && MG.matchRules.noAds) && !def.noAds && !def.maxScopeTime;
                P.adsHeld = !!allowAds;
                try {
                    BO.Combat.handleFireInput(false, false);
                    BO.Combat.handleFireInput(true, true);
                } catch (e) {
                    pushErr('handleFireInput', e);
                }
            } else {
                P.adsHeld = false;
                try {
                    BO.Combat.handleFireInput(false, false);
                } catch (e) {
                    pushErr('handleFireInput', e);
                }
            }

            const t0 = performance.now();
            try {
                app._simulate(dt);
            } catch (e) {
                pushErr('_simulate', e);
            }
            const elapsedMs = performance.now() - t0;
            if (step > 0) stepTimes.push(elapsedMs);

            if (P.pos.y < minY) minY = P.pos.y;
        }

        res = (MG.state === 'results' && MG._lastRes) ? MG._lastRes : null;
        const shots = S ? S.shots : 0;
        const shotHits = S ? S.shotHits : 0;
        const hits = S ? S.hits : 0;
        const kills = S ? S.kills : 0;
        const spawned = S ? S.spawned : 0;
        const bonusSpawned = S ? (S.bonusSpawned || 0) : 0;
        const bonusKills = S ? (S.bonusKills || 0) : 0;
        const penaltySpawned = S ? (S.penaltySpawned || 0) : 0;
        const penaltyHits = S ? (S.penaltyHits ?? S.penalties ?? 0) : 0;
        const expired = S ? S.expired : 0;
        const score = res ? res.score : (S ? S.score : 0);
        const stars = res ? res.stars : 0;
        const resultTitle = res ? res.title : null;
        const accuracy = shots > 0 ? Math.round((shotHits / shots) * 100) : null;

        stepTimes.sort((a, b) => a - b);
        const p95Idx = stepTimes.length ? Math.min(stepTimes.length - 1, Math.floor(stepTimes.length * 0.95)) : 0;
        const p95SimMs = stepTimes.length ? Number(stepTimes[p95Idx].toFixed(3)) : 0;

        summary = {
            mgId,
            cat: def.cat,
            name: def.name,
            seed,
            duration: def.duration || 0,
            score,
            stars,
            resultTitle,
            resultTargetsDisabled: def.resultTargets === false,
            timeScore: !!def.timeScore,
            firstLook: !!def.firstLook,
            shots,
            shotHits,
            hits,
            kills,
            spawned,
            bonusSpawned,
            bonusKills,
            penaltySpawned,
            penaltyHits,
            expired,
            accuracy,
            targetsEverSeen: everCount,
            targetsSeenLOS: losCount,
            neverVisible: Math.max(0, everCount - losCount),
            finalState: MG.state,
            simSeconds: Number((simSteps * dt).toFixed(2)),
            minY: Number(minY.toFixed(3)),
            spawnPos,
            spawnGroundY,
            isRail,
            spawnColliders,
            firstTargetBearingDeg,
            p95SimMs,
            hasQaBot,
            simErrors,
            gpuBefore,
        };
    } finally {
        window.__qaBot = false;
        app._loop = origLoop;
        try { app.exitToMenu(); } catch (e) { simErrors.push('exitToMenu: ' + (e && e.message ? e.message : String(e))); }
    }

    const gpuAfterExit = {
        geometries: r ? r.info.memory.geometries : 0,
        textures: r ? r.info.memory.textures : 0,
    };
    if (summary) summary.gpuAfterExit = gpuAfterExit;
    return summary;
}"""


def evaluate_contract(row: dict[str, Any], check_stars: bool = False) -> list[str]:
    """Evaluate Plan A0.4 acceptance contract items for a single course run."""
    reasons: list[str] = []

    all_errs = (
        row.get("page_errors", [])
        + row.get("console_errors", [])
        + row.get("http_errors", [])
        + row.get("simErrors", [])
    )
    if all_errs:
        reasons.append(f"A0.4.1_errors({len(all_errs)}): {all_errs[0][:120]}")
    if row.get("finalState") != "results":
        reasons.append(f"A0.4.1_no_results(state={row.get('finalState')},t={row.get('simSeconds')}s)")

    sp = row.get("spawnPos") or {"y": 0}
    if row.get("spawnColliders"):
        reasons.append(f"A0.4.2_spawn_in_collider({len(row['spawnColliders'])})")
    if not row.get("isRail"):
        ground_y = row.get("spawnGroundY", 0)
        if abs(sp["y"] - ground_y) > 1.2:
            reasons.append(f"A0.4.2_spawn_off_ground(y={sp['y']},ground={ground_y})")
    bearing = row.get("firstTargetBearingDeg")
    if bearing is not None and not row.get("firstLook") and bearing > 35.0:
        reasons.append(f"A0.4.2_first_target_bearing({bearing}deg>35)")

    if not row.get("isRail") and row.get("minY", sp["y"]) < sp["y"] - 3.0:
        reasons.append(f"A0.4.3_fell(minY={row.get('minY')},spawnY={sp['y']})")

    nv = row.get("neverVisible", 0)
    if nv > 0:
        reasons.append(f"A0.4.4_never_visible({nv}/{row.get('targetsEverSeen')})")

    if check_stars and row.get("hasQaBot") and row.get("stars", 0) < 3:
        reasons.append(f"A0.4.5_stars_low({row.get('stars')}★)")

    shots = row.get("shots", 0)
    shot_hits = row.get("shotHits", 0)
    hits = row.get("hits", 0)
    kills = row.get("kills", 0)
    spawned = row.get("spawned", 0)
    acc = row.get("accuracy")
    if shot_hits > shots:
        reasons.append(f"A0.4.6_shotHits_gt_shots({shot_hits}>{shots})")
    if acc is not None and acc > 100:
        reasons.append(f"A0.4.6_accuracy_gt_100({acc}%)")
    if kills > spawned and not (spawned == 0 and row.get("resultTargetsDisabled")):
        reasons.append(f"A0.4.6_kills_gt_spawned({kills}/{spawned})")
    if hits > 0 and row.get("score", 0) == 0 and not row.get("timeScore"):
        reasons.append(f"A0.4.6_zero_score_from_hits({hits}hits)")

    if row.get("p95SimMs", 0) > 8.0:
        reasons.append(f"A0.4.8_p95_slow({row.get('p95SimMs')}ms>8ms)")
    gpu_b = row.get("gpuBefore") or {}
    gpu_a = row.get("gpuAfterExit") or {}
    d_geo = gpu_a.get("geometries", 0) - gpu_b.get("geometries", 0)
    d_tex = gpu_a.get("textures", 0) - gpu_b.get("textures", 0)
    if d_geo > 4 or d_tex > 4:
        reasons.append(f"A0.4.8_gpu_leak(dGeo={d_geo},dTex={d_tex})")

    return reasons


def run_audit(
    port: int,
    only: set[str] | None = None,
    seeds: int = 1,
    cap_seconds: int = 180,
    untimed_cap: int = 90,
    check_stars: bool = False,
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

        seed_list = [12345 + i * 7919 for i in range(max(1, seeds))]
        for idx, course in enumerate(courses, 1):
            if idx > 1 and (idx - 1) % 15 == 0:
                context.close()
                context, page, tracker = qa.create_page(browser)
                qa.boot_game(page, port, "index.html", bundles=("minigames",))

            course_reasons: list[str] = []
            course_runs: list[dict[str, Any]] = []
            for seed in seed_list:
                qa.clear_errors(tracker)
                res = page.evaluate(
                    RUN_COURSE_JS,
                    {
                        "mgId": course["id"],
                        "seed": seed,
                        "capSeconds": cap_seconds,
                        "untimedCap": untimed_cap,
                    },
                )
                errs = qa.snapshot_errors(tracker)
                res.update(errs)
                reasons = evaluate_contract(res, check_stars=check_stars)
                res["failures"] = reasons
                course_runs.append(res)
                for r_str in reasons:
                    if r_str not in course_reasons:
                        course_reasons.append(r_str)

            # Use first seed as primary display row, preserving all-seed failure rollup
            primary = dict(course_runs[0])
            primary["all_seeds"] = course_runs
            primary["failures"] = course_reasons
            rows.append(primary)
            if course_reasons:
                failures[course["id"]] = course_reasons

            status = "PASS" if not course_reasons else f"FAIL ({len(course_reasons)})"
            acc_s = f"{primary['accuracy']}%" if primary["accuracy"] is not None else "—"
            print(
                f"[{idx:02d}/{len(courses):02d}] {course['id']:22s} | "
                f"{primary['score']:6} pts {primary['stars']}★ | "
                f"{primary['kills']:3}/{primary['spawned']:3} | acc {acc_s:>4s} | "
                f"nv={primary['neverVisible']:2} | p95={primary['p95SimMs']:5.2f}ms | {status}",
                flush=True,
            )

        context.close()
        browser.close()

    cmp_res = qa.compare_baseline("audit", failures, update=update_baseline)

    json_path = out_dir / "mg_audit.json"
    json_path.write_text(
        json.dumps(
            {
                "courses": rows,
                "failures": failures,
                "baseline_diff": cmp_res,
            },
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )

    md_lines = [
        "# Minigame Audit (`mg_audit.py`)",
        "",
        f"- **Courses run:** {len(rows)}",
        f"- **Seeds per course:** {seeds}",
        f"- **Passing:** {len(rows) - len(failures)}/{len(rows)}",
        f"- **NEW failures vs baseline:** {len(cmp_res['new'])}",
        f"- **KNOWN failures (in baseline):** {len(cmp_res['known'])}",
        f"- **FIXED since baseline:** {len(cmp_res['fixed'])}",
        "",
        "| # | Course | Cat | Probe (score · stars · kills/spawned · acc) | Never-Vis | Final | p95 (ms) | Contract Flags |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for i, r in enumerate(rows, 1):
        acc_s = f"{r['accuracy']}%" if r["accuracy"] is not None else "—"
        probe = f"{r['score']} pts · {r['stars']}★ · {r['kills']}/{r['spawned']} · acc {acc_s}"
        fin = f"{r['finalState']} ({r['simSeconds']}s)"
        flags = "; ".join(r["failures"]) if r["failures"] else "PASS"
        md_lines.append(
            f"| {i} | `{r['mgId']}` | {r['cat']} | {probe} | {r['neverVisible']} | {fin} | {r['p95SimMs']:.2f} | {flags} |"
        )
    (out_dir / "mg_audit.md").write_text("\n".join(md_lines) + "\n", encoding="utf-8")

    return rows, cmp_res


def main() -> int:
    parser = argparse.ArgumentParser(description="Run deterministic audit on Blackout Ops minigames.")
    parser.add_argument("--only", help="Comma-separated course IDs to run")
    parser.add_argument("--seeds", type=int, default=1, help="Number of seeds per course")
    parser.add_argument("--port", type=int, default=8791, help="Local server port")
    parser.add_argument("--cap-seconds", type=int, default=180, help="Max simulated seconds per course")
    parser.add_argument("--untimed-cap", type=int, default=90, help="Max simulated seconds for untimed courses")
    parser.add_argument("--check-stars", action="store_true", help="Enforce A0.4.5 >=3★ for courses with qaBot")
    parser.add_argument("--update-baseline", action="store_true", help="Write current failures to mg_baseline.json")
    args = parser.parse_args()

    _, cmp_res = run_audit(
        port=args.port,
        only=qa.parse_only(args.only),
        seeds=args.seeds,
        cap_seconds=args.cap_seconds,
        untimed_cap=args.untimed_cap,
        check_stars=args.check_stars,
        update_baseline=args.update_baseline,
    )
    if cmp_res["new"]:
        print("\nNEW FAILURES vs baseline:")
        for cid, reasons in cmp_res["new"].items():
            print(f"  - {cid}: {reasons}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
