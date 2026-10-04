import { AppError } from '../errors/AppError.js';
import { Usuario, type UsuarioCreationAttributes } from '../models/Usuario.js';

// Dados esperados no corpo das requisições POST e PUT.
// Como o cliente pode enviar qualquer coisa, os valores são conferidos em validarDados().
export interface UsuarioInput {
  nome: string;
  email: string;
  telefone?: string | null;
  dataNascimento?: string | null;
  ativo?: boolean;
}

// Service: concentra as regras de negócio e as operações com o banco de dados.
// Não conhece req/res; em caso de problema, lança um AppError com o status HTTP adequado.
export class UsuarioService {
  // Lista todos os usuários, ordenados pelo ID
  public static async listar(): Promise<Usuario[]> {
    return Usuario.findAll({ order: [['id', 'ASC']] });
  }

  // Busca um usuário pelo ID (404 se não existir)
  public static async buscarPorId(id: number): Promise<Usuario> {
    UsuarioService.validarId(id);

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    return usuario;
  }

  // Cadastra um usuário com e-mail único
  public static async criar(dados: UsuarioInput): Promise<Usuario> {
    const dadosValidados = UsuarioService.validarDados(dados);
    await UsuarioService.verificarEmailDisponivel(dadosValidados.email);

    return Usuario.create(dadosValidados);
  }

  // Substitui todos os dados de um usuário existente (PUT)
  public static async atualizar(
    id: number,
    dados: UsuarioInput,
  ): Promise<Usuario> {
    const usuario = await UsuarioService.buscarPorId(id);
    const dadosValidados = UsuarioService.validarDados(dados);
    await UsuarioService.verificarEmailDisponivel(dadosValidados.email, id);

    return usuario.update(dadosValidados);
  }

  // Exclui um usuário existente
  public static async excluir(id: number): Promise<void> {
    const usuario = await UsuarioService.buscarPorId(id);
    await usuario.destroy();
  }

  // Regra de negócio: o e-mail não pode pertencer a outro usuário.
  // Na atualização, o próprio usuário (idAtual) é desconsiderado.
  private static async verificarEmailDisponivel(
    email: string,
    idAtual?: number,
  ): Promise<void> {
    const usuarioComEmail = await Usuario.findOne({ where: { email } });

    if (usuarioComEmail && usuarioComEmail.id !== idAtual) {
      throw new AppError('Já existe um usuário cadastrado com este e-mail.');
    }
  }

  // Validação do ID da rota: deve ser um número inteiro positivo
  private static validarId(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError('O ID informado deve ser um número inteiro positivo.');
    }
  }

  // Validação dos dados de entrada. Devolve os dados prontos para salvar:
  // textos sem espaços nas pontas, e-mail em minúsculas e valores padrão.
  private static validarDados(dados: UsuarioInput): UsuarioCreationAttributes {
    const { nome, email, telefone, dataNascimento, ativo } = dados;

    // nome: obrigatório, até 100 caracteres
    if (typeof nome !== 'string' || nome.trim() === '' || nome.length > 100) {
      throw new AppError(
        'O campo nome é obrigatório e deve ter até 100 caracteres.',
      );
    }

    // email: obrigatório, formato "algo@algo.algo", até 150 caracteres
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      typeof email !== 'string' ||
      !emailRegex.test(email.trim()) ||
      email.length > 150
    ) {
      throw new AppError(
        'O campo email é obrigatório e deve conter um e-mail válido.',
      );
    }

    // telefone: opcional; se enviado, texto de até 20 caracteres
    if (
      telefone !== undefined &&
      telefone !== null &&
      (typeof telefone !== 'string' ||
        telefone.trim() === '' ||
        telefone.length > 20)
    ) {
      throw new AppError(
        'O campo telefone deve ser um texto de até 20 caracteres.',
      );
    }

    // dataNascimento: opcional; se enviada, deve ser uma data real no formato AAAA-MM-DD
    if (
      dataNascimento !== undefined &&
      dataNascimento !== null &&
      !UsuarioService.dataValida(dataNascimento)
    ) {
      throw new AppError(
        'O campo dataNascimento deve ser uma data válida no formato AAAA-MM-DD.',
      );
    }

    // ativo: opcional; se enviado, deve ser true ou false
    if (ativo !== undefined && ativo !== null && typeof ativo !== 'boolean') {
      throw new AppError('O campo ativo deve ser verdadeiro ou falso.');
    }

    return {
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      telefone: telefone ? telefone.trim() : null,
      dataNascimento: dataNascimento ?? null,
      ativo: ativo ?? true,
    };
  }

  // Confere o formato AAAA-MM-DD e se a data existe no calendário
  // (o JavaScript aceitaria "2001-02-30" convertendo para 2 de março)
  private static dataValida(valor: unknown): boolean {
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      return false;
    }

    const data = new Date(`${valor}T00:00:00Z`);
    return !isNaN(data.getTime()) && data.toISOString().startsWith(valor);
  }

  // Para novas operações (ex.: buscar por e-mail, desativar usuário),
  // adicione métodos aqui e chame-os a partir do controller.
}
