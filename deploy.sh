#!/bin/bash

# TimeLab S3 Deployment Script
# Make sure to configure your bucket name and region below

# Configuration - UPDATE THESE VALUES
BUCKET_NAME="showmetime-app"     # S3 bucket name
REGION="us-east-1"               # US East 1 for CloudFront optimization
DOMAIN="showmetime.com"          # Your domain name

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 TimeLab Deployment Script${NC}"
echo "=============================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install AWS CLI first.${NC}"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Pre-deployment checklist:${NC}"
echo "1. ✅ Updated AdSense ID in index.html"
echo "2. ✅ Updated Google Analytics ID in index.html"
echo "3. ✅ Updated Microsoft Clarity ID in index.html"
echo "4. ✅ Updated bucket name in this script"
echo ""

read -p "Have you completed all the above steps? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Please complete the checklist first.${NC}"
    exit 1
fi

# Create S3 bucket if it doesn't exist
echo -e "${BLUE}📦 Creating S3 bucket...${NC}"
if aws s3 ls "s3://$BUCKET_NAME" 2>&1 | grep -q 'NoSuchBucket'; then
    aws s3 mb "s3://$BUCKET_NAME" --region "$REGION"
    echo -e "${GREEN}✅ Bucket created successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Bucket already exists${NC}"
fi

# Configure static website hosting
echo -e "${BLUE}🌐 Configuring static website hosting...${NC}"
aws s3 website "s3://$BUCKET_NAME" --index-document index.html --error-document index.html

# Update bucket policy with correct bucket name
echo -e "${BLUE}🔒 Setting bucket policy...${NC}"
sed "s/your-clock-domain/$BUCKET_NAME/g" bucket-policy.json > /tmp/bucket-policy-updated.json
aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy file:///tmp/bucket-policy-updated.json
rm /tmp/bucket-policy-updated.json

# Upload files to S3
echo -e "${BLUE}📤 Uploading files to S3...${NC}"
aws s3 sync . "s3://$BUCKET_NAME" \
    --delete \
    --exclude ".git/*" \
    --exclude "*.md" \
    --exclude "*.sh" \
    --exclude "*.json" \
    --exclude ".gitignore" \
    --cache-control "text/html:max-age=300" \
    --cache-control "text/css,application/javascript:max-age=31536000"

# Get website URL
WEBSITE_URL="http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo "======================================"
echo -e "${BLUE}Website URL:${NC} $WEBSITE_URL"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Set up CloudFront distribution for HTTPS and better performance"
echo "2. Configure your custom domain"
echo "3. Submit your site to Google AdSense for review"
echo "4. Monitor analytics and user behavior"
echo ""
echo -e "${BLUE}Monitoring URLs:${NC}"
echo "• Google Analytics: https://analytics.google.com/"
echo "• Microsoft Clarity: https://clarity.microsoft.com/"
echo "• Google AdSense: https://www.google.com/adsense/"
echo ""
echo -e "${GREEN}Happy learning! 🕐📚${NC}"