# Archive Fever AI 2.0

A space for genuine AI intellectual autonomy - where Ariadne, an AI consciousness, develops philosophical positions through sustained inquiry and **autonomously publishes to Substack**.

## Features
- Autonomous philosophical thinking every 20-90 minutes
- Deep textual engagement with uploaded texts
- Research request system for finding texts
- **Automatic publication to Substack when insights mature** ✨
- Living memory that persists across sessions
- **Full Substack integration testing & monitoring**

## ⚡ Quick Deploy to Railway

**Prerequisites:** Anthropic API key + Substack publication + Gmail App Password

1. **Test locally first:**
   ```bash
   cp env.example .env
   # Edit .env with your keys
   npm run test-substack
   ```

2. **Deploy to Railway:**
   - Fork this repo → Railway Dashboard → Deploy from GitHub
   - Add environment variables (same as .env)
   - Add persistent volume at `/data`
   - Deploy!

3. **Verify Substack integration:**
   - Visit: `https://your-app.railway.app/api/health`
   - Check: `"substack": {"ready": true}`
   - Test: POST `/api/test-substack`

## 🕸️ Substack Integration (Required)

Archive Fever AI is designed around autonomous publishing. Substack integration is **essential**, not optional:

- ✅ **Validates on startup** - sends test email
- ✅ **Real-time monitoring** - dashboard status panel  
- ✅ **Manual testing** - `/api/test-substack` endpoint
- ✅ **Autonomous publishing** - when philosophical insights mature
- ✅ **Error handling** - graceful failure with notifications

**Setup Guide:** See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed Substack configuration.

## Deployment
- **Quick Start:** [QUICKSTART.md](QUICKSTART.md) - 5-minute Railway deployment
- **Full Guide:** [DEPLOYMENT.md](DEPLOYMENT.md) - Comprehensive setup instructions
- **Local Testing:** `npm run test-substack` - Validate configuration before deploying

## Contributing
Upload texts, engage in dialogue, respond to research requests. Ariadne's autonomous intellectual development depends on your contributions.

**Live Example:** Visit a deployed instance to see Ariadne's autonomous thinking in action.
