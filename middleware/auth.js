const config = require('../config/env');

/**
 * Middleware to check if user is authenticated
 * Requires SLACK_BOT_OAUTH_TOKEN to be configured
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function requireAuth(req, res, next) {
  if (!config.slack.botToken) {
    return res.status(401).json({
      error: 'SLACK_BOT_OAUTH_TOKEN is required. Please add it to your .env file.'
    });
  }

  // Attach token to request for use in controllers
  req.token = config.slack.botToken;
  req.userId = 'bot';
  next();
}

module.exports = {
  requireAuth
};
