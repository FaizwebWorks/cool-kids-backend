const Booking = require('../models/Booking')
const httpStatus = require('../constants/httpStatus')
const ApiError = require('../utils/ApiError')
const { bookingStatuses } = require('../constants/booking')
const availabilityService = require('./availability.service')
const emailService = require('./email.service')
const googleCalendarService = require('./googleCalendar.service')
const serviceService = require('./service.service')

const toDateOnly = (date) => {
  if (date instanceof Date) {
    return date.toISOString().slice(0, 10)
  }

  return String(date).slice(0, 10)
}

const createBooking = async (payload) => {
  const preferredDate = toDateOnly(payload.preferredDate)
  const preferredTime = availabilityService.normalizeDisplayTime(payload.preferredTime)
  const serviceSnapshot = await serviceService.buildBookingServiceSnapshot(payload)
  const isAvailable = await availabilityService.assertSlotAvailable({
    date: preferredDate,
    preferredTime,
    serviceSlug: serviceSnapshot.serviceSlug,
    package: serviceSnapshot.packageName
  })

  if (!isAvailable) {
    throw new ApiError(httpStatus.CONFLICT, 'Selected date and time slot is not available')
  }

  const booking = await Booking.create({
    ...payload,
    service: serviceSnapshot.serviceTitle,
    serviceId: serviceSnapshot.serviceId,
    serviceSlug: serviceSnapshot.serviceSlug,
    package: serviceSnapshot.packageName,
    packageSnapshot: serviceSnapshot.packageSnapshot,
    preferredDate,
    preferredTime,
    status: bookingStatuses.PENDING
  })

  const calendarEvent = await googleCalendarService.createBookingEvent({
    booking,
    durationMinutes: serviceSnapshot.durationMinutes
  })
  const emailNotifications = await emailService.notifyBookingCreated(booking)

  return {
    ...booking.toObject(),
    calendarEventId: calendarEvent?.id || null,
    emailNotifications
  }
}

const getAvailability = async (filters) => {
  return availabilityService.getAvailability(filters)
}

const getBookings = async ({ status, service, serviceSlug, page = 1, limit = 10 }) => {
  const query = {}

  if (status) {
    query.status = status
  }

  if (service) {
    query.service = new RegExp(`^${String(service).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
  }

  if (serviceSlug) {
    query.serviceSlug = serviceSlug
  }

  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    Booking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(query)
  ])

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1
    }
  }
}

const getBookingById = async (bookingId) => {
  const booking = await Booking.findById(bookingId).lean()

  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found')
  }

  return booking
}

const getPublicBookingById = async (bookingId, { clientEmail, clientPhone }) => {
  const query = { _id: bookingId }

  if (clientEmail) {
    query.clientEmail = clientEmail.toLowerCase()
  }

  if (clientPhone) {
    query.clientPhone = clientPhone
  }

  const booking = await Booking.findOne(query)
    .select('-adminNotes -handledBy -__v')
    .lean()

  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found for the provided details')
  }

  return booking
}

const updateBooking = async (bookingId, payload, userId) => {
  const existingBooking = await Booking.findById(bookingId)

  if (!existingBooking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found')
  }

  const updates = { ...payload }
  const shouldCheckAvailability = (
    Object.prototype.hasOwnProperty.call(payload, 'preferredDate') ||
    Object.prototype.hasOwnProperty.call(payload, 'preferredTime') ||
    Object.prototype.hasOwnProperty.call(payload, 'package') ||
    Object.prototype.hasOwnProperty.call(payload, 'service') ||
    Object.prototype.hasOwnProperty.call(payload, 'serviceSlug')
  )

  if (shouldCheckAvailability) {
    const requestedService = {
      service: payload.service || existingBooking.service,
      serviceSlug: payload.serviceSlug || existingBooking.serviceSlug,
      package: Object.prototype.hasOwnProperty.call(payload, 'package')
        ? payload.package
        : existingBooking.package
    }
    const serviceSnapshot = await serviceService.buildBookingServiceSnapshot(requestedService)
    const preferredDate = toDateOnly(payload.preferredDate || existingBooking.preferredDate)
    const preferredTime = availabilityService.normalizeDisplayTime(
      payload.preferredTime || existingBooking.preferredTime
    )

    const isAvailable = await availabilityService.assertSlotAvailable({
      date: preferredDate,
      preferredTime,
      serviceSlug: serviceSnapshot.serviceSlug,
      package: serviceSnapshot.packageName,
      excludeBookingId: bookingId
    })

    if (!isAvailable) {
      throw new ApiError(httpStatus.CONFLICT, 'Selected date and time slot is not available')
    }

    updates.preferredDate = preferredDate
    updates.preferredTime = preferredTime
    updates.service = serviceSnapshot.serviceTitle
    updates.serviceId = serviceSnapshot.serviceId
    updates.serviceSlug = serviceSnapshot.serviceSlug
    updates.package = serviceSnapshot.packageName
    updates.packageSnapshot = serviceSnapshot.packageSnapshot
  }

  const booking = await Booking.findByIdAndUpdate(
    bookingId,
    {
      $set: {
        ...updates,
        handledBy: userId
      }
    },
    { returnDocument: 'after', runValidators: true }
  )

  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found')
  }

  return booking
}

const updateBookingStatus = async (bookingId, status, adminNotes, userId) => {
  const updates = {
    status,
    handledBy: userId
  }

  if (adminNotes !== undefined) {
    updates.adminNotes = adminNotes
  }

  if (status === bookingStatuses.CANCELLED) {
    updates.cancelledAt = new Date()
  }

  const booking = await Booking.findByIdAndUpdate(
    bookingId,
    { $set: updates },
    { returnDocument: 'after', runValidators: true }
  )

  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found')
  }

  booking.emailNotifications = await emailService.notifyBookingStatusChanged(booking)

  return booking
}

const deleteBooking = async (bookingId, userId) => {
  return updateBookingStatus(bookingId, bookingStatuses.CANCELLED, undefined, userId)
}

module.exports = {
  createBooking,
  getAvailability,
  getBookings,
  getBookingById,
  getPublicBookingById,
  updateBooking,
  updateBookingStatus,
  deleteBooking
}
