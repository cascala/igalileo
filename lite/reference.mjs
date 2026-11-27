// Renders the language reference from galileo (docs/language.md and docs/builtins.md)
// into pages of the web site: reference/index.html and reference/commands.html.
//
//   node lite/reference.mjs path/to/galileo path/to/_site
//
// marked comes from the kernel extension's node_modules (lite/kernel: npm ci).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, "kernel", "package.json"));
const { marked } = require("marked");

const [engine, site] = process.argv.slice(2);
if (!engine || !site) {
  console.error("usage: node lite/reference.mjs path/to/galileo path/to/_site");
  process.exit(2);
}

const pages = [
  { src: "docs/language.md", out: "index.html", title: "Galileo language reference" },
  { src: "docs/builtins.md", out: "commands.html", title: "Galileo commands" },
];
const links = { "language.md": "./", "builtins.md": "commands.html" };

const slug = (s) => s.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^\w\- ]+/g, "").trim().replace(/ /g, "-");
// marked 12: renderer methods take positional arguments
const renderer = {
  heading(text, depth) {
    const id = slug(text);
    return `<h${depth} id="${id}"><a class="anchor" href="#${id}">${text}</a></h${depth}>\n`;
  },
  link(href, title, text) {
    const [file, hash] = href.split("#");
    if (links[file] !== undefined) href = links[file] + (hash ? "#" + hash : "");
    const t = title ? ` title="${title}"` : "";
    return `<a href="${href}"${t}>${text}</a>`;
  },
};
marked.use({ renderer, gfm: true });

const css = `
:root {
  --bg: #fbfaf7; --panel: #fff; --ink: #17202f; --muted: #5d6675; --line: #e4e1da;
  --accent: #d9820b; --code-bg: #f3f1ec; color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #0f1522; --panel: #161e2e; --ink: #e8eaf0; --muted: #9aa3b5; --line: #273149;
    --accent: #fca311; --code-bg: #1d2638; color-scheme: dark;
  }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 17px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
a { color: var(--accent); }
.wrap { max-width: 860px; margin: 0 auto; padding: 0 16px; }
header.top { display: flex; align-items: center; gap: 10px; padding: 14px 0; border-bottom: 1px solid var(--line); }
header.top .brand { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 19px; color: var(--ink); text-decoration: none; flex: 1; }
header.top nav a { color: var(--muted); text-decoration: none; margin-left: 14px; }
header.top nav a.here { color: var(--ink); font-weight: 600; }
main { padding: 8px 0 40px; }
h1 { font-size: clamp(28px, 5vw, 40px); line-height: 1.15; margin: 28px 0 12px; }
h2 { font-size: 26px; margin: 36px 0 8px; padding-top: 8px; border-top: 1px solid var(--line); }
h3 { font-size: 19px; margin: 26px 0 6px; }
h1 a.anchor, h2 a.anchor, h3 a.anchor { color: inherit; text-decoration: none; }
code, pre { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
code { background: var(--code-bg); padding: .1em .35em; border-radius: 4px; font-size: .9em; overflow-wrap: anywhere; }
pre { background: var(--code-bg); border-radius: 10px; padding: 12px 14px; overflow-x: auto; font-size: 14px; line-height: 1.5; }
pre code { background: none; padding: 0; font-size: inherit; overflow-wrap: normal; }
table { border-collapse: collapse; width: 100%; display: block; overflow-x: auto; font-size: 15px; }
th, td { border: 1px solid var(--line); padding: 6px 10px; text-align: left; vertical-align: top; }
th { background: var(--panel); }
pre.transcript .prompt { color: var(--muted); user-select: none; }
pre.transcript .in { font-weight: 600; }
@media (max-width: 480px) { header.top nav .hide-sm { display: none; } }
footer { border-top: 1px solid var(--line); color: var(--muted); font-size: 14px; padding: 24px 0 40px; }
`;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

mkdirSync(join(site, "reference"), { recursive: true });
for (const p of pages) {
  const md = readFileSync(join(engine, p.src), "utf8").replace(/^<!--[\s\S]*?-->\s*/gm, "");
  // in transcripts, what you type stands out from what Galileo shows
  const body = marked.parse(md).replace(
    /<pre><code class="language-galileo">([\s\S]*?)<\/code><\/pre>/g,
    (_, code) =>
      '<pre class="transcript"><code>' +
      code.replace(/^((?:galileo&gt;|\.\.\.&gt;) ?)(.*)$/gm, '<span class="prompt">$1</span><span class="in">$2</span>') +
      "</code></pre>"
  );
  const nav = pages
    .map((q) => `<a href="${links[q.src.split("/").pop()]}"${q === p ? ' class="here"' : ""}>${q === pages[0] ? "Language" : "Commands"}</a>`)
    .join("\n      ");
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.title)}: how to write mathematics in Galileo, with examples.">
<link rel="icon" href="../logo.svg" type="image/svg+xml">
<style>${css}</style>
</head>
<body>
<div class="wrap">
  <header class="top">
    <a class="brand" href="../"><img src="../logo.svg" alt="" width="30" height="30">Galileo</a>
    <nav>
      ${nav}
      <a href="../playground/" class="hide-sm">Playground</a>
    </nav>
  </header>
  <main>
${body}
  </main>
  <footer>
    The reference is part of the <a href="https://github.com/cascala/galileo/tree/master/docs">Galileo engine</a>. Apache 2.0.
  </footer>
</div>
</body>
</html>
`;
  writeFileSync(join(site, "reference", p.out), html);
  console.log(`reference/${p.out}: ${html.length} bytes`);
}
