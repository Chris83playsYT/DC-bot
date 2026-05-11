#!/bin/bash
set -e

echo "[prod] Building API server..."
pnpm --filter @workspace/api-server run build

echo "[prod] Starting API server..."
NODE_ENV=production PORT=8080 node --enable-source-maps artifacts/api-server/dist/index.mjs &
API_PID=$!

echo "[prod] Starting Discord bot watchdog..."
node bot/start.js &
BOT_PID=$!

# If either process exits, kill both and exit so the container restarts
wait -n $API_PID $BOT_PID
EXIT_CODE=$?

echo "[prod] A process exited (code $EXIT_CODE). Shutting down both..."
kill $API_PID $BOT_PID 2>/dev/null
exit $EXIT_CODE
