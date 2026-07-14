'use strict';

const { USER_TABLE } = require('../models/user.model');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(USER_TABLE, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      role: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'employee',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.sequelize.query(
      `ALTER TABLE ${USER_TABLE} ADD CONSTRAINT ck_users_role CHECK (role IN ('admin', 'employee'))`
    );

    await queryInterface.addIndex(USER_TABLE, ['email'], {
      name: 'idx_users_email',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable(USER_TABLE);
  },
};
