# Slack Recap

> A powerful Node.js REST API application that automatically fetches Slack channel messages by date, generates AI-powered summaries using Google Gemini, and delivers them via email. Perfect for daily recaps, team updates, and automated reporting workflows.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Usage Examples](#usage-examples)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## 🎯 Overview

Slack Recap is an automated reporting tool that helps teams stay informed by:

1. **Fetching** messages from Slack channels for specific dates
2. **Summarizing** conversations using Google's Gemini AI (free tier)
3. **Delivering** formatted summaries via email automatically

Ideal for:
- Daily team recaps
- Weekly project summaries
- Automated reporting workflows
- Keeping stakeholders informed
- Historical message analysis

## ✨ Features

- 🔐 **Slack Integration** - Secure bot token authentication
- 📅 **Date-based Filtering** - Fetch messages for any specific date
- 📋 **Channel Management** - List all available channels (public & private)
- 🤖 **AI Summarization** - Intelligent message summarization using Google Gemini
- 📧 **Email Delivery** - Automatic email delivery with HTML formatting
- 👥 **Multi-recipient Support** - Send to multiple recipients with CC support
- 🚀 **RESTful API** - Simple, clean REST endpoints
- ⚡ **Error Handling** - Comprehensive error handling with helpful messages
- 🔍 **User Information** - Displays real user names (not just IDs)
- 🛡️ **Validation** - Input validation for dates and required parameters

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Slack SDK**: @slack/web-api
- **AI Service**: Google Generative AI (Gemini)
- **Email Service**: Nodemailer (Gmail)
- **Environment**: dotenv
- **Development**: Nodemon

## 📦 Prerequisites

- **Node.js** v14 or higher
- **npm** or **yarn** package manager
- **Slack App** with Bot Token
- **Google Account** (for Gemini API key)
- **Gmail Account** (for email delivery)

## 🚀 Installation & Setup

### Step 1: Clone and Install

```bash
# Clone the repository (if applicable)
git clone <repository-url>
cd slack-recap

# Install dependencies
npm install
```

### Step 2: Create a Slack App

1. Visit [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"** → **"From scratch"**
3. Name your app (e.g., "Slack Recap") and select your workspace
4. Navigate to **OAuth & Permissions** in the sidebar
5. Add the following **Bot Token Scopes**:
   - `channels:history` - View messages in public channels
   - `channels:read` - View basic information about public channels
   - `groups:history` - View messages in private channels
   - `groups:read` - View basic information about private channels
   - `im:history` - View messages in direct messages
   - `mpim:history` - View messages in group direct messages
   - `users:read` - View user information (for displaying names)
6. Click **"Save Changes"**
7. Navigate to **Install App** and install to your workspace
8. Copy your **Bot User OAuth Token** (starts with `xoxb-`)

### Step 3: Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the API key (starts with `AIza...`)

### Step 4: Setup Gmail App Password

1. Go to your [Google Account](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification** (enable if not already)
3. Go to **App passwords** (under Security)
4. Select **"Mail"** and **"Other (Custom name)"**
5. Enter "Slack Recap" as the name
6. Click **"Generate"**
7. Copy the 16-character app password

### Step 5: Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Slack Configuration (Required)
SLACK_BOT_OAUTH_TOKEN=xoxb-your-bot-token-here

# Gemini AI Configuration (Optional - for summarization)
GEMINI_API_KEY=AIza-your-gemini-api-key-here
GEMINI_MODEL=gemini-pro  # Optional: defaults to gemini-pro

# Gmail Configuration (Optional - for email delivery)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
EMAIL_TO=recipient@example.com  # Optional: defaults to GMAIL_USER
EMAIL_CC=cc1@example.com,cc2@example.com  # Optional: comma-separated

# Company/Organization Name (Optional - for email subject)
COMPANY_NAME=Your Company Name  # Optional: used in email subject

# Server Configuration (Optional)
PORT=3000  # Optional: defaults to 3000
```

### Step 6: Run the Application

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## 📖 API Documentation

### Base URL

```
http://localhost:3000
```

### Endpoints

#### 1. Get API Information

**GET** `/`

Returns API information and available endpoints.

**Response:**
```json
{
  "message": "Slack Recap API",
  "endpoints": {
    "getMessages": "/api/messages?date=YYYY-MM-DD&channelId=CHANNEL_ID",
    "listChannels": "/api/channels"
  }
}
```

#### 2. Get Messages by Date

**GET** `/api/messages`

Fetches messages from a Slack channel for a specific date, generates an AI summary, and sends it via email.

**Query Parameters:**
- `date` (required): Date in `YYYY-MM-DD` format (e.g., `2024-01-15`)
- `channelId` (required): Slack channel ID (e.g., `C1234567890`)

**Example Request:**
```bash
curl "http://localhost:3000/api/messages?date=2024-01-15&channelId=C1234567890"
```

**Response:**
```json
{
  "date": "2024-01-15",
  "channelId": "C1234567890",
  "messageCount": 5,
  "messages": [
    {
      "text": "Hello world!",
      "user": "John Doe",
      "userId": "U1234567890",
      "botId": null,
      "timestamp": "1705276800.123456",
      "date": "2024-01-15T00:00:00.000Z",
      "type": "message",
      "subtype": null
    }
  ],
  "summary": "Summary of the messages generated by Gemini AI...",
  "emailSent": true,
  "emailMessageId": "<message-id>"
}
```

**Response Fields:**
- `date`: The requested date
- `channelId`: The Slack channel ID
- `messageCount`: Number of messages found
- `messages`: Array of message objects with user info
- `summary`: AI-generated summary (null if Gemini not configured)
- `emailSent`: Boolean indicating if email was sent
- `emailMessageId`: Email message ID (if sent successfully)
- `summaryError`: Error message if summarization failed (optional)
- `emailError`: Error message if email sending failed (optional)

**Note:** The API will:
1. Fetch messages from Slack (00:00:00 to 23:59:59 UTC for the specified date)
2. Summarize them using Gemini AI (if `GEMINI_API_KEY` is configured)
3. Send the summary via email (if Gmail credentials are configured)
4. Return all data including the summary and email status

#### 3. List Available Channels

**GET** `/api/channels`

Lists all available channels (public and private) that the bot has access to.

**Example Request:**
```bash
curl "http://localhost:3000/api/channels"
```

**Response:**
```json
{
  "channels": [
    {
      "id": "C1234567890",
      "name": "general",
      "isPrivate": false,
      "isArchived": false
    },
    {
      "id": "C0987654321",
      "name": "private-team",
      "isPrivate": true,
      "isArchived": false
    }
  ]
}
```

## 💡 Usage Examples

### Basic Workflow

```bash
# 1. List all available channels
curl http://localhost:3000/api/channels

# 2. Get messages for a specific date
curl "http://localhost:3000/api/messages?date=2024-01-15&channelId=C1234567890"
```

### Using with JavaScript/Node.js

```javascript
const axios = require('axios');

// List channels
const channels = await axios.get('http://localhost:3000/api/channels');
console.log(channels.data);

// Get messages
const messages = await axios.get('http://localhost:3000/api/messages', {
  params: {
    date: '2024-01-15',
    channelId: 'C1234567890'
  }
});
console.log(messages.data);
```

### Using with Python

```python
import requests

# List channels
channels = requests.get('http://localhost:3000/api/channels')
print(channels.json())

# Get messages
messages = requests.get('http://localhost:3000/api/messages', params={
    'date': '2024-01-15',
    'channelId': 'C1234567890'
})
print(messages.json())
```

## 📁 Project Structure

```
slack-recap/
├── config/
│   └── env.js              # Environment configuration
├── controllers/
│   ├── channelsController.js  # Channel listing logic
│   └── messagesController.js  # Message fetching & processing logic
├── middleware/
│   ├── auth.js             # Authentication middleware
│   └── errorHandler.js     # Error handling middleware
├── routes/
│   ├── index.js            # Root routes
│   └── apiRoutes.js        # API routes
├── services/
│   ├── slackService.js     # Slack API integration
│   ├── geminiService.js    # Gemini AI integration
│   └── emailService.js     # Email delivery service
├── utils/
│   └── validators.js       # Input validation utilities
├── server.js               # Express server setup
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## 🔍 How to Get Channel ID

### Method 1: From Slack URL

1. Open Slack in your browser
2. Navigate to the channel
3. Look at the URL: `https://yourworkspace.slack.com/archives/C1234567890`
4. The part after `/archives/` is the channel ID

### Method 2: Using the API

Use the `/api/channels` endpoint to list all channels with their IDs:

```bash
curl http://localhost:3000/api/channels
```

## ⚠️ Important Notes

- **Bot Membership**: The bot must be a member of the channel to fetch messages
  - **Public channels**: Invite the bot using `/invite @YourBotName` in the channel
  - **Private channels**: Add the bot via channel settings → Integrations → Add apps
- **Date Range**: Messages are fetched for the entire day (00:00:00 to 23:59:59 UTC)
- **Optional Services**: 
  - If Gemini is not configured, messages will be returned without summary
  - If Gmail is not configured, messages will be returned without email delivery
- **Rate Limits**: Google Gemini free tier has rate limits - wait a few minutes if you hit the limit
- **Message Limit**: Slack API returns up to 1000 messages per request

## 🐛 Troubleshooting

### Authentication Issues

#### "SLACK_BOT_OAUTH_TOKEN is required" error
- ✅ Ensure `SLACK_BOT_OAUTH_TOKEN` is set in your `.env` file
- ✅ Verify the token starts with `xoxb-`
- ✅ Restart the server after adding the token

#### "invalid_auth" error
- ✅ Your token may be invalid or expired
- ✅ Generate a new token from your Slack App settings
- ✅ Ensure the token has all required scopes

### Channel Access Issues

#### "not_in_channel" error
- ✅ The bot is not a member of the channel
- ✅ **For public channels**: Type `/invite @YourBotName` in the channel
- ✅ **For private channels**: 
  1. Open the private channel
  2. Click the channel name at the top
  3. Go to "Integrations" tab
  4. Click "Add apps" and select your bot

#### "channel_not_found" error
- ✅ Verify the channel ID is correct
- ✅ Ensure the channel exists and the bot has access
- ✅ Use `/api/channels` endpoint to get correct channel IDs

### Scope Issues

#### "missing_scope" error
- ✅ The bot token is missing a required scope
- ✅ Go to Slack App → **OAuth & Permissions** → **Bot Token Scopes**
- ✅ Add the missing scope (e.g., `groups:read`, `users:read`)
- ✅ Reinstall the app to your workspace to apply new scopes

#### User names not showing
- ✅ The bot token is missing the `users:read` scope
- ✅ Add `users:read` scope and reinstall the app

### AI Summarization Issues

#### Summary not generated
- ✅ Check if `GEMINI_API_KEY` is set in your `.env` file
- ✅ Verify the API key is correct and active
- ✅ Check the console for Gemini API errors
- ✅ Wait a few minutes if you hit rate limits (free tier)

### Email Issues

#### Email not sent
- ✅ Check if `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set
- ✅ Ensure you're using an **App Password**, not your regular Gmail password
- ✅ Verify 2-Step Verification is enabled on your Google account
- ✅ Check the console for email sending errors
- ✅ Ensure `EMAIL_TO` is set (defaults to `GMAIL_USER` if not specified)
- ✅ For CC recipients, use `EMAIL_CC` with comma-separated emails

### General Issues

#### Server not starting
- ✅ Check if PORT is available (default: 3000)
- ✅ Verify all required dependencies are installed (`npm install`)
- ✅ Check for syntax errors in `.env` file

#### Messages not found
- ✅ Verify the date format is `YYYY-MM-DD`
- ✅ Check if there were messages on that date
- ✅ Ensure the bot has access to the channel
- ✅ Check if the date is in the past (Slack doesn't allow future dates)

## 📝 License

ISC

---

**Made with ❤️ for better team communication**
