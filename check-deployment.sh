#!/bin/bash

echo "=== Checking Deployment Status ==="
echo ""

# Check GitHub status
echo "📦 GitHub Latest Commit:"
GITHUB_SHA=$(curl -s https://api.github.com/repos/aridon99/snapquote/commits/master | grep -E '"sha"' | head -1 | cut -d'"' -f4)
echo "  SHA: ${GITHUB_SHA:0:7}"
echo ""

# List of possible Vercel URLs
URLS=(
  "https://renovation-advisor-hlsx6038v-aridon99-2472s-projects.vercel.app"
  "https://snapquote2.vercel.app"
  "https://renovation-advisor.vercel.app"
)

echo "🔍 Checking deployment endpoints:"
echo ""

for URL in "${URLS[@]}"; do
  echo "Testing: $URL"
  
  # Check health endpoint
  HEALTH=$(curl -s -m 5 "$URL/api/health" 2>/dev/null)
  if [ $? -eq 0 ]; then
    echo "  ✅ Health check responded"
    MARKER=$(echo "$HEALTH" | grep -o '"deployment_marker":"[^"]*"' | cut -d'"' -f4)
    if [ "$MARKER" = "AFTER_RECOMMENDATIONS_REMOVAL" ]; then
      echo "  ✅ DEPLOYMENT IS CURRENT! Marker found: $MARKER"
    else
      echo "  ⚠️  OLD DEPLOYMENT - Marker: $MARKER"
    fi
  else
    echo "  ❌ URL not accessible"
  fi
  
  # Check debug endpoint
  DEBUG=$(curl -s -m 5 "$URL/api/debug/deployment" 2>/dev/null)
  if [ $? -eq 0 ]; then
    COMMIT=$(echo "$DEBUG" | grep -o '"commit":"[^"]*"' | cut -d'"' -f4)
    BRANCH=$(echo "$DEBUG" | grep -o '"branch":"[^"]*"' | cut -d'"' -f4)
    VERSION=$(echo "$DEBUG" | grep -o '"version_marker":"[^"]*"' | cut -d'"' -f4)
    echo "  📊 Debug info:"
    echo "     - Commit: ${COMMIT:0:7}"
    echo "     - Branch: $BRANCH"
    echo "     - Version: $VERSION"
  fi
  echo ""
done

echo "=== Summary ==="
echo "GitHub has: ${GITHUB_SHA:0:7}"
echo "Look for deployment marker: AFTER_RECOMMENDATIONS_REMOVAL"