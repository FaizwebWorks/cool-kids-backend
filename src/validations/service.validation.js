const Joi = require('joi')

const objectId = Joi.string().hex().length(24)
const slug = Joi.string().trim().lowercase().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120)

const packageSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  price: Joi.number().min(0).default(0),
  durationMinutes: Joi.number().integer().min(15).max(1440).default(60),
  description: Joi.string().trim().max(500).allow('', null),
  isActive: Joi.boolean().default(true),
  displayOrder: Joi.number().integer().min(0).default(0)
})

const serviceBody = {
  title: Joi.string().trim().min(2).max(100).required(),
  slug,
  subtitle: Joi.string().trim().max(160).allow('', null),
  description: Joi.string().trim().max(2000).allow('', null),
  coverImage: Joi.string().trim().uri().max(500).allow('', null),
  startingPrice: Joi.number().min(0).default(0),
  isActive: Joi.boolean().default(true),
  displayOrder: Joi.number().integer().min(0).default(0),
  seoTitle: Joi.string().trim().max(160).allow('', null),
  seoDescription: Joi.string().trim().max(300).allow('', null),
  defaultDurationMinutes: Joi.number().integer().min(15).max(1440).default(60),
  availablePackages: Joi.array().items(packageSchema).max(20).default([])
}

const createService = Joi.object({
  body: Joi.object(serviceBody),
  params: Joi.object(),
  query: Joi.object()
})

const updateService = Joi.object({
  body: Joi.object({
    ...serviceBody,
    title: Joi.string().trim().min(2).max(100),
    startingPrice: Joi.number().min(0),
    isActive: Joi.boolean(),
    displayOrder: Joi.number().integer().min(0),
    defaultDurationMinutes: Joi.number().integer().min(15).max(1440),
    availablePackages: Joi.array().items(packageSchema).max(20)
  }).min(1),
  params: Joi.object({
    id: objectId.required()
  }),
  query: Joi.object()
})

const updateServiceStatus = Joi.object({
  body: Joi.object({
    isActive: Joi.boolean().required()
  }),
  params: Joi.object({
    id: objectId.required()
  }),
  query: Joi.object()
})

const serviceId = Joi.object({
  body: Joi.object(),
  params: Joi.object({
    id: objectId.required()
  }),
  query: Joi.object()
})

const serviceSlug = Joi.object({
  body: Joi.object(),
  params: Joi.object({
    slug: slug.required()
  }),
  query: Joi.object()
})

const listServices = Joi.object({
  body: Joi.object(),
  params: Joi.object(),
  query: Joi.object({
    isActive: Joi.boolean(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  })
})

module.exports = {
  createService,
  listServices,
  serviceId,
  serviceSlug,
  updateService,
  updateServiceStatus
}
