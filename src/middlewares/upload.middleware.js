const multer = require('multer')
const httpStatus = require('../constants/httpStatus')
const ApiError = require('../utils/ApiError')

const allowedImageMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif'
])

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1
  },
  fileFilter(req, file, callback) {
    if (!allowedImageMimeTypes.has(file.mimetype)) {
      return callback(new ApiError(httpStatus.BAD_REQUEST, 'Only JPG, PNG, WebP, and AVIF images are allowed'))
    }

    return callback(null, true)
  }
})

const handleMulterError = (err, req, res, next) => {
  if (!err) return next()

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(httpStatus.PAYLOAD_TOO_LARGE, 'Image size must be 10MB or less'))
    }

    return next(new ApiError(httpStatus.BAD_REQUEST, err.message))
  }

  return next(err)
}

const uploadSingleImage = (fieldName = 'image') => [
  imageUpload.single(fieldName),
  handleMulterError
]

module.exports = {
  uploadSingleImage
}
