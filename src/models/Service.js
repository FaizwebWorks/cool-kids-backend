const mongoose = require('mongoose')

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 80
  },
  price: {
    type: Number,
    min: 0,
    default: 0
  },
  durationMinutes: {
    type: Number,
    min: 15,
    max: 1440,
    default: 60
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, { _id: false })

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    minlength: 2,
    maxlength: 120,
    match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: 160
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  coverImage: {
    type: String,
    trim: true,
    maxlength: 500
  },
  coverImageAsset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  },
  startingPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  seoTitle: {
    type: String,
    trim: true,
    maxlength: 160
  },
  seoDescription: {
    type: String,
    trim: true,
    maxlength: 300
  },
  defaultDurationMinutes: {
    type: Number,
    min: 15,
    max: 1440,
    default: 60
  },
  availablePackages: {
    type: [packageSchema],
    default: []
  },
  deletedAt: {
    type: Date
  }
}, { timestamps: true })

serviceSchema.index({ slug: 1 }, { unique: true })
serviceSchema.index({ isActive: 1, displayOrder: 1, title: 1 })
serviceSchema.index({ deletedAt: 1 })

module.exports = mongoose.model('Service', serviceSchema)
