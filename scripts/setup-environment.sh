#!/usr/bin/env bash
set -euo pipefail

echo "[*] Starting Gitea..."
docker compose up -d gitea

# Wait for Gitea to be available
echo "[*] Waiting for Gitea..."
until curl -s http://localhost:3000 > /dev/null; do
  sleep 2
done

# Create admin user in Gitea
echo "[*] Creating Gitea admin user..."
docker exec gitea \
  gitea admin user create \
    --username woodpecker \
    --password woodpecker123 \
    --email woodpecker@example.com \
    --admin \
    --must-change-password=false || true

# Generate Gitea token for API access
echo "[*] Getting Gitea API token..."
TOKEN=$(curl -s -X POST "http://localhost:3000/api/v1/users/woodpecker/tokens" \
  -u woodpecker:woodpecker123 \
  -H "Content-Type: application/json" \
  -d '{"name": "woodpecker-setup", "scopes": ["all"]}')

TOKEN=$(echo "$TOKEN" | jq -r .sha1)

# Create OAuth app for Woodpecker
echo "[*] Creating OAuth app in Gitea..."
OAUTH=$(curl -s -X POST "http://localhost:3000/api/v1/user/applications/oauth2" \
  -H "Authorization: token $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "woodpecker",
        "redirect_uris": ["http://192.168.100.10:8000/authorize"],
        "confidential_client": true
      }')

CLIENT_ID=$(echo "$OAUTH" | jq -r .client_id)
CLIENT_SECRET=$(echo "$OAUTH" | jq -r .client_secret)

echo "[*] Writing OAuth credentials to .env..."
cat > .env <<EOF
WOODPECKER_GITEA_CLIENT=$CLIENT_ID
WOODPECKER_GITEA_SECRET=$CLIENT_SECRET
WOODPECKER_AGENT_SECRET=supersecret
EOF

# Restart Woodpecker to pick up env vars
echo "[*] Restarting Woodpecker with OAuth config..."
docker compose up -d woodpecker-server woodpecker-agent

# Wait for Woodpecker
echo "[*] Waiting for Woodpecker..."
until curl -s http://localhost:8000/api/healthz > /dev/null; do
  sleep 2
done

# Create test repository
echo "[*] Creating test repository..."
REPO_RESPONSE=$(curl -s -X POST \
  -H "Authorization: token $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "test-mcp",
        "description": "Test repository for Woodpecker Sonar plugin",
        "auto_init": true
      }' \
  "http://localhost:3000/api/v1/user/repos")

echo ""
echo "=========================================="
echo "[*] Setup complete! 🚀"
echo "=========================================="
echo "Services:"
echo "  Gitea:      http://localhost:3000 (woodpecker/woodpecker123)"
echo "  Woodpecker: http://localhost:8000"
echo ""
echo "Repository:"
echo "  Test repo:  http://localhost:3000/woodpecker/test-mcp"
echo ""
echo "=========================================="
echo "[*] MANUAL STEPS REQUIRED:"
echo "=========================================="
echo "1. Login to Woodpecker:"
echo "   - Go to http://localhost:8000"
echo "   - Click 'Login with Gitea'"
echo "   - Use credentials: woodpecker/woodpecker123"
echo "   - Authorize the application"
echo ""
echo "2. Add the repository:"
echo "   - In Woodpecker dashboard, click 'Repositories'"
echo "   - Find 'test-mcp' and click 'Enable'"
echo ""
echo "=========================================="
