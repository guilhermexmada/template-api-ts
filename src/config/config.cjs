// Configuração lida pelo sequelize-cli para executar as migrations.
// O sequelize-cli só entende CommonJS, por isso este arquivo usa a extensão .cjs.
require('dotenv').config({ quiet: true });

const usarSsl = process.env.DB_SSL === 'true';

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'template_api',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    dialect: 'postgres',
    dialectOptions: usarSsl
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
  },
};
