'use strict';

const { CATEGORY_TABLE } = require('../models/category.model');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(CATEGORY_TABLE, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      price_per_minute: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
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

    await queryInterface.addIndex(CATEGORY_TABLE, ['name'], {
      name: 'idx_categories_name',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable(CATEGORY_TABLE);
  },
};
