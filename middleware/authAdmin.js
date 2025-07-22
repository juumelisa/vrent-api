const { Op } = require("sequelize")
const { getValueByKey, getKeyByValue } = require("../helpers")
const { token } = require("../model/token")
const { adminRole } = require("../src/admin/admin.helpers")
const { tokenAdmin: TokenAdmin, admin: Admin } = require("../src/admin/admin.model")

const authAdmin = (roles = []) => {
  const auth = async (req, res, next) => {
    const { token: userToken } = req.headers
    console.log(token)
    if (userToken) {
      const dataToken = await TokenAdmin.findOne({
        where: {
          token: userToken
        }
      })
      if (dataToken) {
        const adminId = dataToken.adminId

        const where = {
          id: adminId,
          status: 1
        }
        if (roles && roles.length ) {
          const keys = []
          for (const role of roles) {
            console.log(role)
            const key = getKeyByValue(adminRole(), role)
            if (key) {
              keys.push(key)
            }
          }
          where.role = {
            [Op.in]: keys
          }
        }

        const dataAdmin = await Admin.findOne({
          where
        })
        if (dataAdmin) {
          const roleKey = dataAdmin.role
          const roleString = getValueByKey(adminRole(), roleKey)
          const session = {
            adminId,
            role: roleString
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
    } else {
      res.status(200).json({
        status: 'error',
        code: 401,
        message: ['unauthorized'],
        result: []
      })
    }
  }
  return auth
}

module.exports = authAdmin