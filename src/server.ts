import 'dotenv/config';
import { app } from './app.js';
import { sequelize } from './config/database.js';

// server.ts: ponto de entrada. Conecta ao banco e inicia o servidor HTTP.

const PORT = Number(process.env.PORT ?? 3000);

async function iniciarServidor(): Promise<void> {
  try {
    // Testa a conexão antes de aceitar requisições
    await sequelize.authenticate();
    console.log('Conexão com o PostgreSQL estabelecida com sucesso.');

    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}/api`);
      console.log(`Swagger disponível em http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Erro ao conectar com o banco de dados:', error);
    process.exit(1);
  }
}

iniciarServidor();
