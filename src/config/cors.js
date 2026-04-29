const env = require('./env')

const normalizeOrigin = (origin) => {
  return origin ? origin.trim().replace(/\/+$/, '') : origin
}

const parseOrigins = (value) => {
  return String(value || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean)
}

const allowedOrigins = [
  ...parseOrigins(env.clientUrl),
  ...parseOrigins(env.adminUrl)
]

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}

module.exports = corsOptions
