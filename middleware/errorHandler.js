/**
 * Error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err.stack);
  
  // Default error
  let status = 500;
  let message = 'Something went wrong!';

  // Handle specific error types
  if (err.message.includes('Not authenticated')) {
    status = 401;
    message = err.message;
  } else if (err.message.includes('parameter is required') || err.message.includes('Invalid')) {
    status = 400;
    message = err.message;
  } else if (err.message) {
    message = err.message;
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { details: err.stack })
  });
}

module.exports = errorHandler;
