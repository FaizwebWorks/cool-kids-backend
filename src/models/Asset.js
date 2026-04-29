const mongoose = require('mongoose')

const assetSchema = new mongoose.Schema({
  publicId: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  assetId: {
    type: String,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  secureUrl: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  originalName: {
    type: String,
    trim: true,
    maxlength: 255
  },
  folder: {
    type: String,
    trim: true,
    maxlength: 255
  },
  mimeType: {
    type: String,
    trim: true,
    maxlength: 100
  },
  format: {
    type: String,
    trim: true,
    maxlength: 20
  },
  resourceType: {
    type: String,
    enum: ['image'],
    default: 'image'
  },
  bytes: {
    type: Number,
    min: 0
  },
  width: {
    type: Number,
    min: 0
  },
  height: {
    type: Number,
    min: 0
  },
  context: {
    type: String,
    trim: true,
    maxlength: 80
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deletedAt: {
    type: Date
  }
}, { timestamps: true })

assetSchema.index({ uploadedBy: 1, createdAt: -1 })
assetSchema.index({ context: 1, createdAt: -1 })
assetSchema.index({ deletedAt: 1 })

module.exports = mongoose.model('Asset', assetSchema)
