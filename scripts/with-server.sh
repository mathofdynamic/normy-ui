#!/usr/bin/env bash
# Run a command against a temporary dev server on :3100, then stop it completely.
# Usage: bash scripts/with-server.sh <command...>
# Note: in Git Bash $! is an MSYS pid, so cleanup is done by port + Windows parent pid.
node node_modules/next/dist/bin/next dev --port 3100 > /tmp/normy-srv.log 2>&1 &
PID=$!
for i in $(seq 1 90); do curl -s -o /dev/null --max-time 5 http://localhost:3100/ && break; sleep 2; done
"$@"; CODE=$?
kill $PID 2>/dev/null
if command -v taskkill >/dev/null 2>&1; then
  for attempt in 1 2 3 4 5 6; do
    PIDS=$(netstat -ano | grep ":3100 " | grep LISTENING | awk '{print $5}' | sort -u)
    [ -z "$PIDS" ] && break
    for P in $PIDS; do
      PARENT=$(wmic process where "ProcessId=$P" get ParentProcessId 2>/dev/null | grep -o '[0-9]\+' | head -1)
      if [ -n "$PARENT" ] && tasklist //FI "PID eq $PARENT" 2>/dev/null | grep -qi "node.exe"; then
        taskkill //PID $PARENT //T //F >/dev/null 2>&1
      fi
      taskkill //PID $P //T //F >/dev/null 2>&1
    done
    sleep 2
  done
fi
exit $CODE
