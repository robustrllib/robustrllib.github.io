# RobustRLlib — Project Homepage (Anonymous)

Static, dependency-free project page for the anonymous ICLR submission
*RobustRLlib: A Unified Library and Benchmark for Robust Reinforcement Learning Algorithms*.

## Run locally

```bash
cd project-homepage
python3 -m http.server 8000
# open http://localhost:8000
```

Or just open `index.html` in a browser — there is no build step.

## Structure

```
project-homepage/
├── index.html              # the whole page
└── assets/
    ├── style.css           # all styling
    └── figures/            # figures exported from iclr27/Pictures (PNG + PDF)
```

## Anonymity

- No author names, affiliations, emails, repository URLs or lab links.
- `<meta name="robots" content="noindex">` set on the page.
- The Paper / Code / Docs / Dataset buttons are inert placeholders; swap the
  `data-blocked` anchors for the anonymised artifact links when ready.
- BibTeX author field is the literal `Anonymous Authors`.

## Deploying

The directory is fully static; publish it as-is on any host (GitHub Pages,
Cloudflare Pages, Netlify, or an institutional web root). Keep the
`assets/` folder alongside `index.html`.

## Editing content

The page mirrors the paper's structure:

| Section | Source |
|---|---|
| Abstract | `iclr27/Body/A-abstract.tex` |
| Contributions, barriers | `iclr27/Body/B-introduction.tex` |
| Library table, benchmark comparison | `iclr27/Body/C-Robustlib.tex`, `iclr27/Tables/*.tex` |
| Shift channels, modes, L1–L3 scenarios | `iclr27/Body/D-Disruptor.tex` |
| Results, findings, advanced tasks | `iclr27/Body/F-evaluation.tex` |
| Task and dataset inventory | `iclr27/Appendix/Task.tex` |

To refresh a figure: convert the PDF in `iclr27/Pictures/` to PNG, e.g.
`sips -s format png --out assets/figures/name.png name.pdf` (macOS).
