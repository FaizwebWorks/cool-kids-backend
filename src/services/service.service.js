const Service = require('../models/Service')
const redis = require('../config/redis')
const httpStatus = require('../constants/httpStatus')
const ApiError = require('../utils/ApiError')
const uploadService = require('./upload.service')

const PUBLIC_SERVICES_CACHE_KEY = 'services:public'
const SERVICE_CACHE_TTL_SECONDS = 300

const slugify = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const normalizePackageName = (name) => String(name || '').trim().toLowerCase()

const getFromCache = async (key) => {
  try {
    if (redis.status !== 'ready') return null
    const cached = await redis.get(key)
    return cached ? JSON.parse(cached) : null
  } catch (error) {
    console.error('Service cache read failed:', error.message)
    return null
  }
}

const setCache = async (key, value) => {
  try {
    if (redis.status !== 'ready') return
    await redis.set(key, JSON.stringify(value), 'EX', SERVICE_CACHE_TTL_SECONDS)
  } catch (error) {
    console.error('Service cache write failed:', error.message)
  }
}

const invalidateServiceCache = async () => {
  try {
    if (redis.status !== 'ready') return
    const keys = await redis.keys('services:*')
    if (keys.length) {
      await redis.del(keys)
    }
  } catch (error) {
    console.error('Service cache invalidation failed:', error.message)
  }
}

const publicProjection = '-deletedAt -__v'

const sanitizePublicService = (service) => {
  return {
    ...service,
    availablePackages: (service.availablePackages || [])
      .filter((item) => item.isActive)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
  }
}

const getPublicServices = async () => {
  const cached = await getFromCache(PUBLIC_SERVICES_CACHE_KEY)

  if (cached) {
    return cached
  }

  const services = await Service.find({
    isActive: true,
    deletedAt: { $exists: false }
  })
    .select(publicProjection)
    .sort({ displayOrder: 1, title: 1 })
    .lean()

  const data = services.map(sanitizePublicService)
  await setCache(PUBLIC_SERVICES_CACHE_KEY, data)

  return data
}

const getPublicServiceBySlug = async (slug) => {
  const normalizedSlug = slugify(slug)
  const cacheKey = `services:public:${normalizedSlug}`
  const cached = await getFromCache(cacheKey)

  if (cached) {
    return cached
  }

  const service = await Service.findOne({
    slug: normalizedSlug,
    isActive: true,
    deletedAt: { $exists: false }
  })
    .select(publicProjection)
    .lean()

  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Service not found')
  }

  const data = sanitizePublicService(service)
  await setCache(cacheKey, data)

  return data
}

const getAdminServices = async ({ isActive, page = 1, limit = 20 }) => {
  const query = {
    deletedAt: { $exists: false }
  }

  if (isActive !== undefined) {
    query.isActive = isActive
  }

  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    Service.find(query)
      .sort({ displayOrder: 1, title: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Service.countDocuments(query)
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

const ensureUniqueSlug = async (slug, excludedServiceId) => {
  const query = {
    slug,
    deletedAt: { $exists: false }
  }

  if (excludedServiceId) {
    query._id = { $ne: excludedServiceId }
  }

  const existingService = await Service.exists(query)

  if (existingService) {
    throw new ApiError(httpStatus.CONFLICT, 'A service with this slug already exists')
  }
}

const normalizeServicePayload = (payload) => {
  const normalized = { ...payload }

  if (!normalized.slug && normalized.title) {
    normalized.slug = slugify(normalized.title)
  } else if (normalized.slug) {
    normalized.slug = slugify(normalized.slug)
  }

  if (Array.isArray(normalized.availablePackages)) {
    const packageNames = new Set()

    normalized.availablePackages = normalized.availablePackages.map((item, index) => ({
      ...item,
      name: item.name.trim(),
      displayOrder: item.displayOrder ?? index
    }))

    for (const item of normalized.availablePackages) {
      const packageName = normalizePackageName(item.name)

      if (packageNames.has(packageName)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Package names must be unique within a service')
      }

      packageNames.add(packageName)
    }
  }

  return normalized
}

const createService = async (payload) => {
  const normalized = normalizeServicePayload(payload)

  if (!normalized.slug) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Service slug is required')
  }

  await ensureUniqueSlug(normalized.slug)
  const service = await Service.create(normalized)
  await invalidateServiceCache()

  return service
}

const getServiceById = async (serviceId) => {
  const service = await Service.findOne({
    _id: serviceId,
    deletedAt: { $exists: false }
  })

  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Service not found')
  }

  return service
}

const updateService = async (serviceId, payload) => {
  const service = await getServiceById(serviceId)
  const normalized = normalizeServicePayload(payload)

  if (normalized.slug) {
    await ensureUniqueSlug(normalized.slug, serviceId)
  }

  Object.assign(service, normalized)
  await service.save()
  await invalidateServiceCache()

  return service
}

const updateServiceStatus = async (serviceId, isActive) => {
  const service = await getServiceById(serviceId)
  service.isActive = isActive
  await service.save()
  await invalidateServiceCache()

  return service
}

const updateServiceCoverImage = async ({ serviceId, file, userId }) => {
  const service = await getServiceById(serviceId)
  const asset = await uploadService.uploadImage({
    file,
    context: 'service_cover',
    userId
  })

  service.coverImage = asset.secureUrl
  service.coverImageAsset = asset._id
  await service.save()
  await invalidateServiceCache()

  return {
    service,
    asset
  }
}

const deleteService = async (serviceId) => {
  const service = await getServiceById(serviceId)
  service.isActive = false
  service.deletedAt = new Date()
  await service.save()
  await invalidateServiceCache()

  return service
}

const findActiveServiceForBooking = async ({ service, serviceSlug }) => {
  const identifier = serviceSlug || service

  if (!identifier) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Service is required')
  }

  const normalizedSlug = slugify(identifier)
  const titleRegex = new RegExp(`^${String(identifier).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')

  const foundService = await Service.findOne({
    deletedAt: { $exists: false },
    isActive: true,
    $or: [
      { slug: normalizedSlug },
      { title: titleRegex }
    ]
  }).lean()

  if (!foundService) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Selected service is not available')
  }

  return foundService
}

const getActivePackageForBooking = (service, packageName) => {
  const packages = service.availablePackages || []

  if (!packageName && packages.length === 0) {
    return null
  }

  if (!packageName) {
    return packages
      .filter((item) => item.isActive)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))[0] || null
  }

  const selectedPackage = packages.find((item) => (
    item.isActive &&
    normalizePackageName(item.name) === normalizePackageName(packageName)
  ))

  if (!selectedPackage) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Selected package is not available for this service')
  }

  return selectedPackage
}

const buildBookingServiceSnapshot = async ({ service, serviceSlug, package: packageName }) => {
  const activeService = await findActiveServiceForBooking({ service, serviceSlug })
  const selectedPackage = getActivePackageForBooking(activeService, packageName)
  const durationMinutes = selectedPackage?.durationMinutes || activeService.defaultDurationMinutes

  return {
    serviceId: activeService._id,
    serviceTitle: activeService.title,
    serviceSlug: activeService.slug,
    packageName: selectedPackage?.name || packageName || '',
    packageSnapshot: selectedPackage ? {
      name: selectedPackage.name,
      price: selectedPackage.price,
      durationMinutes,
      description: selectedPackage.description || ''
    } : {
      name: packageName || '',
      price: activeService.startingPrice || 0,
      durationMinutes,
      description: ''
    },
    durationMinutes
  }
}

module.exports = {
  buildBookingServiceSnapshot,
  createService,
  deleteService,
  findActiveServiceForBooking,
  getActivePackageForBooking,
  getAdminServices,
  getPublicServiceBySlug,
  getPublicServices,
  slugify,
  updateService,
  updateServiceCoverImage,
  updateServiceStatus
}
