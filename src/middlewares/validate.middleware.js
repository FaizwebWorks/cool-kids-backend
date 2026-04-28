const httpStatus = require('../constants/httpStatus')
const ApiError = require('../utils/ApiError')

const validate = (schema) => (req, res, next) => {
  const payload = {
    body: req.body,
    params: req.params,
    query: req.query
  }

  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true
  })

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message
    }))

    return next(new ApiError(httpStatus.BAD_REQUEST, 'Validation failed', errors))
  }

  req.body = value.body || {}
  req.params = value.params || {}
  Object.defineProperty(req, 'query', {
    value: value.query || {},
    enumerable: true,
    configurable: true,
    writable: true
  })

  return next()
}

module.exports = validate
