const User = require('../models/User')
const { roles } = require('../constants/roles')
const authMiddleware = require('./auth.middleware')
const authorizeRoles = require('./role.middleware')

const bootstrapOrAdmin = async (req, res, next) => {
  const userCount = await User.estimatedDocumentCount()

  if (userCount === 0) {
    return next()
  }

  return authMiddleware(req, res, (authError) => {
    if (authError) {
      return next(authError)
    }

    return authorizeRoles(roles.ADMIN)(req, res, next)
  })
}

module.exports = bootstrapOrAdmin
