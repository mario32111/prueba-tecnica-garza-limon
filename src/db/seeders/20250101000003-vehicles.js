'use strict';

const { VEHICLE_TABLE } = require('../models/vehicle.model');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert(VEHICLE_TABLE, [
      {
        plate: 'ABC123',
        category_id: 2,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        plate: 'DEF456',
        category_id: 3,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        plate: 'GHI789',
        category_id: 1,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        plate: 'JKL012',
        category_id: 3,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        plate: 'MNO345',
        category_id: 2,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(VEHICLE_TABLE, null, {});
  },
};
