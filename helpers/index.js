const crypto = require('crypto')
const UUID = require("uuid-int");

const generateToken = () => {
  return crypto.randomBytes(32).toString('hex'); // 64-char token
}

function uuid(index = 0) {
  let id = Math.floor(Math.random() * 510);

  if (index) {
    id = index;
  }

  let generator = UUID(id);
  let uuid = generator.uuid();

  return uuid;
}

module.exports = {
  generateToken,
  uuid
}