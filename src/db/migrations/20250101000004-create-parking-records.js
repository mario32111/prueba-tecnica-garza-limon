'use strict';

const { PARKING_RECORD_TABLE } = require('../models/parking-record.model');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(PARKING_RECORD_TABLE, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      plate: {
        type: Sequelize.STRING(20),
        allowNull: false,
        references: {
          model: 'vehicles',
          key: 'plate',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT',
      },
      entry_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      exit_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      total_minutes: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      total_cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
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
      registered_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'active',
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
      `ALTER TABLE ${PARKING_RECORD_TABLE} ADD CONSTRAINT ck_parking_status CHECK (status IN ('active', 'completed'))`
    );

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX idx_parking_active_plate
      ON ${PARKING_RECORD_TABLE} (plate)
      WHERE status = 'active'
    `);

    await queryInterface.addIndex(PARKING_RECORD_TABLE, ['entry_time'], {
      name: 'idx_parking_entry_time',
    });
    await queryInterface.addIndex(PARKING_RECORD_TABLE, ['category_id'], {
      name: 'idx_parking_category',
    });
    await queryInterface.addIndex(PARKING_RECORD_TABLE, ['status'], {
      name: 'idx_parking_status',
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS idx_parking_active_plate`);
    await queryInterface.removeIndex(PARKING_RECORD_TABLE, 'idx_parking_status');
    await queryInterface.removeIndex(PARKING_RECORD_TABLE, 'idx_parking_category');
    await queryInterface.removeIndex(PARKING_RECORD_TABLE, 'idx_parking_entry_time');
    await queryInterface.dropTable(PARKING_RECORD_TABLE);
  },
};
