"""The Jupyter side of the Galileo kernel."""

import json

from ipykernel.kernelbase import Kernel

from . import __version__
from .engine import Engine, EngineError


def mime_data(data):
    # JSON MIME types (the Plotly figure) are sent as JSON objects, not strings
    return {k: (json.loads(v) if k.endswith("json") else v) for k, v in data.items()}


class GalileoKernel(Kernel):
    implementation = "igalileo"
    implementation_version = __version__
    language = "galileo"
    language_version = __version__
    language_info = {
        "name": "galileo",
        "version": __version__,
        "mimetype": "text/x-galileo",
        "file_extension": ".gg",
        "pygments_lexer": "text",
        "codemirror_mode": "octave",
    }
    banner = f"iGalileo {__version__}: Galileo, a computer algebra system (Rust engine)"
    help_links = [
        {"text": "Galileo", "url": "https://github.com/cascala/galileo"},
        {"text": "iGalileo", "url": "https://github.com/cascala/igalileo"},
    ]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.engine = Engine()

    def _error(self, ename, evalue):
        traceback = [f"{ename}: {evalue}"]
        self.send_response(self.iopub_socket, "error", {"ename": ename, "evalue": evalue, "traceback": traceback})
        return {"status": "error", "execution_count": self.execution_count, "ename": ename, "evalue": evalue,
                "traceback": traceback}

    def do_execute(self, code, silent, store_history=True, user_expressions=None, allow_stdin=False):
        try:
            reply = self.engine.request("execute", code)
        except KeyboardInterrupt:
            self.engine.start()
            return self._error("Interrupted", "the computation was stopped; the session restarted, so variables are cleared")
        except EngineError as e:
            return self._error("EngineError", str(e))
        if not silent:
            texts = []

            def flush():
                if texts:
                    self.send_response(self.iopub_socket, "execute_result", {
                        "execution_count": self.execution_count,
                        "data": {"text/plain": "\n".join(texts)},
                        "metadata": {},
                    })
                    texts.clear()

            for out in reply.get("outputs", []):
                if "text" in out:
                    texts.append(out["text"])
                else:
                    flush()
                    # explanations ("notes") are a block of their own after the result
                    meta = {"galileo": {"notes": True}} if out.get("notes") else {}
                    self.send_response(self.iopub_socket, "display_data",
                                       {"data": mime_data(out["data"]), "metadata": meta, "transient": {}})
            flush()
        err = reply.get("error")
        if err:
            return self._error(err["ename"], err["evalue"])
        return {"status": "ok", "execution_count": self.execution_count, "payload": [], "user_expressions": {}}

    def do_complete(self, code, cursor_pos):
        try:
            r = self.engine.request("complete", code, cursor_pos)
        except EngineError:
            r = {"matches": [], "start": cursor_pos, "end": cursor_pos}
        return {"status": "ok", "matches": r["matches"], "cursor_start": r["start"], "cursor_end": r["end"], "metadata": {}}

    def do_inspect(self, code, cursor_pos, detail_level=0, omit_sections=()):
        try:
            r = self.engine.request("inspect", code, cursor_pos)
        except EngineError:
            r = {"found": False, "data": {}}
        return {"status": "ok", "found": r["found"], "data": r["data"], "metadata": {}}

    def do_is_complete(self, code):
        return {"status": "complete"}

    def do_shutdown(self, restart):
        self.engine.stop()
        return {"status": "ok", "restart": restart}
