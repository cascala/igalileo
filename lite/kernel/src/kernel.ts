import { BaseKernel, IKernel } from '@jupyterlite/kernel';
import { Contents, KernelMessage } from '@jupyterlab/services';

type Change = { op: 'write'; path: string; data: string } | { op: 'remove'; path: string };
type Reply = { id: number; reply?: string; crash?: string; changes?: Change[] };

// files written as text in the file browser (others as binary, base64)
const TEXT = /\.(csv|tsv|txt|md|gg|tex|svg|eps|json|py|m|r)$/i;
const fromB64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const toB64 = (b: Uint8Array) => {
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
};

/**
 * The Galileo kernel: the Rust engine compiled to WebAssembly, in a web worker.
 */
export class GalileoKernel extends BaseKernel {
  private _worker: Worker;
  private _next = 0;
  private _pending = new Map<number, (r: Reply) => void>();
  private _contents: Contents.IManager | null;
  // what the engine has of the file browser's files: path -> last modified ('dir', 'stub' otherwise)
  private _known = new Map<string, string>();
  private _dirty = true;
  private _started = false;

  constructor(options: IKernel.IOptions, contents?: Contents.IManager) {
    super(options);
    this._contents = contents ?? null;
    this._contents?.fileChanged.connect(this._onFileChanged, this);
    this._worker = this._startWorker();
  }

  private _onFileChanged(): void {
    this._dirty = true;
  }

  /**
   * Give the engine the file browser's files, so read, load and ls see them. Only files
   * that changed are fetched again; notebooks are listed but not handed over.
   */
  private async _sync(): Promise<void> {
    const contents = this._contents;
    if (!contents || !this._dirty) return;
    this._dirty = false;
    const seen = new Set<string>();
    const walk = async (dir: string): Promise<void> => {
      const model = await contents.get(dir, { content: true });
      for (const item of (model.content ?? []) as Contents.IModel[]) {
        const p = item.path;
        seen.add(p);
        const had = this._known.get(p);
        if (item.type === 'directory') {
          if (had !== 'dir') {
            await this._file('mkdir', p);
            this._known.set(p, 'dir');
          }
          await walk(p);
        } else if (item.type === 'notebook') {
          if (had !== 'stub') {
            await this._file('stub', p, undefined, 'a notebook cannot be read from Galileo');
            this._known.set(p, 'stub');
          }
        } else if (had !== item.last_modified) {
          try {
            const f = await contents.get(p, { content: true, type: 'file' });
            const data = f.format === 'base64'
              ? fromB64(String(f.content ?? ''))
              : new TextEncoder().encode(typeof f.content === 'string' ? f.content : JSON.stringify(f.content));
            await this._file('put', p, data);
          } catch {
            await this._file('stub', p, undefined, 'this file could not be read from the file browser');
          }
          this._known.set(p, item.last_modified);
        }
      }
    };
    try {
      await walk('');
    } catch {
      return;
    }
    for (const p of [...this._known.keys()]) {
      if (!seen.has(p)) {
        await this._file('unput', p);
        this._known.delete(p);
      }
    }
    if (!this._started) {
      this._started = true;
      // start in the notebook's folder
      if (this.location) await this._file('cd', this.location);
    }
  }

  /** Store what the engine wrote or removed in the file browser */
  private async _store(changes: Change[]): Promise<void> {
    const contents = this._contents;
    if (!contents) return;
    for (const c of changes) {
      const path = c.path.replace(/^\/+/, '');
      try {
        if (c.op === 'remove') {
          await contents.delete(path);
          this._known.delete(path);
          continue;
        }
        const bytes = fromB64(c.data);
        let model: Partial<Contents.IModel>;
        const text = TEXT.test(path) ? new TextDecoder('utf-8', { fatal: true }) : null;
        try {
          model = text ? { type: 'file', format: 'text', content: text.decode(bytes) } : { type: 'file', format: 'base64', content: toB64(bytes) };
        } catch {
          model = { type: 'file', format: 'base64', content: toB64(bytes) };
        }
        const saved = await contents.save(path, model);
        this._known.set(path, saved.last_modified);
      } catch (err) {
        console.warn('Galileo: could not store', path, err);
      }
    }
  }

  private async _file(op: string, path: string, data?: Uint8Array, why?: string): Promise<Reply> {
    const id = this._next++;
    return new Promise(resolve => {
      this._pending.set(id, resolve);
      this._worker.postMessage({ id, op, path: '/' + path.replace(/^\/+/, ''), data, code: why });
    });
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._worker.terminate();
    super.dispose();
  }

  private _startWorker(): Worker {
    const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (ev: MessageEvent<Reply>) => {
      const done = this._pending.get(ev.data.id);
      this._pending.delete(ev.data.id);
      done?.(ev.data);
    };
    return worker;
  }

  private _request(op: string, code = '', cursor = 0): Promise<Reply> {
    const id = this._next++;
    return new Promise(resolve => {
      this._pending.set(id, resolve);
      this._worker.postMessage({ id, op, code, cursor });
    });
  }

  async kernelInfoRequest(): Promise<KernelMessage.IInfoReplyMsg['content']> {
    return {
      status: 'ok',
      protocol_version: '5.3',
      implementation: 'galileo',
      implementation_version: '0.3.0',
      language_info: {
        name: 'galileo',
        version: '0.3.0',
        mimetype: 'text/x-galileo',
        file_extension: '.gg',
        codemirror_mode: 'octave',
        pygments_lexer: 'text',
        nbconvert_exporter: 'script'
      },
      banner: 'Galileo: computer algebra in your browser (Rust, WebAssembly)',
      help_links: [
        { text: 'Galileo', url: 'https://github.com/cascala/galileo' },
        { text: 'iGalileo', url: 'https://github.com/cascala/igalileo' }
      ]
    };
  }

  async executeRequest(
    content: KernelMessage.IExecuteRequestMsg['content']
  ): Promise<KernelMessage.IExecuteReplyMsg['content']> {
    await this._sync();
    const r = await this._request('execute', content.code);
    await this._store(r.changes ?? []);
    if (r.crash !== undefined) {
      // the engine starts over without files: hand them over again next time
      this._known.clear();
      this._dirty = true;
      this._started = false;
      const evalue = 'the engine crashed on this input; variables were reset';
      this.publishExecuteError({ ename: 'InternalError', evalue, traceback: [evalue] });
      return { status: 'error', execution_count: this.executionCount, ename: 'InternalError', evalue, traceback: [] };
    }
    const res = JSON.parse(r.reply!) as {
      outputs: ({ text: string } | { data: Record<string, string>; notes?: boolean })[];
      error: { ename: string; evalue: string } | null;
    };
    // the result is the last output that is not an explanation (notes come after it)
    let last = -1;
    res.outputs.forEach((o, i) => {
      if (!('notes' in o && o.notes)) last = i;
    });
    res.outputs.forEach((o, i) => {
      const notes = 'notes' in o && o.notes;
      const data: Record<string, any> = 'text' in o ? { 'text/plain': o.text } : { ...o.data };
      const plotly = data['application/vnd.plotly.v1+json'];
      if (typeof plotly === 'string') {
        data['application/vnd.plotly.v1+json'] = JSON.parse(plotly);
      }
      if (i === last && !res.error) {
        this.publishExecuteResult({ execution_count: this.executionCount, data, metadata: {} });
      } else {
        this.displayData({ data, metadata: notes ? { galileo: { notes: true } } : {}, transient: {} });
      }
    });
    if (res.error) {
      const { ename, evalue } = res.error;
      this.publishExecuteError({ ename, evalue, traceback: [`${ename}: ${evalue}`] });
      return { status: 'error', execution_count: this.executionCount, ename, evalue, traceback: [] };
    }
    return { status: 'ok', execution_count: this.executionCount, user_expressions: {} };
  }

  async completeRequest(
    content: KernelMessage.ICompleteRequestMsg['content']
  ): Promise<KernelMessage.ICompleteReplyMsg['content']> {
    const r = await this._request('complete', content.code, content.cursor_pos);
    const m = r.reply ? JSON.parse(r.reply) : { matches: [], start: content.cursor_pos, end: content.cursor_pos };
    return { status: 'ok', matches: m.matches, cursor_start: m.start, cursor_end: m.end, metadata: {} };
  }

  async inspectRequest(
    content: KernelMessage.IInspectRequestMsg['content']
  ): Promise<KernelMessage.IInspectReplyMsg['content']> {
    const r = await this._request('inspect', content.code, content.cursor_pos);
    const m = r.reply ? JSON.parse(r.reply) : { found: false, data: {} };
    return { status: 'ok', found: m.found, data: m.data, metadata: {} };
  }

  async isCompleteRequest(
    content: KernelMessage.IIsCompleteRequestMsg['content']
  ): Promise<KernelMessage.IIsCompleteReplyMsg['content']> {
    return { status: 'complete' };
  }

  async commInfoRequest(
    content: KernelMessage.ICommInfoRequestMsg['content']
  ): Promise<KernelMessage.ICommInfoReplyMsg['content']> {
    return { status: 'ok', comms: {} };
  }

  inputReply(content: KernelMessage.IInputReplyMsg['content']): void {}
  async commOpen(msg: KernelMessage.ICommOpenMsg): Promise<void> {}
  async commMsg(msg: KernelMessage.ICommMsgMsg): Promise<void> {}
  async commClose(msg: KernelMessage.ICommCloseMsg): Promise<void> {}
}
