/**
 * 404 Not Found middleware
 * Handles requests to non-existent routes following RESTful conventions
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
};

module.exports = notFound;
