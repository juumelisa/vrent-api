const Sequelize = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    dialectOptions: {
      connectTimeout: 30000,
    },
    operatorAliases: false,
    pool: {
      max: 100,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_0900_ai_ci",
    },
    logging: false,
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.sequelize.sync();

module.exports = db;
