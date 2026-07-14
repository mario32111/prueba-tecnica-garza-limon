const boom = require('@hapi/boom');
const bcrypt = require('bcrypt');
const { models } = require('../libs/sequelize');

class UserService {
  async find() {
    const users = await models.User.findAll({
      attributes: { exclude: ['password'] },
    });
    return users;
  }

  async findOne(id) {
    const user = await models.User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });
    if (!user) {
      throw boom.notFound('user not found');
    }
    return user;
  }

  async findByEmail(email) {
    const user = await models.User.findOne({ where: { email } });
    if (!user) {
      throw boom.notFound('user not found');
    }
    return user;
  }

  async create(data) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await models.User.create({
      ...data,
      password: hashedPassword,
    });
    delete user.dataValues.password;
    return user;
  }

  async update(id, changes) {
    const user = await this.findOne(id);
    if (changes.password) {
      changes.password = await bcrypt.hash(changes.password, 10);
    }
    const updatedUser = await user.update(changes);
    delete updatedUser.dataValues.password;
    return updatedUser;
  }

  async delete(id) {
    const user = await this.findOne(id);
    await user.destroy();
    return { id };
  }
}

module.exports = UserService;
