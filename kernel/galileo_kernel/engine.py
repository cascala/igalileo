"""The Galileo engine process: `galileo --kernel`, spoken to over stdin/stdout.

Requests are a header line and a body (`execute <n>`, `complete <cursor> <n>`,
`inspect <cursor> <n>`, where n is the body length in bytes). Each reply is one
line of JSON.
"""

import json
import os
import shutil
import subprocess


class EngineError(Exception):
    pass


def find_binary():
    path = os.environ.get("GALILEO_BIN") or shutil.which("galileo")
    if not path:
        raise EngineError("the galileo executable was not found; install galileo-rs or set GALILEO_BIN")
    return path


class Engine:
    def __init__(self):
        self.proc = None
        self.start()

    def start(self):
        self.stop()
        # a session of its own, so an interrupt (SIGINT to the kernel's process
        # group) does not kill the engine behind the kernel's back
        self.proc = subprocess.Popen(
            [find_binary(), "--kernel"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            start_new_session=True,
        )

    def stop(self):
        if self.proc is not None:
            try:
                self.proc.kill()
                self.proc.wait(timeout=5)
            except Exception:
                pass
            self.proc = None

    def request(self, op, code, cursor=None):
        body = code.encode("utf-8")
        head = op if cursor is None else f"{op} {cursor}"
        try:
            self.proc.stdin.write(f"{head} {len(body)}\n".encode() + body)
            self.proc.stdin.flush()
            line = self.proc.stdout.readline()
        except (BrokenPipeError, OSError):
            line = b""
        if not line:
            self.start()
            raise EngineError("the Galileo engine stopped unexpectedly and was restarted, so variables are cleared")
        return json.loads(line)
