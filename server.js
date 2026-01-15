require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const schedulerService = require('./services/schedulerService');

// Import routes
const indexRoutes = require('./routes/index');
const apiRoutes = require('./routes/apiRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', indexRoutes);
app.use('/api', apiRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Slack Summer server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
  
  // Start scheduler if enabled
  try {
    schedulerService.start();
  } catch (error) {
    console.error('Failed to start scheduler:', error.message);
  }
});

module.exports = app;
