'use strict';

const { USER_TABLE } = require('../models/user.model');
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const adminHash = await bcrypt.hash('admin123', 10);
    const employeeHash = await bcrypt.hash('employee123', 10);

    await queryInterface.bulkInsert(USER_TABLE, [
      {
        email: 'admin@parking.com',
        password_hash: adminHash,
        name: 'Administrador',
        role: 'admin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        email: 'employee@parking.com',
        password_hash: employeeHash,
        name: 'Empleado',
        role: 'employee',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(USER_TABLE, null, {});
  },
};
