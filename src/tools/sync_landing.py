#!/usr/bin/env python
"""Keep the landing page's algorithm book and table in step with data/algorithms.yaml.

    python tools/sync_landing.py

Rewrites two blocks of ../index.html: between the `algo-book` markers, the book of the
All Methods page (the same generator writes it, and the same Markdown extensions as in
mkdocs.yml turn it into HTML; only the addresses differ, because the landing page sits
one directory above the documentation); between the `algo-table` markers, the
paper's structural comparison of the robust methods, one row per method; and between
the `shift-toolbox` markers, the shift toolbox from data/shifts.yaml, with the
first source and mode already shown, so that the page reads without scripts; between
the `task-support` markers (below the loop of the six sources), one card per task of
data/tasks.yaml; and between the `results-data` markers, the leaderboard data.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

import html as htmlmod
import json

import markdown
import yaml

SRC = Path(__file__).resolve().parents[1]
LANDING = SRC.parent / "index.html"
BOOK = ("<!-- algo-book:start -->", "<!-- algo-book:end -->")
TABLE = ("<!-- algo-table:start -->", "<!-- algo-table:end -->")
TOOLBOX = ("<!-- shift-toolbox:start -->", "<!-- shift-toolbox:end -->")
RESULTS = ("<!-- results-data:start -->", "<!-- results-data:end -->")
TASKS = ("<!-- task-support:start -->", "<!-- task-support:end -->")
FIGURES = ("<!-- figures-data:start -->", "<!-- figures-data:end -->")

CLAIMED = {"dynamic": "Dynamic shift", "observation": "Observation shift", "semantics": "Semantic shift"}
# The table holds robust methods only, so the group follows from the setting.
GROUP = {"offline": "robust-offline", "online": "robust-online", "safe": "robust-safe"}
GROUPS = [
    ("offline", "Robust Offline", "learns from a fixed dataset without environment interaction",
     [("learner", "Learner-centric"), ("data", "Data-centric"), ("generative", "Data-centric · generative")]),
    ("online", "Robust Online", "learns through continued environment interaction",
     [("learner", "Learner-centric"), ("environment", "Environment-centric")]),
    ("safe", "Robust Safe", "adds a cost constraint that must hold under shift",
     [("safe", "Robust safe")]),
]

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gen_algorithms import book  # noqa: E402
import gen_results  # noqa: E402


def extensions():
    """The Markdown extensions of the documentation, as (names, configurations)."""
    names, configs = [], {}
    for item in yaml.safe_load(open(SRC / "mkdocs.yml"))["markdown_extensions"]:
        if isinstance(item, dict):
            (name, config), = item.items()
            configs[name] = config or {}
        else:
            name = item
        if name != "toc":           # the book has no headings; permalinks are for pages
            names.append(name)
        else:
            configs.pop(name, None)
    return names, configs


def book_html(spec, refs):
    text = "\n".join(book(spec, refs, script=None,
                          page=lambda group, slug: f"docs/algorithms/{group}/{slug}/"))
    names, configs = extensions()
    html = markdown.markdown(text, extensions=names, extension_configs=configs)
    if "markdown=" in html or "```" in html:
        sys.exit("the book was not fully converted to HTML")
    return html


def tick(flag):
    return '<td class="c tick">✓</td>' if flag else '<td class="c"></td>'


def table_html(spec):
    rows = ['<div class="table-scroll">', '  <table class="data">', "    <thead>", "      <tr>",
            "        <th>Family</th><th>Method</th><th>Claimed<br>robustness</th><th>Base<br>algorithm</th>",
            '        <th class="c">Shifted-env<br>rollout</th><th class="c">Adversarial<br>network</th>'
            '<th class="c">Learned<br>model</th>',
            "      </tr>", "    </thead>", "    <tbody>"]
    for regime, label, blurb, families in GROUPS:
        rows.append(f'      <tr class="grp"><td colspan="7">{label} — {blurb}</td></tr>')
        for fam, fam_label in families:
            members = [a for a in spec["algorithms"]
                       if a["regime"] == regime and a["family"] == fam]
            for i, a in enumerate(members):
                t = a["traits"]
                head = (f'<td rowspan="{len(members)}" class="nw">{fam_label}</td>' if i == 0 else "")
                rows.append(
                    f'      <tr>{head}<td class="nw"><a href="docs/algorithms/{GROUP[a["regime"]]}/{a["slug"]}/"><b>{a["name"]}</b></a></td>'
                    f'<td>{CLAIMED[a["claimed"]]}</td><td>{a["base"]}</td>'
                    f'{tick(t["rollout"])}{tick(t["adversary"])}{tick(t["model"])}</tr>')
    rows += ["    </tbody>", "  </table>", "</div>",
             '<p class="tbl-note">',
             "  <em>Shifted-env rollout</em>: rollouts collected from a deliberately perturbed environment.",
             "  <em>Adversarial network</em>: a learned adversary optimised against the policy.",
             "  <em>Learned model</em>: a trained next-state predictor used by the robustness mechanism.",
             "  The six standard references are on the <a href=\"docs/algorithms/\">algorithm pages</a>.",
             "</p>"]
    return "\n".join("    " + r for r in rows)


def esc(text):
    return htmlmod.escape(str(text), quote=True)


def toolbox_panel(source, mode_key, modes):
    """The example panel for one source and one mode, as the script renders it."""
    mode = next(m for m in modes if m["key"] == mode_key)
    entry = source["modes"][mode_key]
    names = "".join(f"<code>{esc(n)}</code>" for n in entry.get("names", []))
    example = source["example"]
    if "videos" in example:
        clips = "".join(
            f'<div class="tb-clip"><span>{label}</span>'
            f'<video src="{esc(example["videos"][key])}" poster="{esc(example["posters"][key])}" '
            f'autoplay muted loop playsinline controls preload="metadata" '
            f'aria-label="{label}: {esc(example["caption"])}"></video></div>'
            for key, label in (("nominal", "Nominal"), ("shifted", "Shifted"))
        )
        media = f'<div class="tb-comparison{" tb-comparison-tall" if source["key"] == "latency" else ""}">{clips}</div>'
    else:
        media = f'<img src="{esc(example["image"])}" alt="{esc(example["caption"])}">'
    return (
        f'<div class="tb-detail">'
        f'<p class="tb-title"><b>{esc(source["name"])}</b> · {esc(mode["name"])}</p>'
        f'<p class="tb-blurb">{esc(entry.get("note", ""))}</p>'
        + (f'<p class="tb-names">{names}</p>' if names else "")
        + f'<pre class="code tb-code">{esc(entry["code"])}</pre>'
        f'<p class="tb-links"><a href="{esc(source["page"])}">{esc(source["name"])} in the tutorial</a> · '
        f'<a href="{esc(mode["page"])}">{esc(mode["name"])} mode</a></p></div>\n'
        f'<figure class="tb-figure">{media}'
        f'<figcaption>{esc(example["caption"])}</figcaption></figure>')


FAMILIES = ["Locomotion", "Manipulation", "Navigation", "Vehicle control", "Humanoid", "Vision-language-action"]


def task_card(task, sources):
    """One task of the support block, as the script renders it."""
    media = task["media"]
    if media.endswith((".mp4", ".webm")):
        poster = f' poster="{esc(task["poster"])}"' if task.get("poster") else ""
        fig = (f'<video src="{esc(media)}"{poster} autoplay muted loop playsinline preload="metadata" '
               f'aria-label="{esc(task["caption"])}"></video>')
    else:
        fig = f'<img src="{esc(media)}" alt="{esc(task["caption"])}" loading="lazy">'
    dots = "".join(f'<span class="tb-dot tb-{k}" title="{esc(next(s["name"] for s in sources if s["key"] == k))}"></span>'
                   for k in task["shifts"])
    parts = ", ".join(f"Part {n}" for n in task["parts"])
    return (f'<article class="tb-task" data-family="{esc(task["family"])}" data-regime="{esc(" ".join(task["regime"]))}" '
            f'data-shifts="{esc(" ".join(task["shifts"]))}">'
            f'<figure class="tb-task-media">{fig}</figure>'
            f'<h4>{esc(task["name"])}</h4>'
            f'<p class="tb-task-meta">{esc(task["family"])} · {esc(task["backend"])} · {esc(" / ".join(task["regime"]))}</p>'
            f'<p class="tb-task-axes">{esc(", ".join(task["axes"]))}</p>'
            f'<p class="tb-task-foot"><span class="tb-task-dots">{dots}</span><span class="tb-task-parts">{esc(parts)}</span></p>'
            f'</article>')


def tasks_html(tasks, sources):
    """The task-support block, below the loop of the six sources (outside the toolbox card)."""
    out = ['<div class="tb-tasks" id="tb-tasks">',
           '  <p class="tb-tasks-note">Every task the paper reports, with the shift sources the toolbox offers on it. A source selected in the toolbox above dims the tasks that do not carry it.</p>',
           '  <div class="tb-row"><span class="tb-label">Family</span><div class="tb-buttons" role="group" aria-label="Task family">',
           '    <button type="button" class="tb-btn tb-family is-active" data-family="all">All</button>']
    for f in FAMILIES:
        out.append(f'    <button type="button" class="tb-btn tb-family" data-family="{esc(f)}">{esc(f)}</button>')
    out.append('  </div></div>')
    out.append('  <div class="tb-row"><span class="tb-label">Regime</span><div class="tb-buttons" role="group" aria-label="Regime">')
    for key, label in (("all", "All"), ("online", "Online"), ("offline", "Offline")):
        out.append(f'    <button type="button" class="tb-btn tb-regime{" is-active" if key == "all" else ""}" data-regime="{key}">{label}</button>')
    out.append('  </div></div>')
    out.append('  <div class="tb-task-grid">')
    out.extend("    " + task_card(t, sources) for t in tasks)
    out.append('  </div>')
    out.append('  <p class="tb-tasks-empty" hidden>No task matches this filter.</p>')
    out.append('</div>')
    return "\n".join("    " + line for line in out)


def toolbox_html(data):
    modes, sources = data["modes"], data["sources"]
    first = sources[0]
    first_mode = next(m["key"] for m in modes if m["key"] in first["modes"])
    out = ['<div class="toolbox" id="shift-toolbox">',
           '  <p class="tb-heading">Shift toolbox</p>',
           '  <div class="tb-row"><span class="tb-label">Sources</span><div class="tb-buttons" role="tablist" aria-label="Shift sources">']
    for i, src in enumerate(sources):
        out.append(f'    <button type="button" class="tb-btn tb-source{" is-active" if i == 0 else ""}" '
                   f'data-source="{src["key"]}" role="tab" aria-selected="{"true" if i == 0 else "false"}">'
                   f'<span class="tb-dot tb-{src["key"]}"></span>{esc(src["name"])}</button>')
    out.append('  </div></div>')
    out.append('  <div class="tb-row"><span class="tb-label">Modes</span><div class="tb-buttons" role="tablist" aria-label="Shift modes">')
    for m in modes:
        on = m["key"] in first["modes"]
        disabled = "" if on else ' aria-disabled="true"'
        active = " is-active" if m["key"] == first_mode else ""
        selected = "true" if m["key"] == first_mode else "false"
        out.append(f'    <button type="button" class="tb-btn tb-mode{active}" data-mode="{m["key"]}" '
                   f'role="tab" aria-selected="{selected}"{disabled}>{esc(m["name"])}</button>')
    out.append('  </div></div>')
    out.append(f'  <div class="tb-panel{" is-comparison" if "videos" in first["example"] else ""}" id="tb-panel" aria-live="polite">')
    out.append(toolbox_panel(first, first_mode, modes))
    out.append('  </div>')
    out.append('  <script type="application/json" id="shift-data">' + json.dumps(data, ensure_ascii=False).replace("</", "<\\/") + '</script>')
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
    refs = yaml.safe_load(open(SRC / "data" / "references.yaml"))
    html = LANDING.read_text()
    # The book is not indented: it holds <pre> blocks, where leading spaces would show.
    # the landing copy lies closed until it scrolls into view (book.js reads the attribute)
    html = replace(html, BOOK, book_html(spec, refs).replace('id="algorithm-book"', 'id="algorithm-book" data-open-on-view=""', 1))
    html = replace(html, TABLE, table_html(spec))
    shifts = yaml.safe_load(open(SRC / "data" / "shifts.yaml"))
    html = replace(html, TOOLBOX, toolbox_html(shifts))
    tasks = yaml.safe_load(open(SRC / "data" / "tasks.yaml"))["tasks"]
    html = replace(html, TASKS, tasks_html(tasks, shifts["sources"]))
    figures = {name: yaml.safe_load(open(SRC / "data" / "figures" / f"{name}.json")) for name in ("gain_decay", "part4")}
    payload = json.dumps(figures, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    html = replace(html, FIGURES, '<script type="application/json" id="figures-data">' + payload + "</script>")
    results = gen_results.build()
    print(gen_results.check(results))
    payload = json.dumps(results, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    html = replace(html, RESULTS, '<script type="application/json" id="results-data">' + payload + "</script>")
    LANDING.write_text(html)
    print(f"synced algorithm book, table, shift toolbox, task support, figures and results in {LANDING.name}")


if __name__ == "__main__":
    main()
