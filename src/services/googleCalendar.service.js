const { google } = require('googleapis')
const env = require('../config/env')

const getCalendarClient = () => {
  if (
    !env.googleCalendar.enabled ||
    !env.googleCalendar.calendarId ||
    !env.googleCalendar.clientEmail ||
    !env.googleCalendar.privateKey
  ) {
    return null
  }

  const auth = new google.auth.JWT({
    email: env.googleCalendar.clientEmail,
    key: env.googleCalendar.privateKey.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/calendar']
  })

  return google.calendar({ version: 'v3', auth })
}

const isConfigured = () => {
  return Boolean(
    env.googleCalendar.enabled &&
    env.googleCalendar.calendarId &&
    env.googleCalendar.clientEmail &&
    env.googleCalendar.privateKey
  )
}

const getBusyPeriods = async ({ timeMin, timeMax }) => {
  const calendar = getCalendarClient()

  if (!calendar) {
    return []
  }

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      items: [
        {
          id: env.googleCalendar.calendarId
        }
      ]
    }
  })

  const calendarBusy = response.data.calendars?.[env.googleCalendar.calendarId]?.busy || []

  return calendarBusy.map((period) => ({
    start: new Date(period.start),
    end: new Date(period.end),
    source: 'google-calendar'
  }))
}

const pad = (value) => String(value).padStart(2, '0')

const toDateOnly = (date) => {
  if (date instanceof Date) {
    return date.toISOString().slice(0, 10)
  }

  return String(date).slice(0, 10)
}

const parseDisplayTime = (time) => {
  const normalized = time.trim().toUpperCase()
  const match = normalized.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/)

  if (!match) {
    return null
  }

  let hours = Number(match[1])
  const minutes = Number(match[2])

  if (match[3] === 'PM' && hours !== 12) hours += 12
  if (match[3] === 'AM' && hours === 12) hours = 0

  return { hours, minutes }
}

const addMinutes = ({ hours, minutes }, durationMinutes) => {
  const totalMinutes = (hours * 60) + minutes + durationMinutes

  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60
  }
}

const toLocalDateTime = (date, timeParts) => {
  return `${date}T${pad(timeParts.hours)}:${pad(timeParts.minutes)}:00+05:30`
}

const createBookingEvent = async ({ booking, durationMinutes }) => {
  const calendar = getCalendarClient()

  if (!calendar) {
    return null
  }

  const date = toDateOnly(booking.preferredDate)
  const startTime = parseDisplayTime(booking.preferredTime)

  if (!startTime) {
    return null
  }

  const endTime = addMinutes(startTime, durationMinutes)
  const title = `Booking: ${booking.clientName} - ${booking.service}`
  const description = [
    `Client: ${booking.clientName}`,
    `Email: ${booking.clientEmail}`,
    `Phone: ${booking.clientPhone}`,
    `Service: ${booking.service}`,
    `Package: ${booking.package || 'N/A'}`,
    `Status: ${booking.status}`,
    booking.message ? `Message: ${booking.message}` : null
  ].filter(Boolean).join('\n')

  const response = await calendar.events.insert({
    calendarId: env.googleCalendar.calendarId,
    requestBody: {
      summary: title,
      description,
      location: booking.location,
      start: {
        dateTime: toLocalDateTime(date, startTime),
        timeZone: 'Asia/Kolkata'
      },
      end: {
        dateTime: toLocalDateTime(date, endTime),
        timeZone: 'Asia/Kolkata'
      }
    }
  })

  return response.data
}

module.exports = {
  createBookingEvent,
  getBusyPeriods,
  isConfigured
}
