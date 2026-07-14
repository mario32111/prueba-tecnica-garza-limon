'use strict';

const { VEHICLE_TABLE } = require('../models/vehicle.model');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(VEHICLE_TABLE, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      plate: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
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

    await queryInterface.addIndex(VEHICLE_TABLE, ['plate'], {
      name: 'idx_vehicles_plate',
      unique: true,
    });
    await queryInterface.addIndex(VEHICLE_TABLE, ['category_id'], {
      name: 'idx_vehicles_category',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable(VEHICLE_TABLE);
  },
};
