import { Router } from 'express';
import { usuarioRoutes } from './usuarioRoutes.js';

const router = Router();

// Cada recurso da API é registrado com seu prefixo
router.use('/usuarios', usuarioRoutes);

// Para um novo recurso, importe o arquivo de rotas e registre aqui, ex.:
// router.use('/produtos', produtoRoutes);

export { router as appRoutes };
