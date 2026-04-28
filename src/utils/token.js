const jwt = require('jsonwebtoken')
const env = require('../config/env')
const redis = require('../config/redis')

const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60

const signAccessToken = (userId) => {
  return jwt.sign({ userId }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn
  })
}

const signRefreshToken = (userId) => {
  return jwt.sign({ userId }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn
  })
}

const generateAuthTokens = async (userId) => {
  const accessToken = signAccessToken(userId)
  const refreshToken = signRefreshToken(userId)

  await redis.setex(`refreshToken:${userId}`, REFRESH_TOKEN_TTL_SECONDS, refreshToken)

  return {
    accessToken,
    refreshToken
  }
}

module.exports = {
  generateAuthTokens,
  signAccessToken,
  signRefreshToken
}
