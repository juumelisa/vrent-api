const config = require("../config/db.config")
const Sequelize = config.Sequelize
const sequelize = config.sequelize

const db = {}

db.Sequelize = Sequelize
db.sequelize = sequelize

function chat() {
  const Table = sequelize.define("chat", {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      unique: true,
      allowNull: false
    },
    user_id: {
      type: Sequelize.BIGINT,
      allowNull: false
    },
    role: {
      type: Sequelize.STRING,
      allowNull: true
    },
    message: {
      type: Sequelize.TEXT,
      allowNull: true
    }
  },
  {
      underscored: true,
      createAt: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
      tableName: 'chat'
  });

  return Table;
}

db.chat = chat()

module.exports = db