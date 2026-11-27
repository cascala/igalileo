/*
 * Galileo in your own web page.
 *
 *   <script src="https://cascala.github.io/igalileo/embed/galileo.js" defer></script>
 *   <pre class="galileo">deriv(sin(x)^2, x)</pre>
 *
 * Every <pre class="galileo"> becomes an editable block with a Run button; results
 * (typeset math, interactive plots, explanations) appear under it. All blocks on a
 * page share one Galileo session, so a later block can use what an earlier one defined.
 *
 *   data-autorun   run the block when the page opens
 *   data-hidden    hide the block; it runs (in page order) before any other block runs
 *   data-readonly  show the code without letting readers edit it
 *
 * Galileo itself runs in the reader's browser (WebAssembly); nothing is sent anywhere.
 * For pages opened from disk (file://), keep this file next to galileo.wasm.js and
 * vendor/, as in galileo-embed.zip.
 *
 * Script use: Galileo.run(code) resolves to the engine's reply
 * ({outputs: [...], error}); Galileo.render(reply, element) shows it.
 */
(function () {
  'use strict';
  if (window.Galileo && window.Galileo.version) return; // included twice
  const script = document.currentScript;
  const base = script ? script.src.replace(/[^/]*([?#].*)?$/, '') : './';

  // ---------- the engine, in a worker ----------
  // The worker is made from this source as a Blob, so the page may live on any site.
  const WORKER = `
    const enc = new TextEncoder(), dec = new TextDecoder();
    let e = null;
    const buf = b => { const p = e.galileo_alloc(b.length); new Uint8Array(e.memory.buffer, p, b.length).set(b); return p; };
    const text = n => dec.decode(new Uint8Array(e.memory.buffer, e.galileo_reply_ptr(), n));
    self.onmessage = async ev => {
      const { id, op, code, wasm } = ev.data;
      try {
        if (op === 'init') {
          const { instance } = await WebAssembly.instantiate(wasm, {});
          e = instance.exports;
          const w = crypto.getRandomValues(new Uint32Array(2));
          e.galileo_seed((BigInt(w[0]) << 32n) | BigInt(w[1]));
          self.postMessage({ id, reply: '{}' });
          return;
        }
        if (op === 'reset') { e.galileo_reset(); self.postMessage({ id, reply: '{}' }); return; }
        const b = enc.encode(code);
        self.postMessage({ id, reply: text(e.galileo_execute(buf(b), b.length)) });
      } catch (err) {
        self.postMessage({ id, crash: String(err) });
      }
    };`;

  let wasmBytes = null;
  function fetchWasm() {
    if (!wasmBytes) {
      const viaScript = () => loadScript(base + 'galileo.wasm.js').then(() => {
        const s = atob(window.GALILEO_WASM_BASE64 || '');
        const b = new Uint8Array(s.length);
        for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
        return b.buffer;
      });
      // file:// pages cannot fetch; a script tag still loads there
      wasmBytes = location.protocol === 'file:' ? viaScript()
        : fetch(base + 'galileo.wasm').then(r => {
          if (!r.ok) throw new Error(r.status);
          return r.arrayBuffer();
        }).catch(viaScript);
    }
    return wasmBytes;
  }

  let worker = null, ready = null, nextId = 1;
  const pending = new Map();
  function startWorker() {
    worker = new Worker(URL.createObjectURL(new Blob([WORKER], { type: 'text/javascript' })));
    worker.onmessage = ev => {
      const p = pending.get(ev.data.id);
      if (!p) return;
      pending.delete(ev.data.id);
      if (ev.data.crash) p.reject(new Error(ev.data.crash));
      else p.resolve(JSON.parse(ev.data.reply || '{}'));
    };
    ready = fetchWasm().then(wasm => send({ op: 'init', wasm }));
    return ready;
  }
  function send(msg) {
    const id = nextId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      worker.postMessage(Object.assign({ id }, msg));
    });
  }
  function engine() {
    return ready || startWorker();
  }
  // a crash or Stop: throw the engine away; the next run starts a fresh one
  function restart() {
    if (worker) worker.terminate();
    for (const p of pending.values()) p.reject(new Error('stopped'));
    pending.clear();
    worker = null;
    ready = null;
    setupDone = null;
  }

  let queue = Promise.resolve();
  function run(code) {
    const job = queue.then(() => engine()).then(() => send({ op: 'execute', code }));
    queue = job.catch(() => {});
    return job;
  }

  // ---------- libraries for math and plots (loaded when first needed) ----------
  const loaded = {};
  function loadScript(src) {
    if (!loaded[src]) {
      loaded[src] = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = () => reject(new Error('could not load ' + src));
        document.head.appendChild(s);
      });
    }
    return loaded[src];
  }
  function loadCss(href) {
    if (loaded[href]) return;
    loaded[href] = true;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    document.head.appendChild(l);
  }
  function mathLibs() {
    loadCss(base + 'vendor/katex/katex.min.css');
    return Promise.all([loadScript(base + 'vendor/katex/katex.min.js'), loadScript(base + 'vendor/marked.min.js')]);
  }

  // ---------- showing results ----------
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  const escape = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function tex(src, display) {
    try {
      return window.katex.renderToString(src, { displayMode: display, throwOnError: false, output: 'html' });
    } catch (e) {
      return '<code>' + escape(src) + '</code>';
    }
  }
  // Markdown with $...$ and $$...$$ math; math is set aside so Markdown leaves it alone
  function markdown(src) {
    const marked = window.marked;
    if (!marked || !window.katex) return '<pre>' + escape(src) + '</pre>';
    const math = [];
    const keep = s => '@@GGMATH' + (math.push(s) - 1) + '@@';
    src = src.replace(/^```[^\n]*\n([\s\S]*?)\n```[ \t]*$/gm, (_, m) => keep({ block: m }));
    src = src.replace(/(`+)([\s\S]*?)\1/g, m => keep({ code: m }));
    src = src.replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => keep({ tex: m, display: true }));
    src = src.replace(/\$((?:[^$\n]|\n(?!\s*\n))+?)\$/g, (_, m) => keep({ tex: m, display: false }));
    return marked.parse(src).replace(/@@GGMATH(\d+)@@/g, (_, i) => {
      const m = math[+i];
      if (m.block !== undefined) return '<pre>' + escape(m.block) + '</pre>';
      if (m.code) return marked.parseInline(m.code);
      return tex(m.tex, m.display);
    });
  }
  function plot(d, box) {
    const fig = JSON.parse(d['application/vnd.plotly.v1+json']);
    const is3d = (fig.data || []).some(t => /3d|surface|mesh/.test(t.type || ''));
    const wrap = el('div', 'gg-plot');
    if (d['image/svg+xml']) wrap.innerHTML = d['image/svg+xml'];
    box.appendChild(wrap);
    loadScript(base + 'vendor/plotly.min.js').then(() => {
      const div = el('div');
      const w = wrap.clientWidth || 600;
      const layout = Object.assign({}, fig.layout, {
        autosize: true,
        margin: Object.assign({ l: 50, r: 20, t: 30, b: 45 }, (fig.layout || {}).margin),
      });
      delete layout.width;
      layout.height = is3d ? Math.min(520, Math.max(340, w * 0.8)) : Math.min(420, Math.max(260, w * 0.62));
      if (fig.frames) layout.height += 100;
      wrap.replaceChildren(div);
      window.Plotly.newPlot(div, { data: fig.data, layout, frames: fig.frames,
        config: { responsive: true, displaylogo: false, displayModeBar: innerWidth < 600 ? false : 'hover' } });
    }).catch(() => { /* no Plotly: the picture stays */ });
  }
  async function render(res, box) {
    const outs = res.outputs || [];
    if (outs.some(o => o.data && (o.data['text/markdown'] || o.data['text/latex']))) {
      await mathLibs().catch(() => {});
    }
    for (const o of outs) {
      if ('text' in o) { box.appendChild(el('pre', 'gg-text', o.text)); continue; }
      const d = o.data || {};
      if (o.notes) {
        const n = el('div', 'gg-notes');
        n.innerHTML = markdown((d['text/markdown'] || d['text/plain'] || '').replace(/^> ?/gm, ''));
        box.appendChild(n);
      } else if (d['application/vnd.plotly.v1+json']) plot(d, box);
      else if (d['image/svg+xml']) { const w = el('div', 'gg-plot'); w.innerHTML = d['image/svg+xml']; box.appendChild(w); }
      else if (d['text/markdown'] || d['text/latex']) {
        const m = el('div', 'gg-math');
        m.innerHTML = markdown(d['text/markdown'] || d['text/latex']);
        box.appendChild(m);
      } else box.appendChild(el('pre', 'gg-text', d['text/plain'] || ''));
    }
    if (res.error) {
      box.appendChild(el('div', 'gg-error', (res.error.ename === 'SyntaxError' ? 'Syntax error: ' : 'Error: ') + res.error.evalue));
    }
  }

  // ---------- blocks ----------
  const CSS = `
.galileo-cell{--gg-bg:#fff;--gg-code:#f6f5f1;--gg-ink:#17202f;--gg-muted:#5d6675;--gg-line:#e2dfd8;--gg-accent:#d9820b;--gg-accent-ink:#fff;--gg-error:#b3261e;--gg-error-bg:#fdecea;
  margin:1em 0;border:1px solid var(--gg-line);border-radius:8px;background:var(--gg-bg);color:var(--gg-ink);overflow:hidden;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:left}
@media (prefers-color-scheme:dark){.galileo-cell:not(.gg-light){--gg-bg:#161e2e;--gg-code:#1d2638;--gg-ink:#e8eaf0;--gg-muted:#9aa3b5;--gg-line:#273149;--gg-accent:#fca311;--gg-accent-ink:#14213d;--gg-error:#ff8a80;--gg-error-bg:#3a1d1d}}
.galileo-cell textarea{display:block;width:100%;box-sizing:border-box;margin:0;border:0;padding:10px 12px;background:var(--gg-code);color:var(--gg-ink);font:14px/1.5 ui-monospace,"SF Mono",Menlo,Consolas,monospace;resize:none;overflow:hidden;outline:none;tab-size:2}
.galileo-cell textarea:focus{box-shadow:inset 0 0 0 2px var(--gg-accent)}
.galileo-cell .gg-bar{display:flex;align-items:center;gap:8px;padding:6px 10px;border-top:1px solid var(--gg-line)}
.galileo-cell button{font:inherit;font-size:14px;border-radius:6px;padding:3px 12px;cursor:pointer;border:1px solid var(--gg-line);background:transparent;color:var(--gg-ink)}
.galileo-cell button.gg-run{background:var(--gg-accent);border-color:var(--gg-accent);color:var(--gg-accent-ink);font-weight:600}
.galileo-cell button:focus-visible{outline:2px solid var(--gg-accent);outline-offset:2px}
.galileo-cell .gg-hint{color:var(--gg-muted);font-size:13px;margin-left:auto}
.galileo-cell .gg-out{padding:0 12px;overflow-x:auto}
.galileo-cell .gg-out:not(:empty){padding:8px 12px 10px;border-top:1px solid var(--gg-line)}
.galileo-cell .gg-text{margin:.2em 0;font:14px/1.45 ui-monospace,"SF Mono",Menlo,Consolas,monospace;white-space:pre-wrap;background:none;border:0;padding:0;color:inherit}
.galileo-cell .gg-math{margin:.3em 0}
.galileo-cell .gg-notes{margin:.4em 0;padding:4px 10px;border-left:3px solid var(--gg-accent);color:var(--gg-muted);font-size:14px}
.galileo-cell .gg-notes p{margin:.3em 0}
.galileo-cell .gg-plot{max-width:100%;margin:.4em 0}
.galileo-cell .gg-plot svg{max-width:100%;height:auto}
.galileo-cell .gg-error{margin:.3em 0;padding:6px 10px;border-radius:6px;background:var(--gg-error-bg);color:var(--gg-error);white-space:pre-wrap}
.galileo-cell .gg-busy{color:var(--gg-muted);font-size:14px}
.galileo-cell.gg-readonly textarea{cursor:default}`;

  const cells = [];
  let setupDone = null;

  // the hidden blocks run first, once per session
  function setup() {
    if (!setupDone) {
      setupDone = (async () => {
        for (const c of cells) if (c.hidden) await runCell(c, true);
      })();
    }
    return setupDone;
  }

  async function runCell(c, isSetup) {
    if (!isSetup) await setup();
    const code = c.code();
    if (!code.trim()) { c.out.replaceChildren(); return; }
    c.out.replaceChildren(el('div', 'gg-busy', ready ? 'Running…' : 'Starting Galileo…'));
    c.setBusy(true);
    try {
      const res = await run(code);
      const box = document.createDocumentFragment();
      const holder = el('div');
      await render(res, holder);
      box.append(...holder.childNodes);
      c.out.replaceChildren(box);
    } catch (e) {
      c.out.replaceChildren(el('div', 'gg-error', e.message === 'stopped' ? 'Stopped.' : 'Galileo stopped unexpectedly (' + e.message + '). Run again to start over.'));
      if (e.message !== 'stopped') restart();
    } finally {
      c.setBusy(false);
    }
  }

  function grow(t) {
    t.style.height = 'auto';
    t.style.height = t.scrollHeight + 'px';
  }

  function makeCell(pre) {
    const code = (pre.textContent || '').replace(/^\n/, '').replace(/\s+$/, '');
    const hidden = pre.hasAttribute('data-hidden');
    const c = { hidden, autorun: pre.hasAttribute('data-autorun') };
    if (hidden) {
      pre.style.display = 'none';
      c.code = () => code;
      c.out = el('div');
      c.setBusy = () => {};
      cells.push(c);
      return;
    }
    const box = el('div', 'galileo-cell');
    if (pre.id) box.id = pre.id;
    const readonly = pre.hasAttribute('data-readonly');
    if (readonly) box.classList.add('gg-readonly');
    const ta = el('textarea');
    ta.value = code;
    ta.spellcheck = false;
    ta.autocapitalize = 'off';
    ta.setAttribute('autocorrect', 'off');
    ta.readOnly = readonly;
    ta.rows = 1;
    ta.setAttribute('aria-label', 'Galileo code');
    const bar = el('div', 'gg-bar');
    const runBtn = el('button', 'gg-run', 'Run');
    runBtn.type = 'button';
    const stopBtn = el('button', '', 'Stop');
    stopBtn.type = 'button';
    stopBtn.hidden = true;
    const resetBtn = el('button', '', 'Reset');
    resetBtn.type = 'button';
    resetBtn.title = 'Put the original code back';
    resetBtn.hidden = true;
    const hint = el('span', 'gg-hint', readonly ? '' : 'Shift+Enter runs');
    bar.append(runBtn, stopBtn, resetBtn, hint);
    const out = el('div', 'gg-out');
    out.setAttribute('aria-live', 'polite');
    box.append(ta, bar, out);
    pre.replaceWith(box);
    Object.assign(c, {
      code: () => ta.value,
      out,
      setBusy(b) { runBtn.disabled = b; stopBtn.hidden = !b; },
    });
    runBtn.onclick = () => runCell(c);
    stopBtn.onclick = () => restart();
    resetBtn.onclick = () => { ta.value = code; resetBtn.hidden = true; grow(ta); };
    ta.addEventListener('input', () => { grow(ta); resetBtn.hidden = ta.value === code; });
    ta.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' && (ev.shiftKey || ev.ctrlKey || ev.metaKey)) {
        ev.preventDefault();
        runCell(c);
      } else if (ev.key === 'Tab' && !ev.shiftKey && !readonly) {
        ev.preventDefault();
        ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end');
        grow(ta);
      }
    });
    cells.push(c);
    requestAnimationFrame(() => grow(ta));
    addEventListener('resize', () => grow(ta));
  }

  function init() {
    if (!document.getElementById('galileo-embed-css')) {
      const st = el('style');
      st.id = 'galileo-embed-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    const found = document.querySelectorAll('pre.galileo, code.galileo:not(pre code)');
    found.forEach(makeCell);
    const auto = cells.filter(c => c.autorun);
    if (auto.length) {
      (async () => { for (const c of auto) await runCell(c); })();
    } else if (cells.length) {
      engine().catch(() => {}); // warm up, so the first Run is quick
    }
  }

  window.Galileo = {
    version: 1,
    run: code => run(code),
    render: (reply, element) => render(reply, element),
    restart,
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
