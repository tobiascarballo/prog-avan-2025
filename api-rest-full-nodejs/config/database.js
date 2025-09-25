const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("apidb", "admin", "admin123", {
    host: "postgres",  // ← el nombre del servicio en docker-compose
    port: 5432,
    dialect: "postgres",
});


module.exports = sequelize;
