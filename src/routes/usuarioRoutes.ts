import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController.js';

const router = Router();

// Rotas do recurso "usuarios" (prefixo /api/usuarios definido em routes/index.ts)
router.get('/', UsuarioController.index);
router.get('/:id', UsuarioController.show);
router.post('/', UsuarioController.create);
router.put('/:id', UsuarioController.update);
router.delete('/:id', UsuarioController.delete);

// Novas rotas do recurso entram aqui, ex.: router.patch('/:id/ativo', UsuarioController.alterarStatus);

export { router as usuarioRoutes };
