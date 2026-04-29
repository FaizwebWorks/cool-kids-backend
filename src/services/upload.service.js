const { Readable } = require('stream')
const Asset = require('../models/Asset')
const env = require('../config/env')
const { cloudinary, isConfigured } = require('../config/cloudinary')
const httpStatus = require('../constants/httpStatus')
const ApiError = require('../utils/ApiError')

const folderByContext = {
  service_cover: 'services/covers',
  gallery: 'gallery',
  testimonial: 'testimonials',
  general: 'general'
}

const normalizeContext = (context) => {
  return folderByContext[context] ? context : 'general'
}

const buildFolder = (context) => {
  const baseFolder = env.cloudinary.folder || 'the-cool-kids'
  return `${baseFolder}/${folderByContext[normalizeContext(context)]}`
}

const uploadBufferToCloudinary = async ({ buffer, folder, originalName }) => {
  if (!isConfigured()) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Cloudinary is not configured')
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        context: originalName ? { original_name: originalName } : undefined,
        transformation: [
          { quality: 'auto', fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          return reject(error)
        }

        return resolve(result)
      }
    )

    Readable.from(buffer).pipe(uploadStream)
  })
}

const uploadImage = async ({ file, context = 'general', userId }) => {
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Image file is required')
  }

  const normalizedContext = normalizeContext(context)
  const folder = buildFolder(normalizedContext)
  const result = await uploadBufferToCloudinary({
    buffer: file.buffer,
    folder,
    originalName: file.originalname
  })

  return Asset.create({
    publicId: result.public_id,
    assetId: result.asset_id,
    url: result.url,
    secureUrl: result.secure_url,
    originalName: file.originalname,
    folder,
    mimeType: file.mimetype,
    format: result.format,
    resourceType: 'image',
    bytes: result.bytes,
    width: result.width,
    height: result.height,
    context: normalizedContext,
    uploadedBy: userId
  })
}

const getAssets = async ({ context, page = 1, limit = 20 }) => {
  const query = {
    deletedAt: { $exists: false }
  }

  if (context) {
    query.context = normalizeContext(context)
  }

  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    Asset.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Asset.countDocuments(query)
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

module.exports = {
  getAssets,
  uploadImage
}
