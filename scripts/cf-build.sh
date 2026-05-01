#!/bin/bash
set -e

pnpm exec expo export --platform web

# The wa-sqlite worker resolves the WASM URL relative to its own script location
# (_expo/static/js/web/), so we need the WASM there under its original name.
WORKER_DIR="dist/_expo/static/js/web"
mkdir -p "$WORKER_DIR"
 
find dist/assets -name "wa-sqlite*.wasm" | while read -r src; do
  # Strip the content hash: wa-sqlite.abc123.wasm -> wa-sqlite.wasm
  base=$(basename "$src" | sed 's/\.[a-f0-9]\{32\}\.wasm$/.wasm/')
  dest="$WORKER_DIR/$base"
  cp "$src" "$dest"
  echo "Copied $src -> $dest"
done
