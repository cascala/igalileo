#!/usr/bin/env bash
# Start the iGalileo kernel in Docker, for a Jupyter that runs on this machine.
# Jupyter calls this with the path of its connection file (see kernel.json).
set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 CONNECTION_FILE" >&2
    exit 1
fi

IMAGE="${IGALILEO_IMAGE:-cascala/igalileo:latest}"
connection_file="$1"

# Read the five ports from the connection file (python3 is always there when Jupyter is)
ports=$(python3 -c 'import json,sys; c=json.load(open(sys.argv[1])); print(" ".join(str(c[k]) for k in ("shell_port","iopub_port","stdin_port","control_port","hb_port")))' "$connection_file")

publish=()
for port in $ports; do
    publish+=( -p "127.0.0.1:${port}:${port}" )
done

# The kernel listens on 0.0.0.0 inside the container; ports are only published on localhost.
# It runs as your user so it can read the connection file, which Jupyter makes private.
exec docker run --rm -i \
    --user "$(id -u):$(id -g)" \
    -v "${connection_file}:/connection.json:ro" \
    "${publish[@]}" \
    "$IMAGE" kernel /connection.json
