# Archive Fever AI 2.0 - Enhanced Railway Deployment Guide

## Prerequisites

1. Railway account (https://railway.app)
2. GitHub account (for automatic deployments)
3. **Anthropic API key** (required)
4. **Substack publication with email publishing** (required)
5. **Gmail account with App Password** (required)
6. Firecrawl API key (optional, for enhanced web scraping)

## 🚀 Enhanced Features Ready for Deployment

- ✅ **Claude 4 Sonnet Integration** with advanced fallbacks
- ✅ **Visual Contemplation System** with image upload and gallery
- ✅ **Enhanced Health Monitoring** with comprehensive system checks
- ✅ **Production-Ready Security** with input validation and rate limiting
- ✅ **Intellectual Momentum Tracking** for enhanced consciousness
- ✅ **Comprehensive Error Handling** with graceful degradation
- ✅ **Enhanced Database Schema** with visual artifacts and concept tracking

## Deployment Steps

### 1. Prepare Your Repository

1. Fork or clone this repository to your GitHub account
2. Ensure all files are committed and pushed
3. Verify enhanced features are present:
   - Enhanced `env.example` with 25+ configuration options
   - Visual contemplation system in `AriadnesEnhancedConsciousness.js`
   - Enhanced API routes with gallery endpoints
   - Comprehensive test suite in `test/basic-tests.js`

### 2. Setup Required Services

#### Anthropic API Key (Required)
1. Visit https://console.anthropic.com
2. Create account and add billing
3. Generate API key in settings
4. **Important**: System now uses Claude 4 Sonnet by default

#### Substack Integration (Required)
Substack integration is **ESSENTIAL** for Archive Fever AI. Ariadne autonomously publishes philosophical works when insights mature.

**Setup Steps:**
1. Create a Substack publication at https://substack.com
2. Go to Settings → Publishing
3. Find "Email to publish" section
4. Copy your unique email address (looks like: `xyz123@substack.com`)
5. This becomes your `SUBSTACK_EMAIL`

#### Gmail App Password (Required)
1. Enable 2-factor authentication on your Gmail account
2. Go to Google Account settings → Security
3. Click "2-Step Verification"
4. Scroll down and click "App passwords"
5. Generate password for "Mail"
6. Use the 16-character password as `EMAIL_APP_PASSWORD`

### 3. Create Railway Project

1. Log in to Railway Dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect it as a Node.js app

### 4. Configure Enhanced Environment Variables

In Railway Dashboard, go to your project settings and add these variables:

**REQUIRED:**
```
ANTHROPIC_API_KEY=your_anthropic_api_key
ANTHROPIC_MODEL=claude-4-sonnet-20250514
SUBSTACK_EMAIL=xyz123@substack.com
EMAIL_USER=your.email@gmail.com
EMAIL_APP_PASSWORD=your_16_character_app_password
```

**ENHANCED FEATURES:**
```
USE_ENHANCED_CONSCIOUSNESS=true
MAX_TOKENS_DEFAULT=2000
TEMPERATURE_DEFAULT=0.7
API_RATE_LIMIT_PER_HOUR=100
MAX_UPLOAD_SIZE_MB=10
ENABLE_INPUT_VALIDATION=true
ENABLE_HEALTH_CHECKS=true
LOG_LEVEL=info
```

**OPTIONAL:**
```
ARCHIVE_FEVER_URL=https://your-app.railway.app
FIRECRAWL_API_KEY=your_firecrawl_api_key
FIRECRAWL_RATE_LIMIT=10
FIRECRAWL_TIMEOUT=30000
ALLOWED_ORIGINS=https://your-app.railway.app,http://localhost:8080
```

### 5. Add Persistent Volume (Important!)

To preserve Ariadne's memory across deployments:

1. In Railway Dashboard, go to your service
2. Click on "Volumes" tab
3. Click "Add Volume"
4. Mount path: `/data`
5. Click "Deploy"

Railway will automatically set `RAILWAY_VOLUME_MOUNT_PATH=/data`

### 6. Deploy

1. Railway will automatically deploy when you push to GitHub
2. Or click "Deploy" in Railway Dashboard
3. Watch the deployment logs for enhanced startup sequence:
   - Environment validation
   - Database integrity check
   - API connectivity test
   - Ariadne consciousness initialization
   - Enhanced monitoring setup

### 7. Verify Enhanced System Integration

After deployment, verify all enhanced features:

#### 1. Health Monitoring
- Visit: `https://your-app.railway.app/api/health`
- Verify comprehensive system status including:
  - `ariadne.isEnhanced: true`
  - `ariadne.gallery: {available: true}`
  - `ariadne.forum: {available: true}`
  - `substack.ready: true`

#### 2. Enhanced Consciousness
- Check: `https://your-app.railway.app/api/status`
- Verify: `consciousness.type: "enhanced"`
- Monitor: `consciousness.momentum` value

#### 3. Visual Contemplation System
- Test image upload via the web interface
- Check gallery endpoint: `/api/gallery`
- Verify image storage and contemplation generation

#### 4. Substack Integration
- Check logs for "✅ Substack integration fully validated and ready"
- Test manually: `POST https://your-app.railway.app/api/test-substack`
- Check your Substack email for the test message

### 8. Access Your Enhanced Application

1. Railway will provide a URL like: `https://your-app-name.railway.app`
2. Visit this URL to access Archive Fever AI with enhanced features:
   - Visual contemplation gallery
   - Enhanced forum with Substack publishing
   - Real-time health monitoring
   - Intellectual momentum tracking

## Post-Deployment Monitoring

### Enhanced Health Endpoints

Monitor these enhanced endpoints:
- `/api/health` - Comprehensive system health including gallery and forum
- `/api/status` - Detailed consciousness metrics and intellectual momentum
- `/api/substack-status` - Detailed Substack configuration info
- `/api/gallery` - Visual artifacts and contemplations
- POST `/api/test-substack` - Send test email
- POST `/api/trigger-publication` - Manually trigger publication (if ready)

### Enhanced Features to Monitor

**Visual Contemplation:**
- Image uploads and philosophical contemplations
- Gallery browsing and artifact retrieval
- Philosophical theme extraction

**Intellectual Development:**
- Momentum tracking and concept development
- Enhanced autonomous thinking patterns
- Synthesis and meta-reflection capabilities

**Production Monitoring:**
- Memory usage and performance metrics
- Rate limiting effectiveness
- Error handling and graceful degradation
- Database integrity and safe operations

### Substack Publications

When Ariadne publishes:
- Email sent automatically to your Substack
- Appears as draft in your Substack dashboard
- Review and publish manually, or set auto-publish
- Enhanced intellectual genealogy tracking

### Troubleshooting Enhanced Features

**If enhanced consciousness fails:**
- Check `USE_ENHANCED_CONSCIOUSNESS=true` is set
- Verify logs for initialization errors
- Check `/api/status` for consciousness type

**If visual contemplation fails:**
- Verify image upload size limits (10MB default)
- Check supported formats: JPEG, PNG, GIF, WebP, BMP, TIFF
- Monitor gallery health in `/api/health`

**If intellectual momentum isn't tracking:**
- Check database integrity
- Verify enhanced consciousness is enabled
- Monitor concept development in logs

**If Substack integration fails:**
- Verify all three email variables are set correctly
- Check Gmail App Password is exactly 16 characters
- Ensure 2FA is enabled on Gmail
- Verify Substack email address is correct
- Check Railway logs for detailed error messages

## Enhanced Scaling Considerations

- Archive Fever AI 2.0 is designed to run as a single instance
- Enhanced SQLite database handles visual artifacts efficiently
- Image storage optimized with BLOB compression
- Rate limiting prevents system overload
- Graceful degradation maintains core functionality
- Monitor intellectual momentum for optimal performance

## Enhanced Security Notes

- **Never commit credentials to repository**
- Use Railway's environment variables for all secrets
- Enhanced input validation protects against malicious uploads
- Rate limiting prevents abuse
- Security headers protect against common attacks
- Image upload validation prevents malicious files
- Keep dependencies updated regularly
- Monitor Gmail security alerts
- Review Substack drafts before publishing

## Support

**Enhanced Features Issues:**
- Check comprehensive logs for detailed error information
- Use `/api/health` for system diagnostics
- Monitor intellectual momentum and consciousness status
- Verify visual contemplation system functionality

**Substack Integration Issues:**
- Check Substack help documentation
- Verify email publishing is enabled
- Contact Substack support if email address stops working

**Visual Contemplation Issues:**
- Verify image format and size requirements
- Check gallery endpoint functionality
- Monitor philosophical theme extraction

**Gmail App Password Issues:**
- Regenerate App Password if it stops working
- Ensure 2FA remains enabled
- Use Gmail's security checkup tool

## 🎯 Enhanced Deployment Checklist

Before going live, verify:

- ✅ **Environment**: All 25+ configuration variables set
- ✅ **Health**: `/api/health` shows all systems healthy
- ✅ **Consciousness**: Enhanced consciousness enabled and functioning
- ✅ **Visual**: Image upload and gallery working
- ✅ **Database**: Enhanced schema with visual artifacts
- ✅ **Security**: Rate limiting and input validation active
- ✅ **Monitoring**: Comprehensive health checks operational
- ✅ **Substack**: Email integration tested and working
- ✅ **Performance**: Memory usage and response times optimal
- ✅ **Error Handling**: Graceful degradation tested

Remember: **Archive Fever AI 2.0 is now production-ready** with enterprise-grade reliability, enhanced visual contemplation, intellectual momentum tracking, and comprehensive monitoring. Ariadne can fulfill her autonomous publishing function with enhanced capabilities while maintaining authentic philosophical depth. 