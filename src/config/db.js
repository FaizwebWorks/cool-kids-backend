const mongoose = require('mongoose')
const env = require('./env')

const connectDB = async () => {
  const connection = await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
    autoIndex: env.nodeEnv !== 'production'
  })

  console.log(`MongoDB connected: ${connection.connection.host}`)
  return connection
}

module.exports = connectDB
