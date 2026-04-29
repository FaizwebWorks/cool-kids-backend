const Joi = require('joi')
const { galleryCategories } = require('../constants/gallery')

const objectId = Joi.string().hex().length(24)
const slug = Joi.string().trim().lowercase().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(140)
const category = Joi.string().valid(...galleryCategories)

const galleryItemBody = {
  title: Joi.string().trim().min(2).max(120).required(),
  slug,
  image: Joi.string().trim().uri().max(1000).required(),
  imageAsset: objectId,
  categories: Joi.array().items(category).min(1).unique().required(),
  altText: Joi.string().trim().min(2).max(180).required(),
  description: Joi.string().trim().max(1000).allow('', null),
  isActive: Joi.boolean().default(true),
  displayOrder: Joi.number().integer().min(0).default(0)
}

const createGalleryItem = Joi.object({
  body: Joi.object(galleryItemBody),
  params: Joi.object(),
  query: Joi.object()
})

const updateGalleryItem = Joi.object({
  body: Joi.object({
    ...galleryItemBody,
    title: Joi.string().trim().min(2).max(120),
    image: Joi.string().trim().uri().max(1000),
    categories: Joi.array().items(category).min(1).unique(),
    altText: Joi.string().trim().min(2).max(180),
    isActive: Joi.boolean(),
    displayOrder: Joi.number().integer().min(0)
  }).min(1),
  params: Joi.object({
    id: objectId.required()
  }),
  query: Joi.object()
})

const updateGalleryItemStatus = Joi.object({
  body: Joi.object({
    isActive: Joi.boolean().required()
  }),
  params: Joi.object({
    id: objectId.required()
  }),
  query: Joi.object()
})

const galleryItemId = Joi.object({
  body: Joi.object(),
  params: Joi.object({
    id: objectId.required()
  }),
  query: Joi.object()
})

const listGalleryItems = Joi.object({
  body: Joi.object(),
  params: Joi.object(),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    isActive: Joi.boolean(),
    category
  })
})

module.exports = {
  createGalleryItem,
  galleryItemId,
  listGalleryItems,
  updateGalleryItem,
  updateGalleryItemStatus
}
