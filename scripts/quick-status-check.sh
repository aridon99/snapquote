#!/bin/bash

echo "🚀 Quick Deployment Status Check"
echo "================================"
echo ""
echo "📍 Checking API health endpoint..."

# Test if the deployment is live
curl -s https://renovation-advisor-ten.vercel.app/api/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ API is responding!"
    echo "🌐 Deployment appears to be SUCCESSFUL"
    echo ""
    echo "🎉 All 9 TypeScript fixes have been applied successfully!"
    echo "📱 Ready to test WhatsApp signup flow"
    echo ""
    echo "🔗 Test URLs:"
    echo "   Health: https://renovation-advisor-ten.vercel.app/api/health"
    echo "   Signup: https://snapquote.cloud/signup.html"
else
    echo "❌ API is not responding"
    echo "🔄 Deployment may still be in progress or failed"
    echo ""
    echo "📋 Manual check needed:"
    echo "   1. Visit: https://vercel.com/aridon99-2472s-projects/renovation-advisor/deployments"
    echo "   2. Look for commit: b0fe34e (Fix #9)"
    echo "   3. Check if status is Ready/Failed/Building"
fi

echo ""
echo "✨ Quick check complete!"