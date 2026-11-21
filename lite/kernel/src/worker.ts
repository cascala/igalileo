// Runs the Galileo engine (Rust compiled to WebAssembly) off the main thread.
// Requests: {id, op: 'execute' | 'complete' | 'inspect', code, cursor}.
// Replies: {id, reply} with the engine's JSON, or {id, crash} when the engine trapped.

type Exports = {
  memory: WebAssembly.Memory;
  galileo_alloc(len: number): number;
  galileo_reply_ptr(): number;
  galileo_reset(): void;
  galileo_seed(seed: bigint): void;
  galileo_execute(ptr: number, len: number): number;
  galileo_complete(ptr: number, len: number, cursor: number): number;
  galileo_inspect(ptr: number, len: number, cursor: number): number;
};

const wasmUrl = new URL('./galileo.wasm', import.meta.url);
const encoder = new TextEncoder();
const decoder = new TextDecoder();
let engine: Promise<Exports> | null = null;

function seed(): bigint {
  const words = crypto.getRandomValues(new Uint32Array(2));
  return (BigInt(words[0]) << 32n) | BigInt(words[1]);
}

function load(): Promise<Exports> {
  if (!engine) {
    engine = fetch(wasmUrl)
      .then(r => r.arrayBuffer())
      .then(b => WebAssembly.instantiate(b, {}))
      .then(({ instance }) => {
        const e = instance.exports as unknown as Exports;
        e.galileo_seed(seed());
        return e;
      });
  }
  return engine;
}

function call(e: Exports, op: string, code: string, cursor: number): string {
  const bytes = encoder.encode(code);
  const ptr = e.galileo_alloc(bytes.length);
  new Uint8Array(e.memory.buffer, ptr, bytes.length).set(bytes);
  const len =
    op === 'execute'
      ? e.galileo_execute(ptr, bytes.length)
      : op === 'complete'
        ? e.galileo_complete(ptr, bytes.length, cursor)
        : e.galileo_inspect(ptr, bytes.length, cursor);
  return decoder.decode(new Uint8Array(e.memory.buffer, e.galileo_reply_ptr(), len));
}

self.onmessage = async (ev: MessageEvent) => {
  const { id, op, code, cursor } = ev.data;
  try {
    const e = await load();
    if (op === 'reset') {
      e.galileo_reset();
      (self as any).postMessage({ id, reply: '{}' });
      return;
    }
    (self as any).postMessage({ id, reply: call(e, op, code ?? '', cursor ?? 0) });
  } catch (err) {
    // a trap leaves the instance unusable: start over on the next request
    engine = null;
    (self as any).postMessage({ id, crash: String(err) });
  }
};
