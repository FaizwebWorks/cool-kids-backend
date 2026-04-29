const dotenv = require('dotenv')
const Joi = require('joi')

dotenv.config()

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(5000),
  CLIENT_URL: Joi.string().uri().default('http://localhost:5173'),
  ADMIN_URL: Joi.string().uri().default('http://localhost:5174'),
  MONGO_URI: Joi.string().required(),
  REDIS_HOST: Joi.string().default('127.0.0.1'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('', null),
  JWT_SECRET: Joi.string().min(20),
  JWT_ACCESS_SECRET: Joi.string().min(20),
  JWT_REFRESH_SECRET: Joi.string().min(20),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  GOOGLE_CALENDAR_ENABLED: Joi.boolean().truthy('true').falsy('false').default(false),
  GOOGLE_CALENDAR_ID: Joi.string().allow('', null),
  GOOGLE_CLIENT_EMAIL: Joi.string().allow('', null),
  GOOGLE_PRIVATE_KEY: Joi.string().allow('', null),
  BREVO_ENABLED: Joi.boolean().truthy('true').falsy('false').default(false),
  BREVO_API_KEY: Joi.string().allow('', null),
  BREVO_SENDER_EMAIL: Joi.string().email().allow('', null),
  BREVO_SENDER_NAME: Joi.string().allow('', null).default('The Cool Kids Studio'),
  ADMIN_NOTIFICATION_EMAIL: Joi.string().email().allow('', null),
  CLOUDINARY_NAME: Joi.string().allow('', null),
  CLOUDINARY_API_KEY: Joi.string().allow('', null),
  CLOUDINARY_API_SECRET: Joi.string().allow('', null),
  CLOUDINARY_FOLDER: Joi.string().allow('', null).default('the-cool-kids')
}).unknown(true)

const { value: env, error } = envSchema.validate(process.env, {
  abortEarly: false
})

if (error) {
  const message = error.details.map((detail) => detail.message).join(', ')
  throw new Error(`Environment validation failed: ${message}`)
}

const accessSecret = env.JWT_ACCESS_SECRET || env.JWT_SECRET
const refreshSecret = env.JWT_REFRESH_SECRET || env.JWT_SECRET

if (!accessSecret || !refreshSecret) {
  throw new Error('Environment validation failed: JWT_ACCESS_SECRET/JWT_REFRESH_SECRET or JWT_SECRET is required')
}

module.exports = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  clientUrl: env.CLIENT_URL,
  adminUrl: env.ADMIN_URL,
  mongoUri: env.MONGO_URI,
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined
  },
  jwt: {
    accessSecret,
    refreshSecret,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN
  },
  googleCalendar: {
    enabled: env.GOOGLE_CALENDAR_ENABLED,
    calendarId: env.GOOGLE_CALENDAR_ID,
    clientEmail: env.GOOGLE_CLIENT_EMAIL,
    privateKey: env.GOOGLE_PRIVATE_KEY
  },
  brevo: {
    enabled: env.BREVO_ENABLED,
    apiKey: env.BREVO_API_KEY,
    senderEmail: env.BREVO_SENDER_EMAIL,
    senderName: env.BREVO_SENDER_NAME,
    adminEmail: env.ADMIN_NOTIFICATION_EMAIL
  },
  cloudinary: {
    cloudName: env.CLOUDINARY_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
    folder: env.CLOUDINARY_FOLDER || 'the-cool-kids'
  }
}
