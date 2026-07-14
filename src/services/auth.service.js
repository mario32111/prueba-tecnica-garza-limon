const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserService = require('./user.service');
const { config } = require('../config/config');

const userService = new UserService();

class AuthService {
  async getUser(email, password) {
    const user = await userService.findByEmail(email);
    if (!user) {
      throw new Error('invalid credentials');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('invalid credentials');
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
