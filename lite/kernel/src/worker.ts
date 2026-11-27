// Runs the Galileo engine (Rust compiled to WebAssembly) off the main thread.
// Requests: {id, op: 'execute' | 'complete' | 'inspect', code, cursor}, and for files
// {id, op: 'put', path, data} (bytes), {id, op: 'stub', path, code: why it can't be read},
// {id, op: 'mkdir' | 'unput' | 'cd', path}.
// Replies: {id, reply} with the engine's JSON (an execute reply also has `changes`, the
// files the run wrote or removed: [{op: 'write', path, data: base64} | {op: 'remove', path}]),
// or {id, crash} when the engine trapped (the engine then starts over, without files).

type Exports = {
  memory: WebAssembly.Memory;
  galileo_alloc(len: number): number;
  galileo_reply_ptr(): number;
  galileo_reset(): void;
  galileo_seed(seed: bigint): void;
  galileo_execute(ptr: number, len: number): number;
  galileo_complete(ptr: number, len: number, cursor: number): number;
  galileo_inspect(ptr: number, len: number, cursor: number): number;
  galileo_fs_put(p: number, plen: number, d: number, dlen: number): void;
  galileo_fs_stub(p: number, plen: number, w: number, wlen: number): void;
  galileo_fs_mkdir(p: number, plen: number): void;
  galileo_fs_unput(p: number, plen: number): void;
  galileo_fs_cd(p: number, plen: number): number;
  galileo_fs_changes(): number;
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

function buffer(e: Exports, bytes: Uint8Array): number {
  const ptr = e.galileo_alloc(bytes.length);
  new Uint8Array(e.memory.buffer, ptr, bytes.length).set(bytes);
  return ptr;
}

const replyText = (e: Exports, len: number) => decoder.decode(new Uint8Array(e.memory.buffer, e.galileo_reply_ptr(), len));

function fileOp(e: Exports, op: string, path: string, data?: Uint8Array, why?: string): string {
  const p = encoder.encode(path);
  const pp = buffer(e, p);
  if (op === 'put') {
    e.galileo_fs_put(pp, p.length, buffer(e, data!), data!.length);
  } else if (op === 'stub') {
    const w = encoder.encode(why ?? '');
    e.galileo_fs_stub(pp, p.length, buffer(e, w), w.length);
  } else if (op === 'mkdir') {
    e.galileo_fs_mkdir(pp, p.length);
  } else if (op === 'unput') {
    e.galileo_fs_unput(pp, p.length);
  } else {
    return replyText(e, e.galileo_fs_cd(pp, p.length));
  }
  return '';
}

function call(e: Exports, op: string, code: string, cursor: number): string {
  const bytes = encoder.encode(code);
  const ptr = buffer(e, bytes);
  const len =
    op === 'execute'
      ? e.galileo_execute(ptr, bytes.length)
      : op === 'complete'
        ? e.galileo_complete(ptr, bytes.length, cursor)
        : e.galileo_inspect(ptr, bytes.length, cursor);
  return decoder.decode(new Uint8Array(e.memory.buffer, e.galileo_reply_ptr(), len));
}

self.onmessage = async (ev: MessageEvent) => {
  const { id, op, code, cursor, path, data } = ev.data;
  try {
    const e = await load();
    if (op === 'reset') {
      e.galileo_reset();
      (self as any).postMessage({ id, reply: '{}' });
      return;
    }
    if (['put', 'stub', 'mkdir', 'unput', 'cd'].includes(op)) {
      (self as any).postMessage({ id, reply: fileOp(e, op, path, data, code) });
      return;
    }
    const reply = call(e, op, code ?? '', cursor ?? 0);
    const changes = op === 'execute' ? JSON.parse(replyText(e, e.galileo_fs_changes())) : [];
    (self as any).postMessage({ id, reply, changes });
  } catch (err) {
    // a trap leaves the instance unusable: start over on the next request
    engine = null;
    (self as any).postMessage({ id, crash: String(err) });
  }
};
