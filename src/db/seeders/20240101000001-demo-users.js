'use strict';

const { USER_TABLE } = require('../models/user.model');
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const adminHash = await bcrypt.hash('admin123', 10);
    const userHash = await bcrypt.hash('user123', 10);

    await queryInterface.bulkInsert(USER_TABLE, [
      {
        email: 'admin@test.com',
        password: adminHash,
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        email: 'user@test.com',
        password: userHash,
        role: 'user',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(USER_TABLE, null, {});
  },
};
