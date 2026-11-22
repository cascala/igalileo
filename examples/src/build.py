#!/usr/bin/env python3
"""Build the learning-path notebooks from their plain-text sources.

Each source file (*.gnb) holds cells separated by lines that are exactly
'%md' or '%code'. Run:  python3 examples/src/build.py
The notebooks are written without outputs; execute them in JupyterLab (or with
jupyter nbconvert --execute) to fill them in.
"""
import json, pathlib, re, sys

HERE = pathlib.Path(__file__).resolve().parent
EXAMPLES = HERE.parent
META = {
    "kernelspec": {"display_name": "Galileo", "language": "galileo", "name": "galileo"},
    "language_info": {"codemirror_mode": "octave", "file_extension": ".gg", "mimetype": "text/x-galileo",
                      "name": "galileo", "pygments_lexer": "text"},
}

# control characters (other than tab and newline) in a source are almost always
# a LaTeX backslash eaten by a string escape: "\bmod" written as backspace + "mod"
BAD = re.compile(r"[\x00-\x08\x0b-\x1f\x7f]")

def check(src, text):
    for n, line in enumerate(text.split("\n"), 1):
        m = BAD.search(line)
        if m:
            sys.exit(f"{src}:{n}: control character {m.group()!r} (a backslash lost to a string escape?): {line!r}")

def cells(text):
    out, kind, buf = [], None, []
    def flush():
        if kind is not None:
            src = "\n".join(buf).strip("\n")
            if src:
                lines = src.split("\n")
                source = [l + "\n" for l in lines[:-1]] + [lines[-1]]
                c = {"cell_type": "markdown" if kind == "md" else "code", "metadata": {}, "source": source}
                if kind == "code":
                    c.update(execution_count=None, outputs=[])
                out.append(c)
    for line in text.split("\n"):
        if line.strip() in ("%md", "%code"):
            flush(); kind, buf = line.strip()[1:], []
        else:
            buf.append(line)
    flush()
    return out

def main(args):
    srcs = [pathlib.Path(a) for a in args] or sorted(HERE.glob("*/*.gnb"))
    for src in srcs:
        text = src.read_text()
        check(src, text)
        nb = {"cells": cells(text), "metadata": META, "nbformat": 4, "nbformat_minor": 4}
        dest = EXAMPLES / src.parent.name / (src.stem + ".ipynb")
        dest.parent.mkdir(exist_ok=True)
        dest.write_text(json.dumps(nb, indent=1, ensure_ascii=False) + "\n")
        print(dest.relative_to(EXAMPLES.parent))

if __name__ == "__main__":
    main(sys.argv[1:])
