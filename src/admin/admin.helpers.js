const { getValueByKey } = require("../../helpers")

const adminRole = () => {
  return {'1':'super admin', '2':'admin'}
}

const getAdmin = (data = []) => {
  let result = []
  Object.values(data).forEach((admin, index) => {
    const id = admin.id
    const name = admin.name
    const email = admin.email
    const profileUrl = admin.profileUrl
    const role = getValueByKey(adminRole(), admin.role)
    const createdAt = admin.createdAt
    const updatedAt = admin.updatedAt

    result[index] = {
      id,
      name,
      email,
      profileUrl,
      role,
      createdAt,
      updatedAt
    }
  })
  return result
}
module.exports = {
  adminRole,
  getAdmin
}