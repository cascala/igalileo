"""Install the Galileo kernel spec: python -m galileo_kernel.install [--user | --sys-prefix | --prefix DIR]"""

import argparse
import json
import os
import sys
import tempfile

from jupyter_client.kernelspec import KernelSpecManager


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--user", action="store_true", help="install for the current user")
    p.add_argument("--sys-prefix", action="store_true", help="install into sys.prefix (e.g. a virtualenv)")
    p.add_argument("--prefix", help="install under this prefix")
    a = p.parse_args(argv)
    spec = {
        "argv": [sys.executable, "-m", "galileo_kernel", "-f", "{connection_file}"],
        "display_name": "Galileo",
        "language": "galileo",
    }
    with tempfile.TemporaryDirectory() as d:
        with open(os.path.join(d, "kernel.json"), "w") as f:
            json.dump(spec, f, indent=2)
        prefix = sys.prefix if a.sys_prefix else a.prefix
        dest = KernelSpecManager().install_kernel_spec(d, "galileo", user=a.user, prefix=prefix)
    print("installed the Galileo kernel in", dest)


if __name__ == "__main__":
    main()
