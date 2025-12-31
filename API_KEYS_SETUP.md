# API Keys Setup Guide

## Overview

The learning app now supports **per-user API keys** for each AI agent. This allows you to:
- Use different API keys for different agents
- Set up separate keys for OpenAI and Gemini per agent
- Manage all keys through the Admin Settings page

## AI Agents

### 1. Course Structure Agent 📚
**Purpose:** Generates course modules and topics from course outline

**Used when:**
- Creating a new course
- Clicking "Generate Course Structure"

**API Keys:**
- OpenAI API Key (optional)
- Google Gemini API Key (optional)

### 2. Content Generation Agent ✍️
**Purpose:** Generates lecture notes, exercises, tasks, and quizzes for topics

**Used when:**
- Clicking "Generate Topic Content" on a topic
- Creates: lecture notes, tutorial exercises, practical tasks, quiz

**API Keys:**
- OpenAI API Key (optional)
- Google Gemini API Key (optional)

## How to Set Up API Keys

### Step 1: Get Your API Keys

**OpenAI:**
1. Go to https://platform.openai.com/api-keys
2. Sign in or create account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

**Google Gemini:**
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key

### Step 2: Configure in Admin Settings

1. **Login** to your app
2. Go to **Admin Settings** (⚙️ Settings in header)
3. Scroll to **"AI Agent API Keys Configuration"**
4. For each agent:
   - Enter OpenAI API Key (if using OpenAI)
   - Enter Gemini API Key (if using Gemini)
5. Click **"Save API Keys"**

### Step 3: Verify Configuration

After saving, check the status badges:
- ✅ **✓ Configured** = API key is set and ready
- ❌ **✗ Not Configured** = No API key set

## How It Works

### Priority System

1. **User-specific API keys** (from Admin Settings) - Highest priority
2. **Environment variables** (Render backend) - Fallback
3. **Error** if neither is configured

### Provider Selection

Each agent uses the keys based on your **AI Provider Preference**:
- **Auto**: Tries OpenAI first, falls back to Gemini if OpenAI fails
- **OpenAI**: Uses only OpenAI (requires OpenAI key)
- **Gemini**: Uses only Gemini (requires Gemini key)

## Security Features

✅ **API keys are never displayed** after saving
✅ **Keys are stored securely** in MongoDB (encrypted in transit)
✅ **Each user has their own keys** (not shared)
✅ **Keys are sent over HTTPS** only

## Example Setup

### Scenario: Using OpenAI for Course Structure, Gemini for Content

1. **Course Structure Agent:**
   - OpenAI Key: `sk-...` ✅
   - Gemini Key: (leave empty)

2. **Content Generation Agent:**
   - OpenAI Key: (leave empty)
   - Gemini Key: `your-gemini-key` ✅

3. **AI Provider Preference:** `auto`

Result:
- Course structure will use OpenAI
- Content generation will use Gemini
- If OpenAI fails, it will try Gemini (and vice versa)

## Troubleshooting

### "No AI provider configured" Error

**Cause:** No API keys set for the agent being used

**Solution:**
1. Go to Admin Settings
2. Add at least one API key (OpenAI or Gemini) for the agent
3. Save and try again

### "OpenAI not configured" Error

**Cause:** Trying to use OpenAI but no OpenAI key is set

**Solution:**
1. Add OpenAI API key in Admin Settings
2. OR change AI Provider Preference to "Gemini"
3. OR set AI Provider Preference to "Auto" (will try Gemini if OpenAI fails)

### Keys Not Saving

**Check:**
- Are you logged in?
- Is the backend running?
- Check browser console for errors
- Verify network connection

## Best Practices

1. **Use separate keys per agent** for better tracking and limits
2. **Set both OpenAI and Gemini** for redundancy (auto-fallback)
3. **Never share your API keys** publicly
4. **Rotate keys periodically** for security
5. **Monitor API usage** in OpenAI/Gemini dashboards

## Cost Considerations

- **OpenAI:** Pay per token (check pricing at platform.openai.com)
- **Gemini:** Free tier available, then pay per request
- Each agent uses keys independently, so costs are separate

## Need Help?

If you encounter issues:
1. Check API key status in Admin Settings
2. Verify keys are correct (no extra spaces)
3. Test keys directly in OpenAI/Gemini dashboards
4. Check Render logs for detailed error messages

---

**Ready to set up?** Go to Admin Settings and configure your API keys! 🚀

