const AuthService = require('../services/auth.service');
const UserService = require('../services/user.service');
const bcrypt = require('bcrypt');

const authService = new AuthService();
const userService = new UserService();

class AuthController {
  async login(req, res, next) {
    try {
      const { user, token } = authService.signToken(req.user);
      res.json({ user, token });
    } catch (error) {
      next(error);
    }
  }

  async register(req, res, next) {
    try {
      const { email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await userService.create({ email, password: hashedPassword, role: 'user' });
      delete user.dataValues.password;
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  async renderLogin(req, res) {
    res.render('auth/login', { title: 'Iniciar Sesión' });
  }
}

module.exports = AuthController;
