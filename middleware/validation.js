const { validationResult } = require("express-validator");

/**
 * Validation middleware
 * Checks for validation errors and returns appropriate error response
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));

    return res.status(400).json({
      error: true,
      message: "Validation failed",
      statusCode: 400,
      timestamp: new Date().toISOString(),
      errors: errorMessages,
    });
  }

  next();
};

module.exports = validate;
