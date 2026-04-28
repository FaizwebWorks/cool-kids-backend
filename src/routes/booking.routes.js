const router = require('express').Router()
const bookingController = require('../controllers/booking.controller')
const bookingValidation = require('../validations/booking.validation')
const { authMiddleware, authorizeRoles, validate } = require('../middlewares')
const { roles } = require('../constants/roles')

const requireInternalUser = [
  authMiddleware,
  authorizeRoles(roles.ADMIN, roles.STAFF)
]

router.post('/', validate(bookingValidation.createBooking), bookingController.createBooking)
router.get('/availability', validate(bookingValidation.availability), bookingController.getAvailability)
router.get('/public/:id', validate(bookingValidation.publicBookingDetail), bookingController.getPublicBooking)
router.get('/', requireInternalUser, validate(bookingValidation.listBookings), bookingController.getBookings)
router.get('/:id', requireInternalUser, validate(bookingValidation.bookingId), bookingController.getBooking)
router.patch('/:id', requireInternalUser, validate(bookingValidation.updateBooking), bookingController.updateBooking)
router.patch('/:id/status', requireInternalUser, validate(bookingValidation.updateBookingStatus), bookingController.updateBookingStatus)
router.delete('/:id', requireInternalUser, validate(bookingValidation.bookingId), bookingController.deleteBooking)

module.exports = router
