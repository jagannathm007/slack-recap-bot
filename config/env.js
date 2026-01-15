require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  companyName: process.env.COMPANY_NAME,
  slack: {
    botToken: process.env.SLACK_BOT_OAUTH_TOKEN
  },
  gemini: {
    model: process.env.GEMINI_MODEL,
    apiKey: process.env.GEMINI_API_KEY
  },
  email: {
    from: process.env.GMAIL_USER,
    password: process.env.GMAIL_APP_PASSWORD,
    to: process.env.EMAIL_TO || process.env.GMAIL_USER,
    cc: process.env.EMAIL_CC || null // Comma-separated list of CC recipients
  },
  scheduler: {
    enabled: process.env.SCHEDULER_ENABLED === 'true' || false,
    channelId: process.env.SCHEDULER_CHANNEL_ID || null,
    time: process.env.SCHEDULER_TIME || '20:00', // Default 8 PM in HH:MM format (24-hour)
    timezone: process.env.SCHEDULER_TIMEZONE || 'Asia/Kolkata' // IST timezone
  }
};
