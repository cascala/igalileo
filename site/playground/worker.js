// Runs the Galileo engine (Rust compiled to WebAssembly) off the main thread.
// Request {id, op: 'execute' | 'complete' | 'inspect' | 'reset', code, cursor}
// Reply {id, reply} with the engine's JSON, or {id, crash} when the engine trapped.
const encoder = new TextEncoder();
const decoder = new TextDecoder();
let engine = null;

function load() {
  if (!engine) {
    engine = WebAssembly.instantiateStreaming(fetch('galileo.wasm', { cache: 'no-cache' }), {})
      .catch(() => fetch('galileo.wasm', { cache: 'no-cache' }).then(r => r.arrayBuffer()).then(b => WebAssembly.instantiate(b, {})))
      .then(({ instance }) => {
        const e = instance.exports;
        const w = crypto.getRandomValues(new Uint32Array(2));
        e.galileo_seed((BigInt(w[0]) << 32n) | BigInt(w[1]));
        return e;
      });
  }
  return engine;
}

function call(e, op, code, cursor) {
  const bytes = encoder.encode(code);
  const ptr = e.galileo_alloc(bytes.length);
  new Uint8Array(e.memory.buffer, ptr, bytes.length).set(bytes);
  const len = op === 'execute' ? e.galileo_execute(ptr, bytes.length)
    : op === 'complete' ? e.galileo_complete(ptr, bytes.length, cursor)
    : e.galileo_inspect(ptr, bytes.length, cursor);
  return decoder.decode(new Uint8Array(e.memory.buffer, e.galileo_reply_ptr(), len));
}

self.onmessage = async ev => {
  const { id, op, code = '', cursor = 0 } = ev.data;
  try {
    const e = await load();
    if (op === 'reset') { e.galileo_reset(); self.postMessage({ id, reply: '{}' }); return; }
    self.postMessage({ id, reply: call(e, op, code, cursor) });
  } catch (err) {
    engine = null; // a trap leaves the instance unusable; start over next time
    self.postMessage({ id, crash: String(err) });
  }
};
load();
