#!/usr/bin/env python
"""Build a self-contained copy of the site that opens from disk, with no server.

    python tools/make_preview.py <output-dir>

The published site uses directory URLs, which need a web server. This builds the
documentation with one file per page, copies the landing page next to it, rewrites
the links between the two to explicit files, and zips the result. Search is not
part of the copy. The
output directory must be outside the repository: nothing in it is published.
"""
from __future__ import annotations

import re
import shutil
import subprocess
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parents[1]
REPO = SRC.parent


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    out = Path(sys.argv[1]).resolve()
    if REPO in out.parents or out == REPO:
        sys.exit("the preview must be written outside the repository")
    site = out / "site"
    shutil.rmtree(site, ignore_errors=True)
    site.mkdir(parents=True)

    cfg = SRC / "_preview.yml"
    # Pages become plain files, so every link works without a server. Search
    # needs one and is left out of the copy.
    cfg.write_text("INHERIT: mkdocs.yml\nuse_directory_urls: false\nplugins: []\n"
                   f"site_dir: {site / 'docs'}\n")
    try:
        subprocess.run([sys.executable, "-m", "mkdocs", "build", "-q", "--strict", "-f", str(cfg)],
                       cwd=SRC, check=True)
    finally:
        cfg.unlink()

    shutil.copy(REPO / "index.html", site / "index.html")
    shutil.copytree(REPO / "assets", site / "assets")

    # landing page -> documentation: directory links become files
    page = site / "index.html"
    html = page.read_text()
    html = re.sub(r'href="docs/((?:[a-z0-9-]+/)*)([a-z0-9-]+)/"',
                  lambda m: f'href="docs/{m.group(1)}{m.group(2)}'
                            + ("/index.html" if (site / "docs" / m.group(1) / m.group(2)).is_dir()
                               else ".html") + '"', html)
    html = html.replace('href="docs/"', 'href="docs/index.html"')
    page.write_text(html)

    # documentation -> landing page: the logo link is root-relative on the site
    for f in (site / "docs").rglob("*.html"):
        up = "../" * len(f.relative_to(site).parts[:-1])
        f.write_text(f.read_text().replace('href="/"', f'href="{up}index.html"'))

    archive = shutil.make_archive(str(out / "robustrllib-site-preview"), "zip", site)
    n = sum(1 for _ in site.rglob("*.html"))
    print(f"{n} pages -> {site}\narchive  -> {archive}")


if __name__ == "__main__":
    main()
