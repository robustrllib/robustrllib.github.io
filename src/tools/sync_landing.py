#!/usr/bin/env python
"""Keep the generated blocks of the landing page in step with the data files.

    python tools/sync_landing.py

Rewrites four blocks of ../index.html, each between a pair of HTML comment markers:

    algo-table    the table of robust methods by family, from data/algorithms.yaml
    shift-table   the six shift sources with their targets and mode names, from data/shifts.yaml
    task-cards    the task cards with their renders and filters, from data/tasks.yaml
    results-data  the leaderboard data as JSON, from data/results/*.csv (gen_results.py)

Everything else on the page is written by hand. The page has no script other than
results.js, which draws the leaderboard from the JSON block.
"""
from __future__ import annotations

import html as htmlmod
import json
import re
import sys
from pathlib import Path

import yaml

SRC = Path(__file__).resolve().parents[1]
LANDING = SRC.parent / "index.html"
TABLE = ("<!-- algo-table:start -->", "<!-- algo-table:end -->")
SHIFTS = ("<!-- shift-table:start -->", "<!-- shift-table:end -->")
TASKS = ("<!-- task-cards:start -->", "<!-- task-cards:end -->")
RESULTS = ("<!-- results-data:start -->", "<!-- results-data:end -->")

# The column head says "Claimed robustness", so the cells name the source alone.
CLAIMED = {"dynamic": "Dynamic", "observation": "Observation", "semantics": "Semantic"}
# The table holds robust methods only, so the group follows from the setting.
GROUP = {"offline": "robust-offline", "online": "robust-online", "safe": "robust-safe"}
# (regime, group label, blurb, [(family key, family label, colour token)])
GROUPS = [
    ("online", "Robust Online", "learns through continued environment interaction",
     [("learner", "Learner-centric", "learner-on"), ("environment", "Environment-centric", "env")]),
    ("offline", "Robust Offline", "learns from a fixed dataset without environment interaction",
     [("learner", "Learner-centric", "learner-off"), ("data", "Data-centric", "data"),
      ("generative", 'Data-centric<br><span class="sub">(generative model)</span>', "generative")]),
    ("safe", "Robust Safe", "adds a cost constraint that must hold under shift",
     [("safe", "Robust safe", "safe")]),
]

sys.path.insert(0, str(Path(__file__).resolve().parent))
import gen_results  # noqa: E402


def esc(text):
    return htmlmod.escape(str(text), quote=True)


def tick(flag):
    return '<td class="c tick">✓</td>' if flag else '<td class="c"></td>'


def table_html(spec):
    rows = ['<div class="table-scroll">', '  <table class="data algo">',
            '    <colgroup><col class="c-fam"><col class="c-method"><col class="c-claim"><col class="c-base">'
            '<col class="c-trait"><col class="c-trait"><col class="c-trait"></colgroup>',
            "    <thead>", "      <tr>",
            "        <th>Family</th><th>Method</th><th>Claimed robustness</th><th>Base algorithm</th>",
            '        <th class="c">Shifted-env<br>rollout</th><th class="c">Adversarial<br>network</th>'
            '<th class="c">Learned<br>model</th>',
            "      </tr>", "    </thead>", "    <tbody>"]
    for regime, label, blurb, families in GROUPS:
        rows.append(f'      <tr class="grp grp-{regime}"><td colspan="7"><b>{label}</b>{blurb}</td></tr>')
        for fam, fam_label, colour in families:
            members = [a for a in spec["algorithms"]
                       if a["regime"] == regime and a["family"] == fam]
            for i, a in enumerate(members):
                t = a["traits"]
                head = (f'<td rowspan="{len(members)}" class="nw">{fam_label}</td>' if i == 0 else "")
                rows.append(
                    f'      <tr class="in-{regime}">{head}<td class="nw"><a href="docs/algorithms/{GROUP[a["regime"]]}/{a["slug"]}/">{a["name"]}</a></td>'
                    f'<td>{CLAIMED[a["claimed"]]}</td><td>{a["base"]}</td>'
                    f'{tick(t["rollout"])}{tick(t["adversary"])}{tick(t["model"])}</tr>')
    rows += ["    </tbody>", "  </table>", "</div>",
             '<p class="note">',
             "  <em>Shifted-env rollout</em>: rollouts collected from a deliberately perturbed environment.",
             "  <em>Adversarial network</em>: a learned adversary optimised against the policy.",
             "  <em>Learned model</em>: a trained next-state predictor used by the robustness mechanism.",
             "  The six standard references (IQL, TD3+BC, MOPO, SynthER, PPO, SAC) are on the "
             '<a href="docs/algorithms/">algorithm pages</a>.',
             "</p>"]
    return "\n".join("    " + r for r in rows)


def shifts_html(data):
    """One row per shift source, each with an expandable demo: nominal and shifted clips and code."""
    rows = ['<div class="table-scroll">', '  <table class="data shift-table">',
            '    <colgroup>',
            '      <col class="shift-source"><col class="shift-description"><col class="shift-target"><col><col class="shift-control">',
            '    </colgroup>', "    <thead>",
            '      <tr><th>Shift source</th><th>What it perturbs</th><th>Target</th><th>Mode names</th>'
            '<th class="c">Demo</th></tr>',
            "    </thead>", "    <tbody>"]
    targets = {"dynamic": "dynamics, transition", "observation": "observation", "action": "action",
               "reward-cost": "reward, cost", "latency": "latency", "semantic": "appearance"}
    for s in data["sources"]:
        names = []
        for mode in ("stochastic", "adversarial", "parametric"):
            names += (s["modes"].get(mode) or {}).get("names", [])
        uniq = list(dict.fromkeys(names))
        codes = " ".join(f"<code>{esc(n)}</code>" for n in uniq)
        key = esc(s["key"])
        rows.append(f'      <tr class="shift-row"><td class="nw"><i class="chip chip-src-{key}"></i>'
                    f'<a href="{esc(s["page"])}">{esc(s["name"])}</a></td>'
                    f'<td>{esc(s["blurb"])}</td><td class="nw"><code>{esc(targets[s["key"]])}</code></td><td>{codes}</td>'
                    f'<td class="c"><button type="button" class="demo-toggle" aria-expanded="false" '
                    f'aria-controls="demo-{key}" aria-label="Show the demo of the {esc(s["name"])}"></button></td></tr>')
        ex = s["example"]
        clips = "".join(
            f'<figure><figcaption>{label}</figcaption><video data-src="{esc(ex["videos"][k])}" poster="{esc(ex["posters"][k])}" '
            f'muted loop playsinline controls preload="none" aria-label="{label}: {esc(ex["caption"])}"></video></figure>'
            for k, label in (("nominal", "Nominal"), ("shifted", "Shifted")))
        if ex.get("demo_code"):
            head, code = "The shift in this clip", ex["demo_code"]
        else:
            mode = s["modes"].get("parametric") or next(v for v in s["modes"].values() if v.get("code"))
            head = "Declare it"
            code = "from robustrllib import make_robust, ShiftSpec\n\nshift = " + mode["code"]
        rows.append(f'      <tr class="shift-demo" id="demo-{key}" hidden><td colspan="5"><div class="demo-body">'
                    f'<div class="demo-clips">{clips}</div>'
                    f'<p class="demo-caption">{esc(ex["caption"])}</p>'
                    f'<p class="demo-head">{head}</p><pre class="code">{esc(code)}</pre>'
                    f'</div></td></tr>')
    rows += ["    </tbody>", "  </table>", "</div>"]
    return "\n".join("    " + r for r in rows)


FAMILIES = ["Locomotion", "Manipulation", "Navigation", "Vehicle control", "Humanoid", "Vision-language-action"]


def task_card(task, sources):
    media = task["media"]
    if media.endswith((".mp4", ".webm")):
        poster = f' poster="{esc(task["poster"])}"' if task.get("poster") else ""
        fig = (f'<video src="{esc(media)}"{poster} autoplay muted loop playsinline preload="metadata" '
               f'aria-label="{esc(task["caption"])}"></video>')
    else:
        fig = f'<img src="{esc(media)}" alt="{esc(task["caption"])}" loading="lazy">'
    names = {s["key"]: s["name"] for s in sources}
    dots = "".join(f'<i class="dot dot-{k}" title="{esc(names[k])}"></i>' for k in task["shifts"])
    return (f'<article class="task" data-family="{esc(task["family"])}" data-regime="{esc(" ".join(task["regime"]))}">'
            f'<figure class="task-media">{fig}</figure>'
            f'<h4>{esc(task["name"])}</h4>'
            f'<p class="task-meta">{esc(task["family"])} · {esc(task["backend"])} · {esc(" / ".join(task["regime"]))}</p>'
            f'<p class="task-axes">{esc(", ".join(task["axes"]))}</p>'
            f'<p class="task-dots">{dots}</p>'
            f'</article>')


def tasks_html(tasks, sources):
    """The task cards with their looping renders, one tab per task family."""
    out = ['<div class="tasks" id="tasks">',
           '  <div class="filter-buttons" role="tablist" aria-label="Task family">']
    for i, f in enumerate(FAMILIES):
        n = sum(1 for t in tasks if t["family"] == f)
        out.append(f'    <button type="button" class="fbtn{" is-active" if i == 0 else ""}" role="tab" '
                   f'aria-selected="{"true" if i == 0 else "false"}" data-family="{esc(f)}">{esc(f)} <span>{n}</span></button>')
    out.append('  </div>')
    out.append('  <div class="task-grid">')
    out.extend("    " + task_card(t, sources) for t in tasks)
    out.append('  </div>')
    legend = "".join(f'<li><i class="dot dot-{esc(s["key"])}"></i>{esc(s["name"])}</li>' for s in sources)
    out.append(f'  <ul class="legend task-legend">{legend}</ul>')
    out.append('</div>')
    return "\n".join("    " + line for line in out)


def replace(html, markers, body):
    start, end = markers
    block = re.compile(re.escape(start) + r".*?" + re.escape(end), re.S)
    if not block.search(html):
        sys.exit(f"markers {start} ... {end} not found in {LANDING.name}")
    return block.sub(lambda _m: f"{start}\n{body}\n{end}", html)


def main():
    spec = yaml.safe_load(open(SRC / "data" / "algorithms.yaml"))
    html = LANDING.read_text()
    html = replace(html, TABLE, table_html(spec))
    shifts = yaml.safe_load(open(SRC / "data" / "shifts.yaml"))
    html = replace(html, SHIFTS, shifts_html(shifts))
    tasks = yaml.safe_load(open(SRC / "data" / "tasks.yaml"))["tasks"]
    html = replace(html, TASKS, tasks_html(tasks, shifts["sources"]))
    results = gen_results.build()
    print(gen_results.check(results))
    payload = json.dumps(results, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    html = replace(html, RESULTS, '<script type="application/json" id="results-data">' + payload + "</script>")
    LANDING.write_text(html)
    print(f"synced algorithm table, shift table, task table and results in {LANDING.name}")


if __name__ == "__main__":
    main()
