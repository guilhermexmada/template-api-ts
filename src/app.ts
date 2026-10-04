import cors from 'cors';
import express, { type Request, type Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './config/swagger.json' with { type: 'json' };
import { appRoutes } from './routes/index.js';

// app.ts: cria e configura a aplicação Express (middlewares, documentação e rotas).
// A conexão com o banco e a abertura da porta ficam no server.ts.
// Em ES Modules, imports de arquivos locais usam a extensão .js (a do arquivo compilado).

const app = express();

// Middlewares globais: libera o CORS e converte o corpo JSON em req.body
app.use(cors());
app.use(express.json());

// Health check: confirma que o servidor está respondendo
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    mensagem: 'Servidor rodando com sucesso.',
    timestamp: new Date().toISOString(),
  });
});

// Documentação interativa (Swagger UI)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rotas da aplicação, todas com o prefixo /api
app.use('/api', appRoutes);

export { app };
