#!/bin/bash
# Execute notebooks in place with the iGalileo Docker image, so results and plots are stored in them.
# Usage: examples/src/execute.sh examples/differential-geometry/*.ipynb
set -e
IMAGE=${IGALILEO_IMAGE:-cascala/igalileo:latest}
for nb in "$@"; do
  dir=$(cd "$(dirname "$nb")" && pwd); name=$(basename "$nb")
  echo "executing $nb"
  docker run --rm -u "$(id -u):$(id -g)" -v "$dir":/work -w /work --entrypoint jupyter "$IMAGE" \
    nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=900 "$name"
done
