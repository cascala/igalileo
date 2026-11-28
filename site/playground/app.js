// Galileo Playground: a REPL and interactive lessons over the WebAssembly engine.
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const PLOTLY_URL = 'vendor/plotly.min.js';
  const EXAMPLES = [
    '1/3 + 2/6',
    'eval(1/3 + 2/6)',
    'diff(sin(x)^2, x)',
    'expand((a + b)^5)',
    'simplify(sin(y)^2 + cos(y)^2)',
    'inv([a b; c d])',
    'plot(sin(x)/x, x, -20, 20)',
    'parametric(cos(3*t), sin(2*t), t, 0, 2*pi)',
    'plot3d(sin(x)*cos(y), x, -pi, pi, y, -pi, pi)',
    'surface((2 + cos(v))*cos(u), (2 + cos(v))*sin(u), sin(v), u, 0, 2*pi, v, 0, 2*pi)',
    'solve(x^2 - x - 1, x)',
    'factor(2^67 - 1)',
  ];

  // ---------- engine ----------
  let worker, nextId = 0;
  const pending = new Map();
  let busy = 0;
  function startWorker() {
    worker = new Worker('worker.js');
    worker.onmessage = ev => {
      const done = pending.get(ev.data.id);
      pending.delete(ev.data.id);
      if (done) done(ev.data);
    };
  }
  startWorker();
  function request(op, code = '', cursor = 0, extra = {}) {
    const id = nextId++;
    setBusy(+1);
    return new Promise(resolve => {
      pending.set(id, r => { setBusy(-1); resolve(r); });
      worker.postMessage({ id, op, code, cursor, ...extra });
    });
  }
  function setBusy(d) {
    busy += d;
    const s = $('status');
    s.textContent = busy ? 'computing…' : 'ready';
    s.className = 'status ' + (busy ? 'busy' : 'ready');
  }
  async function execute(code) {
    const r = await request('execute', code);
    if (r.crash !== undefined) {
      return { outputs: [], error: { ename: 'InternalError', evalue: 'the engine crashed on this input; variables were reset' } };
    }
    const res = JSON.parse(r.reply);
    res.changes = r.changes || [];
    await Files.applyChanges(res.changes);
    return res;
  }
  request('reset'); // warms up the engine and shows "ready"

  // ---------- rendering ----------
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function tex(src, display) {
    try {
      return katex.renderToString(src, { displayMode: display, throwOnError: false, output: 'html' });
    } catch (e) {
      return el('code', '', src).outerHTML;
    }
  }
  // Markdown with $...$ and $$...$$ math; math is set aside so markdown leaves it alone
  function markdown(src, inline) {
    const math = [];
    const keep = s => `@@MATH${math.push(s) - 1}@@`;
    // fenced code blocks (``` on lines of their own) stay blocks
    src = src.replace(/^```[^\n]*\n([\s\S]*?)\n```[ \t]*$/gm, (_, m) => keep({ block: m }));
    src = src.replace(/(`+)([\s\S]*?)\1/g, m => keep({ code: m }));
    src = src.replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => keep({ tex: m, display: true }));
    // inline math may wrap onto the next line, but not across a blank line
    src = src.replace(/\$((?:[^$\n]|\n(?!\s*\n))+?)\$/g, (_, m) => keep({ tex: m, display: false }));
    let html = inline ? marked.parseInline(src) : marked.parse(src);
    html = html.replace(/@@MATH(\d+)@@/g, (_, i) => {
      const m = math[+i];
      if (m.block !== undefined) return '<pre>' + m.block.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</pre>';
      if (m.code) return inline ? marked.parseInline(m.code) : marked.parseInline(m.code);
      return tex(m.tex, m.display);
    });
    return html;
  }

  let plotlyLoading = null;
  function loadPlotly() {
    if (!plotlyLoading) {
      plotlyLoading = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = PLOTLY_URL;
        s.onload = () => resolve(window.Plotly);
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    return plotlyLoading;
  }
  function renderPlot(data, box) {
    const fig = JSON.parse(data['application/vnd.plotly.v1+json']);
    const is3d = (fig.data || []).some(t => /3d|surface|mesh/.test(t.type || ''));
    const wrap = el('div', 'plot' + (is3d ? ' plot-3d' : ''));
    if (data['image/svg+xml']) wrap.innerHTML = data['image/svg+xml'];
    box.appendChild(wrap);
    if (data['image/svg+xml']) box.appendChild(plotDownloads(data['image/svg+xml']));
    loadPlotly().then(Plotly => {
      const div = el('div');
      const layout = Object.assign({}, fig.layout, { autosize: true, margin: Object.assign({ l: 50, r: 20, t: 30, b: 45 }, (fig.layout || {}).margin) });
      delete layout.width;
      layout.height = is3d ? Math.min(520, Math.max(340, wrap.clientWidth * 0.8)) : Math.min(420, Math.max(260, wrap.clientWidth * 0.62));
      // an animation: room for the play button and the slider
      if (fig.frames) layout.height += 100;
      wrap.replaceChildren(div);
      Plotly.newPlot(div, { data: fig.data, layout, frames: fig.frames, config: { responsive: true, displaylogo: false, displayModeBar: innerWidth < 600 ? false : 'hover' } });
    }).catch(() => { /* offline: keep the SVG */ });
  }
  function renderOutputs(res, box) {
    for (const o of res.outputs) {
      if ('text' in o) {
        box.appendChild(el('pre', '', o.text));
        continue;
      }
      const d = o.data;
      if (o.notes) {
        // an explanation, shown apart from the result; switch off with: explain = "off"
        const n = el('div', 'notes');
        n.innerHTML = markdown((d['text/markdown'] || '').replace(/^> ?/gm, ''));
        box.appendChild(n);
        continue;
      }
      if (d['application/vnd.plotly.v1+json']) renderPlot(d, box);
      else if (d['image/svg+xml']) { const w = el('div', 'plot'); w.innerHTML = d['image/svg+xml']; box.appendChild(w); box.appendChild(plotDownloads(d['image/svg+xml'])); }
      else if (d['text/markdown'] || d['text/latex']) { const m = el('div', 'math'); m.innerHTML = markdown(d['text/markdown'] || d['text/latex']); box.appendChild(m); }
      else box.appendChild(el('pre', '', d['text/plain'] || ''));
    }
    for (const c of res.changes || []) {
      if (c.op === 'write' && Files.get(c.path)) box.appendChild(Files.chip(c.path));
    }
    if (res.error) box.appendChild(el('div', 'error', (res.error.ename === 'SyntaxError' ? 'Syntax error: ' : '') + res.error.evalue));
  }

  // ---------- downloads ----------
  const MIME = { csv: 'text/csv', tsv: 'text/tab-separated-values', png: 'image/png', svg: 'image/svg+xml',
    eps: 'application/postscript', tex: 'application/x-tex', gg: 'text/plain', txt: 'text/plain', md: 'text/markdown', json: 'application/json' };
  const extOf = name => (name.match(/\.([^./]+)$/) || [, ''])[1].toLowerCase();
  function download(name, bytes) {
    const blob = new Blob([bytes], { type: MIME[extOf(name)] || 'application/octet-stream' });
    const a = el('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }
  const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  // "Download PNG · SVG · EPS" under a plot
  let plotCount = 0;
  function plotDownloads(svg) {
    const bar = el('div', 'plot-downloads');
    const n = ++plotCount;
    bar.appendChild(el('span', 'muted', 'Download'));
    for (const kind of ['PNG', 'SVG', 'EPS']) {
      const b = el('button', 'link', kind);
      b.type = 'button';
      b.title = `Save this plot as plot-${n}.${kind.toLowerCase()}`;
      b.onclick = async () => {
        const name = `plot-${n}.${kind.toLowerCase()}`;
        if (kind === 'SVG') { download(name, new TextEncoder().encode(svg)); return; }
        const r = await request('export', svg, 0, { kind: kind === 'PNG' ? 0 : 1 });
        if (!r.reply) { toast('This plot could not be converted.'); return; }
        download(name, fromB64(r.reply));
      };
      bar.appendChild(b);
    }
    return bar;
  }


  // ---------- files ----------
  // The user's files: uploaded with +, or written by save(...). They live in this
  // browser (IndexedDB), in one folder, and the engine sees them as /name.
  const Files = (() => {
    const files = new Map(); // name -> { name, data: Uint8Array, modified }
    let kept = true; // false when the browser does not keep data (private window, blocked storage)
    let dbp = null;
    const db = () => dbp || (dbp = new Promise((resolve, reject) => {
      const q = indexedDB.open('galileo-playground', 1);
      q.onupgradeneeded = () => q.result.createObjectStore('files', { keyPath: 'name' });
      q.onsuccess = () => resolve(q.result);
      q.onerror = () => reject(q.error);
    }));
    async function tx(mode, fn) {
      try {
        const d = await db();
        return await new Promise((resolve, reject) => {
          const t = d.transaction('files', mode);
          const r = fn(t.objectStore('files'));
          t.oncomplete = () => resolve(r && r.result);
          t.onerror = () => reject(t.error);
        });
      } catch (e) {
        kept = false;
        render();
        return undefined;
      }
    }
    const nameOf = path => path.replace(/^\/+/, '');
    const size = n => n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB` : `${(n / 1048576).toFixed(1)} MB`;

    async function store(name, data) {
      const rec = { name, data, modified: Date.now() };
      files.set(name, rec);
      await tx('readwrite', s => s.put(rec));
    }
    async function drop(name) {
      files.delete(name);
      await tx('readwrite', s => s.delete(name));
    }
    // a file added by the user: stored and given to the engine
    async function add(name, data) {
      await store(name, data);
      await request('put', '', 0, { path: '/' + name, data });
      render();
    }
    async function remove(name) {
      await drop(name);
      await request('unput', '', 0, { path: '/' + name });
      render();
    }
    // what a run wrote or removed
    async function applyChanges(changes) {
      if (!changes.length) return;
      for (const c of changes) {
        const name = nameOf(c.path);
        if (c.op === 'write') await store(name, fromB64(c.data));
        else await drop(name);
      }
      render();
    }
    // "data (1).csv", "data (2).csv", ... the first name not taken
    function freeName(name) {
      const m = name.match(/^(.*?)(\.[^.]*)?$/);
      for (let k = 1; ; k++) {
        const n = `${m[1]} (${k})${m[2] || ''}`;
        if (!files.has(n)) return n;
      }
    }
    async function upload(list) {
      for (const f of list) {
        let name = f.name.replace(/[\/\\]/g, '_');
        if (files.has(name)) {
          const choice = await ask(`A file named ${name} is already here.`, [
            ['replace', 'Replace'], ['both', 'Keep both'], ['cancel', 'Cancel']]);
          if (choice === 'cancel' || !choice) continue;
          if (choice === 'both') name = freeName(name);
        }
        await add(name, new Uint8Array(await f.arrayBuffer()));
        toast(`Added ${name}. Read it with read("${name}").`);
      }
    }
    async function rename(from, to) {
      to = to.trim().replace(/[\/\\]/g, '_');
      if (!to || to === from) return true;
      if (files.has(to)) { toast(`A file named ${to} is already here.`); return false; }
      const data = files.get(from).data;
      await remove(from);
      await add(to, data);
      return true;
    }

    // ---- the panel ----
    function row(f) {
      const li = el('li');
      const name = el('button', 'file-name', f.name);
      name.type = 'button';
      name.title = 'Put its name in the input';
      name.onclick = () => {
        const call = /\.(csv|tsv|txt|md|json)$/i.test(f.name) ? `d = read("${f.name}")` : /\.gg$/i.test(f.name) ? `load("${f.name}")` : `"${f.name}"`;
        input.value = call;
        autosize(input);
        location.hash = '';
        input.focus();
      };
      const meta = el('span', 'file-meta', size(f.data.length));
      const actions = el('span', 'file-actions');
      const btn = (label, title, fn) => {
        const b = el('button', 'icon', label);
        b.type = 'button';
        b.title = title;
        b.setAttribute('aria-label', title + ' ' + f.name);
        b.onclick = fn;
        actions.appendChild(b);
      };
      btn('⬇', 'Download', () => download(f.name, f.data));
      btn('✎', 'Rename', () => {
        const edit = el('input', 'file-rename');
        edit.value = f.name;
        name.replaceWith(edit);
        edit.focus();
        const dot = f.name.lastIndexOf('.');
        edit.setSelectionRange(0, dot > 0 ? dot : f.name.length);
        let done = false;
        const finish = async keep => {
          if (done) return;
          done = true;
          if (keep && !(await rename(f.name, edit.value))) { done = false; edit.focus(); return; }
          render();
        };
        edit.onkeydown = ev => {
          if (ev.key === 'Enter') { ev.preventDefault(); finish(true); }
          else if (ev.key === 'Escape') finish(false);
        };
        edit.onblur = () => finish(true);
      });
      btn('🗑', 'Delete', async () => {
        if ((await ask(`Delete ${f.name}? This cannot be undone.`, [['delete', 'Delete'], ['cancel', 'Cancel']])) === 'delete') {
          await remove(f.name);
        }
      });
      li.append(name, meta, actions);
      return li;
    }
    function render() {
      const list = $('file-list');
      if (!list) return;
      const all = [...files.values()].sort((a, b) => a.name.localeCompare(b.name));
      list.replaceChildren(...all.map(row));
      $('files-empty').hidden = all.length > 0;
      $('files-clear').hidden = all.length === 0;
      $('files-count').textContent = all.length ? String(all.length) : '';
      $('files-note').textContent = kept
        ? 'Files stay in this browser only: they don’t follow you to another device, and a private window forgets them when it closes.'
        : 'This browser is not keeping files (private window or blocked storage): they last until you close this page.';
    }
    // a line under a result that wrote a file
    function chip(path) {
      const name = nameOf(path);
      const f = files.get(name);
      const c = el('div', 'file-chip');
      c.append(el('span', '', `📄 ${name}`), el('span', 'muted', size(f.data.length)));
      const b = el('button', 'link', 'Download');
      b.type = 'button';
      b.onclick = () => { const g = files.get(name); if (g) download(name, g.data); else toast(`${name} was removed.`); };
      c.appendChild(b);
      return c;
    }
    async function start() {
      let all = [];
      try { all = (await tx('readonly', s => s.getAll())) || []; } catch { all = []; }
      for (const f of all) {
        files.set(f.name, f);
        await request('put', '', 0, { path: '/' + f.name, data: f.data });
      }
      render();
    }
    return { start, upload, applyChanges, chip, render, get: path => files.get(nameOf(path)),
      clear: async () => {
        if ((await ask('Delete all your files? This cannot be undone.', [['delete', 'Delete all'], ['cancel', 'Cancel']])) !== 'delete') return;
        for (const n of [...files.keys()]) await remove(n);
      } };
  })();

  // a small dialog with a choice of buttons; resolves to the chosen key (null for Escape)
  function ask(question, choices) {
    return new Promise(resolve => {
      const back = el('div', 'modal');
      const box = el('div', 'modal-box');
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.appendChild(el('p', '', question));
      const bar = el('div', 'modal-actions');
      const close = key => { back.remove(); document.removeEventListener('keydown', esc); resolve(key); };
      const esc = ev => { if (ev.key === 'Escape') close(null); };
      choices.forEach(([key, label], i) => {
        const b = el('button', i === 0 ? 'primary' : 'ghost', label);
        b.type = 'button';
        b.onclick = () => close(key);
        bar.appendChild(b);
      });
      box.appendChild(bar);
      back.appendChild(box);
      back.onclick = ev => { if (ev.target === back) close(null); };
      document.addEventListener('keydown', esc);
      document.body.appendChild(back);
      bar.firstChild.focus();
    });
  }

  $('files-toggle').onclick = () => {
    const p = $('files');
    p.hidden = !p.hidden;
    $('files-toggle').setAttribute('aria-expanded', String(!p.hidden));
  };
  $('files-close').onclick = () => { $('files').hidden = true; $('files-toggle').setAttribute('aria-expanded', 'false'); };
  $('files-add').onclick = () => $('file-input').click();
  $('file-input').onchange = async ev => { await Files.upload([...ev.target.files]); ev.target.value = ''; };
  $('files-clear').onclick = () => Files.clear();
  // dropping files anywhere on the page adds them
  document.addEventListener('dragover', ev => { if ([...(ev.dataTransfer?.types || [])].includes('Files')) ev.preventDefault(); });
  document.addEventListener('drop', ev => {
    if (!ev.dataTransfer?.files?.length) return;
    ev.preventDefault();
    $('files').hidden = false;
    Files.upload([...ev.dataTransfer.files]);
  });
  const filesReady = Files.start();

  // ---------- results hidden by ";" ----------
  // Statements whose result a trailing ";" hides: [{ name (if an assignment), text }]
  function quietStatements(code) {
    const out = [];
    let depth = 0, cur = '';
    const end = semi => {
      const t = cur.trim();
      if (t && semi) {
        const m = t.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:?=(?!=)/);
        out.push({ name: m ? m[1] : null, text: t });
      }
      cur = '';
    };
    for (const line of code.split('\n')) {
      const l = line.replace(/\/\/.*$/, '');
      for (const ch of l) {
        if (ch === '[' || ch === '(') depth++;
        else if (ch === ']' || ch === ')') depth--;
        if (ch === ';' && depth <= 0) { end(true); continue; }
        cur += ch;
      }
      if (depth <= 0) end(false); else cur += '\n';
    }
    return out;
  }
  function describeType(t) {
    let m = t.match(/^Matrix:(\d+)\(r\),(\d+)\(c\)$/);
    if (m) return m[1] === '1' || m[2] === '1' ? `a list of ${Math.max(+m[1], +m[2])} numbers or expressions` : `a table of ${m[1]} rows × ${m[2]} columns`;
    return { Scalar: 'a number', Expression: 'an expression', Variable: 'a name', Boolean: 'true or false', String: 'text',
      Figure: 'a plot', Figure3D: 'a 3D plot', Discovery: 'a discover result', Check: 'a check result' }[t] || ('a ' + t);
  }
  // A short note under a cell whose results were hidden, so running it visibly did something
  async function quietNote(code, res, box) {
    if (res.error) return;
    const quiet = quietStatements(code);
    if (!quiet.length) return;
    const named = quiet.filter(q => q.name);
    let text;
    if (named.length) {
      const who = await execute('who');
      const types = {};
      for (const o of who.outputs) for (const line of ((o.text ?? o.data?.['text/plain']) || '').split('\n')) {
        const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.+)$/);
        if (m) types[m[1]] = m[2].trim();
      }
      const parts = [...new Set(named.map(q => q.name))].map(n => types[n] ? `${n} (${describeType(types[n])})` : n);
      text = `✓ Defined ${parts.join(', ')}. The ; at the end hides the value; type the name in a cell to see it.`;
    } else {
      text = '✓ Done. The ; at the end hides the result; remove it to see the result.';
    }
    box.appendChild(el('div', 'note', text));
  }

  // ---------- REPL ----------
  const input = $('input');
  const transcript = $('transcript');
  const hist = [];
  let histPos = 0;
  const sessionLog = [];

  function autosize(t) {
    t.style.height = 'auto';
    t.style.height = t.scrollHeight + 2 + 'px';
  }
  input.addEventListener('input', () => { autosize(input); hideCompletions(); });

  async function runRepl(code) {
    code = code.trim();
    if (!code) return;
    $('welcome')?.remove();
    hist.push(code);
    histPos = hist.length;
    sessionLog.push(code);
    const entry = el('div', 'entry');
    const inEl = el('div', 'in', code);
    inEl.title = 'Click to edit again';
    inEl.onclick = () => { input.value = code; autosize(input); input.focus(); };
    const out = el('div', 'out');
    entry.append(inEl, out);
    transcript.appendChild(entry);
    entry.scrollIntoView({ block: 'end' });
    const res = await execute(code);
    renderOutputs(res, out);
    await quietNote(code, res, out);
    entry.scrollIntoView({ block: 'nearest' });
  }

  $('prompt').addEventListener('submit', ev => {
    ev.preventDefault();
    const code = input.value;
    input.value = '';
    autosize(input);
    runRepl(code);
  });
  input.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) {
      ev.preventDefault();
      $('prompt').requestSubmit();
    } else if (ev.key === 'ArrowUp' && !input.value.slice(0, input.selectionStart).includes('\n') && histPos > 0) {
      ev.preventDefault();
      input.value = hist[--histPos];
      autosize(input);
    } else if (ev.key === 'ArrowDown' && !input.value.slice(input.selectionEnd).includes('\n') && histPos < hist.length) {
      ev.preventDefault();
      histPos++;
      input.value = hist[histPos] || '';
      autosize(input);
    } else if (ev.key === 'Tab' && !ev.shiftKey) {
      ev.preventDefault();
      complete();
    } else if (ev.key === 'Escape') {
      hideCompletions();
    }
  });

  function hideCompletions() { $('completions').hidden = true; }
  async function complete() {
    const code = input.value;
    const cursor = [...code.slice(0, input.selectionStart)].length;
    const r = await request('complete', code, cursor);
    if (!r.reply) return;
    const m = JSON.parse(r.reply);
    const chars = [...code];
    const apply = word => {
      input.value = chars.slice(0, m.start).join('') + word + chars.slice(m.end).join('');
      const pos = chars.slice(0, m.start).join('').length + word.length;
      input.setSelectionRange(pos, pos);
      hideCompletions();
      input.focus();
    };
    if (m.matches.length === 1) apply(m.matches[0]);
    else if (m.matches.length > 1) {
      const box = $('completions');
      box.replaceChildren(...m.matches.slice(0, 60).map(w => {
        const b = el('button', 'chip', w);
        b.type = 'button';
        b.onclick = () => apply(w);
        return b;
      }));
      box.hidden = false;
    }
  }

  $('clear').onclick = async () => {
    await request('reset');
    sessionLog.length = 0;
    transcript.replaceChildren(el('p', 'muted', 'Variables cleared.'));
    input.focus();
  };
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { t.hidden = true; }, 2400);
  }
  const b64 = s => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64 = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)));
  $('share').onclick = async () => {
    const entries = sessionLog.length ? sessionLog : [input.value].filter(x => x.trim());
    if (!entries.length) { toast('Run something first, then share it.'); return; }
    const url = location.origin + location.pathname + '?code=' + b64(JSON.stringify(entries));
    try { await navigator.clipboard.writeText(url); toast('Link copied: it replays this session.'); }
    catch { prompt('Copy this link', url); }
  };

  $('examples').append(...EXAMPLES.map(x => {
    const b = el('button', 'chip', x);
    b.type = 'button';
    b.onclick = () => runRepl(x);
    return b;
  }));

  // ---------- lessons ----------
  let lessons = null;
  const lessonsReady = fetch('lessons.json').then(r => r.json()).then(j => { lessons = j; return j; });
  const findLesson = id => {
    for (const g of lessons.groups) {
      const i = g.lessons.findIndex(l => l.id === id);
      if (i >= 0) return { group: g, lesson: g.lessons[i], index: i };
    }
    return null;
  };

  function renderIndex() {
    const box = $('lesson-index');
    box.replaceChildren();
    for (const g of lessons.groups) {
      const sec = el('section', 'group');
      sec.appendChild(el('h2', '', g.title));
      if (g.blurb) { const p = el('p', 'muted'); p.innerHTML = markdown(g.blurb, true); sec.appendChild(p); }
      const cards = el('div', 'cards');
      g.lessons.forEach((l, i) => {
        const a = el('a', 'card');
        a.href = '#lesson/' + l.id;
        a.appendChild(el('small', '', g.lessons.length > 1 ? `Part ${i + 1}` : 'Tour'));
        a.appendChild(el('strong', '', l.title));
        cards.appendChild(a);
      });
      sec.appendChild(cards);
      box.appendChild(sec);
    }
  }

  let current = null; // {lesson, cells: [{code, textarea, out, ran}], ranUpTo}
  function lessonLink(href, lessonId) {
    if (/^[a-z]+:/i.test(href) || href.startsWith('#')) return null;
    const dir = lessonId.includes('/') ? lessonId.slice(0, lessonId.lastIndexOf('/') + 1) : '';
    let path = (dir + href).replace(/[^/]+\/\.\.\//g, '');
    if (/README\.md$/i.test(path) || path === dir) return '#lessons';
    const m = path.match(/^(.*)\.ipynb(#.*)?$/);
    return m ? '#lesson/' + m[1] : null;
  }

  async function openLesson(id) {
    await lessonsReady;
    const found = findLesson(id);
    if (!found) { location.hash = '#lessons'; return; }
    const { group, lesson, index } = found;
    document.title = lesson.title + ' · Galileo';
    $('lesson-group').textContent = '← ' + group.title;
    $('open-lab').href = '../lab/lab/index.html?path=' + encodeURIComponent(lesson.id + '.ipynb');
    await request('reset');
    const body = $('lesson-body');
    body.replaceChildren();
    const hint = el('p', 'hint', 'Cells build on each other, like a notebook: a cell can use variables defined above it. You don\u2019t have to run them in order by hand. Running a cell first runs every earlier cell that hasn\u2019t run yet, and “Run all” runs the whole lesson.');
    current = { lesson, cells: [] };
    for (const c of lesson.cells) {
      if (c.t === 'md') {
        const d = el('div', 'md');
        d.innerHTML = markdown(c.s);
        d.querySelectorAll('a[href]').forEach(a => {
          const to = lessonLink(a.getAttribute('href'), lesson.id);
          if (to) a.setAttribute('href', to);
          else if (/^https?:/.test(a.getAttribute('href'))) { a.target = '_blank'; a.rel = 'noopener'; }
        });
        body.appendChild(d);
      } else {
        const cell = el('div', 'cell');
        const ta = el('textarea');
        ta.rows = 1;
        ta.value = c.s;
        ta.spellcheck = false;
        ta.setAttribute('autocapitalize', 'off');
        ta.setAttribute('aria-label', 'Code cell');
        const bar = el('div', 'cell-bar');
        const label = el('span', '', '');
        const run = el('button', 'primary', 'Run');
        run.type = 'button';
        bar.append(label, run);
        const out = el('div', 'out');
        cell.append(ta, bar, out);
        body.appendChild(cell);
        const entry = { textarea: ta, out, label, ran: false };
        current.cells.push(entry);
        const n = current.cells.length - 1;
        run.onclick = () => runCell(n);
        ta.addEventListener('keydown', ev => {
          if (ev.key === 'Enter' && (ev.shiftKey || ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); runCell(n); }
        });
        ta.addEventListener('input', () => autosize(ta));
        requestAnimationFrame(() => autosize(ta));
      }
    }
    // the hint goes right after the lesson's title and introduction
    const firstCell = body.querySelector('.cell');
    body.insertBefore(hint, firstCell ? firstCell.previousElementSibling || firstCell : null);
    const pager = $('pager');
    pager.replaceChildren();
    const prev = group.lessons[index - 1], next = group.lessons[index + 1];
    if (prev) { const a = el('a', 'button ghost', '← ' + prev.title); a.href = '#lesson/' + prev.id; pager.appendChild(a); }
    else pager.appendChild(el('span'));
    if (next) { const a = el('a', 'button primary', next.title + ' →'); a.href = '#lesson/' + next.id; pager.appendChild(a); }
    window.scrollTo(0, 0);
  }

  // Running a cell first runs the cells above it that have not run yet
  let queue = Promise.resolve();
  function runCell(n) {
    const lesson = current;
    queue = queue.then(async () => {
      for (let i = 0; i <= n; i++) {
        if (current !== lesson) return;
        const c = lesson.cells[i];
        if (i < n && c.ran) continue;
        c.out.replaceChildren();
        c.label.textContent = 'running…';
        const res = await execute(c.textarea.value);
        if (current !== lesson) return;
        renderOutputs(res, c.out);
        await quietNote(c.textarea.value, res, c.out);
        c.ran = true;
        c.label.textContent = res.error ? 'error' : (i < n ? `ran first: cell ${n + 1} builds on it` : '✓ ran');
        if (res.error) return;
      }
    });
    return queue;
  }
  $('run-all').onclick = () => current && runCell(current.cells.length - 1);

  // ---------- routing ----------
  function route() {
    const h = location.hash.slice(1);
    const show = v => {
      for (const id of ['repl', 'lessons', 'lesson']) $(id).hidden = id !== v;
      document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === v || (v === 'lesson' && a.dataset.nav === 'lessons')));
    };
    if (h.startsWith('lesson/')) { show('lesson'); openLesson(decodeURIComponent(h.slice(7))); }
    else if (h === 'lessons') { show('lessons'); document.title = 'Lessons · Galileo'; lessonsReady.then(renderIndex); window.scrollTo(0, 0); }
    else { show('repl'); document.title = 'Galileo Playground'; current = null; input.focus({ preventScroll: true }); }
  }
  window.addEventListener('hashchange', route);
  route();

  const shared = new URLSearchParams(location.search).get('code');
  if (shared) {
    try {
      const entries = JSON.parse(unb64(shared));
      history.replaceState(null, '', location.pathname + location.hash);
      (async () => { await filesReady; for (const e of entries) await runRepl(String(e)); })();
    } catch { /* ignore a broken link */ }
  }
})();
