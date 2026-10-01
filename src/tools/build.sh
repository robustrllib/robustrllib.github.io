#!/usr/bin/env bash
# Regenerate the algorithm pages, build the documentation into ../docs, make the
# output reproducible, and scan everything that would be published. Run from anywhere:
#
#     PY=/path/to/env/bin/python src/tools/build.sh
set -euo pipefail
PY=${PY:-python}
# A relative interpreter path is relative to the caller, so resolve it before moving.
case "$PY" in */*) PY="$(cd "$(dirname "$PY")" && pwd)/$(basename "$PY")" ;; esac
cd "$(dirname "$0")/.."

"$PY" tools/gen_algorithms.py
"$PY" tools/sync_landing.py
"$PY" -m mkdocs build --strict --clean
"$PY" tools/finalize.py
"$PY" tools/check_site.py
