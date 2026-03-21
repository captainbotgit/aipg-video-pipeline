#!/usr/bin/env bash
# patch-compositor.sh
#
# Marks the GLIBC_2.35 version requirement in the Remotion GNU compositor
# binary as WEAK so glibc's runtime linker skips it on Vercel (AL2023, glibc 2.34).
#
# Background:
#   The compositor binary was compiled on Ubuntu 22.04 (glibc 2.35) and contains
#   a Vernaux entry in .gnu.version_r requiring GLIBC_2.35 from libm.so.6 (for
#   hypot). Vercel's runtime has glibc 2.34 which does not export GLIBC_2.35,
#   causing the binary to refuse to load with "version 'GLIBC_2.35' not found".
#
# Fix:
#   Set vna_flags |= VER_FLG_WEAK (0x2) on the GLIBC_2.35 Vernaux entry.
#   glibc's ld.so (dl-version.c) skips weak version requirements entirely —
#   it only fails on required (non-weak) versions that are missing.
#   The binary continues to call hypot normally via libm; only the version
#   tag check is bypassed.
#
# This runs on Vercel's Linux build machine inside bun run build.
# It is a no-op on macOS / Windows.

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

echo "[patch-compositor] Patching GLIBC_2.35 → VER_FLG_WEAK in $COMPOSITOR ..."

python3 - "$COMPOSITOR" <<'PYEOF'
import sys, struct

filename = sys.argv[1]

with open(filename, 'rb') as f:
    data = bytearray(f.read())

# ELF hash of "GLIBC_2.35" (GNU hash algorithm, little-endian x64 binary)
GLIBC_2_35_HASH_LE = struct.pack('<I', 0x069691b5)

# Vernaux layout (little-endian):
#   vna_hash  (4 bytes) — ELF hash of version string
#   vna_flags (2 bytes) — VER_FLG_WEAK=0x2 makes this requirement optional
#   vna_other (2 bytes) — version index
#   vna_name  (4 bytes) — offset into .dynstr for version string
#   vna_next  (4 bytes) — offset to next Vernaux (0 = last)
VER_FLG_WEAK = 0x2

patched = 0
pos = 0
while True:
    idx = data.find(GLIBC_2_35_HASH_LE, pos)
    if idx == -1:
        break
    flags_off = idx + 4  # vna_flags immediately follows vna_hash
    old_flags = struct.unpack_from('<H', data, flags_off)[0]
    new_flags = old_flags | VER_FLG_WEAK
    struct.pack_into('<H', data, flags_off, new_flags)
    print(f'  offset {idx:#010x}: vna_flags {old_flags:#06x} -> {new_flags:#06x}')
    patched += 1
    pos = idx + 1

if patched == 0:
    print('  GLIBC_2.35 hash not found — binary may already be patched or different.')
    sys.exit(0)

with open(filename, 'wb') as f:
    f.write(data)

print(f'  Patched {patched} Vernaux entry/entries. VER_FLG_WEAK set — runtime linker will skip GLIBC_2.35 check.')
PYEOF

echo "[patch-compositor] Done."
