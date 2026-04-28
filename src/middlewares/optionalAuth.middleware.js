const jwt = require('jsonwebtoken')
const env = require('../config/env')
const User = require('../models/User')

const optionalAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next()
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret)
    const user = await User.findById(decoded.userId)

    if (user && user.isActive) {
      req.user = user
    }
  } catch (error) {
    // Registration bootstrapping should remain usable without a token.
  }

  return next()
}

module.exports = optionalAuthMiddleware
