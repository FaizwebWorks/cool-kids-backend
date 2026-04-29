const bookingStatuses = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  RESCHEDULED: 'rescheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

const paymentStatuses = {
  UNPAID: 'unpaid',
  ADVANCE_PAID: 'advance_paid',
  PAID: 'paid',
  REFUNDED: 'refunded'
}

const bookingSources = {
  WEBSITE: 'website',
  ADMIN: 'admin'
}

const bookingTimezone = 'Asia/Kolkata'

const workingHours = {
  start: '09:00',
  end: '19:00',
  closedDays: [0]
}

const slotIntervalMinutes = 30

const packageDurations = {
  'Starter Package': 60,
  'Popular Package': 120,
  'Premium Package': 480,
  'Custom Package': 60
}

const defaultSlotDurationMinutes = 60

const busyBookingStatuses = [
  bookingStatuses.PENDING,
  bookingStatuses.CONFIRMED,
  bookingStatuses.RESCHEDULED
]

module.exports = {
  bookingStatuses,
  paymentStatuses,
  bookingSources,
  bookingTimezone,
  workingHours,
  slotIntervalMinutes,
  packageDurations,
  defaultSlotDurationMinutes,
  busyBookingStatuses
}
