const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')

const corsOptions = require('./config/cors')
const routes = require('./routes')
const { errorHandler, notFound, rateLimit } = require('./middlewares')

const app = express()

app.set('trust proxy', 1)

app.use(cors(corsOptions))
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use(rateLimit())

app.use('/api/v1', routes)

app.use(notFound)
app.use(errorHandler)

module.exports = app
