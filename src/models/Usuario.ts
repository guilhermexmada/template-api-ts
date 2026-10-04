import { DataTypes, Model, type Optional } from 'sequelize';
import { sequelize } from '../config/database.js';

// Interface que representa um registro da tabela "usuarios"
export interface UsuarioAttributes {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  dataNascimento: string | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Campos opcionais na criação: gerados pelo banco (id e datas) ou com valor padrão
export type UsuarioCreationAttributes = Optional<
  UsuarioAttributes,
  'id' | 'telefone' | 'dataNascimento' | 'ativo' | 'createdAt' | 'updatedAt'
>;

// "declare" informa os tipos ao TypeScript sem sobrescrever os getters do Sequelize
export class Usuario
  extends Model<UsuarioAttributes, UsuarioCreationAttributes>
  implements UsuarioAttributes
{
  declare id: number;
  declare nome: string;
  declare email: string;
  declare telefone: string | null;
  declare dataNascimento: string | null;
  declare ativo: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

// Mapeamento das colunas: deve refletir a migration da tabela
Usuario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    telefone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    dataNascimento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'usuarios',
    timestamps: true,
  },
);

// Para um novo model: copie este arquivo, ajuste interface, tipos e colunas,
// e crie a migration correspondente em src/migrations.
