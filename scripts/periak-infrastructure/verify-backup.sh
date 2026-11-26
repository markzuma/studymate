#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

BASE="https://studymate-pi-eight.vercel.app"
ARCHIVE="$HOME/PERIAK-Secure-Backup.tar.gz.gpg"

echo "========== PERIAK INFRASTRUCTURE CHECK =========="
date

echo
echo "========== GITHUB BACKUP =========="

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git ls-remote origin refs/heads/main | cut -f1)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "PASS: Local HEAD matches GitHub main."
else
    echo "WARNING: Local and remote commits differ."
fi

if git diff --quiet && git diff --cached --quiet; then
    echo "PASS: No uncommitted tracked changes."
else
    echo "WARNING: Tracked changes not committed."
fi

echo
echo "========== PRODUCTION HEALTH =========="

curl -fsSL --max-time 20 "$BASE/" \
  -o /dev/null

echo "PASS: Production website accessible."

curl -fsSL --max-time 20 "$BASE/manifest.webmanifest" \
  | python3 -c '
import json, sys
d = json.load(sys.stdin)
assert d["name"] == "PERIAK"
assert len(d["icons"]) >= 3
print("PASS: PWA manifest valid.")
'

echo
echo "========== ANDROID ASSOCIATION =========="

curl -fsSL --max-time 20 \
  "$BASE/.well-known/assetlinks.json" \
  | python3 -c '
import json, sys
d = json.load(sys.stdin)
expected = "7A:DA:B7:08:3F:91:B7:EE:BF:6C:67:7F:00:99:E9:17:A7:04:06:04:94:9A:1A:29:E5:43:E4:C9:30:F0:08:6F"
assert any(
  x.get("target", {}).get("package_name") == "com.periak.app"
  and expected in x["target"].get("sha256_cert_fingerprints", [])
  and "delegate_permission/common.handle_all_urls" in x.get("relation", [])
  for x in d
)
print("PASS: Android signing association valid.")
'

echo
echo "========== ENCRYPTED BACKUP =========="

if [ -s "$ARCHIVE" ]; then
    ls -lh "$ARCHIVE"

    if [ "${1:-}" = "--deep" ]; then
        gpg --decrypt "$ARCHIVE" | tar -tzf - >/dev/null
        echo "PASS: Encrypted archive readable."
    else
        echo "Backup present. Contents not yet verified."
        echo "Use --deep to verify encrypted archive integrity."
    fi
else
    echo "WARNING: Expected encrypted backup not found."
fi

echo
echo "========== DATABASE BACKUP =========="

echo "Separate database backup and restore test required."
echo "This script does not create a database dump."

echo
echo "========== INFRASTRUCTURE CHECK COMPLETE =========="
