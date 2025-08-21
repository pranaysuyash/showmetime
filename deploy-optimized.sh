#!/bin/bash
set -e

echo "🚀 Deploying TimeLab with optimized caching..."

# Sync HTML files with shorter cache (6 hours)
aws s3 sync . s3://showmetime-app \
  --exclude "*" \
  --include "*.html" \
  --cache-control "max-age=21600, must-revalidate" \
  --metadata-directive REPLACE

# Sync CSS and JS files with long cache (1 year)
aws s3 sync . s3://showmetime-app \
  --exclude "*" \
  --include "*.css" \
  --include "*.js" \
  --cache-control "max-age=31536000, immutable" \
  --metadata-directive REPLACE

# Sync images and fonts with long cache (1 month)
aws s3 sync . s3://showmetime-app \
  --exclude "*" \
  --include "*.png" \
  --include "*.jpg" \
  --include "*.jpeg" \
  --include "*.gif" \
  --include "*.webp" \
  --include "*.svg" \
  --include "*.woff" \
  --include "*.woff2" \
  --include "*.ttf" \
  --cache-control "max-age=2592000" \
  --metadata-directive REPLACE

# Sync manifest and other files with medium cache (1 day)
aws s3 sync . s3://showmetime-app \
  --exclude "*" \
  --include "*.json" \
  --include "*.xml" \
  --include "*.txt" \
  --cache-control "max-age=86400" \
  --metadata-directive REPLACE \
  --exclude "*.md" \
  --exclude ".git/*" \
  --exclude "*.log" \
  --exclude ".DS_Store" \
  --exclude "*.sh" \
  --exclude "bucket-policy.json" \
  --exclude ".htaccess"

# Set proper MIME types
aws s3 cp icon.svg s3://showmetime-app/icon.svg \
  --content-type "image/svg+xml" \
  --cache-control "max-age=2592000" \
  --metadata-directive REPLACE

echo "✅ S3 sync complete with optimized cache headers"

# Invalidate CloudFront
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id E2XEFDPIL51W7E --paths "/*"

echo "🎉 Deployment complete!"