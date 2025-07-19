const config = require("../../config/db.config")
const Sequelize = config.Sequelize
const sequelize = config.sequelize

const db = {}

db.Sequelize = Sequelize
db.sequelize = sequelize

function brand() {
  const Table = sequelize.define("brand", {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      unique: true,
      allowNull: false
    },
    name: {
      type: Sequelize.STRING,
      allowNull: true
    },
    status: {
      type: Sequelize.SMALLINT,
      allowNull: false,
      defaultValue: 1
    }
  },
  {
      underscored: true,
      createAt: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
      tableName: 'brand'
  });

  return Table;
}

db.brand = brand()

module.exports = db