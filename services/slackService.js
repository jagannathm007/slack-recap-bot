const { WebClient } = require('@slack/web-api');

/**
 * Slack Service
 * Handles all Slack API interactions
 */
class SlackService {
  /**
   * Get Slack WebClient instance
   * @param {string} token - Access token
   * @returns {WebClient} - Slack WebClient instance
   */
  getClient(token) {
    return new WebClient(token);
  }

  /**
   * Fetch messages from a channel for a specific date
   * @param {string} token - Access token
   * @param {string} channelId - Channel ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Array>} - Array of formatted messages
   */
  async getMessagesByDate(token, channelId, date) {
    const slack = this.getClient(token);

    // Parse date and set time range (start and end of day in Unix timestamp)
    const startDate = new Date(date + 'T00:00:00Z');
    const endDate = new Date(date + 'T23:59:59Z');
    const oldest = Math.floor(startDate.getTime() / 1000);
    const latest = Math.floor(endDate.getTime() / 1000);

    // Fetch messages from the channel
    const result = await slack.conversations.history({
      channel: channelId,
      oldest: oldest,
      latest: latest,
      limit: 1000 // Maximum allowed by Slack API
    });

    if (!result.ok) {
      // Provide helpful error messages for common errors
      const errorMessages = {
        'not_in_channel': 'Bot is not a member of this channel. Please invite the bot to the channel first.',
        'channel_not_found': 'Channel not found. Please verify the channel ID is correct.',
        'invalid_auth': 'Invalid authentication. Please check your bot token.',
        'missing_scope': 'Bot token is missing required scopes. Please add the necessary scopes to your Slack app.'
      };
      
      const errorMessage = errorMessages[result.error] || result.error;
      const error = new Error(errorMessage);
      error.code = result.error;
      throw error;
    }

    // Format messages with user info
    const messages = await Promise.all(
      result.messages.map(async (message) => {
        let username = 'Unknown';
        let userId = message.user || message.bot_id || null;
        
        // Try to get user info if user ID exists
        if (message.user) {
          try {
            const userInfo = await slack.users.info({ user: message.user });
            if (userInfo.ok && userInfo.user) {
              username = userInfo.user.real_name || userInfo.user.profile?.real_name || userInfo.user.name || 'Unknown';
            }
          } catch (err) {
            // If users:read scope is missing, log a warning but continue
            if (err.data?.error === 'missing_scope') {
              console.warn(`Missing users:read scope. User names will not be available.`);
            } else {
              console.error(`Error fetching user info for ${message.user}:`, err.message || err);
            }
          }
        } else if (message.bot_id) {
          // Handle bot messages
          try {
            const botInfo = await slack.bots.info({ bot: message.bot_id });
            if (botInfo.ok && botInfo.bot) {
              username = botInfo.bot.name || 'Bot';
            }
          } catch (err) {
            username = 'Bot';
          }
        }

        return {
          text: message.text || '',
          user: username,
          userId: userId,
          botId: message.bot_id || null,
          timestamp: message.ts,
          date: new Date(parseFloat(message.ts) * 1000).toISOString(),
          type: message.type,
          subtype: message.subtype
        };
      })
    );

    return messages;
  }

  /**
   * List all available channels
   * @param {string} token - Access token
   * @returns {Promise<Array>} - Array of channel objects
   */
  async listChannels(token) {
    const slack = this.getClient(token);
    
    // Try to get both public and private channels
    let channelsResult;
    try {
      channelsResult = await slack.conversations.list({
        types: 'public_channel,private_channel',
        limit: 1000
      });
    } catch (error) {
      // If missing scope for private channels, try only public channels
      if (error.data?.error === 'missing_scope' && error.data?.needed === 'groups:read') {
        console.warn('Missing groups:read scope. Only listing public channels.');
        channelsResult = await slack.conversations.list({
          types: 'public_channel',
          limit: 1000
        });
      } else {
        throw error;
      }
    }

    if (!channelsResult.ok) {
      throw new Error(channelsResult.error);
    }

    return channelsResult.channels.map(channel => ({
      id: channel.id,
      name: channel.name,
      isPrivate: channel.is_private,
      isArchived: channel.is_archived
    }));
  }
}

module.exports = new SlackService();
