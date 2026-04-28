const jwt = require('jsonwebtoken')
const env = require('../config/env')
const httpStatus = require('../constants/httpStatus')
const ApiError = require('../utils/ApiError')
const User = require('../models/User')

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'No token provided'))
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret)
    const user = await User.findById(decoded.userId)

    if (!user || !user.isActive) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or inactive user'))
    }

    req.user = user
    return next()
  } catch (error) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token'))
  }
}

module.exports = authMiddleware
