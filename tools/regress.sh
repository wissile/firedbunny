#!/usr/bin/env bash
# Full local check before merging to main: quick build, the feature tests, then the full build (pre-built pages and the
# search checks). Prints one line per step and a final verdict. Usage: bash tools/regress.sh [logdir]
cd "$(dirname "$0")/.."
LOG="${1:-/tmp/fb-regress}"; mkdir -p "$LOG"; : > "$LOG/summary.txt"
step() { # name, command...
  local name="$1"; shift; local t0=$SECONDS
  "$@" > "$LOG/$name.log" 2>&1; local rc=$?
  echo "$name rc=$rc $((SECONDS - t0))s :: $(tail -1 "$LOG/$name.log" | cut -c1-120)" | tee -a "$LOG/summary.txt"
  return 0
}
step build-quick python3 tools/build.py --no-prerender
step sitetest python3 tools/sitetest.py
step harness python3 tools/harness.py
step chattest python3 tools/chattest.py
step supporttest python3 tools/supporttest.py
step planstest python3 tools/planstest.py
step accounts python3 tools/accounts/e2e.py
step offlinetest python3 tools/offlinetest.py
step build-full python3 tools/build.py
if grep -qv " rc=0 " "$LOG/summary.txt"; then echo "SOME FAILED" | tee -a "$LOG/summary.txt"; exit 1; fi
echo "ALL PASSED" | tee -a "$LOG/summary.txt"
