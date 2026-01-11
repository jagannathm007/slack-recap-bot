const express = require('express');
const router = express.Router();

/**
 * Root endpoint - API information
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Slack Summer API',
    endpoints: {
      getMessages: '/api/messages?date=YYYY-MM-DD&channelId=CHANNEL_ID',
      listChannels: '/api/channels'
    }
  });
});

module.exports = router;
