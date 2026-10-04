import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // Regras recomendadas para JavaScript e TypeScript
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Desativa regras de estilo que conflitam com o Prettier
  prettierConfig,

  {
    // Variáveis globais do Node.js (process, console etc.)
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  {
    // Arquivos ignorados: build, dependências e arquivos CommonJS do sequelize-cli
    ignores: [
      'dist/**',
      'node_modules/**',
      '.sequelizerc',
      'src/config/config.cjs',
      'src/migrations/**',
    ],
  },

  {
    rules: {
      'no-console': 'off',
      // Proíbe o uso de "any" para manter a tipagem estrita
      '@typescript-eslint/no-explicit-any': 'error',
      // Parâmetros iniciados com "_" podem ficar sem uso
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
);
