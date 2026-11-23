#!/usr/bin/env python3
"""Prepare the web site's content from examples/.

  python3 lite/prepare.py <contents-dir> <lessons.json>

* copies the notebooks to <contents-dir> for JupyterLite, with multi-line output
  data joined into strings (JupyterLite's table of contents expects strings);
* writes the playground's lessons (markdown and code cells) to <lessons.json>.
"""
import html
import json, pathlib, re, shutil, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
EXAMPLES = ROOT / "examples"

GROUPS = [
    ("tours", "Tours", "Two quick tours: the language, and differential geometry with physics.",
     ["galileo-tour", "differential-geometry-tour"]),
    ("foundations", "Foundations",
     "Nine lessons from arithmetic to calculus, differential equations and conic sections. Start here.", None),
    ("linear-algebra", "Linear algebra",
     "Vectors, matrices as transformations, systems of equations, eigenvalues, Fibonacci and Markov chains.", None),
    ("number-theory", "Number theory",
     "Primes, factoring large numbers, algebraic factoring and hunting for identities, modular arithmetic, the cryptography built on them, and a lab that searches for new factoring algorithms.", None),
    ("group-theory", "Group theory",
     "Symmetry, cyclic groups, permutations, card shuffles and Lagrange's theorem.", None),
    ("chaos", "Chaos and fractals",
     "The logistic map, bifurcations, the Lorenz butterfly, the Mandelbrot set and Julia sets.", None),
    ("differential-geometry", "Differential geometry",
     "Seven lessons from curves to the Riemann tensor, drawn in interactive 3D.", None),
    ("general-relativity", "General relativity",
     "Nine lessons from flat spacetime to black holes, gravitational waves and the age of the universe.", None),
    ("discovery", "Discovering physical laws",
     "Four lessons that find Kepler's and Newton's laws in planet data, then the term Einstein added for Mercury.", None),
]


def text(src):
    return "".join(src) if isinstance(src, list) else src


def copy_contents(dest):
    dest = pathlib.Path(dest)
    if dest.exists():
        shutil.rmtree(dest)
    for nb in sorted(EXAMPLES.rglob("*")):
        rel = nb.relative_to(EXAMPLES)
        if rel.parts[0] == "src" or nb.is_dir() or nb.name.startswith("."):
            continue
        out = dest / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        if nb.suffix == ".ipynb":
            d = json.loads(nb.read_text())
            for c in d["cells"]:
                for o in c.get("outputs", []):
                    for k, v in o.get("data", {}).items():
                        if isinstance(v, list) and not k.endswith("json"):
                            o["data"][k] = "".join(v)
            out.write_text(json.dumps(d, ensure_ascii=False))
        else:
            shutil.copy(nb, out)


BAD = re.compile(r"[\x00-\x08\x0b-\x1f\x7f]")


def check_controls():
    """Fail the build on control characters in any notebook: in markdown they
    are a LaTeX backslash lost to a string escape ("\\bmod" -> backspace + "mod")."""
    bad = []
    for nb in sorted(EXAMPLES.rglob("*.ipynb")):
        for i, c in enumerate(json.loads(nb.read_text())["cells"]):
            parts = [text(c["source"])]
            for o in c.get("outputs", []):
                parts += [text(o.get("text", ""))] + [text(v) for k, v in o.get("data", {}).items() if k.startswith("text/")]
            for part in parts:
                m = BAD.search(part)
                if m:
                    bad.append(f"{nb.relative_to(EXAMPLES)} cell {i + 1}: {m.group()!r} near {part[max(0, m.start() - 30):m.end() + 10]!r}")
    if bad:
        sys.exit("control characters in notebooks:\n  " + "\n  ".join(bad))


def lesson(path, lesson_id):
    nb = json.loads(path.read_text())
    cells, title = [], None
    for c in nb["cells"]:
        s = text(c["source"]).strip("\n")
        if not s:
            continue
        if c["cell_type"] == "markdown":
            if title is None:
                m = re.search(r"^#\s+(.+)$", s, re.M)
                if m:
                    title = m.group(1).strip()
            cells.append({"t": "md", "s": s})
        elif c["cell_type"] == "code":
            cells.append({"t": "code", "s": s})
    title = title or lesson_id
    # "Differential geometry 1: Curves" -> "Curves"
    title = re.sub(r"^[A-Z][A-Za-z ]{2,40} \d+:\s*", "", title)
    return {"id": lesson_id, "title": title, "cells": cells}


def lessons(dest):
    groups = []
    for gid, gtitle, blurb, names in GROUPS:
        if names:
            items = [lesson(EXAMPLES / f"{n}.ipynb", n) for n in names]
        else:
            items = [lesson(p, f"{gid}/{p.stem}") for p in sorted((EXAMPLES / gid).glob("*.ipynb"))]
        groups.append({"id": gid, "title": gtitle, "blurb": blurb, "lessons": items})
    pathlib.Path(dest).write_text(json.dumps({"groups": groups}, ensure_ascii=False, separators=(",", ":")))
    landing(groups)


def landing(groups):
    """Writes the learning paths into the landing page, one link per lesson."""
    index = EXAMPLES.parent / "site" / "index.html"
    page = index.read_text()
    start, end = "<!-- paths:start -->", "<!-- paths:end -->"
    if start not in page:
        return
    cards = []
    for g in groups:
        if g["id"] == "tours" or not g["lessons"]:
            continue
        first = g["lessons"][0]["id"]
        items = "".join(f'<li><a href="playground/#lesson/{l["id"]}">{html.escape(l["title"])}</a></li>'
                        for l in g["lessons"])
        cards.append(f'      <div class="card">\n'
                     f'        <h3><a href="playground/#lesson/{first}">{html.escape(g["title"])}</a></h3>\n'
                     f'        <p>{html.escape(g["blurb"])}</p>\n'
                     f'        <ol>{items}</ol>\n'
                     f'      </div>')
    block = start + "\n" + "\n".join(cards) + "\n      " + end
    a, b = page.index(start), page.index(end) + len(end)
    index.write_text(page[:a] + block + page[b:])


if __name__ == "__main__":
    check_controls()
    copy_contents(sys.argv[1])
    lessons(sys.argv[2])
