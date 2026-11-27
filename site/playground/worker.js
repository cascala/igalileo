// Runs the Galileo engine (Rust compiled to WebAssembly) off the main thread.
// Request {id, op, code, cursor, path, data, kind}:
//   'execute' | 'complete' | 'inspect' | 'reset'  run code
//   'put' {path, data}   give the engine a file (an upload); 'unput' {path} takes it away
//   'export' {code: svg, kind: 0 for PNG, 1 for EPS}  a plot as a file (base64)
// Reply {id, reply} with the engine's JSON (an 'execute' reply also has `changes`:
// the files the code wrote or removed), or {id, crash} when the engine trapped.
const encoder = new TextEncoder();
const decoder = new TextDecoder();
let engine = null;
// the user's files, kept here too, so a restarted engine gets them back
const files = new Map();

function load() {
  if (!engine) {
    engine = WebAssembly.instantiateStreaming(fetch('galileo.wasm', { cache: 'no-cache' }), {})
      .catch(() => fetch('galileo.wasm', { cache: 'no-cache' }).then(r => r.arrayBuffer()).then(b => WebAssembly.instantiate(b, {})))
      .then(({ instance }) => {
        const e = instance.exports;
        const w = crypto.getRandomValues(new Uint32Array(2));
        e.galileo_seed((BigInt(w[0]) << 32n) | BigInt(w[1]));
        for (const [path, data] of files) put(e, path, data);
        return e;
      });
  }
  return engine;
}

function buffer(e, bytes) {
  const ptr = e.galileo_alloc(bytes.length);
  new Uint8Array(e.memory.buffer, ptr, bytes.length).set(bytes);
  return ptr;
}
const text = (e, len) => decoder.decode(new Uint8Array(e.memory.buffer, e.galileo_reply_ptr(), len));

function put(e, path, data) {
  const p = encoder.encode(path);
  const pp = buffer(e, p);
  const dp = buffer(e, data);
  e.galileo_fs_put(pp, p.length, dp, data.length);
}

function call(e, op, code, cursor) {
  const bytes = encoder.encode(code);
  const ptr = buffer(e, bytes);
  const len = op === 'execute' ? e.galileo_execute(ptr, bytes.length)
    : op === 'complete' ? e.galileo_complete(ptr, bytes.length, cursor)
    : e.galileo_inspect(ptr, bytes.length, cursor);
  return text(e, len);
}

// what the last run wrote or removed: [{op, path, data (base64)}]
function changes(e) {
  const list = JSON.parse(text(e, e.galileo_fs_changes()));
  for (const c of list) {
    if (c.op === 'write') files.set(c.path, Uint8Array.from(atob(c.data), ch => ch.charCodeAt(0)));
    else files.delete(c.path);
  }
  return list;
}

self.onmessage = async ev => {
  const { id, op, code = '', cursor = 0, path, data, kind } = ev.data;
  try {
    const e = await load();
    if (op === 'reset') { e.galileo_reset(); self.postMessage({ id, reply: '{}' }); return; }
    if (op === 'put') {
      files.set(path, data);
      put(e, path, data);
      self.postMessage({ id, reply: '' });
      return;
    }
    if (op === 'unput') {
      files.delete(path);
      const p = encoder.encode(path);
      e.galileo_fs_unput(buffer(e, p), p.length);
      self.postMessage({ id, reply: '' });
      return;
    }
    if (op === 'export') {
      const s = encoder.encode(code);
      self.postMessage({ id, reply: text(e, e.galileo_export(buffer(e, s), s.length, kind)) });
      return;
    }
    const reply = call(e, op, code, cursor);
    self.postMessage({ id, reply, changes: op === 'execute' ? changes(e) : [] });
  } catch (err) {
    engine = null; // a trap leaves the instance unusable; start over next time
    self.postMessage({ id, crash: String(err) });
  }
};
load();
