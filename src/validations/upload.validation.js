const Joi = require('joi')

const uploadImage = Joi.object({
  body: Joi.object({
    context: Joi.string().valid('service_cover', 'gallery', 'testimonial', 'general').default('general')
  }),
  params: Joi.object(),
  query: Joi.object()
})

const listAssets = Joi.object({
  body: Joi.object(),
  params: Joi.object(),
  query: Joi.object({
    context: Joi.string().valid('service_cover', 'gallery', 'testimonial', 'general'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  })
})

module.exports = {
  listAssets,
  uploadImage
}
