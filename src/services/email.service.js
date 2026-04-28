const env = require('../config/env')
const { bookingStatuses } = require('../constants/booking')

const isConfigured = () => {
  return Boolean(
    env.brevo.enabled &&
    env.brevo.apiKey &&
    env.brevo.senderEmail
  )
}

const escapeHtml = (value = '') => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const toDateOnly = (date) => {
  if (date instanceof Date) {
    return date.toISOString().slice(0, 10)
  }

  return String(date).slice(0, 10)
}

const formatBookingDate = (date) => {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  }).format(new Date(`${toDateOnly(date)}T00:00:00+05:30`))
}

const bookingRows = (booking) => {
  return [
    ['Name', booking.clientName],
    ['Email', booking.clientEmail],
    ['Phone', booking.clientPhone],
    ['Service', booking.service],
    ['Package', booking.package || 'N/A'],
    ['Date', formatBookingDate(booking.preferredDate)],
    ['Time', booking.preferredTime],
    ['Location', booking.location || 'N/A'],
    ['Status', booking.status]
  ]
}

const createDetailsTable = (booking) => {
  const rows = bookingRows(booking)
    .map(([label, value]) => (
      `<tr>
        <td style="padding:14px 16px;color:#6b6b6b;font-size:13px;line-height:18px;border-bottom:1px solid #e2e2e2;width:38%;">${escapeHtml(label)}</td>
        <td style="padding:14px 16px;color:#1a1a1a;font-size:14px;line-height:20px;font-weight:700;border-bottom:1px solid #e2e2e2;">${escapeHtml(value)}</td>
      </tr>`
    ))
    .join('')

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0;background:#f5f5f5;border:1px solid #e2e2e2;border-radius:24px;overflow:hidden;">
      ${rows}
    </table>
  `
}

const createMessageBlock = (message) => {
  if (!message) {
    return ''
  }

  return `
    <tr>
      <td style="padding:0 32px 28px;">
        <div style="background:#eaeaea;border-radius:22px;padding:18px 20px;">
          <p style="margin:0 0 6px;color:#6b6b6b;font-size:12px;line-height:18px;text-transform:uppercase;letter-spacing:.08em;">Message</p>
          <p style="margin:0;color:#1a1a1a;font-size:14px;line-height:22px;">${escapeHtml(message)}</p>
        </div>
      </td>
    </tr>
  `
}

const layout = ({ title, intro, booking, footer, eyebrow = 'The Cool Kids Studio' }) => {
  const bookingDate = formatBookingDate(booking.preferredDate)

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${escapeHtml(title)}</title>
      </head>
      <body style="margin:0;padding:0;background:#f5f5f5;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f5f5f5;border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:32px 16px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;max-width:640px;background:#ffffff;border-radius:32px;overflow:hidden;border:1px solid #e2e2e2;border-collapse:separate;border-spacing:0;">
                <tr>
                  <td style="background:#1a1a1a;padding:30px 32px 34px;">
                    <p style="margin:0 0 18px;color:#c7d98b;font-family:Arial,sans-serif;font-size:12px;line-height:18px;text-transform:uppercase;letter-spacing:.12em;font-weight:700;">${escapeHtml(eyebrow)}</p>
                    <h1 style="margin:0;color:#ffffff;font-family:Arial,sans-serif;font-size:34px;line-height:39px;font-weight:800;">${escapeHtml(title)}</h1>
                    <p style="margin:16px 0 0;color:#d7d7d7;font-family:Arial,sans-serif;font-size:15px;line-height:24px;">${escapeHtml(intro)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 32px 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#c7d98b;border-radius:26px;border-collapse:separate;border-spacing:0;">
                      <tr>
                        <td style="padding:22px 24px;">
                          <p style="margin:0;color:#1a1a1a;font-family:Arial,sans-serif;font-size:12px;line-height:18px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;">Session</p>
                          <h2 style="margin:6px 0 0;color:#1a1a1a;font-family:Arial,sans-serif;font-size:24px;line-height:30px;font-weight:800;">${escapeHtml(booking.service)} - ${escapeHtml(booking.package || 'Custom Package')}</h2>
                          <p style="margin:10px 0 0;color:#1a1a1a;font-family:Arial,sans-serif;font-size:15px;line-height:22px;font-weight:700;">${escapeHtml(bookingDate)} at ${escapeHtml(booking.preferredTime)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 32px 28px;">
                    ${createDetailsTable(booking)}
                  </td>
                </tr>
                ${createMessageBlock(booking.message)}
                <tr>
                  <td style="padding:0 32px 32px;">
                    <div style="border-radius:22px;border:1px solid #e2e2e2;padding:18px 20px;background:#ffffff;">
                      <p style="margin:0;color:#1a1a1a;font-family:Arial,sans-serif;font-size:14px;line-height:22px;font-weight:700;">${escapeHtml(footer)}</p>
                      <p style="margin:12px 0 0;color:#6b6b6b;font-family:Arial,sans-serif;font-size:13px;line-height:20px;">Please keep this email for your records. For changes, reply to this email or contact The Cool Kids Studio.</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:22px 32px;background:#1a1a1a;">
                    <p style="margin:0;color:#ffffff;font-family:Arial,sans-serif;font-size:13px;line-height:20px;font-weight:700;">The Cool Kids Studio</p>
                    <p style="margin:4px 0 0;color:#bdbdbd;font-family:Arial,sans-serif;font-size:12px;line-height:18px;">Photography sessions for families, kids, newborns, portraits, and celebrations.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

const sendTransactionalEmail = async ({ to, subject, htmlContent }) => {
  if (!isConfigured()) {
    return { skipped: true, reason: 'Brevo is not configured' }
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': env.brevo.apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: {
        email: env.brevo.senderEmail,
        name: env.brevo.senderName
      },
      to: Array.isArray(to) ? to : [to],
      subject,
      htmlContent
    })
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Brevo email request failed')
  }

  return { skipped: false, messageId: data.messageId }
}

const sendSafely = async (emailJob) => {
  try {
    return await sendTransactionalEmail(emailJob)
  } catch (error) {
    console.error('Email notification failed:', error.message)
    return { skipped: false, error: error.message }
  }
}

const notifyBookingCreated = async (booking) => {
  const tasks = [
    sendSafely({
      to: [{ email: booking.clientEmail, name: booking.clientName }],
      subject: 'We received your booking request',
      htmlContent: layout({
        title: 'Booking request received',
        intro: 'Thanks for reaching out to The Cool Kids Studio. We received your booking request and our team will confirm it shortly.',
        booking,
        footer: 'We will contact you soon with the next steps.'
      })
    })
  ]

  if (env.brevo.adminEmail) {
    tasks.push(sendSafely({
      to: [{ email: env.brevo.adminEmail, name: 'The Cool Kids Studio' }],
      subject: `New booking request: ${booking.clientName}`,
      htmlContent: layout({
        title: 'New booking request',
        intro: 'A new booking request was submitted from the website.',
        booking,
        footer: 'Open the admin panel to review and update this booking.'
      })
    }))
  }

  return Promise.all(tasks)
}

const notifyBookingStatusChanged = async (booking) => {
  const statusMessages = {
    [bookingStatuses.CONFIRMED]: {
      subject: 'Your booking is confirmed',
      title: 'Booking confirmed',
      intro: 'Your booking with The Cool Kids Studio has been confirmed.'
    },
    [bookingStatuses.CANCELLED]: {
      subject: 'Your booking has been cancelled',
      title: 'Booking cancelled',
      intro: 'Your booking with The Cool Kids Studio has been cancelled.'
    },
    [bookingStatuses.RESCHEDULED]: {
      subject: 'Your booking has been rescheduled',
      title: 'Booking rescheduled',
      intro: 'Your booking with The Cool Kids Studio has been rescheduled.'
    },
    [bookingStatuses.COMPLETED]: {
      subject: 'Thank you for your session',
      title: 'Session completed',
      intro: 'Thank you for choosing The Cool Kids Studio.'
    }
  }

  const message = statusMessages[booking.status]

  if (!message) {
    return [{ skipped: true, reason: 'No email template for this status' }]
  }

  return Promise.all([
    sendSafely({
      to: [{ email: booking.clientEmail, name: booking.clientName }],
      subject: message.subject,
      htmlContent: layout({
        title: message.title,
        intro: message.intro,
        booking,
        footer: 'For any changes, please contact The Cool Kids Studio.'
      })
    })
  ])
}

module.exports = {
  isConfigured,
  notifyBookingCreated,
  notifyBookingStatusChanged,
  sendTransactionalEmail
}
