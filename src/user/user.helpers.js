const { getValueByKey } = require("../../helpers")

const getUser = (data = []) => {
  let result = []
  Object.values(data).forEach((admin, index) => {
    const id = admin.id
    const name = admin.name
    const email = admin.email
    const profileUrl = admin.profileUrl
    const createdAt = admin.createdAt
    const updatedAt = admin.updatedAt

    result[index] = {
      id,
      name,
      email,
      profileUrl,
      createdAt,
      updatedAt
    }
  })
  return result
}
module.exports = {
  getUser
}