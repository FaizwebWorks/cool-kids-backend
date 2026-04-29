const mongoose = require('mongoose')
const {
  bookingStatuses,
  paymentStatuses,
  bookingSources
} = require('../constants/booking')

const bookingSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  clientEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    maxlength: 120
  },
  clientPhone: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  service: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  serviceSlug: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 120
  },
  package: {
    type: String,
    trim: true,
    maxlength: 80
  },
  packageSnapshot: {
    name: {
      type: String,
      trim: true,
      maxlength: 80
    },
    price: {
      type: Number,
      min: 0
    },
    durationMinutes: {
      type: Number,
      min: 15,
      max: 1440
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  preferredDate: {
    type: Date,
    required: true
  },
  preferredTime: {
    type: String,
    trim: true,
    maxlength: 30
  },
  location: {
    type: String,
    trim: true,
    maxlength: 220
  },
  message: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: Object.values(bookingStatuses),
    default: bookingStatuses.PENDING
  },
  paymentStatus: {
    type: String,
    enum: Object.values(paymentStatuses),
    default: paymentStatuses.UNPAID
  },
  source: {
    type: String,
    enum: Object.values(bookingSources),
    default: bookingSources.WEBSITE
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 1500
  },
  handledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: {
    type: Date
  }
}, { timestamps: true })

bookingSchema.index({ status: 1, createdAt: -1 })
bookingSchema.index({ preferredDate: 1 })
bookingSchema.index({ clientEmail: 1 })
bookingSchema.index({ clientPhone: 1 })
bookingSchema.index({ service: 1, createdAt: -1 })
bookingSchema.index({ serviceSlug: 1, createdAt: -1 })

module.exports = mongoose.model('Booking', bookingSchema)
