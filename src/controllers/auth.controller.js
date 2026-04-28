const httpStatus = require('../constants/httpStatus')
const authService = require('../services/auth.service')
const { asyncHandler, sendResponse } = require('../utils')

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body, req.user)
  return sendResponse(res, httpStatus.CREATED, 'Registration successful', result)
})

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body)
  return sendResponse(res, httpStatus.OK, 'Login successful', result)
})

const refresh = asyncHandler(async (req, res) => {
  const tokens = await authService.refresh(req.body.refreshToken)
  return sendResponse(res, httpStatus.OK, 'Token refreshed successfully', tokens)
})

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id.toString())
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
