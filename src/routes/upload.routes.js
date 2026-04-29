const router = require('express').Router()
const uploadController = require('../controllers/upload.controller')
const uploadValidation = require('../validations/upload.validation')
const { authMiddleware, authorizeRoles, uploadSingleImage, validate } = require('../middlewares')
const { roles } = require('../constants/roles')

const requireInternalUser = [
  authMiddleware,
  authorizeRoles(roles.ADMIN, roles.STAFF)
]

router.get('/images', requireInternalUser, validate(uploadValidation.listAssets), uploadController.getAssets)
router.post(
  '/images',
  requireInternalUser,
  uploadSingleImage('image'),
  validate(uploadValidation.uploadImage),
  uploadController.uploadImage
)

module.exports = router
