const slackService = require('../services/slackService');
const geminiService = require('../services/geminiService');
const emailService = require('../services/emailService');
const { validateDate, validateRequired } = require('../utils/validators');

/**
 * Get messages by date, summarize, and send via email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getMessagesByDate(req, res) {
  const { date, channelId } = req.query;
  const token = req.token;

  // Validate required parameters
  const requiredError = validateRequired({ date, channelId }, ['date', 'channelId']);
  if (requiredError) {
    return res.status(400).json(requiredError);
  }

  // Validate date format
  if (!validateDate(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  try {
    // Fetch messages from Slack
    const messages = await slackService.getMessagesByDate(token, channelId, date);

    // Prepare response
    const response = {
      date: date,
      channelId: channelId,
      messageCount: messages.length,
      messages: messages,
      summary: null,
      emailSent: false
    };

    // Summarize messages using Gemini (if configured)
    let summary = null;
    try {
      if (messages.length > 0) {
        summary = await geminiService.summarizeMessages(messages, date, channelId);
        response.summary = summary;
      } else {
        summary = 'No messages found for this date.';
        response.summary = summary;
      }
    } catch (error) {
      console.error('Error summarizing messages:', error);
      response.summaryError = error.message;
    }

    // Send email with summary (if configured)
    if (summary) {
      try {
        const emailResult = await emailService.sendSummary(
          summary,
          date,
          channelId,
          messages.length
        );
        response.emailSent = true;
        response.emailMessageId = emailResult.messageId;
      } catch (error) {
        console.error('Error sending email:', error);
        response.emailError = error.message;
      }
    }

    // Return response immediately (don't wait for email)
    res.json(response);
  } catch (error) {
    console.error('Error fetching messages:', error);
    
    // Handle specific Slack API errors with appropriate status codes
    let statusCode = 500;
    if (error.code === 'not_in_channel' || error.code === 'channel_not_found') {
      statusCode = 404;
    } else if (error.code === 'invalid_auth' || error.code === 'missing_scope') {
      statusCode = 401;
    }
    
    res.status(statusCode).json({
      error: error.message || 'Failed to fetch messages',
      code: error.code || 'unknown_error'
    });
  }
}

module.exports = {
  getMessagesByDate
};
