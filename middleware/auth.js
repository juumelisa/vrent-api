module.exports = (req, res, next) => {
  const apiKey = req.headers["x-api-key"]
  if (apiKey && apiKey === process.env.API_KEY) {
    next ()
  } else {
    res.status(200).json({
      status: 'error',
      code: 401,
      message: ['unauthorized'],
      result: []
    })
  }
}