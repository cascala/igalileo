#!/usr/bin/env bash
# Start the iGalileo kernel from a source checkout (after `sbt stage` there).
# Set IGALILEO_HOME to the checkout, or keep this script inside it.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
home="${IGALILEO_HOME:-$(dirname "$here")}"
exec "$home/target/universal/stage/bin/igalileo" "$@"
