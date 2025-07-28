const config = require("../../config/db.config")
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
    brandId: {
      type: Sequelize.BIGINT,
      allowNull: false
    },
    name: {
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
    locationId: {
      type: Sequelize.STRING,
      allowNull: false
    },
    price: {
      type: Sequelize.INTEGER,
      allowNull: false
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
      tableName: 'vehicle'
  });

  return Table;
}

function vehicleImage() {
  const Table = sequelize.define("vehicleImage", {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      unique: true,
      allowNull: false
    },
    vehicleId: {
      type: Sequelize.BIGINT,
      allowNull: false
    },
    url: {
      type: Sequelize.STRING,
      allowNull: true
    },
    index: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
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
      tableName: 'vehicleImage'
  });

  return Table;
}

db.vehicle = vehicle()
db.vehicleImage = vehicleImage()

module.exports = db