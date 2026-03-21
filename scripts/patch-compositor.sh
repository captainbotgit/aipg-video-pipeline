#!/usr/bin/env bash
# patch-compositor.sh
#
# Clears the GLIBC_2.35 version requirement for the `hypot` symbol in the
# Remotion GNU compositor binary using patchelf.
#
# Why: Vercel's serverless runtime (Amazon Linux 2023, glibc 2.34) does not
# provide the GLIBC_2.35 symbol version, so the compositor crashes before
# rendering any video. patchelf --clear-symbol-version sets the symbol's
# version index to 0 (unversioned), allowing glibc to satisfy it with
# whatever hypot it provides.
#
# This script runs on Vercel's Linux build machine (via vercel-build in
# package.json). It is a no-op on macOS / Windows.

set -euo pipefail

if [ "$(uname -s)" != "Linux" ]; then
  echo "[patch-compositor] Not Linux — skipping ($(uname -s))."
  exit 0
fi

COMPOSITOR="./node_modules/@remotion/compositor-linux-x64-gnu/remotion"

if [ ! -f "$COMPOSITOR" ]; then
  echo "[patch-compositor] GNU compositor not found at $COMPOSITOR — skipping."
  exit 0
fi

echo "[patch-compositor] Downloading patchelf 0.18.0 (static Linux x64)..."
WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

curl -fsSL \
  "https://github.com/NixOS/patchelf/releases/download/0.18.0/patchelf-0.18.0-x86_64.tar.gz" \
  | tar -xz -C "$WORK_DIR"

PATCHELF="$WORK_DIR/bin/patchelf"
chmod +x "$PATCHELF"

echo "[patch-compositor] Patching: clearing hypot GLIBC_2.35 version requirement..."
"$PATCHELF" --clear-symbol-version hypot "$COMPOSITOR"
chmod +x "$COMPOSITOR"

# Confirm GLIBC_2.35 is gone. objdump might not be available everywhere, so
# we use readelf which is more widely available on minimal build images.
if command -v readelf &>/dev/null; then
  if readelf -V "$COMPOSITOR" 2>/dev/null | grep -q "GLIBC_2.35"; then
    echo "[patch-compositor] WARNING: GLIBC_2.35 still found after patch!"
  else
    echo "[patch-compositor] Verified: GLIBC_2.35 no longer required."
  fi
fi

echo "[patch-compositor] Done."
