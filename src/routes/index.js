const router = require('express').Router()
const healthRoutes = require('./health.routes')
const authRoutes = require('./auth.routes')
const bookingRoutes = require('./booking.routes')
const serviceRoutes = require('./service.routes')
const uploadRoutes = require('./upload.routes')

router.use('/health', healthRoutes)
router.use('/auth', authRoutes)
router.use('/bookings', bookingRoutes)
router.use('/services', serviceRoutes)
router.use('/uploads', uploadRoutes)

module.exports = router
