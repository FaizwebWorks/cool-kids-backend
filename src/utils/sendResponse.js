const sendResponse = (res, statusCode, message, data = null) => {
  const payload = {
    success: statusCode < 400,
    message
  }

  if (data !== null) {
    payload.data = data
  }

  return res.status(statusCode).json(payload)
}

module.exports = sendResponse
