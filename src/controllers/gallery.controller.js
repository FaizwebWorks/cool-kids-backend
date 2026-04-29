const httpStatus = require('../constants/httpStatus')
const galleryService = require('../services/gallery.service')
const { asyncHandler, sendResponse } = require('../utils')

const getPublicGalleryItems = asyncHandler(async (req, res) => {
  const gallery = await galleryService.getPublicGalleryItems()
  return sendResponse(res, httpStatus.OK, 'Gallery items fetched successfully', gallery)
})

const getAdminGalleryItems = asyncHandler(async (req, res) => {
  const gallery = await galleryService.getAdminGalleryItems(req.query)
  return sendResponse(res, httpStatus.OK, 'Gallery items fetched successfully', gallery)
})

const createGalleryItem = asyncHandler(async (req, res) => {
  const item = await galleryService.createGalleryItem(req.body)
  return sendResponse(res, httpStatus.CREATED, 'Gallery item created successfully', item)
})

const updateGalleryItem = asyncHandler(async (req, res) => {
  const item = await galleryService.updateGalleryItem(req.params.id, req.body)
  return sendResponse(res, httpStatus.OK, 'Gallery item updated successfully', item)
})

const updateGalleryItemStatus = asyncHandler(async (req, res) => {
  const item = await galleryService.updateGalleryItemStatus(req.params.id, req.body.isActive)
  return sendResponse(res, httpStatus.OK, 'Gallery item status updated successfully', item)
})

const deleteGalleryItem = asyncHandler(async (req, res) => {
  const item = await galleryService.deleteGalleryItem(req.params.id)
  return sendResponse(res, httpStatus.OK, 'Gallery item deleted successfully', item)
})

module.exports = {
  createGalleryItem,
  deleteGalleryItem,
  getAdminGalleryItems,
  getPublicGalleryItems,
  updateGalleryItem,
  updateGalleryItemStatus
}
