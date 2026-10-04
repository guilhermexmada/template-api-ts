// Erro previsto pela aplicação (dado inválido, registro não encontrado etc.).
// O service lança este erro informando o status HTTP que o controller deve devolver.
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}
