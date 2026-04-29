const router = require('express').Router()
const serviceController = require('../controllers/service.controller')
const serviceValidation = require('../validations/service.validation')
const { authMiddleware, authorizeRoles, uploadSingleImage, validate } = require('../middlewares')
const { roles } = require('../constants/roles')

const requireInternalUser = [
  authMiddleware,
  authorizeRoles(roles.ADMIN, roles.STAFF)
]

router.get('/', serviceController.getPublicServices)
router.get('/admin/all', requireInternalUser, validate(serviceValidation.listServices), serviceController.getAdminServices)
router.get('/:slug', validate(serviceValidation.serviceSlug), serviceController.getPublicServiceBySlug)
router.post('/', requireInternalUser, validate(serviceValidation.createService), serviceController.createService)
router.patch('/:id/cover-image', requireInternalUser, uploadSingleImage('image'), validate(serviceValidation.serviceId), serviceController.updateServiceCoverImage)
router.patch('/:id', requireInternalUser, validate(serviceValidation.updateService), serviceController.updateService)
router.patch('/:id/status', requireInternalUser, validate(serviceValidation.updateServiceStatus), serviceController.updateServiceStatus)
router.delete('/:id', requireInternalUser, validate(serviceValidation.serviceId), serviceController.deleteService)

module.exports = router
