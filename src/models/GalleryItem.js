const mongoose = require('mongoose')
const { galleryCategories } = require('../constants/gallery')

const galleryItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 120
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    minlength: 2,
    maxlength: 140,
    match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  },
  image: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  imageAsset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  },
  categories: {
    type: [{
      type: String,
      enum: galleryCategories
    }],
    required: true,
    validate: {
      validator(value) {
        return Array.isArray(value) && value.length > 0
      },
      message: 'At least one gallery category is required'
    }
  },
  altText: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 180
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  deletedAt: {
    type: Date
  }
}, { timestamps: true })

galleryItemSchema.index({ slug: 1 }, { unique: true })
galleryItemSchema.index({ isActive: 1, displayOrder: 1, createdAt: -1 })
galleryItemSchema.index({ categories: 1, displayOrder: 1, createdAt: -1 })
galleryItemSchema.index({ deletedAt: 1 })

module.exports = mongoose.model('GalleryItem', galleryItemSchema)
