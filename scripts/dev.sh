#!/usr/bin/env bash
set -euo pipefail

# --- Project root ---
cd "$(dirname "${BASH_SOURCE[0]}")/.."
ROOT="$(pwd)"

# --- Locate WebUI directory ---
WEB_DIR="$ROOT/webapp"
if [[ ! -d "$WEB_DIR" ]]; then
  echo "❌ Could not find a $WEB_DIR."
  exit 1
fi

# --- Locate Server directory ---
SERVER_DIR="$ROOT/server"
if [[ ! -d "$SERVER_DIR" ]]; then
  echo "❌ Could not find a $SERVER_DIR."
  exit 1
fi

cleanup () {
  echo -e "🛑 Shutting down dev services..."
  # Kill Vite if still running
  if [[ -n "${VITE_PID:-}" ]] && ps -p "$VITE_PID" > /dev/null 2>&1; then
    kill "$VITE_PID" || true
    # Give it a moment, then hard-kill if needed
    sleep 0.5
    ps -p "$VITE_PID" > /dev/null 2>&1 && kill -9 "$VITE_PID" || true
  fi
}

trap 'cleanup; exit 130' INT
trap 'cleanup; exit 143' TERM
trap 'cleanup' EXIT

# --- Start Vite (background) ---
echo "🚀 Starting Vite dev server in '$WEB_DIR' on 5173 ..."
(
  cd "$WEB_DIR"
  npx vite dev --host "0.0.0.0" --port "5173"
) &
VITE_PID=$!
echo "ℹ️ Vite PID: $VITE_PID"

# --- Start Server (foreground, with auto-reload) ---
echo "🧩 Starting server (tsx watch) on port 8080 ..."
(
  cd "$SERVER_DIR"
  if npx --yes tsx --help > /dev/null 2>&1; then
    npx tsx watch src/cli.ts server-dev
  else
    echo "❌ 'tsx' not found. Install it with: npm i -D tsx"
    exit 1
  fi
)