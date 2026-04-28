const env = require('../config/env')
const httpStatus = require('../constants/httpStatus')

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR
  const message = err.isOperational ? err.message : 'Internal server error'

  if (!err.isOperational || env.nodeEnv === 'development') {
    console.error(err)
  }

  const response = {
    success: false,
    message
  }

  if (err.errors && err.errors.length > 0) {
    response.errors = err.errors
  }

  if (env.nodeEnv === 'development' && err.stack) {
    response.stack = err.stack
  }

  return res.status(statusCode).json(response)
}

module.exports = errorHandler
