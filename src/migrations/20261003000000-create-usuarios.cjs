'use strict';

// Migration que cria a tabela "usuarios".
// O sequelize-cli só entende CommonJS, por isso as migrations usam a extensão .cjs.
// Para criar uma nova tabela, copie este arquivo com um timestamp maior no nome.

module.exports = {
  // up: executado por "pnpm db:migrate"
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usuarios', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      nome: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true,
      },
      telefone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      dataNascimento: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      ativo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
  },

  // down: executado por "pnpm db:migrate:undo" (desfaz o que o up criou)
  async down(queryInterface) {
    await queryInterface.dropTable('usuarios');
  },
};
