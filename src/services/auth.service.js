const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const boom = require('@hapi/boom');
const UserService = require('./user.service');
const { config } = require('../config/config');

const userService = new UserService();

class AuthService {
  async getUser(email, password) {
    const user = await userService.findByEmail(email);
    if (!user) {
      throw boom.unauthorized('Invalid email or password');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw boom.unauthorized('Invalid email or password');
    }
    delete user.dataValues.password;
    return user;
  }

  async signToken(user) {
    const payload = {
      sub: user.id,
      role: user.role,
    };
    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: '24h',
    });
    return { user, token };
  }
}

module.exports = AuthService;
