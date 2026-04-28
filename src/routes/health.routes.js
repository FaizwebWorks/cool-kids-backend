const router = require('express').Router()
const httpStatus = require('../constants/httpStatus')
const { asyncHandler, sendResponse } = require('../utils')

router.get('/', asyncHandler(async (req, res) => {
  return sendResponse(res, httpStatus.OK, 'The Cool Kids API is running', {
    service: 'the-cool-kids-backend',
    uptime: process.uptime()
  })
}))

module.exports = router
