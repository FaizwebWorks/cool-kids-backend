const env = require('./src/config/env')
const app = require('./src/app')
const connectDB = require('./src/config/db')
const redis = require('./src/config/redis')

let server

const startServer = async () => {
  await connectDB()
  await redis.connect()

  server = app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`)
  })
}

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`)

  if (server) {
    server.close(async () => {
      await redis.quit()
      process.exit(0)
    })
  } else {
    await redis.quit()
    process.exit(0)
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error)
  shutdown('unhandledRejection')
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
  process.exit(1)
})

startServer().catch((error) => {
  console.error('Failed to start server:', error.message)
  process.exit(1)
})
