const httpStatus = require('../constants/httpStatus')
const env = require('../config/env')
const authService = require('../services/auth.service')
const { asyncHandler, sendResponse } = require('../utils')

const REFRESH_COOKIE_NAME = 'refreshToken'

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/v1/auth'
}

const clearRefreshCookieOptions = {
  httpOnly: refreshCookieOptions.httpOnly,
  secure: refreshCookieOptions.secure,
  sameSite: refreshCookieOptions.sameSite,
  path: refreshCookieOptions.path
}

const getCookieValue = (req, name) => {
  const cookies = String(req.headers.cookie || '').split(';')
  const prefix = `${name}=`
  const cookie = cookies.find((item) => item.trim().startsWith(prefix))

  if (!cookie) return null

  return decodeURIComponent(cookie.trim().slice(prefix.length))
}

const getRefreshTokenFromRequest = (req) => {
  return req.body.refreshToken || getCookieValue(req, REFRESH_COOKIE_NAME)
}

const setRefreshCookie = (res, refreshToken) => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions)
}

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, clearRefreshCookieOptions)
}

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body, req.user)
  return sendResponse(res, httpStatus.CREATED, 'Registration successful', result)
})

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body)
  setRefreshCookie(res, result.refreshToken)

  return sendResponse(res, httpStatus.OK, 'Login successful', {
    user: result.user,
    accessToken: result.accessToken
  })
})

const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(getRefreshTokenFromRequest(req))
  setRefreshCookie(res, result.refreshToken)

  return sendResponse(res, httpStatus.OK, 'Token refreshed successfully', {
    accessToken: result.accessToken
  })
})

const logout = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshTokenFromRequest(req)

  if (req.user?._id) {
    await authService.logout(req.user._id.toString())
  } else if (refreshToken) {
    await authService.logoutByRefreshToken(refreshToken)
  }

  clearRefreshCookie(res)
  return sendResponse(res, httpStatus.OK, 'Logout successful')
})

const getMe = asyncHandler(async (req, res) => {
  return sendResponse(res, httpStatus.OK, 'Profile fetched successfully', {
    user: req.user
  })
})

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(
    req.user._id.toString(),
    req.body.currentPassword,
    req.body.newPassword
  )

  return sendResponse(res, httpStatus.OK, 'Password changed successfully')
})

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  changePassword
}
