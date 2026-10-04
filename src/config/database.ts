import 'dotenv/config';
import { Sequelize, type Options } from 'sequelize';

// Credenciais lidas do arquivo .env (com valores padrão para uso local)
export const DB_NAME = process.env.DB_NAME ?? 'template_api';
export const DB_USER = process.env.DB_USER ?? 'postgres';
export const DB_PASSWORD = process.env.DB_PASSWORD ?? 'postgres';

// SSL condicional: bancos em nuvem (ex.: Supabase) exigem SSL; o banco local, não
const usarSsl = process.env.DB_SSL === 'true';

// Opções de conexão compartilhadas pela aplicação e pelo script de criação do banco
export const opcoesConexao: Options = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  dialect: 'postgres',
  logging: false,
  dialectOptions: usarSsl
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
};

// Instância do Sequelize usada pelos models
export const sequelize = new Sequelize(
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  opcoesConexao,
);
