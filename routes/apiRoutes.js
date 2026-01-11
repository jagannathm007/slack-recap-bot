const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const messagesController = require('../controllers/messagesController');
const channelsController = require('../controllers/channelsController');

// All API routes require authentication
router.use(requireAuth);

router.get('/messages', messagesController.getMessagesByDate);
router.get('/channels', channelsController.listChannels);

module.exports = router;
