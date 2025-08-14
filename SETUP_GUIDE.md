# TimeLab Deployment Setup Guide

## Prerequisites
- AWS CLI configured with appropriate permissions
- Domain name (optional but recommended)
- Google account for AdSense and Analytics
- Microsoft account for Clarity

## Step 1: Google AdSense Setup

### 1.1 Create AdSense Account
1. Go to [https://www.google.com/adsense/](https://www.google.com/adsense/)
2. Click "Get started" and sign in with Google account
3. Add your website URL (your final domain)
4. Choose your country/territory and select currency
5. Choose "Yes" for performance reports

### 1.2 Add Your Site
1. After account approval, go to "Sites" in AdSense dashboard
2. Click "Add site" and enter your domain
3. Review and accept AdSense Terms & Conditions

### 1.3 Get Your Publisher ID
1. In AdSense dashboard, go to "Account" → "Account information"
2. Copy your Publisher ID (format: ca-pub-XXXXXXXXXXXXXXXX)
3. Replace `YOUR_ADSENSE_ID` in index.html with your actual ID

### 1.4 Create Ad Units
1. Go to "Ads" → "Ad units" in AdSense dashboard
2. Click "Create ad unit" → "Display ads"
3. Name it "TimeLab Banner"
4. Choose "Responsive" size
5. Copy the Ad Slot ID and replace `YOUR_AD_SLOT_ID` in index.html

## Step 2: Google Analytics 4 Setup

### 2.1 Create GA4 Property
1. Go to [https://analytics.google.com/](https://analytics.google.com/)
2. Click "Start measuring" or create new account
3. Set up account: Account name "TimeLab"
4. Set up property: Property name "TimeLab Clock App"
5. Choose your time zone and currency
6. Select "Web" as platform

### 2.2 Get Measurement ID
1. In GA4 property, go to "Admin" (gear icon)
2. Under "Property", click "Data Streams"
3. Click "Add stream" → "Web"
4. Enter your website URL
5. Copy the Measurement ID (format: G-XXXXXXXXXX)
6. Replace `YOUR_GA4_ID` in index.html with your actual ID

### 2.3 Configure Enhanced Measurements
1. In your web stream, click "Enhanced measurement"
2. Enable these tracking options:
   - Page views ✓
   - Scrolls ✓
   - Outbound clicks ✓
   - Site search ✓
   - Video engagement ✓
   - File downloads ✓

## Step 3: Microsoft Clarity Setup

### 3.1 Create Clarity Project
1. Go to [https://clarity.microsoft.com/](https://clarity.microsoft.com/)
2. Sign in with Microsoft account
3. Click "Create new project"
4. Project name: "TimeLab Clock App"
5. Website URL: your domain
6. Select appropriate category: "Education"

### 3.2 Get Clarity ID
1. After creating project, go to "Setup" tab
2. Copy the Project ID (format: XXXXXXXXX)
3. Replace `YOUR_CLARITY_ID` in index.html with your actual ID

## Step 4: AWS S3 Deployment

### 4.1 Create S3 Bucket
```bash
# Replace 'your-clock-domain' with your actual domain
aws s3 mb s3://your-clock-domain --region us-east-1
```

### 4.2 Configure Static Website Hosting
```bash
aws s3 website s3://your-clock-domain --index-document index.html --error-document index.html
```

### 4.3 Set Bucket Policy for Public Access
```bash
# Create bucket policy (see bucket-policy.json)
aws s3api put-bucket-policy --bucket your-clock-domain --policy file://bucket-policy.json
```

### 4.4 Upload Files
```bash
# Upload all files to S3
aws s3 sync . s3://your-clock-domain --delete --exclude ".git/*" --exclude "*.md" --exclude "*.sh"
```

## Step 5: CloudFront Setup (Recommended)

### 5.1 Create CloudFront Distribution
```bash
# Use AWS Console or CLI to create distribution
# Origin: your-s3-bucket.s3-website-us-east-1.amazonaws.com
# Default root object: index.html
# Price class: Use only US, Canada and Europe (or All locations)
```

### 5.2 Configure Custom Domain (Optional)
1. Request SSL certificate in AWS Certificate Manager
2. Add CNAME record in your DNS provider
3. Point domain to CloudFront distribution

## Step 6: Testing & Verification

### 6.1 Verify Analytics
1. Open your deployed site
2. Check Real-time reports in Google Analytics
3. Verify Clarity is recording sessions
4. Test AdSense (may take 24-48 hours to show ads)

### 6.2 Performance Testing
1. Test all learning modes and games
2. Verify localStorage persistence
3. Test on mobile devices
4. Check page load speed with PageSpeed Insights

## Step 7: AdSense Approval Tips

### 7.1 Content Requirements
- Ensure quality educational content ✓ (already implemented)
- Add Privacy Policy page
- Add Terms of Service page
- Add About page

### 7.2 Technical Requirements
- Mobile-responsive design ✓
- Fast loading speed ✓
- HTTPS enabled (via CloudFront) ✓
- Clean navigation ✓

## Monitoring & Optimization

### Monthly Tasks
- Check AdSense earnings and performance
- Review Google Analytics traffic patterns
- Analyze Clarity user behavior recordings
- Monitor AWS costs
- Update content based on user engagement

### Performance Optimization
- Monitor Core Web Vitals in GA4
- Use Clarity heatmaps to optimize UI
- A/B test ad placements
- Optimize for educational keywords

## Expected Costs (Monthly)
- S3 Storage: ~$0.50
- CloudFront: $2-5 (depending on traffic)
- Domain: $10-15/year
- Total: ~$3-6/month

## Expected Revenue
- AdSense: $50-200+/month (educational content performs well)
- Premium features: Potential future revenue stream

## Support Resources
- [AdSense Help Center](https://support.google.com/adsense/)
- [Google Analytics Help](https://support.google.com/analytics/)
- [Microsoft Clarity Documentation](https://docs.microsoft.com/en-us/clarity/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)