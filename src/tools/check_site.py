#!/usr/bin/env python
"""Pre-publish check: nothing that will be served may identify the authors.

    python tools/check_site.py            # scans the whole repository

Scans every file that the repository would publish -- the landing page, the built
documentation (including its search index), the sources and all binary assets --
for identity strings, machine-specific paths and external URLs. It also follows
every link from the landing page into the documentation, which the documentation
build cannot see. Exits non-zero on any finding, so it can gate a push.

The names of people, accounts, institutions and projects are NOT in this file: GitHub
Pages serves every file of the repository, so a list of them here would publish exactly
what the scan protects. They are read from a private list outside the repository
(`../site_identity_terms.txt` next to the repository, or the path in
$SITE_IDENTITY_TERMS), one regular expression per line. Without that list the scan
still checks the generic patterns below and says so.
"""
from __future__ import annotations

import os
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
PRIVATE_TERMS = Path(os.environ.get("SITE_IDENTITY_TERMS", REPO.parent / "site_identity_terms.txt"))


def private_terms():
    if not PRIVATE_TERMS.exists():
        print(f"note: no private term list at {PRIVATE_TERMS}; names are not checked", file=sys.stderr)
        return []
    lines = (l.strip() for l in PRIVATE_TERMS.read_text().splitlines())
    return [l for l in lines if l and not l.startswith("#")]


# Matched case-insensitively against text files: generic patterns, plus the private list.
IDENTITY = private_terms() + [
    r"login\d+\.", r"\.cluster\b", r"#SBATCH", r"\bsbatch\b",
    r"wandb\.(ai|me)", r"huggingface\.co", r"drive\.google", r"overleaf",
    r"[a-z0-9._-]+@[a-z0-9-]+\.(edu|com|org|net|cn)\b",
]
# Machine paths; matched against text and binary files alike.
PATHS = [rb"/home/[A-Za-z0-9_]", rb"/scratch/", rb"/weka/", rb"/Users/[A-Za-z0-9_]",
         rb"C:\\Users\\"]
# Author-like metadata inside binary assets.
BINARY_META = [rb"/Author\s*\(", rb"<dc:creator>\s*<rdf:Seq>\s*<rdf:li>(?!Matplotlib|Mozilla/)",
               rb"<xmp:CreatorTool>(?!Matplotlib)[^<]*(Microsoft|PowerPoint|Keynote)",
               rb"<photoshop:AuthorsPosition>", rb"Artist\x00"]

URL = re.compile(r"""(?:https?:)?//[A-Za-z0-9.-]+\.[A-Za-z]{2,}[^\s"'<>)]*""")
# The site itself, and XML namespace identifiers (never fetched).
URL_OK = re.compile(r"^(?:https?:)?//(robust-rllib\.site|www\.w3\.org|w3\.org|www\.sitemaps\.org"
                    r"|schema\.org|anonymous\.4open\.science)(/|$)")

TEXT_EXT = {".html", ".htm", ".css", ".js", ".json", ".md", ".yml", ".yaml", ".txt", ".xml",
            ".csv", ".py", ".sh", ".in", ".svg", ".map", ".tex", ".bib", ".toml", ".cfg", ""}
URL_EXT = {".html", ".htm", ".css", ".js", ".md", ".json", ".xml", ".in", ".svg", ".yml", ".yaml"}
# Third-party bundles: scanned for paths, not for short identity tokens or URLs,
# because minified code contains arbitrary character runs and vendor links. The search
# index is our own text and is scanned like any page.
VENDORED = ("docs/search/lunr", "docs/search/worker.js", "docs/search/main.js", "docs/assets/pygments.css",
            "src/content/assets/pygments.css", "assets/fonts/")
# Image metadata read with Pillow: text chunks, EXIF and XMP fields that name a person or a machine.
IMAGE_EXT = {".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"}
IMAGE_FIELDS = re.compile(r"author|artist|creator|copyright|owner|comment|description|title|software|host|user", re.I)
SKIP_DIRS = {".git", "__pycache__", ".venv", ".venv-site", "node_modules"}
# This file names the generic patterns, so it would flag itself.
SELF = "src/tools/check_site.py"


def files():
    for p in sorted(REPO.rglob("*")):
        if p.is_file() and not (SKIP_DIRS & set(p.relative_to(REPO).parts)):
            yield p


def image_metadata(path, rel, identity):
    """Text chunks, EXIF and XMP of an image, decoded rather than pattern-matched on the bytes."""
    try:
        from PIL import Image
        from PIL.ExifTags import TAGS
    except ImportError:
        return [(rel, "image metadata", "Pillow is not installed; image metadata not checked")]
    out = []
    try:
        with Image.open(path) as im:
            fields = {k: v for k, v in im.info.items() if isinstance(v, (str, bytes))}
            exif = im.getexif()
            for tag, v in exif.items():
                fields[f"exif:{TAGS.get(tag, tag)}"] = v
            try:
                import defusedxml  # noqa: F401  getxmp needs it; raw XMP bytes are in info["xmp"] anyway
                import warnings
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    xmp = im.getxmp() if hasattr(im, "getxmp") else None
                if xmp:
                    fields["xmp"] = str(xmp)
            except ImportError:
                pass
    except Exception as exc:  # noqa: BLE001
        return [(rel, "image metadata", f"unreadable: {type(exc).__name__}")]
    for k, v in fields.items():
        text = v.decode("utf-8", "replace") if isinstance(v, bytes) else str(v)
        if IMAGE_FIELDS.search(str(k)) and text.strip() and not re.fullmatch(r"(Matplotlib|matplotlib|Mozilla/|Lav[cf]\d)[^\n]*", text.strip().rstrip("\x00")):
            out.append((rel, "image metadata", f"{k}={text[:60]}"))
        for m in identity.finditer(text):
            out.append((rel, "identity term", f"{k}: {m.group(0)}"))
    return out


def landing_links():
    """Links from the hand-written landing page into the built documentation."""
    html = (REPO / "index.html").read_text()
    missing = []
    for href in sorted(set(re.findall(r'(?:href|src)="(docs/[^"#]*)', html))):
        target = REPO / href
        if not ((target / "index.html").is_file() or target.is_file()):
            missing.append(("index.html", "broken link", href))
    return missing


def main():
    identity = re.compile("|".join(f"(?:{t})" for t in IDENTITY), re.I)
    paths = re.compile(b"|".join(PATHS))
    meta = re.compile(b"|".join(BINARY_META))
    findings, n = [], 0
    for p in files():
        rel = p.relative_to(REPO).as_posix()
        if rel == SELF:
            continue
        n += 1
        raw = p.read_bytes()
        for m in paths.finditer(raw):
            findings.append((rel, "machine path", raw[m.start():m.start() + 60].decode("latin1")))
        vendored = rel.startswith(VENDORED)
        if p.suffix.lower() in TEXT_EXT and not vendored:
            text = raw.decode("utf-8", errors="replace")
            for i, line in enumerate(text.splitlines(), 1):
                for m in identity.finditer(line):
                    findings.append((f"{rel}:{i}", "identity term", m.group(0)))
                if p.suffix.lower() in URL_EXT:
                    for m in URL.finditer(line):
                        if not URL_OK.match(m.group(0)):
                            findings.append((f"{rel}:{i}", "external URL", m.group(0)[:90]))
        elif p.suffix.lower() not in TEXT_EXT:
            for m in meta.finditer(raw):
                findings.append((rel, "author metadata", raw[m.start():m.start() + 60].decode("latin1")))
            if p.suffix.lower() in IMAGE_EXT:
                findings += image_metadata(p, rel, identity)

    findings += landing_links()
    print(f"scanned {n} files under {REPO.name}/")
    if not findings:
        print("clean: no identity terms, machine paths, author or image metadata, external URLs "
              "or broken landing-page links")
        return 0
    seen = set()
    for where, kind, what in findings:
        if (where, kind, what) not in seen:
            seen.add((where, kind, what))
            print(f"  [{kind}] {where}: {what!r}")
    print(f"{len(seen)} finding(s) -- do not publish")
    return 1


if __name__ == "__main__":
    sys.exit(main())
