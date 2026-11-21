import { BaseKernel, IKernel } from '@jupyterlite/kernel';
import { KernelMessage } from '@jupyterlab/services';

type Reply = { id: number; reply?: string; crash?: string };

/**
 * The Galileo kernel: the Rust engine compiled to WebAssembly, in a web worker.
 */
export class GalileoKernel extends BaseKernel {
  private _worker: Worker;
  private _next = 0;
  private _pending = new Map<number, (r: Reply) => void>();

  constructor(options: IKernel.IOptions) {
    super(options);
    this._worker = this._startWorker();
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
        { text: 'Galileo', url: 'https://github.com/cascala/galileo-rs' },
        { text: 'iGalileo', url: 'https://github.com/cascala/igalileo' }
      ]
    };
  }

  async executeRequest(
    content: KernelMessage.IExecuteRequestMsg['content']
  ): Promise<KernelMessage.IExecuteReplyMsg['content']> {
    const r = await this._request('execute', content.code);
    if (r.crash !== undefined) {
      const evalue = 'the engine crashed on this input; variables were reset';
      this.publishExecuteError({ ename: 'InternalError', evalue, traceback: [evalue] });
      return { status: 'error', execution_count: this.executionCount, ename: 'InternalError', evalue, traceback: [] };
    }
    const res = JSON.parse(r.reply!) as {
      outputs: ({ text: string } | { data: Record<string, string> })[];
      error: { ename: string; evalue: string } | null;
    };
    res.outputs.forEach((o, i) => {
      const data: Record<string, any> = 'text' in o ? { 'text/plain': o.text } : { ...o.data };
      const plotly = data['application/vnd.plotly.v1+json'];
      if (typeof plotly === 'string') {
        data['application/vnd.plotly.v1+json'] = JSON.parse(plotly);
      }
      if (i === res.outputs.length - 1 && !res.error) {
        this.publishExecuteResult({ execution_count: this.executionCount, data, metadata: {} });
      } else {
        this.displayData({ data, metadata: {}, transient: {} });
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
