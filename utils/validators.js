/**
 * Validation utilities
 */

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} date - Date string to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateDate(date) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return false;
  }

  // Check if date is valid
  const parsedDate = new Date(date + 'T00:00:00Z');
  return parsedDate instanceof Date && !isNaN(parsedDate);
}

/**
 * Validate required parameters
 * @param {Object} params - Parameters object
 * @param {Array<string>} required - Array of required parameter names
 * @returns {Object|null} - Error object if validation fails, null otherwise
 */
function validateRequired(params, required) {
  for (const param of required) {
    if (!params[param]) {
      return {
        error: `${param} parameter is required`
      };
    }
  }
  return null;
}

module.exports = {
  validateDate,
  validateRequired
};
