import type { Request, Response } from 'express';
import { tratarErro } from '../errors/tratarErro.js';
import { UsuarioService } from '../services/UsuarioService.js';

// Controller: lê os dados da requisição, chama o service e devolve a resposta HTTP.
// Regras de negócio e acesso ao banco ficam no UsuarioService.
export class UsuarioController {
  // GET /api/usuarios - Lista todos os usuários
  public static async index(req: Request, res: Response): Promise<Response> {
    try {
      const usuarios = await UsuarioService.listar();
      return res.status(200).json(usuarios);
    } catch (error) {
      return tratarErro(res, error, 'Erro ao listar usuários.');
    }
  }

  // GET /api/usuarios/:id - Busca um usuário pelo ID
  public static async show(req: Request, res: Response): Promise<Response> {
    try {
      const usuario = await UsuarioService.buscarPorId(Number(req.params.id));
      return res.status(200).json(usuario);
    } catch (error) {
      return tratarErro(res, error, 'Erro ao buscar usuário.');
    }
  }

  // POST /api/usuarios - Cadastra um usuário
  public static async create(req: Request, res: Response): Promise<Response> {
    try {
      // req.body fica undefined quando a requisição não tem corpo
      const usuario = await UsuarioService.criar(req.body ?? {});
      return res.status(201).json(usuario);
    } catch (error) {
      return tratarErro(res, error, 'Erro ao cadastrar usuário.');
    }
  }

  // PUT /api/usuarios/:id - Atualiza todos os dados de um usuário
  public static async update(req: Request, res: Response): Promise<Response> {
    try {
      const usuario = await UsuarioService.atualizar(
        Number(req.params.id),
        req.body ?? {},
      );
      return res.status(200).json(usuario);
    } catch (error) {
      return tratarErro(res, error, 'Erro ao atualizar usuário.');
    }
  }

  // DELETE /api/usuarios/:id - Exclui um usuário
  public static async delete(req: Request, res: Response): Promise<Response> {
    try {
      await UsuarioService.excluir(Number(req.params.id));
      return res
        .status(200)
        .json({ mensagem: 'Usuário excluído com sucesso.' });
    } catch (error) {
      return tratarErro(res, error, 'Erro ao excluir usuário.');
    }
  }
}
