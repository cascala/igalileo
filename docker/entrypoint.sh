#!/bin/sh
# lab (default)      JupyterLab on port 8888, with the Galileo kernel
# notebook           classic Jupyter Notebook on port 8888
# kernel ARGS...     only the kernel, for a Jupyter running on the host (see igalileo/run_docker.sh)
# anything else      run as a command
set -e
case "$1" in
  lab|notebook)
    app="$1"; shift
    exec jupyter "$app" --ip=0.0.0.0 --port=8888 --no-browser \
      --MultiKernelManager.default_kernel_name=galileo "$@"
    ;;
  kernel)
    shift
    # Bind to all interfaces inside the container so published ports reach the kernel.
    # The connection file's "ip" wins over --ip, so rewrite it in a private copy.
    conn=$(mktemp /tmp/connection-XXXXXX.json)
    python -c 'import json,sys; c=json.load(open(sys.argv[1])); c["ip"]="0.0.0.0"; json.dump(c,open(sys.argv[2],"w"))' "$1" "$conn"
    shift
    exec python -m galileo_kernel -f "$conn" "$@"
    ;;
  *)
    exec "$@"
    ;;
esac
