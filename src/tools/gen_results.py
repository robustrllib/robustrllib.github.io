#!/usr/bin/env python
"""The numbers behind the charts of the landing page, from the frozen result tables.

    python tools/gen_results.py            # prints a summary and checks the aggregates

Reads data/results/*.csv and returns (or writes) one JSON document that
assets/results.js draws. Three parts, each with the aggregation of the paper:

  library    Part 1, the library-wide grid: every (method, task, axis, condition) cell
             of the pre-registered selection plus the nominal cells. The page aggregates
             condition -> axis -> task -> method with equal weights, as the paper does.
  channels   Part 2, the isolated shifts on Hopper, the 22 configurations the paper
             reports per regime: the five selected cells of each frozen-policy channel
             (mean +- sd across seeds), the paper's channel score (the five cells equally
             weighted, per seed), the two training-time channels as one configuration
             each (trained under the shift, evaluated at nominal, +- across the ladder),
             and the semantic shift on the door task, online only, as the paper's figure prints it
             (seeds 0, 1, 42, 2024, 3407).
  compound   Part 3, the compound scenarios: nominal, each isolated shift, the compound
             cell and the independence prediction, per method and block.

Every number is a normalized score: 100 (R - R_min) / (R_max - R_min), unclipped.
The check at the end recomputes the paper's channel scores and stops if they differ
from the frozen summary the tables were typeset from.
"""
from __future__ import annotations

import csv
import json
import statistics as st
import sys
from collections import defaultdict
from pathlib import Path

SRC = Path(__file__).resolve().parents[1]
DATA = SRC / "data" / "results"

FAMILY = {
    "standard": "Standard RL (online / offline)", "learner_on": "Learner-centric (online)",
    "data_on": "Environment-centric (online)", "learner_off": "Learner-centric (offline)",
    "data_off": "Data-centric (offline)", "generative": "Generative model (offline)",
}
FAMILY_ORDER = ["standard", "learner_on", "data_on", "learner_off", "data_off", "generative"]

# The tables carry legacy keys for three methods; the site uses the paper's names.
DISPLAY = {"ATLA_off": "ATLA-IQL", "FMGAN": "PLR-PVL", "RSC": "RSC-IQL",
           "FMGAN-IQL": "PLR-PVL-IQL"}
# Where a method's page lives under docs/algorithms/.
PAGE = {
    "IQL": "standard/iql", "TD3+BC": "standard/td3bc", "MOPO": "standard/mopo", "SynthER": "standard/synther",
    "PPO": "standard/ppo", "SAC": "standard/sac",
    "ATLA": "robust-online/atla", "ATLA-PPO": "robust-online/atla", "ATLA-SA": "robust-online/atla-sa",
    "ATLA-SA-PPO": "robust-online/atla-sa", "RSC-SAC": "robust-online/rsc", "RARL-PPO": "robust-online/rarl",
    "RARL-TRPO": "robust-online/rarl", "RARL": "robust-online/rarl", "DR-SAC": "robust-online/dr",
    "RFQI": "robust-offline/rfqi", "RORL": "robust-offline/rorl", "ATLA-IQL": "robust-offline/atla-iql",
    "RSC-IQL": "robust-offline/rsc-iql", "RAMBO": "robust-offline/rambo", "ROMB": "robust-offline/romb",
    "ROMB-IQL": "robust-offline/romb", "FWM": "robust-offline/fwm", "FWM-IQL": "robust-offline/fwm",
    "PLR-PVL": "robust-offline/plr-pvl", "PLR-PVL-IQL": "robust-offline/plr-pvl",
}
# The family of the Part 2 and Part 3 rows, which carry no mechanism column.
FAMILY_OF = {
    "IQL": "standard", "TD3+BC": "standard", "MOPO": "standard", "SynthER": "standard", "PPO": "standard", "SAC": "standard",
    "ATLA-PPO": "learner_on", "ATLA-SA-PPO": "learner_on", "RSC-SAC": "learner_on", "ATLA-SAC": "learner_on",
    "RARL-PPO": "data_on", "RARL-TRPO": "data_on", "RARL": "data_on", "DR-SAC": "data_on", "SAC (in)": "data_on",
    "ATLA-IQL": "learner_off", "RFQI": "learner_off", "RORL": "learner_off",
    "RSC-IQL": "data_off", "RAMBO": "data_off",
    "ROMB-IQL": "generative", "FWM-IQL": "generative", "PLR-PVL-IQL": "generative",
}
AXIS = {"gravity": "Gravity", "morph": "Morphology", "gear": "Actuator gear", "fric": "Friction",
        "dryfric": "Dry friction", "latch": "Latch", "engine": "Engine power", "wind": "Wind",
        "adv": "Adversary"}

# ---- Part 2: the grids, the cells, and the paper's selection (configs/eval/r_part2_channels.yaml)
CHANNELS = [
    ("theta_o", "Observation shift", "frozen"),
    ("theta_a", "Action shift", "frozen"),
    ("theta_p", "Dynamic shift", "frozen"),
    ("theta_tau_exec", "Latency shift · execution", "frozen"),
    ("theta_r", "Reward/cost shift · in training", "training"),
    ("theta_tau_credit", "Latency shift · credit, in training", "training"),
    ("theta_z", "Semantic shift · door task", "semantic"),
]
# The semantic shift is measured on robosuite DoorCausal. The site shows what the paper's
# figure shows: the causal method, its two references and ATLA-SA-PPO, over the seeds the
# figure aggregates, normalized by the SAC nominal over those seeds.
SEMANTIC_ROWS = ["RSC-SAC", "PPO", "SAC", "ATLA-SA-PPO"]
SEMANTIC_SEEDS = {"0", "1", "42", "2024", "3407"}
SEMANTIC_COLLAPSE = 20.0          # a nominal binding score below this is a collapsed run
# the semantic panel of the paper's figure, to check the recomputation against
PAPER_SEMANTIC = {"RSC-SAC": (65.8, 28.8), "PPO": (45.5, 25.4), "SAC": (47.9, 17.3), "ATLA-SA-PPO": (55.0, 19.6)}
GRID = {
    "spec_obsadv_hopper": ("theta_o", "Observation noise"),
    "spec_obsadv_mad_hopper": ("theta_o", "Observation attack (MAD-PGD)"),
    "spec_action_hopper": ("theta_a", "Action corruption"),
    "spec_transition_hopper": ("theta_p", "Transition noise"),
    "spec_push_hopper": ("theta_p", "External push"),
    "spec_timevar_hopper": ("theta_p", "Non-stationary dynamics"),
    "spec_timing_hopper": ("theta_tau_exec", "Timing"),
}
SELECTED = {
    "spec_obsadv_hopper": ["obs_rel_0.10", "obs_uni_0.10", "obs_gauss_0.10"],
    "spec_obsadv_mad_hopper": ["mad_0.02", "mad_0.05"],
    "spec_action_hopper": ["act_uni_0.10", "act_gauss_0.10", "act_offset_0.05", "act_oppose_0.10", "cmd_oppose_0.20"],
    "spec_transition_hopper": ["trans_t1"],
    "spec_push_hopper": ["push_60"],
    "spec_timevar_hopper": ["gear_ramp_0.8", "gear_sine_p500", "gear_static_0.8"],
    "spec_timing_hopper": ["obs_delay_4ms", "act_delay_rand1", "obs_delay_8ms", "act_delay_8ms", "obs_delay_16ms"],
}
CELL = {
    "act_gauss_0.05": ("gauss", "Gaussian σ = 0.05"), "act_gauss_0.10": ("gauss", "Gaussian σ = 0.10"),
    "act_gauss_0.20": ("gauss", "Gaussian σ = 0.20"), "act_uni_0.10": ("uniform", "Uniform ±0.10"),
    "act_offset_0.05": ("shift", "Offset +0.05"), "act_oppose_0.10": ("oppose", "Opposition ε = 0.10"),
    "act_oppose_0.20": ("oppose", "Opposition ε = 0.20"),
    "cmd_gauss_0.20": ("gauss", "Gaussian σ = 0.20 on the unsaturated command"),
    "cmd_oppose_0.20": ("oppose", "Opposition ε = 0.20 on the unsaturated command"),
    "obs_uni_0.05": ("uniform", "Uniform ±0.05"), "obs_uni_0.10": ("uniform", "Uniform ±0.10"),
    "obs_uni_0.15": ("uniform", "Uniform ±0.15"), "obs_rel_0.05": ("relative", "Relative 0.05 × feature std"),
    "obs_rel_0.10": ("relative", "Relative 0.10 × feature std"), "obs_bias_0.05": ("bias", "Bias ±0.05, drawn per episode"),
    "obs_gauss_0.05": ("gauss", "Gaussian σ = 0.05"), "obs_gauss_0.10": ("gauss", "Gaussian σ = 0.10"),
    "obs_shift_0.01": ("shift", "Offset +0.01"), "obs_shift_0.02": ("shift", "Offset +0.02"),
    "mad_0.02": ("adversarial", "MAD-PGD ε = 0.02"), "mad_0.035": ("adversarial", "MAD-PGD ε = 0.035"),
    "mad_0.05": ("adversarial", "MAD-PGD ε = 0.05"), "mad_0.075": ("adversarial", "MAD-PGD ε = 0.075"),
    "mad_0.10": ("adversarial", "MAD-PGD ε = 0.10"),
    "trans_t1": ("gauss", "Process noise L1 (q 0.001, v 0.01)"), "trans_t2": ("gauss", "Process noise L2 (q 0.002, v 0.02)"),
    "trans_t3": ("gauss", "Process noise L3 (q 0.004, v 0.04)"),
    "push_30": ("push", "Push 30 N"), "push_60": ("push", "Push 60 N"), "push_100": ("push", "Push 100 N"),
    "push_150": ("push", "Push 150 N"),
    "gear_static_0.8": ("scale", "Gear ×0.8, static"), "gear_step_0.8": ("scale + step", "Gear 1.0 → 0.8, step at t = 500"),
    "gear_ramp_0.8": ("scale + linear", "Gear 1.0 → 0.8, ramp over 1000 steps"),
    "gear_sine_p200": ("scale + sine", "Gear 0.8 ↔ 1.2, period 200"), "gear_sine_p500": ("scale + sine", "Gear 0.8 ↔ 1.2, period 500"),
    "gravity_ramp_1.2": ("scale + linear", "Gravity 1.0 → 1.2, ramp over 1000 steps"),
    "act_delay_8ms": ("fixed", "Action delay 1 step (8 ms)"), "act_delay_rand1": ("buffer", "Action delay U{0, 1} steps"),
    "act_delay_rand2": ("buffer", "Action delay U{0, 1, 2} steps"), "substep": ("substep", "Variable control period"),
    "obs_delay_4ms": ("interp", "Observation delay 2–4 ms"), "obs_delay_8ms": ("interp", "Observation delay 4–8 ms"),
    "obs_delay_16ms": ("interp", "Observation delay 8–16 ms"),
}
ARM = {"m=gauss": "Gaussian noise, σ = 0.5", "m=uniform": "Uniform noise, std 0.5", "m=shift": "Offset, 0.5",
       "k=4": "Reward delayed 4 steps", "k=16": "Reward delayed 16 steps", "k=32": "Reward delayed 32 steps",
       "k=64": "Reward delayed 64 steps"}

# ---- Part 3
BLOCK = {"hopper_offline": "Hopper · offline", "hopper_online": "Hopper · online", "pusher": "Pusher · online"}
BLOCK_NOTE = {"hopper_offline": "the coupled physical, actuation and delay factors of OmniH2O",
              "hopper_online": "the coupled physical, actuation and delay factors of OmniH2O",
              "pusher": "the dynamics, observation and control-rate factors of Peng et al., with the goal displaced"}
PCELL = {"nominal": "Nominal", "theta_p": "Dynamic shift", "theta_a": "Action shift", "theta_tau": "Latency shift",
         "theta_o": "Observation shift", "theta_z": "Semantic shift", "compound": "Compound",
         "pred": "Independence prediction"}
PCELL_ORDER = ["nominal", "theta_p", "theta_a", "theta_tau", "theta_o", "theta_z", "compound", "pred"]


def rows(name):
    with open(DATA / name, newline="") as fh:
        return list(csv.DictReader(fh))


def r1(x):
    return round(float(x), 1)


def mean_sd(values):
    values = [float(v) for v in values]
    return (r1(st.mean(values)), r1(st.stdev(values)) if len(values) > 1 else 0.0, len(values))


class Index:
    """A list of records reached by key; the JSON refers to records by position."""

    def __init__(self):
        self.keys, self.records = [], []

    def add(self, key, record):
        if key not in self.keys:
            self.keys.append(key)
            self.records.append(record)
        return self.keys.index(key)

    def __call__(self, key):
        return self.keys.index(key)


def family_of(key):
    return FAMILY_OF[DISPLAY.get(key, key)]


def method_record(key, regime, family):
    return {"key": key, "name": DISPLAY.get(key, key), "regime": regime, "family": family,
            "page": PAGE.get(DISPLAY.get(key, key), PAGE.get(key))}


# ------------------------------------------------------------------ Part 1
def library():
    methods, tasks = Index(), Index()
    out = []
    for r in rows("part1_master.csv"):
        if r["in_selection"] != "1" and r["is_nominal"] != "1":
            continue
        m = methods.add((r["regime"], r["method"]), method_record(r["method"], r["regime"], r["mechanism"]))
        t = tasks.add((r["regime"], r["task"]), {"name": r["task"], "regime": r["regime"], "family": r["family"]})
        out.append([m, t, r["axis"], r["condition"], r["scale"] or None,
                    int(r["severity_quartile_sel"]) if r["severity_quartile_sel"] else 0,
                    r1(r["score"]), int(r["is_nominal"])])
    return {"families": [{"key": k, "label": FAMILY[k]} for k in FAMILY_ORDER],
            "methods": methods.records, "tasks": tasks.records, "axes": AXIS,
            "columns": ["method", "task", "axis", "condition", "scale", "quartile", "score", "nominal"],
            "rows": out}


# ------------------------------------------------------------------ Part 2
def channels():
    methods = Index()
    cells = rows("part2_cells_long.csv") + rows("part2_cells_long_standard.csv")
    per_seed = defaultdict(lambda: defaultdict(dict))     # (method) -> seed -> (grid, cell) -> score
    for r in cells:
        key = r["display"]
        methods.add(key, method_record(key, r["regime"], family_of(key)))
        per_seed[key][r["seed"]][(r["grid"], r["cell"])] = float(r["score"])

    # the cells the paper reports: the five of each channel, in the order of the selection
    cell_index = Index()
    for grid, (channel, glabel) in GRID.items():
        for cell in SELECTED[grid]:
            mode, label = CELL[cell]
            cell_index.add((grid, cell), {"grid": grid, "cell": cell, "channel": channel, "mode": mode,
                                          "label": label, "gridlabel": glabel})
    grids = [{"key": g, "channel": c, "label": l} for g, (c, l) in GRID.items()]

    values = []          # [method, view, mean, sd, n]; view = "cell:i" | "grid:<grid>" | "paper:<channel>"
    nominal = {}
    for m, seeds in per_seed.items():
        mi = methods(m)
        # every cell
        for ci, (grid, cell) in enumerate(cell_index.keys):
            v = [s[(grid, cell)] for s in seeds.values() if (grid, cell) in s]
            if v:
                values.append([mi, f"cell:{ci}", *mean_sd(v)])
        # the nominal condition, one per grid, the same checkpoint and episodes each time
        v = [st.mean(x for (g, c), x in s.items() if c == "nominal") for s in seeds.values()
             if any(c == "nominal" for (_g, c) in s)]
        if v:
            nominal[mi] = list(mean_sd(v))
        # the paper's channel score: its selected cells, equally weighted, per seed
        for channel, _label, kind in CHANNELS:
            if kind != "frozen":
                continue
            wanted = [(g, c) for g, (ch, _l) in GRID.items() if ch == channel for c in SELECTED[g]]
            per = [st.mean(s[k] for k in wanted if k in s) for s in seeds.values() if any(k in s for k in wanted)]
            if per:
                values.append([mi, f"paper:{channel}", *mean_sd(per)])

    # training-time channels: trained under the shift, evaluated nominally; +- across the ladder
    arms = Index()
    for r in rows("part2_training_long.csv"):
        if r["in_selection"] != "1":
            continue
        key = r["display"]
        methods.add(key, method_record(key, r["regime"], family_of(key)))
        arms.add((r["channel"], r["arm"]), {"channel": r["channel"], "arm": r["arm"], "label": ARM[r["arm"]]})
    train = defaultdict(lambda: defaultdict(list))        # method -> (channel, arm) -> per-seed nominal scores
    for r in rows("part2_training_long.csv"):
        if r["in_selection"] == "1":
            train[r["display"]][(r["channel"], r["arm"])].append(float(r["score"]))
    for m, byarm in train.items():
        mi = methods(m)
        per_arm = {}
        for (channel, arm), v in byarm.items():
            per_arm.setdefault(channel, []).append(st.mean(v))
        for channel, ladder in per_arm.items():
            values.append([mi, f"paper:{channel}", *mean_sd(ladder)])

    # the semantic shift: the source paper's normalization -- the shifted binding score over
    # the mean nominal score of SAC, a denominator shared across methods -- over the seeds of
    # the paper's figure whose training had not collapsed
    raw = [r for r in rows("part2_semantic_long.csv") if r["seed"] in SEMANTIC_SEEDS]
    den = st.mean(float(r["nominal_hhl"]) for r in raw
                  if r["display"] == "SAC" and float(r["nominal_hhl"]) >= SEMANTIC_COLLAPSE)
    sem = defaultdict(list)
    for r in raw:
        if r["display"] in SEMANTIC_ROWS and float(r["nominal_hhl"]) >= SEMANTIC_COLLAPSE:
            sem[r["display"]].append(100.0 * float(r["shifted_hhr"]) / den)
    for m in SEMANTIC_ROWS:
        if sem[m]:
            mi = methods.add(m, method_record(m, "online", family_of(m)))
            values.append([mi, "paper:theta_z", *mean_sd(sem[m])])

    return {"channels": [{"key": k, "label": l, "kind": kind} for k, l, kind in CHANNELS],
            "grids": grids, "cells": cell_index.records,
            "methods": methods.records, "nominal": nominal,
            "columns": ["method", "view", "mean", "sd", "n"], "rows": values}


# ------------------------------------------------------------------ Part 3
def compound():
    methods, blocks = Index(), Index()
    out = []
    for r in rows("part3_profile_channels.csv"):
        b = blocks.add(r["block"], {"key": r["block"], "label": BLOCK[r["block"]], "note": BLOCK_NOTE[r["block"]],
                                    "task": r["task"], "cells": []})
        key = r["method"]
        m = methods.add(key, method_record(key, "offline" if "offline" in r["block"] else "online", family_of(key)))
        if r["cell"] not in blocks.records[b]["cells"]:
            blocks.records[b]["cells"].append(r["cell"])
        out.append([b, m, r["cell"], r1(r["score_mean"]), r1(r["score_sd"]), int(r["n_seeds"]),
                    r1(r["retention_pct"])])
    for b in blocks.records:
        b["cells"] = [c for c in PCELL_ORDER if c in b["cells"]]
    return {"blocks": blocks.records, "cells": PCELL, "methods": methods.records,
            "columns": ["block", "method", "cell", "score", "sd", "n", "retention"], "rows": out}


def build():
    return {"library": library(), "channels": channels(), "compound": compound()}


def check(doc):
    """The paper's channel scores, recomputed here, against the frozen summary."""
    summary = {r["display"]: r for r in rows("part2_channel_summary.csv")} if (DATA / "part2_channel_summary.csv").exists() else {}
    if not summary:
        return "no summary table to check against"
    ch = doc["channels"]
    worst = 0.0
    for mi, view, mean, sd, n in ch["rows"]:
        if view == "paper:theta_z":       # checked against the paper's figure instead
            name = ch["methods"][mi]["key"]
            ref = PAPER_SEMANTIC[name]
            worst = max(worst, abs(mean - ref[0]), abs(sd - ref[1]))
            continue
        if not view.startswith("paper:"):
            continue
        name = ch["methods"][mi]["key"]
        col = view.split(":")[1] + "_mean"
        if name in summary and summary[name].get(col):
            worst = max(worst, abs(mean - float(summary[name][col])))
    if worst > 0.06:
        sys.exit(f"channel scores differ from the frozen summary by up to {worst:.2f}")
    return f"channel scores agree with the frozen summary (max difference {worst:.2f})"


def main():
    doc = build()
    text = json.dumps(doc, ensure_ascii=False, separators=(",", ":"))
    print(f"library: {len(doc['library']['rows'])} cells, {len(doc['library']['methods'])} methods; "
          f"channels: {len(doc['channels']['rows'])} values, {len(doc['channels']['cells'])} cells, "
          f"{len(doc['channels']['methods'])} methods; compound: {len(doc['compound']['rows'])} values; "
          f"{len(text) / 1024:.0f} kB")
    print(check(doc))
    if len(sys.argv) > 1:
        Path(sys.argv[1]).write_text(text)


if __name__ == "__main__":
    main()
