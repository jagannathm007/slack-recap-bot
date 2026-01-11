const nodemailer = require('nodemailer');
const config = require('../config/env');

/**
 * Email Service
 * Handles sending emails using Gmail via nodemailer
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize nodemailer transporter
   */
  initializeTransporter() {
    if (!config.email.from || !config.email.password) {
      console.warn('Gmail credentials not configured. Email sending will not work.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.email.from,
        pass: config.email.password
      }
    });
  }

  /**
   * Send email with summarized messages
   * @param {string} summary - Summarized text
   * @param {string} date - Date of the messages
   * @param {string} channelId - Channel ID
   * @param {number} messageCount - Number of messages
   * @returns {Promise<Object>} - Email send result
   */
  async sendSummary(summary, date, channelId, messageCount) {
    if (!this.transporter) {
      throw new Error('Email service not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD.');
    }

    // Prepare CC recipients (support comma-separated list)
    let ccRecipients = null;
    if (config.email.cc) {
      // Split by comma and trim whitespace, filter out empty strings
      ccRecipients = config.email.cc
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);
      
      // If only one valid email, use string; otherwise use array
      if (ccRecipients.length === 1) {
        ccRecipients = ccRecipients[0];
      } else if (ccRecipients.length === 0) {
        ccRecipients = null;
      }
    }

    const mailOptions = {
      from: config.email.from,
      to: config.email.to,
      ...(ccRecipients && { cc: ccRecipients }),
      subject: `${config.companyName} Report Summary - ${date}`,
      html: `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 800px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4A154B; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
              .info { background-color: #e8f4f8; padding: 15px; border-left: 4px solid #4A154B; margin: 20px 0; }
              .summary { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; white-space: pre-wrap; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Report Summary</h1>
              </div>
              <div class="content">
                <div class="info">
                  <strong>Date:</strong> ${date}<br>
                  <strong>Channel ID:</strong> ${channelId}
                </div>
                <div class="summary">
                  ${summary.replace(/\n/g, '<br>')}
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
${config.companyName} Report Summary - ${date}

Summary:
${summary}`
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}

module.exports = new EmailService();
