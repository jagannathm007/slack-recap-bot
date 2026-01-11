const slackService = require('../services/slackService');

/**
 * List available channels
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function listChannels(req, res) {
  const token = req.token;

  try {
    const channels = await slackService.listChannels(token);

    res.json({
      channels: channels
    });
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({
      error: 'Failed to fetch channels',
      details: error.message
    });
  }
}

module.exports = {
  listChannels
};
