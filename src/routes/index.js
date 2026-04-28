const router = require('express').Router()
const healthRoutes = require('./health.routes')
const authRoutes = require('./auth.routes')
const bookingRoutes = require('./booking.routes')

router.use('/health', healthRoutes)
router.use('/auth', authRoutes)
router.use('/bookings', bookingRoutes)

module.exports = router
