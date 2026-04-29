const router = require('express').Router()
const authController = require('../controllers/auth.controller')
const authValidation = require('../validations/auth.validation')
const { authMiddleware, bootstrapOrAdmin, optionalAuthMiddleware, rateLimit, validate } = require('../middlewares')

router.post('/register', rateLimit({ windowMs: 15 * 60 * 1000, max: 5, prefix: 'auth-register' }), bootstrapOrAdmin, validate(authValidation.register), authController.register)
router.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 5, prefix: 'auth-login' }), validate(authValidation.login), authController.login)
router.post('/refresh', validate(authValidation.refresh), authController.refresh)
router.post('/logout', optionalAuthMiddleware, authController.logout)
router.get('/me', authMiddleware, authController.getMe)
router.patch('/change-password', authMiddleware, validate(authValidation.changePassword), authController.changePassword)

module.exports = router
