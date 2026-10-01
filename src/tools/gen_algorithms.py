#!/usr/bin/env python
"""Generate the algorithm pages from data/algorithms.yaml and the frozen result table.

    python tools/gen_algorithms.py

Writes content/algorithms/index.md (all methods), one overview page per group
(content/algorithms/<group>/index.md) and one page per method
(content/algorithms/<group>/<slug>.md). The groups are the ones of the sidebar:
standard, robust-online, robust-offline, robust-safe.

A method page carries one table of numbers, "Robust performance" per task with an
average row, and nothing else about results. It is computed here from
data/results/part1_master.csv with the aggregation the paper uses: condition ->
axis -> task -> method, equal weight at every level, on the pre-registered
selection of 220 conditions. The script re-derives the paper's headline numbers
first and refuses to write pages if they no longer match, so a page can never
drift away from the paper silently.
"""
from __future__ import annotations

import textwrap
import csv
import re
import statistics as st
import sys
from collections import defaultdict
from pathlib import Path

import yaml

SRC = Path(__file__).resolve().parents[1]
DATA = SRC / "data"
OUT = SRC / "content" / "algorithms"

# Headline numbers of the paper, on the selection. (robust - standard) per quartile
# and pooled. Tolerance is the rounding of one decimal.
HEADLINE = {"gap_q1": 10.3, "gap_q4": 5.1, "gap_pooled": 7.9}

CLAIMED = {"dynamic": "Dynamic shift", "observation": "Observation shift",
           "semantics": "Semantic shift", "none": "—"}
SETTING = {"offline": "Offline", "online": "Online", "safe": "Online, with a cost constraint"}

GROUPS = ["standard", "robust-online", "robust-offline", "robust-safe"]
GROUP_TITLE = {"standard": "Standard Algorithms", "robust-online": "Robust Online Algorithms",
               "robust-offline": "Robust Offline Algorithms",
               "robust-safe": "Robust Safe Algorithms"}
GROUP_INTRO = {
    "standard": "Standard algorithms carry no robustness mechanism. They are the base learners "
                "that the robust methods are built on, and the reference that every robust "
                "method is measured against. The library holds four offline and two online "
                "standard algorithms.",
    "robust-online": "Robust online methods learn through continued interaction with the "
                     "environment. They are organised by where robustness enters: "
                     "learner-centric methods change how experience is optimised, and "
                     "environment-centric methods collect their rollouts in a perturbed "
                     "environment.",
    "robust-offline": "Robust offline methods learn from a fixed dataset and never interact "
                      "with the environment, so they meet every shift without having seen it. "
                      "They are organised by where robustness enters: the learner, the data, "
                      "or a generative model of the data.",
    "robust-safe": "Robust safe methods add a cost constraint and make it hold under shifted "
                   "dynamics. They are implemented in the online setting on a shared PPO "
                   "learner and run on the Isaac Lab tasks.",
}
GROUP_GLANCE = {
    "standard": [("Role", "Base learner of the robust methods, and reference for comparison"),
                 ("Interface", "One experiment file per run, launched with a training script"),
                 ("Method selection", "The `algorithm` card named by the experiment file"),
                 ("Training", "On the nominal task, with the native recipe of each algorithm"),
                 ("Evaluation", "The frozen checkpoint, on the grid named by the `eval` card")],
    "robust-online": [("Interface", "One experiment file per run, launched with a training script"),
                      ("Method selection", "The `algorithm` card named by the experiment file"),
                      ("Training data", "Rollouts collected during training"),
                      ("Training environment", "Nominal, except for environment-centric methods"),
                      ("Budget", "Environment steps, native to each method"),
                      ("Evaluation", "The frozen checkpoint, on the grid named by the `eval` card")],
    "robust-offline": [("Interface", "One experiment file per run, launched with a training script"),
                       ("Method selection", "The `algorithm` card named by the experiment file"),
                       ("Training data", "A fixed dataset, named by the `task` card"),
                       ("Training environment", "None. The environment is used for evaluation only"),
                       ("Budget", "Gradient updates, native to each method"),
                       ("Evaluation", "The frozen checkpoint, on the grid named by the `eval` card")],
    "robust-safe": [("Interface", "The Isaac Lab training and evaluation recipe"),
                    ("Shared learner", "One PPO implementation for every method"),
                    ("Constraint", "A cost budget on joint-limit violations"),
                    ("Tasks", "Unitree G1 locomotion and Franka drawer manipulation")],
}
GROUP_EXAMPLE = {"standard": "iql", "robust-online": "atla-sa", "robust-offline": "rorl"}
COLS = ("nominal", "q1", "q2", "q3", "q4", "all")
GRID_HEAD = "| Nominal | Q1 | Q2 | Q3 | Q4 | All |"
GRID_RULE = "--:|--:|--:|--:|--:|--:|"
GRID_NOTE = ("Normalized score of the frozen checkpoint. Q1 to Q4 are the severity "
             "quartiles of each perturbation ladder, ordered by displacement from the nominal "
             "setting, and *All* covers every shifted condition.")


def group_of(algo):
    if algo["family"] == "standard":
        return "standard"
    return {"online": "robust-online", "offline": "robust-offline", "safe": "robust-safe"}[algo["regime"]]


# --------------------------------------------------------------------- loading
def read_csv(name):
    with open(DATA / "results" / name, newline="") as f:
        return list(csv.DictReader(f))


def mean(values):
    values = list(values)
    return st.mean(values) if values else None


# ----------------------------------------------------------------- aggregation
class Part1:
    """Library-wide grid. Mirrors the paper's roll-up exactly."""

    def __init__(self, rows):
        self.rows = rows
        self.mech = {(r["regime"], r["method"]): r["mechanism"] for r in rows}
        self.overall = self._roll_up(lambda r: r["in_selection"] == "1")
        self.by_quartile = {
            q: self._roll_up(lambda r, q=q: r["in_selection"] == "1"
                             and r["severity_quartile_sel"] == str(q))
            for q in range(1, 5)}
        # Offline nominals are replicated across axes and online nominals are measured
        # once per axis sweep; averaging over axes inside a task handles both.
        self.nominal = self._roll_up(lambda r: r["is_nominal"] == "1")
        self.standard = [k for k, m in self.mech.items() if m == "standard"]

    def _roll_up(self, keep, per_task=False):
        cell = defaultdict(list)
        for r in self.rows:
            if keep(r):
                cell[(r["regime"], r["method"], r["task"], r["axis"])].append(float(r["score"]))
        tasks = defaultdict(list)
        for (regime, method, task, _axis), vals in cell.items():
            tasks[(regime, method, task)].append(st.mean(vals))
        tasks = {k: st.mean(v) for k, v in tasks.items()}
        if per_task:
            return tasks
        methods = defaultdict(list)
        for (regime, method, _task), v in tasks.items():
            methods[(regime, method)].append(v)
        return {k: st.mean(v) for k, v in methods.items()}

    def per_task(self, key):
        overall = self._roll_up(lambda r: r["in_selection"] == "1", per_task=True)
        nominal = self._roll_up(lambda r: r["is_nominal"] == "1", per_task=True)
        quart = {q: self._roll_up(lambda r, q=q: r["in_selection"] == "1"
                                  and r["severity_quartile_sel"] == str(q), per_task=True)
                 for q in range(1, 5)}
        table = {}
        for (rg, m, task), v in overall.items():
            if (rg, m) == tuple(key):
                table[task] = {"nominal": nominal.get((rg, m, task)), "all": v,
                               **{f"q{q}": quart[q].get((rg, m, task)) for q in range(1, 5)}}
        return table

    def row(self, key):
        return {"nominal": self.nominal.get(key), "all": self.overall.get(key),
                **{f"q{q}": self.by_quartile[q].get(key) for q in range(1, 5)}}

    def check_headline(self):
        robust = [k for k, m in self.mech.items() if m != "standard"]
        gap = lambda table: mean(table[k] for k in robust) - mean(table[k] for k in self.standard)
        got = {"gap_pooled": gap(self.overall), "gap_q1": gap(self.by_quartile[1]),
               "gap_q4": gap(self.by_quartile[4])}
        bad = {k: (round(got[k], 1), v) for k, v in HEADLINE.items()
               if abs(round(got[k], 1) - v) > 1e-9}
        return got, bad


# ------------------------------------------------------------------ formatting
def num(v):
    return "—" if v is None else f"{v:.1f}".replace("-", "−")


def yes(flag):
    return "Yes" if flag else "No"


def tick(flag):
    return "✓" if flag else ""


def cite(refs, key):
    r = refs[key]
    return f"{r['authors']} *{r['title']}*. {r['venue']}, {r['year']}."


def badge(kind, label):
    return f'<span class="rl-badge rl-{kind}">{label}</span>'


def fam_badge(algo, fam, short=True):
    f = fam[algo["family"]]
    return badge(f"fam-{algo['family']}", f.get("short", f["label"]) if short else f["label"])


def wrap_command(cmd, width=78):
    """Break a long shell command before its options, with line continuations."""
    if cmd.startswith("#") or len(cmd) <= width:
        return cmd
    head, *rest = cmd.split(" -", 1)
    if not rest:
        return cmd
    tail = "-" + rest[0]
    for sep in (" -- ", " --run-dir "):
        tail = tail.replace(sep, " \\\n    " + sep.strip() + " ")
    return head + " \\\n    " + tail


CONFIG_DIR = "robustrllib/configs/experiment"


def opening(text, limit=240):
    """The first sentences of a paragraph, as many as fit in `limit` characters."""
    sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z])", text)
    out = sentences[0]
    for s in sentences[1:]:
        if len(out) + 1 + len(s) > limit:
            break
        out += " " + s
    return out


def wrap_book(run, width=46):
    """The commands of a method, set for the narrow column of a page of the book.

    The directory of the experiment files goes into a shell variable, every line breaks
    between two options, and a comment is folded under its own marker.
    """
    short = any(CONFIG_DIR + "/" in c for c in run if not c.startswith("#"))
    out = [f"CFG={CONFIG_DIR}"] if short else []
    for cmd in run:
        if cmd.startswith("#"):
            lead = re.match(r"#\s*(\d+\.\s*)?", cmd).group(0)
            out += textwrap.wrap(cmd[len(lead):], width=width, initial_indent=lead,
                                 subsequent_indent="#" + " " * (len(lead) - 1),
                                 break_long_words=False, break_on_hyphens=False)
            continue
        units = []
        for tok in cmd.replace(CONFIG_DIR + "/", "$CFG/").split():
            opens = tok.startswith("-") and not (units and units[-1] == ["--"])
            if opens or not units:
                units.append([tok])
            else:
                units[-1].append(tok)
        # a program with a long path: the path goes on a line of its own
        if len(units[0]) > 1 and len(" ".join(units[0])) + 2 > width:
            units[:1] = [units[0][:1], units[0][1:]]
        lines = []
        for unit in (" ".join(u) for u in units):
            if lines and len(lines[-1]) + 1 + len(unit) + 2 <= width and len(lines) > 1:
                lines[-1] += " " + unit
            else:
                lines.append(("    " if lines else "") + unit)
        out.append(" \\\n".join(lines))
    return out


def grid_line(label, row, bold=False):
    cells = [num(row[k]) for k in COLS]
    if bold:
        label, cells = f"**{label}**", [f"**{c}**" for c in cells]
    return f"| {label} | " + " | ".join(cells) + " |"


# ---------------------------------------------------------------- method page
def method_page(algo, fam, refs, p1):
    group = group_of(algo)
    out = ["---", f"title: {algo['name']}", "---", "", f"# {algo['name']}", "",
           f'<p class="rl-subtitle">{algo["title"]}</p>', "",
           '<p class="rl-badges">' + badge("setting", SETTING[algo["regime"]].split(",")[0])
           + fam_badge(algo, fam, short=False)
           + (badge("plain", f"Base · {algo['base']}") if algo.get("base") else "")
           + (badge("plain", f"Claims · {CLAIMED[algo['claimed']].lower()}")
              if algo["claimed"] != "none" else "") + "</p>", "",
           algo["tagline"], ""]

    base = algo.get("base") or "—"
    if algo.get("base_note"):
        base += f" ({algo['base_note']})"
    rows = [("Group", f"[{GROUP_TITLE[group]}](index.md)"),
            ("Setting", SETTING[algo["regime"]]),
            ("Family", fam[algo["family"]]["label"]),
            ("Base algorithm", base),
            ("Claimed robustness", CLAIMED[algo["claimed"]])]
    if group != "standard":
        t = algo["traits"]
        rows += [("Shifted-env rollout", yes(t["rollout"])),
                 ("Adversarial network", yes(t["adversary"])),
                 ("Learned model", yes(t["model"]))]
    if algo.get("budget"):
        rows.append(("Training budget", algo["budget"]))
    rows.append(("Original paper", cite(refs, algo["ref"]["key"])))
    out += ["## Features", "", "| Feature | Value |", "|---|---|"]
    out += [f"| {k} | {v} |" for k, v in rows] + [""]

    out += ["## Mechanism", "", algo["mechanism"].rstrip(), ""]
    if algo.get("notes"):
        out += ["**Implementation notes.**", ""] + [f"- {n}" for n in algo["notes"]] + [""]

    code = algo["code"]
    out += ["## Run the method", ""]
    if not code.get("dir"):
        out += ["The method is trained and evaluated with the Isaac Lab recipe, on the PPO "
                "implementation that every method of this group shares.", ""]
    else:
        if code.get("run"):
            out += ["```bash", *[wrap_command(c) for c in code["run"]], "```", ""]
        files = [("Implementation", code.get("dir")), ("Algorithm card", code.get("config")),
                 ("Experiment file", code.get("experiment")),
                 ("Randomization ranges", code.get("randomization"))]
        out += ["| File | Path |", "|---|---|"]
        out += [f"| {k} | `{v}` |" for k, v in files if v] + [""]
        where = ("Training rollouts come from the method's own perturbed environment."
                 if algo["traits"]["rollout"] else "Training is on the nominal task.")
        out += [f"{where} The configuration files are explained in "
                "[Train an algorithm](../run-a-method.md), and the evaluation of the frozen "
                "checkpoint in [Evaluation Protocol](../../evaluation/protocol.md).", ""]

    variants = [v for v in algo["variants"] if v.get("part1")]
    if variants and group != "robust-safe":
        out += ["## Robust performance", "", GRID_NOTE + " The last row averages the tasks.", ""]
        for v in variants:
            if len(variants) > 1:
                out += [f"**{v['label']}**", ""]
            table = p1.per_task(v["part1"])
            out += ["| Task " + GRID_HEAD, "|---|" + GRID_RULE]
            out += [grid_line(task, table[task]) for task in sorted(table)]
            out += [grid_line("Average", p1.row(tuple(v["part1"])), bold=True), ""]

    keys = [algo["ref"]["key"]] + algo["ref"].get("extra", [])
    out += ["## References", ""] + [f"- {cite(refs, k)}" for k in keys] + [""]
    return "\n".join(out)


# ----------------------------------------------------------------- group page
def supported_table(algos, fam, link_prefix="", setting=False):
    head = ["Method", "Family"] + (["Setting"] if setting else []) + [
        "Base", "Claimed<br>robustness", "Shifted-env<br>rollout", "Adversarial<br>network",
        "Learned<br>model"]
    out = ["| " + " | ".join(head) + " |",
           "|---|---|" + ("---|" if setting else "") + "---|---|:-:|:-:|:-:|"]
    for a in algos:
        t, std = a["traits"], a["family"] == "standard"
        cells = [f"[**{a['name']}**]({link_prefix}{a['slug']}.md)", fam_badge(a, fam)]
        if setting:
            cells.append(SETTING[a["regime"]].split(",")[0])
        cells += [a.get("base") or "—", CLAIMED[a["claimed"]].replace(" shift", ""),
                  "" if std else tick(t["rollout"]), "" if std else tick(t["adversary"]),
                  "" if std else tick(t["model"])]
        out.append("| " + " | ".join(cells) + " |")
    return out


def group_page(group, spec, p1):
    fam = spec["families"]
    algos = [a for a in spec["algorithms"] if group_of(a) == group]
    title = GROUP_TITLE[group]
    out = ["---", f"title: {title}", "---", "", f"# {title}", "", GROUP_INTRO[group], "",
           "## Features", "", f"| Feature | {title} |", "|---|---|"]
    out += [f"| {k} | {v} |" for k, v in GROUP_GLANCE[group]] + [""]

    out += ["## Supported methods", ""]
    out += supported_table(algos, fam, setting=(group == "standard")) + [""]
    if group != "standard":
        out += ["*Claimed robustness* is the shift the original paper targets.", ""]

    out += ["## Run a method", ""]
    if group in GROUP_EXAMPLE:
        ex = next(a for a in algos if a["slug"] == GROUP_EXAMPLE[group])
        out += [f"Every method is launched from an experiment file. {ex['name']} on Hopper:", "",
                "```bash", *[wrap_command(c) for c in ex["code"]["run"]], "```", "",
                "Every method page gives the command for that method. "
                "[Train an algorithm](../run-a-method.md) explains the experiment file, the "
                "overrides and the run directory.", "",
                "## Configuration", "",
                "| Method | Implementation | Experiment file | Training budget |",
                "|---|---|---|---|"]
        for a in algos:
            c = a["code"]
            impl = f"`{c['dir'].split(' ')[0]}`" if c.get("dir") else "—"
            exp = f"`{c['experiment'].rsplit('/', 1)[1]}`" if c.get("experiment") else "—"
            out.append(f"| [{a['name']}]({a['slug']}.md) | {impl} | {exp} | "
                       f"{a.get('budget') or '—'} |")
        out += ["", "Experiment files are in `robustrllib/configs/experiment/`. Each names the "
                "algorithm card, the task card and the evaluation grid of the run. **Every "
                "method keeps its native training recipe and budget**; what is shared is the "
                "evaluation.", "",
                "## Robust performance", "", GRID_NOTE, "",
                "| Method " + GRID_HEAD, "|---|" + GRID_RULE]
        for a in algos:
            for v in a["variants"]:
                name = v["label"] if len(a["variants"]) > 1 else a["name"]
                out.append(grid_line(f"[{name}]({a['slug']}.md)", p1.row(tuple(v["part1"]))))
        out += ["", "Scores are not clipped: 0 and 100 are reference points, not bounds. The "
                "protocol is described in [Evaluation Protocol](../../evaluation/protocol.md).", ""]
    else:
        out += ["The methods of this group are trained and evaluated with the Isaac Lab recipe, "
                "on one PPO implementation that every method shares.", ""]

    out += ["## Method pages", ""]
    for k, v in fam.items():
        members = [a for a in algos if a["family"] == k]
        if members:
            if group != "standard" and len({a["family"] for a in algos}) > 1:
                out += [f"**{v['label']}**", ""]
            out += [f"- [{a['name']}]({a['slug']}.md): {a['tagline']}" for a in members] + [""]
    return "\n".join(out)


# ------------------------------------------------------------ the algorithm book
GROUP_SHORT = {"standard": "Standard", "robust-online": "Robust Online",
               "robust-offline": "Robust Offline", "robust-safe": "Robust Safe"}


def book(spec, refs, page=None, script="../assets/book.js"):
    """The methods as a book: one spread per method, one label per group.

    Written as plain spreads that read from top to bottom; assets/book.js turns
    them into pages. Links to other pages are Markdown, so that the generator of
    the site resolves them for every way the site is built.

    `page(group, slug)` gives the address of a method page and `script` the address
    of book.js, both as seen from the page that holds the book. The defaults are
    those of the All Methods page; the landing page passes its own.
    """
    page = page or (lambda group, slug: f"{group}/{slug}.md")
    fam = spec["families"]
    algos = [a for grp in GROUPS for a in spec["algorithms"] if group_of(a) == grp]
    out = ['<div class="rl-book" id="algorithm-book" data-book markdown>', "",
           '<nav class="rl-book-tabs" aria-label="Groups of the algorithm book">',
           '<a class="rl-tab rl-tab-contents" data-group="contents" href="#book-contents">Contents</a>']
    for grp in GROUPS:
        members = [a for a in algos if group_of(a) == grp]
        out.append(f'<a class="rl-tab rl-tab-{grp}" data-group="{grp}" '
                   f'href="#book-{members[0]["slug"]}">{GROUP_SHORT[grp]}<span>{len(members)}</span></a>')
    out += ["</nav>", "", '<div class="rl-book-stage" markdown>', ""]

    # The paper counts every variant of a method; a method has one spread.
    count = sum(max(1, len(a.get("variants") or [])) for a in algos)
    several = [a["name"] for a in algos if len(a.get("variants") or []) > 1]
    shared = ""
    if several:
        words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]
        n = len(several) + count - len(algos)
        shared = (f"The {words[n] if n < len(words) else n} variants of "
                  + " and ".join(several) + " share one spread.")
    # ---- contents
    out += ['<section class="rl-spread" id="book-contents" data-group="contents" '
            'data-name="Contents" data-label="" markdown>', "",
            '<div class="rl-page rl-left" markdown>',
            '<p class="rl-book-group">RobustRLlib</p>',
            '<p class="rl-book-name">The Algorithm Book</p>',
            f'<p class="rl-book-title">{count} algorithms in four groups</p>', "",
            "Every method has one spread: what it is on the left, how it is configured and "
            f"run on the right. {shared}", "",
            "- Turn the page with the buttons, the arrow keys or a swipe.",
            "- A label on the edge of the book opens a group.",
            "- *Open the full page* leads to the complete description of a method.", "",
            '<p class="rl-book-folio">1</p>', "</div>", "",
            '<div class="rl-page rl-right" markdown>',
            '<p class="rl-book-h">Contents</p>', "", '<div class="rl-book-toc" markdown>', ""]
    for grp in GROUPS:
        members = [a for a in algos if group_of(a) == grp]
        links = " · ".join(f"[{a['name']}](#book-{a['slug']})" for a in members)
        out += [f'<span class="rl-book-tocg">{GROUP_SHORT[grp]}</span>{links}', ""]
    out += ["</div>", "", '<p class="rl-book-folio">2</p>', "</div>", "", "</section>", ""]

    # ---- one spread per method
    for n, a in enumerate(algos):
        grp = group_of(a)
        members = [x for x in algos if group_of(x) == grp]
        label = f"{GROUP_SHORT[grp]} · {members.index(a) + 1} of {len(members)}"
        lead = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", a["mechanism"].split("\n\n")[0])
        lead = opening(" ".join(lead.split()))
        badges = (fam_badge(a, fam, short=False)
                  + (badge("plain", f"Base · {a['base']}") if a.get("base") else "")
                  + (badge("plain", f"Claims · {CLAIMED[a['claimed']].lower()}")
                     if a["claimed"] != "none" else ""))
        out += [f'<section class="rl-spread" id="book-{a["slug"]}" data-group="{grp}" '
                f'data-name="{a["name"]}" data-label="{label}" markdown>', "",
                '<div class="rl-page rl-left" markdown>',
                f'<p class="rl-book-group">{label}</p>',
                f'<p class="rl-book-name">{a["name"]}</p>',
                f'<p class="rl-book-title">{a["title"]}</p>',
                f'<p class="rl-badges">{badges}</p>',
                f'<p class="rl-book-tagline">{a["tagline"]}</p>', "", lead, "",
                f'<p class="rl-book-paper" markdown><b>Original paper</b>{cite(refs, a["ref"]["key"])}</p>', "",
                f'<p class="rl-book-folio">{2 * n + 3}</p>', "</div>", ""]

        base = a.get("base") or "—"
        if a.get("base_note"):
            base += f" ({a['base_note']})"
        # The setting, the family and the claimed shift are on the badges of the left page.
        rows = [("Base algorithm", base)]
        if grp != "standard":
            t = a["traits"]
            rows += [("Shifted-env rollout", yes(t["rollout"])),
                     ("Adversarial network", yes(t["adversary"])),
                     ("Learned model", yes(t["model"]))]
        if a.get("budget"):
            rows.append(("Training budget", a["budget"]))
        out += ['<div class="rl-page rl-right" markdown>', '<p class="rl-book-h">Features</p>', "",
                "| Feature | Value |", "|---|---|"] + [f"| {k} | {v} |" for k, v in rows] + [""]
        out += ['<p class="rl-book-h">Run the method</p>', ""]
        run = a["code"].get("run")
        if run:
            out += ["```bash", *wrap_book(run), "```", ""]
        elif not a["code"].get("dir"):
            out += ["Trained and evaluated with the Isaac Lab recipe, on the PPO implementation "
                    "that the methods of this group share.", ""]
        else:
            out += [f"Launched with the experiment file `{a['code']['experiment'].rsplit('/', 1)[1]}`; "
                    "the full page gives the steps.", ""]
        out += [f'<p class="rl-book-more" markdown>[Open the full page]({page(grp, a["slug"])})</p>', "",
                f'<p class="rl-book-folio">{2 * n + 4}</p>', "</div>", "", "</section>", ""]

    out += ["</div>", "",
            '<div class="rl-book-controls">',
            '<button type="button" class="rl-prev" aria-label="Previous page">&lsaquo; Previous</button>',
            '<span class="rl-book-status" role="status" aria-live="polite"></span>',
            '<button type="button" class="rl-next" aria-label="Next page">Next &rsaquo;</button>',
            "</div>",
            '<p class="rl-book-hint">Arrow keys turn the page once the book has the focus.</p>', "",
            "</div>", ""]
    if script:
        out += [f'<script src="{script}" defer></script>', ""]
    return out


# ------------------------------------------------------------ all-methods page
def index(spec, refs):
    fam = spec["families"]
    out = ["---", "title: All Methods", "---", "", "# All Methods", "",
           "RobustRLlib is organised around **algorithm attribution**. Every method records "
           "where robustness enters, which shift it claims to address, and which base "
           "algorithm realises it.", "",
           "## Algorithm book", "",
           "The book below holds one spread per method. Its labels open the four groups: "
           "standard, robust online, robust offline and robust safe.", ""]
    out += book(spec, refs)
    out += ["## Families", "",
            '<p class="rl-legend">' + "".join(
                badge(f"fam-{k}", v["label"]) for k, v in fam.items()) + "</p>", ""]
    for group in GROUPS:
        algos = [a for a in spec["algorithms"] if group_of(a) == group]
        out += [f"## {GROUP_TITLE[group]}", "",
                f"{len(algos)} methods. See [{GROUP_TITLE[group]}]({group}/index.md).", ""]
        out += supported_table(algos, fam, link_prefix=f"{group}/",
                               setting=(group == "standard")) + [""]
    out += ["## How to read the tables", "",
            "- **Family** says where robustness enters: the learner, the data, a generative "
            "model of the data, or the environment that training rollouts come from.",
            "- **Base** is the algorithm a method is built on. A robust method and its base "
            "are trained and evaluated under the same protocol.",
            "- **Claimed robustness** is the shift the original paper targets.",
            "- **Shifted-env rollout** marks rollouts collected from a deliberately perturbed "
            "environment. Offline methods learn from fixed nominal data, so it is never "
            "ticked for them.",
            "- **Adversarial network** marks a learned adversary optimised against the policy.",
            "- **Learned model** marks a trained next-state predictor used by the robustness "
            "mechanism.", ""]
    return "\n".join(out)


def main():
    spec = yaml.safe_load(open(DATA / "algorithms.yaml"))
    refs = yaml.safe_load(open(DATA / "references.yaml"))
    p1 = Part1(read_csv("part1_master.csv"))

    got, bad = p1.check_headline()
    print("headline check:", {k: round(v, 1) for k, v in got.items()})
    if bad:
        sys.exit(f"headline numbers do not match the paper (got, expected): {bad}")
    missing = [(a["slug"], v["label"]) for a in spec["algorithms"] for v in a["variants"]
               if tuple(v["part1"]) not in p1.overall]
    if missing:
        sys.exit(f"variants without library-grid data: {missing}")

    # Generated files are replaced as a set, so a method that was renamed or
    # removed leaves no page behind. Hand-written pages are not touched.
    for group in GROUPS:
        d = OUT / group
        d.mkdir(parents=True, exist_ok=True)
        for old in d.glob("*.md"):
            old.unlink()
        (d / "index.md").write_text(group_page(group, spec, p1))
    for a in spec["algorithms"]:
        (OUT / group_of(a) / f"{a['slug']}.md").write_text(
            method_page(a, spec["families"], refs, p1))
    (OUT / "index.md").write_text(index(spec, refs))
    print(f"wrote {len(spec['algorithms'])} method pages, {len(GROUPS)} group pages "
          "and the method index")


if __name__ == "__main__":
    main()
