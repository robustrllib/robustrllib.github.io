# RobustRLlib — Project Site (Anonymous)

Static site for the anonymous submission
*RobustRLlib: A Unified Library and Benchmark for Robust Reinforcement Learning Algorithms*.

The site has two parts that share one colour system:

| Part | URL | Source | Build |
|---|---|---|---|
| Landing page | `/` | `index.html`, `assets/` | hand-written; the algorithm book in it is generated |
| Documentation | `/docs/` | `src/` | MkDocs, output committed to `docs/` |

## Structure

```
├── index.html                # landing page; the blocks between the `algo-book`, `algo-table` and `shift-toolbox` markers are GENERATED
├── 404.html                  # BUILT: copy of the documentation's not-found page
├── assets/                   # landing page style, script, two figures, and shifts/ (one drawing per shift source)
├── docs/                     # BUILT documentation. Never edit by hand.
└── src/
    ├── mkdocs.yml            # navigation, Markdown extensions
    ├── requirements.txt
    ├── content/              # Markdown pages
    │   ├── index.md              # documentation home
    │   ├── getting-started/      # overview, quick start
    │   ├── algorithms/
    │   │   ├── index.md          # GENERATED: the algorithm book and the tables of all methods
    │   │   ├── standard/ robust-online/ robust-offline/ robust-safe/
    │   │   │                     # GENERATED: one overview and one page per method
    │   │   ├── run-a-method.md
    │   │   └── add-an-algorithm.md
    │   ├── shifts/
    │   │   ├── index.md          # shift sources and modes
    │   │   ├── sources/          # one page per shift source (six)
    │   │   ├── modes/            # one page per mode (five)
    │   │   └── add-a-backend.md
    │   ├── evaluation/protocol.md
    │   └── assets/               # stylesheets, figures, and the algorithm book
    │                             # (book.css, book.js)
    ├── figures/              # LaTeX sources of the diagrams and formulas
    ├── data/
    │   ├── algorithms.yaml   # one record per algorithm: the single source of truth
    │   ├── shifts.yaml       # the shift toolbox of the landing page: sources, modes, examples
    │   ├── tasks.yaml        # the task-support block of the shift toolbox
    │   ├── references.yaml   # original papers
    │   └── results/          # frozen result tables that every number is computed from
    ├── theme/                # the site's own theme: main.html, 404.html, css/, js/, fonts/
    └── tools/
        ├── gen_algorithms.py # data -> method pages, group overviews, algorithm book
        ├── gen_results.py    # frozen tables -> the JSON behind the charts of the landing page
        ├── sync_landing.py   # data -> algorithm book, table, shift toolbox and results on the landing page
        ├── render_figures.py # LaTeX -> SVG; needs pdflatex, run only when a figure changes
        ├── finalize.py       # makes the built output reproducible
        ├── check_site.py     # pre-publish scan
        ├── make_preview.py   # a copy of the site that opens from disk
        └── build.sh          # generate, sync, build, scan
```

## Theme

The documentation has a theme of its own (`src/theme/`), in the form of the Gymnasium
documentation: a bar across the top, the pages on a grey ground on the left, the text in
the middle, the sections of the current page on the right. The window widths at which the
side columns move behind buttons are in `css/site.css`. The theme loads nothing from outside
the site: system fonts, the icon font and the book's typeface in `theme/fonts/`, and Inter for the
formulas of the landing page in `assets/fonts/` (SIL Open Font License).
The search is MkDocs' own, in a dialog that opens from the field on the left or with Ctrl+K.

## Page form

- Names follow the paper: the six shift sources are Dynamic shift, Observation shift, Action
  shift, Reward/cost shift, Latency shift and Semantic shift; the five modes are Stochastic,
  Adversarial, Parametric, Non-stationary and Composition.
- A topic page has a noun-phrase title, an opening of at most three sentences, a first
  section that is a two-column table, and a closing list of rules. The first section is
  called **Features** on algorithm pages, **Properties** on the pages of shift sources and
  modes, and **Summary** elsewhere. A section is one or two sentences followed by a code
  block or a table.
- No formulas in the text. The definitions of the shift sources are shown in figures that
  LaTeX typesets (`src/figures/`, rendered by `src/tools/render_figures.py`).
- No warning or important callouts: a caveat goes into the running text with its key clause
  in bold.
- The documentation explains how to use the library. It does not discuss results. A method
  page carries two tables of numbers, **Robust performance** and **By task**.

## Algorithm book

The landing page and the page *All Methods* of the documentation hold the same book: one
spread per method, in the order Standard, Robust Online, Robust Offline, Robust Safe. The
left page introduces the method, the right page lists its features and the command that
runs it, and links to the full page.

| To | Use |
|---|---|
| Turn a page | the buttons under the book, a click on the edge of a page, the arrow keys, a swipe |
| Jump to a group | the labels on the edge of the book |
| Link to a method | `/#book-<slug>` or `docs/algorithms/#book-<slug>` |

The book is generated from `src/data/algorithms.yaml` like every other algorithm page, so a
new method appears in both copies without further work. Its style and script
(`src/content/assets/book.css`, `book.js`) rely on neither the landing page nor the theme of
the documentation; the landing page loads them from `docs/assets/`. The column of a page is narrow: commands are
set with the directory of the experiment files in a shell variable. Below 760 px of content
width the book shows one page at a time, and without JavaScript it is a plain list of all
spreads.

## Landing page

The landing page is short on purpose. It opens with the title, one sentence, the drawing
and the numbers of the benchmark. The drawing is an inline SVG in `index.html`: an open
book with a shield on one page and a score that moves under shift on the other, and above
it four scenes a shift comes from. The small mark before the name, a book under four
blocks, is the same drawing reduced; the documentation's theme carries it too.
Then come the abstract with the paper's overview figure, the highlights with the
comparison of benchmarks, the algorithm book and the table of the robust methods, the shift
toolbox, the findings as one line each, a quick start and the BibTeX entry. Explanations
belong to the documentation, and every block of the landing page links to the page that
explains it.

## Result charts

Three charts on the landing page are drawn from the frozen tables in `src/data/results/`
by `assets/results.js` (plain SVG, no library), with the JSON that `gen_results.py` builds
and `sync_landing.py` writes into the page:

| Chart | Section | Data | What the reader chooses |
|---|---|---|---|
| Library-wide results | Findings | `part1_master.csv`, the 220-condition selection | regime, task family, task, shift axis, severity quartile, order |
| Channel leaderboard | Findings | `part2_cells_long*.csv`, `part2_training_long.csv`, `part2_semantic_long.csv` | shift source; the paper's channel score or one of its configurations (the paper's 22 per regime, plus the semantic shift on the door task); regime; standard references |
| Isolated and compound shifts | Findings | `part3_profile_channels.csv` | scenario; score or retention |

Every chart has a table twin (the *Table* button), a tooltip on hover and on keyboard
focus, and a legend. The aggregation is the paper's: conditions within an axis, axes within
a task, tasks with equal weight (Part 1); the five selected cells of a channel, equally
weighted per seed, then mean ± sd across seeds (Part 2). `gen_results.py` recomputes the
paper's channel scores and stops the build if they differ from `part2_channel_summary.csv`.
`part2_cells_long_standard.csv` holds the standard references (IQL, SynthER, MOPO, PPO, SAC)
on the same grids, read from the same evaluation files with the same normalization; the
paper's tables show the robust methods only.

The chart colours are the paper's: each family in the tint the paper's figures use, and the
shift cells of the compound chart in the same pale key. Pale colours are hard to tell apart
for some readers, so every bar also carries its family or cell in text, its value beside it,
a legend, and the table twin; text never wears a data colour.

## Shift toolbox

The toolbox on the landing page is generated from `src/data/shifts.yaml`: six sources, five
modes, and for each pair the mode names the code accepts, a sentence, and an example
`ShiftSpec`. A click on a source shows which modes it offers; a click on a mode shows the
example. Without scripts the page shows the first pair. Each source has a picture
(`example.image`) with a caption; the pictures under `assets/shifts/` are drawings that stand
in for rendered scenes. To replace one, put the rendering next to them (any size; it is shown
at about 400 px wide) and change `image` and `caption` in `shifts.yaml`, then run `build.sh`.

Everything on the page, from the title to the footer, has one width (1040 px with its
padding), on a warm, light ground with hairlines between the parts; every colour and size is
in `assets/style.css`. The colours are warm neutrals with one terracotta accent, shared with
the documentation (`src/theme/css/site.css`) and the book (`src/content/assets/book.css`);
only the emblem keeps its blue.

## Branches

| Branch | Holds | Updated by |
|---|---|---|
| `main` | Everything: landing page, sources, built documentation, tools | Commits |
| `gh-pages` | The built site only, adapted to the address of a project page | A script, as a whole. Never edit it by hand |

## Build

```bash
python -m venv .venv
.venv/bin/pip install -r src/requirements.txt
PY=.venv/bin/python src/tools/build.sh
```

`build.sh` regenerates the algorithm pages, syncs the book of the landing page, builds
`docs/` in strict mode, removes what changes with the clock, and runs the pre-publish scan. It stops at the first failure.

## Preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Common changes

| To | Edit | Then |
|---|---|---|
| Add or change an algorithm | `src/data/algorithms.yaml`, and `nav` in `src/mkdocs.yml` for a new one | `build.sh` |
| Update the numbers | replace the table in `src/data/results/` | `build.sh` |
| Add a topic page | new file under `src/content/`, and `nav` in `src/mkdocs.yml` | `build.sh` |
| Change the landing page | `index.html`, `assets/style.css`; never the generated blocks | `build.sh` |
| Change the shift toolbox | `src/data/shifts.yaml`; a rendering into `assets/shifts/` | `build.sh` |

Numbers are never typed into a page. `gen_algorithms.py` computes them from
`src/data/results/` and refuses to write pages when the headline numbers of the
paper can no longer be reproduced from those tables.

## Anonymity

Everything in this repository is served publicly. Before every push, run

```bash
PY=.venv/bin/python; $PY src/tools/check_site.py
```

and publish only when it reports `clean`. The scan covers identity terms, machine
paths, author metadata in figures and external URLs. The documentation configuration
must not gain a repository link, an edit link, an author or copyright line, analytics,
or any plugin that reads version-control history.

## Motion

Everything animates locally, nothing is fetched: sections come in as they scroll into view (`assets/landing.js`, `.reveal`), the five numbers count up, the algorithm book lies closed until it is in view and then opens (`data-open-on-view`, `book.js`), the loop of the six sources builds up from the agent and then flows (the inline SVG between the `shift-loop` markers of `index.html`; regenerate it with the generator kept outside this repository), and the chart bars grow when drawn. All of it is static under `prefers-reduced-motion: reduce`.
