#!/usr/bin/env python3
"""Execute notebooks in place with a local Galileo engine (no Docker, no Jupyter).

Stores the same outputs the iGalileo kernel would. Needs the `galileo` binary
from galileo-rs on PATH, or GALILEO_BIN pointing at it:

    GALILEO_BIN=../galileo-rs/target/release/galileo python3 examples/src/run.py examples/*/*.ipynb

Exits with status 1 if any cell fails.
"""
import json, os, pathlib, sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "kernel"))
from galileo_kernel.engine import Engine  # noqa: E402


def lines(v):
    # nbformat stores multi-line strings as lists of lines
    out = v.splitlines(keepends=True)
    return out


def mime_data(data):
    # as in galileo_kernel.kernel: JSON MIME types are stored as objects
    return {k: (json.loads(v) if k.endswith("json") else lines(v)) for k, v in data.items()}


def run(path):
    nb = json.loads(path.read_text())
    eng = Engine()
    n, errors = 0, []
    for c in nb["cells"]:
        if c["cell_type"] != "code":
            continue
        n += 1
        src = "".join(c["source"])
        r = eng.request("execute", src)
        outs, texts = [], []

        def flush():
            if texts:
                outs.append({"output_type": "execute_result", "execution_count": n,
                             "data": {"text/plain": lines("\n".join(texts))}, "metadata": {}})
                texts.clear()

        for o in r.get("outputs", []):
            if "text" in o:
                texts.append(o["text"])
            else:
                flush()
                meta = {"galileo": {"notes": True}} if o.get("notes") else {}
                outs.append({"output_type": "display_data", "data": mime_data(o["data"]), "metadata": meta})
        flush()
        if r.get("error"):
            e = r["error"]
            outs.append({"output_type": "error", "ename": e["ename"], "evalue": e["evalue"],
                         "traceback": [f"{e['ename']}: {e['evalue']}"]})
            errors.append(f"{src[:60]!r}: {e['evalue']}")
        c["outputs"], c["execution_count"] = outs, n
    eng.stop()
    path.write_text(json.dumps(nb, indent=1, sort_keys=True, ensure_ascii=False) + "\n")
    return errors


def main(args):
    bad = 0
    for a in args:
        errs = run(pathlib.Path(a))
        print(a, "ok" if not errs else errs)
        bad += len(errs)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main(sys.argv[1:])
