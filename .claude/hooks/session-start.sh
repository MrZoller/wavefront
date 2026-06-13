#!/bin/bash
# Wavefront SessionStart hook — provisions the toolchain for Claude Code on the web
# so tests, linters, the build, and the screenshot pipeline work without manual setup.
set -euo pipefail

# Only run in the remote (web) environment; local devs manage their own setup.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Install JS dependencies (idempotent; npm install benefits from the cached container state).
npm install

# Best-effort: install the Chromium build used by `npm run screenshots`.
# Non-fatal so a restrictive network policy never blocks session startup.
npx playwright install chromium || echo "playwright chromium install skipped (screenshots may be unavailable)"
