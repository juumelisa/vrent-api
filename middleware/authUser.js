const { token } = require("../model/token")

module.exports = async (req, res, next) => {
  const { token: userToken } = req.headers
  if (userToken) {
    const dataToken = await token.findOne({
      where: {
        token: userToken
      }
    })
    if (dataToken) {
      const session = {
        userId: dataToken.user_id
      }
      req.session = session
      next ()
    } else {
      res.status(200).json({
        status: 'error',
        code: 401,
        message: ['unauthorized'],
        result: []
      })
    }
  } else {
    res.status(200).json({
      status: 'error',
      code: 401,
      message: ['unauthorized'],
      result: []
    })
  }
}