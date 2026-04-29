const Joi = require('joi')
const { bookingStatuses } = require('../constants/booking')

const objectId = Joi.string().hex().length(24)
const dateOnly = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/)
const serviceIdentifier = Joi.string().trim().min(2).max(120)
const serviceSlug = Joi.string().trim().lowercase().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120)

const createBooking = Joi.object({
  body: Joi.object({
    clientName: Joi.string().trim().min(2).max(100).required(),
    clientEmail: Joi.string().trim().email().max(120).required(),
    clientPhone: Joi.string().trim().min(7).max(20).required(),
    service: serviceIdentifier.required(),
    serviceSlug,
    package: Joi.string().trim().max(80).allow('', null),
    preferredDate: dateOnly.required(),
    preferredTime: Joi.string().trim().max(30).required(),
    location: Joi.string().trim().max(220).allow('', null),
    message: Joi.string().trim().max(1000).allow('', null)
  }),
  params: Joi.object(),
  query: Joi.object()
})

const availability = Joi.object({
  body: Joi.object(),
  params: Joi.object(),
  query: Joi.object({
    date: dateOnly.required(),
    service: serviceIdentifier,
    serviceSlug,
    package: Joi.string().trim().max(80).allow('', null)
  }).or('service', 'serviceSlug')
})

const listBookings = Joi.object({
  body: Joi.object(),
  params: Joi.object(),
  query: Joi.object({
    status: Joi.string().valid(...Object.values(bookingStatuses)),
    service: serviceIdentifier,
    serviceSlug,
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  })
})

const bookingId = Joi.object({
  body: Joi.object(),
  params: Joi.object({
    id: objectId.required()
  }),
  query: Joi.object()
})

const publicBookingDetail = Joi.object({
  body: Joi.object(),
  params: Joi.object({
    id: objectId.required()
  }),
  query: Joi.object({
    clientEmail: Joi.string().trim().email().max(120),
    clientPhone: Joi.string().trim().min(7).max(20)
  }).or('clientEmail', 'clientPhone')
})

const updateBooking = Joi.object({
  body: Joi.object({
    clientName: Joi.string().trim().min(2).max(100),
    clientEmail: Joi.string().trim().email().max(120),
    clientPhone: Joi.string().trim().min(7).max(20),
    service: serviceIdentifier,
    serviceSlug,
    package: Joi.string().trim().max(80).allow('', null),
    preferredDate: Joi.date().iso(),
    preferredTime: Joi.string().trim().max(30).allow('', null),
    location: Joi.string().trim().max(220).allow('', null),
    message: Joi.string().trim().max(1000).allow('', null),
    adminNotes: Joi.string().trim().max(1500).allow('', null)
  }).min(1),
  params: Joi.object({
    id: objectId.required()
  }),
  query: Joi.object()
})

const updateBookingStatus = Joi.object({
  body: Joi.object({
    status: Joi.string().valid(...Object.values(bookingStatuses)).required(),
    adminNotes: Joi.string().trim().max(1500).allow('', null)
  }),
  params: Joi.object({
    id: objectId.required()
  }),
  query: Joi.object()
})

module.exports = {
  createBooking,
  availability,
  listBookings,
  bookingId,
  publicBookingDetail,
  updateBooking,
  updateBookingStatus
}
