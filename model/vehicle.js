const config = require("../config/db.config")
const Sequelize = config.Sequelize
const sequelize = config.sequelize

const db = {}

db.Sequelize = Sequelize
db.sequelize = sequelize

function vehicle() {
  const Table = sequelize.define("vehicle", {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      unique: true,
      allowNull: false
    },
    brand: {
      type: Sequelize.STRING,
      allowNull: false
    },
    model: {
      type: Sequelize.STRING,
      allowNull: true
    },
    type: {
      type: Sequelize.TINYINT,
      allowNull: false
    },
    seat: {
      type: Sequelize.TINYINT,
      allowNull: false
    },
    location: {
      type: Sequelize.STRING,
      allowNull: false
    }
  },
  {
      underscored: true,
      createAt: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
      tableName: 'vehicle'
  });

  return Table;
}

db.vehicle = vehicle()

module.exports = db