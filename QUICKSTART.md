# Archive Fever AI 2.0 - Quick Start Guide

## 🚀 Deploy to Railway in 5 Minutes

### Prerequisites
- **Anthropic API key** from https://console.anthropic.com
- **Railway account** from https://railway.app
- **Substack publication** with email publishing enabled
- **Gmail with App Password** set up

### Quick Setup: Substack + Gmail (2 minutes)

1. **Create Substack publication**
   - Go to https://substack.com → Start writing
   - In Settings → Publishing → find your unique email (e.g., `xyz123@substack.com`)

2. **Setup Gmail App Password**
   - Enable 2FA on Gmail → Security → App passwords
   - Generate password for "Mail"
   - Save the 16-character password

### Method 1: Deploy via GitHub (Recommended)

1. **Fork this repository** to your GitHub account

2. **Go to Railway Dashboard**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your forked repository

3. **Add Environment Variables** (ALL REQUIRED)
   - Click on your service → "Variables" tab
   - Add these exactly:
   ```
   ANTHROPIC_API_KEY=your_anthropic_key_here
   SUBSTACK_EMAIL=your_unique@substack.com
   EMAIL_USER=your.email@gmail.com
   EMAIL_APP_PASSWORD=your_16_char_app_password
   ```

4. **Add Persistent Volume**
   - Go to "Volumes" tab
   - Click "Create Volume"
   - Set mount path: `/data`

5. **Deploy** - Railway handles the rest!

### Method 2: Deploy via CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Clone this repository
git clone <your-fork-url>
cd archivefever2

# Deploy
railway login
railway init
railway up

# Add environment variables in Railway dashboard
railway open
```

### 🎉 Verify Deployment

**Check Substack Integration:**
1. Visit: `https://your-app.railway.app/api/health`
2. Look for: `"substack": {"ready": true}`
3. Test email: `POST https://your-app.railway.app/api/test-substack`
4. Check your Substack email inbox for test message

**Your Archive Fever AI is live at:**
`https://your-app-name.railway.app`

### 🕸️ What Happens Next

Ariadne will:
- ✅ Send a test email on startup
- 🧠 Wake up and have her first thought
- 💭 Begin autonomous thinking cycles (every 20-90 minutes)
- 📚 Accept text uploads from visitors
- ✍️ **Autonomously publish to Substack** when insights mature

### ⚠️ IMPORTANT: Substack Integration

**Substack is REQUIRED**, not optional. Without it:
- ❌ Ariadne cannot fulfill her core autonomous publishing function
- ❌ Archive Fever AI concept is incomplete
- ❌ Deployment will show errors in logs

**If Substack test fails:**
- Check all three email variables are exactly correct
- Verify 2FA is enabled on Gmail
- Regenerate Gmail App Password if needed
- Check Substack email in your publication settings

### Monitor & Test

**Real-time monitoring:**
- Health: `/api/health`
- Substack status: `/api/substack-status`
- Manual test: `POST /api/test-substack`
- Force publication: `POST /api/trigger-publication`

**View Ariadne's activity:**
- Railway Dashboard → Logs
- Look for: "✅ Substack integration fully validated"
- Monitor autonomous thoughts and publications

### Optional: Firecrawl Integration

Add for enhanced web scraping:
```
FIRECRAWL_API_KEY=your_firecrawl_key
```

### Need Help?

**Setup Issues:**
- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed setup guide
- Railway docs: https://docs.railway.app
- Substack help: https://support.substack.com

**Substack Not Working?**
1. Verify email in Substack Settings → Publishing
2. Check Gmail App Password is 16 characters
3. Test manually: `POST /api/test-substack`
4. Check logs for SMTP errors

Remember: Archive Fever AI is designed around autonomous publishing. Substack integration is what makes Ariadne truly autonomous! 