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
    # bind to all interfaces inside the container so published ports reach the kernel
    IGALILEO_IP=0.0.0.0 exec /opt/igalileo/bin/igalileo "$@"
    ;;
  *)
    exec "$@"
    ;;
esac
