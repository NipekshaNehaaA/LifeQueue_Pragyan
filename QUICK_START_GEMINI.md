# Quick Start: Google Gemini API Setup

## 🚀 5-Minute Setup for Demo

### Step 1: Get Your Free API Key
1. Visit: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (starts with `AIzaSy...`)

### Step 2: Add to .env File
```bash
# Open .env file (or create it from .env.example)
VITE_GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Step 3: Restart Application
```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Step 4: Verify It's Working
- Open browser console (F12)
- Look for: "Using Gemini API for triage analysis"
- If you see "⚠️ Gemini Key Missing", check your .env file

## ✅ Test Critical Detection

### Test 1: Hypertensive Crisis
```
1. Enter patient data
2. Set Blood Pressure: 280/140
3. Click "Analyze"
4. Expected: Risk Score 95 (RED), Department: Cardiology
```

### Test 2: Neurological Emergency
```
1. Enter patient data
2. Voice input: "Patient has tremor and shaking"
3. Click "Analyze"
4. Expected: Risk Score 88 (RED), Department: Neurology
```

## 🔧 Troubleshooting

### "⚠️ Gemini Key Missing - Using Fallback"
- Check `.env` file exists in project root
- Verify key starts with `AIzaSy`
- No quotes around the key
- Restart the dev server

### "API Error 400"
- Invalid API key format
- Get a new key from Google AI Studio
- Make sure you copied the entire key

### "API Error 429"
- Rate limit exceeded (unlikely with free tier)
- Wait 1 minute and try again
- Free tier: 60 requests/minute

## 📊 Provider Priority

The system tries providers in this order:
1. **Gemini** (Free, Fast) ← PRIMARY
2. **OpenAI** (Paid, Accurate) ← Fallback #1
3. **Groq** (Paid, Very Fast) ← Fallback #2
4. **Rule-Based** (Always works) ← Safety Net

## 🎯 Why Gemini?

- ✅ **FREE** - No credit card required
- ✅ **Fast** - 1-3 second response time
- ✅ **Reliable** - 99.9% uptime
- ✅ **Generous Limits** - 60 requests/minute free
- ✅ **Good Medical Knowledge** - Trained on medical literature

## 🔒 Security

- Never commit `.env` to git (already in .gitignore)
- Keep your API key private
- Rotate keys every 90 days
- Monitor usage in Google AI Studio

## 📞 Support

- **API Docs**: https://ai.google.dev/docs
- **Get API Key**: https://aistudio.google.com/app/apikey
- **Status**: https://status.cloud.google.com/

---

**You're ready to demo!** 🎉
