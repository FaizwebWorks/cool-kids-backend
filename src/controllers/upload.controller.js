const httpStatus = require('../constants/httpStatus')
const uploadService = require('../services/upload.service')
const { asyncHandler, sendResponse } = require('../utils')

const uploadImage = asyncHandler(async (req, res) => {
  const asset = await uploadService.uploadImage({
    file: req.file,
    context: req.body.context,
    userId: req.user._id
  })

  return sendResponse(res, httpStatus.CREATED, 'Image uploaded successfully', asset)
})

const getAssets = asyncHandler(async (req, res) => {
  const assets = await uploadService.getAssets(req.query)
  return sendResponse(res, httpStatus.OK, 'Assets fetched successfully', assets)
})

module.exports = {
  getAssets,
  uploadImage
}
