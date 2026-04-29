const Joi = require('joi')
const { internalRoles } = require('../constants/roles')

const register = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    email: Joi.string().trim().email().max(120).required(),
    phone: Joi.string().trim().max(20).allow('', null),
    password: Joi.string().min(6).max(128).required(),
    role: Joi.string().valid(...internalRoles).default('staff')
  }),
  params: Joi.object(),
  query: Joi.object()
})

const login = Joi.object({
  body: Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().required()
  }),
  params: Joi.object(),
  query: Joi.object()
})

const refresh = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string().optional()
  }),
  params: Joi.object(),
  query: Joi.object()
})

const changePassword = Joi.object({
  body: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).max(128).required()
  }),
  params: Joi.object(),
  query: Joi.object()
})

module.exports = {
  register,
  login,
  refresh,
  changePassword
}
