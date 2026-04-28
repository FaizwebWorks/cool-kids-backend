const Redis = require('ioredis')
const env = require('./env')

const redis = new Redis({
  host: env.redis.host,
  port: env.redis.port,
  password: env.redis.password,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 2000)
})

redis.on('connect', () => {
  console.log('Redis connected')
})

redis.on('error', (error) => {
  console.error('Redis error:', error.message)
})

module.exports = redis
