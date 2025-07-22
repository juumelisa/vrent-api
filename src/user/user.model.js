const config = require("../../config/db.config")
const Sequelize = config.Sequelize
const sequelize = config.sequelize

const db = {}

db.Sequelize = Sequelize
db.sequelize = sequelize

function user() {
  const Table = sequelize.define("user", {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      unique: true,
      allowNull: false
    },
    name: {
      type: Sequelize.STRING(255),
      allowNull: false
    },
    email: {
      type: Sequelize.STRING(255),
      allowNull: false
    },
    password: {
      type: Sequelize.STRING(1000),
      allowNull: false
    },
    profileUrl: {
      type: Sequelize.STRING(1000),
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
      tableName: 'user',
      underscored: false
  });

  return Table;
}


db.user = user()

module.exports = db