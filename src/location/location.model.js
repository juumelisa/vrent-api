const config = require("../../config/db.config")
const Sequelize = config.Sequelize
const sequelize = config.sequelize

const db = {}

db.Sequelize = Sequelize
db.sequelize = sequelize

function state() {
  const Table = sequelize.define("state", {
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
      tableName: 'state',
      underscored: false
  });

  return Table;
}

function city() {
  const Table = sequelize.define("city", {
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
    stateId: {
      type: Sequelize.BIGINT,
      allowNull: false
    },
    searchCount: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    image: {
      type: Sequelize.TEXT,
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
      tableName: 'city',
      underscored: false
  });

  return Table;
}

db.state = state()
db.city = city()

module.exports = db