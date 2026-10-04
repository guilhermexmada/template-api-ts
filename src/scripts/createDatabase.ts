import { QueryTypes, Sequelize } from 'sequelize';
import {
  DB_NAME,
  DB_PASSWORD,
  DB_USER,
  opcoesConexao,
} from '../config/database.js';

// Cria o banco de dados definido em DB_NAME (executado com "pnpm db:create").
// Uma migration não consegue criar o próprio banco, pois precisa estar conectada
// a ele para rodar. Por isso, este script conecta ao banco padrão "postgres".

async function criarBanco(): Promise<void> {
  // Validação do nome: ele entra direto no SQL (não pode ser parâmetro),
  // então só são aceitos letras, números e "_" para evitar SQL injection
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(DB_NAME)) {
    console.error(`Nome de banco inválido: "${DB_NAME}".`);
    process.exitCode = 1;
    return;
  }

  const conexao = new Sequelize(
    'postgres',
    DB_USER,
    DB_PASSWORD,
    opcoesConexao,
  );

  try {
    // Verifica se o banco já existe para que o script possa ser executado várias vezes
    const bancos = await conexao.query(
      'SELECT 1 FROM pg_database WHERE datname = :nome',
      { replacements: { nome: DB_NAME }, type: QueryTypes.SELECT },
    );

    if (bancos.length > 0) {
      console.log(`O banco "${DB_NAME}" já existe. Nada a fazer.`);
      return;
    }

    await conexao.query(`CREATE DATABASE "${DB_NAME}"`);
    console.log(`Banco "${DB_NAME}" criado com sucesso.`);
  } catch (error) {
    console.error('Erro ao criar o banco de dados:', (error as Error).message);
    process.exitCode = 1;
  } finally {
    await conexao.close();
  }
}

criarBanco();
