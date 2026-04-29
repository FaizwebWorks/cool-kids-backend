const env = require('../config/env')
const httpStatus = require('../constants/httpStatus')

const errorHandler = (err, req, res, next) => {
  const isPayloadTooLarge = err.type === 'entity.too.large' || err.status === httpStatus.PAYLOAD_TOO_LARGE
  const statusCode = isPayloadTooLarge
    ? httpStatus.PAYLOAD_TOO_LARGE
    : err.statusCode || httpStatus.INTERNAL_SERVER_ERROR
  const message = isPayloadTooLarge
    ? 'Request body is too large. Upload images as multipart/form-data and keep each image under 10MB.'
    : err.isOperational ? err.message : 'Internal server error'

  if (!err.isOperational || env.nodeEnv === 'development') {
    console.error(err)
  }

  const response = {
    success: false,
    message
  }

  if (isPayloadTooLarge) {
    response.errors = [
      {
        field: 'image',
        message: 'Use multipart/form-data with field name "image". Maximum image size is 10MB.'
      }
    ]
  }

  if (!isPayloadTooLarge && err.errors && err.errors.length > 0) {
    response.errors = err.errors
  }

  if (env.nodeEnv === 'development' && err.stack) {
    response.stack = err.stack
  }

  return res.status(statusCode).json(response)
}

module.exports = errorHandler
