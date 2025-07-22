const config = require("../../config/db.config")
const Sequelize = config.Sequelize
const sequelize = config.sequelize

const db = {}

db.Sequelize = Sequelize
db.sequelize = sequelize

const admin = () => {
  const Table = sequelize.define("admin", {
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
    role: {
      type: Sequelize.SMALLINT,
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
      tableName: 'admin',
      underscored: false
  });

  return Table;
}

const tokenAdmin = () => {
  const Table = sequelize.define("tokenAdmin", {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      unique: true,
      allowNull: false
    },
    adminId: {
      type: Sequelize.BIGINT,
      allowNull: false
    },
    token: {
      type: Sequelize.STRING(255),
      allowNull: false
    },
    expiredDate: {
      type: Sequelize.DATE,
      allowNull: false
    }
  },
  {
      underscored: true,
      createAt: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
      tableName: 'tokenAdmin',
      underscored: false
  });

  return Table;
}

db.admin = admin()
db.tokenAdmin = tokenAdmin()

module.exports = db