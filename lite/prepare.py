#!/usr/bin/env python3
"""Prepare the web site's content from examples/.

  python3 lite/prepare.py <contents-dir> <lessons.json>

* copies the notebooks to <contents-dir> for JupyterLite, with multi-line output
  data joined into strings (JupyterLite's table of contents expects strings);
* writes the playground's lessons (markdown and code cells) to <lessons.json>.
"""
import json, pathlib, re, shutil, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
EXAMPLES = ROOT / "examples"

GROUPS = [
    ("tours", "Tours", "Two quick tours: the language, and differential geometry with physics.",
     ["galileo-tour", "differential-geometry-tour"]),
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
    title = re.sub(r"^(Differential geometry|General relativity) \d+:\s*", "", title)
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


if __name__ == "__main__":
    copy_contents(sys.argv[1])
    lessons(sys.argv[2])
