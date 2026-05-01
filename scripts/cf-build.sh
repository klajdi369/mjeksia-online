#!/bin/bash
set -e

pnpm exec expo export --platform web

WASM_SRC=$(find dist/assets -name "wa-sqlite*.wasm" | head -1)
if [ -z "$WASM_SRC" ]; then
  echo "ERROR: wa-sqlite WASM not found in dist/assets"
  exit 1
fi
echo "WASM source: $WASM_SRC"

# Original path embedded in the worker by Metro
WASM_ORIGINAL_PATH="/assets/node_modules/expo-sqlite/web/wa-sqlite/$(basename "$WASM_SRC")"

# Safe destination — no node_modules in the URL
WASM_SAFE_PATH="dist/assets/wa-sqlite.wasm"
cp "$WASM_SRC" "$WASM_SAFE_PATH"
echo "Copied WASM to $WASM_SAFE_PATH"

# Also copy next to the worker for Emscripten's scriptDirectory fallback
WORKER_DIR="dist/_expo/static/js/web"
mkdir -p "$WORKER_DIR"
cp "$WASM_SRC" "$WORKER_DIR/wa-sqlite.wasm"
echo "Copied WASM to $WORKER_DIR/wa-sqlite.wasm"

# Patch the worker bundle to use the safe path
for f in $(find dist/_expo -name "worker-*.js"); do
  if grep -q "$WASM_ORIGINAL_PATH" "$f"; then
    sed -i "s|$WASM_ORIGINAL_PATH|/assets/wa-sqlite.wasm|g" "$f"
    echo "Patched $f"
  else
    echo "WARNING: expected WASM path not found in $f"
  fi
done

echo ""
echo "=== WASM files in dist ==="
find dist -name "*.wasm" -print
