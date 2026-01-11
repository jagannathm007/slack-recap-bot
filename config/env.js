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
  }
};
