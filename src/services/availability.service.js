const Booking = require('../models/Booking')
const googleCalendarService = require('./googleCalendar.service')
const serviceService = require('./service.service')
const {
  bookingTimezone,
  busyBookingStatuses,
  defaultSlotDurationMinutes,
  packageDurations,
  slotIntervalMinutes,
  workingHours
} = require('../constants/booking')

const IST_OFFSET_MINUTES = 330

const pad = (value) => String(value).padStart(2, '0')

const parseDateParts = (date) => {
  const [year, month, day] = date.split('-').map(Number)
  return { year, month, day }
}

const minutesFromClock = (clock) => {
  const [hours, minutes] = clock.split(':').map(Number)
  return hours * 60 + minutes
}

const formatTime = (minutes) => {
  const hours24 = Math.floor(minutes / 60)
  const mins = minutes % 60
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 || 12
  return `${pad(hours12)}:${pad(mins)} ${period}`
}

const parseDisplayTime = (time) => {
  if (!time) return null

  const normalized = time.trim().toUpperCase()
  const twelveHour = normalized.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/)

  if (twelveHour) {
    let hours = Number(twelveHour[1])
    const minutes = Number(twelveHour[2])

    if (twelveHour[3] === 'PM' && hours !== 12) hours += 12
    if (twelveHour[3] === 'AM' && hours === 12) hours = 0

    return hours * 60 + minutes
  }

  const twentyFourHour = normalized.match(/^(\d{1,2}):(\d{2})$/)

  if (twentyFourHour) {
    return Number(twentyFourHour[1]) * 60 + Number(twentyFourHour[2])
  }

  return null
}

const normalizeDisplayTime = (time) => {
  const minutes = parseDisplayTime(time)
  return minutes === null ? time : formatTime(minutes)
}

const toUtcDateFromIst = (date, minutes) => {
  const { year, month, day } = parseDateParts(date)
  const utcMinutes = minutes - IST_OFFSET_MINUTES
  return new Date(Date.UTC(year, month - 1, day, 0, utcMinutes, 0, 0))
}

const getIstWeekday = (date) => {
  return new Date(`${date}T00:00:00+05:30`).getDay()
}

const rangesOverlap = (startA, endA, startB, endB) => {
  return startA < endB && startB < endA
}

const getPackageDuration = (packageName) => {
  return packageDurations[packageName] || defaultSlotDurationMinutes
}

const getBookingDuration = (booking) => {
  return booking.packageSnapshot?.durationMinutes || getPackageDuration(booking.package)
}

const getAvailabilityDuration = async ({ service, serviceSlug, package: packageName }) => {
  if (!service && !serviceSlug) {
    return getPackageDuration(packageName)
  }

  const activeService = await serviceService.findActiveServiceForBooking({ service, serviceSlug })
  const selectedPackage = serviceService.getActivePackageForBooking(activeService, packageName)

  return selectedPackage?.durationMinutes || activeService.defaultDurationMinutes || defaultSlotDurationMinutes
}

const getMongoBusyPeriods = async ({ date, excludeBookingId }) => {
  const dayStart = toUtcDateFromIst(date, 0)
  const dayEnd = toUtcDateFromIst(date, 24 * 60)

  const query = {
    preferredDate: {
      $gte: dayStart,
      $lt: dayEnd
    },
    status: {
      $in: busyBookingStatuses
    }
  }

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId }
  }

  const bookings = await Booking.find(query).lean()

  return bookings
    .map((booking) => {
      const startMinutes = parseDisplayTime(booking.preferredTime)

      if (startMinutes === null) {
        return null
      }

      const duration = getBookingDuration(booking)

      return {
        start: toUtcDateFromIst(date, startMinutes),
        end: toUtcDateFromIst(date, startMinutes + duration),
        source: 'mongodb-booking',
        bookingId: booking._id.toString()
      }
    })
    .filter(Boolean)
}

const getAvailability = async ({ date, service, serviceSlug, package: packageName, excludeBookingId }) => {
  const duration = await getAvailabilityDuration({ service, serviceSlug, package: packageName })
  const weekday = getIstWeekday(date)
  const startMinutes = minutesFromClock(workingHours.start)
  const endMinutes = minutesFromClock(workingHours.end)
  const timeMin = toUtcDateFromIst(date, startMinutes)
  const timeMax = toUtcDateFromIst(date, endMinutes)

  if (workingHours.closedDays.includes(weekday)) {
    return {
      date,
      timezone: bookingTimezone,
      durationMinutes: duration,
      workingHours,
      slots: [],
      busy: [],
      calendarConnected: false,
      message: 'Studio is closed on this date'
    }
  }

  const [mongoBusy, googleBusy] = await Promise.all([
    getMongoBusyPeriods({ date, excludeBookingId }),
    googleCalendarService.getBusyPeriods({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString()
    })
  ])

  const busy = [...mongoBusy, ...googleBusy]
  const slots = []

  for (
    let slotStartMinutes = startMinutes;
    slotStartMinutes + duration <= endMinutes;
    slotStartMinutes += slotIntervalMinutes
  ) {
    const slotEndMinutes = slotStartMinutes + duration
    const slotStart = toUtcDateFromIst(date, slotStartMinutes)
    const slotEnd = toUtcDateFromIst(date, slotEndMinutes)
    const overlappingBusy = busy.find((period) => rangesOverlap(slotStart, slotEnd, period.start, period.end))

    slots.push({
      time: formatTime(slotStartMinutes),
      start: slotStart.toISOString(),
      end: slotEnd.toISOString(),
      available: !overlappingBusy,
      blockedBy: overlappingBusy?.source || null
    })
  }

  return {
    date,
    timezone: bookingTimezone,
    durationMinutes: duration,
    workingHours,
    slots,
    busy: busy.map((period) => ({
      start: period.start.toISOString(),
      end: period.end.toISOString(),
      source: period.source
    })),
    calendarConnected: googleCalendarService.isConfigured()
  }
}

const assertSlotAvailable = async ({ date, preferredTime, service, serviceSlug, package: packageName, excludeBookingId }) => {
  const availability = await getAvailability({ date, service, serviceSlug, package: packageName, excludeBookingId })
  const slot = availability.slots.find((item) => item.time === preferredTime)

  return Boolean(slot?.available)
}

module.exports = {
  getAvailability,
  assertSlotAvailable,
  getPackageDuration,
  normalizeDisplayTime,
  parseDisplayTime
}
