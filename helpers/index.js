const crypto = require('crypto')
const UUID = require("uuid-int")
const bcrypt = require("bcrypt")

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value)
}

function getValueByKey(object, value) {
  return Object.values(object).find(key => object[value] === key)
}

function vehicleType() {
  return {'1':'car', '2':'motorbike', '3':'minivan'}
}

const generateToken = () => {
  return crypto.randomBytes(32).toString('hex') // 64-char token
}

const uuid = (index = 0) => {
  let id = Math.floor(Math.random() * 510)

  if (index) {
    id = index
  }

  let generator = UUID(id)
  let uuid = generator.uuid()

  return uuid
}

const hashing = async(password) => {
  const saltRounds = 10
  const hashPassword = await bcrypt.hash(password, saltRounds)
  return hashPassword
}

const comparePassword = async (password, hashPassword) => {
  const isMatch = await bcrypt.compare(password, hashPassword)
  return isMatch
}

module.exports = {
  generateToken,
  uuid,
  vehicleType,
  getKeyByValue,
  getValueByKey,
  hashing,
  comparePassword
}