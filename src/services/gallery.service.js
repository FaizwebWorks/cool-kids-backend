const GalleryItem = require('../models/GalleryItem')
const redis = require('../config/redis')
const httpStatus = require('../constants/httpStatus')
const ApiError = require('../utils/ApiError')
const { publicGalleryCategories } = require('../constants/gallery')
const { slugify } = require('./service.service')

const PUBLIC_GALLERY_CACHE_KEY = 'gallery:public'
const GALLERY_CACHE_TTL_SECONDS = 300

const getFromCache = async (key) => {
  try {
    if (redis.status !== 'ready') return null
    const cached = await redis.get(key)
    return cached ? JSON.parse(cached) : null
  } catch (error) {
    console.error('Gallery cache read failed:', error.message)
    return null
  }
}

const setCache = async (key, value) => {
  try {
    if (redis.status !== 'ready') return
    await redis.set(key, JSON.stringify(value), 'EX', GALLERY_CACHE_TTL_SECONDS)
  } catch (error) {
    console.error('Gallery cache write failed:', error.message)
  }
}

const invalidateGalleryCache = async () => {
  try {
    if (redis.status !== 'ready') return
    const keys = await redis.keys('gallery:*')
    if (keys.length) {
      await redis.del(keys)
    }
  } catch (error) {
    console.error('Gallery cache invalidation failed:', error.message)
  }
}

const publicProjection = '_id title slug image categories altText'

const getPublicGalleryItems = async () => {
  const cached = await getFromCache(PUBLIC_GALLERY_CACHE_KEY)

  if (cached) {
    return cached
  }

  const items = await GalleryItem.find({
    isActive: true,
    deletedAt: { $exists: false }
  })
    .select(publicProjection)
    .sort({ displayOrder: 1, createdAt: -1 })
    .lean()

  const data = {
    categories: publicGalleryCategories,
    items
  }

  await setCache(PUBLIC_GALLERY_CACHE_KEY, data)

  return data
}

const getAdminGalleryItems = async ({ page = 1, limit = 20, isActive, category }) => {
  const query = {
    deletedAt: { $exists: false }
  }

  if (isActive !== undefined) {
    query.isActive = isActive
  }

  if (category) {
    query.categories = category
  }

  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    GalleryItem.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    GalleryItem.countDocuments(query)
  ])

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1
    }
  }
}

const ensureUniqueSlug = async (slug, excludedItemId) => {
  const query = {
    slug,
    deletedAt: { $exists: false }
  }

  if (excludedItemId) {
    query._id = { $ne: excludedItemId }
  }

  const existingItem = await GalleryItem.exists(query)

  if (existingItem) {
    throw new ApiError(httpStatus.CONFLICT, 'A gallery item with this slug already exists')
  }
}

const normalizePayload = (payload) => {
  const normalized = { ...payload }

  if (!normalized.slug && normalized.title) {
    normalized.slug = slugify(normalized.title)
  } else if (normalized.slug) {
    normalized.slug = slugify(normalized.slug)
  }

  if (Array.isArray(normalized.categories)) {
    normalized.categories = [...new Set(normalized.categories)]
  }

  return normalized
}

const createGalleryItem = async (payload) => {
  const normalized = normalizePayload(payload)

  if (!normalized.slug) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Gallery item slug is required')
  }

  await ensureUniqueSlug(normalized.slug)
  const item = await GalleryItem.create(normalized)
  await invalidateGalleryCache()

  return item
}

const getGalleryItemById = async (itemId) => {
  const item = await GalleryItem.findOne({
    _id: itemId,
    deletedAt: { $exists: false }
  })

  if (!item) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Gallery item not found')
  }

  return item
}

const updateGalleryItem = async (itemId, payload) => {
  const item = await getGalleryItemById(itemId)
  const normalized = normalizePayload(payload)

  if (normalized.slug) {
    await ensureUniqueSlug(normalized.slug, itemId)
  }

  Object.assign(item, normalized)
  await item.save()
  await invalidateGalleryCache()

  return item
}

const updateGalleryItemStatus = async (itemId, isActive) => {
  const item = await getGalleryItemById(itemId)
  item.isActive = isActive
  await item.save()
  await invalidateGalleryCache()

  return item
}

const deleteGalleryItem = async (itemId) => {
  const item = await getGalleryItemById(itemId)
  item.isActive = false
  item.deletedAt = new Date()
  await item.save()
  await invalidateGalleryCache()

  return item
}

module.exports = {
  createGalleryItem,
  deleteGalleryItem,
  getAdminGalleryItems,
  getPublicGalleryItems,
  updateGalleryItem,
  updateGalleryItemStatus
}
