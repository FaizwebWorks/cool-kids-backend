const httpStatus = require('../constants/httpStatus')
const serviceService = require('../services/service.service')
const { asyncHandler, sendResponse } = require('../utils')

const getPublicServices = asyncHandler(async (req, res) => {
  const services = await serviceService.getPublicServices()
  return sendResponse(res, httpStatus.OK, 'Services fetched successfully', services)
})

const getPublicServiceBySlug = asyncHandler(async (req, res) => {
  const service = await serviceService.getPublicServiceBySlug(req.params.slug)
  return sendResponse(res, httpStatus.OK, 'Service fetched successfully', service)
})

const getAdminServices = asyncHandler(async (req, res) => {
  const services = await serviceService.getAdminServices(req.query)
  return sendResponse(res, httpStatus.OK, 'Services fetched successfully', services)
})

const createService = asyncHandler(async (req, res) => {
  const service = await serviceService.createService(req.body)
  return sendResponse(res, httpStatus.CREATED, 'Service created successfully', service)
})

const updateService = asyncHandler(async (req, res) => {
  const service = await serviceService.updateService(req.params.id, req.body)
  return sendResponse(res, httpStatus.OK, 'Service updated successfully', service)
})

const updateServiceStatus = asyncHandler(async (req, res) => {
  const service = await serviceService.updateServiceStatus(req.params.id, req.body.isActive)
  return sendResponse(res, httpStatus.OK, 'Service status updated successfully', service)
})

const updateServiceCoverImage = asyncHandler(async (req, res) => {
  const result = await serviceService.updateServiceCoverImage({
    serviceId: req.params.id,
    file: req.file,
    userId: req.user._id
  })

  return sendResponse(res, httpStatus.OK, 'Service cover image updated successfully', result)
})

const deleteService = asyncHandler(async (req, res) => {
  const service = await serviceService.deleteService(req.params.id)
  return sendResponse(res, httpStatus.OK, 'Service deleted successfully', service)
})

module.exports = {
  createService,
  deleteService,
  getAdminServices,
  getPublicServiceBySlug,
  getPublicServices,
  updateService,
  updateServiceCoverImage,
  updateServiceStatus
}
