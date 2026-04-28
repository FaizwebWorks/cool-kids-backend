const redis = require('../config/redis')
const httpStatus = require('../constants/httpStatus')
const ApiError = require('../utils/ApiError')

const rateLimit = (options = {}) => {
  const {
    windowMs = 60 * 1000,
    max = 100,
    prefix = 'rate-limit'
  } = options

  return async (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown'
    const key = `${prefix}:${ip}`

    try {
      const current = await redis.incr(key)

      if (current === 1) {
        await redis.expire(key, Math.ceil(windowMs / 1000))
      }

      if (current > max) {
        return next(new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many requests'))
      }

      return next()
    } catch (error) {
      if (error instanceof ApiError) {
        return next(error)
      }

      return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Rate limiter unavailable'))
    }
  }
}

module.exports = rateLimit
