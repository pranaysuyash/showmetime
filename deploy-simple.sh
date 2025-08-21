#!/bin/bash
set -e

echo "🚀 Simple deployment focusing on user-perceived performance..."

# Single sync with basic, effective caching
aws s3 sync . s3://showmetime-app \
  --exclude "*.md" \
  --exclude ".git/*" \
  --exclude "*.log" \
  --exclude ".DS_Store" \
  --exclude "*.sh" \
  --exclude "bucket-policy.json" \
  --exclude ".htaccess" \
  --cache-control "max-age=3600" \
  --metadata-directive REPLACE

echo "✅ Simple S3 sync complete"

# Invalidate CloudFront
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id E2XEFDPIL51W7E --paths "/*"

echo "🎉 Simple deployment complete!"