const config = require("../config/db.config")
const Sequelize = config.Sequelize
const sequelize = config.sequelize

const db = {}

db.Sequelize = Sequelize
db.sequelize = sequelize

function token() {
  const Table = sequelize.define("token", {
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
    token: {
      type: Sequelize.STRING(200),
      allowNull: false
    },
    expired_date: {
      type: Sequelize.DATE,
      allowNull: false
    }
  },
  {
      underscored: true,
      createAt: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
      tableName: 'token'
  });

  return Table;
}

db.token = token()

module.exports = db