const httpStatus = require('../constants/httpStatus')
const bookingService = require('../services/booking.service')
const { asyncHandler, sendResponse } = require('../utils')

const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.body)
  return sendResponse(res, httpStatus.CREATED, 'Booking created successfully', booking)
})

const getAvailability = asyncHandler(async (req, res) => {
  const availability = await bookingService.getAvailability(req.query)
  return sendResponse(res, httpStatus.OK, 'Available slots fetched successfully', availability)
})

const getBookings = asyncHandler(async (req, res) => {
  const bookings = await bookingService.getBookings(req.query)
  return sendResponse(res, httpStatus.OK, 'Bookings fetched successfully', bookings)
})

const getBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id)
  return sendResponse(res, httpStatus.OK, 'Booking fetched successfully', booking)
})

const getPublicBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.getPublicBookingById(req.params.id, req.query)
  return sendResponse(res, httpStatus.OK, 'Booking fetched successfully', booking)
})

const updateBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.updateBooking(
    req.params.id,
    req.body,
    req.user._id
  )

  return sendResponse(res, httpStatus.OK, 'Booking updated successfully', booking)
})

const updateBookingStatus = asyncHandler(async (req, res) => {
  const booking = await bookingService.updateBookingStatus(
    req.params.id,
    req.body.status,
    req.body.adminNotes,
    req.user._id
  )

  return sendResponse(res, httpStatus.OK, 'Booking status updated successfully', booking)
})

const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.deleteBooking(req.params.id, req.user._id)
  return sendResponse(res, httpStatus.OK, 'Booking cancelled successfully', booking)
})

module.exports = {
  createBooking,
  getAvailability,
  getBookings,
  getBooking,
  getPublicBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking
}
