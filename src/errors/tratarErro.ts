import type { Response } from 'express';
import { AppError } from './AppError.js';

// Converte um erro capturado no controller em resposta HTTP:
// - AppError: erro previsto, usa o status e a mensagem definidos no service
// - Qualquer outro: falha inesperada (ex.: banco fora do ar), responde 500
export function tratarErro(
  res: Response,
  error: unknown,
  mensagemPadrao: string,
): Response {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ erro: error.message });
  }

  return res
    .status(500)
    .json({ erro: mensagemPadrao, detalhe: (error as Error).message });
}
