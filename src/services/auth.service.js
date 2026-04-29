const jwt = require('jsonwebtoken')
const env = require('../config/env')
const redis = require('../config/redis')
const User = require('../models/User')
const httpStatus = require('../constants/httpStatus')
const { roles } = require('../constants/roles')
const ApiError = require('../utils/ApiError')
const { generateAuthTokens } = require('../utils')

const register = async (payload, actor = null) => {
  const userCount = await User.estimatedDocumentCount()

  if (userCount > 0 && actor.role !== roles.ADMIN) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only an admin can create internal users')
  }

  const existingUser = await User.findOne({ email: payload.email })

  if (existingUser) {
    throw new ApiError(httpStatus.CONFLICT, 'Email already registered')
  }

  const user = await User.create({
    ...payload,
    role: userCount === 0 ? roles.ADMIN : payload.role
  })
  const tokens = await generateAuthTokens(user._id.toString())

  return {
    user,
    ...tokens
  }
}

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password')

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid email or password')
  }

  if (!user.isActive) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Account is deactivated')
  }

  user.lastLoginAt = new Date()
  await user.save()

  const tokens = await generateAuthTokens(user._id.toString())

  return {
    user,
    ...tokens
  }
}

const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Refresh token is required')
  }

  let decoded

  try {
    decoded = jwt.verify(refreshToken, env.jwt.refreshSecret)
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token')
  }

  const storedToken = await redis.get(`refreshToken:${decoded.userId}`)

  if (!storedToken || storedToken !== refreshToken) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token')
  }

  const user = await User.findById(decoded.userId)

  if (!user || !user.isActive) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or inactive user')
  }

  return generateAuthTokens(user._id.toString())
}

const logout = async (userId) => {
  await redis.del(`refreshToken:${userId}`)
}

const logoutByRefreshToken = async (refreshToken) => {
  if (!refreshToken) return

  try {
    const decoded = jwt.verify(refreshToken, env.jwt.refreshSecret)
    await redis.del(`refreshToken:${decoded.userId}`)
  } catch (error) {
    // Cookie cleanup should still succeed for invalid or expired refresh tokens.
  }
}

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password')

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
  }

  const isPasswordValid = await user.comparePassword(currentPassword)

  if (!isPasswordValid) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Current password is incorrect')
  }

  user.password = newPassword
  await user.save()
  await redis.del(`refreshToken:${userId}`)

  return user
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  logoutByRefreshToken,
  changePassword
}
