module.exports = (req, res, next) => {
  const { api_key } = req.headers
  if (api_key && api_key === process.env.API_KEY) {
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