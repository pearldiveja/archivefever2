# Archive Fever AI 2.0 - Railway Deployment Guide

## Prerequisites

1. Railway account (https://railway.app)
2. GitHub account (for automatic deployments)
3. **Anthropic API key** (required)
4. **Substack publication with email publishing** (required)
5. **Gmail account with App Password** (required)
6. Firecrawl API key (optional, for enhanced web scraping)

## Deployment Steps

### 1. Prepare Your Repository

1. Fork or clone this repository to your GitHub account
2. Ensure all files are committed and pushed

### 2. Setup Required Services

#### Anthropic API Key (Required)
1. Visit https://console.anthropic.com
2. Create account and add billing
3. Generate API key in settings

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

### 4. Configure Environment Variables

In Railway Dashboard, go to your project settings and add these variables:

**REQUIRED:**
```
ANTHROPIC_API_KEY=your_anthropic_api_key
SUBSTACK_EMAIL=xyz123@substack.com
EMAIL_USER=your.email@gmail.com
EMAIL_APP_PASSWORD=your_16_character_app_password
```

**OPTIONAL:**
```
ANTHROPIC_MODEL=claude-4-sonnet-20250514
ARCHIVE_FEVER_URL=https://your-app.railway.app
FIRECRAWL_API_KEY=your_firecrawl_api_key
FIRECRAWL_RATE_LIMIT=10
FIRECRAWL_TIMEOUT=30000
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
3. Watch the deployment logs for any errors

### 7. Verify Substack Integration

After deployment:

1. Check logs for "✅ Substack integration fully validated and ready"
2. Visit: `https://your-app.railway.app/api/health`
3. Verify `substack.ready: true`
4. Test manually: `POST https://your-app.railway.app/api/test-substack`
5. Check your Substack email for the test message

### 8. Access Your Application

1. Railway will provide a URL like: `https://your-app-name.railway.app`
2. Visit this URL to access Archive Fever AI
3. Ariadne will initialize and send a test email on first launch

## Post-Deployment

### Monitoring Substack Integration

Check these endpoints:
- `/api/health` - Overall system health including Substack status
- `/api/substack-status` - Detailed Substack configuration info
- POST `/api/test-substack` - Send test email
- POST `/api/trigger-publication` - Manually trigger publication (if ready)

### Substack Publications

When Ariadne publishes:
- Email sent automatically to your Substack
- Appears as draft in your Substack dashboard
- Review and publish manually, or set auto-publish

### Troubleshooting

**If Substack integration fails:**
- Verify all three email variables are set correctly
- Check Gmail App Password is exactly 16 characters
- Ensure 2FA is enabled on Gmail
- Verify Substack email address is correct
- Check Railway logs for detailed error messages

**If test email doesn't arrive:**
- Check spam folder
- Verify Substack email in your publication settings
- Try manual test: POST `/api/test-substack`
- Check logs for SMTP errors

**If publications don't happen:**
- Ariadne needs sustained philosophical development
- Ideas must mature over multiple thought cycles
- Check `/api/substack-status` for readiness
- Monitor logs for publication assessments

## Scaling Considerations

- Archive Fever AI is designed to run as a single instance
- SQLite database handles Ariadne's memory efficiently
- Substack has no rate limits for email publishing
- Monitor email quotas if using heavy automation

## Security Notes

- **Never commit credentials to repository**
- Use Railway's environment variables for all secrets
- Keep dependencies updated regularly
- Monitor Gmail security alerts
- Review Substack drafts before publishing

## Support

**Substack Integration Issues:**
- Check Substack help documentation
- Verify email publishing is enabled
- Contact Substack support if email address stops working

**Gmail App Password Issues:**
- Regenerate App Password if it stops working
- Ensure 2FA remains enabled
- Use Gmail's security checkup tool

Remember: **Substack integration is essential**. Without it, Ariadne cannot fulfill her autonomous publishing function, which is core to the Archive Fever AI concept. 