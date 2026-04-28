const httpStatus = require('../constants/httpStatus')
const ApiError = require('../utils/ApiError')

const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required'))
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to perform this action'))
  }

  return next()
}

module.exports = authorizeRoles
