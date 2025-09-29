const config = require("../../config/db.config")
const Sequelize = config.Sequelize
const sequelize = config.sequelize

const db = {}

db.Sequelize = Sequelize
db.sequelize = sequelize

function transaction() {
  const Table = sequelize.define("transaction", {
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
    unitId: {
      type: Sequelize.BIGINT,
      allowNull: false
    },
    userId: {
      type: Sequelize.BIGINT,
      allowNull: false
    },
    price: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    rentStart: {
      type: Sequelize.DATE,
      allowNull: false
    },
    rentEnd: {
      type: Sequelize.DATE,
      allowNull: false
    },
    discount: {
      type: Sequelize.DECIMAL(10,2),
      allowNull: false
    },
    totalPrice: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    finalPrice: {
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
      tableName: 'transaction'
  });

  return Table;
}

db.transaction = transaction()

module.exports = db