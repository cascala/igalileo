#!/usr/bin/env bash
# Build the static web site: landing page, playground, JupyterLite and the language
# reference (rendered from galileo docs/), into _site/.
#
#   lite/build.sh [path/to/galileo]
#
# Needs Rust (with the wasm32-unknown-unknown target), Node 20+ and Python 3.10+
# with lite/requirements.txt installed. Without a path, galileo is cloned.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/_site"
WORK="$ROOT/lite/.work"
mkdir -p "$WORK"

ENGINE="${1:-}"
if [ -z "$ENGINE" ]; then
  ENGINE="$WORK/galileo"
  if [ -d "$ENGINE/.git" ]; then git -C "$ENGINE" pull -q; else git clone -q --depth 1 https://github.com/cascala/galileo "$ENGINE"; fi
fi

echo "== engine: WebAssembly"
(cd "$ENGINE" && cargo build --release --target wasm32-unknown-unknown --lib)
WASM="$ENGINE/target/wasm32-unknown-unknown/release/galileo_rs.wasm"

echo "== check: every example notebook runs in the WebAssembly engine"
(cd "$ROOT" && node lite/test-notebooks.mjs "$WASM" examples/*.ipynb examples/*/*.ipynb)

echo "== JupyterLite kernel extension"
cp "$WASM" "$ROOT/lite/kernel/src/galileo.wasm"
(cd "$ROOT/lite/kernel" && npm ci --no-audit --no-fund && PATH="$PWD/node_modules/.bin:$PATH" npm run build)

echo "== content"
python3 "$ROOT/lite/prepare.py" "$WORK/contents" "$ROOT/site/playground/lessons.json"
cp "$WASM" "$ROOT/site/playground/galileo.wasm"
# the playground's libraries are served from the site itself (no CDN)
NM="$ROOT/lite/kernel/node_modules"
VENDOR="$ROOT/site/playground/vendor"
rm -rf "$VENDOR" && mkdir -p "$VENDOR/katex"
cp -r "$NM/katex/dist/katex.min.js" "$NM/katex/dist/katex.min.css" "$NM/katex/dist/fonts" "$VENDOR/katex/"
cp "$NM/marked/marked.min.js" "$NM/plotly.js-dist-min/plotly.min.js" "$VENDOR/"
# galileo.js, for people's own pages: the engine and the same libraries next to it
EMBED="$ROOT/site/embed"
cp "$WASM" "$EMBED/galileo.wasm"
rm -rf "$EMBED/vendor" && cp -r "$VENDOR" "$EMBED/vendor"
# pages opened from disk (file://) cannot fetch; they load the engine as a script
python3 -c 'import base64,sys; sys.stdout.write("window.GALILEO_WASM_BASE64=\""+base64.b64encode(open(sys.argv[1],"rb").read()).decode()+"\";\n")' "$WASM" > "$EMBED/galileo.wasm.js"

echo "== site"
rm -rf "$OUT"
cp -r "$ROOT/site" "$OUT"
(cd "$ROOT/lite" && jupyter lite build --no-sourcemaps --lite-dir . --contents "$WORK/contents" \
  --output-dir "$OUT/lab" --FederatedExtensionAddon.extra_labextensions_path=kernel/build/labextensions)
rm -f "$ROOT/lite/.jupyterlite.doit.db"
echo "== language reference, from the engine's docs/"
node "$ROOT/lite/reference.mjs" "$ENGINE" "$OUT"
echo "== galileo-embed.zip, for offline use"
python3 "$ROOT/lite/embed_zip.py" "$OUT/embed"
touch "$OUT/.nojekyll"
du -sh "$OUT"
