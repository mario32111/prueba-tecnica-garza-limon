'use strict';

const { CATEGORY_TABLE } = require('../models/category.model');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(CATEGORY_TABLE, [
      {
        name: 'Oficial',
        description: 'Vehículos oficiales - No pagan, control de estancias',
        price_per_minute: 0.00,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Residente',
        description: 'Residentes - $1.00 MXN por minuto',
        price_per_minute: 1.00,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'No Residente',
        description: 'No Residentes - $3.00 MXN por minuto',
        price_per_minute: 3.00,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(CATEGORY_TABLE, null, {});
  },
};
