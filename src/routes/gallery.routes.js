const router = require('express').Router()
const galleryController = require('../controllers/gallery.controller')
const galleryValidation = require('../validations/gallery.validation')
const { authMiddleware, authorizeRoles, validate } = require('../middlewares')
const { roles } = require('../constants/roles')

const requireInternalUser = [
  authMiddleware,
  authorizeRoles(roles.ADMIN, roles.STAFF)
]

router.get('/', galleryController.getPublicGalleryItems)
router.get('/admin/all', requireInternalUser, validate(galleryValidation.listGalleryItems), galleryController.getAdminGalleryItems)
router.post('/', requireInternalUser, validate(galleryValidation.createGalleryItem), galleryController.createGalleryItem)
router.patch('/:id', requireInternalUser, validate(galleryValidation.updateGalleryItem), galleryController.updateGalleryItem)
router.patch('/:id/status', requireInternalUser, validate(galleryValidation.updateGalleryItemStatus), galleryController.updateGalleryItemStatus)
router.delete('/:id', requireInternalUser, validate(galleryValidation.galleryItemId), galleryController.deleteGalleryItem)

module.exports = router
