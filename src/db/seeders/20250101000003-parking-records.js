'use strict';

const { PARKING_RECORD_TABLE } = require('../models/parking-record.model');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const minutesAgo = (min) => new Date(now.getTime() - min * 60000);

    await queryInterface.bulkInsert(PARKING_RECORD_TABLE, [
      {
        plate: 'ABC123',
        category_id: 2, // Residente
        registered_by: 2, // employee
        status: 'completed',
        entry_time: minutesAgo(120),
        exit_time: minutesAgo(30),
        total_minutes: 90,
        total_cost: 90.00,
        created_at: now,
        updated_at: now,
      },
      {
        plate: 'DEF456',
        category_id: 3, // No Residente
        registered_by: 1, // admin
        status: 'completed',
        entry_time: minutesAgo(180),
        exit_time: minutesAgo(60),
        total_minutes: 120,
        total_cost: 360.00,
        created_at: now,
        updated_at: now,
      },
      {
        plate: 'GHI789',
        category_id: 1, // Oficial
        registered_by: 2, // employee
        status: 'completed',
        entry_time: minutesAgo(240),
        exit_time: minutesAgo(120),
        total_minutes: 120,
        total_cost: 0.00,
        created_at: now,
        updated_at: now,
      },
      {
        plate: 'JKL012',
        category_id: 3, // No Residente
        registered_by: 1, // admin
        status: 'active',
        entry_time: minutesAgo(15),
        exit_time: null,
        total_minutes: null,
        total_cost: null,
        created_at: now,
        updated_at: now,
      },
      {
        plate: 'MNO345',
        category_id: 2, // Residente
        registered_by: 2, // employee
        status: 'completed',
        entry_time: minutesAgo(300),
        exit_time: minutesAgo(15),
        total_minutes: 285,
        total_cost: 285.00,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(PARKING_RECORD_TABLE, null, {});
  },
};
