const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/env');

/**
 * Gemini Service
 * Handles AI summarization using Google's Gemini API
 */
class GeminiService {
  constructor() {
    if (!config.gemini.apiKey) {
      console.warn('GEMINI_API_KEY not configured. Summarization will not work.');
      this.client = null;
    } else {
      this.client = new GoogleGenerativeAI(config.gemini.apiKey);
    }
  }

  /**
   * Summarize messages using Gemini AI
   * @param {Array} messages - Array of message objects
   * @param {string} date - Date of the messages
   * @param {string} channelId - Channel ID
   * @returns {Promise<string>} - Summarized text
   */
  async summarizeMessages(messages, date, channelId) {
    if (!this.client) {
      throw new Error('Gemini API key not configured');
    }

    if (!messages || messages.length === 0) {
      return 'No messages found for this date.';
    }

    // Format messages for summarization
    const messagesText = messages
      .map((msg, index) => {
        const user = msg.user || 'Unknown';
        const text = msg.text || '(no text)';
        return `${index + 1}. [${user}]: ${text}`;
      })
      .join('\n');

    const prompt = `Please provide a concise report of the following Slack channel messages from ${date}. 
Focus on tasks, keys.

Messages:
${messagesText}

Provide a well-structured below mentioned:

*Name*
- Task or Report
- Task or Report

Keep the summary clear and professional.`;

    try {
      const model = this.client.getGenerativeModel({ model: config.gemini.model });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error summarizing with Gemini:', error);
      throw new Error(`Failed to summarize messages: ${error.message}`);
    }
  }
}

module.exports = new GeminiService();
