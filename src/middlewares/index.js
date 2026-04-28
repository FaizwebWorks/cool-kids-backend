const validate = require('./validate.middleware')
const rateLimit = require('./rateLimit.middleware')
const notFound = require('./notFound.middleware')
const errorHandler = require('./error.middleware')
const authMiddleware = require('./auth.middleware')
const optionalAuthMiddleware = require('./optionalAuth.middleware')
const authorizeRoles = require('./role.middleware')
const bootstrapOrAdmin = require('./bootstrapAdmin.middleware')

module.exports = {
  validate,
  rateLimit,
  notFound,
  errorHandler,
  authMiddleware,
  optionalAuthMiddleware,
  authorizeRoles,
  bootstrapOrAdmin
}
