#!/bin/bash
set -e

pnpm exec expo export --platform web

echo ""
echo "=== WASM files in dist ==="
find dist -name "*.wasm" -print

echo ""
echo "=== WASM URL references inside worker bundles ==="
for f in $(find dist -name "worker-*.js"); do
  echo "Worker: $f"
  # Extract any string containing .wasm from the bundle
  grep -oE '"[^"]{0,200}\.wasm[^"]{0,50}"' "$f" | head -10 || true
  grep -oE "'[^']{0,200}\.wasm[^']{0,50}'" "$f" | head -10 || true
done

WORKER_DIR="dist/_expo/static/js/web"
mkdir -p "$WORKER_DIR"

echo ""
echo "=== Copying WASM to worker directory ==="
while IFS= read -r src; do
  if [ -n "$src" ]; then
    base=$(basename "$src" | sed 's/\.[a-f0-9]\{32\}\.wasm$/.wasm/')
    dest="$WORKER_DIR/$base"
    cp "$src" "$dest"
    echo "Copied: $src -> $dest"
  fi
done < <(find dist/assets -name "*.wasm")

echo ""
echo "=== All WASM files in dist after copy ==="
find dist -name "*.wasm" -print
