#!/usr/bin/env python
"""Render the figures that are typeset with LaTeX.

    python tools/render_figures.py

Compiles figures/shift-loop.tex seven times -- once with every shift source in
colour, for the overview, and once per shift source, for its own page -- and one
small document per entry of figures/formulas.yaml. The results are written as
SVG to content/assets/figures/. The text is converted to outlines, so the files
need no font and look the same everywhere. The mathematics is typeset by LaTeX,
as in the paper.

This step needs `pdflatex` with TikZ and is not part of build.sh: the rendered
files are committed, and the step is repeated only when a figure changes.
"""
from __future__ import annotations

import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import pymupdf
import yaml

PX = 96 / 72   # CSS pixels per point
SRC = Path(__file__).resolve().parents[1]
FIG = SRC / "figures"
OUT = SRC / "content" / "assets" / "figures"

# value of \focus -> name of the file
LOOPS = {"all": "shift-loop", "dynamic": "shift-loop-dynamic",
         "observation": "shift-loop-observation", "action": "shift-loop-action",
         "reward": "shift-loop-reward-cost", "latency": "shift-loop-latency",
         "semantic": "shift-loop-semantic"}

FORMULA = r"""\documentclass[border=2pt]{standalone}
\usepackage[T1]{fontenc}
\usepackage{amsmath,amssymb}
\begin{document}
\large $\displaystyle %s$
\end{document}
"""


def compile_tex(tex: str, work: Path, name: str) -> Path:
    (work / f"{name}.tex").write_text(tex)
    run = subprocess.run(["pdflatex", "-interaction=nonstopmode", "-halt-on-error", f"{name}.tex"],
                         cwd=work, capture_output=True, text=True)
    if run.returncode:
        sys.exit(f"pdflatex failed on {name}:\n" + run.stdout[-1500:])
    return work / f"{name}.pdf"


def to_svg(pdf: Path, target: Path) -> tuple[float, float]:
    page = pymupdf.open(pdf)[0]
    svg = page.get_svg_image(text_as_path=True)
    # The converter writes nothing personal. Two things are tidied: a namespace it
    # declares and never uses, and the size, which it gives in points and a browser
    # reads as pixels, a quarter too small.
    svg = svg.replace(' xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"', "", 1)
    w, h = page.rect.width, page.rect.height
    svg, n = re.subn(r'(<svg[^>]*?)\swidth="[^"]*"\sheight="[^"]*"',
                     rf'\1 width="{w * PX:.0f}" height="{h * PX:.0f}"', svg, count=1)
    assert n == 1, "the converter no longer writes a size; set it here"
    target.write_text(svg)
    return w, h


def main():
    if not shutil.which("pdflatex"):
        sys.exit("pdflatex not found; the rendered figures are committed, so this step is optional")
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        loop = (FIG / "shift-loop.tex").read_text()
        switch = r"\newcommand{\focus}{all}"
        assert loop.count(switch) == 1
        for focus, name in LOOPS.items():
            tex = loop.replace(switch, r"\newcommand{\focus}{%s}" % focus)
            w, h = to_svg(compile_tex(tex, work, "loop" + focus), OUT / f"{name}.svg")
            print(f"{name}.svg".ljust(30), f"{w:.0f} x {h:.0f} pt")
        sizes = {}
        for key, item in yaml.safe_load((FIG / "formulas.yaml").read_text()).items():
            name = "f" + re.sub(r"\W", "", key)
            w, h = to_svg(compile_tex(FORMULA % item["tex"], work, name), OUT / f"formula-{key}.svg")
            sizes[key] = [round(w * PX), round(h * PX)]
            print(f"formula-{key}.svg".ljust(30), f"{w:.0f} x {h:.0f} pt")
    (FIG / "formula-sizes.yaml").write_text(
        "# written by tools/render_figures.py: width and height of each formula, in pixels\n"
        + yaml.safe_dump(sizes, sort_keys=True))


if __name__ == "__main__":
    main()
